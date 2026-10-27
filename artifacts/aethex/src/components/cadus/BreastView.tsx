/**
 * Breast Lump & Screening: triple assessment and red flags, BI-RADS actions, and screening by age
 * and risk.
 */
import { useState } from "react";
import { Ribbon, TriangleAlert } from "lucide-react";
import { BIRADS, BREAST_FLAGS, breastLump, breastScreen } from "@/lib/cadus/clinic44";

export default function BreastView() {
  const [age, setAge] = useState("");
  const [flags, setFlags] = useState<boolean[]>(BREAST_FLAGS.map(() => false));
  const [cat, setCat] = useState("3");
  const [high, setHigh] = useState(false);
  const b = BIRADS.find((x) => x.cat === cat)!;
  return (
    <section className="cx-page cx-lab cx-breast">
      <header className="cx-page-h"><div><h1>Breast Lump &amp; Screening</h1><p>Triple assessment for a lump, what each BI-RADS category means, and screening by age and risk.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="45" data-bst="age" /></label><label className="cx-pa-mine"><input type="checkbox" checked={high} onChange={(e) => setHigh(e.target.checked)} data-bst="high" /> High risk (BRCA, strong family history, chest radiotherapy)</label></div>
      <h4>A lump: red flags</h4>
      <div className="cx-imaging-ticks">{BREAST_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-bst-f={i} /> {t}</label>)}</div>
      <ol className="cx-c23-steps" data-bst="lump">{breastLump(Number(age) || 0, flags).map((s) => <li key={s}>{s}</li>)}</ol>
      <h4>BI-RADS result</h4>
      <div className="cx-c23-row"><label className="cx-field"><span>Category</span><select className="cx-select" value={cat} onChange={(e) => setCat(e.target.value)} data-bst="birads">{BIRADS.map((x) => <option key={x.cat} value={x.cat}>{x.cat}: {x.name}</option>)}</select></label></div>
      <div className={`cx-cmp-out ${Number(cat) >= 4 ? "cx-st-out" : cat === "3" || cat === "0" ? "cx-ac-high" : "cx-ac-in"}`} data-bst="action"><p><b>BI-RADS {b.cat}:</b> {b.action}</p></div>
      <h4>Screening</h4>
      <p className="cx-set-hint" data-bst="screen"><b>{breastScreen(Number(age) || 0, high)}</b></p>
      <p className="cx-rs-foot"><Ribbon size={13} /> ACR BI-RADS 5th edition, USPSTF 2024, NICE NG12 and CG164, NP-NCD India. <TriangleAlert size={13} /> A normal mammogram does not rule out cancer in a palpable lump: complete triple assessment.</p>
    </section>
  );
}
