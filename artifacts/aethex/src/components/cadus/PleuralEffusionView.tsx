/** Pleural effusion: Light's criteria, pH and drain, ADA for TB, malignant effusions. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { effusionPlan, type EffusionInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type N = "pleuralProtein" | "serumProtein" | "pleuralLdh" | "serumLdh" | "serumLdhUln" | "ph" | "glucose" | "ada";
type B = Exclude<keyof EffusionInput, N>;
const NUMS: [N, string, string][] = [["pleuralProtein", "Pleural protein (g/dL)", "4.2"], ["serumProtein", "Serum protein (g/dL)", "6.8"], ["pleuralLdh", "Pleural LDH (U/L)", "320"], ["serumLdh", "Serum LDH (U/L)", "250"], ["serumLdhUln", "Serum LDH upper limit", "240"], ["ph", "Pleural pH", "7.35"], ["glucose", "Pleural glucose (mg/dL)", "80"], ["ada", "ADA (U/L)", "55"]];
const T: [B, string][] = [["lymphocytic", "Lymphocytic fluid"], ["purulent", "Frank pus"], ["bilateral", "Both sides"], ["heartFailure", "Heart failure"], ["cirrhosis", "Cirrhosis"], ["nephrotic", "Nephrotic syndrome"], ["fever", "Fever or pleuritic pain"], ["cancer", "Known or suspected cancer"], ["large", "Large effusion"], ["breathless", "Breathless"], ["onDiuretic", "On diuretics"]];

export default function PleuralEffusionView() {
  const [x, setX] = useState<EffusionInput>({ pleuralProtein: 0, serumProtein: 0, pleuralLdh: 0, serumLdh: 0, serumLdhUln: 0, ph: 0, glucose: 0, ada: 0, lymphocytic: false, purulent: false, bilateral: false, heartFailure: false, cirrhosis: false, nephrotic: false, fever: false, cancer: false, breathless: false, large: false, onDiuretic: false });
  const r = effusionPlan(x);
  return (
    <section className="cx-page cx-lab cx-ple">
      <header className="cx-page-h"><div><h1>Pleural Effusion</h1><p>Transudate or exudate by Light's criteria, when to drain, and the TB and cancer work-up common in Indian practice.</p></div></header>
      <div className="cx-c50-grid">{NUMS.map(([k, l, p]) => <NumField key={k} label={l} value={x[k]} set={(n) => setX({ ...x, [k]: n })} placeholder={p} data={`ple-${k}`} decimals max={5000} />)}</div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`ple-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="ple-out"><p className="cx-c50-score"><b data-t="ple-kind" data-kind={r.kind}>{r.kind === "exudate" ? "Exudate" : r.kind === "transudate" ? "Transudate" : "Enter fluid and serum values for Light's criteria"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> BTS 2023 pleural disease guideline; Light's criteria (1972); ADA in tuberculous pleuritis (meta-analyses).</p>
    </section>
  );
}
