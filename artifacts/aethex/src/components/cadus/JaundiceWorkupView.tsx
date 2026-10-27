/**
 * Jaundice Work-up: unconjugated vs hepatocellular vs cholestatic, ultrasound first, and the
 * emergencies (cholangitis, acute liver failure, pregnancy).
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { jaundicePlan, type JaundiceInput } from "@/lib/cadus/clinic49";

export default function JaundiceWorkupView() {
  const [v, setV] = useState({ total: "", direct: "", alt: "", alp: "", age: "" });
  const [f, setF] = useState({ fever: false, rucPain: false, painless: false, weightLoss: false, confusion: false, inrHigh: false, anaemia: false, alcohol: false, drugs: false, pregnant: false });
  const num = (k: keyof typeof v) => Number(v[k]) || 0;
  const r = jaundicePlan({ total: num("total"), direct: num("direct"), alt: num("alt"), alp: num("alp"), age: num("age"), ...f } as JaundiceInput);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-jdc={k} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-jdc={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-jdc">
      <header className="cx-page-h"><div><h1>Jaundice Work-up</h1><p>Split the bilirubin, look at the enzyme pattern, and get an ultrasound. Spot cholangitis and liver failure first.</p></div></header>
      <div className="cx-c23-row">{n("total", "Total bilirubin (mg/dL)", "6")}{n("direct", "Direct (mg/dL)", "4")}{n("alt", "ALT (U/L)", "900")}{n("alp", "ALP (U/L)", "150")}{n("age", "Age", "35")}</div>
      <div className="cx-imaging-ticks">{cb("fever", "Fever")}{cb("rucPain", "Right upper abdominal pain")}{cb("painless", "Painless, progressive")}{cb("weightLoss", "Weight loss")}{cb("confusion", "Confusion or drowsiness")}{cb("inrHigh", "INR raised or bleeding")}{cb("anaemia", "Anaemia, dark urine")}{cb("alcohol", "Alcohol")}{cb("drugs", "Anti-TB drugs or other medicines")}{cb("pregnant", "Pregnant")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-jdc="out" data-urgency={r.urgency} data-kind={r.kind}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><FlaskConical size={13} /> BSG abnormal liver tests 2018, INASL. <TriangleAlert size={13} /> Hepatitis E in pregnancy can cause acute liver failure: admit early.</p>
    </section>
  );
}
