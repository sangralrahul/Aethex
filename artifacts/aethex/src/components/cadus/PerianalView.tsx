/**
 * Perianal Abscess & Pilonidal Sinus: drain early, antibiotics only when needed, fistula and Crohn's
 * clues, Fournier's gangrene, and pilonidal care.
 */
import { useState } from "react";
import { Scissors, TriangleAlert } from "lucide-react";
import { perianalPlan, type PerianalInput } from "@/lib/cadus/clinic49";

export default function PerianalView() {
  const [x, setX] = useState<PerianalInput>({ type: "perianal", acute: true, fluctuant: false, fever: false, diabetes: false, crepitus: false, recurrent: false, chronicDischarge: false, crohns: false });
  const r = perianalPlan(x);
  const cb = (k: Exclude<keyof PerianalInput, "type">, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-pan={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-pan">
      <header className="cx-page-h"><div><h1>Perianal Abscess &amp; Pilonidal Sinus</h1><p>Pus needs draining, early. Look for the signs of a fistula, Crohn's disease or a spreading necrotising infection.</p></div></header>
      <div className="cx-seg" role="tablist">{([["perianal", "Perianal abscess"], ["pilonidal", "Pilonidal sinus"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={x.type === k} className={x.type === k ? "on" : ""} onClick={() => setX({ ...x, type: k })} data-pan-type={k}>{l}</button>)}</div>
      <div className="cx-imaging-ticks">{cb("acute", "Painful swelling now")}{cb("fever", "Fever")}{cb("diabetes", "Diabetes or immunosuppressed")}{cb("crepitus", "Crepitus, black skin, spreading fast")}{cb("chronicDischarge", "Keeps discharging")}{cb("recurrent", "Recurrent")}{x.type === "perianal" && cb("crohns", "Diarrhoea, weight loss, mouth ulcers")}</div>
      <div className={`cx-cmp-out ${r.urgency === "emergency" ? "cx-st-out" : r.urgency === "urgent" ? "cx-ac-high" : "cx-ac-in"}`} data-pan="out" data-urgency={r.urgency}><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Scissors size={13} /> ASCRS anorectal abscess and fistula 2022, ASCRS pilonidal 2019. <TriangleAlert size={13} /> Perineal pain with crepitus in a diabetic: Fournier's gangrene.</p>
    </section>
  );
}
