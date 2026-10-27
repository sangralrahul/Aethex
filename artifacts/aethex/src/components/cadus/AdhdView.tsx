/**
 * ADHD in Children: DSM-5 symptom count and criteria, and medicine dosing and monitoring.
 */
import { useState } from "react";
import { Puzzle, TriangleAlert } from "lucide-react";
import { adhdDx, adhdMeds } from "@/lib/cadus/clinic44";

const INATT = ["Careless mistakes, misses details", "Hard to sustain attention", "Doesn't seem to listen", "Doesn't finish tasks or instructions", "Disorganised", "Avoids tasks needing mental effort", "Loses things", "Easily distracted", "Forgetful in daily activities"];
const HYPER = ["Fidgets or squirms", "Leaves seat when expected to sit", "Runs or climbs when inappropriate", "Can't play quietly", "Always on the go", "Talks excessively", "Blurts out answers", "Can't wait their turn", "Interrupts or intrudes"];
export default function AdhdView() {
  const [ia, setIa] = useState<boolean[]>(INATT.map(() => false));
  const [hy, setHy] = useState<boolean[]>(HYPER.map(() => false));
  const [v, setV] = useState({ age: "", kg: "" });
  const [f, setF] = useState({ before12: true, settings: true, impairment: true });
  const r = adhdDx(ia.filter(Boolean).length, hy.filter(Boolean).length, Number(v.age) || 0, f.before12, f.settings, f.impairment);
  const ticks = (list: string[], val: boolean[], set: (x: boolean[]) => void, key: string) => <div className="cx-imaging-ticks">{list.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={val[i]} onChange={(e) => set(val.map((y, j) => (j === i ? e.target.checked : y)))} data-adh={`${key}${i}`} /> {t}</label>)}</div>;
  return (
    <section className="cx-page cx-lab cx-adhd">
      <header className="cx-page-h"><div><h1>ADHD in Children</h1><p>Count DSM-5 symptoms (often, for 6 months or more, more than expected for age), check the other criteria, then plan treatment and monitoring.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="numeric" value={v.age} onChange={(e) => setV({ ...v, age: e.target.value.replace(/\D/g, "").slice(0, 2) })} data-adh="age" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={v.kg} onChange={(e) => setV({ ...v, kg: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-adh="kg" /></label>
      </div>
      <h4>Inattention ({ia.filter(Boolean).length}/9)</h4>{ticks(INATT, ia, setIa, "i")}
      <h4>Hyperactivity–impulsivity ({hy.filter(Boolean).length}/9)</h4>{ticks(HYPER, hy, setHy, "h")}
      <div className="cx-imaging-ticks">{([["before12", "Several symptoms before age 12"], ["settings", "In 2 or more settings (home, school)"], ["impairment", "Clearly impairs social, school or work functioning"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-adh={k} /> {l}</label>)}</div>
      <div className={`cx-cmp-out ${r.meets ? "cx-ac-high" : "cx-ac-in"}`} data-adh="out" data-meets={String(r.meets)}><p><b>{r.text}</b></p></div>
      {r.meets && <ol className="cx-c23-steps" data-adh="meds">{adhdMeds(Number(v.kg) || 0, Number(v.age) || 0).map((s) => <li key={s}>{s}</li>)}</ol>}
      <p className="cx-rs-foot"><Puzzle size={13} /> DSM-5-TR, NICE NG87, AAP 2019. <TriangleAlert size={13} /> Rule out hearing and vision problems, learning difficulties, sleep apnoea, anxiety and autism; diagnosis by a specialist.</p>
    </section>
  );
}
