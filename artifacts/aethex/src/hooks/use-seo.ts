import { useEffect } from "react";

const SITE = "https://aethex.in";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export interface SeoOptions {
  title: string;
  description: string;
  /** Path only, e.g. "/neet-pg". Defaults to the current pathname. */
  path?: string;
  /** Absolute URL of the social preview image. */
  image?: string;
  type?: "website" | "article" | "product";
}

/**
 * Sets page-specific title, description, canonical, Open Graph and Twitter tags.
 */
export function useSeo({ title, description, path, image, type = "website" }: SeoOptions) {
  useEffect(() => {
    const url = `${SITE}${path ?? window.location.pathname}`.replace(/\/+$/, "") || SITE;
    const canonicalUrl = url === SITE ? `${SITE}/` : url;
    const img = image ?? DEFAULT_IMAGE;

    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;

    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:image"]', "property", "og:image", img);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", img);
  }, [title, description, path, image, type]);
}

export default useSeo;
