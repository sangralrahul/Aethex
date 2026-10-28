/** Phimosis and balanitis: normal non-retractile foreskin, steroid cream, BXO, paraphimosis, candida. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { phimosisPlan, type PhimosisInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof PhimosisInput, "age" | "weeks">;
const T: [B, string][] = [["retracts", "Foreskin retracts fully"], ["ballooning", "Balloons when passing urine"], ["scarring", "White, scarred ring at the tip"], ["recurrentBalanitis", "Recurrent balanoposthitis"], ["recurrentUti", "Recurrent UTIs"], ["paraphimosis", "Stuck behind the glans (paraphimosis)"], ["retention", "Can't pass urine"], ["balanitis", "Red, sore glans now (balanitis)"], ["candidaLook", "Itchy, white patches or satellite spots"], ["diabetes", "Known diabetes"], ["lesion", "Patch, ulcer or lump on the glans"]];

export default function PhimosisView() {
  const [x, setX] = useState<PhimosisInput>({ age: 0, retracts: false, ballooning: false, scarring: false, recurrentBalanitis: false, recurrentUti: false, paraphimosis: false, retention: false, balanitis: false, candidaLook: false, diabetes: false, weeks: 0, lesion: false });
  const r = phimosisPlan(x);
  return (
    <section className="cx-page cx-lab cx-phm">
      <header className="cx-page-h"><div><h1>Phimosis & Balanitis</h1><p>A tight foreskin is normal in children. Know when it isn't, treat balanitis, and handle paraphimosis as an emergency.</p></div></header>
      <div className="cx-c23-row"><NumField label="Age (years)" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="5" data="phm-age" max={110} /><NumField label="Weeks of symptoms" value={x.weeks} set={(n) => setX({ ...x, weeks: n })} placeholder="1" data="phm-weeks" max={520} /></div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`phm-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="phm-out" />
      <p className="cx-rs-foot"><BookOpen size={13} /> BAPS / BAUS foreskin guidance; BASHH 2015 balanitis guideline; NICE CKS balanitis.</p>
    </section>
  );
}
