/**
 * Hair Loss: the common types (pattern, telogen effluvium, alopecia areata, scarring, tinea), tests,
 * and treatment.
 */
import { useState } from "react";
import { Scissors, TriangleAlert } from "lucide-react";
import { alopeciaPlan } from "@/lib/cadus/clinic45";

const TYPES: [Parameters<typeof alopeciaPlan>[0], string][] = [["male", "Male pattern (temples, crown)"], ["female", "Female pattern (widened parting)"], ["telogen", "Diffuse shedding after illness, childbirth or stress"], ["areata", "Round smooth bald patches"], ["scarring", "Shiny skin, lost follicles, red or scaly edge"], ["tinea", "Scaly patches with broken hairs (child)"]];
export default function HairLossView() {
  const [t, setT] = useState<Parameters<typeof alopeciaPlan>[0]>("telogen");
  return (
    <section className="cx-page cx-lab cx-hairloss">
      <header className="cx-page-h"><div><h1>Hair Loss (Alopecia)</h1><p>Recognise the pattern, check the few tests that matter, and set realistic expectations for treatment.</p></div></header>
      <div className="cx-rm-list" data-alo="types">{TYPES.map(([k, l]) => <label key={k} className={`cx-rm-card ${t === k ? "on" : ""}`}><input type="radio" name="alo" checked={t === k} onChange={() => setT(k)} data-alo-t={k} /><span className="cx-rm-open"><b>{l}</b></span></label>)}</div>
      <ol className={`cx-c23-steps ${t === "scarring" ? "cx-st-out" : ""}`} data-alo="plan">{alopeciaPlan(t).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Scissors size={13} /> BAD guidelines (alopecia areata 2012), IADVL, AAD. <TriangleAlert size={13} /> Sudden hair loss with weight loss, fever or rash: look for systemic disease (SLE, syphilis, thyroid).</p>
    </section>
  );
}
