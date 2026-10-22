/**
 * Cadus Crew knowledge: the documents an assistant uses in every chat (unit protocols,
 * notes, a syllabus, a hospital formulary). Text files and pasted notes are kept as they
 * are; a PDF or a photo is read once by Cadus and kept as text. Patient identifiers in
 * typed or pasted text are hidden before saving.
 */
import { useRef, useState } from "react";
import { BookOpen, ClipboardPaste, FilePlus, Trash2, X } from "lucide-react";
import { deidentify } from "@/lib/cadus/deidentify";
import { KNOWLEDGE_MAX_CHARS, KNOWLEDGE_MAX_DOCS, type CrewDoc } from "@/lib/cadus/crew";

const newId = () => `doc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const kb = (n: number) => (n < 1000 ? `${n} characters` : `${Math.round(n / 100) / 10}k characters`);

/** Reads a File as a data URL (for PDFs and photos sent to be read). */
const asDataUrl = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Couldn't read that file")); r.readAsDataURL(f); });

export default function CrewKnowledge({ docs, onChange, extract, toast }: {
  docs: CrewDoc[];
  onChange: (d: CrewDoc[]) => void;
  /** Reads a PDF or photo on the server and returns its text. */
  extract: (file: { kind: "pdf" | "image"; name: string; data: string }) => Promise<string>;
  toast: (t: string) => void;
}) {
  const [busy, setBusy] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pName, setPName] = useState("");
  const [pText, setPText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const used = docs.reduce((n, d) => n + d.text.length, 0);
  const left = KNOWLEDGE_MAX_CHARS - used;
  const full = docs.length >= KNOWLEDGE_MAX_DOCS || left <= 200;

  const add = (name: string, text: string) => {
    const clean = deidentify(text.replace(/\r/g, "").trim());
    if (!clean.text) { toast("That file has no text Cadus can use"); return false; }
    if (docs.length >= KNOWLEDGE_MAX_DOCS) { toast(`An assistant can keep up to ${KNOWLEDGE_MAX_DOCS} documents`); return false; }
    const room = KNOWLEDGE_MAX_CHARS - docs.reduce((n, d) => n + d.text.length, 0);
    if (room <= 200) { toast("This assistant's knowledge is full. Remove a document first."); return false; }
    const cut = clean.text.length > room;
    onChange([...docs, { id: newId(), name: name.slice(0, 80) || "Notes", text: clean.text.slice(0, room), addedAt: Date.now() }]);
    toast(cut ? `Added the first ${kb(room)} of ${name}` : clean.total ? `Added ${name}; ${clean.total} patient identifier${clean.total === 1 ? "" : "s"} hidden` : `Added ${name}`);
    return true;
  };

  const onFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (fileRef.current) fileRef.current.value = "";
    for (const f of files) {
      if (docs.length >= KNOWLEDGE_MAX_DOCS) break;
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      const isImg = f.type.startsWith("image/");
      const isText = f.type.startsWith("text/") || /\.(txt|md|csv|tsv|json)$/i.test(f.name);
      if (!isPdf && !isImg && !isText) { toast(`${f.name}: add a PDF, a photo or a text file`); continue; }
      if (f.size > 12 * 1024 * 1024) { toast(`${f.name} is over 12 MB`); continue; }
      setBusy(f.name);
      try {
        const text = isText ? await f.text() : await extract({ kind: isPdf ? "pdf" : "image", name: f.name, data: await asDataUrl(f) });
        add(f.name.replace(/\.[a-z0-9]+$/i, ""), text);
      } catch (e) {
        toast(`${f.name}: ${e instanceof Error ? e.message : "couldn't be read"}`);
      } finally { setBusy(""); }
    }
  };

  return (
    <div className="cx-ck" data-crew="knowledge">
      <div className="cx-ck-h">
        <span><BookOpen size={14} /> Knowledge</span>
        <small>{docs.length}/{KNOWLEDGE_MAX_DOCS} documents · {kb(used)} of {kb(KNOWLEDGE_MAX_CHARS)}</small>
      </div>
      <p className="cx-ck-hint">Protocols, notes or a syllabus this assistant should use in every chat. It says when it used one.</p>
      {docs.length > 0 && (
        <ul className="cx-ck-list">
          {docs.map((d) => (
            <li key={d.id}>
              <BookOpen size={14} />
              <span><b>{d.name}</b><small>{kb(d.text.length)}</small></span>
              <button type="button" className="cx-ib" onClick={() => onChange(docs.filter((x) => x.id !== d.id))} aria-label={`Remove ${d.name}`}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      {pasting ? (
        <div className="cx-ck-paste">
          <input className="cx-input" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Name, e.g. Unit sepsis protocol" maxLength={80} data-crew="kname" />
          <textarea className="cx-input" rows={5} value={pText} onChange={(e) => setPText(e.target.value)} placeholder="Paste the text here" maxLength={Math.max(0, left)} data-crew="ktext" />
          <div className="cx-ck-acts">
            <button type="button" className="cx-btn" onClick={() => { setPasting(false); setPName(""); setPText(""); }}><X size={14} /> Cancel</button>
            <button type="button" className="cx-btn primary" disabled={!pText.trim()} onClick={() => { if (add(pName.trim() || "Notes", pText)) { setPasting(false); setPName(""); setPText(""); } }} data-crew="kadd">Add</button>
          </div>
        </div>
      ) : (
        <div className="cx-ck-acts">
          <input ref={fileRef} type="file" hidden multiple accept="application/pdf,.pdf,image/*,.txt,.md,.csv,.tsv,.json,text/plain,text/markdown,text/csv" onChange={(e) => void onFiles(e.target.files)} data-crew="kfile" />
          <button type="button" className="cx-btn sm" disabled={full || !!busy} onClick={() => fileRef.current?.click()}><FilePlus size={14} /> {busy ? `Reading ${busy}…` : "Add a file"}</button>
          <button type="button" className="cx-btn sm" disabled={full || !!busy} onClick={() => setPasting(true)} data-crew="kpaste"><ClipboardPaste size={14} /> Paste text</button>
        </div>
      )}
    </div>
  );
}
