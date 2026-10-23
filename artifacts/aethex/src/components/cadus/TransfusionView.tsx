/**
 * Blood Transfusion Helper: how much of each product for the patient's weight (and Hb for red
 * cells), the rate and handling, when to transfuse, and what to do in a transfusion reaction.
 * All on the device.
 */
import { useState } from "react";
import { Droplet, Printer, Siren, TriangleAlert } from "lucide-react";
import { REACTION_STEPS, TRANSFUSION_THRESHOLDS, transfusionDose, type BloodProduct } from "@/lib/cadus/clinic23";

const PRODUCTS: [BloodProduct, string][] = [["prbc", "Packed red cells"], ["platelets", "Platelets"], ["ffp", "Fresh frozen plasma"], ["cryo", "Cryoprecipitate"]];
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export default function TransfusionView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"dose" | "when" | "reaction">("dose");
  const [p, setP] = useState<BloodProduct>("prbc");
  const [weight, setWeight] = useState("");
  const [child, setChild] = useState(false);
  const [hb, setHb] = useState("");
  const [target, setTarget] = useState("");
  const d = transfusionDose(p, Number(weight), child, { hb: num(hb), targetHb: num(target) });

  return (
    <section className="cx-page cx-lab cx-tx">
      <header className="cx-page-h"><div><h1>Blood Transfusion Helper</h1><p>How much to give for the weight, how fast, how the product is handled, when to transfuse, and the steps for a transfusion reaction.</p></div></header>
      <div className="cx-seg" role="tablist">{([["dose", "Dose"], ["when", "When to transfuse"], ["reaction", "Reaction"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-tx-tab={v}>{v === "reaction" && <Siren size={13} />} {l}</button>)}</div>
      {tab === "dose" && (
        <>
          <div className="cx-oncall-calls" role="radiogroup" aria-label="Product">{PRODUCTS.map(([v, l]) => <button key={v} role="radio" aria-checked={p === v} className={p === v ? "on" : ""} onClick={() => setP(v)} data-tx-product={v}>{l}</button>)}</div>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-tx="weight" /></label>
            {p === "prbc" && <label className="cx-field"><span>Hb now (g/dL)</span><input className="cx-input" inputMode="decimal" value={hb} onChange={(e) => setHb(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="6.5" data-tx="hb" /></label>}
            {p === "prbc" && <label className="cx-field"><span>Target Hb</span><input className="cx-input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder={child ? "10" : "8"} data-tx="target" /></label>}
            <label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-tx="child" /> Child</label>
          </div>
          {d ? (
            <div className="cx-cmp-out" data-tx="out">
              <h3 className="cx-lab-h3" data-tx="amount"><Droplet size={15} /> {d.amount}</h3>
              <ul>{d.detail.map((x) => <li key={x}>{x}</li>)}</ul>
              <p><b>Rate:</b> {d.rate}</p>
              <p><b>Handling:</b> {d.storage}</p>
              <p className="cx-set-hint">Before starting: consent, two-person bedside check of the patient's identity, the bag and the compatibility label, and baseline vitals; observe closely for the first 15 minutes.</p>
            </div>
          ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Droplet size={20} /></span><h3>Enter the weight</h3><p>The dose appears here.</p></div>}
        </>
      )}
      {tab === "when" && (
        <div className="cx-c23-scroll"><table className="cx-c23-table" data-tx="thresholds"><thead><tr><th>Product</th><th>Usually when</th></tr></thead><tbody>{TRANSFUSION_THRESHOLDS.map((t) => <tr key={t.product}><td><b>{t.product}</b></td><td>{t.when}</td></tr>)}</tbody></table></div>
      )}
      {tab === "reaction" && (
        <div className="cx-cmp-out" data-tx="reaction">
          <ol className="cx-c23-steps">{REACTION_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Transfusion reaction: what to do", `# Transfusion reaction: what to do\n\n${REACTION_STEPS.map((s, i) => `${i + 1}. ${s}`).join("\n")}`)}><Printer size={14} /> Print for the ward</button></div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Follow your blood bank's policy and the National Blood Transfusion Council guidance; doses are approximate and the patient's response decides the next dose.</p>
    </section>
  );
}
