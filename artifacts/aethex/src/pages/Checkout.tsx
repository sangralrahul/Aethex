/**
 * Checkout (/checkout): delivery details, then review and place a cash-on-
 * delivery order. The Worker prices the order again (worker/store.ts); if a
 * price changed meanwhile, the customer sees the new total before placing it.
 * Styles: src/shop.css (.ax-co).
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Banknote, Check, Loader2, Lock, MapPin, PackageCheck, Pencil } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { ProductImage } from "@/components/store/ProductImage";
import { isBookId } from "@/lib/store/bookdata";
import { readContact, rememberContact } from "@/components/store/EnquiryForm";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useSeo } from "@/hooks/use-seo";
import { placeOrder, saveOrder, StoreError } from "@/lib/store/api";
import { cart, useCart } from "@/lib/store/cart";
import { COD_LIMIT, INDIAN_STATES, normPhone, validEmail, validPincode } from "@/lib/store/rules";
import type { Address } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";

type Step = "address" | "review";
const ADDR_KEY = "aethex:checkout:v2";
const EMPTY = { name: "", phone: "", email: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };
type Form = typeof EMPTY;

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

export default function Checkout() {
  useSeo({ title: "Checkout | Aethex Store", description: "Delivery details and cash on delivery.", path: "/checkout" });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUserAuth();
  const { quote: t, store, isLoading } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [addr, setAddr] = useState<Form>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADDR_KEY) || "{}");
      const c = readContact();
      return { ...EMPTY, name: c.name, phone: c.phone, email: c.email, city: c.city, ...saved };
    } catch { return EMPTY; }
  });
  useEffect(() => {
    setAddr((a) => ({ ...a, name: a.name || user?.name || "", email: a.email || user?.email || "", phone: a.phone || user?.phone || "" }));
  }, [user?.name, user?.email, user?.phone]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); setErr(""); }, [step]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  const toReview = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = check(addr);
    if (problem) { setErr(problem); return; }
    try { localStorage.setItem(ADDR_KEY, JSON.stringify(addr)); } catch { /* storage blocked */ }
    rememberContact({ name: addr.name.trim(), phone: addr.phone, email: addr.email.trim(), city: addr.city.trim() });
    setStep("review");
  };

  const place = async () => {
    setErr("");
    setPlacing(true);
    const address: Address = {
      name: addr.name.trim(), phone: normPhone(addr.phone), line1: addr.line1.trim(), city: addr.city.trim(), state: addr.state, pincode: addr.pincode.trim(),
      ...(addr.email.trim() ? { email: addr.email.trim() } : {}), ...(addr.line2.trim() ? { line2: addr.line2.trim() } : {}), ...(addr.landmark.trim() ? { landmark: addr.landmark.trim() } : {}),
    };
    try {
      const r = await placeOrder({ lines: t.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })), address, notes: note.trim() || undefined, expectTotal: t.total });
      saveOrder({ id: r.order.id, token: r.token, at: r.order.createdAt, total: r.order.total });
      try { sessionStorage.setItem(`aethex:placed:${r.order.id}`, JSON.stringify(r.order)); } catch { /* fine */ }
      cart.clear();
      setLocation(`/order/${r.order.id}`);
    } catch (e) {
      const se = e as StoreError;
      if (se.status === 409) queryClient.invalidateQueries({ queryKey: ["store", "catalog"] });
      setErr(se.message);
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

  const steps: [Step, string][] = [["address", "Delivery"], ["review", "Review & place"]];
  const idx = steps.findIndex(([s]) => s === step);
  const overLimit = t.total > COD_LIMIT;

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
                <label className="f"><span>PIN code</span><input value={addr.pincode} onChange={set("pincode")} required inputMode="numeric" autoComplete="postal-code" maxLength={6} /></label>
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
              <h2><PackageCheck size={19} /> Review your order</h2>
              <div className="ax-co-review">
                <div>
                  <span className="k">Deliver to</span>
                  <p><b>{addr.name}</b><br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? <><br />Near {addr.landmark}</> : null}<br />{addr.city}, {addr.state} {addr.pincode}<br />{normPhone(addr.phone)}{addr.email ? ` · ${addr.email}` : ""}</p>
                  <button type="button" className="ax-link" onClick={() => setStep("address")}><Pencil size={13} /> Change</button>
                </div>
                <div>
                  <span className="k">Payment</span>
                  <p className="ax-co-cod"><Banknote size={18} /> <span><b>Cash on delivery</b><br />Pay {formatINR(t.total)} in cash when your order arrives.</span></p>
                </div>
              </div>
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
              {overLimit && <p className="ax-form-err">Cash on delivery is available on orders up to {formatINR(COD_LIMIT)}. Please split the order, or write to {BUSINESS.email}.</p>}
              {err && <p className="ax-form-err" role="alert">{err}</p>}
              <button type="button" className="ax-btn teal lg ax-co-next-btn" onClick={place} disabled={placing || overLimit || t.count === 0}>
                {placing ? <><Loader2 size={18} className="spin" /> Placing your order…</> : `Place order · ${formatINR(t.total)} cash on delivery`}
              </button>
              <p className="ax-co-terms">By placing the order you agree to our <Link href="/terms-of-service">terms</Link>, <Link href="/shipping-policy">shipping</Link> and <Link href="/returns-policy">returns</Link> policies.</p>
            </div>
          )}
        </div>

        <aside className="ax-cart-side">
          <OrderSummary quote={t}>
            <ul className="ax-sum-items">
              {t.lines.map((l) => <li key={`${l.productId}:${l.variantId ?? ""}`}><span>{l.name}{l.variantLabel ? ` (${l.variantLabel})` : ""}</span><em>× {l.qty}</em></li>)}
            </ul>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
