/**
 * Rheumatic Fever: the revised Jones criteria for low and moderate/high-risk populations, acute
 * treatment, and secondary prophylaxis with the date it can stop.
 */
import { useState } from "react";
import { HeartPulse, Printer, TriangleAlert } from "lucide-react";
import { jones, RF_ACUTE, rfProphylaxis, type JonesIn } from "@/lib/cadus/clinic29";

const MAJ: [keyof JonesIn, string][] = [["carditis", "Carditis (clinical or on echo)"], ["arthritisPoly", "Polyarthritis"], ["arthritisMono", "Monoarthritis"], ["polyarthralgia", "Polyarthralgia"], ["chorea", "Sydenham chorea"], ["erythema", "Erythema marginatum"], ["nodules", "Subcutaneous nodules"]];
const MIN: [keyof JonesIn, string][] = [["monoarthralgia", "Monoarthralgia"], ["fever", "Fever"], ["esrCrp", "Raised ESR or CRP"], ["prolongedPr", "Prolonged PR interval"]];

export default function RheumaticView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [j, setJ] = useState<JonesIn>({ highRisk: true, gasEvidence: false, recurrence: false, carditis: false, arthritisPoly: false, arthritisMono: false, polyarthralgia: false, chorea: false, erythema: false, nodules: false, monoarthralgia: false, fever: false, esrCrp: false, prolongedPr: false });
  const [kg, setKg] = useState("");
  const [cat, setCat] = useState<"no-carditis" | "carditis-healed" | "valve-disease">("no-carditis");
  const [ageAt, setAgeAt] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const r = jones(j);
  const p = rfProphylaxis(Number(kg), cat, Number(ageAt) || 0, Number(year) || new Date().getFullYear());
  const tick = (k: keyof JonesIn, l: string) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={!!j[k]} onChange={(e) => setJ({ ...j, [k]: e.target.checked })} data-rf={k} /> {l}</label>;
  const md = () => ["# Rheumatic fever: secondary prophylaxis", "", `- ${p.drug}`, `- Continue until ${p.until}`, ...p.alternatives.map((a) => `- ${a}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-rf">
      <header className="cx-page-h"><div><h1>Rheumatic Fever</h1><p>The revised Jones criteria (India is a moderate-to-high-risk population), acute treatment, and penicillin prophylaxis with the date it can stop.</p></div></header>
      <div className="cx-c23-row">
        {tick("highRisk", "Moderate or high-risk population (India)")}{tick("gasEvidence", "Evidence of recent streptococcal infection")}{tick("recurrence", "Previous rheumatic fever or RHD")}
      </div>
      <div className="cx-c23-two">
        <div><h4>Major</h4><div className="cx-imaging-ticks">{MAJ.map(([k, l]) => tick(k, l))}</div></div>
        <div><h4>Minor</h4><div className="cx-imaging-ticks">{MIN.map(([k, l]) => tick(k, l))}</div><p className="cx-set-hint">{j.highRisk ? "Fever 38 °C or more; ESR 30 or more or CRP 3 mg/dL or more." : "Fever 38.5 °C or more; ESR 60 or more or CRP 3 mg/dL or more."}</p></div>
      </div>
      <div className={`cx-cmp-out ${r.dx ? "cx-st-out" : ""}`} data-rf="out" data-dx={String(r.dx)}><h3 className="cx-lab-h3" data-rf="text">{r.text}</h3><p>Major: {r.majors.join(", ") || "none"}. Minor: {r.minors.join(", ") || "none"}.</p></div>
      <h4>Acute treatment</h4><ul>{RF_ACUTE.map((a) => <li key={a}>{a}</li>)}</ul>
      <h4>Secondary prophylaxis</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-rf="kg" /></label>
        <label className="cx-field"><span>Heart involvement</span><select className="cx-select" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} data-rf="cat"><option value="no-carditis">No carditis</option><option value="carditis-healed">Carditis, no residual valve disease</option><option value="valve-disease">Residual valve disease</option></select></label>
        <label className="cx-field"><span>Age at last attack</span><input className="cx-input" inputMode="numeric" value={ageAt} onChange={(e) => setAgeAt(e.target.value.replace(/\D/g, "").slice(0, 2))} data-rf="age" /></label>
        <label className="cx-field"><span>Year of last attack</span><input className="cx-input" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} data-rf="year" /></label>
      </div>
      <div className="cx-cmp-out" data-rf="proph"><p><b>{p.drug}</b></p><p data-rf="until">Until {p.until}</p><ul>{p.alternatives.map((a) => <li key={a}>{a}</li>)}</ul><div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Rheumatic fever prophylaxis", md())}><Printer size={14} /> Print card</button></div></div>
      <p className="cx-rs-foot"><HeartPulse size={13} /> AHA 2015 revised Jones criteria; WHO and AHA secondary prevention (3-weekly benzathine penicillin in high-burden settings). <TriangleAlert size={13} /> Exclude septic arthritis, reactive arthritis, SLE and leukaemia.</p>
    </section>
  );
}
