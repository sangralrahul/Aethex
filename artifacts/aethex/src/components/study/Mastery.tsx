/**
 * Update 90, Aethex Study: the topic mastery map (My library, "Topic mastery" tab). Every subject's Knowledge Hub
 * topics as tiles coloured by your accuracy on the questions you answered in that topic: strong (80% and over),
 * getting there (60–79%), weak (under 60%), and grey for topics you haven't practised. From your own study record
 * (every answered question, on every device when signed in). Each tile opens the topic or a practice test on it.
 * Bank questions are matched to a topic by their wording (lib/study/topics.ts); ones that match none are "Other".
 * Styles: src/site-ws.css (.st-mast*).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Target } from "lucide-react";
import { medicalSubjects } from "@/data/medicalSubjects";
import { QUESTIONS } from "@/data/neetpgQuestions";
import { useStudy } from "@/lib/study/progress";
import { fromBank } from "@/lib/study/questions";
import { hubSubject, OTHER_TOPIC } from "@/lib/study/topics";

type Cell = { n: number; right: number };
const band = (c?: Cell) => (!c || !c.n ? "none" : c.right / c.n >= 0.8 ? "strong" : c.right / c.n >= 0.6 ? "mid" : "weak");
const LABEL: Record<string, string> = { strong: "Strong (80%+)", mid: "Getting there (60–79%)", weak: "Weak (under 60%)", none: "Not practised" };

export function MasteryMap() {
  const s = useStudy();
  const bankTopic = useMemo(() => new Map(QUESTIONS.map((q) => { const b = fromBank(q); return [b.key, b.topic!]; })), []);
  const map = useMemo(() => {
    const m = new Map<string, Map<string, Cell>>();
    for (const a of s.attempts) {
      const sub = hubSubject(a.subject);
      if (!sub) continue;
      const topic = a.topic ?? bankTopic.get(a.key) ?? OTHER_TOPIC;
      const t = m.get(sub.slug) ?? new Map<string, Cell>();
      const c = t.get(topic) ?? { n: 0, right: 0 };
      c.n++; if (a.correct) c.right++;
      t.set(topic, c); m.set(sub.slug, t);
    }
    return m;
  }, [s, bankTopic]);
  const [only, setOnly] = useState<"practised" | "all">("practised");
  const subjects = medicalSubjects.filter((x) => only === "all" || map.has(x.slug))
    .sort((a, b) => (map.has(b.slug) ? 1 : 0) - (map.has(a.slug) ? 1 : 0));
  const weakest = [...map.entries()].flatMap(([slug, t]) => [...t.entries()].filter(([name, c]) => name !== OTHER_TOPIC && c.n >= 2).map(([name, c]) => ({ slug, name, c, pct: c.right / c.n })))
    .filter((x) => x.pct < 0.6).sort((a, b) => a.pct - b.pct).slice(0, 5);
  const practise = (slug: string, topic?: string) => `/custom-test?subject=${slug}${topic ? `&topic=${medicalSubjects.find((x) => x.slug === slug)?.topics.find((t) => t.name === topic)?.slug ?? ""}` : ""}`;
  return (
    <div className="st-mast" data-study="mastery">
      <div className="st-mast-bar">
        <div className="kh-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={only === "practised"} className={only === "practised" ? "on" : ""} onClick={() => setOnly("practised")}>Subjects you've practised ({map.size})</button>
          <button type="button" role="tab" aria-selected={only === "all"} className={only === "all" ? "on" : ""} onClick={() => setOnly("all")} data-study="mastery-all">All subjects</button>
        </div>
        <ul className="st-mast-key">{["strong", "mid", "weak", "none"].map((k) => <li key={k} className={`b-${k}`}>{LABEL[k]}</li>)}</ul>
      </div>
      {weakest.length > 0 && (
        <section className="st-card st-mast-weak" data-study="mastery-weak">
          <h2>Work on these next</h2>
          <ul>{weakest.map((w) => <li key={w.slug + w.name}><span>{w.name} <small>{hubSubject(w.slug)?.name}</small></span><b>{Math.round(w.pct * 100)}%</b><Link href={practise(w.slug, w.name)} className="ax-link"><Target size={13} /> Practise</Link></li>)}</ul>
        </section>
      )}
      {!subjects.length ? (
        <div className="ax-empty"><span className="ic"><Target size={26} /></span><h2>Answer a few questions first</h2><p>Every question you answer, in practice, tests or the question of the day, fills in the map topic by topic.</p><Link href="/neet-pg" className="ax-btn teal">Practise questions</Link></div>
      ) : subjects.map((sub) => {
        const t = map.get(sub.slug);
        const other = t?.get(OTHER_TOPIC);
        const n = t ? [...t.values()].reduce((a, c) => a + c.n, 0) : 0, right = t ? [...t.values()].reduce((a, c) => a + c.right, 0) : 0;
        return (
          <section key={sub.slug} className="st-mast-sub" data-subject={sub.slug}>
            <div className="hd"><h3>{sub.name}</h3><small>{n ? `${n} answered · ${Math.round((right / n) * 100)}%` : "Not started"}</small><Link href={practise(sub.slug)} className="ax-link">Practise</Link></div>
            <ul className="tiles">
              {sub.topics.map((tp) => {
                const c = t?.get(tp.name), b = band(c);
                return (
                  <li key={tp.slug} className={`b-${b}`} data-topic={tp.name} data-band={b}>
                    <Link href={`/study-hub/medical-knowledge-hub/subjects/${sub.slug}/${tp.slug}`} title={`${tp.name}: ${c ? `${c.right} of ${c.n} right` : "not practised"}`}>
                      <span>{tp.name}</span>{c && <em>{Math.round((c.right / c.n) * 100)}% · {c.n}</em>}
                    </Link>
                  </li>
                );
              })}
              {other && <li className={`b-${band(other)} other`} data-topic={OTHER_TOPIC} data-band={band(other)}><span><span>Other questions</span><em>{Math.round((other.right / other.n) * 100)}% · {other.n}</em></span></li>}
            </ul>
          </section>
        );
      })}
      <p className="fine"><BookOpen size={13} /> From every question you've answered. Bank questions are placed in a topic by their wording, so a few may sit in a neighbouring topic.</p>
    </div>
  );
}
