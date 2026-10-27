/**
 * Acute Viral Hepatitis (A & E): markers to send, home care vs admission, acute liver failure, and
 * prevention.
 */
import { useState } from "react";
import { Activity, TriangleAlert } from "lucide-react";
import { HEP_FLAGS, HEP_PREVENT, hepMarkers, hepTriage } from "@/lib/cadus/clinic43";

export default function HepatitisAeView() {
  const [flags, setFlags] = useState<boolean[]>(HEP_FLAGS.map(() => false));
  const [m, setM] = useState({ hav: false, hev: false, hbsag: false, hbc: false, hcv: false });
  const t = hepTriage(flags);
  return (
    <section className="cx-page cx-lab cx-hepae">
      <header className="cx-page-h"><div><h1>Acute Viral Hepatitis (A &amp; E)</h1><p>Confirm the cause, decide home or hospital, spot acute liver failure early, and advise on spread and diet.</p></div></header>
      <h4>Markers</h4>
      <div className="cx-imaging-ticks">{([["hav", "IgM anti-HAV positive"], ["hev", "IgM anti-HEV positive"], ["hbsag", "HBsAg positive"], ["hbc", "IgM anti-HBc positive"], ["hcv", "Anti-HCV positive"]] as const).map(([k, l]) => <label key={k} className="cx-pa-mine"><input type="checkbox" checked={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.checked })} data-hep={k} /> {l}</label>)}</div>
      <p className="cx-set-hint" data-hep="dx"><b>{hepMarkers(m.hav, m.hev, m.hbsag, m.hbc, m.hcv)}</b></p>
      <h4>Warning signs</h4>
      <div className="cx-imaging-ticks">{HEP_FLAGS.map((x, i) => <label key={x} className="cx-pa-mine"><input type="checkbox" checked={flags[i]} onChange={(e) => setFlags(flags.map((y, j) => (j === i ? e.target.checked : y)))} data-hep-f={i} /> {x}</label>)}</div>
      <div className={`cx-cmp-out ${t.level === "alf" ? "cx-st-out" : t.level === "admit" ? "cx-ac-high" : "cx-ac-in"}`} data-hep="out" data-level={t.level}><p><b>{t.text}</b></p></div>
      <h4>Spread and prevention</h4><ul>{HEP_PREVENT.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="cx-rs-foot"><Activity size={13} /> INASL guidance, EASL acute liver failure guideline 2017, WHO hepatitis A and E fact sheets. <TriangleAlert size={13} /> Jaundice in pregnancy needs same-day assessment.</p>
    </section>
  );
}
