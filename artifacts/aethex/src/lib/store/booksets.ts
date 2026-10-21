/**
 * Book sets by year (/books, a year or degree chosen): one standard textbook
 * per subject of that year, from the books marked standard in
 * src/data/store/books.json. Each subject starts with the main textbook you
 * can order now: a complete multi-volume set before its single volumes, a
 * textbook before a handbook or review, a priced book before one on request;
 * the buyer can switch to another standard book for the subject. Used by
 * components/store/BookSet.tsx.
 */
import type { Book } from "./types";
import { recommendRank } from "./books";
import { groupInfo } from "@/config/bookCourses";

export interface SetSubject {
  subject: string;
  /** The standard books for the subject, the default pick first. */
  options: Book[];
}
export interface BookSetPlan {
  group: string;
  label: string;
  subjects: SetSubject[];
}

export const buyable = (b: Book) => b.price !== null && !b.priceOnRequest && b.inStock !== false;

const COMPLETE = /\(set\)|\bset of\b|\bvol(?:ume)?s?\.?\s*set\b|\bvols?\.?\s*\d+\s*[-–]\s*\d+|\bvolumes?\s+\d+\s*(?:and|&)\s*\d+/i;
const ONE_PART = /\b(?:vol(?:ume)?\.?|part)\s*-?\s*(?:\d+|i{1,3}|iv)\b/i;
const SIDE_BOOK = /\b(?:handbook|pocket|review|practical|prep manual|question|solved)\b/i;
/** How much a book is "the" textbook of its subject: a whole set, then a whole book, then a part of one or a side book. */
const mainScore = (b: Book) => (COMPLETE.test(b.title) ? 3 : ONE_PART.test(b.title) ? -2 : 0) - (SIDE_BOOK.test(b.title) ? 1 : 0);
const pickOrder = (a: Book, b: Book) =>
  (mainScore(b) + (buyable(b) ? 2 : 0)) - (mainScore(a) + (buyable(a) ? 2 : 0)) || recommendRank(b) - recommendRank(a) || Number(b.price ?? 0) - Number(a.price ?? 0) || a.title.localeCompare(b.title);

/** The set for a year or degree, or null when it has fewer than two subjects with a standard book. */
export function bookSet(books: Book[], group: string): BookSetPlan | null {
  const g = groupInfo(group);
  if (!g) return null;
  const bySubject = new Map<string, Book[]>();
  for (const b of books) {
    if (!b.standard) continue;
    for (const p of b.placements) {
      if (p.group !== group) continue;
      const list = bySubject.get(p.subject) ?? [];
      if (!list.includes(b)) list.push(b);
      bySubject.set(p.subject, list);
    }
  }
  const subjects = Array.from(bySubject.entries())
    .map(([subject, list]) => ({ subject, options: list.sort(pickOrder).slice(0, 8) }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
  return subjects.length >= 2 ? { group, label: g.group.label, subjects } : null;
}

/** The groups that have a set, for the books page's "sets by year". */
export function setGroups(books: Book[], groups: string[]): BookSetPlan[] {
  return groups.map((g) => bookSet(books, g)).filter((x): x is BookSetPlan => !!x);
}
