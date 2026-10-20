/**
 * The shop (/shop, /products, /category/:slug, /brand/:slug): search, category
 * and brand pages, filters (availability, type, brand, price), sort, grid or
 * list. Products come from the store catalogue (lib/store).
 * Styles: src/shop.css (.ax-shop) and the product card (.ax-prod).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute, useSearch } from "wouter";
import { BadgeCheck, ExternalLink, LayoutGrid, List, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShopHead, type Crumb } from "@/components/shop/ShopHead";
import { TopLayer } from "@/components/shop/TopLayer";
import { useSeo } from "@/hooks/use-seo";
import { useStore, type StoreData } from "@/lib/store/api";
import type { ProductSummary } from "@/lib/store/types";
import { discountPct, mixBrands } from "@/lib/store/rules";

const PRICE_RANGES = [
  { id: "u500", label: "Under ₹500", test: (p: number) => p < 500 },
  { id: "500-1500", label: "₹500 – ₹1,500", test: (p: number) => p >= 500 && p < 1500 },
  { id: "1500-3000", label: "₹1,500 – ₹3,000", test: (p: number) => p >= 1500 && p < 3000 },
  { id: "3000+", label: "₹3,000 and above", test: (p: number) => p >= 3000 },
];

const SORTS = [
  { value: "relevance", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
  { value: "name", label: "Name: A to Z" },
];

const PAGE = 48;

/** Words people search with, mapped to the words products use. */
const SYNONYMS: Record<string, string[]> = {
  bp: ["bp", "blood pressure", "sphygmomanometer"], "blood-pressure": ["bp", "blood pressure"],
  nebuliser: ["nebulizer"], nebulizer: ["nebulizer"], spo2: ["oximeter"], oxygen: ["oximeter"],
  sugar: ["gluco", "glucose"], glucose: ["gluco", "glucose"], diabetes: ["gluco", "lancet", "strip"],
  weight: ["scale", "weigh"], weighing: ["scale", "weigh"], paediatric: ["paediatric", "pediatric", "child", "kids", "infant"],
  pediatric: ["paediatric", "pediatric", "child", "kids"], orthopedic: ["orthopaedic", "orthopedic", "ortho"],
  colour: ["colour", "color"], fever: ["thermometer"], temperature: ["thermometer"], brace: ["brace", "support", "splint"],
  massager: ["massager", "tens", "massage"], tens: ["tens"], pillow: ["pillow", "cushion"], cushion: ["cushion", "pillow"],
};

function searchText(p: ProductSummary, store: StoreData) {
  return `${p.name} ${store.brandName(p.brand)} ${store.category(p.category)?.name ?? ""} ${p.subcategory} ${p.model ?? ""}`.toLowerCase();
}

function score(p: ProductSummary, words: string[], store: StoreData): number {
  const name = p.name.toLowerCase();
  const hay = searchText(p, store);
  let s = 0;
  for (const w of words) {
    const alts = SYNONYMS[w] ?? [w];
    if (alts.some((a) => name.includes(a))) s += 3;
    else if (alts.some((a) => hay.includes(a))) s += 1;
    else return 0;
  }
  return s + (p.featured ? 0.5 : 0) + (p.inStock ? 0.25 : 0);
}

interface FilterProps {
  store: StoreData;
  scope: ProductSummary[];
  category: string;
  brandPage: string;
  goCategory: (slug: string) => void;
  sub: string;
  setSub: (s: string) => void;
  prices: string[];
  togglePrice: (id: string) => void;
  inStock: boolean;
  setInStock: (v: boolean) => void;
  pricedOnly: boolean;
  setPricedOnly: (v: boolean) => void;
  brands: string[];
  toggleBrand: (b: string) => void;
  onClear: () => void;
  active: boolean;
}

function Filters(f: FilterProps) {
  const subs = useMemo(() => {
    const m = new Map<string, number>();
    f.scope.forEach((p) => { if (p.subcategory && (!f.category || p.category === f.category)) m.set(p.subcategory, (m.get(p.subcategory) ?? 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [f.scope, f.category]);
  const brandCounts = useMemo(() => {
    const m = new Map<string, number>();
    f.scope.forEach((p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1));
    return f.store.brands.filter((b) => m.has(b.slug)).map((b) => ({ ...b, n: m.get(b.slug)! }));
  }, [f.scope, f.store]);
  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    f.scope.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1));
    return f.store.categories.filter((c) => m.has(c.slug)).map((c) => ({ ...c, n: m.get(c.slug)! }));
  }, [f.scope, f.store]);

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
        <label className="ax-switch">
          <input type="checkbox" checked={f.pricedOnly} onChange={(e) => f.setPricedOnly(e.target.checked)} />
          <span className="track"><i /></span>
          <span>Ready to buy (priced)</span>
        </label>
      </div>

      {!f.category && catCounts.length > 1 && (
        <div className="ax-f-sec">
          <h3>Category</h3>
          <div className="ax-f-cats">
            {catCounts.map((c) => (
              <button type="button" key={c.slug} onClick={() => f.goCategory(c.slug)}>
                <span>{c.name}</span><em>{c.n}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      {subs.length > 1 && (
        <div className="ax-f-sec">
          <h3>Type</h3>
          <div className="ax-f-cats">
            <button type="button" className={!f.sub ? "on" : ""} onClick={() => f.setSub("")}><span>All types</span></button>
            {subs.map(([name, n]) => (
              <button type="button" key={name} className={f.sub === name ? "on" : ""} onClick={() => f.setSub(f.sub === name ? "" : name)}>
                <span>{name}</span><em>{n}</em>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ax-f-sec">
        <h3>Price</h3>
        {PRICE_RANGES.map((r) => (
          <label key={r.id} className="ax-check">
            <input type="checkbox" checked={f.prices.includes(r.id)} onChange={() => f.togglePrice(r.id)} />
            <span className="box" /> {r.label}
          </label>
        ))}
      </div>

      {!f.brandPage && brandCounts.length > 1 && (
        <div className="ax-f-sec">
          <h3>Brand</h3>
          <div className="ax-f-brands">
            {brandCounts.map((b) => (
              <label key={b.slug} className="ax-check">
                <input type="checkbox" checked={f.brands.includes(b.slug)} onChange={() => f.toggleBrand(b.slug)} />
                <span className="box" /> {b.name} <em className="n">{b.n}</em>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Products() {
  const [, setLocation] = useLocation();
  const [onCategory, catParams] = useRoute("/category/:slug");
  const [onBrand, brandParams] = useRoute("/brand/:slug");
  const searchString = useSearch();
  const sp = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const { data: store, isLoading, error, refetch } = useStore();

  const category = (onCategory ? catParams?.slug : sp.get("category")) || "";
  const brandPage = (onBrand ? brandParams?.slug : "") || "";
  const searchFilter = (sp.get("search") || "").trim();
  const brandParam = sp.get("brand") || "";

  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [sortBy, setSortBy] = useState("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [prices, setPrices] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>(brandParam ? [brandParam] : []);
  const [sub, setSub] = useState(sp.get("type") || "");
  const [inStock, setInStock] = useState(false);
  const [pricedOnly, setPricedOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState<null | "filter" | "sort">(null);

  useEffect(() => { setLocalSearch(searchFilter); }, [searchFilter]);
  useEffect(() => { setBrands(brandParam ? [brandParam] : []); }, [brandParam]);
  useEffect(() => { setSub(sp.get("type") || ""); }, [category, brandPage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setShown(PAGE); }, [category, brandPage, searchFilter, prices, brands, sub, inStock, pricedOnly, sortBy]);
  useEffect(() => { document.body.style.overflow = sheet ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [sheet]);

  const activeCategory = store && category ? store.category(category) ?? null : null;
  const activeBrand = store && brandPage ? store.brand(brandPage) ?? null : null;
  const unknownPage = !!store && ((!!category && !activeCategory) || (!!brandPage && !activeBrand));

  const title = searchFilter ? `Results for "${searchFilter}"` : activeBrand?.name ?? activeCategory?.name ?? "Shop all products";
  useSeo({
    title: `${searchFilter ? title : activeBrand ? `${activeBrand.name} products` : activeCategory ? `${activeCategory.name}: buy online` : "Medical devices and supplies"} | Aethex Store`,
    description: activeBrand
      ? `${activeBrand.about} Buy genuine ${activeBrand.name} products on Aethex, with cash on delivery across India.`
      : activeCategory
        ? `${activeCategory.blurb} Genuine products from OMRON, Dr Trust, Tynor, Accu-Chek, Littmann and more, with cash on delivery across India.`
        : "Genuine BP monitors, stethoscopes, glucometers, oximeters, orthopaedic supports and diagnostic instruments from verified brands, with cash on delivery across India.",
    path: onCategory ? `/category/${category}` : onBrand ? `/brand/${brandPage}` : "/shop",
  });

  const go = (next: { category?: string; search?: string }) => {
    const params = new URLSearchParams();
    const s = next.search !== undefined ? next.search : searchFilter;
    const c = next.category !== undefined ? next.category : category;
    if (s) params.set("search", s);
    const q = params.toString();
    if (brandPage && next.category === undefined) { setLocation(`/brand/${brandPage}${q ? `?${q}` : ""}`); return; }
    setLocation(c ? `/category/${c}${q ? `?${q}` : ""}` : `/shop${q ? `?${q}` : ""}`);
  };
  const goCategory = (slug: string) => { setSheet(null); setSub(""); setLocation(slug ? `/category/${slug}${searchFilter ? `?search=${encodeURIComponent(searchFilter)}` : ""}` : "/shop"); };
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); go({ search: localSearch.trim() }); };
  const clearAll = () => {
    setPrices([]); setBrands([]); setSub(""); setInStock(false); setPricedOnly(false);
    if (searchFilter) go({ search: "" });
  };

  // What this page is about (category, brand, search), before the filters.
  const scope = useMemo(() => {
    if (!store) return [];
    let list = store.products;
    if (category) list = list.filter((p) => p.category === category);
    if (brandPage) list = list.filter((p) => p.brand === brandPage);
    if (searchFilter) {
      const words = searchFilter.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 1 || /\d/.test(w));
      list = list.map((p) => ({ p, s: score(p, words, store) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
    }
    return list;
  }, [store, category, brandPage, searchFilter]);

  const results = useMemo(() => {
    let list = scope;
    if (sub) list = list.filter((p) => p.subcategory === sub);
    if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    if (inStock) list = list.filter((p) => p.inStock);
    if (pricedOnly || prices.length) list = list.filter((p) => !p.priceOnRequest);
    if (prices.length) list = list.filter((p) => prices.some((id) => PRICE_RANGES.find((r) => r.id === id)?.test(Number(p.price))));
    const sorted = [...list];
    const priceOf = (p: ProductSummary) => (p.priceOnRequest ? Infinity : Number(p.price));
    if (sortBy === "relevance" && !searchFilter) {
      return mixBrands(list, (p) => Number(p.inStock) * 4 + Number(p.featured) * 2 + Number(!p.priceOnRequest));
    }
    if (sortBy === "price-asc") sorted.sort((a, b) => priceOf(a) - priceOf(b));
    if (sortBy === "price-desc") sorted.sort((a, b) => (b.priceOnRequest ? -1 : Number(b.price)) - (a.priceOnRequest ? -1 : Number(a.price)));
    if (sortBy === "discount") sorted.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp));
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [scope, sub, brands, inStock, pricedOnly, prices, sortBy, searchFilter]);

  const filterCount = prices.length + brands.length + (sub ? 1 : 0) + (inStock ? 1 : 0) + (pricedOnly ? 1 : 0);
  const active = !!(searchFilter || filterCount);
  const togglePrice = (id: string) => setPrices((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleBrand = (b: string) => setBrands((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }];
  if (activeBrand) crumbs.push({ label: "Brands", href: "/brands" }, { label: activeBrand.name });
  else if (activeCategory) crumbs.push({ label: activeCategory.name });
  else if (searchFilter) crumbs.push({ label: "Search" });

  const countText = isLoading || !store ? "Loading products…" : `${results.length.toLocaleString("en-IN")} product${results.length === 1 ? "" : "s"}`;
  const brandCats = useMemo(() => (store && brandPage ? store.categories.filter((c) => scope.some((p) => p.category === c.slug)) : []), [store, brandPage, scope]);

  if (error && !store) {
    return (
      <div className="ax-shop-page">
        <ShopHead crumbs={crumbs} title="Shop" />
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "40px 0" }}>
          <span className="ic"><SearchIcon size={26} /></span>
          <h2>The store didn't load</h2>
          <p>{error.message}</p>
          <div className="acts"><button type="button" className="ax-btn teal" onClick={() => refetch()}>Try again</button></div>
        </div></div>
      </div>
    );
  }

  if (unknownPage) {
    return (
      <div className="ax-shop-page">
        <ShopHead crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }]} title="Not found" />
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "40px 0" }}>
          <span className="ic"><SearchIcon size={26} /></span>
          <h2>We don't have that {category ? "category" : "brand"}</h2>
          <p>Browse everything in the store, or search for what you need.</p>
          <div className="acts"><Link href="/shop" className="ax-btn teal">See all products</Link></div>
        </div></div>
      </div>
    );
  }

  const filterProps: FilterProps | null = store ? {
    store, scope, category, brandPage, goCategory, sub, setSub, prices, togglePrice, inStock, setInStock, pricedOnly, setPricedOnly,
    brands, toggleBrand, onClear: clearAll, active,
  } : null;

  const sub2 = activeBrand
    ? <>{activeBrand.about} <span className="ax-sh-meta">{countText}</span></>
    : activeCategory && !searchFilter
      ? <>{activeCategory.blurb} <span className="ax-sh-meta">{countText}</span></>
      : <>{countText}{searchFilter && activeCategory ? ` in ${activeCategory.name}` : ""}{!searchFilter ? " · genuine products from verified brands" : ""}</>;

  return (
    <div className="ax-shop-page">
      <ShopHead
        crumbs={crumbs}
        title={activeBrand ? <span className="ax-brand-title"><BadgeCheck size={24} aria-hidden="true" /> {activeBrand.name}</span> : title}
        sub={sub2}
        right={
          <form className="ax-sh-search" role="search" onSubmit={submitSearch}>
            <SearchIcon size={17} aria-hidden="true" />
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder={activeBrand ? `Search ${activeBrand.name}` : "Search the store"} aria-label="Search the store" />
            {localSearch && <button type="button" className="clr" onClick={() => { setLocalSearch(""); if (searchFilter) go({ search: "" }); }} aria-label="Clear search"><X size={15} /></button>}
          </form>
        }
      >
        {activeBrand ? (
          <div className="ax-chips" role="list" aria-label={`${activeBrand.name} categories`}>
            {brandCats.map((c) => (
              <Link role="listitem" key={c.slug} href={`/category/${c.slug}?brand=${activeBrand.slug}`}>{c.name}</Link>
            ))}
            {activeBrand.website && <a className="ext" href={activeBrand.website} target="_blank" rel="noopener noreferrer">{activeBrand.name} website <ExternalLink size={12} /></a>}
          </div>
        ) : (
          <div className="ax-chips" role="list" aria-label="Categories">
            <button type="button" role="listitem" className={!category ? "on" : ""} onClick={() => goCategory("")}>All</button>
            {store?.categories.map((c) => (
              <button type="button" role="listitem" key={c.slug} className={category === c.slug ? "on" : ""} onClick={() => goCategory(c.slug)}>{c.name}</button>
            ))}
          </div>
        )}
      </ShopHead>

      <div className="ax-wrap ax-shop">
        <aside className="ax-filters" aria-label="Filters">{filterProps && <Filters {...filterProps} />}</aside>

        <div className="ax-results">
          <div className="ax-toolbar">
            <p className="ax-count">{countText}</p>
            <div className="ax-active">
              {inStock && <button type="button" onClick={() => setInStock(false)}>In stock <X size={12} /></button>}
              {pricedOnly && <button type="button" onClick={() => setPricedOnly(false)}>Ready to buy <X size={12} /></button>}
              {sub && <button type="button" onClick={() => setSub("")}>{sub} <X size={12} /></button>}
              {prices.map((id) => <button type="button" key={id} onClick={() => togglePrice(id)}>{PRICE_RANGES.find((r) => r.id === id)?.label} <X size={12} /></button>)}
              {brands.map((b) => <button type="button" key={b} onClick={() => toggleBrand(b)}>{store?.brandName(b) ?? b} <X size={12} /></button>)}
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

          {isLoading || !store ? (
            <div className={`ax-grid ${view}`}>{Array.from({ length: 8 }, (_, k) => <div key={k} className="ax-prod sk" />)}</div>
          ) : results.length === 0 ? (
            <div className="ax-empty">
              <span className="ic"><SearchIcon size={26} /></span>
              <h2>No products match</h2>
              <p>{searchFilter ? "Try a shorter search, or another word for it." : "Try fewer filters, or another category."}</p>
              <div className="acts">
                {active && <button type="button" className="ax-btn teal" onClick={clearAll}>Clear filters</button>}
                <Link href="/shop" className="ax-btn">See all products</Link>
              </div>
            </div>
          ) : (
            <>
              <div className={`ax-grid ${view}`}>
                {results.slice(0, shown).map((p, i) => (
                  <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} viewMode={view} eager={i < 4} />
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
                {sheet === "filter" ? (filterProps && <Filters {...filterProps} />) : (
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
