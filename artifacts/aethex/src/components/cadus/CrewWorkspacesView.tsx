/**
 * Crew Workspaces: a set of assistants, prompt templates and notes for a rotation or exam (e.g.
 * "Surgery posting"). Switch the active workspace to see just what you need. Stays on this device.
 */
import { useState, type ReactNode } from "react";
import { Briefcase, Check, MessageSquare, Play, Plus, StickyNote, Trash2 } from "lucide-react";
import { allCrew, BUILT_IN_TEMPLATES, findCrew, newWorkspace, readTemplates, toggleWsItem, WORKSPACE_IDEAS, WORKSPACE_MAX, type CrewMember, type CrewNotes, type CrewWorkspaces, type PromptTemplate } from "@/lib/cadus/crew";

export default function CrewWorkspacesView({ mine, notes, state, setState, badge, onChat, onTemplate, onNotes, toast }: {
  mine: CrewMember[];
  notes: CrewNotes;
  state: CrewWorkspaces;
  setState: (f: (s: CrewWorkspaces) => CrewWorkspaces) => void;
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  onChat: (c: CrewMember) => void;
  onTemplate: (t: PromptTemplate) => void;
  onNotes: () => void;
  toast: (t: string) => void;
}) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState("");
  const [q, setQ] = useState("");
  const templates = [...readTemplates(), ...BUILT_IN_TEMPLATES];
  const active = state.list.find((w) => w.id === state.active);
  const edit = state.list.find((w) => w.id === editId);
  const create = (n: string, ids: string[] = []) => {
    if (state.list.length >= WORKSPACE_MAX) { toast(`You can keep up to ${WORKSPACE_MAX} workspaces`); return; }
    const w = newWorkspace(n, ids);
    if (!w) { toast("Give the workspace a name"); return; }
    setState((s) => ({ list: [...s.list, w], active: w.id }));
    setName(""); setEditId(w.id);
    toast(`Workspace "${w.name}" created and switched on`);
  };
  const upd = (id: string, f: (w: (typeof state.list)[number]) => (typeof state.list)[number]) => setState((s) => ({ ...s, list: s.list.map((w) => (w.id === id ? f(w) : w)) }));

  return (
    <section className="cx-page cx-lab cx-workspaces">
      <header className="cx-page-h"><div><h1>Crew Workspaces</h1><p>Group the assistants, prompt templates and notes you need for a rotation, exam or project, and switch between them.</p></div></header>
      {active && (
        <div className="cx-cmp-out cx-ac-in" data-ws="active">
          <h3 className="cx-lab-h3"><Briefcase size={16} /> {active.name}</h3>
          <div className="cx-ws-crew">{active.crewIds.map((id) => findCrew(id, mine)).filter((c): c is CrewMember => !!c).map((c) => <button key={c.id} className="cx-chip" onClick={() => onChat(c)} data-ws-chat={c.id}>{badge(c, 20)} {c.name} <MessageSquare size={12} /></button>)}{!active.crewIds.length && <span className="cx-set-hint">No assistants yet: edit the workspace below.</span>}</div>
          {active.templateIds.length > 0 && <div className="cx-ws-crew">{active.templateIds.map((id) => templates.find((t) => t.id === id)).filter((t): t is PromptTemplate => !!t).map((t) => <button key={t.id} className="cx-chip" onClick={() => onTemplate(t)} data-ws-tpl={t.title}><Play size={12} /> {t.title}</button>)}</div>}
          {active.noteIds.length > 0 && <div className="cx-ws-crew">{active.noteIds.map((id) => notes.notes.find((n) => n.id === id)).filter(Boolean).map((n) => <button key={n!.id} className="cx-chip" onClick={onNotes} data-ws-note={n!.title}><StickyNote size={12} /> {n!.title}</button>)}</div>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => setState((s) => ({ ...s, active: "" }))} data-ws="off">Switch off</button></div>
        </div>
      )}
      <h4><Plus size={14} /> New workspace</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="e.g. ICU posting, FMGE prep" data-ws="name" /></label>
        <button className="cx-btn primary" onClick={() => create(name)} disabled={!name.trim()} data-ws="create"><Plus size={14} /> Create</button>
      </div>
      <div className="cx-crew-chips"><span className="cx-set-hint">Or start from:</span>{WORKSPACE_IDEAS.map((w) => <button key={w.name} className="cx-chip" onClick={() => create(w.name, w.crewIds)} data-ws-idea={w.name}>{w.name}</button>)}</div>
      {state.list.length > 0 && <h4>Your workspaces</h4>}
      <div className="cx-rm-list" data-ws="list">{state.list.map((w) => (
        <div key={w.id} className={`cx-rm-card ${w.id === state.active ? "on" : ""}`}>
          <Briefcase size={18} />
          <button className="cx-rm-open" onClick={() => setEditId(editId === w.id ? "" : w.id)} data-ws-edit={w.name}><b>{w.name}</b><small>{w.crewIds.length} assistants · {w.templateIds.length} templates · {w.noteIds.length} notes</small></button>
          {w.id !== state.active ? <button className="cx-btn sm" onClick={() => setState((s) => ({ ...s, active: w.id }))} data-ws-activate={w.name}>Use</button> : <span className="cx-chip on"><Check size={12} /> In use</span>}
          <button className="cx-ib" aria-label={`Delete ${w.name}`} onClick={() => { setState((s) => ({ list: s.list.filter((x) => x.id !== w.id), active: s.active === w.id ? "" : s.active })); if (editId === w.id) setEditId(""); }} data-ws-del={w.name}><Trash2 size={15} /></button>
        </div>
      ))}</div>
      {edit && (
        <div className="cx-cmp-out" data-ws="editor">
          <h3 className="cx-lab-h3">Edit "{edit.name}"</h3>
          <h4>Assistants ({edit.crewIds.length}/12)</h4>
          <input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="Search assistants" data-ws="q" />
          <div className="cx-pack-pick">{allCrew(mine).filter((c) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()) || edit.crewIds.includes(c.id)).map((c) => <label key={c.id} className={`cx-chip ${edit.crewIds.includes(c.id) ? "on" : ""}`}><input type="checkbox" hidden checked={edit.crewIds.includes(c.id)} onChange={() => upd(edit.id, (x) => toggleWsItem(x, "crewIds", c.id))} data-ws-pick={c.id} />{badge(c, 18)} {c.name}</label>)}</div>
          <h4>Prompt templates</h4>
          <div className="cx-pack-pick">{templates.map((t) => <label key={t.id} className={`cx-chip ${edit.templateIds.includes(t.id) ? "on" : ""}`}><input type="checkbox" hidden checked={edit.templateIds.includes(t.id)} onChange={() => upd(edit.id, (x) => toggleWsItem(x, "templateIds", t.id))} data-ws-pick-tpl={t.title} />{t.title}</label>)}</div>
          {notes.notes.length > 0 && <><h4>Notes</h4><div className="cx-pack-pick">{notes.notes.map((n) => <label key={n.id} className={`cx-chip ${edit.noteIds.includes(n.id) ? "on" : ""}`}><input type="checkbox" hidden checked={edit.noteIds.includes(n.id)} onChange={() => upd(edit.id, (x) => toggleWsItem(x, "noteIds", n.id))} data-ws-pick-note={n.title} />{n.title}</label>)}</div></>}
        </div>
      )}
    </section>
  );
}
