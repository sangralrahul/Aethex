/**
 * Tiny, dependency-free markdown → HTML renderer for Cadus replies.
 * All text is HTML-escaped first, so model output can never inject markup.
 * Supports headings, bold/italic, inline + fenced code, lists, tables,
 * blockquotes, horizontal rules and http(s) links. A ```mermaid block becomes a
 * placeholder holding the (escaped) source, which the page draws as a flowchart.
 */

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
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
  return s;
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

    // fenced code
    const fence = /^```\s*([\w-]*)/.exec(line);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
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
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
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
      out.push(
        `${opts.copy ? `<div class="md-tablewrap">${COPY_BTN("table")}` : ""}<div class="md-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
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
      !/^(#{1,6}\s|```|>|\s*[-*+•]\s+|\s*\d+[.)]\s+)/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /-{2,}/.test(lines[i + 1]) && lines[i + 1].includes("|"))
    ) buf.push(lines[i++]);
    out.push(`<p>${buf.map(inline).join("<br/>")}</p>`);
  }
  let html = out.join("");
  const max = opts.cites ?? 0;
  if (max > 0) {
    html = html.replace(/\[(\d{1,2})\](?!\()/g, (m, n) => {
      const k = Number(n);
      return k >= 1 && k <= max ? `<sup class="md-cite">${k}</sup>` : m;
    });
  }
  if (!nested) html = html.replace(/^<p><strong>Bottom line:<\/strong>/, '<p class="md-bl"><strong>Bottom line:</strong>');
  return html;
}

/** Strip markdown to readable plain text (for copy-as-text / PDF). */
export function markdownToText(md: string): string {
  return md
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
