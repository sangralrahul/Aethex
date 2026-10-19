/**
 * aethex.in: the homepage. Aethex as one platform: Cadus AI, Study and the
 * medical store, in the style of hms.aethex.in (light, Inter, deep teal).
 * Styles: src/site.css (ax-*, home section at the end).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity, ArrowRight, BookOpen, Bone, Brain, Check, ClipboardList, Download, Eye, FileText, FlaskConical,
  GraduationCap, HeartPulse, Hospital, Layers, Pill, Plus, ShieldCheck, Shirt, ShoppingCart, Sparkles, Star,
  Stethoscope, Store, Thermometer, Timer, Truck, UserRound, Wind, type LucideProps,
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

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const all = () => Array.from(root.querySelectorAll<HTMLElement>(".ax-rv:not(.in)"));
    if (still() || typeof IntersectionObserver === "undefined") {
      const show = () => all().forEach((i) => i.classList.add("in"));
      show();
      const mo = new MutationObserver(show);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    const watch = () => all().forEach((i) => { if (!seen.has(i)) { seen.add(i); io.observe(i); } });
    watch();
    // Sections that fill in later (products load after the first paint) are revealed too.
    const mo = new MutationObserver(watch);
    mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ data */

const TESTIMONIALS = [
  { quote: "Aethex has completely changed how I manage patient care. Cadus AI gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.", name: "Dr. Priya Sharma", role: "Cardiologist, Mumbai", initials: "PS" },
  { quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.", name: "Dr. Arjun Mehta", role: "General Physician, Delhi", initials: "AM" },
  { quote: "Cadus AI helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.", name: "Dr. Vikram Nair", role: "Neurologist, Chennai", initials: "VN" },
];

const BRANDS = ["3M Littmann", "OMRON", "Accu-Chek", "MDF Instruments", "Dr. Trust", "SurgiMed", "Heine", "Elsevier", "DAMS", "Tynor"];

const CATEGORIES: { slug: string; name: string; icon: Icon; hint: string }[] = [
  { slug: "stethoscopes", name: "Stethoscopes", icon: Stethoscope, hint: "Littmann, MDF" },
  { slug: "scrubs", name: "Scrubs & uniforms", icon: Shirt, hint: "Tops and sets" },
  { slug: "aprons", name: "Aprons & coats", icon: Layers, hint: "Lab coats, gowns" },
  { slug: "books", name: "Books", icon: BookOpen, hint: "Textbooks, NEET-PG" },
  { slug: "equipment", name: "Medical equipment", icon: Thermometer, hint: "BP, SpO2, sugar" },
  { slug: "surgical", name: "Surgical", icon: Activity, hint: "Sets and blades" },
  { slug: "cardiac-care", name: "Cardiology", icon: HeartPulse, hint: "ECG and monitors" },
  { slug: "orthopaedic", name: "Orthopaedics", icon: Bone, hint: "Braces, rehab" },
  { slug: "neurology", name: "Neurology", icon: Brain, hint: "Hammers, books" },
  { slug: "pulmonology", name: "Pulmonology", icon: Wind, hint: "Nebulisers, spirometry" },
  { slug: "ophthalmology", name: "Ophthalmology", icon: Eye, hint: "Scopes and charts" },
  { slug: "emergency", name: "Emergency", icon: Plus, hint: "First aid, airway" },
];

const TOOLS: [string, string][] = [
  ["Stethoscopes", "t"], ["Cadus AI", "v"], ["NEET-PG", "y"], ["Drug reference", "t"], ["Scrubs", "t"], ["Drug interactions", "r"],
  ["Medical calculators", "t"], ["Mock tests", "y"], ["Lab coats", "t"], ["Case of the day", "v"], ["Medical books", "y"], ["Flashcards", "v"],
  ["BP monitors", "t"], ["Knowledge Hub", "v"], ["Surgical sets", "r"], ["CME Hub", "y"],
];

/* ------------------------------------------------------------------ hero: a slow ECG trace */

function PulseLine() {
  return (
    <svg className="ax-pulse" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="axPulseG" x1="0" x2="1">
          <stop offset="0" stopColor="#2b7a6f" stopOpacity="0" />
          <stop offset=".2" stopColor="#2b7a6f" stopOpacity=".55" />
          <stop offset=".8" stopColor="#6375e0" stopOpacity=".55" />
          <stop offset="1" stopColor="#6375e0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="ax-pulse-bg" d="M0 120 H260 l18 -10 l14 10 H360 l12 22 l20 -110 l22 150 l16 -62 H560 l16 -12 l16 12 H760 l12 22 l20 -110 l22 150 l16 -62 H960 l16 -12 l16 12 H1160 l12 22 l20 -110 l22 150 l16 -62 H1440" />
      <path className="ax-pulse-fg" d="M0 120 H260 l18 -10 l14 10 H360 l12 22 l20 -110 l22 150 l16 -62 H560 l16 -12 l16 12 H760 l12 22 l20 -110 l22 150 l16 -62 H960 l16 -12 l16 12 H1160 l12 22 l20 -110 l22 150 l16 -62 H1440" stroke="url(#axPulseG)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ hero: the product showcase */

const SHOW_TABS = [
  { id: "cadus", label: "Cadus AI", icon: Sparkles },
  { id: "study", label: "Study Hub", icon: GraduationCap },
  { id: "store", label: "Medical Store", icon: Store },
] as const;
type ShowId = (typeof SHOW_TABS)[number]["id"];

function Showcase({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<ShowId>("cadus");
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (still() || paused) return;
    const t = window.setInterval(() => setTab((x) => SHOW_TABS[(SHOW_TABS.findIndex((s) => s.id === x) + 1) % SHOW_TABS.length].id), 6500);
    return () => window.clearInterval(t);
  }, [paused]);
  const items = products.slice(0, 4);
  return (
    <div className="ax-show" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ax-show-tabs" role="tablist" aria-label="Aethex products">
        {SHOW_TABS.map(({ id, label, icon: I }) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <I size={16} /> {label}{tab === id && !paused && !still() && <i className="prog" />}
          </button>
        ))}
      </div>
      <div className="ax-win">
        <div className="ax-win-bar"><i /><i /><i /><span>{tab === "cadus" ? "cadus.aethex.in" : tab === "study" ? "aethex.in/study-hub" : "aethex.in/shop"}</span></div>
        <div className="ax-win-body" key={tab}>
          {tab === "cadus" && (
            <div className="ax-demo-cadus">
              <div className="q">Febrile neutropenia in a 54-year-old on chemotherapy. First hour?</div>
              <div className="a">
                <span className="lab">Bottom line</span>
                <p>Treat as an emergency: take cultures and start empirical broad-spectrum IV antibiotics within 60 minutes.</p>
                <ul><li>Blood cultures first, but never delay antibiotics for them</li><li>Screen for sepsis: lactate, blood pressure, urine output</li><li>Choose the antibiotic by local policy and allergies</li></ul>
                <div className="chips"><span className="ok"><ShieldCheck size={12} /> Safety reviewed</span><span><BookOpen size={12} /> 3 sources</span></div>
              </div>
            </div>
          )}
          {tab === "study" && (
            <div className="ax-demo-study">
              <div className="mcq">
                <small>NEET-PG · Pharmacology</small>
                <b>Drug of choice for absence seizures in a child?</b>
                {["Phenytoin", "Ethosuximide", "Carbamazepine", "Phenobarbitone"].map((o, k) => <span key={o} className={k === 1 ? "right" : ""}>{String.fromCharCode(65 + k)}. {o}{k === 1 && <Check size={14} />}</span>)}
              </div>
              <div className="prog-card">
                <small>This week</small>
                {[["Pharmacology", 82], ["Medicine", 64], ["Anatomy", 47]].map(([s, v]) => <div key={s as string}><span>{s}</span><i><em style={{ width: `${v}%` }} /></i><b>{v}%</b></div>)}
              </div>
            </div>
          )}
          {tab === "store" && (
            <div className="ax-demo-store">
              {items.map((p) => (
                <div key={p.id} className="it"><img src={p.imageUrl} alt="" loading="lazy" /><small>{p.brand}</small><b>{p.name}</b><span>{formatINR(p.price)}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ product card */

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
          <span className="pr">{formatINR(p.price)}{off > 0 && p.originalPrice && <s>{formatINR(p.originalPrice)}</s>}</span>
          <button type="button" className="add" onClick={() => onAdd(p.id)} disabled={adding} aria-label={`Add ${p.name} to cart`}><ShoppingCart size={15} /> Add</button>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ page */

export default function Home() {
  useSeo({
    title: "Aethex — AI-Powered Medical Education & Clinical Tools in India",
    description: "Cadus AI clinical assistant, NEET PG study hub, drug references and genuine medical supplies — one platform built for Indian doctors and medical students.",
    path: "/",
  });
  const root = useReveal();
  const sessionId = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useListProducts({ limit: 8, featured: true });
  const products: Product[] = useMemo(() => ((data as { products?: Product[] } | undefined)?.products ?? []).slice(0, 8), [data]);
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
    <div className="ax-home" ref={root}>
      {/* hero */}
      <section className="ax-hero">
        <PulseLine />
        <div className="ax-wrap ax-hero-in">
          <Link href="/downloads" className="ax-pill ax-rv"><b>Cadus for desktop</b> is here <span>Windows &amp; Linux</span></Link>
          <h1 className="ax-rv ax-d1">Everything a doctor needs,<br /><span>in one place</span></h1>
          <p className="ax-lead ax-rv ax-d2">Cadus AI for clinical answers with sources, a Study Hub for NEET-PG and beyond, and a store for genuine medical supplies. One account for all of it.</p>
          <div className="ax-cta ax-rv ax-d3">
            <a className="ax-btn teal lg" href={cadusUrl("/")}><Sparkles size={18} /> Try Cadus AI</a>
            <Link className="ax-btn lg" href="/shop">Shop medical supplies</Link>
          </div>
          <div className="ax-trust ax-rv ax-d4">
            <span><ShieldCheck size={16} /> Genuine, brand-sourced products</span>
            <span><Truck size={16} /> Delivered across India</span>
            <span><UserRound size={16} /> One account across Aethex</span>
          </div>
        </div>
        <div className="ax-wrap ax-rv ax-d2"><Showcase products={products} /></div>
      </section>

      {/* tools marquee */}
      <section className="ax-marq" aria-label="What's on Aethex">
        <div className="track">
          {[0, 1].map((n) => <div className="row" key={n} aria-hidden={n === 1}>{TOOLS.map(([t, c]) => <span key={t} className="chip"><i className={c} /> {t}</span>)}</div>)}
        </div>
      </section>

      {/* three products */}
      <section className="ax-sec">
        <div className="ax-wrap">
          <div className="ax-center ax-rv">
            <p className="ax-eyebrow c">The Aethex platform</p>
            <h2 className="ax-h2">One account. Three ways we help.</h2>
            <p className="ax-sub">From the ward to the exam hall to your next stethoscope.</p>
          </div>
          <div className="ax-trio">
            {[
              { k: "cadus", icon: Sparkles, name: "Cadus AI", tag: "Clinical intelligence", desc: "Clinical answers with sources and a second-model safety review, dose cards, drug interactions, lab reading and SOAP notes.", pts: ["Answers in seconds, with sources", "Doses and red flags checked", "On the web, Windows and Linux"], href: cadusUrl("/"), cta: "Open Cadus AI", ext: true },
              { k: "study", icon: GraduationCap, name: "Study Hub", tag: "NEET-PG and beyond", desc: "Subject notes, previous-year questions, mock tests, flashcards and a clinical case every day, for NEET-PG, NExT, FMGE and USMLE.", pts: ["Mock tests and PYQs", "Medical Knowledge Hub", "Case of the day"], href: "/study-hub", cta: "Explore Study Hub" },
              { k: "store", icon: Store, name: "Medical Store", tag: "Genuine supplies", desc: "Stethoscopes, scrubs, lab coats, books, instruments and equipment from brands you trust, delivered to your door.", pts: ["Littmann, OMRON, Accu-Chek and more", "Easy returns", "Track every order"], href: "/shop", cta: "Shop now" },
            ].map(({ k, icon: I, name, tag, desc, pts, href, cta, ext }, i) => {
              const body = <>
                <span className={`ic ${k}`}><I size={22} /></span>
                <small>{tag}</small>
                <h3>{name}</h3>
                <p>{desc}</p>
                <ul>{pts.map((p) => <li key={p}><Check size={15} /> {p}</li>)}</ul>
                <span className="go">{cta} <ArrowRight size={16} /></span>
              </>;
              return ext
                ? <a key={k} href={href} className={`ax-card ax-rv ax-d${i + 1}`}>{body}</a>
                : <Link key={k} href={href} className={`ax-card ax-rv ax-d${i + 1}`}>{body}</Link>;
            })}
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="ax-sec ax-band">
        <div className="ax-wrap">
          <div className="ax-head-row ax-rv">
            <div><p className="ax-eyebrow">Medical Store</p><h2 className="ax-h2">Shop by category</h2></div>
            <Link href="/shop" className="ax-link">All products <ArrowRight size={16} /></Link>
          </div>
          <div className="ax-cats">
            {CATEGORIES.map(({ slug, name, icon: I, hint }, k) => (
              <Link key={slug} href={`/category/${slug}`} className={`ax-cat ax-rv ax-d${(k % 4) + 1}`}>
                <span className="ic"><I size={20} /></span>
                <b>{name}</b>
                <small>{hint}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* featured products */}
      <section className="ax-sec">
        <div className="ax-wrap">
          <div className="ax-head-row ax-rv">
            <div><p className="ax-eyebrow">Popular now</p><h2 className="ax-h2">Doctors' favourites</h2></div>
            <Link href="/shop" className="ax-link">See everything <ArrowRight size={16} /></Link>
          </div>
          <div className="ax-prods">
            {products.map((p, k) => <div key={p.id} className={`ax-rv ax-d${(k % 4) + 1}`}><ProductTile p={p} onAdd={add} adding={addToCart.isPending} /></div>)}
          </div>
          <div className="ax-brands ax-rv">
            <small>Brands on Aethex</small>
            <div>{BRANDS.map((b) => <span key={b}>{b}</span>)}</div>
          </div>
        </div>
      </section>

      {/* Cadus AI */}
      <section className="ax-sec ax-band">
        <div className="ax-wrap ax-split">
          <div className="ax-rv">
            <p className="ax-eyebrow">Cadus AI</p>
            <h2 className="ax-h2">A clinical assistant that shows its sources</h2>
            <p className="ax-sub">Ask about a patient, a dose or a guideline. Cadus answers with the bottom line first, cites its sources and checks doses and red flags before you read the answer.</p>
            <ul className="ax-ticks">
              {["Differentials, doses and drug interactions", "Lab and ECG interpretation", "SOAP notes, discharge summaries and letters", "Offline medical library when the internet drops"].map((t) => <li key={t}><Check size={16} /> {t}</li>)}
            </ul>
            <div className="ax-cta l">
              <a className="ax-btn teal lg" href={cadusUrl("/")}><Sparkles size={18} /> Try Cadus AI free</a>
              <Link className="ax-btn lg" href="/downloads"><Download size={18} /> Desktop app</Link>
            </div>
          </div>
          <div className="ax-rv ax-d2">
            <div className="ax-answer">
              <div className="top"><span className="tile"><CadusMark size={16} variant="mono" color="currentColor" /></span><b>Cadus</b><span className="model">Cadus Medius 3.1</span></div>
              <div className="q">Warfarin and clarithromycin together: is it safe?</div>
              <span className="lab">Bottom line</span>
              <p className="bl">A significant interaction: clarithromycin raises the INR and the risk of bleeding.</p>
              <ul><li>Prefer another antibiotic if one is suitable</li><li>If it is used, check the INR within 3 to 5 days</li><li>Tell the patient which bleeding signs to watch for</li></ul>
              <div className="chips"><span className="ok"><ShieldCheck size={12} /> Safety reviewed</span><span><BookOpen size={12} /> Sources cited</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Study */}
      <section className="ax-sec">
        <div className="ax-wrap ax-split rev">
          <div className="ax-rv ax-d2">
            <div className="ax-case">
              <div className="top"><span><ClipboardList size={15} /> Case of the day</span><em>{todays.specialty}</em></div>
              <h3>{todays.title}</h3>
              <p>{todays.patient_info.age}-year-old {todays.patient_info.gender.toLowerCase()}: {todays.patient_info.chief_complaint}</p>
              <div className="opts">{todays.options.map((o) => <span key={o.id}><b>{o.id}</b> {o.text}</span>)}</div>
              <Link href="/case-of-the-day" className="ax-link">Solve today's case <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className="ax-rv">
            <p className="ax-eyebrow">Study Hub</p>
            <h2 className="ax-h2">Prepare smarter for NEET-PG and beyond</h2>
            <p className="ax-sub">Everything you need between lectures and postings, in one place and free to start.</p>
            <div className="ax-study">
              {[
                { href: "/neet-pg", icon: FileText, t: "NEET-PG", d: "Subjects, PYQs and plans" },
                { href: "/mock-test", icon: Timer, t: "Mock tests", d: "Timed practice exams" },
                { href: "/study-hub/medical-knowledge-hub", icon: Brain, t: "Knowledge Hub", d: "Subjects and conditions" },
                { href: "/flashcards", icon: Layers, t: "Flashcards", d: "Spaced revision" },
                { href: "/drug-reference", icon: Pill, t: "Drug reference", d: "Doses and monographs" },
                { href: "/drug-interaction-checker", icon: FlaskConical, t: "Interactions", d: "Check combinations" },
              ].map(({ href, icon: I, t, d }) => <Link key={href} href={href}><span className="ic"><I size={18} /></span><span><b>{t}</b><small>{d}</small></span><ArrowRight size={15} className="ar" /></Link>)}
            </div>
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="ax-sec ax-band">
        <div className="ax-wrap">
          <div className="ax-center ax-rv">
            <p className="ax-eyebrow c">Testimonials</p>
            <h2 className="ax-h2">What doctors are saying</h2>
          </div>
          <div className="ax-quotes">
            {TESTIMONIALS.map((t, i) => (
              <figure key={t.name} className={`ax-quote ax-rv ax-d${i + 1}`}>
                <span className="stars">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} fill="currentColor" />)}</span>
                <blockquote>"{t.quote}"</blockquote>
                <figcaption><span className="av">{t.initials}</span><span><b>{t.name}</b><small>{t.role}</small></span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* apps */}
      <section className="ax-sec">
        <div className="ax-wrap">
          <div className="ax-center ax-rv">
            <p className="ax-eyebrow c">Apps</p>
            <h2 className="ax-h2">Aethex on your computer</h2>
          </div>
          <div className="ax-apps">
            <Link href="/downloads" className="ax-app ax-rv ax-d1">
              <span className="tile"><CadusMark size={26} variant="mono" color="currentColor" /></span>
              <div><small>For doctors and students</small><h3>Cadus for desktop</h3><p>Cadus AI in its own window, one click from the taskbar. Windows (x64 and ARM) and Linux; macOS coming soon.</p><span className="go">Download Cadus <ArrowRight size={16} /></span></div>
            </Link>
            <a href="https://hms.aethex.in" className="ax-app ax-rv ax-d2" rel="noopener">
              <span className="tile"><Hospital size={26} /></span>
              <div><small>For hospitals and clinics</small><h3>AETHEX for hospitals</h3><p>OPD, admissions, beds, pharmacy, lab and GST billing on the same live records, with Cadus AI built in.</p><span className="go">Visit hms.aethex.in <ArrowRight size={16} /></span></div>
            </a>
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="ax-wrap" style={{ paddingBottom: 96 }}>
        <div className="ax-closing ax-rv">
          <h2 className="ax-h2">Start with one account</h2>
          <p className="ax-sub">Free to join. Use it for Cadus AI, the Study Hub and your orders.</p>
          <div className="ax-cta">
            <a className="ax-btn teal lg" href={cadusUrl("/")}><Sparkles size={18} /> Try Cadus AI</a>
            <Link className="ax-btn lg" href="/study-hub">Explore Study Hub</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
