/**
 * Consent Form Writer: a procedure-specific informed-consent form (or a high-risk, anaesthesia,
 * transfusion or refusal form) in English and the patient's language, with the material risks and
 * their frequency, alternatives, yes/no lines and signature blocks, and a checklist for the talk.
 */
import { useState } from "react";
import { ClipboardCheck, FileSignature, History, Loader2, Printer, Trash2, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { CONSENT_PRESETS, LANGUAGES } from "@/lib/cadus/leaflets";
import { deidentify } from "@/lib/cadus/deidentify";
import { deleteDraft23, readDrafts23, saveDraft23, type Draft23 } from "@/lib/cadus/clinic23";

interface Consent { title: string; english: string; local: string; risks: { risk: string; frequency: string }[]; checklist: string[] }
const KINDS = [["surgery", "Surgery"], ["anaesthesia", "Anaesthesia"], ["procedure", "Procedure"], ["transfusion", "Blood transfusion"], ["high-risk", "High-risk"], ["refusal", "Refusal / LAMA"], ["other", "Other"]] as const;

export default function ConsentView({ generate, friendlyError, toast, onPrint, defaultLanguage, hospital }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  defaultLanguage: string;
  hospital: string;
}) {
  const [kind, setKind] = useState<string>("surgery");
  const [procedure, setProcedure] = useState("");
  const [anaesthesia, setAnaesthesia] = useState("");
  const [patient, setPatient] = useState("");
  const [guardian, setGuardian] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage && defaultLanguage !== "English" && LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "Hindi");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Consent | null>(null);
  const [tab, setTab] = useState<"english" | "local">("english");
  const [past, setPast] = useState<Draft23[]>(() => readDrafts23("consent"));

  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "consent-form", kind, procedure: procedure.trim(), anaesthesia: anaesthesia.trim(), patient: deidentify(patient).text, guardian, language, hospital });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result); setTab("english");
      saveDraft23("consent", r.result.title, r.result);
      setPast(readDrafts23("consent"));
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const both = (c: Consent) => (c.local ? `${c.english}\n\n---\n\n${c.local}` : c.english);

  return (
    <section className="cx-page cx-lab cx-consent">
      <header className="cx-page-h"><div><h1>Consent Form Writer</h1><p>An informed-consent form for the exact procedure, in English and the patient's language, with the risks and how often they happen, the alternatives, separate yes/no lines and signature blocks, as Indian practice expects.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="Kind of consent">{KINDS.map(([v, l]) => <button key={v} role="radio" aria-checked={kind === v} className={kind === v ? "on" : ""} onClick={() => setKind(v)} data-consent-kind={v}>{l}</button>)}</div>
      <div className="cx-roster-in">
        <label className="cx-field"><span>{kind === "refusal" ? "Treatment refused" : "Procedure"}</span><input className="cx-input" value={procedure} onChange={(e) => setProcedure(e.target.value.slice(0, 200))} list="cx-consent23" placeholder="e.g. Laparoscopic cholecystectomy" data-consent="procedure" /><datalist id="cx-consent23">{CONSENT_PRESETS.map((p) => <option key={p} value={p} />)}</datalist></label>
        <label className="cx-field"><span>Anaesthesia (optional)</span><input className="cx-input" value={anaesthesia} onChange={(e) => setAnaesthesia(e.target.value.slice(0, 60))} placeholder="General, spinal, local, sedation" /></label>
      </div>
      <label className="cx-field"><span>Patient details that change the risks (no names)</span><textarea className="cx-input" rows={3} value={patient} onChange={(e) => setPatient(e.target.value.slice(0, 300))} placeholder="e.g. 62M, diabetic, on aspirin, previous laparotomy, BMI 34" data-consent="patient" /></label>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Patient's language</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-consent="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} /> Signed by a guardian (minor, or lacks capacity)</label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || procedure.trim().length < 3} data-consent="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <FileSignature size={14} />} Write the consent form</button></div>
      {res && (
        <div className="cx-cmp-out" data-consent="out">
          {res.risks.length > 0 && <div className="cx-c23-scroll"><table className="cx-c23-table"><thead><tr><th>Risk</th><th>How often</th></tr></thead><tbody>{res.risks.map((r) => <tr key={r.risk}><td>{r.risk}</td><td>{r.frequency}</td></tr>)}</tbody></table></div>}
          {res.local && <div className="cx-seg" role="tablist">{(["english", "local"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} data-consent-tab={t}>{t === "english" ? "English" : language}</button>)}</div>}
          <div className="cx-c23-doc"><MdBlock text={tab === "local" && res.local ? res.local : res.english} /></div>
          {res.checklist.length > 0 && <div className="cx-sc-gaps"><b><ClipboardCheck size={13} /> Before the patient signs:</b><ul>{res.checklist.map((c) => <li key={c}>{c}</li>)}</ul></div>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint(res.title, both(res))} data-consent="print"><Printer size={14} /> Print{res.local ? " both languages" : ""}</button>
            {res.local && <button className="cx-btn" onClick={() => onPrint(res.title, res.local)}><Printer size={14} /> Print {language} only</button>}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <details className="cx-opd-seen"><summary><History size={13} /> Recent forms ({past.length})</summary>
          <ul className="cx-c23-past">{past.map((d) => (
            <li key={d.id}><button className="cx-link" onClick={() => { setRes(d.data as Consent); setTab("english"); }}>{d.title}</button><small>{new Date(d.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small><button className="cx-ib" onClick={() => { deleteDraft23(d.id); setPast(readDrafts23("consent")); }} aria-label="Delete"><Trash2 size={13} /></button></li>
          ))}</ul>
        </details>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Read the form through and change anything that doesn't fit your patient or your hospital's policy. Consent is the conversation; the form records it.</p>
    </section>
  );
}
