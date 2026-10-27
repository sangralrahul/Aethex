/**
 * Dry Eye & Blepharitis: red flags that mean it is not just dry eye, lid hygiene, lubricants,
 * meibomian gland dysfunction and screen habits.
 */
import { useState } from "react";
import { Eye, TriangleAlert } from "lucide-react";
import { eyePlan, type EyeInput } from "@/lib/cadus/clinic49";

export default function DryEyeView() {
  const [x, setX] = useState<EyeInput>({ pain: false, photophobia: false, vision: false, oneEye: false, contactLens: false, dryMouth: false, lagophthalmos: false, blepharitis: false, mgd: false, rosacea: false, screen: false, drugs: false });
  const r = eyePlan(x);
  const cb = (k: keyof EyeInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-eye={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-eye">
      <header className="cx-page-h"><div><h1>Dry Eye &amp; Blepharitis</h1><p>Gritty, burning, tired eyes that are worse with screens: usually dry eye with blepharitis. First check that it is nothing more serious.</p></div></header>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks">{cb("pain", "Real pain (not just grittiness)")}{cb("photophobia", "Light sensitivity")}{cb("vision", "Blurred vision that doesn't clear on blinking")}{cb("oneEye", "One eye only")}{cb("contactLens", "Contact lens wearer")}</div>
      <h4>Clues</h4>
      <div className="cx-imaging-ticks">{cb("blepharitis", "Crusty, red lid margins")}{cb("mgd", "Oily, foamy tears, blocked lid glands")}{cb("rosacea", "Facial rosacea")}{cb("screen", "Long screen hours")}{cb("dryMouth", "Dry mouth or joint pains")}{cb("lagophthalmos", "Eye doesn't close fully")}{cb("drugs", "Antihistamines, isotretinoin…")}</div>
      <div className={`cx-cmp-out ${r.refer ? "cx-st-out" : "cx-ac-in"}`} data-eye="out" data-refer={String(r.refer)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Eye size={13} /> TFOS DEWS II 2017, NICE CKS blepharitis and dry eye. <TriangleAlert size={13} /> Never give steroid eye drops without slit-lamp examination.</p>
    </section>
  );
}
