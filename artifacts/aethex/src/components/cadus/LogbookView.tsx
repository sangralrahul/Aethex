/**
 * PG Logbook: log procedures, surgeries, cases, duties and academic work in seconds, see
 * counts by item and role (observed, assisted, performed under supervision, independently),
 * and export a printable logbook with signature lines, or a CSV for Excel. On this device.
 */
import { useEffect, useMemo, useState } from "react";
import { BookCheck, Download, Plus, Printer, Search, Trash2 } from "lucide-react";
import { isoToday, KIND_LABEL, LOG_PRESETS, logCounts, logCsv, logMarkdown, readLog, rid, ROLE_LABEL, ROLE_SHORT, saveLog, type LogEntry, type LogKind, type LogRole } from "@/lib/cadus/records";

export default function LogbookView({ toast, onPrint, name, department }: {
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  name: string;
  department: string;
}) {
  const [log, setLog] = useState<LogEntry[]>(readLog);
  const [kind, setKind] = useState<LogKind>("procedure");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<LogRole>("supervised");
  const [date, setDate] = useState(isoToday);
  const [dept, setDept] = useState(department);
  const [supervisor, setSupervisor] = useState("");
  const [notes, setNotes] = useState("");
  const [view, setView] = useState<"summary" | "entries">("summary");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => saveLog(log), [log]);
  const counts = useMemo(() => logCounts(log), [log]);
  const shown = log.filter((e) => (!q || `${e.title} ${e.notes} ${e.department}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);

  const add = () => {
    const t = title.trim();
    if (!t) { toast("Choose or type what you did"); return; }
    setLog((l) => [{ id: rid(), date, kind, title: t, role, department: dept.trim(), supervisor: supervisor.trim(), notes: notes.trim(), at: Date.now() }, ...l]);
    setTitle(""); setNotes("");
    toast(`Logged: ${t}`);
  };
  const csv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([logCsv(log)], { type: "text/csv;charset=utf-8" }));
    a.download = `Cadus logbook ${isoToday()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <section className="cx-page cx-bs cx-log">
      <header className="cx-page-h"><div><h1>PG Logbook</h1><p>Log procedures, surgeries, cases, duties and academic work as you go. Counts by role, and a printable logbook for your department.</p></div></header>
      <div className="cx-log-add" data-log="add">
        <div className="cx-seg">{(Object.keys(KIND_LABEL) as LogKind[]).map((k) => <button key={k} className={kind === k ? "on" : ""} onClick={() => { setKind(k); setTitle(""); setRole(k === "duty" || k === "academic" ? "independent" : "supervised"); }} data-log-kind={k}>{KIND_LABEL[k]}</button>)}</div>
        <div className="cx-bs-chips">{LOG_PRESETS[kind].map((p) => <button key={p} className={title === p ? "on" : ""} onClick={() => setTitle(p)} data-log-preset={p}>{p}</button>)}</div>
        <div className="cx-log-grid">
          <label className="cx-field"><span>What</span><input className="cx-input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} placeholder="Or type it" data-log="title" /></label>
          <label className="cx-field"><span>Date</span><input className="cx-input" type="date" value={date} max={isoToday()} onChange={(e) => setDate(e.target.value)} data-log="date" /></label>
          {(kind === "procedure" || kind === "surgery") && <label className="cx-field"><span>Role</span><select className="cx-select" value={role} onChange={(e) => setRole(e.target.value as LogRole)} data-log="role">{(Object.keys(ROLE_LABEL) as LogRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></label>}
          <label className="cx-field"><span>Department</span><input className="cx-input" value={dept} onChange={(e) => setDept(e.target.value.slice(0, 80))} placeholder="e.g. General Medicine" /></label>
          <label className="cx-field"><span>Supervisor</span><input className="cx-input" value={supervisor} onChange={(e) => setSupervisor(e.target.value.slice(0, 80))} placeholder="e.g. Dr Rao" data-log="supervisor" /></label>
          <label className="cx-field wide"><span>Notes (no patient names)</span><input className="cx-input" value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 300))} placeholder="e.g. bed 12, CSF clear, first attempt" data-log="notes" /></label>
        </div>
        <button className="cx-btn primary" onClick={add} disabled={!title.trim()} data-log="go"><Plus size={15} /> Add to logbook</button>
      </div>

      <div className="cx-log-bar">
        <div className="cx-seg"><button className={view === "summary" ? "on" : ""} onClick={() => setView("summary")} data-log-view="summary">Summary</button><button className={view === "entries" ? "on" : ""} onClick={() => setView("entries")} data-log-view="entries">Entries ({log.length})</button></div>
        <span className="cx-log-total" data-log="total">{log.length} entr{log.length === 1 ? "y" : "ies"} · {counts.length} item{counts.length === 1 ? "" : "s"}</span>
      </div>
      {log.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><BookCheck size={20} /></span><h3>Your logbook is empty</h3><p>Add what you did today; it takes a few seconds.</p></div>
      ) : view === "summary" ? (
        <div className="cx-lab-table" data-log="summary"><table><thead><tr><th>Item</th><th>Type</th><th title="Observed">O</th><th title="Assisted">A</th><th title="Performed under supervision">PS</th><th title="Performed independently">PI</th><th>Total</th><th>Last</th></tr></thead><tbody>
          {counts.map((c) => <tr key={c.kind + c.title}><td><b>{c.title}</b></td><td>{KIND_LABEL[c.kind]}</td><td>{c.byRole.observed || ""}</td><td>{c.byRole.assisted || ""}</td><td>{c.byRole.supervised || ""}</td><td>{c.byRole.independent || ""}</td><td><b>{c.total}</b></td><td>{c.last}</td></tr>)}
        </tbody></table></div>
      ) : (
        <>
          <label className="cx-log-q"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries" aria-label="Search entries" /></label>
          <ul className="cx-log-list" data-log="entries">{shown.slice(0, 200).map((e) => <li key={e.id}><span className="cx-log-d">{e.date}</span><b>{e.title}</b><em>{e.kind === "procedure" || e.kind === "surgery" ? ROLE_SHORT[e.role] : KIND_LABEL[e.kind]}</em><small>{[e.department, e.supervisor, e.notes].filter(Boolean).join(" · ")}</small><button className="cx-ib" onClick={() => setLog((l) => l.filter((x) => x.id !== e.id))} aria-label={`Delete ${e.title}`}><Trash2 size={14} /></button></li>)}</ul>
        </>
      )}
      {log.length > 0 && (
        <div className="cx-log-export">
          <label className="cx-field"><span>From</span><input className="cx-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="cx-field"><span>To</span><input className="cx-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button className="cx-btn" onClick={() => onPrint("Logbook", logMarkdown(log, name, from, to))} data-log="print"><Printer size={14} /> Print logbook</button>
          <button className="cx-btn" onClick={csv} data-log="csv"><Download size={14} /> Excel (CSV)</button>
        </div>
      )}
      <p className="cx-rs-foot">Kept on this device; included in Settings › Data › Export. Use bed numbers or initials, never patient names.</p>
    </section>
  );
}
