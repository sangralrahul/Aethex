/**
 * The store's data on the site: the catalogue and products (from the Worker,
 * worker/store.ts, with the store's own prices and stock), quotes, orders,
 * requests and the admin. In local development without the Worker, the
 * catalogue is read from src/data/store/catalog.json instead.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address, Brand, BulkLine, CartLine, Catalog, CatalogSummary, Category, EnquiryKind, Order, Product, ProductSummary, Quote, Segment } from "./types";
import { summarize } from "./rules";

const API = "/api/store";

export class StoreError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function storeFetch<T>(path: string, init: { method?: string; json?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${API}${path}`, {
      method: init.method ?? (init.json !== undefined ? "POST" : "GET"),
      credentials: "same-origin",
      headers: { ...(init.json !== undefined ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    });
  } catch {
    throw new StoreError("You seem to be offline. Check your connection and try again.", 0, null);
  }
  let data: any = null;
  try { data = await r.json(); } catch { /* not JSON */ }
  if (!r.ok || data === null) throw new StoreError(data?.error || `Something went wrong (${r.status}). Please try again.`, r.status, data);
  return data as T;
}

/* ------------------------------------------------------------------ the catalogue */

async function localCatalog(): Promise<Catalog | null> {
  if (!import.meta.env.DEV) return null;
  const m = await import("@/data/store/catalog.json");
  return m.default as unknown as Catalog;
}

async function loadCatalog(): Promise<CatalogSummary> {
  try {
    return await storeFetch<CatalogSummary>("/catalog");
  } catch (e) {
    const local = await localCatalog();
    if (!local) throw e;
    return { version: local.version, brands: local.brands, categories: local.categories, products: local.products.map(summarize) };
  }
}

async function loadProduct(key: string): Promise<Product> {
  try {
    return await storeFetch<Product>(`/products/${encodeURIComponent(key)}`);
  } catch (e) {
    const local = await localCatalog();
    const p = local?.products.find((x) => x.slug === key || String(x.id) === key);
    if (p) return p;
    throw e;
  }
}

export interface StoreData {
  version: string;
  brands: Brand[];
  categories: Category[];
  products: ProductSummary[];
  byId: Map<number, ProductSummary>;
  bySlug: Map<string, ProductSummary>;
  brand: (slug: string) => Brand | undefined;
  category: (slug: string) => Category | undefined;
  brandName: (slug: string) => string;
}

/** The whole catalogue, as lists show it. Loaded once and shared by every page. */
export function useStore(enabled = true) {
  const q = useQuery({ queryKey: ["store", "catalog"], queryFn: loadCatalog, staleTime: 5 * 60_000, gcTime: 60 * 60_000, enabled, retry: 1 });
  const data = useMemo<StoreData | undefined>(() => {
    const d = q.data;
    if (!d) return undefined;
    const byId = new Map(d.products.map((p) => [p.id, p]));
    const bySlug = new Map(d.products.map((p) => [p.slug, p]));
    const brands = new Map(d.brands.map((b) => [b.slug, b]));
    const cats = new Map(d.categories.map((c) => [c.slug, c]));
    return {
      ...d, byId, bySlug,
      brand: (s) => brands.get(s),
      category: (s) => cats.get(s),
      brandName: (s) => brands.get(s)?.name ?? s,
    };
  }, [q.data]);
  return { data, isLoading: q.isLoading, error: q.error as StoreError | null, refetch: q.refetch };
}

/** One product in full (description, specifications, every photo). */
export function useProduct(key: string | undefined) {
  return useQuery({ queryKey: ["store", "product", key], queryFn: () => loadProduct(key!), enabled: !!key, staleTime: 5 * 60_000, retry: (n, e) => (e as StoreError).status !== 404 && n < 1 });
}

/* ------------------------------------------------------------------ orders */

export type QuoteResult = Quote & { codAvailable: boolean; codLimit: number };
export const getQuote = (lines: CartLine[]) => storeFetch<QuoteResult>("/quote", { json: { lines } });

export type CustomerOrder = Order & { canCancel: boolean };
export const placeOrder = (body: { lines: CartLine[]; address: Address; notes?: string; expectTotal?: number }) =>
  storeFetch<{ order: CustomerOrder; token: string; emailed: boolean }>("/orders", { json: body });
export const getOrder = (id: string, token?: string) =>
  storeFetch<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(id)}`, { headers: token ? { "x-order-token": token } : {} });
export const lookupOrder = (id: string, phone: string) =>
  storeFetch<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(id)}/lookup`, { json: { phone } });
export const cancelOrder = (id: string, opts: { token?: string; phone?: string; reason?: string }) =>
  storeFetch<{ order: CustomerOrder }>(`/orders/${encodeURIComponent(id)}/cancel`, { json: { phone: opts.phone, reason: opts.reason }, headers: opts.token ? { "x-order-token": opts.token } : {} });
export const myOrders = () => storeFetch<{ orders: CustomerOrder[] }>("/orders");

export const sendEnquiry = (body: { kind: EnquiryKind; productId?: number; variantId?: string | null; item?: string; name: string; phone: string; email?: string; city?: string; qty?: number; message?: string; website?: string }) =>
  storeFetch<{ ok: true; id: string }>("/enquiries", { json: body });

/** A bulk quotation request from a hospital or medical college (worker/store.ts, createBulkRequest). */
export type BulkRequestBody = {
  segment: Segment; institution: string; instType: string; contactName: string; designation?: string; phone: string; email: string;
  gstin?: string; address?: string; city: string; state: string; pincode: string; needBy?: string; notes?: string; lines: BulkLine[]; website?: string;
};
export const sendBulkRequest = (body: BulkRequestBody) =>
  storeFetch<{ ok: true; id: string; units: number; estTotal: number; unpriced: number; emailed: boolean }>("/bulk-requests", { json: body });

/* ------------------------------------------------------------------ orders placed on this device */

const ORDERS_KEY = "aethex:orders:v1";
export type SavedOrder = { id: string; token: string; at: number; total: number };

export function savedOrders(): SavedOrder[] {
  try {
    const v = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(v) ? v.filter((o) => o && typeof o.id === "string" && typeof o.token === "string") : [];
  } catch {
    return [];
  }
}
export function saveOrder(o: SavedOrder) {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify([o, ...savedOrders().filter((x) => x.id !== o.id)].slice(0, 30))); } catch { /* storage blocked */ }
}
export const tokenFor = (id: string) => savedOrders().find((o) => o.id === id)?.token;
