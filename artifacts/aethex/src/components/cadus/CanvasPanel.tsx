/**
 * Canvas: edit an answer as a document beside the chat, like ChatGPT Canvas and
 * Claude's artifacts. Quick AI edits (shorter, formal, patient-friendly,
 * translate or any instruction), undo, and export to Word, PDF or Markdown.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, Check, ChevronDown, Copy, Download, Eye, FileDown, FileText, Languages, PenLine, Printer, Undo2, WandSparkles, X,
} from "lucide-react";
import { renderMarkdown, markdownToText } from "@/lib/cadus-markdown";
import { downloadBlob, fileSlug } from "@/lib/cadus/docx";
import { useFlowcharts } from "@/lib/cadus/flowchart";
import { referenceForDocument } from "@/lib/cadus/reference";

export interface CanvasDoc {
  id: string;
  title: string;
  text: string;
  sessionId?: string;
  msgId?: string;
  mode?: string;
  createdAt: number;
  updatedAt: number;
  /** Earlier versions for undo, newest last. */
  history: string[];
}

const QUICK_EDITS: { label: string; instruction: string }[] = [
  { label: "Shorter", instruction: "Make it about half as long. Keep every clinical fact, dose and warning that matters." },
  { label: "More detail", instruction: "Expand it with more clinical detail where it helps, without padding." },
  { label: "More formal", instruction: "Rewrite it in a formal, professional register suitable for hospital records and letters." },
  { label: "Patient-friendly", instruction: "Rewrite it for a patient and family: plain language at about a 12-year-old reading level, explaining any medical terms." },
  { label: "Fix grammar", instruction: "Correct spelling, grammar and punctuation only. Change nothing else." },
  { label: "Add a summary table", instruction: "Add a short summary table of the key points (for example drugs, doses and monitoring) where it fits best." },
];
const TRANSLATE_TO = ["Hindi", "Hinglish", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "English"];

export default function CanvasPanel({ doc, onChange, onClose, aiEdit, exportPdf, exportWord, print, letterhead, toast }: {
  doc: CanvasDoc;
  onChange: (doc: CanvasDoc) => void;
  onClose: () => void;
  aiEdit: (text: string, instruction: string) => Promise<string>;
  /** Downloads and printing add the letterhead and, for letters and certificates, a signature block. */
  exportPdf: (title: string, text: string) => void;
  exportWord: (title: string, text: string) => void;
  print: (title: string, text: string) => void;
  /** Whether a letterhead is set up, shown in the export menu. */
  letterhead?: boolean;
  toast: (t: string) => void;
}) {
  // A blank document opens ready to type.
  const [editing, setEditing] = useState(() => !doc.text.trim());
  const [busy, setBusy] = useState("");
  const [ask, setAsk] = useState("");
  const [menu, setMenu] = useState<"" | "export" | "translate">("");
  const [error, setError] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const html = editing || !doc.text.trim() ? "" : renderMarkdown(doc.text);
  // React 19 sets innerHTML again whenever this object changes, which would wipe drawn flowcharts.
  const inner = useMemo(() => ({ __html: html }), [html]);
  useFlowcharts(docRef, html);

  useEffect(() => {
    if (editing) window.setTimeout(() => taRef.current?.focus(), 30);
  }, [editing]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement)?.closest?.(".cx-cv-menu-wrap")) setMenu(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const update = (text: string, title?: string) => {
    onChange({ ...doc, ...(title ? { title: title.slice(0, 90) } : {}), text, updatedAt: Date.now(), history: [...doc.history, doc.text].slice(-20) });
  };

  const empty = !doc.text.trim();

  const runEdit = async (label: string, instruction: string) => {
    // Quick edits need text to work on; your own instruction can also write a blank document.
    if (busy || (empty && label !== "Your edit")) return;
    setBusy(empty ? "Writing" : label);
    setError("");
    setMenu("");
    try {
      const next = await aiEdit(doc.text, instruction);
      if (next.trim() && next !== doc.text) {
        // A document Cadus writes from scratch takes its title from its first heading.
        const heading = empty && doc.title === "Untitled document" ? /^#{1,3}\s+(.+)$/m.exec(next)?.[1]?.replace(/[*_`]/g, "").trim() : undefined;
        update(next, heading);
        if (empty) setEditing(false);
        toast(empty ? "Document written" : `${label}: done`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The edit didn't work. Please try again.");
    } finally {
      setBusy("");
    }
  };

  const undo = () => {
    const prev = doc.history[doc.history.length - 1];
    if (prev === undefined) return;
    onChange({ ...doc, text: prev, updatedAt: Date.now(), history: doc.history.slice(0, -1) });
  };

  const copy = async () => {
    try {
      // Evidence labels and dose cards become plain words and tables in other apps.
      await navigator.clipboard.writeText(referenceForDocument(doc.text));
      toast("Document copied");
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };

  const words = markdownToText(doc.text).split(/\s+/).filter(Boolean).length;

  return (
    <aside className="cx-cv" aria-label="Canvas">
      <header className="cx-cv-h">
        <span className="cx-cv-ic"><FileText size={16} /></span>
        <input
          className="cx-cv-title"
          value={doc.title}
          onChange={(e) => onChange({ ...doc, title: e.target.value.slice(0, 90), updatedAt: Date.now() })}
          aria-label="Document title"
        />
        <div className="cx-cv-acts">
          <button className="cx-ib cx-tip" data-tip="Undo" onClick={undo} disabled={!doc.history.length || !!busy} aria-label="Undo"><Undo2 size={16} /></button>
          <button className={`cx-ib cx-tip ${editing ? "open" : ""}`} data-tip={editing ? "Preview" : "Edit text"} onClick={() => setEditing((v) => !v)} aria-label={editing ? "Preview" : "Edit text"}>
            {editing ? <Eye size={16} /> : <PenLine size={16} />}
          </button>
          <button className="cx-ib cx-tip" data-tip="Copy" onClick={copy} aria-label="Copy document"><Copy size={16} /></button>
          <div className="cx-cv-menu-wrap">
            <button className={`cx-cv-export ${menu === "export" ? "open" : ""}`} onClick={() => setMenu(menu === "export" ? "" : "export")} aria-haspopup="menu" aria-expanded={menu === "export"}>
              <Download size={15} /><span>Export</span><ChevronDown size={14} />
            </button>
            {menu === "export" && (
              <div className="cx-pop cx-cv-menu" role="menu">
                <button className="cx-pop-i" onClick={() => { setMenu(""); exportWord(doc.title, doc.text); }}><FileDown size={16} /> Word document (.docx)</button>
                <button className="cx-pop-i" onClick={() => { setMenu(""); exportPdf(doc.title, doc.text); }}><FileDown size={16} /> PDF</button>
                <button className="cx-pop-i" onClick={() => { setMenu(""); print(doc.title, doc.text); }}><Printer size={16} /> Print</button>
                <button className="cx-pop-i" onClick={() => { setMenu(""); downloadBlob(`${fileSlug(doc.title)}.md`, new Blob([`# ${doc.title}\n\n${doc.text}\n`], { type: "text/markdown" })); }}><FileDown size={16} /> Markdown (.md)</button>
                <p className="cx-pop-gl">{letterhead ? "Word, PDF and print use your letterhead" : "Add your letterhead in Settings"}</p>
              </div>
            )}
          </div>
          <button className="cx-ib" onClick={onClose} aria-label="Close canvas"><X size={18} /></button>
        </div>
      </header>

      <div className={`cx-cv-body ${busy ? "busy" : ""}`}>
        {editing ? (
          <textarea
            ref={taRef}
            className="cx-cv-ta"
            value={doc.text}
            onChange={(e) => onChange({ ...doc, text: e.target.value, updatedAt: Date.now() })}
            onBlur={() => { /* typing changes are saved as they happen */ }}
            spellCheck
            aria-label="Document text"
          />
        ) : (
          empty ? (
            <p className="cx-cv-empty">This document is empty. Select <b>Edit text</b> to type, or ask Cadus below to write it.</p>
          ) : (
            <div ref={docRef} className="cx-cv-doc cx-md" onDoubleClick={() => setEditing(true)} dangerouslySetInnerHTML={inner} />
          )
        )}
        {busy && (
          <div className="cx-cv-busy" role="status"><i className="cx-spin" /> {busy === "Writing" ? "Cadus is writing the document" : `Cadus is editing: ${busy.toLowerCase()}`}</div>
        )}
      </div>

      <footer className="cx-cv-f">
        {error && <p className="cx-cv-err">{error}</p>}
        <div className="cx-cv-quick">
          {QUICK_EDITS.map((q) => (
            <button key={q.label} onClick={() => void runEdit(q.label, q.instruction)} disabled={!!busy || empty}><WandSparkles size={13} /> {q.label}</button>
          ))}
          <div className="cx-cv-menu-wrap">
            <button onClick={() => setMenu(menu === "translate" ? "" : "translate")} disabled={!!busy || empty} aria-haspopup="menu" aria-expanded={menu === "translate"}><Languages size={13} /> Translate <ChevronDown size={12} /></button>
            {menu === "translate" && (
              <div className="cx-pop cx-cv-menu up" role="menu">
                {TRANSLATE_TO.map((l) => (
                  <button key={l} className="cx-pop-i" onClick={() => void runEdit(`Translate to ${l}`, `Translate the whole document into ${l}. Keep drug names, doses, units and lab values in English.`)}>{l}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <form className="cx-cv-ask" onSubmit={(e) => { e.preventDefault(); const t = ask.trim(); if (t) { setAsk(""); void runEdit("Your edit", t); } }}>
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder={empty ? "Ask Cadus to write it, e.g. a discharge summary template for dengue" : "Ask Cadus to change this document, e.g. add a medication table"}
            maxLength={600}
            disabled={!!busy}
            aria-label="Ask Cadus to edit"
          />
          <button type="submit" className="cx-send" disabled={!ask.trim() || !!busy} aria-label="Apply edit"><ArrowUp size={16} /></button>
        </form>
        <p className="cx-cv-note">
          <Check size={12} /> {words.toLocaleString("en-IN")} words · Saved automatically · AI edits aren't safety-reviewed, so check clinical details before use.
        </p>
      </footer>
    </aside>
  );
}
