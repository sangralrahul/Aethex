/**
 * Hyperhidrosis: primary focal vs secondary sweating, HDSS, aluminium chloride, iontophoresis,
 * oral anticholinergics and botulinum toxin.
 */
import { useState } from "react";
import { Droplets, TriangleAlert } from "lucide-react";
import { sweatPlan, type SweatInput } from "@/lib/cadus/clinic49";

export default function HyperhidrosisView() {
  const [x, setX] = useState<SweatInput>({ focal: true, bilateral: false, onsetUnder25: false, stopsAsleep: false, family: false, nightSweats: false, weightLoss: false, fever: false, heat: false, menopause: false, drugs: false, hdss: 0, site: "axillae" });
  const r = sweatPlan(x);
  const cb = (k: Exclude<keyof SweatInput, "hdss" | "site">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-swt={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-swt">
      <header className="cx-page-h"><div><h1>Hyperhidrosis</h1><p>Sweating in one area since youth, symmetric and stopping in sleep is primary and very treatable. Generalised or night sweating needs a cause found.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Main area</span><select className="cx-select" value={x.site} onChange={(e) => setX({ ...x, site: e.target.value as SweatInput["site"] })} data-swt="site"><option value="axillae">Armpits</option><option value="palms">Palms</option><option value="soles">Soles</option><option value="face">Face</option></select></label>
        <label className="cx-field"><span>HDSS (1 never noticeable – 4 intolerable)</span><select className="cx-select" value={x.hdss} onChange={(e) => setX({ ...x, hdss: Number(e.target.value) })} data-swt="hdss"><option value={0}>Not scored</option>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      </div>
      <div className="cx-imaging-ticks">{cb("focal", "One or two areas only")}{cb("bilateral", "Both sides equally")}{cb("onsetUnder25", "Started before 25")}{cb("stopsAsleep", "Stops during sleep")}{cb("family", "Family history")}{cb("nightSweats", "Night sweats")}{cb("weightLoss", "Weight loss")}{cb("fever", "Fever")}{cb("menopause", "Menopausal")}{cb("drugs", "SSRIs, opioids, insulin…")}</div>
      <div className={`cx-cmp-out ${r.primary ? "cx-ac-in" : "cx-ac-high"}`} data-swt="out" data-primary={String(r.primary)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Droplets size={13} /> International Hyperhidrosis Society, BAD. <TriangleAlert size={13} /> New drenching night sweats: think TB and lymphoma first.</p>
    </section>
  );
}
