/**
 * Crew Timeline & Export: everything you did with Crew in one dated timeline (chats, huddles,
 * debates, playbooks, quizzes, drills, case rounds, rooms, notes, check-ins), filtered and exported
 * as Markdown or printed to PDF.
 */
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { dateKey, filterTimeline, TIMELINE_LABELS, timelineMd, type TimelineEvent, type TimelineKind } from "@/lib/cadus/crew";

export default function CrewTimelineView({ events, onPrint, toast }: { events: TimelineEvent[]; onPrint: (title: string, md: string) => void; toast: (t: string) => void }) {
  const [kinds, setKinds] = useState<TimelineKind[]>([]);
  const [days, setDays] = useState<string>("30");
  const list = useMemo(() => filterTimeline(events, kinds, days === "all" ? null : Number(days)), [events, kinds, days]);
  const groups = useMemo(() => { const m = new Map<string, TimelineEvent[]>(); for (const e of list) { const k = dateKey(new Date(e.at)); m.set(k, [...(m.get(k) ?? []), e]); } return [...m.entries()]; }, [list]);
  const present = (Object.keys(TIMELINE_LABELS) as TimelineKind[]).filter((k) => events.some((e) => e.kind === k));
  const download = () => {
    const blob = new Blob([timelineMd(list)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cadus-crew-timeline-${dateKey()}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast("Timeline saved as Markdown");
  };
  return (
    <section className="cx-page cx-lab cx-crewtimeline">
      <header className="cx-page-h"><div><h1>Crew Timeline</h1><p>Everything you did with Crew, by date. Filter it, then save it as Markdown or print it to PDF for a logbook or portfolio.</p></div></header>
      <div className="cx-crew-chips" data-tl="kinds">{present.map((k) => <button key={k} className={`cx-chip ${kinds.includes(k) ? "on" : ""}`} onClick={() => setKinds(kinds.includes(k) ? kinds.filter((x) => x !== k) : [...kinds, k])} data-tl-kind={k}>{TIMELINE_LABELS[k]}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Period</span><select className="cx-select" value={days} onChange={(e) => setDays(e.target.value)} data-tl="days"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select></label>
        <button className="cx-btn" onClick={download} disabled={!list.length} data-tl="md"><Download size={14} /> Markdown</button>
        <button className="cx-btn" onClick={() => onPrint("Crew timeline", timelineMd(list))} disabled={!list.length} data-tl="pdf"><Printer size={14} /> Print or PDF</button>
      </div>
      <p className="cx-set-hint" data-tl="count">{list.length} event{list.length === 1 ? "" : "s"}</p>
      {groups.map(([day, evs]) => (
        <div key={day} className="cx-tl-day" data-tl-day={day}>
          <h4>{new Date(evs[0].at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</h4>
          <ul className="cx-tl-list">{evs.map((e, i) => <li key={i} data-tl-ev={e.kind}><span className={`cx-tl-tag k-${e.kind}`}>{TIMELINE_LABELS[e.kind]}</span><b>{e.title}</b>{e.detail ? <small>{e.detail}</small> : null}</li>)}</ul>
        </div>
      ))}
      {!list.length && <p className="cx-set-hint">Nothing here yet for this period.</p>}
    </section>
  );
}
