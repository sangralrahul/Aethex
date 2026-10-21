/**
 * "Email me when it's back" and "Email me if the price drops": one email, once,
 * when it comes true (worker/store.ts, the hourly job and the admin's changes),
 * with a link in it to stop all alerts. Styles: src/shop.css (.ax-alert).
 */
import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Dialog } from "./Dialog";
import { readContact, rememberContact } from "./EnquiryForm";
import { createAlert, StoreError, type AlertKind } from "@/lib/store/api";
import { validEmail } from "@/lib/store/rules";
import { useUserAuth } from "@/hooks/use-user-auth";
import { formatINR } from "@/lib/utils";

export function AlertDialog({ open, onClose, kind, productId, variantId, itemLabel, price }: {
  open: boolean; onClose: () => void; kind: AlertKind; productId: number; variantId?: string | null; itemLabel: string; price?: number | null;
}) {
  const { user } = useUserAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!open) return;
    setEmail(readContact().email || user?.email || "");
    setErr(""); setDone(false); setBusy(false);
  }, [open, kind, productId, variantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!validEmail(email)) return setErr("Please enter your email address, so we can tell you.");
    setBusy(true);
    try {
      await createAlert({ productId, variantId: variantId ?? null, kind, email: email.trim() });
      rememberContact({ email: email.trim() });
      setDone(true);
    } catch (x) {
      setErr((x as StoreError).message);
    } finally {
      setBusy(false);
    }
  };

  const stock = kind === "stock";
  return (
    <Dialog open={open} onClose={onClose} title={stock ? "Email me when it's back" : "Email me if the price drops"}>
      {done ? (
        <div className="ax-enq-done">
          <CheckCircle2 size={30} />
          <h3>Done</h3>
          <p>{stock ? `We'll email ${email.trim()} once, when it's back in stock.` : `We'll email ${email.trim()} once, if the price drops${price ? ` below ${formatINR(price)}` : ""}.`} The email has a link to stop alerts.</p>
          <button type="button" className="ax-btn teal" onClick={onClose}>Close</button>
        </div>
      ) : (
        <form className="ax-alert" onSubmit={submit} noValidate>
          <p className="what"><BellRing size={17} /> <span><b>{itemLabel}</b>{stock ? "Out of stock right now." : price ? `${formatINR(price)} today.` : ""}</span></p>
          <p className="ax-enq-intro">{stock
            ? "We'll send one email when it's back in stock, so you can order it before it runs out again."
            : "We'll send one email if its price drops, whether we lower it or it goes on sale."}</p>
          <div className="ax-form">
            <label className="f wide"><span>Your email</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" maxLength={254} required /></label>
          </div>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <button type="submit" className="ax-btn teal lg" disabled={busy}>{busy ? <Loader2 size={17} className="spin" /> : <BellRing size={17} />} {stock ? "Email me when it's back" : "Watch the price"}</button>
          <p className="ax-sum-secure"><Lock size={13} /> Only this alert: no newsletters, and your email isn't shared.</p>
        </form>
      )}
    </Dialog>
  );
}
