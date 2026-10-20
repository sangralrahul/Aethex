/**
 * The Study Hub (/study-hub): search the Medical Knowledge Hub, Aethex's own
 * study tools, today's case, then outside resources (coaching platforms with a
 * side-by-side comparison, standard books, free YouTube channels).
 * Styles: src/shop.css (.ax-sth) and the light store header (.ax-sh).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, ArrowUpRight, BookOpen, Brain, CalendarDays, Check, CheckCircle2, ClipboardList, ExternalLink, Layers,
  ListChecks, Search, Sparkles, Stethoscope, Timer, Trophy, Users, X, type LucideProps,
} from "lucide-react";
import { cadusUrl } from "@/lib/host";
import { TopLayer } from "@/components/shop/TopLayer";
import { useSeo } from "@/hooks/use-seo";
import { medicalSubjects } from "@/data/medicalSubjects";
import { medicalDepartments } from "@/data/medicalDepartments";
import { getTodaysCase } from "@/data/clinicalCases";
import { BookCover, shortAuthors } from "@/components/store/BookCard";
import { useBooks } from "@/lib/store/api";
import { sortBooks } from "@/lib/store/books";
import type { Book } from "@/lib/store/types";
import { formatINR } from "@/lib/utils";

type Icon = ComponentType<LucideProps>;
const HUB = "/study-hub/medical-knowledge-hub";

type Hit = { label: string; sub: string; href: string; badge?: string; tone?: "ok" | "mid" | "hi" };

function buildIndex(tab: "overview" | "exam" | "flashcards"): Hit[] {
  const suffix = tab === "overview" ? "" : `?tab=${tab}`;
  const hits: Hit[] = [];
  medicalSubjects.forEach((s) => s.topics.forEach((t) => hits.push({
    label: t.name, sub: s.name, badge: t.difficulty, tone: t.difficulty === "Basic" ? "ok" : t.difficulty === "Intermediate" ? "mid" : "hi",
    href: `${HUB}/subjects/${s.slug}/${t.slug}${suffix}`,
  })));
  medicalDepartments.forEach((d) => d.conditions.forEach((c) => hits.push({
    label: c.name, sub: d.name, badge: c.severity, tone: c.severity === "Mild" ? "ok" : c.severity === "Moderate" ? "mid" : "hi",
    href: `${HUB}/departments/${d.slug}/${c.slug}${suffix}`,
  })));
  return hits;
}

/** Search box over the Knowledge Hub, with a results list under it. */
function HubSearch({ tab = "overview", placeholder, big = false }: { tab?: "overview" | "exam" | "flashcards"; placeholder: string; big?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const index = useMemo(() => buildIndex(tab), [tab]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return index.filter((h) => h.label.toLowerCase().includes(s) || h.sub.toLowerCase().includes(s)).slice(0, 7);
  }, [q, index]);
  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    const off = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);
  const go = (href: string) => { setOpen(false); setQ(""); setLocation(href); };
  return (
    <div className={`ax-hs${big ? " big" : ""}`} ref={ref}>
      <div className="box">
        <Search size={big ? 19 : 16} aria-hidden="true" />
        <input value={q} placeholder={placeholder} aria-label={placeholder}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].href); }
            if (e.key === "Escape") setOpen(false);
          }} />
        {q && <button type="button" onClick={() => { setQ(""); setOpen(false); }} aria-label="Clear"><X size={15} /></button>}
      </div>
      {open && q.trim().length >= 2 && (
        <div className="drop" role="listbox">
          {results.length === 0 ? <p className="none">No topic or condition matches "{q}".</p> : results.map((r, i) => (
            <button type="button" role="option" aria-selected={i === active} key={r.href} className={i === active ? "on" : ""} onMouseEnter={() => setActive(i)} onClick={() => go(r.href)}>
              <span><b>{r.label}</b><small>{r.sub}</small></span>
              {r.badge && <em className={r.tone}>{r.badge}</em>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TOOLS: { href: string; icon: Icon; t: string; d: string; tag?: string }[] = [
  { href: "/neet-pg", icon: Brain, t: "NEET-PG question bank", d: "Practice by subject with explanations", tag: "Popular" },
  { href: "/mock-test", icon: Timer, t: "Mock tests", d: "Timed papers in the exam pattern" },
  { href: "/flashcards", icon: Layers, t: "Flashcards", d: "High-yield facts with spaced revision" },
  { href: HUB, icon: BookOpen, t: "Medical Knowledge Hub", d: "Every subject, topic and condition" },
  { href: "/case-of-the-day", icon: ClipboardList, t: "Case of the day", d: "One new clinical case every day" },
  { href: "/study-planner", icon: CalendarDays, t: "Study planner", d: "A day-by-day plan to exam day" },
  { href: "/cases", icon: Stethoscope, t: "Clinical cases", d: "Work through cases step by step" },
  { href: "/leaderboard", icon: Trophy, t: "Leaderboard", d: "See where your scores stand" },
];

const SUBJECTS = ["anatomy", "physiology", "biochemistry", "pharmacology", "pathology", "microbiology", "forensic-medicine", "community-medicine", "medicine", "surgery", "paediatrics", "obstetrics-gynaecology", "orthopaedics", "ophthalmology", "ent", "psychiatry", "dermatology", "radiology", "anaesthesia"];

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

/** The best-known textbook for six core MBBS subjects, from the books catalogue (/books); the best ranked one if it isn't there. */
const BOOK_PICKS: [string, RegExp][] = [
  ["Anatomy", /Chaurasia's Human Anatomy, Vol\. 1/], ["Physiology", /^Guyton and Hall/], ["Biochemistry", /^Textbook of Biochemistry/],
  ["Pathology", /^Robbins & Cotran/], ["Pharmacology", /^Essentials of Medical Pharmacology/], ["Microbiology", /Ananthanarayan/],
];

function StandardBooks() {
  const { data: bs } = useBooks();
  const picks = useMemo(() => {
    if (!bs) return [];
    return BOOK_PICKS.map(([subject, known]) => {
      const all = bs.books.filter((b) => b.standard && b.placements.some((p) => p.group.startsWith("mbbs-") && p.subject === subject));
      const b = all.find((x) => known.test(x.title)) ?? sortBooks(all, "recommended")[0];
      return b ? { b, subject } : null;
    }).filter((x): x is { b: Book; subject: string } => !!x);
  }, [bs]);
  if (!bs) return <div className="ax-sth-books">{BOOK_PICKS.map(([s]) => <div key={s} className="book sk" />)}</div>;
  return (
    <div className="ax-sth-books">
      {picks.map(({ b, subject }) => {
        const priced = b.price !== null && !b.priceOnRequest;
        return (
          <Link key={b.id} href={`/books/${b.slug}`} className="book">
            <span className="cover"><BookCover book={b} publisher={bs.publisherName(b.publisher)} size="mini" /></span>
            <span className="tx">
              <b>{b.title}</b>
              <small>{[shortAuthors(b.authors), b.edition].filter(Boolean).join(" · ")}</small>
              <span className="meta"><em>{subject}</em><strong>{priced ? formatINR(Number(b.price)) : "Ask price"}</strong></span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}



/** Two-letter mark for a channel: the letters its avatar used, else its initials. */
function initials(c: { name: string; logo: string }) {
  try { const n = new URL(c.logo).searchParams.get("name"); if (n) return n.slice(0, 2).toUpperCase(); } catch { /* use the name */ }
  return c.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

function Rating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="ax-sth-rate"><b>★ {rating.toFixed(1)}</b> <em>({count.toLocaleString("en-IN")})</em></span>
  );
}

export default function StudyHub() {
  useSeo({
    title: "Study Hub — NEET-PG, NExT, FMGE & USMLE preparation | Aethex",
    description: "Question banks, mock tests, flashcards, a medical knowledge hub and a clinical case every day, plus a comparison of coaching platforms, books and free resources.",
    path: "/study-hub",
  });
  const [examFilter, setExamFilter] = useState("All");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [allPlats, setAllPlats] = useState(false);
  const todays = useMemo(() => getTodaysCase(), []);

  const stats = useMemo(() => ({
    subjects: medicalSubjects.length,
    topics: medicalSubjects.reduce((n, s) => n + s.topics.length, 0),
    departments: medicalDepartments.length,
    conditions: medicalDepartments.reduce((n, d) => n + d.conditions.length, 0),
  }), []);
  const subjects = useMemo(() => SUBJECTS.map((slug) => medicalSubjects.find((s) => s.slug === slug)).filter((s): s is (typeof medicalSubjects)[number] => !!s), []);

  const filtered = examFilter === "All" ? platforms : platforms.filter((p) => p.exams.includes(examFilter));
  const toggleCompare = (id: string) => setCompareIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev));
  const comparing = platforms.filter((p) => compareIds.includes(p.id));

  useEffect(() => {
    if (!showCompare) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setShowCompare(false); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [showCompare]);

  return (
    <div className={`ax-sth${compareIds.length ? " has-bar" : ""}`}>
      {/* hero */}
      <section className="ax-sth-hero">
        <div className="ax-wrap ax-sth-hero-in">
          <div className="ax-sth-hero-main">
            <nav className="ax-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><span aria-current="page">Study Hub</span></nav>
            <p className="ax-eyebrow">Study Hub</p>
            <h1>Prepare for NEET-PG and beyond</h1>
            <p className="lead">Question banks, mock tests, flashcards and a reference for every subject and condition — for NEET-PG, NExT, FMGE and USMLE.</p>
            <HubSearch big placeholder="Search any topic or condition" />
            <div className="ax-sth-exams">
              <span>Preparing for</span>
              <Link href="/neet-pg">NEET-PG</Link><Link href="/neet-pg">NExT</Link><Link href="/mock-test">FMGE</Link><Link href={HUB}>USMLE</Link>
            </div>
          </div>
          <Link href="/case-of-the-day" className="ax-sth-case">
            <span className="top"><span><ClipboardList size={15} /> Case of the day</span><em>{todays.specialty}</em></span>
            <b>{todays.title}</b>
            <p>{todays.patient_info.age}-year-old {String(todays.patient_info.gender).toLowerCase()}: {todays.patient_info.chief_complaint}</p>
            <span className="opts">{todays.options.slice(0, 4).map((o) => <span key={o.id}><i>{o.id}</i>{o.text}</span>)}</span>
            <span className="go">Solve today's case <ArrowRight size={16} /></span>
          </Link>
        </div>
      </section>

      {/* tools */}
      <section className="ax-wrap ax-sth-sec">
        <div className="ax-sth-head"><div><p className="ax-eyebrow">On Aethex</p><h2>Your study tools</h2></div></div>
        <div className="ax-sth-tools">
          {TOOLS.map(({ href, icon: I, t, d, tag }) => (
            <Link key={href} href={href}>
              <span className="ic"><I size={20} /></span>
              <span className="tx"><b>{t}{tag && <em>{tag}</em>}</b><small>{d}</small></span>
              <ArrowRight size={16} className="ar" />
            </Link>
          ))}
        </div>
      </section>

      {/* knowledge hub */}
      <section className="ax-sth-band">
        <div className="ax-wrap ax-sth-sec">
          <div className="ax-sth-head">
            <div><p className="ax-eyebrow">Medical Knowledge Hub</p><h2>Every subject, every condition</h2><p className="sub">A structured reference with explanations, exam questions and flashcards for each topic.</p></div>
            <Link href={HUB} className="ax-btn teal">Open the Knowledge Hub <ArrowRight size={16} /></Link>
          </div>
          <div className="ax-sth-stats">
            <div><b>{stats.subjects}</b><span>subjects</span></div>
            <div><b>{stats.topics.toLocaleString("en-IN")}</b><span>topics</span></div>
            <div><b>{stats.departments}</b><span>departments</span></div>
            <div><b>{stats.conditions.toLocaleString("en-IN")}</b><span>conditions</span></div>
          </div>
          <div className="ax-sth-modes">
            {([
              { tab: "overview", icon: BookOpen, t: "Read a topic", d: "The full reference for a topic or condition.", ph: "Find a topic" },
              { tab: "exam", icon: ListChecks, t: "Practise questions", d: "Clinical vignette MCQs with explanations.", ph: "Questions on…" },
              { tab: "flashcards", icon: Layers, t: "Revise with flashcards", d: "Drugs of choice, gold standards, mnemonics.", ph: "Flashcards for…" },
            ] as const).map((m) => (
              <div key={m.tab} className="mode">
                <span className="ic"><m.icon size={19} /></span>
                <b>{m.t}</b>
                <p>{m.d}</p>
                <HubSearch tab={m.tab} placeholder={m.ph} />
              </div>
            ))}
          </div>
          <div className="ax-sth-subjects">
            <span>Browse by subject</span>
            <div>
              {subjects.map((s) => <Link key={s.slug} href={`${HUB}/subjects/${s.slug}`}>{s.name}</Link>)}
              <Link href={HUB} className="all">All subjects →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* coaching platforms */}
      <section className="ax-wrap ax-sth-sec">
        <div className="ax-sth-head">
          <div><p className="ax-eyebrow">Outside Aethex</p><h2>Coaching platforms</h2><p className="sub">Compare popular platforms side by side. Prices and ratings are indicative; check each platform for current plans.</p></div>
        </div>
        <div className="ax-chips ax-sth-filter" role="list" aria-label="Filter by exam">
          {examFilters.map((e) => <button type="button" role="listitem" key={e} className={examFilter === e ? "on" : ""} onClick={() => setExamFilter(e)}>{e}</button>)}
        </div>
        <div className="ax-sth-plats">
          {(allPlats ? filtered : filtered.slice(0, 6)).map((p) => {
            const picked = compareIds.includes(p.id);
            return (
              <article key={p.id} className={`plat${picked ? " picked" : ""}`}>
                <div className="hd">
                  <span className="logo" style={{ color: p.color, background: `${p.color}14`, borderColor: `${p.color}33` }}>{p.logo}</span>
                  <div className="nm"><b>{p.name}{p.badge && <em style={{ color: p.badgeColor, background: `${p.badgeColor}14` }}>{p.badge}</em>}</b><small>{p.tagline}</small><Rating rating={p.rating} count={p.reviews} /></div>
                  <div className="pr"><b>₹{p.monthlyPrice.toLocaleString("en-IN")}<small>/mo</small></b><span>₹{p.annualPrice.toLocaleString("en-IN")}/yr</span></div>
                </div>
                <div className="ex">{p.exams.map((e) => <span key={e}>{e}</span>)}</div>
                <ul>{p.features.slice(0, 4).map((f) => <li key={f}><Check size={14} /> {f}</li>)}</ul>
                <div className="ft">
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="ax-btn">Visit site <ExternalLink size={15} /></a>
                  <button type="button" className={`ax-btn${picked ? " teal" : ""}`} onClick={() => toggleCompare(p.id)} disabled={!picked && compareIds.length >= 3} aria-pressed={picked}>
                    {picked ? <><Check size={15} /> Comparing</> : "Compare"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!allPlats && filtered.length > 6 && (
          <div className="ax-sth-more"><button type="button" className="ax-btn" onClick={() => setAllPlats(true)}>Show all {filtered.length} platforms</button></div>
        )}
      </section>

      {/* books */}
      <section className="ax-sth-band">
        <div className="ax-wrap ax-sth-sec">
          <div className="ax-sth-head">
            <div><p className="ax-eyebrow">Standard books</p><h2>Essential medical books</h2></div>
            <Link href="/books" className="ax-link">All medical books <ArrowRight size={16} /></Link>
          </div>
          <StandardBooks />
        </div>
      </section>

      {/* youtube */}
      <section className="ax-wrap ax-sth-sec">
        <div className="ax-sth-head"><div><p className="ax-eyebrow">Free resources</p><h2>YouTube channels worth following</h2></div></div>
        <div className="ax-sth-yt">
          {youtubeChannels.map((c) => (
            <a key={c.handle} href={c.url} target="_blank" rel="noopener noreferrer">
              <span className="av" style={{ background: c.color }}>{initials(c)}</span>
              <span className="tx"><b>{c.name}{c.badge && <em style={{ color: c.color, background: `${c.color}14` }}>{c.badge}</em>}</b><small>{c.topic}</small><span className="meta"><Users size={13} /> {c.subs} · {c.handle}</span></span>
              <ArrowUpRight size={17} className="ar" />
            </a>
          ))}
        </div>
      </section>

      {/* Cadus */}
      <section className="ax-wrap ax-sth-sec">
        <div className="ax-sth-cadus">
          <div>
            <p className="tag"><Sparkles size={14} /> Cadus AI</p>
            <h2>Stuck on a topic? Ask Cadus.</h2>
            <p>Explanations with sources, differentials, drug doses and practice questions — in seconds.</p>
          </div>
          <a href={cadusUrl("/")} className="ax-btn teal lg"><Sparkles size={18} /> Try Cadus AI</a>
        </div>
      </section>

      {/* compare bar + table */}
      <TopLayer>
      {compareIds.length > 0 && (
        <div className="ax-sth-cbar" role="region" aria-label="Comparison">
          <div className="ax-wrap">
            <span><CheckCircle2 size={17} /> {compareIds.length} of 3 selected <em>{comparing.map((p) => p.name).join(", ")}</em></span>
            <button type="button" className="ax-btn ghost" onClick={() => setCompareIds([])}>Clear</button>
            <button type="button" className="ax-btn teal" onClick={() => setShowCompare(true)} disabled={compareIds.length < 2}>Compare {compareIds.length}</button>
          </div>
        </div>
      )}
      {showCompare && comparing.length > 0 && (
        <div className="ax-sth-modal" role="dialog" aria-modal="true" aria-label="Platform comparison" onClick={() => setShowCompare(false)}>
          <div className="in" onClick={(e) => e.stopPropagation()}>
            <div className="hd"><h2>Compare platforms</h2><button type="button" onClick={() => setShowCompare(false)} aria-label="Close"><X size={18} /></button></div>
            <div className="tbl">
              <table>
                <thead><tr><th>Platform</th>{comparing.map((p) => <th key={p.id}><span className="logo" style={{ color: p.color, background: `${p.color}14` }}>{p.logo}</span>{p.name}</th>)}</tr></thead>
                <tbody>
                  <tr><td>Rating</td>{comparing.map((p) => <td key={p.id}><Rating rating={p.rating} count={p.reviews} /></td>)}</tr>
                  <tr><td>Monthly</td>{comparing.map((p) => <td key={p.id}>₹{p.monthlyPrice.toLocaleString("en-IN")}</td>)}</tr>
                  <tr><td>Yearly</td>{comparing.map((p) => <td key={p.id}>₹{p.annualPrice.toLocaleString("en-IN")}</td>)}</tr>
                  <tr><td>Exams</td>{comparing.map((p) => <td key={p.id}>{p.exams.join(", ")}</td>)}</tr>
                  <tr><td>Good at</td>{comparing.map((p) => <td key={p.id}>{p.pros.join(", ")}</td>)}</tr>
                  <tr><td>Watch out for</td>{comparing.map((p) => <td key={p.id}>{p.cons.join(", ")}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <p className="note">Indicative prices and ratings; check each platform for current plans.</p>
          </div>
        </div>
      )}
      </TopLayer>
    </div>
  );
}
