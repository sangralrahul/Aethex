/**
 * Acute Kidney Injury: KDIGO stage from creatinine and urine output, a causes checklist,
 * what to do now, and when to dialyse.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { AKI_CAUSES, akiPlan, akiStage } from "@/lib/cadus/clinic32";

export default function AkiView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ base: "", cur: "", uo: "", hrs: "", k: "", ph: "" });
  const [x, setX] = useState({ within48h: false, rrt: false, overload: false, uraemic: false, toxin: false });
  const [causes, setCauses] = useState<string[]>([]);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const st = v.base && v.cur ? akiStage({ baseline: Number(v.base), current: Number(v.cur), within48h: x.within48h, uoMlKgH: v.uo === "" ? undefined : Number(v.uo), uoHours: Number(v.hrs) || 0, rrt: x.rrt }) : null;
  const plan = akiPlan(st?.stage ?? 0, { k: v.k ? Number(v.k) : undefined, ph: v.ph ? Number(v.ph) : undefined, overload: x.overload, uraemic: x.uraemic, toxin: x.toxin });
  const f = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: n(e.target.value) })} placeholder={ph} data-aki={k} /></label>;
  const md = () => ["# Acute kidney injury", "", st ? `**${st.text}**` : "", causes.length ? `Possible causes: ${causes.join("; ")}` : "", "", ...plan.now.map((p) => `- ${p}`), ...(plan.dialysis.length ? ["", "## Dialysis indications present", ...plan.dialysis.map((d) => `- ${d}`)] : [])].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-aki">
      <header className="cx-page-h"><div><h1>Acute Kidney Injury</h1><p>The KDIGO stage from creatinine and urine output, the causes to check, what to do now, and when to call for dialysis.</p></div></header>
      <div className="cx-c23-row">
        {f("base", "Baseline creatinine (mg/dL)", "1.0")}{f("cur", "Current creatinine", "2.2")}
        <label className="cx-pa-mine"><input type="checkbox" checked={x.within48h} onChange={(e) => setX({ ...x, within48h: e.target.checked })} data-aki="48h" /> Rise within 48 hours</label>
        {f("uo", "Urine output (ml/kg/hour)", "0.4")}{f("hrs", "for how many hours", "12")}
        <label className="cx-pa-mine"><input type="checkbox" checked={x.rrt} onChange={(e) => setX({ ...x, rrt: e.target.checked })} /> Already on dialysis</label>
      </div>
      {st && <div className={`cx-cmp-out ${st.stage === 3 ? "cx-st-out" : st.stage ? "cx-ac-high" : "cx-ac-in"}`} data-aki="out" data-stage={st.stage}><h3 className="cx-lab-h3" data-aki="stage">{st.text}</h3></div>}
      <h4>Causes to check</h4>
      <div className="cx-c23-two">{AKI_CAUSES.map((g) => <div key={g.group}><b>{g.group}</b><div className="cx-imaging-ticks">{g.items.map((c) => <label key={c} className="cx-pa-mine"><input type="checkbox" checked={causes.includes(c)} onChange={() => setCauses(causes.includes(c) ? causes.filter((y) => y !== c) : [...causes, c])} /> {c}</label>)}</div></div>)}</div>
      <h4>Now</h4>
      <div className="cx-c23-row">{f("k", "Potassium", "5.8")}{f("ph", "pH", "7.25")}
        {([["overload", "Pulmonary oedema not responding"], ["uraemic", "Uraemic encephalopathy, pericarditis or bleeding"], ["toxin", "Dialysable poison"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-aki={k} /> {l}</label>)}
      </div>
      <ol className="cx-c23-steps" data-aki="now">{plan.now.map((p) => <li key={p}>{p}</li>)}</ol>
      {plan.dialysis.length > 0 && <div className="cx-cmp-out cx-st-out" data-aki="dialysis"><h4>Dialysis indication: call nephrology now</h4><ul>{plan.dialysis.map((d) => <li key={d}>{d}</li>)}</ul></div>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Acute kidney injury", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> KDIGO 2012 AKI guideline; NICE NG148. Use the lowest creatinine in the last 3 months (or 7 days) as the baseline.</p>
    </section>
  );
}
