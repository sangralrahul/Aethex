/** Hyperprolactinaemia: interpret the level, find the cause, when to scan, cabergoline. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { prlPlan, type PrlInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

export default function ProlactinView() {
  const [x, setX] = useState<PrlInput>({ value: 0, unit: "ng/mL", sex: "female", drugs: false, pregnant: false, hypothyroid: false, ckd: false, symptoms: false, headacheVisual: false, largeMass: false });
  const r = prlPlan(x);
  const b = (k: "drugs" | "pregnant" | "hypothyroid" | "ckd" | "symptoms" | "headacheVisual" | "largeMass", l: string) => <Tick on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`prl-${k}`} />;
  return (
    <section className="cx-page cx-lab cx-prl">
      <header className="cx-page-h"><div><h1>Hyperprolactinaemia</h1><p>How high is it, what else raises prolactin, macroprolactin, when to image the pituitary, and starting cabergoline.</p></div></header>
      <div className="cx-c23-row">
        <NumField label="Prolactin" value={x.value} set={(n) => setX({ ...x, value: n })} placeholder={x.unit === "ng/mL" ? "45" : "950"} data="prl-value" decimals max={100000} />
        <label className="cx-field"><span>Unit</span><select className="cx-select" value={x.unit} onChange={(e) => setX({ ...x, unit: e.target.value as PrlInput["unit"] })} data-t="prl-unit"><option value="ng/mL">ng/mL (µg/L)</option><option value="mIU/L">mIU/L</option></select></label>
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={x.sex} onChange={(e) => setX({ ...x, sex: e.target.value as PrlInput["sex"] })} data-t="prl-sex"><option value="female">Female</option><option value="male">Male</option></select></label>
      </div>
      <div className="cx-imaging-ticks">{b("symptoms", "Symptoms: periods stopped, galactorrhoea, infertility, low libido, ED")}{b("drugs", "On antipsychotics, metoclopramide, domperidone or similar")}{b("pregnant", "Pregnant or breastfeeding")}{b("hypothyroid", "Hypothyroid (high TSH)")}{b("ckd", "Kidney failure")}{b("headacheVisual", "Headache or visual field loss")}{b("largeMass", "Pituitary mass over 1 cm on MRI")}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="prl-out"><p className="cx-c50-score" data-t="prl-band" data-band={r.band}><b>{r.band === "none" ? "—" : r.band}</b>{r.ng ? ` · ${r.ng} ng/mL` : ""}</p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> Endocrine Society 2011 hyperprolactinaemia guideline; Pituitary Society 2023 prolactinoma consensus. 1 ng/mL ≈ 21.2 mIU/L (assays vary).</p>
    </section>
  );
}
