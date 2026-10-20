/**
 * A product photo from the brand's own site, at the size the page needs
 * (Shopify and Scene7 resize on request), without sending our address as the
 * referrer, and with a quiet placeholder if the photo can't load. Photos marked
 * "#ax-crop" carry a promotional band at the top that isn't our offer; it is
 * cropped away. Styles: src/shop.css (.ax-pimg).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { Package } from "lucide-react";

function sized(url: string, w: number): string {
  if (url.startsWith("https://cdn.shopify.com/")) return `${url}${url.includes("?") ? "&" : "?"}width=${w}`;
  if (/^https:\/\/(?:s7d9\.scene7\.com|assets\.solventum\.com)\/is\/image\//.test(url)) return `${url}${url.includes("?") ? "&" : "?"}wid=${w}`;
  return url;
}

export function imageInfo(url: string, width = 600) {
  const crop = url.endsWith("#ax-crop");
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
  return (
    <img
      className={`ax-pimg${info.crop ? " crop" : ""} ${className}`}
      src={info.src}
      srcSet={info.srcSet}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
