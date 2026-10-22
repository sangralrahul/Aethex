/**
 * Med Reconciliation: the medicines before and after a transition of care (admission,
 * transfer or discharge), typed or photographed. Cadus matches them, marks what was started,
 * stopped or changed, finds problems, and writes a "your medicines now" sheet for the
 * patient in their language.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Copy, FileText, MessageCircle, Paperclip, Pill, Printer, ShieldAlert, ShieldCheck, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { attachmentPayload, formatSize, type Attachment } from "@/lib/cadus/files";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { blankRxPatient, rxPatientPayload, rxPatientSummary, type RxPatient } from "@/lib/cadus/labs";
import { CHANGE_LABEL, medRecMarkdown, readMedRecs, saveMedRecs, sid, STAGES, type MedRecRecord } from "@/lib/cadus/studio";

function ListBox({ label, text, setText, files, setFiles, readFile, toast, id }: {
  label: string; text: string; setText: (t: string) => void; files: Attachment[]; setFiles: (f: Attachment[]) => void;
  readFile: (f: File) => Promise<Attachment>; toast: (t: string) => void; id: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const add = async (list: FileList | null) => {
    const out = [...files];
    for (const f of Array.from(list ?? []).slice(0, 3)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add photos or PDFs"); continue; }
      try { out.push(await readFile(f)); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
    }
    setFiles(out.slice(0, 3));
    if (ref.current) ref.current.value = "";
  };
  return (
    <div className="cx-cmp-side">
      <p className="cx-cmp-label">{label}</p>
      <textarea className="cx-input" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"One medicine per line, e.g.\nTab Glycomet 500 mg 1-0-1\nTab Ecosprin 75 mg 0-1-0"} maxLength={6000} aria-label={label} data-mr={`${id}-text`} />
      <div className="cx-lab-files">
        <input ref={ref} type="file" hidden multiple accept="image/*,application/pdf,.pdf" onChange={(e) => void add(e.target.files)} data-mr={`${id}-file`} />
        <button className="cx-btn sm" onClick={() => ref.current?.click()}><Paperclip size={13} /> Photo or PDF</button>
        {files.map((f) => <span key={f.id} className="cx-lab-file">{f.kind === "pdf" ? <FileText size={13} /> : <Paperclip size={13} />} {f.name} <small>{formatSize(f.size)}</small><button onClick={() => setFiles(files.filter((x) => x.id !== f.id))} aria-label={`Remove ${f.name}`}><X size={12} /></button></span>)}
      </div>
    </div>
  );
}

export default function MedRecView({ generate, readFile, friendlyError, toast, onPrint, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string, large?: boolean) => void;
  defaultLanguage: string;
}) {
  const [stage, setStage] = useState<(typeof STAGES)[number]["id"]>("discharge");
  const [bText, setBText] = useState("");
  const [aText, setAText] = useState("");
  const [bFiles, setBFiles] = useState<Attachment[]>([]);
  const [aFiles, setAFiles] = useState<Attachment[]>([]);
  const [patient, setPatient] = useState<RxPatient>(blankRxPatient);
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "English");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<MedRecRecord[]>(readMedRecs);
  const [openId, setOpenId] = useState("");
  const [tab, setTab] = useState<"doctor" | "patient">("doctor");
  useEffect(() => saveMedRecs(list), [list]);
  const st = STAGES.find((s) => s.id === stage)!;
  const open = list.find((x) => x.id === openId) ?? null;
  const ready = (bText.trim() || bFiles.length) && (aText.trim() || aFiles.length);
  const set = (p: Partial<RxPatient>) => setPatient((x) => ({ ...x, ...p }));

  const run = async () => {
    if (!ready) { toast("Add both medicine lists"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "med-rec", stage, language, beforeText: deidentify(bText).text, afterText: deidentify(aText).text, before: attachmentPayload(bFiles), after: attachmentPayload(aFiles), patient: rxPatientPayload(patient) });
      if (!r?.result?.items?.length) throw new Error("No medicines came back");
      const rec: MedRecRecord = { id: sid(), at: Date.now(), stage, language, patient: rxPatientSummary(patient), result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
      setTab("doctor");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const r = open?.result;
  const counts = r ? (["stopped", "started", "changed", "continued", "unclear"] as const).map((c) => [c, r.items.filter((i) => i.change === c).length] as const).filter(([, n]) => n) : [];
  const worst = r ? (r.issues.some((i) => i.severity === "high") || r.items.some((i) => i.status === "problem") ? "unsafe" : r.issues.length || r.items.some((i) => i.status === "check") ? "review" : "ok") : "ok";

  return (
    <section className="cx-page cx-lab cx-mr">
      <header className="cx-page-h"><div><h1>Med Reconciliation</h1><p>Compare the medicines before and after admission, transfer or discharge: what was started, stopped or changed, what's missing or unsafe, and a clear medicine sheet for the patient.</p></div></header>
      <div className="cx-seg cx-mr-stage" role="radiogroup" aria-label="Transition">
        {STAGES.map((s) => <button key={s.id} role="radio" aria-checked={stage === s.id} className={stage === s.id ? "on" : ""} onClick={() => setStage(s.id)} data-mr-stage={s.id}>{s.label}</button>)}
      </div>
      <div className="cx-cmp-sides">
        <ListBox label={st.before} text={bText} setText={setBText} files={bFiles} setFiles={setBFiles} readFile={readFile} toast={toast} id="before" />
        <ArrowRight size={22} className="cx-cmp-arrow" />
        <ListBox label={st.after} text={aText} setText={setAText} files={aFiles} setFiles={setAFiles} readFile={readFile} toast={toast} id="after" />
      </div>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="decimal" value={patient.age} onChange={(e) => set({ age: e.target.value.replace(/[^\d.]/g, "") })} placeholder="years" data-mr="age" /></label>
        <label className="cx-field"><span>Weight</span><input className="cx-input" inputMode="decimal" value={patient.weightKg} onChange={(e) => set({ weightKg: e.target.value.replace(/[^\d.]/g, "") })} placeholder="kg" /></label>
        <label className="cx-field"><span>eGFR</span><input className="cx-input" inputMode="decimal" value={patient.egfr} onChange={(e) => set({ egfr: e.target.value.replace(/[^\d.]/g, "") })} placeholder="mL/min" data-mr="egfr" /></label>
        <label className="cx-field"><span>Allergies</span><input className="cx-input" value={patient.allergies} onChange={(e) => set({ allergies: e.target.value })} placeholder="e.g. sulfa" maxLength={300} /></label>
        <label className="cx-field"><span>Conditions</span><input className="cx-input" value={patient.conditions} onChange={(e) => set({ conditions: e.target.value })} placeholder="e.g. PCI 3 months ago, CKD 3" maxLength={500} data-mr="cond" /></label>
        <label className="cx-field"><span>Patient sheet in</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-mr="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-mr="go"><Pill size={15} /> {busy ? "Reconciling…" : "Reconcile"}</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Names and phone numbers typed here are hidden before sending. Crop names out of photos.</p>

      {r && open ? (
        <div className="cx-cmp-out" data-mr="out">
          <div className={`cx-rxc-verdict v-${worst}`} data-worst={worst}>
            {worst === "ok" ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            <div><b>{counts.map(([c, n]) => `${n} ${CHANGE_LABEL[c].toLowerCase()}`).join(" · ")}</b><p>{r.summary}</p></div>
          </div>
          <div className="cx-seg cx-rex-tabs" role="tablist">
            <button role="tab" aria-selected={tab === "doctor"} className={tab === "doctor" ? "on" : ""} onClick={() => setTab("doctor")}>Reconciliation</button>
            <button role="tab" aria-selected={tab === "patient"} className={tab === "patient" ? "on" : ""} onClick={() => setTab("patient")} data-mr="sheet-tab" disabled={!r.patientSheet}>Patient sheet · {open.language}</button>
          </div>
          {tab === "doctor" ? (
            <>
              {r.issues.length > 0 && <div className="cx-rxc-issues">{r.issues.map((i, n) => <div key={n} className={`cx-rxc-issue s-${i.severity}`}><p className="cx-rxc-tags"><span className={`cx-rxc-sev s-${i.severity}`}>{i.severity === "high" ? "High" : i.severity === "moderate" ? "Moderate" : "Low"}</span></p><h3>{i.title}</h3>{i.detail && <p>{i.detail}</p>}{i.action && <p className="cx-rxc-act"><b>Do:</b> {i.action}</p>}</div>)}</div>}
              <div className="cx-lab-table">
                <table>
                  <thead><tr><th>Medicine</th><th>{(STAGES.find((s) => s.id === open.stage) ?? st).before}</th><th>{(STAGES.find((s) => s.id === open.stage) ?? st).after}</th><th>Change</th></tr></thead>
                  <tbody>{r.items.map((i, n) => <tr key={n} className={`s-${i.status}`}><td><span className={`cx-rxc-dot m-${i.status === "problem" ? "danger" : i.status === "check" ? "caution" : "ok"}`} /> <b>{i.generic}</b>{i.note && <small>{i.note}</small>}</td><td>{i.before || "—"}</td><td>{i.after || "—"}</td><td><span className={`cx-mr-chg c-${i.change}`}>{CHANGE_LABEL[i.change]}</span></td></tr>)}</tbody>
                </table>
              </div>
              {r.questions.length > 0 && <div className="cx-sc-gaps"><b>To confirm:</b> {r.questions.join(" · ")}</div>}
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => onPrint("Medicine reconciliation", medRecMarkdown(open))}><Printer size={14} /> Print</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(medRecMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
                <button className="cx-ib" onClick={() => { setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </>
          ) : (
            <>
              <div className="cx-sc-note cx-lf-text" data-mr="sheet"><MdBlock text={r.patientSheet} /></div>
              <div className="cx-sc-acts">
                <button className="cx-btn primary" onClick={() => onPrint("Your medicines", r.patientSheet, true)}><Printer size={14} /> Print large</button>
                <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(r.patientSheet.replace(/[#*|]/g, " ").replace(/-{3,}/g, "").replace(/[ \t]{2,}/g, " ").slice(0, 3500))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
              </div>
            </>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Nothing reconciled yet</h3><p>Add both lists above, typed or as photos.</p></div>
      ) : null}
      {list.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent reconciliations</span></p>
          {list.slice(0, 8).map((x) => <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => setOpenId(x.id)}><b>{STAGES.find((s) => s.id === x.stage)?.label} · {x.result.items.length} medicines</b><small>{x.patient} · {new Date(x.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      )}
    </section>
  );
}
