/**
 * Settings > Institution: the hospital or department, its formulary notes,
 * antibiotic policy and local protocols, which Cadus follows in answers, and
 * team packs to share them (with the department letterhead) across a team.
 */
import { useMemo, useRef, useState } from "react";
import { Building2, Download, FileUp, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import {
  applyPack, departmentLetterhead, exportPack, hasInstitution, institutionLabel, LIMITS, matchProtocols, MAX_PROTOCOLS,
  newProtocol, parsePack, protocolFromFile, type Institution, type Pack, type Protocol,
} from "@/lib/cadus/institution";
import type { Letterhead } from "@/lib/cadus/letterhead";
import { downloadBlob } from "@/lib/cadus/docx";

const EXAMPLE: Protocol[] = [
  newProtocol(
    "Sepsis: first hour",
    "Recognise: suspected infection with qSOFA 2 or more, lactate above 2 mmol/L or hypotension.\n1. Blood cultures (two sets) before antibiotics, without delaying them.\n2. Empirical antibiotics within 1 hour: piperacillin-tazobactam 4.5 g IV every 6 hours; add vancomycin if MRSA risk. Ceftriaxone 2 g IV daily for community-acquired sepsis without risk factors.\n3. Crystalloid 30 mL/kg within 3 hours if hypotensive or lactate 4 or more.\n4. Noradrenaline if MAP stays below 65 mmHg after fluids; inform the ICU registrar.\n5. Repeat lactate within 2 to 4 hours.",
  ),
  newProtocol(
    "Snakebite (neurotoxic and haemotoxic)",
    "20-minute whole blood clotting test on arrival and every 6 hours.\nAnti-snake venom (polyvalent): 10 vials IV over 1 hour if WBCT positive or neurotoxic signs; repeat 10 vials after 6 hours if still incoagulable. Neurotoxic: neostigmine with atropine trial. Adrenaline 0.5 mg IM ready for anaphylaxis.",
  ),
];

export default function InstitutionSettings({ value, onChange, letterhead, onLetterhead, toast }: {
  value: Institution;
  onChange: (i: Institution) => void;
  letterhead: Letterhead;
  onLetterhead: (l: Letterhead) => void;
  toast: (t: string) => void;
}) {
  const [editing, setEditing] = useState<Protocol | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [armed, setArmed] = useState("");
  const [tryQ, setTryQ] = useState("");
  const [withLh, setWithLh] = useState(true);
  const [pack, setPack] = useState<Pack | null>(null);
  const [packLh, setPackLh] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const packRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Institution>) => onChange({ ...value, ...patch });
  const matched = useMemo(() => (tryQ.trim() ? matchProtocols(value, tryQ) : []), [value, tryQ]);
  const deptLh = departmentLetterhead(letterhead);

  const saveEdit = () => {
    if (!editing) return;
    const p = { ...editing, title: editing.title.trim().slice(0, LIMITS.title), text: editing.text.trim().slice(0, LIMITS.text), updatedAt: Date.now() };
    if (!p.title || !p.text) { toast("A protocol needs a title and its text"); return; }
    const exists = value.protocols.some((x) => x.id === p.id);
    if (!exists && value.protocols.length >= MAX_PROTOCOLS) { toast(`Up to ${MAX_PROTOCOLS} protocols`); return; }
    set({ protocols: exists ? value.protocols.map((x) => (x.id === p.id ? p : x)) : [p, ...value.protocols] });
    setEditing(null);
    toast(exists ? "Protocol updated" : "Protocol added");
  };

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const added: Protocol[] = [];
    for (const f of Array.from(files).slice(0, 10)) {
      if (!/\.(txt|md|markdown)$/i.test(f.name) && !/^text\//.test(f.type)) { toast(`${f.name}: use a .txt or .md file`); continue; }
      if (f.size > 200_000) { toast(`${f.name} is too large`); continue; }
      const text = await f.text();
      if (text.trim()) added.push(protocolFromFile(f.name, text));
    }
    if (!added.length) return;
    const room = MAX_PROTOCOLS - value.protocols.length;
    set({ protocols: [...added.slice(0, Math.max(0, room)), ...value.protocols] });
    toast(added.length > room ? `Added ${Math.max(0, room)}; the limit is ${MAX_PROTOCOLS} protocols` : `Added ${added.length} protocol${added.length === 1 ? "" : "s"}`);
  };

  const readPack = async (f?: File | null) => {
    if (!f) return;
    try {
      const p = parsePack(await f.text());
      setPack(p);
      // Fill the letterhead's hospital, address and logo only if asked (on by default when it has none yet).
      setPackLh(!!p.letterhead && !letterhead.hospital);
    } catch (e) {
      toast(e instanceof Error ? e.message : "That file couldn't be read");
    }
  };
  const usePack = (how: "replace" | "merge") => {
    if (!pack) return;
    onChange(applyPack(value, pack, how));
    const lh = packLh && pack.letterhead;
    if (lh) onLetterhead({ ...letterhead, hospital: pack.letterhead!.hospital ?? letterhead.hospital, address: pack.letterhead!.address ?? letterhead.address, ...(pack.letterhead!.logo ? { logo: pack.letterhead!.logo } : {}), enabled: letterhead.enabled || !letterhead.name });
    toast(`Team pack ${how === "replace" ? "applied" : "added"}: ${pack.institution.protocols.length} protocol${pack.institution.protocols.length === 1 ? "" : "s"}${lh ? " and the department letterhead" : ""}`);
    setPack(null);
  };
  const exportIt = () => {
    const name = (institutionLabel(value) || "cadus-team").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "cadus-team";
    downloadBlob(`${name}-team-pack.json`, new Blob([exportPack(value, withLh ? letterhead : null)], { type: "application/json" }));
    toast("Team pack downloaded. Share the file with your team.");
  };

  return (
    <div className="cx-inst">
      <div className="cx-set-row">
        <div>
          <b>Follow my institution's protocols</b>
          <small>Cadus sends the protocols that match each question, with your formulary and antibiotic policy, and follows them in answers, flagging anything that conflicts with major guidelines. They aren't patient data and stay on this device otherwise.</small>
        </div>
        <button className={`cx-switch ${value.on ? "on" : ""}`} role="switch" aria-checked={value.on} aria-label="Follow my institution's protocols" onClick={() => set({ on: !value.on })} />
      </div>
      {value.source && <p className="cx-inst-src"><Building2 size={13} /> {value.source}</p>}

      <div className={`cx-inst-form ${value.on ? "" : "off"}`}>
        <div className="cx-ob-two">
          <label className="cx-field"><span>Hospital or college</span><input className="cx-input" value={value.name} maxLength={LIMITS.name} onChange={(e) => set({ name: e.target.value })} placeholder="City General Hospital" /></label>
          <label className="cx-field"><span>Department or unit</span><input className="cx-input" value={value.department} maxLength={LIMITS.department} onChange={(e) => set({ department: e.target.value })} placeholder="Department of Medicine" /></label>
        </div>
        <label className="cx-field">
          <span>Formulary notes</span>
          <textarea className="cx-input" rows={3} value={value.formulary} maxLength={LIMITS.formulary} onChange={(e) => set({ formulary: e.target.value })} placeholder="Stocked: ceftriaxone, piperacillin-tazobactam, enoxaparin… Not stocked: dabigatran, liposomal amphotericin (order from pharmacy)…" />
        </label>
        <label className="cx-field">
          <span>Antibiotic policy</span>
          <textarea className="cx-input" rows={3} value={value.antibiotic} maxLength={LIMITS.antibiotic} onChange={(e) => set({ antibiotic: e.target.value })} placeholder="Community-acquired pneumonia: amoxicillin-clavulanate + azithromycin. Meropenem and colistin need ID approval…" />
        </label>

        <div className="cx-inst-h">
          <div><b>Local protocols</b><small>{value.protocols.length ? `${value.protocols.length} of ${MAX_PROTOCOLS}` : "Paste your unit's protocols or import them from text files."}</small></div>
          <div className="cx-inst-acts">
            <button className="cx-btn" onClick={() => fileRef.current?.click()}><FileUp size={14} /> Import files</button>
            <button className="cx-btn primary" onClick={() => { setEditing(newProtocol()); setIsNew(true); }}><Plus size={14} /> Add protocol</button>
          </div>
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" multiple hidden onChange={(e) => { void importFiles(e.target.files); e.target.value = ""; }} />
        </div>

        {editing && (
          <div className="cx-inst-edit">
            <input className="cx-input" value={editing.title} maxLength={LIMITS.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title, e.g. Sepsis: first hour" aria-label="Protocol title" autoFocus />
            <textarea className="cx-input" rows={8} value={editing.text} maxLength={LIMITS.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} placeholder="The protocol as your unit uses it: criteria, drugs and doses, steps, who to call." aria-label="Protocol text" />
            <div className="cx-inst-edit-f">
              <small>{editing.text.length.toLocaleString("en-IN")} / {LIMITS.text.toLocaleString("en-IN")}</small>
              <button className="cx-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="cx-btn primary" onClick={saveEdit}>{isNew ? "Add" : "Save"}</button>
            </div>
          </div>
        )}

        {value.protocols.length > 0 ? (
          <ul className="cx-inst-list">
            {value.protocols.map((p) => (
              <li key={p.id}>
                <div className="t"><b>{p.title}</b><small>{p.text.replace(/\s+/g, " ").slice(0, 140)}</small></div>
                <button className="cx-ib" onClick={() => { setEditing(p); setIsNew(false); }} aria-label={`Edit ${p.title}`}><Pencil size={15} /></button>
                <button
                  className={`cx-ib ${armed === p.id ? "danger" : ""}`}
                  onClick={() => {
                    if (armed !== p.id) { setArmed(p.id); window.setTimeout(() => setArmed((a) => (a === p.id ? "" : a)), 3000); return; }
                    set({ protocols: value.protocols.filter((x) => x.id !== p.id) });
                    setArmed("");
                    toast("Protocol deleted");
                  }}
                  aria-label={armed === p.id ? `Click again to delete ${p.title}` : `Delete ${p.title}`}
                  title={armed === p.id ? "Click again to delete" : "Delete"}
                ><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        ) : !editing && (
          <div className="cx-inst-empty">
            <p>No protocols yet. Add your unit's protocols for sepsis, snakebite, DKA, antibiotic choices and so on, and Cadus follows them when a question matches.</p>
            <button className="cx-link" onClick={() => { set({ protocols: EXAMPLE.map((p) => newProtocol(p.title, p.text)) }); toast("Two example protocols added"); }}>Add two examples</button>
          </div>
        )}

        {value.protocols.length > 0 && (
          <div className="cx-inst-try">
            <label className="cx-search">
              <Search size={15} />
              <input value={tryQ} onChange={(e) => setTryQ(e.target.value)} placeholder="Try a question to see which protocols it uses" aria-label="Try a question" />
            </label>
            {tryQ.trim() && (
              <p aria-live="polite">{matched.length ? <>Sent with this question: <b>{matched.map((p) => p.title).join(", ")}</b></> : "No protocol matches this question; Cadus answers from general guidance."}</p>
            )}
          </div>
        )}
      </div>

      <p className="cx-set-sub">Share with your team</p>
      <div className="cx-set-row">
        <div>
          <b>Team pack</b>
          <small>One file with your institution, formulary, antibiotic policy and protocols{deptLh ? ", and optionally the department letterhead: the hospital, address and logo (never your name, registration, phone or email)" : ""}. Colleagues import it here so the whole team works from the same protocols.</small>
          {deptLh && (
            <button type="button" className={`cx-tg cx-inst-lh ${withLh ? "on" : ""}`} role="checkbox" aria-checked={withLh} onClick={() => setWithLh(!withLh)}>
              <span className="cx-tg-box" aria-hidden />
              <span className="cx-tg-l">Include the department letterhead</span>
            </button>
          )}
        </div>
        <div className="cx-inst-acts">
          <button className="cx-btn" onClick={exportIt} disabled={!hasInstitution(value)}><Download size={14} /> Export</button>
          <button className="cx-btn" onClick={() => packRef.current?.click()}><Upload size={14} /> Import</button>
          <input ref={packRef} type="file" accept=".json,application/json" hidden onChange={(e) => { void readPack(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>
      {pack && (
        <div className="cx-inst-pack" role="dialog" aria-label="Import a team pack">
          <b>{institutionLabel(pack.institution) || "Team pack"}</b>
          <p>
            {pack.institution.protocols.length} protocol{pack.institution.protocols.length === 1 ? "" : "s"}
            {pack.institution.formulary ? ", formulary notes" : ""}
            {pack.institution.antibiotic ? ", antibiotic policy" : ""}
            {pack.letterhead ? ", department letterhead" : ""}
            {pack.exportedAt ? ` · exported ${new Date(pack.exportedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
          {pack.letterhead && (
            <button type="button" className={`cx-tg cx-inst-lh ${packLh ? "on" : ""}`} role="checkbox" aria-checked={packLh} onClick={() => setPackLh(!packLh)}>
              <span className="cx-tg-box" aria-hidden />
              <span className="cx-tg-l">Use the department letterhead<small>Sets the hospital, address{pack.letterhead.logo ? " and logo" : ""} on your letterhead ({pack.letterhead.hospital}). Your name and registration stay as they are.</small></span>
            </button>
          )}
          {pack.institution.protocols.length > 0 && <ul>{pack.institution.protocols.slice(0, 8).map((p) => <li key={p.id}>{p.title}</li>)}{pack.institution.protocols.length > 8 && <li>and {pack.institution.protocols.length - 8} more</li>}</ul>}
          <div className="cx-inst-edit-f">
            <button className="cx-btn" onClick={() => setPack(null)}>Cancel</button>
            {value.protocols.length > 0 && <button className="cx-btn" onClick={() => usePack("merge")}>Add to mine</button>}
            <button className="cx-btn primary" onClick={() => usePack("replace")}>{value.protocols.length ? "Replace mine" : "Use this pack"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
