/**
 * Privacy guard: hides common patient identifiers before a question leaves the
 * device. It is a safety net, not a guarantee, so the interface tells users what
 * it hid and still asks them not to type identifiers.
 *
 * Caught: names after an honorific, a "Name:" label or "named", names directly
 * before an age or age/sex (for example "Ramesh Kumar, 54M"), Indian mobile
 * numbers, Aadhaar and ABHA numbers, email addresses, labelled hospital record
 * numbers (UHID, MRD, IP/OP numbers and similar), dates of birth and labelled
 * addresses.
 */

export type IdentifierKind = "name" | "phone" | "aadhaar" | "email" | "record" | "dob" | "address";

export interface Deidentified {
  text: string;
  /** How many of each kind were hidden. */
  hits: Partial<Record<IdentifierKind, number>>;
  total: number;
}

export const KIND_LABEL: Record<IdentifierKind, string> = {
  name: "name",
  phone: "phone number",
  aadhaar: "Aadhaar/ABHA number",
  email: "email",
  record: "record number",
  dob: "date of birth",
  address: "address",
};

/** Capitalised words that start clinical phrases rather than names. */
const NOT_NAMES = new Set(
  (
    "a an the this that these those he she his her our my your their patient pt case known elderly old young adult " +
    "male female man woman boy girl child infant neonate newborn baby toddler teen teenager lady gentleman mother father " +
    "husband wife son daughter brother sister indian hindu muslim sikh christian history presenting complaint complaints " +
    "admitted referred brought seen reviewed today yesterday tomorrow morning evening night day week month year years " +
    "syndrome disease fever type stage grade class hospital ward bed room icu er opd ipd post pre bp hr rr spo2 temp " +
    "chief impression diagnosis plan assessment subjective objective investigations labs findings on examination exam " +
    "case of with without and or but also however mr mrs ms dr g p para gravida primi multi"
  ).split(" "),
);

const NAME = "[A-Z][a-z]{2,}(?:[ \\t]+[A-Z][a-z]{2,}){0,2}";
/** An age that marks a patient introduction: with sex (54M, 54 yrs/F, 45 years, male) or "year-old". */
const AGE =
  "\\d{1,3}[ \\t]*-?[ \\t]*(?:(?:years?|yrs?|yr)[ \\t]*-?[ \\t]*old\\b|yo\\b|y\\/o|(?:years?|yrs?|yr|y)?[ \\t]*[,/]?[ \\t]*(?:[MFmf]\\b|male\\b|female\\b))";

function bump(hits: Deidentified["hits"], kind: IdentifierKind) {
  hits[kind] = (hits[kind] ?? 0) + 1;
}

const looksLikeName = (s: string) => s.split(/\s+/).every((w) => w.length > 1 && !NOT_NAMES.has(w.toLowerCase()));

export function deidentify(input: string): Deidentified {
  const hits: Deidentified["hits"] = {};
  let t = input;

  // Email addresses
  t = t.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, () => { bump(hits, "email"); return "[email]"; });

  // ABHA (14 digits, 2-4-4-4) and Aadhaar (12 digits, 4-4-4) before phone numbers.
  // The character before a number is captured rather than checked with a lookbehind,
  // which older Safari versions cannot parse.
  t = t.replace(/(^|[^\d.])\d{2}-\d{4}-\d{4}-\d{4}(?!\d|\.\d)/g, (_m, pre: string) => { bump(hits, "aadhaar"); return `${pre}[ID number]`; });
  t = t.replace(/(^|[^\d.+])[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?!\d|\.\d)/g, (_m, pre: string) => { bump(hits, "aadhaar"); return `${pre}[ID number]`; });

  // Indian mobile numbers, with or without +91 / 0
  t = t.replace(/(^|[^\d.+])(?:\+?91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d|\.\d)/g, (_m, pre: string) => { bump(hits, "phone"); return `${pre}[phone]`; });

  // Dates of birth
  t = t.replace(/\b(DOB|D\.O\.B\.?|Date of birth)(\s*[:-]?\s*)\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/gi, (_m, label: string, sep: string) => {
    bump(hits, "dob");
    return `${label}${sep}[date]`;
  });

  // Labelled record numbers: UHID 12345, MRD no. 4567/24, IP No: 889, Reg. No 77
  t = t.replace(
    /\b(UHID|MRD|MRN|CR|IPD?|OPD?|ABHA|Reg(?:istration)?\.?|Hospital|Patient|Case)(\s*(?:No\.?|Number|ID|#)?\s*[:.#-]?\s*)([A-Z]{0,4}\d[A-Z0-9/-]{2,})/gi,
    (m, label: string, sep: string, id: string) => {
      // Record labels (UHID, MRD, IP...) count with just a number; "Hospital", "Patient" and "Case"
      // need an explicit "No.", "ID", "#" or ":" so "Case 2" in a list stays as it is.
      const strong = /^(UHID|MRD|MRN|CR|IPD?|OPD?|ABHA)$/i.test(label);
      const explicit = /(?:No\.?|Number|ID|#|:)/i.test(sep);
      if (!explicit && !(strong && /\d{3,}/.test(id))) return m;
      bump(hits, "record");
      return `${label}${sep}[record no.]`;
    },
  );

  // Labelled addresses, including the Indian "R/o" (resident of)
  t = t.replace(/\b(Address|Addr\.?|R\/[Oo]|Resident of)(\s*[:-]?\s*)([^\n.;]{4,90})/g, (_m, label: string, sep: string) => {
    bump(hits, "address");
    return `${label}${sep}[address]`;
  });

  // Names: after honorifics (not Dr., so referral letters keep the doctor's name)
  t = t.replace(new RegExp(`\\b(Mr|Mrs|Ms|Miss|Shri|Shree|Sri|Smt|Kumari|Km|Master|Mast)(\\.?[ \\t]+)(${NAME})`, "g"), (m, _h: string, _s: string, name: string) => {
    if (!looksLikeName(name)) return m;
    bump(hits, "name");
    return "[patient]";
  });
  t = t.replace(new RegExp(`\\b(B\\/[Oo]|Baby of)([ \\t]+)(${NAME})`, "g"), (m, label: string, sp: string, name: string) => {
    if (!looksLikeName(name)) return m;
    bump(hits, "name");
    return `${label}${sp}[mother]`;
  });
  // Names after a label: "Name: Sunita Devi", "Patient name - Ravi"
  t = t.replace(new RegExp(`\\b((?:patient(?:'s)?[ \\t]+)?name|pt\\.?[ \\t]*name)([ \\t]*[:–-][ \\t]*)(${NAME})`, "gi"), (m, label: string, sep: string, name: string) => {
    if (!/^[A-Z]/.test(name) || !looksLikeName(name)) return m;
    bump(hits, "name");
    return `${label}${sep}[patient]`;
  });
  // "named Ravi"
  t = t.replace(new RegExp(`\\b(named|called)([ \\t]+)(${NAME})`, "g"), (m, label: string, sp: string, name: string) => {
    if (!looksLikeName(name)) return m;
    bump(hits, "name");
    return `${label}${sp}[patient]`;
  });
  // A name right before an age with sex or "year-old": "Ramesh Kumar, 54M", "Sunita, a 32-year-old",
  // "Ravi 45 yrs/M". A bare duration ("Diabetic 5 yrs") is left alone.
  t = t.replace(
    new RegExp(`(^|[\\s(\\["'])(${NAME})(,?[ \\t]+(?:an?[ \\t]+)?)(${AGE})`, "g"),
    (m, pre: string, name: string, sep: string, age: string) => {
      if (!looksLikeName(name)) return m;
      bump(hits, "name");
      return `${pre}[patient]${sep}${age}`;
    },
  );

  const total = Object.values(hits).reduce((a, b) => a + (b ?? 0), 0);
  return { text: t, hits, total };
}

const PLACEHOLDER_RE =
  /(?:\b(?:UHID|MRD|MRN|CR|IPD?|OPD?|ABHA|Aadhaar|Reg(?:istration)?|Hospital|Patient|Case|DOB|D\.O\.B|Date of birth|Address|Addr|R\/[Oo]|Resident of|B\/[Oo]|Baby of|mobile|phone|ph|tel|email|contact|named|called|name|Mr|Mrs|Ms|Miss|Shri|Shree|Sri|Smt|Kumari|Km|Master|Mast)\.?\s*(?:No\.?|Number|ID|#)?\s*[:.#-]?\s*)?\[(?:patient|mother|phone|email|ID number|record no\.|date|address)\]\s*[,;:]?\s*/gi;

/** Text without privacy-guard placeholders or the labels in front of them, for chat titles. */
export function stripPlaceholders(text: string): string {
  return text
    .replace(PLACEHOLDER_RE, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\s,;:.\-–]+/, "")
    .replace(/[\s,;:\-–]+$/, "")
    .trim();
}

/** "2 identifiers hidden: name, phone number" */
export function describeHits(hits: Deidentified["hits"]): string {
  const kinds = (Object.keys(hits) as IdentifierKind[]).filter((k) => (hits[k] ?? 0) > 0);
  const total = kinds.reduce((a, k) => a + (hits[k] ?? 0), 0);
  if (!total) return "";
  return `${total} identifier${total === 1 ? "" : "s"} hidden: ${kinds.map((k) => KIND_LABEL[k]).join(", ")}`;
}
