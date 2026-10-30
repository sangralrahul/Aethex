import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, Clock, BarChart2, ChevronRight } from "lucide-react";
import { getSubjectBySlug } from "@/data/medicalSubjects";
import { CardArt } from "@/components/visual/CardArt";
import { KhHero, KhIcon, KH_HUB, khIcon } from "@/components/MedKnowledge/KhParts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");


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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Subject not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#6D28D9" }}>← Back to Hub</Link>
        </div>
      </div>
    );
  }

  const filtered = subject.topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>
      <KhHero
        compact
        width="w6"
        crumbs={[{ label: "Knowledge Hub", href: `${BASE}${KH_HUB}` }, { label: subject.name }]}
        eyebrow={<>{subject.category}<em>{subject.topics.length} topics</em></>}
        title={<span className="kh-title"><KhIcon slug={subject.slug} color="#c4b5fd" size={26} />{subject.name}</span>}
      >
        <p>{subject.description}</p>
        <ul className="kh-chips">
          <li><b>{subject.topics.filter(t => t.difficulty === "Basic").length}</b> basic</li>
          <li><b>{subject.topics.filter(t => t.difficulty === "Intermediate").length}</b> intermediate</li>
          <li><b>{subject.topics.filter(t => t.difficulty === "Advanced").length}</b> advanced</li>
          <li><b>{subject.topics.reduce((n, t) => n + t.readTime, 0).toLocaleString("en-IN")}</b> minutes of reading</li>
        </ul>
      </KhHero>

      {/* Topics */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${subject.topics.length} topics...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#FFFFFF", border: "1px solid #E6E9EF", color: "#0F1729" }} />
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
              className="kh-topic has-art group rounded-xl border p-5 transition-all duration-200 cursor-pointer"
              style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#6D28D9";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(109,40,217,0.12)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E6E9EF";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
              <CardArt icon={khIcon(subject.slug)} color={subject.color} seed={topic.name.length} />
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-sm leading-tight" style={{ color: "#0F1729" }}>{topic.name}</h3>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#6D28D9" }} />
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
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E6E9EF", color: "#6B7280" }}>{c}</span>
                  ))}
                  {topic.relatedConditions.length > 2 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E6E9EF", color: "#6B7280" }}>+{topic.relatedConditions.length - 2}</span>
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
