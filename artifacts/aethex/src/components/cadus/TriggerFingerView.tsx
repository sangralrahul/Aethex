/** Trigger finger and De Quervain's tenosynovitis: grade, splint, injection, surgery. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { handPlan, TRIGGER_GRADES, type HandInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

export default function TriggerFingerView() {
  const [x, setX] = useState<HandInput>({ condition: "trigger", grade: 2, diabetes: false, injections: 0, months: 0, postpartum: false, pregnant: false, multiple: false });
  const r = handPlan(x);
  return (
    <section className="cx-page cx-lab cx-hnd">
      <header className="cx-page-h"><div><h1>Trigger Finger & De Quervain's</h1><p>Two common tendon problems of the hand: splint, steroid injection, and when to refer for release.</p></div></header>
      <div className="cx-seg" role="tablist">{([["trigger", "Trigger finger"], ["dequervain", "De Quervain's"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={x.condition === k} className={x.condition === k ? "on" : ""} onClick={() => setX({ ...x, condition: k })} data-t={`hnd-${k}`}>{l}</button>)}</div>
      {x.condition === "trigger" && <div className="cx-c50-grades" role="radiogroup" aria-label="Grade">{TRIGGER_GRADES.map(([g, l]) => <label key={g} className={`cx-pa-mine ${x.grade === g ? "on" : ""}`}><input type="radio" name="hnd-grade" checked={x.grade === g} onChange={() => setX({ ...x, grade: g as HandInput["grade"] })} data-t={`hnd-g${g}`} /> <b>Grade {g}</b> {l}</label>)}</div>}
      <div className="cx-c23-row"><NumField label="Steroid injections so far" value={x.injections} set={(n) => setX({ ...x, injections: n })} placeholder="0" data="hnd-inj" max={9} /><NumField label="Months of symptoms" value={x.months} set={(n) => setX({ ...x, months: n })} placeholder="2" data="hnd-months" max={240} /></div>
      <div className="cx-imaging-ticks">
        <Tick on={x.diabetes} set={(v) => setX({ ...x, diabetes: v })} label="Diabetes" data="hnd-diabetes" />
        {x.condition === "trigger" ? <Tick on={x.multiple} set={(v) => setX({ ...x, multiple: v })} label="Several fingers" data="hnd-multiple" /> : <><Tick on={x.postpartum} set={(v) => setX({ ...x, postpartum: v })} label="After childbirth" data="hnd-postpartum" /><Tick on={x.pregnant} set={(v) => setX({ ...x, pregnant: v })} label="Pregnant" data="hnd-pregnant" /></>}
      </div>
      <PlanOut urgency="routine" steps={r.steps} data="hnd-out"><p className="cx-c50-score"><b data-t="hnd-surgery" data-surgery={r.surgery ? "yes" : "no"}>{r.surgery ? "Refer for surgical release" : "Conservative care first"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> Green's trigger finger grading; BSSH patient guidance; Cochrane reviews of steroid injection.</p>
    </section>
  );
}
