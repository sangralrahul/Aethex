/**
 * Cirrhosis & Ascites: Child-Pugh and MELD-Na, SBP from the ascitic neutrophil count with antibiotics
 * and albumin, albumin after large-volume paracentesis, and the care of each complication.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { childPugh, CIRRHOSIS_CARE, lvpAlbumin, meldNa, sbpCheck, type ChildPughIn } from "@/lib/cadus/clinic31";

export default function CirrhosisView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ bili: "", alb: "", inr: "", creat: "", na: "", pmn: "", kg: "", litres: "" });
  const [asc, setAsc] = useState<ChildPughIn["ascites"]>(1);
  const [enc, setEnc] = useState<ChildPughIn["enceph"]>(1);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const cp = childPugh({ bili: Number(v.bili), albumin: Number(v.alb), inr: Number(v.inr), ascites: asc, enceph: enc });
  const md_ = meldNa(Number(v.bili), Number(v.inr), Number(v.creat), Number(v.na));
  const sbp = v.pmn ? sbpCheck(Number(v.pmn), Number(v.kg)) : [];
  const alb = lvpAlbumin(Number(v.litres));
  const f = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: n(e.target.value) })} placeholder={ph} data-cz={k} /></label>;
  const md = () => ["# Cirrhosis", "", cp ? `- Child-Pugh ${cp.score} (class ${cp.cls})` : "", md_ ? `- MELD ${md_.meld}, MELD-Na ${md_.meldNa}` : "", ...sbp.map((s) => `- ${s}`), alb ? `- Paracentesis ${v.litres} L: ${alb}` : "", "", ...CIRRHOSIS_CARE.map((c) => `- ${c}`)].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-cirr">
      <header className="cx-page-h"><div><h1>Cirrhosis &amp; Ascites</h1><p>Child-Pugh and MELD-Na, spontaneous bacterial peritonitis from the ascitic count, albumin after paracentesis, and the care of ascites, encephalopathy, bleeding and kidney injury.</p></div></header>
      <div className="cx-c23-row">
        {f("bili", "Bilirubin (mg/dL)", "2.5")}{f("alb", "Albumin (g/dL)", "3.0")}{f("inr", "INR", "1.5")}{f("creat", "Creatinine (mg/dL)", "1.2")}{f("na", "Sodium", "132")}
        <label className="cx-field"><span>Ascites</span><select className="cx-select" value={asc} onChange={(e) => setAsc(Number(e.target.value) as ChildPughIn["ascites"])} data-cz="asc"><option value={1}>None</option><option value={2}>Mild or controlled</option><option value={3}>Moderate–severe</option></select></label>
        <label className="cx-field"><span>Encephalopathy</span><select className="cx-select" value={enc} onChange={(e) => setEnc(Number(e.target.value) as ChildPughIn["enceph"])} data-cz="enc"><option value={1}>None</option><option value={2}>Grade 1–2</option><option value={3}>Grade 3–4</option></select></label>
      </div>
      {(cp || md_) && <div className="cx-cmp-out" data-cz="scores"><div className="cx-sim-stats">{cp && <div><b data-cz="cp">Child-Pugh {cp.cls}</b><small>score {cp.score} ({cp.cls === "A" ? "compensated" : cp.cls === "B" ? "significant compromise" : "decompensated"})</small></div>}{md_ && <div><b data-cz="meld">MELD-Na {md_.meldNa}</b><small>MELD {md_.meld}; 15 or more: refer for transplant assessment</small></div>}</div></div>}
      <h4>Ascitic tap and paracentesis</h4>
      <div className="cx-c23-row">{f("pmn", "Ascitic neutrophils (/mm³)", "320")}{f("kg", "Weight (kg)", "60")}{f("litres", "Litres drained", "6")}</div>
      {sbp.length > 0 && <div className={`cx-cmp-out ${Number(v.pmn) >= 250 ? "cx-st-out" : "cx-ac-in"}`} data-cz="sbp"><ul>{sbp.map((s) => <li key={s}>{s}</li>)}</ul></div>}
      {alb && <p className="cx-set-hint" data-cz="lvp"><b>Albumin: {alb}</b></p>}
      <h4>Care of complications</h4><ul>{CIRRHOSIS_CARE.map((c) => <li key={c}>{c}</li>)}</ul>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Cirrhosis plan", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> EASL 2018 decompensated cirrhosis, AASLD 2021 ascites, Baveno VII and INASL guidance. Tap every patient with ascites who is admitted or deteriorates.</p>
    </section>
  );
}
