/**
 * Tinea & Dermatophytosis: India's chronic tinea, with topical and oral regimens (itraconazole,
 * terbinafine, griseofulvin) by site, extent and weight, and the harm of steroid combination creams.
 */
import { useState } from "react";
import { Hand, TriangleAlert } from "lucide-react";
import { tineaPlan, type TineaInput } from "@/lib/cadus/clinic43";

export default function TineaView() {
  const [x, setX] = useState<TineaInput>({ site: "body", extensive: false, recurrent: false, child: false, kg: 0 });
  return (
    <section className="cx-page cx-lab cx-tinea">
      <header className="cx-page-h"><div><h1>Tinea &amp; Dermatophytosis</h1><p>Treat ringworm properly: topical for limited disease, oral for extensive, recurrent, scalp or nail infection, long enough to clear it.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Site</span><select className="cx-select" value={x.site} onChange={(e) => setX({ ...x, site: e.target.value as TineaInput["site"] })} data-tn="site"><option value="body">Body, groin or feet</option><option value="scalp">Scalp (tinea capitis)</option><option value="nail-finger">Fingernails</option><option value="nail-toe">Toenails</option></select></label>
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="numeric" value={x.kg || ""} onChange={(e) => setX({ ...x, kg: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} data-tn="kg" /></label>
      </div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={x.extensive} onChange={(e) => setX({ ...x, extensive: e.target.checked })} data-tn="extensive" /> Extensive or multiple sites</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={x.recurrent} onChange={(e) => setX({ ...x, recurrent: e.target.checked })} data-tn="recurrent" /> Recurrent or chronic (over 6 months)</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={x.child} onChange={(e) => setX({ ...x, child: e.target.checked })} data-tn="child" /> Child</label>
      </div>
      <ol className="cx-c23-steps" data-tn="plan">{tineaPlan(x).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Hand size={13} /> IADVL Task Force (ECTODERM) consensus on dermatophytosis, BAD guidelines. <TriangleAlert size={13} /> Confirm with KOH mount if unsure; psoriasis and eczema can look similar.</p>
    </section>
  );
}
