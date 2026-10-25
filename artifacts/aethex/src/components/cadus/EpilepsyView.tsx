/**
 * Epilepsy & First Seizure: the first-seizure work-up, antiseizure medicine choice by seizure type,
 * sex, pregnancy, age and comorbidity, starting doses, and safety and driving advice.
 */
import { useState } from "react";
import { Printer, TriangleAlert, Zap } from "lucide-react";
import { ASM_DOSES, asmChoice, FIRST_SEIZURE, SEIZURE_SAFETY, type SeizureType } from "@/lib/cadus/clinic31";

export default function EpilepsyView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [type, setType] = useState<SeizureType>("focal");
  const [x, setX] = useState({ childbearing: false, pregnant: false, elderly: false, renal: false, liver: false, depression: false });
  const c = asmChoice({ type, ...x });
  const md = () => ["# Epilepsy plan", "", "## Suitable first medicines", ...c.first.map((f) => `- **${f}**${ASM_DOSES[f.split(" (")[0]] ? `: ${ASM_DOSES[f.split(" (")[0]]}` : ""}`), "", "## Avoid", ...c.avoid.map((a) => `- ${a}`), "", "## Safety", ...SEIZURE_SAFETY.map((s) => `- ${s}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-epilepsy">
      <header className="cx-page-h"><div><h1>Epilepsy &amp; First Seizure</h1><p>The first-seizure work-up, which antiseizure medicine to choose for the seizure type and the patient, starting doses, and safety and driving advice.</p></div></header>
      <h4>After a first seizure</h4><ul>{FIRST_SEIZURE.map((f) => <li key={f}>{f}</li>)}</ul>
      <h4>Choosing a medicine</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Seizure type</span><select className="cx-select" value={type} onChange={(e) => setType(e.target.value as SeizureType)} data-ep="type"><option value="focal">Focal (with or without spread)</option><option value="gtc">Generalised tonic-clonic</option><option value="absence">Absence</option><option value="myoclonic">Myoclonic (e.g. JME)</option><option value="unknown">Unknown onset</option></select></label>
        {([["childbearing", "Woman or girl who could become pregnant"], ["pregnant", "Pregnant"], ["elderly", "Over 65"], ["renal", "Kidney impairment"], ["liver", "Liver disease"], ["depression", "Depression or behaviour problems"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-ep={k} /> {l}</label>)}
      </div>
      <div className="cx-cmp-out" data-ep="out">
        <h4>Suitable first medicines</h4>
        <ul data-ep="first">{c.first.map((f) => <li key={f}><b>{f}</b>{ASM_DOSES[f.split(" (")[0]] ? `: ${ASM_DOSES[f.split(" (")[0]]}` : ""}</li>)}</ul>
        {c.avoid.length > 0 && <><h4>Avoid or take care</h4><ul data-ep="avoid">{c.avoid.map((a) => <li key={a}>{a}</li>)}</ul></>}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Epilepsy plan", md())}><Printer size={14} /> Print</button></div>
      </div>
      <h4>Safety and driving</h4><ul>{SEIZURE_SAFETY.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Zap size={13} /> NICE NG217 (2022), ILAE, and MHRA valproate safety measures. <TriangleAlert size={13} /> A seizure lasting 5 minutes or more is status epilepticus: see Emergencies.</p>
    </section>
  );
}
