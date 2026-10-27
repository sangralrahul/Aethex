/**
 * Tired All the Time: red flags, sleep, mood, drugs and alcohol, first tests, post-viral fatigue
 * and ME/CFS.
 */
import { useState } from "react";
import { BatteryLow, TriangleAlert } from "lucide-react";
import { FATIGUE_FLAGS, fatiguePlan, type FatigueInput } from "@/lib/cadus/clinic48";

export default function FatigueView() {
  const [x, setX] = useState<FatigueInput>({ weeks: 0, flags: FATIGUE_FLAGS.map(() => false), snore: false, poorSleep: false, lowMood: false, drugs: false, heavyPeriods: false, alcohol: false, postViral: false, worseAfterEffort: false });
  const r = fatiguePlan(x);
  const cb = (k: Exclude<keyof FatigueInput, "weeks" | "flags">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-fat={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-fat">
      <header className="cx-page-h"><div><h1>Tired All the Time</h1><p>Fatigue is common and usually from sleep, mood or life load — but check for red flags and do a short set of tests.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Weeks of tiredness</span><input className="cx-input" inputMode="numeric" value={x.weeks || ""} onChange={(e) => setX({ ...x, weeks: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="8" data-fat="weeks" /></label></div>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks">{FATIGUE_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={x.flags[i]} onChange={(e) => setX({ ...x, flags: x.flags.map((y, j) => (j === i ? e.target.checked : y)) })} data-fat-f={i} /> {t}</label>)}</div>
      <h4>Clues</h4>
      <div className="cx-imaging-ticks">{cb("snore", "Snoring or daytime sleepiness")}{cb("poorSleep", "Poor sleep")}{cb("lowMood", "Low mood, anxiety, loss of interest")}{cb("drugs", "Sedating or new medicines")}{cb("alcohol", "Alcohol")}{cb("heavyPeriods", "Heavy periods")}{cb("postViral", "Started after a viral illness")}{cb("worseAfterEffort", "Much worse after effort, for a day or more")}</div>
      <div className={`cx-cmp-out ${r.urgent ? "cx-st-out" : "cx-ac-in"}`} data-fat="out" data-urgent={String(r.urgent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><BatteryLow size={13} /> NICE CKS tiredness, NICE NG206 (ME/CFS), BMJ 2020. <TriangleAlert size={13} /> In India, keep TB, HIV and anaemia high on the list.</p>
    </section>
  );
}
