/**
 * Paediatric DKA: severity, bolus, deficit plus maintenance over 48 hours with the hourly rate,
 * insulin, glucose and cerebral oedema (BSPED 2021, ISPAD 2022).
 */
import { useState } from "react";
import { Droplet, Printer, TriangleAlert } from "lucide-react";
import { paedDka } from "@/lib/cadus/clinic37";

export default function PaedDkaView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ kg: "", ph: "", hco3: "" });
  const [shocked, setShocked] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-pd={k} /></label>;
  const ready = v.kg && v.ph;
  const d = ready ? paedDka(Number(v.kg), Number(v.ph), v.hco3 ? Number(v.hco3) : null, shocked) : null;
  const md = () => d ? ["# Paediatric DKA plan", "", `- Weight ${v.kg} kg, pH ${v.ph}: **${d.severity}** (deficit ${d.deficitPct}%)`, `- ${d.bolus}`, `- Fluid rate: **${d.hourly} ml/hour**`, `- ${d.insulin}`, ...d.steps.map((s) => `- ${s}`)].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-paeddka">
      <header className="cx-page-h"><div><h1>Paediatric DKA</h1><p>Severity, bolus, deficit and maintenance over 48 hours as an hourly rate, insulin, when to add glucose, and cerebral oedema treatment.</p></div></header>
      <div className="cx-c23-row">{n("kg", "Weight (kg)", "25")}{n("ph", "pH", "7.15")}{n("hco3", "Bicarbonate (mmol/L)", "8")}
        <label className="cx-pa-mine"><input type="checkbox" checked={shocked} onChange={(e) => setShocked(e.target.checked)} data-pd="shocked" /> Shocked (poor perfusion, hypotension)</label>
      </div>
      {d && (
        <div className={`cx-cmp-out ${d.severity === "severe" ? "cx-st-out" : "cx-ac-high"}`} data-pd="out" data-severity={d.severity}>
          <h3 className="cx-lab-h3">{d.severity[0].toUpperCase() + d.severity.slice(1)} DKA: {d.hourly} ml/hour</h3>
          <p><b>{d.bolus}</b></p><p>{d.insulin}</p>
          <ol className="cx-c23-steps">{d.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Paediatric DKA plan", md())} data-pd="print"><Printer size={14} /> Print</button></div>
        </div>
      )}
      <p className="cx-rs-foot"><Droplet size={13} /> BSPED 2021 DKA guideline, ISPAD 2022. <TriangleAlert size={13} /> Use your unit's protocol and calculator where one exists; involve the paediatric diabetes team.</p>
    </section>
  );
}
