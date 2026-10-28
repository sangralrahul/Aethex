/** Bronchiectasis: exacerbations, Pseudomonas, long-term macrolide, work-up and airway clearance. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { BRONCH_EXAC_SYMPTOMS, bronchPlan, type BronchInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

export default function BronchiectasisView() {
  const [x, setX] = useState<BronchInput>({ exacSymptoms: [], exacPerYear: 0, pseudomonas: false, newPseudomonas: false, haemoptysisMassive: false, unwell: false, age: 0, newlyDiagnosed: false });
  const r = bronchPlan(x);
  const b = (k: "pseudomonas" | "newPseudomonas" | "haemoptysisMassive" | "unwell" | "newlyDiagnosed", l: string) => <Tick on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`brx-${k}`} />;
  return (
    <section className="cx-page cx-lab cx-brx">
      <header className="cx-page-h"><div><h1>Bronchiectasis</h1><p>Is this an exacerbation? Which antibiotic, for how long, when to start a long-term macrolide, and the work-up for a new diagnosis.</p></div></header>
      <fieldset className="cx-c50-dom"><legend>Worse for 48 hours or more ({x.exacSymptoms.length} of 6)</legend>
        <div className="cx-imaging-ticks">{BRONCH_EXAC_SYMPTOMS.map((sy, i) => <Tick key={sy} on={x.exacSymptoms.includes(sy)} set={(v) => setX({ ...x, exacSymptoms: v ? [...x.exacSymptoms, sy] : x.exacSymptoms.filter((s) => s !== sy) })} label={sy} data={`brx-sy${i}`} />)}</div>
      </fieldset>
      <div className="cx-c23-row"><NumField label="Exacerbations in the last year" value={x.exacPerYear} set={(n) => setX({ ...x, exacPerYear: n })} placeholder="2" data="brx-peryear" max={30} /><NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="45" data="brx-age" max={120} /></div>
      <div className="cx-imaging-ticks">{b("pseudomonas", "Pseudomonas in previous sputum")}{b("newPseudomonas", "Pseudomonas grown for the first time")}{b("unwell", "Unwell: low oxygen, low BP, confusion")}{b("haemoptysisMassive", "Large haemoptysis")}{b("newlyDiagnosed", "New diagnosis — show the work-up")}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="brx-out" />
      <p className="cx-rs-foot"><BookOpen size={13} /> BTS 2019 bronchiectasis guideline; ERS 2017 adult bronchiectasis guideline; 2017 consensus definition of exacerbation.</p>
    </section>
  );
}
