/**
 * A product photo from the brand's own site, at the size the page needs
 * (Shopify and Scene7 resize on request), without sending our address as the
 * referrer, and with a quiet placeholder if the photo can't load.
 *
 * Photos marked "#ax-crop=..." carry a promotional badge at the top (and a
 * footnote at the bottom) that isn't our offer; those parts are clipped away and
 * the rest is moved up to sit in the middle. The value says how deep the badge
 * reaches, in percent of the photo's height: "26" cuts across the full width;
 * "29.3,28,72,19.5" cuts 29.3% between 28% and 72% of the width and 19.5%
 * elsewhere, for photos where the product starts beside the badge.
 * Styles: src/shop.css (.ax-pimg).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { Package } from "lucide-react";

const FOOTNOTE = 3; // percent clipped from the bottom: the badge's "*Refer warranty policy" line

function sized(url: string, w: number): string {
  if (url.startsWith("https://cdn.shopify.com/")) return `${url}${url.includes("?") ? "&" : "?"}width=${w}`;
  if (/^https:\/\/(?:s7d9\.scene7\.com|assets\.solventum\.com)\/is\/image\//.test(url)) return `${url}${url.includes("?") ? "&" : "?"}wid=${w}`;
  return url;
}

export interface Crop { clip: string; shift: number }

export function cropOf(url: string): Crop | null {
  const m = /#ax-crop(?:=([\d.,]+))?$/.exec(url);
  if (!m) return null;
  const n = (m[1] ?? "").split(",").filter(Boolean).map(Number);
  const ok = n.every((x) => Number.isFinite(x) && x >= 0 && x <= 100);
  const [depth, left, right, side] = ok && n.length >= 1
    ? [n[0], n[1] ?? 0, n[2] ?? 100, n[3] ?? (n.length > 1 ? 0 : n[0])]
    : [26, 0, 100, 26];
  const bottom = 100 - FOOTNOTE;
  const clip = side >= depth || (left <= 0 && right >= 100)
    ? `inset(${depth}% 0 ${FOOTNOTE}% 0)`
    : `polygon(0 ${side}%, ${left}% ${side}%, ${left}% ${depth}%, ${right}% ${depth}%, ${right}% ${side}%, 100% ${side}%, 100% ${bottom}%, 0 ${bottom}%)`;
  return { clip, shift: Math.round(((FOOTNOTE - depth) / 2) * 100) / 100 };
}

export function imageInfo(url: string, width = 600) {
  const crop = cropOf(url);
  const u = url.replace(/#.*$/, "");
  const resizable = u !== sized(u, width);
  return { src: sized(u, width), srcSet: resizable ? `${sized(u, width)} 1x, ${sized(u, Math.min(2000, width * 2))} 2x` : undefined, crop };
}

export function ProductImage({ src, alt = "", width = 600, eager = false, className = "", style }: {
  src?: string; alt?: string; width?: number; eager?: boolean; className?: string; style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) {
    return <span className={`ax-pimg none ${className}`} aria-hidden="true"><Package size={28} /></span>;
  }
  const info = imageInfo(src, width);
  const cropVars = info.crop ? ({ "--ax-clip": info.crop.clip, "--ax-shift": `${info.crop.shift}%` } as CSSProperties) : undefined;
  return (
    <img
      className={`ax-pimg${info.crop ? " crop" : ""} ${className}`}
      src={info.src}
      srcSet={info.srcSet}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      style={cropVars || style ? { ...cropVars, ...style } : undefined}
      onError={() => setFailed(true)}
    />
  );
}
