/**
 * Aethex Find: the client side of worker/find.ts. Doctors list their own practice (checked by an admin
 * before it shows), patients search by city and specialty and book a time. No sample doctors: the
 * directory shows only real, approved listings.
 */
import { useQuery } from "@tanstack/react-query";
import { loginUrl, isAethexDomain } from "@/lib/host";

export type Hours = { days: number[]; sessions: { start: string; end: string }[]; slot: number };
export interface Doctor {
  slug: string; name: string; gender: string | null; specialty: string; qualifications: string; regNo: string; regCouncil: string;
  experience: number; clinic: string; address: string; locality: string | null; city: string; pincode: string; fee: number;
  video: boolean; videoFee: number | null; languages: string[]; about: string | null; services: string[]; hours: Hours | null;
  rating: { avg: number; count: number } | null;
}
export interface OwnDoctor extends Doctor { id: string; status: "pending" | "live" | "paused" | "rejected"; adminNote: string | null; createdAt: number; updatedAt: number }
export interface Appointment {
  id: string; date: string; time: string; mode: "clinic" | "video"; reason: string | null; status: "booked" | "confirmed" | "cancelled" | "completed" | "no-show";
  link: string | null; note: string | null; patient: { name: string; phone: string; email: string | null; age: number | null }; createdAt: number;
  doctor?: { slug: string; name: string; specialty: string; clinic: string; address: string; city: string }; reviewed?: boolean;
}

/** The specialties a doctor can list under (the same list as worker/find.ts). */
export const SPECIALTIES = [
  "General Physician", "Family Physician", "Paediatrician", "Gynaecologist / Obstetrician", "Dermatologist", "Dentist",
  "Orthopaedic Surgeon", "ENT Specialist", "Ophthalmologist", "Cardiologist", "Psychiatrist", "Psychologist",
  "Neurologist", "Pulmonologist", "Gastroenterologist", "Endocrinologist", "Diabetologist", "Nephrologist", "Urologist",
  "General Surgeon", "Oncologist", "Rheumatologist", "Physiotherapist", "Dietitian / Nutritionist", "Homoeopath", "Ayurveda",
];

/** Common reasons to see each specialty, for the "what's bothering you" search. */
export const CONCERNS: { label: string; specialty: string }[] = [
  { label: "Fever, cold or cough", specialty: "General Physician" },
  { label: "Child's health", specialty: "Paediatrician" },
  { label: "Pregnancy and periods", specialty: "Gynaecologist / Obstetrician" },
  { label: "Skin, hair and acne", specialty: "Dermatologist" },
  { label: "Tooth pain", specialty: "Dentist" },
  { label: "Joint or back pain", specialty: "Orthopaedic Surgeon" },
  { label: "Ear, nose or throat", specialty: "ENT Specialist" },
  { label: "Eyes and vision", specialty: "Ophthalmologist" },
  { label: "Heart and blood pressure", specialty: "Cardiologist" },
  { label: "Stress, anxiety, sleep", specialty: "Psychiatrist" },
  { label: "Diabetes and thyroid", specialty: "Endocrinologist" },
  { label: "Stomach and digestion", specialty: "Gastroenterologist" },
];

export const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Jammu", "Kochi", "Indore", "Bhopal", "Patna"];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class FindError extends Error { status: number; signIn?: boolean; setup?: boolean; constructor(m: string, s: number, extra: Record<string, unknown> = {}) { super(m); this.status = s; Object.assign(this, extra); } }

export async function findApi<T>(path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api/find${path}`, { method: body === undefined ? "GET" : "POST", headers: body === undefined ? {} : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), credentials: "same-origin" });
  } catch { throw new FindError("Can't reach Aethex right now. Check your connection and try again.", 0); }
  const data = (r.headers.get("content-type") || "").includes("application/json") ? await r.json().catch(() => null) : null;
  if (!r.ok) throw new FindError(data?.error || `Something went wrong (${r.status}).`, r.status, data ?? {});
  return data as T;
}

export const useDoctors = (params: { q?: string; city?: string; specialty?: string; video?: boolean }) => {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.city) qs.set("city", params.city);
  if (params.specialty) qs.set("specialty", params.specialty);
  if (params.video) qs.set("video", "1");
  return useQuery({ queryKey: ["find", "doctors", qs.toString()], queryFn: () => findApi<{ doctors: Doctor[]; cities: { city: string; count: number }[] }>(`/doctors?${qs}`), staleTime: 60_000, retry: 1 });
};
export const useDoctor = (slug: string) => useQuery({
  queryKey: ["find", "doctor", slug],
  queryFn: () => findApi<{ doctor: Doctor; preview: boolean; taken: string[]; today: string; now: number; aheadDays: number; reviews: { rating: number; text: string | null; name: string; at: number }[] }>(`/doctors/${slug}`),
  retry: (n, e) => (e as FindError).status !== 404 && n < 1,
});
export const useMyProfile = () => useQuery({ queryKey: ["find", "me"], queryFn: () => findApi<{ doctor: OwnDoctor | null; email: string; name: string }>("/me"), retry: false });
export const useMyAppointments = () => useQuery({ queryKey: ["find", "mine"], queryFn: () => findApi<{ appointments: Appointment[] }>("/appointments"), retry: false });
export const usePractice = () => useQuery({ queryKey: ["find", "practice"], queryFn: () => findApi<{ doctor: OwnDoctor; rating: { avg: number; count: number } | null; today: string; appointments: Appointment[] }>("/practice/appointments"), retry: false });

/* ------------------------------------------------------------------ slots */

const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
export function daySlots(h: Hours, date: string): string[] {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (!h.days.includes(d)) return [];
  const out: string[] = [];
  for (const s of h.sessions) for (let m = mins(s.start); m + h.slot <= mins(s.end); m += h.slot) out.push(fmt(m));
  return out;
}
/** Free times on a date: in the hours, not taken, and at least 30 minutes from now (India time). */
export function freeSlots(h: Hours, date: string, taken: Set<string>, today: string, nowMin: number): string[] {
  return daySlots(h, date).filter((t) => !taken.has(`${date} ${t}`) && (date > today || mins(t) > nowMin + 30));
}
export const time12 = (t: string) => { const h = Number(t.slice(0, 2)); return `${((h + 11) % 12) + 1}:${t.slice(3)} ${h < 12 ? "AM" : "PM"}`; };
export const dateLabel = (date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" });
export const hoursText = (h: Hours | null) => {
  if (!h) return "";
  const days = h.days.length === 7 ? "Every day" : h.days.length === 6 && !h.days.includes(0) ? "Mon–Sat" : h.days.map((d) => DAY_NAMES[d]).join(", ");
  return `${days} · ${h.sessions.map((s) => `${time12(s.start)}–${time12(s.end)}`).join(", ")}`;
};
export const initials = (name: string) => name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
export const displayName = (name: string) => (/^dr\.?\s/i.test(name) ? name.replace(/^dr\.?\s+/i, "Dr ") : `Dr ${name}`);

/** Sign-in that comes back to this page, on any portal subdomain. */
export function signInHere(): string {
  if (typeof window === "undefined") return loginUrl("/");
  const here = window.location.pathname + window.location.search;
  return isAethexDomain() ? loginUrl("/", { back: window.location.href }) : loginUrl("/", { next: here });
}
