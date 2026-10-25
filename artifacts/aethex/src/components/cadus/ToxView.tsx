/**
 * Toxicology: paracetamol (treatment line, acetylcysteine doses), organophosphate poisoning (atropine
 * doubling, atropinisation, pralidoxime) and common Indian poisonings.
 */
import { useState } from "react";
import { FlaskConical, Phone, Printer, TriangleAlert } from "lucide-react";
import { atropinePlan, ATROPINISED, nacDoses, OP_CARE, OTHER_POISONS, paraAssess, paraLine, POISON_LINE, pralidoxime } from "@/lib/cadus/clinic34";

export default function ToxView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"para" | "op" | "other">("para");
  const [p, setP] = useState({ hours: "", level: "", kg: "", mg: "" });
  const [unit, setUnit] = useState<"mgL" | "umolL">("mgL");
  const [base, setBase] = useState<100 | 150>(150);
  const [staggered, setStaggered] = useState(false);
  const [alt, setAlt] = useState(false);
  const [op, setOp] = useState({ start: "1.8", doubles: 0, kg: "60", child: false });
  const [atro, setAtro] = useState<string[]>([]);
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 6);
  const kg = Number(p.kg) || 0;
  const mgPerKg = kg && p.mg ? Math.round(Number(p.mg) / kg) : undefined;
  const pa = paraAssess({ hours: p.hours === "" ? null : Number(p.hours), level: p.level === "" ? undefined : Number(p.level), unit, mgPerKg, staggered, base, altHigh: alt });
  const nac = nacDoses(kg);
  const ap = atropinePlan(Number(op.start) || 1.8, op.doubles, op.child, Number(op.kg) || 60);
  const md = () => ["# Paracetamol overdose", "", `- ${pa.text}`, ...(nac && pa.treat ? nac.bags.map((b, i) => `- Bag ${i + 1}: ${b.dose} ${b.vol} over ${b.over}`) : [])].join("\n");

  return (
    <section className="cx-page cx-lab cx-tox">
      <header className="cx-page-h"><div><h1>Toxicology</h1><p>Paracetamol overdose (treatment line and acetylcysteine), organophosphate poisoning (atropine doubling and pralidoxime), and common poisonings in India.</p></div></header>
      <p className="cx-set-hint"><Phone size={13} /> {POISON_LINE}</p>
      <div className="cx-seg" role="tablist">{([["para", "Paracetamol"], ["op", "Organophosphate"], ["other", "Other poisons"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-tx-tab={k}>{l}</button>)}</div>
      {tab === "para" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Hours since ingestion</span><input className="cx-input" inputMode="decimal" value={p.hours} onChange={(e) => setP({ ...p, hours: n(e.target.value) })} placeholder="8" data-tx="hours" /></label>
            <label className="cx-field"><span>Paracetamol level</span><input className="cx-input" inputMode="decimal" value={p.level} onChange={(e) => setP({ ...p, level: n(e.target.value) })} placeholder="60" data-tx="level" /></label>
            <label className="cx-field"><span>Unit</span><select className="cx-select" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)} data-tx="unit"><option value="mgL">mg/L (µg/ml)</option><option value="umolL">µmol/L</option></select></label>
            <label className="cx-field"><span>Treatment line</span><select className="cx-select" value={base} onChange={(e) => setBase(Number(e.target.value) as 100 | 150)} data-tx="base"><option value={150}>150 line (Rumack-Matthew)</option><option value={100}>100 line (UK)</option></select></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={p.kg} onChange={(e) => setP({ ...p, kg: n(e.target.value) })} data-tx="kg" /></label>
            <label className="cx-field"><span>Amount taken (mg)</span><input className="cx-input" inputMode="numeric" value={p.mg} onChange={(e) => setP({ ...p, mg: n(e.target.value) })} data-tx="mg" /></label>
          </div>
          <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={staggered} onChange={(e) => setStaggered(e.target.checked)} data-tx="staggered" /> Staggered or unknown time</label><label className="cx-pa-mine"><input type="checkbox" checked={alt} onChange={(e) => setAlt(e.target.checked)} data-tx="alt" /> ALT raised</label></div>
          {mgPerKg !== undefined && <p className="cx-set-hint">{mgPerKg} mg/kg ingested{mgPerKg < 150 ? " (under 150 mg/kg: serious toxicity unlikely in a single acute ingestion; still check a 4-hour level)" : ""}.</p>}
          <div className={`cx-cmp-out ${pa.treat ? "cx-st-out" : "cx-ac-in"}`} data-tx="para" data-treat={String(pa.treat)}><h3 className="cx-lab-h3">{pa.text}</h3>
            {p.hours && Number(p.hours) >= 4 && Number(p.hours) <= 24 && <p className="cx-set-hint">Line at {p.hours} h: {paraLine(Number(p.hours), base)} mg/L.</p>}
            {nac && pa.treat && <><h4>Acetylcysteine (21-hour regimen)</h4><table className="cx-c23-table" data-tx="nac"><tbody>{nac.bags.map((b, i) => <tr key={i}><th>Bag {i + 1}</th><td>{b.dose} {b.vol}, over {b.over}</td></tr>)}</tbody></table><p className="cx-set-hint">{nac.note}</p></>}
            <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Paracetamol overdose", md())}><Printer size={14} /> Print</button></div>
          </div>
        </>
      )}
      {tab === "op" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>First atropine dose (mg)</span><input className="cx-input" inputMode="decimal" value={op.start} onChange={(e) => setOp({ ...op, start: n(e.target.value) })} data-tx="start" /></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={op.kg} onChange={(e) => setOp({ ...op, kg: n(e.target.value) })} /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={op.child} onChange={(e) => setOp({ ...op, child: e.target.checked })} /> Child</label>
          </div>
          <div className="cx-cmp-out" data-tx="op">
            <p><b>Doses given so far: {op.doubles + 1}</b> (total {ap.total} mg) <button className="cx-btn sm" onClick={() => setOp({ ...op, doubles: op.doubles + 1 })} data-tx="double">Gave the doubled dose</button> {op.doubles > 0 && <button className="cx-btn sm" onClick={() => setOp({ ...op, doubles: 0 })}>Reset</button>}</p>
            <p data-tx="next">{ap.next}</p>
            <h4>Atropinised when all of these ({atro.length}/{ATROPINISED.length})</h4>
            <div className="cx-imaging-ticks">{ATROPINISED.map((a) => <label key={a} className="cx-pa-mine"><input type="checkbox" checked={atro.includes(a)} onChange={() => setAtro(atro.includes(a) ? atro.filter((x) => x !== a) : [...atro, a])} data-tx-atro /> {a}</label>)}</div>
            {atro.length === ATROPINISED.length && <p className="cx-set-hint" data-tx="infusion"><b>{ap.infusion}</b></p>}
            <p>{pralidoxime(Number(op.kg) || 60)}</p>
          </div>
          <ul>{OP_CARE.map((x) => <li key={x}>{x}</li>)}</ul>
        </>
      )}
      {tab === "other" && <table className="cx-c23-table" data-tx="other"><tbody>{OTHER_POISONS.map((o) => <tr key={o.name}><th>{o.name}</th><td>{o.care}</td></tr>)}</tbody></table>}
      <p className="cx-rs-foot"><FlaskConical size={13} /> Rumack-Matthew nomogram, MHRA/UK acetylcysteine guidance, Eddleston atropine protocol and WHO. <TriangleAlert size={13} /> The nomogram is for a single acute ingestion with a reliable time.</p>
    </section>
  );
}
