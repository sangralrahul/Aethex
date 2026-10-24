/**
 * Antidepressant Switcher: starting doses and ranges, how to switch between two antidepressants
 * (direct, cross-taper or washout), and how to stop one.
 */
import { useState } from "react";
import { Printer, Repeat, TriangleAlert } from "lucide-react";
import { ANTIDEPS, stopPlan, switchPlan, type Antidep } from "@/lib/cadus/clinic30";

export default function AntidepView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [from, setFrom] = useState<Antidep>("sertraline");
  const [to, setTo] = useState<Antidep>("escitalopram");
  const sw = switchPlan(from, to);
  const name = (id: Antidep) => ANTIDEPS.find((d) => d.id === id)!.name;
  const md = () => [`# Switching ${name(from)} to ${name(to)}`, "", `**Method:** ${sw.method}`, "", ...sw.steps.map((s, i) => `${i + 1}. ${s}`), "", ...sw.caution.map((c) => `- ${c}`)].join("\n");
  const pick = (v: Antidep, set: (a: Antidep) => void, k: string) => <select className="cx-select" value={v} onChange={(e) => set(e.target.value as Antidep)} data-ad={k}>{ANTIDEPS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>;

  return (
    <section className="cx-page cx-lab cx-antidep">
      <header className="cx-page-h"><div><h1>Antidepressant Switcher</h1><p>Starting doses, how to switch from one antidepressant to another safely (direct switch, cross-taper or washout), and how to stop.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>From</span>{pick(from, setFrom, "from")}</label>
        <label className="cx-field"><span>To</span>{pick(to, setTo, "to")}</label>
      </div>
      <div className="cx-cmp-out" data-ad="out"><h3 className="cx-lab-h3" data-ad="method">{sw.method}</h3><ol className="cx-c23-steps">{sw.steps.map((s) => <li key={s}>{s}</li>)}</ol>{sw.caution.length > 0 && <ul className="cx-set-hint">{sw.caution.map((c) => <li key={c}>{c}</li>)}</ul>}<div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Antidepressant switch", md())}><Printer size={14} /> Print</button></div></div>
      <h4>Stopping {name(from)}</h4><ul data-ad="stop">{stopPlan(from).map((s) => <li key={s}>{s}</li>)}</ul>
      <div className="cx-c23-scroll"><table className="cx-c23-table"><thead><tr><th>Drug</th><th>Start</th><th>Usual range</th><th>Note</th></tr></thead><tbody>{ANTIDEPS.filter((d) => d.cls !== "maoi").map((d) => <tr key={d.id}><td><b>{d.name}</b></td><td>{d.start}</td><td>{d.range}</td><td>{d.note}</td></tr>)}</tbody></table></div>
      <p className="cx-rs-foot"><Repeat size={13} /> General switching principles as in the Maudsley Prescribing Guidelines and NICE NG222. <TriangleAlert size={13} /> Ask about suicidal thoughts at every review, especially in the first weeks and in people under 25.</p>
    </section>
  );
}
