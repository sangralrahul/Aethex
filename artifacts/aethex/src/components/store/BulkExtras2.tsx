/**
 * Update 82: for hospitals and medical colleges.
 * - SendForApproval: send the bulk list to an HOD or purchase head by email; they open a link (no account needed),
 *   change quantities, comment, and approve, ask for changes or decline.
 * - ApprovalsList (/approvals): the lists you sent, where each stands, the comments, and "Use this list" to load the
 *   approved list and ask for a quotation.
 * - ApprovePage (/approve/:token): the approver's page.
 * - EquipmentPage (/equipment): the equipment register with service, calibration and warranty dates and reminders.
 * Styles: src/shop.css (.ax-appr*, .ax-eq*).
 */
import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, ClipboardList, Download, Loader2, MessageSquare, Pencil, Plus, Send, Trash2, Wrench, X, XCircle } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/store/Dialog";
import { ShopHead } from "@/components/shop/ShopHead";
import { bulk, usePricedBulk } from "@/lib/store/bulk";
import { storeFetch, useStore, type StoreError } from "@/lib/store/api";
import type { BulkItem, Segment } from "@/lib/store/types";
import { SEGMENT_PAGES } from "@/config/institutions";
import { currentPortal, loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";

export interface Approval {
  id: string; token?: string; name: string; segment: Segment; status: "pending" | "approved" | "changes" | "declined"; statusText: string; message: string | null;
  ownerName: string | null; approverName: string | null; approverEmail?: string; items: BulkItem[]; units: number; estTotal: number; unpriced: number;
  comments: { who: string; role: string; text: string; at: number }[]; createdAt: number; updatedAt: number; decidedAt: number | null;
}
/** The list on this portal's home when already on its subdomain, else the in-app page. */
const listHref = (seg: Segment) => (currentPortal() === (seg === "hospital" ? "hospitals" : "medicalcolleges") ? "/#list" : `${SEGMENT_PAGES[seg].path}#list`);
const when = (ms: number) => new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/* ---------------------------------------------------------------- send for approval */
export function SendForApproval({ segment }: { segment: Segment }) {
  const { isLoggedIn } = useUserAuth();
  const { lines } = usePricedBulk();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false), [f, setF] = useState({ name: "", approverName: "", approverEmail: "", message: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState("");
  if (!lines.length) return null;
  const send = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await storeFetch<{ approval: Approval; emailed: boolean }>("/approvals", { json: { ...f, segment, lines } }); setDone(r.approval.approverEmail ?? f.approverEmail); void qc.invalidateQueries({ queryKey: ["store", "approvals"] }); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  return (
    <>
      {isLoggedIn ? <button type="button" className="ax-btn lg" onClick={() => { setDone(""); setOpen(true); }} data-bulk="send-approval"><Send size={16} /> Send for approval</button>
        : <a className="ax-btn lg" href={loginUrl("/", { next: `${SEGMENT_PAGES[segment].path}#list` })}><Send size={16} /> Sign in to send for approval</a>}
      <Dialog open={open} onClose={() => setOpen(false)} title={done ? "Sent for approval" : "Send for approval"}>
        {done ? (
          <div className="ax-appr-done" data-bulk="approval-sent"><CheckCircle2 size={36} /><p>We've emailed <b>{done}</b> a link to review the list. You'll get an email when they reply. See it any time in <Link href="/approvals">Approvals</Link>.</p></div>
        ) : (
          <form className="ax-form" onSubmit={send} data-bulk="approval-form">
            <label className="f wide"><span>Name of the list</span><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={segment === "hospital" ? "e.g. ICU monitors for the new wing" : "e.g. Skills lab, first-year batch"} maxLength={80} /></label>
            <label className="f"><span>Approver's name <em>(optional)</em></span><input value={f.approverName} onChange={(e) => setF({ ...f, approverName: e.target.value })} placeholder="e.g. Dr Rao, HOD" maxLength={60} /></label>
            <label className="f"><span>Approver's email</span><input type="email" required value={f.approverEmail} onChange={(e) => setF({ ...f, approverEmail: e.target.value })} /></label>
            <label className="f wide"><span>Message <em>(optional)</em></span><textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={1000} placeholder="Anything they should know: budget head, deadline…" /></label>
            <p className="fine">They can change quantities, comment, and approve or decline. No Aethex account needed: the link in the email is enough, so send it only to the right person.</p>
            {err && <p className="ax-form-err" role="alert">{err}</p>}
            <button type="submit" className="ax-btn teal lg" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Send</button>
          </form>
        )}
      </Dialog>
    </>
  );
}

function ItemsTable({ items, edit, qty, setQty }: { items: BulkItem[]; edit?: boolean; qty?: Record<string, number>; setQty?: (k: string, n: number) => void }) {
  const { data: store } = useStore(true);
  const total = items.reduce((s, i) => s + (i.unitPrice ?? 0) * (qty?.[`${i.productId}:${i.variantId ?? ""}`] ?? i.qty), 0);
  return (
    <div className="ax-appr-items">
      <table>
        <thead><tr><th>Item</th><th className="n">Qty</th><th className="n">Unit price</th><th className="n">Amount</th></tr></thead>
        <tbody>{items.map((i) => {
          const k = `${i.productId}:${i.variantId ?? ""}`, q = qty?.[k] ?? i.qty;
          return (
            <tr key={k} data-line={k}>
              <td>{store?.brandName(i.brand) ?? ""} {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""}</td>
              <td className="n">{edit ? <input inputMode="numeric" value={q} onChange={(e) => setQty?.(k, Math.max(0, Math.min(10000, Number(e.target.value.replace(/\D/g, "")) || 0)))} aria-label={`Quantity of ${i.name}`} /> : q.toLocaleString("en-IN")}</td>
              <td className="n">{i.unitPrice === null ? "On request" : formatINR(i.unitPrice)}</td>
              <td className="n">{i.unitPrice === null ? "–" : formatINR(i.unitPrice * q)}</td>
            </tr>
          );
        })}</tbody>
        <tfoot><tr><td colSpan={3}>Estimated total at listed prices</td><td className="n" data-bulk="appr-total">{formatINR(total)}</td></tr></tfoot>
      </table>
    </div>
  );
}

function Comments({ list }: { list: Approval["comments"] }) {
  if (!list.length) return null;
  return <ul className="ax-appr-comments">{list.map((c, i) => <li key={i} className={c.role}><b>{c.who}</b><small>{when(c.at)}</small><p>{c.text}</p></li>)}</ul>;
}

/* ---------------------------------------------------------------- the approver's page */
export function ApprovePage() {
  const { token = "" } = useParams<{ token: string }>();
  useSeo({ title: "Approve a purchase list | Aethex", description: "Review a purchase list sent for your approval.", path: `/approve/${token}` });
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ["store", "approve", token], retry: 0, queryFn: () => storeFetch<{ approval: Approval }>(`/approvals/${token}`).then((r) => r.approval) });
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState(""), [comment, setComment] = useState(""), [busy, setBusy] = useState(""), [err, setErr] = useState("");
  const changed = data ? data.items.some((i) => qty[`${i.productId}:${i.variantId ?? ""}`] !== undefined && qty[`${i.productId}:${i.variantId ?? ""}`] !== i.qty) : false;
  const act = async (decision: "approved" | "changes" | "declined" | "comment") => {
    setBusy(decision); setErr("");
    try {
      const lines = data!.items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: qty[`${i.productId}:${i.variantId ?? ""}`] ?? i.qty })).filter((l) => l.qty > 0);
      const r = decision === "comment"
        ? await storeFetch<{ approval: Approval }>(`/approvals/${token}/comment`, { json: { name, comment } })
        : await storeFetch<{ approval: Approval }>(`/approvals/${token}/decision`, { json: { decision, name, comment, ...(changed ? { lines } : {}) } });
      qc.setQueryData(["store", "approve", token], r.approval); setComment(""); setQty({});
    } catch (x) { setErr((x as StoreError).message); } finally { setBusy(""); }
  };
  if (isLoading) return <div className="ax-wrap ax-orders-loading"><Loader2 size={20} className="spin" /> Loading…</div>;
  if (error || !data) return <div className="ax-wrap ax-empty" style={{ margin: "40px auto" }}><h2>Link not valid</h2><p>{(error as Error)?.message}</p></div>;
  const decided = data.status !== "pending";
  return (
    <div className="ax-cart-page" data-bulk="approve-page">
      <ShopHead compact crumbs={[{ label: "Approval" }]} title={data.name} sub={`From ${data.ownerName ?? "a colleague"} · ${data.items.length} items · ${data.units.toLocaleString("en-IN")} units`} />
      <div className="ax-wrap ax-appr">
        <p className={`ax-appr-status s-${data.status}`} data-bulk="appr-status">{data.statusText}{data.decidedAt ? ` · ${when(data.decidedAt)}` : ""}</p>
        {data.message && <blockquote className="ax-appr-msg">{data.message}</blockquote>}
        <ItemsTable items={data.items} edit={!decided} qty={qty} setQty={(k, n) => setQty({ ...qty, [k]: n })} />
        {data.unpriced > 0 && <p className="fine">{data.unpriced} item{data.unpriced === 1 ? " is" : "s are"} priced on request.</p>}
        <Comments list={data.comments} />
        <div className="ax-appr-act">
          <div className="ax-form">
            <label className="f"><span>Your name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder={data.approverName ?? "e.g. Dr Rao"} maxLength={60} /></label>
            <label className="f wide"><span>Comment {decided ? "" : <em>(needed to ask for changes or decline)</em>}</span><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} /></label>
          </div>
          {err && <p className="ax-form-err" role="alert">{err}</p>}
          <div className="row">
            {!decided && <>
              <button type="button" className="ax-btn teal lg" disabled={!!busy} onClick={() => void act("approved")} data-bulk="approve">{busy === "approved" ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Approve{changed ? " with my changes" : ""}</button>
              <button type="button" className="ax-btn lg" disabled={!!busy} onClick={() => void act("changes")} data-bulk="ask-changes"><Pencil size={16} /> Ask for changes</button>
              <button type="button" className="ax-btn danger lg" disabled={!!busy} onClick={() => void act("declined")} data-bulk="decline"><XCircle size={16} /> Decline</button>
            </>}
            <button type="button" className="ax-btn lg" disabled={!!busy || comment.trim().length < 2} onClick={() => void act("comment")} data-bulk="comment"><MessageSquare size={16} /> Comment only</button>
          </div>
          <p className="fine">These are listed prices for guidance; Aethex sends the final quotation to the person who made the list.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the sender's approvals */
export function ApprovalsList() {
  useSeo({ title: "Approvals | Aethex for institutions", description: "Purchase lists you sent for approval.", path: "/approvals" });
  const { isLoggedIn } = useUserAuth();
  const [, go] = useLocation();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["store", "approvals"], enabled: isLoggedIn, retry: 0, queryFn: () => storeFetch<{ approvals: Approval[] }>("/approvals").then((r) => r.approvals) });
  const [open, setOpen] = useState("");
  const use = (a: Approval) => {
    bulk.clear(); bulk.addMany(a.items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })));
    toast({ title: `"${a.name}" is in your list`, description: "Ask for a quotation when you're ready." });
    go(listHref(a.segment));
  };
  return (
    <div className="ax-cart-page" data-bulk="approvals">
      <ShopHead compact crumbs={[{ label: "Approvals" }]} title="Approvals" sub="Lists you sent to an HOD or purchase head" />
      <div className="ax-wrap ax-appr">
        {!isLoggedIn ? <div className="ax-empty"><h2>Sign in to see your approvals</h2><a className="ax-btn teal" href={loginUrl("/", { next: "/approvals" })}>Sign in</a></div>
          : isLoading ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p>
          : !data?.length ? <div className="ax-empty"><span className="ic"><ClipboardList size={26} /></span><h2>Nothing sent yet</h2><p>Build a list, then use "Send for approval".</p><Link href="/hospitals" className="ax-btn teal">For hospitals</Link></div>
          : <ul className="ax-appr-list">{data.map((a) => (
            <li key={a.id} data-approval={a.id}>
              <button type="button" className="row" onClick={() => setOpen(open === a.id ? "" : a.id)} aria-expanded={open === a.id}>
                <span><b>{a.name}</b><small>To {a.approverName ?? a.approverEmail} · {a.items.length} items · {formatINR(a.estTotal)}</small></span>
                <span className={`ax-appr-status s-${a.status}`}>{a.statusText}</span>
              </button>
              {open === a.id && <div className="body">
                <ItemsTable items={a.items} />
                <Comments list={a.comments} />
                <div className="row2">
                  {a.status !== "declined" && <button type="button" className="ax-btn teal" onClick={() => use(a)} data-bulk="use-approved"><ClipboardList size={15} /> Use this list{a.status === "approved" ? " and ask for a quotation" : ""}</button>}
                  {a.token && <button type="button" className="ax-btn" onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}/approve/${a.token}`); toast({ title: "Link copied" }); }}>Copy the approver's link</button>}
                </div>
              </div>}
            </li>
          ))}</ul>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- equipment register */
export interface Equip { id: string; name: string; brand?: string; model?: string; serial?: string; location?: string; purchased?: string; orderRef?: string; warrantyUntil?: string; serviceMonths?: number; lastService?: string; calibrationMonths?: number; lastCalibration?: string; notes?: string; nextService: string | null; nextCalibration: string | null }
const MONTHS = [1, 2, 3, 4, 6, 12, 24];
const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const plus = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const dueClass = (d?: string | null) => (!d ? "" : d < today() ? "over" : d <= plus(today(), 30) ? "soon" : "ok");
const fmt = (d?: string | null) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "–");
const blankEq = { id: "", name: "", brand: "", model: "", serial: "", location: "", purchased: "", orderRef: "", warrantyUntil: "", serviceMonths: "", lastService: "", calibrationMonths: "", lastCalibration: "", notes: "" };

export function EquipmentPage() {
  useSeo({ title: "Equipment register | Aethex for institutions", description: "Your equipment with service, calibration and warranty dates, and email reminders.", path: "/equipment" });
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["store", "equipment"], enabled: isLoggedIn, retry: 0, queryFn: () => storeFetch<{ equipment: Equip[] }>("/equipment").then((r) => r.equipment) });
  const [form, setForm] = useState<typeof blankEq | null>(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [q, setQ] = useState(""), [filter, setFilter] = useState<"all" | "due">("all");
  const list = useMemo(() => (data ?? []).filter((e) => (!q.trim() || `${e.name} ${e.brand ?? ""} ${e.model ?? ""} ${e.serial ?? ""} ${e.location ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) && (filter === "all" || [e.nextService, e.nextCalibration].some((d) => d && d <= plus(today(), 30)))).sort((a, b) => (a.nextService ?? a.nextCalibration ?? "9").localeCompare(b.nextService ?? b.nextCalibration ?? "9")), [data, q, filter]);
  const set = (eq: Equip[]) => qc.setQueryData(["store", "equipment"], eq);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await storeFetch<{ equipment: Equip[] }>("/equipment", { json: { ...form, id: form!.id || undefined } }); set(r.equipment); setForm(null); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  const done = async (id: string, kind: "service" | "calibration") => { const r = await storeFetch<{ equipment: Equip[] }>(`/equipment/${id}/done`, { json: { kind } }); set(r.equipment); };
  const del = async (e: Equip) => { if (!window.confirm(`Remove ${e.name} from the register?`)) return; const r = await storeFetch<{ equipment: Equip[] }>(`/equipment/${e.id}/delete`, { json: {} }); set(r.equipment); };
  const csv = () => {
    const rows = [["Name", "Brand", "Model", "Serial", "Location", "Purchased", "Warranty until", "Service every (months)", "Last service", "Next service", "Calibration every (months)", "Last calibration", "Next calibration", "Notes"],
      ...(data ?? []).map((e) => [e.name, e.brand, e.model, e.serial, e.location, e.purchased, e.warrantyUntil, e.serviceMonths, e.lastService, e.nextService, e.calibrationMonths, e.lastCalibration, e.nextCalibration, e.notes].map((v) => v ?? ""))];
    const text = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = "equipment-register.csv"; a.click();
  };
  const due = (data ?? []).filter((e) => [e.nextService, e.nextCalibration].some((d) => d && d <= plus(today(), 30))).length;
  return (
    <div className="ax-cart-page" data-bulk="equipment">
      <ShopHead compact crumbs={[{ label: "Equipment register" }]} title="Equipment register" sub="Service, calibration and warranty dates, with an email a week before" right={isLoggedIn ? <button type="button" className="ax-btn teal" onClick={() => { setErr(""); setForm({ ...blankEq }); }} data-bulk="add-equipment"><Plus size={16} /> Add equipment</button> : undefined} />
      <div className="ax-wrap ax-eq">
        {!isLoggedIn ? <div className="ax-empty"><span className="ic"><Wrench size={26} /></span><h2>Sign in to keep a register</h2><p>Record your equipment with service, calibration and warranty dates. We email you a week before anything is due.</p><a className="ax-btn teal" href={loginUrl("/", { next: "/equipment" })}>Sign in</a></div>
          : isLoading ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : <>
            <div className="ax-eq-bar">
              <div className="kh-tabs" role="tablist"><button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All ({data?.length ?? 0})</button><button type="button" role="tab" aria-selected={filter === "due"} className={filter === "due" ? "on" : ""} onClick={() => setFilter("due")} data-bulk="due-filter">Due in 30 days ({due})</button></div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, model, serial, location" aria-label="Search equipment" />
              {!!data?.length && <button type="button" className="ax-btn" onClick={csv}><Download size={15} /> CSV</button>}
            </div>
            {!data?.length ? <div className="ax-empty"><span className="ic"><Wrench size={26} /></span><h2>No equipment yet</h2><p>Add monitors, defibrillators, autoclaves, microscopes… with how often they need servicing and calibration.</p></div>
              : <div className="ax-eq-table"><table>
                <thead><tr><th>Equipment</th><th>Location</th><th>Next service</th><th>Next calibration</th><th>Warranty</th><th /></tr></thead>
                <tbody>{list.map((e) => (
                  <tr key={e.id} data-eq={e.id}>
                    <td><b>{e.name}</b><small>{[e.brand, e.model, e.serial && `S/N ${e.serial}`].filter(Boolean).join(" · ")}</small></td>
                    <td>{e.location ?? "–"}</td>
                    <td><span className={`due ${dueClass(e.nextService)}`} data-bulk="next-service">{fmt(e.nextService)}</span>{e.nextService && <button type="button" className="ax-link" onClick={() => void done(e.id, "service")} data-bulk="serviced">Done today</button>}</td>
                    <td><span className={`due ${dueClass(e.nextCalibration)}`}>{fmt(e.nextCalibration)}</span>{e.nextCalibration && <button type="button" className="ax-link" onClick={() => void done(e.id, "calibration")}>Done today</button>}</td>
                    <td><span className={`due ${e.warrantyUntil && e.warrantyUntil < today() ? "over" : ""}`}>{fmt(e.warrantyUntil)}</span></td>
                    <td className="acts"><button type="button" className="ax-icon-btn edit" onClick={() => setForm({ ...blankEq, ...Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v == null ? "" : String(v)])) } as typeof blankEq)} aria-label={`Edit ${e.name}`}><Pencil size={14} /></button><button type="button" className="ax-icon-btn" onClick={() => void del(e)} aria-label={`Remove ${e.name}`}><Trash2 size={14} /></button></td>
                  </tr>
                ))}</tbody>
              </table></div>}
          </>}
        <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit equipment" : "Add equipment"} wide>
          {form && <form className="ax-form" onSubmit={save} data-bulk="equipment-form">
            <label className="f wide"><span>Name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Multipara monitor, ICU bed 4" maxLength={100} /></label>
            <label className="f"><span>Brand</span><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} maxLength={60} /></label>
            <label className="f"><span>Model</span><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} maxLength={60} /></label>
            <label className="f"><span>Serial number</span><input value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} maxLength={60} /></label>
            <label className="f"><span>Location</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. ICU, OT 2, Physiology lab" maxLength={80} /></label>
            <label className="f"><span>Purchased on</span><input type="date" value={form.purchased} onChange={(e) => setForm({ ...form, purchased: e.target.value })} /></label>
            <label className="f"><span>Warranty until</span><input type="date" value={form.warrantyUntil} onChange={(e) => setForm({ ...form, warrantyUntil: e.target.value })} /></label>
            <label className="f"><span>Service every</span><select value={form.serviceMonths} onChange={(e) => setForm({ ...form, serviceMonths: e.target.value })} data-bulk="service-months"><option value="">No regular service</option>{MONTHS.map((m) => <option key={m} value={m}>{m} month{m === 1 ? "" : "s"}</option>)}</select></label>
            <label className="f"><span>Last serviced</span><input type="date" value={form.lastService} onChange={(e) => setForm({ ...form, lastService: e.target.value })} data-bulk="last-service" /></label>
            <label className="f"><span>Calibration every</span><select value={form.calibrationMonths} onChange={(e) => setForm({ ...form, calibrationMonths: e.target.value })}><option value="">No calibration</option>{MONTHS.map((m) => <option key={m} value={m}>{m} month{m === 1 ? "" : "s"}</option>)}</select></label>
            <label className="f"><span>Last calibrated</span><input type="date" value={form.lastCalibration} onChange={(e) => setForm({ ...form, lastCalibration: e.target.value })} /></label>
            <label className="f wide"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} placeholder="Service engineer's number, AMC details…" /></label>
            <p className="fine">Follow the maker's service and calibration schedule. We email you a week before each date.</p>
            {err && <p className="ax-form-err" role="alert">{err}</p>}
            <div className="row"><button type="submit" className="ax-btn teal" disabled={busy}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save</button><button type="button" className="ax-btn" onClick={() => setForm(null)}><X size={15} /> Cancel</button></div>
          </form>}
        </Dialog>
      </div>
    </div>
  );
}
