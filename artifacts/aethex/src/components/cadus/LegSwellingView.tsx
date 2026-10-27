/**
 * Leg Swelling: one leg vs both, Wells score for DVT, and the systemic causes of bilateral oedema
 * (heart, kidney, liver, thyroid, drugs, filariasis).
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import { WELLS_DVT, swellingPlan, wellsDvt, type SwellingInput } from "@/lib/cadus/clinic47";

export default function LegSwellingView() {
  const [x, setX] = useState<SwellingInput>({ bilateral: false, breathless: false, frothyUrine: false, jaundice: false, drugs: false, pregnant: false, nonPitting: false, filarialArea: false, redHot: false });
  const [w, setW] = useState(WELLS_DVT.map(() => false));
  const wr = wellsDvt(w);
  const cb = (k: Exclude<keyof SwellingInput, "bilateral">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-leg={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-leg">
      <header className="cx-page-h"><div><h1>Leg Swelling (Oedema)</h1><p>One swollen leg is a DVT until proved otherwise; two swollen legs usually mean heart, kidney, liver, drugs or veins.</p></div></header>
      <div className="cx-seg" role="tablist">{([[false, "One leg"], [true, "Both legs"]] as const).map(([b, l]) => <button key={l} role="tab" aria-selected={x.bilateral === b} className={x.bilateral === b ? "on" : ""} onClick={() => setX({ ...x, bilateral: b })} data-leg-side={b ? "both" : "one"}>{l}</button>)}</div>
      <div className="cx-imaging-ticks">
        {!x.bilateral && cb("redHot", "Red, hot and tender, or fever")}
        {x.bilateral && <>{cb("breathless", "Breathless, orthopnoea or raised JVP")}{cb("frothyUrine", "Frothy urine or puffy eyes")}{cb("jaundice", "Jaundice, ascites or alcohol")}{cb("drugs", "Amlodipine, NSAIDs, steroids, pregabalin…")}{cb("pregnant", "Pregnant")}</>}
        {cb("nonPitting", "Non-pitting, thick skin")}{cb("filarialArea", "Lives in a filariasis-endemic area")}
      </div>
      <ol className="cx-c23-steps" data-leg="plan">{swellingPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
      {!x.bilateral && (
        <>
          <h4>Wells score for DVT</h4>
          <div className="cx-imaging-ticks">{WELLS_DVT.map(([t, p], i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={w[i]} onChange={(e) => setW(w.map((y, j) => (j === i ? e.target.checked : y)))} data-leg-w={i} /> {t} ({p > 0 ? `+${p}` : p})</label>)}</div>
          <div className={`cx-cmp-out ${wr.likely ? "cx-ac-high" : "cx-ac-in"}`} data-leg="wells" data-score={wr.score} data-likely={String(wr.likely)}><p>{wr.plan}</p></div>
        </>
      )}
      <p className="cx-rs-foot"><Footprints size={13} /> NICE NG158 (2020), AAFP oedema review. <TriangleAlert size={13} /> Swelling with severe pain, tense calf and pain on passive stretch: compartment syndrome.</p>
    </section>
  );
}
