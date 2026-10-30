/**
 * Update 82: "Continue where you left off" on aethex.in. The last doctor, product and study topic a person opened are
 * kept in one small cookie, `ax_last`, on .aethex.in so the hub (a different subdomain from the portals) can read it.
 * Off the domain (preview, workers.dev) it is a cookie for that host only. Nothing is sent anywhere: the server never
 * reads it. Holds titles and links only, and lasts 60 days.
 */
import { useEffect } from "react";
import { isAethexDomain, portalUrl, type Portal } from "@/lib/host";

export type LastKind = "doctor" | "product" | "topic";
export interface LastItem { title: string; sub?: string; href: string; at: number }
export type LastSeen = Partial<Record<LastKind, LastItem>>;

const NAME = "ax_last";
const PORTAL: Record<LastKind, Portal> = { doctor: "doctors", product: "store", topic: "study" };

export function readLastSeen(): LastSeen {
  if (typeof document === "undefined") return {};
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${NAME}=`));
  if (!raw) return {};
  try {
    const v = JSON.parse(decodeURIComponent(raw.slice(NAME.length + 1))) as LastSeen;
    const out: LastSeen = {};
    for (const k of ["doctor", "product", "topic"] as LastKind[]) {
      const x = v?.[k];
      if (x && typeof x.title === "string" && typeof x.href === "string" && /^(https:\/\/[a-z]+\.aethex\.in\/|\/)/.test(x.href) && Number.isFinite(x.at)) out[k] = { title: x.title.slice(0, 90), sub: typeof x.sub === "string" ? x.sub.slice(0, 60) : undefined, href: x.href, at: x.at };
    }
    return out;
  } catch { return {}; }
}

export function rememberVisit(kind: LastKind, title: string, path: string, sub?: string) {
  if (typeof document === "undefined" || !title) return;
  const all = readLastSeen();
  all[kind] = { title: title.slice(0, 90), sub: sub?.slice(0, 60), href: portalUrl(PORTAL[kind], path), at: Date.now() };
  const domain = isAethexDomain() ? "; domain=.aethex.in" : "";
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${NAME}=${encodeURIComponent(JSON.stringify(all))}; path=/; max-age=${60 * 86400}; samesite=lax${domain}${secure}`;
}

export function forgetVisits() {
  const domain = isAethexDomain() ? "; domain=.aethex.in" : "";
  document.cookie = `${NAME}=; path=/; max-age=0; samesite=lax${domain}`;
}

/** Call from a page once its title is known. */
export function useRememberVisit(kind: LastKind, title: string | undefined | null, path: string, sub?: string) {
  useEffect(() => { if (title) rememberVisit(kind, title, path, sub); }, [kind, title, path, sub]);
}
