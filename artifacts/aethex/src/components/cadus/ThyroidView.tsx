/**
 * Thyroid Dose Helper: the levothyroxine starting dose (full replacement, or low and slow), the
 * change from the latest TSH, targets in pregnancy and older age, and how to take it.
 */
import { useState } from "react";
import { Pill, TriangleAlert } from "lucide-react";
import { thyroidPlan } from "@/lib/cadus/clinic25";

export default function ThyroidView() {
  const [mode, setMode] = useState<"start" | "adjust">("start");
  const [f, setF] = useState({ weight: "", age: "", tsh: "", dose: "" });
  const [cardiac, setCardiac] = useState(false);
  const [preg, setPreg] = useState(false);
  const [tri, setTri] = useState<1 | 2 | 3>(1);
  const num = (v: string) => (v ? Number(v) : undefined);
  const p = thyroidPlan({ weightKg: num(f.weight), age: num(f.age), cardiac, tsh: num(f.tsh), currentDose: mode === "adjust" ? num(f.dose) : undefined, pregnant: preg, trimester: tri });
  const field = (k: keyof typeof f, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-thy={k} /></label>;

  return (
    <section className="cx-page cx-lab cx-thy">
      <header className="cx-page-h"><div><h1>Thyroid Dose Helper</h1><p>Levothyroxine for hypothyroidism: the starting dose, the change from the latest TSH, targets in pregnancy and older age, and how to take it.</p></div></header>
      <div className="cx-seg" role="tablist">{([["start", "Starting"], ["adjust", "Adjusting by TSH"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={mode === v} className={mode === v ? "on" : ""} onClick={() => setMode(v)} data-thy-mode={v}>{l}</button>)}</div>
      <div className="cx-c23-row">
        {field("weight", "Weight (kg)", "60")}{field("age", "Age", "45")}{field("tsh", "TSH (mIU/L)", "8.2")}{mode === "adjust" && field("dose", "Current dose (µg)", "50")}
      </div>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={cardiac} onChange={(e) => setCardiac(e.target.checked)} data-thy="cardiac" /> Heart disease</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={preg} onChange={(e) => setPreg(e.target.checked)} data-thy="preg" /> Pregnant</label>
        {preg && <div className="cx-seg" role="radiogroup" aria-label="Trimester">{([1, 2, 3] as const).map((t) => <button key={t} role="radio" aria-checked={tri === t} className={tri === t ? "on" : ""} onClick={() => setTri(t)}>Trimester {t}</button>)}</div>}
      </div>
      <div className="cx-cmp-out" data-thy="out">
        <h3 className="cx-lab-h3" data-thy="result">{p.change ?? p.start}</h3>
        <p><b>Target:</b> {p.target}</p>
        <p><b>Recheck:</b> {p.recheck}</p>
        <ul>{p.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </div>
      <p className="cx-rs-foot"><Pill size={13} /> From ATA and Endocrine Society guidance. <TriangleAlert size={13} /> Not for thyroid cancer suppression, central hypothyroidism (dose by free T4) or neonates.</p>
    </section>
  );
}
