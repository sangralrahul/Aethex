/**
 * Acne Treatment Ladder: grade the acne and step up from topical retinoids to isotretinoin, with
 * pregnancy-safe options.
 */
import { useState } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { acnePlan, isoDose } from "@/lib/cadus/clinic43";

export default function AcneView() {
  const [g, setG] = useState<"comedonal" | "mild" | "moderate" | "severe">("mild");
  const [female, setFemale] = useState(false);
  const [preg, setPreg] = useState(false);
  const [kg, setKg] = useState("");
  const iso = g === "severe" && !preg ? isoDose(Number(kg) || 0) : null;
  return (
    <section className="cx-page cx-lab cx-acne">
      <header className="cx-page-h"><div><h1>Acne Treatment Ladder</h1><p>Grade the acne and pick the right step, from adapalene and benzoyl peroxide to oral antibiotics, hormonal options and isotretinoin.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Type</span><select className="cx-select" value={g} onChange={(e) => setG(e.target.value as typeof g)} data-acn="grade"><option value="comedonal">Comedones only (blackheads, whiteheads)</option><option value="mild">Mild inflammatory (few papules, pustules)</option><option value="moderate">Moderate (many papules and pustules)</option><option value="severe">Severe (nodules, cysts or scarring)</option></select></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value.replace(/\D/g, "").slice(0, 3))} data-acn="kg" /></label>
      </div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} data-acn="female" /> Female</label>
        {female && <label className="cx-pa-mine"><input type="checkbox" checked={preg} onChange={(e) => setPreg(e.target.checked)} data-acn="preg" /> Pregnant or planning pregnancy</label>}
      </div>
      <ol className="cx-c23-steps" data-acn="plan">{acnePlan(g, female, preg).map((s) => <li key={s}>{s}</li>)}</ol>
      {iso && <p className="cx-set-hint" data-acn="iso"><b>{iso}</b></p>}
      <p className="cx-rs-foot"><Sparkles size={13} /> AAD acne guideline 2024, IADVL acne board. <TriangleAlert size={13} /> Sudden severe acne with fever or joint pain (acne fulminans), or virilisation in women: refer.</p>
    </section>
  );
}
