/**
 * Lymphadenopathy: when an enlarged node needs work-up, TB lymphadenitis in India, and when to biopsy.
 */
import { useState } from "react";
import { CircleDot, TriangleAlert } from "lucide-react";
import { nodeAssess, type NodeInput } from "@/lib/cadus/clinic45";

export default function LymphNodeView() {
  const [x, setX] = useState<NodeInput>({ age: 0, sizeCm: 0, site: "cervical", weeks: 0, hard: false, generalised: false, bSymptoms: false, infection: false });
  const r = nodeAssess(x);
  const num = (k: "age" | "sizeCm" | "weeks", l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={x[k] || ""} onChange={(e) => setX({ ...x, [k]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} placeholder={ph} data-lnd={k} /></label>;
  const cb = (k: "hard" | "generalised" | "bSymptoms" | "infection", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-lnd={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-nodes">
      <header className="cx-page-h"><div><h1>Lymphadenopathy</h1><p>Decide which enlarged nodes can be watched and which need urgent work-up for TB, lymphoma or cancer.</p></div></header>
      <div className="cx-c23-row">
        {num("age", "Age", "30")}{num("sizeCm", "Size (cm)", "1.5")}{num("weeks", "Weeks present", "3")}
        <label className="cx-field"><span>Site</span><select className="cx-select" value={x.site} onChange={(e) => setX({ ...x, site: e.target.value as NodeInput["site"] })} data-lnd="site"><option value="cervical">Neck (cervical)</option><option value="supraclavicular">Supraclavicular</option><option value="axillary">Axillary</option><option value="inguinal">Inguinal</option><option value="epitrochlear">Epitrochlear</option></select></label>
      </div>
      <div className="cx-imaging-ticks">{cb("hard", "Hard, fixed or matted")}{cb("generalised", "Generalised (2 or more regions)")}{cb("bSymptoms", "Fever, night sweats, weight loss")}{cb("infection", "Nearby infection (throat, skin, teeth)")}</div>
      <div className={`cx-cmp-out ${r.level === "urgent" ? "cx-st-out" : r.level === "investigate" ? "cx-ac-high" : "cx-ac-in"}`} data-lnd="out" data-level={r.level}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><CircleDot size={13} /> AAFP lymphadenopathy review, NICE NG12, NTEP extrapulmonary TB guidance. <TriangleAlert size={13} /> Don't give steroids before a diagnosis: they can mask lymphoma.</p>
    </section>
  );
}
