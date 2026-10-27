/**
 * WHO Labour Care Guide: time-at-cervix alert limits in active labour, second-stage limits, and alert
 * values for the baby, mother and contractions.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { LCG_SUPPORT, lcgAlerts, lcgCervix, lcgSecond, type LcgVitals } from "@/lib/cadus/clinic43";

export default function LabourGuideView() {
  const [c, setC] = useState({ cm: "", hrs: "", second: "" });
  const [nullip, setNullip] = useState(true);
  const [v, setV] = useState({ fhr: "", pulse: "", sbp: "", dbp: "", temp: "", contractions: "", duration: "" });
  const [decel, setDecel] = useState<LcgVitals["decel"]>("none");
  const [liquor, setLiquor] = useState<LcgVitals["liquor"]>("clear");
  const num = (s: string) => Number(s) || 0;
  const cx = c.cm ? lcgCervix(num(c.cm), num(c.hrs)) : null;
  const s2 = c.second ? lcgSecond(num(c.second), nullip) : null;
  const alerts = lcgAlerts({ fhr: num(v.fhr), decel, pulse: num(v.pulse), sbp: num(v.sbp), dbp: num(v.dbp), temp: num(v.temp), contractions: num(v.contractions), duration: num(v.duration), liquor });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-lcg={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-lcg">
      <header className="cx-page-h"><div><h1>WHO Labour Care Guide</h1><p>Active labour starts at 5 cm. Enter progress and observations to see which values cross the WHO alert thresholds and need action.</p></div></header>
      <h4>Progress</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Cervix (cm)</span><input className="cx-input" inputMode="decimal" value={c.cm} onChange={(e) => setC({ ...c, cm: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder="6" data-lcg="cm" /></label>
        <label className="cx-field"><span>Hours at this dilatation</span><input className="cx-input" inputMode="decimal" value={c.hrs} onChange={(e) => setC({ ...c, hrs: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder="3" data-lcg="hrs" /></label>
        <label className="cx-field"><span>Hours in second stage</span><input className="cx-input" inputMode="decimal" value={c.second} onChange={(e) => setC({ ...c, second: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder="0" data-lcg="second" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={nullip} onChange={(e) => setNullip(e.target.checked)} data-lcg="nullip" /> First baby</label>
      </div>
      {cx && <div className={`cx-cmp-out ${cx.alert ? "cx-st-out" : "cx-ac-in"}`} data-lcg="cervix" data-alert={String(cx.alert)}><p><b>{cx.text}</b></p></div>}
      {s2 && <div className={`cx-cmp-out ${s2.alert ? "cx-st-out" : "cx-ac-in"}`} data-lcg="secondout" data-alert={String(s2.alert)}><p><b>{s2.text}</b></p></div>}
      <h4>Observations</h4>
      <div className="cx-c23-row">{n("fhr", "Fetal heart (bpm)", "140")}<label className="cx-field"><span>Decelerations</span><select className="cx-select" value={decel} onChange={(e) => setDecel(e.target.value as typeof decel)} data-lcg="decel"><option value="none">None</option><option value="early">Early</option><option value="variable">Variable</option><option value="late">Late</option></select></label><label className="cx-field"><span>Liquor</span><select className="cx-select" value={liquor} onChange={(e) => setLiquor(e.target.value as typeof liquor)} data-lcg="liquor"><option value="clear">Clear</option><option value="meconium">Thick meconium</option><option value="blood">Blood-stained</option></select></label></div>
      <div className="cx-c23-row">{n("pulse", "Maternal pulse", "88")}{n("sbp", "Systolic", "120")}{n("dbp", "Diastolic", "80")}{n("temp", "Temperature (°C)", "37")}</div>
      <div className="cx-c23-row">{n("contractions", "Contractions per 10 min", "4")}{n("duration", "Contraction length (s)", "45")}</div>
      <div className={`cx-cmp-out ${alerts.length ? "cx-st-out" : "cx-ac-in"}`} data-lcg="alerts" data-n={alerts.length}>{alerts.length ? <><h3 className="cx-lab-h3">{alerts.length} alert{alerts.length === 1 ? "" : "s"}: assess and record a plan</h3><ul>{alerts.map((s) => <li key={s}>{s}</li>)}</ul></> : <p>No alert values.</p>}</div>
      <h4>Supportive care to record</h4><ul>{LCG_SUPPORT.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Baby size={13} /> WHO Labour Care Guide (2020) and user's manual. <TriangleAlert size={13} /> Alerts call for review and a recorded decision, not automatic intervention.</p>
    </section>
  );
}
