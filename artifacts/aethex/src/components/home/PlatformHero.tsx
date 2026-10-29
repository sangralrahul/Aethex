/**
 * The top of aethex.in (update 55): a dark hero with a live Cadus demo that types its answers, counters
 * that count up, a scrolling strip of real products, a tabbed showcase of the three products, a brand
 * marquee, and scroll reveals. Styles: src/site-pro.css (ax-dh-*, ax-mq-*, ax-sc-*, ax-rv).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, BadgeCheck, Banknote, BookOpen, Check, Flame, GraduationCap, Layers, ShieldCheck, ShoppingBag, Sparkles, Stethoscope, Truck,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { ProductImage } from "@/components/store/ProductImage";
import { useStore } from "@/lib/store/api";
import { itemHref } from "@/lib/store/bookdata";
import type { ProductSummary } from "@/lib/store/types";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";
import { cadusUrl } from "@/lib/host";

/** Numbers that come from the app itself (tools and assistants are counted in Cadus). */
export const CADUS_TOOLS = 320;
export const CREW_ASSISTANTS = 158;

const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ helpers */

/** Adds .in to every [data-rv] element inside root as it scrolls into view (fade and slide up). */
export function useReveal(dep: unknown = null) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rv]:not(.in)"));
    if (still() || typeof IntersectionObserver === "undefined") { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    // Anything already on screen, or missed, shows within a moment regardless.
    const t = window.setTimeout(() => els.forEach((e) => { const r = e.getBoundingClientRect(); if (r.top < window.innerHeight) e.classList.add("in"); }), 1200);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, [dep]);
}

/** A number that counts up once it is on screen. */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) return;
    if (still()) { setN(to); return; }
    const el = ref.current;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const step = (t: number) => { const p = Math.min(1, (t - t0) / 1400); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    if (!el || typeof IntersectionObserver === "undefined") { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <b ref={ref} data-count={to}>{n.toLocaleString("en-IN")}{suffix}</b>;
}

/* ------------------------------------------------------------------ the live Cadus demo */

const DEMOS = [
  { q: "Warfarin with clarithromycin — safe?", a: "Clarithromycin raises the INR. Prefer another antibiotic, or check the INR in 3 to 5 days.", tag: "Drug interaction" },
  { q: "Adult DKA: first-hour fluids?", a: "0.9% saline 1 L over the first hour, then 1 L over 2 hours; start fixed-rate insulin 0.1 units/kg/h.", tag: "Emergency" },
  { q: "Drug of choice for absence seizures?", a: "Ethosuximide (valproate if there are also generalised tonic-clonic seizures). Avoid carbamazepine.", tag: "NEET-PG" },
];

export function LiveDemo() {
  const [k, setK] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "thinking" | "answer">("typing");
  const demo = DEMOS[k];
  useEffect(() => {
    if (still()) { setTyped(demo.q); setPhase("answer"); const t = window.setTimeout(() => setK((x) => (x + 1) % DEMOS.length), 7000); return () => window.clearTimeout(t); }
    setTyped(""); setPhase("typing");
    let i = 0;
    const timers: number[] = [];
    const tick = window.setInterval(() => {
      i++;
      setTyped(demo.q.slice(0, i));
      if (i >= demo.q.length) {
        window.clearInterval(tick);
        timers.push(window.setTimeout(() => setPhase("thinking"), 300));
        timers.push(window.setTimeout(() => setPhase("answer"), 1500));
        timers.push(window.setTimeout(() => setK((x) => (x + 1) % DEMOS.length), 7200));
      }
    }, 38);
    return () => { window.clearInterval(tick); timers.forEach((t) => window.clearTimeout(t)); };
  }, [k]);
  return (
    <div className="ax-dh-demo" data-home="demo" aria-label="Cadus answering a clinical question">
      <div className="bar"><span className="mk"><CadusMark size={16} variant="mono" color="currentColor" /></span><b>Cadus</b><em><i /> Live</em></div>
      <div className="msgs">
        <div className="me"><span>{typed}{phase === "typing" && <i className="caret" />}</span></div>
        {phase === "thinking" && <div className="think" data-home="thinking"><i /><i /><i /> Checking guidelines and doses…</div>}
        {phase === "answer" && (
          <div className="ans" key={k} data-home="answer">
            <small>{demo.tag} · Bottom line</small>
            <p>{demo.a}</p>
            <div className="meta"><span className="ok"><ShieldCheck size={12} /> Safety reviewed</span><span className="src">3 sources</span></div>
          </div>
        )}
      </div>
      <div className="input"><span>Ask a clinical question…</span><span className="send"><ArrowRight size={15} /></span></div>
      <div className="dots">{DEMOS.map((d, i) => <button key={d.q} type="button" className={i === k ? "on" : ""} onClick={() => setK(i)} aria-label={`Example ${i + 1}`} />)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ hero */

export function PlatformHero() {
  const { data: store } = useStore();
  const off = (p: ProductSummary) => ((p.mrp ?? 0) - (p.price ?? 0)) / (p.mrp || 1);
  const pick = useMemo(() => store?.products.filter((p) => p.featured && p.image && !p.priceOnRequest && p.inStock && p.price != null).sort((a, b) => off(b) - off(a))[0], [store]);
  return (
    <section className="ax-dh" data-home="platform">
      <div className="ax-dh-bg" aria-hidden="true"><i /><i /><i /><span className="grid" /><span className="stars" /></div>
      <div className="ax-wrap ax-dh-grid">
        <div className="ax-dh-copy">
          <span className="ax-dh-chip"><Sparkles size={14} /> For India's doctors and medical students <ArrowRight size={13} /></span>
          <h1>Everything a doctor needs, <span>in one place.</span></h1>
          <p>Clinical answers you can check, {CADUS_TOOLS}+ bedside tools, exam preparation for every subject, and genuine medical supplies delivered across India — with one account.</p>
          <div className="ax-dh-ctas">
            <a href={cadusUrl("/")} className="ax-btn lg glow" data-home="cta-cadus">Try Cadus free <ArrowRight size={18} /></a>
            <Link href="/shop" className="ax-btn lg glass" data-home="cta-shop"><ShoppingBag size={18} /> Shop medical supplies</Link>
          </div>
          <ul className="ax-dh-trust">
            <li><Check size={15} /> Genuine brands only</li>
            <li><Check size={15} /> Cash on delivery</li>
            <li><Check size={15} /> Free delivery from {formatINR(FREE_DELIVERY_FROM)}</li>
          </ul>
        </div>
        <div className="ax-dh-art">
          <LiveDemo />
          {pick && pick.price != null && (
            <Link href={itemHref(pick.id, pick.slug)} className="ax-dh-float prod" aria-label={pick.name}>
              <span className="pic"><ProductImage src={pick.image} width={240} /></span>
              <span className="tx"><small>{store?.brandName(pick.brand)}</small><b>{pick.name}</b><em>{formatINR(pick.price)}{pick.mrp != null && pick.mrp > pick.price && <s>{formatINR(pick.mrp)}</s>}</em></span>
            </Link>
          )}
          <div className="ax-dh-float streak" aria-hidden="true"><Flame size={18} /><span><b>12-day streak</b><small>NEET-PG daily drill</small></span></div>
        </div>
      </div>
      <div className="ax-wrap">
        <dl className="ax-dh-stats" data-home="stats">
          <div><dt><CountUp to={store?.products.length ?? 0} /></dt><dd>genuine products</dd></div>
          <div><dt><CountUp to={store?.brands.length ?? 0} /></dt><dd>verified brands</dd></div>
          <div><dt><CountUp to={CADUS_TOOLS} suffix="+" /></dt><dd>clinical tools in Cadus</dd></div>
          <div><dt><CountUp to={CREW_ASSISTANTS} /></dt><dd>study and specialist assistants</dd></div>
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ product strip */

/** Two rows of real products scrolling in opposite directions; hover pauses. */
export function ProductMarquee() {
  const { data: store } = useStore();
  const rows = useMemo(() => {
    if (!store) return [[], []] as ProductSummary[][];
    const seen = new Set<string>();
    const pool = store.products.filter((p) => p.image && !p.priceOnRequest && p.price != null).sort((a, b) => Number(b.featured) - Number(a.featured)).filter((p) => { const k = `${p.brand}:${p.category}:${p.name.slice(0, 12)}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 28);
    return [pool.filter((_, i) => i % 2 === 0), pool.filter((_, i) => i % 2 === 1)];
  }, [store]);
  if (!store || !rows[0].length) return null;
  return (
    <section className="ax-mq-sec" data-rv data-home="marquee">
      <div className="ax-wrap"><div className="ax-sec-head"><span className="ax-kicker">Medical store</span><h2>Genuine instruments, delivered across India</h2><p>From brands doctors already trust — with cash on delivery and replacement if anything arrives damaged.</p></div></div>
      {rows.map((row, r) => (
        <div key={r} className={`ax-mq ${r ? "rev" : ""}`}>
          <div className="ax-mq-track">
            {[...row, ...row].map((p, i) => (
              <Link key={`${p.id}-${i}`} href={itemHref(p.id, p.slug)} className="ax-mq-item" tabIndex={i >= row.length ? -1 : 0} aria-hidden={i >= row.length}>
                <span className="pic"><ProductImage src={p.image} width={240} /></span>
                <span className="tx"><small>{store.brandName(p.brand)}</small><b>{p.name}</b><em>{formatINR(p.price ?? 0)}</em></span>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="ax-wrap ax-mq-cta"><Link href="/shop" className="ax-btn dark lg">Shop all {store.products.length} products <ArrowRight size={18} /></Link></div>
    </section>
  );
}

/* ------------------------------------------------------------------ showcase */

const TABS = [
  { key: "cadus", icon: Sparkles, label: "Cadus", title: "Clinical AI with sources", text: "Differentials, doses, interactions, lab and ECG reading, notes and letters — safety-reviewed and cited.", points: ["320+ bedside tools", "Indian protocols built in", "Web, phone and desktop"], cta: "Try Cadus free", href: "cadus" },
  { key: "store", icon: ShoppingBag, label: "Medical store", title: "Genuine instruments and supplies", text: "BP monitors, stethoscopes, diagnostics, diabetes care and supports, delivered across India.", points: ["Cash on delivery", "Replacement if damaged or defective", "Bulk lists for hospitals and colleges"], cta: "Shop now", href: "/shop" },
  { key: "study", icon: GraduationCap, label: "Study Hub", title: "Prepare for NEET-PG and beyond", text: "Question banks, mock tests, flashcards and Cadus Crew tutors for every subject and exam.", points: ["NEET-PG, NExT, FMGE, USMLE", "OSCE stations and long answers", "Daily drill and streaks"], cta: "Explore Study Hub", href: "/study-hub" },
] as const;
const TAB_MS = 7000;

export function Showcase() {
  const [tab, setTab] = useState(0);
  const [hold, setHold] = useState(false);
  const { data: store } = useStore();
  useEffect(() => {
    if (still() || hold) return;
    const t = window.setTimeout(() => setTab((x) => (x + 1) % TABS.length), TAB_MS);
    return () => window.clearTimeout(t);
  }, [tab, hold]);
  const products = useMemo(() => store?.products.filter((p) => p.featured && p.image && !p.priceOnRequest && p.price != null).slice(0, 4) ?? [], [store]);
  const cur = TABS[tab];
  const cta = cur.href === "cadus" ? <a href={cadusUrl("/")} className="ax-btn teal">{cur.cta} <ArrowRight size={16} /></a> : <Link href={cur.href} className="ax-btn teal">{cur.cta} <ArrowRight size={16} /></Link>;
  return (
    <section className="ax-h-sec ax-sc-sec" data-rv data-home="showcase" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="ax-wrap">
        <div className="ax-sec-head"><span className="ax-kicker">One platform</span><h2>Three products, one account</h2><p>Ask Cadus, revise what you learned, and buy what you need for the ward or the clinic.</p></div>
        <div className="ax-sc">
          <div className="ax-sc-tabs" role="tablist" aria-label="Aethex products">
            {TABS.map((t, i) => (
              <button key={t.key} type="button" role="tab" aria-selected={i === tab} className={`ax-sc-tab ${t.key} ${i === tab ? "on" : ""}`} onClick={() => setTab(i)} data-sc={t.key}>
                <span className="ic"><t.icon size={20} /></span>
                <span className="tx"><b>{t.label}</b><small>{t.title}</small></span>
                {i === tab && !hold && !still() && <span className="prog" style={{ animationDuration: `${TAB_MS}ms` }} />}
              </button>
            ))}
          </div>
          <div className={`ax-sc-panel ${cur.key}`} key={cur.key} role="tabpanel" data-sc-panel={cur.key}>
            <div className="copy">
              <h3>{cur.title}</h3>
              <p>{cur.text}</p>
              <ul>{cur.points.map((x) => <li key={x}><Check size={15} /> {x}</li>)}</ul>
              {cta}
            </div>
            <div className="vis" aria-hidden="true">
              {cur.key === "cadus" && (
                <div className="v-cadus">
                  <div className="row me">Chest pain, ST elevation in II, III, aVF — next steps?</div>
                  <div className="row ai"><small>Bottom line</small><p>Inferior STEMI: aspirin 300 mg, ticagrelor 180 mg, primary PCI within 120 minutes; right-sided leads for RV infarct.</p><span className="ok"><ShieldCheck size={12} /> Safety reviewed · 4 sources</span></div>
                  <div className="chips"><span><Stethoscope size={13} /> Chest Pain & ACS</span><span><Layers size={13} /> HEART score</span><span><BookOpen size={13} /> ESC 2023</span></div>
                </div>
              )}
              {cur.key === "store" && (
                <div className="v-store">
                  {products.map((p) => (
                    <span key={p.id} className="it"><span className="pic"><ProductImage src={p.image} width={200} /></span><b>{p.name}</b><em>{formatINR(p.price ?? 0)}</em></span>
                  ))}
                </div>
              )}
              {cur.key === "study" && (
                <div className="v-study">
                  <div className="card"><small><GraduationCap size={13} /> NEET-PG · Pharmacology</small><b>Drug of choice for absence seizures?</b><span>A. Phenytoin</span><span className="right"><Check size={13} /> B. Ethosuximide</span><span>C. Carbamazepine</span></div>
                  <div className="side"><div className="st"><Flame size={18} /><b>12</b><small>day streak</small></div><div className="st"><Layers size={18} /><b>24</b><small>cards due</small></div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ brands */

export function BrandMarquee() {
  const { data: store } = useStore();
  const brands = store?.brands ?? [];
  if (!brands.length) return null;
  return (
    <section className="ax-bm" data-rv data-home="brand-marquee">
      <div className="ax-wrap"><small>Verified brands we stock</small></div>
      <div className="ax-bm-row"><div className="ax-bm-track">{[...brands, ...brands].map((b, i) => <Link key={`${b.slug}-${i}`} href={`/brand/${b.slug}`} tabIndex={i >= brands.length ? -1 : 0} aria-hidden={i >= brands.length}>{b.name}</Link>)}</div></div>
    </section>
  );
}

/** Kept for other pages that link to it; the homepage uses Showcase. */
export const Pillars = Showcase;

/* ------------------------------------------------------------------ site-wide */

/** Shown above the footer on every aethex.in page. */
export function ClosingBand() {
  return (
    <section className="ax-close no-print" data-site="closing">
      <div className="ax-close-bg" aria-hidden="true"><i /><i /></div>
      <div className="ax-wrap ax-close-in">
        <div>
          <h2>Start with Cadus — it's free.</h2>
          <p>Ask your first clinical question in seconds. No card needed.</p>
        </div>
        <div className="ax-close-ctas">
          <a href={cadusUrl("/")} className="ax-btn lg glow">Try Cadus free <ArrowRight size={18} /></a>
          <Link href="/shop" className="ax-btn lg glass">Shop supplies</Link>
        </div>
      </div>
    </section>
  );
}

export const TRUST_ITEMS = [
  { icon: BadgeCheck, t: "Genuine brands", d: "Sourced from verified brands" },
  { icon: Banknote, t: "Cash on delivery", d: "Pay when your order arrives" },
  { icon: Truck, t: "Delivery across India", d: `Free from ${formatINR(FREE_DELIVERY_FROM)}` },
  { icon: ShieldCheck, t: "Private by design", d: "Patient details stay on your device" },
];
