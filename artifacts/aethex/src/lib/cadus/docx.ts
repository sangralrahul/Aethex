/**
 * Markdown to a Word document (.docx), written in the browser with no library:
 * headings, paragraphs, bold/italic, lists, tables, quotes and code, on A4 with
 * a Cadus footer note, and optionally the user's letterhead (with logo) and a
 * signature block. Opens in Word, Google Docs, LibreOffice and WPS.
 */
import { hasLetterhead, letterheadLines, type Letterhead } from "./letterhead";

/* ------------------------------------------------------------------ zip (store) */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A ZIP archive with stored (uncompressed) entries. */
export function zipStore(files: { name: string; data: Uint8Array }[], date = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const dosTime = ((date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)) & 0xffff;
  const dosDate = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, f.data.length, true);
    lv.setUint32(22, f.data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true);
    cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    locals.push(local, f.data);
    centrals.push(central);
    offset += local.length + f.data.length;
  }
  const cdSize = centrals.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + cdSize + end.length);
  let p = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

/* ------------------------------------------------------------------ xml */

const xml = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface RunStyle { b?: boolean; i?: boolean; code?: boolean; color?: string; size?: number }

function run(text: string, st: RunStyle = {}): string {
  if (!text) return "";
  const props = [
    st.code ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' : "",
    st.b ? "<w:b/>" : "",
    st.i ? "<w:i/>" : "",
    st.color ? `<w:color w:val="${st.color}"/>` : "",
    st.size ? `<w:sz w:val="${st.size}"/><w:szCs w:val="${st.size}"/>` : "",
    st.code ? '<w:sz w:val="19"/><w:shd w:val="clear" w:color="auto" w:fill="F3F4F7"/>' : "",
  ].join("");
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
}

/** Inline markdown (bold, italic, code, links) to runs. */
export function inlineRuns(md: string, base: RunStyle = {}): string {
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let out = "";
  let last = 0;
  for (const m of md.matchAll(re)) {
    const i = m.index ?? 0;
    out += run(md.slice(last, i), base);
    const t = m[0];
    if (t.startsWith("**") || t.startsWith("__")) out += run(t.slice(2, -2), { ...base, b: true });
    else if (t.startsWith("`")) out += run(t.slice(1, -1), { ...base, code: true });
    else if (t.startsWith("[")) {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
      out += lm ? run(`${lm[1]} (${lm[2]})`, base) : run(t, base);
    } else out += run(t.slice(1, -1), { ...base, i: true });
    last = i + t.length;
  }
  return out + run(md.slice(last), base);
}

const para = (inner: string, style?: string, extra = "") =>
  `<w:p>${style || extra ? `<w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}${extra}</w:pPr>` : ""}${inner}</w:p>`;

const splitRow = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

const TEXT_WIDTH = 9638; // A4 width minus 2 cm margins, in twentieths of a point

function table(head: string[], rows: string[][]): string {
  const cols = Math.max(head.length, ...rows.map((r) => r.length), 1);
  const w = Math.floor(TEXT_WIDTH / cols);
  const cell = (text: string, header: boolean) =>
    `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${header ? '<w:shd w:val="clear" w:color="auto" w:fill="F3F4F7"/>' : ""}</w:tcPr>${para(inlineRuns(text, header ? { b: true } : {}), "TableText")}</w:tc>`;
  const tr = (cells: string[], header: boolean) =>
    `<w:tr>${header ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${Array.from({ length: cols }, (_, i) => cell(cells[i] ?? "", header)).join("")}</w:tr>`;
  const border = (side: string) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="D8DCE4"/>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(border).join("")}</w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${Array.from({ length: cols }, () => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${tr(head, true)}${rows.map((r) => tr(r, false)).join("")}</w:tbl>${para("", "Spacer")}`;
}

/** The body of a document: markdown blocks to WordprocessingML. */
export function markdownToWordXml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim().toLowerCase();
      i++;
      if (lang === "mermaid") {
        while (i < lines.length && !/^```/.test(lines[i])) i++;
        i++;
        out.push(para(run("(Flowchart: open the answer in Cadus to view it.)", { i: true, color: "667085" })));
        continue;
      }
      while (i < lines.length && !/^```/.test(lines[i])) out.push(para(run(lines[i++] || " ", { code: true }), "Code"));
      i++;
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      out.push(para(inlineRuns(h[2].replace(/\*\*/g, "")), `Heading${Math.min(3, h[1].length)}`));
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push(para("", undefined, '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="D8DCE4"/></w:pBdr>'));
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
      out.push(table(head, rows));
      continue;
    }
    if (/^>\s?/.test(line)) {
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        const t = lines[i++].replace(/^>\s?/, "");
        if (t.trim()) out.push(para(inlineRuns(t), "Quote"));
      }
      continue;
    }
    const ul = /^(\s*)[-*+•]\s+(.*)$/.exec(line);
    const ol = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const indent = ((ul ?? ol)![1].length >= 2 ? 1 : 0);
      const marker = ul ? "•" : `${ol![2]}.`;
      const text = ul ? ul[2] : ol![3];
      out.push(para(`${run(`${marker}\t`)}${inlineRuns(text)}`, indent ? "ListBullet2" : "ListBullet"));
      i++;
      continue;
    }
    const buf: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*[-*+•]\s+|\s*\d+[.)]\s+)/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && /-{2,}/.test(lines[i + 1]))) {
      buf.push(lines[i++].trim());
    }
    const text = buf.join(" ");
    out.push(para(inlineRuns(text), /^\*\*Bottom line:\*\*/i.test(text) ? "Callout" : undefined));
  }
  return out.join("");
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="1A2233"/><w:lang w:val="en-IN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F1729"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="6" w:color="007A6C"/></w:pBdr><w:spacing w:after="240"/></w:pPr><w:rPr><w:sz w:val="18"/><w:color w:val="667085"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="0F1729"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F1729"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="344054"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs><w:spacing w:after="60"/><w:ind w:left="720" w:hanging="360"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet2"><w:name w:val="List Bullet 2"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="left" w:pos="1440"/></w:tabs><w:spacing w:after="60"/><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="007A6C"/></w:pBdr><w:ind w:left="240"/></w:pPr><w:rPr><w:color w:val="344054"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="007A6C"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="EEF7F5"/><w:spacing w:before="60" w:after="200"/><w:ind w:left="240" w:right="120"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="252" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Spacer"><w:name w:val="Spacer"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60"/></w:pPr><w:rPr><w:sz w:val="8"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="D8DCE4"/></w:pBdr><w:spacing w:before="360"/></w:pPr><w:rPr><w:sz w:val="16"/><w:color w:val="667085"/></w:rPr></w:style>
</w:styles>`;

/* ------------------------------------------------------------------ letterhead */

const EMU_PER_INCH = 914400;

function dataUrlBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** An inline picture for the letterhead logo, at most 0.6 in tall and 1.4 in wide. */
function logoXml(w: number, h: number): string {
  let cy = 0.6 * EMU_PER_INCH;
  let cx = (cy * w) / h;
  if (cx > 1.4 * EMU_PER_INCH) { cx = 1.4 * EMU_PER_INCH; cy = (cx * h) / w; }
  cx = Math.round(cx); cy = Math.round(cy);
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Logo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

/** The letterhead as a borderless table (logo, doctor, hospital) over a teal rule. */
function letterheadXml(l: Letterhead): string {
  const { left, right } = letterheadLines(l);
  const nil = ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="nil"/>`).join("");
  const line = (text: string, first: boolean, align: "left" | "right") =>
    para(run(text, first ? { b: true, size: align === "left" ? 28 : 22, color: "0F1729" } : { size: 18, color: "475467" }), undefined,
      `<w:spacing w:after="0" w:line="252" w:lineRule="auto"/>${align === "right" ? '<w:jc w:val="right"/>' : ""}`);
  const logoW = l.logo ? 1700 : 0;
  const leftW = Math.round((TEXT_WIDTH - logoW) * 0.55);
  const rightW = TEXT_WIDTH - logoW - leftW;
  const cell = (w: number, inner: string) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${inner || para("")}</w:tc>`;
  const cells = [
    l.logo ? cell(logoW, para(logoXml(l.logo.w, l.logo.h), undefined, '<w:spacing w:after="0"/>')) : "",
    cell(leftW, left.map((t, i) => line(t, i === 0, "left")).join("")),
    cell(rightW, right.map((t, i) => line(t, i === 0, "right")).join("")),
  ].join("");
  const grid = [l.logo ? logoW : 0, leftW, rightW].filter(Boolean).map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${TEXT_WIDTH}" w:type="dxa"/><w:tblBorders>${nil}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid><w:tr>${cells}</w:tr></w:tbl>${para("", undefined, '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="007A6C"/></w:pBdr><w:spacing w:after="240"/>')}`;
}

/** Signature, name, qualifications, registration and date, right-aligned at the end. */
function signatureXml(l: Letterhead | null, date: Date): string {
  const lines = [
    l?.name || "",
    l?.qualifications || "",
    l?.registration || "Registration no. ____________",
    `Date: ${date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
  ].filter(Boolean);
  const right = '<w:jc w:val="right"/><w:spacing w:after="0"/>';
  return [
    para("", undefined, '<w:spacing w:before="480" w:after="0"/>'),
    para(run("______________________________"), undefined, right),
    para(run("Signature and seal", { size: 18, color: "667085" }), undefined, right),
    ...lines.map((t, i) => para(run(t, i === 0 && l?.name ? { b: true } : { size: 20 }), undefined, right)),
  ].join("");
}

/** A complete .docx file for a markdown document. */
export function markdownToDocx(
  title: string,
  md: string,
  opts: { subtitle?: string; note?: string; date?: Date; letterhead?: Letterhead | null; signature?: boolean } = {},
): Blob {
  const date = opts.date ?? new Date();
  const enc = new TextEncoder();
  const lh = hasLetterhead(opts.letterhead) ? opts.letterhead : null;
  const body = [
    lh ? letterheadXml(lh) : "",
    para(run(title), "Title"),
    para(run(opts.subtitle ?? `Cadus · ${date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`), "Subtitle"),
    markdownToWordXml(md.replace(/^#\s+.+\n+/, (m) => (m.replace(/^#\s+/, "").trim() === title.trim() ? "" : m))),
    opts.signature ? signatureXml(lh, date) : "",
    para(run(opts.note ?? (opts.signature ? "Draft prepared with Cadus. Check every detail before signing." : "Prepared with Cadus, clinical AI by Aethex. Verify against current guidelines and local protocols before clinical use.")), "Small"),
  ].join("");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const iso = date.toISOString().replace(/\.\d{3}Z$/, "Z");
  const logo = lh?.logo ? { ext: /^data:image\/jpe?g/.test(lh.logo.data) ? "jpg" : "png", bytes: dataUrlBytes(lh.logo.data) } : null;
  const files: [string, string][] = [
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo ? `<Default Extension="${logo.ext}" ContentType="image/${logo.ext === "jpg" ? "jpeg" : "png"}"/>` : ""}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`],
    ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${logo ? `<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.${logo.ext}"/>` : ""}</Relationships>`],
    ["word/document.xml", document],
    ["word/styles.xml", STYLES],
    ["docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(title)}</dc:title><dc:creator>Cadus by Aethex</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified></cp:coreProperties>`],
    ["docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Cadus</Application></Properties>`],
  ];
  const parts: { name: string; data: Uint8Array }[] = files.map(([name, text]) => ({ name, data: enc.encode(text) }));
  if (logo) parts.push({ name: `word/media/logo.${logo.ext}`, data: logo.bytes });
  const zip = zipStore(parts, date);
  return new Blob([zip as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/** A safe file name from a title. */
export function fileSlug(title: string, fallback = "cadus-document"): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || fallback;
}

/** Save a Blob as a download. */
export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
