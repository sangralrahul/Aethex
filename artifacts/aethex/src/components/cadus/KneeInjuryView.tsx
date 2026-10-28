/** Knee ligament and meniscus injuries: Ottawa knee rule, ACL, meniscus, MCL, patellar dislocation. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { kneePlan, type KneeInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof KneeInput, "age">;
const OTT: [B, string][] = [["patella", "Isolated patellar tenderness"], ["fibularHead", "Fibular head tenderness"], ["cantFlex90", "Can't flex to 90°"], ["cantBearWeight", "Can't take 4 steps"]];
const T: [B, string][] = [["pop", "Felt or heard a pop"], ["rapidSwelling", "Swelling within 2 hours"], ["givingWay", "Giving way"], ["lachman", "Positive Lachman"], ["locked", "Locked — can't straighten"], ["jointLinePain", "Joint line tenderness"], ["mcmurray", "Positive McMurray / Thessaly"], ["valgusLax", "Laxity on valgus stress"], ["dislocatedPatella", "Kneecap dislocated"], ["hot", "Hot swollen knee, no clear injury"], ["neurovascular", "Cold or pulseless foot"]];

export default function KneeInjuryView() {
  const [x, setX] = useState<KneeInput>({ age: 0, patella: false, fibularHead: false, cantFlex90: false, cantBearWeight: false, pop: false, rapidSwelling: false, givingWay: false, locked: false, jointLinePain: false, mcmurray: false, lachman: false, valgusLax: false, dislocatedPatella: false, hot: false, neurovascular: false });
  const r = kneePlan(x);
  const t = ([k, l]: [B, string]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`kne-${k}`} />;
  return (
    <section className="cx-page cx-lab cx-kne">
      <header className="cx-page-h"><div><h1>Knee Ligament & Meniscus</h1><p>Ottawa knee rule for X-rays, then the history and tests that point to an ACL, meniscus or MCL injury — and when it can't wait.</p></div></header>
      <div className="cx-c23-row"><NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="24" data="kne-age" max={110} /></div>
      <fieldset className="cx-c50-dom"><legend>Ottawa knee rule</legend><div className="cx-imaging-ticks">{OTT.map(t)}</div></fieldset>
      <fieldset className="cx-c50-dom"><legend>History and examination</legend><div className="cx-imaging-ticks">{T.map(t)}</div></fieldset>
      <PlanOut urgency={r.urgency} steps={r.steps} data="kne-out"><p className="cx-c50-score"><b data-t="kne-xray" data-xray={r.xray ? "yes" : "no"}>{r.xray ? "X-ray needed" : "No X-ray by Ottawa"}</b>{r.likely.length ? ` · ${r.likely.join(", ")}` : ""}</p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> Ottawa knee rule (Stiell 1996); NICE CKS knee pain; ESSKA meniscus consensus 2016.</p>
    </section>
  );
}
