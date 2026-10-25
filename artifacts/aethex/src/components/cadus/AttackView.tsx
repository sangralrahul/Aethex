/**
 * Asthma & COPD Attack: severity grading for adults and children, stepwise treatment with doses,
 * COPD exacerbation care with NIV criteria, and the discharge bundle.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { ASTHMA_LIFE, asthmaPlan, asthmaSeverity, ATTACK_DISCHARGE, COPD_ANTHONISEN, copdPlan } from "@/lib/cadus/clinic36";

export default function AttackView() {
  const [tab, setTab] = useState<"asthma" | "copd">("asthma");
  const [v, setV] = useState({ age: "", kg: "", pef: "", rr: "", hr: "", spo2: "", ph: "", co2: "" });
  const [cantTalk, setCantTalk] = useState(false);
  const [life, setLife] = useState<number[]>([]);
  const [highCo2, setHighCo2] = useState(false);
  const [ant, setAnt] = useState<number[]>([]);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-at={k} /></label>;
  const age = Number(v.age) || 30, child = age < 12;
  const level = asthmaSeverity({ child, ageYears: age, pefPct: v.pef ? Number(v.pef) : null, rr: Number(v.rr) || 0, hr: Number(v.hr) || 0, spo2: Number(v.spo2) || 98, cantTalk, lifeSigns: life.length, highCo2 });
  const plan = asthmaPlan(level, child, age, Number(v.kg) || 0);
  const c = copdPlan({ anthonisen: ant.length, purulent: ant.includes(2), ph: v.ph ? Number(v.ph) : null, paco2: v.co2 ? Number(v.co2) : null, rr: Number(v.rr) || 0 });

  return (
    <section className="cx-page cx-lab cx-attack">
      <header className="cx-page-h"><div><h1>Asthma &amp; COPD Attack</h1><p>Grade an asthma attack in adults and children, treat it step by step, manage a COPD exacerbation with NIV criteria, and send the patient home safely.</p></div></header>
      <div className="cx-seg" role="tablist">{([["asthma", "Asthma attack"], ["copd", "COPD exacerbation"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-at-tab={k}>{l}</button>)}</div>
      {tab === "asthma" ? (
        <>
          <div className="cx-c23-row">{n("age", "Age (years)", "30")}{n("kg", "Weight (kg)", "60")}{n("pef", "PEF (% of best or predicted)", "45")}{n("rr", "Respiratory rate", "28")}{n("hr", "Heart rate", "115")}{n("spo2", "SpO2 (%)", "93")}</div>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={cantTalk} onChange={(e) => setCantTalk(e.target.checked)} data-at="talk" /> Can't complete sentences (or feed, in a child)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={highCo2} onChange={(e) => setHighCo2(e.target.checked)} data-at="co2high" /> Raised PaCO2 on blood gas</label>
          </div>
          <h4>Life-threatening signs</h4>
          <div className="cx-imaging-ticks">{ASTHMA_LIFE.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={life.includes(i)} onChange={() => setLife(life.includes(i) ? life.filter((y) => y !== i) : [...life, i])} data-at-life={i} /> {x}</label>)}</div>
          <div className={`cx-cmp-out ${level === "moderate" ? "cx-ac-high" : "cx-st-out"}`} data-at="out" data-level={level}>
            <h3 className="cx-lab-h3">{level[0].toUpperCase() + level.slice(1)} asthma{child ? " (child)" : ""}</h3>
            <ol className="cx-c23-steps">{plan.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </>
      ) : (
        <>
          <h4>Cardinal symptoms (Anthonisen)</h4>
          <div className="cx-imaging-ticks">{COPD_ANTHONISEN.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ant.includes(i)} onChange={() => setAnt(ant.includes(i) ? ant.filter((y) => y !== i) : [...ant, i])} data-at-ant={i} /> {x}</label>)}</div>
          <div className="cx-c23-row">{n("ph", "pH", "7.30")}{n("co2", "PaCO2 (mmHg)", "60")}{n("rr", "Respiratory rate", "26")}</div>
          <div className={`cx-cmp-out ${c.niv ? "cx-st-out" : "cx-ac-high"}`} data-at="copd" data-niv={String(c.niv)}><ol className="cx-c23-steps">{c.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
        </>
      )}
      <h4>Before discharge</h4>
      <ul>{ATTACK_DISCHARGE.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Wind size={13} /> BTS/SIGN 2019, GINA 2024, GOLD 2025, BTS NIV 2016. <TriangleAlert size={13} /> A normal or rising CO2 in a breathless asthmatic is a danger sign.</p>
    </section>
  );
}
