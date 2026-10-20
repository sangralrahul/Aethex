/**
 * aethex.in: the homepage. A storefront first (categories, deals, products),
 * with Cadus AI and the Study Hub alongside, in the site style (light, Inter,
 * deep teal). Styles: src/site.css (home section, classes ax-h-*).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, BadgeCheck, Banknote, BookOpen, Brain, Calculator, ChevronLeft, ChevronRight, ClipboardList,
  FlaskConical, Layers, LayoutGrid, Pill, RotateCcw, Search, ShieldCheck, Sparkles, Star, Timer, Truck,
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

type Icon = ComponentType<LucideProps>;
const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ data */

const TESTIMONIALS = [
  { quote: "Aethex has completely changed how I manage patient care. Cadus AI gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.", name: "Dr. Priya Sharma", role: "Cardiologist, Mumbai", initials: "PS" },
  { quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.", name: "Dr. Arjun Mehta", role: "General Physician, Delhi", initials: "AM" },
  { quote: "Cadus AI helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.", name: "Dr. Vikram Nair", role: "Neurologist, Chennai", initials: "VN" },
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
  const { data: store, isLoading } = useStore();
  const products = useMemo(() => {
    if (!store) return [];
    const pool = cur.category ? store.products.filter((p) => p.category === cur.category) : store.products.filter((p) => p.featured && !p.priceOnRequest);
    return mixBrands(pool, rank).slice(0, 12);
  }, [store, cur.category]);
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="ax-h-sec">
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
          {isLoading || !store
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
  const { data: store } = useStore();
  const tiles = useMemo(() => (store ? store.categories.map((c) => {
    const best = store.products.filter((p) => p.category === c.slug && p.image).sort((a, b) => rank(b) - rank(a))[0];
    return { ...c, pic: best?.image };
  }) : []), [store]);
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

/* ------------------------------------------------------------------ page */

export default function Home() {
  useSeo({
    title: "Aethex — AI-Powered Medical Education & Clinical Tools in India",
    description: "Cadus AI clinical assistant, NEET PG study hub, drug references and genuine medical supplies — one platform built for Indian doctors and medical students.",
    path: "/",
  });
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const todays = useMemo(() => getTodaysCase(), []);
  const { data: store } = useStore();

  return (
    <div className="ax-home">
      {/* category bar */}
      <nav className="ax-h-catbar" aria-label="Shop categories">
        <div className="ax-wrap">
          <Link href="/shop" className="all">All products</Link>
          {QUICK.map((c) => <Link key={c.slug} href={`/category/${c.slug}`}>{c.name}</Link>)}
        </div>
      </nav>

      {/* hero */}
      <section className="ax-h-hero">
        <div className="ax-wrap ax-h-hero-grid">
          <div className="ax-h-main">
            <form className="ax-h-search" role="search" onSubmit={(e) => { e.preventDefault(); const t = q.trim(); navigate(t ? `/shop?search=${encodeURIComponent(t)}` : "/shop"); }}>
              <Search size={19} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search BP monitors, stethoscopes, glucometers, supports…" aria-label="Search products" />
              <button type="submit" className="ax-btn teal">Search</button>
            </form>
            <HeroCarousel />
          </div>
          <aside className="ax-h-side">
            <a href={cadusUrl("/")} className="ax-h-promo dark">
              <span className="tile"><CadusMark size={18} variant="mono" color="currentColor" /></span>
              <small>Cadus AI</small>
              <b>Clinical answers with sources, in seconds</b>
              <span className="q">"Warfarin with clarithromycin — safe?"</span>
              <span className="go">Try Cadus AI <ArrowRight size={15} /></span>
            </a>
            <Link href="/case-of-the-day" className="ax-h-promo">
              <span className="tile light"><ClipboardList size={18} /></span>
              <small>Case of the day · {todays.specialty}</small>
              <b>{todays.title}</b>
              <span className="go">Solve today's case <ArrowRight size={15} /></span>
            </Link>
          </aside>
        </div>
        <div className="ax-wrap">
          <ul className="ax-h-serv">
            <li><BadgeCheck size={22} /><span><b>Genuine products</b><small>From verified brands only</small></span></li>
            <li><Truck size={22} /><span><b>Delivery across India</b><small>Free from {formatINR(FREE_DELIVERY_FROM)}, tracked to your door</small></span></li>
            <li><RotateCcw size={22} /><span><b>{BUSINESS.replacementDays}-day replacement</b><small>If it arrives damaged or defective</small></span></li>
            <li><Banknote size={22} /><span><b>Cash on delivery</b><small>Pay when your order arrives</small></span></li>
          </ul>
        </div>
      </section>

      {/* categories */}
      <section className="ax-h-sec">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>Shop by category</h2><Link href="/shop" className="ax-link">All categories <ArrowRight size={16} /></Link></div>
          <CategoryTiles />
        </div>
      </section>

      {/* products */}
      <ProductRail />

      {/* Cadus + Study banners */}
      <section className="ax-h-sec">
        <div className="ax-wrap ax-h-duo">
          <div className="ax-h-ban cadus">
            <div>
              <small><Sparkles size={14} /> Cadus AI</small>
              <h3>Your clinical assistant, with sources</h3>
              <p>Differentials, doses, drug interactions, lab reading and SOAP notes. Every answer is checked for dose and red-flag safety.</p>
              <div className="ctas">
                <a href={cadusUrl("/")} className="ax-btn teal">Try Cadus AI free</a>
                <a href={downloadsUrl()} className="ax-btn ghost-l">Desktop app</a>
              </div>
            </div>
            <div className="card">
              <span className="lab">Bottom line</span>
              <p>Clarithromycin raises the INR: prefer another antibiotic, or check the INR in 3 to 5 days.</p>
              <span className="ok"><ShieldCheck size={12} /> Safety reviewed</span>
            </div>
          </div>
          <div className="ax-h-ban study">
            <div>
              <small><BookOpen size={14} /> Study Hub</small>
              <h3>Prepare for NEET-PG and beyond</h3>
              <p>Subject notes, previous-year questions, mock tests and flashcards for NEET-PG, NExT, FMGE and USMLE.</p>
              <div className="ctas">
                <Link href="/study-hub" className="ax-btn dark">Explore Study Hub</Link>
                <Link href="/neet-pg" className="ax-btn">NEET-PG</Link>
              </div>
            </div>
            <div className="card mcq">
              <small>Pharmacology</small>
              <b>Drug of choice for absence seizures?</b>
              <span>A. Phenytoin</span><span className="right">B. Ethosuximide</span><span>C. Carbamazepine</span>
            </div>
          </div>
        </div>
      </section>

      {/* tools */}
      <section className="ax-h-sec">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>Free clinical tools</h2><Link href="/tools" className="ax-link">All tools <ArrowRight size={16} /></Link></div>
          <div className="ax-h-tools">
            {TOOLS.map(({ href, icon: I, t, d }) => (
              <Link key={href} href={href}><span className="ic"><I size={20} /></span><span><b>{t}</b><small>{d}</small></span><ArrowRight size={16} className="ar" /></Link>
            ))}
          </div>
        </div>
      </section>

      {/* brands */}
      <section className="ax-h-sec">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>Shop by brand</h2><Link href="/brands" className="ax-link">All brands <ArrowRight size={16} /></Link></div>
          <div className="ax-h-brandgrid">
            {(store?.brands ?? []).map((b) => (
              <Link key={b.slug} href={`/brand/${b.slug}`}><b>{b.name}</b><small>{b.count} products</small></Link>
            ))}
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="ax-h-sec ax-h-quotes-sec">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>What doctors are saying</h2></div>
          <div className="ax-quotes">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="ax-quote">
                <span className="stars">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} fill="currentColor" />)}</span>
                <blockquote>"{t.quote}"</blockquote>
                <figcaption><span className="av">{t.initials}</span><span><b>{t.name}</b><small>{t.role}</small></span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* brands strip */}
      <section className="ax-h-brands">
        <div className="ax-wrap">
          <small>Verified brands we stock</small>
          <div>{(store?.brands ?? []).map((b) => <Link key={b.slug} href={`/brand/${b.slug}`}>{b.name}</Link>)}</div>
        </div>
      </section>
    </div>
  );
}
