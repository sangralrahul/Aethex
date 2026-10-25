/**
 * Insomnia & Sleep: STOP-BANG for sleep apnoea, sleep efficiency and a sleep-restriction window,
 * medicines (short term), and a sleep handout in the patient's language.
 */
import { useState } from "react";
import { Moon, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { MdBlock } from "./LiveAnswer";
import { INSOMNIA_DRUGS, SLEEP_HYGIENE_MD, sleepWindow, STOPBANG, stopBangRisk } from "@/lib/cadus/clinic33";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };

export default function SleepView(h: H) {
  const [sb, setSb] = useState<string[]>([]);
  const [tst, setTst] = useState("");
  const [tib, setTib] = useState("");
  const [wake, setWake] = useState("06:30");
  const w = sleepWindow(Number(tst), Number(tib), wake);
  const md = w ? `${SLEEP_HYGIENE_MD}\n\n## Your sleep times\n- Bed at ${w.bedtime}, up at ${wake}, every day for a week.` : SLEEP_HYGIENE_MD;

  return (
    <section className="cx-page cx-lab cx-sleep">
      <header className="cx-page-h"><div><h1>Insomnia &amp; Sleep</h1><p>Screen for sleep apnoea, work out sleep efficiency and a sleep-restriction window for CBT-I, choose medicines wisely, and give a sleep plan in the patient's language.</p></div></header>
      <h4>STOP-BANG (sleep apnoea)</h4>
      <div className="cx-c23-row">{STOPBANG.map((s, i) => <label key={s} className="cx-pa-mine"><input type="checkbox" checked={sb.includes(s)} onChange={() => setSb(sb.includes(s) ? sb.filter((y) => y !== s) : [...sb, s])} data-sl-sb={i} /> {s}</label>)}</div>
      <p className="cx-set-hint" data-sl="stopbang"><b>STOP-BANG {sb.length}: {stopBangRisk(sb.length)}</b></p>
      <h4>Sleep diary (average of a week)</h4>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Hours actually asleep</span><input className="cx-input" inputMode="decimal" value={tst} onChange={(e) => setTst(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="5.5" data-sl="tst" /></label>
        <label className="cx-field"><span>Hours in bed</span><input className="cx-input" inputMode="decimal" value={tib} onChange={(e) => setTib(e.target.value.replace(/[^\d.]/g, "").slice(0, 4))} placeholder="8" data-sl="tib" /></label>
        <label className="cx-field"><span>Wake-up time</span><input className="cx-input" type="time" value={wake} onChange={(e) => setWake(e.target.value)} data-sl="wake" /></label>
      </div>
      {w && <div className={`cx-cmp-out ${w.efficiency < 85 ? "cx-ac-high" : "cx-ac-in"}`} data-sl="window"><p><b>{w.text}</b></p></div>}
      <h4>Medicines</h4><ul>{INSOMNIA_DRUGS.map((d) => <li key={d}>{d}</li>)}</ul>
      <p className="cx-set-hint">Look for causes: depression or anxiety, pain, nocturia, caffeine and alcohol, steroids or stimulants, restless legs (check ferritin), shift work.</p>
      <h4>Sleep plan for the patient</h4>
      <div className="cx-c23-doc" data-sl="handout"><MdBlock text={md} /></div>
      <HandoutActions md={md} title="Sleeping better" {...h} />
      <p className="cx-rs-foot"><Moon size={13} /> AASM and European insomnia guidelines (CBT-I first line); STOP-BANG. <TriangleAlert size={13} /> Sleepy drivers with suspected sleep apnoea should not drive until treated.</p>
    </section>
  );
}
