/**
 * Update 89: more for the store.
 * - OrderHelp (the order page, #help): raise a help request on the order (late, wrong or missing, damaged, payment
 *   or refund, invoice, other) and keep a conversation with the store until it's solved. MyTickets (My orders).
 *   AdminTickets (store admin → Help): every request, reply (the customer is emailed), mark waiting or solved.
 * - PriceHistory (product pages): the selling price over the last year with the lowest and highest of the last 90
 *   days, recorded by the hourly job since the day tracking started (it says so until there's enough).
 * Styles: src/shop.css (.ax-help*, .ax-ph90*).
 */
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Headset, LineChart, Loader2, MessageSquare, Send, TrendingDown } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { storeFetch, type StoreError } from "@/lib/store/api";
import type { Order } from "@/lib/store/types";
import { formatINR } from "@/lib/utils";

type Msg = { id: string; who: "customer" | "store"; name: string | null; body: string; at: number };
export type Ticket = { id: string; orderId: string; topic: string; status: "open" | "waiting" | "solved"; createdAt: number; updatedAt: number; email?: string | null; messages: Msg[] };
const when = (ms: number) => new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const STATUS: Record<Ticket["status"], string> = { open: "With the store", waiting: "Waiting for you", solved: "Solved" };

function Thread({ t, onSend, onClose, busy }: { t: Ticket; onSend: (body: string) => Promise<void>; onClose?: () => void; busy: boolean }) {
  const [text, setText] = useState("");
  return (
    <div className={`ax-help-t s-${t.status}`} data-ticket={t.id}>
      <div className="hd"><b>{t.topic}</b><span className={`ax-help-st s-${t.status}`}>{STATUS[t.status]}</span><small>{when(t.createdAt)}</small></div>
      <ul>{t.messages.map((m) => <li key={m.id} className={m.who}><small>{m.who === "store" ? "Aethex support" : m.name ?? "You"} · {when(m.at)}</small><p>{m.body}</p></li>)}</ul>
      <form onSubmit={async (e: FormEvent) => { e.preventDefault(); await onSend(text); setText(""); }}>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.status === "solved" ? "Reply to reopen it" : "Write a message"} maxLength={2000} aria-label="Your message" data-store="ticket-reply" />
        <div className="row"><button type="submit" className="ax-btn teal" disabled={busy || text.trim().length < 2}><Send size={14} /> Send</button>{onClose && t.status !== "solved" && <button type="button" className="ax-link" onClick={onClose}>Mark solved</button>}</div>
      </form>
    </div>
  );
}

export function OrderHelp({ order, token }: { order: Order; token?: string }) {
  const qc = useQueryClient();
  const headers = token ? { "x-order-token": token } : undefined;
  const { data } = useQuery({ queryKey: ["store", "tickets", order.id], queryFn: () => storeFetch<{ tickets: Ticket[]; topics: string[] }>(`/orders/${order.id}/tickets`, { headers }), retry: false });
  const [open, setOpen] = useState(false), [topic, setTopic] = useState(""), [body, setBody] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  if (!data || order.status === "pending") return null;
  const set = (t: Ticket[]) => qc.setQueryData(["store", "tickets", order.id], { ...data, tickets: t });
  const run = async (fn: () => Promise<{ tickets: Ticket[] }>) => { setBusy(true); setErr(""); try { set((await fn()).tickets); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); } };
  return (
    <section className="ax-help" id="help" data-store="order-help">
      <div className="ax-help-h"><Headset size={18} /><b>Need help with this order?</b>{!open && <button type="button" className="ax-btn" onClick={() => setOpen(true)} data-store="help-open"><MessageSquare size={15} /> Get help</button>}</div>
      {open && (
        <form className="ax-help-new ax-form" onSubmit={(e) => { e.preventDefault(); void run(() => storeFetch(`/orders/${order.id}/tickets`, { json: { topic, body }, headers })).then(() => { setOpen(false); setTopic(""); setBody(""); }); }} data-store="help-form">
          <div className="topics" role="radiogroup" aria-label="What is it about?">{data.topics.map((t) => <button key={t} type="button" role="radio" aria-checked={topic === t} className={topic === t ? "on" : ""} onClick={() => setTopic(t)}>{t}</button>)}</div>
          <label className="f wide"><span>Tell us what happened</span><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="e.g. The BP monitor's cuff is missing from the box." /></label>
          <div className="row"><button type="submit" className="ax-btn teal" disabled={busy || !topic || body.trim().length < 5}>{busy ? <Loader2 size={15} className="spin" /> : <Send size={15} />} Send to the store</button><button type="button" className="ax-link" onClick={() => setOpen(false)}>Cancel</button></div>
          <p className="fine">We usually reply within a business day, by email and here. For a damaged or wrong item, you can also ask for a replacement on the item above.</p>
        </form>
      )}
      {err && <p className="ax-form-err" role="alert">{err}</p>}
      {data.tickets.map((t) => <Thread key={t.id} t={t} busy={busy} onSend={(b) => run(() => storeFetch(`/orders/${order.id}/tickets/${t.id}/reply`, { json: { body: b }, headers }))} onClose={() => void run(() => storeFetch(`/orders/${order.id}/tickets/${t.id}/close`, { json: {}, headers }))} />)}
    </section>
  );
}

/** My orders: open help requests at a glance. */
export function MyTickets() {
  const { isLoggedIn } = useUserAuth();
  const { data } = useQuery({ enabled: isLoggedIn, queryKey: ["store", "my-tickets"], queryFn: () => storeFetch<{ tickets: Ticket[] }>("/my-tickets").then((r) => r.tickets), retry: false });
  const open = (data ?? []).filter((t) => t.status !== "solved");
  if (!open.length) return null;
  return (
    <section className="ax-help-mine" data-store="my-tickets">
      <b><Headset size={16} /> Help requests</b>
      <ul>{open.map((t) => <li key={t.id}><Link href={`/order/${t.orderId}#help`}>{t.topic} · {t.orderId}</Link><span className={`ax-help-st s-${t.status}`}>{STATUS[t.status]}</span></li>)}</ul>
    </section>
  );
}

export function AdminTickets({ admin }: { admin: <T>(path: string, init?: { method?: string; json?: unknown }) => Promise<T> }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"open" | "waiting" | "solved" | "">("open");
  const { data } = useQuery({ queryKey: ["store", "admin", "tickets", status], queryFn: () => admin<{ tickets: Ticket[]; counts: Record<string, number> }>(`tickets${status ? `?status=${status}` : ""}`) });
  const [openId, setOpenId] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const reply = async (t: Ticket, body: string, st?: string) => { setBusy(true); setMsg(""); try { const r = await admin<{ emailed: boolean }>(`tickets/${t.id}`, { method: "POST", json: { body, status: st } }); setMsg(body ? (r.emailed ? "Sent; the customer was emailed." : "Sent.") : "Updated."); await qc.invalidateQueries({ queryKey: ["store", "admin", "tickets"] }); } catch (x) { setMsg((x as Error).message); } finally { setBusy(false); } };
  return (
    <div data-admin="tickets">
      <div className="ax-adm-filters">{(["open", "waiting", "solved", ""] as const).map((s) => <button key={s || "all"} type="button" className={status === s ? "on" : ""} onClick={() => setStatus(s)}>{s ? STATUS[s] : "All"} {s && data?.counts?.[s] ? `(${data.counts[s]})` : ""}</button>)}</div>
      {msg && <p className="fine" role="status">{msg}</p>}
      {!data ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : !data.tickets.length ? <p className="fine">Nothing here.</p> : (
        <ul className="ax-help-adm">{data.tickets.map((t) => (
          <li key={t.id}>
            <button type="button" className="row" onClick={() => setOpenId(openId === t.id ? "" : t.id)} aria-expanded={openId === t.id} data-admin-ticket={t.id}>
              <span><b>{t.topic}</b><small>{t.orderId} · {t.email ?? "no email"} · {when(t.updatedAt)} · {t.messages.length} message{t.messages.length === 1 ? "" : "s"}</small></span>
              <span className={`ax-help-st s-${t.status}`}>{STATUS[t.status]}</span><ChevronDown size={16} />
            </button>
            {openId === t.id && <div className="body">
              <Thread t={t} busy={busy} onSend={(b) => reply(t, b)} />
              <div className="row">{t.status !== "solved" ? <button type="button" className="ax-btn" onClick={() => void reply(t, "", "solved")} data-admin="ticket-solve"><CheckCircle2 size={14} /> Mark solved</button> : <button type="button" className="ax-btn" onClick={() => void reply(t, "", "open")}>Reopen</button>}<span className="fine">Order {t.orderId}</span></div>
            </div>}
          </li>
        ))}</ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- price history */
type Hist = { points: { price: number; mrp: number | null; at: number }[]; low90: { price: number; at: number } | null; high90: { price: number; at: number } | null; trackingSince: number | null };
export function PriceHistory({ productId, price }: { productId: number; price: number | null }) {
  const { data } = useQuery({ queryKey: ["store", "pricehist", productId], queryFn: () => storeFetch<Hist>(`/products/${productId}/price-history`), retry: false, staleTime: 10 * 60_000 });
  const [open, setOpen] = useState(false);
  const chart = useMemo(() => {
    if (!data || data.points.length < 2) return null;
    const pts = [...data.points, { price: data.points[data.points.length - 1]!.price, mrp: null, at: Date.now() }];
    const W = 460, H = 110, P = 16;
    const lo = Math.min(...pts.map((p) => p.price)), hi = Math.max(...pts.map((p) => p.price)), span = hi - lo || 1, t0 = pts[0]!.at, ts = Date.now() - t0 || 1;
    const x = (t: number) => P + ((t - t0) / ts) * (W - 2 * P), y = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);
    let d = "";
    pts.forEach((p, i) => { d += i ? ` H${x(p.at).toFixed(1)} V${y(p.price).toFixed(1)}` : `M${x(p.at).toFixed(1)},${y(p.price).toFixed(1)}`; });
    return { W, H, d, lo, hi };
  }, [data]);
  if (!data || price === null) return null;
  const since = data.trackingSince ? new Date(data.trackingSince).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  const atLow = data.low90 && price <= data.low90.price;
  return (
    <div className="ax-ph90" data-store="price-history">
      <button type="button" className="ax-ph90-h" onClick={() => setOpen(!open)} aria-expanded={open} data-store="price-history-toggle">
        {atLow && data.points.length > 1 ? <><TrendingDown size={15} /> <b>Lowest price in 90 days</b></> : <><LineChart size={15} /> <span>Price history</span></>}
        {data.low90 && data.points.length > 1 && !atLow && <small>90-day low {formatINR(data.low90.price)}</small>}
        <ChevronDown size={14} className="ch" />
      </button>
      {open && (chart ? (
        <div className="ax-ph90-b">
          <svg viewBox={`0 0 ${chart.W} ${chart.H}`} role="img" aria-label={`Price from ${formatINR(chart.lo)} to ${formatINR(chart.hi)}`}><path d={chart.d} fill="none" stroke="#0f766e" strokeWidth={2} /></svg>
          <p>90 days: lowest <b>{formatINR(data.low90!.price)}</b>, highest <b>{formatINR(data.high90!.price)}</b>. Now {formatINR(price)}.</p>
          <small>Our own selling price, recorded since {since}.</small>
        </div>
      ) : <p className="ax-ph90-b fine">We started recording this price{since ? ` on ${since}` : ""}. The history appears once it changes.</p>)}
    </div>
  );
}
