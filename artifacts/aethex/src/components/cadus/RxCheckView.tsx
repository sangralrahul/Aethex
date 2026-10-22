/**
 * Rx Safety Check: type a prescription or add a photo or PDF of it, give what is known
 * about the patient, and Cadus checks every medicine: dose, interactions, allergy,
 * pregnancy, kidney, liver, age and duplicates, with the generic, whether it is on the
 * NLEM and what to ask for at a Jan Aushadhi Kendra. Cadus's own interaction table
 * checks the generics again on this device.
 */
import { useEffect, useRef, useState } from "react";
import { Copy, FileText, MessageCircle, Paperclip, Pill, Printer, ShieldAlert, ShieldCheck, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { detectDrugs, findInteractions } from "@/lib/cadus/interactions";
import { attachmentPayload, formatSize, type Attachment } from "@/lib/cadus/files";
import {
  blankRxPatient, readRxChecks, RX_KIND_LABEL, RX_VERDICT, rxPatientPayload, rxPatientSummary, rxReportMarkdown, saveRxChecks, uid,
  type RxCheckRecord, type RxIssue, type RxPatient, type RxReport,
} from "@/lib/cadus/labs";

/** Interactions Cadus's own table finds between the generics that the AI did not already raise. */
export function localInteractions(report: RxReport): RxIssue[] {
  const drugs = detectDrugs(report.medicines.map((m) => m.generic || m.name).join(", "));
  if (drugs.length < 2) return [];
  const raised = report.issues.filter((i) => i.kind === "interaction").map((i) => `${i.title} ${i.detail} ${i.drugs.join(" ")}`.toLowerCase());
  const word = (s: string) => s.replace(/\s*\(.*\)$/, "").toLowerCase().split(/[\s,/]+/)[0];
  return findInteractions(drugs)
    .filter((m) => m.severity !== "minor")
    .filter((m) => !raised.some((r) => r.includes(word(m.a)) && r.includes(word(m.b))))
    .map((m) => ({ severity: m.severity === "major" ? "high" : "moderate", kind: "interaction", title: `${m.a} with ${m.b}`, detail: `${m.effect} ${m.mechanism}`.trim(), action: m.action, drugs: [m.a, m.b], local: true }));
}

export default function RxCheckView({ generate, readFile, friendlyError, toast, onPrint, onAsk }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onAsk: (q: string) => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [patient, setPatient] = useState<RxPatient>(blankRxPatient);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<RxCheckRecord[]>(readRxChecks);
  const [openId, setOpenId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => saveRxChecks(checks), [checks]);
  const open = checks.find((c) => c.id === openId) ?? null;
  const set = (p: Partial<RxPatient>) => setPatient((x) => ({ ...x, ...p }));

  const addFiles = async (list: FileList | null) => {
    for (const f of Array.from(list ?? []).slice(0, 3)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add a photo or a PDF of the prescription"); continue; }
      try {
        const a = await readFile(f);
        setFiles((x) => [...x, a].slice(0, 3));
      } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const check = async () => {
    if (!text.trim() && !files.length) { toast("Type the prescription or add a photo of it"); return; }
    const clean = deidentify(text);
    setBusy(true);
    try {
      const r = await generate({ action: "rx-check", text: clean.text.trim(), files: attachmentPayload(files), patient: rxPatientPayload(patient) });
      const report: RxReport | undefined = r?.report;
      if (!report?.medicines?.length) throw new Error("No medicines came back");
      const extra = localInteractions(report);
      const merged: RxReport = { ...report, issues: [...report.issues, ...extra].sort((a, b) => ["high", "moderate", "low"].indexOf(a.severity) - ["high", "moderate", "low"].indexOf(b.severity)) };
      if (extra.some((i) => i.severity === "high")) merged.verdict = "unsafe";
      else if (extra.length && merged.verdict === "ok") merged.verdict = "review";
      const rec: RxCheckRecord = { id: uid(), at: Date.now(), patient: rxPatientSummary(patient), label: report.medicines.map((m) => m.generic || m.name).slice(0, 3).join(", "), report: merged };
      setChecks((l) => [rec, ...l]);
      setOpenId(rec.id);
      if (clean.total) toast(`Hid ${clean.total} patient identifier${clean.total === 1 ? "" : "s"} before checking`);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const md = open ? rxReportMarkdown(open.report, open.patient) : "";
  const female = patient.sex !== "M";

  return (
    <section className="cx-page cx-lab cx-rxc">
      <header className="cx-page-h">
        <div><h1>Rx Safety Check</h1><p>Check a prescription before it reaches the patient: doses, interactions, allergies, pregnancy, kidney and liver, with generic names and Jan Aushadhi options.</p></div>
      </header>
      <div className="cx-lab-grid">
        <div className="cx-lab-form">
          <label className="cx-field"><span>Prescription</span><textarea className="cx-input" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Tab Ecosprin 75 mg OD\nTab Clopilet 75 mg OD\nTab Brufen 400 mg TDS x 5 days"} maxLength={6000} data-rxc="text" /></label>
          <div className="cx-lab-files">
            <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={(e) => void addFiles(e.target.files)} data-rxc="file" />
            <button className="cx-btn" onClick={() => fileRef.current?.click()}><Paperclip size={14} /> Photo or PDF</button>
            {files.map((f) => <span key={f.id} className="cx-lab-file">{f.kind === "pdf" ? <FileText size={13} /> : <Paperclip size={13} />} {f.name} <small>{formatSize(f.size)}</small><button onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.name}`}><X size={12} /></button></span>)}
          </div>
          <p className="cx-gl"><span>The patient</span></p>
          <div className="cx-lab-row3">
            <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={patient.age} onChange={(e) => set({ age: e.target.value.replace(/[^\d.]/g, "") })} placeholder="e.g. 68" data-rxc="age" /></label>
            <label className="cx-field"><span>Sex</span><select className="cx-select" value={patient.sex} onChange={(e) => set({ sex: e.target.value as RxPatient["sex"] })}><option value="">—</option><option value="F">Female</option><option value="M">Male</option></select></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={patient.weightKg} onChange={(e) => set({ weightKg: e.target.value.replace(/[^\d.]/g, "") })} placeholder="e.g. 60" /></label>
          </div>
          <div className="cx-lab-row3">
            {female && <label className="cx-field"><span>Pregnant</span><select className="cx-select" value={patient.pregnant} onChange={(e) => set({ pregnant: e.target.value as RxPatient["pregnant"] })}><option value="unknown">Not known</option><option value="no">No</option><option value="yes">Yes</option></select></label>}
            <label className="cx-field"><span>eGFR</span><input className="cx-input" inputMode="decimal" value={patient.egfr} onChange={(e) => set({ egfr: e.target.value.replace(/[^\d.]/g, "") })} placeholder="mL/min/1.73m²" data-rxc="egfr" /></label>
            <div className="cx-lab-checks">
              {female && <label><input type="checkbox" checked={patient.breastfeeding} onChange={(e) => set({ breastfeeding: e.target.checked })} /> Breastfeeding</label>}
              <label><input type="checkbox" checked={patient.liver} onChange={(e) => set({ liver: e.target.checked })} /> Liver disease</label>
            </div>
          </div>
          <label className="cx-field"><span>Allergies</span><input className="cx-input" value={patient.allergies} onChange={(e) => set({ allergies: e.target.value })} placeholder="e.g. penicillin, sulfa" maxLength={300} data-rxc="allergies" /></label>
          <label className="cx-field"><span>Conditions</span><input className="cx-input" value={patient.conditions} onChange={(e) => set({ conditions: e.target.value })} placeholder="e.g. CKD stage 3, asthma, on warfarin" maxLength={500} /></label>
          <button className="cx-btn primary" onClick={check} disabled={busy || (!text.trim() && !files.length)} data-rxc="check"><ShieldCheck size={14} /> {busy ? "Checking every medicine…" : "Check prescription"}</button>
          <p className="cx-rs-foot"><TriangleAlert size={13} /> Names and phone numbers typed here are hidden before checking. Crop the patient's name out of photos.</p>
          {checks.length > 0 && (
            <div className="cx-lf-saved">
              <p className="cx-gl"><span>Recent checks</span></p>
              {checks.slice(0, 10).map((c) => <button key={c.id} className={`cx-sc-row ${c.id === openId ? "on" : ""}`} onClick={() => setOpenId(c.id)}><b><span className={`cx-rxc-dot v-${c.report.verdict}`} /> {c.label}</b><small>{c.patient} · {new Date(c.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
            </div>
          )}
        </div>
        <div className="cx-lab-out">
          {open ? (
            <>
              <div className={`cx-rxc-verdict v-${open.report.verdict}`} data-verdict={open.report.verdict}>
                {open.report.verdict === "ok" ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
                <div><b>{RX_VERDICT[open.report.verdict].label}</b><p>{open.report.summary || RX_VERDICT[open.report.verdict].sub}</p></div>
              </div>
              {open.report.issues.length > 0 && (
                <div className="cx-rxc-issues">
                  {open.report.issues.map((i, n) => (
                    <div key={n} className={`cx-rxc-issue s-${i.severity}`}>
                      <p className="cx-rxc-tags"><span className={`cx-rxc-sev s-${i.severity}`}>{i.severity === "high" ? "High" : i.severity === "moderate" ? "Moderate" : "Low"}</span><span className="cx-rxc-kind">{RX_KIND_LABEL[i.kind]}</span>{i.local && <span className="cx-rxc-kind">Cadus interaction table</span>}</p>
                      <h3>{i.title}</h3>
                      {i.detail && <p>{i.detail}</p>}
                      {i.action && <p className="cx-rxc-act"><b>Change:</b> {i.action}</p>}
                    </div>
                  ))}
                </div>
              )}
              <div className="cx-rxc-meds" data-rxc="meds">
                {open.report.medicines.map((m, n) => (
                  <div key={n} className={`cx-rxc-med m-${m.status}`}>
                    <p className="cx-rxc-med-h"><span className={`cx-rxc-dot m-${m.status}`} /> <b>{m.generic || m.name}</b>{m.nlem && <span className="cx-rxc-nlem" title="On India's National List of Essential Medicines">NLEM</span>}{m.generic && m.name && <small>written as {m.name}</small>}</p>
                    <p className="cx-rxc-med-d">{[m.dose && `${m.dose}${m.route ? ` ${m.route}` : ""}`, m.frequency, m.duration && `for ${m.duration}`].filter(Boolean).join(" · ")}</p>
                    {m.note && <p className="cx-rxc-med-n">{m.note}</p>}
                    {m.janAushadhi && <p className="cx-rxc-med-j">Jan Aushadhi: ask for <b>{m.janAushadhi}</b></p>}
                  </div>
                ))}
              </div>
              {open.report.missingInfo.length > 0 && <div className="cx-sc-gaps"><b>To be sure, Cadus needs:</b> {open.report.missingInfo.join("; ")}</div>}
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => onPrint("Prescription check", md)}><Printer size={14} /> Print</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md); toast("Copied"); }}><Copy size={14} /> Copy</button>
                <button className="cx-btn" onClick={() => onAsk(`Help me rewrite this prescription safely.\n\n${md}`)}><MessageCircle size={14} /> Rewrite it with Cadus</button>
                <button className="cx-ib" onClick={() => { setChecks((l) => l.filter((c) => c.id !== open.id)); setOpenId(""); }} aria-label="Delete this check"><Trash2 size={15} /></button>
              </div>
              <p className="cx-rs-foot"><Pill size={13} /> Jan Aushadhi names are the generics to ask for; stock varies by Kendra. The prescriber remains responsible for every medicine.</p>
            </>
          ) : (
            <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Nothing checked yet</h3><p>Type or photograph a prescription, add what you know about the patient, and check it.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
