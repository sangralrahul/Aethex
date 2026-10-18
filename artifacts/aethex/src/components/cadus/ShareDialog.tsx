/**
 * Share an answer or a case: a link that carries the (de-identified) content
 * itself, a QR code for a phone, a WhatsApp or email hand-off, or a text file.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Link2, MessageCircle, Mail, QrCode, Share2, ShieldCheck, X } from "lucide-react";
import { encodeShare, guardShared, shareAsText, shareUrl, type Shared } from "@/lib/cadus/share";
import { qrSvg } from "@/lib/cadus/qr";
import { downloadBlob, fileSlug } from "@/lib/cadus/docx";
import { isCadusHost } from "@/lib/host";

export default function ShareDialog({ item, onClose, toast, dark }: { item: Shared; onClose: () => void; toast: (t: string) => void; dark: boolean }) {
  const [from, setFrom] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const shared = useMemo<Shared>(() => guardShared({ ...item, ...(from.trim() ? { from: from.trim() } : {}) }), [item, from]);
  useEffect(() => {
    let live = true;
    encodeShare(shared).then((f) => { if (live) setLink(shareUrl(f, window.location.origin, isCadusHost())); }).catch(() => { if (live) setLink(""); });
    return () => { live = false; };
  }, [shared]);
  const tooLong = link.length > 6000;
  const qr = useMemo(() => (showQr && link && link.length <= 2300 ? qrSvg(link, 200, { dark: dark ? "#F2EFE8" : "#0F1729", light: dark ? "#111A2B" : "#fff" }) : ""), [showQr, link, dark]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1500); toast("Link copied"); } catch { toast("Couldn't copy; select the link and copy it"); }
  };
  const text = shareAsText(shared);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(tooLong ? text.slice(0, 1500) + "…" : `${shared.title}\n${link}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent(`${shared.title} (shared from Cadus)`)}&body=${encodeURIComponent(tooLong ? text : `${text.split("\n\n")[0]}\n\n${link}`)}`;
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-share" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cx-share-t">
        <div className="cx-dialog-h">
          <div><h3 id="cx-share-t"><Share2 size={18} /> Share {item.kind === "case" ? "this case" : "this answer"}</h3><p>The link carries the content itself, so no account is needed and nothing is stored on a server. Identifiers were hidden before it was packed.</p></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <label className="cx-field"><span>From (optional)</span><input className="cx-input" value={from} maxLength={40} onChange={(e) => setFrom(e.target.value)} placeholder="Dr Rao, Medicine" /></label>
          <div className="cx-share-link">
            <Link2 size={15} />
            <input className="cx-input" readOnly value={link || "Preparing the link…"} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" />
            <button className="cx-btn primary" onClick={copy} disabled={!link}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}</button>
          </div>
          {tooLong && <p className="cx-share-note">This one is long ({Math.round(link.length / 1000)} k characters). Some apps cut long links, so the file or email below is safer.</p>}
          <div className="cx-share-acts">
            <button className="cx-btn" onClick={() => setShowQr(!showQr)} disabled={!link || link.length > 2300} title={link.length > 2300 ? "Too long for a QR code" : "Show a QR code for a phone"}><QrCode size={14} /> QR code</button>
            <a className="cx-btn" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
            <a className="cx-btn" href={mail}><Mail size={14} /> Email</a>
            <button className="cx-btn" onClick={() => { downloadBlob(`${fileSlug(shared.title, "cadus-shared")}.txt`, new Blob([text], { type: "text/plain;charset=utf-8" })); toast("Text file downloaded"); }}><Download size={14} /> Text file</button>
          </div>
          {showQr && qr && <div className="cx-share-qr" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR code for the link" role="img" />}
          <p className="cx-share-foot"><ShieldCheck size={13} /> Whoever opens the link sees it read-only in Cadus with the same safety note. Share clinical content only with colleagues who need it.</p>
        </div>
      </div>
    </div>
  );
}
