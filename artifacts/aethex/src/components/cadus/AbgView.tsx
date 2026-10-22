/**
 * ABG Interpreter: pH, pCO₂ and HCO₃ (with Na, Cl, albumin, lactate, PaO₂ and FiO₂ if known)
 * worked through step by step on this device: the primary process, compensation (Winter's
 * and the acute/chronic rules), anion gap with albumin correction, delta ratio, oxygenation
 * and the likely causes. Discuss sends the result to chat.
 */
import { useState } from "react";
import { MessageSquare, TriangleAlert, Wind } from "lucide-react";
import { interpretAbg } from "@/lib/cadus/bedside";

const FIELDS: [key: string, label: string, ph: string][] = [
  ["ph", "pH", "7.40"], ["pco2", "pCO₂ (mmHg)", "40"], ["hco3", "HCO₃ (mmol/L)", "24"], ["na", "Na", "140"], ["cl", "Cl", "104"],
  ["albumin", "Albumin (g/dL)", "4.0"], ["lactate", "Lactate", "1.0"], ["pao2", "PaO₂ (mmHg)", "90"], ["fio2", "FiO₂ (0.21–1)", "0.21"],
];
const EXAMPLES: { label: string; v: Record<string, string> }[] = [
  { label: "DKA", v: { ph: "7.1", pco2: "18", hco3: "6", na: "135", cl: "100" } },
  { label: "COPD", v: { ph: "7.34", pco2: "60", hco3: "31" } },
  { label: "Vomiting", v: { ph: "7.5", pco2: "48", hco3: "36", na: "136", cl: "88" } },
  { label: "Sepsis", v: { ph: "7.28", pco2: "30", hco3: "14", na: "138", cl: "104", lactate: "5.2", pao2: "70", fio2: "0.4" } },
];

export default function AbgView({ onAsk }: { onAsk: (q: string) => void }) {
  const [v, setV] = useState<Record<string, string>>({});
  const num = (k: string) => { const x = Number(v[k]); return v[k]?.trim() && Number.isFinite(x) ? x : null; };
  const ready = num("ph") !== null && num("pco2") !== null && num("hco3") !== null;
  const r = ready ? interpretAbg({ ph: num("ph")!, pco2: num("pco2")!, hco3: num("hco3")!, na: num("na"), cl: num("cl"), albumin: num("albumin"), lactate: num("lactate"), pao2: num("pao2"), fio2: num("fio2") }) : null;

  return (
    <section className="cx-page cx-bs cx-abg">
      <header className="cx-page-h"><div><h1>ABG Interpreter</h1><p>Enter the gas and Cadus works through it step by step: primary disorder, compensation, anion gap, delta ratio and oxygenation. Worked out on this device.</p></div></header>
      <div className="cx-abg-in" data-abg="inputs">
        {FIELDS.map(([k, label, ph]) => <label key={k} className={`cx-field ${["ph", "pco2", "hco3"].includes(k) ? "req" : ""}`}><span>{label}</span><input className="cx-input" inputMode="decimal" value={v[k] ?? ""} onChange={(e) => setV((o) => ({ ...o, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) }))} placeholder={ph} data-abg={k} /></label>)}
      </div>
      <div className="cx-bs-chips">{EXAMPLES.map((e) => <button key={e.label} onClick={() => setV(e.v)} data-abg-ex={e.label}>Example: {e.label}</button>)}<button onClick={() => setV({})}>Clear</button></div>
      {typeof r === "string" ? <p className="cx-sc-gaps" data-abg="error">{r}</p> : r ? (
        <div className="cx-cmp-out" data-abg="out">
          <div className={`cx-rxc-verdict ${r.primary.startsWith("Normal") ? "v-ok" : "v-review"}`}><Wind size={22} /><div><b data-abg="primary">{r.primary}</b><p>{r.summary}</p></div></div>
          <ol className="cx-abg-steps">{r.steps.map((s) => <li key={s.title} className={`t-${s.tone}`} data-abg-step={s.title}><b>{s.title}</b><p>{s.text}</p></li>)}</ol>
          {r.causes.length > 0 && <div className="cx-sim-card"><h3>Likely causes to consider</h3><ul data-abg="causes">{r.causes.map((c) => <li key={c}>{c}</li>)}</ul></div>}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onAsk(`ABG: pH ${v.ph}, pCO₂ ${v.pco2}, HCO₃ ${v.hco3}${v.na ? `, Na ${v.na}` : ""}${v.cl ? `, Cl ${v.cl}` : ""}${v.lactate ? `, lactate ${v.lactate}` : ""}${v.pao2 ? `, PaO₂ ${v.pao2} on FiO₂ ${v.fio2 || "?"}` : ""}. Interpretation so far: ${r.summary}. Help me with the causes and management in this patient.`)}><MessageSquare size={14} /> Discuss with Cadus</button></div>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Wind size={20} /></span><h3>pH, pCO₂ and HCO₃ to start</h3><p>Add Na and Cl for the anion gap, and PaO₂ with FiO₂ for oxygenation.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Rules of thumb for adults; always read the gas with the patient in front of you.</p>
    </section>
  );
}
