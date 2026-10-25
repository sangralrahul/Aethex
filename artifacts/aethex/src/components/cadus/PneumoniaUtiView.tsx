/**
 * Pneumonia & UTI Antibiotics: CURB-65 with antibiotics by setting and risk, and UTI choices by
 * syndrome, kidney function, pregnancy and age.
 */
import { useState } from "react";
import { Pill, Printer, TriangleAlert } from "lucide-react";
import { capAntibiotics, curb65, UTI_TYPES, utiAntibiotics, type UtiType } from "@/lib/cadus/clinic31";

export default function PneumoniaUtiView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"cap" | "uti">("cap");
  const [c, setC] = useState({ confusion: false, urea: "", unit: "mgdl" as "mgdl" | "mmol" | "bun", rr: "", sbp: "", dbp: "", age: "" });
  const [r, setR] = useState({ comorbid: false, pseudomonas: false, mrsa: false, penAllergy: false });
  const [ut, setUt] = useState<UtiType>("cystitis-f");
  const [egfr, setEgfr] = useState("");
  const [kg, setKg] = useState("");
  const [esbl, setEsbl] = useState(false);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const cs = curb65({ confusion: c.confusion, urea: c.urea === "" ? undefined : Number(c.urea), ureaUnit: c.unit, rr: Number(c.rr) || 0, sbp: Number(c.sbp) || 0, dbp: Number(c.dbp) || 0, age: Number(c.age) || 0 });
  const cap = capAntibiotics({ setting: cs.setting, ...r });
  const uti = utiAntibiotics(ut, egfr === "" ? null : Number(egfr), Number(kg) || undefined, esbl);
  const md = () => tab === "cap" ? ["# Community-acquired pneumonia", "", `**${cs.text}**`, "", ...cap.map((x) => `- ${x}`)].join("\n") : [`# ${UTI_TYPES.find(([v]) => v === ut)![1]}`, "", ...uti.map((x) => `- ${x}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-pnuti">
      <header className="cx-page-h"><div><h1>Pneumonia &amp; UTI Antibiotics</h1><p>Pneumonia severity (CURB-65) with antibiotics by setting and risk, and urinary infection treatment by type, kidney function, pregnancy and age.</p></div></header>
      <div className="cx-seg" role="tablist">{([["cap", "Pneumonia"], ["uti", "Urinary infection"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-pu-tab={k}>{l}</button>)}</div>
      {tab === "cap" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={c.confusion} onChange={(e) => setC({ ...c, confusion: e.target.checked })} data-pu="confusion" /> New confusion</label>
            <label className="cx-field"><span>Urea (optional)</span><input className="cx-input" inputMode="decimal" value={c.urea} onChange={(e) => setC({ ...c, urea: n(e.target.value) })} data-pu="urea" /></label>
            <label className="cx-field"><span>Unit</span><select className="cx-select" value={c.unit} onChange={(e) => setC({ ...c, unit: e.target.value as typeof c.unit })} data-pu="unit"><option value="mgdl">Urea mg/dL</option><option value="bun">BUN mg/dL</option><option value="mmol">Urea mmol/L</option></select></label>
            <label className="cx-field"><span>Resp. rate</span><input className="cx-input" inputMode="numeric" value={c.rr} onChange={(e) => setC({ ...c, rr: n(e.target.value) })} data-pu="rr" /></label>
            <label className="cx-field"><span>Systolic</span><input className="cx-input" inputMode="numeric" value={c.sbp} onChange={(e) => setC({ ...c, sbp: n(e.target.value) })} data-pu="sbp" /></label>
            <label className="cx-field"><span>Diastolic</span><input className="cx-input" inputMode="numeric" value={c.dbp} onChange={(e) => setC({ ...c, dbp: n(e.target.value) })} /></label>
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={c.age} onChange={(e) => setC({ ...c, age: n(e.target.value) })} data-pu="age" /></label>
          </div>
          <div className="cx-c23-row">{([["comorbid", "Comorbidity (COPD, diabetes, heart, liver, kidney)"], ["pseudomonas", "Pseudomonas risk"], ["mrsa", "MRSA risk"], ["penAllergy", "Penicillin allergy"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.checked })} data-pu={k} /> {l}</label>)}</div>
          <div className={`cx-cmp-out ${cs.setting === "icu" ? "cx-st-out" : cs.setting === "ward" ? "cx-ac-high" : "cx-ac-in"}`} data-pu="cap"><h3 className="cx-lab-h3" data-pu="score">{cs.text}</h3><ul>{cap.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Situation</span><select className="cx-select" value={ut} onChange={(e) => setUt(e.target.value as UtiType)} data-pu="uti-type">{UTI_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="cx-field"><span>eGFR (optional)</span><input className="cx-input" inputMode="numeric" value={egfr} onChange={(e) => setEgfr(n(e.target.value))} data-pu="egfr" /></label>
            {ut === "child" && <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(n(e.target.value))} data-pu="kg" /></label>}
            {ut === "pyelo-in" && <label className="cx-pa-mine"><input type="checkbox" checked={esbl} onChange={(e) => setEsbl(e.target.checked)} data-pu="esbl" /> ESBL risk</label>}
          </div>
          <div className="cx-cmp-out" data-pu="uti"><ul>{uti.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </>
      )}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint(tab === "cap" ? "Pneumonia antibiotics" : "UTI antibiotics", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><Pill size={13} /> CURB-65 (BTS); ICMR treatment guidelines for antimicrobial use, IDSA/ATS 2019 and NICE. <TriangleAlert size={13} /> Follow your hospital antibiogram; review at 48–72 hours with cultures.</p>
    </section>
  );
}
