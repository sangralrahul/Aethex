/**
 * Infant Feeding: milk volume by day of life and weight (term and preterm), formula scoops, weight
 * loss from birth weight, signs feeding is going well, and complementary feeding by age, as a handout.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { COMPLEMENTARY, FEEDING_OK, feedVolume, weightLoss } from "@/lib/cadus/clinic30";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function InfantFeedingView(h: H) {
  const [kg, setKg] = useState("");
  const [day, setDay] = useState("3");
  const [feeds, setFeeds] = useState("8");
  const [preterm, setPreterm] = useState(false);
  const [pml, setPml] = useState("20");
  const [birth, setBirth] = useState("");
  const f = feedVolume(Number(kg), Number(day), Number(feeds), preterm, Number(pml));
  const wl = weightLoss(Number(birth), Number(kg));
  const num = (s: string) => s.replace(/[^\d.]/g, "").slice(0, 5);
  const md = ["# Feeding your baby", "", "## Signs feeding is going well", ...FEEDING_OK.map((x) => `- ${x}`), "", "## Starting other foods", ...COMPLEMENTARY.map((c) => `- **${c.age}:** ${c.what}`), "", "## See the doctor the same day if", "- Fewer wet nappies, dark urine, very sleepy or not waking for feeds", "- Yellow skin spreading to the legs, or yellow eyes after 2 weeks", "- Vomiting green, fever, or poor sucking"].join("\n");

  return (
    <section className="cx-page cx-lab cx-feed">
      <header className="cx-page-h"><div><h1>Infant Feeding</h1><p>How much milk by day of life and weight, formula scoops, weight loss from birth weight, signs feeding is going well, and when and how to start other foods.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight now (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(num(e.target.value))} placeholder="3.0" data-if="kg" /></label>
        <label className="cx-field"><span>Birth weight (kg)</span><input className="cx-input" inputMode="decimal" value={birth} onChange={(e) => setBirth(num(e.target.value))} placeholder="3.2" data-if="birth" /></label>
        <label className="cx-field"><span>Day of life</span><input className="cx-input" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 3))} data-if="day" /></label>
        <label className="cx-field"><span>Feeds a day</span><select className="cx-select" value={feeds} onChange={(e) => setFeeds(e.target.value)} data-if="feeds">{[6, 7, 8, 10, 12].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="cx-pa-mine"><input type="checkbox" checked={preterm} onChange={(e) => setPreterm(e.target.checked)} data-if="preterm" /> Preterm or under 2 kg</label>
        {preterm && <label className="cx-field"><span>Today's volume (ml/kg/day)</span><input className="cx-input" inputMode="numeric" value={pml} onChange={(e) => setPml(e.target.value.replace(/\D/g, "").slice(0, 3))} data-if="pml" /></label>}
      </div>
      {wl && <p className={`cx-set-hint ${wl.pct >= 10 ? "cx-bk-err" : ""}`} data-if="loss"><b>{wl.text}</b></p>}
      {f ? (
        <div className="cx-cmp-out" data-if="out">
          <div className="cx-sim-stats">
            <div><b data-if="perfeed">{f.perFeed} ml</b><small>each feed ({feeds} a day)</small></div>
            <div><b>{f.perDay} ml</b><small>a day ({f.mlPerKg} ml/kg/day)</small></div>
            {f.scoops !== undefined && <div><b>{f.scoops} scoops</b><small>formula a feed (1 level scoop per 30 ml of boiled, cooled water; check the tin)</small></div>}
          </div>
          <p className="cx-set-hint">{f.note}</p>
        </div>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Baby size={20} /></span><h3>Enter the weight</h3><p>Exclusive breastfeeding is best; volumes are for formula or expressed milk.</p></div>}
      <div className="cx-c23-two">
        <div><h4>Feeding is going well when</h4><ul>{FEEDING_OK.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h4>Complementary feeding</h4><ul data-if="comp">{COMPLEMENTARY.map((c) => <li key={c.age}><b>{c.age}:</b> {c.what}</li>)}</ul></div>
      </div>
      <h4>Handout for parents</h4>
      <HandoutActions md={md} title="Feeding your baby" {...h} />
      <p className="cx-rs-foot"><Baby size={13} /> WHO/UNICEF and IAP infant and young child feeding guidance. <TriangleAlert size={13} /> Formula preparation varies by brand: always follow the tin; never add extra powder.</p>
    </section>
  );
}
