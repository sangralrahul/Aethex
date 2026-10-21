/**
 * The store's data on the site: the catalogue and products (from the Worker,
 * worker/store.ts, with the store's own prices, stock, offers and ratings), the
 * medical books, quotes and coupons, orders and online payments, reviews,
 * alerts, requests and the admin. In local development without the Worker, the
 * catalogue and books are read from src/data/store/ instead.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  Address, Book, BookCatalog, Brand, BulkLine, BulkRequest, CartLine, Catalog, CatalogSummary, Category, DeliverySchedule, EnquiryKind, Order, PaymentMethod, Product,
  ProductSummary, Publisher, Quote, RatingSummary, Review, ReviewStatus, Segment,
} from "./types";
import { COD_LIMIT, ONLINE_LIMIT, summarize } from "./rules";
import { bookSummary } from "./bookdata";

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

/**
 * The whole catalogue, as lists show it. Loaded once and shared by every page.
 * With books, the medical books are added to the lookups (byId, brandName) so a
 * cart, order or list holding books can show and price them; lists of products
 * (products, brands) stay products only.
 */
export function useStore(enabled = true, opts: { books?: boolean } = {}) {
  const q = useQuery({ queryKey: ["store", "catalog"], queryFn: loadCatalog, staleTime: 5 * 60_000, gcTime: 60 * 60_000, enabled, retry: 1 });
  const withBooks = enabled && !!opts.books;
  const b = useBooks(withBooks);
  const data = useMemo<StoreData | undefined>(() => {
    const d = q.data;
    if (!d) return undefined;
    if (withBooks && !b.data) return undefined; // wait for both, so books never show as unavailable
    const byId = new Map(d.products.map((p) => [p.id, p]));
    const bySlug = new Map(d.products.map((p) => [p.slug, p]));
    const brands = new Map(d.brands.map((x) => [x.slug, x]));
    const cats = new Map(d.categories.map((c) => [c.slug, c]));
    const books = withBooks ? b.data : undefined;
    if (books) for (const x of books.books) byId.set(x.id, bookSummary(x));
    return {
      ...d, byId, bySlug,
      brand: (s) => brands.get(s),
      category: (s) => cats.get(s),
      brandName: (s) => brands.get(s)?.name ?? books?.publisherName(s) ?? s,
    };
  }, [q.data, withBooks, b.data]);
  const failed = (q.error ?? (withBooks ? b.error : null)) as StoreError | null;
  return { data, isLoading: q.isLoading || (withBooks && b.isLoading), error: failed, refetch: q.refetch };
}

/* ------------------------------------------------------------------ medical books */

async function loadBooks(): Promise<BookCatalog> {
  try {
    return await storeFetch<BookCatalog>("/books");
  } catch (e) {
    if (!import.meta.env.DEV) throw e;
    const m = await import("@/data/store/books.json");
    const c = m.default as unknown as BookCatalog;
    return { ...c, books: c.books.map((x) => ({ ...x, priceOnRequest: x.price === null, inStock: true })) };
  }
}

export interface BookStore {
  version: string;
  books: Book[];
  publishers: Publisher[];
  byId: Map<number, Book>;
  bySlug: Map<string, Book>;
  publisherName: (slug: string) => string;
}

/** The medical books (src/data/store/books.json) with the store's prices. Loaded when a page needs them. */
export function useBooks(enabled = true) {
  const q = useQuery({ queryKey: ["store", "books"], queryFn: loadBooks, staleTime: 5 * 60_000, gcTime: 60 * 60_000, enabled, retry: 1 });
  const data = useMemo<BookStore | undefined>(() => {
    const d = q.data;
    if (!d) return undefined;
    const pubs = new Map(d.publishers.map((p) => [p.slug, p.name]));
    return {
      ...d,
      byId: new Map(d.books.map((x) => [x.id, x])),
      bySlug: new Map(d.books.map((x) => [x.slug, x])),
      publisherName: (s) => pubs.get(s) ?? s,
    };
  }, [q.data]);
  return { data, isLoading: enabled && q.isLoading, error: q.error as StoreError | null, refetch: q.refetch };
}

/** One product in full (description, specifications, every photo). */
export function useProduct(key: string | undefined) {
  return useQuery({ queryKey: ["store", "product", key], queryFn: () => loadProduct(key!), enabled: !!key, staleTime: 5 * 60_000, retry: (n, e) => (e as StoreError).status !== 404 && n < 1 });
}

/* ------------------------------------------------------------------ orders and payments */

/** Which ways to pay are open: online payments are on once the store has added its Razorpay keys. */
export type StoreConfig = { onlinePayments: boolean; codLimit: number; onlineLimit: number };
const OFFLINE_CONFIG: StoreConfig = { onlinePayments: false, codLimit: COD_LIMIT, onlineLimit: ONLINE_LIMIT };
export function useStoreConfig() {
  return useQuery({ queryKey: ["store", "config"], queryFn: () => storeFetch<StoreConfig>("/config").catch(() => OFFLINE_CONFIG), staleTime: 5 * 60_000 });
}

/** The Worker's own pricing of a cart, with a coupon when one is given (couponError says why it can't be used). */
export type QuoteResult = Quote & { codAvailable: boolean; codLimit: number; onlinePayments?: boolean; onlineLimit?: number; couponError?: string };
export const getQuote = (lines: CartLine[], opts: { coupon?: string; phone?: string } = {}) =>
  storeFetch<QuoteResult>("/quote", { json: { lines, ...(opts.coupon ? { coupon: opts.coupon } : {}), ...(opts.phone ? { phone: opts.phone } : {}) } });

/** What Razorpay's checkout needs to take the payment for an order (the key id is public; the secret stays on the server). */
export type RazorpayCheckout = { key: string; orderId: string; amount: number; currency: string; name: string; description: string; prefill: { name: string; contact: string; email?: string } };
/** The proof Razorpay's checkout hands back after a payment. */
export type RazorpayPaid = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
/** The buyer's reviews of the items of a delivered order, by product number. */
export type ReviewMarks = Record<number, { status: ReviewStatus; rating: number; title?: string; body: string; name: string; city?: string }>;
export type CustomerOrder = Order & { canCancel: boolean; reviews?: ReviewMarks };

type Access = { token?: string; phone?: string };
const tokenHeader = (token?: string): Record<string, string> => (token ? { "x-order-token": token } : {});
const orderPath = (id: string, act = "") => `/orders/${encodeURIComponent(id)}${act ? `/${act}` : ""}`;

/** Places an order. `key`: the checkout's own random key for this order (24 to 100 letters, digits, - and _): sent again
 * after an answer was lost, it gets back the order the first try made instead of a second one. */
export const placeOrder = (body: { lines: CartLine[]; address: Address; notes?: string; expectTotal?: number; payment?: PaymentMethod; coupon?: string; key?: string }) =>
  storeFetch<{ order: CustomerOrder; token: string; emailed: boolean; checkout?: RazorpayCheckout }>("/orders", { json: body });
export const getOrder = (id: string, token?: string) =>
  storeFetch<{ order: CustomerOrder }>(orderPath(id), { headers: tokenHeader(token) });
export const lookupOrder = (id: string, phone: string) =>
  storeFetch<{ order: CustomerOrder }>(orderPath(id, "lookup"), { json: { phone } });
/** Cancels an order. `ifUnpaid`: only while it still awaits its online payment (one paid meanwhile is kept, and the 409 carries it). */
export const cancelOrder = (id: string, opts: Access & { reason?: string; ifUnpaid?: boolean }) =>
  storeFetch<{ order: CustomerOrder }>(orderPath(id, "cancel"), { json: { phone: opts.phone, reason: opts.reason, ...(opts.ifUnpaid ? { ifUnpaid: true } : {}) }, headers: tokenHeader(opts.token) });
export const myOrders = () => storeFetch<{ orders: CustomerOrder[] }>("/orders");
/** Report a payment from Razorpay's checkout: the Worker checks it with Razorpay before the order counts as paid. */
export const payOrder = (id: string, paid: RazorpayPaid, opts: Access = {}) =>
  storeFetch<{ order: CustomerOrder }>(orderPath(id, "pay"), { json: { ...paid, phone: opts.phone }, headers: tokenHeader(opts.token) });
/** Pay again for an order still awaiting its online payment (no checkout when it turns out to be paid already). */
export const retryPayment = (id: string, opts: Access = {}) =>
  storeFetch<{ order: CustomerOrder; checkout?: RazorpayCheckout }>(orderPath(id, "payment"), { json: { phone: opts.phone }, headers: tokenHeader(opts.token) });
/** Pay cash on delivery instead, for an order still awaiting its online payment. */
export const switchToCod = (id: string, opts: Access = {}) =>
  storeFetch<{ order: CustomerOrder }>(orderPath(id, "cod"), { json: { phone: opts.phone }, headers: tokenHeader(opts.token) });

/* ------------------------------------------------------------------ reviews, alerts, bought together */

export type ProductReviews = { summary: RatingSummary; reviews: Review[] };
/** Approved reviews of a product or book (none in local development without the Worker). */
export function useReviews(productId: number | undefined) {
  return useQuery({
    queryKey: ["store", "reviews", productId], enabled: !!productId, staleTime: 60_000, retry: 0,
    queryFn: () => storeFetch<ProductReviews>(`/reviews/${productId}`).catch((): ProductReviews => ({ summary: { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] }, reviews: [] })),
  });
}
export type ReviewBody = { orderId: string; productId: number; rating: number; title?: string; body: string; name: string; city?: string };
export const sendReview = (body: ReviewBody, opts: Access = {}) =>
  storeFetch<{ ok: true; id: string; status: ReviewStatus }>("/reviews", { json: { ...body, phone: opts.phone }, headers: tokenHeader(opts.token) });
/** An item from a delivered order of the signed-in account, with the review written for it, if any. */
export type ReviewableItem = { orderId: string; deliveredAt: number; productId: number; slug: string; name: string; brand: string; image: string; review: (Review & { status: ReviewStatus }) | null };
export const myReviewables = () => storeFetch<{ items: ReviewableItem[] }>("/my-reviews");

export type AlertKind = "stock" | "price";
export const createAlert = (body: { productId: number; variantId?: string | null; kind: AlertKind; email: string }) =>
  storeFetch<{ ok: true; kind: AlertKind; price: number | null }>("/alerts", { json: body });
export const stopAlerts = (token: string) => storeFetch<{ ok: true; email: string }>("/alerts/stop", { json: { token } });

/** Items bought in the same orders as this one (from real orders; empty until there are some). */
export function useTogether(id: number | undefined) {
  return useQuery({ queryKey: ["store", "together", id], enabled: !!id, staleTime: 10 * 60_000, retry: 0, queryFn: () => storeFetch<{ ids: number[] }>(`/together/${id}`).then((r) => r.ids).catch(() => [] as number[]) });
}

/** The quotation requests of the signed-in account (sent while signed in, or with its email). */
export type MyQuote = BulkRequest & { updatedAt: number };
export const myQuotes = () => storeFetch<{ requests: MyQuote[] }>("/my-quotes");

export const sendEnquiry = (body: { kind: EnquiryKind; productId?: number; variantId?: string | null; item?: string; name: string; phone: string; email?: string; city?: string; qty?: number; message?: string; website?: string }) =>
  storeFetch<{ ok: true; id: string }>("/enquiries", { json: body });

/** A bulk quotation request from a hospital or medical college (worker/store.ts, createBulkRequest). */
export type BulkRequestBody = {
  segment: Segment; institution: string; instType: string; contactName: string; designation?: string; phone: string; email: string;
  gstin?: string; address?: string; city: string; state: string; pincode: string; needBy?: string; schedule?: DeliverySchedule; notes?: string;
  lines: BulkLine[]; website?: string;
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
