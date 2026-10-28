/** Scaphoid and wrist injuries: suspected scaphoid fracture with a normal X-ray, and distal radius fractures. */
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { wristPlan, type WristInput } from "@/lib/cadus/clinic51";
import { NumField, PlanOut, Tick } from "./Clinic50Parts";

type B = Exclude<keyof WristInput, "xray" | "age" | "daysSince">;
const T: [B, string][] = [["snuffbox", "Anatomical snuffbox tenderness"], ["tubercle", "Scaphoid tubercle tenderness"], ["axialThumb", "Pain on axial thumb compression"], ["deformity", "Deformed wrist"], ["neuro", "Numb fingers or poor perfusion"], ["open", "Open wound over the fracture"], ["displaced", "Displaced on X-ray"], ["proximalPole", "Proximal pole fracture"], ["fallStanding", "Fall from standing height"]];

export default function WristView() {
  const [x, setX] = useState<WristInput>({ snuffbox: false, tubercle: false, axialThumb: false, deformity: false, neuro: false, open: false, xray: "not done", displaced: false, proximalPole: false, age: 0, fallStanding: false, daysSince: 0 });
  const r = wristPlan(x);
  return (
    <section className="cx-page cx-lab cx-wri">
      <header className="cx-page-h"><div><h1>Scaphoid & Wrist Injuries</h1><p>A fall on the outstretched hand: don't miss the scaphoid. Splint, image, and get distal radius fractures to fracture clinic.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>X-ray</span><select className="cx-select" value={x.xray} onChange={(e) => setX({ ...x, xray: e.target.value as WristInput["xray"] })} data-t="wri-xray">{(["not done", "normal", "scaphoid fracture", "distal radius fracture"] as const).map((v) => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}</select></label>
        <NumField label="Age" value={x.age} set={(n) => setX({ ...x, age: n })} placeholder="28" data="wri-age" max={110} />
        <NumField label="Days since injury" value={x.daysSince} set={(n) => setX({ ...x, daysSince: n })} placeholder="1" data="wri-days" max={3650} />
      </div>
      <div className="cx-imaging-ticks">{T.map(([k, l]) => <Tick key={k} on={x[k]} set={(v) => setX({ ...x, [k]: v })} label={l} data={`wri-${k}`} />)}</div>
      <PlanOut urgency={r.urgency} steps={r.steps} data="wri-out"><p className="cx-c50-score"><b data-t="wri-susp" data-susp={r.suspectedScaphoid ? "yes" : "no"}>{r.suspectedScaphoid ? "Suspected scaphoid fracture" : "No scaphoid signs"}</b></p></PlanOut>
      <p className="cx-rs-foot"><BookOpen size={13} /> BSSH / RCEM scaphoid guidance; NICE NG38 fractures (non-complex); BOAST distal radius fractures.</p>
    </section>
  );
}
