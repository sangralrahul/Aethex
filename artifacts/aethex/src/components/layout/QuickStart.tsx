/**
 * Update 87: the top of every portal home, compact: a greeting, the three things people come for, your own numbers
 * (each a link: the next appointment, orders on the way, today's questions, the bulk list…) and, on phones, every page
 * of the platform as small tiles. Signed out, the numbers make way for a short line and sign-in.
 * Styles: src/site-hub.css (.ax-qs*).
 */
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, type LucideProps } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCartCount } from "@/lib/store/cart";
import { myOrders, myQuotes, storeFetch } from "@/lib/store/api";
import { useBulkLines } from "@/lib/store/bulk";
import { dateLabel, displayName, findApi, time12, type Appointment } from "@/lib/find";
import { istDay, openWrong, streakOf, useStudy } from "@/lib/study/progress";
import { dueCards } from "@/components/study/StudyBits2";
import { WORKSPACE, PORTAL_NAMES, type Site } from "@/lib/workspace";
import { loginUrl } from "@/lib/host";

const QotdCard = lazy(() => import("@/components/study/Qotd").then((m) => ({ default: m.QotdCard })));
import { formatINR } from "@/lib/utils";

type Stat = { label: string; value: ReactNode; sub?: string; href: string };
type Act = { label: string; href: string; primary?: boolean };
const hello = () => { const h = new Date(Date.now() + 330 * 60000).getUTCHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

function L({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return href.includes("#") ? <a href={href} className={className}>{children}</a> : <Link href={href} className={className}>{children}</Link>;
}

function useDoctorStats(on: boolean): Stat[] {
  const { data } = useQuery({ enabled: on, queryKey: ["find", "mine"], queryFn: () => findApi<{ appointments: Appointment[] }>("/appointments"), retry: false, staleTime: 60_000 });
  if (!on || !data) return [];
  const today = istDay();
  const up = data.appointments.filter((a) => a.date >= today && ["booked", "confirmed"].includes(a.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const next = up[0];
  return [
    { label: "Next appointment", value: next ? `${dateLabel(next.date)}, ${time12(next.time)}` : "None booked", sub: next?.doctor ? displayName(next.doctor.name) : "Book in a minute", href: next ? "/appointments" : "/doctors" },
    { label: "Upcoming", value: up.length, sub: up.length === 1 ? "appointment" : "appointments", href: "/appointments" },
    { label: "Prescriptions", value: data.appointments.filter((a) => a.prescription).length, sub: "from Aethex doctors", href: "/records" },
    { label: "Follow-ups due", value: data.appointments.filter((a) => a.followUp && a.followUp >= today).length, sub: "to book", href: "/appointments" },
  ];
}
function useStoreStats(on: boolean): Stat[] {
  const cart = useCartCount();
  const { count: wish } = useWishlist();
  const { data } = useQuery({ enabled: on, queryKey: ["store", "orders", "qs"], queryFn: myOrders, retry: false, staleTime: 60_000 });
  const { data: credit } = useQuery({ enabled: on, queryKey: ["store", "credit"], queryFn: () => storeFetch<{ balance: number }>("/credit"), retry: false, staleTime: 60_000 });
  const active = (data?.orders ?? []).filter((o) => ["pending", "placed", "confirmed", "shipped"].includes(o.status));
  return [
    { label: "Cart", value: cart, sub: cart === 1 ? "item" : "items", href: "/cart" },
    { label: "On the way", value: active.length, sub: active.length ? `latest ${active[0]!.id}` : "no open orders", href: "/orders" },
    { label: "Wishlist", value: wish, sub: "saved", href: "/wishlist" },
    ...(on ? [{ label: "Store credit", value: formatINR(credit?.balance ?? 0), sub: "off your next order", href: "/orders" }] : []),
  ];
}
function useStudyStats(): Stat[] {
  const s = useStudy();
  const today = s.days[istDay()] ?? 0;
  const st = streakOf(s);
  return [
    { label: "Today", value: `${today}/${s.goal}`, sub: "questions", href: "/my-library" },
    { label: "Streak", value: `${st.current} day${st.current === 1 ? "" : "s"}`, sub: `best ${st.best}`, href: "/my-library" },
    { label: "To revise", value: openWrong(s).length, sub: "wrong answers", href: "/my-library?tab=revision" },
    { label: "Flashcards due", value: dueCards(s).due.length, sub: "today", href: "/my-library?tab=flashcards" },
  ];
}
function useInstStats(on: boolean): Stat[] {
  const lines = useBulkLines();
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const { data: q } = useQuery({ enabled: on, queryKey: ["store", "myquotes", "qs"], queryFn: myQuotes, retry: false, staleTime: 60_000 });
  const { data: ap } = useQuery({ enabled: on, queryKey: ["store", "approvals"], queryFn: () => storeFetch<{ approvals: { status: string }[] }>("/approvals").then((r) => r.approvals), retry: false, staleTime: 60_000 });
  const { data: eq } = useQuery({ enabled: on, queryKey: ["store", "equipment"], queryFn: () => storeFetch<{ equipment: { nextService: string | null; nextCalibration: string | null }[] }>("/equipment").then((r) => r.equipment), retry: false, staleTime: 60_000 });
  const soon = new Date(Date.now() + 330 * 60000 + 30 * 86400000).toISOString().slice(0, 10);
  return [
    { label: "Your list", value: lines.length, sub: `${units.toLocaleString("en-IN")} units`, href: "/#list" },
    ...(on ? [
      { label: "Quotations open", value: (q?.requests ?? []).filter((r) => r.status === "new" || r.status === "quoted").length, sub: "requested or sent", href: "/account/quotations" },
      { label: "Approvals waiting", value: (ap ?? []).filter((a) => a.status === "pending").length, sub: "sent for approval", href: "/approvals" },
      { label: "Equipment due", value: (eq ?? []).filter((e) => [e.nextService, e.nextCalibration].some((d) => d && d <= soon)).length, sub: "in 30 days", href: "/equipment" },
    ] : []),
  ];
}

const ACTIONS: Record<Site, Act[]> = {
  doctors: [{ label: "Find a doctor", href: "/doctors", primary: true }, { label: "Which doctor should I see?", href: "/which-doctor" }, { label: "My appointments", href: "/appointments" }],
  store: [{ label: "Browse products", href: "/shop", primary: true }, { label: "Today's offers", href: "/offers" }, { label: "Track an order", href: "/orders/track" }],
  study: [{ label: "Practise questions", href: "/neet-pg", primary: true }, { label: "Take a mock test", href: "/mock-test" }, { label: "My library", href: "/my-library" }],
  hospitals: [{ label: "Build your list", href: "/#list", primary: true }, { label: "Quotations", href: "/account/quotations" }, { label: "Spend", href: "/spend" }],
  medicalcolleges: [{ label: "Build your list", href: "/#list", primary: true }, { label: "Quotations", href: "/account/quotations" }, { label: "Spend", href: "/spend" }],
};
const LEAD: Record<Site, string> = {
  doctors: "Book checked doctors, keep your records, and follow up.",
  store: "Genuine medical supplies, delivered. Cash on delivery available.",
  study: "Questions, tests, flashcards and your revision, in one place.",
  hospitals: "One list, one quotation: furniture, ICU, emergency and lab.",
  medicalcolleges: "Skills lab, anatomy, labs and textbooks for your college.",
};

export function QuickStart({ portal }: { portal: Site }) {
  const { isLoggedIn, user } = useUserAuth();
  const doctors = useDoctorStats(isLoggedIn && portal === "doctors");
  const store = useStoreStats(isLoggedIn && portal === "store");
  const study = useStudyStats();
  const inst = useInstStats(isLoggedIn && (portal === "hospitals" || portal === "medicalcolleges"));
  const stats = portal === "doctors" ? doctors : portal === "store" ? store : portal === "study" ? study : inst;
  const first = (user?.name || "").replace(/^dr\.?\s+/i, "").split(" ")[0];
  const all = WORKSPACE[portal].flatMap((g) => g.items);
  return (
    <section className={`ax-wrap ax-qs ${portal}`} data-qs={portal} aria-label="Quick start">
      <div className="ax-qs-top">
        <div><h2 className="h">{isLoggedIn && first ? `${hello()}, ${first}` : `Aethex ${PORTAL_NAMES[portal]}`}</h2><p>{LEAD[portal]}</p></div>
        <div className="ax-qs-acts">{ACTIONS[portal].map((a) => <L key={a.href} href={a.href} className={`ax-qs-btn${a.primary ? " p" : ""}`}>{a.label}{a.primary && <ArrowRight size={15} />}</L>)}</div>
      </div>
      {stats.length > 0 ? (
        <div className="ax-qs-stats">{stats.map((s) => <L key={s.label} href={s.href} className="ax-qs-stat"><small>{s.label}</small><b data-qs-stat={s.label}>{s.value}</b>{s.sub && <span>{s.sub}</span>}</L>)}</div>
      ) : null}
      {portal === "study" && <Suspense fallback={null}><QotdCard compact /></Suspense>}
      {!isLoggedIn && portal !== "store" && <p className="ax-qs-in"><a href={loginUrl("/")}>Sign in</a> to see your {portal === "doctors" ? "appointments and records" : portal === "study" ? "progress on every device" : "quotations, approvals and equipment"} here.</p>}
      <div className="ax-qs-all" aria-label={`Everything in Aethex ${PORTAL_NAMES[portal]}`}>{all.map((i) => { const I = i.icon as ComponentType<LucideProps>; return <L key={i.href + i.label} href={i.href} className="ax-qs-tile"><I size={18} /><span>{i.label}</span></L>; })}</div>
    </section>
  );
}
