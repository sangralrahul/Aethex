/**
 * Refeeding & Nutrition: NICE refeeding risk, a safe calorie ramp by weight, thiamine and
 * electrolyte monitoring, and protein and fluid targets.
 */
import { useState } from "react";
import { Printer, TriangleAlert, Utensils } from "lucide-react";
import { REFEED_CARE, refeedRamp, refeedRisk } from "@/lib/cadus/clinic34";

export default function RefeedView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ kg: "", cm: "", usual: "", days: "" });
  const [lowLytes, setLowLytes] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const kg = Number(v.kg), cm = Number(v.cm);
  const bmi = kg > 0 && cm > 0 ? Math.round((kg / (cm / 100) ** 2) * 10) / 10 : 0;
  const loss = v.usual && kg ? Math.round(((Number(v.usual) - kg) / Number(v.usual)) * 1000) / 10 : 0;
  const r = refeedRisk({ bmi, lossPct: loss, daysLittle: Number(v.days) || 0, lowLytes, alcohol });
  const ramp = refeedRamp(kg, r.startKcal);
  const md = () => ["# Refeeding plan", "", `- BMI ${bmi || "?"}, weight loss ${loss}%: **${r.level} risk** (${r.reason})`, ...ramp.map((d) => `- Day ${d.day}: ${d.kcal} kcal (${d.perKg} kcal/kg)`), "", ...REFEED_CARE.map((c) => `- ${c}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-refeed">
      <header className="cx-page-h"><div><h1>Refeeding &amp; Nutrition</h1><p>Who is at risk of refeeding syndrome, a safe calorie ramp by weight, thiamine and electrolytes, and protein and fluid targets.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={v.kg} onChange={(e) => setV({ ...v, kg: n(e.target.value) })} placeholder="42" data-rf2="kg" /></label>
        <label className="cx-field"><span>Height (cm)</span><input className="cx-input" inputMode="decimal" value={v.cm} onChange={(e) => setV({ ...v, cm: n(e.target.value) })} placeholder="165" data-rf2="cm" /></label>
        <label className="cx-field"><span>Usual weight (kg)</span><input className="cx-input" inputMode="decimal" value={v.usual} onChange={(e) => setV({ ...v, usual: n(e.target.value) })} placeholder="50" data-rf2="usual" /></label>
        <label className="cx-field"><span>Days of little or no intake</span><input className="cx-input" inputMode="numeric" value={v.days} onChange={(e) => setV({ ...v, days: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="7" data-rf2="days" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={lowLytes} onChange={(e) => setLowLytes(e.target.checked)} data-rf2="lytes" /> Low potassium, phosphate or magnesium</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={alcohol} onChange={(e) => setAlcohol(e.target.checked)} data-rf2="alcohol" /> Alcohol misuse, insulin, chemotherapy, antacids or diuretics</label>
      </div>
      {kg > 0 && (
        <div className={`cx-cmp-out ${r.level === "very high" ? "cx-st-out" : r.level === "high" ? "cx-ac-high" : "cx-ac-in"}`} data-rf2="out" data-level={r.level}>
          <h3 className="cx-lab-h3" data-rf2="risk">{r.level === "low" ? "Low refeeding risk" : `${r.level[0].toUpperCase() + r.level.slice(1)} refeeding risk`}: start at {r.startKcal} kcal/kg/day</h3>
          <p className="cx-set-hint">{bmi ? `BMI ${bmi}. ` : ""}{loss > 0 ? `Weight loss ${loss}%. ` : ""}{r.reason}.</p>
          {ramp.length > 1 && <table className="cx-c23-table" data-rf2="ramp"><thead><tr><th>Day</th><th>Energy</th></tr></thead><tbody>{ramp.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.kcal} kcal ({d.perKg} kcal/kg)</td></tr>)}</tbody></table>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Refeeding plan", md())}><Printer size={14} /> Print</button></div>
        </div>
      )}
      <ul>{REFEED_CARE.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="cx-rs-foot"><Utensils size={13} /> NICE CG32 nutrition support. <TriangleAlert size={13} /> Watch especially in the first 72 hours: low phosphate, arrhythmias, heart failure and Wernicke's.</p>
    </section>
  );
}
