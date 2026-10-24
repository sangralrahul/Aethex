/**
 * Quit Smoking Helper: Fagerström dependence, nicotine replacement doses, varenicline and bupropion
 * schedules, a quit date, and a quit plan handout in the patient's language.
 */
import { useState } from "react";
import { CigaretteOff, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { MdBlock } from "./LiveAnswer";
import { BUPROPION, ftnd, nrtPlan, quitPlanMd, VARENICLINE, type FtndIn } from "@/lib/cadus/clinic29";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };
const plusDays = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

export default function QuitSmokingView(h: H) {
  const [f, setF] = useState<FtndIn>({ firstCig: 2, forbidden: 0, hateFirst: 1, perDay: 1, morning: 0, ill: 0 });
  const [perDay, setPerDay] = useState("15");
  const [tobacco, setTobacco] = useState("Cigarettes");
  const [med, setMed] = useState<"nrt" | "varenicline" | "bupropion">("nrt");
  const [date, setDate] = useState(() => plusDays(10));
  const s = ftnd(f);
  const nrt = nrtPlan(Number(perDay) || 0, f.firstCig >= 2);
  const medLines = med === "nrt" ? ["Combination works best: a patch plus gum or lozenge for urges", ...nrt.patch, ...nrt.short.slice(0, 2)] : med === "varenicline" ? VARENICLINE.slice(0, 4) : BUPROPION.slice(0, 2);
  const when = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const md = quitPlanMd(when, tobacco, medLines);
  const sel = <K extends keyof FtndIn>(k: K, label: string, opts: [FtndIn[K], string][]) => (
    <label className="cx-field"><span>{label}</span><select className="cx-select" value={String(f[k])} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) as FtndIn[K] })} data-qs-f={k}>{opts.map(([v, l]) => <option key={l} value={String(v)}>{l}</option>)}</select></label>
  );

  return (
    <section className="cx-page cx-lab cx-quit">
      <header className="cx-page-h"><div><h1>Quit Smoking Helper</h1><p>How dependent the patient is, nicotine replacement doses, varenicline or bupropion, a quit date, and a plan to take home in their language.</p></div></header>
      <h4>Fagerström test</h4>
      <div className="cx-nihss">
        {sel("firstCig", "How soon after waking is the first cigarette?", [[3, "Within 5 minutes"], [2, "6–30 minutes"], [1, "31–60 minutes"], [0, "After 60 minutes"]])}
        {sel("forbidden", "Hard not to smoke where it is forbidden?", [[1, "Yes"], [0, "No"]])}
        {sel("hateFirst", "Which cigarette is hardest to give up?", [[1, "The first in the morning"], [0, "Any other"]])}
        {sel("perDay", "How many a day?", [[0, "10 or fewer"], [1, "11–20"], [2, "21–30"], [3, "31 or more"]])}
        {sel("morning", "Smokes more in the first hours after waking?", [[1, "Yes"], [0, "No"]])}
        {sel("ill", "Smokes when ill in bed most of the day?", [[1, "Yes"], [0, "No"]])}
      </div>
      <div className="cx-cmp-out" data-qs="ftnd"><h3 className="cx-lab-h3" data-qs="score">Fagerström {s.score} / 10: {s.level}</h3><p>{s.score >= 5 ? "Offer medicine plus behavioural support: combination NRT or varenicline." : "Behavioural support; NRT helps if there are cravings."} Ask about bidis and smokeless tobacco too: the same plan works.</p></div>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Tobacco used</span><input className="cx-input" value={tobacco} onChange={(e) => setTobacco(e.target.value.slice(0, 60))} data-qs="tobacco" /></label>
        <label className="cx-field"><span>Cigarettes or bidis a day</span><input className="cx-input" inputMode="numeric" value={perDay} onChange={(e) => setPerDay(e.target.value.replace(/\D/g, "").slice(0, 3))} data-qs="perday" /></label>
        <label className="cx-field"><span>Quit date</span><input className="cx-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-qs="date" /></label>
        <label className="cx-field"><span>Medicine</span><select className="cx-select" value={med} onChange={(e) => setMed(e.target.value as typeof med)} data-qs="med"><option value="nrt">Nicotine replacement</option><option value="varenicline">Varenicline</option><option value="bupropion">Bupropion</option></select></label>
      </div>
      <div className="cx-c23-two">
        <div><h4>Nicotine replacement</h4><ul data-qs="nrt">{[...nrt.patch, ...nrt.short].map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h4>Varenicline</h4><ul>{VARENICLINE.map((x) => <li key={x}>{x}</li>)}</ul><h4>Bupropion SR</h4><ul>{BUPROPION.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <h4>Quit plan to take home</h4>
      <div className="cx-c23-doc" data-qs="plan"><MdBlock text={md} /></div>
      <HandoutActions md={md} title="Your plan to quit tobacco" {...h} />
      <p className="cx-rs-foot"><CigaretteOff size={13} /> Fagerström Test for Nicotine Dependence; WHO and NICE NG209 cessation guidance. <TriangleAlert size={13} /> Smoking speeds the breakdown of clozapine, olanzapine and theophylline: levels rise after quitting.</p>
    </section>
  );
}
