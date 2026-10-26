/**
 * Iron, B12 & Folate Replacement: oral and IV iron (Ganzoni deficit, ferric carboxymaltose or
 * iron sucrose), vitamin B12 loading and maintenance, and folic acid.
 */
import { useState } from "react";
import { Pill, TriangleAlert } from "lucide-react";
import { b12Plan, folatePlan, ganzoniDeficit, ivIronPlan, oralIron } from "@/lib/cadus/clinic40";

export default function IronB12View() {
  const [tab, setTab] = useState<"iron" | "b12" | "folate">("iron");
  const [v, setV] = useState({ kg: "", hb: "", target: "13" });
  const [prod, setProd] = useState<"fcm" | "sucrose">("fcm");
  const [child, setChild] = useState(false);
  const [neuro, setNeuro] = useState(false);
  const [mal, setMal] = useState(false);
  const [fc, setFc] = useState<"deficiency" | "prevention" | "high-risk">("deficiency");
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder={ph} data-ib={k} /></label>;
  const def = ganzoniDeficit(Number(v.kg), Number(v.hb), Number(v.target) || 13);
  return (
    <section className="cx-page cx-lab cx-ironb12">
      <header className="cx-page-h"><div><h1>Iron, B12 &amp; Folate Replacement</h1><p>Oral or IV iron with the total deficit, vitamin B12 loading and maintenance, and folic acid for treatment and prevention.</p></div></header>
      <div className="cx-seg" role="tablist">{([["iron", "Iron"], ["b12", "Vitamin B12"], ["folate", "Folate"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ib-tab={k}>{l}</button>)}</div>
      {tab === "iron" && (
        <>
          <div className="cx-c23-row">{n("kg", "Weight (kg)", "60")}{n("hb", "Hb (g/dL)", "8")}{n("target", "Target Hb", "13")}<label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-ib="child" /> Child</label></div>
          <h4>Oral iron</h4><ul data-ib="oral">{oralIron(child, Number(v.kg) || 0).map((s) => <li key={s}>{s}</li>)}</ul>
          <h4>IV iron (intolerant, malabsorption, late pregnancy, severe anaemia)</h4>
          {def > 0 && <p className="cx-set-hint" data-ib="deficit"><b>Total iron deficit {def} mg</b> (Ganzoni: weight × (target − Hb) × 2.4 + stores).</p>}
          <div className="cx-c23-row"><label className="cx-field"><span>Product</span><select className="cx-select" value={prod} onChange={(e) => setProd(e.target.value as typeof prod)} data-ib="prod"><option value="fcm">Ferric carboxymaltose</option><option value="sucrose">Iron sucrose</option></select></label></div>
          {def > 0 && <ul data-ib="iv">{ivIronPlan(def, prod, Number(v.kg) || 0).map((s) => <li key={s}>{s}</li>)}</ul>}
        </>
      )}
      {tab === "b12" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={neuro} onChange={(e) => setNeuro(e.target.checked)} data-ib="neuro" /> Neurological signs (numbness, ataxia, memory)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={mal} onChange={(e) => setMal(e.target.checked)} data-ib="mal" /> Malabsorption (pernicious anaemia, gastrectomy, ileal disease)</label>
          </div>
          <ol className="cx-c23-steps" data-ib="b12">{b12Plan(neuro, mal).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      {tab === "folate" && (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Situation</span><select className="cx-select" value={fc} onChange={(e) => setFc(e.target.value as typeof fc)} data-ib="fc"><option value="deficiency">Folate deficiency</option><option value="prevention">Planning pregnancy (standard)</option><option value="high-risk">Planning pregnancy (high risk)</option></select></label></div>
          <p className="cx-set-hint" data-ib="folate"><b>{folatePlan(fc)}</b></p>
        </>
      )}
      <p className="cx-rs-foot"><Pill size={13} /> Anaemia Mukt Bharat, BSH iron and B12 guidance, NICE CKS. <TriangleAlert size={13} /> Always look for the cause (bleeding, worms, coeliac disease, diet); grade anaemia in the Anaemia & Iron tool.</p>
    </section>
  );
}
