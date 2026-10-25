/**
 * Head Injury & CT Rules: NICE CT head criteria for adults, PECARN for children, and discharge
 * advice to print.
 */
import { useState } from "react";
import { Brain, Printer, TriangleAlert } from "lucide-react";
import { adultCt, HI_1H, HI_8H, HI_ADVICE, PECARN_HIGH_2, PECARN_HIGH_U2, PECARN_MID_2, PECARN_MID_U2, pecarn } from "@/lib/cadus/clinic35";

export default function HeadInjuryView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [who, setWho] = useState<"adult" | "u2" | "child">("adult");
  const [one, setOne] = useState<number[]>([]);
  const [eight, setEight] = useState<number[]>([]);
  const [loc, setLoc] = useState(false);
  const [hi, setHi] = useState<number[]>([]);
  const [mid, setMid] = useState<number[]>([]);
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const ad = adultCt(one.length, eight, loc);
  const pc = pecarn(who === "u2", hi.length, mid.length);
  const hiList = who === "u2" ? PECARN_HIGH_U2 : PECARN_HIGH_2, midList = who === "u2" ? PECARN_MID_U2 : PECARN_MID_2;
  const ticks = (list: string[], val: number[], set: (x: number[]) => void, key: string) => <div className="cx-imaging-ticks">{list.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={val.includes(i)} onChange={() => tg(val, set, i)} data-hi={`${key}${i}`} /> {x}</label>)}</div>;

  return (
    <section className="cx-page cx-lab cx-headinj">
      <header className="cx-page-h"><div><h1>Head Injury &amp; CT Rules</h1><p>Who needs a CT head and how fast: NICE criteria for adults and PECARN for children, with written advice for those going home.</p></div></header>
      <div className="cx-seg" role="tablist">{([["adult", "Adult (16+)"], ["child", "Child 2 years+"], ["u2", "Under 2 years"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={who === k} className={who === k ? "on" : ""} onClick={() => { setWho(k); setHi([]); setMid([]); }} data-hi-tab={k}>{l}</button>)}</div>
      {who === "adult" ? (
        <>
          <h4>CT within 1 hour if any</h4>{ticks(HI_1H, one, setOne, "one")}
          <h4>CT within 8 hours if any</h4>
          <label className="cx-pa-mine"><input type="checkbox" checked={loc} onChange={(e) => setLoc(e.target.checked)} data-hi="loc" /> Loss of consciousness or amnesia since the injury</label>
          {ticks(HI_8H, eight, setEight, "eight")}
          <p className="cx-set-hint">Anticoagulants alone are enough; the others count when there has been loss of consciousness or amnesia.</p>
          <div className={`cx-cmp-out ${ad.ct === "1h" ? "cx-st-out" : ad.ct === "8h" ? "cx-ac-high" : "cx-ac-in"}`} data-hi="out" data-ct={ad.ct}><h3 className="cx-lab-h3">{ad.text}</h3></div>
        </>
      ) : (
        <>
          <h4>High risk</h4>{ticks(hiList, hi, setHi, "high")}
          <h4>Intermediate risk</h4>{ticks(midList, mid, setMid, "mid")}
          <div className={`cx-cmp-out ${pc.level === "ct" ? "cx-st-out" : pc.level === "observe" ? "cx-ac-high" : "cx-ac-in"}`} data-hi="out" data-ct={pc.level}><h3 className="cx-lab-h3">{pc.text}</h3></div>
          <p className="cx-set-hint">PECARN applies to GCS 14–15 within 24 hours of injury. Think of non-accidental injury in infants: bruising, inconsistent story, delay in seeking help.</p>
        </>
      )}
      <h4>Going home: head injury advice</h4>
      <ul>{HI_ADVICE.map((a) => <li key={a}>{a}</li>)}</ul>
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Head injury advice", ["# Head injury advice", "", ...HI_ADVICE.map((a) => `- ${a}`)].join("\n"))} data-hi="print"><Printer size={14} /> Print advice</button></div>
      <p className="cx-rs-foot"><Brain size={13} /> NICE NG232 (2023), PECARN (Kuppermann 2009). <TriangleAlert size={13} /> Clinical judgement overrides any rule: deteriorating GCS needs urgent CT and neurosurgical advice.</p>
    </section>
  );
}
