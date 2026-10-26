/**
 * Vertigo & HINTS: the HINTS examination for acute continuous vertigo (stroke vs vestibular
 * neuritis), and the common causes with how to recognise and treat them.
 */
import { useState } from "react";
import { Orbit, TriangleAlert } from "lucide-react";
import { hints, VERTIGO_TYPES, type HintsInput } from "@/lib/cadus/clinic42";

export default function VertigoView() {
  const [x, setX] = useState<HintsInput>({ impulse: "untested", nystagmus: "none", skew: false, hearingLoss: false, cantWalk: false });
  const r = hints(x);
  return (
    <section className="cx-page cx-lab cx-vertigo">
      <header className="cx-page-h"><div><h1>Vertigo &amp; HINTS</h1><p>For acute continuous vertigo with nystagmus: tell a posterior stroke from vestibular neuritis at the bedside, then match the common causes.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Head impulse test</span><select className="cx-select" value={x.impulse} onChange={(e) => setX({ ...x, impulse: e.target.value as HintsInput["impulse"] })} data-vg="impulse"><option value="untested">Not done</option><option value="abnormal">Abnormal (corrective saccade)</option><option value="normal">Normal</option></select></label>
        <label className="cx-field"><span>Nystagmus</span><select className="cx-select" value={x.nystagmus} onChange={(e) => setX({ ...x, nystagmus: e.target.value as HintsInput["nystagmus"] })} data-vg="nyst"><option value="none">None seen</option><option value="unidirectional">Horizontal, one direction</option><option value="changing">Changes direction with gaze</option><option value="vertical">Vertical or purely torsional</option></select></label>
      </div>
      <div className="cx-imaging-ticks">
        <label className="cx-pa-mine"><input type="checkbox" checked={x.skew} onChange={(e) => setX({ ...x, skew: e.target.checked })} data-vg="skew" /> Skew deviation on cover test</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={x.hearingLoss} onChange={(e) => setX({ ...x, hearingLoss: e.target.checked })} data-vg="hearing" /> New hearing loss</label>
        <label className="cx-pa-mine"><input type="checkbox" checked={x.cantWalk} onChange={(e) => setX({ ...x, cantWalk: e.target.checked })} data-vg="walk" /> Cannot walk unaided</label>
      </div>
      <div className={`cx-cmp-out ${r.central ? "cx-st-out" : "cx-ac-in"}`} data-vg="out" data-central={String(r.central)}><p><b>{r.text}</b></p>{r.reasons.length > 0 && <ul>{r.reasons.map((s) => <li key={s}>{s}</li>)}</ul>}</div>
      <h4>Common causes</h4>
      <table className="cx-c23-table" data-vg="types"><thead><tr><th>Cause</th><th>Clues</th><th>Treatment</th></tr></thead><tbody>{VERTIGO_TYPES.map((t) => <tr key={t.id}><td><b>{t.name}</b></td><td>{t.how}</td><td>{t.treat}</td></tr>)}</tbody></table>
      <p className="cx-rs-foot"><Orbit size={13} /> Kattah 2009 (HINTS), AAO-HNS BPPV guideline 2017. <TriangleAlert size={13} /> HINTS needs practice; when unsure, image and get neurology advice.</p>
    </section>
  );
}
