/**
 * Cadus plans: Starter (free), Core, Professional, and Enterprise for medical
 * colleges and institutions. The plan lives on the Aethex account; limits are
 * applied in the app. Prices are in US dollars. Core and Professional are requested by invoice until the
 * payment gateway is switched on; Enterprise is quoted.
 */
import { SUPPORT_EMAIL } from "./legal";

export type PlanId = "starter" | "core" | "professional" | "enterprise";

export interface PlanLimits {
  /** Questions a day; Infinity for no limit. */
  questionsPerDay: number;
  /** Live sources (WHO, ICMR, NICE, PubMed) with citations. */
  sources: boolean;
  /** Cadus Magnus 3.6 as the drafting model, not only the reviewer. */
  magnus: boolean;
  /** Image and report reading. */
  reading: boolean;
  /** The prescriber with letterhead printing and Word export. */
  prescriber: boolean;
  /** Institution protocols and team packs. */
  institution: boolean;
  /** Timed mock tests in Learn. */
  mocks: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  audience: string;
  /** US dollars a month per user; null when quoted. */
  monthly: number | null;
  /** Yearly price in US dollars; null when only monthly billing is offered. */
  yearly: number | null;
  limits: PlanLimits;
  /** What the plan includes, in order, for the plans page. */
  includes: string[];
  /** The pitch line on the card. */
  cta: string;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", tagline: "Try Cadus every day, free.", audience: "Students and first-year residents",
    monthly: 0, yearly: 0,
    limits: { questionsPerDay: 15, sources: false, magnus: false, reading: false, prescriber: false, institution: false, mocks: false },
    includes: ["15 clinical questions a day", "Every answer checked by a second model", "All 22 answer modes and 43 calculators", "Cases, ward round and projects on your device", "Learn: daily set and spaced-repetition review", "Share answers by link and QR"],
    cta: "Included with every Aethex account",
  },
  {
    id: "core", name: "Core", tagline: "For the wards and the exam.", audience: "Residents, interns and aspirants",
    monthly: 10, yearly: null,
    limits: { questionsPerDay: 100, sources: true, magnus: false, reading: true, prescriber: false, institution: false, mocks: true },
    includes: ["100 questions a day", "Everything in Starter", "Live sources: WHO, ICMR, NICE and PubMed, cited", "Image and report reading: X-ray, ECG, CT, labs and more", "Learn: timed mock tests with NEET-style marks", "Research: PubMed search, reading list and the thesis kit"],
    cta: "Most residents choose Core", popular: true,
  },
  {
    id: "professional", name: "Professional", tagline: "For practising doctors.", audience: "Consultants, GPs and clinics",
    monthly: 35, yearly: null,
    limits: { questionsPerDay: Infinity, sources: true, magnus: true, reading: true, prescriber: true, institution: false, mocks: true },
    includes: ["Unlimited questions", "Everything in Core", "Cadus Magnus 3.6 as the drafting model", "Prescriber with your letterhead, Word export and interaction checks", "Letters, certificates and discharge summaries on your letterhead", "Priority answers at busy hours"],
    cta: "Everything a clinic needs",
  },
  {
    id: "enterprise", name: "Enterprise", tagline: "For medical colleges and institutions.", audience: "Colleges, hospitals and departments",
    monthly: null, yearly: null,
    limits: { questionsPerDay: Infinity, sources: true, magnus: true, reading: true, prescriber: true, institution: true, mocks: true },
    includes: ["Professional for every seat, from 25 seats", "Institution protocols and formulary in every answer", "Team packs: shared cases, decks and question banks", "College or hospital email sign-in, admin console and usage reports", "Invoice billing and a signed data-processing agreement", "On-campus onboarding and a named support contact"],
    cta: "Quoted per institution",
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;
export const isPlanId = (v: unknown): v is PlanId => typeof v === "string" && v in PLAN_BY_ID;

/** The plan an account is on: the saved plan while it has not expired; a legacy "Pro" counts as Professional; otherwise Starter. */
export function planOf(user: { plan?: string; planExpiry?: string; isPro?: boolean; proExpiry?: string } | null | undefined): PlanId {
  if (!user) return "starter";
  const live = (expiry?: string) => !expiry || new Date(expiry).getTime() > Date.now();
  if (isPlanId(user.plan) && user.plan !== "starter" && live(user.planExpiry)) return user.plan;
  if (user.isPro && live(user.proExpiry)) return "professional";
  return "starter";
}

export const limitsOf = (plan: PlanId): PlanLimits => PLAN_BY_ID[plan].limits;

/** The next plan up that has a feature, for the upgrade prompt. */
export function planFor(feature: keyof Omit<PlanLimits, "questionsPerDay">): Plan {
  return PLANS.find((p) => p.limits[feature]) ?? PLAN_BY_ID.enterprise;
}

export const dollars = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** The price as words for a plan: "Free", "$10 a month" or "Price on request". */
export const priceText = (p: Plan) => (p.monthly === null ? "Price on request" : p.monthly === 0 ? "Free" : `${dollars(p.monthly)} a month`);

/* ------------------------------------------------------------------ plan requests (invoice) */

export interface PlanRequest {
  plan: PlanId;
  cycle: "monthly" | "yearly";
  name: string;
  email: string;
  organisation: string;
  seats: number;
  note: string;
  at: number;
}

export const PLAN_REQUEST_KEY = "cadus3.planRequest";

export function readPlanRequest(): PlanRequest | null {
  try {
    const r = JSON.parse(localStorage.getItem(PLAN_REQUEST_KEY) || "null");
    return r && isPlanId(r.plan) ? r : null;
  } catch { return null; }
}
export function savePlanRequest(r: PlanRequest | null) {
  try { if (r) localStorage.setItem(PLAN_REQUEST_KEY, JSON.stringify(r)); else localStorage.removeItem(PLAN_REQUEST_KEY); } catch { /* blocked */ }
}

/** The request as an email, ready to send to Aethex. */
export function planRequestMail(r: PlanRequest): { to: string; subject: string; body: string } {
  const p = PLAN_BY_ID[r.plan];
  const price = p.monthly === null ? "quote requested" : `${dollars(p.monthly)} a month per user`;
  const body = [
    `Plan request: Cadus ${p.name}`,
    "",
    `Name: ${r.name}`,
    `Email: ${r.email}`,
    r.organisation ? `Organisation: ${r.organisation}` : "",
    `Billing: Monthly (${price})`,
    r.plan === "enterprise" ? `Seats: ${r.seats}` : "",
    r.note ? `\n${r.note}` : "",
    "",
    "Please send an invoice and activate the plan on this account.",
  ].filter((l) => l !== "").join("\n");
  return { to: SUPPORT_EMAIL, subject: `Cadus ${p.name} plan request${r.organisation ? ` · ${r.organisation}` : ""}`, body };
}
