/**
 * Pre-eclampsia: risk factors and aspirin prevention, diagnosis from BP, proteinuria and organ
 * dysfunction, oral antihypertensives, monitoring and timing of birth.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { aspirinAdvice, PE_HIGH, PE_MOD, preEclampsiaDx } from "@/lib/cadus/clinic33";

export default function PreEclampsiaView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [hi, setHi] = useState<string[]>([]);
  const [mo, setMo] = useState<string[]>([]);
  const [weeks, setWeeks] = useState("");
  const [v, setV] = useState({ sbp: "", dbp: "", plt: "", creat: "" });
  const [x, setX] = useState({ proteinuria: false, altDouble: false, neuro: false, pulmOedema: false, fgr: false });
  const a = aspirinAdvice(hi.length, mo.length, Number(weeks) || 12);
  const dx = v.sbp && v.dbp ? preEclampsiaDx({ sbp: Number(v.sbp), dbp: Number(v.dbp), weeks: Number(weeks) || 30, plt: v.plt ? Number(v.plt) : undefined, creat: v.creat ? Number(v.creat) : undefined, ...x }) : null;
  const tg = (list: string[], set: (l: string[]) => void, s: string) => set(list.includes(s) ? list.filter((y) => y !== s) : [...list, s]);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const md = () => ["# Pre-eclampsia", "", `- ${a.text}`, dx ? `- ${dx.text}` : "", ...(dx?.plan ?? []).map((p) => `- ${p}`)].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-preec">
      <header className="cx-page-h"><div><h1>Pre-eclampsia</h1><p>Who needs aspirin to prevent it, how to diagnose it from BP, protein and organ function, which oral medicines, and when to deliver.</p></div></header>
      <label className="cx-field" style={{ maxWidth: 220 }}><span>Gestation (weeks)</span><input className="cx-input" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="12" data-pe="weeks" /></label>
      <div className="cx-c23-two">
        <div><h4>High-risk factors</h4><div className="cx-imaging-ticks">{PE_HIGH.map((r, i) => <label key={r} className="cx-pa-mine"><input type="checkbox" checked={hi.includes(r)} onChange={() => tg(hi, setHi, r)} data-pe-h={i} /> {r}</label>)}</div></div>
        <div><h4>Moderate-risk factors</h4><div className="cx-imaging-ticks">{PE_MOD.map((r, i) => <label key={r} className="cx-pa-mine"><input type="checkbox" checked={mo.includes(r)} onChange={() => tg(mo, setMo, r)} data-pe-m={i} /> {r}</label>)}</div></div>
      </div>
      <div className={`cx-cmp-out ${a.give ? "cx-ac-high" : "cx-ac-in"}`} data-pe="aspirin" data-give={String(a.give)}><p><b>{a.text}</b></p></div>
      <h4>Diagnosis</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Systolic</span><input className="cx-input" inputMode="numeric" value={v.sbp} onChange={(e) => setV({ ...v, sbp: n(e.target.value) })} data-pe="sbp" /></label>
        <label className="cx-field"><span>Diastolic</span><input className="cx-input" inputMode="numeric" value={v.dbp} onChange={(e) => setV({ ...v, dbp: n(e.target.value) })} data-pe="dbp" /></label>
        <label className="cx-field"><span>Platelets (×10³)</span><input className="cx-input" inputMode="numeric" value={v.plt} onChange={(e) => setV({ ...v, plt: n(e.target.value) })} data-pe="plt" /></label>
        <label className="cx-field"><span>Creatinine (mg/dL)</span><input className="cx-input" inputMode="decimal" value={v.creat} onChange={(e) => setV({ ...v, creat: n(e.target.value) })} /></label>
      </div>
      <div className="cx-c23-row">{([["proteinuria", "Proteinuria (PCR 0.3 or more, dipstick 2+)"], ["altDouble", "ALT twice normal or RUQ pain"], ["neuro", "Headache, visual disturbance or seizure"], ["pulmOedema", "Pulmonary oedema"], ["fgr", "Fetal growth restriction"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-pe={k} /> {l}</label>)}</div>
      {dx && <div className={`cx-cmp-out ${dx.level === "severe" ? "cx-st-out" : dx.level === "none" ? "cx-ac-in" : "cx-ac-high"}`} data-pe="dx" data-level={dx.level}><h3 className="cx-lab-h3">{dx.text}</h3><ul>{dx.plan.map((p) => <li key={p}>{p}</li>)}</ul></div>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Pre-eclampsia", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> ISSHP 2021, NICE NG133, FOGSI and ACOG. BP must be raised on two readings 4 hours apart (or once if 160/110 or more).</p>
    </section>
  );
}
