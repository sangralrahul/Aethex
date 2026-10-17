/**
 * Reference-style answers. The model labels recommendations with the certainty
 * of the evidence ({{evidence:high}} and so on) and writes dose cards as
 * ```dose blocks (see the server prompts). These helpers parse them for the
 * screen, turn them into plain text for copying, speech, PDF and Word, and
 * lift an answer's "Key points" up to sit under its bottom line.
 */

export type EvidenceLevel = "high" | "moderate" | "low" | "expert";

export const EVIDENCE: Record<EvidenceLevel, { label: string; desc: string }> = {
  high: { label: "High certainty", desc: "Consistent evidence from randomised trials or systematic reviews, reflected in major guidelines." },
  moderate: { label: "Moderate certainty", desc: "Good evidence with some limitations; further research could change the estimate." },
  low: { label: "Low certainty", desc: "Limited or inconsistent evidence, such as observational studies or small trials." },
  expert: { label: "Expert opinion", desc: "Consensus or expert opinion without strong trial evidence." },
};

/** {{evidence:high}}, with some tolerance for spacing and case. */
export const EVIDENCE_TAG = /\{\{\s*evidence\s*:\s*(high|moderate|low|expert)\s*\}\}/gi;

/** The plain-text form of a tag, for copying, speech, PDF and Word. */
export function evidenceText(level: string): string {
  const l = level.toLowerCase() as EvidenceLevel;
  return l === "expert" ? "(expert opinion)" : `(${l}-certainty evidence)`;
}

/* ------------------------------------------------------------------ dose cards */

export interface DoseRow {
  key: string;
  label: string;
  value: string;
}

export interface DoseCard {
  drug: string;
  rows: DoseRow[];
}

const LABELS: Record<string, string> = {
  indication: "Indication",
  dose: "Dose",
  route: "Route",
  frequency: "Frequency",
  duration: "Duration",
  max: "Maximum",
  renal: "Kidney impairment",
  hepatic: "Liver impairment",
  children: "Children",
  elderly: "Older adults",
  pregnancy: "Pregnancy",
  lactation: "Breastfeeding",
  contraindications: "Contraindications",
  interactions: "Interactions",
  monitor: "Monitoring",
  india: "In India",
  notes: "Notes",
};
const ORDER = Object.keys(LABELS);
const ALIAS: Record<string, string> = {
  maximum: "max", "max dose": "max", "maximum dose": "max",
  paediatric: "children", pediatric: "children", paediatrics: "children", child: "children",
  "renal adjustment": "renal", kidney: "renal", "hepatic adjustment": "hepatic", liver: "hepatic",
  monitoring: "monitor", availability: "india", "in india": "india", "breastfeeding": "lactation",
  note: "notes", "contraindication": "contraindications", interaction: "interactions", elderly: "elderly",
  "older adults": "elderly", freq: "frequency",
};

/** "Dose (adults): 1 g" or "- max: 4 g/day": a label (letters first, qualifiers allowed) and its value. */
const DOSE_LINE = /^\s*(?:[-*\u2022]\s*)?([A-Za-z][A-Za-z0-9 ()/,&+'.-]{0,40}?)\s*:\s*(.*?)\s*$/;

/**
 * A ```dose block: one "key: value" per line, with a drug name. Null if it isn't
 * one. Nothing is dropped: unknown labels are kept as they are, repeated labels
 * (a renal dose per eGFR band, say) each get a row, a qualifier such as
 * "(children)" stays in the label, and lines without a label continue the row
 * above.
 */
export function parseDoseBlock(src: string): DoseCard | null {
  let drug = "";
  const rows: DoseRow[] = [];
  for (const line of src.replace(/\r/g, "").split("\n")) {
    if (!line.trim()) continue;
    const m = DOSE_LINE.exec(line);
    if (m) {
      const raw = m[1].trim().replace(/\s+/g, " ");
      const value = m[2].trim();
      const lower = raw.toLowerCase();
      if (!drug && (lower === "drug" || lower === "medicine" || lower === "name")) {
        if (value) { drug = value.replace(/^\*\*(.+)\*\*$/, "$1"); continue; }
      }
      // "Dose (adults)": the standard label, with the qualifier kept.
      const q = /^(.*?)\s*(\([^)]*\))?$/.exec(raw)!;
      const base = q[1].toLowerCase();
      const key = ALIAS[base] ?? base;
      const label = LABELS[key] ? `${LABELS[key]}${q[2] ? ` ${q[2]}` : ""}` : raw.charAt(0).toUpperCase() + raw.slice(1);
      rows.push({ key, label, value });
      continue;
    }
    // A line without a label belongs to the row above (or is a note).
    const text = line.replace(/^\s*[-*\u2022]\s*/, "").trim();
    const prev = rows[rows.length - 1];
    if (prev) prev.value = prev.value ? `${prev.value}; ${text}` : text;
    else rows.push({ key: "notes", label: "Notes", value: text });
  }
  const kept = rows.filter((r) => r.value);
  if (!drug || !kept.length) return null;
  const rank = (k: string) => { const i = ORDER.indexOf(k); return i < 0 ? ORDER.length : i; };
  kept.sort((a, b) => rank(a.key) - rank(b.key));
  return { drug: drug.slice(0, 120), rows: kept };
}

/** A dose card as markdown text (a bold name and a list), for copying and Word. */
export function doseMarkdown(card: DoseCard): string {
  return [`**${card.drug}**`, ...card.rows.map((r) => `- ${r.label}: ${r.value}`)].join("\n");
}

const DOSE_FENCE = /```dose[^\S\n]*\n([\s\S]*?)(?:```|$)/gi;
const MERMAID_FENCE = /```mermaid[\s\S]*?(?:```|$)\n*/gi;

/**
 * An answer as plain markdown: dose cards become short lists, evidence tags
 * become words, and flowchart source is left out (the text already says it).
 */
export function referenceToPlain(md: string): string {
  return md
    .replace(MERMAID_FENCE, "")
    .replace(DOSE_FENCE, (whole, body: string) => {
      const card = parseDoseBlock(body);
      return card ? `${doseMarkdown(card)}\n` : whole;
    })
    .replace(EVIDENCE_TAG, (_, l: string) => evidenceText(l))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A dose card as a two-column table, for Word documents. */
export function doseTable(card: DoseCard): string {
  const cell = (s: string) => s.replace(/\|/g, "/");
  return [`| ${cell(card.drug)} | |`, "|---|---|", ...card.rows.map((r) => `| ${cell(r.label)} | ${cell(r.value)} |`)].join("\n");
}

/**
 * An answer for a document (Word): dose cards become tables and evidence tags
 * become words. Flowcharts are left for the document writer, which notes them.
 */
export function referenceForDocument(md: string): string {
  return md
    .replace(DOSE_FENCE, (whole, body: string) => {
      const card = parseDoseBlock(body);
      return card ? `${doseTable(card)}\n` : whole;
    })
    .replace(EVIDENCE_TAG, (_, l: string) => evidenceText(l));
}

/* ------------------------------------------------------------------ key points */

const KEY_POINTS = /^#{2,3}\s*(key points|key takeaways|take-home points|summary of key points)\s*:?\s*$/i;
const LIST_ITEM = /^\s*([-*+\u2022]|\d+[.)])\s+/;
const BOTTOM_LINE = /^\s*\*\*\s*bottom line\b/i;

/**
 * Moves an answer's "Key points" list up to sit under its bottom line, as a
 * :::keypoints block the renderer draws as a card. Only the list moves: the
 * section must start with one, and anything after it (a closing remark, a rule)
 * stays where it was. Answers without one are returned unchanged.
 */
export function liftKeyPoints(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((l) => KEY_POINTS.test(l.trim()));
  if (start < 0) return md;
  let i = start + 1;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i >= lines.length || !LIST_ITEM.test(lines[i])) return md;
  const first = i;
  let end = i;
  // The list: its items, indented continuation lines and blank lines between items.
  while (i < lines.length) {
    const l = lines[i];
    if (LIST_ITEM.test(l) || /^\s{2,}\S/.test(l)) { end = ++i; continue; }
    if (!l.trim()) {
      let j = i;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && LIST_ITEM.test(lines[j])) { i = j; continue; }
    }
    break;
  }
  const body = lines.slice(first, end).join("\n").trim();
  const rest = [...lines.slice(0, start), ...lines.slice(end)].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const card = `:::keypoints\n${body}\n:::`;
  // Under the bottom line when the answer opens with one (after a title, if any).
  const restLines = rest.split("\n");
  let at = 0;
  if (/^#\s/.test(restLines[0] ?? "")) { at = 1; while (at < restLines.length && !restLines[at].trim()) at++; }
  if (BOTTOM_LINE.test(restLines[at] ?? "")) {
    while (at < restLines.length && restLines[at].trim()) at++;
  } else if (at === 0) {
    return `${card}\n\n${rest}`;
  }
  const head = restLines.slice(0, at).join("\n").trim();
  const tail = restLines.slice(at).join("\n").trim();
  return tail ? `${head}\n\n${card}\n\n${tail}` : `${head}\n\n${card}`;
}
