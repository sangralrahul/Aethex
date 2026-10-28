/**
 * The top of aethex.in (update 54): one headline for the whole platform — Cadus, the medical store
 * and the Study Hub — with a composed preview of each, real numbers from the store, and the three
 * products as cards. Styles: src/site-pro.css (ax-plat-*).
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, BadgeCheck, Banknote, BookOpen, Check, GraduationCap, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { ProductImage } from "@/components/store/ProductImage";
import { useStore } from "@/lib/store/api";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";
import { cadusUrl } from "@/lib/host";

/** Numbers that come from the app itself (tools and assistants are counted in Cadus). */
export const CADUS_TOOLS = "320+";
export const CREW_ASSISTANTS = "158";

export function PlatformHero() {
  const { data: store } = useStore();
  const off = (p: { mrp: number | null; price: number | null }) => ((p.mrp ?? 0) - (p.price ?? 0)) / (p.mrp || 1);
  const pick = useMemo(() => store?.products.filter((p) => p.featured && p.image && !p.priceOnRequest && p.inStock && p.price != null).sort((a, b) => off(b) - off(a))[0], [store]);
  return (
    <section className="ax-plat" data-home="platform">
      <div className="ax-plat-bg" aria-hidden="true"><i /><i /></div>
      <div className="ax-wrap ax-plat-grid">
        <div className="ax-plat-copy">
          <span className="ax-plat-eyebrow"><Sparkles size={14} /> For India's doctors and medical students</span>
          <h1>Everything a doctor needs, <span>in one place.</span></h1>
          <p>Clinical answers you can check, 320+ bedside tools, exam preparation for every subject, and genuine medical supplies delivered across India — with one account.</p>
          <div className="ax-plat-ctas">
            <a href={cadusUrl("/")} className="ax-btn teal lg" data-home="cta-cadus">Try Cadus free <ArrowRight size={18} /></a>
            <Link href="/shop" className="ax-btn lg" data-home="cta-shop"><ShoppingBag size={18} /> Shop medical supplies</Link>
          </div>
          <ul className="ax-plat-trust">
            <li><Check size={15} /> Genuine brands only</li>
            <li><Check size={15} /> Cash on delivery</li>
            <li><Check size={15} /> Free delivery from {formatINR(FREE_DELIVERY_FROM)}</li>
          </ul>
        </div>
        <div className="ax-plat-art" aria-hidden="true">
          <div className="ax-plat-card cadus">
            <div className="hd"><span className="mk"><CadusMark size={16} variant="mono" color="currentColor" /></span><b>Cadus</b><em>Clinical AI</em></div>
            <p className="q">Warfarin with clarithromycin — safe?</p>
            <div className="a">
              <small>Bottom line</small>
              <p>Clarithromycin raises the INR. Prefer another antibiotic, or check the INR in 3 to 5 days.</p>
              <span className="ok"><ShieldCheck size={12} /> Safety reviewed · 3 sources</span>
            </div>
          </div>
          <div className="ax-plat-card prod">
            <span className="pic">{pick ? <ProductImage src={pick.image} width={300} /> : null}</span>
            <small>{pick ? store?.brandName(pick.brand) : "Medical store"}</small>
            <b>{pick ? pick.name : "Genuine instruments"}</b>
            <span className="pr">{pick && pick.price != null ? <>{formatINR(pick.price)}{pick.mrp != null && pick.mrp > pick.price && <s>{formatINR(pick.mrp)}</s>}</> : " "}</span>
          </div>
          <div className="ax-plat-card mcq">
            <small><GraduationCap size={13} /> NEET-PG · Pharmacology</small>
            <b>Drug of choice for absence seizures?</b>
            <span>A. Phenytoin</span><span className="right"><Check size={13} /> B. Ethosuximide</span><span>C. Carbamazepine</span>
          </div>
        </div>
      </div>
      <div className="ax-wrap">
        <dl className="ax-plat-stats" data-home="stats">
          <div><dt>{store ? `${store.products.length}` : "—"}</dt><dd>genuine products</dd></div>
          <div><dt>{store ? `${store.brands.length}` : "—"}</dt><dd>verified brands</dd></div>
          <div><dt>{CADUS_TOOLS}</dt><dd>clinical tools in Cadus</dd></div>
          <div><dt>{CREW_ASSISTANTS}</dt><dd>study and specialist assistants</dd></div>
        </dl>
      </div>
    </section>
  );
}

const PILLARS = [
  { key: "cadus", icon: Sparkles, kicker: "Cadus", title: "Clinical AI with sources", text: "Differentials, doses, interactions, lab and ECG reading, notes and letters. Answers are safety-reviewed and cite their sources.", points: ["320+ bedside tools", "Indian protocols built in", "Web, phone and desktop"], href: "cadus", cta: "Try Cadus free" },
  { key: "store", icon: ShoppingBag, kicker: "Medical store", title: "Genuine instruments and supplies", text: "BP monitors, stethoscopes, diagnostics, diabetes care and supports from brands doctors trust, delivered across India.", points: ["Cash on delivery", "Replacement if damaged or defective", "Bulk lists for hospitals and colleges"], href: "/shop", cta: "Shop now" },
  { key: "study", icon: BookOpen, kicker: "Study Hub", title: "Prepare for NEET-PG and beyond", text: "Question banks, mock tests, flashcards and a knowledge hub for every subject — plus Cadus Crew tutors for every exam.", points: ["NEET-PG, NExT, FMGE, USMLE", "Daily clinical case", "OSCE and long-answer practice"], href: "/study-hub", cta: "Explore Study Hub" },
] as const;

export function Pillars() {
  return (
    <section className="ax-h-sec ax-pillars-sec">
      <div className="ax-wrap">
        <div className="ax-sec-head"><span className="ax-kicker">One platform</span><h2>Three products, one account</h2><p>Everything works together: ask Cadus, revise what you learned, and buy what you need for the ward or the clinic.</p></div>
        <div className="ax-pillars" data-home="pillars">
          {PILLARS.map((p) => {
            const body = (
              <>
                <span className={`ic ${p.key}`}><p.icon size={22} /></span>
                <small>{p.kicker}</small>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ul>{p.points.map((x) => <li key={x}><Check size={14} /> {x}</li>)}</ul>
                <span className="go">{p.cta} <ArrowRight size={16} /></span>
              </>
            );
            return p.href === "cadus"
              ? <a key={p.key} href={cadusUrl("/")} className={`ax-pillar ${p.key}`}>{body}</a>
              : <Link key={p.key} href={p.href} className={`ax-pillar ${p.key}`}>{body}</Link>;
          })}
        </div>
      </div>
    </section>
  );
}

/** Shown above the footer on every aethex.in page. */
export function ClosingBand() {
  return (
    <section className="ax-close no-print" data-site="closing">
      <div className="ax-wrap ax-close-in">
        <div>
          <h2>Start with Cadus — it's free.</h2>
          <p>Ask your first clinical question in seconds. No card needed.</p>
        </div>
        <div className="ax-close-ctas">
          <a href={cadusUrl("/")} className="ax-btn teal lg">Try Cadus free <ArrowRight size={18} /></a>
          <Link href="/shop" className="ax-btn lg ghost-dark">Shop supplies</Link>
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
