/**
 * Mouth Ulcers: the 3-week rule for oral cancer (tobacco and areca nut in India), aphthous ulcer
 * treatment, deficiency tests, herpes, and Behçet's.
 */
import { useState } from "react";
import { Smile, TriangleAlert } from "lucide-react";
import { mouthUlcerPlan, type MouthUlcerInput } from "@/lib/cadus/clinic47";

export default function MouthUlcerView() {
  const [x, setX] = useState<MouthUlcerInput>({ weeks: 0, single: false, tobacco: false, indurated: false, recurrent: false, genital: false, eye: false, gut: false, vesicles: false, child: false, kg: 0 });
  const r = mouthUlcerPlan(x);
  const n = (k: "weeks" | "kg", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} placeholder={ph} data-mul={k} /></label>;
  const cb = (k: Exclude<keyof MouthUlcerInput, "weeks" | "kg">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-mul={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-mul">
      <header className="cx-page-h"><div><h1>Mouth Ulcers</h1><p>Most are aphthous and heal in 1–2 weeks. A single ulcer that has not healed in 3 weeks needs a biopsy.</p></div></header>
      <div className="cx-c23-row">{n("weeks", "Weeks this ulcer has been present", "4")}{x.child && n("kg", "Weight (kg)", "12")}</div>
      <div className="cx-imaging-ticks">{cb("single", "A single ulcer")}{cb("indurated", "Hard, raised edge or fixed")}{cb("tobacco", "Tobacco, gutka, areca nut or alcohol")}{cb("recurrent", "Keeps coming back")}{cb("vesicles", "Blisters first, fever, sore gums")}{cb("child", "Child")}{cb("genital", "Genital ulcers")}{cb("eye", "Red, painful eyes")}{cb("gut", "Diarrhoea, abdominal pain, weight loss")}</div>
      <div className={`cx-cmp-out ${r.urgent ? "cx-st-out" : "cx-ac-in"}`} data-mul="out" data-urgent={String(r.urgent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Smile size={13} /> NICE NG12 and CKS aphthous ulcer, National Oral Health Programme. <TriangleAlert size={13} /> India has one of the highest oral cancer rates: look in every mouth.</p>
    </section>
  );
}
