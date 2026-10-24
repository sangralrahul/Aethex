/**
 * Developmental Milestones: the milestones expected by the child's (corrected) age in four domains,
 * ticked off, red flags for referral, what comes next, and a handout for parents.
 */
import { useMemo, useState } from "react";
import { Baby, TriangleAlert } from "lucide-react";
import HandoutActions from "./HandoutActions";
import { correctedMonths, expectedBy, milestoneConcerns, nextUp, RED_FLAGS_ANY, type Domain } from "@/lib/cadus/clinic27";

type H = { generate: (body: Record<string, unknown>) => Promise<any>; friendlyError: (raw: string) => string; toast: (t: string) => void; onPrint: (title: string, md: string) => void; defaultLanguage: string };
const DOMAINS: Domain[] = ["Gross motor", "Fine motor", "Language", "Social"];
const ageText = (m: number) => (m < 24 ? `${m} months` : `${Math.floor(m / 12)} years${m % 12 ? ` ${m % 12} months` : ""}`);

export default function MilestonesView(h: H) {
  const [age, setAge] = useState("");
  const [ga, setGa] = useState("");
  const [done, setDone] = useState<Set<string>>(new Set());
  const a = Number(age);
  const ca = a > 0 ? correctedMonths(a, Number(ga) || undefined) : 0;
  const expected = useMemo(() => expectedBy(ca), [ca]);
  const concerns = a > 0 ? milestoneConcerns(ca, done) : [];
  const next = nextUp(ca);
  const md = [`# Your child's development${a ? `: ${ageText(a)}` : ""}`, "", "## What your child should be doing now", ...expected.slice(-8).map((m) => `- ${m.text} (${m.domain.toLowerCase()})`), "", "## What comes next", ...next.map((m) => `- By about ${ageText(m.months)}: ${m.text}`), "", "## How to help", "- Talk, sing and read to your child every day; name things you see.", "- Floor time and play: let your child move, reach and explore safely.", "- Less screen time: none under 2 years; under 1 hour a day from 2 to 5 years.", "", "## See the doctor if your child", "- Loses a skill they already had", "- Doesn't respond to their name or sounds, or doesn't look at faces", "- Isn't doing the things listed above"].join("\n");

  return (
    <section className="cx-page cx-lab cx-mile">
      <header className="cx-page-h"><div><h1>Developmental Milestones</h1><p>What a child should be doing by their age (corrected for prematurity), red flags for referral, what comes next, and a handout for parents in their language.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Age (months)</span><input className="cx-input" inputMode="numeric" value={age} onChange={(e) => { setAge(e.target.value.replace(/\D/g, "").slice(0, 2)); setDone(new Set()); }} placeholder="12" data-ms="age" /></label>
        <label className="cx-field"><span>Born at (weeks, if premature)</span><input className="cx-input" inputMode="numeric" value={ga} onChange={(e) => setGa(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="40" data-ms="ga" /></label>
      </div>
      {a > 0 ? (
        <>
          {ca !== a && <p className="cx-set-hint" data-ms="corrected">Corrected age: {ca} months (used until 2 years).</p>}
          {concerns.length > 0 && <div className="cx-anc-flags" data-ms="concerns">{concerns.map((c) => <p key={c.text} className={c.flag !== undefined && ca >= c.flag ? "high" : ""}><TriangleAlert size={13} /> Not yet: {c.text} (usually by {ageText(c.months)}){c.flag !== undefined && ca >= c.flag ? ": a red flag, refer for assessment" : ""}</p>)}</div>}
          <div className="cx-mile-grid" data-ms="grid">{DOMAINS.map((d) => (
            <fieldset key={d}><legend>{d}</legend>
              {expected.filter((m) => m.domain === d).map((m) => <label key={m.text} className="cx-pa-mine"><input type="checkbox" checked={done.has(m.text)} onChange={() => { const n = new Set(done); if (n.has(m.text)) n.delete(m.text); else n.add(m.text); setDone(n); }} data-ms-item={m.text} /> {m.text} <small>({ageText(m.months)})</small></label>)}
            </fieldset>
          ))}</div>
          <h4>Any age: refer if</h4><ul>{RED_FLAGS_ANY.map((r) => <li key={r}>{r}</li>)}</ul>
          <HandoutActions md={md} title="Your child's development" {...h} />
        </>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Baby size={20} /></span><h3>Enter the age</h3><p>Tick what the child can do; anything missed is flagged.</p></div>}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Typical ages vary; a single missed milestone is a prompt to look closer, not a diagnosis. Use a standard screening tool (for example the Trivandrum Development Screening Chart or M-CHAT for autism) where available.</p>
    </section>
  );
}
