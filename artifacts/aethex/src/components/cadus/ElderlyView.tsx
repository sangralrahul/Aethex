/**
 * Elderly Care: the Clinical Frailty Scale, the 4AT delirium screen, falls risk with lying and standing
 * BP, and deprescribing prompts for medicines that harm older people.
 */
import { useState } from "react";
import { Accessibility, TriangleAlert } from "lucide-react";
import { CFS, DEPRESCRIBE, fallsRisk, fourAt, orthostatic, type FourAtIn } from "@/lib/cadus/clinic29";

export default function ElderlyView() {
  const [tab, setTab] = useState<"frailty" | "4at" | "falls" | "meds">("frailty");
  const [cfs, setCfs] = useState(0);
  const [a, setA] = useState<FourAtIn>({ alert: 0, amt4: 0, months: 0, acute: 0 });
  const [f, setF] = useState({ fell: false, unsteady: false, worried: false, tug: "" });
  const [bp, setBp] = useState({ ls: "", ld: "", ss: "", sd: "" });
  const [meds, setMeds] = useState<string[]>([]);
  const at = fourAt(a);
  const fr = fallsRisk(f.fell, f.unsteady, f.worried, f.tug ? Number(f.tug) : undefined);
  const oh = orthostatic(Number(bp.ls), Number(bp.ld), Number(bp.ss), Number(bp.sd));
  const n3 = (s: string) => s.replace(/\D/g, "").slice(0, 3);
  const sel = <K extends keyof FourAtIn>(k: K, label: string, opts: [FourAtIn[K], string][]) => (
    <label className="cx-field"><span>{label}</span><select className="cx-select" value={String(a[k])} onChange={(e) => setA({ ...a, [k]: Number(e.target.value) as FourAtIn[K] })} data-el4={k}>{opts.map(([v, l]) => <option key={l} value={String(v)}>{l} ({v})</option>)}</select></label>
  );

  return (
    <section className="cx-page cx-lab cx-elderly">
      <header className="cx-page-h"><div><h1>Elderly Care</h1><p>The Clinical Frailty Scale, the 4AT screen for delirium, falls risk with lying and standing BP, and medicines worth stopping in older people.</p></div></header>
      <div className="cx-seg" role="tablist">{([["frailty", "Frailty"], ["4at", `4AT ${at.score}`], ["falls", "Falls"], ["meds", `Medicines${meds.length ? ` (${meds.length})` : ""}`]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ec-tab={k}>{l}</button>)}</div>
      {tab === "frailty" && (
        <>
          <p className="cx-set-hint">How was the person 2 weeks before this illness?</p>
          <div className="cx-cfs" data-ec="cfs">{CFS.map((c) => <button key={c.score} className={`cx-cfs-b ${cfs === c.score ? "on" : ""}`} onClick={() => setCfs(c.score)} aria-pressed={cfs === c.score} data-cfs={c.score}><b>{c.score}</b><span><b>{c.label}</b><small>{c.text}</small></span></button>)}</div>
          {cfs > 0 && <div className="cx-cmp-out" data-ec="cfs-out"><h3 className="cx-lab-h3">CFS {cfs}: {CFS[cfs - 1].label}</h3><p>{cfs >= 5 && cfs <= 8 ? "Frail: comprehensive geriatric assessment, medicine review, and a conversation about goals and escalation (ICU, CPR) early." : cfs === 9 ? "Terminally ill: focus on comfort and the person's wishes." : "Not frail: usual care; reassess with each admission."}</p></div>}
          <p className="cx-set-hint">The CFS is validated for people 65 and over; not for younger people, stable single disabilities or learning disability.</p>
        </>
      )}
      {tab === "4at" && (
        <>
          <div className="cx-nihss">
            {sel("alert", "1 Alertness", [[0, "Normal, or mild sleepiness under 10 s after waking"], [4, "Clearly abnormal"]])}
            {sel("amt4", "2 AMT4 (age, date of birth, place, year)", [[0, "No mistakes"], [1, "1 mistake"], [2, "2 or more mistakes, or untestable"]])}
            {sel("months", "3 Months of the year backwards", [[0, "7 or more correct"], [1, "Starts but under 7, or refuses"], [2, "Untestable"]])}
            {sel("acute", "4 Acute change or fluctuating course", [[0, "No"], [4, "Yes"]])}
          </div>
          <div className="cx-cmp-out" data-ec="4at"><h3 className="cx-lab-h3" data-ec="4at-score">4AT {at.score}</h3><p>{at.text}</p></div>
        </>
      )}
      {tab === "falls" && (
        <>
          <div className="cx-c23-row">
            {([["fell", "Fell in the last year"], ["unsteady", "Feels unsteady standing or walking"], ["worried", "Worries about falling"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-ec={k} /> {l}</label>)}
            <label className="cx-field"><span>Timed Up and Go (seconds)</span><input className="cx-input" inputMode="decimal" value={f.tug} onChange={(e) => setF({ ...f, tug: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} data-ec="tug" /></label>
          </div>
          <div className={`cx-cmp-out ${fr.high ? "cx-ac-high" : ""}`} data-ec="falls"><p>{fr.text}</p></div>
          <h4>Lying and standing BP</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Lying (after 5 min) systolic</span><input className="cx-input" inputMode="numeric" value={bp.ls} onChange={(e) => setBp({ ...bp, ls: n3(e.target.value) })} data-ec="ls" /></label>
            <label className="cx-field"><span>diastolic</span><input className="cx-input" inputMode="numeric" value={bp.ld} onChange={(e) => setBp({ ...bp, ld: n3(e.target.value) })} /></label>
            <label className="cx-field"><span>Standing (1 and 3 min) systolic</span><input className="cx-input" inputMode="numeric" value={bp.ss} onChange={(e) => setBp({ ...bp, ss: n3(e.target.value) })} data-ec="ss" /></label>
            <label className="cx-field"><span>diastolic</span><input className="cx-input" inputMode="numeric" value={bp.sd} onChange={(e) => setBp({ ...bp, sd: n3(e.target.value) })} /></label>
          </div>
          {oh && <p className="cx-set-hint" data-ec="oh"><b>{oh.positive ? "Orthostatic hypotension" : "No orthostatic hypotension"}</b>: {oh.drop}.{oh.positive ? " Review BP-lowering and other culprit drugs, fluids, compression stockings, rise slowly." : ""}</p>}
        </>
      )}
      {tab === "meds" && (
        <>
          <p className="cx-set-hint">Tick what the patient takes:</p>
          <div className="cx-imaging-ticks" data-ec="meds">{DEPRESCRIBE.map((d) => <label key={d.id} className="cx-pa-mine"><input type="checkbox" checked={meds.includes(d.id)} onChange={() => setMeds(meds.includes(d.id) ? meds.filter((x) => x !== d.id) : [...meds, d.id])} data-ec-med={d.id} /> {d.label}</label>)}</div>
          {meds.length > 0 && <div className="cx-cmp-out" data-ec="advice"><h4>Review</h4><ul>{DEPRESCRIBE.filter((d) => meds.includes(d.id)).map((d) => <li key={d.id}><b>{d.label.split(" (")[0]}:</b> {d.why}</li>)}</ul></div>}
        </>
      )}
      <p className="cx-rs-foot"><Accessibility size={13} /> Clinical Frailty Scale v2 (Rockwood), 4AT, NICE falls guidance, STOPP/START v3. <TriangleAlert size={13} /> Stop or change medicines with the patient and family, one at a time where possible.</p>
    </section>
  );
}
