/**
 * Hoarseness: the 3-week rule, laryngoscopy, red flags for laryngeal and lung cancer, nerve palsy,
 * voice overuse, inhalers and reflux.
 */
import { useState } from "react";
import { Mic, TriangleAlert } from "lucide-react";
import { hoarsePlan, type HoarseInput } from "@/lib/cadus/clinic48";

export default function HoarsenessView() {
  const [x, setX] = useState<HoarseInput>({ weeks: 0, smoker: false, age: 0, stridor: false, dysphagia: false, neckLump: false, haemoptysis: false, surgery: false, voiceUse: false, inhaler: false, reflux: false });
  const r = hoarsePlan(x);
  const n = (k: "weeks" | "age", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder={ph} data-hrs={k} /></label>;
  const cb = (k: Exclude<keyof HoarseInput, "weeks" | "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hrs={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-hrs">
      <header className="cx-page-h"><div><h1>Hoarseness</h1><p>A hoarse voice lasting 3 weeks needs the vocal cords looked at — sooner in smokers and anyone 45 or over.</p></div></header>
      <div className="cx-c23-row">{n("weeks", "Weeks of hoarseness", "4")}{n("age", "Age", "50")}</div>
      <div className="cx-imaging-ticks">{cb("stridor", "Noisy breathing or breathlessness")}{cb("smoker", "Smoker or heavy alcohol")}{cb("dysphagia", "Swallowing difficulty or ear pain")}{cb("neckLump", "Neck lump")}{cb("haemoptysis", "Coughing blood")}{cb("surgery", "After neck or chest surgery")}{cb("voiceUse", "Heavy voice use")}{cb("inhaler", "Inhaled steroids")}{cb("reflux", "Heartburn, throat clearing")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-hrs="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Mic size={13} /> AAO-HNS dysphonia guideline 2018, NICE NG12. <TriangleAlert size={13} /> Don't start antibiotics or steroids for hoarseness before the cords are seen.</p>
    </section>
  );
}
