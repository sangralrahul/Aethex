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
 * Update 104: photos load through aethex.in (/img, worker/img.ts), kept at the edge for a month, so they come from one
 * fast address; if that fails the photo is loaded straight from the brand's site, and only then the placeholder shows.
 * Styles: src/shop.css (.ax-pimg).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { BookOpen, Package } from "lucide-react";

const FOOTNOTE = 3; // percent clipped from the bottom: the badge's "*Refer warranty policy" line

function sized(url: string, w: number): string {
  if (url.startsWith("https://cdn.shopify.com/")) return `${url}${url.includes("?") ? "&" : "?"}width=${w}`;
  if (/^https:\/\/(?:s7d9\.scene7\.com|assets\.solventum\.com)\/is\/image\//.test(url)) return `${url}${url.includes("?") ? "&" : "?"}wid=${w}`;
  return url;
}

/** The photo through aethex.in's photo cache (absolute addresses on other sites only). */
export const viaUs = (u: string) => (/^https:\/\//.test(u) && !/^https:\/\/([a-z]+\.)?aethex\.in\//.test(u) ? `/img?u=${encodeURIComponent(u)}` : u);

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

export function ProductImage({ src, alt = "", width = 600, eager = false, className = "", style, book = false }: {
  src?: string; alt?: string; width?: number; eager?: boolean; className?: string; style?: CSSProperties;
  /** A medical book: without a cover photo it shows a book instead of a parcel. */
  book?: boolean;
}) {
  // 0: through aethex.in; 1: straight from the brand's site; 2: neither loaded
  const [tries, setTries] = useState(0);
  useEffect(() => { setTries(0); }, [src]);
  if (!src || tries >= 2) {
    return <span className={`ax-pimg none${book ? " book" : ""} ${className}`} aria-hidden="true">{book ? <BookOpen size={26} /> : <Package size={28} />}</span>;
  }
  const info = imageInfo(src, width);
  const cropVars = info.crop ? ({ "--ax-clip": info.crop.clip, "--ax-shift": `${info.crop.shift}%` } as CSSProperties) : undefined;
  return (
    <img
      className={`ax-pimg${info.crop ? " crop" : ""} ${className}`}
      src={tries === 0 ? viaUs(info.src) : info.src}
      srcSet={info.srcSet && tries === 0 ? info.srcSet.split(", ").map((x) => { const [u, d] = x.split(" "); return `${viaUs(u!)} ${d}`; }).join(", ") : info.srcSet}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      style={cropVars || style ? { ...cropVars, ...style } : undefined}
      onError={() => setTries((t) => t + 1)}
    />
  );
}
