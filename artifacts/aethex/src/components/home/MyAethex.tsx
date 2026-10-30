/**
 * Update 78: "My Aethex" on aethex.in for a signed-in person: the next appointment, orders on the way, quotation
 * requests and today's study, each from its platform, with a link there. Nothing shows when signed out, and a part
 * with nothing in it is left out. Styles: src/site-hub.css (.hb-my).
 */
import { useEffect, useState } from "react";
import { CalendarCheck, ClipboardList, Flame, GraduationCap, Package } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { portalUrl } from "@/lib/host";
import { istDay, streakOf } from "@/lib/study/progress";
import { mergeStates, blankStudy, type StudyState } from "@/lib/study/merge";

type Appt = { id: string; date: string; time: string; status: string; mode: string; doctor?: { name: string; specialty: string } };
type Ord = { id: string; status: string; total: number; createdAt: number };
type Quote = { id: string; status: string; institution: string; createdAt: number };
interface Data { appt: Appt | null; orders: Ord[]; quotes: Quote[]; study: StudyState | null }

const get = async <T,>(url: string): Promise<T | null> => { try { const r = await fetch(url, { credentials: "same-origin" }); return r.ok ? ((await r.json()) as T) : null; } catch { return null; } };
const time12 = (t: string) => { const h = Number(t.slice(0, 2)); return `${((h + 11) % 12) + 1}:${t.slice(3)} ${h < 12 ? "AM" : "PM"}`; };
const ORDER_LABEL: Record<string, string> = { pending: "Waiting for payment", placed: "Placed", confirmed: "Confirmed", shipped: "Shipped" };

export function MyAethex() {
  const { isLoggedIn, user } = useUserAuth();
  const [d, setD] = useState<Data | null>(null);
  useEffect(() => {
    if (!isLoggedIn) { setD(null); return; }
    let live = true;
    (async () => {
      const [a, o, q, s] = await Promise.all([
        get<{ appointments: Appt[] }>("/api/find/appointments"), get<{ orders: Ord[] }>("/api/store/orders"),
        get<{ requests: Quote[] }>("/api/store/my-quotes"), get<{ state: StudyState | null }>("/api/study/state"),
      ]);
      const today = istDay();
      const next = (a?.appointments ?? []).filter((x) => x.date >= today && ["booked", "confirmed"].includes(x.status)).sort((x, y) => `${x.date}${x.time}`.localeCompare(`${y.date}${y.time}`))[0] ?? null;
      let local: StudyState | null = null;
      try { const v = JSON.parse(localStorage.getItem("aethex.study.v1") || "null"); if (v?.v === 1) local = { ...blankStudy(), ...v }; } catch { /* none */ }
      const study = s?.state ? (local ? mergeStates({ ...blankStudy(), ...s.state }, local) : { ...blankStudy(), ...s.state }) : local;
      if (live) setD({ appt: next, orders: (o?.orders ?? []).filter((x) => ["pending", "placed", "confirmed", "shipped"].includes(x.status)), quotes: (q?.requests ?? []).filter((x) => x.status === "new" || x.status === "quoted"), study });
    })();
    return () => { live = false; };
  }, [isLoggedIn]);
  if (!isLoggedIn || !d) return null;
  const st = d.study && (Object.keys(d.study.days).length || d.study.attempts.length) ? d.study : null;
  const today = istDay();
  const cards = [
    d.appt && (
      <a key="a" href={portalUrl("doctors", "/appointments")} className="c blue" data-my="appt">
        <CalendarCheck size={20} /><span><small>Next appointment</small><b>{d.appt.doctor?.name ?? "Doctor"}</b><em>{new Date(`${d.appt.date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}, {time12(d.appt.time)} · {d.appt.status === "confirmed" ? "Confirmed" : "Waiting to confirm"}</em></span>
      </a>
    ),
    d.orders.length > 0 && (
      <a key="o" href={portalUrl("store", "/orders")} className="c teal" data-my="orders">
        <Package size={20} /><span><small>Orders on the way</small><b>{d.orders.length} order{d.orders.length === 1 ? "" : "s"}</b><em>Latest: {d.orders[0]!.id} · {ORDER_LABEL[d.orders[0]!.status] ?? d.orders[0]!.status}</em></span>
      </a>
    ),
    d.quotes.length > 0 && (
      <a key="q" href={portalUrl("hospitals", "/account/quotations")} className="c cyan" data-my="quotes">
        <ClipboardList size={20} /><span><small>Quotation requests</small><b>{d.quotes.length} open</b><em>{d.quotes[0]!.institution} · {d.quotes[0]!.status === "quoted" ? "Quotation sent" : "Being prepared"}</em></span>
      </a>
    ),
    st && (
      <a key="s" href={portalUrl("study", "/my-library")} className="c violet" data-my="study">
        <GraduationCap size={20} /><span><small>Today's study</small><b>{st.days[today] ?? 0} of {st.goal} questions</b><em><Flame size={13} /> {streakOf(st, today).current} day streak</em></span>
      </a>
    ),
  ].filter(Boolean);
  return (
    <section className="hb-my" aria-label="My Aethex" data-home="my">
      <div className="hd"><b>Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</b>{!cards.length && <span>Your appointments, orders, quotations and study will show here.</span>}</div>
      {cards.length > 0 && <div className="grid">{cards}</div>}
    </section>
  );
}
