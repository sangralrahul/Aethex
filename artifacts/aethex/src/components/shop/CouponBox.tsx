/**
 * The coupon code on the cart and at checkout: typed once, checked by the
 * Worker (it says why a code can't be used), then kept with the cart until it's
 * removed. Styles: src/shop.css (.ax-coupon).
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, TicketPercent, X } from "lucide-react";
import { getQuote } from "@/lib/store/api";
import { coupon, quoteKey, type usePricedCart } from "@/lib/store/coupon";
import { cleanCouponCode } from "@/lib/store/promo";
import { formatINR } from "@/lib/utils";

export function CouponBox({ priced, phone }: { priced: ReturnType<typeof usePricedCart>; phone?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const c = cleanCouponCode(text);
    if (!c) return setErr("Enter the code as it was given to you, like SAVE10.");
    setBusy(true);
    try {
      const r = await getQuote(priced.lines, { coupon: c, phone });
      if (r.couponError) { setErr(r.couponError); return; }
      queryClient.setQueryData(quoteKey(priced.lines, c, phone), r);
      coupon.set(c);
      setText(""); setOpen(false);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (priced.code) {
    const ok = priced.applied;
    const t = priced.quote;
    return (
      <div className={`ax-coupon${ok ? " ok" : priced.checking ? "" : " bad"}`} role="status">
        <TicketPercent size={17} />
        <span>
          <b>{priced.code}</b>
          {ok ? <small>{t.coupon?.label ? `${t.coupon.label}: ` : ""}{formatINR(t.discount ?? 0)} off</small>
            : priced.checking ? <small><Loader2 size={12} className="spin" /> Checking the code…</small>
              : <small>{priced.couponError || "This code can't be used on this order."}</small>}
        </span>
        <button type="button" onClick={() => coupon.clear()} aria-label={`Remove the code ${priced.code}`}><X size={15} /></button>
      </div>
    );
  }
  if (!open) return <button type="button" className="ax-link ax-coupon-open" onClick={() => setOpen(true)}><TicketPercent size={15} /> Have a coupon code?</button>;
  return (
    <form className="ax-coupon-form" onSubmit={apply} noValidate>
      <label>
        <span className="sr-only">Coupon code</span>
        <input value={text} onChange={(e) => { setText(e.target.value.toUpperCase()); setErr(""); }} placeholder="Coupon code" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={24} autoFocus />
      </label>
      <button type="submit" className="ax-btn" disabled={busy || !text.trim()}>{busy ? <Loader2 size={15} className="spin" /> : "Apply"}</button>
      {err && <p className="ax-form-err" role="alert">{err}</p>}
    </form>
  );
}
