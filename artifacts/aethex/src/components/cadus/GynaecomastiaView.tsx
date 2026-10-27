/**
 * Gynaecomastia: true vs fatty, pubertal reassurance, drugs and diseases, hormone tests, and red flags
 * for breast and testicular cancer.
 */
import { useState } from "react";
import { TriangleAlert, User } from "lucide-react";
import { gynaePlan, type GynaeInput } from "@/lib/cadus/clinic47";

export default function GynaecomastiaView() {
  const [x, setX] = useState<GynaeInput>({ age: 0, hardEccentric: false, testicularMass: false, drugs: false, liver: false, kidney: false, painfulMonths: 0, rapid: false });
  const r = gynaePlan(x);
  const n = (k: "age" | "painfulMonths", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder={ph} data-gyn={k} /></label>;
  const cb = (k: Exclude<keyof GynaeInput, "age" | "painfulMonths">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-gyn={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-gyn">
      <header className="cx-page-h"><div><h1>Gynaecomastia</h1><p>Breast tissue in boys and men: usually pubertal, drug-related or from liver or kidney disease. Rule out cancer when it is hard, one-sided or eccentric.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age", "15")}{n("painfulMonths", "Months since it started", "6")}</div>
      <div className="cx-imaging-ticks">{cb("hardEccentric", "Hard, eccentric or fixed lump, skin change")}{cb("testicularMass", "Testicular lump")}{cb("rapid", "Growing fast")}{cb("drugs", "Spironolactone, finasteride, steroids, antipsychotics…")}{cb("liver", "Liver disease or heavy alcohol")}{cb("kidney", "Kidney disease")}</div>
      <div className={`cx-cmp-out ${r.urgent ? "cx-st-out" : "cx-ac-in"}`} data-gyn="out" data-urgent={String(r.urgent)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><User size={13} /> Endocrine Society, European Academy of Andrology 2019. <TriangleAlert size={13} /> 1 in 100 breast cancers occur in men: examine every lump.</p>
    </section>
  );
}
