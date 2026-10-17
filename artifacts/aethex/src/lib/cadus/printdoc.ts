/**
 * Printing a Cadus answer or document: markdown is rendered, its flowcharts are
 * drawn, and the page goes to the browser's print dialog (which can also save a
 * PDF) with the letterhead, a signature block where the document needs one,
 * and the sources it cites.
 */
import { renderMarkdown } from "@/lib/cadus-markdown";
import { renderFlowcharts } from "./flowchart";
import { printHtml, printPage, type Letterhead } from "./letterhead";

export interface PrintSource {
  n: number;
  url: string;
  title: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The body of a printed document: the rendered markdown, then its numbered sources. */
export async function printBody(md: string, sources: PrintSource[] = []): Promise<string> {
  const box = document.createElement("div");
  box.innerHTML = renderMarkdown(md, { cites: sources.length, copy: false });
  try {
    await renderFlowcharts(box);
  } catch { /* the chart's text is printed instead */ }
  const list = sources.length
    ? `<h2>Sources</h2><ol class="src">${sources.map((s) => `<li>${esc(s.title)}<br><span>${esc(s.url)}</span></li>`).join("")}</ol>`
    : "";
  return box.innerHTML + list;
}

/** Print a markdown document through the browser (no pop-up window). */
export async function printMarkdown(opts: {
  title: string;
  md: string;
  sources?: PrintSource[];
  letterhead?: Letterhead | null;
  signature?: boolean;
  large?: boolean;
  landscape?: boolean;
  footer?: string;
}): Promise<void> {
  const bodyHtml = await printBody(opts.md, opts.sources);
  printHtml(printPage({
    title: opts.title,
    bodyHtml,
    letterhead: opts.letterhead,
    signature: opts.signature,
    large: opts.large,
    landscape: opts.landscape,
    footer: opts.footer,
  }));
}
