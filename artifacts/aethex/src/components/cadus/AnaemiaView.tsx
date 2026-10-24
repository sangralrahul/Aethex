/**
 * Anaemia & Iron: the WHO grade for the person's group, oral iron, and the total iron deficit by
 * Ganzoni with ferric carboxymaltose or iron sucrose doses when IV iron is needed.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { anaemiaGrade, ganzoni, ivIronPlan, type AnaemiaGroup } from "@/lib/cadus/clinic26";

const GROUPS: [AnaemiaGroup, string][] = [["woman", "Woman (not pregnant)"], ["pregnant", "Pregnant woman"], ["man", "Man"], ["child6-59m", "Child 6–59 months"], ["child5-11y", "Child 5–11 years"], ["child12-14y", "Child 12–14 years"]];

export default function AnaemiaView() {
  const [group, setGroup] = useState<AnaemiaGroup>("woman");
  const [hb, setHb] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");
  const h = Number(hb), w = Number(weight);
  const grade = h > 0 ? anaemiaGrade(h, group) : null;
  const tgt = Number(target) || (group === "pregnant" ? 11 : group.startsWith("child") && w < 35 ? 12 : 15);
  const deficit = w > 0 && h > 0 ? ganzoni(w, h, tgt) : null;
  const iv = deficit ? ivIronPlan(deficit, w) : null;
  const child = group.startsWith("child");

  return (
    <section className="cx-page cx-lab cx-anaemia">
      <header className="cx-page-h"><div><h1>Anaemia &amp; Iron</h1><p>The WHO grade of anaemia for the person, oral iron, and when IV iron is needed, the total iron deficit (Ganzoni) with ferric carboxymaltose or iron sucrose doses.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="Group">{GROUPS.map(([v, l]) => <button key={v} role="radio" aria-checked={group === v} className={group === v ? "on" : ""} onClick={() => setGroup(v)} data-an-group={v}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Hb (g/dL)</span><input className="cx-input" inputMode="decimal" value={hb} onChange={(e) => setHb(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="8.2" data-an="hb" /></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="55" data-an="weight" /></label>
        <label className="cx-field"><span>Target Hb (g/dL)</span><input className="cx-input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder={String(tgt)} /></label>
      </div>
      {grade && (
        <div className="cx-cmp-out" data-an="out">
          <h3 className="cx-lab-h3" data-an="grade">{grade === "none" ? "No anaemia" : `${grade[0].toUpperCase()}${grade.slice(1)} anaemia`}</h3>
          {grade !== "none" && <ul>
            <li>Look for the cause: diet, worms, blood loss (menstrual, gut, piles), pregnancy spacing; consider thalassaemia trait if MCV is low with a normal or high red cell count, and B12 or folate deficiency if MCV is high.</li>
            <li>{child ? `Oral iron 3 mg/kg/day of elemental iron${w ? ` (about ${Math.round(w * 3)} mg a day)` : ""} for 3 months, with deworming (albendazole) if over 1 year.` : "Oral iron 60–120 mg elemental iron a day (1–2 IFA tablets) or on alternate days, with vitamin C and away from tea, for 3 months after Hb is normal."}</li>
            <li>Recheck Hb in 4 weeks: expect a rise of at least 1 g/dL; if not, check adherence and the cause, or switch to IV iron.</li>
            {grade === "severe" && <li><b>Severe:</b> {group === "pregnant" ? "admit; IV iron, and transfusion if Hb is under 5 g/dL, after 34 weeks under 7, or with heart failure." : "refer or admit; transfuse if unstable, in heart failure or Hb is very low; find the cause before transfusing when possible."}</li>}
          </ul>}
          {grade !== "none" && deficit && iv && (
            <div className="cx-an-iv" data-an="iv">
              <h4><Droplets size={13} /> If IV iron is needed</h4>
              <p>Total iron deficit (Ganzoni, target {tgt} g/dL): <b data-an="deficit">{deficit} mg</b></p>
              <ul><li>{iv.fcm}</li><li>{iv.sucrose}</li></ul>
              <p className="cx-set-hint">IV iron when oral iron fails or isn't tolerated, in moderate or severe anaemia in the second or third trimester, after bariatric surgery or in CKD. Not in the first trimester. Watch for 30 minutes for reactions.</p>
            </div>
          )}
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> WHO 2011 haemoglobin thresholds; Anaemia Mukt Bharat guidance for doses and IV iron in pregnancy.</p>
    </section>
  );
}
