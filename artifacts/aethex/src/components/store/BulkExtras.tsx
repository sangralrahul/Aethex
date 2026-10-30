/**
 * Update 78: for hospitals and medical colleges, beside the bulk list.
 * - BudgetBox: a budget for the list, the estimate against it, the split by department, and what costs most when the
 *   list is over budget.
 * - SavedLists: save the list under a name, load a saved list (in place of the list or added to it), or send it for a
 *   quotation again in one click; when it was last sent.
 * Styles: src/shop.css (.ax-budget, .ax-saved).
 */
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Download, FolderOpen, Loader2, Save, Send, Trash2, Wallet } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";
import { bulk, usePricedBulk } from "@/lib/store/bulk";
import { loadedFrom, setBudget, useBudget, useSavedLists } from "@/lib/store/bulkExtras";
import type { Segment } from "@/lib/store/types";
import { SEGMENT_PAGES } from "@/config/institutions";
import { isBookId } from "@/lib/store/bookdata";
import { loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";

/** The list's estimate split by the portal's departments. */
export function useByDepartment(segment: Segment) {
  const { priced, store } = usePricedBulk();
  return useMemo(() => {
    const secs = SEGMENT_PAGES[segment].sections;
    const m = new Map<string, number>();
    for (const i of priced.items) {
      const cat = store?.byId.get(i.productId)?.category ?? "";
      const sec = secs.find((s) => s.categories.includes(cat));
      const k = sec?.short ?? (isBookId(i.productId) ? "Textbooks" : "Other");
      m.set(k, (m.get(k) ?? 0) + (i.unitPrice ?? 0) * i.qty);
    }
    return [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  }, [priced, store, segment]);
}

export function BudgetBox({ segment }: { segment: Segment }) {
  const budget = useBudget(segment);
  const { priced } = usePricedBulk();
  const parts = useByDepartment(segment);
  const [edit, setEdit] = useState(false), [v, setV] = useState("");
  const est = priced.estTotal;
  const pct = budget ? Math.min(100, Math.round((est / budget) * 100)) : 0;
  const over = budget > 0 && est > budget;
  const top = useMemo(() => [...priced.items].filter((i) => i.unitPrice).sort((a, b) => b.unitPrice! * b.qty - a.unitPrice! * a.qty).slice(0, 3), [priced]);
  const save = (e: FormEvent) => { e.preventDefault(); setBudget(segment, Number(v.replace(/[^\d]/g, ""))); setEdit(false); };
  return (
    <div className={`ax-budget${over ? " over" : ""}`} data-bulk="budget">
      <div className="h"><Wallet size={16} /> <b>Budget</b>{!edit && <button type="button" className="ax-link" onClick={() => { setV(budget ? String(budget) : ""); setEdit(true); }} data-bulk="set-budget">{budget ? "Change" : "Set a budget"}</button>}</div>
      {edit ? (
        <form onSubmit={save} className="f">
          <span>₹</span><input autoFocus inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. 500000" aria-label="Budget in rupees" />
          <button type="submit" className="ax-btn teal">Save</button>
          {budget > 0 && <button type="button" className="ax-link" onClick={() => { setBudget(segment, 0); setEdit(false); }}>Remove</button>}
        </form>
      ) : budget > 0 ? (
        <>
          <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={est} aria-label="Estimate against budget"><i style={{ width: `${pct}%` }} /></div>
          <p className="fig" data-bulk="budget-state">{over ? <><AlertTriangle size={14} /> <b>{formatINR(est - budget)} over</b> your {formatINR(budget)} budget</> : <><CheckCircle2 size={14} /> <b>{formatINR(budget - est)} left</b> of {formatINR(budget)}</>}</p>
          {over && top.length > 0 && <p className="tip">Costs most: {top.map((i) => `${i.name} (${formatINR(i.unitPrice! * i.qty)})`).join(", ")}. Lower their quantities, or ask for a quotation: prices for these quantities are often lower.</p>}
        </>
      ) : <p className="fig mu">Set a budget to see how the list compares.</p>}
      {parts.length > 1 && (
        <ul className="split" aria-label="Estimate by department">
          {parts.map(([k, val]) => <li key={k}><span>{k}</span><i style={{ width: `${Math.max(4, Math.round((val / (est || 1)) * 100))}%` }} /><em>{formatINR(val)}</em></li>)}
        </ul>
      )}
      <p className="fine">Store prices, including GST{priced.unpriced ? `; ${priced.unpriced} item${priced.unpriced === 1 ? "" : "s"} priced on request aren't counted` : ""}. Delivery is quoted for your address.</p>
    </div>
  );
}

export function SavedLists({ segment, onQuote }: { segment: Segment; onQuote: () => void }) {
  const { isLoggedIn } = useUserAuth();
  const { toast } = useToast();
  const { lines } = usePricedBulk();
  const { lists, where, save, remove } = useSavedLists(isLoggedIn);
  const [naming, setNaming] = useState(false), [name, setName] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const mine = (lists ?? []).filter((l) => l.segment === segment);
  const doSave = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const id = await save(name, segment, lines); loadedFrom.set(id); setNaming(false); setName(""); toast({ title: "List saved", description: where === "account" ? "It's in your account." : "It's kept in this browser." }); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const load = (id: string, mode: "replace" | "add") => {
    const l = mine.find((x) => x.id === id);
    if (!l) return;
    if (mode === "replace") bulk.clear();
    const r = bulk.addMany(l.lines);
    loadedFrom.set(l.id);
    toast({ title: `${l.name}: ${r.added} item${r.added === 1 ? "" : "s"} ${mode === "replace" ? "in your list" : "added"}`, description: r.full ? "Your list was full, so some were left out." : "Change any quantities, then send it." });
    return r;
  };
  return (
    <section className="ax-saved" id="saved-lists" data-bulk="saved">
      <div className="h"><h2><FolderOpen size={18} /> Saved lists</h2><small>{where === "account" ? "In your account" : <>In this browser · <a href={loginUrl("/", { next: `${SEGMENT_PAGES[segment].path}#saved-lists` })}>sign in</a> to keep them in your account</>}</small></div>
      {lines.length > 0 && (naming ? (
        <form className="ax-saved-new" onSubmit={doSave}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={segment === "hospital" ? "e.g. Monthly ICU consumables" : "e.g. First-year skills lab"} maxLength={80} aria-label="Name of the list" />
          <button type="submit" className="ax-btn teal" disabled={busy}>{busy ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save</button>
          <button type="button" className="ax-link" onClick={() => setNaming(false)}>Cancel</button>
          {err && <p className="ax-form-err">{err}</p>}
        </form>
      ) : <button type="button" className="ax-btn" onClick={() => setNaming(true)} data-bulk="save-list"><Save size={15} /> Save this list ({lines.length} items)</button>)}
      {lists === null ? <p className="mu"><Loader2 size={15} className="spin" /> Loading…</p>
        : mine.length ? (
          <ul>{mine.map((l) => (
            <li key={l.id} data-list={l.id}>
              <div><b>{l.name}</b><small>{l.lines.length} item{l.lines.length === 1 ? "" : "s"} · {l.lines.reduce((s, x) => s + x.qty, 0).toLocaleString("en-IN")} units · {l.sentAt ? `last sent ${new Date(l.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "not sent yet"}</small></div>
              <div className="acts">
                <button type="button" className="ax-btn teal" onClick={() => { load(l.id, "replace"); onQuote(); }} data-bulk="send-again"><Send size={14} /> Send again</button>
                <button type="button" className="ax-btn" onClick={() => load(l.id, "replace")} data-bulk="load">Load</button>
                {lines.length > 0 && <button type="button" className="ax-link" onClick={() => load(l.id, "add")}>Add to list</button>}
                <button type="button" className="ax-icon-btn" onClick={() => { if (window.confirm(`Delete the saved list "${l.name}"?`)) void remove(l.id); }} aria-label={`Delete ${l.name}`}><Trash2 size={15} /></button>
              </div>
            </li>
          ))}</ul>
        ) : <p className="mu">Save a list you order again and again, like monthly consumables, then send it again in one click.</p>}
    </section>
  );
}

/** "Download estimate (PDF)" for the list now, or a sent request. */
export function EstimateLink({ segment, request, className = "ax-btn" }: { segment: Segment; request?: string; className?: string }) {
  return <Link href={request ? `/bulk-estimate?request=${encodeURIComponent(request)}` : `/bulk-estimate?segment=${segment}`} className={className} data-bulk="estimate"><Download size={15} /> {request ? "Download PDF" : "Download estimate (PDF)"}</Link>;
}
