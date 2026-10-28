/** Acute gastroenteritis in adults: rehydration, when antibiotics help, red flags. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { gePlan, type GeInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof GeInput, "days" | "dehydration">;
const T: [B, string][] = [["blood", "Blood in stool"], ["fever", "Fever over 38.5 °C"], ["severePain", "Severe abdominal pain"], ["ricewater", "Profuse rice-water stools"], ["recentAbx", "Antibiotics in the last 3 months"], ["travel", "Recent travel"], ["elderly", "Over 65"], ["immuno", "Immunosuppressed"], ["ckd", "Kidney disease"], ["pregnant", "Pregnant"], ["foodHandler", "Food handler or health/childcare worker"]];

export default function GastroenteritisView() {
  const [x, setX] = useState<GeInput>({ days: 0, blood: false, fever: false, severePain: false, dehydration: "none", elderly: false, immuno: false, ricewater: false, travel: false, recentAbx: false, foodHandler: false, pregnant: false, ckd: false });
  const r = gePlan(x);
  return (
    <section className="cx-page cx-lab cx-ge">
      <header className="cx-page-h"><div><h1>Acute Gastroenteritis (Adults)</h1><p>ORS first. Antibiotics only for dysentery, cholera or the very unwell — and know when diarrhoea is something else.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Dehydration</span><select className="cx-select" value={x.dehydration} onChange={(e) => setX({ ...x, dehydration: e.target.value as GeInput["dehydration"] })} data-t="ge-dehyd"><option value="none">None</option><option value="some">Some (thirsty, dry mouth, less urine)</option><option value="severe">Severe (lethargic, low BP)</option></select></label>
        <NumField label="Days of diarrhoea" value={x.days} set={(n) => setX({ ...x, days: n })} placeholder="2" data="ge-days" max={365} />
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`ge-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="ge-out" />
      <p className="cx-rs-foot"><BookOpen size={13} /> WHO diarrhoea treatment (plans A–C); ICMR antimicrobial treatment guidelines 2022; IDSA 2017 infectious diarrhoea.</p>
    </section>
  );
}
