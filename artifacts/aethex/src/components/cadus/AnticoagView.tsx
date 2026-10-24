/**
 * Warfarin & Anticoagulation: dose changes from the INR with a weekly schedule, over-anticoagulation
 * and bleeding, DOAC doses by kidney function, and stopping before a procedure.
 */
import { useState } from "react";
import { Printer, Syringe, TriangleAlert } from "lucide-react";
import { doacCrcl, doacDoses, doacStop, INR_TARGETS, warfarinAdjust } from "@/lib/cadus/clinic29";

export default function AnticoagView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"warfarin" | "doac" | "surgery">("warfarin");
  const [target, setTarget] = useState(INR_TARGETS[0].id);
  const [inr, setInr] = useState("");
  const [weekly, setWeekly] = useState("");
  const [bleed, setBleed] = useState<"none" | "minor" | "major">("none");
  const [p, setP] = useState({ age: "", kg: "", creat: "", female: false, verapamil: false, bleedRisk: false });
  const [drug, setDrug] = useState<"apixaban" | "rivaroxaban" | "edoxaban" | "dabigatran" | "warfarin">("apixaban");
  const [high, setHigh] = useState(false);
  const t = INR_TARGETS.find((x) => x.id === target) ?? INR_TARGETS[0];
  const w = warfarinAdjust(Number(inr), t.low, t.high, Number(weekly), bleed);
  const pin = { age: Number(p.age), kg: Number(p.kg), creat: Number(p.creat), female: p.female, verapamil: p.verapamil, bleedRisk: p.bleedRisk };
  const c = doacCrcl(pin);
  const doses = doacDoses(pin);
  const stop = doacStop(drug, high, c ?? 60);
  const num = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const md = () => w ? ["# Warfarin dose", "", `- INR ${inr} (target ${t.low}–${t.high})`, `- ${w.text}`, w.vitK ? `- ${w.vitK}` : "", `- New weekly dose: **${w.newWeekly} mg**: ${w.schedule}`].filter(Boolean).join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-anticoag">
      <header className="cx-page-h"><div><h1>Warfarin &amp; Anticoagulation</h1><p>Warfarin dose changes from the INR with a weekly schedule, high INR and bleeding, DOAC doses by kidney function, and when to stop before a procedure.</p></div></header>
      <div className="cx-seg" role="tablist">{([["warfarin", "Warfarin and INR"], ["doac", "DOAC dose"], ["surgery", "Before a procedure"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ac-tab={k}>{l}</button>)}</div>
      {tab === "warfarin" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Indication</span><select className="cx-select" value={target} onChange={(e) => setTarget(e.target.value)} data-ac="target">{INR_TARGETS.map((x) => <option key={x.id} value={x.id}>{x.label} ({x.low}–{x.high})</option>)}</select></label>
            <label className="cx-field"><span>INR today</span><input className="cx-input" inputMode="decimal" value={inr} onChange={(e) => setInr(num(e.target.value))} placeholder="2.4" data-ac="inr" /></label>
            <label className="cx-field"><span>Current weekly dose (mg)</span><input className="cx-input" inputMode="decimal" value={weekly} onChange={(e) => setWeekly(num(e.target.value))} placeholder="35" data-ac="weekly" /></label>
            <label className="cx-field"><span>Bleeding</span><select className="cx-select" value={bleed} onChange={(e) => setBleed(e.target.value as typeof bleed)} data-ac="bleed"><option value="none">None</option><option value="minor">Minor</option><option value="major">Major or life-threatening</option></select></label>
          </div>
          {w ? (
            <div className={`cx-cmp-out cx-ac-${w.status}`} data-ac="out" data-status={w.status}>
              <p data-ac="text">{w.text}</p>
              {w.vitK && <p className="cx-bk-err"><TriangleAlert size={13} /> {w.vitK}</p>}
              {bleed !== "major" && <div className="cx-sim-stats"><div><b data-ac="new">{w.newWeekly} mg</b><small>new weekly dose ({w.change > 0 ? "+" : ""}{w.change}%)</small></div><div><b>{w.hold || "No dose held"}</b><small>now</small></div></div>}
              {bleed !== "major" && <p data-ac="schedule"><b>Schedule:</b> {w.schedule}</p>}
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Warfarin dose", md())}><Printer size={14} /> Print</button></div>
            </div>
          ) : <p className="cx-set-hint">Enter the INR and the current weekly dose (add up the 7 daily doses).</p>}
          <p className="cx-set-hint">Acenocoumarol (Acitrom) uses the same INR targets and percentage changes; its doses are about half of warfarin's. Starting warfarin: 5 mg daily (2–3 mg if elderly, low weight, liver disease or interacting drugs), INR on day 3–5.</p>
        </>
      )}
      {tab === "doac" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={p.age} onChange={(e) => setP({ ...p, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-ac="age" /></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={p.kg} onChange={(e) => setP({ ...p, kg: num(e.target.value) })} data-ac="kg" /></label>
            <label className="cx-field"><span>Creatinine (mg/dL)</span><input className="cx-input" inputMode="decimal" value={p.creat} onChange={(e) => setP({ ...p, creat: num(e.target.value) })} data-ac="creat" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={p.female} onChange={(e) => setP({ ...p, female: e.target.checked })} data-ac="female" /> Female</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={p.verapamil} onChange={(e) => setP({ ...p, verapamil: e.target.checked })} /> On verapamil</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={p.bleedRisk} onChange={(e) => setP({ ...p, bleedRisk: e.target.checked })} /> High bleeding risk</label>
          </div>
          {c !== null ? <div className="cx-cmp-out" data-ac="doac"><h3 className="cx-lab-h3">CrCl {c} ml/min (Cockcroft–Gault)</h3><table className="cx-c23-table"><tbody>{doses.map((d) => <tr key={d.drug} data-ac-drug={d.drug} className={d.ok ? "" : "no"}><th>{d.drug}</th><td>{d.dose}</td></tr>)}</tbody></table><p className="cx-set-hint">For AF. VTE treatment: apixaban 10 mg twice daily for 7 days then 5 mg twice daily; rivaroxaban 15 mg twice daily for 21 days then 20 mg once daily. DOACs are not for mechanical valves or moderate–severe mitral stenosis.</p></div> : <p className="cx-set-hint">Enter age, weight and creatinine.</p>}
        </>
      )}
      {tab === "surgery" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Anticoagulant</span><select className="cx-select" value={drug} onChange={(e) => setDrug(e.target.value as typeof drug)} data-ac="drug">{["apixaban", "rivaroxaban", "edoxaban", "dabigatran", "warfarin"].map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={high} onChange={(e) => setHigh(e.target.checked)} data-ac="high" /> High bleeding risk procedure (major surgery, neuraxial anaesthesia)</label>
          </div>
          <div className="cx-cmp-out" data-ac="stop"><p><b>Stop:</b> {stop.stop}</p><p><b>Restart:</b> {stop.restart}</p>{drug === "dabigatran" && <p className="cx-set-hint">Uses CrCl {c ?? "(enter it on the DOAC tab; 60 assumed)"} ml/min.</p>}</div>
        </>
      )}
      <p className="cx-rs-foot"><Syringe size={13} /> ACCP/ACC warfarin management, product labels and EHRA 2021 for DOACs, PAUSE for interruption. <TriangleAlert size={13} /> Check for interacting drugs (antibiotics, amiodarone, antifungals) whenever the INR changes.</p>
    </section>
  );
}
