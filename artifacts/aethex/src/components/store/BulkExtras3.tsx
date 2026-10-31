/**
 * Update 86: for hospitals and medical colleges.
 * - TeamPage (/team): one team per institution or department. Admins invite by email (the link needs that email
 *   to sign in), set roles, remove people; everyone in it shares the purchase lists, approvals, quotation requests,
 *   purchase orders, spend and the equipment register.
 * - SpendPage (/spend): the financial year (April–March) from orders and quotations marked ordered: by month, by
 *   department, by person, the top items, against the year's budget, with a CSV.
 * - PurchaseOrderPage (/purchase-order/:id): a numbered purchase order from a quotation, with the prices Aethex
 *   quoted, terms and delivery, to print or save as PDF.
 * Styles: src/shop.css (.ax-team*, .ax-spend*, .ax-po*).
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Download, Loader2, LogOut, Mail, PiggyBank, Plus, Printer, Save, Shield, UserMinus, Users } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { ShopHead } from "@/components/shop/ShopHead";
import { Logo } from "@/components/layout/Navbar";
import { storeFetch, useStore, type MyQuote, type StoreError } from "@/lib/store/api";
import { SEGMENT_PAGES } from "@/config/institutions";
import { BUSINESS } from "@/config/business";
import { isBookId } from "@/lib/store/bookdata";
import { loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";
import type { Segment } from "@/lib/store/types";

/* ---------------------------------------------------------------- team */
type Member = { email: string; name: string | null; role: "admin" | "member"; status: "active" | "invited"; you: boolean; owner: boolean; invitedAt: number; joinedAt: number | null };
type TeamData = { team: { id: string; name: string; segment: Segment; role: "admin" | "member"; owner: boolean } | null; members: Member[]; invites: { token: string; team: string; segment: Segment; role: string; at: number }[] };
export function useTeam(enabled = true) {
  const { isLoggedIn } = useUserAuth();
  return useQuery({ enabled: isLoggedIn && enabled, queryKey: ["store", "team"], queryFn: () => storeFetch<TeamData>("/team"), retry: false });
}
export function TeamPage() {
  useSeo({ title: "Your team | Aethex for institutions", description: "Share purchase lists, approvals, quotations and the equipment register with your colleagues.", path: "/team" });
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useTeam();
  const invite = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("invite") ?? "";
  const [f, setF] = useState({ name: "", segment: "hospital" as Segment }), [inv, setInv] = useState({ email: "", role: "member" });
  const [err, setErr] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const set = (d: Partial<TeamData>) => qc.setQueryData(["store", "team"], (old: TeamData | undefined) => ({ invites: [], ...(old ?? {}), ...d }) as TeamData);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(""); setMsg(""); try { await fn(); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); } };
  const accept = (token: string) => run(async () => { set(await storeFetch<TeamData>("/team/accept", { json: { token } })); void qc.invalidateQueries({ queryKey: ["store"] }); setMsg("You've joined the team."); });
  if (!isLoggedIn) return <div className="ax-cart-page"><ShopHead compact crumbs={[{ label: "Team" }]} title="Your team" /><div className="ax-wrap ax-team"><div className="ax-empty"><span className="ic"><Users size={26} /></span><h2>Sign in to {invite ? "accept the invitation" : "set up a team"}</h2>{invite && <p>Sign in with the email address the invitation was sent to.</p>}<a className="ax-btn teal" href={loginUrl("/", { next: `/team${invite ? `?invite=${invite}` : ""}` })}>Sign in</a></div></div></div>;
  const t = data?.team;
  return (
    <div className="ax-cart-page" data-bulk="team">
      <ShopHead compact crumbs={[{ label: "Team" }]} title={t ? t.name : "Your team"} sub={t ? `${data!.members.filter((m) => m.status === "active").length} people · you're ${t.role === "admin" ? "an admin" : "a member"}` : "Work on lists, approvals and quotations together"} />
      <div className="ax-wrap ax-team">
        {isLoading ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : <>
          {!t && invite && <div className="ax-team-invite" data-bulk="accept-invite"><Mail size={18} /><span>You&apos;ve been invited to a team.</span><button type="button" className="ax-btn teal" disabled={busy} onClick={() => void accept(invite)}>Accept and join</button></div>}
          {!t && data?.invites.filter((i) => i.token !== invite).map((i) => <div key={i.token} className="ax-team-invite"><Mail size={18} /><span><b>{i.team}</b> invited you as {i.role === "admin" ? "an admin" : "a member"}.</span><button type="button" className="ax-btn teal" disabled={busy} onClick={() => void accept(i.token)}>Join</button></div>)}
          {t ? <>
            <section className="ax-team-card">
              <h2><Users size={18} /> People</h2>
              <ul className="ax-team-list" data-bulk="team-members">{data!.members.map((m) => (
                <li key={m.email} className={m.status} data-member={m.email}>
                  <span className="who"><b>{m.name ?? m.email}{m.you ? " (you)" : ""}</b><small>{m.email}{m.status === "invited" ? " · invitation sent" : ""}</small></span>
                  <span className={`role ${m.role}`}>{m.role === "admin" ? <><Shield size={12} /> Admin</> : "Member"}</span>
                  {t.role === "admin" && !m.you && !m.owner && <span className="acts">
                    <button type="button" className="ax-link" onClick={() => void run(async () => set(await storeFetch<TeamData>("/team/members/role", { json: { email: m.email, role: m.role === "admin" ? "member" : "admin" } })))}>{m.role === "admin" ? "Make member" : "Make admin"}</button>
                    <button type="button" className="ax-icon-btn" onClick={() => { if (window.confirm(`Remove ${m.email} from the team?`)) void run(async () => set(await storeFetch<TeamData>("/team/members/remove", { json: { email: m.email } }))); }} aria-label={`Remove ${m.email}`}><UserMinus size={14} /></button>
                  </span>}
                </li>
              ))}</ul>
              {t.role === "admin" && (
                <form className="ax-form ax-team-inv" onSubmit={(e: FormEvent) => { e.preventDefault(); void run(async () => { const r = await storeFetch<TeamData & { emailed: boolean }>("/team/invite", { json: inv }); set(r); setMsg(r.emailed ? `We've emailed ${inv.email} an invitation.` : "Invitation saved; the email didn't go out. Share the team page link with them."); setInv({ email: "", role: "member" }); }); }} data-bulk="invite-form">
                  <label className="f"><span>Invite by email</span><input type="email" required value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="colleague@hospital.in" /></label>
                  <label className="f"><span>As</span><select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}><option value="member">Member</option><option value="admin">Admin (can invite and set the budget)</option></select></label>
                  <button type="submit" className="ax-btn teal" disabled={busy}><Plus size={15} /> Invite</button>
                </form>
              )}
            </section>
            <section className="ax-team-card">
              <h2>What the team shares</h2>
              <div className="ax-team-links">
                <Link href={`${SEGMENT_PAGES[t.segment].path}#list`}>Saved purchase lists</Link><Link href="/approvals">Approvals</Link><Link href="/account/quotations">Quotation requests and purchase orders</Link><Link href="/spend">Spend this year</Link><Link href="/equipment">Equipment register</Link>
              </div>
              <p className="fine">Each person still signs in with their own account. Orders placed by members count in the team&apos;s spend.</p>
            </section>
            <button type="button" className="ax-link danger" onClick={() => { if (window.confirm(`Leave ${t.name}?`)) void run(async () => { await storeFetch("/team/leave", { json: {} }); await qc.invalidateQueries({ queryKey: ["store"] }); }); }} data-bulk="leave-team"><LogOut size={14} /> Leave the team</button>
          </> : (
            <form className="ax-team-card ax-form" onSubmit={(e: FormEvent) => { e.preventDefault(); void run(async () => { set(await storeFetch<TeamData>("/team", { json: f })); void qc.invalidateQueries({ queryKey: ["store"] }); }); }} data-bulk="team-create">
              <h2><Building2 size={18} /> Make a team</h2>
              <p className="fine">For your hospital, college or department: invite the purchase officer, HODs and storekeeper so everyone works from the same lists and records.</p>
              <label className="f wide"><span>Team name</span><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} placeholder="e.g. City Hospital, Purchase" /></label>
              <label className="f"><span>We are a</span><select value={f.segment} onChange={(e) => setF({ ...f, segment: e.target.value as Segment })}><option value="hospital">Hospital or clinic</option><option value="college">Medical college</option></select></label>
              <button type="submit" className="ax-btn teal" disabled={busy}><Plus size={15} /> Make the team</button>
            </form>
          )}
          {msg && <p className="fine" role="status">{msg}</p>}
          {err && <p className="ax-form-err" role="alert">{err}</p>}
        </>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- spend */
type Line = { productId: number; name: string; qty: number; lineTotal: number };
type SpendData = { fy: number; start: number; end: number; team: { name: string; segment: Segment; role: string } | null; budget: number | null; canSetBudget: boolean;
  orders: { id: string; at: number; status: string; by: string | null; total: number; lines: Line[] }[]; quotations: { id: string; at: number; institution: string; po: string | null; priced: boolean; total: number; lines: Line[] }[] };
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const fyNow = () => { const d = new Date(Date.now() + 330 * 60000); return d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; };
const monthIdx = (at: number) => (new Date(at + 330 * 60000).getUTCMonth() + 9) % 12;
export function SpendPage() {
  useSeo({ title: "Spend | Aethex for institutions", description: "What your institution spent on Aethex this financial year, by month and department, against the budget.", path: "/spend" });
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const [fy, setFy] = useState(fyNow());
  const { data, isLoading } = useQuery({ enabled: isLoggedIn, queryKey: ["store", "spend", fy], queryFn: () => storeFetch<SpendData>(`/spend?fy=${fy}`), retry: false });
  const { data: store } = useStore(true);
  const [seg, setSeg] = useState<Segment>("hospital");
  useEffect(() => { if (data?.team) setSeg(data.team.segment); }, [data?.team]);
  const [budget, setBudget] = useState(""), [msg, setMsg] = useState("");
  useEffect(() => setBudget(data?.budget ? String(data.budget) : ""), [data?.budget]);
  const calc = useMemo(() => {
    if (!data) return null;
    const months = MONTHS.map(() => ({ orders: 0, quotes: 0 }));
    const dept = new Map<string, number>(), items = new Map<string, { name: string; qty: number; total: number }>(), people = new Map<string, number>();
    const secs = SEGMENT_PAGES[seg].sections;
    const add = (l: Line) => {
      const cat = store?.byId.get(l.productId)?.category ?? "";
      const k = secs.find((s) => s.categories.includes(cat))?.short ?? (isBookId(l.productId) ? "Textbooks" : "Other");
      dept.set(k, (dept.get(k) ?? 0) + l.lineTotal);
      const it = items.get(l.name) ?? { name: l.name, qty: 0, total: 0 }; it.qty += l.qty; it.total += l.lineTotal; items.set(l.name, it);
    };
    for (const o of data.orders) { months[monthIdx(o.at)]!.orders += o.total; o.lines.forEach(add); people.set(o.by ?? "Others", (people.get(o.by ?? "Others") ?? 0) + o.total); }
    for (const q of data.quotations) { months[monthIdx(q.at)]!.quotes += q.total; q.lines.forEach(add); }
    const total = months.reduce((s, m) => s + m.orders + m.quotes, 0);
    const now = Date.now(), elapsed = Math.min(12, Math.max(1, Math.ceil((Math.min(now, data.end) - data.start) / (30.44 * 86400_000))));
    return { months, total, dept: [...dept.entries()].sort((a, b) => b[1] - a[1]), items: [...items.values()].sort((a, b) => b.total - a.total).slice(0, 8), people: [...people.entries()].sort((a, b) => b[1] - a[1]), projected: data.end > now ? Math.round((total / elapsed) * 12) : total };
  }, [data, store, seg]);
  const csv = () => {
    if (!data) return;
    const rows = [["Type", "Reference", "Date", "Item", "Qty", "Amount (Rs)"], ...data.orders.flatMap((o) => o.lines.map((l) => ["Order", o.id, new Date(o.at).toLocaleDateString("en-IN"), l.name, l.qty, l.lineTotal])), ...data.quotations.flatMap((q) => q.lines.map((l) => ["Quotation (ordered)", q.po ?? q.id, new Date(q.at).toLocaleDateString("en-IN"), l.name, l.qty, l.lineTotal]))];
    const text = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = `aethex-spend-${data.fy}-${String(data.fy + 1).slice(2)}.csv`; a.click();
  };
  const saveBudget = async () => { setMsg(""); try { await storeFetch("/spend/budget", { json: { fy, amount: budget.trim() ? Number(budget.replace(/[^\d.]/g, "")) : null } }); await qc.invalidateQueries({ queryKey: ["store", "spend", fy] }); setMsg("Saved."); } catch (x) { setMsg((x as StoreError).message); } };
  const max = calc ? Math.max(1, ...calc.months.map((m) => m.orders + m.quotes)) : 1;
  return (
    <div className="ax-cart-page" data-bulk="spend">
      <ShopHead compact crumbs={[{ label: "Spend" }]} title="Spend" sub={data?.team ? `${data.team.name} · April to March` : "Your purchases on Aethex, April to March"} right={<select className="ax-spend-fy" value={fy} onChange={(e) => setFy(Number(e.target.value))} aria-label="Financial year">{[fyNow(), fyNow() - 1, fyNow() - 2].map((y) => <option key={y} value={y}>FY {y}–{String(y + 1).slice(2)}</option>)}</select>} />
      <div className="ax-wrap ax-spend">
        {!isLoggedIn ? <div className="ax-empty"><span className="ic"><PiggyBank size={26} /></span><h2>Sign in to see your spend</h2><a className="ax-btn teal" href={loginUrl("/", { next: "/spend" })}>Sign in</a></div>
          : isLoading || !calc || !data ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : <>
            <section className="ax-spend-top">
              <div><small>Spent this year</small><b data-bulk="spend-total">{formatINR(calc.total)}</b><span>{data.orders.length} order{data.orders.length === 1 ? "" : "s"} · {data.quotations.length} quotation{data.quotations.length === 1 ? "" : "s"} ordered</span></div>
              {data.budget ? <div className="bud"><small>Budget {formatINR(data.budget)}</small><span className="bar"><i style={{ width: `${Math.min(100, (calc.total / data.budget) * 100)}%` }} className={calc.total > data.budget ? "over" : calc.projected > data.budget ? "warn" : ""} /></span>
                <span data-bulk="spend-left">{calc.total > data.budget ? `${formatINR(calc.total - data.budget)} over` : `${formatINR(data.budget - calc.total)} left`}{calc.projected !== calc.total ? ` · on course for ${formatINR(calc.projected)}` : ""}</span></div>
                : <div className="bud"><small>No budget set</small><span>Set the year&apos;s budget to track against it.</span></div>}
              {data.canSetBudget && <div className="setb"><label><span>Budget for FY {fy}–{String(fy + 1).slice(2)} (₹)</span><input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 2500000" data-bulk="budget-input" /></label><button type="button" className="ax-btn" onClick={() => void saveBudget()} data-bulk="budget-save"><Save size={14} /> Save</button>{msg && <small>{msg}</small>}</div>}
            </section>
            {calc.total === 0 ? <div className="ax-empty"><h2>Nothing yet this year</h2><p>Orders and quotations marked ordered appear here.</p></div> : <>
              <section className="ax-spend-card"><h2>By month</h2>
                <div className="ax-spend-months" data-bulk="spend-months">{calc.months.map((m, i) => <div key={i} title={`${MONTHS[i]}: ${formatINR(m.orders + m.quotes)}`}><span className="col"><i className="q" style={{ height: `${(m.quotes / max) * 100}%` }} /><i className="o" style={{ height: `${(m.orders / max) * 100}%` }} /></span><small>{MONTHS[i]}</small></div>)}</div>
                <p className="fine"><i className="ax-key o" /> Orders <i className="ax-key q" /> Quotations marked ordered{data.quotations.some((q) => !q.priced) ? " (at listed prices until a purchase order has the quoted prices)" : ""}</p>
              </section>
              <div className="ax-spend-grid">
                <section className="ax-spend-card"><div className="hd"><h2>By department</h2>{!data.team && <select value={seg} onChange={(e) => setSeg(e.target.value as Segment)} aria-label="Departments for"><option value="hospital">Hospital</option><option value="college">College</option></select>}</div>
                  <ul className="ax-spend-list" data-bulk="spend-dept">{calc.dept.map(([k, v]) => <li key={k}><span>{k}</span><span className="bar"><i style={{ width: `${(v / calc.total) * 100}%` }} /></span><b>{formatINR(v)}</b></li>)}</ul></section>
                <section className="ax-spend-card"><h2>Top items</h2><ul className="ax-spend-list">{calc.items.map((it) => <li key={it.name}><span>{it.name}<small> ×{it.qty}</small></span><b>{formatINR(it.total)}</b></li>)}</ul></section>
                {data.team && calc.people.length > 1 && <section className="ax-spend-card"><h2>Orders by person</h2><ul className="ax-spend-list">{calc.people.map(([k, v]) => <li key={k}><span>{k}</span><b>{formatINR(v)}</b></li>)}</ul></section>}
              </div>
              <button type="button" className="ax-btn" onClick={csv} data-bulk="spend-csv"><Download size={15} /> Download CSV</button>
            </>}
          </>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- purchase order */
type PoItem = { productId: number; variantId?: string | null; name: string; qty: number; unitPrice: number | null };
type Po = { number: string; at: number; updatedAt: number; items: PoItem[]; terms: string; deliverTo: string; notes: string; deliverBy: string; by: string };
const amt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function PurchaseOrderPage() {
  const { id = "" } = useParams<{ id: string }>();
  useSeo({ title: "Purchase order | Aethex for institutions", description: "A purchase order from your quotation.", path: `/purchase-order/${id}` });
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ["store", "po", id], queryFn: () => storeFetch<{ request: MyQuote; po: Po | null; buyerTeam: string | null }>(`/my-quotes/${id}`), retry: false });
  const [edit, setEdit] = useState<Po | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  useEffect(() => {
    if (!data) return;
    const r = data.request;
    setEdit(data.po ?? { number: "", at: 0, updatedAt: 0, by: "", items: r.items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, name: i.name + (i.variantLabel ? ` (${i.variantLabel})` : ""), qty: i.qty, unitPrice: i.unitPrice })), terms: "Payment within 30 days of delivery and invoice.", deliverTo: [r.institution, r.address, `${r.city}, ${r.state} ${r.pincode}`].filter(Boolean).join("\n"), notes: "", deliverBy: r.needBy ?? "" });
  }, [data]);
  if (isLoading) return <div className="ax-wrap ax-orders-loading"><Loader2 size={20} className="spin" /> Loading…</div>;
  if (error || !data || !edit) return <div className="ax-wrap ax-empty" style={{ margin: "40px auto" }}><h2>Not available</h2><p>{(error as Error | null)?.message ?? ""}</p><Link href="/account/quotations" className="ax-btn teal">Your quotation requests</Link></div>;
  const r = data.request, po = data.po;
  const can = r.status === "quoted" || r.status === "ordered";
  const total = edit.items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);
  const save = async () => { setBusy(true); setErr(""); try { const out = await storeFetch<{ po: Po }>(`/my-quotes/${id}/po`, { json: edit }); qc.setQueryData(["store", "po", id], { ...data, po: out.po }); setEdit(out.po); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); } };
  const setItem = (k: number, patch: Partial<PoItem>) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === k ? { ...x, ...patch } : x)) });
  return (
    <div className="ax-inv-page" data-bulk="po-page">
      <div className="ax-wrap ax-inv-bar noprint">
        <Link href="/account/quotations" className="ax-link"><ArrowLeft size={15} /> Quotation requests</Link>
        {can && <button type="button" className="ax-btn" disabled={busy} onClick={() => void save()} data-bulk="po-save"><Save size={15} /> {po ? "Save changes" : "Make the purchase order"}</button>}
        {po && <button type="button" className="ax-btn teal" onClick={() => window.print()} data-bulk="po-print"><Printer size={16} /> Print or save as PDF</button>}
      </div>
      {!can && <p className="ax-wrap fine noprint">A purchase order is made once Aethex has sent the quotation for this request.</p>}
      {err && <p className="ax-wrap ax-form-err noprint" role="alert">{err}</p>}
      {can && !po && <p className="ax-wrap fine noprint">Check the quantities and enter the prices from Aethex&apos;s quotation (the store&apos;s listed prices are filled in), then make the purchase order. It gets the next number for your {data.buyerTeam ? "team" : "account"}.</p>}
      <article className="ax-inv ax-po" aria-label="Purchase order">
        <header>
          <div className="seller"><small>From (buyer)</small><b data-bulk="po-buyer">{r.institution}</b>{r.address && <span>{r.address}</span>}<span>{r.city}, {r.state} {r.pincode}</span>{r.gstin && <span>GSTIN {r.gstin}</span>}<span>{r.contactName}{r.designation ? `, ${r.designation}` : ""} · {r.phone} · {r.email}</span></div>
          <div className="meta"><h1>Purchase order</h1><dl>
            <div><dt>PO number</dt><dd data-bulk="po-number">{po?.number ?? "Assigned when made"}</dd></div>
            <div><dt>Date</dt><dd>{new Date(po?.at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</dd></div>
            <div><dt>Quotation ref.</dt><dd>{r.id}</dd></div>
          </dl></div>
        </header>
        <section className="parties">
          <div><small>To (supplier)</small><Logo /><b>{BUSINESS.legalName}</b>{BUSINESS.address && <span>{BUSINESS.address}</span>}{BUSINESS.gstin && <span>GSTIN {BUSINESS.gstin}</span>}<span>{BUSINESS.email}{BUSINESS.phone ? ` · ${BUSINESS.phone}` : ""}</span></div>
          <div><small>Deliver to</small>{can ? <textarea className="noprint-edit" value={edit.deliverTo} onChange={(e) => setEdit({ ...edit, deliverTo: e.target.value })} rows={3} aria-label="Deliver to" /> : null}<span className="pre">{edit.deliverTo}</span>
            <small>Deliver by</small>{can ? <input type="date" className="noprint-edit" value={edit.deliverBy} onChange={(e) => setEdit({ ...edit, deliverBy: e.target.value })} aria-label="Deliver by" /> : null}<span>{edit.deliverBy ? new Date(`${edit.deliverBy}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "As agreed"}</span></div>
        </section>
        <table>
          <thead><tr><th>#</th><th>Item</th><th className="n">Qty</th><th className="n">Rate (₹)</th><th className="n">Amount (₹)</th></tr></thead>
          <tbody>{edit.items.map((it, k) => (
            <tr key={`${it.productId}:${it.variantId ?? ""}`} data-po-line={it.productId}>
              <td>{k + 1}</td><td>{it.name}</td>
              <td className="n">{can ? <input className="noprint-edit num" inputMode="numeric" value={it.qty} onChange={(e) => setItem(k, { qty: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0) })} aria-label={`Quantity of ${it.name}`} /> : null}<span className="pv">{it.qty}</span></td>
              <td className="n">{can ? <input className="noprint-edit num" inputMode="decimal" value={it.unitPrice ?? ""} onChange={(e) => setItem(k, { unitPrice: e.target.value.trim() === "" ? null : Number(e.target.value.replace(/[^\d.]/g, "")) })} placeholder="As quoted" aria-label={`Rate of ${it.name}`} data-bulk="po-rate" /> : null}<span className="pv">{it.unitPrice === null ? "As quoted" : amt(it.unitPrice)}</span></td>
              <td className="n">{it.unitPrice === null ? "–" : amt(it.unitPrice * it.qty)}</td>
            </tr>
          ))}</tbody>
        </table>
        <section className="totals"><dl><div className="grand"><dt>Total</dt><dd data-bulk="po-total">₹{amt(total)}</dd></div></dl><p className="words">Rates inclusive of GST as quoted.{edit.items.some((i) => i.unitPrice === null) ? " Items without a rate are as per the quotation." : ""}</p></section>
        <section className="ax-po-terms">
          <div><small>Terms</small>{can ? <textarea className="noprint-edit" value={edit.terms} onChange={(e) => setEdit({ ...edit, terms: e.target.value })} rows={3} aria-label="Terms" /> : null}<p className="pre">{edit.terms}</p></div>
          {(can || edit.notes) && <div><small>Notes</small>{can ? <textarea className="noprint-edit" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={2} aria-label="Notes" placeholder="e.g. Please mention the PO number on the invoice." /> : null}<p className="pre">{edit.notes}</p></div>}
        </section>
        <footer className="ax-po-sign"><div><span /><small>Prepared by{po?.by ? `: ${po.by}` : ""}</small></div><div><span /><small>Approved by (signature and seal)</small></div></footer>
      </article>
    </div>
  );
}
