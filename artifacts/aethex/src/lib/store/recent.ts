/**
 * Update 76: products this browser looked at, newest first (up to 20), for the "Recently viewed" rows.
 * Kept in this browser only.
 */
import { useSyncExternalStore } from "react";

const KEY = "aethex.recent.v1";
const MAX = 20;
const subs = new Set<() => void>();
let cache: { raw: string | null; ids: number[] } = { raw: null, ids: [] };
const EMPTY: number[] = [];

function read(): number[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (raw === cache.raw) return cache.ids;
  let ids: number[] = [];
  try { const v = JSON.parse(raw ?? "[]"); if (Array.isArray(v)) ids = v.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX); } catch { /* bad value */ }
  cache = { raw, ids };
  return ids;
}
function write(ids: number[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage blocked */ }
  subs.forEach((f) => f());
}
export const recent = {
  get: read,
  /** Puts a product at the front. */
  seen(id: number) { const cur = read(); if (cur[0] === id) return; write([id, ...cur.filter((x) => x !== id)].slice(0, MAX)); },
  remove(id: number) { write(read().filter((x) => x !== id)); },
  clear() { write([]); },
};
function subscribe(f: () => void) {
  subs.add(f);
  const on = (e: StorageEvent) => { if (e.key === KEY) f(); };
  window.addEventListener("storage", on);
  return () => { subs.delete(f); window.removeEventListener("storage", on); };
}
export function useRecent(): number[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
