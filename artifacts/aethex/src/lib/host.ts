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
  return host === "aethex.in" || host === "www.aethex.in" || host === "localhost" || host === "" || host.endsWith(".lovable.app");
}

export function isLoginHost(): boolean {
  return currentHost() === "login.aethex.in" || currentHost() === "www.login.aethex.in";
}

export function isCadusHost(): boolean {
  return currentHost() === "cadus.aethex.in" || currentHost() === "www.cadus.aethex.in";
}

export function loginUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`https://login.aethex.in${suffix}`);
  url.searchParams.set("aethexApp", "login");
  return url.toString();
}

export function cadusUrl(path = "/", query?: Record<string, string>): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`https://cadus.aethex.in${suffix}`);
  url.searchParams.set("aethexApp", "cadus");
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  return url.toString();
}


export function mainUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `https://aethex.in${suffix}`;
}
