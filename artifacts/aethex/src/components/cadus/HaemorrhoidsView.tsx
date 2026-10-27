/**
 * Haemorrhoids & Anal Fissure: grade-based treatment of haemorrhoids, thrombosed piles, fissure
 * treatment, and red flags for bowel cancer.
 */
import { useState } from "react";
import { Armchair, TriangleAlert } from "lucide-react";
import { fissurePlan, haemPlan } from "@/lib/cadus/clinic43";

export default function HaemorrhoidsView() {
  const [tab, setTab] = useState<"piles" | "fissure">("piles");
  const [grade, setGrade] = useState<1 | 2 | 3 | 4>(1);
  const [thr, setThr] = useState("");
  const [weeks, setWeeks] = useState("");
  const [atyp, setAtyp] = useState(false);
  return (
    <section className="cx-page cx-lab cx-haem">
      <header className="cx-page-h"><div><h1>Haemorrhoids &amp; Anal Fissure</h1><p>Treat piles by grade and fissures by duration, and know when bleeding needs a colonoscopy.</p></div></header>
      <div className="cx-seg" role="tablist">{([["piles", "Haemorrhoids"], ["fissure", "Anal fissure"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-hm-tab={k}>{l}</button>)}</div>
      {tab === "piles" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Grade (internal)</span><select className="cx-select" value={grade} onChange={(e) => setGrade(Number(e.target.value) as 1 | 2 | 3 | 4)} data-hm="grade"><option value={1}>I: bleeds, no prolapse</option><option value={2}>II: prolapses, reduces itself</option><option value={3}>III: needs pushing back</option><option value={4}>IV: cannot be pushed back</option></select></label>
            <label className="cx-field"><span>Thrombosed external pile: hours since onset</span><input className="cx-input" inputMode="numeric" value={thr} onChange={(e) => setThr(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="none" data-hm="thr" /></label>
          </div>
          <ol className="cx-c23-steps" data-hm="plan">{haemPlan(grade, Number(thr) || 0).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      ) : (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Duration (weeks)</span><input className="cx-input" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, "").slice(0, 3))} data-hm="weeks" /></label>
            <label className="cx-pa-mine"><input type="checkbox" checked={atyp} onChange={(e) => setAtyp(e.target.checked)} data-hm="atypical" /> Atypical (lateral, multiple, painless or large)</label>
          </div>
          <ol className="cx-c23-steps" data-hm="fissure">{fissurePlan(Number(weeks) || 0, atyp).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><Armchair size={13} /> ASCRS haemorrhoid (2018) and anal fissure (2023) guidelines, ACG 2021. <TriangleAlert size={13} /> Examine (inspection, DRE, proctoscopy) before labelling bleeding as piles.</p>
    </section>
  );
}
