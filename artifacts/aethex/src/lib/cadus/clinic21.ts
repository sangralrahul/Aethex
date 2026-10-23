/**
 * Update 21 on the device: the OPD queue and tokens, the dose-by-weight card (from the Cadus crash-cart
 * and formulary data), the statistics test chooser, the duty roster, and the image-quiz store and its
 * shareable page. No AI in any of this.
 */
import { CRASH_DRUGS, childDose, estimatedWeight } from "./emergency";
import { allChildDoses } from "./paeds";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const load = <T,>(key: string, fallback: T): T => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } };
const keep = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ------------------------------------------------------------------ OPD queue */

export type OpdStatus = "waiting" | "in" | "done" | "left";
export interface OpdVitals { bp: string; pulse: string; temp: string; spo2: string; weight: string; rbs: string }
export interface OpdPatient { id: string; token: number; label: string; age: string; sex: string; complaint: string; status: OpdStatus; arrivedAt: number; calledAt?: number; doneAt?: number; vitals: OpdVitals; priority?: boolean }
export interface OpdDay { date: string; patients: OpdPatient[] }
export const OPD_KEY = "cadus3.opd";
export const EMPTY_VITALS: OpdVitals = { bp: "", pulse: "", temp: "", spo2: "", weight: "", rbs: "" };

/** Today's queue; a new day starts a new queue (token 1 again). */
export function readOpd(today = localDate()): OpdDay {
  const d = load<OpdDay | null>(OPD_KEY, null);
  return d && d.date === today && Array.isArray(d.patients) ? d : { date: today, patients: [] };
}
export const saveOpd = (d: OpdDay) => keep(OPD_KEY, d);
export const nextToken = (d: OpdDay) => d.patients.reduce((m, p) => Math.max(m, p.token), 0) + 1;
export function addPatient(d: OpdDay, p: { label: string; age: string; sex: string; complaint: string; priority?: boolean }, now = Date.now()): OpdDay {
  return { ...d, patients: [...d.patients, { id: uid(), token: nextToken(d), label: p.label.slice(0, 40), age: p.age.slice(0, 5), sex: p.sex.slice(0, 1), complaint: p.complaint.slice(0, 160), status: "waiting", arrivedAt: now, vitals: { ...EMPTY_VITALS }, priority: !!p.priority }] };
}
/** The order patients are seen in: priority first, then by token. */
export const waiting = (d: OpdDay) => d.patients.filter((p) => p.status === "waiting").sort((a, b) => Number(!!b.priority) - Number(!!a.priority) || a.token - b.token);
/** Calls the next waiting patient in; whoever was in is marked seen. */
export function callNext(d: OpdDay, now = Date.now()): OpdDay {
  const next = waiting(d)[0];
  return { ...d, patients: d.patients.map((p) => (p.status === "in" ? { ...p, status: "done" as const, doneAt: now } : next && p.id === next.id ? { ...p, status: "in" as const, calledAt: now } : p)) };
}
export const setStatus = (d: OpdDay, id: string, status: OpdStatus, now = Date.now()): OpdDay =>
  ({ ...d, patients: d.patients.map((p) => (p.id === id ? { ...p, status, ...(status === "in" ? { calledAt: now } : {}), ...(status === "done" ? { doneAt: now } : {}) } : status === "in" && p.status === "in" ? { ...p, status: "done" as const, doneAt: now } : p)) });
export function opdStats(d: OpdDay, now = Date.now()) {
  const seen = d.patients.filter((p) => p.calledAt);
  const avgWait = seen.length ? Math.round(seen.reduce((s, p) => s + (p.calledAt! - p.arrivedAt), 0) / seen.length / 60000) : 0;
  const w = waiting(d);
  return { total: d.patients.length, waiting: w.length, done: d.patients.filter((p) => p.status === "done").length, avgWait, longest: w.length ? Math.round((now - Math.min(...w.map((p) => p.arrivedAt))) / 60000) : 0, current: d.patients.find((p) => p.status === "in") ?? null, next: w.slice(0, 3) };
}

/* ------------------------------------------------------------------ dose-by-weight card */

export interface DoseCard { kg: number; estimated: boolean; ageYears: number | null; ett: string; fluids: string; emergency: { name: string; indication: string; dose: string }[]; common: { name: string; dose: string; frequency: string; max?: string }[]; adult: boolean }
/** Maintenance fluids by Holliday-Segar (4-2-1): mL/h. */
export const maintenanceMlH = (kg: number) => Math.round(kg <= 10 ? 4 * kg : kg <= 20 ? 40 + 2 * (kg - 10) : 60 + (kg - 20));
export function doseCard(opts: { kg?: number; ageYears?: number | null }): DoseCard | null {
  const age = opts.ageYears ?? null;
  const kg = opts.kg && opts.kg > 0 ? opts.kg : age !== null && age >= 0 ? estimatedWeight(age) : 0;
  if (!(kg > 0)) return null;
  const adult = kg >= 50 || (age !== null && age >= 14);
  const ett = age === null ? "Give the age for the tube size" : age < 1 ? "3.0–3.5 (term infant 3.5)" : age <= 12 ? `Uncuffed ${Math.round((age / 4 + 4) * 2) / 2}, cuffed ${Math.round((age / 4 + 3.5) * 2) / 2}; at the lips about ${Math.round(age / 2 + 12)} cm` : "Adult: 7.0–7.5 (women), 8.0 (men)";
  return {
    kg, estimated: !(opts.kg && opts.kg > 0), ageYears: age, ett, adult,
    fluids: `${maintenanceMlH(kg)} mL/h maintenance (4-2-1 rule; ${Math.round(maintenanceMlH(kg) * 24)} mL a day); bolus ${Math.round(10 * kg)}–${Math.round(20 * kg)} mL (10–20 mL/kg) over 5–20 min, reassess after each`,
    emergency: CRASH_DRUGS.filter((d) => d.name !== "Endotracheal tube").map((d) => ({ name: d.name, indication: d.indication, dose: adult ? d.adult : childDose(d, kg) })),
    common: adult ? [] : allChildDoses(kg).map((c) => ({ name: c.name, dose: c.doses.map((x) => x.label).join(" to "), frequency: c.frequency, max: c.max })),
  };
}
export function doseCardMarkdown(c: DoseCard, label = ""): string {
  const head = `# Doses for ${c.kg} kg${c.estimated ? " (estimated from age)" : ""}${label ? `: ${label}` : ""}`;
  return [
    head, "",
    c.ageYears !== null ? `**Age:** ${c.ageYears} years · **Weight:** ${c.kg} kg${c.estimated ? " (estimated: weigh as soon as you can)" : ""}` : `**Weight:** ${c.kg} kg`, "",
    `**Endotracheal tube:** ${c.ett}  \n**Fluids:** ${c.fluids}`, "",
    "## Emergency drugs", "| Drug | For | Dose |", "|---|---|---|",
    ...c.emergency.map((d) => `| ${d.name} | ${d.indication} | **${d.dose.replace(/\|/g, "/")}** |`), "",
    ...(c.common.length ? ["## Common medicines", "| Medicine | Dose | How often | Max |", "|---|---|---|---|", ...c.common.map((d) => `| ${d.name} | ${d.dose} | ${d.frequency} | ${d.max ?? ""} |`), ""] : []),
    "_From the Cadus formulary and crash-cart data. Check every dose against the drug's concentration and your local protocol before giving it._",
  ].join("\n");
}

/* ------------------------------------------------------------------ statistics test chooser */

export type StatGoal = "compare" | "relate" | "predict" | "agree" | "diagnostic" | "survival";
export type StatOutcome = "normal" | "skewed" | "binary" | "nominal" | "time";
export interface StatChoice { test: string; also: string[]; why: string; spss: string; report: string; assumptions: string[] }
export function chooseTest(o: { goal: StatGoal; outcome: StatOutcome; groups?: 2 | 3; paired?: boolean; small?: boolean; rater?: "categorical" | "continuous" }): StatChoice {
  const C = (test: string, why: string, spss: string, report: string, assumptions: string[] = [], also: string[] = []): StatChoice => ({ test, why, spss, report, assumptions, also });
  if (o.goal === "survival" || o.outcome === "time") {
    return C("Kaplan–Meier curves with the log-rank test", "Time until an event, with people followed for different lengths of time (censoring).", "Analyze › Survival › Kaplan-Meier (Compare Factor › Log rank)", "Median survival with 95% CI in each group, the log-rank p value; hazard ratio with 95% CI from Cox regression when adjusting.", ["Censoring unrelated to the outcome", "Proportional hazards for Cox regression"], ["Cox proportional hazards regression to adjust for other factors (Analyze › Survival › Cox Regression)"]);
  }
  if (o.goal === "diagnostic") return C("Sensitivity, specificity, PPV, NPV and likelihood ratios; ROC curve with AUC", "How well a test identifies people with and without the condition against a reference standard.", "Analyze › Descriptive Statistics › Crosstabs (2×2 against the reference); Analyze › Classify › ROC Curve", "Each measure with its 95% CI, and the AUC with 95% CI for a continuous test, with the cut-off chosen.", ["A sound reference standard applied to everyone"]);
  if (o.goal === "agree") {
    return o.rater === "continuous"
      ? C("Bland–Altman analysis and the intraclass correlation coefficient (ICC)", "Agreement between two methods or observers measuring the same continuous quantity.", "Analyze › Scale › Reliability Analysis (Statistics › Intraclass correlation coefficient); Bland–Altman plot by hand or in a graph", "Mean difference (bias) with 95% limits of agreement; ICC with 95% CI and the model used.", ["Differences roughly normal for the limits of agreement"], ["Correlation is not agreement: don't use Pearson's r for this"])
      : C("Cohen's kappa (weighted kappa for ordered categories)", "Agreement beyond chance between two raters on categories.", "Analyze › Descriptive Statistics › Crosstabs › Statistics › Kappa", "Kappa with 95% CI and percentage agreement.", [], ["Fleiss' kappa for more than two raters"]);
  }
  if (o.goal === "predict") {
    if (o.outcome === "normal" || o.outcome === "skewed") return C("Multiple linear regression", "A continuous outcome predicted from several variables at once.", "Analyze › Regression › Linear", "Each coefficient (B) with 95% CI and p value, and adjusted R².", ["Linear relationships", "Normally distributed residuals with constant variance", "No strong multicollinearity"], ["Transform a skewed outcome (e.g. log) or use a generalised linear model"]);
    if (o.outcome === "binary") return C("Binary logistic regression", "A yes/no outcome predicted from several variables at once.", "Analyze › Regression › Binary Logistic", "Adjusted odds ratios with 95% CI and p values; model fit (Hosmer–Lemeshow) and AUC.", ["About 10 events per variable in the model", "No strong multicollinearity"]);
    return C("Multinomial (or ordinal) logistic regression", "An outcome with more than two categories predicted from several variables.", "Analyze › Regression › Multinomial Logistic (or Ordinal)", "Odds ratios with 95% CI for each category against the reference.", ["Enough events in each category"]);
  }
  if (o.goal === "relate") {
    if (o.outcome === "normal") return C("Pearson's correlation", "The linear relationship between two continuous, roughly normal variables.", "Analyze › Correlate › Bivariate (Pearson)", "r with 95% CI and p value, with a scatter plot.", ["Both variables roughly normal", "A linear relationship", "No big outliers"], ["Spearman's rho if either is skewed or ordinal"]);
    if (o.outcome === "skewed") return C("Spearman's rank correlation", "The relationship between two variables when either is skewed or ordinal.", "Analyze › Correlate › Bivariate (Spearman)", "rho with p value, with a scatter plot.", ["A monotonic relationship"]);
    return C("Chi-square test of association, with Cramér's V", "Whether two categorical variables are associated.", "Analyze › Descriptive Statistics › Crosstabs (Statistics › Chi-square, Phi and Cramér's V)", "Counts and percentages in each cell, χ² with degrees of freedom and p value, and Cramér's V.", ["Expected count of at least 5 in most cells (otherwise Fisher's exact test)"]);
  }
  // compare groups
  const g3 = o.groups === 3;
  if (o.outcome === "normal") {
    if (o.paired) return g3
      ? C("Repeated-measures ANOVA", "The same people measured three or more times (or under three or more conditions), continuous normal outcome.", "Analyze › General Linear Model › Repeated Measures", "Means (SD) at each time, F with degrees of freedom and p value; pairwise comparisons with Bonferroni correction.", ["Normal differences", "Sphericity (Mauchly's test; Greenhouse–Geisser if violated)"], ["Friedman test if not normal"])
      : C("Paired t-test", "The same people measured twice (before and after), continuous normal outcome.", "Analyze › Compare Means › Paired-Samples T Test", "Mean difference with 95% CI, t, degrees of freedom and p value.", ["The differences are roughly normal"], ["Wilcoxon signed-rank test if not normal"]);
    return g3
      ? C("One-way ANOVA", "Three or more independent groups, continuous normal outcome.", "Analyze › Compare Means › One-Way ANOVA (Post Hoc › Tukey)", "Means (SD) by group, F with degrees of freedom and p value; post hoc comparisons (Tukey).", ["Normal in each group", "Similar variances (Levene's test; Welch ANOVA if not)", "Independent observations"], ["Kruskal–Wallis test if not normal"])
      : C("Independent-samples t-test", "Two independent groups, continuous normal outcome.", "Analyze › Compare Means › Independent-Samples T Test", "Mean (SD) in each group, the mean difference with 95% CI, t, degrees of freedom and p value.", ["Roughly normal in each group (Shapiro–Wilk for small samples)", "Similar variances (Levene's test; use the Welch row if not)", "Independent observations"], ["Mann–Whitney U test if not normal"]);
  }
  if (o.outcome === "skewed") {
    if (o.paired) return g3
      ? C("Friedman test", "The same people measured three or more times, skewed or ordinal outcome.", "Analyze › Nonparametric Tests › Legacy Dialogs › K Related Samples (Friedman)", "Medians (IQR) at each time, χ² and p value; pairwise Wilcoxon tests with Bonferroni correction.")
      : C("Wilcoxon signed-rank test", "The same people measured twice, skewed or ordinal outcome.", "Analyze › Nonparametric Tests › Legacy Dialogs › 2 Related Samples (Wilcoxon)", "Median (IQR) before and after, Z and p value.");
    return g3
      ? C("Kruskal–Wallis test", "Three or more independent groups, skewed or ordinal outcome.", "Analyze › Nonparametric Tests › Legacy Dialogs › K Independent Samples (Kruskal-Wallis H)", "Median (IQR) by group, H with degrees of freedom and p value; post hoc Dunn's test.")
      : C("Mann–Whitney U test", "Two independent groups, skewed or ordinal outcome.", "Analyze › Nonparametric Tests › Legacy Dialogs › 2 Independent Samples (Mann-Whitney U)", "Median (IQR) in each group, U (or Z) and p value.");
  }
  // categorical outcome
  if (o.paired) return g3
    ? C("Cochran's Q test", "A yes/no outcome in the same people under three or more conditions.", "Analyze › Nonparametric Tests › Legacy Dialogs › K Related Samples (Cochran's Q)", "Proportions under each condition, Q and p value.")
    : C("McNemar's test", "A yes/no outcome in the same people measured twice (or matched pairs).", "Analyze › Descriptive Statistics › Crosstabs (Statistics › McNemar)", "The 2×2 table of paired results, and the p value.");
  return o.small
    ? C("Fisher's exact test", "Categories compared between independent groups when expected counts are small (any cell under 5).", "Analyze › Descriptive Statistics › Crosstabs (Statistics › Chi-square; read the Fisher's Exact Test row)", "Counts and percentages by group and the exact p value; odds ratio or risk ratio with 95% CI for a 2×2 table.")
    : C("Chi-square test", "Categories (such as yes/no) compared between independent groups.", "Analyze › Descriptive Statistics › Crosstabs (Statistics › Chi-square; Cells › Row percentages)", "Counts and percentages by group, χ² with degrees of freedom and p value; risk ratio or odds ratio with 95% CI for a 2×2 table.", ["Expected count of at least 5 in most cells (otherwise Fisher's exact test)", "Independent observations"]);
}

/* ------------------------------------------------------------------ duty roster */

export interface RosterInput { people: string[]; start: string; days: number; perDay: number; unavailable: Record<string, string[]>; noBackToBack: boolean }
export interface Roster { dates: string[]; slots: string[][]; counts: Record<string, { total: number; weekend: number }>; gaps: string[] }
const addDays = (iso: string, n: number) => { const [y, m, d] = iso.split("-").map(Number); return localDate(new Date(y, m - 1, d + n)); };
export const isWeekend = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); const w = new Date(y, m - 1, d).getDay(); return w === 0 || w === 6; };
/** A fair on-call roster: each day goes to whoever has the fewest duties (weekends balanced separately), never on a day they're away, and not two nights running when that's asked for. */
export function makeRoster(r: RosterInput): Roster {
  const people = [...new Set(r.people.map((p) => p.trim()).filter(Boolean))].slice(0, 40);
  const counts: Roster["counts"] = Object.fromEntries(people.map((p) => [p, { total: 0, weekend: 0 }]));
  const dates = Array.from({ length: Math.max(1, Math.min(62, r.days)) }, (_, i) => addDays(r.start, i));
  const slots: string[][] = [];
  const gaps: string[] = [];
  dates.forEach((date, i) => {
    const prev = i ? slots[i - 1] : [];
    const we = isWeekend(date);
    const today: string[] = [];
    for (let k = 0; k < Math.max(1, r.perDay); k++) {
      const pool = people.filter((p) => !today.includes(p) && !(r.unavailable[p] ?? []).includes(date) && !(r.noBackToBack && prev.includes(p)));
      if (!pool.length) { gaps.push(date); continue; }
      pool.sort((a, b) => (we ? counts[a].weekend - counts[b].weekend : 0) || counts[a].total - counts[b].total || people.indexOf(a) - people.indexOf(b));
      const p = pool[0];
      today.push(p);
      counts[p].total++;
      if (we) counts[p].weekend++;
    }
    slots.push(today);
  });
  return { dates, slots, counts, gaps: [...new Set(gaps)] };
}
export function rosterCsv(r: Roster): string {
  return ["Date,Day,On call", ...r.dates.map((d, i) => `${d},${new Date(`${d}T00:00`).toLocaleDateString("en-IN", { weekday: "short" })},"${r.slots[i].join(" / ")}"`)].join("\n");
}

/* ------------------------------------------------------------------ image quiz store and shareable page */

export interface ImageQuizSet { id: string; at: number; title: string; images: string[]; questions: { image: number; q: string; options: string[]; answer: number; explain: string }[] }
const DB = "cadus-imagequiz";
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("sets", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
export async function saveQuizSet(s: ImageQuizSet) { const d = await db(); await new Promise<void>((res, rej) => { const t = d.transaction("sets", "readwrite"); t.objectStore("sets").put(s); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }
export async function listQuizSets(): Promise<ImageQuizSet[]> {
  try { const d = await db(); return (await new Promise<ImageQuizSet[]>((res, rej) => { const r = d.transaction("sets").objectStore("sets").getAll(); r.onsuccess = () => res(r.result as ImageQuizSet[]); r.onerror = () => rej(r.error); })).sort((a, b) => b.at - a.at); } catch { return []; }
}
export async function deleteQuizSet(id: string) { const d = await db(); await new Promise<void>((res) => { const t = d.transaction("sets", "readwrite"); t.objectStore("sets").delete(id); t.oncomplete = () => res(); t.onerror = () => res(); }); }
export const newQuizSet = (title: string, images: string[], questions: ImageQuizSet["questions"]): ImageQuizSet => ({ id: uid(), at: Date.now(), title, images, questions });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** A self-contained page (images inside) to send to a batch: answer each question, see the explanation and a score. */
export function quizHtml(s: ImageQuizSet): string {
  const qs = s.questions.map((q, i) => `<section class="q" data-a="${q.answer}"><img src="${s.images[q.image - 1] ?? ""}" alt="Image ${q.image}"><p><b>Q${i + 1}.</b> ${esc(q.q)}</p>${q.options.map((o, k) => `<button data-k="${k}"><span>${"ABCD"[k]}</span>${esc(o)}</button>`).join("")}<p class="ex" hidden>${esc(q.explain)}</p></section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(s.title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;background:#faf9f6;color:#1c1b19}h1{font-size:22px}.q{background:#fff;border:1px solid #e5e2da;border-radius:12px;padding:14px;margin:14px 0}img{max-width:100%;border-radius:8px;display:block;margin:0 auto 10px}button{display:flex;gap:10px;align-items:center;width:100%;text-align:left;margin:6px 0;padding:10px;border:1px solid #e5e2da;border-radius:10px;background:#fff;font:inherit;cursor:pointer}button span{font-weight:700}.right{border-color:#15803d;background:#ecfdf3}.wrong{border-color:#b91c1c;background:#fef2f2}.ex{background:#f3f1ec;padding:10px;border-radius:10px}#score{position:sticky;bottom:0;background:#1c1b19;color:#fff;padding:10px 14px;border-radius:10px;text-align:center}</style></head><body><h1>${esc(s.title)}</h1><p>${s.questions.length} questions. Made with Cadus.</p>${qs}<p id="score">Answer the questions to see your score</p><script>var n=0,c=0,t=${s.questions.length};document.querySelectorAll('.q').forEach(function(q){q.querySelectorAll('button').forEach(function(b){b.onclick=function(){if(q.dataset.done)return;q.dataset.done=1;n++;var a=+q.dataset.a,k=+b.dataset.k;if(a===k)c++;q.querySelectorAll('button')[a].className='right';if(a!==k)b.className='wrong';q.querySelector('.ex').hidden=false;document.getElementById('score').textContent='Score: '+c+' / '+n+(n===t?' (done)':'');};});});</script></body></html>`;
}
