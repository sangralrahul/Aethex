/**
 * "Ask for the price", book requests and bulk orders: name, mobile, optional
 * email and city, quantity and a note, sent to the store (POST
 * /api/store/enquiries). Remembers the contact details in this browser.
 * Styles: src/shop.css (.ax-enq, .ax-form).
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { sendEnquiry } from "@/lib/store/api";
import type { EnquiryKind } from "@/lib/store/types";
import { normPhone, validEmail } from "@/lib/store/rules";
import { useUserAuth } from "@/hooks/use-user-auth";
import { BUSINESS } from "@/config/business";
import { Dialog } from "./Dialog";

const CONTACT_KEY = "aethex:contact:v1";
type Contact = { name: string; phone: string; email: string; city: string };

export function readContact(): Contact {
  try { return { name: "", phone: "", email: "", city: "", ...JSON.parse(localStorage.getItem(CONTACT_KEY) || "{}") }; } catch { return { name: "", phone: "", email: "", city: "" }; }
}
export function rememberContact(c: Partial<Contact>) {
  try { localStorage.setItem(CONTACT_KEY, JSON.stringify({ ...readContact(), ...c })); } catch { /* storage blocked */ }
}

const INTRO: Record<EnquiryKind, string> = {
  price: "This brand doesn't publish Indian prices, so we quote each order. Leave your number and we'll send today's price and availability, usually within one business day.",
  bulk: "Buying for a clinic, hospital, pharmacy or institution? Tell us the quantity and we'll send a bulk price.",
  book: "We'll confirm the latest edition, price and availability, usually within one business day.",
  general: "Ask us anything about a product or an order.",
};

export function EnquiryForm({ kind, productId, variantId, item, itemLabel, defaultQty = 1, onDone }: {
  kind: EnquiryKind; productId?: number; variantId?: string | null; item?: string; itemLabel?: string; defaultQty?: number; onDone?: (id: string) => void;
}) {
  const { user } = useUserAuth();
  const [f, setF] = useState(() => {
    const c = readContact();
    return { name: c.name || user?.name || "", phone: c.phone || user?.phone || "", email: c.email || user?.email || "", city: c.city, qty: String(defaultQty), message: "", website: "" };
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => { setF((x) => ({ ...x, qty: String(defaultQty) })); }, [defaultQty]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (f.name.trim().length < 2) return setErr("Please enter your name.");
    if (!normPhone(f.phone)) return setErr("Please enter a 10-digit Indian mobile number.");
    if (f.email.trim() && !validEmail(f.email)) return setErr("That email address doesn't look right.");
    setBusy(true);
    try {
      const r = await sendEnquiry({ kind, productId, variantId, item, name: f.name.trim(), phone: f.phone, email: f.email.trim() || undefined, city: f.city.trim() || undefined, qty: Number(f.qty) || 1, message: f.message.trim() || undefined, website: f.website || undefined });
      rememberContact({ name: f.name.trim(), phone: f.phone, email: f.email.trim(), city: f.city.trim() });
      setDone(r.id);
      onDone?.(r.id);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="ax-enq-done" role="status">
        <CheckCircle2 size={34} />
        <h3>Request sent</h3>
        <p>Thank you{f.name ? `, ${f.name.split(" ")[0]}` : ""}. We'll call or message you on <b>{normPhone(f.phone)}</b>{f.email ? " and email you" : ""}, usually within one business day.</p>
        <p className="ref">Reference <b>{done}</b></p>
      </div>
    );
  }

  return (
    <form className="ax-enq" onSubmit={submit} noValidate>
      {itemLabel && <p className="ax-enq-item">{itemLabel}</p>}
      <p className="ax-enq-intro">{INTRO[kind]}</p>
      <div className="ax-form">
        <label className="f"><span>Your name</span><input value={f.name} onChange={set("name")} autoComplete="name" required maxLength={80} /></label>
        <label className="f"><span>Mobile number</span><input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" required placeholder="10-digit mobile" maxLength={16} /></label>
        <label className="f"><span>Email <em>(optional)</em></span><input value={f.email} onChange={set("email")} type="email" autoComplete="email" maxLength={254} /></label>
        <label className="f"><span>City <em>(optional)</em></span><input value={f.city} onChange={set("city")} autoComplete="address-level2" maxLength={60} /></label>
        {kind !== "general" && <label className="f"><span>Quantity</span><input value={f.qty} onChange={set("qty")} type="number" min={1} max={9999} inputMode="numeric" /></label>}
        <label className="f wide"><span>{kind === "book" ? "Edition or anything else" : "Anything else"} <em>(optional)</em></span><textarea value={f.message} onChange={set("message")} rows={3} maxLength={1000} /></label>
        <label className="ax-hp" aria-hidden="true">Website<input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" /></label>
      </div>
      {err && <p className="ax-form-err" role="alert">{err}</p>}
      <button type="submit" className="ax-btn teal lg ax-enq-go" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Sending…</> : kind === "price" ? "Get the price" : kind === "bulk" ? "Get a bulk price" : kind === "book" ? "Request this book" : "Send"}</button>
      <p className="ax-enq-fine"><Lock size={12} /> We use your details only to answer this request. {BUSINESS.legalName}.</p>
    </form>
  );
}

export function EnquiryDialog({ open, onClose, title, ...props }: { open: boolean; onClose: () => void; title: string } & Parameters<typeof EnquiryForm>[0]) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <EnquiryForm {...props} />
    </Dialog>
  );
}
