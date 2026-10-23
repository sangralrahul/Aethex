/**
 * Journal Club: paste a paper (or its abstract) or attach the PDF. Cadus appraises it with the
 * matching CASP checklist: PICO, key results with the numbers, biases, applicability to India, the
 * bottom line, questions to discuss and a slide outline, ready to print.
 */
import { useRef, useState } from "react";
import { BookOpenText, Copy, FileText, Loader2, MessageCircleQuestion, Paperclip, Presentation, Printer, TriangleAlert, X } from "lucide-react";
import { attachmentPayload, formatSize, type Attachment } from "@/lib/cadus/files";
import { MdBlock } from "./LiveAnswer";

interface Appraisal { citation: string; design: string; pico: { p: string; i: string; c: string; o: string }; summary: string; results: string[]; checklist: { q: string; a: "yes" | "no" | "unclear"; note: string }[]; bias: string[]; applicability: string; bottomLine: string; discuss: string[]; slides: { title: string; points: string[] }[] }
export function appraisalMarkdown(a: Appraisal): string {
  return [
    `# Journal club: ${a.citation || "appraisal"}`, "",
    `**Design:** ${a.design}`, "",
    "## PICO", `- **Population:** ${a.pico.p}`, `- **Intervention / exposure:** ${a.pico.i}`, `- **Comparison:** ${a.pico.c}`, `- **Outcome:** ${a.pico.o}`, "",
    "## Summary", a.summary, "",
    a.results.length ? `## Key results\n${a.results.map((r) => `- ${r}`).join("\n")}\n` : "",
    "## Critical appraisal", "| Question | Answer | Why |", "|---|---|---|",
    ...a.checklist.map((c) => `| ${c.q} | **${c.a}** | ${c.note.replace(/\|/g, "/")} |`), "",
    a.bias.length ? `## Biases and limitations\n${a.bias.map((b) => `- ${b}`).join("\n")}\n` : "",
    a.applicability ? `## Applicability to Indian practice\n${a.applicability}\n` : "",
    `## Bottom line\n${a.bottomLine}`, "",
    a.discuss.length ? `## For discussion\n${a.discuss.map((d, i) => `${i + 1}. ${d}`).join("\n")}` : "",
  ].filter((x) => x !== "").join("\n");
}

export default function JournalClubView({ generate, readFile, friendlyError, toast, onPrint, onSlides }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
  /** Turns the outline into a slide deck in the chat. */
  onSlides: (outline: string) => void;
}) {
  const [paper, setPaper] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [a, setA] = useState<Appraisal | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const words = paper.trim() ? paper.trim().split(/\s+/).length : 0;
  const ready = words >= 60 || files.length > 0;
  const addFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("Attach the paper as a PDF"); return; }
    try { setFiles([await readFile(f)]); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that PDF"); }
    if (ref.current) ref.current.value = "";
  };
  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "appraise", paper: paper.trim(), files: attachmentPayload(files) });
      if (!r?.result) throw new Error("No appraisal came back");
      setA(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const md = a ? appraisalMarkdown(a) : "";
  return (
    <section className="cx-page cx-lab cx-jc">
      <header className="cx-page-h"><div><h1>Journal Club</h1><p>Paste a paper or attach the PDF. Cadus appraises it with the right CASP checklist, pulls out the results with their numbers, names the biases, says how far it applies in India, and gives you discussion questions and a slide outline.</p></div></header>
      <textarea className="cx-input" rows={8} value={paper} onChange={(e) => setPaper(e.target.value.slice(0, 60000))} placeholder="Paste the paper's text, or at least the full abstract" aria-label="The paper" data-jc="paper" />
      <div className="cx-lab-files">
        <input ref={ref} type="file" hidden accept="application/pdf,.pdf" onChange={(e) => void addFile(e.target.files?.[0])} data-jc="file" />
        <button className="cx-btn sm" onClick={() => ref.current?.click()}><Paperclip size={13} /> Attach the PDF</button>
        {files.map((f) => <span key={f.id} className="cx-lab-file"><FileText size={13} /> {f.name} <small>{formatSize(f.size)}</small><button onClick={() => setFiles([])} aria-label="Remove"><X size={12} /></button></span>)}
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || !ready} data-jc="go">{busy ? <><Loader2 size={15} className="cx-rot" /> Appraising…</> : <><BookOpenText size={15} /> Appraise</>}</button>{!ready && paper && <small className="cx-pc-words">{words} words: paste the full abstract at least</small>}</div>
      {a && (
        <div className="cx-cmp-out" data-jc="out">
          <div className="cx-jc-bottom"><b>Bottom line</b><p>{a.bottomLine}</p><small>{a.design}{a.citation ? ` · ${a.citation}` : ""}</small></div>
          <div className="cx-jc-check" data-jc="checklist">{a.checklist.map((c, i) => <div key={i} className={`a-${c.a}`}><span>{c.a}</span><b>{c.q}</b><small>{c.note}</small></div>)}</div>
          <div className="cx-sc-note"><MdBlock text={md.split("## Critical appraisal")[0].replace(/^# .*\n/, "")} /></div>
          {a.bias.length > 0 && <div className="cx-sim-card warn"><h3>Biases and limitations</h3><ul>{a.bias.map((b) => <li key={b}>{b}</li>)}</ul></div>}
          {a.applicability && <p><b>In Indian practice:</b> {a.applicability}</p>}
          {a.discuss.length > 0 && <div className="cx-sim-card"><h3><MessageCircleQuestion size={14} /> For discussion</h3><ol>{a.discuss.map((d) => <li key={d}>{d}</li>)}</ol></div>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint("Journal club", md)} data-jc="print"><Printer size={14} /> Print handout</button>
            {a.slides.length > 0 && <button className="cx-btn" onClick={() => onSlides(a.slides.map((s) => `${s.title}\n${s.points.map((p) => `- ${p}`).join("\n")}`).join("\n\n"))} data-jc="slides"><Presentation size={14} /> Make the slides</button>}
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md); toast("Copied"); }}><Copy size={14} /> Copy</button>
          </div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Check every number against the paper before you present it.</p>
    </section>
  );
}
