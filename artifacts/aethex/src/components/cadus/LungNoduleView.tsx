/**
 * Lung Nodule (Fleischner 2017): follow-up for incidental solid and subsolid pulmonary nodules by
 * size, number and risk.
 */
import { useState } from "react";
import { Scan, TriangleAlert } from "lucide-react";
import { fleischner, NODULE_NOTES, NODULE_RISK, type NoduleInput } from "@/lib/cadus/clinic44";

export default function LungNoduleView() {
  const [x, setX] = useState<NoduleInput>({ type: "solid", multiple: false, sizeMm: 0, highRisk: false, solidMm: 0 });
  const [risk, setRisk] = useState<boolean[]>(NODULE_RISK.map(() => false));
  const r = fleischner({ ...x, highRisk: risk.some(Boolean) });
  return (
    <section className="cx-page cx-lab cx-nodule">
      <header className="cx-page-h"><div><h1>Lung Nodule (Fleischner)</h1><p>Follow-up for a nodule found by chance on CT, by type, size, number and the patient's risk.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Type</span><select className="cx-select" value={x.type} onChange={(e) => setX({ ...x, type: e.target.value as NoduleInput["type"] })} data-ln="type"><option value="solid">Solid</option><option value="ground">Pure ground-glass</option><option value="partsolid">Part-solid</option></select></label>
        <label className="cx-field"><span>Average size (mm)</span><input className="cx-input" inputMode="decimal" value={x.sizeMm || ""} onChange={(e) => setX({ ...x, sizeMm: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} placeholder="7" data-ln="size" /></label>
        {x.type === "partsolid" && <label className="cx-field"><span>Solid part (mm)</span><input className="cx-input" inputMode="decimal" value={x.solidMm || ""} onChange={(e) => setX({ ...x, solidMm: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} data-ln="solid" /></label>}
        <label className="cx-pa-mine"><input type="checkbox" checked={x.multiple} onChange={(e) => setX({ ...x, multiple: e.target.checked })} data-ln="multiple" /> Multiple nodules</label>
      </div>
      {x.type === "solid" && <><h4>Risk factors (any makes it high risk)</h4><div className="cx-imaging-ticks">{NODULE_RISK.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={risk[i]} onChange={(e) => setRisk(risk.map((y, j) => (j === i ? e.target.checked : y)))} data-ln-r={i} /> {t}</label>)}</div></>}
      <div className={`cx-cmp-out ${r.level === "workup" ? "cx-st-out" : r.level === "follow" ? "cx-ac-high" : "cx-ac-in"}`} data-ln="out" data-level={r.level}><p><b>{r.action}</b></p></div>
      <ul>{NODULE_NOTES.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Scan size={13} /> Fleischner Society guideline 2017 (MacMahon et al., Radiology). <TriangleAlert size={13} /> Haemoptysis, weight loss or a growing nodule: refer to a lung cancer clinic.</p>
    </section>
  );
}
