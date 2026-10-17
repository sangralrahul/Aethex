/**
 * Thesis kit: sample-size formulas for MD/MS/DNB theses and research protocols,
 * and a statistical-test chooser. Everything is computed in the browser from
 * the standard formulas below (no AI), with a paragraph ready for the
 * "Sample size" section of a protocol.
 */

/* ------------------------------------------------------------------ normal distribution */

/** The standard normal quantile (inverse CDF): Acklam's algorithm, relative error below 1.2e-9. */
export function normInv(p: number): number {
  if (!(p > 0 && p < 1)) return NaN;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425, hi = 1 - lo;
  let x: number;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= hi) {
    const q = p - 0.5, r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  return x;
}

/** z for a significance level: two-sided uses α/2. */
export const zAlpha = (alpha: number, twoSided = true) => normInv(1 - (twoSided ? alpha / 2 : alpha));
/** z for power (1 − β). */
export const zBeta = (power: number) => normInv(power);

/* ------------------------------------------------------------------ calculators */

export type SampleId = "prop" | "mean" | "twoprop" | "twomean" | "corr" | "casecontrol" | "diag";

export interface SampleField {
  id: string;
  label: string;
  /** Shown as a percentage (0-100) but stored as a proportion. */
  pct?: boolean;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  optional?: boolean;
  def?: number;
}

export interface SampleResult {
  /** The headline, e.g. "323 participants" or "97 per group". */
  value: string;
  /** Total to recruit after adding for non-response and design effect. */
  recruit: number;
  /** Unrounded and intermediate values for the working. */
  working: string[];
  /** A ready paragraph for the protocol. */
  paragraph: string;
}

export interface SampleCalc {
  id: SampleId;
  name: string;
  use: string;
  fields: SampleField[];
  formula: string;
  source: string;
  compute: (v: Record<string, number | undefined>) => SampleResult | null;
}

const ALPHA: SampleField = { id: "alpha", label: "Significance level (α, two-sided)", min: 0.001, max: 0.2, step: 0.01, def: 0.05, hint: "0.05 gives 95% confidence" };
const POWER: SampleField = { id: "power", label: "Power (1 − β)", pct: true, min: 0.5, max: 0.99, step: 0.01, def: 0.8, hint: "80% is the usual minimum; 90% for confirmatory studies" };
const DROPOUT: SampleField = { id: "drop", label: "Expected non-response or loss to follow-up", pct: true, min: 0, max: 0.6, step: 0.01, def: 0.1, optional: true };
const DEFF: SampleField = { id: "deff", label: "Design effect (cluster sampling)", min: 1, max: 5, step: 0.1, def: 1, optional: true, hint: "1 for simple random sampling; often 1.5 to 2 for cluster surveys" };

const ceil = (x: number) => Math.ceil(x - 1e-9);
const pct = (x: number, dp = 0) => `${(x * 100).toFixed(dp)}%`;
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);
const conf = (alpha: number) => `${Math.round((1 - alpha) * 1000) / 10}%`;

/** Add for non-response and design effect: n × DE ÷ (1 − loss). */
export function inflate(n: number, drop = 0, deff = 1): number {
  const d = Math.min(0.95, Math.max(0, drop || 0));
  const e = Math.max(1, deff || 1);
  return ceil((n * e) / (1 - d));
}
const extra = (n: number, v: Record<string, number | undefined>) => {
  const drop = v.drop ?? 0, deff = v.deff ?? 1;
  const total = inflate(n, drop, deff);
  const bits: string[] = [];
  if (deff > 1) bits.push(`a design effect of ${deff}`);
  if (drop > 0) bits.push(`${pct(drop)} non-response`);
  return { total, note: bits.length ? ` Allowing for ${bits.join(" and ")}, ${total} will be recruited.` : "" };
};

const valid = (...xs: (number | undefined)[]) => xs.every((x) => typeof x === "number" && Number.isFinite(x));

export const SAMPLE_CALCS: SampleCalc[] = [
  {
    id: "prop",
    name: "Single proportion",
    use: "Prevalence or proportion studies (cross-sectional surveys)",
    fields: [
      { id: "p", label: "Expected proportion (prevalence)", pct: true, min: 0.001, max: 0.999, step: 0.01, def: 0.3, hint: "From a previous study or pilot; use 50% if unknown" },
      { id: "d", label: "Absolute precision (margin of error)", pct: true, min: 0.001, max: 0.5, step: 0.01, def: 0.05, hint: "±5% is common; use about a fifth of p when p is small" },
      ALPHA,
      { id: "N", label: "Population size (finite population)", min: 1, step: 1, optional: true, hint: "Leave empty for a large population" },
      DROPOUT,
      DEFF,
    ],
    formula: "n = Z²(1−α/2) × p(1 − p) ÷ d²; finite population: n′ = n ÷ (1 + (n − 1) ÷ N)",
    source: "Lwanga SK, Lemeshow S. Sample size determination in health studies. WHO, 1991; Daniel WW. Biostatistics (7th ed.)",
    compute: (v) => {
      const { p, d, alpha } = v;
      if (!valid(p, d, alpha) || p! <= 0 || p! >= 1 || d! <= 0 || alpha! <= 0 || alpha! >= 1) return null;
      const z = zAlpha(alpha!);
      const n0 = (z * z * p! * (1 - p!)) / (d! * d!);
      const N = v.N && v.N > 0 ? v.N : undefined;
      const n = N ? n0 / (1 + (n0 - 1) / N) : n0;
      const base = ceil(n);
      const { total, note } = extra(base, v);
      return {
        value: `${base} participants`,
        recruit: total,
        working: [`Z = ${f3(z)}`, `n = ${f3(z)}² × ${f3(p!)} × ${f3(1 - p!)} ÷ ${f3(d!)}² = ${f2(n0)}`, ...(N ? [`Finite population (N = ${N}): ${f2(n)}`] : [])],
        paragraph: `Assuming an expected proportion of ${pct(p!, 1)}, an absolute precision of ${pct(d!, 1)} and a confidence level of ${conf(alpha!)}${N ? `, with a finite population correction for N = ${N}` : ""}, the minimum sample size is ${base} (n = Z² × p(1 − p) ÷ d²).${note}`,
      };
    },
  },
  {
    id: "mean",
    name: "Single mean",
    use: "Estimating a mean, e.g. average haemoglobin in a population",
    fields: [
      { id: "sd", label: "Expected standard deviation (σ)", min: 0.0001, step: 0.1, def: 1.5, hint: "From a previous study or pilot, in the outcome's units" },
      { id: "d", label: "Absolute precision (± in the same units)", min: 0.0001, step: 0.1, def: 0.3 },
      ALPHA,
      DROPOUT,
    ],
    formula: "n = (Z(1−α/2) × σ ÷ d)²",
    source: "Lwanga SK, Lemeshow S. Sample size determination in health studies. WHO, 1991",
    compute: (v) => {
      const { sd, d, alpha } = v;
      if (!valid(sd, d, alpha) || sd! <= 0 || d! <= 0 || alpha! <= 0 || alpha! >= 1) return null;
      const z = zAlpha(alpha!);
      const n = ((z * sd!) / d!) ** 2;
      const base = ceil(n);
      const { total, note } = extra(base, v);
      return {
        value: `${base} participants`,
        recruit: total,
        working: [`Z = ${f3(z)}`, `n = (${f3(z)} × ${sd} ÷ ${d})² = ${f2(n)}`],
        paragraph: `Assuming a standard deviation of ${sd} and a desired precision of ±${d} at a ${conf(alpha!)} confidence level, the minimum sample size is ${base} (n = (Z × σ ÷ d)²).${note}`,
      };
    },
  },
  {
    id: "twoprop",
    name: "Comparing two proportions",
    use: "Randomised trials and cohort studies with a yes/no outcome",
    fields: [
      { id: "p1", label: "Expected proportion in group 1 (e.g. control)", pct: true, min: 0.001, max: 0.999, step: 0.01, def: 0.4 },
      { id: "p2", label: "Expected proportion in group 2 (e.g. intervention)", pct: true, min: 0.001, max: 0.999, step: 0.01, def: 0.2 },
      ALPHA,
      POWER,
      { id: "ratio", label: "Allocation ratio (group 2 : group 1)", min: 0.1, max: 10, step: 0.1, def: 1, optional: true },
      { id: "cc", label: "Continuity correction (1 = yes, 0 = no)", min: 0, max: 1, step: 1, def: 1, optional: true, hint: "Fleiss correction, recommended for small samples" },
      DROPOUT,
    ],
    formula: "n₁ = [Z(1−α/2)√((1 + 1/r) p̄q̄) + Z(1−β)√(p₁q₁ + p₂q₂/r)]² ÷ (p₁ − p₂)², p̄ = (p₁ + r p₂) ÷ (1 + r), n₂ = r n₁; with continuity correction n′ = n/4 × [1 + √(1 + 2(r + 1) ÷ (n r |p₁ − p₂|))]²",
    source: "Fleiss JL, Levin B, Paik MC. Statistical Methods for Rates and Proportions, 3rd ed. Wiley, 2003",
    compute: (v) => {
      const { p1, p2, alpha, power } = v;
      const r = v.ratio && v.ratio > 0 ? v.ratio : 1;
      if (!valid(p1, p2, alpha, power) || p1 === p2 || p1! <= 0 || p1! >= 1 || p2! <= 0 || p2! >= 1 || power! <= 0 || power! >= 1) return null;
      const za = zAlpha(alpha!), zb = zBeta(power!);
      const pbar = (p1! + r * p2!) / (1 + r), qbar = 1 - pbar;
      const diff = Math.abs(p1! - p2!);
      const n = (za * Math.sqrt((1 + 1 / r) * pbar * qbar) + zb * Math.sqrt(p1! * (1 - p1!) + (p2! * (1 - p2!)) / r)) ** 2 / diff ** 2;
      const cc = (v.cc ?? 1) >= 0.5;
      const nc = cc ? (n / 4) * (1 + Math.sqrt(1 + (2 * (r + 1)) / (n * r * diff))) ** 2 : n;
      const n1 = ceil(nc), n2 = ceil(nc * r);
      const total = n1 + n2;
      const drop = v.drop ?? 0;
      const recruit = inflate(n1, drop) + inflate(n2, drop);
      return {
        value: r === 1 ? `${n1} per group (${total} in total)` : `${n1} in group 1 and ${n2} in group 2 (${total} in total)`,
        recruit,
        working: [`Z(α) = ${f3(za)}, Z(β) = ${f3(zb)}`, `p̄ = ${f3(pbar)}`, `n₁ without correction = ${f2(n)}`, ...(cc ? [`With continuity correction = ${f2(nc)}`] : [])],
        paragraph: `To detect a difference between ${pct(p1!, 1)} and ${pct(p2!, 1)} with ${pct(power!)} power at a two-sided significance level of ${alpha}, ${r === 1 ? `${n1} participants are needed in each group` : `${n1} participants are needed in group 1 and ${n2} in group 2`} (${total} in total; Fleiss formula${cc ? " with continuity correction" : ""}).${drop > 0 ? ` Allowing for ${pct(drop)} loss to follow-up, ${recruit} will be recruited.` : ""}`,
      };
    },
  },
  {
    id: "twomean",
    name: "Comparing two means",
    use: "Trials and studies with a continuous outcome (e.g. blood pressure, HbA1c)",
    fields: [
      { id: "sd", label: "Standard deviation of the outcome (σ, assumed equal)", min: 0.0001, step: 0.1, def: 10 },
      { id: "diff", label: "Smallest difference worth detecting (Δ)", min: 0.0001, step: 0.1, def: 5, hint: "The minimal clinically important difference, in the outcome's units" },
      ALPHA,
      POWER,
      { id: "ratio", label: "Allocation ratio (group 2 : group 1)", min: 0.1, max: 10, step: 0.1, def: 1, optional: true },
      DROPOUT,
    ],
    formula: "n₁ = (1 + 1/r) σ² (Z(1−α/2) + Z(1−β))² ÷ Δ², n₂ = r n₁",
    source: "Chow SC, Shao J, Wang H. Sample Size Calculations in Clinical Research, 2nd ed. Chapman & Hall, 2008",
    compute: (v) => {
      const { sd, diff, alpha, power } = v;
      const r = v.ratio && v.ratio > 0 ? v.ratio : 1;
      if (!valid(sd, diff, alpha, power) || sd! <= 0 || diff! <= 0 || power! <= 0 || power! >= 1) return null;
      const za = zAlpha(alpha!), zb = zBeta(power!);
      const n = ((1 + 1 / r) * sd! ** 2 * (za + zb) ** 2) / diff! ** 2;
      const n1 = ceil(n), n2 = ceil(n * r);
      const drop = v.drop ?? 0;
      const recruit = inflate(n1, drop) + inflate(n2, drop);
      return {
        value: r === 1 ? `${n1} per group (${n1 + n2} in total)` : `${n1} in group 1 and ${n2} in group 2 (${n1 + n2} in total)`,
        recruit,
        working: [`Z(α) = ${f3(za)}, Z(β) = ${f3(zb)}`, `Effect size (Δ/σ) = ${f2(diff! / sd!)}`, `n₁ = ${f2(n)}`],
        paragraph: `To detect a difference of ${diff} between the group means, assuming a standard deviation of ${sd}, with ${pct(power!)} power at a two-sided significance level of ${alpha}, ${r === 1 ? `${n1} participants are needed in each group` : `${n1} are needed in group 1 and ${n2} in group 2`} (${n1 + n2} in total).${drop > 0 ? ` Allowing for ${pct(drop)} loss to follow-up, ${recruit} will be recruited.` : ""}`,
      };
    },
  },
  {
    id: "corr",
    name: "Correlation",
    use: "Testing whether two continuous variables are correlated",
    fields: [
      { id: "r", label: "Expected correlation coefficient (r)", min: -0.99, max: 0.99, step: 0.05, def: 0.3 },
      ALPHA,
      POWER,
      DROPOUT,
    ],
    formula: "n = [(Z(1−α/2) + Z(1−β)) ÷ C]² + 3, C = ½ ln((1 + r) ÷ (1 − r))",
    source: "Hulley SB et al. Designing Clinical Research, 4th ed. Lippincott, 2013",
    compute: (v) => {
      const { r, alpha, power } = v;
      if (!valid(r, alpha, power) || r === 0 || Math.abs(r!) >= 1 || power! <= 0 || power! >= 1) return null;
      const za = zAlpha(alpha!), zb = zBeta(power!);
      const C = 0.5 * Math.log((1 + Math.abs(r!)) / (1 - Math.abs(r!)));
      const n = ((za + zb) / C) ** 2 + 3;
      const base = ceil(n);
      const { total, note } = extra(base, v);
      return {
        value: `${base} participants`,
        recruit: total,
        working: [`Z(α) = ${f3(za)}, Z(β) = ${f3(zb)}`, `C = ${f3(C)}`, `n = ${f2(n)}`],
        paragraph: `To detect a correlation coefficient of ${r} with ${pct(power!)} power at a two-sided significance level of ${alpha}, ${base} participants are needed.${note}`,
      };
    },
  },
  {
    id: "casecontrol",
    name: "Case-control (odds ratio)",
    use: "Unmatched case-control studies of an exposure",
    fields: [
      { id: "p0", label: "Proportion of controls exposed", pct: true, min: 0.001, max: 0.999, step: 0.01, def: 0.3 },
      { id: "or", label: "Odds ratio worth detecting", min: 0.01, max: 50, step: 0.1, def: 2 },
      ALPHA,
      POWER,
      { id: "ratio", label: "Controls per case", min: 0.25, max: 10, step: 1, def: 1, optional: true },
      { id: "cc", label: "Continuity correction (1 = yes, 0 = no)", min: 0, max: 1, step: 1, def: 1, optional: true },
    ],
    formula: "p₁ = OR p₀ ÷ (1 + p₀(OR − 1)); cases n = [Z(1−α/2)√((1 + 1/r) p̄q̄) + Z(1−β)√(p₁q₁ + p₀q₀/r)]² ÷ (p₁ − p₀)², p̄ = (p₁ + r p₀) ÷ (1 + r); controls = r n; Fleiss continuity correction",
    source: "Fleiss JL et al. Statistical Methods for Rates and Proportions, 3rd ed. 2003; Schlesselman JJ. Case-Control Studies. Oxford, 1982",
    compute: (v) => {
      const { p0, or, alpha, power } = v;
      const r = v.ratio && v.ratio > 0 ? v.ratio : 1;
      if (!valid(p0, or, alpha, power) || p0! <= 0 || p0! >= 1 || or! <= 0 || or === 1 || power! <= 0 || power! >= 1) return null;
      const p1 = (or! * p0!) / (1 + p0! * (or! - 1));
      const za = zAlpha(alpha!), zb = zBeta(power!);
      const pbar = (p1 + r * p0!) / (1 + r), qbar = 1 - pbar;
      const diff = Math.abs(p1 - p0!);
      const n = (za * Math.sqrt((1 + 1 / r) * pbar * qbar) + zb * Math.sqrt(p1 * (1 - p1) + (p0! * (1 - p0!)) / r)) ** 2 / diff ** 2;
      const cc = (v.cc ?? 1) >= 0.5;
      const nc = cc ? (n / 4) * (1 + Math.sqrt(1 + (2 * (r + 1)) / (n * r * diff))) ** 2 : n;
      const cases = ceil(nc), controls = ceil(nc * r);
      return {
        value: `${cases} cases and ${controls} controls`,
        recruit: cases + controls,
        working: [`Expected exposure in cases p₁ = ${pct(p1, 1)}`, `Z(α) = ${f3(za)}, Z(β) = ${f3(zb)}`, `Cases without correction = ${f2(n)}`, ...(cc ? [`With continuity correction = ${f2(nc)}`] : [])],
        paragraph: `Assuming ${pct(p0!, 1)} of controls are exposed, to detect an odds ratio of ${or} (${pct(p1, 1)} exposure among cases) with ${pct(power!)} power at a two-sided significance level of ${alpha}, ${cases} cases and ${controls} controls are needed (${r === 1 ? "one control per case" : `${r} controls per case`}; Fleiss formula${cc ? " with continuity correction" : ""}).`,
      };
    },
  },
  {
    id: "diag",
    name: "Diagnostic accuracy",
    use: "Estimating the sensitivity and specificity of a test",
    fields: [
      { id: "se", label: "Expected sensitivity", pct: true, min: 0.01, max: 0.999, step: 0.01, def: 0.9 },
      { id: "sp", label: "Expected specificity", pct: true, min: 0.01, max: 0.999, step: 0.01, def: 0.85 },
      { id: "prev", label: "Prevalence of the disease in the study population", pct: true, min: 0.001, max: 0.999, step: 0.01, def: 0.2 },
      { id: "d", label: "Precision (± for sensitivity and specificity)", pct: true, min: 0.005, max: 0.3, step: 0.01, def: 0.05 },
      ALPHA,
      DROPOUT,
    ],
    formula: "Cases for sensitivity = Z² Se(1 − Se) ÷ d², total = cases ÷ prevalence; non-cases for specificity = Z² Sp(1 − Sp) ÷ d², total = non-cases ÷ (1 − prevalence); use the larger total",
    source: "Buderer NM. Acad Emerg Med 1996;3:895-900; Hajian-Tilaki K. J Biomed Inform 2014;48:193-204",
    compute: (v) => {
      const { se, sp, prev, d, alpha } = v;
      if (!valid(se, sp, prev, d, alpha) || [se, sp, prev].some((x) => x! <= 0 || x! >= 1) || d! <= 0) return null;
      const z = zAlpha(alpha!);
      const cases = (z * z * se! * (1 - se!)) / d! ** 2;
      const non = (z * z * sp! * (1 - sp!)) / d! ** 2;
      const nSe = cases / prev!, nSp = non / (1 - prev!);
      const base = ceil(Math.max(nSe, nSp));
      const { total, note } = extra(base, v);
      return {
        value: `${base} participants`,
        recruit: total,
        working: [`Z = ${f3(z)}`, `Cases needed for sensitivity = ${f2(cases)}, so total = ${f2(nSe)}`, `Non-cases needed for specificity = ${f2(non)}, so total = ${f2(nSp)}`],
        paragraph: `With an expected sensitivity of ${pct(se!)} and specificity of ${pct(sp!)}, a disease prevalence of ${pct(prev!)}, a precision of ±${pct(d!)} and ${conf(alpha!)} confidence, ${base} participants are needed (Buderer's method; the larger of the totals for sensitivity and specificity).${note}`,
      };
    },
  },
];

export const SAMPLE_BY_ID = Object.fromEntries(SAMPLE_CALCS.map((c) => [c.id, c])) as Record<SampleId, SampleCalc>;

/** Default inputs for a calculator. */
export function sampleDefaults(c: SampleCalc): Record<string, number | undefined> {
  return Object.fromEntries(c.fields.filter((f) => f.def !== undefined).map((f) => [f.id, f.def]));
}

/* ------------------------------------------------------------------ choosing a statistical test */

export type Goal = "compare" | "relate" | "predict" | "survival";
export type Outcome = "normal" | "skewed" | "binary" | "nominal";
export type Groups = "two" | "many";
export type Design = "independent" | "paired";

export interface TestAdvice {
  test: string;
  when: string;
  assumptions: string[];
  alternative?: string;
  report: string;
  software: string;
}

/** The usual test for a study question, following standard biostatistics texts. */
export function chooseTest(goal: Goal, outcome: Outcome, groups: Groups = "two", design: Design = "independent"): TestAdvice {
  if (goal === "survival") {
    return {
      test: groups === "two" && outcome !== "nominal" ? "Kaplan-Meier curves with the log-rank test" : "Kaplan-Meier curves with the log-rank test; Cox proportional hazards regression to adjust for covariates",
      when: "Time until an event (death, relapse, discharge), with censoring of patients who leave or haven't had the event.",
      assumptions: ["Censoring is unrelated to the outcome (non-informative)", "For Cox regression: proportional hazards (check with Schoenfeld residuals or log-minus-log plots)"],
      alternative: "Cox regression for several predictors at once",
      report: "Median survival with 95% CI per group, log-rank p value; hazard ratios with 95% CIs from Cox regression.",
      software: "R: survfit(), survdiff(), coxph() · SPSS: Analyze > Survival > Kaplan-Meier / Cox Regression",
    };
  }
  if (goal === "predict") {
    if (outcome === "normal" || outcome === "skewed") {
      return {
        test: "Multiple linear regression",
        when: "Predicting a continuous outcome from several variables, or adjusting an effect for confounders.",
        assumptions: ["Linear relationships", "Independent, normally distributed residuals with constant variance", "No strong multicollinearity (VIF below about 5)"],
        alternative: outcome === "skewed" ? "Transform the outcome (for example log), or use quantile regression" : undefined,
        report: "Coefficients (β) with 95% CIs and p values, and adjusted R².",
        software: "R: lm() · SPSS: Analyze > Regression > Linear",
      };
    }
    return {
      test: outcome === "binary" ? "Multiple logistic regression" : "Multinomial logistic regression",
      when: outcome === "binary" ? "Predicting a yes/no outcome from several variables, or adjusting an odds ratio for confounders." : "Predicting an outcome with three or more unordered categories.",
      assumptions: ["Independent observations", "About 10 or more outcome events per predictor", "Linearity of continuous predictors on the log-odds scale"],
      alternative: outcome === "binary" ? "Poisson or log-binomial regression for risk ratios when the outcome is common" : "Ordinal logistic regression if the categories are ordered",
      report: "Adjusted odds ratios with 95% CIs and p values; model fit (Hosmer-Lemeshow) and discrimination (ROC AUC).",
      software: outcome === "binary" ? "R: glm(family = binomial) · SPSS: Analyze > Regression > Binary Logistic" : "R: nnet::multinom() · SPSS: Analyze > Regression > Multinomial Logistic",
    };
  }
  if (goal === "relate") {
    if (outcome === "normal") {
      return {
        test: "Pearson correlation",
        when: "Strength of a linear relationship between two continuous, normally distributed variables.",
        assumptions: ["Both variables continuous and roughly normal", "Linear relationship (check a scatter plot)", "No influential outliers"],
        alternative: "Spearman's rank correlation if the data are skewed, ordinal or have outliers",
        report: "r with its 95% CI and p value, e.g. r = 0.42 (95% CI 0.21 to 0.59), p < 0.001.",
        software: "R: cor.test() · SPSS: Analyze > Correlate > Bivariate",
      };
    }
    if (outcome === "skewed") {
      return {
        test: "Spearman's rank correlation",
        when: "Relationship between two variables that are skewed or ordinal (for example pain scores).",
        assumptions: ["A monotonic relationship"],
        alternative: "Kendall's tau for small samples with many ties",
        report: "Spearman's ρ with p value.",
        software: "R: cor.test(method = \"spearman\") · SPSS: Analyze > Correlate > Bivariate (Spearman)",
      };
    }
    return {
      test: "Chi-square test of independence (Fisher's exact test if any expected count is below 5)",
      when: "Association between two categorical variables.",
      assumptions: ["Independent observations", "Expected count of 5 or more in at least 80% of cells (otherwise Fisher's exact test)"],
      alternative: "Odds ratio or relative risk with 95% CI for a 2 × 2 table; Cramér's V for strength",
      report: "χ²(df) = value, p value, with the odds ratio or risk ratio and its 95% CI.",
      software: "R: chisq.test(), fisher.test() · SPSS: Analyze > Descriptive Statistics > Crosstabs",
    };
  }
  // compare groups
  const paired = design === "paired";
  if (outcome === "normal") {
    if (groups === "two") {
      return paired
        ? { test: "Paired t-test", when: "Before-and-after measurements on the same patients, or matched pairs.", assumptions: ["The differences are roughly normally distributed"], alternative: "Wilcoxon signed-rank test if the differences are skewed", report: "Mean difference with 95% CI, t(df) and p value.", software: "R: t.test(paired = TRUE) · SPSS: Analyze > Compare Means > Paired-Samples T Test" }
        : { test: "Independent-samples t-test (Welch's t-test if the variances differ)", when: "Comparing the mean of a continuous outcome between two independent groups.", assumptions: ["Roughly normal distribution in each group", "Independent observations", "Similar variances, or use Welch's version (a safe default)"], alternative: "Mann-Whitney U test if the data are skewed or ordinal", report: "Means (SD) per group, the mean difference with 95% CI, t(df) and p value.", software: "R: t.test() · SPSS: Analyze > Compare Means > Independent-Samples T Test" };
    }
    return paired
      ? { test: "Repeated-measures ANOVA", when: "Three or more measurements on the same patients (for example at 0, 3 and 6 months).", assumptions: ["Roughly normal residuals", "Sphericity (Mauchly's test; use the Greenhouse-Geisser correction if violated)"], alternative: "Friedman test if the data are skewed; a linear mixed model if there are missing time points", report: "F(df1, df2), p value, and post-hoc pairwise comparisons with a correction.", software: "R: aov() with Error(), or lme4::lmer() · SPSS: Analyze > General Linear Model > Repeated Measures" }
      : { test: "One-way ANOVA with post-hoc tests (Tukey)", when: "Comparing means across three or more independent groups.", assumptions: ["Roughly normal distribution in each group", "Similar variances (Levene's test; use Welch's ANOVA if they differ)", "Independent observations"], alternative: "Kruskal-Wallis test if the data are skewed", report: "Means (SD) per group, F(df1, df2) and p value, then Tukey-adjusted pairwise differences.", software: "R: aov(), TukeyHSD() · SPSS: Analyze > Compare Means > One-Way ANOVA" };
  }
  if (outcome === "skewed") {
    if (groups === "two") {
      return paired
        ? { test: "Wilcoxon signed-rank test", when: "Paired or before-and-after data that are skewed or ordinal.", assumptions: ["Paired observations", "Differences roughly symmetric"], alternative: "Sign test if the differences are very asymmetric", report: "Median (IQR) of the differences, the test statistic and p value.", software: "R: wilcox.test(paired = TRUE) · SPSS: Analyze > Nonparametric Tests > Related Samples" }
        : { test: "Mann-Whitney U test (Wilcoxon rank-sum)", when: "Comparing two independent groups when the outcome is skewed or ordinal (for example length of stay).", assumptions: ["Independent observations", "Similarly shaped distributions if you want to compare medians"], alternative: "t-test on log-transformed data", report: "Median (IQR) per group, U statistic and p value.", software: "R: wilcox.test() · SPSS: Analyze > Nonparametric Tests > Independent Samples" };
    }
    return paired
      ? { test: "Friedman test", when: "Three or more related measurements that are skewed or ordinal.", assumptions: ["Related samples (the same patients)"], alternative: "Wilcoxon signed-rank tests with a Bonferroni correction for pairs", report: "Median (IQR) at each time point, χ²(df) and p value.", software: "R: friedman.test() · SPSS: Analyze > Nonparametric Tests > Related Samples" }
      : { test: "Kruskal-Wallis test (with Dunn's post-hoc test)", when: "Three or more independent groups with a skewed or ordinal outcome.", assumptions: ["Independent observations"], alternative: "One-way ANOVA on transformed data", report: "Median (IQR) per group, H(df) and p value, then adjusted pairwise comparisons.", software: "R: kruskal.test() · SPSS: Analyze > Nonparametric Tests > Independent Samples" };
  }
  // categorical outcome
  if (paired) {
    return groups === "two"
      ? { test: "McNemar's test", when: "A yes/no outcome measured twice on the same patients, or in matched pairs (for example before and after an intervention).", assumptions: ["Paired yes/no data"], alternative: "Exact binomial (McNemar) test when there are few discordant pairs", report: "Counts of discordant pairs, χ² and p value.", software: "R: mcnemar.test() · SPSS: Analyze > Descriptive Statistics > Crosstabs (McNemar)" }
      : { test: "Cochran's Q test", when: "A yes/no outcome measured three or more times on the same patients.", assumptions: ["Related yes/no measurements"], alternative: "Generalised estimating equations (GEE) for adjusted analyses", report: "Q(df) and p value, then pairwise McNemar tests with a correction.", software: "R: RVAideMemoire::cochran.qtest() · SPSS: Analyze > Nonparametric Tests > Related Samples" };
  }
  return {
    test: `Chi-square test${groups === "two" && outcome === "binary" ? " (Fisher's exact test if any expected count is below 5)" : " of independence"}`,
    when: `Comparing proportions between ${groups === "two" ? "two" : "three or more"} independent groups.`,
    assumptions: ["Independent observations", "Expected count of 5 or more in at least 80% of cells (otherwise Fisher's exact test)"],
    alternative: groups === "two" && outcome === "binary" ? "Risk ratio or odds ratio with 95% CI to show the size of the difference" : "Chi-square test for trend if the groups are ordered",
    report: "n (%) per group, χ²(df) and p value, with an effect size (risk difference, risk ratio or odds ratio with 95% CI).",
    software: "R: chisq.test(), fisher.test() · SPSS: Analyze > Descriptive Statistics > Crosstabs",
  };
}
