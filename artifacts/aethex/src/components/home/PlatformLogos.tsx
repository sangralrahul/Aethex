/**
 * Update 99: one family of logo marks for the Aethex platforms, used in the platform tabs on aethex.in and the
 * platform headers. Aethex and Cadus use their own brand marks (public/aethex-mark.png, public/cadus-icon.svg); the
 * others are drawn here. Update 105: redrawn in the style of those two (white tile, one bold gradient symbol).
 */
import type { ReactNode } from "react";

export type PlatformId = "aethex" | "doctors" | "store" | "study" | "hospitals" | "medicalcolleges" | "cadus";

// Update 105: redrawn to match the Aethex and Cadus marks: a white rounded tile with a faint edge and one bold symbol
// in the platform's colours (a diagonal gradient, like the Aethex "A"), with the white plus where it fits.
const TONES: Record<Exclude<PlatformId, "aethex" | "cadus">, [string, string]> = {
  doctors: ["#1d4ed8", "#0ea5e9"],
  store: ["#047857", "#14b8a6"],
  study: ["#5b21b6", "#a855f7"],
  hospitals: ["#0e7490", "#06b6d4"],
  medicalcolleges: ["#b45309", "#f59e0b"],
};

/** Each platform's symbol on a 24×24 grid; "G" is its gradient. */
const GLYPH: Record<Exclude<PlatformId, "aethex" | "cadus">, (G: string) => ReactNode> = {
  // a stethoscope
  doctors: (G) => <>
    <path d="M5.6 3.4v5.8a4.6 4.6 0 0 0 9.2 0V3.4" fill="none" stroke={G} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M10.2 13.8v1.8a4.6 4.6 0 0 0 9.2 0v-2.4" fill="none" stroke={G} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="19.4" cy="10.4" r="3" fill={G} />
    <circle cx="19.4" cy="10.4" r="1.1" fill="#fff" />
  </>,
  // a shopping bag with the plus
  store: (G) => <>
    <path d="M8.4 8.4V7a3.6 3.6 0 0 1 7.2 0v1.4" fill="none" stroke={G} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M4.6 8.4h14.8l-1.1 11.3a1.8 1.8 0 0 1-1.8 1.7H7.5a1.8 1.8 0 0 1-1.8-1.7L4.6 8.4Z" fill={G} />
    <path d="M12 11.6v6M9 14.6h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </>,
  // a graduation cap
  study: (G) => <>
    <path d="M12 3.6 1.4 8.8 12 14l10.6-5.2L12 3.6Z" fill={G} />
    <path d="M5.8 11.4v4.5c0 1.9 2.8 3.5 6.2 3.5s6.2-1.6 6.2-3.5v-4.5L12 14.5l-6.2-3.1Z" fill={G} opacity=".78" />
    <path d="M21 9.6v5.2" stroke={G} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="21" cy="16.2" r="1.5" fill={G} />
  </>,
  // a hospital with the plus
  hospitals: (G) => <>
    <path d="M4.4 21V9.8a1.6 1.6 0 0 1 1.6-1.6h2.6V4.6A1.6 1.6 0 0 1 10.2 3h3.6a1.6 1.6 0 0 1 1.6 1.6v3.6H18a1.6 1.6 0 0 1 1.6 1.6V21H4.4Z" fill={G} />
    <path d="M12 9.6v6.2M8.9 12.7h6.2" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
    <path d="M10.3 21v-2.3a1.7 1.7 0 0 1 3.4 0V21" fill="#fff" />
  </>,
  // a college front with the plus in the pediment
  medicalcolleges: (G) => <>
    <path d="M12 2.8 2.6 8.2v1.6h18.8V8.2L12 2.8Z" fill={G} />
    <path d="M5.6 11.6v6.4M10 11.6v6.4M14 11.6v6.4M18.4 11.6v6.4" stroke={G} strokeWidth="2.5" strokeLinecap="round" />
    <rect x="2.6" y="19.2" width="18.8" height="2.2" rx=".8" fill={G} />
    <path d="M12 5.2v2.8M10.6 6.6h2.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
  </>,
};

export function PlatformLogo({ id, size = 30 }: { id: PlatformId; size?: number }) {
  const base = import.meta.env.BASE_URL;
  if (id === "aethex") return <span className="pl-logo pl-img aethex" style={{ width: size, height: size }}><img src={`${base}aethex-mark-96.png`} alt="" width={size} height={size} /></span>;
  if (id === "cadus") return <span className="pl-logo pl-img cadus" style={{ width: size, height: size }}><img src={`${base}cadus-icon.svg`} alt="" width={size} height={size} /></span>;
  const [a, b] = TONES[id];
  const gid = `plg2-${id}`;
  return (
    <svg className={`pl-logo pl-mark ${id}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.4" fill="#fff" />
      <rect x=".5" y=".5" width="31" height="31" rx="6.9" fill="none" stroke="#0b0d10" strokeOpacity=".1" />
      <g transform="translate(4 4)">{GLYPH[id](`url(#${gid})`)}</g>
    </svg>
  );
}
