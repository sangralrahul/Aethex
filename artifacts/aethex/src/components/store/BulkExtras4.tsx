/**
 * Update 90: for hospitals and medical colleges.
 * - IndentsPage (/indents): a department (ICU, OT, a lab…) raises an indent for catalogue items; the team's admins
 *   (the purchase officer) are emailed, can cut quantities, approve or reject with a note, and merge approved indents
 *   into the bulk list for one quotation. Shared with the team (worker: handleIndents; table store_indents).
 * - StockPage (/stock): the consumables stock register: items with the quantity in hand, unit, reorder level and
 *   reorder quantity; log what was received, used or counted (with a history); low items are flagged here and emailed
 *   once by the hourly job; "Reorder" puts the linked catalogue item in the bulk list (store_stock, store_stock_moves).
 * Styles: src/site-ws.css (.ax-ind*, .ax-stk*).
 */
import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ClipboardList, Download, History, Loader2, Minus, PackagePlus, Pencil, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog } from "@/components/store/Dialog";
import { ShopHead } from "@/components/shop/ShopHead";
import { bulk, useBulkLines } from "@/lib/store/bulk";
import { storeFetch, useStore, type StoreError } from "@/lib/store/api";
import { loginUrl } from "@/lib/host";

/* ---------------------------------------------------------------- a catalogue item picker */
type Pick = { productId: number; variantId: string | null; name: string };
function ProductPick({ onPick, label = "Find an item" }: { onPick: (p: Pick) => void; label?: string }) {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!data || !words.length) return [];
    return data.products.filter((p) => { const t = `${p.name} ${p.brand ?? ""}`.toLowerCase(); return words.every((w) => t.includes(w)); }).slice(0, 8);
  }, [data, q]);
  return (
    <div className="ax-pick">
      <label className="f wide"><span>{label}</span><span className="in"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalogue: gloves, syringes, gauze…" data-bulk="pick-search" /></span></label>
      {hits.length > 0 && <ul className="hits" role="listbox">{hits.flatMap((p) => (p.variants?.length ?? 0) > 1 ? p.variants!.map((v) => ({ p, v })) : [{ p, v: p.variants?.[0] }]).slice(0, 10).map(({ p, v }) => (
        <li key={`${p.id}:${v?.id ?? ""}`}><button type="button" onClick={() => { onPick({ productId: p.id, variantId: v?.id ?? null, name: (p.variants?.length ?? 0) > 1 && v ? `${p.name} (${v.label})` : p.name }); setQ(""); }} data-pick={p.id}>{p.name}{(p.variants?.length ?? 0) > 1 && v ? <small>{v.label}</small> : null}</button></li>
      ))}</ul>}
    </div>
  );
}

/* ---------------------------------------------------------------- indents */
type IndentLine = { productId: number; variantId: string | null; qty: number; name: string; slug: string | null };
type Indent = { id: string; requester: string; department: string; note: string | null; status: "pending" | "approved" | "rejected" | "merged" | "cancelled"; decidedBy: string | null; decisionNote: string | null; createdAt: number; updatedAt: number; mine: boolean; lines: IndentLine[] };
type IndentData = { indents: Indent[]; canApprove: boolean; departments: string[] };
const STATUS: Record<Indent["status"], string> = { pending: "Waiting for approval", approved: "Approved", rejected: "Not approved", merged: "In the bulk list", cancelled: "Withdrawn" };
const when = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function IndentsPage() {
  useSeo({ title: "Department indents | Aethex for institutions", description: "Departments raise indents for supplies; the purchase officer approves them and merges them into one quotation.", path: "/indents" });
  const { isLoggedIn } = useUserAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["store", "indents"], enabled: isLoggedIn, retry: 0, queryFn: () => storeFetch<IndentData>("/indents") });
  const listLines = useBulkLines();
  const [form, setForm] = useState<{ department: string; note: string; lines: (Pick & { qty: number })[] } | null>(null);
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [tab, setTab] = useState<"open" | "all">("open");
  const [edit, setEdit] = useState<Record<string, Record<string, number>>>({}), [notes, setNotes] = useState<Record<string, string>>({});
  const set = (d: IndentData) => qc.setQueryData(["store", "indents"], d);
  const act = async (id: string, a: "approve" | "reject" | "cancel" | "merged", extra: Record<string, unknown> = {}) => {
    setErr("");
    try { set(await storeFetch<IndentData>(`/indents/${id}/${a}`, { json: extra })); } catch (x) { setErr((x as StoreError).message); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!form) return; setBusy(true); setErr("");
    try { set(await storeFetch<IndentData>("/indents", { json: { department: form.department, note: form.note, lines: form.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })) } })); setForm(null); toast({ title: "Indent sent for approval" }); }
    catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  const merge = async (ids: string[]) => {
    const pick = (data?.indents ?? []).filter((i) => ids.includes(i.id) && i.status === "approved");
    const r = bulk.addMany(pick.flatMap((i) => i.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty }))));
    for (const i of pick) await act(i.id, "merged");
    toast({ title: `${pick.length} indent${pick.length === 1 ? "" : "s"} added to your bulk list`, description: r.full ? "The list is full: some lines were left out." : "Open your list to ask for one quotation." });
  };
  const items = (data?.indents ?? []).filter((i) => tab === "all" || i.status === "pending" || i.status === "approved");
  const approved = (data?.indents ?? []).filter((i) => i.status === "approved");
  const fromList = () => setForm({ department: form?.department ?? "", note: form?.note ?? "", lines: listLines.map((l) => ({ ...l, name: `Item ${l.productId}` })) });
  const { data: store } = useStore(!!form);
  const nameOf = (l: Pick) => (l.name.startsWith("Item ") ? store?.byId.get(l.productId)?.name ?? l.name : l.name);
  return (
    <div className="ax-cart-page" data-bulk="indents">
      <ShopHead compact crumbs={[{ label: "Indents" }]} title="Department indents" sub="Departments ask; the purchase officer approves and buys in one go"
        right={isLoggedIn ? <button type="button" className="ax-btn teal" onClick={() => { setErr(""); setForm({ department: "", note: "", lines: [] }); }} data-bulk="new-indent"><Plus size={16} /> Raise an indent</button> : undefined} />
      <div className="ax-wrap ax-ind">
        {!isLoggedIn ? <div className="ax-empty"><span className="ic"><ClipboardList size={26} /></span><h2>Sign in to use indents</h2><p>Departments raise requests for supplies; your purchase officer approves them and merges them into one quotation.</p><a className="ax-btn teal" href={loginUrl("/", { next: "/indents" })}>Sign in</a></div>
          : isLoading ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : <>
            <div className="ax-eq-bar">
              <div className="kh-tabs" role="tablist"><button type="button" role="tab" aria-selected={tab === "open"} className={tab === "open" ? "on" : ""} onClick={() => setTab("open")}>Open ({(data?.indents ?? []).filter((i) => i.status === "pending" || i.status === "approved").length})</button><button type="button" role="tab" aria-selected={tab === "all"} className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>All ({data?.indents.length ?? 0})</button></div>
              {data?.canApprove && approved.length > 0 && <button type="button" className="ax-btn teal" onClick={() => void merge(approved.map((i) => i.id))} data-bulk="merge-all"><ShoppingCart size={15} /> Add {approved.length} approved to the bulk list</button>}
            </div>
            <p className="fine">{data?.canApprove ? "You approve indents for your team." : "Your team's admins approve indents. You'll get an email when yours is decided."} <Link href="/team" className="ax-link">Team</Link></p>
            {err && <p className="ax-form-err" role="alert">{err}</p>}
            {!items.length ? <div className="ax-empty"><span className="ic"><ClipboardList size={26} /></span><h2>No open indents</h2><p>Raise one for your department, or add items from your current list.</p></div>
              : <ul className="ax-ind-list">{items.map((i) => (
                <li key={i.id} className={`ax-ind-card ${i.status}`} data-indent={i.id} data-status={i.status}>
                  <div className="hd"><b>{i.department}</b><span className={`st ${i.status}`}>{STATUS[i.status]}</span><small>{i.requester} · {when(i.createdAt)}</small></div>
                  <table><tbody>{i.lines.map((l) => { const k = `${l.productId}:${l.variantId ?? ""}`; return (
                    <tr key={k}><td>{l.slug ? <Link href={`/products/${l.slug}`}>{l.name}</Link> : l.name}</td>
                      <td className="q">{i.status === "pending" && data?.canApprove ? <input type="number" min={0} max={l.qty} value={edit[i.id]?.[k] ?? l.qty} aria-label={`Approve quantity of ${l.name}`} onChange={(e) => setEdit({ ...edit, [i.id]: { ...edit[i.id], [k]: Math.max(0, Math.min(l.qty, Number(e.target.value) || 0)) } })} /> : `× ${l.qty}`}</td></tr>
                  ); })}</tbody></table>
                  {i.note && <p className="note">“{i.note}”</p>}
                  {i.decisionNote && <p className="note dec"><b>{i.decidedBy}:</b> {i.decisionNote}</p>}
                  <div className="acts">
                    {i.status === "pending" && data?.canApprove && <>
                      <input value={notes[i.id] ?? ""} onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })} placeholder="Note (optional)" aria-label="Note to the department" maxLength={300} />
                      <button type="button" className="ax-btn teal" onClick={() => void act(i.id, "approve", { note: notes[i.id] ?? "", lines: i.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: edit[i.id]?.[`${l.productId}:${l.variantId ?? ""}`] ?? l.qty })) })} data-bulk="approve-indent"><Check size={15} /> Approve</button>
                      <button type="button" className="ax-btn" onClick={() => void act(i.id, "reject", { note: notes[i.id] ?? "" })} data-bulk="reject-indent"><X size={15} /> Reject</button>
                    </>}
                    {i.status === "pending" && i.mine && !data?.canApprove && <button type="button" className="ax-link" onClick={() => void act(i.id, "cancel")}>Withdraw</button>}
                    {i.status === "approved" && data?.canApprove && <button type="button" className="ax-btn" onClick={() => void merge([i.id])} data-bulk="merge-indent"><ShoppingCart size={15} /> Add to bulk list</button>}
                    {i.status === "merged" && <Link href="/#list" className="ax-link">Open the bulk list</Link>}
                  </div>
                </li>
              ))}</ul>}
          </>}
        <Dialog open={!!form} onClose={() => setForm(null)} title="Raise an indent" wide>
          {form && <form className="ax-form" onSubmit={submit} data-bulk="indent-form">
            <label className="f"><span>Department</span><input required list="ax-depts" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. ICU, OT 2, Pathology lab" maxLength={60} data-bulk="indent-dept" />
              <datalist id="ax-depts">{(data?.departments ?? []).map((d) => <option key={d} value={d} />)}</datalist></label>
            <ProductPick onPick={(p) => setForm((f) => f && (f.lines.some((l) => l.productId === p.productId && l.variantId === p.variantId) ? f : { ...f, lines: [...f.lines, { ...p, qty: 1 }] }))} />
            {listLines.length > 0 && !form.lines.length && <button type="button" className="ax-link wide" onClick={fromList}>Use the {listLines.length} items in your current list</button>}
            {form.lines.length > 0 && <ul className="ax-ind-lines wide">{form.lines.map((l, n) => (
              <li key={`${l.productId}:${l.variantId ?? ""}`}><span>{nameOf(l)}</span>
                <input type="number" min={1} max={9999} value={l.qty} onChange={(e) => setForm({ ...form, lines: form.lines.map((x, j) => (j === n ? { ...x, qty: Math.max(1, Math.min(9999, Number(e.target.value) || 1)) } : x)) })} aria-label={`Quantity of ${nameOf(l)}`} data-bulk="indent-qty" />
                <button type="button" className="ax-icon-btn" onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== n) })} aria-label={`Remove ${nameOf(l)}`}><Trash2 size={14} /></button></li>
            ))}</ul>}
            <label className="f wide"><span>Note for the purchase officer</span><textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={500} placeholder="Why it's needed, by when…" /></label>
            {err && <p className="ax-form-err" role="alert">{err}</p>}
            <div className="row"><button type="submit" className="ax-btn teal" disabled={busy || !form.lines.length}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Send for approval</button><button type="button" className="ax-btn" onClick={() => setForm(null)}><X size={15} /> Cancel</button></div>
          </form>}
        </Dialog>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- consumables stock */
type Move = { kind: string; qty: number; after: number; note: string | null; by: string | null; at: number };
type Stock = { id: string; name: string; unit: string; qty: number; reorderLevel: number; reorderQty: number; location?: string; productId?: number; variantId?: string | null; productName?: string; low: boolean; moves: Move[]; updatedAt: number };
type StockData = { stock: Stock[]; units: string[] };
const blankStock = { id: "", name: "", unit: "pcs", qty: "", reorderLevel: "", reorderQty: "", location: "", productId: "" as number | "", variantId: null as string | null, productName: "" };
const MOVE: Record<string, string> = { in: "Received", out: "Used", set: "Counted" };

export function StockPage() {
  useSeo({ title: "Consumables stock | Aethex for institutions", description: "Your consumables with quantities in hand and reorder levels: log receipts and use, get low-stock alerts and reorder in one click.", path: "/stock" });
  const { isLoggedIn } = useUserAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["store", "stock"], enabled: isLoggedIn, retry: 0, queryFn: () => storeFetch<StockData>("/stock") });
  const [form, setForm] = useState<typeof blankStock | null>(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [move, setMove] = useState<{ item: Stock; kind: "in" | "out" | "set"; qty: string; note: string } | null>(null);
  const [q, setQ] = useState(""), [filter, setFilter] = useState<"all" | "low">("all"), [hist, setHist] = useState<string | null>(null);
  const set = (d: StockData) => qc.setQueryData(["store", "stock"], d);
  const list = useMemo(() => (data?.stock ?? []).filter((s) => (filter === "all" || s.low) && (!q.trim() || `${s.name} ${s.location ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))).sort((a, b) => Number(b.low) - Number(a.low) || a.name.localeCompare(b.name)), [data, q, filter]);
  const low = (data?.stock ?? []).filter((s) => s.low);
  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!form) return; setBusy(true); setErr("");
    try { set(await storeFetch<StockData>("/stock", { json: { ...form, id: form.id || undefined, productId: form.productId || undefined } })); setForm(null); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  const doMove = async (e: FormEvent) => {
    e.preventDefault(); if (!move) return; setBusy(true); setErr("");
    try { set(await storeFetch<StockData>(`/stock/${move.item.id}/move`, { json: { kind: move.kind, qty: Number(move.qty), note: move.note } })); setMove(null); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  const del = async (s: Stock) => { if (!window.confirm(`Remove ${s.name} and its history?`)) return; set(await storeFetch<StockData>(`/stock/${s.id}/delete`, { json: {} })); };
  const reorder = (items: Stock[]) => {
    const go = items.filter((s) => s.productId);
    if (!go.length) { toast({ title: "Link the item to a catalogue product first", description: "Edit it and pick the product you buy." }); return; }
    const r = bulk.addMany(go.map((s) => ({ productId: s.productId!, variantId: s.variantId ?? null, qty: Math.max(1, Math.ceil(s.reorderQty || s.reorderLevel || 1)) })));
    toast({ title: `${r.added} item${r.added === 1 ? "" : "s"} added to your bulk list`, description: go.length < items.length ? `${items.length - go.length} not linked to a catalogue product were skipped.` : "Open your list to ask for a quotation." });
  };
  const csv = () => {
    const rows = [["Item", "Unit", "In hand", "Reorder level", "Reorder quantity", "Location", "Catalogue product"], ...(data?.stock ?? []).map((s) => [s.name, s.unit, s.qty, s.reorderLevel, s.reorderQty, s.location ?? "", s.productName ?? ""])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = "consumables-stock.csv"; a.click();
  };
  return (
    <div className="ax-cart-page" data-bulk="stock">
      <ShopHead compact crumbs={[{ label: "Stock" }]} title="Consumables stock" sub="What's in hand, what's running low, and reorder in one click"
        right={isLoggedIn ? <button type="button" className="ax-btn teal" onClick={() => { setErr(""); setForm({ ...blankStock }); }} data-bulk="add-stock"><Plus size={16} /> Add item</button> : undefined} />
      <div className="ax-wrap ax-stk">
        {!isLoggedIn ? <div className="ax-empty"><span className="ic"><PackagePlus size={26} /></span><h2>Sign in to keep a stock register</h2><p>Track gloves, syringes, gauze, reagents… with reorder levels. We email you when something runs low.</p><a className="ax-btn teal" href={loginUrl("/", { next: "/stock" })}>Sign in</a></div>
          : isLoading ? <p className="ax-orders-loading"><Loader2 size={18} className="spin" /> Loading…</p> : <>
            {low.length > 0 && <div className="ax-stk-low" data-bulk="low-banner"><AlertTriangle size={17} /><span><b>{low.length} item{low.length === 1 ? " is" : "s are"} at or below the reorder level.</b> {low.slice(0, 4).map((s) => s.name).join(", ")}{low.length > 4 ? "…" : ""}</span><button type="button" className="ax-btn teal" onClick={() => reorder(low)} data-bulk="reorder-low"><ShoppingCart size={15} /> Reorder all</button></div>}
            <div className="ax-eq-bar">
              <div className="kh-tabs" role="tablist"><button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All ({data?.stock.length ?? 0})</button><button type="button" role="tab" aria-selected={filter === "low"} className={filter === "low" ? "on" : ""} onClick={() => setFilter("low")} data-bulk="low-filter">Low ({low.length})</button></div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items or location" aria-label="Search stock" />
              {!!data?.stock.length && <button type="button" className="ax-btn" onClick={csv}><Download size={15} /> CSV</button>}
            </div>
            {!data?.stock.length ? <div className="ax-empty"><span className="ic"><PackagePlus size={26} /></span><h2>No items yet</h2><p>Add the consumables you keep in stock, with the level at which you reorder.</p></div>
              : <div className="ax-eq-table"><table>
                <thead><tr><th>Item</th><th>In hand</th><th>Reorder at</th><th>Update</th><th /></tr></thead>
                <tbody>{list.map((s) => (<Fragment key={s.id}>
                  <tr data-stock={s.id} className={s.low ? "low" : ""}>
                    <td><b>{s.name}</b><small>{[s.location, s.productName && `Buys: ${s.productName}`].filter(Boolean).join(" · ")}</small></td>
                    <td><span className={`due ${s.low ? "over" : "ok"}`} data-bulk="in-hand">{s.qty} {s.unit}</span></td>
                    <td>{s.reorderLevel} {s.unit}<small>order {s.reorderQty}</small></td>
                    <td className="mv">
                      <button type="button" className="ax-btn sm" onClick={() => { setErr(""); setMove({ item: s, kind: "out", qty: "", note: "" }); }} data-bulk="use"><Minus size={14} /> Used</button>
                      <button type="button" className="ax-btn sm" onClick={() => { setErr(""); setMove({ item: s, kind: "in", qty: "", note: "" }); }} data-bulk="receive"><Plus size={14} /> Received</button>
                      {s.low && <button type="button" className="ax-btn sm teal" onClick={() => reorder([s])} data-bulk="reorder"><ShoppingCart size={14} /> Reorder</button>}
                    </td>
                    <td className="acts">
                      <button type="button" className="ax-icon-btn" onClick={() => setHist(hist === s.id ? null : s.id)} aria-label={`History of ${s.name}`} aria-expanded={hist === s.id}><History size={14} /></button>
                      <button type="button" className="ax-icon-btn edit" onClick={() => setForm({ ...blankStock, id: s.id, name: s.name, unit: s.unit, qty: String(s.qty), reorderLevel: String(s.reorderLevel), reorderQty: String(s.reorderQty), location: s.location ?? "", productId: s.productId ?? "", variantId: s.variantId ?? null, productName: s.productName ?? "" })} aria-label={`Edit ${s.name}`}><Pencil size={14} /></button>
                      <button type="button" className="ax-icon-btn" onClick={() => void del(s)} aria-label={`Remove ${s.name}`}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                  {hist === s.id && <tr className="hist"><td colSpan={5}><ul data-bulk="stock-history">{s.moves.map((m, i) => <li key={i}><b>{MOVE[m.kind] ?? m.kind}</b> {m.kind === "set" ? "" : m.kind === "in" ? "+" : "−"}{m.qty} → {m.after} {s.unit}<small>{when(m.at)}{m.by ? ` · ${m.by}` : ""}{m.note ? ` · ${m.note}` : ""}</small></li>)}</ul></td></tr>}
                </Fragment>))}</tbody>
              </table></div>}
          </>}
        <Dialog open={!!move} onClose={() => setMove(null)} title={move ? `${move.kind === "in" ? "Received" : move.kind === "out" ? "Used" : "Count"}: ${move.item.name}` : ""}>
          {move && <form className="ax-form" onSubmit={doMove} data-bulk="move-form">
            <div className="kh-tabs wide" role="tablist">{(["out", "in", "set"] as const).map((k) => <button key={k} type="button" role="tab" aria-selected={move.kind === k} className={move.kind === k ? "on" : ""} onClick={() => setMove({ ...move, kind: k })}>{k === "set" ? "Stock count" : MOVE[k]}</button>)}</div>
            <label className="f"><span>{move.kind === "set" ? "Counted in hand" : "Quantity"} ({move.item.unit})</span><input type="number" min={0} step="any" required autoFocus value={move.qty} onChange={(e) => setMove({ ...move, qty: e.target.value })} data-bulk="move-qty" /></label>
            <label className="f"><span>Note</span><input value={move.note} onChange={(e) => setMove({ ...move, note: e.target.value })} placeholder={move.kind === "in" ? "Invoice or order number" : move.kind === "out" ? "Ward or purpose" : ""} maxLength={120} /></label>
            <p className="fine">In hand now: {move.item.qty} {move.item.unit}.</p>
            {err && <p className="ax-form-err" role="alert">{err}</p>}
            <div className="row"><button type="submit" className="ax-btn teal" disabled={busy}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save</button><button type="button" className="ax-btn" onClick={() => setMove(null)}><X size={15} /> Cancel</button></div>
          </form>}
        </Dialog>
        <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit item" : "Add a stock item"} wide>
          {form && <form className="ax-form" onSubmit={save} data-bulk="stock-form">
            <label className="f wide"><span>Item</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nitrile gloves, medium" maxLength={100} data-bulk="stock-name" /></label>
            <label className="f"><span>Unit</span><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{(data?.units ?? ["pcs"]).map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
            {!form.id && <label className="f"><span>In hand now</span><input type="number" min={0} step="any" required value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} data-bulk="stock-qty" /></label>}
            <label className="f"><span>Reorder when at or below</span><input type="number" min={0} step="any" required value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} data-bulk="stock-level" /></label>
            <label className="f"><span>Order this much</span><input type="number" min={0} step="any" required value={form.reorderQty} onChange={(e) => setForm({ ...form, reorderQty: e.target.value })} data-bulk="stock-rq" /></label>
            <label className="f"><span>Location</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Central store, ICU" maxLength={60} /></label>
            <div className="f wide">{form.productId ? <p className="ax-pick-on">Buys: <b>{form.productName}</b> <button type="button" className="ax-link" onClick={() => setForm({ ...form, productId: "", variantId: null, productName: "" })}>Change</button></p>
              : <ProductPick label="Catalogue product to reorder (optional)" onPick={(p) => setForm({ ...form, productId: p.productId, variantId: p.variantId, productName: p.name })} />}</div>
            <p className="fine">We email you once when an item reaches its reorder level, and again only after it has been restocked above it.</p>
            {err && <p className="ax-form-err" role="alert">{err}</p>}
            <div className="row"><button type="submit" className="ax-btn teal" disabled={busy}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save</button><button type="button" className="ax-btn" onClick={() => setForm(null)}><X size={15} /> Cancel</button></div>
          </form>}
        </Dialog>
      </div>
    </div>
  );
}
