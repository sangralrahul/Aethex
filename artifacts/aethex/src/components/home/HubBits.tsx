/**
 * Update 82, on aethex.in:
 * - NotificationBell: what happened across the five platforms (bookings, prescriptions, a waitlist slot, orders,
 *   replacements, answers, quotations, approvals), newest first, with an unread count. Opening it marks them seen.
 *   Data: GET /api/notifications, POST /api/notifications/seen (worker/notify.ts). Shown only when signed in.
 * - ContinueStrip: "Continue where you left off": the last doctor, product and study topic opened on any portal,
 *   from the ax_last cookie (src/lib/lastSeen.ts). Nothing shows when there's nothing to continue.
 * Styles: src/site-hub.css (.hb-bell, .hb-cont).
 */
import { useEffect, useRef, useState } from "react";
import { Bell, BookOpen, ChevronRight, Package, Stethoscope, X } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { forgetVisits, readLastSeen, type LastKind, type LastSeen } from "@/lib/lastSeen";

interface Note { id: string; at: number; platform: string; title: string; text: string; href: string; unread: boolean }
const PLATFORM: Record<string, string> = { doctors: "Doctors", store: "Store", study: "Study", hospitals: "Hospitals", medicalcolleges: "Colleges" };
const ago = (ms: number) => {
  const m = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} day${d === 1 ? "" : "s"} ago` : new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
/** Links from the server point at aethex.in subdomains; off the domain they become same-site paths. */
const localHref = (href: string) => {
  if (typeof window === "undefined") return href;
  const h = window.location.hostname;
  if (h === "aethex.in" || h.endsWith(".aethex.in")) return href;
  try { const u = new URL(href); return u.hostname.endsWith(".aethex.in") ? `${u.pathname}${u.search}${u.hash}` : href; } catch { return href; }
};

export function NotificationBell() {
  const { isLoggedIn } = useUserAuth();
  const [items, setItems] = useState<Note[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isLoggedIn) { setItems(null); setUnread(0); return; }
    let live = true;
    fetch("/api/notifications", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).then((d: { items: Note[]; unread: number } | null) => {
      if (live && d) { setItems(d.items ?? []); setUnread(d.unread ?? 0); }
    }).catch(() => { /* leave it out */ });
    return () => { live = false; };
  }, [isLoggedIn]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  if (!isLoggedIn || !items) return null;
  const toggle = () => {
    const next = !open; setOpen(next);
    if (next && unread > 0) { setUnread(0); void fetch("/api/notifications/seen", { method: "POST", credentials: "same-origin" }).catch(() => undefined); }
  };
  return (
    <div className="hb-bell" ref={box} data-home="bell">
      <button type="button" onClick={toggle} aria-expanded={open} aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}>
        <Bell size={18} />{unread > 0 && <em data-home="bell-count">{unread > 9 ? "9+" : unread}</em>}
      </button>
      {open && (
        <div className="pop" role="dialog" aria-label="Notifications" data-home="bell-list">
          <div className="hd"><b>Notifications</b><button type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button></div>
          {items.length ? <ul>{items.slice(0, 30).map((n) => (
            <li key={n.id} className={n.unread ? "new" : ""}><a href={localHref(n.href)}>
              <small>{PLATFORM[n.platform] ?? n.platform} · {ago(n.at)}</small><b>{n.title}</b><span>{n.text}</span>
            </a></li>
          ))}</ul> : <p className="none">Nothing yet. Bookings, orders, quotations and approvals will show here.</p>}
        </div>
      )}
    </div>
  );
}

const KIND: Record<LastKind, { label: string; Icon: typeof Package }> = {
  doctor: { label: "Doctor you looked at", Icon: Stethoscope }, product: { label: "Product you looked at", Icon: Package }, topic: { label: "Topic you were studying", Icon: BookOpen },
};

export function ContinueStrip() {
  const [last, setLast] = useState<LastSeen>({});
  useEffect(() => { setLast(readLastSeen()); }, []);
  const list = (Object.entries(last) as [LastKind, NonNullable<LastSeen[LastKind]>][]).sort((a, b) => b[1].at - a[1].at);
  if (!list.length) return null;
  return (
    <section className="hb-cont" aria-label="Continue where you left off" data-home="continue">
      <div className="hd"><h2>Continue where you left off</h2><button type="button" onClick={() => { forgetVisits(); setLast({}); }} data-home="continue-clear">Clear</button></div>
      <div className="row">
        {list.map(([k, x]) => { const { label, Icon } = KIND[k]; return (
          <a key={k} href={localHref(x.href)} data-continue={k}><span className="ic"><Icon size={18} /></span><span className="t"><small>{label}</small><b>{x.title}</b>{x.sub && <i>{x.sub}</i>}</span><ChevronRight size={16} /></a>
        ); })}
      </div>
    </section>
  );
}
