/**
 * aethex.in, the front door to Aethex. Update 91: a marketplace front page (components/home/HubTop.tsx): the platforms,
 * one search, categories, banners, then the latest products, books, study and doctors. Update 92: a quieter header,
 * the platform cards below removed (the platforms are in the header), and a full footer with the Aethex wordmark.
 * Styles: src/site-hub.css (hb-*, hx-*).
 */
import { MyAethex } from "@/components/home/MyAethex";
import { ContinueStrip } from "@/components/home/HubBits";
import { Banners, DoctorsAndHospitals, HubFooter, HubHeader, LatestBooks, LatestProducts, TodayInStudy } from "@/components/home/HubTop";
import { useSeo } from "@/hooks/use-seo";

export default function Hub() {
  useSeo({
    title: "Aethex: find doctors, medical supplies, study and Cadus clinical AI, in one place",
    description: "Aethex for India's patients, doctors, students, hospitals and medical colleges: book doctors, shop genuine medical supplies, prepare for NEET-PG and ask Cadus. One account, five platforms.",
    path: "/",
  });
  return (
    <div className="hb" data-home="hub">
      <HubHeader />
      <div className="hx-main" id="for-you">
        <Banners />
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
