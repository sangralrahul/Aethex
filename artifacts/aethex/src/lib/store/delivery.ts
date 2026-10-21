/**
 * The delivery check (product pages, books and checkout): where a PIN code is,
 * from India Post's records (public/pincodes/NN.json, one small file per first
 * two digits, loaded when needed; see public/pincodes/LICENSE.txt), and when an
 * order placed now usually arrives, from the store's own promise in
 * config/business.ts: shipped within `dispatchDays` business days, then
 * `deliveryDays` business days on the way. Business days here are Monday to
 * Friday, so the dates err on the late side.
 */
import { BUSINESS } from "@/config/business";
import { validPincode } from "./rules";

export type PinPlace = { pincode: string; district: string; state: string };
type PinFile = { d: string[]; s: string[]; p: Record<string, [number, number]> };

/** The first two digits India Post uses (one file each in public/pincodes). Any other PIN doesn't exist. */
const PREFIXES = new Set("11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 30 31 32 33 34 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 56 57 58 59 60 61 62 63 64 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 90".split(" "));
const NONE: PinFile = { d: [], s: [], p: {} };

const files = new Map<string, Promise<PinFile>>();
function pinFile(prefix: string): Promise<PinFile> {
  if (!PREFIXES.has(prefix)) return Promise.resolve(NONE);
  let f = files.get(prefix);
  if (!f) {
    f = fetch(`/pincodes/${prefix}.json`).then((r) => {
      if (r.status === 404) return NONE;
      if (!r.ok || !/json/.test(r.headers.get("content-type") || "")) throw new Error(String(r.status));
      return r.json() as Promise<PinFile>;
    });
    f.catch(() => files.delete(prefix));
    files.set(prefix, f);
  }
  return f;
}

/** The district and state of a PIN code; null when India Post has no such code. Throws when offline. */
export async function lookupPin(pin: string): Promise<PinPlace | null> {
  const p = String(pin ?? "").replace(/\D/g, "");
  if (!validPincode(p)) return null;
  const f = await pinFile(p.slice(0, 2));
  const hit = f.p[p];
  return hit ? { pincode: p, district: f.d[hit[0]], state: f.s[hit[1]] } : null;
}

const isWorkday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;
function addWorkdays(from: Date, n: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let left = n; left > 0;) { d.setDate(d.getDate() + 1); if (isWorkday(d)) left--; }
  return d;
}

/** The days an order placed now usually arrives between: the soonest and the latest the store promises. */
export function deliveryWindow(now = new Date()): { from: Date; to: Date } {
  return {
    from: addWorkdays(now, BUSINESS.deliveryDays[0]),
    to: addWorkdays(now, BUSINESS.dispatchDays + BUSINESS.deliveryDays[1]),
  };
}

/** "Mon 27 Oct" */
export const dayText = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** A PIN typed in one place (the product page, the cart) is remembered for the next. */
const PIN_KEY = "aethex:pin:v1";
export const savedPin = () => { try { const p = localStorage.getItem(PIN_KEY) || ""; return validPincode(p) ? p : ""; } catch { return ""; } };
export const savePin = (p: string) => { try { if (validPincode(p)) localStorage.setItem(PIN_KEY, p); } catch { /* storage blocked */ } };
