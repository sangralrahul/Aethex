/**
 * Update 87: every portal page sits in a workspace: a slim sidebar on the left with all of that platform's pages
 * (lib/workspace.ts), a "Jump to" filter, a way back to all of Aethex at the bottom, and a collapse button (remembered in this
 * browser). On phones the sidebar becomes a drawer and a bottom bar keeps the four main pages and "Menu" in reach.
 * The portal's top menu bar is hidden while the sidebar is shown (every link in it is in the sidebar).
 * Styles: src/site-hub.css (.ax-ws*).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronsLeft, ChevronsRight, LayoutGrid, Menu, Search, Sparkles, X } from "lucide-react";
import { WORKSPACE, PORTAL_NAMES, type Site, type WsItem } from "@/lib/workspace";
import { cadusUrl, mainUrl } from "@/lib/host";

const KEY = "aethex:ws:collapsed";
const readCollapsed = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

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

function Side({ portal, collapsed, onGo, setCollapsed }: { portal: Site; collapsed: boolean; onGo?: () => void; setCollapsed?: (v: boolean) => void }) {
  const [location] = useLocation();
  const search = typeof window === "undefined" ? "" : window.location.search;
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    return WORKSPACE[portal].map((g) => ({ ...g, items: g.items.filter((i) => !t || i.label.toLowerCase().includes(t)) })).filter((g) => g.items.length);
  }, [portal, q]);
  return (
    <nav className="ax-ws-nav" aria-label={`Aethex ${PORTAL_NAMES[portal]}`}>
      {!collapsed && (
        <label className="ax-ws-find"><Search size={15} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to…" aria-label="Jump to" data-ws="filter"
          onKeyDown={(e) => { if (e.key === "Enter") { const first = groups[0]?.items[0]; if (first) { e.preventDefault(); if (first.href.includes("#")) window.location.href = first.href; else (document.querySelector(`.ax-ws-nav a[href="${first.href}"]`) as HTMLAnchorElement | null)?.click(); setQ(""); } } }} /></label>
      )}
      {groups.map((g) => (
        <div key={g.title} className="ax-ws-group">
          {!collapsed && <small>{g.title}</small>}
          {g.items.map((it) => <Item key={it.href + it.label} it={it} on={isActive(it.href, location, search)} collapsed={collapsed} onGo={onGo} />)}
        </div>
      ))}
      {!groups.length && <p className="ax-ws-none">Nothing matches.</p>}
      <div className="ax-ws-group ax-ws-others">
        {!collapsed && <small>Aethex</small>}
        <a href={mainUrl("/")} className="ax-ws-item other" title={collapsed ? "All Aethex platforms" : undefined} data-ws="all-platforms"><LayoutGrid size={16} aria-hidden="true" /><span>All platforms</span></a>
        <a href={cadusUrl("/")} className="ax-ws-item other cadus" title={collapsed ? "Cadus" : undefined}><Sparkles size={15} aria-hidden="true" /><span>Cadus</span></a>
      </div>
      {setCollapsed && <button type="button" className="ax-ws-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Show the sidebar labels" : "Collapse the sidebar"} data-ws="collapse">{collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> <span>Collapse</span></>}</button>}
    </nav>
  );
}

export function PortalWorkspace({ portal, children }: { portal: Site; children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(readCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [location] = useLocation();
  const setCollapsed = (v: boolean) => { setCollapsedState(v); try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* storage blocked */ } };
  useEffect(() => { document.body.classList.add("ax-ws-on"); return () => document.body.classList.remove("ax-ws-on"); }, []);
  useEffect(() => { setDrawer(false); }, [location]);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [drawer]);
  const search = typeof window === "undefined" ? "" : window.location.search;
  const tabs = WORKSPACE[portal].flatMap((g) => g.items).filter((i) => i.tab).slice(0, 4);
  const drawerRef = useRef<HTMLDivElement>(null);
  return (
    <div className={`ax-ws ${portal}${collapsed ? " collapsed" : ""}`} data-ws={portal}>
      <aside className="ax-ws-side no-print" aria-label="Sections"><Side portal={portal} collapsed={collapsed} setCollapsed={setCollapsed} /></aside>
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
