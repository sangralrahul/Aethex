/**
 * Alcohol Withdrawal: the CIWA-Ar score with symptom-triggered benzodiazepine, a reducing
 * chlordiazepoxide course and thiamine for Wernicke's.
 */
import { useState } from "react";
import { Printer, TriangleAlert, Wine } from "lucide-react";
import { ALCOHOL_THIAMINE, chlordiazepoxideTaper, CIWA_ITEMS, ciwaAction, ciwaTotal } from "@/lib/cadus/clinic28";

export default function AlcoholView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"ciwa" | "taper" | "thiamine">("ciwa");
  const [v, setV] = useState<Record<string, number>>({});
  const [liver, setLiver] = useState(false);
  const [elderly, setElderly] = useState(false);
  const [start, setStart] = useState(30);
  const score = ciwaTotal(v);
  const a = ciwaAction(score, { liver, elderly });
  const taper = chlordiazepoxideTaper(start);
  const md = () => ["# Chlordiazepoxide reducing course", "", "| Day | Dose | Total |", "|---|---|---|", ...taper.map((t) => `| ${t.day} | ${t.doses} | ${t.total} mg |`), "", "Hold a dose if drowsy. Thiamine throughout."].join("\n");

  return (
    <section className="cx-page cx-lab cx-alcohol">
      <header className="cx-page-h"><div><h1>Alcohol Withdrawal</h1><p>The CIWA-Ar score with symptom-triggered treatment, a reducing chlordiazepoxide course, and thiamine to prevent Wernicke's.</p></div></header>
      <div className="cx-seg" role="tablist">{([["ciwa", `CIWA-Ar ${score}`], ["taper", "Reducing course"], ["thiamine", "Thiamine and safety"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-aw-tab={k}>{l}</button>)}</div>
      {tab === "ciwa" && (
        <>
          <div className="cx-nihss" data-aw="items">{CIWA_ITEMS.map((i) => (
            <label key={i.id} className="cx-field"><span>{i.label}</span><select className="cx-select" value={v[i.id] ?? 0} onChange={(e) => setV({ ...v, [i.id]: Number(e.target.value) })} data-aw-i={i.id}>{Array.from({ length: i.max + 1 }, (_, k) => <option key={k} value={k}>{k}</option>)}</select><small>{i.anchors}</small></label>
          ))}</div>
          <div className="cx-c23-row"><label className="cx-pa-mine"><input type="checkbox" checked={liver} onChange={(e) => setLiver(e.target.checked)} data-aw="liver" /> Liver disease</label><label className="cx-pa-mine"><input type="checkbox" checked={elderly} onChange={(e) => setElderly(e.target.checked)} /> Over 65</label></div>
          <div className="cx-cmp-out" data-aw="out"><h3 className="cx-lab-h3" data-aw="score">CIWA-Ar {score} / 67: {a.band}</h3><p data-aw="action">{a.action}</p><p>{a.next}</p></div>
        </>
      )}
      {tab === "taper" && (
        <>
          <label className="cx-field"><span>Starting dose (four times a day)</span><select className="cx-select" value={start} onChange={(e) => setStart(Number(e.target.value))} data-aw="start">{[10, 15, 20, 25, 30, 40, 50].map((d) => <option key={d} value={d}>{d} mg four times a day</option>)}</select></label>
          <p className="cx-set-hint">Usual starting dose: 10–20 mg four times a day for mild dependence, 20–30 mg for moderate and 30–50 mg for severe (up to 200 mg a day in hospital under supervision).</p>
          <div className="cx-c23-scroll"><table className="cx-c23-table" data-aw="taper"><thead><tr><th>Day</th><th>Dose</th><th>Total</th></tr></thead><tbody>{taper.map((t) => <tr key={t.day}><td>{t.day}</td><td>{t.doses}</td><td>{t.total} mg</td></tr>)}</tbody></table></div>
          <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Chlordiazepoxide reducing course", md())}><Printer size={14} /> Print</button></div>
        </>
      )}
      {tab === "thiamine" && <ul data-aw="thiamine">{ALCOHOL_THIAMINE.map((t) => <li key={t}>{t}</li>)}</ul>}
      <p className="cx-rs-foot"><Wine size={13} /> CIWA-Ar (Sullivan 1989); NICE CG100. <TriangleAlert size={13} /> Withdrawal starts 6–24 hours after the last drink; seizures peak at 24–48 hours and delirium tremens at 48–72 hours.</p>
    </section>
  );
}
