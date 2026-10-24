/**
 * Ventilator Helper: starting settings from height, sex and the kind of lung (normal, ARDS,
 * obstructive) with lung-protective tidal volumes, the ARDSnet FiO2/PEEP table, what to change
 * from the ABG, and oxygen devices. All on the device.
 */
import { useState } from "react";
import { Printer, TriangleAlert, Wind } from "lucide-react";
import { OXYGEN_DEVICES, PEEP_TABLE, ventAdjust, ventStart, type VentLung } from "@/lib/cadus/clinic24";
import { cylinderMinutes, psiToBar } from "@/lib/cadus/clinic26";

const LUNGS: [VentLung, string][] = [["normal", "Normal lungs"], ["ards", "ARDS / pneumonia"], ["obstructive", "Asthma / COPD"]];
const n = (v: string) => (v.trim() === "" ? undefined : Number(v));

export default function VentilatorView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"start" | "abg" | "oxygen">("start");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [height, setHeight] = useState("");
  const [lung, setLung] = useState<VentLung>("ards");
  const [abg, setAbg] = useState({ ph: "", paco2: "", pao2: "", fio2: "", peep: "", rr: "", vt: "", plateau: "" });
  const s = ventStart(sex, Number(height), lung);
  const adv = ventAdjust({ ph: n(abg.ph), paco2: n(abg.paco2), pao2: n(abg.pao2), fio2: n(abg.fio2), peep: n(abg.peep), rr: n(abg.rr), vt: n(abg.vt), plateau: n(abg.plateau), pbw: s?.pbw, lung });
  const abgFilled = !!(abg.ph || abg.pao2);
  const [cyl, setCyl] = useState({ water: "46.7", pressure: "", unit: "bar" as "bar" | "psi", flow: "" });
  const cylMin = cylinderMinutes(Number(cyl.water), cyl.unit === "psi" ? psiToBar(Number(cyl.pressure)) : Number(cyl.pressure), Number(cyl.flow), 10);

  return (
    <section className="cx-page cx-lab cx-vent">
      <header className="cx-page-h"><div><h1>Ventilator Helper</h1><p>Lung-protective starting settings from height and the kind of lung, the ARDSnet FiO₂/PEEP table, and what to change from the next ABG.</p></div></header>
      <div className="cx-seg" role="tablist">{([["start", "Starting settings"], ["abg", "Adjust from the ABG"], ["oxygen", "Oxygen devices"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-vent-tab={v}>{l}</button>)}</div>
      {tab !== "oxygen" && (
        <>
          <div className="cx-oncall-calls" role="radiogroup" aria-label="Lungs">{LUNGS.map(([v, l]) => <button key={v} role="radio" aria-checked={lung === v} className={lung === v ? "on" : ""} onClick={() => setLung(v)} data-vent-lung={v}>{l}</button>)}</div>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Sex</span><select className="cx-select" value={sex} onChange={(e) => setSex(e.target.value as "M" | "F")} data-vent="sex"><option value="M">Male</option><option value="F">Female</option></select></label>
            <label className="cx-field"><span>Height (cm)</span><input className="cx-input" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="168" data-vent="height" /></label>
          </div>
        </>
      )}
      {tab === "start" && (s ? (
        <div className="cx-cmp-out" data-vent="start">
          <div className="cx-sim-stats">
            <div><b data-vent="vt">{s.vt} ml</b><small>tidal volume · {s.vtRange}</small></div>
            <div><b>{s.rr}/min</b><small>rate</small></div>
            <div><b>PEEP {s.peep}</b><small>FiO₂ {s.fio2} · I:E {s.ie}</small></div>
          </div>
          <p className="cx-set-hint">Predicted body weight {s.pbw} kg · {s.mode}</p>
          <ul>{s.notes.map((x) => <li key={x}>{x}</li>)}</ul>
          {lung === "ards" && <div className="cx-c23-scroll"><table className="cx-c23-table cx-vent-peep"><thead><tr><th>FiO₂</th>{PEEP_TABLE.map(([f], i) => <td key={i}>{f}</td>)}</tr></thead><tbody><tr><th>PEEP</th>{PEEP_TABLE.map(([, p], i) => <td key={i}>{p}</td>)}</tr></tbody></table></div>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Ventilator settings", `# Ventilator settings\n\n${LUNGS.find((x) => x[0] === lung)![1]} · ${sex === "M" ? "male" : "female"}, ${height} cm, predicted body weight ${s.pbw} kg\n\n| Setting | Start |\n|---|---|\n| Mode | ${s.mode} |\n| Tidal volume | ${s.vt} ml (${s.vtRange}) |\n| Rate | ${s.rr}/min |\n| PEEP | ${s.peep} |\n| FiO₂ | ${s.fio2} |\n| I:E | ${s.ie} |\n\n${s.notes.map((x) => `- ${x}`).join("\n")}`)} data-vent="print"><Printer size={14} /> Print for the bedside</button></div>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Wind size={20} /></span><h3>Enter the height</h3><p>Tidal volume goes by predicted body weight, which comes from height and sex.</p></div>)}
      {tab === "abg" && (
        <>
          <div className="cx-c23-grid">
            {([["ph", "pH", "7.28"], ["paco2", "PaCO₂", "58"], ["pao2", "PaO₂", "62"], ["fio2", "FiO₂ (0.21–1)", "0.6"], ["peep", "PEEP", "8"], ["rr", "Rate", "20"], ["vt", "Tidal volume (ml)", "420"], ["plateau", "Plateau pressure", "28"]] as const).map(([k, l, ph]) => (
              <label key={k} className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={abg[k]} onChange={(e) => setAbg({ ...abg, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-vent-abg={k} /></label>
            ))}
          </div>
          {abgFilled && (
            <div className="cx-cmp-out" data-vent="advice">
              {adv.pf !== undefined && <p><b>P/F ratio {adv.pf}</b>{adv.ardsGrade ? ` · ${adv.ardsGrade} ARDS range (Berlin, on PEEP 5 or more)` : ""}</p>}
              <ol className="cx-c23-steps">{adv.steps.map((x) => <li key={x}>{x}</li>)}</ol>
            </div>
          )}
        </>
      )}
      {tab === "oxygen" && (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-vent="oxygen"><thead><tr><th>Device</th><th>Flow</th><th>Approximate FiO₂</th></tr></thead><tbody>{OXYGEN_DEVICES.map((d) => <tr key={d.device}><td><b>{d.device}</b></td><td>{d.flow}</td><td>{d.fio2}</td></tr>)}</tbody></table></div>
      )}
      {tab === "oxygen" && (
        <div className="cx-rec-visit" data-vent="cylinder">
          <h3 className="cx-lab-h3">How long will the cylinder last?</h3>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Water capacity (litres, on the cylinder)</span><input className="cx-input" inputMode="decimal" value={cyl.water} onChange={(e) => setCyl({ ...cyl, water: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="46.7" data-vent-cyl="water" /></label>
            <label className="cx-field"><span>Gauge pressure</span><input className="cx-input" inputMode="decimal" value={cyl.pressure} onChange={(e) => setCyl({ ...cyl, pressure: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={cyl.unit === "bar" ? "150" : "2000"} data-vent-cyl="pressure" /></label>
            <div className="cx-field"><span>Unit</span><div className="cx-seg" role="radiogroup" aria-label="Pressure unit">{(["bar", "psi"] as const).map((u) => <button key={u} role="radio" aria-checked={cyl.unit === u} className={cyl.unit === u ? "on" : ""} onClick={() => setCyl({ ...cyl, unit: u })}>{u}</button>)}</div></div>
            <label className="cx-field"><span>Flow (L/min)</span><input className="cx-input" inputMode="decimal" value={cyl.flow} onChange={(e) => setCyl({ ...cyl, flow: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder="5" data-vent-cyl="flow" /></label>
          </div>
          {cylMin !== null && <p data-vent="cyl-out"><b>About {Math.floor(cylMin / 60)} h {cylMin % 60} min</b> at {cyl.flow} L/min, keeping 10 bar in reserve. Change the cylinder before it runs out, and check again as the gauge falls.</p>}
          <p className="cx-set-hint">Gas volume ≈ water capacity × pressure (bar). A large (D-type, 46.7 L) cylinder at 150 bar holds about 7,000 L.</p>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Starting points from ARDSnet and critical-care practice; the patient at the bedside, with the intensivist, decides. Recheck the ABG 20–30 minutes after each change.</p>
    </section>
  );
}
