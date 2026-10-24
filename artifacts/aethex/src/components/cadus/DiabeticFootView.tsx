/**
 * Diabetic Foot: IWGDF/IDSA infection severity with antibiotics, the Wagner grade, ABI, the IWGDF
 * risk category and screening interval, and a foot-care handout in the patient's language.
 */
import { useState } from "react";
import { Footprints, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { MdBlock } from "./LiveAnswer";
import { abiText, FOOT_CARE_MD, footInfection, footRisk, WAGNER } from "@/lib/cadus/clinic28";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };
const SIGNS = ["Swelling or induration", "Redness 0.5 cm or more around the wound", "Tenderness or pain", "Warmth", "Pus"];
const SIRS = ["Temperature over 38 or under 36 °C", "Heart rate over 90", "Respiratory rate over 20 (or PaCO2 under 32)", "WBC over 12,000 or under 4,000"];

export default function DiabeticFootView(h: H) {
  const [tab, setTab] = useState<"infection" | "risk" | "handout">("infection");
  const [signs, setSigns] = useState<string[]>([]);
  const [sirs, setSirs] = useState<string[]>([]);
  const [x, setX] = useState({ erythemaOver2cm: false, deep: false, probeBone: false });
  const [wagner, setWagner] = useState(1);
  const [abi, setAbi] = useState("");
  const [r, setR] = useState({ lops: false, pad: false, deformity: false, history: false });
  const inf = footInfection({ signs: signs.length, sirs: sirs.length, ...x });
  const risk = footRisk(r);
  const toggle = (list: string[], set: (l: string[]) => void, s: string) => set(list.includes(s) ? list.filter((y) => y !== s) : [...list, s]);

  return (
    <section className="cx-page cx-lab cx-dfoot">
      <header className="cx-page-h"><div><h1>Diabetic Foot</h1><p>How severe a foot infection is and which antibiotics, the Wagner grade and ABI, the risk category with how often to screen, and a foot-care handout.</p></div></header>
      <div className="cx-seg" role="tablist">{([["infection", "Ulcer and infection"], ["risk", "Risk screening"], ["handout", "Foot-care handout"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-df-tab={k}>{l}</button>)}</div>
      {tab === "infection" && (
        <>
          <p className="cx-set-hint">Local signs of infection:</p>
          <div className="cx-c23-row">{SIGNS.map((s, i) => <label key={s} className="cx-pa-mine"><input type="checkbox" checked={signs.includes(s)} onChange={() => toggle(signs, setSigns, s)} data-df-sign={i} /> {s}</label>)}</div>
          <div className="cx-c23-row">
            <label className="cx-pa-mine"><input type="checkbox" checked={x.erythemaOver2cm} onChange={(e) => setX({ ...x, erythemaOver2cm: e.target.checked })} data-df="ery" /> Redness more than 2 cm from the wound</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={x.deep} onChange={(e) => setX({ ...x, deep: e.target.checked })} /> Deeper than skin: abscess, fasciitis, tendon, joint or bone</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={x.probeBone} onChange={(e) => setX({ ...x, probeBone: e.target.checked })} data-df="probe" /> Probe reaches bone</label>
          </div>
          <p className="cx-set-hint">Signs of systemic illness (SIRS):</p>
          <div className="cx-c23-row">{SIRS.map((s, i) => <label key={s} className="cx-pa-mine"><input type="checkbox" checked={sirs.includes(s)} onChange={() => toggle(sirs, setSirs, s)} data-df-sirs={i} /> {s}</label>)}</div>
          <div className={`cx-cmp-out cx-df-l${inf.level}`} data-df="out" data-level={inf.level}><h3 className="cx-lab-h3" data-df="grade">{inf.grade}</h3><ul>{inf.plan.map((p) => <li key={p}>{p}</li>)}</ul></div>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Wagner grade</span><select className="cx-select" value={wagner} onChange={(e) => setWagner(Number(e.target.value))}>{WAGNER.map((w, i) => <option key={w} value={i}>{w}</option>)}</select></label>
            <label className="cx-field"><span>Ankle-brachial index</span><input className="cx-input" inputMode="decimal" value={abi} onChange={(e) => setAbi(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="0.85" data-df="abi" /></label>
          </div>
          {abi && <p className="cx-set-hint" data-df="abi-out"><b>{abiText(Number(abi))}</b></p>}
          {wagner >= 4 && <p className="cx-bk-err" role="alert"><TriangleAlert size={13} /> Gangrene: same-day surgical and vascular review.</p>}
          <h4>For every ulcer</h4>
          <ul><li>Offload: total contact cast or a removable knee-high walker for plantar ulcers; no walking barefoot.</li><li>Sharp debridement of slough and callus; moist dressing; review every week.</li><li>Check pulses, ABI or toe pressure; refer if the ulcer has not halved in 4 weeks.</li><li>Tight glucose control; tetanus status.</li></ul>
        </>
      )}
      {tab === "risk" && (
        <>
          <div className="cx-imaging-ticks">
            <label className="cx-pa-mine"><input type="checkbox" checked={r.lops} onChange={(e) => setR({ ...r, lops: e.target.checked })} data-df="lops" /> Loss of protective sensation (10 g monofilament or 128 Hz tuning fork)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={r.pad} onChange={(e) => setR({ ...r, pad: e.target.checked })} /> Peripheral artery disease (absent pulses, ABI under 0.9)</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={r.deformity} onChange={(e) => setR({ ...r, deformity: e.target.checked })} /> Foot deformity, callus or pre-ulcerative lesion</label>
            <label className="cx-pa-mine"><input type="checkbox" checked={r.history} onChange={(e) => setR({ ...r, history: e.target.checked })} data-df="history" /> Previous ulcer, amputation or end-stage kidney disease</label>
          </div>
          <div className="cx-cmp-out" data-df="risk"><h3 className="cx-lab-h3">IWGDF risk {risk.cat}: {risk.text}</h3><p>Screen the feet: <b data-df="interval">{risk.interval}</b>{risk.cat >= 2 ? ". Prescribed footwear and podiatry." : "."}</p></div>
        </>
      )}
      {tab === "handout" && <><div className="cx-c23-doc" data-df="handout"><MdBlock text={FOOT_CARE_MD} /></div><HandoutActions md={FOOT_CARE_MD} title="Looking after your feet" {...h} /></>}
      <p className="cx-rs-foot"><Footprints size={13} /> IWGDF/IDSA 2023 guidelines. <TriangleAlert size={13} /> Antibiotic choice should follow local resistance patterns and tissue culture.</p>
    </section>
  );
}
