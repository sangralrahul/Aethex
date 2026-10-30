/**
 * Update 78: for hospitals and medical colleges.
 * - A budget for the bulk list (kept in this browser, per portal).
 * - Saved lists ("Monthly ICU consumables") to load or send again: in the account when signed in
 *   (/api/store/lists, worker/store.ts), else in this browser.
 * - Which saved list the current list came from, so sending it marks the saved list as sent.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { BulkLine, Segment } from "./types";
import { storeFetch } from "./api";
import { cleanBulkLines } from "./rules";

/* ---------------------------------------------------------------- budget */
const bKey = (s: Segment) => `aethex:bulk:budget:${s}`;
const bsubs = new Set<() => void>();
function readBudget(s: Segment): number { try { const n = Number(localStorage.getItem(bKey(s))); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; } }
export function setBudget(s: Segment, n: number) { try { if (n > 0) localStorage.setItem(bKey(s), String(Math.round(n))); else localStorage.removeItem(bKey(s)); } catch { /* blocked */ } bsubs.forEach((f) => f()); }
export function useBudget(s: Segment): number {
  return useSyncExternalStore((f) => { bsubs.add(f); return () => { bsubs.delete(f); }; }, () => readBudget(s), () => 0);
}

/* ---------------------------------------------------------------- saved lists */
export interface SavedList { id: string; name: string; segment: Segment; lines: BulkLine[]; createdAt: number; updatedAt: number; sentAt: number | null }
const LKEY = "aethex:bulk:lists:v1";
const FROM = "aethex:bulk:from";
function localLists(): SavedList[] { try { const v = JSON.parse(localStorage.getItem(LKEY) || "[]"); return Array.isArray(v) ? v.map((x) => ({ ...x, lines: cleanBulkLines(x.lines) })) : []; } catch { return []; } }
function writeLocal(l: SavedList[]) { try { localStorage.setItem(LKEY, JSON.stringify(l.slice(0, 50))); } catch { /* blocked */ } }
const newId = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** The saved lists: the account's when signed in, else this browser's. */
export function useSavedLists(signedIn: boolean) {
  const [lists, setLists] = useState<SavedList[] | null>(null);
  const [where, setWhere] = useState<"account" | "browser">("browser");
  const load = useCallback(async () => {
    if (signedIn) {
      try { const r = await storeFetch<{ lists: SavedList[] }>("/lists"); setLists(r.lists); setWhere("account"); return; } catch { /* fall back */ }
    }
    setLists(localLists()); setWhere("browser");
  }, [signedIn]);
  useEffect(() => { void load(); }, [load]);
  const save = async (name: string, segment: Segment, lines: BulkLine[], id?: string): Promise<string> => {
    if (where === "account") {
      const r = await storeFetch<{ id: string; lists: SavedList[] }>("/lists", { json: { id, name, segment, lines } });
      setLists(r.lists); return r.id;
    }
    const n = name.trim();
    if (n.length < 2) throw new Error('Give the list a name, like "Monthly ICU consumables".');
    const all = localLists(), now = Date.now();
    const cur = id ? all.find((x) => x.id === id) : undefined;
    const item: SavedList = cur ? { ...cur, name: n, segment, lines: cleanBulkLines(lines), updatedAt: now } : { id: newId(), name: n, segment, lines: cleanBulkLines(lines), createdAt: now, updatedAt: now, sentAt: null };
    const next = [item, ...all.filter((x) => x.id !== item.id)];
    writeLocal(next); setLists(next); return item.id;
  };
  const remove = async (id: string) => {
    if (where === "account") { const r = await storeFetch<{ lists: SavedList[] }>(`/lists/${id}/delete`, { json: {} }); setLists(r.lists); return; }
    const next = localLists().filter((x) => x.id !== id); writeLocal(next); setLists(next);
  };
  return { lists, where, save, remove, reload: load };
}

/** The list now in the bulk list came from this saved list. */
export const loadedFrom = { set: (id: string) => { try { sessionStorage.setItem(FROM, id); } catch { /* blocked */ } }, get: () => { try { return sessionStorage.getItem(FROM) || ""; } catch { return ""; } }, clear: () => { try { sessionStorage.removeItem(FROM); } catch { /* blocked */ } } };
/** After the list was sent for a quotation: the saved list it came from is marked as sent. */
export async function markSent(signedIn: boolean) {
  const id = loadedFrom.get();
  if (!id) return;
  loadedFrom.clear();
  if (signedIn) { await storeFetch(`/lists/${id}/sent`, { json: {} }).catch(() => null); return; }
  const all = localLists();
  writeLocal(all.map((x) => (x.id === id ? { ...x, sentAt: Date.now() } : x)));
}
