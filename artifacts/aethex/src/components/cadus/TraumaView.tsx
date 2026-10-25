/**
 * Trauma Primary Survey: a running clock with the <C>ABCDE steps time-stamped, shock class, the ABC
 * score for massive transfusion, GCS, tranexamic acid timing and resuscitation targets.
 */
import { useEffect, useState } from "react";
import { ClipboardCopy, RotateCcw, Timer, TriangleAlert } from "lucide-react";
import { abcScore, gcs, shockClass, TRAUMA_STEPS, TRAUMA_TARGETS, txaAdvice } from "@/lib/cadus/clinic34";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function TraumaView() {
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState<Record<string, number>>({});
  const [v, setV] = useState({ hr: "", sbp: "", hours: "" });
  const [abc, setAbc] = useState({ penetrating: false, sbp90: false, hr120: false, fastPos: false });
  const [g, setG] = useState({ e: 4, v: 5, m: 6 });
  useEffect(() => { if (!t0) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, [t0]);
  const secs = t0 ? Math.floor((now - t0) / 1000) : 0;
  const sc = shockClass(Number(v.hr), Number(v.sbp));
  const ab = abcScore(abc);
  const gg = gcs(g.e, g.v, g.m);
  const log = () => TRAUMA_STEPS.filter((s) => done[s.id]).map((s) => `${mmss(Math.floor((done[s.id] - (t0 ?? done[s.id])) / 1000))}  ${s.title}`).join("\n");

  return (
    <section className="cx-page cx-lab cx-trauma">
      <header className="cx-page-h"><div><h1>Trauma Primary Survey</h1><p>A clock with the &lt;C&gt;ABCDE steps time-stamped as you go, shock class, the score for massive transfusion, GCS, tranexamic acid timing and resuscitation targets.</p></div></header>
      <div className="cx-c23-row">{t0 ? <button className="cx-btn" onClick={() => { setT0(null); setDone({}); }}><RotateCcw size={14} /> Reset</button> : <button className="cx-btn primary" onClick={() => { const n = Date.now(); setT0(n); setNow(n); }} data-tr="start"><Timer size={14} /> Start the clock (patient arrives)</button>}</div>
      {t0 && <div className="cx-sp-clock" data-tr="clock"><b>{mmss(secs)}</b> since arrival</div>}
      <div className="cx-sp-steps" data-tr="steps">{TRAUMA_STEPS.map((s) => (
        <label key={s.id} className={`cx-pa-mine ${done[s.id] ? "done" : ""}`}><input type="checkbox" checked={!!done[s.id]} onChange={(e) => { const x = { ...done }; if (e.target.checked) x[s.id] = Date.now(); else delete x[s.id]; setDone(x); }} data-tr-step={s.id} /> <span><b>{s.title}</b>{done[s.id] && t0 ? <em> at {mmss(Math.floor((done[s.id] - t0) / 1000))}</em> : null}<br /><small>{s.detail}</small></span></label>
      ))}</div>
      {Object.keys(done).length > 0 && <div className="cx-sc-acts"><button className="cx-btn" onClick={() => void navigator.clipboard?.writeText(log())}><ClipboardCopy size={14} /> Copy the timeline</button></div>}
      <div className="cx-c23-two">
        <div>
          <h4>Shock</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Heart rate</span><input className="cx-input" inputMode="numeric" value={v.hr} onChange={(e) => setV({ ...v, hr: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-tr="hr" /></label>
            <label className="cx-field"><span>Systolic BP</span><input className="cx-input" inputMode="numeric" value={v.sbp} onChange={(e) => setV({ ...v, sbp: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-tr="sbp" /></label>
          </div>
          {sc && <p className="cx-set-hint" data-tr="shock"><b>{sc.text}</b>{Number(v.sbp) > 0 ? ` · shock index ${(Number(v.hr) / Number(v.sbp)).toFixed(2)}${Number(v.hr) / Number(v.sbp) > 1 ? " (over 1: likely to need transfusion)" : ""}` : ""}</p>}
          <h4>ABC score (massive transfusion)</h4>
          <div className="cx-c23-row">{([["penetrating", "Penetrating injury"], ["sbp90", "SBP 90 or less"], ["hr120", "HR 120 or more"], ["fastPos", "Positive FAST"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={abc[k]} onChange={(e) => setAbc({ ...abc, [k]: e.target.checked })} data-tr={k} /> {l}</label>)}</div>
          <p className="cx-set-hint" data-tr="abc"><b>ABC {ab}: {ab >= 2 ? "activate the massive transfusion protocol" : "massive transfusion not predicted (reassess)"}</b></p>
        </div>
        <div>
          <h4>GCS</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Eyes</span><select className="cx-select" value={g.e} onChange={(e) => setG({ ...g, e: Number(e.target.value) })} data-tr="gcs-e">{[4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}: {["", "None", "To pain", "To voice", "Spontaneous"][n]}</option>)}</select></label>
            <label className="cx-field"><span>Verbal</span><select className="cx-select" value={g.v} onChange={(e) => setG({ ...g, v: Number(e.target.value) })} data-tr="gcs-v">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}: {["", "None", "Sounds", "Words", "Confused", "Oriented"][n]}</option>)}</select></label>
            <label className="cx-field"><span>Motor</span><select className="cx-select" value={g.m} onChange={(e) => setG({ ...g, m: Number(e.target.value) })} data-tr="gcs-m">{[6, 5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}: {["", "None", "Extension", "Abnormal flexion", "Withdraws", "Localises", "Obeys"][n]}</option>)}</select></label>
          </div>
          <p className="cx-set-hint" data-tr="gcs"><b>{gg.text}</b></p>
          <h4>Tranexamic acid</h4>
          <label className="cx-field"><span>Hours since injury</span><input className="cx-input" inputMode="decimal" value={v.hours} onChange={(e) => setV({ ...v, hours: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} data-tr="hours" /></label>
          <p className="cx-set-hint" data-tr="txa"><b>{txaAdvice(v.hours === "" ? null : Number(v.hours))}</b></p>
        </div>
      </div>
      <h4>Targets</h4><ul>{TRAUMA_TARGETS.map((x) => <li key={x}>{x}</li>)}</ul>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> ATLS 10th edition, CRASH-2 and the ABC score. Shock class is a guide: young adults and people on beta-blockers may not show tachycardia.</p>
    </section>
  );
}
