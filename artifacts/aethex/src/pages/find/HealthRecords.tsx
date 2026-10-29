/**
 * /records: health records kept on this device only (IndexedDB): reports, prescriptions, scans and bills,
 * by family member. Nothing is uploaded. Prescriptions written on Aethex are listed from the account.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Download, FileHeart, FileText, Lock, Trash2, Upload } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { dateLabel, displayName, useMyAppointments } from "@/lib/find";
import { FindNav } from "./FindParts";

type Rec = { id: string; name: string; type: string; kind: string; person: string; date: string; note: string; size: number; data: Blob; at: number };
const KINDS = ["Lab report", "Prescription", "Scan or X-ray", "Discharge summary", "Vaccination", "Bill", "Other"];
const DB = "aethex-records", STORE = "records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: "id" }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((res, rej) => { const q = fn(db.transaction(STORE, mode).objectStore(STORE)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function HealthRecords() {
  useSeo({ title: "Health records | Aethex Doctors", description: "Keep your family's medical reports and prescriptions on your device.", path: "/records" });
  const [recs, setRecs] = useState<Rec[]>([]), [err, setErr] = useState(""), [person, setPerson] = useState("All");
  const [f, setF] = useState({ kind: "Lab report", person: "Me", date: new Date().toISOString().slice(0, 10), note: "" });
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false);
  const { data: mine } = useMyAppointments();
  const load = async () => { try { setRecs((await tx<Rec[]>("readonly", (s) => s.getAll() as IDBRequest<Rec[]>)).sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at)); } catch { setErr("This browser can't store records (private mode?)."); } };
  useEffect(() => { void load(); }, []);
  const people = useMemo(() => ["All", ...Array.from(new Set(recs.map((r) => r.person)))], [recs]);
  const shown = recs.filter((r) => person === "All" || r.person === person);
  const rx = (mine?.appointments ?? []).filter((a) => a.prescription);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) { setErr("Choose a file."); return; }
    if (file.size > 15 * 1048576) { setErr("Files up to 15 MB."); return; }
    setBusy(true); setErr("");
    try {
      const rec: Rec = { id: crypto.randomUUID(), name: file.name, type: file.type || "application/octet-stream", kind: f.kind, person: f.person.trim() || "Me", date: f.date, note: f.note.trim().slice(0, 200), size: file.size, data: file, at: Date.now() };
      await tx("readwrite", (s) => s.put(rec));
      setFile(null); setF({ ...f, note: "" });
      const el = document.getElementById("fd-rec-file") as HTMLInputElement | null;
      if (el) el.value = "";
      await load();
    } catch { setErr("Couldn't save the file on this device."); } finally { setBusy(false); }
  };
  const open = (r: Rec) => { const u = URL.createObjectURL(r.data); window.open(u, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  const save = (r: Rec) => { const u = URL.createObjectURL(r.data); const a = document.createElement("a"); a.href = u; a.download = r.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  const remove = async (r: Rec) => { if (!window.confirm(`Delete ${r.name} from this device?`)) return; await tx("readwrite", (s) => s.delete(r.id)); await load(); };

  return (
    <div className="fd-page" data-find="records">
      <FindNav />
      <div className="ax-wrap fd-narrow wide">
        <header className="fd-pagehead"><h1><FileHeart size={26} /> Health records</h1><p><Lock size={14} /> Kept on this device only: nothing is uploaded. Back up important files elsewhere too.</p></header>
        <form className="fd-box fd-pform fd-recform" onSubmit={add} data-find="record-form">
          <div className="three">
            <label>File<input id="fd-rec-file" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            <label>Type<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label>For<input value={f.person} onChange={(e) => setF({ ...f, person: e.target.value })} placeholder="Me, Mother, Son…" /></label>
          </div>
          <div className="two">
            <label>Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
            <label>Note (optional)<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. HbA1c, Dr Verma" /></label>
          </div>
          {err && <p className="fd-err">{err}</p>}
          <div className="fd-pform-foot"><span className="tiny">Images or PDFs, up to 15 MB.</span><button type="submit" className="fd-btn" disabled={busy}><Upload size={16} /> {busy ? "Saving…" : "Add record"}</button></div>
        </form>
        {rx.length > 0 && <>
          <h2 className="fd-h2">Prescriptions from Aethex doctors</h2>
          <div className="fd-recs">{rx.map((a) => <Link key={a.id} href={`/prescription/${a.prescription}`} className="fd-rec"><FileText size={22} /><span><b>Prescription · {a.doctor ? displayName(a.doctor.name) : ""}</b><small>{dateLabel(a.date, { day: "numeric", month: "short", year: "numeric" })}</small></span></Link>)}</div>
        </>}
        <div className="fd-askbar"><h2 className="fd-h2">On this device</h2><div className="fd-tabs">{people.map((p) => <button key={p} type="button" className={person === p ? "on" : ""} onClick={() => setPerson(p)}>{p}</button>)}</div></div>
        {!shown.length ? <p className="fd-none">No records yet. Add reports, prescriptions and scans to keep them in one place.</p>
          : <div className="fd-recs">{shown.map((r) => (
            <div key={r.id} className="fd-rec" data-record={r.id}>
              <FileText size={22} />
              <span><b>{r.kind} · {r.person}</b><small>{dateLabel(r.date, { day: "numeric", month: "short", year: "numeric" })} · {r.name} · {kb(r.size)}</small>{r.note && <small>{r.note}</small>}</span>
              <span className="acts"><button type="button" className="fd-btn sm ghost" onClick={() => open(r)}>Open</button><button type="button" className="fd-icon" onClick={() => save(r)} aria-label="Download"><Download size={15} /></button><button type="button" className="fd-icon" onClick={() => void remove(r)} aria-label="Delete"><Trash2 size={15} /></button></span>
            </div>
          ))}</div>}
      </div>
    </div>
  );
}
