/**
 * Ward round workspace: a de-identified patient list (bed, initials or age and
 * sex, diagnosis, problems, medicines, plan and jobs) kept only on this device,
 * with a round checklist and handover in SBAR or as a printable sheet.
 */

export type WardStatus = "stable" | "watch" | "sick";

export interface WardJob {
  id: string;
  text: string;
  done: boolean;
  at: number;
}

export interface WardPatient {
  id: string;
  /** Bed or cubicle, e.g. "12" or "ICU-3". */
  bed: string;
  /** Initials or age and sex, e.g. "58M": never a name. */
  label: string;
  diagnosis: string;
  status: WardStatus;
  /** Background and active problems. */
  problems: string;
  meds: string;
  plan: string;
  jobs: WardJob[];
  /** Round checklist items ticked today. */
  checks: string[];
  admittedOn?: string;
  seenAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WardState {
  unit: string;
  patients: WardPatient[];
  /** The date (YYYY-MM-DD) the round checklist belongs to. */
  roundDate?: string;
  discharged: { id: string; bed: string; label: string; diagnosis: string; at: number }[];
}

export const WARD_KEY = "cadus3.ward";
export const WARD_MAX = 60;

export const ROUND_CHECKS: { id: string; label: string }[] = [
  { id: "seen", label: "Seen and examined" },
  { id: "vitals", label: "Vitals and charts reviewed (NEWS2)" },
  { id: "io", label: "Fluids, intake and output" },
  { id: "labs", label: "New results reviewed" },
  { id: "meds", label: "Medicines reviewed (doses, renal dosing, interactions)" },
  { id: "lines", label: "Lines, catheters and VTE prophylaxis" },
  { id: "plan", label: "Plan updated and documented" },
  { id: "family", label: "Patient and family updated" },
];

export const STATUS_LABEL: Record<WardStatus, string> = { stable: "Stable", watch: "Needs watching", sick: "Sick" };

const id = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function newPatient(fields: Partial<WardPatient> = {}, now = Date.now()): WardPatient {
  return {
    id: id(), bed: "", label: "", diagnosis: "", status: "stable", problems: "", meds: "", plan: "", jobs: [], checks: [],
    createdAt: now, updatedAt: now, ...fields,
  };
}

export function cleanWard(raw: unknown): WardState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const patients = Array.isArray(r.patients) ? r.patients : [];
  return {
    unit: str(r.unit, 60),
    roundDate: typeof r.roundDate === "string" ? r.roundDate : undefined,
    patients: patients
      .filter((p: any) => p && typeof p.id === "string")
      .slice(0, WARD_MAX)
      .map((p: any) => ({
        id: p.id,
        bed: str(p.bed, 20),
        label: str(p.label, 40),
        diagnosis: str(p.diagnosis, 200),
        status: (["stable", "watch", "sick"].includes(p.status) ? p.status : "stable") as WardStatus,
        problems: str(p.problems, 3000),
        meds: str(p.meds, 3000),
        plan: str(p.plan, 3000),
        jobs: Array.isArray(p.jobs)
          ? p.jobs.filter((j: any) => j && typeof j.text === "string").slice(0, 50).map((j: any) => ({ id: String(j.id || id()), text: j.text.slice(0, 300), done: !!j.done, at: Number(j.at) || Date.now() }))
          : [],
        checks: Array.isArray(p.checks) ? p.checks.filter((c: unknown) => typeof c === "string") : [],
        ...(typeof p.admittedOn === "string" ? { admittedOn: p.admittedOn } : {}),
        ...(typeof p.seenAt === "number" ? { seenAt: p.seenAt } : {}),
        createdAt: Number(p.createdAt) || Date.now(),
        updatedAt: Number(p.updatedAt) || Date.now(),
      })),
    discharged: Array.isArray(r.discharged)
      ? r.discharged.filter((d: any) => d && typeof d.id === "string").slice(0, 30).map((d: any) => ({ id: d.id, bed: str(d.bed, 20), label: str(d.label, 40), diagnosis: str(d.diagnosis, 200), at: Number(d.at) || Date.now() }))
      : [],
  };
}

export function readWard(): WardState {
  try {
    return cleanWard(JSON.parse(localStorage.getItem(WARD_KEY) || "null"));
  } catch {
    return cleanWard(null);
  }
}

export function saveWard(w: WardState) {
  try {
    localStorage.setItem(WARD_KEY, JSON.stringify(w));
  } catch { /* storage full */ }
}

/** A new day starts a fresh round checklist (jobs and notes are kept). */
export function startDay(w: WardState, today = localDate()): WardState {
  if (w.roundDate === today) return w;
  return { ...w, roundDate: today, patients: w.patients.map((p) => ({ ...p, checks: [], seenAt: undefined })) };
}

/** Natural bed order: 2 before 10, "ICU-2" before "ICU-10". */
export function byBed(a: WardPatient, b: WardPatient): number {
  return a.bed.localeCompare(b.bed, "en", { numeric: true, sensitivity: "base" }) || a.createdAt - b.createdAt;
}

export function pendingJobs(w: WardState): { patient: WardPatient; job: WardJob }[] {
  return [...w.patients].sort(byBed).flatMap((p) => p.jobs.filter((j) => !j.done).map((job) => ({ patient: p, job })));
}

/** "Bed 12 · 58M" */
export const who = (p: WardPatient) => [p.bed && `Bed ${p.bed}`, p.label].filter(Boolean).join(" · ") || "Patient";

/** A de-identified summary of one patient for Cadus or a handover. */
export function patientSummary(p: WardPatient): string {
  const open = p.jobs.filter((j) => !j.done).map((j) => j.text);
  return [
    `${who(p)}${p.diagnosis ? `: ${p.diagnosis}` : ""} (${STATUS_LABEL[p.status].toLowerCase()})`,
    p.problems.trim() && `Background and problems: ${p.problems.trim()}`,
    p.meds.trim() && `Medicines: ${p.meds.trim()}`,
    p.plan.trim() && `Plan: ${p.plan.trim()}`,
    open.length ? `Pending jobs: ${open.join("; ")}` : "",
  ].filter(Boolean).join("\n");
}

/** The whole list for Cadus to turn into an SBAR handover. */
export function wardSummary(w: WardState): string {
  const list = [...w.patients].sort(byBed);
  return `${w.unit ? `${w.unit}: ` : ""}${list.length} patient${list.length === 1 ? "" : "s"}.\n\n${list.map(patientSummary).join("\n\n")}`;
}

const cell = (s: string) => s.replace(/\s*\n\s*/g, "; ").replace(/\|/g, "/").trim() || "-";

/**
 * A handover sheet as a markdown table (for print, Word and copy). Printed and
 * Word sheets carry the unit and date in their own title, so `heading: false`
 * leaves them out of the summary line.
 */
export function handoverMarkdown(w: WardState, date = new Date(), opts: { heading?: boolean } = {}): string {
  const list = [...w.patients].sort(byBed);
  const when = date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const rows = list.map((p) => {
    const open = p.jobs.filter((j) => !j.done).map((j) => `☐ ${j.text}`).join("; ");
    return `| ${cell(p.bed)} | ${cell(p.label)} | ${cell(p.diagnosis)} | ${STATUS_LABEL[p.status]} | ${cell(p.problems)} | ${cell(p.plan)} | ${cell(open)} |`;
  });
  const sick = list.filter((p) => p.status === "sick").map(who);
  const count = `${list.length} patient${list.length === 1 ? "" : "s"}${sick.length ? ` · Sick: ${sick.join(", ")}` : ""}`;
  return [
    opts.heading === false ? `**${count}**` : `**${w.unit || "Ward"} handover** · ${when} · ${count}`,
    "",
    "| Bed | Patient | Diagnosis | Status | Background and problems | Plan | Pending jobs |",
    "|---|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}
