/**
 * Checkout (/checkout): delivery address, payment method, review and place the
 * order. Payments are not connected yet, so this is a demo checkout and says so;
 * placing the order empties the cart. Totals follow lib/shop.ts.
 * Styles: src/shop.css (.ax-co).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Copy, CreditCard, Info, Landmark, Lock, MapPin, PackageCheck, Smartphone, Sparkles } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderSummary, type Line } from "@/components/shop/OrderSummary";
import { useSession } from "@/hooks/use-session";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useSeo } from "@/hooks/use-seo";
import { cadusUrl } from "@/lib/host";
import { clearCart } from "@/lib/mockApi";
import { cartTotals } from "@/lib/shop";
import { formatINR } from "@/lib/utils";

type Step = "address" | "payment" | "review";
const STEPS: [Step, string][] = [["address", "Address"], ["payment", "Payment"], ["review", "Review"]];

const STATES = [
  "Andaman & Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const METHODS = [
  { id: "upi", label: "UPI", desc: "Google Pay, PhonePe, Paytm, BHIM", icon: Smartphone },
  { id: "card", label: "Credit or debit card", desc: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net banking", desc: "All major Indian banks", icon: Landmark },
  { id: "cod", label: "Cash on delivery", desc: "Pay when the order arrives", icon: PackageCheck },
];

const ADDR_KEY = "aethex.checkout.address";

export default function Checkout() {
  useSeo({ title: "Checkout | Aethex Medical Store", description: "Delivery address, payment and review.", path: "/checkout" });
  const sessionId = useSession();
  const queryClient = useQueryClient();
  const { user } = useUserAuth();
  const { data: cart, isLoading } = useGetCart({ sessionId }, { query: { enabled: !!sessionId } });
  const lines = ((cart?.items ?? []) as unknown as Line[]);

  const [step, setStep] = useState<Step>("address");
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<null | { id: string; lines: Line[] }>(null);
  const [copied, setCopied] = useState(false);
  const [addr, setAddr] = useState(() => {
    const empty = { fullName: "", phone: "", email: "", line1: "", line2: "", city: "", state: "Maharashtra", pincode: "" };
    try { return { ...empty, ...JSON.parse(localStorage.getItem(ADDR_KEY) || "{}") }; } catch { return empty; }
  });
  useEffect(() => {
    setAddr((a: typeof addr) => ({ ...a, fullName: a.fullName || user?.name || "", email: a.email || user?.email || "" }));
  }, [user?.name, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, placed]);

  const set = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr((a: typeof addr) => ({ ...a, [k]: e.target.value }));
  const t = useMemo(() => cartTotals(placed ? placed.lines : lines), [placed, lines]);

  const toPayment = (e: React.FormEvent) => {
    e.preventDefault();
    try { localStorage.setItem(ADDR_KEY, JSON.stringify(addr)); } catch { /* storage blocked */ }
    setStep("payment");
  };

  const placeOrder = async () => {
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));
    const id = `AX${Date.now().toString().slice(-8)}`;
    setPlaced({ id, lines });
    clearCart(sessionId);
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    setPlacing(false);
  };

  if (placed) {
    return (
      <div className="ax-cart-page">
        <div className="ax-wrap ax-co-done">
          <span className="ok"><CheckCircle2 size={34} /></span>
          <p className="ax-eyebrow c">Order placed</p>
          <h1>Thank you, {addr.fullName.replace(/^dr\.?\s+/i, "Dr ").trim() || "doctor"}</h1>
          <p className="lead">Your order <b>{placed.id}</b> for {formatINR(t.total)} has been recorded.</p>
          <div className="ax-co-demo"><Info size={16} /><span>Payments aren't connected yet, so this was a demo order: no money was taken and nothing will be shipped.</span></div>
          <div className="ax-co-receipt">
            <div className="id">
              <span><small>Order number</small><b>{placed.id}</b></span>
              <button type="button" className="ax-btn" onClick={() => { navigator.clipboard?.writeText(placed.id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); }}>
                {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
              </button>
            </div>
            <ul>
              {placed.lines.map((l) => <li key={l.id}><span>{l.name} <em>× {l.quantity}</em></span><b>{formatINR(l.price * l.quantity)}</b></li>)}
            </ul>
            <dl>
              <div><dt>Delivery</dt><dd>{t.delivery === 0 ? "Free" : formatINR(t.delivery)}</dd></div>
              <div className="total"><dt>Total</dt><dd>{formatINR(t.total)}</dd></div>
            </dl>
            <p className="to"><MapPin size={15} /> {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}</p>
          </div>
          <div className="ax-co-next">
            <Link href="/shop" className="ax-btn teal lg">Continue shopping</Link>
            <a href={cadusUrl("/")} className="ax-btn lg"><Sparkles size={17} /> Ask Cadus AI</a>
          </div>
          <p className="help">Questions? Write to <a href="mailto:support@aethex.in">support@aethex.in</a></p>
        </div>
      </div>
    );
  }

  if (!isLoading && sessionId && lines.length === 0) {
    return (
      <div className="ax-cart-page">
        <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} title="Checkout" />
        <div className="ax-wrap"><div className="ax-empty ax-cart-empty">
          <span className="ic"><PackageCheck size={26} /></span>
          <h2>Your cart is empty</h2>
          <p>Add a few products first, then come back to check out.</p>
          <div className="acts"><Link href="/shop" className="ax-btn teal">Browse the store</Link></div>
        </div></div>
      </div>
    );
  }

  const idx = STEPS.findIndex(([s]) => s === step);
  const methodInfo = METHODS.find((m) => m.id === method)!;

  return (
    <div className="ax-cart-page">
      <ShopHead
        compact
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
        title="Checkout"
        right={
          <ol className="ax-steps" aria-label="Checkout steps">
            {STEPS.map(([s, label], i) => (
              <li key={s} className={i < idx ? "done" : i === idx ? "on" : ""} aria-current={i === idx ? "step" : undefined}>
                <span>{i < idx ? <Check size={13} /> : i + 1}</span>{label}
              </li>
            ))}
          </ol>
        }
      />

      <div className="ax-wrap ax-cart">
        <div className="ax-cart-main">
          {step === "address" && (
            <form className="ax-co-card" onSubmit={toPayment}>
              <h2><MapPin size={19} /> Delivery address</h2>
              <div className="ax-form">
                <label className="f"><span>Full name</span><input value={addr.fullName} onChange={set("fullName")} required autoComplete="name" placeholder="Dr. Priya Sharma" /></label>
                <label className="f"><span>Mobile number</span><input value={addr.phone} onChange={set("phone")} required type="tel" inputMode="tel" autoComplete="tel" pattern="[+0-9 ]{10,15}" placeholder="98765 43210" /></label>
                <label className="f wide"><span>Email</span><input value={addr.email} onChange={set("email")} required type="email" autoComplete="email" placeholder="you@example.com" /></label>
                <label className="f wide"><span>Flat, house, building</span><input value={addr.line1} onChange={set("line1")} required autoComplete="address-line1" placeholder="Flat 4B, Sunrise Apartments, MG Road" /></label>
                <label className="f wide"><span>Area, landmark <em>(optional)</em></span><input value={addr.line2} onChange={set("line2")} autoComplete="address-line2" placeholder="Near City Hospital" /></label>
                <label className="f"><span>City</span><input value={addr.city} onChange={set("city")} required autoComplete="address-level2" placeholder="Mumbai" /></label>
                <label className="f"><span>PIN code</span><input value={addr.pincode} onChange={set("pincode")} required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" maxLength={6} placeholder="400001" /></label>
                <label className="f wide"><span>State</span>
                  <select value={addr.state} onChange={set("state")} required autoComplete="address-level1">{STATES.map((s) => <option key={s}>{s}</option>)}</select>
                </label>
              </div>
              <button type="submit" className="ax-btn teal lg ax-co-next-btn">Continue to payment</button>
            </form>
          )}

          {step === "payment" && (
            <div className="ax-co-card">
              <h2><CreditCard size={19} /> Payment method</h2>
              <div className="ax-pay" role="radiogroup" aria-label="Payment method">
                {METHODS.map((m) => (
                  <label key={m.id} className={`opt${method === m.id ? " on" : ""}`}>
                    <input type="radio" name="pay" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                    <span className="ic"><m.icon size={19} /></span>
                    <span className="tx"><b>{m.label}</b><small>{m.desc}</small></span>
                    <span className="dot" aria-hidden="true" />
                  </label>
                ))}
              </div>
              {method === "upi" && (
                <label className="f ax-upi"><span>UPI ID <em>(optional)</em></span><input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@okbank" /></label>
              )}
              <div className="ax-co-demo"><Info size={16} /><span>Payments aren't connected yet. This checkout is a demo: no money is taken and nothing is shipped.</span></div>
              <div className="ax-co-row">
                <button type="button" className="ax-btn lg" onClick={() => setStep("address")}>Back</button>
                <button type="button" className="ax-btn teal lg" onClick={() => setStep("review")}>Review order</button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="ax-co-card">
              <h2><PackageCheck size={19} /> Review your order</h2>
              <div className="ax-co-review">
                <div><span className="k">Deliver to</span><p><b>{addr.fullName}</b><br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />{addr.city}, {addr.state} {addr.pincode}<br />{addr.phone}</p><button type="button" className="ax-link" onClick={() => setStep("address")}>Change</button></div>
                <div><span className="k">Payment</span><p><b>{methodInfo.label}</b>{method === "upi" && upiId ? <><br />{upiId}</> : null}</p><button type="button" className="ax-link" onClick={() => setStep("payment")}>Change</button></div>
              </div>
              <ul className="ax-co-items">
                {lines.map((l) => (
                  <li key={l.id}><img src={l.imageUrl} alt="" /><span>{l.name}<em>Qty {l.quantity}</em></span><b>{formatINR(l.price * l.quantity)}</b></li>
                ))}
              </ul>
              <button type="button" className="ax-btn teal lg ax-co-next-btn" onClick={placeOrder} disabled={placing}>
                {placing ? "Placing order…" : `Place order · ${formatINR(t.total)}`}
              </button>
              <p className="ax-sum-secure"><Lock size={13} /> Your details stay on this device.</p>
            </div>
          )}
        </div>

        <aside className="ax-cart-side">
          <OrderSummary lines={lines}>
            <ul className="ax-sum-items">
              {lines.map((l) => <li key={l.id}><span>{l.name}</span><em>× {l.quantity}</em></li>)}
            </ul>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
