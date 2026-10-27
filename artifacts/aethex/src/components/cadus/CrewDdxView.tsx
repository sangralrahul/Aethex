/**
 * Differential Coach: build a differential for a case (a new one from an assistant, or your own);
 * see what you matched, the must-not-miss diagnoses you left out, and get coaching on your reasoning.
 */
import { useState } from "react";
import { Check, Loader2, Save, Sparkles, Stethoscope, X } from "lucide-react";
import { ddxAnswerPrompt, ddxCasePrompt, ddxFeedbackPrompt, findCrew, GUESS_AREAS, parseDdx, readDdx, saveDdx, scoreDdx, type CrewMember, type DdxAttempt, type DdxCase, type QuizLevel } from "@/lib/cadus/crew";
import { MdBlock } from "./LiveAnswer";

const TAG: Record<string, string> = { likely: "Most likely", must: "Must not miss", possible: "Possible" };

export default function CrewDdxView({ mine, ask, canAsk, friendlyError, toast, onNote }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onNote: (crewId: string, text: string, title: string) => void;
}) {
  const [src, setSrc] = useState<"new" | "mine">("new");
  const [area, setArea] = useState("Any");
  const [level, setLevel] = useState<QuizLevel>("exam");
  const [own, setOwn] = useState("");
  const [c, setC] = useState<DdxCase | null>(null);
  const [vignette, setVignette] = useState("");
  const [mineList, setMineList] = useState("");
  const [busy, setBusy] = useState("");
  const [fb, setFb] = useState("");
  const [hist, setHist] = useState<DdxAttempt[]>(readDdx);
  const coach = findCrew("crew-neetpg", mine);
  const lines = mineList.split("\n").map((x) => x.trim()).filter(Boolean);
  const res = c ? scoreDdx(lines, c.items) : null;
  const run = async (what: string, f: () => Promise<void>) => {
    if (!coach || !canAsk(1)) return;
    setBusy(what);
    try { await f(); } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(""); }
  };
  const [hidden, setHidden] = useState<DdxCase | null>(null);
  const finishScore = (d: DdxCase) => {
    setC(d);
    const r = scoreDdx(lines, d.items);
    const h = [{ at: Date.now(), score: r.score, topRight: r.topRight, missedMust: r.missedMust.length }, ...hist].slice(0, 100);
    setHist(h); saveDdx(h);
  };
  const submit = async () => {
    if (!lines.length) { toast("Write at least one diagnosis, one per line"); return; }
    if (src === "new") { if (hidden) finishScore(hidden); return; }
    if (own.trim().length < 40) { toast("Paste or write a case first (a few sentences)"); return; }
    await run("score", async () => {
      const d = parseDdx(await ask(coach!, ddxAnswerPrompt(own)));
      if (!d) { toast("The model differential didn't come back. Try again."); return; }
      finishScore({ ...d, vignette: own.trim() });
    });
  };
  // A new case's model answer is kept hidden until you submit.
  const startNew = () => run("case", async () => {
    const d = parseDdx(await ask(coach!, ddxCasePrompt(area, level)));
    if (!d || !d.vignette) { toast("The case didn't come back in a usable form. Try again."); return; }
    setHidden(d); setVignette(d.vignette); setC(null); setMineList(""); setFb("");
  });
  const feedback = () => run("fb", async () => { if (c) setFb(await ask(coach!, ddxFeedbackPrompt(c, lines))); });
  const avg = hist.length ? Math.round(hist.reduce((s, x) => s + x.score, 0) / hist.length) : 0;
  const caseText = src === "mine" ? own : vignette;
  return (
    <section className="cx-page cx-lab cx-ddx">
      <header className="cx-page-h"><div><h1>Differential Coach</h1><p>Write your differential for a case, most likely first. See what you matched, which must-not-miss diagnoses you left out, and get coaching on your reasoning.</p></div></header>
      {hist.length > 0 && <div className="cx-sim-stats"><div><b data-ddx="played">{hist.length}</b><small>cases</small></div><div><b>{avg}</b><small>average score</small></div><div><b>{hist.filter((h) => h.topRight).length}</b><small>top diagnosis right</small></div></div>}
      <div className="cx-seg" role="tablist">{([["new", "New case"], ["mine", "My own case"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={src === k} className={src === k ? "on" : ""} onClick={() => { setSrc(k); setC(null); setFb(""); }} data-ddx-src={k}>{l}</button>)}</div>
      {src === "new" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Area</span><select className="cx-select" value={area} onChange={(e) => setArea(e.target.value)} data-ddx="area">{GUESS_AREAS.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
            <label className="cx-field"><span>Level</span><select className="cx-select" value={level} onChange={(e) => setLevel(e.target.value as QuizLevel)} data-ddx="level"><option value="easy">MBBS</option><option value="exam">NEET-PG</option><option value="hard">Postgraduate</option></select></label>
          </div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void startNew()} disabled={!!busy} data-ddx="new">{busy === "case" ? <Loader2 size={14} className="cx-rot" /> : <Stethoscope size={14} />} {busy === "case" ? "Writing a case…" : vignette ? "Another case" : "Give me a case"}</button></div>
          {vignette && <p className="cx-cmp-out cx-ddx-case" data-ddx="vignette">{vignette}</p>}
        </>
      ) : <label className="cx-field"><span>Your case (de-identified)</span><textarea className="cx-input" rows={5} value={own} onChange={(e) => setOwn(e.target.value.slice(0, 4000))} placeholder="Age, sex, complaint, history, examination, first results…" data-ddx="own" /></label>}
      {caseText.trim() && (
        <>
          <label className="cx-field"><span>Your differential (one per line, most likely first)</span><textarea className="cx-input" rows={5} value={mineList} onChange={(e) => setMineList(e.target.value.slice(0, 1500))} placeholder={"Pulmonary embolism\nPneumothorax\nPneumonia"} data-ddx="mine" /></label>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void submit()} disabled={!!busy || !lines.length} data-ddx="submit">{busy === "score" ? <Loader2 size={14} className="cx-rot" /> : <Check size={14} />} Check my differential</button></div>
        </>
      )}
      {c && res && (
        <div className={`cx-cmp-out ${res.missedMust.length ? "cx-ac-high" : "cx-ac-in"}`} data-ddx="result" data-score={res.score} data-missed-must={res.missedMust.length}>
          <h3 className="cx-lab-h3">Score {res.score}{res.topRight ? " · top diagnosis right" : ""}{res.missedMust.length ? ` · missed ${res.missedMust.length} must-not-miss` : ""}</h3>
          <ul className="cx-ddx-list">{c.items.map((it, i) => <li key={i} className={`k-${it.kind} ${res.matched.includes(i) ? "hit" : "miss"}`} data-ddx-item={it.dx}>{res.matched.includes(i) ? <Check size={14} /> : <X size={14} />}<span><b>{it.dx}</b> <em>{TAG[it.kind]}</em>{it.why ? ` — ${it.why}` : ""}</span></li>)}</ul>
          {res.extra.length > 0 && <p className="cx-set-hint" data-ddx="extra">Also on your list (not in the model answer): {res.extra.join(", ")}</p>}
          {c.clues.length > 0 && <p className="cx-set-hint">Key clues: {c.clues.join("; ")}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => void feedback()} disabled={!!busy} data-ddx="coach">{busy === "fb" ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} Coach me</button>
            <button className="cx-btn" onClick={() => { onNote("crew-neetpg", `## Differential practice\n\n${c.vignette}\n\n**My differential:**\n${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n\n**Model differential:**\n${c.items.map((x) => `- ${x.dx} (${TAG[x.kind]}): ${x.why}`).join("\n")}${fb ? `\n\n**Coaching:**\n${fb}` : ""}`, "Differential practice"); toast("Saved to Crew notes"); }} data-ddx="save"><Save size={14} /> Save to notes</button>
          </div>
          {fb && <div className="cx-ddx-fb" data-ddx="fb"><MdBlock text={fb} /></div>}
        </div>
      )}
    </section>
  );
}
