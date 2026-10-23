/**
 * OPD Queue: today's outpatients on this device, with token numbers, waiting and seen, priority,
 * quick vitals, a big-screen token board for the waiting area, and one tap into the Prescription
 * Writer or the Scribe for the patient who is in.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, FilePen, FolderHeart, Megaphone, Mic, Monitor, Plus, Printer, Star, UserX, Users, X } from "lucide-react";
import { addPatient, callNext, opdStats, readOpd, saveOpd, setStatus, waiting, type OpdDay, type OpdPatient, type OpdVitals } from "@/lib/cadus/clinic21";

const VITALS: { key: keyof OpdVitals; label: string; ph: string }[] = [
  { key: "bp", label: "BP", ph: "120/80" }, { key: "pulse", label: "Pulse", ph: "78" }, { key: "temp", label: "Temp °F", ph: "98.6" },
  { key: "spo2", label: "SpO₂ %", ph: "98" }, { key: "weight", label: "Weight kg", ph: "62" }, { key: "rbs", label: "RBS", ph: "110" },
];
const mins = (ms: number) => Math.max(0, Math.round(ms / 60000));

export default function OpdQueueView({ toast, onPrescribe, onScribe, onPrint, onRecord }: {
  toast: (t: string) => void;
  /** Opens the patient's record with today's visit started. */
  onRecord?: (p: { code: string; age: string; sex: string; complaint: string; vitals: OpdVitals }) => void;
  onPrescribe: (p: { age: string; sex: string; weight: string; complaint: string }) => void;
  onScribe: () => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [day, setDay] = useState<OpdDay>(() => readOpd());
  const [f, setF] = useState({ label: "", age: "", sex: "", complaint: "", priority: false });
  const [now, setNow] = useState(Date.now());
  const [board, setBoard] = useState(false);
  const [openId, setOpenId] = useState("");
  useEffect(() => saveOpd(day), [day]);
  useEffect(() => { const t = window.setInterval(() => { setNow(Date.now()); setDay((d) => (d.date === readOpd().date ? d : readOpd())); }, 30000); return () => window.clearInterval(t); }, []);
  // The board stays in step when the queue is changed in another tab or window.
  useEffect(() => { const on = (e: StorageEvent) => { if (e.key === "cadus3.opd") setDay(readOpd()); }; window.addEventListener("storage", on); return () => window.removeEventListener("storage", on); }, []);
  const st = useMemo(() => opdStats(day, now), [day, now]);
  const order = useMemo(() => waiting(day), [day]);

  const add = () => {
    if (!f.label.trim() && !f.complaint.trim()) { toast("Add initials or the complaint"); return; }
    const next = addPatient(day, f);
    setDay(next);
    toast(`Token ${next.patients.at(-1)!.token}`);
    setF({ label: "", age: "", sex: "", complaint: "", priority: false });
  };
  const setVitals = (p: OpdPatient, k: keyof OpdVitals, v: string) => setDay((d) => ({ ...d, patients: d.patients.map((x) => (x.id === p.id ? { ...x, vitals: { ...x.vitals, [k]: v.slice(0, 12) } } : x)) }));
  const call = () => {
    const next = callNext(day);
    setDay(next);
    const c = next.patients.find((p) => p.status === "in");
    if (c) { setOpenId(c.id); toast(`Calling token ${c.token}`); } else toast("No one is waiting");
  };
  const slip = (p: OpdPatient) => onPrint(`Token ${p.token}`, `# Token ${p.token}\n\n**${new Date(p.arrivedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${new Date(p.arrivedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}**${p.label ? `  \n${p.label}` : ""}\n\nPlease wait for your number to be called. ${order.findIndex((x) => x.id === p.id) >= 0 ? `About ${order.findIndex((x) => x.id === p.id) + 1} ahead of you.` : ""}`);

  if (board) {
    return (
      <div className="cx-opd-board" role="dialog" aria-label="Token board" data-opd="board">
        <button className="cx-ib cx-opd-board-x" onClick={() => setBoard(false)} aria-label="Close the board"><X size={22} /></button>
        <p>Now seeing</p>
        <b className="cx-opd-now">{st.current ? st.current.token : "–"}</b>
        <p>Next</p>
        <div className="cx-opd-next">{st.next.length ? st.next.map((p) => <span key={p.id}>{p.token}</span>) : <span>–</span>}</div>
        <small>{st.waiting} waiting{st.avgWait ? ` · about ${st.avgWait} min each` : ""}</small>
      </div>
    );
  }

  const row = (p: OpdPatient) => {
    const open = openId === p.id;
    return (
      <li key={p.id} className={`cx-opd-row s-${p.status} ${p.priority ? "prio" : ""}`} data-opd-token={p.token}>
        <button className="cx-opd-main" onClick={() => setOpenId(open ? "" : p.id)}>
          <span className="cx-opd-tok">{p.token}</span>
          <span className="cx-opd-who"><b>{[p.label, p.age && `${p.age}${p.sex}`].filter(Boolean).join(" · ") || "Patient"}</b><small>{p.complaint}</small></span>
          <span className="cx-opd-time">{p.status === "waiting" ? <><Clock size={12} /> {mins(now - p.arrivedAt)} min</> : p.status === "in" ? "With doctor" : p.status === "done" ? "Seen" : "Left"}</span>
          {p.priority && <Star size={14} className="cx-opd-star" />}
        </button>
        {open && (
          <div className="cx-opd-more">
            <div className="cx-opd-vitals">{VITALS.map((v) => <label key={v.key}><span>{v.label}</span><input className="cx-input" value={p.vitals[v.key]} onChange={(e) => setVitals(p, v.key, e.target.value)} placeholder={v.ph} inputMode="decimal" data-opd-vital={v.key} /></label>)}</div>
            <div className="cx-sc-acts">
              {p.status !== "in" && p.status !== "done" && <button className="cx-btn" onClick={() => setDay(setStatus(day, p.id, "in"))}><ArrowRight size={14} /> Call in</button>}
              {p.status === "in" && <button className="cx-btn" onClick={() => setDay(setStatus(day, p.id, "done"))} data-opd="done"><Check size={14} /> Seen</button>}
              <button className="cx-btn primary" onClick={() => onPrescribe({ age: p.age, sex: p.sex === "F" ? "female" : p.sex === "M" ? "male" : "", weight: p.vitals.weight, complaint: p.complaint })} data-opd="rx"><FilePen size={14} /> Prescription</button>
              {onRecord && <button className="cx-btn" onClick={() => onRecord({ code: p.label, age: p.age, sex: p.sex, complaint: p.complaint, vitals: p.vitals })} data-opd="record"><FolderHeart size={14} /> Record</button>}
              <button className="cx-btn" onClick={onScribe}><Mic size={14} /> Scribe</button>
              <button className="cx-btn" onClick={() => slip(p)}><Printer size={14} /> Token slip</button>
              {p.status === "waiting" && <button className="cx-btn" onClick={() => setDay((d) => ({ ...d, patients: d.patients.map((x) => (x.id === p.id ? { ...x, priority: !x.priority } : x)) }))}><Star size={14} /> {p.priority ? "Not priority" : "Priority"}</button>}
              {p.status === "waiting" && <button className="cx-ib" onClick={() => setDay(setStatus(day, p.id, "left"))} aria-label="Left without being seen"><UserX size={15} /></button>}
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="cx-page cx-lab cx-opd">
      <header className="cx-page-h"><div><h1>OPD Queue</h1><p>Today's outpatients with token numbers, kept on this device. Add patients as they arrive, call the next one, record vitals, and open the Prescription Writer or the Scribe for the patient who is in. Put the token board on a second screen for the waiting area.</p></div></header>
      <div className="cx-sim-stats cx-opd-stats" data-opd="stats">
        <div><b>{st.current ? st.current.token : "–"}</b><small>with the doctor</small></div>
        <div><b>{st.waiting}</b><small>waiting{st.longest ? ` · longest ${st.longest} min` : ""}</small></div>
        <div><b>{st.done}</b><small>seen{st.avgWait ? ` · average wait ${st.avgWait} min` : ""}</small></div>
      </div>
      <form className="cx-opd-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="cx-input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value.slice(0, 40) })} placeholder="Initials or OPD no. (no names)" aria-label="Initials" data-opd="label" />
        <input className="cx-input sm" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="Age" aria-label="Age" inputMode="decimal" data-opd="age" />
        <select className="cx-select sm" value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value })} aria-label="Sex" data-opd="sex"><option value="">Sex</option><option value="M">M</option><option value="F">F</option></select>
        <input className="cx-input" value={f.complaint} onChange={(e) => setF({ ...f, complaint: e.target.value.slice(0, 160) })} placeholder="Complaint, e.g. fever 3 days" aria-label="Complaint" data-opd="complaint" />
        <label className="cx-pa-mine"><input type="checkbox" checked={f.priority} onChange={(e) => setF({ ...f, priority: e.target.checked })} /> Priority</label>
        <button className="cx-btn primary" type="submit" data-opd="add"><Plus size={14} /> Add · token {day.patients.reduce((m, p) => Math.max(m, p.token), 0) + 1}</button>
      </form>
      <div className="cx-sc-acts">
        <button className="cx-btn primary" onClick={call} disabled={!st.waiting && !st.current} data-opd="next"><Megaphone size={14} /> Call next</button>
        <button className="cx-btn" onClick={() => setBoard(true)} data-opd="board-open"><Monitor size={14} /> Token board</button>
      </div>
      {day.patients.length ? (
        <>
          {(st.current || order.length > 0) && <ul className="cx-opd-list" data-opd="queue">{[...(st.current ? [st.current] : []), ...order].map(row)}</ul>}
          {day.patients.some((p) => p.status === "done" || p.status === "left") && (
            <details className="cx-opd-seen"><summary>Seen today ({day.patients.filter((p) => p.status === "done").length})</summary><ul className="cx-opd-list">{day.patients.filter((p) => p.status === "done" || p.status === "left").map(row)}</ul></details>
          )}
        </>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Users size={20} /></span><h3>No one yet today</h3><p>Add patients as they arrive. Tokens start again from 1 each day.</p></div>
      )}
    </section>
  );
}
