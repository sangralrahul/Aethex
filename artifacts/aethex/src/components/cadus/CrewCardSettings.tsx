/**
 * One assistant's personal settings: how it answers (length, format, language), which of your
 * collections it is in, and a private note. Works for Cadus's own assistants too; stays on this device.
 */
import { useState, type ReactNode } from "react";
import { Brain, FolderPlus, Languages, StickyNote, Trash2, X } from "lucide-react";
import { addFact, MEMORY_MAX, removeFact, type CrewFact, addCollection, CREW_FORMATS, CREW_LANGS, CREW_LENGTHS, NOTE_MAX, setNote, styleLine, toggleInCollection, type CrewMember, type CrewOrg, type CrewStyle } from "@/lib/cadus/crew";

export default function CrewCardSettings({ c, style, org, memory, badge, onStyle, onOrg, onMemory, onClose }: {
  c: CrewMember;
  memory: Record<string, CrewFact[]>;
  onMemory: (m: Record<string, CrewFact[]>) => void;
  style: CrewStyle | undefined;
  org: CrewOrg;
  badge: ReactNode;
  onStyle: (s: CrewStyle) => void;
  onOrg: (o: CrewOrg) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState<CrewStyle>({ length: style?.length ?? "standard", format: style?.format ?? "default", language: style?.language ?? "English", mentor: !!style?.mentor });
  const [note, setNoteText] = useState(org.notes[c.id] ?? "");
  const [newCol, setNewCol] = useState("");
  const [fact, setFact] = useState("");
  const facts = memory[c.id] ?? [];
  const done = () => { onStyle(s); onOrg(setNote(org, c.id, note)); onClose(); };
  const preview = styleLine(s);

  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset" role="dialog" aria-modal="true" aria-labelledby="cx-cset-t" onMouseDown={(e) => e.stopPropagation()} data-crew="settings">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh">{badge}<div><h3 id="cx-cset-t">{c.name}: your settings</h3><p>Only for you, on this device. They apply in every chat, Huddle, Debate and Case round with this assistant.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <h4><Languages size={14} /> Answer style and language</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Length</span><select className="cx-select" value={s.length} onChange={(e) => setS({ ...s, length: e.target.value as CrewStyle["length"] })} data-cs="length">{CREW_LENGTHS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select></label>
            <label className="cx-field"><span>Format</span><select className="cx-select" value={s.format} onChange={(e) => setS({ ...s, format: e.target.value as CrewStyle["format"] })} data-cs="format">{CREW_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
            <label className="cx-field"><span>Language</span><select className="cx-select" value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })} data-cs="language">{CREW_LANGS.map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
          </div>
          <label className="cx-pa-mine"><input type="checkbox" checked={!!s.mentor} onChange={(e) => setS({ ...s, mentor: e.target.checked })} data-cs="mentor" /> Mentor mode: teach me by asking questions instead of giving the answer straight away</label>
          <p className="cx-set-hint" data-cs="preview">{preview ? preview.replace(/^ANSWER STYLE \(set by the user for this assistant\): /, "It will be told: ") : "Default: answers in English, at the length and format the question needs."}</p>
          <h4><FolderPlus size={14} /> Collections</h4>
          {org.collections.length ? <div className="cx-imaging-ticks">{org.collections.map((col) => <label key={col.id} className="cx-pa-mine"><input type="checkbox" checked={col.ids.includes(c.id)} onChange={() => onOrg(toggleInCollection(org, col.id, c.id))} data-cs-col={col.name} /> {col.name} <small>({col.ids.length})</small></label>)}</div> : <p className="cx-set-hint">No collections yet: make one for a rotation, an exam or your unit.</p>}
          <div className="cx-c23-row">
            <label className="cx-field"><span>New collection</span><input className="cx-input" value={newCol} onChange={(e) => setNewCol(e.target.value.slice(0, 40))} placeholder="e.g. Surgery posting" data-cs="newcol" onKeyDown={(e) => { if (e.key === "Enter" && newCol.trim()) { onOrg(addCollection(org, newCol, [c.id])); setNewCol(""); } }} /></label>
            <button className="cx-btn" disabled={!newCol.trim()} onClick={() => { onOrg(addCollection(org, newCol, [c.id])); setNewCol(""); }} data-cs="addcol"><FolderPlus size={14} /> Add with this assistant</button>
          </div>
          <h4><Brain size={14} /> Memory</h4>
          <p className="cx-set-hint">Facts this assistant keeps in mind in every chat (your rotation, exam date, preferences). You can also type "Remember: …" in a chat with it.</p>
          {facts.length > 0 && <ul className="cx-mem-list" data-cs="facts">{facts.map((f) => <li key={f.id}>{f.text}<button className="cx-ib" onClick={() => onMemory(removeFact(memory, c.id, f.id))} aria-label={`Forget: ${f.text}`} data-cs-forget={f.text}><Trash2 size={13} /></button></li>)}</ul>}
          <div className="cx-c23-row">
            <label className="cx-field"><span>Add a fact ({facts.length}/{MEMORY_MAX})</span><input className="cx-input" value={fact} onChange={(e) => setFact(e.target.value.slice(0, 200))} placeholder="e.g. I'm a 2nd-year surgery resident; exam in March" onKeyDown={(e) => { if (e.key === "Enter" && fact.trim()) { onMemory(addFact(memory, c.id, fact)); setFact(""); } }} data-cs="fact" /></label>
            <button className="cx-btn" disabled={!fact.trim()} onClick={() => { onMemory(addFact(memory, c.id, fact)); setFact(""); }} data-cs="addfact"><Brain size={14} /> Remember</button>
          </div>
          <h4><StickyNote size={14} /> Private note</h4>
          <label className="cx-field"><span>Shown on the card; never sent to the assistant</span><textarea className="cx-input" rows={3} value={note} onChange={(e) => setNoteText(e.target.value.slice(0, NOTE_MAX))} placeholder="e.g. Best for viva prep; ask it for tables" data-cs="note" /></label>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={done} data-cs="done">Save</button><button className="cx-btn" onClick={onClose}>Cancel</button></div>
        </div>
      </div>
    </div>
  );
}
