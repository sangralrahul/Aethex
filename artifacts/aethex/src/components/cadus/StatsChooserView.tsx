/**
 * Statistics Test Chooser: for a thesis or paper, answer a few questions about the study and the
 * data, and get the test to use, why, its assumptions, where it is in SPSS and how to report it.
 * A decision tree on this device; no AI.
 */
import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, Copy, Sigma } from "lucide-react";
import { chooseTest, type StatGoal, type StatOutcome } from "@/lib/cadus/clinic21";

const GOALS: { id: StatGoal; label: string; hint: string }[] = [
  { id: "compare", label: "Compare groups", hint: "e.g. HbA1c on drug A vs drug B" },
  { id: "relate", label: "Relationship between two variables", hint: "e.g. BMI and blood pressure" },
  { id: "predict", label: "Predict an outcome from several factors", hint: "risk factors, adjusted effects" },
  { id: "survival", label: "Time to an event", hint: "survival, relapse, recovery" },
  { id: "diagnostic", label: "How good a test is", hint: "sensitivity, specificity, ROC" },
  { id: "agree", label: "Agreement between raters or methods", hint: "kappa, Bland–Altman" },
];
const OUTCOMES: { id: StatOutcome; label: string; hint: string }[] = [
  { id: "normal", label: "Numbers, roughly normal", hint: "e.g. haemoglobin, BP" },
  { id: "skewed", label: "Numbers, skewed, or ordered scores", hint: "e.g. length of stay, pain score" },
  { id: "binary", label: "Yes / no", hint: "e.g. died, cured" },
  { id: "nominal", label: "Three or more categories", hint: "e.g. blood group, grade" },
];

export default function StatsChooserView({ toast, onAsk }: { toast: (t: string) => void; onAsk: (q: string) => void }) {
  const [goal, setGoal] = useState<StatGoal | "">("");
  const [outcome, setOutcome] = useState<StatOutcome | "">("");
  const [groups, setGroups] = useState<2 | 3>(2);
  const [paired, setPaired] = useState(false);
  const [small, setSmall] = useState(false);
  const [rater, setRater] = useState<"categorical" | "continuous">("categorical");
  const needsOutcome = goal === "compare" || goal === "relate" || goal === "predict";
  const res = useMemo(() => {
    if (!goal || (needsOutcome && !outcome)) return null;
    return chooseTest({ goal, outcome: (outcome || "normal") as StatOutcome, groups, paired, small, rater });
  }, [goal, outcome, groups, paired, small, rater, needsOutcome]);
  const text = res ? [`Test: ${res.test}`, `Why: ${res.why}`, res.assumptions.length ? `Assumptions: ${res.assumptions.join("; ")}` : "", `SPSS: ${res.spss}`, `Report: ${res.report}`, res.also.length ? `Also: ${res.also.join("; ")}` : ""].filter(Boolean).join("\n") : "";
  return (
    <section className="cx-page cx-lab cx-stat">
      <header className="cx-page-h"><div><h1>Statistics Test Chooser</h1><p>Which test for your thesis or paper? Answer three questions about what you're asking and what your data look like.</p></div></header>
      <p className="cx-gl"><span>1. What do you want to know?</span></p>
      <div className="cx-docw-kinds">{GOALS.map((g) => <button key={g.id} className={goal === g.id ? "on" : ""} onClick={() => setGoal(g.id)} data-stat-goal={g.id}><b>{g.label}</b><small>{g.hint}</small></button>)}</div>
      {needsOutcome && <>
        <p className="cx-gl"><span>2. What is the outcome you measured?</span></p>
        <div className="cx-docw-kinds">{OUTCOMES.map((o) => <button key={o.id} className={outcome === o.id ? "on" : ""} onClick={() => setOutcome(o.id)} data-stat-outcome={o.id}><b>{o.label}</b><small>{o.hint}</small></button>)}</div>
      </>}
      {goal === "compare" && outcome && <>
        <p className="cx-gl"><span>3. The groups</span></p>
        <div className="cx-mr-pt">
          <div className="cx-field"><span>How many groups or times?</span><div className="cx-seg"><button className={groups === 2 ? "on" : ""} onClick={() => setGroups(2)} data-stat-groups="2">Two</button><button className={groups === 3 ? "on" : ""} onClick={() => setGroups(3)} data-stat-groups="3">Three or more</button></div></div>
          <div className="cx-field"><span>Same people measured again, or matched?</span><div className="cx-seg"><button className={!paired ? "on" : ""} onClick={() => setPaired(false)}>Different people</button><button className={paired ? "on" : ""} onClick={() => setPaired(true)} data-stat-paired="yes">Same / matched</button></div></div>
          {(outcome === "binary" || outcome === "nominal") && !paired && <label className="cx-pa-mine"><input type="checkbox" checked={small} onChange={(e) => setSmall(e.target.checked)} data-stat-small /> Small numbers (any expected count under 5)</label>}
        </div>
      </>}
      {goal === "agree" && <div className="cx-field"><span>2. What is being rated?</span><div className="cx-seg"><button className={rater === "categorical" ? "on" : ""} onClick={() => setRater("categorical")}>Categories</button><button className={rater === "continuous" ? "on" : ""} onClick={() => setRater("continuous")}>Measurements</button></div></div>}
      {res ? (
        <div className="cx-stat-out" data-stat="out">
          <h2><CheckCircle2 size={18} /> {res.test}</h2>
          <p>{res.why}</p>
          {res.assumptions.length > 0 && <div className="cx-sim-card"><h3>Check first</h3><ul>{res.assumptions.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <p><b><Calculator size={13} /> In SPSS:</b> {res.spss}</p>
          <p><b>Report it as:</b> {res.report}</p>
          {res.also.length > 0 && <p><b>Also consider:</b> {res.also.join("; ")}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(text); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-btn" onClick={() => onAsk(`My study: ${GOALS.find((g) => g.id === goal)?.label.toLowerCase()}${outcome ? `, outcome ${OUTCOMES.find((o) => o.id === outcome)?.label.toLowerCase()}` : ""}. The suggested test is ${res.test}. Explain how to do it step by step, how to check its assumptions, and how to write the result in my thesis, with an example.`)}><Sigma size={14} /> Explain with an example</button>
          </div>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sigma size={20} /></span><h3>Answer the questions above</h3><p>Not sure if your data are normal? Plot a histogram and use the Shapiro–Wilk test for samples under 50.</p></div>}
    </section>
  );
}
