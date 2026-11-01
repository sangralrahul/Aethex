/**
 * Update 104: product and book photos through aethex.in (/img?u=<photo address>). The photos live on the brands' and
 * publishers' own sites (Shopify, Omron, HEINE, 3B Scientific…); some answer slowly or refuse photos shown on other
 * sites. Served from here they come from one fast address and are kept at Cloudflare's edge and in the browser for a
 * month. Only hosts that the catalogue's own photos use are allowed (it is not an open proxy). If a host refuses, the
 * site falls back to loading the photo directly (components/store/ProductImage.tsx).
 */
import catalogJson from "../artifacts/aethex/src/data/store/catalog.json";
import booksJson from "../artifacts/aethex/src/data/store/books.json";

let hosts: Set<string> | null = null;
function imageHosts(): Set<string> {
  if (hosts) return hosts;
  const out = new Set<string>();
  const walk = (o: unknown): void => {
    if (typeof o === "string") { if (o.startsWith("https://")) { try { out.add(new URL(o).hostname); } catch { /* not an address */ } } return; }
    if (Array.isArray(o)) { for (const v of o) walk(v); return; }
    if (o && typeof o === "object") for (const v of Object.values(o)) walk(v);
  };
  walk(catalogJson); walk(booksJson);
  return (hosts = out);
}

const MONTH = 30 * 86400;

export async function productImage(request: Request, ctx?: { waitUntil: (p: Promise<unknown>) => void }): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  let target: URL;
  try { target = new URL(url.searchParams.get("u") ?? ""); } catch { return new Response("Bad image address", { status: 400 }); }
  if (target.protocol !== "https:" || !imageHosts().has(target.hostname)) return new Response("Not allowed", { status: 403 });
  target.hash = "";
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default?: Cache }).default : undefined;
  const key = new Request(`https://aethex.in/img?u=${encodeURIComponent(target.toString())}`);
  const hit = cache ? await cache.match(key).catch(() => undefined) : undefined;
  if (hit) return hit;
  let r: Response;
  try {
    r = await fetch(target.toString(), {
      headers: { accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", "user-agent": "Mozilla/5.0 (compatible; AethexImages/1.0; +https://aethex.in)" },
      cf: { cacheEverything: true, cacheTtl: MONTH },
    } as RequestInit);
  } catch {
    return new Response("Photo unavailable", { status: 502, headers: { "cache-control": "no-store" } });
  }
  const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) return new Response("Photo unavailable", { status: 502, headers: { "cache-control": "no-store" } });
  const out = new Response(r.body, { headers: { "content-type": type, "cache-control": `public, max-age=${MONTH}, immutable`, "x-content-type-options": "nosniff", "access-control-allow-origin": "*" } });
  if (cache) { const copy = out.clone(); ctx?.waitUntil(cache.put(key, copy).catch(() => undefined)); }
  return out;
}
