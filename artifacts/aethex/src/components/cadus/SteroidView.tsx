/**
 * Adrenal Crisis & Steroid Cover: equivalent doses, who is at risk of adrenal suppression, cover for
 * procedures and labour, and emergency treatment of adrenal crisis.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { adrenalCrisis, STEROID_EQUIV, steroidCover, toPredEq } from "@/lib/cadus/clinic34";

export default function SteroidView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [drug, setDrug] = useState("pred");
  const [mg, setMg] = useState("");
  const [weeks, setWeeks] = useState("");
  const [ai, setAi] = useState(false);
  const [proc, setProc] = useState<"none" | "minor" | "moderate" | "major" | "labour">("major");
  const [age, setAge] = useState("40");
  const eq = toPredEq(drug, Number(mg) || 0);
  const cover = steroidCover(eq, Number(weeks) || 0, ai, proc);
  const crisis = adrenalCrisis(Number(age) || 40);
  const md = () => ["# Steroid cover", "", `- Current steroid: ${mg} mg ${STEROID_EQUIV.find((d) => d.id === drug)?.name} (prednisolone ${eq} mg equivalent) for ${weeks} weeks`, ...cover.plan.map((p) => `- ${p}`), "", "## If adrenal crisis", ...crisis.map((c) => `- ${c}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-steroid">
      <header className="cx-page-h"><div><h1>Adrenal Crisis &amp; Steroid Cover</h1><p>Steroid equivalent doses, who is at risk of adrenal suppression, extra cover for surgery and labour, and emergency treatment of adrenal crisis.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Steroid</span><select className="cx-select" value={drug} onChange={(e) => setDrug(e.target.value)} data-st2="drug">{STEROID_EQUIV.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label className="cx-field"><span>Daily dose (mg)</span><input className="cx-input" inputMode="decimal" value={mg} onChange={(e) => setMg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} data-st2="mg" /></label>
        <label className="cx-field"><span>For how many weeks</span><input className="cx-input" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, "").slice(0, 3))} data-st2="weeks" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} data-st2="ai" /> Known adrenal insufficiency (Addison's, hypopituitarism)</label>
      </div>
      {mg && <p className="cx-set-hint" data-st2="eq"><b>Prednisolone equivalent: {eq} mg a day</b> (5 mg prednisolone = 20 mg hydrocortisone = 4 mg methylprednisolone = 0.75 mg dexamethasone)</p>}
      <div className="cx-c23-row"><label className="cx-field"><span>Situation</span><select className="cx-select" value={proc} onChange={(e) => setProc(e.target.value as typeof proc)} data-st2="proc"><option value="none">Day-to-day (no procedure)</option><option value="minor">Minor procedure, local anaesthetic</option><option value="moderate">Moderate surgery or endoscopy with sedation</option><option value="major">Major surgery (general anaesthetic)</option><option value="labour">Labour or caesarean</option></select></label></div>
      <div className={`cx-cmp-out ${cover.atRisk ? "cx-ac-high" : "cx-ac-in"}`} data-st2="cover" data-risk={String(cover.atRisk)}><ul>{cover.plan.map((p) => <li key={p}>{p}</li>)}</ul></div>
      <h4>Adrenal crisis</h4>
      <div className="cx-c23-row"><label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d.]/g, "").slice(0, 3))} data-st2="age" /></label></div>
      <div className="cx-cmp-out cx-st-out" data-st2="crisis"><p><b>Suspect it in anyone on steroids or with adrenal insufficiency who is shocked, vomiting, confused or hypoglycaemic.</b></p><ol className="cx-c23-steps">{crisis.map((c) => <li key={c}>{c}</li>)}</ol></div>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Steroid cover", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Society for Endocrinology 2020 and AAGBI/Endocrine Society guidance. Inhaled, topical and injected steroids can also suppress the adrenals at high doses.</p>
    </section>
  );
}
