/**
 * ICD-10 Coder: WHO ICD-10 codes from diagnoses or a discharge summary (names removed before
 * sending), the principal diagnosis first, the words that support each code, and what is missing
 * from the documentation. Recent results are kept on the device.
 */
import { useState } from "react";
import { Check, Copy, FileCode2, History, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { deleteDraft23, readDrafts23, saveDraft23, type Draft23 } from "@/lib/cadus/clinic23";

interface Icd { codes: { code: string; title: string; role: string; why: string; confidence: "high" | "medium" | "low" }[]; missing: string[]; note: string }

export default function IcdView({ generate, friendlyError, toast }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [setting, setSetting] = useState<"inpatient" | "outpatient">("inpatient");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Icd | null>(null);
  const [past, setPast] = useState<Draft23[]>(() => readDrafts23("icd"));

  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "icd-code", notes: deidentify(notes).text, setting });
      if (!r?.result) throw new Error("Nothing came back");
      setRes(r.result);
      saveDraft23("icd", `${r.result.codes[0].code} ${r.result.codes[0].title}`, r.result);
      setPast(readDrafts23("icd"));
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const copy = (t: string) => { void navigator.clipboard?.writeText(t); toast("Copied"); };

  return (
    <section className="cx-page cx-lab cx-icd">
      <header className="cx-page-h"><div><h1>ICD-10 Coder</h1><p>Paste the diagnoses or the discharge summary and get the WHO ICD-10 codes for records and insurance claims (including PM-JAY), with the principal diagnosis first and what the notes need to code more precisely.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="Setting">{(["inpatient", "outpatient"] as const).map((s) => <button key={s} role="radio" aria-checked={setting === s} className={setting === s ? "on" : ""} onClick={() => setSetting(s)}>{s === "inpatient" ? "Admission / discharge" : "OPD visit"}</button>)}</div>
      <label className="cx-field"><span>Diagnoses or discharge summary</span><textarea className="cx-input" rows={7} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 16000))} placeholder={"e.g. Final diagnosis: Acute STEMI (anterior wall), thrombolysed. Type 2 diabetes with nephropathy. Hypertension. CKD stage 3."} data-icd="notes" /></label>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || notes.trim().length < 4} data-icd="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <FileCode2 size={14} />} Find the codes</button></div>
      {res && (
        <div className="cx-cmp-out" data-icd="out">
          <div className="cx-c23-scroll"><table className="cx-c23-table cx-icd-table"><thead><tr><th>Code</th><th>Title</th><th>Role</th><th>From the notes</th></tr></thead>
            <tbody>{res.codes.map((c) => (
              <tr key={c.code} className={c.role === "principal" ? "principal" : ""} data-icd-code={c.code}>
                <td><button className="cx-icd-code" onClick={() => copy(c.code)} aria-label={`Copy ${c.code}`}>{c.code}</button></td>
                <td>{c.title}{c.confidence !== "high" && <small className={`cx-icd-conf ${c.confidence}`}>{c.confidence} confidence</small>}</td>
                <td>{c.role}</td><td><small>{c.why}</small></td>
              </tr>
            ))}</tbody></table></div>
          {res.missing.length > 0 && <div className="cx-sc-gaps" data-icd="missing"><b>To code more precisely, document:</b> {res.missing.join(" · ")}</div>}
          {res.note && <p className="cx-set-hint">{res.note}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => copy(res.codes.map((c) => c.code).join(", "))} data-icd="copy"><Copy size={14} /> Copy codes</button>
            <button className="cx-btn" onClick={() => copy(res.codes.map((c) => `${c.code}  ${c.title} (${c.role})`).join("\n"))}><Check size={14} /> Copy with titles</button>
          </div>
        </div>
      )}
      {past.length > 0 && (
        <details className="cx-opd-seen"><summary><History size={13} /> Recent ({past.length})</summary>
          <ul className="cx-c23-past">{past.map((d) => (
            <li key={d.id}><button className="cx-link" onClick={() => setRes(d.data as Icd)}>{d.title}</button><small>{new Date(d.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small><button className="cx-ib" onClick={() => { deleteDraft23(d.id); setPast(readDrafts23("icd")); }} aria-label="Delete"><Trash2 size={13} /></button></li>
          ))}</ul>
        </details>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Codes are suggestions for a trained coder or the doctor to confirm against the ICD-10 volumes; the hospital's insurer may need extra codes or package codes. Names are removed before sending.</p>
    </section>
  );
}
