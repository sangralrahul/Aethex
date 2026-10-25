/**
 * Syncope: ESC high-risk features from the history and ECG, low-risk reflex features, and whether
 * to admit, observe or discharge, with the work-up and advice.
 */
import { useState } from "react";
import { HeartPulse, TriangleAlert } from "lucide-react";
import { SYNCOPE_ECG, SYNCOPE_HIGH, SYNCOPE_LOW, syncopeRisk } from "@/lib/cadus/clinic32";

export default function SyncopeView() {
  const [sel, setSel] = useState<string[]>([]);
  const t = (s: string) => setSel(sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s]);
  const r = syncopeRisk(SYNCOPE_HIGH.filter((s) => sel.includes(s)).length, SYNCOPE_ECG.filter((s) => sel.includes(s)).length, SYNCOPE_LOW.filter((s) => sel.includes(s)).length);
  const group = (title: string, items: string[], k: string) => <div><h4>{title}</h4><div className="cx-imaging-ticks">{items.map((s, i) => <label key={s} className="cx-pa-mine"><input type="checkbox" checked={sel.includes(s)} onChange={() => t(s)} data-sy={`${k}${i}`} /> {s}</label>)}</div></div>;

  return (
    <section className="cx-page cx-lab cx-syncope">
      <header className="cx-page-h"><div><h1>Syncope</h1><p>High-risk features in the history and ECG, the reassuring features of a simple faint, and whether to admit, observe or send home.</p></div></header>
      <p className="cx-set-hint">First: was it syncope (brief loss of consciousness with full recovery), or a seizure, fall, hypoglycaemia or intoxication? Check lying and standing BP, a 12-lead ECG, glucose and Hb in everyone.</p>
      <div className="cx-c23-two">{group("High-risk history and examination", SYNCOPE_HIGH, "h")}{group("High-risk ECG", SYNCOPE_ECG, "e")}</div>
      {group("Low-risk (reflex or orthostatic) features", SYNCOPE_LOW, "l")}
      <div className={`cx-cmp-out ${r.level === "high" ? "cx-st-out" : r.level === "low" ? "cx-ac-in" : "cx-ac-high"}`} data-sy="out" data-level={r.level}><h3 className="cx-lab-h3">{r.level === "high" ? "High risk" : r.level === "low" ? "Low risk" : "Intermediate"}</h3><p>{r.text}</p></div>
      <h4>Advice</h4>
      <ul><li>Reflex syncope: lie down at the first warning sign, cross the legs and tense the muscles; 2–3 litres of fluid a day; avoid triggers.</li><li>Orthostatic: rise slowly, sit before standing, review BP-lowering drugs, compression stockings.</li><li>Driving: no driving after unexplained or cardiac syncope until assessed and treated; check the transport authority's rules.</li></ul>
      <p className="cx-rs-foot"><HeartPulse size={13} /> ESC 2018 syncope guidelines. <TriangleAlert size={13} /> Syncope on exertion or with a family history of sudden death needs urgent cardiology review.</p>
    </section>
  );
}
