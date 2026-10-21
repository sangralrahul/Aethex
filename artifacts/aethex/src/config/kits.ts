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
    id: "crash-cart",
    segment: "hospital",
    title: "Emergency crash cart",
    text: "A stocked crash cart: defibrillator monitor, adult and baby resuscitators, laryngoscope with blades, laryngeal masks, a cervical collar and a sharps container.",
    icon: "emergency",
    per: { one: "cart", many: "carts", count: 1, max: 50 },
    items: [
      { slug: "narang-medical-crash-cart-ss", qty: 1 },
      { slug: "mindray-beneheart-d3-defibrillator-monitor", qty: 1 },
      { slug: "mindray-pm-60-pulse-oximeter", qty: 1 },
      { slug: "ambu-spur-ii-disposable-resuscitator", option: "Adult - bag reservoir, 7 ft oxygen tubing, medium adult mask", qty: 2 },
      { slug: "ambu-mark-iv-reusable-resuscitator", option: "Baby - 2 reservoir bags, silicone face masks sizes 0A and 0", qty: 1 },
      { slug: "heine-standard-f-o-led-laryngoscope-battery-handle", option: "Standard", qty: 1 },
      { slug: "heine-classic-macintosh-fiber-optic-f-o-blades", option: "Mac 3", qty: 1 },
      { slug: "heine-classic-macintosh-fiber-optic-f-o-blades", option: "Mac 4", qty: 1 },
      { slug: "heine-classic-miller-fiber-optic-f-o-blades", option: "Miller 1", qty: 1 },
      { slug: "ambu-auragain-disposable-laryngeal-mask", option: "Size 3", qty: 2 },
      { slug: "ambu-auragain-disposable-laryngeal-mask", option: "Size 4", qty: 2 },
      { slug: "ambu-perfit-ace-extrication-collar", option: "Standard", qty: 1 },
      { slug: "bd-sharps-collectors", option: "Patient room sharps collector", qty: 1 },
    ],
  },
  {
    id: "icu-bed",
    segment: "hospital",
    title: "ICU bed set-up",
    text: "For each ICU bed: a motorised ICU bed, a patient monitor, syringe and volumetric pumps, a bedside locker, an IV stand and a sharps container.",
    icon: "icu",
    per: { one: "bed", many: "beds", count: 6, max: 200 },
    items: [
      { slug: "narang-medical-icu-bed-motorised-with-battery-backup", qty: 1 },
      { slug: "mindray-benevision-n17-n15-n12-patient-monitor", option: "BeneVision N12", qty: 1 },
      { slug: "mindray-benefusion-e-series-infusion-system", option: "BeneFusion eSP syringe pump", qty: 2 },
      { slug: "mindray-benefusion-e-series-infusion-system", option: "BeneFusion eVP volumetric pump", qty: 1 },
      { slug: "narang-medical-bedside-locker-deluxe", qty: 1 },
      { slug: "narang-medical-saline-stand-iv-stand-economy", option: "Stainless steel base", qty: 1 },
      { slug: "bd-sharps-collectors", option: "Patient room sharps collector", qty: 1 },
    ],
  },
  {
    id: "new-ward",
    segment: "hospital",
    title: "New ward, 10 beds",
    text: "Furniture for a 10-bed general ward: beds, lockers, IV stands, screens and step stools, with a stretcher, dressing, medicine and emergency trolley.",
    icon: "bed",
    per: { one: "ward", many: "wards", count: 1, max: 50 },
    items: [
      { slug: "narang-medical-semi-fowler-bed-manual", qty: 10 },
      { slug: "narang-medical-bedside-locker-deluxe", qty: 10 },
      { slug: "narang-medical-saline-stand-iv-stand-economy", option: "Polypropylene base", qty: 10 },
      { slug: "narang-medical-bedside-screen-superior", option: "3 folds, stainless steel", qty: 3 },
      { slug: "narang-medical-step-stool-foot-stool-ss", option: "Single step, stainless steel", qty: 5 },
      { slug: "narang-medical-stretcher-trolley-deluxe", qty: 1 },
      { slug: "narang-medical-dressing-trolley", qty: 1 },
      { slug: "narang-medical-medicine-trolley", qty: 1 },
      { slug: "narang-medical-emergency-trolley", qty: 1 },
    ],
  },
  {
    id: "ward-iv-supplies",
    segment: "hospital",
    title: "Injection and IV supplies, a month",
    text: "Syringes, needles, IV cannulas, IV sets, stopcocks, blood collection tubes and sharps containers for one ward for a month. Counts are pieces: we quote in the maker's boxes.",
    icon: "consumables",
    per: { one: "ward", many: "wards", count: 1, max: 50 },
    items: [
      { slug: "bd-luer-lok-tip-syringe", option: "3 mL", qty: 100 },
      { slug: "bd-luer-lok-tip-syringe", option: "5 mL", qty: 200 },
      { slug: "bd-luer-lok-tip-syringe", option: "10 mL", qty: 100 },
      { slug: "bd-precisionglide-needle", option: "23 G x 1 in", qty: 200 },
      { slug: "bd-precisionglide-needle", option: "21 G x 1 1/2 in", qty: 100 },
      { slug: "bd-insyte-autoguard-shielded-iv-catheter", option: "18 G x 1.16 in", qty: 25 },
      { slug: "bd-insyte-autoguard-shielded-iv-catheter", option: "20 G x 1.16 in", qty: 50 },
      { slug: "bd-insyte-autoguard-shielded-iv-catheter", option: "22 G x 1.00 in", qty: 50 },
      { slug: "bd-gravity-iv-administration-set", option: "Straight, fixed Luer lock, 188 cm", qty: 100 },
      { slug: "bd-connecta-3-way-stopcock", option: "White", qty: 50 },
      { slug: "bd-vacutainer-ultratouch-push-button-blood-collection-set", option: "21 G, pre-attached holder", qty: 50 },
      { slug: "bd-vacutainer-sst-tube", qty: 100 },
      { slug: "bd-vacutainer-edta-tube", qty: 100 },
      { slug: "bd-sharps-collectors", option: "Patient room sharps collector", qty: 4 },
    ],
  },
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
  {
    id: "skills-lab",
    segment: "college",
    title: "Clinical skills and simulation lab",
    text: "CPR manikins for adults and newborns, IV and injection arms, suturing, catheterisation, patient care, birthing, PPH and airway trainers for a skills lab.",
    icon: "cpr",
    per: { one: "lab", many: "labs", count: 1, max: 10 },
    items: [
      { slug: "laerdal-resusci-anne-qcpr-full-body-with-aed-and-airway-head", qty: 1 },
      { slug: "laerdal-little-anne-cpr-training-manikin", qty: 4 },
      { slug: "laerdal-mini-anne-plus-10-manikin-kit", qty: 1 },
      { slug: "3b-scientific-atlas-baby-newborn-life-support-manikin-light-skin", qty: 1 },
      { slug: "3b-scientific-iv-training-arm-light-skin", qty: 2 },
      { slug: "3b-scientific-intramuscular-injection-simulator-light-skin", qty: 1 },
      { slug: "3b-scientific-skin-suture-trainer-light-skin", qty: 6 },
      { slug: "3b-scientific-suture-practice-arm-light-skin", qty: 2 },
      { slug: "3b-scientific-catheterization-simulator-basic-male-light-skin", qty: 1 },
      { slug: "3b-scientific-patient-care-manikin-basic-light-skin", qty: 1 },
      { slug: "3b-scientific-birthing-simulator-basic-light-skin", qty: 1 },
      { slug: "3b-scientific-postpartum-haemorrhage-pph-trainer", qty: 1 },
      { slug: "3b-scientific-airway-management-trainer-light-skin", qty: 1 },
    ],
  },
  {
    id: "anatomy-lab",
    segment: "college",
    title: "Anatomy museum and teaching set",
    text: "Skeletons, spines, torsos and organ models (heart, lungs, urinary system, eye, ear, skin and pelvis) with wall charts for the anatomy department.",
    icon: "anatomy",
    per: { one: "department", many: "departments", count: 1, max: 10 },
    items: [
      { slug: "3b-scientific-human-skeleton-model-stan", qty: 2 },
      { slug: "3b-scientific-classic-flexible-human-spine-model", qty: 2 },
      { slug: "3b-scientific-lumbar-human-spinal-column-model", qty: 1 },
      { slug: "3b-scientific-classic-unisex-human-torso-model-14-part", qty: 1 },
      { slug: "3b-scientific-deluxe-dual-sex-human-muscle-torso-model-31-part", qty: 1 },
      { slug: "3b-scientific-classic-human-heart-model-2-part", qty: 2 },
      { slug: "3b-scientific-human-heart-model-2-times-life-size-4-part", qty: 1 },
      { slug: "3b-scientific-ct-bronchial-tree-model-with-larynx-transparent-lungs", qty: 1 },
      { slug: "3b-scientific-dual-sex-urinary-system-model-6-part", qty: 1 },
      { slug: "3b-scientific-human-eye-model-5-times-full-size-6-part", qty: 1 },
      { slug: "3b-scientific-human-ear-model-3-times-life-size-6-part", qty: 1 },
      { slug: "3b-scientific-human-skin-section-model-40-times-full-size", qty: 1 },
      { slug: "3b-scientific-pregnancy-pelvis-model-with-removable-fetus-3-part", qty: 1 },
      { slug: "3b-scientific-female-pelvis-model-in-median-section-2-part", qty: 1 },
      { slug: "3b-scientific-male-pelvis-model-in-median-section-2-part", qty: 1 },
      { slug: "3b-scientific-spinal-column-chart", qty: 1 },
      { slug: "3b-scientific-urinary-tract-chart-anatomy-and-physiology", qty: 1 },
    ],
  },
  {
    id: "pathology-lab",
    segment: "college",
    title: "Pathology and microbiology practical lab",
    text: "Microscopes for a practical class of 30 benches, a teaching microscope, centrifuges, an incubator, a hot air oven, a water bath, micropipettes and glassware.",
    icon: "lab",
    per: { one: "lab", many: "labs", count: 1, max: 10 },
    items: [
      { slug: "magnus-ch20i-laboratory-microscope", option: "Binocular, 3W LED", qty: 30 },
      { slug: "magnus-mlxi-plus-clinical-microscope", option: "Trinocular, 3W LED", qty: 1 },
      { slug: "magnus-teaching-microscope-dual-and-penta-head", option: "Penta head", qty: 1 },
      { slug: "remi-laboratory-centrifuge", option: "R-8C Plus (LED display)", qty: 1 },
      { slug: "remi-micro-centrifuge", qty: 1 },
      { slug: "remi-heating-incubator", option: "50 litres", qty: 1 },
      { slug: "remi-dry-hot-air-oven", option: "50 litres", qty: 1 },
      { slug: "borosil-elemental-water-bath", option: "12 L, convection (WLC012)", qty: 1 },
      { slug: "remi-cyclomixer", option: "CM-101 Plus", qty: 1 },
      { slug: "borosil-c3-micropipettes", option: "10-100 µl, variable", qty: 4 },
      { slug: "borosil-c3-micropipettes", option: "100-1000 µl, variable", qty: 4 },
      { slug: "tarsons-polygrid-test-tube-stand", option: "16 mm tubes, 60 places", qty: 10 },
      { slug: "borosil-low-form-beaker-with-spout", option: "100 ml", qty: 20 },
      { slug: "borosil-erlenmeyer-conical-flask-narrow-mouth-with-rim", option: "250 ml", qty: 20 },
      { slug: "borosil-measuring-cylinder-class-a-hexagonal-base-nabl-certified", option: "100 ml", qty: 10 },
      { slug: "borosil-petri-dish", option: "100 mm (bottom O.D.)", qty: 50 },
    ],
  },
];
