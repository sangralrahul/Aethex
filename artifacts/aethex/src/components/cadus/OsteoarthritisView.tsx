/**
 * Knee & Hip Osteoarthritis: clinical diagnosis without X-ray, and NICE 2022 / OARSI care from
 * exercise to joint replacement referral.
 */
import { useState } from "react";
import { Bone, TriangleAlert } from "lucide-react";
import { oaDx, oaPlan } from "@/lib/cadus/clinic44";

export default function OsteoarthritisView() {
  const [joint, setJoint] = useState<"knee" | "hip">("knee");
  const [v, setV] = useState({ age: "", stiff: "", bmi: "" });
  const [f, setF] = useState({ activity: true, nsaidRisk: false, flare: false, severe: false });
  const d = oaDx(Number(v.age) || 0, f.activity, Number(v.stiff) || 0);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder={ph} data-oa={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-oa={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-oa">
      <header className="cx-page-h"><div><h1>Knee &amp; Hip Osteoarthritis</h1><p>Diagnose clinically, then build care around exercise and weight, with medicines and injections as add-ons and timely referral for joint replacement.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Joint</span><select className="cx-select" value={joint} onChange={(e) => setJoint(e.target.value as typeof joint)} data-oa="joint"><option value="knee">Knee</option><option value="hip">Hip</option></select></label>
        {n("age", "Age", "60")}{n("stiff", "Morning stiffness (minutes)", "15")}{n("bmi", "BMI", "28")}
      </div>
      <div className="cx-imaging-ticks">{cb("activity", "Pain with activity")}{cb("nsaidRisk", "NSAID risk (kidney, heart, GI bleed, anticoagulant)")}{cb("flare", "Current flare")}{cb("severe", "Substantial impact on quality of life despite treatment")}</div>
      <div className={`cx-cmp-out ${d.clinical ? "cx-ac-in" : "cx-ac-high"}`} data-oa="dx" data-clinical={String(d.clinical)}><p><b>{d.text}</b></p></div>
      <ol className="cx-c23-steps" data-oa="plan">{oaPlan(joint, Number(v.bmi) || 0, f.nsaidRisk, f.flare, f.severe).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Bone size={13} /> NICE NG226 (2022), OARSI 2019, ACR 2019. <TriangleAlert size={13} /> Morning stiffness over 30 minutes or small-joint swelling: think inflammatory arthritis.</p>
    </section>
  );
}
