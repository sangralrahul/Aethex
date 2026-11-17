/**
 * Cadus Andro: the male partner's fertility work-up. Pure rules, no AI: every number is judged against a published
 * limit and every suggestion carries its source, so a doctor can check each line. The AI only explains (in Cadus chat,
 * if the doctor asks); it never decides a value.
 *
 * Sources: WHO laboratory manual for the examination and processing of human semen, 6th ed. (2021), lower reference
 * limits (5th centiles); Schlegel PN et al., Diagnosis and Treatment of Infertility in Men: AUA/ASRM Guideline (2020);
 * EAU Guidelines on Sexual and Reproductive Health. Thresholds marked "lab" depend on the lab's own range.
 */

export type SemenKey = "volume" | "concentration" | "total" | "motility" | "progressive" | "morphology" | "vitality" | "ph";
export interface SemenValues { volume: string; concentration: string; total: string; motility: string; progressive: string; morphology: string; vitality: string; ph: string }
export interface HormoneValues { fsh: string; lh: string; testosterone: string; tUnit: "ng/dL" | "nmol/L"; prolactin: string }
export interface Intake {
  age: string; partnerAge: string; months: string;
  smoking: boolean; alcohol: boolean; heat: boolean; testosterone: boolean; fever: boolean; obesity: boolean; drugs: boolean;
  undescended: boolean; mumps: boolean; chemo: boolean; injury: boolean; sexual: boolean;
  lump: boolean; pain: boolean;
}
export interface Exam { varicocele: "none" | "subclinical" | "clinical"; smallTestes: boolean; vasAbsent: boolean }
export interface AndroCase { semen: SemenValues; hormones: HormoneValues; intake: Intake; exam: Exam }

export const SEMEN_LIMITS: { key: SemenKey; label: string; unit: string; low: number }[] = [
  { key: "volume", label: "Semen volume", unit: "mL", low: 1.4 },
  { key: "concentration", label: "Sperm concentration", unit: "million/mL", low: 16 },
  { key: "total", label: "Total sperm number", unit: "million", low: 39 },
  { key: "motility", label: "Total motility", unit: "%", low: 42 },
  { key: "progressive", label: "Progressive motility", unit: "%", low: 30 },
  { key: "morphology", label: "Normal forms", unit: "%", low: 4 },
  { key: "vitality", label: "Vitality", unit: "%", low: 54 },
  { key: "ph", label: "pH", unit: "", low: 7.2 },
];
export const WHO = "WHO 2021";
export const AUA = "AUA/ASRM 2020";
export const EAU = "EAU guidelines";

export const emptyCase = (): AndroCase => ({
  semen: { volume: "", concentration: "", total: "", motility: "", progressive: "", morphology: "", vitality: "", ph: "" },
  hormones: { fsh: "", lh: "", testosterone: "", tUnit: "ng/dL", prolactin: "" },
  intake: { age: "", partnerAge: "", months: "", smoking: false, alcohol: false, heat: false, testosterone: false, fever: false, obesity: false, drugs: false, undescended: false, mumps: false, chemo: false, injury: false, sexual: false, lump: false, pain: false },
  exam: { varicocele: "none", smallTestes: false, vasAbsent: false },
});

/** The fictional patient from the Cadus Andro example (not a real person). */
export const exampleCase = (): AndroCase => {
  const c = emptyCase();
  c.semen = { ...c.semen, volume: "2.5", concentration: "9", motility: "35", progressive: "22", morphology: "5" };
  c.intake = { ...c.intake, age: "31", partnerAge: "29", months: "14", smoking: true, heat: true, testosterone: true };
  return c;
};

const num = (s: string): number | null => { const t = s.trim().replace(",", "."); if (!t) return null; const n = Number(t); return Number.isFinite(n) && n >= 0 ? n : null; };

export interface Row { key: SemenKey; label: string; unit: string; low: number; value: number | null; calculated?: boolean; status: "normal" | "low" | "absent" | "missing" }
export interface Step { text: string; source: string }
export interface Flag { text: string; urgent: boolean }
export interface Result {
  rows: Row[]; entered: number; pattern: string; patternParts: string[]; normal: boolean | null;
  hormoneNotes: Step[]; workup: Step[]; lifestyle: string[]; flags: Flag[]; repeatInMonths: number | null; testosteroneLow: boolean;
}

export function evaluate(c: AndroCase): Result {
  const v: Record<SemenKey, number | null> = { volume: num(c.semen.volume), concentration: num(c.semen.concentration), total: num(c.semen.total), motility: num(c.semen.motility), progressive: num(c.semen.progressive), morphology: num(c.semen.morphology), vitality: num(c.semen.vitality), ph: num(c.semen.ph) };
  let totalCalc = false;
  if (v.total === null && v.volume !== null && v.concentration !== null) { v.total = Math.round(v.volume * v.concentration * 10) / 10; totalCalc = true; }
  const rows: Row[] = SEMEN_LIMITS.map((l) => {
    const value = v[l.key];
    const status: Row["status"] = value === null ? "missing" : l.key === "concentration" && value === 0 ? "absent" : value < l.low ? "low" : "normal";
    return { ...l, value, calculated: l.key === "total" && totalCalc, status };
  });
  const entered = rows.filter((r) => r.status !== "missing").length;
  const is = (k: SemenKey) => rows.find((r) => r.key === k)!.status === "low";
  const azoo = v.concentration === 0;
  const parts: string[] = [];
  if (azoo) parts.push("azoospermia");
  else {
    if (is("concentration") || is("total")) parts.push(v.concentration !== null && v.concentration < 5 ? "severe oligozoospermia" : "oligozoospermia");
    if (is("progressive") || is("motility")) parts.push("asthenozoospermia");
    if (is("morphology")) parts.push("teratozoospermia");
  }
  if (is("volume")) parts.push("low semen volume");
  if (is("vitality")) parts.push("low vitality");
  if (is("ph")) parts.push("low pH");
  const severe = parts.includes("severe oligozoospermia");
  const prefixes = [parts.some((p) => p.endsWith("oligozoospermia")) && "oligo", parts.includes("asthenozoospermia") && "astheno", parts.includes("teratozoospermia") && "terato"].filter(Boolean) as string[];
  const named = azoo ? "azoospermia" : prefixes.length ? `${prefixes.join("")}zoospermia${severe ? " (severe: under 5 million/mL)" : ""}` : "";
  const extra = parts.filter((p) => !/zoospermia/.test(p));
  const pattern = entered === 0 ? "" : parts.length === 0 ? "normozoospermia (all values within WHO 2021 limits)" : [named, ...extra].filter(Boolean).join(", ");

  // hormones
  const fsh = num(c.hormones.fsh), lh = num(c.hormones.lh), prl = num(c.hormones.prolactin);
  const tRaw = num(c.hormones.testosterone);
  const t = tRaw === null ? null : c.hormones.tUnit === "nmol/L" ? tRaw * 28.84 : tRaw; // ng/dL
  const hormoneNotes: Step[] = [];
  const testosteroneLow = t !== null && t < 300;
  if (t !== null) hormoneNotes.push(testosteroneLow
    ? { text: `Total testosterone is low (${tRaw} ${c.hormones.tUnit}; below 300 ng/dL, about 10.4 nmol/L). Repeat an early-morning sample with LH; check prolactin if LH is low or normal.`, source: AUA }
    : { text: `Total testosterone ${tRaw} ${c.hormones.tUnit} is not low.`, source: AUA });
  if (fsh !== null && fsh > 7.6) hormoneNotes.push({ text: `FSH is raised (${fsh} IU/L, above 7.6). This points to a problem making sperm in the testes rather than a blockage.`, source: AUA });
  if (testosteroneLow && lh !== null) hormoneNotes.push(lh > 9
    ? { text: `LH is high with low testosterone: the testes are not responding (primary testicular failure).`, source: EAU }
    : { text: `LH is low or normal with low testosterone: the signal from the pituitary is low (secondary). Check prolactin; pituitary imaging if prolactin is high.`, source: EAU });
  if (prl !== null && prl > 20) hormoneNotes.push({ text: `Prolactin ${prl} ng/mL is above the usual upper limit (about 20; use your lab's range). Repeat it; if still high, look for medicines that raise it and consider pituitary MRI.`, source: EAU });

  // work-up
  const abnormal = parts.length > 0;
  const workup: Step[] = [];
  const I = c.intake, E = c.exam;
  if (entered === 0) workup.push({ text: "Start with a semen analysis after 2 to 7 days without ejaculation, at an accredited lab.", source: WHO });
  if (abnormal) workup.push({ text: "Repeat the semen analysis to confirm. One result can vary a lot; a full sperm cycle takes about 2 to 3 months.", source: AUA });
  if ((abnormal || I.sexual || E.smallTestes) && (fsh === null || t === null)) workup.push({ text: "Hormone tests: FSH and total testosterone (morning sample).", source: AUA });
  if (azoo || (v.concentration !== null && v.concentration < 5)) workup.push({ text: "Genetic tests: karyotype and Y-chromosome microdeletion, especially with raised FSH or small testes.", source: AUA });
  if (azoo) workup.push({ text: "Confirm azoospermia on a centrifuged sample, and refer to a urologist or andrologist.", source: WHO });
  if (is("volume")) workup.push({ text: "Low volume: check a post-ejaculation urine sample for sperm (retrograde ejaculation) and ask about collection problems.", source: AUA });
  if (is("volume") && (azoo || is("ph"))) workup.push({ text: "Low volume with low pH or no sperm suggests a blockage (ejaculatory ducts or absent vas): examine the vas, consider transrectal ultrasound.", source: AUA });
  if (E.vasAbsent) workup.push({ text: "Vas deferens not felt: test for CFTR gene variants and counsel the couple before treatment.", source: AUA });
  if (E.varicocele === "clinical" && abnormal) workup.push({ text: "Clinical (palpable) varicocele with abnormal semen: refer to a urologist to consider repair.", source: AUA });
  if (E.varicocele === "subclinical") workup.push({ text: "A varicocele seen only on ultrasound (not felt) is not treated for fertility.", source: AUA });
  if (I.testosterone) workup.push({ text: "Stop testosterone, steroids and \"testosterone boosters\" that contain hormones: they switch off sperm production. Recovery can take several months.", source: AUA });
  if (abnormal || azoo || testosteroneLow || (fsh !== null && fsh > 7.6) || E.varicocele === "clinical") workup.push({ text: "Refer to a urologist or andrologist for examination and a treatment plan.", source: AUA });
  workup.push({ text: "Evaluate the female partner at the same time, not after the man's tests.", source: AUA });

  const lifestyle: string[] = [];
  if (I.smoking) lifestyle.push("Stop smoking (it lowers sperm count and motility).");
  if (I.alcohol) lifestyle.push("Cut alcohol to well within safe limits.");
  if (I.heat) lifestyle.push("Avoid heat on the testes: hot baths, saunas, laptops on the lap, long hours near furnaces or ovens.");
  if (I.obesity) lifestyle.push("Lose weight gradually if overweight.");
  if (I.drugs) lifestyle.push("Stop recreational drugs, including cannabis.");
  if (I.testosterone) lifestyle.push("Stop the testosterone or steroid product (talk to the doctor first).");
  if (I.fever) lifestyle.push("A fever in the last 3 months can lower counts for a while: the repeat test will show the true level.");

  const flags: Flag[] = [];
  if (I.pain) flags.push({ text: "Sudden, painful, swollen testis: go to emergency now (possible torsion).", urgent: true });
  if (I.lump) flags.push({ text: "A lump in the testis: see a doctor within 2 weeks to rule out cancer (ultrasound).", urgent: true });
  if (azoo) flags.push({ text: "No sperm seen: needs a urologist or andrologist.", urgent: false });
  if (prl !== null && prl > 50) flags.push({ text: "Prolactin well above normal: assess for a pituitary cause.", urgent: false });
  if (I.sexual) flags.push({ text: "Erection or ejaculation problems: assess them (and heart risk) with the doctor.", urgent: false });

  const months = num(I.months), pAge = num(I.partnerAge);
  if (months !== null && pAge !== null && pAge >= 35 && months >= 6 && entered === 0) flags.push({ text: "Partner 35 or older and trying 6 months or more: both partners should be tested now.", urgent: false });

  return { rows, entered, pattern, patternParts: parts, normal: entered ? !abnormal : null, hormoneNotes, workup, lifestyle, flags, repeatInMonths: abnormal || I.fever || I.testosterone ? 3 : null, testosteroneLow };
}

/** Plain-language explainer for the patient, from the rules (no AI). */
export function explainer(r: Result, lang: "en" | "hi"): string[] {
  const p = r.patternParts;
  const low = (s: string) => p.some((x) => x.includes(s));
  const out: string[] = [];
  if (lang === "en") {
    if (r.entered === 0) out.push("A simple semen test is the first step. It is common, private and quick.");
    else if (low("azoospermia")) out.push("No sperm were seen in this sample. This needs a specialist, and there are tests and treatments that can help.");
    else if (r.normal) out.push("Your semen test is within the normal WHO ranges.");
    else {
      const bits = [low("oligo") && "the number of sperm", low("astheno") && "how well they move", low("terato") && "their shape", low("volume") && "the amount of semen"].filter(Boolean);
      out.push(`Your report shows ${bits.join(", ").replace(/, ([^,]*)$/, " and $1")} below the normal range. This is common, and often improves.`);
    }
    if (r.lifestyle.length) out.push(`What you can do now: ${r.lifestyle.map((x) => x.replace(/\.$/, "").replace(/ \(.*\)$/, "").toLowerCase()).join("; ")}.`);
    if (r.repeatInMonths) out.push(`Repeat the test in about ${r.repeatInMonths} months, at the same lab if possible.`);
    out.push("Your doctor will explain the next tests. Your partner should be checked at the same time.");
  } else {
    if (r.entered === 0) out.push("Pehla step ek simple semen test hai. Yeh aam baat hai, private hai aur jaldi ho jata hai.");
    else if (low("azoospermia")) out.push("Is sample mein sperm nahi dikhe. Iske liye specialist doctor se milna zaroori hai; iske test aur ilaaj hain.");
    else if (r.normal) out.push("Aapki semen report WHO ki normal range mein hai.");
    else {
      const bits = [low("oligo") && "sperm ki sankhya", low("astheno") && "sperm ki speed", low("terato") && "sperm ka shape", low("volume") && "semen ki matra"].filter(Boolean);
      out.push(`Aapki report mein ${bits.join(", ").replace(/, ([^,]*)$/, " aur $1")} normal se kam hai. Yeh kaafi common hai aur aksar theek ho sakta hai.`);
    }
    const tips: string[] = [];
    if (p && r.lifestyle.some((x) => x.startsWith("Stop smoking"))) tips.push("smoking band karein");
    if (r.lifestyle.some((x) => x.startsWith("Cut alcohol"))) tips.push("sharab kam karein");
    if (r.lifestyle.some((x) => x.startsWith("Avoid heat"))) tips.push("garmi se bachein (hot bath, sauna, laptop god mein, bhatti ke paas)");
    if (r.lifestyle.some((x) => x.startsWith("Lose weight"))) tips.push("dheere-dheere wazan kam karein");
    if (r.lifestyle.some((x) => x.startsWith("Stop recreational"))) tips.push("nasha band karein");
    if (r.lifestyle.some((x) => x.startsWith("Stop the testosterone"))) tips.push("testosterone booster ya steroid band karein (pehle doctor se baat karein)");
    if (tips.length) out.push(`Abhi aap yeh kar sakte hain: ${tips.join("; ")}.`);
    if (r.repeatInMonths) out.push(`Lagbhag ${r.repeatInMonths} mahine baad test dobara karwayein, ho sake to usi lab mein.`);
    out.push("Aapke doctor agle test samjhayenge. Aapki partner ki jaanch bhi saath-saath honi chahiye.");
  }
  return out;
}

/** The doctor summary as text (no names), for copying or for asking Cadus. */
export function summaryText(c: AndroCase, r: Result): string {
  const lines = [`Male fertility work-up (Cadus Andro)`];
  const I = c.intake;
  const hist = [I.age && `age ${I.age}`, I.partnerAge && `partner ${I.partnerAge}`, I.months && `trying ${I.months} months`, I.smoking && "smoker", I.alcohol && "alcohol", I.heat && "heat exposure", I.testosterone && "testosterone/steroid use", I.fever && "fever in last 3 months", I.obesity && "BMI 30+", I.drugs && "recreational drugs", I.undescended && "undescended testis", I.mumps && "mumps orchitis", I.chemo && "chemo/radiotherapy", I.injury && "testicular injury", I.sexual && "erection/ejaculation problems"].filter(Boolean);
  if (hist.length) lines.push(`History: ${hist.join(", ")}.`);
  lines.push("Semen analysis vs WHO 2021 lower limits:");
  for (const x of r.rows) if (x.value !== null) lines.push(`- ${x.label}: ${x.value}${x.unit ? ` ${x.unit}` : ""}${x.calculated ? " (calculated)" : ""} (limit ${x.low}) ${x.status === "normal" ? "normal" : x.status === "absent" ? "NONE" : "BELOW"}`);
  if (r.pattern) lines.push(`Pattern: ${r.pattern}.`);
  for (const h of r.hormoneNotes) lines.push(`- ${h.text}`);
  if (c.exam.varicocele !== "none") lines.push(`Varicocele: ${c.exam.varicocele}.`);
  lines.push("Suggested work-up:");
  for (const w of r.workup) lines.push(`- ${w.text} [${w.source}]`);
  return lines.join("\n");
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * Update 108: the connected journey. Still rules only. Three things are added on top of the work-up above:
 *   1. the referral journey (referral, booking, specialist visit, repeat test, close) tracked to completion;
 *   2. progress across repeat reports, with what he changed in between (habits, medicine, a procedure);
 *   3. the record Cadus AI is given, so it answers from his own intake and results and never asks for them again.
 * Nothing here carries a name. The reviewing doctor's name is never put in the record sent to the AI.
 * ───────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

export type ChangeKey = "smoking" | "alcohol" | "heat" | "weight" | "drugs" | "testosterone" | "medicine" | "surgery";
export const CHANGES: { key: ChangeKey; label: string; hi: string }[] = [
  { key: "smoking", label: "Stopped or cut tobacco", hi: "tambaku band ya kam kiya" },
  { key: "alcohol", label: "Cut alcohol", hi: "sharab kam ki" },
  { key: "heat", label: "Avoided heat on the testes", hi: "garmi se bachaav kiya" },
  { key: "weight", label: "Lost weight", hi: "wazan kam kiya" },
  { key: "drugs", label: "Stopped recreational drugs", hi: "nasha band kiya" },
  { key: "testosterone", label: "Stopped testosterone or steroids", hi: "testosterone ya steroid band kiya" },
  { key: "medicine", label: "Started a medicine from the doctor", hi: "doctor ki dawa shuru ki" },
  { key: "surgery", label: "Had a procedure (for example varicocele repair)", hi: "procedure hua (jaise varicocele repair)" },
];
/** One dated semen report in the progress log. `changes` and `medicine` say what was different before this report. */
export interface Report { id: string; date: string; semen: SemenValues; changes: ChangeKey[]; medicine: string }
export interface Journey { specialist: "urologist" | "andrologist"; referredOn: string; bookedFor: string; clinic: string; seenOn: string; outcome: string; closedOn: string; closeNote: string }
export const emptyJourney = (): Journey => ({ specialist: "urologist", referredOn: "", bookedFor: "", clinic: "", seenOn: "", outcome: "", closedOn: "", closeNote: "" });

const pad = (n: number) => String(n).padStart(2, "0");
/** Today (or a date) as yyyy-mm-dd in local time, the form date inputs use. */
export const isoDay = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`));
const dayNo = (s: string) => Math.round(Date.parse(`${s}T00:00:00Z`) / 86400000);
export const daysBetween = (from: string, to: string): number | null => (validDay(from) && validDay(to) ? dayNo(to) - dayNo(from) : null);
export function addMonths(iso: string, months: number): string {
  if (!validDay(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(Math.min(d, last))}`;
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const niceDate = (iso: string): string => { if (!validDay(iso)) return ""; const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
export const sortReports = (reports: Report[]): Report[] => reports.filter((x) => validDay(x.date)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/** Why this man should see a urologist or andrologist, from the same rules as the work-up. Empty when no referral is needed. */
export function referralReasons(c: AndroCase, r: Result): string[] {
  const out: string[] = [];
  const fsh = num(c.hormones.fsh);
  if (c.intake.lump) out.push("Lump in a testis (to be seen within 2 weeks)");
  if (r.patternParts.includes("azoospermia")) out.push("No sperm seen in the sample (azoospermia)");
  else if (r.patternParts.length) out.push(`Semen analysis below WHO 2021 limits: ${r.pattern}`);
  if (r.testosteroneLow) out.push("Low total testosterone");
  if (fsh !== null && fsh > 7.6) out.push(`Raised FSH (${fsh} IU/L)`);
  if (c.exam.varicocele === "clinical") out.push("Varicocele felt on examination");
  if (c.exam.vasAbsent) out.push("Vas deferens not felt on examination");
  return out;
}

export type StageKey = "referral" | "booked" | "seen" | "repeat" | "closed";
export interface Stage { key: StageKey; title: string; state: "done" | "now" | "late" | "todo" | "skip"; detail: string }
export interface JourneyStatus { stages: Stage[]; done: number; total: number; next: string; reasons: string[]; repeatDue: string; bookedFor: string; complete: boolean }

/** Where the referral and follow-up stand today. Each stage is done, due now, late, still to come, or not needed. */
export function journeyStatus(j: Journey, c: AndroCase, r: Result, reports: Report[], today: string = isoDay()): JourneyStatus {
  const reasons = referralReasons(c, r);
  const needRef = reasons.length > 0 || !!j.referredOn;
  const sorted = sortReports(reports);
  const base = sorted[0]?.date ?? "";
  const repeatDone = sorted.length > 1 ? sorted[sorted.length - 1].date : "";
  const needRepeat = r.repeatInMonths !== null || !!repeatDone;
  const repeatDue = r.repeatInMonths !== null && base ? addMonths(base, r.repeatInMonths) : "";
  const who = j.specialist;
  const stages: Stage[] = [];

  if (!needRef) stages.push({ key: "referral", title: "Referral", state: "skip", detail: "Not needed on the current results." });
  else if (j.referredOn) stages.push({ key: "referral", title: "Referral made", state: "done", detail: `Referred to a ${who} on ${niceDate(j.referredOn)}.` });
  else stages.push({ key: "referral", title: "Referral", state: "now", detail: `Needed: ${reasons[0]}.` });

  if (!needRef) stages.push({ key: "booked", title: "Appointment", state: "skip", detail: "No referral, so no appointment to book." });
  else if (j.bookedFor) stages.push({ key: "booked", title: "Appointment booked", state: "done", detail: `Booked for ${niceDate(j.bookedFor)}${j.clinic.trim() ? ` at ${j.clinic.trim()}` : ""}.` });
  else if (j.seenOn) stages.push({ key: "booked", title: "Appointment", state: "done", detail: "Seen without a booking date recorded." });
  else if (j.referredOn) {
    const waited = daysBetween(j.referredOn, today) ?? 0;
    stages.push(waited > 14
      ? { key: "booked", title: "Appointment", state: "late", detail: `Referred ${waited} days ago and no appointment yet. Help him book one.` }
      : { key: "booked", title: "Appointment", state: "now", detail: "Book the appointment and add the date here." });
  } else stages.push({ key: "booked", title: "Appointment", state: "todo", detail: "After the referral is made." });

  if (!needRef) stages.push({ key: "seen", title: "Specialist visit", state: "skip", detail: "No referral, so no visit to track." });
  else if (j.seenOn) stages.push({ key: "seen", title: "Seen by the specialist", state: "done", detail: `Seen on ${niceDate(j.seenOn)}${j.outcome.trim() ? `: ${j.outcome.trim()}` : "."}` });
  else if (j.bookedFor) {
    const past = (daysBetween(j.bookedFor, today) ?? 0) > 0;
    stages.push(past
      ? { key: "seen", title: "Specialist visit", state: "late", detail: `The appointment date (${niceDate(j.bookedFor)}) has passed. Mark it as seen, or rebook.` }
      : { key: "seen", title: "Specialist visit", state: "now", detail: `Appointment on ${niceDate(j.bookedFor)}. Add what was decided after the visit.` });
  } else stages.push({ key: "seen", title: "Specialist visit", state: "todo", detail: "After the appointment is booked." });

  if (!needRepeat) stages.push({ key: "repeat", title: "Repeat semen analysis", state: "skip", detail: "No repeat test needed on the current results." });
  else if (repeatDone) stages.push({ key: "repeat", title: "Repeat semen analysis done", state: "done", detail: `Repeat report dated ${niceDate(repeatDone)}. See Progress for what changed.` });
  else if (!repeatDue) stages.push({ key: "repeat", title: "Repeat semen analysis", state: "now", detail: "Save the first report with its date in Progress to set the due date." });
  else {
    const over = daysBetween(repeatDue, today) ?? 0;
    stages.push(over > 14
      ? { key: "repeat", title: "Repeat semen analysis", state: "late", detail: `Was due around ${niceDate(repeatDue)}. Arrange the repeat test.` }
      : { key: "repeat", title: "Repeat semen analysis", state: "now", detail: `Due around ${niceDate(repeatDue)} (about ${r.repeatInMonths} months after the first report).` });
  }

  const before = stages.filter((s) => s.state !== "skip");
  const allDone = before.every((s) => s.state === "done");
  if (j.closedOn) stages.push({ key: "closed", title: "Follow-up closed", state: "done", detail: `Closed on ${niceDate(j.closedOn)}${j.closeNote.trim() ? `: ${j.closeNote.trim()}` : "."}` });
  else stages.push(allDone && before.length
    ? { key: "closed", title: "Close the follow-up", state: "now", detail: "Every step above is done. Close the follow-up with a short note." }
    : { key: "closed", title: "Close the follow-up", state: "todo", detail: "When the steps above are done (or earlier, with the reason)." });

  const counted = stages.filter((s) => s.state !== "skip");
  const first = stages.find((s) => s.state === "late") ?? stages.find((s) => s.state === "now");
  return { stages, done: counted.filter((s) => s.state === "done").length, total: counted.length, next: j.closedOn ? "" : first ? first.detail : "", reasons, repeatDue, bookedFor: j.bookedFor, complete: !!j.closedOn };
}

/** The next step in the referral and follow-up, said to him (the stage details above are written for the doctor). */
export function patientNext(js: JourneyStatus, lang: "en" | "hi"): string {
  if (js.complete) return "";
  const s = js.stages.find((x) => x.state === "late") ?? js.stages.find((x) => x.state === "now");
  if (!s) return "";
  const en = lang === "en";
  if (s.key === "referral") return en ? "Ask your doctor for the referral to the specialist." : "Doctor se specialist ke liye referral lein.";
  if (s.key === "booked") return en ? "Book your appointment with the specialist and tell your doctor the date." : "Specialist ke saath appointment book karein aur doctor ko tareekh batayein.";
  if (s.key === "seen") return s.state === "late"
    ? (en ? "Your appointment date has passed. Tell your doctor what the specialist said, or book again if you could not go." : "Appointment ki tareekh nikal gayi hai. Doctor ko batayein ki specialist ne kya kaha, ya agar nahi ja paye to dobara book karein.")
    : (en ? `Go to your specialist appointment on ${niceDate(js.bookedFor)}.` : `${niceDate(js.bookedFor)} ko specialist ke appointment par jayein.`);
  if (s.key === "repeat") return !js.repeatDue ? "" : s.state === "late"
    ? (en ? `Your repeat semen test was due around ${niceDate(js.repeatDue)}. Arrange it with your doctor.` : `Aapka dobara semen test ${niceDate(js.repeatDue)} ke aas-paas hona tha. Doctor se baat karke karwa lein.`)
    : (en ? `Repeat the semen test around ${niceDate(js.repeatDue)}.` : `${niceDate(js.repeatDue)} ke aas-paas semen test dobara karwayein.`);
  return "";
}

/** A referral letter from the rules, with no name in it. The doctor reads, edits and sends it. */
export function referralLetter(c: AndroCase, r: Result, j: Journey, note: string, today: string = isoDay()): string {
  const I = c.intake;
  const who = [I.age ? `a ${I.age}-year-old man` : "a man", I.partnerAge && `partner aged ${I.partnerAge}`, I.months && `trying to conceive for ${I.months} months`].filter(Boolean).join(", ");
  const lines = [`Date: ${niceDate(today)}`, `To: Consultant ${j.specialist === "andrologist" ? "Andrologist" : "Urologist"}`, "", "Re: Male partner in a couple being evaluated for infertility", "", `Thank you for seeing ${who}.`];
  const reasons = referralReasons(c, r);
  if (reasons.length) { lines.push("", "Reason for referral:"); for (const x of reasons) lines.push(`- ${x}`); }
  lines.push("", ...summaryText(c, r).split("\n").slice(1));
  if (r.lifestyle.length) { lines.push("Advice already given:"); for (const l of r.lifestyle) lines.push(`- ${l}`); }
  if (note.trim()) lines.push("", `Referring doctor's note: ${note.trim()}`);
  lines.push("", "The female partner is being evaluated at the same time. Please let us know your findings and plan so follow-up can be completed here.", "", "Prepared with Cadus Andro. Values judged against WHO 2021 lower reference limits; reviewed and signed by the referring doctor.");
  return lines.join("\n");
}

/* ── Progress across repeat reports ── */

export const PROGRESS_KEYS: SemenKey[] = ["concentration", "total", "motility", "progressive", "morphology", "volume"];
const PLAIN: Record<string, { en: string; hi: string }> = {
  concentration: { en: "sperm count", hi: "sperm ki sankhya" }, total: { en: "total sperm number", hi: "kul sperm" }, motility: { en: "sperm movement", hi: "sperm ki harkat" },
  progressive: { en: "forward-moving sperm", hi: "aage badhne wale sperm" }, morphology: { en: "normally shaped sperm", hi: "normal shape wale sperm" }, volume: { en: "semen amount", hi: "semen ki matra" },
};
/** A change smaller than this share of the first value is shown as "about the same": results vary between samples. A display rule, not a clinical cut-off. */
export const SAME_BAND = 0.15;
export interface Trend { key: SemenKey; label: string; unit: string; low: number; points: { date: string; value: number | null }[]; first: number | null; last: number | null; pct: number | null; direction: "up" | "down" | "same" | null; crossed: "into" | "out" | null }
export interface Progress { reports: Report[]; trends: Trend[]; changes: ChangeKey[]; medicines: string[]; enough: boolean; from: string; to: string }

export function progress(reports: Report[]): Progress {
  const sorted = sortReports(reports);
  const evals = sorted.map((x) => evaluate({ ...emptyCase(), semen: x.semen }));
  const trends: Trend[] = PROGRESS_KEYS.map((key) => {
    const lim = SEMEN_LIMITS.find((l) => l.key === key)!;
    const points = sorted.map((x, i) => ({ date: x.date, value: evals[i].rows.find((row) => row.key === key)!.value }));
    const have = points.filter((p) => p.value !== null) as { date: string; value: number }[];
    const first = have.length ? have[0].value : null;
    const last = have.length > 1 ? have[have.length - 1].value : null;
    let pct: number | null = null, direction: Trend["direction"] = null, crossed: Trend["crossed"] = null;
    if (first !== null && last !== null) {
      pct = first === 0 ? (last === 0 ? 0 : null) : Math.round(((last - first) / first) * 100);
      crossed = first < lim.low && last >= lim.low ? "into" : first >= lim.low && last < lim.low ? "out" : null;
      const big = first === 0 ? last !== 0 : Math.abs(last - first) / first >= SAME_BAND;
      direction = crossed === "into" ? "up" : crossed === "out" ? "down" : !big ? "same" : last > first ? "up" : "down";
    }
    return { key, label: lim.label, unit: lim.unit, low: lim.low, points, first, last, pct, direction, crossed };
  });
  const later = sorted.slice(1);
  const changes = CHANGES.map((x) => x.key).filter((k) => later.some((x) => x.changes.includes(k)));
  const medicines = Array.from(new Set(later.map((x) => x.medicine.trim()).filter(Boolean)));
  return { reports: sorted, trends, changes, medicines, enough: sorted.length > 1 && trends.some((t) => t.direction !== null), from: sorted[0]?.date ?? "", to: sorted[sorted.length - 1]?.date ?? "" };
}

const joinAnd = (xs: string[], and: string) => xs.join(", ").replace(/, ([^,]*)$/, ` ${and} $1`);
const withUnit = (v: number, unit: string) => `${v}${unit === "%" ? "%" : unit ? ` ${unit}` : ""}`;

/** Progress in plain words for him, from the rules. */
export function progressLines(p: Progress, lang: "en" | "hi"): string[] {
  const out: string[] = [];
  const en = lang === "en";
  if (!p.enough) return [en ? "Add a repeat report to see what has changed since the first one." : "Pehli report ke baad kya badla, yeh dekhne ke liye dobara ki gayi report jodein."];
  out.push(en ? `Comparing your reports from ${niceDate(p.from)} and ${niceDate(p.to)}:` : `${niceDate(p.from)} aur ${niceDate(p.to)} ki report ki tulna:`);
  for (const t of p.trends) {
    if (t.first === null || t.last === null || t.direction === null || t.direction === "same") continue;
    const name = PLAIN[t.key][lang];
    const range = `${t.first} → ${withUnit(t.last, t.unit)}`;
    if (en) out.push(`${name[0].toUpperCase()}${name.slice(1)} went ${t.direction} (${range})${t.crossed === "into" ? " and is now within the normal range" : t.crossed === "out" ? " and is now below the normal range" : t.last < t.low ? ", still below the normal range" : ""}.`);
    else out.push(`${name[0].toUpperCase()}${name.slice(1)} mein ${t.direction === "up" ? "badhotri hui" : "kami aayi"} (${range})${t.crossed === "into" ? " aur ab normal range mein hai" : t.crossed === "out" ? " aur ab normal se kam hai" : t.last < t.low ? ", abhi bhi normal se kam hai" : ""}.`);
  }
  const same = p.trends.filter((t) => t.direction === "same").map((t) => PLAIN[t.key][lang]);
  if (same.length) out.push(en ? `About the same: ${joinAnd(same, "and")}.` : `Lagbhag pehle jaisa: ${joinAnd(same, "aur")}.`);
  const did = CHANGES.filter((x) => p.changes.includes(x.key)).map((x) => (en ? x.label.toLowerCase() : x.hi));
  if (did.length) out.push(en ? `Since the first report you: ${did.join("; ")}.` : `Pehli report ke baad aapne: ${did.join("; ")}.`);
  out.push(en ? "Results vary from one sample to the next. Your doctor reads the trend, not one number." : "Har sample ka result thoda alag hota hai. Doctor ek number nahi, poora trend dekhte hain.");
  return out;
}

/* ── What Cadus AI is given, and what it must give back ── */

export interface AskAnswer { answer: string; basis: "record" | "general"; used: string[]; nextSteps: string[]; askDoctor: string; urgent: boolean }
export interface Qa { id: string; at: number; q: string; lang: "en" | "hi"; a: AskAnswer; by: "ai" | "rules"; reviewed: boolean }

/** His whole record as text, with no name and no doctor's name: the only thing the AI sees besides his question. */
export function patientRecord(c: AndroCase, r: Result, x: { note: string; signed: boolean; journey: JourneyStatus; progress: Progress }): string {
  const lines = summaryText(c, r).split("\n");
  if (r.entered === 0) lines.push("No semen analysis values have been entered yet.");
  if (r.lifestyle.length) { const did = lifestyleDone(r, x.progress.reports); lines.push("Things he can change:"); for (const l of r.lifestyle) lines.push(`- ${l}${did.has(l) ? " (he reports he has done this)" : ""}`); }
  if (r.flags.length) { lines.push("Warning flags:"); for (const f of r.flags) lines.push(`- ${f.urgent ? "URGENT: " : ""}${f.text}`); }
  lines.push(r.repeatInMonths ? `Repeat semen analysis: in about ${r.repeatInMonths} months${x.journey.repeatDue ? ` (around ${niceDate(x.journey.repeatDue)})` : ""}.` : "Repeat semen analysis: not needed on current results.");
  lines.push(`Doctor sign-off: ${x.signed ? "this summary and plan have been reviewed and signed by his doctor" : "NOT yet signed by a doctor"}.`);
  if (x.note.trim()) lines.push(`Doctor's note to him: ${x.note.trim()}`);
  lines.push(`Referral and follow-up (${x.journey.done} of ${x.journey.total} steps done):`);
  for (const s of x.journey.stages) lines.push(`- ${s.title}: ${s.state === "done" ? "done" : s.state === "late" ? "OVERDUE" : s.state === "now" ? "due now" : s.state === "skip" ? "not needed" : "later"}. ${s.detail}`);
  if (x.progress.reports.length) {
    lines.push("Reports over time:");
    for (const rep of x.progress.reports) {
      const e = evaluate({ ...emptyCase(), semen: rep.semen });
      const vals = e.rows.filter((row) => row.value !== null).map((row) => `${row.label} ${withUnit(row.value as number, row.unit)}`).join(", ");
      const did = CHANGES.filter((k) => rep.changes.includes(k.key)).map((k) => k.label.toLowerCase());
      lines.push(`- ${niceDate(rep.date)}: ${vals || "no values"}${did.length ? `. Before this report he: ${did.join("; ")}` : ""}${rep.medicine.trim() ? `. Medicine: ${rep.medicine.trim()}` : ""}`);
    }
    if (x.progress.enough) for (const l of progressLines(x.progress, "en").slice(1, -1)) lines.push(`  ${l}`);
  }
  return lines.join("\n");
}

export type StarterKind = "meaning" | "next" | "repeat" | "referral" | "progress";
export const STARTERS: { kind: StarterKind; en: string; hi: string }[] = [
  { kind: "meaning", en: "What does my report mean?", hi: "Meri report ka kya matlab hai?" },
  { kind: "next", en: "What should I do next?", hi: "Ab mujhe kya karna chahiye?" },
  { kind: "repeat", en: "When should I repeat the test?", hi: "Test dobara kab karwana hai?" },
  { kind: "referral", en: "Why do I need a specialist?", hi: "Mujhe specialist ke paas kyun jaana hai?" },
  { kind: "progress", en: "Has anything improved?", hi: "Kya kuch sudhaar hua hai?" },
];

/** Warning words in a question. The rules answer these first, whatever the AI says. */
export function urgentIn(q: string, lang: "en" | "hi"): string {
  const en = lang === "en";
  if (/torsion|(sudden|severe|achanak|tez|bahut).{0,40}(pain|dard)|(pain|dard).{0,40}(swell|swollen|sujan|soojan)|(swell|swollen|sujan|soojan).{0,40}(pain|dard)/i.test(q)) return en ? "Sudden, painful or swollen testis: go to an emergency department now. Do not wait for a reply here." : "Achanak dard ya sujan ho to abhi emergency mein jayein. Yahan jawab ka intezaar na karein.";
  if (/\blump\b|ga+n?th/i.test(q)) return en ? "A lump in a testis should be seen by a doctor within 2 weeks." : "Testis mein gaanth ho to 2 hafte ke andar doctor ko dikhayein.";
  if (/blood|khoon|khun/i.test(q)) return en ? "Blood in the semen or urine should be checked by a doctor soon." : "Semen ya peshab mein khoon ho to jaldi doctor ko dikhayein.";
  return "";
}

/** The answer from the rules alone: used for the ready questions when Cadus AI is off or cannot be reached. */
export function ruleAnswer(kind: StarterKind, c: AndroCase, r: Result, js: JourneyStatus, p: Progress, lang: "en" | "hi"): AskAnswer {
  const en = lang === "en";
  const used = r.rows.filter((x) => x.status === "low" || x.status === "absent").map((x) => `${x.label} ${withUnit(x.value as number, x.unit)} (limit ${x.low})`);
  const base: AskAnswer = { answer: "", basis: "record", used, nextSteps: [], askDoctor: "", urgent: r.flags.some((f) => f.urgent) };
  const ex = explainer(r, lang);
  if (kind === "meaning") return { ...base, answer: ex.slice(0, 1).join(" "), nextSteps: ex.slice(1, 3), askDoctor: en ? "What do you think is the most likely cause in my case?" : "Mere case mein sabse sambhav kaaran kya hai?" };
  if (kind === "next") {
    const did = lifestyleDone(r, p.reports);
    const todo = r.lifestyle.filter((l) => !did.has(l));
    const steps = [...(en ? todo : todo.length ? ex.filter((l) => l.startsWith("Abhi aap")) : []), did.size ? (en ? "Keep up the changes you have already made." : "Jo badlaav aapne kiye hain, unhe jaari rakhein.") : "", patientNext(js, lang)].filter(Boolean).slice(0, 4);
    return { ...base, answer: en ? "These are the next steps from your own results and your doctor's plan." : "Aapki report aur doctor ke plan ke hisaab se agle kadam yeh hain.", nextSteps: steps, askDoctor: en ? "Which of these matters most for me?" : "Inmein se mere liye sabse zaroori kya hai?" };
  }
  if (kind === "repeat") return { ...base, used: [], answer: r.repeatInMonths ? (en ? `Repeat the semen test in about ${r.repeatInMonths} months${js.repeatDue ? `, around ${niceDate(js.repeatDue)}` : ""}. Sperm take about 2 to 3 months to form, so an earlier test may not show a change. Keep 2 to 7 days without ejaculation before the test, and use the same lab if you can.` : `Lagbhag ${r.repeatInMonths} mahine baad${js.repeatDue ? `, ${niceDate(js.repeatDue)} ke aas-paas,` : ""} semen test dobara karwayein. Sperm banne mein 2 se 3 mahine lagte hain, isliye jaldi test karne par farq nahi dikhega. Test se pehle 2 se 7 din ejaculation na karein, aur ho sake to wahi lab chunein.`) : (en ? "On your current results no repeat test is planned. Your doctor will tell you if that changes." : "Abhi ki report ke hisaab se dobara test ki zaroorat nahi hai. Agar kuch badla to doctor batayenge."), askDoctor: "" };
  if (kind === "referral") return { ...base, used: js.reasons, answer: js.reasons.length ? (en ? `Your doctor is sending you to a specialist because of: ${js.reasons.join("; ")}. The specialist examines you, looks for a cause that can be treated, and plans the next step with you.` : `Doctor aapko specialist ke paas is wajah se bhej rahe hain: ${js.reasons.join("; ")}. Specialist jaanch karke aisa kaaran dhoondhte hain jiska ilaaj ho sake, aur aapke saath agla kadam tay karte hain.`) : (en ? "On your current results a specialist referral is not needed." : "Abhi ki report ke hisaab se specialist ke paas jaane ki zaroorat nahi hai."), nextSteps: [patientNext(js, lang)].filter(Boolean), askDoctor: en ? "What will the specialist check, and what should I bring?" : "Specialist kya jaanch karenge, aur mujhe kya saath laana hai?" };
  const pl = progressLines(p, lang);
  return { ...base, used: p.trends.filter((t) => t.direction && t.direction !== "same").map((t) => `${t.label} ${t.first} → ${t.last}`), answer: p.enough ? pl.slice(0, -1).join(" ") : pl[0], nextSteps: p.enough ? pl.slice(-1) : [], askDoctor: "" };
}

const LIFE_CHANGE: [string, ChangeKey][] = [["Stop smoking", "smoking"], ["Cut alcohol", "alcohol"], ["Avoid heat", "heat"], ["Lose weight", "weight"], ["Stop recreational", "drugs"], ["Stop the testosterone", "testosterone"]];
/** The lifestyle advice lines he reports having acted on, from the changes logged with his repeat reports. */
export function lifestyleDone(r: Result, reports: Report[]): Set<string> {
  const made = new Set(sortReports(reports).slice(1).flatMap((x) => x.changes));
  return new Set(r.lifestyle.filter((l) => LIFE_CHANGE.some(([start, key]) => l.startsWith(start) && made.has(key))));
}

const shiftDays = (iso: string, n: number) => { const t = new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
/**
 * The example's follow-up (fictional): a first report about three months ago, a urologist visit, three changes, and a
 * repeat report last week. The repeat report is the current one, so the summary and the explainer describe it.
 */
export function exampleFollowUp(today: string = isoDay()): { c: AndroCase; reports: Report[]; journey: Journey } {
  const first = exampleCase();
  const c = exampleCase();
  c.semen = { ...c.semen, volume: "2.6", concentration: "14", motility: "44", progressive: "31", morphology: "5" };
  c.intake = { ...c.intake, months: "17" };
  const reports: Report[] = [
    { id: "ex-1", date: shiftDays(today, -98), semen: first.semen, changes: [], medicine: "" },
    { id: "ex-2", date: shiftDays(today, -6), semen: c.semen, changes: ["smoking", "heat", "testosterone"], medicine: "" },
  ];
  const journey: Journey = { specialist: "urologist", referredOn: shiftDays(today, -96), bookedFor: shiftDays(today, -84), clinic: "Urology OPD", seenOn: shiftDays(today, -84), outcome: "Examined, no varicocele. Asked to stop the testosterone product and repeat the semen analysis in 3 months.", closedOn: "", closeNote: "" };
  return { c, reports, journey };
}
