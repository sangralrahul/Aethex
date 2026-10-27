/**
 * Diagram It: turn an answer into a flowchart or a mind map (Mermaid), view it, download it as SVG
 * or copy the diagram code.
 */
import { lazy, Suspense, useRef, useState } from "react";
import { Copy, Download, GitFork, Loader2, Network, X } from "lucide-react";
import { diagramPrompt, extractMermaid } from "@/lib/cadus/crew";

const MermaidDiagram = lazy(() => import("./MermaidDiagram"));

export default function CrewDiagramDialog({ text, run, canAsk, friendlyError, toast, onClose }: {
  text: string;
  run: (prompt: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"flowchart" | "mindmap">("flowchart");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const go = async () => {
    if (!canAsk(1)) return;
    setBusy(true); setCode(""); setErr("");
    try {
      const c = extractMermaid(await run(diagramPrompt(kind, text)));
      if (!c) setErr("The diagram didn't come back in a usable form. Try again or switch type.");
      setCode(c);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const download = () => {
    const svg = box.current?.querySelector("svg");
    if (!svg) { toast("Wait for the diagram to finish drawing"); return; }
    const xml = new XMLSerializer().serializeToString(svg);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([xml.startsWith("<?xml") ? xml : `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], { type: "image/svg+xml" }));
    a.download = `cadus-${kind}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <div className="cx-dialog cx-cset cx-tr-dialog" role="dialog" aria-modal="true" aria-labelledby="cx-dgm-t" onMouseDown={(e) => e.stopPropagation()} data-crew="diagram">
        <div className="cx-dialog-h">
          <div className="cx-crew-dh"><span className="cx-fc-ic"><GitFork size={22} /></span><div><h3 id="cx-dgm-t">Diagram it</h3><p>Turn this answer into a flowchart or a mind map for revision or a slide.</p></div></div>
          <button className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-seg" role="tablist">{([["flowchart", "Flowchart", GitFork], ["mindmap", "Mind map", Network]] as const).map(([k, l, Ic]) => <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)} data-dgm-type={k}><Ic size={14} /> {l}</button>)}</div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-dgm="run">{busy ? <Loader2 size={14} className="cx-rot" /> : <GitFork size={14} />} {busy ? "Drawing…" : code ? "Draw again" : "Draw it"}</button></div>
          {err && <p className="cx-set-hint cx-bk-err" data-dgm="err">{err}</p>}
          {code && (
            <>
              <div className="cx-dgm-box" ref={box} data-dgm="out"><Suspense fallback={<p className="cx-set-hint">Loading the diagram…</p>}><MermaidDiagram chart={code} /></Suspense></div>
              <div className="cx-sc-acts">
                <button className="cx-btn" onClick={download} data-dgm="svg"><Download size={14} /> Download SVG</button>
                <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(code); toast("Diagram code copied (Mermaid)"); }} data-dgm="code"><Copy size={14} /> Copy code</button>
              </div>
            </>
          )}
          <p className="cx-set-hint">Check the diagram against the answer: drawings simplify, and doses must stay exact.</p>
        </div>
      </div>
    </div>
  );
}
