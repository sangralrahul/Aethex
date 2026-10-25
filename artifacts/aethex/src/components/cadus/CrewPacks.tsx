/**
 * Team packs: ready-made teams of assistants added as a collection in one tap, packs you build
 * from any assistants and share as a file or link, and importing a pack someone sent you.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Download, FolderPlus, Link2, Package, Upload, X } from "lucide-react";
import { allCrew, CREW_PACKS, findCrew, packFile, packLink, readPack, type CrewMember, type ReadPack } from "@/lib/cadus/crew";

export default function CrewPacks({ mine, modes, base, badge, incoming, onImport, onAddPack, onClose, toast }: {
  mine: CrewMember[];
  modes: string[];
  base: string;
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  incoming: ReadPack | null;
  onImport: (p: ReadPack) => void;
  onAddPack: (name: string, ids: string[]) => void;
  onClose: () => void;
  toast: (t: string) => void;
}) {
  const [name, setName] = useState("My team");
  const [pick, setPick] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [paste, setPaste] = useState("");
  const [preview, setPreview] = useState<ReadPack | null>(incoming);
  const list = useMemo(() => allCrew(mine).filter((c) => !q.trim() || `${c.name} ${c.tagline}`.toLowerCase().includes(q.trim().toLowerCase())), [mine, q]);
  const tg = (id: string) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 12 ? p : [...p, id]));
  const download = () => {
    const blob = new Blob([packFile(name, pick, mine)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(name || "crew-pack").replace(/[^\w-]+/g, "-").toLowerCase()}.cadus-pack.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast("Pack saved as a file");
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(packLink(name, pick, mine, base)); toast("Pack link copied"); } catch { toast("Couldn't copy the link"); }
  };
  const open = (text: string) => { const p = readPack(text, modes); if (p && (p.builtInIds.length || p.custom.length)) setPreview(p); else toast("That isn't a Cadus Crew pack"); };

  return (
    <div className="cx-cmp-out cx-packs" data-crew="packs">
      <div className="cx-packs-h"><h3 className="cx-lab-h3"><Package size={16} /> Team packs</h3><button className="cx-ib" onClick={onClose} aria-label="Close team packs"><X size={16} /></button></div>
      {preview && (
        <div className="cx-cmp-out cx-ac-in" data-pack="preview">
          <p><b>{preview.name}</b>: {preview.builtInIds.length + preview.custom.length} assistant{preview.builtInIds.length + preview.custom.length === 1 ? "" : "s"}</p>
          <div className="cx-crew-recent">{preview.builtInIds.map((id) => findCrew(id, [])).filter((c): c is CrewMember => !!c).map((c) => <span key={c.id} className="cx-chip">{badge(c, 18)} {c.name}</span>)}{preview.custom.map((c) => <span key={c.name} className="cx-chip">{badge(c, 18)} {c.name} <small>(new)</small></span>)}</div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => { onImport(preview); setPreview(null); }} data-pack="confirm"><Check size={14} /> Add this pack</button><button className="cx-btn" onClick={() => setPreview(null)}>Cancel</button></div>
          <p className="cx-set-hint">Their own assistants join your crew as copies; the whole team goes into a collection named after the pack.</p>
        </div>
      )}
      <h4>Ready-made teams</h4>
      <div className="cx-packs-grid">
        {CREW_PACKS.map((p) => (
          <div key={p.id} className="cx-pack">
            <b>{p.name}</b><small>{p.description}</small>
            <div className="cx-pack-faces">{p.ids.map((id) => findCrew(id, [])).filter((c): c is CrewMember => !!c).map((c) => <span key={c.id} title={c.name}>{badge(c, 22)}</span>)}</div>
            <button className="cx-btn sm" onClick={() => onAddPack(p.name, p.ids)} data-pack-add={p.id}><FolderPlus size={13} /> Add as a collection</button>
          </div>
        ))}
      </div>
      <h4>Build and share a pack</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Pack name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} data-pack="name" /></label>
        <label className="cx-field"><span>Find assistants</span><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="Search" data-pack="q" /></label>
      </div>
      <div className="cx-pack-pick" data-pack="pick">{list.map((c) => <label key={c.id} className={`cx-chip ${pick.includes(c.id) ? "on" : ""}`}><input type="checkbox" checked={pick.includes(c.id)} onChange={() => tg(c.id)} hidden data-pack-pick={c.id} />{badge(c, 18)} {c.name}</label>)}</div>
      <p className="cx-set-hint">{pick.length} chosen (up to 12). Your own assistants travel inside the pack; their knowledge files stay on this device.</p>
      <div className="cx-sc-acts">
        <button className="cx-btn" disabled={!pick.length} onClick={() => onAddPack(name, pick)} data-pack="save"><FolderPlus size={14} /> Save as a collection</button>
        <button className="cx-btn" disabled={!pick.length} onClick={download} data-pack="file"><Download size={14} /> Save pack file</button>
        <button className="cx-btn" disabled={!pick.length} onClick={() => void copyLink()} data-pack="link"><Copy size={14} /> Copy pack link</button>
      </div>
      <h4>Open a pack you were sent</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span><Link2 size={12} /> Paste a pack link or code</span><input className="cx-input" value={paste} onChange={(e) => setPaste(e.target.value.slice(0, 60000))} data-pack="paste" /></label>
        <button className="cx-btn" disabled={!paste.trim()} onClick={() => open(paste)} data-pack="open">Open</button>
        <label className="cx-btn"><Upload size={14} /> Pack file<input type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) open(await f.text()); }} data-pack="import-file" /></label>
      </div>
    </div>
  );
}
