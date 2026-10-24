/**
 * Tropical Fevers: which tests by the day of fever and exposures, malaria treatment by species,
 * weight, age, pregnancy and region (NVBDCP), and typhoid, scrub typhus and leptospirosis.
 */
import { useState } from "react";
import { Bug, Printer, TriangleAlert } from "lucide-react";
import { feverWorkup, malariaPlan, OTHER_FEVERS, SEVERE_MALARIA, type MalariaIn } from "@/lib/cadus/clinic29";

export default function TropicalFeverView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"workup" | "malaria" | "others">("workup");
  const [day, setDay] = useState("3");
  const [x, setX] = useState({ eschar: false, water: false, rash: false, jaundice: false });
  const [m, setM] = useState<{ species: MalariaIn["species"]; kg: string; age: string; pregnant: NonNullable<MalariaIn["pregnant"]>; severe: boolean; northeast: boolean; g6pd: boolean }>({ species: "vivax", kg: "", age: "", pregnant: "no", severe: false, northeast: false, g6pd: false });
  const w = feverWorkup(Number(day) || 1, x);
  const plan = malariaPlan({ species: m.species, kg: Number(m.kg), ageYears: m.age === "" ? 30 : Number(m.age), pregnant: m.pregnant, severe: m.severe, northeast: m.northeast, g6pdDeficient: m.g6pd });
  const md = () => plan ? [`# Malaria treatment`, "", `**${plan.regimen}** (weight ${m.kg} kg)`, "", ...plan.lines.map((l) => `- ${l}`), "", ...plan.notes.map((n) => `- ${n}`)].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-fevers">
      <header className="cx-page-h"><div><h1>Tropical Fevers</h1><p>Which tests by the day of fever, malaria treatment by species, weight, age and pregnancy (national programme), and typhoid, scrub typhus and leptospirosis.</p></div></header>
      <div className="cx-seg" role="tablist">{([["workup", "Which tests"], ["malaria", "Malaria"], ["others", "Typhoid, scrub, lepto"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-tf-tab={k}>{l}</button>)}</div>
      {tab === "workup" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Day of fever</span><input className="cx-input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))} data-tf="day" /></label>
            {([["eschar", "Eschar"], ["water", "Flood, field or sewage water"], ["rash", "Rash"], ["jaundice", "Jaundice"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-tf={k} /> {l}</label>)}
          </div>
          <div className="cx-cmp-out" data-tf="tests"><h4>Send</h4><ul>{w.tests.map((t) => <li key={t}>{t}</li>)}</ul>{w.think.length > 0 && <><h4>Think of</h4><ul data-tf="think">{w.think.map((t) => <li key={t}>{t}</li>)}</ul></>}</div>
          <p className="cx-set-hint">Red flags at any stage: low BP, breathlessness, bleeding, confusion, falling urine output, jaundice, platelets under 20,000: admit.</p>
        </>
      )}
      {tab === "malaria" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Species</span><select className="cx-select" value={m.species} onChange={(e) => setM({ ...m, species: e.target.value as MalariaIn["species"] })} data-tf="species"><option value="vivax">P. vivax</option><option value="falciparum">P. falciparum</option><option value="mixed">Mixed</option></select></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={m.kg} onChange={(e) => setM({ ...m, kg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="60" data-tf="kg" /></label>
            <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={m.age} onChange={(e) => setM({ ...m, age: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder="30" data-tf="age" /></label>
            <label className="cx-field"><span>Pregnancy</span><select className="cx-select" value={m.pregnant} onChange={(e) => setM({ ...m, pregnant: e.target.value as typeof m.pregnant })} data-tf="preg"><option value="no">Not pregnant</option><option value="t1">First trimester</option><option value="t2-3">Second or third trimester</option></select></label>
          </div>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={m.severe} onChange={(e) => setM({ ...m, severe: e.target.checked })} data-tf="severe" /> Any sign of severe malaria</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={m.northeast} onChange={(e) => setM({ ...m, northeast: e.target.checked })} data-tf="ne" /> North-eastern states</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={m.g6pd} onChange={(e) => setM({ ...m, g6pd: e.target.checked })} /> G6PD deficient</label>
          </div>
          {plan ? <div className="cx-cmp-out" data-tf="plan"><h3 className="cx-lab-h3" data-tf="regimen">{plan.regimen}</h3><ul>{plan.lines.map((l) => <li key={l}>{l}</li>)}</ul><ul className="cx-set-hint">{plan.notes.map((n) => <li key={n}>{n}</li>)}</ul><div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Malaria treatment", md())}><Printer size={14} /> Print</button></div></div> : <p className="cx-set-hint">Enter the weight.</p>}
          <details><summary>Signs of severe malaria</summary><ul>{SEVERE_MALARIA.map((s) => <li key={s}>{s}</li>)}</ul></details>
        </>
      )}
      {tab === "others" && <div className="cx-c23-two" data-tf="others">{OTHER_FEVERS.map((f) => <div key={f.name}><h4>{f.name}</h4><p><b>Clues:</b> {f.clues}</p><p><b>Test:</b> {f.test}</p><ul>{f.treat.map((t) => <li key={t}>{t}</li>)}</ul></div>)}</div>}
      <p className="cx-rs-foot"><Bug size={13} /> NVBDCP malaria treatment guidelines; ICMR treatment guidelines for typhoid, scrub typhus and leptospirosis. <TriangleAlert size={13} /> Confirm malaria with a smear or rapid test before treating, and follow your state's drug policy.</p>
    </section>
  );
}
