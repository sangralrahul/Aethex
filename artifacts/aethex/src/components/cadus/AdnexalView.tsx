/**
 * Ovarian Cyst (Adnexal Mass): simple vs complex, Risk of Malignancy Index, follow-up by size and
 * menopause, germ cell markers, and emergencies.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { RMI_FEATURES, adnexalPlan, rmi } from "@/lib/cadus/clinic48";

export default function AdnexalView() {
  const [post, setPost] = useState(false);
  const [v, setV] = useState({ age: "", size: "", ca125: "" });
  const [simple, setSimple] = useState(true);
  const [feat, setFeat] = useState(RMI_FEATURES.map(() => false));
  const [pain, setPain] = useState(false);
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const nf = feat.filter(Boolean).length;
  const r = adnexalPlan({ postmenopausal: post, age: num("age"), sizeCm: num("size"), simple: simple && nf === 0, features: nf, ca125: num("ca125"), acutePain: pain });
  const score = num("ca125") ? rmi(nf, post, num("ca125")) : null;
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-adx={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-adx">
      <header className="cx-page-h"><div><h1>Ovarian Cyst (Adnexal Mass)</h1><p>Most cysts in younger women are functional and settle. After the menopause, every cyst needs a CA-125 and the Risk of Malignancy Index.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age", "45")}{n("size", "Largest size (cm)", "4")}{n("ca125", "CA-125 (U/mL)", "20")}</div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={post} onChange={(e) => setPost(e.target.checked)} data-adx="post" /> Postmenopausal</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} data-adx="simple" /> Simple (thin wall, no septa or solid parts)</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={pain} onChange={(e) => setPain(e.target.checked)} data-adx="pain" /> Sudden severe pain</label>
      </div>
      <h4>Ultrasound features (RMI)</h4>
      <div className="cx-imaging-ticks">{RMI_FEATURES.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={feat[i]} onChange={(e) => setFeat(feat.map((y, j) => (j === i ? e.target.checked : y)))} data-adx-f={i} /> {t}</label>)}</div>
      {score && <p className={`cx-cmp-out ${score.band === "high" ? "cx-st-out" : score.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-adx="rmi" data-score={score.score} data-band={score.band}><b>RMI {score.score}</b></p>}
      <div className={`cx-cmp-out ${r.refer ? "cx-ac-high" : "cx-ac-in"}`} data-adx="out" data-refer={String(r.refer)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Venus size={13} /> RCOG green-top 34 and 62, NICE CG122, ACR O-RADS. <TriangleAlert size={13} /> CA-125 is raised by endometriosis, fibroids, PID and pregnancy in younger women.</p>
    </section>
  );
}
