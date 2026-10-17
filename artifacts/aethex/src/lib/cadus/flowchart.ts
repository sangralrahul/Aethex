/**
 * Flowcharts in Cadus answers: ```mermaid blocks (rendered as placeholders by
 * cadus-markdown) are drawn with Mermaid, loaded only when an answer has one.
 * The theme travels in an init directive, so the global Mermaid settings used
 * by lecture decks are left alone. If a chart can't be drawn, its source is
 * shown instead.
 */
import { useEffect, type RefObject } from "react";

type MermaidApi = { render: (id: string, text: string) => Promise<{ svg: string }>; initialize: (c: Record<string, unknown>) => void };

let loading: Promise<MermaidApi> | null = null;
let count = 0;

function load(): Promise<MermaidApi> {
  if (!loading) {
    loading = import("mermaid").then((m) => {
      const api = (m.default ?? m) as unknown as MermaidApi;
      return api;
    });
  }
  return loading;
}

const FONT = "Cadus UI, Plus Jakarta Sans, system-ui, sans-serif";

function directive(dark: boolean): string {
  const v = dark
    ? { primaryColor: "#16223A", primaryTextColor: "#E4E7ED", primaryBorderColor: "#2DD4BF", lineColor: "#8590A6", secondaryColor: "#1F2C45", tertiaryColor: "#111A2B", background: "#0B1220", edgeLabelBackground: "#111A2B", fontSize: "14px" }
    : { primaryColor: "#EEF7F5", primaryTextColor: "#0F1729", primaryBorderColor: "#007A6C", lineColor: "#667085", secondaryColor: "#F3F4F7", tertiaryColor: "#FFFFFF", background: "#FFFFFF", edgeLabelBackground: "#FFFFFF", fontSize: "14px" };
  // The same font Cadus uses (registered by its stylesheet, unquoted so the directive parses), so
  // labels are measured and drawn alike; plain SVG labels keep the page's paragraph styles out.
  return `%%{init: ${JSON.stringify({ theme: "base", htmlLabels: false, fontFamily: FONT, themeVariables: { ...v, fontFamily: FONT }, flowchart: { curve: "basis", htmlLabels: false, padding: 12, nodeSpacing: 34, rankSpacing: 40, useMaxWidth: true } })}}%%\n`;
}

/** Draw every new flowchart placeholder inside `root`. */
export async function renderFlowcharts(root: HTMLElement): Promise<void> {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('.md-mermaid[data-state="new"]'));
  if (!nodes.length) return;
  nodes.forEach((n) => { n.dataset.state = "busy"; });
  const dark = !!root.closest(".cx-dark");
  let mermaid: MermaidApi;
  try {
    mermaid = await load();
    // Labels are sized from the font, so wait for it before drawing.
    await Promise.race([
      document.fonts?.load?.('600 14px "Cadus UI"').then(() => document.fonts.ready),
      new Promise((r) => window.setTimeout(r, 1500)),
    ]);
  } catch {
    nodes.forEach((n) => { n.dataset.state = "error"; });
    return;
  }
  for (const node of nodes) {
    const src = (node.querySelector(".md-mermaid-src")?.textContent || "").replace(/%%\{[\s\S]*?\}%%\s*/g, "").trim();
    const fig = node.querySelector<HTMLElement>(".md-mermaid-fig");
    if (!src || !fig) { node.dataset.state = "error"; continue; }
    try {
      const { svg } = await mermaid.render(`cx-flow-${++count}`, directive(dark) + src);
      fig.innerHTML = svg;
      // Mermaid gives the chart its natural width as max-width; it scales down, never up.
      const el = fig.querySelector("svg");
      if (el) { el.removeAttribute("height"); el.style.height = "auto"; }
      node.dataset.state = "done";
    } catch {
      node.dataset.state = "error";
      // Mermaid leaves its error diagram in the page body; tidy it away.
      document.getElementById(`dcx-flow-${count}`)?.remove();
    }
  }
}

/** Draw flowcharts in an element after it renders. */
export function useFlowcharts(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    if (ref.current) void renderFlowcharts(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
