/**
 * Update 65: each Aethex platform stands on its own. Every page belongs to one portal (or is shared, like sign-in,
 * account, policies and contact); on the aethex.in domain a page is always shown on its own portal's subdomain,
 * with that portal's own header and footer, and nothing from the other platforms.
 */
import { currentHost, isAethexDomain, type Portal } from "@/lib/host";

type Site = Exclude<Portal, "cadus">;

/** Which portal a path belongs to (null: shared, it stays where it is). First match wins. */
const MAP: [RegExp, Site][] = [
  [/^\/admin\/doctors(\/|$)/, "doctors"],
  [/^\/(find|doctors?|clinics?|ask|articles|appointments|practice|list-your-practice|records|prescription|telemedicine-directory|which-doctor|saved-doctors|family)(\/|$)/, "doctors"],
  [/^\/(store|shop|products|category|brand|brands|books|cart|wishlist|compare|checkout|orders?|alerts|shipping-policy|returns-policy|cancellation-policy|grievance|my-reviews|seller|offers|reorder|gift)(\/|$)/, "store"],
  [/^\/(admin)(\/(store|reviews|sellers))?$/, "store"],
  [/^\/(study-hub|neet-pg|mock-test|flashcards|case-of-the-day|cme-hub|cme-certificate|tools|calculator|drug-reference|drug-interaction-checker|drug-alerts|study-planner|live-classes|learning-path|quiz-builder|progress-tracker|leaderboard|webinars|video-cases|cases|diagnosis|answer-eval|mentorship|news|patient-education|ai-scribe|my-consults|community|custom-test|my-library|study-groups|sectional-tests|study-moderation)(\/|$)/, "study"],
  [/^\/(hospitals|institutions|hospital-directory|institution-analytics|enterprise)(\/|$)/, "hospitals"],
  [/^\/(medical-colleges|colleges)(\/|$)/, "medicalcolleges"],
];
/** The product catalogue, the cart and checkout also open on the institution portals: they build their lists from the
 * catalogue, and a small priced list is ordered through the cart, which is kept in that portal's own browser storage. */
const CATALOGUE = /^\/(products|shop|category|brand|books|cart|checkout|order)(\/|$)/;

export function portalForPath(path: string): Site | null {
  for (const [re, p] of MAP) if (re.test(path)) return p;
  return null;
}

/**
 * Where this page should be shown, or null when it is already in the right place. On the aethex.in domain only:
 * aethex.in itself shows the front door and nothing else; each subdomain shows only its own pages.
 */
export function misplaced(path: string, search = ""): string | null {
  if (typeof window === "undefined" || !isAethexDomain()) return null;
  const host = currentHost().replace(/^www\./, "");
  if (host === "find.aethex.in") return `https://doctors.aethex.in${path}${search}`;
  const here = host === "aethex.in" ? null : (host.replace(/\.aethex\.in$/, "") as Site);
  if (here && !["store", "study", "doctors", "hospitals", "medicalcolleges"].includes(here)) return null; // login., auth., cadus., downloads.
  const want = portalForPath(path);
  if (!want || want === here) return null;
  if ((here === "hospitals" || here === "medicalcolleges") && CATALOGUE.test(path)) return null;
  // The portal home routes (/store, /find, /hospitals, /medical-colleges, /study-hub) are "/" on their own subdomain.
  return `https://${want}.aethex.in${onPortal(want, path)}${search}`;
}

/** A portal's home route (/store, /find, /hospitals, /medical-colleges) is "/" on its own subdomain. */
function onPortal(p: Site, path: string): string {
  const home: Partial<Record<Site, string>> = { store: "/store", doctors: "/find", hospitals: "/hospitals", medicalcolleges: "/medical-colleges" };
  return home[p] === path ? "/" : path;
}

/**
 * The canonical address of a page: on the portal it belongs to (a catalogue page seen on an institution portal stays
 * there), otherwise on the site it is open on.
 */
export function canonicalFor(path: string, site: string): string {
  const here = sitePortal();
  const want = portalForPath(path);
  if (!want || want === here || ((here === "hospitals" || here === "medicalcolleges") && CATALOGUE.test(path))) return `${site}${here ? onPortal(here, path) : path}`;
  return `https://${want}.aethex.in${onPortal(want, path)}`;
}

/* ------------------------------------------------------------------ what each portal's header and footer show */

export type NavLink = { href: string; label: string };
export interface PortalConfig {
  name: string;
  tagline: string;
  links: NavLink[];
  search: { placeholder: string; to: (q: string) => string; suggestions: string[] } | null;
  shop: boolean;
  cta: NavLink | null;
  /** A link at the right end of the category strip. */
  help?: NavLink;
  account: NavLink[];
  footer: { title: string; links: NavLink[] }[];
}

const HELP: NavLink[] = [{ href: "/contact", label: "Contact us" }, { href: "/privacy-policy", label: "Privacy" }, { href: "/terms-of-service", label: "Terms" }, { href: "/medical-disclaimer", label: "Medical disclaimer" }];

export const PORTALS: Record<Site, PortalConfig> = {
  store: {
    name: "Store",
    tagline: "Genuine medical equipment and supplies from verified brands, delivered across India with cash on delivery.",
    links: [
      { href: "/shop", label: "All products" }, { href: "/category/stethoscopes", label: "Stethoscopes" }, { href: "/category/bp-monitors", label: "BP monitors" },
      { href: "/category/diagnostic-instruments", label: "Diagnostics" }, { href: "/category/orthopaedic-supports", label: "Supports" }, { href: "/books", label: "Books" }, { href: "/brands", label: "Brands" }, { href: "/offers", label: "Offers" },
    ],
    search: { placeholder: "Search products, brands and books", to: (q) => `/shop?search=${encodeURIComponent(q)}`, suggestions: ["BP monitor", "Littmann stethoscope", "Pulse oximeter", "Glucometer", "Knee support", "Nebulizer", "Otoscope"] },
    shop: true,
    cta: null,
    help: { href: "/orders/track", label: "Track an order" },
    account: [{ href: "/account", label: "My account" }, { href: "/orders", label: "My orders" }, { href: "/orders/track", label: "Track an order" }, { href: "/wishlist", label: "Wishlist" }, { href: "/my-reviews", label: "My reviews" }],
    footer: [
      { title: "Shop", links: [{ href: "/shop", label: "All products" }, { href: "/category/bp-monitors", label: "BP monitors" }, { href: "/category/stethoscopes", label: "Stethoscopes" }, { href: "/category/diagnostic-instruments", label: "Diagnostic instruments" }, { href: "/category/diabetes-care", label: "Diabetes care" }, { href: "/books", label: "Medical books" }, { href: "/brands", label: "All brands" }] },
      { title: "Orders", links: [{ href: "/orders/track", label: "Track an order" }, { href: "/orders", label: "My orders" }, { href: "/offers", label: "Offers and coupons" }, { href: "/cart", label: "Cart" }, { href: "/wishlist", label: "Wishlist" }, { href: "/compare", label: "Compare" }] },
      { title: "Help", links: [{ href: "/shipping-policy", label: "Shipping & delivery" }, { href: "/returns-policy", label: "Returns & replacement" }, { href: "/grievance", label: "Grievances" }, ...HELP] },
    ],
  },
  doctors: {
    name: "Doctors",
    tagline: "Find checked doctors and clinics, book a visit or a video consult, ask a doctor and keep your health records.",
    links: [],
    search: { placeholder: "Search doctors, specialties and clinics", to: (q) => `/doctors?q=${encodeURIComponent(q)}`, suggestions: ["General Physician", "Paediatrician", "Dermatologist", "Gynaecologist / Obstetrician", "Dentist", "Orthopaedic Surgeon"] },
    shop: false,
    cta: { href: "/doctors", label: "Book an appointment" },
    account: [{ href: "/appointments", label: "My appointments" }, { href: "/family", label: "Family members" }, { href: "/saved-doctors", label: "Saved doctors" }, { href: "/records", label: "Health records" }, { href: "/ask?mine=1", label: "My questions" }, { href: "/account", label: "My account" }, { href: "/practice", label: "Practice dashboard" }],
    footer: [
      { title: "For patients", links: [{ href: "/doctors", label: "Find doctors" }, { href: "/which-doctor", label: "Which doctor should I see?" }, { href: "/saved-doctors", label: "Saved doctors" }, { href: "/clinics", label: "Clinics" }, { href: "/ask", label: "Ask a doctor" }, { href: "/articles", label: "Health articles" }, { href: "/appointments", label: "My appointments" }, { href: "/records", label: "Health records" }] },
      { title: "For doctors", links: [{ href: "/list-your-practice", label: "List your practice" }, { href: "/practice", label: "Practice dashboard" }, { href: "/practice/write", label: "Write an article" }, { href: "/ask", label: "Answer questions" }] },
      { title: "Help", links: HELP },
    ],
  },
  study: {
    name: "Study",
    tagline: "NEET-PG preparation, mock tests, flashcards, clinical cases and tools for every subject.",
    links: [
      { href: "/study-hub", label: "Study Hub" }, { href: "/neet-pg", label: "NEET-PG" }, { href: "/study-hub/medical-knowledge-hub", label: "Knowledge Hub" },
      { href: "/mock-test", label: "Mock tests" }, { href: "/custom-test", label: "Custom test" }, { href: "/sectional-tests", label: "Sectional tests" }, { href: "/study-groups", label: "Groups" }, { href: "/my-library", label: "My library" }, { href: "/flashcards", label: "Flashcards" }, { href: "/case-of-the-day", label: "Case of the day" }, { href: "/tools", label: "Clinical tools" },
    ],
    search: { placeholder: "Search topics, conditions and subjects", to: (q) => `/study-hub/medical-knowledge-hub?q=${encodeURIComponent(q)}`, suggestions: ["Brachial plexus", "Heart failure", "Diabetes mellitus", "Antibiotics", "Stroke", "Anaemia"] },
    shop: false,
    cta: { href: "/mock-test", label: "Take a mock test" },
    help: { href: "/cme-hub", label: "CME Hub" },
    account: [{ href: "/account", label: "My account" }, { href: "/my-library", label: "My library" }, { href: "/study-groups", label: "Study groups" }, { href: "/my-library?tab=revision", label: "Revision deck" }, { href: "/progress-tracker", label: "My progress" }, { href: "/cme-hub", label: "CME Hub" }, { href: "/study-planner", label: "Study planner" }],
    footer: [
      { title: "Prepare", links: [{ href: "/study-hub", label: "Study Hub" }, { href: "/neet-pg", label: "NEET-PG" }, { href: "/mock-test", label: "Mock tests" }, { href: "/custom-test", label: "Custom test" }, { href: "/sectional-tests", label: "Sectional tests" }, { href: "/study-groups", label: "Study groups" }, { href: "/my-library", label: "My library" }, { href: "/flashcards", label: "Flashcards" }, { href: "/study-planner", label: "Study planner" }, { href: "/cme-hub", label: "CME Hub" }] },
      { title: "Learn", links: [{ href: "/study-hub/medical-knowledge-hub", label: "Medical Knowledge Hub" }, { href: "/case-of-the-day", label: "Case of the day" }, { href: "/cases", label: "Clinical cases" }, { href: "/drug-reference", label: "Drug reference" }, { href: "/drug-interaction-checker", label: "Drug interactions" }, { href: "/calculator", label: "Medical calculators" }] },
      { title: "Help", links: HELP },
    ],
  },
  hospitals: {
    name: "for Hospitals",
    tagline: "Hospital furniture, ICU, emergency, diagnostic and lab equipment: send one list, get one quotation.",
    links: [{ href: "/", label: "Overview" }, { href: "/category/hospital-furniture", label: "Beds and furniture" }, { href: "/category/icu-equipment", label: "ICU" }, { href: "/category/emergency-care", label: "Emergency" }, { href: "/category/syringes-needles", label: "Syringes and IV" }, { href: "/category/lab-equipment", label: "Laboratory" }, { href: "/#list", label: "Build your list" }, { href: "/#how", label: "How it works" }, { href: "/institutions", label: "Directory" }, { href: "/account/quotations", label: "My quotations" }],
    search: { placeholder: "Search hospital equipment and supplies", to: (q) => `/shop?search=${encodeURIComponent(q)}`, suggestions: ["ICU bed", "Patient monitor", "Defibrillator", "Syringe pump", "Wheelchair", "Oxygen"] },
    shop: false,
    cta: { href: "/#list", label: "Request a quotation" },
    account: [{ href: "/account/quotations", label: "My quotations" }, { href: "/approvals", label: "Approvals" }, { href: "/equipment", label: "Equipment register" }, { href: "/account", label: "My account" }],
    footer: [
      { title: "Equipment", links: [{ href: "/category/hospital-furniture", label: "Hospital furniture" }, { href: "/category/icu-equipment", label: "ICU equipment" }, { href: "/category/emergency-care", label: "Emergency and resuscitation" }, { href: "/category/syringes-needles", label: "Syringes, needles and IV" }, { href: "/category/lab-equipment", label: "Laboratory equipment" }] },
      { title: "Buying", links: [{ href: "/#list", label: "Build your list" }, { href: "/#how", label: "How it works" }, { href: "/account/quotations", label: "My quotations" }, { href: "/approvals", label: "Approvals" }, { href: "/equipment", label: "Equipment register" }, { href: "/institutions", label: "Hospitals directory" }] },
      { title: "Help", links: HELP },
    ],
  },
  medicalcolleges: {
    name: "for Medical Colleges",
    tagline: "Skills trainers, manikins, anatomy models, lab equipment and textbooks: one list, one quotation.",
    links: [{ href: "/", label: "Overview" }, { href: "/category/skills-simulators", label: "Skills lab" }, { href: "/category/anatomy-models", label: "Anatomy models" }, { href: "/category/lab-equipment", label: "Laboratory" }, { href: "/category/stethoscopes", label: "Stethoscopes" }, { href: "/books", label: "Textbooks" }, { href: "/#list", label: "Build your list" }, { href: "/#how", label: "How it works" }, { href: "/account/quotations", label: "My quotations" }],
    search: { placeholder: "Search skills-lab, anatomy and lab equipment", to: (q) => `/shop?search=${encodeURIComponent(q)}`, suggestions: ["CPR manikin", "Skeleton model", "Microscope", "Stethoscope", "Centrifuge", "IV arm"] },
    shop: false,
    cta: { href: "/#list", label: "Request a quotation" },
    account: [{ href: "/account/quotations", label: "My quotations" }, { href: "/approvals", label: "Approvals" }, { href: "/equipment", label: "Equipment register" }, { href: "/account", label: "My account" }],
    footer: [
      { title: "Equipment", links: [{ href: "/category/skills-simulators", label: "Skills trainers and manikins" }, { href: "/category/anatomy-models", label: "Anatomy models and charts" }, { href: "/category/lab-equipment", label: "Laboratory equipment" }, { href: "/books", label: "Textbooks" }] },
      { title: "Buying", links: [{ href: "/#list", label: "Build your list" }, { href: "/#how", label: "How it works" }, { href: "/account/quotations", label: "My quotations" }, { href: "/approvals", label: "Approvals" }, { href: "/equipment", label: "Equipment register" }] },
      { title: "Help", links: HELP },
    ],
  },
};

/** The portal whose header and footer this page shows: the subdomain's. */
export function sitePortal(): Site | null {
  if (typeof window === "undefined") return null;
  const h = currentHost().replace(/^www\./, "").replace(/\.aethex\.in$/, "");
  return h in PORTALS ? (h as Site) : null;
}

/**
 * A hospital or college bulk list is kept in the browser of the portal it belongs to (each subdomain has its own
 * storage). Here: add to it on this page. Elsewhere on aethex.in: open the same page on that portal.
 */
export function bulkListAt(path: "/hospitals" | "/medical-colleges", page: string): { here: boolean; list: string; there: string } {
  const want: Site = path === "/hospitals" ? "hospitals" : "medicalcolleges";
  const p = sitePortal();
  if (!p) return { here: true, list: `${path}#list`, there: page };
  if (p === want) return { here: true, list: "/#list", there: page };
  return { here: false, list: `https://${want}.aethex.in/#list`, there: `https://${want}.aethex.in${page}` };
}
