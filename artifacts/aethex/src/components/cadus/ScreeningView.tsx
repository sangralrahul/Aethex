/**
 * Mental Health Screening: PHQ-9 (depression), GAD-7 (anxiety) and AUDIT-C (alcohol), asked one
 * item at a time or ticked from the patient's paper form, scored with the severity and what to do,
 * and an urgent safety check whenever PHQ-9 item 9 is positive. On the device.
 */
import { useState } from "react";
import { HeartHandshake, Phone, Printer, RotateCcw, TriangleAlert } from "lucide-react";
import { AUDITC, auditC, FREQ, GAD7, gad7, PHQ9, phq9, type ScreenResult } from "@/lib/cadus/clinic25";

type Tool = "phq9" | "gad7" | "auditc";
const TOOLS: { id: Tool; label: string; sub: string }[] = [
  { id: "phq9", label: "PHQ-9", sub: "Depression" }, { id: "gad7", label: "GAD-7", sub: "Anxiety" }, { id: "auditc", label: "AUDIT-C", sub: "Alcohol" },
];

export default function ScreeningView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tool, setTool] = useState<Tool>("phq9");
  const [ans, setAns] = useState<Record<Tool, (number | undefined)[]>>({ phq9: [], gad7: [], auditc: [] });
  const [sex, setSex] = useState<"M" | "F">("M");
  const items = tool === "phq9" ? PHQ9.map((q) => ({ q, options: FREQ })) : tool === "gad7" ? GAD7.map((q) => ({ q, options: FREQ })) : AUDITC;
  const a = ans[tool];
  const done = items.every((_, i) => a[i] !== undefined);
  const res: ScreenResult | null = done ? (tool === "phq9" ? phq9(a) : tool === "gad7" ? gad7(a) : auditC(a, sex)) : null;
  const urgentNow = tool === "phq9" && (a[8] ?? 0) > 0;
  const setA = (i: number, v: number) => { const n = [...a]; n[i] = v; setAns({ ...ans, [tool]: n }); };
  const md = () => res ? [`# ${TOOLS.find((t) => t.id === tool)!.label}: ${res.score} of ${res.max} (${res.band})`, "", tool === "auditc" ? "" : "Over the last 2 weeks:", "", "| # | Question | Answer |", "|---|---|---|", ...items.map((it, i) => `| ${i + 1} | ${it.q} | ${it.options[a[i] ?? 0]} |`), "", ...res.advice.map((x) => `- ${x}`), res.urgent ? `\n**${res.urgent}**` : ""].join("\n") : "";

  return (
    <section className="cx-page cx-lab cx-screen">
      <header className="cx-page-h"><div><h1>Mental Health Screening</h1><p>PHQ-9 for depression, GAD-7 for anxiety and AUDIT-C for alcohol: read each question to the patient (or tick their paper form) and get the score, the severity and what to do next.</p></div></header>
      <div className="cx-seg" role="tablist">{TOOLS.map((t) => <button key={t.id} role="tab" aria-selected={tool === t.id} className={tool === t.id ? "on" : ""} onClick={() => setTool(t.id)} data-screen-tool={t.id}>{t.label} <small>{t.sub}</small></button>)}</div>
      {tool === "auditc" && <div className="cx-seg" role="radiogroup" aria-label="Sex">{(["M", "F"] as const).map((x) => <button key={x} role="radio" aria-checked={sex === x} className={sex === x ? "on" : ""} onClick={() => setSex(x)} data-screen-sex={x}>{x === "M" ? "Man" : "Woman"}</button>)}</div>}
      <p className="cx-set-hint">{tool === "auditc" ? "A standard drink is about 10 g of alcohol: a small peg (30 ml) of spirits, a small glass of wine or half a bottle of regular beer." : "Over the last 2 weeks, how often have you been bothered by the following problems?"}</p>
      <ol className="cx-screen-q" data-screen="items">
        {items.map((it, i) => (
          <li key={i} className={i === 8 && tool === "phq9" ? "q9" : ""}>
            <p>{it.q}</p>
            <div className="cx-screen-opts" role="radiogroup" aria-label={it.q}>{it.options.map((o, v) => <button key={o} role="radio" aria-checked={a[i] === v} className={a[i] === v ? "on" : ""} onClick={() => setA(i, v)} data-screen-q={i} data-screen-v={v}>{o}<small>{v}</small></button>)}</div>
          </li>
        ))}
      </ol>
      {urgentNow && (
        <div className="cx-screen-urgent" role="alert" data-screen="urgent">
          <b><TriangleAlert size={15} /> Ask about safety today</b>
          <p>The patient has had thoughts of being better off dead or of self-harm. Ask directly: thoughts now, a plan, the means, past attempts, and what keeps them safe. If there is a plan or intent, don't leave them alone and arrange urgent psychiatric care.</p>
          <p><Phone size={13} /> Tele-MANAS (free, 24 hours, many Indian languages): <a href="tel:14416">14416</a> or <a href="tel:18008914416">1-800-891-4416</a></p>
        </div>
      )}
      {res ? (
        <div className={`cx-cmp-out cx-screen-res l${res.level}`} data-screen="result">
          <div className="cx-sim-stats"><div><b data-screen="score">{res.score} / {res.max}</b><small>score</small></div><div><b data-screen="band">{res.band}</b><small>{TOOLS.find((t) => t.id === tool)!.sub.toLowerCase()}</small></div></div>
          <ul>{res.advice.map((x) => <li key={x}>{x}</li>)}</ul>
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => onPrint(`${TOOLS.find((t) => t.id === tool)!.label} result`, md())} data-screen="print"><Printer size={14} /> Print</button>
            <button className="cx-btn" onClick={() => setAns({ ...ans, [tool]: [] })}><RotateCcw size={14} /> Start again</button>
          </div>
        </div>
      ) : <p className="cx-set-hint">{items.length - a.filter((x) => x !== undefined).length} question{items.length - a.filter((x) => x !== undefined).length === 1 ? "" : "s"} left.</p>}
      <p className="cx-rs-foot"><HeartHandshake size={13} /> Screening tools, not a diagnosis: confirm with a clinical interview. PHQ-9 and GAD-7 (Pfizer, free to use) and AUDIT (WHO). Use validated translations when the patient doesn't read English.</p>
    </section>
  );
}
