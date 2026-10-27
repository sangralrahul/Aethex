/**
 * Chronic Itch (Pruritus): rash vs no rash, systemic causes and tests, scabies, itch in pregnancy,
 * cholestatic and kidney itch, and the treatment ladder.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import { itchPlan, type ItchInput } from "@/lib/cadus/clinic48";

export default function ItchView() {
  const [x, setX] = useState<ItchInput>({ rash: false, elderlyDry: false, night: false, household: false, jaundice: false, kidney: false, pregnant: false, afterBath: false, nightSweats: false, drugs: false, localNeuro: false });
  const cb = (k: keyof ItchInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-itc={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-itc">
      <header className="cx-page-h"><div><h1>Chronic Itch (Pruritus)</h1><p>Itch for 6 weeks or more. First ask: is there a rash of its own, or only scratch marks? No rash means looking for a systemic cause.</p></div></header>
      <div className="cx-imaging-ticks">{cb("rash", "A primary rash")}{cb("night", "Worse at night")}{cb("household", "Others at home itching")}{cb("pregnant", "Pregnant")}{cb("jaundice", "Liver disease or jaundice")}{cb("kidney", "Kidney disease or dialysis")}{cb("afterBath", "Itch after a bath")}{cb("nightSweats", "Night sweats or weight loss")}{cb("drugs", "Opioids, chloroquine or new drugs")}{cb("localNeuro", "One small patch, no rash")}{cb("elderlyDry", "Older adult, dry skin")}</div>
      <ol className="cx-c23-steps" data-itc="plan">{itchPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Hand size={13} /> EADV/EDF chronic pruritus guideline 2019, BAD. <TriangleAlert size={13} /> Generalised itch without rash in an older adult: check bloods before blaming dry skin.</p>
    </section>
  );
}
