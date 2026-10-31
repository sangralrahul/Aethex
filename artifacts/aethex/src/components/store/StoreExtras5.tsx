/**
 * Update 100: sell on Aethex.
 * - SellPage (/sell on store.aethex.in): what sellers get, how it works, and the application form (business, contact,
 *   kind of seller, GSTIN, place, categories, what they sell, brands). The store inbox and the applicant are emailed;
 *   a signed-in applicant sees where their application stands. No bank details or documents are asked for here: the
 *   team collects those after review.
 * - AdminSellerApps: the "Sellers" tab of the store admin: applications by status, details, a note, and approve or
 *   reject (optionally emailing the applicant).
 * Worker: handleSellerApply, handleAdminSellers (worker/store.ts); table store_seller_apps. Styles: src/site-hub.css (.sl-*).
 */
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Building2, Check, ClipboardCheck, Loader2, MessageSquareText, PackageCheck, Rocket, Send, Store, Users } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { storeFetch, useStore, type StoreError } from "@/lib/store/api";
import { INDIAN_STATES } from "@/lib/store/rules";

const KINDS = ["Manufacturer or brand owner", "Authorised distributor", "Wholesaler", "Retailer or pharmacy", "Publisher (books)"];
type App = { id: string; business?: string; status: string; statusText?: string; createdAt: number };
const blank = { business: "", contact: "", email: "", phone: "", kind: "", gstin: "", city: "", state: "", pincode: "", categories: [] as string[], products: "", brands: "", website: "", count: "", genuine: false };

export function SellPage() {
  useSeo({ title: "Sell on Aethex: list your medical products | Aethex Store", description: "Sell medical devices, supplies, equipment and books on Aethex to patients, doctors, students, hospitals and medical colleges across India. Apply in a few minutes.", path: "/sell" });
  const { isLoggedIn, user } = useUserAuth();
  const qc = useQueryClient();
  const { data: store } = useStore();
  const { data: mine } = useQuery({ queryKey: ["store", "seller-apply"], enabled: isLoggedIn, queryFn: () => storeFetch<{ applications: App[] }>("/seller-apply"), retry: false });
  const [f, setF] = useState({ ...blank, contact: user?.name ?? "", email: user?.email ?? "" });
  const [err, setErr] = useState<{ field?: string; msg: string } | null>(null), [busy, setBusy] = useState(false), [done, setDone] = useState<string | null>(null);
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((x) => ({ ...x, [k]: v }));
  const cats = [...(store?.categories ?? []).map((c) => [c.slug, c.name] as const), ["books", "Medical books"] as const, ["other", "Something else"] as const];
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await storeFetch<{ id: string }>("/seller-apply", { json: f });
      setDone(r.id);
      await qc.invalidateQueries({ queryKey: ["store", "seller-apply"] });
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (x) { const s = x as StoreError; setErr({ field: s.data?.field, msg: s.message }); } finally { setBusy(false); }
  };
  const bad = (k: string) => (err?.field === k ? " bad" : "");
  return (
    <div className="sl" data-store="sell">
      <section className="sl-hero">
        <div className="ax-wrap">
          <span className="tag"><Store size={15} /> Sell on Aethex</span>
          <h1>Sell your medical products across India</h1>
          <p>Reach patients, doctors, students, hospitals and medical colleges, from one listing.</p>
          <div className="acts"><a href="#apply" className="ax-btn teal" data-store="sell-start">Apply to sell</a><a href="#how" className="ax-btn">How it works</a></div>
        </div>
      </section>

      <section className="ax-wrap sl-why" aria-label="Why sell on Aethex">
        {[
          [<Users size={22} key="u" />, "Five audiences", "Patients, doctors, students, hospitals and colleges"],
          [<Building2 size={22} key="b" />, "Bulk orders", "Hospitals and colleges send lists for quotations"],
          [<BadgeCheck size={22} key="c" />, "Verified sellers", "Genuine brands build buyer trust"],
          [<MessageSquareText size={22} key="m" />, "Full product pages", "Photos, specs, reviews and questions"],
        ].map(([i, t, d]) => <div key={t as string}><span className="i">{i}</span><b>{t}</b><small>{d}</small></div>)}
      </section>

      <section className="ax-wrap sl-how" id="how" aria-label="How it works">
        <h2>How it works</h2>
        <ol>
          {[[<Send size={20} key="1" />, "Apply", "Tell us about your business: 5 minutes"], [<ClipboardCheck size={20} key="2" />, "We review", "Our team checks the business and products"], [<PackageCheck size={20} key="3" />, "List products", "We help you set up products and prices"], [<Rocket size={20} key="4" />, "Start selling", "Orders, delivery and payouts with our team"]].map(([i, t, d], n) => (
            <li key={t as string}><span className="n">{n + 1}</span><span className="i">{i}</span><b>{t}</b><small>{d}</small></li>
          ))}
        </ol>
      </section>

      <section className="ax-wrap sl-apply" id="apply" aria-label="Apply to sell">
        <div className="sl-side">
          <h2>Apply to sell</h2>
          <ul>
            <li><Check size={15} /> Genuine products only, from the brand or an authorised channel</li>
            <li><Check size={15} /> GSTIN if you have one; it's needed before you start selling</li>
            <li><Check size={15} /> No bank details or documents now: we ask after review</li>
            <li><Check size={15} /> Terms and fees are shared with you after review</li>
          </ul>
          {!!mine?.applications.length && (
            <div className="sl-mine" data-store="my-seller-apps">
              <h3>Your applications</h3>
              {mine.applications.map((a) => <p key={a.id}><b>{a.business}</b><span className={`st ${a.status}`}>{a.statusText}</span><small>{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></p>)}
            </div>
          )}
        </div>
        {done ? (
          <div className="sl-done" data-store="sell-done" role="status">
            <span className="i"><Check size={26} /></span>
            <h3>Application received</h3>
            <p>We've emailed a confirmation to <b>{f.email}</b>. Our team will be in touch within a few working days.</p>
            <small>Reference: {done}</small>
          </div>
        ) : (
          <form className="ax-form sl-form" onSubmit={submit} data-store="sell-form" noValidate>
            <label className={`f wide${bad("business")}`}><span>Business name</span><input value={f.business} onChange={(e) => set("business", e.target.value)} maxLength={100} autoComplete="organization" data-field="business" /></label>
            <label className={`f${bad("contact")}`}><span>Your name</span><input value={f.contact} onChange={(e) => set("contact", e.target.value)} maxLength={80} autoComplete="name" data-field="contact" /></label>
            <label className={`f${bad("kind")}`}><span>You are a</span><select value={f.kind} onChange={(e) => set("kind", e.target.value)} data-field="kind"><option value="">Choose</option>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className={`f${bad("email")}`}><span>Email</span><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" data-field="email" /></label>
            <label className={`f${bad("phone")}`}><span>Mobile</span><input type="tel" inputMode="numeric" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" autoComplete="tel" data-field="phone" /></label>
            <label className={`f${bad("gstin")}`}><span>GSTIN <em>(optional)</em></span><input value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} placeholder="27ABCDE1234F1Z5" data-field="gstin" /></label>
            <label className={`f${bad("website")}`}><span>Website <em>(optional)</em></span><input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" data-field="website" /></label>
            <label className={`f${bad("city")}`}><span>City</span><input value={f.city} onChange={(e) => set("city", e.target.value)} maxLength={60} autoComplete="address-level2" data-field="city" /></label>
            <label className={`f${bad("state")}`}><span>State</span><select value={f.state} onChange={(e) => set("state", e.target.value)} data-field="state"><option value="">Choose</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className={`f${bad("pincode")}`}><span>PIN code</span><input inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" data-field="pincode" /></label>
            <label className="f"><span>How many products <em>(about)</em></span><select value={f.count} onChange={(e) => set("count", e.target.value)}><option value="">Choose</option>{["1–10", "11–50", "51–200", "200+"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <fieldset className={`f wide sl-cats${bad("categories")}`} data-field="categories"><legend>What do you sell?</legend>
              <div>{cats.map(([slug, name]) => <label key={slug} className={f.categories.includes(slug) ? "on" : ""}><input type="checkbox" checked={f.categories.includes(slug)} onChange={(e) => set("categories", e.target.checked ? [...f.categories, slug] : f.categories.filter((c) => c !== slug))} />{name}</label>)}</div>
            </fieldset>
            <label className={`f wide${bad("products")}`}><span>Tell us about your products</span><textarea rows={3} value={f.products} onChange={(e) => set("products", e.target.value)} maxLength={1000} placeholder="e.g. digital BP monitors and pulse oximeters under our own brand, CDSCO registered" data-field="products" /></label>
            <label className="f wide"><span>Brands <em>(optional)</em></span><input value={f.brands} onChange={(e) => set("brands", e.target.value)} maxLength={200} placeholder="Brands you make or are authorised to sell" /></label>
            <label className={`sl-check wide${bad("genuine")}`}><input type="checkbox" checked={f.genuine} onChange={(e) => set("genuine", e.target.checked)} data-field="genuine" /><span>I confirm the products are genuine and I'm the brand owner or authorised to sell them.</span></label>
            {err && <p className="ax-form-err wide" role="alert">{err.msg}</p>}
            <div className="row wide"><button type="submit" className="ax-btn teal" disabled={busy} data-store="sell-submit">{busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Send application</button></div>
          </form>
        )}
      </section>

      <section className="ax-wrap sl-faq" aria-label="Questions">
        <h2>Questions</h2>
        {[
          ["What does it cost?", "Our team shares the terms and fees with you after reviewing your application. Applying is free."],
          ["Which products can I sell?", "Medical devices, supplies, equipment and medical books, from the brand or an authorised channel."],
          ["Do I need a GSTIN?", "You can apply without one, but you'll need it before you start selling."],
          ["How long does review take?", "Usually a few working days. We'll email you either way."],
        ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>
    </div>
  );
}

type AdminApp = App & { email: string; contact: string; phone: string; kind: string; gstin: string | null; city: string; state: string; pincode: string; categories: string[]; products: string; brands: string | null; website: string | null; count: string | null; note: string | null };
const ST: Record<string, string> = { new: "New", contacted: "Contacted", approved: "Approved", rejected: "Rejected" };
export function AdminSellerApps({ admin }: { admin: <T>(path: string, init?: { method?: string; json?: unknown }) => Promise<T> }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("new");
  const { data } = useQuery({ queryKey: ["store", "admin", "seller-apps", status], queryFn: () => admin<{ applications: AdminApp[]; counts: Record<string, number> }>(`seller-apps${status ? `?status=${status}` : ""}`) });
  const [open, setOpen] = useState(""), [note, setNote] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const save = async (a: AdminApp, st: string, notify: boolean) => {
    setBusy(true); setMsg("");
    try { const r = await admin<{ emailed: boolean }>(`seller-apps/${a.id}`, { method: "POST", json: { status: st, note, notify } }); setMsg(r.emailed ? "Saved; the applicant was emailed." : "Saved."); await qc.invalidateQueries({ queryKey: ["store", "admin", "seller-apps"] }); }
    catch (x) { setMsg((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div data-admin="sellers">
      <div className="ax-adm-filters">{["new", "contacted", "approved", "rejected", ""].map((s) => <button key={s || "all"} type="button" className={status === s ? "on" : ""} onClick={() => setStatus(s)}>{s ? ST[s] : "All"} {s && data?.counts?.[s] ? `(${data.counts[s]})` : ""}</button>)}</div>
      {msg && <p className="fine" role="status">{msg}</p>}
      {!data ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : !data.applications.length ? <p className="fine">No applications here.</p> : (
        <ul className="sl-adm">{data.applications.map((a) => (
          <li key={a.id} data-seller-app={a.id}>
            <button type="button" className="hd" onClick={() => { setOpen(open === a.id ? "" : a.id); setNote(a.note ?? ""); }} aria-expanded={open === a.id}>
              <b>{a.business}</b><span className={`st ${a.status}`}>{ST[a.status]}</span><small>{a.kind} · {a.city}, {a.state} · {new Date(a.createdAt).toLocaleDateString("en-IN")}</small>
            </button>
            {open === a.id && (
              <div className="bd">
                <dl>
                  <dt>Contact</dt><dd>{a.contact} · <a href={`tel:${a.phone}`}>{a.phone}</a> · <a href={`mailto:${a.email}`}>{a.email}</a></dd>
                  <dt>GSTIN</dt><dd>{a.gstin ?? "–"}</dd>
                  <dt>Address</dt><dd>{a.city}, {a.state} {a.pincode}</dd>
                  <dt>Categories</dt><dd>{a.categories.join(", ")}</dd>
                  <dt>Products</dt><dd>{a.count ?? "–"} · {a.products}</dd>
                  <dt>Brands</dt><dd>{a.brands ?? "–"}</dd>
                  <dt>Website</dt><dd>{a.website ? <a href={a.website} target="_blank" rel="noopener noreferrer nofollow">{a.website}</a> : "–"}</dd>
                </dl>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (sent to the applicant when you approve or reject and choose to email)" aria-label="Note" />
                <div className="row">
                  <button type="button" className="ax-btn" disabled={busy} onClick={() => void save(a, "contacted", false)}>Mark contacted</button>
                  <button type="button" className="ax-btn teal" disabled={busy} onClick={() => void save(a, "approved", true)} data-admin="seller-approve">Approve and email</button>
                  <button type="button" className="ax-btn" disabled={busy} onClick={() => void save(a, "rejected", true)}>Reject and email</button>
                </div>
              </div>
            )}
          </li>
        ))}</ul>
      )}
    </div>
  );
}
