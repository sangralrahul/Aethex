/**
 * Update 65: the header and footer of a portal subdomain (store., doctors., study., hospitals., medicalcolleges.aethex.in).
 * Each shows only its own platform: its name, its own links, search, account and call to action. Styles: site-hub.css (ax-p*).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Heart, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { SearchResults } from "@/components/shop/SearchResults";
import { useCartCount } from "@/lib/store/cart";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { loginUrl } from "@/lib/host";
import { BUSINESS } from "@/config/business";
import { PORTALS, type NavLink } from "@/lib/portals";
import { useReveal } from "@/lib/reveal";
import type { Portal } from "@/lib/host";

type Site = Exclude<Portal, "cadus">;

/** An in-app link, or a plain link when it points at a section of a page (#…). */
function L({ to, className, children, onClick }: { to: string; className?: string; children: ReactNode; onClick?: () => void }) {
  return to.includes("#") ? <a href={to} className={className} onClick={onClick}>{children}</a> : <Link href={to} className={className} onClick={onClick}>{children}</Link>;
}

export function PortalLogo({ portal }: { portal: Site }) {
  return (
    <Link href="/" className="ax-logo ax-plogo" aria-label={`Aethex ${PORTALS[portal].name} home`}>
      <img className="ax-logo-mark" src={`${import.meta.env.BASE_URL}aethex-mark.png`} alt="" width={36} height={36} />
      <span className="ax-logo-word"><span className="sh">Aethex</span></span>
      <span className={`ax-ptag ${portal}`}>{PORTALS[portal].name.replace(/^for /, "")}</span>
    </Link>
  );
}

function CartIcons() {
  const { count: wishCount } = useWishlist();
  const cartCount = useCartCount();
  return (
    <>
      <Link href="/wishlist" className="ax-icon wish" aria-label={`Wishlist${wishCount ? `, ${wishCount} items` : ""}`}><Heart size={19} />{wishCount > 0 && <span className="n">{wishCount}</span>}</Link>
      <Link href="/cart" className="ax-icon" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}><ShoppingCart size={19} />{cartCount > 0 && <span className="n">{cartCount}</span>}</Link>
    </>
  );
}

export function PortalHeader({ portal }: { portal: Site }) {
  const cfg = PORTALS[portal];
  const [location, go] = useLocation();
  const { user, isLoggedIn, logout } = useUserAuth();
  const [scrolled, setScrolled] = useState(false), [acct, setAcct] = useState(false), [mobile, setMobile] = useState(false), [searching, setSearching] = useState(false), [q, setQ] = useState("");
  const acctRef = useRef<HTMLDivElement>(null);
  useReveal();
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  useEffect(() => { setAcct(false); setMobile(false); setSearching(false); }, [location]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (cfg.search && (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearching(true); } if (e.key === "Escape") { setAcct(false); setSearching(false); setMobile(false); } };
    const onDown = (e: MouseEvent) => { if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcct(false); };
    window.addEventListener("keydown", onKey); window.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onDown); };
  }, [cfg.search]);
  useEffect(() => { document.body.style.overflow = mobile || searching ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobile, searching]);
  const first = (user?.name || "").replace(/^dr\.?\s+/i, "").split(" ")[0] || "Account";
  const isOn = (l: NavLink) => (l.href === "/" ? location === "/" : !l.href.includes("#") && location.startsWith(l.href.split("?")[0]!));
  const run = (s: string) => { const t = s.trim(); if (!t || !cfg.search) return; setSearching(false); setQ(""); go(cfg.search.to(t)); };

  return (
    <>
      <header className={`ax-head ax-phead no-print ${scrolled ? "scrolled" : ""}`} data-portal-header={portal}>
        <div className="ax-wrap ax-head-in">
          <PortalLogo portal={portal} />
          {cfg.links.length > 0 && (
            <nav className="ax-pnav" aria-label={`Aethex ${cfg.name}`}>
              {cfg.links.map((l) => <L key={l.href} to={l.href} className={isOn(l) ? "on" : ""}>{l.label}</L>)}
            </nav>
          )}
          <div className="ax-head-r">
            {cfg.search && <button type="button" className="ax-search-btn" onClick={() => setSearching(true)} aria-label="Search"><Search size={16} /><span>{portal === "store" ? "Search the store" : "Search doctors"}</span><kbd>Ctrl K</kbd></button>}
            {cfg.shop && <CartIcons />}
            <div className="ax-acct" ref={acctRef}>
              <button type="button" className="ax-acct-btn" onClick={() => setAcct(!acct)} aria-expanded={acct} aria-label="Account">
                <span className={`ax-av ${isLoggedIn ? "" : "guest"}`}>{isLoggedIn ? (first[0] || "A").toUpperCase() : <User size={15} />}</span>
                <span className="nm">{isLoggedIn ? first : "Sign in"}</span>
              </button>
              {acct && (
                <div className="ax-menu" role="menu">
                  {isLoggedIn ? <div className="ax-menu-h"><b>{user?.name}</b><small>{user?.email}</small></div>
                    : <div className="ax-menu-h" style={{ display: "flex", gap: 8 }}><a className="ax-btn teal" style={{ flex: 1, height: 38, justifyContent: "center", color: "#fff" }} href={loginUrl("/")}>Sign in</a><a className="ax-btn" style={{ flex: 1, height: 38, justifyContent: "center" }} href={loginUrl("/signup")}>Create account</a></div>}
                  {cfg.account.map((l) => <L key={l.href} to={l.href}>{l.label}</L>)}
                  {isLoggedIn && <><div className="sep" /><button type="button" className="danger" onClick={() => { setAcct(false); logout(); }}><LogOut size={16} /> Sign out</button></>}
                </div>
              )}
            </div>
            {cfg.cta && <L to={cfg.cta.href} className={`ax-btn ax-pcta ${portal}`}>{cfg.cta.label}</L>}
            <button type="button" className="ax-icon ax-burger" onClick={() => setMobile(true)} aria-label="Open menu"><Menu size={21} /></button>
          </div>
        </div>
      </header>

      {searching && cfg.search && (
        <div className="ax-search" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearching(false); }} role="dialog" aria-label="Search">
          <div className="ax-search-box">
            <form onSubmit={(e) => { e.preventDefault(); run(q); }}>
              <Search size={20} color="#667085" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={cfg.search.placeholder} aria-label="Search" />
              <button type="button" className="ax-icon" onClick={() => setSearching(false)} aria-label="Close search"><X size={18} /></button>
            </form>
            {portal === "store" && q.trim().length >= 2 ? <SearchResults q={q.trim()} onGo={() => setSearching(false)} onAll={() => run(q)} /> : (
              <div className="sugg"><p>Popular</p><div>{cfg.search.suggestions.map((s) => <button key={s} type="button" onClick={() => run(s)}>{s}</button>)}</div></div>
            )}
          </div>
        </div>
      )}

      {mobile && (
        <div className="ax-mob" role="dialog" aria-label="Menu">
          <div className="ax-mob-h"><PortalLogo portal={portal} /><button type="button" className="ax-icon" onClick={() => setMobile(false)} aria-label="Close menu"><X size={22} /></button></div>
          <div className="ax-mob-b">
            {cfg.search && <button type="button" className="ax-search-btn" style={{ width: "100%", height: 46, marginBottom: 8 }} onClick={() => { setMobile(false); setSearching(true); }}><Search size={17} /> <span style={{ display: "inline" }}>{cfg.search.placeholder}</span></button>}
            {(cfg.links.length ? cfg.links : cfg.footer[0]!.links).map((l) => <L key={l.href} to={l.href} className="solo" onClick={() => setMobile(false)}>{l.label}</L>)}
            <details>
              <summary>Account <ChevronDown size={18} className="chev" /></summary>
              {cfg.account.map((l) => <L key={l.href} to={l.href} onClick={() => setMobile(false)}>{l.label}</L>)}
            </details>
          </div>
          <div className="ax-mob-f">
            {isLoggedIn ? <button type="button" className="ax-btn" onClick={() => { setMobile(false); logout(); }}><LogOut size={16} /> Sign out</button>
              : <><a className="ax-btn" href={loginUrl("/")}>Sign in</a><a className="ax-btn teal" href={loginUrl("/signup")} style={{ color: "#fff" }}>Create account</a></>}
          </div>
        </div>
      )}
    </>
  );
}

export function PortalFooter({ portal }: { portal: Site }) {
  const cfg = PORTALS[portal];
  return (
    <footer className="ax-foot ax-pfoot no-print" data-portal-footer={portal}>
      <div className="ax-wrap">
        <div className="ax-foot-top">
          <div className="ax-foot-brand">
            <PortalLogo portal={portal} />
            <p>{cfg.tagline}</p>
            <a className="ax-pmail" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          </div>
          {cfg.footer.map((c) => (
            <div key={c.title}>
              <h4>{c.title}</h4>
              <ul>{c.links.map((l) => <li key={l.href + l.label}><L to={l.href}>{l.label}</L></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="ax-foot-bot">
          <span>© {new Date().getFullYear()} {BUSINESS.legalName}. Made in India.{BUSINESS.gstin ? ` GSTIN ${BUSINESS.gstin}.` : ""}</span>
          <nav><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link><Link href="/medical-disclaimer">Medical disclaimer</Link><Link href="/contact">Contact</Link></nav>
        </div>
      </div>
    </footer>
  );
}
