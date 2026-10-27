/**
 * Mastitis & Breast Abscess: keep breastfeeding, when to start antibiotics (and which), abscess
 * drainage, non-lactational mastitis, and when to think of cancer.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { mastitisPlan, type MastitisInput } from "@/lib/cadus/clinic47";

export default function MastitisView() {
  const [x, setX] = useState<MastitisInput>({ lactating: true, hours: 0, unwell: false, fluctuant: false, allergy: false, notSettling: false, smoker: false, mrsa: false });
  const r = mastitisPlan(x);
  const cb = (k: Exclude<keyof MastitisInput, "hours">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-mst={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-mst">
      <header className="cx-page-h"><div><h1>Mastitis &amp; Breast Abscess</h1><p>A painful, red, hot wedge of breast. In breastfeeding mothers, keep feeding; antibiotics if not settling in 12–24 hours or unwell.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Hours of symptoms</span><input className="cx-input" inputMode="numeric" value={x.hours || ""} onChange={(e) => setX({ ...x, hours: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="12" data-mst="hours" /></label></div>
      <div className="cx-imaging-ticks">{cb("lactating", "Breastfeeding")}{cb("unwell", "Fever, flu-like or unwell")}{cb("fluctuant", "Fluctuant or persistent lump")}{cb("allergy", "Penicillin allergy")}{cb("mrsa", "MRSA risk (recent hospital, known carrier)")}{cb("notSettling", "Not settling after a week of antibiotics")}{cb("smoker", "Smoker")}</div>
      <div className={`cx-cmp-out ${r.level === "refer" || r.level === "abscess" ? "cx-st-out" : r.level === "antibiotics" ? "cx-ac-high" : "cx-ac-in"}`} data-mst="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Venus size={13} /> Academy of Breastfeeding Medicine protocol 36 (2022), WHO, NICE CKS. <TriangleAlert size={13} /> Stopping feeds suddenly makes mastitis and abscess more likely.</p>
    </section>
  );
}
