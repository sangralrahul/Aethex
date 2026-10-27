/**
 * Constipation & Enuresis (Children): PEG disimpaction and maintenance by weight, red flags, and
 * bedwetting (alarm, desmopressin).
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { CONSTIPATION_CARE, CONSTIPATION_FLAGS, enuresisPlan, pegPlan } from "@/lib/cadus/clinic44";

export default function ChildBowelView() {
  const [tab, setTab] = useState<"constipation" | "enuresis">("constipation");
  const [kg, setKg] = useState("");
  const [impacted, setImpacted] = useState(true);
  const [flags, setFlags] = useState<boolean[]>(CONSTIPATION_FLAGS.map(() => false));
  const [age, setAge] = useState("");
  const [f, setF] = useState({ daytime: false, secondary: false });
  return (
    <section className="cx-page cx-lab cx-childbowel">
      <header className="cx-page-h"><div><h1>Constipation &amp; Enuresis (Children)</h1><p>Treat childhood constipation properly (clear it, then keep it soft for months) and manage bedwetting.</p></div></header>
      <div className="cx-seg" role="tablist">{([["constipation", "Constipation"], ["enuresis", "Bedwetting"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ce-tab={k}>{l}</button>)}</div>
      {tab === "constipation" ? (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-ce="kg" /></label><label className="cx-pa-mine"><input type="checkbox" checked={impacted} onChange={(e) => setImpacted(e.target.checked)} data-ce="impacted" /> Faecal impaction (hard mass or overflow soiling)</label></div>
          {flags.some(Boolean) && <div className="cx-cmp-out cx-st-out" data-ce="red"><p><b>Red flags: do not just treat with laxatives; refer to paediatrics (Hirschsprung's, spinal, thyroid, coeliac, cow's milk protein allergy).</b></p></div>}
          <ol className="cx-c23-steps" data-ce="plan">{impacted && <li>{pegPlan(Number(kg) || 0, "disimpaction")}</li>}<li>{pegPlan(Number(kg) || 0, "maintenance")}</li>{CONSTIPATION_CARE.map((s) => <li key={s}>{s}</li>)}</ol>
          <h4>Red flags</h4>
          <div className="cx-imaging-ticks">{CONSTIPATION_FLAGS.map((t, i) => <label key={t} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-ce-f={i} /> {t}</label>)}</div>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} data-ce="age" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={f.daytime} onChange={(e) => setF({ ...f, daytime: e.target.checked })} data-ce="daytime" /> Daytime symptoms</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={f.secondary} onChange={(e) => setF({ ...f, secondary: e.target.checked })} data-ce="secondary" /> Was dry for 6 months before</label>
          </div>
          <ol className="cx-c23-steps" data-ce="enuresis">{enuresisPlan(Number(age) || 0, f.daytime, f.secondary).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><Baby size={13} /> NICE CG99 (constipation) and CG111 (bedwetting), NASPGHAN/ESPGHAN 2014. <TriangleAlert size={13} /> Never blame or punish: both are medical problems.</p>
    </section>
  );
}
