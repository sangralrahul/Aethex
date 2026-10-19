/** The aethex.in footer. Styles: src/site.css (ax-foot). */
import { Link, useLocation } from "wouter";
import { ArrowRight, Download, Hospital } from "lucide-react";
import { cadusUrl } from "@/lib/host";
import { Logo } from "./Navbar";

const COLS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/category/stethoscopes", label: "Stethoscopes" },
      { href: "/category/scrubs", label: "Scrubs & uniforms" },
      { href: "/books", label: "Medical books" },
      { href: "/category/equipment", label: "Medical equipment" },
      { href: "/orders/track", label: "Track an order" },
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
      { href: "/__cadus", label: "Cadus AI" },
      { href: "/drug-reference", label: "Drug reference" },
      { href: "/drug-interaction-checker", label: "Drug interactions" },
      { href: "/calculator", label: "Medical calculators" },
      { href: "/tools", label: "All clinical tools" },
      { href: "/case-of-the-day", label: "Case of the day" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/blog", label: "Blog" },
      { href: "/news", label: "Medical news" },
      { href: "/jobs", label: "Jobs" },
      { href: "/community", label: "Community" },
      { href: "/institutions", label: "Colleges & hospitals" },
    ],
  },
];

export function Footer() {
  const [location] = useLocation();
  if (location === "/ai-assistant") return null;
  return (
    <footer className="ax-foot no-print">
      <div className="ax-wrap">
        <div className="ax-foot-top">
          <div className="ax-foot-brand">
            <Logo />
            <p>One platform for India's doctors and medical students: Cadus AI, study tools and genuine medical supplies, with one account.</p>
            <div className="ax-foot-apps">
              <Link href="/downloads"><Download size={16} /> Cadus for Windows and Linux</Link>
              <a href="https://hms.aethex.in" rel="noopener"><Hospital size={16} /> AETHEX for hospitals</a>
              <a href={cadusUrl("/")}>Open Cadus AI <ArrowRight size={15} /></a>
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
          <span>© {new Date().getFullYear()} Aethex. Made in India for medical professionals.</span>
          <nav>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/medical-disclaimer">Medical disclaimer</Link>
            <a href="mailto:support@aethex.in">support@aethex.in</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
