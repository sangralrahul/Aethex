/**
 * Ectopic & Early Pregnancy Bleeding: serial hCG, management route (expectant, methotrexate,
 * surgery), methotrexate dose and follow-up, and anti-D.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { ANTI_D, ectopicPlan, hcgTrend, MTX_FOLLOWUP, mtxDose } from "@/lib/cadus/clinic41";

export default function EctopicView() {
  const [h, setH] = useState({ h0: "", h48: "" });
  const [v, setV] = useState({ hcg: "", mass: "", ht: "", kg: "" });
  const [f, setF] = useState({ unstable: false, pain: false, heartbeat: false, falling: false });
  const num = (s: string) => Number(s) || 0;
  const t = num(h.h0) > 0 && num(h.h48) > 0 ? hcgTrend(num(h.h0), num(h.h48)) : null;
  const p = num(v.hcg) > 0 || f.unstable ? ectopicPlan({ ...f, massMm: num(v.mass), hcg: num(v.hcg) }) : null;
  const m = mtxDose(num(v.ht), num(v.kg));
  const inp = (val: string, set: (s: string) => void, l: string, ph: string, key: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={val} onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={ph} data-eb={key} /></label>;
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-eb={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-ectopic">
      <header className="cx-page-h"><div><h1>Ectopic &amp; Early Pregnancy Bleeding</h1><p>Interpret serial hCG, choose expectant, methotrexate or surgical management for a tubal ectopic, and plan follow-up and anti-D.</p></div></header>
      <h4>Pregnancy of unknown location: serial hCG</h4>
      <div className="cx-c23-row">{inp(h.h0, (s) => setH({ ...h, h0: s }), "hCG at 0 hours (IU/L)", "1000", "h0")}{inp(h.h48, (s) => setH({ ...h, h48: s }), "hCG at 48 hours", "1700", "h48")}</div>
      {t && <div className={`cx-cmp-out ${t.band === "suboptimal" ? "cx-ac-high" : "cx-ac-in"}`} data-eb="trend" data-band={t.band}><p><b>{t.text}</b></p></div>}
      <h4>Tubal ectopic: which treatment</h4>
      <div className="cx-c23-row">{inp(v.hcg, (s) => setV({ ...v, hcg: s }), "Current hCG (IU/L)", "1200", "hcg")}{inp(v.mass, (s) => setV({ ...v, mass: s }), "Adnexal mass (mm)", "25", "mass")}</div>
      <div className="cx-c23-row">{cb("unstable", "Unstable or signs of rupture")}{cb("pain", "Significant pain")}{cb("heartbeat", "Fetal heartbeat seen")}{cb("falling", "hCG falling")}</div>
      {p && <div className={`cx-cmp-out ${p.route === "surgery" ? "cx-st-out" : "cx-ac-high"}`} data-eb="plan" data-route={p.route}><h3 className="cx-lab-h3">{p.route === "surgery" ? "Surgery" : p.route === "methotrexate" ? "Methotrexate" : p.route === "expectant" ? "Expectant management" : "Methotrexate or surgery"}</h3><ul>{p.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>}
      <h4>Methotrexate 50 mg/m² IM</h4>
      <div className="cx-c23-row">{inp(v.ht, (s) => setV({ ...v, ht: s }), "Height (cm)", "160", "ht")}{inp(v.kg, (s) => setV({ ...v, kg: s }), "Weight (kg)", "60", "kg")}</div>
      {m && <p className="cx-set-hint" data-eb="mtx"><b>Methotrexate {m.mg} mg IM once</b> (body surface area {m.bsa} m²).</p>}
      <ul>{MTX_FOLLOWUP.map((s) => <li key={s}>{s}</li>)}</ul>
      <div className="cx-cmp-out" data-eb="antid"><p>{ANTI_D}</p></div>
      <p className="cx-rs-foot"><Baby size={13} /> NICE NG126 (2023), RCOG Green-top 21. <TriangleAlert size={13} /> Any woman of reproductive age with abdominal pain, collapse or shoulder-tip pain: pregnancy test first.</p>
    </section>
  );
}
