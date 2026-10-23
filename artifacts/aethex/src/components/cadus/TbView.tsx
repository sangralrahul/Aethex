/**
 * TB Treatment (NTEP): the daily fixed-dose combination by weight band for drug-sensitive TB in
 * adults, the phase dates, monthly reviews, sputum checks and outcome, and a card for the patient.
 */
import { useState } from "react";
import { Printer, Stethoscope, TriangleAlert } from "lucide-react";
import { isoDate, TB_BANDS, tbCardMarkdown, tbPlan, type TbSite } from "@/lib/cadus/clinic23";

const SITES: [TbSite, string][] = [["pulmonary", "Pulmonary"], ["extrapulmonary", "Extrapulmonary (other)"], ["cns", "TB meningitis / CNS"], ["bone", "Bone and joint"]];
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function TbView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [weight, setWeight] = useState("");
  const [start, setStart] = useState(isoDate(new Date()));
  const [site, setSite] = useState<TbSite>("pulmonary");
  const [code, setCode] = useState("");
  const w = Number(weight);
  const plan = tbPlan(w, start, site);

  return (
    <section className="cx-page cx-lab cx-tb">
      <header className="cx-page-h"><div><h1>TB Treatment (NTEP)</h1><p>Drug-sensitive TB in adults under the National TB Elimination Programme: tablets a day by weight band, the phase dates, reviews and sputum checks, and a card for the patient.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="Site">{SITES.map(([v, l]) => <button key={v} role="radio" aria-checked={site === v} className={site === v ? "on" : ""} onClick={() => setSite(v)} data-tb-site={v}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="52" data-tb="weight" /></label>
        <label className="cx-field"><span>Start date</span><input className="cx-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} data-tb="start" /></label>
        <label className="cx-field"><span>Ni-kshay ID or initials</span><input className="cx-input" value={code} onChange={(e) => setCode(e.target.value.slice(0, 40))} placeholder="Optional" /></label>
      </div>
      {weight && w > 0 && w < 25 && <div className="cx-sc-gaps" data-tb="child">Under 25 kg: use the NTEP paediatric weight bands and dispersible paediatric FDCs.</div>}
      {plan ? (
        <div className="cx-cmp-out" data-tb="out">
          <div className="cx-sim-stats">
            <div><b data-tb="tablets">{plan.tablets}</b><small>FDC tablets a day (band {plan.band})</small></div>
            <div><b>{fmt(plan.ipEnd)}</b><small>intensive phase ends (8 weeks HRZE)</small></div>
            <div><b>{fmt(plan.end)}</b><small>treatment ends ({plan.months} months)</small></div>
          </div>
          <div className="cx-c23-scroll"><table className="cx-c23-table" data-tb="visits"><thead><tr><th>Date</th><th>What happens</th></tr></thead><tbody>{plan.visits.map((v, i) => <tr key={i}><td>{fmt(v.date)}</td><td>{v.what}</td></tr>)}</tbody></table></div>
          <ul>{plan.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => onPrint("TB treatment card", tbCardMarkdown(code, w, start, site))} data-tb="print"><Printer size={14} /> Print the patient's card</button></div>
        </div>
      ) : (
        <div className="cx-c23-scroll"><table className="cx-c23-table"><thead><tr><th>Weight band</th><th>FDC tablets a day</th></tr></thead><tbody>{TB_BANDS.map((b) => <tr key={b.from}><td>{b.to > 900 ? "Over 75 kg" : `${Math.round(b.from)}–${b.to} kg`}</td><td>{b.tablets}</td></tr>)}</tbody></table></div>
      )}
      <p className="cx-rs-foot"><Stethoscope size={13} /> For drug-resistant TB, HIV co-infection, pregnancy, liver or kidney disease, follow the NTEP guidelines and the DR-TB centre. <TriangleAlert size={13} /> Notify every case on Ni-kshay.</p>
    </section>
  );
}
