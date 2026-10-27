/**
 * DMARD Monitoring: starting doses, monitoring schedules and stop thresholds for methotrexate,
 * hydroxychloroquine, sulfasalazine and leflunomide.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { DMARDS, dmardFlags, hcqMax } from "@/lib/cadus/clinic43";

export default function DmardView() {
  const [id, setId] = useState("mtx");
  const [v, setV] = useState({ wbc: "", neut: "", plt: "", alt: "", mcv: "", creatRise: "", albumin: "", kg: "" });
  const d = DMARDS.find((x) => x.id === id)!;
  const flags = dmardFlags({ wbc: Number(v.wbc) || 0, neut: Number(v.neut) || 0, plt: Number(v.plt) || 0, alt: Number(v.alt) || 0, mcv: Number(v.mcv) || 0, creatRise: Number(v.creatRise) || 0, albumin: Number(v.albumin) || 0 });
  const anyLab = Object.entries(v).some(([k, x]) => k !== "kg" && x);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-dmd={k} /></label>;
  return (
    <section className="cx-page cx-lab cx-dmard">
      <header className="cx-page-h"><div><h1>DMARD Monitoring</h1><p>Start doses, which blood tests and how often, and the results that mean you should pause the drug and seek advice.</p></div></header>
      <div className="cx-seg" role="tablist">{DMARDS.map((x) => <button key={x.id} role="tab" aria-selected={id === x.id} className={id === x.id ? "on" : ""} onClick={() => setId(x.id)} data-dmd-tab={x.id}>{x.name}</button>)}</div>
      <div className="cx-cmp-out" data-dmd="info"><p><b>Dose:</b> {d.start}</p><p><b>Monitoring:</b> {d.monitor}</p><p>{d.notes}</p></div>
      {id === "hcq" ? (
        <>
          <div className="cx-c23-row">{n("kg", "Actual body weight (kg)", "60")}</div>
          {Number(v.kg) > 0 && <p className="cx-set-hint" data-dmd="hcq"><b>Maximum about {hcqMax(Number(v.kg))} mg a day (5 mg/kg, max 400 mg); alternate 200 and 400 mg to reach an average if needed.</b></p>}
        </>
      ) : (
        <>
          <h4>Latest results</h4>
          <div className="cx-c23-row">{n("wbc", "White cells (×10⁹/L)", "6.5")}{n("neut", "Neutrophils", "4")}{n("plt", "Platelets", "250")}</div>
          <div className="cx-c23-row">{n("alt", "ALT/AST (U/L)", "30")}{n("mcv", "MCV (fL)", "90")}{n("creatRise", "Creatinine rise in 12 months (%)", "0")}{n("albumin", "Albumin (g/dL)", "4")}</div>
          {anyLab && <div className={`cx-cmp-out ${flags.length ? "cx-st-out" : "cx-ac-in"}`} data-dmd="out" data-flags={flags.length}>{flags.length ? <><h3 className="cx-lab-h3">Withhold and discuss with the rheumatology team</h3><ul>{flags.map((s) => <li key={s}>{s}</li>)}</ul></> : <p>No stop thresholds crossed.</p>}</div>}
        </>
      )}
      <p className="cx-set-hint">Also stop and review if: new rash or mouth ulcers, sore throat or bruising, unexplained breathlessness or dry cough (methotrexate pneumonitis), or pregnancy.</p>
      <p className="cx-rs-foot"><FlaskConical size={13} /> BSR/BHPR DMARD guideline 2017, ACR 2021, RCOphth hydroxychloroquine screening 2020. <TriangleAlert size={13} /> Local rheumatology protocols take priority.</p>
    </section>
  );
}
