/**
 * Chronic Diarrhoea & IBS: Rome IV, red flags, first tests, faecal calprotectin and the IBS treatment
 * ladder by subtype.
 */
import { useState } from "react";
import { Activity, TriangleAlert } from "lucide-react";
import { BOWEL_FLAGS, bowelPlan, calprotectin, romeIV, type RomeInput } from "@/lib/cadus/clinic46";

export default function ChronicDiarrhoeaView() {
  const [x, setX] = useState<RomeInput>({ painDaysPerWeek: 0, months: 0, defecation: false, frequency: false, form: false });
  const [flags, setFlags] = useState(BOWEL_FLAGS.map(() => false));
  const [sub, setSub] = useState<"D" | "C" | "M">("D");
  const [fc, setFc] = useState("");
  const rome = romeIV(x);
  const plan = bowelPlan(sub, flags);
  const cal = fc ? calprotectin(Number(fc) || 0) : null;
  const n = (k: "painDaysPerWeek" | "months", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder={ph} data-ibs={k} /></label>;
  const cb = (k: "defecation" | "frequency" | "form", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-ibs={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-ibs">
      <header className="cx-page-h"><div><h1>Chronic Diarrhoea &amp; IBS</h1><p>Check Rome IV, rule out red flags, coeliac disease, parasites and IBD, then treat IBS by subtype.</p></div></header>
      <div className="cx-c23-row">{n("painDaysPerWeek", "Days a week with pain", "2")}{n("months", "Months since symptoms began", "8")}</div>
      <div className="cx-imaging-ticks">{cb("defecation", "Pain related to opening bowels")}{cb("frequency", "Change in stool frequency")}{cb("form", "Change in stool form")}</div>
      <p className={`cx-set-hint ${rome.meets ? "" : ""}`} data-ibs="rome" data-meets={String(rome.meets)}><b>{rome.text}</b></p>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks">{BOWEL_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-ibs-f={i} /> {t}</label>)}</div>
      <div className="cx-seg" role="tablist" aria-label="IBS subtype">{([["D", "Diarrhoea (IBS-D)"], ["C", "Constipation (IBS-C)"], ["M", "Mixed (IBS-M)"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={sub === k} className={sub === k ? "on" : ""} onClick={() => setSub(k)} data-ibs-sub={k}>{l}</button>)}</div>
      <div className={`cx-cmp-out ${plan.urgent ? "cx-st-out" : "cx-ac-in"}`} data-ibs="tests" data-urgent={String(plan.urgent)}><h3 className="cx-lab-h3">Tests</h3><ul>{plan.tests.map((s) => <li key={s}>{s}</li>)}</ul></div>
      <div className="cx-c23-row"><label className="cx-field"><span>Faecal calprotectin (µg/g)</span><input className="cx-input" inputMode="numeric" value={fc} onChange={(e) => setFc(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="80" data-ibs="fc" /></label></div>
      {cal && <p className={`cx-cmp-out ${cal.band === "raised" ? "cx-st-out" : cal.band === "borderline" ? "cx-ac-high" : "cx-ac-in"}`} data-ibs="cal" data-band={cal.band}>{cal.text}</p>}
      <h4>Treatment</h4>
      <ol className="cx-c23-steps" data-ibs="treat">{plan.treat.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Activity size={13} /> Rome IV, BSG IBS guideline 2021, ACG 2021, NICE CG61/DG11. <TriangleAlert size={13} /> IBS is a diagnosis only after red flags and basic tests are checked.</p>
    </section>
  );
}
