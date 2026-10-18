/**
 * Patient leaflets and consent forms: pick what to explain and in which
 * language, get a leaflet written for the patient, then print it on the
 * letterhead, send it by WhatsApp, or keep it for next time.
 */
import { useEffect, useState } from "react";
import { FileText, Languages, MessageCircle, Printer, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { CONSENT_PRESETS, LANGUAGES, LEAFLET_KINDS, leafletText, newLeaflet, readLeaflets, saveLeaflets, type Leaflet, type LeafletKind } from "@/lib/cadus/leaflets";

export default function LeafletsView({ generate, onPrint, onWord, friendlyError, toast, letterhead, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<{ text?: string }>;
  onPrint: (title: string, md: string) => void;
  onWord: (title: string, md: string) => void;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  letterhead: boolean;
  defaultLanguage: string;
}) {
  const [list, setList] = useState<Leaflet[]>(readLeaflets);
  const [kind, setKind] = useState<LeafletKind>("condition");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "English");
  const [level, setLevel] = useState<"simple" | "standard">("standard");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState("");
  useEffect(() => saveLeaflets(list), [list]);
  const open = list.find((l) => l.id === openId) ?? null;
  const kindDef = LEAFLET_KINDS.find((k) => k.id === kind)!;

  const make = async () => {
    if (!subject.trim()) { toast(`Say which ${kindDef.label.toLowerCase().replace("a ", "")} the leaflet is about`); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "leaflet", kind, subject: subject.trim(), language, level, notes: notes.trim() });
      if (!r.text) throw new Error("The leaflet came back empty");
      const l = newLeaflet({ kind, subject: subject.trim(), language, level, text: r.text });
      setList((x) => [l, ...x]);
      setOpenId(l.id);
      toast("Leaflet ready; read it through before giving it to the patient");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };
  const title = (l: Leaflet) => `${l.kind === "consent" ? "Consent: " : ""}${l.subject}`;

  return (
    <section className="cx-page cx-lf">
      <header className="cx-page-h">
        <div><h1>Patient leaflets and consent</h1><p>Explain a condition, a procedure or a medicine in the patient's language, or prepare an informed-consent form, and print it on your letterhead or send it by WhatsApp.</p></div>
      </header>
      <div className="cx-lf-grid">
        <div className="cx-lf-form">
          <div className="cx-sc-kinds" role="radiogroup" aria-label="Leaflet type">
            {LEAFLET_KINDS.map((k) => <button key={k.id} role="radio" aria-checked={kind === k.id} className={kind === k.id ? "on" : ""} onClick={() => { setKind(k.id); setOpenId(""); }}><b>{k.label}</b><small>{k.hint}</small></button>)}
          </div>
          <label className="cx-field"><span>{kind === "consent" ? "Procedure" : kindDef.label}</span><input className="cx-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={kindDef.placeholder} maxLength={200} list={kind === "consent" ? "cx-consent-presets" : undefined} /></label>
          {kind === "consent" && <datalist id="cx-consent-presets">{CONSENT_PRESETS.map((p) => <option key={p} value={p} />)}</datalist>}
          <div className="cx-pd-row">
            <label className="cx-field"><span><Languages size={13} /> Language</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
            <label className="cx-field"><span>Reading level</span><div className="cx-seg"><button className={level === "standard" ? "on" : ""} onClick={() => setLevel("standard")}>Plain</button><button className={level === "simple" ? "on" : ""} onClick={() => setLevel("simple")}>Very simple</button></div></label>
          </div>
          <label className="cx-field"><span>Anything specific to include (optional)</span><textarea className="cx-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={kind === "consent" ? "Surgeon's name, anaesthesia type, specific risks for this patient" : "Diet advice, the dose you prescribed, when to come back"} maxLength={1500} /></label>
          <button className="cx-btn primary" onClick={make} disabled={busy || !subject.trim()}><Sparkles size={14} /> {busy ? "Writing…" : kind === "consent" ? "Prepare the consent form" : "Write the leaflet"}</button>
          {list.length > 0 && (
            <div className="cx-lf-saved">
              <p className="cx-gl"><span>Saved on this device</span></p>
              {list.map((l) => <button key={l.id} className={`cx-sc-row ${l.id === openId ? "on" : ""}`} onClick={() => setOpenId(l.id)}><b>{title(l)}</b><small>{l.language} · {new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
            </div>
          )}
        </div>
        <div className="cx-lf-out">
          {open ? (
            <>
              <div className="cx-sc-head">
                <div><h2>{title(open)}</h2><small>{open.language} · {open.level === "simple" ? "very simple" : "plain"} reading level</small></div>
                <div className="cx-sc-acts">
                  <button className="cx-btn primary" onClick={() => onPrint(title(open), open.text)}><Printer size={14} /> Print{letterhead ? " on letterhead" : ""}</button>
                  <button className="cx-btn" onClick={() => onWord(title(open), open.text)}><FileText size={14} /> Word</button>
                  {open.kind !== "consent" && <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(leafletText(open).slice(0, 3500))}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>}
                  <button className="cx-ib" onClick={() => { setList((x) => x.filter((l) => l.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="cx-sc-note cx-lf-text"><MdBlock text={open.text} /></div>
              <p className="cx-rs-foot"><ShieldCheck size={13} /> Written for the patient from standard guidance; read it through and change anything that does not fit your patient before handing it over. {open.kind === "consent" ? "Consent is a conversation; the form records it." : ""}</p>
            </>
          ) : (
            <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><FileText size={20} /></span><h3>Nothing open</h3><p>Write a leaflet, or pick one you saved earlier.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
