import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Sparkles, Send, ChevronLeft, ChevronRight, Zap, Truck, ShieldCheck,
  RotateCcw, Star, ArrowRight, Stethoscope, BookOpen, Pill, Brain,
  Calculator, Store, FileText, HeartPulse, FlaskConical, Scissors,
  Shirt, Shield, Thermometer, Bone, Baby, Eye, Wind, Droplets, Waves,
  Microscope, Activity, ScanLine, Dna, Apple, Dumbbell, Pipette,
  HeartHandshake, AlertTriangle, Scan, Gauge, TestTube2, BrainCircuit,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Shirt, Shield, BookOpen, Stethoscope, Scissors, Thermometer, HeartPulse,
  Bone, Brain, FlaskConical, Droplets, Wind, Eye, Baby, ScanLine, Waves,
  HeartHandshake, Dna, AlertTriangle, Scan, Microscope, Pipette, Dumbbell,
  Gauge, BrainCircuit, TestTube2, Apple, Pill,
};

/* ═════════ 1. Top utility ribbon (Amazon-style) ═════════ */
function UtilityRibbon() {
  const items = [
    { icon: Truck, label: "Free Shipping on ₹499+" },
    { icon: ShieldCheck, label: "100% Original · NMC Compliant" },
    { icon: RotateCcw, label: "7-Day Easy Returns" },
    { icon: Zap, label: "Pan-India 2-Day Delivery" },
  ];
  return (
    <div style={{ background: "#0F1729", color: "#E5E7EB" }}>
      <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] font-medium tracking-wide"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(255,255,255,0.85)" }}>
            <it.icon className="w-3.5 h-3.5" style={{ color: "#FFB84A" }} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════ 2. Category rail (Flipkart-style round tiles) ═════════ */
function CategoryRail({ categories }: { categories: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") => {
    scrollRef.current?.scrollBy({ left: dir === "l" ? -400 : 400, behavior: "smooth" });
  };
  const cats = categories.slice(0, 18);
  return (
    <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="max-w-[1400px] mx-auto px-4 py-4 relative">
        <button onClick={() => scroll("l")} aria-label="Scroll left"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all hidden md:flex"
          style={{ background: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "#0F1729" }} />
        </button>
        <div ref={scrollRef} className="flex items-center gap-6 overflow-x-auto scroll-smooth py-2 px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {cats.map((c) => {
            const Icon = iconMap[c.iconName] || Stethoscope;
            return (
              <Link key={c.slug} href={`/shop?category=${c.slug}`}
                className="group flex flex-col items-center gap-2 shrink-0 transition-all"
                style={{ width: 84 }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #E6FBF7 0%, #F5F3EE 100%)",
                    border: "1.5px solid rgba(0,194,168,0.18)",
                    boxShadow: "0 2px 10px rgba(0,194,168,0.08)",
                  }}>
                  <Icon className="w-6 h-6" style={{ color: "#009E87" }} />
                </div>
                <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2 group-hover:text-teal-700"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0F1729" }}>
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
        <button onClick={() => scroll("r")} aria-label="Scroll right"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all hidden md:flex"
          style={{ background: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <ChevronRight className="w-4 h-4" style={{ color: "#0F1729" }} />
        </button>
      </div>
    </div>
  );
}

/* ═════════ 3. Hero carousel (Amazon-style rotating banners) ═════════ */
const SLIDES = [
  {
    eyebrow: "Cadus AI · Clinical Assistant",
    title: "Diagnose faster.",
    subtitle: "20+ AI clinical modes — differentials, drug checks, prescriptions.",
    cta: "Try Cadus AI Free",
    href: "/ai-assistant",
    bg: "linear-gradient(120deg, #0F1729 0%, #17325C 55%, #1E4A8C 100%)",
    accent: "#FFB84A",
    illustration: (
      <div className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
        <div className="relative">
          <div className="w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,194,168,0.35), transparent 70%)", filter: "blur(20px)" }} />
          <Brain className="w-32 h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.15)", strokeWidth: 1 }} />
          <Brain className="w-24 h-24 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "#00C2A8" }} strokeWidth={1.5} />
        </div>
      </div>
    ),
  },
  {
    eyebrow: "Big Medical Sale",
    title: "Up to 60% off",
    subtitle: "Stethoscopes, BP monitors, surgical tools, scrubs & more.",
    cta: "Shop the Sale",
    href: "/shop",
    bg: "linear-gradient(120deg, #7A1F1F 0%, #B4302C 50%, #E85D3A 100%)",
    accent: "#FFE500",
    illustration: (
      <div className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
        <div className="w-40 h-40 rounded-2xl flex items-center justify-center rotate-12"
          style={{ background: "rgba(255,255,255,0.08)", border: "2px dashed rgba(255,255,255,0.25)" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 68, fontWeight: 700, color: "#FFE500", lineHeight: 1 }}>60%</div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "NEET-PG 2026",
    title: "Crack it with rank.",
    subtitle: "30 grand tests · 40k Q-bank · high-yield notes by AIIMS toppers.",
    cta: "Start Preparing",
    href: "/neet-pg",
    bg: "linear-gradient(120deg, #0B4B3F 0%, #0F7A64 55%, #14B491 100%)",
    accent: "#FFE500",
    illustration: (
      <div className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
        <BookOpen className="w-40 h-40" style={{ color: "rgba(255,255,255,0.18)" }} strokeWidth={1} />
      </div>
    ),
  },
];

function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[idx];
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 340, background: s.bg, transition: "background 0.8s ease" }}>
      {s.illustration}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 h-full flex items-center relative z-10">
        <div className="max-w-xl">
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3"
            style={{ color: s.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {s.eyebrow}
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 600,
            fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            marginBottom: 12,
          }}>
            {s.title}
          </h1>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.55,
            marginBottom: 22,
            maxWidth: 480,
          }}>
            {s.subtitle}
          </p>
          <Link href={s.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: s.accent,
              color: "#0F1729",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
            }}>
            {s.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      {/* pagination */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`}
            className="transition-all"
            style={{
              width: i === idx ? 24 : 8,
              height: 3,
              borderRadius: 2,
              background: i === idx ? "#FFFFFF" : "rgba(255,255,255,0.4)",
              border: 0,
              cursor: "pointer",
            }} />
        ))}
      </div>
      {/* arrows */}
      <button onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        aria-label="Previous"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <ChevronLeft className="w-5 h-5" style={{ color: "#FFFFFF" }} />
      </button>
      <button onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        aria-label="Next"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <ChevronRight className="w-5 h-5" style={{ color: "#FFFFFF" }} />
      </button>
    </div>
  );
}

/* ═════════ 4. AI prompt bar ═════════ */
function AskCadusBar() {
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) window.location.href = `/ai-assistant?q=${encodeURIComponent(q.trim())}`;
  };
  return (
    <form onSubmit={submit}
      className="max-w-[1400px] mx-auto px-4 -mt-6 relative z-20">
      <div className="rounded-2xl flex items-center gap-3 px-4 sm:px-5 py-3"
        style={{
          background: "#FFFFFF",
          border: "1.5px solid rgba(0,0,0,0.08)",
          boxShadow: "0 10px 40px rgba(15,23,41,0.12), 0 2px 8px rgba(0,0,0,0.05)",
        }}>
        <Sparkles className="w-5 h-5 shrink-0" style={{ color: "#00C2A8" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Cadus AI — symptom, drug interaction, diagnosis, calculator…"
          className="flex-1 bg-transparent border-0 outline-none text-sm min-w-0"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0F1729" }} />
        <div className="hidden md:flex items-center gap-1.5">
          {["Diabetic DDx", "NEET PG 2026", "Drug interactions"].map((s) => (
            <button key={s} type="button" onClick={() => (window.location.href = `/ai-assistant?q=${encodeURIComponent(s)}`)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{ background: "rgba(0,194,168,0.08)", color: "#009E87", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s}
            </button>
          ))}
        </div>
        <button type="submit"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{
            background: "#00C2A8",
            color: "#FFFFFF",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 3px 14px rgba(0,194,168,0.4)",
          }}>
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>
    </form>
  );
}

/* ═════════ 5. Bento promo cards (Amazon-style 4-up) ═════════ */
function PromoTiles({ products }: { products: any[] }) {
  const tiles = [
    {
      title: "Top Deals",
      subtitle: "Up to 60% off",
      href: "/shop?sort=discount",
      accent: "#E85D3A",
      picks: products.filter((p) => p.originalPrice).slice(0, 4),
    },
    {
      title: "Bestselling Books",
      subtitle: "Harrison's · Gray's · NEET-PG",
      href: "/books",
      accent: "#1E4A8C",
      picks: products.filter((p) => p.categorySlug === "books").slice(0, 4).length
        ? products.filter((p) => p.categorySlug === "books").slice(0, 4)
        : products.slice(0, 4),
    },
    {
      title: "Stethoscopes & Kits",
      subtitle: "Littmann, MDF, ADC",
      href: "/shop?category=stethoscopes",
      accent: "#009E87",
      picks: products.filter((p) => p.categorySlug === "stethoscopes").slice(0, 4).length
        ? products.filter((p) => p.categorySlug === "stethoscopes").slice(0, 4)
        : products.slice(2, 6),
    },
    {
      title: "Scrubs & Coats",
      subtitle: "Premium clinical wear",
      href: "/shop?category=scrubs",
      accent: "#7A1F1F",
      picks: products.filter((p) => p.categorySlug === "scrubs" || p.categorySlug === "aprons").slice(0, 4).length
        ? products.filter((p) => p.categorySlug === "scrubs" || p.categorySlug === "aprons").slice(0, 4)
        : products.slice(4, 8),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t, i) => (
        <div key={i} className="rounded-2xl p-5 transition-all hover:shadow-lg"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 12px rgba(15,23,41,0.05)",
          }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#0F1729", lineHeight: 1.15 }}>
                {t.title}
              </h3>
              <p className="text-[11px] font-semibold mt-0.5"
                style={{ color: t.accent, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}>
                {t.subtitle}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {t.picks.slice(0, 4).map((p: any) => (
              <Link key={p.id} href={`/products/${p.id}`}
                className="block rounded-lg overflow-hidden transition-all hover:scale-[1.03]"
                style={{ background: "#F7F5F1", aspectRatio: "1" }}>
                <img src={p.imageUrl} alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80"; }} />
              </Link>
            ))}
            {t.picks.length === 0 && [0, 1, 2, 3].map((k) => (
              <div key={k} className="rounded-lg" style={{ background: "#F7F5F1", aspectRatio: "1" }} />
            ))}
          </div>
          <Link href={t.href} className="text-xs font-bold inline-flex items-center gap-1 transition-all hover:gap-2"
            style={{ color: t.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}

/* ═════════ 6. Featured products rail with discount badges ═════════ */
function FeaturedDealsRail({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const list = products.slice(0, 12);
  if (!list.length) return null;
  const scroll = (dir: "l" | "r") => {
    scrollRef.current?.scrollBy({ left: dir === "l" ? -500 : 500, behavior: "smooth" });
  };
  return (
    <div className="max-w-[1400px] mx-auto px-4 mt-8">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(15,23,41,0.05)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "#FFB84A", color: "#0F1729", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Deal of the Day
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#0F1729" }}>
              Trending medical essentials
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll("l")} aria-label="Prev" className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#F5F3EE", border: "1px solid rgba(0,0,0,0.06)" }}>
              <ChevronLeft className="w-4 h-4" style={{ color: "#0F1729" }} />
            </button>
            <button onClick={() => scroll("r")} aria-label="Next" className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#F5F3EE", border: "1px solid rgba(0,0,0,0.06)" }}>
              <ChevronRight className="w-4 h-4" style={{ color: "#0F1729" }} />
            </button>
            <Link href="/shop" className="ml-2 text-xs font-bold hidden sm:inline-flex items-center gap-1"
              style={{ color: "#009E87", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto p-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {list.map((p: any) => {
            const discount = p.originalPrice
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0;
            return (
              <Link key={p.id} href={`/products/${p.id}`}
                className="shrink-0 group rounded-xl overflow-hidden transition-all"
                style={{ width: 200, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="relative" style={{ background: "#F7F5F1", aspectRatio: "1" }}>
                  <img src={p.imageUrl} alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80"; }} />
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: "#E85D3A", color: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {p.brand && (
                    <p className="text-[9px] font-semibold tracking-widest uppercase"
                      style={{ color: "rgba(0,0,0,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {p.brand}
                    </p>
                  )}
                  <p className="line-clamp-2 text-xs font-semibold mt-1"
                    style={{ color: "#0F1729", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.35, minHeight: 32 }}>
                    {p.name}
                  </p>
                  {p.rating && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                        style={{ background: "#009E87" }}>
                        <span className="text-[10px] font-bold text-white">{Number(p.rating).toFixed(1)}</span>
                        <Star className="w-2.5 h-2.5 fill-white text-white" />
                      </div>
                      <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        ({p.reviewCount || 0})
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ color: "#0F1729", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {formatINR(p.price)}
                    </span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <>
                        <span className="text-[11px] line-through" style={{ color: "rgba(0,0,0,0.35)" }}>
                          {formatINR(p.originalPrice)}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: "#E85D3A" }}>
                          {discount}% off
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═════════ Main export ═════════ */
export function HeroMarketplace({ categories, products }: { categories: any[]; products: any[] }) {
  return (
    <div style={{ background: "#F5F3EE" }}>
      <UtilityRibbon />
      <CategoryRail categories={categories} />
      <HeroCarousel />
      <AskCadusBar />
      <PromoTiles products={products} />
      <FeaturedDealsRail products={products} />
      <div style={{ height: 40 }} />
    </div>
  );
}
