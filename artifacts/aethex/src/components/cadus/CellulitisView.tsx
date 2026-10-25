/**
 * Cellulitis & Necrotising Fasciitis: clinical red flags, the LRINEC score, and treatment for
 * cellulitis or suspected necrotising infection.
 */
import { useState } from "react";
import { Bandage, TriangleAlert } from "lucide-react";
import { lrinec, NF_FLAGS, skinPlan } from "@/lib/cadus/clinic38";

export default function CellulitisView() {
  const [v, setV] = useState({ crp: "", wbc: "", hb: "", na: "", creat: "", glucose: "" });
  const [flags, setFlags] = useState<number[]>([]);
  const [severe, setSevere] = useState(false);
  const [mrsa, setMrsa] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-cl={k} /></label>;
  const ready = Object.values(v).every(Boolean);
  const L = ready ? lrinec({ crp: Number(v.crp), wbc: Number(v.wbc), hb: Number(v.hb), na: Number(v.na), creat: Number(v.creat), glucose: Number(v.glucose) }) : null;
  const p = skinPlan(flags.length, L?.risk ?? "low", severe, mrsa);
  return (
    <section className="cx-page cx-lab cx-cellulitis">
      <header className="cx-page-h"><div><h1>Cellulitis &amp; Necrotising Fasciitis</h1><p>Look for the red flags of necrotising infection, add the LRINEC score, and treat cellulitis or call the surgeons now.</p></div></header>
      <h4>Red flags for necrotising infection</h4>
      <div className="cx-imaging-ticks">{NF_FLAGS.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={flags.includes(i)} onChange={() => setFlags(flags.includes(i) ? flags.filter((y) => y !== i) : [...flags, i])} data-cl-flag={i} /> {x}</label>)}</div>
      <h4>LRINEC</h4>
      <div className="cx-c23-row">{n("crp", "CRP (mg/L)", "160")}{n("wbc", "White cells (×1000)", "18")}{n("hb", "Hb (g/dL)", "12")}{n("na", "Sodium", "133")}{n("creat", "Creatinine (mg/dL)", "1.2")}{n("glucose", "Glucose (mg/dL)", "150")}</div>
      {L && <p className={`cx-set-hint ${L.risk !== "low" ? "cx-bk-err" : ""}`} data-cl="lrinec"><b>LRINEC {L.score}: {L.risk} risk</b> (6–7 intermediate, 8 or more high). A low score does not exclude necrotising fasciitis.</p>}
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={severe} onChange={(e) => setSevere(e.target.checked)} data-cl="severe" /> Systemically unwell or failing oral treatment</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={mrsa} onChange={(e) => setMrsa(e.target.checked)} data-cl="mrsa" /> MRSA likely</label>
      </div>
      <div className={`cx-cmp-out ${p.nf ? "cx-st-out" : "cx-ac-in"}`} data-cl="out" data-nf={String(p.nf)}><h3 className="cx-lab-h3">{p.nf ? "Treat as necrotising fasciitis" : "Cellulitis"}</h3><ol className="cx-c23-steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Bandage size={13} /> IDSA 2014 skin infections, LRINEC (Wong 2004), NICE NG141. <TriangleAlert size={13} /> Surgery, not imaging, makes the diagnosis of necrotising fasciitis: do not delay it.</p>
    </section>
  );
}
