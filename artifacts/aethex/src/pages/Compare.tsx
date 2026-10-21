/**
 * Compare products (/compare?ids=12,34,56): up to three side by side, with
 * price, stars from buyers, stock, sizes or colours, warranty, country of
 * origin, every specification either of them lists, and the main features.
 * Picked with the "Compare" tick on the shop and product pages
 * (lib/store/compare.ts); the address can be shared. Styles: src/shop.css (.ax-cmp).
 */
import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { BadgeCheck, GitCompareArrows, MessageSquareText, ShoppingCart, Star, X } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { ProductImage } from "@/components/store/ProductImage";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useProduct, useStore } from "@/lib/store/api";
import { cart } from "@/lib/store/cart";
import { compare, COMPARE_MAX, useCompareIds } from "@/lib/store/compare";
import { discountPct, unitFor } from "@/lib/store/rules";
import type { Product } from "@/lib/store/types";
import { formatINR } from "@/lib/utils";

export default function Compare() {
  useSeo({ title: "Compare products | Aethex Store", description: "Compare medical devices side by side: price, specifications, warranty and reviews.", path: "/compare" });
  const search = useSearch();
  const [, setLocation] = useLocation();
  const picked = useCompareIds();
  const fromUrl = useMemo(() => (new URLSearchParams(search).get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, COMPARE_MAX), [search]);
  const ids = fromUrl.length ? fromUrl : picked;
  // A shared link becomes this browser's list too, so the tray and the page agree.
  useEffect(() => { if (fromUrl.length && fromUrl.join() !== picked.join()) compare.set(fromUrl); }, [fromUrl.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: store } = useStore();
  const q0 = useProduct(ids[0] ? String(ids[0]) : undefined);
  const q1 = useProduct(ids[1] ? String(ids[1]) : undefined);
  const q2 = useProduct(ids[2] ? String(ids[2]) : undefined);
  const products = [q0.data, q1.data, q2.data].filter((p): p is Product => !!p).filter((p) => ids.includes(p.id));
  const loading = [q0, q1, q2].some((q, i) => ids[i] && q.isLoading);
  // The lowest price, when at least two have a price and they differ.
  const priced = products.filter((p) => !p.priceOnRequest && p.price !== null);
  const low = priced.length >= 2 ? priced.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a)) : null;
  const lowest = low && priced.some((p) => Number(p.price) !== Number(low.price)) && priced.filter((p) => Number(p.price) === Number(low.price)).length === 1 ? low.id : null;
  const { toast } = useToast();

  const remove = (id: number) => {
    compare.remove(id);
    const rest = ids.filter((x) => x !== id);
    setLocation(rest.length ? `/compare?ids=${rest.join(",")}` : "/compare", { replace: true });
  };

  const rows = useMemo(() => {
    const brand = (p: Product) => store?.brandName(p.brand) ?? p.brand;
    const category = (p: Product) => store?.category(p.category)?.name ?? "";
    const out: [string, (p: Product) => React.ReactNode][] = [
      ["Brand", (p) => <Link href={`/brand/${p.brand}`}>{brand(p)}</Link>],
      ["Type", (p) => [category(p), p.subcategory].filter(Boolean).join(" · ") || "—"],
      ["Model", (p) => p.model || "—"],
      ["Reviews", (p) => (p.rating?.count ? <span className="rt"><Star size={14} fill="currentColor" /> {p.rating.avg.toFixed(1)} <em>({p.rating.count})</em></span> : <span className="muted">No reviews yet</span>)],
      ["Availability", (p) => (p.priceOnRequest ? "Price on request" : p.inStock ? "In stock" : "Out of stock")],
      ["Options", (p) => (p.variants?.length ? `${p.variants.length} ${(p.optionName ?? "option").toLowerCase()}${p.variants.length === 1 ? "" : "s"}: ${p.variants.map((v) => v.label).slice(0, 8).join(", ")}${p.variants.length > 8 ? "…" : ""}` : "—")],
      ["Warranty", (p) => p.warranty || "Manufacturer's warranty"],
      ["Country of origin", (p) => p.countryOfOrigin || "As on the pack"],
      ["In the box", (p) => p.inTheBox || "—"],
      ["Replacement", (p) => (p.returns === "replacement" ? "If damaged, defective or wrong (can't be returned once opened)" : "If damaged, defective or wrong")],
    ];
    // Every specification any of them lists, in the order they first appear.
    const keys: string[] = [];
    for (const p of products) for (const [k] of p.specs ?? []) if (!keys.includes(k)) keys.push(k);
    for (const k of keys) out.push([k, (p) => p.specs?.find(([x]) => x === k)?.[1] ?? "—"]);
    out.push(["Features", (p) => (p.features.length ? <ul>{p.features.slice(0, 6).map((f) => <li key={f}>{f}</li>)}</ul> : "—")]);
    return out;
  }, [products, store]);

  const add = (p: Product) => {
    const only = p.variants?.length === 1 ? p.variants[0].id : null;
    if ((p.variants?.length ?? 0) > 1) { setLocation(`/products/${p.slug}`); return; }
    if (typeof unitFor(p, only) !== "object") return;
    cart.add(p.id, only, 1);
    toast({ title: "Added to cart", description: p.name });
  };

  return (
    <div className="ax-cart-page">
      <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Compare" }]} title="Compare products"
        sub={ids.length ? `${ids.length} of ${COMPARE_MAX} picked` : undefined} />
      <div className="ax-wrap ax-cmp">
        {!ids.length ? (
          <div className="ax-empty">
            <span className="ic"><GitCompareArrows size={26} /></span>
            <h2>Pick products to compare</h2>
            <p>Tick “Compare” on up to {COMPARE_MAX} products in the shop, then open them here side by side.</p>
            <div className="acts"><Link href="/shop" className="ax-btn teal">Browse the store</Link></div>
          </div>
        ) : loading && !products.length ? (
          <div className="sk" style={{ height: 420 }} />
        ) : (
          <>
            {products.length < 2 && <p className="ax-cmp-note">Add {products.length ? "one more product" : "products"} from the <Link href="/shop">shop</Link> to compare side by side.</p>}
            <div className="ax-cmp-scroll">
              <table className={`ax-cmp-table n${products.length}`}>
                <thead>
                  <tr>
                    <td />
                    {products.map((p) => {
                      const off = p.priceOnRequest ? 0 : discountPct(p.price, p.mrp);
                      return (
                        <th key={p.id} scope="col">
                          <button type="button" className="x" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}><X size={15} /></button>
                          <Link href={`/products/${p.slug}`} className="pic"><ProductImage src={p.images[0]} width={320} /></Link>
                          <Link href={`/products/${p.slug}`} className="nm">{p.name}</Link>
                          <span className="pr">{p.priceOnRequest ? <b className="por">Price on request</b> : <><b>{(p.variants?.length ?? 0) > 1 && new Set(p.variants!.map((v) => v.price ?? p.price)).size > 1 ? "From " : ""}{formatINR(Number(p.price))}</b>{off >= 5 && <><s>{formatINR(Number(p.mrp))}</s><em>{off}% off</em></>}</>}</span>
                          {(p.offer || lowest === p.id) && (
                            <span className="tags">
                              {lowest === p.id && <span className="best"><BadgeCheck size={13} /> Lowest price</span>}
                              {p.offer && <span className="sale">{p.offer.title}</span>}
                            </span>
                          )}
                          {p.priceOnRequest
                            ? <Link href={`/products/${p.slug}#ask`} className="ax-btn sm"><MessageSquareText size={15} /> Ask price</Link>
                            : p.inStock
                              ? <button type="button" className="ax-btn teal sm" onClick={() => add(p)}><ShoppingCart size={15} /> {(p.variants?.length ?? 0) > 1 ? "Choose" : "Add to cart"}</button>
                              : <Link href={`/products/${p.slug}`} className="ax-btn sm">Out of stock</Link>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, cell]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {products.map((p) => <td key={p.id}>{cell(p)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="ax-cmp-note">Details are from each brand's product information. <button type="button" className="ax-link" onClick={() => { compare.clear(); setLocation("/compare", { replace: true }); }}>Clear the comparison</button></p>
          </>
        )}
      </div>
    </div>
  );
}
