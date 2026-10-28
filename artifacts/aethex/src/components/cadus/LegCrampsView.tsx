/** Nocturnal leg cramps: what else it could be, medicine causes, stretching, and the limited role of quinine. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { crampPlan, type CrampInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof CrampInput, "perWeek">;
const T: [B, string][] = [["swelling", "One calf swollen or tender"], ["urgeToMove", "Urge to move the legs, no hard spasm"], ["claudication", "Calf pain on walking, better with rest"], ["weakness", "Weakness, wasting or twitching"], ["diuretic", "On a diuretic"], ["statin", "On a statin"], ["betaAgonist", "Uses salbutamol or similar"], ["ckd", "Kidney disease or dialysis"], ["diabetes", "Diabetes"], ["pregnant", "Pregnant"], ["elderly", "Over 75"]];

export default function LegCrampsView() {
  const [x, setX] = useState<CrampInput>({ perWeek: 0, pregnant: false, diuretic: false, statin: false, betaAgonist: false, ckd: false, diabetes: false, claudication: false, urgeToMove: false, weakness: false, swelling: false, elderly: false });
  const r = crampPlan(x);
  return (
    <section className="cx-page cx-lab cx-crm">
      <header className="cx-page-h"><div><h1>Nocturnal Leg Cramps</h1><p>Common and usually harmless. Rule out DVT, restless legs and claudication, review medicines, and teach calf stretches.</p></div></header>
      <div className="cx-c23-row"><NumField label="Cramps a week" value={x.perWeek} set={(n) => setX({ ...x, perWeek: n })} placeholder="3" data="crm-perweek" max={70} /></div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`crm-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="crm-out" />
      <p className="cx-rs-foot"><BookOpen size={13} /> NICE CKS leg cramps; MHRA 2010 quinine advice; Cochrane quinine for muscle cramps (2015).</p>
    </section>
  );
}
