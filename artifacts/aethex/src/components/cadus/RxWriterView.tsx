/**
 * Prescription Writer: the diagnosis and the patient's details in, a drafted prescription out,
 * every medicine checked against the Cadus formulary (reference doses, kidney notes, NLEM) and the
 * interaction checker in the browser. Opens in the prescriber to edit, sign and print.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, FilePen, FlaskConical, Pill, Printer, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { checkText } from "@/lib/cadus/interactions";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { prescriptionMarkdown, readPrescriptions, savePrescriptions } from "@/lib/cadus/formulary";
import { draftToPrescription, formularyMatch, type RxDraft } from "@/lib/cadus/clinic20";

const EXAMPLES = ["Community-acquired pneumonia, outpatient", "Uncomplicated UTI in a non-pregnant woman", "Acute gastroenteritis with some dehydration", "Newly diagnosed type 2 diabetes, HbA1c 8.4", "Hypertension stage 1", "Acute migraine"];

export default function RxWriterView({ generate, friendlyError, toast, onPrint, onOpenPrescriber, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onOpenPrescriber: () => void;
  defaultLanguage: string;
}) {
  const [f, setF] = useState({ diagnosis: "", age: "", sex: "", weight: "", renal: "", hepatic: "", pregnancy: "", allergies: "", current: "", setting: "OPD", notes: "" });
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "English");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<RxDraft | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const patient = [f.age && `${f.age} y`, f.sex, f.weight && `${f.weight} kg`].filter(Boolean).join(" ");
  const child = Number(f.age) > 0 && Number(f.age) < 12;

  const checks = useMemo(() => {
    if (!draft) return { ix: [], rows: [] as ReturnType<typeof formularyMatch>[] };
    const rows = draft.items.map((i) => formularyMatch(i.generic));
    const ix = checkText([...draft.items.map((i) => i.generic), f.current].filter(Boolean).join(", ")).matches;
    return { ix, rows };
  }, [draft, f.current]);

  const run = async () => {
    if (f.diagnosis.trim().length < 3) { toast("Give the diagnosis or problem"); return; }
    if (child && !f.weight) toast("Add the child's weight for weight-based doses");
    setBusy(true);
    try {
      const r = await generate({ action: "rx-write", ...f, notes: deidentify(f.notes).text, current: deidentify(f.current).text, language });
      if (!r?.result) throw new Error("No prescription came back");
      setDraft(r.result);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const open = () => {
    if (!draft) return;
    const p = draftToPrescription(draft, patient);
    savePrescriptions([p, ...readPrescriptions()]);
    onOpenPrescriber();
    toast("Opened in the prescriber: edit, sign and print");
  };

  return (
    <section className="cx-page cx-lab cx-rxw">
      <header className="cx-page-h"><div><h1>Prescription Writer</h1><p>Give the diagnosis and the patient's details. Cadus drafts the prescription with doses adjusted for age, weight, kidneys and pregnancy, checks it against the formulary and for interactions, and writes the advice in the patient's language. You review and sign.</p></div></header>
      <label className="cx-field"><span>Diagnosis or problem</span>
        <input className="cx-input" value={f.diagnosis} onChange={set("diagnosis")} placeholder="e.g. Community-acquired pneumonia, CURB-65 of 1, outpatient" maxLength={300} data-rxw="dx" />
      </label>
      {!f.diagnosis && <div className="cx-cb-ideas">{EXAMPLES.map((x) => <button key={x} onClick={() => setF({ ...f, diagnosis: x })}>{x}</button>)}</div>}
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={f.age} onChange={set("age")} maxLength={5} data-rxw="age" /></label>
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={f.sex} onChange={set("sex")}><option value="">—</option><option>male</option><option>female</option></select></label>
        <label className="cx-field"><span>Weight (kg){child ? " *" : ""}</span><input className="cx-input" inputMode="decimal" value={f.weight} onChange={set("weight")} maxLength={6} data-rxw="weight" /></label>
        <label className="cx-field"><span>Kidney function</span><input className="cx-input" value={f.renal} onChange={set("renal")} placeholder="e.g. eGFR 38, or normal" maxLength={80} /></label>
        <label className="cx-field"><span>Liver</span><input className="cx-input" value={f.hepatic} onChange={set("hepatic")} placeholder="e.g. Child-Pugh B" maxLength={80} /></label>
        {f.sex !== "male" && <label className="cx-field"><span>Pregnancy / breastfeeding</span><input className="cx-input" value={f.pregnancy} onChange={set("pregnancy")} placeholder="e.g. 20 weeks pregnant" maxLength={80} /></label>}
        <label className="cx-field"><span>Allergies</span><input className="cx-input" value={f.allergies} onChange={set("allergies")} placeholder="e.g. penicillin (rash)" maxLength={160} data-rxw="allergy" /></label>
        <label className="cx-field"><span>Setting</span><select className="cx-select" value={f.setting} onChange={set("setting")}>{["OPD", "Ward", "Emergency", "Discharge", "Teleconsultation"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="cx-field"><span>Advice in</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-rxw="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
      </div>
      <label className="cx-field"><span>Current medicines</span><input className="cx-input" value={f.current} onChange={set("current")} placeholder="e.g. metformin 500 BD, atorvastatin 20" maxLength={600} data-rxw="current" /></label>
      <label className="cx-field"><span>Anything else (optional)</span><textarea className="cx-input" rows={2} value={f.notes} onChange={set("notes")} placeholder="Findings, preferences, what's available at your centre" maxLength={1200} /></label>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || f.diagnosis.trim().length < 3} data-rxw="go"><FilePen size={15} /> {busy ? "Drafting…" : "Draft prescription"}</button></div>

      {draft ? (
        <div className="cx-cmp-out" data-rxw="out">
          {draft.check.length > 0 && <div className="cx-sc-gaps" data-rxw="check"><b><ClipboardCheck size={14} /> Check before signing:</b> {draft.check.join(" · ")}</div>}
          {checks.ix.length > 0 && (
            <div className="cx-rxw-ix" data-rxw="ix">
              {checks.ix.map((m, i) => <p key={i} className={`sev-${m.severity}`}><ShieldAlert size={14} /> <b>{m.a} + {m.b}</b> ({m.severity}): {m.effect} {m.action}</p>)}
            </div>
          )}
          <h3 className="cx-lab-h3"><Pill size={15} /> {draft.diagnosis || f.diagnosis}{patient && <small> · {patient}</small>}</h3>
          <ol className="cx-rxw-items">
            {draft.items.map((i, k) => {
              const m = checks.rows[k];
              return (
                <li key={k} data-rxw-item={k}>
                  <div><b>{i.generic}</b> {i.strength} {i.form.toLowerCase()} · {i.dose} {i.route !== "Oral" ? i.route : ""} · {i.frequency} · {i.duration}{i.instructions && <> · <i>{i.instructions}</i></>}</div>
                  {i.why && <small className="cx-rxw-why">{i.why}</small>}
                  {m ? (
                    <small className="cx-rxw-ref" data-rxw-ref="found"><BadgeCheck size={12} /> Formulary{m.dosing?.nlem ? " · NLEM" : ""}{m.dosing ? `: usual adult ${m.dosing.adult}${child && m.dosing.child ? `; child ${m.dosing.child}` : ""}${m.dosing.max ? `; max ${m.dosing.max}` : ""}${f.renal && m.dosing.renal ? `; kidneys: ${m.dosing.renal}` : ""}` : ""}</small>
                  ) : <small className="cx-rxw-ref none" data-rxw-ref="none"><AlertTriangle size={12} /> Not in the Cadus formulary: check the dose yourself</small>}
                </li>
              );
            })}
          </ol>
          {draft.advice && <div className="cx-sc-note"><h3 className="cx-lab-h3">Advice</h3><MdBlock text={draft.advice} />{draft.adviceLocal && <div className="cx-lf-text" lang="und"><MdBlock text={draft.adviceLocal} /></div>}</div>}
          <div className="cx-sim-cols">
            {draft.tests.length > 0 && <div className="cx-sim-card"><h3><FlaskConical size={14} /> Tests</h3><ul>{draft.tests.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {draft.redFlags.length > 0 && <div className="cx-sim-card warn"><h3>Come back at once if</h3><ul>{draft.redFlags.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          </div>
          {draft.followUp && <p><b>Follow-up:</b> {draft.followUp}</p>}
          {draft.notes && <p className="cx-set-hint">{draft.notes}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={open} data-rxw="open"><Sparkles size={14} /> Edit and sign in the prescriber</button>
            <button className="cx-btn" onClick={() => onPrint("Prescription", prescriptionMarkdown(draftToPrescription(draft, patient)))} data-rxw="print"><Printer size={14} /> Print on letterhead</button>
          </div>
        </div>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><FilePen size={20} /></span><h3>A safer first draft</h3><p>Generic names, Indian strengths, doses for this patient, interactions checked, and advice in their language.</p></div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> A draft for a registered practitioner to review. Check every dose, allergy and interaction before you sign. Names typed in the notes are hidden before sending.</p>
    </section>
  );
}
