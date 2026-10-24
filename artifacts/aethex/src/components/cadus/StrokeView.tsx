/**
 * Stroke & Thrombolysis: the clock from last known well, alteplase and tenecteplase doses by weight,
 * an NIHSS scorer, the exclusion checklist and monitoring after thrombolysis.
 */
import { useEffect, useState } from "react";
import { Brain, Printer, TriangleAlert } from "lucide-react";
import { LYSIS_AFTER, LYSIS_EXCLUSIONS, lyticDoses, NIHSS_ITEMS, nihssBand, nihssTotal, STROKE_TARGETS, strokeClock } from "@/lib/cadus/clinic28";

/** A "HH:MM" today, or yesterday if that would be in the future. */
function lastWellDate(t: string, now: Date): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const d = new Date(now); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() > now.getTime()) d.setDate(d.getDate() - 1);
  return d;
}

export default function StrokeView({ onPrint }: { onPrint: (title: string, md: string) => void }) {
  const [tab, setTab] = useState<"clock" | "nihss" | "exclude" | "after">("clock");
  const [lw, setLw] = useState("");
  const [kg, setKg] = useState("");
  const [nih, setNih] = useState<Record<string, number>>({});
  const [ex, setEx] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(t); }, []);
  const lwd = lastWellDate(lw, now);
  const clock = lwd ? strokeClock(lwd, now) : null;
  const doses = lyticDoses(Number(kg));
  const score = nihssTotal(nih);
  const md = () => ["# Stroke thrombolysis", "", clock ? `- ${clock.text}` : "", `- NIHSS ${score} (${nihssBand(score)})`, ...doses.map((d) => `- **${d.drug}:** ${d.text}`), ex.length ? `- Contraindications ticked: ${ex.join("; ")}` : "- No contraindication ticked", "", "## After thrombolysis", ...LYSIS_AFTER.map((a) => `- ${a}`)].filter(Boolean).join("\n");

  return (
    <section className="cx-page cx-lab cx-stroke">
      <header className="cx-page-h"><div><h1>Stroke &amp; Thrombolysis</h1><p>The clock from last known well, thrombolysis doses by weight, the NIHSS, the exclusion checklist and monitoring after the drug.</p></div></header>
      <div className="cx-seg" role="tablist">{([["clock", "Clock and dose"], ["nihss", `NIHSS ${score}`], ["exclude", `Exclusions${ex.length ? ` (${ex.length})` : ""}`], ["after", "After lysis"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={tab === v ? "on" : ""} onClick={() => setTab(v)} data-st-tab={v}>{l}</button>)}</div>
      {tab === "clock" && (
        <>
          <div className="cx-c23-row">
            <label className="cx-field"><span>Last known well (time)</span><input className="cx-input" type="time" value={lw} onChange={(e) => setLw(e.target.value)} data-st="lw" /></label>
            <label className="cx-field"><span>Weight (kg)</span><input className="cx-input" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} placeholder="70" data-st="kg" /></label>
            <button className="cx-btn" onClick={() => { const d = new Date(); setLw(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`); }}>Just now</button>
          </div>
          {clock && <div className={`cx-cmp-out ${clock.inWindow ? "" : "cx-st-out"}`} data-st="clock" data-in={String(clock.inWindow)}><h3 className="cx-lab-h3">{clock.inWindow ? `In the window until ${clock.windowEnds}` : "Outside the 4.5-hour window"}</h3><p>{clock.text}</p></div>}
          {doses.length > 0 && <div className="cx-cmp-out" data-st="doses">{doses.map((d) => <p key={d.drug} data-st-drug={d.drug}><b>{d.drug}:</b> {d.text}</p>)}{ex.length > 0 && <p className="cx-bk-err" role="alert"><TriangleAlert size={13} /> {ex.length} contraindication{ex.length > 1 ? "s" : ""} ticked: see Exclusions.</p>}</div>}
          <h4>Targets</h4><ul>{STROKE_TARGETS.map((t) => <li key={t}>{t}</li>)}</ul>
          <p className="cx-set-hint">Before the drug: CT (or MRI) brain, glucose, BP under 185/110; do not wait for other bloods unless a bleeding disorder or anticoagulant is suspected.</p>
        </>
      )}
      {tab === "nihss" && (
        <>
          <div className="cx-nihss" data-st="nihss">{NIHSS_ITEMS.map((i) => (
            <label key={i.id} className="cx-field"><span>{i.label}</span><select className="cx-select" value={nih[i.id] ?? 0} onChange={(e) => setNih({ ...nih, [i.id]: Number(e.target.value) })} data-st-n={i.id}>{i.options.map((o, k) => <option key={o} value={k}>{k}: {o}</option>)}</select></label>
          ))}</div>
          <div className="cx-cmp-out"><h3 className="cx-lab-h3" data-st="score">NIHSS {score} / 42: {nihssBand(score)}</h3><p>Disabling deficits (for example aphasia, hemianopia, weakness that stops walking) matter more than the number; thrombectomy is usually considered for a large-vessel occlusion with NIHSS 6 or more.</p></div>
        </>
      )}
      {tab === "exclude" && (
        <div className="cx-imaging-ticks" data-st="exclusions">{LYSIS_EXCLUSIONS.map((e) => <label key={e} className="cx-pa-mine"><input type="checkbox" checked={ex.includes(e)} onChange={() => setEx(ex.includes(e) ? ex.filter((x) => x !== e) : [...ex, e])} /> {e}</label>)}<p className="cx-set-hint">{ex.length ? "One or more contraindications: discuss with the stroke physician; thrombectomy may still be possible." : "None ticked. Relative contraindications (recent MI, pregnancy, seizure at onset, major surgery) need senior judgement."}</p></div>
      )}
      {tab === "after" && <ul data-st="after">{LYSIS_AFTER.map((a) => <li key={a}>{a}</li>)}</ul>}
      <div className="cx-sc-acts"><button className="cx-btn" onClick={() => onPrint("Stroke thrombolysis", md())} data-st="print"><Printer size={14} /> Print summary</button></div>
      <p className="cx-rs-foot"><Brain size={13} /> AHA/ASA 2019 and ESO 2021–2023 guidance. <TriangleAlert size={13} /> Thrombolysis is a decision for a trained stroke team with imaging; follow your hospital protocol.</p>
    </section>
  );
}
