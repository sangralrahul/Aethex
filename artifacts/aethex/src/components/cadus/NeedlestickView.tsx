/**
 * Needle-stick Injury: first aid, HIV PEP (NACO), hepatitis B by the exposed person's immunity,
 * hepatitis C follow-up and the test dates, for health workers after a sharps or splash exposure.
 */
import { useState } from "react";
import { Printer, ShieldAlert, TriangleAlert } from "lucide-react";
import { sharpsPlan, type HbvImmunity, type SourceStatus } from "@/lib/cadus/clinic24";

const SRC: [SourceStatus, string][] = [["unknown", "Unknown"], ["positive", "Positive"], ["negative", "Negative"]];

export default function NeedlestickView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [kind, setKind] = useState<"percutaneous" | "mucous" | "intact-skin">("percutaneous");
  const [hiv, setHiv] = useState<SourceStatus>("unknown");
  const [hbvS, setHbvS] = useState<SourceStatus>("unknown");
  const [hcv, setHcv] = useState<SourceStatus>("unknown");
  const [imm, setImm] = useState<HbvImmunity>("unknown");
  const [hours, setHours] = useState("");
  const p = sharpsPlan({ kind, hivSource: hiv, hbvSource: hbvS, hcvSource: hcv, hbv: imm, hoursSince: hours ? Number(hours) : undefined });
  const seg = (label: string, value: SourceStatus, set: (v: SourceStatus) => void, key: string) => (
    <div className="cx-field"><span>{label}</span><div className="cx-seg" role="radiogroup" aria-label={label}>{SRC.map(([v, l]) => <button key={v} role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => set(v)} data-ns={`${key}-${v}`}>{l}</button>)}</div></div>
  );
  const md = () => ["# Sharps exposure: plan", "## First aid and reporting", ...p.first.map((x) => `- ${x}`), "## HIV", ...p.hiv.map((x) => `- ${x}`), "## Hepatitis B", ...p.hbv.map((x) => `- ${x}`), "## Hepatitis C", ...p.hcv.map((x) => `- ${x}`), "## Follow-up", ...p.followUp.map((x) => `- ${x}`)].join("\n");
  const block = (t: string, l: string[], k: string) => <div className="cx-ns-block" data-ns-block={k}><h4>{t}</h4><ul>{l.map((x) => <li key={x}>{x}</li>)}</ul></div>;

  return (
    <section className="cx-page cx-lab cx-ns">
      <header className="cx-page-h"><div><h1>Needle-stick Injury</h1><p>What to do in the first minutes after a needle-stick, cut or splash, whether to start HIV PEP, hepatitis B protection by your immunity, and the follow-up tests.</p></div></header>
      <div className="cx-oncall-calls" role="radiogroup" aria-label="Exposure">{([["percutaneous", "Needle-stick or cut"], ["mucous", "Splash to eye, nose or mouth"], ["intact-skin", "Blood on intact skin"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={kind === v} className={kind === v ? "on" : ""} onClick={() => setKind(v)} data-ns-kind={v}>{l}</button>)}</div>
      <div className="cx-c23-row cx-ns-src">
        {seg("Source HIV", hiv, setHiv, "hiv")}{seg("Source HBsAg", hbvS, setHbvS, "hbv")}{seg("Source anti-HCV", hcv, setHcv, "hcv")}
      </div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Your hepatitis B immunity</span><select className="cx-select" value={imm} onChange={(e) => setImm(e.target.value as HbvImmunity)} data-ns="imm"><option value="unknown">Vaccinated, response unknown</option><option value="responder">Vaccinated, anti-HBs 10 or more</option><option value="non-responder">Vaccinated, known non-responder</option><option value="unvaccinated">Not vaccinated</option></select></label>
        <label className="cx-field"><span>Hours since the exposure</span><input className="cx-input" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="2" data-ns="hours" /></label>
      </div>
      <div className="cx-cmp-out" data-ns="out">
        {block("First, now", p.first, "first")}{block("HIV", p.hiv, "hiv")}{block("Hepatitis B", p.hbv, "hbv")}{block("Hepatitis C", p.hcv, "hcv")}{block("Follow-up", p.followUp, "follow")}
        <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Sharps exposure plan", md())} data-ns="print"><Printer size={14} /> Print</button></div>
      </div>
      <p className="cx-rs-foot"><ShieldAlert size={13} /> National guidelines for HIV post-exposure prophylaxis (NACO) and hepatitis B and C guidance. <TriangleAlert size={13} /> Report every exposure to your hospital's PEP officer; PEP works best within 2 hours.</p>
    </section>
  );
}
