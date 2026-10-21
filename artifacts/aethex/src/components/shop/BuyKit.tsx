/**
 * Shared pieces of the buying flow (cart, checkout, order placed): the
 * progress steps, amounts that roll in when they change, the numbered and
 * ticked step marks, the ways to pay, and the trust notes. Styles: src/buy.css.
 */
import { Link } from "wouter";
import { BadgeCheck, Banknote, Check, CreditCard, Landmark, RotateCcw, ShieldCheck, Smartphone, Truck, Wallet } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { BUSINESS } from "@/config/business";

const STEPS = [
  { label: "Cart", href: "/cart" },
  { label: "Address" },
  { label: "Payment" },
  { label: "Done" },
] as const;

/** Cart → Address → Payment → Done, with the line filling up to `at` (0 to 3; 4 once all are done). */
export function BuySteps({ at, className = "" }: { at: 0 | 1 | 2 | 3 | 4; className?: string }) {
  return (
    <ol className={`ax-bsteps ${className}`} aria-label="Checkout progress" style={{ ["--p" as string]: Math.min(at, STEPS.length - 1) / (STEPS.length - 1) }}>
      {STEPS.map((s, i) => {
        const state = i < at ? "done" : i === at ? "on" : "";
        const mark = <span className="dot">{i < at ? <Check size={13} strokeWidth={3} /> : i + 1}</span>;
        return (
          <li key={s.label} className={state} aria-current={i === at ? "step" : undefined}>
            {"href" in s && i < at && at < 4 ? <Link href={s.href}>{mark}<span className="lb">{s.label}</span></Link> : <>{mark}<span className="lb">{s.label}</span></>}
          </li>
        );
      })}
    </ol>
  );
}

/** An amount in rupees that rolls in when it changes (the text is always the new amount). */
export function Roll({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`ax-roll ${className}`}><span key={value}>{formatINR(value)}</span></span>;
}

/** A step's number, or a tick drawn in once it's done. */
export function StepMark({ n, state }: { n: number; state: "open" | "done" | "locked" }) {
  return (
    <span className={`ax-mark ${state}`} aria-hidden="true">
      {state === "done" ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      ) : n}
    </span>
  );
}

/** The ways Razorpay takes a payment, as small chips. */
export function PayWays({ cod = false }: { cod?: boolean }) {
  return (
    <span className="ax-ways">
      <i><Smartphone size={13} /> UPI</i>
      <i><CreditCard size={13} /> Cards</i>
      <i><Landmark size={13} /> Netbanking</i>
      <i><Wallet size={13} /> Wallets</i>
      {cod && <i><Banknote size={13} /> Cash on delivery</i>}
    </span>
  );
}

/** Why it's safe to buy here: the same promises as the homepage. */
export function TrustList({ online }: { online: boolean }) {
  return (
    <ul className="ax-trust">
      <li><span className="ic"><ShieldCheck size={17} /></span><span><b>{online ? "Secure payments" : "Safe checkout"}</b><small>{online ? "Processed by Razorpay: we never see or keep your card or UPI details" : "Your details are used only to deliver your order"}</small></span></li>
      <li><span className="ic"><BadgeCheck size={17} /></span><span><b>Genuine products</b><small>From verified brands only</small></span></li>
      <li><span className="ic"><RotateCcw size={17} /></span><span><b>{BUSINESS.replacementDays}-day replacement</b><small>If it arrives damaged or defective</small></span></li>
      <li><span className="ic"><Truck size={17} /></span><span><b>Delivery across India</b><small>Free from {formatINR(FREE_DELIVERY_FROM)}, tracked to your door</small></span></li>
    </ul>
  );
}
