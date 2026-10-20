/**
 * The shop (/shop, /products, /category/:slug): search, category chips, filters
 * (availability, category, price, rating, brand), sort, grid or list.
 * Styles: src/shop.css (.ax-shop) and the product card (.ax-prod).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import { LayoutGrid, List, Search as SearchIcon, SlidersHorizontal, Star, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAddToCart, useListCategories, useListProducts, type Product } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { ShopHead, type Crumb } from "@/components/shop/ShopHead";
import { TopLayer } from "@/components/shop/TopLayer";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";

const PRICE_RANGES = [
  { id: "u500", label: "Under ₹500", test: (p: number) => p < 500 },
  { id: "500-2000", label: "₹500 – ₹2,000", test: (p: number) => p >= 500 && p < 2000 },
  { id: "2000-5000", label: "₹2,000 – ₹5,000", test: (p: number) => p >= 2000 && p < 5000 },
  { id: "5000+", label: "₹5,000 and above", test: (p: number) => p >= 5000 },
];

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "top-rated", label: "Top rated" },
  { value: "newest", label: "Newest first" },
];

const PAGE = 48;

type Category = { id: number; name: string; slug: string; productCount?: number };

function asCategories(data: unknown): Category[] {
  if (Array.isArray(data)) return data as Category[];
  const d = data as { data?: unknown; categories?: unknown; items?: unknown } | undefined;
  for (const k of [d?.data, d?.categories, d?.items]) if (Array.isArray(k)) return k as Category[];
  return [];
}

interface FilterProps {
  categories: Category[];
  category: string;
  setCategory: (slug: string) => void;
  prices: string[];
  togglePrice: (id: string) => void;
  minRating: number | null;
  setMinRating: (r: number | null) => void;
  inStock: boolean;
  setInStock: (v: boolean) => void;
  brands: string[];
  allBrands: string[];
  toggleBrand: (b: string) => void;
  onClear: () => void;
  active: boolean;
}

function Filters(f: FilterProps) {
  const [brandQ, setBrandQ] = useState("");
  const shownBrands = f.allBrands.filter((b) => b.toLowerCase().includes(brandQ.toLowerCase()));
  return (
    <div className="ax-filters-in">
      <div className="ax-f-head">
        <b>Filters</b>
        {f.active && <button type="button" className="ax-f-clear" onClick={f.onClear}>Clear all</button>}
      </div>

      <div className="ax-f-sec">
        <label className="ax-switch">
          <input type="checkbox" checked={f.inStock} onChange={(e) => f.setInStock(e.target.checked)} />
          <span className="track"><i /></span>
          <span>In stock only</span>
        </label>
      </div>

      <div className="ax-f-sec">
        <h3>Category</h3>
        <div className="ax-f-cats">
          <button type="button" className={!f.category ? "on" : ""} onClick={() => f.setCategory("")}>All categories</button>
          {f.categories.map((c) => (
            <button type="button" key={c.slug} className={f.category === c.slug ? "on" : ""} onClick={() => f.setCategory(c.slug)}>
              <span>{c.name}</span>{c.productCount ? <em>{c.productCount}</em> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="ax-f-sec">
        <h3>Price</h3>
        {PRICE_RANGES.map((r) => (
          <label key={r.id} className="ax-check">
            <input type="checkbox" checked={f.prices.includes(r.id)} onChange={() => f.togglePrice(r.id)} />
            <span className="box" /> {r.label}
          </label>
        ))}
      </div>

      <div className="ax-f-sec">
        <h3>Customer rating</h3>
        {[4, 3].map((r) => (
          <label key={r} className="ax-check radio">
            <input type="radio" name="ax-rating" checked={f.minRating === r} onChange={() => f.setMinRating(r)} onClick={() => f.minRating === r && f.setMinRating(null)} />
            <span className="box" /> <span className="ax-stars-mini"><Star size={12} fill="currentColor" /> {r}</span> and above
          </label>
        ))}
      </div>

      {f.allBrands.length > 0 && (
        <div className="ax-f-sec">
          <h3>Brand</h3>
          {f.allBrands.length > 8 && (
            <div className="ax-f-search"><SearchIcon size={14} /><input value={brandQ} onChange={(e) => setBrandQ(e.target.value)} placeholder="Find a brand" aria-label="Find a brand" /></div>
          )}
          <div className="ax-f-brands">
            {shownBrands.map((b) => (
              <label key={b} className="ax-check">
                <input type="checkbox" checked={f.brands.includes(b)} onChange={() => f.toggleBrand(b)} />
                <span className="box" /> {b}
              </label>
            ))}
            {shownBrands.length === 0 && <p className="ax-f-none">No brand matches.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Products() {
  const [, setLocation] = useLocation();
  const [onCategoryPath, catParams] = useRoute("/category/:slug");
  const searchString = useSearch();
  const sp = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const category = (onCategoryPath ? catParams?.slug : sp.get("category")) || "";
  const searchFilter = (sp.get("search") || "").trim();
  const brandParam = sp.get("brand") || "";

  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [sortBy, setSortBy] = useState("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [prices, setPrices] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStock, setInStock] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState<null | "filter" | "sort">(null);

  const sessionId = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addToCart = useAddToCart();

  const { data: productsData, isLoading } = useListProducts({ category: category || undefined, search: searchFilter || undefined, limit: 2000 });
  const { data: categoriesData } = useListCategories();
  const categories = asCategories(categoriesData);
  const activeCategory = categories.find((c) => c.slug === category) ?? null;

  useEffect(() => { setLocalSearch(searchFilter); }, [searchFilter]);
  useEffect(() => { setBrands(brandParam ? [brandParam] : []); }, [brandParam]);
  useEffect(() => { setShown(PAGE); }, [category, searchFilter, prices, brands, minRating, inStock, sortBy]);
  useEffect(() => { document.body.style.overflow = sheet ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [sheet]);

  const title = searchFilter ? `Results for "${searchFilter}"` : activeCategory?.name ?? "Medical Store";
  useSeo({
    title: `${title} | Aethex Medical Store`,
    description: activeCategory ? `Shop ${activeCategory.name.toLowerCase()} on Aethex: genuine products from trusted brands, delivered across India.` : "Genuine medical supplies for Indian doctors and students: stethoscopes, scrubs, books, instruments and equipment.",
    path: onCategoryPath ? `/category/${category}` : "/shop",
  });

  const go = (next: { category?: string; search?: string }) => {
    const params = new URLSearchParams();
    const s = next.search !== undefined ? next.search : searchFilter;
    const c = next.category !== undefined ? next.category : category;
    if (s) params.set("search", s);
    const q = params.toString();
    setLocation(c ? `/category/${c}${q ? `?${q}` : ""}` : `/shop${q ? `?${q}` : ""}`);
  };
  const setCategory = (slug: string) => { go({ category: slug }); setSheet(null); };
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); go({ search: localSearch.trim() }); };

  const clearAll = () => {
    setPrices([]); setBrands([]); setMinRating(null); setInStock(false);
    if (category || searchFilter) setLocation("/shop");
  };

  const handleAddToCart = (productId: number) => {
    if (!sessionId) return;
    addToCart.mutate(
      { data: { productId, sessionId, quantity: 1 } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: "Added to cart" }); },
        onError: () => toast({ variant: "destructive", title: "Couldn't add to cart", description: "Please try again." }),
      },
    );
  };

  const all: Product[] = (productsData as { products?: Product[] } | undefined)?.products ?? [];
  const allBrands = useMemo(() => Array.from(new Set(all.map((p) => p.brand).filter(Boolean))).sort(), [all]);

  const results = useMemo(() => {
    let list = all;
    if (prices.length) list = list.filter((p) => prices.some((id) => PRICE_RANGES.find((r) => r.id === id)?.test(Number(p.price))));
    if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    if (minRating !== null) list = list.filter((p) => Number(p.rating) >= minRating);
    if (inStock) list = list.filter((p) => p.inStock);
    const sorted = [...list];
    if (sortBy === "price-asc") sorted.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-desc") sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "top-rated") sorted.sort((a, b) => Number(b.rating) - Number(a.rating) || b.reviewCount - a.reviewCount);
    if (sortBy === "newest") sorted.sort((a, b) => b.id - a.id);
    return sorted;
  }, [all, prices, brands, minRating, inStock, sortBy]);

  const filterCount = prices.length + brands.length + (minRating !== null ? 1 : 0) + (inStock ? 1 : 0);
  const active = !!(category || searchFilter || filterCount);
  const togglePrice = (id: string) => setPrices((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleBrand = (b: string) => setBrands((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  const filterProps: FilterProps = {
    categories, category, setCategory, prices, togglePrice, minRating, setMinRating, inStock, setInStock,
    brands, allBrands, toggleBrand, onClear: clearAll, active,
  };

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }];
  if (activeCategory) crumbs.push({ label: activeCategory.name });
  else if (searchFilter) crumbs.push({ label: "Search" });

  const countText = isLoading ? "Loading products…" : `${results.length.toLocaleString("en-IN")} product${results.length === 1 ? "" : "s"}`;

  return (
    <div className="ax-shop-page">
      <ShopHead
        crumbs={crumbs}
        title={title}
        sub={activeCategory && !searchFilter ? `${countText} · Genuine products from trusted brands` : `${countText}${searchFilter && activeCategory ? ` in ${activeCategory.name}` : ""}`}
        right={
          <form className="ax-sh-search" role="search" onSubmit={submitSearch}>
            <SearchIcon size={17} aria-hidden="true" />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search the store" aria-label="Search the store" />
            {localSearch && <button type="button" className="clr" onClick={() => { setLocalSearch(""); if (searchFilter) go({ search: "" }); }} aria-label="Clear search"><X size={15} /></button>}
          </form>
        }
      >
        <div className="ax-chips" role="list" aria-label="Categories">
          <button type="button" role="listitem" className={!category ? "on" : ""} onClick={() => setCategory("")}>All</button>
          {categories.map((c) => (
            <button type="button" role="listitem" key={c.slug} className={category === c.slug ? "on" : ""} onClick={() => setCategory(c.slug)}>{c.name}</button>
          ))}
        </div>
      </ShopHead>

      <div className="ax-wrap ax-shop">
        <aside className="ax-filters" aria-label="Filters"><Filters {...filterProps} /></aside>

        <div className="ax-results">
          <div className="ax-toolbar">
            <p className="ax-count">{countText}</p>
            <div className="ax-active">
              {inStock && <button type="button" onClick={() => setInStock(false)}>In stock <X size={12} /></button>}
              {minRating !== null && <button type="button" onClick={() => setMinRating(null)}>{minRating}★ and above <X size={12} /></button>}
              {prices.map((id) => <button type="button" key={id} onClick={() => togglePrice(id)}>{PRICE_RANGES.find((r) => r.id === id)?.label} <X size={12} /></button>)}
              {brands.map((b) => <button type="button" key={b} onClick={() => toggleBrand(b)}>{b} <X size={12} /></button>)}
            </div>
            <label className="ax-sort">
              <span>Sort</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort products">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <div className="ax-view" role="group" aria-label="Layout">
              <button type="button" className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} aria-label="Grid" aria-pressed={view === "grid"}><LayoutGrid size={16} /></button>
              <button type="button" className={view === "list" ? "on" : ""} onClick={() => setView("list")} aria-label="List" aria-pressed={view === "list"}><List size={16} /></button>
            </div>
          </div>

          {isLoading ? (
            <div className={`ax-grid ${view}`}>{Array.from({ length: 8 }, (_, k) => <div key={k} className="ax-prod sk" />)}</div>
          ) : results.length === 0 ? (
            <div className="ax-empty">
              <span className="ic"><SearchIcon size={26} /></span>
              <h2>No products match</h2>
              <p>Try fewer filters, another category, or a different search.</p>
              <div className="acts">
                <button type="button" className="ax-btn teal" onClick={clearAll}>Clear filters</button>
                <Link href="/shop" className="ax-btn">See all products</Link>
              </div>
            </div>
          ) : (
            <>
              <div className={`ax-grid ${view}`}>
                {results.slice(0, shown).map((p) => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} isAdding={addToCart.isPending} viewMode={view} />
                ))}
              </div>
              {results.length > shown && (
                <div className="ax-more">
                  <p>Showing {shown} of {results.length.toLocaleString("en-IN")}</p>
                  <button type="button" className="ax-btn" onClick={() => setShown((n) => n + PAGE)}>Show more products</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* phones: filter and sort sheets */}
      <div className="ax-mbar">
        <button type="button" onClick={() => setSheet("filter")}><SlidersHorizontal size={16} /> Filter{filterCount ? <em>{filterCount}</em> : null}</button>
        <button type="button" onClick={() => setSheet("sort")}>Sort: {SORTS.find((s) => s.value === sortBy)?.label}</button>
      </div>
      {sheet && (
        <TopLayer>
        <div className="ax-sheet" role="dialog" aria-modal="true" aria-label={sheet === "filter" ? "Filters" : "Sort"} onClick={() => setSheet(null)}>
          <div className="ax-sheet-in" onClick={(e) => e.stopPropagation()}>
            <div className="ax-sheet-head">
              <b>{sheet === "filter" ? "Filters" : "Sort by"}</b>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="ax-sheet-body">
              {sheet === "filter" ? <Filters {...filterProps} /> : (
                <div className="ax-sort-list">
                  {SORTS.map((s) => (
                    <button type="button" key={s.value} className={sortBy === s.value ? "on" : ""} onClick={() => { setSortBy(s.value); setSheet(null); }}>{s.label}</button>
                  ))}
                </div>
              )}
            </div>
            {sheet === "filter" && (
              <div className="ax-sheet-foot"><button type="button" className="ax-btn teal" onClick={() => setSheet(null)}>Show {results.length.toLocaleString("en-IN")} product{results.length === 1 ? "" : "s"}</button></div>
            )}
          </div>
        </div>
        </TopLayer>
      )}
    </div>
  );
}
