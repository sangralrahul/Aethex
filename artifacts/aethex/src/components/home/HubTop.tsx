/**
 * Update 91: aethex.in in a marketplace layout (like the big shopping sites): a row of platform pills on top, one big
 * search with Login, More and Cart, a row of category icons, sliding banners, then rows: the latest in the store,
 * the latest medical books, today in Study (question of the day, case of the day, the latest articles by doctors)
 * and doctors by specialty with hospital and college buying. Every price, book and article is live from the
 * platforms; nothing is invented. Styles: src/site-hub.css (.hx-*).
 */
import { lazy, Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, Building2, CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Grid3x3, GraduationCap, Hospital, LogOut,
  Mail, Newspaper, Package, Search, ShoppingCart, Sparkles, Stethoscope, Timer, User, Video,
} from "lucide-react";
import { Logo } from "@/components/layout/Navbar";
import { NotificationBell } from "@/components/home/HubBits";
import { ProductImage } from "@/components/store/ProductImage";
import { useUserAuth } from "@/hooks/use-user-auth";
import { cadusUrl, loginUrl, mainUrl, portalUrl, type Portal } from "@/lib/host";
import { useBooks, useStore } from "@/lib/store/api";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { SPECIALTIES } from "@/lib/find";
import { formatINR } from "@/lib/utils";

const QotdCard = lazy(() => import("@/components/study/Qotd").then((m) => ({ default: m.QotdCard })));
const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;
const S = (p: string) => portalUrl("store", p), D = (p: string) => portalUrl("doctors", p), ST = (p: string) => portalUrl("study", p);

/* ---------------------------------------------------------------- platform pills */
const PILLS: { id: Portal | "aethex" | "cadus"; label: string; icon: ReactNode; href: string; tone: string }[] = [
  { id: "aethex", label: "Aethex", icon: <Sparkles size={17} />, href: "/", tone: "on" },
  { id: "doctors", label: "Doctors", icon: <CalendarCheck size={17} />, href: portalUrl("doctors"), tone: "blue" },
  { id: "store", label: "Store", icon: <ShoppingCart size={17} />, href: portalUrl("store"), tone: "teal" },
  { id: "study", label: "Study", icon: <GraduationCap size={17} />, href: portalUrl("study"), tone: "violet" },
  { id: "hospitals", label: "Hospitals", icon: <Hospital size={17} />, href: portalUrl("hospitals"), tone: "cyan" },
  { id: "medicalcolleges", label: "Colleges", icon: <Building2 size={17} />, href: portalUrl("medicalcolleges"), tone: "amber" },
  { id: "cadus", label: "Cadus", icon: <Sparkles size={17} />, href: cadusUrl("/"), tone: "ink" },
];

/* ---------------------------------------------------------------- search */
const SCOPES = [
  { id: "store", label: "Products", placeholder: "Search for products, brands and books", to: (q: string) => S(`/shop?search=${encodeURIComponent(q)}`) },
  { id: "doctors", label: "Doctors", placeholder: "Search doctors, specialties or clinics", to: (q: string) => D(`/doctors?q=${encodeURIComponent(q)}`) },
  { id: "study", label: "Study topics", placeholder: "Search a topic or condition", to: (q: string) => ST(`/study-hub/medical-knowledge-hub?q=${encodeURIComponent(q)}`) },
] as const;
function BigSearch() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]["id"]>("store");
  const [q, setQ] = useState("");
  const cur = SCOPES.find((x) => x.id === scope)!;
  const go = (e: FormEvent) => { e.preventDefault(); const t = q.trim(); window.location.href = t ? cur.to(t) : portalUrl(scope); };
  return (
    <form className="hx-search" onSubmit={go} role="search" data-home="search">
      <Search size={20} aria-hidden="true" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cur.placeholder} aria-label={cur.placeholder} />
      <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} aria-label="Search in" data-home="search-scope">
        {SCOPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <button type="submit" aria-label="Search">Search</button>
    </form>
  );
}

/** A small menu that opens on hover or click and closes on Escape or a click elsewhere. */
function Menu({ label, icon, children, id }: { label: ReactNode; icon?: ReactNode; children: ReactNode; id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className={`hx-menu${open ? " open" : ""}`} ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} data-home={`menu-${id}`}>
      <button type="button" className="hx-act" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>{icon}<span>{label}</span><ChevronDown size={15} className="chev" /></button>
      {open && <div className="hx-drop" role="menu">{children}</div>}
    </div>
  );
}
const MI = ({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) => <a role="menuitem" href={href}>{icon}{children}</a>;

/* ---------------------------------------------------------------- categories */
const CATS: { label: string; href: string; img?: string; icon?: ReactNode; on?: boolean }[] = [
  { label: "For you", href: "#for-you", icon: <Sparkles size={24} />, on: true },
  { label: "Doctors", href: D("/doctors"), icon: <Stethoscope size={24} /> },
  { label: "Video consult", href: D("/doctors?video=1"), icon: <Video size={24} /> },
  { label: "BP monitors", href: S("/category/bp-monitors"), img: "bp-monitor" },
  { label: "Stethoscopes", href: S("/category/stethoscopes"), img: "stethoscope" },
  { label: "Oximeters", href: S("/category/pulse-oximeters"), img: "oximeter" },
  { label: "Diabetes care", href: S("/category/diabetes-care"), img: "glucometer" },
  { label: "Nebulizers", href: S("/category/nebulizers"), img: "nebulizer" },
  { label: "Diagnostics", href: S("/category/diagnostic-instruments"), img: "otoscope" },
  { label: "Books", href: S("/books"), img: "medical-book" },
  { label: "NEET-PG", href: ST("/neet-pg"), img: "test-books" },
  { label: "Hospitals", href: portalUrl("hospitals"), img: "ecg" },
  { label: "Colleges", href: portalUrl("medicalcolleges"), img: "surgical-set" },
];

export function HubHeader() {
  const { isLoggedIn, user, logout } = useUserAuth();
  const first = (user?.name || "").replace(/^dr\.?\s+/i, "").split(" ")[0] || "Account";
  return (
    <header className="hx-head" data-home="header">
      <div className="hx-wrap">
        <div className="hx-pills" role="navigation" aria-label="Aethex platforms" data-home="pills">
          {PILLS.map((p) => <a key={p.id} href={p.href} className={`hx-pill ${p.tone}`} aria-current={p.id === "aethex" ? "page" : undefined} data-pill={p.id} {...(p.id === "cadus" ? { "data-home": "cta-cadus" } : {})}><span className="i">{p.icon}</span>{p.label}</a>)}
          <span className="hx-note"><Package size={15} /> Cash on delivery · free delivery from {formatINR(FREE_DELIVERY_FROM)}</span>
        </div>
        <div className="hx-bar">
          <Logo />
          <BigSearch />
          <nav className="hx-acts" aria-label="Account">
            {isLoggedIn ? (
              <Menu id="account" label={first} icon={<User size={19} />}>
                <MI href={mainUrl("/account")} icon={<User size={16} />}>My account</MI>
                <MI href={S("/orders")} icon={<Package size={16} />}>My orders</MI>
                <MI href={D("/appointments")} icon={<CalendarCheck size={16} />}>My appointments</MI>
                <MI href={ST("/my-library")} icon={<BookOpen size={16} />}>My library</MI>
                <MI href={portalUrl("hospitals", "/account/quotations")} icon={<ClipboardList size={16} />}>Quotations</MI>
                <MI href={mainUrl("/email-preferences")} icon={<Mail size={16} />}>Email preferences</MI>
                <button type="button" role="menuitem" onClick={() => logout()}><LogOut size={16} />Sign out</button>
              </Menu>
            ) : (
              <Menu id="account" label="Login" icon={<User size={19} />}>
                <a className="hx-login" href={loginUrl("/")} data-home="login">Login</a>
                <p className="hx-new">New to Aethex? <a href={loginUrl("/signup")}>Sign up</a></p>
                <MI href={S("/orders/track")} icon={<Package size={16} />}>Track an order</MI>
                <MI href={D("/appointments")} icon={<CalendarCheck size={16} />}>My appointments</MI>
              </Menu>
            )}
            <Menu id="more" label="More">
              <MI href={D("/list-your-practice")} icon={<Stethoscope size={16} />}>List your practice</MI>
              <MI href={portalUrl("hospitals", "/#list")} icon={<Hospital size={16} />}>Bulk quotation</MI>
              <MI href={portalUrl("hospitals", "/institutions")} icon={<Building2 size={16} />}>Hospitals directory</MI>
              <MI href={cadusUrl("/")} icon={<Sparkles size={16} />}>Cadus, clinical AI</MI>
              <MI href={mainUrl("/contact")} icon={<Mail size={16} />}>Contact us</MI>
            </Menu>
            <NotificationBell />
            <a className="hx-act" href={S("/cart")} data-home="cart"><ShoppingCart size={19} /><span>Cart</span></a>
          </nav>
        </div>
        <nav className="hx-cats" aria-label="Browse" data-home="cats">
          {CATS.map((c) => (
            <a key={c.label} href={c.href} className={c.on ? "on" : ""}>
              <span className="pic">{c.img ? <img src={IMG(c.img)} alt="" loading="lazy" decoding="async" /> : c.icon}</span>
              <span className="lb">{c.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- banners */
type Slide = { id: string; tone: string; tag: string; title: ReactNode; sub: string; cta: string; href: string; imgs: string[] };
const SLIDES: Slide[] = [
  { id: "aethex", tone: "navy", tag: "One account · Five platforms", title: "Everything medical, in one place.", sub: "Doctors, a medical store, study, and supplies for hospitals and colleges. Cadus is inside every one.", cta: "Try Cadus free", href: cadusUrl("/"), imgs: ["stethoscope", "test-books", "ecg"] },
  { id: "store", tone: "teal", tag: "Aethex Store", title: "Genuine medical devices, at your door", sub: `Verified brands, cash on delivery, free delivery from ${formatINR(FREE_DELIVERY_FROM)}.`, cta: "Shop now", href: portalUrl("store"), imgs: ["bp-monitor", "oximeter", "glucometer"] },
  { id: "doctors", tone: "blue", tag: "Aethex Doctors", title: "Book checked doctors near you", sub: "Clinic visits and video consultations, with reminders and your records in one place.", cta: "Find a doctor", href: D("/doctors"), imgs: ["otoscope", "thermometer", "stethoscope"] },
  { id: "study", tone: "violet", tag: "Aethex Study", title: "Today's NEET-PG question is up", sub: "Answer it, see how everyone did, then mock tests, flashcards and your topic map.", cta: "Answer it", href: ST("/question-of-the-day"), imgs: ["test-books", "medical-book", "neuro-kit"] },
  { id: "hospitals", tone: "cyan", tag: "Hospitals and colleges", title: "One list. One quotation.", sub: "Beds, ICU, skills labs and consumables, with approvals, indents and a stock register.", cta: "Get a quotation", href: portalUrl("hospitals", "/#list"), imgs: ["ecg", "surgical-set", "laryngoscope"] },
];
export function Banners() {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0), [hold, setHold] = useState(false);
  const go = (i: number) => {
    const el = ref.current; if (!el) return;
    const n = (i + SLIDES.length) % SLIDES.length;
    const card = el.children[n] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onScroll = () => { const w = (el.children[0] as HTMLElement | undefined)?.offsetWidth ?? 1; setAt(Math.min(SLIDES.length - 1, Math.round(el.scrollLeft / (w + 16)))); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (hold || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(at + 1 >= SLIDES.length ? 0 : at + 1), 5000);
    return () => window.clearTimeout(t);
  }, [at, hold]);
  return (
    <section className="hx-wrap hx-ban" aria-roledescription="carousel" aria-label="Highlights" data-home="banners" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)}>
      <div className="track" ref={ref}>
        {SLIDES.map((s, i) => (
          <a key={s.id} href={s.href} className={`slide ${s.tone}`} aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} data-slide={s.id}>
            <span className="txt">
              <small>{s.tag}</small>
              {i === 0 ? <h1>{s.title}</h1> : <b className="t">{s.title}</b>}
              <span className="sub">{s.sub}</span>
              <span className="cta">{s.cta} <ArrowRight size={15} /></span>
            </span>
            <span className="pics" aria-hidden="true">{s.imgs.map((n, j) => <img key={n} src={IMG(n)} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" style={{ ["--j" as string]: j }} />)}</span>
          </a>
        ))}
      </div>
      <button type="button" className="nav prev" onClick={() => go(at - 1)} aria-label="Previous"><ChevronLeft size={20} /></button>
      <button type="button" className="nav next" onClick={() => go(at + 1)} aria-label="Next"><ChevronRight size={20} /></button>
      <div className="dots" role="tablist" aria-label="Choose a highlight">{SLIDES.map((s, i) => <button key={s.id} type="button" role="tab" aria-selected={i === at} aria-label={`Highlight ${i + 1}`} className={i === at ? "on" : ""} onClick={() => go(i)} />)}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- rows */
function Row({ title, sub, more, children, id }: { title: string; sub?: string; more?: string; children: ReactNode; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const step = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth - 80), behavior: "smooth" });
  return (
    <section className="hx-wrap hx-row" data-home={id} aria-label={title}>
      <div className="hd">
        <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        <span className="ar">
          <button type="button" onClick={() => step(-1)} aria-label={`Scroll ${title} back`}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => step(1)} aria-label={`Scroll ${title} on`}><ChevronRight size={18} /></button>
          {more && <a href={more} className="all" aria-label={`See all: ${title}`}><ArrowRight size={18} /></a>}
        </span>
      </div>
      <div className="rail" ref={ref}>{children}</div>
    </section>
  );
}
const price = (p: number | null | undefined, mrp: number | null | undefined) => p == null ? <b className="por">Price on request</b> : <><b>{formatINR(p)}</b>{mrp && mrp > p && <><s>{formatINR(mrp)}</s><em>{Math.round(((mrp - p) / mrp) * 100)}% off</em></>}</>;
const Skel = () => <>{Array.from({ length: 6 }, (_, i) => <span key={i} className="hx-card sk" aria-hidden="true" />)}</>;

export function LatestProducts() {
  const { data, isLoading } = useStore();
  // the most recently added (highest numbers) in stock, a few per category so the row isn't all one kind
  const list = (() => {
    if (!data) return [];
    const seen = new Map<string, number>();
    return [...data.products].filter((p) => p.inStock && !p.priceOnRequest && p.price != null && p.image).sort((a, b) => b.id - a.id)
      .filter((p) => { const n = seen.get(p.category) ?? 0; seen.set(p.category, n + 1); return n < 2; }).slice(0, 16);
  })();
  if (!isLoading && !list.length) return null;
  return (
    <Row id="latest-products" title="Latest in the store" sub="Recently added, from verified brands" more={S("/shop")}>
      {isLoading ? <Skel /> : list.map((p) => (
        <a key={p.id} href={S(`/products/${p.slug}`)} className="hx-card" data-product={p.id}>
          <span className="im"><ProductImage src={p.image} alt="" width={300} /></span>
          <span className="nm">{p.name}</span>
          {p.rating && p.rating.count > 0 && <span className="rt">{p.rating.avg.toFixed(1)} ★ <small>({p.rating.count})</small></span>}
          <span className="pr">{p.from && <small>from </small>}{price(p.price, p.mrp)}</span>
          {p.offer && <span className="of">{p.offer.title}</span>}
        </a>
      ))}
    </Row>
  );
}

export function LatestBooks() {
  const { data, isLoading } = useBooks();
  const list = data ? [...data.books].filter((b) => b.inStock !== false).sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.id - a.id).slice(0, 16) : [];
  if (!isLoading && !list.length) return null;
  return (
    <Row id="latest-books" title="Latest medical books" sub="Newest editions from the publishers" more={S("/books")}>
      {isLoading ? <Skel /> : list.map((b) => (
        <a key={b.id} href={S(`/books/${b.slug}`)} className="hx-card book" data-book={b.id}>
          <span className="im"><ProductImage src={b.cover} alt="" width={300} book /></span>
          <span className="nm">{b.title}</span>
          <small className="by">{[b.authors, b.edition, b.year].filter(Boolean).join(" · ")}</small>
          <span className="pr">{price(b.price, b.mrp)}</span>
        </a>
      ))}
    </Row>
  );
}

type Article = { slug: string; title: string; summary: string | null; specialty: string | null; at: number; minutes: number; doctor: { name: string; specialty: string } };
export function TodayInStudy() {
  const { data: arts } = useQuery({ queryKey: ["find", "articles", "latest"], queryFn: async () => { const r = await fetch("/api/find/articles"); if (!r.ok) return [] as Article[]; return ((await r.json()).articles ?? []) as Article[]; }, staleTime: 5 * 60_000, retry: false });
  const latest = (arts ?? []).slice(0, 4);
  return (
    <section className="hx-wrap hx-study" data-home="study" aria-label="Today in Study and health articles">
      <div className="hd"><div><h2>Today in Study</h2><p>A new question every day, the same for everyone</p></div><a href={portalUrl("study")} className="all" aria-label="Open Aethex Study"><ArrowRight size={18} /></a></div>
      <div className="grid">
        <div className="q"><Suspense fallback={<div className="st-qotd load" />}><QotdCard compact /></Suspense></div>
        <div className="side">
          <a href={ST("/case-of-the-day")} className="tile violet"><CalendarCheck size={20} /><b>Case of the day</b><small>A clinical case to work through</small></a>
          <a href={ST("/mock-test")} className="tile blue"><Timer size={20} /><b>Mock test</b><small>NEET-PG pattern, scored with your rank</small></a>
          <a href={ST("/my-library?tab=mastery")} className="tile teal"><Grid3x3 size={20} /><b>Your topic map</b><small>Strong and weak topics at a glance</small></a>
          <a href={ST("/flashcards")} className="tile amber"><BookOpen size={20} /><b>Flashcards</b><small>Spaced revision, a few minutes a day</small></a>
        </div>
      </div>
      {latest.length > 0 && (
        <div className="arts" data-home="articles">
          <h3><Newspaper size={17} /> Latest from doctors</h3>
          <ul>{latest.map((a) => (
            <li key={a.slug}><a href={D(`/articles/${a.slug}`)}><b>{a.title}</b>{a.summary && <span>{a.summary}</span>}<small>{a.doctor.name} · {a.doctor.specialty} · {a.minutes} min read</small></a></li>
          ))}</ul>
        </div>
      )}
    </section>
  );
}

const SPEC_ICON = ["stethoscope", "thermometer", "paed-stethoscope", "foetal-doppler", "dermatoscope", "forceps", "knee-brace", "otoscope", "ophthalmoscope", "ecg", "neuro-kit", "reflex-hammer"];
export function DoctorsAndHospitals() {
  return (
    <section className="hx-wrap hx-dh" data-home="doctors-hospitals" aria-label="Doctors and hospitals">
      <div className="hd"><div><h2>Find a doctor by specialty</h2><p>Checked registrations, clinic visits and video consults</p></div><a href={D("/doctors")} className="all" aria-label="All doctors"><ArrowRight size={18} /></a></div>
      <ul className="specs">{SPECIALTIES.slice(0, 12).map((s, i) => (
        <li key={s}><a href={D(`/doctors?specialty=${encodeURIComponent(s)}`)} data-spec={s}><span className="pic"><img src={IMG(SPEC_ICON[i] ?? "stethoscope")} alt="" loading="lazy" /></span><span>{s}</span></a></li>
      ))}</ul>
      <div className="inst">
        <a href={portalUrl("hospitals")} className="cyan"><Hospital size={26} /><span><b>For hospitals and clinics</b><small>Beds, ICU, emergency and consumables. Send one list, get one quotation, with approvals, indents and a stock register.</small></span><ArrowRight size={18} /></a>
        <a href={portalUrl("medicalcolleges")} className="amber"><Building2 size={26} /><span><b>For medical colleges</b><small>Skills labs, anatomy models, lab equipment and textbooks for every department.</small></span><ArrowRight size={18} /></a>
      </div>
    </section>
  );
}
