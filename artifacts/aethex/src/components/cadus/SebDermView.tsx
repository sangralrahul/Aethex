/**
 * Seborrhoeic Dermatitis & Dandruff: scalp, face and body, infants (cradle cap), and when to test
 * for HIV.
 */
import { useState } from "react";
import { Sparkle, TriangleAlert } from "lucide-react";
import { sebPlan } from "@/lib/cadus/clinic49";

export default function SebDermView() {
  const [site, setSite] = useState<"scalp" | "face" | "infant">("scalp");
  const [severe, setSevere] = useState(false);
  const [wide, setWide] = useState(false);
  return (
    <section className="cx-page cx-lab cx-seb">
      <header className="cx-page-h"><div><h1>Seborrhoeic Dermatitis &amp; Dandruff</h1><p>Greasy scale on the scalp, eyebrows, sides of the nose and chest. A yeast-driven condition: antifungals control it, it tends to come back.</p></div></header>
      <div className="cx-seg" role="tablist">{([["scalp", "Scalp"], ["face", "Face and body"], ["infant", "Infant"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={site === k} className={site === k ? "on" : ""} onClick={() => setSite(k)} data-seb-site={k}>{l}</button>)}</div>
      {site !== "infant" && <div className="cx-imaging-ticks"><label className="cx-pa-mine"><input type="checkbox" checked={severe} onChange={(e) => setSevere(e.target.checked)} data-seb="severe" /> Very itchy or inflamed</label><label className="cx-pa-mine"><input type="checkbox" checked={wide} onChange={(e) => setWide(e.target.checked)} data-seb="wide" /> Widespread or sudden in an adult</label></div>}
      <ol className="cx-c23-steps" data-seb="plan">{sebPlan(site, severe, wide).map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Sparkle size={13} /> NICE CKS seborrhoeic dermatitis, IADVL. <TriangleAlert size={13} /> Avoid potent steroids on the face.</p>
    </section>
  );
}
