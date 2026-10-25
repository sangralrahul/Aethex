/**
 * Heart Failure GDMT: the four pillars for HFrEF with the next step for each drug from today's BP,
 * heart rate, potassium and eGFR, diuretics, and other therapies.
 */
import { useState } from "react";
import { HeartPulse, Printer, TriangleAlert } from "lucide-react";
import { HF_STEPS, hfPlan, type Pillar } from "@/lib/cadus/clinic33";

export default function HfView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ ef: "", sbp: "", hr: "", k: "", egfr: "" });
  const [cur, setCur] = useState<Record<Pillar, number>>({ raas: 0, bb: 0, mra: 0, sglt2: 0 });
  const [x, setX] = useState({ congested: false, ironLow: false, sinusHr70: false });
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const ready = v.ef !== "";
  const p = hfPlan({ ef: Number(v.ef), sbp: Number(v.sbp) || 0, hr: Number(v.hr) || 0, k: Number(v.k) || 4.5, egfr: Number(v.egfr) || 60, cur, ...x });
  const f = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: n(e.target.value) })} placeholder={ph} data-hf={k} /></label>;
  const md = () => ["# Heart failure plan", "", `**${p.type}**`, "", ...p.actions.map((a) => `- **${a.pillar}:** ${a.action}`), "", ...p.extra.map((e) => `- ${e}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-hf">
      <header className="cx-page-h"><div><h1>Heart Failure GDMT</h1><p>The four drugs that save lives in heart failure with reduced EF, and the next step for each from today's BP, heart rate, potassium and eGFR, with diuretics and other therapies.</p></div></header>
      <div className="cx-c23-row">{f("ef", "EF (%)", "30")}{f("sbp", "Systolic BP", "110")}{f("hr", "Heart rate", "78")}{f("k", "Potassium", "4.6")}{f("egfr", "eGFR", "55")}</div>
      <div className="cx-nihss">{(Object.keys(HF_STEPS) as Pillar[]).map((k) => <label key={k} className="cx-field"><span>{HF_STEPS[k].name}: now</span><select className="cx-select" value={cur[k]} onChange={(e) => setCur({ ...cur, [k]: Number(e.target.value) })} data-hf-cur={k}>{HF_STEPS[k].steps.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></label>)}</div>
      <div className="cx-c23-row">{([["congested", "Congested (oedema, crackles, raised JVP)"], ["ironLow", "Iron deficiency"], ["sinusHr70", "Sinus rhythm, HR 70+ on maximum beta-blocker"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hf={k} /> {l}</label>)}</div>
      {ready ? (
        <div className="cx-cmp-out" data-hf="out">
          <h3 className="cx-lab-h3" data-hf="type">{p.type}</h3>
          <table className="cx-c23-table" data-hf="actions"><tbody>{p.actions.map((a) => <tr key={a.pillar}><th>{a.pillar}</th><td>{a.action}</td></tr>)}</tbody></table>
          <ul>{p.extra.map((e) => <li key={e}>{e}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Heart failure plan", md())}><Printer size={14} /> Print</button></div>
        </div>
      ) : <p className="cx-set-hint">Enter the ejection fraction to start.</p>}
      <p className="cx-rs-foot"><HeartPulse size={13} /> ESC 2021/2023 and AHA/ACC/HFSA 2022 heart failure guidelines; Cardiological Society of India. <TriangleAlert size={13} /> Start all four pillars early (within weeks), at low doses, and titrate one at a time.</p>
    </section>
  );
}
