/**
 * HIV Care: starting ART (NACO): the regimen by weight, kidney function and rifampicin, when to
 * start with TB or meningitis, baseline tests, prophylaxis and viral load monitoring.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { hivPlan } from "@/lib/cadus/clinic33";

export default function HivView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ kg: "", crcl: "", cd4: "" });
  const [x, setX] = useState({ rifampicin: false, pregnant: false, tbSymptoms: false, meningitis: false });
  const [vl, setVl] = useState("");
  const n = (s: string) => s.replace(/\D/g, "").slice(0, 7);
  const p = hivPlan({ kg: Number(v.kg) || 60, crcl: v.crcl ? Number(v.crcl) : null, cd4: v.cd4 ? Number(v.cd4) : undefined, ...x });
  const vlNum = vl === "" ? null : Number(vl);
  const md = () => ["# Starting ART", "", ...p.regimen.map((r) => `- ${r}`), `- ${p.timing}`, "", "## Baseline", ...p.baseline.map((b) => `- ${b}`), "", "## Prophylaxis and monitoring", ...p.prophylaxis.map((q) => `- ${q}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-hiv">
      <header className="cx-page-h"><div><h1>HIV Care</h1><p>Starting antiretroviral therapy under NACO: the regimen for the patient, when to start with TB or meningitis, baseline tests, prophylaxis, and viral load follow-up.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={v.kg} onChange={(e) => setV({ ...v, kg: n(e.target.value) })} placeholder="60" data-hv="kg" /></label>
        <label className="cx-field"><span>CrCl (optional)</span><input className="cx-input" inputMode="numeric" value={v.crcl} onChange={(e) => setV({ ...v, crcl: n(e.target.value) })} data-hv="crcl" /></label>
        <label className="cx-field"><span>CD4 (optional)</span><input className="cx-input" inputMode="numeric" value={v.cd4} onChange={(e) => setV({ ...v, cd4: n(e.target.value) })} data-hv="cd4" /></label>
        {([["rifampicin", "On rifampicin (TB treatment)"], ["pregnant", "Pregnant or breastfeeding"], ["tbSymptoms", "TB symptoms"], ["meningitis", "Headache, neck stiffness or confusion (meningitis?)"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-hv={k} /> {l}</label>)}
      </div>
      <div className="cx-cmp-out" data-hv="out">
        <h4>Regimen</h4><ul data-hv="regimen">{p.regimen.map((r) => <li key={r}>{r}</li>)}</ul>
        <p data-hv="timing"><b>When:</b> {p.timing}</p>
      </div>
      <div className="cx-c23-two">
        <div><h4>Baseline</h4><ul data-hv="baseline">{p.baseline.map((b) => <li key={b}>{b}</li>)}</ul></div>
        <div><h4>Prophylaxis and monitoring</h4><ul data-hv="proph">{p.prophylaxis.map((q) => <li key={q}>{q}</li>)}</ul></div>
      </div>
      <h4>Viral load result</h4>
      <div className="cx-c23-row"><label className="cx-field"><span>Copies/ml</span><input className="cx-input" inputMode="numeric" value={vl} onChange={(e) => setVl(n(e.target.value))} data-hv="vl" /></label></div>
      {vlNum !== null && <p className={`cx-set-hint ${vlNum >= 1000 ? "cx-bk-err" : ""}`} data-hv="vlout"><b>{vlNum < 50 ? "Undetectable: continue; U=U (cannot transmit sexually)." : vlNum < 1000 ? "Suppressed but detectable: reinforce adherence; repeat as scheduled." : "1,000 or more: not suppressed: three sessions of enhanced adherence counselling, repeat viral load in 3 months; if still 1,000 or more, refer to the SACEP for a second-line regimen."}</b></p>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Starting ART", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> NACO National Guidelines for HIV Care and Treatment 2021 and WHO 2021. ART is free at ART centres; record the patient's ART number. Post-exposure prophylaxis: see Needle-stick Injury.</p>
    </section>
  );
}
