/**
 * Update 87: the workspace sidebar of each portal: every page of that platform in a few groups, so nothing is more
 * than one click away. Used by components/layout/Workspace.tsx (desktop sidebar, phone bottom bar and drawer) and the
 * "Everything in …" grid of components/layout/QuickStart.tsx. `tab` marks the four shown in the phone's bottom bar.
 */
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Activity, BadgePercent, Beaker, Bed, BookMarked, BookOpen, Boxes, Brain, Building2, CalendarCheck, CalendarDays, ClipboardList, Compass, FileHeart, FileText,
  FlaskConical, GraduationCap, Heart, HeartPulse, Home, Layers, LayoutDashboard, Library, ListChecks, MessageCircleQuestion, Newspaper, Package, PenLine,
  PiggyBank, Pill, Puzzle, RotateCcw, Scale, Search, ShieldCheck, ShoppingBag, ShoppingCart, Siren, Star, Stethoscope, Syringe, Target, Timer, Trophy,
  Truck, UserPlus, Users, Wrench, Calculator, Headset, ClipboardCheck, Store, ClipboardPen, PackageCheck, Sparkles, Grid3x3,
} from "lucide-react";
import type { Portal } from "@/lib/host";

export type Site = Exclude<Portal, "cadus">;
export interface WsItem { href: string; label: string; icon: ComponentType<LucideProps>; tab?: boolean; mine?: boolean }
export interface WsGroup { title: string; items: WsItem[] }

const institution = (seg: "hospital" | "college"): WsGroup[] => [
  { title: "Buy", items: [
    { href: "/", label: "Overview", icon: Home, tab: true },
    { href: "/#list", label: "Your list", icon: ListChecks, tab: true },
    { href: "/#kits", label: "Ready-made kits", icon: Boxes },
    ...(seg === "hospital" ? [
      { href: "/category/hospital-furniture", label: "Beds and furniture", icon: Bed },
      { href: "/category/icu-equipment", label: "ICU", icon: HeartPulse },
      { href: "/category/emergency-care", label: "Emergency", icon: Siren },
      { href: "/category/syringes-needles", label: "Syringes and IV", icon: Syringe },
      { href: "/category/lab-equipment", label: "Laboratory", icon: FlaskConical },
    ] : [
      { href: "/category/skills-simulators", label: "Skills lab", icon: Puzzle },
      { href: "/category/anatomy-models", label: "Anatomy models", icon: Brain },
      { href: "/category/lab-equipment", label: "Laboratory", icon: FlaskConical },
      { href: "/category/stethoscopes", label: "Stethoscopes", icon: Stethoscope },
      { href: "/books", label: "Textbooks", icon: BookOpen },
    ]),
  ] },
  { title: "Work", items: [
    { href: "/account/quotations", label: "Quotations and POs", icon: ClipboardList, tab: true, mine: true },
    { href: "/approvals", label: "Approvals", icon: ClipboardCheck, mine: true },
    { href: "/indents", label: "Department indents", icon: ClipboardPen, mine: true },
    { href: "/stock", label: "Consumables stock", icon: PackageCheck, mine: true },
    { href: "/equipment", label: "Equipment register", icon: Wrench, mine: true },
    { href: "/spend", label: "Spend", icon: PiggyBank, tab: true, mine: true },
    { href: "/team", label: "Team", icon: Users, mine: true },
    { href: `/bulk-estimate?segment=${seg}`, label: "Estimate PDF", icon: FileText, mine: true },
  ] },
  { title: "More", items: [
    ...(seg === "hospital" ? [{ href: "/institutions", label: "Hospitals directory", icon: Building2 }] : []),
    { href: "/#how", label: "How it works", icon: Compass },
    { href: "/contact", label: "Contact us", icon: Headset },
  ] },
];

export const WORKSPACE: Record<Site, WsGroup[]> = {
  doctors: [
    { title: "Find care", items: [
      { href: "/", label: "Home", icon: Home, tab: true },
      { href: "/doctors", label: "Find doctors", icon: Search, tab: true },
      { href: "/which-doctor", label: "Which doctor?", icon: Compass },
      { href: "/clinics", label: "Clinics", icon: Building2 },
      { href: "/ask", label: "Ask a doctor", icon: MessageCircleQuestion },
      { href: "/articles", label: "Health articles", icon: Newspaper },
    ] },
    { title: "Mine", items: [
      { href: "/appointments", label: "My appointments", icon: CalendarCheck, tab: true, mine: true },
      { href: "/records", label: "Health records", icon: FileHeart, tab: true, mine: true },
      { href: "/vitals", label: "Vitals", icon: Activity, mine: true },
      { href: "/saved-doctors", label: "Saved doctors", icon: Heart, mine: true },
      { href: "/family", label: "Family", icon: Users, mine: true },
    ] },
    { title: "For doctors", items: [
      { href: "/practice", label: "Practice dashboard", icon: LayoutDashboard, mine: true },
      { href: "/practice/write", label: "Write an article", icon: PenLine, mine: true },
      { href: "/list-your-practice", label: "List your practice", icon: UserPlus },
    ] },
  ],
  store: [
    { title: "Shop", items: [
      { href: "/", label: "Home", icon: Home, tab: true },
      { href: "/shop", label: "All products", icon: ShoppingBag, tab: true },
      { href: "/offers", label: "Offers", icon: BadgePercent },
      { href: "/books", label: "Books", icon: BookOpen },
      { href: "/brands", label: "Brands", icon: ShieldCheck },
      { href: "/compare", label: "Compare", icon: Scale },
    ] },
    { title: "Mine", items: [
      { href: "/cart", label: "Cart", icon: ShoppingCart, tab: true },
      { href: "/orders", label: "My orders", icon: Package, tab: true, mine: true },
      { href: "/orders/track", label: "Track an order", icon: Truck },
      { href: "/wishlist", label: "Wishlist", icon: Heart },
      { href: "/my-reviews", label: "My reviews", icon: Star, mine: true },
    ] },
    { title: "Help", items: [
      { href: "/shipping-policy", label: "Shipping", icon: Truck },
      { href: "/returns-policy", label: "Returns and replacements", icon: RotateCcw },
      { href: "/contact", label: "Contact us", icon: Headset },
      { href: "/sell", label: "Sell on Aethex", icon: Store },
    ] },
  ],
  study: [
    { title: "Practise", items: [
      { href: "/", label: "Home", icon: Home, tab: true },
      { href: "/neet-pg", label: "NEET-PG questions", icon: Target, tab: true },
      { href: "/mock-test", label: "Mock tests", icon: Timer },
      { href: "/custom-test", label: "Custom test", icon: ListChecks },
      { href: "/sectional-tests", label: "Sectional tests", icon: Timer },
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/question-of-the-day", label: "Question of the day", icon: Sparkles },
      { href: "/case-of-the-day", label: "Case of the day", icon: CalendarDays },
    ] },
    { title: "Learn", items: [
      { href: "/study-hub/medical-knowledge-hub", label: "Knowledge Hub", icon: BookOpen, tab: true },
      { href: "/cases", label: "Clinical cases", icon: Stethoscope },
      { href: "/drug-reference", label: "Drug reference", icon: Pill },
      { href: "/drug-interaction-checker", label: "Drug interactions", icon: Beaker },
      { href: "/calculator", label: "Calculators", icon: Calculator },
      { href: "/tools", label: "Clinical tools", icon: Wrench },
      { href: "/cme-hub", label: "CME Hub", icon: GraduationCap },
    ] },
    { title: "Mine", items: [
      { href: "/my-library", label: "My library", icon: Library, tab: true, mine: true },
      { href: "/my-library?tab=mastery", label: "Topic mastery", icon: Grid3x3, mine: true },
      { href: "/my-library?tab=revision", label: "Revision deck", icon: RotateCcw, mine: true },
      { href: "/study-planner", label: "Exam plan", icon: CalendarDays, mine: true },
      { href: "/study-groups", label: "Study groups", icon: Users, mine: true },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/progress-tracker", label: "My progress", icon: BookMarked, mine: true },
    ] },
  ],
  hospitals: institution("hospital"),
  medicalcolleges: institution("college"),
};

export const PORTAL_NAMES: Record<Site, string> = { doctors: "Doctors", store: "Store", study: "Study", hospitals: "Hospitals", medicalcolleges: "Colleges" };
