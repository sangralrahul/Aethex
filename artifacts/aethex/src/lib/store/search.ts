/**
 * Searching the store's products by the words people type (the shop, and the
 * hospital and medical college pages): every word must match the name, brand,
 * category, type or model, with a few everyday words mapped to the products' own.
 */
import type { ProductSummary } from "./types";
import type { StoreData } from "./api";

/** Words people search with, mapped to the words products use. */
export const SYNONYMS: Record<string, string[]> = {
  bp: ["bp", "blood pressure", "sphygmomanometer"], "blood-pressure": ["bp", "blood pressure"],
  nebuliser: ["nebulizer"], nebulizer: ["nebulizer"], spo2: ["oximeter"], oxygen: ["oximeter"],
  sugar: ["gluco", "glucose"], glucose: ["gluco", "glucose"], diabetes: ["gluco", "lancet", "strip"],
  weight: ["scale", "weigh"], weighing: ["scale", "weigh"], paediatric: ["paediatric", "pediatric", "child", "kids", "infant"],
  pediatric: ["paediatric", "pediatric", "child", "kids"], orthopedic: ["orthopaedic", "orthopedic", "ortho"],
  colour: ["colour", "color"], fever: ["thermometer"], temperature: ["thermometer"], brace: ["brace", "support", "splint"],
  massager: ["massager", "tens", "massage"], tens: ["tens"], pillow: ["pillow", "cushion"], cushion: ["cushion", "pillow"],
};

/** The words of a search, lower case, ignoring single letters. */
export const searchWords = (q: string) => q.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 1 || /\d/.test(w));

function searchText(p: ProductSummary, store: StoreData) {
  return `${p.name} ${store.brandName(p.brand)} ${store.category(p.category)?.name ?? ""} ${p.subcategory} ${p.model ?? ""}`.toLowerCase();
}

/** How well a product matches: 0 when a word doesn't match at all. */
export function score(p: ProductSummary, words: string[], store: StoreData): number {
  const name = p.name.toLowerCase();
  const hay = searchText(p, store);
  let s = 0;
  for (const w of words) {
    const alts = SYNONYMS[w] ?? [w];
    if (alts.some((a) => name.includes(a))) s += 3;
    else if (alts.some((a) => hay.includes(a))) s += 1;
    else return 0;
  }
  return s + (p.featured ? 0.5 : 0) + (p.inStock ? 0.25 : 0);
}

/** The products matching a search, best first. */
export function searchProducts(list: ProductSummary[], q: string, store: StoreData): ProductSummary[] {
  const words = searchWords(q);
  if (!words.length) return [];
  return list.map((p) => ({ p, s: score(p, words, store) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
}
