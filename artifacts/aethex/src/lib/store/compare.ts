/**
 * Products picked to compare (up to three), kept in this browser and shared by
 * every page and tab. The tray (components/store/CompareTray.tsx) shows them;
 * /compare puts them side by side (pages/Compare.tsx).
 */
import { useSyncExternalStore } from "react";

export const COMPARE_MAX = 3;
const KEY = "aethex:compare:v1";
const EMPTY: number[] = [];
const listeners = new Set<() => void>();
const clean = (v: unknown): number[] => (Array.isArray(v) ? Array.from(new Set(v.map(Number).filter((n) => Number.isInteger(n) && n > 0))).slice(0, COMPARE_MAX) : []);
const read = () => { try { return clean(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return []; } };

let ids: number[] = typeof window === "undefined" ? EMPTY : read();
const emit = () => listeners.forEach((f) => f());
function write(next: number[]) {
  ids = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  emit();
}
if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (e.key === KEY) { ids = read(); emit(); } });

export const compare = {
  get: () => ids,
  has: (id: number) => ids.includes(id),
  /** Adds or removes; returns false when three are picked already. */
  toggle(id: number): boolean {
    if (ids.includes(id)) { write(ids.filter((x) => x !== id)); return true; }
    if (ids.length >= COMPARE_MAX) return false;
    write([...ids, id]);
    return true;
  },
  remove(id: number) { write(ids.filter((x) => x !== id)); },
  set(next: number[]) { write(clean(next)); },
  clear() { write([]); },
};

const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export const useCompareIds = () => useSyncExternalStore(subscribe, () => ids, () => EMPTY);
