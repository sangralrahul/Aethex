/**
 * Antenatal Care Tracker: a record for each pregnancy on this device (ANC number or initials, no
 * names): dating from the LMP or an early scan, every visit's weight, BP, Hb, urine, fundal height
 * and fetal heart, risk flags, what is due now and next, and a card to print.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Baby, CalendarCheck, Plus, Printer, Search, Trash2, TriangleAlert } from "lucide-react";
import { ancCardMarkdown, ancDue, ancFlags, fmtDate, gaAt, isoDay, newAncVisit, newPregnancy, readPregnancies, savePregnancies, type AncVisit, type Pregnancy } from "@/lib/cadus/clinic24";

const VISIT_FIELDS: { key: keyof AncVisit; label: string; ph: string }[] = [
  { key: "weight", label: "Weight kg", ph: "58" }, { key: "bp", label: "BP", ph: "118/76" }, { key: "hb", label: "Hb g/dL", ph: "11.2" },
  { key: "urineAlb", label: "Urine albumin", ph: "nil" }, { key: "urineSugar", label: "Urine sugar", ph: "nil" }, { key: "fh", label: "Fundal ht cm", ph: "28" }, { key: "fhr", label: "FHR /min", ph: "142" },
];

export default function AntenatalView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [list, setList] = useState<Pregnancy[]>(readPregnancies);
  const [openId, setOpenId] = useState("");
  const [q, setQ] = useState("");
  const [f, setF] = useState({ code: "", age: "", lmp: "" });
  const [v, setV] = useState<AncVisit>(() => newAncVisit());
  const today = isoDay(new Date());
  const put = (l: Pregnancy[]) => { setList(l); savePregnancies(l); };
  const p = list.find((x) => x.id === openId);
  const update = (n: Pregnancy) => put(list.map((x) => (x.id === n.id ? { ...n, updatedAt: Date.now() } : x)));
  const shown = useMemo(() => { const t = q.trim().toLowerCase(); return [...list].sort((a, b) => b.updatedAt - a.updatedAt).filter((x) => !t || x.code.toLowerCase().includes(t)); }, [list, q]);

  if (p) {
    const due = ancDue(p);
    const flags = ancFlags(p);
    const visits = [...p.visits].sort((a, b) => b.date.localeCompare(a.date));
    const field = (k: keyof Pregnancy, label: string, ph: string, type = "text") => (
      <label className="cx-field"><span>{label}</span><input className="cx-input" type={type} value={String(p[k] ?? "")} max={type === "date" ? today : undefined} onChange={(e) => update({ ...p, [k]: e.target.value.slice(0, 120) })} placeholder={ph} data-anc-field={k} /></label>
    );
    return (
      <section className="cx-page cx-lab cx-anc">
        <header className="cx-page-h"><div><button className="cx-link" onClick={() => setOpenId("")} data-anc="back"><ArrowLeft size={14} /> All pregnancies</button><h1>{p.code || "Pregnancy"}</h1><p>{due.edd ? <>EDD <b>{fmtDate(due.edd)}</b> · today {due.ga} weeks</> : "Add the LMP or an early scan to date the pregnancy."}</p></div></header>
        <div className="cx-c23-grid">
          {field("age", "Age", "26")}{field("lmp", "LMP", "", "date")}{field("usgDate", "Early scan date", "", "date")}{field("usgWeeks", "Scan GA (weeks)", "8.5")}
          {field("gravida", "Gravida", "2")}{field("para", "Para", "1")}{field("bloodGroup", "Blood group", "B positive")}{field("risks", "Risk factors", "Previous LSCS, GDM")}
        </div>
        {flags.length > 0 && <div className="cx-anc-flags" data-anc="flags">{flags.map((x, i) => <p key={i} className={x.level}><TriangleAlert size={13} /> {x.text}</p>)}</div>}
        {due.now && (
          <div className="cx-c23-two" data-anc="due">
            <div><h4><CalendarCheck size={13} /> Now ({due.now.weeks} weeks)</h4><ul>{due.now.what.map((w) => <li key={w}>{w}</li>)}</ul></div>
            {due.next && <div><h4>Next ({due.next.weeks} weeks)</h4><ul>{due.next.what.map((w) => <li key={w}>{w}</li>)}</ul></div>}
          </div>
        )}
        <form className="cx-rec-visit" onSubmit={(e) => { e.preventDefault(); if (VISIT_FIELDS.every((x) => !String(v[x.key]).trim()) && !v.notes.trim()) return; update({ ...p, visits: [...p.visits, v] }); setV(newAncVisit()); }}>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Visit date{gaAt(p, v.date) ? ` (${gaAt(p, v.date)} wk)` : ""}</span><input className="cx-input" type="date" value={v.date} max={today} onChange={(e) => setV({ ...v, date: e.target.value || today })} data-anc="vdate" /></label>
            {VISIT_FIELDS.map((x) => <label key={x.key} className="cx-field"><span>{x.label}</span><input className="cx-input" value={String(v[x.key])} onChange={(e) => setV({ ...v, [x.key]: e.target.value.slice(0, 20) })} placeholder={x.ph} data-anc-v={x.key} /></label>)}
          </div>
          <label className="cx-field"><span>Notes</span><input className="cx-input" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value.slice(0, 300) })} placeholder="Complaints, advice, IFA and calcium given, Td" /></label>
          <div className="cx-sc-acts"><button className="cx-btn primary" type="submit" data-anc="save-visit"><Plus size={14} /> Add visit</button><button type="button" className="cx-btn" onClick={() => onPrint(`Antenatal card ${p.code}`, ancCardMarkdown(p))} data-anc="print"><Printer size={14} /> Print card</button><button type="button" className="cx-ib" onClick={() => { if (window.confirm("Delete this pregnancy record?")) { put(list.filter((x) => x.id !== p.id)); setOpenId(""); } }} aria-label="Delete this record"><Trash2 size={15} /></button></div>
        </form>
        {visits.length > 0 && (
          <div className="cx-c23-scroll"><table className="cx-c23-table" data-anc="visits"><thead><tr><th>Date</th><th>Weeks</th><th>Weight</th><th>BP</th><th>Hb</th><th>Urine</th><th>FH</th><th>FHR</th><th /></tr></thead>
            <tbody>{visits.map((x) => <tr key={x.id}><td>{fmtDate(new Date(`${x.date}T00:00:00`))}</td><td>{gaAt(p, x.date)}</td><td>{x.weight}</td><td>{x.bp}</td><td>{x.hb}</td><td>{[x.urineAlb, x.urineSugar].filter(Boolean).join(" / ")}</td><td>{x.fh}</td><td>{x.fhr}</td><td><button className="cx-ib" onClick={() => update({ ...p, visits: p.visits.filter((y) => y.id !== x.id) })} aria-label="Remove this visit"><Trash2 size={13} /></button></td></tr>)}</tbody></table></div>
        )}
        <p className="cx-rs-foot"><Baby size={13} /> The schedule follows the national antenatal guidance (MCP card, PMSMA). Flags are prompts, not a diagnosis.</p>
      </section>
    );
  }

  return (
    <section className="cx-page cx-lab cx-anc">
      <header className="cx-page-h"><div><h1>Antenatal Care Tracker</h1><p>Every pregnancy you follow, on this device: dating and EDD, each visit's weight, BP, Hb, urine and fetal heart, risk flags, what is due this week and next, and a card to print.</p></div></header>
      <form className="cx-opd-add" onSubmit={(e) => { e.preventDefault(); const n = newPregnancy({ code: f.code.trim().slice(0, 40), age: f.age, lmp: f.lmp }); put([n, ...list]); setOpenId(n.id); setF({ code: "", age: "", lmp: "" }); }}>
        <input className="cx-input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="ANC no. or initials (no names)" aria-label="ANC number or initials" data-anc="code" />
        <input className="cx-input sm" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="Age" aria-label="Age" inputMode="numeric" />
        <label className="cx-vax-dob"><span>LMP</span><input className="cx-input" type="date" value={f.lmp} max={today} onChange={(e) => setF({ ...f, lmp: e.target.value })} aria-label="Last menstrual period" data-anc="lmp" /></label>
        <button className="cx-btn primary" type="submit" data-anc="add"><Plus size={14} /> Add pregnancy</button>
      </form>
      {list.length > 0 && <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find" aria-label="Find a pregnancy" /></label>}
      {shown.length ? (
        <ul className="cx-opd-list" data-anc="list">{shown.map((x) => { const d = ancDue(x); const high = ancFlags(x).some((g) => g.level === "high"); return (
          <li key={x.id} className={`cx-opd-row ${high ? "prio" : ""}`}><button className="cx-opd-main" onClick={() => setOpenId(x.id)} data-anc-item={x.code}>
            <span className="cx-opd-tok"><Baby size={16} /></span>
            <span className="cx-opd-who"><b>{x.code || "Pregnancy"}</b><small>{d.edd ? `EDD ${fmtDate(d.edd)} · ${d.ga} weeks` : "Not dated yet"}{high ? " · high risk" : ""}</small></span>
            <span className="cx-opd-time">{x.visits.length} visit{x.visits.length === 1 ? "" : "s"}</span>
          </button></li>
        ); })}</ul>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Baby size={20} /></span><h3>No pregnancies yet</h3><p>Add one with the LMP to start.</p></div>}
    </section>
  );
}
