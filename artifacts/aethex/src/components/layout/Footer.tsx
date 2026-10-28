/** The aethex.in footer. Styles: src/site.css (ax-foot). */
import { Link, useLocation } from "wouter";
import { ArrowRight, Download, Hospital } from "lucide-react";
import { cadusUrl, downloadsUrl } from "@/lib/host";
import { BUSINESS } from "@/config/business";
import { Logo } from "./Navbar";
import { ClosingBand, TRUST_ITEMS } from "@/components/home/PlatformHero";

const COLS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/category/bp-monitors", label: "BP monitors" },
      { href: "/category/stethoscopes", label: "Stethoscopes" },
      { href: "/category/diabetes-care", label: "Diabetes care" },
      { href: "/brands", label: "All brands" },
      { href: "/hospitals", label: "For hospitals (bulk)" },
      { href: "/medical-colleges", label: "For medical colleges (bulk)" },
    ],
  },
  {
    title: "Study",
    links: [
      { href: "/study-hub", label: "Study Hub" },
      { href: "/neet-pg", label: "NEET-PG" },
      { href: "/study-hub/medical-knowledge-hub", label: "Medical Knowledge Hub" },
      { href: "/mock-test", label: "Mock tests" },
      { href: "/flashcards", label: "Flashcards" },
      { href: "/cme-hub", label: "CME Hub" },
    ],
  },
  {
    title: "Clinical",
    links: [
      { href: "/__cadus", label: "Cadus" },
      { href: "/drug-reference", label: "Drug reference" },
      { href: "/drug-interaction-checker", label: "Drug interactions" },
      { href: "/calculator", label: "Medical calculators" },
      { href: "/tools", label: "All clinical tools" },
      { href: "/case-of-the-day", label: "Case of the day" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/orders/track", label: "Track an order" },
      { href: "/orders", label: "My orders" },
      { href: "/shipping-policy", label: "Shipping & delivery" },
      { href: "/returns-policy", label: "Returns & replacement" },
      { href: "/grievance", label: "Grievances" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

export function Footer() {
  const [location] = useLocation();
  if (location === "/ai-assistant") return null;
  return (
    <>
    <ClosingBand />
    <footer className="ax-foot no-print">
      <div className="ax-wrap">
        <ul className="ax-foot-trust" data-site="trust">
          {TRUST_ITEMS.map(({ icon: I, t, d }) => <li key={t}><span className="ic"><I size={18} /></span><span><b>{t}</b><small>{d}</small></span></li>)}
        </ul>
        <div className="ax-foot-top">
          <div className="ax-foot-brand">
            <Logo />
            <p>One platform for India's doctors and medical students: Cadus, study tools and genuine medical supplies, with one account.</p>
            <div className="ax-foot-apps">
              <a href={downloadsUrl()}><Download size={16} /> Cadus for Windows and Linux</a>
              <a href="https://hms.aethex.in" rel="noopener"><Hospital size={16} /> Hospital management app</a>
              <a href={cadusUrl("/")}>Open Cadus <ArrowRight size={15} /></a>
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4>{c.title}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href}>{l.href === "/__cadus" ? <a href={cadusUrl("/")}>{l.label}</a> : <Link href={l.href}>{l.label}</Link>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="ax-foot-bot">
          <span>© {new Date().getFullYear()} {BUSINESS.legalName}. Made in India for medical professionals.{BUSINESS.gstin ? ` GSTIN ${BUSINESS.gstin}.` : ""}</span>
          <nav>
            <Link href="/blog">Blog</Link>
            <Link href="/jobs">Jobs</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/medical-disclaimer">Medical disclaimer</Link>
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          </nav>
        </div>
      </div>
    </footer>
    </>
  );
}
