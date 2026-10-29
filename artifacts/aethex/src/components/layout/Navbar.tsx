/**
 * The aethex.in header: logo, five sections (Shop, Study, Tools, Cadus,
 * More) with tidy drop-downs, search, wishlist, cart and account. On phones
 * the sections open in a full-screen menu. Styles: src/site.css (ax-*).
 */
import { SearchResults } from "@/components/shop/SearchResults";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, BadgeCheck, BookOpen, Bone, Brain, Briefcase, Building2, Calculator, ChevronDown, ClipboardList, Download, Droplet, FileText,
  FlaskConical, GraduationCap, HeartPulse, Heart, Hospital, Layers, LogOut, Mail, Menu, MessageSquare, Microscope,
  Newspaper, Package, Pill, Search, ShoppingBag, ShoppingCart, Sparkles, Star, Stethoscope, Store, Thermometer,
  Timer, User, Wind, X, type LucideProps,
} from "lucide-react";
import { useCartCount } from "@/lib/store/cart";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAbandonedCartTracker } from "@/hooks/use-abandoned-cart-tracker";
import CadusMark from "@/components/cadus/CadusMark";
import { cadusUrl, currentPortal, downloadsUrl, loginUrl, mainUrl, portalUrl, type Portal } from "@/lib/host";

/** The portal switcher: [portal, label, path on that portal]. */
const PORTAL_LINKS: ["hub" | Portal, string, string][] = [
  ["hub", "Aethex", "/"], ["doctors", "Doctors", "/"], ["store", "Store", "/"], ["cadus", "Cadus", "/"],
  ["study", "Study", "/"], ["hospitals", "Hospitals", "/"], ["medicalcolleges", "Medical colleges", "/"],
];
/** Which portal this page belongs to: the subdomain, or (on aethex.in) the page's section. */
function activePortal(path: string): "hub" | Portal {
  const p = currentPortal();
  if (p) return p;
  if (/^\/(find|doctors?|appointments|practice|list-your-practice|clinics?|ask|articles|records|prescription)(\/|$)/.test(path)) return "doctors";
  if (/^\/(store|shop|products|category|brand|brands|books|cart|wishlist|compare|orders?)(\/|$)/.test(path)) return "store";
  if (/^\/(study-hub|neet-pg|mock-test|flashcards|case-of-the-day|cme-hub|tools|calculator|drug-reference)(\/|$)/.test(path)) return "study";
  if (/^\/(hospitals|institutions)(\/|$)/.test(path)) return "hospitals";
  if (/^\/medical-colleges(\/|$)/.test(path)) return "medicalcolleges";
  return "hub";
}
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";

type Icon = ComponentType<LucideProps>;
type Item = { href: string; label: string; hint?: string; icon: Icon; external?: boolean };
type Section = { id: string; label: string; match: RegExp; items: Item[]; cols?: number; foot?: { text: string; href: string; label: string } };

const SECTIONS: Section[] = [
  {
    id: "shop", label: "Shop", match: /^\/(shop|products|category|brand|brands|books|wishlist|cart|checkout|order)/, cols: 2,
    items: [
      { href: "/category/bp-monitors", label: "BP monitors", hint: "OMRON, Dr Trust, Rossmax", icon: HeartPulse },
      { href: "/category/stethoscopes", label: "Stethoscopes", hint: "Littmann, MDF, HEINE", icon: Stethoscope },
      { href: "/category/diagnostic-instruments", label: "Diagnostic instruments", hint: "Otoscopes, ophthalmoscopes", icon: Activity },
      { href: "/category/diabetes-care", label: "Diabetes care", hint: "Accu-Chek, Dr Trust", icon: Droplet },
      { href: "/category/pulse-oximeters", label: "Oximeters & thermometers", hint: "SpO2 and temperature", icon: Thermometer },
      { href: "/category/nebulizers", label: "Nebulizers", hint: "Compressor and mesh", icon: Wind },
      { href: "/category/orthopaedic-supports", label: "Supports & braces", hint: "Tynor and Dr Trust", icon: Bone },
      { href: "/brands", label: "All brands", hint: "Verified brands we stock", icon: BadgeCheck },
      { href: "/books", label: "Medical books", hint: "Textbooks for every course", icon: BookOpen },
    ],
    foot: { text: "Genuine products, cash on delivery across India", href: "/shop", label: "All products" },
  },
  {
    id: "institutions", label: "For institutions", match: /^\/(hospitals|medical-colleges|institutions)/, cols: 1,
    items: [
      { href: "/hospitals", label: "Aethex for Hospitals", hint: "Beds, ICU, emergency and IV supplies", icon: Hospital },
      { href: "/medical-colleges", label: "Aethex for Medical Colleges", hint: "Skills labs, anatomy, labs and books", icon: GraduationCap },
      { href: "/institutions", label: "Colleges & hospitals", hint: "Directory across India", icon: Building2 },
    ],
  },
  {
    id: "study", label: "Study", match: /^\/(study-hub|neet-pg|mock-test|flashcards|case-of-the-day|cme-hub|learning-path|live-classes|study-planner|quiz-builder|progress-tracker|leaderboard|webinars|video-cases)/, cols: 2,
    items: [
      { href: "/study-hub", label: "Study Hub", hint: "Everything for exams", icon: GraduationCap },
      { href: "/neet-pg", label: "NEET-PG", hint: "Subjects, PYQs and plans", icon: FileText },
      { href: "/study-hub/medical-knowledge-hub", label: "Medical Knowledge Hub", hint: "Subjects and conditions", icon: Brain },
      { href: "/mock-test", label: "Mock tests", hint: "Timed practice exams", icon: Timer },
      { href: "/flashcards", label: "Flashcards", hint: "Spaced revision", icon: Layers },
      { href: "/case-of-the-day", label: "Case of the day", hint: "One clinical case daily", icon: ClipboardList },
      { href: "/cme-hub", label: "CME Hub", hint: "Courses and certificates", icon: Star },
      { href: "/live-classes", label: "Live classes", hint: "Sessions with faculty", icon: MessageSquare },
    ],
  },
  {
    id: "tools", label: "Tools", match: /^\/(tools|drug-reference|drug-interaction-checker|calculator|cases|diagnosis|ai-scribe|patient-education|drug-alerts)/, cols: 2,
    items: [
      { href: "/tools", label: "Clinical tools", hint: "All tools in one place", icon: Stethoscope },
      { href: "/drug-reference", label: "Drug reference", hint: "Doses and monographs", icon: Pill },
      { href: "/drug-interaction-checker", label: "Drug interactions", hint: "Check combinations", icon: FlaskConical },
      { href: "/calculator", label: "Medical calculators", hint: "Scores and formulas", icon: Calculator },
      { href: "/tools/lab-interpreter", label: "Lab interpreter", hint: "Read lab panels", icon: Microscope },
      { href: "/cases", label: "Clinical cases", hint: "Learn from real scenarios", icon: ClipboardList },
    ],
  },
  {
    id: "more", label: "More", match: /^\/(blog|news|jobs|community|downloads|contact|hospital-directory|enterprise)/, cols: 2,
    items: [
      { href: "/blog", label: "Blog", hint: "Guides and updates", icon: Newspaper },
      { href: "/news", label: "Medical news", hint: "What's new in medicine", icon: Newspaper },
      { href: "/jobs", label: "Jobs", hint: "Medical roles in India", icon: Briefcase },
      { href: "/community", label: "Community", hint: "Discuss with peers", icon: MessageSquare },
      { href: "__downloads", label: "Cadus for desktop", hint: "Windows and Linux", icon: Download, external: true },
      { href: "https://hms.aethex.in", label: "Hospital management app", hint: "AETHEX HMS for hospitals", icon: Hospital, external: true },
      { href: "/contact", label: "Contact us", hint: "Help and support", icon: Mail },
    ],
  },
];

const ACCOUNT_LINKS: Item[] = [
  { href: "/account", label: "My account", icon: User },
  { href: "/orders", label: "My orders", icon: Package },
  { href: "/orders/track", label: "Track an order", icon: ShoppingBag },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cme-hub", label: "CME certificates", icon: GraduationCap },
  { href: "/my-reviews", label: "My reviews", icon: Star },
  { href: "/account/quotations", label: "Quotation requests", icon: ClipboardList },
];

const SEARCH_SUGGESTIONS = ["BP monitor", "Littmann stethoscope", "Pulse oximeter", "Glucometer", "Knee support", "Nebulizer", "Otoscope", "Thermometer"];

function ItemLink({ item, onClick }: { item: Item; onClick?: () => void }) {
  const I = item.icon;
  const inner = <><span className="ic"><I size={17} /></span><span><b>{item.label}</b>{item.hint && <small>{item.hint}</small>}</span></>;
  return item.external
    ? <a href={item.href === "__downloads" ? downloadsUrl() : item.href} onClick={onClick} rel="noopener">{inner}</a>
    : <Link href={item.href} onClick={onClick}>{inner}</Link>;
}

/** The old ticker bar is gone; kept as an export so nothing that imports it breaks. */
export function BrandSwitcherBar() {
  return null;
}

export function Logo() {
  return (
    <Link href="/" className="ax-logo" aria-label="Aethex home">
      <img className="ax-logo-mark" src={`${import.meta.env.BASE_URL}aethex-mark.png`} alt="" width={36} height={36} />
      <span className="ax-logo-word"><span className="sh">Aethex</span></span>
    </Link>
  );
}

export function Navbar({ inner = false }: { inner?: boolean }) {
  const [location, setLocation] = useLocation();
  const { user, isLoggedIn, logout } = useUserAuth();
  const { count: wishCount } = useWishlist();
  const cartCount = useCartCount();
  useAbandonedCartTracker(isLoggedIn);

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [acct, setAcct] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const acctRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Close everything on navigation.
  useEffect(() => { setOpen(null); setAcct(false); setMobile(false); setSearching(false); }, [location]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearching(true); }
      if (e.key === "Escape") { setOpen(null); setAcct(false); setSearching(false); setMobile(false); }
    };
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcct(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, []);
  useEffect(() => { document.body.style.overflow = mobile || searching ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobile, searching]);
  // A drop-down sits centred under its section, moved sideways if that would put it past the edge of the window.
  useLayoutEffect(() => {
    const place = () => {
      const el = dropRef.current;
      if (!el) return;
      el.style.removeProperty("--ax-drop-x");
      const r = el.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const gap = 12;
      const dx = r.left < gap ? gap - r.left : r.right > vw - gap ? vw - gap - r.right : 0;
      if (dx) el.style.setProperty("--ax-drop-x", `${Math.round(dx)}px`);
    };
    place();
    if (!open) return;
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  const openedAt = useRef(0);
  const hoverOpen = (id: string) => { window.clearTimeout(closeTimer.current); if (open !== id) openedAt.current = Date.now(); setOpen(id); };
  // A click just after the pointer opened the menu (moving onto it, or a tap, which also counts as moving onto it)
  // keeps it open instead of closing it again.
  const toggle = (id: string) => {
    if (open === id && Date.now() - openedAt.current < 600) return;
    if (open !== id) openedAt.current = Date.now();
    setOpen(open === id ? null : id);
  };
  const hoverClose = () => { closeTimer.current = window.setTimeout(() => setOpen(null), 160); };
  const search = (q: string) => { const s = q.trim(); if (!s) return; setSearching(false); setQuery(""); setLocation(`/shop?search=${encodeURIComponent(s)}`); };
  const first = (user?.name || "").replace(/^dr\.?\s+/i, "").split(" ")[0] || "Account";

  return (
    <>
      {/* Update 58: the portal switcher: every part of Aethex, one tap away, on every page and subdomain. */}
      <div className="ax-ann ax-portals no-print" data-site="announce">
        <div className="ax-wrap ax-ann-in">
          <nav aria-label="Aethex portals">
            {PORTAL_LINKS.map(([id, label, path]) => {
              const here = id === activePortal(location);
              const href = id === "hub" ? mainUrl("/") : portalUrl(id, path);
              return <a key={id} href={href} className={here ? "on" : ""} aria-current={here ? "page" : undefined} data-portal-link={id}>{label}</a>;
            })}
          </nav>
          <span className="promise hide-sm"><BadgeCheck size={14} /> Genuine brands · Cash on delivery · Free delivery from {formatINR(FREE_DELIVERY_FROM)}</span>
        </div>
      </div>
      <header className={`ax-head no-print ${scrolled ? "scrolled" : ""} ${inner ? "inner" : ""}`}>
        <div className="ax-wrap ax-head-in">
          <Logo />
          <nav className="ax-nav" ref={navRef} aria-label="Main">
            {SECTIONS.filter((s) => s.id !== "more").map((s) => (
              <div key={s.id} className={`${open === s.id ? "open" : ""} ${s.match.test(location) ? "on" : ""}`} style={{ position: "relative" }} onMouseEnter={() => hoverOpen(s.id)} onMouseLeave={hoverClose}>
                <button type="button" aria-expanded={open === s.id} onClick={() => toggle(s.id)}>{s.label} <ChevronDown size={14} className="chev" /></button>
                {open === s.id && (
                  <div className="ax-drop" ref={dropRef} style={{ width: s.cols === 2 ? 540 : 300 }}>
                    <div className="ax-drop-grid" style={{ gridTemplateColumns: `repeat(${s.cols ?? 1},1fr)` }}>
                      {s.items.map((it) => <ItemLink key={it.href} item={it} />)}
                    </div>
                    {s.foot && <div className="ax-drop-foot"><span>{s.foot.text}</span><Link href={s.foot.href}>{s.foot.label} →</Link></div>}
                  </div>
                )}
              </div>
            ))}
            <a href={cadusUrl("/")} className="cadus"><CadusMark size={16} variant="mono" color="currentColor" /> Cadus</a>
            {(() => { const s = SECTIONS.find((x) => x.id === "more")!; return (
              <div className={`${open === s.id ? "open" : ""} ${s.match.test(location) ? "on" : ""}`} style={{ position: "relative" }} onMouseEnter={() => hoverOpen(s.id)} onMouseLeave={hoverClose}>
                <button type="button" aria-expanded={open === s.id} onClick={() => toggle(s.id)}>{s.label} <ChevronDown size={14} className="chev" /></button>
                {open === s.id && (
                  <div className="ax-drop" ref={dropRef} style={{ width: 540 }}>
                    <div className="ax-drop-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>{s.items.map((it) => <ItemLink key={it.href} item={it} />)}</div>
                  </div>
                )}
              </div>
            ); })()}
          </nav>

          <div className="ax-head-r">
            <button type="button" className="ax-search-btn" onClick={() => setSearching(true)} aria-label="Search"><Search size={16} /><span>Search Aethex</span><kbd>Ctrl K</kbd></button>
            <Link href="/wishlist" className="ax-icon wish" aria-label={`Wishlist${wishCount ? `, ${wishCount} items` : ""}`}><Heart size={19} />{wishCount > 0 && <span className="n">{wishCount}</span>}</Link>
            <Link href="/cart" className="ax-icon" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}><ShoppingCart size={19} />{cartCount > 0 && <span className="n">{cartCount}</span>}</Link>
            <div className="ax-acct" ref={acctRef}>
              <button type="button" className="ax-acct-btn" onClick={() => setAcct(!acct)} aria-expanded={acct} aria-label="Account">
                <span className={`ax-av ${isLoggedIn ? "" : "guest"}`}>{isLoggedIn ? (first[0] || "A").toUpperCase() : <User size={15} />}</span>
                <span className="nm">{isLoggedIn ? first : "Sign in"}</span>
              </button>
              {acct && (
                <div className="ax-menu" role="menu">
                  {isLoggedIn ? (
                    <div className="ax-menu-h"><b>{user?.name}</b><small>{user?.email}</small></div>
                  ) : (
                    <div className="ax-menu-h" style={{ display: "flex", gap: 8 }}>
                      <a className="ax-btn teal" style={{ flex: 1, height: 38, justifyContent: "center", color: "#fff" }} href={loginUrl("/")}>Sign in</a>
                      <a className="ax-btn" style={{ flex: 1, height: 38, justifyContent: "center" }} href={loginUrl("/signup")}>Create account</a>
                    </div>
                  )}
                  {ACCOUNT_LINKS.map(({ href, label, icon: I }) => <Link key={href} href={href}><I size={16} /> {label}</Link>)}
                  {isLoggedIn && <><div className="sep" /><button type="button" className="danger" onClick={() => { setAcct(false); logout(); }}><LogOut size={16} /> Sign out</button></>}
                </div>
              )}
            </div>
            <a href={cadusUrl("/")} className="ax-btn dark"><Sparkles size={15} /> Try Cadus</a>
            <button type="button" className="ax-icon ax-burger" onClick={() => setMobile(true)} aria-label="Open menu"><Menu size={21} /></button>
          </div>
        </div>
      </header>

      {searching && (
        <div className="ax-search" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearching(false); }} role="dialog" aria-label="Search">
          <div className="ax-search-box">
            <form onSubmit={(e) => { e.preventDefault(); search(query); }}>
              <Search size={20} color="#667085" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, books and equipment" aria-label="Search" />
              <button type="button" className="ax-icon" onClick={() => setSearching(false)} aria-label="Close search"><X size={18} /></button>
            </form>
            {query.trim().length >= 2 ? <SearchResults q={query.trim()} onGo={() => setSearching(false)} onAll={() => search(query)} /> : (
            <div className="sugg">
              <p>Popular</p>
              <div>{SEARCH_SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => search(s)}>{s}</button>)}</div>
              <p style={{ marginTop: 14 }}>Go to</p>
              <div>
                <Link href="/shop">All products</Link><Link href="/books">Medical books</Link><Link href="/study-hub">Study Hub</Link><Link href="/drug-reference">Drug reference</Link>
                <a href={cadusUrl("/")}>Ask Cadus</a>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {mobile && (
        <div className="ax-mob" role="dialog" aria-label="Menu">
          <div className="ax-mob-h"><Logo /><button type="button" className="ax-icon" onClick={() => setMobile(false)} aria-label="Close menu"><X size={22} /></button></div>
          <div className="ax-mob-b">
            <button type="button" className="ax-search-btn" style={{ width: "100%", height: 46, marginBottom: 8 }} onClick={() => { setMobile(false); setSearching(true); }}><Search size={17} /> <span style={{ display: "inline" }}>Search Aethex</span></button>
            <a className="solo" href={cadusUrl("/")}>Cadus <CadusMark size={18} variant="mono" color="currentColor" /></a>
            {SECTIONS.map((s) => (
              <details key={s.id}>
                <summary>{s.label} <ChevronDown size={18} className="chev" /></summary>
                {s.items.map((it) => { const I = it.icon; return it.external
                  ? <a key={it.href} href={it.href === "__downloads" ? downloadsUrl() : it.href}><I size={18} /> {it.label}</a>
                  : <Link key={it.href} href={it.href} onClick={() => setMobile(false)}><I size={18} /> {it.label}</Link>; })}
              </details>
            ))}
            <details>
              <summary>Account <ChevronDown size={18} className="chev" /></summary>
              {ACCOUNT_LINKS.map(({ href, label, icon: I }) => <Link key={href} href={href} onClick={() => setMobile(false)}><I size={18} /> {label}</Link>)}
            </details>
          </div>
          <div className="ax-mob-f">
            {isLoggedIn
              ? <button type="button" className="ax-btn" onClick={() => { setMobile(false); logout(); }}><LogOut size={16} /> Sign out</button>
              : <><a className="ax-btn" href={loginUrl("/")}>Sign in</a><a className="ax-btn teal" href={loginUrl("/signup")} style={{ color: "#fff" }}>Create account</a></>}
          </div>
        </div>
      )}
    </>
  );
}
