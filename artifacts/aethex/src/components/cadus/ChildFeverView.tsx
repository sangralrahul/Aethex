/**
 * Fever in Under-5s: the NICE traffic-light system (green, amber, red) with what to do, and
 * paracetamol and ibuprofen doses by weight, with a safety-net handout for parents.
 */
import { useState } from "react";
import { Thermometer, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { antipyretics, FEVER_SIGNS, feverTraffic } from "@/lib/cadus/clinic31";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function ChildFeverView(h: H) {
  const [sel, setSel] = useState<string[]>([]);
  const [kg, setKg] = useState("");
  const [months, setMonths] = useState("");
  const t = feverTraffic(sel);
  const doses = antipyretics(Number(kg), Number(months) || 12);
  const md = ["# Your child has a fever", "", "- Give plenty of fluids (breastfeed more often); keep the child lightly dressed.", ...doses.slice(0, 2).map((d) => `- ${d}`), "- Check on your child during the night.", "", "## Go to hospital at once if your child", "- Has a rash that does not fade when you press a glass on it", "- Is very sleepy, floppy or hard to wake, or cries weakly or non-stop", "- Breathes fast, grunts, or the skin between the ribs sucks in", "- Has a fit, a bulging soft spot, or a stiff neck", "- Is blue, grey or mottled, or has cold hands and feet with fever", "- Is not drinking, or has no wet nappy for 12 hours", "", "## See the doctor again if the fever lasts 5 days or more, or you are worried."].join("\n");

  return (
    <section className="cx-page cx-lab cx-cfever">
      <header className="cx-page-h"><div><h1>Fever in Under-5s</h1><p>The NICE traffic-light check for serious illness in a feverish child, what to do for green, amber and red, antipyretic doses, and a safety-net sheet for parents.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="10" data-cf="kg" /></label>
        <label className="cx-field"><span>Age (months)</span><input className="cx-input" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="12" data-cf="months" /></label>
      </div>
      <div className="cx-c23-two">
        <div><h4>Red features</h4><div className="cx-imaging-ticks">{FEVER_SIGNS.filter((f) => f.level === "red").map((f) => <label key={f.id} className="cx-pa-mine"><input type="checkbox" checked={sel.includes(f.id)} onChange={() => setSel(sel.includes(f.id) ? sel.filter((x) => x !== f.id) : [...sel, f.id])} data-cf-s={f.id} /> {f.label}</label>)}</div></div>
        <div><h4>Amber features</h4><div className="cx-imaging-ticks">{FEVER_SIGNS.filter((f) => f.level === "amber").map((f) => <label key={f.id} className="cx-pa-mine"><input type="checkbox" checked={sel.includes(f.id)} onChange={() => setSel(sel.includes(f.id) ? sel.filter((x) => x !== f.id) : [...sel, f.id])} data-cf-s={f.id} /> {f.label}</label>)}</div></div>
      </div>
      <div className={`cx-cmp-out cx-tl-${t.level}`} data-cf="out" data-level={t.level}><h3 className="cx-lab-h3">{t.level === "red" ? "Red" : t.level === "amber" ? "Amber" : "Green"}</h3><p>{t.text}</p></div>
      {doses.length > 0 && <ul data-cf="doses">{doses.map((d) => <li key={d}>{d}</li>)}</ul>}
      <p className="cx-set-hint">In India also think of malaria, dengue, typhoid, UTI and pneumonia: see Tropical Fevers and IMNCI Sick Child.</p>
      <h4>Safety-net sheet for parents</h4>
      <HandoutActions md={md} title="Your child has a fever" {...h} />
      <p className="cx-rs-foot"><Thermometer size={13} /> NICE NG143 traffic-light system. <TriangleAlert size={13} /> A child who looks unwell needs urgent care whatever the temperature.</p>
    </section>
  );
}
