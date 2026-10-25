/**
 * Hypothermia & Drowning: Swiss staging with rewarming and cardiac arrest changes, and drowning
 * resuscitation and discharge.
 */
import { useState } from "react";
import { Snowflake, TriangleAlert } from "lucide-react";
import { DROWNING, hypoStage } from "@/lib/cadus/clinic37";

export default function HypothermiaView() {
  const [tab, setTab] = useState<"cold" | "drown">("cold");
  const [temp, setTemp] = useState("");
  const [conscious, setConscious] = useState(true);
  const [shiver, setShiver] = useState(true);
  const [vitals, setVitals] = useState(true);
  const h = hypoStage(temp ? Number(temp) : null, conscious, shiver, vitals);
  return (
    <section className="cx-page cx-lab cx-hypothermia">
      <header className="cx-page-h"><div><h1>Hypothermia &amp; Drowning</h1><p>Stage hypothermia from the temperature or the clinical picture, rewarm safely, change cardiac arrest care when cold, and manage drowning.</p></div></header>
      <div className="cx-seg" role="tablist">{([["cold", "Hypothermia"], ["drown", "Drowning"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ht-tab={k}>{l}</button>)}</div>
      {tab === "cold" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Core temperature (°C, blank if unknown)</span><input className="cx-input" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="30" data-ht="temp" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={conscious} onChange={(e) => setConscious(e.target.checked)} data-ht="conscious" /> Conscious</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={shiver} onChange={(e) => setShiver(e.target.checked)} data-ht="shiver" /> Shivering</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={vitals} onChange={(e) => setVitals(e.target.checked)} data-ht="vitals" /> Signs of life</label>
          </div>
          <div className={`cx-cmp-out ${h.stage.startsWith("HT IV") || h.stage.startsWith("HT III") ? "cx-st-out" : h.stage.startsWith("Not") ? "cx-ac-in" : "cx-ac-high"}`} data-ht="out"><h3 className="cx-lab-h3">{h.stage}</h3><ol className="cx-c23-steps">{h.plan.map((s) => <li key={s}>{s}</li>)}</ol></div>
          <p className="cx-set-hint">Measure core temperature with an oesophageal probe (intubated) or epitympanic thermometer; ordinary thermometers read falsely low or high.</p>
        </>
      ) : <ol className="cx-c23-steps" data-ht="drown">{DROWNING.map((s) => <li key={s}>{s}</li>)}</ol>}
      <p className="cx-rs-foot"><Snowflake size={13} /> ERC 2021 special circumstances, Wilderness Medical Society 2019. <TriangleAlert size={13} /> Check glucose and look for the cause: alcohol, sepsis, hypothyroidism, stroke, old age.</p>
    </section>
  );
}
