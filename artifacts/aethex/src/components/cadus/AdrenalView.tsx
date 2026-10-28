/** Cushing's syndrome screening and adrenal incidentaloma work-up. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { adrenalPlan, CUSHING_FEATURES, type AdrenalInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

export default function AdrenalView() {
  const [x, setX] = useState<AdrenalInput>({ mode: "cushing", steroids: false, features: [], dstCortisol: 0, dstUnit: "nmol/L", sizeCm: 0, hu: 0, hypertension: false, hypoK: false, growing: false, bilateral: false, age: 0, cancerHistory: false });
  const [huSet, setHuSet] = useState(false);
  const r = adrenalPlan({ ...x, hu: huSet ? x.hu : 999 });
  return (
    <section className="cx-page cx-lab cx-adr">
      <header className="cx-page-h"><div><h1>Cushing's & Adrenal Incidentaloma</h1><p>Who to screen for Cushing's and how, and what to do with a lump found on an adrenal gland by chance.</p></div></header>
      <div className="cx-seg" role="tablist">{([["cushing", "Cushing's screening"], ["incidentaloma", "Adrenal incidentaloma"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={x.mode === k} className={x.mode === k ? "on" : ""} onClick={() => setX({ ...x, mode: k })} data-t={`adr-${k}`}>{l}</button>)}</div>
      {x.mode === "cushing" ? (
        <>
          <div className="cx-imaging-ticks">{CUSHING_FEATURES.map((f, i) => <Tick key={f} on={x.features.includes(f)} set={(v) => setX({ ...x, features: v ? [...x.features, f] : x.features.filter((y) => y !== f) })} label={f} data={`adr-f${i}`} />)}<Tick on={x.steroids} set={(v) => setX({ ...x, steroids: v })} label="Takes any steroid (any route) or unlabelled herbal powders" data="adr-steroids" /></div>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <NumField label="Size (cm)" value={x.sizeCm} set={(n) => setX({ ...x, sizeCm: n })} placeholder="2.5" data="adr-size" decimals max={30} />
            <label className="cx-field"><span>Unenhanced CT (HU)</span><input className="cx-input" inputMode="numeric" value={huSet ? String(x.hu) : ""} placeholder="8" onChange={(e) => { const v = e.target.value.replace(/[^\d-]/g, "").slice(0, 5); setHuSet(v !== "" && v !== "-"); setX({ ...x, hu: Number(v) || 0 }); }} data-t="adr-hu" /></label>
            <NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="55" data="adr-age" max={110} />
          </div>
          <div className="cx-imaging-ticks"><Tick on={x.hypertension} set={(v) => setX({ ...x, hypertension: v })} label="Hypertension" data="adr-htn" /><Tick on={x.hypoK} set={(v) => setX({ ...x, hypoK: v })} label="Low potassium" data="adr-hypok" /><Tick on={x.growing} set={(v) => setX({ ...x, growing: v })} label="Growing on repeat imaging" data="adr-growing" /><Tick on={x.bilateral} set={(v) => setX({ ...x, bilateral: v })} label="Both adrenals" data="adr-bilateral" /><Tick on={x.cancerHistory} set={(v) => setX({ ...x, cancerHistory: v })} label="History of cancer" data="adr-cancer" /></div>
        </>
      )}
      <div className="cx-c23-row">
        <NumField label="1 mg DST cortisol (if done)" value={x.dstCortisol} set={(n) => setX({ ...x, dstCortisol: n })} placeholder={x.dstUnit === "nmol/L" ? "40" : "1.5"} data="adr-dst" decimals max={5000} />
        <label className="cx-field"><span>Unit</span><select className="cx-select" value={x.dstUnit} onChange={(e) => setX({ ...x, dstUnit: e.target.value as AdrenalInput["dstUnit"] })} data-t="adr-unit"><option value="nmol/L">nmol/L</option><option value="ug/dL">µg/dL</option></select></label>
      </div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="adr-out"><p className="cx-c50-score"><b data-t="adr-benign" data-benign={r.benign ? "yes" : "no"}>{x.mode === "incidentaloma" ? (r.benign ? "Benign adenoma features" : "Needs further assessment") : "Cushing's screening"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> Endocrine Society 2008 Cushing's diagnosis; ESE/ENSAT 2023 adrenal incidentaloma guideline.</p>
    </section>
  );
}
