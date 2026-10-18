/**
 * Paediatrics and obstetrics: weight-based doses for every formulary drug with
 * a child rule, growth percentiles with plain flags, the national immunisation
 * schedule from a date of birth, and the EDD wheel with the antenatal schedule.
 */
import { useMemo, useState } from "react";
import { Baby, CalendarDays, Ruler, Search, ShieldCheck, Syringe } from "lucide-react";
import { ANTENATAL, ageInMonths, allChildDoses, dating, growth, schedule } from "@/lib/cadus/paeds";

type Tab = "dosing" | "growth" | "vaccines" | "obstetrics";
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PaedsView({ initialTab = "dosing", onAsk }: { initialTab?: Tab; onAsk: (text: string) => void }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [kg, setKg] = useState("");
  const [q, setQ] = useState("");
  const [sex, setSex] = useState<"boy" | "girl">("boy");
  const [dob, setDob] = useState("");
  const [gw, setGw] = useState("");
  const [gh, setGh] = useState("");
  const [lmp, setLmp] = useState("");
  const [cycle, setCycle] = useState("28");
  const [usgDate, setUsgDate] = useState("");
  const [usgW, setUsgW] = useState("");
  const [usgD, setUsgD] = useState("");

  const weight = Number(kg);
  const doses = useMemo(() => (weight > 0 ? allChildDoses(weight).filter((d) => !q.trim() || d.name.toLowerCase().includes(q.trim().toLowerCase())) : []), [weight, q]);
  const months = dob ? ageInMonths(dob) : 0;
  const g = useMemo(() => (dob ? growth(sex, months, Number(gw) || undefined, Number(gh) || undefined) : null), [dob, sex, months, gw, gh]);
  const vax = useMemo(() => (dob ? schedule(dob) : []), [dob]);
  const d = useMemo(() => dating(usgDate && usgW ? { usgDate, usgWeeks: Number(usgW), usgDays: Number(usgD) || 0 } : { lmp, cycleDays: Number(cycle) || 28 }), [lmp, cycle, usgDate, usgW, usgD]);

  return (
    <section className="cx-page cx-pd">
      <header className="cx-page-h">
        <div><h1>Paediatrics and obstetrics</h1><p>Weight-based doses, growth percentiles, the national immunisation schedule and pregnancy dating, computed on this device without AI.</p></div>
        <nav className="cx-tabs" role="tablist">
          {([["dosing", "Doses by weight"], ["growth", "Growth"], ["vaccines", "Immunisation"], ["obstetrics", "Pregnancy dating"]] as [Tab, string][]).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>)}
        </nav>
      </header>

      {tab === "dosing" && (
        <div className="cx-pd-sec">
          <div className="cx-pd-row">
            <label className="cx-field"><span>Child's weight (kg)</span><input className="cx-input" type="number" inputMode="decimal" min={0.5} max={120} step={0.1} value={kg} onChange={(e) => setKg(e.target.value)} placeholder="e.g. 12.5" aria-label="Weight in kg" /></label>
            <label className="cx-search"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a medicine" aria-label="Find a medicine" /></label>
          </div>
          {weight > 0 ? (
            <table className="cx-pd-table">
              <thead><tr><th>Medicine</th><th>Rule</th><th>For {weight} kg</th><th>Frequency</th><th>Maximum</th></tr></thead>
              <tbody>{doses.map((x) => (
                <tr key={x.id}><th scope="row">{x.name}</th><td>{x.rule}</td><td className="cx-pd-dose">{x.doses.map((dd) => <span key={dd.label}>{dd.label}{x.perDay ? "/day" : ""}</span>)}</td><td>{x.frequency}</td><td>{x.max ?? "—"}</td></tr>
              ))}</tbody>
            </table>
          ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Syringe size={20} /></span><h3>Enter the weight</h3><p>Every medicine in the formulary with a mg/kg rule is worked out for that weight, with its maximum.</p></div>}
          <p className="cx-rs-foot"><ShieldCheck size={13} /> Usual paediatric doses from the formulary (NFI, BNF for Children, IAP). A per-day figure is the total to divide across the doses; never exceed the adult maximum.</p>
        </div>
      )}

      {tab === "growth" && (
        <div className="cx-pd-sec">
          <div className="cx-pd-row">
            <div className="cx-seg" role="radiogroup" aria-label="Sex"><button className={sex === "boy" ? "on" : ""} onClick={() => setSex("boy")} role="radio" aria-checked={sex === "boy"}>Boy</button><button className={sex === "girl" ? "on" : ""} onClick={() => setSex("girl")} role="radio" aria-checked={sex === "girl"}>Girl</button></div>
            <label className="cx-field"><span>Date of birth</span><input className="cx-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} aria-label="Date of birth" /></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" type="number" inputMode="decimal" step={0.1} value={gw} onChange={(e) => setGw(e.target.value)} aria-label="Weight" /></label>
            <label className="cx-field"><span>Height or length (cm)</span><input className="cx-input" type="number" inputMode="decimal" step={0.5} value={gh} onChange={(e) => setGh(e.target.value)} aria-label="Height" /></label>
          </div>
          {g && (g.weightZ !== undefined || g.heightZ !== undefined) ? (
            <div className="cx-pd-growth">
              <p className="cx-pd-age"><Ruler size={14} /> Age {Math.floor(months / 12) ? `${Math.floor(months / 12)} y ${Math.floor(months % 12)} m` : `${Math.floor(months)} months`}</p>
              <div className="cx-pd-stats">
                {g.weightZ !== undefined && <div><b>{g.weightPct}<small>th</small></b><span>Weight-for-age</span><small>z {g.weightZ > 0 ? "+" : ""}{g.weightZ}</small></div>}
                {g.heightZ !== undefined && <div><b>{g.heightPct}<small>th</small></b><span>Height-for-age</span><small>z {g.heightZ > 0 ? "+" : ""}{g.heightZ}</small></div>}
                {g.bmi !== undefined && <div><b>{g.bmi}</b><span>BMI · {g.bmiPct}th</span><small>z {g.bmiZ! > 0 ? "+" : ""}{g.bmiZ}</small></div>}
              </div>
              <ul className="cx-pd-flags">{g.flags.map((f) => <li key={f} className={/normal/i.test(f) ? "ok" : "warn"}>{f}</li>)}</ul>
              <button className="cx-btn" onClick={() => onAsk(`${sex === "boy" ? "Boy" : "Girl"}, ${Math.floor(months)} months, weight ${gw || "?"} kg (${g.weightPct ?? "?"}th centile), height ${gh || "?"} cm (${g.heightPct ?? "?"}th centile). Flags: ${g.flags.join("; ")}. What should I assess and advise?`)}>Ask Cadus about this child</button>
            </div>
          ) : <p className="cx-dr-note">Enter the date of birth and a weight or height. Percentiles follow the WHO standards (0–5 years) and the WHO 2007 reference, which the IAP adopts.</p>}
        </div>
      )}

      {tab === "vaccines" && (
        <div className="cx-pd-sec">
          <div className="cx-pd-row"><label className="cx-field"><span>Date of birth</span><input className="cx-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} aria-label="Date of birth" /></label></div>
          {vax.length ? (
            <table className="cx-pd-table cx-pd-vax">
              <thead><tr><th>Vaccine</th><th>Schedule</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>{vax.map((v, i) => <tr key={i} className={v.status}><th scope="row">{v.name}{v.note ? <small> · {v.note}</small> : null}</th><td>{v.label}</td><td>{fmt(v.due)}</td><td><span className={`cx-pd-st ${v.status}`}>{v.status === "due" ? "Due now" : v.status === "overdue" ? "Overdue" : "Upcoming"}</span></td></tr>)}</tbody>
            </table>
          ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Baby size={20} /></span><h3>Enter the date of birth</h3><p>The Universal Immunisation Programme schedule with each due date, and what is due or overdue today.</p></div>}
          <p className="cx-rs-foot"><ShieldCheck size={13} /> National Immunisation Schedule (UIP). Private practice may add IAP-recommended vaccines (hepatitis A, varicella, typhoid conjugate, MMR, HPV, influenza); catch-up follows IAP guidance.</p>
        </div>
      )}

      {tab === "obstetrics" && (
        <div className="cx-pd-sec">
          <div className="cx-pd-row">
            <label className="cx-field"><span>LMP</span><input className="cx-input" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} aria-label="Last menstrual period" /></label>
            <label className="cx-field"><span>Cycle (days)</span><input className="cx-input" type="number" min={21} max={45} value={cycle} onChange={(e) => setCycle(e.target.value)} aria-label="Cycle length" /></label>
            <span className="cx-em-or">or by scan</span>
            <label className="cx-field"><span>Scan date</span><input className="cx-input" type="date" value={usgDate} onChange={(e) => setUsgDate(e.target.value)} aria-label="Ultrasound date" /></label>
            <label className="cx-field"><span>GA on scan (w + d)</span><span className="cx-pd-wd"><input className="cx-input" type="number" min={4} max={42} value={usgW} onChange={(e) => setUsgW(e.target.value)} aria-label="Weeks" placeholder="w" /><input className="cx-input" type="number" min={0} max={6} value={usgD} onChange={(e) => setUsgD(e.target.value)} aria-label="Days" placeholder="d" /></span></label>
          </div>
          {d ? (
            <div className="cx-pd-growth">
              <div className="cx-pd-stats">
                <div><b>{d.gaWeeks}<small>w</small> {d.gaDays}<small>d</small></b><span>Today</span><small>Trimester {d.trimester}</small></div>
                <div><b>{fmt(d.edd)}</b><span>Expected date of delivery</span><small>{d.weeksToGo} weeks to go</small></div>
              </div>
              <h3 className="cx-pd-h3"><CalendarDays size={15} /> Antenatal schedule</h3>
              <ol className="cx-pd-anc">{ANTENATAL.map((a) => { const nums = a.weeks.match(/\d+/g)?.map(Number) ?? [0]; const lo = Math.min(...nums), hi = Math.max(...nums); const past = d.gaWeeks > hi + 1; const now = !past && d.gaWeeks >= lo - 1; return <li key={a.weeks} className={past ? "past" : now ? "now" : ""}><b>{a.weeks} weeks</b><ul>{a.what.map((x) => <li key={x}>{x}</li>)}</ul></li>; })}</ol>
              <button className="cx-btn" onClick={() => onAsk(`Pregnant woman at ${d.gaWeeks} weeks ${d.gaDays} days (EDD ${fmt(d.edd)}). What should this visit cover, and what tests and advice are due now?`)}>Ask Cadus about this visit</button>
            </div>
          ) : <p className="cx-dr-note">Enter the LMP (with the cycle length) or the scan date with the gestational age on that day. The scan takes precedence when both are given.</p>}
          <p className="cx-rs-foot"><ShieldCheck size={13} /> Naegele's rule adjusted for cycle length; schedule per MoHFW antenatal care guidance and PMSMA. Dating by a first-trimester scan is the most accurate.</p>
        </div>
      )}
    </section>
  );
}
