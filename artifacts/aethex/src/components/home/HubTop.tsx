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
  Activity, CircleUserRound, MoreVertical, Droplet, HeartPulse, LayoutGrid, Microscope, ShoppingBag, Thermometer, Truck, UserRound,
  ArrowRight, Check, BookOpen, Building2, CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Grid3x3, GraduationCap, Hospital, LogOut,
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
import { hideBroken, ph, type PhotoKey } from "@/config/photos";

const QotdCard = lazy(() => import("@/components/study/Qotd").then((m) => ({ default: m.QotdCard })));
const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;
const S = (p: string) => portalUrl("store", p), D = (p: string) => portalUrl("doctors", p), ST = (p: string) => portalUrl("study", p);

/* ---------------------------------------------------------------- platform switcher (update 96: like a marketplace's app switcher) */
const PILLS: { id: Portal | "aethex" | "cadus"; label: string; href: string; icon: ReactNode; tone: string }[] = [
  { id: "aethex", label: "Aethex", href: "/", icon: <AethexMark />, tone: "a" },
  { id: "doctors", label: "Doctors", href: portalUrl("doctors"), icon: <Stethoscope size={18} strokeWidth={2} />, tone: "d" },
  { id: "store", label: "Store", href: portalUrl("store"), icon: <ShoppingBag size={18} strokeWidth={2} />, tone: "s" },
  { id: "study", label: "Study", href: portalUrl("study"), icon: <GraduationCap size={18} strokeWidth={2} />, tone: "y" },
  { id: "hospitals", label: "Hospitals", href: portalUrl("hospitals"), icon: <Hospital size={18} strokeWidth={2} />, tone: "h" },
  { id: "medicalcolleges", label: "Colleges", href: portalUrl("medicalcolleges"), icon: <Building2 size={18} strokeWidth={2} />, tone: "c" },
  { id: "cadus", label: "Cadus", href: cadusUrl("/"), icon: <Sparkles size={18} strokeWidth={2} />, tone: "x" },
];
function AethexMark() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 3 21h4.2L12 10.6 16.8 21H21L12 2.5Z" fill="currentColor" /><path d="M8.6 16.2h6.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

/* ---------------------------------------------------------------- search */
const SCOPES = [
  { id: "store", label: "Products", placeholder: "Search for products, brands and books", to: (q: string) => S(`/shop?search=${encodeURIComponent(q)}`) },
  { id: "doctors", label: "Doctors", placeholder: "Search for doctors, specialties and clinics", to: (q: string) => D(`/doctors?q=${encodeURIComponent(q)}`) },
  { id: "study", label: "Study topics", placeholder: "Search for a topic or condition", to: (q: string) => ST(`/study-hub/medical-knowledge-hub?q=${encodeURIComponent(q)}`) },
] as const;
function BigSearch() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]["id"]>("store");
  const [q, setQ] = useState("");
  const cur = SCOPES.find((x) => x.id === scope)!;
  const go = (e: FormEvent) => { e.preventDefault(); const t = q.trim(); window.location.href = t ? cur.to(t) : portalUrl(scope); };
  return (
    <form className="fk-search" onSubmit={go} role="search" data-home="search">
      <button type="submit" aria-label="Search"><Search size={20} /></button>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cur.placeholder} aria-label={cur.placeholder} />
      <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} aria-label="Search in" data-home="search-scope">
        {SCOPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </form>
  );
}

/** A small menu that opens on hover or click and closes on Escape or a click elsewhere. */
function Menu({ label, icon, children, id }: { label: ReactNode; icon?: ReactNode; children: ReactNode; id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hovered = useRef(false); // a click right after the hover opened it keeps it open
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className={`hx-menu${open ? " open" : ""}`} ref={ref} onMouseEnter={() => { hovered.current = true; setOpen(true); }} onMouseLeave={() => { hovered.current = false; setOpen(false); }} data-home={`menu-${id}`}>
      <button type="button" className="fk-act" aria-expanded={open} aria-haspopup="menu" onClick={() => { if (hovered.current && open) { hovered.current = false; return; } setOpen(!open); }}>{icon}<span>{label}</span><ChevronDown size={16} className="chev" /></button>
      {open && <div className="hx-drop" role="menu">{children}</div>}
    </div>
  );
}
const MI = ({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) => <a role="menuitem" href={href}>{icon}{children}</a>;

/* ---------------------------------------------------------------- categories */
const ic = (I: typeof Stethoscope) => <I size={30} strokeWidth={1.4} />;
const CATS: { label: string; href: string; icon: ReactNode; on?: boolean }[] = [
  { label: "For You", href: "#for-you", icon: ic(LayoutGrid), on: true },
  { label: "Doctors", href: D("/doctors"), icon: ic(UserRound) },
  { label: "Video consult", href: D("/doctors?video=1"), icon: ic(Video) },
  { label: "BP monitors", href: S("/category/bp-monitors"), icon: ic(HeartPulse) },
  { label: "Stethoscopes", href: S("/category/stethoscopes"), icon: ic(Stethoscope) },
  { label: "Oximeters", href: S("/category/pulse-oximeters"), icon: ic(Activity) },
  { label: "Diabetes care", href: S("/category/diabetes-care"), icon: ic(Droplet) },
  { label: "Thermometers", href: S("/category/thermometers"), icon: ic(Thermometer) },
  { label: "Diagnostics", href: S("/category/diagnostic-instruments"), icon: ic(Microscope) },
  { label: "Books", href: S("/books"), icon: ic(BookOpen) },
  { label: "NEET-PG", href: ST("/neet-pg"), icon: ic(GraduationCap) },
  { label: "Hospitals", href: portalUrl("hospitals"), icon: ic(Hospital) },
  { label: "Colleges", href: portalUrl("medicalcolleges"), icon: ic(Building2) },
];

export function HubHeader() {
  const { isLoggedIn, user, logout } = useUserAuth();
  const first = (user?.name || "").replace(/^dr\.?\s+/i, "").split(" ")[0] || "Account";
  return (
    <header className="fk-head" data-home="header">
      <div className="hx-wrap">
        <div className="fk-r1">
          <nav className="fk-tabs" aria-label="Aethex platforms" data-home="pills">
            {PILLS.map((p) => <a key={p.id} href={p.href} className={`fk-tab t-${p.tone}${p.id === "aethex" ? " on" : ""}`} aria-current={p.id === "aethex" ? "page" : undefined} data-pill={p.id} {...(p.id === "cadus" ? { "data-home": "cta-cadus" } : {})}><span className="i">{p.icon}</span><span className="l">{p.label}</span></a>)}
          </nav>
          <span className="fk-loc"><Truck size={18} /><span>Cash on delivery</span><b>Free delivery from {formatINR(FREE_DELIVERY_FROM)}</b></span>
        </div>
        <div className="fk-r2">
          <BigSearch />
          <nav className="fk-acts" aria-label="Account">
            <a className="fk-cadus" href={cadusUrl("/")} data-home="cadus-btn"><Sparkles size={16} /><span>Cadus</span><em>AI</em></a>
            {isLoggedIn ? (
              <Menu id="account" label={first} icon={<CircleUserRound size={22} strokeWidth={1.6} />}>
                <MI href={mainUrl("/account")} icon={<User size={16} />}>My account</MI>
                <MI href={S("/orders")} icon={<Package size={16} />}>My orders</MI>
                <MI href={D("/appointments")} icon={<CalendarCheck size={16} />}>My appointments</MI>
                <MI href={ST("/my-library")} icon={<BookOpen size={16} />}>My library</MI>
                <MI href={portalUrl("hospitals", "/account/quotations")} icon={<ClipboardList size={16} />}>Quotations</MI>
                <MI href={mainUrl("/email-preferences")} icon={<Mail size={16} />}>Email preferences</MI>
                <button type="button" role="menuitem" onClick={() => logout()}><LogOut size={16} />Sign out</button>
              </Menu>
            ) : (
              <Menu id="account" label="Login" icon={<CircleUserRound size={22} strokeWidth={1.6} />}>
                <a className="hx-login" href={loginUrl("/")} data-home="login">Login</a>
                <p className="hx-new">New customer? <a href={loginUrl("/signup")}>Sign up</a></p>
                <MI href={S("/orders")} icon={<Package size={16} />}>Orders</MI>
                <MI href={S("/orders/track")} icon={<Truck size={16} />}>Track an order</MI>
                <MI href={D("/appointments")} icon={<CalendarCheck size={16} />}>My appointments</MI>
                <MI href={ST("/my-library")} icon={<BookOpen size={16} />}>My library</MI>
              </Menu>
            )}
            <Menu id="more" label="More" icon={<MoreVertical size={20} strokeWidth={1.6} className="only-sm" />}>
              <MI href={D("/list-your-practice")} icon={<Stethoscope size={16} />}>List your practice</MI>
              <MI href={portalUrl("hospitals", "/#list")} icon={<Hospital size={16} />}>Bulk quotation</MI>
              <MI href={portalUrl("hospitals", "/institutions")} icon={<Building2 size={16} />}>Hospitals directory</MI>
              <MI href={cadusUrl("/")} icon={<Sparkles size={16} />}>Cadus, clinical AI</MI>
              <MI href={mainUrl("/contact")} icon={<Mail size={16} />}>24x7 help</MI>
            </Menu>
            <NotificationBell />
            <a className="fk-act" href={S("/cart")} data-home="cart"><ShoppingCart size={22} strokeWidth={1.6} /><span>Cart</span></a>
          </nav>
        </div>
        <nav className="fk-cats" aria-label="Browse" data-home="cats">
          {CATS.map((c) => <a key={c.label} href={c.href} className={c.on ? "on" : ""}><span className="pic">{c.icon}</span><span className="lb">{c.label}</span></a>)}
        </nav>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- banners (peeking carousel) */
type Slide = { id: string; tone: string; tag: string; title: ReactNode; big: string; cta: string; href: string; photo: PhotoKey; video?: string; live?: boolean };
// update 97: short words, a real photograph behind (slow Ken Burns), and a product reel (our own short video made from
// the store's product photos: public/videos/*-reel.mp4) on the right
const SLIDES: Slide[] = [
  { id: "aethex", tone: "b1", tag: "Aethex", title: "Everything medical.", big: "Doctors · Store · Study", cta: "Try Cadus free", href: cadusUrl("/"), photo: "doctorPatient" },
  { id: "store", tone: "b2", tag: "Aethex Store", title: "Medical devices", big: `Free delivery ${formatINR(FREE_DELIVERY_FROM)}+`, cta: "Shop now", href: portalUrl("store"), photo: "bpCheck", video: "store-reel" },
  { id: "doctors", tone: "b3", tag: "Aethex Doctors", title: "Book a doctor", big: "Clinic or video", cta: "Find a doctor", href: D("/doctors"), photo: "consultation", video: "care-reel" },
  { id: "study", tone: "b4", tag: "Aethex Study", title: "NEET-PG, daily", big: "Today's question is live", cta: "Answer now", href: ST("/question-of-the-day"), photo: "lectureHall", video: "study-reel", live: true },
  { id: "hospitals", tone: "b5", tag: "For institutions", title: "One list. One quote.", big: "Beds · ICU · Labs", cta: "Get a quote", href: portalUrl("hospitals", "/#list"), photo: "icuMonitor", video: "hospital-reel" },
];
const VID = (n: string) => `${import.meta.env.BASE_URL}videos/${n}`;
/** A muted product reel that plays only while it's on screen (and not at all when motion is reduced). */
function Reel({ name }: { name: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) void v.play().catch(() => {}); else v.pause(); }, { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} className="reel" poster={VID(`${name}.jpg`)} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1}><source src={VID(`${name}.webm`)} type="video/webm" /><source src={VID(`${name}.mp4`)} type="video/mp4" /></video>;
}
const Ecg = () => (
  <svg className="ecg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 H170 L182 18 L194 44 L206 30 H260 L272 4 L286 56 L298 30 H380 L392 22 L404 38 L416 30 H600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
);
export function Banners() {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0), [hold, setHold] = useState(false);
  const go = (i: number) => {
    const el = ref.current; if (!el) return;
    const n = (i + SLIDES.length) % SLIDES.length;
    const card = el.children[n] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - (n ? 40 : 0), behavior: "smooth" });
    setAt(n);
  };
  useEffect(() => {
    if (hold || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(at + 1), 5000);
    return () => window.clearTimeout(t);
  }, [at, hold]);
  return (
    <section className="fk-ban" aria-roledescription="carousel" aria-label="Highlights" data-home="banners" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)}>
      <div className="track" ref={ref}>
        {SLIDES.map((s, i) => (
          <a key={s.id} href={s.href} className={`slide ${s.tone}`} aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} data-slide={s.id}>
            <span className="txt">
              <small>{s.tag}</small>
              {i === 0 ? <h1>{s.title}</h1> : <b className="t">{s.title}</b>}
              <span className="big">{s.live && <i className="live" aria-label="Live" />}{s.big}</span>
              <span className="cta">{s.cta} <ArrowRight size={15} /></span>
            </span>
            <span className="bg" aria-hidden="true"><img src={ph(s.photo, 1100, 560)} alt="" onError={hideBroken} loading={i < 3 ? "eager" : "lazy"} decoding="async" /></span>
            <Ecg />
            {s.video && <span className="vid" aria-hidden="true"><Reel name={s.video} /></span>}
          </a>
        ))}
      </div>
      <button type="button" className="nav prev" onClick={() => go(at - 1)} aria-label="Previous"><ChevronLeft size={22} /></button>
      <button type="button" className="nav next" onClick={() => go(at + 1)} aria-label="Next"><ChevronRight size={22} /></button>
      <div className="dots" role="tablist" aria-label="Choose a highlight">{SLIDES.map((s, i) => <button key={s.id} type="button" role="tab" aria-selected={i === at} aria-label={`Highlight ${i + 1}`} className={i === at ? "on" : ""} onClick={() => go(i)} />)}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- "Health essentials for every home": the lowest price in each category, live */
const ESSENTIALS: [string, string][] = [["bp-monitors", "BP monitors"], ["pulse-oximeters", "Pulse oximeters"], ["thermometers", "Thermometers"], ["nebulizers", "Nebulizers"], ["diabetes-care", "Diabetes care"], ["stethoscopes", "Stethoscopes"], ["weighing-scales", "Weighing scales"], ["orthopaedic-supports", "Orthopaedic supports"]];
export function Essentials() {
  const { data } = useStore();
  if (!data) return null;
  const tiles = ESSENTIALS.map(([slug, label]) => {
    const list = data.products.filter((p) => p.category === slug && p.inStock && !p.priceOnRequest && p.price != null && p.image).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    return list.length ? { slug, label, from: list[0]!.price!, image: (list.find((p) => p.featured) ?? list[Math.floor(list.length / 2)] ?? list[0])!.image } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 4);
  if (tiles.length < 4) return null;
  return (
    <section className="hx-wrap fk-band" data-home="essentials-band" aria-label="Health essentials for every home">
      <div className="in">
        <div className="hd"><h2>Health essentials for every home</h2><a href={S("/shop")} className="all" aria-label="Shop all"><ArrowRight size={18} /></a></div>
        <div className="tiles">
          {tiles.map((t) => (
            <a key={t.slug} href={S(`/category/${t.slug}`)} data-cat={t.slug}>
              <span className="im"><ProductImage src={t.image} alt="" width={360} /></span>
              <span className="nm">{t.label}</span>
              <b>From {formatINR(t.from)}</b>
            </a>
          ))}
        </div>
      </div>
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
const price = (p: number | null | undefined, mrp: number | null | undefined) => p == null ? <b className="por">Price on request</b> : <><b>{formatINR(p)}</b>{mrp && mrp > p && <><s>{formatINR(mrp)}</s>{Math.round(((mrp - p) / mrp) * 100) >= 1 && <em>{Math.round(((mrp - p) / mrp) * 100)}% off</em>}</>}</>;
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
    <Row id="latest-products" title="Latest in the store" more={S("/shop")}>
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
    <Row id="latest-books" title="Latest medical books" more={S("/books")}>
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
      <div className="hd"><div><h2>Today in Study</h2></div><a href={portalUrl("study")} className="all" aria-label="Open Aethex Study"><ArrowRight size={18} /></a></div>
      <div className="grid">
        <div className="q"><Suspense fallback={<div className="st-qotd load" />}><QotdCard compact /></Suspense></div>
        <div className="side">
          <a href={ST("/case-of-the-day")} className="tile violet"><CalendarCheck size={20} /><b>Case of the day</b><small>Work it through</small></a>
          <a href={ST("/mock-test")} className="tile blue"><Timer size={20} /><b>Mock test</b><small>With your rank</small></a>
          <a href={ST("/my-library?tab=mastery")} className="tile teal"><Grid3x3 size={20} /><b>Your topic map</b><small>Strong and weak</small></a>
          <a href={ST("/flashcards")} className="tile amber"><BookOpen size={20} /><b>Flashcards</b><small>5 minutes a day</small></a>
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

export function DoctorsAndHospitals() {
  return (
    <section className="hx-wrap hx-dh" data-home="doctors-hospitals" aria-label="Doctors and hospitals">
      <div className="hd"><div><h2>Find a doctor by specialty</h2></div><a href={D("/doctors")} className="all" aria-label="All doctors"><ArrowRight size={18} /></a></div>
      <ul className="specs">{SPECIALTIES.slice(0, 12).map((s) => (
        <li key={s}><a href={D(`/doctors?specialty=${encodeURIComponent(s)}`)} data-spec={s}><span>{s}</span><ChevronRight size={15} className="go" /></a></li>
      ))}</ul>
      <div className="inst">
        <a href={portalUrl("hospitals")} className="cyan"><Hospital size={26} /><span><b>For hospitals and clinics</b><small>Beds, ICU, emergency and consumables. Send one list, get one quotation, with approvals, indents and a stock register.</small></span><ArrowRight size={18} /></a>
        <a href={portalUrl("medicalcolleges")} className="amber"><Building2 size={26} /><span><b>For medical colleges</b><small>Skills labs, anatomy models, lab equipment and textbooks for every department.</small></span><ArrowRight size={18} /></a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */
const FOOT: { title: string; links: [string, string][] }[] = [
  { title: "Patients", links: [["Find a doctor", D("/doctors")], ["Video consultation", D("/doctors?video=1")], ["Ask a doctor, free", D("/ask")], ["Health articles", D("/articles")], ["My appointments", D("/appointments")], ["Vitals tracker", D("/vitals")]] },
  { title: "Store", links: [["Shop all products", S("/shop")], ["BP monitors", S("/category/bp-monitors")], ["Stethoscopes", S("/category/stethoscopes")], ["Medical books", S("/books")], ["Offers", S("/offers")], ["Track an order", S("/orders/track")]] },
  { title: "Study", links: [["NEET-PG questions", ST("/neet-pg")], ["Question of the day", ST("/question-of-the-day")], ["Mock tests", ST("/mock-test")], ["Knowledge Hub", ST("/study-hub/medical-knowledge-hub")], ["Case of the day", ST("/case-of-the-day")], ["Flashcards", ST("/flashcards")]] },
  { title: "Institutions", links: [["For hospitals", portalUrl("hospitals")], ["For medical colleges", portalUrl("medicalcolleges")], ["Request a quotation", portalUrl("hospitals", "/#list")], ["Hospitals directory", portalUrl("hospitals", "/institutions")], ["List your practice", D("/list-your-practice")], ["Cadus, clinical AI", cadusUrl("/")]] },
  { title: "Help", links: [["Contact us", mainUrl("/contact")], ["Shipping", S("/shipping-policy")], ["Returns and replacements", S("/returns-policy")], ["Cancellations", S("/cancellation-policy")], ["Grievances", S("/grievance")], ["Email preferences", mainUrl("/email-preferences")]] },
];
export function HubFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="hx-foot" data-home="footer">
      <div className="hx-wrap">
        <div className="top">
          <div className="brand">
            <Logo />
            <p>Doctors, store, study and hospital supplies. One account. Made in India.</p>
            <a href="mailto:support@aethex.in" className="mail"><Mail size={15} /> support@aethex.in</a>
          </div>
          {FOOT.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3>{c.title}</h3>
              <ul>{c.links.map(([l, h]) => <li key={l}><a href={h}>{l}</a></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="bot">
          <span>© {year} Clavix Technologies Private Limited</span>
          <nav aria-label="Legal"><a href={mainUrl("/privacy-policy")}>Privacy</a><a href={mainUrl("/terms-of-service")}>Terms</a><a href={mainUrl("/medical-disclaimer")}>Medical disclaimer</a><a href={mainUrl("/contact")}>Contact</a></nav>
        </div>
      </div>
      <div className="hx-word" aria-hidden="true">aethex</div>
    </footer>
  );
}

/* ---------------------------------------------------------------- update 97: live numbers (from the catalogue), counting up when seen */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el || !to) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => { const k = Math.min(1, (t - t0) / 1200); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{n.toLocaleString("en-IN")}</span>;
}
export function LiveStats() {
  const { data } = useStore();
  const { data: books } = useBooks();
  if (!data) return null;
  const items: [number, string, ReactNode][] = [
    [data.products.filter((p) => p.inStock).length, "Products in stock", <Package size={20} />],
    [books?.books.length ?? 0, "Medical books", <BookOpen size={20} />],
    [data.brands.length, "Brands", <ShoppingBag size={20} />],
    [data.categories.length, "Categories", <LayoutGrid size={20} />],
  ];
  return (
    <section className="hx-wrap fk-stats" data-home="stats" aria-label="Aethex in numbers">
      {items.filter(([n]) => n > 0).map(([n, l, i]) => <div key={l}><span className="i">{i}</span><b><CountUp to={n} /></b><small>{l}</small></div>)}
      <div className="cod"><span className="i"><Truck size={20} /></span><b>COD</b><small>Cash on delivery</small></div>
    </section>
  );
}
