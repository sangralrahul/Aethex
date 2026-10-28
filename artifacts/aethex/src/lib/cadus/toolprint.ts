/**
 * Branded PDF of any tool (update 50): a snapshot of the tool page as it stands — the answers
 * entered, the ticked boxes and the result — printed on the user's letterhead through the
 * browser's print dialog (which can save a PDF). Unticked options, buttons and inputs are left out.
 */
import { printHtml, printPage, readLetterhead } from "./letterhead";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The tool page as clean, printable HTML. */
export function snapshotTool(page: HTMLElement): { title: string; html: string } {
  const title = (page.querySelector("h1")?.textContent || document.title || "Cadus tool").trim();
  const live = Array.from(page.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
  const copy = page.cloneNode(true) as HTMLElement;
  const ghosts = Array.from(copy.querySelectorAll<HTMLElement>("input, select, textarea"));
  ghosts.forEach((g, i) => {
    const el = live[i];
    if (!el) { g.remove(); return; }
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      const label = g.closest("label");
      if (!el.checked) { (label ?? g).remove(); return; }
      const mark = document.createElement("span");
      mark.textContent = "✓ ";
      g.replaceWith(mark);
      label?.classList.add("tick");
      return;
    }
    let value = "";
    if (el instanceof HTMLSelectElement) value = el.selectedOptions[0]?.textContent?.trim() || "";
    else value = el.value.trim();
    const field = g.closest(".cx-field");
    if (!value || value === "Choose…") { (field ?? g).remove(); return; }
    const out = document.createElement("b");
    out.textContent = value;
    g.replaceWith(out);
  });
  copy.querySelectorAll("button, [role=tablist], [role=radiogroup] button, header.cx-page-h p, .cx-trust, .cx-lazy, svg, script, style").forEach((n) => n.remove());
  copy.querySelectorAll("fieldset").forEach((f) => { if (!f.querySelector(".tick, b")) f.remove(); });
  copy.querySelectorAll(".cx-imaging-ticks").forEach((d) => { if (!d.textContent?.trim()) d.remove(); });
  copy.querySelector("header.cx-page-h")?.remove();
  copy.querySelectorAll("[class]").forEach((n) => {
    const keep = (n as HTMLElement).classList.contains("tick") ? "tick" : (n as HTMLElement).classList.contains("cx-cmp-out") ? "plan" : (n as HTMLElement).classList.contains("cx-rs-foot") ? "srcs" : "";
    if (keep) n.setAttribute("class", keep); else n.removeAttribute("class");
  });
  copy.querySelectorAll("*").forEach((n) => { for (const a of Array.from(n.attributes)) if (a.name !== "class") n.removeAttribute(a.name); });
  const style = "<style>.tick{display:block;margin:1px 0}.plan{margin:10px 0;padding:8px 12px;border:1px solid #D1D5DB;border-left:3px solid #007A6C;border-radius:6px;background:#F9FAFB}.srcs{font-size:9pt;color:#6B7280;margin-top:12px}fieldset{border:0;margin:6px 0;padding:0}legend{font-weight:700;margin-bottom:2px}label{display:block;margin:2px 0}</style>";
  return { title, html: style + copy.innerHTML };
}

/** Print the tool page on the letterhead. Returns false when there was nothing to print. */
export function printTool(page: HTMLElement | null, note?: string): boolean {
  if (!page) return false;
  const { title, html } = snapshotTool(page);
  printHtml(printPage({
    title,
    bodyHtml: html + (note ? `<p><i>${esc(note)}</i></p>` : ""),
    letterhead: readLetterhead(),
    footer: "Prepared with Cadus clinical decision support by Aethex. Not a substitute for clinical judgement — verify against current guidelines and local protocols.",
  }));
  return true;
}
