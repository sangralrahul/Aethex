import { useState, useRef, useEffect, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { Link, useLocation } from "wouter";
import { Star, ExternalLink, BookOpen, PlayCircle, CheckCircle2, Filter, Crown, GraduationCap, Award, Zap, Clock, Globe, Users, Sparkles, ArrowUpRight, Brain, FlaskConical, Stethoscope, ArrowRight, Search, X, ChevronRight } from "lucide-react";
import { medicalSubjects } from "@/data/medicalSubjects";
import { medicalDepartments } from "@/data/medicalDepartments";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SearchHit = {
  label: string;
  sub: string;
  href: string;
  badge?: string;
  badgeColor?: string;
};

function buildSearchIndex(tab: "overview" | "exam" | "flashcards"): SearchHit[] {
  const hits: SearchHit[] = [];
  const suffix = tab === "overview" ? "" : `?tab=${tab}`;
  medicalSubjects.forEach(s => {
    s.topics.forEach(t => {
      hits.push({
        label: t.name,
        sub: s.name,
        badge: t.difficulty,
        badgeColor: t.difficulty === "Basic" ? "#238636" : t.difficulty === "Intermediate" ? "#E3B341" : "#F85149",
        href: `${BASE}/study-hub/medical-knowledge-hub/subjects/${s.slug}/${t.slug}${suffix}`,
      });
    });
  });
  medicalDepartments.forEach(d => {
    d.conditions.forEach(c => {
      hits.push({
        label: c.name,
        sub: d.name,
        badge: c.severity,
        badgeColor: c.severity === "Mild" ? "#238636" : c.severity === "Moderate" ? "#E3B341" : c.severity === "Severe" ? "#F97316" : "#F85149",
        href: `${BASE}/study-hub/medical-knowledge-hub/departments/${d.slug}/${c.slug}${suffix}`,
      });
    });
  });
  return hits;
}

function HubSearchCard({
  icon, title, desc, badge, tab, accentColor,
}: {
  icon: string; title: string; desc: string; badge: string;
  tab: "overview" | "exam" | "flashcards"; accentColor: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const index = useMemo(() => buildSearchIndex(tab), [tab]);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return index.filter(h => h.label.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q)).slice(0, 7);
  }, [query, index]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    setLocation(href.replace(BASE, ""));
  };

  return (
    <div className="rounded-xl overflow-visible flex flex-col" style={{ background: "#161B22", border: `1px solid #21262D` }}>
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-3xl">{icon}</div>
          <span className="px-2 py-0.5 rounded text-xs font-bold shrink-0" style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}33` }}>{badge}</span>
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ color: "#E6EDF3" }}>{title}</h3>
        <p className="text-xs leading-relaxed" style={{ color: "#8B949E" }}>{desc}</p>
      </div>

      {/* Search */}
      <div ref={ref} className="px-4 pb-4 relative mt-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#8B949E" }} />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search topic or condition..."
            className="w-full pl-8 pr-8 py-2 rounded-lg text-xs focus:outline-none transition-all"
            style={{
              background: "#0D1117",
              border: `1px solid ${open && query ? accentColor + "66" : "#30363D"}`,
              color: "#E6EDF3",
            }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3" style={{ color: "#8B949E" }} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 rounded-xl overflow-hidden shadow-2xl z-50"
            style={{ background: "#161B22", border: "1px solid #30363D", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => handleSelect(r.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-white/5 border-b last:border-0"
                style={{ borderColor: "#21262D" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: "#E6EDF3" }}>{r.label}</div>
                  <div className="text-xs truncate" style={{ color: "#8B949E" }}>{r.sub}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {r.badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ color: r.badgeColor, background: `${r.badgeColor}18` }}>
                      {r.badge}
                    </span>
                  )}
                  <ChevronRight className="w-3 h-3" style={{ color: "#8B949E" }} />
                </div>
              </button>
            ))}
            <div className="px-3 py-2 text-xs" style={{ color: "#8B949E", borderTop: "1px solid #21262D" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} — press Enter to open first
            </div>
          </div>
        )}
        {open && query.length >= 2 && results.length === 0 && (
          <div className="absolute left-4 right-4 mt-1 rounded-xl px-4 py-3 text-xs z-50"
            style={{ background: "#161B22", border: "1px solid #30363D", color: "#8B949E" }}>
            No results for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

const platforms = [
  {
    id: "prepladder",
    name: "PrepLadder",
    logo: "PL",
    logoUrl: "https://www.google.com/s2/favicons?domain=prepladder.com&sz=128",
    color: "#FF6B35",
    tagline: "India's #1 NEET PG prep platform",
    monthlyPrice: 4999,
    annualPrice: 11999,
    rating: 4.7,
    reviews: 45200,
    exams: ["NEET PG", "NEXT", "FMGE", "INI-CET"],
    features: ["15,000+ HD video lectures", "50,000+ MCQs with explanations", "Live doubt sessions", "Revision notes & flashcards", "Grand tests & mocks", "Performance analytics"],
    pros: ["Best video quality", "Comprehensive coverage", "Strong faculty"],
    cons: ["Slightly expensive", "App can be slow"],
    link: "https://prepladder.com",
    badge: "Most Popular",
    badgeColor: "#FF6B35",
  },
  {
    id: "marrow",
    name: "Marrow",
    logo: "MA",
    logoUrl: "https://www.google.com/s2/favicons?domain=marrow.com&sz=128",
    color: "#6C63FF",
    tagline: "Smart learning for smarter doctors",
    monthlyPrice: 3999,
    annualPrice: 9999,
    rating: 4.6,
    reviews: 38700,
    exams: ["NEET PG", "INI-CET", "USMLE Step 1", "NEXT"],
    features: ["AI-powered adaptive learning", "12,000+ video lectures", "45,000+ MCQ bank", "Daily targets & streaks", "Peer comparison", "Image bank"],
    pros: ["Adaptive algorithm", "Great UI/UX", "Active community"],
    cons: ["Limited surgery content", "Costly annual plan"],
    link: "https://marrow.com",
    badge: "Best AI",
    badgeColor: "#6C63FF",
  },
  {
    id: "pwmed",
    name: "PW Med",
    logo: "PW",
    logoUrl: "https://www.google.com/s2/favicons?domain=physicswallah.live&sz=128",
    color: "#FF3F6C",
    tagline: "Physics Wallah enters medical with a bang",
    monthlyPrice: 1999,
    annualPrice: 5999,
    rating: 4.3,
    reviews: 21000,
    exams: ["NEET PG", "NEXT", "FMGE"],
    features: ["Affordable price plans", "Video lectures", "40,000+ MCQs", "PDF notes", "Live classes", "Batch courses"],
    pros: ["Very affordable", "Good for basics", "PW brand trust"],
    cons: ["Less comprehensive", "New platform", "Limited mock tests"],
    link: "https://physicswallah.live",
    badge: "Best Value",
    badgeColor: "#FF3F6C",
  },
  {
    id: "dams",
    name: "DAMS",
    logo: "DA",
    logoUrl: "https://www.google.com/s2/favicons?domain=damsdelhi.com&sz=128",
    color: "#00B894",
    tagline: "Delhi Academy — trusted for decades",
    monthlyPrice: 3499,
    annualPrice: 8999,
    rating: 4.4,
    reviews: 29800,
    exams: ["NEET PG", "AIIMS PG", "PGI", "DNB CET"],
    features: ["Subject-wise modules", "Topic-wise tests", "Grand tests", "Previous year papers", "Printed material option", "Faculty support"],
    pros: ["Very experienced faculty", "Offline material", "PGI/AIIMS focus"],
    cons: ["Older UI", "Limited app features"],
    link: "https://damsdelhi.com",
    badge: "Most Trusted",
    badgeColor: "#00B894",
  },
  {
    id: "bhatia",
    name: "Bhatia Global",
    logo: "BG",
    logoUrl: "https://www.google.com/s2/favicons?domain=bhatiaglobal.com&sz=128",
    color: "#F59E0B",
    tagline: "Structured learning for aspirants",
    monthlyPrice: 2999,
    annualPrice: 7499,
    rating: 4.2,
    reviews: 14500,
    exams: ["NEET PG", "FMGE", "NEXT"],
    features: ["Video lectures", "MCQ bank", "Test series", "Revision notes", "Doubt clearing", "Mobile app"],
    pros: ["Good revision notes", "Affordable", "Consistent updates"],
    cons: ["Smaller faculty team", "Less mock tests"],
    link: "https://bhatiaglobal.com",
    badge: null,
    badgeColor: "",
  },
  {
    id: "amboss",
    name: "AMBOSS",
    logo: "AM",
    logoUrl: "https://www.google.com/s2/favicons?domain=amboss.com&sz=128",
    color: "#0984E3",
    tagline: "The gold standard for international exams",
    monthlyPrice: 3800,
    annualPrice: 12000,
    rating: 4.8,
    reviews: 67000,
    exams: ["USMLE Step 1", "USMLE Step 2", "NEXT", "FMGE"],
    features: ["Qbank: 5000+ vignettes", "Integrated knowledge library", "Self-assessment", "Anki deck integration", "Clinical case simulations", "Multi-language support"],
    pros: ["World-class quality", "Best for USMLE", "Detailed explanations"],
    cons: ["Expensive", "Less India-specific content", "Complex interface"],
    link: "https://amboss.com",
    badge: "Best for USMLE",
    badgeColor: "#0984E3",
  },
  {
    id: "lecturio",
    name: "Lecturio",
    logo: "LE",
    logoUrl: "https://www.google.com/s2/favicons?domain=lecturio.com&sz=128",
    color: "#E17055",
    tagline: "Concept-based learning for global exams",
    monthlyPrice: 2500,
    annualPrice: 9500,
    rating: 4.4,
    reviews: 31200,
    exams: ["USMLE Step 1", "USMLE Step 2", "FMGE", "NEXT"],
    features: ["3000+ video lectures", "Qbank with 2500+ questions", "Spaced repetition system", "USMLE-style cases", "Mobile offline mode", "Progress tracking"],
    pros: ["Good video production", "Spaced repetition", "Global content"],
    cons: ["Less India-specific", "Limited live sessions"],
    link: "https://lecturio.com",
    badge: null,
    badgeColor: "",
  },
  {
    id: "osmosis",
    name: "Osmosis",
    logo: "OS",
    logoUrl: "https://www.google.com/s2/favicons?domain=osmosis.org&sz=128",
    color: "#A29BFE",
    tagline: "Visual learning redefined",
    monthlyPrice: 2200,
    annualPrice: 8000,
    rating: 4.5,
    reviews: 48000,
    exams: ["USMLE Step 1", "USMLE Step 2", "FMGE"],
    features: ["Video + infographic style", "Flashcard system", "5000+ videos", "High-yield notes", "Integrated question bank", "Study planner"],
    pros: ["Beautiful visuals", "Excellent for basic sciences", "Great for visual learners"],
    cons: ["Less clinical focus", "Not NEET PG specific"],
    link: "https://osmosis.org",
    badge: null,
    badgeColor: "",
  },
  {
    id: "sketchy",
    name: "Sketchy Medical",
    logo: "SK",
    logoUrl: "https://www.google.com/s2/favicons?domain=sketchy.com&sz=128",
    color: "#FD79A8",
    tagline: "Memory through storytelling & imagery",
    monthlyPrice: 2400,
    annualPrice: 8500,
    rating: 4.6,
    reviews: 27000,
    exams: ["USMLE Step 1", "USMLE Step 2"],
    features: ["Story-based video mnemonics", "Micro/Pharm/Path coverage", "800+ videos", "Active recall exercises", "Community notes", "Mobile app"],
    pros: ["Unforgettable retention", "Best for micro/pharm", "Unique approach"],
    cons: ["Not India-specific", "Only for USMLE", "Can feel gimmicky"],
    link: "https://sketchy.com",
    badge: null,
    badgeColor: "",
  },
  {
    id: "najeeb",
    name: "Dr. Najeeb",
    logo: "DN",
    logoUrl: "https://www.google.com/s2/favicons?domain=drnajeeblectures.com&sz=128",
    color: "#00CEC9",
    tagline: "The professor everyone loves",
    monthlyPrice: 1200,
    annualPrice: 4500,
    rating: 4.7,
    reviews: 82000,
    exams: ["USMLE Step 1", "MBBS basics", "Basic sciences"],
    features: ["1800+ hours of video", "Basic sciences deep dives", "Anatomy, physiology, biochem", "Pathology lectures", "Lifetime access option", "Most detailed explanations"],
    pros: ["Best basic science explanations", "Very affordable", "Legendary teaching"],
    cons: ["No question bank", "Not updated frequently", "Not for clinical exams"],
    link: "https://drnajeeblectures.com",
    badge: "Best Basics",
    badgeColor: "#00CEC9",
  },
];

const examFilters = ["All", "NEET PG", "NEXT", "FMGE", "USMLE Step 1", "USMLE Step 2", "INI-CET", "AIIMS PG"];

const youtubeChannels = [
  {
    name: "Dr. Najeeb Lectures",
    handle: "@DrNajeebLectures",
    subs: "1.8M",
    topic: "Basic Sciences — Anatomy, Physiology, Pharmacology",
    url: "https://www.youtube.com/@DrNajeebLectures",
    logo: "https://ui-avatars.com/api/?name=NJ&background=CC0000&color=fff&size=128&bold=true&font-size=0.45&rounded=true",
    badge: "Must Watch",
    color: "#CC0000",
  },
  {
    name: "PrepLadder",
    handle: "@PrepLadder",
    subs: "1.5M",
    topic: "NEET PG — All Subjects",
    url: "https://www.youtube.com/@PrepLadder",
    logo: "https://ui-avatars.com/api/?name=PL&background=E84C1E&color=fff&size=128&bold=true&font-size=0.45&rounded=true",
    badge: "NEET PG",
    color: "#E84C1E",
  },
  {
    name: "Marrow",
    handle: "@MarrowNEETPG",
    subs: "920K",
    topic: "NEET PG — Clinical Sciences",
    url: "https://www.youtube.com/@MarrowNEETPG",
    logo: "https://ui-avatars.com/api/?name=MR&background=00A893&color=fff&size=128&bold=true&font-size=0.45&rounded=true",
    badge: "",
    color: "#00A893",
  },
  {
    name: "Medicosis Perfectionalis",
    handle: "@MedicosisP",
    subs: "730K",
    topic: "Pathophysiology & Clinical Medicine",
    url: "https://www.youtube.com/@MedicosisP",
    logo: "https://ui-avatars.com/api/?name=MP&background=7C3AED&color=fff&size=128&bold=true&font-size=0.45&rounded=true",
    badge: "USMLE",
    color: "#7C3AED",
  },
  {
    name: "Armando Hasudungan",
    handle: "@armandohasudungan",
    subs: "1.1M",
    topic: "Biology, Physiology & Microbiology",
    url: "https://www.youtube.com/@armandohasudungan",
    logo: "https://ui-avatars.com/api/?name=AH&background=2563EB&color=fff&size=128&bold=true&font-size=0.45&rounded=true",
    badge: "",
    color: "#2563EB",
  },
  {
    name: "Dirty Medicine",
    handle: "@DirtyMedicine",
    subs: "630K",
    topic: "USMLE Step 1 & Step 2 CK",
    url: "https://www.youtube.com/@DirtyMedicine",
    logo: "https://ui-avatars.com/api/?name=DM&background=D97706&color=fff&size=128&bold=true&font-size=0.45&rounded=true",
    badge: "USMLE",
    color: "#D97706",
  },
];

const medicalBooks = [
  {
    title: "Harrison's Principles of Internal Medicine",
    authors: "Fauci, Kasper, Longo",
    category: "Medicine",
    price: 4800,
    link: "/shop?search=harrison",
    cover: "https://covers.openlibrary.org/b/isbn/9781259644030-M.jpg",
    color: "#1D4ED8",
    edition: "21st Ed",
  },
  {
    title: "Gray's Anatomy for Students",
    authors: "Drake, Vogl, Mitchell",
    category: "Anatomy",
    price: 2200,
    link: "/shop?search=gray+anatomy",
    cover: "https://covers.openlibrary.org/b/isbn/9780323393041-M.jpg",
    color: "#B45309",
    edition: "4th Ed",
  },
  {
    title: "Robbins & Cotran Pathological Basis of Disease",
    authors: "Kumar, Abbas, Aster",
    category: "Pathology",
    price: 3600,
    link: "/shop?search=robbins",
    cover: "https://covers.openlibrary.org/b/isbn/9780323531205-M.jpg",
    color: "#9D1B1B",
    edition: "10th Ed",
  },
  {
    title: "Goodman & Gilman's Pharmacology",
    authors: "Brunton, Hilal-Dandan",
    category: "Pharmacology",
    price: 3200,
    link: "/shop?search=goodman+pharmacology",
    cover: "https://covers.openlibrary.org/b/isbn/9781259584732-M.jpg",
    color: "#065F46",
    edition: "13th Ed",
  },
  {
    title: "Bailey & Love's Short Practice of Surgery",
    authors: "Williams, O'Connell, McCaskie",
    category: "Surgery",
    price: 2900,
    link: "/shop?search=bailey+love",
    cover: "https://covers.openlibrary.org/b/isbn/9781138052697-M.jpg",
    color: "#4C1D95",
    edition: "27th Ed",
  },
  {
    title: "Williams Obstetrics",
    authors: "Cunningham et al.",
    category: "OBG",
    price: 2600,
    link: "/shop?search=williams+obstetrics",
    cover: "https://covers.openlibrary.org/b/isbn/9781260462326-M.jpg",
    color: "#9D174D",
    edition: "26th Ed",
  },
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-amber-400 fill-current" : "text-gray-200 fill-current"}`} viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color: "#1C1C1E" }}>{rating}</span>
      <span className="text-xs" style={{ color: "#AEAEB2" }}>({count.toLocaleString()})</span>
    </div>
  );
}

export default function StudyHub() {
  const [examFilter, setExamFilter] = useState("All");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = examFilter === "All"
    ? platforms
    : platforms.filter(p => p.exams.includes(examFilter));

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(i => i !== id));
    } else if (compareIds.length < 3) {
      setCompareIds(prev => [...prev, id]);
    }
  };

  const comparePlatforms = platforms.filter(p => compareIds.includes(p.id));

  return (
    <div className="min-h-screen " style={{ background: "#F5F3EE" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <PageHero
        tag="Study Hub"
        title="Medical Exam Prep — Everything in One Place"
        subtitle="Compare top platforms for NEET PG, NEXT, FMGE & USMLE. AI-powered Medical Knowledge Hub."
        icon={<GraduationCap className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />}
      />

      {/* ── Compare Bar ──────────────────────────────────────────────── */}
      {compareIds.length > 0 && (
        <div className="sticky top-[72px] z-40" style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,194,168,0.25)", boxShadow: "0 2px 12px rgba(0,122,255,0.08)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#636366" }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: "#00C2A8" }} />
              <span>{compareIds.length}/3 platforms selected</span>
              <span style={{ color: "#AEAEB2" }}>{comparePlatforms.map(p => p.name).join(", ")}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCompareIds([])} className="text-sm hover:underline" style={{ color: "#AEAEB2" }}>Clear</button>
              <button onClick={() => setShowCompare(true)}
                className="px-4 py-2 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                Compare {compareIds.length} Platforms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare Modal ────────────────────────────────────────────── */}
      {showCompare && comparePlatforms.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCompare(false)} />
          <div className="relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)" }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
              <h3 className="text-xl font-bold" style={{ color: "#1C1C1E" }}>Platform Comparison</h3>
              <button onClick={() => setShowCompare(false)}
                className="p-2 rounded-xl transition-colors hover:bg-gray-100"
                style={{ color: "#636366" }}>✕</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
                    <th className="p-4 text-left text-sm font-medium" style={{ color: "#AEAEB2" }}>Feature</th>
                    {comparePlatforms.map(p => (
                      <th key={p.id} className="p-4 text-center">
                        <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center font-bold text-sm"
                          style={{ background: p.color + "18", border: `1px solid ${p.color}33`, color: p.color }}>
                          {p.logo}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: "#1C1C1E" }}>{p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Rating", key: "rating", render: (p: typeof platforms[0]) => <StarRating rating={p.rating} count={p.reviews} /> },
                    { label: "Monthly Price", key: "price", render: (p: typeof platforms[0]) => <span className="font-semibold" style={{ color: "#1C1C1E" }}>₹{p.monthlyPrice.toLocaleString()}</span> },
                    { label: "Annual Price", key: "annual", render: (p: typeof platforms[0]) => <span className="font-semibold" style={{ color: "#007AFF" }}>₹{p.annualPrice.toLocaleString()}</span> },
                    { label: "Exams Covered", key: "exams", render: (p: typeof platforms[0]) => (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {p.exams.map(e => (
                          <span key={e} className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{e}</span>
                        ))}
                      </div>
                    )},
                  ].map(row => (
                    <tr key={row.key} style={{ borderBottom: "1px solid rgba(60,60,67,0.06)" }}>
                      <td className="p-4 text-sm" style={{ color: "#636366" }}>{row.label}</td>
                      {comparePlatforms.map(p => (
                        <td key={p.id} className="p-4 text-center">{row.render(p)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Medical Knowledge Hub — FEATURED ─────────────────────────── */}
      <section className="py-12" style={{ background: "#0D1117" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.3)" }}>
                <Brain className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />
                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#00C2A8" }}>New — AI-Powered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: "#E6EDF3", letterSpacing: "-0.02em" }}>
                Medical Knowledge Hub
              </h2>
              <p className="text-sm mt-2 max-w-lg" style={{ color: "#8B949E" }}>
                The most complete medical reference ever built. Every subject, every department, every condition — with AI-generated encyclopedic content, MCQs, flashcards and diagrams.
              </p>
            </div>
            <Link href={`${BASE}/study-hub/medical-knowledge-hub`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shrink-0 transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", color: "#fff", boxShadow: "0 4px 16px rgba(0,194,168,0.3)" }}>
              Open Knowledge Hub
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {[
              { value: "20", label: "Medical Subjects" },
              { value: "500+", label: "Topics" },
              { value: "35+", label: "Departments" },
              { value: "1000+", label: "Conditions" },
              { value: "AI", label: "Generated Content" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center"
                style={{ background: "#161B22", border: "1px solid #21262D" }}>
                <div className="text-2xl font-extrabold mb-0.5" style={{ color: "#00C2A8" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "#8B949E" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Interactive search cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" style={{ position: "relative", zIndex: 10 }}>
            <HubSearchCard
              icon="📖"
              title="Encyclopedia Overview"
              desc="Search any topic or condition and open its full AI-generated reference — line-by-line with color-coded highlights."
              badge="Full Content"
              tab="overview"
              accentColor="#00C2A8"
            />
            <HubSearchCard
              icon="🎯"
              title="MCQ Practice"
              desc="Search a topic and jump straight to 8 NEET-PG / USMLE clinical vignette questions with detailed explanations."
              badge="NEET-PG · USMLE"
              tab="exam"
              accentColor="#F85149"
            />
            <HubSearchCard
              icon="⚡"
              title="Flashcard Revision"
              desc="Search any topic and open its 10 high-yield revision flashcards — drug of choice, gold standards, mnemonics."
              badge="Quick Revision"
              tab="flashcards"
              accentColor="#E3B341"
            />
          </div>

          {/* Subject quick-links */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#21262D" }}>
              <h3 className="font-bold text-sm" style={{ color: "#E6EDF3" }}>Browse by Subject</h3>
              <Link href={`${BASE}/study-hub/medical-knowledge-hub`} className="text-xs font-semibold" style={{ color: "#00C2A8" }}>
                View All →
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {[
                { icon: "🧬", name: "Anatomy", slug: "anatomy" },
                { icon: "⚡", name: "Physiology", slug: "physiology" },
                { icon: "💊", name: "Pharmacology", slug: "pharmacology" },
                { icon: "🔬", name: "Pathology", slug: "pathology" },
                { icon: "🦠", name: "Microbiology", slug: "microbiology" },
                { icon: "🩺", name: "Medicine", slug: "medicine" },
                { icon: "🔪", name: "Surgery", slug: "surgery" },
                { icon: "👶", name: "Paediatrics", slug: "paediatrics" },
                { icon: "🤱", name: "OBG", slug: "obstetrics-gynaecology" },
                { icon: "🧠", name: "Psychiatry", slug: "psychiatry" },
              ].map((s) => (
                <Link key={s.slug} href={`${BASE}/study-hub/medical-knowledge-hub/subjects/${s.slug}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:border-teal-500/40 hover:-translate-y-0.5"
                  style={{ background: "#0D1117", color: "#C9D1D9", border: "1px solid #30363D" }}>
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coaching Platforms ───────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: "#1C1C1E" }}>Coaching Platforms</h2>
              <p className="text-sm" style={{ color: "#636366" }}>Compare India's top medical coaching platforms side by side</p>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#AEAEB2" }}>
              <Filter className="w-4 h-4" />
              <span>Filter by exam:</span>
            </div>
          </div>

          {/* Exam Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {examFilters.map(exam => (
              <button key={exam} onClick={() => setExamFilter(exam)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={examFilter === exam ? {
                  background: "linear-gradient(135deg,#007AFF,#00C2A8)",
                  color: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,122,255,0.3)",
                  border: "1px solid transparent",
                } : {
                  background: "#FFFFFF",
                  border: "1px solid rgba(60,60,67,0.15)",
                  color: "#636366",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                {exam}
              </button>
            ))}
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map(platform => (
              <div key={platform.id}
                className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                style={{
                  background: "#FFFFFF",
                  border: compareIds.includes(platform.id)
                    ? "1.5px solid rgba(0,194,168,0.5)"
                    : "1px solid rgba(60,60,67,0.1)",
                  boxShadow: compareIds.includes(platform.id)
                    ? "0 4px 20px rgba(0,194,168,0.12)"
                    : "0 2px 8px rgba(0,0,0,0.05)",
                }}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden"
                        style={{ background: platform.color + "15", border: `1.5px solid ${platform.color}30`, color: platform.color }}>
                        <img
                          src={platform.logoUrl}
                          alt={platform.name}
                          className="w-10 h-10 object-contain"
                          onError={e => {
                            const img = e.currentTarget;
                            img.style.display = "none";
                            const parent = img.parentElement;
                            if (parent && !parent.querySelector(".logo-fallback")) {
                              const span = document.createElement("span");
                              span.className = "logo-fallback font-bold text-lg";
                              span.textContent = platform.logo;
                              parent.appendChild(span);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-lg font-bold" style={{ color: "#1C1C1E" }}>{platform.name}</h3>
                          {platform.badge && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: platform.badgeColor + "18", border: `1px solid ${platform.badgeColor}33`, color: platform.badgeColor }}>
                              {platform.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-1" style={{ color: "#636366" }}>{platform.tagline}</p>
                        <StarRating rating={platform.rating} count={platform.reviews} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
                        ₹{platform.monthlyPrice.toLocaleString()}
                        <span className="text-xs font-normal" style={{ color: "#AEAEB2" }}>/mo</span>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: "#007AFF" }}>
                        ₹{platform.annualPrice.toLocaleString()}
                        <span className="text-xs font-normal" style={{ color: "#AEAEB2" }}>/yr</span>
                      </div>
                    </div>
                  </div>

                  {/* Exams */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {platform.exams.map(exam => (
                      <span key={exam} className="px-2.5 py-0.5 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(0,122,255,0.07)", color: "#007AFF", border: "1px solid rgba(0,122,255,0.12)" }}>
                        {exam}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-1.5 mb-5">
                    {platform.features.slice(0, 4).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#636366" }}>
                        <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#00C2A8" }} />
                        {feat}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <a href={platform.link} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.2)", color: "#007AFF" }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,122,255,0.14)"}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,122,255,0.08)"}>
                      <ExternalLink className="w-4 h-4" />
                      Visit Platform
                    </a>
                    <button onClick={() => toggleCompare(platform.id)}
                      className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all"
                      style={compareIds.includes(platform.id) ? {
                        background: "rgba(0,194,168,0.1)",
                        border: "1px solid rgba(0,194,168,0.35)",
                        color: "#00A893",
                      } : {
                        background: "#F5F3EE",
                        border: "1px solid rgba(60,60,67,0.15)",
                        color: "#636366",
                        opacity: compareIds.length >= 3 && !compareIds.includes(platform.id) ? 0.4 : 1,
                      }}
                      disabled={compareIds.length >= 3 && !compareIds.includes(platform.id)}>
                      {compareIds.includes(platform.id) ? "✓ Selected" : "Compare"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Essential Books ───────────────────────────────────────────── */}
      <section className="py-14" style={{ borderTop: "1px solid rgba(60,60,67,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: "#1C1C1E" }}>Essential Medical Books</h2>
              <p className="text-sm" style={{ color: "#636366" }}>Standard textbooks trusted by top medical institutions</p>
            </div>
            <Link href="/shop?category=books"
              className="flex items-center gap-1.5 text-sm font-medium hover:underline"
              style={{ color: "#007AFF" }}>
              <BookOpen className="w-4 h-4" />
              Browse all books
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalBooks.map((book, i) => (
              <Link key={i} href={book.link}
                className="flex items-start gap-4 p-4 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${book.color}44`;
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 16px ${book.color}18`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(60,60,67,0.1)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                }}>
                {/* Book cover */}
                <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 relative"
                  style={{ border: `1px solid ${book.color}33`, background: `${book.color}10`, boxShadow: "2px 3px 8px rgba(0,0,0,0.15)" }}>
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const fb = img.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <div className="absolute inset-0 items-center justify-center hidden flex-col gap-0.5 p-1" style={{ background: `${book.color}15` }}>
                    <BookOpen className="w-5 h-5" style={{ color: book.color }} />
                    <span className="text-center text-[8px] font-bold leading-tight" style={{ color: book.color }}>{book.category}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm leading-snug mb-0.5 line-clamp-2" style={{ color: "#1C1C1E" }}>{book.title}</h4>
                  <p className="text-xs mb-1" style={{ color: "#AEAEB2" }}>{book.authors}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${book.color}12`, color: book.color }}>{book.category}</span>
                    <span className="text-xs font-medium" style={{ color: "#AEAEB2" }}>{book.edition}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#00C2A8" }}>₹{book.price.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── YouTube Resources ─────────────────────────────────────────── */}
      <section className="py-14" style={{ borderTop: "1px solid rgba(60,60,67,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#1C1C1E" }}>Free YouTube Resources</h2>
            <p className="text-sm" style={{ color: "#636366" }}>Top medical YouTube channels for learning — completely free</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeChannels.map((channel, i) => (
              <a key={i} href={channel.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:-translate-y-0.5 group"
                style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${channel.color}44`;
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 16px ${channel.color}18`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(60,60,67,0.1)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                }}>
                {/* Channel logo */}
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 relative"
                  style={{ border: `2px solid ${channel.color}33`, background: `${channel.color}18` }}>
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const fallback = img.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="absolute inset-0 items-center justify-center text-lg font-bold hidden"
                    style={{ color: channel.color }}>
                    {channel.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h4 className="font-bold text-sm" style={{ color: "#1C1C1E" }}>{channel.name}</h4>
                    {channel.badge && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                        style={{ background: `${channel.color}18`, border: `1px solid ${channel.color}44`, color: channel.color }}>
                        {channel.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-1.5 leading-relaxed" style={{ color: "#636366" }}>{channel.topic}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" style={{ color: "#AEAEB2" }} />
                      <span className="text-xs font-medium" style={{ color: "#AEAEB2" }}>{channel.subs}</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: channel.color }}>{channel.handle}</span>
                  </div>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: `${channel.color}18` }}>
                  <ArrowUpRight className="w-4 h-4" style={{ color: channel.color }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cadus AI CTA ─────────────────────────────────────────────── */}
      <section className="py-14" style={{ borderTop: "1px solid rgba(60,60,67,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top right, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-semibold text-white">Powered by Cadus AI</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Supercharge your prep with Cadus AI
              </h3>
              <p className="text-white/75 max-w-xl mx-auto mb-8">
                Generate MCQs, get DDx lists, analyze lab values, and get instant clinical references — all powered by AI specialized for Indian medical education.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/ai-assistant"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "#FFFFFF", color: "#007AFF" }}>
                  <Sparkles className="w-4 h-4" />
                  Try Cadus AI Free
                </Link>
                <Link href="/account"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#FFFFFF" }}>
                  <Crown className="w-4 h-4" />
                  View Pro Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
