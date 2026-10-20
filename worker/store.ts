// The store on Cloudflare (/api/store/*): the catalogue with the store's own
// prices and stock, cash-on-delivery orders, order tracking and cancelling,
// price and book requests, and the store admin. Orders, requests and the
// store's changes to products live in D1 (tables below; the same SQL is in
// migrations/0002_store.sql, and the tables are also created on first use).
//
// Variables (Workers & Pages > aethex > Settings > Variables and Secrets):
//   ADMIN_EMAILS  accounts that may open aethex.in/admin, comma-separated
//   STORE_EMAIL   where new orders and requests are emailed
//                 (default: the first ADMIN_EMAILS address, else the support address)
// Order and request emails go out through Brevo, like the sign-in codes.
import catalogJson from "../artifacts/aethex/src/data/store/catalog.json";
import type { Address, CartLine, Catalog, EnquiryKind, Order, OrderStatus, Override, PricedLine, Product, Quote } from "../artifacts/aethex/src/lib/store/types";
import {
  applyOverride, cancellable, COD_LIMIT, INDIAN_STATES, normPhone, ORDER_STATUSES, quoteLines, round2, STATUS_LABEL, summarize, validEmail, validPincode,
} from "../artifacts/aethex/src/lib/store/rules";
import { BUSINESS, SITE_URL, launchGaps } from "../artifacts/aethex/src/config/business";
import { allow, clientIp, currentUser, escapeHtml, normEmail, sendEmail, sha256, shell, type AuthEnv, type D1Like } from "./auth";

export interface StoreEnv extends AuthEnv {
  ADMIN_EMAILS?: string;
  STORE_EMAIL?: string;
}
type DBEnv = StoreEnv & { DB: D1Like };

const catalog = catalogJson as unknown as Catalog;
const byId = new Map<number, Product>(catalog.products.map((p) => [p.id, p]));
const bySlug = new Map<string, Product>(catalog.products.map((p) => [p.slug, p]));

const json = (payload: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });
// Browsers check back every time (the site keeps its own copy for a few minutes), so a price
// set in the admin reaches checkout at once.
const CACHED = { "cache-control": "public, no-cache" };

async function readJson(request: Request, max = 32_768): Promise<Record<string, any> | null> {
  const text = await request.text().catch(() => "");
  if (!text || text.length > max) return null;
  try { const v = JSON.parse(text); return v && typeof v === "object" && !Array.isArray(v) ? v : null; } catch { return null; }
}
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const longStr = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max) : "");
const money = (n: number) => `&#8377;${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const rupees = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ------------------------------------------------------------------ tables */

export const STORE_TABLES = [
  `CREATE TABLE IF NOT EXISTS store_orders (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, status TEXT NOT NULL,
    user_id TEXT, email TEXT, phone TEXT NOT NULL, name TEXT NOT NULL, pincode TEXT NOT NULL, address TEXT NOT NULL,
    lines TEXT NOT NULL, item_count INTEGER NOT NULL, subtotal REAL NOT NULL, mrp_total REAL NOT NULL, delivery REAL NOT NULL, total REAL NOT NULL,
    payment TEXT NOT NULL DEFAULT 'cod', history TEXT NOT NULL, tracking TEXT, notes TEXT, admin_note TEXT, token_hash TEXT NOT NULL, ip TEXT)`,
  "CREATE INDEX IF NOT EXISTS store_orders_created ON store_orders(created_at)",
  "CREATE INDEX IF NOT EXISTS store_orders_user ON store_orders(user_id)",
  "CREATE INDEX IF NOT EXISTS store_orders_email ON store_orders(email)",
  "CREATE INDEX IF NOT EXISTS store_orders_phone ON store_orders(phone)",
  `CREATE TABLE IF NOT EXISTS store_enquiries (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, kind TEXT NOT NULL, product_id INTEGER, variant_id TEXT, item TEXT,
    name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, city TEXT, qty INTEGER, message TEXT,
    status TEXT NOT NULL DEFAULT 'new', note TEXT, user_id TEXT, ip TEXT)`,
  "CREATE INDEX IF NOT EXISTS store_enquiries_created ON store_enquiries(created_at)",
  "CREATE TABLE IF NOT EXISTS store_overrides (product_id INTEGER PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT)",
];
let tablesReady: Promise<void> | null = null;
function ensureTables(db: D1Like): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => { for (const sql of STORE_TABLES) await db.prepare(sql).run(); })().catch((e) => { tablesReady = null; throw e; });
  }
  return tablesReady;
}

/* ------------------------------------------------------------------ the catalogue, with the store's changes */

let overrideCache: { at: number; stamp: string; map: Map<number, Override> } | null = null;
async function overrides(env: StoreEnv): Promise<{ stamp: string; map: Map<number, Override> }> {
  if (!env.DB) return { stamp: "", map: new Map() };
  if (overrideCache && Date.now() - overrideCache.at < 30_000) return overrideCache;
  await ensureTables(env.DB);
  const { results } = await env.DB.prepare("SELECT product_id, data, updated_at FROM store_overrides").all<{ product_id: number; data: string; updated_at: number }>();
  const map = new Map<number, Override>();
  let latest = 0;
  for (const r of results) {
    try { map.set(Number(r.product_id), JSON.parse(r.data)); latest = Math.max(latest, Number(r.updated_at) || 0); } catch { /* skip a bad row */ }
  }
  overrideCache = { at: Date.now(), stamp: map.size ? `${map.size}.${latest}` : "", map };
  return overrideCache;
}
const forgetOverrides = () => { overrideCache = null; summaryCache = null; };

async function finder(env: StoreEnv) {
  const { map } = await overrides(env);
  return (id: number) => { const p = byId.get(id); return p ? applyOverride(p, map.get(id)) : null; };
}

let summaryCache: { stamp: string; body: string } | null = null;
async function catalogSummary(env: StoreEnv): Promise<string> {
  const { stamp, map } = await overrides(env);
  if (summaryCache && summaryCache.stamp === stamp) return summaryCache.body;
  const products = [];
  for (const p of catalog.products) {
    const q = applyOverride(p, map.get(p.id));
    if (q) products.push(summarize(q));
  }
  const count = (key: "brand" | "category", v: string) => products.filter((p) => p[key] === v).length;
  const body = JSON.stringify({
    version: stamp ? `${catalog.version}.${stamp}` : catalog.version,
    brands: catalog.brands.map((b) => ({ ...b, count: count("brand", b.slug) })),
    categories: catalog.categories.map((c) => ({ ...c, count: count("category", c.slug) })),
    products,
  });
  summaryCache = { stamp, body };
  return body;
}

/* ------------------------------------------------------------------ orders */

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function orderId(): string {
  const d = new Date(Date.now() + 5.5 * 3600_000); // India time for the date part
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const r = crypto.getRandomValues(new Uint8Array(6));
  return `AX${ymd}-${Array.from(r, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}
const cleanOrderId = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
const newToken = () => { const b = crypto.getRandomValues(new Uint8Array(24)); return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };

type OrderRow = {
  id: string; created_at: number; updated_at: number; status: string; user_id: string | null; email: string | null; phone: string; name: string;
  pincode: string; address: string; lines: string; item_count: number; subtotal: number; mrp_total: number; delivery: number; total: number;
  payment: string; history: string; tracking: string | null; notes: string | null; admin_note: string | null; token_hash: string; ip: string | null;
};
const parse = <T>(s: string | null, fallback: T): T => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };

function toOrder(r: OrderRow): Order {
  const o: Order = {
    id: r.id, createdAt: r.created_at, status: r.status as OrderStatus, payment: "cod",
    address: parse<Address>(r.address, { name: r.name, phone: r.phone, line1: "", city: "", state: "", pincode: r.pincode }),
    lines: parse<PricedLine[]>(r.lines, []), subtotal: r.subtotal, mrpTotal: r.mrp_total, delivery: r.delivery, total: r.total,
    history: parse(r.history, []),
  };
  const t = parse<Order["tracking"] | null>(r.tracking, null);
  if (t) o.tracking = t;
  if (r.notes) o.notes = r.notes;
  return o;
}

/** What the customer sees. Looked up with the order number and phone alone, the address is shortened. */
function customerView(r: OrderRow, full: boolean) {
  const o = toOrder(r);
  if (!full) {
    const a = o.address;
    o.address = { name: a.name, phone: `••••••${a.phone.slice(-4)}`, line1: "", city: a.city, state: a.state, pincode: a.pincode };
  }
  return { ...o, canCancel: cancellable(o.status) };
}

function cleanAddress(raw: unknown): { address: Address } | { error: string } {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = str(a.name, 80);
  const phone = normPhone(a.phone);
  const email = normEmail(a.email).slice(0, 254);
  const line1 = str(a.line1, 160);
  const line2 = str(a.line2, 160);
  const landmark = str(a.landmark, 100);
  const city = str(a.city, 60);
  const state = INDIAN_STATES.find((s) => s.toLowerCase() === str(a.state, 60).toLowerCase()) ?? "";
  const pincode = str(a.pincode, 6);
  if (name.length < 2) return { error: "Please enter the name of the person receiving the order." };
  if (!phone) return { error: "Please enter a 10-digit Indian mobile number." };
  if (email && !validEmail(email)) return { error: "That email address doesn't look right." };
  if (line1.length < 4) return { error: "Please enter the house, flat or building and street." };
  if (city.length < 2) return { error: "Please enter the town or city." };
  if (!state) return { error: "Please choose the state." };
  if (!validPincode(pincode)) return { error: "Please enter a 6-digit PIN code." };
  const address: Address = { name, phone, line1, city, state, pincode };
  if (email) address.email = email;
  if (line2) address.line2 = line2;
  if (landmark) address.landmark = landmark;
  return { address };
}

const addressHtml = (a: Address) =>
  [a.name, a.line1, a.line2, a.landmark ? `Near ${a.landmark}` : "", `${a.city}, ${a.state} ${a.pincode}`, `Phone ${a.phone}`].filter(Boolean).map(escapeHtml).join("<br>");

function linesHtml(o: Order) {
  const rows = o.lines.map((l) => `<tr><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;">${escapeHtml(l.name)}${l.variantLabel ? `<br><span style="color:#718096;font-size:12px;">${escapeHtml(l.variantLabel)}</span>` : ""}</td><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;color:#718096;text-align:center;">&times;${l.qty}</td><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;text-align:right;">${money(l.lineTotal)}</td></tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:6px 0 10px;">${rows}</table>
<table style="width:100%;border-collapse:collapse;font-size:14px;"><tr><td style="padding:3px 0;color:#4A5568;">Items</td><td style="text-align:right;">${money(o.subtotal)}</td></tr>
<tr><td style="padding:3px 0;color:#4A5568;">Delivery</td><td style="text-align:right;">${o.delivery ? money(o.delivery) : "Free"}</td></tr>
<tr><td style="padding:6px 0;font-weight:700;">Total (cash on delivery)</td><td style="text-align:right;font-weight:700;">${money(o.total)}</td></tr></table>`;
}

const button = (href: string, label: string) => `<p style="text-align:center;margin:22px 0 0;"><a href="${href}" style="display:inline-block;background:#1F3F7A;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;">${label}</a></p>`;
const signoff = () => `<p style="color:#718096;font-size:12px;margin-top:22px;line-height:1.5;">${escapeHtml(BUSINESS.legalName)}${BUSINESS.gstin ? ` · GSTIN ${escapeHtml(BUSINESS.gstin)}` : ""}<br>Questions? Reply to this email or write to ${escapeHtml(BUSINESS.email)}${BUSINESS.phone ? ` · ${escapeHtml(BUSINESS.phone)}` : ""}.</p>`;
const trackUrl = (id: string) => `${SITE_URL}/orders/track?order=${encodeURIComponent(id)}`;

function customerEmail(o: Order, kind: "placed" | OrderStatus, note?: string) {
  const first = escapeHtml(o.address.name.split(" ")[0] || o.address.name);
  const heads: Record<string, [string, string]> = {
    placed: [`Thank you, ${first}. Your order is placed`, `We'll confirm it shortly and ship it ${escapeHtml(BUSINESS.dispatch)}. Please keep ${money(o.total)} ready to pay in cash when it arrives.`],
    confirmed: ["Your order is confirmed", `We're packing it now. It ships ${escapeHtml(BUSINESS.dispatch)}.`],
    shipped: ["Your order is on its way", `Delivery is ${escapeHtml(BUSINESS.delivery)}. Please keep ${money(o.total)} ready to pay in cash.`],
    delivered: ["Your order has been delivered", `Thank you for shopping with ${escapeHtml(BUSINESS.brand)}. If anything arrived damaged, defective or wrong, tell us within ${BUSINESS.replacementDays} days and we'll replace it.`],
    cancelled: ["Your order has been cancelled", "No payment is due. If you didn't ask for this, reply to this email and we'll help."],
  };
  const [h, p] = heads[kind] ?? heads.placed;
  const t = o.tracking;
  const tracking = kind === "shipped" && t && (t.courier || t.number)
    ? `<p style="margin:0 0 14px;font-size:14px;"><b>Courier:</b> ${escapeHtml(t.courier || "")} ${t.number ? `· <b>Tracking number:</b> ${escapeHtml(t.number)}` : ""}${t.url && /^https:\/\//.test(t.url) ? ` · <a href="${escapeHtml(t.url)}">Track with the courier</a>` : ""}</p>` : "";
  return shell(`<h2 style="margin:0 0 8px;font-size:20px;">${h}</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${p}</p>
${note ? `<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${escapeHtml(note)}</p>` : ""}
<p style="margin:14px 0 4px;font-size:13px;color:#718096;">Order <b style="color:#14213D;">${escapeHtml(o.id)}</b></p>
${tracking}${linesHtml(o)}
<p style="margin:14px 0 0;font-size:13px;color:#4A5568;line-height:1.5;"><b>Delivering to</b><br>${addressHtml(o.address)}</p>
${button(trackUrl(o.id), "Track your order")}${signoff()}`);
}

function storeInbox(env: StoreEnv): string {
  const admins = adminEmails(env);
  return normEmail(env.STORE_EMAIL) || admins[0] || BUSINESS.email;
}

/* ------------------------------------------------------------------ admin */

const adminEmails = (env: StoreEnv) => String(env.ADMIN_EMAILS || "").split(/[,;\s]+/).map(normEmail).filter(Boolean);

async function requireAdmin(request: Request, env: DBEnv): Promise<string | Response> {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Sign in to open the store admin.", signIn: true }, 401);
  const admins = adminEmails(env);
  if (!admins.length) return json({ error: "The store admin isn't switched on yet. Add your account's email to the ADMIN_EMAILS variable in Cloudflare.", setup: true }, 403);
  if (!admins.includes(normEmail(user.email))) return json({ error: "This account can't open the store admin." }, 403);
  return user.email;
}

const posMoney = (v: unknown): number | null | undefined => {
  if (v === null || v === "") return null;
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 1_000_000 ? round2(n) : undefined;
};

function cleanOverride(raw: Record<string, any>, p: Product): Override | { error: string } {
  const o: Override = {};
  if ("price" in raw) { const v = posMoney(raw.price); if (v === undefined) return { error: "Enter a price from ₹1, or leave it empty for price on request." }; o.price = v; }
  if ("mrp" in raw) { const v = posMoney(raw.mrp); if (v === undefined) return { error: "Enter an MRP from ₹1, or leave it empty." }; o.mrp = v; }
  if (typeof o.price === "number" && typeof o.mrp === "number" && o.mrp < o.price) return { error: "The MRP can't be lower than the selling price." };
  if (typeof raw.inStock === "boolean") o.inStock = raw.inStock;
  if (raw.hidden === true) o.hidden = true;
  const coo = str(raw.countryOfOrigin, 60);
  if (coo) o.countryOfOrigin = coo;
  if (raw.variants && typeof raw.variants === "object" && p.variants?.length) {
    const vs: NonNullable<Override["variants"]> = {};
    for (const v of p.variants) {
      const r = raw.variants[v.id];
      if (!r || typeof r !== "object") continue;
      const e: { price?: number | null; mrp?: number | null; inStock?: boolean } = {};
      if ("price" in r) { const x = posMoney(r.price); if (x === undefined) return { error: `Check the price of ${v.label}.` }; e.price = x; }
      if ("mrp" in r) { const x = posMoney(r.mrp); if (x === undefined) return { error: `Check the MRP of ${v.label}.` }; e.mrp = x; }
      if (typeof e.price === "number" && typeof e.mrp === "number" && e.mrp < e.price) return { error: `The MRP of ${v.label} can't be lower than its price.` };
      if (typeof r.inStock === "boolean") e.inStock = r.inStock;
      if (Object.keys(e).length) vs[v.id] = e;
    }
    if (Object.keys(vs).length) o.variants = vs;
  }
  return o;
}

const csvCell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function handleAdmin(request: Request, env: DBEnv, path: string): Promise<Response> {
  const who = await requireAdmin(request, env);
  if (who instanceof Response) return who;
  const url = new URL(request.url);
  const method = request.method;

  if (path === "me") return json({ ok: true, email: who });

  if (path === "summary" && method === "GET") {
    const dayStart = Date.now() - 86400_000;
    const byStatus = await env.DB.prepare("SELECT status, COUNT(*) AS n, SUM(total) AS total FROM store_orders GROUP BY status").all<{ status: string; n: number; total: number }>();
    const today = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(total) AS total FROM store_orders WHERE created_at > ?").bind(dayStart).first<{ n: number; total: number }>();
    const openEnq = await env.DB.prepare("SELECT COUNT(*) AS n FROM store_enquiries WHERE status = 'new'").first<{ n: number }>();
    const find = await finder(env);
    let priceOnRequest = 0, noOrigin = 0, hidden = 0, outOfStock = 0;
    for (const p of catalog.products) {
      const q = find(p.id);
      if (!q) { hidden++; continue; }
      if (q.priceOnRequest) priceOnRequest++;
      if (!q.countryOfOrigin) noOrigin++;
      if (!q.inStock) outOfStock++;
    }
    return json({
      orders: Object.fromEntries(byStatus.results.map((r) => [r.status, { count: r.n, total: round2(r.total || 0) }])),
      last24h: { count: today?.n || 0, total: round2(today?.total || 0) },
      openEnquiries: openEnq?.n || 0,
      catalog: { products: catalog.products.length, priceOnRequest, noOrigin, hidden, outOfStock },
      setup: { email: !!env.BREVO_API_KEY, storeEmail: storeInbox(env), admins: adminEmails(env).length, gaps: launchGaps() },
    });
  }

  if ((path === "orders" || path === "orders.csv") && method === "GET") {
    const status = str(url.searchParams.get("status"), 20);
    const q = str(url.searchParams.get("q"), 60);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const where: string[] = []; const args: unknown[] = [];
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) { where.push("status = ?"); args.push(status); }
    if (q) {
      const digits = q.replace(/\D/g, "");
      where.push("(id LIKE ? OR name LIKE ? OR email LIKE ?" + (digits.length >= 4 ? " OR phone LIKE ?" : "") + ")");
      args.push(`%${q.toUpperCase()}%`, `%${q}%`, `%${q.toLowerCase()}%`);
      if (digits.length >= 4) args.push(`%${digits}%`);
    }
    const sql = `SELECT * FROM store_orders${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const { results } = await env.DB.prepare(sql).bind(...args, path === "orders.csv" ? 5000 : limit, path === "orders.csv" ? 0 : offset).all<OrderRow>();
    if (path === "orders.csv") {
      const head = ["Order", "Placed (IST)", "Status", "Name", "Phone", "Email", "Address", "City", "State", "PIN", "Items", "Item count", "Subtotal", "Delivery", "Total (COD)", "Courier", "Tracking number", "Customer note", "Admin note"];
      const rows = results.map((r) => {
        const o = toOrder(r); const a = o.address;
        const ist = new Date(r.created_at + 5.5 * 3600_000).toISOString().replace("T", " ").slice(0, 16);
        return [o.id, ist, o.status, a.name, a.phone, a.email || "", [a.line1, a.line2, a.landmark].filter(Boolean).join(", "), a.city, a.state, a.pincode,
          o.lines.map((l) => `${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} x${l.qty}`).join("; "), r.item_count, o.subtotal, o.delivery, o.total,
          o.tracking?.courier || "", o.tracking?.number || "", o.notes || "", r.admin_note || ""].map(csvCell).join(",");
      });
      return new Response(`﻿${head.join(",")}\n${rows.join("\n")}\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="aethex-orders-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
    }
    return json({ orders: results.map((r) => ({ ...toOrder(r), userId: r.user_id, adminNote: r.admin_note || "", updatedAt: r.updated_at })) });
  }

  const om = /^orders\/([A-Z0-9-]{6,20})$/.exec(path);
  if (om && method === "PATCH") {
    const r = await env.DB.prepare("SELECT * FROM store_orders WHERE id = ?").bind(om[1]).first<OrderRow>();
    if (!r) return json({ error: "No such order." }, 404);
    const b = await readJson(request);
    if (!b) return json({ error: "Send the changes as JSON." }, 400);
    const o = toOrder(r);
    const now = Date.now();
    let changed = false;
    const status = str(b.status, 20) as OrderStatus;
    const note = str(b.note, 300);
    if (b.tracking && typeof b.tracking === "object") {
      const t = { courier: str(b.tracking.courier, 60), number: str(b.tracking.number, 60), url: /^https:\/\//.test(str(b.tracking.url, 300)) ? str(b.tracking.url, 300) : "" };
      o.tracking = Object.fromEntries(Object.entries(t).filter(([, v]) => v));
      changed = true;
    }
    let notify: OrderStatus | null = null;
    if (status && status !== o.status) {
      if (!(ORDER_STATUSES as readonly string[]).includes(status)) return json({ error: "Unknown status." }, 400);
      if (o.status === "cancelled" || o.status === "delivered") return json({ error: `This order is already ${o.status}.` }, 409);
      o.status = status;
      o.history.push({ status, at: now, ...(note ? { note } : {}) });
      notify = status;
      changed = true;
    }
    const adminNote = typeof b.adminNote === "string" ? longStr(b.adminNote, 1000) : r.admin_note;
    if (adminNote !== r.admin_note) changed = true;
    if (!changed) return json({ order: { ...o, adminNote: r.admin_note || "" } });
    await env.DB.prepare("UPDATE store_orders SET status = ?, history = ?, tracking = ?, admin_note = ?, updated_at = ? WHERE id = ?")
      .bind(o.status, JSON.stringify(o.history), o.tracking ? JSON.stringify(o.tracking) : null, adminNote || null, now, o.id).run();
    let emailed = false;
    if (notify && o.address.email && b.notify !== false) {
      emailed = await sendEmail(env, o.address.email, `${STATUS_LABEL[notify]}: order ${o.id}`, customerEmail(o, notify, note || undefined)).catch(() => false);
    }
    return json({ order: { ...o, adminNote: adminNote || "" }, emailed });
  }

  if (path === "enquiries" && method === "GET") {
    const status = str(url.searchParams.get("status"), 20);
    const { results } = await env.DB.prepare(`SELECT * FROM store_enquiries${status ? " WHERE status = ?" : ""} ORDER BY created_at DESC LIMIT 200`).bind(...(status ? [status] : [])).all<Record<string, unknown>>();
    return json({ enquiries: results.map((e) => ({ ...e, product: e.product_id ? (() => { const p = byId.get(Number(e.product_id)); return p ? { id: p.id, slug: p.slug, name: p.name, brand: p.brand } : null; })() : null })) });
  }
  const em = /^enquiries\/([A-Z0-9-]{6,20})$/.exec(path);
  if (em && method === "PATCH") {
    const b = await readJson(request);
    const status = str(b?.status, 20);
    if (!["new", "contacted", "closed"].includes(status)) return json({ error: "Status must be new, contacted or closed." }, 400);
    await env.DB.prepare("UPDATE store_enquiries SET status = ?, note = ? WHERE id = ?").bind(status, longStr(b?.note, 600) || null, em[1]).run();
    return json({ ok: true });
  }

  if (path === "overrides" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT product_id, data, updated_at, updated_by FROM store_overrides").all<{ product_id: number; data: string; updated_at: number; updated_by: string }>();
    return json({ overrides: Object.fromEntries(results.map((r) => [r.product_id, { ...parse<Override>(r.data, {}), updatedAt: r.updated_at, updatedBy: r.updated_by }])) });
  }
  const pm = /^overrides\/(\d{1,7})$/.exec(path);
  if (pm && method === "PUT") {
    const p = byId.get(Number(pm[1]));
    if (!p) return json({ error: "No such product." }, 404);
    const b = await readJson(request);
    if (!b) return json({ error: "Send the changes as JSON." }, 400);
    const o = cleanOverride(b, p);
    if ("error" in o) return json(o, 400);
    if (!Object.keys(o).length) await env.DB.prepare("DELETE FROM store_overrides WHERE product_id = ?").bind(p.id).run();
    else await env.DB.prepare("INSERT INTO store_overrides (product_id, data, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(product_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
      .bind(p.id, JSON.stringify(o), Date.now(), who).run();
    forgetOverrides();
    const q = applyOverride(p, o);
    return json({ ok: true, override: o, product: q ? summarize(q) : null });
  }

  return json({ error: "Not found" }, 404);
}

/* ------------------------------------------------------------------ requests (price, books, bulk) */

const KINDS: EnquiryKind[] = ["price", "book", "bulk", "general"];

async function createEnquiry(request: Request, env: DBEnv): Promise<Response> {
  const b = await readJson(request);
  if (!b) return json({ error: "Please fill in the form." }, 400);
  if (str(b.website, 100)) return json({ ok: true, id: "AXQ-OK" }); // a field people never see: bots fill it
  const kind = (KINDS.includes(b.kind) ? b.kind : "general") as EnquiryKind;
  const name = str(b.name, 80);
  const phone = normPhone(b.phone);
  const email = normEmail(b.email).slice(0, 254);
  const city = str(b.city, 60);
  const qty = Math.max(1, Math.min(9999, Math.trunc(Number(b.qty)) || 1));
  const message = longStr(b.message, 1000);
  const p = Number.isFinite(Number(b.productId)) ? byId.get(Number(b.productId)) : undefined;
  const variant = p?.variants?.find((v) => v.id === b.variantId);
  const item = p ? `${catalog.brands.find((x) => x.slug === p.brand)?.name ?? p.brand} ${p.name}${variant ? ` (${variant.label})` : ""}` : str(b.item, 200);
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!phone) return json({ error: "Please enter a 10-digit Indian mobile number." }, 400);
  if (email && !validEmail(email)) return json({ error: "That email address doesn't look right." }, 400);
  if (!item && kind !== "general" && !message) return json({ error: "Tell us which product you need." }, 400);
  const ip = clientIp(request);
  if (!(await allow(env, `store:enq:ip:${ip}`, 8, 3600_000)) || !(await allow(env, `store:enq:phone:${phone}`, 6, 86400_000))) {
    return json({ error: "We've received several requests from you already. We'll be in touch soon." }, 429);
  }
  const user = await currentUser(request, env).catch(() => null);
  const id = `AXQ-${orderId().slice(2)}`;
  await env.DB.prepare("INSERT INTO store_enquiries (id, created_at, kind, product_id, variant_id, item, name, phone, email, city, qty, message, status, user_id, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)")
    .bind(id, Date.now(), kind, p?.id ?? null, variant?.id ?? null, item || null, name, phone, email || null, city || null, qty, message || null, user?.id ?? null, ip).run();
  const what = { price: "Price request", book: "Book request", bulk: "Bulk order request", general: "Question" }[kind];
  const productUrl = p ? `${SITE_URL}/products/${p.slug}` : "";
  await Promise.allSettled([
    sendEmail(env, storeInbox(env), `${what}: ${item || name} (${id})`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">${what}</h2>
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;"><b>${escapeHtml(item || "General question")}</b>${productUrl ? ` · <a href="${productUrl}">product page</a>` : ""}<br>Quantity: ${qty}</p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;">${escapeHtml(name)} · ${escapeHtml(phone)}${email ? ` · ${escapeHtml(email)}` : ""}${city ? ` · ${escapeHtml(city)}` : ""}</p>
${message ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>` : ""}
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
    email ? sendEmail(env, email, `We've got your request (${id})`, shell(`<h2 style="margin:0 0 8px;font-size:20px;">Thanks, ${escapeHtml(name.split(" ")[0])}. We've got your request</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${kind === "price" || kind === "bulk" ? "We'll send you the price and availability" : kind === "book" ? "We'll confirm the edition, price and availability" : "We'll get back to you"} on ${escapeHtml(phone)}${email ? " or by email" : ""}, usually within one business day.</p>
<p style="margin:12px 0 0;font-size:14px;"><b>${escapeHtml(item || "Your question")}</b>${kind !== "general" ? ` · quantity ${qty}` : ""}</p>${signoff()}`)) : Promise.resolve(false),
  ]);
  return json({ ok: true, id }, 201);
}

/* ------------------------------------------------------------------ the contact form */

const TOPICS = ["An order", "A product", "Returns or replacement", "Bulk or institutional purchase", "Cadus AI", "Study Hub", "Something else"];

async function createContact(request: Request, env: DBEnv): Promise<Response> {
  const b = await readJson(request);
  if (!b) return json({ error: "Please fill in the form." }, 400);
  if (str(b.website, 100)) return json({ ok: true, id: "AXQ-OK" });
  const name = str(b.name, 80);
  const email = normEmail(b.email).slice(0, 254);
  const phone = b.phone ? normPhone(b.phone) : "";
  const topic = TOPICS.includes(str(b.topic, 60)) ? str(b.topic, 60) : "Something else";
  const order = cleanOrderId(b.order);
  const message = longStr(b.message, 3000);
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!validEmail(email)) return json({ error: "Please enter your email address, so we can reply." }, 400);
  if (b.phone && !phone) return json({ error: "That mobile number doesn't look right. Use 10 digits, or leave it empty." }, 400);
  if (message.length < 10) return json({ error: "Please tell us a little more (at least a sentence)." }, 400);
  const ip = clientIp(request);
  if (!(await allow(env, `store:contact:ip:${ip}`, 6, 3600_000)) || !(await allow(env, `store:contact:email:${email}`, 6, 86400_000))) {
    return json({ error: "We've received several messages from you already. We'll reply soon." }, 429);
  }
  const user = await currentUser(request, env).catch(() => null);
  const id = `AXQ-${orderId().slice(2)}`;
  const item = `${topic}${order ? ` · order ${order}` : ""}`;
  await env.DB.prepare("INSERT INTO store_enquiries (id, created_at, kind, item, name, phone, email, message, status, user_id, ip) VALUES (?, ?, 'general', ?, ?, ?, ?, ?, 'new', ?, ?)")
    .bind(id, Date.now(), item, name, phone, email, message, user?.id ?? null, ip).run();
  await Promise.allSettled([
    sendEmail(env, storeInbox(env), `Contact: ${item} from ${name} (${id})`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">${escapeHtml(item)}</h2>
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;">${escapeHtml(name)} · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>${phone ? ` · ${escapeHtml(phone)}` : ""}</p>
<p style="margin:10px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
    sendEmail(env, email, `We've got your message (${id})`, shell(`<h2 style="margin:0 0 8px;font-size:20px;">Thanks, ${escapeHtml(name.split(" ")[0])}. We've got your message</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">We reply by email, usually within one business day. Your reference is <b>${id}</b>.</p>
<p style="margin:12px 0 0;font-size:14px;color:#4A5568;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message.slice(0, 600))}${message.length > 600 ? "…" : ""}</p>${signoff()}`)),
  ]);
  return json({ ok: true, id }, 201);
}

/* ------------------------------------------------------------------ the router */

export async function handleStore(request: Request, env: StoreEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/store\/?/, "").replace(/\/+$/, "");
  const method = request.method;

  // The catalogue works without the database (the store's own prices then don't apply).
  if (path === "catalog" && method === "GET") {
    try {
      return new Response(await catalogSummary(env), { headers: { "content-type": "application/json", ...CACHED } });
    } catch (e) {
      console.error("store catalog", e);
      return new Response(await catalogSummary({ ...env, DB: undefined }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
  }
  const pp = /^products\/([a-z0-9-]{1,120})$/.exec(path);
  if (pp && method === "GET") {
    const key = pp[1];
    const base = /^\d+$/.test(key) ? byId.get(Number(key)) : bySlug.get(key);
    if (!base) return json({ error: "Product not found" }, 404);
    const { map } = await overrides(env).catch(() => ({ map: new Map<number, Override>() }));
    const p = applyOverride(base, map.get(base.id));
    if (!p) return json({ error: "Product not found" }, 404);
    return json(p, 200, CACHED);
  }
  if (path === "quote" && method === "POST") {
    const b = await readJson(request);
    const quote = quoteLines(Array.isArray(b?.lines) ? (b!.lines as CartLine[]) : [], await finder(env).catch(() => (id: number) => byId.get(id) ?? null));
    return json({ ...quote, codAvailable: quote.total <= COD_LIMIT, codLimit: COD_LIMIT });
  }

  if (!env.DB) return json({ error: "The store's database isn't set up on the server yet (D1 binding DB)." }, 503);
  const db = env as DBEnv;
  await ensureTables(db.DB);

  if (path.startsWith("admin/") || path === "admin") return handleAdmin(request, db, path.replace(/^admin\/?/, ""));

  if (path === "enquiries" && method === "POST") return createEnquiry(request, db);
  if (path === "contact" && method === "POST") return createContact(request, db);

  if (path === "orders" && method === "POST") {
    const b = await readJson(request);
    if (!b) return json({ error: "Please fill in your delivery details." }, 400);
    const cleaned = cleanAddress(b.address);
    if ("error" in cleaned) return json({ error: cleaned.error, field: "address" }, 400);
    const address = cleaned.address;
    const quote: Quote = quoteLines(Array.isArray(b.lines) ? (b.lines as CartLine[]) : [], await finder(db));
    if (quote.issues.length) return json({ error: "Some items in your cart can't be ordered right now. Please review your cart.", quote }, 409);
    if (!quote.lines.length) return json({ error: "Your cart is empty." }, 400);
    if (typeof b.expectTotal === "number" && Math.abs(b.expectTotal - quote.total) >= 1) return json({ error: "Prices in your cart have changed. Please check the new total.", quote }, 409);
    if (quote.total > COD_LIMIT) return json({ error: `Cash on delivery is available on orders up to ₹${COD_LIMIT.toLocaleString("en-IN")}. Please split the order, or contact us.` }, 400);
    const ip = clientIp(request);
    if (!(await allow(db, `store:order:ip:${ip}`, 8, 3600_000)) || !(await allow(db, `store:order:phone:${address.phone}`, 6, 86400_000))) {
      return json({ error: "Too many orders in a short time. Please try again later, or contact us." }, 429);
    }
    const user = await currentUser(request, db).catch(() => null);
    const token = newToken();
    const now = Date.now();
    const order: Order = {
      id: orderId(), createdAt: now, status: "placed", payment: "cod", address, lines: quote.lines,
      subtotal: quote.subtotal, mrpTotal: quote.mrpTotal, delivery: quote.delivery, total: quote.total,
      history: [{ status: "placed", at: now }],
    };
    const notes = longStr(b.notes, 500);
    if (notes) order.notes = notes;
    const email = address.email || (user ? normEmail(user.email) : "");
    await db.DB.prepare(`INSERT INTO store_orders (id, created_at, updated_at, status, user_id, email, phone, name, pincode, address, lines, item_count, subtotal, mrp_total, delivery, total, payment, history, notes, token_hash, ip)
      VALUES (?, ?, ?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?, ?, ?)`)
      .bind(order.id, now, now, user?.id ?? null, email || null, address.phone, address.name, address.pincode, JSON.stringify(address), JSON.stringify(order.lines),
        quote.count, order.subtotal, order.mrpTotal, order.delivery, order.total, JSON.stringify(order.history), notes || null, await sha256(token), ip).run();
    const inbox = storeInbox(db);
    const results = await Promise.allSettled([
      email ? sendEmail(db, email, `Order ${order.id} placed: ${rupees(order.total)} cash on delivery`, customerEmail(order, "placed")) : Promise.resolve(false),
      sendEmail(db, inbox, `New order ${order.id}: ${rupees(order.total)} COD, ${address.city} ${address.pincode}`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">New cash-on-delivery order</h2>
<p style="margin:0 0 4px;font-size:14px;">Order <b>${order.id}</b> · ${quote.count} item${quote.count === 1 ? "" : "s"} · <b>${money(order.total)}</b></p>
${linesHtml(order)}<p style="margin:12px 0 0;font-size:14px;line-height:1.5;">${addressHtml(address)}${address.email ? `<br>${escapeHtml(address.email)}` : ""}</p>
${notes ? `<p style="margin:10px 0 0;font-size:14px;"><b>Note:</b> ${escapeHtml(notes)}</p>` : ""}
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
    ]);
    const emailed = results[0].status === "fulfilled" && results[0].value === true;
    return json({ order: { ...order, canCancel: true }, token, emailed }, 201);
  }

  if (path === "orders" && method === "GET") {
    const user = await currentUser(request, db);
    if (!user) return json({ error: "Sign in to see your orders.", signIn: true }, 401);
    const { results } = await db.DB.prepare("SELECT * FROM store_orders WHERE user_id = ? OR email = ? ORDER BY created_at DESC LIMIT 100").bind(user.id, normEmail(user.email)).all<OrderRow>();
    return json({ orders: results.map((r) => customerView(r, true)) });
  }

  // GET orders/:id (the browser that placed it sends its token in x-order-token, or its account is signed in),
  // POST orders/:id/lookup {phone} (order number and phone), POST orders/:id/cancel {phone?}.
  const om = /^orders\/([A-Za-z0-9-]{6,20})(\/cancel|\/lookup)?$/.exec(path);
  if (om && ((method === "GET" && !om[2]) || (method === "POST" && om[2]))) {
    const id = cleanOrderId(om[1]);
    const b = method === "POST" ? await readJson(request) : null;
    const token = str(request.headers.get("x-order-token"), 64);
    const phoneIn = b?.phone;
    const r = await db.DB.prepare("SELECT * FROM store_orders WHERE id = ?").bind(id).first<OrderRow>();
    // Who may see it: the browser that placed it (token), its account, or someone with the order number and phone.
    let full = false, allowed = false;
    if (r && token && (await sha256(token)) === r.token_hash) { full = true; allowed = true; }
    if (r && !allowed) {
      const user = await currentUser(request, db).catch(() => null);
      if (user && (r.user_id === user.id || (r.email && r.email === normEmail(user.email)))) { full = true; allowed = true; }
    }
    if (!allowed && phoneIn !== undefined && phoneIn !== null) {
      if (!(await allow(db, `store:lookup:ip:${clientIp(request)}`, 30, 3600_000))) return json({ error: "Too many tries. Please wait a while and try again." }, 429);
      const phone = normPhone(phoneIn);
      if (r && phone && phone === r.phone) allowed = true;
    }
    if (!r || !allowed) return json({ error: "We couldn't find an order with that number and phone. Please check both and try again." }, 404);

    if (method === "GET" || om[2] === "/lookup") return json({ order: customerView(r, full) });
    if (om[2] === "/cancel") {
      if (!cancellable(r.status)) return json({ error: r.status === "cancelled" ? "This order is already cancelled." : "This order has shipped, so it can't be cancelled now. You can refuse it at delivery, or contact us." }, 409);
      const o = toOrder(r);
      const now = Date.now();
      const reason = str(b?.reason, 200);
      o.status = "cancelled";
      o.history.push({ status: "cancelled", at: now, note: reason ? `Cancelled by the customer: ${reason}` : "Cancelled by the customer" });
      await db.DB.prepare("UPDATE store_orders SET status = 'cancelled', history = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(o.history), now, o.id).run();
      await Promise.allSettled([
        o.address.email ? sendEmail(db, o.address.email, `Order ${o.id} cancelled`, customerEmail(o, "cancelled")) : Promise.resolve(false),
        sendEmail(db, storeInbox(db), `Cancelled by the customer: ${o.id}`, shell(`<p style="margin:0;font-size:14px;line-height:1.6;">Order <b>${o.id}</b> (${money(o.total)}, ${escapeHtml(o.address.city)}) was cancelled by the customer.${reason ? `<br>Reason: ${escapeHtml(reason)}` : ""}</p>`)),
      ]);
      return json({ order: { ...o, address: customerView(r, full).address, canCancel: false } });
    }
  }

  return json({ error: "Not found" }, 404);
}
