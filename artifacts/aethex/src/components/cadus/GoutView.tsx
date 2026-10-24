/**
 * Gout & Uric Acid: acute flare treatment by kidney function and comorbidity, when to start
 * urate-lowering therapy, allopurinol start-low go-slow titration to target, and lifestyle.
 */
import { useState } from "react";
import { Footprints, Printer, TriangleAlert } from "lucide-react";
import { allopurinolPlan, GOUT_LIFESTYLE, goutFlare, ULT_INDICATIONS } from "@/lib/cadus/clinic30";

export default function GoutView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [egfr, setEgfr] = useState("");
  const [urate, setUrate] = useState("");
  const [x, setX] = useState({ onStatinMacrolide: false, pepticUlcer: false, diabetes: false, tophi: false });
  const e = egfr === "" ? null : Number(egfr);
  const flare = goutFlare(e, x);
  const ult = allopurinolPlan(e ?? 90, Number(urate) || 0, x.tophi);
  const md = () => ["# Gout plan", "", "## Flare", ...flare.map((f) => `- ${f}`), "", "## Long term", `- ${ult.start}`, ...ult.steps.map((s) => `- ${s}`), `- ${ult.target}`, "", ...GOUT_LIFESTYLE.map((l) => `- ${l}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-gout">
      <header className="cx-page-h"><div><h1>Gout &amp; Uric Acid</h1><p>Treating a flare by kidney function, when to start allopurinol, titrating it to the target urate, and what to change in diet and medicines.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>eGFR or CrCl (ml/min)</span><input className="cx-input" inputMode="numeric" value={egfr} onChange={(ev) => setEgfr(ev.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="90" data-gt="egfr" /></label>
        <label className="cx-field"><span>Serum urate (mg/dL)</span><input className="cx-input" inputMode="decimal" value={urate} onChange={(ev) => setUrate(ev.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="8.5" data-gt="urate" /></label>
        {([["onStatinMacrolide", "On clarithromycin, cyclosporine or similar"], ["pepticUlcer", "Peptic ulcer or bleeding"], ["diabetes", "Diabetes"], ["tophi", "Tophi"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(ev) => setX({ ...x, [k]: ev.target.checked })} data-gt={k} /> {l}</label>)}
      </div>
      <div className="cx-cmp-out" data-gt="flare"><h4>Flare</h4><ul>{flare.map((f) => <li key={f}>{f}</li>)}</ul></div>
      <h4>Start urate-lowering therapy if</h4><ul>{ULT_INDICATIONS.map((u) => <li key={u}>{u}</li>)}</ul>
      <div className="cx-cmp-out" data-gt="ult"><p><b>{ult.start}</b></p><ul>{ult.steps.map((s) => <li key={s}>{s}</li>)}</ul><p data-gt="target"><b>{ult.target}</b></p></div>
      <h4>Lifestyle and other medicines</h4><ul>{GOUT_LIFESTYLE.map((l) => <li key={l}>{l}</li>)}</ul>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Gout plan", md())}><Printer size={14} /> Print plan</button></div>
      <p className="cx-rs-foot"><Footprints size={13} /> EULAR 2016, ACR 2020 and BSR guidance. <TriangleAlert size={13} /> A hot swollen joint with fever may be septic arthritis: aspirate before calling it gout.</p>
    </section>
  );
}
