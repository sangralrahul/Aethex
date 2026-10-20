import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { PageHero } from "@/components/PageHero";
import {
  BookOpen, Search, ShoppingCart, Star, ChevronRight,
  GraduationCap, Library, Tag, TrendingUp, BookMarked,
  Sparkles, Trophy, ChevronDown, X, Filter,
} from "lucide-react";
import { bookSlug } from "@/pages/BookDetail";
import { EnquiryDialog } from "@/components/store/EnquiryForm";
import { useSeo } from "@/hooks/use-seo";
import { CURRICULUM, type Degree, type CurriculumYear, type SubjectGroup, type CurrBook } from "@/data/curriculumBooks";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Book Card ─────────────────────────────────────────────────────────────
export const bookTitle = (name: string) => name.replace(/\s+\d+(?:st|nd|rd|th)\s+Ed(?:ition)?.*$/i, "");

function BookCard({ book, color, onRequest }: { book: CurrBook; color: string; onRequest: (b: CurrBook) => void }) {
  return (
    <div
      className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl relative"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 14px rgba(0,0,0,0.07)" }}
    >
      {/* Full-card clickable overlay — sits behind buttons; every book gets its own detail page */}
      <Link href={`/books/${bookSlug(book.name)}`} className="absolute inset-0 z-0" aria-label={`View ${book.name} details`} />
      {/* Cover: a designed spine in the subject's colour (clicks go through to the link behind it) */}
      <div className="relative shrink-0 overflow-hidden flex items-center justify-center pointer-events-none" style={{ height: 180, background: `linear-gradient(160deg,${color}22,${color}08)` }}>
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center h-full w-full"
          style={{ background: `linear-gradient(160deg,${color}DD,${color}88)` }}>
          <BookOpen className="w-8 h-8 text-white opacity-70" />
          <p className="text-[10px] font-bold text-white opacity-80 line-clamp-3 leading-tight">{bookTitle(book.name)}</p>
        </div>
        {book.featured && (
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md" style={{ background: "#B45309", color: "#fff" }}>Standard text</span>
          </div>
        )}
        {book.forExam?.length ? (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {book.forExam.slice(0, 2).map(e => (
              <span key={e} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>{e}</span>
            ))}
          </div>
        ) : null}
        <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>
          {book.edition}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        <h3 className="text-[12px] font-bold leading-snug line-clamp-3 group-hover:text-[#007AFF] transition-colors" style={{ color: "#1C1C1E", minHeight: "3.2rem" }}>
          {bookTitle(book.name)}
        </h3>
        <p className="text-[10px] truncate" style={{ color: "#8E8E93" }}>{book.author}</p>
        <span className="self-start text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>{book.publisher}</span>
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onRequest(book); }}
          className="relative z-10 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 mt-auto"
          style={{ background: `linear-gradient(135deg,${color},${color}CC)`, color: "#fff" }}
        >
          <BookMarked className="w-3 h-3" /> Request this book
        </button>
      </div>
    </div>
  );
}

// ── Subject Section ───────────────────────────────────────────────────────
function SubjectSection({
  subj,
  degreeColor,
  onRequest,
}: {
  subj: SubjectGroup;
  degreeColor: string;
  onRequest: (b: CurrBook) => void;
}) {
  const color = subj.color || degreeColor;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? subj.books : subj.books.slice(0, 10);

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
          <BookCard key={book.name} book={book} color={color} onRequest={onRequest} />
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
  onRequest,
}: {
  year: CurriculumYear;
  degreeColor: string;
  onRequest: (b: CurrBook) => void;
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
        <SubjectSection key={subj.id} subj={subj} degreeColor={degreeColor} onRequest={onRequest} />
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
  const [request, setRequest] = useState<CurrBook | null>(null);
  const loading = false;
  const yearScrollRef = useRef<HTMLDivElement>(null);
  useSeo({ title: "Medical books by degree and year | Aethex", description: "MBBS, MD, MS, DM, MCh and DNB textbooks by year and subject. Request any book and we'll confirm the edition, price and availability.", path: "/books" });

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
        subtitle={`${totalBooks}+ books · MBBS to DM/MCh · by year and subject · request any book`}
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
                      {dBooks.map(({ book, subj }) => (
                        <BookCard key={book.name} book={book} color={subj.color || deg.color} onRequest={setRequest} />
                      ))}
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
                  onRequest={setRequest}
                />
              ) : (
                <YearPanel
                  year={activeYear}
                  degreeColor={activeDegree.color}
                  onRequest={setRequest}
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
                  We source medical textbooks on request: tell us the title and edition, and we'll confirm the price and availability.
                </p>
                <button type="button" onClick={() => setRequest({ name: "", author: "", publisher: "", edition: "", price: 0, mrp: 0, matchTags: [] } as unknown as CurrBook)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
                  <Trophy className="w-4 h-4" />
                  Request a book
                </button>
              </div>
            </main>
          </div>
        )}
      </div>
      </div>{/* /relative wrapper */}
      <EnquiryDialog
        open={!!request}
        onClose={() => setRequest(null)}
        title="Request a book"
        kind="book"
        item={request?.name ? `${bookTitle(request.name)} (${request.edition}) by ${request.author}, ${request.publisher}` : undefined}
        itemLabel={request?.name ? `${bookTitle(request.name)} · ${request.edition} · ${request.author}` : "Tell us the title, author and edition below."}
      />
    </div>
  );
}
