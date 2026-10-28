/** Ankle sprain and foot injuries: Ottawa ankle and foot rules, grading, rehab. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { anklePlan, type AnkleInput } from "@/lib/cadus/clinic50";
import { PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof AnkleInput, "grade">;
const OTTAWA: [B, string][] = [["malleolarPain", "Pain in the malleolar zone"], ["lateralTip", "Bone tenderness: back edge or tip of lateral malleolus (6 cm)"], ["medialTip", "Bone tenderness: back edge or tip of medial malleolus (6 cm)"], ["midfootPain", "Pain in the midfoot"], ["fifthMetBase", "Bone tenderness: base of 5th metatarsal"], ["navicular", "Bone tenderness: navicular"], ["cantBearWeight", "Can't take 4 steps, now and right after the injury"]];
const FLAGS: [B, string][] = [["deformity", "Obvious deformity"], ["neurovascular", "Pale, cold or numb foot"], ["open", "Open wound over the injury"], ["achilles", "Calf 'kick', gap or positive squeeze test"], ["highAnkle", "Pain above the ankle on squeezing the leg"]];

export default function AnkleView() {
  const [x, setX] = useState<AnkleInput>({ malleolarPain: false, lateralTip: false, medialTip: false, midfootPain: false, fifthMetBase: false, navicular: false, cantBearWeight: false, deformity: false, neurovascular: false, open: false, achilles: false, highAnkle: false, grade: 0 });
  const r = anklePlan(x);
  const t = ([k, l]: [B, string]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`ank-${k}`} />;
  return (
    <section className="cx-page cx-lab cx-ank">
      <header className="cx-page-h"><div><h1>Ankle Sprain & Foot Injuries</h1><p>Ottawa rules decide who needs an X-ray. Then grade the sprain and get the patient walking early.</p></div></header>
      <fieldset className="cx-c50-dom"><legend>Ottawa ankle and foot rules</legend><div className="cx-imaging-ticks">{OTTAWA.map(t)}</div></fieldset>
      <fieldset className="cx-c50-dom"><legend>Red flags</legend><div className="cx-imaging-ticks">{FLAGS.map(t)}</div></fieldset>
      <div className="cx-seg" role="radiogroup" aria-label="Sprain grade">{([0, 1, 2, 3] as const).map((g) => <button key={g} role="radio" aria-checked={x.grade === g} className={x.grade === g ? "on" : ""} onClick={() => setX({ ...x, grade: g })} data-t={`ank-g${g}`}>{g ? `Grade ${g}` : "Not graded"}</button>)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="ank-out"><p className="cx-c50-score"><b data-t="ank-xray" data-ankle={r.ankleXray ? "yes" : "no"} data-foot={r.footXray ? "yes" : "no"}>{r.ankleXray || r.footXray ? `X-ray: ${[r.ankleXray && "ankle", r.footXray && "foot"].filter(Boolean).join(" and ")}` : "No X-ray needed by Ottawa"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> Ottawa ankle rules (Stiell 1992); NICE CKS sprains and strains.</p>
    </section>
  );
}
