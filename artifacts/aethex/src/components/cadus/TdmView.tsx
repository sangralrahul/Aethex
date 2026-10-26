/**
 * Therapeutic Drug Levels: target ranges, sampling times and interpretation for digoxin, lithium,
 * antiseizure drugs, theophylline, vancomycin, gentamicin and tacrolimus, with phenytoin albumin
 * correction.
 */
import { useState } from "react";
import { FlaskConical, TriangleAlert } from "lucide-react";
import { interpretLevel, phenytoinCorrected, TDM } from "@/lib/cadus/clinic40";

export default function TdmView() {
  const [id, setId] = useState("lithium");
  const [lvl, setLvl] = useState("");
  const [alb, setAlb] = useState("");
  const [esrd, setEsrd] = useState(false);
  const d = TDM.find((x) => x.id === id)!;
  const corrected = id === "phenytoin" && lvl && alb ? phenytoinCorrected(Number(lvl), Number(alb), esrd) : null;
  const r = lvl ? interpretLevel(id, corrected ?? Number(lvl)) : null;
  return (
    <section className="cx-page cx-lab cx-tdm">
      <header className="cx-page-h"><div><h1>Therapeutic Drug Levels</h1><p>Target ranges, when to take the sample, and what a level means, for drugs that are monitored by blood levels.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Drug</span><select className="cx-select" value={id} onChange={(e) => { setId(e.target.value); setLvl(""); }} data-td="drug">{TDM.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="cx-field"><span>Level ({d.unit})</span><input className="cx-input" inputMode="decimal" value={lvl} onChange={(e) => setLvl(e.target.value.replace(/[^\d.]/g, "").slice(0, 6))} data-td="level" /></label>
        {id === "phenytoin" && <><label className="cx-field"><span>Albumin (g/dL)</span><input className="cx-input" inputMode="decimal" value={alb} onChange={(e) => setAlb(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-td="alb" /></label><label className="cx-pa-mine"><input type="checkbox" checked={esrd} onChange={(e) => setEsrd(e.target.checked)} data-td="esrd" /> CrCl under 10 / dialysis</label></>}
      </div>
      <div className="cx-cmp-out" data-td="info"><p><b>Range {d.low}–{d.high} {d.unit}</b> (toxic {d.toxic} or more). <b>Sample:</b> {d.sample}</p><p>{d.note}</p></div>
      {corrected !== null && <p className="cx-set-hint" data-td="corrected"><b>Corrected phenytoin {corrected} mg/L</b> (Winter–Tozer; measure free phenytoin where available).</p>}
      {r && <div className={`cx-cmp-out ${r.band === "toxic" ? "cx-st-out" : r.band === "therapeutic" ? "cx-ac-in" : "cx-ac-high"}`} data-td="out" data-band={r.band}><p><b>{r.text}</b></p></div>}
      <p className="cx-rs-foot"><FlaskConical size={13} /> BNF, Lexicomp ranges; your laboratory's ranges take priority. <TriangleAlert size={13} /> Treat the patient, not the number: toxicity can occur in range, especially with low potassium (digoxin) or dehydration (lithium).</p>
    </section>
  );
}
