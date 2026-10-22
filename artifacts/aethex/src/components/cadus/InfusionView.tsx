/**
 * Infusions: ICU syringe-pump drugs with standard 50 mL dilutions (or your own): dose to
 * mL/h and mL/h to dose, a rate table across the usual range, and gravity drip rates.
 * Worked out on this device; no AI.
 */
import { useMemo, useState } from "react";
import { Droplets, Syringe, TriangleAlert } from "lucide-react";
import { concentration, doseFor, dropsPerMin, INFUSIONS, rangeSteps, rateFor, round, type DoseUnit, type InfusionPreset } from "@/lib/cadus/bedside";

const UNITS: DoseUnit[] = ["mcg/kg/min", "mcg/min", "mcg/kg/h", "mg/kg/h", "mg/h", "mg/min", "units/kg/h", "units/h", "units/min"];
const n = (s: string) => { const v = Number(s); return s.trim() && Number.isFinite(v) ? v : null; };
const fmt = (x: number | null, dp = 2) => (x === null ? "—" : String(round(x, dp)));

export default function InfusionView() {
  const [tab, setTab] = useState<"pump" | "drip">("pump");
  const [id, setId] = useState("noradrenaline");
  const [custom, setCustom] = useState<InfusionPreset>({ id: "custom", name: "Your own", amount: 0, amountUnit: "mg", volumeMl: 50, doseUnit: "mcg/kg/min", range: [0, 0], note: "" });
  const [weight, setWeight] = useState("70");
  const [dose, setDose] = useState("");
  const [rate, setRate] = useState("");
  const [vol, setVol] = useState("1000");
  const [hours, setHours] = useState("8");
  const [factor, setFactor] = useState(20);
  const p = id === "custom" ? custom : INFUSIONS.find((x) => x.id === id)!;
  const w = n(weight);
  const perKg = p.doseUnit.includes("/kg/");
  const conc = p.amount > 0 && p.volumeMl > 0 ? concentration(p) : null;
  const massUnit = p.doseUnit.split("/")[0];
  const rateOut = n(dose) !== null ? rateFor(p, n(dose)!, w) : null;
  const doseOut = n(rate) !== null ? doseFor(p, n(rate)!, w) : null;
  const outOfRange = (d: number | null) => d !== null && p.range[1] > 0 && (d < p.range[0] * 0.999 || d > p.range[1] * 1.001);
  const table = useMemo(() => (p.range[1] > 0 ? rangeSteps(p.range) : []), [p.range]);
  const drops = dropsPerMin(n(vol) ?? 0, n(hours) ?? 0, factor);

  return (
    <section className="cx-page cx-bs cx-inf">
      <header className="cx-page-h"><div><h1>Infusions</h1><p>ICU drug infusions: dose to mL/h and back, with the usual range, and gravity drip rates. Worked out on this device.</p></div></header>
      <div className="cx-seg cx-rex-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "pump"} className={tab === "pump" ? "on" : ""} onClick={() => setTab("pump")} data-inf-tab="pump"><Syringe size={14} /> Syringe pump</button>
        <button role="tab" aria-selected={tab === "drip"} className={tab === "drip" ? "on" : ""} onClick={() => setTab("drip")} data-inf-tab="drip"><Droplets size={14} /> Drip rate</button>
      </div>
      {tab === "pump" ? (
        <>
          <div className="cx-bs-chips" data-inf="drugs">{INFUSIONS.map((d) => <button key={d.id} className={id === d.id ? "on" : ""} onClick={() => { setId(d.id); setDose(""); setRate(""); }} data-inf-drug={d.id}>{d.name}</button>)}<button className={id === "custom" ? "on" : ""} onClick={() => setId("custom")} data-inf-drug="custom">Your own</button></div>
          {id === "custom" && (
            <div className="cx-mr-pt" data-inf="custom">
              <label className="cx-field"><span>Drug amount</span><input className="cx-input" inputMode="decimal" value={custom.amount || ""} onChange={(e) => setCustom({ ...custom, amount: Number(e.target.value) || 0 })} placeholder="e.g. 4" data-inf="amount" /></label>
              <label className="cx-field"><span>Unit</span><select className="cx-select" value={custom.amountUnit} onChange={(e) => setCustom({ ...custom, amountUnit: e.target.value as "mg" | "units" })}><option value="mg">mg</option><option value="units">units</option></select></label>
              <label className="cx-field"><span>In (mL)</span><input className="cx-input" inputMode="decimal" value={custom.volumeMl || ""} onChange={(e) => setCustom({ ...custom, volumeMl: Number(e.target.value) || 0 })} data-inf="volume" /></label>
              <label className="cx-field"><span>Dose unit</span><select className="cx-select" value={custom.doseUnit} onChange={(e) => setCustom({ ...custom, doseUnit: e.target.value as DoseUnit })} data-inf="unit">{UNITS.filter((u) => (custom.amountUnit === "units" ? u.startsWith("units") : !u.startsWith("units"))).map((u) => <option key={u}>{u}</option>)}</select></label>
            </div>
          )}
          <div className="cx-inf-head">
            <div><small>Dilution</small><b data-inf="dilution">{p.amount ? `${p.amount} ${p.amountUnit} in ${p.volumeMl} mL` : "—"}</b><span>{conc !== null ? `${fmt(conc, 3)} ${massUnit}/mL` : ""}</span></div>
            {p.range[1] > 0 && <div><small>Usual adult range</small><b>{p.range[0]}–{p.range[1]} {p.doseUnit}</b></div>}
            {perKg && <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} data-inf="weight" /></label>}
          </div>
          <div className="cx-inf-calc">
            <label className="cx-field"><span>Dose ({p.doseUnit})</span><input className="cx-input" inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value.replace(/[^\d.]/g, "").slice(0, 8))} placeholder="e.g. 0.1" data-inf="dose" /></label>
            <div className={`cx-inf-out ${outOfRange(n(dose)) ? "warn" : ""}`} data-inf="rate-out"><small>Pump rate</small><b>{fmt(rateOut)} mL/h</b>{outOfRange(n(dose)) && <span>Outside the usual range</span>}</div>
            <label className="cx-field"><span>Or rate (mL/h)</span><input className="cx-input" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 8))} placeholder="e.g. 5" data-inf="rate" /></label>
            <div className={`cx-inf-out ${outOfRange(doseOut) ? "warn" : ""}`} data-inf="dose-out"><small>Gives</small><b>{fmt(doseOut, 3)} {p.doseUnit}</b>{outOfRange(doseOut) && <span>Outside the usual range</span>}</div>
          </div>
          {perKg && !w && <p className="cx-rs-foot"><TriangleAlert size={13} /> Enter the weight for a per-kg dose.</p>}
          {table.length > 0 && (w || !perKg) && (
            <div className="cx-lab-table" data-inf="table"><table><thead><tr><th>Dose ({p.doseUnit})</th>{table.map((d) => <th key={d}>{d}</th>)}</tr></thead><tbody><tr><td><b>mL/h</b></td>{table.map((d) => <td key={d}>{fmt(rateFor(p, d, w), 1)}</td>)}</tr></tbody></table></div>
          )}
          {p.note && <p className="cx-sc-gaps">{p.note}</p>}
        </>
      ) : (
        <div className="cx-inf-calc" data-inf="drip">
          <label className="cx-field"><span>Volume (mL)</span><input className="cx-input" inputMode="decimal" value={vol} onChange={(e) => setVol(e.target.value.replace(/[^\d.]/g, ""))} data-inf="vol" /></label>
          <label className="cx-field"><span>Over (hours)</span><input className="cx-input" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ""))} data-inf="hours" /></label>
          <div className="cx-field"><span>Drip set</span><div className="cx-seg">{[[20, "Macro 20"], [15, "Macro 15"], [60, "Micro 60"]].map(([f, l]) => <button key={f} className={factor === f ? "on" : ""} onClick={() => setFactor(f as number)} data-inf-factor={f}>{l}</button>)}</div></div>
          <div className="cx-inf-out" data-inf="drops"><small>Rate</small><b>{drops === null ? "—" : `${Math.round(drops)} drops/min`}</b><span>{n(vol) && n(hours) ? `${fmt((n(vol) as number) / (n(hours) as number), 0)} mL/h` : ""}</span></div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Usual adult ranges for orientation only. Check every infusion against your unit's protocol and a second person.</p>
    </section>
  );
}
