/** Lupus (SLE): 2019 EULAR/ACR classification score and the care plan. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { SLE_CRITERIA, slePlan } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

export default function LupusView() {
  const [ana, setAna] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [preg, setPreg] = useState(false);
  const [onHcq, setOnHcq] = useState(false);
  const [years, setYears] = useState(0);
  const [kg, setKg] = useState(0);
  const [fever, setFever] = useState(false);
  const r = slePlan({ ana, picked, pregnantOrPlanning: preg, onHcq, hcqYears: years, weightKg: kg, fever });
  const domains = [...new Set(SLE_CRITERIA.map((c) => c[1]))];
  const toggle = (k: string, on: boolean) => setPicked((p) => (on ? [...p, k] : p.filter((x) => x !== k)));
  return (
    <section className="cx-page cx-lab cx-sle">
      <header className="cx-page-h"><div><h1>Lupus (SLE)</h1><p>2019 EULAR/ACR classification score (ANA 1:80 or higher, then 10 points or more), hydroxychloroquine dosing and eye checks, kidney and pregnancy planning.</p></div></header>
      <div className="cx-imaging-ticks"><Tick on={ana} set={setAna} label="ANA 1:80 or higher (HEp-2)" data="sle-ana" /></div>
      {domains.map((d) => (
        <fieldset key={d} className="cx-c50-dom"><legend>{d}</legend>
          <div className="cx-imaging-ticks">{SLE_CRITERIA.filter((c) => c[1] === d).map(([k, , w, l]) => <Tick key={k} on={picked.includes(k)} set={(v) => toggle(k, v)} label={`${l} (${w})`} data={`sle-${k}`} />)}</div>
        </fieldset>
      ))}
      <div className="cx-c23-row"><NumField label="Weight (kg)" value={kg} set={setKg} placeholder="60" data="sle-kg" max={250} /><NumField label="Years on hydroxychloroquine" value={years} set={setYears} placeholder="0" data="sle-years" max={60} /></div>
      <div className="cx-imaging-ticks"><Tick on={onHcq} set={setOnHcq} label="Already on hydroxychloroquine" data="sle-onhcq" /><Tick on={fever} set={setFever} label="Fever now" data="sle-fever" /><Tick on={preg} set={setPreg} label="Pregnant or planning pregnancy" data="sle-preg" /></div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="sle-out"><p className="cx-c50-score" data-t="sle-score" data-score={r.score}><b>{r.score}</b> points · {r.classified ? "meets SLE classification" : "below the threshold"}</p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> 2019 EULAR/ACR SLE classification criteria; EULAR 2023 SLE management recommendations; AAO 2016 hydroxychloroquine screening.</p>
    </section>
  );
}
