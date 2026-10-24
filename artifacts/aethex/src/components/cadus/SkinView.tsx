/**
 * Skin Infections: scabies (with a household handout), tinea and steroid-cream misuse, impetigo,
 * cellulitis and necrotising fasciitis red flags, and shingles.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { CELLULITIS, impetigoPlan, scabiesPlan, TINEA, ZOSTER } from "@/lib/cadus/clinic30";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function SkinView(h: H) {
  const [tab, setTab] = useState<"scabies" | "tinea" | "impetigo" | "cellulitis" | "zoster">("scabies");
  const [kg, setKg] = useState("");
  const [preg, setPreg] = useState(false);
  const [infant, setInfant] = useState(false);
  const w = Number(kg) || 60;
  const sc = scabiesPlan(w, preg, infant);
  const md = ["# Treating scabies at home", "", ...sc.map((s) => `- ${s}`)].join("\n");

  return (
    <section className="cx-page cx-lab cx-skin">
      <header className="cx-page-h"><div><h1>Skin Infections</h1><p>Scabies with a household handout, tinea and the steroid-cream problem, impetigo, cellulitis with necrotising fasciitis red flags, and shingles.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="60" data-sk="kg" /></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={preg} onChange={(e) => setPreg(e.target.checked)} data-sk="preg" /> Pregnant</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={infant} onChange={(e) => setInfant(e.target.checked)} /> Infant under 2</label>
      </div>
      <div className="cx-seg" role="tablist">{([["scabies", "Scabies"], ["tinea", "Tinea"], ["impetigo", "Impetigo"], ["cellulitis", "Cellulitis"], ["zoster", "Shingles"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-sk-tab={k}>{l}</button>)}</div>
      {tab === "scabies" && <><ul data-sk="scabies">{sc.map((s) => <li key={s}>{s}</li>)}</ul><HandoutActions md={md} title="Treating scabies at home" {...h} /></>}
      {tab === "tinea" && <ul data-sk="tinea">{TINEA.map((s) => <li key={s}>{s}</li>)}</ul>}
      {tab === "impetigo" && <ul data-sk="impetigo">{impetigoPlan(w, w >= 40).map((s) => <li key={s}>{s}</li>)}</ul>}
      {tab === "cellulitis" && <ul data-sk="cellulitis">{CELLULITIS.map((s) => <li key={s}>{s}</li>)}</ul>}
      {tab === "zoster" && <ul data-sk="zoster">{ZOSTER.map((s) => <li key={s}>{s}</li>)}</ul>}
      <p className="cx-rs-foot"><Hand size={13} /> IADVL consensus on dermatophytosis, BAD scabies guidance, NICE CKS. <TriangleAlert size={13} /> Fixed-dose steroid-antifungal-antibiotic creams should not be prescribed for skin infections.</p>
    </section>
  );
}
