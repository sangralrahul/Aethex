/**
 * Upper GI Bleed & H. pylori: the Glasgow-Blatchford score, resuscitation and endoscopy plan
 * (including variceal bleeding and anticoagulants), and H. pylori testing and eradication.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { glasgowBlatchford, hpylori, ugibPlan, type UreaUnit } from "@/lib/cadus/clinic32";

export default function UgibView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"bleed" | "hp">("bleed");
  const [v, setV] = useState({ urea: "", hb: "", sbp: "" });
  const [unit, setUnit] = useState<UreaUnit>("mgdl");
  const [x, setX] = useState({ male: true, pulse100: false, melaena: false, syncope: false, liver: false, heartFailure: false, variceal: false, anticoag: false, cardiac: false });
  const [h, setH] = useState({ pen: false, failed: false });
  const n = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const g = v.urea && v.hb ? glasgowBlatchford({ urea: Number(v.urea), unit, hb: Number(v.hb), male: x.male, sbp: Number(v.sbp) || 0, pulse100: x.pulse100, melaena: x.melaena, syncope: x.syncope, liver: x.liver, heartFailure: x.heartFailure }) : null;
  const plan = ugibPlan(x.variceal, x.anticoag, x.cardiac);
  const hp = hpylori(h.pen, h.failed);
  const tick = (k: keyof typeof x, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-gi={k} /> {l}</label>;
  const md = () => tab === "bleed" ? ["# Upper GI bleed", "", g ? `**${g.text}**` : "", ...plan.map((p) => `- ${p}`)].filter(Boolean).join("\n") : [`# ${hp.regimen}`, "", ...hp.lines.map((l) => `- ${l}`), "", ...hp.notes.map((l) => `- ${l}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-ugib">
      <header className="cx-page-h"><div><h1>Upper GI Bleed &amp; H. pylori</h1><p>The Glasgow-Blatchford score, resuscitation, endoscopy timing and treatment after it (including varices and anticoagulants), and H. pylori testing and eradication.</p></div></header>
      <div className="cx-seg" role="tablist">{([["bleed", "Bleeding"], ["hp", "H. pylori"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-gi-tab={k}>{l}</button>)}</div>
      {tab === "bleed" ? (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Urea</span><input className="cx-input" inputMode="decimal" value={v.urea} onChange={(e) => setV({ ...v, urea: n(e.target.value) })} placeholder="60" data-gi="urea" /></label>
            <label className="cx-field"><span>Unit</span><select className="cx-select" value={unit} onChange={(e) => setUnit(e.target.value as UreaUnit)} data-gi="unit"><option value="mgdl">Urea mg/dL</option><option value="bun">BUN mg/dL</option><option value="mmol">Urea mmol/L</option></select></label>
            <label className="cx-field"><span>Hb (g/dL)</span><input className="cx-input" inputMode="decimal" value={v.hb} onChange={(e) => setV({ ...v, hb: n(e.target.value) })} placeholder="9" data-gi="hb" /></label>
            <label className="cx-field"><span>Systolic BP</span><input className="cx-input" inputMode="numeric" value={v.sbp} onChange={(e) => setV({ ...v, sbp: n(e.target.value) })} placeholder="95" data-gi="sbp" /></label>
          </div>
          <div className="cx-c23-row">{tick("male", "Male")}{tick("pulse100", "Pulse 100 or more")}{tick("melaena", "Melaena")}{tick("syncope", "Syncope")}{tick("liver", "Liver disease")}{tick("heartFailure", "Heart failure")}</div>
          {g && <div className={`cx-cmp-out ${g.score >= 7 ? "cx-st-out" : g.score <= 1 ? "cx-ac-in" : "cx-ac-high"}`} data-gi="gbs"><h3 className="cx-lab-h3" data-gi="score">{g.text}</h3></div>}
          <div className="cx-c23-row">{tick("variceal", "Cirrhosis or suspected varices")}{tick("anticoag", "On an anticoagulant")}{tick("cardiac", "Heart disease")}</div>
          <ol className="cx-c23-steps" data-gi="plan">{plan.map((p) => <li key={p}>{p}</li>)}</ol>
        </>
      ) : (
        <>
          <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={h.pen} onChange={(e) => setH({ ...h, pen: e.target.checked })} data-gi="pen" /> Penicillin allergy</label><label className="cx-pa-mine"><input type="checkbox" checked={h.failed} onChange={(e) => setH({ ...h, failed: e.target.checked })} data-gi="failed" /> First treatment failed</label></div>
          <div className="cx-cmp-out" data-gi="hp"><h3 className="cx-lab-h3" data-gi="regimen">{hp.regimen}</h3><ul>{hp.lines.map((l) => <li key={l}>{l}</li>)}</ul></div>
          <ul>{hp.notes.map((l) => <li key={l}>{l}</li>)}</ul>
        </>
      )}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint(tab === "bleed" ? "Upper GI bleed" : "H. pylori treatment", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> ESGE 2021 and ACG 2021 for non-variceal bleeding, Baveno VII for varices, Maastricht VI and the Indian consensus for H. pylori.</p>
    </section>
  );
}
