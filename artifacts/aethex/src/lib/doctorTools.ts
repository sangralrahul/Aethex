/**
 * Update 75: tools for patients on Aethex Doctors.
 * - Saved doctors and the compare list, kept in this browser (no account needed).
 * - An appointment as a calendar file (.ics) for Google, Apple or Outlook calendars.
 * - "Which doctor should I see?": symptoms grouped by body area, each pointing to the specialty that usually sees it,
 *   with the warning signs that need emergency care instead. It suggests a specialty; it does not diagnose.
 */
import { useSyncExternalStore } from "react";
import { displayName, type Appointment } from "@/lib/find";

/* ---------------------------------------------------------------- saved and compared doctors */
const KEYS = { saved: "ax-fd-saved", compare: "ax-fd-compare" } as const;
type ListName = keyof typeof KEYS;
export const COMPARE_MAX = 3;
const subs = new Set<() => void>();
const cache: Partial<Record<ListName, { raw: string | null; list: string[] }>> = {};

function read(name: ListName): string[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEYS[name]); } catch { /* storage blocked */ }
  const c = cache[name];
  if (c && c.raw === raw) return c.list;
  let list: string[] = [];
  try { const v = JSON.parse(raw ?? "[]"); if (Array.isArray(v)) list = v.filter((x): x is string => typeof x === "string").slice(0, 50); } catch { /* bad value */ }
  cache[name] = { raw, list };
  return list;
}
function write(name: ListName, list: string[]) {
  try { localStorage.setItem(KEYS[name], JSON.stringify(list)); } catch { /* storage blocked */ }
  subs.forEach((f) => f());
}
function subscribe(f: () => void) {
  subs.add(f);
  const onStorage = (e: StorageEvent) => { if (e.key === KEYS.saved || e.key === KEYS.compare) f(); };
  window.addEventListener("storage", onStorage);
  return () => { subs.delete(f); window.removeEventListener("storage", onStorage); };
}
const EMPTY: string[] = [];

export function useDoctorLists() {
  const saved = useSyncExternalStore(subscribe, () => read("saved"), () => EMPTY);
  const compare = useSyncExternalStore(subscribe, () => read("compare"), () => EMPTY);
  return {
    saved, compare,
    isSaved: (slug: string) => saved.includes(slug),
    toggleSaved: (slug: string) => write("saved", saved.includes(slug) ? saved.filter((x) => x !== slug) : [slug, ...saved]),
    inCompare: (slug: string) => compare.includes(slug),
    /** false when the compare list is already full */
    toggleCompare: (slug: string) => {
      if (compare.includes(slug)) { write("compare", compare.filter((x) => x !== slug)); return true; }
      if (compare.length >= COMPARE_MAX) return false;
      write("compare", [...compare, slug]); return true;
    },
    clearCompare: () => write("compare", []),
  };
}

/* ---------------------------------------------------------------- calendar file */
const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
/** India time "YYYY-MM-DD" + "HH:MM" to a UTC iCalendar stamp. */
function utcStamp(date: string, time: string, plusMin = 0) {
  const t = Date.parse(`${date}T${time}:00+05:30`) + plusMin * 60000;
  return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
export function appointmentIcs(a: Appointment, minutes = 20): string {
  const doc = a.doctor ? displayName(a.doctor.name) : "Doctor";
  const where = a.mode === "video" ? "Video consultation (link in My appointments on doctors.aethex.in)" : a.doctor ? `${a.doctor.clinic}, ${a.doctor.address}, ${a.doctor.city}` : "";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aethex//Aethex Doctors//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.id}@doctors.aethex.in`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${utcStamp(a.date, a.time)}`,
    `DTEND:${utcStamp(a.date, a.time, minutes)}`,
    `SUMMARY:${icsEsc(`${a.mode === "video" ? "Video consult" : "Appointment"} with ${doc}`)}`,
    `LOCATION:${icsEsc(where)}`,
    `DESCRIPTION:${icsEsc(`Patient: ${a.patient.name}\n${a.doctor?.specialty ?? ""}\nManage it at https://doctors.aethex.in/appointments\nNot for emergencies: call 112.`)}`,
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(`Appointment with ${doc} in 1 hour`)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
export function downloadIcs(a: Appointment) {
  const blob = new Blob([appointmentIcs(a)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `appointment-${a.date}.ics`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
/** A Google Calendar "add event" link, for people who'd rather not download a file. */
export function googleCalendarUrl(a: Appointment, minutes = 20) {
  const doc = a.doctor ? displayName(a.doctor.name) : "Doctor";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${a.mode === "video" ? "Video consult" : "Appointment"} with ${doc}`,
    dates: `${utcStamp(a.date, a.time)}/${utcStamp(a.date, a.time, minutes)}`,
    details: `Patient: ${a.patient.name}. Manage it at https://doctors.aethex.in/appointments`,
    location: a.mode === "video" ? "Video consultation" : a.doctor ? `${a.doctor.clinic}, ${a.doctor.address}, ${a.doctor.city}` : "",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/* ---------------------------------------------------------------- which doctor should I see? */
export interface Symptom { id: string; label: string; specialty: string; also?: string }
export interface BodyArea { id: string; label: string; symptoms: Symptom[] }
export const BODY_AREAS: BodyArea[] = [
  { id: "general", label: "Whole body", symptoms: [
    { id: "fever", label: "Fever", specialty: "General Physician" },
    { id: "tired", label: "Tiredness or weakness", specialty: "General Physician" },
    { id: "weight", label: "Weight gain or loss without trying", specialty: "Endocrinologist", also: "General Physician" },
    { id: "thirst", label: "Very thirsty, passing urine often", specialty: "Diabetologist", also: "Endocrinologist" },
    { id: "sugar", label: "High blood sugar", specialty: "Diabetologist" },
    { id: "joints", label: "Joint pain and swelling", specialty: "Rheumatologist", also: "Orthopaedic Surgeon" },
    { id: "diet", label: "Diet and weight advice", specialty: "Dietitian / Nutritionist" },
  ] },
  { id: "head", label: "Head and mind", symptoms: [
    { id: "headache", label: "Headaches", specialty: "Neurologist", also: "General Physician" },
    { id: "dizzy", label: "Dizziness or fainting", specialty: "Neurologist", also: "Cardiologist" },
    { id: "numb", label: "Numbness or tingling", specialty: "Neurologist" },
    { id: "fits", label: "Fits (seizures)", specialty: "Neurologist" },
    { id: "low", label: "Feeling low, loss of interest", specialty: "Psychiatrist", also: "Psychologist" },
    { id: "anxiety", label: "Worry, panic or anxiety", specialty: "Psychiatrist", also: "Psychologist" },
    { id: "sleep", label: "Trouble sleeping", specialty: "Psychiatrist", also: "General Physician" },
  ] },
  { id: "eyes", label: "Eyes, ears, nose and throat", symptoms: [
    { id: "vision", label: "Blurred vision", specialty: "Ophthalmologist" },
    { id: "redeye", label: "Red, painful or watery eyes", specialty: "Ophthalmologist" },
    { id: "ear", label: "Ear pain or discharge", specialty: "ENT Specialist" },
    { id: "hearing", label: "Hearing loss or ringing", specialty: "ENT Specialist" },
    { id: "throat", label: "Sore throat or hoarse voice", specialty: "ENT Specialist", also: "General Physician" },
    { id: "sinus", label: "Blocked nose or sinus pain", specialty: "ENT Specialist" },
    { id: "teeth", label: "Toothache or bleeding gums", specialty: "Dentist" },
  ] },
  { id: "chest", label: "Chest and breathing", symptoms: [
    { id: "chestpain", label: "Chest pain or tightness", specialty: "Cardiologist" },
    { id: "palp", label: "Racing or irregular heartbeat", specialty: "Cardiologist" },
    { id: "bp", label: "High blood pressure", specialty: "Cardiologist", also: "General Physician" },
    { id: "cough", label: "Cough for more than 2 weeks", specialty: "Pulmonologist" },
    { id: "breath", label: "Breathlessness or wheezing", specialty: "Pulmonologist", also: "Cardiologist" },
    { id: "snore", label: "Loud snoring, daytime sleepiness", specialty: "Pulmonologist", also: "ENT Specialist" },
  ] },
  { id: "tummy", label: "Stomach and urine", symptoms: [
    { id: "acidity", label: "Acidity or heartburn", specialty: "Gastroenterologist", also: "General Physician" },
    { id: "abdo", label: "Stomach pain", specialty: "Gastroenterologist", also: "General Surgeon" },
    { id: "bowel", label: "Constipation or loose motions", specialty: "Gastroenterologist" },
    { id: "jaundice", label: "Yellow eyes or skin", specialty: "Gastroenterologist" },
    { id: "lump", label: "A lump or hernia", specialty: "General Surgeon" },
    { id: "urine", label: "Burning or pain passing urine", specialty: "Urologist", also: "General Physician" },
    { id: "kidney", label: "Swelling of feet, kidney problems", specialty: "Nephrologist" },
  ] },
  { id: "skin", label: "Skin and hair", symptoms: [
    { id: "rash", label: "Rash or itching", specialty: "Dermatologist" },
    { id: "acne", label: "Acne or pimples", specialty: "Dermatologist" },
    { id: "hair", label: "Hair fall", specialty: "Dermatologist" },
    { id: "patch", label: "White or dark patches", specialty: "Dermatologist" },
    { id: "mole", label: "A mole that changed", specialty: "Dermatologist", also: "Oncologist" },
  ] },
  { id: "bones", label: "Bones and muscles", symptoms: [
    { id: "back", label: "Back or neck pain", specialty: "Orthopaedic Surgeon", also: "Physiotherapist" },
    { id: "knee", label: "Knee pain", specialty: "Orthopaedic Surgeon" },
    { id: "sprain", label: "Sprain or injury", specialty: "Orthopaedic Surgeon" },
    { id: "rehab", label: "Stiffness, rehab after injury", specialty: "Physiotherapist" },
  ] },
  { id: "women", label: "Women's health", symptoms: [
    { id: "periods", label: "Irregular or painful periods", specialty: "Gynaecologist / Obstetrician" },
    { id: "pregnancy", label: "Pregnancy care", specialty: "Gynaecologist / Obstetrician" },
    { id: "pcos", label: "PCOS, facial hair, acne", specialty: "Gynaecologist / Obstetrician", also: "Endocrinologist" },
    { id: "breast", label: "Breast lump or pain", specialty: "General Surgeon", also: "Gynaecologist / Obstetrician" },
  ] },
  { id: "child", label: "Children", symptoms: [
    { id: "kidfever", label: "Child with fever or cough", specialty: "Paediatrician" },
    { id: "growth", label: "Growth, feeding or development", specialty: "Paediatrician" },
    { id: "vaccines", label: "Vaccinations", specialty: "Paediatrician" },
  ] },
];
const ALL = BODY_AREAS.flatMap((a) => a.symptoms);

/** Warning signs that need emergency care, not a booking. */
export const RED_FLAGS = [
  "Chest pain with sweating, or pain spreading to the arm or jaw",
  "Sudden weakness of the face, arm or leg, or trouble speaking",
  "Severe breathlessness, or lips turning blue",
  "Fainting, a fit that won't stop, or confusion",
  "Heavy bleeding, or vomiting or coughing blood",
  "Thoughts of harming yourself",
];

/** Ranks the specialties for the chosen symptoms: 2 points for the usual specialty, 1 for the alternative. */
export function suggestSpecialties(ids: string[]): { specialty: string; score: number; because: string[] }[] {
  const score = new Map<string, { score: number; because: string[] }>();
  const add = (sp: string, n: number, why: string) => { const s = score.get(sp) ?? { score: 0, because: [] }; s.score += n; if (n === 2) s.because.push(why); score.set(sp, s); };
  for (const sid of ids) {
    const s = ALL.find((x) => x.id === sid);
    if (!s) continue;
    add(s.specialty, 2, s.label);
    if (s.also) add(s.also, 1, s.label);
  }
  return [...score.entries()].map(([specialty, v]) => ({ specialty, ...v })).sort((a, b) => b.score - a.score || a.specialty.localeCompare(b.specialty)).slice(0, 3);
}
export const symptomById = (id: string) => ALL.find((x) => x.id === id);
