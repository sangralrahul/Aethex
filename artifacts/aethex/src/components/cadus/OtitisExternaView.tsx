/**
 * Otitis Externa & Ear Wax: drops, wick, otomycosis, perforations, necrotising otitis externa red
 * flags, and safe wax removal.
 */
import { useState } from "react";
import { Ear, TriangleAlert } from "lucide-react";
import { oePlan, waxPlan, type OeInput } from "@/lib/cadus/clinic49";

export default function OtitisExternaView() {
  const [tab, setTab] = useState<"oe" | "wax">("oe");
  const [x, setX] = useState<OeInput>({ fungal: false, perforation: false, swollenShut: false, diabeticElderly: false, nervePalsy: false, cellulitis: false, severePain: false });
  const [w, setW] = useState({ perf: false, symptomatic: true });
  const r = oePlan(x);
  const cb = (k: keyof OeInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-oe={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-oe">
      <header className="cx-page-h"><div><h1>Otitis Externa &amp; Ear Wax</h1><p>A painful, itchy, discharging ear canal (pain on pulling the ear) is usually otitis externa: clean, drop, keep dry.</p></div></header>
      <div className="cx-seg" role="tablist">{([["oe", "Otitis externa"], ["wax", "Ear wax"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-oe-tab={k}>{l}</button>)}</div>
      {tab === "oe" ? (
        <>
          <div className="cx-imaging-ticks">{cb("severePain", "Severe pain, worse at night")}{cb("diabeticElderly", "Older with diabetes or immunosuppressed")}{cb("nervePalsy", "Facial weakness")}{cb("swollenShut", "Canal swollen shut")}{cb("cellulitis", "Redness spreading to ear or face")}{cb("fungal", "Itchy, white or black debris")}{cb("perforation", "Perforation or grommets")}</div>
          <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-oe="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
        </>
      ) : (
        <>
          <div className="cx-imaging-ticks">
            <label className="cx-pa-mine"><input type="checkbox" checked={w.symptomatic} onChange={(e) => setW({ ...w, symptomatic: e.target.checked })} data-oe="wax-sym" /> Blocked feeling, dull hearing or discomfort</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={w.perf} onChange={(e) => setW({ ...w, perf: e.target.checked })} data-oe="wax-perf" /> Past perforation, ear surgery or grommets</label>
          </div>
          <ol className="cx-c23-steps" data-oe="wax">{waxPlan(w.perf, w.symptomatic).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><Ear size={13} /> AAO-HNS acute otitis externa 2014, NICE CKS earwax. <TriangleAlert size={13} /> Pain out of proportion in an older diabetic: necrotising otitis externa.</p>
    </section>
  );
}
