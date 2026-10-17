/**
 * Thesis kit: sample-size calculators with the working and a paragraph for the
 * protocol, and a chooser for the statistical test. Everything is computed in
 * the browser from standard formulas; Cadus is only asked when you want an
 * explanation.
 */
import { useMemo, useState } from "react";
import { BadgeCheck, ChevronDown, ClipboardCopy, Copy, MessageSquare, RotateCcw, Sigma } from "lucide-react";
import {
  chooseTest, SAMPLE_BY_ID, SAMPLE_CALCS, sampleDefaults,
  type Design, type Goal, type Groups, type Outcome, type SampleField, type SampleId,
} from "@/lib/cadus/samplesize";

const GOALS: { id: Goal; label: string }[] = [
  { id: "compare", label: "Compare groups" },
  { id: "relate", label: "Look for an association" },
  { id: "predict", label: "Predict an outcome (regression)" },
  { id: "survival", label: "Time to an event (survival)" },
];
const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "normal", label: "Continuous, roughly normal" },
  { id: "skewed", label: "Continuous but skewed, or ordinal (scores)" },
  { id: "binary", label: "Yes or no" },
  { id: "nominal", label: "Three or more categories" },
];

const isYesNo = (f: SampleField) => f.min === 0 && f.max === 1 && f.step === 1;
const shown = (f: SampleField, v: number | undefined) => (v === undefined ? "" : String(f.pct ? Math.round(v * 1000) / 10 : v));

function initial(id: SampleId): Record<string, string> {
  const c = SAMPLE_BY_ID[id];
  const d = sampleDefaults(c);
  return Object.fromEntries(c.fields.map((f) => [f.id, shown(f, d[f.id])]));
}

export default function ThesisKit({ onAsk, toast }: { onAsk: (text: string, mode?: string) => void; toast: (t: string) => void }) {
  const [calcId, setCalcId] = useState<SampleId>("prop");
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [goal, setGoal] = useState<Goal>("compare");
  const [outcome, setOutcome] = useState<Outcome>("normal");
  const [groups, setGroups] = useState<Groups>("two");
  const [design, setDesign] = useState<Design>("independent");

  const calc = SAMPLE_BY_ID[calcId];
  const vals = values[calcId] ?? initial(calcId);
  const setVal = (id: string, v: string) => setValues((p) => ({ ...p, [calcId]: { ...vals, [id]: v } }));
  const result = useMemo(() => {
    const nums: Record<string, number | undefined> = {};
    for (const f of calc.fields) {
      const raw = (vals[f.id] ?? "").trim();
      const n = raw === "" ? undefined : Number(raw);
      nums[f.id] = n === undefined || !Number.isFinite(n) ? undefined : f.pct ? n / 100 : n;
    }
    try { return calc.compute(nums); } catch { return null; }
  }, [calc, vals]);
  const advice = chooseTest(goal, goal === "survival" ? "binary" : outcome, groups, design);
  // The number before allowing for loss to follow-up and the design effect.
  const inTotal = result ? /\((\d+) in total\)/.exec(result.value) : null;
  const pair = result ? /^(\d+) cases and (\d+) controls/.exec(result.value) : null;
  const before = !result ? 0 : inTotal ? Number(inTotal[1]) : pair ? Number(pair[1]) + Number(pair[2]) : Number(/^\d+/.exec(result.value)?.[0] ?? 0);

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(done);
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };

  return (
    <div className="cx-tk">
      <section className="cx-tk-sec">
        <header className="cx-tk-h">
          <span className="cx-tk-ic"><Sigma size={17} /></span>
          <div>
            <h2>Sample size</h2>
            <p>Choose your study design and enter values from a previous study or pilot. The working and a paragraph for your protocol update as you type.</p>
          </div>
        </header>
        <div className="cx-tk-grid">
          <aside className="cx-tk-list" aria-label="Study designs">
            {SAMPLE_CALCS.map((c) => (
              <button key={c.id} className={`cx-calc-i ${c.id === calcId ? "on" : ""}`} onClick={() => setCalcId(c.id)}>
                <b>{c.name}</b>
                <small>{c.use}</small>
              </button>
            ))}
          </aside>
          <select className="cx-select cx-tk-pick" value={calcId} onChange={(e) => setCalcId(e.target.value as SampleId)} aria-label="Study design">
            {SAMPLE_CALCS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="cx-calc-panel">
            <header className="cx-calc-ph">
              <span className="cx-badge">Sample size</span>
              <h2>{calc.name}</h2>
              <p>{calc.use}</p>
            </header>
            <div className="cx-calc-body">
              <div className="cx-calc-form">
                {calc.fields.map((f) => (
                  isYesNo(f) ? (
                    <div key={f.id} className="cx-cf">
                      <span className="cx-cf-l">{f.label.replace(/\s*\(1 = yes, 0 = no\)/, "")}</span>
                      <div className="cx-opts" role="radiogroup" aria-label={f.label}>
                        {[["1", "Yes"], ["0", "No"]].map(([v, l]) => (
                          <button key={v} type="button" role="radio" aria-checked={(vals[f.id] || "1") === v} className={(vals[f.id] || "1") === v ? "on" : ""} onClick={() => setVal(f.id, v)}>{l}</button>
                        ))}
                      </div>
                      {f.hint && <small>{f.hint}</small>}
                    </div>
                  ) : (
                    <label key={f.id} className="cx-cf">
                      <span className="cx-cf-l">{f.label}{f.optional && <i> (optional)</i>}</span>
                      <span className="cx-cf-in">
                        <input
                          type="number"
                          inputMode="decimal"
                          step={f.pct ? (f.step ?? 0.01) * 100 : f.step ?? 1}
                          min={f.min === undefined ? undefined : f.pct ? f.min * 100 : f.min}
                          max={f.max === undefined ? undefined : f.pct ? f.max * 100 : f.max}
                          value={vals[f.id] ?? ""}
                          onChange={(e) => setVal(f.id, e.target.value)}
                          aria-label={f.label}
                        />
                        {f.pct && <em>%</em>}
                      </span>
                      {f.hint && <small>{f.hint}</small>}
                    </label>
                  )
                ))}
              </div>
              <div className={`cx-calc-res ${result ? "info" : "empty"}`} aria-live="polite">
                {result ? (
                  <>
                    <span className="cx-calc-rl">Minimum sample size</span>
                    <b className="cx-calc-rv cx-tk-rv">{result.value}</b>
                    {result.recruit > before && <span className="cx-calc-band">Recruit {result.recruit}{inTotal ? " in total" : ""}</span>}
                    <ul>{result.working.map((w) => <li key={w}>{w}</li>)}</ul>
                    <div className="cx-calc-acts">
                      <button onClick={() => void copy(result.paragraph, "Paragraph copied for your protocol")}><Copy size={13} /> Copy</button>
                      <button onClick={() => onAsk(`I am writing the sample-size section of my thesis protocol. ${result.paragraph}\nExplain this calculation in simple terms, check the assumptions I should justify, and suggest how to cite where the expected values came from.`)}><MessageSquare size={13} /> Explain</button>
                    </div>
                  </>
                ) : (
                  <p className="cx-calc-wait">Enter the values to see the sample size. Percentages go in as numbers, for example 30 for 30%.</p>
                )}
              </div>
            </div>
            {result && (
              <div className="cx-tk-para">
                <div className="cx-tk-para-h"><b>For your protocol</b><button onClick={() => void copy(result.paragraph, "Paragraph copied for your protocol")}><ClipboardCopy size={13} /> Copy paragraph</button></div>
                <p>{result.paragraph}</p>
              </div>
            )}
            <details className="cx-calc-meta">
              <summary>Formula and source <ChevronDown size={14} className="chev" /></summary>
              <p>{calc.formula}</p>
              <p className="src">{calc.source}</p>
            </details>
            <div className="cx-calc-foot">
              <span><BadgeCheck size={14} /> Calculated in your browser from the standard formula, not by AI. Agree the final number with your guide or the institutional statistician.</span>
              <button onClick={() => setValues((p) => ({ ...p, [calcId]: initial(calcId) }))}><RotateCcw size={13} /> Reset</button>
            </div>
          </div>
        </div>
      </section>

      <section className="cx-tk-sec">
        <header className="cx-tk-h">
          <span className="cx-tk-ic"><BadgeCheck size={17} /></span>
          <div>
            <h2>Which statistical test?</h2>
            <p>Answer a few questions about your study to see the usual test, its assumptions, the alternative when they fail, and how to report it.</p>
          </div>
        </header>
        <div className="cx-tk-test">
          <div className="cx-tk-qs">
            <div className="cx-cf">
              <span className="cx-cf-l">What do you want to do?</span>
              <div className="cx-opts">{GOALS.map((g) => <button key={g.id} className={goal === g.id ? "on" : ""} aria-pressed={goal === g.id} onClick={() => setGoal(g.id)}>{g.label}</button>)}</div>
            </div>
            {goal === "survival" ? (
              <div className="cx-cf">
                <span className="cx-cf-l">What are you comparing?</span>
                <div className="cx-opts">
                  <button className={groups === "two" ? "on" : ""} aria-pressed={groups === "two"} onClick={() => setGroups("two")}>Two groups</button>
                  <button className={groups === "many" ? "on" : ""} aria-pressed={groups === "many"} onClick={() => setGroups("many")}>Several groups, or adjusting for other factors</button>
                </div>
              </div>
            ) : (
              <div className="cx-cf">
                <span className="cx-cf-l">What kind of outcome is it?</span>
                <div className="cx-opts">{OUTCOMES.map((o) => <button key={o.id} className={outcome === o.id ? "on" : ""} aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)}>{o.label}</button>)}</div>
              </div>
            )}
            {goal === "compare" && (
              <>
                <div className="cx-cf">
                  <span className="cx-cf-l">How many groups?</span>
                  <div className="cx-opts">
                    <button className={groups === "two" ? "on" : ""} aria-pressed={groups === "two"} onClick={() => setGroups("two")}>Two</button>
                    <button className={groups === "many" ? "on" : ""} aria-pressed={groups === "many"} onClick={() => setGroups("many")}>Three or more</button>
                  </div>
                </div>
                <div className="cx-cf">
                  <span className="cx-cf-l">Are the measurements independent?</span>
                  <div className="cx-opts">
                    <button className={design === "independent" ? "on" : ""} aria-pressed={design === "independent"} onClick={() => setDesign("independent")}>Independent groups</button>
                    <button className={design === "paired" ? "on" : ""} aria-pressed={design === "paired"} onClick={() => setDesign("paired")}>Paired, matched or before and after</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="cx-tk-ans" aria-live="polite">
            <span className="cx-calc-rl">Use</span>
            <h3>{advice.test}</h3>
            <p className="when">{advice.when}</p>
            <dl>
              <dt>Assumptions to check</dt>
              <dd><ul>{advice.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></dd>
              {advice.alternative && (<><dt>If they don't hold</dt><dd>{advice.alternative}</dd></>)}
              <dt>How to report it</dt>
              <dd>{advice.report}</dd>
              <dt>In software</dt>
              <dd className="sw">{advice.software}</dd>
            </dl>
            <div className="cx-calc-acts">
              <button onClick={() => void copy(`${advice.test}\n${advice.when}\nAssumptions: ${advice.assumptions.join("; ")}${advice.alternative ? `\nAlternative: ${advice.alternative}` : ""}\nReport: ${advice.report}`, "Copied")}><Copy size={13} /> Copy</button>
              <button onClick={() => onAsk(`For my thesis I want to ${GOALS.find((g) => g.id === goal)!.label.toLowerCase()}${goal === "survival" ? (groups === "two" ? " between two groups" : " across several groups or adjusting for other factors") : ` with an outcome that is ${OUTCOMES.find((o) => o.id === outcome)!.label.toLowerCase()}`}${goal === "compare" ? `, in ${groups === "two" ? "two" : "three or more"} ${design === "paired" ? "paired" : "independent"} groups` : ""}. The suggested test is ${advice.test}. Explain why, how to check its assumptions, and show a worked example of how to report the result.`)}><MessageSquare size={13} /> Explain with an example</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
