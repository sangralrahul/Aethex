/** Polymyalgia rheumatica and giant cell arteritis: recognise, start steroids, taper. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { pmrPlan, type PmrInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

const LABELS: [Exclude<keyof PmrInput, "age" | "weightKg">, string][] = [
  ["shoulders", "Both shoulders ache"], ["hips", "Hips or thighs ache"], ["stiffness45", "Morning stiffness over 45 minutes"], ["raisedEsrCrp", "Raised ESR or CRP"],
  ["headache", "New headache"], ["scalp", "Scalp tenderness"], ["jaw", "Jaw pain on chewing"], ["visual", "Visual loss, double vision or amaurosis"],
  ["systemic", "Weight loss, night sweats or fever"], ["peripheralSynovitis", "Swollen small joints"],
];

export default function PmrGcaView() {
  const [x, setX] = useState<PmrInput>({ age: 0, shoulders: false, hips: false, stiffness45: false, raisedEsrCrp: false, headache: false, scalp: false, jaw: false, visual: false, systemic: false, peripheralSynovitis: false, weightKg: 0 });
  const r = pmrPlan(x);
  return (
    <section className="cx-page cx-lab cx-pmr">
      <header className="cx-page-h"><div><h1>PMR & Giant Cell Arteritis</h1><p>Shoulder-girdle pain and stiffness after 50, and the arteritis that can blind within days. Steroid start doses and the BSR taper.</p></div></header>
      <div className="cx-c23-row"><NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="70" data="pmr-age" max={120} /><NumField label="Weight (kg)" value={x.weightKg} set={(n) => setX({ ...x, weightKg: n })} placeholder="60" data="pmr-kg" max={250} /></div>
      <div className="cx-imaging-ticks">{LABELS.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`pmr-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps.length ? r.steps : ["Enter the age and symptoms."]} data="pmr-out"><p className="cx-c50-score" data-t="pmr-dx" data-dx={r.dx}><b>{r.dx === "gca" ? "Giant cell arteritis possible" : r.dx === "pmr" ? "PMR likely" : r.dx === "possible" ? "PMR possible" : "PMR/GCA unlikely"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> BSR 2024 PMR guideline; BSR 2020 GCA guideline; EULAR 2018 imaging in large-vessel vasculitis.</p>
    </section>
  );
}
