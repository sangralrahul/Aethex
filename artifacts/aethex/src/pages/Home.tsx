/**
 * aethex.in: the homepage, a professional medical store since update 57: a category bar, departments,
 * banners and promos; the service promises; categories; top deals; shop for your practice; popular products;
 * the institutions band; brands; and Cadus and the free tools. Styles: src/site-ec.css (classes ec-*).
 */
import { HeroScene } from "@/components/visual/HeroScene";
import { CardArt } from "@/components/visual/CardArt";
import { PhotoTiles } from "@/components/layout/MarketTop";
import { BuyAgainRail } from "@/components/shop/BuyAgain";
import { RecentlyViewed } from "@/components/store/StoreExtras";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, BadgeCheck, Banknote, BookOpen, Brain, Calculator, ChevronLeft, ChevronRight, ClipboardList,
  FlaskConical, GraduationCap, Hospital, Layers, LayoutGrid, Pill, RotateCcw, Search, ShieldCheck, Sparkles, Star, Timer, Truck,
  Accessibility, Activity, BedDouble, BedSingle, Bone, BriefcaseMedical, Building2, CreditCard, Download, Droplet, Gauge, HeartPulse,
  MonitorCheck, PersonStanding, Scale, ScanEye, Siren, Stethoscope, Syringe, Thermometer, Wind, Zap,
  type LucideProps,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";
import { useSeo } from "@/hooks/use-seo";
import { useStore } from "@/lib/store/api";
import type { Category, ProductSummary } from "@/lib/store/types";

type HomeCat = Category & { pic?: string; from?: number };
import { FREE_DELIVERY_FROM, mixBrands } from "@/lib/store/rules";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";
import { cadusUrl, downloadsUrl, portalUrl } from "@/lib/host";
import { getTodaysCase } from "@/data/clinicalCases";
import { useReveal } from "@/components/home/PlatformHero";

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

/* ------------------------------------------------------------------ page (update 57: a professional medical store) */

const CAT_ICON: Record<string, Icon> = {
  "bp-monitors": HeartPulse, sphygmomanometers: Gauge, stethoscopes: Stethoscope, "diagnostic-instruments": ScanEye,
  "pulse-oximeters": Activity, thermometers: Thermometer, nebulizers: Wind, "diabetes-care": Droplet, "weighing-scales": Scale,
  "orthopaedic-supports": Bone, "pain-relief": Zap, "pillows-cushions": BedSingle, "rehab-mobility": Accessibility,
  "hospital-furniture": BedDouble, "icu-equipment": MonitorCheck, "emergency-care": Siren, "syringes-needles": Syringe,
  "anatomy-models": PersonStanding, "skills-simulators": GraduationCap, "lab-equipment": FlaskConical,
};

/** The banners: each one a real category, its photo the most popular product of the brand named first. */
const BANNERS = [
  { cat: "stethoscopes", brand: "littmann", tone: "navy", kicker: "For doctors and students", title: "Stethoscopes you can rely on", text: "3M Littmann, MDF Instruments, HEINE and Rossmax: for students, residents and consultants.", cta: "Shop stethoscopes" },
  { cat: "diagnostic-instruments", brand: "heine", tone: "teal", kicker: "For clinics", title: "Diagnostic sets for every clinic", text: "Otoscopes, ophthalmoscopes and diagnostic sets from HEINE and MDF Instruments.", cta: "Shop diagnostics" },
  { cat: "bp-monitors", brand: "omron", tone: "slate", kicker: "For clinic and home", title: "BP monitors from trusted brands", text: "OMRON, Dr Trust and Rossmax monitors, delivered across India with cash on delivery.", cta: "Shop BP monitors" },
  { cat: "orthopaedic-supports", brand: "tynor", tone: "ink", kicker: "For patients and physiotherapists", title: "Supports and braces for every joint", text: "Knee, back, neck and wrist supports from Tynor and Dr Trust, in every size.", cta: "Shop supports" },
] as const;

const SERVICES: { icon: Icon; t: string; d: string }[] = [
  { icon: ShieldCheck, t: "Genuine brands", d: "Sourced from verified brands" },
  { icon: Banknote, t: "Cash on delivery", d: "Pay when your order arrives" },
  { icon: Truck, t: "Free delivery", d: `On orders from ${formatINR(FREE_DELIVERY_FROM)}` },
  { icon: RotateCcw, t: `${BUSINESS.replacementDays}-day replacement`, d: "For damaged or wrong items" },
  { icon: CreditCard, t: "Secure payments", d: "UPI, cards and COD" },
];

const SEGMENTS = [
  { aud: "pro", icon: BriefcaseMedical, t: "For doctors and clinics", d: "Stethoscopes, diagnostic sets and BP instruments for daily practice.", href: "/category/stethoscopes" },
  { aud: "home", icon: HeartPulse, t: "Home care and monitoring", d: "Monitors, nebulizers, supports and daily care for your patients at home.", href: "/category/bp-monitors" },
  { aud: "institution", icon: Building2, t: "Hospitals and medical colleges", d: "Furniture, ICU, emergency, lab equipment, models and skills trainers.", href: "/category/icu-equipment" },
] as const;

const off = (p: ProductSummary) => (p.mrp && p.price && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);

function useHomeData() {
  const { data: store, error, refetch } = useStore();
  return useMemo(() => {
    if (!store) return { store, error, refetch, cats: [] as HomeCat[], deals: [] as ProductSummary[], picks: new Map<string, ProductSummary | undefined>() };
    const best = (cat: string, brand?: string) => {
      const pool = store.products.filter((p) => p.category === cat && p.image);
      const sorted = [...pool].sort((a, b) => rank(b) - rank(a));
      return sorted.find((p) => p.brand === brand) ?? sorted[0];
    };
    const cats: HomeCat[] = store.categories.map((c) => {
      const prices = store.products.filter((p) => p.category === c.slug && p.price != null && !p.priceOnRequest).map((p) => p.price as number);
      return { ...c, pic: best(c.slug)?.image, from: prices.length ? Math.min(...prices) : undefined };
    });
    const deals = mixBrands(store.products.filter((p) => p.inStock && p.image && off(p) >= 10).sort((a, b) => off(b) - off(a)), (p) => Number(off(p) >= 20)).slice(0, 12);
    const picks = new Map(BANNERS.map((b) => [b.cat, best(b.cat, b.brand)]));
    return { store, error, refetch, cats, deals, picks };
  }, [store, error, refetch]);
}

function Banners({ picks, cats }: { picks: Map<string, ProductSummary | undefined>; cats: { slug: string; from?: number }[] }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (still() || hold) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % BANNERS.length), 6500);
    return () => window.clearInterval(t);
  }, [hold]);
  const go = (d: number) => setI((x) => (x + d + BANNERS.length) % BANNERS.length);
  return (
    <div className="ec-ban" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} aria-roledescription="carousel" data-home="banners">
      {/* update 68: a living network and heartbeat over the dark half of the banner */}
      <div className="ec-ban-scene" aria-hidden="true"><HeroScene kind="pulse" rgb="94,234,212" /></div>
      {BANNERS.map((b, k) => {
        const href = `/category/${b.cat}`;
        const from = cats.find((c) => c.slug === b.cat)?.from;
        return (
          <div key={b.cat} className={`ec-slide ${b.tone}${k === i ? " on" : ""}`} aria-hidden={k !== i}>
            <div className="txt">
              <small>{b.kicker}</small>
              <h2>{b.title}</h2>
              <p>{b.text}</p>
              <div className="row">
                <Link href={href} className="ec-btn" tabIndex={k === i ? 0 : -1}>{b.cta} <ArrowRight size={16} /></Link>
                {from != null && <span className="from">From <b>{formatINR(from)}</b></span>}
              </div>
            </div>
            <div className="pic"><ProductImage src={picks.get(b.cat)?.image} width={520} eager={k === 0} /></div>
          </div>
        );
      })}
      <button type="button" className="ec-ban-arrow l" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft size={20} /></button>
      <button type="button" className="ec-ban-arrow r" onClick={() => go(1)} aria-label="Next"><ChevronRight size={20} /></button>
      <div className="ec-ban-dots">{BANNERS.map((b, k) => <button key={b.cat} type="button" className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Banner ${k + 1}`} />)}</div>
    </div>
  );
}

/** A horizontal row of product cards with arrows. */
function Rail({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="ec-rail-wrap">
      <button type="button" className="ec-rail-arrow l" onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}><ChevronLeft size={20} /></button>
      <div className="ec-rail" ref={track}>{children}</div>
      <button type="button" className="ec-rail-arrow r" onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}><ChevronRight size={20} /></button>
    </div>
  );
}

function Head({ title, sub, href, link }: { title: string; sub?: string; href?: string; link?: string }) {
  return (
    <div className="ec-head">
      <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {href && <Link href={href} className="ec-more">{link ?? "View all"} <ArrowRight size={15} /></Link>}
    </div>
  );
}

export default function Home() {
  useSeo({
    title: "Aethex: medical equipment and supplies for doctors, clinics and hospitals in India",
    description: "Genuine stethoscopes, diagnostic sets, BP monitors, hospital and lab equipment and medical books from verified brands, with cash on delivery across India.",
  });
  const { store, error, refetch, cats, deals, picks } = useHomeData();
  useReveal(store);
  const mainCats = cats.filter((c) => c.audience !== "institution");
  const brands = store ? [...store.brands].sort((a, b) => b.count - a.count).slice(0, 12) : [];
  const down = error && !store;

  return (
    <div className="ax-home ec-home">
      {/* category bar */}
      <nav className="ec-catbar" aria-label="Shop by category">
        <div className="ax-wrap">
          <Link href="/shop" className="all"><LayoutGrid size={16} /> All categories</Link>
          {QUICK.slice(0, 9).map((q) => <Link key={q.slug} href={`/category/${q.slug}`}>{q.name}</Link>)}
          <Link href="/books">Medical books</Link>
          <Link href="/brands" className="inst">All brands</Link>
        </div>
      </nav>

      {/* hero: departments, banners, promos */}
      <section className="ec-hero" data-home="platform">
        <h1 className="sr-only">Medical equipment and supplies for doctors, clinics, hospitals and medical colleges in India</h1>
        <div className="ax-wrap ec-hero-grid">
          <aside className="ec-depts" aria-label="Departments">
            <b>Departments</b>
            {(mainCats.length ? mainCats : QUICK.map((q) => ({ slug: q.slug, name: q.name }))).slice(0, 10).map((c) => {
              const I = CAT_ICON[c.slug] ?? LayoutGrid;
              return <Link key={c.slug} href={`/category/${c.slug}`}><I size={17} /> <span>{c.name}</span><ChevronRight size={14} className="ch" /></Link>;
            })}
            <Link href="/books"><BookOpen size={17} /> <span>Medical books</span><ChevronRight size={14} className="ch" /></Link>
            <Link href="/shop" className="all">All categories <ArrowRight size={14} /></Link>
          </aside>
          <Banners picks={picks} cats={cats} />
          <div className="ec-promos">
            <Link href="/books" className="ec-promo books has-art">
              <CardArt icon={BookOpen} color="#b45309" seed={2} />
              <small>Medical books</small>
              <b>Textbooks for MBBS and PG</b>
              <span>Standard titles for every subject <ArrowRight size={14} /></span>
              <BookOpen className="art" size={64} strokeWidth={1.2} />
            </Link>
            <Link href="/orders/track" className="ec-promo cadus has-art" data-home="track">
              <CardArt icon={Truck} color="#5eead4" seed={5} />
              <small>Orders</small>
              <b>Track your order</b>
              <span>Status and delivery date, any time <ArrowRight size={14} /></span>
              <Truck className="art" size={56} strokeWidth={1.4} />
            </Link>
          </div>
        </div>
      </section>

      {/* service promises */}
      <section className="ec-services" aria-label="Our promises">
        <div className="ax-wrap"><ul>
          {SERVICES.map(({ icon: I, t, d }, k) => <li key={t} className="has-art"><CardArt icon={I} color="#0f766e" seed={k} /><span className="ic"><I size={22} /></span><span><b>{t}</b><small>{d}</small></span></li>)}
        </ul></div>
      </section>

      {/* categories */}
      <section className="ec-sec" data-rv data-home="categories">
        <div className="ax-wrap">
          <Head title="Shop by category" sub="Instruments, monitors and daily care from verified brands" href="/shop" link="All categories" />
          {down ? <StoreDown retry={() => void refetch()} /> : (
            <div className="ec-cats">
              {!store ? Array.from({ length: 12 }, (_, k) => <span key={k} className="ec-cat sk" />) : mainCats.slice(0, 12).map((c) => (
                <Link key={c.slug} href={`/category/${c.slug}`} className="ec-cat">
                  <span className="pic"><ProductImage src={c.pic} width={300} /></span>
                  <b>{c.name}</b>
                  <small>{c.count} products</small>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <PhotoTiles kicker="Shop by need" title="Care at home, in the clinic and on the ward" text="Genuine brands, cash on delivery."
        more={{ label: "All products", href: "/shop" }}
        tiles={[
          { title: "BP monitoring", sub: "Digital BP monitors", bg: "bpMonitor", href: "/category/bp-monitors" },
          { title: "Home check-ups", sub: "Pulse oximeters", bg: "bpCheck", href: "/category/pulse-oximeters" },
          { title: "Stethoscopes", sub: "Littmann and more", bg: "stethoscope", href: "/category/stethoscopes" },
          { title: "For your clinic", sub: "Diagnostic sets", bg: "doctorDesk", href: "/category/diagnostic-instruments" },
          { title: "For hospitals", sub: "Quotations for any quantity", bg: "wardBeds", href: portalUrl("hospitals") },
          { title: "Medical books", sub: "Every course", bg: "studentBooks", href: "/books" },
        ]} />

      <div className="ax-wrap ec-rails" data-home="for-you"><BuyAgainRail /><RecentlyViewed /></div>

      {/* deals */}
      <section className="ec-sec" data-rv data-home="essentials">
        <div className="ax-wrap">
          <div className="ec-deals">
            <Head title="Top deals" sub="The biggest savings on MRP, on products in stock" href="/shop" link={`Shop all ${store ? store.products.length : ""} products`} />
            {down ? <StoreDown retry={() => void refetch()} /> : (
              <Rail label="deals">
                {!store ? Array.from({ length: 6 }, (_, k) => <div key={k} className="ax-prod sk" />)
                  : deals.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
              </Rail>
            )}
          </div>
        </div>
      </section>

      {/* by practice */}
      <section className="ec-sec" data-rv data-home="segments">
        <div className="ax-wrap">
          <Head title="Shop for your practice" sub="Everything for the clinic, the patient at home and the institution" />
          <div className="ec-segs">
            {SEGMENTS.map(({ aud, icon: I, t, d, href }) => {
              const list = cats.filter((c) => c.audience === aud);
              const pic = list.find((c) => c.pic)?.pic;
              return (
                <div key={aud} className={`ec-seg ${aud} has-art`}>
                  <CardArt icon={I} color={aud === "home" ? "#be123c" : aud === "institution" ? "#4b5bc4" : "#0f766e"} seed={aud.length} />
                  <div className="top">
                    <span className="ic"><I size={22} /></span>
                    <div><h3>{t}</h3><p>{d}</p></div>
                  </div>
                  <ul>{list.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`}>{c.name}<small>{c.count}</small></Link></li>)}</ul>
                  <div className="foot">
                    <Link href={href} className="ec-more">Shop now <ArrowRight size={15} /></Link>
                    {pic && <span className="pic"><ProductImage src={pic} width={200} /></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* popular, by category (tabs) */}
      <ProductRail />

      {/* brands */}
      <section className="ec-sec" data-rv data-home="brands">
        <div className="ax-wrap">
          <Head title="Shop by brand" sub="Only brands we have verified" href="/brands" link="All brands" />
          <div className="ec-brands">
            {brands.map((b) => <Link key={b.slug} href={`/brand/${b.slug}`}><b>{b.name}</b><small>{b.count} products</small></Link>)}
          </div>
        </div>
      </section>

    </div>
  );
}
