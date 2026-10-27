/**
 * Tinnitus: pulsatile, one-sided and sudden hearing loss red flags, ototoxic drugs, wax, Ménière's,
 * and what actually helps.
 */
import { useState } from "react";
import { Ear, TriangleAlert } from "lucide-react";
import { tinnitusPlan, type TinnitusInput } from "@/lib/cadus/clinic48";

export default function TinnitusView() {
  const [x, setX] = useState<TinnitusInput>({ pulsatile: false, unilateral: false, suddenHearingLoss: false, vertigo: false, neuro: false, distress: false, wax: false, drugs: false, noise: false });
  const r = tinnitusPlan(x);
  const cb = (k: keyof TinnitusInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-tin={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-tin">
      <header className="cx-page-h"><div><h1>Tinnitus</h1><p>Ringing or buzzing in the ears is common. Pick out the few patterns that need urgent tests, then help the person live with it.</p></div></header>
      <div className="cx-imaging-ticks">{cb("pulsatile", "Pulsing in time with the heartbeat")}{cb("unilateral", "One ear only")}{cb("suddenHearingLoss", "Sudden hearing loss")}{cb("vertigo", "Episodes of vertigo")}{cb("neuro", "Facial weakness or other neurological signs")}{cb("distress", "Severe distress or thoughts of self-harm")}{cb("wax", "Wax on otoscopy")}{cb("drugs", "Ototoxic drugs")}{cb("noise", "Noise exposure")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-tin="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Ear size={13} /> NICE NG155 tinnitus (2020), AAO-HNS sudden hearing loss 2019. <TriangleAlert size={13} /> Sudden hearing loss is an emergency even if the ear looks normal.</p>
    </section>
  );
}
