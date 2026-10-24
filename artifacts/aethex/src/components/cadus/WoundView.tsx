/**
 * Wound & Suture Care: suture size and removal day by site, tetanus prophylaxis, the maximum local
 * anaesthetic by weight, when to give antibiotics, and an aftercare handout in the patient's language.
 */
import { useState } from "react";
import { Bandage, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { laMax, SUTURE_SITES, tetanusPlan, WOUND_ABX, WOUND_CLOSE, woundCareMd, type LaIn, type TetanusIn } from "@/lib/cadus/clinic28";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function WoundView(h: H) {
  const [site, setSite] = useState(SUTURE_SITES[0].site);
  const [absorb, setAbsorb] = useState(false);
  const [tt, setTt] = useState<TetanusIn>({ doses: "3+", yearsSinceLast: undefined, dirty: false });
  const [years, setYears] = useState("");
  const [la, setLa] = useState<{ kg: string; drug: LaIn["drug"]; percent: number }>({ kg: "", drug: "lidocaine", percent: 1 });
  const row = SUTURE_SITES.find((s) => s.site === site) ?? SUTURE_SITES[0];
  const tet = tetanusPlan({ ...tt, yearsSinceLast: years === "" ? undefined : Number(years) });
  const max = laMax({ kg: Number(la.kg), drug: la.drug, percent: la.percent });
  const md = woundCareMd(row.site, row.removal, absorb);

  return (
    <section className="cx-page cx-lab cx-wound">
      <header className="cx-page-h"><div><h1>Wound &amp; Suture Care</h1><p>Which suture and when to remove it, tetanus prophylaxis, the most local anaesthetic you can give, when antibiotics are needed, and an aftercare sheet for the patient.</p></div></header>
      <div className="cx-c23-two">
        <div>
          <h4>Suture</h4>
          <label className="cx-field"><span>Site</span><select className="cx-select" value={site} onChange={(e) => setSite(e.target.value)} data-wd="site">{SUTURE_SITES.map((s) => <option key={s.site}>{s.site}</option>)}</select></label>
          <div className="cx-cmp-out" data-wd="suture"><p><b>Suture:</b> {row.size}</p><p><b>Remove:</b> <span data-wd="removal">{row.removal}</span></p></div>
          <label className="cx-pa-mine"><input type="checkbox" checked={absorb} onChange={(e) => setAbsorb(e.target.checked)} /> Absorbable skin sutures used</label>
        </div>
        <div>
          <h4>Tetanus</h4>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Doses received</span><select className="cx-select" value={tt.doses} onChange={(e) => setTt({ ...tt, doses: e.target.value as TetanusIn["doses"] })} data-wd="doses"><option value="3+">3 or more</option><option value="0-2">Fewer than 3, or unknown</option></select></label>
            {tt.doses === "3+" && <label className="cx-field"><span>Years since the last dose</span><input className="cx-input" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Unknown" data-wd="years" /></label>}
          </div>
          <label className="cx-pa-mine"><input type="checkbox" checked={tt.dirty} onChange={(e) => setTt({ ...tt, dirty: e.target.checked })} data-wd="dirty" /> Tetanus-prone: dirty, soil, puncture, crush, burn, bite, devitalised tissue or over 6 hours old</label>
          <div className="cx-cmp-out" data-wd="tetanus"><p><b>{tet.td ? "Td now" : "No Td needed"}{tet.tig ? " + TIG 250 IU" : ""}</b></p><p>{tet.text}</p></div>
        </div>
      </div>
      <h4>Local anaesthetic, maximum dose</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={la.kg} onChange={(e) => setLa({ ...la, kg: e.target.value.replace(/[^\d.]/g, "").slice(0, 5) })} placeholder="60" data-wd="kg" /></label>
        <label className="cx-field"><span>Drug</span><select className="cx-select" value={la.drug} onChange={(e) => { const drug = e.target.value as LaIn["drug"]; setLa({ ...la, drug, percent: drug === "bupivacaine" ? 0.5 : 1 }); }} data-wd="drug"><option value="lidocaine">Lidocaine (plain)</option><option value="lidocaine-adr">Lidocaine with adrenaline</option><option value="bupivacaine">Bupivacaine</option></select></label>
        <label className="cx-field"><span>Strength</span><select className="cx-select" value={la.percent} onChange={(e) => setLa({ ...la, percent: Number(e.target.value) })} data-wd="pct">{(la.drug === "bupivacaine" ? [0.25, 0.5] : [1, 2]).map((p) => <option key={p} value={p}>{p}%</option>)}</select></label>
      </div>
      {max && <p className="cx-set-hint" data-wd="la"><b>{max.text}</b>. Aspirate before injecting; adrenaline-containing solutions are safe in fingers and toes in healthy patients.</p>}
      <div className="cx-c23-two">
        <div><h4>Cleaning and closing</h4><ul>{WOUND_CLOSE.map((w) => <li key={w}>{w}</li>)}</ul></div>
        <div><h4>Antibiotics only for</h4><ul>{WOUND_ABX.map((w) => <li key={w}>{w}</li>)}</ul></div>
      </div>
      <h4>Aftercare sheet</h4>
      <HandoutActions md={md} title="Caring for your wound" {...h} />
      <p className="cx-rs-foot"><Bandage size={13} /> Tetanus by the CDC/ACIP wound table (Td in India); local anaesthetic maxima from the BNF. <TriangleAlert size={13} /> Refer tendon, nerve, vessel, eyelid-margin and complex facial injuries.</p>
    </section>
  );
}
