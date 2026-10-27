/**
 * Assistant Version History: earlier versions of one of your assistants (saved on every edit), a
 * line-by-line comparison with the current version, and restore.
 */
import { useState, type ReactNode } from "react";
import { History, RotateCcw, X } from "lucide-react";
import { diffStats, lineDiff, type CrewMember, type CrewVersion } from "@/lib/cadus/crew";

export default function CrewVersionsDialog({ c, versions, badge, onRestore, onClose }: {
  c: CrewMember;
  versions: CrewVersion[];
  badge: ReactNode;
  onRestore: (v: CrewVersion) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState(0);
  const v = versions[sel];
  const diff = v ? lineDiff(v.instructions, c.instructions) : [];
  const st = diffStats(diff);
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset cx-tr-dialog" role="dialog" aria-modal="true" aria-labelledby="cx-vh-t" onMouseDown={(e) => e.stopPropagation()} data-crew="history">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh">{badge}<div><h3 id="cx-vh-t">{c.name}: version history</h3><p>Earlier versions are saved each time you change its name, description, instructions or first questions (the last 10).</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          {!versions.length ? <p className="cx-set-hint" data-vh="empty"><History size={13} /> No earlier versions yet. Edit the assistant and the previous version will be kept here.</p> : (
            <div className="cx-vh">
              <div className="cx-vh-list" data-vh="list">{versions.map((x, i) => (
                <button key={x.at + i} className={`cx-vh-i ${i === sel ? "on" : ""}`} onClick={() => setSel(i)} data-vh-item={i}><b>{new Date(x.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</b><small>{x.name}{x.name !== c.name ? " (old name)" : ""}</small></button>
              ))}</div>
              {v && (
                <div className="cx-vh-main">
                  <p className="cx-set-hint" data-vh="stats">Compared with now: {st.added} line{st.added === 1 ? "" : "s"} added, {st.removed} removed{v.tagline !== (c.tagline ?? "") ? "; description changed" : ""}{v.starters.join("\n") !== c.starters.join("\n") ? "; first questions changed" : ""}.</p>
                  <pre className="cx-vh-diff" data-vh="diff">{diff.map((d, i) => <span key={i} className={d.type}>{d.type === "add" ? "+ " : d.type === "del" ? "− " : "  "}{d.text || " "}{"\n"}</span>)}</pre>
                  <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onRestore(v)} data-vh="restore"><RotateCcw size={14} /> Restore this version</button></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
