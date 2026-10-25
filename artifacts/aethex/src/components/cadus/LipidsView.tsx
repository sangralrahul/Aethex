/**
 * Lipids & CV Risk: the Lipid Association of India risk category and LDL target, how far LDL must
 * fall, statin intensity and add-ons, triglycerides, and monitoring.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { ldlPlan, lipidRisk, trigPlan, type LipidRiskIn } from "@/lib/cadus/clinic33";

export default function LipidsView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [ldl, setLdl] = useState("");
  const [tg, setTg] = useState("");
  const [statin, setStatin] = useState<"none" | "moderate" | "high">("none");
  const [x, setX] = useState<Omit<LipidRiskIn, "ldl">>({ ascvd: false, ascvdPlus: false, diabetes: false, diabetesTod: false, ckd: "none", fh: false, riskFactors: 0, lpaHigh: false });
  const r = lipidRisk({ ...x, ldl: Number(ldl) || 0 });
  const p = ldl ? ldlPlan(Number(ldl), r.target, statin) : null;
  const t = trigPlan(Number(tg));
  const tick = (k: "ascvd" | "ascvdPlus" | "diabetes" | "diabetesTod" | "fh" | "lpaHigh", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-lp={k} /> {l}</label>;
  const md = () => ["# Lipid plan", "", `- ${r.text}`, ldl ? `- LDL ${ldl} mg/dL; needs a ${p?.needed ?? 0}% fall` : "", ...(p?.steps ?? []).map((s) => `- ${s}`), t ? `- ${t}` : ""].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-lipids">
      <header className="cx-page-h"><div><h1>Lipids &amp; CV Risk</h1><p>The cardiovascular risk category and LDL target (Lipid Association of India), how much LDL must fall, the statin and add-ons to get there, and triglycerides.</p></div></header>
      <div className="cx-c23-row">
        {tick("ascvd", "Established ASCVD (MI, stroke, PAD, revascularisation)")}{tick("ascvdPlus", "Recurrent events or disease in several vessel beds")}{tick("diabetes", "Diabetes")}{tick("diabetesTod", "Diabetes with organ damage or 3+ risk factors")}{tick("fh", "Familial hypercholesterolaemia")}{tick("lpaHigh", "Lp(a) over 50 mg/dL")}
        <label className="cx-field"><span>CKD</span><select className="cx-select" value={x.ckd} onChange={(e) => setX({ ...x, ckd: e.target.value as LipidRiskIn["ckd"] })} data-lp="ckd"><option value="none">None or stage 1–2</option><option value="3">Stage 3</option><option value="4-5">Stage 4–5</option></select></label>
        <label className="cx-field"><span>Other risk factors (smoking, hypertension, family history, age)</span><select className="cx-select" value={x.riskFactors} onChange={(e) => setX({ ...x, riskFactors: Number(e.target.value) })} data-lp="rf">{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}{n === 4 ? "+" : ""}</option>)}</select></label>
      </div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>LDL (mg/dL)</span><input className="cx-input" inputMode="numeric" value={ldl} onChange={(e) => setLdl(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="140" data-lp="ldl" /></label>
        <label className="cx-field"><span>Triglycerides (mg/dL)</span><input className="cx-input" inputMode="numeric" value={tg} onChange={(e) => setTg(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="180" data-lp="tg" /></label>
        <label className="cx-field"><span>Statin now</span><select className="cx-select" value={statin} onChange={(e) => setStatin(e.target.value as typeof statin)} data-lp="statin"><option value="none">None</option><option value="moderate">Moderate intensity</option><option value="high">High intensity</option></select></label>
      </div>
      <div className={`cx-cmp-out ${r.risk === "extreme" || r.risk === "very high" ? "cx-st-out" : r.risk === "high" ? "cx-ac-high" : "cx-ac-in"}`} data-lp="out" data-risk={r.risk}>
        <h3 className="cx-lab-h3" data-lp="risk">{r.text}</h3>
        <p className="cx-set-hint">ESC target for comparison: under {r.esc} mg/dL; non-HDL target is the LDL target + 30.</p>
        {p && <><p data-lp="needed"><b>{p.needed ? `LDL needs to fall by ${p.needed}%` : "LDL at target"}</b></p><ol className="cx-c23-steps" data-lp="steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol></>}
        {t && <p data-lp="tgout">{t}</p>}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Lipid plan", md())}><Printer size={14} /> Print</button></div>
      </div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Lipid Association of India 2023 consensus and ESC/EAS 2019. Statin muscle pain: check CK and thyroid, try another statin or alternate-day dosing before stopping.</p>
    </section>
  );
}
