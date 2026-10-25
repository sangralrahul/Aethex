/**
 * Sickle Cell & Thalassaemia: pain crisis care and danger signs, hydroxyurea dosing, transfusion
 * volumes and targets, and iron chelation.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { chelation, hydroxyurea, SICKLE_DANGER, THAL_TARGETS, transfusionVolume, VOC } from "@/lib/cadus/clinic36";

export default function SickleView() {
  const [tab, setTab] = useState<"sickle" | "thal">("sickle");
  const [v, setV] = useState({ kg: "", hb: "", target: "10", ferritin: "", tx: "" });
  const [child, setChild] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-sk={k} /></label>;
  const kg = Number(v.kg) || 0;

  return (
    <section className="cx-page cx-lab cx-sickle">
      <header className="cx-page-h"><div><h1>Sickle Cell &amp; Thalassaemia</h1><p>Pain crises and danger signs, hydroxyurea doses, transfusion volumes and targets, and iron chelation by weight.</p></div></header>
      <div className="cx-seg" role="tablist">{([["sickle", "Sickle cell disease"], ["thal", "Thalassaemia"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-sk-tab={k}>{l}</button>)}</div>
      <div className="cx-c23-row">{n("kg", "Weight (kg)", "40")}<label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-sk="child" /> Child</label></div>
      {tab === "sickle" ? (
        <>
          <h4>Pain crisis</h4>
          <ol className="cx-c23-steps">{VOC.map((s) => <li key={s}>{s}</li>)}</ol>
          <h4>Danger signs</h4>
          <div className="cx-anc-flags">{SICKLE_DANGER.map((s) => <p key={s} className="high">{s}</p>)}</div>
          <h4>Hydroxyurea</h4>
          <div className="cx-cmp-out cx-ac-in" data-sk="hu"><p>{hydroxyurea(kg, child).text}</p><p>Offer it from 9 months of age to everyone with HbSS or HbSβ0; give folic acid, penicillin prophylaxis to age 5 and vaccines (pneumococcal, Hib, meningococcal). India's National Sickle Cell Anaemia Elimination Mission offers free screening and hydroxyurea.</p></div>
        </>
      ) : (
        <>
          <ul>{THAL_TARGETS.map((s) => <li key={s}>{s}</li>)}</ul>
          <h4>Transfusion volume</h4>
          <div className="cx-c23-row">{n("hb", "Current Hb (g/dL)", "7.5")}{n("target", "Target Hb", "10")}</div>
          {kg > 0 && v.hb && <p className="cx-set-hint" data-sk="vol"><b>{transfusionVolume(kg, Number(v.hb), Number(v.target) || 10).text}</b></p>}
          <h4>Iron chelation</h4>
          <div className="cx-c23-row">{n("ferritin", "Ferritin (ng/ml)", "1500")}{n("tx", "Transfusions so far", "20")}</div>
          {v.ferritin && <div className="cx-cmp-out cx-ac-high" data-sk="chel"><ul>{chelation(kg, Number(v.ferritin), Number(v.tx) || 0).map((s) => <li key={s}>{s}</li>)}</ul></div>}
        </>
      )}
      <p className="cx-rs-foot"><Droplets size={13} /> NHLBI 2014, NICE CG143, TIF 2021 thalassaemia guideline, NSCAEM 2023. <TriangleAlert size={13} /> Doses are starting points: follow your haematology team.</p>
    </section>
  );
}
