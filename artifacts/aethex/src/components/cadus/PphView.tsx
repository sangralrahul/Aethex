/**
 * Postpartum Haemorrhage: shock index and grade, the 4 Ts, uterotonics and tranexamic acid with
 * contraindications, escalation steps and massive transfusion.
 */
import { useEffect, useState } from "react";
import { Droplet, Timer, TriangleAlert } from "lucide-react";
import { MASSIVE_TX, pphDrugs, pphGrade, PPH_STEPS, PPH_TS, shockIndex } from "@/lib/cadus/clinic39";

export default function PphView() {
  const [v, setV] = useState({ loss: "", hr: "", sbp: "" });
  const [cs, setCs] = useState(false);
  const [asthma, setAsthma] = useState(false);
  const [htn, setHtn] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (start === null) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [start]);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 5) })} placeholder={ph} data-pp={k} /></label>;
  const si = v.hr && v.sbp ? shockIndex(Number(v.hr), Number(v.sbp)) : null;
  const g = v.loss ? pphGrade(Number(v.loss), cs, si?.si ?? 0) : null;
  const mins = start === null ? 0 : Math.floor((now - start) / 60000);
  return (
    <section className="cx-page cx-lab cx-pph">
      <header className="cx-page-h"><div><h1>Postpartum Haemorrhage</h1><p>Grade the bleeding and shock, think of the 4 Ts, and give uterotonics and tranexamic acid in the right order, with escalation and massive transfusion.</p></div></header>
      <div className="cx-c23-row">{n("loss", "Measured blood loss (ml)", "1200")}{n("hr", "Heart rate", "120")}{n("sbp", "Systolic BP", "90")}
        <label className="cx-pa-mine"><input type="checkbox" checked={cs} onChange={(e) => setCs(e.target.checked)} data-pp="cs" /> Caesarean birth</label>
      </div>
      {(si || g) && <div className={`cx-cmp-out ${g?.major || (si && si.band !== "normal") ? "cx-st-out" : "cx-ac-in"}`} data-pp="grade">{g && <h3 className="cx-lab-h3">{g.grade}</h3>}{si && <p data-pp="si"><b>Shock index {si.si}</b>{si.band === "critical" ? ": critical (1.7 or more): transfuse now" : si.band === "urgent" ? ": 1.4 or more: urgent intervention and blood" : si.band === "concern" ? ": 0.9 or more: concern, prepare blood" : ": normal"}</p>}<p>Visual estimates underestimate loss: weigh pads and swabs (1 g = 1 ml).</p></div>}
      <div className="cx-se-clock"><span className="t"><Timer size={18} /> {start === null ? "0 min" : `${mins} min`}</span>{start === null ? <button className="cx-btn primary" onClick={() => { setStart(Date.now()); setNow(Date.now()); }} data-pp="start">Start the PPH clock</button> : <button className="cx-btn" onClick={() => setStart(null)}>Reset</button>}{start !== null && mins >= 30 && <b className="cx-bk-err">30 minutes: give the second dose of tranexamic acid if still bleeding.</b>}</div>
      <h4>The 4 Ts</h4><ul>{PPH_TS.map((t) => <li key={t}>{t}</li>)}</ul>
      <h4>Steps</h4><ol className="cx-c23-steps">{PPH_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={asthma} onChange={(e) => setAsthma(e.target.checked)} data-pp="asthma" /> Asthma</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={htn} onChange={(e) => setHtn(e.target.checked)} data-pp="htn" /> Hypertension or pre-eclampsia</label>
      </div>
      <table className="cx-c23-table" data-pp="drugs"><thead><tr><th>Drug</th><th>Dose</th></tr></thead><tbody>{pphDrugs(asthma, htn).map((d) => <tr key={d.name} className={d.blocked ? "cx-pp-blocked" : ""} data-pp-drug={d.name} data-blocked={String(d.blocked)}><td><b>{d.name}</b></td><td>{d.blocked ? `Avoid: ${d.avoid}. ` : ""}{d.dose}</td></tr>)}</tbody></table>
      <div className="cx-cmp-out cx-ac-high"><p>{MASSIVE_TX}</p></div>
      <p className="cx-rs-foot"><Droplet size={13} /> WHO 2023 PPH recommendations (E-MOTIVE bundle), RCOG Green-top 52, FOGSI. <TriangleAlert size={13} /> Follow your labour ward protocol; call for help early.</p>
    </section>
  );
}
