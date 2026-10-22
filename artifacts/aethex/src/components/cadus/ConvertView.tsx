/**
 * Dose Converter: steroid equivalents (BNF) and opioid switches through oral morphine
 * equivalents, with the usual 25–50% reduction for incomplete cross-tolerance. On this device.
 */
import { useState } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { convertOpioid, convertSteroid, OPIOIDS, round, STEROIDS } from "@/lib/cadus/bedside";

export default function ConvertView() {
  const [tab, setTab] = useState<"steroid" | "opioid">("steroid");
  const [sFrom, setSFrom] = useState("prednisolone");
  const [sDose, setSDose] = useState("40");
  const [oFrom, setOFrom] = useState("morphine-oral");
  const [oTo, setOTo] = useState("oxycodone-oral");
  const [oDose, setODose] = useState("60");
  const sd = Number(sDose), od = Number(oDose);
  const switched = Number.isFinite(od) && od > 0 ? convertOpioid(oFrom, od, oTo) : null;
  const toUnit = OPIOIDS.find((o) => o.id === oTo)?.unit ?? "mg/day";
  const fromUnit = OPIOIDS.find((o) => o.id === oFrom)?.unit ?? "mg/day";

  return (
    <section className="cx-page cx-bs cx-conv">
      <header className="cx-page-h"><div><h1>Dose Converter</h1><p>Steroid equivalents and opioid switches, worked out on this device.</p></div></header>
      <div className="cx-seg cx-rex-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "steroid"} className={tab === "steroid" ? "on" : ""} onClick={() => setTab("steroid")} data-conv-tab="steroid">Steroids</button>
        <button role="tab" aria-selected={tab === "opioid"} className={tab === "opioid" ? "on" : ""} onClick={() => setTab("opioid")} data-conv-tab="opioid">Opioids</button>
      </div>
      {tab === "steroid" ? (
        <>
          <div className="cx-inf-calc">
            <label className="cx-field"><span>From</span><select className="cx-select" value={sFrom} onChange={(e) => setSFrom(e.target.value)} data-conv="s-from">{STEROIDS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className="cx-field"><span>Dose (mg)</span><input className="cx-input" inputMode="decimal" value={sDose} onChange={(e) => setSDose(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))} data-conv="s-dose" /></label>
          </div>
          <div className="cx-lab-table" data-conv="s-table"><table><thead><tr><th>Equivalent</th><th>Dose</th><th></th></tr></thead><tbody>
            {STEROIDS.map((s) => { const v = Number.isFinite(sd) && sd > 0 ? convertSteroid(sFrom, sd, s.id) : null; return <tr key={s.id} className={s.id === sFrom ? "s-ok" : ""} data-conv-row={s.id}><td><b>{s.name}</b></td><td><b>{v === null ? "—" : `${round(v, 2)} mg`}</b></td><td><small>{s.note}</small></td></tr>; })}
          </tbody></table></div>
          <p className="cx-rs-foot"><TriangleAlert size={13} /> Anti-inflammatory equivalence (BNF). Mineralocorticoid effects differ: hydrocortisone, not dexamethasone, for adrenal insufficiency.</p>
        </>
      ) : (
        <>
          <div className="cx-inf-calc">
            <label className="cx-field"><span>From</span><select className="cx-select" value={oFrom} onChange={(e) => setOFrom(e.target.value)} data-conv="o-from">{OPIOIDS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <label className="cx-field"><span>Total daily dose ({fromUnit})</span><input className="cx-input" inputMode="decimal" value={oDose} onChange={(e) => setODose(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))} data-conv="o-dose" /></label>
            <ArrowRight size={18} className="cx-conv-arrow" />
            <label className="cx-field"><span>To</span><select className="cx-select" value={oTo} onChange={(e) => setOTo(e.target.value)} data-conv="o-to">{OPIOIDS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
          </div>
          {switched ? (
            <div className="cx-inf-head" data-conv="o-out">
              <div><small>Oral morphine equivalent</small><b>{round(switched.ome, 1)} mg/day</b></div>
              <div><small>Equal dose</small><b>{round(switched.target, 1)} {toUnit}</b></div>
              <div className="ok"><small>Start at (25–50% less)</small><b data-conv="o-start">{round(switched.reduced[0], 1)}–{round(switched.reduced[1], 1)} {toUnit}</b></div>
            </div>
          ) : <p className="cx-sc-gaps">{oFrom === oTo ? "Choose a different opioid to switch to." : "Enter the total daily dose."}</p>}
          <p className="cx-sc-gaps">{OPIOIDS.find((o) => o.id === oFrom)?.note} {OPIOIDS.find((o) => o.id === oTo)?.note}</p>
          <p className="cx-rs-foot"><TriangleAlert size={13} /> Approximate equivalents: tables differ. Reduce for cross-tolerance, frailty and kidney or liver disease, give breakthrough doses, and review often. Methadone and buprenorphine switches need specialist advice.</p>
        </>
      )}
    </section>
  );
}
