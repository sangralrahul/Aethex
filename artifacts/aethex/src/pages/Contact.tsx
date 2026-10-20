/**
 * Contact us (/contact): quick help for orders (track, returns, policies), how
 * to reach the team, and a message form that reaches the store's inbox
 * (POST /api/store/contact, worker/store.ts) with an emailed acknowledgement.
 * Styles: src/shop.css (.ax-contact).
 */
import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, Mail, PackageSearch, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { readContact, rememberContact } from "@/components/store/EnquiryForm";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { storeFetch } from "@/lib/store/api";
import { normPhone, validEmail } from "@/lib/store/rules";
import { BUSINESS } from "@/config/business";

const TOPICS = ["An order", "A product", "Returns or replacement", "Bulk or institutional purchase", "Cadus AI", "Study Hub", "Something else"];

export default function Contact() {
  useSeo({ title: "Contact us | Aethex", description: "Questions about an order, a product, returns or Cadus AI: write to the Aethex team.", path: "/contact" });
  const { user } = useUserAuth();
  const [f, setF] = useState(() => {
    const c = readContact();
    return { name: c.name || user?.name || "", email: c.email || user?.email || "", phone: c.phone || "", topic: "An order", order: "", message: "", website: "" };
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (f.name.trim().length < 2) return setErr("Please enter your name.");
    if (!validEmail(f.email)) return setErr("Please enter your email address, so we can reply.");
    if (f.phone.trim() && !normPhone(f.phone)) return setErr("That mobile number doesn't look right. Use 10 digits, or leave it empty.");
    if (f.message.trim().length < 10) return setErr("Please tell us a little more (at least a sentence).");
    setBusy(true);
    try {
      const r = await storeFetch<{ id: string }>("/contact", { json: { ...f, name: f.name.trim(), email: f.email.trim(), message: f.message.trim() } });
      rememberContact({ name: f.name.trim(), email: f.email.trim(), ...(f.phone.trim() ? { phone: f.phone.trim() } : {}) });
      setSent(r.id);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ax-shop-page">
      <ShopHead crumbs={[{ label: "Home", href: "/" }, { label: "Contact us" }]} title="Contact us" sub="We reply by email, usually within one business day." />
      <div className="ax-wrap ax-contact">
        <aside className="ax-contact-side">
          <h2>Quick help</h2>
          <Link href="/orders/track"><PackageSearch size={19} /><span><b>Track an order</b><small>With your order number and mobile</small></span></Link>
          <Link href="/returns-policy"><RotateCcw size={19} /><span><b>Returns & replacement</b><small>Damaged, defective or wrong items</small></span></Link>
          <Link href="/shipping-policy"><Truck size={19} /><span><b>Shipping & delivery</b><small>Charges, times and cash on delivery</small></span></Link>
          <Link href="/grievance"><ShieldCheck size={19} /><span><b>Grievances</b><small>Our Grievance Officer and seller details</small></span></Link>
          <div className="reach">
            <p><Mail size={16} /> <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
            {BUSINESS.phone && <p><Phone size={16} /> <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>{BUSINESS.hours ? ` · ${BUSINESS.hours}` : ""}</p>}
          </div>
        </aside>
        <div className="ax-co-card">
          {sent ? (
            <div className="ax-enq-done" role="status">
              <CheckCircle2 size={34} />
              <h3>Message sent</h3>
              <p>Thank you{f.name ? `, ${f.name.split(" ")[0]}` : ""}. We've emailed you a copy and will reply to <b>{f.email}</b>, usually within one business day.</p>
              <p className="ref">Reference <b>{sent}</b></p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2><Mail size={19} /> Write to us</h2>
              <div className="ax-form">
                <label className="f"><span>Your name</span><input value={f.name} onChange={set("name")} autoComplete="name" maxLength={80} /></label>
                <label className="f"><span>Email</span><input value={f.email} onChange={set("email")} type="email" autoComplete="email" maxLength={254} /></label>
                <label className="f"><span>Mobile <em>(optional)</em></span><input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} /></label>
                <label className="f"><span>About</span><select value={f.topic} onChange={set("topic")}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
                {(f.topic === "An order" || f.topic === "Returns or replacement") && (
                  <label className="f wide"><span>Order number <em>(if you have one)</em></span><input value={f.order} onChange={(e) => setF((x) => ({ ...x, order: e.target.value.toUpperCase() }))} placeholder="AX261020-7KQ4MP" maxLength={20} spellCheck={false} /></label>
                )}
                <label className="f wide"><span>Message</span><textarea value={f.message} onChange={set("message")} rows={6} maxLength={3000} /></label>
                <label className="ax-hp" aria-hidden="true">Website<input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" /></label>
              </div>
              {err && <p className="ax-form-err" role="alert">{err}</p>}
              <button type="submit" className="ax-btn teal lg ax-co-next-btn" disabled={busy}>{busy ? <><Loader2 size={17} className="spin" /> Sending…</> : "Send message"}</button>
              <p className="ax-co-terms">We use your details only to answer you. {BUSINESS.legalName}.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
