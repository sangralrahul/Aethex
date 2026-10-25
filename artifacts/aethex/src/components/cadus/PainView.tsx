/**
 * Pain Relief Planner: a stepwise analgesic plan for adults and children, chosen around kidney
 * function, GI and bleeding risk, heart disease, pregnancy, age and pain type.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { painPlan, type PainIn } from "@/lib/cadus/clinic32";

export default function PainView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [child, setChild] = useState(false);
  const [kg, setKg] = useState("");
  const [egfr, setEgfr] = useState("");
  const [type, setType] = useState<PainIn["type"]>("acute");
  const [sev, setSev] = useState<PainIn["severity"]>("moderate");
  const [x, setX] = useState({ giRisk: false, cardiac: false, anticoag: false, pregnant: false, elderly: false, liver: false, asthmaNsaid: false });
  const p = painPlan({ child, kg: Number(kg) || 0, type, severity: sev, egfr: egfr ? Number(egfr) : undefined, ...x });
  const md = () => ["# Pain relief plan", "", ...p.give.map((g, i) => `${i + 1}. ${g}`), ...(p.avoid.length ? ["", "## Avoid", ...p.avoid.map((a) => `- ${a}`)] : [])].join("\n");

  return (
    <section className="cx-page cx-lab cx-pain">
      <header className="cx-page-h"><div><h1>Pain Relief Planner</h1><p>A step-by-step analgesic plan for adults and children, chosen around kidney function, bleeding and stomach risk, heart disease, pregnancy, age and the type of pain.</p></div></header>
      <div className="cx-c23-row">
        <div className="cx-seg" role="radiogroup" aria-label="Patient">{([[false, "Adult"], [true, "Child"]] as const).map(([v, l]) => <button key={l} role="radio" aria-checked={child === v} className={child === v ? "on" : ""} onClick={() => setChild(v)} data-pn-child={String(v)}>{l}</button>)}</div>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder={child ? "20" : "70"} data-pn="kg" /></label>
        {!child && <label className="cx-field"><span>eGFR (optional)</span><input className="cx-input" inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value.replace(/\D/g, "").slice(0, 3))} data-pn="egfr" /></label>}
        <label className="cx-field"><span>Type of pain</span><select className="cx-select" value={type} onChange={(e) => setType(e.target.value as PainIn["type"])} data-pn="type"><option value="acute">Acute (injury, surgery, colic)</option><option value="chronic">Chronic musculoskeletal</option><option value="neuropathic">Neuropathic (burning, shooting)</option></select></label>
        <label className="cx-field"><span>Severity</span><select className="cx-select" value={sev} onChange={(e) => setSev(e.target.value as PainIn["severity"])} data-pn="sev"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></label>
      </div>
      <div className="cx-c23-row">{([["giRisk", "Ulcer or GI bleed history"], ["cardiac", "Heart failure or heart disease"], ["anticoag", "On an anticoagulant"], ["pregnant", "Pregnant or breastfeeding"], ["elderly", "Over 65"], ["liver", "Liver disease"], ["asthmaNsaid", "Asthma worsened by NSAIDs"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-pn={k} /> {l}</label>)}</div>
      <div className="cx-cmp-out" data-pn="out">
        <ol className="cx-c23-steps" data-pn="give">{p.give.map((g) => <li key={g}>{g}</li>)}</ol>
        {p.avoid.length > 0 && <div className="cx-anc-flags" data-pn="avoid">{p.avoid.map((a) => <p key={a} className="high"><TriangleAlert size={13} /> Avoid: {a}</p>)}</div>}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Pain relief plan", md())}><Printer size={14} /> Print</button></div>
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> WHO analgesic principles, BNF and NICE NG59/NG193. Treat the cause; reassess pain scores; step down as pain settles.</p>
    </section>
  );
}
