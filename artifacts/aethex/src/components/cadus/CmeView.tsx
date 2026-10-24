/**
 * CME Credits: every CME, conference, workshop and online course with its credit hours and
 * certificate number, progress against the target for the renewal period your council sets,
 * and a CSV and printout for registration renewal. Kept on this device.
 */
import { useMemo, useState } from "react";
import { Award, Download, Plus, Printer, Trash2 } from "lucide-react";
import { cmeCsv, cmeProgress, fmtDate, newCme, readCme, saveCme, type CmeEntry, type CmeState } from "@/lib/cadus/clinic24";

const KINDS: [CmeEntry["kind"], string][] = [["cme", "CME"], ["conference", "Conference"], ["workshop", "Workshop"], ["online", "Online course"], ["other", "Other"]];

export default function CmeView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [s, setS] = useState<CmeState>(readCme);
  const [f, setF] = useState<CmeEntry>(() => newCme());
  const put = (n: CmeState) => { setS(n); saveCme(n); };
  const pr = useMemo(() => cmeProgress(s), [s]);
  const entries = [...s.entries].sort((a, b) => b.date.localeCompare(a.date));
  const csv = () => { const url = URL.createObjectURL(new Blob([cmeCsv(s)], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "cme-credits.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); };
  const md = () => [`# CME credits${s.council ? `: ${s.council}` : ""}`, `${s.periodStart ? fmtDate(new Date(`${s.periodStart}T00:00:00`)) : "Start"} to ${s.periodEnd ? fmtDate(new Date(`${s.periodEnd}T00:00:00`)) : "now"} · **${pr.earned} of ${s.target} credit hours**`, "", "| Date | Programme | Organiser | Type | Hours | Certificate |", "|---|---|---|---|---|---|", ...[...s.entries].sort((a, b) => a.date.localeCompare(b.date)).map((e) => `| ${fmtDate(new Date(`${e.date}T00:00:00`))} | ${e.title} | ${e.organiser} | ${e.kind} | ${e.hours} | ${e.cert} |`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-cme">
      <header className="cx-page-h"><div><h1>CME Credits</h1><p>Keep every CME, conference and workshop with its credit hours and certificate, and see how far you are from the hours your State Medical Council asks for before renewal.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Council</span><input className="cx-input" value={s.council} onChange={(e) => put({ ...s, council: e.target.value.slice(0, 80) })} placeholder="e.g. Karnataka Medical Council" data-cme="council" /></label>
        <label className="cx-field"><span>Credit hours needed</span><input className="cx-input" inputMode="numeric" value={s.target || ""} onChange={(e) => put({ ...s, target: Number(e.target.value.replace(/\D/g, "")) || 0 })} placeholder="30" data-cme="target" /></label>
        <label className="cx-field"><span>Period from</span><input className="cx-input" type="date" value={s.periodStart} onChange={(e) => put({ ...s, periodStart: e.target.value })} data-cme="from" /></label>
        <label className="cx-field"><span>Renewal due</span><input className="cx-input" type="date" value={s.periodEnd} onChange={(e) => put({ ...s, periodEnd: e.target.value })} data-cme="to" /></label>
      </div>
      <div className="cx-cme-bar" role="progressbar" aria-valuenow={pr.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Credit hours earned"><i style={{ width: `${pr.pct}%` }} /></div>
      <div className="cx-sim-stats" data-cme="progress">
        <div><b data-cme="earned">{pr.earned}</b><small>of {s.target} hours</small></div>
        <div><b>{pr.left}</b><small>hours still needed</small></div>
        <div><b>{pr.daysLeft !== undefined ? (pr.daysLeft > 0 ? `${pr.daysLeft} days` : "Due") : "–"}</b><small>{pr.perMonth ? `about ${pr.perMonth} hours a month` : "to renewal"}</small></div>
      </div>
      <form className="cx-rec-visit" onSubmit={(e) => { e.preventDefault(); if (!f.title.trim() || !(f.hours > 0)) return; put({ ...s, entries: [f, ...s.entries] }); setF(newCme({ kind: f.kind })); }}>
        <div className="cx-c23-row">
          <label className="cx-field"><span>Date</span><input className="cx-input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="cx-field"><span>Programme</span><input className="cx-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value.slice(0, 160) })} placeholder="e.g. Update in diabetes care" data-cme="title" /></label>
          <label className="cx-field"><span>Organiser</span><input className="cx-input" value={f.organiser} onChange={(e) => setF({ ...f, organiser: e.target.value.slice(0, 120) })} placeholder="e.g. IMA, API chapter" /></label>
        </div>
        <div className="cx-c23-row">
          <label className="cx-field"><span>Type</span><select className="cx-select" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as CmeEntry["kind"] })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="cx-field"><span>Credit hours</span><input className="cx-input" inputMode="decimal" value={f.hours || ""} onChange={(e) => setF({ ...f, hours: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} placeholder="2" data-cme="hours" /></label>
          <label className="cx-field"><span>Certificate no.</span><input className="cx-input" value={f.cert} onChange={(e) => setF({ ...f, cert: e.target.value.slice(0, 60) })} placeholder="Optional" /></label>
        </div>
        <div className="cx-sc-acts"><button className="cx-btn primary" type="submit" data-cme="add"><Plus size={14} /> Add</button>{s.entries.length > 0 && <><button type="button" className="cx-btn" onClick={() => onPrint("CME credits", md())} data-cme="print"><Printer size={14} /> Print summary</button><button type="button" className="cx-btn" onClick={csv}><Download size={14} /> CSV</button></>}</div>
      </form>
      {entries.length > 0 ? (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-cme="list"><thead><tr><th>Date</th><th>Programme</th><th>Type</th><th>Hours</th><th /></tr></thead>
          <tbody>{entries.map((e) => <tr key={e.id}><td>{fmtDate(new Date(`${e.date}T00:00:00`))}</td><td><b>{e.title}</b>{(e.organiser || e.cert) && <small>{[e.organiser, e.cert].filter(Boolean).join(" · ")}</small>}</td><td>{e.kind}</td><td>{e.hours}</td><td><button className="cx-ib" onClick={() => put({ ...s, entries: s.entries.filter((x) => x.id !== e.id) })} aria-label={`Remove ${e.title}`}><Trash2 size={13} /></button></td></tr>)}</tbody></table></div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Award size={20} /></span><h3>No CME yet</h3><p>Add each programme as you attend it, with the credit hours on the certificate.</p></div>}
      <p className="cx-rs-foot"><Award size={13} /> Credit rules differ by State Medical Council: set the hours and renewal date your council asks for. Keep the original certificates.</p>
    </section>
  );
}
