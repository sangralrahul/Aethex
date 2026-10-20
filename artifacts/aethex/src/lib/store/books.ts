/**
 * Finding medical books: search across titles, authors, publishers, subjects,
 * courses and ISBNs (with the short names students use), the counts for the
 * filters on /books, and the sort orders. Data: useBooks() in ./api.
 */
import type { Book } from "./types";
import { BOOK_COURSES, groupInfo } from "@/config/bookCourses";

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

/** Short names and spellings students search with. */
const SYNONYMS: Record<string, string> = {
  psm: "preventive social community",
  spm: "preventive social community",
  obg: "obstetrics gynaecology gynecology",
  obgy: "obstetrics gynaecology gynecology",
  gynae: "gynaecology gynecology",
  gyne: "gynaecology gynecology",
  ent: "ent nose throat otorhinolaryngology otolaryngology",
  fmt: "forensic",
  forensic: "forensic",
  peds: "paediatrics pediatrics",
  paeds: "paediatrics pediatrics",
  pediatrics: "pediatrics paediatrics",
  paediatrics: "paediatrics pediatrics",
  ortho: "orthopaedics orthopedics orthopaedic orthopedic",
  orthopedics: "orthopedics orthopaedics",
  anaesthesia: "anaesthesia anesthesia anaesthesiology anesthesiology",
  anesthesia: "anesthesia anaesthesia anesthesiology anaesthesiology",
  pharma: "pharmacology pharmacy pharmaceutics",
  biochem: "biochemistry",
  micro: "microbiology",
  patho: "pathology",
  physio: "physiology physiotherapy",
  bdc: "chaurasia",
  kdt: "tripathi",
  neetpg: "neet pg",
  bsc: "bsc",
  ayurveda: "ayurveda bams",
  homeopathy: "homoeopathy homeopathy bhms",
  homoeopathy: "homoeopathy homeopathy bhms",
};

export interface BookIndex {
  text: Map<number, string>;
  title: Map<number, string>;
  authors: Map<number, string>;
}

/** The searchable text of every book, built once per catalogue. */
export function indexBooks(books: Book[], publisherName: (s: string) => string): BookIndex {
  const text = new Map<number, string>();
  const title = new Map<number, string>();
  const authors = new Map<number, string>();
  for (const b of books) {
    const places = b.placements.flatMap((p) => { const g = groupInfo(p.group); return [p.subject, g?.group.label ?? "", g?.course.label ?? ""]; });
    text.set(b.id, ` ${norm([b.title, b.subtitle, b.authors, publisherName(b.publisher), b.edition, b.isbn, ...(b.exams ?? []), ...places].filter(Boolean).join(" "))} `);
    title.set(b.id, ` ${norm(`${b.title} ${b.subtitle ?? ""}`)} `);
    authors.set(b.id, ` ${norm(b.authors ?? "")} `);
  }
  return { text, title, authors };
}

/** Books matching every word (or one of its synonyms), best first. */
export function searchBooks(books: Book[], index: BookIndex, query: string): Book[] {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(" ").filter((w) => w.length > 1 || /\d/.test(w));
  if (!words.length) return [];
  const alts = words.map((w) => [w, ...(SYNONYMS[w]?.split(" ") ?? [])]);
  const scored: { b: Book; s: number }[] = [];
  for (const b of books) {
    const hay = index.text.get(b.id) ?? "";
    if (!alts.every((a) => a.some((w) => hay.includes(` ${w}`)))) continue;
    const t = index.title.get(b.id) ?? "";
    const au = index.authors.get(b.id) ?? "";
    let s = 0;
    if (t.includes(` ${q} `) || t.startsWith(` ${q}`)) s += 10;
    for (const a of alts) {
      if (a.some((w) => t.includes(` ${w}`))) s += 3;
      if (a.some((w) => au.includes(` ${w}`))) s += 3;
    }
    if (b.standard) s += 2;
    if (b.price !== null) s += 1;
    if (b.cover) s += 1;
    scored.push({ b, s });
  }
  return scored.sort((x, y) => y.s - x.s || x.b.title.localeCompare(y.b.title)).map((x) => x.b);
}

export const courseIdsOf = (b: Book) => new Set(b.placements.map((p) => groupInfo(p.group)?.course.id).filter(Boolean) as string[]);

export type BookSort = "recommended" | "newest" | "price-low" | "price-high" | "title";
export const BOOK_SORTS: { id: BookSort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest editions" },
  { id: "price-low", label: "Price: low to high" },
  { id: "price-high", label: "Price: high to low" },
  { id: "title", label: "Title: A to Z" },
];

/** Standard textbooks, then books with a price and a cover, newer editions first. */
export const recommendRank = (b: Book) => (b.standard ? 8 : 0) + (b.price !== null ? 4 : 0) + (b.cover ? 2 : 0) + Math.max(0, Math.min(1, ((b.year ?? 2000) - 2015) / 12));

export function sortBooks(list: Book[], sort: BookSort): Book[] {
  const out = [...list];
  const price = (b: Book) => (b.price === null ? null : Number(b.price));
  switch (sort) {
    case "newest": return out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || recommendRank(b) - recommendRank(a));
    case "price-low": return out.sort((a, b) => (price(a) ?? Infinity) - (price(b) ?? Infinity));
    case "price-high": return out.sort((a, b) => (price(b) ?? -1) - (price(a) ?? -1));
    case "title": return out.sort((a, b) => a.title.localeCompare(b.title));
    default: return out.sort((a, b) => recommendRank(b) - recommendRank(a) || a.title.localeCompare(b.title));
  }
}

/** A title or an address as plain words: "harrison-s-principles" and "Harrison's Principles" both give "harrisons principles". */
function titleWords(s: string): string {
  const out: string[] = [];
  for (const w of s.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9]+/).filter(Boolean)) {
    if (w === "s" && out.length) out[out.length - 1] += "s";
    else out.push(w);
  }
  return out.join(" ");
}

/**
 * The book at an address: its own, or one from the first version of the books
 * page ("/books/williams-obstetrics-26th-ed"), matched on the title without the
 * edition. `moved` says the address should be replaced with the book's own.
 */
export function findBook(books: Book[], bySlug: Map<string, Book>, slug: string): { book: Book; moved: boolean } | null {
  const own = bySlug.get(slug);
  if (own) return { book: own, moved: false };
  const words = titleWords(slug.replace(/-\d+(?:st|nd|rd|th)-ed(?:ition)?(?:-.*)?$/, ""));
  if (!words) return null;
  const same = books.filter((b) => titleWords(b.title) === words);
  if (!same.length) return null;
  same.sort((a, b) => recommendRank(b) - recommendRank(a) || (b.year ?? 0) - (a.year ?? 0));
  return { book: same[0], moved: true };
}

/** Words to search with for an address that isn't a book: "guyton-hall-medical-physiology-14th-ed" -> "guyton hall medical physiology". */
export const slugQuery = (slug: string) => titleWords(slug.replace(/-\d+(?:st|nd|rd|th)-ed(?:ition)?(?:-.*)?$/, "")).split(" ").filter((w) => !["by", "the", "of", "and", "for", "vol", "set", "ed"].includes(w)).join(" ");

/** How many books each course has. */
export function courseCounts(books: Book[]): Map<string, number> {
  const m = new Map<string, number>(BOOK_COURSES.map((c) => [c.id, 0]));
  for (const b of books) for (const c of courseIdsOf(b)) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

/** Counts of the values a filter can take, over the books the other filters leave. */
export function countBy<T extends string>(books: Book[], keys: (b: Book) => Iterable<T>): Map<T, number> {
  const m = new Map<T, number>();
  for (const b of books) for (const k of new Set(keys(b))) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}
