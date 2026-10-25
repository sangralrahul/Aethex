/**
 * Body Fluid Analysis: pleural (Light's criteria, ADA, pH), ascitic (SAAG, SBP), CSF (pattern with
 * traumatic-tap correction) and synovial fluid.
 */
import { useState } from "react";
import { Microscope, TriangleAlert } from "lucide-react";
import { csfPattern, lightCriteria, pleuralExtras, saag, synovial } from "@/lib/cadus/clinic34";

export default function FluidsView() {
  const [tab, setTab] = useState<"pleural" | "ascitic" | "csf" | "synovial">("pleural");
  const [p, setP] = useState({ pp: "", sp: "", pl: "", sl: "", uln: "250", ada: "", ph: "", glu: "" });
  const [lymph, setLymph] = useState(false);
  const [a, setA] = useState({ salb: "", aalb: "", aprot: "", pmn: "" });
  const [c, setC] = useState({ wbc: "", neut: "", rbc: "", cg: "", bg: "", prot: "", ada: "" });
  const [sy, setSy] = useState("");
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 7);
  const L = lightCriteria(Number(p.pp), Number(p.sp), Number(p.pl), Number(p.sl), Number(p.uln));
  const ex = pleuralExtras(p.ada ? Number(p.ada) : undefined, lymph, p.ph ? Number(p.ph) : undefined, p.glu ? Number(p.glu) : undefined);
  const sg = a.salb && a.aalb ? saag(Number(a.salb), Number(a.aalb), a.aprot ? Number(a.aprot) : undefined) : null;
  const cs = c.wbc && c.cg && c.bg ? csfPattern({ wbc: Number(c.wbc), neutPct: Number(c.neut) || 0, rbc: c.rbc ? Number(c.rbc) : undefined, csfGlu: Number(c.cg), bloodGlu: Number(c.bg), protein: Number(c.prot) || 0, ada: c.ada ? Number(c.ada) : undefined }) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = (o: Record<string, string>, set: (x: any) => void, k: string, l: string, ph = "", key = "") => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={o[k]} onChange={(e) => set({ ...o, [k]: n(e.target.value) })} placeholder={ph} data-fl={key || k} /></label>;

  return (
    <section className="cx-page cx-lab cx-fluids">
      <header className="cx-page-h"><div><h1>Body Fluid Analysis</h1><p>Pleural fluid (Light's criteria, ADA, pH), ascitic fluid (SAAG, SBP), CSF patterns with traumatic-tap correction, and synovial fluid.</p></div></header>
      <div className="cx-seg" role="tablist">{([["pleural", "Pleural"], ["ascitic", "Ascitic"], ["csf", "CSF"], ["synovial", "Synovial"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-fl-tab={k}>{l}</button>)}</div>
      {tab === "pleural" && (
        <>
          <div className="cx-c23-row">{f(p, setP, "pp", "Pleural protein (g/dL)", "4.0")}{f(p, setP, "sp", "Serum protein", "7.0")}{f(p, setP, "pl", "Pleural LDH (U/L)", "300")}{f(p, setP, "sl", "Serum LDH", "250")}{f(p, setP, "uln", "Serum LDH upper limit")}</div>
          <div className="cx-c23-row">{f(p, setP, "ada", "ADA (U/L)", "55")}{f(p, setP, "ph", "pH", "7.3")}{f(p, setP, "glu", "Glucose (mg/dL)", "80", "pglu")}<label className="cx-pa-mine"><input type="checkbox" checked={lymph} onChange={(e) => setLymph(e.target.checked)} /> Lymphocyte-predominant</label></div>
          {L && <div className={`cx-cmp-out ${L.exudate ? "cx-ac-high" : "cx-ac-in"}`} data-fl="light"><h3 className="cx-lab-h3">{L.text}</h3><p>{L.exudate ? "Exudate: infection (parapneumonic, TB), malignancy, PE, pancreatitis, autoimmune." : "Transudate: heart failure, cirrhosis, nephrotic syndrome, hypoalbuminaemia (diuretics can make a transudate look like an exudate: check the albumin gradient)."}</p>{ex.length > 0 && <ul>{ex.map((x) => <li key={x}>{x}</li>)}</ul>}</div>}
        </>
      )}
      {tab === "ascitic" && (
        <>
          <div className="cx-c23-row">{f(a, setA, "salb", "Serum albumin (g/dL)", "3.0")}{f(a, setA, "aalb", "Ascitic albumin", "1.2")}{f(a, setA, "aprot", "Ascitic protein", "1.5")}{f(a, setA, "pmn", "Neutrophils (/mm³)", "320")}</div>
          {sg && <p className="cx-set-hint" data-fl="saag"><b>{sg}</b></p>}
          {a.pmn && <p className={`cx-set-hint ${Number(a.pmn) >= 250 ? "cx-bk-err" : ""}`} data-fl="sbp"><b>{Number(a.pmn) >= 250 ? `Neutrophils ${a.pmn}: SBP: treat now (see Cirrhosis & Ascites)` : `Neutrophils ${a.pmn}: no SBP`}</b></p>}
        </>
      )}
      {tab === "csf" && (
        <>
          <div className="cx-c23-row">{f(c, setC, "wbc", "White cells (/mm³)", "800")}{f(c, setC, "neut", "Neutrophils (%)", "85")}{f(c, setC, "rbc", "Red cells (/mm³, if bloody)")}{f(c, setC, "cg", "CSF glucose (mg/dL)", "20")}{f(c, setC, "bg", "Blood glucose", "100")}{f(c, setC, "prot", "Protein (mg/dL)", "200")}{f(c, setC, "ada", "ADA (U/L)", "", "cada")}</div>
          {cs && <div className={`cx-cmp-out ${cs.pattern.startsWith("Normal") ? "cx-ac-in" : "cx-st-out"}`} data-fl="csf"><h3 className="cx-lab-h3">{cs.pattern}</h3><ul>{cs.notes.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <p className="cx-set-hint">Measure blood glucose at the time of the LP; opening pressure and cryptococcal antigen in HIV; never delay antibiotics for an LP in suspected bacterial meningitis.</p>
        </>
      )}
      {tab === "synovial" && (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>White cells (/mm³)</span><input className="cx-input" inputMode="numeric" value={sy} onChange={(e) => setSy(e.target.value.replace(/\D/g, "").slice(0, 7))} data-fl="syn" /></label></div>
          {sy && <p className="cx-set-hint" data-fl="synout"><b>{synovial(Number(sy))}</b></p>}
          <p className="cx-set-hint">Always send Gram stain, culture and crystals; needle-shaped negatively birefringent crystals: gout; rhomboid positively birefringent: CPPD.</p>
        </>
      )}
      <p className="cx-rs-foot"><Microscope size={13} /> Light's criteria, AASLD SAAG, IDSA meningitis guidance. <TriangleAlert size={13} /> Interpret with the clinical picture: no single number makes the diagnosis.</p>
    </section>
  );
}
