/**
 * Warts & Molluscum: when to treat, salicylic acid and cryotherapy, facial and genital warts,
 * pregnancy, and molluscum care.
 */
import { useState } from "react";
import { TriangleAlert, Sparkle } from "lucide-react";
import { molluscumPlan, wartPlan, type WartKind } from "@/lib/cadus/clinic48";

export default function WartsView() {
  const [tab, setTab] = useState<"warts" | "molluscum">("warts");
  const [kind, setKind] = useState<WartKind>("common");
  const [f, setF] = useState({ child: false, pregnant: false, immuno: false, adult: true, genital: false, widespread: false, eyelid: false, eczema: false });
  const cb = (k: keyof typeof f, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} data-wrt={k} /> {l}</label>;
  const steps = tab === "warts" ? wartPlan(kind, f.child, f.pregnant, f.immuno) : molluscumPlan(f.adult, f.genital, f.widespread, f.eyelid, f.eczema);
  return (
    <section className="cx-page cx-lab cx-wrt">
      <header className="cx-page-h"><div><h1>Warts &amp; Molluscum</h1><p>Both are viral, harmless and usually go away on their own. Treat when they hurt, spread or bother the patient.</p></div></header>
      <div className="cx-seg" role="tablist">{([["warts", "Warts"], ["molluscum", "Molluscum"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-wrt-tab={k}>{l}</button>)}</div>
      {tab === "warts" ? (
        <>
          <div className="cx-c23-row"><label className="cx-field"><span>Type</span><select className="cx-select" value={kind} onChange={(e) => setKind(e.target.value as WartKind)} data-wrt="kind"><option value="common">Common (hands, knees)</option><option value="plantar">Plantar (sole of foot)</option><option value="facial">Face (flat warts)</option><option value="genital">Anogenital</option></select></label></div>
          <div className="cx-imaging-ticks">{cb("child", "Child")}{cb("pregnant", "Pregnant")}{cb("immuno", "Immunosuppressed")}</div>
        </>
      ) : <div className="cx-imaging-ticks">{cb("adult", "Adult")}{cb("genital", "Genital area")}{cb("widespread", "Many or large lesions")}{cb("eyelid", "On the eyelid, red eye")}{cb("eczema", "Eczema around them")}</div>}
      <ol className="cx-c23-steps" data-wrt="plan">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="cx-rs-foot"><Sparkle size={13} /> BAD viral warts guideline 2014, BASHH anogenital warts 2015, NICE CKS molluscum. <TriangleAlert size={13} /> A "wart" that bleeds, grows fast or looks different in an adult may be a skin cancer.</p>
    </section>
  );
}
