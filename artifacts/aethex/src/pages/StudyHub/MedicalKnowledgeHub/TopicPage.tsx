import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useSearch } from "wouter";
import {
  ArrowLeft, Clock, BarChart2, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw, Stethoscope, Brain, Zap
} from "lucide-react";
import { getTopicBySlug } from "@/data/medicalSubjects";
import { BreadcrumbNav } from "@/components/MedKnowledge/BreadcrumbNav";
import { SectionLoader } from "@/components/MedKnowledge/SectionLoader";
import { MCQQuiz } from "@/components/MedKnowledge/MCQQuiz";
import { FlashCard } from "@/components/MedKnowledge/FlashCard";
import { DiagramCarousel } from "@/components/MedKnowledge/DiagramCarousel";
import { RichContent } from "@/components/MedKnowledge/RichContent";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = BASE.replace(/\/[^/]*$/, "");

const SUBJECT_BG: Record<string, string> = {
  "anatomy":               "https://images.unsplash.com/photo-1530026405186-ed1f139313f4?w=1400&q=80",
  "physiology":            "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1400&q=80",
  "biochemistry":          "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1400&q=80",
  "pharmacology":          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1400&q=80",
  "pathology":             "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1400&q=80",
  "microbiology":          "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1400&q=80",
  "forensic-medicine":     "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1400&q=80",
  "community-medicine":    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1400&q=80",
  "dermatology":           "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1400&q=80",
  "psychiatry":            "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1400&q=80",
  "radiology":             "https://images.unsplash.com/photo-1516069677018-378515003435?w=1400&q=80",
  "anesthesiology":        "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1400&q=80",
  "ophthalmology":         "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1400&q=80",
  "ent":                   "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1400&q=80",
  "orthopedics":           "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1400&q=80",
  "medicine":              "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1400&q=80",
  "surgery":               "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=1400&q=80",
  "obstetrics-gynecology": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1400&q=80",
  "pediatrics":            "https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=1400&q=80",
  "emergency-medicine":    "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1400&q=80",
};
const FALLBACK_BG = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&q=80";

const diffColor: Record<string, string> = {
  Basic: "#238636", Intermediate: "#E3B341", Advanced: "#F85149",
};

function useIntersection(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return visible;
}

function useMedContent(section: string, params: Record<string, string>, eager = false) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetched = useRef(false);

  const fetch_ = useCallback(async () => {
    if (fetched.current && content) return;
    const cacheKey = `mk_${section}_${JSON.stringify(params)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setContent(cached); return; }
    fetched.current = true;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/api/med-knowledge/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, ...params }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      sessionStorage.setItem(cacheKey, data.content);
      setContent(data.content);
    } catch {
      setError(true);
      fetched.current = false;
    } finally {
      setLoading(false);
    }
  }, [section, JSON.stringify(params)]);

  useEffect(() => { if (eager) fetch_(); }, [eager]);

  return { content, loading, error, fetch: fetch_ };
}

function robustParseJSON(raw: string): any[] | null {
  try {
    const s = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const arr = JSON.parse(s);
    if (Array.isArray(arr) && arr.length > 0) return arr;
  } catch {}
  try {
    const match = raw.match(/(\[[\s\S]*\])/);
    if (match) {
      const arr = JSON.parse(match[1]);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch {}
  return null;
}

function LazySection({ section, params, title, icon }: {
  section: string; params: Record<string, string>; title: string; icon: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<HTMLElement>);
  const { content, loading, error, fetch: fetchContent } = useMedContent(section, params, false);

  useEffect(() => { if (visible && !content && !loading) fetchContent(); }, [visible]);

  return (
    <div ref={ref} className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E5E1D8", background: "rgba(0,194,168,0.03)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)" }}>
          {icon}
        </div>
        <h3 className="font-bold text-base" style={{ color: "#0F1729" }}>{title}</h3>
      </div>
      <div className="px-6 py-5">
        {loading && <SectionLoader lines={5} />}
        {error && (
          <div className="flex items-center gap-3 py-3">
            <AlertCircle className="w-5 h-5" style={{ color: "#F85149" }} />
            <span className="text-sm" style={{ color: "#6B7280" }}>Content temporarily unavailable.</span>
            <button onClick={fetchContent} className="flex items-center gap-1 text-sm" style={{ color: "#00C2A8" }}>
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}
        {content && !loading && <RichContent content={content} />}
      </div>
    </div>
  );
}

export default function TopicPage() {
  const params = useParams<{ subjectSlug: string; topicSlug: string }>();
  const search = useSearch();
  const result = getTopicBySlug(params.subjectSlug || "", params.topicSlug || "");
  const [saved, setSaved] = useState(() => {
    const list = JSON.parse(localStorage.getItem("aethex_study_list") || "[]");
    return list.includes(`${params.subjectSlug}/${params.topicSlug}`);
  });
  const urlTab = new URLSearchParams(search).get("tab") as "overview" | "exam" | "flashcards" | null;
  const [activeTab, setActiveTab] = useState<"overview" | "exam" | "flashcards">(urlTab || "overview");
  const [mcqCount, setMcqCount] = useState(8);

  const apiParams = result ? { topic: result.topic.name, subject: result.subject.name } : {};
  const mcqApiParams = result ? { ...apiParams, mcqCount: String(mcqCount) } : {};
  const overview = useMedContent("overview", apiParams, !!result);
  const keyConcepts = useMedContent("key_concepts", apiParams, !!result);
  const clinicalRelevance = useMedContent("clinical_relevance", apiParams, false);
  const mcqData = useMedContent("mcq", mcqApiParams, false);
  const flashData = useMedContent("flashcards", apiParams, false);

  const handleSave = () => {
    const list = JSON.parse(localStorage.getItem("aethex_study_list") || "[]");
    const key = `${params.subjectSlug}/${params.topicSlug}`;
    const updated = saved ? list.filter((x: string) => x !== key) : [...list, key];
    localStorage.setItem("aethex_study_list", JSON.stringify(updated));
    setSaved(!saved);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Topic not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#00C2A8" }}>← Back to Hub</Link>
        </div>
      </div>
    );
  }

  const { subject, topic } = result;

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Hero */}
      <div className="relative border-b overflow-hidden" style={{ borderColor: "#E5E1D8" }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url('${SUBJECT_BG[subject.slug] ?? FALLBACK_BG}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(245,243,238,0.97) 0%, rgba(255,255,255,0.95) 60%, ${subject.color ?? "#00C2A8"}10 100%)` }} />
        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
          <BreadcrumbNav crumbs={[
            { label: "Study Hub", href: `${BASE}/study-hub` },
            { label: "Knowledge Hub", href: `${BASE}/study-hub/medical-knowledge-hub` },
            { label: subject.name, href: `${BASE}/study-hub/medical-knowledge-hub/subjects/${subject.slug}` },
            { label: topic.name },
          ]} />
          <Link href={`${BASE}/study-hub/medical-knowledge-hub/subjects/${subject.slug}`}
            className="flex items-center gap-2 text-sm mt-4 mb-5 transition-all hover:opacity-80" style={{ color: "#6B7280" }}>
            <ArrowLeft className="w-4 h-4" /> Back to {subject.name}
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8", border: "1px solid rgba(0,194,168,0.2)" }}>{subject.icon} {subject.name}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${diffColor[topic.difficulty]}18`, color: diffColor[topic.difficulty], border: `1px solid ${diffColor[topic.difficulty]}33` }}>{topic.difficulty}</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}><Clock className="w-3.5 h-3.5" /> {topic.readTime} min read</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#0F1729", letterSpacing: "-0.01em" }}>{topic.name}</h1>
            </div>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: saved ? "rgba(0,194,168,0.1)" : "#E5E1D8", color: saved ? "#00C2A8" : "#6B7280", border: `1px solid ${saved ? "#00C2A8" : "#E5E1D8"}` }}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b" style={{ borderColor: "#E5E1D8" }}>
            {[
              ["overview", "📖 Overview & Diagrams"],
              ["exam", "🎯 Exam Corner (MCQs)"],
              ["flashcards", "⚡ Flashcards"],
            ].map(([t, label]) => (
              <button key={t} onClick={() => setActiveTab(t as any)}
                className="px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px"
                style={{
                  color: activeTab === t ? "#00C2A8" : "#6B7280",
                  borderBottomColor: activeTab === t ? "#00C2A8" : "transparent",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Overview */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E5E1D8", background: "rgba(0,194,168,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)" }}>
                  <Brain className="w-4 h-4" style={{ color: "#00C2A8" }} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Overview</h2>
                  <p className="text-xs" style={{ color: "#6B7280" }}>AI-generated encyclopedic content</p>
                </div>
              </div>
              <div className="px-6 py-5">
                {overview.loading && <SectionLoader lines={8} />}
                {overview.error && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" style={{ color: "#F85149" }} />
                    <span className="text-sm" style={{ color: "#6B7280" }}>Could not load overview.</span>
                    <button onClick={overview.fetch} className="flex items-center gap-1 text-sm" style={{ color: "#00C2A8" }}>
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                )}
                {overview.content && <RichContent content={overview.content} lineByLine />}
              </div>
            </div>

            {/* Diagrams */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E5E1D8", background: "rgba(0,194,168,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)" }}>
                  <BarChart2 className="w-4 h-4" style={{ color: "#00C2A8" }} />
                </div>
                <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Medical Diagrams</h2>
              </div>
              <div className="px-6 py-5">
                <DiagramCarousel topicSlug={topic.slug} subjectSlug={subject.slug} />
              </div>
            </div>

            {/* Key Concepts */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E5E1D8", background: "rgba(0,194,168,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)" }}>
                  <Zap className="w-4 h-4" style={{ color: "#00C2A8" }} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Key Concepts</h2>
                  <p className="text-xs" style={{ color: "#6B7280" }}>Essential high-yield facts</p>
                </div>
              </div>
              <div className="px-6 py-5">
                {keyConcepts.loading && <SectionLoader lines={8} />}
                {keyConcepts.error && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" style={{ color: "#F85149" }} />
                    <button onClick={keyConcepts.fetch} className="flex items-center gap-1 text-sm" style={{ color: "#00C2A8" }}><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
                  </div>
                )}
                {keyConcepts.content && <RichContent content={keyConcepts.content} lineByLine />}
              </div>
            </div>

            {/* Clinical Relevance */}
            <LazySection section="clinical_relevance" params={apiParams} title="Clinical Relevance & Applied"
              icon={<Stethoscope className="w-4 h-4" style={{ color: "#00C2A8" }} />} />

            {/* Related Conditions */}
            {topic.relatedConditions && topic.relatedConditions.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "#E5E1D8" }}>
                  <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Related Conditions</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="flex flex-wrap gap-3">
                    {topic.relatedConditions.map(c => (
                      <div key={c} className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:border-teal-500/50"
                        style={{ background: "#E5E1D8", color: "#0F1729", border: "1px solid #30363D" }}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "exam" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)" }}>
                🎯
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Exam Corner — MCQ Practice</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>NEET-PG / USMLE style questions with explanations</p>
              </div>
            </div>
            {!mcqData.content && !mcqData.loading && !mcqData.error && (
              <div className="text-center py-12 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="text-4xl mb-4">🧠</div>
                <p className="text-base font-medium mb-2" style={{ color: "#0F1729" }}>Test your knowledge on {topic.name}</p>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>NEET-PG / USMLE style questions with explanations</p>
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6B7280" }}>Number of Questions</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[8, 15, 20, 25, 35, 50].map(n => (
                      <button key={n} onClick={() => setMcqCount(n)}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                        style={{
                          background: mcqCount === n ? "linear-gradient(135deg,#00C2A8,#0088cc)" : "#E5E1D8",
                          color: mcqCount === n ? "#fff" : "#6B7280",
                          border: `1px solid ${mcqCount === n ? "#00C2A8" : "#30363D"}`,
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={mcqData.fetch}
                  className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#00C2A8,#0088cc)", color: "#fff" }}>
                  Generate {mcqCount} MCQs with AI
                </button>
              </div>
            )}
            {mcqData.loading && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#00C2A8", borderTopColor: "transparent" }} />
                <p className="text-sm font-medium" style={{ color: "#0F1729" }}>Generating questions...</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>This takes 5–10 seconds</p>
              </div>
            )}
            {mcqData.error && (
              <div className="text-center py-10 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#F85149" }} />
                <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Failed to generate questions.</p>
                <button onClick={mcqData.fetch} className="flex items-center gap-2 text-sm mx-auto px-5 py-2.5 rounded-xl transition-all"
                  style={{ background: "#E5E1D8", color: "#00C2A8" }}>
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}
            {mcqData.content && (() => {
              const questions = robustParseJSON(mcqData.content);
              if (questions) return <MCQQuiz questions={questions} topic={topic.name} />;
              return (
                <div className="p-5 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                  <p className="text-sm mb-3 font-semibold" style={{ color: "#F85149" }}>⚠ Could not parse questions. Raw response:</p>
                  <button onClick={() => { sessionStorage.removeItem(`mk_mcq_${JSON.stringify(apiParams)}`); mcqData.fetch(); }}
                    className="flex items-center gap-1 text-sm mb-4" style={{ color: "#00C2A8" }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "#6B7280" }}>{mcqData.content.slice(0, 500)}</pre>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.2)" }}>
                ⚡
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Quick Revision Flashcards</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>Click each card to reveal the answer</p>
              </div>
            </div>
            {!flashData.content && !flashData.loading && !flashData.error && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="text-4xl mb-4">📇</div>
                <p className="text-base font-medium mb-2" style={{ color: "#0F1729" }}>10 high-yield flashcards for {topic.name}</p>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Covers key facts, mnemonics, gold standards</p>
                <button onClick={flashData.fetch}
                  className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#00C2A8,#0088cc)", color: "#fff" }}>
                  Generate Flashcards
                </button>
              </div>
            )}
            {flashData.loading && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#00C2A8", borderTopColor: "transparent" }} />
                <p className="text-sm font-medium" style={{ color: "#0F1729" }}>Generating flashcards...</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>This takes 5–10 seconds</p>
              </div>
            )}
            {flashData.error && (
              <div className="text-center py-8">
                <button onClick={flashData.fetch} className="flex items-center gap-2 text-sm mx-auto px-5 py-2.5 rounded-xl"
                  style={{ background: "#E5E1D8", color: "#00C2A8" }}>
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            )}
            {flashData.content && (() => {
              const cards = robustParseJSON(flashData.content);
              if (cards) return <FlashCard cards={cards} />;
              return (
                <div className="p-5 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                  <p className="text-sm mb-3 font-semibold" style={{ color: "#F85149" }}>⚠ Could not parse flashcards.</p>
                  <button onClick={() => { sessionStorage.removeItem(`mk_flashcards_${JSON.stringify(apiParams)}`); flashData.fetch(); }}
                    className="flex items-center gap-1 text-sm" style={{ color: "#00C2A8" }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90 shadow-lg"
        style={{ background: "#00C2A8", color: "#F5F3EE", fontSize: "18px" }}>
        ↑
      </button>
    </div>
  );
}
