/**
 * Update 87: every portal page sits in a workspace: a slim sidebar on the left with all of that platform's pages
 * (lib/workspace.ts), a "Jump to" filter, a way back to all of Aethex at the bottom, and a collapse button (remembered in this
 * browser). On phones the sidebar becomes a drawer and a bottom bar keeps the four main pages and "Menu" in reach.
 * The portal's top menu bar is hidden while the sidebar is shown (every link in it is in the sidebar).
 * Update 104: on computers the sidebar became a clean bar under the header: the platform's main pages as tabs and
 * "All sections", a panel with every page in its groups (with the "Jump to" filter). Pages get the full width.
 * Phones keep the bottom bar and the drawer. Styles: src/site-ws.css (.ax-ws*, .ax-wsb*).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, LayoutGrid, Menu, Search, Sparkles, X } from "lucide-react";
import { WORKSPACE, PORTAL_NAMES, type Site, type WsItem } from "@/lib/workspace";
import { cadusUrl, mainUrl } from "@/lib/host";
import { ph, type PhotoKey } from "@/config/photos";

/** The pages shown as tabs in the bar on computers (the rest are one click away in "All sections"). */
const TOP: Record<Site, string[]> = {
  store: ["/", "/shop", "/offers", "/books", "/brands", "/compare", "/orders", "/orders/track"],
  doctors: ["/", "/doctors", "/which-doctor", "/clinics", "/ask", "/articles", "/appointments", "/records"],
  study: ["/", "/neet-pg", "/mock-test", "/flashcards", "/question-of-the-day", "/study-hub/medical-knowledge-hub", "/my-library"],
  hospitals: ["/", "/#list", "/account/quotations", "/approvals", "/indents", "/stock", "/spend"],
  medicalcolleges: ["/", "/#list", "/account/quotations", "/approvals", "/indents", "/stock", "/spend"],
};

function isActive(href: string, location: string, search: string) {
  const [p, q] = href.split("?");
  if (href.includes("#")) return false;
  if (p === "/") return location === "/";
  if (q) return location === p && search.includes(q);
  return location === p || (location.startsWith(`${p}/`) && p !== "/orders") || (p === "/orders" && location === "/orders");
}
function Item({ it, on, collapsed, onGo }: { it: WsItem; on: boolean; collapsed: boolean; onGo?: () => void }) {
  const I = it.icon;
  const inner = <><I size={17} aria-hidden="true" /><span>{it.label}</span></>;
  const cls = `ax-ws-item${on ? " on" : ""}`;
  return it.href.includes("#")
    ? <a href={it.href} className={cls} title={collapsed ? it.label : undefined} onClick={onGo}>{inner}</a>
    : <Link href={it.href} className={cls} title={collapsed ? it.label : undefined} onClick={onGo} aria-current={on ? "page" : undefined}>{inner}</Link>;
}

function Side({ portal, collapsed, onGo, wide }: { portal: Site; collapsed: boolean; onGo?: () => void; wide?: boolean }) {
  const [location] = useLocation();
  const search = typeof window === "undefined" ? "" : window.location.search;
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    return WORKSPACE[portal].map((g) => ({ ...g, items: g.items.filter((i) => !t || i.label.toLowerCase().includes(t)) })).filter((g) => g.items.length);
  }, [portal, q]);
  return (
    <nav className={`ax-ws-nav${wide ? " wide" : ""}`} aria-label={`Aethex ${PORTAL_NAMES[portal]}`}>
      {!collapsed && (
        <label className="ax-ws-find"><Search size={15} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to…" aria-label="Jump to" data-ws="filter" autoFocus={wide}
          onKeyDown={(e) => { if (e.key === "Enter") { const first = groups[0]?.items[0]; if (first) { e.preventDefault(); if (first.href.includes("#")) window.location.href = first.href; else (e.currentTarget.closest(".ax-ws-nav")?.querySelector(`a[href="${first.href}"]`) as HTMLAnchorElement | null)?.click(); setQ(""); } } }} /></label>
      )}
      <div className="ax-ws-groups">{groups.map((g) => (
        <div key={g.title} className="ax-ws-group">
          {!collapsed && <small>{g.title}</small>}
          {g.items.map((it) => <Item key={it.href + it.label} it={it} on={isActive(it.href, location, search)} collapsed={collapsed} onGo={onGo} />)}
        </div>
      ))}</div>
      {!groups.length && <p className="ax-ws-none">Nothing matches.</p>}
      <div className="ax-ws-group ax-ws-others">
        {!collapsed && <small>Aethex</small>}
        <a href={mainUrl("/")} className="ax-ws-item other" title={collapsed ? "All Aethex platforms" : undefined} data-ws="all-platforms"><LayoutGrid size={16} aria-hidden="true" /><span>All platforms</span></a>
        <a href={cadusUrl("/")} className="ax-ws-item other cadus" title={collapsed ? "Cadus" : undefined}><Sparkles size={15} aria-hidden="true" /><span>Cadus</span></a>
      </div>
    </nav>
  );
}

/** Update 104: the bar under the header on computers: main pages as tabs, every page under "All sections". */
function Bar({ portal }: { portal: Site }) {
  const [location] = useLocation();
  const search = typeof window === "undefined" ? "" : window.location.search;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", key); window.addEventListener("mousedown", down);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("mousedown", down); };
  }, [open]);
  const all = WORKSPACE[portal].flatMap((g) => g.items);
  const tabs = TOP[portal].map((h) => all.find((i) => i.href === h)).filter((x): x is WsItem => !!x);
  return (
    <div className="ax-wsb no-print" ref={ref} data-ws="bar">
      <div className="ax-wsb-in">
        <nav className="ax-wsb-tabs" aria-label={`Aethex ${PORTAL_NAMES[portal]} main pages`}>
          {tabs.map((t) => { const I = t.icon; const on = isActive(t.href, location, search); const inner = <><I size={16} aria-hidden="true" /><span>{t.label}</span></>; return t.href.includes("#")
            ? <a key={t.href} href={t.href} className={on ? "on" : ""}>{inner}</a>
            : <Link key={t.href} href={t.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>{inner}</Link>; })}
        </nav>
        <button type="button" className={`ax-wsb-all${open ? " open" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} data-ws="all-sections"><LayoutGrid size={16} aria-hidden="true" /><span>All sections</span><ChevronDown size={15} className="chev" aria-hidden="true" /></button>
      </div>
      {open && <div className="ax-wsb-panel" role="dialog" aria-label={`Every page in Aethex ${PORTAL_NAMES[portal]}`}><Side portal={portal} collapsed={false} wide onGo={() => setOpen(false)} /></div>}
    </div>
  );
}

export function PortalWorkspace({ portal, children }: { portal: Site; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [location] = useLocation();
  useEffect(() => { document.body.classList.add("ax-ws-on"); return () => document.body.classList.remove("ax-ws-on"); }, []);
  useEffect(() => { setDrawer(false); }, [location]);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [drawer]);
  const search = typeof window === "undefined" ? "" : window.location.search;
  const tabs = WORKSPACE[portal].flatMap((g) => g.items).filter((i) => i.tab).slice(0, 4);
  const drawerRef = useRef<HTMLDivElement>(null);
  return (
    <div className={`ax-ws ${portal}`} data-ws={portal} style={{ ["--ws-photo" as string]: `url("${ph(PHOTO[portal], 1400, 420)}")` }}>
      <Bar portal={portal} />
      <div className="ax-ws-main">{children}</div>
      <nav className="ax-ws-tabs no-print" aria-label="Main sections">
        {tabs.map((t) => { const I = t.icon; const on = isActive(t.href, location, search); return t.href.includes("#")
          ? <a key={t.href} href={t.href} className={on ? "on" : ""}><I size={20} /><span>{t.label}</span></a>
          : <Link key={t.href} href={t.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}><I size={20} /><span>{t.label}</span></Link>; })}
        <button type="button" onClick={() => setDrawer(true)} aria-expanded={drawer} data-ws="menu"><Menu size={20} /><span>Menu</span></button>
      </nav>
      {drawer && (
        <div className="ax-ws-drawer no-print" role="dialog" aria-label={`All of Aethex ${PORTAL_NAMES[portal]}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(false); }}>
          <div className="pane" ref={drawerRef}>
            <div className="hd"><b>Aethex {PORTAL_NAMES[portal]}</b><button type="button" onClick={() => setDrawer(false)} aria-label="Close"><X size={20} /></button></div>
            <Side portal={portal} collapsed={false} onGo={() => setDrawer(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Update 104: each platform's photograph, behind its home banner and faintly behind page titles. */
export const PHOTO: Record<Site, PhotoKey> = { store: "bpCheck", doctors: "consultation", study: "lectureHall", hospitals: "icuMonitor", medicalcolleges: "microscopeLab" };
