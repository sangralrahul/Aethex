/**
 * Postnatal Depression (EPDS): the 10-item Edinburgh scale, an urgent alert for the self-harm item,
 * and treatment that is safe in breastfeeding.
 */
import { useState } from "react";
import { HeartHandshake, TriangleAlert } from "lucide-react";
import { EPDS, epds, EPDS_CARE } from "@/lib/cadus/clinic42";

export default function EpdsView() {
  const [s, setS] = useState<number[]>(EPDS.map(() => -1));
  const answered = s.filter((x) => x >= 0).length;
  const r = epds(s.map((x) => Math.max(0, x)));
  return (
    <section className="cx-page cx-lab cx-epds">
      <header className="cx-page-h"><div><h1>Postnatal Depression (EPDS)</h1><p>How has she felt in the past 7 days? Ten questions she can answer herself, with scores, an alert on the self-harm question, and what to do next.</p></div></header>
      <div className="cx-nihss">{EPDS.map((q, i) => <label key={q.q} className="cx-field"><span>{i + 1}. {q.q}</span><select className="cx-select" value={s[i]} onChange={(e) => setS(s.map((v, j) => (j === i ? Number(e.target.value) : v)))} data-epd={i}><option value={-1}>Choose</option>{q.opts.map(([v, l]) => <option key={l} value={v}>{l}</option>)}</select></label>)}</div>
      {r.selfHarm && <div className="cx-cmp-out cx-st-out" data-epd="harm"><p><b>Any thought of self-harm: assess risk today (same day), do not leave her alone if at risk, involve family and the psychiatry team; Tele-MANAS 14416.</b></p></div>}
      <div className={`cx-cmp-out ${r.band === "probable" ? "cx-st-out" : r.band === "possible" ? "cx-ac-high" : "cx-ac-in"}`} data-epd="out" data-band={r.band}><p><b>{answered < 10 ? `${answered}/10 answered. ` : ""}{r.text}</b></p></div>
      <h4>Care</h4><ol className="cx-c23-steps">{EPDS_CARE.map((x) => <li key={x}>{x}</li>)}</ol>
      <p className="cx-rs-foot"><HeartHandshake size={13} /> Edinburgh Postnatal Depression Scale (Cox, Holden and Sagovsky 1987), NICE CG192. <TriangleAlert size={13} /> A screening tool: it does not replace clinical assessment.</p>
    </section>
  );
}
