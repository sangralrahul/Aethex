/**
 * The Cadus medical profile: who the user is, so every answer is pitched at the
 * right level (an MBBS student, a NEET-PG aspirant, an intern, a resident, a
 * doctor). Stored on this device only. The server turns it into a short
 * preference block that never outranks the clinical safety standards.
 */

export type ProfileRole = "student" | "aspirant" | "intern" | "resident" | "doctor" | "nurse" | "pharmacist";

export interface MedicalProfile {
  role: ProfileRole;
  /** MBBS year, for students. */
  year?: string;
  /** Target exam, for aspirants. */
  exam?: string;
  /** Exam date as YYYY-MM-DD, for aspirants. */
  examDate?: string;
  /** Specialty, for residents and doctors. */
  specialty?: string;
}

export const PROFILE_KEY = "cadus3.profile";

export const ROLES: { id: ProfileRole; label: string; hint: string }[] = [
  { id: "student", label: "MBBS student", hint: "University exams and concepts" },
  { id: "aspirant", label: "PG exam aspirant", hint: "NEET-PG, INI-CET, FMGE, NExT, USMLE" },
  { id: "intern", label: "Intern", hint: "Ward work and postings" },
  { id: "resident", label: "Resident", hint: "Specialist depth" },
  { id: "doctor", label: "Doctor", hint: "Practice-ready answers" },
  { id: "nurse", label: "Nurse", hint: "Nursing care and monitoring" },
  { id: "pharmacist", label: "Pharmacist", hint: "Drugs and counselling" },
];

export const MBBS_YEARS = ["1st year", "2nd year", "3rd year (Part 1)", "Final year (Part 2)"];
export const EXAMS = ["NEET-PG", "INI-CET", "FMGE", "NExT", "USMLE"];
export const SPECIALTIES = [
  "General Medicine", "General Surgery", "Paediatrics", "Obstetrics and Gynaecology", "Orthopaedics",
  "Anaesthesiology", "Emergency Medicine", "Family Medicine", "Radiology", "Dermatology", "Psychiatry",
  "ENT", "Ophthalmology", "Cardiology", "Pulmonology", "Nephrology", "Neurology", "Pathology",
  "Pharmacology", "Community Medicine",
];

const isRole = (v: unknown): v is ProfileRole => ROLES.some((r) => r.id === v);

export function readProfile(): MedicalProfile | null {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (!raw || !isRole(raw.role)) return null;
    const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
    return {
      role: raw.role,
      year: str(raw.year, 30),
      exam: str(raw.exam, 20),
      examDate: typeof raw.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.examDate) ? raw.examDate : undefined,
      specialty: str(raw.specialty, 60),
    };
  } catch {
    return null;
  }
}

export function saveProfile(p: MedicalProfile | null) {
  try {
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_KEY);
  } catch { /* storage full or blocked */ }
}

/** Whole days from today until the exam, or null if there is no future exam date. */
export function daysToExam(p: MedicalProfile | null, now = new Date()): number | null {
  if (!p || p.role !== "aspirant" || !p.examDate) return null;
  const [y, m, d] = p.examDate.split("-").map(Number);
  const exam = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((exam.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

/** What the server needs to tailor answers. */
export function profilePayload(p: MedicalProfile | null): Record<string, unknown> | undefined {
  if (!p) return undefined;
  const days = daysToExam(p);
  return {
    role: p.role,
    year: p.role === "student" ? p.year : undefined,
    exam: p.role === "aspirant" ? p.exam || "NEET-PG" : undefined,
    daysLeft: days ?? undefined,
    specialty: p.role === "resident" || p.role === "doctor" ? p.specialty : undefined,
  };
}

/** A short line for the interface, e.g. "NEET-PG aspirant" or "Resident · Paediatrics". */
export function profileSummary(p: MedicalProfile | null): string {
  if (!p) return "";
  switch (p.role) {
    case "student": return `MBBS student${p.year ? ` · ${p.year}` : ""}`;
    case "aspirant": return `${p.exam || "NEET-PG"} aspirant`;
    case "intern": return "Intern";
    case "resident": return `Resident${p.specialty ? ` · ${p.specialty}` : ""}`;
    case "doctor": return `Doctor${p.specialty ? ` · ${p.specialty}` : ""}`;
    case "nurse": return "Nurse";
    case "pharmacist": return "Pharmacist";
  }
}

/** The exam an aspirant or student practises for (students default to NEET-PG). */
export function practiceExam(p: MedicalProfile | null): string {
  return p?.role === "aspirant" ? p.exam || "NEET-PG" : "NEET-PG";
}
