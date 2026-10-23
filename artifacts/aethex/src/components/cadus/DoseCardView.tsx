/**
 * Dose card by weight: one printable card for a patient's weight (or estimated from age): emergency
 * drugs, tube size, fluids and the common weight-based medicines, from the Cadus crash-cart and
 * formulary data, calculated on this device.
 */
import { useMemo, useState } from "react";
import { Baby, Printer, Scale, TriangleAlert } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { doseCard, doseCardMarkdown } from "@/lib/cadus/clinic21";

export default function DoseCardView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [kg, setKg] = useState("");
  const [age, setAge] = useState("");
  const [label, setLabel] = useState("");
  const card = useMemo(() => doseCard({ kg: Number(kg) || undefined, ageYears: age.trim() === "" ? null : Number(age) }), [kg, age]);
  const md = card ? doseCardMarkdown(card, label.trim()) : "";
  return (
    <section className="cx-page cx-lab cx-dcard">
      <header className="cx-page-h"><div><h1>Dose Card by Weight</h1><p>Type the weight, or the age if there's no time to weigh. You get one card with the emergency drug doses, the tube size, fluids and the common weight-based medicines, to print and keep at the bedside or stick on the resuscitation trolley.</p></div></header>
      <div className="cx-mr-pt">
        <label className="cx-field"><span><Scale size={13} /> Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="e.g. 14" data-dcard="kg" /></label>
        <label className="cx-field"><span><Baby size={13} /> Age (years)</span><input className="cx-input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="e.g. 3 (0.5 for 6 months)" data-dcard="age" /></label>
        <label className="cx-field"><span>Label (optional)</span><input className="cx-input" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 40))} placeholder="e.g. Bed 4, or PICU trolley" /></label>
      </div>
      {card ? (
        <>
          {card.estimated && <div className="cx-sc-gaps" data-dcard="estimated"><b>Estimated weight:</b> {card.kg} kg from the age. Weigh the child as soon as you can.</div>}
          <div className="cx-sc-note" data-dcard="card"><MdBlock text={md} /></div>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint(`Doses for ${card.kg} kg`, md)} data-dcard="print"><Printer size={14} /> Print the card</button></div>
        </>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Scale size={20} /></span><h3>Weight or age</h3><p>Everything is calculated on this device from the Cadus formulary.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Check each dose against the concentration you have and your local protocol before you give it.</p>
    </section>
  );
}
