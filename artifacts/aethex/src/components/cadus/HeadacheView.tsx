/**
 * Headache & Migraine: red flags with what to do, medication-overuse headache, acute migraine
 * treatment and prophylaxis chosen around the patient, and other primary headaches.
 */
import { useState } from "react";
import { BrainCircuit, Printer, TriangleAlert } from "lucide-react";
import { HEADACHE_RED, headacheRedFlags, migrainePlan, OTHER_HEADACHE } from "@/lib/cadus/clinic30";

export default function HeadacheView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [red, setRed] = useState<string[]>([]);
  const [m, setM] = useState({ days: "", an: "", tr: "", asthma: false, pregnancy: false, cad: false, depression: false, obese: false, childbearing: false });
  const rf = headacheRedFlags(red);
  const plan = migrainePlan({ daysPerMonth: Number(m.days) || 0, analgesicDays: Number(m.an) || 0, triptanDays: Number(m.tr) || 0, asthma: m.asthma, pregnancy: m.pregnancy, cad: m.cad, depression: m.depression, obese: m.obese, childbearing: m.childbearing });
  const n2 = (s: string) => s.replace(/\D/g, "").slice(0, 2);
  const md = () => ["# Migraine plan", "", "## For an attack", ...plan.acute.map((a) => `- ${a}`), plan.moh ? `\n**${plan.moh}**` : "", plan.prophylaxis.length ? "\n## To prevent attacks" : "", ...plan.prophylaxis.map((p) => `- ${p}`)].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-headache">
      <header className="cx-page-h"><div><h1>Headache &amp; Migraine</h1><p>Red flags and what to do about them, medication-overuse headache, acute migraine treatment and prevention chosen around the patient.</p></div></header>
      <h4>Red flags</h4>
      <div className="cx-imaging-ticks" data-hd="red">{HEADACHE_RED.map((r) => <label key={r.id} className="cx-pa-mine"><input type="checkbox" checked={red.includes(r.id)} onChange={() => setRed(red.includes(r.id) ? red.filter((x) => x !== r.id) : [...red, r.id])} data-hd-r={r.id} /> {r.label}</label>)}</div>
      <div className={`cx-cmp-out ${rf.level === "urgent" ? "cx-st-out" : rf.level === "soon" ? "cx-ac-high" : "cx-ac-in"}`} data-hd="rf" data-level={rf.level}><p><b>{rf.text}</b></p></div>
      <h4>Migraine</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Headache days a month</span><input className="cx-input" inputMode="numeric" value={m.days} onChange={(e) => setM({ ...m, days: n2(e.target.value) })} data-hd="days" /></label>
        <label className="cx-field"><span>Days with painkillers</span><input className="cx-input" inputMode="numeric" value={m.an} onChange={(e) => setM({ ...m, an: n2(e.target.value) })} data-hd="an" /></label>
        <label className="cx-field"><span>Days with triptans</span><input className="cx-input" inputMode="numeric" value={m.tr} onChange={(e) => setM({ ...m, tr: n2(e.target.value) })} /></label>
      </div>
      <div className="cx-c23-row">{([["asthma", "Asthma"], ["pregnancy", "Pregnant"], ["cad", "Heart or vascular disease"], ["depression", "Depression or poor sleep"], ["obese", "Overweight"], ["childbearing", "Woman who could become pregnant"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.checked })} data-hd={k} /> {l}</label>)}</div>
      <div className="cx-cmp-out" data-hd="plan">
        <h4>For an attack</h4><ul>{plan.acute.map((a) => <li key={a}>{a}</li>)}</ul>
        {plan.moh && <p className="cx-bk-err" data-hd="moh"><TriangleAlert size={13} /> {plan.moh}</p>}
        {plan.prophylaxis.length > 0 ? <><h4>Prevention</h4><ul data-hd="proph">{plan.prophylaxis.map((p) => <li key={p}>{p}</li>)}</ul></> : <p className="cx-set-hint">Prevention is offered with 4 or more headache days a month, or disabling attacks.</p>}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Migraine plan", md())}><Printer size={14} /> Print plan</button></div>
      </div>
      <h4>Other headaches</h4><ul>{OTHER_HEADACHE.map((o) => <li key={o}>{o}</li>)}</ul>
      <p className="cx-rs-foot"><BrainCircuit size={13} /> SNOOP4 red flags; NICE CG150 and SIGN 155 for migraine. <TriangleAlert size={13} /> Check BP and fundi in every new headache.</p>
    </section>
  );
}
