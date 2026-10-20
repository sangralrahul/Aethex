/**
 * Page not found, in the site style (inside the site header and footer):
 * a search box, the way back, and the main sections. Search engines are asked
 * not to index it. Styles: src/shop.css (.ax-404).
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, BookOpen, GraduationCap, Home, Mail, Package, Search, ShoppingBag, Sparkles } from "lucide-react";
import { cadusUrl } from "@/lib/host";
import { useSeo } from "@/hooks/use-seo";

const PLACES = [
  { href: "/shop", label: "All products", hint: "Genuine devices from verified brands", icon: ShoppingBag },
  { href: "/study-hub", label: "Study Hub", hint: "NEET-PG, notes and practice", icon: GraduationCap },
  { href: "/books", label: "Medical books", hint: "Request any textbook", icon: BookOpen },
  { href: "/orders/track", label: "Track an order", hint: "With your order number", icon: Package },
  { href: "/contact", label: "Contact us", hint: "We reply within a business day", icon: Mail },
];

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const [q, setQ] = useState("");
  useSeo({ title: "Page not found | Aethex", description: "This page doesn't exist on Aethex. Search the store or go to a section.", path: location });
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const s = q.trim();
    if (s) setLocation(`/shop?search=${encodeURIComponent(s)}`);
  };

  return (
    <section className="ax-wrap ax-404">
      <p className="code">404</p>
      <h1>We couldn't find that page</h1>
      <p className="sub">The link may be old or mistyped. Search the store, or pick up from one of the sections below.</p>
      <form className="ax-404-search" onSubmit={search} role="search">
        <Search size={18} aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, books and equipment" aria-label="Search the store" />
        <button type="submit" className="ax-btn teal">Search</button>
      </form>
      <div className="acts">
        <Link href="/" className="ax-btn dark"><Home size={16} /> Homepage</Link>
        <button type="button" className="ax-btn" onClick={() => window.history.back()}><ArrowLeft size={16} /> Go back</button>
      </div>
      <ul className="ax-404-places">
        {PLACES.map(({ href, label, hint, icon: I }) => (
          <li key={href}><Link href={href}><span className="ic"><I size={18} /></span><b>{label}</b><small>{hint}</small></Link></li>
        ))}
        <li><a href={cadusUrl("/")}><span className="ic"><Sparkles size={18} /></span><b>Cadus AI</b><small>Clinical answers with sources</small></a></li>
      </ul>
    </section>
  );
}
