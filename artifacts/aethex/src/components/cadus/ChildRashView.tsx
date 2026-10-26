/**
 * Childhood Rashes: match the features to measles, chickenpox, HFMD, scarlet fever, parvovirus,
 * roseola, rubella and meningococcal disease, with isolation and treatment notes.
 */
import { useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import { measlesVitA, RASH_FEATURES, rashMatch, RASHES } from "@/lib/cadus/clinic41";

export default function ChildRashView() {
  const [t, setT] = useState<number[]>([]);
  const [age, setAge] = useState("");
  const m = rashMatch(t);
  const list = m.length ? m : RASHES.map((r) => ({ ...r, hits: 0 }));
  return (
    <section className="cx-page cx-lab cx-childrash">
      <header className="cx-page-h"><div><h1>Childhood Rashes</h1><p>Tick what you see; the likely causes come first, with how long to keep the child at home and what to treat.</p></div></header>
      <div className="cx-imaging-ticks">{RASH_FEATURES.map((f, i) => <label key={f} className="cx-pa-mine"><input type="checkbox" checked={t.includes(i)} onChange={() => setT(t.includes(i) ? t.filter((x) => x !== i) : [...t, i])} data-kr={i} /> {f}</label>)}</div>
      {t.includes(8) && <div className="cx-cmp-out cx-st-out" data-kr="red"><p><b>Non-blanching rash with fever: treat as meningococcal disease now.</b></p></div>}
      <div data-kr="list">{list.map((r) => (
        <div key={r.id} className={`cx-cmp-out ${r.id === "meningococcal" && r.hits ? "cx-st-out" : r.hits ? "cx-ac-high" : ""}`} data-kr-item={r.id}>
          <h3 className="cx-lab-h3">{r.name}{r.hits ? ` · ${r.hits} match${r.hits === 1 ? "" : "es"}` : ""}</h3>
          <p>{r.notes}</p>
          {r.id === "measles" && <div className="cx-c23-row"><label className="cx-field"><span>Age (months) for vitamin A</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} data-kr="age" /></label></div>}
          {r.id === "measles" && age && <p className="cx-set-hint" data-kr="vita"><b>{measlesVitA(Number(age))}</b></p>}
        </div>
      ))}</div>
      <p className="cx-rs-foot"><Baby size={13} /> WHO measles guidance, IAP, UK Health Security Agency exclusion guidance. <TriangleAlert size={13} /> Fever for 5 days with red eyes, lips and swollen hands: see the Kawasaki tool.</p>
    </section>
  );
}
