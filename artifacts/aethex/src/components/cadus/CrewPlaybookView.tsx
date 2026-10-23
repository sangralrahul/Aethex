/**
 * Crew Playbooks: chain Cadus Crew assistants into a workflow. Each step is an assistant
 * and a task; it gets the original input and the previous step's output, so notes can go
 * Rounds Partner → Clinical Pharmacist → Discharge Writer. Ready-made playbooks, your own
 * (up to five steps), and the last runs kept on this device.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, Bookmark, Copy, MessageSquare, Pencil, Play, Plus, Trash2, TriangleAlert, Workflow, X } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import {
  allCrew, BUILT_IN_PLAYBOOKS, findCrew, PLAYBOOK_MAX_STEPS, readPlaybookRuns, readPlaybooks, runMarkdown, savePlaybookRuns, savePlaybooks, stepMessage,
  type CrewMember, type Playbook, type PlaybookRun,
} from "@/lib/cadus/crew";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export default function CrewPlaybookView({ mine, badge, ask, canAsk, friendlyError, toast, onSave, onContinue }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (question: string, answer: string) => void;
  onContinue: (c: CrewMember, question: string, answer: string) => void;
}) {
  const crew = allCrew(mine);
  const [own, setOwn] = useState<Playbook[]>(readPlaybooks);
  const [runs, setRuns] = useState<PlaybookRun[]>(readPlaybookRuns);
  const [pbId, setPbId] = useState(BUILT_IN_PLAYBOOKS[0].id);
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState<Playbook | null>(null);
  const [runId, setRunId] = useState("");
  const [running, setRunning] = useState(false);
  useEffect(() => savePlaybooks(own), [own]);
  useEffect(() => savePlaybookRuns(runs), [runs]);
  const all = [...own, ...BUILT_IN_PLAYBOOKS];
  const pb = all.find((p) => p.id === pbId) ?? all[0];
  const run = runs.find((r) => r.id === runId) ?? null;
  const updateRun = (id: string, f: (r: PlaybookRun) => PlaybookRun) => setRuns((l) => l.map((r) => (r.id === id ? f(r) : r)));

  const start = async () => {
    const steps = pb.steps.map((s) => ({ s, c: findCrew(s.crewId, mine) }));
    if (steps.some((x) => !x.c)) { toast("An assistant in this playbook no longer exists; edit the playbook"); return; }
    const clean = deidentify(input.trim());
    if (clean.text.length < 3) { toast("Add the notes, case or topic to start with"); return; }
    if (!canAsk(steps.length)) return;
    const r: PlaybookRun = { id: uid(), at: Date.now(), playbookId: pb.id, playbookName: pb.name, input: clean.text, done: false, steps: steps.map(({ s, c }) => ({ crewId: c!.id, name: c!.name, icon: c!.icon, tone: c!.tone, task: s.task, output: "" })) };
    setRuns((l) => [r, ...l]);
    setRunId(r.id);
    setRunning(true);
    if (clean.total) toast(`Hid ${clean.total} patient identifier${clean.total === 1 ? "" : "s"} before starting`);
    let previous: { name: string; output: string } | null = null;
    for (let i = 0; i < steps.length; i++) {
      const c = steps[i].c!;
      const t0 = Date.now();
      try {
        const output = await ask(c, stepMessage(steps[i].s.task, clean.text, previous));
        updateRun(r.id, (x) => ({ ...x, steps: x.steps.map((y, j) => (j === i ? { ...y, output, ms: Date.now() - t0 } : y)) }));
        previous = { name: c.name, output };
      } catch (e) {
        const error = friendlyError(e instanceof Error ? e.message : String(e));
        updateRun(r.id, (x) => ({ ...x, steps: x.steps.map((y, j) => (j === i ? { ...y, error } : y)) }));
        break;
      }
    }
    updateRun(r.id, (x) => ({ ...x, done: true }));
    setRunning(false);
  };

  const saveEdit = () => {
    if (!edit) return;
    const steps = edit.steps.filter((s) => s.crewId && s.task.trim());
    if (!edit.name.trim()) { toast("Name the playbook"); return; }
    if (steps.length < 2) { toast("A playbook needs at least two steps with a task"); return; }
    const p = { ...edit, name: edit.name.trim().slice(0, 60), description: edit.description.trim().slice(0, 200), steps, builtIn: undefined };
    setOwn((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [p, ...l]));
    setPbId(p.id);
    setEdit(null);
    toast("Playbook saved");
  };

  if (edit) {
    return (
      <section className="cx-page cx-huddle cx-pb">
        <header className="cx-page-h"><div><p className="cx-crew-eyebrow"><Workflow size={14} /> Crew Playbooks</p><h1>{own.some((p) => p.id === edit.id) ? "Edit playbook" : "New playbook"}</h1><p>Each step's assistant gets your input and the previous step's answer.</p></div></header>
        <div className="cx-pb-edit" data-pb="editor">
          <label className="cx-field"><span>Name</span><input className="cx-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value.slice(0, 60) })} placeholder="e.g. OPD visit to prescription" data-pb="name" /></label>
          <label className="cx-field"><span>What it's for</span><input className="cx-input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value.slice(0, 200) })} placeholder="One line" /></label>
          {edit.steps.map((s, i) => (
            <div key={i} className="cx-pb-step-e" data-pb-step={i}>
              <span className="cx-pb-n">{i + 1}</span>
              <select className="cx-select" value={s.crewId} onChange={(e) => setEdit({ ...edit, steps: edit.steps.map((x, j) => (j === i ? { ...x, crewId: e.target.value } : x)) })} aria-label={`Assistant for step ${i + 1}`}>{crew.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input className="cx-input" value={s.task} onChange={(e) => setEdit({ ...edit, steps: edit.steps.map((x, j) => (j === i ? { ...x, task: e.target.value.slice(0, 500) } : x)) })} placeholder={i === 0 ? "Task, e.g. Summarise these notes as a case presentation" : "Task, e.g. Using the answer above, write…"} aria-label={`Task for step ${i + 1}`} data-pb={`task-${i}`} />
              {edit.steps.length > 2 && <button className="cx-ib" onClick={() => setEdit({ ...edit, steps: edit.steps.filter((_, j) => j !== i) })} aria-label={`Remove step ${i + 1}`}><X size={14} /></button>}
            </div>
          ))}
          {edit.steps.length < PLAYBOOK_MAX_STEPS && <button className="cx-btn sm" onClick={() => setEdit({ ...edit, steps: [...edit.steps, { crewId: "crew-pharmacist", task: "" }] })} data-pb="add-step"><Plus size={13} /> Add a step</button>}
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={saveEdit} data-pb="save-pb">Save playbook</button><button className="cx-btn" onClick={() => setEdit(null)}>Cancel</button></div>
        </div>
      </section>
    );
  }

  return (
    <section className="cx-page cx-huddle cx-pb">
      <header className="cx-page-h">
        <div><p className="cx-crew-eyebrow"><Workflow size={14} /> Cadus Crew</p><h1>Crew Playbooks</h1><p>Chain assistants into a workflow: each one picks up where the last left off. Notes in, presentation, medicines check and discharge summary out.</p></div>
        <div className="cx-page-acts"><button className="cx-btn" onClick={() => setEdit({ id: uid(), name: "", description: "", steps: [{ crewId: "crew-rounds", task: "" }, { crewId: "crew-discharge", task: "" }] })} disabled={own.length >= 20} data-pb="new"><Plus size={15} /> New playbook</button></div>
      </header>
      <div className="cx-pb-list" role="radiogroup" aria-label="Playbook">
        {all.map((p) => (
          <button key={p.id} role="radio" aria-checked={p.id === pb.id} className={p.id === pb.id ? "on" : ""} onClick={() => setPbId(p.id)} data-pb-pick={p.name}>
            <b>{p.name}</b><small>{p.description}</small>
            <span className="cx-pb-chain">{p.steps.map((s, i) => { const c = findCrew(s.crewId, mine); return <span key={i}>{c ? badge(c, 20) : null}{i < p.steps.length - 1 && <i>→</i>}</span>; })}</span>
          </button>
        ))}
      </div>
      <div className="cx-hd-ask">
        <ol className="cx-pb-steps" data-pb="steps">{pb.steps.map((s, i) => { const c = findCrew(s.crewId, mine); return <li key={i}>{c ? badge(c, 24) : null}<div><b>{c?.name ?? "Missing assistant"}</b><small>{s.task}</small></div></li>; })}</ol>
        {!pb.builtIn && <div className="cx-sc-acts"><button className="cx-btn sm" onClick={() => setEdit(pb)}><Pencil size={13} /> Edit</button><button className="cx-btn sm" onClick={() => { setOwn((l) => l.filter((x) => x.id !== pb.id)); setPbId(BUILT_IN_PLAYBOOKS[0].id); }}><Trash2 size={13} /> Delete</button></div>}
        <textarea className="cx-input" rows={4} value={input} onChange={(e) => setInput(e.target.value.slice(0, 12000))} placeholder="Paste the notes, describe the case, or name a topic to start the chain" aria-label="Input for the playbook" data-pb="input" />
        <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void start()} disabled={running || input.trim().length < 3} data-pb="go"><Play size={15} /> {running ? "Running…" : `Run ${pb.steps.length} steps`}</button><small className="cx-pc-words">Uses {pb.steps.length} of today's questions</small></div>
      </div>

      {run ? (
        <div className="cx-hd-out" data-pb="out">
          <div className="cx-hd-q"><b>{run.playbookName}</b><button className="cx-ib" onClick={() => { setRuns((l) => l.filter((r) => r.id !== run.id)); setRunId(""); }} aria-label="Delete this run"><Trash2 size={15} /></button></div>
          <ol className="cx-pb-run">
            {run.steps.map((s, i) => (
              <li key={i} className={`cx-hd-card tone-${s.tone}`} data-pb-out={i}>
                <div className="cx-hd-card-h">{badge(s, 26)}<b>{i + 1}. {s.name}</b>{s.ms ? <small>{Math.round(s.ms / 1000)} s</small> : null}</div>
                <p className="cx-pb-task">{s.task}</p>
                {s.error ? <p className="cx-hd-err"><TriangleAlert size={14} /> {s.error}</p>
                  : s.output ? <div className="cx-hd-body"><MdBlock text={s.output} /></div>
                  : run.done ? <p className="cx-pb-task">Not run: an earlier step failed.</p>
                  : <div className="cx-hd-wait"><span className="cx-sim-dots"><i /><i /><i /></span> {run.steps.slice(0, i).every((x) => x.output) ? "Working…" : "Waiting for the step before"}</div>}
                {s.output && i < run.steps.length - 1 && <ArrowDown size={16} className="cx-pb-arrow" />}
              </li>
            ))}
          </ol>
          {run.done && run.steps.at(-1)?.output && (
            <div className="cx-sc-acts">
              <button className="cx-btn" onClick={() => onSave(`${run.playbookName}`, runMarkdown(run))} data-pb="save"><Bookmark size={14} /> Save to Library</button>
              <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(run.steps.at(-1)!.output); toast("Copied the final result"); }}><Copy size={14} /> Copy final result</button>
              {(() => { const last = run.steps.at(-1)!; const c = findCrew(last.crewId, mine); return c ? <button className="cx-btn" onClick={() => onContinue(c, run.input, last.output)}><MessageSquare size={14} /> Continue with {c.name}</button> : null; })()}
            </div>
          )}
        </div>
      ) : null}
      {runs.length > 0 && (
        <div className="cx-hd-recent">
          <p className="cx-gl"><span>Recent runs</span></p>
          {runs.slice(0, 8).map((r) => <button key={r.id} className={`cx-sc-row ${r.id === runId ? "on" : ""}`} onClick={() => setRunId(r.id)}><b>{r.playbookName}</b><small>{r.input.slice(0, 70)} · {new Date(r.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>)}
        </div>
      )}
    </section>
  );
}
