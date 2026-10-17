/**
 * Letterhead: the doctor's or hospital's details at the top of exported and
 * printed documents (Word, PDF, print), with a signature block on letters,
 * certificates and prescriptions. Kept on this device only.
 */

export interface LetterheadLogo {
  /** PNG or JPEG data URL. */
  data: string;
  w: number;
  h: number;
}

export interface Letterhead {
  enabled: boolean;
  name: string;
  qualifications: string;
  designation: string;
  /** e.g. "Reg. No. 12345, Delhi Medical Council" */
  registration: string;
  hospital: string;
  address: string;
  phone: string;
  email: string;
  logo?: LetterheadLogo;
}

export const LETTERHEAD_KEY = "cadus3.letterhead";

export const EMPTY_LETTERHEAD: Letterhead = {
  enabled: true, name: "", qualifications: "", designation: "", registration: "", hospital: "", address: "", phone: "", email: "",
};

const MAX = { name: 80, qualifications: 120, designation: 100, registration: 120, hospital: 120, address: 200, phone: 60, email: 100 } as const;

export function cleanLetterhead(raw: unknown): Letterhead {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (k: keyof typeof MAX) => (typeof r[k] === "string" ? (r[k] as string).replace(/[\r\n]+/g, " ").slice(0, MAX[k]) : "");
  const logo = r.logo as LetterheadLogo | undefined;
  return {
    enabled: r.enabled !== false,
    name: str("name"),
    qualifications: str("qualifications"),
    designation: str("designation"),
    registration: str("registration"),
    hospital: str("hospital"),
    address: str("address"),
    phone: str("phone"),
    email: str("email"),
    ...(logo && typeof logo.data === "string" && /^data:image\/(png|jpe?g);base64,/.test(logo.data) && logo.w > 0 && logo.h > 0
      ? { logo: { data: logo.data, w: Number(logo.w), h: Number(logo.h) } }
      : {}),
  };
}

export function readLetterhead(): Letterhead {
  try {
    return cleanLetterhead(JSON.parse(localStorage.getItem(LETTERHEAD_KEY) || "null"));
  } catch {
    return { ...EMPTY_LETTERHEAD };
  }
}

export function saveLetterhead(l: Letterhead) {
  try {
    localStorage.setItem(LETTERHEAD_KEY, JSON.stringify(l));
  } catch { /* storage full (a large logo) */ }
}

/** Whether there is anything to print. */
export const hasLetterhead = (l?: Letterhead | null): l is Letterhead =>
  !!l && l.enabled && !!(l.name.trim() || l.hospital.trim());

/** The lines of the letterhead: the doctor on the left, the hospital on the right. */
export function letterheadLines(l: Letterhead): { left: string[]; right: string[] } {
  const left = [l.name, l.qualifications, l.designation, l.registration].map((x) => x.trim()).filter(Boolean);
  const contact = [l.phone.trim() && `Tel: ${l.phone.trim()}`, l.email.trim()].filter(Boolean).join(" · ");
  const right = [l.hospital, l.address].map((x) => x.trim()).filter(Boolean);
  if (contact) right.push(contact);
  return { left, right };
}

/** Documents that need the doctor's signature at the end. */
export const SIGNED_MODES = new Set(["referral", "discharge", "certificate", "rx", "death", "opnote", "admission"]);

/** A logo file as a small PNG/JPEG data URL (at most 600 px wide) with its size. */
export async function readLogo(file: File): Promise<LetterheadLogo> {
  if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) throw new Error("Use a PNG or JPEG image for the logo.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That image couldn't be read."));
      i.src = url;
    });
    const scale = Math.min(1, 600 / Math.max(img.width || 1, img.height || 1));
    const w = Math.max(1, Math.round((img.width || 300) * scale));
    const h = Math.max(1, Math.round((img.height || 100) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return { data: canvas.toDataURL("image/png"), w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------------------ printing */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A complete HTML page for printing a document: letterhead, title, the body
 * (already rendered markdown), an optional signature block and a footer.
 * `large` sets a bigger type size for patient handouts.
 */
export function printPage(opts: {
  title: string;
  bodyHtml: string;
  letterhead?: Letterhead | null;
  signature?: boolean;
  large?: boolean;
  /** Landscape pages, for wide tables such as a ward handover sheet. */
  landscape?: boolean;
  footer?: string;
  date?: Date;
}): string {
  const l = hasLetterhead(opts.letterhead) ? opts.letterhead : null;
  const lines = l ? letterheadLines(l) : null;
  const date = (opts.date ?? new Date()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const head = l && lines
    ? `<header class="lh">${l.logo ? `<img class="logo" src="${l.logo.data}" alt="">` : ""}<div class="lh-l">${lines.left.map((x, i) => (i === 0 ? `<b>${esc(x)}</b>` : `<span>${esc(x)}</span>`)).join("")}</div><div class="lh-r">${lines.right.map((x, i) => (i === 0 ? `<b>${esc(x)}</b>` : `<span>${esc(x)}</span>`)).join("")}</div></header>`
    : "";
  const sign = opts.signature
    ? `<div class="sign"><div><span class="ln"></span><b>${esc(l?.name || "Signature")}</b>${l?.qualifications ? `<span>${esc(l.qualifications)}</span>` : ""}${l?.registration ? `<span>${esc(l.registration)}</span>` : "<span>Registration no. ____________</span>"}<span>Date: ${esc(date)}</span></div></div>`
    : "";
  const size = opts.large ? 15.5 : 11.5;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(opts.title)}</title><style>
@page{size:A4${opts.landscape ? " landscape" : ""};margin:${opts.landscape ? "12mm 12mm 14mm" : "16mm 16mm 18mm"}}
*{box-sizing:border-box}
body{margin:0;font:${size}pt/1.5 "Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.lh{display:flex;align-items:center;gap:14px;padding-bottom:10px;margin-bottom:14px;border-bottom:2px solid #007A6C}
.logo{max-height:56px;max-width:140px;object-fit:contain}
.lh-l,.lh-r{display:flex;flex-direction:column;font-size:9.5pt;line-height:1.35;color:#374151}
.lh-l{flex:1}.lh-r{text-align:right;max-width:46%}
.lh b{font-size:13pt;color:#0F1729}
.lh-r b{font-size:11pt}
h1.t{font-size:${opts.large ? 22 : 16}pt;margin:4px 0 2px}
.meta{font-size:9pt;color:#6B7280;margin-bottom:14px}
h2{font-size:${opts.large ? 17 : 13}pt;margin:16px 0 6px;color:#0F1729}
h3,h4{font-size:${opts.large ? 15.5 : 11.5}pt;margin:12px 0 4px}
p{margin:0 0 8px}ul,ol{margin:0 0 8px;padding-left:22px}li{margin:2px 0}
table{width:100%;border-collapse:collapse;margin:6px 0 12px;font-size:${opts.large ? 13 : 10}pt}
th,td{border:1px solid #D1D5DB;padding:5px 7px;text-align:left;vertical-align:top}th{background:#F3F4F6}
blockquote,.md-bl{margin:6px 0 12px;padding:8px 12px;border-left:3px solid #007A6C;background:#F0F7F6}
code{font-family:Consolas,monospace;font-size:.9em}pre{white-space:pre-wrap;font-size:9pt}
sup.md-cite{font-size:.75em;color:#007A6C}
.md-copy,.md-mermaid-src{display:none}
.md-mermaid{margin:8px 0 14px;break-inside:avoid}
.md-mermaid:not([data-state="done"]) .md-mermaid-src{display:block;margin:0;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font:9pt/1.45 Consolas,monospace;white-space:pre-wrap}
.md-mermaid svg{display:block;max-width:100%;height:auto;margin:0 auto}
ol.src{font-size:9pt;color:#374151;padding-left:20px}
ol.src span{color:#6B7280;word-break:break-all}
.sign{display:flex;justify-content:flex-end;margin-top:36px;break-inside:avoid}
.sign div{display:flex;flex-direction:column;align-items:flex-start;min-width:230px;font-size:10pt;color:#374151}
.sign .ln{display:block;width:100%;border-top:1px solid #111827;margin-bottom:6px}
.sign b{color:#111827}
footer{margin-top:24px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:8pt;color:#6B7280}
</style></head><body>${head}<h1 class="t">${esc(opts.title)}</h1><div class="meta">${esc(date)}</div><main>${opts.bodyHtml}</main>${sign}<footer>${esc(opts.footer ?? (opts.signature ? "Draft prepared with Cadus. Check every detail before signing." : "Prepared with Cadus, clinical AI by Aethex. Verify against current guidelines and local protocols before clinical use."))}</footer></body></html>`;
}

/** Print an HTML page through a hidden frame (no pop-up window). */
export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) { frame.remove(); return; }
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => frame.remove(), 1500);
    }
  };
  // Give images (the logo) a moment to load.
  if (doc.readyState === "complete") window.setTimeout(go, 150);
  else frame.onload = () => window.setTimeout(go, 150);
}
