/**
 * Report Explainer: add a lab, imaging or other report (a photo, a PDF or pasted text).
 * Cadus writes a summary for the doctor, with every abnormal value flagged and anything
 * urgent at the top, and an explanation for the patient in their own language, ready
 * to print or send on WhatsApp.
 */
import { useEffect, useRef, useState } from "react";
import { Copy, FileScan, FileText, Languages, MessageCircle, Paperclip, Printer, Siren, Sparkles, Stethoscope, Trash2, TriangleAlert, UserRound, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { attachmentPayload, formatSize, type Attachment } from "@/lib/cadus/files";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { explainShareText, FLAG_LABEL, readExplains, saveExplains, uid, type ExplainRecord } from "@/lib/cadus/labs";

export default function ReportExplainView({ generate, readFile, friendlyError, toast, onPrint, onAsk, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  onAsk: (q: string) => void;
  defaultLanguage: string;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "Hindi");
  const [level, setLevel] = useState<"standard" | "simple">("standard");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<ExplainRecord[]>(readExplains);
  const [openId, setOpenId] = useState("");
  const [tab, setTab] = useState<"doctor" | "patient">("doctor");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => saveExplains(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;

  const addFiles = async (fl: FileList | null) => {
    for (const f of Array.from(fl ?? []).slice(0, 3)) {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Add a photo or a PDF of the report"); continue; }
      try {
        const a = await readFile(f);
        setFiles((x) => [...x, a].slice(0, 3));
      } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that file"); }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const explain = async () => {
    if (!text.trim() && !files.length) { toast("Add the report as a photo or PDF, or paste it"); return; }
    const clean = deidentify(text);
    const ctx = deidentify(context);
    setBusy(true);
    try {
      const r = await generate({ action: "report-explain", text: clean.text.trim(), files: attachmentPayload(files), language, level, context: ctx.text.trim() });
      if (!r?.result?.patientSummary) throw new Error("The explanation came back empty");
      const rec: ExplainRecord = { id: uid(), at: Date.now(), language, result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
      setTab("doctor");
      if (clean.total + ctx.total) toast(`Hid ${clean.total + ctx.total} patient identifier${clean.total + ctx.total === 1 ? "" : "s"} before sending`);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const r = open?.result;
  const patientMd = r ? `# ${r.title}\n\n${r.patientSummary}${r.questions.length ? `\n\n## Questions to ask your doctor\n${r.questions.map((q) => `- ${q}`).join("\n")}` : ""}` : "";
  const doctorMd = r ? `# ${r.title}\n\n${r.urgent ? `**Urgent:** ${r.urgentReason}\n\n` : ""}${r.doctorSummary}${r.findings.length ? `\n\n| Test | Result | Reference | Flag |\n|---|---|---|---|\n${r.findings.map((f) => `| ${f.name} | ${f.value} | ${f.ref || "-"} | ${FLAG_LABEL[f.flag]} |`).join("\n")}` : ""}` : "";

  return (
    <section className="cx-page cx-lab cx-rex">
      <header className="cx-page-h">
        <div><h1>Report Explainer</h1><p>Turn any lab, imaging or pathology report into a clear summary for you and an explanation your patient understands, in their own language.</p></div>
      </header>
      <div className="cx-lab-grid">
        <div className="cx-lab-form">
          <div className="cx-lab-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void addFiles(e.dataTransfer.files); }}>
            <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={(e) => void addFiles(e.target.files)} data-rex="file" />
            <FileScan size={22} />
            <p>Drop a photo or PDF of the report</p>
            <button className="cx-btn" onClick={() => fileRef.current?.click()}><Paperclip size={14} /> Choose a file</button>
          </div>
          {files.length > 0 && <div className="cx-lab-files">{files.map((f) => <span key={f.id} className="cx-lab-file">{f.kind === "pdf" ? <FileText size={13} /> : <Paperclip size={13} />} {f.name} <small>{formatSize(f.size)}</small><button onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.name}`}><X size={12} /></button></span>)}</div>}
          <label className="cx-field"><span>Or paste the results</span><textarea className="cx-input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Hb 8.2 g/dL, MCV 68 fL, ferritin 9 ng/mL…"} maxLength={20000} data-rex="text" /></label>
          <div className="cx-pd-row">
            <label className="cx-field"><span><Languages size={13} /> Patient's language</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Patient's language" data-rex="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
            <label className="cx-field"><span>Reading level</span><div className="cx-seg"><button className={level === "standard" ? "on" : ""} onClick={() => setLevel("standard")}>Plain</button><button className={level === "simple" ? "on" : ""} onClick={() => setLevel("simple")}>Very simple</button></div></label>
          </div>
          <label className="cx-field"><span>Clinical context (optional)</span><input className="cx-input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. 45F, diabetic, on metformin, tired for a month" maxLength={600} /></label>
          <button className="cx-btn primary" onClick={explain} disabled={busy || (!text.trim() && !files.length)} data-rex="go"><Sparkles size={14} /> {busy ? "Reading the report…" : "Explain this report"}</button>
          <p className="cx-rs-foot"><TriangleAlert size={13} /> Names and numbers typed here are hidden before sending. Crop the patient's name out of photos.</p>
          {list.length > 0 && (
            <div className="cx-lf-saved">
              <p className="cx-gl"><span>Recent reports</span></p>
              {list.slice(0, 10).map((x) => <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => setOpenId(x.id)}><b>{x.result.urgent && <Siren size={12} className="cx-rex-urg" />} {x.result.title}</b><small>{x.language} · {new Date(x.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
            </div>
          )}
        </div>
        <div className="cx-lab-out">
          {r && open ? (
            <>
              {r.urgent && <div className="cx-rxc-verdict v-unsafe" data-rex="urgent"><Siren size={22} /><div><b>Needs action today</b><p>{r.urgentReason}</p></div></div>}
              <div className="cx-rex-top">
              <div className="cx-seg cx-rex-tabs" role="tablist">
                <button role="tab" aria-selected={tab === "doctor"} className={tab === "doctor" ? "on" : ""} onClick={() => setTab("doctor")}><Stethoscope size={14} /> For you</button>
                <button role="tab" aria-selected={tab === "patient"} className={tab === "patient" ? "on" : ""} onClick={() => setTab("patient")} data-rex="patient-tab"><UserRound size={14} /> For the patient · {open.language}</button>
              </div>
              <button className="cx-ib" onClick={() => { setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete this report" title="Delete"><Trash2 size={15} /></button>
              </div>
              {tab === "doctor" ? (
                <>
                  <div className="cx-sc-note"><h2 className="cx-lab-h2">{r.title}</h2><MdBlock text={r.doctorSummary} /></div>
                  {r.findings.length > 0 && (
                    <div className="cx-lab-table">
                      <table>
                        <thead><tr><th>Test</th><th>Result</th><th>Reference</th><th>Flag</th><th>What it means</th></tr></thead>
                        <tbody>{r.findings.map((f, n) => <tr key={n} className={`f-${f.flag}`}><td>{f.name}</td><td><b>{f.value}</b></td><td>{f.ref || "—"}</td><td><span className={`cx-rex-flag f-${f.flag}`}>{FLAG_LABEL[f.flag]}</span></td><td>{f.meaning}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                  <div className="cx-sc-acts">
                    <button className="cx-btn" onClick={() => onPrint(r.title, doctorMd)}><Printer size={14} /> Print</button>
                    <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(doctorMd); toast("Copied"); }}><Copy size={14} /> Copy</button>
                    <button className="cx-btn" onClick={() => onAsk(`Help me plan the next steps for this report.\n\n${doctorMd}`)}><MessageCircle size={14} /> Ask Cadus what next</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="cx-sc-note cx-lf-text" data-rex="patient"><MdBlock text={patientMd} /></div>
                  <div className="cx-sc-acts">
                    <a className="cx-btn primary" href={`https://wa.me/?text=${encodeURIComponent(explainShareText(r))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> Send on WhatsApp</a>
                    <button className="cx-btn" onClick={() => onPrint(r.title, patientMd)}><Printer size={14} /> Print large</button>
                    <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(explainShareText(r)); toast("Copied"); }}><Copy size={14} /> Copy</button>
                  </div>
                </>
              )}
              <p className="cx-rs-foot"><TriangleAlert size={13} /> Read both versions before sharing; check every value against the original report.</p>
            </>
          ) : (
            <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><FileScan size={20} /></span><h3>No report open</h3><p>Add a report to get a summary for you and an explanation for your patient.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
