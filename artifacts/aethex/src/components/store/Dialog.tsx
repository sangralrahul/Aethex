/**
 * A centred dialog (a sheet on phones) above everything, closed with Escape,
 * the close button or a click outside. Styles: src/shop.css (.ax-dlg).
 */
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { TopLayer } from "@/components/shop/TopLayer";

export function Dialog({ open, onClose, title, children, wide = false, label }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean; label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => box.current?.querySelector<HTMLElement>("input, select, textarea, button:not(.x)")?.focus(), 30);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; window.clearTimeout(t); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <TopLayer>
      <div className="ax-dlg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div ref={box} className={`ax-dlg-in${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={label ?? (typeof title === "string" ? title : undefined)}>
          <div className="ax-dlg-head">
            <h2>{title}</h2>
            <button type="button" className="x" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="ax-dlg-body">{children}</div>
        </div>
      </div>
    </TopLayer>
  );
}
