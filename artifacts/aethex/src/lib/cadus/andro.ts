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
