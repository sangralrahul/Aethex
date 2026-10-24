/**
 * Burns Helper: body surface burned by Lund and Browder (by age), Parkland fluids from the time of
 * the burn less what has been given, urine output target, referral criteria and first aid.
 */
import { useState } from "react";
import { Flame, Printer, TriangleAlert } from "lucide-react";
import { BURN_AGES, BURN_FIRST_AID, BURN_REGIONS, burnFluids, burnReferral, burnTbsa, type BurnAge } from "@/lib/cadus/clinic28";

const FRACS: [number, string][] = [[0, "None"], [0.25, "¼"], [0.5, "½"], [0.75, "¾"], [1, "All"]];

export default function BurnsView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [age, setAge] = useState<BurnAge>("adult");
  const [kg, setKg] = useState("");
  const [since, setSince] = useState("");
  const [given, setGiven] = useState("");
  const [frac, setFrac] = useState<Record<string, number>>({});
  const [x, setX] = useState({ fullThickness: false, inhalation: false, electrical: false, chemical: false, circumferential: false, comorbid: false, trauma: false, nai: false });
  const child = age !== "adult" && age !== "15";
  const tbsa = burnTbsa(age, frac);
  const f = burnFluids(Number(kg), tbsa, { child, hoursSince: Number(since) || 0, given: Number(given) || 0, electrical: x.electrical });
  const refer = burnReferral({ tbsa, child, regions: Object.keys(frac).filter((k) => frac[k] > 0), ...x });
  const tick = (k: keyof typeof x, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-bn={k} /> {l}</label>;
  const md = () => [
    "# Burns plan", "",
    `- TBSA (partial and full thickness): **${tbsa}%**${kg ? `, weight ${kg} kg` : ""}`,
    ...(f ? [`- Parkland 24 h: ${f.total24} ml Ringer's lactate; first 8 h ${f.first8} ml, next 16 h ${f.next16} ml`, `- Rate now: **${f.rateNow} ml/hour**; then ${f.rateLater} ml/hour`, f.maintenance ? `- Plus maintenance ${f.maintenance} ml/hour of 5% glucose in 0.45% saline` : "", `- Urine output target: ${f.urineTarget}`] : []),
    "", ...(refer.length ? ["## Refer to a burns unit", ...refer.map((r) => `- ${r}`)] : []),
  ].filter((l) => l !== "").join("\n");

  return (
    <section className="cx-page cx-lab cx-burns">
      <header className="cx-page-h"><div><h1>Burns Helper</h1><p>The body surface burned by age (Lund and Browder), Parkland fluids from the time of the burn, the urine output target and who needs a burns unit.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><select className="cx-select" value={age} onChange={(e) => setAge(e.target.value as BurnAge)} data-bn="age">{BURN_AGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-bn="kg" /></label>
        <label className="cx-field"><span>Hours since the burn</span><input className="cx-input" inputMode="decimal" value={since} onChange={(e) => setSince(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="0" data-bn="since" /></label>
        <label className="cx-field"><span>IV fluid already given (ml)</span><input className="cx-input" inputMode="numeric" value={given} onChange={(e) => setGiven(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="0" data-bn="given" /></label>
      </div>
      <p className="cx-set-hint">How much of each region has a partial or full thickness burn? (Redness alone does not count.)</p>
      <div className="cx-burn-grid" data-bn="regions">
        {BURN_REGIONS.map((r) => (
          <label key={r.id} className="cx-burn-r"><span>{r.label} <small>{r.pct[BURN_AGES.findIndex(([v]) => v === age)]}%</small></span>
            <select className="cx-select sm" value={frac[r.id] ?? 0} onChange={(e) => setFrac({ ...frac, [r.id]: Number(e.target.value) })} data-bn-r={r.id} aria-label={`${r.label}: how much is burned`}>{FRACS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
        ))}
      </div>
      <div className="cx-c23-row">{tick("fullThickness", "Some full thickness")}{tick("circumferential", "Circumferential")}{tick("inhalation", "Inhalation injury")}{tick("electrical", "Electrical")}{tick("chemical", "Chemical")}{tick("comorbid", "Serious illness")}{tick("trauma", "Other injuries")}{tick("nai", "Concern about abuse")}</div>
      <div className="cx-cmp-out" data-bn="out">
        <div className="cx-sim-stats">
          <div><b data-bn="tbsa">{tbsa}%</b><small>TBSA</small></div>
          {f && <div><b data-bn="rate">{f.rateNow} ml/h</b><small>Ringer's lactate now ({f.hoursLeftIn8} h of the first 8 left)</small></div>}
          {f && <div><b>{f.total24} ml</b><small>Parkland in 24 h (4 ml/kg/%)</small></div>}
          {f && <div><b>{f.urineTarget.split(" (")[0]}</b><small>urine output target</small></div>}
        </div>
        {f ? <>
          {f.maintenance !== undefined && <p data-bn="maint">Child under 30 kg: also give maintenance of <b>{f.maintenance} ml/hour</b> 5% glucose in 0.45% saline.</p>}
          <ul>{f.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </> : <p className="cx-set-hint">Enter the weight and the burned regions for the fluid plan.</p>}
        {refer.length > 0 && <div className="cx-anc-flags" data-bn="refer"><p className="high"><TriangleAlert size={13} /> Refer to a burns unit:</p>{refer.map((r) => <p key={r}>{r}</p>)}</div>}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Burns plan", md())} data-bn="print"><Printer size={14} /> Print</button></div>
      </div>
      <h4>First aid and the first hour</h4>
      <ul>{BURN_FIRST_AID.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Flame size={13} /> Lund and Browder chart; Parkland formula (many units now start at 2–3 ml/kg/% and titrate). Fluids are titrated to urine output hour by hour.</p>
    </section>
  );
}
