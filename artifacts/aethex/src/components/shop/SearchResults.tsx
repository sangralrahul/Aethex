/**
 * Results as you type in the site's search: the best-matching products, each
 * added to the cart in one tap (or opened when a size or colour must be chosen,
 * or the price is on request), and the way to see them all. Styles: src/buy.css (.ax-sres).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import { useStore } from "@/lib/store/api";
import { cart } from "@/lib/store/cart";
import { itemHref } from "@/lib/store/bookdata";
import { score, searchWords } from "@/lib/store/search";
import { formatINR } from "@/lib/utils";

export function SearchResults({ q, onGo, onAll }: { q: string; onGo: () => void; onAll: () => void }) {
  const { data: store } = useStore();
  const [added, setAdded] = useState<Record<number, number>>({});
  const hits = useMemo(() => {
    if (!store) return [];
    const words = searchWords(q);
    if (!words.length) return [];
    return store.products.map((p) => ({ p, s: score(p, words, store) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
  }, [store, q]);
  if (!store) return <div className="ax-sres"><p className="none">Searching…</p></div>;
  if (!hits.length) return <div className="ax-sres"><p className="none">No products match “{q}”. Press Enter to search books and everything else.</p></div>;
  return (
    <div className="ax-sres" aria-label="Products">
      <ul>
        {hits.slice(0, 6).map((p, i) => {
          const one = (p.variants?.length ?? 0) <= 1;
          const ready = one && p.inStock && !p.priceOnRequest;
          const n = added[p.id];
          return (
            <li key={p.id} style={{ ["--d" as string]: `${i * 35}ms` }}>
              <Link href={itemHref(p.id, p.slug)} className="go" onClick={onGo}>
                <span className="pic"><ProductImage src={p.image} width={96} /></span>
                <span className="tx"><small>{store.brandName(p.brand)}</small><b>{p.name}</b><em>{p.priceOnRequest ? "Price on request" : `${p.from ? "From " : ""}${formatINR(Number(p.price))}`}{!p.inStock ? " · out of stock" : ""}</em></span>
              </Link>
              {ready ? (
                <button type="button" className={`add${n ? " on" : ""}`} onClick={() => { const k = cart.add(p.id, p.variants?.length === 1 ? p.variants[0].id : null, 1); setAdded((a) => ({ ...a, [p.id]: k })); }} aria-label={`Add ${p.name} to cart`}>
                  {n ? <><Check size={15} /> {n} in cart</> : <><ShoppingCart size={15} /> Add</>}
                </button>
              ) : (
                <Link href={itemHref(p.id, p.slug)} className="add ghost" onClick={onGo}>{p.priceOnRequest ? "Ask price" : !one ? "Choose" : "View"}</Link>
              )}
            </li>
          );
        })}
      </ul>
      <div className="foot">
        <button type="button" className="ax-link" onClick={onAll}>See all {hits.length > 6 ? hits.length : ""} results <ArrowRight size={15} /></button>
        {Object.keys(added).length > 0 && <Link href="/cart" className="ax-btn teal" onClick={onGo}><ShoppingCart size={15} /> Go to cart</Link>}
      </div>
    </div>
  );
}
