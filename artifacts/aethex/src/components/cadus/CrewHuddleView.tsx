/**
 * Crew Huddle: ask two to four Cadus Crew assistants the same question at once. Each
 * answers in its own role (and with its own knowledge), side by side as they arrive;
 * then Cadus combines them into one checked answer with what they agree on, where they
 * differ and anything one of them got wrong.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, Check, Combine, Copy, MessagesSquare, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2, TriangleAlert, Users2, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { allCrew, findCrew, HUDDLE_PRESETS, readHuddles, saveHuddles, type CrewMember, type Huddle, type HuddleAnswer, type HuddleResult } from "@/lib/cadus/crew";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const CONF: Record<HuddleResult["confidence"], string> = { high: "High confidence", moderate: "Moderate confidence", low: "Low confidence" };

export default function CrewHuddleView({ mine, badge, ask, merge, canAsk, friendlyError, toast, onSave, onContinue, initial }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  /** One assistant's answer to the question. */
  ask: (c: CrewMember, question: string) => Promise<string>;
  merge: (question: string, answers: { name: string; answer: string }[]) => Promise<HuddleResult>;
  /** Checks the daily limit for this many questions (and shows the upgrade if needed). */
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (question: string, answer: string) => void;
  /** Carry on with one assistant in a normal chat. */
  onContinue: (c: CrewMember, question: string, answer: string) => void;
  initial?: string[];
}) {
  const crew = allCrew(mine);
  const [picked, setPicked] = useState<string[]>(() => (initial?.length ? initial : ["crew-pharmacist", "crew-abx"]).filter((id) => findCrew(id, mine)).slice(0, 4));
  const [question, setQuestion] = useState("");
  const [list, setList] = useState<Huddle[]>(readHuddles);
  const [openId, setOpenId] = useState("");
  const [running, setRunning] = useState(false);
  const [choosing, setChoosing] = useState(false);
  useEffect(() => saveHuddles(list), [list]);
  const open = list.find((h) => h.id === openId) ?? null;
  const update = (id: string, f: (h: Huddle) => Huddle) => setList((l) => l.map((h) => (h.id === id ? f(h) : h)));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? (toast("A huddle has up to four assistants"), p) : [...p, id]));

  const runMerge = async (h: Huddle) => {
    const ok = h.answers.filter((a) => a.text && !a.error);
    if (ok.length < 2) { update(h.id, (x) => ({ ...x, mergeError: "Fewer than two assistants answered, so there is nothing to combine." })); return; }
    try {
      const result = await merge(h.question, ok.map((a) => ({ name: a.name, answer: a.text })));
      update(h.id, (x) => ({ ...x, result, mergeError: undefined }));
    } catch (e) {
      update(h.id, (x) => ({ ...x, mergeError: friendlyError(e instanceof Error ? e.message : String(e)) }));
    }
  };

  const start = async () => {
    const members = picked.map((id) => findCrew(id, mine)).filter((c): c is CrewMember => !!c);
    if (members.length < 2) { toast("Pick at least two assistants"); return; }
    const q = deidentify(question.trim());
    if (!q.text) { toast("Type a question for the huddle"); return; }
    if (!canAsk(members.length)) return;
    const h: Huddle = { id: uid(), at: Date.now(), question: q.text, answers: members.map((c) => ({ crewId: c.id, name: c.name, icon: c.icon, tone: c.tone, text: "" })) };
    setList((l) => [h, ...l]);
    setOpenId(h.id);
    setQuestion("");
    setChoosing(false);
    setRunning(true);
    if (q.total) toast(`Hid ${q.total} patient identifier${q.total === 1 ? "" : "s"} before asking`);
    // Everyone answers at once; each card fills in as its answer arrives.
    const done: HuddleAnswer[] = await Promise.all(members.map(async (c, i) => {
      const t0 = Date.now();
      try {
        const text = await ask(c, q.text);
        const a = { ...h.answers[i], text, ms: Date.now() - t0 };
        update(h.id, (x) => ({ ...x, answers: x.answers.map((y, j) => (j === i ? a : y)) }));
        return a;
      } catch (e) {
        const a = { ...h.answers[i], error: friendlyError(e instanceof Error ? e.message : String(e)) };
        update(h.id, (x) => ({ ...x, answers: x.answers.map((y, j) => (j === i ? a : y)) }));
        return a;
      }
    }));
    await runMerge({ ...h, answers: done });
    setRunning(false);
  };

  const r = open?.result;
  const md = open && r ? [
    `# Crew Huddle: ${open.question}`,
    `*${open.answers.map((a) => a.name).join(", ")}*`,
    r.answer,
    r.agree.length ? `## They agree\n${r.agree.map((x) => `- ${x}`).join("\n")}` : "",
    r.differ.length ? `## Where they differ\n${r.differ.map((d) => `- **${d.point}** ${d.views.join("; ")}. *${d.verdict}*`).join("\n")}` : "",
    r.corrections.length ? `## Corrections\n${r.corrections.map((c) => `- **${c.who}:** ${c.issue} → ${c.fix}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n") : "";

  return (
    <section className="cx-page cx-huddle">
      <header className="cx-page-h">
        <div>
          <p className="cx-crew-eyebrow"><Users2 size={14} /> Cadus Crew</p>
          <h1>Crew Huddle</h1>
          <p>Ask up to four assistants at once. Read their answers side by side, then get one combined answer that Cadus has checked.</p>
        </div>
      </header>

      <div className="cx-hd-ask">
        <div className="cx-hd-picked" aria-label="Assistants in this huddle">
          {picked.map((id) => { const c = findCrew(id, mine); return c ? <span key={id} className={`cx-hd-chip tone-${c.tone}`}>{badge(c, 22)} {c.name}<button onClick={() => toggle(id)} aria-label={`Remove ${c.name}`}><X size={12} /></button></span> : null; })}
          {picked.length < 4 && <button className="cx-hd-chip add" onClick={() => setChoosing((x) => !x)} data-huddle="add"><Plus size={13} /> Add assistant</button>}
        </div>
        <div className="cx-hd-presets">
          {HUDDLE_PRESETS.map((p) => <button key={p.label} onClick={() => { setPicked(p.ids); setChoosing(false); }} className={p.ids.join() === picked.join() ? "on" : ""}>{p.label}</button>)}
        </div>
        {choosing && (
          <div className="cx-hd-choose" data-huddle="choose">
            {crew.map((c) => (
              <button key={c.id} className={picked.includes(c.id) ? "on" : ""} onClick={() => toggle(c.id)} aria-pressed={picked.includes(c.id)}>
                {badge(c, 24)}<span><b>{c.name}</b><small>{c.tagline}</small></span>{picked.includes(c.id) && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
        <form className="cx-hd-form" onSubmit={(e) => { e.preventDefault(); void start(); }}>
          <textarea className="cx-input" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. 68-year-old with eGFR 30 and atrial fibrillation: which anticoagulant and what dose?" maxLength={4000} aria-label="Question for the huddle" data-huddle="q"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void start(); } }} />
          <button className="cx-btn primary" type="submit" disabled={running || picked.length < 2 || !question.trim()} data-huddle="go"><MessagesSquare size={15} /> {running ? "Huddling…" : `Ask ${picked.length} assistants`}</button>
        </form>
      </div>

      {open ? (
        <div className="cx-hd-out" data-huddle="out">
          <div className="cx-hd-q"><b>{open.question}</b><button className="cx-ib" onClick={() => { setList((l) => l.filter((h) => h.id !== open.id)); setOpenId(""); }} aria-label="Delete this huddle"><Trash2 size={15} /></button></div>
          <div className={`cx-hd-grid n${open.answers.length}`}>
            {open.answers.map((a) => (
              <article key={a.crewId} className={`cx-hd-card tone-${a.tone}`} data-huddle-card={a.name}>
                <div className="cx-hd-card-h">{badge(a, 26)}<b>{a.name}</b>{a.ms ? <small>{Math.round(a.ms / 1000)} s</small> : null}</div>
                {a.error ? <p className="cx-hd-err"><TriangleAlert size={14} /> {a.error}</p>
                  : a.text ? <div className="cx-hd-body"><MdBlock text={a.text} /></div>
                  : <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> Thinking…</div>}
                {a.text && (() => { const c = findCrew(a.crewId, mine); return c ? <button className="cx-link" onClick={() => onContinue(c, open.question, a.text)}>Continue with {a.name}</button> : null; })()}
              </article>
            ))}
          </div>
          <div className="cx-hd-merged" data-huddle="merged">
            <div className="cx-hd-merged-h"><Combine size={16} /><b>Combined answer</b>{r && <span className={`cx-hd-conf c-${r.confidence}`}><ShieldCheck size={13} /> Checked by Cadus · {CONF[r.confidence]}</span>}</div>
            {r ? (
              <>
                {r.corrections.length > 0 && (
                  <div className="cx-hd-corr">
                    <b><TriangleAlert size={14} /> Corrections</b>
                    <ul>{r.corrections.map((c, i) => <li key={i}><b>{c.who}:</b> {c.issue} <span>→ {c.fix}</span></li>)}</ul>
                  </div>
                )}
                <MdBlock text={r.answer} />
                {(r.agree.length > 0 || r.differ.length > 0) && (
                  <div className="cx-hd-cols">
                    {r.agree.length > 0 && <div><p className="cx-gl"><span>They agree</span></p><ul>{r.agree.map((x) => <li key={x}>{x}</li>)}</ul></div>}
                    {r.differ.length > 0 && <div><p className="cx-gl"><span>Where they differ</span></p><ul>{r.differ.map((d, i) => <li key={i}><b>{d.point}</b>{d.views.map((v) => <span key={v} className="cx-hd-view">{v}</span>)}<em>{d.verdict}</em></li>)}</ul></div>}
                  </div>
                )}
                <div className="cx-sc-acts">
                  <button className="cx-btn" onClick={() => onSave(`Crew Huddle: ${open.question}`, md)} data-huddle="save"><Bookmark size={14} /> Save to Library</button>
                  <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md); toast("Copied"); }}><Copy size={14} /> Copy</button>
                </div>
              </>
            ) : open.mergeError ? (
              <p className="cx-hd-err"><TriangleAlert size={14} /> {open.mergeError} <button className="cx-link" onClick={() => void runMerge(open)} disabled={running}><RotateCcw size={13} /> Try again</button></p>
            ) : (
              <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> {open.answers.some((a) => !a.text && !a.error) ? "Waiting for every assistant…" : "Combining and checking the answers…"}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Sparkles size={20} /></span><h3>Get a second opinion, and a third</h3><p>Pick assistants above, or a ready-made huddle, and ask. Each answers in its own role.</p></div>
      )}

      {list.length > 0 && (
        <div className="cx-hd-recent">
          <p className="cx-gl"><span>Recent huddles</span></p>
          {list.slice(0, 8).map((h) => <button key={h.id} className={`cx-sc-row ${h.id === openId ? "on" : ""}`} onClick={() => setOpenId(h.id)}><b>{h.question}</b><small>{h.answers.map((a) => a.name).join(", ")} · {new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      )}
    </section>
  );
}
