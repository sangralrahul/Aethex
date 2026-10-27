/**
 * Cervical Cancer Screening: who to screen and how often (HPV, VIA, cytology), and what to do with
 * each result, including screen-and-treat.
 */
import { useState } from "react";
import { Microscope, TriangleAlert } from "lucide-react";
import { cxResult, cxSchedule } from "@/lib/cadus/clinic43";

const RESULTS: Record<"hpv" | "via" | "pap", [string, string][]> = {
  hpv: [["negative", "HPV negative"], ["1618", "HPV 16/18 positive"], ["other", "HPV positive (other types)"]],
  via: [["negative", "VIA negative"], ["positive", "VIA positive"], ["suspicious", "Suspicious for cancer"]],
  pap: [["nilm", "Normal (NILM)"], ["ascus", "ASC-US"], ["lsil", "LSIL"], ["hsil", "HSIL, ASC-H or AGC"]],
};
export default function CervicalScreenView() {
  const [age, setAge] = useState("");
  const [hiv, setHiv] = useState(false);
  const [test, setTest] = useState<"hpv" | "via" | "pap">("hpv");
  const [res, setRes] = useState("negative");
  return (
    <section className="cx-page cx-lab cx-cxscreen">
      <header className="cx-page-h"><div><h1>Cervical Cancer Screening</h1><p>Who to screen, which test and how often, and the next step for every result, including same-visit screen-and-treat.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="35" data-cx="age" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={hiv} onChange={(e) => setHiv(e.target.checked)} data-cx="hiv" /> Living with HIV</label>
      </div>
      <div className="cx-cmp-out cx-ac-in" data-cx="schedule"><p><b>{cxSchedule(Number(age) || 0, hiv)}</b></p></div>
      <h4>Result</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Test</span><select className="cx-select" value={test} onChange={(e) => { const t = e.target.value as typeof test; setTest(t); setRes(RESULTS[t][0][0]); }} data-cx="test"><option value="hpv">HPV DNA</option><option value="via">VIA</option><option value="pap">Pap smear (cytology)</option></select></label>
        <label className="cx-field"><span>Result</span><select className="cx-select" value={res} onChange={(e) => setRes(e.target.value)} data-cx="result">{RESULTS[test].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      </div>
      <ol className="cx-c23-steps" data-cx="next">{cxResult(test, res, hiv).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Microscope size={13} /> WHO cervical screening guideline 2021, India NP-NCD operational framework. <TriangleAlert size={13} /> Postcoital or intermenstrual bleeding, or a visible lesion: examine and refer, whatever the last screening result.</p>
    </section>
  );
}
