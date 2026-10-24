/**
 * Weight Management: BMI with Asian and international cut-offs, waist risk, healthy weight range,
 * energy needs and a calorie target, and when to add medicines or refer for surgery.
 */
import { useState } from "react";
import { Printer, Scale, TriangleAlert } from "lucide-react";
import { bmiAsian, energyTarget, healthyRange, waistRisk, weightOptions, type Activity } from "@/lib/cadus/clinic29";

export default function WeightView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ kg: "", cm: "", age: "", waist: "" });
  const [female, setFemale] = useState(false);
  const [act, setAct] = useState<Activity>("sedentary");
  const [comorbid, setComorbid] = useState(false);
  const b = bmiAsian(Number(v.kg), Number(v.cm));
  const hr = healthyRange(Number(v.cm));
  const e = energyTarget(Number(v.kg), Number(v.cm), Number(v.age), female, act);
  const opts = b ? weightOptions(b.bmi, comorbid) : [];
  const num = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const md = () => b ? ["# Weight plan", "", `- BMI ${b.bmi}: ${b.asian}`, hr ? `- Healthy weight for your height: ${hr[0]}–${hr[1]} kg` : "", e ? `- Eat about **${e.target} kcal a day** (you use about ${e.tdee})` : "", v.waist ? `- Waist ${v.waist} cm: ${waistRisk(Number(v.waist), female)}` : "", "", ...opts.map((o) => `- ${o}`)].filter(Boolean).join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-weight">
      <header className="cx-page-h"><div><h1>Weight Management</h1><p>BMI with the Asian Indian cut-offs, waist risk, the healthy weight range, a daily calorie target, and when to add medicines or refer for surgery.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={v.kg} onChange={(e) => setV({ ...v, kg: num(e.target.value) })} placeholder="80" data-wt="kg" /></label>
        <label className="cx-field"><span>Height (cm)</span><input className="cx-input" inputMode="decimal" value={v.cm} onChange={(e) => setV({ ...v, cm: num(e.target.value) })} placeholder="170" data-wt="cm" /></label>
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={v.age} onChange={(e) => setV({ ...v, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="40" data-wt="age" /></label>
        <label className="cx-field"><span>Waist (cm)</span><input className="cx-input" inputMode="decimal" value={v.waist} onChange={(e) => setV({ ...v, waist: num(e.target.value) })} placeholder="95" data-wt="waist" /></label>
      </div>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} data-wt="female" /> Female</label>
        <label className="cx-field"><span>Activity</span><select className="cx-select" value={act} onChange={(e) => setAct(e.target.value as Activity)} data-wt="act"><option value="sedentary">Sedentary (desk, little exercise)</option><option value="light">Light (exercise 1–3 days a week)</option><option value="moderate">Moderate (3–5 days)</option><option value="active">Very active (6–7 days)</option></select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={comorbid} onChange={(e) => setComorbid(e.target.checked)} data-wt="comorbid" /> Diabetes, hypertension, sleep apnoea or fatty liver</label>
      </div>
      {b ? (
        <div className="cx-cmp-out" data-wt="out">
          <div className="cx-sim-stats">
            <div><b data-wt="bmi">{b.bmi}</b><small>BMI: {b.asian}</small></div>
            {hr && <div><b>{hr[0]}–{hr[1]} kg</b><small>healthy range (BMI 18.5–22.9)</small></div>}
            {e && <div><b data-wt="target">{e.target} kcal</b><small>a day (uses about {e.tdee}; BMR {e.bmr})</small></div>}
          </div>
          <p className="cx-set-hint">International category: {b.intl}.{v.waist ? ` ${waistRisk(Number(v.waist), female)}.` : ""}</p>
          <ul data-wt="options">{opts.map((o) => <li key={o}>{o}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Weight plan", md())}><Printer size={14} /> Print plan</button></div>
        </div>
      ) : <p className="cx-set-hint">Enter weight and height.</p>}
      <p className="cx-rs-foot"><Scale size={13} /> WHO Asia-Pacific and Indian consensus cut-offs; NICE (lower thresholds by 2.5 for South Asian people); Mifflin–St Jeor equation. <TriangleAlert size={13} /> Look for secondary causes: hypothyroidism, Cushing's, drugs (steroids, antipsychotics, insulin).</p>
    </section>
  );
}
