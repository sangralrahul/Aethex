/**
 * Malnutrition (SAM) Helper: for children 6–59 months, MUAC, weight-for-height and oedema to
 * SAM, MAM or normal; who needs the NRC; F-75 and F-100 volumes by weight; the steps of care.
 */
import { useState } from "react";
import { Printer, Scale, TriangleAlert } from "lucide-react";
import { samPlan, type SamIn } from "@/lib/cadus/clinic25";

export default function SamView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [f, setF] = useState({ age: "", weight: "", muac: "", whz: "" });
  const [oedema, setOedema] = useState<SamIn["oedema"]>(0);
  const [appetite, setAppetite] = useState<"" | "pass" | "fail">("");
  const [comp, setComp] = useState(false);
  const p = samPlan({ ageMonths: Number(f.age), weightKg: Number(f.weight), muac: f.muac ? Number(f.muac) : undefined, whz: f.whz ? Number(f.whz) : undefined, oedema, appetitePass: appetite === "" ? undefined : appetite === "pass", complications: comp });
  const n = (k: keyof typeof f, l: string, ph: string, re = /[^\d.]/g) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(re, "").slice(0, 5) })} placeholder={ph} data-sam={k} /></label>;
  const md = () => p ? [`# Acute malnutrition: ${p.status}${p.status === "SAM" ? (p.admit ? " (admit)" : " (community care)") : ""}`, `Age ${f.age} months, weight ${f.weight} kg`, "", ...p.why.map((w) => `- ${w}`), p.f75 ? `\n**F-75:** ${p.f75.perDay} ml a day, about ${p.f75.perFeed} ml every 3 hours (8 feeds)` : "", p.f100 ? `**F-100 (rehabilitation):** ${p.f100.perDayLow}–${p.f100.perDayHigh} ml a day` : "", "", ...p.steps.map((s, i) => `${i + 1}. ${s}`)].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-sam">
      <header className="cx-page-h"><div><h1>Malnutrition (SAM) Helper</h1><p>For a child aged 6–59 months: MUAC, weight-for-height and oedema tell SAM from MAM; the appetite test and complications decide NRC admission; F-75 and F-100 volumes by weight.</p></div></header>
      <div className="cx-c23-row">
        {n("age", "Age (months)", "18", /\D/g)}{n("weight", "Weight (kg)", "7.2")}{n("muac", "MUAC (cm)", "11.2")}
        <label className="cx-field"><span>Weight-for-height Z</span><input className="cx-input" inputMode="decimal" value={f.whz} onChange={(e) => setF({ ...f, whz: e.target.value.replace(/[^\d.\-]/g, "").slice(0, 5) })} placeholder="-3.2" data-sam="whz" /></label>
      </div>
      <div className="cx-c23-row">
        <div className="cx-field"><span>Bilateral pitting oedema</span><div className="cx-seg" role="radiogroup" aria-label="Oedema">{([0, 1, 2, 3] as const).map((o) => <button key={o} role="radio" aria-checked={oedema === o} className={oedema === o ? "on" : ""} onClick={() => setOedema(o)} data-sam-oedema={o}>{o ? "+".repeat(o) : "None"}</button>)}</div></div>
        <div className="cx-field"><span>Appetite test (RUTF)</span><div className="cx-seg" role="radiogroup" aria-label="Appetite test">{([["", "Not done"], ["pass", "Passed"], ["fail", "Failed"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={appetite === v} className={appetite === v ? "on" : ""} onClick={() => setAppetite(v)} data-sam-appetite={v || "none"}>{l}</button>)}</div></div>
        <label className="cx-pa-mine"><input type="checkbox" checked={comp} onChange={(e) => setComp(e.target.checked)} data-sam="comp" /> Medical complications (danger signs, pneumonia, dehydration, hypothermia, severe anaemia)</label>
      </div>
      {p ? (
        <div className={`cx-cmp-out cx-sam-${p.status.toLowerCase()}`} data-sam="out">
          <h3 className="cx-lab-h3" data-sam="status">{p.status === "SAM" ? `Severe acute malnutrition: ${p.admit ? "admit to the NRC" : "community care"}` : p.status === "MAM" ? "Moderate acute malnutrition" : "No acute malnutrition"}</h3>
          <ul>{p.why.map((w) => <li key={w}>{w}</li>)}</ul>
          {p.f75 && <div className="cx-sim-stats"><div><b data-sam="f75">{p.f75.perDay} ml/day</b><small>F-75 · about {p.f75.perFeed} ml every 3 hours</small></div>{p.f100 && <div><b>{p.f100.perDayLow}–{p.f100.perDayHigh} ml/day</b><small>F-100 in rehabilitation</small></div>}</div>}
          <ol className="cx-c23-steps">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Acute malnutrition plan", md())} data-sam="print"><Printer size={14} /> Print</button></div>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Scale size={20} /></span><h3>Enter age and weight</h3><p>For children 6 to 59 months; infants under 6 months need the infant protocol.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> From WHO and the national facility-based SAM guidelines (NRC). Use WHO growth charts for weight-for-height.</p>
    </section>
  );
}
