/**
 * Dementia & Memory: the Mini-Cog screen, reversible causes to check, medicines by stage
 * (cholinesterase inhibitors, memantine), and planning with the family.
 */
import { useState } from "react";
import { BrainCog, TriangleAlert } from "lucide-react";
import { dementiaDrugs, miniCog, REVERSIBLE } from "@/lib/cadus/clinic31";

export default function DementiaView() {
  const [words, setWords] = useState<0 | 1 | 2 | 3>(3);
  const [clock, setClock] = useState(true);
  const [done, setDone] = useState<string[]>([]);
  const [stage, setStage] = useState<"mild" | "moderate" | "severe">("mild");
  const [egfr, setEgfr] = useState("");
  const [brady, setBrady] = useState(false);
  const m = miniCog(words, clock);
  const drugs = dementiaDrugs(stage, egfr === "" ? null : Number(egfr), brady);

  return (
    <section className="cx-page cx-lab cx-dementia">
      <header className="cx-page-h"><div><h1>Dementia &amp; Memory</h1><p>A 3-minute memory screen (Mini-Cog), the reversible causes to check, medicines by stage, and the planning conversations to have with the family.</p></div></header>
      <h4>Mini-Cog</h4>
      <p className="cx-set-hint">Say 3 words (e.g. banana, sunrise, chair); ask the patient to draw a clock with all the numbers and the hands at 10 past 11; then ask for the 3 words.</p>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Words recalled</span><select className="cx-select" value={words} onChange={(e) => setWords(Number(e.target.value) as 0 | 1 | 2 | 3)} data-dm="words">{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={clock} onChange={(e) => setClock(e.target.checked)} data-dm="clock" /> Clock normal (all numbers in place, hands correct)</label>
      </div>
      <div className={`cx-cmp-out ${m.positive ? "cx-ac-high" : "cx-ac-in"}`} data-dm="out" data-pos={String(m.positive)}><p><b>{m.text}</b></p></div>
      <h4>Reversible causes and mimics</h4>
      <div className="cx-imaging-ticks" data-dm="checks">{REVERSIBLE.map((r) => <label key={r} className="cx-pa-mine"><input type="checkbox" checked={done.includes(r)} onChange={() => setDone(done.includes(r) ? done.filter((x) => x !== r) : [...done, r])} /> {r}</label>)}</div>
      <p className="cx-set-hint">{done.length}/{REVERSIBLE.length} done.</p>
      <h4>Medicines</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Stage (Alzheimer's or mixed)</span><select className="cx-select" value={stage} onChange={(e) => setStage(e.target.value as typeof stage)} data-dm="stage"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></label>
        <label className="cx-field"><span>eGFR (optional)</span><input className="cx-input" inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value.replace(/\D/g, "").slice(0, 3))} data-dm="egfr" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={brady} onChange={(e) => setBrady(e.target.checked)} /> Bradycardia, heart block or syncope</label>
      </div>
      <ul data-dm="drugs">{drugs.map((d) => <li key={d}>{d}</li>)}</ul>
      <p className="cx-rs-foot"><BrainCog size={13} /> Mini-Cog (Borson); NICE NG97 dementia. <TriangleAlert size={13} /> Sudden confusion is delirium until proven otherwise (see Elderly Care, 4AT).</p>
    </section>
  );
}
