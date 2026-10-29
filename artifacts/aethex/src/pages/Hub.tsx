/**
 * aethex.in (update 62): the front door to Aethex. A clean white launcher: the logo, one headline, and five cards,
 * one per platform (find., store., study., hospitals. and medicalcolleges.aethex.in), with the catalogue's own
 * product photos, three facts each and a button. A soft animated background, cards that rise in, photos that drift.
 * Cadus is inside every portal (and on the header button). Styles: src/site-hub.css (hb-*).
 */
import type { ReactNode } from "react";
import { ArrowRight, Building2, CalendarCheck, Check, GraduationCap, Hospital, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Navbar";
import { useSeo } from "@/hooks/use-seo";
import { cadusUrl, loginUrl, mainUrl, portalUrl, type Portal } from "@/lib/host";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";

const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;

const CARDS: { id: Portal; tone: string; icon: ReactNode; photo: string; title: string; who: string; points: string[]; cta: string }[] = [
  { id: "find", tone: "blue", icon: <CalendarCheck size={20} />, photo: "stethoscope", title: "Find a doctor", who: "For patients", points: ["Search by city and specialty", "Clinic visit or video consult", "Every registration checked"], cta: "Book now" },
  { id: "store", tone: "teal", icon: <ShoppingBag size={20} />, photo: "bp-monitor", title: "Medical store", who: "For everyone", points: ["Genuine, verified brands", "Cash on delivery across India", `Free delivery from ${formatINR(FREE_DELIVERY_FROM)}`], cta: "Shop now" },
  { id: "study", tone: "violet", icon: <GraduationCap size={20} />, photo: "test-books", title: "Study", who: "For students", points: ["NEET-PG preparation", "Mock tests and flashcards", "Every subject, every exam"], cta: "Start studying" },
  { id: "hospitals", tone: "cyan", icon: <Hospital size={20} />, photo: "ecg", title: "Hospitals", who: "For institutions", points: ["ICU, emergency and furniture", "One list, one quotation", "Bank transfer or purchase order"], cta: "Get a quotation" },
  { id: "medicalcolleges", tone: "amber", icon: <Building2 size={20} />, photo: "surgical-set", title: "Medical colleges", who: "For institutions", points: ["Skills labs and manikins", "Anatomy models and lab equipment", "Textbooks for every course"], cta: "Equip your college" },
];

export default function Hub() {
  useSeo({
    title: "Aethex: find doctors, medical supplies, study and Cadus clinical AI, in one place",
    description: "Aethex for India's patients, doctors, students, hospitals and medical colleges: book doctors, shop genuine medical supplies, prepare for NEET-PG and ask Cadus. One account, five platforms.",
    path: "/",
  });
  const year = new Date().getFullYear();
  return (
    <div className="hb" data-home="hub">
      <div className="hb-bg" aria-hidden="true"><i /><i /><i /><svg className="pulse" viewBox="0 0 1600 120" preserveAspectRatio="none"><path d="M0 60 H520 L540 20 L560 100 L580 60 H1040 L1060 30 L1080 90 L1100 60 H1600" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>

      <header className="hb-top">
        <Logo />
        <nav aria-label="Account">
          <a href={loginUrl("/")}>Sign in</a>
          <a href={cadusUrl("/")} className="p" data-home="cta-cadus"><Sparkles size={15} /> Try Cadus free</a>
        </nav>
      </header>

      <section className="hb-intro" data-home="platform">
        <span className="hb-badge">One account · Five platforms</span>
        <h1>Everything medical, in one place.</h1>
        <p>Choose the platform you need. Cadus, the clinical assistant, is inside every one.</p>
      </section>

      <section className="hb-cards" aria-label="Aethex platforms">
        {CARDS.map((c, i) => (
          <a key={c.id} href={portalUrl(c.id)} className={`hb-card ${c.tone}`} data-portal={c.id} style={{ animationDelay: `${0.12 + i * 0.09}s` }}>
            <span className="ph"><img src={IMG(c.photo)} alt="" loading="eager" decoding="async" style={{ animationDelay: `${-i * 1.7}s` }} /></span>
            <span className="ic">{c.icon}</span>
            <b>{c.title}</b>
            <small>{c.who}</small>
            <ul>{c.points.map((p) => <li key={p}><Check size={14} /> {p}</li>)}</ul>
            <em>{c.cta} <ArrowRight size={15} /></em>
          </a>
        ))}
      </section>

      <footer className="hb-foot">
        <span><ShieldCheck size={14} /> © {year} Clavix Technologies Private Limited · Made in India for medical professionals</span>
        <nav aria-label="Legal"><a href={mainUrl("/privacy-policy")}>Privacy</a><a href={mainUrl("/terms-of-service")}>Terms</a><a href={mainUrl("/contact")}>Contact</a></nav>
      </footer>
    </div>
  );
}
