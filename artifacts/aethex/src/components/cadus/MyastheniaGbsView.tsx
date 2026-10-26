/**
 * Myasthenic Crisis & GBS: the 20/30/40 respiratory rule, IVIG dose, crisis and GBS steps, and drugs
 * to avoid in myasthenia gravis.
 */
import { useState } from "react";
import { Activity, TriangleAlert } from "lucide-react";
import { GBS_STEPS, ivigPlan, MG_AVOID, MG_STEPS, respRisk } from "@/lib/cadus/clinic41";

export default function MyastheniaGbsView() {
  const [tab, setTab] = useState<"mg" | "gbs">("mg");
  const [v, setV] = useState({ kg: "", fvc: "", nif: "", mep: "" });
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.-]/g, "").slice(0, 5) })} placeholder={ph} data-mg={k} /></label>;
  const nifRaw = Number(v.nif) || 0;
  const r = respRisk(Number(v.kg) || 0, Number(v.fvc) || 0, nifRaw > 0 ? -nifRaw : nifRaw, Number(v.mep) || 0);
  const iv = ivigPlan(Number(v.kg) || 0);
  return (
    <section className="cx-page cx-lab cx-mgbs">
      <header className="cx-page-h"><div><h1>Myasthenic Crisis &amp; GBS</h1><p>Spot respiratory failure early with the 20/30/40 rule, and treat myasthenic crisis and Guillain–Barré syndrome.</p></div></header>
      <h4>Breathing: 20/30/40 rule</h4>
      <div className="cx-c23-row">{n("kg", "Weight (kg)", "60")}{n("fvc", "FVC (litres)", "2.5")}{n("nif", "NIF / MIP (cmH2O)", "-40")}{n("mep", "MEP (cmH2O)", "60")}</div>
      <div className={`cx-cmp-out ${r.flags.length ? "cx-st-out" : "cx-ac-in"}`} data-mg="out" data-flags={r.flags.length}>
        {r.fvcPerKg !== null && <p>FVC {r.fvcPerKg} ml/kg.</p>}
        {r.flags.length > 0 && <ul>{r.flags.map((s) => <li key={s}>{s}</li>)}</ul>}
        <p><b>{r.action}</b></p>
      </div>
      {iv && <p className="cx-set-hint" data-mg="ivig"><b>{iv}</b></p>}
      <div className="cx-seg" role="tablist">{([["mg", "Myasthenic crisis"], ["gbs", "Guillain–Barré"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-mg-tab={k}>{l}</button>)}</div>
      {tab === "mg" ? (
        <>
          <ol className="cx-c23-steps" data-mg="steps">{MG_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
          <h4>Drugs that can worsen myasthenia</h4>
          <table className="cx-c23-table" data-mg="avoid"><thead><tr><th>Drug</th><th>Advice</th></tr></thead><tbody>{MG_AVOID.map(([d, a]) => <tr key={d}><td>{d}</td><td>{a}</td></tr>)}</tbody></table>
        </>
      ) : <ol className="cx-c23-steps" data-mg="gbs">{GBS_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>}
      <p className="cx-rs-foot"><Activity size={13} /> International consensus MG guidance (2020), EAN/PNS GBS guideline (2023). <TriangleAlert size={13} /> SpO2 falls late in neuromuscular failure: trust FVC and NIF, not the oximeter.</p>
    </section>
  );
}
