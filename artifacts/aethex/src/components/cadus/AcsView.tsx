/**
 * Chest Pain & ACS: the HEART score, STEMI ECG criteria, the reperfusion decision (primary PCI or
 * fibrinolysis), tenecteplase and enoxaparin doses, and loading drugs.
 */
import { useState } from "react";
import { HeartPulse, Printer, TriangleAlert } from "lucide-react";
import { acsLoading, enoxAcs, heartScore, LYSIS_CI, STEMI_ECG, stemiPath, tnkDose } from "@/lib/cadus/clinic35";

export default function AcsView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"heart" | "stemi">("heart");
  const [hx, setHx] = useState<0 | 1 | 2>(1);
  const [ecg, setEcg] = useState<0 | 1 | 2>(0);
  const [age, setAge] = useState("");
  const [rf, setRf] = useState(0);
  const [athero, setAthero] = useState(false);
  const [trop, setTrop] = useState<0 | 1 | 2>(0);
  const [kg, setKg] = useState("");
  const [crcl, setCrcl] = useState("");
  const [pciMin, setPciMin] = useState("");
  const [ci, setCi] = useState<string[]>([]);
  const a = Number(age) || 0, w = Number(kg) || 0;
  const h = heartScore({ history: hx, ecg, age: a, riskFactors: rf, knownAthero: athero, troponin: trop });
  const path = stemiPath(pciMin === "" ? null : Number(pciMin), ci.length);
  const lysis = path.action === "Fibrinolysis now";
  const load = acsLoading(a, lysis, path.action !== "Fibrinolysis now");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seg = (val: number, set: (v: any) => void, opts: [number, string][], key: string) => <div className="cx-seg">{opts.map(([v, l]) => <button key={v} className={val === v ? "on" : ""} onClick={() => set(v)} data-acs={`${key}${v}`}>{l}</button>)}</div>;
  const md = () => ["# ACS plan", "", `- ${path.action}`, ...path.steps.map((s) => `- ${s}`), ...(lysis && w ? [`- ${tnkDose(w, a).text}`] : []), `- ${enoxAcs(w, a, crcl ? Number(crcl) : null, lysis)}`, "", "## Loading and drugs", ...load.map((s) => `- ${s}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-acs">
      <header className="cx-page-h"><div><h1>Chest Pain &amp; ACS</h1><p>Risk-stratify chest pain with the HEART score, recognise STEMI, choose primary PCI or fibrinolysis, and get the loading and anticoagulant doses.</p></div></header>
      <div className="cx-seg" role="tablist">{([["heart", "Chest pain (HEART)"], ["stemi", "STEMI & treatment"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-acs-tab={k}>{l}</button>)}</div>
      {tab === "heart" ? (
        <>
          <div className="cx-nihss">
            <label className="cx-field"><span>History</span>{seg(hx, setHx, [[0, "Slightly suspicious"], [1, "Moderately"], [2, "Highly suspicious"]], "h")}</label>
            <label className="cx-field"><span>ECG</span>{seg(ecg, setEcg, [[0, "Normal"], [1, "Non-specific changes"], [2, "Significant ST depression"]], "e")}</label>
            <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="58" data-acs="age" /></label>
            <label className="cx-field"><span>Risk factors (diabetes, smoking, hypertension, cholesterol, family history, obesity)</span>{seg(rf, setRf, [[0, "None"], [1, "1–2"], [3, "3 or more"]], "r")}</label>
            <label className="cx-field"><span>Troponin</span>{seg(trop, setTrop, [[0, "Normal"], [1, "1–3× upper limit"], [2, "Over 3×"]], "t")}</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={athero} onChange={(e) => setAthero(e.target.checked)} data-acs="athero" /> Known atherosclerotic disease (previous MI, PCI, CABG, stroke, PAD)</label>
          </div>
          <div className={`cx-cmp-out ${h.band === "high" ? "cx-st-out" : h.band === "moderate" ? "cx-ac-high" : "cx-ac-in"}`} data-acs="heart" data-band={h.band}>
            <h3 className="cx-lab-h3">HEART score {h.score}: {h.band} risk</h3>
            <p>{h.mace}.</p><p><b>{h.plan}</b></p>
          </div>
          <p className="cx-set-hint">Use the HEART score only when there is no ST elevation. Always do an ECG within 10 minutes of arrival and repeat it with any new pain.</p>
        </>
      ) : (
        <>
          <h4>STEMI on the ECG</h4>
          <ul>{STEMI_ECG.map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Minutes until PCI is possible (blank if not available)</span><input className="cx-input" inputMode="numeric" value={pciMin} onChange={(e) => setPciMin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 180" data-acs="pci" /></label>
            <label className="cx-field"><span>Age (years)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} data-acs="age2" /></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-acs="kg" /></label>
            <label className="cx-field"><span>CrCl (ml/min, optional)</span><input className="cx-input" inputMode="numeric" value={crcl} onChange={(e) => setCrcl(e.target.value.replace(/\D/g, "").slice(0, 3))} data-acs="crcl" /></label>
          </div>
          <h4>Contraindications to fibrinolysis</h4>
          <div className="cx-imaging-ticks">{LYSIS_CI.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={ci.includes(x)} onChange={() => setCi(ci.includes(x) ? ci.filter((y) => y !== x) : [...ci, x])} data-acs-ci={i} /> {x}</label>)}</div>
          <div className={`cx-cmp-out ${lysis ? "cx-ac-high" : "cx-st-out"}`} data-acs="path">
            <h3 className="cx-lab-h3" data-acs="action">{path.action}</h3>
            <ul>{path.steps.map((s) => <li key={s}>{s}</li>)}{lysis && w > 0 && <li data-acs="tnk"><b>{tnkDose(w, a).text}</b></li>}<li data-acs="enox">{enoxAcs(w, a, crcl ? Number(crcl) : null, lysis)}</li></ul>
          </div>
          <h4>Loading and first drugs</h4>
          <ul data-acs="load">{load.map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("ACS plan", md())}><Printer size={14} /> Print</button></div>
        </>
      )}
      <p className="cx-rs-foot"><HeartPulse size={13} /> ESC 2023 ACS guideline, HEART score (Six, Backus), CSI STEMI India. <TriangleAlert size={13} /> Check doses against your hospital protocol; suspect aortic dissection before giving antithrombotics.</p>
    </section>
  );
}
