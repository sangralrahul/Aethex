/**
 * Ready-made lists (src/config/kits.ts) against the store's catalogue: which
 * product and option each item is, how many for a given number of wards,
 * students or stations, and adding them all to the bulk list. An item whose
 * product has left the store, or whose option can't be found, is left out.
 */
import type { Kit } from "@/config/kits";
import type { StoreData } from "./api";
import type { BulkLine, ProductSummary } from "./types";
import { BULK_MAX_QTY } from "./rules";

export interface KitLine extends BulkLine {
  product: ProductSummary;
  optionLabel?: string;
}

export function kitLines(kit: Kit, store: StoreData, count: number): { lines: KitLine[]; missing: string[] } {
  const n = Math.max(1, Math.trunc(count) || 1);
  const lines: KitLine[] = [];
  const missing: string[] = [];
  for (const item of kit.items) {
    const product = store.bySlug.get(item.slug);
    if (!product) { missing.push(item.slug); continue; }
    const vs = product.variants ?? [];
    let variantId: string | null = null;
    let optionLabel: string | undefined;
    if (vs.length) {
      const v = item.option ? vs.find((x) => x.label === item.option) : vs.length === 1 ? vs[0] : undefined;
      if (!v) { missing.push(item.slug); continue; }
      variantId = v.id;
      if (vs.length > 1) optionLabel = v.label;
    }
    lines.push({ product, productId: product.id, variantId, optionLabel, qty: Math.min(BULK_MAX_QTY, item.qty * n) });
  }
  return { lines, missing };
}
