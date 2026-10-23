/**
 * Duty Roster: a fair on-call roster for a month. Names, the start date, how many on call each day,
 * the days each person is away, and whether to avoid back-to-back nights; duties and weekends are
 * shared out evenly. Made on this device; print it or export it for Excel.
 */
import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Download, Printer, TriangleAlert, Users } from "lucide-react";
import { isWeekend, localDate, makeRoster, rosterCsv, type RosterInput } from "@/lib/cadus/clinic21";

const KEY = "cadus3.roster";
const firstOfNextMonth = () => { const d = new Date(); return localDate(new Date(d.getFullYear(), d.getMonth() + 1, 1)); };
const daysIn = (iso: string) => { const [y, m] = iso.split("-").map(Number); return new Date(y, m, 0).getDate(); };

export default function RosterView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } })();
  const [names, setNames] = useState<string>(saved?.names ?? "");
  const [start, setStart] = useState<string>(saved?.start ?? firstOfNextMonth());
  const [days, setDays] = useState<number>(saved?.days ?? daysIn(firstOfNextMonth()));
  const [perDay, setPerDay] = useState<number>(saved?.perDay ?? 1);
  const [away, setAway] = useState<string>(saved?.away ?? "");
  const [noBack, setNoBack] = useState<boolean>(saved?.noBack ?? true);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ names, start, days, perDay, away, noBack })); } catch { /* full */ } }, [names, start, days, perDay, away, noBack]);
  const people = names.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
  // "Asha: 5, 6, 12" → those days of the roster's month(s).
  const unavailable = useMemo(() => {
    const out: RosterInput["unavailable"] = {};
    const [y, m] = start.split("-").map(Number);
    for (const line of away.split("\n")) {
      const mm = /^\s*([^:]+):\s*(.+)$/.exec(line);
      if (!mm) continue;
      const who = mm[1].trim();
      const ds: string[] = [];
      for (const part of mm[2].split(/[, ]+/)) {
        const r = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(part.trim());
        if (!r) continue;
        for (let d = Number(r[1]); d <= Number(r[2] ?? r[1]); d++) ds.push(localDate(new Date(y, m - 1 + (d < Number(start.slice(8)) ? 1 : 0), d)));
      }
      out[who] = ds;
    }
    return out;
  }, [away, start]);
  const roster = useMemo(() => (people.length && /^\d{4}-\d{2}-\d{2}$/.test(start) ? makeRoster({ people, start, days, perDay, unavailable, noBackToBack: noBack }) : null), [names, start, days, perDay, unavailable, noBack]); // eslint-disable-line react-hooks/exhaustive-deps
  const md = roster ? [`# On-call roster from ${start}`, "", "| Date | Day | On call |", "|---|---|---|", ...roster.dates.map((d, i) => `| ${d.slice(8)}/${d.slice(5, 7)} | ${new Date(`${d}T00:00`).toLocaleDateString("en-IN", { weekday: "short" })} | ${roster.slots[i].join(", ") || "**unfilled**"} |`), "", "## Duties each", "| Name | Total | Weekends |", "|---|---|---|", ...Object.entries(roster.counts).map(([n, c]) => `| ${n} | ${c.total} | ${c.weekend} |`)].join("\n") : "";
  const csv = () => { if (!roster) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rosterCsv(roster)], { type: "text/csv" })); a.download = `roster-${start}.csv`; document.body.appendChild(a); a.click(); a.remove(); };
  return (
    <section className="cx-page cx-lab cx-roster">
      <header className="cx-page-h"><div><h1>Duty Roster</h1><p>A fair on-call roster in seconds: duties and weekends shared evenly, nobody on when they're away, and no back-to-back nights unless you allow it.</p></div></header>
      <div className="cx-roster-in">
        <label className="cx-field"><span><Users size={13} /> Names (one per line)</span><textarea className="cx-input" rows={5} value={names} onChange={(e) => setNames(e.target.value.slice(0, 2000))} placeholder={"Dr Asha\nDr Vikram\nDr Neha\nDr Rahul"} data-roster="names" /></label>
        <label className="cx-field"><span>Away (name: days of the month)</span><textarea className="cx-input" rows={5} value={away} onChange={(e) => setAway(e.target.value.slice(0, 2000))} placeholder={"Dr Asha: 5, 6, 12\nDr Neha: 20-23"} data-roster="away" /></label>
      </div>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Starts</span><input className="cx-input" type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value) setDays(daysIn(e.target.value)); }} data-roster="start" /></label>
        <label className="cx-field"><span>Days</span><input className="cx-input" type="number" min={1} max={62} value={days} onChange={(e) => setDays(Math.max(1, Math.min(62, Number(e.target.value) || 1)))} /></label>
        <div className="cx-field"><span>On call each day</span><div className="cx-seg">{[1, 2, 3].map((n) => <button key={n} className={perDay === n ? "on" : ""} onClick={() => setPerDay(n)} data-roster-per={n}>{n}</button>)}</div></div>
        <label className="cx-pa-mine"><input type="checkbox" checked={noBack} onChange={(e) => setNoBack(e.target.checked)} /> No back-to-back nights</label>
      </div>
      {roster ? (
        <>
          {roster.gaps.length > 0 && <div className="cx-sc-gaps" data-roster="gaps"><TriangleAlert size={13} /> <b>Not enough people on:</b> {roster.gaps.map((d) => d.slice(8)).join(", ")}. Add people, allow back-to-back nights, or change who is away.</div>}
          <div className="cx-roster-counts" data-roster="counts">{Object.entries(roster.counts).map(([n, c]) => <span key={n}><b>{n}</b> {c.total} <small>({c.weekend} weekend)</small></span>)}</div>
          <div className="cx-roster-grid" data-roster="grid">{roster.dates.map((d, i) => <div key={d} className={isWeekend(d) ? "we" : ""}><small>{new Date(`${d}T00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}</small><b>{roster.slots[i].join(", ") || "–"}</b></div>)}</div>
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => onPrint("On-call roster", md)} data-roster="print"><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={csv} data-roster="csv"><Download size={14} /> Excel (CSV)</button>
          </div>
        </>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><CalendarRange size={20} /></span><h3>Add the names</h3><p>The roster updates as you type and is kept on this device.</p></div>}
    </section>
  );
}
