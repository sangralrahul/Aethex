/**
 * Oncology Emergencies: hypercalcaemia of malignancy, tumour lysis syndrome (Cairo–Bishop and
 * prophylaxis), spinal cord compression and SVC obstruction.
 */
import { useState } from "react";
import { Ribbon, TriangleAlert } from "lucide-react";
import { cairoBishop, correctedCa, hypercalcaemia, MSCC, SVCO, tlsPlan } from "@/lib/cadus/clinic36";

export default function OncoEmergView() {
  const [tab, setTab] = useState<"ca" | "tls" | "mscc" | "svco">("ca");
  const [v, setV] = useState({ ca: "", alb: "", crcl: "", ua: "", k: "", p: "", ca2: "", kg: "" });
  const [child, setChild] = useState(false);
  const [risk, setRisk] = useState<"low" | "intermediate" | "high">("high");
  const [g6pd, setG6pd] = useState(false);
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} placeholder={ph} data-oe={k} /></label>;
  const cc = v.ca && v.alb ? correctedCa(Number(v.ca), Number(v.alb)) : null;
  const hc = cc !== null ? hypercalcaemia(cc, v.crcl ? Number(v.crcl) : null) : null;
  const num = (s: string) => (s ? Number(s) : null);
  const cb = cairoBishop({ uricAcid: num(v.ua), k: num(v.k), phosphate: num(v.p), ca: num(v.ca2), child });

  return (
    <section className="cx-page cx-lab cx-oncoemerg">
      <header className="cx-page-h"><div><h1>Oncology Emergencies</h1><p>Hypercalcaemia of malignancy, tumour lysis syndrome, metastatic spinal cord compression and superior vena cava obstruction.</p></div></header>
      <div className="cx-seg" role="tablist">{([["ca", "Hypercalcaemia"], ["tls", "Tumour lysis"], ["mscc", "Cord compression"], ["svco", "SVC obstruction"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-oe-tab={k}>{l}</button>)}</div>
      {tab === "ca" && (
        <>
          <div className="cx-c23-row">{n("ca", "Calcium (mg/dL)", "12.5")}{n("alb", "Albumin (g/dL)", "2.5")}{n("crcl", "CrCl (ml/min)", "60")}</div>
          {hc && <div className={`cx-cmp-out ${hc.level === "Severe" ? "cx-st-out" : hc.level === "Normal" ? "cx-ac-in" : "cx-ac-high"}`} data-oe="ca-out" data-level={hc.level}><h3 className="cx-lab-h3">Corrected calcium {cc} mg/dL: {hc.level.toLowerCase()}</h3><ul>{hc.steps.map((s) => <li key={s}>{s}</li>)}</ul></div>}
        </>
      )}
      {tab === "tls" && (
        <>
          <div className="cx-c23-row">{n("ua", "Uric acid (mg/dL)", "9")}{n("k", "Potassium", "6.1")}{n("p", "Phosphate (mg/dL)", "5")}{n("ca2", "Calcium (mg/dL)", "8")}{n("kg", "Weight (kg)", "60")}
            <label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-oe="child" /> Child</label>
          </div>
          <p className={`cx-set-hint ${cb.count >= 2 ? "cx-bk-err" : ""}`} data-oe="cb"><b>{cb.count >= 2 ? `Laboratory TLS (Cairo–Bishop): ${cb.items.join(", ")}` : `${cb.count} of 4 laboratory criteria${cb.items.length ? `: ${cb.items.join(", ")}` : ""} (2 or more within 3 days before to 7 days after treatment = laboratory TLS)`}</b>. Clinical TLS adds creatinine 1.5 times normal, arrhythmia or seizure.</p>
          <div className="cx-c23-row">
            <label className="cx-field"><span>TLS risk</span><select className="cx-select" value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)} data-oe="risk"><option value="high">High (Burkitt, ALL with high WBC, bulky disease)</option><option value="intermediate">Intermediate</option><option value="low">Low (most solid tumours)</option></select></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={g6pd} onChange={(e) => setG6pd(e.target.checked)} data-oe="g6pd" /> G6PD deficiency (or not yet tested)</label>
          </div>
          <div className="cx-cmp-out cx-ac-high" data-oe="tls"><ul>{tlsPlan(risk, g6pd, Number(v.kg) || 0).map((s) => <li key={s}>{s}</li>)}</ul></div>
        </>
      )}
      {tab === "mscc" && <div className="cx-cmp-out cx-st-out" data-oe="mscc"><ol className="cx-c23-steps">{MSCC.map((s) => <li key={s}>{s}</li>)}</ol></div>}
      {tab === "svco" && <div className="cx-cmp-out cx-ac-high" data-oe="svco"><ul>{SVCO.map((s) => <li key={s}>{s}</li>)}</ul></div>}
      <p className="cx-set-hint">Fever with neutropenia: see the Febrile Neutropenia tool.</p>
      <p className="cx-rs-foot"><Ribbon size={13} /> ESMO, ASCO, NICE NG234 (MSCC), Cairo–Bishop 2004. <TriangleAlert size={13} /> Involve oncology early; check G6PD before rasburicase.</p>
    </section>
  );
}
