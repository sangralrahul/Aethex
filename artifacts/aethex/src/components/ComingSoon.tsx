/**
 * Update 101 (launch check): an honest "Coming soon" page for sections that had only sample content (jobs, community,
 * live classes, webinars, video cases, drug alerts, personal analytics, institution analytics). The original pages stay
 * in the code (pages/*.tsx) for when there is real content. "Notify me" keeps the email for that section
 * (POST /api/store/interest, table store_interest) so we can write when it opens. Search engines are told not to index it.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { PageHero } from "@/components/PageHero";

export type SoonTopic = "jobs" | "community" | "live-classes" | "webinars" | "video-cases" | "drug-alerts" | "analytics" | "institution-analytics";
const TEXT: Record<SoonTopic, { title: string; tag: string; sub: string; links: [string, string][] }> = {
  jobs: { title: "Medical jobs", tag: "Jobs", sub: "Openings from verified hospitals and clinics, with salary and contact details.", links: [["https://hospitals.aethex.in/", "Aethex for Hospitals"], ["https://doctors.aethex.in/list-your-practice", "List your practice"]] },
  community: { title: "Community", tag: "Community", sub: "Discuss cases and questions with verified doctors and students.", links: [["https://study.aethex.in/study-groups", "Study groups"], ["https://study.aethex.in/question-of-the-day", "Question of the day discussion"]] },
  "live-classes": { title: "Live classes", tag: "Live classes", sub: "Live NEET-PG sessions with faculty.", links: [["https://study.aethex.in/mock-test", "Mock tests"], ["https://study.aethex.in/neet-pg", "NEET-PG questions"]] },
  webinars: { title: "Webinars", tag: "Webinars", sub: "CME webinars with certificates.", links: [["https://study.aethex.in/cme-hub", "CME Hub"], ["https://study.aethex.in/case-of-the-day", "Case of the day"]] },
  "video-cases": { title: "Video cases", tag: "Video cases", sub: "Short clinical case videos by specialists.", links: [["https://study.aethex.in/cases", "Clinical cases"], ["https://study.aethex.in/case-of-the-day", "Case of the day"]] },
  "drug-alerts": { title: "Drug alerts", tag: "Drug alerts", sub: "Recalls and safety alerts, linked to the official notices.", links: [["https://study.aethex.in/drug-reference", "Drug reference"], ["https://study.aethex.in/drug-interaction-checker", "Drug interactions"]] },
  analytics: { title: "Your analytics", tag: "Analytics", sub: "Your study and Cadus use over time.", links: [["https://study.aethex.in/my-library", "My library: your progress"], ["https://study.aethex.in/my-library?tab=mastery", "Topic mastery"]] },
  "institution-analytics": { title: "Institution analytics", tag: "For institutions", sub: "Your students' progress, for colleges using Aethex Study.", links: [["https://medicalcolleges.aethex.in/", "Aethex for Medical Colleges"], ["https://aethex.in/contact", "Contact us"]] },
};

export function ComingSoon({ topic, icon }: { topic: SoonTopic; icon?: ReactNode }) {
  const t = TEXT[topic];
  useSeo({ title: `${t.title}: coming soon | Aethex`, description: t.sub, path: `/${topic}` });
  useEffect(() => {
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);
  const { user } = useUserAuth();
  const [email, setEmail] = useState(user?.email ?? ""), [state, setState] = useState<"" | "busy" | "done">(""), [err, setErr] = useState("");
  const send = async (e: FormEvent) => {
    e.preventDefault(); setErr(""); setState("busy");
    try {
      const r = await fetch("/api/store/interest", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic, email }) });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setErr(d?.error ?? "Something went wrong."); setState(""); return; }
      setState("done");
    } catch { setErr("You seem to be offline."); setState(""); }
  };
  return (
    <div className="ax-soon-page" data-soon={topic}>
      <PageHero tag={t.tag} title={t.title} subtitle={t.sub} icon={icon} />
      <div className="ax-wrap ax-soon">
        <div className="card">
          <span className="badge">Coming soon</span>
          <h2>We're building this</h2>
          <p>We'd rather show nothing than show sample content. Leave your email and we'll write once, when it opens.</p>
          {state === "done" ? <p className="ok" role="status" data-soon-done><Check size={16} /> Thanks. We'll email you when it's live.</p> : (
            <form onSubmit={send}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Your email" />
              <button type="submit" className="ax-btn teal" disabled={state === "busy"}>{state === "busy" ? <Loader2 size={15} className="spin" /> : <Bell size={15} />} Notify me</button>
            </form>
          )}
          {err && <p className="ax-form-err" role="alert">{err}</p>}
        </div>
        <div className="meanwhile">
          <h3>Meanwhile</h3>
          <ul>{t.links.map(([h, l]) => <li key={h}><a href={h}>{l}</a></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
