/**
 * The Scribe: dictate or type a consultation, get a structured note with
 * ICD-10 codes, review the gaps, edit, sign, and print on the letterhead or
 * export to Word. Notes stay on this device.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ClipboardList, FileSignature, Mic, MicOff, Pencil, Plus, Printer, Search, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { ICD10, NOTE_KINDS, newNote, noteMarkdown, readNotes, saveNotes, searchIcd10, type Icd10, type Note, type NoteKind } from "@/lib/cadus/scribe";

export default function ScribeView({ generate, onPrint, onWord, onAsk, friendlyError, toast, letterhead, signer, language }: {
  generate: (body: Record<string, unknown>) => Promise<{ note?: string; codes?: Icd10[]; gaps?: string[]; title?: string }>;
  onPrint: (title: string, md: string) => void;
  onWord: (title: string, md: string) => void;
  onAsk: (text: string) => void;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  letterhead: boolean;
  /** The doctor's name and registration for signing, if set up. */
  signer: string;
  language: string;
}) {
  const [notes, setNotes] = useState<Note[]>(readNotes);
  const [openId, setOpenId] = useState<string>("");
  const [kind, setKind] = useState<NoteKind>("soap");
  const [patient, setPatient] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [codeQuery, setCodeQuery] = useState("");
  const [query, setQuery] = useState("");
  const rec = useRef<any>(null);
  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => () => rec.current?.stop?.(), []);
  const open = notes.find((n) => n.id === openId) ?? null;
  const patch = (id: string, f: Partial<Note>) => setNotes((l) => l.map((n) => (n.id === id ? { ...n, ...f, updatedAt: Date.now() } : n)));

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast("Dictation isn't supported in this browser; type the consultation instead"); return; }
    if (listening) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = language === "Hindi" ? "hi-IN" : "en-IN";
    r.interimResults = true;
    r.continuous = true;
    let base = transcript.trim();
    let finalText = "";
    r.onresult = (e: any) => {
      let interim = "";
      finalText = "";
      for (let i = 0; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalText += t + " "; else interim += t; }
      setTranscript(`${base ? base + " " : ""}${finalText}${interim}`.trim());
    };
    r.onend = () => { base = `${base ? base + " " : ""}${finalText}`.trim(); setListening(false); };
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const makeNote = async () => {
    if (!transcript.trim()) { toast("Dictate or type the consultation first"); return; }
    if (listening) rec.current?.stop();
    setBusy(true);
    try {
      const r = await generate({ action: "scribe", transcript, kind });
      if (!r.note) throw new Error("The note came back empty");
      const n = newNote({ kind, title: r.title || NOTE_KINDS.find((k) => k.id === kind)!.label, transcript, note: r.note, codes: r.codes ?? [], gaps: r.gaps ?? [], patient: patient.trim() });
      setNotes((l) => [n, ...l]);
      setOpenId(n.id);
      setTranscript("");
      toast("Note written; check it before signing");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const codeHits = useMemo(() => (codeQuery.trim() ? searchIcd10(codeQuery, 8) : []), [codeQuery]);
  const listed = notes.filter((n) => { const q = query.trim().toLowerCase(); return !q || n.title.toLowerCase().includes(q) || n.patient.toLowerCase().includes(q) || n.note.toLowerCase().includes(q); });

  return (
    <section className="cx-page cx-sc">
      <header className="cx-page-h">
        <div><h1>Scribe</h1><p>Dictate or type the consultation as it happened; Cadus writes the note in the format you choose, suggests ICD-10 codes and lists what a complete note would still need. Notes stay on this device.</p></div>
      </header>

      <div className="cx-sc-grid">
        <aside className="cx-sc-list">
          <button className="cx-btn primary" onClick={() => { setOpenId(""); setEditing(false); }}><Plus size={14} /> New note</button>
          <label className="cx-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" aria-label="Search notes" /></label>
          {listed.length ? listed.map((n) => (
            <button key={n.id} className={`cx-sc-row ${n.id === openId ? "on" : ""}`} onClick={() => { setOpenId(n.id); setEditing(false); }}>
              <b>{n.title || "Untitled"}</b>
              <small>{NOTE_KINDS.find((k) => k.id === n.kind)?.label}{n.patient ? ` · ${n.patient}` : ""} · {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{n.signed ? " · signed" : ""}</small>
            </button>
          )) : <p className="cx-dr-note">No notes yet. Dictate the first one.</p>}
        </aside>

        {!open ? (
          <div className="cx-sc-main">
            <div className="cx-sc-kinds" role="radiogroup" aria-label="Note format">
              {NOTE_KINDS.map((k) => <button key={k.id} role="radio" aria-checked={kind === k.id} className={kind === k.id ? "on" : ""} onClick={() => setKind(k.id)} title={k.hint}><b>{k.label}</b><small>{k.hint}</small></button>)}
            </div>
            <label className="cx-field"><span>Patient (age and sex, or bed; never a name)</span><input className="cx-input" value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="52-year-old woman, OPD" maxLength={60} /></label>
            <div className={`cx-sc-dictate ${listening ? "live" : ""}`}>
              <textarea className="cx-input" rows={9} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder={"Speak or type as you would tell a colleague: \"52-year-old woman, known diabetic on metformin 500 twice a day, sugars 180 to 220 fasting, no hypos, has numbness in both feet since two months... examination: BP 140 by 90, monofilament reduced both feet... plan: add glimepiride 1 mg, HbA1c, lipid, foot care advice, review in a month.\""} aria-label="Consultation transcript" />
              <div className="cx-sc-dictate-f">
                <button className={`cx-btn ${listening ? "danger" : ""}`} onClick={toggleMic}>{listening ? <><MicOff size={14} /> Stop dictating</> : <><Mic size={14} /> Dictate</>}</button>
                {listening && <span className="cx-sc-live"><i /> Listening… speak naturally, pause between sections</span>}
                <span className="cx-sc-count">{transcript.trim().split(/\s+/).filter(Boolean).length} words</span>
                <button className="cx-btn primary" onClick={makeNote} disabled={busy || !transcript.trim()}><Sparkles size={14} /> {busy ? "Writing the note…" : "Write the note"}</button>
              </div>
            </div>
            <p className="cx-rs-foot"><ShieldCheck size={13} /> Names, phone numbers and IDs are left out of the note. Only what you said goes in: nothing is invented, and missing items are listed as gaps for you to fill.</p>
          </div>
        ) : (
          <div className="cx-sc-main">
            <div className="cx-sc-head">
              <div>
                {editing ? <input className="cx-input" value={open.title} onChange={(e) => patch(open.id, { title: e.target.value })} aria-label="Title" maxLength={120} /> : <h2>{open.title || "Untitled"}</h2>}
                <small>{NOTE_KINDS.find((k) => k.id === open.kind)?.label}{open.patient ? ` · ${open.patient}` : ""} · {new Date(open.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>
              </div>
              <div className="cx-sc-acts">
                {open.signed ? <span className="cx-sc-signed"><ShieldCheck size={14} /> Signed by {open.signed.by}</span> : (
                  <button className="cx-btn" onClick={() => { if (!signer) { toast("Add your name and registration in Settings › Letterhead to sign"); return; } patch(open.id, { signed: { by: signer, at: Date.now() } }); setEditing(false); toast("Note signed"); }}><FileSignature size={14} /> Sign</button>
                )}
                {!open.signed && <button className={`cx-btn ${editing ? "on" : ""}`} onClick={() => setEditing(!editing)}>{editing ? <><Check size={14} /> Done</> : <><Pencil size={14} /> Edit</>}</button>}
                <button className="cx-btn" onClick={() => onPrint(open.title || "Clinical note", noteMarkdown(open))}><Printer size={14} /> Print{letterhead ? " on letterhead" : ""}</button>
                <button className="cx-btn" onClick={() => onWord(open.title || "Clinical note", noteMarkdown(open))}>Word</button>
                <button className="cx-btn" onClick={() => onAsk(`Please review this clinical note for anything unsafe, missing or inconsistent, and suggest the next investigations or management points worth considering.\n\n${noteMarkdown(open)}`)}><Sparkles size={14} /> Ask Cadus</button>
                <button className="cx-ib" onClick={() => { setNotes((l) => l.filter((n) => n.id !== open.id)); setOpenId(""); toast("Note deleted"); }} aria-label="Delete note"><Trash2 size={15} /></button>
              </div>
            </div>
            {open.gaps.length > 0 && !open.signed && (
              <div className="cx-sc-gaps"><b><ClipboardList size={14} /> A complete note would also have</b><ul>{open.gaps.map((g) => <li key={g}>{g}</li>)}</ul></div>
            )}
            {editing ? <textarea className="cx-input cx-sc-edit" rows={18} value={open.note} onChange={(e) => patch(open.id, { note: e.target.value })} aria-label="Note" /> : <div className="cx-sc-note"><MdBlock text={open.note} /></div>}
            <div className="cx-sc-codes">
              <b>ICD-10</b>
              {open.codes.map((c) => <span key={c.code} className="cx-sc-code"><em>{c.code}</em> {c.label}{!open.signed && <button className="cx-ib" onClick={() => patch(open.id, { codes: open.codes.filter((x) => x.code !== c.code) })} aria-label={`Remove ${c.code}`}><X size={12} /></button>}</span>)}
              {!open.signed && (
                <span className="cx-sc-codeadd">
                  <input className="cx-input" value={codeQuery} onChange={(e) => setCodeQuery(e.target.value)} placeholder="Add a code: E11.9 or 'pneumonia'" aria-label="Add an ICD-10 code" />
                  {codeHits.length > 0 && <ul className="cx-dr-sugg">{codeHits.map((h) => <li key={h.code}><button onClick={() => { if (!open.codes.some((c) => c.code === h.code)) patch(open.id, { codes: [...open.codes, h] }); setCodeQuery(""); }}><b>{h.code}</b><small>{h.label}</small></button></li>)}</ul>}
                </span>
              )}
            </div>
            <details className="cx-sc-tx"><summary>Transcript as dictated</summary><p>{open.transcript}</p></details>
          </div>
        )}
      </div>
      <p className="cx-rs-foot"><ShieldCheck size={13} /> {ICD10.length} common ICD-10 codes are available offline. Notes are drafts until you sign them; you remain the author of the record.</p>
    </section>
  );
}
