/**
 * Patient Records: a simple patient file on this device, by clinic number or initials (no names):
 * allergies, problems, long-term medicines and every visit with vitals, diagnosis, notes and the
 * prescription; vitals charted over time; a summary before the next visit; print, backup and restore.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Download, FilePen, FolderHeart, Loader2, Plus, Printer, Search, Sparkles, Trash2, Upload } from "lucide-react";
import DictateBox from "./DictateBox";
import { deidentify } from "@/lib/cadus/deidentify";
import { prescriptionMarkdown, readPrescriptions } from "@/lib/cadus/formulary";
import {
  ageOf, newRecord, newVisit, readRecords, recordLabel, recordMarkdown, recordsBackup, recordText, restoreRecords, saveRecords, searchRecords, vitalSeries,
  type PatientRecord, type Visit, type VisitVitals,
} from "@/lib/cadus/clinic22";

export interface RecordIncoming { code: string; age: string; sex: string; complaint: string; vitals: Partial<VisitVitals>; key: number }
interface Summary { oneLine: string; problems: { problem: string; status: string; note: string }[]; lastPlan: string; medicines: string[]; today: string[]; overdue: string[] }
const VITALS: { key: keyof VisitVitals; label: string }[] = [{ key: "bp", label: "BP" }, { key: "pulse", label: "Pulse" }, { key: "temp", label: "Temp" }, { key: "spo2", label: "SpO₂" }, { key: "weight", label: "Weight" }, { key: "rbs", label: "Sugar" }];

function Spark({ pts }: { pts: { at: number; value: number }[] }) {
  if (pts.length < 2) return null;
  const vs = pts.map((p) => p.value), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const d = pts.map((p, i) => `${(i / (pts.length - 1)) * 96 + 2},${30 - ((p.value - lo) / span) * 26}`).join(" ");
  return <svg viewBox="0 0 100 32" className="cx-rec-spark" aria-hidden><polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}

export default function RecordsView({ generate, friendlyError, toast, onPrint, onPrescribe, incoming }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onPrescribe: (p: { age: string; sex: string; weight: string; diagnosis: string }) => void;
  /** From the OPD queue: the patient who is in, to add a visit to their record. */
  incoming?: RecordIncoming;
}) {
  const [list, setList] = useState<PatientRecord[]>(readRecords);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState("");
  const [visit, setVisit] = useState<Visit | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => saveRecords(list), [list]);
  const rec = list.find((r) => r.id === openId) ?? null;
  const found = useMemo(() => searchRecords(list, q), [list, q]);
  const update = (id: string, f: Partial<PatientRecord>) => setList((l) => l.map((r) => (r.id === id ? { ...r, ...f, updatedAt: Date.now() } : r)));

  // A patient from the OPD queue: their record (by clinic number or initials), with a new visit started.
  useEffect(() => {
    if (!incoming?.key) return;
    const code = incoming.code.trim();
    let r = code ? list.find((x) => x.code.trim().toLowerCase() === code.toLowerCase()) : undefined;
    if (!r) {
      r = newRecord({ code: code || `OPD ${new Date().toLocaleDateString("en-IN")}`, sex: incoming.sex === "M" || incoming.sex === "F" ? incoming.sex : "", yob: incoming.age ? String(new Date().getFullYear() - Math.round(Number(incoming.age))) : "" });
      setList((l) => [r!, ...l]);
    }
    setOpenId(r.id);
    setSummary(null);
    setVisit(newVisit({ complaint: incoming.complaint, vitals: { bp: "", pulse: "", temp: "", spo2: "", weight: "", rbs: "", ...incoming.vitals } }));
  }, [incoming?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveVisit = () => {
    if (!rec || !visit) return;
    update(rec.id, { visits: [visit, ...rec.visits.filter((v) => v.id !== visit.id)] });
    setVisit(null);
    toast("Visit saved");
  };
  const summarise = async () => {
    if (!rec) return;
    setBusy(true);
    try {
      const r = await generate({ action: "record-summary", record: deidentify(recordText(rec)).text });
      if (!r?.result) throw new Error("No summary came back");
      setSummary(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const backup = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([recordsBackup(list)], { type: "application/json" })); a.download = `cadus-patient-records-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); toast("Backup saved. Keep it somewhere safe: it holds patient information."); };
  const restore = async (f: File | undefined) => {
    if (!f) return;
    try { const r = restoreRecords(await f.text(), list); setList(r.records); toast(`${r.added} record${r.added === 1 ? "" : "s"} added`); } catch { toast("That isn't a Cadus records backup"); }
    if (fileRef.current) fileRef.current.value = "";
  };

  if (rec) {
    const visits = [...rec.visits].sort((a, b) => b.at - a.at);
    const latestRx = readPrescriptions()[0];
    return (
      <section className="cx-page cx-lab cx-rec">
        <button className="cx-back" onClick={() => { setOpenId(""); setVisit(null); setSummary(null); }}><ArrowLeft size={15} /> All records</button>
        <header className="cx-page-h"><div><h1>{recordLabel(rec)}</h1><p>{rec.visits.length} visit{rec.visits.length === 1 ? "" : "s"} · since {new Date(rec.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p></div></header>
        <div className="cx-mr-pt">
          <label className="cx-field"><span>Clinic no. or initials</span><input className="cx-input" value={rec.code} onChange={(e) => update(rec.id, { code: e.target.value.slice(0, 40) })} data-rec="code" /></label>
          <label className="cx-field"><span>Year of birth</span><input className="cx-input" inputMode="numeric" value={rec.yob} onChange={(e) => update(rec.id, { yob: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="e.g. 1968" /></label>
          <label className="cx-field"><span>Sex</span><select className="cx-select" value={rec.sex} onChange={(e) => update(rec.id, { sex: e.target.value as PatientRecord["sex"] })}><option value="">—</option><option value="M">Male</option><option value="F">Female</option></select></label>
          <label className="cx-field"><span><AlertTriangle size={12} /> Allergies</span><input className="cx-input" value={rec.allergies} onChange={(e) => update(rec.id, { allergies: e.target.value.slice(0, 300) })} placeholder="None known" data-rec="allergies" /></label>
        </div>
        <div className="cx-roster-in">
          <label className="cx-field"><span>Problems</span><textarea className="cx-input" rows={3} value={rec.problems} onChange={(e) => update(rec.id, { problems: e.target.value.slice(0, 2000) })} placeholder="e.g. T2DM since 2015; hypertension" data-rec="problems" /></label>
          <label className="cx-field"><span>Long-term medicines</span><textarea className="cx-input" rows={3} value={rec.meds} onChange={(e) => update(rec.id, { meds: e.target.value.slice(0, 2000) })} placeholder="e.g. Metformin 500 BD; Telmisartan 40 OD" /></label>
        </div>
        <div className="cx-rec-vitals">{VITALS.map((v) => { const s = vitalSeries(rec, v.key); return s.length ? <div key={v.key}><small>{v.label}</small><b>{s.at(-1)!.value}</b><Spark pts={s} /></div> : null; })}</div>
        <div className="cx-sc-acts">
          <button className="cx-btn primary" onClick={() => { setVisit(newVisit()); setSummary(null); }} disabled={!!visit} data-rec="new-visit"><Plus size={14} /> New visit</button>
          <button className="cx-btn" onClick={() => void summarise()} disabled={busy || !rec.visits.length} data-rec="summary">{busy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} Before the visit</button>
          <button className="cx-btn" onClick={() => onPrescribe({ age: ageOf(rec), sex: rec.sex === "F" ? "female" : rec.sex === "M" ? "male" : "", weight: visits[0]?.vitals.weight ?? "", diagnosis: visits[0]?.diagnosis || rec.problems.split(/[;\n]/)[0] || "" })}><FilePen size={14} /> Prescription</button>
          <button className="cx-btn" onClick={() => onPrint(recordLabel(rec), recordMarkdown(rec))}><Printer size={14} /> Print</button>
          <button className="cx-ib" aria-label="Delete this record" onClick={() => { if (window.confirm("Delete this patient's record from this device?")) { setList((l) => l.filter((r) => r.id !== rec.id)); setOpenId(""); } }}><Trash2 size={15} /></button>
        </div>
        {summary && (
          <div className="cx-ltv-ex" data-rec="summary-out">
            <p className="cx-ltv-sum">{summary.oneLine}</p>
            {summary.problems.length > 0 && <ul className="cx-ltv-items">{summary.problems.map((p) => <li key={p.problem} className={`t-${p.status === "better" ? "better" : p.status === "worse" ? "worse" : "stable"}`}><span className="cx-ltv-tag">{p.status}</span><b>{p.problem}</b> {p.note}</li>)}</ul>}
            {summary.lastPlan && <p><b>Last plan:</b> {summary.lastPlan}</p>}
            <div className="cx-sim-cols">
              {summary.today.length > 0 && <div className="cx-sim-card"><h3>Today</h3><ul>{summary.today.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {summary.medicines.length > 0 && <div className="cx-sim-card warn"><h3>Medicines to reconsider</h3><ul>{summary.medicines.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {summary.overdue.length > 0 && <div className="cx-sim-card"><h3>Due</h3><ul>{summary.overdue.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            </div>
          </div>
        )}
        {visit && (
          <div className="cx-rec-visit" data-rec="visit">
            <h3 className="cx-lab-h3">Visit · {new Date(visit.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</h3>
            <label className="cx-field"><span>Complaint</span><input className="cx-input" value={visit.complaint} onChange={(e) => setVisit({ ...visit, complaint: e.target.value.slice(0, 200) })} data-rec="complaint" /></label>
            <div className="cx-opd-vitals">{VITALS.map((v) => <label key={v.key}><span>{v.label}</span><input className="cx-input" value={visit.vitals[v.key]} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, [v.key]: e.target.value.slice(0, 12) } })} data-rec-vital={v.key} /></label>)}</div>
            <label className="cx-field"><span>Diagnosis</span><input className="cx-input" value={visit.diagnosis} onChange={(e) => setVisit({ ...visit, diagnosis: e.target.value.slice(0, 200) })} data-rec="diagnosis" /></label>
            <div className="cx-field"><span>Notes</span><DictateBox value={visit.notes} onChange={(v) => setVisit({ ...visit, notes: v.slice(0, 4000) })} rows={3} toast={toast} label="Visit notes" placeholder="History, examination, advice" /></div>
            <label className="cx-field"><span>Prescription</span><textarea className="cx-input" rows={3} value={visit.rx} onChange={(e) => setVisit({ ...visit, rx: e.target.value.slice(0, 4000) })} placeholder="Type it, or attach the latest from the prescriber" data-rec="rx" /></label>
            {latestRx && <button className="cx-link" onClick={() => setVisit({ ...visit, rx: prescriptionMarkdown(latestRx, { title: false }) })} data-rec="attach-rx">Attach the latest prescription ({latestRx.diagnosis || latestRx.items.map((i) => i.name).join(", ").slice(0, 60)})</button>}
            <label className="cx-field"><span>Follow-up</span><input className="cx-input" value={visit.followUp} onChange={(e) => setVisit({ ...visit, followUp: e.target.value.slice(0, 120) })} placeholder="e.g. 2 weeks with FBS, PPBS" /></label>
            <div className="cx-sc-acts"><button className="cx-btn primary" onClick={saveVisit} data-rec="save-visit">Save visit</button><button className="cx-btn" onClick={() => setVisit(null)}>Cancel</button></div>
          </div>
        )}
        <ol className="cx-rec-visits" data-rec="visits">
          {visits.map((v) => (
            <li key={v.id}>
              <div className="cx-rec-vh"><b>{new Date(v.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</b> {v.complaint}{v.diagnosis && <span> · {v.diagnosis}</span>}<button className="cx-link" onClick={() => setVisit(v)}>Edit</button></div>
              {Object.values(v.vitals).some(Boolean) && <small>{VITALS.filter((x) => v.vitals[x.key]).map((x) => `${x.label} ${v.vitals[x.key]}`).join(" · ")}</small>}
              {v.notes && <p>{v.notes}</p>}
              {v.rx && <details><summary>Prescription</summary><pre>{v.rx}</pre></details>}
              {v.followUp && <small>Follow-up: {v.followUp}</small>}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="cx-page cx-lab cx-rec">
      <header className="cx-page-h"><div><h1>Patient Records</h1><p>A simple file for each patient you see again: allergies, problems, medicines and every visit, with vitals charted over time and a summary before the next visit. Kept on this device by clinic number or initials, never a name.</p></div></header>
      <div className="cx-ltv-bar">
        <label className="cx-search"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number, problem or medicine" aria-label="Search records" data-rec="search" /></label>
        <button className="cx-btn primary" onClick={() => { const r = newRecord(); setList((l) => [r, ...l]); setOpenId(r.id); setVisit(newVisit()); }} data-rec="new"><Plus size={14} /> New patient</button>
        <button className="cx-btn" onClick={backup} disabled={!list.length} data-rec="backup"><Download size={14} /> Backup</button>
        <input ref={fileRef} type="file" hidden accept="application/json,.json" onChange={(e) => void restore(e.target.files?.[0])} />
        <button className="cx-btn" onClick={() => fileRef.current?.click()}><Upload size={14} /> Restore</button>
      </div>
      {found.length ? (
        <div className="cx-lf-saved">{found.slice(0, 100).map((r) => {
          const last = [...r.visits].sort((a, b) => b.at - a.at)[0];
          return <button key={r.id} className="cx-sc-row" onClick={() => setOpenId(r.id)} data-rec-row={r.code}><b><FolderHeart size={13} /> {recordLabel(r)}</b><small>{[r.problems.split(/[;\n]/)[0], last && `last seen ${new Date(last.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, `${r.visits.length} visit${r.visits.length === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</small></button>;
        })}</div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><FolderHeart size={20} /></span><h3>{q ? "No match" : "No records yet"}</h3><p>Add a patient, or open the record from the OPD queue to save today's visit.</p></div>}
      <p className="cx-rs-foot"><AlertTriangle size={13} /> Records stay on this device and aren't synced. Back them up regularly; the backup file holds patient information, so keep it safe.</p>
    </section>
  );
}
