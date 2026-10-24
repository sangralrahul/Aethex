/**
 * Croup & Child Asthma: the Westley croup score with dexamethasone and adrenaline doses by weight,
 * and acute asthma severity in children (BTS/SIGN) with doses by weight and age.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { croupDoses, paedAsthma, paedAsthmaDoses, westley, type WestleyIn } from "@/lib/cadus/clinic29";

export default function CroupView() {
  const [tab, setTab] = useState<"croup" | "asthma">("croup");
  const [kg, setKg] = useState("");
  const [age, setAge] = useState("");
  const [w, setW] = useState<WestleyIn>({ conscious: 0, cyanosis: 0, stridor: 0, air: 0, retractions: 0 });
  const [a, setA] = useState({ spo2: "", hr: "", rr: "", cantTalk: false, accessory: false, silentChest: false, exhausted: false, confused: false });
  const ws = westley(w);
  const cd = croupDoses(Number(kg));
  const sev = a.spo2 || a.hr || a.rr || a.cantTalk || a.accessory || a.silentChest || a.exhausted || a.confused ? paedAsthma({ age: Number(age) || 6, spo2: Number(a.spo2), hr: Number(a.hr), rr: Number(a.rr), cantTalk: a.cantTalk, accessory: a.accessory, silentChest: a.silentChest, exhausted: a.exhausted, confused: a.confused }) : null;
  const doses = paedAsthmaDoses(Number(kg), Number(age) || 6);
  const sel = <K extends keyof WestleyIn>(k: K, label: string, opts: [WestleyIn[K], string][]) => (
    <label className="cx-field"><span>{label}</span><select className="cx-select" value={String(w[k])} onChange={(e) => setW({ ...w, [k]: Number(e.target.value) as WestleyIn[K] })} data-cr-w={k}>{opts.map(([v, l]) => <option key={l} value={String(v)}>{l} ({v})</option>)}</select></label>
  );
  const n = (s: string) => s.replace(/\D/g, "").slice(0, 3);

  return (
    <section className="cx-page cx-lab cx-croup">
      <header className="cx-page-h"><div><h1>Croup &amp; Child Asthma</h1><p>How bad the croup is (Westley score) with steroid and adrenaline doses, and acute asthma severity in children with doses by weight.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="14" data-cr="kg" /></label>
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="3" data-cr="age" /></label>
      </div>
      <div className="cx-seg" role="tablist">{([["croup", "Croup"], ["asthma", "Acute asthma"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-cr-tab={k}>{l}</button>)}</div>
      {tab === "croup" ? (
        <>
          <div className="cx-nihss">
            {sel("stridor", "Stridor", [[0, "None"], [1, "With agitation"], [2, "At rest"]])}
            {sel("retractions", "Chest wall retractions", [[0, "None"], [1, "Mild"], [2, "Moderate"], [3, "Severe"]])}
            {sel("air", "Air entry", [[0, "Normal"], [1, "Decreased"], [2, "Markedly decreased"]])}
            {sel("cyanosis", "Cyanosis", [[0, "None"], [4, "With agitation"], [5, "At rest"]])}
            {sel("conscious", "Level of consciousness", [[0, "Normal"], [5, "Disoriented"]])}
          </div>
          <div className={`cx-cmp-out ${ws.score > 5 ? "cx-st-out" : ""}`} data-cr="out"><h3 className="cx-lab-h3" data-cr="band">Westley {ws.score}: {ws.band}</h3><ul>{ws.plan.map((p) => <li key={p}>{p}</li>)}</ul>
            {cd && <p data-cr="doses"><b>At {kg} kg:</b> dexamethasone {cd.dexLow} mg (0.15 mg/kg) to {cd.dexHigh} mg (0.6 mg/kg); prednisolone {cd.pred} mg; nebulised adrenaline 1:1000 {cd.adr} ml.</p>}
          </div>
          <p className="cx-set-hint">Drooling, toxic look, high fever or unable to swallow: think epiglottitis or bacterial tracheitis; do not upset the child, call the anaesthetist.</p>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>SpO2 (%)</span><input className="cx-input" inputMode="numeric" value={a.spo2} onChange={(e) => setA({ ...a, spo2: n(e.target.value) })} data-cr="spo2" /></label>
            <label className="cx-field"><span>Heart rate</span><input className="cx-input" inputMode="numeric" value={a.hr} onChange={(e) => setA({ ...a, hr: n(e.target.value) })} data-cr="hr" /></label>
            <label className="cx-field"><span>Respiratory rate</span><input className="cx-input" inputMode="numeric" value={a.rr} onChange={(e) => setA({ ...a, rr: n(e.target.value) })} data-cr="rr" /></label>
          </div>
          <div className="cx-c23-row">{([["cantTalk", "Too breathless to talk or feed"], ["accessory", "Accessory muscles"], ["silentChest", "Silent chest"], ["exhausted", "Exhausted, poor effort, cyanosed"], ["confused", "Confused or drowsy"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.checked })} data-cr={k} /> {l}</label>)}</div>
          {sev && <div className={`cx-cmp-out cx-pa-${sev.level}`} data-cr="sev" data-level={sev.level}><h3 className="cx-lab-h3">{sev.text}</h3>{sev.level === "life" && <p className="cx-bk-err"><TriangleAlert size={13} /> Call the senior and PICU now; oxygen, back-to-back nebulisers, IV access.</p>}</div>}
          {doses.length > 0 ? <ul data-cr="adoses">{doses.map((d) => <li key={d}>{d}</li>)}</ul> : <p className="cx-set-hint">Enter the weight for doses.</p>}
          <p className="cx-set-hint">Under 2 years, wheeze is often bronchiolitis or viral wheeze: bronchodilators help less. Aim for SpO2 94–98%.</p>
        </>
      )}
      <p className="cx-rs-foot"><Baby size={13} /> Westley croup score; BTS/SIGN 2019 acute asthma in children. <TriangleAlert size={13} /> Doses for children over 2; check against your unit's protocol.</p>
    </section>
  );
}
