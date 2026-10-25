/**
 * Menopause & HRT: diagnosis by age, contraindications, the HRT regimen (route, cyclical or
 * continuous progestogen, vaginal oestrogen) or non-hormonal options, risks and contraception.
 */
import { useState } from "react";
import { Flower2, Printer, TriangleAlert } from "lucide-react";
import { HRT_CONTRA, hrtPlan } from "@/lib/cadus/clinic32";

export default function HrtView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [age, setAge] = useState("");
  const [lmp, setLmp] = useState("");
  const [uterus, setUterus] = useState(true);
  const [contra, setContra] = useState<string[]>([]);
  const [x, setX] = useState({ vteRisk: false, obese: false, migraineAura: false, onlyVaginal: false });
  const p = hrtPlan({ age: Number(age) || 50, monthsSinceLmp: Number(lmp) || 0, uterus, contraindicated: contra.length > 0, ...x });
  const md = () => ["# Menopause plan", "", ...p.regimen.map((r) => `- ${r}`), "", ...p.notes.map((n) => `- ${n}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-hrt">
      <header className="cx-page-h"><div><h1>Menopause &amp; HRT</h1><p>Diagnosis by age, who should not take HRT, the right regimen (route, cyclical or continuous, vaginal oestrogen) or non-hormonal options, and the risks to explain.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="50" data-hr="age" /></label>
        <label className="cx-field"><span>Months since last period</span><input className="cx-input" inputMode="numeric" value={lmp} onChange={(e) => setLmp(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="6" data-hr="lmp" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={uterus} onChange={(e) => setUterus(e.target.checked)} data-hr="uterus" /> Has a uterus</label>
        {([["vteRisk", "Past clot or high clot risk"], ["obese", "BMI over 30"], ["migraineAura", "Migraine with aura"], ["onlyVaginal", "Only vaginal symptoms"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hr={k} /> {l}</label>)}
      </div>
      <h4>Contraindications</h4>
      <div className="cx-imaging-ticks">{HRT_CONTRA.map((c) => <label key={c} className="cx-pa-mine"><input type="checkbox" checked={contra.includes(c)} onChange={() => setContra(contra.includes(c) ? contra.filter((y) => y !== c) : [...contra, c])} data-hr-c /> {c}</label>)}</div>
      <div className={`cx-cmp-out ${contra.length ? "cx-ac-high" : "cx-ac-in"}`} data-hr="out"><ul data-hr="regimen">{p.regimen.map((r) => <li key={r}>{r}</li>)}</ul></div>
      <ul data-hr="notes">{p.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Menopause plan", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><Flower2 size={13} /> NICE NG23 (2024 update), IMS 2016 and the Indian Menopause Society. <TriangleAlert size={13} /> Postmenopausal bleeding needs investigation before HRT.</p>
    </section>
  );
}
