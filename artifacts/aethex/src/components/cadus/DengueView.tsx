/**
 * Dengue Helper: warning signs and severe features checked off, the WHO group (A home, B admit,
 * C severe), and crystalloid rates by weight hour by hour.
 */
import { useState } from "react";
import { Bug, Printer, TriangleAlert } from "lucide-react";
import { DENGUE_SEVERE, DENGUE_WARNING, denguePlan } from "@/lib/cadus/clinic26";

export default function DengueView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [weight, setWeight] = useState("");
  const [warn, setWarn] = useState<string[]>([]);
  const [sev, setSev] = useState<string[]>([]);
  const [hypo, setHypo] = useState(false);
  const [risk, setRisk] = useState(false);
  const [oral, setOral] = useState(true);
  const p = denguePlan(Number(weight), warn.length, sev.length, { hypotensive: hypo, risk, oralOk: oral });
  const tog = (l: string[], set: (x: string[]) => void, v: string) => set(l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);
  const md = () => p ? [`# Dengue: group ${p.group}`, p.label, "", ...p.fluids.map((f) => `- **${f.phase}:** ${f.rate}${f.ml ? ` (${f.ml})` : ""}`), "", ...p.steps.map((s) => `- ${s}`)].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-dengue">
      <header className="cx-page-h"><div><h1>Dengue Helper</h1><p>Tick the warning signs and severe features: get the WHO group (home, admit or severe) and the IV fluid rates by weight for each hour.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg; ideal weight if obese)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-dg="weight" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={!oral} onChange={(e) => setOral(!e.target.checked)} data-dg="oral" /> Can't drink enough</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={risk} onChange={(e) => setRisk(e.target.checked)} data-dg="risk" /> Risk: pregnancy, infant, elderly, diabetes, kidney or heart disease, alone at home</label>
      </div>
      <div className="cx-imnci-grid">
        <fieldset><legend>Warning signs</legend>{DENGUE_WARNING.map((w, i) => <label key={w} className="cx-pa-mine"><input type="checkbox" checked={warn.includes(w)} onChange={() => tog(warn, setWarn, w)} data-dg-warn={i} /> {w}</label>)}</fieldset>
        <fieldset><legend>Severe dengue</legend>{DENGUE_SEVERE.map((w, i) => <label key={w} className="cx-pa-mine"><input type="checkbox" checked={sev.includes(w)} onChange={() => tog(sev, setSev, w)} data-dg-sev={i} /> {w}</label>)}
          {sev.length > 0 && <label className="cx-pa-mine"><input type="checkbox" checked={hypo} onChange={(e) => setHypo(e.target.checked)} data-dg="hypo" /> <b>Hypotensive (BP low or unrecordable)</b></label>}
        </fieldset>
      </div>
      {p ? (
        <div className={`cx-cmp-out cx-dg-${p.group}`} data-dg="out">
          <h3 className="cx-lab-h3" data-dg="group">Group {p.group}: {p.label}</h3>
          {p.fluids.length > 0 && <div className="cx-c23-scroll"><table className="cx-c23-table" data-dg="fluids"><thead><tr><th>When</th><th>Crystalloid (0.9% saline or Ringer's lactate)</th><th>For this weight</th></tr></thead><tbody>{p.fluids.map((f) => <tr key={f.phase}><td><b>{f.phase}</b></td><td>{f.rate}</td><td>{f.ml}</td></tr>)}</tbody></table></div>}
          <ul>{p.steps.map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Dengue plan", md())} data-dg="print"><Printer size={14} /> Print</button></div>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Bug size={20} /></span><h3>Enter the weight</h3><p>Fluid rates are per kilogram.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> WHO 2009 and national (NCVBDC) dengue guidelines. Reassess clinically and by haematocrit; reduce fluids once the leak stops to avoid overload.</p>
    </section>
  );
}
