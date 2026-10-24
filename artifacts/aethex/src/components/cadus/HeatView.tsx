/**
 * Heat Illness: heat cramps, exhaustion or heat stroke from the temperature and mental state, with
 * cooling and treatment; the heat index from temperature and humidity; and a prevention handout.
 */
import { useState } from "react";
import { Sun, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { MdBlock } from "./LiveAnswer";
import { HEAT_PREVENT_MD, heatBand, heatIllness, heatIndexC } from "@/lib/cadus/clinic28";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function HeatView(h: H) {
  const [tab, setTab] = useState<"assess" | "index" | "handout">("assess");
  const [temp, setTemp] = useState("");
  const [x, setX] = useState({ cns: false, vomiting: false, cramps: false, sweating: true });
  const [air, setAir] = useState("");
  const [rh, setRh] = useState("");
  const out = temp ? heatIllness({ tempC: Number(temp), ...x }) : null;
  const hi = air && rh ? heatIndexC(Number(air), Number(rh)) : null;
  const tick = (k: keyof typeof x, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-ht={k} /> {l}</label>;

  return (
    <section className="cx-page cx-lab cx-heat">
      <header className="cx-page-h"><div><h1>Heat Illness</h1><p>Heat cramps, heat exhaustion or heat stroke, with cooling and treatment; the heat index for the day; and a prevention handout in the patient's language.</p></div></header>
      <div className="cx-seg" role="tablist">{([["assess", "Assess and treat"], ["index", "Heat index"], ["handout", "Prevention handout"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ht-tab={k}>{l}</button>)}</div>
      {tab === "assess" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Core (rectal) temperature, °C</span><input className="cx-input" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="40.5" data-ht="temp" /></label>
            {tick("cns", "Confusion, fits, collapse or coma")}{tick("vomiting", "Vomiting, headache, dizziness")}{tick("cramps", "Muscle cramps")}{tick("sweating", "Still sweating")}
          </div>
          {out ? <div className={`cx-cmp-out cx-ht-l${out.level}`} data-ht="out" data-level={out.level}><h3 className="cx-lab-h3" data-ht="dx">{out.dx}</h3><ol className="cx-c23-steps">{out.plan.map((p) => <li key={p}>{p}</li>)}</ol>{!x.sweating && out.level === 3 && <p className="cx-set-hint">Sweating may be present in exertional heat stroke; its absence is not needed for the diagnosis.</p>}</div> : <p className="cx-set-hint">Enter the temperature. Oral, axillary and ear readings underestimate the core temperature.</p>}
        </>
      )}
      {tab === "index" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Air temperature, °C</span><input className="cx-input" inputMode="decimal" value={air} onChange={(e) => setAir(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="38" data-ht="air" /></label>
            <label className="cx-field"><span>Relative humidity, %</span><input className="cx-input" inputMode="numeric" value={rh} onChange={(e) => setRh(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="50" data-ht="rh" /></label>
          </div>
          {hi !== null && <div className="cx-cmp-out" data-ht="index"><h3 className="cx-lab-h3">Feels like {hi} °C</h3><p data-ht="band">{heatBand(hi)}</p></div>}
          <p className="cx-set-hint">Heat index (NOAA) in the shade; full sun can add up to 8 °C. IMD heat-wave warnings: 40 °C or more on the plains and 4.5 °C above normal, or 45 °C or more.</p>
        </>
      )}
      {tab === "handout" && <><div className="cx-c23-doc" data-ht="handout"><MdBlock text={HEAT_PREVENT_MD} /></div><HandoutActions md={HEAT_PREVENT_MD} title="Staying safe in the heat" {...h} /></>}
      <p className="cx-rs-foot"><Sun size={13} /> NPCCHH (India) heat-related illness guidelines and the Wilderness Medical Society guideline. <TriangleAlert size={13} /> Heat stroke is a medical emergency: cool before transfer.</p>
    </section>
  );
}
