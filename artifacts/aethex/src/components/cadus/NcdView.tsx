/**
 * BP & Sugar Protocols: step-up treatment for hypertension (India Hypertension Control Initiative
 * style) and type 2 diabetes (RSSDI/ADA) from today's reading and the current step, with targets.
 */
import { useState } from "react";
import { Activity, Droplets, Printer, TriangleAlert } from "lucide-react";
import { BP_STEPS, bpAdvice, dmAdvice } from "@/lib/cadus/clinic26";

export default function NcdView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"bp" | "dm">("bp");
  const [bp, setBp] = useState("");
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [flags, setFlags] = useState({ diabetes: false, ckd: false, pregnant: false, ascvd: false, hf: false, obese: false, symptomatic: false, onMetformin: false });
  const [a1c, setA1c] = useState("");
  const [egfr, setEgfr] = useState("");
  const m = /(\d{2,3})\s*\/\s*(\d{2,3})/.exec(bp);
  const b = m ? bpAdvice(Number(m[1]), Number(m[2]), { step, age: Number(age) || undefined, diabetes: flags.diabetes, ckd: flags.ckd, pregnant: flags.pregnant }) : null;
  const d = a1c ? dmAdvice(Number(a1c), { onMetformin: flags.onMetformin, ascvd: flags.ascvd, hf: flags.hf, ckd: flags.ckd, obese: flags.obese, symptomatic: flags.symptomatic, egfr: egfr ? Number(egfr) : undefined }) : null;
  const tick = (k: keyof typeof flags, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={flags[k]} onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })} data-ncd={k} /> {l}</label>;

  return (
    <section className="cx-page cx-lab cx-ncd">
      <header className="cx-page-h"><div><h1>BP &amp; Sugar Protocols</h1><p>For the OPD: what to start or step up for hypertension and type 2 diabetes from today's reading, with targets and what to check every year.</p></div></header>
      <div className="cx-seg" role="tablist">{([["bp", "Hypertension"], ["dm", "Type 2 diabetes"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-ncd-tab={v}>{v === "bp" ? <Activity size={13} /> : <Droplets size={13} />} {l}</button>)}</div>
      {tab === "bp" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Today's BP</span><input className="cx-input" value={bp} onChange={(e) => setBp(e.target.value.slice(0, 9))} placeholder="152/94" data-ncd="bp" /></label>
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="56" /></label>
            <label className="cx-field"><span>Current step</span><select className="cx-select" value={step} onChange={(e) => setStep(Number(e.target.value))} data-ncd="step"><option value={0}>Not on treatment</option>{BP_STEPS.map((s) => <option key={s.step} value={s.step}>Step {s.step}: {s.drug.split(" (")[0]}</option>)}</select></label>
          </div>
          <div className="cx-c23-row">{tick("diabetes", "Diabetes")}{tick("ckd", "Chronic kidney disease")}{tick("pregnant", "Pregnant")}</div>
          {b && (
            <div className="cx-cmp-out" data-ncd="bp-out">
              <h3 className="cx-lab-h3" data-ncd="bp-action">{b.action}</h3>
              <p><b>{b.grade}</b> · Target: {b.target}</p>
              <ul>{b.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              <div className="cx-c23-scroll"><table className="cx-c23-table"><thead><tr><th>Step</th><th>Treatment</th></tr></thead><tbody>{BP_STEPS.map((s) => <tr key={s.step} className={s.step === b.step ? "cx-ncd-on" : ""}><td>{s.step}</td><td>{s.drug}</td></tr>)}</tbody></table></div>
              <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Hypertension plan", `# Hypertension plan\n\nBP today ${bp} (${b.grade})\n\n**${b.action}**\n\nTarget: ${b.target}\n\n${b.notes.map((n) => `- ${n}`).join("\n")}`)}><Printer size={14} /> Print</button></div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>HbA1c (%)</span><input className="cx-input" inputMode="decimal" value={a1c} onChange={(e) => setA1c(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="8.4" data-ncd="a1c" /></label>
            <label className="cx-field"><span>eGFR (optional)</span><input className="cx-input" inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="60" /></label>
          </div>
          <div className="cx-c23-row">{tick("onMetformin", "On metformin")}{tick("ascvd", "Heart disease or stroke")}{tick("hf", "Heart failure")}{tick("ckd", "CKD")}{tick("obese", "Obesity")}{tick("symptomatic", "Weight loss, thirst, ketones")}</div>
          {d && (
            <div className="cx-cmp-out" data-ncd="dm-out">
              <h3 className="cx-lab-h3">{d.control}</h3>
              <ol className="cx-c23-steps">{d.action.map((x) => <li key={x}>{x}</li>)}</ol>
              <h4>Targets and yearly checks</h4><ul>{d.targets.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
        </>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Based on the India Hypertension Control Initiative protocol and RSSDI/ADA guidance; follow your state's NCD protocol and adjust for the patient.</p>
    </section>
  );
}
