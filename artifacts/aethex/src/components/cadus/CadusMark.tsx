/**
 * Cadus brand mark: a soft medical cross with an AI spark cut out of its
 * centre. Care and intelligence in one silhouette.
 *
 * Variants
 *  - "gradient" (default): teal → blue brand gradient, transparent background
 *  - "mono": single colour (uses `color`, defaults to currentColor)
 *  - "tile": app icon, gradient mark on a navy rounded square
 */
import { useId } from "react";

export const CADUS_CROSS =
  "M49 6H51A17 17 0 0 1 68 23V24A8 8 0 0 0 76 32H77A17 17 0 0 1 94 49V51A17 17 0 0 1 77 68H76A8 8 0 0 0 68 76V77A17 17 0 0 1 51 94H49A17 17 0 0 1 32 77V76A8 8 0 0 0 24 68H23A17 17 0 0 1 6 51V49A17 17 0 0 1 23 32H24A8 8 0 0 0 32 24V23A17 17 0 0 1 49 6Z";
export const CADUS_SPARK = "M50 35Q52.25 47.75 65 50Q52.25 52.25 50 65Q47.75 52.25 35 50Q47.75 47.75 50 35Z";

const STOPS: [string, string][] = [
  ["0", "#67E8D6"],
  ["0.48", "#14B8A6"],
  ["1", "#2563EB"],
];

interface Props {
  size?: number;
  variant?: "gradient" | "mono" | "tile";
  color?: string;
  /** Spark turns while Cadus is working. */
  thinking?: boolean;
  title?: string;
  className?: string;
}

export default function CadusMark({ size = 28, variant = "gradient", color, thinking = false, title = "Cadus", className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const grad = `cadus-g-${uid}`;
  const mask = `cadus-m-${uid}`;
  const tileGrad = `cadus-t-${uid}`;
  const fill = variant === "mono" ? color ?? "currentColor" : `url(#${grad})`;
  const glyph = (
    <>
      <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect width="100" height="100" fill="#fff" />
        <path d={CADUS_SPARK} fill="#000">
          {thinking && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 50 50;90 50 50"
              keyTimes="0;1"
              keySplines="0.6 0 0.2 1"
              calcMode="spline"
              dur="1.3s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </mask>
      <path d={CADUS_CROSS} fill={fill} mask={`url(#${mask})`} />
    </>
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={className ? `cadus-mark ${className}` : "cadus-mark"}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={grad} x1="0.12" y1="0.02" x2="0.88" y2="0.98">
          {STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        {variant === "tile" && (
          <linearGradient id={tileGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#152A45" />
            <stop offset="1" stopColor="#0A1626" />
          </linearGradient>
        )}
      </defs>
      {variant === "tile" ? (
        <>
          <rect width="100" height="100" rx="23" fill={`url(#${tileGrad})`} />
          <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="22.25" fill="none" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="1.5" />
          <g transform="translate(17 17) scale(0.66)">{glyph}</g>
        </>
      ) : (
        glyph
      )}
    </svg>
  );
}

const GRAD_DEF = `<linearGradient id="g" x1="0.12" y1="0.02" x2="0.88" y2="0.98">${STOPS.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const MASK_DEF = `<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${CADUS_SPARK}" fill="#000"/></mask>`;

/** Standalone brand mark SVG (favicon, downloads). */
export const CADUS_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${GRAD_DEF}${MASK_DEF}</defs><path d="${CADUS_CROSS}" fill="url(#g)" mask="url(#m)"/></svg>`;

/** App icon SVG: gradient mark on a navy tile. */
export const CADUS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${GRAD_DEF}${MASK_DEF}<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#152A45"/><stop offset="1" stop-color="#0A1626"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="url(#t)"/><g transform="translate(17 17) scale(0.66)"><path d="${CADUS_CROSS}" fill="url(#g)" mask="url(#m)"/></g></svg>`;

export const CADUS_ICON_DATA_URL = `data:image/svg+xml,${encodeURIComponent(CADUS_MARK_SVG)}`;

/** Kept for compatibility with pages that injected the old animation CSS. */
export const CADUS_MARK_CSS = "";
