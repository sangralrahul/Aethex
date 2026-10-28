/**
 * Under every clinical tool (update 50): who it is for, how current it is, a branded PDF of the
 * result on the user's letterhead, and a way to report a problem.
 */
import { BadgeCheck, Flag, Printer } from "lucide-react";
import { printTool } from "@/lib/cadus/toolprint";

export const CONTENT_REVIEWED = "October 2026";

export default function ToolTrustBar({ host, toast, letterhead }: { host: () => HTMLElement | null; toast: (t: string) => void; letterhead: boolean }) {
  const print = () => {
    const page = host()?.querySelector<HTMLElement>(".cx-page") ?? null;
    if (!printTool(page)) toast("Nothing to print yet");
  };
  return (
    <footer className="cx-trust" data-trust="bar">
      <div className="cx-trust-l">
        <BadgeCheck size={15} aria-hidden="true" />
        <p><b>Clinical decision support for registered practitioners.</b> Built from the guidelines cited above; doses and thresholds follow adult or stated populations. Check local protocols and use your clinical judgement. <span data-trust="reviewed">Content reviewed {CONTENT_REVIEWED}.</span></p>
      </div>
      <div className="cx-trust-r">
        <button className="cx-btn" onClick={print} data-trust="print" title={letterhead ? "Print or save a PDF on your letterhead" : "Print or save a PDF (add a letterhead in Settings)"}><Printer size={14} /> Print / PDF</button>
        <a className="cx-btn ghost" href="https://aethex.in/contact?topic=cadus-content" target="_blank" rel="noopener noreferrer" data-trust="report"><Flag size={14} /> Report an issue</a>
      </div>
    </footer>
  );
}
