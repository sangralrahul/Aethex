import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useSearch } from "wouter";
import { ArrowLeft, Bookmark, BookmarkCheck, AlertCircle, RefreshCw, Stethoscope, FlaskConical, Pill, Shield, Users, BookOpen, FileText, Brain, Zap } from "lucide-react";
import { getConditionBySlug } from "@/data/medicalDepartments";
import { BreadcrumbNav } from "@/components/MedKnowledge/BreadcrumbNav";
import { SectionLoader } from "@/components/MedKnowledge/SectionLoader";
import { MCQQuiz } from "@/components/MedKnowledge/MCQQuiz";
import { FlashCard } from "@/components/MedKnowledge/FlashCard";
import { DiagramCarousel } from "@/components/MedKnowledge/DiagramCarousel";
import { RichContent } from "@/components/MedKnowledge/RichContent";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = BASE.replace(/\/[^/]*$/, "");

const severityConfig: Record<string, { bg: string; color: string }> = {
  Mild:     { bg: "rgba(35,134,54,0.12)",   color: "#238636" },
  Moderate: { bg: "rgba(227,179,65,0.12)",  color: "#E3B341" },
  Severe:   { bg: "rgba(249,115,22,0.12)",  color: "#F97316" },
  Critical: { bg: "rgba(248,81,73,0.12)",   color: "#F85149" },
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
    const cacheKey = `mkc_${section}_${JSON.stringify(params)}`;
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
    const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
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

function SectionBlock({ title, icon, content, loading, error, onRetry }: {
  title: string; icon: React.ReactNode; content: string | null;
  loading: boolean; error: boolean; onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
      <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E5E1D8", background: "rgba(0,194,168,0.03)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8" }}>
          {icon}
        </div>
        <h3 className="font-bold text-base" style={{ color: "#0F1729" }}>{title}</h3>
      </div>
      <div className="px-6 py-5">
        {loading && <SectionLoader lines={6} />}
        {error && (
          <div className="flex items-center gap-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#F85149" }} />
            <span className="text-sm" style={{ color: "#6B7280" }}>Content unavailable.</span>
            <button onClick={onRetry} className="flex items-center gap-1 text-sm" style={{ color: "#00C2A8" }}>
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}
        {content && !loading && <RichContent content={content} lineByLine />}
      </div>
    </div>
  );
}

function LazyBlock({ section, params, title, icon }: {
  section: string; params: Record<string, string>; title: string; icon: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<HTMLElement>);
  const { content, loading, error, fetch: fetchContent } = useMedContent(section, params, false);

  useEffect(() => { if (visible && !content && !loading) fetchContent(); }, [visible]);

  return (
    <div ref={ref}>
      <SectionBlock title={title} icon={icon} content={content} loading={loading} error={error} onRetry={fetchContent} />
    </div>
  );
}

function BarChart2Icon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export default function ConditionPage() {
  const params = useParams<{ deptSlug: string; conditionSlug: string }>();
  const search = useSearch();
  const result = getConditionBySlug(params.deptSlug || "", params.conditionSlug || "");
  const urlTab = new URLSearchParams(search).get("tab") as "overview" | "management" | "exam" | "flashcards" | null;
  const [activeTab, setActiveTab] = useState<"overview" | "management" | "exam" | "flashcards">(urlTab || "overview");
  const [saved, setSaved] = useState(() => {
    const list = JSON.parse(localStorage.getItem("aethex_study_list") || "[]");
    return list.includes(`${params.deptSlug}/${params.conditionSlug}`);
  });
  const [mcqCount, setMcqCount] = useState(8);

  const apiParams = result ? { conditionName: result.condition.name, department: result.dept.name } : {};
  const mcqApiParams = result ? { ...apiParams, mcqCount: String(mcqCount) } : {};
  const overview        = useMedContent("overview", apiParams, !!result);
  const etiology        = useMedContent("etiology", apiParams, !!result);
  const clinicalFeatures= useMedContent("clinical_features", apiParams, !!result);
  const pathophysiology = useMedContent("pathophysiology", apiParams, false);
  const investigations  = useMedContent("investigations", apiParams, false);
  const diagnosis       = useMedContent("diagnosis", apiParams, false);
  const treatment       = useMedContent("treatment", apiParams, false);
  const prognosis       = useMedContent("prognosis", apiParams, false);
  const prevention      = useMedContent("prevention", apiParams, false);
  const specialPop      = useMedContent("special_populations", apiParams, false);
  const mcqData         = useMedContent("mcq", mcqApiParams, false);
  const flashData       = useMedContent("flashcards", apiParams, false);

  const handleSave = () => {
    const list = JSON.parse(localStorage.getItem("aethex_study_list") || "[]");
    const key = `${params.deptSlug}/${params.conditionSlug}`;
    const updated = saved ? list.filter((x: string) => x !== key) : [...list, key];
    localStorage.setItem("aethex_study_list", JSON.stringify(updated));
    setSaved(!saved);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Condition not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#00C2A8" }}>← Back to Hub</Link>
        </div>
      </div>
    );
  }

  const { dept, condition } = result;
  const sev = severityConfig[condition.severity] ?? severityConfig.Moderate;

  const DEPT_BG: Record<string, string> = {
    "cardiology":                "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1400&q=80",
    "neurology":                 "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1400&q=80",
    "orthopedics-dept":          "https://images.unsplash.com/photo-1530026405186-ed1f139313f4?w=1400&q=80",
    "ophthalmology-dept":        "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1400&q=80",
    "pulmonology":               "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1400&q=80",
    "gastroenterology":          "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1400&q=80",
    "nephrology":                "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1400&q=80",
    "endocrinology":             "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1400&q=80",
    "oncology":                  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1400&q=80",
    "hematology":                "https://images.unsplash.com/photo-1588776814546-1ffbb172f276?w=1400&q=80",
    "rheumatology":              "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1400&q=80",
    "infectious-diseases":       "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1400&q=80",
    "psychiatry-dept":           "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1400&q=80",
    "obstetrics-gynecology-dept":"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1400&q=80",
    "urology":                   "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1400&q=80",
    "ent-dept":                  "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1400&q=80",
    "anesthesiology-dept":       "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1400&q=80",
    "emergency-medicine-dept":   "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1400&q=80",
    "geriatrics":                "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&q=80",
    "immunology":                "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1400&q=80",
    "pediatrics-dept":           "https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=1400&q=80",
    "clinical-pharmacology":     "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=1400&q=80",
  };
  const FALLBACK_DEPT_BG = "https://images.unsplash.com/photo-1516069677018-378515003435?w=1400&q=80";

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Hero */}
      <div className="relative border-b overflow-hidden" style={{ borderColor: "#E5E1D8" }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url('${DEPT_BG[dept.slug] ?? FALLBACK_DEPT_BG}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(245,243,238,0.97) 0%, rgba(255,255,255,0.95) 60%, ${dept.color ?? "#00C2A8"}10 100%)` }} />
        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
          <BreadcrumbNav crumbs={[
            { label: "Study Hub", href: `${BASE}/study-hub` },
            { label: "Knowledge Hub", href: `${BASE}/study-hub/medical-knowledge-hub` },
            { label: dept.name, href: `${BASE}/study-hub/medical-knowledge-hub/departments/${dept.slug}` },
            { label: condition.name },
          ]} />
          <Link href={`${BASE}/study-hub/medical-knowledge-hub/departments/${dept.slug}`}
            className="flex items-center gap-2 text-sm mt-4 mb-5 hover:opacity-80 transition-opacity" style={{ color: "#6B7280" }}>
            <ArrowLeft className="w-4 h-4" /> Back to {dept.name}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-mono px-2.5 py-1 rounded font-bold" style={{ background: "#E5E1D8", color: "#00C2A8" }}>{condition.icd10}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8", border: "1px solid rgba(0,194,168,0.2)" }}>{dept.icon} {dept.name}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: sev.bg, color: sev.color }}>{condition.severity}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#0F1729", letterSpacing: "-0.01em" }}>{condition.name}</h1>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280", maxWidth: 600 }}>{condition.description}</p>
            </div>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0"
              style={{ background: saved ? "rgba(0,194,168,0.1)" : "#E5E1D8", color: saved ? "#00C2A8" : "#6B7280", border: `1px solid ${saved ? "#00C2A8" : "#E5E1D8"}` }}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mt-6 border-b" style={{ borderColor: "#E5E1D8" }}>
            {[
              ["overview", "📖 Overview"],
              ["management", "💊 Management"],
              ["exam", "🎯 MCQ Practice"],
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
            <SectionBlock title="Overview & Epidemiology" icon={<Brain className="w-4 h-4" />}
              content={overview.content} loading={overview.loading} error={overview.error} onRetry={overview.fetch} />

            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
              <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#E5E1D8", background: "rgba(0,194,168,0.03)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8" }}>📊</div>
                <h3 className="font-bold text-base" style={{ color: "#0F1729" }}>Medical Diagrams</h3>
              </div>
              <div className="px-6 py-5">
                <DiagramCarousel conditionSlug={condition.slug} deptSlug={dept.slug} />
              </div>
            </div>

            <SectionBlock title="Etiology & Risk Factors" icon={<AlertCircle className="w-4 h-4" />}
              content={etiology.content} loading={etiology.loading} error={etiology.error} onRetry={etiology.fetch} />

            <SectionBlock title="Clinical Features" icon={<Stethoscope className="w-4 h-4" />}
              content={clinicalFeatures.content} loading={clinicalFeatures.loading} error={clinicalFeatures.error} onRetry={clinicalFeatures.fetch} />

            <LazyBlock section="pathophysiology" params={apiParams} title="Pathophysiology" icon={<FlaskConical className="w-4 h-4" />} />
            <LazyBlock section="investigations" params={apiParams} title="Investigations" icon={<FileText className="w-4 h-4" />} />
            <LazyBlock section="diagnosis" params={apiParams} title="Diagnosis & Diagnostic Criteria" icon={<BookOpen className="w-4 h-4" />} />
          </div>
        )}

        {activeTab === "management" && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Complete Management Protocol</h2>
            <SectionBlock title="Treatment & Management" icon={<Pill className="w-4 h-4" />}
              content={treatment.content} loading={treatment.loading} error={treatment.error} onRetry={treatment.fetch} />
            <SectionBlock title="Prognosis & Complications" icon={<BarChart2Icon />}
              content={prognosis.content} loading={prognosis.loading} error={prognosis.error} onRetry={prognosis.fetch} />
            <SectionBlock title="Prevention" icon={<Shield className="w-4 h-4" />}
              content={prevention.content} loading={prevention.loading} error={prevention.error} onRetry={prevention.fetch} />
            <SectionBlock title="Special Populations" icon={<Users className="w-4 h-4" />}
              content={specialPop.content} loading={specialPop.loading} error={specialPop.error} onRetry={specialPop.fetch} />
          </div>
        )}

        {activeTab === "exam" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)" }}>🎯</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Exam Corner — MCQ Practice</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>NEET-PG / USMLE Style with Clinical Vignettes</p>
              </div>
            </div>
            {!mcqData.content && !mcqData.loading && !mcqData.error && (
              <div className="text-center py-12 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="text-4xl mb-4">🧠</div>
                <p className="text-base font-medium mb-2" style={{ color: "#0F1729" }}>Test your knowledge on {condition.name}</p>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>NEET-PG / USMLE style clinical vignette questions</p>
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
                <button onClick={mcqData.fetch} className="px-8 py-3 rounded-xl font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all"
                  style={{ background: "linear-gradient(135deg,#00C2A8,#0088cc)", color: "#fff" }}>
                  Generate {mcqCount} MCQs with AI
                </button>
              </div>
            )}
            {mcqData.loading && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#00C2A8", borderTopColor: "transparent" }} />
                <p className="text-sm font-medium" style={{ color: "#0F1729" }}>Generating clinical MCQs...</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>This takes 5–10 seconds</p>
              </div>
            )}
            {mcqData.error && (
              <div className="text-center py-10 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#F85149" }} />
                <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Failed to generate questions.</p>
                <button onClick={mcqData.fetch} className="flex items-center gap-2 text-sm mx-auto px-5 py-2.5 rounded-xl"
                  style={{ background: "#E5E1D8", color: "#00C2A8" }}>
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}
            {mcqData.content && (() => {
              const questions = robustParseJSON(mcqData.content);
              if (questions) return <MCQQuiz questions={questions} topic={condition.name} />;
              return (
                <div className="p-5 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                  <p className="text-sm mb-3 font-semibold" style={{ color: "#F85149" }}>⚠ Could not parse questions.</p>
                  <button onClick={() => { sessionStorage.removeItem(`mkc_mcq_${JSON.stringify(apiParams)}`); mcqData.fetch(); }}
                    className="flex items-center gap-1 text-sm mb-3" style={{ color: "#00C2A8" }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.2)" }}>⚡</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#0F1729" }}>Quick Revision Flashcards</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>Key facts, DOC, gold standard, mnemonics</p>
              </div>
            </div>
            {!flashData.content && !flashData.loading && !flashData.error && (
              <div className="text-center py-14 rounded-xl border" style={{ borderColor: "#E5E1D8", background: "#FFFFFF" }}>
                <div className="text-4xl mb-4">📇</div>
                <p className="text-base font-medium mb-2" style={{ color: "#0F1729" }}>High-yield flashcards for {condition.name}</p>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Covers drug of choice, gold standards, mnemonics</p>
                <button onClick={flashData.fetch} className="px-8 py-3 rounded-xl font-semibold text-sm hover:opacity-90 hover:scale-105 transition-all"
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
                  <button onClick={() => { sessionStorage.removeItem(`mkc_flashcards_${JSON.stringify(apiParams)}`); flashData.fetch(); }}
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
