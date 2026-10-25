/**
 * Pre-op Risk & Anticoagulant Bridging: RCRI and functional capacity, when to stop and restart each
 * DOAC, warfarin with or without heparin bridging, antiplatelets and recent stents.
 */
import { useState } from "react";
import { ClipboardCheck, Printer, TriangleAlert } from "lucide-react";
import { ANTIPLATELETS, doacPlan, HIGH_THROMBO, RCRI, rcriRisk, stentAdvice, warfarinPlan, type Doac } from "@/lib/cadus/clinic36";

export default function BridgingView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [rc, setRc] = useState<number[]>([]);
  const [mets, setMets] = useState(true);
  const [drug, setDrug] = useState<"none" | Doac | "warfarin">("apixaban");
  const [crcl, setCrcl] = useState("80");
  const [bleed, setBleed] = useState(false);
  const [thr, setThr] = useState<number[]>([]);
  const [kg, setKg] = useState("");
  const [ap, setAp] = useState<string[]>([]);
  const [stent, setStent] = useState("");
  const [acs, setAcs] = useState(false);
  const doac = drug !== "none" && drug !== "warfarin" ? doacPlan(drug, Number(crcl) || 80, bleed) : null;
  const warf = drug === "warfarin" ? warfarinPlan(thr.length > 0, bleed, Number(kg) || 0) : null;
  const sa = stentAdvice(stent ? Number(stent) : null, acs);
  const md = () => ["# Peri-operative plan", "", `- ${rcriRisk(rc.length)}`, mets ? "- Can manage 4 METs (two flights of stairs)." : "- Cannot manage 4 METs: consider further testing if it would change management.", ...(doac ? [`- ${drug}: ${doac.text}`, `- ${doac.restart}`] : []), ...(warf ?? []).map((w) => `- ${w}`), ...ANTIPLATELETS.filter((a) => ap.includes(a.id)).map((a) => `- ${a.label}: ${a.stop}`), ...(sa ? [`- ${sa}`] : [])].join("\n");

  return (
    <section className="cx-page cx-lab cx-bridging">
      <header className="cx-page-h"><div><h1>Pre-op Risk &amp; Anticoagulant Bridging</h1><p>Cardiac risk with the RCRI and functional capacity, and exactly when to stop and restart DOACs, warfarin and antiplatelets, with or without heparin bridging.</p></div></header>
      <h4>Revised Cardiac Risk Index</h4>
      <div className="cx-imaging-ticks">{RCRI.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={rc.includes(i)} onChange={() => setRc(rc.includes(i) ? rc.filter((y) => y !== i) : [...rc, i])} data-br-rc={i} /> {x}</label>)}</div>
      <label className="cx-pa-mine"><input type="checkbox" checked={mets} onChange={(e) => setMets(e.target.checked)} data-br="mets" /> Can climb two flights of stairs without stopping (4 METs or more)</label>
      <div className={`cx-cmp-out ${rc.length >= 2 && !mets ? "cx-ac-high" : "cx-ac-in"}`} data-br="rcri"><p><b>{rcriRisk(rc.length)}</b></p><p>{rc.length >= 1 && !mets ? "Poor or unknown functional capacity with risk factors: check BNP or NT-proBNP if available, and consider stress testing only if the result would change the plan; get an ECG." : "Proceed without further cardiac testing; continue beta-blockers and statins already taken."}</p></div>
      <h4>Anticoagulant</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Drug</span><select className="cx-select" value={drug} onChange={(e) => setDrug(e.target.value as typeof drug)} data-br="drug"><option value="none">None</option><option value="apixaban">Apixaban</option><option value="rivaroxaban">Rivaroxaban</option><option value="edoxaban">Edoxaban</option><option value="dabigatran">Dabigatran</option><option value="warfarin">Warfarin / acenocoumarol</option></select></label>
        <label className="cx-field"><span>CrCl (ml/min)</span><input className="cx-input" inputMode="numeric" value={crcl} onChange={(e) => setCrcl(e.target.value.replace(/\D/g, "").slice(0, 3))} data-br="crcl" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} data-br="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={bleed} onChange={(e) => setBleed(e.target.checked)} data-br="bleed" /> High bleeding-risk surgery or neuraxial anaesthesia</label>
      </div>
      {doac && <div className="cx-cmp-out cx-ac-high" data-br="doac"><p><b>{doac.text}</b></p><p>{doac.restart}</p>{bleed && <p>Spinal or epidural: allow at least 72 hours off apixaban, rivaroxaban or edoxaban (dabigatran 72–120 hours by kidney function) per ASRA.</p>}</div>}
      {drug === "warfarin" && (
        <>
          <h4>High thrombotic risk?</h4>
          <div className="cx-imaging-ticks">{HIGH_THROMBO.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={thr.includes(i)} onChange={() => setThr(thr.includes(i) ? thr.filter((y) => y !== i) : [...thr, i])} data-br-thr={i} /> {x}</label>)}</div>
          <div className={`cx-cmp-out ${thr.length ? "cx-ac-high" : "cx-ac-in"}`} data-br="warf" data-bridge={String(thr.length > 0)}><ol className="cx-c23-steps">{warf!.map((w) => <li key={w}>{w}</li>)}</ol></div>
        </>
      )}
      <h4>Antiplatelets and stents</h4>
      <div className="cx-c23-row">{ANTIPLATELETS.map((a) => <label key={a.id} className="cx-pa-mine"><input type="checkbox" checked={ap.includes(a.id)} onChange={() => setAp(ap.includes(a.id) ? ap.filter((x) => x !== a.id) : [...ap, a.id])} data-br-ap={a.id} /> {a.label}</label>)}</div>
      {ap.length > 0 && <ul data-br="ap">{ANTIPLATELETS.filter((a) => ap.includes(a.id)).map((a) => <li key={a.id}><b>{a.label}:</b> {a.stop}</li>)}</ul>}
      <div className="cx-c23-row">
        <label className="cx-field"><span>Coronary stent: months ago (blank if none)</span><input className="cx-input" inputMode="decimal" value={stent} onChange={(e) => setStent(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-br="stent" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={acs} onChange={(e) => setAcs(e.target.checked)} data-br="acs" /> Stent placed for ACS</label>
      </div>
      {sa && <p className="cx-set-hint cx-bk-err" data-br="stent-out"><b>{sa}</b></p>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Peri-operative plan", md())} data-br="print"><Printer size={14} /> Print the plan</button></div>
      <p className="cx-rs-foot"><ClipboardCheck size={13} /> CCS 2017, ESC 2022 non-cardiac surgery, ACC 2017 and ACCP 2022 peri-operative anticoagulation, PAUSE and BRIDGE trials. <TriangleAlert size={13} /> Agree the plan with the surgeon, anaesthetist and (for stents and valves) the cardiologist.</p>
    </section>
  );
}
