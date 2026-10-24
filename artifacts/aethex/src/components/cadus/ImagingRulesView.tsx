/**
 * Imaging Decision Rules: the Ottawa ankle and knee rules and the Canadian CT head and C-spine
 * rules, ticked at the bedside, to avoid unnecessary X-rays and CT scans safely.
 */
import { useState } from "react";
import { ScanLine, TriangleAlert } from "lucide-react";
import { canadianCSpine, canadianCtHead, ottawaAnkle, ottawaKnee } from "@/lib/cadus/clinic27";

type Rule = "ankle" | "knee" | "head" | "spine";
const RULES: [Rule, string][] = [["ankle", "Ottawa ankle and foot"], ["knee", "Ottawa knee"], ["head", "Canadian CT head"], ["spine", "Canadian C-spine"]];

export default function ImagingRulesView() {
  const [rule, setRule] = useState<Rule>("ankle");
  const [v, setV] = useState<Record<string, boolean>>({});
  const t = (k: string, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={!!v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} data-ir={k} /> {l}</label>;
  const res = rule === "ankle" ? ottawaAnkle({ malleolarPain: !!v.malleolarPain, lateralTender: !!v.lateralTender, medialTender: !!v.medialTender, midfootPain: !!v.midfootPain, fifthMetTender: !!v.fifthMetTender, navicularTender: !!v.navicularTender, cantBearWeight: !!v.cantBearWeight }).text
    : rule === "knee" ? ottawaKnee({ age55: !!v.age55, patellaOnly: !!v.patellaOnly, fibularHead: !!v.fibularHead, cantFlex90: !!v.cantFlex90, cantBearWeight: !!v.cantBearWeight }).text
    : rule === "head" ? canadianCtHead({ gcsUnder15At2h: !!v.gcs, openOrDepressed: !!v.open, basalSkull: !!v.basal, vomiting2: !!v.vomit, age65: !!v.age65, amnesia30: !!v.amnesia, dangerous: !!v.dangerous }).text
    : canadianCSpine({ age65: !!v.age65, dangerous: !!v.dangerous, paraesthesia: !!v.paraesthesia, lowRiskFactor: !!v.lowRisk, canRotate45: !!v.rotate }).text;

  return (
    <section className="cx-page cx-lab cx-imaging">
      <header className="cx-page-h"><div><h1>Imaging Decision Rules</h1><p>Validated bedside rules that tell you when an X-ray or CT is needed after an injury, and when it safely isn't.</p></div></header>
      <div className="cx-oncall-calls" role="tablist">{RULES.map(([r, l]) => <button key={r} role="tab" aria-selected={rule === r} className={rule === r ? "on" : ""} onClick={() => { setRule(r); setV({}); }} data-ir-rule={r}>{l}</button>)}</div>
      <div className="cx-imaging-ticks">
        {rule === "ankle" && <>{t("malleolarPain", "Pain in the malleolar zone")}{t("lateralTender", "Bone tenderness: back edge or tip of the lateral malleolus (lower 6 cm)")}{t("medialTender", "Bone tenderness: back edge or tip of the medial malleolus (lower 6 cm)")}{t("midfootPain", "Pain in the midfoot zone")}{t("fifthMetTender", "Bone tenderness: base of the 5th metatarsal")}{t("navicularTender", "Bone tenderness: navicular")}{t("cantBearWeight", "Can't take 4 steps, both straight after the injury and now")}</>}
        {rule === "knee" && <>{t("age55", "Age 55 or over")}{t("patellaOnly", "Tenderness of the patella only")}{t("fibularHead", "Tenderness of the head of the fibula")}{t("cantFlex90", "Can't bend the knee to 90°")}{t("cantBearWeight", "Can't take 4 steps, straight after the injury and now")}</>}
        {rule === "head" && <><p className="cx-set-hint">For minor head injury with GCS 13–15 and loss of consciousness, amnesia or disorientation.</p>{t("gcs", "GCS under 15 at 2 hours after the injury")}{t("open", "Suspected open or depressed skull fracture")}{t("basal", "Signs of basal skull fracture (racoon eyes, Battle's sign, CSF leak, haemotympanum)")}{t("vomit", "Vomiting twice or more")}{t("age65", "Age 65 or over")}{t("amnesia", "Amnesia for 30 minutes or more before the impact")}{t("dangerous", "Dangerous mechanism (pedestrian hit, ejected, fall from over 3 feet or 5 stairs)")}</>}
        {rule === "spine" && <><p className="cx-set-hint">For alert (GCS 15), stable trauma patients.</p>{t("age65", "Age 65 or over")}{t("dangerous", "Dangerous mechanism (fall from 3 feet or 5 stairs, axial load, high-speed or rollover crash, bicycle collision)")}{t("paraesthesia", "Tingling or numbness in the limbs")}{t("lowRisk", "A low-risk factor: simple rear-end crash, sitting in the ED, walking at any time, delayed neck pain, or no midline tenderness")}{t("rotate", "Can actively rotate the neck 45° left and right")}</>}
      </div>
      <div className="cx-cmp-out" data-ir="out"><h3 className="cx-lab-h3" data-ir="result">{res}</h3></div>
      <p className="cx-rs-foot"><ScanLine size={13} /> Ottawa and Canadian rules (Stiell and colleagues). <TriangleAlert size={13} /> Clinical judgement overrides a rule: intoxication, distracting injuries or a poor examination need imaging.</p>
    </section>
  );
}
