/**
 * Animal Bite (Rabies PEP): the WHO category from the exposure, wound care, the anti-rabies
 * vaccine dates (IM or intradermal), immunoglobulin by weight for category III, and a card with
 * the dates for the patient. National Rabies Control Programme (2019).
 */
import { useState } from "react";
import { Dog, Printer, TriangleAlert } from "lucide-react";
import { BITE_SIGNS, fmtDate, isoDay, rabiesPlan, type ArvRoute, type BiteCategory } from "@/lib/cadus/clinic24";

export default function AnimalBiteView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [cat, setCat] = useState<BiteCategory | 0>(0);
  const [route, setRoute] = useState<ArvRoute>("im");
  const [start, setStart] = useState(isoDay(new Date()));
  const [weight, setWeight] = useState("");
  const [before, setBefore] = useState(false);
  const [rig, setRig] = useState<"equine" | "human">("equine");
  const [animal, setAnimal] = useState("Dog");
  const plan = cat ? rabiesPlan(cat, { start, route, weightKg: Number(weight) || undefined, vaccinatedBefore: before, rig }) : null;

  const card = () => plan ? [
    "# Anti-rabies vaccination card", `${animal} bite · Category ${["", "I", "II", "III"][plan.category]} · ${route === "im" ? "intramuscular" : "intradermal"}`, "",
    "| Dose | Day | Date | Given (sign) |", "|---|---|---|---|", ...plan.vaccine.map((v, i) => `| ${i + 1} | ${v.day} | ${fmtDate(v.date)} | |`),
    plan.rig ? `\nRabies immunoglobulin: ${plan.rig.iu ? `${plan.rig.iu} IU` : "by weight"} on day 0, into the wounds.` : "",
    "\n_Come on every date, even if you feel well. Don't apply chillies, oil or turmeric to the wound. Bring this card each time._",
  ].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-bite">
      <header className="cx-page-h"><div><h1>Animal Bite (Rabies PEP)</h1><p>The exposure category, wound care, vaccine dates and immunoglobulin dose for a dog, cat, monkey or other animal bite, with a card of dates for the patient.</p></div></header>
      <h3 className="cx-lab-h3">What happened?</h3>
      <div className="cx-bite-cats" role="radiogroup" aria-label="Exposure">{BITE_SIGNS.map((b) => <button key={b.cat} role="radio" aria-checked={cat === b.cat} className={`${cat === b.cat ? "on" : ""} c${b.cat}`} onClick={() => setCat(b.cat)} data-bite-cat={b.cat}><b>Category {["", "I", "II", "III"][b.cat]}</b><span>{b.text}</span></button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Animal</span><select className="cx-select" value={animal} onChange={(e) => setAnimal(e.target.value)}>{["Dog", "Cat", "Monkey", "Mongoose", "Jackal or fox", "Bat", "Livestock", "Other"].map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="cx-field"><span>First dose (day 0)</span><input className="cx-input" type="date" value={start} onChange={(e) => setStart(e.target.value || isoDay(new Date()))} data-bite="start" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="for immunoglobulin" data-bite="weight" /></label>
      </div>
      <div className="cx-c23-row">
        <div className="cx-seg" role="radiogroup" aria-label="Route">{([["im", "Intramuscular (5 doses)"], ["id", "Intradermal (4 visits)"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={route === v} className={route === v ? "on" : ""} onClick={() => setRoute(v)} data-bite-route={v}>{l}</button>)}</div>
        <div className="cx-seg" role="radiogroup" aria-label="Immunoglobulin">{([["equine", "Equine RIG"], ["human", "Human RIG"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={rig === v} className={rig === v ? "on" : ""} onClick={() => setRig(v)}>{l}</button>)}</div>
        <label className="cx-pa-mine"><input type="checkbox" checked={before} onChange={(e) => setBefore(e.target.checked)} data-bite="before" /> Fully vaccinated against rabies before</label>
      </div>
      {plan && (
        <div className="cx-cmp-out" data-bite="out">
          <h4>Wound care</h4><ul>{plan.wound.map((w) => <li key={w}>{w}</li>)}</ul>
          {plan.vaccine.length > 0 ? (
            <div className="cx-c23-scroll"><table className="cx-c23-table" data-bite="doses"><thead><tr><th>Day</th><th>Date</th><th>Dose</th></tr></thead><tbody>{plan.vaccine.map((v) => <tr key={v.day}><td>{v.day}</td><td>{fmtDate(v.date)}</td><td>{v.what}</td></tr>)}</tbody></table></div>
          ) : <p data-bite="none"><b>No vaccine needed.</b></p>}
          {plan.rig && <div className="cx-sc-gaps" data-bite="rig"><b>Rabies immunoglobulin{plan.rig.iu ? `: ${plan.rig.iu} IU` : ": enter the weight for the dose"}</b>{plan.rig.ml && <p>{plan.rig.ml}</p>}<p>{plan.rig.what}</p></div>}
          <ul>{plan.notes.map((x) => <li key={x}>{x}</li>)}</ul>
          {plan.vaccine.length > 0 && <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("Anti-rabies vaccination card", card())} data-bite="print"><Printer size={14} /> Print the patient's card</button></div>}
        </div>
      )}
      {!plan && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Dog size={20} /></span><h3>Choose what happened</h3><p>The category decides the vaccine and immunoglobulin.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> National Guidelines for Rabies Prophylaxis (NRCP 2019) and WHO 2018. Rabies is almost always fatal once symptoms start: never delay post-exposure prophylaxis.</p>
    </section>
  );
}
