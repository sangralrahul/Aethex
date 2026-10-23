/**
 * Insulin Planner: starting doses by weight for basal, basal-bolus or premix insulin, the
 * carbohydrate ratio and correction scale, how to titrate, and a chart for the patient to print.
 * All worked out on the device.
 */
import { useState } from "react";
import { Printer, Syringe, TriangleAlert } from "lucide-react";
import { insulinPlan, type InsulinRegimen, type Sensitivity } from "@/lib/cadus/clinic23";

const REGIMENS: [InsulinRegimen, string, string][] = [
  ["basal", "Basal only", "Glargine, degludec or NPH at bedtime, added to tablets in type 2 diabetes"],
  ["basal-bolus", "Basal-bolus", "Long-acting once a day and rapid-acting with each meal: type 1, and inpatients eating"],
  ["premix", "Premix twice a day", "30/70 or 25/75 before breakfast and dinner: common in Indian OPDs"],
];
const SENS: [Sensitivity, string][] = [["sensitive", "Sensitive: over 70, eGFR under 30, eating little, type 1 and lean"], ["standard", "Usual"], ["resistant", "Resistant: obese, on steroids, infection"]];

export default function InsulinView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [weight, setWeight] = useState("");
  const [reg, setReg] = useState<InsulinRegimen>("basal");
  const [sens, setSens] = useState<Sensitivity>("standard");
  const plan = insulinPlan(Number(weight), reg, sens);

  const md = () => {
    if (!plan) return "";
    const doses = reg === "basal" ? [`| Bedtime (or the same time every day) | Long-acting insulin | **${plan.basal} units** |`]
      : reg === "basal-bolus" ? [`| Before breakfast | Rapid-acting | **${plan.meals[0]} units** |`, `| Before lunch | Rapid-acting | **${plan.meals[1]} units** |`, `| Before dinner | Rapid-acting | **${plan.meals[2]} units** |`, `| Bedtime | Long-acting | **${plan.basal} units** |`]
      : [`| Before breakfast | Premix | **${plan.premix.am} units** |`, `| Before dinner | Premix | **${plan.premix.pm} units** |`];
    return [
      "# Insulin chart", `Weight ${weight} kg · ${REGIMENS.find((r) => r[0] === reg)![1]}`, "", "| When | Insulin | Dose |", "|---|---|---|", ...doses, "",
      reg === "basal-bolus" ? ["## Extra insulin for high sugar (add to the meal dose)", "", "| Sugar before the meal | Add |", "|---|---|", ...plan.correction.map((c) => `| ${c.range} | ${c.add} |`)].join("\n") : "",
      "", "## Changing the dose", ...plan.titration.map((t) => `- ${t}`), "",
      "## Low sugar (below 70 mg/dL, or sweating, shaking, confusion)", "- Take 15 g of fast sugar: 3 teaspoons of sugar or glucose in water, or half a glass of juice. Check again after 15 minutes and repeat if still low, then eat a meal or snack.", "- Always carry sugar or glucose tablets. Tell the doctor about any low sugar.",
      "", "_Check sugar before meals and at bedtime as advised. Store spare insulin in the fridge (not the freezer); the pen in use can be kept at room temperature for about 4 weeks._",
    ].filter((x) => x !== "").join("\n");
  };

  return (
    <section className="cx-page cx-lab cx-insulin">
      <header className="cx-page-h"><div><h1>Insulin Planner</h1><p>Starting doses by weight for basal, basal-bolus or premix insulin, the correction scale, how to titrate, and a chart for the patient.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="Regimen">{REGIMENS.map(([v, l]) => <button key={v} role="radio" aria-checked={reg === v} className={reg === v ? "on" : ""} onClick={() => setReg(v)} data-ins-reg={v}>{l}</button>)}</div>
      <p className="cx-set-hint">{REGIMENS.find((r) => r[0] === reg)![2]}</p>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-ins="weight" /></label>
        <label className="cx-field"><span>Insulin sensitivity</span><select className="cx-select" value={sens} onChange={(e) => setSens(e.target.value as Sensitivity)} data-ins="sens">{SENS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      {plan ? (
        <div className="cx-cmp-out" data-ins="out">
          <div className="cx-sim-stats">
            {reg === "basal" && <div><b data-ins="basal">{plan.basal} U</b><small>long-acting once a day ({plan.perKg} U/kg)</small></div>}
            {reg === "basal-bolus" && <><div><b data-ins="tdd">{plan.tdd} U</b><small>total a day ({plan.perKg} U/kg)</small></div><div><b>{plan.basal} U</b><small>long-acting once a day</small></div><div><b>{plan.meals[0]} U</b><small>rapid-acting with each meal</small></div></>}
            {reg === "premix" && <><div><b data-ins="am">{plan.premix.am} U</b><small>before breakfast</small></div><div><b>{plan.premix.pm} U</b><small>before dinner</small></div><div><b>{plan.tdd} U</b><small>total ({plan.perKg} U/kg)</small></div></>}
          </div>
          {reg === "basal-bolus" && (
            <>
              <p className="cx-set-hint">Carbohydrate ratio about 1 unit per {plan.icr} g; correction factor about 1 unit per {plan.isf} mg/dL above target.</p>
              <div className="cx-c23-scroll"><table className="cx-c23-table" data-ins="scale"><thead><tr><th>Sugar before the meal</th><th>Add to the meal dose</th></tr></thead><tbody>{plan.correction.map((c) => <tr key={c.range}><td>{c.range}</td><td>{c.add}</td></tr>)}</tbody></table></div>
            </>
          )}
          <h4>Titration</h4>
          <ul>{plan.titration.map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("Insulin chart", md())} data-ins="print"><Printer size={14} /> Print the patient's chart</button></div>
        </div>
      ) : (
        <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Syringe size={20} /></span><h3>Enter the weight</h3><p>The starting doses appear here.</p></div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Starting doses from ADA and RSSDI practice; adjust to the patient's sugars, meals, kidney function and other medicines. In DKA or HHS use the protocol for intravenous insulin instead.</p>
    </section>
  );
}
