/**
 * PE & DVT: Wells, PERC, YEARS and age-adjusted D-dimer for PE, Wells for DVT, sPESI for severity,
 * and anticoagulation, duration and thrombolysis.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { ageDdimer, PERC_ITEMS, peWorkup, spesi, vteTreatment, WELLS_DVT, wellsDvt, wellsPe, yearsRule, type WellsPeIn } from "@/lib/cadus/clinic33";

export default function PeDvtView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"pe" | "dvt" | "treat">("pe");
  const [w, setW] = useState<WellsPeIn>({ dvtSigns: false, peLikely: false, hr100: false, immobile: false, prevVte: false, haemoptysis: false, cancer: false });
  const [perc, setPerc] = useState<string[]>([]);
  const [lowGestalt, setLowGestalt] = useState(false);
  const [age, setAge] = useState("");
  const [dd, setDd] = useState("");
  const [dvt, setDvt] = useState<string[]>([]);
  const [sp, setSp] = useState({ age80: false, cancer: false, cardioPulm: false, hr110: false, sbp100: false, spo290: false });
  const [t, setT] = useState({ kg: "", crcl: "", cancer: false, pregnant: false, massive: false, provoked: "unprovoked" as "major-transient" | "minor" | "unprovoked" | "persistent" });
  const ws = wellsPe(w);
  const years = (w.dvtSigns ? 1 : 0) + (w.haemoptysis ? 1 : 0) + (w.peLikely ? 1 : 0);
  const work = peWorkup(ws, lowGestalt && perc.length === 0, dd ? Number(dd) : null, Number(age) || 40);
  const dv = wellsDvt(dvt);
  const sps = spesi(sp);
  const tr = vteTreatment(Number(t.kg) || 70, { cancer: t.cancer, pregnant: t.pregnant, crcl: t.crcl ? Number(t.crcl) : null, provoked: t.provoked, massive: t.massive });
  const md = () => ["# VTE", "", `- Wells PE ${ws.score} (${ws.likely ? "likely" : "unlikely"}); ${work}`, `- sPESI ${sps}`, ...tr.drug.map((d) => `- ${d}`), `- Duration: ${tr.duration}`, tr.lysis ? `- ${tr.lysis}` : ""].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-pedvt">
      <header className="cx-page-h"><div><h1>PE &amp; DVT</h1><p>Clinical probability (Wells, PERC, YEARS), age-adjusted D-dimer, severity (sPESI), and anticoagulation, duration and thrombolysis.</p></div></header>
      <div className="cx-seg" role="tablist">{([["pe", "Pulmonary embolism"], ["dvt", "DVT"], ["treat", "Treatment"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-pd-tab={k}>{l}</button>)}</div>
      {tab === "pe" && (
        <>
          <h4>Wells score for PE</h4>
          <div className="cx-c23-row">{([["dvtSigns", "Signs of DVT (+3)"], ["peLikely", "PE the most likely diagnosis (+3)"], ["hr100", "HR over 100 (+1.5)"], ["immobile", "Immobilised 3 days or surgery in 4 weeks (+1.5)"], ["prevVte", "Previous DVT or PE (+1.5)"], ["haemoptysis", "Haemoptysis (+1)"], ["cancer", "Active cancer (+1)"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={w[k]} onChange={(e) => setW({ ...w, [k]: e.target.checked })} data-pd-w={k} /> {l}</label>)}</div>
          <div className={`cx-cmp-out ${ws.likely ? "cx-ac-high" : "cx-ac-in"}`} data-pd="wells"><h3 className="cx-lab-h3" data-pd="wells-score">Wells {ws.score}: PE {ws.likely ? "likely" : "unlikely"}</h3></div>
          {!ws.likely && <><h4>PERC</h4><label className="cx-pa-mine"><input type="checkbox" checked={lowGestalt} onChange={(e) => setLowGestalt(e.target.checked)} data-pd="gestalt" /> Clinical suspicion is low (under 15%) and every PERC item below was checked</label><div className="cx-c23-row">{PERC_ITEMS.map((p) => <label key={p} className="cx-pa-mine"><input type="checkbox" checked={perc.includes(p)} onChange={() => setPerc(perc.includes(p) ? perc.filter((y) => y !== p) : [...perc, p])} /> {p}</label>)}</div></>}
          <div className="cx-c23-row">
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} data-pd="age" /></label>
            <label className="cx-field"><span>D-dimer (µg/L FEU)</span><input className="cx-input" inputMode="numeric" value={dd} onChange={(e) => setDd(e.target.value.replace(/\D/g, "").slice(0, 5))} data-pd="dd" /></label>
          </div>
          <div className="cx-cmp-out" data-pd="work"><p><b>{work}</b></p>{dd && <p className="cx-set-hint">{yearsRule(years, Number(dd))}. Age-adjusted cut-off: {ageDdimer(Number(age) || 40)} µg/L.</p>}</div>
          <h4>Severity (sPESI)</h4>
          <div className="cx-c23-row">{([["age80", "Age over 80"], ["cancer", "Cancer"], ["cardioPulm", "Chronic heart or lung disease"], ["hr110", "HR 110 or more"], ["sbp100", "SBP under 100"], ["spo290", "SpO2 under 90%"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={sp[k]} onChange={(e) => setSp({ ...sp, [k]: e.target.checked })} data-pd-s={k} /> {l}</label>)}</div>
          <p className="cx-set-hint" data-pd="spesi"><b>sPESI {sps}: {sps === 0 ? "low risk: early discharge on a DOAC may be possible (if no Hestia exclusions)" : "not low risk: admit; check troponin and RV on echo or CT"}</b></p>
        </>
      )}
      {tab === "dvt" && (
        <>
          <div className="cx-imaging-ticks">{WELLS_DVT.map((d) => <label key={d.id} className="cx-pa-mine"><input type="checkbox" checked={dvt.includes(d.id)} onChange={() => setDvt(dvt.includes(d.id) ? dvt.filter((y) => y !== d.id) : [...dvt, d.id])} data-pd-d={d.id} /> {d.label} ({d.pts > 0 ? "+" : ""}{d.pts})</label>)}</div>
          <div className={`cx-cmp-out ${dv >= 2 ? "cx-ac-high" : "cx-ac-in"}`} data-pd="dvt"><h3 className="cx-lab-h3">Wells DVT {dv}: {dv >= 2 ? "DVT likely: proximal leg ultrasound within 4 hours (interim anticoagulation if delayed)" : "DVT unlikely: D-dimer; ultrasound if raised"}</h3></div>
        </>
      )}
      {tab === "treat" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={t.kg} onChange={(e) => setT({ ...t, kg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} data-pd="kg" /></label>
            <label className="cx-field"><span>CrCl (optional)</span><input className="cx-input" inputMode="numeric" value={t.crcl} onChange={(e) => setT({ ...t, crcl: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-pd="crcl" /></label>
            <label className="cx-field"><span>Cause</span><select className="cx-select" value={t.provoked} onChange={(e) => setT({ ...t, provoked: e.target.value as typeof t.provoked })} data-pd="provoked"><option value="major-transient">Surgery or major trauma</option><option value="minor">Minor transient factor (travel, minor injury, oestrogen)</option><option value="unprovoked">Unprovoked</option><option value="persistent">Persistent risk factor</option></select></label>
            {([["cancer", "Active cancer"], ["pregnant", "Pregnant"], ["massive", "Shock or SBP under 90 (massive PE)"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.checked })} data-pd={k} /> {l}</label>)}
          </div>
          <div className="cx-cmp-out" data-pd="treat"><ul>{tr.drug.map((d) => <li key={d}>{d}</li>)}</ul><p data-pd="duration"><b>Duration:</b> {tr.duration}</p>{tr.lysis && <p className="cx-bk-err" data-pd="lysis"><TriangleAlert size={13} /> {tr.lysis}</p>}</div>
        </>
      )}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("VTE plan", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> ESC 2019 PE guidelines, NICE NG158, ASH 2020; YEARS and PERC rules. Check bleeding risk and platelets before anticoagulating.</p>
    </section>
  );
}
