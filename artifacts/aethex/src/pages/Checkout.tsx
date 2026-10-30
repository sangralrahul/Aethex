/**
 * Checkout (/checkout): a quiet page of its own (no shop menus), in three
 * steps: the delivery address, how to pay (cash on delivery, or online through
 * Razorpay: UPI, cards, netbanking, wallets, once the store has added its
 * Razorpay keys, or by bank transfer once the store has added its account),
 * and the items, to place the order, as a gift if wanted, or for a clinic or
 * business. A signed-in buyer picks from the addresses kept in the account (and
 * can keep a new one); an address from a pay-for-me link fills in the form. A coupon from the cart
 * carries over. The Worker prices the order again (worker/store.ts); if a price
 * changed meanwhile, the customer sees the new total before placing it. An
 * online order waits for its payment: closing the payment window keeps it, so
 * paying again (or switching to cash) doesn't make a second order; changing the
 * cart, address, note or coupon drops it for a new one. Each try carries a
 * random key, so a retry after a lost answer gets back the order the first try
 * made. On phones the summary folds up at the top and a pay bar stays at the
 * bottom. Styles: src/buy.css (.ax-co-*).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowRight, BadgeCheck, Banknote, Briefcase, Building2, ChevronDown, CreditCard, Gift, HandCoins, Loader2, Lock, MapPin, NotebookPen, PackageCheck, Pencil, Plus, RotateCcw, ShieldCheck, ShoppingBag, UserRound,
} from "lucide-react";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { CouponBox } from "@/components/shop/CouponBox";
import { BuySteps, PayWays, Roll, StepMark, TrustList } from "@/components/shop/BuyKit";
import { Logo } from "@/components/layout/Navbar";
import { ProductImage } from "@/components/store/ProductImage";
import { isBookId } from "@/lib/store/bookdata";
import { readContact, rememberContact } from "@/components/store/EnquiryForm";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useSeo } from "@/hooks/use-seo";
import { cancelOrder, payOrder, placeOrder, retryPayment, saveOrder, StoreError, switchToCod, useAddresses, useStoreConfig, type CustomerOrder, type RazorpayCheckout } from "@/lib/store/api";
import { readPayFor } from "@/lib/store/share";
import { cart } from "@/lib/store/cart";
import { coupon, usePricedCart } from "@/lib/store/coupon";
import { dayText, deliveryWindow, lookupPin, savePin, savedPin } from "@/lib/store/delivery";
import { payWithRazorpay } from "@/lib/store/razorpay";
import { BANK_DAYS, BANK_LIMIT, BANK_MIN, COD_LIMIT, INDIAN_STATES, ONLINE_LIMIT, normPhone, validEmail, validGstin, validPincode } from "@/lib/store/rules";
import type { Address, PaymentMethod, SavedAddress } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";

type Step = "address" | "review";
const ADDR_KEY = "aethex:checkout:v2";
const PAY_KEY = "aethex:pay:v1";
const EMPTY = { name: "", phone: "", email: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };
type Form = typeof EMPTY;
const LABELS = ["Home", "Hostel", "Clinic", "Work", "Other"];
/** A kept address as the form holds it (the email stays the buyer's own). */
const fromSaved = (a: Address, email: string): Form => ({ ...EMPTY, ...a, email, line2: a.line2 ?? "", landmark: a.landmark ?? "" });
/** The same person at the same place, as the Worker compares them. */
const addrKey = (a: { name: string; phone: string; line1: string; line2?: string; city: string; pincode: string }) =>
  [a.name, normPhone(a.phone) || a.phone, a.line1, a.line2 ?? "", a.city, a.pincode].map((v) => v.toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");
/** An online order made at this checkout and not paid yet: paying again reuses it while the order is the same (sig). */
type Pending = { id: string; token: string; total: number; sig: string; checkout?: RazorpayCheckout };
/** The last try at placing an order: its key, for the same order (method and sig), until the Worker answers with it. */
type Attempt = { key: string; sig: string };

function check(a: Form): string {
  if (a.name.trim().length < 2) return "Please enter the name of the person receiving the order.";
  if (!normPhone(a.phone)) return "Please enter a 10-digit Indian mobile number.";
  if (a.email.trim() && !validEmail(a.email)) return "That email address doesn't look right.";
  if (a.line1.trim().length < 4) return "Please enter the house, flat or building and street.";
  if (!validPincode(a.pincode)) return "Please enter a 6-digit PIN code.";
  if (a.city.trim().length < 2) return "Please enter the town or city.";
  if (!a.state) return "Please choose the state.";
  return "";
}

function readSession<T>(k: string): T | null { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch { return null; } }
function writeSession(k: string, v: unknown) { try { if (v) sessionStorage.setItem(k, JSON.stringify(v)); else sessionStorage.removeItem(k); } catch { /* fine */ } }
const readPending = () => readSession<Pending>("aethex:pending");
const writePending = (p: Pending | null) => writeSession("aethex:pending", p);
const readAttempt = () => readSession<Attempt>("aethex:attempt");
const writeAttempt = (a: Attempt | null) => writeSession("aethex:attempt", a);
/** 24 random bytes, URL-safe base64: the key of a try at placing an order (and that order's token). */
function newKey(): string {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function Checkout() {
  useSeo({ title: "Checkout | Aethex Store", description: "Delivery details and payment.", path: "/checkout" });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUserAuth();
  const { data: config } = useStoreConfig();

  const [step, setStep] = useState<Step>("address");
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [addr, setAddr] = useState<Form>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADDR_KEY) || "{}");
      const c = readContact();
      const pin = savedPin();
      const pf = readPayFor();
      if (pf) return fromSaved(pf.address, c.email || "");
      return { ...EMPTY, name: c.name, phone: c.phone, email: c.email, city: c.city, ...(pin ? { pincode: pin } : {}), ...saved };
    } catch { return EMPTY; }
  });
  const [pay, setPay] = useState<PaymentMethod>(() => { try { const v = localStorage.getItem(PAY_KEY); return v === "cod" || v === "bank" ? v : "online"; } catch { return "online"; } });
  const [payFor] = useState(readPayFor);
  // Addresses kept in the account: picked here, and a new one kept when asked.
  const saved = useAddresses(!!user);
  const kept: SavedAddress[] = saved.data ?? [];
  const [keepIt, setKeepIt] = useState(true);
  const [keepLabel, setKeepLabel] = useState("");
  const [newAddr, setNewAddr] = useState(false);
  const picked = kept.find((k) => addrKey(k.address) === addrKey(addr));
  // A gift (message and who it's from), and buying for a clinic or business.
  const [isGift, setIsGift] = useState(false);
  const [gift, setGift] = useState({ message: "", from: "" });
  const [isBiz, setIsBiz] = useState(false);
  const [biz, setBiz] = useState({ name: "", gstin: "" });
  const [place, setPlace] = useState("");
  const [sumOpen, setSumOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const pending = useRef<Pending | null>(readPending());

  const phone = step === "review" ? normPhone(addr.phone) || undefined : undefined;
  const priced = usePricedCart(phone);
  const { quote: t, store, isLoading, lines } = priced;
  const linesKey = useMemo(() => lines.map((l) => `${l.productId}:${l.variantId ?? ""}:${l.qty}`).join("|"), [lines]);

  useEffect(() => {
    setAddr((a) => ({ ...a, name: a.name || user?.name || "", email: a.email || user?.email || "", phone: a.phone || user?.phone || "" }));
  }, [user?.name, user?.email, user?.phone]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); setErr(""); }, [step]);
  // With nothing typed yet (and no address from a pay-for-me link), the default kept address fills the form.
  const filled = useRef(false);
  useEffect(() => {
    if (filled.current || !kept.length) return;
    filled.current = true;
    if (payFor || addr.line1.trim()) return;
    const d = kept.find((k) => k.isDefault) ?? kept[0];
    setAddr((a) => fromSaved(d.address, a.email));
  }, [kept, payFor, addr.line1]);
  const usePicked = (k: SavedAddress) => { setNewAddr(false); setErr(""); setAddr((a) => fromSaved(k.address, a.email)); };
  const startNew = () => { setNewAddr(true); setErr(""); setAddr((a) => ({ ...EMPTY, name: user?.name ?? "", phone: a.phone, email: a.email })); };

  // The PIN code fills in the town and state (from India Post's records) when they're empty, or were filled in from an earlier PIN.
  const auto = useRef({ city: "", state: "" });
  useEffect(() => {
    const pin = addr.pincode.trim();
    if (!validPincode(pin)) { setPlace(""); return; }
    let live = true;
    lookupPin(pin).then((p) => {
      if (!live) return;
      if (!p) { setPlace("unknown"); return; }
      setPlace(`${p.district}, ${p.state}`);
      const st = INDIAN_STATES.includes(p.state) ? p.state : "";
      setAddr((a) => {
        const city = !a.city.trim() || a.city === auto.current.city ? p.district : a.city;
        const state = st && (!a.state || a.state === auto.current.state) ? st : a.state;
        auto.current = { city: city === p.district ? city : auto.current.city, state: st && state === st ? st : auto.current.state };
        return city === a.city && state === a.state ? a : { ...a, city, state };
      });
    }).catch(() => { if (live) setPlace(""); });
    return () => { live = false; };
  }, [addr.pincode]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  const toReview = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = check(addr);
    if (problem) { setErr(problem); return; }
    try { localStorage.setItem(ADDR_KEY, JSON.stringify(addr)); } catch { /* storage blocked */ }
    rememberContact({ name: addr.name.trim(), phone: addr.phone, email: addr.email.trim(), city: addr.city.trim() });
    savePin(addr.pincode.trim());
    setStep("review");
  };

  const onlineOpen = !!config?.onlinePayments && t.total <= (config?.onlineLimit ?? ONLINE_LIMIT);
  const codOpen = t.total <= COD_LIMIT;
  const bankMin = config?.bankMin ?? BANK_MIN, bankMax = config?.bankLimit ?? BANK_LIMIT, bankDays = config?.bankDays ?? BANK_DAYS;
  const bankShown = !!config?.bankTransfer;
  const bankOpen = bankShown && t.total >= bankMin && t.total <= bankMax;
  const method: PaymentMethod | null = pay === "online" && onlineOpen ? "online" : pay === "bank" && bankOpen ? "bank"
    : codOpen ? "cod" : onlineOpen ? "online" : bankOpen ? "bank" : null;
  const choose = (m: PaymentMethod) => { setPay(m); try { localStorage.setItem(PAY_KEY, m); } catch { /* fine */ } };

  const done = (o: CustomerOrder) => {
    try { sessionStorage.setItem(`aethex:placed:${o.id}`, JSON.stringify(o)); } catch { /* fine */ }
    writePending(null);
    writeAttempt(null);
    pending.current = null;
    cart.clear();
    coupon.clear(); // a code is usually for one order: it's typed again for the next
    setLocation(`/order/${o.id}`);
  };

  /** Opens Razorpay for the order; places it once the Worker has checked the payment. */
  const payOnline = async (p: Pending, ck: RazorpayCheckout) => {
    const r = await payWithRazorpay(ck);
    if ("paid" in r) {
      try {
        const confirmed = await payOrder(p.id, r.paid, { token: p.token });
        done(confirmed.order);
      } catch {
        // The payment went through on Razorpay: the order page finds it even if this check failed.
        writePending(null);
        cart.clear();
        setLocation(`/order/${p.id}`);
      }
      return;
    }
    setErr(r.failure ? `${r.failure} No money was taken for a failed payment. Try again, or choose cash on delivery.` : "The payment wasn't completed. Try again, or choose cash on delivery: your order is kept for now.");
  };

  const placeIt = async () => {
    if (!method) return;
    setErr("");
    setPlacing(true);
    const address: Address = {
      name: addr.name.trim(), phone: normPhone(addr.phone), line1: addr.line1.trim(), city: addr.city.trim(), state: addr.state, pincode: addr.pincode.trim(),
      ...(addr.email.trim() ? { email: addr.email.trim() } : {}), ...(addr.line2.trim() ? { line2: addr.line2.trim() } : {}), ...(addr.landmark.trim() ? { landmark: addr.landmark.trim() } : {}),
    };
    const notes = note.trim();
    const code = priced.applied && priced.code ? priced.code : "";
    const giftBody = isGift ? { ...(gift.message.trim() ? { message: gift.message.trim() } : {}), ...(gift.from.trim() ? { from: gift.from.trim() } : {}) } : undefined;
    const gstin = biz.gstin.replace(/\s+/g, "").toUpperCase();
    if (isBiz && biz.name.trim().length < 2) { setErr("Add the clinic or business name, or untick buying for a business."); setPlacing(false); return; }
    if (isBiz && gstin && !validGstin(gstin)) { setErr("Check the GSTIN: it's 15 letters and digits, like 27ABCDE1234F1Z5."); setPlacing(false); return; }
    const bizBody = isBiz ? { name: biz.name.trim(), ...(gstin ? { gstin } : {}) } : undefined;
    // What makes this order: an unpaid order or an unanswered try for anything else was a different order.
    const sig = JSON.stringify([linesKey, address, notes, code, t.total, giftBody ?? null, bizBody ?? null]);
    try {
      const prev = pending.current;
      // A bank transfer is a new order too: the unpaid online one is dropped.
      if (prev && (prev.sig !== sig || method === "bank")) {
        // The unpaid online order from a moment ago had another cart, address, note or coupon: it's dropped, unless it was paid meanwhile.
        try {
          await cancelOrder(prev.id, { token: prev.token, reason: "Changed at checkout", ifUnpaid: true });
        } catch (e) {
          const o = (e as StoreError).data?.order as CustomerOrder | undefined;
          if (o && o.status !== "pending" && o.status !== "cancelled") {
            writePending(null);
            pending.current = null;
            setErr(`Your payment for the earlier version of this order (${o.id}, ${formatINR(o.total)}) went through, so that order is placed: you'll find it in your orders. Place this one too only if you need it.`);
            return;
          }
          // Not reached just now: an order left unpaid is cancelled on its own within a day.
        }
        writePending(null);
        pending.current = null;
      }
      // An unpaid online order from a moment ago, for this same order: pay that one, or switch it to cash.
      const reuse = pending.current;
      if (reuse) {
        try {
          if (method === "cod") { done((await switchToCod(reuse.id, { token: reuse.token })).order); return; }
          const again = await retryPayment(reuse.id, { token: reuse.token });
          if (!again.checkout) { done(again.order); return; }
          await payOnline(reuse, again.checkout);
          return;
        } catch (e) {
          const se = e as StoreError;
          if (se.status !== 409 && se.status !== 404) throw e;
          // Paid meanwhile: that's the order. Cancelled or gone: a new one is made below.
          const o = se.data?.order as CustomerOrder | undefined;
          if (o && o.status !== "pending" && o.status !== "cancelled") { done(o); return; }
          writePending(null);
          pending.current = null;
        }
      }
      const body = {
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })), address, notes: notes || undefined, expectTotal: t.total,
        payment: method, ...(code ? { coupon: code } : {}),
        ...(giftBody ? { gift: giftBody } : {}), ...(bizBody ? { business: bizBody } : {}),
        // Kept in the account: a new address when ticked, or the kept one used (it moves to the top).
        ...(user && (picked || keepIt) ? { saveAddress: true, ...(!picked && keepLabel ? { addressLabel: keepLabel } : {}) } : {}),
      };
      // The same order tried again (its answer lost) keeps its key, and so gets back the order the first try made.
      const want = `${method}|${sig}`;
      let a = readAttempt();
      if (!a || a.sig !== want) { a = { key: newKey(), sig: want }; writeAttempt(a); }
      let r = await placeOrder({ ...body, key: a.key });
      if (r.order.status === "cancelled") {
        // That first try's order has been cancelled since: this is a new one.
        a = { key: newKey(), sig: want };
        writeAttempt(a);
        r = await placeOrder({ ...body, key: a.key });
      }
      writeAttempt(null);
      saveOrder({ id: r.order.id, token: r.token, at: r.order.createdAt, total: r.order.total });
      if (user && (picked || keepIt)) queryClient.invalidateQueries({ queryKey: ["store", "addresses"] });
      if (method !== "online" || !r.checkout) { done(r.order); return; }
      const p: Pending = { id: r.order.id, token: r.token, total: r.order.total, sig };
      pending.current = p;
      writePending(p);
      await payOnline(p, r.checkout);
    } catch (e) {
      const se = e as StoreError;
      if (se.status === 409) {
        queryClient.invalidateQueries({ queryKey: ["store", "catalog"] });
        queryClient.invalidateQueries({ queryKey: ["store", "quote"] });
      }
      setErr(se.message);
    } finally {
      setPlacing(false);
    }
  };

  const online = !!config?.onlinePayments;
  const w = deliveryWindow();

  if (!isLoading && t.count === 0) {
    return (
      <div className="ax-buy ax-co-page">
        <CheckoutHead at={1} />
        <main className="ax-buy-main">
          <div className="ax-buy-wrap">
            <div className="ax-empty ax-cart-empty ax-co-empty">
              <span className="ic"><PackageCheck size={26} /></span>
              <h2>Nothing to check out</h2>
              <p>{t.issues.length ? "The items in your cart can't be ordered right now. Check your cart for details." : "Add a few products first, then come back to check out."}</p>
              <div className="acts"><Link href={t.issues.length ? "/cart" : "/shop"} className="ax-btn teal">{t.issues.length ? "Go to your cart" : "Browse the store"}</Link></div>
            </div>
          </div>
        </main>
        <CheckoutFoot />
      </div>
    );
  }

  const button = !method
    ? `Orders over ${formatINR(COD_LIMIT)} can't be paid in cash`
    : method === "online" ? `Pay ${formatINR(t.total)} securely` : method === "bank" ? `Place order · pay ${formatINR(t.total)} by bank transfer` : `Place order · ${formatINR(t.total)} cash on delivery`;
  const reviewing = step === "review";
  const payLabel = reviewing && method === "online" ? "To pay now" : reviewing && method === "bank" ? "To pay by bank transfer" : reviewing ? "To pay on delivery" : "Total";
  const masked = normPhone(addr.phone).replace(/^(\d{2})\d{4}/, "$1••••");

  return (
    <div className="ax-buy ax-co-page">
      <CheckoutHead at={reviewing ? 2 : 1} />
      <main className="ax-buy-main">
        <div className="ax-buy-wrap ax-co-grid">
          <div className="ax-co-flow">
            {t.issues.length > 0 && (
              <div className="ax-co-warn"><AlertTriangle size={17} /><span>{t.issues.length} item{t.issues.length === 1 ? "" : "s"} in your cart can't be ordered right now and won't be included. <Link href="/cart">Review your cart</Link></span></div>
            )}

            {/* 1. Where it goes */}
            <section className={`ax-co-sec ${reviewing ? "done ax-co-review" : "open"}`} style={{ ["--d" as string]: "0ms" }} aria-labelledby="co-s1">
              <header className="ax-co-sh">
                <StepMark n={1} state={reviewing ? "done" : "open"} />
                <div className="t"><h2 id="co-s1">Delivery address</h2><p>{reviewing ? "Your order goes here" : "Where should we deliver your order?"}</p></div>
                {reviewing && <button type="button" className="ax-link ax-co-change" onClick={() => setStep("address")}><Pencil size={13} /> Change</button>}
              </header>
              {!reviewing ? (
                <form id="ax-co-addr" className="ax-co-card ax-co-addr" onSubmit={toReview} noValidate>
                  {payFor && addrKey(payFor.address) === addrKey(addr) && (
                    <p className="ax-co-payfor"><HandCoins size={16} /> <span>Delivering to {payFor.from ? <b>{payFor.from}</b> : "the address"} from the pay-for-me link. Add your email below for the receipt.</span></p>
                  )}
                  {kept.length > 0 && (
                    <div className="ax-co-group ax-co-kept">
                      <p className="gl"><MapPin size={15} /> Your addresses</p>
                      <div className="ax-kept-list" role="radiogroup" aria-label="Your addresses">
                        {kept.map((k, i) => {
                          const on = !newAddr && picked?.id === k.id;
                          return (
                            <button key={k.id} type="button" role="radio" aria-checked={on} className={`ax-kept${on ? " on" : ""}`} style={{ ["--d" as string]: `${i * 40}ms` }} onClick={() => usePicked(k)}>
                              <span className="dot" aria-hidden="true" />
                              <span className="tx"><b>{k.label}{k.isDefault && <em>Default</em>}</b><span>{k.address.name} · {k.address.line1}, {k.address.city} {k.address.pincode}</span></span>
                            </button>
                          );
                        })}
                        <button type="button" className={`ax-kept add${newAddr || !picked ? " on" : ""}`} onClick={startNew} aria-pressed={newAddr || !picked}><Plus size={16} /> <span className="tx"><b>{picked ? "A new address" : "A new address (fill in below)"}</b></span></button>
                      </div>
                    </div>
                  )}
                  <div className="ax-co-group">
                    <p className="gl"><UserRound size={15} /> Contact details</p>
                    <div className="ax-form">
                      <label className="f"><span>Full name</span><input value={addr.name} onChange={set("name")} required autoComplete="name" maxLength={80} placeholder="Who receives the order" /></label>
                      <label className="f"><span>Mobile number</span><span className="ax-inp pre"><i>+91</i><input value={addr.phone} onChange={set("phone")} required type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="10-digit mobile" /></span></label>
                      <label className="f wide"><span>Email <em>(optional, for order updates)</em></span><input value={addr.email} onChange={set("email")} type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" /></label>
                    </div>
                  </div>
                  <div className="ax-co-group">
                    <p className="gl"><MapPin size={15} /> Address</p>
                    <div className="ax-form">
                      <label className="f wide"><span>Flat, house, building and street</span><input value={addr.line1} onChange={set("line1")} required autoComplete="address-line1" maxLength={160} /></label>
                      <label className="f wide"><span>Area or locality <em>(optional)</em></span><input value={addr.line2} onChange={set("line2")} autoComplete="address-line2" maxLength={160} /></label>
                      <label className="f"><span>PIN code</span><input value={addr.pincode} onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} required inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="6 digits" />
                        {place && place !== "unknown" && <small className="ax-pin-ok" key={place}><MapPin size={12} /> {place}</small>}
                        {place === "unknown" && <small className="ax-pin-bad">India Post doesn't list this PIN code: please check it.</small>}
                      </label>
                      <label className="f"><span>Landmark <em>(optional)</em></span><input value={addr.landmark} onChange={set("landmark")} maxLength={100} placeholder="Near…" /></label>
                      <label className="f"><span>Town or city</span><input value={addr.city} onChange={set("city")} required autoComplete="address-level2" maxLength={60} /></label>
                      <label className="f"><span>State</span>
                        <select value={addr.state} onChange={set("state")} required autoComplete="address-level1">
                          <option value="">Choose the state</option>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                  {user && !picked && (
                    <div className="ax-co-keep">
                      <label className="ax-check"><input type="checkbox" checked={keepIt} onChange={(e) => setKeepIt(e.target.checked)} /><span className="box" /> <span>Keep this address in my account for next time</span></label>
                      {keepIt && (
                        <div className="ax-chips" role="group" aria-label="Call it">
                          {LABELS.map((l) => <button key={l} type="button" className={(keepLabel || (kept.length ? "Other" : "Home")) === l ? "on" : ""} onClick={() => setKeepLabel(l)}>{l}</button>)}
                        </div>
                      )}
                    </div>
                  )}
                  {err && <p className="ax-form-err" role="alert" key={err}>{err}</p>}
                  <div className="ax-co-actions">
                    <p className="ax-sum-secure"><Lock size={13} /> We use these details only to deliver your order.</p>
                    <button type="submit" className="ax-btn teal lg ax-co-next-btn ax-shine">Deliver to this address <ArrowRight size={18} /></button>
                  </div>
                </form>
              ) : (
                <div className="ax-co-card ax-co-where">
                  <div className="who">
                    <span className="k">{isGift ? "Gift for" : "Deliver to"}</span>
                    <p><b>{addr.name}</b><br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? <><br />Near {addr.landmark}</> : null}<br />{addr.city}, {addr.state} {addr.pincode}<br /><span className="ph">{normPhone(addr.phone)}{addr.email ? ` · ${addr.email}` : ""}</span></p>
                  </div>
                  <div className="when">
                    <span className="k">Delivery</span>
                    <p>Usually arrives between <b>{dayText(w.from)}</b> and <b>{dayText(w.to)}</b>.<br /><small>Ships {BUSINESS.dispatch}.</small></p>
                  </div>
                </div>
              )}
            </section>

            {/* 2. How to pay */}
            <section className={`ax-co-sec ${reviewing ? "open" : "locked"}`} style={{ ["--d" as string]: "70ms" }} aria-labelledby="co-s2">
              <header className="ax-co-sh">
                <StepMark n={2} state={reviewing ? "open" : "locked"} />
                <div className="t"><h2 id="co-s2">Payment method</h2><p>{!reviewing ? "Choose once your address is in" : online ? "Pay online now, or in cash when it arrives" : bankShown ? "Pay in cash when it arrives, or by bank transfer" : "Pay in cash when your order arrives"}</p></div>
                {!reviewing && <Lock size={15} className="lk" aria-hidden="true" />}
              </header>
              {reviewing && (
                <div className="ax-co-card ax-co-paybody">
                  <fieldset className="ax-pay">
                    <legend className="sr-only">How would you like to pay?</legend>
                    {online && (
                      <label className={`opt online${method === "online" ? " on" : ""}${onlineOpen ? "" : " off"}`}>
                        <input type="radio" name="pay" checked={method === "online"} disabled={!onlineOpen} onChange={() => choose("online")} />
                        <span className="ic"><CreditCard size={20} /></span>
                        <span className="tx">
                          <b>Pay online</b>
                          <small>{onlineOpen ? "UPI, debit and credit cards, netbanking and wallets, through Razorpay" : `Online payments are for orders up to ${formatINR(config!.onlineLimit)}`}</small>
                          {onlineOpen && <PayWays />}
                        </span>
                        <span className="dot" aria-hidden="true" />
                      </label>
                    )}
                    <label className={`opt cod${method === "cod" ? " on" : ""}${codOpen ? "" : " off"}`}>
                      <input type="radio" name="pay" checked={method === "cod"} disabled={!codOpen} onChange={() => choose("cod")} />
                      <span className="ic"><Banknote size={20} /></span>
                      <span className="tx"><b>Cash on delivery</b><small>{codOpen ? `Pay ${formatINR(t.total)} in cash when your order arrives` : `Cash on delivery is for orders up to ${formatINR(COD_LIMIT)}`}</small></span>
                      <span className="dot" aria-hidden="true" />
                    </label>
                    {bankShown && (
                      <label className={`opt bank${method === "bank" ? " on" : ""}${bankOpen ? "" : " off"}`}>
                        <input type="radio" name="pay" checked={method === "bank"} disabled={!bankOpen} onChange={() => choose("bank")} />
                        <span className="ic"><Building2 size={20} /></span>
                        <span className="tx"><b>Bank transfer</b><small>{bankOpen ? "NEFT, RTGS or IMPS from your bank or your institution's: good for large orders" : t.total < bankMin ? `Bank transfer is for orders from ${formatINR(bankMin)}` : `Bank transfer is for orders up to ${formatINR(bankMax)}`}</small></span>
                        <span className="dot" aria-hidden="true" />
                      </label>
                    )}
                  </fieldset>
                  {method && (
                    <p className={`ax-pay-note ${method}`} key={method}>
                      {method === "online"
                        ? <><ShieldCheck size={16} /> <span>You pay in Razorpay&apos;s secure window. We never see or keep your card or UPI details.</span></>
                        : method === "bank"
                          ? <><Building2 size={16} /> <span>Next you&apos;ll see our account details (they&apos;re emailed too). Send {formatINR(t.total)} within {bankDays} days with your order number as the reference: we confirm the order once it arrives.</span></>
                          : <><Banknote size={16} /> <span>{isGift ? `Whoever receives it pays ${formatINR(t.total)} in cash at the door, so let them know. For a surprise, pay online or by bank transfer.` : `Keep ${formatINR(t.total)} ready when it arrives.`}{masked ? ` We may call ${masked} to confirm the order.` : ""}</span></>}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* 3. What's in it, and placing it */}
            <section className={`ax-co-sec ${reviewing ? "open" : "locked"}`} style={{ ["--d" as string]: "140ms" }} aria-labelledby="co-s3">
              <header className="ax-co-sh">
                <StepMark n={3} state={reviewing ? "open" : "locked"} />
                <div className="t"><h2 id="co-s3">Review and place your order</h2><p>{reviewing ? `${t.count} item${t.count === 1 ? "" : "s"} · arrives by ${dayText(w.to)}` : "Check your items before you pay"}</p></div>
                {!reviewing && <Lock size={15} className="lk" aria-hidden="true" />}
              </header>
              {reviewing && (
                <div className="ax-co-card ax-co-place">
                  <ul className="ax-co-items">
                    {t.lines.map((l, i) => (
                      <li key={`${l.productId}:${l.variantId ?? ""}`} style={{ ["--d" as string]: `${i * 50}ms` }}>
                        <span className="pic"><ProductImage src={l.image} width={120} book={isBookId(l.productId)} /></span>
                        <span>{l.name}{l.variantLabel ? <em>{l.variantLabel} · Qty {l.qty}</em> : <em>Qty {l.qty}</em>}<small>{store?.brandName(l.brand) ?? l.brand}</small></span>
                        <b>{formatINR(l.lineTotal)}</b>
                      </li>
                    ))}
                  </ul>
                  <div className="ax-co-extras">
                    <label className={`ax-extra${isGift ? " on" : ""}`}>
                      <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
                      <span className="ic"><Gift size={18} /></span>
                      <span className="tx"><b>Send it as a gift</b><small>A message in the box, and no prices on the paperwork inside</small></span>
                    </label>
                    {isGift && (
                      <div className="ax-extra-body ax-form">
                        <label className="f wide"><span>Gift message <em>(optional)</em></span><textarea value={gift.message} onChange={(e) => setGift((g) => ({ ...g, message: e.target.value }))} rows={2} maxLength={300} placeholder="Congratulations on your first posting!" /></label>
                        <label className="f"><span>From <em>(optional)</em></span><input value={gift.from} onChange={(e) => setGift((g) => ({ ...g, from: e.target.value }))} maxLength={60} placeholder="Your name" /></label>
                        <p className="hint">{method === "cod" ? "With cash on delivery, the person receiving it pays at the door." : "It's paid for, so there's nothing for them to pay."}</p>
                      </div>
                    )}
                    <label className={`ax-extra${isBiz ? " on" : ""}`}>
                      <input type="checkbox" checked={isBiz} onChange={(e) => setIsBiz(e.target.checked)} />
                      <span className="ic"><Briefcase size={18} /></span>
                      <span className="tx"><b>Buying for a clinic or business</b><small>{config?.gstInvoice ? "Its name, and its GSTIN on the GST invoice" : "Its name and GSTIN on the order and its receipt"}</small></span>
                    </label>
                    {isBiz && (
                      <div className="ax-extra-body ax-form">
                        <label className="f"><span>Clinic or business name</span><input value={biz.name} onChange={(e) => setBiz((b) => ({ ...b, name: e.target.value }))} maxLength={120} autoComplete="organization" placeholder="Iyer Family Clinic" /></label>
                        {<label className="f"><span>GSTIN <em>(optional)</em></span><input value={biz.gstin} onChange={(e) => setBiz((b) => ({ ...b, gstin: e.target.value.toUpperCase() }))} maxLength={15} placeholder="27ABCDE1234F1Z5" /></label>}
                        <p className="hint">Buying a lot? <Link href="/hospitals">Ask for a bulk quotation</Link>.</p>
                      </div>
                    )}
                  </div>
                  {noteOpen || note ? (
                    <label className="f ax-co-note"><span>Note for the delivery <em>(optional)</em></span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="For example, call before delivering" autoFocus={noteOpen && !note} /></label>
                  ) : (
                    <button type="button" className="ax-link ax-co-addnote" onClick={() => setNoteOpen(true)}><NotebookPen size={15} /> Add a note for the delivery</button>
                  )}
                  {!method && <p className="ax-form-err">Cash on delivery is available on orders up to {formatINR(COD_LIMIT)}. Please split the order, ask for a <Link href="/hospitals">bulk quotation</Link>, or write to {BUSINESS.email}.</p>}
                  {priced.code && !priced.applied && !priced.checking && priced.couponError && <p className="ax-co-coupon-note">Coupon {priced.code} isn&apos;t applied: {priced.couponError}</p>}
                  {err && <p className="ax-form-err" role="alert" key={err}>{err}</p>}
                  <button type="button" className="ax-btn teal lg ax-co-next-btn ax-shine" onClick={placeIt} disabled={placing || !method || t.count === 0 || priced.checking}>
                    {placing ? <><Loader2 size={18} className="spin" /> {method === "online" ? "Opening the payment…" : "Placing your order…"}</> : <>{method === "online" && <Lock size={16} />} {button}</>}
                  </button>
                  <p className="ax-co-terms">By placing the order you agree to our <Link href="/terms-of-service">terms</Link>, <Link href="/shipping-policy">shipping</Link> and <Link href="/returns-policy">returns</Link> policies.</p>
                  <ul className="ax-trust-mini" aria-label="Buying here">
                    <li><ShieldCheck size={14} /> Secure checkout</li>
                    <li><BadgeCheck size={14} /> Genuine products</li>
                    <li><RotateCcw size={14} /> {BUSINESS.replacementDays}-day replacement</li>
                  </ul>
                </div>
              )}
            </section>
          </div>

          <aside className={`ax-co-aside${sumOpen ? " open" : ""}`}>
            <button type="button" className="ax-co-sumtoggle" onClick={() => setSumOpen((o) => !o)} aria-expanded={sumOpen}>
              <ShoppingBag size={17} /><span>{sumOpen ? "Hide" : "Show"} order summary</span><ChevronDown size={16} className="ch" /><b><Roll value={t.total} /></b>
            </button>
            <div className="ax-co-sumbody">
              <div>
                <OrderSummary quote={t} items={t.lines} brandName={store?.brandName} payLabel={payLabel} coupon={<CouponBox priced={priced} phone={phone} />} />
                <TrustList online={online} />
              </div>
            </div>
          </aside>
        </div>
      </main>
      <CheckoutFoot />

      <div className="ax-co-bar">
        <div className="amt"><small>{payLabel}</small><b><Roll value={t.total} /></b></div>
        {!reviewing ? (
          <button type="submit" form="ax-co-addr" className="ax-btn teal go">Continue <ArrowRight size={17} /></button>
        ) : (
          <button type="button" className="ax-btn teal go" onClick={placeIt} disabled={placing || !method || t.count === 0 || priced.checking}>
            {placing ? <Loader2 size={17} className="spin" /> : method === "online" ? <><Lock size={15} /> Pay {formatINR(t.total)}</> : "Place order"}
          </button>
        )}
      </div>
    </div>
  );
}

/** The checkout's own header: the logo, where the buyer is, and that it's secure. */
function CheckoutHead({ at }: { at: 1 | 2 }) {
  return (
    <header className="ax-co-head">
      <div className="ax-buy-wrap in">
        <Logo />
        <BuySteps at={at} className="top" />
        <div className="sec">
          <span className="lock"><Lock size={14} /> Secure checkout</span>
          <a className="help" href={`mailto:${BUSINESS.email}?subject=${encodeURIComponent("Help with my order")}`}>Need help?</a>
        </div>
      </div>
      <div className="ax-buy-wrap low"><BuySteps at={at} /></div>
    </header>
  );
}

function CheckoutFoot() {
  return (
    <footer className="ax-co-foot">
      <div className="ax-buy-wrap">
        <span>© {new Date().getFullYear()} {BUSINESS.legalName}</span>
        <nav aria-label="Policies">
          <Link href="/shipping-policy">Shipping</Link>
          <Link href="/returns-policy">Returns</Link>
          <Link href="/terms-of-service">Terms</Link>
          <Link href="/privacy-policy">Privacy</Link>
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </nav>
      </div>
    </footer>
  );
}
