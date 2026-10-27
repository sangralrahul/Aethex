/**
 * Early & Late Puberty: precocious and delayed puberty by sex, benign variants (premature thelarche,
 * adrenarche), tests, MRI, and referral.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { pubertyAssess, type PubertyInput } from "@/lib/cadus/clinic48";

export default function PubertyView() {
  const [x, setX] = useState<PubertyInput>({ girl: true, age: 0, started: false, rapid: false, neuro: false, cafeAuLait: false, pubicOnly: false, breastOnlyUnder3: false, anosmia: false, short: false, chronic: false, lowWeight: false });
  const r = pubertyAssess(x);
  const cb = (k: Exclude<keyof PubertyInput, "girl" | "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-pub={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-pub">
      <header className="cx-page-h"><div><h1>Early &amp; Late Puberty</h1><p>Normal puberty starts at 8–13 in girls (breast budding) and 9–14 in boys (testes 4 mL or more). Outside that, assess.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Sex</span><select className="cx-select" value={x.girl ? "f" : "m"} onChange={(e) => setX({ ...x, girl: e.target.value === "f" })} data-pub="sex"><option value="f">Girl</option><option value="m">Boy</option></select></label>
        <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={x.age || ""} onChange={(e) => setX({ ...x, age: Number(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)) || 0 })} placeholder="7" data-pub="age" /></label>
      </div>
      <div className="cx-imaging-ticks">
        {cb("started", x.girl ? "Breast development has started" : "Testes have enlarged (4 mL or more)")}{cb("rapid", "Changing quickly, growth spurt")}{cb("pubicOnly", "Only pubic/axillary hair or body odour")}{x.girl && cb("breastOnlyUnder3", "Breast budding only, under 3 years")}
        {cb("neuro", "Headache, vision change")}{cb("cafeAuLait", "Café-au-lait patches")}{cb("anosmia", "Poor sense of smell")}{cb("short", "Short for family")}{cb("chronic", "Chronic illness")}{cb("lowWeight", "Underweight, heavy exercise or eating disorder")}
      </div>
      <div className={`cx-cmp-out ${r.type === "precocious" || r.type === "delayed" ? "cx-ac-high" : "cx-ac-in"}`} data-pub="out" data-type={r.type}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Baby size={13} /> ISPAE, ESPE consensus on precocious puberty 2019, NEJM 2012 delayed puberty. <TriangleAlert size={13} /> Puberty in a boy before 9 is pathological more often than in girls — always investigate.</p>
    </section>
  );
}
