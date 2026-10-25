/**
 * Atrial Fibrillation: CHA2DS2-VA and HAS-BLED, the anticoagulant, rate control doses, and rhythm
 * control and cardioversion rules.
 */
import { useState } from "react";
import { Activity, Printer, TriangleAlert } from "lucide-react";
import { AF_CAUSES, AF_RATE, afRhythm, cha2ds2va, hasBled } from "@/lib/cadus/clinic33";

export default function AfView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"stroke" | "rate" | "rhythm">("stroke");
  const [age, setAge] = useState("");
  const [c, setC] = useState({ chf: false, htn: false, dm: false, stroke: false, vascular: false });
  const [b, setB] = useState({ htn: false, renal: false, liver: false, stroke: false, bleeding: false, labileInr: false, elderly: false, drugs: false, alcohol: false });
  const [valve, setValve] = useState(false);
  const [r, setR] = useState({ hours: "", unstable: false, structural: false, anticoag3wk: false });
  const cs = cha2ds2va({ ...c, age: Number(age) || 0 });
  const hb = hasBled({ ...b, elderly: b.elderly || Number(age) > 65 });
  const rh = afRhythm(r.hours === "" ? null : Number(r.hours), r.unstable, r.structural, r.anticoag3wk);
  const md = () => ["# Atrial fibrillation", "", `- ${cs.text}`, `- ${hb.text}`, `- Anticoagulant: ${valve ? "warfarin (mechanical valve or moderate–severe mitral stenosis)" : "a DOAC (see Warfarin & Anticoagulation for doses)"}`, "", "## Rate", ...AF_RATE.map((a) => `- ${a}`), "", "## Rhythm", ...rh.map((a) => `- ${a}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-af">
      <header className="cx-page-h"><div><h1>Atrial Fibrillation</h1><p>Stroke and bleeding risk, which anticoagulant, rate control doses, and when and how to restore sinus rhythm.</p></div></header>
      <div className="cx-seg" role="tablist">{([["stroke", "Stroke prevention"], ["rate", "Rate control"], ["rhythm", "Rhythm control"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-af-tab={k}>{l}</button>)}</div>
      {tab === "stroke" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="72" data-af="age" /></label>
            {([["chf", "Heart failure"], ["htn", "Hypertension"], ["dm", "Diabetes"], ["stroke", "Stroke, TIA or embolism"], ["vascular", "Vascular disease (MI, PAD, plaque)"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.checked })} data-af-c={k} /> {l}</label>)}
          </div>
          <div className={`cx-cmp-out ${cs.score >= 2 ? "cx-ac-high" : "cx-ac-in"}`} data-af="cha"><h3 className="cx-lab-h3" data-af="cha-score">{cs.text}</h3></div>
          <h4>HAS-BLED</h4>
          <div className="cx-c23-row">{([["htn", "Uncontrolled SBP over 160"], ["renal", "Dialysis, transplant or creatinine over 2.26"], ["liver", "Cirrhosis or bilirubin 2× / ALT 3×"], ["stroke", "Previous stroke"], ["bleeding", "Major bleeding or predisposition"], ["labileInr", "Labile INR"], ["elderly", "Over 65"], ["drugs", "Antiplatelet or NSAID"], ["alcohol", "Alcohol 8+ drinks a week"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.checked })} data-af-b={k} /> {l}</label>)}</div>
          <p className="cx-set-hint" data-af="hasbled"><b>{hb.text}</b></p>
          <label className="cx-pa-mine"><input type="checkbox" checked={valve} onChange={(e) => setValve(e.target.checked)} data-af="valve" /> Mechanical valve or moderate–severe (rheumatic) mitral stenosis</label>
          <p className="cx-set-hint" data-af="oac">{valve ? "Use warfarin (INR 2–3, or 2.5–3.5 for a mechanical mitral valve); DOACs are not suitable." : "Prefer a DOAC (apixaban, rivaroxaban, dabigatran, edoxaban) over warfarin; dose by kidney function, age and weight in Warfarin & Anticoagulation. Aspirin is not stroke prevention."}</p>
          <h4>Look for causes</h4><ul>{AF_CAUSES.map((a) => <li key={a}>{a}</li>)}</ul>
        </>
      )}
      {tab === "rate" && <ul data-af="rate">{AF_RATE.map((a) => <li key={a}>{a}</li>)}</ul>}
      {tab === "rhythm" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Hours since onset (blank if unknown)</span><input className="cx-input" inputMode="numeric" value={r.hours} onChange={(e) => setR({ ...r, hours: e.target.value.replace(/\D/g, "").slice(0, 4) })} data-af="hours" /></label>
            {([["unstable", "Unstable (shock, ischaemia, pulmonary oedema)"], ["structural", "Structural heart disease or heart failure"], ["anticoag3wk", "Anticoagulated for 3 weeks"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.checked })} data-af={k} /> {l}</label>)}
          </div>
          <ol className="cx-c23-steps" data-af="rhythm">{rh.map((a) => <li key={a}>{a}</li>)}</ol>
        </>
      )}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Atrial fibrillation plan", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><Activity size={13} /> ESC 2024 AF guidelines (CHA₂DS₂-VA). <TriangleAlert size={13} /> AF with a very fast broad-complex rhythm may be pre-excited (WPW): avoid AV-node blockers; cardiovert.</p>
    </section>
  );
}
