/**
 * Case Round: one case passes through chosen specialists in turn. Each sees the case and what the
 * colleagues before said, adds their own view, and a chair writes the consensus plan.
 */
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Copy, Loader2, Plus, Printer, Stethoscope, TriangleAlert, Users, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { allCrew, CASE_ROUND_MAX, CASE_ROUND_PRESETS, caseRoundMd, caseRoundMessage, caseSummaryMessage, findCrew, readCaseRounds, saveCaseRounds, type CaseRound, type CrewMember } from "@/lib/cadus/crew";

export default function CrewCaseRoundView({ mine, badge, ask, canAsk, friendlyError, toast, onPrint }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [caseText, setCaseText] = useState("");
  const [ids, setIds] = useState<string[]>(CASE_ROUND_PRESETS[0].ids);
  const [add, setAdd] = useState("");
  const [summary, setSummary] = useState(true);
  const [busy, setBusy] = useState(-1);
  const [round, setRound] = useState<CaseRound | null>(null);
  const [past, setPast] = useState<CaseRound[]>(readCaseRounds);
  const move = (k: number, d: number) => { const j = k + d; if (j < 0 || j >= ids.length) return; const n = [...ids]; [n[k], n[j]] = [n[j], n[k]]; setIds(n); };

  const run = async () => {
    const text = deidentify(caseText.trim()).text;
    if (text.length < 20) { toast("Describe the case first (age, problem, findings, results)"); return; }
    const team = ids.map((id) => findCrew(id, mine)).filter((c): c is CrewMember => !!c);
    if (team.length < 2) { toast("Choose at least two specialists"); return; }
    if (!canAsk(team.length + (summary ? 1 : 0))) return;
    let r: CaseRound = { id: `cr-${Date.now().toString(36)}`, at: Date.now(), caseText: text, steps: [] };
    setRound(r);
    for (let k = 0; k < team.length; k++) {
      setBusy(k);
      const c = team[k];
      try {
        const out = await ask(c, caseRoundMessage(text, c.name, r.steps.filter((s) => s.text).map((s) => ({ name: s.name, text: s.text }))));
        r = { ...r, steps: [...r.steps, { crewId: c.id, name: c.name, text: out }] };
      } catch (e) {
        r = { ...r, steps: [...r.steps, { crewId: c.id, name: c.name, text: "", error: friendlyError(e instanceof Error ? e.message : String(e)) }] };
      }
      setRound(r);
    }
    if (summary && r.steps.some((s) => s.text)) {
      setBusy(team.length);
      const chair = findCrew("crew-rounds", mine) ?? team[0];
      try { r = { ...r, summary: await ask(chair, caseSummaryMessage(text, r.steps.filter((s) => s.text).map((s) => ({ name: s.name, text: s.text })))) }; }
      catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
      setRound(r);
    }
    setBusy(-1);
    const list = [r, ...past.filter((p) => p.id !== r.id)].slice(0, 15);
    setPast(list); saveCaseRounds(list);
  };

  return (
    <section className="cx-page cx-lab cx-caseround">
      <header className="cx-page-h"><div><h1>Case Round</h1><p>Take one case round the specialists: each reads the case and what the colleagues before said, adds their view (and disagrees if needed), then the chair writes one consensus plan.</p></div></header>
      <label className="cx-field"><span>The case (no names or identifying details)</span><textarea className="cx-input" rows={5} value={caseText} onChange={(e) => setCaseText(e.target.value.slice(0, 6000))} placeholder="e.g. 62-year-old man, diabetic, 3 days of fever and breathlessness, creatinine 2.8 (baseline 1.1), K 6.1, on metformin, ramipril and diclofenac…" data-cr="case" /></label>
      <div className="cx-crew-chips" data-cr="presets">{CASE_ROUND_PRESETS.map((p) => <button key={p.id} className={`cx-chip ${ids.join() === p.ids.join() ? "on" : ""}`} onClick={() => setIds(p.ids)} data-cr-preset={p.id}><Users size={13} /> {p.label}</button>)}</div>
      <ol className="cx-cr-team" data-cr="team">{ids.map((id, k) => { const c = findCrew(id, mine); return c ? (
        <li key={id}>{badge(c, 22)} <b>{c.name}</b>
          <span className="cx-cr-acts"><button className="cx-ib" onClick={() => move(k, -1)} disabled={k === 0} aria-label={`Move ${c.name} earlier`}><ArrowUp size={14} /></button><button className="cx-ib" onClick={() => move(k, 1)} disabled={k === ids.length - 1} aria-label={`Move ${c.name} later`}><ArrowDown size={14} /></button><button className="cx-ib" onClick={() => setIds(ids.filter((x) => x !== id))} aria-label={`Remove ${c.name}`} data-cr-remove={id}><X size={14} /></button></span>
        </li>) : null; })}</ol>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Add a specialist</span><select className="cx-select" value={add} onChange={(e) => setAdd(e.target.value)} data-cr="add"><option value="">Choose…</option>{allCrew(mine).filter((c) => !ids.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <button className="cx-btn" disabled={!add || ids.length >= CASE_ROUND_MAX} onClick={() => { setIds([...ids, add]); setAdd(""); }} data-cr="add-btn"><Plus size={14} /> Add</button>
        <label className="cx-pa-mine"><input type="checkbox" checked={summary} onChange={(e) => setSummary(e.target.checked)} data-cr="summary" /> Finish with a consensus plan</label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy >= 0} data-cr="run">{busy >= 0 ? <Loader2 size={14} className="cx-rot" /> : <Stethoscope size={14} />} Start the case round ({ids.length + (summary ? 1 : 0)} questions)</button></div>
      {round && (
        <div data-cr="out">
          {round.steps.map((s, k) => { const c = findCrew(s.crewId, mine); return (
            <div key={k} className={`cx-cmp-out ${s.error ? "cx-st-out" : ""}`} data-cr-step={k}>
              <div className="cx-so-h">{c && badge(c, 28)}<b>{k + 1}. {s.name}</b></div>
              {s.error ? <p>{s.error}</p> : <MdBlock text={s.text} />}
            </div>); })}
          {busy >= 0 && busy < ids.length && <p className="cx-set-hint"><Loader2 size={13} className="cx-rot" /> {findCrew(ids[busy], mine)?.name} is reviewing…</p>}
          {busy === ids.length && <p className="cx-set-hint"><Loader2 size={13} className="cx-rot" /> Writing the consensus plan…</p>}
          {round.summary && <div className="cx-cmp-out cx-ac-in" data-cr="summary-out"><h3 className="cx-lab-h3">Consensus plan</h3><MdBlock text={round.summary} /></div>}
          {busy < 0 && round.steps.length > 0 && (
            <div className="cx-sc-acts">
              <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(caseRoundMd(round)); toast("Copied"); }} data-cr="copy"><Copy size={14} /> Copy</button>
              <button className="cx-btn" onClick={() => onPrint("Case round", caseRoundMd(round))} data-cr="print"><Printer size={14} /> Print</button>
            </div>
          )}
        </div>
      )}
      {past.length > 0 && busy < 0 && (
        <>
          <h4>Earlier case rounds</h4>
          <ul data-cr="past">{past.slice(0, 8).map((p) => <li key={p.id}><button className="cx-link" onClick={() => setRound(p)}>{p.caseText.slice(0, 80)}{p.caseText.length > 80 ? "…" : ""}</button> <small>({p.steps.length} specialists)</small></li>)}</ul>
        </>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> A case round helps you think; the team caring for the patient decides. Names and numbers that look like identifiers are removed before sending.</p>
    </section>
  );
}
