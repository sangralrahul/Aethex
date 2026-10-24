/**
 * Hypoglycaemia: what to give now for adults, children and newborns, by glucose, weight and whether
 * the patient can swallow, and a glucose infusion rate calculator for newborns.
 */
import { useState } from "react";
import { Candy, TriangleAlert } from "lucide-react";
import { gir, hypoPlan, type HypoGroup } from "@/lib/cadus/clinic29";

export default function HypoView() {
  const [group, setGroup] = useState<HypoGroup>("adult");
  const [glucose, setGlucose] = useState("");
  const [unit, setUnit] = useState<"mgdl" | "mmol">("mgdl");
  const [kg, setKg] = useState("");
  const [x, setX] = useState({ canSwallow: true, ivAccess: true, sulfonylurea: false, symptomatic: false });
  const [g, setG] = useState({ pct: "10", ml: "60" });
  const plan = glucose ? hypoPlan({ group, kg: Number(kg), glucose: Number(glucose), unit, ...x }) : null;
  const tick = (k: keyof typeof x, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hy={k} /> {l}</label>;

  return (
    <section className="cx-page cx-lab cx-hypo">
      <header className="cx-page-h"><div><h1>Hypoglycaemia</h1><p>What to give now for an adult, a child or a newborn with low glucose, by weight and whether they can swallow, and the newborn glucose infusion rate.</p></div></header>
      <div className="cx-seg" role="tablist">{([["adult", "Adult"], ["child", "Child"], ["newborn", "Newborn"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={group === k} className={group === k ? "on" : ""} onClick={() => setGroup(k)} data-hy-g={k}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Glucose</span><input className="cx-input" inputMode="decimal" value={glucose} onChange={(e) => setGlucose(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder={unit === "mgdl" ? "52" : "2.9"} data-hy="glucose" /></label>
        <div className="cx-field"><span>Unit</span><div className="cx-seg" role="radiogroup" aria-label="Unit">{([["mgdl", "mg/dL"], ["mmol", "mmol/L"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={unit === v} className={unit === v ? "on" : ""} onClick={() => setUnit(v)} data-hy-unit={v}>{l}</button>)}</div></div>
        {group !== "adult" && <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder={group === "newborn" ? "3" : "20"} data-hy="kg" /></label>}
      </div>
      <div className="cx-c23-row">
        {tick("canSwallow", group === "newborn" ? "Feeding and well" : "Awake and able to swallow")}
        {group !== "newborn" && tick("ivAccess", "IV access")}
        {group === "adult" && tick("sulfonylurea", "On a sulfonylurea")}
        {group === "newborn" && tick("symptomatic", "Symptomatic (jittery, poor feeding, apnoea, seizures)")}
      </div>
      {plan ? (
        <div className={`cx-cmp-out ${plan.low ? "cx-st-out" : ""}`} data-hy="out" data-low={String(plan.low)}>
          <ol className="cx-c23-steps" data-hy="steps">{plan.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          {plan.after.length > 0 && <ul>{plan.after.map((a) => <li key={a}>{a}</li>)}</ul>}
        </div>
      ) : <p className="cx-set-hint">Thresholds: under 70 mg/dL (4 mmol/L) in people with diabetes; under 47 mg/dL (2.6 mmol/L) in newborns.</p>}
      {group === "newborn" && (
        <>
          <h4>Glucose infusion rate</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Dextrose (%)</span><input className="cx-input" inputMode="decimal" value={g.pct} onChange={(e) => setG({ ...g, pct: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} data-hy="pct" /></label>
            <label className="cx-field"><span>Fluid (ml/kg/day)</span><input className="cx-input" inputMode="numeric" value={g.ml} onChange={(e) => setG({ ...g, ml: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-hy="ml" /></label>
          </div>
          <p className="cx-set-hint" data-hy="gir"><b>GIR {gir(Number(g.pct), Number(g.ml))} mg/kg/min</b> (usual start 4–6; over 8 suggests hyperinsulinism; over 12.5% dextrose needs a central line).</p>
        </>
      )}
      <p className="cx-rs-foot"><Candy size={13} /> JBDS-IP hypoglycaemia guideline, ISPAD 2022, and BAPM newborn hypoglycaemia framework. <TriangleAlert size={13} /> Give thiamine first in malnourished or alcohol-dependent adults.</p>
    </section>
  );
}
