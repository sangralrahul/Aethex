/**
 * Cholecystitis & Cholangitis (Tokyo 2018): diagnosis, severity grade and management for each.
 */
import { useState } from "react";
import { Stethoscope, TriangleAlert } from "lucide-react";
import { cholangitis, cholecystitis, TG_CHOL_A, TG_CHOL_B, TG_CHOL_G2, TG_CHOLE_A, TG_CHOLE_B, TG_CHOLE_G2, TG_ORGAN } from "@/lib/cadus/clinic42";

const blank = (l: string[]) => l.map(() => false);
export default function BiliaryView() {
  const [tab, setTab] = useState<"cystitis" | "angitis">("cystitis");
  const [a, setA] = useState(blank(TG_CHOLE_A));
  const [b, setB] = useState(blank(TG_CHOLE_B));
  const [g, setG] = useState(blank(TG_CHOLE_G2));
  const [ca, setCa] = useState(blank(TG_CHOL_A));
  const [cb, setCb] = useState(blank(TG_CHOL_B));
  const [cg, setCg] = useState(blank(TG_CHOL_G2));
  const [img, setImg] = useState(false);
  const [org, setOrg] = useState(blank(TG_ORGAN));
  const ticks = (labels: string[], val: boolean[], set: (v: boolean[]) => void, key: string) => <div className="cx-imaging-ticks">{labels.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={val[i]} onChange={(e) => set(val.map((y, j) => (j === i ? e.target.checked : y)))} data-bi={`${key}${i}`} /> {x}</label>)}</div>;
  const r = tab === "cystitis" ? cholecystitis(a, b, img, org, g) : cholangitis(ca, cb, img, org, cg);
  return (
    <section className="cx-page cx-lab cx-biliary">
      <header className="cx-page-h"><div><h1>Cholecystitis &amp; Cholangitis</h1><p>Tokyo Guidelines 2018: diagnose, grade the severity, and choose surgery, drainage and antibiotics.</p></div></header>
      <div className="cx-seg" role="tablist">{([["cystitis", "Acute cholecystitis"], ["angitis", "Acute cholangitis"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-bi-tab={k}>{l}</button>)}</div>
      {tab === "cystitis" ? (<><h4>A. Local inflammation</h4>{ticks(TG_CHOLE_A, a, setA, "a")}<h4>B. Systemic inflammation</h4>{ticks(TG_CHOLE_B, b, setB, "b")}</>) : (<><h4>A. Systemic inflammation</h4>{ticks(TG_CHOL_A, ca, setCa, "ca")}<h4>B. Cholestasis</h4>{ticks(TG_CHOL_B, cb, setCb, "cb")}</>)}
      <div className="cx-imaging-ticks"><label className="cx-pa-mine"><input type="checkbox" checked={img} onChange={(e) => setImg(e.target.checked)} data-bi="img" /> C. Imaging typical ({tab === "cystitis" ? "thick wall, stones, pericholecystic fluid" : "dilated ducts or a cause such as stones or stricture"})</label></div>
      <h4>Organ dysfunction (grade III)</h4>{ticks(TG_ORGAN, org, setOrg, "o")}
      <h4>Grade II features{tab === "angitis" ? " (any two)" : ""}</h4>{tab === "cystitis" ? ticks(TG_CHOLE_G2, g, setG, "g") : ticks(TG_CHOL_G2, cg, setCg, "cg")}
      <div className={`cx-cmp-out ${r.grade === 3 ? "cx-st-out" : r.grade === 2 ? "cx-ac-high" : "cx-ac-in"}`} data-bi="out" data-dx={r.dx} data-grade={r.grade}><h3 className="cx-lab-h3">{r.dx === "none" ? "Criteria not met" : `${r.dx === "definite" ? "Definite" : "Suspected"} ${tab === "cystitis" ? "cholecystitis" : "cholangitis"}`} · Grade {r.grade}</h3><ul>{r.plan.map((s) => <li key={s}>{s}</li>)}</ul></div>
      <p className="cx-rs-foot"><Stethoscope size={13} /> Tokyo Guidelines 2018 (TG18). <TriangleAlert size={13} /> Charcot's triad is specific but misses many cases; cholangitis with shock needs drainage within hours.</p>
    </section>
  );
}
