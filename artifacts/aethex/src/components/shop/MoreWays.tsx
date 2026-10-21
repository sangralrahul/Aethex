/**
 * Other ways to buy, beside the usual checkout:
 * - Pay for me: a link to this cart for a parent, friend or the institution to
 *   pay (lib/store/share.ts), with the buyer's address if they like; and the
 *   banner that opens such a link on the cart page.
 * - Order on WhatsApp: a message with the items to the store's number, shown
 *   once the store has set its number (STORE_WHATSAPP).
 * - Call me to order: the store calls back to take the order (it shows in the
 *   store admin with the requests).
 * Styles: src/buy.css (.ax-ways2, .ax-share, .ax-shared, .ax-callback).
 */
import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Copy, HandCoins, Loader2, Lock, MessageCircle, PhoneCall, Share2, ShoppingCart, X } from "lucide-react";
import { Dialog } from "@/components/store/Dialog";
import { readContact, rememberContact } from "@/components/store/EnquiryForm";
import { sendEnquiry, useAddresses, useStore, useStoreConfig } from "@/lib/store/api";
import { asProduct, cart } from "@/lib/store/cart";
import { coupon } from "@/lib/store/coupon";
import { readShared, rememberPayFor, shareLink, whatsappLink, type SharedCart } from "@/lib/store/share";
import { normPhone, quoteLines, validEmail } from "@/lib/store/rules";
import type { Address, CartLine, PricedLine } from "@/lib/store/types";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";

const SHARED_KEY = "aethex:shared:v1";
const itemsText = (lines: PricedLine[]) => lines.map((l) => `• ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} × ${l.qty} = ${formatINR(l.lineTotal)}`).join("\n");

/* ------------------------------------------------------------------ the box on the cart */

export function MoreWays({ lines, priced, total, code }: { lines: CartLine[]; priced: PricedLine[]; total: number; code?: string }) {
  const { data: config } = useStoreConfig();
  const [share, setShare] = useState(false);
  const [call, setCall] = useState(false);
  const wa = config?.whatsapp;
  const waText = `Hello ${BUSINESS.brand}, I'd like to order:\n${itemsText(priced)}\nTotal ${formatINR(total)}${code ? ` (coupon ${code})` : ""}\n\nPlease confirm the price and delivery.`;
  return (
    <div className="ax-ways2" aria-label="More ways to buy">
      <p className="h">More ways to buy</p>
      <button type="button" onClick={() => setShare(true)}><span className="ic"><HandCoins size={17} /></span><span><b>Ask someone to pay</b><small>Send this cart to a parent, friend or your institution</small></span></button>
      {wa && <a href={whatsappLink(waText, wa)} target="_blank" rel="noopener noreferrer"><span className="ic wa"><MessageCircle size={17} /></span><span><b>Order on WhatsApp</b><small>Send us this cart and we&apos;ll confirm it there</small></span></a>}
      <button type="button" onClick={() => setCall(true)}><span className="ic"><PhoneCall size={17} /></span><span><b>Call me to order</b><small>We call you back and take the order</small></span></button>
      <ShareCartDialog open={share} onClose={() => setShare(false)} lines={lines} count={priced.reduce((s, l) => s + l.qty, 0)} total={total} code={code} />
      <CallbackDialog open={call} onClose={() => setCall(false)} lines={lines} itemLabel={`${priced.reduce((s, l) => s + l.qty, 0)} items · ${formatINR(total)}`} />
    </div>
  );
}

/** "Order on WhatsApp" for one product (nothing until the store's number is set). */
export function WhatsAppButton({ text, className = "ax-btn ax-wa-btn" }: { text: string; className?: string }) {
  const { data: config } = useStoreConfig();
  if (!config?.whatsapp) return null;
  return <a href={whatsappLink(text, config.whatsapp)} className={className} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Order on WhatsApp</a>;
}

/* ------------------------------------------------------------------ pay for me */

export function ShareCartDialog({ open, onClose, lines, count, total, code }: { open: boolean; onClose: () => void; lines: CartLine[]; count: number; total: number; code?: string }) {
  const { user } = useUserAuth();
  const kept = useAddresses(open && !!user).data ?? [];
  const last = useMemo(() => {
    try { const a = JSON.parse(localStorage.getItem("aethex:checkout:v2") || "null"); return a?.line1 && a?.pincode ? a : null; } catch { return null; }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const choices = useMemo(() => {
    const out: { id: string; label: string; address: Address }[] = kept.map((k) => ({ id: k.id, label: `${k.label}: ${k.address.line1}, ${k.address.city}`, address: k.address }));
    if (!out.length && last) out.push({ id: "last", label: `${last.line1}, ${last.city}`, address: { name: last.name, phone: normPhone(last.phone), line1: last.line1, line2: last.line2 || undefined, landmark: last.landmark || undefined, city: last.city, state: last.state, pincode: last.pincode } });
    return out;
  }, [kept, last]);
  const [from, setFrom] = useState("");
  const [note, setNote] = useState("");
  const [where, setWhere] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) { setFrom((f) => f || user?.name || readContact().name || ""); setCopied(false); } }, [open, user?.name]);
  const addr = choices.find((c) => c.id === where)?.address;
  const link = useMemo(() => (open ? shareLink({ lines, from: from.trim() || undefined, note: note.trim() || undefined, coupon: code || undefined, address: addr }) : ""), [open, lines, from, note, code, addr]);
  const msg = `${from.trim() ? `${from.trim()} here. ` : ""}Could you pay for my order on ${BUSINESS.brand}? ${count} item${count === 1 ? "" : "s"}, about ${formatINR(total)}${note.trim() ? `: ${note.trim()}` : ""}.\n${link}`;
  const copy = () => navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <Dialog open={open} onClose={onClose} title="Ask someone to pay">
      <div className="ax-share">
        <p className="lead">Send this cart to a parent, friend or your institution. They open the link, see these {count} item{count === 1 ? "" : "s"} at today&apos;s prices, and pay. Nothing is ordered until they do.</p>
        <div className="ax-form">
          <label className="f"><span>Your name <em>(optional)</em></span><input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={60} autoComplete="name" /></label>
          <label className="f"><span>A note <em>(optional)</em></span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Books for 2nd year" /></label>
          {choices.length > 0 && (
            <label className="f wide"><span>Deliver to</span>
              <select value={where} onChange={(e) => setWhere(e.target.value)}>
                <option value="">Whoever pays chooses the address</option>
                {choices.map((c) => <option key={c.id} value={c.id}>My address · {c.label}</option>)}
              </select>
            </label>
          )}
        </div>
        {addr && <p className="fine"><Lock size={12} /> Your name, phone and address go in the link. Send it only to people you trust.</p>}
        <div className="ax-share-link"><input readOnly value={link} aria-label="The link" onFocus={(e) => e.target.select()} /><button type="button" className="ax-btn" onClick={copy}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button></div>
        <div className="row">
          <a className="ax-btn teal ax-wa-btn" href={whatsappLink(msg)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Send on WhatsApp</a>
          {canShare && <button type="button" className="ax-btn" onClick={() => navigator.share({ title: "Please pay for my order", text: msg.replace(link, "").trim(), url: link }).catch(() => {})}><Share2 size={16} /> Share</button>}
        </div>
      </div>
    </Dialog>
  );
}

/** Opens a pay-for-me link on the cart page: the items to pay for, and who asked. */
export function SharedCartBanner() {
  const { toast } = useToast();
  // Kept for this visit, so the banner stays while the cart page reloads its prices.
  const [saved] = useState(() => { try { return JSON.parse(sessionStorage.getItem(SHARED_KEY) || "null") as { shared: SharedCart; used: boolean } | null; } catch { return null; } });
  const [shared, setShared] = useState<SharedCart | null>(() => (typeof window === "undefined" ? null : readShared(window.location.hash) ?? saved?.shared ?? null));
  const [used, setUsed] = useState(() => !!saved?.used && !readShared(typeof window === "undefined" ? "" : window.location.hash));
  const keep = (v: { shared: SharedCart; used: boolean } | null) => { try { if (v) sessionStorage.setItem(SHARED_KEY, JSON.stringify(v)); else sessionStorage.removeItem(SHARED_KEY); } catch { /* fine */ } };
  const { data: store } = useStore(!!shared, { books: true });
  const priced = useMemo(() => (shared && store ? quoteLines(shared.lines, (id) => { const p = store.byId.get(id); return p ? asProduct(p) : null; }) : null), [shared, store]);
  const clearHash = () => { try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch { /* fine */ } };
  const apply = (mode: "replace" | "add") => {
    if (!shared) return;
    if (mode === "replace") cart.replace(shared.lines); else cart.addMany(shared.lines);
    if (shared.coupon) coupon.set(shared.coupon);
    rememberPayFor(shared.address ? { from: shared.from, address: shared.address } : null);
    clearHash();
    setUsed(true);
    keep({ shared, used: true });
    toast({ title: "The shared items are in your cart", description: shared.address ? `Checkout will deliver to ${shared.from || "the address in the link"}.` : undefined });
  };
  // With an empty cart, the shared one simply goes in.
  useEffect(() => { if (shared && !used && !cart.get().length) apply("replace"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shared) return null;
  const who = shared.from || "Someone";
  return (
    <div className={`ax-shared${used ? " used" : ""}`} role="region" aria-label="A shared cart">
      <span className="ic"><HandCoins size={22} /></span>
      <div className="tx">
        <b>{who} asked you to pay for {priced ? `${priced.count} item${priced.count === 1 ? "" : "s"} (${formatINR(priced.total)})` : "a cart"}</b>
        {shared.note && <p>&ldquo;{shared.note}&rdquo;</p>}
        <small>{used ? (shared.address ? `They're in your cart below. Checkout delivers to ${shared.from ? `${shared.from}'s` : "their"} address (${shared.address.city} ${shared.address.pincode}).` : "They're in your cart below: check out to pay.") : "Your cart has other things in it. Use the shared items instead, or add them to it?"}</small>
        {priced && priced.issues.length > 0 && <small className="warn">{priced.issues.length} of the items can&apos;t be bought right now.</small>}
      </div>
      {!used ? (
        <div className="acts">
          <button type="button" className="ax-btn teal" onClick={() => apply("replace")}><ShoppingCart size={15} /> Use these items</button>
          <button type="button" className="ax-btn" onClick={() => apply("add")}>Add to my cart</button>
        </div>
      ) : <button type="button" className="x" onClick={() => { setShared(null); keep(null); }} aria-label="Close"><X size={16} /></button>}
    </div>
  );
}

/* ------------------------------------------------------------------ call me to order */

const TIMES = [["any", "Any time"], ["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]] as const;

export function CallbackDialog({ open, onClose, lines, productId, variantId, qty, itemLabel }: {
  open: boolean; onClose: () => void; lines?: CartLine[]; productId?: number; variantId?: string | null; qty?: number; itemLabel?: string;
}) {
  const { user } = useUserAuth();
  const [f, setF] = useState(() => { const c = readContact(); return { name: c.name || user?.name || "", phone: c.phone || user?.phone || "", email: c.email || user?.email || "", when: "any", message: "", website: "" }; });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => { if (open) { setDone(null); setErr(""); } }, [open]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (f.name.trim().length < 2) return setErr("Please enter your name.");
    if (!normPhone(f.phone)) return setErr("Please enter a 10-digit Indian mobile number.");
    if (f.email.trim() && !validEmail(f.email)) return setErr("That email address doesn't look right.");
    setBusy(true);
    try {
      const r = await sendEnquiry({
        kind: "callback", name: f.name.trim(), phone: f.phone, email: f.email.trim() || undefined, when: f.when, message: f.message.trim() || undefined, website: f.website || undefined,
        ...(lines?.length ? { lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })) } : {}),
        ...(productId ? { productId, variantId: variantId ?? null, qty: qty ?? 1 } : {}),
      });
      rememberContact({ name: f.name.trim(), phone: f.phone, email: f.email.trim() });
      setDone(r.id);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Call me to order">
      {done ? (
        <div className="ax-enq-done" role="status">
          <CheckCircle2 size={34} />
          <h3>We&apos;ll call you</h3>
          <p>Thank you{f.name ? `, ${f.name.split(" ")[0]}` : ""}. We&apos;ll call <b>{normPhone(f.phone)}</b>{f.when !== "any" ? ` in the ${f.when}` : ""} to take your order, usually within one business day.</p>
          <p className="ref">Reference <b>{done}</b></p>
        </div>
      ) : (
        <form className="ax-enq ax-callback" onSubmit={submit} noValidate>
          {itemLabel && <p className="ax-enq-item">{itemLabel}</p>}
          <p className="ax-enq-intro">Rather order over the phone? Leave your number and we&apos;ll call you to go through the items, the price and how you&apos;d like to pay.</p>
          <div className="ax-form">
            <label className="f"><span>Your name</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" maxLength={80} /></label>
            <label className="f"><span>Mobile number</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="10-digit mobile" /></label>
            <label className="f wide"><span>Email <em>(optional)</em></span><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" autoComplete="email" maxLength={254} /></label>
            <div className="f wide"><span>When should we call?</span>
              <div className="ax-chips" role="radiogroup" aria-label="When should we call?">
                {TIMES.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={f.when === k} className={f.when === k ? "on" : ""} onClick={() => setF({ ...f, when: k })}>{l}</button>)}
              </div>
            </div>
            <label className="f wide"><span>Anything else <em>(optional)</em></span><textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={2} maxLength={1000} /></label>
            <label className="ax-hp" aria-hidden="true">Website<input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} tabIndex={-1} autoComplete="off" /></label>
          </div>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <button type="submit" className="ax-btn teal lg ax-enq-go" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Sending…</> : <><PhoneCall size={17} /> Call me back</>}</button>
          <p className="ax-enq-fine"><Lock size={12} /> We use your number only to take this order. {BUSINESS.legalName}.</p>
        </form>
      )}
    </Dialog>
  );
}
