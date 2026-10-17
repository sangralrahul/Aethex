/**
 * Tiny, dependency-free markdown → HTML renderer for Cadus replies.
 * All text is HTML-escaped first, so model output can never inject markup.
 * Supports headings, bold/italic, inline + fenced code, lists, tables,
 * blockquotes, horizontal rules and http(s) links. A ```mermaid block becomes a
 * placeholder holding the (escaped) source, which the page draws as a flowchart.
 * Reference extras: {{evidence:high}} tags become evidence-certainty labels, a
 * ```dose block becomes a dose card, and a :::keypoints block becomes a card.
 */
import { EVIDENCE, EVIDENCE_TAG, parseDoseBlock, referenceToPlain, type EvidenceLevel } from "./cadus/reference";

/** Headings for sections a clinician must not miss, and for cautions. */
const ALERT_HEAD = /\b(red flags?|warning signs?|danger signs?|when to (?:refer|escalate|seek help|admit)|emergency|urgent referral|seek (?:urgent|immediate) (?:care|help))\b/i;
const CAUTION_HEAD = /\b(contraindications?|cautions?|precautions|interactions to (?:watch|avoid)|what to avoid|safety netting)\b/i;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(raw: string): string {
  const codes: string[] = [];
  let s = raw.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${esc(c)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s(){}]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  s = s.replace(EVIDENCE_TAG, (_, l: string) => {
    const e = EVIDENCE[l.toLowerCase() as EvidenceLevel];
    return `<span class="md-ev md-ev-${l.toLowerCase()}" title="${esc(`${e.label}: ${e.desc}`)}">${e.label}</span>`;
  });
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
  return s;
}

/** A dose card: the drug, then labelled rows (dose, route, maximum, adjustments...). */
function doseCard(src: string): string | null {
  const card = parseDoseBlock(src);
  if (!card) return null;
  const rows = card.rows.map((r) => `<div class="md-dose-r k-${r.key.replace(/[^a-z]+/g, "-")}"><dt>${esc(r.label)}</dt><dd>${inline(r.value)}</dd></div>`).join("");
  return `<div class="md-dose" role="group" aria-label="${esc(`Dose card: ${card.drug}`)}"><div class="md-dose-h"><span class="md-dose-tag">Dose card</span><b>${inline(card.drug)}</b></div><dl>${rows}</dl></div>`;
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

export interface RenderOptions {
  /** Number of cited sources; [n] markers up to this number become citation badges. */
  cites?: number;
  /** Add "Copy" buttons to tables and code blocks (handled by the page). */
  copy?: boolean;
}

const COPY_BTN = (what: string) =>
  `<button type="button" class="md-copy" data-copy="${what}" aria-label="Copy ${what}">Copy</button>`;

export function renderMarkdown(md: string, opts: RenderOptions = {}, nested = false): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // :::keypoints containers (an answer's key points, lifted under its bottom line)
    const box = /^:::\s*([a-z]+)\s*$/i.exec(line.trim());
    if (box) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") buf.push(lines[i++]);
      i++;
      const inner = renderMarkdown(buf.join("\n"), { ...opts, copy: false }, true);
      out.push(box[1].toLowerCase() === "keypoints" ? `<section class="md-kp" aria-label="Key points"><p class="md-kp-h">Key points</p>${inner}</section>` : inner);
      continue;
    }

    // fenced code
    const fence = /^```\s*([\w-]*)/.exec(line);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      if (fence[1].toLowerCase() === "dose") {
        const card = doseCard(buf.join("\n"));
        if (card) { out.push(card); continue; }
      }
      if (fence[1].toLowerCase() === "mermaid") {
        out.push(`<div class="md-mermaid" data-state="new"><pre class="md-mermaid-src">${esc(buf.join("\n"))}</pre><div class="md-mermaid-fig" role="img" aria-label="Flowchart"></div></div>`);
        continue;
      }
      out.push(
        opts.copy
          ? `<div class="md-code">${COPY_BTN("code")}<pre><code>${esc(buf.join("\n"))}</code></pre></div>`
          : `<pre><code>${esc(buf.join("\n"))}</code></pre>`,
      );
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = Math.min(4, h[1].length + 1);
      const plain = h[2].replace(/[*_`#]/g, "");
      const kind = ALERT_HEAD.test(plain) ? "alert" : CAUTION_HEAD.test(plain) ? "caution" : "";
      out.push(kind ? `<h${lvl} class="md-h md-h-${kind}">${inline(h[2])}</h${lvl}>` : `<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push("<hr/>"); i++; continue; }

    // table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
      // Each cell carries its column name, so wide tables can stack into cards on a phone.
      const labels = head.map((c) => esc(c.replace(/[*_`]/g, "").trim()));
      out.push(
        `${opts.copy ? `<div class="md-tablewrap">${COPY_BTN("table")}` : ""}<div class="md-table${head.length >= 4 ? " wide" : ""}"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c, k) => `<td data-label="${labels[k] ?? ""}">${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>${opts.copy ? "</div>" : ""}`,
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${renderMarkdown(buf.join("\n"), opts, true)}</blockquote>`);
      continue;
    }

    const isUl = /^\s*[-*+•]\s+/.test(line);
    const isOl = /^\s*\d+[.)]\s+/.test(line);
    if (isUl || isOl) {
      const tag = isUl ? "ul" : "ol";
      const re = isUl ? /^\s*[-*+•]\s+/ : /^\s*\d+[.)]\s+/;
      const items: string[] = [];
      while (i < lines.length && (re.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (re.test(lines[i])) items.push(lines[i].replace(re, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${tag}>`);
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|:::|>|\s*[-*+•]\s+|\s*\d+[.)]\s+)/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /-{2,}/.test(lines[i + 1]) && lines[i + 1].includes("|"))
    ) buf.push(lines[i++]);
    out.push(`<p>${buf.map(inline).join("<br/>")}</p>`);
  }
  // Red-flag and caution sections are grouped so they can be set apart.
  const blocks: string[] = [];
  for (let k = 0; k < out.length; k++) {
    const m = /^<h([2-4]) class="md-h md-h-(alert|caution)">/.exec(out[k]);
    if (!m) { blocks.push(out[k]); continue; }
    const parts = [out[k]];
    while (k + 1 < out.length) {
      const next = /^<h([2-4])[ >]/.exec(out[k + 1]);
      if (next && Number(next[1]) <= Number(m[1])) break;
      parts.push(out[++k]);
    }
    blocks.push(`<section class="md-sec md-sec-${m[2]}">${parts.join("")}</section>`);
  }
  let html = blocks.join("");
  const max = opts.cites ?? 0;
  if (max > 0) {
    // Only in text: a marker inside an attribute (a dose card's label, say) is left alone.
    html = html.replace(/(<[^>]*>)|\[(\d{1,2})\](?!\()/g, (m, tag: string | undefined, n: string) => {
      if (tag) return tag;
      const k = Number(n);
      return k >= 1 && k <= max ? `<sup class="md-cite" data-n="${k}" role="button" tabindex="0" aria-label="Source ${k}">${k}</sup>` : m;
    });
  }
  if (!nested) html = html.replace(/^((?:<h[2-4]>(?:(?!<\/h[2-4]>).)*<\/h[2-4]>)?)<p>(?=<strong>\s*Bottom line\b)/i, '$1<p class="md-bl">');
  return html;
}

/** Strip markdown to readable plain text (for copy-as-text / PDF). */
export function markdownToText(md: string): string {
  return referenceToPlain(md)
    .replace(/^:::.*$/gm, "")
    .replace(/```mermaid[\s\S]*?(```|$)/gi, "")
    .replace(/```[\w-]*\n?/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*\|?\s*:?-{2,}.*$/gm, "")
    .replace(/\|/g, "  ")
    .trim();
}
