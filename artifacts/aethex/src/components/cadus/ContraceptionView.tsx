/**
 * Contraception Advisor: tick the woman's situation and see which methods in the national basket
 * she can use (key WHO MEC rules), how to start each, and emergency contraception.
 */
import { useState } from "react";
import { HeartHandshake, TriangleAlert } from "lucide-react";
import { EMERGENCY_CONTRACEPTION, MEC_LABEL, mec, METHODS, type MecIn } from "@/lib/cadus/clinic27";

export default function ContraceptionView() {
  const [i, setI] = useState<MecIn>({ bpHigh: "none" });
  const [pp, setPp] = useState("");
  const r = mec({ ...i, postpartumWeeks: pp === "" ? undefined : Number(pp) });
  const tick = (k: keyof MecIn, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={!!i[k]} onChange={(e) => setI({ ...i, [k]: e.target.checked })} data-cc={k} /> {l}</label>;

  return (
    <section className="cx-page cx-lab cx-contra">
      <header className="cx-page-h"><div><h1>Contraception Advisor</h1><p>Which methods in the national basket a woman can safely use, from the key WHO Medical Eligibility Criteria, how to start each, and emergency contraception.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={i.age ?? ""} onChange={(e) => setI({ ...i, age: Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || undefined })} placeholder="28" data-cc="age" /></label>
        <label className="cx-field"><span>Weeks since delivery (if recent)</span><input className="cx-input" inputMode="decimal" value={pp} onChange={(e) => setPp(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="Leave empty if not" data-cc="pp" /></label>
        <label className="cx-field"><span>Blood pressure</span><select className="cx-select" value={i.bpHigh} onChange={(e) => setI({ ...i, bpHigh: e.target.value as MecIn["bpHigh"] })} data-cc="bp"><option value="none">Normal or controlled</option><option value="140">140–159 / 90–99</option><option value="160">160/100 or more</option></select></label>
      </div>
      <div className="cx-c23-row cx-cc-ticks">
        {tick("breastfeeding", "Breastfeeding")}{tick("smoker15", "Smokes 15 or more a day")}{tick("migraineAura", "Migraine with aura")}{tick("vte", "DVT or pulmonary embolism (now or past)")}
        {tick("ihdStroke", "Heart disease or stroke")}{tick("diabetesVascular", "Diabetes with vascular complications")}{tick("sle_aPL", "SLE with antiphospholipid antibodies")}{tick("liverSevere", "Severe cirrhosis or liver tumour")}
        {tick("breastCancer", "Current breast cancer")}{tick("pid", "Current PID, purulent cervicitis or STI")}{tick("unexplainedBleeding", "Unexplained vaginal bleeding")}{tick("pcos", "PCOS")}{tick("recentJaundice", "Recent jaundice")}
      </div>
      <div className="cx-cc-list" data-cc="methods">{METHODS.map((m) => (
        <div key={m.id} className={`cx-cc-m c${r[m.id].cat}`} data-cc-method={m.id} data-cat={r[m.id].cat}>
          <div className="cx-cc-h"><b>{m.name}</b><span>{MEC_LABEL[r[m.id].cat]}</span></div>
          {r[m.id].why.length > 0 && <p className="cx-cc-why">{r[m.id].why.join("; ")}</p>}
          {r[m.id].cat < 4 && <><p><b>How:</b> {m.how}</p><p><b>Start:</b> {m.start}</p></>}
        </div>
      ))}</div>
      <h4>Emergency contraception</h4><ul>{EMERGENCY_CONTRACEPTION.map((e) => <li key={e}>{e}</li>)}</ul>
      <p className="cx-rs-foot"><HeartHandshake size={13} /> Key WHO MEC (5th edition) rules only, for the common situations; check the full criteria for other conditions. <TriangleAlert size={13} /> Respect the woman's choice; counsel on effectiveness, side effects and STI protection.</p>
    </section>
  );
}
