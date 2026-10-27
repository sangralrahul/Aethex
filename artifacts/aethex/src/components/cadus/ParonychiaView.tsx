/**
 * Paronychia & Ingrown Toenail: acute vs chronic paronychia, drainage, herpetic whitlow, and staged
 * care of ingrown toenails.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import { paronychiaPlan, toenailPlan, type ParonychiaInput } from "@/lib/cadus/clinic48";

export default function ParonychiaView() {
  const [tab, setTab] = useState<"paronychia" | "toenail">("paronychia");
  const [x, setX] = useState<ParonychiaInput>({ chronic: false, abscess: false, cellulitis: false, vesicles: false, wetWork: false, nailBiter: false });
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [diab, setDiab] = useState(false);
  const [rec, setRec] = useState(false);
  const cb = (k: keyof ParonychiaInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-prn={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-prn">
      <header className="cx-page-h"><div><h1>Paronychia &amp; Ingrown Toenail</h1><p>Nail fold infections and ingrown toenails: soak, drain when there is pus, and fix the cause.</p></div></header>
      <div className="cx-seg" role="tablist">{([["paronychia", "Paronychia"], ["toenail", "Ingrown toenail"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-prn-tab={k}>{l}</button>)}</div>
      {tab === "paronychia" ? (
        <>
          <div className="cx-imaging-ticks">{cb("chronic", "6 weeks or more, several fingers")}{cb("abscess", "Pus collected")}{cb("cellulitis", "Spreading redness")}{cb("vesicles", "Small blisters")}{cb("nailBiter", "Nail biting or finger sucking")}{cb("wetWork", "Wet work")}</div>
          <ol className="cx-c23-steps" data-prn="plan">{paronychiaPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      ) : (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Stage</span><select className="cx-select" value={stage} onChange={(e) => setStage(Number(e.target.value) as 1 | 2 | 3)} data-prn="stage"><option value={1}>1: redness and pain</option><option value={2}>2: pus or drainage</option><option value={3}>3: granulation, chronic</option></select></label></div>
          <div className="cx-imaging-ticks">
            <label className="cx-pa-mine"><input type="checkbox" checked={diab} onChange={(e) => setDiab(e.target.checked)} data-prn="diabetes" /> Diabetes or poor circulation</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} data-prn="recurrent" /> Keeps coming back</label>
          </div>
          <ol className="cx-c23-steps" data-prn="toenail">{toenailPlan(stage, diab, rec).map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><Hand size={13} /> AAFP 2017 and 2019, Cochrane ingrown toenail review. <TriangleAlert size={13} /> Never incise a herpetic whitlow.</p>
    </section>
  );
}
