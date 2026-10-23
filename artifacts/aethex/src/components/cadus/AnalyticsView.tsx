/**
 * Clinic Analytics: patients per day, waiting times, the busiest hours, common complaints,
 * diagnoses and medicines, and who your patients are, from the OPD queue history and prescriptions
 * on this device. Nothing leaves the device.
 */
import { useMemo, useState } from "react";
import { BarChart3, Clock, Download, Users } from "lucide-react";
import { readPrescriptions } from "@/lib/cadus/formulary";
import { localDate, readOpd } from "@/lib/cadus/clinic21";
import { clinicAnalytics, readOpdHistory, type OpdArchived } from "@/lib/cadus/clinic22";

const RANGES = [{ id: 7, label: "7 days" }, { id: 30, label: "30 days" }, { id: 90, label: "90 days" }, { id: 365, label: "Year" }];
function Bars({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="cx-an-bars" role="img" aria-label={label}>
      {data.map((d, i) => <div key={i} className="cx-an-bar" title={`${d.label}: ${d.value}`}><i style={{ height: `${(d.value / max) * 100}%` }} /><small>{d.label}</small></div>)}
    </div>
  );
}
function List({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="cx-an-card"><h3>{title}</h3>{rows.length ? <ul className="cx-an-list">{rows.map((r) => <li key={r.label}><span>{r.label}</span><i style={{ width: `${(r.count / max) * 100}%` }} /><b>{r.count}</b></li>)}</ul> : <p className="cx-set-hint">Nothing yet</p>}</div>
  );
}

export default function AnalyticsView() {
  const [range, setRange] = useState(30);
  const a = useMemo(() => {
    const today = readOpd();
    const days: OpdArchived[] = [...readOpdHistory().filter((d) => d.date !== today.date), ...(today.patients.length ? [{ date: today.date, patients: today.patients.map((p) => ({ token: p.token, age: p.age, sex: p.sex, complaint: p.complaint, status: p.status, arrivedAt: p.arrivedAt, calledAt: p.calledAt, doneAt: p.doneAt })) }] : [])];
    const to = localDate();
    const from = localDate(new Date(Date.now() - (range - 1) * 86400000));
    return clinicAnalytics(days, readPrescriptions(), from, to);
  }, [range]);
  const csv = () => {
    const rows = ["Date,Patients,Average wait (min)", ...a.days.map((d) => `${d.date},${d.patients},${d.avgWait ?? ""}`)];
    const el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" })); el.download = `clinic-${range}-days.csv`; document.body.appendChild(el); el.click(); el.remove();
  };
  const empty = !a.total && !a.prescriptions;
  return (
    <section className="cx-page cx-lab cx-an">
      <header className="cx-page-h"><div><h1>Clinic Analytics</h1><p>How your clinic is running, from the OPD queue and your prescriptions on this device: patients per day, waiting times, the busiest hours, and the complaints, diagnoses and medicines you see most.</p></div></header>
      <div className="cx-seg" data-an="range">{RANGES.map((r) => <button key={r.id} className={range === r.id ? "on" : ""} onClick={() => setRange(r.id)}>{r.label}</button>)}</div>
      {empty ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><BarChart3 size={20} /></span><h3>Nothing to show yet</h3><p>Use the OPD Queue for your clinic and the Prescription Writer or prescriber; the numbers build up day by day.</p></div>
      ) : (
        <>
          <div className="cx-sim-stats cx-an-stats" data-an="stats">
            <div><b><Users size={15} /> {a.total}</b><small>patients · {a.avgPerDay} a day</small></div>
            <div><b><Clock size={15} /> {a.avgWait ?? "–"}{a.avgWait !== null ? " min" : ""}</b><small>average wait{a.leftUnseen ? ` · ${a.leftUnseen} left unseen` : ""}</small></div>
            <div><b>{a.prescriptions}</b><small>prescriptions</small></div>
          </div>
          {a.days.length > 0 && <div className="cx-an-card wide"><h3>Patients per day</h3><Bars label="Patients per day" data={a.days.slice(-31).map((d) => ({ label: d.date.slice(8), value: d.patients }))} /></div>}
          {a.total > 0 && <div className="cx-an-card wide"><h3>When patients arrive</h3><Bars label="Arrivals by hour" data={a.hours.map((v, h) => ({ label: String(h), value: v })).slice(7, 22)} /></div>}
          <div className="cx-an-grid">
            <List title="Common complaints" rows={a.complaints} />
            <List title="Common diagnoses" rows={a.diagnoses} />
            <List title="Most prescribed" rows={a.medicines} />
            <div className="cx-an-card"><h3>Patients</h3><ul className="cx-an-list">{a.ages.map((r) => <li key={r.label}><span>{r.label} y</span><i style={{ width: `${(r.count / Math.max(1, ...a.ages.map((x) => x.count))) * 100}%` }} /><b>{r.count}</b></li>)}</ul><p className="cx-set-hint">{a.sex.M} male · {a.sex.F} female{a.sex.other ? ` · ${a.sex.other} not recorded` : ""}</p></div>
          </div>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={csv} disabled={!a.days.length} data-an="csv"><Download size={14} /> Daily numbers (CSV)</button></div>
        </>
      )}
    </section>
  );
}
