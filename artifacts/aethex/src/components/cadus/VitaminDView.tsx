/** Vitamin D deficiency: interpret 25(OH)D, Indian loading and maintenance doses, when not to give it. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { vitDPlan, type VitDInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof VitDInput, "value" | "unit">;
const T: [B, string][] = [["symptoms", "Bone pain or proximal weakness"], ["osteoporosis", "Osteoporosis or fractures"], ["child", "Child"], ["pregnant", "Pregnant"], ["ckd", "CKD stage 4–5"], ["malabsorption", "Malabsorption or bariatric surgery"], ["calciumHigh", "High calcium"]];

export default function VitaminDView() {
  const [x, setX] = useState<VitDInput>({ value: 0, unit: "ng/mL", child: false, pregnant: false, symptoms: false, ckd: false, malabsorption: false, calciumHigh: false, osteoporosis: false });
  const r = vitDPlan(x);
  return (
    <section className="cx-page cx-lab cx-vd">
      <header className="cx-page-h"><div><h1>Vitamin D Deficiency</h1><p>Read the 25(OH)D level, treat with sensible oral doses, and avoid the megadoses that cause toxicity.</p></div></header>
      <div className="cx-c23-row">
        <NumField label="25(OH) vitamin D" value={x.value} set={(n) => setX({ ...x, value: n })} placeholder={x.unit === "ng/mL" ? "9" : "22"} data="vd-value" decimals max={1000} />
        <label className="cx-field"><span>Unit</span><select className="cx-select" value={x.unit} onChange={(e) => setX({ ...x, unit: e.target.value as VitDInput["unit"] })} data-t="vd-unit"><option value="ng/mL">ng/mL</option><option value="nmol/L">nmol/L</option></select></label>
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`vd-${k}`} />)}</div>
      <PlanOut urgency="routine" steps={r.steps} data="vd-out"><p className="cx-c50-score"><b data-t="vd-band" data-band={r.band}>{r.band === "none" ? "" : `${r.band[0].toUpperCase() + r.band.slice(1)}`}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> IOM 2011 dietary reference intakes; Endocrine Society 2024 vitamin D guideline; ISPAE / IAP vitamin D guidance.</p>
    </section>
  );
}
