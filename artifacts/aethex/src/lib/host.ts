/**
 * Host-aware subdomain helpers for Aethex multi-domain setup.
 *
 * Domains:
 * - aethex.in / www.aethex.in  → main app
 * - login.aethex.in            → sign-in for the store and the rest of aethex.in
 * - auth.aethex.in             → sign-in for Cadus
 * - cadus.aethex.in            → Cadus, the clinical AI
 * - downloads.aethex.in        → the Cadus desktop app download page and installers
 *
 * All of them share one sign-in:
 * the Worker sets the session cookie for the whole domain (see lib/account.ts).
 */

export function currentHost(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname.toLowerCase();
}

export function isMainHost(): boolean {
  const host = currentHost();
  return host === "aethex.in" || host === "www.aethex.in" || host === "localhost" || host === "" || host.endsWith(".lovable.app") || host.endsWith(".workers.dev");
}

export function isLoginHost(): boolean {
  return currentHost() === "login.aethex.in" || currentHost() === "www.login.aethex.in";
}

export function isAuthHost(): boolean {
  return currentHost() === "auth.aethex.in" || currentHost() === "www.auth.aethex.in";
}

export function isCadusHost(): boolean {
  return currentHost() === "cadus.aethex.in" || currentHost() === "www.cadus.aethex.in";
}

export function isDownloadsHost(): boolean {
  return currentHost() === "downloads.aethex.in";
}

/** aethex.in and its subdomains, where login and Cadus have their own subdomains. */
export function isAethexDomain(): boolean {
  const host = currentHost();
  return host === "aethex.in" || host.endsWith(".aethex.in");
}

/**
 * On any other address (the workers.dev test site, a preview, localhost) there are
 * no subdomains, so links stay on the same site and use the in-app routes instead.
 */
function onOtherHost(): boolean {
  return typeof window !== "undefined" && !isAethexDomain();
}

function sameSite(path: string, query?: Record<string, string>): string {
  const url = new URL(path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function loginUrl(path = "/", query?: Record<string, string>): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (onOtherHost()) return sameSite(suffix === "/" ? "/login" : suffix, query);
  const url = new URL(`https://login.aethex.in${suffix}`);
  url.searchParams.set("aethexApp", "login");
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  // From a portal subdomain (find., store., ...), come back to it after signing in.
  const portal = currentPortal();
  if (portal && portal !== "cadus" && !url.searchParams.has("back") && typeof window !== "undefined") {
    url.searchParams.set("back", window.location.origin + (query?.next ?? window.location.pathname + window.location.search));
  }
  return url.toString();
}

/** The Cadus desktop download page: downloads.aethex.in (or /downloads off the aethex.in domain). */
export function downloadsUrl(): string {
  if (onOtherHost()) return sameSite("/downloads");
  return "https://downloads.aethex.in/";
}

export function cadusUrl(path = "/", query?: Record<string, string>): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (onOtherHost()) return sameSite(suffix === "/" ? "/ai-assistant" : suffix, query);
  const url = new URL(`https://cadus.aethex.in${suffix}`);
  url.searchParams.set("aethexApp", "cadus");
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function mainUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (onOtherHost()) return sameSite(suffix);
  return `https://aethex.in${suffix}`;
}

/** The Cadus sign-in page: auth.aethex.in, or /ai-assistant/sign-in on other hosts. */
export function authUrl(path = "/", query?: Record<string, string>): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (onOtherHost()) return sameSite(suffix === "/" ? "/ai-assistant/sign-in" : suffix, query);
  const url = new URL(`https://auth.aethex.in${suffix}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  return url.toString();
}

/* ------------------------------------------------------------------ the portals (update 58) */

/**
 * aethex.in is the front door; each part of Aethex has its own subdomain, served by the same app:
 * store.aethex.in, study.aethex.in, find.aethex.in, hospitals.aethex.in, medicalcolleges.aethex.in
 * and cadus.aethex.in. Off the aethex.in domain (tests, previews) each portal is an in-app route.
 */
export type Portal = "cadus" | "store" | "study" | "find" | "hospitals" | "medicalcolleges";
const PORTAL_ROUTE: Record<Exclude<Portal, "cadus">, string> = {
  store: "/store", study: "/study-hub", find: "/find", hospitals: "/hospitals", medicalcolleges: "/medical-colleges",
};

/** The portal this subdomain is, or null on aethex.in itself (and off the domain). */
export function currentPortal(): Portal | null {
  const h = currentHost().replace(/^www\./, "");
  if (h === "cadus.aethex.in") return "cadus";
  const sub = h.endsWith(".aethex.in") ? h.slice(0, -".aethex.in".length) : "";
  return sub in PORTAL_ROUTE ? (sub as Portal) : null;
}

/** A link into a portal: its subdomain on aethex.in, or its in-app route elsewhere. */
export function portalUrl(portal: Portal, path = "/"): string {
  if (portal === "cadus") return cadusUrl(path);
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (onOtherHost()) return sameSite(suffix === "/" ? PORTAL_ROUTE[portal] : suffix);
  return `https://${portal}.aethex.in${suffix}`;
}

/** Same-app links go through the router; a link to another subdomain is a full page load. */
export function isSameOrigin(href: string): boolean {
  if (typeof window === "undefined") return true;
  try { return new URL(href, window.location.href).origin === window.location.origin; } catch { return true; }
}
