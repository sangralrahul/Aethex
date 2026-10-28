/** Skin lumps: lipoma, epidermoid cyst, and the features that mean sarcoma until proven otherwise. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { lumpPlan, type LumpInput } from "@/lib/cadus/clinic50";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof LumpInput, "sizeCm" | "site">;
const T: [B, string][] = [["growing", "Getting bigger"], ["hard", "Hard"], ["fixed", "Fixed to deeper tissue"], ["deep", "Deep to the muscle fascia"], ["painful", "Painful (not inflamed)"], ["punctum", "Central punctum (black dot)"], ["inflamed", "Red, hot, tender"], ["fluctuant", "Fluctuant, pus"], ["recurrent", "Came back after removal"], ["multiple", "Many similar lumps"]];

export default function SkinLumpView() {
  const [x, setX] = useState<LumpInput>({ sizeCm: 0, growing: false, hard: false, fixed: false, deep: false, painful: false, punctum: false, inflamed: false, fluctuant: false, recurrent: false, multiple: false, site: "trunk" });
  const r = lumpPlan(x);
  return (
    <section className="cx-page cx-lab cx-lmp">
      <header className="cx-page-h"><div><h1>Skin Lumps (Lipoma & Cyst)</h1><p>Most lumps under the skin are lipomas or epidermoid cysts. Size over 5 cm, deep, growing or painful means imaging first.</p></div></header>
      <div className="cx-c23-row">
        <NumField label="Size (cm)" value={x.sizeCm} set={(n) => setX({ ...x, sizeCm: n })} placeholder="3" data="lmp-size" decimals max={50} />
        <label className="cx-field"><span>Site</span><select className="cx-select" value={x.site} onChange={(e) => setX({ ...x, site: e.target.value as LumpInput["site"] })} data-t="lmp-site">{(["trunk", "limb", "scalp", "face", "neck", "breast", "groin"] as const).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></label>
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`lmp-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="lmp-out"><p className="cx-c50-score"><b data-t="lmp-kind" data-kind={r.kind}>{r.kind === "sarcoma risk" ? "Possible sarcoma: image before any surgery" : r.kind === "cyst" ? "Epidermoid cyst" : r.kind === "lipoma" ? "Lipoma likely" : "Unclear"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> NICE NG12 suspected cancer (sarcoma); British Sarcoma Group guidance; NICE CKS epidermoid cyst.</p>
    </section>
  );
}
