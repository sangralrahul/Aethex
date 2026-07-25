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
  return `https://login.aethex.in${suffix}`;
}

export function cadusUrl(path = "/", query?: Record<string, string>): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = `https://cadus.aethex.in${suffix}`;
  if (!query || Object.keys(query).length === 0) return url;
  const qs = new URLSearchParams(query).toString();
  return `${url}?${qs}`;
}


export function mainUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `https://aethex.in${suffix}`;
}
