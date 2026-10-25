/**
 * Altitude Illness: Lake Louise score for AMS, prevention (Ladakh and Himalayan treks), and
 * treatment of AMS, HACE and HAPE.
 */
import { useState } from "react";
import { Mountain, TriangleAlert } from "lucide-react";
import { altitudePlan, LAKE_LOUISE, lakeLouise } from "@/lib/cadus/clinic39";

export default function AltitudeView() {
  const [sc, setSc] = useState([0, 0, 0, 0]);
  const [kind, setKind] = useState<"prevent" | "ams" | "hace" | "hape">("prevent");
  const [child, setChild] = useState(false);
  const [kg, setKg] = useState("");
  const L = lakeLouise(sc);
  const severe = L.total >= 6;
  return (
    <section className="cx-page cx-lab cx-altitude">
      <header className="cx-page-h"><div><h1>Altitude Illness</h1><p>Score acute mountain sickness, prevent it on Ladakh and Himalayan trips, and treat AMS, high-altitude cerebral oedema and pulmonary oedema.</p></div></header>
      <h4>Lake Louise score (0 none, 1 mild, 2 moderate, 3 severe)</h4>
      <div className="cx-nihss">{LAKE_LOUISE.map((x, i) => <label key={x} className="cx-field"><span>{x}</span><select className="cx-select" value={sc[i]} onChange={(e) => setSc(sc.map((v, j) => (j === i ? Number(e.target.value) : v)))} data-al-s={i}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>)}</div>
      <p className={`cx-set-hint ${L.ams ? "cx-bk-err" : ""}`} data-al="score"><b>Score {L.total}: {L.band}</b> (AMS needs a headache plus a total of 3 or more after a recent gain in altitude).</p>
      <div className="cx-seg" role="tablist">{([["prevent", "Prevention"], ["ams", "AMS"], ["hace", "HACE"], ["hape", "HAPE"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)} data-al-tab={k}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-pa-mine"><input type="checkbox" checked={child} onChange={(e) => setChild(e.target.checked)} data-al="child" /> Child</label>
        {child && <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} data-al="kg" /></label>}
      </div>
      <div className={`cx-cmp-out ${kind === "hace" || kind === "hape" ? "cx-st-out" : "cx-ac-high"}`} data-al="plan"><ol className="cx-c23-steps">{altitudePlan(kind, child, Number(kg) || 0, severe).map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Mountain size={13} /> Wilderness Medical Society 2019/2024, Lake Louise 2018. <TriangleAlert size={13} /> Descent is the treatment: never go higher with symptoms.</p>
    </section>
  );
}
