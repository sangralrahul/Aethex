import { useState, useEffect, useRef, useCallback } from "react";
import { study, type Bookmark as StudyBookmark } from "@/lib/study/progress";
import { NoteButton } from "@/components/study/StudyBits";
import { Link, useParams, useSearch } from "wouter";
import {
  ArrowLeft, Clock, BarChart2, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw, Stethoscope, Brain, Zap, BookOpen, ClipboardCheck, Layers,
} from "lucide-react";
import { getTopicBySlug } from "@/data/medicalSubjects";
import { KhHero, KH_HUB } from "@/components/MedKnowledge/KhParts";
import { SectionLoader } from "@/components/MedKnowledge/SectionLoader";
import { MCQQuiz } from "@/components/MedKnowledge/MCQQuiz";
import { FlashCard } from "@/components/MedKnowledge/FlashCard";
import { DiagramCarousel } from "@/components/MedKnowledge/DiagramCarousel";
import { RichContent } from "@/components/MedKnowledge/RichContent";
import { invokeAi } from "@/lib/ai-functions";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const TABS = [["overview", "Overview and diagrams", BookOpen], ["exam", "Exam questions", ClipboardCheck], ["flashcards", "Flashcards", Layers]] as const;


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
      const { data, error } = await invokeAi("cadus", {
        body: { action: "med-knowledge", section, ...params },
      });
      if (error || !data?.content) throw new Error(error?.message || "AI error");
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
    <div ref={ref} className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E6E9EF", background: "rgba(109,40,217,0.03)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(109,40,217,0.1)" }}>
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
            <button onClick={fetchContent} className="flex items-center gap-1 text-sm" style={{ color: "#6D28D9" }}>
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
  const bmItem = useRef<Omit<StudyBookmark, "at" | "updatedAt"> | null>(null);
  const [saved, setSaved] = useState(() => {
    const list = JSON.parse(localStorage.getItem("aethex_study_list") || "[]");
    return study.isBookmarked(`topic:${params.subjectSlug}/${params.topicSlug}`) || list.includes(`${params.subjectSlug}/${params.topicSlug}`);
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
    // update 77: the same save is a bookmark in My library
    if (bmItem.current && study.isBookmarked(bmItem.current.key) === saved) study.toggleBookmark(bmItem.current);
    setSaved(!saved);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Topic not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#6D28D9" }}>← Back to Hub</Link>
        </div>
      </div>
    );
  }

  const { subject, topic } = result;
  bmItem.current = { key: `topic:${params.subjectSlug}/${params.topicSlug}`, kind: "topic", title: topic.name, subject: subject.name, href: `${KH_HUB}/subjects/${subject.slug}/${topic.slug}` };

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>
      <KhHero
        compact
        width="w5"
        crumbs={[{ label: "Knowledge Hub", href: `${BASE}${KH_HUB}` }, { label: subject.name, href: `${BASE}${KH_HUB}/subjects/${subject.slug}` }, { label: topic.name }]}
        eyebrow={<>{subject.name}<em>{topic.difficulty} · {topic.readTime} min read</em></>}
        title={topic.name}
      >
        <div className="kh-hero-acts"><button type="button" onClick={handleSave} className={`kh-save${saved ? " on" : ""}`}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{saved ? "Saved" : "Save"}</button>{bmItem.current && <NoteButton item={bmItem.current} />}<Link href="/my-library?tab=bookmarks" className="kh-save">My library</Link></div>
      </KhHero>
      <div className="kh-tabbar w5"><div className="ax-wrap" role="tablist">
        {TABS.map(([t, label, I]) => (
          <button key={t} type="button" role="tab" aria-selected={activeTab === t} className={activeTab === t ? "on" : ""} onClick={() => setActiveTab(t as any)}><I size={16} /> {label}</button>
        ))}
      </div></div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Overview */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E6E9EF", background: "rgba(109,40,217,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(109,40,217,0.1)" }}>
                  <Brain className="w-4 h-4" style={{ color: "#6D28D9" }} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Overview</h2>
                  <p className="text-xs" style={{ color: "#6B7280" }}>Written with Cadus for exam revision</p>
                </div>
              </div>
              <div className="px-6 py-5">
                {overview.loading && <SectionLoader lines={8} />}
                {overview.error && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" style={{ color: "#F85149" }} />
                    <span className="text-sm" style={{ color: "#6B7280" }}>Could not load overview.</span>
                    <button onClick={overview.fetch} className="flex items-center gap-1 text-sm" style={{ color: "#6D28D9" }}>
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                )}
                {overview.content && <RichContent content={overview.content} lineByLine />}
              </div>
            </div>

            {/* Diagrams */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E6E9EF", background: "rgba(109,40,217,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(109,40,217,0.1)" }}>
                  <BarChart2 className="w-4 h-4" style={{ color: "#6D28D9" }} />
                </div>
                <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Medical Diagrams</h2>
              </div>
              <div className="px-6 py-5">
                <DiagramCarousel topicSlug={topic.slug} subjectSlug={subject.slug} />
              </div>
            </div>

            {/* Key Concepts */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E6E9EF", background: "rgba(109,40,217,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(109,40,217,0.1)" }}>
                  <Zap className="w-4 h-4" style={{ color: "#6D28D9" }} />
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
                    <button onClick={keyConcepts.fetch} className="flex items-center gap-1 text-sm" style={{ color: "#6D28D9" }}><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
                  </div>
                )}
                {keyConcepts.content && <RichContent content={keyConcepts.content} lineByLine />}
              </div>
            </div>

            {/* Clinical Relevance */}
            <LazySection section="clinical_relevance" params={apiParams} title="Clinical Relevance & Applied"
              icon={<Stethoscope className="w-4 h-4" style={{ color: "#6D28D9" }} />} />

            {/* Related Conditions */}
            {topic.relatedConditions && topic.relatedConditions.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: "#E6E9EF" }}>
                  <h2 className="font-bold text-base" style={{ color: "#0F1729" }}>Related Conditions</h2>
                </div>
                <div className="px-6 py-5">
                  <div className="flex flex-wrap gap-3">
                    {topic.relatedConditions.map(c => (
                      <div key={c} className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:border-teal-500/50"
                        style={{ background: "#E6E9EF", color: "#0F1729", border: "1px solid #30363D" }}>
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
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Exam Corner — MCQ Practice</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>NEET-PG / USMLE style questions with explanations</p>
              </div>
            </div>
            {!mcqData.content && !mcqData.loading && !mcqData.error && (
              <div className="text-center py-12 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
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
                          background: mcqCount === n ? "linear-gradient(135deg,#6D28D9,#0088cc)" : "#E6E9EF",
                          color: mcqCount === n ? "#fff" : "#6B7280",
                          border: `1px solid ${mcqCount === n ? "#6D28D9" : "#30363D"}`,
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={mcqData.fetch}
                  className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#6D28D9,#0088cc)", color: "#fff" }}>
                  Generate {mcqCount} MCQs with AI
                </button>
              </div>
            )}
            {mcqData.loading && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#6D28D9", borderTopColor: "transparent" }} />
                <p className="text-sm font-medium" style={{ color: "#0F1729" }}>Generating questions...</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>This takes 5–10 seconds</p>
              </div>
            )}
            {mcqData.error && (
              <div className="text-center py-10 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
                <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#F85149" }} />
                <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Failed to generate questions.</p>
                <button onClick={mcqData.fetch} className="flex items-center gap-2 text-sm mx-auto px-5 py-2.5 rounded-xl transition-all"
                  style={{ background: "#E6E9EF", color: "#6D28D9" }}>
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}
            {mcqData.content && (() => {
              const questions = robustParseJSON(mcqData.content);
              if (questions) return <MCQQuiz questions={questions} topic={topic.name} subject={subject.name} />;
              return (
                <div className="p-5 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
                  <p className="text-sm mb-3 font-semibold" style={{ color: "#F85149" }}>⚠ Could not parse questions. Raw response:</p>
                  <button onClick={() => { sessionStorage.removeItem(`mk_mcq_${JSON.stringify(apiParams)}`); mcqData.fetch(); }}
                    className="flex items-center gap-1 text-sm mb-4" style={{ color: "#6D28D9" }}>
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(109,40,217,0.1)", border: "1px solid rgba(109,40,217,0.2)" }}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Quick Revision Flashcards</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>Click each card to reveal the answer</p>
              </div>
            </div>
            {!flashData.content && !flashData.loading && !flashData.error && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
                <div className="text-4xl mb-4">📇</div>
                <p className="text-base font-medium mb-2" style={{ color: "#0F1729" }}>10 high-yield flashcards for {topic.name}</p>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Covers key facts, mnemonics, gold standards</p>
                <button onClick={flashData.fetch}
                  className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#6D28D9,#0088cc)", color: "#fff" }}>
                  Generate Flashcards
                </button>
              </div>
            )}
            {flashData.loading && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#6D28D9", borderTopColor: "transparent" }} />
                <p className="text-sm font-medium" style={{ color: "#0F1729" }}>Generating flashcards...</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>This takes 5–10 seconds</p>
              </div>
            )}
            {flashData.error && (
              <div className="text-center py-8">
                <button onClick={flashData.fetch} className="flex items-center gap-2 text-sm mx-auto px-5 py-2.5 rounded-xl"
                  style={{ background: "#E6E9EF", color: "#6D28D9" }}>
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            )}
            {flashData.content && (() => {
              const cards = robustParseJSON(flashData.content);
              if (cards) return <FlashCard cards={cards} />;
              return (
                <div className="p-5 rounded-xl border" style={{ borderColor: "#E6E9EF", background: "#FFFFFF" }}>
                  <p className="text-sm mb-3 font-semibold" style={{ color: "#F85149" }}>⚠ Could not parse flashcards.</p>
                  <button onClick={() => { sessionStorage.removeItem(`mk_flashcards_${JSON.stringify(apiParams)}`); flashData.fetch(); }}
                    className="flex items-center gap-1 text-sm" style={{ color: "#6D28D9" }}>
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
        style={{ background: "#6D28D9", color: "#F7F8FA", fontSize: "18px" }}>
        ↑
      </button>
    </div>
  );
}
