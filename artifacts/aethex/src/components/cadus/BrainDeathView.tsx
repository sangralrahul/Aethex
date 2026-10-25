/**
 * Brain-stem Death & Organ Donation: preconditions, brain-stem reflexes, the apnoea test, the
 * legal process in India and donor management targets.
 */
import { useState } from "react";
import { HeartHandshake, TriangleAlert } from "lucide-react";
import { apnoeaTest, BSD_INDIA, BSD_PRECONDITIONS, BSD_REFLEXES, DONOR_TARGETS } from "@/lib/cadus/clinic39";

export default function BrainDeathView() {
  const [tab, setTab] = useState<"test" | "donor">("test");
  const [pre, setPre] = useState<number[]>([]);
  const [ref, setRef] = useState<number[]>([]);
  const [co2, setCo2] = useState({ base: "", end: "" });
  const [effort, setEffort] = useState(false);
  const [aborted, setAborted] = useState(false);
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const allPre = pre.length === BSD_PRECONDITIONS.length, allRef = ref.length === BSD_REFLEXES.length;
  const ap = co2.base && co2.end ? apnoeaTest(Number(co2.base), Number(co2.end), effort, aborted) : null;
  return (
    <section className="cx-page cx-lab cx-braindeath">
      <header className="cx-page-h"><div><h1>Brain-stem Death &amp; Organ Donation</h1><p>Preconditions, brain-stem reflex tests and the apnoea test, the legal process in India, and donor care until retrieval.</p></div></header>
      <div className="cx-seg" role="tablist">{([["test", "Certification"], ["donor", "Donor care"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-bd-tab={k}>{l}</button>)}</div>
      {tab === "test" ? (
        <>
          <h4>1. Preconditions (all must be met)</h4>
          <div className="cx-imaging-ticks">{BSD_PRECONDITIONS.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={pre.includes(i)} onChange={() => tg(pre, setPre, i)} data-bd-pre={i} /> {x}</label>)}</div>
          <h4>2. Brain-stem reflexes (all absent)</h4>
          <div className="cx-imaging-ticks">{BSD_REFLEXES.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ref.includes(i)} onChange={() => tg(ref, setRef, i)} data-bd-ref={i} /> {x}</label>)}</div>
          <h4>3. Apnoea test</h4>
          <p className="cx-set-hint">Pre-oxygenate with 100% oxygen for 10 minutes with PaCO2 35–45; disconnect with oxygen at 6 L/min via a catheter in the tube; watch for 8–10 minutes; repeat the gas.</p>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Starting PaCO2 (mmHg)</span><input className="cx-input" inputMode="numeric" value={co2.base} onChange={(e) => setCo2({ ...co2, base: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-bd="base" /></label>
            <label className="cx-field"><span>Final PaCO2 (mmHg)</span><input className="cx-input" inputMode="numeric" value={co2.end} onChange={(e) => setCo2({ ...co2, end: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-bd="end" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={effort} onChange={(e) => setEffort(e.target.checked)} data-bd="effort" /> Any breathing effort</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={aborted} onChange={(e) => setAborted(e.target.checked)} data-bd="aborted" /> Stopped for instability</label>
          </div>
          {ap && <div className={`cx-cmp-out ${ap.result === "positive" ? "cx-ac-in" : "cx-ac-high"}`} data-bd="apnoea" data-result={ap.result}><p><b>{ap.text}</b></p></div>}
          <div className={`cx-cmp-out ${allPre && allRef && ap?.result === "positive" ? "cx-ac-in" : ""}`} data-bd="summary"><p><b>{allPre && allRef && ap?.result === "positive" ? "This set of tests is consistent with brain-stem death. A second set at least 6 hours later is required." : `Not complete: preconditions ${pre.length}/${BSD_PRECONDITIONS.length}, reflexes absent ${ref.length}/${BSD_REFLEXES.length}, apnoea ${ap?.result ?? "not done"}.`}</b></p></div>
          <h4>In India</h4><ul>{BSD_INDIA.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      ) : <ol className="cx-c23-steps" data-bd="donor">{DONOR_TARGETS.map((s) => <li key={s}>{s}</li>)}</ol>}
      <p className="cx-rs-foot"><HeartHandshake size={13} /> Transplantation of Human Organs and Tissues Act and Rules (2014), NOTTO guidance, ISCCM. <TriangleAlert size={13} /> Follow your hospital's certified protocol and forms; talk to the family with compassion and time.</p>
    </section>
  );
}
