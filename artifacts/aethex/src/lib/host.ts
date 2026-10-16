/**
 * Host-aware subdomain helpers for Aethex multi-domain setup.
 *
 * Domains:
 * - aethex.in / www.aethex.in  → main app
 * - login.aethex.in            → authentication page
 * - cadus.aethex.in            → AI assistant
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

export function isCadusHost(): boolean {
  return currentHost() === "cadus.aethex.in" || currentHost() === "www.cadus.aethex.in";
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
