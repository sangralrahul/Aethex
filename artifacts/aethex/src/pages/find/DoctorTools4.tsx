/**
 * Update 88: more Aethex Doctors.
 * - VitalsPage (/vitals): BP, blood sugar, weight, SpO2, pulse and temperature for you or a family member: add a
 *   reading, the latest of each with a general reference range, a chart, the history and a CSV. Kept in the account.
 * - VitalsShare (My appointments): share the last 30, 90 or 180 days of vitals with the doctor for a visit.
 *   VitalsForDoctor (practice dashboard): what the patient shared, as charts and a table.
 * - StaffPanel (practice dashboard): invite front-desk staff by email; they see the queue and bookings only.
 *   useStaffInvite: accepts ?staff=<token> on /practice.
 * Styles: src/site-hub.css (fd-vt*, fd-staff*).
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Download, HeartPulse, Plus, Share2, Trash2, UserPlus, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { findApi, signInHere, useFamily, type Appointment, type FindError } from "@/lib/find";
import { FindNav, SignInCard } from "./FindParts";

export type Reading = { id: string; kind: Kind; v1: number; v2: number | null; context: string | null; note: string | null; at: number };
type Kind = "bp" | "sugar" | "weight" | "spo2" | "pulse" | "temp";
export const KIND: Record<Kind, { label: string; unit: string; color: string }> = {
  bp: { label: "Blood pressure", unit: "mmHg", color: "#dc2626" }, sugar: { label: "Blood sugar", unit: "mg/dL", color: "#7c3aed" },
  weight: { label: "Weight", unit: "kg", color: "#0f766e" }, spo2: { label: "SpO2", unit: "%", color: "#2563eb" },
  pulse: { label: "Pulse", unit: "bpm", color: "#db2777" }, temp: { label: "Temperature", unit: "°F", color: "#ea580c" },
};
const CTX: Record<string, string> = { fasting: "Fasting", "after-meal": "2 h after a meal", random: "Random", bedtime: "Bedtime" };
const fmtV = (r: Reading) => (r.kind === "bp" ? `${r.v1}/${r.v2}` : `${r.v1}`);
const when = (at: number) => new Date(at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** General adult reference ranges (not targets for any one person). */
export function band(r: Reading): { tone: "ok" | "watch" | "high" | "low"; text: string } {
  if (r.kind === "bp") return r.v1 >= 140 || (r.v2 ?? 0) >= 90 ? { tone: "high", text: "High range" } : r.v1 >= 120 || (r.v2 ?? 0) >= 80 ? { tone: "watch", text: "Above normal" } : r.v1 < 90 || (r.v2 ?? 99) < 60 ? { tone: "low", text: "Low range" } : { tone: "ok", text: "Normal range" };
  if (r.kind === "sugar") {
    if (r.v1 < 70) return { tone: "low", text: "Low range" };
    if (r.context === "fasting") return r.v1 >= 126 ? { tone: "high", text: "High (fasting)" } : r.v1 >= 100 ? { tone: "watch", text: "Above normal (fasting)" } : { tone: "ok", text: "Normal (fasting)" };
    return r.v1 >= 200 ? { tone: "high", text: "High range" } : r.v1 >= 140 ? { tone: "watch", text: "Above normal" } : { tone: "ok", text: "Normal range" };
  }
  if (r.kind === "spo2") return r.v1 < 92 ? { tone: "low", text: "Low: seek care if you feel unwell" } : r.v1 < 95 ? { tone: "watch", text: "A little low" } : { tone: "ok", text: "Normal range" };
  if (r.kind === "pulse") return r.v1 > 100 ? { tone: "high", text: "Fast" } : r.v1 < 60 ? { tone: "low", text: "Slow" } : { tone: "ok", text: "Normal range" };
  if (r.kind === "temp") return r.v1 >= 100.4 ? { tone: "high", text: "Fever" } : r.v1 < 95 ? { tone: "low", text: "Low" } : { tone: "ok", text: "Normal range" };
  return { tone: "ok", text: "" };
}

/** A small line chart of one kind (BP: two lines). */
export function Chart({ list, kind }: { list: Reading[]; kind: Kind }) {
  const pts = [...list].filter((r) => r.kind === kind).sort((a, b) => a.at - b.at).slice(-40);
  if (pts.length < 2) return <p className="mu tiny">Add another reading to see a chart.</p>;
  const W = 520, H = 140, P = 22;
  const vals = pts.flatMap((p) => (p.v2 != null ? [p.v1, p.v2] : [p.v1]));
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const t0 = pts[0]!.at, t1 = pts[pts.length - 1]!.at, ts = t1 - t0 || 1;
  const x = (t: number) => P + ((t - t0) / ts) * (W - 2 * P), y = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);
  const line = (k: "v1" | "v2") => pts.filter((p) => p[k] != null).map((p, i) => `${i ? "L" : "M"}${x(p.at).toFixed(1)},${y(p[k] as number).toFixed(1)}`).join(" ");
  return (
    <svg className="fd-vt-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${KIND[kind].label} over time, from ${lo} to ${hi} ${KIND[kind].unit}`}>
      <text x={4} y={y(hi) + 4} className="ax">{hi}</text><text x={4} y={y(lo) + 4} className="ax">{lo}</text>
      <path d={line("v1")} fill="none" stroke={KIND[kind].color} strokeWidth={2} />
      {kind === "bp" && <path d={line("v2")} fill="none" stroke={KIND[kind].color} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 3" />}
      {pts.map((p) => <circle key={p.id} cx={x(p.at)} cy={y(p.v1)} r={2.6} fill={KIND[kind].color} />)}
    </svg>
  );
}

export default function VitalsPage() {
  useSeo({ title: "Vitals: BP, sugar, weight and more | Aethex Doctors", description: "Log blood pressure, blood sugar, weight, SpO2, pulse and temperature, see charts, and share them with your doctor.", path: "/vitals" });
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const fam = useFamily(isLoggedIn);
  const [person, setPerson] = useState("me");
  const { data, error } = useQuery({ enabled: isLoggedIn, queryKey: ["find", "vitals", person], queryFn: () => findApi<{ readings: Reading[] }>(`/vitals?person=${person}`).then((r) => r.readings), retry: false });
  const [kind, setKind] = useState<Kind>("bp");
  const [f, setF] = useState({ v1: "", v2: "", context: "fasting", note: "", at: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState<Kind | "all">("all");
  const latest = useMemo(() => (Object.keys(KIND) as Kind[]).map((k) => ({ k, r: (data ?? []).find((x) => x.kind === k) })).filter((x) => x.r), [data]);
  const set = (list: Reading[]) => qc.setQueryData(["find", "vitals", person], list);
  const add = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await findApi<{ readings: Reading[] }>("/vitals", { person, kind, v1: f.v1, v2: f.v2, context: f.context, note: f.note, at: f.at ? new Date(f.at).getTime() : undefined }); set(r.readings); setF({ ...f, v1: "", v2: "", note: "", at: "" }); }
    catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };
  const del = async (r: Reading) => { if (!window.confirm("Delete this reading?")) return; set((await findApi<{ readings: Reading[] }>(`/vitals/${r.id}/delete`, {})).readings); };
  const csv = () => {
    const rows = [["Date and time", "Measure", "Value", "Unit", "When", "Note"], ...(data ?? []).map((r) => [new Date(r.at).toLocaleString("en-IN"), KIND[r.kind].label, fmtV(r), KIND[r.kind].unit, r.context ? CTX[r.context] ?? r.context : "", r.note ?? ""])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = "vitals.csv"; a.click();
  };
  if (!isLoggedIn) return <div className="fd-page"><FindNav /><div className="ax-wrap fd-narrow"><SignInCard title="Sign in to keep your vitals" text="Log BP, sugar, weight and more, see charts, and share them with your doctor." href={signInHere()} /></div></div>;
  const list = (data ?? []).filter((r) => show === "all" || r.kind === show);
  return (
    <div className="fd-page" data-find="vitals">
      <FindNav />
      <div className="ax-wrap fd-narrow wide">
        <header className="fd-pagehead"><h1><Activity size={26} /> Vitals</h1>{(data?.length ?? 0) > 0 && <button type="button" className="fd-btn sm ghost" onClick={csv}><Download size={15} /> CSV</button>}</header>
        {(fam.data?.members.length ?? 0) > 0 && <div className="fd-tabs" role="tablist" aria-label="Whose vitals">{[["me", "Me"], ...fam.data!.members.map((m) => [m.id, m.name])].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={person === k} className={person === k ? "on" : ""} onClick={() => setPerson(k!)}>{l}</button>)}</div>}
        <form className="fd-box fd-vt-form" onSubmit={add} data-find="vital-form">
          <div className="kinds" role="radiogroup" aria-label="What did you measure?">{(Object.keys(KIND) as Kind[]).map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)} data-kind={k}>{KIND[k].label}</button>)}</div>
          <div className="row">
            <label>{kind === "bp" ? "Systolic (top)" : KIND[kind].label}<input inputMode="decimal" required value={f.v1} onChange={(e) => setF({ ...f, v1: e.target.value })} placeholder={KIND[kind].unit} data-find="v1" /></label>
            {kind === "bp" && <label>Diastolic (bottom)<input inputMode="decimal" required value={f.v2} onChange={(e) => setF({ ...f, v2: e.target.value })} placeholder="mmHg" data-find="v2" /></label>}
            {kind === "sugar" && <label>When<select value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })}>{Object.entries(CTX).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>}
            <label>Taken <em>(optional)</em><input type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} /></label>
            <label className="grow">Note <em>(optional)</em><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={200} placeholder="e.g. after a walk" /></label>
            <button type="submit" className="fd-btn" disabled={busy} data-find="add-vital"><Plus size={15} /> Add</button>
          </div>
          {err && <p className="fd-err" role="alert">{err}</p>}
        </form>
        {error ? <p className="fd-err">{(error as Error).message}</p> : !data ? null : !data.length ? <p className="fd-none">No readings yet. Add your first above.</p> : <>
          <div className="fd-vt-latest" data-find="vital-latest">{latest.map(({ k, r }) => { const b = band(r!); return (
            <button key={k} type="button" className={`fd-vt-card ${b.tone}${show === k ? " on" : ""}`} onClick={() => setShow(show === k ? "all" : k)} data-latest={k}>
              <small>{KIND[k].label}</small><b>{fmtV(r!)} <i>{KIND[k].unit}</i></b><span>{b.text}{r!.context ? ` · ${CTX[r!.context]}` : ""}</span><em>{when(r!.at)}</em>
            </button>); })}</div>
          {show !== "all" && <section className="fd-box"><h2><HeartPulse size={18} /> {KIND[show].label}</h2><Chart list={data} kind={show} /></section>}
          <table className="fd-vt-table" data-find="vital-list"><thead><tr><th>When</th><th>Measure</th><th>Value</th><th>Range</th><th /></tr></thead>
            <tbody>{list.slice(0, 100).map((r) => <tr key={r.id}><td>{when(r.at)}</td><td>{KIND[r.kind].label}{r.context ? <small> · {CTX[r.context]}</small> : null}{r.note ? <small> · {r.note}</small> : null}</td><td><b>{fmtV(r)}</b> {KIND[r.kind].unit}</td><td><span className={`fd-vt-tag ${band(r).tone}`}>{band(r).text}</span></td><td><button type="button" className="fd-icon" onClick={() => void del(r)} aria-label="Delete reading"><Trash2 size={14} /></button></td></tr>)}</tbody></table>
        </>}
        <p className="tiny">The ranges are general adult reference ranges, not a diagnosis; your doctor may set different targets for you. For chest pain, breathlessness or very high or low readings, get medical help.</p>
      </div>
    </div>
  );
}

/** My appointments: share vitals with the doctor for this visit. */
export function VitalsShare({ a }: { a: Appointment }) {
  const on = ["booked", "confirmed"].includes(a.status);
  const { data, refetch } = useQuery({ enabled: on, queryKey: ["find", "vshare", a.id], queryFn: () => findApi<{ shared: boolean; days: number; readings: Reading[] }>(`/appointments/${a.id}/vitals`), retry: false });
  const [busy, setBusy] = useState(false);
  if (!on || !data) return null;
  const set = async (share: boolean, days = data.days) => { setBusy(true); try { await findApi(`/appointments/${a.id}/vitals`, { share, days }); await refetch(); } finally { setBusy(false); } };
  if (!data.readings.length && !data.shared) return <Link href="/vitals" className="fd-link tiny" data-find="vitals-add-link"><Activity size={13} /> Log vitals to share with the doctor</Link>;
  return (
    <label className="fd-vt-share" data-find="vitals-share">
      <input type="checkbox" checked={data.shared} disabled={busy} onChange={(e) => void set(e.target.checked)} />
      <span><Share2 size={13} /> Share my vitals with the doctor</span>
      {data.shared && <select value={data.days} disabled={busy} onChange={(e) => void set(true, Number(e.target.value))} aria-label="How far back"><option value={30}>last 30 days</option><option value={90}>last 90 days</option><option value={180}>last 180 days</option></select>}
    </label>
  );
}

/** The practice dashboard: the vitals a patient shared for this appointment. */
export function VitalsForDoctor({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ enabled: open, queryKey: ["find", "dvitals", id], queryFn: () => findApi<{ shared: boolean; days: number; readings: Reading[] }>(`/appointments/${id}/vitals`), retry: false });
  const kinds = useMemo(() => Array.from(new Set((data?.readings ?? []).map((r) => r.kind))), [data]);
  return (
    <div className="fd-vt-doc" data-find="doctor-vitals">
      <button type="button" className="fd-btn sm ghost" onClick={() => setOpen(!open)} aria-expanded={open}><Activity size={14} /> Vitals shared</button>
      {open && data && <div className="body">
        <p className="tiny">Last {data.days} days, {data.readings.length} readings, logged by the patient at home.</p>
        {kinds.map((k) => { const last = data.readings.find((r) => r.kind === k)!; return <div key={k} className="k"><b>{KIND[k].label}: {fmtV(last)} {KIND[k].unit}</b><small> latest, {when(last.at)}</small><Chart list={data.readings} kind={k} /></div>; })}
      </div>}
    </div>
  );
}

/* ---------------------------------------------------------------- front-desk staff */
type Staff = { email: string; name: string | null; status: "invited" | "active"; invitedAt: number; joinedAt: number | null };
export function StaffPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["find", "staff"], queryFn: () => findApi<{ staff: Staff[] }>("/practice/staff").then((r) => r.staff), retry: false });
  const [email, setEmail] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const set = (s: Staff[]) => qc.setQueryData(["find", "staff"], s);
  return (
    <section className="fd-box fd-staff" data-find="staff">
      <h2><UserPlus size={18} /> Front desk</h2>
      <p className="mu">Let your receptionist run today's queue and bookings: confirm, cancel, mark arrived. They can't see prescriptions, records or reviews.</p>
      {data && data.length > 0 && <ul className="fd-mini-list">{data.map((s) => <li key={s.email} data-staff={s.email}><span>{s.name ?? s.email}<small> · {s.status === "active" ? "has access" : "invitation sent"}</small></span><button type="button" className="fd-icon" onClick={async () => set((await findApi<{ staff: Staff[] }>("/practice/staff/remove", { email: s.email })).staff)} aria-label={`Remove ${s.email}`}><X size={14} /></button></li>)}</ul>}
      <form className="fd-replyform" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setMsg(""); try { const r = await findApi<{ staff: Staff[]; emailed: boolean }>("/practice/staff/invite", { email }); set(r.staff); setMsg(r.emailed ? `We've emailed ${email} a link.` : "Saved; the email didn't go out."); setEmail(""); } catch (x) { setMsg((x as FindError).message); } finally { setBusy(false); } }}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="reception@yourclinic.in" aria-label="Their email" data-find="staff-email" />
        <button type="submit" className="fd-btn sm" disabled={busy} data-find="staff-invite"><Plus size={14} /> Invite</button>
      </form>
      {msg && <p className="tiny" role="status">{msg}</p>}
    </section>
  );
}
/** /practice?staff=<token>: accept a front-desk invitation, then show the practice. */
export function useStaffInvite(onDone: () => void) {
  const { isLoggedIn } = useUserAuth();
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("staff");
    if (!token || !isLoggedIn) return;
    findApi<{ doctor: string }>("/practice/staff/accept", { token }).then((r) => { setMsg(`You now help run ${r.doctor}'s front desk.`); window.history.replaceState(null, "", "/practice"); onDone(); }).catch((x) => setMsg((x as FindError).message));
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps
  return msg;
}
