/**
 * aethex.in, the front door to Aethex. Update 91: a marketplace front page (components/home/HubTop.tsx): the platforms,
 * one search, categories, banners, then the latest products, books, study and doctors. Update 92: a quieter header,
 * the platform cards below removed (the platforms are in the header), and a full footer with the Aethex wordmark.
 * Styles: src/site-hub.css (hb-*, hx-*).
 */
import { MyAethex } from "@/components/home/MyAethex";
import { ContinueStrip } from "@/components/home/HubBits";
import { Banners, DoctorsAndHospitals, Essentials, LiveStats, HubFooter, HubHeader, LatestBooks, LatestProducts, TodayInStudy } from "@/components/home/HubTop";
import { useSeo } from "@/hooks/use-seo";
import { useEffect } from "react";

export default function Hub() {
  useSeo({
    title: "Aethex: find doctors, medical supplies, study and Cadus clinical AI, in one place",
    description: "Aethex for India's patients, doctors, students, hospitals and medical colleges: book doctors, shop genuine medical supplies, prepare for NEET-PG and ask Cadus. One account, five platforms.",
    path: "/",
  });
  // update 97: sections rise in as they scroll into view
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".hx-main > section, .hx-main > .hx-row, .hx-main > .hx-study, .hx-main > .hx-dh"));
    els.forEach((e) => e.classList.add("rv"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    const t = window.setTimeout(() => els.forEach((e) => e.classList.add("in")), 4000); // never leave anything hidden
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);
  return (
    <div className="hb" data-home="hub">
      <HubHeader />
      <div className="hx-main" id="for-you">
        <Banners />
        <LiveStats />
        <Essentials />
        <div className="hx-wrap hx-mine"><MyAethex /><ContinueStrip /></div>
        <LatestProducts />
        <TodayInStudy />
        <LatestBooks />
        <DoctorsAndHospitals />
      </div>
      <HubFooter />
    </div>
  );
}
