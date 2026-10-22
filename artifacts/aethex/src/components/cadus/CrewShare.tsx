/**
 * Sharing Cadus Crew assistants: a link (and a QR code when it fits) that opens Cadus
 * with the assistant ready to add, and the import screen that previews an assistant
 * from a link before it joins your crew. Knowledge files are not shared.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Download, Link2, MessageCircle, QrCode, ShieldCheck, X } from "lucide-react";
import { qrSvg } from "@/lib/cadus/qr";
import { crewShareLink, readShareCode, shareCodeFrom, type CrewMember } from "@/lib/cadus/crew";

/** Links up to this length still make a QR code a phone can scan. */
const QR_MAX = 1800;

export function CrewShareDialog({ c, base, badge, dark, onClose, toast }: {
  c: CrewMember;
  base: string;
  badge: ReactNode;
  dark: boolean;
  onClose: () => void;
  toast: (t: string) => void;
}) {
  const link = useMemo(() => crewShareLink(c, base), [c, base]);
  const [copied, setCopied] = useState(false);
  const qr = useMemo(() => (link.length <= QR_MAX ? qrSvg(link, 200, { dark: dark ? "#F2EFE8" : "#0F1729", light: dark ? "#111A2B" : "#fff" }) : ""), [link, dark]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast("Link copied"); setTimeout(() => setCopied(false), 1600); } catch { toast("Couldn't copy; select the link and copy it"); }
  };
  const download = () => {
    const blob = new Blob([JSON.stringify({ cadusCrew: 1, link, name: c.name }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${c.name.replace(/[^\w-]+/g, "-").toLowerCase()}.cadus-crew.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cs" role="dialog" aria-modal="true" aria-labelledby="cx-cs-t" onMouseDown={(e) => e.stopPropagation()} data-crew="share">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh">{badge}<div><h3 id="cx-cs-t">Share {c.name}</h3><p>Anyone with the link can add a copy to their own Cadus Crew.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-cs-link"><Link2 size={14} /><input className="cx-input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" data-crew="link" /></div>
          <div className="cx-cs-acts">
            <button className="cx-btn primary" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}</button>
            <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(`Try my Cadus assistant "${c.name}": ${link}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
            <button className="cx-btn" onClick={download}><Download size={14} /> Save as file</button>
          </div>
          {qr ? (
            <div className="cx-cs-qr"><span dangerouslySetInnerHTML={{ __html: qr }} /><small><QrCode size={13} /> Scan to add it on a phone</small></div>
          ) : (
            <p className="cx-cs-note"><QrCode size={13} /> The instructions are too long for a QR code; share the link instead.</p>
          )}
          <p className="cx-cs-note"><ShieldCheck size={13} /> Shared: name, description, instructions, first questions, tool and look.{c.knowledge?.length ? ` Not shared: its ${c.knowledge.length} knowledge document${c.knowledge.length === 1 ? "" : "s"}, which stay on this device.` : ""}</p>
        </div>
      </div>
    </div>
  );
}

export function CrewImportDialog({ c, badge, onAdd, onClose, already }: {
  c: CrewMember;
  badge: ReactNode;
  onAdd: () => void;
  onClose: () => void;
  already: boolean;
}) {
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cs" role="dialog" aria-modal="true" aria-labelledby="cx-ci-t" onMouseDown={(e) => e.stopPropagation()} data-crew="import">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh">{badge}<div><h3 id="cx-ci-t">{c.name}</h3><p>{c.tagline || "A Cadus Crew assistant shared with you"}</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <p className="cx-gl"><span>Its instructions</span></p>
          <pre className="cx-ci-instr">{c.instructions}</pre>
          {c.starters.length > 0 && <><p className="cx-gl"><span>First questions</span></p><ul className="cx-ci-st">{c.starters.map((s) => <li key={s}>{s}</li>)}</ul></>}
          <p className="cx-cs-note"><ShieldCheck size={13} /> Shared assistants follow Cadus's clinical safety rules whatever their instructions say. Read them before adding.</p>
        </div>
        <div className="cx-dialog-f">
          <button className="cx-btn" onClick={onClose}>Not now</button>
          <button className="cx-btn primary" onClick={onAdd} data-crew="add">{already ? "Add another copy" : "Add to my crew"}</button>
        </div>
      </div>
    </div>
  );
}

/** Paste a shared link (or open a saved .cadus-crew.json) to import. */
export function CrewPasteImport({ modes, onFound, toast }: { modes: string[]; onFound: (c: CrewMember) => void; toast: (t: string) => void }) {
  const [text, setText] = useState("");
  const go = (t: string) => {
    const code = shareCodeFrom(t);
    const c = code ? readShareCode(code, modes) : null;
    if (!c) { toast("That isn't a Cadus Crew link"); return; }
    setText("");
    onFound(c);
  };
  return (
    <form className="cx-ci-paste" onSubmit={(e) => { e.preventDefault(); go(text); }}>
      <input className="cx-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a Cadus Crew link to import" aria-label="Paste a Cadus Crew link" data-crew="paste" />
      <button className="cx-btn" type="submit" disabled={!text.trim()}>Import</button>
      <label className="cx-btn">
        Open file
        <input type="file" hidden accept=".json,application/json" onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try { const o = JSON.parse(await f.text()); go(String(o?.link ?? "")); } catch { toast("That isn't a Cadus Crew file"); }
        }} />
      </label>
    </form>
  );
}
