// The store on Cloudflare (/api/store/*): the catalogue with the store's own
// prices, stock and offers, orders paid by cash on delivery, online
// (Razorpay, worker/razorpay.ts) or by bank transfer, gift and business
// orders, coupons, order tracking and cancelling, reviews from buyers,
// back-in-stock and price-drop alerts, price and book requests, call-back
// requests to order by phone, saved addresses, bulk quotation requests from
// hospitals and medical colleges (and their accounts' list of them), and the
// store admin. Orders, requests, reviews, coupons, offers, alerts, addresses
// and the store's changes to products live in D1 (tables below; the same SQL
// is in migrations/0002 to 0005, and the tables are also created on first use).
//
// Variables (Workers & Pages > aethex > Settings > Variables and Secrets):
//   ADMIN_EMAILS  accounts that may open aethex.in/admin, comma-separated
//   STORE_EMAIL   where new orders and requests are emailed
//                 (default: the first ADMIN_EMAILS address, else the support address)
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET   online payments (worker/razorpay.ts)
//   STORE_WHATSAPP  the store's WhatsApp number (10 digits, or with 91): "Order on WhatsApp" shows once it's set
//   STORE_BANK_ACCOUNT_NAME, STORE_BANK_ACCOUNT_NUMBER, STORE_BANK_IFSC, STORE_BANK_NAME (optional)
//                 the account for bank transfers: "Bank transfer" shows at checkout once the first three are set
// Order and request emails go out through Brevo, like the sign-in codes.
import catalogJson from "../artifacts/aethex/src/data/store/catalog.json";
import booksJson from "../artifacts/aethex/src/data/store/books.json";
import type {
  Address, BankDetails, BookCatalog, BulkItem, BulkRequest, BulkStatus, CartLine, Catalog, Coupon, EnquiryKind, Offer, Order, OrderStatus, Override, PaymentMethod, PricedLine, Product,
  ProductSummary, Quote, Rating, RatingSummary, Review, ReviewStatus, SavedAddress, Segment,
} from "../artifacts/aethex/src/lib/store/types";
import { bookAsProduct, isBookId, itemHref } from "../artifacts/aethex/src/lib/store/bookdata";
import {
  applyOverride, BANK_DAYS, BANK_LIMIT, BANK_MIN, BULK_STATUSES, cancellable, cleanSchedule, COD_LIMIT, everyText, formatDay, INDIAN_STATES, INSTITUTION_TYPES, MAX_ADDRESSES, normPhone, ONLINE_LIMIT,
  ORDER_STATUSES, priceBulk, quoteLines, round2, cleanBulkLines, lineKey,
  STATUS_LABEL, scheduleText, summarize, validEmail, validGstin, validPincode,
} from "../artifacts/aethex/src/lib/store/rules";
import { applyCoupon, applyOffers, cleanCouponCode, couponLive, liveOfferKey, offerLive, publicCoupon } from "../artifacts/aethex/src/lib/store/promo";
import {
  captureOrFetch, createRzpOrder, fetchRzpOrderPayments, fetchRzpPayment, fetchRzpRefunds, paise, paymentSignatureOk, razorpayReady, RazorpayError, refundRzpPayment, webhookSignatureOk,
  type RazorpayEnv, type RzpRefund,
} from "./razorpay";
import { BUSINESS, SITE_URL, launchGaps } from "../artifacts/aethex/src/config/business";
import { allow, clientIp, currentUser, escapeHtml, normEmail, sendEmail, sha256, shell, type AuthEnv, type D1Like } from "./auth";
import { emailOk, withPrefsLink } from "./prefs";

export interface StoreEnv extends AuthEnv, RazorpayEnv {
  ADMIN_EMAILS?: string;
  STORE_EMAIL?: string;
  STORE_WHATSAPP?: string;
  STORE_BANK_ACCOUNT_NAME?: string;
  STORE_BANK_ACCOUNT_NUMBER?: string;
  STORE_BANK_IFSC?: string;
  STORE_BANK_NAME?: string;
  /** update 76: the store's GSTIN, if it isn't in src/config/business.ts */
  STORE_GSTIN?: string;
}
type DBEnv = StoreEnv & { DB: D1Like };

/** The store's WhatsApp number with the country code (91...), or "" when it isn't set or doesn't look right. */
function whatsappNumber(env: StoreEnv): string {
  const d = String(env.STORE_WHATSAPP ?? "").replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(d)) return `91${d}`;
  if (/^91[6-9]\d{9}$/.test(d)) return d;
  return "";
}
/** The account for bank transfers, once its name, number and IFSC are set (and look right). */
function bankDetails(env: StoreEnv): BankDetails | null {
  const accountName = String(env.STORE_BANK_ACCOUNT_NAME ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const accountNumber = String(env.STORE_BANK_ACCOUNT_NUMBER ?? "").replace(/\s+/g, "");
  const ifsc = String(env.STORE_BANK_IFSC ?? "").trim().toUpperCase();
  const bankName = String(env.STORE_BANK_NAME ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (accountName.length < 2 || !/^\d{9,18}$/.test(accountNumber) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return null;
  return { accountName, accountNumber, ifsc, ...(bankName ? { bankName } : {}) };
}

const catalog = catalogJson as unknown as Catalog;
const byId = new Map<number, Product>(catalog.products.map((p) => [p.id, p]));
const bySlug = new Map<string, Product>(catalog.products.map((p) => [p.slug, p]));
// Medical books are sold like products (cart, orders, the store's prices) under their own numbers.
const bookCatalog = booksJson as unknown as BookCatalog;
for (const b of bookCatalog.books) byId.set(b.id, bookAsProduct(b));
const publisherNames = new Map(bookCatalog.publishers.map((p) => [p.slug, p.name]));
/** A brand's name, or a book publisher's. */
const brandName = (slug: string) => catalog.brands.find((x) => x.slug === slug)?.name ?? publisherNames.get(slug) ?? slug;

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
  `CREATE TABLE IF NOT EXISTS store_bulk_requests (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new', segment TEXT NOT NULL,
    institution TEXT NOT NULL, inst_type TEXT NOT NULL, contact_name TEXT NOT NULL, designation TEXT, phone TEXT NOT NULL, email TEXT NOT NULL,
    gstin TEXT, address TEXT, city TEXT NOT NULL, state TEXT NOT NULL, pincode TEXT NOT NULL, need_by TEXT, notes TEXT,
    items TEXT NOT NULL, units INTEGER NOT NULL, est_total REAL NOT NULL, unpriced INTEGER NOT NULL, admin_note TEXT, user_id TEXT, ip TEXT,
    repeat_every INTEGER, repeat_months INTEGER)`,
  "CREATE INDEX IF NOT EXISTS store_bulk_requests_created ON store_bulk_requests(created_at)",
  `CREATE TABLE IF NOT EXISTS store_reviews (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, product_id INTEGER NOT NULL, order_id TEXT NOT NULL,
    rating INTEGER NOT NULL, title TEXT, body TEXT NOT NULL, name TEXT NOT NULL, city TEXT, status TEXT NOT NULL DEFAULT 'pending',
    reply TEXT, user_id TEXT, ip TEXT)`,
  "CREATE INDEX IF NOT EXISTS store_reviews_product ON store_reviews(product_id, status)",
  "CREATE UNIQUE INDEX IF NOT EXISTS store_reviews_order_product ON store_reviews(order_id, product_id)",
  "CREATE TABLE IF NOT EXISTS store_coupons (code TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, data TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS store_offers (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, data TEXT NOT NULL)",
  `CREATE TABLE IF NOT EXISTS store_alerts (
    id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, product_id INTEGER NOT NULL, variant_id TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL,
    email TEXT NOT NULL, price_at REAL, notified_at INTEGER, checked_at INTEGER, token TEXT NOT NULL, ip TEXT)`,
  "CREATE UNIQUE INDEX IF NOT EXISTS store_alerts_unique ON store_alerts(product_id, variant_id, kind, email)",
  "CREATE INDEX IF NOT EXISTS store_alerts_open ON store_alerts(notified_at, product_id)",
  "CREATE INDEX IF NOT EXISTS store_alerts_token ON store_alerts(token)",
  `CREATE TABLE IF NOT EXISTS store_addresses (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, label TEXT NOT NULL, data TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_addresses_user ON store_addresses(user_id)",
  // update 76: questions and answers on a product, and the HSN code and GST rate of each category for invoices
  `CREATE TABLE IF NOT EXISTS store_questions (
    id TEXT PRIMARY KEY, product_id INTEGER NOT NULL, question TEXT NOT NULL, name TEXT NOT NULL, user_id TEXT, email TEXT,
    answer TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, answered_at INTEGER)`,
  "CREATE INDEX IF NOT EXISTS store_questions_product ON store_questions(product_id, status)",
  "CREATE TABLE IF NOT EXISTS store_tax (category TEXT PRIMARY KEY, hsn TEXT NOT NULL, rate REAL NOT NULL, updated_at INTEGER NOT NULL)",
  // update 78: an institution's saved bulk lists, to send again
  `CREATE TABLE IF NOT EXISTS store_bulk_lists (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, segment TEXT NOT NULL, lines TEXT NOT NULL,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, sent_at INTEGER)`,
  "CREATE INDEX IF NOT EXISTS store_bulk_lists_user ON store_bulk_lists(user_id, updated_at)",
  // update 80: reorder reminders, and replacement requests
  `CREATE TABLE IF NOT EXISTS store_reorder (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, product_id INTEGER NOT NULL, variant_id TEXT NOT NULL DEFAULT '', qty INTEGER NOT NULL DEFAULT 1,
    every_days INTEGER NOT NULL, next_at INTEGER NOT NULL, last_sent INTEGER, created_at INTEGER NOT NULL)`,
  "CREATE UNIQUE INDEX IF NOT EXISTS store_reorder_one ON store_reorder(user_id, product_id, variant_id)",
  "CREATE INDEX IF NOT EXISTS store_reorder_due ON store_reorder(next_at)",
  `CREATE TABLE IF NOT EXISTS store_replacements (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id INTEGER NOT NULL, variant_id TEXT NOT NULL DEFAULT '', qty INTEGER NOT NULL, reason TEXT NOT NULL,
    details TEXT, status TEXT NOT NULL DEFAULT 'requested', note TEXT, email TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  "CREATE UNIQUE INDEX IF NOT EXISTS store_replacements_one ON store_replacements(order_id, product_id, variant_id)",
  // update 82: a bulk list shared for approval, and an institution's equipment register
  `CREATE TABLE IF NOT EXISTS store_approvals (
    id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL, owner_email TEXT NOT NULL, owner_name TEXT, segment TEXT NOT NULL, name TEXT NOT NULL,
    lines TEXT NOT NULL, message TEXT, approver_email TEXT NOT NULL, approver_name TEXT, status TEXT NOT NULL DEFAULT 'pending', comments TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, decided_at INTEGER)`,
  "CREATE INDEX IF NOT EXISTS store_approvals_user ON store_approvals(user_id, updated_at)",
  `CREATE TABLE IF NOT EXISTS store_equipment (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, data TEXT NOT NULL, next_service TEXT, next_calibration TEXT, warranty_until TEXT,
    reminded TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_equipment_user ON store_equipment(user_id, updated_at)",
  // update 84: store credit (a ledger: grants and refunds in, credit used on orders out) and prescriptions for orders
  `CREATE TABLE IF NOT EXISTS store_credit (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount REAL NOT NULL, kind TEXT NOT NULL, order_id TEXT, note TEXT, by TEXT, created_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_credit_user ON store_credit(user_id, created_at)",
  `CREATE TABLE IF NOT EXISTS store_rx (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_rx_order ON store_rx(order_id)",
  // update 86: teams (an institution's people share lists, approvals, quotations, purchase orders, spend and equipment)
  `CREATE TABLE IF NOT EXISTS store_teams (id TEXT PRIMARY KEY, name TEXT NOT NULL, segment TEXT NOT NULL, owner_id TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS store_team_members (team_id TEXT NOT NULL, email TEXT NOT NULL, user_id TEXT, role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'invited',
    token TEXT NOT NULL, invited_by TEXT, invited_at INTEGER NOT NULL, joined_at INTEGER, PRIMARY KEY (team_id, email))`,
  "CREATE INDEX IF NOT EXISTS store_team_members_user ON store_team_members(user_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS store_team_members_token ON store_team_members(token)",
  // update 89: help requests on orders (a conversation with the store) and each product's price over time
  `CREATE TABLE IF NOT EXISTS store_tickets (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, user_id TEXT, email TEXT, topic TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_tickets_order ON store_tickets(order_id)",
  "CREATE INDEX IF NOT EXISTS store_tickets_status ON store_tickets(status, updated_at)",
  "CREATE TABLE IF NOT EXISTS store_ticket_msgs (id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, who TEXT NOT NULL, name TEXT, body TEXT NOT NULL, at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS store_ticket_msgs_t ON store_ticket_msgs(ticket_id, at)",
  "CREATE TABLE IF NOT EXISTS store_price_log (product_id INTEGER NOT NULL, price REAL NOT NULL, mrp REAL, at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS store_price_log_p ON store_price_log(product_id, at)",
  // update 90: department indents (raised by a department, approved by the purchase officer, merged into the bulk list) and the consumables stock register
  `CREATE TABLE IF NOT EXISTS store_indents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, requester TEXT NOT NULL, department TEXT NOT NULL, lines TEXT NOT NULL, note TEXT, status TEXT NOT NULL DEFAULT 'pending',
    decided_by TEXT, decision_note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_indents_user ON store_indents(user_id, updated_at)",
  `CREATE TABLE IF NOT EXISTS store_stock (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL, qty REAL NOT NULL, reorder_level REAL NOT NULL, reorder_qty REAL NOT NULL,
    location TEXT, product_id INTEGER, variant_id TEXT, alerted INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  "CREATE INDEX IF NOT EXISTS store_stock_user ON store_stock(user_id)",
  "CREATE TABLE IF NOT EXISTS store_stock_moves (id TEXT PRIMARY KEY, stock_id TEXT NOT NULL, kind TEXT NOT NULL, qty REAL NOT NULL, after REAL NOT NULL, note TEXT, by_name TEXT, at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS store_stock_moves_s ON store_stock_moves(stock_id, at)",
  // update 100: applications to sell on Aethex
  "CREATE TABLE IF NOT EXISTS store_interest (topic TEXT NOT NULL, email TEXT NOT NULL, details TEXT, at INTEGER NOT NULL, PRIMARY KEY (topic, email))",
  "CREATE TABLE IF NOT EXISTS store_seller_apps (id TEXT PRIMARY KEY, user_id TEXT, email TEXT NOT NULL, data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS store_seller_apps_email ON store_seller_apps(email)",
  "CREATE TABLE IF NOT EXISTS store_spend_budget (owner TEXT NOT NULL, fy INTEGER NOT NULL, amount REAL NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (owner, fy))",
];
/** Columns added after a table was first made: added where missing (an existing column is left alone). */
export const STORE_COLUMNS: [table: string, column: string, type: string][] = [
  ["store_bulk_requests", "repeat_every", "INTEGER"],
  ["store_bulk_requests", "repeat_months", "INTEGER"],
  ["store_bulk_requests", "customer_note", "TEXT"],
  ["store_orders", "payment_status", "TEXT"],
  ["store_orders", "payment_ref", "TEXT"],
  ["store_orders", "payment_id", "TEXT"],
  ["store_orders", "paid_at", "INTEGER"],
  ["store_orders", "refund", "TEXT"],
  ["store_orders", "coupon", "TEXT"],
  ["store_orders", "discount", "REAL"],
  ["store_orders", "payment_checked_at", "INTEGER"],
  ["store_alerts", "checked_at", "INTEGER"],
  ["store_orders", "gift", "TEXT"],
  ["store_orders", "business", "TEXT"],
  ["store_orders", "bank_ref", "TEXT"],
  // update 84: store credit used on the order; a prescription's check (pending, approved, rejected) and the note on it
  ["store_orders", "credit", "REAL"], ["store_orders", "rx_status", "TEXT"], ["store_orders", "rx_note", "TEXT"],
  // update 86: a purchase order made from a quotation request
  ["store_bulk_requests", "po", "TEXT"],
];
/** Indexes on those added columns (made once the columns are there). */
const STORE_INDEXES = [
  "CREATE INDEX IF NOT EXISTS store_orders_payment_ref ON store_orders(payment_ref)",
  "CREATE INDEX IF NOT EXISTS store_orders_payment_id ON store_orders(payment_id)",
  "CREATE INDEX IF NOT EXISTS store_orders_coupon ON store_orders(coupon)",
  "CREATE INDEX IF NOT EXISTS store_orders_token ON store_orders(token_hash)",
];
let tablesReady: Promise<void> | null = null;
function ensureTables(db: D1Like): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      for (const sql of STORE_TABLES) await db.prepare(sql).run();
      for (const [table, column, type] of STORE_COLUMNS) {
        try {
          await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
        } catch (e) {
          if (!/duplicate column/i.test(String((e as Error)?.message ?? e))) throw e;
        }
      }
      for (const sql of STORE_INDEXES) await db.prepare(sql).run();
    })().catch((e) => { tablesReady = null; throw e; });
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
const forgetOverrides = () => { overrideCache = null; summaryCache = null; booksCache = null; };

/** The offers set in the admin (sales on brands or categories), read every 30 seconds. */
let offerCache: { at: number; offers: Offer[]; stamp: string } | null = null;
async function offers(env: StoreEnv): Promise<{ offers: Offer[]; stamp: string }> {
  if (!env.DB) return { offers: [], stamp: "" };
  if (offerCache && Date.now() - offerCache.at < 30_000) return offerCache;
  await ensureTables(env.DB);
  const { results } = await env.DB.prepare("SELECT id, data, updated_at FROM store_offers").all<{ id: string; data: string; updated_at: number }>();
  const list: Offer[] = [];
  let latest = 0;
  for (const r of results) {
    const o = parse<Offer | null>(r.data, null);
    if (o) { list.push({ ...o, id: r.id }); latest = Math.max(latest, Number(r.updated_at) || 0); }
  }
  offerCache = { at: Date.now(), offers: list, stamp: list.length ? `${list.length}.${latest}` : "" };
  return offerCache;
}
const forgetOffers = () => { offerCache = null; summaryCache = null; booksCache = null; };

/** Approved reviews, as stars and counts per product, read every minute. */
let ratingCache: { at: number; map: Map<number, Rating>; stamp: string } | null = null;
async function ratings(env: StoreEnv): Promise<{ map: Map<number, Rating>; stamp: string }> {
  if (!env.DB) return { map: new Map(), stamp: "" };
  if (ratingCache && Date.now() - ratingCache.at < 60_000) return ratingCache;
  await ensureTables(env.DB);
  const { results } = await env.DB.prepare("SELECT product_id, COUNT(*) AS n, AVG(rating) AS avg, MAX(updated_at) AS latest FROM store_reviews WHERE status = 'approved' GROUP BY product_id")
    .all<{ product_id: number; n: number; avg: number; latest: number }>();
  const map = new Map<number, Rating>();
  let latest = 0, total = 0;
  for (const r of results) {
    map.set(Number(r.product_id), { avg: Math.round(Number(r.avg) * 10) / 10, count: Number(r.n) });
    latest = Math.max(latest, Number(r.latest) || 0); total += Number(r.n);
  }
  ratingCache = { at: Date.now(), map, stamp: total ? `${total}.${latest}` : "" };
  return ratingCache;
}
const forgetRatings = () => { ratingCache = null; summaryCache = null; booksCache = null; };

/** Everything that changes what the catalogue shows: the store's changes, the offers running now, the reviews. */
async function storeState(env: StoreEnv) {
  const [ov, of, rt] = await Promise.all([overrides(env), offers(env), ratings(env)]);
  const now = Date.now();
  const live = liveOfferKey(of.offers, now);
  const stamp = [ov.stamp, of.stamp && live ? `${of.stamp}:${live}` : "", rt.stamp].join("|").replace(/^\|+$/, "");
  return { overrides: ov.map, offers: of.offers, ratings: rt.map, now, stamp };
}

/** A product as it sells now: the store's changes, then any offer. */
function sellAs(p: Product, o: Override | undefined, list: Offer[], now: number): Product | null {
  const q = applyOverride(p, o);
  return q ? applyOffers(q, list, now) : null;
}

async function finder(env: StoreEnv) {
  const st = await storeState(env);
  return (id: number) => { const p = byId.get(id); return p ? sellAs(p, st.overrides.get(id), st.offers, st.now) : null; };
}

let summaryCache: { stamp: string; body: string } | null = null;
async function catalogSummary(env: StoreEnv): Promise<string> {
  const st = await storeState(env);
  if (summaryCache && summaryCache.stamp === st.stamp) return summaryCache.body;
  const products: ProductSummary[] = [];
  for (const p of catalog.products) {
    const q = sellAs(p, st.overrides.get(p.id), st.offers, st.now);
    if (!q) continue;
    const s = summarize(q);
    const r = st.ratings.get(p.id);
    if (r) s.rating = r;
    products.push(s);
  }
  const count = (key: "brand" | "category", v: string) => products.filter((p) => p[key] === v).length;
  const body = JSON.stringify({
    version: st.stamp ? `${catalog.version}.${st.stamp}` : catalog.version,
    brands: catalog.brands.map((b) => ({ ...b, count: count("brand", b.slug) })),
    categories: catalog.categories.map((c) => ({ ...c, count: count("category", c.slug) })),
    products,
  });
  summaryCache = { stamp: st.stamp, body };
  return body;
}

/** The medical books, with the store's prices, stock, offers and reviews (and without the hidden ones). */
let booksCache: { stamp: string; body: string } | null = null;
async function booksBody(env: StoreEnv): Promise<string> {
  const st = await storeState(env);
  if (booksCache && booksCache.stamp === st.stamp) return booksCache.body;
  const books = [];
  for (const b of bookCatalog.books) {
    const q = sellAs(bookAsProduct(b), st.overrides.get(b.id), st.offers, st.now);
    if (!q) continue;
    const out: Record<string, unknown> = { ...b, price: q.price, mrp: q.price === null ? null : q.mrp, priceOnRequest: q.priceOnRequest, inStock: q.inStock };
    if (q.offer) out.offer = q.offer;
    const r = st.ratings.get(b.id);
    if (r) out.rating = r;
    books.push(out);
  }
  const body = JSON.stringify({ version: st.stamp ? `${bookCatalog.version}.${st.stamp}` : bookCatalog.version, publishers: bookCatalog.publishers, books });
  booksCache = { stamp: st.stamp, body };
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
  payment_status?: string | null; payment_ref?: string | null; payment_id?: string | null; paid_at?: number | null; refund?: string | null;
  coupon?: string | null; discount?: number | null; gift?: string | null; business?: string | null; bank_ref?: string | null;
  credit?: number | null; rx_status?: string | null; rx_note?: string | null;
};
const parse = <T>(s: string | null, fallback: T): T => { try { return s ? JSON.parse(s) : fallback; } catch { return fallback; } };

function toOrder(r: OrderRow): Order {
  const o: Order = {
    id: r.id, createdAt: r.created_at, status: r.status as OrderStatus, payment: r.payment === "online" ? "online" : r.payment === "bank" ? "bank" : "cod",
    address: parse<Address>(r.address, { name: r.name, phone: r.phone, line1: "", city: "", state: "", pincode: r.pincode }),
    lines: parse<PricedLine[]>(r.lines, []), subtotal: r.subtotal, mrpTotal: r.mrp_total, delivery: r.delivery, total: r.total,
    history: parse(r.history, []),
  };
  const t = parse<Order["tracking"] | null>(r.tracking, null);
  if (t) o.tracking = t;
  if (r.notes) o.notes = r.notes;
  if (o.payment === "online") {
    o.paymentStatus = r.payment_status === "paid" || r.payment_status === "refunded" ? r.payment_status : "pending";
    if (r.paid_at) o.paidAt = r.paid_at;
    const refund = parse<Order["refund"] | null>(r.refund ?? null, null);
    if (refund) o.refund = refund;
  }
  if (o.payment === "bank") {
    o.paymentStatus = r.payment_status === "paid" ? "paid" : "pending";
    if (r.paid_at) o.paidAt = r.paid_at;
    if (r.bank_ref) o.bankRef = r.bank_ref;
  }
  if (r.discount) { o.discount = r.discount; if (r.coupon) o.coupon = r.coupon; }
  const gift = parse<Order["gift"] | null>(r.gift ?? null, null);
  if (gift) o.gift = gift;
  const business = parse<Order["business"] | null>(r.business ?? null, null);
  if (business) o.business = business;
  if (r.credit) o.credit = r.credit;
  if (r.rx_status) o.rx = { status: r.rx_status as NonNullable<Order["rx"]>["status"], ...(r.rx_note ? { note: r.rx_note } : {}) };
  return o;
}
/** Paid, online or by bank transfer (and not refunded in full), or nothing left to pay after store credit. */
const isPaid = (o: Order) => (o.payment !== "cod" && o.paymentStatus === "paid") || (o.total <= 0 && (o.credit ?? 0) > 0);

/** What the customer sees. Looked up with the order number and phone alone, the address is shortened. */
function customerView(r: OrderRow, full: boolean) {
  const o = toOrder(r);
  if (!full) {
    const a = o.address;
    o.address = { name: a.name, phone: `••••••${a.phone.slice(-4)}`, line1: "", city: a.city, state: a.state, pincode: a.pincode };
    delete o.gift;
    delete o.business;
  }
  return { ...o, canCancel: cancellable(o.status) };
}
/** An order waiting for its bank transfer carries the account to pay into. */
const withBank = <T extends Order>(env: StoreEnv, o: T): T & { bank?: BankDetails } => {
  const bank = o.payment === "bank" && o.status === "pending" ? bankDetails(env) : null;
  return bank ? { ...o, bank } : o;
};

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
  [a.name, a.line1, a.line2, a.landmark ? `Near ${a.landmark}` : "", `${a.city}, ${a.state} ${a.pincode}`, `Phone ${a.phone}`].filter((x): x is string => !!x).map(escapeHtml).join("<br>");

function linesHtml(o: Order) {
  const rows = o.lines.map((l) => `<tr><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;">${escapeHtml(l.name)}${l.variantLabel ? `<br><span style="color:#718096;font-size:12px;">${escapeHtml(l.variantLabel)}</span>` : ""}</td><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;color:#718096;text-align:center;">&times;${l.qty}</td><td style="padding:9px 0;border-bottom:1px solid #EDF0F4;font-size:14px;text-align:right;">${money(l.lineTotal)}</td></tr>`).join("");
  const how = o.payment === "online" ? (o.paymentStatus === "paid" || o.paymentStatus === "refunded" ? "paid online" : "to pay online")
    : o.payment === "bank" ? (o.paymentStatus === "paid" ? "paid by bank transfer" : "to pay by bank transfer") : o.total <= 0 && o.credit ? "paid with store credit" : "cash on delivery";
  return `<table style="width:100%;border-collapse:collapse;margin:6px 0 10px;">${rows}</table>
<table style="width:100%;border-collapse:collapse;font-size:14px;"><tr><td style="padding:3px 0;color:#4A5568;">Items</td><td style="text-align:right;">${money(o.subtotal)}</td></tr>
${o.discount ? `<tr><td style="padding:3px 0;color:#4A5568;">Coupon${o.coupon ? ` ${escapeHtml(o.coupon)}` : ""}</td><td style="text-align:right;color:#0F7A43;">&minus;${money(o.discount)}</td></tr>` : ""}
<tr><td style="padding:3px 0;color:#4A5568;">Delivery</td><td style="text-align:right;">${o.delivery ? money(o.delivery) : "Free"}</td></tr>
${o.credit ? `<tr><td style="padding:3px 0;color:#4A5568;">Store credit</td><td style="text-align:right;color:#0F7A43;">&minus;${money(o.credit)}</td></tr>` : ""}
<tr><td style="padding:6px 0;font-weight:700;">Total (${how})</td><td style="text-align:right;font-weight:700;">${money(o.total)}</td></tr></table>`;
}

/** A gift's message, and a business buyer's name and GSTIN, for the emails. */
function extrasHtml(o: Order, forStore = false): string {
  const out: string[] = [];
  if (o.gift) {
    const msg = o.gift.message ? `<br><i>"${escapeHtml(o.gift.message)}"</i>${o.gift.from ? `<br>From ${escapeHtml(o.gift.from)}` : ""}` : o.gift.from ? `<br>From ${escapeHtml(o.gift.from)}` : "";
    out.push(`<p style="margin:12px 0 0;padding:10px 12px;border-radius:8px;background:#FFF7E8;font-size:14px;line-height:1.55;"><b>${forStore ? "Gift order: put this message in the box, and leave out anything showing prices" : "Gift"}</b>${msg}</p>`);
  }
  if (o.business) out.push(`<p style="margin:12px 0 0;font-size:14px;line-height:1.55;"><b>Business purchase:</b> ${escapeHtml(o.business.name)}${o.business.gstin ? ` · GSTIN ${escapeHtml(o.business.gstin)}` : ""}</p>`);
  return out.join("");
}

const button = (href: string, label: string) => `<p style="text-align:center;margin:22px 0 0;"><a href="${href}" style="display:inline-block;background:#1F3F7A;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:700;">${label}</a></p>`;
const signoff = () => `<p style="color:#718096;font-size:12px;margin-top:22px;line-height:1.5;">${escapeHtml(BUSINESS.legalName)}${BUSINESS.gstin ? ` · GSTIN ${escapeHtml(BUSINESS.gstin)}` : ""}<br>Questions? Reply to this email or write to ${escapeHtml(BUSINESS.email)}${BUSINESS.phone ? ` · ${escapeHtml(BUSINESS.phone)}` : ""}.</p>`;
const trackUrl = (id: string) => `${SITE_URL}/orders/track?order=${encodeURIComponent(id)}`;

/** The buyer's first name for a greeting: on a gift, the address is the recipient's, so the name it's from (or none). */
function greetName(o: Order): string {
  const n = o.gift ? o.gift.from ?? "" : o.address.name;
  return escapeHtml(n.split(" ")[0] || n);
}

function customerEmail(o: Order, kind: "placed" | OrderStatus, note?: string) {
  const first = greetName(o);
  // A gift paid in cash: whoever receives it pays.
  const cash = o.gift ? `Whoever receives it pays ${money(o.total)} in cash at delivery, so do let them know.` : `Please keep ${money(o.total)} ready to pay in cash when it arrives.`;
  const paid = o.payment !== "cod" && (o.paymentStatus === "paid" || o.paymentStatus === "refunded");
  const cancelText = o.refund
    ? `We've refunded ${money(o.refund.amount)} to the account or card you paid with. Refunds usually reach you in 5 to 7 business days.`
    : paid && o.payment === "bank" ? "We'll send your bank transfer back to the account it came from, and email you when it's on its way."
      : paid ? "Your online payment will be refunded to the account or card you paid with; we'll email you when it's on its way."
        : o.payment === "bank" ? "No payment is due. If you'd already sent the bank transfer, reply to this email with its reference and we'll send the money back." : "No payment is due.";
  const heads: Record<string, [string, string]> = {
    placed: [`Thank you${first ? `, ${first}` : ""}. Your ${o.gift ? "gift" : "order"} is placed`, paid
      ? `We've received your payment of ${money(o.total)}. We'll confirm the order shortly and ship it ${escapeHtml(BUSINESS.dispatch)}.`
      : `We'll confirm it shortly and ship it ${escapeHtml(BUSINESS.dispatch)}. ${cash}`],
    confirmed: ["Your order is confirmed", `We're packing it now. It ships ${escapeHtml(BUSINESS.dispatch)}.`],
    shipped: [o.gift ? "Your gift is on its way" : "Your order is on its way", `Delivery is ${escapeHtml(BUSINESS.delivery)}.${paid ? "" : ` ${cash}`}`],
    delivered: ["Your order has been delivered", `Thank you for shopping with ${escapeHtml(BUSINESS.brand)}. If anything arrived damaged, defective or wrong, tell us within ${BUSINESS.replacementDays} days and we'll replace it. You can rate what you bought from your order page.`],
    cancelled: ["Your order has been cancelled", `${cancelText} If you didn't ask for this, reply to this email and we'll help.`],
  };
  const [h, p] = heads[kind] ?? heads.placed;
  const t = o.tracking;
  const tracking = kind === "shipped" && t && (t.courier || t.number)
    ? `<p style="margin:0 0 14px;font-size:14px;"><b>Courier:</b> ${escapeHtml(t.courier || "")} ${t.number ? `· <b>Tracking number:</b> ${escapeHtml(t.number)}` : ""}${t.url && /^https:\/\//.test(t.url) ? ` · <a href="${escapeHtml(t.url)}">Track with the courier</a>` : ""}</p>` : "";
  return shell(`<h2 style="margin:0 0 8px;font-size:20px;">${h}</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${p}</p>
${note ? `<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${escapeHtml(note)}</p>` : ""}
<p style="margin:14px 0 4px;font-size:13px;color:#718096;">Order <b style="color:#14213D;">${escapeHtml(o.id)}</b></p>
${tracking}${linesHtml(o)}${extrasHtml(o)}
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
  if (raw.rx === true) o.rx = true;
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

// Text a customer typed (a name, a note, a gift message) can't run as a spreadsheet formula when the file is opened.
const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function handleAdmin(request: Request, env: DBEnv, path: string, ctx?: Ctx): Promise<Response> {
  const who = await requireAdmin(request, env);
  if (who instanceof Response) return who;
  const url = new URL(request.url);
  const method = request.method;

  if (path === "me") return json({ ok: true, email: who });
  { const r84 = await handleAdmin84(request, env, path, method, who); if (r84) return r84; }
  { const r89 = await handleAdminTickets(request, env, path, method, who); if (r89) return r89; }
  { const r100 = await handleAdminSellers(request, env, path, method); if (r100) return r100; }

  if (path === "summary" && method === "GET") {
    const dayStart = Date.now() - 86400_000;
    const byStatus = await env.DB.prepare("SELECT status, COUNT(*) AS n, SUM(total) AS total FROM store_orders GROUP BY status").all<{ status: string; n: number; total: number }>();
    const today = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(total) AS total FROM store_orders WHERE created_at > ?").bind(dayStart).first<{ n: number; total: number }>();
    const openEnq = await env.DB.prepare("SELECT COUNT(*) AS n FROM store_enquiries WHERE status = 'new'").first<{ n: number }>();
    const openBulk = await env.DB.prepare("SELECT COUNT(*) AS n FROM store_bulk_requests WHERE status = 'new'").first<{ n: number }>();
    const newReviews = await env.DB.prepare("SELECT COUNT(*) AS n FROM store_reviews WHERE status = 'pending'").first<{ n: number }>();
    const bankWaiting = await env.DB.prepare("SELECT COUNT(*) AS n FROM store_orders WHERE payment = 'bank' AND status = 'pending'").first<{ n: number }>();
    const callbacks = await env.DB.prepare("SELECT COUNT(*) AS n FROM store_enquiries WHERE kind = 'callback' AND status = 'new'").first<{ n: number }>();
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
      openBulk: openBulk?.n || 0,
      pendingReviews: newReviews?.n || 0,
      pendingQuestions: (await env.DB.prepare("SELECT COUNT(*) AS n FROM store_questions WHERE status = 'pending'").first<{ n: number }>())?.n || 0,
      openReplacements: (await env.DB.prepare("SELECT COUNT(*) AS n FROM store_replacements WHERE status IN ('requested', 'approved', 'picked-up')").first<{ n: number }>())?.n || 0,
      bankWaiting: bankWaiting?.n || 0,
      callbacks: callbacks?.n || 0,
      catalog: { products: catalog.products.length, priceOnRequest, noOrigin, hidden, outOfStock },
      setup: {
        email: !!env.BREVO_API_KEY, storeEmail: storeInbox(env), admins: adminEmails(env).length, gaps: launchGaps(),
        // Online payments: on once both Razorpay keys are set ("test" keys take no real money). Never the keys themselves.
        onlinePayments: razorpayReady(env), razorpayMode: !env.RAZORPAY_KEY_ID ? "" : env.RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "test",
        webhook: !!env.RAZORPAY_WEBHOOK_SECRET, webhookUrl: `${SITE_URL}/api/store/razorpay/webhook`,
        // Bank transfer and WhatsApp: on once their variables are set (and look right).
        bankTransfer: !!bankDetails(env), whatsapp: !!whatsappNumber(env),
      },
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
      const head = ["Order", "Placed (IST)", "Status", "Name", "Phone", "Email", "Address", "City", "State", "PIN", "Items", "Item count", "Subtotal", "Coupon", "Discount", "Delivery", "Total", "Payment", "Paid (IST)", "Refunded", "Razorpay payment", "Bank reference", "Courier", "Tracking number", "Customer note", "Gift", "Gift message", "Business", "GSTIN", "Admin note"];
      const ist = (t: number) => new Date(t + 5.5 * 3600_000).toISOString().replace("T", " ").slice(0, 16);
      const payText = (o: Order) => o.payment === "cod" ? "Cash on delivery"
        : o.payment === "bank" ? (o.paymentStatus === "paid" ? "Bank transfer, paid" : "Bank transfer, not paid")
          : o.paymentStatus === "refunded" ? "Online, refunded" : o.paymentStatus === "paid" ? "Online, paid" : "Online, not paid";
      const rows = results.map((r) => {
        const o = toOrder(r); const a = o.address;
        return [o.id, ist(r.created_at), o.status, a.name, a.phone, a.email || "", [a.line1, a.line2, a.landmark].filter(Boolean).join(", "), a.city, a.state, a.pincode,
          o.lines.map((l) => `${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} x${l.qty}`).join("; "), r.item_count, o.subtotal, o.coupon || "", o.discount || "", o.delivery, o.total,
          payText(o), o.paidAt ? ist(o.paidAt) : "", o.refund?.amount || "", r.payment_id || "", o.bankRef || "",
          o.tracking?.courier || "", o.tracking?.number || "", o.notes || "",
          o.gift ? "Yes" : "", o.gift ? [o.gift.message, o.gift.from ? `From ${o.gift.from}` : ""].filter(Boolean).join(" · ") : "",
          o.business?.name || "", o.business?.gstin || "", r.admin_note || ""].map(csvCell).join(",");
      });
      return new Response(`﻿${head.join(",")}\n${rows.join("\n")}\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="aethex-orders-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
    }
    return json({ orders: results.map((r) => ({ ...toOrder(r), userId: r.user_id, adminNote: r.admin_note || "", updatedAt: r.updated_at, paymentId: r.payment_id || "" })) });
  }

  const rf = /^orders\/([A-Z0-9-]{6,20})\/refund$/.exec(path);
  if (rf && method === "POST") {
    const r = await rowById(env, rf[1]);
    if (!r) return json({ error: "No such order." }, 404);
    const b = await readJson(request);
    const o = toOrder(r);
    const left = round2(o.total - (o.refund?.amount ?? 0));
    const amount = b?.amount === undefined || b?.amount === null || b?.amount === "" ? left : Number(b.amount);
    if (!Number.isFinite(amount) || amount < 1 || amount > left + 0.005) return json({ error: `Refund from ₹1 up to ₹${left.toLocaleString("en-IN")}.` }, 400);
    const why = str(b?.reason, 200) || "Refunded by the store";
    const done = await refundOrder(env, r, o, amount, why);
    if ("error" in done) return json(done, 409);
    let emailed = false;
    if (o.address.email && b?.notify !== false) emailed = await sendEmail(env, o.address.email, `Order ${o.id}: ${rupees(done.amount)} refunded`, refundEmail(o, done.amount, why)).catch(() => false);
    const fresh = (await rowById(env, o.id)) ?? r;
    return json({ order: { ...toOrder(fresh), userId: fresh.user_id, adminNote: fresh.admin_note || "", updatedAt: fresh.updated_at, paymentId: fresh.payment_id || "" }, refunded: done.amount, emailed });
  }

  // A bank transfer has come in: the order is placed and the customer told.
  const pd = /^orders\/([A-Z0-9-]{6,20})\/paid$/.exec(path);
  if (pd && method === "POST") {
    const r = await rowById(env, pd[1]);
    if (!r) return json({ error: "No such order." }, 404);
    if (r.payment !== "bank") return json({ error: "Only orders paid by bank transfer are marked paid here." }, 409);
    if (r.status !== "pending" || r.payment_status !== "pending") {
      return json({ error: r.status === "cancelled" ? "This order was cancelled. Send the money back, or ask the customer to order again." : "This order is marked paid already." }, 409);
    }
    const b = (await readJson(request)) ?? {};
    const reference = str(b.reference, 40);
    const now = Date.now();
    const res = await env.DB.prepare(`UPDATE store_orders SET status = 'placed', payment_status = 'paid', paid_at = ?, bank_ref = ?, updated_at = ?,
        history = json_insert(history, '$[#]', json_object('status', 'placed', 'at', ?, 'note', 'Bank transfer received'))
      WHERE id = ? AND payment = 'bank' AND status = 'pending' AND payment_status = 'pending'`).bind(now, reference || null, now, now, r.id).run();
    if (!changes(res)) return json({ error: "This order has just changed (the customer may have cancelled it). Reload it and try again." }, 409);
    const fresh = (await rowById(env, r.id)) ?? r;
    const o = toOrder(fresh);
    let emailed = false;
    if (o.address.email && b.notify !== false) {
      emailed = await sendEmail(env, o.address.email, `Order ${o.id} placed: ${rupees(o.total)} received`, customerEmail(o, "placed")).catch(() => false);
    }
    return json({ order: { ...o, userId: fresh.user_id, adminNote: fresh.admin_note || "", updatedAt: fresh.updated_at, paymentId: fresh.payment_id || "" }, emailed });
  }

  const om = /^orders\/([A-Z0-9-]{6,20})$/.exec(path);
  if (om && method === "PATCH") {
    const r = await rowById(env, om[1]);
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
    const was = r.status;
    if (status && status !== o.status) {
      if (!(ORDER_STATUSES as readonly string[]).includes(status) || status === "pending") return json({ error: "Unknown status." }, 400);
      if (o.status === "cancelled" || o.status === "delivered") return json({ error: `This order is already ${o.status}.` }, 409);
      if (o.status === "pending" && status !== "cancelled") {
        return json({ error: o.payment === "bank"
          ? "This order is waiting for its bank transfer. Mark it paid once the money is in the account, or cancel it."
          : "This order is waiting for its online payment. You can cancel it, or wait: it's placed once the payment comes through." }, 409);
      }
      if ((status === "shipped" || status === "delivered") && o.rx && o.rx.status !== "approved") return json({ error: "Check the prescription first: approve it before shipping." }, 409);
      o.status = status;
      o.history.push({ status, at: now, ...(note ? { note } : {}) });
      notify = status;
      changed = true;
    }
    const adminNote = typeof b.adminNote === "string" ? longStr(b.adminNote, 1000) : r.admin_note;
    if (adminNote !== r.admin_note) changed = true;
    if (!changed) return json({ order: { ...o, adminNote: r.admin_note || "", paymentId: r.payment_id || "" } });
    const res = await env.DB.prepare("UPDATE store_orders SET status = ?, history = ?, tracking = ?, admin_note = ?, updated_at = ? WHERE id = ? AND status = ?")
      .bind(o.status, JSON.stringify(o.history), o.tracking ? JSON.stringify(o.tracking) : null, adminNote || null, now, o.id, was).run();
    if (!changes(res)) return json({ error: "This order has just changed (a payment or the customer). Reload it and try again." }, 409);
    // Cancelling an order paid online gives the money back (unless the admin says not to).
    let refundError = "";
    if (notify === "cancelled" && o.payment === "online" && o.paymentStatus === "paid" && b.refund !== false) {
      const done = await refundOrder(env, { ...r, status: "cancelled" }, o, o.total, note || "Cancelled by the store");
      if ("error" in done) refundError = done.error;
    }
    // Paid by bank transfer: the money goes back from the store's bank, by hand.
    if (notify === "cancelled" && o.payment === "bank" && o.paymentStatus === "paid") {
      refundError = `It was paid by bank transfer${o.bankRef ? ` (reference ${o.bankRef})` : ""}: send ${rupees(o.total)} back to the customer from your bank.`;
    }
    let emailed = false;
    // An order to be paid by bank transfer was emailed how to pay, so its cancelling is emailed too.
    if (notify && (was !== "pending" || o.payment === "bank") && o.address.email && b.notify !== false) {
      emailed = await sendEmail(env, o.address.email, `${STATUS_LABEL[notify]}: order ${o.id}`, customerEmail(o, notify, note || undefined)).catch(() => false);
    }
    if (notify && o.gift?.toEmail && b.notify !== false) await giftRecipientEmail(env, o, notify);
    return json({ order: { ...o, adminNote: adminNote || "", paymentId: r.payment_id || "" }, emailed, ...(refundError ? { refundError } : {}) });
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

  if (path === "bulk" && method === "GET") {
    const status = str(url.searchParams.get("status"), 20);
    const ok = (BULK_STATUSES as readonly string[]).includes(status);
    const { results } = await env.DB.prepare(`SELECT * FROM store_bulk_requests${ok ? " WHERE status = ?" : ""} ORDER BY created_at DESC LIMIT 200`).bind(...(ok ? [status] : [])).all<BulkRow>();
    return json({ requests: results.map((r) => ({ ...toBulk(r), adminNote: r.admin_note || "", updatedAt: r.updated_at })) });
  }
  const bm = /^bulk\/([A-Z0-9-]{6,24})$/.exec(path);
  if (bm && method === "PATCH") {
    const r = await env.DB.prepare("SELECT * FROM store_bulk_requests WHERE id = ?").bind(bm[1]).first<BulkRow>();
    if (!r) return json({ error: "No such request." }, 404);
    const b = await readJson(request);
    if (!b) return json({ error: "Send the changes as JSON." }, 400);
    const status = b.status === undefined ? r.status : str(b.status, 20);
    if (!(BULK_STATUSES as readonly string[]).includes(status)) return json({ error: "Status must be new, quoted, ordered or closed." }, 400);
    const adminNote = typeof b.adminNote === "string" ? longStr(b.adminNote, 2000) : r.admin_note;
    const customerNote = typeof b.customerNote === "string" ? longStr(b.customerNote, 1000) : r.customer_note ?? null;
    const now = Date.now();
    await env.DB.prepare("UPDATE store_bulk_requests SET status = ?, admin_note = ?, customer_note = ?, updated_at = ? WHERE id = ?").bind(status, adminNote || null, customerNote || null, now, r.id).run();
    return json({ request: { ...toBulk({ ...r, status, admin_note: adminNote ?? null, customer_note: customerNote || null, updated_at: now }), adminNote: adminNote || "", updatedAt: now } });
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
    await later(ctx, processAlerts(env, p.id, 10));
    const q = applyOverride(p, o);
    return json({ ok: true, override: o, product: q ? summarize(q) : null });
  }

  /* offers and coupons */
  if (path === "promos" && method === "GET") {
    const [cs, os, used] = await Promise.all([
      env.DB.prepare("SELECT * FROM store_coupons ORDER BY updated_at DESC").all<CouponRow>(),
      env.DB.prepare("SELECT * FROM store_offers ORDER BY updated_at DESC").all<{ id: string; data: string; updated_at: number }>(),
      env.DB.prepare(`SELECT coupon, COUNT(*) AS n, SUM(discount) AS d FROM store_orders WHERE coupon IS NOT NULL AND ${USED} GROUP BY coupon`).all<{ coupon: string; n: number; d: number }>(),
    ]);
    const uses = new Map(used.results.map((u) => [u.coupon, { orders: Number(u.n) || 0, discount: round2(Number(u.d) || 0) }]));
    return json({
      coupons: cs.results.map((r) => { const c = parse<Coupon | null>(r.data, null); return c ? { ...c, code: r.code, updatedAt: r.updated_at, uses: uses.get(r.code) ?? { orders: 0, discount: 0 } } : null; }).filter(Boolean),
      offers: os.results.map((r) => { const o = parse<Offer | null>(r.data, null); return o ? { ...o, id: r.id, updatedAt: r.updated_at } : null; }).filter(Boolean),
    });
  }
  const cm = /^coupons\/([A-Za-z0-9]{3,20})$/.exec(path);
  if (cm && method === "PUT") {
    const b = await readJson(request);
    if (!b) return json({ error: "Send the coupon as JSON." }, 400);
    const c = cleanCoupon(b, cm[1]);
    if ("error" in c) return json(c, 400);
    const now = Date.now();
    await env.DB.prepare("INSERT INTO store_coupons (code, created_at, updated_at, data) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO UPDATE SET updated_at = excluded.updated_at, data = excluded.data")
      .bind(c.code, now, now, JSON.stringify(c)).run();
    return json({ coupon: { ...c, updatedAt: now } });
  }
  if (cm && method === "DELETE") {
    await env.DB.prepare("DELETE FROM store_coupons WHERE code = ?").bind(cleanCouponCode(cm[1])).run();
    return json({ ok: true });
  }
  const fm = /^offers\/([A-Za-z0-9-]{3,24})$/.exec(path);
  if (fm && method === "PUT") {
    const b = await readJson(request);
    if (!b) return json({ error: "Send the offer as JSON." }, 400);
    const id = fm[1] === "new" ? `OF-${orderId().slice(-6)}` : fm[1];
    const o = cleanOffer(b, id);
    if ("error" in o) return json(o, 400);
    const now = Date.now();
    await env.DB.prepare("INSERT INTO store_offers (id, created_at, updated_at, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, data = excluded.data")
      .bind(id, now, now, JSON.stringify(o)).run();
    forgetOffers();
    return json({ offer: { ...o, updatedAt: now } });
  }
  if (fm && method === "DELETE") {
    await env.DB.prepare("DELETE FROM store_offers WHERE id = ?").bind(fm[1]).run();
    forgetOffers();
    return json({ ok: true });
  }

  /* update 80: replacement requests */
  if (path === "replacements" && method === "GET") {
    const status = str(url.searchParams.get("status"), 20);
    const ok = REP_STATUSES.includes(status as RepStatus);
    const { results } = await env.DB.prepare(`SELECT x.*, o.address AS address FROM store_replacements x JOIN store_orders o ON o.id = x.order_id${ok ? " WHERE x.status = ?" : ""} ORDER BY x.updated_at DESC LIMIT 200`).bind(...(ok ? [status] : [])).all<RepRow & { address: string }>();
    return json({ replacements: results.map((r) => { const a = parse<Address | null>(r.address, null); const p = byId.get(Number(r.product_id)); return { ...repOut(r), email: r.email, customer: a ? { name: a.name, phone: a.phone, city: a.city } : null, product: p ? { name: isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`, href: itemHref(p.id, p.slug) } : null }; }) });
  }
  const rpm = /^replacements\/(x[a-z0-9]{6,30})$/.exec(path);
  if (rpm && method === "PATCH") {
    const b = await readJson(request);
    const r = await env.DB.prepare("SELECT * FROM store_replacements WHERE id = ?").bind(rpm[1]).first<RepRow>();
    if (!r) return json({ error: "No such request." }, 404);
    const status = b?.status === undefined ? r.status : str(b.status, 20);
    if (!REP_STATUSES.includes(status as RepStatus)) return json({ error: `Status must be one of: ${REP_STATUSES.join(", ")}.` }, 400);
    const note = typeof b?.note === "string" ? longStr(b.note, 600) || null : r.note;
    await env.DB.prepare("UPDATE store_replacements SET status = ?, note = ?, updated_at = ? WHERE id = ?").bind(status, note, Date.now(), r.id).run();
    if (status !== r.status && r.email) {
      const p = byId.get(Number(r.product_id));
      await sendEmail(env, r.email, `Order ${r.order_id}: ${REP_LABEL[status as RepStatus]}`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">${escapeHtml(REP_LABEL[status as RepStatus])}</h2>
<p style="margin:0 0 8px;font-size:14px;line-height:1.6;">Your request about <b>${escapeHtml(p ? p.name : "an item")}</b> in order <b>${escapeHtml(r.order_id)}</b>.</p>
${note ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;">${escapeHtml(note)}</p>` : ""}
<p style="margin:0;font-size:14px;">See it on your order at <a href="${SITE_URL}/orders">aethex.in/orders</a>.</p>`)).catch(() => false);
    }
    return json({ replacement: repOut({ ...r, status, note }) });
  }

  /* update 76: product questions */
  if (path === "questions" && method === "GET") {
    const status = str(url.searchParams.get("status"), 20);
    const ok = ["pending", "answered", "hidden"].includes(status);
    const { results } = await env.DB.prepare(`SELECT * FROM store_questions${ok ? " WHERE status = ?" : ""} ORDER BY created_at DESC LIMIT 200`).bind(...(ok ? [status] : [])).all<QuestionRow>();
    return json({
      questions: results.map((r) => {
        const p = byId.get(Number(r.product_id));
        return { ...toQuestion(r), status: r.status, email: r.email, product: p ? { id: p.id, name: isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`, href: itemHref(p.id, p.slug) } : null };
      }),
    });
  }
  const qm = /^questions\/(q[a-z0-9]{6,30})$/.exec(path);
  if (qm && method === "PATCH") {
    const b = await readJson(request);
    if (!b) return json({ error: "Send the changes as JSON." }, 400);
    const r = await env.DB.prepare("SELECT * FROM store_questions WHERE id = ?").bind(qm[1]).first<QuestionRow>();
    if (!r) return json({ error: "No such question." }, 404);
    const answer = typeof b.answer === "string" ? longStr(b.answer, 1500) : r.answer;
    let status = b.status === undefined ? r.status : str(b.status, 20);
    if (!["pending", "answered", "hidden"].includes(status)) return json({ error: "Status must be pending, answered or hidden." }, 400);
    if (status !== "hidden" && answer) status = "answered";
    if (status === "answered" && !answer) return json({ error: "Write the answer first." }, 400);
    const now = Date.now();
    const first = status === "answered" && !r.answered_at;
    await env.DB.prepare("UPDATE store_questions SET answer = ?, status = ?, answered_at = ? WHERE id = ?").bind(answer || null, status, status === "answered" ? (r.answered_at ?? now) : r.answered_at, r.id).run();
    const p = byId.get(Number(r.product_id));
    if (first && r.email && p) {
      const name = isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`;
      await sendEmail(env, r.email, `Your question about ${name} has been answered`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">Your question has an answer</h2>
<p style="margin:0 0 6px;font-size:14px;color:#475467;">${escapeHtml(name)}</p>
<p style="margin:0 0 10px;font-size:14px;line-height:1.55;"><b>You asked:</b> ${escapeHtml(r.question)}</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.55;"><b>Answer from Aethex:</b> ${escapeHtml(answer ?? "")}</p>
<p style="margin:0;font-size:14px;"><a href="${SITE_URL}${itemHref(p.id, p.slug)}#questions">See it on the product page</a></p>`)).catch(() => false);
    }
    return json({ question: { ...toQuestion({ ...r, answer: answer || null, status, answered_at: status === "answered" ? (r.answered_at ?? now) : r.answered_at }), status, email: r.email } });
  }

  /* update 76: HSN codes and GST rates by category, for invoices */
  if (path === "tax" && method === "POST") {
    const b = await readJson(request);
    const rows = Array.isArray(b?.rates) ? b!.rates : null;
    if (!rows) return json({ error: "Send the rates as a list." }, 400);
    const cats = new Set(catalog.categories.map((c) => c.slug));
    const now = Date.now();
    for (const x of rows.slice(0, 200)) {
      const cat = str(x?.category, 80);
      if (!cats.has(cat) && cat !== "books") return json({ error: `Unknown category: ${cat}` }, 400);
      const hsn = str(x?.hsn, 8).replace(/\D/g, "");
      if (!hsn && (x?.rate === "" || x?.rate == null)) { await env.DB.prepare("DELETE FROM store_tax WHERE category = ?").bind(cat).run(); continue; }
      const rate = Number(x?.rate);
      if (!/^\d{4,8}$/.test(hsn)) return json({ error: `The HSN code for ${cat} should be 4 to 8 digits.` }, 400);
      if (![0, 0.25, 3, 5, 12, 18, 28, 40].includes(rate)) return json({ error: `The GST rate for ${cat} should be one of 0, 0.25, 3, 5, 12, 18, 28 or 40 %.` }, 400);
      await env.DB.prepare("INSERT INTO store_tax (category, hsn, rate, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(category) DO UPDATE SET hsn = excluded.hsn, rate = excluded.rate, updated_at = excluded.updated_at").bind(cat, hsn, rate, now).run();
    }
    return json(await taxTable(env));
  }

  /* reviews */
  if (path === "reviews" && method === "GET") {
    const status = str(url.searchParams.get("status"), 20);
    const ok = ["pending", "approved", "rejected"].includes(status);
    const { results } = await env.DB.prepare(`SELECT * FROM store_reviews${ok ? " WHERE status = ?" : ""} ORDER BY updated_at DESC LIMIT 200`).bind(...(ok ? [status] : [])).all<ReviewRow>();
    return json({
      reviews: results.map((r) => {
        const p = byId.get(Number(r.product_id));
        return { ...toReview(r), status: r.status, orderId: r.order_id, updatedAt: r.updated_at, product: p ? { id: p.id, slug: p.slug, name: isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`, href: itemHref(p.id, p.slug) } : null };
      }),
    });
  }
  const rm = /^reviews\/([A-Z0-9-]{6,24})$/.exec(path);
  if (rm && method === "PATCH") {
    const b = await readJson(request);
    if (!b) return json({ error: "Send the changes as JSON." }, 400);
    const r = await env.DB.prepare("SELECT * FROM store_reviews WHERE id = ?").bind(rm[1]).first<ReviewRow>();
    if (!r) return json({ error: "No such review." }, 404);
    const status = b.status === undefined ? r.status : str(b.status, 20);
    if (!["pending", "approved", "rejected"].includes(status)) return json({ error: "Status must be pending, approved or rejected." }, 400);
    const reply = typeof b.reply === "string" ? longStr(b.reply, 1000) : r.reply;
    const now = Date.now();
    await env.DB.prepare("UPDATE store_reviews SET status = ?, reply = ?, updated_at = ? WHERE id = ?").bind(status, reply || null, now, r.id).run();
    forgetRatings();
    return json({ review: { ...toReview({ ...r, reply: reply || null }), status, orderId: r.order_id, updatedAt: now } });
  }

  return json({ error: "Not found" }, 404);
}

/* ------------------------------------------------------------------ requests (price, books, bulk, call me back to order) */

const KINDS: EnquiryKind[] = ["price", "book", "bulk", "general", "callback"];
/** When a buyer who'd rather order by phone would like the call. */
export const CALL_TIMES: Record<string, string> = { any: "Any time", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

async function createEnquiry(request: Request, env: DBEnv): Promise<Response> {
  const b = await readJson(request);
  if (!b) return json({ error: "Please fill in the form." }, 400);
  if (str(b.website, 100)) return json({ ok: true, id: "AXQ-OK" }); // a field people never see: bots fill it
  const kind = (KINDS.includes(b.kind) ? b.kind : "general") as EnquiryKind;
  const name = str(b.name, 80);
  const phone = normPhone(b.phone);
  const email = normEmail(b.email).slice(0, 254);
  const city = str(b.city, 60);
  const message = longStr(b.message, 1000);
  const p = Number.isFinite(Number(b.productId)) ? byId.get(Number(b.productId)) : undefined;
  const variant = p?.variants?.find((v) => v.id === b.variantId);
  let item = p ? (isBookId(p.id) ? `${p.name}, ${brandName(p.brand)}` : `${brandName(p.brand)} ${p.name}${variant ? ` (${variant.label})` : ""}`) : str(b.item, 200);
  let qty = Math.max(1, Math.min(9999, Math.trunc(Number(b.qty)) || 1));
  // Call me back to order: a cart (priced here, as at checkout), or one product, and when to call.
  let cart: Quote | null = null;
  const when = str(b.when, 20);
  const callAt = kind === "callback" ? (Object.prototype.hasOwnProperty.call(CALL_TIMES, when) ? CALL_TIMES[when] : CALL_TIMES.any) : "";
  if (kind === "callback" && Array.isArray(b.lines) && b.lines.length) {
    cart = quoteLines(b.lines as CartLine[], await finder(env));
    if (cart.lines.length) {
      item = `${cart.lines.map((l) => `${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} ×${l.qty}`).join(", ")}`.slice(0, 600);
      qty = cart.count;
    } else cart = null;
  }
  const notes = kind === "callback" ? [`Best time to call: ${callAt}`, message].filter(Boolean).join("\n") : message;
  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!phone) return json({ error: "Please enter a 10-digit Indian mobile number." }, 400);
  if (email && !validEmail(email)) return json({ error: "That email address doesn't look right." }, 400);
  if (!item && kind !== "general" && kind !== "callback" && !message) return json({ error: "Tell us which product you need." }, 400);
  const ip = clientIp(request);
  if (!(await allow(env, `store:enq:ip:${ip}`, 8, 3600_000)) || !(await allow(env, `store:enq:phone:${phone}`, 6, 86400_000))) {
    return json({ error: "We've received several requests from you already. We'll be in touch soon." }, 429);
  }
  const user = await currentUser(request, env).catch(() => null);
  const id = `AXQ-${orderId().slice(2)}`;
  await env.DB.prepare("INSERT INTO store_enquiries (id, created_at, kind, product_id, variant_id, item, name, phone, email, city, qty, message, status, user_id, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)")
    .bind(id, Date.now(), kind, p?.id ?? null, variant?.id ?? null, item || null, name, phone, email || null, city || null, qty, notes || null, user?.id ?? null, ip).run();
  const what = { price: "Price request", book: "Book request", bulk: "Bulk order request", general: "Question", callback: "Call back to take an order" }[kind];
  const productUrl = p ? `${SITE_URL}${itemHref(p.id, p.slug)}` : "";
  // The cart they'd like to order, priced as it is now (the prices are confirmed on the call).
  const cartHtml = cart ? `<table style="width:100%;border-collapse:collapse;margin:6px 0 10px;">${cart.lines.map((l) => `<tr><td style="padding:7px 0;border-bottom:1px solid #EDF0F4;font-size:14px;">${escapeHtml(l.name)}${l.variantLabel ? ` <span style="color:#718096;">(${escapeHtml(l.variantLabel)})</span>` : ""}</td><td style="padding:7px 0;border-bottom:1px solid #EDF0F4;font-size:14px;color:#718096;text-align:center;">&times;${l.qty}</td><td style="padding:7px 0;border-bottom:1px solid #EDF0F4;font-size:14px;text-align:right;">${money(l.lineTotal)}</td></tr>`).join("")}<tr><td colspan="2" style="padding:7px 0;font-size:14px;font-weight:700;">Total with delivery</td><td style="padding:7px 0;font-size:14px;font-weight:700;text-align:right;">${money(cart.total)}</td></tr></table>` : "";
  const itemLine = cart ? `${cart.count} item${cart.count === 1 ? "" : "s"}, ${rupees(cart.total)}` : item;
  await Promise.allSettled([
    sendEmail(env, storeInbox(env), `${what}: ${kind === "callback" ? `${name}, ${phone}` : item || name} (${id})`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">${what}</h2>
${kind === "callback" ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><b>Call ${escapeHtml(name)} on <a href="tel:+91${phone}">+91 ${escapeHtml(phone)}</a></b> · ${escapeHtml(callAt)}</p>` : ""}
${cartHtml || `<p style="margin:0 0 6px;font-size:14px;line-height:1.6;"><b>${escapeHtml(item || (kind === "callback" ? "They'd like to order by phone" : "General question"))}</b>${productUrl ? ` · <a href="${productUrl}">product page</a>` : ""}${item ? `<br>Quantity: ${qty}` : ""}</p>`}
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;">${escapeHtml(name)} · ${escapeHtml(phone)}${email ? ` · ${escapeHtml(email)}` : ""}${city ? ` · ${escapeHtml(city)}` : ""}</p>
${message ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>` : ""}
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
    email ? sendEmail(env, email, kind === "callback" ? `We'll call you to take your order (${id})` : `We've got your request (${id})`, shell(kind === "callback"
      ? `<h2 style="margin:0 0 8px;font-size:20px;">Thanks, ${escapeHtml(name.split(" ")[0])}. We'll call you</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">We'll call you on ${escapeHtml(phone)} to take your order${callAt && callAt !== CALL_TIMES.any ? ` (you asked for the ${escapeHtml(callAt.toLowerCase())})` : ""}, usually within one business day. We'll go through the items, the price and how you'd like to pay.</p>
${itemLine ? `<p style="margin:12px 0 0;font-size:14px;"><b>${escapeHtml(itemLine)}</b></p>` : ""}${signoff()}`
      : `<h2 style="margin:0 0 8px;font-size:20px;">Thanks, ${escapeHtml(name.split(" ")[0])}. We've got your request</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${kind === "price" || kind === "bulk" ? "We'll send you the price and availability" : kind === "book" ? "We'll confirm the edition, price and availability" : "We'll get back to you"} on ${escapeHtml(phone)}${email ? " or by email" : ""}, usually within one business day.</p>
<p style="margin:12px 0 0;font-size:14px;"><b>${escapeHtml(item || "Your question")}</b>${kind !== "general" ? ` · quantity ${qty}` : ""}</p>${signoff()}`)) : Promise.resolve(false),
  ]);
  return json({ ok: true, id }, 201);
}

/* ------------------------------------------------------------------ bulk requests (hospitals and medical colleges) */

type BulkRow = {
  id: string; created_at: number; updated_at: number; status: string; segment: string; institution: string; inst_type: string; contact_name: string;
  designation: string | null; phone: string; email: string; gstin: string | null; address: string | null; city: string; state: string; pincode: string;
  need_by: string | null; notes: string | null; items: string; units: number; est_total: number; unpriced: number; admin_note: string | null;
  user_id: string | null; ip: string | null; repeat_every?: number | null; repeat_months?: number | null; customer_note?: string | null;
};

function toBulk(r: BulkRow): BulkRequest {
  const b: BulkRequest = {
    id: r.id, createdAt: r.created_at, status: r.status as BulkStatus, segment: r.segment as Segment, institution: r.institution, instType: r.inst_type,
    contactName: r.contact_name, phone: r.phone, email: r.email, city: r.city, state: r.state, pincode: r.pincode,
    items: parse<BulkItem[]>(r.items, []), units: r.units, estTotal: r.est_total, unpriced: r.unpriced,
  };
  if (r.designation) b.designation = r.designation;
  if (r.gstin) b.gstin = r.gstin;
  if (r.address) b.address = r.address;
  if (r.need_by) b.needBy = r.need_by;
  const schedule = cleanSchedule(r.repeat_every ? { every: r.repeat_every, months: r.repeat_months ?? 0 } : null);
  if (schedule && schedule !== "bad") b.schedule = schedule;
  if (r.notes) b.notes = r.notes;
  if (r.customer_note) b.customerNote = r.customer_note;
  return b;
}

/** When the list is wanted, for the emails: "Needed by 15 Dec 2026", "Every month for 12 months (12 deliveries), the first by 15 Dec 2026". */
function whenText(b: BulkRequest): string {
  if (b.schedule) return `${scheduleText(b.schedule)}${b.needBy ? `, the first by ${formatDay(b.needBy)}` : ""}`;
  return b.needBy ? `Needed by ${formatDay(b.needBy)}` : "";
}

const SEGMENT_NAME: Record<Segment, string> = { hospital: "Hospitals", college: "Medical colleges" };

function bulkItemsHtml(b: BulkRequest) {
  if (!b.items.length) return `<p style="margin:10px 0 0;font-size:13px;color:#4A5568;">No products picked from the site: the request is in the notes.</p>`;
  const rows = b.items.map((i) => `<tr><td style="padding:6px 8px;border-top:1px solid #E2E8F0;font-size:13px;"><a href="${SITE_URL}${itemHref(i.productId, i.slug)}" style="color:#1A202C;text-decoration:none;">${escapeHtml(isBookId(i.productId) ? `${i.name}, ${brandName(i.brand)}` : `${brandName(i.brand)} ${i.name}`)}</a>${i.variantLabel ? `<br><span style="color:#718096;">${escapeHtml(i.variantLabel)}</span>` : ""}${i.inStock ? "" : `<br><span style="color:#B45309;">Out of stock on the site</span>`}</td>
<td style="padding:6px 8px;border-top:1px solid #E2E8F0;font-size:13px;text-align:right;white-space:nowrap;">${i.qty.toLocaleString("en-IN")}</td>
<td style="padding:6px 8px;border-top:1px solid #E2E8F0;font-size:13px;text-align:right;white-space:nowrap;">${i.unitPrice === null ? "On request" : money(i.unitPrice)}</td></tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:10px 0 0;"><tr><th style="text-align:left;padding:6px 8px;font-size:12px;color:#718096;">Product</th><th style="text-align:right;padding:6px 8px;font-size:12px;color:#718096;">Quantity</th><th style="text-align:right;padding:6px 8px;font-size:12px;color:#718096;">Store price (each)</th></tr>${rows}</table>
<p style="margin:10px 0 0;font-size:13px;color:#4A5568;">${b.units.toLocaleString("en-IN")} units${b.estTotal ? ` · ${money(b.estTotal)} at store prices` : ""}${b.unpriced ? ` · ${b.unpriced} item${b.unpriced === 1 ? "" : "s"} priced on request` : ""}</p>`;
}

async function createBulkRequest(request: Request, env: DBEnv): Promise<Response> {
  const b = await readJson(request, 65_536);
  if (!b) return json({ error: "Please fill in the form." }, 400);
  if (str(b.website, 100)) return json({ ok: true, id: "AXB-OK" }, 201); // a field people never see: bots fill it
  const segment: Segment | null = b.segment === "hospital" || b.segment === "college" ? b.segment : null;
  if (!segment) return json({ error: "Choose whether this is for a hospital or a medical college." }, 400);
  const institution = str(b.institution, 120);
  const typeIn = str(b.instType, 40);
  const instType = INSTITUTION_TYPES[segment].includes(typeIn) ? typeIn : "Other";
  const contactName = str(b.contactName, 80);
  const designation = str(b.designation, 80);
  const phone = normPhone(b.phone);
  const email = normEmail(b.email).slice(0, 254);
  const gstin = str(b.gstin, 20).toUpperCase().replace(/\s/g, "");
  const address = longStr(b.address, 300);
  const city = str(b.city, 60);
  const state = str(b.state, 60);
  const pincode = String(b.pincode ?? "").trim();
  const needBy = /^\d{4}-\d{2}-\d{2}$/.test(str(b.needBy, 10)) ? str(b.needBy, 10) : "";
  const schedule = cleanSchedule(b.schedule);
  const notes = longStr(b.notes, 1500);
  const field = (f: string, error: string) => json({ error, field: f }, 400);
  if (institution.length < 3) return field("institution", "Please enter the name of your institution.");
  if (contactName.length < 2) return field("contactName", "Please enter the name of the person we should contact.");
  if (!phone) return field("phone", "Please enter a 10-digit Indian mobile number.");
  if (!validEmail(email)) return field("email", "Please enter an email address: the quotation is sent there.");
  if (gstin && !validGstin(gstin)) return field("gstin", "That GSTIN doesn't look right (15 characters, like 27ABCDE1234F1Z5). Leave it empty if you don't have one.");
  if (city.length < 2) return field("city", "Please enter the city.");
  if (!INDIAN_STATES.includes(state)) return field("state", "Please choose the state.");
  if (!validPincode(pincode)) return field("pincode", "Please enter the 6-digit PIN code.");
  if (schedule === "bad") return field("schedule", "Choose how often to repeat the delivery: every month, 2 months or 3 months, for 6 or 12 months or until you stop it.");
  const priced = priceBulk(b.lines, await finder(env));
  if (priced.issues.length) return json({ error: "Some items in your list need attention: choose an option for them, or remove them.", issues: priced.issues }, 409);
  if (!priced.items.length && notes.length < 15) return field("notes", "Add products to your list, or describe what you need in the notes.");
  const ip = clientIp(request);
  if (!(await allow(env, `store:bulk:ip:${ip}`, 6, 3600_000)) || !(await allow(env, `store:bulk:email:${email}`, 6, 86400_000))) {
    return json({ error: "We've received several requests from you already. We'll be in touch soon." }, 429);
  }
  const user = await currentUser(request, env).catch(() => null);
  const now = Date.now();
  const req: BulkRequest = {
    id: `AXB-${orderId().slice(2)}`, createdAt: now, status: "new", segment, institution, instType, contactName, phone, email, city, state, pincode,
    items: priced.items, units: priced.units, estTotal: priced.estTotal, unpriced: priced.unpriced,
  };
  if (designation) req.designation = designation;
  if (gstin) req.gstin = gstin;
  if (address) req.address = address;
  if (needBy) req.needBy = needBy;
  if (schedule) req.schedule = schedule;
  if (notes) req.notes = notes;
  await env.DB.prepare(`INSERT INTO store_bulk_requests (id, created_at, updated_at, status, segment, institution, inst_type, contact_name, designation, phone, email, gstin, address, city, state, pincode, need_by, notes, items, units, est_total, unpriced, user_id, ip, repeat_every, repeat_months)
    VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(req.id, now, now, segment, institution, instType, contactName, designation || null, phone, email, gstin || null, address || null, city, state, pincode,
      needBy || null, notes || null, JSON.stringify(req.items), req.units, req.estTotal, req.unpriced, user?.id ?? null, ip,
      req.schedule?.every ?? null, req.schedule?.months ?? null).run();
  const who = `${escapeHtml(contactName)}${designation ? `, ${escapeHtml(designation)}` : ""}<br>${escapeHtml(institution)} (${escapeHtml(instType)})`;
  const where = `${address ? `${escapeHtml(address)}<br>` : ""}${escapeHtml(city)}, ${escapeHtml(state)} ${escapeHtml(pincode)}`;
  const when = whenText(req);
  const results = await Promise.allSettled([
    sendEmail(env, email, `We've got your bulk request (${req.id})`, shell(`<h2 style="margin:0 0 8px;font-size:20px;">Thanks, ${escapeHtml(contactName.split(" ")[0])}. We've got your request</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">We'll send the quotation for ${escapeHtml(institution)} to this email address, usually within one business day, and may call you on ${escapeHtml(phone)} to check the details. Your reference is <b>${req.id}</b>.</p>
${bulkItemsHtml(req)}
${when ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;"><b>Delivery:</b> ${escapeHtml(when)}.${req.schedule ? " We'll quote the whole schedule." : ""}</p>` : ""}
${notes ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;"><b>Your notes:</b> ${escapeHtml(notes)}</p>` : ""}
<p style="margin:12px 0 0;font-size:13px;color:#718096;line-height:1.5;">Store prices are a guide: the quotation gives your price for these quantities, with delivery to ${escapeHtml(city)}.</p>${signoff()}`)),
    sendEmail(env, storeInbox(env), `Bulk request ${req.id}: ${institution}, ${city} (${req.units ? `${req.units.toLocaleString("en-IN")} units` : "see notes"}${req.schedule ? `, ${everyText(req.schedule.every)}` : ""})`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">New bulk request · ${SEGMENT_NAME[segment]}</h2>
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;">${who}<br><a href="tel:+91${phone}">+91 ${escapeHtml(phone)}</a> · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>${gstin ? `<br>GSTIN ${escapeHtml(gstin)}` : ""}</p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.6;">${where}${when ? `<br>${req.schedule ? `<b>Repeat delivery: ${escapeHtml(when)}</b>` : escapeHtml(when)}` : ""}</p>
${bulkItemsHtml(req)}
${notes ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;"><b>Notes:</b> ${escapeHtml(notes)}</p>` : ""}
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
  ]);
  const emailed = results[0].status === "fulfilled" && results[0].value === true;
  return json({ ok: true, id: req.id, units: req.units, estTotal: req.estTotal, unpriced: req.unpriced, emailed }, 201);
}

/* ------------------------------------------------------------------ the contact form */

const TOPICS = ["An order", "A product", "Returns or replacement", "Bulk or institutional purchase", "Cadus", "Study Hub", "Something else"];

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

/* ------------------------------------------------------------------ who may see an order */

const rowById = (db: DBEnv, id: string) => db.DB.prepare("SELECT * FROM store_orders WHERE id = ?").bind(id).first<OrderRow>();
/** Rows an UPDATE changed (D1 reports them in meta). */
const changes = (res: unknown) => Number((res as { meta?: { changes?: number }; changes?: number })?.meta?.changes ?? (res as { changes?: number })?.changes ?? 0);

/** The order, if the request may see it: the browser that placed it (its token), its account, or the order number with the phone. */
async function orderFor(request: Request, db: DBEnv, idIn: unknown, phoneIn?: unknown): Promise<{ r: OrderRow; full: boolean } | Response> {
  const id = cleanOrderId(idIn);
  const token = str(request.headers.get("x-order-token"), 64);
  const r = id ? await rowById(db, id) : null;
  let full = false, allowed = false;
  if (r && token && (await sha256(token)) === r.token_hash) { full = true; allowed = true; }
  if (r && !allowed) {
    const user = await currentUser(request, db).catch(() => null);
    if (user && (r.user_id === user.id || (r.email && r.email === normEmail(user.email)))) { full = true; allowed = true; }
  }
  if (!allowed && phoneIn !== undefined && phoneIn !== null && phoneIn !== "") {
    if (!(await allow(db, `store:lookup:ip:${clientIp(request)}`, 30, 3600_000))) return json({ error: "Too many tries. Please wait a while and try again." }, 429);
    const phone = normPhone(phoneIn);
    if (r && phone && phone === r.phone) allowed = true;
  }
  if (!r || !allowed) return json({ error: "We couldn't find an order with that number and phone. Please check both and try again." }, 404);
  return { r, full };
}

type ReviewMark = { status: ReviewStatus; rating: number; title?: string; body: string; name: string; city?: string };
/** The buyer's own reviews of a delivered order's items, by order and product: what the order page shows next to each item (and edits). */
async function reviewsFor(db: DBEnv, orderIds: string[]): Promise<Map<string, Record<number, ReviewMark>>> {
  const out = new Map<string, Record<number, ReviewMark>>();
  const ids = orderIds.slice(0, 90);
  if (!ids.length) return out;
  const { results } = await db.DB.prepare(`SELECT order_id, product_id, status, rating, title, body, name, city FROM store_reviews WHERE order_id IN (${ids.map(() => "?").join(",")})`)
    .bind(...ids).all<{ order_id: string; product_id: number; status: ReviewStatus; rating: number; title: string | null; body: string; name: string; city: string | null }>();
  for (const x of results) {
    const m = out.get(x.order_id) ?? {};
    m[Number(x.product_id)] = { status: x.status, rating: Number(x.rating), body: x.body, name: x.name, ...(x.title ? { title: x.title } : {}), ...(x.city ? { city: x.city } : {}) };
    out.set(x.order_id, m);
  }
  return out;
}

/* ------------------------------------------------------------------ coupons */

type CouponRow = { code: string; created_at: number; updated_at: number; data: string };

async function loadCoupon(db: DBEnv, code: string): Promise<Coupon | null> {
  const r = await db.DB.prepare("SELECT * FROM store_coupons WHERE code = ?").bind(code).first<CouponRow>();
  const c = r ? parse<Coupon | null>(r.data, null) : null;
  return c && r ? { ...c, code: r.code } : null;
}

/** Orders that count as using a code: placed ones (not cancelled, and not still waiting for their online payment). */
const USED = "status NOT IN ('cancelled', 'pending')";
async function couponUses(db: DBEnv, code: string, phone?: string): Promise<{ all: number; mine: number }> {
  const all = await db.DB.prepare(`SELECT COUNT(*) AS n FROM store_orders WHERE coupon = ? AND ${USED}`).bind(code).first<{ n: number }>();
  const mine = phone ? await db.DB.prepare(`SELECT COUNT(*) AS n FROM store_orders WHERE coupon = ? AND phone = ? AND ${USED}`).bind(code, phone).first<{ n: number }>() : null;
  return { all: Number(all?.n) || 0, mine: Number(mine?.n) || 0 };
}

/** The quote with a coupon taken off, once the code is checked: running, not used up (in all, or by this phone), and covering the cart. */
async function withCoupon(db: DBEnv, quote: Quote, codeIn: unknown, find: (id: number) => Product | null, phone?: string): Promise<{ quote: Quote; coupon: Coupon } | { error: string }> {
  const code = cleanCouponCode(codeIn);
  if (!code) return { error: "That doesn't look like a coupon code." };
  const c = await loadCoupon(db, code);
  const now = Date.now();
  if (!c || !c.active) return { error: `${code} isn't a valid code.` };
  if (c.startsAt && c.startsAt > now) return { error: `${code} can't be used yet.` };
  if (c.endsAt && now >= c.endsAt) return { error: `${code} has expired.` };
  const uses = await couponUses(db, code, phone);
  if (c.limit && uses.all >= c.limit) return { error: `${code} has been used up.` };
  if (phone && c.perPhone && uses.mine >= c.perPhone) return { error: `You've already used ${code}${c.perPhone > 1 ? ` ${c.perPhone} times` : ""}.` };
  const r = applyCoupon(quote, publicCoupon(c), (id) => { const p = find(id); return p ? { category: p.category, brand: p.brand } : undefined; });
  return "error" in r ? r : { quote: r, coupon: c };
}

const known = {
  categories: () => new Set([...catalog.categories.map((c) => c.slug), "books"]),
  brands: () => new Set([...catalog.brands.map((b) => b.slug), ...bookCatalog.publishers.map((p) => p.slug)]),
};
/** A date from the admin: milliseconds, or "YYYY-MM-DD" (India time; an end date runs to the end of that day). */
function when2ms(v: unknown, end = false): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.round(v);
  const s = str(v, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const t = Date.parse(`${s}T${end ? "23:59:59" : "00:00:00"}+05:30`);
  return Number.isFinite(t) ? t + (end ? 1000 : 0) : undefined;
}
const intIn = (v: unknown, lo: number, hi: number) => { const n = Math.trunc(Number(v)); return v !== "" && v !== null && Number.isFinite(n) && n >= lo && n <= hi ? n : undefined; };
const pickSlugs = (v: unknown, ok: Set<string>) => (Array.isArray(v) ? Array.from(new Set(v.map((x) => str(x, 60)).filter((x) => ok.has(x)))) : []);

function cleanCoupon(raw: Record<string, any>, codeIn: unknown): Coupon | { error: string } {
  const code = cleanCouponCode(codeIn);
  if (!code) return { error: "A code is 3 to 20 letters and digits, like DIWALI10." };
  const kind = raw.kind === "amount" ? "amount" : "percent";
  const value = kind === "percent" ? intIn(raw.value, 1, 90) : intIn(raw.value, 1, 100_000);
  if (value === undefined) return { error: kind === "percent" ? "The discount is a percent from 1 to 90." : "The discount is an amount from ₹1." };
  const minOrder = raw.minOrder === undefined || raw.minOrder === "" || raw.minOrder === null ? 0 : intIn(raw.minOrder, 0, 1_000_000);
  if (minOrder === undefined) return { error: "Check the minimum order." };
  if (kind === "amount" && minOrder && value > minOrder) return { error: "The discount can't be more than the minimum order." };
  const c: Coupon = { code, kind, value, minOrder, active: raw.active !== false };
  if (kind === "percent" && raw.maxDiscount !== undefined && raw.maxDiscount !== "" && raw.maxDiscount !== null) {
    const m = intIn(raw.maxDiscount, 1, 1_000_000); if (m === undefined) return { error: "Check the most it can take off." }; c.maxDiscount = m;
  }
  const startsAt = when2ms(raw.startsAt), endsAt = when2ms(raw.endsAt, true);
  if (startsAt) c.startsAt = startsAt;
  if (endsAt) c.endsAt = endsAt;
  if (startsAt && endsAt && endsAt <= startsAt) return { error: "The end date must come after the start date." };
  for (const k of ["limit", "perPhone"] as const) {
    if (raw[k] === undefined || raw[k] === "" || raw[k] === null) continue;
    const n = intIn(raw[k], 1, 1_000_000); if (n === undefined) return { error: k === "limit" ? "Check how many orders can use it." : "Check how many times one customer can use it." }; c[k] = n;
  }
  const categories = pickSlugs(raw.categories, known.categories()), brands = pickSlugs(raw.brands, known.brands());
  if (categories.length) c.categories = categories;
  if (brands.length) c.brands = brands;
  const label = str(raw.label, 60);
  if (label) c.label = label;
  if (raw.public === true) c.public = true; // update 80: listed on the offers page
  return c;
}

function cleanOffer(raw: Record<string, any>, id: string): Offer | { error: string } {
  const title = str(raw.title, 60);
  if (title.length < 3) return { error: "Give the offer a name shoppers will see, like \"Diwali sale\"." };
  const percent = intIn(raw.percent, 1, 90);
  if (percent === undefined) return { error: "The offer takes 1 to 90 percent off." };
  const categories = pickSlugs(raw.categories, known.categories()), brands = pickSlugs(raw.brands, known.brands());
  if (!categories.length && !brands.length) return { error: "Choose the categories or brands the offer is on." };
  const o: Offer = { id, title, percent, categories, brands, active: raw.active !== false };
  const startsAt = when2ms(raw.startsAt), endsAt = when2ms(raw.endsAt, true);
  if (startsAt) o.startsAt = startsAt;
  if (endsAt) o.endsAt = endsAt;
  if (startsAt && endsAt && endsAt <= startsAt) return { error: "The end date must come after the start date." };
  return o;
}

/* ------------------------------------------------------------------ order emails */

const itemCount = (o: Order) => o.lines.reduce((s, l) => s + l.qty, 0);

/** The emails for a newly placed order, to the customer and the store. True when the customer's went out. */
async function placedEmails(db: DBEnv, o: Order, paymentId?: string): Promise<boolean> {
  const a = o.address;
  const paid = isPaid(o);
  const via = o.payment === "bank" ? "by bank transfer" : o.total <= 0 && o.credit ? "with store credit" : "online";
  const n = itemCount(o);
  const results = await Promise.allSettled([
    a.email ? sendEmail(db, a.email, `Order ${o.id} placed: ${rupees(o.total)} ${paid ? "paid" : "cash on delivery"}`, customerEmail(o, "placed")) : Promise.resolve(false),
    sendEmail(db, storeInbox(db), `New order ${o.id}: ${rupees(o.total)} ${paid ? `paid ${via}` : "COD"}${o.gift ? ", gift" : ""}, ${a.city} ${a.pincode}`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">${paid ? `New order, paid ${via}` : "New cash-on-delivery order"}</h2>
<p style="margin:0 0 4px;font-size:14px;">Order <b>${o.id}</b> · ${n} item${n === 1 ? "" : "s"} · <b>${money(o.total)}</b>${o.coupon ? ` · coupon ${escapeHtml(o.coupon)}` : ""}${paymentId ? ` · Razorpay payment ${escapeHtml(paymentId)}` : ""}${o.bankRef ? ` · bank reference ${escapeHtml(o.bankRef)}` : ""}</p>
${linesHtml(o)}${extrasHtml(o, true)}<p style="margin:12px 0 0;font-size:14px;line-height:1.5;">${addressHtml(a)}${a.email ? `<br>${escapeHtml(a.email)}` : ""}</p>
${o.notes ? `<p style="margin:10px 0 0;font-size:14px;"><b>Note:</b> ${escapeHtml(o.notes)}</p>` : ""}
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
  ]);
  return results[0].status === "fulfilled" && results[0].value === true;
}

function refundEmail(o: Order, amount: number, why: string) {
  return shell(`<h2 style="margin:0 0 8px;font-size:20px;">We've refunded ${money(amount)}</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${escapeHtml(why)}. The refund for order <b>${escapeHtml(o.id)}</b> goes back to the account, card or UPI app you paid with, and usually reaches you in 5 to 7 business days.</p>
${button(trackUrl(o.id), "View your order")}${signoff()}`);
}

/** The account to pay into and the reference to use, as an email table. */
function bankHtml(o: Order, bank: BankDetails): string {
  const row = (k: string, v: string) => `<tr><td style="padding:6px 10px;color:#4A5568;font-size:14px;">${k}</td><td style="padding:6px 10px;font-size:14px;font-weight:700;">${escapeHtml(v)}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;margin:10px 0;background:#F7F8FA;border-radius:8px;">${row("Amount", rupees(o.total))}${row("Account name", bank.accountName)}${row("Account number", bank.accountNumber)}${row("IFSC", bank.ifsc)}${bank.bankName ? row("Bank", bank.bankName) : ""}${row("Reference", o.id)}</table>`;
}

/** An order to be paid by bank transfer: how to pay, to the customer; what's coming, to the store. */
async function bankOrderEmails(db: DBEnv, o: Order, bank: BankDetails): Promise<boolean> {
  const a = o.address;
  const first = greetName(o);
  const results = await Promise.allSettled([
    a.email ? sendEmail(db, a.email, `Order ${o.id}: pay ${rupees(o.total)} by bank transfer`, shell(`<h2 style="margin:0 0 8px;font-size:20px;">Thank you${first ? `, ${first}` : ""}. Here's how to pay</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">Send ${money(o.total)} by NEFT, RTGS or IMPS to the account below, with your order number <b>${escapeHtml(o.id)}</b> as the reference. We confirm your order once the money arrives, and ship it ${escapeHtml(BUSINESS.dispatch)}. If it hasn't arrived in ${BANK_DAYS} days, the order is cancelled.</p>
${bankHtml(o, bank)}${linesHtml(o)}${extrasHtml(o)}
<p style="margin:14px 0 0;font-size:13px;color:#4A5568;line-height:1.5;"><b>Delivering to</b><br>${addressHtml(a)}</p>
${button(trackUrl(o.id), "View your order")}${signoff()}`)) : Promise.resolve(false),
    sendEmail(db, storeInbox(db), `New order ${o.id}: ${rupees(o.total)} by bank transfer (not paid yet), ${a.city} ${a.pincode}`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">New order, to be paid by bank transfer</h2>
<p style="margin:0 0 4px;font-size:14px;">Order <b>${o.id}</b> · <b>${money(o.total)}</b>. When the transfer reaches the account (reference ${escapeHtml(o.id)}), mark it paid in the store admin: the customer is told and the order is placed. Unpaid after ${BANK_DAYS} days, it's cancelled.</p>
${linesHtml(o)}${extrasHtml(o, true)}<p style="margin:12px 0 0;font-size:14px;line-height:1.5;">${addressHtml(a)}${a.email ? `<br>${escapeHtml(a.email)}` : ""}</p>
${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
  ]);
  return results[0].status === "fulfilled" && results[0].value === true;
}

/* ------------------------------------------------------------------ online payments (Razorpay) */

/** What the site's checkout needs to open Razorpay for an order. */
function checkoutFor(env: StoreEnv, o: Order, rzpOrderId: string) {
  return {
    key: env.RAZORPAY_KEY_ID, orderId: rzpOrderId, amount: paise(o.total), currency: "INR", name: BUSINESS.brand, description: `Order ${o.id}`,
    prefill: { name: o.address.name, contact: o.address.phone, ...(o.address.email ? { email: o.address.email } : {}) },
  };
}

/**
 * Our record of a payment's refunds, rebuilt from Razorpay's own list: refunds made at the same moment
 * both count, and one that failed later no longer does (the order is then "paid" again, to refund anew).
 */
async function syncRefunds(db: DBEnv, r: OrderRow, atLeast = 0): Promise<NonNullable<Order["refund"]> | null> {
  if (!r.payment_id) return null;
  const list = (await fetchRzpRefunds(db, r.payment_id)).filter((x) => x.status !== "failed");
  const amount = round2(Math.max(atLeast, list.reduce((n, x) => n + x.amount, 0) / 100));
  const latest = list.reduce<RzpRefund | null>((a, x) => (!a || (x.created_at ?? 0) >= (a.created_at ?? 0) ? x : a), null);
  const refund = amount > 0 ? { amount, at: latest?.created_at ? latest.created_at * 1000 : Date.now(), status: list.some((x) => x.status === "pending") ? "pending" : "processed" } : null;
  await db.DB.prepare("UPDATE store_orders SET refund = ?, payment_status = ?, updated_at = ? WHERE id = ? AND payment_status IN ('paid', 'refunded')")
    .bind(refund ? JSON.stringify(refund) : null, refund && refund.amount >= r.total - 0.005 ? "refunded" : "paid", Date.now(), r.id).run();
  return refund;
}

/** Give back an online payment, in full or in part, through Razorpay. */
async function refundOrder(db: DBEnv, r: OrderRow, o: Order, amount: number, why: string): Promise<{ ok: true; refund: NonNullable<Order["refund"]>; amount: number } | { error: string }> {
  if (o.payment !== "online" || !r.payment_id || (o.paymentStatus !== "paid" && o.paymentStatus !== "refunded")) return { error: "This order has no online payment to refund." };
  // What has gone back already, by Razorpay's record (another refund may have just gone through).
  let before = o.refund?.amount ?? 0;
  try { before = (await syncRefunds(db, r))?.amount ?? 0; } catch { /* go by ours */ }
  const amt = round2(Math.min(amount, o.total - before));
  if (amt <= 0) return { error: "This payment has already been refunded in full." };
  let rf: RzpRefund;
  try {
    rf = await refundRzpPayment(db, r.payment_id, paise(amt), { order: o.id, reason: why.slice(0, 200) });
  } catch (e) {
    return { error: e instanceof RazorpayError ? `Razorpay couldn't refund it: ${e.message}` : "The refund didn't go through. Try again from the admin." };
  }
  // Razorpay has the money going back: record it, from its list when it answers, else from this refund.
  const atLeast = round2(before + rf.amount / 100);
  let refund = await syncRefunds(db, r, atLeast).catch(() => null);
  if (!refund) {
    refund = { amount: atLeast, at: Date.now(), status: rf.status };
    await db.DB.prepare("UPDATE store_orders SET refund = ?, payment_status = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(refund), atLeast >= o.total - 0.005 ? "refunded" : "paid", Date.now(), o.id).run();
  }
  o.refund = refund;
  if (refund.amount >= o.total - 0.005) o.paymentStatus = "refunded";
  return { ok: true, refund, amount: round2(rf.amount / 100) };
}

/**
 * Record an online payment, once (from the checkout, Razorpay's webhook, or a look at Razorpay's record).
 * A pending order is placed and both sides are emailed. Paid after the order was cancelled, or after it was
 * delivered and paid in cash, the money goes back; paid after switching to cash on delivery, no cash is due.
 */
async function markPaid(db: DBEnv, r: OrderRow, paymentId: string): Promise<OrderRow> {
  const now = Date.now();
  // One statement: the payment is recorded and a pending order placed together, or neither.
  const res = await db.DB.prepare(`UPDATE store_orders SET
      history = CASE WHEN status = 'pending' THEN json_insert(history, '$[#]', json_object('status', 'placed', 'at', ?, 'note', 'Paid online')) ELSE history END,
      status = CASE WHEN status = 'pending' THEN 'placed' ELSE status END,
      payment = 'online', payment_status = 'paid', payment_id = ?, paid_at = ?, updated_at = ?
    WHERE id = ? AND (payment_status IS NULL OR payment_status = 'pending')`).bind(now, paymentId, now, now, r.id).run();
  const row = (await rowById(db, r.id)) ?? r;
  if (!changes(res)) return row; // recorded already
  const o = toOrder(row);
  const last = o.history[o.history.length - 1];
  if (row.status === "placed" && last?.note === "Paid online" && last.at === now) {
    await placedEmails(db, o, paymentId);
    return row;
  }
  const backTo = async (why: string, storeLine: string) => {
    const done = await refundOrder(db, row, o, o.total, why);
    await Promise.allSettled([
      "error" in done || !o.address.email ? Promise.resolve(false) : sendEmail(db, o.address.email, `Order ${o.id}: ${rupees(done.amount)} refunded`, refundEmail(o, done.amount, why)),
      sendEmail(db, storeInbox(db), `${storeLine}: ${o.id}`, shell(`<p style="margin:0;font-size:14px;line-height:1.6;">Order <b>${o.id}</b> was paid online (${money(o.total)}, Razorpay payment ${escapeHtml(paymentId)}) when ${escapeHtml(why.charAt(0).toLowerCase() + why.slice(1))}. ${"error" in done ? `<b>Refund it from the admin:</b> ${escapeHtml(done.error)}` : "The payment has been refunded."}</p>`)),
    ]);
    return (await rowById(db, r.id)) ?? row;
  };
  if (row.status === "cancelled") return backTo("The order had been cancelled", "Paid after cancelling");
  if (row.status === "delivered") return backTo("The order had already been delivered and paid in cash", "Paid online after a cash delivery");
  // Paid after switching to cash on delivery (not delivered yet): the payment counts, so no cash is due.
  await Promise.allSettled([
    o.address.email ? sendEmail(db, o.address.email, `Order ${o.id}: payment received`, customerEmail(o, o.status, `We've received your online payment of ${rupees(o.total)}, so there's nothing to pay at delivery.`)) : Promise.resolve(false),
    sendEmail(db, storeInbox(db), `Order ${o.id} is paid online: don't collect cash`, shell(`<p style="margin:0;font-size:14px;line-height:1.6;">Order <b>${o.id}</b> (${escapeHtml(o.address.city)}) had switched to cash on delivery, but the customer's online payment of ${money(o.total)} then went through (Razorpay payment ${escapeHtml(paymentId)}). It's marked paid: <b>don't collect cash</b> at delivery${o.status === "shipped" ? ", and tell the courier" : ""}.</p>${button(`${SITE_URL}/admin`, "Open the store admin")}`)),
  ]);
  return row;
}

/** A payment made on Razorpay for this order that never reported back (the page closed first): found and counted. */
async function settleFromRazorpay(db: DBEnv, r: OrderRow): Promise<OrderRow> {
  if (!razorpayReady(db) || !r.payment_ref || r.payment_status === "paid" || r.payment_status === "refunded") return r;
  const want = paise(r.total);
  const payments = await fetchRzpOrderPayments(db, r.payment_ref);
  const fits = (s: string) => payments.find((p) => p.status === s && p.amount === want && p.currency === "INR");
  let pay = fits("captured") ?? fits("authorized");
  if (!pay) return r;
  if (pay.status === "authorized") pay = await captureOrFetch(db, pay.id, pay.amount);
  return pay.status === "captured" ? markPaid(db, r, pay.id) : r;
}

/* ------------------------------------------------------------------ orders: placing and paying */

async function createOrder(request: Request, db: DBEnv): Promise<Response> {
  const b = await readJson(request);
  if (!b) return json({ error: "Please fill in your delivery details." }, 400);
  // The checkout's own key for this order: sent again after a lost answer, it finds the order already made
  // instead of making a second one. It is also the order's browser token (stored only as a hash).
  const key = typeof b.key === "string" && /^[A-Za-z0-9_-]{24,100}$/.test(b.key) ? b.key : "";
  if (key) {
    const made = await db.DB.prepare("SELECT * FROM store_orders WHERE token_hash = ?").bind(await sha256(key)).first<OrderRow>();
    if (made) {
      const checkout = made.status === "pending" && made.payment === "online" && made.payment_ref ? checkoutFor(db, toOrder(made), made.payment_ref) : undefined;
      return json({ order: withBank(db, customerView(made, true)), token: key, emailed: false, ...(checkout ? { checkout } : {}) }, 200);
    }
  }
  const cleaned = cleanAddress(b.address);
  if ("error" in cleaned) return json({ error: cleaned.error, field: "address" }, 400);
  const address = cleaned.address;
  const paymentAsked: PaymentMethod = b.payment === "online" ? "online" : b.payment === "bank" ? "bank" : "cod";
  if (paymentAsked === "online" && !razorpayReady(db)) return json({ error: "Paying online isn't available yet. Please choose cash on delivery.", field: "payment" }, 400);
  const bank = paymentAsked === "bank" ? bankDetails(db) : null;
  if (paymentAsked === "bank" && !bank) return json({ error: "Bank transfer isn't available. Please choose another way to pay.", field: "payment" }, 400);
  // A gift (with its message), and a clinic's or business's name and GSTIN for the invoice.
  let gift: Order["gift"] | undefined;
  if (b.gift && typeof b.gift === "object") {
    const message = longStr(b.gift.message, 300), from = str(b.gift.from, 60), toEmail = normEmail(b.gift.toEmail);
    if (b.gift.toEmail && !toEmail) return json({ error: "Check the recipient's email, or leave it empty.", field: "gift" }, 400);
    // update 84: the recipient can be told when it ships and follow it at a link with no prices on it
    gift = { ...(message ? { message } : {}), ...(from ? { from } : {}), ...(toEmail ? { toEmail } : {}), token: newToken() };
  }
  let business: Order["business"] | undefined;
  if (b.business && typeof b.business === "object") {
    const name = str(b.business.name, 120);
    if (name.length < 2) return json({ error: "Add the clinic or business name, or untick buying for a business.", field: "business" }, 400);
    business = { name };
    const gstin = str(b.business.gstin, 20).replace(/\s+/g, "").toUpperCase();
    if (gstin) {
      if (!validGstin(gstin)) return json({ error: "Check the GSTIN: it's 15 letters and digits, like 27ABCDE1234F1Z5.", field: "gstin" }, 400);
      business.gstin = gstin;
    }
  }
  const find = await finder(db);
  let quote: Quote = quoteLines(Array.isArray(b.lines) ? (b.lines as CartLine[]) : [], find);
  if (quote.issues.length) return json({ error: "Some items in your cart can't be ordered right now. Please review your cart.", quote }, 409);
  if (!quote.lines.length) return json({ error: "Your cart is empty." }, 400);
  let couponCode = "";
  let limits = { all: 0, phone: 0 };
  if (b.coupon) {
    const c = await withCoupon(db, quote, b.coupon, find, address.phone);
    if ("error" in c) return json({ error: c.error, field: "coupon", quote }, 409);
    quote = c.quote; couponCode = c.coupon.code;
    limits = { all: c.coupon.limit ?? 0, phone: c.coupon.perPhone ?? 0 };
  }
  if (typeof b.expectTotal === "number" && Math.abs(b.expectTotal - quote.total) >= 1) return json({ error: "Prices in your cart have changed. Please check the new total.", quote }, 409);
  // update 84: a prescription for the items that need one, and store credit off the total
  const user = await currentUser(request, db).catch(() => null);
  const rxNeeded = quote.lines.some((l) => !!find(l.productId)?.rx);
  let rxFile: { name: string; type: string; size: number; data: string } | null = null;
  if (rxNeeded) { const f = readRxFile(b.rx); if ("error" in f) return json({ error: f.error, field: "rx" }, 400); rxFile = f; }
  let credit = 0;
  if (b.useCredit === true) {
    if (!user) return json({ error: "Sign in to use your store credit.", field: "credit" }, 401);
    credit = Math.min(await creditBalance(db, user.id), quote.total);
  }
  if (credit > 0) quote = { ...quote, total: round2(quote.total - credit) };
  const payment: PaymentMethod = quote.total <= 0 ? "cod" : paymentAsked;
  if (payment === "cod" && quote.total > COD_LIMIT) {
    return json({ error: `Cash on delivery is available on orders up to ₹${COD_LIMIT.toLocaleString("en-IN")}.${razorpayReady(db) ? " Please pay online, or split the order." : " Please split the order, or contact us."}`, field: "payment" }, 400);
  }
  if (payment === "online" && quote.total > ONLINE_LIMIT) return json({ error: `Orders paid online can be up to ₹${ONLINE_LIMIT.toLocaleString("en-IN")}. Please split the order, or contact us.`, field: "payment" }, 400);
  if (payment === "bank" && (quote.total < BANK_MIN || quote.total > BANK_LIMIT)) {
    return json({ error: `Bank transfer is for orders from ₹${BANK_MIN.toLocaleString("en-IN")} up to ₹${BANK_LIMIT.toLocaleString("en-IN")}. Please choose another way to pay.`, field: "payment" }, 400);
  }
  const ip = clientIp(request);
  if (!(await allow(db, `store:order:ip:${ip}`, 8, 3600_000)) || !(await allow(db, `store:order:phone:${address.phone}`, 6, 86400_000))) {
    return json({ error: "Too many orders in a short time. Please try again later, or contact us." }, 429);
  }
  const token = key || newToken();
  const now = Date.now();
  const id = orderId();
  let rzpId = "";
  if (payment === "online") {
    try { rzpId = (await createRzpOrder(db, paise(quote.total), id, { order: id })).id; }
    catch (e) { return json({ error: `${e instanceof RazorpayError ? e.message : "Couldn't start the payment."} Please try again, or choose cash on delivery.` }, 502); }
  }
  // Paid online or by bank transfer, the order waits for its money before it's placed.
  const status: OrderStatus = payment === "cod" ? "placed" : "pending";
  const order: Order = {
    id, createdAt: now, status, payment, address, lines: quote.lines,
    subtotal: quote.subtotal, mrpTotal: quote.mrpTotal, delivery: quote.delivery, total: quote.total,
    history: [{ status, at: now }],
  };
  if (payment !== "cod") order.paymentStatus = "pending";
  if (quote.discount) { order.discount = quote.discount; order.coupon = couponCode; }
  if (gift) order.gift = gift;
  if (business) order.business = business;
  if (credit > 0) order.credit = round2(credit);
  if (rxFile) order.rx = { status: "pending" };
  // Credit is taken first, only while the balance still covers it (two orders at once can't spend it twice).
  const creditId = credit > 0 ? nid("c") : "";
  if (creditId) {
    const took = await db.DB.prepare(`INSERT INTO store_credit (id, user_id, amount, kind, order_id, note, created_at) SELECT ?, ?, ?, 'use', ?, 'Used on an order', ?
      WHERE (SELECT COALESCE(SUM(amount), 0) FROM store_credit WHERE user_id = ? AND NOT (kind = 'use' AND order_id IN (SELECT id FROM store_orders WHERE status = 'cancelled'))) >= ?`).bind(creditId, user!.id, -round2(credit), id, now, user!.id, round2(credit) - 0.005).run();
    if (!changes(took)) return json({ error: "Your store credit has just changed. Please check the total again.", field: "credit" }, 409);
  }
  const notes = longStr(b.notes, 500);
  if (notes) order.notes = notes;
  const email = address.email || (user ? normEmail(user.email) : "");
  // Saved only while a limited code still has uses left (checked in the same statement, so orders
  // placed at the same moment can't go past the limit).
  const saved = await db.DB.prepare(`INSERT INTO store_orders (id, created_at, updated_at, status, user_id, email, phone, name, pincode, address, lines, item_count, subtotal, mrp_total, delivery, total, payment, history, notes, token_hash, ip, payment_status, payment_ref, coupon, discount, gift, business)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (? = 0 OR (SELECT COUNT(*) FROM store_orders WHERE coupon = ? AND ${USED}) < ?)
      AND (? = 0 OR (SELECT COUNT(*) FROM store_orders WHERE coupon = ? AND phone = ? AND ${USED}) < ?)`)
    .bind(order.id, now, now, status, user?.id ?? null, email || null, address.phone, address.name, address.pincode, JSON.stringify(address), JSON.stringify(order.lines),
      quote.count, order.subtotal, order.mrpTotal, order.delivery, order.total, payment, JSON.stringify(order.history), notes || null, await sha256(token), ip,
      payment === "cod" ? null : "pending", rzpId || null, couponCode || null, order.discount ?? null, gift ? JSON.stringify(gift) : null, business ? JSON.stringify(business) : null,
      limits.all, couponCode, limits.all, limits.phone, couponCode, address.phone, limits.phone).run();
  if (!changes(saved)) {
    if (creditId) await db.DB.prepare("DELETE FROM store_credit WHERE id = ?").bind(creditId).run();
    return json({ error: `${couponCode} has just been used up. Remove it to order without it.`, field: "coupon" }, 409);
  }
  if (credit > 0 || rxFile) await db.DB.prepare("UPDATE store_orders SET credit = ?, rx_status = ?, payment_status = CASE WHEN total <= 0 THEN 'paid' ELSE payment_status END WHERE id = ?").bind(credit > 0 ? round2(credit) : null, rxFile ? "pending" : null, order.id).run();
  if (rxFile) await saveRx(db, order.id, rxFile);
  // Kept in the account for next time when asked (one kept already moves to the top of the list).
  if (user && b.saveAddress === true) {
    await keepAddress(db, user.id, address, str(b.addressLabel, 24), false).catch((e) => console.error("store: keeping an address", e));
  }
  // Paying online, the emails go out once the payment comes through (markPaid).
  if (payment === "online") return json({ order: { ...order, canCancel: true }, token, emailed: false, checkout: checkoutFor(db, order, rzpId) }, 201);
  // By bank transfer: how to pay, now; the order is placed when the store sees the money (admin: orders/:id/paid).
  if (payment === "bank" && bank) {
    const emailed = await bankOrderEmails(db, order, bank);
    return json({ order: { ...order, canCancel: true, bank }, token, emailed }, 201);
  }
  const emailed = await placedEmails(db, order);
  return json({ order: { ...order, canCancel: true }, token, emailed }, 201);
}

/** The checkout's report of a payment: it counts once its signature and Razorpay's own record of it check out. */
async function confirmPayment(db: DBEnv, r: OrderRow, b: Record<string, any> | null): Promise<OrderRow | Response> {
  // An order switched to cash on delivery keeps its Razorpay order: a payment made on it still counts.
  if (!r.payment_ref) return json({ error: "This order isn't paid online." }, 409);
  if (r.payment_status === "paid" || r.payment_status === "refunded") return r;
  const pid = str(b?.razorpay_payment_id, 64), oid = str(b?.razorpay_order_id, 64), sig = str(b?.razorpay_signature, 128);
  if (!pid || oid !== r.payment_ref || !(await paymentSignatureOk(db, oid, pid, sig))) {
    return json({ error: "We couldn't confirm this payment. If money left your account, write to us with your order number and we'll sort it out." }, 400);
  }
  try {
    let pay = await fetchRzpPayment(db, pid);
    if (pay.order_id !== r.payment_ref || pay.amount !== paise(r.total) || pay.currency !== "INR") return json({ error: "This payment doesn't match the order. Please write to us with your order number." }, 400);
    if (pay.status === "authorized") pay = await captureOrFetch(db, pid, pay.amount);
    if (pay.status !== "captured") return json({ error: "The payment isn't complete yet. If money left your account, this page will show it soon; otherwise, try again." }, 409);
  } catch (e) {
    return json({ error: e instanceof RazorpayError ? `Couldn't check the payment with Razorpay (${e.message}). Please wait a minute and reload this page.` : "Couldn't check the payment. Please reload this page." }, 502);
  }
  return markPaid(db, r, pid);
}

/** Razorpay's webhook (payments and refunds): for payments whose page closed before the checkout reported back. */
async function razorpayWebhook(request: Request, db: DBEnv): Promise<Response> {
  const raw = await request.text().catch(() => "");
  if (raw.length > 200_000 || !(await webhookSignatureOk(db, raw, request.headers.get("x-razorpay-signature") || ""))) return json({ error: "Bad signature" }, 400);
  const ev = parse<any>(raw, null);
  const tell = (subject: string, line: string) => sendEmail(db, storeInbox(db), subject, shell(`<p style="margin:0;font-size:14px;line-height:1.6;">${line}</p>${button(`${SITE_URL}/admin`, "Open the store admin")}`)).catch(() => false);
  try {
    const pay = ev?.payload?.payment?.entity;
    if (["payment.authorized", "payment.captured", "order.paid"].includes(ev?.event) && pay?.order_id && pay?.id) {
      const r = await db.DB.prepare("SELECT * FROM store_orders WHERE payment_ref = ?").bind(String(pay.order_id)).first<OrderRow>();
      const fits = r && Number(pay.amount) === paise(r.total) && pay.currency === "INR";
      if (r && fits && r.payment_status !== "paid" && r.payment_status !== "refunded") {
        let status = String(pay.status);
        if (status === "authorized") status = (await captureOrFetch(db, String(pay.id), Number(pay.amount))).status;
        if (status === "captured") await markPaid(db, r, String(pay.id));
      } else if (r && pay.status === "captured" && r.payment_id !== String(pay.id)) {
        // Money we didn't expect on one of our orders (paid twice, or the wrong amount): the store decides.
        await tell(`Check a payment on order ${r.id}`, `Razorpay payment <b>${escapeHtml(String(pay.id))}</b> of ${money(Number(pay.amount) / 100)} came in on order <b>${escapeHtml(r.id)}</b> (${money(r.total)}), which ${r.payment_status === "paid" || r.payment_status === "refunded" ? `was already paid (payment ${escapeHtml(r.payment_id || "")})` : "it doesn't match"}. Refund it in Razorpay if it shouldn't be kept.`);
      }
    }
    const rf = ev?.payload?.refund?.entity;
    if ((ev?.event === "refund.processed" || ev?.event === "refund.failed") && rf?.payment_id) {
      const r = await db.DB.prepare("SELECT * FROM store_orders WHERE payment_id = ?").bind(String(rf.payment_id)).first<OrderRow>();
      if (r) {
        await syncRefunds(db, r);
        if (ev.event === "refund.failed") await tell(`A refund failed: order ${r.id}`, `Razorpay couldn't complete the refund of ${money(Number(rf.amount) / 100)} on order <b>${escapeHtml(r.id)}</b>. It's no longer counted as refunded: refund it again from the admin.`);
      }
    }
  } catch (e) {
    console.error("razorpay webhook", e);
    return json({ error: "Try again" }, 503); // Razorpay sends it again later
  }
  return json({ ok: true });
}

/* ------------------------------------------------------------------ reviews */

type ReviewRow = {
  id: string; created_at: number; updated_at: number; product_id: number; order_id: string; rating: number; title: string | null; body: string;
  name: string; city: string | null; status: ReviewStatus; reply: string | null; user_id: string | null; ip: string | null;
};
function toReview(r: ReviewRow): Review {
  const v: Review = { id: r.id, productId: Number(r.product_id), rating: Number(r.rating), body: r.body, name: r.name, createdAt: r.created_at };
  if (r.title) v.title = r.title;
  if (r.city) v.city = r.city;
  if (r.reply) v.reply = r.reply;
  return v;
}

async function productReviews(db: DBEnv, productId: number): Promise<{ summary: RatingSummary; reviews: Review[] }> {
  const { results } = await db.DB.prepare("SELECT * FROM store_reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 200").bind(productId).all<ReviewRow>();
  const dist = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of results) { dist[5 - Math.min(5, Math.max(1, Number(r.rating)))]++; sum += Number(r.rating); }
  const count = results.length;
  return { summary: { avg: count ? Math.round((sum / count) * 10) / 10 : 0, count, dist }, reviews: results.map(toReview) };
}

/** A buyer's review of something from a delivered order: shown once the store approves it. */
async function createReview(request: Request, db: DBEnv): Promise<Response> {
  const b = await readJson(request);
  if (!b) return json({ error: "Please write your review." }, 400);
  const access = await orderFor(request, db, b.orderId, b.phone);
  if (access instanceof Response) return access;
  const { r } = access;
  if (r.status !== "delivered") return json({ error: "You can review what you bought once the order is delivered." }, 409);
  const productId = Math.trunc(Number(b.productId));
  if (!toOrder(r).lines.some((l) => l.productId === productId)) return json({ error: "That item isn't in this order." }, 400);
  const rating = intIn(b.rating, 1, 5);
  const title = str(b.title, 100);
  const body = longStr(b.body, 2000);
  const name = str(b.name, 40);
  const city = str(b.city, 40);
  if (rating === undefined) return json({ error: "Choose from 1 to 5 stars.", field: "rating" }, 400);
  if (body.length < 20) return json({ error: "Tell other buyers a little more (at least a sentence).", field: "body" }, 400);
  if (name.length < 2) return json({ error: "Add the name to show with your review.", field: "name" }, 400);
  if (!(await allow(db, `store:review:ip:${clientIp(request)}`, 20, 3600_000))) return json({ error: "Too many reviews in a short time. Please try again later." }, 429);
  const user = await currentUser(request, db).catch(() => null);
  const now = Date.now();
  const existing = await db.DB.prepare("SELECT id FROM store_reviews WHERE order_id = ? AND product_id = ?").bind(r.id, productId).first<{ id: string }>();
  const id = existing?.id ?? `AXR-${orderId().slice(2)}`;
  if (existing) {
    await db.DB.prepare("UPDATE store_reviews SET rating = ?, title = ?, body = ?, name = ?, city = ?, status = 'pending', updated_at = ?, user_id = COALESCE(user_id, ?), ip = ? WHERE id = ?")
      .bind(rating, title || null, body, name, city || null, now, user?.id ?? null, clientIp(request), id).run();
  } else {
    await db.DB.prepare("INSERT INTO store_reviews (id, created_at, updated_at, product_id, order_id, rating, title, body, name, city, status, user_id, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)")
      .bind(id, now, now, productId, r.id, rating, title || null, body, name, city || null, user?.id ?? null, clientIp(request)).run();
  }
  forgetRatings();
  const p = byId.get(productId);
  const what = p ? (isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`) : `item ${productId}`;
  await sendEmail(db, storeInbox(db), `Review to check: ${rating} star${rating === 1 ? "" : "s"}, ${what}`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">A buyer reviewed ${escapeHtml(what)}</h2>
<p style="margin:0 0 6px;font-size:14px;"><span style="color:#D97706;">${"&#9733;".repeat(rating)}${"&#9734;".repeat(5 - rating)}</span> · ${escapeHtml(name)}${city ? `, ${escapeHtml(city)}` : ""} · order ${escapeHtml(r.id)}</p>
${title ? `<p style="margin:8px 0 0;font-size:14px;"><b>${escapeHtml(title)}</b></p>` : ""}<p style="margin:6px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body)}</p>
${button(`${SITE_URL}/admin`, "Approve it in the admin")}`)).catch(() => false);
  return json({ ok: true, id, status: "pending" }, existing ? 200 : 201);
}

/* ------------------------------------------------------------------ back-in-stock and price-drop alerts */

type AlertRow = { id: string; created_at: number; product_id: number; variant_id: string; kind: "stock" | "price"; email: string; price_at: number | null; notified_at: number | null; token: string };

/** Price and stock of a product (or one of its options) as it sells now. */
function nowFor(p: Product, variantId: string): { price: number | null; inStock: boolean } {
  const vs = p.variants ?? [];
  if (variantId && vs.length) {
    const v = vs.find((x) => x.id === variantId);
    if (!v) return { price: null, inStock: false };
    return { price: p.priceOnRequest ? null : v.price ?? p.price ?? null, inStock: p.inStock && v.inStock };
  }
  const s = summarize(p);
  return { price: s.priceOnRequest ? null : s.price, inStock: s.inStock };
}

const maskEmail = (e: string) => e.replace(/^(.)(.*)(@.*)$/, (_, a: string, b: string, c: string) => `${a}${"•".repeat(Math.min(6, Math.max(2, b.length)))}${c}`);

async function createAlert(request: Request, db: DBEnv): Promise<Response> {
  const b = await readJson(request);
  if (!b) return json({ error: "Please enter your email address." }, 400);
  const kind = b.kind === "price" ? "price" : "stock";
  const email = normEmail(b.email).slice(0, 254);
  if (!validEmail(email)) return json({ error: "Please enter your email address, so we can tell you.", field: "email" }, 400);
  const p = (await finder(db))(Math.trunc(Number(b.productId)));
  if (!p) return json({ error: "That item isn't in the store." }, 404);
  const variantId = p.variants?.some((v) => v.id === b.variantId) ? String(b.variantId) : "";
  const cur = nowFor(p, variantId);
  if (kind === "stock" && cur.inStock) return json({ error: "Good news: it's in stock now." }, 409);
  if (kind === "price" && cur.price === null) return json({ error: "This one has no price to watch: ask for the price instead." }, 409);
  const ip = clientIp(request);
  if (!(await allow(db, `store:alert:ip:${ip}`, 20, 3600_000)) || !(await allow(db, `store:alert:email:${email}`, 10, 86400_000))) return json({ error: "Too many alerts in a short time. Please try again later." }, 429);
  await db.DB.prepare(`INSERT INTO store_alerts (id, created_at, product_id, variant_id, kind, email, price_at, notified_at, token, ip) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    ON CONFLICT(product_id, variant_id, kind, email) DO UPDATE SET created_at = excluded.created_at, price_at = excluded.price_at, notified_at = NULL`)
    .bind(`AXA-${orderId().slice(2)}`, Date.now(), p.id, variantId, kind, email, cur.price, newToken(), ip).run();
  return json({ ok: true, kind, price: cur.price }, 201);
}

/** Email the alerts that came true (back in stock, or cheaper than when asked), once each: from the hourly job, and after the admin changes a product. */
async function processAlerts(db: DBEnv, productId?: number, maxEmails = 15): Promise<{ sent: number; checked: number }> {
  if (!db.BREVO_API_KEY) return { sent: 0, checked: 0 };
  // The ones looked at least recently first, so alerts that never come true don't crowd out the rest.
  const { results } = await db.DB.prepare(`SELECT * FROM store_alerts WHERE notified_at IS NULL${productId ? " AND product_id = ?" : ""} ORDER BY COALESCE(checked_at, 0), created_at LIMIT 300`)
    .bind(...(productId ? [productId] : [])).all<AlertRow>();
  if (!results.length) return { sent: 0, checked: 0 };
  const seen = Date.now();
  for (let k = 0; k < results.length; k += 90) {
    const ids = results.slice(k, k + 90).map((a) => a.id);
    await db.DB.prepare(`UPDATE store_alerts SET checked_at = ? WHERE id IN (${ids.map(() => "?").join(",")})`).bind(seen, ...ids).run();
  }
  const find = await finder(db);
  let sent = 0;
  for (const a of results) {
    if (sent >= maxEmails) break;
    const p = find(Number(a.product_id));
    if (!p) continue;
    const cur = nowFor(p, a.variant_id);
    const v = a.variant_id ? p.variants?.find((x) => x.id === a.variant_id) : undefined;
    const name = `${isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`}${v ? ` (${v.label})` : ""}`;
    let subject = "", line = "";
    if (a.kind === "stock" && cur.inStock) {
      subject = `Back in stock: ${name}`;
      line = `${escapeHtml(name)} is back in stock${cur.price !== null ? ` at ${money(cur.price)}` : ""}. Stock can run out again, so order soon if you need it.`;
    } else if (a.kind === "price" && cur.inStock && cur.price !== null && a.price_at !== null && cur.price <= a.price_at - 1) {
      subject = `Price drop: ${name} is now ${rupees(cur.price)}`;
      line = `${escapeHtml(name)} is now ${money(cur.price)}, down from ${money(a.price_at)} when you asked us to watch it${p.offer ? ` (${escapeHtml(p.offer.title)}, ${p.offer.percent}% off)` : ""}.`;
    }
    if (!subject) continue;
    if (!(await emailOk(db.DB, { email: a.email }, "alerts"))) { await db.DB.prepare("UPDATE store_alerts SET notified_at = ? WHERE id = ?").bind(Date.now(), a.id).run(); continue; }
    const ok = await sendEmail(db, a.email, subject, shell(`<h2 style="margin:0 0 8px;font-size:20px;">${escapeHtml(subject)}</h2>
<p style="color:#4A5568;margin:0 0 6px;line-height:1.55;">${line}</p>${button(`${SITE_URL}${itemHref(p.id, p.slug)}`, "View it on Aethex")}
<p style="color:#718096;font-size:12px;margin-top:22px;line-height:1.5;">You asked us to email you about this item, and this is the only email for this alert. Didn't ask for it, or want no more? <a href="${SITE_URL}/alerts/stop?token=${encodeURIComponent(a.token)}">Stop all Aethex alerts to this address</a>.</p>`)).catch(() => false);
    if (ok) { await db.DB.prepare("UPDATE store_alerts SET notified_at = ? WHERE id = ?").bind(Date.now(), a.id).run(); sent++; }
  }
  return { sent, checked: results.length };
}

/* ------------------------------------------------------------------ bought together (from real orders) */

let togetherCache: { at: number; pairs: Map<number, Map<number, number>> } | null = null;
/** Items that were in the same orders as this one (at least twice in the last year), most often first. */
async function boughtTogether(db: DBEnv, id: number): Promise<number[]> {
  if (!togetherCache || Date.now() - togetherCache.at > 3600_000) {
    const { results } = await db.DB.prepare("SELECT lines FROM store_orders WHERE status IN ('placed', 'confirmed', 'shipped', 'delivered') AND created_at > ? ORDER BY created_at DESC LIMIT 5000")
      .bind(Date.now() - 365 * 86400_000).all<{ lines: string }>();
    const pairs = new Map<number, Map<number, number>>();
    for (const r of results) {
      const ids = Array.from(new Set(parse<PricedLine[]>(r.lines, []).map((l) => Number(l.productId)))).slice(0, 30);
      for (const x of ids) for (const y of ids) {
        if (x === y) continue;
        const m = pairs.get(x) ?? new Map<number, number>();
        m.set(y, (m.get(y) ?? 0) + 1);
        pairs.set(x, m);
      }
    }
    togetherCache = { at: Date.now(), pairs };
  }
  const m = togetherCache.pairs.get(id);
  if (!m) return [];
  return Array.from(m.entries()).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
}

/* ------------------------------------------------------------------ saved addresses (a signed-in account's) */

type AddressRow = { id: string; user_id: string; label: string; data: string; is_default: number; created_at: number; updated_at: number };
function toSaved(r: AddressRow): SavedAddress | null {
  const address = parse<Address | null>(r.data, null);
  return address ? { id: r.id, label: r.label, isDefault: !!r.is_default, address, updatedAt: r.updated_at } : null;
}
async function savedAddresses(db: DBEnv, userId: string): Promise<SavedAddress[]> {
  const { results } = await db.DB.prepare("SELECT * FROM store_addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC LIMIT 50").bind(userId).all<AddressRow>();
  return results.map(toSaved).filter((x): x is SavedAddress => !!x);
}
/** The same person at the same place, whatever the spacing, case and punctuation. */
function sameAddress(a: Address, b: Address): boolean {
  const k = (x: Address) => [x.name, x.phone, x.line1, x.line2 ?? "", x.city, x.pincode].map((v) => v.toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");
  return k(a) === k(b);
}
const setDefaultAddress = (db: DBEnv, userId: string, id: string) =>
  db.DB.prepare("UPDATE store_addresses SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE user_id = ?").bind(id, userId).run();

/**
 * Keeps an address in the account (an email in it is left out: order updates go to the buyer's own). The same
 * address again just updates the one kept. The first address is the default.
 */
async function keepAddress(db: DBEnv, userId: string, address: Address, label: string, makeDefault: boolean): Promise<{ id: string; created: boolean } | { error: string }> {
  const { email: _email, ...a } = address;
  const existing = await savedAddresses(db, userId);
  const now = Date.now();
  const same = existing.find((x) => sameAddress(x.address, a));
  if (same) {
    await db.DB.prepare("UPDATE store_addresses SET label = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind(label || same.label, JSON.stringify(a), now, same.id, userId).run();
    if (makeDefault) await setDefaultAddress(db, userId, same.id);
    return { id: same.id, created: false };
  }
  if (existing.length >= MAX_ADDRESSES) return { error: `You can keep up to ${MAX_ADDRESSES} addresses. Remove one to add another.` };
  const id = crypto.randomUUID();
  await db.DB.prepare("INSERT INTO store_addresses (id, user_id, label, data, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)")
    .bind(id, userId, label || (existing.length ? "Other" : "Home"), JSON.stringify(a), now, now).run();
  if (makeDefault || !existing.length) await setDefaultAddress(db, userId, id);
  return { id, created: true };
}

/** GET and POST addresses, PUT and DELETE addresses/:id {label?, address?, isDefault?}: each answers with the whole list. */
async function handleAddresses(request: Request, db: DBEnv, id: string | null): Promise<Response> {
  const user = await currentUser(request, db);
  if (!user) return json({ error: "Sign in to keep your addresses.", signIn: true }, 401);
  const method = request.method;
  const list = async () => json({ addresses: await savedAddresses(db, user.id) });
  if (method === "GET" && !id) return list();
  if (!["POST", "PUT", "DELETE"].includes(method) || (method === "POST") !== !id) return json({ error: "Not found" }, 404);
  if (!(await allow(db, `store:addr:${user.id}`, 60, 3600_000))) return json({ error: "Too many changes in a short time. Please try again later." }, 429);
  if (method === "POST") {
    const b = await readJson(request);
    const c = cleanAddress(b?.address);
    if ("error" in c) return json({ error: c.error, field: "address" }, 400);
    const kept = await keepAddress(db, user.id, c.address, str(b?.label, 24), b?.isDefault === true);
    if ("error" in kept) return json(kept, 409);
    return json({ addresses: await savedAddresses(db, user.id), id: kept.id }, kept.created ? 201 : 200);
  }
  const row = await db.DB.prepare("SELECT * FROM store_addresses WHERE id = ? AND user_id = ?").bind(id, user.id).first<AddressRow>();
  if (!row) return json({ error: "That address isn't in your account any more.", addresses: await savedAddresses(db, user.id) }, 404);
  if (method === "DELETE") {
    await db.DB.prepare("DELETE FROM store_addresses WHERE id = ? AND user_id = ?").bind(row.id, user.id).run();
    // The default gone, the most recently used one takes its place.
    if (row.is_default) {
      const next = await db.DB.prepare("SELECT id FROM store_addresses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1").bind(user.id).first<{ id: string }>();
      if (next) await setDefaultAddress(db, user.id, next.id);
    }
    return list();
  }
  const b = await readJson(request);
  if (!b) return json({ error: "Send the address as JSON." }, 400);
  let data = row.data;
  if (b.address !== undefined) {
    const c = cleanAddress(b.address);
    if ("error" in c) return json({ error: c.error, field: "address" }, 400);
    const { email: _email, ...a } = c.address;
    data = JSON.stringify(a);
  }
  const label = b.label === undefined ? row.label : str(b.label, 24) || row.label;
  await db.DB.prepare("UPDATE store_addresses SET label = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind(label, data, Date.now(), row.id, user.id).run();
  if (b.isDefault === true) await setDefaultAddress(db, user.id, row.id);
  return json({ addresses: await savedAddresses(db, user.id), id: row.id });
}

/* ------------------------------------------------------------------ the hourly job */

/**
 * Online payments not recorded yet, for a week after the order (a page closed before it reported back, or a
 * payment that came in after the order was cancelled or switched to cash): unpaid orders are looked at every
 * hour, the others every six. An order left unpaid for a day is cancelled, so it doesn't linger. An order
 * to be paid by bank transfer whose money hasn't come in BANK_DAYS days is cancelled too, and both sides
 * told. Then the alerts that came true.
 */
export async function runStoreScheduled(env: StoreEnv): Promise<{ alerts: number; paid: number; expired: number }> {
  if (!env.DB) return { alerts: 0, paid: 0, expired: 0 };
  const db = env as DBEnv;
  await ensureTables(db.DB);
  const now = Date.now();
  // A few at a time: the run's budget of requests (Razorpay, D1, email) is shared with the cart reminders.
  const { results } = await db.DB.prepare(`SELECT * FROM store_orders WHERE payment_ref IS NOT NULL AND (payment_status IS NULL OR payment_status = 'pending')
      AND created_at > ? AND created_at < ? AND COALESCE(payment_checked_at, 0) < (CASE WHEN status = 'pending' THEN ? ELSE ? END)
      ORDER BY COALESCE(payment_checked_at, 0) LIMIT 10`)
    .bind(now - 7 * 86400_000, now - 15 * 60_000, now - 50 * 60_000, now - 6 * 3600_000).all<OrderRow>();
  let paid = 0, expired = 0;
  for (const r0 of results) {
    let r = r0, checked = false;
    try { r = await settleFromRazorpay(db, r0); checked = true; } catch (e) { console.error("store: checking a payment", r0.id, e); }
    await db.DB.prepare("UPDATE store_orders SET payment_checked_at = ? WHERE id = ?").bind(Date.now(), r0.id).run();
    if (r.payment_status === "paid" || r.payment_status === "refunded") { paid++; continue; }
    // Unpaid for a day, and Razorpay has no payment for it (when it couldn't be asked, it waits for the next run).
    if (checked && r.status === "pending" && r.created_at < now - 86400_000) {
      const res = await db.DB.prepare(`UPDATE store_orders SET status = 'cancelled', updated_at = ?,
          history = json_insert(history, '$[#]', json_object('status', 'cancelled', 'at', ?, 'note', 'The online payment wasn''t completed'))
        WHERE id = ? AND status = 'pending' AND (payment_status IS NULL OR payment_status = 'pending')`).bind(Date.now(), Date.now(), r.id).run();
      if (changes(res)) expired++;
    }
  }
  const late = await db.DB.prepare(`SELECT * FROM store_orders WHERE payment = 'bank' AND status = 'pending' AND payment_status = 'pending' AND created_at < ?
      ORDER BY created_at LIMIT 10`).bind(now - BANK_DAYS * 86400_000).all<OrderRow>();
  for (const r of late.results) {
    const at = Date.now();
    const res = await db.DB.prepare(`UPDATE store_orders SET status = 'cancelled', updated_at = ?,
        history = json_insert(history, '$[#]', json_object('status', 'cancelled', 'at', ?, 'note', ?))
      WHERE id = ? AND payment = 'bank' AND status = 'pending' AND payment_status = 'pending'`)
      .bind(at, at, `The bank transfer didn't arrive within ${BANK_DAYS} days`, r.id).run();
    if (!changes(res)) continue;
    expired++;
    const o = toOrder((await rowById(db, r.id)) ?? { ...r, status: "cancelled" });
    await Promise.allSettled([
      o.address.email ? sendEmail(db, o.address.email, `Order ${o.id} cancelled: payment not received`,
        customerEmail(o, "cancelled", `We hadn't received your bank transfer of ${rupees(o.total)} within ${BANK_DAYS} days of the order, so it has been cancelled. You're welcome to order again.`)) : Promise.resolve(false),
      sendEmail(db, storeInbox(db), `Cancelled, bank transfer not received: ${o.id}`, shell(`<p style="margin:0;font-size:14px;line-height:1.6;">Order <b>${o.id}</b> (${money(o.total)}, ${escapeHtml(o.address.city)}) waited ${BANK_DAYS} days for its bank transfer and has been cancelled. If the money still comes in, send it back, or ask the customer to order again.</p>`)),
    ]);
  }
  // Alerts that never came true are dropped after six months, sent ones after a month.
  await db.DB.prepare("DELETE FROM store_alerts WHERE (notified_at IS NULL AND created_at < ?) OR (notified_at IS NOT NULL AND notified_at < ?)").bind(now - 182 * 86400_000, now - 30 * 86400_000).run();
  const a = await processAlerts(db);
  return { alerts: a.sent, paid, expired };
}

/* ------------------------------------------------------------------ the router */

type Ctx = { waitUntil(p: Promise<unknown>): void };
/** Work that can finish after the response (alert emails); without a way to wait, it's done now. */
async function later(ctx: Ctx | undefined, p: Promise<unknown>) {
  const q = p.catch((e) => console.error("store, in the background", e));
  if (ctx) ctx.waitUntil(q); else await q;
}

export async function handleStore(request: Request, env: StoreEnv, ctx?: Ctx): Promise<Response> {
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
  if (path === "books" && method === "GET") {
    try {
      return new Response(await booksBody(env), { headers: { "content-type": "application/json", ...CACHED } });
    } catch (e) {
      console.error("store books", e);
      return new Response(await booksBody({ ...env, DB: undefined }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
  }
  if (path === "config" && method === "GET") {
    // What checkout and the shop offer: never the bank account itself (that's sent with an order to be paid into it).
    return json({
      onlinePayments: razorpayReady(env), codLimit: COD_LIMIT, onlineLimit: ONLINE_LIMIT,
      bankTransfer: !!bankDetails(env), bankMin: BANK_MIN, bankLimit: BANK_LIMIT, bankDays: BANK_DAYS,
      whatsapp: whatsappNumber(env), gstInvoice: !!sellerGstin(env), buyerGstin: true,
    }, 200, { "cache-control": "public, max-age=60" });
  }
  const pp = /^products\/([a-z0-9-]{1,120})$/.exec(path);
  if (pp && method === "GET") {
    const key = pp[1];
    const base = /^\d+$/.test(key) ? byId.get(Number(key)) : bySlug.get(key);
    if (!base) return json({ error: "Product not found" }, 404);
    const st = await storeState(env).catch(() => null);
    const p = st ? sellAs(base, st.overrides.get(base.id), st.offers, st.now) : base;
    if (!p) return json({ error: "Product not found" }, 404);
    const rating = st?.ratings.get(base.id);
    return json(rating ? { ...p, rating } : p, 200, CACHED);
  }
  if (path === "quote" && method === "POST") {
    const b = await readJson(request);
    const find = await finder(env).catch(() => (id: number) => byId.get(id) ?? null);
    let quote = quoteLines(Array.isArray(b?.lines) ? (b!.lines as CartLine[]) : [], find);
    let couponError = "";
    if (b?.coupon && quote.lines.length) {
      if (!env.DB) couponError = "Coupons can't be checked right now. Please try again later.";
      else {
        const db = env as DBEnv;
        await ensureTables(db.DB);
        if (!(await allow(db, `store:coupon:ip:${clientIp(request)}`, 120, 3600_000))) couponError = "Too many tries. Please wait a while and try again.";
        else {
          const c = await withCoupon(db, quote, b.coupon, find, normPhone(b.phone) || undefined);
          if ("error" in c) couponError = c.error; else quote = c.quote;
        }
      }
    }
    return json({
      ...quote, ...(couponError ? { couponError } : {}),
      codAvailable: quote.total <= COD_LIMIT, codLimit: COD_LIMIT, onlinePayments: razorpayReady(env), onlineLimit: ONLINE_LIMIT,
    });
  }
  const tg = /^together\/(\d{1,7})$/.exec(path);
  if (tg && method === "GET") {
    if (!env.DB) return json({ ids: [] });
    await ensureTables(env.DB);
    const ids = await boughtTogether(env as DBEnv, Number(tg[1])).catch(() => [] as number[]);
    return json({ ids }, 200, { "cache-control": "public, max-age=600" });
  }
  const rv = /^reviews\/(\d{1,7})$/.exec(path);
  if (rv && method === "GET") {
    if (!env.DB) return json({ summary: { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] }, reviews: [] });
    await ensureTables(env.DB);
    return json(await productReviews(env as DBEnv, Number(rv[1])), 200, CACHED);
  }

  // update 76: a product's answered questions, and the invoice tax table
  const qq = /^questions\/(\d{1,7})$/.exec(path);
  if (qq && method === "GET") {
    if (!env.DB) return json({ questions: [] });
    await ensureTables(env.DB);
    const { results } = await env.DB.prepare("SELECT * FROM store_questions WHERE product_id = ? AND status = 'answered' ORDER BY answered_at DESC LIMIT 100").bind(Number(qq[1])).all<QuestionRow>();
    return json({ questions: results.map(toQuestion) }, 200, { "cache-control": "no-store" });
  }
  // update 80: the offers page: sales running now, and the coupon codes the store chose to show
  if (path === "offers" && method === "GET") {
    if (!env.DB) return json({ offers: [], coupons: [] });
    await ensureTables(env.DB);
    const now = Date.now();
    const { offers: list } = await offers(env);
    const { results } = await env.DB.prepare("SELECT data FROM store_coupons").all<{ data: string }>();
    const coupons = results.map((r) => parse<Coupon | null>(r.data, null)).filter((c): c is Coupon => !!c && !!c.public && couponLive(c, now)).map((c) => ({ ...publicCoupon(c), ...(c.label ? { label: c.label } : {}) }));
    const names = (cats: string[] = [], brs: string[] = []) => ({ categories: cats.map((x) => ({ slug: x, name: catalog.categories.find((c) => c.slug === x)?.name ?? x })), brands: brs.map((x) => ({ slug: x, name: brandName(x) })) });
    return json({
      offers: list.filter((o) => offerLive(o, now)).map((o) => ({ id: o.id, title: o.title, percent: o.percent, endsAt: o.endsAt ?? null, ...names(o.categories, o.brands) })),
      coupons: coupons.map((c) => ({ ...c, ...names(c.categories, c.brands) })),
    }, 200, { "cache-control": "public, max-age=60" });
  }
  if (path === "tax" && method === "GET") {
    if (!env.DB) return json({ rates: {}, sellerGstin: sellerGstin(env) });
    await ensureTables(env.DB);
    return json(await taxTable(env as DBEnv), 200, { "cache-control": "public, max-age=300" });
  }

  if (!env.DB) return json({ error: "The store's database isn't set up on the server yet (D1 binding DB)." }, 503);
  const db = env as DBEnv;
  await ensureTables(db.DB);
  if (path === "questions" && method === "POST") return createQuestion(request, db);
  { const r84 = await handleStore84(request, db, path, method); if (r84) return r84; }
  { const r89 = await handleTickets(request, db, path, method); if (r89) return r89; }
  { const r100 = await handleSellerApply(request, db, path, method); if (r100) return r100; }
  { const r101 = await handleInterest(request, db, path, method); if (r101) return r101; }
  const ph89 = /^products\/(\d{1,7})\/price-history$/.exec(path);
  if (ph89 && method === "GET") return json(await priceHistory(db, Number(ph89[1])), 200, { "cache-control": "public, max-age=600" });
  if (path === "approvals" || /^approvals\/[A-Za-z0-9_-]{20,64}(\/(decision|comment))?$/.test(path)) return handleApprovals(request, db, path, method);
  if (path === "indents" || /^indents\/i[a-z0-9]{6,30}\/(approve|reject|cancel|merged)$/.test(path)) return handleIndents(request, db, path, method);
  if (path === "stock" || /^stock\/s[a-z0-9]{6,30}\/(move|delete)$/.test(path)) return handleStock(request, db, path, method);
  if (path === "equipment" || /^equipment\/e[a-z0-9]{6,30}\/(delete|done)$/.test(path)) return handleEquipment(request, db, path, method);
  if (path === "reminders" || /^reminders\/r[a-z0-9]{6,30}\/delete$/.test(path)) return handleReminders(request, db, path, method);
  // update 86: teams, spend and purchase orders
  if (path === "team" || /^team\/(accept|invite|leave|rename|members\/(remove|role))$/.test(path)) return handleTeam(request, db, path, method);
  if (path === "spend" || path === "spend/budget") return handleSpend(request, db, path, method);
  if (/^my-quotes\/[A-Z0-9-]{6,24}(\/po)?$/.test(path)) return handlePo(request, db, path, method);
  if (path === "lists" || /^lists\/[a-z0-9]{6,30}\/(delete|sent)$/.test(path)) return handleLists(request, db, path, method);

  if (path === "razorpay/webhook" && method === "POST") return razorpayWebhook(request, db);
  if (path.startsWith("admin/") || path === "admin") return handleAdmin(request, db, path.replace(/^admin\/?/, ""), ctx);

  if (path === "enquiries" && method === "POST") return createEnquiry(request, db);
  if (path === "contact" && method === "POST") return createContact(request, db);
  if (path === "bulk-requests" && method === "POST") return createBulkRequest(request, db);
  if (path === "orders" && method === "POST") return createOrder(request, db);
  if (path === "reviews" && method === "POST") return createReview(request, db);
  if (path === "alerts" && method === "POST") return createAlert(request, db);
  const ad = /^addresses(?:\/([0-9a-f-]{36}))?$/.exec(path);
  if (ad) return handleAddresses(request, db, ad[1] ?? null);
  if (path === "alerts/stop" && method === "POST") {
    const b = await readJson(request);
    const token = str(b?.token, 64);
    const a = token ? await db.DB.prepare("SELECT email FROM store_alerts WHERE token = ?").bind(token).first<{ email: string }>() : null;
    if (!a) return json({ error: "There are no alerts for this link: they may have been stopped already." }, 404);
    await db.DB.prepare("DELETE FROM store_alerts WHERE email = ?").bind(a.email).run();
    return json({ ok: true, email: maskEmail(a.email) });
  }

  // A signed-in account: its orders, what it can review, and its quotation requests.
  if ((path === "orders" || path === "my-reviews" || path === "my-quotes") && method === "GET") {
    const user = await currentUser(request, db);
    const what = { orders: "your orders", "my-reviews": "what you can review", "my-quotes": "your quotation requests" }[path];
    if (!user) return json({ error: `Sign in to see ${what}.`, signIn: true }, 401);
    const email = normEmail(user.email);
    if (path === "my-quotes") {
      // update 86: the whole team's requests, with the purchase order made from each
      const team = await teamIds(db, user.id), emails = Array.from(new Set([email, ...(await teamEmails(db, team))]));
      const { results } = await db.DB.prepare(`SELECT * FROM store_bulk_requests WHERE user_id IN (${ph(team.length)}) OR email IN (${ph(emails.length)}) ORDER BY created_at DESC LIMIT 100`).bind(...team, ...emails).all<BulkRow & { po?: string | null }>();
      return json({ requests: results.map((r) => { const po = parse<{ number?: string } | null>(r.po ?? null, null); return { ...toBulk(r), updatedAt: r.updated_at, ...(po?.number ? { po: po.number } : {}) }; }) });
    }
    if (path === "orders") {
      const { results } = await db.DB.prepare("SELECT * FROM store_orders WHERE user_id = ? OR email = ? ORDER BY created_at DESC LIMIT 100").bind(user.id, email).all<OrderRow>();
      const reviews = await reviewsFor(db, results.filter((r) => r.status === "delivered").map((r) => r.id));
      const reps = await replacementsFor(db, results.filter((r) => r.status === "delivered").map((r) => r.id));
      return json({ orders: results.map((r) => withBank(db, { ...customerView(r, true), ...(reviews.has(r.id) ? { reviews: reviews.get(r.id) } : {}), ...(reps.has(r.id) ? { replacements: reps.get(r.id) } : {}) })) });
    }
    const { results } = await db.DB.prepare("SELECT * FROM store_orders WHERE (user_id = ? OR email = ?) AND status = 'delivered' ORDER BY created_at DESC LIMIT 60").bind(user.id, email).all<OrderRow>();
    const ids = results.map((r) => r.id);
    const written = ids.length
      ? (await db.DB.prepare(`SELECT * FROM store_reviews WHERE order_id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all<ReviewRow>()).results
      : [];
    const byKey = new Map(written.map((w) => [`${w.order_id}:${w.product_id}`, w]));
    const items: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const r of results) {
      const o = toOrder(r);
      const deliveredAt = [...o.history].reverse().find((h) => h.status === "delivered")?.at ?? r.updated_at;
      for (const l of o.lines) {
        const k = `${r.id}:${l.productId}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const w = byKey.get(k);
        items.push({
          orderId: r.id, deliveredAt, productId: l.productId, slug: l.slug, name: l.name, brand: brandName(l.brand), image: l.image,
          review: w ? { ...toReview(w), status: w.status } : null,
        });
      }
    }
    return json({ items });
  }

  // update 80: a replacement request for an item of a delivered order (the order's own access rules)
  const rp = /^orders\/([A-Za-z0-9-]{6,20})\/replacement$/.exec(path);
  if (rp && method === "POST") {
    const b = await readJson(request);
    const access = await orderFor(request, db, rp[1], b?.phone);
    if (access instanceof Response) return access;
    return createReplacement(db, access.r, b ?? {});
  }

  // orders/:id (GET: the browser that placed it sends its token in x-order-token, or its account is signed in),
  // POST orders/:id/lookup {phone}, /cancel {phone?, reason?, ifUnpaid?}, /pay {razorpay_*}, /payment (pay again), /cod (cash on delivery instead).
  const om = /^orders\/([A-Za-z0-9-]{6,20})(?:\/(cancel|lookup|pay|payment|cod))?$/.exec(path);
  if (om && ((method === "GET" && !om[2]) || (method === "POST" && om[2]))) {
    const b = method === "POST" ? await readJson(request) : null;
    const access = await orderFor(request, db, om[1], b?.phone);
    if (access instanceof Response) return access;
    const { full } = access;
    let r = access.r;
    const act = om[2];
    const view = async (row: OrderRow) => {
      const reviews = row.status === "delivered" ? (await reviewsFor(db, [row.id])).get(row.id) : undefined;
      const reps = row.status === "delivered" ? (await replacementsFor(db, [row.id])).get(row.id) : undefined;
      return withBank(db, { ...customerView(row, full), ...(reviews ? { reviews } : {}), ...(reps ? { replacements: reps } : {}) });
    };
    const settle = async () => { try { r = await settleFromRazorpay(db, r); } catch (e) { console.error("store: checking a payment", r.id, e); } };

    if (!act || act === "lookup") {
      // A payment that never reported back (the page closed first) shows up when the order is opened.
      if (r.status === "pending" && r.payment === "online" && Date.now() - r.created_at > 60_000 && (await allow(db, `store:settle:${r.id}`, 6, 600_000))) await settle();
      return json({ order: await view(r) });
    }

    if (act === "pay") {
      const out = await confirmPayment(db, r, b);
      return out instanceof Response ? out : json({ order: await view(out) });
    }

    if (act === "payment") {
      if (r.payment === "bank" && r.status === "pending") return json({ error: "This order is paid by bank transfer: the account details are on this page.", order: await view(r) }, 409);
      if (r.payment !== "online" || r.status !== "pending") return json({ error: r.status === "cancelled" ? "This order has been cancelled." : "This order doesn't need paying.", order: await view(r) }, 409);
      if (!razorpayReady(db) || !r.payment_ref) return json({ error: "Paying online isn't available right now. You can pay cash on delivery instead." }, 409);
      await settle();
      if (r.status !== "pending") return json({ order: await view(r) });
      return json({ order: await view(r), checkout: checkoutFor(db, toOrder(r), r.payment_ref) });
    }

    if (act === "cod") {
      if ((r.payment !== "online" && r.payment !== "bank") || r.status !== "pending") return json({ error: "This order isn't waiting for a payment.", order: await view(r) }, 409);
      if (r.total > COD_LIMIT) return json({ error: `Cash on delivery is available on orders up to ₹${COD_LIMIT.toLocaleString("en-IN")}.` }, 409);
      if (r.payment === "online") await settle();
      if (r.status !== "pending") return json({ order: await view(r) }); // it was paid after all
      const o = toOrder(r);
      const now = Date.now();
      o.status = "placed"; o.payment = "cod";
      delete o.paymentStatus;
      o.history.push({ status: "placed", at: now, note: "Cash on delivery" });
      const res = await db.DB.prepare("UPDATE store_orders SET status = 'placed', payment = 'cod', payment_status = NULL, history = ?, updated_at = ? WHERE id = ? AND status = 'pending' AND payment_status = 'pending'")
        .bind(JSON.stringify(o.history), now, r.id).run();
      if (changes(res)) await placedEmails(db, o);
      return json({ order: await view((await rowById(db, r.id)) ?? r) });
    }

    if (act === "cancel") {
      if (!cancellable(r.status)) return json({ error: r.status === "cancelled" ? "This order is already cancelled." : "This order has shipped, so it can't be cancelled now. You can refuse it at delivery, or contact us." }, 409);
      if (r.status === "pending" && r.payment === "online") {
        await settle(); // paid after all: cancelled and refunded below
        // The checkout dropping an unpaid order it's replacing: one that turns out to be paid is kept.
        if (b?.ifUnpaid === true && r.status !== "pending") return json({ error: "This order has been paid.", order: await view(r) }, 409);
      }
      const was = r.status;
      const o = toOrder(r);
      const now = Date.now();
      const reason = str(b?.reason, 200);
      o.status = "cancelled";
      o.history.push({ status: "cancelled", at: now, note: reason ? `Cancelled by the customer: ${reason}` : "Cancelled by the customer" });
      const res = await db.DB.prepare("UPDATE store_orders SET status = 'cancelled', history = ?, updated_at = ? WHERE id = ? AND status = ?").bind(JSON.stringify(o.history), now, o.id, was).run();
      if (!changes(res)) return json({ error: "This order has just changed. Please reload the page and try again." }, 409);
      let refundNote = "";
      if (o.payment === "online" && o.paymentStatus === "paid") {
        const done = await refundOrder(db, { ...r, status: "cancelled", history: JSON.stringify(o.history) }, o, o.total, "Cancelled by the customer");
        refundNote = "error" in done ? `<br><b>Refund it from the admin:</b> ${escapeHtml(done.error)}` : `<br>The online payment (${money(done.amount)}) has been refunded.`;
      }
      if (o.payment === "bank" && o.paymentStatus === "paid") refundNote = `<br><b>It was paid by bank transfer${o.bankRef ? ` (reference ${escapeHtml(o.bankRef)})` : ""}: send ${money(o.total)} back to the customer's account.</b>`;
      if (o.payment === "bank" && was === "pending") refundNote = "<br>It was waiting for its bank transfer: if the money still comes in, send it back.";
      // An order cancelled before its online payment was never placed: there's nothing to tell anyone. One to be paid by
      // bank transfer was emailed to both sides, so both hear it's off.
      if (was !== "pending" || o.payment === "bank") {
        await Promise.allSettled([
          o.address.email ? sendEmail(db, o.address.email, `Order ${o.id} cancelled`, customerEmail(o, "cancelled")) : Promise.resolve(false),
          sendEmail(db, storeInbox(db), `Cancelled by the customer: ${o.id}`, shell(`<p style="margin:0;font-size:14px;line-height:1.6;">Order <b>${o.id}</b> (${money(o.total)}, ${escapeHtml(o.address.city)}) was cancelled by the customer.${reason ? `<br>Reason: ${escapeHtml(reason)}` : ""}${refundNote}</p>`)),
        ]);
      }
      return json({ order: { ...(await view((await rowById(db, o.id)) ?? r)), canCancel: false } });
    }
  }

  return json({ error: "Not found" }, 404);
}

/* ------------------------------------------------------------------ update 76: product questions, invoice tax */

type QuestionRow = { id: string; product_id: number; question: string; name: string; user_id: string | null; email: string | null; answer: string | null; status: string; created_at: number; answered_at: number | null };
const toQuestion = (r: QuestionRow) => ({ id: r.id, productId: Number(r.product_id), question: r.question, name: r.name, answer: r.answer, at: r.created_at, answeredAt: r.answered_at });

async function createQuestion(request: Request, db: DBEnv): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to ask a question.", signIn: true }, 401);
  const b = await readJson(request);
  const pid = Number(b?.productId);
  const p = Number.isInteger(pid) ? byId.get(pid) : undefined;
  if (!p) return json({ error: "Product not found." }, 404);
  const question = longStr(b?.question, 500);
  if (question.length < 10) return json({ error: "Write your question in a few more words.", field: "question" }, 400);
  if (/https?:\/\/|www\./i.test(question)) return json({ error: "Please leave links out of your question.", field: "question" }, 400);
  if (!(await allow(db, `store:q:${user.id}`, 10, 86400_000)) || !(await allow(db, `store:q:ip:${clientIp(request)}`, 20, 86400_000))) return json({ error: "That's a lot of questions for one day. Please try again tomorrow." }, 429);
  const name = (str(b?.name, 40) || str(user.name, 40) || "A customer").split(" ")[0]!;
  const id = `q${Date.now().toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`;
  await db.DB.prepare("INSERT INTO store_questions (id, product_id, question, name, user_id, email, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)")
    .bind(id, p.id, question, name, user.id, normEmail(user.email) || null, Date.now()).run();
  const pname = isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`;
  await sendEmail(db, storeInbox(db), `Question on ${pname}`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">A customer asked a question</h2>
<p style="margin:0 0 6px;font-size:14px;color:#475467;">${escapeHtml(pname)}</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.55;">${escapeHtml(question)}</p>
<p style="margin:0;font-size:14px;">Answer it in the store admin, under Questions.</p>`)).catch(() => false);
  return json({ ok: true, id });
}

/** The store's GSTIN: src/config/business.ts, or the STORE_GSTIN variable when it is set there instead. */
function sellerGstin(env: StoreEnv): string {
  const g = (BUSINESS.gstin || String(env.STORE_GSTIN ?? "")).replace(/\s+/g, "").toUpperCase();
  return validGstin(g) ? g : "";
}
async function taxTable(db: DBEnv) {
  const { results } = await db.DB.prepare("SELECT category, hsn, rate FROM store_tax").all<{ category: string; hsn: string; rate: number }>();
  return { rates: Object.fromEntries(results.map((r) => [r.category, { hsn: r.hsn, rate: Number(r.rate) }])), sellerGstin: sellerGstin(db) };
}

/* ------------------------------------------------------------------ update 78: saved bulk lists */

type ListRow = { id: string; user_id: string; name: string; segment: string; lines: string; created_at: number; updated_at: number; sent_at: number | null };
const listOut = (r: ListRow) => ({ id: r.id, name: r.name, segment: r.segment as Segment, lines: cleanBulkLines(parse<unknown>(r.lines, [])), createdAt: r.created_at, updatedAt: r.updated_at, sentAt: r.sent_at });

async function handleLists(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to keep lists in your account.", signIn: true }, 401);
  const team = await teamIds(db, user.id);
  const all = async () => (await db.DB.prepare(`SELECT * FROM store_bulk_lists WHERE user_id IN (${ph(team.length)}) ORDER BY updated_at DESC LIMIT 50`).bind(...team).all<ListRow>()).results.map(listOut);
  if (path === "lists" && method === "GET") return json({ lists: await all() });
  if (path === "lists" && method === "POST") {
    const b = await readJson(request, 65_536);
    const name = str(b?.name, 80);
    if (name.length < 2) return json({ error: "Give the list a name, like \"Monthly ICU consumables\".", field: "name" }, 400);
    const segment = b?.segment === "college" ? "college" : "hospital";
    const lines = cleanBulkLines(b?.lines);
    if (!lines.length) return json({ error: "The list is empty." }, 400);
    const now = Date.now();
    const id = typeof b?.id === "string" && /^l[a-z0-9]{6,29}$/.test(b.id) ? b.id : "";
    if (id) {
      const cur = await db.DB.prepare(`SELECT id FROM store_bulk_lists WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(id, ...team).first<{ id: string }>();
      if (!cur) return json({ error: "List not found." }, 404);
      await db.DB.prepare("UPDATE store_bulk_lists SET name = ?, segment = ?, lines = ?, updated_at = ? WHERE id = ?").bind(name, segment, JSON.stringify(lines), now, id).run();
      return json({ id, lists: await all() });
    }
    const n = await db.DB.prepare("SELECT COUNT(*) AS n FROM store_bulk_lists WHERE user_id = ?").bind(user.id).first<{ n: number }>();
    if (Number(n?.n) >= 50) return json({ error: "You can keep up to 50 lists. Delete one you no longer need." }, 400);
    const nid = `l${now.toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`;
    await db.DB.prepare("INSERT INTO store_bulk_lists (id, user_id, name, segment, lines, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(nid, user.id, name, segment, JSON.stringify(lines), now, now).run();
    return json({ id: nid, lists: await all() });
  }
  const m = /^lists\/([a-z0-9]{6,30})\/(delete|sent)$/.exec(path);
  if (m && method === "POST") {
    const cur = await db.DB.prepare(`SELECT id FROM store_bulk_lists WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(m[1], ...team).first<{ id: string }>();
    if (!cur) return json({ error: "List not found." }, 404);
    if (m[2] === "delete") await db.DB.prepare("DELETE FROM store_bulk_lists WHERE id = ?").bind(cur.id).run();
    else await db.DB.prepare("UPDATE store_bulk_lists SET sent_at = ? WHERE id = ?").bind(Date.now(), cur.id).run();
    return json({ lists: await all() });
  }
  return json({ error: "Not found" }, 404);
}

/* ------------------------------------------------------------------ update 80: replacement requests */

export const REP_STATUSES = ["requested", "approved", "picked-up", "replaced", "refunded", "rejected"] as const;
type RepStatus = (typeof REP_STATUSES)[number];
const REP_LABEL: Record<RepStatus, string> = { requested: "We've received your request", approved: "Your replacement is approved", "picked-up": "We've picked up the item", replaced: "Your replacement has been sent", refunded: "Your refund has been made", rejected: "We couldn't accept your request" };
const REASONS: Record<string, string> = { damaged: "Arrived damaged", defective: "Doesn't work (defective)", wrong: "Wrong item sent", missing: "Item or part missing" };
type RepRow = { id: string; order_id: string; product_id: number; variant_id: string; qty: number; reason: string; details: string | null; status: string; note: string | null; email: string | null; created_at: number; updated_at: number };
const repOut = (r: RepRow) => ({ id: r.id, orderId: r.order_id, productId: Number(r.product_id), variantId: r.variant_id || null, qty: r.qty, reason: r.reason, reasonText: REASONS[r.reason] ?? r.reason, details: r.details, status: r.status, statusText: REP_LABEL[r.status as RepStatus] ?? r.status, note: r.note, at: r.created_at, updatedAt: r.updated_at });
async function replacementsFor(db: DBEnv, ids: string[]) {
  const m = new Map<string, ReturnType<typeof repOut>[]>();
  if (!ids.length) return m;
  const { results } = await db.DB.prepare(`SELECT * FROM store_replacements WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY created_at ASC`).bind(...ids).all<RepRow>();
  for (const r of results) { const l = m.get(r.order_id) ?? []; l.push(repOut(r)); m.set(r.order_id, l); }
  return m;
}
async function createReplacement(db: DBEnv, r: OrderRow, b: Record<string, any>): Promise<Response> {
  const o = toOrder(r);
  if (o.status !== "delivered") return json({ error: "You can report a problem once the order is delivered." }, 400);
  const deliveredAt = [...o.history].reverse().find((h) => h.status === "delivered")?.at ?? r.updated_at;
  if (Date.now() - deliveredAt > (BUSINESS.replacementDays + 1) * 86400_000) return json({ error: `Problems can be reported within ${BUSINESS.replacementDays} days of delivery. Please write to ${BUSINESS.email}.` }, 400);
  const pid = Number(b.productId), vid = typeof b.variantId === "string" ? b.variantId.slice(0, 80) : "";
  const line = o.lines.find((l) => l.productId === pid && (l.variantId ?? "") === vid);
  if (!line) return json({ error: "That item isn't in this order." }, 400);
  const reason = String(b.reason);
  if (!REASONS[reason]) return json({ error: "Choose what's wrong.", field: "reason" }, 400);
  const qty = Math.round(Number(b.qty));
  if (!Number.isFinite(qty) || qty < 1 || qty > line.qty) return json({ error: `Choose how many, 1 to ${line.qty}.`, field: "qty" }, 400);
  const details = longStr(b.details, 800);
  if (details.length < 10) return json({ error: "Tell us a little about the problem.", field: "details" }, 400);
  const now = Date.now(), id = `x${now.toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`;
  try {
    await db.DB.prepare("INSERT INTO store_replacements (id, order_id, product_id, variant_id, qty, reason, details, status, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?, ?)")
      .bind(id, o.id, pid, vid, qty, reason, details, o.address.email || null, now, now).run();
  } catch { return json({ error: "You've already reported a problem with this item. We'll be in touch." }, 409); }
  await Promise.allSettled([
    sendEmail(db, storeInbox(db), `Replacement request: ${o.id}, ${line.name}`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">A customer reported a problem</h2>
<p style="margin:0;font-size:14px;line-height:1.6;">Order <b>${escapeHtml(o.id)}</b> · ${escapeHtml(line.name)} × ${qty}<br><b>${escapeHtml(REASONS[reason]!)}</b>: ${escapeHtml(details)}<br>${escapeHtml(o.address.name)}, ${escapeHtml(o.address.phone)}, ${escapeHtml(o.address.city)}<br>Handle it in the store admin, under Replacements.</p>`)),
    o.address.email ? sendEmail(db, o.address.email, `Order ${o.id}: we've received your request`, shell(`<h2 style="margin:0 0 8px;font-size:19px;">We've received your request</h2>
<p style="margin:0;font-size:14px;line-height:1.6;">About <b>${escapeHtml(line.name)}</b> (${escapeHtml(REASONS[reason]!)}). We'll reply within one business day, and may ask for a photo. You can follow it on your order at <a href="${SITE_URL}/orders">aethex.in/orders</a>.</p>`)) : Promise.resolve(false),
  ]);
  const reps = (await replacementsFor(db, [o.id])).get(o.id) ?? [];
  return json({ ok: true, replacements: reps });
}

/* ------------------------------------------------------------------ update 80: reorder reminders */

type ReorderRow = { id: string; user_id: string; email: string; product_id: number; variant_id: string; qty: number; every_days: number; next_at: number; last_sent: number | null; created_at: number };
const reorderOut = (r: ReorderRow) => ({ id: r.id, productId: Number(r.product_id), variantId: r.variant_id || null, qty: r.qty, everyDays: r.every_days, nextAt: r.next_at, lastSent: r.last_sent });
export const REORDER_EVERY = [7, 15, 30, 45, 60, 90, 180];
async function handleReminders(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to set reorder reminders.", signIn: true }, 401);
  const all = async () => (await db.DB.prepare("SELECT * FROM store_reorder WHERE user_id = ? ORDER BY next_at ASC").bind(user.id).all<ReorderRow>()).results.map(reorderOut);
  if (method === "GET" && path === "reminders") return json({ reminders: await all() });
  const del = /^reminders\/(r[a-z0-9]{6,30})\/delete$/.exec(path);
  if (del && method === "POST") {
    await db.DB.prepare("DELETE FROM store_reorder WHERE id = ? AND user_id = ?").bind(del[1], user.id).run();
    return json({ reminders: await all() });
  }
  if (path === "reminders" && method === "POST") {
    const b = await readJson(request);
    const p = byId.get(Number(b?.productId));
    if (!p || p.priceOnRequest) return json({ error: "Reminders are for products you can order online." }, 400);
    const vid = typeof b?.variantId === "string" ? b.variantId.slice(0, 80) : "";
    if (vid && !(p.variants ?? []).some((v) => v.id === vid)) return json({ error: "Choose a size or option." }, 400);
    const every = Number(b?.everyDays);
    if (!REORDER_EVERY.includes(every)) return json({ error: `Choose how often: ${REORDER_EVERY.join(", ")} days.`, field: "everyDays" }, 400);
    const qty = Math.max(1, Math.min(20, Math.round(Number(b?.qty) || 1)));
    const n = await db.DB.prepare("SELECT COUNT(*) AS n FROM store_reorder WHERE user_id = ?").bind(user.id).first<{ n: number }>();
    const email = normEmail(user.email);
    if (!email) return json({ error: "Your account needs an email address for reminders." }, 400);
    const now = Date.now(), next = now + every * 86400_000;
    const cur = await db.DB.prepare("SELECT id FROM store_reorder WHERE user_id = ? AND product_id = ? AND variant_id = ?").bind(user.id, p.id, vid).first<{ id: string }>();
    if (cur) await db.DB.prepare("UPDATE store_reorder SET every_days = ?, qty = ?, next_at = ? WHERE id = ?").bind(every, qty, next, cur.id).run();
    else {
      if (Number(n?.n) >= 30) return json({ error: "You can keep up to 30 reminders." }, 400);
      const id = `r${now.toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`;
      await db.DB.prepare("INSERT INTO store_reorder (id, user_id, email, product_id, variant_id, qty, every_days, next_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, user.id, email, p.id, vid, qty, every, next, now).run();
    }
    return json({ reminders: await all() });
  }
  return json({ error: "Not found" }, 404);
}
/** Hourly: reminders that are due get one email each, and move on by their interval. */
export async function runReorderReminders(env: StoreEnv): Promise<{ sent: number }> {
  if (!env.DB) return { sent: 0 };
  const db = env as DBEnv;
  await ensureTables(db.DB);
  const now = Date.now();
  const { results } = await db.DB.prepare("SELECT * FROM store_reorder WHERE next_at <= ? ORDER BY next_at LIMIT 40").bind(now).all<ReorderRow>();
  let sent = 0;
  const find = await finder(db).catch(() => (id: number) => byId.get(id) ?? null);
  for (const r of results) {
    await db.DB.prepare("UPDATE store_reorder SET next_at = ?, last_sent = ? WHERE id = ?").bind(now + r.every_days * 86400_000, now, r.id).run();
    const p = find(Number(r.product_id));
    if (!p || p.priceOnRequest) continue;
    const name = isBookId(p.id) ? p.name : `${brandName(p.brand)} ${p.name}`;
    const v = r.variant_id ? (p.variants ?? []).find((x) => x.id === r.variant_id) : undefined;
    const price = v?.price ?? p.price;
    const link = `${SITE_URL}/reorder?p=${p.id}${r.variant_id ? `&v=${encodeURIComponent(r.variant_id)}` : ""}&q=${r.qty}`;
    if (!(await emailOk(db.DB, { userId: r.user_id }, "reorder"))) continue;
    const ok = await sendEmail(db, r.email, `Time to reorder: ${name}`, withPrefsLink(shell(`<h2 style="margin:0 0 10px;font-size:19px;">Running low?</h2>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">You asked us to remind you every ${r.every_days} days about <b>${escapeHtml(name)}</b>${v ? ` (${escapeHtml(v.label)})` : ""}${price ? `, now ${money(price)}` : ""}${p.inStock ? "" : ". It's out of stock right now; we'll still keep your reminder"}.</p>
<p style="margin:0 0 12px;"><a href="${link}" style="display:inline-block;padding:11px 18px;border-radius:8px;background:#0f766e;color:#fff;font-weight:600;text-decoration:none;">Reorder ${r.qty > 1 ? `${r.qty} ` : ""}in one click</a></p>
<p style="margin:0;font-size:12.5px;color:#667085;">Change or stop reminders in My orders on aethex.in.</p>`))).catch(() => false);
    if (ok) sent++;
  }
  return { sent };
}

/* ------------------------------------------------------------------ update 82: bulk lists shared for approval */

type ApprovalRow = { id: string; token: string; user_id: string; owner_email: string; owner_name: string | null; segment: string; name: string; lines: string; message: string | null; approver_email: string; approver_name: string | null; status: string; comments: string; created_at: number; updated_at: number; decided_at: number | null };
type AComment = { who: string; role: "owner" | "approver"; text: string; at: number };
const APPROVAL_LABEL: Record<string, string> = { pending: "Waiting for approval", approved: "Approved", changes: "Changes asked for", declined: "Not approved" };
const portalOrigin = (segment: string) => `https://${segment === "college" ? "medicalcolleges" : "hospitals"}.aethex.in`;
function approvalOut(r: ApprovalRow, find: (id: number) => Product | null, withEmails = false) {
  const priced = priceBulk(parse<unknown>(r.lines, []), find);
  return {
    id: r.id, token: withEmails ? r.token : undefined, name: r.name, segment: r.segment as Segment, status: r.status, statusText: APPROVAL_LABEL[r.status] ?? r.status,
    message: r.message, ownerName: r.owner_name, approverName: r.approver_name, ...(withEmails ? { approverEmail: r.approver_email } : {}),
    items: priced.items, issues: priced.issues, units: priced.units, estTotal: priced.estTotal, unpriced: priced.unpriced,
    comments: parse<AComment[]>(r.comments, []), createdAt: r.created_at, updatedAt: r.updated_at, decidedAt: r.decided_at,
  };
}
async function handleApprovals(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const find = await finder(db).catch(() => (id: number) => byId.get(id) ?? null);
  const tm = /^approvals\/([A-Za-z0-9_-]{20,64})(?:\/(decision|comment))?$/.exec(path);
  if (tm) {
    // The approver opens the link: the token is the key, no account needed.
    const r = await db.DB.prepare("SELECT * FROM store_approvals WHERE token = ?").bind(tm[1]).first<ApprovalRow>();
    if (!r) return json({ error: "This approval link isn't valid. Ask for the list to be sent again." }, 404);
    if (method === "GET" && !tm[2]) return json({ approval: approvalOut(r, find) });
    if (method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!(await allow(db, `store:approval:${r.id}`, 60, 3600_000))) return json({ error: "Too many changes. Please wait a while." }, 429);
    const b = await readJson(request, 65_536);
    const who = str(b?.name, 60) || r.approver_name || "Approver";
    const text = longStr(b?.comment, 1000);
    const comments = parse<AComment[]>(r.comments, []);
    const now = Date.now();
    if (tm[2] === "comment") {
      if (text.length < 2) return json({ error: "Write a comment." }, 400);
      comments.push({ who, role: "approver", text, at: now });
      await db.DB.prepare("UPDATE store_approvals SET comments = ?, approver_name = COALESCE(approver_name, ?), updated_at = ? WHERE id = ?").bind(JSON.stringify(comments.slice(-100)), who, now, r.id).run();
    } else {
      const decision = String(b?.decision);
      if (!["approved", "changes", "declined"].includes(decision)) return json({ error: "Choose approve, ask for changes, or decline." }, 400);
      if (decision !== "approved" && text.length < 2) return json({ error: "Say what should change, or why.", field: "comment" }, 400);
      let lines = r.lines;
      if (Array.isArray(b?.lines)) { const cl = cleanBulkLines(b.lines); if (!cl.length) return json({ error: "The list can't be empty." }, 400); lines = JSON.stringify(cl); }
      if (text) comments.push({ who, role: "approver", text, at: now });
      await db.DB.prepare("UPDATE store_approvals SET status = ?, lines = ?, comments = ?, approver_name = ?, decided_at = ?, updated_at = ? WHERE id = ?").bind(decision, lines, JSON.stringify(comments.slice(-100)), who, now, now, r.id).run();
    }
    const fresh = (await db.DB.prepare("SELECT * FROM store_approvals WHERE id = ?").bind(r.id).first<ApprovalRow>())!;
    const st = APPROVAL_LABEL[fresh.status] ?? fresh.status;
    await sendEmail(db, r.owner_email, tm[2] === "comment" ? `${who} commented on "${r.name}"` : `"${r.name}": ${st}`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">${escapeHtml(tm[2] === "comment" ? "A new comment on your list" : st)}</h2>
<p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><b>${escapeHtml(who)}</b> ${tm[2] === "comment" ? "commented on" : fresh.status === "approved" ? "approved" : fresh.status === "changes" ? "asked for changes to" : "did not approve"} <b>${escapeHtml(r.name)}</b>${text ? `:<br>&ldquo;${escapeHtml(text)}&rdquo;` : "."}</p>
<p style="margin:0;font-size:14px;"><a href="${portalOrigin(r.segment)}/approvals">See it and send it for a quotation</a></p>`)).catch(() => false);
    return json({ approval: approvalOut(fresh, find) });
  }
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to send a list for approval.", signIn: true }, 401);
  if (method === "GET") {
    const team = await teamIds(db, user.id);
    const { results } = await db.DB.prepare(`SELECT * FROM store_approvals WHERE user_id IN (${ph(team.length)}) ORDER BY updated_at DESC LIMIT 50`).bind(...team).all<ApprovalRow>();
    return json({ approvals: results.map((r) => approvalOut(r, find, true)) });
  }
  if (method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await allow(db, `store:approval-new:${user.id}`, 20, 86400_000))) return json({ error: "That's a lot for one day. Please try again tomorrow." }, 429);
  const b = await readJson(request, 65_536);
  const name = str(b?.name, 80);
  if (name.length < 2) return json({ error: "Give the list a name.", field: "name" }, 400);
  const approverEmail = normEmail(b?.approverEmail);
  if (!validEmail(approverEmail)) return json({ error: "Enter the approver's email.", field: "approverEmail" }, 400);
  if (approverEmail === normEmail(user.email)) return json({ error: "Send it to someone else to approve.", field: "approverEmail" }, 400);
  const lines = cleanBulkLines(b?.lines);
  if (!lines.length) return json({ error: "Your list is empty." }, 400);
  const segment = b?.segment === "college" ? "college" : "hospital";
  const now = Date.now();
  const id = `a${now.toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (x) => x.toString(16).padStart(2, "0")).join("");
  const message = longStr(b?.message, 1000) || null, approverName = str(b?.approverName, 60) || null;
  await db.DB.prepare("INSERT INTO store_approvals (id, token, user_id, owner_email, owner_name, segment, name, lines, message, approver_email, approver_name, status, comments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '[]', ?, ?)")
    .bind(id, token, user.id, normEmail(user.email), str(user.name, 60) || null, segment, name, JSON.stringify(lines), message, approverEmail, approverName, now, now).run();
  const priced = priceBulk(lines, find);
  const link = `${portalOrigin(segment)}/approve/${token}`;
  const sent = await sendEmail(db, approverEmail, `Please approve: ${name}`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">A purchase list for your approval</h2>
<p style="margin:0 0 8px;font-size:14px;line-height:1.6;">${escapeHtml(user.name || user.email)} sent you <b>${escapeHtml(name)}</b>: ${priced.items.length} item${priced.items.length === 1 ? "" : "s"}, ${priced.units.toLocaleString("en-IN")} units${priced.estTotal ? `, about ${money(priced.estTotal)} at listed prices` : ""}.</p>
${message ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">&ldquo;${escapeHtml(message)}&rdquo;</p>` : ""}
<p style="margin:0 0 10px;"><a href="${link}" style="display:inline-block;padding:11px 18px;border-radius:8px;background:#0e7490;color:#fff;font-weight:600;text-decoration:none;">Review the list</a></p>
<p style="margin:0;font-size:12.5px;color:#667085;">You can change quantities, comment, approve or decline. No Aethex account needed.</p>`)).catch(() => false);
  const r = (await db.DB.prepare("SELECT * FROM store_approvals WHERE id = ?").bind(id).first<ApprovalRow>())!;
  return json({ approval: approvalOut(r, find, true), emailed: sent });
}

/* ------------------------------------------------------------------ update 82: equipment register */

export interface Equipment { id: string; name: string; brand?: string; model?: string; serial?: string; location?: string; purchased?: string; orderRef?: string; productId?: number; warrantyUntil?: string; serviceMonths?: number; lastService?: string; calibrationMonths?: number; lastCalibration?: string; notes?: string; nextService?: string | null; nextCalibration?: string | null; createdAt: number; updatedAt: number }
type EqRow = { id: string; user_id: string; data: string; next_service: string | null; next_calibration: string | null; warranty_until: string | null; reminded: string | null; created_at: number; updated_at: number };
const ymd = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const addMonths = (d: string, m: number) => { const x = new Date(`${d}T00:00:00Z`); x.setUTCMonth(x.getUTCMonth() + m); return x.toISOString().slice(0, 10); };
function nextDue(last: string | undefined, start: string | undefined, months: number | undefined): string | null {
  if (!months) return null;
  const from = last ?? start;
  return from ? addMonths(from, months) : null;
}
const eqOut = (r: EqRow): Equipment => ({ ...parse<Omit<Equipment, "id" | "createdAt" | "updatedAt">>(r.data, { name: "" }), id: r.id, nextService: r.next_service, nextCalibration: r.next_calibration, createdAt: r.created_at, updatedAt: r.updated_at });
function cleanEquipment(b: Record<string, any>): Omit<Equipment, "id" | "createdAt" | "updatedAt" | "nextService" | "nextCalibration"> | { error: string } {
  const name = str(b.name, 100);
  if (name.length < 2) return { error: "Name the equipment, like \"ICU monitor, bed 4\"." };
  const months = (v: unknown) => { if (v === "" || v === null || v === undefined) return undefined; const n = Math.round(Number(v)); return [1, 2, 3, 4, 6, 12, 24].includes(n) ? n : NaN; };
  const sm = months(b.serviceMonths), cm = months(b.calibrationMonths);
  if (Number.isNaN(sm) || Number.isNaN(cm)) return { error: "Choose how often: every 1, 2, 3, 4, 6, 12 or 24 months." };
  const out = {
    name, brand: str(b.brand, 60) || undefined, model: str(b.model, 60) || undefined, serial: str(b.serial, 60) || undefined, location: str(b.location, 80) || undefined,
    purchased: ymd(b.purchased), orderRef: str(b.orderRef, 40) || undefined, productId: Number.isInteger(Number(b.productId)) && byId.has(Number(b.productId)) ? Number(b.productId) : undefined,
    warrantyUntil: ymd(b.warrantyUntil), serviceMonths: sm, lastService: ymd(b.lastService), calibrationMonths: cm, lastCalibration: ymd(b.lastCalibration), notes: longStr(b.notes, 500) || undefined,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as typeof out;
}
async function handleEquipment(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to keep an equipment register.", signIn: true }, 401);
  const team = await teamIds(db, user.id);
  const list = async () => (await db.DB.prepare(`SELECT * FROM store_equipment WHERE user_id IN (${ph(team.length)}) ORDER BY updated_at DESC LIMIT 500`).bind(...team).all<EqRow>()).results.map(eqOut);
  const save = async (id: string, e: Exclude<ReturnType<typeof cleanEquipment>, { error: string }>, created: number) => {
    const ns = nextDue(e.lastService, e.purchased, e.serviceMonths), nc = nextDue(e.lastCalibration, e.purchased, e.calibrationMonths);
    await db.DB.prepare("INSERT INTO store_equipment (id, user_id, data, next_service, next_calibration, warranty_until, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, next_service = excluded.next_service, next_calibration = excluded.next_calibration, warranty_until = excluded.warranty_until, updated_at = excluded.updated_at")
      .bind(id, user.id, JSON.stringify(e), ns, nc, e.warrantyUntil ?? null, created, Date.now()).run();
  };
  if (path === "equipment" && method === "GET") return json({ equipment: await list() });
  if (path === "equipment" && method === "POST") {
    const b = await readJson(request);
    const e = cleanEquipment(b ?? {});
    if ("error" in e) return json(e, 400);
    if (b?.id) {
      const cur = await db.DB.prepare(`SELECT * FROM store_equipment WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(str(b.id, 40), ...team).first<EqRow>();
      if (!cur) return json({ error: "Not found." }, 404);
      await save(cur.id, e, cur.created_at);
    } else {
      const n = await db.DB.prepare("SELECT COUNT(*) AS c FROM store_equipment WHERE user_id = ?").bind(user.id).first<{ c: number }>();
      if (Number(n?.c) >= 500) return json({ error: "The register holds up to 500 items." }, 400);
      await save(`e${Date.now().toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(36)).join("").slice(0, 6)}`, e, Date.now());
    }
    return json({ equipment: await list() });
  }
  const m = /^equipment\/(e[a-z0-9]{6,30})\/(delete|done)$/.exec(path);
  if (m && method === "POST") {
    const cur = await db.DB.prepare(`SELECT * FROM store_equipment WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(m[1], ...team).first<EqRow>();
    if (!cur) return json({ error: "Not found." }, 404);
    if (m[2] === "delete") { await db.DB.prepare("DELETE FROM store_equipment WHERE id = ?").bind(cur.id).run(); return json({ equipment: await list() }); }
    const b = await readJson(request);
    const kind = b?.kind === "calibration" ? "calibration" : "service";
    const date = ymd(b?.date) ?? new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
    const e = { ...parse<Record<string, any>>(cur.data, {}), [kind === "service" ? "lastService" : "lastCalibration"]: date };
    const c = cleanEquipment(e);
    if ("error" in c) return json(c, 400);
    await save(cur.id, c, cur.created_at);
    return json({ equipment: await list() });
  }
  return json({ error: "Not found" }, 404);
}
/** Daily-ish (hourly job): 7 days before a service, calibration or warranty end, one email to the owner. */
export async function runEquipmentReminders(env: StoreEnv): Promise<{ sent: number }> {
  if (!env.DB) return { sent: 0 };
  const db = env as DBEnv;
  await ensureTables(db.DB);
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  const soon = new Date(Date.parse(`${today}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
  const { results } = await db.DB.prepare("SELECT e.*, u.email AS email FROM store_equipment e JOIN users u ON u.id = e.user_id WHERE (next_service <= ? OR next_calibration <= ? OR warranty_until <= ?) LIMIT 300").bind(soon, soon, soon).all<EqRow & { email: string }>();
  const byUser = new Map<string, { email: string; lines: string[]; marks: { id: string; mark: string }[] }>();
  for (const r of results) {
    const e = eqOut(r);
    const done = new Set((r.reminded ?? "").split(",").filter(Boolean));
    const due: string[] = [];
    if (e.nextService && e.nextService <= soon && !done.has(`s:${e.nextService}`)) { due.push(`service ${e.nextService < today ? "overdue since" : "due"} ${e.nextService}`); done.add(`s:${e.nextService}`); }
    if (e.nextCalibration && e.nextCalibration <= soon && !done.has(`c:${e.nextCalibration}`)) { due.push(`calibration ${e.nextCalibration < today ? "overdue since" : "due"} ${e.nextCalibration}`); done.add(`c:${e.nextCalibration}`); }
    if (e.warrantyUntil && e.warrantyUntil >= today && e.warrantyUntil <= soon && !done.has(`w:${e.warrantyUntil}`)) { due.push(`warranty ends ${e.warrantyUntil}`); done.add(`w:${e.warrantyUntil}`); }
    if (!due.length || !r.email) continue;
    const u = byUser.get(r.user_id) ?? { email: r.email, lines: [], marks: [] };
    u.lines.push(`<li><b>${escapeHtml(e.name)}</b>${e.location ? ` (${escapeHtml(e.location)})` : ""}: ${escapeHtml(due.join("; "))}</li>`);
    u.marks.push({ id: r.id, mark: [...done].slice(-20).join(",") });
    byUser.set(r.user_id, u);
  }
  let sent = 0;
  for (const [uid, u] of byUser.entries()) {
    for (const m of u.marks) await db.DB.prepare("UPDATE store_equipment SET reminded = ? WHERE id = ?").bind(m.mark, m.id).run();
    if (!(await emailOk(db.DB, { userId: uid }, "equipment"))) continue;
    const ok = await sendEmail(db, u.email, `Equipment due: ${u.lines.length} item${u.lines.length === 1 ? "" : "s"}`, withPrefsLink(shell(`<h2 style="margin:0 0 10px;font-size:19px;">Equipment service and calibration</h2>
<ul style="margin:0 0 12px;padding-left:18px;font-size:14px;line-height:1.7;">${u.lines.join("")}</ul>
<p style="margin:0;font-size:14px;"><a href="https://hospitals.aethex.in/equipment">Open your equipment register</a> to mark them done.</p>`))).catch(() => false);
    if (ok) sent++;
  }
  return { sent };
}

/* ------------------------------------------------------------------ update 84: prescriptions, store credit, delivery times, gifts */

const nid = (p: string) => `${p}${Date.now().toString(36)}${Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 7)}`;
const STORE_SITE = "https://store.aethex.in";
export const RX_MAX_BYTES = 1_048_576;
/** A prescription file from the checkout: PDF, JPEG, PNG or WebP by its first bytes, up to 1 MB. */
function readRxFile(v: unknown): { name: string; type: string; size: number; data: string } | { error: string } {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const data = typeof o.data === "string" ? o.data.replace(/^data:[^,]*,/, "") : "";
  if (!data) return { error: "Upload the prescription for the items that need one." };
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return { error: "That file couldn't be read. Try a photo or a PDF." };
  const size = Math.floor((data.length * 3) / 4) - (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (size > RX_MAX_BYTES) return { error: "The prescription file can be up to 1 MB. A clear photo works well." };
  const head = atob(data.slice(0, 16));
  const type = head.startsWith("%PDF-") ? "application/pdf" : head.charCodeAt(0) === 0xff && head.charCodeAt(1) === 0xd8 ? "image/jpeg" : head.startsWith("\x89PNG") ? "image/png" : head.startsWith("RIFF") && head.slice(8, 12) === "WEBP" ? "image/webp" : "";
  if (!type) return { error: "Upload the prescription as a photo (JPEG, PNG or WebP) or a PDF." };
  return { name: str(o.name, 120).replace(/[\\/:*?"<>|]/g, "_") || "prescription", type, size, data };
}
async function saveRx(db: DBEnv, orderId: string, f: { name: string; type: string; size: number; data: string }) {
  await db.DB.prepare("DELETE FROM store_rx WHERE order_id = ?").bind(orderId).run();
  await db.DB.prepare("INSERT INTO store_rx (id, order_id, name, type, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(nid("x"), orderId, f.name, f.type, f.size, f.data, Date.now()).run();
}
function rxFileResponse(f: { name: string; type: string; data: string }) {
  const bin = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0));
  return new Response(bin, { headers: { "content-type": f.type, "content-disposition": `inline; filename="${f.name.replace(/[^\w.\- ]/g, "_")}"`, "cache-control": "no-store, private", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox" } });
}

/** Store credit: what an account has to spend. Credit used on an order that was then cancelled counts again. */
async function creditBalance(db: DBEnv, userId: string): Promise<number> {
  const r = await db.DB.prepare(`SELECT COALESCE(SUM(amount), 0) AS b FROM store_credit WHERE user_id = ? AND NOT (kind = 'use' AND order_id IN (SELECT id FROM store_orders WHERE status = 'cancelled'))`).bind(userId).first<{ b: number }>();
  return round2(Math.max(0, Number(r?.b ?? 0)));
}
async function creditHistory(db: DBEnv, userId: string) {
  const { results } = await db.DB.prepare(`SELECT c.*, o.status AS order_status FROM store_credit c LEFT JOIN store_orders o ON o.id = c.order_id WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT 50`).bind(userId).all<{ id: string; amount: number; kind: string; order_id: string | null; note: string | null; created_at: number; order_status: string | null }>();
  return results.map((c) => ({ id: c.id, amount: c.amount, kind: c.kind, orderId: c.order_id, note: c.note, at: c.created_at, returned: c.kind === "use" && c.order_status === "cancelled" }));
}

/** Delivery times learnt from the store's own deliveries to the same area; the store's promise until there are enough. */
const workdaysBetween = (a: number, b: number) => {
  let n = 0;
  const d = new Date(a + 330 * 60000); d.setUTCHours(0, 0, 0, 0);
  const end = new Date(b + 330 * 60000); end.setUTCHours(0, 0, 0, 0);
  while (d < end) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w >= 1 && w <= 5) n++; }
  return n;
};
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))]; };
export async function etaFor(db: DBEnv, pin: string) {
  const promise = { basis: "promise" as const, dispatch: [0, BUSINESS.dispatchDays] as [number, number], transit: BUSINESS.deliveryDays, samples: 0 };
  if (!/^[1-9]\d{5}$/.test(pin)) return promise;
  const { results } = await db.DB.prepare("SELECT pincode, created_at, history FROM store_orders WHERE status = 'delivered' AND created_at > ? ORDER BY created_at DESC LIMIT 1500").bind(Date.now() - 365 * 86400_000).all<{ pincode: string; created_at: number; history: string }>();
  const rows = results.map((r) => {
    const h = parse<{ status: string; at: number }[]>(r.history, []);
    const placed = h.find((x) => x.status === "placed")?.at ?? r.created_at, shipped = h.find((x) => x.status === "shipped")?.at, delivered = h.find((x) => x.status === "delivered")?.at;
    return shipped && delivered && delivered > shipped ? { pin: r.pincode, dispatch: workdaysBetween(placed, shipped), transit: workdaysBetween(shipped, delivered) } : null;
  }).filter((x): x is { pin: string; dispatch: number; transit: number } => !!x);
  const area = (n: number, min: number) => { const xs = rows.filter((r) => r.pin.slice(0, n) === pin.slice(0, n)); return xs.length >= min ? xs : null; };
  const district = area(3, 3), near = district ?? area(2, 5);
  if (!near || rows.length < 5) return promise;
  const d = rows.map((r) => r.dispatch), t = near.map((r) => r.transit);
  return { basis: "orders" as const, area: district ? "district" : "region", samples: near.length, dispatch: [Math.max(0, pct(d, 0.25)), Math.max(1, pct(d, 0.8))] as [number, number], transit: [Math.max(1, pct(t, 0.25)), Math.max(1, pct(t, 0.85))] as [number, number] };
}

/** A gift's recipient hears when it ships and when it arrives: no prices, a link to follow it. */
async function giftRecipientEmail(db: DBEnv, o: Order, status: OrderStatus) {
  const g = o.gift;
  if (!g?.toEmail || !g.token || (status !== "shipped" && status !== "delivered")) return false;
  const from = g.from ? escapeHtml(g.from) : "Someone";
  const items = o.lines.map((l) => `<li>${escapeHtml(l.name)}${l.variantLabel ? ` (${escapeHtml(l.variantLabel)})` : ""}${l.qty > 1 ? ` &times;${l.qty}` : ""}</li>`).join("");
  const cash = !isPaid(o) && o.total > 0 ? `<p style="margin:10px 0 0;font-size:14px;">Please keep ${money(o.total)} ready: it's cash on delivery.</p>` : "";
  return sendEmail(db, g.toEmail, status === "shipped" ? `${g.from ?? "Someone"} sent you a gift: it's on its way` : `Your gift from ${g.from ?? "a friend"} has been delivered`, shell(`<h2 style="margin:0 0 10px;font-size:20px;">${status === "shipped" ? `${from} sent you a gift` : "Your gift has been delivered"}</h2>
${g.message ? `<blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid #0d9488;background:#f8fafc;font-size:15px;white-space:pre-wrap;">${escapeHtml(g.message)}</blockquote>` : ""}
<ul style="margin:0 0 10px;padding-left:18px;font-size:14px;line-height:1.7;">${items}</ul>${cash}
<p style="margin:12px 0 0;font-size:14px;"><a href="${STORE_SITE}/gift/${g.token}">Follow your gift</a></p>`)).catch(() => false);
}
/** What the recipient's link shows: the gift, the message and where it is, never the prices or the buyer's details. */
function giftView(r: OrderRow) {
  const o = toOrder(r);
  return {
    id: o.id, status: o.status, from: o.gift?.message !== undefined || o.gift?.from ? o.gift?.from ?? null : null, message: o.gift?.message ?? null,
    items: o.lines.map((l) => ({ productId: l.productId, name: l.name, variantLabel: l.variantLabel ?? null, qty: l.qty, image: (l as { image?: string }).image ?? null })),
    history: o.history.filter((h) => h.status !== "pending").map((h) => ({ status: h.status, at: h.at })), tracking: o.status === "shipped" ? o.tracking ?? null : null,
    city: o.address.city, cod: !isPaid(o) && o.total > 0 ? o.total : 0,
  };
}

/** The customer's routes for update 84. */
async function handleStore84(request: Request, db: DBEnv, path: string, method: string): Promise<Response | null> {
  if (path === "eta" && method === "GET") {
    const pin = str(new URL(request.url).searchParams.get("pin"), 6);
    return json(await etaFor(db, pin), 200, { "cache-control": "public, max-age=900" });
  }
  if (path === "credit" && method === "GET") {
    const user = await currentUser(request, db).catch(() => null);
    if (!user) return json({ error: "Sign in to see your store credit.", signIn: true }, 401);
    return json({ balance: await creditBalance(db, user.id), history: await creditHistory(db, user.id) });
  }
  const gm = /^gift\/([A-Za-z0-9_-]{20,64})$/.exec(path);
  if (gm && method === "GET") {
    if (!(await allow(db, `store:gift:${clientIp(request)}`, 60, 3600_000))) return json({ error: "Too many requests." }, 429);
    const r = await db.DB.prepare("SELECT * FROM store_orders WHERE gift IS NOT NULL AND json_extract(gift, '$.token') = ?").bind(gm[1]).first<OrderRow>();
    if (!r || r.status === "pending") return json({ error: "This gift link isn't valid." }, 404);
    return json({ gift: giftView(r) });
  }
  // the customer's prescription for an order: see it, or send a clearer one while it's being checked
  const rx = /^orders\/([A-Za-z0-9-]{6,20})\/rx$/.exec(path);
  if (rx) {
    const b = method === "POST" ? await readJson(request, 2_000_000) : null;
    const access = await orderFor(request, db, rx[1], b?.phone);
    if (access instanceof Response) return access;
    if (!access.full) return json({ error: "Open the order from the browser or account that placed it." }, 403);
    const r = access.r;
    if (!r.rx_status) return json({ error: "This order doesn't need a prescription." }, 404);
    if (method === "GET") {
      const f = await db.DB.prepare("SELECT name, type, data FROM store_rx WHERE order_id = ?").bind(r.id).first<{ name: string; type: string; data: string }>();
      return f ? rxFileResponse(f) : json({ error: "No file." }, 404);
    }
    if (method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!["pending", "rejected"].includes(r.rx_status) || ["shipped", "delivered", "cancelled"].includes(r.status)) return json({ error: "The prescription has been checked already." }, 409);
    const f = readRxFile(b?.rx);
    if ("error" in f) return json({ error: f.error, field: "rx" }, 400);
    await saveRx(db, r.id, f);
    await db.DB.prepare("UPDATE store_orders SET rx_status = 'pending', rx_note = NULL, updated_at = ? WHERE id = ?").bind(Date.now(), r.id).run();
    await sendEmail(db, storeInbox(db), `Prescription sent again: order ${r.id}`, shell(`<p style="margin:0;font-size:14px;">The customer sent a new prescription for order <b>${r.id}</b>. ${button(`${SITE_URL}/admin`, "Check it")}</p>`)).catch(() => false);
    const fresh = (await rowById(db, r.id))!;
    return json({ order: customerView(fresh, true) });
  }
  return null;
}

/** The admin's routes for update 84. */
async function handleAdmin84(request: Request, env: DBEnv, path: string, method: string, who: string): Promise<Response | null> {
  if (path === "credit" && method === "GET") {
    const email = normEmail(new URL(request.url).searchParams.get("email") ?? "");
    if (email) {
      const u = await env.DB.prepare("SELECT id, email, name FROM users WHERE email = ?").bind(email).first<{ id: string; email: string; name: string | null }>();
      if (!u) return json({ error: "No account with that email. They need to sign in to Aethex once first." }, 404);
      return json({ user: { email: u.email, name: u.name }, balance: await creditBalance(env, u.id), history: await creditHistory(env, u.id) });
    }
    const { results } = await env.DB.prepare("SELECT c.*, u.email AS email FROM store_credit c LEFT JOIN users u ON u.id = c.user_id WHERE c.kind != 'use' ORDER BY c.created_at DESC LIMIT 100").all<{ id: string; amount: number; kind: string; order_id: string | null; note: string | null; created_at: number; email: string | null; by: string | null }>();
    const tot = await env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) AS b FROM store_credit WHERE NOT (kind = 'use' AND order_id IN (SELECT id FROM store_orders WHERE status = 'cancelled'))`).first<{ b: number }>();
    return json({ grants: results.map((c) => ({ id: c.id, email: c.email, amount: c.amount, kind: c.kind, orderId: c.order_id, note: c.note, at: c.created_at, by: c.by })), outstanding: round2(Number(tot?.b ?? 0)) });
  }
  if (path === "credit" && method === "POST") {
    const b = await readJson(request);
    const email = normEmail(b?.email), amount = round2(Number(b?.amount)), note = str(b?.note, 200);
    if (!email) return json({ error: "Enter the customer's email.", field: "email" }, 400);
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 100000) return json({ error: "Enter an amount up to ₹1,00,000 (a minus amount takes credit back).", field: "amount" }, 400);
    if (note.length < 3) return json({ error: "Say why, for example: refund for order AX…, or a goodwill gesture.", field: "note" }, 400);
    const u = await env.DB.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first<{ id: string; email: string }>();
    if (!u) return json({ error: "No account with that email. They need to sign in to Aethex once first.", field: "email" }, 404);
    const orderId = b?.orderId ? cleanOrderId(b.orderId) : "";
    if (orderId && !(await rowById(env, orderId))) return json({ error: "No such order.", field: "orderId" }, 404);
    if (amount < 0 && (await creditBalance(env, u.id)) + amount < -0.005) return json({ error: "That's more than the customer has." }, 400);
    await env.DB.prepare("INSERT INTO store_credit (id, user_id, amount, kind, order_id, note, by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(nid("c"), u.id, amount, amount > 0 ? (orderId ? "refund" : "grant") : "adjust", orderId || null, note, who, Date.now()).run();
    const balance = await creditBalance(env, u.id);
    let emailed = false;
    if (amount > 0 && b?.notify !== false) emailed = await sendEmail(env, u.email, `${rupees(amount)} store credit added to your Aethex account`, shell(`<h2 style="margin:0 0 10px;font-size:20px;">${money(amount)} store credit</h2>
<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(note)}</p><p style="margin:0 0 12px;font-size:14px;">Your balance is <b>${money(balance)}</b>. It's taken off your next order at checkout when you're signed in, and it doesn't expire.</p>${button(STORE_SITE, "Shop now")}`)).catch(() => false);
    return json({ balance, emailed, history: await creditHistory(env, u.id) });
  }
  const rx = /^orders\/([A-Z0-9-]{6,20})\/rx$/.exec(path);
  if (rx) {
    const r = await rowById(env, rx[1]);
    if (!r || !r.rx_status) return json({ error: "No prescription on this order." }, 404);
    if (method === "GET") {
      const f = await env.DB.prepare("SELECT name, type, data FROM store_rx WHERE order_id = ?").bind(r.id).first<{ name: string; type: string; data: string }>();
      return f ? rxFileResponse(f) : json({ error: "No file." }, 404);
    }
    if (method !== "POST") return json({ error: "Method not allowed" }, 405);
    const b = await readJson(request);
    const decision = b?.decision === "approved" ? "approved" : b?.decision === "rejected" ? "rejected" : "";
    const note = str(b?.note, 300);
    if (!decision) return json({ error: "Approve or reject it." }, 400);
    if (decision === "rejected" && note.length < 3) return json({ error: "Tell the customer what's wrong, for example: the doctor's signature isn't visible.", field: "note" }, 400);
    await env.DB.prepare("UPDATE store_orders SET rx_status = ?, rx_note = ?, updated_at = ? WHERE id = ?").bind(decision, note || null, Date.now(), r.id).run();
    const o = toOrder({ ...r, rx_status: decision, rx_note: note || null });
    let emailed = false;
    if (decision === "rejected" && o.address.email) emailed = await sendEmail(env, o.address.email, `Order ${o.id}: please send the prescription again`, shell(`<h2 style="margin:0 0 10px;font-size:20px;">We couldn't accept the prescription</h2>
<p style="margin:0 0 10px;font-size:14px;">${escapeHtml(note)}</p><p style="margin:0 0 12px;font-size:14px;">Upload a clearer one on your order page and we'll check it again. Your order is held until then.</p>${button(`${STORE_SITE}/order/${o.id}`, "Open your order")}`)).catch(() => false);
    const fresh = (await rowById(env, r.id))!;
    return json({ order: { ...toOrder(fresh), userId: fresh.user_id, adminNote: fresh.admin_note || "", updatedAt: fresh.updated_at, paymentId: fresh.payment_id || "" }, emailed });
  }
  return null;
}

/* ------------------------------------------------------------------ update 86: teams, spend, purchase orders */

const ph = (n: number) => Array.from({ length: n }, () => "?").join(",");
type TeamRow = { id: string; name: string; segment: string; owner_id: string; created_at: number };
type MemberRow = { team_id: string; email: string; user_id: string | null; role: string; status: string; token: string; invited_by: string | null; invited_at: number; joined_at: number | null; name?: string | null };
/** The team an account is in (active member), or null. */
async function teamOf(db: DBEnv, userId: string): Promise<(TeamRow & { role: string }) | null> {
  return db.DB.prepare("SELECT t.*, m.role AS role FROM store_team_members m JOIN store_teams t ON t.id = m.team_id WHERE m.user_id = ? AND m.status = 'active' LIMIT 1").bind(userId).first<TeamRow & { role: string }>();
}
/** Whose lists, approvals, quotations and equipment this account sees: its team's members, or just itself. */
export async function teamIds(db: DBEnv, userId: string): Promise<string[]> {
  const { results } = await db.DB.prepare("SELECT m2.user_id FROM store_team_members m1 JOIN store_team_members m2 ON m2.team_id = m1.team_id AND m2.status = 'active' AND m2.user_id IS NOT NULL WHERE m1.user_id = ? AND m1.status = 'active'").bind(userId).all<{ user_id: string }>();
  const ids = results.map((r) => r.user_id);
  return ids.includes(userId) ? ids : [userId];
}
async function teamEmails(db: DBEnv, ids: string[]): Promise<string[]> {
  const { results } = await db.DB.prepare(`SELECT email FROM users WHERE id IN (${ph(ids.length)})`).bind(...ids).all<{ email: string }>();
  return results.map((r) => normEmail(r.email)).filter(Boolean);
}
async function teamView(db: DBEnv, t: TeamRow & { role: string }, me: { id: string }) {
  const { results } = await db.DB.prepare("SELECT m.*, u.name AS name FROM store_team_members m LEFT JOIN users u ON u.id = m.user_id WHERE m.team_id = ? ORDER BY m.status, m.invited_at").bind(t.id).all<MemberRow>();
  return { team: { id: t.id, name: t.name, segment: t.segment, createdAt: t.created_at, role: t.role, owner: t.owner_id === me.id },
    members: results.map((m) => ({ email: m.email, name: m.name ?? null, role: m.role, status: m.status, you: m.user_id === me.id, owner: m.user_id === t.owner_id, invitedAt: m.invited_at, joinedAt: m.joined_at })) };
}

async function handleTeam(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to set up a team.", signIn: true }, 401);
  const email = normEmail(user.email);
  const b = method === "POST" ? (await readJson(request)) ?? {} : {};
  const t = await teamOf(db, user.id);
  if (path === "team" && method === "GET") {
    const { results: inv } = await db.DB.prepare("SELECT m.token, m.role, m.invited_at, t.name, t.segment FROM store_team_members m JOIN store_teams t ON t.id = m.team_id WHERE m.email = ? AND m.status = 'invited'").bind(email).all<{ token: string; role: string; invited_at: number; name: string; segment: string }>();
    return json({ ...(t ? await teamView(db, t, user) : { team: null, members: [] }), invites: inv.map((i) => ({ token: i.token, team: i.name, segment: i.segment, role: i.role, at: i.invited_at })) });
  }
  if (path === "team" && method === "POST") {
    if (t) return json({ error: "You're already in a team. Leave it first to make a new one." }, 409);
    const name = str(b.name, 80), segment = b.segment === "college" ? "college" : "hospital";
    if (name.length < 2) return json({ error: "Name the team: the hospital, college or department.", field: "name" }, 400);
    const id = nid("t"), now = Date.now();
    await db.DB.prepare("INSERT INTO store_teams (id, name, segment, owner_id, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, name, segment, user.id, now).run();
    await db.DB.prepare("DELETE FROM store_team_members WHERE email = ? AND status = 'invited'").bind(email).run();
    await db.DB.prepare("INSERT INTO store_team_members (team_id, email, user_id, role, status, token, invited_at, joined_at) VALUES (?, ?, ?, 'admin', 'active', ?, ?, ?)").bind(id, email, user.id, newToken(), now, now).run();
    return json(await teamView(db, (await teamOf(db, user.id))!, user), 201);
  }
  if (path === "team/accept" && method === "POST") {
    const inv = await db.DB.prepare("SELECT * FROM store_team_members WHERE token = ? AND status = 'invited'").bind(str(b.token, 64)).first<MemberRow>();
    if (!inv) return json({ error: "This invitation isn't valid any more. Ask for a new one." }, 404);
    if (inv.email !== email) return json({ error: `This invitation is for ${inv.email}. Sign in with that email to accept it.` }, 403);
    if (t) return json({ error: "You're already in a team. Leave it first." }, 409);
    await db.DB.prepare("UPDATE store_team_members SET user_id = ?, status = 'active', joined_at = ? WHERE team_id = ? AND email = ?").bind(user.id, Date.now(), inv.team_id, email).run();
    return json(await teamView(db, (await teamOf(db, user.id))!, user));
  }
  if (!t) return json({ error: "You're not in a team." }, 404);
  const admin = t.role === "admin";
  if (path === "team/invite" && method === "POST") {
    if (!admin) return json({ error: "Only team admins can invite." }, 403);
    if (!(await allow(db, `store:team-invite:${t.id}`, 30, 86400_000))) return json({ error: "That's a lot of invitations for one day." }, 429);
    const to = normEmail(b.email), role = b.role === "admin" ? "admin" : "member";
    if (!to) return json({ error: "Enter their email.", field: "email" }, 400);
    const n = await db.DB.prepare("SELECT COUNT(*) AS n FROM store_team_members WHERE team_id = ?").bind(t.id).first<{ n: number }>();
    if (Number(n?.n) >= TEAM_MAX) return json({ error: `A team can have up to ${TEAM_MAX} people.` }, 400);
    const cur = await db.DB.prepare("SELECT status FROM store_team_members WHERE team_id = ? AND email = ?").bind(t.id, to).first<{ status: string }>();
    if (cur?.status === "active") return json({ error: "They're in the team already." }, 409);
    const token = newToken();
    await db.DB.prepare("INSERT INTO store_team_members (team_id, email, role, status, token, invited_by, invited_at) VALUES (?, ?, ?, 'invited', ?, ?, ?) ON CONFLICT(team_id, email) DO UPDATE SET role = excluded.role, token = excluded.token, invited_at = excluded.invited_at").bind(t.id, to, role, token, user.id, Date.now()).run();
    const link = `${portalOrigin(t.segment as Segment)}/team?invite=${token}`;
    const emailed = await sendEmail(db, to, `${str(user.name, 60) || email} invited you to ${t.name} on Aethex`, shell(`<h2 style="margin:0 0 10px;font-size:20px;">Join ${escapeHtml(t.name)} on Aethex</h2>
<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">${escapeHtml(str(user.name, 60) || email)} added you as ${role === "admin" ? "an admin" : "a member"}. The team shares its purchase lists, approvals, quotation requests, purchase orders, spend and equipment register.</p>${button(link, "Accept the invitation")}
<p style="margin:14px 0 0;font-size:12px;color:#718096;">Sign in with this email address (${escapeHtml(to)}) to accept.</p>`)).catch(() => false);
    return json({ ...(await teamView(db, t, user)), emailed });
  }
  const mm = /^team\/members\/(remove|role)$/.exec(path);
  if (mm && method === "POST") {
    if (!admin) return json({ error: "Only team admins can change members." }, 403);
    const who = normEmail(b.email);
    const m = await db.DB.prepare("SELECT * FROM store_team_members WHERE team_id = ? AND email = ?").bind(t.id, who).first<MemberRow>();
    if (!m) return json({ error: "Not in this team." }, 404);
    if (m.user_id === t.owner_id) return json({ error: "The person who made the team stays an admin." }, 400);
    if (mm[1] === "remove") await db.DB.prepare("DELETE FROM store_team_members WHERE team_id = ? AND email = ?").bind(t.id, who).run();
    else await db.DB.prepare("UPDATE store_team_members SET role = ? WHERE team_id = ? AND email = ?").bind(b.role === "admin" ? "admin" : "member", t.id, who).run();
    return json(await teamView(db, t, user));
  }
  if (path === "team/leave" && method === "POST") {
    await db.DB.prepare("DELETE FROM store_team_members WHERE team_id = ? AND user_id = ?").bind(t.id, user.id).run();
    const next = await db.DB.prepare("SELECT user_id FROM store_team_members WHERE team_id = ? AND status = 'active' ORDER BY role = 'admin' DESC, joined_at LIMIT 1").bind(t.id).first<{ user_id: string }>();
    if (!next) { await db.DB.prepare("DELETE FROM store_team_members WHERE team_id = ?").bind(t.id).run(); await db.DB.prepare("DELETE FROM store_teams WHERE id = ?").bind(t.id).run(); }
    else if (t.owner_id === user.id) { await db.DB.prepare("UPDATE store_teams SET owner_id = ? WHERE id = ?").bind(next.user_id, t.id).run(); await db.DB.prepare("UPDATE store_team_members SET role = 'admin' WHERE team_id = ? AND user_id = ?").bind(t.id, next.user_id).run(); }
    return json({ ok: true });
  }
  if (path === "team/rename" && method === "POST") {
    if (!admin) return json({ error: "Only team admins can rename it." }, 403);
    const name = str(b.name, 80);
    if (name.length < 2) return json({ error: "Name the team.", field: "name" }, 400);
    await db.DB.prepare("UPDATE store_teams SET name = ? WHERE id = ?").bind(name, t.id).run();
    return json(await teamView(db, { ...t, name }, user));
  }
  return json({ error: "Not found" }, 404);
}
const TEAM_MAX = 25;

/** India's financial year (April to March) that a time falls in, as its starting year. */
const fyOf = (at: number) => { const d = new Date(at + 330 * 60000); return d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; };
const fyRange = (fy: number) => ({ start: Date.UTC(fy, 3, 1) - 330 * 60000, end: Date.UTC(fy + 1, 3, 1) - 330 * 60000 });

async function handleSpend(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to see your spend.", signIn: true }, 401);
  const t = await teamOf(db, user.id);
  const owner = t ? `team:${t.id}` : `user:${user.id}`;
  if (path === "spend/budget" && method === "POST") {
    if (t && t.role !== "admin") return json({ error: "Only team admins set the budget." }, 403);
    const b = await readJson(request);
    const fy = Math.round(Number(b?.fy)), amount = b?.amount === null || b?.amount === "" ? null : Math.round(Number(b?.amount));
    if (!Number.isFinite(fy) || fy < 2020 || fy > 2100) return json({ error: "Choose the financial year." }, 400);
    if (amount !== null && (!Number.isFinite(amount) || amount < 1 || amount > 1e11)) return json({ error: "Enter the budget in rupees.", field: "amount" }, 400);
    if (amount === null) await db.DB.prepare("DELETE FROM store_spend_budget WHERE owner = ? AND fy = ?").bind(owner, fy).run();
    else await db.DB.prepare("INSERT INTO store_spend_budget (owner, fy, amount, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(owner, fy) DO UPDATE SET amount = excluded.amount, updated_at = excluded.updated_at").bind(owner, fy, amount, Date.now()).run();
    return json({ ok: true, budget: amount });
  }
  if (path !== "spend" || method !== "GET") return json({ error: "Not found" }, 404);
  const asked = Number(new URL(request.url).searchParams.get("fy"));
  const fy = Number.isFinite(asked) && asked >= 2020 && asked <= 2100 ? asked : fyOf(Date.now());
  const { start, end } = fyRange(fy);
  const ids = await teamIds(db, user.id), emails = await teamEmails(db, ids);
  const { results: orders } = await db.DB.prepare(`SELECT o.*, u.name AS uname FROM store_orders o LEFT JOIN users u ON u.id = o.user_id WHERE (o.user_id IN (${ph(ids.length)}) OR o.email IN (${ph(emails.length || 1)})) AND o.status NOT IN ('cancelled', 'pending') AND o.created_at >= ? AND o.created_at < ? ORDER BY o.created_at`).bind(...ids, ...(emails.length ? emails : [""]), start, end).all<OrderRow & { uname: string | null }>();
  const { results: reqs } = await db.DB.prepare(`SELECT * FROM store_bulk_requests WHERE (user_id IN (${ph(ids.length)}) OR email IN (${ph(emails.length || 1)})) AND status = 'ordered' AND created_at >= ? AND created_at < ? ORDER BY created_at`).bind(...ids, ...(emails.length ? emails : [""]), start, end).all<BulkRow & { po?: string | null }>();
  const budget = await db.DB.prepare("SELECT amount FROM store_spend_budget WHERE owner = ? AND fy = ?").bind(owner, fy).first<{ amount: number }>();
  return json({
    fy, start, end, team: t ? { name: t.name, segment: t.segment, role: t.role } : null, budget: budget?.amount ?? null, canSetBudget: !t || t.role === "admin",
    orders: orders.map((r) => { const o = toOrder(r); return { id: o.id, at: o.createdAt, status: o.status, by: r.uname ?? null, total: round2(o.total + (o.credit ?? 0)), lines: o.lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, lineTotal: l.lineTotal })) }; }),
    quotations: reqs.map((r) => { const q = toBulk(r); const po = parse<{ items?: { productId: number; qty: number; unitPrice: number | null; name?: string }[]; number?: string } | null>(r.po ?? null, null);
      const items = po?.items?.length ? po.items.map((i) => ({ productId: i.productId, name: i.name ?? "", qty: i.qty, lineTotal: round2((i.unitPrice ?? 0) * i.qty) })) : q.items.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, lineTotal: round2((i.unitPrice ?? 0) * i.qty) }));
      return { id: q.id, at: q.createdAt, institution: q.institution, po: po?.number ?? null, priced: !!po?.items?.length, total: round2(items.reduce((s, i) => s + i.lineTotal, 0)), lines: items }; }),
  });
}

/* purchase orders: from a quotation request that's quoted or ordered */
type PoItem = { productId: number; variantId?: string | null; name: string; qty: number; unitPrice: number | null };
type Po = { number: string; at: number; updatedAt: number; items: PoItem[]; terms: string; deliverTo: string; notes: string; deliverBy: string; by: string };
async function handlePo(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const m = /^my-quotes\/([A-Z0-9-]{6,24})(?:\/(po))?$/.exec(path);
  if (!m) return json({ error: "Not found" }, 404);
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to open your quotation requests.", signIn: true }, 401);
  const ids = await teamIds(db, user.id), emails = await teamEmails(db, ids);
  const r = await db.DB.prepare(`SELECT * FROM store_bulk_requests WHERE id = ? AND (user_id IN (${ph(ids.length)}) OR email IN (${ph(emails.length || 1)}))`).bind(m[1], ...ids, ...(emails.length ? emails : [""])).first<BulkRow & { po?: string | null }>();
  if (!r) return json({ error: "Quotation request not found." }, 404);
  const po = parse<Po | null>(r.po ?? null, null);
  const t = await teamOf(db, user.id);
  if (method === "GET" && !m[2]) return json({ request: { ...toBulk(r), updatedAt: r.updated_at }, po, buyerTeam: t?.name ?? null });
  if (method !== "POST" || !m[2]) return json({ error: "Method not allowed" }, 405);
  if (!["quoted", "ordered"].includes(r.status)) return json({ error: "A purchase order is made once Aethex has sent the quotation." }, 409);
  const b = await readJson(request, 65_536);
  const req = toBulk(r);
  const items: PoItem[] = [];
  for (const it of req.items) {
    const x = (Array.isArray(b?.items) ? b.items : []).find((y: Record<string, unknown>) => Number(y?.productId) === it.productId && String(y?.variantId ?? "") === String(it.variantId ?? ""));
    const qty = Math.max(0, Math.min(100000, Math.round(Number(x?.qty ?? it.qty))));
    const price = x?.unitPrice === null || x?.unitPrice === "" || x?.unitPrice === undefined ? it.unitPrice ?? null : Number(x.unitPrice);
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1e8)) return json({ error: `Check the price of ${it.name}.` }, 400);
    if (qty > 0) items.push({ productId: it.productId, variantId: it.variantId ?? null, name: it.name + (it.variantLabel ? ` (${it.variantLabel})` : ""), qty, unitPrice: price === null ? null : round2(price) });
  }
  if (!items.length) return json({ error: "A purchase order needs at least one item." }, 400);
  let number = po?.number ?? "";
  if (!number) {
    const fy = fyOf(Date.now());
    const scope = await teamIds(db, user.id);
    const n = await db.DB.prepare(`SELECT COUNT(*) AS n FROM store_bulk_requests WHERE po IS NOT NULL AND json_extract(po, '$.number') LIKE ? AND (user_id IN (${ph(scope.length)}) OR email IN (${ph(emails.length || 1)}))`).bind(`PO/${fy}-${String(fy + 1).slice(2)}/%`, ...scope, ...(emails.length ? emails : [""])).first<{ n: number }>();
    number = `PO/${fy}-${String(fy + 1).slice(2)}/${String(Number(n?.n ?? 0) + 1).padStart(3, "0")}`;
  }
  const deliverBy = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.deliverBy ?? "")) ? String(b!.deliverBy) : req.needBy ?? "";
  const next: Po = { number, at: po?.at ?? Date.now(), updatedAt: Date.now(), items, terms: longStr(b?.terms, 600), deliverTo: longStr(b?.deliverTo, 400), notes: longStr(b?.notes, 600), deliverBy, by: str(user.name, 60) || normEmail(user.email) };
  await db.DB.prepare("UPDATE store_bulk_requests SET po = ? WHERE id = ?").bind(JSON.stringify(next), r.id).run();
  if (!po) await sendEmail(db, storeInbox(db), `Purchase order ${number} for quotation ${r.id}`, shell(`<p style="margin:0;font-size:14px;"><b>${escapeHtml(r.institution)}</b> made purchase order <b>${escapeHtml(number)}</b> for quotation request ${r.id}: ${items.length} items, ${money(items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0))}.</p>${button(`${SITE_URL}/admin`, "Open the store admin")}`)).catch(() => false);
  return json({ po: next });
}

/* ------------------------------------------------------------------ update 89: help tickets, price history */

export const TICKET_TOPICS = ["Late delivery", "Wrong or missing item", "Damaged item", "Payment or refund", "Invoice or GST", "Something else"];
type TicketRow = { id: string; order_id: string; user_id: string | null; email: string | null; topic: string; status: string; created_at: number; updated_at: number };
type MsgRow = { id: string; ticket_id: string; who: string; name: string | null; body: string; at: number };
async function ticketsFor(db: DBEnv, where: string, binds: unknown[]) {
  const { results } = await db.DB.prepare(`SELECT * FROM store_tickets WHERE ${where} ORDER BY updated_at DESC LIMIT 200`).bind(...binds).all<TicketRow>();
  if (!results.length) return [];
  const { results: msgs } = await db.DB.prepare(`SELECT * FROM store_ticket_msgs WHERE ticket_id IN (${results.map(() => "?").join(",")}) ORDER BY at`).bind(...results.map((t) => t.id)).all<MsgRow>();
  return results.map((t) => ({ id: t.id, orderId: t.order_id, topic: t.topic, status: t.status, createdAt: t.created_at, updatedAt: t.updated_at, email: t.email,
    messages: msgs.filter((m) => m.ticket_id === t.id).map((m) => ({ id: m.id, who: m.who, name: m.name, body: m.body, at: m.at })) }));
}
async function addMsg(db: DBEnv, ticketId: string, who: "customer" | "store", name: string | null, body: string, status: string) {
  const now = Date.now();
  await db.DB.prepare("INSERT INTO store_ticket_msgs (id, ticket_id, who, name, body, at) VALUES (?, ?, ?, ?, ?, ?)").bind(nid("m"), ticketId, who, name, body, now).run();
  await db.DB.prepare("UPDATE store_tickets SET status = ?, updated_at = ? WHERE id = ?").bind(status, now, ticketId).run();
}

/** The customer's help requests on an order (the order's own access: its browser or account). */
async function handleTickets(request: Request, db: DBEnv, path: string, method: string): Promise<Response | null> {
  const m = /^orders\/([A-Za-z0-9-]{6,20})\/tickets(?:\/(k[a-z0-9]{6,30})\/(reply|close))?$/.exec(path);
  if (!m) {
    if (path === "my-tickets" && method === "GET") {
      const user = await currentUser(request, db).catch(() => null);
      if (!user) return json({ error: "Sign in to see your help requests.", signIn: true }, 401);
      return json({ tickets: await ticketsFor(db, "user_id = ? OR email = ?", [user.id, normEmail(user.email)]) });
    }
    return null;
  }
  const b = method === "POST" ? await readJson(request) : null;
  const access = await orderFor(request, db, m[1], b?.phone);
  if (access instanceof Response) return access;
  if (!access.full) return json({ error: "Open the order from the browser or account that placed it." }, 403);
  const o = toOrder(access.r);
  if (method === "GET" && !m[2]) return json({ tickets: await ticketsFor(db, "order_id = ?", [o.id]), topics: TICKET_TOPICS });
  if (method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = longStr(b?.body, 2000);
  if (!m[2]) {
    const topic = TICKET_TOPICS.includes(String(b?.topic)) ? String(b!.topic) : "";
    if (!topic) return json({ error: "Choose what it's about.", field: "topic" }, 400);
    if (body.length < 5) return json({ error: "Tell us a little more.", field: "body" }, 400);
    if (!(await allow(db, `store:ticket:${o.id}`, 5, 86400_000))) return json({ error: "You've raised several requests today. We'll reply to those first." }, 429);
    const open = await db.DB.prepare("SELECT id FROM store_tickets WHERE order_id = ? AND topic = ? AND status != 'solved'").bind(o.id, topic).first<{ id: string }>();
    if (open) return json({ error: "There's already an open request about this. Add to it below.", ticket: open.id }, 409);
    const id = nid("k"), now = Date.now();
    await db.DB.prepare("INSERT INTO store_tickets (id, order_id, user_id, email, topic, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'open', ?, ?)").bind(id, o.id, access.r.user_id, o.address.email ?? access.r.email, topic, now, now).run();
    await addMsg(db, id, "customer", o.address.name, body, "open");
    await sendEmail(db, storeInbox(db), `Help request on ${o.id}: ${topic}`, shell(`<p style="margin:0 0 8px;font-size:14px;"><b>${escapeHtml(o.address.name)}</b> on order <b>${o.id}</b> (${escapeHtml(topic)}):</p><blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid #0d9488;background:#f8fafc;font-size:14px;white-space:pre-wrap;">${escapeHtml(body)}</blockquote>${button(`${SITE_URL}/admin`, "Reply in the store admin")}`)).catch(() => false);
    return json({ tickets: await ticketsFor(db, "order_id = ?", [o.id]) }, 201);
  }
  const t = await db.DB.prepare("SELECT * FROM store_tickets WHERE id = ? AND order_id = ?").bind(m[2], o.id).first<TicketRow>();
  if (!t) return json({ error: "Request not found." }, 404);
  if (m[3] === "close") await db.DB.prepare("UPDATE store_tickets SET status = 'solved', updated_at = ? WHERE id = ?").bind(Date.now(), t.id).run();
  else {
    if (body.length < 2) return json({ error: "Write your message.", field: "body" }, 400);
    if (!(await allow(db, `store:ticket-msg:${t.id}`, 30, 86400_000))) return json({ error: "That's a lot of messages. We'll be in touch." }, 429);
    await addMsg(db, t.id, "customer", o.address.name, body, "open");
    await sendEmail(db, storeInbox(db), `New message on ${o.id}: ${t.topic}`, shell(`<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(body)}</p>${button(`${SITE_URL}/admin`, "Reply in the store admin")}`)).catch(() => false);
  }
  return json({ tickets: await ticketsFor(db, "order_id = ?", [o.id]) });
}
async function handleAdminTickets(request: Request, env: DBEnv, path: string, method: string, who: string): Promise<Response | null> {
  if (path === "tickets" && method === "GET") {
    const status = str(new URL(request.url).searchParams.get("status"), 12);
    const list = await ticketsFor(env, ["open", "waiting", "solved"].includes(status) ? "status = ?" : "1 = 1", ["open", "waiting", "solved"].includes(status) ? [status] : []);
    const counts = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM store_tickets GROUP BY status").all<{ status: string; n: number }>();
    return json({ tickets: list, counts: Object.fromEntries(counts.results.map((c) => [c.status, Number(c.n)])) });
  }
  const m = /^tickets\/(k[a-z0-9]{6,30})$/.exec(path);
  if (!m || method !== "POST") return null;
  const t = await env.DB.prepare("SELECT * FROM store_tickets WHERE id = ?").bind(m[1]).first<TicketRow>();
  if (!t) return json({ error: "Request not found." }, 404);
  const b = await readJson(request);
  const body = longStr(b?.body, 3000), status = ["open", "waiting", "solved"].includes(String(b?.status)) ? String(b!.status) : body ? "waiting" : t.status;
  if (body) await addMsg(env, t.id, "store", "Aethex support", body, status);
  else await env.DB.prepare("UPDATE store_tickets SET status = ?, updated_at = ? WHERE id = ?").bind(status, Date.now(), t.id).run();
  let emailed = false;
  if (body && t.email && b?.notify !== false) emailed = await sendEmail(env, t.email, `Re: your order ${t.order_id} (${t.topic})`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">A reply about your order</h2><blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid #0d9488;background:#f8fafc;font-size:14px;white-space:pre-wrap;">${escapeHtml(body)}</blockquote><p style="margin:0;font-size:14px;">Reply on your order page${status === "solved" ? "; we've marked this solved, but you can reopen it by replying" : ""}.</p>${button(`${STORE_SITE}/order/${t.order_id}#help`, "Open your order")}`)).catch(() => false);
  void who;
  return json({ ticket: (await ticketsFor(env, "id = ?", [t.id]))[0], emailed });
}

/** Price history: the selling price of every product, logged when it changes (once a day at most per product). */
export async function logPrices(env: StoreEnv): Promise<{ logged: number }> {
  if (!env.DB) return { logged: 0 };
  const db = env as DBEnv;
  await ensureTables(db.DB);
  const st = await storeState(db);
  const { results } = await db.DB.prepare("SELECT l.product_id, l.price FROM store_price_log l JOIN (SELECT product_id, MAX(at) AS at FROM store_price_log GROUP BY product_id) m ON m.product_id = l.product_id AND m.at = l.at").all<{ product_id: number; price: number }>();
  const last = new Map(results.map((r) => [Number(r.product_id), Number(r.price)]));
  const now = Date.now(), rows: [number, number, number | null][] = [];
  for (const p of catalog.products) {
    const q = sellAs(p, st.overrides.get(p.id), st.offers, st.now);
    if (!q || q.priceOnRequest) continue;
    const s = summarize(q);
    if (s.price === null || s.priceOnRequest) continue;
    if (last.get(p.id) !== s.price) rows.push([p.id, s.price, s.mrp]);
  }
  for (let i = 0; i < rows.length; i += 40) {
    const chunk = rows.slice(i, i + 40);
    await db.DB.prepare(`INSERT INTO store_price_log (product_id, price, mrp, at) VALUES ${chunk.map(() => "(?, ?, ?, ?)").join(",")}`).bind(...chunk.flatMap((r) => [...r, now])).run();
  }
  return { logged: rows.length };
}
async function priceHistory(db: DBEnv, productId: number) {
  const since = Date.now() - 365 * 86400_000;
  const { results } = await db.DB.prepare("SELECT price, mrp, at FROM store_price_log WHERE product_id = ? AND at >= ? ORDER BY at").bind(productId, since).all<{ price: number; mrp: number | null; at: number }>();
  const first = await db.DB.prepare("SELECT MIN(at) AS at FROM store_price_log").first<{ at: number | null }>();
  const d90 = Date.now() - 90 * 86400_000;
  // the price in force on each day of the last 90: the last change before the window counts from its start
  const before = [...results].reverse().find((r) => r.at < d90);
  const window = [...(before ? [{ ...before, at: d90 }] : []), ...results.filter((r) => r.at >= d90)];
  const low = window.length ? window.reduce((a, r) => (r.price < a.price ? r : a)) : null;
  const high = window.length ? window.reduce((a, r) => (r.price > a.price ? r : a)) : null;
  return { points: results.map((r) => ({ price: r.price, mrp: r.mrp, at: r.at })), low90: low ? { price: low.price, at: low.at } : null, high90: high ? { price: high.price, at: high.at } : null, trackingSince: first?.at ?? null };
}

/* ------------------------------------------------------------------ update 90: department indents, consumables stock */

type IndentRow = { id: string; user_id: string; requester: string; department: string; lines: string; note: string | null; status: string; decided_by: string | null; decision_note: string | null; created_at: number; updated_at: number };
const INDENT_STATUS = ["pending", "approved", "rejected", "merged", "cancelled"] as const;
const indentOut = (r: IndentRow, me: string) => {
  const lines = cleanBulkLines(parse<unknown>(r.lines, []));
  return { id: r.id, requester: r.requester, department: r.department, note: r.note, status: r.status, decidedBy: r.decided_by, decisionNote: r.decision_note, createdAt: r.created_at, updatedAt: r.updated_at, mine: r.user_id === me,
    lines: lines.map((l) => { const p = byId.get(l.productId); return { ...l, name: p?.name ?? `Item ${l.productId}`, slug: p?.slug ?? null }; }) };
};
/** May this account approve its team's indents? The team's admins; someone not in a team approves their own. */
async function approver(db: DBEnv, userId: string): Promise<boolean> {
  const t = await teamOf(db, userId);
  return !t || t.role === "admin";
}
async function handleIndents(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to raise and approve indents.", signIn: true }, 401);
  const team = await teamIds(db, user.id), canApprove = await approver(db, user.id);
  const list = async () => (await db.DB.prepare(`SELECT * FROM store_indents WHERE user_id IN (${ph(team.length)}) ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, updated_at DESC LIMIT 300`).bind(...team).all<IndentRow>()).results.map((r) => indentOut(r, user.id));
  const out = async (status = 200) => {
    const items = await list();
    return json({ indents: items, canApprove, departments: [...new Set(items.map((i) => i.department))].slice(0, 40) }, status);
  };
  if (path === "indents" && method === "GET") return out();
  const b = method === "POST" ? (await readJson(request, 32_768)) ?? {} : {};
  if (path === "indents" && method === "POST") {
    const department = str(b.department, 60), requester = str(b.requester, 60) || str(user.name, 60) || normEmail(user.email);
    if (department.length < 2) return json({ error: "Which department is this for? (e.g. ICU, OT, Pathology lab)", field: "department" }, 400);
    const lines = cleanBulkLines(b.lines).filter((l) => byId.has(l.productId));
    if (!lines.length) return json({ error: "Add at least one item.", field: "lines" }, 400);
    if (!(await allow(db, `store:indent:${user.id}`, 40, 86400_000))) return json({ error: "That's a lot of indents for one day." }, 429);
    const id = nid("i"), now = Date.now();
    await db.DB.prepare("INSERT INTO store_indents (id, user_id, requester, department, lines, note, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)")
      .bind(id, user.id, requester, department, JSON.stringify(lines), longStr(b.note, 500) || null, now, now).run();
    // tell the team's admins (not the person who raised it)
    const t = await teamOf(db, user.id);
    if (t) {
      const { results } = await db.DB.prepare("SELECT email FROM store_team_members WHERE team_id = ? AND status = 'active' AND role = 'admin' AND user_id != ?").bind(t.id, user.id).all<{ email: string }>();
      const site = t.segment === "college" ? "https://medicalcolleges.aethex.in" : "https://hospitals.aethex.in";
      for (const a of results.slice(0, 10)) await sendEmail(db, a.email, `Indent from ${department}: ${lines.length} item${lines.length === 1 ? "" : "s"}`, shell(`<p style="margin:0 0 8px;font-size:14px;"><b>${escapeHtml(requester)}</b> (${escapeHtml(department)}) raised an indent:</p><ul style="margin:0 0 12px;padding-left:18px;font-size:14px;line-height:1.7;">${lines.map((l) => `<li>${escapeHtml(byId.get(l.productId)?.name ?? "")} × ${l.qty}</li>`).join("")}</ul>${button(`${site}/indents`, "Review indents")}`)).catch(() => false);
    }
    return out(201);
  }
  const m = /^indents\/(i[a-z0-9]{6,30})\/(approve|reject|cancel|merged)$/.exec(path);
  if (!m || method !== "POST") return json({ error: "Not found" }, 404);
  const r = await db.DB.prepare(`SELECT * FROM store_indents WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(m[1], ...team).first<IndentRow>();
  if (!r) return json({ error: "Indent not found." }, 404);
  const now = Date.now(), act = m[2];
  if (act === "cancel") {
    if (r.user_id !== user.id) return json({ error: "Only the person who raised it can withdraw it." }, 403);
    if (r.status !== "pending") return json({ error: "It has already been decided." }, 409);
    await db.DB.prepare("UPDATE store_indents SET status = 'cancelled', updated_at = ? WHERE id = ?").bind(now, r.id).run();
    return out();
  }
  if (!canApprove) return json({ error: "Only the team's admins (the purchase officer) can do this." }, 403);
  if (act === "merged") {
    if (r.status !== "approved") return json({ error: "Approve it first." }, 409);
    await db.DB.prepare("UPDATE store_indents SET status = 'merged', updated_at = ? WHERE id = ?").bind(now, r.id).run();
    return out();
  }
  if (r.status !== "pending") return json({ error: "It has already been decided." }, 409);
  const note = longStr(b.note, 300) || null, by = str(user.name, 60) || normEmail(user.email);
  // the approver may cut quantities (or drop a line by setting it to 0) before approving
  let lines = cleanBulkLines(parse<unknown>(r.lines, []));
  if (act === "approve" && Array.isArray(b.lines)) {
    const want = new Map((b.lines as { productId?: unknown; variantId?: unknown; qty?: unknown }[]).map((l) => [lineKey(Number(l?.productId), typeof l?.variantId === "string" ? l.variantId : null), Math.max(0, Math.trunc(Number(l?.qty)) || 0)]));
    lines = lines.map((l) => ({ ...l, qty: Math.min(l.qty, want.get(lineKey(l.productId, l.variantId)) ?? l.qty) })).filter((l) => l.qty > 0);
    if (!lines.length) return json({ error: "Nothing left to approve: reject it instead." }, 400);
  }
  await db.DB.prepare("UPDATE store_indents SET status = ?, lines = ?, decided_by = ?, decision_note = ?, updated_at = ? WHERE id = ?").bind(act === "approve" ? "approved" : "rejected", JSON.stringify(lines), by, note, now, r.id).run();
  if (r.user_id !== user.id) {
    const who = await db.DB.prepare("SELECT email FROM users WHERE id = ?").bind(r.user_id).first<{ email: string }>();
    if (who?.email) await sendEmail(db, who.email, `Your indent for ${r.department} was ${act === "approve" ? "approved" : "not approved"}`, shell(`<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(by)} ${act === "approve" ? "approved" : "did not approve"} your indent for <b>${escapeHtml(r.department)}</b>.</p>${note ? `<blockquote style="margin:0 0 12px;padding:10px 14px;border-left:3px solid #0d9488;background:#f8fafc;font-size:14px;">${escapeHtml(note)}</blockquote>` : ""}`)).catch(() => false);
  }
  return out();
}

export interface StockItem { id: string; name: string; unit: string; qty: number; reorderLevel: number; reorderQty: number; location?: string; productId?: number; variantId?: string | null; productName?: string; low: boolean; moves: { kind: string; qty: number; after: number; note: string | null; by: string | null; at: number }[]; updatedAt: number }
type StockRow = { id: string; user_id: string; name: string; unit: string; qty: number; reorder_level: number; reorder_qty: number; location: string | null; product_id: number | null; variant_id: string | null; alerted: number; created_at: number; updated_at: number };
const UNITS = ["pcs", "boxes", "packs", "pairs", "rolls", "bottles", "litres", "ml", "kg", "g", "vials", "ampoules", "strips", "kits", "sets"];
async function handleStock(request: Request, db: DBEnv, path: string, method: string): Promise<Response> {
  const user = await currentUser(request, db).catch(() => null);
  if (!user) return json({ error: "Sign in to keep a stock register.", signIn: true }, 401);
  const team = await teamIds(db, user.id);
  const list = async (): Promise<StockItem[]> => {
    const { results } = await db.DB.prepare(`SELECT * FROM store_stock WHERE user_id IN (${ph(team.length)}) ORDER BY name LIMIT 500`).bind(...team).all<StockRow>();
    if (!results.length) return [];
    const { results: mv } = await db.DB.prepare(`SELECT * FROM (SELECT stock_id, kind, qty, after, note, by_name, at, ROW_NUMBER() OVER (PARTITION BY stock_id ORDER BY at DESC) AS rn FROM store_stock_moves WHERE stock_id IN (${ph(results.length)})) WHERE rn <= 8`).bind(...results.map((r) => r.id)).all<{ stock_id: string; kind: string; qty: number; after: number; note: string | null; by_name: string | null; at: number }>();
    return results.map((r) => ({ id: r.id, name: r.name, unit: r.unit, qty: Number(r.qty), reorderLevel: Number(r.reorder_level), reorderQty: Number(r.reorder_qty), location: r.location ?? undefined,
      productId: r.product_id ?? undefined, variantId: r.variant_id, productName: r.product_id ? byId.get(r.product_id)?.name : undefined, low: Number(r.qty) <= Number(r.reorder_level), updatedAt: r.updated_at,
      moves: mv.filter((x) => x.stock_id === r.id).sort((a, b) => b.at - a.at).map((x) => ({ kind: x.kind, qty: Number(x.qty), after: Number(x.after), note: x.note, by: x.by_name, at: x.at })) }));
  };
  const num = (v: unknown, max = 1_000_000) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : NaN; };
  if (path === "stock" && method === "GET") return json({ stock: await list(), units: UNITS });
  if (method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = (await readJson(request)) ?? {};
  const by = str(user.name, 60) || normEmail(user.email), now = Date.now();
  if (path === "stock") {
    const name = str(b.name, 100), unit = UNITS.includes(String(b.unit)) ? String(b.unit) : "pcs";
    if (name.length < 2) return json({ error: "Name the item, like \"Nitrile gloves, medium\".", field: "name" }, 400);
    const level = num(b.reorderLevel), rq = num(b.reorderQty);
    if (Number.isNaN(level) || Number.isNaN(rq)) return json({ error: "Enter the reorder level and reorder quantity as numbers.", field: "reorderLevel" }, 400);
    const pid = Number.isInteger(Number(b.productId)) && byId.has(Number(b.productId)) ? Number(b.productId) : null;
    const vid = pid && typeof b.variantId === "string" && byId.get(pid)?.variants?.some((v) => v.id === b.variantId) ? String(b.variantId) : null;
    const location = str(b.location, 60) || null;
    if (b.id) {
      const cur = await db.DB.prepare(`SELECT * FROM store_stock WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(str(b.id, 40), ...team).first<StockRow>();
      if (!cur) return json({ error: "Not found." }, 404);
      await db.DB.prepare("UPDATE store_stock SET name = ?, unit = ?, reorder_level = ?, reorder_qty = ?, location = ?, product_id = ?, variant_id = ?, alerted = CASE WHEN qty > ? THEN 0 ELSE alerted END, updated_at = ? WHERE id = ?").bind(name, unit, level, rq, location, pid, vid, level, now, cur.id).run();
    } else {
      const qty = num(b.qty ?? 0);
      if (Number.isNaN(qty)) return json({ error: "Enter the quantity in hand as a number.", field: "qty" }, 400);
      const n = await db.DB.prepare("SELECT COUNT(*) AS c FROM store_stock WHERE user_id = ?").bind(user.id).first<{ c: number }>();
      if (Number(n?.c) >= 500) return json({ error: "The register holds up to 500 items." }, 400);
      const id = nid("s");
      await db.DB.prepare("INSERT INTO store_stock (id, user_id, name, unit, qty, reorder_level, reorder_qty, location, product_id, variant_id, alerted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)").bind(id, user.id, name, unit, qty, level, rq, location, pid, vid, now, now).run();
      await db.DB.prepare("INSERT INTO store_stock_moves (id, stock_id, kind, qty, after, note, by_name, at) VALUES (?, ?, 'set', ?, ?, 'Opening stock', ?, ?)").bind(nid("v"), id, qty, qty, by, now).run();
    }
    return json({ stock: await list() });
  }
  const m = /^stock\/(s[a-z0-9]{6,30})\/(move|delete)$/.exec(path);
  if (!m) return json({ error: "Not found" }, 404);
  const cur = await db.DB.prepare(`SELECT * FROM store_stock WHERE id = ? AND user_id IN (${ph(team.length)})`).bind(m[1], ...team).first<StockRow>();
  if (!cur) return json({ error: "Not found." }, 404);
  if (m[2] === "delete") {
    await db.DB.prepare("DELETE FROM store_stock WHERE id = ?").bind(cur.id).run();
    await db.DB.prepare("DELETE FROM store_stock_moves WHERE stock_id = ?").bind(cur.id).run();
    return json({ stock: await list() });
  }
  const kind = ["in", "out", "set"].includes(String(b.kind)) ? String(b.kind) : "";
  const qty = num(b.qty);
  if (!kind) return json({ error: "Received, used or counted?" }, 400);
  if (Number.isNaN(qty) || (kind !== "set" && qty <= 0)) return json({ error: "Enter a quantity.", field: "qty" }, 400);
  const before = Number(cur.qty);
  if (kind === "out" && qty > before) return json({ error: `Only ${before} ${cur.unit} in hand. Count the stock if that's wrong.`, field: "qty" }, 400);
  const after = Math.round((kind === "in" ? before + qty : kind === "out" ? before - qty : qty) * 100) / 100;
  await db.DB.prepare("UPDATE store_stock SET qty = ?, alerted = CASE WHEN ? > reorder_level THEN 0 ELSE alerted END, updated_at = ? WHERE id = ?").bind(after, after, now, cur.id).run();
  await db.DB.prepare("INSERT INTO store_stock_moves (id, stock_id, kind, qty, after, note, by_name, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(nid("v"), cur.id, kind, qty, after, str(b.note, 120) || null, by, now).run();
  return json({ stock: await list() });
}
/** Hourly job: one email per account when items it added reach their reorder level (once until restocked). */
export async function runStockAlerts(env: StoreEnv): Promise<{ sent: number }> {
  if (!env.DB) return { sent: 0 };
  const db = env as DBEnv;
  await ensureTables(db.DB);
  const { results } = await db.DB.prepare("SELECT s.*, u.email AS email FROM store_stock s JOIN users u ON u.id = s.user_id WHERE s.alerted = 0 AND s.qty <= s.reorder_level LIMIT 500").all<StockRow & { email: string }>();
  const byUser = new Map<string, { email: string; rows: (StockRow & { email: string })[] }>();
  for (const r of results) { const u = byUser.get(r.user_id) ?? { email: r.email, rows: [] }; u.rows.push(r); byUser.set(r.user_id, u); }
  let sent = 0;
  for (const [uid, u] of byUser.entries()) {
    await db.DB.prepare(`UPDATE store_stock SET alerted = 1 WHERE id IN (${ph(u.rows.length)})`).bind(...u.rows.map((r) => r.id)).run();
    if (!u.email || !(await emailOk(db.DB, { userId: uid }, "stock"))) continue;
    const t = await teamOf(db, uid);
    const site = t?.segment === "college" ? "https://medicalcolleges.aethex.in" : "https://hospitals.aethex.in";
    const ok = await sendEmail(db, u.email, `Low stock: ${u.rows.length} item${u.rows.length === 1 ? "" : "s"} at reorder level`, withPrefsLink(shell(`<h2 style="margin:0 0 10px;font-size:19px;">Time to reorder</h2>
<ul style="margin:0 0 12px;padding-left:18px;font-size:14px;line-height:1.7;">${u.rows.map((r) => `<li><b>${escapeHtml(r.name)}</b>${r.location ? ` (${escapeHtml(r.location)})` : ""}: ${Number(r.qty)} ${escapeHtml(r.unit)} left, reorder level ${Number(r.reorder_level)}</li>`).join("")}</ul>
${button(`${site}/stock`, "Open the stock register")}`))).catch(() => false);
    if (ok) sent++;
  }
  return { sent };
}

/* ------------------------------------------------------------------ update 100: sell on Aethex (seller applications) */

export const SELLER_KINDS = ["Manufacturer or brand owner", "Authorised distributor", "Wholesaler", "Retailer or pharmacy", "Publisher (books)"];
export const SELLER_STATUSES = ["new", "contacted", "approved", "rejected"] as const;
type SellerAppRow = { id: string; user_id: string | null; email: string; data: string; status: string; note: string | null; created_at: number; updated_at: number };
const sellerOut = (r: SellerAppRow, admin = false) => ({ id: r.id, email: r.email, status: r.status, note: r.note, createdAt: r.created_at, updatedAt: r.updated_at, ...parse<Record<string, unknown>>(r.data, {}), ...(admin ? {} : {}) });
const SELLER_STATUS_TEXT: Record<string, string> = { new: "Received", contacted: "We're in touch", approved: "Approved", rejected: "Not approved" };

async function handleSellerApply(request: Request, db: DBEnv, path: string, method: string): Promise<Response | null> {
  if (path !== "seller-apply") return null;
  const user = await currentUser(request, db).catch(() => null);
  if (method === "GET") {
    if (!user) return json({ applications: [] });
    const { results } = await db.DB.prepare("SELECT * FROM store_seller_apps WHERE user_id = ? OR email = ? ORDER BY created_at DESC LIMIT 10").bind(user.id, normEmail(user.email)).all<SellerAppRow>();
    return json({ applications: results.map((r) => ({ ...sellerOut(r), statusText: SELLER_STATUS_TEXT[r.status] ?? r.status })) });
  }
  if (method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = (await readJson(request)) ?? {};
  const field = (f: string, error: string) => json({ error, field: f }, 400);
  const business = str(b.business, 100), contact = str(b.contact, 80), email = normEmail(b.email), phone = normPhone(b.phone);
  const gstin = str(b.gstin, 15).toUpperCase(), city = str(b.city, 60), state = str(b.state, 60), pincode = str(b.pincode, 6);
  const kind = SELLER_KINDS.includes(String(b.kind)) ? String(b.kind) : "";
  const cats = Array.isArray(b.categories) ? b.categories.map((c: unknown) => String(c)).filter((c: string) => catalog.categories.some((x) => x.slug === c) || c === "books" || c === "other").slice(0, 25) : [];
  const products = longStr(b.products, 1000), brands = str(b.brands, 200), website = str(b.website, 200), count = str(b.count, 20);
  if (business.length < 2) return field("business", "Enter your business name.");
  if (contact.length < 2) return field("contact", "Enter your name.");
  if (!validEmail(email)) return field("email", "Enter a valid email.");
  if (!phone) return field("phone", "Enter a 10-digit mobile number.");
  if (!kind) return field("kind", "Choose what kind of seller you are.");
  if (gstin && !validGstin(gstin)) return field("gstin", "That GSTIN doesn't look right (15 characters, like 27ABCDE1234F1Z5).");
  if (!city) return field("city", "Enter your city.");
  if (!INDIAN_STATES.includes(state)) return field("state", "Choose your state.");
  if (!validPincode(pincode)) return field("pincode", "Enter a 6-digit PIN code.");
  if (!cats.length) return field("categories", "Choose at least one category.");
  if (products.length < 10) return field("products", "Tell us a little about what you sell.");
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) return field("website", "Enter the full address, like https://example.com");
  if (b.genuine !== true) return field("genuine", "Please confirm the products are genuine and you may sell them.");
  if (!(await allow(db, `store:seller:${clientIp(request)}`, 5, 86400_000))) return json({ error: "Too many applications today. Please try again tomorrow." }, 429);
  const open = await db.DB.prepare("SELECT id FROM store_seller_apps WHERE email = ? AND status IN ('new', 'contacted')").bind(email).first<{ id: string }>();
  if (open) return json({ error: "You already have an application with us. We'll be in touch at this email.", id: open.id }, 409);
  const id = nid("v"), now = Date.now();
  const data = { business, contact, phone, kind, gstin: gstin || null, city, state, pincode, categories: cats, products, brands: brands || null, website: website || null, count: count || null };
  await db.DB.prepare("INSERT INTO store_seller_apps (id, user_id, email, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'new', ?, ?)").bind(id, user?.id ?? null, email, JSON.stringify(data), now, now).run();
  const rows = [["Business", business], ["Contact", `${contact}, ${phone}, ${email}`], ["Type", kind], ["GSTIN", gstin || "–"], ["Place", `${city}, ${state} ${pincode}`], ["Categories", cats.join(", ")], ["Brands", brands || "–"], ["Products", count || "–"], ["Website", website || "–"]];
  await sendEmail(db, storeInbox(db), `Seller application: ${business}`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">A new seller application</h2><table style="font-size:14px;border-collapse:collapse;">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">${k}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`).join("")}</table><p style="margin:12px 0 0;font-size:14px;white-space:pre-wrap;">${escapeHtml(products)}</p>${button(`${STORE_SITE}/admin`, "Open in the store admin")}`)).catch(() => false);
  await sendEmail(db, email, "We've received your application to sell on Aethex", shell(`<h2 style="margin:0 0 10px;font-size:19px;">Thank you, ${escapeHtml(contact)}</h2><p style="margin:0 0 10px;font-size:14px;line-height:1.6;">We've received the application for <b>${escapeHtml(business)}</b>. Our team will review it and get in touch at this email or on ${escapeHtml(phone)}, usually within a few working days, with the next steps and terms.</p><p style="margin:0;font-size:13px;color:#64748b;">Reference: ${id}</p>`)).catch(() => false);
  return json({ ok: true, id }, 201);
}

async function handleAdminSellers(request: Request, env: DBEnv, path: string, method: string): Promise<Response | null> {
  if (path === "seller-apps" && method === "GET") {
    const st = str(new URL(request.url).searchParams.get("status"), 12);
    const ok = (SELLER_STATUSES as readonly string[]).includes(st);
    const { results } = await env.DB.prepare(`SELECT * FROM store_seller_apps${ok ? " WHERE status = ?" : ""} ORDER BY created_at DESC LIMIT 300`).bind(...(ok ? [st] : [])).all<SellerAppRow>();
    const counts = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM store_seller_apps GROUP BY status").all<{ status: string; n: number }>();
    return json({ applications: results.map((r) => sellerOut(r, true)), counts: Object.fromEntries(counts.results.map((c) => [c.status, Number(c.n)])) });
  }
  const m = /^seller-apps\/(v[a-z0-9]{6,30})$/.exec(path);
  if (!m || method !== "POST") return null;
  const r = await env.DB.prepare("SELECT * FROM store_seller_apps WHERE id = ?").bind(m[1]).first<SellerAppRow>();
  if (!r) return json({ error: "Application not found." }, 404);
  const b = (await readJson(request)) ?? {};
  const status = (SELLER_STATUSES as readonly string[]).includes(String(b.status)) ? String(b.status) : r.status;
  const note = longStr(b.note, 1000) || null;
  await env.DB.prepare("UPDATE store_seller_apps SET status = ?, note = ?, updated_at = ? WHERE id = ?").bind(status, note, Date.now(), r.id).run();
  let emailed = false;
  if (b.notify === true && status !== r.status && (status === "approved" || status === "rejected")) {
    const d = parse<{ business?: string; contact?: string }>(r.data, {});
    emailed = await sendEmail(env, r.email, status === "approved" ? `Welcome to Aethex: ${d.business ?? "your application"} is approved` : `Your application to sell on Aethex`, shell(status === "approved"
      ? `<h2 style="margin:0 0 10px;font-size:19px;">You're approved to sell on Aethex</h2><p style="margin:0 0 10px;font-size:14px;line-height:1.6;">Hello ${escapeHtml(d.contact ?? "")}, the application for <b>${escapeHtml(d.business ?? "")}</b> is approved. Our team will contact you to set up your products, prices and payouts.</p>${note ? `<blockquote style="margin:0;padding:10px 14px;border-left:3px solid #0d9488;background:#f8fafc;font-size:14px;white-space:pre-wrap;">${escapeHtml(note)}</blockquote>` : ""}`
      : `<h2 style="margin:0 0 10px;font-size:19px;">About your application</h2><p style="margin:0 0 10px;font-size:14px;line-height:1.6;">Hello ${escapeHtml(d.contact ?? "")}, thank you for applying to sell on Aethex. We can't take <b>${escapeHtml(d.business ?? "")}</b> on at the moment.</p>${note ? `<blockquote style="margin:0;padding:10px 14px;border-left:3px solid #94a3b8;background:#f8fafc;font-size:14px;white-space:pre-wrap;">${escapeHtml(note)}</blockquote>` : ""}`)).catch(() => false);
  }
  return json({ ok: true, emailed });
}

/* ------------------------------------------------------------------ update 101: "notify me" for sections not open yet, and enterprise enquiries */
const INTEREST_TOPICS = ["jobs", "community", "live-classes", "webinars", "video-cases", "drug-alerts", "analytics", "institution-analytics", "enterprise"];
async function handleInterest(request: Request, db: DBEnv, path: string, method: string): Promise<Response | null> {
  if (path !== "interest" || method !== "POST") return null;
  const b = (await readJson(request)) ?? {};
  const topic = INTEREST_TOPICS.includes(String(b.topic)) ? String(b.topic) : "";
  const email = normEmail(b.email);
  if (!topic) return json({ error: "Unknown section." }, 400);
  if (!validEmail(email)) return json({ error: "Enter a valid email.", field: "email" }, 400);
  if (!(await allow(db, `store:interest:${clientIp(request)}`, 20, 86400_000))) return json({ error: "Too many requests today." }, 429);
  const d = b.details && typeof b.details === "object" ? b.details as Record<string, unknown> : {};
  const details = topic === "enterprise" ? { name: str(d.name, 80), college: str(d.college, 120), phone: str(d.phone, 20), seats: str(d.seats, 10), message: longStr(d.message, 1500) } : null;
  await db.DB.prepare("INSERT INTO store_interest (topic, email, details, at) VALUES (?, ?, ?, ?) ON CONFLICT(topic, email) DO UPDATE SET details = excluded.details, at = excluded.at").bind(topic, email, details ? JSON.stringify(details) : null, Date.now()).run();
  if (details) await sendEmail(db, storeInbox(db), `Enterprise enquiry: ${details.college || email}`, shell(`<h2 style="margin:0 0 10px;font-size:19px;">An enterprise enquiry</h2><p style="margin:0;font-size:14px;line-height:1.7;">${escapeHtml(details.name)} (${escapeHtml(email)}, ${escapeHtml(details.phone)})<br>${escapeHtml(details.college)} · ${escapeHtml(details.seats || "?")} seats</p><p style="margin:10px 0 0;font-size:14px;white-space:pre-wrap;">${escapeHtml(details.message)}</p>`)).catch(() => false);
  return json({ ok: true });
}
