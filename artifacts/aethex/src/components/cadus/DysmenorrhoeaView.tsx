/**
 * Dysmenorrhoea & Endometriosis: primary vs secondary period pain, NSAID and hormonal steps, and when
 * to scan or refer.
 */
import { useState } from "react";
import { TriangleAlert, Venus } from "lucide-react";
import { dysmenPlan, type DysmenInput } from "@/lib/cadus/clinic46";

export default function DysmenorrhoeaView() {
  const [x, setX] = useState<DysmenInput>({ sinceMenarche: true, dyspareunia: false, chronicPain: false, infertility: false, heavy: false, dyschezia: false, irregularBleeding: false, mass: false, wantsPregnancy: false, nsaidFailed: false });
  const r = dysmenPlan(x);
  const cb = (k: keyof DysmenInput, l: string) => <label className="cx-pa-mine"><input type="checkbox" checked={x[k]} onChange={(e) => setX({ ...x, [k]: e.target.checked })} data-dys={k} /> {l}</label>;
  return (
    <section className="cx-page cx-lab cx-dys">
      <header className="cx-page-h"><div><h1>Dysmenorrhoea &amp; Endometriosis</h1><p>Painful periods since the first period are usually primary; new pain, pain with sex or bowel movements, or infertility suggest endometriosis or adenomyosis.</p></div></header>
      <div className="cx-imaging-ticks">
        {cb("sinceMenarche", "Pain since periods started")}{cb("nsaidFailed", "No better with NSAIDs and hormones for 3–6 months")}{cb("dyspareunia", "Deep pain with sex")}{cb("dyschezia", "Pain opening bowels during periods")}
        {cb("chronicPain", "Pelvic pain between periods")}{cb("heavy", "Heavy periods")}{cb("irregularBleeding", "Bleeding between periods or after sex")}{cb("mass", "Pelvic mass or tender nodules")}{cb("infertility", "Difficulty conceiving")}{cb("wantsPregnancy", "Wants to conceive now")}
      </div>
      <div className={`cx-cmp-out ${r.refer ? "cx-ac-high" : "cx-ac-in"}`} data-dys="out" data-type={r.type} data-refer={String(r.refer)}><h3 className="cx-lab-h3">{r.type === "primary" ? "Primary dysmenorrhoea" : "Secondary dysmenorrhoea"}</h3><ol className="cx-c23-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
      <p className="cx-rs-foot"><Venus size={13} /> NICE NG73 endometriosis (2024), ESHRE 2022, ACOG. <TriangleAlert size={13} /> Average delay to diagnose endometriosis is 7–8 years: take period pain seriously.</p>
    </section>
  );
}
