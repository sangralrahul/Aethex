/**
 * Eye & ENT Triage: red-eye red flags and common causes, chemical injury, epistaxis steps, ear
 * problems, and sore throat with the McIsaac/Centor score.
 */
import { useState } from "react";
import { Ear, Eye, TriangleAlert } from "lucide-react";
import { centor, CHEMICAL_EYE, EAR, EAR_RED_FLAGS, EPISTAXIS, EYE_COMMON, EYE_RED_FLAGS, THROAT_RED_FLAGS } from "@/lib/cadus/clinic30";

export default function EyeEntView() {
  const [tab, setTab] = useState<"eye" | "nose" | "ear" | "throat">("eye");
  const [flags, setFlags] = useState<string[]>([]);
  const [c, setC] = useState({ fever: false, noCough: false, nodes: false, exudate: false, age: "" });
  const cs = centor({ ...c, age: Number(c.age) || 30 });

  return (
    <section className="cx-page cx-lab cx-eyeent">
      <header className="cx-page-h"><div><h1>Eye &amp; ENT Triage</h1><p>Red eye red flags and the common causes, chemical injury, nosebleeds step by step, ear problems, and sore throat with the Centor score.</p></div></header>
      <div className="cx-seg" role="tablist">{([["eye", "Red eye"], ["nose", "Nosebleed"], ["ear", "Ear"], ["throat", "Sore throat"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} data-ee-tab={k}>{l}</button>)}</div>
      {tab === "eye" && (
        <>
          <p className="cx-set-hint">Any of these means same-day ophthalmology:</p>
          <div className="cx-imaging-ticks" data-ee="flags">{EYE_RED_FLAGS.map((f) => <label key={f} className="cx-pa-mine"><input type="checkbox" checked={flags.includes(f)} onChange={() => setFlags(flags.includes(f) ? flags.filter((x) => x !== f) : [...flags, f])} /> {f}</label>)}</div>
          {flags.length > 0 && <p className="cx-bk-err" role="alert" data-ee="refer"><TriangleAlert size={13} /> Refer to ophthalmology today{flags.includes("Chemical splash") ? ": irrigate first" : ""}. Do not give steroid drops without a slit-lamp examination.</p>}
          <p className="cx-set-hint"><b>{CHEMICAL_EYE}</b></p>
          <div className="cx-c23-two" data-ee="common">{EYE_COMMON.map((e) => <div key={e.name}><h4>{e.name}</h4><p><small>{e.clues}</small></p><p>{e.treat}</p></div>)}</div>
        </>
      )}
      {tab === "nose" && <ol className="cx-c23-steps" data-ee="epistaxis">{EPISTAXIS.map((s) => <li key={s}>{s}</li>)}</ol>}
      {tab === "ear" && (
        <>
          <div className="cx-c23-two">{EAR.map((e) => <div key={e.name}><h4>{e.name}</h4><p>{e.treat}</p></div>)}</div>
          <h4>Refer urgently if</h4><ul data-ee="ear-red">{EAR_RED_FLAGS.map((r) => <li key={r}>{r}</li>)}</ul>
        </>
      )}
      {tab === "throat" && (
        <>
          <div className="cx-c23-row">
            {([["fever", "Temperature over 38 °C"], ["noCough", "No cough"], ["nodes", "Tender, swollen anterior neck nodes"], ["exudate", "Tonsillar swelling or exudate"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.checked })} data-ee={k} /> {l}</label>)}
            <label className="cx-field"><span>Age</span><input className="cx-input" inputMode="numeric" value={c.age} onChange={(e) => setC({ ...c, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} data-ee="age" /></label>
          </div>
          <div className="cx-cmp-out" data-ee="centor"><h3 className="cx-lab-h3">Centor (McIsaac) {cs.score}</h3><p>{cs.text}</p></div>
          <h4>Admit or refer if</h4><ul>{THROAT_RED_FLAGS.map((r) => <li key={r}>{r}</li>)}</ul>
        </>
      )}
      <p className="cx-rs-foot"><Eye size={13} /> <Ear size={13} /> NICE CKS and ENT UK guidance; McIsaac score. <TriangleAlert size={13} /> Check visual acuity in every eye complaint and document it.</p>
    </section>
  );
}
