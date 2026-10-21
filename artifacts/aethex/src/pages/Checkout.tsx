/**
 * Checkout (/checkout): delivery details, then review, choose how to pay and
 * place the order: cash on delivery, or online through Razorpay (UPI, cards,
 * netbanking, wallets) once the store has added its Razorpay keys. A coupon
 * from the cart carries over. The Worker prices the order again
 * (worker/store.ts); if a price changed meanwhile, the customer sees the new
 * total before placing it. An online order waits for its payment: closing the
 * payment window keeps it, so paying again (or switching to cash) doesn't make
 * a second order; changing the cart, address, note or coupon drops it for a new
 * one. Each try carries a random key, so a retry after a lost answer gets back
 * the order the first try made. Styles: src/shop.css (.ax-co).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Banknote, Check, CreditCard, Loader2, Lock, MapPin, PackageCheck, Pencil, ShieldCheck } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { CouponBox } from "@/components/shop/CouponBox";
import { ProductImage } from "@/components/store/ProductImage";
import { isBookId } from "@/lib/store/bookdata";
import { readContact, rememberContact } from "@/components/store/EnquiryForm";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useSeo } from "@/hooks/use-seo";
import { cancelOrder, payOrder, placeOrder, retryPayment, saveOrder, StoreError, switchToCod, useStoreConfig, type CustomerOrder, type RazorpayCheckout } from "@/lib/store/api";
import { cart } from "@/lib/store/cart";
import { coupon, usePricedCart } from "@/lib/store/coupon";
import { dayText, deliveryWindow, lookupPin, savePin, savedPin } from "@/lib/store/delivery";
import { payWithRazorpay } from "@/lib/store/razorpay";
import { COD_LIMIT, INDIAN_STATES, ONLINE_LIMIT, normPhone, validEmail, validPincode } from "@/lib/store/rules";
import type { Address, PaymentMethod } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";

type Step = "address" | "review";
const ADDR_KEY = "aethex:checkout:v2";
const PAY_KEY = "aethex:pay:v1";
const EMPTY = { name: "", phone: "", email: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };
type Form = typeof EMPTY;
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
      return { ...EMPTY, name: c.name, phone: c.phone, email: c.email, city: c.city, ...(pin ? { pincode: pin } : {}), ...saved };
    } catch { return EMPTY; }
  });
  const [pay, setPay] = useState<PaymentMethod>(() => { try { return localStorage.getItem(PAY_KEY) === "cod" ? "cod" : "online"; } catch { return "online"; } });
  const [place, setPlace] = useState("");
  const pending = useRef<Pending | null>(readPending());

  const phone = step === "review" ? normPhone(addr.phone) || undefined : undefined;
  const priced = usePricedCart(phone);
  const { quote: t, store, isLoading, lines } = priced;
  const linesKey = useMemo(() => lines.map((l) => `${l.productId}:${l.variantId ?? ""}:${l.qty}`).join("|"), [lines]);

  useEffect(() => {
    setAddr((a) => ({ ...a, name: a.name || user?.name || "", email: a.email || user?.email || "", phone: a.phone || user?.phone || "" }));
  }, [user?.name, user?.email, user?.phone]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); setErr(""); }, [step]);

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
  const method: PaymentMethod | null = pay === "online" && onlineOpen ? "online" : codOpen ? "cod" : onlineOpen ? "online" : null;
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
    // What makes this order: an unpaid order or an unanswered try for anything else was a different order.
    const sig = JSON.stringify([linesKey, address, notes, code, t.total]);
    try {
      const prev = pending.current;
      if (prev && prev.sig !== sig) {
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
      if (method === "cod" || !r.checkout) { done(r.order); return; }
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

  if (!isLoading && t.count === 0) {
    return (
      <div className="ax-cart-page">
        <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} title="Checkout" />
        <div className="ax-wrap"><div className="ax-empty ax-cart-empty">
          <span className="ic"><PackageCheck size={26} /></span>
          <h2>Nothing to check out</h2>
          <p>{t.issues.length ? "The items in your cart can't be ordered right now. Check your cart for details." : "Add a few products first, then come back to check out."}</p>
          <div className="acts"><Link href={t.issues.length ? "/cart" : "/shop"} className="ax-btn teal">{t.issues.length ? "Go to your cart" : "Browse the store"}</Link></div>
        </div></div>
      </div>
    );
  }

  const steps: [Step, string][] = [["address", "Delivery"], ["review", "Review & pay"]];
  const idx = steps.findIndex(([s]) => s === step);
  const w = deliveryWindow();
  const button = !method
    ? `Orders over ${formatINR(COD_LIMIT)} can't be paid in cash`
    : method === "online" ? `Pay ${formatINR(t.total)} securely` : `Place order · ${formatINR(t.total)} cash on delivery`;

  return (
    <div className="ax-cart-page">
      <ShopHead
        compact
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
        title="Checkout"
        right={
          <ol className="ax-steps" aria-label="Checkout steps">
            {steps.map(([s, label], i) => (
              <li key={s} className={i < idx ? "done" : i === idx ? "on" : ""} aria-current={i === idx ? "step" : undefined}>
                <span>{i < idx ? <Check size={13} /> : i + 1}</span>{label}
              </li>
            ))}
          </ol>
        }
      />

      <div className="ax-wrap ax-cart">
        <div className="ax-cart-main">
          {t.issues.length > 0 && (
            <div className="ax-co-warn"><AlertTriangle size={17} /><span>{t.issues.length} item{t.issues.length === 1 ? "" : "s"} in your cart can't be ordered right now and won't be included. <Link href="/cart">Review your cart</Link></span></div>
          )}

          {step === "address" && (
            <form className="ax-co-card" onSubmit={toReview} noValidate>
              <h2><MapPin size={19} /> Delivery details</h2>
              <div className="ax-form">
                <label className="f"><span>Full name</span><input value={addr.name} onChange={set("name")} required autoComplete="name" maxLength={80} /></label>
                <label className="f"><span>Mobile number</span><input value={addr.phone} onChange={set("phone")} required type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="10-digit mobile" /></label>
                <label className="f wide"><span>Email <em>(optional, for order updates)</em></span><input value={addr.email} onChange={set("email")} type="email" autoComplete="email" maxLength={254} /></label>
                <label className="f wide"><span>Flat, house, building and street</span><input value={addr.line1} onChange={set("line1")} required autoComplete="address-line1" maxLength={160} /></label>
                <label className="f wide"><span>Area or locality <em>(optional)</em></span><input value={addr.line2} onChange={set("line2")} autoComplete="address-line2" maxLength={160} /></label>
                <label className="f"><span>Landmark <em>(optional)</em></span><input value={addr.landmark} onChange={set("landmark")} maxLength={100} /></label>
                <label className="f"><span>PIN code</span><input value={addr.pincode} onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} required inputMode="numeric" autoComplete="postal-code" maxLength={6} />
                  {place && place !== "unknown" && <small className="ax-pin-ok"><Check size={12} /> {place}</small>}
                  {place === "unknown" && <small className="ax-pin-bad">India Post doesn't list this PIN code: please check it.</small>}
                </label>
                <label className="f"><span>Town or city</span><input value={addr.city} onChange={set("city")} required autoComplete="address-level2" maxLength={60} /></label>
                <label className="f"><span>State</span>
                  <select value={addr.state} onChange={set("state")} required autoComplete="address-level1">
                    <option value="">Choose the state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              {err && <p className="ax-form-err" role="alert">{err}</p>}
              <button type="submit" className="ax-btn teal lg ax-co-next-btn">Continue</button>
              <p className="ax-sum-secure"><Lock size={13} /> We use these details only to deliver your order.</p>
            </form>
          )}

          {step === "review" && (
            <div className="ax-co-card">
              <h2><PackageCheck size={19} /> Review and pay</h2>
              <div className="ax-co-review">
                <div>
                  <span className="k">Deliver to</span>
                  <p><b>{addr.name}</b><br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? <><br />Near {addr.landmark}</> : null}<br />{addr.city}, {addr.state} {addr.pincode}<br />{normPhone(addr.phone)}{addr.email ? ` · ${addr.email}` : ""}</p>
                  <button type="button" className="ax-link" onClick={() => setStep("address")}><Pencil size={13} /> Change</button>
                </div>
                <div>
                  <span className="k">Delivery</span>
                  <p>Usually arrives between <b>{dayText(w.from)}</b> and <b>{dayText(w.to)}</b>.<br /><small>Ships {BUSINESS.dispatch}.</small></p>
                </div>
              </div>

              <fieldset className="ax-pay">
                <legend>How would you like to pay?</legend>
                {config?.onlinePayments && (
                  <label className={`opt${method === "online" ? " on" : ""}${onlineOpen ? "" : " off"}`}>
                    <input type="radio" name="pay" checked={method === "online"} disabled={!onlineOpen} onChange={() => choose("online")} />
                    <span className="ic"><CreditCard size={19} /></span>
                    <span className="tx"><b>Pay online</b><small>{onlineOpen ? "UPI, debit and credit cards, netbanking and wallets, through Razorpay" : `Online payments are for orders up to ${formatINR(config.onlineLimit)}`}</small></span>
                    <span className="dot" aria-hidden="true" />
                  </label>
                )}
                <label className={`opt${method === "cod" ? " on" : ""}${codOpen ? "" : " off"}`}>
                  <input type="radio" name="pay" checked={method === "cod"} disabled={!codOpen} onChange={() => choose("cod")} />
                  <span className="ic"><Banknote size={19} /></span>
                  <span className="tx"><b>Cash on delivery</b><small>{codOpen ? `Pay ${formatINR(t.total)} in cash when your order arrives` : `Cash on delivery is for orders up to ${formatINR(COD_LIMIT)}`}</small></span>
                    <span className="dot" aria-hidden="true" />
                </label>
              </fieldset>

              <ul className="ax-co-items">
                {t.lines.map((l) => (
                  <li key={`${l.productId}:${l.variantId ?? ""}`}>
                    <ProductImage src={l.image} width={120} book={isBookId(l.productId)} />
                    <span>{l.name}{l.variantLabel ? <em>{l.variantLabel} · Qty {l.qty}</em> : <em>Qty {l.qty}</em>}<small>{store?.brandName(l.brand) ?? l.brand}</small></span>
                    <b>{formatINR(l.lineTotal)}</b>
                  </li>
                ))}
              </ul>
              <label className="f ax-co-note"><span>Note for the delivery <em>(optional)</em></span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="For example, call before delivering" /></label>
              {!method && <p className="ax-form-err">Cash on delivery is available on orders up to {formatINR(COD_LIMIT)}. Please split the order, or write to {BUSINESS.email}.</p>}
              {priced.code && !priced.applied && !priced.checking && priced.couponError && <p className="ax-co-coupon-note">Coupon {priced.code} isn't applied: {priced.couponError}</p>}
              {err && <p className="ax-form-err" role="alert">{err}</p>}
              <button type="button" className="ax-btn teal lg ax-co-next-btn" onClick={placeIt} disabled={placing || !method || t.count === 0 || priced.checking}>
                {placing ? <><Loader2 size={18} className="spin" /> {method === "online" ? "Opening the payment…" : "Placing your order…"}</> : <>{method === "online" && <Lock size={16} />} {button}</>}
              </button>
              {method === "online" && <p className="ax-sum-secure"><ShieldCheck size={13} /> Payments are processed by Razorpay. We never see or keep your card or UPI details.</p>}
              <p className="ax-co-terms">By placing the order you agree to our <Link href="/terms-of-service">terms</Link>, <Link href="/shipping-policy">shipping</Link> and <Link href="/returns-policy">returns</Link> policies.</p>
            </div>
          )}
        </div>

        <aside className="ax-cart-side">
          <OrderSummary quote={t} payLabel={step === "review" && method === "online" ? "To pay now" : step === "review" ? "To pay on delivery" : "Total"}>
            <CouponBox priced={priced} phone={phone} />
            <ul className="ax-sum-items">
              {t.lines.map((l) => <li key={`${l.productId}:${l.variantId ?? ""}`}><span>{l.name}{l.variantLabel ? ` (${l.variantLabel})` : ""}</span><em>× {l.qty}</em></li>)}
            </ul>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
