/**
 * Update 102: a longer aethex.in home page with more products and features. Every number, price and product here is
 * live from the store catalogue; nothing is invented. Sections: shop by category, top deals (by real MRP discount),
 * best of the biggest categories, top rated (only with real buyer reviews), shop by brand, "more on Aethex"
 * (feature shortcuts across the platforms) and "why shop on Aethex" (the store's own rules). Styles: src/site-hub.css (.hx-scat, .hx-feat, .hx-brands, .hx-why).
 */
import type { ReactNode } from "react";
import {
  ArrowRight, Banknote, Bot, ClipboardList, HeartPulse, Layers, MessageCircleQuestion, Newspaper,
  PackageSearch, RotateCcw, Stethoscope, Store, Tag, Timer, Truck, Video,
} from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import { Row, Skel, price } from "@/components/home/HubTop";
import { cadusUrl, portalUrl } from "@/lib/host";
import { useHome } from "@/lib/store/api";
import { COD_LIMIT, FREE_DELIVERY_FROM } from "@/lib/store/rules";
import type { HomeProduct } from "@/lib/store/home";
import { formatINR } from "@/lib/utils";

const S = (p: string) => portalUrl("store", p), D = (p: string) => portalUrl("doctors", p), ST = (p: string) => portalUrl("study", p);

function Card({ p }: { p: HomeProduct }) {
  return (
    <a href={S(`/products/${p.slug}`)} className="hx-card" data-product={p.id}>
      <span className="im"><ProductImage src={p.image} alt="" width={300} /></span>
      <span className="nm">{p.name}</span>
      {p.rating && p.rating.count > 0 && <span className="rt">{p.rating.avg.toFixed(1)} ★ <small>({p.rating.count})</small></span>}
      <span className="pr">{p.from && <small>from </small>}{price(p.price, p.mrp)}</span>
      {p.offer && <span className="of">{p.offer.title}</span>}
    </a>
  );
}

// Update 105: every section reads the home data (lib/store/home.ts), which comes inside the page; no catalogue download.

/* ---------------------------------------------------------------- shop by category: every category with its own photo and live count */
export function ShopByCategory() {
  const { data } = useHome();
  const cats = data?.cats ?? [];
  if (cats.length < 4) return null;
  return (
    <section className="hx-wrap hx-scat" data-home="categories" aria-label="Shop by category">
      <div className="hd"><div><h2>Shop by category</h2><p>{cats.length} categories, all in stock</p></div><a href={S("/shop")} className="all" aria-label="Shop all"><ArrowRight size={18} /></a></div>
      <ul>{cats.map((c) => (
        <li key={c.slug}><a href={S(`/category/${c.slug}`)} data-cat={c.slug}>
          <span className="im"><ProductImage src={c.image} alt="" width={200} /></span>
          <b>{c.name}</b><small>{c.n} products</small>
        </a></li>
      ))}</ul>
    </section>
  );
}

/* ---------------------------------------------------------------- top deals: the biggest real discounts off MRP */
export function TopDeals() {
  const { data, isLoading } = useHome();
  const list = data?.deals ?? [];
  if (!isLoading && list.length < 4) return null;
  return (
    <Row id="top-deals" title="Top deals" sub="The biggest savings off MRP right now" more={S("/offers")}>
      {isLoading ? <Skel /> : list.map((p) => <Card key={p.id} p={p} />)}
    </Row>
  );
}

/* ---------------------------------------------------------------- best of the three biggest categories */
export function CategoryRows() {
  const { data } = useHome();
  return (
    <>{(data?.rows ?? []).map((r) => (
      <Row key={r.slug} id={`cat-${r.slug}`} title={`Best of ${r.name.toLowerCase()}`} sub={r.blurb || undefined} more={S(`/category/${r.slug}`)}>
        {r.list.map((p) => <Card key={p.id} p={p} />)}
      </Row>
    ))}</>
  );
}

/* ---------------------------------------------------------------- top rated: only products with real buyer reviews */
export function TopRated() {
  const { data } = useHome();
  const list = data?.rated ?? [];
  if (list.length < 4) return null;
  return (
    <Row id="top-rated" title="Top rated by buyers" sub="From reviews by people who bought them" more={S("/shop")}>
      {list.map((p) => <Card key={p.id} p={p} />)}
    </Row>
  );
}

/* ---------------------------------------------------------------- shop by brand */
export function ShopByBrand() {
  const { data } = useHome();
  const brands = data?.brands ?? [];
  if (brands.length < 4) return null;
  return (
    <section className="hx-wrap hx-brands" data-home="brands" aria-label="Shop by brand">
      <div className="hd"><div><h2>Shop by brand</h2><p>{brands.length} brands</p></div><a href={S("/brands")} className="all" aria-label="All brands"><ArrowRight size={18} /></a></div>
      <ul>{brands.slice(0, 18).map((b) => (
        <li key={b.slug}><a href={S(`/brand/${b.slug}`)} data-brand={b.slug}><b>{b.name}</b><small>{b.n} products</small></a></li>
      ))}</ul>
    </section>
  );
}

/* ---------------------------------------------------------------- more on Aethex: feature shortcuts (all real pages) */
const FEATURES: { icon: ReactNode; title: string; sub: string; href: string; tone: string }[] = [
  { icon: <MessageCircleQuestion size={22} />, title: "Ask a doctor, free", sub: "Get an answer from a doctor", href: D("/ask"), tone: "blue" },
  { icon: <Video size={22} />, title: "Video consultation", sub: "See a doctor from home", href: D("/doctors?video=1"), tone: "teal" },
  { icon: <HeartPulse size={22} />, title: "Vitals tracker", sub: "BP, sugar, weight, in one place", href: D("/vitals"), tone: "rose" },
  { icon: <Newspaper size={22} />, title: "Health articles", sub: "Written by doctors", href: D("/articles"), tone: "violet" },
  { icon: <Tag size={22} />, title: "Offers", sub: "Sales and coupons running now", href: S("/offers"), tone: "amber" },
  { icon: <PackageSearch size={22} />, title: "Track an order", sub: "With your order number", href: S("/orders/track"), tone: "blue" },
  { icon: <Store size={22} />, title: "Sell on Aethex", sub: "List your medical store", href: S("/sell"), tone: "teal" },
  { icon: <Timer size={22} />, title: "Mock tests", sub: "NEET-PG pattern, with your rank", href: ST("/mock-test"), tone: "violet" },
  { icon: <Layers size={22} />, title: "Knowledge Hub", sub: "Topics and conditions", href: ST("/study-hub/medical-knowledge-hub"), tone: "rose" },
  { icon: <ClipboardList size={22} />, title: "Request a quotation", sub: "For hospitals and colleges", href: portalUrl("hospitals", "/#list"), tone: "amber" },
  { icon: <Stethoscope size={22} />, title: "List your practice", sub: "For doctors and clinics", href: D("/list-your-practice"), tone: "blue" },
  { icon: <Bot size={22} />, title: "Cadus", sub: "Clinical AI for doctors", href: cadusUrl("/"), tone: "ink" },
];
export function MoreOnAethex() {
  return (
    <section className="hx-wrap hx-feat" data-home="features" aria-label="More on Aethex">
      <div className="hd"><div><h2>More on Aethex</h2><p>Everything you can do, one tap away</p></div></div>
      <ul>{FEATURES.map((f) => (
        <li key={f.title}><a href={f.href} className={f.tone}><span className="i">{f.icon}</span><span className="t"><b>{f.title}</b><small>{f.sub}</small></span><ArrowRight size={16} className="go" /></a></li>
      ))}</ul>
    </section>
  );
}

/* ---------------------------------------------------------------- why shop on Aethex: only the store's real rules */
export function WhyAethex() {
  const items: [ReactNode, string, string][] = [
    [<Truck size={24} />, "Free delivery", `On orders from ${formatINR(FREE_DELIVERY_FROM)}`],
    [<Banknote size={24} />, "Cash on delivery", `On orders up to ${formatINR(COD_LIMIT)}`],
    [<RotateCcw size={24} />, "Easy replacements", "For damaged, defective or wrong items"],
    [<PackageSearch size={24} />, "Track every order", "From packing to your door"],
  ];
  return (
    <section className="hx-wrap hx-why" data-home="why" aria-label="Why shop on Aethex">
      {items.map(([i, t, s]) => <div key={t}><span className="i">{i}</span><span><b>{t}</b><small>{s}</small></span></div>)}
    </section>
  );
}
