/**
 * Sore Throat & Ear Infection: FeverPAIN with antibiotics that prevent rheumatic fever, and acute
 * otitis media (who needs antibiotics now, amoxicillin dose and duration).
 */
import { useState } from "react";
import { Ear, TriangleAlert } from "lucide-react";
import { aomPlan, FEVERPAIN, feverPain, pharyngitisRx } from "@/lib/cadus/clinic41";

export default function SoreThroatView() {
  const [tab, setTab] = useState<"throat" | "ear">("throat");
  const [fp, setFp] = useState<boolean[]>(FEVERPAIN.map(() => false));
  const [kg, setKg] = useState("");
  const [child, setChild] = useState(true);
  const [allergy, setAllergy] = useState(false);
  const [age, setAge] = useState("");
  const [f, setF] = useState({ bilateral: false, severe: false, otorrhoea: false, recent: false });
  const s = feverPain(fp);
  const a = aomPlan(Number(age) || 0, f.bilateral, f.severe, f.otorrhoea, Number(kg) || 0, f.recent);
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-sth={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-sorethroat">
      <header className="cx-page-h"><div><h1>Sore Throat &amp; Ear Infection</h1><p>Who needs antibiotics for a sore throat (and a full course to prevent rheumatic fever), and for acute otitis media.</p></div></header>
      <div className="cx-seg" role="tablist">{([["throat", "Sore throat"], ["ear", "Ear infection"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-sth-tab={k}>{l}</button>)}</div>
      <div className="cx-c23-row"><label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-sth="kg" /></label>
        {tab === "ear" && <label className="cx-field"><span>Age (months)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} data-sth="age" /></label>}
      </div>
      {tab === "throat" ? (
        <>
          <div className="cx-imaging-ticks">{FEVERPAIN.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={fp[i]} onChange={(e) => setFp(fp.map((y, j) => (j === i ? e.target.checked : y)))} data-sth-fp={i} /> {x}</label>)}</div>
          <div className={`cx-cmp-out ${s.score >= 4 ? "cx-ac-high" : "cx-ac-in"}`} data-sth="score"><p><b>{s.text}</b></p></div>
          <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-sth="child" /> Child</label><label className="cx-pa-mine"><input type="checkbox" checked={allergy} onChange={(e) => setAllergy(e.target.checked)} data-sth="allergy" /> Penicillin allergy</label></div>
          <ul data-sth="rx">{pharyngitisRx(Number(kg) || 0, child, allergy).map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="cx-set-hint">Red flags: drooling, stridor, trismus or a bulging tonsil (quinsy), unable to swallow: urgent ENT.</p>
        </>
      ) : (
        <>
          <div className="cx-imaging-ticks">{cb("bilateral", "Both ears")}{cb("severe", "Severe (39°C or more, moderate–severe pain, or pain 48 hours)")}{cb("otorrhoea", "Ear discharge")}{cb("recent", "Amoxicillin in the past 30 days")}</div>
          <div className={`cx-cmp-out ${a.immediate ? "cx-ac-high" : "cx-ac-in"}`} data-sth="aom" data-immediate={String(a.immediate)}><ul>{a.steps.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </>
      )}
      <p className="cx-rs-foot"><Ear size={13} /> NICE NG84 and NG91, AAP 2013 otitis media, ICMR antimicrobial guidelines. <TriangleAlert size={13} /> Rheumatic fever is common in India: complete 10 days for strep throat.</p>
    </section>
  );
}
