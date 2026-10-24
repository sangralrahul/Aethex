/**
 * Kidney Dose Adjuster: creatinine clearance by Cockcroft-Gault, the dose of common medicines for
 * that clearance (or on haemodialysis) from an on-device table, and Cadus for anything else.
 */
import { useMemo, useState } from "react";
import { Loader2, Search, Sparkles, TriangleAlert } from "lucide-react";
import { bandFor, cockcroftGault, renalDose, renalLookup, type RenalBand } from "@/lib/cadus/clinic25";

const BANDS: [RenalBand, string][] = [[">50", "Over 50"], ["30-50", "30–50"], ["10-30", "10–30"], ["<10", "Under 10"], ["HD", "Dialysis"]];
interface Ai { drug: string; usual: string; gt50: string; b30_50: string; b10_30: string; lt10: string; hd: string; avoidBelow: string; alternative: string; monitor: string }

export default function KidneyDoseView({ generate, friendlyError, toast }: { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void }) {
  const [p, setP] = useState({ age: "", weight: "", creat: "", sex: "M" as "M" | "F" });
  const [dialysis, setDialysis] = useState(false);
  const [manual, setManual] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{ items: Ai[]; note: string } | null>(null);
  const cg = cockcroftGault(Number(p.age), Number(p.weight), Number(p.creat), p.sex);
  const crcl = manual ? Number(manual) : cg;
  const band = crcl !== null && Number.isFinite(crcl) ? bandFor(crcl, dialysis) : dialysis ? "HD" : null;
  const list = useMemo(() => renalLookup(q), [q]);
  const ask = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "renal-dose", drugs: q.split(/,|\n/).map((x) => x.trim()).filter(Boolean), crcl: crcl ?? undefined, dialysis });
      if (!r?.result) throw new Error("Nothing came back");
      setAi(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  const aiFor = (i: Ai, b: RenalBand) => ({ ">50": i.gt50, "30-50": i.b30_50, "10-30": i.b10_30, "<10": i.lt10, HD: i.hd } as Record<RenalBand, string>)[b];

  return (
    <section className="cx-page cx-lab cx-kidney">
      <header className="cx-page-h"><div><h1>Kidney Dose Adjuster</h1><p>Work out the creatinine clearance, then see the dose of common medicines for that kidney function or on dialysis. Ask Cadus for any medicine that isn't listed.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={p.age} onChange={(e) => setP({ ...p, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="68" data-kd="age" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={p.weight} onChange={(e) => setP({ ...p, weight: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="60" data-kd="weight" /></label>
        <label className="cx-field"><span>Creatinine (mg/dL)</span><input className="cx-input" inputMode="decimal" value={p.creat} onChange={(e) => setP({ ...p, creat: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="1.8" data-kd="creat" /></label>
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={p.sex} onChange={(e) => setP({ ...p, sex: e.target.value as "M" | "F" })} data-kd="sex"><option value="M">Male</option><option value="F">Female</option></select></label>
        <label className="cx-field"><span>Or CrCl/eGFR</span><input className="cx-input" inputMode="numeric" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="ml/min" data-kd="manual" /></label>
      </div>
      <label className="cx-pa-mine"><input type="checkbox" checked={dialysis} onChange={(e) => setDialysis(e.target.checked)} data-kd="hd" /> On haemodialysis</label>
      <div className="cx-sim-stats" data-kd="crcl"><div><b>{crcl !== null && Number.isFinite(crcl) ? `${crcl} ml/min` : "–"}</b><small>{manual ? "entered" : "Cockcroft-Gault, actual weight"}</small></div><div><b>{band ? BANDS.find((b) => b[0] === band)![1] : "–"}</b><small>dose band</small></div></div>
      <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => { setQ(e.target.value); setAi(null); }} placeholder="Find a medicine, or type any medicines to ask Cadus" aria-label="Medicine" data-kd="q" /></label>
      {list.length > 0 ? (
        <div className="cx-c23-scroll"><table className="cx-c23-table cx-kd-table" data-kd="table"><thead><tr><th>Medicine</th><th>Usual</th>{band ? <th className="on">For this patient</th> : BANDS.map(([b, l]) => <th key={b}>{l}</th>)}</tr></thead>
          <tbody>{list.map((d) => <tr key={d.name} data-kd-drug={d.name}><td><b>{d.name}</b>{d.note && <small>{d.note}</small>}</td><td>{d.usual}</td>{band ? <td className={`on ${/avoid/i.test(renalDose(d, band)) ? "avoid" : ""}`} data-kd-dose>{renalDose(d, band)}</td> : BANDS.map(([b]) => <td key={b} className={/avoid/i.test(renalDose(d, b)) ? "avoid" : ""}>{renalDose(d, b)}</td>)}</tr>)}</tbody></table></div>
      ) : (
        <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void ask()} disabled={busy || !q.trim()} data-kd="ask">{busy ? <Loader2 size={14} className="cx-rot" /> : <Sparkles size={14} />} Ask Cadus about {q.trim() || "these medicines"}</button></div>
      )}
      {ai && (
        <div className="cx-cmp-out" data-kd="ai">
          {ai.items.map((i) => <div key={i.drug} className="cx-kd-ai"><b>{i.drug}</b><small>Usual: {i.usual}</small><p>{band ? <>For this patient: <b>{aiFor(i, band) || "no change"}</b></> : BANDS.map(([b, l]) => `${l}: ${aiFor(i, b) || "no change"}`).join(" · ")}</p>{i.alternative && <p>Alternative: {i.alternative}</p>}{i.monitor && <p>Monitor: {i.monitor}</p>}</div>)}
          {ai.note && <p className="cx-set-hint">{ai.note}</p>}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Doses from standard references (BNF, product labels); check your formulary and the product used, and dose by levels where advised. Cockcroft-Gault overestimates clearance in the very old and the obese.</p>
    </section>
  );
}
