/**
 * Update 99: one family of logo marks for the Aethex platforms, used in the platform tabs on aethex.in. Each is a
 * rounded square in the platform's colour (a gradient with a soft top light) and a white symbol: Aethex and Cadus
 * use their own brand marks (public/aethex-mark.png, public/cadus-icon.svg); the others are drawn here.
 */
import type { ReactNode } from "react";

export type PlatformId = "aethex" | "doctors" | "store" | "study" | "hospitals" | "medicalcolleges" | "cadus";

const TONES: Record<Exclude<PlatformId, "aethex" | "cadus">, [string, string]> = {
  doctors: ["#1d4ed8", "#38bdf8"],
  store: ["#0f766e", "#34d399"],
  study: ["#5b21b6", "#a78bfa"],
  hospitals: ["#0e7490", "#22d3ee"],
  medicalcolleges: ["#c2410c", "#fbbf24"],
};

/** The white symbol of each platform, drawn on a 24×24 grid. */
const GLYPH: Record<Exclude<PlatformId, "aethex" | "cadus">, ReactNode> = {
  // a map pin holding a medical cross: find a doctor near you
  doctors: <>
    <path d="M12 21.2s-6.4-5.6-6.4-10.6a6.4 6.4 0 1 1 12.8 0c0 5-6.4 10.6-6.4 10.6Z" fill="#fff" />
    <path d="M12 7.2v6.4M8.8 10.4h6.4" stroke="var(--g0)" strokeWidth="2.1" strokeLinecap="round" />
  </>,
  // a shopping bag with a cross on its face
  store: <>
    <path d="M8.6 8.2V7a3.4 3.4 0 0 1 6.8 0v1.2" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M5.4 8.2h13.2l-1 11.4a1.6 1.6 0 0 1-1.6 1.4H8a1.6 1.6 0 0 1-1.6-1.4L5.4 8.2Z" fill="#fff" />
    <path d="M12 11.6v5.2M9.4 14.2h5.2" stroke="var(--g0)" strokeWidth="2" strokeLinecap="round" />
  </>,
  // an open book with a heartbeat across its pages
  study: <>
    <path d="M12 7.4c-2.2-1.6-5-2-8-1.6v12.4c3-.4 5.8 0 8 1.6 2.2-1.6 5-2 8-1.6V5.8c-3-.4-5.8 0-8 1.6Z" fill="#fff" />
    <path d="M12 7.6v11.8" stroke="var(--g0)" strokeWidth="1.2" opacity=".45" />
    <path d="M5.6 13.4h2.2l1-2.2 1.4 4 1-1.8h1.6l1-2 1.4 3.6 1-1.6h2.2" fill="none" stroke="var(--g0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  // a hospital block with a cross over the door
  hospitals: <>
    <path d="M4.6 20.4V9.6a1.2 1.2 0 0 1 1.2-1.2h3V4.8A1.2 1.2 0 0 1 10 3.6h4a1.2 1.2 0 0 1 1.2 1.2v3.6h3a1.2 1.2 0 0 1 1.2 1.2v10.8H4.6Z" fill="#fff" />
    <path d="M12 5.4v4.2M9.9 7.5h4.2" stroke="var(--g0)" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M10.4 20.4v-3.6a1.6 1.6 0 0 1 3.2 0v3.6" fill="var(--g0)" />
    <path d="M6.8 12.2h1.6M6.8 15.2h1.6M15.6 12.2h1.6M15.6 15.2h1.6" stroke="var(--g0)" strokeWidth="1.5" strokeLinecap="round" />
  </>,
  // a college front: pediment, four columns and steps
  medicalcolleges: <>
    <path d="M12 3.4 3.6 8v1.4h16.8V8L12 3.4Z" fill="#fff" />
    <path d="M6 11v6.6M10 11v6.6M14 11v6.6M18 11v6.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M3.6 19h16.8v1.8H3.6z" fill="#fff" />
    <path d="M12 5.6v2.4M10.8 6.8h2.4" stroke="var(--g0)" strokeWidth="1.2" strokeLinecap="round" />
  </>,
};

export function PlatformLogo({ id, size = 30 }: { id: PlatformId; size?: number }) {
  const base = import.meta.env.BASE_URL;
  if (id === "aethex") return <span className="pl-logo pl-img aethex" style={{ width: size, height: size }}><img src={`${base}aethex-mark.png`} alt="" width={size} height={size} /></span>;
  if (id === "cadus") return <span className="pl-logo pl-img cadus" style={{ width: size, height: size }}><img src={`${base}cadus-icon.svg`} alt="" width={size} height={size} /></span>;
  const [a, b] = TONES[id];
  const gid = `plg-${id}`;
  return (
    <svg className={`pl-logo ${id}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ ["--g0" as string]: a }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={b} /><stop offset="1" stopColor={a} /></linearGradient>
        <radialGradient id={`${gid}-l`} cx=".3" cy=".1" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gid})`} />
      <rect width="32" height="32" rx="9" fill={`url(#${gid}-l)`} />
      <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="#fff" strokeOpacity=".22" />
      <g transform="translate(4 4)">{GLYPH[id]}</g>
    </svg>
  );
}
