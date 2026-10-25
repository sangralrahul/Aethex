/**
 * Urticaria & Angioedema: acute and chronic urticaria steps (antihistamine up-dosing, omalizumab),
 * UAS7 activity, children's doses, and angioedema red flags.
 */
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { ANGIOEDEMA_FLAGS, uas7Band, urticariaPlan } from "@/lib/cadus/clinic33";

export default function UrticariaView() {
  const [chronic, setChronic] = useState(false);
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("30");
  const [kg, setKg] = useState("");
  const [uas, setUas] = useState("");
  const plan = urticariaPlan(chronic, step, Number(age) || 30, Number(kg) || 0);

  return (
    <section className="cx-page cx-lab cx-urt">
      <header className="cx-page-h"><div><h1>Urticaria &amp; Angioedema</h1><p>Acute and chronic hives step by step (antihistamine up-dosing, omalizumab), disease activity (UAS7), children's doses, and when swelling is dangerous.</p></div></header>
      <div className="cx-c23-row">
        <div className="cx-seg" role="radiogroup" aria-label="Duration">{([[false, "Acute (under 6 weeks)"], [true, "Chronic (6 weeks or more)"]] as const).map(([v, l]) => <button key={l} role="radio" aria-checked={chronic === v} className={chronic === v ? "on" : ""} onClick={() => setChronic(v)} data-ur-chronic={String(v)}>{l}</button>)}</div>
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} data-ur="age" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} data-ur="kg" /></label>
        {chronic && <label className="cx-field"><span>Current step</span><select className="cx-select" value={step} onChange={(e) => setStep(Number(e.target.value))} data-ur="step"><option value={0}>Not treated yet</option><option value={1}>Standard-dose antihistamine</option><option value={2}>Up-dosed antihistamine</option><option value={3}>Omalizumab</option></select></label>}
      </div>
      <div className="cx-cmp-out" data-ur="out"><ol className="cx-c23-steps" data-ur="plan">{plan.map((p) => <li key={p}>{p}</li>)}</ol></div>
      {chronic && <><h4>UAS7 (wheals 0–3 + itch 0–3 each day, for 7 days)</h4><div className="cx-c23-row"><label className="cx-field"><span>UAS7 total (0–42)</span><input className="cx-input" inputMode="numeric" value={uas} onChange={(e) => setUas(e.target.value.replace(/\D/g, "").slice(0, 2))} data-ur="uas" /></label></div>{uas && <p className="cx-set-hint" data-ur="uasout"><b>UAS7 {uas}: {uas7Band(Number(uas))}</b></p>}</>}
      <h4>Angioedema</h4>
      <div className="cx-anc-flags">{ANGIOEDEMA_FLAGS.map((f) => <p key={f} className="high"><TriangleAlert size={13} /> {f}</p>)}</div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> EAACI/GA²LEN/EuroGuiDerm/APAAACI 2022 urticaria guideline. Anaphylaxis: see Emergencies.</p>
    </section>
  );
}
