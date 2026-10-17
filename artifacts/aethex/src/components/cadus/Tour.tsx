/**
 * A short guided tour: a spotlight on one part of the screen at a time with a
 * line about what it does. Steps whose target isn't on screen (the sidebar on
 * a phone, say) are skipped.
 */
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

export interface TourStep {
  selector: string;
  title: string;
  text: string;
}

const visible = (el: Element | null): el is HTMLElement => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 4 && r.height > 4 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
};

export default function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [list] = useState(() => steps.filter((s) => visible(document.querySelector(s.selector))));
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = list[i];

  const measure = useCallback(() => {
    const el = step ? document.querySelector(step.selector) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    if (!list.length) { onClose(); return; }
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const t = window.setInterval(measure, 400);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); window.clearInterval(t); };
  }, [measure, list.length, onClose]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
      if (e.key === "ArrowRight") setI((x) => Math.min(list.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [list.length, onClose]);

  if (!step || !rect) return null;
  const pad = 6;
  const W = 320;
  const vw = window.innerWidth, vh = window.innerHeight;
  // Beside sidebar items, below or above everything else.
  const side = rect.right < vw * 0.3 && rect.height < 80;
  let left: number, top: number;
  if (side) {
    left = rect.right + 16;
    top = Math.min(vh - 210, Math.max(12, rect.top - 12));
  } else {
    left = Math.min(vw - W - 12, Math.max(12, rect.left + rect.width / 2 - W / 2));
    top = rect.bottom + 14 + 200 < vh ? rect.bottom + 14 : Math.max(12, rect.top - 14 - 190);
  }
  const last = i === list.length - 1;
  return (
    <div className="cx-tour" role="dialog" aria-modal="true" aria-label="Tour of Cadus">
      <div className="cx-tour-spot" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      <div className="cx-tour-card" style={{ left, top, width: W }}>
        <div className="cx-tour-h">
          <span>{i + 1} of {list.length}</span>
          <button className="cx-ib" onClick={onClose} aria-label="End the tour"><X size={16} /></button>
        </div>
        <b>{step.title}</b>
        <p>{step.text}</p>
        <div className="cx-tour-f">
          <button className="cx-tour-skip" onClick={onClose}>Skip tour</button>
          {i > 0 && <button className="cx-btn" onClick={() => setI(i - 1)}><ArrowLeft size={14} /> Back</button>}
          <button className="cx-btn primary" onClick={() => (last ? onClose() : setI(i + 1))} autoFocus>{last ? "Done" : <>Next <ArrowRight size={14} /></>}</button>
        </div>
      </div>
    </div>
  );
}
