/**
 * Delirium (4AT): the four-item screen, causes to look for, and management that avoids harm.
 */
import { useState } from "react";
import { Brain, TriangleAlert } from "lucide-react";
import { DELIRIUM_CARE, DELIRIUM_CAUSES, fourAT } from "@/lib/cadus/clinic41";

export default function DeliriumView() {
  const [a, setA] = useState<0 | 4>(0);
  const [amt, setAmt] = useState<0 | 1 | 2>(0);
  const [att, setAtt] = useState<0 | 1 | 2>(0);
  const [ac, setAc] = useState<0 | 4>(0);
  const [ticked, setTicked] = useState<number[]>([]);
  const r = fourAT(a, amt, att, ac);
  const sel = <T extends number>(val: T, set: (v: T) => void, label: string, opts: [T, string][], key: string) => <label className="cx-field"><span>{label}</span><select className="cx-select" value={val} onChange={(e) => set(Number(e.target.value) as T)} data-dl={key}>{opts.map(([v, l]) => <option key={l} value={v}>{l} ({v})</option>)}</select></label>;
  return (
    <section className="cx-page cx-lab cx-delirium">
      <header className="cx-page-h"><div><h1>Delirium &amp; 4AT</h1><p>Screen with the 4AT in under 2 minutes, look for every cause, and manage without restraints or unnecessary sedatives.</p></div></header>
      <div className="cx-nihss">
        {sel<0 | 4>(a, setA, "1. Alertness", [[0, "Normal, or mildly sleepy under 10 seconds after waking"], [4, "Clearly abnormal"]], "alert")}
        {sel<0 | 1 | 2>(amt, setAmt, "2. AMT4: age, date of birth, place, year", [[0, "No mistakes"], [1, "1 mistake"], [2, "2 or more, or untestable"]], "amt")}
        {sel<0 | 1 | 2>(att, setAtt, "3. Attention: months of the year backwards", [[0, "7 or more months correct"], [1, "Starts but under 7, or refuses"], [2, "Untestable"]], "att")}
        {sel<0 | 4>(ac, setAc, "4. Acute change or fluctuating course", [[0, "No"], [4, "Yes"]], "acute")}
      </div>
      <div className={`cx-cmp-out ${r.score >= 4 ? "cx-st-out" : r.score >= 1 ? "cx-ac-high" : "cx-ac-in"}`} data-dl="out" data-score={r.score}><p><b>{r.text}</b></p></div>
      <h4>Causes to check</h4>
      <div className="cx-imaging-ticks">{DELIRIUM_CAUSES.map(([k, d], i) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={ticked.includes(i)} onChange={() => setTicked(ticked.includes(i) ? ticked.filter((x) => x !== i) : [...ticked, i])} data-dl-c={i} /> <b>{k}</b>: {d}</label>)}</div>
      <p className="cx-set-hint" data-dl="checked">{ticked.length}/{DELIRIUM_CAUSES.length} checked.</p>
      <h4>Management</h4><ol className="cx-c23-steps">{DELIRIUM_CARE.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Brain size={13} /> 4AT (www.the4AT.com), NICE CG103, SIGN 157. <TriangleAlert size={13} /> Hypoactive delirium (quiet, withdrawn) is often missed and has the worst outcome.</p>
    </section>
  );
}
