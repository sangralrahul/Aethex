/**
 * Sepsis & DKA Bundles: the sepsis hour-1 bundle against a running clock with each step time-stamped,
 * qSOFA, and the adult DKA protocol (fixed-rate insulin, fluids by the clock, potassium, targets).
 */
import { useEffect, useState } from "react";
import { HeartPulse, Printer, RotateCcw, Timer, TriangleAlert } from "lucide-react";
import { dkaPlan, qsofa, sepsisBundle } from "@/lib/cadus/clinic28";

const hm = (t: number) => new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function SepsisDkaView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"sepsis" | "dka">("sepsis");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(t); }, []);
  /* sepsis */
  const [t0, setT0] = useState<number | null>(null);
  const [kg, setKg] = useState("");
  const [done, setDone] = useState<Record<string, number>>({});
  const [q, setQ] = useState({ rr: "", sbp: "", altered: false });
  const steps = sepsisBundle(Number(kg) || undefined);
  const mins = t0 ? Math.floor((now - t0) / 60000) : 0;
  const qs = q.rr || q.sbp || q.altered ? qsofa(Number(q.rr), Number(q.sbp), q.altered) : null;
  /* dka */
  const [d, setD] = useState({ glucose: "", unit: "mgdl" as "mgdl" | "mmol", ketones: "", urine2: false, ph: "", bicarb: "", k: "", sbp: "", kg: "", frail: false, known: true });
  const [dStart, setDStart] = useState(() => Date.now());
  const n = (s: string) => (s === "" ? undefined : Number(s));
  const plan = dkaPlan({ glucose: Number(d.glucose), unit: d.unit, ketones: n(d.ketones), urineKetones2: d.urine2, ph: n(d.ph), bicarb: n(d.bicarb), k: n(d.k), sbp: n(d.sbp), kg: Number(d.kg), frail: d.frail, knownDiabetes: d.known }, new Date(dStart));
  const field = (k: keyof typeof d, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={String(d[k])} onChange={(e) => setD({ ...d, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-dka={k} /></label>;
  const sepsisMd = () => ["# Sepsis hour-1 bundle", "", t0 ? `Time zero ${hm(t0)}` : "", ...steps.map((s) => `- [${done[s.id] ? "x" : " "}] ${s.label}${done[s.id] ? ` (${hm(done[s.id])}, ${Math.round((done[s.id] - (t0 ?? done[s.id])) / 60000)} min)` : ""}`)].filter(Boolean).join("\n");
  const dkaMd = () => plan ? ["# DKA plan (adult)", "", plan.diagnosis, "", `- ${plan.insulin}`, `- ${plan.potassium}`, `- ${plan.glucoseAdd}`, "", "## Fluids", ...plan.fluids.map((f) => `- ${f.time}: ${f.what}`), "", "## Targets", ...plan.targets.map((t) => `- ${t}`), "", plan.resolution].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-bundles">
      <header className="cx-page-h"><div><h1>Sepsis &amp; DKA Bundles</h1><p>The sepsis hour-1 bundle against a running clock, and the adult DKA protocol: insulin, fluids by the clock, potassium and the targets to check every hour.</p></div></header>
      <div className="cx-seg" role="tablist">{([["sepsis", "Sepsis hour-1"], ["dka", "DKA"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-bd-tab={v}>{l}</button>)}</div>
      {tab === "sepsis" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-sp="kg" /></label>
            {t0 ? <button className="cx-btn" onClick={() => { setT0(null); setDone({}); }}><RotateCcw size={14} /> Reset</button> : <button className="cx-btn primary" onClick={() => setT0(Date.now())} data-sp="start"><Timer size={14} /> Start the clock (time zero)</button>}
          </div>
          {t0 && <div className={`cx-sp-clock ${mins >= 60 ? "late" : ""}`} data-sp="clock"><b>{mins} min</b> since time zero ({hm(t0)}){mins >= 60 ? ": the hour is up" : `: ${60 - mins} min left`}</div>}
          <div className="cx-sp-steps" data-sp="steps">{steps.map((s) => (
            <label key={s.id} className={`cx-pa-mine ${done[s.id] ? "done" : ""}`}><input type="checkbox" checked={!!done[s.id]} onChange={(e) => { const x = { ...done }; if (e.target.checked) x[s.id] = Date.now(); else delete x[s.id]; setDone(x); }} data-sp-step={s.id} /> <span><b>{s.label}</b>{done[s.id] ? <em> done at {hm(done[s.id])}{t0 ? ` (${Math.round((done[s.id] - t0) / 60000)} min)` : ""}</em> : null}<br /><small>{s.detail}</small></span></label>
          ))}</div>
          <h4>qSOFA</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Respiratory rate</span><input className="cx-input" inputMode="numeric" value={q.rr} onChange={(e) => setQ({ ...q, rr: e.target.value.replace(/\D/g, "").slice(0, 2) })} data-sp="rr" /></label>
            <label className="cx-field"><span>Systolic BP</span><input className="cx-input" inputMode="numeric" value={q.sbp} onChange={(e) => setQ({ ...q, sbp: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-sp="sbp" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={q.altered} onChange={(e) => setQ({ ...q, altered: e.target.checked })} /> Altered mentation</label>
          </div>
          {qs && <p className="cx-set-hint" data-sp="qsofa"><b>{qs.text}</b></p>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Sepsis bundle", sepsisMd())}><Printer size={14} /> Print record</button></div>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            {field("glucose", "Glucose", d.unit === "mgdl" ? "450" : "25")}
            <div className="cx-field"><span>Unit</span><div className="cx-seg" role="radiogroup" aria-label="Glucose unit">{([["mgdl", "mg/dL"], ["mmol", "mmol/L"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={d.unit === v} className={d.unit === v ? "on" : ""} onClick={() => setD({ ...d, unit: v })}>{l}</button>)}</div></div>
            {field("ketones", "Blood ketones (mmol/L)", "4.5")}
            {field("ph", "pH", "7.15")}
            {field("bicarb", "Bicarbonate", "10")}
          </div>
          <div className="cx-c23-row">
            {field("k", "Potassium", "4.8")}
            {field("sbp", "Systolic BP", "110")}
            {field("kg", "Weight (kg)", "70")}
            <label className="cx-pa-mine"><input type="checkbox" checked={d.urine2} onChange={(e) => setD({ ...d, urine2: e.target.checked })} /> Urine ketones 2+ or more</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={d.frail} onChange={(e) => setD({ ...d, frail: e.target.checked })} data-dka="frail" /> Elderly, pregnant, heart or kidney failure, or 18–25 years (slower fluids)</label>
          </div>
          {plan ? (
            <div className="cx-cmp-out" data-dka="out">
              <h3 className="cx-lab-h3" data-dka="dx">{plan.isDka ? "DKA" : "Check the diagnosis"}</h3>
              <p>{plan.diagnosis}</p>
              {plan.severe.length > 0 && <div className="cx-anc-flags" data-dka="severe"><p className="high"><TriangleAlert size={13} /> Severe: involve the senior and consider HDU or ICU</p>{plan.severe.map((s) => <p key={s}>{s}</p>)}</div>}
              <p data-dka="insulin"><b>Insulin:</b> {plan.insulin}</p>
              <p data-dka="kout"><b>Potassium:</b> {plan.potassium}</p>
              <div className="cx-c23-scroll"><table className="cx-c23-table" data-dka="fluids"><thead><tr><th>Start</th><th>Fluid</th></tr></thead><tbody>{plan.fluids.map((f, i) => <tr key={i}><td>{f.time}</td><td>{f.what}</td></tr>)}</tbody></table></div>
              <p><b>Glucose:</b> {plan.glucoseAdd}</p>
              <h4>Every hour</h4><ul>{plan.targets.map((t) => <li key={t}>{t}</li>)}</ul>
              <p><b>Resolution:</b> {plan.resolution}</p>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => setDStart(Date.now())}><Timer size={14} /> Times from now</button><button className="cx-btn" onClick={() => onPrint("DKA plan", dkaMd())} data-dka="print"><Printer size={14} /> Print</button></div>
            </div>
          ) : <p className="cx-set-hint">Enter the glucose and weight to start.</p>}
        </>
      )}
      <p className="cx-rs-foot"><HeartPulse size={13} /> Surviving Sepsis Campaign hour-1 bundle; JBDS-IP 2023 and ADA 2024 for adult DKA. <TriangleAlert size={13} /> Children with DKA need the paediatric (BSPED/ISPAD) protocol: slower fluids and 0.05–0.1 units/kg/hour.</p>
    </section>
  );
}
