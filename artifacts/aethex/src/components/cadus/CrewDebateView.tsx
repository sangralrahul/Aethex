/**
 * Crew Debate: two Cadus Crew assistants argue opposite positions on a clinical question
 * (openings at once, then each rebuts the other), and a neutral judge weighs the evidence:
 * the bottom line, why, the strongest point on each side and anything either got wrong.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, Copy, Gavel, RotateCcw, Scale, ShieldCheck, Sparkles, Swords, Trash2, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { allCrew, DEBATE_PRESETS, findCrew, readDebates, saveDebates, type CrewMember, type Debate, type DebateSide, type DebateVerdict } from "@/lib/cadus/crew";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const WIN: Record<DebateVerdict["winner"], string> = { a: "Side A has the stronger case", b: "Side B has the stronger case", draw: "Evenly matched", depends: "It depends" };

export default function CrewDebateView({ mine, badge, turn, judge, canAsk, friendlyError, toast, onSave }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  turn: (c: CrewMember, o: { question: string; position: string; other: string; round: 1 | 2; opponent?: string; opponentName?: string }) => Promise<string>;
  judge: (question: string, sides: { name: string; position: string; opening: string; rebuttal: string }[]) => Promise<DebateVerdict>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (question: string, answer: string) => void;
}) {
  const crew = allCrew(mine);
  const [aId, setAId] = useState("crew-ed");
  const [bId, setBId] = useState("crew-neuro");
  const [posA, setPosA] = useState("");
  const [posB, setPosB] = useState("");
  const [question, setQuestion] = useState("");
  const [list, setList] = useState<Debate[]>(readDebates);
  const [openId, setOpenId] = useState("");
  const [running, setRunning] = useState(false);
  useEffect(() => saveDebates(list), [list]);
  const open = list.find((d) => d.id === openId) ?? null;
  const update = (id: string, f: (d: Debate) => Debate) => setList((l) => l.map((d) => (d.id === id ? f(d) : d)));
  const ready = aId && bId && aId !== bId && posA.trim() && posB.trim() && question.trim().length > 10;
  const err = (e: unknown) => friendlyError(e instanceof Error ? e.message : String(e));

  const runJudge = async (d: Debate) => {
    try {
      const verdict = await judge(d.question, [d.a, d.b].map((s) => ({ name: s.name, position: s.position, opening: s.opening, rebuttal: s.rebuttal })));
      update(d.id, (x) => ({ ...x, verdict, judgeError: undefined }));
    } catch (e) { update(d.id, (x) => ({ ...x, judgeError: err(e) })); }
  };

  const start = async () => {
    const A = findCrew(aId, mine), B = findCrew(bId, mine);
    if (!A || !B || A.id === B.id) { toast("Choose two different assistants"); return; }
    const q = deidentify(question.trim());
    if (!ready) { toast("Add the question and both positions"); return; }
    if (!canAsk(3)) return;
    const side = (c: CrewMember, position: string): DebateSide => ({ crewId: c.id, name: c.name, icon: c.icon, tone: c.tone, position: position.trim(), opening: "", rebuttal: "" });
    let d: Debate = { id: uid(), at: Date.now(), question: q.text, a: side(A, posA), b: side(B, posB) };
    setList((l) => [d, ...l]);
    setOpenId(d.id);
    setRunning(true);
    if (q.total) toast(`Hid ${q.total} patient identifier${q.total === 1 ? "" : "s"} before asking`);
    const set = (k: "a" | "b", p: Partial<DebateSide>) => { d = { ...d, [k]: { ...d[k], ...p } }; update(d.id, (x) => ({ ...x, [k]: { ...x[k], ...p } })); };
    // Round 1: both openings at once.
    await Promise.all((["a", "b"] as const).map(async (k) => {
      const me = k === "a" ? A : B, mineSide = d[k], otherSide = d[k === "a" ? "b" : "a"];
      try { set(k, { opening: await turn(me, { question: d.question, position: mineSide.position, other: otherSide.position, round: 1 }) }); } catch (e) { set(k, { error: err(e) }); }
    }));
    if (!d.a.opening || !d.b.opening) { setRunning(false); return; }
    // Round 2: each rebuts the other's opening.
    await Promise.all((["a", "b"] as const).map(async (k) => {
      const me = k === "a" ? A : B, other = d[k === "a" ? "b" : "a"];
      try { set(k, { rebuttal: await turn(me, { question: d.question, position: d[k].position, other: other.position, round: 2, opponent: other.opening, opponentName: other.name }) }); } catch (e) { set(k, { error: err(e) }); }
    }));
    await runJudge(d);
    setRunning(false);
  };

  const v = open?.verdict;
  const md = open && v ? [
    `# Crew Debate: ${open.question}`,
    `**A, ${open.a.name}:** ${open.a.position}  \n**B, ${open.b.name}:** ${open.b.position}`,
    `## Verdict: ${WIN[v.winner]}\n**${v.bottomLine}**\n\n${v.verdict}`,
    v.errors.length ? `## Corrections\n${v.errors.map((e) => `- **${e.who}:** ${e.issue} → ${e.fix}`).join("\n")}` : "",
    v.evidence.length ? `## Evidence\n${v.evidence.map((e) => `- ${e}`).join("\n")}` : "",
    `## ${open.a.name} (A)\n${open.a.opening}\n\n**Rebuttal:** ${open.a.rebuttal}`,
    `## ${open.b.name} (B)\n${open.b.opening}\n\n**Rebuttal:** ${open.b.rebuttal}`,
  ].filter(Boolean).join("\n\n") : "";

  const SideCard = ({ s, k }: { s: DebateSide; k: "a" | "b" }) => (
    <article className={`cx-hd-card cx-db-side tone-${s.tone} ${v && (v.winner === k) ? "won" : ""}`} data-debate-side={k}>
      <div className="cx-hd-card-h">{badge(s, 26)}<b>{s.name}</b><em className="cx-db-tag">{k.toUpperCase()}</em></div>
      <p className="cx-db-pos">{s.position}</p>
      {s.error ? <p className="cx-hd-err"><TriangleAlert size={14} /> {s.error}</p> : null}
      {s.opening ? <div className="cx-hd-body"><MdBlock text={s.opening} /></div> : !s.error && <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> Preparing the opening…</div>}
      {s.opening && (s.rebuttal ? <div className="cx-db-reb"><p className="cx-gl"><span>Rebuttal</span></p><MdBlock text={s.rebuttal} /></div> : !s.error && running && <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> Rebutting…</div>)}
    </article>
  );

  return (
    <section className="cx-page cx-huddle cx-debate">
      <header className="cx-page-h"><div><p className="cx-crew-eyebrow"><Swords size={14} /> Cadus Crew</p><h1>Crew Debate</h1><p>Two assistants argue opposite sides of a clinical question, each rebuts the other, then a neutral judge weighs the evidence.</p></div></header>
      <div className="cx-hd-ask">
        <div className="cx-hd-presets">{DEBATE_PRESETS.map((p) => <button key={p.label} onClick={() => { setQuestion(p.question); setAId(p.a[0]); setPosA(p.a[1]); setBId(p.b[0]); setPosB(p.b[1]); }} data-debate-preset={p.label}>{p.label}</button>)}</div>
        <textarea className="cx-input" rows={2} value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 3000))} placeholder="The question, with the patient's details: e.g. 72-year-old, stroke 3.5 h ago, NIHSS 8: thrombolyse?" aria-label="Debate question" data-debate="q" />
        <div className="cx-db-setup">
          {([["A", aId, setAId, posA, setPosA], ["B", bId, setBId, posB, setPosB]] as const).map(([k, id, setId, pos, setPos]) => (
            <div key={k} className="cx-db-pick" data-debate-pick={k}>
              <span className="cx-db-tag">{k}</span>
              <select className="cx-select" value={id} onChange={(e) => setId(e.target.value)} aria-label={`Assistant for side ${k}`} data-debate={`crew-${k.toLowerCase()}`}>{crew.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input className="cx-input" value={pos} onChange={(e) => setPos(e.target.value.slice(0, 300))} placeholder={k === "A" ? "Position, e.g. Thrombolyse now" : "Opposite position, e.g. Don't thrombolyse"} aria-label={`Position ${k}`} data-debate={`pos-${k.toLowerCase()}`} />
            </div>
          ))}
        </div>
        {aId === bId && <p className="cx-sc-gaps">Choose two different assistants.</p>}
        <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={running || !ready} data-debate="go"><Swords size={15} /> {running ? "Debating…" : "Start the debate"}</button><small className="cx-pc-words">Uses 3 of today's questions</small></div>
      </div>

      {open ? (
        <div className="cx-hd-out" data-debate="out">
          <div className="cx-hd-q"><b>{open.question}</b><button className="cx-ib" onClick={() => { setList((l) => l.filter((d) => d.id !== open.id)); setOpenId(""); }} aria-label="Delete this debate"><Trash2 size={15} /></button></div>
          <div className="cx-hd-grid n2"><SideCard s={open.a} k="a" /><SideCard s={open.b} k="b" /></div>
          <div className="cx-hd-merged" data-debate="verdict">
            <div className="cx-hd-merged-h"><Gavel size={16} /><b>Verdict</b>{v && <span className={`cx-hd-conf c-${v.confidence}`}><ShieldCheck size={13} /> Judged by Cadus · {v.confidence} confidence</span>}</div>
            {v ? (
              <>
                <p className="cx-db-win" data-debate="winner"><Scale size={15} /> {WIN[v.winner]}{v.winner === "a" ? `: ${open.a.name}` : v.winner === "b" ? `: ${open.b.name}` : ""}</p>
                <p className="cx-db-bottom"><b>{v.bottomLine}</b></p>
                <MdBlock text={v.verdict} />
                {(v.strongest.a || v.strongest.b) && <div className="cx-hd-cols"><div><p className="cx-gl"><span>Strongest point, A</span></p><p>{v.strongest.a}</p></div><div><p className="cx-gl"><span>Strongest point, B</span></p><p>{v.strongest.b}</p></div></div>}
                {v.errors.length > 0 && <div className="cx-hd-corr"><b><TriangleAlert size={14} /> Corrections</b><ul>{v.errors.map((e, i) => <li key={i}><b>{e.who}:</b> {e.issue} <span>→ {e.fix}</span></li>)}</ul></div>}
                {v.evidence.length > 0 && <div><p className="cx-gl"><span>Evidence that decides it</span></p><ul>{v.evidence.map((e) => <li key={e}>{e}</li>)}</ul></div>}
                <div className="cx-sc-acts">
                  <button className="cx-btn" onClick={() => onSave(`Crew Debate: ${open.question}`, md)} data-debate="save"><Bookmark size={14} /> Save to Library</button>
                  <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md); toast("Copied"); }}><Copy size={14} /> Copy</button>
                </div>
              </>
            ) : open.judgeError ? (
              <p className="cx-hd-err"><TriangleAlert size={14} /> {open.judgeError} <button className="cx-link" onClick={() => void runJudge(open)} disabled={running}><RotateCcw size={13} /> Try again</button></p>
            ) : (open.a.error || open.b.error) && !running ? (
              <p className="cx-hd-err"><TriangleAlert size={14} /> One side couldn't argue, so there's nothing to judge. Start the debate again.</p>
            ) : (
              <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> {open.a.rebuttal && open.b.rebuttal ? "The judge is weighing the evidence…" : "Waiting for both sides…"}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Hear both sides before you decide</h3><p>Pick a ready-made debate above, or write your own question and two positions.</p></div>
      )}
      {list.length > 0 && (
        <div className="cx-hd-recent">
          <p className="cx-gl"><span>Recent debates</span></p>
          {list.slice(0, 8).map((d) => <button key={d.id} className={`cx-sc-row ${d.id === openId ? "on" : ""}`} onClick={() => setOpenId(d.id)}><b>{d.question}</b><small>{d.a.name} vs {d.b.name}{d.verdict ? ` · ${WIN[d.verdict.winner]}` : ""}</small></button>)}
        </div>
      )}
    </section>
  );
}
