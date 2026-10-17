/** Settings > Personalisation: custom instructions and memory, like ChatGPT. */
import { useState } from "react";
import { Brain, Plus, Trash2, X } from "lucide-react";
import { ABOUT_MAX, addMemory, MEMORY_MAX, MEMORY_ITEM_MAX, removeMemory, type Personal } from "@/lib/cadus/memory";

export default function PersonalSettings({ personal, setPersonal, toast }: {
  personal: Personal;
  setPersonal: (p: Personal) => void;
  toast: (t: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    setPersonal(addMemory(personal, t));
    setDraft("");
    toast("Memory saved");
  };
  return (
    <>
      <div className="cx-set-row">
        <div><b>Custom instructions</b><small>Cadus follows these in every chat, for audience, depth and format. Its clinical standards and safety review always come first.</small></div>
        <button className={`cx-switch ${personal.useCustom ? "on" : ""}`} role="switch" aria-checked={personal.useCustom} aria-label="Use custom instructions" onClick={() => setPersonal({ ...personal, useCustom: !personal.useCustom })} />
      </div>
      <label className="cx-field cx-set-field">
        <span>What should Cadus know about you?</span>
        <textarea
          className="cx-input"
          maxLength={ABOUT_MAX}
          value={personal.about}
          onChange={(e) => setPersonal({ ...personal, about: e.target.value })}
          placeholder="e.g. I'm a medical officer at a CHC in rural Rajasthan. We have no CT scanner and refer to the district hospital 60 km away."
          disabled={!personal.useCustom}
        />
        <small>{personal.about.length} / {ABOUT_MAX}. Avoid patient names or other identifying details.</small>
      </label>
      <label className="cx-field cx-set-field">
        <span>How should Cadus respond?</span>
        <textarea
          className="cx-input"
          maxLength={ABOUT_MAX}
          value={personal.style}
          onChange={(e) => setPersonal({ ...personal, style: e.target.value })}
          placeholder="e.g. Lead with the management plan. Use generic drug names with doses in mg/kg. Mention NLEM availability."
          disabled={!personal.useCustom}
        />
        <small>{personal.style.length} / {ABOUT_MAX}</small>
      </label>

      <div className="cx-set-row">
        <div>
          <b>Memory</b>
          <small>Facts Cadus remembers across chats. Say “Remember that…” in any chat, or add them here. Temporary chats don't use or change memory.</small>
        </div>
        <button className={`cx-switch ${personal.useMemory ? "on" : ""}`} role="switch" aria-checked={personal.useMemory} aria-label="Use memory" onClick={() => setPersonal({ ...personal, useMemory: !personal.useMemory })} />
      </div>
      <div className="cx-mem">
        <form className="cx-mem-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <Brain size={15} />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add something for Cadus to remember" maxLength={MEMORY_ITEM_MAX} aria-label="New memory" />
          <button type="submit" className="cx-btn" disabled={!draft.trim() || personal.memory.length >= MEMORY_MAX}><Plus size={14} /> Add</button>
        </form>
        {personal.memory.length ? (
          <ul className="cx-mem-list">
            {personal.memory.map((m) => (
              <li key={m.id}>
                <span>{m.text}</span>
                <button onClick={() => { setPersonal(removeMemory(personal, m.id)); toast("Memory deleted"); }} aria-label={`Delete memory: ${m.text}`}><X size={14} /></button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="cx-mem-empty">No memories yet.</p>
        )}
        {personal.memory.length > 0 && (
          <button
            className={`cx-btn danger ${confirmClear ? "armed" : ""}`}
            onClick={() => {
              if (!confirmClear) { setConfirmClear(true); return; }
              setPersonal({ ...personal, memory: [] });
              setConfirmClear(false);
              toast("Memory cleared");
            }}
          >
            <Trash2 size={14} /> {confirmClear ? "Click again to clear all memory" : "Clear all memory"}
          </button>
        )}
        <small className="cx-mem-count">{personal.memory.length} of {MEMORY_MAX} memories</small>
      </div>
    </>
  );
}
