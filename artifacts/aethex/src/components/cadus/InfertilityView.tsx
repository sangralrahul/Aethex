/**
 * Infertility Work-up: when to investigate, tests for her, and semen analysis against WHO 2021 lower
 * reference limits.
 */
import { useState } from "react";
import { Sprout, TriangleAlert } from "lucide-react";
import { FEMALE_TESTS, semen, SEMEN_REF, whenToInvestigate, type SemenInput } from "@/lib/cadus/clinic44";

export default function InfertilityView() {
  const [age, setAge] = useState("");
  const [months, setMonths] = useState("");
  const [risk, setRisk] = useState(false);
  const [s, setS] = useState<SemenInput>({ volume: 0, concentration: 0, total: 0, motility: 0, progressive: 0, morphology: 0, vitality: 0 });
  const entered = Object.values(s).some((x) => x > 0);
  const r = semen(s);
  return (
    <section className="cx-page cx-lab cx-infertility">
      <header className="cx-page-h"><div><h1>Infertility Work-up</h1><p>When to start investigating, the first-line tests for both partners, and how to read a semen analysis.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Woman's age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="32" data-ifw="age" /></label>
        <label className="cx-field"><span>Months trying</span><input className="cx-input" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="12" data-ifw="months" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={risk} onChange={(e) => setRisk(e.target.checked)} data-ifw="risk" /> Known risk (irregular periods, endometriosis, pelvic infection, surgery, chemotherapy, male factor)</label>
      </div>
      <div className="cx-cmp-out cx-ac-in" data-ifw="when"><p><b>{whenToInvestigate(Number(age) || 0, Number(months) || 0, risk)}</b></p></div>
      <h4>Her tests</h4><ul>{FEMALE_TESTS.map((t) => <li key={t}>{t}</li>)}</ul>
      <h4>Semen analysis (after 2–7 days' abstinence)</h4>
      <div className="cx-nihss">{SEMEN_REF.map((x) => <label key={x.key} className="cx-field"><span>{x.label} ({x.unit}; lower limit {x.low})</span><input className="cx-input" inputMode="decimal" value={s[x.key] || ""} onChange={(e) => setS({ ...s, [x.key]: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 6)) || 0 })} data-ifw={x.key} /></label>)}</div>
      {entered && <div className={`cx-cmp-out ${r.flags.length ? "cx-ac-high" : "cx-ac-in"}`} data-ifw="semen" data-flags={r.flags.length}>{r.flags.length > 0 && <ul>{r.flags.map((f) => <li key={f}>{f}</li>)}</ul>}<p><b>{r.text}</b></p></div>}
      <p className="cx-rs-foot"><Sprout size={13} /> WHO infertility guideline 2023, WHO laboratory manual 6th edition (2021), NICE CG156, ICMR ART guidelines. <TriangleAlert size={13} /> Offer support: infertility causes real distress for both partners.</p>
    </section>
  );
}
