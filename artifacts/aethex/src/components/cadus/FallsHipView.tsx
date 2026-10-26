/**
 * Falls & Hip Fracture: orthostatic BP, Timed Up and Go, falls interventions, the Nottingham Hip
 * Fracture Score and the hip fracture pathway.
 */
import { useState } from "react";
import { PersonStanding, TriangleAlert } from "lucide-react";
import { FALLS_STEPS, HIP_STEPS, nhfs, NHFS_ITEMS, orthostatic, tug } from "@/lib/cadus/clinic41";

export default function FallsHipView() {
  const [tab, setTab] = useState<"falls" | "hip">("falls");
  const [v, setV] = useState({ ls: "", ld: "", ss: "", sd: "", tug: "" });
  const [t, setT] = useState<boolean[]>(NHFS_ITEMS.map(() => false));
  const n = (k: keyof typeof v, l: string, ph: string) => <label className="cx-field"><span>{l}</span><input className="cx-input" inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) })} placeholder={ph} data-fh={k} /></label>;
  const o = orthostatic(Number(v.ls), Number(v.ld), Number(v.ss), Number(v.sd));
  const h = nhfs(t);
  return (
    <section className="cx-page cx-lab cx-fallship">
      <header className="cx-page-h"><div><h1>Falls &amp; Hip Fracture</h1><p>Assess an older person who falls, and manage a hip fracture from the emergency department to discharge.</p></div></header>
      <div className="cx-seg" role="tablist">{([["falls", "Falls"], ["hip", "Hip fracture"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-fh-tab={k}>{l}</button>)}</div>
      {tab === "falls" ? (
        <>
          <div className="cx-c23-row">{n("ls", "Lying systolic", "140")}{n("ld", "Lying diastolic", "80")}{n("ss", "Standing systolic (1–3 min)", "120")}{n("sd", "Standing diastolic", "75")}</div>
          {o && <div className={`cx-cmp-out ${o.positive ? "cx-ac-high" : "cx-ac-in"}`} data-fh="ortho" data-positive={String(o.positive)}><p><b>{o.text}</b></p></div>}
          <div className="cx-c23-row">{n("tug", "Timed Up and Go (seconds)", "10")}</div>
          <p className="cx-set-hint" data-fh="tugout"><b>{tug(Number(v.tug) || 0)}</b></p>
          <ol className="cx-c23-steps">{FALLS_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      ) : (
        <>
          <div className="cx-imaging-ticks">{NHFS_ITEMS.map((it, i) => <label key={it.label} className="cx-pa-mine"><input type="checkbox" checked={t[i]} onChange={(e) => setT(t.map((x, j) => (j === i ? e.target.checked : i < 2 && j < 2 && e.target.checked ? false : x)))} data-fh-n={i} /> {it.label} ({it.pts})</label>)}</div>
          <div className={`cx-cmp-out ${h.score >= 5 ? "cx-st-out" : "cx-ac-in"}`} data-fh="nhfs" data-score={h.score}><p><b>{h.text}</b></p></div>
          <ol className="cx-c23-steps">{HIP_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      <p className="cx-rs-foot"><PersonStanding size={13} /> World Falls Guidelines 2022, NICE CG124 (hip fracture), Nottingham Hip Fracture Score. <TriangleAlert size={13} /> A fall can be the first sign of acute illness: check for infection, delirium and syncope.</p>
    </section>
  );
}
