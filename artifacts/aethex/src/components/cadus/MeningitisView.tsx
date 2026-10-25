/**
 * Meningitis & Encephalitis: first-hour actions, whether CT is needed before LP, empirical
 * antibiotics and acyclovir by age and weight, dexamethasone, and contact prophylaxis.
 */
import { useState } from "react";
import { Bug, Printer, TriangleAlert } from "lucide-react";
import { CT_BEFORE_LP, MENINGITIS_FIRST, meningitisEmpiric, MENINGO_PROPHYLAXIS } from "@/lib/cadus/clinic35";

export default function MeningitisView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [age, setAge] = useState("");
  const [unit, setUnit] = useState<"y" | "m" | "d">("y");
  const [kg, setKg] = useState("");
  const [enc, setEnc] = useState(false);
  const [ct, setCt] = useState<string[]>([]);
  const n = Number(age) || 0;
  const years = unit === "y" ? n : unit === "m" ? n / 12 : n / 365;
  const e = meningitisEmpiric(years, Number(kg) || 0, enc);
  const md = () => ["# Meningitis: empirical treatment", "", ...e.drugs.map((d) => `- **${d.name}**: ${d.dose}`), `- ${e.dexa}`].join("\n");

  return (
    <section className="cx-page cx-lab cx-mening">
      <header className="cx-page-h"><div><h1>Meningitis &amp; Encephalitis</h1><p>The first hour, whether a CT is needed before LP, empirical antibiotics and acyclovir by age and weight, steroids, and prophylaxis for contacts.</p></div></header>
      <ol className="cx-c23-steps">{MENINGITIS_FIRST.map((s) => <li key={s}>{s}</li>)}</ol>
      <h4>CT before LP if any (do not delay antibiotics for it)</h4>
      <div className="cx-imaging-ticks">{CT_BEFORE_LP.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ct.includes(x)} onChange={() => setCt(ct.includes(x) ? ct.filter((y) => y !== x) : [...ct, x])} data-mn-ct={i} /> {x}</label>)}</div>
      <p className={`cx-set-hint ${ct.length ? "cx-bk-err" : ""}`} data-mn="ct"><b>{ct.length ? "CT head first; give antibiotics and dexamethasone before the scan." : "No CT needed before LP; do the LP now if there is no coagulopathy or shock."}</b></p>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="decimal" value={age} onChange={(ev) => setAge(ev.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="35" data-mn="age" /></label>
        <label className="cx-field"><span>Unit</span><select className="cx-select" value={unit} onChange={(ev) => setUnit(ev.target.value as typeof unit)} data-mn="unit"><option value="y">years</option><option value="m">months</option><option value="d">days</option></select></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(ev) => setKg(ev.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-mn="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={enc} onChange={(ev) => setEnc(ev.target.checked)} data-mn="enc" /> Encephalitis features (confusion, behaviour change, focal signs, seizures)</label>
      </div>
      {age && (
        <div className="cx-cmp-out cx-st-out" data-mn="out">
          <ul>{e.drugs.map((d) => <li key={d.name}><b>{d.name}</b>: {d.dose}</li>)}<li>{e.dexa}</li></ul>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Meningitis treatment", md())}><Printer size={14} /> Print</button></div>
        </div>
      )}
      <h4>Contacts</h4>
      <ul>{MENINGO_PROPHYLAXIS.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-set-hint">Interpret the CSF in the Body Fluid Analysis tool. Narrow treatment once the organism is known: pneumococcus 10–14 days, meningococcus 7 days, Listeria 21 days, HSV encephalitis acyclovir 14–21 days.</p>
      <p className="cx-rs-foot"><Bug size={13} /> IDSA 2004 and 2008, ESCMID 2016, NICE NG240. <TriangleAlert size={13} /> Adjust for kidney function and local resistance; seek infectious diseases advice.</p>
    </section>
  );
}
