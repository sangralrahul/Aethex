/**
 * Teleconsultation Note: the record of a video, audio or text consultation under India's
 * Telemedicine Practice Guidelines (2020): identity and consent, what could and couldn't be
 * examined, the diagnosis and advice, and an e-prescription where every medicine is checked
 * against Lists O, A and B and the prohibited list for this mode and kind of consultation.
 */
import { useState } from "react";
import { Check, FilePen, History, Loader2, Printer, Trash2, TriangleAlert, Video, X } from "lucide-react";
import DictateBox from "./DictateBox";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { deleteDraft23, readDrafts23, saveDraft23, type Draft23 } from "@/lib/cadus/clinic23";

interface Rx { drug: string; dose: string; frequency: string; duration: string; list: string; why: string; allowed: boolean; rule: string }
interface Tele { note: string; diagnosis: string; rx: Rx[]; advice: string[]; redFlags: string[]; followUp: string; emergency: boolean; inPerson: boolean; gaps: string[] }

export function teleMarkdown(t: Tele, doctor: string, withBlocked = false): string {
  const rx = t.rx.filter((r) => r.allowed || withBlocked);
  return [
    t.note,
    rx.length ? `\n## Prescription\n\n| # | Medicine | Dose | Frequency | Duration |\n|---|---|---|---|---|\n${rx.map((r, i) => `| ${i + 1} | ${r.drug} | ${r.dose} | ${r.frequency} | ${r.duration} |`).join("\n")}` : "",
    t.advice.length ? `\n## Advice\n${t.advice.map((a) => `- ${a}`).join("\n")}` : "",
    t.redFlags.length ? `\n## Go to a hospital at once if\n${t.redFlags.map((a) => `- ${a}`).join("\n")}` : "",
    t.followUp ? `\n**Follow-up:** ${t.followUp}` : "",
    `\n_Teleconsultation under the Telemedicine Practice Guidelines, 2020. ${doctor || "[Name, qualification, registration number]"}_`,
  ].filter(Boolean).join("\n");
}

export default function TeleconsultView({ generate, friendlyError, toast, onPrint, doctor, language }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  doctor: string;
  language: string;
}) {
  const [mode, setMode] = useState<"video" | "audio" | "text">("video");
  const [kind, setKind] = useState<"first" | "follow-up">("first");
  const [initiated, setInitiated] = useState<"patient" | "doctor">("patient");
  const [patient, setPatient] = useState("");
  const [caregiver, setCaregiver] = useState("");
  const [consent, setConsent] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Tele | null>(null);
  const [past, setPast] = useState<Draft23[]>(() => readDrafts23("tele"));

  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "teleconsult", mode, kind, initiated, consent: initiated === "doctor" ? consent : false, patient: deidentify(patient).text, caregiver: deidentify(caregiver).text, notes: deidentify(notes).text });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result);
      saveDraft23("tele", `Teleconsultation: ${r.result.diagnosis || "note"}`, r.result);
      setPast(readDrafts23("tele"));
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const blocked = res ? res.rx.filter((r) => !r.allowed) : [];

  return (
    <section className="cx-page cx-lab cx-tele">
      <header className="cx-page-h"><div><h1>Teleconsultation Note</h1><p>The record and e-prescription for a video, audio or text consultation, following India's Telemedicine Practice Guidelines (2020): identity, consent, what could be examined, and every medicine checked against what may be prescribed in this kind of consultation.</p></div></header>
      <div className="cx-c23-row">
        <div className="cx-seg" role="radiogroup" aria-label="Mode">{(["video", "audio", "text"] as const).map((m) => <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)} data-tele-mode={m}>{m === "video" ? "Video" : m === "audio" ? "Phone / audio" : "Text / chat"}</button>)}</div>
        <div className="cx-seg" role="radiogroup" aria-label="Consultation">{(["first", "follow-up"] as const).map((k) => <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)} data-tele-kind={k}>{k === "first" ? "First consultation" : "Follow-up"}</button>)}</div>
        <div className="cx-seg" role="radiogroup" aria-label="Started by">{(["patient", "doctor"] as const).map((k) => <button key={k} role="radio" aria-checked={initiated === k} className={initiated === k ? "on" : ""} onClick={() => setInitiated(k)} data-tele-init={k}>{k === "patient" ? "Patient called" : "I called"}</button>)}</div>
      </div>
      {initiated === "doctor" && <label className="cx-pa-mine" data-tele="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> The patient gave explicit consent (needed when the doctor or a health worker starts the consultation)</label>}
      <div className="cx-roster-in">
        <label className="cx-field"><span>Patient: age, sex and how identity was checked (no names)</span><input className="cx-input" value={patient} onChange={(e) => setPatient(e.target.value.slice(0, 200))} placeholder="e.g. 32F, confirmed name, age and address on video" data-tele="patient" /></label>
        <label className="cx-field"><span>Caregiver, if one spoke (no names)</span><input className="cx-input" value={caregiver} onChange={(e) => setCaregiver(e.target.value.slice(0, 120))} placeholder="e.g. husband" /></label>
      </div>
      <DictateBox value={notes} onChange={setNotes} rows={6} lang={language === "Hindi" ? "hi-IN" : "en-IN"} toast={toast} label="Consultation notes" placeholder={"e.g. Sore throat and fever 100 °F for 2 days, no breathlessness, eating well. Throat looks red on video, no rash. Plan paracetamol and warm gargles; review in 3 days."} />
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || notes.trim().split(/\s+/).length < 6 || (initiated === "doctor" && !consent)} data-tele="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Video size={14} />} Write the record</button></div>
      {res && (
        <div className="cx-cmp-out" data-tele="out">
          {res.inPerson && <div className="cx-sc-gaps" data-tele="inperson"><b><TriangleAlert size={13} /> {res.emergency ? "Emergency: give first-aid advice and refer immediately." : "This patient needs to be seen in person."}</b></div>}
          {res.rx.length > 0 && (
            <div className="cx-c23-scroll"><table className="cx-c23-table" data-tele="rx"><thead><tr><th>Medicine</th><th>Dose</th><th>List</th><th>Allowed now</th></tr></thead>
              <tbody>{res.rx.map((r) => <tr key={r.drug} data-tele-drug={r.drug} data-allowed={r.allowed ? "yes" : "no"}><td><b>{r.drug}</b><small>{[r.frequency, r.duration].filter(Boolean).join(" · ")}</small></td><td>{r.dose}</td><td>{r.list === "prohibited" ? "Prohibited" : r.list === "unclear" ? "?" : `List ${r.list}`}</td><td className={r.allowed ? "cx-tele-ok" : "cx-tele-no"}>{r.allowed ? <Check size={14} /> : <X size={14} />} {r.rule}</td></tr>)}</tbody></table></div>
          )}
          {blocked.length > 0 && <p className="cx-set-hint" data-tele="blocked">{blocked.length} medicine{blocked.length === 1 ? " is" : "s are"} left out of the printed prescription: {blocked.map((b) => b.drug).join(", ")}.</p>}
          {res.gaps.length > 0 && <div className="cx-sc-gaps"><b>Complete before signing:</b> {res.gaps.join(" · ")}</div>}
          <div className="cx-c23-doc"><MdBlock text={teleMarkdown(res, doctor)} /></div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("Teleconsultation", teleMarkdown(res, doctor))} data-tele="print"><Printer size={14} /> Print record and e-prescription</button></div>
        </div>
      )}
      {past.length > 0 && (
        <details className="cx-opd-seen"><summary><History size={13} /> Recent ({past.length})</summary>
          <ul className="cx-c23-past">{past.map((d) => (
            <li key={d.id}><button className="cx-link" onClick={() => setRes(d.data as Tele)}>{d.title}</button><small>{new Date(d.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small><button className="cx-ib" onClick={() => { deleteDraft23(d.id); setPast(readDrafts23("tele")); }} aria-label="Delete"><Trash2 size={13} /></button></li>
          ))}</ul>
        </details>
      )}
      <p className="cx-rs-foot"><FilePen size={13} /> Check the list for each medicine against the current guidelines; the prescribing doctor is responsible. Names are removed before sending.</p>
    </section>
  );
}
