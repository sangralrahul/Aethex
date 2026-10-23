/**
 * Clinical paperwork from notes, ready for the letterhead: Letters and certificates (referral,
 * fitness, leave, insurance or PM-JAY pre-authorisation, any other letter), the PvPI suspected
 * adverse drug reaction form, and the cause-of-death sequence for the MCCD. Gaps stay as
 * placeholders and are listed; nothing is invented.
 */
import { useEffect, useState } from "react";
import { ClipboardList, Copy, FileSignature, Gavel, Printer, ScrollText, ShieldAlert, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { adrMarkdown, mccdMarkdown, newDoc, readDocs, saveDocs, type AdrReport, type DocKind, type Mccd, type SavedDoc } from "@/lib/cadus/clinic20";

export type DocTool = "letters" | "adr" | "mccd";
type LetterKind = "referral" | "fitness" | "leave" | "insurance" | "other";
const LETTERS: { id: LetterKind; label: string; hint: string }[] = [
  { id: "referral", label: "Referral letter", hint: "To a specialist or a higher centre" },
  { id: "fitness", label: "Fitness certificate", hint: "Job, sport, travel, joining duty" },
  { id: "leave", label: "Medical leave", hint: "Sickness certificate for work or college" },
  { id: "insurance", label: "Insurance / PM-JAY pre-auth", hint: "Clinical justification for the TPA or scheme" },
  { id: "other", label: "Other letter", hint: "Describe what you need" },
];
const META: Record<DocTool, { title: string; intro: string; icon: typeof ScrollText; placeholder: string; example: string }> = {
  letters: { title: "Letters & Certificates", icon: ScrollText, intro: "Referral letters, fitness and leave certificates, and insurance or PM-JAY pre-authorisation, written from your notes and printed on your letterhead. Anything missing is left as a placeholder for you to fill.", placeholder: "Clinical notes: presentation, findings, results, treatment, and what you need the letter to say", example: "54M, T2DM 10 y, HTN. Exertional chest pain 3 weeks, TMT strongly positive at stage 2. ECG: ST depression V4-V6. Echo EF 50%, no RWMA. On aspirin, atorvastatin 40, metoprolol 25 BD. Needs coronary angiography." },
  adr: { title: "ADR Report (PvPI)", icon: ShieldAlert, intro: "Describe a suspected adverse drug reaction. Cadus fills the Pharmacovigilance Programme of India reporting form, assesses causality (WHO-UMC) and suggests management. Submit it to your ADR monitoring centre or through the PvPI reporting app.", placeholder: "What happened, which medicines (dose, route, dates), when it started, what was done and the outcome", example: "32F, started cotrimoxazole DS 1 BD on 2 Oct for UTI. On 9 Oct fever, painful mouth ulcers, target lesions on trunk, conjunctival redness, about 5% skin detachment. Drug stopped 9 Oct, admitted, IV fluids and supportive care. Improving by 16 Oct. No previous reaction. Also on paracetamol 650 SOS." },
  mccd: { title: "Cause of Death (MCCD)", icon: Gavel, intro: "From a case summary, Cadus writes the cause-of-death sequence for the Medical Certificate of Cause of Death (Form 4 or 4A): immediate, antecedent and underlying causes with intervals, contributing conditions and the ICD-10 code, and flags modes of dying and medico-legal cases.", placeholder: "Case summary: illnesses and their duration, the final illness and its course, investigations, how the patient died", example: "68M, T2DM 15 y, CKD stage 4 for 2 y. Admitted with fever and dysuria 5 days; urine culture E. coli; blood culture E. coli. Developed septic shock on day 2 despite meropenem and noradrenaline, AKI on CKD, died on day 4 after cardiac arrest." },
};
const SIGN_MODE: Record<DocKind, string> = { referral: "referral", fitness: "certificate", leave: "certificate", insurance: "referral", other: "referral", adr: "", mccd: "death" };

export default function DocWriterView({ tool, generate, friendlyError, toast, onPrint, doctor }: {
  tool: DocTool;
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string, mode: string) => void;
  /** The doctor's name and qualifications from the letterhead, for the signature block. */
  doctor: string;
}) {
  const meta = META[tool];
  const [kind, setKind] = useState<LetterKind>("referral");
  const [f, setF] = useState({ patient: "", to: "", purpose: "", dates: "", urgency: "Routine", scheme: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [docs, setDocs] = useState<SavedDoc[]>(readDocs);
  const [openId, setOpenId] = useState("");
  const [extra, setExtra] = useState<{ missing: string[]; warnings?: string[]; medicolegal?: boolean; causality?: string } | null>(null);
  useEffect(() => saveDocs(docs), [docs]);
  const mine = docs.filter((d) => (tool === "letters" ? !["adr", "mccd"].includes(d.kind) : d.kind === tool));
  const open = mine.find((d) => d.id === openId) ?? null;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const words = f.notes.trim() ? f.notes.trim().split(/\s+/).length : 0;

  const run = async () => {
    if (words < 6) { toast("Add the notes: a few lines at least"); return; }
    setBusy(true);
    try {
      const notes = deidentify(f.notes).text;
      const label = deidentify(f.patient).text.slice(0, 40);
      let doc: SavedDoc;
      if (tool === "letters") {
        const r = await generate({ action: "letter", kind, notes, patient: label, to: f.to, purpose: f.purpose, dates: f.dates, urgency: kind === "referral" ? f.urgency : "", scheme: f.scheme, doctor, today: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) });
        if (!r?.result) throw new Error("No letter came back");
        doc = newDoc(kind, label, r.result.title, r.result.body);
        setExtra({ missing: r.result.missing ?? [] });
      } else {
        const r = await generate({ action: tool, notes });
        if (!r?.result) throw new Error("Nothing came back");
        if (tool === "adr") {
          const a = r.result as AdrReport;
          doc = newDoc("adr", label || [a.patient.initials, a.patient.age, a.patient.sex].filter(Boolean).join(" "), `ADR: ${a.suspects[0]?.drug ?? "suspected reaction"}`, adrMarkdown(a));
          setExtra({ missing: a.missing, causality: a.causality.category });
        } else {
          const m = r.result as Mccd;
          doc = newDoc("mccd", label, `Cause of death: ${m.underlying}`, mccdMarkdown(m));
          setExtra({ missing: [], warnings: m.warnings, medicolegal: m.medicolegal });
        }
      }
      setDocs((l) => [doc, ...l]);
      setOpenId(doc.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const Icon = meta.icon;
  return (
    <section className={`cx-page cx-lab cx-docw t-${tool}`}>
      <header className="cx-page-h"><div><h1>{meta.title}</h1><p>{meta.intro}</p></div></header>
      {tool === "letters" && (
        <div className="cx-docw-kinds" role="radiogroup" aria-label="Kind of letter">
          {LETTERS.map((l) => <button key={l.id} role="radio" aria-checked={kind === l.id} className={kind === l.id ? "on" : ""} onClick={() => setKind(l.id)} data-docw-kind={l.id}><b>{l.label}</b><small>{l.hint}</small></button>)}
        </div>
      )}
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Patient (initials, age, sex)</span><input className="cx-input" value={f.patient} onChange={set("patient")} placeholder="e.g. R.K., 54 M" maxLength={60} data-docw="patient" /></label>
        {tool === "letters" && kind === "referral" && <>
          <label className="cx-field"><span>Referred to</span><input className="cx-input" value={f.to} onChange={set("to")} placeholder="e.g. Cardiologist, AIIMS" maxLength={200} data-docw="to" /></label>
          <label className="cx-field"><span>Urgency</span><select className="cx-select" value={f.urgency} onChange={set("urgency")}>{["Routine", "Soon (within a week)", "Urgent (today)", "Emergency"].map((u) => <option key={u}>{u}</option>)}</select></label>
        </>}
        {tool === "letters" && (kind === "fitness" || kind === "other") && <label className="cx-field"><span>{kind === "fitness" ? "Purpose" : "What the letter is for"}</span><input className="cx-input" value={f.purpose} onChange={set("purpose")} placeholder={kind === "fitness" ? "e.g. joining a government job" : "e.g. letter to the school about diet"} maxLength={200} data-docw="purpose" /></label>}
        {tool === "letters" && kind === "leave" && <label className="cx-field"><span>Rest advised</span><input className="cx-input" value={f.dates} onChange={set("dates")} placeholder="e.g. 20 to 26 October 2026" maxLength={120} data-docw="dates" /></label>}
        {tool === "letters" && kind === "insurance" && <label className="cx-field"><span>Insurer, TPA or scheme</span><input className="cx-input" value={f.scheme} onChange={set("scheme")} placeholder="e.g. PM-JAY, or the TPA's name" maxLength={120} data-docw="scheme" /></label>}
      </div>
      <label className="cx-field"><span>Notes</span><textarea className="cx-input" rows={7} value={f.notes} onChange={set("notes")} placeholder={meta.placeholder} maxLength={12000} data-docw="notes" /></label>
      <div className="cx-sc-acts">
        <button className="cx-btn primary" onClick={() => void run()} disabled={busy || words < 6} data-docw="go"><FileSignature size={15} /> {busy ? "Writing…" : tool === "letters" ? `Write ${LETTERS.find((l) => l.id === kind)!.label.toLowerCase()}` : tool === "adr" ? "Fill the ADR form" : "Write the cause of death"}</button>
        {!f.notes && <button className="cx-btn" onClick={() => setF({ ...f, notes: meta.example })}><Sparkles size={14} /> Try an example</button>}
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Names and phone numbers typed here are hidden before sending. Read every line before you sign.</p>

      {open ? (
        <div className="cx-cmp-out" data-docw="out">
          {extra?.medicolegal && <div className="cx-ltv-urgent" data-docw="mlc"><ShieldAlert size={15} /><div><b>Medico-legal case</b><p>This death may need to be reported to the police. Don't issue the certificate until that is done.</p></div></div>}
          {extra?.warnings && extra.warnings.length > 0 && <div className="cx-sc-gaps" data-docw="warnings"><b>Check:</b> {extra.warnings.join(" · ")}</div>}
          {extra?.missing && extra.missing.length > 0 && <div className="cx-sc-gaps" data-docw="missing"><b>Fill in:</b> {extra.missing.join(" · ")}</div>}
          {extra?.causality && <p className="cx-docw-caus" data-docw="causality">Causality (WHO-UMC): <b>{extra.causality}</b></p>}
          <div className="cx-sc-note" data-docw="doc"><MdBlock text={open.md} /></div>
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint(open.title, open.md, SIGN_MODE[open.kind])} data-docw="print"><Printer size={14} /> Print on letterhead</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(open.md); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-ib" onClick={() => { setDocs((l) => l.filter((d) => d.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ) : mine.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Icon size={20} /></span><h3>Nothing yet</h3><p>Write the notes above, or try the example.</p></div>
      ) : null}
      {mine.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent</span></p>
          {mine.slice(0, 12).map((d) => <button key={d.id} className={`cx-sc-row ${d.id === openId ? "on" : ""}`} onClick={() => { setOpenId(d.id); setExtra(null); }}><b><ClipboardList size={13} /> {d.title}</b><small>{[d.label, new Date(d.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })].filter(Boolean).join(" · ")}</small></button>)}
        </div>
      )}
    </section>
  );
}
