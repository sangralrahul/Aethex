/**
 * BPH & LUTS (IPSS): the International Prostate Symptom Score and a stepwise plan (alpha blocker,
 * 5-alpha reductase inhibitor, storage symptom drugs, referral).
 */
import { useState } from "react";
import { Droplet, TriangleAlert } from "lucide-react";
import { IPSS_Q, ipss, lutsPlan } from "@/lib/cadus/clinic43";

const OPTS = ["Not at all", "Less than 1 time in 5", "Less than half the time", "About half the time", "More than half the time", "Almost always"];
const NOCT = ["None", "1 time", "2 times", "3 times", "4 times", "5 or more"];
export default function BphView() {
  const [s, setS] = useState<number[]>(IPSS_Q.map(() => 0));
  const [v, setV] = useState({ prostate: "", pvr: "" });
  const [f, setF] = useState({ storage: false, ed: false, np: false });
  const r = ipss(s);
  return (
    <section className="cx-page cx-lab cx-bph">
      <header className="cx-page-h"><div><h1>BPH &amp; LUTS (IPSS)</h1><p>Score urinary symptoms over the past month with the IPSS, then follow the stepwise plan for an enlarged prostate.</p></div></header>
      <div className="cx-nihss">{IPSS_Q.map((q, i) => <label key={q} className="cx-field"><span>{q}</span><select className="cx-select" value={s[i]} onChange={(e) => setS(s.map((x, j) => (j === i ? Number(e.target.value) : x)))} data-ip={i}>{(i === 6 ? NOCT : OPTS).map((o, k) => <option key={o} value={k}>{o} ({k})</option>)}</select></label>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Prostate volume (ml, ultrasound)</span><input className="cx-input" inputMode="numeric" value={v.prostate} onChange={(e) => setV({ ...v, prostate: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-ip="prostate" /></label>
        <label className="cx-field"><span>Post-void residual (ml)</span><input className="cx-input" inputMode="numeric" value={v.pvr} onChange={(e) => setV({ ...v, pvr: e.target.value.replace(/\D/g, "").slice(0, 4) })} data-ip="pvr" /></label>
      </div>
      <div className="cx-imaging-ticks">{([["storage", "Mainly urgency and frequency"], ["ed", "Erectile dysfunction"], ["np", "Nocturnal polyuria on a frequency–volume chart"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-ip={k} /> {l}</label>)}</div>
      <div className={`cx-cmp-out ${r.band === "severe" ? "cx-st-out" : r.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-ip="out" data-band={r.band}><h3 className="cx-lab-h3">IPSS {r.total}/35: {r.band}</h3><ol className="cx-c23-steps">{lutsPlan({ band: r.band, prostateMl: Number(v.prostate) || 0, storage: f.storage, ed: f.ed, pvr: Number(v.pvr) || 0, nocturnalPolyuria: f.np }).map((x) => <li key={x}>{x}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplet size={13} /> EAU non-neurogenic male LUTS guideline 2023, NICE CG97, AUA 2021. <TriangleAlert size={13} /> Before treatment: urinalysis, DRE, creatinine; discuss PSA testing.</p>
    </section>
  );
}
