/**
 * Thyroid Storm & Myxoedema Coma: the Burch–Wartofsky score with the storm regimen, and the
 * myxoedema coma regimen by weight.
 */
import { useState } from "react";
import { Thermometer, TriangleAlert } from "lucide-react";
import { burchWartofsky, myxoedemaPlan, STORM_PLAN, type BwInput } from "@/lib/cadus/clinic36";

export default function ThyroidStormView() {
  const [tab, setTab] = useState<"storm" | "myx">("storm");
  const [x, setX] = useState<BwInput>({ tempC: 37, cns: 0, gi: 0, hr: 80, hf: 0, af: false, precipitant: false });
  const [temp, setTemp] = useState("");
  const [hr, setHr] = useState("");
  const [kg, setKg] = useState("");
  const [frail, setFrail] = useState(false);
  const b = burchWartofsky({ ...x, tempC: Number(temp) || 37, hr: Number(hr) || 80 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sel = (k: "cns" | "gi" | "hf", l: string, opts: [number, string][]) => <label className="cx-field"><span>{l}</span><select className="cx-select" value={x[k]} onChange={(e) => setX({ ...x, [k]: Number(e.target.value) as any })} data-ts={k}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>;

  return (
    <section className="cx-page cx-lab cx-thyroidstorm">
      <header className="cx-page-h"><div><h1>Thyroid Storm &amp; Myxoedema Coma</h1><p>Score suspected thyroid storm with Burch–Wartofsky and treat it in the right order, or treat myxoedema coma with steroid cover first.</p></div></header>
      <div className="cx-seg" role="tablist">{([["storm", "Thyroid storm"], ["myx", "Myxoedema coma"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ts-tab={k}>{l}</button>)}</div>
      {tab === "storm" ? (
        <>
          <div className="cx-nihss">
            <label className="cx-field"><span>Temperature (°C)</span><input className="cx-input" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="38.9" data-ts="temp" /></label>
            <label className="cx-field"><span>Heart rate</span><input className="cx-input" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="130" data-ts="hr" /></label>
            {sel("cns", "Mental state", [[0, "Normal"], [10, "Mild agitation"], [20, "Delirium, psychosis or lethargy"], [30, "Seizure or coma"]])}
            {sel("gi", "Gut and liver", [[0, "Normal"], [10, "Diarrhoea, vomiting or abdominal pain"], [20, "Unexplained jaundice"]])}
            {sel("hf", "Heart failure", [[0, "None"], [5, "Pedal oedema"], [10, "Bibasal crackles"], [15, "Pulmonary oedema"]])}
            <label className="cx-pa-mine"><input type="checkbox" checked={x.af} onChange={(e) => setX({ ...x, af: e.target.checked })} data-ts="af" /> Atrial fibrillation</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={x.precipitant} onChange={(e) => setX({ ...x, precipitant: e.target.checked })} data-ts="prec" /> Precipitant (infection, surgery, iodine, childbirth)</label>
          </div>
          <div className={`cx-cmp-out ${b.score >= 45 ? "cx-st-out" : b.score >= 25 ? "cx-ac-high" : "cx-ac-in"}`} data-ts="out"><h3 className="cx-lab-h3">Burch–Wartofsky {b.score}: {b.band}</h3>{b.score >= 25 && <ol className="cx-c23-steps">{STORM_PLAN.map((s) => <li key={s}>{s}</li>)}</ol>}</div>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-ts="kg" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={frail} onChange={(e) => setFrail(e.target.checked)} data-ts="frail" /> Older, frail or heart disease</label>
          </div>
          <div className="cx-cmp-out cx-st-out" data-ts="myx"><ol className="cx-c23-steps">{myxoedemaPlan(Number(kg) || 0, frail).map((s) => <li key={s}>{s}</li>)}</ol></div>
          <p className="cx-set-hint">Suspect it in a cold, drowsy, puffy patient with slow pulse, low sodium or high CO2, especially in winter or after sedatives.</p>
        </>
      )}
      <p className="cx-rs-foot"><Thermometer size={13} /> ATA 2016 hyperthyroidism guideline, Burch & Wartofsky 1993, ATA 2014 hypothyroidism guideline. <TriangleAlert size={13} /> Both need ICU care; give the thionamide before iodine.</p>
    </section>
  );
}
