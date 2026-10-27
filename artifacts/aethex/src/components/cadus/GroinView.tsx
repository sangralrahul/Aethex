/**
 * Hernia & Undescended Testis: groin and umbilical lumps in children and adults, timing of surgery,
 * and the signs that need emergency care.
 */
import { useState } from "react";
import { TriangleAlert, Scissors } from "lucide-react";
import { groinPlan, type GroinInput, type GroinKind } from "@/lib/cadus/clinic46";

const KINDS: [GroinKind, string][] = [["inguinal", "Inguinal hernia"], ["femoral", "Femoral hernia"], ["umbilical", "Umbilical hernia"], ["hydrocele", "Hydrocele"], ["udt", "Undescended testis"]];

export default function GroinView() {
  const [x, setX] = useState<GroinInput>({ child: true, kind: "inguinal", ageMonths: 0, irreducible: false, tender: false, symptomatic: false, bilateralImpalpable: false, premature: false });
  const r = groinPlan(x);
  const cb = (k: "irreducible" | "tender" | "symptomatic" | "bilateralImpalpable" | "premature", l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-grn={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-grn">
      <header className="cx-page-h"><div><h1>Hernia &amp; Undescended Testis</h1><p>When to watch, when to refer for planned surgery, and when it is an emergency.</p></div></header>
      <div className="cx-seg" role="tablist" aria-label="Patient">{([[true, "Child"], [false, "Adult"]] as const).map(([c, l]) => <button key={l} role="tab" aria-selected={x.child === c} className={x.child === c ? "on" : ""} onClick={() => setX({ ...x, child: c, kind: !c && x.kind === "udt" ? "inguinal" : x.kind })} data-grn-who={c ? "child" : "adult"}>{l}</button>)}</div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Problem</span><select className="cx-select" value={x.kind} onChange={(e) => setX({ ...x, kind: e.target.value as GroinKind })} data-grn="kind">{KINDS.filter(([k]) => x.child || k !== "udt").map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        {x.child && <label className="cx-field"><span>Age (months, corrected if premature)</span><input className="cx-input" inputMode="numeric" value={x.ageMonths || ""} onChange={(e) => setX({ ...x, ageMonths: Number(e.target.value.replace(/\D/g, "").slice(0, 3)) || 0 })} placeholder="4" data-grn="age" /></label>}
      </div>
      <div className="cx-imaging-ticks">
        {x.kind !== "udt" && x.kind !== "hydrocele" && cb("irreducible", "Will not go back")}
        {x.kind !== "udt" && x.kind !== "hydrocele" && cb("tender", "Tender, red, or vomiting")}
        {!x.child && cb("symptomatic", "Pain or discomfort, interferes with work")}
        {x.child && x.kind === "udt" && cb("bilateralImpalpable", "Both testes impalpable")}
        {x.child && x.kind === "inguinal" && cb("premature", "Born premature")}
      </div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-grn="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Scissors size={13} /> EHS/HerniaSurge 2018, EAU paediatric urology 2023, BAPS. <TriangleAlert size={13} /> An acute scrotum is testicular torsion until proved otherwise.</p>
    </section>
  );
}
