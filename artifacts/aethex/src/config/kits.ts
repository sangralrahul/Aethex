/**
 * Ready-made lists on the hospital and medical college pages (/hospitals,
 * /medical-colleges): a starting list of the store's products with quantities,
 * added to the bulk list in one go and changed there before asking for a
 * quotation. Quantities are a starting point, not a standard: every kit says so.
 * Products are named by their catalogue slug (src/data/store/catalog.json), with
 * the option to pick for products sold in sizes or colours.
 * Page: src/pages/BulkPortal.tsx. Adding: src/lib/store/kits.ts.
 */
import type { Segment } from "@/lib/store/types";

export interface KitItem {
  /** The product's slug in the catalogue. */
  slug: string;
  /** The option to pick (a size or colour, as the product lists it), for products sold in options. */
  option?: string;
  /** How many for one of the kit's units: one ward, one student, one station. */
  qty: number;
}

export type KitIcon = "ward" | "opd" | "student" | "station" | "emergency" | "consumables" | "bed" | "icu" | "anatomy" | "lab" | "cpr";

export interface Kit {
  id: string;
  segment: Segment;
  title: string;
  text: string;
  icon: KitIcon;
  /** What one set is for, when buyers scale it: "6 stations", "60 students". */
  per: { one: string; many: string; count: number; max: number };
  items: KitItem[];
}

export const KITS: Kit[] = [
  /* ------------------------------------------------------------------ hospitals */
  {
    id: "ward-monitoring",
    segment: "hospital",
    title: "Ward monitoring set",
    text: "Blood pressure, oxygen, temperature and sugar checks for a ward, with a nebulizer, a scale and a wheelchair.",
    icon: "ward",
    per: { one: "ward", many: "wards", count: 1, max: 50 },
    items: [
      { slug: "omron-hbp-1120-professional-bp-monitor", qty: 1 },
      { slug: "rossmax-gb-series-aneroid-sphygmomanometer", qty: 2 },
      { slug: "3m-littmann-classic-iii-stethoscope", qty: 2 },
      { slug: "dr-trust-professional-series-pulse-oximeter-202", qty: 2 },
      { slug: "dr-trust-non-contact-infrared-forehead-thermometer-603", qty: 2 },
      { slug: "dr-trust-flexible-tip-digital-thermometer-604", option: "Pack of 10", qty: 1 },
      { slug: "accu-chek-active-glucometer-kit", qty: 1 },
      { slug: "accu-chek-active-test-strips-pack-of-100", qty: 2 },
      { slug: "accu-chek-softclix-lancets-pack-of-200", qty: 1 },
      { slug: "rossmax-nb500-heavy-duty-piston-nebulizer", qty: 1 },
      { slug: "dr-trust-rechargeable-digital-weighing-scale-534", qty: 1 },
      { slug: "tynor-wheelchair", qty: 1 },
    ],
  },
  {
    id: "opd-room",
    segment: "hospital",
    title: "OPD consulting room",
    text: "What a doctor needs at the desk to examine patients: stethoscope, BP apparatus, diagnostic set and the small instruments.",
    icon: "opd",
    per: { one: "room", many: "rooms", count: 1, max: 50 },
    items: [
      { slug: "3m-littmann-classic-iii-stethoscope", qty: 1 },
      { slug: "mdf-instruments-desk-and-wall-aneroid-sphygmomanometer", qty: 1 },
      { slug: "heine-mini-3000-led-diagnostic-set-ophthalmoscope-and-otoscope", qty: 1 },
      { slug: "mdf-instruments-queen-square-reflex-hammer", qty: 1 },
      { slug: "mdf-instruments-tuning-fork-128-hz", qty: 1 },
      { slug: "mdf-instruments-tuning-fork-512-hz", qty: 1 },
      { slug: "mdf-instruments-luminix-ii-diagnostic-penlight", qty: 1 },
      { slug: "mdf-instruments-snellen-pocket-eye-chart", qty: 1 },
      { slug: "mdf-instruments-medical-measuring-tape-60-inch", qty: 1 },
      { slug: "dr-trust-non-contact-infrared-forehead-thermometer-603", qty: 1 },
      { slug: "dr-trust-professional-series-pulse-oximeter-202", qty: 1 },
      { slug: "dr-trust-rechargeable-digital-weighing-scale-534", qty: 1 },
    ],
  },

  /* ------------------------------------------------------------------ medical colleges */
  {
    id: "student-kit",
    segment: "college",
    title: "Student clinical kit",
    text: "A set for every student in a batch: stethoscope, BP apparatus, reflex hammer, tuning forks, penlight and measuring tape.",
    icon: "student",
    per: { one: "student", many: "students", count: 60, max: 1000 },
    items: [
      { slug: "3m-littmann-classic-iii-stethoscope", qty: 1 },
      { slug: "mdf-instruments-calibra-pocket-aneroid-sphygmomanometer", option: "Black", qty: 1 },
      { slug: "mdf-instruments-taylor-reflex-hammer", option: "Black", qty: 1 },
      { slug: "mdf-instruments-tuning-fork-128-hz", qty: 1 },
      { slug: "mdf-instruments-tuning-fork-512-hz", qty: 1 },
      { slug: "mdf-instruments-luminix-ii-diagnostic-penlight", qty: 1 },
      { slug: "mdf-instruments-medical-measuring-tape-60-inch", qty: 1 },
    ],
  },
  {
    id: "skills-station",
    segment: "college",
    title: "Clinical skills station",
    text: "Instruments for one examination station in a clinical skills lab or an OSCE.",
    icon: "station",
    per: { one: "station", many: "stations", count: 6, max: 100 },
    items: [
      { slug: "heine-gamma-g5-sphygmomanometer", qty: 1 },
      { slug: "3m-littmann-classic-iii-stethoscope", qty: 1 },
      { slug: "heine-beta-200-led-diagnostic-set-ophthalmoscope-and-otoscope", qty: 1 },
      { slug: "mdf-instruments-queen-square-reflex-hammer", qty: 1 },
      { slug: "mdf-instruments-tuning-fork-128-hz", qty: 1 },
      { slug: "mdf-instruments-tuning-fork-512-hz", qty: 1 },
      { slug: "mdf-instruments-luminix-ii-diagnostic-penlight", qty: 1 },
      { slug: "mdf-instruments-snellen-pocket-eye-chart", qty: 1 },
      { slug: "mdf-instruments-goniometer-14-inch", qty: 1 },
      { slug: "mdf-instruments-medical-measuring-tape-60-inch", qty: 1 },
      { slug: "dr-trust-professional-series-pulse-oximeter-202", qty: 1 },
      { slug: "dr-trust-non-contact-infrared-forehead-thermometer-603", qty: 1 },
    ],
  },
];
