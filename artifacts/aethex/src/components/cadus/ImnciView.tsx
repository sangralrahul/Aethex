/**
 * IMNCI Sick Child (2 months to 5 years): tick the signs, and Cadus classifies by the colour-coded
 * IMNCI chart (pink: refer urgently, yellow: treat, green: home care) for danger signs, cough or
 * difficult breathing, diarrhoea and fever, with doses by weight.
 */
import { useState } from "react";
import { Baby, Printer, TriangleAlert } from "lucide-react";
import { imnci, type ImnciIn } from "@/lib/cadus/clinic24";

type Dx = NonNullable<ImnciIn["dehydration"]>;

export default function ImnciView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [danger, setDanger] = useState<ImnciIn["danger"]>({});
  const [cough, setCough] = useState(false);
  const [rr, setRr] = useState("");
  const [indrawing, setIndrawing] = useState(false);
  const [stridor, setStridor] = useState(false);
  const [dia, setDia] = useState(false);
  const [days, setDays] = useState("");
  const [blood, setBlood] = useState(false);
  const [dx, setDx] = useState<Dx>({});
  const [fever, setFever] = useState(false);
  const [neck, setNeck] = useState(false);
  const ageM = Number(age);
  const valid = ageM >= 2 && ageM <= 60;
  const res = valid ? imnci({ ageMonths: ageM, weightKg: Number(weight) || undefined, danger, cough, rr: rr ? Number(rr) : undefined, chestIndrawing: indrawing, stridor, diarrhoeaDays: dia ? Number(days) || 1 : 0, blood, dehydration: dx, fever, stiffNeck: neck }) : null;
  const tick = (label: string, checked: boolean, on: (v: boolean) => void, key: string) => <label className="cx-pa-mine"><input type="checkbox" checked={checked} onChange={(e) => on(e.target.checked)} data-imnci={key} /> {label}</label>;
  const md = () => res ? ["# IMNCI classification", `Age ${ageM} months${weight ? `, ${weight} kg` : ""}`, ...res.classes.map((c) => `\n## ${c.area}: ${c.label} (${c.colour})\n${c.treat.map((t) => `- ${t}`).join("\n")}`)].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-imnci">
      <header className="cx-page-h"><div><h1>IMNCI Sick Child</h1><p>For a child from 2 months to 5 years: tick what you find and get the IMNCI classification (pink, yellow or green) with the treatment and doses by weight.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age (months)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="18" data-imnci="age" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="10" data-imnci="weight" /></label>
      </div>
      {age && !valid && <div className="cx-sc-gaps">IMNCI for this tool covers 2 months to 5 years. For a young infant under 2 months, use the young-infant chart.</div>}
      <div className="cx-imnci-grid">
        <fieldset><legend>General danger signs</legend>
          {tick("Not able to drink or breastfeed", !!danger.cantDrink, (v) => setDanger({ ...danger, cantDrink: v }), "cantDrink")}
          {tick("Vomits everything", !!danger.vomitsAll, (v) => setDanger({ ...danger, vomitsAll: v }), "vomitsAll")}
          {tick("Convulsions", !!danger.convulsions, (v) => setDanger({ ...danger, convulsions: v }), "convulsions")}
          {tick("Lethargic or unconscious", !!danger.lethargic, (v) => setDanger({ ...danger, lethargic: v }), "lethargic")}
        </fieldset>
        <fieldset><legend>{tick("Cough or difficult breathing", cough, setCough, "cough")}</legend>
          {cough && <>
            <label className="cx-field"><span>Breaths per minute (count for 1 minute)</span><input className="cx-input" inputMode="numeric" value={rr} onChange={(e) => setRr(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="44" data-imnci="rr" /></label>
            {tick("Chest indrawing", indrawing, setIndrawing, "indrawing")}{tick("Stridor in a calm child", stridor, setStridor, "stridor")}
          </>}
        </fieldset>
        <fieldset><legend>{tick("Diarrhoea", dia, setDia, "diarrhoea")}</legend>
          {dia && <>
            <label className="cx-field"><span>For how many days</span><input className="cx-input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="2" data-imnci="days" /></label>
            {tick("Blood in the stool", blood, setBlood, "blood")}
            {([["lethargic", "Lethargic or unconscious"], ["restless", "Restless, irritable"], ["sunkenEyes", "Sunken eyes"], ["drinksPoorly", "Not able to drink or drinks poorly"], ["thirsty", "Drinks eagerly, thirsty"], ["pinchVerySlow", "Skin pinch goes back very slowly (over 2 s)"], ["pinchSlow", "Skin pinch goes back slowly"]] as [keyof Dx, string][]).map(([k, l]) => <span key={k}>{tick(l, !!dx[k], (v) => setDx({ ...dx, [k]: v }), `dx-${k}`)}</span>)}
          </>}
        </fieldset>
        <fieldset><legend>{tick("Fever (history, or 37.5 °C or more)", fever, setFever, "fever")}</legend>
          {fever && tick("Stiff neck", neck, setNeck, "neck")}
        </fieldset>
      </div>
      {res && res.classes.length > 0 && (
        <div className="cx-cmp-out" data-imnci="out">
          {res.urgentReferral && <div className="cx-sc-gaps"><b><TriangleAlert size={13} /> Pink classification: give the first doses and refer urgently.</b></div>}
          {res.classes.map((c) => <div key={c.area + c.label} className={`cx-imnci-c ${c.colour}`} data-imnci-class={c.label}><b>{c.label}</b><small>{c.area}</small><ul>{c.treat.map((t) => <li key={t}>{t}</li>)}</ul></div>)}
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("IMNCI classification", md())} data-imnci="print"><Printer size={14} /> Print</button></div>
        </div>
      )}
      {res && !res.classes.length && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Baby size={20} /></span><h3>Tick the main symptoms</h3><p>Cough, diarrhoea or fever, and any danger signs.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> From the IMNCI chart booklet (MoHFW). Also check nutrition, anaemia, immunisation and feeding as on the chart.</p>
    </section>
  );
}
