/**
 * Lab trends: paste serial results (from a lab report, Excel or ward notes) and
 * see each test over time against its usual adult reference range. Parsing and
 * charting happen in the browser; no AI is involved.
 */

export interface Analyte {
  id: string;
  name: string;
  unit: string;
  /** Usual adult reference range (laboratories differ). */
  low?: number;
  high?: number;
  /** Names it goes by on Indian lab reports and in ward notes. */
  aliases: RegExp;
  /** Values above this look like a different unit (e.g. platelets per µL instead of lakhs). */
  note?: string;
}

const A = (id: string, name: string, unit: string, low: number | undefined, high: number | undefined, aliases: RegExp, note?: string): Analyte =>
  ({ id, name, unit, low, high, aliases, ...(note ? { note } : {}) });

/** Common tests with the conventional units of Indian laboratories. */
export const ANALYTES: Analyte[] = [
  A("hb", "Haemoglobin", "g/dL", 12, 16.5, /^(hb|hgb|haemoglobin|hemoglobin)$/i, "Usual range: men 13 to 17, women 12 to 15 g/dL"),
  A("wbc", "Total leucocyte count", "/µL", 4000, 11000, /^(tlc|wbc|wbcs?|total leu[ck]ocyte count|total wbc|leu[ck]ocytes|tc)$/i),
  A("plt", "Platelets", "lakh/µL", 1.5, 4.5, /^(plt|plts|platelets?|platelet count)$/i, "Entered as lakh/µL; counts like 150000 are converted"),
  A("hct", "Haematocrit (PCV)", "%", 36, 50, /^(hct|pcv|haematocrit|hematocrit)$/i),
  A("na", "Sodium", "mmol/L", 135, 145, /^(na|na\+|sodium|s\.? ?na)$/i),
  A("k", "Potassium", "mmol/L", 3.5, 5.0, /^(k|k\+|potassium|s\.? ?k)$/i),
  A("cl", "Chloride", "mmol/L", 98, 107, /^(cl|cl-|chloride)$/i),
  A("hco3", "Bicarbonate", "mmol/L", 22, 29, /^(hco3|hco3-|bicarb|bicarbonate|tco2)$/i),
  A("urea", "Blood urea", "mg/dL", 15, 40, /^(urea|b\.? ?urea|blood urea|s\.? ?urea)$/i),
  A("bun", "BUN", "mg/dL", 7, 20, /^(bun|blood urea nitrogen)$/i),
  A("cr", "Creatinine", "mg/dL", 0.6, 1.2, /^(cr|creat|creatinine|s\.? ?cr|s\.? ?creat|scr|serum creatinine)$/i),
  A("tbil", "Total bilirubin", "mg/dL", 0.2, 1.2, /^(t\.? ?bil|tbil|bilirubin|total bilirubin|s\.? ?bili|bili|t\.? ?bili)$/i),
  A("dbil", "Direct bilirubin", "mg/dL", 0, 0.3, /^(d\.? ?bil|dbil|direct bilirubin|conjugated bilirubin|d\.? ?bili)$/i),
  A("alt", "ALT (SGPT)", "U/L", 7, 40, /^(alt|sgpt|alanine aminotransferase)$/i),
  A("ast", "AST (SGOT)", "U/L", 8, 40, /^(ast|sgot|aspartate aminotransferase)$/i),
  A("alp", "Alkaline phosphatase", "U/L", 44, 147, /^(alp|alk phos|alkaline phosphatase|sap)$/i),
  A("alb", "Albumin", "g/dL", 3.5, 5.0, /^(alb|albumin|s\.? ?alb)$/i),
  A("inr", "INR", "", 0.8, 1.2, /^(inr|pt-?inr|pt\/inr)$/i),
  A("crp", "CRP", "mg/L", 0, 5, /^(crp|c-reactive protein|hs-?crp)$/i),
  A("pct", "Procalcitonin", "ng/mL", 0, 0.5, /^(pct|procalcitonin)$/i),
  A("esr", "ESR", "mm/h", 0, 20, /^(esr)$/i),
  A("glu", "Glucose", "mg/dL", 70, 140, /^(glucose|glu|rbs|fbs|grbs|cbg|sugar|blood sugar|blood glucose|ppbs)$/i, "Usual fasting range 70 to 99 mg/dL"),
  A("hba1c", "HbA1c", "%", 4, 5.6, /^(hba1c|a1c|glycated haemoglobin|glycosylated hemoglobin)$/i),
  A("lact", "Lactate", "mmol/L", 0.5, 2, /^(lactate|lac|s\.? ?lactate)$/i),
  A("ca", "Calcium", "mg/dL", 8.5, 10.5, /^(ca|calcium|s\.? ?ca|ca2\+)$/i),
  A("mg", "Magnesium", "mg/dL", 1.7, 2.4, /^(mg|magnesium|s\.? ?mg)$/i),
  A("po4", "Phosphate", "mg/dL", 2.5, 4.5, /^(po4|phos|phosphorus|phosphate)$/i),
  A("ua", "Uric acid", "mg/dL", 3.5, 7.2, /^(ua|uric acid|s\.? ?uric acid)$/i),
  A("tsh", "TSH", "mIU/L", 0.4, 4.0, /^(tsh)$/i),
  A("ferritin", "Ferritin", "ng/mL", 30, 300, /^(ferritin|s\.? ?ferritin)$/i),
  A("trop", "Troponin I (hs)", "ng/L", 0, 26, /^(trop|troponin|trop i|hs-?trop(onin)? ?i?|ctni)$/i, "The cut-off depends on the assay: use your laboratory's 99th percentile"),
  A("ph", "pH", "", 7.35, 7.45, /^(ph)$/i),
  A("pco2", "pCO₂", "mmHg", 35, 45, /^(pco2|paco2)$/i),
  A("po2", "pO₂", "mmHg", 80, 100, /^(po2|pao2)$/i),
  A("spo2", "SpO₂", "%", 94, 100, /^(spo2|sats|o2 sat|saturation)$/i),
  A("temp", "Temperature", "°F", 97, 99.5, /^(temp|temperature|t)$/i),
  A("hr", "Heart rate", "/min", 60, 100, /^(hr|pr|pulse|heart rate)$/i),
  A("sbp", "Systolic BP", "mmHg", 100, 140, /^(sbp|systolic|sys bp)$/i),
  A("uo", "Urine output", "mL", undefined, undefined, /^(uo|urine output|u\/o)$/i),
];

const BY_ID = Object.fromEntries(ANALYTES.map((a) => [a.id, a])) as Record<string, Analyte>;

/** The analyte for a name on a report ("SGPT", "S. Creatinine", "Hb%"...). */
export function matchAnalyte(raw: string): Analyte | null {
  const name = raw
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(serum|plasma|blood|level|levels|value)\b/gi, (w) => (/^blood$/i.test(w) ? w : ""))
    .replace(/[:=%]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return null;
  return ANALYTES.find((a) => a.aliases.test(name)) ?? ANALYTES.find((a) => a.aliases.test(name.replace(/^s\.?\s*/i, ""))) ?? null;
}

export interface Series {
  id: string;
  name: string;
  unit: string;
  low?: number;
  high?: number;
  note?: string;
  values: (number | null)[];
}

export interface LabTable {
  /** Column labels: dates or days, in time order. */
  points: string[];
  series: Series[];
  /** Names that weren't recognised. */
  unknown: string[];
}

/** "14,500" and "1.5 lakh" style numbers; null for text such as "NR". */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/^[<>≤≥~]\s*/, "");
  if (!/^-?\d[\d,]*(\.\d+)?$/.test(s)) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Store values in each test's chart unit when another common unit was used. */
export function normalise(a: Analyte, n: number): number {
  switch (a.id) {
    case "plt":
      if (n > 1000) return r2(n / 100000); // per µL to lakh/µL
      if (n >= 20) return r2(n / 100); // ×10³/µL to lakh/µL
      return n;
    case "wbc":
      return n < 200 ? Math.round(n * 1000) : n; // ×10³/µL to /µL
    case "hb":
      return n > 25 ? r2(n / 10) : n; // g/L to g/dL
    case "cr":
      return n > 25 ? r2(n / 88.4) : n; // µmol/L to mg/dL
    case "temp":
      return n < 45 ? Math.round((n * 9 / 5 + 32) * 10) / 10 : n; // °C to °F
    default:
      return n;
  }
}

const isPointLabel = (s: string) =>
  /^(day|d|pod|hd)\s*-?\s*\d+$/i.test(s.trim()) || /^\d{1,2}[/.-]\d{1,2}([/.-]\d{2,4})?$/.test(s.trim()) || /^\d{1,2}\s+[a-z]{3}/i.test(s.trim()) ||
  /^(admission|adm|baseline|discharge|today|yesterday|pre-?op|post-?op)$/i.test(s.trim()) || /^\d{4}-\d{2}-\d{2}$/.test(s.trim());

function build(points: string[], rows: { analyte: Analyte; values: (number | null)[] }[], unknown: string[]): LabTable {
  const merged = new Map<string, (number | null)[]>();
  for (const r of rows) {
    const cur = merged.get(r.analyte.id) ?? Array(points.length).fill(null);
    r.values.forEach((v, i) => { if (v !== null && i < points.length) cur[i] = normalise(r.analyte, v); });
    merged.set(r.analyte.id, cur);
  }
  const series: Series[] = [...merged.entries()]
    .filter(([, vals]) => vals.some((v) => v !== null))
    .map(([id, values]) => {
      const a = BY_ID[id];
      return { id, name: a.name, unit: a.unit, low: a.low, high: a.high, ...(a.note ? { note: a.note } : {}), values };
    });
  // Keep the order of ANALYTES so related tests sit together.
  series.sort((x, y) => ANALYTES.findIndex((a) => a.id === x.id) - ANALYTES.findIndex((a) => a.id === y.id));
  return { points, series, unknown: [...new Set(unknown)].slice(0, 12) };
}

/** Parse pasted results in any of three layouts (see LAB_EXAMPLE). */
export function parseLabText(text: string): LabTable {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
  if (!lines.length) return { points: [], series: [], unknown: [] };
  const delim = lines.some((l) => l.includes("\t")) ? "\t" : lines.filter((l) => l.includes(" | ") || /^\|/.test(l)).length > 1 ? "|" : null;

  if (delim) {
    const grid = lines
      .map((l) => (delim === "|" ? l.replace(/^\s*\||\|\s*$/g, "") : l).split(delim).map((c) => c.trim()))
      .filter((row) => !row.every((c) => /^:?-{2,}:?$/.test(c) || !c));
    const head = grid[0] ?? [];
    const rest = grid.slice(1);
    const headTests = head.slice(1).map(matchAnalyte);
    // Tests across the top, one row per date
    if (headTests.filter(Boolean).length >= Math.max(1, Math.ceil((head.length - 1) / 2))) {
      const points = rest.map((r, i) => r[0] || `#${i + 1}`);
      const rows = headTests.flatMap((a, j) => (a ? [{ analyte: a, values: rest.map((r) => parseNumber(r[j + 1] ?? "")) }] : []));
      return build(points, rows, head.slice(1).filter((_, j) => !headTests[j]));
    }
    // Dates across the top, one row per test
    const points = head.slice(1).map((p, i) => p || `#${i + 1}`);
    const unknown: string[] = [];
    const rows = rest.flatMap((r) => {
      const a = matchAnalyte(r[0] ?? "");
      if (!a) { if (r[0]) unknown.push(r[0]); return []; }
      return [{ analyte: a, values: points.map((_, i) => parseNumber(r[i + 1] ?? "")) }];
    });
    return build(points, rows, unknown);
  }

  // Free text: one line per date, e.g. "12/10: Hb 8.2, TLC 14,500, Cr 2.1"
  const points: string[] = [];
  const rows: { analyte: Analyte; values: (number | null)[] }[] = [];
  const unknown: string[] = [];
  const perPoint: Map<string, number>[] = [];
  for (const line of lines) {
    let label = "";
    let body = line;
    const m = /^\s*([^:]{1,24}?)\s*(?::|–|—|-\s)\s*(.+)$/.exec(line);
    if (m && isPointLabel(m[1])) { label = m[1].trim(); body = m[2]; }
    else {
      const first = /^\s*(\S+(?:\s+\d+)?)\s+(.+)$/.exec(line);
      if (first && isPointLabel(first[1])) { label = first[1]; body = first[2]; }
    }
    const values = new Map<string, number>();
    // A name, then ":", "=" or a space, then the value ("HbA1c 7.2" keeps its digits in the name).
    const re = /([A-Za-z][A-Za-z0-9.+\-/ ]*?)(?:\s*[:=]\s*|\s+)([<>]?\s*-?\d[\d,]*(?:\.\d+)?)(?![\d.])/g;
    let pm: RegExpExecArray | null;
    while ((pm = re.exec(body))) {
      const name = pm[1].replace(/^(and|with|of)\s+/i, "").trim();
      const a = matchAnalyte(name);
      const n = parseNumber(pm[2].replace(/\s+/g, ""));
      if (!a) { if (name.length <= 24 && !/^(day|d)$/i.test(name)) unknown.push(name); continue; }
      if (n !== null) values.set(a.id, n);
    }
    if (!values.size) continue;
    points.push(label || `#${points.length + 1}`);
    perPoint.push(values);
  }
  const ids = [...new Set(perPoint.flatMap((m) => [...m.keys()]))];
  for (const id of ids) rows.push({ analyte: BY_ID[id], values: perPoint.map((m) => m.get(id) ?? null) });
  return build(points, rows, unknown);
}

export type Flag = "low" | "high" | "normal" | "none";

export function flag(s: Series, v: number | null): Flag {
  if (v === null) return "none";
  if (s.low !== undefined && v < s.low) return "low";
  if (s.high !== undefined && v > s.high) return "high";
  return s.low === undefined && s.high === undefined ? "none" : "normal";
}

/** First and last values, change and direction, for the summary under each chart. */
export function trend(s: Series): { first?: number; last?: number; change?: number; pct?: number; dir: "up" | "down" | "flat" | "none" } {
  const vals = s.values.filter((v): v is number => v !== null);
  if (vals.length < 2) return { first: vals[0], last: vals[0], dir: "none" };
  const first = vals[0], last = vals[vals.length - 1];
  const change = last - first;
  const pct = first !== 0 ? (change / Math.abs(first)) * 100 : undefined;
  const dir = Math.abs(change) < 1e-9 || (pct !== undefined && Math.abs(pct) < 2) ? "flat" : change > 0 ? "up" : "down";
  return { first, last, change, pct, dir };
}

/** A compact table for Cadus to interpret (markdown). */
export function trendTable(t: LabTable): string {
  const head = `| Test | ${t.points.join(" | ")} | Range |`;
  const sep = `|---|${t.points.map(() => "---").join("|")}|---|`;
  const rows = t.series.map((s) => {
    const range = s.low !== undefined && s.high !== undefined ? `${s.low}-${s.high} ${s.unit}`.trim() : "";
    return `| ${s.name}${s.unit ? ` (${s.unit})` : ""} | ${s.values.map((v) => (v === null ? "-" : String(v))).join(" | ")} | ${range} |`;
  });
  return [head, sep, ...rows].join("\n");
}

export const LAB_EXAMPLE = `Admission: Hb 9.8, TLC 18,600, Plt 0.9, Na 129, K 5.4, Urea 78, Cr 2.4, CRP 168
Day 2: Hb 9.4, TLC 15,200, Plt 0.7, Na 131, K 4.9, Urea 70, Cr 2.1, CRP 142
Day 3: Hb 9.1, TLC 12,100, Plt 0.8, Na 134, K 4.4, Urea 58, Cr 1.7, CRP 96
Day 5: Hb 9.6, TLC 9,800, Plt 1.3, Na 137, K 4.1, Urea 41, Cr 1.3, CRP 38`;
