/**
 * The courses on the medical books page (/books), and the groups (years,
 * degrees) inside each. Books name their group in their placements
 * (src/data/store/books.json); subjects come from the books themselves.
 * Page: src/pages/MedicalBooks.tsx.
 */

export type CourseIcon = "stethoscope" | "graduation" | "brain" | "target" | "heart" | "smile" | "pill" | "activity" | "leaf" | "flask";

export interface BookGroup {
  id: string;
  label: string;
  /** For chips and cards: "1st year", "BSc Nursing". */
  short: string;
}

export interface BookCourse {
  id: string;
  label: string;
  blurb: string;
  icon: CourseIcon;
  groups: BookGroup[];
}

export const BOOK_COURSES: BookCourse[] = [
  {
    id: "mbbs", label: "MBBS", blurb: "First year to final year", icon: "stethoscope",
    groups: [
      { id: "mbbs-1", label: "MBBS first year", short: "1st year" },
      { id: "mbbs-2", label: "MBBS second year", short: "2nd year" },
      { id: "mbbs-3", label: "MBBS third year", short: "3rd year" },
      { id: "mbbs-4", label: "MBBS final year", short: "Final year" },
    ],
  },
  { id: "pg", label: "MD, MS and DNB", blurb: "Postgraduate references by specialty", icon: "graduation", groups: [{ id: "pg", label: "MD, MS and DNB", short: "MD, MS, DNB" }] },
  { id: "ss", label: "DM and MCh", blurb: "Super-specialty references", icon: "brain", groups: [{ id: "ss", label: "DM and MCh", short: "DM, MCh" }] },
  {
    id: "exams", label: "Entrance exams", blurb: "NEET-PG, INI-CET, FMGE, NExT and NEET-UG", icon: "target",
    groups: [
      { id: "exam-pg", label: "NEET-PG, INI-CET, FMGE and NExT", short: "NEET-PG, FMGE" },
      { id: "exam-ug", label: "NEET-UG", short: "NEET-UG" },
    ],
  },
  {
    id: "nursing", label: "Nursing", blurb: "GNM, BSc and MSc Nursing", icon: "heart",
    groups: [
      { id: "gnm", label: "GNM", short: "GNM" },
      { id: "bsc-nursing", label: "BSc Nursing", short: "BSc Nursing" },
      { id: "msc-nursing", label: "MSc Nursing", short: "MSc Nursing" },
      { id: "nursing-exams", label: "Nursing exams", short: "Exams" },
    ],
  },
  {
    id: "dental", label: "Dental", blurb: "BDS, MDS and NEET-MDS", icon: "smile",
    groups: [
      { id: "bds", label: "BDS", short: "BDS" },
      { id: "mds", label: "MDS", short: "MDS" },
      { id: "dental-exams", label: "NEET-MDS", short: "NEET-MDS" },
    ],
  },
  {
    id: "pharmacy", label: "Pharmacy", blurb: "D.Pharm, B.Pharm, M.Pharm and Pharm.D", icon: "pill",
    groups: [
      { id: "dpharm", label: "D.Pharm", short: "D.Pharm" },
      { id: "bpharm", label: "B.Pharm", short: "B.Pharm" },
      { id: "mpharm", label: "M.Pharm and Pharm.D", short: "M.Pharm" },
    ],
  },
  {
    id: "physio", label: "Physiotherapy", blurb: "BPT and MPT", icon: "activity",
    groups: [
      { id: "bpt", label: "BPT", short: "BPT" },
      { id: "mpt", label: "MPT", short: "MPT" },
    ],
  },
  {
    id: "ayush", label: "AYUSH", blurb: "Ayurveda, Homoeopathy, Siddha and Unani", icon: "leaf",
    groups: [
      { id: "bams", label: "Ayurveda (BAMS)", short: "BAMS" },
      { id: "bhms", label: "Homoeopathy (BHMS)", short: "BHMS" },
      { id: "bsms", label: "Siddha (BSMS)", short: "BSMS" },
      { id: "bums", label: "Unani (BUMS)", short: "BUMS" },
    ],
  },
  { id: "allied", label: "Allied health", blurb: "Lab, imaging, OT, optometry, dialysis, nutrition", icon: "flask", groups: [{ id: "allied", label: "Allied health and paramedical", short: "Allied health" }] },
];

const GROUPS = new Map(BOOK_COURSES.flatMap((c) => c.groups.map((g) => [g.id, { course: c, group: g }] as const)));
export const groupInfo = (id: string) => GROUPS.get(id);
export const courseOf = (id: string) => BOOK_COURSES.find((c) => c.id === id);

/** Cover colours for books without a publisher's cover: deep, print-like shades. */
const COVER_COLOURS = ["#1f4e79", "#7a1f2b", "#1d5c4a", "#4a2c6b", "#8a4b0f", "#23395b", "#5b2a3c", "#2f5d62", "#6b3e26", "#2c4a2e", "#3d3f8f", "#7b2d26"];
export function coverColour(key: string): string {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_COLOURS[h % COVER_COLOURS.length];
}
