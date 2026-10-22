/**
 * Procedure Guide: a bedside procedure step by step (indications, contraindications, an
 * equipment checklist, preparation, steps, aftercare, complications with how often they
 * happen) and a consent sheet for the patient in their language, to print and sign.
 * Guides are kept on this device, so a second look needs no connection.
 */
import { useEffect, useState } from "react";
import { CheckSquare, ClipboardSignature, Copy, ListChecks, Printer, Sparkles, Square, Trash2, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { PROCEDURES, procMarkdown, readProcs, saveProcs, type ProcRecord } from "@/lib/cadus/clinicalAi";
import { sid } from "@/lib/cadus/studio";
import { PresetPicker, SavedList } from "./BedsideParts";

export default function ProcedureView({ generate, friendlyError, toast, onPrint, defaultLanguage }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string, large?: boolean) => void;
  defaultLanguage: string;
}) {
  const [procedure, setProcedure] = useState("");
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) ? defaultLanguage : "English");
  const [level, setLevel] = useState<"intern" | "resident" | "senior">("resident");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<ProcRecord[]>(readProcs);
  const [openId, setOpenId] = useState("");
  const [tab, setTab] = useState<"guide" | "consent">("guide");
  const [ticked, setTicked] = useState<string[]>([]);
  useEffect(() => saveProcs(list), [list]);
  const open = list.find((x) => x.id === openId) ?? null;

  const run = async () => {
    const p = procedure.trim();
    if (p.length < 3) { toast("Choose or type the procedure"); return; }
    const cached = list.find((x) => x.procedure.toLowerCase() === p.toLowerCase() && x.language === language);
    if (cached) { setOpenId(cached.id); setTab("guide"); setTicked([]); toast("Opened your saved guide"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "procedure", procedure: p, language, level });
      if (!r?.result?.steps?.length) throw new Error("No guide came back");
      const rec: ProcRecord = { id: sid(), at: Date.now(), procedure: p, language, result: r.result };
      setList((l) => [rec, ...l]);
      setOpenId(rec.id); setTab("guide"); setTicked([]);
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };
  const tick = (k: string) => setTicked((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));

  const x = open?.result;
  return (
    <section className="cx-page cx-bs cx-proc">
      <header className="cx-page-h"><div><h1>Procedure Guide</h1><p>Common bedside procedures step by step, with an equipment checklist, complications and a consent sheet for the patient in their language.</p></div></header>
      <PresetPicker groups={PROCEDURES} value={procedure} onPick={setProcedure} testId="procedures" />
      <div className="cx-bs-row">
        <input className="cx-input" value={procedure} onChange={(e) => setProcedure(e.target.value.slice(0, 120))} placeholder="Or type a procedure" aria-label="Procedure" data-proc="name" />
        <label className="cx-field"><span>Consent in</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-proc="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
        <div className="cx-field"><span>I am</span><div className="cx-seg">{(["intern", "resident", "senior"] as const).map((k) => <button key={k} className={level === k ? "on" : ""} onClick={() => setLevel(k)}>{k === "intern" ? "Intern" : k === "resident" ? "Resident" : "Senior"}</button>)}</div></div>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || procedure.trim().length < 3} data-proc="go"><ListChecks size={15} /> {busy ? "Writing the guide…" : "Open guide"}</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Follow your hospital's policy and do procedures under supervision until you're signed off.</p>

      {x && open ? (
        <div className="cx-cmp-out" data-proc="out">
          <div className="cx-seg cx-rex-tabs" role="tablist">
            <button role="tab" aria-selected={tab === "guide"} className={tab === "guide" ? "on" : ""} onClick={() => setTab("guide")}>{open.procedure}</button>
            <button role="tab" aria-selected={tab === "consent"} className={tab === "consent" ? "on" : ""} onClick={() => setTab("consent")} disabled={!x.consent} data-proc="consent-tab"><ClipboardSignature size={14} /> Consent · {open.language}</button>
          </div>
          {tab === "guide" ? (
            <>
              <div className="cx-sim-cols">
                <div className="cx-sim-card ok"><h3>Indications</h3><ul>{x.indications.map((s) => <li key={s}>{s}</li>)}</ul></div>
                <div className="cx-sim-card bad"><h3>Contraindications</h3><ul>{x.contraindications.map((s) => <li key={s}>{s}</li>)}</ul></div>
              </div>
              <div className="cx-proc-eq" data-proc="equipment"><h3 className="cx-lab-h3">Equipment ({x.equipment.filter((e) => ticked.includes(`e:${e}`)).length}/{x.equipment.length})</h3>
                {x.equipment.map((e) => <button key={e} className={ticked.includes(`e:${e}`) ? "on" : ""} onClick={() => tick(`e:${e}`)}>{ticked.includes(`e:${e}`) ? <CheckSquare size={15} /> : <Square size={15} />} {e}</button>)}
              </div>
              {x.preparation.length > 0 && <div className="cx-sim-card"><h3>Before you start</h3><ul>{x.preparation.map((s) => <li key={s}>{s}</li>)}</ul></div>}
              <ol className="cx-proc-steps" data-proc="steps">{x.steps.map((s, i) => <li key={i} className={ticked.includes(`s:${i}`) ? "done" : ""}><button onClick={() => tick(`s:${i}`)} aria-label={`Step ${i + 1} done`}>{i + 1}</button><div><b>{s.title}</b><p>{s.detail}</p></div></li>)}</ol>
              {x.complications.length > 0 && (
                <div className="cx-lab-table"><table><thead><tr><th>Complication</th><th>How often</th><th>If it happens</th></tr></thead><tbody>{x.complications.map((c) => <tr key={c.name}><td><b>{c.name}</b></td><td>{c.frequency}</td><td>{c.action}</td></tr>)}</tbody></table></div>
              )}
              <div className="cx-sim-cols">
                {x.aftercare.length > 0 && <div className="cx-sim-card"><h3>Aftercare</h3><ul>{x.aftercare.map((s) => <li key={s}>{s}</li>)}</ul></div>}
                {x.pearls.length > 0 && <div className="cx-sim-card warn"><h3>Tips</h3><ul>{x.pearls.map((s) => <li key={s}>{s}</li>)}</ul></div>}
              </div>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={() => onPrint(open.procedure, procMarkdown(open))}><Printer size={14} /> Print checklist</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(procMarkdown(open)); toast("Copied"); }}><Copy size={14} /> Copy</button>
                <button className="cx-ib" onClick={() => { setList((l) => l.filter((y) => y.id !== open.id)); setOpenId(""); }} aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </>
          ) : (
            <>
              <div className="cx-sc-note cx-lf-text" data-proc="consent"><MdBlock text={x.consent} /></div>
              <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint(`Consent: ${open.procedure}`, x.consent, true)} data-proc="print-consent"><Printer size={14} /> Print consent (large)</button></div>
            </>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Choose a procedure</h3><p>Guides you open are saved here for next time.</p></div>
      ) : null}
      <SavedList title="Saved guides" items={list} openId={openId} onOpen={(id) => { setOpenId(id); setTab("guide"); setTicked([]); }} render={(r) => ({ b: r.procedure, s: `Consent in ${r.language}` })} />
    </section>
  );
}
