/**
 * The store's data shapes, shared by the site and the Worker (worker/store.ts).
 * The catalogue itself is src/data/store/catalog.json, built from the brands'
 * official sites; the Worker serves it with the store's own changes (prices,
 * stock, hidden items) applied.
 */

export type ReturnsPolicy = "replacement" | "standard";

export interface Variant {
  id: string;
  label: string;
  sku?: string;
  price?: number;
  mrp?: number;
  inStock: boolean;
  image?: string;
}

export interface SizeGuide {
  how?: string;
  header: string[];
  rows: string[][];
}

export interface Product {
  id: number;
  slug: string;
  brand: string;
  name: string;
  category: string;
  subcategory: string;
  featured: boolean;
  /** Selling price including taxes; null while the price is on request. */
  price: number | null;
  mrp: number | null;
  priceOnRequest: boolean;
  inStock: boolean;
  images: string[];
  summary: string;
  features: string[];
  model?: string;
  sku?: string;
  sections?: { title: string; text: string }[];
  longDescription?: string;
  specs?: [string, string][];
  inTheBox?: string;
  warranty?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  optionName?: string;
  variants?: Variant[];
  sizeGuide?: SizeGuide;
  colourNote?: string;
  source?: string;
  returns: ReturnsPolicy;
}

/** A product as lists show it (shop, search, rails, cart). */
export interface ProductSummary {
  id: number;
  slug: string;
  brand: string;
  name: string;
  category: string;
  subcategory: string;
  featured: boolean;
  price: number | null;
  mrp: number | null;
  /** The variants don't all cost the same: show "from". */
  from?: boolean;
  priceOnRequest: boolean;
  inStock: boolean;
  image: string;
  image2?: string;
  summary: string;
  optionName?: string;
  variants?: Pick<Variant, "id" | "label" | "price" | "mrp" | "inStock">[];
  model?: string;
}

export interface Brand {
  slug: string;
  name: string;
  about: string;
  website: string;
  count: number;
}

export interface Category {
  slug: string;
  name: string;
  blurb: string;
  /** home: families; pro: doctors and clinics; institution: hospitals and medical colleges (shown on /hospitals and /medical-colleges, not on the homepage's tiles). */
  audience: "home" | "pro" | "institution";
  subcategories: string[];
  count: number;
}

/* ------------------------------------------------------------------ medical books (src/data/store/books.json) */

/** Where a book belongs: a course group (e.g. "mbbs-1", "bsc-nursing") and a subject in it. */
export interface BookPlacement {
  group: string;
  subject: string;
}

export interface Book {
  /** From 100001 up: books share the cart, orders and the store's prices with the products. */
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  authors?: string;
  edition?: string;
  year?: number;
  /** Publisher slug (BookCatalog.publishers). */
  publisher: string;
  isbn?: string;
  pages?: number;
  binding?: string;
  /** As listed by the publisher's own shop; null while the price is on request. */
  mrp: number | null;
  price: number | null;
  /** Set by the Worker from the price and the store's changes. */
  priceOnRequest?: boolean;
  inStock?: boolean;
  /** The publisher's cover image; books without one get a designed cover. */
  cover?: string;
  /** The publisher's page the details and price come from. */
  source?: string;
  placements: BookPlacement[];
  exams?: string[];
  /** A standard textbook for its subject. */
  standard?: boolean;
  summary: string;
  highlights?: string[];
}

export interface Publisher {
  slug: string;
  name: string;
  website?: string;
}

export interface BookCatalog {
  version: string;
  publishers: Publisher[];
  books: Book[];
}

export interface Catalog {
  version: string;
  currency: "INR";
  brands: Brand[];
  categories: Category[];
  products: Product[];
}

export interface CatalogSummary {
  version: string;
  brands: Brand[];
  categories: Category[];
  products: ProductSummary[];
}

/** The store's own changes to a product, set in the store admin. */
export interface Override {
  price?: number | null;
  mrp?: number | null;
  inStock?: boolean;
  hidden?: boolean;
  countryOfOrigin?: string;
  variants?: Record<string, { price?: number | null; mrp?: number | null; inStock?: boolean }>;
}

export interface CartLine {
  productId: number;
  variantId: string | null;
  qty: number;
}

export interface PricedLine extends CartLine {
  slug: string;
  name: string;
  brand: string;
  variantLabel?: string;
  image: string;
  price: number;
  mrp: number;
  lineTotal: number;
}

export type LineIssue = { productId: number; variantId: string | null; reason: "missing" | "unavailable" | "price-on-request" | "out-of-stock" | "choose-option" };

export interface Quote {
  lines: PricedLine[];
  issues: LineIssue[];
  count: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  delivery: number;
  total: number;
}

export type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Address {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  createdAt: number;
  status: OrderStatus;
  payment: "cod";
  address: Address;
  lines: PricedLine[];
  subtotal: number;
  mrpTotal: number;
  delivery: number;
  total: number;
  history: { status: OrderStatus; at: number; note?: string }[];
  tracking?: { courier?: string; number?: string; url?: string };
  notes?: string;
}

export type EnquiryKind = "price" | "book" | "bulk" | "general";

/* ------------------------------------------------------------------ bulk buying (hospitals and medical colleges) */

/** Who a bulk request is for: the hospital page or the medical college page. */
export type Segment = "hospital" | "college";

export interface BulkLine {
  productId: number;
  variantId: string | null;
  qty: number;
}

/** A line of a bulk request, with the product as it was when the request was sent. */
export interface BulkItem extends BulkLine {
  slug: string;
  name: string;
  brand: string;
  variantLabel?: string;
  image?: string;
  /** The store's price for one unit at the time (a guide), or null when the price is on request. */
  unitPrice: number | null;
  inStock: boolean;
}

export type BulkStatus = "new" | "quoted" | "ordered" | "closed";

/**
 * Deliveries of a bulk list ordered in advance: every 1, 2 or 3 months, for 6 or
 * 12 months, or until the institution stops it (months 0). The first delivery is
 * the request's needBy date, when given.
 */
export interface DeliverySchedule {
  every: 1 | 2 | 3;
  months: 0 | 6 | 12;
}

export interface BulkRequest {
  id: string;
  createdAt: number;
  status: BulkStatus;
  segment: Segment;
  institution: string;
  instType: string;
  contactName: string;
  designation?: string;
  phone: string;
  email: string;
  gstin?: string;
  address?: string;
  city: string;
  state: string;
  pincode: string;
  /** The (first) delivery date, YYYY-MM-DD. */
  needBy?: string;
  /** Repeat deliveries; absent for a single delivery. */
  schedule?: DeliverySchedule;
  notes?: string;
  items: BulkItem[];
  /** Units across all lines (one delivery). */
  units: number;
  /** The priced lines at store prices: a guide, the quotation sets the final price. */
  estTotal: number;
  /** Lines whose price is on request. */
  unpriced: number;
}
