/**
 * Plans and pricing: Starter, Core, Professional and Enterprise, with a
 * monthly / yearly switch, a comparison table, and an invoice or quote request
 * that opens a ready-made email to Aethex (and is remembered on this device).
 */
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Building2, Check, Copy, FileCheck2, Laptop, Mail, MessageCircle, ShieldCheck, X } from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { CADUS_REF_CSS } from "@/components/cadus/cadus-ref-styles";
import { CADUS_WS_CSS } from "@/components/cadus/cadus-ws-styles";
import { CADUS_SIGNIN_CSS } from "@/components/cadus/cadus-signin-styles";
import { CADUS_CLINIC_CSS } from "@/components/cadus/cadus-clinic-styles";
import { CADUS_LOOKS_CSS } from "@/components/cadus/cadus-looks-styles";
import { useUserAuth } from "@/hooks/use-user-auth";
import { PLANS, PLAN_BY_ID, planOf, planRequestMail, readPlanRequest, rupees, savePlanRequest, type Plan, type PlanId, type PlanRequest } from "@/lib/cadus/plans";
import { LEGAL_PATH, SUPPORT_EMAIL } from "@/lib/cadus/legal";
import { isCadusHost } from "@/lib/host";

const ROWS: { label: string; get: (p: Plan) => string | boolean }[] = [
  { label: "Questions a day", get: (p) => (p.limits.questionsPerDay === Infinity ? "Unlimited" : String(p.limits.questionsPerDay)) },
  { label: "Second-model safety review", get: () => true },
  { label: "Answer modes, calculators, cases, ward round", get: () => true },
  { label: "Live sources with citations", get: (p) => p.limits.sources },
  { label: "Image and report reading", get: (p) => p.limits.reading },
  { label: "Learn: mock tests and analysis", get: (p) => p.limits.mocks },
  { label: "Cadus Magnus 3.6 drafts the answer", get: (p) => p.limits.magnus },
  { label: "Prescriber, letterhead and Word export", get: (p) => p.limits.prescriber },
  { label: "Institution protocols and team packs", get: (p) => p.limits.institution },
  { label: "Admin console, usage reports, SSO", get: (p) => p.id === "enterprise" },
  { label: "Billing", get: (p) => (p.id === "starter" ? "Free" : p.id === "enterprise" ? "Invoice, per seat" : "Invoice, per user") },
];

export default function CadusPlans() {
  const { user } = useUserAuth();
  const current = planOf(user);
  const cadus = isCadusHost();
  const home = cadus ? "/" : "/ai-assistant";
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const [asking, setAsking] = useState<PlanId | null>(null);
  const [sent, setSent] = useState<PlanRequest | null>(() => readPlanRequest());
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", organisation: user?.college || user?.hospital || "", seats: 50, note: "" });
  const look = (() => { try { const l = JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").look; return ["clinical", "editorial", "mono"].includes(l) ? l : "editorial"; } catch { return "editorial"; } })();
  const dark = (() => { try { return JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").theme === "dark"; } catch { return false; } })();
  const mail = useMemo(() => (sent ? planRequestMail(sent) : null), [sent]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!asking) return;
    const r: PlanRequest = { plan: asking, cycle, name: form.name.trim(), email: form.email.trim(), organisation: form.organisation.trim(), seats: asking === "enterprise" ? Math.max(25, Number(form.seats) || 25) : 1, note: form.note.trim(), at: Date.now() };
    savePlanRequest(r);
    setSent(r);
    setAsking(null);
    const m = planRequestMail(r);
    window.location.href = `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
  };
  const price = (p: Plan) => (p.monthly === null ? null : cycle === "yearly" ? p.yearly! : p.monthly);

  return (
    <div className={`cx cx-plans ${dark ? "cx-dark" : "cx-light"} ans-sans`} data-look={look} style={{ ["--fs" as string]: "15.5px" }}>
      <style>{CADUS_CSS + CADUS_REF_CSS + CADUS_WS_CSS + CADUS_SIGNIN_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS + PLANS_CSS}</style>
      <header className="cx-shared-top">
        <a className="cx-si-brand small" href={home} style={{ display: "flex", marginBottom: 0 }}><CadusMark size={24} /><span>Cadus</span></a>
        <span className="cx-shared-tag">Plans and pricing</span>
        <a className="cx-btn primary" href={home}>{user ? "Open Cadus" : "Sign in"} <ArrowRight size={14} /></a>
      </header>
      <main className="cx-plans-main">
        <section className="cx-plans-hero">
          <p className="cx-si-eyebrow">Plans and pricing</p>
          <h1>Plans for every stage of medicine</h1>
          <p>Start free. Move up when the wards, the exam or the clinic ask more of you. Medical colleges and hospitals get Cadus for every seat, with their own protocols inside every answer.</p>
          <div className="cx-seg cx-plans-cycle" role="tablist" aria-label="Billing cycle">
            <button role="tab" aria-selected={cycle === "monthly"} className={cycle === "monthly" ? "on" : ""} onClick={() => setCycle("monthly")}>Monthly</button>
            <button role="tab" aria-selected={cycle === "yearly"} className={cycle === "yearly" ? "on" : ""} onClick={() => setCycle("yearly")}>Yearly <em>save about 30%</em></button>
          </div>
        </section>

        {sent && mail && (
          <div className="cx-plans-sent" role="status">
            <ShieldCheck size={16} />
            <span><b>{PLAN_BY_ID[sent.plan].name} requested</b> on {new Date(sent.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. If your email app did not open, send the request yourself:</span>
            <a className="cx-btn" href={`mailto:${mail.to}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`}><Mail size={14} /> Email</a>
            <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(`${mail.subject}\n\n${mail.body}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(`${mail.subject}\n\n${mail.body}`); }}><Copy size={14} /> Copy</button>
            <button className="cx-ib" onClick={() => { savePlanRequest(null); setSent(null); }} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        <div className="cx-plans-grid">
          {PLANS.map((p) => {
            const amount = price(p);
            const isCurrent = p.id === current;
            return (
              <article key={p.id} className={`cx-plan-card ${p.popular ? "popular" : ""} ${p.id === "enterprise" ? "ent" : ""} ${isCurrent ? "current" : ""}`} data-plan={p.id}>
                {p.popular && <span className="cx-plan-flag">Most popular</span>}
                {isCurrent && <span className="cx-plan-flag now">Your plan</span>}
                <h2>{p.name}</h2>
                <p className="cx-plan-tag">{p.tagline}</p>
                <p className="cx-plan-price">
                  {amount === null ? <><b>Quote</b><small>per seat, billed yearly</small></> : amount === 0 ? <><b>Free</b><small>for ever, for one user</small></> : cycle === "yearly" ? <><b>{rupees(Math.round(amount / 12))}</b><small>per user a month, billed {rupees(amount)} a year</small></> : <><b>{rupees(amount)}</b><small>per user a month, billed monthly</small></>}
                </p>
                <p className="cx-plan-aud">{p.audience}</p>
                <ul>{p.includes.map((x) => <li key={x}><Check size={14} /> {x}</li>)}</ul>
                {p.id === "starter" ? (
                  <a className="cx-btn" href={user ? home : (cadus ? "/sign-in" : "/ai-assistant/sign-in")}>{user ? (isCurrent ? "Open Cadus" : "Included") : "Create a free account"} <ArrowRight size={14} /></a>
                ) : isCurrent ? (
                  <span className="cx-plan-cur"><ShieldCheck size={14} /> Active on your account</span>
                ) : (
                  <button className={`cx-btn ${p.popular || p.id === "enterprise" ? "primary" : ""}`} onClick={() => setAsking(p.id)}>
                    {p.id === "enterprise" ? <><Building2 size={14} /> Request a quote</> : <>Request {p.name} <ArrowRight size={14} /></>}
                  </button>
                )}
                <small className="cx-plan-cta">{p.cta}</small>
              </article>
            );
          })}
        </div>

        <section className="cx-plans-trust" aria-label="On every plan">
          <span><ShieldCheck size={16} /> Every answer reviewed by a second model</span>
          <span><Laptop size={16} /> Chats, cases and prescriptions stay on your device</span>
          <span><FileCheck2 size={16} /> GST invoice and DPDP-aligned privacy policy</span>
        </section>

        <section className="cx-plans-table-wrap">
          <h2>Compare the plans</h2>
          <table className="cx-plans-table">
            <thead><tr><th scope="col">What you get</th>{PLANS.map((p) => <th key={p.id} scope="col">{p.name}</th>)}</tr></thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}><th scope="row">{r.label}</th>{PLANS.map((p) => { const v = r.get(p); return <td key={p.id}>{v === true ? <Check size={15} aria-label="Included" /> : v === false ? <span className="no" aria-label="Not included">—</span> : v}</td>; })}</tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="cx-plans-ent">
          <div>
            <h2><Building2 size={20} /> Enterprise for medical colleges and institutions</h2>
            <p>One agreement covers every student, resident and faculty member. Your protocols, antibiotic policy and formulary go into every answer; departments share cases, decks and question banks; the admin console shows who is using what. Sign-in with the college or hospital email, a signed data-processing agreement, GST invoicing, and on-campus onboarding for the first batch.</p>
          </div>
          <button className="cx-btn primary" onClick={() => setAsking("enterprise")}>Talk to Aethex <ArrowRight size={14} /></button>
        </section>

        <section className="cx-plans-faq">
          <h2>Questions</h2>
          <dl>
            <dt>How do I pay?</dt><dd>Request the plan and Aethex emails a GST invoice the same working day; pay by UPI or bank transfer and the plan is switched on for your account. Card payment in the app is coming.</dd>
            <dt>Can I change or cancel?</dt><dd>Yes. Monthly plans run month to month; yearly plans can move up at any time with the difference pro-rated. Write to {SUPPORT_EMAIL}.</dd>
            <dt>Is there a student price?</dt><dd>Starter is free for everyone. Colleges on Enterprise cover their students; ask your dean or department to get in touch.</dd>
            <dt>Does the plan change what Cadus stores?</dt><dd>No. On every plan your chats, cases and prescriptions stay on your device, and every answer is checked by a second model. See the <a href={LEGAL_PATH("privacy", cadus)}>privacy policy</a>.</dd>
          </dl>
        </section>
      </main>
      <footer className="cx-legal-foot">
        <span>Prices in Indian rupees, GST extra. Clinical decision support for qualified professionals and students.</span>
        <nav aria-label="Legal"><a href={LEGAL_PATH("terms", cadus)}>Terms</a><a href={LEGAL_PATH("privacy", cadus)}>Privacy</a><a href={LEGAL_PATH("disclaimer", cadus)}>Disclaimer</a><a href={`mailto:${SUPPORT_EMAIL}`}>Support</a></nav>
      </footer>

      {asking && (
        <div className="cx-overlay center" onMouseDown={() => setAsking(null)}>
          <div className="cx-dialog cx-plan-ask" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cx-ask-t">
            <div className="cx-dialog-h">
              <div><h3 id="cx-ask-t">{asking === "enterprise" ? "Request an Enterprise quote" : `Request the ${PLAN_BY_ID[asking].name} plan`}</h3><p>{asking === "enterprise" ? "Tell us about the institution and Aethex will send a proposal within two working days." : `${cycle === "yearly" ? rupees(PLAN_BY_ID[asking].yearly!) + " a year" : rupees(PLAN_BY_ID[asking].monthly!) + " a month"} per user, GST extra. Aethex emails an invoice and activates the plan on payment.`}</p></div>
              <button className="cx-ib" onClick={() => setAsking(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <form className="cx-dialog-b cx-plan-form" onSubmit={submit}>
              <label className="cx-field"><span>Your name</span><input className="cx-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} autoComplete="name" /></label>
              <label className="cx-field"><span>Email</span><input className="cx-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={120} autoComplete="email" /></label>
              <label className="cx-field"><span>{asking === "enterprise" ? "College or hospital" : "College, hospital or clinic (optional)"}</span><input className="cx-input" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} required={asking === "enterprise"} maxLength={120} /></label>
              {asking === "enterprise" && <label className="cx-field"><span>Seats (students, residents and faculty)</span><input className="cx-input" type="number" min={25} step={5} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} /></label>}
              <label className="cx-field"><span>Anything else (optional)</span><textarea className="cx-input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} placeholder={asking === "enterprise" ? "Departments, timelines, existing protocols…" : "GST number for the invoice, start date…"} /></label>
              <div className="cx-up-acts"><button className="cx-btn primary" type="submit"><Mail size={14} /> Send the request</button><button className="cx-btn" type="button" onClick={() => setAsking(null)}>Cancel</button></div>
              <p className="cx-up-foot">This opens an email to {SUPPORT_EMAIL} with the details filled in. Nothing is charged until you accept the invoice.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const PLANS_CSS = `
.cx-plans{position:fixed;inset:0;overflow:auto;display:flex;flex-direction:column;background:var(--bg)}
.cx-plans .cx-shared-top{position:sticky;top:0;z-index:5;background:var(--bg)}
.cx-plans-main{flex:1;width:100%;max-width:1160px;margin:0 auto;padding:40px 24px 64px}
.cx-plans-hero{text-align:center;max-width:720px;margin:0 auto 32px}
.cx .cx-plans-hero h1{font-size:36px;letter-spacing:-.02em;margin-bottom:12px}
.cx-plans-hero p{font-size:16px;line-height:1.6;color:var(--t2)}
.cx-plans-cycle{display:inline-flex;margin-top:22px}
.cx-plans-cycle em{font-style:normal;font-size:11px;font-weight:600;color:var(--ok);margin-left:6px}
.cx-plans-sent{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 20px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--s2);font-size:13.5px}
.cx-plans-sent>svg{color:var(--ok);flex-shrink:0}
.cx-plans-sent>span{flex:1;min-width:240px}
.cx-plans-sent .cx-btn{height:30px;font-size:12.5px}
.cx-plans-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:stretch}
.cx-plan-card{position:relative;display:flex;flex-direction:column;gap:8px;padding:22px 20px 18px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-plan-card.popular{border-color:var(--text);box-shadow:var(--sh2)}
.cx-plan-card.ent{background:var(--s2)}
.cx-plan-flag{position:absolute;top:-11px;left:18px;padding:3px 9px;border-radius:999px;background:var(--primary);color:var(--primary-ink);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.cx-plan-flag.now{background:var(--ok);color:#fff;left:auto;right:18px}
.cx .cx-plan-card h2{font-size:22px;font-weight:600;letter-spacing:-.01em}
.cx-plan-tag{font-size:14px;color:var(--t2);min-height:20px}
.cx-plan-price{display:flex;flex-direction:column;gap:2px;margin:10px 0 2px}
.cx-plan-price b{font-size:34px;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.cx-plan-price small{font-size:12.5px;color:var(--t3)}
.cx-plan-eq{color:var(--t2)!important}
.cx-plan-aud{font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--t3);margin-top:6px}
.cx-plan-card ul{flex:1;margin:8px 0 14px;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.cx-plan-card li{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.45;color:var(--text)}
.cx-plan-card li svg{flex-shrink:0;margin-top:3px;color:var(--ok)}
.cx-plan-card .cx-btn{justify-content:center;height:38px}
.cx-plan-cur{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;font-size:13.5px;font-weight:600;color:var(--ok)}
.cx-plan-cta{text-align:center;font-size:12px;color:var(--t3);margin-top:4px}
.cx-plans-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px;margin:28px 0 0;padding:16px 20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-size:13.5px;color:var(--t2)}
.cx-plans-trust span{display:inline-flex;align-items:center;gap:8px}
.cx-plans-trust svg{color:var(--ok)}
.cx-plans-table-wrap{margin-top:40px}
.cx .cx-plans-table-wrap h2,.cx .cx-plans-ent h2,.cx .cx-plans-faq h2{font-size:22px;font-weight:600;margin-bottom:14px}
.cx-plans-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:var(--r-lg,10px);overflow:hidden;font-size:13.5px}
.cx-plans-table th,.cx-plans-table td{padding:11px 14px;border-bottom:1px solid var(--line);text-align:center}
.cx-plans-table th[scope="row"]{text-align:left;font-weight:500;color:var(--text);width:40%}
.cx-plans-table thead th{background:var(--s2);font-weight:600}
.cx-plans-table tbody tr:last-child th,.cx-plans-table tbody tr:last-child td{border-bottom:0}
.cx-plans-table td svg{color:var(--ok);vertical-align:middle}
.cx-plans-table .no{color:var(--t3)}
.cx-plans-ent{display:flex;align-items:center;gap:28px;margin-top:40px;padding:26px 28px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--s2)}
.cx-plans-ent h2{display:flex;align-items:center;gap:10px}
.cx-plans-ent p{font-size:14.5px;line-height:1.65;color:var(--t2)}
.cx-plans-ent .cx-btn{flex-shrink:0;height:40px}
.cx-plans-faq{margin-top:40px;max-width:760px}
.cx-plans-faq dl{margin:0}
.cx-plans-faq dt{font-weight:600;margin-top:14px}
.cx-plans-faq dd{margin:4px 0 0;font-size:14.5px;line-height:1.65;color:var(--t2)}
.cx-plans-faq a{text-decoration:underline}
.cx-plan-form{display:flex;flex-direction:column;gap:10px}
.cx-plan-form textarea.cx-input{min-height:0}
.cx-up-acts{display:flex;gap:8px;margin-top:6px}
.cx-up-foot{font-size:12px;color:var(--t3);line-height:1.5}
@media (max-width:1000px){.cx-plans-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.cx-plans-main{padding:24px 16px 48px}.cx-plans-grid{grid-template-columns:1fr}.cx .cx-plans-hero h1{font-size:28px}.cx-plans-ent{flex-direction:column;align-items:flex-start}.cx-plans-table{font-size:12px}.cx-plans-table th,.cx-plans-table td{padding:8px 6px}}
`;
