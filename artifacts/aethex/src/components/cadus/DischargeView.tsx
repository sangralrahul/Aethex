/**
 * Discharge Summary: the case notes (typed, from the ward list, or photos and PDFs of the
 * case sheet) written up as a structured discharge summary by the stronger model, with
 * what the notes are missing, and advice for the patient in their language.
 */
import { useEffect, useRef, useState } from "react";
import { BedDouble, Copy, FileText, FileOutput, MessageCircle, Paperclip, Printer, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { attachmentPayload, formatSize, type Attachment } from "@/lib/cadus/files";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { dischargeMarkdown, readDischarges, saveDischarges, sid, type DischargeRecord } from "@/lib/cadus/studio";

export interface DischargeWardPatient { id: string; bed: string; label: string; diagnosis: string; problems: string; meds: string; plan: string; admittedOn?: string }

export default function DischargeView({ generate, readFile, friendlyError, toast, onPrint, defaultLanguage, ward }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string, large?: boolean) => void;
  defaultLanguage: string;
  ward: DischargeWardPatient[];
}) {
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [department, setDepartment] = useState("");
  const [admitted, setAdmitted] = useState("");
  const [discharged, setDischarged] = useState(() => new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState("");
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "English");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<DischargeRecord[]>(readDischarges);
  const [openId, setOpenId] = useState("");
  const [tab, setTab] = useState<"summary" | "patient">("summary");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => saveDischarges(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;
  const words = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const ready = words >= 12 || files.length > 0;

  const fromWard = (id: string) => {
    const p = ward.find((x) => x.id === id);
    if (!p) return;
    setLabel(p.label);
    if (p.admittedOn) setAdmitted(p.admittedOn);
    setNotes([`Bed ${p.bed}, ${p.label}. Diagnosis: ${p.diagnosis}`, p.problems && `Problems and course: ${p.problems}`, p.meds && `Medicines: ${p.meds}`, p.plan && `Plan: ${p.plan}`].filter(Boolean).join("\n"));
    toast("Filled from the ward list. Add the course and results.");
  };
  const addFiles = async (fl: FileList | null) => {
    const out = [...files];
    for (const f of Array.from(fl ?? []).slice(0, 4)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add photos or PDFs"); continue; }
      try { out.push(await readFile(f)); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
    }
    setFiles(out.slice(0, 4));
    if (fileRef.current) fileRef.current.value = "";
  };

  const run = async () => {
    if (!ready) { toast("Add the case notes: a few lines at least, or photos of the case sheet"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "discharge", notes: deidentify(notes).text, files: attachmentPayload(files), language, department, admitted, discharged });
      if (!r?.result) throw new Error("No summary came back");
      const rec: DischargeRecord = { id: sid(), at: Date.now(), language, department, admitted, discharged, label: deidentify(label).text.slice(0, 40), result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
      setTab("summary");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const x = open?.result;
  return (
    <section className="cx-page cx-lab cx-ds">
      <header className="cx-page-h"><div><h1>Discharge Summary</h1><p>Paste the case notes or photograph the case sheet. Cadus writes a structured discharge summary, lists what the notes are missing, and gives the patient advice in their language.</p></div></header>
      {ward.length > 0 && (
        <label className="cx-field cx-ds-ward"><span><BedDouble size={13} /> Start from the ward list</span>
          <select className="cx-select" value="" onChange={(e) => fromWard(e.target.value)} data-ds="ward"><option value="">Choose a patient…</option>{ward.map((p) => <option key={p.id} value={p.id}>Bed {p.bed} · {p.label} · {p.diagnosis}</option>)}</select>
        </label>
      )}
      <textarea className="cx-input" rows={9} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={20000} aria-label="Case notes" data-ds="notes"
        placeholder={"e.g. 58M, k/c/o T2DM. Admitted with fever and cough 5 days. CXR: RLL consolidation. CRP 96. Treated with IV ceftriaxone + azithromycin. Afebrile day 3. Switched to oral day 5. SpO2 97% RA…"} />
      <div className="cx-lab-files">
        <input ref={fileRef} type="file" hidden multiple accept="image/*,application/pdf,.pdf" onChange={(e) => void addFiles(e.target.files)} data-ds="file" />
        <button className="cx-btn sm" onClick={() => fileRef.current?.click()}><Paperclip size={13} /> Case sheet photo or PDF</button>
        {files.map((f) => <span key={f.id} className="cx-lab-file">{f.kind === "pdf" ? <FileText size={13} /> : <Paperclip size={13} />} {f.name} <small>{formatSize(f.size)}</small><button onClick={() => setFiles(files.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.name}`}><X size={12} /></button></span>)}
      </div>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Patient (initials)</span><input className="cx-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 58M or R.K." maxLength={40} /></label>
        <label className="cx-field"><span>Department</span><input className="cx-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. General Medicine" maxLength={80} data-ds="dept" /></label>
        <label className="cx-field"><span>Admitted</span><input className="cx-input" type="date" value={admitted} onChange={(e) => setAdmitted(e.target.value)} /></label>
        <label className="cx-field"><span>Discharge</span><input className="cx-input" type="date" value={discharged} onChange={(e) => setDischarged(e.target.value)} /></label>
        <label className="cx-field"><span>Patient advice in</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-ds="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
        <div className="cx-field"><span>&nbsp;</span><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-ds="go"><FileOutput size={15} /> {busy ? "Writing…" : "Write summary"}</button></div>
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Names and phone numbers typed here are hidden before sending. Crop names out of photos. Check every line before you sign.</p>

      {x && open ? (
        <div className="cx-cmp-out" data-ds="out">
          {x.missing.length > 0 && <div className="cx-sc-gaps" data-ds="missing"><b>Not in the notes:</b> {x.missing.join(" · ")}</div>}
          <div className="cx-seg cx-rex-tabs" role="tablist">
            <button role="tab" aria-selected={tab === "summary"} className={tab === "summary" ? "on" : ""} onClick={() => setTab("summary")}>Discharge summary</button>
            <button role="tab" aria-selected={tab === "patient"} className={tab === "patient" ? "on" : ""} onClick={() => setTab("patient")} disabled={!x.patientAdvice} data-ds="advice-tab">Patient advice · {open.language}</button>
          </div>
          {tab === "summary" ? (
            <>
              <div className="cx-sc-note" data-ds="summary"><MdBlock text={dischargeMarkdown(open)} /></div>
              <div className="cx-sc-acts">
                <button className="cx-btn primary" onClick={() => onPrint("Discharge summary", dischargeMarkdown(open))} data-ds="print"><Printer size={14} /> Print on letterhead</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(dischargeMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
                <button className="cx-ib" onClick={() => { setList((l) => l.filter((y) => y.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </>
          ) : (
            <>
              <div className="cx-sc-note cx-lf-text" data-ds="advice"><MdBlock text={x.patientAdvice} /></div>
              <div className="cx-sc-acts">
                <button className="cx-btn primary" onClick={() => onPrint("Going home", x.patientAdvice, true)}><Printer size={14} /> Print large</button>
                <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(x.patientAdvice.replace(/[#*|]/g, " ").replace(/-{3,}/g, "").replace(/[ \t]{2,}/g, " ").slice(0, 3500))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
              </div>
            </>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>No summaries yet</h3><p>Paste the notes above, or start from a patient on your ward list.</p></div>
      ) : null}
      {list.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent summaries</span></p>
          {list.slice(0, 8).map((r) => <button key={r.id} className={`cx-sc-row ${r.id === openId ? "on" : ""}`} onClick={() => setOpenId(r.id)}><b>{r.result.diagnosis[0] || "Discharge summary"}</b><small>{[r.label, r.department, new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })].filter(Boolean).join(" · ")}</small></button>)}
        </div>
      )}
    </section>
  );
}
