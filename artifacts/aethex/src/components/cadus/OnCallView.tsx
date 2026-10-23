/**
 * On-call Helper: a nurse calls about a ward patient at night. Pick the call, add what the nurse said
 * and the patient, and Cadus gives the first minutes: see now or not, what to ask, check and order,
 * what not to miss, when to escalate, and a note for the case sheet.
 */
import { useState } from "react";
import { AlertOctagon, Copy, Loader2, PhoneCall, Siren, TriangleAlert } from "lucide-react";

const CALLS = ["Fever", "Low blood pressure", "Chest pain", "Low oxygen / breathless", "Low urine output", "Agitation / confusion", "High or low blood sugar", "Fall", "Seizure", "High blood pressure", "Fast heart rate", "Bleeding", "Abnormal potassium", "Pain not controlled", "Other"];
interface Plan { urgency: "now" | "soon" | "can wait"; why: string; askNurse: string[]; check: string[]; orders: string[]; dontMiss: string[]; escalate: string[]; note: string }
const URGENCY = { now: "See the patient now", soon: "See within 30 minutes", "can wait": "Can wait: review on the next round" };

export default function OnCallView({ generate, friendlyError, toast }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [call, setCall] = useState("");
  const [said, setSaid] = useState("");
  const [patient, setPatient] = useState("");
  const [vitals, setVitals] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const run = async () => {
    if (!call) { toast("What is the call about?"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "oncall", call, said: said.trim(), patient: patient.trim(), vitals: vitals.trim() });
      if (!r?.result) throw new Error("No plan came back");
      setPlan(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const sec = (title: string, items: string[], cls = "") => items.length > 0 && <div className={`cx-sim-card ${cls}`}><h3>{title}</h3><ul>{items.map((x) => <li key={x}>{x}</li>)}</ul></div>;
  return (
    <section className="cx-page cx-lab cx-oncall">
      <header className="cx-page-h"><div><h1>On-call Helper</h1><p>The ward calls about a patient. Pick what it's about and add what you know: Cadus tells you whether to go now, what to ask the nurse, what to check and order, what not to miss and when to call your senior.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="The call is about">{CALLS.map((c) => <button key={c} role="radio" aria-checked={call === c} className={call === c ? "on" : ""} onClick={() => setCall(c)} data-oncall-call={c}>{c}</button>)}</div>
      <label className="cx-field"><span>What the nurse says</span><input className="cx-input" value={said} onChange={(e) => setSaid(e.target.value.slice(0, 2000))} placeholder="e.g. Temp 102.4, shivering, BP 96/60, HR 118" data-oncall="said" /></label>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>The patient</span><input className="cx-input" value={patient} onChange={(e) => setPatient(e.target.value.slice(0, 2000))} placeholder="e.g. 70M, day 3 after TURP, diabetic, CKD 3" data-oncall="patient" /></label>
        <label className="cx-field"><span>Vitals (if not above)</span><input className="cx-input" value={vitals} onChange={(e) => setVitals(e.target.value.slice(0, 200))} placeholder="BP, HR, RR, SpO₂, GCS, sugar" /></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !call} data-oncall="go">{busy ? <><Loader2 size={15} className="cx-rot" /> Thinking…</> : <><PhoneCall size={15} /> What do I do?</>}</button></div>
      {plan && (
        <div className="cx-cmp-out" data-oncall="out">
          <div className={`cx-oncall-urg u-${plan.urgency.replace(" ", "-")}`} data-oncall-urgency={plan.urgency}>{plan.urgency === "now" ? <Siren size={18} /> : <AlertOctagon size={18} />}<div><b>{URGENCY[plan.urgency]}</b><small>{plan.why}</small></div></div>
          <div className="cx-sim-cols">
            {sec("Ask the nurse now", plan.askNurse)}
            {sec("Orders", plan.orders)}
            {sec("Check when you get there", plan.check)}
            {sec("Don't miss", plan.dontMiss, "warn")}
            {sec("Call your senior or ICU if", plan.escalate, "bad")}
          </div>
          {plan.note && <div className="cx-sc-note"><h3 className="cx-lab-h3">Note for the case sheet</h3><p style={{ whiteSpace: "pre-wrap" }}>{plan.note}</p><button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(plan.note); toast("Copied"); }}><Copy size={14} /> Copy</button></div>}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Help for thinking, not a replacement for seeing the patient. When in doubt, go and see them, and call your senior early.</p>
    </section>
  );
}
