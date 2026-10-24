/**
 * Sick-Day Rules: which of the patient's medicines to pause when they are vomiting, have diarrhoea
 * or a fever (SADMANS), steroid and insulin rules, as a handout in the patient's language.
 */
import { useState } from "react";
import { ThermometerSun } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { MdBlock } from "./LiveAnswer";
import { SICK_DAY, sickDayMarkdown } from "@/lib/cadus/clinic27";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function SickDayView(h: H) {
  const [sel, setSel] = useState<string[]>(["Metformin"]);
  const [steroid, setSteroid] = useState(false);
  const [insulin, setInsulin] = useState(false);
  const md = sickDayMarkdown(sel, steroid, insulin);
  return (
    <section className="cx-page cx-lab cx-sickday">
      <header className="cx-page-h"><div><h1>Sick-Day Rules</h1><p>Which medicines to pause when a patient is vomiting, has diarrhoea or a fever, and the rules for steroids and insulin, as a handout in their language.</p></div></header>
      <p className="cx-set-hint">Tick the medicines the patient takes:</p>
      <div className="cx-c23-row">
        {SICK_DAY.map((r) => <label key={r.drug} className="cx-pa-mine"><input type="checkbox" checked={sel.includes(r.drug)} onChange={() => setSel(sel.includes(r.drug) ? sel.filter((x) => x !== r.drug) : [...sel, r.drug])} data-sd={r.drug} /> {r.drug} <small>({r.examples})</small></label>)}
        <label className="cx-pa-mine"><input type="checkbox" checked={steroid} onChange={(e) => setSteroid(e.target.checked)} data-sd="steroid" /> Long-term steroids</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={insulin} onChange={(e) => setInsulin(e.target.checked)} data-sd="insulin" /> Insulin</label>
      </div>
      <div className="cx-c23-doc" data-sd="doc"><MdBlock text={md} /></div>
      <HandoutActions md={md} title="When you are unwell: your medicines" {...h} />
      <p className="cx-rs-foot"><ThermometerSun size={13} /> SADMANS sick-day guidance (sulfonylureas, ACE inhibitors, diuretics, metformin, ARBs, NSAIDs, SGLT2 inhibitors).</p>
    </section>
  );
}
