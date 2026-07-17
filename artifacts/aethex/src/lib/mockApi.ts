// Client-side mock of the api-server endpoints used by @workspace/api-client-react.
// Serves seed data directly in the browser so the site works without a backend.
import { seedCategories, seedProducts, type SeedProduct } from "@/data/seed";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function handle(pathname: string, search: URLSearchParams): Response | null {
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
    const category = search.get("category");
    const q = (search.get("search") ?? "").toLowerCase();
    const page = Math.max(1, parseInt(search.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(search.get("limit") ?? "20", 10) || 20),
    );

    let filtered: SeedProduct[] = seedProducts;
    if (category) filtered = filtered.filter((p) => p.categorySlug === category);
    if (q) filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));

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
        const mocked = handle(parsed.pathname, parsed.searchParams);
        if (mocked) return mocked;
      }
    } catch {
      // fall through to real fetch
    }
    return originalFetch(input as RequestInfo, init);
  };
}
