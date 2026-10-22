/**
 * Guideline Watch: pick the specialties or topics to follow, and Cadus searches PubMed
 * for what was added in the last 7, 30 or 90 days (guidelines, meta-analyses and trials
 * by default) and writes a short digest from those records only. Papers new since the
 * last check are marked, and a digest can be saved to the Library with its sources.
 */
import { useEffect, useState } from "react";
import { BellRing, Bookmark, ExternalLink, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { IMPACT_LABEL, pubmedUrl, readWatch, saveWatch, uid, watchMarkdown, type WatchRun, type WatchState } from "@/lib/cadus/labs";

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
};

export default function GuidelineWatchView({ generate, friendlyError, toast, onSave }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (question: string, answer: string, sources: { n: number; url: string; title: string }[]) => void;
}) {
  const [state, setState] = useState<WatchState>(readWatch);
  const [running, setRunning] = useState("");
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => saveWatch(state), [state]);
  const followed = state.topics.filter((t) => t.on);
  const lastRun = Math.max(0, ...followed.map((t) => state.runs[t.id]?.at ?? 0));

  const runOne = async (id: string) => {
    const t = state.topics.find((x) => x.id === id);
    if (!t) return;
    setRunning(id);
    try {
      const r = await generate({ action: "watch", topic: t.query, label: t.label, days: state.days, keyOnly: state.keyOnly });
      const before = new Set(state.runs[id]?.papers.map((p) => p.pmid) ?? []);
      const hadRun = !!state.runs[id];
      const run: WatchRun = { at: Date.now(), days: r.days ?? state.days, papers: Array.isArray(r.papers) ? r.papers : [], digest: r.digest ?? null, fresh: [] };
      run.fresh = hadRun ? run.papers.filter((p) => !before.has(p.pmid)).map((p) => p.pmid) : [];
      setState((s) => ({ ...s, runs: { ...s.runs, [id]: run } }));
    } catch (e) {
      toast(`${t.label}: ${friendlyError(e instanceof Error ? e.message : String(e))}`);
    } finally { setRunning(""); }
  };
  const runAll = async () => {
    if (!followed.length) { toast("Follow at least one topic"); return; }
    // One topic at a time, so PubMed is not flooded.
    for (const t of followed) await runOne(t.id);
  };
  const addTopic = () => {
    const l = label.trim();
    const q = query.trim() || l;
    if (!l) { toast("Name the topic"); return; }
    setState((s) => ({ ...s, topics: [...s.topics, { id: uid(), label: l.slice(0, 60), query: q.slice(0, 300), on: true, custom: true }] }));
    setLabel(""); setQuery(""); setAdding(false);
  };

  return (
    <section className="cx-page cx-lab cx-watch">
      <header className="cx-page-h">
        <div><h1>Guideline Watch</h1><p>What's new in your specialties: the latest guidelines, meta-analyses and trials from PubMed, summarised in a minute, with every paper linked.</p></div>
        <button className="cx-btn primary" onClick={() => void runAll()} disabled={!!running || !followed.length} data-watch="run"><RefreshCw size={14} className={running ? "spin" : ""} /> {running ? "Checking…" : lastRun ? "Check again" : "Get my digest"}</button>
      </header>
      <div className="cx-watch-bar">
        <div className="cx-watch-topics" aria-label="Topics you follow">
          {state.topics.map((t) => (
            <span key={t.id} className={`cx-watch-chip ${t.on ? "on" : ""}`}>
              <button onClick={() => setState((s) => ({ ...s, topics: s.topics.map((x) => (x.id === t.id ? { ...x, on: !x.on } : x)) }))} aria-pressed={t.on} title={t.query}>{t.label}</button>
              {t.custom && <button className="x" onClick={() => setState((s) => ({ ...s, topics: s.topics.filter((x) => x.id !== t.id), runs: Object.fromEntries(Object.entries(s.runs).filter(([k]) => k !== t.id)) }))} aria-label={`Remove ${t.label}`}><X size={11} /></button>}
            </span>
          ))}
          <button className="cx-watch-chip add" onClick={() => setAdding((a) => !a)} data-watch="add"><Plus size={12} /> Your own topic</button>
        </div>
        <div className="cx-watch-opts">
          <div className="cx-seg" aria-label="How far back">{([7, 30, 90] as const).map((d) => <button key={d} className={state.days === d ? "on" : ""} onClick={() => setState((s) => ({ ...s, days: d }))}>{d} days</button>)}</div>
          <label className="cx-lab-toggle"><input type="checkbox" checked={state.keyOnly} onChange={(e) => setState((s) => ({ ...s, keyOnly: e.target.checked }))} /> Guidelines, meta-analyses and trials only</label>
        </div>
        {adding && (
          <div className="cx-watch-add">
            <input className="cx-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name, e.g. Snakebite" maxLength={60} data-watch="label" />
            <input className="cx-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="PubMed search (optional), e.g. snake bite OR antivenom" maxLength={300} data-watch="query" />
            <button className="cx-btn primary" onClick={addTopic} data-watch="save">Follow</button>
          </div>
        )}
      </div>
      {followed.length === 0 ? (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><BellRing size={20} /></span><h3>Follow a topic</h3><p>Tap a specialty above, or add your own topic.</p></div>
      ) : (
        <div className="cx-watch-list">
          {followed.map((t) => {
            const run = state.runs[t.id];
            const papers = new Map((run?.papers ?? []).map((p) => [p.pmid, p]));
            return (
              <article key={t.id} className="cx-watch-card" data-watch-topic={t.label}>
                <div className="cx-watch-h">
                  <h2>{t.label}</h2>
                  <div className="cx-sc-acts">
                    {run && <small>{ago(run.at)} · last {run.days} days</small>}
                    <button className="cx-ib" onClick={() => void runOne(t.id)} disabled={!!running} aria-label={`Check ${t.label}`} title="Check now"><RefreshCw size={14} className={running === t.id ? "spin" : ""} /></button>
                    {run?.digest && <button className="cx-btn" onClick={() => { const { md, sources } = watchMarkdown(t.label, run); onSave(`Guideline Watch: ${t.label} (${new Date(run.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`, md, sources); }} data-watch="lib"><Bookmark size={14} /> Save to Library</button>}
                  </div>
                </div>
                {running === t.id && !run ? (
                  <p className="cx-watch-wait">Searching PubMed and reading the abstracts…</p>
                ) : !run ? (
                  <p className="cx-watch-wait">Not checked yet.</p>
                ) : !run.digest ? (
                  <p className="cx-watch-wait">Nothing new {state.keyOnly ? "of this kind " : ""}in the last {run.days} days.{state.keyOnly ? " Try including all evidence, or a longer window." : ""}</p>
                ) : (
                  <>
                    <p className="cx-watch-head"><b>{run.digest.headline}</b></p>
                    {run.digest.summary && <p className="cx-watch-sum">{run.digest.summary}</p>}
                    <ol className="cx-watch-items">
                      {run.digest.items.map((i) => {
                        const p = papers.get(i.pmid);
                        return (
                          <li key={i.pmid}>
                            <p className="cx-rxc-tags"><span className={`cx-watch-imp i-${i.impact}`}>{IMPACT_LABEL[i.impact]}</span>{run.fresh.includes(i.pmid) && <span className="cx-watch-new">New</span>}</p>
                            <p>{i.takeaway}{i.why && <span className="cx-watch-why"> {i.why}</span>}</p>
                            {p && <a href={pubmedUrl(i.pmid)} target="_blank" rel="noopener noreferrer" className="cx-watch-src">{p.title} <span>{p.journal} {p.year}</span> <ExternalLink size={12} /></a>}
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
              </article>
            );
          })}
          {Object.keys(state.runs).length > 0 && <button className="cx-btn" style={{ alignSelf: "flex-start" }} onClick={() => setState((s) => ({ ...s, runs: {} }))}><Trash2 size={14} /> Clear digests</button>}
        </div>
      )}
      <p className="cx-rs-foot"><BellRing size={13} /> Written only from the PubMed records shown; open a paper before changing practice. Check back weekly: papers new since your last check are marked.</p>
    </section>
  );
}
