/**
 * aethex.in: the homepage, Apple-style since update 56: a quiet hero with the live Cadus demo, three
 * product tiles, the essentials, categories, what doctors say, and links to everything else, in the site style (light, Inter,
 * deep teal). Styles: src/site.css (home section, classes ax-h-*).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, BadgeCheck, Banknote, BookOpen, Brain, Calculator, ChevronLeft, ChevronRight, ClipboardList,
  FlaskConical, GraduationCap, Hospital, Layers, LayoutGrid, Pill, RotateCcw, Search, ShieldCheck, Sparkles, Star, Timer, Truck,
  type LucideProps,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";
import { useSeo } from "@/hooks/use-seo";
import { useStore } from "@/lib/store/api";
import type { ProductSummary } from "@/lib/store/types";
import { FREE_DELIVERY_FROM, mixBrands } from "@/lib/store/rules";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";
import { cadusUrl, downloadsUrl } from "@/lib/host";
import { getTodaysCase } from "@/data/clinicalCases";
import { LiveDemo, useReveal } from "@/components/home/PlatformHero";
import { itemHref } from "@/lib/store/bookdata";

type Icon = ComponentType<LucideProps>;
const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ data */

const TESTIMONIALS = [
  { quote: "Aethex has completely changed how I manage patient care. Cadus gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.", name: "Dr. Priya Sharma", role: "Cardiologist, Mumbai", initials: "PS" },
  { quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.", name: "Dr. Arjun Mehta", role: "General Physician, Delhi", initials: "AM" },
  { quote: "Cadus helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.", name: "Dr. Vikram Nair", role: "Neurologist, Chennai", initials: "VN" },
];

/** The category bar under the header. */
const QUICK = [
  { slug: "bp-monitors", name: "BP monitors" }, { slug: "stethoscopes", name: "Stethoscopes" }, { slug: "diagnostic-instruments", name: "Diagnostics" },
  { slug: "pulse-oximeters", name: "Oximeters" }, { slug: "thermometers", name: "Thermometers" }, { slug: "nebulizers", name: "Nebulizers" },
  { slug: "diabetes-care", name: "Diabetes care" }, { slug: "weighing-scales", name: "Scales" }, { slug: "orthopaedic-supports", name: "Supports & braces" },
  { slug: "pain-relief", name: "Pain relief" }, { slug: "pillows-cushions", name: "Pillows" }, { slug: "sphygmomanometers", name: "Sphygmomanometers" },
];

/** Photos from the brands' own sites (see src/data/store/catalog.json). */
const SLIDES = [
  { tone: "teal", kicker: "Stethoscopes", title: "Hear every murmur clearly", text: "3M Littmann, MDF, HEINE and Rossmax, for students, residents and consultants.", cta: "Shop stethoscopes", href: "/category/stethoscopes", pic: "https://s7d9.scene7.com/is/image/mmmspinco/5803_Classic_III_Black_Dancing" },
  { tone: "blue", kicker: "BP monitors", title: "Know your numbers at home", text: "OMRON, Dr Trust and Rossmax monitors, with cash on delivery across India.", cta: "Shop BP monitors", href: "/category/bp-monitors", pic: "https://www.omronbrandshop.com/media/catalog/product/cache/e1a68a1ab63b22e765e66f8e2bd38b08/h/e/hem-7181.png" },
  { tone: "sand", kicker: "Supports & braces", title: "Support for every joint", text: "Tynor and Dr Trust knee, back, neck and wrist supports, in every size.", cta: "Shop supports", href: "/category/orthopaedic-supports", pic: "https://cdn.shopify.com/s/files/1/0732/5515/7916/files/1_af122480-fda9-4a0b-9023-ebdcce9f84d7.webp" },
];

const RAILS = [
  { id: "best", label: "Popular", category: undefined },
  { id: "bp-monitors", label: "BP monitors", category: "bp-monitors" },
  { id: "stethoscopes", label: "Stethoscopes", category: "stethoscopes" },
  { id: "orthopaedic-supports", label: "Supports", category: "orthopaedic-supports" },
  { id: "diabetes-care", label: "Diabetes care", category: "diabetes-care" },
  { id: "diagnostic-instruments", label: "Diagnostics", category: "diagnostic-instruments" },
] as const;

/** Best first: popular, in stock, with a price. */
const rank = (p: ProductSummary) => Number(p.featured) * 4 + Number(p.inStock) * 2 + Number(!p.priceOnRequest);

const TOOLS: { href: string; icon: Icon; t: string; d: string }[] = [
  { href: "/drug-reference", icon: Pill, t: "Drug reference", d: "Doses, indications and monographs" },
  { href: "/drug-interaction-checker", icon: FlaskConical, t: "Interaction checker", d: "Check a prescription in seconds" },
  { href: "/calculator", icon: Calculator, t: "Medical calculators", d: "Scores, doses and clinical formulas" },
  { href: "/mock-test", icon: Timer, t: "Mock tests", d: "Timed NEET-PG practice" },
  { href: "/study-hub/medical-knowledge-hub", icon: Brain, t: "Knowledge Hub", d: "Subjects, topics and conditions" },
  { href: "/flashcards", icon: Layers, t: "Flashcards", d: "Spaced revision that sticks" },
];

/* ------------------------------------------------------------------ pieces */

/** Shown in place of the products when the store can't be reached, instead of grey boxes forever. */
function StoreDown({ retry }: { retry: () => void }) {
  return (
    <div className="ax-h-down" role="status" data-home="store-down">
      <b>The products didn't load</b>
      <span>Check your connection, or try again in a moment.</span>
      <button type="button" className="ax-btn" onClick={retry}>Try again</button>
    </div>
  );
}

function HeroCarousel() {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (still() || hold) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6000);
    return () => window.clearInterval(t);
  }, [hold]);
  const go = (d: number) => setI((x) => (x + d + SLIDES.length) % SLIDES.length);
  return (
    <div className="ax-h-car" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} aria-roledescription="carousel">
      {SLIDES.map((s, k) => (
        <div key={s.href} className={`ax-h-slide ${s.tone}${k === i ? " on" : ""}`} aria-hidden={k !== i}>
          <div className="txt">
            <small>{s.kicker}</small>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            <Link href={s.href} className="ax-btn dark" tabIndex={k === i ? 0 : -1}>{s.cta} <ArrowRight size={16} /></Link>
          </div>
          <ProductImage src={s.pic} width={600} eager={k === 0} />
        </div>
      ))}
      <div className="ax-h-car-nav">
        <button type="button" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
        <div className="dots">{SLIDES.map((s, k) => <button key={s.href} type="button" className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} />)}</div>
        <button type="button" onClick={() => go(1)} aria-label="Next"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

function ProductRail() {
  const [rail, setRail] = useState<(typeof RAILS)[number]["id"]>("best");
  const cur = RAILS.find((r) => r.id === rail)!;
  const { data: store, isLoading, error, refetch } = useStore();
  const products = useMemo(() => {
    if (!store) return [];
    const pool = cur.category ? store.products.filter((p) => p.category === cur.category) : store.products.filter((p) => p.featured && !p.priceOnRequest);
    return mixBrands(pool, rank).slice(0, 12);
  }, [store, cur.category]);
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="ax-h-sec" data-rv>
      <div className="ax-wrap">
        <div className="ax-h-title">
          <h2>Popular with doctors and families</h2>
          <div className="ax-h-tabs" role="tablist">
            {RAILS.map((r) => <button key={r.id} role="tab" aria-selected={rail === r.id} className={rail === r.id ? "on" : ""} onClick={() => { setRail(r.id); track.current?.scrollTo({ left: 0 }); }}>{r.label}</button>)}
          </div>
          <div className="ax-h-arrows">
            <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="ax-h-rail" ref={track}>
          {error && !store ? <StoreDown retry={() => void refetch()} />
            : isLoading || !store
            ? Array.from({ length: 5 }, (_, k) => <div key={k} className="ax-prod sk" />)
            : products.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
        </div>
        <div className="ax-h-more"><Link href={cur.category ? `/category/${cur.category}` : "/shop"} className="ax-link">View all {cur.id === "best" ? "products" : cur.label.toLowerCase()} <ArrowRight size={16} /></Link></div>
      </div>
    </section>
  );
}

/** One tile per category, with the photo of its most popular product. */
function CategoryTiles() {
  const { data: store, error, refetch } = useStore();
  const tiles = useMemo(() => (store ? store.categories.filter((c) => c.audience !== "institution").map((c) => {
    const best = store.products.filter((p) => p.category === c.slug && p.image).sort((a, b) => rank(b) - rank(a))[0];
    return { ...c, pic: best?.image };
  }) : []), [store]);
  if (error && !store) return <StoreDown retry={() => void refetch()} />;
  return (
    <div className="ax-h-cats">
      {!store ? Array.from({ length: 14 }, (_, k) => <span key={k} className="ax-h-cat sk"><span className="pic" /><b>&nbsp;</b></span>) : <>
        {tiles.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="ax-h-cat">
            <span className="pic"><ProductImage src={c.pic} width={360} /></span>
            <b>{c.name}</b>
            <small>{c.count} products</small>
          </Link>
        ))}
        <Link href="/shop" className="ax-h-cat all">
          <span className="pic"><LayoutGrid size={30} strokeWidth={1.6} /></span>
          <b>All products</b>
          <small>{store.products.length} products</small>
        </Link>
      </>}
    </div>
  );
}

/* ------------------------------------------------------------------ page (update 56: Apple-style, lean) */

/** Large, quiet product tiles: the photo on light grey, then name and price. */
function Essentials() {
  const { data: store, error, refetch } = useStore();
  const products = useMemo(() => (store ? mixBrands(store.products.filter((p) => p.featured && !p.priceOnRequest && p.image), rank).slice(0, 8) : []), [store]);
  return (
    <section className="ap-sec" data-rv data-home="essentials">
      <div className="ax-wrap">
        <div className="ap-head"><h2>The essentials.</h2><Link href="/shop" className="ap-link" data-home="all-products">Shop all {store ? store.products.length : ""} products <ArrowRight size={16} /></Link></div>
        <div className="ap-grid4">
          {error && !store ? <StoreDown retry={() => void refetch()} />
            : !store ? Array.from({ length: 8 }, (_, k) => <div key={k} className="ax-prod sk" />)
            : products.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
        </div>
      </div>
    </section>
  );
}

/** One row of categories, each a photo on light grey with its name. */
function Categories() {
  const { data: store } = useStore();
  const tiles = useMemo(() => (store ? store.categories.filter((c) => c.audience !== "institution").map((c) => {
    const best = store.products.filter((p) => p.category === c.slug && p.image).sort((a, b) => rank(b) - rank(a))[0];
    return { ...c, pic: best?.image };
  }) : []), [store]);
  if (!store) return null;
  return (
    <section className="ap-sec" data-rv data-home="categories">
      <div className="ax-wrap">
        <div className="ap-head"><h2>Shop by category.</h2><Link href="/shop" className="ap-link">All categories <ArrowRight size={16} /></Link></div>
        <div className="ap-cats">
          {tiles.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="ap-cat">
              <span className="pic"><ProductImage src={c.pic} width={300} /></span>
              <b>{c.name}</b>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const MORE: { href: string; ext?: boolean; icon: Icon; t: string; d: string }[] = [
  { href: "/hospitals", icon: Hospital, t: "For hospitals", d: "One list, one quotation for every ward" },
  { href: "/medical-colleges", icon: GraduationCap, t: "For medical colleges", d: "Skills labs, anatomy, labs and books" },
  { href: "/tools", icon: Calculator, t: "Free clinical tools", d: "Drug reference, interactions, calculators" },
  { href: "/case-of-the-day", icon: ClipboardList, t: "Case of the day", d: "One clinical case, every day" },
  { href: "/brands", icon: BadgeCheck, t: "Brands we stock", d: "Verified brands only" },
  { href: "__downloads", icon: LayoutGrid, t: "Desktop app", d: "Cadus for Windows and Linux" },
];

export default function Home() {
  useSeo({
    title: "Aethex: medical supplies, Cadus AI and NEET-PG prep for India",
    description: "Genuine medical supplies with cash on delivery, the Cadus clinical assistant, and NEET-PG study tools: one platform for India's doctors and medical students.",
    path: "/",
  });
  const { data: store } = useStore();
  useReveal(store);
  const shelf = useMemo(() => store?.products.filter((p) => p.featured && p.image && !p.priceOnRequest).slice(0, 3) ?? [], [store]);

  return (
    <div className="ax-home ap-home">
      {/* hero */}
      <section className="ap-hero" data-home="platform">
        <div className="ax-wrap">
          <p className="ap-eyebrow">Aethex for doctors and medical students</p>
          <h1>Everything a doctor needs.<br /><span>In one place.</span></h1>
          <p className="ap-sub">Clinical answers you can check. Exam preparation for every subject. Genuine medical supplies, delivered across India.</p>
          <div className="ap-ctas">
            <a href={cadusUrl("/")} className="ap-btn" data-home="cta-cadus">Try Cadus free</a>
            <Link href="/shop" className="ap-link lg" data-home="cta-shop">Shop medical supplies <ArrowRight size={18} /></Link>
          </div>
          <div className="ap-stage"><LiveDemo /></div>
        </div>
      </section>

      {/* the three products */}
      <section className="ap-sec ap-tiles-sec" data-rv data-home="showcase">
        <div className="ax-wrap ap-tiles">
          <div className="ap-tile dark">
            <p className="k">Cadus</p>
            <h3>Clinical answers<br />you can check.</h3>
            <p className="d">Doses, interactions, differentials and 320+ bedside tools — every answer safety-reviewed, with sources.</p>
            <div className="lk"><a href={cadusUrl("/")}>Try free <ArrowRight size={15} /></a><a href={downloadsUrl()}>Desktop app <ArrowRight size={15} /></a></div>
            <div className="vis chat"><span className="q">Warfarin with clarithromycin — safe?</span><span className="a"><small>Bottom line</small>Clarithromycin raises the INR. Prefer another antibiotic, or check the INR in 3 to 5 days.<em><ShieldCheck size={12} /> Safety reviewed</em></span></div>
          </div>
          <div className="ap-tile">
            <p className="k">Study Hub</p>
            <h3>Prepare for NEET-PG<br />and beyond.</h3>
            <p className="d">Question banks, mock tests, flashcards, OSCE stations and tutors for every subject.</p>
            <div className="lk"><Link href="/study-hub">Explore <ArrowRight size={15} /></Link><Link href="/neet-pg">NEET-PG <ArrowRight size={15} /></Link></div>
            <div className="vis mcq"><b>Drug of choice for absence seizures?</b><span>Phenytoin</span><span className="ok">Ethosuximide</span><span>Carbamazepine</span></div>
          </div>
          <div className="ap-tile wide">
            <div className="txt">
              <p className="k">Medical store</p>
              <h3>Genuine instruments.<br />Delivered across India.</h3>
              <p className="d">BP monitors, stethoscopes, diagnostics and supports from brands doctors trust. Cash on delivery, free delivery from {formatINR(FREE_DELIVERY_FROM)}.</p>
              <div className="lk"><Link href="/shop">Shop now <ArrowRight size={15} /></Link><Link href="/brands">Brands <ArrowRight size={15} /></Link></div>
            </div>
            <div className="shelf">{shelf.map((p) => <Link key={p.id} href={itemHref(p.id, p.slug)} className="it"><ProductImage src={p.image} width={360} /></Link>)}</div>
          </div>
        </div>
      </section>

      <Essentials />
      <Categories />

      {/* testimonials */}
      <section className="ap-sec" data-rv>
        <div className="ax-wrap">
          <div className="ap-head"><h2>What doctors say.</h2></div>
          <div className="ap-quotes">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="ap-quote">
                <blockquote>"{t.quote}"</blockquote>
                <figcaption><b>{t.name}</b><small>{t.role}</small></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* everything else, as quiet links */}
      <section className="ap-sec ap-more-sec" data-rv data-home="more">
        <div className="ax-wrap">
          <div className="ap-head"><h2>More from Aethex.</h2></div>
          <div className="ap-more">
            {MORE.map(({ href, icon: I, t, d }) => {
              const body = <><span className="ic"><I size={20} /></span><span><b>{t}</b><small>{d}</small></span><ArrowRight size={16} className="ar" /></>;
              return href === "__downloads" ? <a key={t} href={downloadsUrl()}>{body}</a> : <Link key={t} href={href}>{body}</Link>;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
