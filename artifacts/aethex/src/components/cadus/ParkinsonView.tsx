/**
 * Parkinson's Disease Medicines: levodopa-equivalent daily dose (LEDD), a nil-by-mouth plan with a
 * rotigotine patch estimate, and drugs to avoid.
 */
import { useState } from "react";
import { Brain, TriangleAlert } from "lucide-react";
import { ledd, PD_AVOID, PD_NBM, rotigotineNbm, type PdMeds } from "@/lib/cadus/clinic44";

const FIELDS: [keyof PdMeds, string, string][] = [["levodopaIR", "Levodopa immediate release (mg/day)", "300"], ["levodopaCR", "Levodopa controlled release (mg/day)", "0"], ["pramipexole", "Pramipexole salt (mg/day)", "0"], ["ropinirole", "Ropinirole (mg/day)", "0"], ["rotigotine", "Rotigotine patch (mg/24 h)", "0"], ["rasagiline", "Rasagiline (mg/day)", "0"], ["selegiline", "Selegiline (mg/day)", "0"], ["amantadine", "Amantadine (mg/day)", "0"]];
export default function ParkinsonView() {
  const [m, setM] = useState<PdMeds>({ levodopaIR: 0, levodopaCR: 0, entacapone: false, opicapone: false, pramipexole: 0, ropinirole: 0, rotigotine: 0, rasagiline: 0, selegiline: 0, amantadine: 0 });
  const r = ledd(m);
  const rot = rotigotineNbm(m);
  return (
    <section className="cx-page cx-lab cx-parkinson">
      <header className="cx-page-h"><div><h1>Parkinson's Disease Medicines</h1><p>Add up the levodopa-equivalent daily dose, plan for nil by mouth so doses are never missed, and avoid drugs that worsen Parkinson's.</p></div></header>
      <div className="cx-nihss">{FIELDS.map(([k, l, ph]) => <label key={k} className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={(m[k] as number) || ""} onChange={(e) => setM({ ...m, [k]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 6)) || 0 })} placeholder={ph} data-pk={k} /></label>)}</div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={m.entacapone} onChange={(e) => setM({ ...m, entacapone: e.target.checked })} data-pk="entacapone" /> With entacapone</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={m.opicapone} onChange={(e) => setM({ ...m, opicapone: e.target.checked })} data-pk="opicapone" /> With opicapone</label>
      </div>
      <div className="cx-cmp-out cx-ac-in" data-pk="out" data-ledd={r.total}><h3 className="cx-lab-h3">LEDD {r.total} mg a day</h3>{r.parts.length > 0 && <ul>{r.parts.map(([l, v]) => <li key={l}>{l}: {v} mg</li>)}</ul>}</div>
      <h4>Nil by mouth</h4><ol className="cx-c23-steps">{PD_NBM.map((s) => <li key={s}>{s}</li>)}</ol>
      {rot !== null && <p className="cx-set-hint" data-pk="rot"><b>Rotigotine patch about {rot} mg/24 hours</b> to cover levodopa and dopamine agonists (LEDD ÷ 30, max 16 mg); use less if older, frail or confused.</p>}
      <h4>Avoid</h4>
      <table className="cx-c23-table" data-pk="avoid"><thead><tr><th>Drug</th><th>Instead</th></tr></thead><tbody>{PD_AVOID.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
      <p className="cx-rs-foot"><Brain size={13} /> Tomlinson et al. 2010 and Jost et al. 2023 (LEDD), OPTIMAL calculator approach, Parkinson's UK. <TriangleAlert size={13} /> Conversions are estimates; involve the Parkinson's team.</p>
    </section>
  );
}
