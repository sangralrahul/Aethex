import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, Menu, Sparkles, User, Star, MapPin, ShieldCheck, ChevronDown, Store, BookOpen, Newspaper, Crown, GraduationCap, LogOut, Settings, Package, X, Brain, Stethoscope, FlaskConical, Pill, Activity, Building2, GraduationCap as University, HeartPulse, Microscope, FileText, Syringe, Database, BadgeCheck, Calculator, Briefcase, MessageSquare, Smartphone, Bell, HeadphonesIcon, Megaphone, Download, Gift, ClipboardList, MoreHorizontal, Mic, MicOff, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";

function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stop = () => { recRef.current?.stop(); setListening(false); };
  return { listening, start, stop };
}

import { useGetCart } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useAbandonedCartTracker } from "@/hooks/use-abandoned-cart-tracker";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { AuthModal } from "@/components/AuthModal";

const TICKER_ITEMS = [
  "🇮🇳  India's No. 1 Medical Platform",
  "40,000+ Verified Doctors",
  "NMC · CDSCO Compliant",
  "Free Shipping on ₹499+",
  "7-Day Easy Returns",
  "20+ AI Clinical Modes",
  "Pan-India 2-Day Delivery",
  "100% Original Products",
  "12,000+ Subscribers",
  "Trusted by AIIMS Alumni",
];

export function BrandSwitcherBar() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      data-brand-switcher
      className="no-print w-full overflow-hidden"
      style={{ background: "#F0EDE8", borderBottom: "1px solid rgba(0,0,0,0.06)", height: 28 }}
    >
      <div className="h-full flex items-center"
        style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)" }}>
        <div className="ticker-track flex items-center" style={{ gap: 0 }}>
          {doubled.map((item, i) => (
            <span key={i} className="shrink-0 flex items-center">
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10,
                color: "rgba(0,0,0,0.45)",
                letterSpacing: "0.1em",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}>{item}</span>
              <span style={{ color: "rgba(0,0,0,0.15)", margin: "0 32px" }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const clinicalToolsMenu = [
  { href: "/tools/prescription", icon: FileText, label: "Prescription Writer", desc: "AI-powered Rx generator", color: "#007AFF" },
  { href: "/drug-interaction-checker", icon: Pill, label: "Drug Interactions", desc: "Check drug safety instantly", color: "#F59E0B" },
  { href: "/tools/dosage-calculator", icon: FlaskConical, label: "Dosage Calculator", desc: "Weight-based dose calculator", color: "#10B981" },
  { href: "/tools/differential-diagnosis", icon: Brain, label: "Differential Diagnosis", desc: "AI symptom analysis", color: "#8B5CF6" },
  { href: "/tools/lab-interpreter", icon: Microscope, label: "Lab Interpreter", desc: "Interpret investigation results", color: "#EF4444" },
  { href: "/tools/procedure-guide", icon: Syringe, label: "Procedure Guide", desc: "Step-by-step clinical procedures", color: "#06B6D4" },
];

const calculatorsMenu = [
  { id: "bmi", name: "Body Mass Index (BMI)" },
  { id: "egfr-ckd-epi", name: "eGFR (CKD-EPI 2021)" },
  { id: "curb65", name: "CURB-65 Pneumonia" },
  { id: "sofa", name: "SOFA Score (ICU)" },
  { id: "cha2ds2-vasc", name: "CHA₂DS₂-VASc Score" },
  { id: "child-pugh", name: "Child-Pugh Score" },
  { id: "wells-dvt", name: "Wells Score for DVT" },
  { id: "gcs", name: "Glasgow Coma Scale" },
  { id: "apgar", name: "APGAR Score" },
  { id: "qtc", name: "Corrected QT (QTc)" },
  { id: "anion-gap", name: "Anion Gap" },
  { id: "grace", name: "GRACE Score (ACS)" },
  { id: "heart-score", name: "HEART Score" },
  { id: "centor", name: "Centor Score" },
  { id: "parkland", name: "Parkland Formula (Burns)" },
  { id: "nihss", name: "NIH Stroke Scale" },
  { id: "bsa", name: "Body Surface Area (BSA)" },
  { id: "iv-fluid", name: "IV Fluid (Holliday-Segar)" },
  { id: "osmolality", name: "Serum Osmolality" },
  { id: "psi-port", name: "PSI / PORT Score" },
  { id: "wells-pe", name: "Wells Score for PE" },
];

const communityMenu = [
  { href: "/cases", icon: Stethoscope, label: "Clinical Case Library", desc: "10 cases with diagnosis reveal", color: "#EF4444" },
  { href: "/community", icon: MessageSquare, label: "Doctor Community", desc: "Peer forum — cases, NEET-PG, drugs", color: "#8B5CF6" },
  { href: "/jobs", icon: Briefcase, label: "Medical Jobs Board", desc: "20 hospital & clinic listings", color: "#10B981" },
];

function ToolsMegaMenu({ open, onToggle, onClose, dropdownRef }: {
  open: boolean; onToggle: () => void; onClose: () => void; dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [location] = useLocation();
  const active = location === "/tools" || location.startsWith("/tools/") || location === "/calculator";

  return (
    <div ref={dropdownRef} className="relative h-full flex items-center">
      <button onClick={onToggle}
        className="h-full flex items-center gap-1.5 px-3 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap"
        style={{ color: active || open ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.5)", letterSpacing: "0.03em" }}>
        <Stethoscope className="w-3.5 h-3.5 shrink-0" />
        Clinical Tools
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="fixed z-50 rounded-2xl overflow-hidden"
          style={{ top: 142, right: 24, width: 740, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)" }}>
          <div className="flex divide-x" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            <div className="flex-shrink-0 w-72 p-3 flex flex-col gap-0.5 bg-gray-50/60">
              <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>Clinical Tools</p>
                <Link href="/tools" onClick={onClose} className="text-[10px] font-semibold" style={{ color: "#00C2A8" }}>View all →</Link>
              </div>
              {clinicalToolsMenu.map(item => (
                <Link key={item.href} href={item.href} onClick={onClose}
                  className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white"
                  style={{ background: "transparent" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight" style={{ color: "rgba(0,0,0,0.85)" }}>{item.label}</p>
                    <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.4)" }}>{item.desc}</p>
                  </div>
                </Link>
              ))}
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 mb-1" style={{ color: "rgba(0,0,0,0.35)" }}>Community &amp; Careers</p>
                {communityMenu.map(item => (
                  <Link key={item.href} href={item.href} onClick={onClose}
                    className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all hover:bg-white">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight" style={{ color: "rgba(0,0,0,0.85)" }}>{item.label}</p>
                      <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.4)" }}>{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex-1 p-3">
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>Medical Calculators</p>
                <Link href="/calculator" onClick={onClose} className="text-[10px] font-semibold" style={{ color: "#00C2A8" }}>View all →</Link>
              </div>
              <div className="grid grid-cols-2 gap-px">
                {calculatorsMenu.map((calc) => (
                  <Link key={calc.id} href={`/calculator?id=${calc.id}`} onClick={onClose}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs hover:bg-gray-50"
                    style={{ color: "rgba(0,0,0,0.6)", fontWeight: 400 }}>
                    <Calculator className="w-3 h-3 shrink-0" style={{ color: "rgba(0,0,0,0.28)" }} />
                    {calc.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const institutionsMenu = [
  { href: "/colleges", icon: University, label: "Medical Colleges", desc: "MBBS, MD, MS admissions", color: "#007AFF" },
  { href: "/hospitals", icon: Building2, label: "Hospitals", desc: "Top hospitals & networks", color: "#EF4444" },
  { href: "/institutions?type=pg-entrance", icon: GraduationCap, label: "PG Entrance", desc: "NEET PG, NEXT coaching", color: "#F59E0B" },
  { href: "/institutions?type=research", icon: Microscope, label: "Research Institutes", desc: "ICMR, AIIMS, CMC & more", color: "#8B5CF6" },
  { href: "/institutions?type=nursing", icon: HeartPulse, label: "Nursing Colleges", desc: "BSc, MSc Nursing programs", color: "#10B981" },
  { href: "/institutions?type=pharmacy", icon: Pill, label: "Pharmacy Colleges", desc: "B.Pharm, Pharm.D programs", color: "#06B6D4" },
];

function InstitutionsDropdown({ open, onToggle, onClose, dropdownRef }: {
  open: boolean; onToggle: () => void; onClose: () => void; dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [location] = useLocation();
  const active = location === "/institutions" || location.startsWith("/institutions") || location === "/colleges" || location === "/hospitals";

  return (
    <div ref={dropdownRef} className="relative h-full flex items-center shrink-0">
      <button onClick={onToggle}
        className="h-full flex items-center gap-1.5 px-3 text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap"
        style={{ color: active || open ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.5)", letterSpacing: "0.03em" }}>
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        Institutions
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="fixed z-50 rounded-2xl overflow-hidden"
          style={{ top: 142, right: 24, width: 480, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
          <div className="px-4 pt-3 pb-2 bg-gray-50/70" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>Colleges &amp; Hospitals</p>
          </div>
          <div className="p-3 grid grid-cols-2 gap-1">
            {institutionsMenu.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "rgba(0,0,0,0.85)" }}>{item.label}</p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(0,0,0,0.4)" }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-4 py-2.5 bg-gray-50/70" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <Link href="/institutions" onClick={onClose} className="text-xs font-semibold" style={{ color: "#00C2A8" }}>
              View all Colleges &amp; Hospitals →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const loginMenuItems = [
  { href: "/account", icon: User, label: "My Profile" },
  { href: "/pricing", icon: Crown, label: "Cadus AI Pro" },
  { href: "/orders", icon: Package, label: "My Orders" },
  { href: "/cme-hub", icon: GraduationCap, label: "My CME Certificates" },
  { href: "/verification", icon: BadgeCheck, label: "Doctor Verification Badge" },
  { href: "/my-reviews", icon: Star, label: "My Reviews" },
  { href: "/orders/track", icon: MapPin, label: "Track Order" },
  { href: "/contact", icon: HeadphonesIcon, label: "24x7 Customer Care" },
  { href: "/enterprise", icon: Megaphone, label: "Advertise on Aethex" },
  { href: "/app", icon: Download, label: "Download App" },
];

const categories = [
  { href: "/", icon: Star, label: "For You", exact: true },
  { href: "/shop", icon: Store, label: "Shop" },
  { href: "/books", icon: BookOpen, label: "Books" },
  { href: "/study-hub", icon: GraduationCap, label: "Study Hub" },
  { href: "/cme-hub", icon: Crown, label: "CME Hub" },
  { href: "/neet-pg", icon: FileText, label: "NEET-PG" },
  { href: "/drug-reference", icon: Pill, label: "Drug Ref" },
  { href: "/ai-assistant", icon: Brain, label: "Cadus AI" },
  { href: "/pricing", icon: Crown, label: "Pricing" },
  { href: "/calculator", icon: Calculator, label: "Calculators" },
  { href: "/cases", icon: Activity, label: "Cases" },
  { href: "/community", icon: MessageSquare, label: "Community" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/blog", icon: Newspaper, label: "Blog" },
  { href: "/news", icon: Megaphone, label: "News" },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const sessionId = useSession();
  const { user, isLoggedIn, isPro, logout } = useUserAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [institutionsOpen, setInstitutionsOpen] = useState(false);
  const [activeTabLeft, setActiveTabLeft] = useState<number | null>(null);
  const [activeTabWidth, setActiveTabWidth] = useState<number>(0);
  const catBarRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const institutionsRef = useRef<HTMLDivElement>(null);
  const { listening: voiceListening, start: startVoice, stop: stopVoice } = useVoiceSearch((text) => {
    setSearchQuery(text);
    setLocation(`/shop?search=${encodeURIComponent(text)}`);
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
      if (institutionsRef.current && !institutionsRef.current.contains(e.target as Node)) setInstitutionsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const bar = catBarRef.current;
    if (!bar) return;
    const activeEl = bar.querySelector("[data-active-tab='true']") as HTMLElement | null;
    if (activeEl) {
      const barRect = bar.getBoundingClientRect();
      const el = activeEl.getBoundingClientRect();
      setActiveTabLeft(el.left - barRect.left + bar.scrollLeft);
      setActiveTabWidth(el.width);
    } else {
      setActiveTabLeft(null);
    }
  }, [location]);

  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, staleTime: 1000 * 60 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const openLogin = () => { setAccountOpen(false); setMobileOpen(false); setLocation("/login"); };
  const openSignup = () => { setAccountOpen(false); setMobileOpen(false); setLocation("/signup"); };

  const cartCount = cart?.itemCount ?? 0;

  return (
    <>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── MAIN HEADER ── */}
      <header
        className="no-print transition-all duration-300"
        style={{
          background: isScrolled ? "rgba(250,249,246,0.98)" : "rgba(250,249,246,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          height: 68,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          boxShadow: isScrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">

            {/* ── LOGO ── */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative">
                <img
                  src={`${import.meta.env.BASE_URL}aethex-logo.jpg`}
                  alt="Aethex"
                  className="w-8 h-8 rounded-lg object-contain transition-all group-hover:scale-105"
                  style={{ filter: "brightness(1.05) contrast(1.1)" }}
                />
              </div>
              {/* Animated logo text */}
              <span className="aethex-logo-text" style={{
                fontFamily: "'Pinyon Script', 'Great Vibes', cursive",
                fontWeight: 400,
                fontSize: 36,
                lineHeight: 1.4,
                letterSpacing: "0.01em",
                display: "block",
              }}>
                Aethex
              </span>
            </Link>

            {/* Separator */}
            <div className="hidden lg:block h-6 w-px shrink-0" style={{ background: "rgba(0,0,0,0.1)" }} />

            {/* ── SEARCH BAR ── */}
            <form onSubmit={handleSearch} className="flex-1 relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5" style={{ color: "rgba(0,0,0,0.3)" }} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-10 py-2.5 text-sm focus:outline-none transition-all"
                style={{
                  background: "rgba(0,0,0,0.04)",
                  color: "#1a1a1a",
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  borderRadius: 999,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13,
                }}
                onFocus={e => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "rgba(0,194,168,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,194,168,0.08)";
                }}
                onBlur={e => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Search drugs, products, books, calculators…"
              />
              <button type="button" onClick={voiceListening ? stopVoice : startVoice}
                className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Mic className="h-3.5 w-3.5" style={{ color: voiceListening ? "#ef4444" : "rgba(0,0,0,0.28)" }} />
              </button>
            </form>

            {/* ── RIGHT ACTIONS ── */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Try Cadus AI — teal CTA */}
              <Link href="/ai-assistant"
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97] shrink-0"
                style={{
                  background: "#00C2A8",
                  color: "#FFFFFF",
                  letterSpacing: "0.01em",
                  boxShadow: "0 2px 12px rgba(0,194,168,0.28)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                <Sparkles className="w-3.5 h-3.5" />
                Try Cadus AI
              </Link>

              {/* Notification bell */}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              {/* Account */}
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:bg-black/5"
                  style={{ color: "rgba(0,0,0,0.75)" }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: isLoggedIn ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.06)",
                      border: `1px solid ${isLoggedIn ? "rgba(0,122,255,0.2)" : "rgba(0,0,0,0.1)"}`,
                    }}>
                    <User className="w-3.5 h-3.5" style={{ color: isLoggedIn ? "#007AFF" : "rgba(0,0,0,0.55)" }} />
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold" style={{ color: "rgba(0,0,0,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {isLoggedIn ? (user?.name?.split(" ")[0] || "Account") : "Sign In"}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${accountOpen ? "rotate-180" : ""}`} style={{ color: "rgba(0,0,0,0.3)" }} />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-64 z-[70] rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
                    {!isLoggedIn ? (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <span className="text-sm" style={{ color: "rgba(0,0,0,0.45)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New here?</span>
                        <button onClick={openSignup} className="text-sm font-bold" style={{ color: "#00C2A8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create Account</button>
                      </div>
                    ) : (
                      <div className="px-4 py-3.5 bg-gray-50" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{user?.name}</p>
                          {user?.verified && <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#007AFF" }} />}
                        </div>
                        <p className="text-xs truncate" style={{ color: "rgba(0,0,0,0.4)" }}>{user?.email}</p>
                        {isPro && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255,180,0,0.1)", color: "#D97706", border: "1px solid rgba(255,180,0,0.2)" }}>
                            <Crown className="w-3 h-3" /> PRO Member
                          </span>
                        )}
                      </div>
                    )}

                    <div className="py-1">
                      {loginMenuItems.map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                          style={{ color: "rgba(0,0,0,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <Icon className="w-4 h-4 shrink-0" style={{ color: "rgba(0,0,0,0.3)" }} />
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      {isLoggedIn ? (
                        <button onClick={() => { logout(); setAccountOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-red-50"
                          style={{ color: "#DC2626" }}>
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      ) : (
                        <button onClick={openLogin}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-blue-50"
                          style={{ color: "#007AFF" }}>
                          <User className="w-4 h-4" /> Sign In
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <WishlistNavIcon />

              {/* Cart */}
              <Link href="/cart"
                className="flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:bg-black/5 relative"
                style={{ color: "rgba(0,0,0,0.7)" }}>
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[17px] h-[17px] px-0.5 text-[9px] font-bold text-white rounded-full flex items-center justify-center leading-none" style={{ background: "#007AFF" }}>
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(0,0,0,0.7)" }}>Cart</span>
              </Link>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(o => !o)}
                className="sm:hidden p-2 rounded-full transition-all hover:bg-black/5"
                style={{ color: "rgba(0,0,0,0.7)" }}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── THIN ACCENT LINE ── */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(0,194,168,0.25) 30%, rgba(0,0,0,0.05) 50%, rgba(0,194,168,0.25) 70%, transparent 100%)" }} />

      {/* ── CATEGORY TAB BAR ── */}
      <div
        data-category-bar
        className="no-print overflow-x-auto relative"
        style={{
          background: "rgba(250,249,246,0.98)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          scrollbarWidth: "none",
          height: 44,
        }}
        ref={catBarRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-full gap-0 relative">

          {/* Sliding active indicator */}
          {activeTabLeft !== null && (
            <div className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 pointer-events-none"
              style={{
                left: activeTabLeft + 12,
                width: Math.max(0, activeTabWidth - 24),
                background: "#00C2A8",
                boxShadow: "0 0 8px rgba(0,194,168,0.5)",
              }}
            />
          )}

          {categories.map((cat) => {
            const active = cat.exact
              ? location === cat.href
              : location === cat.href || location.startsWith(cat.href + "/");
            const Icon = cat.icon;
            return (
              <Link key={cat.href} href={cat.href}
                data-active-tab={active ? "true" : "false"}
                className="flex items-center gap-1.5 px-3 h-full shrink-0 text-[11px] font-semibold transition-colors whitespace-nowrap"
                style={{
                  color: active ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.42)",
                  letterSpacing: "0.03em",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(0,0,0,0.72)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(0,0,0,0.42)"; }}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.label}</span>
              </Link>
            );
          })}

          {isLoggedIn && <div className="h-4 w-px mx-2 shrink-0" style={{ background: "rgba(0,0,0,0.1)" }} />}

          {isLoggedIn && (
            <ToolsMegaMenu open={toolsOpen} onToggle={() => setToolsOpen(o => !o)} onClose={() => setToolsOpen(false)} dropdownRef={toolsRef} />
          )}
          {isLoggedIn && (
            <InstitutionsDropdown open={institutionsOpen} onToggle={() => setInstitutionsOpen(o => !o)} onClose={() => setInstitutionsOpen(false)} dropdownRef={institutionsRef} />
          )}
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 overflow-y-auto"
          style={{ top: 137, background: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-1">
            <form onSubmit={e => { handleSearch(e); setMobileOpen(false); }} className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm focus:outline-none"
                style={{ background: "rgba(0,0,0,0.05)", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1a1a1a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                placeholder="Search drugs, products, books…" />
            </form>

            <Link href="/ai-assistant" onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold mb-3"
              style={{ background: "#00C2A8", color: "#FFFFFF", boxShadow: "0 4px 16px rgba(0,194,168,0.28)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Sparkles className="w-4 h-4" /> Try Cadus AI
            </Link>

            <p className="text-[10px] font-bold uppercase tracking-widest px-1 pt-1 pb-1.5" style={{ color: "rgba(0,0,0,0.3)", letterSpacing: "0.14em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Navigation</p>
            {[
              { href: "/shop", label: "Shop All Products", icon: Store },
              { href: "/books", label: "Medical Books", icon: BookOpen },
              { href: "/study-hub", label: "Study Hub", icon: GraduationCap },
              { href: "/cme-hub", label: "CME Hub", icon: Crown },
              { href: "/neet-pg", label: "NEET-PG", icon: FileText },
              { href: "/drug-reference", label: "Drug Reference", icon: Pill },
              { href: "/drug-interaction-checker", label: "Drug Interactions", icon: FlaskConical },
              { href: "/calculator", label: "Medical Calculators", icon: Calculator },
              { href: "/cases", label: "Clinical Case Library", icon: Stethoscope },
              { href: "/community", label: "Doctor Community", icon: MessageSquare },
              { href: "/jobs", label: "Medical Jobs Board", icon: Briefcase },
              { href: "/news", label: "Medical News", icon: Newspaper },
              { href: "/pricing", label: "Pricing", icon: Crown },
              { href: "/institutions", label: "Colleges & Hospitals", icon: Building2 },
            ].map(item => {
              const active = location === item.href || location.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-xl transition-all"
                  style={{
                    color: active ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.6)",
                    background: active ? "rgba(0,194,168,0.06)" : "transparent",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                  <Icon className="w-4 h-4 shrink-0" style={{ color: active ? "#00C2A8" : "rgba(0,0,0,0.3)" }} />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 mt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {isLoggedIn ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3.5 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,122,255,0.1)", border: "1px solid rgba(0,122,255,0.2)" }}>
                      <User className="w-4 h-4" style={{ color: "#007AFF" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1a1a" }}>{user?.name}</p>
                      <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 text-sm rounded-xl"
                    style={{ color: "#DC2626", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { openLogin(); setMobileOpen(false); }}
                    className="flex-1 py-3 text-sm font-semibold rounded-xl"
                    style={{ color: "rgba(0,0,0,0.75)", background: "rgba(0,0,0,0.06)", border: "1.5px solid rgba(0,0,0,0.08)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Sign In
                  </button>
                  <button onClick={() => { openSignup(); setMobileOpen(false); }}
                    className="flex-1 py-3 text-sm font-bold rounded-xl"
                    style={{ color: "#FFFFFF", background: "#00C2A8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Sign Up Free
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WishlistNavIcon() {
  const { count } = useWishlist();
  return (
    <Link href="/wishlist"
      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:bg-black/5 relative"
      style={{ color: "rgba(0,0,0,0.7)" }}>
      <div className="relative">
        <Heart className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[17px] h-[17px] px-0.5 text-[9px] font-bold text-white rounded-full flex items-center justify-center leading-none" style={{ background: "#EF4444" }}>
            {count}
          </span>
        )}
      </div>
      <span className="hidden lg:inline text-sm font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "rgba(0,0,0,0.7)" }}>Wishlist</span>
    </Link>
  );
}
