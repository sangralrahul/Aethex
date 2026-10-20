// Client-side stand-in for the api-server endpoints used by @workspace/api-client-react.
// Serves the catalogue from seed data and keeps the store cart in this browser
// (localStorage, per shopping session), so the shop works without a backend.
// PUT /api/cart (the signed-in cart reminder) still goes to the Worker.
import { seedCategories, seedProducts, type SeedProduct } from "@/data/seed";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/* ------------------------------------------------------------------ cart (this browser) */

type CartLine = { id: number; productId: number; quantity: number };
const cartKey = (sessionId: string) => `aethex.cart.${sessionId}`;

function readCart(sessionId: string): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(cartKey(sessionId)) || "[]");
    return Array.isArray(raw) ? raw.filter((l) => l && Number.isFinite(l.id) && Number.isFinite(l.productId) && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

function writeCart(sessionId: string, lines: CartLine[]) {
  try { localStorage.setItem(cartKey(sessionId), JSON.stringify(lines)); } catch { /* storage blocked */ }
}

export function buildCart(sessionId: string) {
  const items = readCart(sessionId)
    .map((l) => {
      const p = seedProducts.find((x) => x.id === l.productId);
      return p ? {
        id: l.id, productId: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
        imageUrl: p.imageUrl, brand: p.brand, inStock: p.inStock, quantity: Math.min(99, l.quantity),
      } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { items, total, itemCount };
}

/** Empties this browser's cart (after an order is placed). */
export function clearCart(sessionId: string) {
  writeCart(sessionId, []);
}

async function bodyOf(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  try {
    if (init?.body && typeof init.body === "string") return JSON.parse(init.body);
    if (typeof Request !== "undefined" && input instanceof Request) return await input.clone().json();
  } catch { /* not JSON */ }
  return null;
}

/* ------------------------------------------------------------------ routes */

async function handle(pathname: string, search: URLSearchParams, method: string, body: () => Promise<any>): Promise<Response | null> {
  // GET /api/categories
  if (pathname === "/api/categories" || pathname === "/categories") {
    return json(seedCategories);
  }

  // GET /api/products/:id
  const idMatch = pathname.match(/^\/(?:api\/)?products\/(\d+)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    const p = seedProducts.find((x) => x.id === id);
    return p ? json(p) : json({ error: "Product not found" }, 404);
  }

  // GET /api/products
  if (pathname === "/api/products" || pathname === "/products") {
    // ?ids=1,2,3: exactly those products (the wishlist)
    const ids = search.get("ids");
    if (ids !== null) {
      const wanted = ids.split(",").map((x) => parseInt(x, 10)).filter(Number.isFinite);
      const products = wanted.map((id) => seedProducts.find((p) => p.id === id)).filter((p): p is SeedProduct => !!p);
      return json({ products, total: products.length, page: 1, totalPages: 1 });
    }
    const category = search.get("category");
    const q = (search.get("search") ?? "").toLowerCase().trim();
    const page = Math.max(1, parseInt(search.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      2000,
      Math.max(1, parseInt(search.get("limit") ?? "20", 10) || 20),
    );

    let filtered: SeedProduct[] = seedProducts;
    if (category) filtered = filtered.filter((p) => p.categorySlug === category);
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((p) => {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }

    // Featured first, then id
    filtered = [...filtered].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.id - b.id;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const products = filtered.slice(start, start + limit);

    return json({
      products,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  // The cart: GET /api/cart?sessionId, POST /api/cart, DELETE /api/cart/:itemId?sessionId
  if (pathname === "/api/cart" && method === "GET") {
    const sessionId = search.get("sessionId");
    if (!sessionId) return json({ error: "sessionId is required" }, 400);
    return json(buildCart(sessionId));
  }
  if (pathname === "/api/cart" && method === "POST") {
    const b = await body();
    const sessionId = typeof b?.sessionId === "string" ? b.sessionId : "";
    const productId = Number(b?.productId);
    const quantity = Math.trunc(Number(b?.quantity ?? 1)) || 0;
    if (!sessionId || !Number.isFinite(productId)) return json({ error: "sessionId and productId are required" }, 400);
    const product = seedProducts.find((p) => p.id === productId);
    if (!product) return json({ error: "Product not found" }, 404);
    if (!product.inStock && quantity > 0) return json({ error: "This product is out of stock" }, 409);
    const lines = readCart(sessionId);
    const line = lines.find((l) => l.productId === productId);
    if (line) line.quantity = Math.min(99, line.quantity + quantity);
    else if (quantity > 0) lines.push({ id: lines.reduce((m, l) => Math.max(m, l.id), 0) + 1, productId, quantity: Math.min(99, quantity) });
    writeCart(sessionId, lines.filter((l) => l.quantity > 0));
    return json(buildCart(sessionId));
  }
  const lineMatch = pathname.match(/^\/api\/cart\/(\d+)$/);
  if (lineMatch && method === "DELETE") {
    const sessionId = search.get("sessionId");
    if (!sessionId) return json({ error: "sessionId is required" }, 400);
    const id = parseInt(lineMatch[1], 10);
    writeCart(sessionId, readCart(sessionId).filter((l) => l.id !== id));
    return json(buildCart(sessionId));
  }

  return null;
}

let installed = false;
export function installMockApi() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const parsed = new URL(url, window.location.origin);
      // Only intercept same-origin API calls
      if (parsed.origin === window.location.origin) {
        const method = (init?.method || (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET")).toUpperCase();
        const mocked = await handle(parsed.pathname, parsed.searchParams, method, () => bodyOf(input, init));
        if (mocked) return mocked;
      }
    } catch {
      // fall through to real fetch
    }
    return originalFetch(input as RequestInfo, init);
  };
}
