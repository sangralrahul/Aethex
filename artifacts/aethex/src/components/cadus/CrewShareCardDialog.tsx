/**
 * Crew Share Cards: turn an answer into a clean image card (1080 × 1350) to save or share on
 * WhatsApp, with the assistant's name and a safety footer.
 */
import { useEffect, useRef, useState } from "react";
import { Download, Image as ImageIcon, MessageCircle, Share2, X } from "lucide-react";
import { cardText, wrapLines } from "@/lib/cadus/crew";

const TONES: Record<string, string> = { teal: "#0E8F84", violet: "#6D4AFF", rose: "#E0457B", amber: "#D97706", sky: "#0284C7", lime: "#4D7C0F", navy: "#1F3F7A", slate: "#475569" };

export default function CrewShareCardDialog({ title, text, by, tone, toast, onClose }: { title: string; text: string; by: string; tone: string; toast: (t: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [dark, setDark] = useState(false);
  const [url, setUrl] = useState("");
  const body = cardText(text);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const W = 1080, H = 1350, P = 80, accent = TONES[tone] ?? TONES.teal;
    cv.width = W; cv.height = H;
    ctx.fillStyle = dark ? "#0F1729" : "#FBFAF7"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 18);
    ctx.fillStyle = accent; ctx.font = "600 34px system-ui, sans-serif"; ctx.fillText(`Cadus Crew · ${by}`.slice(0, 48), P, 110);
    ctx.fillStyle = dark ? "#F2EFE8" : "#111827"; ctx.font = "700 52px Georgia, serif";
    const tl = wrapLines(title || "Clinical note", W - 2 * P, (s) => ctx.measureText(s).width, 3);
    tl.forEach((l, i) => ctx.fillText(l, P, 200 + i * 64));
    let y = 200 + tl.length * 64 + 40;
    ctx.font = "400 34px system-ui, sans-serif"; ctx.fillStyle = dark ? "#D6D3CC" : "#1F2937";
    const lines = wrapLines(body, W - 2 * P, (s) => ctx.measureText(s).width, Math.floor((H - y - 170) / 48));
    lines.forEach((l) => { ctx.fillText(l, P, y); y += 48; });
    ctx.fillStyle = dark ? "#1E293B" : "#EFEDE7"; ctx.fillRect(0, H - 130, W, 130);
    ctx.fillStyle = dark ? "#94A3B8" : "#6B7280"; ctx.font = "400 26px system-ui, sans-serif";
    ctx.fillText("Made with Cadus · For education; not advice for an individual patient.", P, H - 70);
    ctx.fillText(new Date().toLocaleDateString(), P, H - 35);
    setUrl(cv.toDataURL("image/png"));
  }, [title, body, by, tone, dark]);
  const download = () => { const a = document.createElement("a"); a.href = url; a.download = `cadus-card-${Date.now()}.png`; a.click(); toast("Card saved"); };
  const share = async () => {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "cadus-card.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title: "Cadus" });
      else { download(); toast("Sharing images isn't supported here: the card was saved instead"); }
    } catch { /* cancelled */ }
  };
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset" role="dialog" aria-modal="true" aria-labelledby="cx-sc-t" onMouseDown={(e) => e.stopPropagation()} data-crew="sharecard">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><ImageIcon size={22} /></span><div><h3 id="cx-sc-t">Share as a card</h3><p>A clean image of this answer for WhatsApp or a slide. Remove anything identifying first.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <canvas ref={ref} className="cx-sc-canvas" data-sc="canvas" />
          <label className="cx-pa-mine"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} data-sc="dark" /> Dark card</label>
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={download} disabled={!url} data-sc="download"><Download size={14} /> Save image</button>
            <button className="cx-btn" onClick={() => void share()} disabled={!url} data-sc="share"><Share2 size={14} /> Share</button>
            <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(`${title}\n\n${body}\n\n— via Cadus`.slice(0, 1500))}`} target="_blank" rel="noopener noreferrer" data-sc="wa"><MessageCircle size={14} /> WhatsApp text</a>
          </div>
        </div>
      </div>
    </div>
  );
}
