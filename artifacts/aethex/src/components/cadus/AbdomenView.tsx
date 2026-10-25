/**
 * Acute Abdomen & Appendicitis: red flags, the Alvarado and Paediatric Appendicitis scores, and
 * BISAP for pancreatitis severity.
 */
import { useState } from "react";
import { Stethoscope, TriangleAlert } from "lucide-react";
import { ABDO_RED, ALVARADO, alvarado, BISAP, bisap, PAS, pas } from "@/lib/cadus/clinic35";

export default function AbdomenView() {
  const [tab, setTab] = useState<"red" | "alv" | "pas" | "bisap">("red");
  const [al, setAl] = useState<number[]>([]);
  const [pa, setPa] = useState<number[]>([]);
  const [bi, setBi] = useState<number[]>([]);
  const tg = (l: number[], s: (x: number[]) => void, i: number) => s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);
  const A = alvarado(al), P = pas(pa);
  const pts = (list: { label: string; pts: number }[], val: number[], set: (x: number[]) => void, key: string) => <div className="cx-imaging-ticks">{list.map((x, i) => <label key={x.label} className="cx-pa-mine"><input type="checkbox" checked={val.includes(i)} onChange={() => tg(val, set, i)} data-ab={`${key}${i}`} /> {x.label} <b>+{x.pts}</b></label>)}</div>;

  return (
    <section className="cx-page cx-lab cx-abdomen">
      <header className="cx-page-h"><div><h1>Acute Abdomen &amp; Appendicitis</h1><p>Red flags not to miss, the Alvarado score for adults, the Paediatric Appendicitis Score, and BISAP for pancreatitis.</p></div></header>
      <div className="cx-seg" role="tablist">{([["red", "Red flags"], ["alv", "Alvarado"], ["pas", "Children (PAS)"], ["bisap", "Pancreatitis"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ab-tab={k}>{l}</button>)}</div>
      {tab === "red" && <div className="cx-anc-flags" data-ab="red">{ABDO_RED.map((r) => <p key={r} className="high">{r}</p>)}</div>}
      {tab === "alv" && (
        <>
          {pts(ALVARADO, al, setAl, "al")}
          <div className={`cx-cmp-out ${A.score >= 7 ? "cx-st-out" : A.score >= 5 ? "cx-ac-high" : "cx-ac-in"}`} data-ab="alv"><h3 className="cx-lab-h3">Alvarado {A.score}/10</h3><p>{A.band}</p></div>
        </>
      )}
      {tab === "pas" && (
        <>
          {pts(PAS, pa, setPa, "pa")}
          <div className={`cx-cmp-out ${P.score >= 7 ? "cx-st-out" : P.score >= 4 ? "cx-ac-high" : "cx-ac-in"}`} data-ab="pas"><h3 className="cx-lab-h3">PAS {P.score}/10</h3><p>{P.band}</p></div>
        </>
      )}
      {tab === "bisap" && (
        <>
          <p className="cx-set-hint">Diagnosis needs 2 of 3: typical pain, lipase or amylase over 3 times the upper limit, or imaging findings.</p>
          <div className="cx-imaging-ticks">{BISAP.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={bi.includes(i)} onChange={() => tg(bi, setBi, i)} data-ab={`bi${i}`} /> {x}</label>)}</div>
          <div className={`cx-cmp-out ${bi.length >= 3 ? "cx-st-out" : "cx-ac-in"}`} data-ab="bisap"><p><b>{bisap(bi.length)}</b></p></div>
          <p className="cx-set-hint">No routine antibiotics; look for gallstones (cholecystectomy in the same admission for mild biliary pancreatitis) and alcohol; CT only if the diagnosis is unclear or the patient is not improving after 72 hours.</p>
        </>
      )}
      <p className="cx-rs-foot"><Stethoscope size={13} /> Alvarado (1986), Samuel PAS (2002), BISAP (Wu 2008), ACG and WSES guidance. <TriangleAlert size={13} /> Scores support, not replace, surgical review; analgesia does not mask the signs.</p>
    </section>
  );
}
