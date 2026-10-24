/**
 * Asthma & COPD Plans: the GINA step from symptoms and control, the GOLD group and treatment, inhaler
 * technique, and a green/yellow/red action plan in the patient's language.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { actionPlanMarkdown, GINA_STEPS, ginaControl, ginaNext, ginaStart, goldGroup, goldTreatment, INHALER_TECHNIQUE, type AsthmaSymptoms } from "@/lib/cadus/clinic27";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function AsthmaView(h: H) {
  const [tab, setTab] = useState<"asthma" | "copd" | "inhaler" | "plan">("asthma");
  const [sym, setSym] = useState<AsthmaSymptoms>("monthly");
  const [severe, setSevere] = useState(false);
  const [onStep, setOnStep] = useState(0);
  const [ctl, setCtl] = useState({ dayMoreThan2: false, night: false, relieverMoreThan2: false, limited: false });
  const [copd, setCopd] = useState({ mod: "0", hosp: "0", mmrc: "1", cat: "", eos: "" });
  const [plan, setPlan] = useState({ name: "", maintenance: "Budesonide-formoterol 200/6, 1 inhalation twice daily", reliever: "Budesonide-formoterol 200/6, 1 inhalation when needed", pef: "" });
  const control = ginaControl(ctl);
  const g = goldGroup({ modExacerbations: Number(copd.mod) || 0, hospitalised: Number(copd.hosp) || 0, mmrc: Number(copd.mmrc) || 0, cat: copd.cat ? Number(copd.cat) : undefined });
  const md = actionPlanMarkdown({ name: plan.name, maintenance: plan.maintenance, reliever: plan.reliever, bestPef: Number(plan.pef) || undefined });

  return (
    <section className="cx-page cx-lab cx-asthma">
      <header className="cx-page-h"><div><h1>Asthma &amp; COPD Plans</h1><p>The GINA step for asthma and the GOLD group for COPD, inhaler technique to teach, and an action plan for the patient in their language.</p></div></header>
      <div className="cx-seg" role="tablist">{([["asthma", "Asthma"], ["copd", "COPD"], ["inhaler", "Inhaler technique"], ["plan", "Action plan"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-as-tab={v}>{l}</button>)}</div>
      {tab === "asthma" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>On treatment now?</span><select className="cx-select" value={onStep} onChange={(e) => setOnStep(Number(e.target.value))} data-as="onstep"><option value={0}>Not yet: choose the starting step</option>{GINA_STEPS.map((s) => <option key={s.step} value={s.step}>On step {s.step}</option>)}</select></label>
          </div>
          {onStep === 0 ? (
            <>
              <div className="cx-oncall-calls" role="radiogroup" aria-label="Symptoms">{([["rare", "Symptoms less than twice a month"], ["monthly", "Twice a month or more, not daily"], ["most-days", "Most days, or waking once a week or more"], ["daily-night", "Daily, waking at night, low lung function"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={sym === v} className={sym === v ? "on" : ""} onClick={() => setSym(v)} data-as-sym={v}>{l}</button>)}</div>
              <label className="cx-pa-mine"><input type="checkbox" checked={severe} onChange={(e) => setSevere(e.target.checked)} /> Presenting with a severe attack (also give a short course of oral steroids)</label>
              <div className="cx-cmp-out" data-as="start"><h3 className="cx-lab-h3">Start at step {ginaStart(sym, severe)}</h3><p>{GINA_STEPS[ginaStart(sym, severe) - 1].treatment}</p></div>
            </>
          ) : (
            <>
              <p className="cx-set-hint">In the last 4 weeks, has the patient had:</p>
              <div className="cx-c23-row">{([["dayMoreThan2", "Daytime symptoms more than twice a week"], ["night", "Any night waking from asthma"], ["relieverMoreThan2", "Reliever for symptoms more than twice a week"], ["limited", "Any activity limited by asthma"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={ctl[k]} onChange={(e) => setCtl({ ...ctl, [k]: e.target.checked })} data-as-ctl={k} /> {l}</label>)}</div>
              <div className="cx-cmp-out" data-as="review"><h3 className="cx-lab-h3" data-as="control">{control[0].toUpperCase() + control.slice(1)}</h3><p>{ginaNext(onStep, control)}</p></div>
            </>
          )}
          <div className="cx-c23-scroll"><table className="cx-c23-table"><thead><tr><th>Step</th><th>Treatment (GINA track 1, age 12 and over)</th></tr></thead><tbody>{GINA_STEPS.map((s) => <tr key={s.step}><td>{s.step}</td><td>{s.treatment}</td></tr>)}</tbody></table></div>
        </>
      )}
      {tab === "copd" && (
        <>
          <div className="cx-c23-row">
            {([["mod", "Moderate exacerbations in the last year", "0"], ["hosp", "Hospital admissions for COPD in the last year", "0"], ["mmrc", "mMRC breathlessness (0–4)", "1"], ["cat", "CAT score (optional)", "12"], ["eos", "Blood eosinophils /µL (optional)", "300"]] as const).map(([k, l, ph]) => <label key={k} className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={copd[k]} onChange={(e) => setCopd({ ...copd, [k]: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder={ph} data-as-copd={k} /></label>)}
          </div>
          <div className="cx-cmp-out" data-as="gold"><h3 className="cx-lab-h3" data-as="group">GOLD group {g}</h3><ul>{goldTreatment(g, copd.eos ? Number(copd.eos) : undefined).map((t) => <li key={t}>{t}</li>)}</ul></div>
        </>
      )}
      {tab === "inhaler" && (
        <div className="cx-c23-two" data-as="technique">
          <div><h4>Metered-dose inhaler with a spacer</h4><ol className="cx-c23-steps">{INHALER_TECHNIQUE.mdi.map((s) => <li key={s}>{s}</li>)}</ol></div>
          <div><h4>Dry powder inhaler (Rotahaler, Revolizer, Turbuhaler)</h4><ol className="cx-c23-steps">{INHALER_TECHNIQUE.dpi.map((s) => <li key={s}>{s}</li>)}</ol></div>
        </div>
      )}
      {tab === "plan" && (
        <>
          <div className="cx-roster-in">
            <label className="cx-field"><span>Every day (maintenance)</span><input className="cx-input" value={plan.maintenance} onChange={(e) => setPlan({ ...plan, maintenance: e.target.value.slice(0, 160) })} data-as-plan="maintenance" /></label>
            <label className="cx-field"><span>Reliever</span><input className="cx-input" value={plan.reliever} onChange={(e) => setPlan({ ...plan, reliever: e.target.value.slice(0, 160) })} data-as-plan="reliever" /></label>
          </div>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Patient (initials, optional)</span><input className="cx-input" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value.slice(0, 40) })} /></label>
            <label className="cx-field"><span>Best peak flow (L/min, optional)</span><input className="cx-input" inputMode="numeric" value={plan.pef} onChange={(e) => setPlan({ ...plan, pef: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="400" data-as-plan="pef" /></label>
          </div>
          <div className="cx-asthma-zones" data-as="plan">{md.split("\n## ").slice(1).map((z) => <div key={z} className={`z-${z.split(":")[0].toLowerCase()}`}><b>{z.split("\n")[0]}</b>{z.split("\n").slice(1).filter(Boolean).map((l) => <p key={l}>{l.replace(/^- /, "• ")}</p>)}</div>)}</div>
          <HandoutActions md={md} title="Asthma action plan" {...h} />
        </>
      )}
      <p className="cx-rs-foot"><Wind size={13} /> GINA 2024 and GOLD 2025. <TriangleAlert size={13} /> Not for children under 12 (GINA has separate steps); confirm the diagnosis with spirometry where possible.</p>
    </section>
  );
}
