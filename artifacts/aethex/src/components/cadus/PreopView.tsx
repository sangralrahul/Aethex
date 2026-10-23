/**
 * Pre-op Assessment: the planned surgery and the patient's details, with the RCRI ticked on this
 * device; Cadus gives the ASA grade, the risks, which tests are actually needed, what to do with each
 * medicine before surgery, fasting, optimisation and a PAC note to print.
 */
import { useState } from "react";
import { ClipboardCheck, HeartPulse, Loader2, Printer, Stethoscope, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { RCRI_ITEMS, rcri } from "@/lib/cadus/clinic22";

interface Preop { asa: string; asaWhy: string; emergency: boolean; risks: string[]; tests: { test: string; why: string }[]; meds: { drug: string; advice: string }[]; fasting: string; optimise: string[]; decision: string; anaesthesia: string[]; summary: string }

export default function PreopView({ generate, friendlyError, toast, onPrint }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [surgery, setSurgery] = useState("");
  const [urgency, setUrgency] = useState<"elective" | "emergency">("elective");
  const [anaes, setAnaes] = useState("");
  const [notes, setNotes] = useState("");
  const [ticks, setTicks] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Preop | null>(null);
  const score = rcri(ticks);
  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "preop", surgery, urgency, anaesthesia: anaes, rcri: score.score, notes: deidentify(notes).text });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const md = res ? `# Pre-anaesthetic check-up\n\n**Surgery:** ${surgery}${urgency === "emergency" ? " (emergency)" : ""}  \n**ASA:** ${res.asa}${res.emergency || urgency === "emergency" ? "E" : ""} · **RCRI:** ${score.score} (${score.risk})  \n**Decision:** ${res.decision}\n\n${res.summary}` : "";
  return (
    <section className="cx-page cx-lab cx-preop">
      <header className="cx-page-h"><div><h1>Pre-op Assessment</h1><p>For a pre-anaesthetic check-up: the ASA grade, perioperative risks, the tests this patient actually needs, what to do with each medicine before surgery, fasting and whether to proceed, with a PAC note to print.</p></div></header>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Surgery</span><input className="cx-input" value={surgery} onChange={(e) => setSurgery(e.target.value.slice(0, 200))} placeholder="e.g. Laparoscopic cholecystectomy" data-preop="surgery" /></label>
        <div className="cx-field"><span>Urgency</span><div className="cx-seg"><button className={urgency === "elective" ? "on" : ""} onClick={() => setUrgency("elective")}>Elective</button><button className={urgency === "emergency" ? "on" : ""} onClick={() => setUrgency("emergency")}>Emergency</button></div></div>
        <label className="cx-field"><span>Planned anaesthesia</span><select className="cx-select" value={anaes} onChange={(e) => setAnaes(e.target.value)}><option value="">Not decided</option>{["General", "Spinal", "Epidural", "Regional block", "Sedation / MAC", "Local"].map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <label className="cx-field"><span>The patient</span><textarea className="cx-input" rows={6} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 10000))} placeholder="Age, sex, weight; illnesses; effort tolerance; airway; medicines with doses; allergies; previous anaesthesia; results (Hb, sugar, creatinine, ECG, echo)" data-preop="notes" /></label>
      <div className="cx-preop-rcri" data-preop="rcri">
        <p className="cx-gl"><span><HeartPulse size={13} /> Revised Cardiac Risk Index</span></p>
        {RCRI_ITEMS.map((i) => <label key={i.id} className="cx-pa-mine"><input type="checkbox" checked={ticks.includes(i.id)} onChange={(e) => setTicks(e.target.checked ? [...ticks, i.id] : ticks.filter((x) => x !== i.id))} data-rcri={i.id} /> {i.label}</label>)}
        <p className="cx-preop-score" data-preop="score"><b>RCRI {score.score}</b>: major cardiac complication risk about {score.risk} (Lee 1999)</p>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !surgery.trim() || notes.trim().split(/\s+/).length < 6} data-preop="go">{busy ? <><Loader2 size={15} className="cx-rot" /> Assessing…</> : <><Stethoscope size={15} /> Assess</>}</button></div>
      {res && (
        <div className="cx-cmp-out" data-preop="out">
          <div className={`cx-oncall-urg u-${res.decision.startsWith("proceed") ? (res.decision === "proceed" ? "can-wait" : "soon") : "now"}`}><ClipboardCheck size={18} /><div><b>ASA {res.asa}{res.emergency || urgency === "emergency" ? "E" : ""} · {res.decision}</b><small>{res.asaWhy}</small></div></div>
          <div className="cx-sim-cols">
            {res.risks.length > 0 && <div className="cx-sim-card warn"><h3>Risks</h3><ul>{res.risks.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {res.tests.length > 0 && <div className="cx-sim-card"><h3>Tests needed</h3><ul>{res.tests.map((t) => <li key={t.test}><b>{t.test}</b>: {t.why}</li>)}</ul></div>}
            {res.optimise.length > 0 && <div className="cx-sim-card"><h3>Optimise first</h3><ul>{res.optimise.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {res.anaesthesia.length > 0 && <div className="cx-sim-card"><h3>Anaesthesia</h3><ul>{res.anaesthesia.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          </div>
          {res.meds.length > 0 && <table className="cx-vround-diff" data-preop="meds"><thead><tr><th>Medicine</th><th>Before surgery</th></tr></thead><tbody>{res.meds.map((m) => <tr key={m.drug}><th>{m.drug}</th><td>{m.advice}</td></tr>)}</tbody></table>}
          {res.fasting && <p><b>Fasting:</b> {res.fasting}</p>}
          <div className="cx-sc-note"><MdBlock text={res.summary} /></div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("Pre-anaesthetic check-up", md)}><Printer size={14} /> Print PAC note</button></div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> A support for the anaesthetist's own assessment; follow your institution's protocols.</p>
    </section>
  );
}
