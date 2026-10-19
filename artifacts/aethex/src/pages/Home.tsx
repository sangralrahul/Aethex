/**
 * aethex.in: the homepage. A storefront first (categories, deals, products),
 * with Cadus AI and the Study Hub alongside, in the site style (light, Inter,
 * deep teal). Styles: src/site.css (home section, classes ax-h-*).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BadgeCheck, BookOpen, Brain, Calculator, ChevronLeft, ChevronRight, ClipboardList, CreditCard,
  FlaskConical, Layers, Pill, RotateCcw, Search, ShieldCheck, ShoppingCart, Sparkles, Star, Timer, Truck,
  type LucideProps,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { useSeo } from "@/hooks/use-seo";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { useAddToCart, useListProducts, type Product } from "@workspace/api-client-react";
import { formatINR } from "@/lib/utils";
import { cadusUrl } from "@/lib/host";
import { getTodaysCase } from "@/data/clinicalCases";

type Icon = ComponentType<LucideProps>;
const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const img = (f: string) => `/product-images/${f}.jpg`;

/* ------------------------------------------------------------------ data */

const TESTIMONIALS = [
  { quote: "Aethex has completely changed how I manage patient care. Cadus AI gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.", name: "Dr. Priya Sharma", role: "Cardiologist, Mumbai", initials: "PS" },
  { quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.", name: "Dr. Arjun Mehta", role: "General Physician, Delhi", initials: "AM" },
  { quote: "Cadus AI helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.", name: "Dr. Vikram Nair", role: "Neurologist, Chennai", initials: "VN" },
];

const BRANDS = ["3M Littmann", "OMRON", "Accu-Chek", "MDF Instruments", "Dr. Trust", "SurgiMed", "Heine", "Elsevier", "DAMS", "Tynor"];

const QUICK = [
  { slug: "stethoscopes", name: "Stethoscopes" }, { slug: "scrubs", name: "Scrubs" }, { slug: "aprons", name: "Lab coats" },
  { slug: "books", name: "Books" }, { slug: "equipment", name: "Equipment" }, { slug: "surgical", name: "Surgical" },
  { slug: "cardiac-care", name: "Cardiology" }, { slug: "orthopaedic", name: "Orthopaedics" }, { slug: "paediatric", name: "Paediatrics" },
  { slug: "gynaecology", name: "Gynaecology" }, { slug: "ent", name: "ENT" }, { slug: "emergency", name: "Emergency" },
];

const CATEGORIES = [
  { slug: "stethoscopes", name: "Stethoscopes", pic: "stethoscope" },
  { slug: "scrubs", name: "Scrubs", pic: "scrub-top" },
  { slug: "aprons", name: "Lab coats & aprons", pic: "lab-coat" },
  { slug: "books", name: "Medical books", pic: "medical-book" },
  { slug: "equipment", name: "BP & monitoring", pic: "bp-monitor" },
  { slug: "surgical", name: "Surgical instruments", pic: "surgical-set" },
  { slug: "cardiac-care", name: "Cardiology", pic: "ecg" },
  { slug: "orthopaedic", name: "Orthopaedics", pic: "knee-brace" },
  { slug: "neurology", name: "Neurology", pic: "reflex-hammer" },
  { slug: "pulmonology", name: "Respiratory", pic: "nebulizer" },
  { slug: "ophthalmology", name: "Ophthalmology", pic: "ophthalmoscope" },
  { slug: "emergency", name: "Emergency & first aid", pic: "first-aid" },
];

const SPECIALTIES = [
  ["anaesthesia", "Anaesthesia"], ["cardiac-care", "Cardiology"], ["dermatology", "Dermatology"], ["endocrinology", "Endocrinology"],
  ["ent", "ENT"], ["gastroenterology", "Gastroenterology"], ["gynaecology", "Obstetrics & gynaecology"], ["nephrology", "Nephrology"],
  ["neurology", "Neurology"], ["oncology", "Oncology"], ["ophthalmology", "Ophthalmology"], ["orthopaedic", "Orthopaedics"],
  ["paediatric", "Paediatrics"], ["physiotherapy", "Physiotherapy"], ["psychiatry", "Psychiatry"], ["pulmonology", "Pulmonology"],
  ["radiology", "Radiology"], ["sports-medicine", "Sports medicine"], ["urology", "Urology"], ["nutrition", "Nutrition"],
];

const SLIDES = [
  { tone: "teal", kicker: "Stethoscopes", title: "Hear every murmur clearly", text: "3M Littmann, MDF and more, for students, residents and consultants.", cta: "Shop stethoscopes", href: "/category/stethoscopes", pic: "stethoscope" },
  { tone: "blue", kicker: "Scrubs & lab coats", title: "Built for the long shift", text: "Stretch scrubs, fitted sets and full-length lab coats in every size.", cta: "Shop apparel", href: "/category/scrubs", pic: "scrub-set" },
  { tone: "sand", kicker: "Books & test series", title: "Everything for NEET-PG 2026", text: "Standard textbooks, grand test series and quick-revision guides.", cta: "Shop books", href: "/category/books", pic: "test-books" },
];

const RAILS = [
  { id: "best", label: "Best sellers", category: undefined },
  { id: "stethoscopes", label: "Stethoscopes", category: "stethoscopes" },
  { id: "scrubs", label: "Scrubs", category: "scrubs" },
  { id: "books", label: "Books", category: "books" },
  { id: "equipment", label: "Equipment", category: "equipment" },
] as const;

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
          <img src={img(s.pic)} alt="" />
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

function ProductTile({ p, onAdd, adding }: { p: Product; onAdd: (id: number) => void; adding: boolean }) {
  const price = Number(p.price), was = Number(p.originalPrice ?? 0);
  const off = was > price ? Math.round(((was - price) / was) * 100) : 0;
  return (
    <article className="ax-prod">
      <Link href={`/products/${p.id}`} className="img">
        <img src={p.imageUrl} alt={p.name} loading="lazy" />
        {off > 0 && <span className="off">{off}% off</span>}
      </Link>
      <div className="txt">
        <small>{p.brand}</small>
        <Link href={`/products/${p.id}`} className="nm">{p.name}</Link>
        <span className="rt"><Star size={13} fill="currentColor" /> {Number(p.rating).toFixed(1)} <em>({p.reviewCount.toLocaleString("en-IN")})</em></span>
        <div className="row">
          <span className="pr">{formatINR(price)}{off > 0 && <s>{formatINR(was)}</s>}</span>
          <button type="button" className="add" onClick={() => onAdd(p.id)} disabled={adding} aria-label={`Add ${p.name} to cart`}><ShoppingCart size={15} /></button>
        </div>
      </div>
    </article>
  );
}

function ProductRail({ onAdd, adding }: { onAdd: (id: number) => void; adding: boolean }) {
  const [rail, setRail] = useState<(typeof RAILS)[number]["id"]>("best");
  const cur = RAILS.find((r) => r.id === rail)!;
  const { data, isLoading } = useListProducts(cur.category ? { category: cur.category, limit: 10 } : { limit: 10, featured: true });
  const products: Product[] = ((data as { products?: Product[] } | undefined)?.products ?? []).slice(0, 10);
  const track = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="ax-h-sec">
      <div className="ax-wrap">
        <div className="ax-h-title">
          <h2>Popular with doctors</h2>
          <div className="ax-h-tabs" role="tablist">
            {RAILS.map((r) => <button key={r.id} role="tab" aria-selected={rail === r.id} className={rail === r.id ? "on" : ""} onClick={() => { setRail(r.id); track.current?.scrollTo({ left: 0 }); }}>{r.label}</button>)}
          </div>
          <div className="ax-h-arrows">
            <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="ax-h-rail" ref={track}>
          {isLoading && !products.length
            ? Array.from({ length: 5 }, (_, k) => <div key={k} className="ax-prod sk" />)
            : products.map((p) => <ProductTile key={p.id} p={p} onAdd={onAdd} adding={adding} />)}
        </div>
        <div className="ax-h-more"><Link href={cur.category ? `/category/${cur.category}` : "/shop"} className="ax-link">View all {cur.id === "best" ? "products" : cur.label.toLowerCase()} <ArrowRight size={16} /></Link></div>
      </div>
    </section>
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
  const sessionId = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addToCart = useAddToCart();
  const todays = useMemo(() => getTodaysCase(), []);
  const add = (productId: number) => {
    if (!sessionId) return;
    addToCart.mutate({ data: { productId, sessionId, quantity: 1 } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: "Added to cart" }); },
      onError: () => toast({ variant: "destructive", title: "Couldn't add to cart", description: "Please try again." }),
    });
  };

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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stethoscopes, scrubs, books, equipment…" aria-label="Search products" />
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
            <li><BadgeCheck size={22} /><span><b>Genuine products</b><small>From brands and authorised sellers</small></span></li>
            <li><Truck size={22} /><span><b>Delivery across India</b><small>Track every order to your door</small></span></li>
            <li><RotateCcw size={22} /><span><b>Easy returns</b><small>Simple returns on eligible items</small></span></li>
            <li><CreditCard size={22} /><span><b>Secure checkout</b><small>UPI, cards and net banking</small></span></li>
          </ul>
        </div>
      </section>

      {/* categories */}
      <section className="ax-h-sec">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>Shop by category</h2><Link href="/shop" className="ax-link">All categories <ArrowRight size={16} /></Link></div>
          <div className="ax-h-cats">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="ax-h-cat">
                <span className="pic"><img src={img(c.pic)} alt="" loading="lazy" /></span>
                <b>{c.name}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* products */}
      <ProductRail onAdd={add} adding={addToCart.isPending} />

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
                <Link href="/downloads" className="ax-btn ghost-l">Desktop app</Link>
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

      {/* specialties */}
      <section className="ax-h-sec">
        <div className="ax-wrap">
          <div className="ax-h-title"><h2>Shop by specialty</h2></div>
          <div className="ax-h-spec">
            {SPECIALTIES.map(([slug, name]) => <Link key={slug} href={`/category/${slug}`}>{name}</Link>)}
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

      {/* brands */}
      <section className="ax-h-brands">
        <div className="ax-wrap">
          <small>Trusted brands</small>
          <div>{BRANDS.map((b) => <span key={b}>{b}</span>)}</div>
        </div>
      </section>
    </div>
  );
}
