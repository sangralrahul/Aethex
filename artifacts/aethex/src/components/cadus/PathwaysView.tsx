/**
 * Clinical Pathways: pick a pathway (chest pain, sepsis, fever in India…), give the patient
 * in a line, then answer one question or confirm one action at a time. Cadus picks the
 * next step from current guidelines and ends with a disposition and plan to print.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Check, CircleDot, Copy, Flag, GitFork, Printer, RotateCcw, Siren, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { PATHWAYS, readRuns, runMarkdown, saveRuns, sid, type PathwayRun, type PathwayStep } from "@/lib/cadus/studio";

export default function PathwaysView({ generate, friendlyError, toast, onPrint }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onPrint: (title: string, md: string) => void;
}) {
  const [runs, setRuns] = useState<PathwayRun[]>(readRuns);
  const [picked, setPicked] = useState("");
  const [custom, setCustom] = useState("");
  const [context, setContext] = useState("");
  const [run, setRun] = useState<PathwayRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [other, setOther] = useState("");
  useEffect(() => saveRuns(runs), [runs]);
  const save = (r: PathwayRun) => { setRun(r); setRuns((l) => [r, ...l.filter((x) => x.id !== r.id)]); };

  const next = async (r: PathwayRun) => {
    setBusy(true);
    try {
      const answers = r.steps.filter((s) => s.answer).map((s) => ({ title: s.step.title, answer: s.answer }));
      const res = await generate({ action: "pathway", pathway: r.pathway, context: r.context, answers });
      const step: PathwayStep | undefined = res?.step;
      if (!step) throw new Error("No step came back");
      save({ ...r, steps: [...r.steps, { step }], at: Date.now() });
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const start = () => {
    const name = picked === "custom" ? custom.trim() : PATHWAYS.find((p) => p.id === picked)?.title ?? "";
    if (!name) { toast("Pick a pathway or type one"); return; }
    const r: PathwayRun = { id: sid(), pathway: name, context: deidentify(context.trim()).text, steps: [], at: Date.now() };
    setRun(r);
    void next(r);
  };

  const answer = (a: string) => {
    if (!run || busy) return;
    const steps = [...run.steps];
    steps[steps.length - 1] = { ...steps[steps.length - 1], answer: a };
    const r = { ...run, steps };
    setOther("");
    save(r);
    void next(r);
  };

  /** Go back to an earlier step and answer it again. */
  const rewind = (i: number) => {
    if (!run || busy) return;
    save({ ...run, steps: run.steps.slice(0, i + 1).map((s, j) => (j === i ? { step: s.step } : s)) });
  };

  if (!run) {
    const groups = ["Emergency", "Medicine", "Paediatrics and obstetrics"] as const;
    return (
      <section className="cx-page cx-pw">
        <header className="cx-page-h"><div><h1>Clinical Pathways</h1><p>Work through a guideline-based pathway one step at a time: answer a question or confirm an action, and Cadus gives the next step, ending with a disposition and plan.</p></div></header>
        {groups.map((g) => (
          <div key={g}>
            <p className="cx-gl"><span>{g}</span></p>
            <div className="cx-pw-grid">
              {PATHWAYS.filter((p) => p.group === g).map((p) => (
                <button key={p.id} className={`cx-pw-card ${picked === p.id ? "on" : ""}`} onClick={() => setPicked(p.id)} aria-pressed={picked === p.id} data-pw={p.id}>
                  <b>{p.title}</b><small>{p.hint}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="cx-pw-start">
          <label className="cx-field"><span>Or another pathway</span><input className="cx-input" value={custom} onFocus={() => setPicked("custom")} onChange={(e) => { setCustom(e.target.value); setPicked("custom"); }} placeholder="e.g. Hyponatraemia, Seizure in an adult, Anaphylaxis" maxLength={120} /></label>
          <label className="cx-field"><span>The patient, in a line (optional)</span><input className="cx-input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. 58M, diabetic, smoker, pain for 2 hours" maxLength={800} data-pw="context" /></label>
          <button className="cx-btn primary" onClick={start} disabled={!picked || (picked === "custom" && !custom.trim())} data-pw="start"><GitFork size={15} /> Start the pathway</button>
        </div>
        {runs.length > 0 && (
          <div className="cx-lf-saved">
            <p className="cx-gl"><span>Recent pathways</span></p>
            {runs.slice(0, 8).map((r) => { const end = r.steps.find((s) => s.step.kind === "end")?.step; return <button key={r.id} className="cx-sc-row" onClick={() => setRun(r)}><b>{r.pathway}{r.context ? ` · ${r.context}` : ""}</b><small>{end ? end.disposition : `${r.steps.length} steps, unfinished`} · {new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>; })}
          </div>
        )}
        <p className="cx-rs-foot"><TriangleAlert size={13} /> Decision support from current guidelines. It does not replace clinical judgement or your hospital's protocols.</p>
      </section>
    );
  }

  const cur = run.steps[run.steps.length - 1];
  const done = cur?.step.kind === "end";
  const md = runMarkdown(run);
  return (
    <section className="cx-page cx-pw">
      <div className="cx-pw-head">
        <button className="cx-ib" onClick={() => setRun(null)} aria-label="All pathways"><ArrowLeft size={17} /></button>
        <div><h1>{run.pathway}</h1>{run.context && <p>{run.context}</p>}</div>
      </div>
      <ol className="cx-pw-trail" aria-label="Steps so far">
        {run.steps.filter((s) => s.answer).map((s, i) => (
          <li key={i}><CircleDot size={13} /><span><b>{s.step.title}</b> {s.answer}</span><button className="cx-link" onClick={() => rewind(i)} disabled={busy}>Change</button></li>
        ))}
      </ol>
      {cur && !done && (
        <div className={`cx-pw-step k-${cur.step.kind}`} data-pw="step" data-kind={cur.step.kind}>
          <p className="cx-pw-kind">{cur.step.kind === "action" ? <><Siren size={13} /> Do now</> : <>Step {run.steps.length}</>}{cur.step.source && <small>{cur.step.source}</small>}</p>
          <h2>{cur.step.title}</h2>
          <MdBlock text={cur.step.text} />
          {cur.step.redFlags.length > 0 && <p className="cx-pw-flags"><TriangleAlert size={13} /> {cur.step.redFlags.join(" · ")}</p>}
          <div className="cx-pw-opts">
            {cur.step.options.map((o) => <button key={o} className="cx-btn" onClick={() => answer(o)} disabled={busy}>{cur.step.kind === "action" ? <Check size={14} /> : null}{o}</button>)}
          </div>
          <form className="cx-pw-other" onSubmit={(e) => { e.preventDefault(); if (other.trim()) answer(other.trim()); }}>
            <input className="cx-input" value={other} onChange={(e) => setOther(e.target.value)} placeholder="Or type the answer, e.g. a value" maxLength={200} disabled={busy} aria-label="Other answer" />
            <button className="cx-btn" type="submit" disabled={busy || !other.trim()}>Answer</button>
          </form>
        </div>
      )}
      {busy && <div className="cx-pw-step pending"><span className="cx-sim-dots"><i /><i /><i /></span> Working out the next step…</div>}
      {!busy && !cur && <div className="cx-pw-step"><p>Couldn't load the first step.</p><button className="cx-btn" onClick={() => void next(run)}><RotateCcw size={14} /> Try again</button></div>}
      {done && cur && (
        <div className="cx-pw-end" data-pw="end">
          <p className="cx-pw-kind"><Flag size={13} /> Decision{cur.step.source && <small>{cur.step.source}</small>}</p>
          <h2><span className={`cx-pw-disp d-${cur.step.disposition.replace(/[^a-z]/gi, "").toLowerCase()}`}>{cur.step.disposition}</span> {cur.step.title}</h2>
          <MdBlock text={cur.step.text} />
          {cur.step.plan.length > 0 && <ul className="cx-pw-plan">{cur.step.plan.map((p) => <li key={p}>{p}</li>)}</ul>}
          {cur.step.redFlags.length > 0 && <p className="cx-pw-flags"><TriangleAlert size={13} /> Watch for: {cur.step.redFlags.join(" · ")}</p>}
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint(run.pathway, md)}><Printer size={14} /> Print summary</button>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md); toast("Copied"); }}><Copy size={14} /> Copy</button>
            <button className="cx-btn" onClick={() => setRun(null)}>Another pathway</button>
          </div>
        </div>
      )}
    </section>
  );
}
