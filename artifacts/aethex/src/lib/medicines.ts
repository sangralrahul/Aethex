/**
 * Update 79: medicine reminders from a prescription. Reads the doctor's "how often" and "for" as written in India
 * ("1-0-1", "BD", "twice a day", "at night", "every 8 hours", "5 days", "2 weeks", "SOS") into dose times and a number
 * of days. Anything it can't read is left for the patient to set; "as needed" medicines get no reminders. The patient
 * can change every time. Ticks ("taken") are kept in this browser.
 */
import { useSyncExternalStore } from "react";
import type { Prescription, RxItem } from "@/lib/find";

export const SLOT_TIMES = { morning: "08:00", afternoon: "14:00", evening: "18:00", night: "21:00" } as const;
export interface Plan { key: string; name: string; dose: string; notes: string; times: string[]; days: number | null; asNeeded: boolean; read: boolean }

export function readFrequency(raw: string): { times: string[]; asNeeded: boolean; read: boolean } {
  const f = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (!f) return { times: [], asNeeded: false, read: false };
  if (/\b(sos|prn|as needed|as required|when needed|if needed|if required)\b/.test(f)) return { times: [], asNeeded: true, read: true };
  const pattern = /(\d(?:\.\d)?|½)\s*-\s*(\d(?:\.\d)?|½)\s*-\s*(\d(?:\.\d)?|½)(?:\s*-\s*(\d(?:\.\d)?|½))?/.exec(f);
  if (pattern) {
    const on = (x?: string) => !!x && x !== "0";
    const four = pattern[4] !== undefined;
    const times: (string | false)[] = four
      ? [on(pattern[1]) && SLOT_TIMES.morning, on(pattern[2]) && SLOT_TIMES.afternoon, on(pattern[3]) && SLOT_TIMES.evening, on(pattern[4]) && SLOT_TIMES.night]
      : [on(pattern[1]) && SLOT_TIMES.morning, on(pattern[2]) && SLOT_TIMES.afternoon, on(pattern[3]) && SLOT_TIMES.night];
    return { times: times.filter((x): x is string => !!x), asNeeded: false, read: true };
  }
  const every = /every\s+(\d{1,2})\s*(?:hours?|hrs?|h)\b/.exec(f) ?? /\bq(\d{1,2})h\b/.exec(f);
  if (every) {
    const step = Number(every[1]);
    if (step >= 4 && step <= 24) { const out: string[] = []; for (let h = 8; h < 8 + 24; h += step) out.push(`${String(h % 24).padStart(2, "0")}:00`); return { times: out.sort(), asNeeded: false, read: true }; }
  }
  if (/\b(qid|four times|4 times)\b/.test(f)) return { times: ["08:00", "12:00", "16:00", "21:00"], asNeeded: false, read: true };
  if (/\b(tds|tid|thrice|three times|3 times)\b/.test(f)) return { times: [SLOT_TIMES.morning, SLOT_TIMES.afternoon, SLOT_TIMES.night], asNeeded: false, read: true };
  if (/\b(bd|bid|twice|two times|2 times)\b/.test(f)) return { times: [SLOT_TIMES.morning, SLOT_TIMES.night], asNeeded: false, read: true };
  if (/\b(hs|at night|at bedtime|bedtime|night)\b/.test(f)) return { times: [SLOT_TIMES.night], asNeeded: false, read: true };
  if (/\b(od|once|daily|morning|1 time|every day|a day)\b/.test(f)) return { times: [/evening/.test(f) ? SLOT_TIMES.evening : SLOT_TIMES.morning], asNeeded: false, read: true };
  return { times: [], asNeeded: false, read: false };
}

export function readDuration(raw: string): number | null {
  const f = raw.toLowerCase();
  if (/\b(continue|ongoing|long term|lifelong|till next visit)\b/.test(f)) return null;
  const m = /(\d{1,3})\s*(day|d\b|week|wk|w\b|month|mo|m\b)/.exec(f);
  if (!m) { const n = /^\s*(\d{1,3})\s*$/.exec(f); return n ? Number(n[1]) : null; }
  const n = Number(m[1]), u = m[2]!;
  return u.startsWith("w") ? n * 7 : u.startsWith("m") ? n * 30 : n;
}

export function planFor(rx: Prescription): Plan[] {
  return rx.items.map((it: RxItem, i) => {
    const fr = readFrequency(it.frequency);
    return { key: `${rx.id}:${i}`, name: it.name, dose: it.dose, notes: it.notes, times: fr.times, days: readDuration(it.duration), asNeeded: fr.asNeeded, read: fr.read };
  });
}

export const addDay = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/** One calendar file with a daily repeating reminder for every dose time of every medicine. */
export function medicinesIcs(rxId: string, start: string, plans: Plan[], patient: string): string {
  const stamp = (date: string, time: string) => new Date(Date.parse(`${date}T${time}:00+05:30`)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aethex//Medicine reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  plans.forEach((p, i) => {
    if (p.asNeeded) return;
    p.times.forEach((t, k) => {
      out.push("BEGIN:VEVENT", `UID:${rxId}-${i}-${k}@doctors.aethex.in`, `DTSTAMP:${now}`, `DTSTART:${stamp(start, t)}`, "DURATION:PT10M",
        ...(p.days ? [`RRULE:FREQ=DAILY;COUNT=${p.days}`] : ["RRULE:FREQ=DAILY;COUNT=90"]),
        `SUMMARY:${esc(`Take ${p.name}${p.dose ? ` (${p.dose})` : ""}`)}`, `DESCRIPTION:${esc(`For ${patient}.${p.notes ? ` ${p.notes}.` : ""} From your prescription on Aethex Doctors.`)}`,
        "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", `DESCRIPTION:${esc(`Take ${p.name}`)}`, "END:VALARM", "END:VEVENT");
    });
  });
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}

/* ---------------------------------------------------------------- doses taken, and the patient's own times */
const KEY = "aethex.meds.v1";
type Store = { taken: Record<string, number>; times: Record<string, string[]>; start: Record<string, string> };
const subs = new Set<() => void>();
let cache: { raw: string | null; v: Store } = { raw: "§", v: { taken: {}, times: {}, start: {} } };
function read(): Store {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* blocked */ }
  if (raw === cache.raw) return cache.v;
  let v: Store = { taken: {}, times: {}, start: {} };
  try { const x = JSON.parse(raw ?? "null"); if (x) v = { taken: x.taken ?? {}, times: x.times ?? {}, start: x.start ?? {} }; } catch { /* bad */ }
  cache = { raw, v };
  return v;
}
function write(v: Store) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* blocked */ } subs.forEach((f) => f()); }
export const meds = {
  toggle(doseKey: string) { const v = read(); const taken = { ...v.taken }; if (taken[doseKey]) delete taken[doseKey]; else taken[doseKey] = Date.now(); write({ ...v, taken }); },
  setTimes(planKey: string, times: string[]) { const v = read(); write({ ...v, times: { ...v.times, [planKey]: [...new Set(times)].sort() } }); },
  setStart(rxId: string, d: string) { const v = read(); write({ ...v, start: { ...v.start, [rxId]: d } }); },
};
const EMPTY: Store = { taken: {}, times: {}, start: {} };
export function useMeds(): Store { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, read, () => EMPTY); }
