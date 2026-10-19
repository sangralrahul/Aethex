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
  return url.toString();
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
