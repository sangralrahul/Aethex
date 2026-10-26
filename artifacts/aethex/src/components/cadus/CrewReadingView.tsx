/**
 * Reading List: references saved from Crew answers (PMIDs, DOIs, links, reference lists) and your
 * own, with notes, read/unread, PubMed and DOI links, and export.
 */
import { useState, type ReactNode } from "react";
import { BookMarked, Check, Copy, Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import { addReading, findCrew, readingMarkdown, refLink, type CrewMember, type ReadingItem } from "@/lib/cadus/crew";

export default function CrewReadingView({ list, setList, mine, badge, toast }: {
  list: ReadingItem[];
  setList: (f: (l: ReadingItem[]) => ReadingItem[]) => void;
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  toast: (t: string) => void;
}) {
  const [q, setQ] = useState("");
  const [unread, setUnread] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const shown = list.filter((r) => (!unread || !r.read) && (!q || `${r.title} ${r.note} ${r.pmid} ${r.doi}`.toLowerCase().includes(q.toLowerCase())));
  const add = () => {
    const t = title.trim();
    const l = link.trim();
    if (!t && !l) { toast("Add a title or a link"); return; }
    const pmid = (/^\d{5,9}$/.exec(l) ?? [])[0] ?? (/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{5,9})/.exec(l) ?? [])[1] ?? "";
    const doi = (/(10\.\d{4,9}\/\S+)/.exec(l) ?? [])[1] ?? "";
    const url = /^https?:\/\//.test(l) ? l : "";
    const r = addReading(list, [{ title: t || l, url, pmid, doi }], "");
    if (!r.added) { toast("Already in your reading list"); return; }
    setList(() => r.list); setTitle(""); setLink(""); toast("Added to your reading list");
  };
  const md = () => readingMarkdown(shown);
  return (
    <section className="cx-page cx-lab cx-reading">
      <header className="cx-page-h"><div><h1>Reading List</h1><p>References saved from Crew answers (the Save references button under an answer) and your own. Notes and read status stay on this device.</p></div></header>
      <div className="cx-sim-stats"><div><b data-rl="total">{list.length}</b><small>saved</small></div><div><b data-rl="unread-n">{list.filter((r) => !r.read).length}</b><small>to read</small></div><div><b>{list.filter((r) => r.read).length}</b><small>read</small></div></div>
      <h4><Plus size={14} /> Add one</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Title</span><input className="cx-input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 300))} placeholder="e.g. RECOVERY trial: dexamethasone in COVID-19" data-rl="title" /></label>
        <label className="cx-field"><span>Link, PMID or DOI</span><input className="cx-input" value={link} onChange={(e) => setLink(e.target.value.slice(0, 600))} placeholder="PMID, DOI or https://…" data-rl="link" /></label>
        <button className="cx-btn primary" onClick={add} data-rl="add"><Plus size={14} /> Add</button>
      </div>
      <div className="cx-c23-row">
        <input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and notes" data-rl="find" />
        <label className="cx-pa-mine"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} data-rl="unread" /> Unread only</label>
      </div>
      {list.length > 0 && <div className="cx-sc-acts">
        <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(md()); toast("Reading list copied"); }} data-rl="copy"><Copy size={14} /> Copy list</button>
        <button className="cx-btn" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md()], { type: "text/markdown" })); a.download = "cadus-reading-list.md"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }} data-rl="download"><Download size={14} /> Download (.md)</button>
      </div>}
      {!list.length && <p className="cx-set-hint" data-rl="empty"><BookMarked size={13} /> Nothing saved yet.</p>}
      <div className="cx-rl-list" data-rl="list">{shown.map((r) => { const c = r.crewId ? findCrew(r.crewId, mine) : undefined; return (
        <div key={r.id} className={`cx-rl-item ${r.read ? "read" : ""}`} data-rl-item={r.id}>
          <div className="cx-rl-h">
            {c && badge(c, 22)}
            <a href={refLink(r)} target="_blank" rel="noopener noreferrer" data-rl-open={r.id}>{r.title}<ExternalLink size={12} /></a>
          </div>
          <small>{[r.pmid && `PMID ${r.pmid}`, r.doi && `doi ${r.doi}`, c?.name, new Date(r.at).toLocaleDateString()].filter(Boolean).join(" · ")}</small>
          <textarea className="cx-input" rows={1} value={r.note} onChange={(e) => { const v = e.target.value.slice(0, 1000); setList((l) => l.map((x) => (x.id === r.id ? { ...x, note: v } : x))); }} placeholder="Your note" data-rl-note={r.id} />
          <div className="cx-rl-acts">
            <button className={`cx-btn sm ${r.read ? "" : "primary"}`} onClick={() => setList((l) => l.map((x) => (x.id === r.id ? { ...x, read: !x.read } : x)))} data-rl-read={r.id}><Check size={13} /> {r.read ? "Mark unread" : "Mark read"}</button>
            <button className="cx-ib" aria-label="Remove" onClick={() => setList((l) => l.filter((x) => x.id !== r.id))}><Trash2 size={15} /></button>
          </div>
        </div>); })}</div>
    </section>
  );
}
