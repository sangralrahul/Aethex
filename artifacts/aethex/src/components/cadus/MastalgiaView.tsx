/**
 * Breast Pain (Mastalgia): cyclical vs non-cyclical vs chest wall, red flags for referral,
 * reassurance, bra fit, topical NSAID and specialist options.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { mastalgiaPlan, type MastalgiaInput } from "@/lib/cadus/clinic48";

export default function MastalgiaView() {
  const [x, setX] = useState<MastalgiaInput>({ cyclical: false, lump: false, skin: false, discharge: false, focal: false, age: 0, hormones: false, chestWall: false });
  const r = mastalgiaPlan(x);
  const cb = (k: Exclude<keyof MastalgiaInput, "age">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-mas={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-mas">
      <header className="cx-page-h"><div><h1>Breast Pain (Mastalgia)</h1><p>Very common and rarely a sign of cancer on its own. Look for red flags, then reassure and treat.</p></div></header>
      <div className="cx-c23-row"><label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={x.age || ""} onChange={(e) => setX({ ...x, age: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="32" data-mas="age" /></label></div>
      <div className="cx-imaging-ticks">{cb("cyclical", "Comes and goes with periods")}{cb("focal", "One spot, persistent")}{cb("chestWall", "Tender over the ribs")}{cb("lump", "A lump")}{cb("skin", "Skin change or nipple pulled in")}{cb("discharge", "Nipple discharge")}{cb("hormones", "On HRT or the pill")}</div>
      <div className={`cx-cmp-out ${r.refer ? "cx-st-out" : "cx-ac-in"}`} data-mas="out" data-refer={String(r.refer)}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Venus size={13} /> NICE CKS breast pain, ABS best-practice diagnostic guidelines. <TriangleAlert size={13} /> Imaging for pain alone, without focal signs, finds incidental things and adds worry.</p>
    </section>
  );
}
