/** Hearing loss: tuning forks, sudden sensorineural loss (an emergency), wax, asymmetry, children. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { hearingPlan, type Fork, type HearingInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof HearingInput, "onsetHours" | "age" | "weber" | "rinneLeft" | "rinneRight">;
const T: [B, string][] = [["sudden", "Came on over less than 72 hours"], ["oneSided", "One ear only"], ["tinnitusOneSided", "One-sided tinnitus"], ["vertigo", "Vertigo"], ["pain", "Ear pain"], ["discharge", "Discharge"], ["wax", "Wax seen"], ["neuro", "Facial weakness or other neuro signs"], ["ototoxic", "Ototoxic drugs"], ["noise", "Noise exposure"], ["child", "Child"], ["diabetes", "Diabetes"]];

export default function HearingLossView() {
  const [x, setX] = useState<HearingInput>({ onsetHours: 0, sudden: false, oneSided: false, tinnitusOneSided: false, vertigo: false, pain: false, discharge: false, wax: false, child: false, age: 0, ototoxic: false, noise: false, neuro: false, weber: "midline", rinneLeft: "positive", rinneRight: "positive", diabetes: false });
  const r = hearingPlan(x);
  const sel = (k: "rinneLeft" | "rinneRight", l: string) => <label className="cx-field"><span>{l}</span><select className="cx-select" value={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.value as "positive" | "negative" })} data-t={`hea-${k}`}><option value="positive">Positive (AC &gt; BC)</option><option value="negative">Negative (BC &gt; AC)</option></select></label>;
  return (
    <section className="cx-page cx-lab cx-hea">
      <header className="cx-page-h"><div><h1>Hearing Loss</h1><p>Tuning forks in a minute, and the one hearing loss that is an emergency: sudden sensorineural loss.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weber lateralises to</span><select className="cx-select" value={x.weber} onChange={(e) => setX({ ...x, weber: e.target.value as Fork })} data-t="hea-weber"><option value="midline">Midline</option><option value="left">Left</option><option value="right">Right</option></select></label>
        {sel("rinneLeft", "Rinne left")}{sel("rinneRight", "Rinne right")}
        <NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="45" data="hea-age" max={110} />
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`hea-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps.length ? r.steps : ["Tick what applies."]} data="hea-out"><p className="cx-c50-score" data-t="hea-forks">{r.forks}</p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> AAO-HNS 2019 sudden hearing loss guideline; NICE NG98 hearing loss in adults.</p>
    </section>
  );
}
