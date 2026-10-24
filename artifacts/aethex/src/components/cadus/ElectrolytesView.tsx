/**
 * Electrolyte Replacement: potassium (low and high), sodium (with the safe correction limits),
 * magnesium and calcium, as ward-ready steps.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { MG_CA_STEPS, potassiumPlan, sodiumPlan } from "@/lib/cadus/clinic26";

export default function ElectrolytesView() {
  const [tab, setTab] = useState<"k" | "na" | "mg" | "ca">("k");
  const [k, setK] = useState("");
  const [ecg, setEcg] = useState(false);
  const [oral, setOral] = useState(true);
  const [na, setNa] = useState("");
  const [sev, setSev] = useState(false);
  const [high, setHigh] = useState(false);
  const [wt, setWt] = useState("");
  const pk = k ? potassiumPlan(Number(k), { ecg, oral }) : null;
  const pn = na ? sodiumPlan(Number(na), { severeSymptoms: sev, highRisk: high, weightKg: Number(wt) || undefined }) : null;
  const out = (p: { severity: string; steps: string[] } | null, key: string) => p && <div className="cx-cmp-out" data-el={key}><h3 className="cx-lab-h3" data-el={`${key}-sev`}>{p.severity}</h3><ol className="cx-c23-steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>;

  return (
    <section className="cx-page cx-lab cx-electro">
      <header className="cx-page-h"><div><h1>Electrolyte Replacement</h1><p>Potassium, sodium, magnesium and calcium: how much to give, how fast, and the safe limits for correction.</p></div></header>
      <div className="cx-seg" role="tablist">{([["k", "Potassium"], ["na", "Sodium"], ["mg", "Magnesium"], ["ca", "Calcium"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-el-tab={v}>{l}</button>)}</div>
      {tab === "k" && <>
        <div className="cx-c23-row">
          <label className="cx-field"><span>Potassium (mmol/L)</span><input className="cx-input" inputMode="decimal" value={k} onChange={(e) => setK(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="2.8" data-el="k" /></label>
          <label className="cx-pa-mine"><input type="checkbox" checked={ecg} onChange={(e) => setEcg(e.target.checked)} data-el="ecg" /> ECG changes or symptoms</label>
          <label className="cx-pa-mine"><input type="checkbox" checked={!oral} onChange={(e) => setOral(!e.target.checked)} /> Can't take oral</label>
        </div>
        {out(pk, "k-out")}
      </>}
      {tab === "na" && <>
        <div className="cx-c23-row">
          <label className="cx-field"><span>Sodium (mmol/L)</span><input className="cx-input" inputMode="decimal" value={na} onChange={(e) => setNa(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="118" data-el="na" /></label>
          <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={wt} onChange={(e) => setWt(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" /></label>
          <label className="cx-pa-mine"><input type="checkbox" checked={sev} onChange={(e) => setSev(e.target.checked)} data-el="sev" /> Severe symptoms (seizure, coma, vomiting, confusion)</label>
          <label className="cx-pa-mine"><input type="checkbox" checked={high} onChange={(e) => setHigh(e.target.checked)} /> High risk of demyelination (alcohol, malnutrition, liver disease, low K)</label>
        </div>
        {out(pn, "na-out")}
      </>}
      {tab === "mg" && <div className="cx-cmp-out" data-el="mg-out"><ol className="cx-c23-steps">{MG_CA_STEPS.magnesium.map((s) => <li key={s}>{s}</li>)}</ol></div>}
      {tab === "ca" && <div className="cx-cmp-out" data-el="ca-out"><ol className="cx-c23-steps">{MG_CA_STEPS.calcium.map((s) => <li key={s}>{s}</li>)}</ol></div>}
      {!pk && !pn && (tab === "k" || tab === "na") && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><FlaskConical size={20} /></span><h3>Enter the level</h3><p>The steps appear here.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Recheck levels after each replacement; follow your hospital's concentration and rate limits. For high potassium, use the Hyperkalaemia emergency protocol.</p>
    </section>
  );
}
