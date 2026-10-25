/**
 * Prompt Templates: reusable prompts with {blanks}, ready-made or your own, tied to an assistant.
 * Fill the blanks and the prompt opens in a chat with that assistant, ready to send.
 */
import { useState, type ReactNode } from "react";
import { Play, Plus, Trash2 } from "lucide-react";
import { allCrew, BUILT_IN_TEMPLATES, fillTemplate, findCrew, newTemplate, readTemplates, saveTemplates, templateFields, type CrewMember, type PromptTemplate } from "@/lib/cadus/crew";

export default function CrewTemplatesView({ mine, initialCrew, badge, onRun, toast }: {
  mine: CrewMember[];
  initialCrew?: string;
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  onRun: (c: CrewMember, text: string) => void;
  toast: (t: string) => void;
}) {
  const [own, setOwn] = useState<PromptTemplate[]>(readTemplates);
  const [filter, setFilter] = useState(initialCrew ?? "");
  const [sel, setSel] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [runAs, setRunAs] = useState("crew-rounds");
  const [nt, setNt] = useState({ crewId: initialCrew ?? "", title: "", text: "" });
  const all = [...own, ...BUILT_IN_TEMPLATES].filter((t) => !filter || t.crewId === filter || !t.crewId);
  const t = [...own, ...BUILT_IN_TEMPLATES].find((x) => x.id === sel);
  const fields = t ? templateFields(t.text) : [];
  const filled = t ? fillTemplate(t.text, vals) : "";
  const crew = t ? findCrew(t.crewId || runAs, mine) : undefined;
  const persist = (l: PromptTemplate[]) => { setOwn(l); saveTemplates(l); };

  return (
    <section className="cx-page cx-lab cx-crewtemplates">
      <header className="cx-page-h"><div><h1>Prompt Templates</h1><p>Reusable prompts with blanks such as {"{topic}"} or {"{notes}"}. Pick one, fill the blanks, and it opens in a chat with its assistant, ready to send.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Show templates for</span><select className="cx-select" value={filter} onChange={(e) => setFilter(e.target.value)} data-tp="filter"><option value="">All assistants</option>{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      <div className="cx-rm-list" data-tp="list">{all.map((x) => { const c = x.crewId ? findCrew(x.crewId, mine) : undefined; return (
        <div key={x.id} className={`cx-rm-card ${sel === x.id ? "on" : ""}`}>
          {c ? badge(c, 22) : null}
          <button className="cx-rm-open" onClick={() => { setSel(x.id); setVals({}); }} data-tp-pick={x.title}><b>{x.title}</b><small>{c?.name ?? "Any assistant"}{x.builtIn ? " · by Cadus" : " · yours"}</small></button>
          {!x.builtIn && <button className="cx-ib" aria-label={`Delete ${x.title}`} onClick={() => { persist(own.filter((y) => y.id !== x.id)); if (sel === x.id) setSel(""); }} data-tp-del={x.title}><Trash2 size={15} /></button>}
        </div>); })}</div>
      {t && (
        <div className="cx-cmp-out" data-tp="fill">
          <h3 className="cx-lab-h3">{t.title}</h3>
          {!t.crewId && <label className="cx-field"><span>Assistant</span><select className="cx-select" value={runAs} onChange={(e) => setRunAs(e.target.value)} data-tp="runas">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
          {fields.map((f) => <label key={f} className="cx-field"><span>{f}</span>{/notes|text|medicines|case/i.test(f) ? <textarea className="cx-input" rows={3} value={vals[f] ?? ""} onChange={(e) => setVals({ ...vals, [f]: e.target.value.slice(0, 4000) })} data-tp-field={f} /> : <input className="cx-input" value={vals[f] ?? ""} onChange={(e) => setVals({ ...vals, [f]: e.target.value.slice(0, 300) })} data-tp-field={f} />}</label>)}
          <p className="cx-set-hint" data-tp="preview">{filled}</p>
          <div className="cx-sc-acts"><button className="cx-btn primary" disabled={!crew || fields.some((f) => !vals[f]?.trim())} onClick={() => crew && onRun(crew, filled)} data-tp="run"><Play size={14} /> Open in a chat with {crew?.name ?? "…"}</button></div>
        </div>
      )}
      <h4><Plus size={14} /> New template</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={nt.crewId} onChange={(e) => setNt({ ...nt, crewId: e.target.value })} data-tp="new-crew"><option value="">Any assistant</option>{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="cx-field"><span>Title</span><input className="cx-input" value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value.slice(0, 60) })} placeholder="e.g. OPD summary" data-tp="new-title" /></label>
      </div>
      <label className="cx-field"><span>Prompt (put blanks in curly brackets)</span><textarea className="cx-input" rows={3} value={nt.text} onChange={(e) => setNt({ ...nt, text: e.target.value.slice(0, 3000) })} placeholder="Summarise this OPD visit for the referral letter: {notes}" data-tp="new-text" /></label>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => { const x = newTemplate(nt.crewId, nt.title, nt.text); if (!x) { toast("Add a title and the prompt"); return; } persist([x, ...own]); setNt({ ...nt, title: "", text: "" }); toast("Template saved"); }} data-tp="save"><Plus size={14} /> Save template</button></div>
    </section>
  );
}
