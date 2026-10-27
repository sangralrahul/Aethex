/**
 * Tetanus: wound prophylaxis (Td and tetanus immunoglobulin) by immunisation history, and grading
 * and treatment of generalised tetanus.
 */
import { useState } from "react";
import { ShieldPlus, TriangleAlert } from "lucide-react";
import { ablett, TETANUS_PRONE, tetanusCare, tetanusProphylaxis } from "@/lib/cadus/clinic43";

export default function TetanusView() {
  const [tab, setTab] = useState<"wound" | "disease">("wound");
  const [doses, setDoses] = useState<"unknown" | "lt3" | "ge3">("ge3");
  const [yrs, setYrs] = useState("");
  const [prone, setProne] = useState<boolean[]>(TETANUS_PRONE.map(() => false));
  const [t, setT] = useState<"mild" | "moderate" | "severe">("mild");
  const [f, setF] = useState({ dysphagia: false, spasms: false, respiratory: false, autonomic: false });
  const [kg, setKg] = useState("");
  const p = tetanusProphylaxis(doses, Number(yrs) || 0, prone.some(Boolean));
  const a = ablett(t, f.dysphagia, f.spasms, f.respiratory, f.autonomic);
  return (
    <section className="cx-page cx-lab cx-tetanus">
      <header className="cx-page-h"><div><h1>Tetanus</h1><p>Prevent tetanus after a wound (Td and immunoglobulin by immunisation history), and grade and treat established tetanus.</p></div></header>
      <div className="cx-seg" role="tablist">{([["wound", "Wound prophylaxis"], ["disease", "Generalised tetanus"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-tet-tab={k}>{l}</button>)}</div>
      {tab === "wound" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Tetanus doses received</span><select className="cx-select" value={doses} onChange={(e) => setDoses(e.target.value as typeof doses)} data-tet="doses"><option value="ge3">3 or more</option><option value="lt3">Fewer than 3</option><option value="unknown">Unknown</option></select></label>
            {doses === "ge3" && <label className="cx-field"><span>Years since last dose</span><input className="cx-input" inputMode="numeric" value={yrs} onChange={(e) => setYrs(e.target.value.replace(/\D/g, "").slice(0, 2))} data-tet="yrs" /></label>}
          </div>
          <h4>Tetanus-prone wound?</h4>
          <div className="cx-imaging-ticks">{TETANUS_PRONE.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={prone[i]} onChange={(e) => setProne(prone.map((y, j) => (j === i ? e.target.checked : y)))} data-tet-p={i} /> {x}</label>)}</div>
          <div className={`cx-cmp-out ${p.tig ? "cx-st-out" : p.vaccine ? "cx-ac-high" : "cx-ac-in"}`} data-tet="out" data-tig={String(p.tig)} data-vaccine={String(p.vaccine)}><p><b>{p.text}</b></p></div>
          <p className="cx-set-hint">Clean and debride every wound; immunocompromised patients with tetanus-prone wounds may need immunoglobulin whatever their history.</p>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Trismus</span><select className="cx-select" value={t} onChange={(e) => setT(e.target.value as typeof t)} data-tet="trismus"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-tet="kg" /></label>
          </div>
          <div className="cx-imaging-ticks">{([["dysphagia", "Dysphagia"], ["spasms", "Spasms"], ["respiratory", "Breathing difficulty or apnoea"], ["autonomic", "Autonomic instability"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-tet={k} /> {l}</label>)}</div>
          <div className={`cx-cmp-out ${a.grade >= 3 ? "cx-st-out" : "cx-ac-high"}`} data-tet="ablett" data-grade={a.grade}><p><b>{a.text}</b></p></div>
          <ol className="cx-c23-steps" data-tet="care">{tetanusCare(Number(kg) || 0).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><ShieldPlus size={13} /> WHO tetanus position paper 2017, National Immunisation Schedule (Td), Ablett classification. <TriangleAlert size={13} /> Neonatal tetanus (poor feeding, stiffness after day 3): admit and notify.</p>
    </section>
  );
}
