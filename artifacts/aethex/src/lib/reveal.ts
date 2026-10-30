/**
 * Update 68: cards and section headings rise into view as the page is scrolled, on every platform.
 * Elements are marked only once JavaScript runs, so without it (or with reduced motion) everything simply shows.
 * After the animation the classes are removed, so hover effects work as before. Styles: src/shop.css (.ax-rv).
 * One observer for the whole page life; it watches the DOM for new content (pages, loaded data, route changes).
 * The marker is data-axrv (data-rv belongs to the older homepage reveal in site-pro.css).
 */
import { useEffect } from "react";

const SEL = [
  "[data-reveal]", ".ax-ihead", ".ax-dept", ".ax-kit", ".ax-bulk-how li", ".ax-ibrands li", ".ax-bulk-faq details", ".ax-icta",
  ".fd-svc", ".fd-concerns > a", ".fd-specs > a", ".fd-how ol li", ".fd-trust", ".fd-docband", ".fd-head",
  ".ax-sth-head", ".ax-sth-tools > *", ".ax-sth-stats > *", ".ax-sth-modes > *", ".ax-sth-plats > *", ".ax-sth-books > *", ".ax-sth-yt > *",
  ".kh-card", ".kh-dept", ".kh-topic", ".kh-feat",
  ".ec-cats > *", ".ec-sec-h", ".ec-promise > *",
].join(",");

let started = false;

function start() {
  if (started || typeof window === "undefined" || !("IntersectionObserver" in window) || !("MutationObserver" in window)) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  started = true;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      el.classList.add("ax-rv-in");
      let ended = false;
      const done = () => { if (ended) return; ended = true; el.classList.remove("ax-rv", "ax-rv-in"); el.style.transitionDelay = ""; el.dataset.axrv = "done"; };
      el.addEventListener("transitionend", (ev) => { if (ev.target === el) done(); });
      window.setTimeout(done, 1500);
    }
  }, { rootMargin: "0px 0px -5% 0px" });
  let t = 0;
  const scan = () => {
    t = 0;
    document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
      if (el.dataset.axrv || el.hasAttribute("data-rv")) return;
      el.dataset.axrv = "1";
      if (el.getBoundingClientRect().bottom < 0) { el.dataset.axrv = "done"; return; } // already scrolled past
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
      el.classList.add("ax-rv");
      io.observe(el);
    });
  };
  new MutationObserver(() => { if (!t) t = window.setTimeout(scan, 60); }).observe(document.body, { childList: true, subtree: true });
  scan();
}

/** Call from a component that is on every platform page (the portal header). */
export function useReveal() {
  useEffect(start, []);
}
