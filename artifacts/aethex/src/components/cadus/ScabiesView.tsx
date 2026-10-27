/**
 * Scabies & Head Lice: permethrin and ivermectin doses by weight, contacts, laundry, crusted scabies,
 * and head lice options.
 */
import { useState } from "react";
import { Bug, TriangleAlert } from "lucide-react";
import { liceSteps, scabiesPlan } from "@/lib/cadus/clinic46";

export default function ScabiesView() {
  const [tab, setTab] = useState<"scabies" | "lice">("scabies");
  const [v, setV] = useState({ kg: "", age: "" });
  const [f, setF] = useState({ pregnant: false, crusted: false });
  const [ageUnit, setAgeUnit] = useState<"y" | "m">("y");
  const kg = Number(v.kg) || 0;
  const ageMonths = (Number(v.age) || 0) * (ageUnit === "y" ? 12 : 1);
  return (
    <section className="cx-page cx-lab cx-scb">
      <header className="cx-page-h"><div><h1>Scabies &amp; Head Lice</h1><p>Treat the patient and everyone they live with on the same day, and repeat after a week.</p></div></header>
      <div className="cx-seg" role="tablist">{([["scabies", "Scabies"], ["lice", "Head lice"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-scb-tab={k}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={v.kg} onChange={(e) => setV({ ...v, kg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="60" data-scb="kg" /></label>
        {tab === "scabies" && <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={v.age} onChange={(e) => setV({ ...v, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="30" data-scb="age" /></label>}
        {tab === "scabies" && <label className="cx-field"><span>Age in</span><select className="cx-select" value={ageUnit} onChange={(e) => setAgeUnit(e.target.value as "y" | "m")} data-scb="unit"><option value="y">Years</option><option value="m">Months</option></select></label>}
      </div>
      {tab === "scabies" ? (
        <>
          <div className="cx-imaging-ticks">
            <label className="cx-pa-mine"><input type="checkbox" checked={f.pregnant} onChange={(e) => setF({ ...f, pregnant: e.target.checked })} data-scb="pregnant" /> Pregnant or breastfeeding</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={f.crusted} onChange={(e) => setF({ ...f, crusted: e.target.checked })} data-scb="crusted" /> Thick crusts (crusted scabies)</label>
          </div>
          <ol className={`cx-c23-steps ${f.crusted ? "cx-st-out" : ""}`} data-scb="plan">{scabiesPlan({ kg, ageMonths, pregnant: f.pregnant, crusted: f.crusted }).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      ) : (
        <ol className="cx-c23-steps" data-scb="lice">{liceSteps(kg).map((s) => <li key={s}>{s}</li>)}</ol>
      )}
      <p className="cx-rs-foot"><Bug size={13} /> WHO, IADVL, CDC scabies guidance; NICE CKS head lice. <TriangleAlert size={13} /> Night-time itch in several family members is scabies until proved otherwise.</p>
    </section>
  );
}
