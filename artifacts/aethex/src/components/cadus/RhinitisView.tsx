/**
 * Allergic Rhinitis & Sinusitis: ARIA severity and stepwise treatment, and when acute sinusitis
 * needs antibiotics.
 */
import { useState } from "react";
import { TriangleAlert, Wind } from "lucide-react";
import { arPlan, sinusitis } from "@/lib/cadus/clinic44";

export default function RhinitisView() {
  const [tab, setTab] = useState<"ar" | "sinus">("ar");
  const [age, setAge] = useState("");
  const [kg, setKg] = useState("");
  const [a, setA] = useState({ persistent: false, troublesome: false, asthma: false });
  const [s, setS] = useState({ days: "", severe: false, double: false, allergy: false, red: false });
  const child = (Number(age) || 0) > 0 && Number(age) < 12;
  const ar = arPlan(a.persistent, a.troublesome, Number(age) || 0, a.asthma);
  const si = sinusitis(Number(s.days) || 0, s.severe, s.double, child, Number(kg) || 0, s.allergy, s.red);
  return (
    <section className="cx-page cx-lab cx-rhinitis">
      <header className="cx-page-h"><div><h1>Allergic Rhinitis &amp; Sinusitis</h1><p>Grade allergic rhinitis and step up treatment; decide when acute sinusitis is bacterial and needs antibiotics.</p></div></header>
      <div className="cx-seg" role="tablist">{([["ar", "Allergic rhinitis"], ["sinus", "Acute sinusitis"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-rh-tab={k}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="30" data-rh="age" /></label>
        {tab === "sinus" && <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-rh="kg" /></label>}
      </div>
      {tab === "ar" ? (
        <>
          <div className="cx-imaging-ticks">
            <label className="cx-pa-mine"><input type="checkbox" checked={a.persistent} onChange={(e) => setA({ ...a, persistent: e.target.checked })} data-rh="persistent" /> Persistent (4 or more days a week for 4 or more weeks)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={a.troublesome} onChange={(e) => setA({ ...a, troublesome: e.target.checked })} data-rh="troublesome" /> Troublesome (sleep, school, work or daily activities affected)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={a.asthma} onChange={(e) => setA({ ...a, asthma: e.target.checked })} data-rh="asthma" /> Also has asthma</label>
          </div>
          <div className="cx-cmp-out cx-ac-in" data-rh="ar"><h3 className="cx-lab-h3">{ar.severity}</h3><ol className="cx-c23-steps">{ar.steps.map((x) => <li key={x}>{x}</li>)}</ol></div>
        </>
      ) : (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Days of symptoms</span><input className="cx-input" inputMode="numeric" value={s.days} onChange={(e) => setS({ ...s, days: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-rh="days" /></label></div>
          <div className="cx-imaging-ticks">{([["severe", "Severe onset (fever 39°C and purulent discharge or facial pain for 3–4 days)"], ["double", "Worsening after initial improvement"], ["allergy", "Penicillin allergy"], ["red", "Eye swelling, vision change, severe headache or neurological signs"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} data-rh={k} /> {l}</label>)}</div>
          <div className={`cx-cmp-out ${s.red ? "cx-st-out" : si.bacterial ? "cx-ac-high" : "cx-ac-in"}`} data-rh="sinus" data-bacterial={String(si.bacterial)}><ol className="cx-c23-steps">{si.steps.map((x) => <li key={x}>{x}</li>)}</ol></div>
        </>
      )}
      <p className="cx-rs-foot"><Wind size={13} /> ARIA 2020, EPOS 2020, IDSA 2012 rhinosinusitis guideline. <TriangleAlert size={13} /> One-sided blocked nose with bleeding: examine for a nasal mass.</p>
    </section>
  );
}
