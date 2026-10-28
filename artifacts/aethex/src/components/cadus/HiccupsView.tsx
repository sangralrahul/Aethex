/** Persistent hiccups: when to look for a cause, the tests, and stepwise treatment. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { hiccupPlan, type HiccupInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof HiccupInput, "hours">;
const T: [B, string][] = [["neuro", "New neurological signs"], ["chestPain", "Chest pain or breathlessness"], ["reflux", "Heartburn or reflux"], ["ckd", "Kidney failure"], ["drugs", "On steroids, benzodiazepines, opioids or chemotherapy"], ["postOp", "Recent surgery"], ["cancer", "Known cancer"], ["sleepAffected", "Stopping sleep or eating"], ["elderly", "Frail or elderly"]];

export default function HiccupsView() {
  const [x, setX] = useState<HiccupInput>({ hours: 0, neuro: false, postOp: false, reflux: false, ckd: false, drugs: false, chestPain: false, cancer: false, sleepAffected: false, elderly: false });
  const [days, setDays] = useState(0);
  const r = hiccupPlan({ ...x, hours: x.hours + days * 24 });
  return (
    <section className="cx-page cx-lab cx-hic">
      <header className="cx-page-h"><div><h1>Persistent Hiccups</h1><p>Hiccups for more than 48 hours need a cause looked for. Then PPI, baclofen, gabapentin or metoclopramide.</p></div></header>
      <div className="cx-c23-row"><NumField label="Days" value={days} set={setDays} placeholder="3" data="hic-days" max={3650} /><NumField label="Plus hours" value={x.hours} set={(n) => setX({ ...x, hours: n })} placeholder="0" data="hic-hours" max={23} /></div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`hic-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="hic-out"><p className="cx-c50-score"><b data-t="hic-kind" data-kind={r.kind}>{r.kind === "acute" ? "Acute hiccups" : r.kind === "persistent" ? "Persistent hiccups (over 48 hours)" : "Intractable hiccups (over a month)"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> Steger et al. 2015 systematic review; Polito & Fellows 2017 (Am J Med); palliative care formulary.</p>
    </section>
  );
}
