/** Insect bites and stings: anaphylaxis first, then local care, large local reactions, many stings, ticks. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { bitePlan, type BiteInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof BiteInput, "kind" | "weightKg">;
const T: [B, string][] = [["anaphylaxis", "Breathing trouble, throat swelling, faint or collapse"], ["mouthThroat", "Stung in the mouth or throat"], ["many", "Many stings (a swarm)"], ["largeLocal", "Swelling over 10 cm"], ["infected", "Spreading redness or pus after 2 days"], ["previousSystemic", "Had a whole-body reaction before"], ["fever", "Fever since the bite"], ["rash", "Rash or black scab"], ["child", "Child"]];
const KINDS: [BiteInput["kind"], string][] = [["bee", "Bee"], ["wasp", "Wasp or hornet"], ["ant", "Ant"], ["mosquito", "Mosquito"], ["bedbug", "Bedbug"], ["tick", "Tick"], ["spider", "Spider"], ["caterpillar", "Caterpillar"]];

export default function InsectBiteView() {
  const [x, setX] = useState<BiteInput>({ kind: "bee", anaphylaxis: false, previousSystemic: false, mouthThroat: false, largeLocal: false, many: false, infected: false, child: false, weightKg: 0, rash: false, fever: false });
  const r = bitePlan(x);
  return (
    <section className="cx-page cx-lab cx-bte">
      <header className="cx-page-h"><div><h1>Insect Bites & Stings</h1><p>Spot anaphylaxis and swarm attacks, settle local reactions without antibiotics, and remove ticks properly.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Bite or sting</span><select className="cx-select" value={x.kind} onChange={(e) => setX({ ...x, kind: e.target.value as BiteInput["kind"] })} data-t="bte-kind">{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {x.child && <NumField label="Weight (kg)" value={x.weightKg} set={(n) => setX({ ...x, weightKg: n })} placeholder="20" data="bte-kg" max={120} />}
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`bte-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="bte-out" />
      <p className="cx-rs-foot"><BookOpen size={13} /> Resuscitation Council UK 2021 anaphylaxis; EAACI venom immunotherapy guideline; NICE CKS insect bites and stings.</p>
    </section>
  );
}
