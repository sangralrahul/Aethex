import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import {
  BookOpen, Search, ShoppingCart, Star, ChevronRight,
  GraduationCap, Library, Tag, TrendingUp, BookMarked,
  Sparkles, Trophy, ChevronDown, X, Filter,
} from "lucide-react";
import { bookSlug } from "@/pages/BookDetail";
import { useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { CURRICULUM, type Degree, type CurriculumYear, type SubjectGroup, type CurrBook } from "@/data/curriculumBooks";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Book cover: proxied via our own API server (caches + throttles Google Books)
const coverCache = new Map<string, string | false>();
const coverInFlight = new Set<string>();

function useBookCover(title: string, author: string, enabled: boolean) {
  const key = `${title}|${author}`;
  const [url, setUrl] = useState<string | false>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (coverCache.has(key)) { setUrl(coverCache.get(key)!); return; }
    if (coverInFlight.has(key)) return;
    coverInFlight.add(key);
    setLoading(true);
    fetch(
      `${BASE}/api/book-cover?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`,
      { signal: AbortSignal.timeout(15000) }
    )
      .then(r => r.json())
      .then((data: { url: string | null }) => {
        const v: string | false = data.url || false;
        coverCache.set(key, v);
        coverInFlight.delete(key);
        setUrl(v);
        setLoading(false);
      })
      .catch(() => {
        coverCache.set(key, false);
        coverInFlight.delete(key);
        setUrl(false);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { url, loading };
}

// ── Helpers ───────────────────────────────────────────────────────────────
function discount(price: number, mrp: number) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// ── Book Card ─────────────────────────────────────────────────────────────
function BookCard({
  book,
  color,
  dbId,
  onCart,
}: {
  book: CurrBook;
  color: string;
  dbId?: number;
  onCart: (id: number) => void;
}) {
  const disc = discount(book.price, book.mrp);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "80px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const { url: coverUrl, loading: coverLoading } = useBookCover(book.name, book.author, visible);

  return (
    <div
      ref={cardRef}
      className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl relative"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 14px rgba(0,0,0,0.07)" }}
    >
      {/* Full-card clickable overlay — sits behind buttons; every book gets its own detail page */}
      <Link href={`/books/${bookSlug(book.name)}`} className="absolute inset-0 z-0" aria-label={`View ${book.name} details`} />
      {/* Cover */}
      <div className="relative shrink-0 overflow-hidden flex items-center justify-center" style={{ height: 180, background: `linear-gradient(160deg,${color}22,${color}08)` }}>
        {coverLoading && (
          <div className="absolute inset-0 animate-pulse" style={{ background: `linear-gradient(135deg,${color}22,${color}10)` }} />
        )}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.name}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500 p-2"
            style={{ objectPosition: "center" }}
          />
        ) : !coverLoading ? (
          /* Fallback — styled book spine if no cover found */
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center h-full w-full"
            style={{ background: `linear-gradient(160deg,${color}DD,${color}88)` }}>
            <BookOpen className="w-8 h-8 text-white opacity-70" />
            <p className="text-[10px] font-bold text-white opacity-80 line-clamp-3 leading-tight">
              {book.name.replace(/\s+\d+(?:st|nd|rd|th)\s+Ed(?:ition)?.*$/i, "")}
            </p>
          </div>
        ) : null}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {disc >= 10 && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md" style={{ background: "#FF3B30", color: "#fff" }}>
              {disc}% OFF
            </span>
          )}
          {book.featured && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md" style={{ background: "#FF9500", color: "#fff" }}>
              ⭐ Featured
            </span>
          )}
        </div>
        {book.forExam?.length && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {book.forExam.slice(0, 2).map(e => (
              <span key={e} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
                {e}
              </span>
            ))}
          </div>
        )}
        {/* Edition */}
        <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>
          {book.edition}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        {/* Title */}
        <h3
          className="text-[12px] font-bold leading-snug line-clamp-3 group-hover:text-[#007AFF] transition-colors"
          style={{ color: "#1C1C1E", minHeight: "3.2rem" }}
        >
          {book.name.replace(/\s+\d+(?:st|nd|rd|th)\s+Ed(?:ition)?.*$/i, "")}
        </h3>

        {/* Author */}
        <p className="text-[10px] truncate" style={{ color: "#8E8E93" }}>
          {book.author}
        </p>

        {/* Publisher tag */}
        <span className="self-start text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>
          {book.publisher}
        </span>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-extrabold" style={{ color: "#1C1C1E" }}>
            ₹{book.price.toLocaleString("en-IN")}
          </span>
          {book.mrp > book.price && (
            <span className="text-[10px] line-through" style={{ color: "#AEAEB2" }}>
              ₹{book.mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Cart button — z-10 to sit above the card-link overlay */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); if (dbId) onCart(dbId); }}
          className="relative z-10 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 mt-1"
          style={{
            background: dbId ? `linear-gradient(135deg,${color},${color}CC)` : "#E5E5EA",
            color: dbId ? "#fff" : "#AEAEB2",
          }}
          disabled={!dbId}
        >
          <ShoppingCart className="w-3 h-3" />
          {dbId ? "Add to Cart" : "Request Book"}
        </button>
      </div>
    </div>
  );
}

// ── Subject Section ───────────────────────────────────────────────────────
function SubjectSection({
  subj,
  degreeColor,
  dbProducts,
  onCart,
}: {
  subj: SubjectGroup;
  degreeColor: string;
  dbProducts: Record<string, number>;
  onCart: (id: number) => void;
}) {
  const color = subj.color || degreeColor;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? subj.books : subj.books.slice(0, 10);

  const getDbId = (book: CurrBook): number | undefined => {
    for (const tag of book.matchTags) {
      const key = tag.toLowerCase();
      if (dbProducts[key]) return dbProducts[key];
    }
    const nameKey = book.name.toLowerCase().slice(0, 20);
    return dbProducts[nameKey];
  };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-8 rounded-full" style={{ background: color }} />
        <h3 className="text-lg font-display font-bold" style={{ color: "#1C1C1E" }}>
          {subj.name}
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>
          {subj.books.length} books
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {visible.map(book => (
          <BookCard key={book.name} book={book} color={color} dbId={getDbId(book)} onCart={onCart} />
        ))}
      </div>

      {subj.books.length > 10 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color }}
        >
          {showAll ? "Show less" : `Show all ${subj.books.length} books`}
          <ChevronDown className="w-4 h-4" style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      )}
    </div>
  );
}

// ── Year Panel ────────────────────────────────────────────────────────────
function YearPanel({
  year,
  degreeColor,
  dbProducts,
  onCart,
}: {
  year: CurriculumYear;
  degreeColor: string;
  dbProducts: Record<string, number>;
  onCart: (id: number) => void;
}) {
  const totalBooks = year.subjects.reduce((s, sub) => s + sub.books.length, 0);
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${degreeColor}14` }}>
          <BookOpen className="w-4.5 h-4.5" style={{ color: degreeColor }} />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: degreeColor }}>{year.label}</span>
          <p className="text-xs" style={{ color: "#AEAEB2" }}>{totalBooks} books · {year.subjects.length} subjects</p>
        </div>
      </div>

      {year.subjects.map(subj => (
        <SubjectSection key={subj.id} subj={subj} degreeColor={degreeColor} dbProducts={dbProducts} onCart={onCart} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function MedicalBooks() {
  const [search, setSearch] = useState("");
  const [activeDegreeId, setActiveDegreeId] = useState(CURRICULUM[0].id);
  const [activeYearId, setActiveYearId] = useState(CURRICULUM[0].years[0].id);
  const [activeSubjectId, setActiveSubjectId] = useState<string>("");
  const [dbProducts, setDbProducts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  const sessionId = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addToCartMutation = useAddToCart();

  const activeDegree = CURRICULUM.find(d => d.id === activeDegreeId) ?? CURRICULUM[0];
  const activeYear = activeDegree.years.find(y => y.id === activeYearId) ?? activeDegree.years[0];
  // For PG degrees: the "subject" is the selected year (Year 1/2/3) within the specialty
  const activeSubject = activeDegree.isPG
    ? (activeYear.subjects.find(s => s.id === activeSubjectId) ?? activeYear.subjects[0])
    : null;

  // When degree changes, reset to first specialty/year
  useEffect(() => {
    const firstYear = activeDegree.years[0];
    setActiveYearId(firstYear.id);
    if (activeDegree.isPG) {
      setActiveSubjectId(firstYear.subjects[0]?.id ?? "");
    }
  }, [activeDegreeId]);

  // When specialty changes (PG mode), reset to first year within specialty
  useEffect(() => {
    if (activeDegree.isPG) {
      setActiveSubjectId(activeYear.subjects[0]?.id ?? "");
    }
  }, [activeYearId, activeDegree.id]);

  // Build a lookup map: lowercase name fragment / tag → product ID from DB
  useEffect(() => {
    const slugs = [
      "books","surgical","cardiac-care","orthopaedic","neurology",
      "gastroenterology","nephrology","pulmonology","ophthalmology",
      "paediatric","dermatology","ent","gynaecology","endocrinology",
      "emergency","radiology","oncology","anaesthesia","physiotherapy",
      "psychiatry","urology",
    ];
    setLoading(true);
    Promise.all(
      slugs.map(slug =>
        fetch(`${BASE}/api/products?category=${slug}&limit=200`)
          .then(r => r.json())
          .then(d => d.products ?? [])
          .catch(() => [])
      )
    ).then(results => {
      const map: Record<string, number> = {};
      const allProducts: { id: number; name: string; tags: string[] }[] = [];
      results.flat().forEach((p: any) => {
        if (!allProducts.find(x => x.id === p.id)) allProducts.push(p);
      });
      allProducts.forEach(p => {
        // key by first 20 chars of name (lowercased)
        map[p.name.toLowerCase().slice(0, 20)] = p.id;
        // key by each tag
        (p.tags ?? []).forEach((t: string) => { map[t.toLowerCase()] = p.id; });
      });
      setDbProducts(map);
      setLoading(false);
    });
  }, []);

  const handleCart = (productId: number) => {
    if (!sessionId) { toast({ title: "Session error", variant: "destructive" }); return; }
    addToCartMutation.mutate(
      { data: { productId, sessionId, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
          toast({ title: "Added to cart ✓", description: "Book added successfully." });
        },
        onError: () => toast({ variant: "destructive", title: "Error adding to cart" }),
      }
    );
  };

  // Search across all books
  const allBooks = useMemo(() => {
    const out: { book: CurrBook; degree: Degree; year: CurriculumYear; subj: SubjectGroup }[] = [];
    CURRICULUM.forEach(deg =>
      deg.years.forEach(yr =>
        yr.subjects.forEach(subj =>
          subj.books.forEach(book => out.push({ book, degree: deg, year: yr, subj }))
        )
      )
    );
    return out;
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return null;
    return allBooks.filter(
      ({ book }) =>
        book.name.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.publisher.toLowerCase().includes(q) ||
        book.matchTags.some(t => t.toLowerCase().includes(q))
    );
  }, [search, allBooks]);

  const totalBooks = allBooks.length;
  const totalDegrees = CURRICULUM.length;

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(160deg, #EEF4FF 0%, #F0F7F4 35%, #F5F0FF 65%, #FFF4EE 100%)",
      backgroundAttachment: "fixed",
    }}>

      {/* ── Hero ── */}
      <PageHero
        tag="Medical Library"
        title="Medical Books by Degree & Year"
        subtitle={`${totalBooks}+ books · MBBS to DM/MCh · NMC curriculum mapped · Best INR prices`}
        icon={<BookOpen className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />}
        right={
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books, authors, subjects…"
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm outline-none font-medium"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#FFFFFF" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      {/* ── Degree Tabs ── */}
      <div className="sticky top-16 z-30" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(60,60,67,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto no-scrollbar">
            {CURRICULUM.map(deg => {
              const isActive = deg.id === activeDegreeId;
              return (
                <button
                  key={deg.id}
                  onClick={() => setActiveDegreeId(deg.id)}
                  className="relative flex flex-col items-center px-5 py-3.5 text-sm font-bold transition-all whitespace-nowrap shrink-0"
                  style={{ color: isActive ? deg.color : "#636366", borderBottom: isActive ? `3px solid ${deg.color}` : "3px solid transparent" }}
                >
                  {deg.label}
                  <span className="text-[10px] font-normal mt-0.5" style={{ color: isActive ? deg.color : "#AEAEB2" }}>
                    {deg.shortLabel === "MBBS" && "Year 1-Final"}
                    {deg.shortLabel === "MD" && "Postgraduate"}
                    {deg.shortLabel === "MS" && "Surgery PG"}
                    {deg.shortLabel === "MCh" && "Super-Specialty"}
                    {deg.shortLabel === "DM" && "Super-Specialty"}
                    {deg.shortLabel === "DNB" && "/ Fellowship"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative">
        {/* Decorative background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute top-20 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
            style={{ background: "radial-gradient(circle,#007AFF33,transparent 70%)", transform: "translateX(-30%)" }} />
          <div className="absolute top-80 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle,#5856D633,transparent 70%)", transform: "translateX(30%)" }} />
          <div className="absolute top-[600px] left-1/3 w-[350px] h-[350px] rounded-full blur-3xl opacity-15"
            style={{ background: "radial-gradient(circle,#00C2A833,transparent 70%)" }} />
          <div className="absolute top-[1100px] right-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle,#FF950033,transparent 70%)" }} />
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bookDotGrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(0,122,255,0.07)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bookDotGrid)" />
          </svg>
        </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Search Results Mode */}
        {searchResults !== null ? (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Search className="w-5 h-5" style={{ color: "#007AFF" }} />
              <h2 className="text-xl font-display font-bold" style={{ color: "#1C1C1E" }}>
                Search Results
              </h2>
              <span className="text-sm" style={{ color: "#636366" }}>
                {searchResults.length} books found
              </span>
              <button onClick={() => setSearch("")} className="ml-auto flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#FF3B30" }}>
                <X className="w-4 h-4" /> Clear
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-20 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
                <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#AEAEB2" }} />
                <p className="font-semibold mb-2" style={{ color: "#636366" }}>No books found for "{search}"</p>
                <button onClick={() => setSearch("")} className="text-sm font-bold" style={{ color: "#007AFF" }}>Clear search</button>
              </div>
            ) : (
              // Group by degree
              CURRICULUM.map(deg => {
                const dBooks = searchResults.filter(r => r.degree.id === deg.id);
                if (!dBooks.length) return null;
                return (
                  <div key={deg.id} className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${deg.color}14`, color: deg.color }}>
                        {deg.label}
                      </span>
                      <span className="text-xs" style={{ color: "#AEAEB2" }}>{dBooks.length} result{dBooks.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {dBooks.map(({ book, subj }) => {
                        const getDbId = (b: CurrBook) => {
                          for (const tag of b.matchTags) {
                            const key = tag.toLowerCase();
                            if (dbProducts[key]) return dbProducts[key];
                          }
                          return dbProducts[b.name.toLowerCase().slice(0, 20)];
                        };
                        return (
                          <BookCard key={book.name} book={book} color={subj.color || deg.color} dbId={getDbId(book)} onCart={handleCart} />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex gap-8">

            {/* ── Sidebar: Year/Course navigation ── */}
            <aside className="hidden lg:block w-56 shrink-0 sticky self-start" style={{ top: "130px", maxHeight: "calc(100vh - 150px)", overflowY: "auto", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(16px)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.8)", padding: "16px 12px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#AEAEB2" }}>
                {activeDegree.isPG ? "Specialty" : "Academic Year"}
              </p>
              {activeDegree.years.map(yr => {
                const isActiveSpecialty = yr.id === activeYearId;
                const count = yr.subjects.reduce((s, sub) => s + sub.books.length, 0);
                return (
                  <div key={yr.id}>
                    <button
                      onClick={() => setActiveYearId(yr.id)}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all mb-0.5"
                      style={isActiveSpecialty
                        ? { background: `${activeDegree.color}14`, color: activeDegree.color }
                        : { color: "#636366" }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                        style={{ background: isActiveSpecialty ? activeDegree.color : "#C7C7CC" }}
                      />
                      <span className="flex-1 leading-snug">{yr.label}</span>
                      <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0"
                        style={{ background: isActiveSpecialty ? `${activeDegree.color}20` : "rgba(60,60,67,0.08)", color: isActiveSpecialty ? activeDegree.color : "#AEAEB2" }}>
                        {count}
                      </span>
                    </button>

                    {/* Year sub-items — only shown when this specialty is active and degree is PG */}
                    {activeDegree.isPG && isActiveSpecialty && (
                      <div className="ml-4 mb-1 mt-0.5 flex flex-col gap-0.5">
                        {yr.subjects.map(sub => {
                          const isActiveYear = sub.id === (activeSubject?.id ?? yr.subjects[0].id);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveSubjectId(sub.id)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-all"
                              style={isActiveYear
                                ? { color: activeDegree.color, background: `${activeDegree.color}12` }
                                : { color: "#8E8E93" }}
                            >
                              <div className="w-1 h-1 rounded-full shrink-0"
                                style={{ background: isActiveYear ? activeDegree.color : "#D1D1D6" }} />
                              <span className="flex-1">{sub.name}</span>
                              <span className="text-[9px]" style={{ color: isActiveYear ? activeDegree.color : "#AEAEB2" }}>
                                {sub.books.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </aside>

            {/* ── Main: Year panel ── */}
            <main className="flex-1 min-w-0">

              {/* Mobile pills — specialties for PG, years for UG */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3 lg:hidden" ref={yearScrollRef}>
                {activeDegree.years.map(yr => {
                  const isActive = yr.id === activeYearId;
                  return (
                    <button
                      key={yr.id}
                      onClick={() => setActiveYearId(yr.id)}
                      className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                      style={isActive
                        ? { background: activeDegree.color, color: "#fff" }
                        : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}
                    >
                      {yr.label}
                    </button>
                  );
                })}
              </div>
              {/* Mobile year sub-pills — only shown in PG mode */}
              {activeDegree.isPG && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6 lg:hidden">
                  {activeYear.subjects.map(sub => {
                    const isActive = sub.id === (activeSubject?.id ?? activeYear.subjects[0].id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubjectId(sub.id)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                        style={isActive
                          ? { background: `${activeDegree.color}22`, color: activeDegree.color, border: `1px solid ${activeDegree.color}40` }
                          : { background: "#F5F3EE", color: "#8E8E93", border: "1px solid rgba(60,60,67,0.12)" }}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Content header */}
              <div className="flex items-center gap-3 mb-7 p-5 rounded-2xl"
                style={{ background: `linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0.4))`, backdropFilter: "blur(16px)", border: `1px solid ${activeDegree.color}30`, boxShadow: `0 4px 24px ${activeDegree.color}14` }}>
                <GraduationCap className="w-7 h-7 shrink-0" style={{ color: activeDegree.color }} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${activeDegree.color}20`, color: activeDegree.color }}>
                      {activeDegree.label}
                    </span>
                    <ChevronRight className="w-3 h-3" style={{ color: "#AEAEB2" }} />
                    <span className="text-xs font-semibold" style={{ color: "#636366" }}>{activeYear.label}</span>
                    {activeDegree.isPG && activeSubject && (
                      <>
                        <ChevronRight className="w-3 h-3" style={{ color: "#AEAEB2" }} />
                        <span className="text-xs font-semibold" style={{ color: "#636366" }}>{activeSubject.name}</span>
                      </>
                    )}
                  </div>
                  <p className="text-lg font-display font-bold mt-0.5" style={{ color: "#1C1C1E" }}>
                    {activeDegree.isPG && activeSubject
                      ? `${activeYear.label} · ${activeSubject.name} — ${activeSubject.books.length} Books`
                      : `${activeYear.label} — ${activeYear.subjects.length} Subject${activeYear.subjects.length !== 1 ? "s" : ""} · ${activeYear.subjects.reduce((s, sub) => s + sub.books.length, 0)} Books`
                    }
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(60,60,67,0.08)" }}>
                      <div className="h-40 animate-pulse" style={{ background: "rgba(60,60,67,0.07)" }} />
                      <div className="p-3 flex flex-col gap-2">
                        <div className="h-3 w-full rounded animate-pulse" style={{ background: "rgba(60,60,67,0.07)" }} />
                        <div className="h-3 w-2/3 rounded animate-pulse" style={{ background: "rgba(60,60,67,0.07)" }} />
                        <div className="h-5 w-1/2 rounded animate-pulse mt-2" style={{ background: "rgba(60,60,67,0.07)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeDegree.isPG && activeSubject ? (
                /* PG mode: show only the selected year's books */
                <SubjectSection
                  subj={activeSubject}
                  degreeColor={activeDegree.color}
                  dbProducts={dbProducts}
                  onCart={handleCart}
                />
              ) : (
                <YearPanel
                  year={activeYear}
                  degreeColor={activeDegree.color}
                  dbProducts={dbProducts}
                  onCart={handleCart}
                />
              )}

              {/* Bottom CTA */}
              <div className="mt-16 rounded-3xl p-8 lg:p-10 text-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-10"
                  style={{ background: "#007AFF", transform: "translate(30%,-30%)" }} />
                <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-20 text-white" />
                <h3 className="text-xl font-display font-bold text-white mb-2">Can't find your book?</h3>
                <p className="mb-5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  We source any medical textbook on request — Indian & international editions at the best price.
                </p>
                <a href={`${BASE}/contact`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
                  <Trophy className="w-4 h-4" />
                  Request a Book
                </a>
              </div>
            </main>
          </div>
        )}
      </div>
      </div>{/* /relative wrapper */}
    </div>
  );
}
