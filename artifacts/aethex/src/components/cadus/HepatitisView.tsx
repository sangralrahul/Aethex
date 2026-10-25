/**
 * Hepatitis B & C: reading a hepatitis B panel, who needs treatment (with APRI), tenofovir or
 * entecavir, pregnancy, vaccination, and hepatitis C confirmation and sofosbuvir-based treatment.
 */
import { useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { apri, HBV_VACCINE, hbvSerology, hbvTreat, HCV, type HbvPanel, type Pos } from "@/lib/cadus/clinic32";

export default function HepatitisView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"panel" | "treat" | "hcv">("panel");
  const [p, setP] = useState<HbvPanel>({ hbsag: "na", antiHbc: "na", igmHbc: "na", antiHbs: "na" });
  const [t, setT] = useState({ dna: "", alt: "", uln: "40", ast: "", plt: "", age: "", cirrhosis: false, hbeag: false, family: false, pregnant: false, ckd: false });
  const s = hbvSerology(p);
  const ap = apri(Number(t.ast), Number(t.uln), Number(t.plt));
  const tr = hbvTreat({ cirrhosis: t.cirrhosis, dna: t.dna ? Number(t.dna) : undefined, alt: t.alt ? Number(t.alt) : undefined, altUln: Number(t.uln) || 40, hbeag: t.hbeag, age: Number(t.age) || 30, familyHcc: t.family, apri: ap, pregnant: t.pregnant, ckd: t.ckd });
  const n = (v: string) => v.replace(/[^\d.]/g, "").slice(0, 10);
  const sel = (k: keyof HbvPanel, l: string) => <label className="cx-field"><span>{l}</span><select className="cx-select" value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value as Pos })} data-hb={k}><option value="na">Not done</option><option value="pos">Positive</option><option value="neg">Negative</option></select></label>;
  const md = () => tab === "hcv" ? ["# Hepatitis C", "", ...HCV.map((h) => `- ${h}`)].join("\n") : ["# Hepatitis B", "", `- ${s.meaning}: ${s.next}`, `- ${tr.why}`, ...tr.drug.map((d) => `- ${d}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-hep">
      <header className="cx-page-h"><div><h1>Hepatitis B &amp; C</h1><p>Read a hepatitis B blood panel, decide who needs treatment and with what, protect the newborn, vaccinate, and confirm and cure hepatitis C.</p></div></header>
      <div className="cx-seg" role="tablist">{([["panel", "Hepatitis B panel"], ["treat", "Treat hepatitis B?"], ["hcv", "Hepatitis C"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-hb-tab={k}>{l}</button>)}</div>
      {tab === "panel" && (
        <>
          <div className="cx-c23-row">{sel("hbsag", "HBsAg")}{sel("antiHbc", "Total anti-HBc")}{sel("igmHbc", "IgM anti-HBc")}{sel("antiHbs", "Anti-HBs")}</div>
          <div className="cx-cmp-out" data-hb="out"><h3 className="cx-lab-h3" data-hb="meaning">{s.meaning}</h3><p>{s.next}</p></div>
          <h4>Vaccination</h4><ul>{HBV_VACCINE.map((h) => <li key={h}>{h}</li>)}</ul>
        </>
      )}
      {tab === "treat" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>HBV DNA (IU/ml)</span><input className="cx-input" inputMode="numeric" value={t.dna} onChange={(e) => setT({ ...t, dna: n(e.target.value) })} placeholder="25000" data-hb="dna" /></label>
            <label className="cx-field"><span>ALT</span><input className="cx-input" inputMode="numeric" value={t.alt} onChange={(e) => setT({ ...t, alt: n(e.target.value) })} placeholder="80" data-hb="alt" /></label>
            <label className="cx-field"><span>Upper limit of normal</span><input className="cx-input" inputMode="numeric" value={t.uln} onChange={(e) => setT({ ...t, uln: n(e.target.value) })} /></label>
            <label className="cx-field"><span>AST</span><input className="cx-input" inputMode="numeric" value={t.ast} onChange={(e) => setT({ ...t, ast: n(e.target.value) })} data-hb="ast" /></label>
            <label className="cx-field"><span>Platelets (×10⁹/L)</span><input className="cx-input" inputMode="numeric" value={t.plt} onChange={(e) => setT({ ...t, plt: n(e.target.value) })} data-hb="plt" /></label>
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={t.age} onChange={(e) => setT({ ...t, age: n(e.target.value) })} /></label>
          </div>
          <div className="cx-c23-row">{([["cirrhosis", "Cirrhosis"], ["hbeag", "HBeAg positive"], ["family", "Family history of liver cancer"], ["pregnant", "Pregnant"], ["ckd", "Kidney or bone disease"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.checked })} data-hb={k} /> {l}</label>)}</div>
          {ap !== null && <p className="cx-set-hint" data-hb="apri">APRI {ap}{ap > 1.5 ? ": significant fibrosis likely" : ap > 0.5 ? ": some fibrosis possible; confirm with elastography" : ""}</p>}
          <div className={`cx-cmp-out ${tr.treat ? "cx-ac-high" : "cx-ac-in"}`} data-hb="treat" data-treat={String(tr.treat)}><h3 className="cx-lab-h3">{tr.why}</h3>{tr.drug.length > 0 && <ul>{tr.drug.map((d) => <li key={d}>{d}</li>)}</ul>}</div>
        </>
      )}
      {tab === "hcv" && <ul data-hb="hcv">{HCV.map((h) => <li key={h}>{h}</li>)}</ul>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint(tab === "hcv" ? "Hepatitis C" : "Hepatitis B", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> WHO 2024 hepatitis B guidelines, EASL 2017, INASL and the National Viral Hepatitis Control Programme. Refer decompensated liver disease, co-infection (HIV, HDV) and children to a specialist.</p>
    </section>
  );
}
