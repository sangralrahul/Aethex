/**
 * The two bulk-buying pages: Aethex for Hospitals (/hospitals) and Aethex for
 * Medical Colleges (/medical-colleges). What each page says and which store
 * categories it shows, section by section. The products themselves come from the
 * store's catalogue (src/data/store/catalog.json, with the admin's changes).
 * Page: src/pages/BulkPortal.tsx.
 */
import type { Segment } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";
import { COD_LIMIT } from "@/lib/store/rules";

export interface BulkSection {
  id: string;
  title: string;
  text: string;
  /** Store category slugs, in the order they are shown. */
  categories: string[];
}

export interface SegmentPage {
  segment: Segment;
  path: string;
  tag: string;
  /** For search engines and the browser tab. */
  seoTitle: string;
  seoDescription: string;
  title: string;
  subtitle: string;
  /** The quantity a product card starts at. */
  defaultQty: number;
  sections: BulkSection[];
  faq: { q: string; a: string }[];
  other: { path: string; label: string; text: string };
}

const cod = `₹${COD_LIMIT.toLocaleString("en-IN")}`;

const COMMON_FAQ = [
  { q: "Is there a minimum quantity?", a: `No. Add what you need. A small list (up to 10 of each item, all priced, up to ${cod}) can also be ordered straight away with cash on delivery.` },
  { q: "How is the price decided?", a: "The store price is shown as a guide. The quotation gives your price for the quantities you asked for, with delivery to your address." },
  { q: "How do we pay?", a: `After you accept the quotation, by bank transfer or against your purchase order. Orders placed straight from the list are cash on delivery, up to ${cod}.` },
  { q: "Can we ask for products that aren't listed?", a: "Yes. Write them in the notes with the quantity and we'll tell you what we can supply." },
  ...(BUSINESS.gstin ? [{ q: "Do you give GST invoices?", a: `Yes, with our GSTIN (${BUSINESS.gstin}). Add your institution's GSTIN to the request.` }] : []),
];

export const SEGMENT_PAGES: Record<Segment, SegmentPage> = {
  hospital: {
    segment: "hospital",
    path: "/hospitals",
    tag: "Aethex for Hospitals",
    seoTitle: "Bulk medical supplies for hospitals | Aethex",
    seoDescription: "Medical supplies for hospitals in bulk: BP monitors, oximeters, thermometers, stethoscopes, nebulizers and more. Build one list and get a quotation.",
    title: "Medical supplies for your hospital, in bulk",
    subtitle: "BP monitors, oximeters, thermometers, diagnostic sets, nebulizers and more, from the brands we stock. Build one list for every ward and department, and we'll send a quotation.",
    defaultQty: 5,
    sections: [
      { id: "wards", title: "Wards, OPD and ICU", text: "Blood pressure, oxygen saturation and temperature at every bedside and counter.", categories: ["bp-monitors", "sphygmomanometers", "pulse-oximeters", "thermometers"] },
      { id: "diagnostics", title: "Doctors' diagnostic instruments", text: "Stethoscopes, otoscopes, ophthalmoscopes, diagnostic sets, reflex hammers and penlights.", categories: ["stethoscopes", "diagnostic-instruments"] },
      { id: "respiratory", title: "Respiratory care", text: "Compressor and mesh nebulizers for wards and emergency.", categories: ["nebulizers"] },
      { id: "diabetes", title: "Diabetes care", text: "Glucometers, test strips and lancets.", categories: ["diabetes-care"] },
      { id: "scales", title: "Weighing and body composition", text: "Weighing scales and body composition monitors.", categories: ["weighing-scales"] },
      { id: "rehab", title: "Physiotherapy and rehabilitation", text: "Supports, braces, mobility aids, pillows and pain relief for orthopaedics and physiotherapy.", categories: ["orthopaedic-supports", "rehab-mobility", "pain-relief", "pillows-cushions"] },
    ],
    faq: COMMON_FAQ,
    other: { path: "/medical-colleges", label: "Aethex for Medical Colleges", text: "Buying for a medical college, a department or a student batch?" },
  },
  college: {
    segment: "college",
    path: "/medical-colleges",
    tag: "Aethex for Medical Colleges",
    seoTitle: "Bulk supplies for medical colleges | Aethex",
    seoDescription: "Stethoscopes for every student, instruments for clinical skills labs and textbooks, in bulk for medical colleges. Build one list and get a quotation.",
    title: "Supplies for medical colleges, departments and student batches",
    subtitle: "Stethoscopes for every student, instruments for clinical skills labs and textbooks for the library. Build one list for the whole batch or department, and we'll send a quotation.",
    defaultQty: 20,
    sections: [
      { id: "stethoscopes", title: "Stethoscopes for students and faculty", text: "3M Littmann, MDF, HEINE, Rossmax and Dr Trust, for first-year students to consultants.", categories: ["stethoscopes"] },
      { id: "skills", title: "Clinical skills labs", text: "BP apparatus, diagnostic sets, thermometers, oximeters and scales for teaching and OSCEs.", categories: ["sphygmomanometers", "diagnostic-instruments", "bp-monitors", "pulse-oximeters", "thermometers", "weighing-scales"] },
      { id: "departments", title: "Teaching hospital and community medicine", text: "Nebulizers and diabetes care for the teaching hospital, health centres and camps.", categories: ["nebulizers", "diabetes-care"] },
    ],
    faq: [
      ...COMMON_FAQ,
      { q: "Can students order on their own?", a: "Yes, from the store with cash on delivery. For a whole batch, one person can send a single list and we'll quote it together." },
    ],
    other: { path: "/hospitals", label: "Aethex for Hospitals", text: "Buying for a hospital, nursing home or clinic?" },
  },
};
