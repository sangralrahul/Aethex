/**
 * Halitosis: oral causes first (tongue, gums, dry mouth), ENT and systemic clues, a child with a
 * nasal foreign body, and pseudo-halitosis.
 */
import { useState } from "react";
import { Smile, TriangleAlert } from "lucide-react";
import { halitosisPlan, type HalitosisInput } from "@/lib/cadus/clinic49";

export default function HalitosisView() {
  const [x, setX] = useState<HalitosisInput>({ tongue: false, gums: false, dryMouth: false, dentures: false, tonsilStones: false, sinus: false, reflux: false, smoker: false, diabetes: false, kidney: false, liver: false, child: false, unilateralNasal: false, othersNotice: true });
  const cb = (k: keyof HalitosisInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hal={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-hal">
      <header className="cx-page-h"><div><h1>Halitosis (Bad Breath)</h1><p>Nearly always from the mouth. Fix tongue and gum hygiene first, then look for ENT, gut or systemic causes.</p></div></header>
      <div className="cx-imaging-ticks">{cb("othersNotice", "Others notice it")}{cb("tongue", "Coated tongue")}{cb("gums", "Bleeding or swollen gums")}{cb("dryMouth", "Dry mouth")}{cb("dentures", "Dentures")}{cb("tonsilStones", "Tonsil stones")}{cb("sinus", "Sinus or post-nasal drip")}{cb("reflux", "Heartburn")}{cb("smoker", "Tobacco or gutka")}{cb("diabetes", "Diabetes")}{cb("kidney", "Kidney disease")}{cb("liver", "Liver disease")}{cb("child", "Child")}{x.child && cb("unilateralNasal", "Foul discharge from one nostril")}</div>
      <ol className="cx-c23-steps" data-hal="plan">{halitosisPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Smile size={13} /> International Society for Breath Odor Research, Cochrane reviews. <TriangleAlert size={13} /> Halitosis with a non-healing mouth ulcer: see the 3-week rule in Mouth Ulcers.</p>
    </section>
  );
}
