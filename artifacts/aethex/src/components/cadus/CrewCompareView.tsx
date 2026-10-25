/**
 * Assistant Compare: ask two or three assistants the same question and read the answers side by
 * side, with the points only one of them makes and the doses that differ highlighted.
 */
import { useState, type ReactNode } from "react";
import { Columns3, Copy, Loader2, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { allCrew, compareAnswers, findCrew, suggestCrew, type CrewMember } from "@/lib/cadus/crew";

export default function CrewCompareView({ mine, badge, ask, canAsk, friendlyError, toast }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [q, setQ] = useState("");
  const [ids, setIds] = useState(["crew-cardio", "crew-pharmacist", ""]);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ id: string; name: string; text: string; error?: boolean }[]>([]);
  const chosen = ids.filter(Boolean).map((id) => findCrew(id, mine)).filter((c): c is CrewMember => !!c);
  const sug = suggestCrew(q, mine, 3);

  const run = async () => {
    const text = deidentify(q.trim()).text;
    if (!text) { toast("Type a question first"); return; }
    if (chosen.length < 2) { toast("Choose at least two assistants"); return; }
    if (!canAsk(chosen.length)) return;
    setBusy(true); setOut([]);
    const res = await Promise.all(chosen.map(async (c) => {
      try { return { id: c.id, name: c.name, text: await ask(c, text) }; }
      catch (e) { return { id: c.id, name: c.name, text: friendlyError(e instanceof Error ? e.message : String(e)), error: true }; }
    }));
    setOut(res); setBusy(false);
  };
  const ok = out.filter((o) => !o.error);
  const cmp = ok.length >= 2 ? compareAnswers(ok.map((o) => ({ name: o.name, text: o.text }))) : null;

  return (
    <section className="cx-page cx-lab cx-crewcompare">
      <header className="cx-page-h"><div><h1>Assistant Compare</h1><p>Ask two or three assistants the same question and see the answers side by side, with what only one of them says and the doses that differ.</p></div></header>
      <label className="cx-field"><span>Question (no names or identifying details)</span><textarea className="cx-input" rows={3} value={q} onChange={(e) => setQ(e.target.value.slice(0, 3000))} placeholder="e.g. AF in a 78-year-old with eGFR 35: which anticoagulant and dose?" data-cc="q" /></label>
      {sug.length > 0 && <p className="cx-set-hint">Suggested: {sug.map((s) => <button key={s.id} className="cx-chip" onClick={() => setIds((l) => (l.includes(s.id) ? l : [...l.filter(Boolean), s.id, "", ""].slice(0, 3)))}>{s.name}</button>)}</p>}
      <div className="cx-c23-row">{ids.map((id, i) => <label key={i} className="cx-field"><span>Assistant {i + 1}{i === 2 ? " (optional)" : ""}</span><select className="cx-select" value={id} onChange={(e) => setIds(ids.map((x, j) => (j === i ? e.target.value : x)))} data-cc-pick={i}>{i === 2 && <option value="">None</option>}{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>)}</div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy} data-cc="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <Columns3 size={14} />} Compare {chosen.length} answers</button></div>
      {out.length > 0 && (
        <div className="cx-cc-cols" style={{ ["--n" as string]: out.length }} data-cc="cols">{out.map((o) => { const c = findCrew(o.id, mine); return (
          <div key={o.id} className={`cx-cmp-out ${o.error ? "cx-st-out" : ""}`} data-cc-col={o.id}><div className="cx-so-h">{c && badge(c, 24)}<b>{o.name}</b></div><MdBlock text={o.text} /></div>); })}</div>
      )}
      {cmp && (
        <div className="cx-cmp-out cx-ac-high" data-cc="diff">
          <h3 className="cx-lab-h3">What differs</h3>
          {cmp.rows.map((r) => <div key={r.name}><h4>Only {r.name} says ({r.shared.length} point{r.shared.length === 1 ? "" : "s"} shared)</h4>{r.unique.length ? <ul>{r.unique.map((u) => <li key={u}>{u}</li>)}</ul> : <p className="cx-set-hint">Nothing that the others did not also say.</p>}</div>)}
          {cmp.doseOnlyIn.length > 0 && <><h4><TriangleAlert size={14} /> Doses that are not in every answer</h4><ul data-cc="doses">{cmp.doseOnlyIn.map((d) => <li key={d.dose}><b>{d.dose}</b>: {d.names.join(", ")}</li>)}</ul><p className="cx-set-hint">Check these against a formulary before use.</p></>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out.map((o) => `## ${o.name}\n\n${o.text}`).join("\n\n")); toast("Copied"); }}><Copy size={14} /> Copy all answers</button></div>
        </div>
      )}
    </section>
  );
}
