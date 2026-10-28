/** Anaemia in pregnancy: grade, IFA (Anaemia Mukt Bharat), IV iron, transfusion thresholds, thalassaemia trait. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { ancAnaemiaPlan, type AncAnaemiaInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = "mcvLow" | "heartFailure" | "breathlessRest" | "notResponding" | "intolerant" | "thalTrait";
const T: [B, string][] = [["mcvLow", "Low MCV (microcytic)"], ["thalTrait", "Known thalassaemia trait"], ["notResponding", "Not responding to oral iron"], ["intolerant", "Can't tolerate oral iron"], ["breathlessRest", "Breathless at rest"], ["heartFailure", "Signs of heart failure"]];

export default function AnaemiaPregnancyView() {
  const [x, setX] = useState<AncAnaemiaInput>({ hb: 0, weeks: 0, ferritin: 0, mcvLow: false, heartFailure: false, breathlessRest: false, notResponding: false, intolerant: false, thalTrait: false, weightKg: 0 });
  const r = ancAnaemiaPlan(x);
  return (
    <section className="cx-page cx-lab cx-aip">
      <header className="cx-page-h"><div><h1>Anaemia in Pregnancy</h1><p>Grade it, give the right iron by the right route, and know when to transfuse — following Anaemia Mukt Bharat.</p></div></header>
      <div className="cx-c50-grid">
        <NumField label="Hb (g/dL)" value={x.hb} set={(n) => setX({ ...x, hb: n })} placeholder="8.6" data="aip-hb" decimals max={25} />
        <NumField label="Weeks pregnant" value={x.weeks} set={(n) => setX({ ...x, weeks: n })} placeholder="24" data="aip-weeks" max={42} />
        <NumField label="Ferritin (µg/L)" value={x.ferritin} set={(n) => setX({ ...x, ferritin: n })} placeholder="12" data="aip-ferritin" decimals max={5000} />
        <NumField label="Weight (kg)" value={x.weightKg} set={(n) => setX({ ...x, weightKg: n })} placeholder="55" data="aip-kg" max={200} />
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`aip-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="aip-out"><p className="cx-c50-score"><b data-t="aip-band" data-band={r.band}>{r.band === "none" ? "" : r.band === "normal" ? "Not anaemic" : `${r.band[0].toUpperCase() + r.band.slice(1)} anaemia`}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> MoHFW Anaemia Mukt Bharat 2018; FOGSI 2016 iron deficiency in pregnancy; WHO 2011 haemoglobin thresholds.</p>
    </section>
  );
}
