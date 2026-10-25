/**
 * Neonatal Sepsis & Antibiotics: NICE NG195 risk framework, gentamicin and ampicillin by gestation
 * and postnatal age, and duration by culture.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { ampNeo, gentNeo, NEO_DURATION, NEO_OTHER, NEO_RED, neoSepsisAction } from "@/lib/cadus/clinic39";

export default function NeoSepsisView() {
  const [red, setRed] = useState<number[]>([]);
  const [oth, setOth] = useState<number[]>([]);
  const [v, setV] = useState({ kg: "", ga: "", pna: "" });
  const [men, setMen] = useState(false);
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const a = neoSepsisAction(red.length, oth.length);
  const kg = Number(v.kg) || 0, ga = Number(v.ga) || 39, pna = Number(v.pna) || 0;
  const g = kg ? gentNeo(kg, ga, pna) : null, am = kg ? ampNeo(kg, ga, pna, men) : null;
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-ns={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-neosepsis">
      <header className="cx-page-h"><div><h1>Neonatal Sepsis &amp; Antibiotics</h1><p>Who needs antibiotics after birth, gentamicin and ampicillin doses by gestation and age, and how long to treat.</p></div></header>
      <div className="cx-c23-two">
        <div><h4>Red flags</h4><div className="cx-imaging-ticks">{NEO_RED.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={red.includes(i)} onChange={() => tg(red, setRed, i)} data-ns-red={i} /> {x}</label>)}</div></div>
        <div><h4>Other risk factors and clinical signs</h4><div className="cx-imaging-ticks">{NEO_OTHER.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={oth.includes(i)} onChange={() => tg(oth, setOth, i)} data-ns-oth={i} /> {x}</label>)}</div></div>
      </div>
      <div className={`cx-cmp-out ${a.action === "treat" ? "cx-st-out" : a.action === "observe" ? "cx-ac-high" : "cx-ac-in"}`} data-ns="out" data-action={a.action}><p><b>{a.text}</b></p></div>
      <h4>Doses</h4>
      <div className="cx-c23-row">{n("kg", "Weight (kg)", "2.8")}{n("ga", "Gestation at birth (weeks)", "38")}{n("pna", "Age (days)", "1")}
        <label className="cx-pa-mine"><input type="checkbox" checked={men} onChange={(e) => setMen(e.target.checked)} data-ns="men" /> Meningitis</label>
      </div>
      {g && am && <div className="cx-cmp-out" data-ns="doses"><ul><li><b>Ampicillin {am.mg} mg</b> IV every {am.every} hours{men ? " (meningitis dose: add cefotaxime 50 mg/kg 6–8-hourly)" : ""}.</li><li><b>Gentamicin {g.mg} mg</b> IV every {g.every} hours; trough level before the 2nd or 3rd dose (aim under 2 mg/L; under 1 with longer courses).</li></ul></div>}
      <h4>How long</h4><ul>{NEO_DURATION.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Baby size={13} /> NICE NG195 (2021), NeoFax intervals, NNF India. <TriangleAlert size={13} /> Use your NICU's protocol and antibiogram; adjust gentamicin to levels and urine output.</p>
    </section>
  );
}
