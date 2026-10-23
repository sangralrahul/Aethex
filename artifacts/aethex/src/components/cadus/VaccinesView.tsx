/**
 * Vaccination Scheduler: a record for each child on this device (clinic number or initials, no
 * names) with the national (UIP) or IAP schedule worked out from the date of birth, what is due,
 * overdue or missed, doses ticked off as they are given, a card to print and a WhatsApp reminder.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, CalendarCheck, MessageCircle, Plus, Printer, Search, Syringe, Trash2 } from "lucide-react";
import { isoDate, newChild, nextVisit, readChildren, saveChildren, vaxCardMarkdown, vaxCounts, vaxReminder, vaxRows, type Child, type VaxSchedule } from "@/lib/cadus/clinic23";

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const STATUS = { given: "Given", upcoming: "Upcoming", due: "Due now", overdue: "Overdue", missed: "Missed (age limit)" } as const;

export default function VaccinesView({ toast, onPrint, clinic }: { toast: (t: string) => void; onPrint: (title: string, md: string) => void; clinic: string }) {
  const [kids, setKids] = useState<Child[]>(readChildren);
  const [openId, setOpenId] = useState("");
  const [q, setQ] = useState("");
  const [f, setF] = useState({ code: "", dob: "", sex: "" as Child["sex"], schedule: "uip" as VaxSchedule });
  const today = isoDate(new Date());
  const put = (l: Child[]) => { setKids(l); saveChildren(l); };
  const kid = kids.find((k) => k.id === openId);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...kids].sort((a, b) => b.updatedAt - a.updatedAt).filter((k) => !t || k.code.toLowerCase().includes(t));
  }, [kids, q]);

  const add = () => {
    if (!f.dob || f.dob > today) { toast("Add a date of birth (not in the future)"); return; }
    const c = newChild({ ...f, code: f.code.trim().slice(0, 40) });
    put([c, ...kids]);
    setOpenId(c.id);
    setF({ code: "", dob: "", sex: "", schedule: f.schedule });
  };
  const update = (c: Child) => put(kids.map((k) => (k.id === c.id ? { ...c, updatedAt: Date.now() } : k)));

  if (kid) {
    const rows = vaxRows(kid);
    const n = vaxCounts(rows);
    const nv = nextVisit(kid);
    const msg = vaxReminder(kid, new Date(), clinic);
    const giveAllDue = () => update({ ...kid, given: { ...kid.given, ...Object.fromEntries(rows.filter((r) => r.status === "due" || r.status === "overdue").map((r) => [r.key, today])) } });
    return (
      <section className="cx-page cx-lab cx-vax">
        <header className="cx-page-h"><div><button className="cx-link" onClick={() => setOpenId("")} data-vax="back"><ArrowLeft size={14} /> All children</button><h1>{kid.code || "Child"}</h1><p>Born {fmt(new Date(`${kid.dob}T00:00:00`))}{kid.sex ? ` · ${kid.sex === "F" ? "girl" : "boy"}` : ""} · {kid.schedule === "iap" ? "IAP schedule" : "National schedule (UIP)"}</p></div></header>
        <div className="cx-sim-stats" data-vax="counts">
          <div><b>{(n.due ?? 0) + (n.overdue ?? 0)}</b><small>due or overdue</small></div>
          <div><b>{n.given ?? 0}</b><small>given</small></div>
          <div><b>{nv ? (nv.date.getTime() <= Date.now() ? "Today" : fmt(nv.date)) : "–"}</b><small>next visit</small></div>
        </div>
        {nv && <p className="cx-vax-next" data-vax="next"><CalendarCheck size={14} /> Next: {nv.doses.map((d) => d.name).join(", ")}</p>}
        <div className="cx-sc-acts">
          {((n.due ?? 0) + (n.overdue ?? 0)) > 0 && <button className="cx-btn primary" onClick={giveAllDue} data-vax="give-due"><Syringe size={14} /> Mark all due as given today</button>}
          <button className="cx-btn" onClick={() => onPrint(`Vaccination card ${kid.code}`, vaxCardMarkdown(kid))} data-vax="print"><Printer size={14} /> Print card</button>
          {msg && <a className="cx-btn" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" data-vax="wa"><MessageCircle size={14} /> WhatsApp reminder</a>}
          <select className="cx-select sm" value={kid.schedule} onChange={(e) => update({ ...kid, schedule: e.target.value as VaxSchedule })} aria-label="Schedule"><option value="uip">National (UIP)</option><option value="iap">IAP</option></select>
          <button className="cx-ib" onClick={() => { if (window.confirm(`Delete ${kid.code || "this child"}'s record?`)) { put(kids.filter((k) => k.id !== kid.id)); setOpenId(""); } }} aria-label="Delete this record"><Trash2 size={15} /></button>
        </div>
        <div className="cx-c23-scroll">
          <table className="cx-c23-table cx-vax-table" data-vax="table">
            <thead><tr><th>Age</th><th>Vaccine</th><th>Due</th><th>Status</th><th>Given on</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.key} className={`s-${r.status}`} data-vax-dose={r.name}>
                <td>{r.label}</td><td><b>{r.name}</b>{r.note && <small>{r.note}</small>}</td><td>{fmt(r.due)}</td><td><span className={`cx-vax-st s-${r.status}`}>{STATUS[r.status]}</span></td>
                <td><label className="cx-vax-given"><input type="checkbox" checked={!!r.givenOn} disabled={r.status === "missed" && !r.givenOn} onChange={(e) => { const g = { ...kid.given }; if (e.target.checked) g[r.key] = today; else delete g[r.key]; update({ ...kid, given: g }); }} aria-label={`${r.name} given`} />{r.givenOn && <input type="date" className="cx-input sm" value={r.givenOn} max={today} min={kid.dob} onChange={(e) => e.target.value && update({ ...kid, given: { ...kid.given, [r.key]: e.target.value } })} aria-label={`${r.name} date given`} />}</label></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="cx-rs-foot"><Syringe size={13} /> Schedules follow the national UIP and the IAP (ACVIP) recommendations; check brand-specific details and the latest IAP schedule. A delayed dose is given at the next visit without restarting the series.</p>
      </section>
    );
  }

  return (
    <section className="cx-page cx-lab cx-vax">
      <header className="cx-page-h"><div><h1>Vaccination Scheduler</h1><p>Every child's vaccines worked out from the date of birth, on the national (UIP) or IAP schedule: what is due, overdue or missed, ticked off as given, with a card to print and a WhatsApp reminder. Kept on this device.</p></div></header>
      <form className="cx-opd-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="cx-input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="Initials or clinic no. (no names)" aria-label="Initials or clinic number" data-vax="code" />
        <label className="cx-vax-dob"><span>Date of birth</span><input className="cx-input" type="date" value={f.dob} max={today} onChange={(e) => setF({ ...f, dob: e.target.value })} aria-label="Date of birth" data-vax="dob" /></label>
        <select className="cx-select sm" value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value as Child["sex"] })} aria-label="Sex"><option value="">Sex</option><option value="M">Boy</option><option value="F">Girl</option></select>
        <select className="cx-select sm" value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value as VaxSchedule })} aria-label="Schedule" data-vax="schedule"><option value="uip">National (UIP)</option><option value="iap">IAP</option></select>
        <button className="cx-btn primary" type="submit" data-vax="add"><Plus size={14} /> Add child</button>
      </form>
      {kids.length > 0 && <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a child" aria-label="Find a child" /></label>}
      {list.length ? (
        <ul className="cx-opd-list" data-vax="list">{list.map((k) => {
          const rows = vaxRows(k); const n = vaxCounts(rows); const nv = nextVisit(k); const late = (n.overdue ?? 0) + (n.due ?? 0);
          return (
            <li key={k.id} className={`cx-opd-row ${late ? "prio" : ""}`}>
              <button className="cx-opd-main" onClick={() => setOpenId(k.id)} data-vax-child={k.code}>
                <span className="cx-opd-tok"><Syringe size={16} /></span>
                <span className="cx-opd-who"><b>{k.code || "Child"}</b><small>Born {fmt(new Date(`${k.dob}T00:00:00`))} · {k.schedule.toUpperCase()}</small></span>
                <span className="cx-opd-time">{late ? `${late} due` : nv ? `Next ${fmt(nv.date)}` : "Complete"}</span>
              </button>
            </li>
          );
        })}</ul>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Syringe size={20} /></span><h3>No children yet</h3><p>Add a child's date of birth to see every vaccine with its date.</p></div>
      )}
    </section>
  );
}
