/**
 * Suicide Risk & Safety Plan: Columbia screening questions with triage, factors to explore, and a
 * printable safety plan written with the person.
 */
import { useState } from "react";
import { LifeBuoy, Printer, TriangleAlert } from "lucide-react";
import { CSSRS, cssrs, SAFETY_STEPS, safetyPlanMd, SUICIDE_FACTORS, type SafetyPlan } from "@/lib/cadus/clinic35";

export default function SuicideView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"screen" | "plan">("screen");
  const [ans, setAns] = useState<boolean[]>([false, false, false, false, false, false]);
  const [plan, setPlan] = useState<SafetyPlan>({ warning: "", coping: "", distraction: "", people: "", professionals: "", safe: "", reasons: "" });
  const r = cssrs(ans);
  const show = (i: number) => i < 2 || i === 5 || ans[1];

  return (
    <section className="cx-page cx-lab cx-suicide">
      <header className="cx-page-h"><div><h1>Suicide Risk &amp; Safety Plan</h1><p>Ask directly with the Columbia screening questions, act on the answers, and write a safety plan together with the person.</p></div></header>
      <div className="cx-cmp-out cx-ac-in"><p><b>In crisis now?</b> Emergency 112 · Tele-MANAS <b>14416</b> or 1-800-891-4416 (free, 24 hours, many languages).</p></div>
      <div className="cx-seg" role="tablist">{([["screen", "Screening"], ["plan", "Safety plan"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-sr-tab={k}>{l}</button>)}</div>
      {tab === "screen" ? (
        <>
          <div className="cx-imaging-ticks">{CSSRS.map((q, i) => show(i) && <label key={q} className="cx-pa-mine"><input type="checkbox" checked={ans[i]} onChange={(e) => setAns(ans.map((v, j) => (j === i ? e.target.checked : i === 1 && !e.target.checked && j >= 2 && j <= 4 ? false : v)))} data-sr-q={i} /> {q}</label>)}</div>
          {!ans[1] && <p className="cx-set-hint">Questions 3 to 5 appear if the answer to question 2 is yes.</p>}
          <div className={`cx-cmp-out ${r.level === "high" ? "cx-st-out" : r.level === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-sr="out" data-level={r.level}>
            <h3 className="cx-lab-h3">{r.level === "none" ? "No current suicidal thoughts reported" : `${r.level[0].toUpperCase() + r.level.slice(1)} urgency`}</h3>
            <ul>{r.actions.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <h4>Also explore</h4>
          <ul>{SUICIDE_FACTORS.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="cx-set-hint">Risk scales cannot predict who will die by suicide: use them to start the conversation and decide how quickly to act, not to label anyone low risk. Under the Mental Healthcare Act 2017 (section 115), a person who attempts suicide is presumed to be under severe stress and must be cared for, not punished.</p>
        </>
      ) : (
        <>
          {SAFETY_STEPS.map((s) => <label key={s.key} className="cx-field"><span>{s.label}</span><textarea className="cx-input" rows={2} value={plan[s.key]} onChange={(e) => setPlan({ ...plan, [s.key]: e.target.value.slice(0, 600) })} placeholder={s.hint} data-sr-plan={s.key} /></label>)}
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("My safety plan", safetyPlanMd(plan))} data-sr="print"><Printer size={14} /> Print the safety plan</button></div>
          <p className="cx-set-hint">Write it in the person's own words and language, give them a copy, and agree who else should have one.</p>
        </>
      )}
      <p className="cx-rs-foot"><LifeBuoy size={13} /> Columbia Suicide Severity Rating Scale (screener), Stanley–Brown safety plan, NICE NG225. <TriangleAlert size={13} /> Asking about suicide does not increase risk. Never leave a high-risk person alone.</p>
    </section>
  );
}
