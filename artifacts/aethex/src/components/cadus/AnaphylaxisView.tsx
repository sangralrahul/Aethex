/**
 * Anaphylaxis & Allergy Plan: IM adrenaline by age and weight, the refractory pathway, how long to
 * observe, what to do before discharge, and a written allergy action plan in the patient's language.
 */
import { useState } from "react";
import { Siren, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { MdBlock } from "./LiveAnswer";
import { adrenalineIm, allergyPlanMd, ANAPHYLAXIS_AFTER, anaphylaxisObserve, anaphylaxisRefractory } from "@/lib/cadus/clinic34";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function AnaphylaxisView(h: H) {
  const [age, setAge] = useState("30");
  const [kg, setKg] = useState("");
  const [o, setO] = useState({ doses: 1, severe: false, asthma: false, lateOrBiphasic: false, remote: false, goodQuickResponse: true, hasKit: false });
  const [trigger, setTrigger] = useState("");
  const a = Number(age) || 30;
  const ad = adrenalineIm(a, Number(kg) || undefined);
  const ref = anaphylaxisRefractory(Number(kg) || 0, a < 16);
  const obs = anaphylaxisObserve(o);
  const md = allergyPlanMd("", trigger, `${ad.mcg} micrograms (${a >= 12 ? "adult" : "child"} auto-injector or ${ad.ml} ml of 1 mg/ml)`);

  return (
    <section className="cx-page cx-lab cx-ana">
      <header className="cx-page-h"><div><h1>Anaphylaxis &amp; Allergy Plan</h1><p>IM adrenaline by age and weight, what to do when it is not working, how long to observe, and a written allergy action plan in the patient's language.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-an2="age" /></label>
        <label className="cx-field"><span>Weight (kg, optional)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} data-an2="kg" /></label>
      </div>
      <div className="cx-cmp-out cx-st-out" data-an2="dose"><h3 className="cx-lab-h3" data-an2="adr">{ad.text}</h3><p>Lie the patient flat (legs raised; sit up if breathless; left side if pregnant); call for help; oxygen; IV access; fluid bolus if hypotensive.</p></div>
      <h4>Not improving after two IM doses (refractory)</h4>
      <ol className="cx-c23-steps" data-an2="refractory">{ref.map((r) => <li key={r}>{r}</li>)}</ol>
      <h4>How long to observe</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Adrenaline doses given</span><select className="cx-select" value={o.doses} onChange={(e) => setO({ ...o, doses: Number(e.target.value) })} data-an2="doses">{[1, 2, 3].map((n) => <option key={n} value={n}>{n}{n === 3 ? " or more" : ""}</option>)}</select></label>
        {([["severe", "Severe reaction"], ["asthma", "Severe asthma"], ["lateOrBiphasic", "Late presentation or previous biphasic reaction"], ["remote", "Far from emergency care"], ["goodQuickResponse", "Good response within 5–10 minutes"], ["hasKit", "Adrenaline kit supplied and trained"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.checked })} data-an2={k} /> {l}</label>)}
      </div>
      <p className="cx-set-hint" data-an2="observe"><b>{obs}</b></p>
      <h4>Before discharge</h4><ul>{ANAPHYLAXIS_AFTER.map((x) => <li key={x}>{x}</li>)}</ul>
      <h4>Allergy action plan</h4>
      <label className="cx-field"><span>Allergic to</span><input className="cx-input" value={trigger} onChange={(e) => setTrigger(e.target.value.slice(0, 80))} placeholder="e.g. peanuts, bee stings, diclofenac" data-an2="trigger" /></label>
      <div className="cx-c23-doc" data-an2="plan"><MdBlock text={md} /></div>
      <HandoutActions md={md} title="Allergy action plan" {...h} />
      <p className="cx-rs-foot"><Siren size={13} /> Resuscitation Council UK 2021 anaphylaxis guideline and WAO 2020. <TriangleAlert size={13} /> Adrenaline IM is the only first-line treatment; never give the 1 mg/ml strength IV as a bolus.</p>
    </section>
  );
}
