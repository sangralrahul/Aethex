/**
 * Palliative Care Helper: oral morphine starting and titration (regular, breakthrough, slow-release,
 * subcutaneous over 24 hours) and the control of symptoms at the end of life.
 */
import { useState } from "react";
import { HandHeart, Printer, TriangleAlert } from "lucide-react";
import { EOL_SYMPTOMS, morphinePlan } from "@/lib/cadus/clinic27";

export default function PalliativeView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"pain" | "symptoms">("pain");
  const [naive, setNaive] = useState(true);
  const [mg, setMg] = useState("");
  const [frail, setFrail] = useState(false);
  const [renal, setRenal] = useState(false);
  const p = morphinePlan({ naive, last24Mg: naive ? undefined : Number(mg) || undefined, frail, renal });
  const md = () => [`# Morphine plan`, `- **Regular:** ${p.regular}`, `- **Breakthrough:** ${p.breakthrough}`, `- Total in 24 hours about ${p.total24} mg oral (${p.sc24} mg subcutaneous over 24 hours in a syringe driver)`, "", ...p.notes.map((n) => `- ${n}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-pall">
      <header className="cx-page-h"><div><h1>Palliative Care Helper</h1><p>Oral morphine for cancer and other serious pain, started and titrated safely, and the control of breathlessness, nausea, secretions and agitation at the end of life.</p></div></header>
      <div className="cx-seg" role="tablist">{([["pain", "Pain and morphine"], ["symptoms", "End-of-life symptoms"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-pl-tab={v}>{l}</button>)}</div>
      {tab === "pain" ? (
        <>
          <div className="cx-c23-row">
            <div className="cx-seg" role="radiogroup" aria-label="Morphine so far">{([[true, "Not on morphine yet"], [false, "Already on morphine"]] as const).map(([v, l]) => <button key={String(v)} role="radio" aria-checked={naive === v} className={naive === v ? "on" : ""} onClick={() => setNaive(v)} data-pl-naive={String(v)}>{l}</button>)}</div>
            {!naive && <label className="cx-field"><span>Total oral morphine in the last 24 h (regular + breakthrough, mg)</span><input className="cx-input" inputMode="decimal" value={mg} onChange={(e) => setMg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-pl="mg" /></label>}
          </div>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={frail} onChange={(e) => setFrail(e.target.checked)} data-pl="frail" /> Elderly or frail</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={renal} onChange={(e) => setRenal(e.target.checked)} data-pl="renal" /> Kidney impairment</label>
          </div>
          <div className="cx-cmp-out" data-pl="out">
            <div className="cx-sim-stats">
              <div><b data-pl="regular">{p.regular}</b><small>regular</small></div>
              <div><b>{p.breakthrough}</b><small>breakthrough</small></div>
              <div><b>{p.sc24} mg</b><small>SC morphine over 24 h if unable to swallow</small></div>
            </div>
            <ul>{p.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            <p className="cx-set-hint">Next day: add up all the morphine taken in 24 hours; the new regular dose is that total divided by 6, every 4 hours, and the breakthrough dose is the same. Increases are usually 30–50% at a time.</p>
            <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Morphine plan", md())} data-pl="print"><Printer size={14} /> Print</button></div>
          </div>
        </>
      ) : (
        <div className="cx-c23-two" data-pl="symptoms">{EOL_SYMPTOMS.map((s) => <div key={s.symptom}><h4>{s.symptom}</h4><ul>{s.steps.map((x) => <li key={x}>{x}</li>)}</ul></div>)}</div>
      )}
      <p className="cx-rs-foot"><HandHeart size={13} /> Based on WHO and Pallium India practice. <TriangleAlert size={13} /> Doses are starting points for adults; titrate to effect and side effects, and seek palliative care advice for complex pain.</p>
    </section>
  );
}
