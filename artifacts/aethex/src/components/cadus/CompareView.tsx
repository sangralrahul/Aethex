/**
 * Compare over time: two X-rays, ECGs, scans, reports or wound photos from different dates.
 * Cadus reads both and says what changed, finding by finding, with anything that needs
 * action now.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Copy, FileText, History, Paperclip, Printer, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { attachmentPayload, formatSize, type Attachment } from "@/lib/cadus/files";
import { COMPARE_KINDS, OVERALL_LABEL, readCompares, saveCompares, sid, TREND_LABEL, type CompareRecord } from "@/lib/cadus/studio";

function Side({ label, files, setFiles, date, setDate, text, setText, readFile, toast, testId }: {
  label: string; files: Attachment[]; setFiles: (f: Attachment[]) => void; date: string; setDate: (d: string) => void;
  text: string; setText: (t: string) => void; readFile: (f: File) => Promise<Attachment>; toast: (t: string) => void; testId: string;
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
  const thumb = files.find((f) => f.kind === "image")?.data;
  return (
    <div className="cx-cmp-side" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void add(e.dataTransfer.files); }}>
      <p className="cx-cmp-label">{label}</p>
      <label className="cx-field"><span>Date</span><input className="cx-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-cmp={`${testId}-date`} /></label>
      <div className="cx-cmp-drop">
        {thumb ? <img src={thumb} alt={`${label} study`} /> : <Paperclip size={20} />}
        <input ref={ref} type="file" hidden multiple accept="image/*,application/pdf,.pdf" onChange={(e) => void add(e.target.files)} data-cmp={`${testId}-file`} />
        <button className="cx-btn sm" onClick={() => ref.current?.click()}>{files.length ? "Add more" : "Add photo or PDF"}</button>
      </div>
      {files.length > 0 && <div className="cx-lab-files">{files.map((f) => <span key={f.id} className="cx-lab-file">{f.kind === "pdf" ? <FileText size={13} /> : <Paperclip size={13} />} {f.name} <small>{formatSize(f.size)}</small><button onClick={() => setFiles(files.filter((x) => x.id !== f.id))} aria-label={`Remove ${f.name}`}><X size={12} /></button></span>)}</div>}
      <textarea className="cx-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Or paste the report or values" maxLength={12000} aria-label={`${label} report text`} />
    </div>
  );
}

export default function CompareView({ generate, readFile, friendlyError, toast, onPrint }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [kind, setKind] = useState("xray");
  const [eFiles, setEFiles] = useState<Attachment[]>([]);
  const [lFiles, setLFiles] = useState<Attachment[]>([]);
  const [eDate, setEDate] = useState("");
  const [lDate, setLDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [eText, setEText] = useState("");
  const [lText, setLText] = useState("");
  const [context, setContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<CompareRecord[]>(readCompares);
  const [openId, setOpenId] = useState("");
  useEffect(() => saveCompares(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;
  const ready = (eFiles.length || eText.trim()) && (lFiles.length || lText.trim());
  const kindLabel = (k: string) => COMPARE_KINDS.find((x) => x.id === k)?.label ?? "Study";

  const run = async () => {
    if (!ready) { toast("Add the earlier and the later study"); return; }
    if (eDate && lDate && eDate > lDate) { toast("The earlier date is after the later one"); return; }
    setBusy(true);
    try {
      const r = await generate({
        action: "compare", kind, earlier: attachmentPayload(eFiles), later: attachmentPayload(lFiles),
        earlierText: deidentify(eText.trim()).text, laterText: deidentify(lText.trim()).text,
        earlierDate: eDate, laterDate: lDate, context: deidentify(context.trim()).text,
      });
      if (!r?.result?.summary) throw new Error("No comparison came back");
      const rec: CompareRecord = { id: sid(), at: Date.now(), kind, earlierDate: eDate, laterDate: lDate, result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const md = (rec: CompareRecord) => [
    `# ${kindLabel(rec.kind)}: ${rec.earlierDate || "earlier"} → ${rec.laterDate || "later"}`,
    `**Overall: ${OVERALL_LABEL[rec.result.overall]}.** ${rec.result.summary}`,
    rec.result.changes.length ? `| Finding | Before | After | Change |\n|---|---|---|---|\n${rec.result.changes.map((c) => `| ${c.finding} | ${c.before} | ${c.after} | ${TREND_LABEL[c.trend]} |`).join("\n")}` : "",
    rec.result.concerns.length ? `## Needs attention\n${rec.result.concerns.map((x) => `- ${x}`).join("\n")}` : "",
    rec.result.next.length ? `## Next steps\n${rec.result.next.map((x) => `- ${x}`).join("\n")}` : "",
    rec.result.limits ? `*Limits: ${rec.result.limits}*` : "",
  ].filter(Boolean).join("\n\n");

  return (
    <section className="cx-page cx-cmp">
      <header className="cx-page-h"><div><h1>Compare over time</h1><p>Two X-rays, ECGs, scans, reports or wound photos from different dates: Cadus reads both and tells you what changed.</p></div></header>
      <div className="cx-sc-kinds" role="radiogroup" aria-label="What to compare">
        {COMPARE_KINDS.map((k) => <button key={k.id} role="radio" aria-checked={kind === k.id} className={kind === k.id ? "on" : ""} onClick={() => setKind(k.id)} data-cmp-kind={k.id}><b>{k.label}</b><small>{k.hint}</small></button>)}
      </div>
      <div className="cx-cmp-sides">
        <Side label="Earlier" files={eFiles} setFiles={setEFiles} date={eDate} setDate={setEDate} text={eText} setText={setEText} readFile={readFile} toast={toast} testId="earlier" />
        <ArrowRight size={22} className="cx-cmp-arrow" />
        <Side label="Later" files={lFiles} setFiles={setLFiles} date={lDate} setDate={setLDate} text={lText} setText={setLText} readFile={readFile} toast={toast} testId="later" />
      </div>
      <div className="cx-cmp-go">
        <input className="cx-input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Clinical context (optional), e.g. pneumonia, day 10 of antibiotics" maxLength={600} aria-label="Clinical context" />
        <button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-cmp="go"><History size={15} /> {busy ? "Comparing…" : "Compare"}</button>
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Crop names and IDs out of photos. Text you type is cleaned of identifiers before sending.</p>

      {open ? (
        <div className="cx-cmp-out" data-cmp="out">
          <div className={`cx-rxc-verdict v-${open.result.overall === "worse" ? "unsafe" : open.result.overall === "better" || open.result.overall === "same" ? "ok" : "review"}`} data-overall={open.result.overall}>
            <History size={22} /><div><b>{OVERALL_LABEL[open.result.overall]}</b><p>{open.result.summary}</p></div>
          </div>
          {open.result.changes.length > 0 && (
            <div className="cx-lab-table">
              <table>
                <thead><tr><th>Finding</th><th>Earlier{open.earlierDate ? ` (${open.earlierDate})` : ""}</th><th>Later{open.laterDate ? ` (${open.laterDate})` : ""}</th><th>Change</th></tr></thead>
                <tbody>{open.result.changes.map((c, i) => <tr key={i}><td><b>{c.finding}</b></td><td>{c.before}</td><td>{c.after}</td><td><span className={`cx-cmp-trend t-${c.trend}`}>{TREND_LABEL[c.trend]}</span></td></tr>)}</tbody>
              </table>
            </div>
          )}
          {open.result.concerns.length > 0 && <div className="cx-hd-corr"><b><TriangleAlert size={14} /> Needs attention</b><ul>{open.result.concerns.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {open.result.next.length > 0 && <div className="cx-sim-card"><h3>Next steps</h3><ul>{open.result.next.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {open.result.limits && <p className="cx-rs-foot">{open.result.limits}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint(`${kindLabel(open.kind)} comparison`, md(open))}><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-ib" onClick={() => { setList((l) => l.filter((x) => x.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Nothing compared yet</h3><p>Add the earlier and later study above.</p></div>
      ) : null}
      {list.length > 0 && (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Recent comparisons</span></p>
          {list.slice(0, 8).map((x) => <button key={x.id} className={`cx-sc-row ${x.id === openId ? "on" : ""}`} onClick={() => setOpenId(x.id)}><b>{kindLabel(x.kind)} · {OVERALL_LABEL[x.result.overall]}</b><small>{x.earlierDate || "?"} → {x.laterDate || "?"}</small></button>)}
        </div>
      )}
    </section>
  );
}
