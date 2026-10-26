/**
 * PCOS: diagnosis (adult Rotterdam criteria, stricter in adolescents), what to exclude, and a plan by
 * the woman's main goal.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { PCOS_EXCLUDE, pcosDx, pcosPlan, type PcosInput } from "@/lib/cadus/clinic42";

export default function PcosView() {
  const [x, setX] = useState<PcosInput>({ adolescent: false, irregular: false, hyperandrogen: false, pcom: false });
  const [goal, setGoal] = useState<"cycles" | "hirsutism" | "fertility" | "weight">("cycles");
  const d = pcosDx(x);
  const cb = (k: keyof PcosInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-pco={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-pcos">
      <header className="cx-page-h"><div><h1>PCOS</h1><p>Diagnose polycystic ovary syndrome by the 2023 international guideline, exclude mimics, and plan treatment around what matters most to her.</p></div></header>
      <div className="cx-imaging-ticks">{cb("adolescent", "Under 8 years since menarche")}{cb("irregular", "Irregular cycles or no ovulation")}{cb("hyperandrogen", "Hirsutism, acne or raised testosterone")}{!x.adolescent && cb("pcom", "Polycystic ovaries on ultrasound (20+ follicles or 10 ml) or high AMH")}</div>
      <div className={`cx-cmp-out ${d.meets ? "cx-ac-high" : "cx-ac-in"}`} data-pco="dx" data-meets={String(d.meets)}><p><b>{d.text}</b></p></div>
      <h4>Exclude first</h4><ul>{PCOS_EXCLUDE.map((s) => <li key={s}>{s}</li>)}</ul>
      <div className="cx-c23-row"><label className="cx-field"><span>Main goal</span><select className="cx-select" value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)} data-pco="goal"><option value="cycles">Regular periods</option><option value="hirsutism">Excess hair or acne</option><option value="fertility">Pregnancy</option><option value="weight">Weight and metabolic health</option></select></label></div>
      <ol className="cx-c23-steps" data-pco="plan">{pcosPlan(goal).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Venus size={13} /> International evidence-based PCOS guideline 2023, FOGSI. <TriangleAlert size={13} /> Fewer than 4 periods a year for a long time raises endometrial cancer risk: give endometrial protection.</p>
    </section>
  );
}
