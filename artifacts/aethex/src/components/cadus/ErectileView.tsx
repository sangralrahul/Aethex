/** Erectile dysfunction: IIEF-5, the cardiovascular work-up, PDE5 inhibitors and when they're unsafe. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { edPlan, type EdInput } from "@/lib/cadus/clinic50";
import { PlanOut, Tick } from "./Clinic50Parts";

const Q: [string, string[]][] = [
  ["How do you rate your confidence that you could get and keep an erection?", ["Very low", "Low", "Moderate", "High", "Very high"]],
  ["When you had erections with sexual stimulation, how often were they hard enough for penetration?", ["Almost never", "A few times", "Sometimes", "Most times", "Almost always"]],
  ["During intercourse, how often were you able to keep the erection after penetration?", ["Almost never", "A few times", "Sometimes", "Most times", "Almost always"]],
  ["During intercourse, how difficult was it to keep the erection to completion?", ["Extremely difficult", "Very difficult", "Difficult", "Slightly difficult", "Not difficult"]],
  ["When you attempted intercourse, how often was it satisfactory for you?", ["Almost never", "A few times", "Sometimes", "Most times", "Almost always"]],
];
type B = Exclude<keyof EdInput, "answers" | "age">;
const T: [B, string][] = [["nitrates", "Takes nitrates (GTN, isosorbide) or nicorandil"], ["unstableHeart", "Recent heart attack, stroke, angina at rest or severe heart failure"], ["alphaBlocker", "Takes an alpha-blocker (tamsulosin, doxazosin)"], ["morningErections", "Still has morning erections"], ["sudden", "Sudden onset or only with a partner"], ["lowLibido", "Low libido or tiredness"], ["diabetes", "Diabetes"], ["smoker", "Smokes"], ["meds", "On antidepressants, beta-blockers, thiazides or finasteride"], ["curvature", "Curvature or a hard plaque"]];

export default function ErectileView() {
  const [x, setX] = useState<EdInput>({ answers: [0, 0, 0, 0, 0], nitrates: false, unstableHeart: false, morningErections: false, sudden: false, lowLibido: false, diabetes: false, smoker: false, alphaBlocker: false, meds: false, age: 0, curvature: false });
  const r = edPlan(x);
  return (
    <section className="cx-page cx-lab cx-ed">
      <header className="cx-page-h"><div><h1>Erectile Dysfunction</h1><p>Score it with the IIEF-5, treat it as a cardiovascular warning sign, and prescribe a PDE5 inhibitor safely.</p></div></header>
      <ol className="cx-c50-q">{Q.map(([q, opts], i) => (
        <li key={q}><span>{q}</span>
          <select className="cx-select" value={x.answers[i] || ""} onChange={(e) => { const a = [...x.answers]; a[i] = Number(e.target.value); setX({ ...x, answers: a }); }} data-t={`ed-q${i}`}>
            <option value="">Choose…</option>{opts.map((o, j) => <option key={o} value={j + 1}>{j + 1} · {o}</option>)}
          </select>
        </li>
      ))}</ol>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`ed-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="ed-out"><p className="cx-c50-score" data-t="ed-score" data-score={r.score ?? ""}><b>{r.score !== null ? `IIEF-5 ${r.score}/25 · ${r.band}` : "Answer all five questions for the IIEF-5 score"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> EAU 2024 sexual and reproductive health guideline; IIEF-5 (Rosen 1999); Princeton III consensus.</p>
    </section>
  );
}
