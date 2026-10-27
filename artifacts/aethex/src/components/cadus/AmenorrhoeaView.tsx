/**
 * Amenorrhoea: primary vs secondary, the first-line tests, and what each result points to.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { amenCause, amenType, type AmenLabs } from "@/lib/cadus/clinic45";

export default function AmenorrhoeaView() {
  const [v, setV] = useState({ age: "", months: "", fsh: "" });
  const [menarche, setMenarche] = useState(true);
  const [breast, setBreast] = useState(true);
  const [regular, setRegular] = useState(true);
  const [l, setL] = useState<Omit<AmenLabs, "fsh">>({ pregnant: false, prolactinHigh: false, tshHigh: false, estradiolLow: false, hyperandrogen: false, priorDandC: false, uterusAbsent: false, weightLoss: false });
  const n = (k: keyof typeof v, lab: string, ph: string) => <label className="cx-field"><span>{lab}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder={ph} data-amn={k} /></label>;
  const cb = (k: keyof typeof l, lab: string) => <label className="cx-pa-mine"><input type="checkbox" checked={l[k]} onChange={(e) => setL({ ...l, [k]: e.target.checked })} data-amn={k} /> {lab}</label>;
  return (
    <section className="cx-page cx-lab cx-amen">
      <header className="cx-page-h"><div><h1>Amenorrhoea</h1><p>Absent periods: pregnancy test first, then TSH, prolactin, FSH, LH and oestradiol point to the cause.</p></div></header>
      <div className="cx-c23-row">{n("age", "Age", "24")}{menarche && n("months", "Months without a period", "4")}
        <label className="cx-pa-mine"><input type="checkbox" checked={menarche} onChange={(e) => setMenarche(e.target.checked)} data-amn="menarche" /> Has had periods before</label>
        {!menarche && <label className="cx-pa-mine"><input type="checkbox" checked={breast} onChange={(e) => setBreast(e.target.checked)} data-amn="breast" /> Breast development</label>}
        {menarche && <label className="cx-pa-mine"><input type="checkbox" checked={regular} onChange={(e) => setRegular(e.target.checked)} data-amn="regular" /> Cycles were regular</label>}
      </div>
      <p className="cx-set-hint" data-amn="type"><b>{amenType(Number(v.age) || 0, menarche, breast, Number(v.months) || 0, regular)}</b></p>
      <h4>Results</h4>
      <div className="cx-c23-row">{n("fsh", "FSH (IU/L)", "6")}</div>
      <div className="cx-imaging-ticks">{cb("pregnant", "Pregnancy test positive")}{cb("tshHigh", "TSH raised")}{cb("prolactinHigh", "Prolactin raised")}{cb("estradiolLow", "Oestradiol low")}{cb("hyperandrogen", "Hirsutism, acne or raised testosterone")}{cb("weightLoss", "Weight loss, heavy exercise or stress")}{cb("priorDandC", "Previous D&C or uterine infection")}{cb("uterusAbsent", "Uterus absent on scan")}</div>
      <ol className="cx-c23-steps" data-amn="cause">{amenCause({ ...l, fsh: Number(v.fsh) || 0 }, Number(v.age) || 0).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Venus size={13} /> ASRM practice committee, ESHRE POI guideline 2024, RCOG. <TriangleAlert size={13} /> Headache or visual field loss with amenorrhoea: urgent pituitary imaging.</p>
    </section>
  );
}
