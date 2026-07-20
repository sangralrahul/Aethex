import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, Clock, BarChart2, ChevronRight, ArrowLeft } from "lucide-react";
import { getSubjectBySlug } from "@/data/medicalSubjects";
import { BreadcrumbNav } from "@/components/MedKnowledge/BreadcrumbNav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  Basic: "#238636",
  Intermediate: "#E3B341",
  Advanced: "#F85149",
};

export default function SubjectPage() {
  const params = useParams<{ subjectSlug: string }>();
  const subject = getSubjectBySlug(params.subjectSlug || "");
  const [search, setSearch] = useState("");

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Subject not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#00C2A8" }}>← Back to Hub</Link>
        </div>
      </div>
    );
  }

  const filtered = subject.topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Hero */}
      <div className="relative border-b overflow-hidden" style={{ borderColor: "#E5E1D8" }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url('${SUBJECT_BG[subject.slug] ?? FALLBACK_BG}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(245,243,238,0.96) 0%, rgba(255,255,255,0.94) 100%)" }} />
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <BreadcrumbNav crumbs={[
            { label: "Study Hub", href: `${BASE}/study-hub` },
            { label: "Medical Knowledge Hub", href: `${BASE}/study-hub/medical-knowledge-hub` },
            { label: subject.name },
          ]} />
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`}
            className="flex items-center gap-2 text-sm mt-4 mb-6 transition-all hover:opacity-80" style={{ color: "#6B7280" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <div className="flex items-start gap-5">
            <div className="text-5xl">{subject.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold" style={{ color: "#0F1729" }}>{subject.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.3)", color: "#00C2A8" }}>
                  {subject.category}
                </span>
              </div>
              <p className="text-base leading-relaxed mb-4" style={{ color: "#6B7280", maxWidth: 700 }}>{subject.description}</p>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: "#6B7280" }}>
                <span className="flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />{subject.topics.length} Topics</span>
                <span className="flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />{subject.topics.filter(t => t.difficulty === "Basic").length} Basic</span>
                <span className="flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />{subject.topics.filter(t => t.difficulty === "Intermediate").length} Intermediate</span>
                <span className="flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />{subject.topics.filter(t => t.difficulty === "Advanced").length} Advanced</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${subject.topics.length} topics...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", color: "#0F1729" }} />
        </div>

        {/* Topic count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: "#6B7280" }}>
            {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(topic => (
            <Link key={topic.slug} href={`${BASE}/study-hub/medical-knowledge-hub/subjects/${subject.slug}/${topic.slug}`}
              className="group rounded-xl border p-5 transition-all duration-200 cursor-pointer"
              style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#00C2A8";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,194,168,0.12)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E1D8";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-sm leading-tight" style={{ color: "#0F1729" }}>{topic.name}</h3>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#00C2A8" }} />
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1" style={{ color: "#6B7280" }}>
                  <Clock className="w-3 h-3" /> {topic.readTime} min
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" style={{ color: diffColor[topic.difficulty] }} />
                  <span style={{ color: diffColor[topic.difficulty] }}>{topic.difficulty}</span>
                </span>
              </div>
              {topic.relatedConditions && topic.relatedConditions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {topic.relatedConditions.slice(0, 2).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E5E1D8", color: "#6B7280" }}>{c}</span>
                  ))}
                  {topic.relatedConditions.length > 2 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E5E1D8", color: "#6B7280" }}>+{topic.relatedConditions.length - 2}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: "#6B7280" }}>
            No topics found for "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
