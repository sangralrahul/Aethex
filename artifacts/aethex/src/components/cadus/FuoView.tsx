/**
 * Fever of Unknown Origin: definitions and categories, staged tests, and the causes that matter in
 * India (TB, enteric fever, scrub typhus, kala-azar, brucellosis, abscess, endocarditis, lymphoma, Still's).
 */
import { useState } from "react";
import { Thermometer, TriangleAlert } from "lucide-react";
import { fuoPlan, type FuoCategory, type FuoInput } from "@/lib/cadus/clinic48";

export default function FuoView() {
  const [x, setX] = useState<FuoInput>({ weeks: 0, category: "classic", eschar: false, kalaAzarArea: false, animal: false, over50: false, arthritisRash: false, murmur: false, drugsNew: false });
  const r = fuoPlan(x);
  const cb = (k: Exclude<keyof FuoInput, "weeks" | "category">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-fuo={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-fuo">
      <header className="cx-page-h"><div><h1>Fever of Unknown Origin</h1><p>Prolonged fever without a diagnosis after the basic tests. Confirm the fever, hold antibiotics and steroids if stable, and investigate in stages.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weeks of fever</span><input className="cx-input" inputMode="numeric" value={x.weeks || ""} onChange={(e) => setX({ ...x, weeks: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="4" data-fuo="weeks" /></label>
        <label className="cx-field"><span>Type</span><select className="cx-select" value={x.category} onChange={(e) => setX({ ...x, category: e.target.value as FuoCategory })} data-fuo="category"><option value="classic">Classic (community)</option><option value="hospital">Hospital-acquired</option><option value="hiv">HIV</option><option value="neutropenic">Neutropenic</option></select></label>
      </div>
      <div className="cx-imaging-ticks">{cb("eschar", "Eschar (black scab)")}{cb("kalaAzarArea", "Kala-azar area, big spleen")}{cb("animal", "Animals, farm or raw milk")}{cb("murmur", "Murmur or embolic signs")}{cb("arthritisRash", "Rash, arthritis, sore throat")}{cb("over50", "Over 50 with headache or jaw pain")}{cb("drugsNew", "New medicines")}</div>
      <div className={`cx-cmp-out ${x.category === "neutropenic" ? "cx-st-out" : "cx-ac-high"}`} data-fuo="out" data-fuo-yes={String(r.fuo)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Thermometer size={13} /> Durack and Street criteria, API and ICMR fever guidance. <TriangleAlert size={13} /> A trial of anti-TB treatment only after cultures and biopsies, and with specialist advice.</p>
    </section>
  );
}
