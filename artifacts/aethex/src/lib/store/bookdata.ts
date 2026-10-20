/**
 * Medical books as the store sees them, shared by the site and the Worker
 * (worker/store.ts): a book is sold like a product (cart, cash on delivery,
 * orders, the store's own prices in the admin) under its own number range, and
 * links to its page at /books/<slug>. The catalogue: src/data/store/books.json.
 */
import type { Book, Product, ProductSummary } from "./types";
import { summarize } from "./rules";

/** Book numbers start above this; product numbers stay below it. */
export const BOOK_ID_BASE = 100000;
export const isBookId = (id: number) => id > BOOK_ID_BASE;

/** "Textbook of Pathology (2nd edition)" */
export const bookName = (b: Pick<Book, "title" | "edition">) => (b.edition ? `${b.title} (${b.edition})` : b.title);

/** Where an item in the cart, an order or a list opens. */
export const itemHref = (id: number, slug: string) => (isBookId(id) ? `/books/${slug}` : `/products/${slug}`);

/** A book in the product shape the cart, quotes and orders use. */
export function bookAsProduct(b: Book): Product {
  const price = b.price ?? null;
  return {
    id: b.id,
    slug: b.slug,
    brand: b.publisher,
    name: bookName(b),
    category: "books",
    subcategory: b.placements[0]?.subject ?? "Books",
    featured: !!b.standard,
    price,
    mrp: price === null ? null : Math.max(price, b.mrp ?? price),
    priceOnRequest: price === null || b.priceOnRequest === true,
    inStock: b.inStock !== false,
    images: b.cover ? [b.cover] : [],
    summary: b.summary,
    features: b.highlights ?? [],
    ...(b.isbn ? { model: `ISBN ${b.isbn}` } : {}),
    ...(b.source ? { source: b.source } : {}),
    returns: "standard",
  };
}

export const bookSummary = (b: Book): ProductSummary => summarize(bookAsProduct(b));
