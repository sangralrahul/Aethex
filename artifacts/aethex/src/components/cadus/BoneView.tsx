/**
 * Osteoporosis & Bone Health: T-score category, who to treat (fracture, T-score, FRAX, steroids),
 * which drug by kidney function and risk, and calcium, vitamin D and falls prevention.
 */
import { useState } from "react";
import { Bone, Printer, TriangleAlert } from "lucide-react";
import { bonePlan, tCategory } from "@/lib/cadus/clinic32";

export default function BoneView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [v, setV] = useState({ t: "", major: "", hip: "", age: "", crcl: "" });
  const [x, setX] = useState({ fragilityFracture: false, vertebralMultiple: false, steroids: false, dental: true });
  const tNum = v.t === "" ? undefined : -Math.abs(Number(v.t.replace(/^-/, "")));
  const p = bonePlan({ t: tNum, frax10Major: v.major ? Number(v.major) : undefined, frax10Hip: v.hip ? Number(v.hip) : undefined, age: Number(v.age) || 65, crcl: v.crcl ? Number(v.crcl) : undefined, ...x });
  const f = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.-]/g, "").slice(0, 5) })} placeholder={ph} data-bo={k} /></label>;
  const md = () => ["# Bone health plan", "", tNum !== undefined ? `- T-score ${tNum}: ${tCategory(tNum)}` : "", `- ${p.why}`, ...p.drugs.map((d) => `- ${d}`), "", ...p.general.map((g) => `- ${g}`)].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-bone">
      <header className="cx-page-h"><div><h1>Osteoporosis &amp; Bone Health</h1><p>What the DXA T-score means, who needs treatment, which drug suits the patient, and calcium, vitamin D and falls prevention for everyone.</p></div></header>
      <div className="cx-c23-row">
        {f("t", "Lowest T-score (spine or hip)", "-2.7")}{f("age", "Age", "68")}{f("major", "FRAX major fracture % (optional)", "")}{f("hip", "FRAX hip % (optional)", "")}{f("crcl", "CrCl (optional)", "")}
      </div>
      <div className="cx-c23-row">{([["fragilityFracture", "Hip or vertebral fragility fracture"], ["vertebralMultiple", "Several vertebral fractures"], ["steroids", "Prednisolone 7.5 mg or more for 3 months or longer"], ["dental", "Dental work planned or poor dental health"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-bo={k} /> {l}</label>)}</div>
      {tNum !== undefined && <p className="cx-set-hint" data-bo="cat"><b>T-score {tNum}: {tCategory(tNum)}</b> (normal −1 or above; osteopenia between −1 and −2.5; osteoporosis −2.5 or below).</p>}
      <div className={`cx-cmp-out ${p.treat ? "cx-ac-high" : "cx-ac-in"}`} data-bo="out" data-treat={String(p.treat)}><h3 className="cx-lab-h3">{p.why}</h3>{p.drugs.length > 0 && <ul data-bo="drugs">{p.drugs.map((d) => <li key={d}>{d}</li>)}</ul>}</div>
      <h4>For everyone</h4><ul>{p.general.map((g) => <li key={g}>{g}</li>)}</ul>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Bone health plan", md())}><Printer size={14} /> Print</button></div>
      <p className="cx-rs-foot"><Bone size={13} /> WHO T-score definitions; BHOF, NOGG and the Indian Menopause Society guidance. <TriangleAlert size={13} /> Calculate FRAX with the India model online and enter it here.</p>
    </section>
  );
}
