/**
 * Sleep Apnoea: STOP-BANG, Epworth sleepiness, AHI severity, and CPAP and driving advice.
 */
import { useState } from "react";
import { Moon, TriangleAlert } from "lucide-react";
import { ahiBand, epworth, stopBang, type StopBangInput } from "@/lib/cadus/clinic46";

export default function SleepApnoeaView() {
  const [x, setX] = useState<StopBangInput>({ snore: false, tired: false, observed: false, pressure: false, bmi: 0, age: 0, neckCm: 0, male: true });
  const [ess, setEss] = useState("");
  const [ahi, setAhi] = useState("");
  const r = stopBang(x);
  const cb = (k: "snore" | "tired" | "observed" | "pressure" | "male", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-osa={k} /> {l}</label>;
  const n = (k: "bmi" | "age" | "neckCm", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 5)) || 0 })} placeholder={ph} data-osa={k} /></label>;
  const e = ess ? epworth(Math.min(24, Number(ess) || 0)) : null;
  const a = ahi ? ahiBand(Number(ahi) || 0) : null;
  return (
    <section className="cx-page cx-lab cx-osa">
      <header className="cx-page-h"><div><h1>Sleep Apnoea (STOP-BANG)</h1><p>Screen with STOP-BANG, measure sleepiness with the Epworth scale, and act on the sleep study (AHI).</p></div></header>
      <div className="cx-imaging-ticks">{cb("snore", "Snores loudly")}{cb("tired", "Tired or sleepy in the day")}{cb("observed", "Someone has seen breathing stop")}{cb("pressure", "High blood pressure")}{cb("male", "Male")}</div>
      <div className="cx-c23-row">{n("bmi", "BMI", "31")}{n("age", "Age", "52")}{n("neckCm", "Neck (cm)", "42")}</div>
      <div className={`cx-cmp-out ${r.level === "high" ? "cx-st-out" : r.level === "intermediate" ? "cx-ac-high" : "cx-ac-in"}`} data-osa="out" data-level={r.level} data-score={r.score}><p><b>{r.text}</b></p></div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Epworth score (0–24)</span><input className="cx-input" inputMode="numeric" value={ess} onChange={(ev) => setEss(ev.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="12" data-osa="ess" /></label>
        <label className="cx-field"><span>AHI from sleep study (events/hour)</span><input className="cx-input" inputMode="decimal" value={ahi} onChange={(ev) => setAhi(ev.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="22" data-osa="ahi" /></label>
      </div>
      {e && <p className="cx-set-hint" data-osa="ess-out" data-band={e.band}><b>{e.text}</b></p>}
      {a && <div className={`cx-cmp-out ${a.band === "severe" ? "cx-st-out" : a.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-osa="ahi-out" data-band={a.band}><p>{a.plan}</p></div>}
      <ul className="cx-c23-steps">
        <li>Sleep study: full polysomnography, or a home sleep apnoea test when the pre-test probability is high and there are no major heart or lung problems.</li>
        <li>Everyone: weight loss, no alcohol or sedatives in the evening, side sleeping, treat nasal blockage; check BP, glucose, lipids and look for AF.</li>
        <li>Driving: anyone sleepy at the wheel must not drive until treated; commercial drivers need urgent assessment.</li>
        <li>Before surgery: STOP-BANG 5 or more — tell the anaesthetist (difficult airway, opioid sensitivity); bring the CPAP machine.</li>
      </ul>
      <p className="cx-rs-foot"><Moon size={13} /> STOP-BANG (Chung 2016), AASM 2017 and 2019 guidelines, NICE NG202. <TriangleAlert size={13} /> Morning headaches, resistant hypertension or AF: think of OSA.</p>
    </section>
  );
}
