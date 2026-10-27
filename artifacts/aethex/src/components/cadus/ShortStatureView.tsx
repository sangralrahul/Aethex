/**
 * Short Stature & Growth: mid-parental height and target range, growth velocity, and when to
 * investigate and refer.
 */
import { useState } from "react";
import { Ruler, TriangleAlert } from "lucide-react";
import { growthAssess, growthVelocity, midParental } from "@/lib/cadus/clinic46";

export default function ShortStatureView() {
  const [girl, setGirl] = useState(false);
  const [v, setV] = useState({ age: "", sds: "", father: "", mother: "", h1: "", h2: "", months: "" });
  const [f, setF] = useState({ belowTarget: false, disproportion: false, dysmorphic: false, chronicSymptoms: false });
  const [bone, setBone] = useState<"unknown" | "normal" | "delayed">("unknown");
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const mph = midParental(num("father"), num("mother"), !girl);
  const vel = growthVelocity(num("h1"), num("h2"), num("months"));
  const sds = v.sds.trim() && v.sds.trim() !== "-" ? Number(v.sds) : null;
  const r = growthAssess({ sds: sds !== null && Number.isFinite(sds) ? sds : null, velocity: vel, ageYears: num("age"), girl, ...f, boneAge: bone });
  const n = (k: keyof typeof v, l: string, ph: string, signed = false) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(signed ? /[^\d.-]/g : /[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-grw={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-grw={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-grw">
      <header className="cx-page-h"><div><h1>Short Stature &amp; Growth</h1><p>Plot on IAP 2015 charts, compare with the family target, and use growth velocity to separate normal variants from disease.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={girl ? "f" : "m"} onChange={(e) => setGirl(e.target.value === "f")} data-grw="sex"><option value="m">Boy</option><option value="f">Girl</option></select></label>
        {n("age", "Age (years)", "7")}{n("sds", "Height SDS (from chart)", "-2.2", true)}
      </div>
      <h4>Family target</h4>
      <div className="cx-c23-row">{n("father", "Father's height (cm)", "170")}{n("mother", "Mother's height (cm)", "155")}</div>
      {mph && <p className="cx-set-hint" data-grw="mph"><b>Mid-parental height {mph.mph} cm; target range {mph.low}–{mph.high} cm.</b></p>}
      <h4>Growth velocity</h4>
      <div className="cx-c23-row">{n("h1", "Earlier height (cm)", "112")}{n("h2", "Height now (cm)", "115")}{n("months", "Months between", "12")}</div>
      {vel > 0 && <p className="cx-set-hint" data-grw="vel"><b>{vel} cm/year</b></p>}
      <div className="cx-imaging-ticks">{cb("belowTarget", "Well below the family target range")}{cb("disproportion", "Disproportionate (short limbs or trunk)")}{cb("dysmorphic", "Dysmorphic features")}{cb("chronicSymptoms", "Chronic symptoms (diarrhoea, poor appetite, headaches, vision)")}</div>
      <label className="cx-field"><span>Bone age</span><select className="cx-select" value={bone} onChange={(e) => setBone(e.target.value as typeof bone)} data-grw="bone"><option value="unknown">Not done</option><option value="normal">Matches age</option><option value="delayed">Delayed</option></select></label>
      <div className={`cx-cmp-out ${r.level === "refer" ? "cx-st-out" : r.level === "watch" ? "cx-ac-high" : "cx-ac-in"}`} data-grw="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Ruler size={13} /> IAP 2015 growth charts, ISPAE short stature guideline. <TriangleAlert size={13} /> Measure standing height with a stadiometer; one measurement cannot show velocity.</p>
    </section>
  );
}
