/**
 * Preterm Labour: by gestation, antenatal steroids, magnesium for neuroprotection, tocolysis,
 * antibiotics for PPROM, GBS and chorioamnionitis, and timing and place of birth.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { pretermPlan } from "@/lib/cadus/clinic31";

export default function PretermView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [w, setW] = useState("");
  const [d, setD] = useState("0");
  const [x, setX] = useState({ pprom: false, inLabour: true, infection: false, gbsUnknown: true, tocoContra: false });
  const weeks = Number(w);
  const p = weeks >= 20 && weeks < 37 ? pretermPlan({ weeks, days: Number(d) || 0, ...x }) : null;
  const md = () => p ? [`# Preterm labour plan: ${w}+${d} weeks`, "", `- ${p.steroids}`, `- ${p.magnesium}`, `- ${p.tocolysis}`, ...p.antibiotics.map((a) => `- ${a}`), `- ${p.delivery}`].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-preterm">
      <header className="cx-page-h"><div><h1>Preterm Labour</h1><p>What to give by gestation: antenatal steroids, magnesium for the baby's brain, tocolysis to buy time, antibiotics for ruptured membranes and GBS, and when and where to deliver.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Gestation (weeks)</span><input className="cx-input" inputMode="numeric" value={w} onChange={(e) => setW(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="30" data-pt="weeks" /></label>
        <label className="cx-field"><span>+ days</span><select className="cx-select" value={d} onChange={(e) => setD(e.target.value)}>{[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
        {([["inLabour", "In established labour"], ["pprom", "Membranes ruptured (PPROM)"], ["infection", "Signs of chorioamnionitis"], ["gbsUnknown", "GBS status unknown or positive"], ["tocoContra", "Bleeding, fetal compromise or other contraindication"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-pt={k} /> {l}</label>)}
      </div>
      {p ? (
        <div className="cx-cmp-out" data-pt="out">
          <p data-pt="steroids"><b>Steroids:</b> {p.steroids}</p>
          <p data-pt="mag"><b>Magnesium:</b> {p.magnesium}</p>
          <p data-pt="toco"><b>Tocolysis:</b> {p.tocolysis}</p>
          {p.antibiotics.length > 0 && <ul data-pt="abx">{p.antibiotics.map((a) => <li key={a}>{a}</li>)}</ul>}
          <p data-pt="delivery"><b>Birth:</b> {p.delivery}</p>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Preterm labour plan", md())}><Printer size={14} /> Print plan</button></div>
        </div>
      ) : <p className="cx-set-hint">Enter a gestation from 20 to 36 weeks.</p>}
      <p className="cx-set-hint">Confirm gestation (early scan), check for infection, and assess with cervical length or fetal fibronectin where available; most women with threatened preterm labour do not deliver within 7 days.</p>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> WHO 2022 recommendations on interventions to improve preterm birth outcomes; NICE NG25; FOGSI. Steroids only when gestation is reliable, birth is likely within 7 days, and newborn care is available.</p>
    </section>
  );
}
