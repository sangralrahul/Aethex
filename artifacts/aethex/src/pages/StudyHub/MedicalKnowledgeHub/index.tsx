import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, BookOpen, Building2, ArrowRight, Zap, Brain, FlaskConical, Stethoscope, ChevronRight } from "lucide-react";
import { medicalSubjects } from "@/data/medicalSubjects";
import { medicalDepartments } from "@/data/medicalDepartments";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function HubSearchResult({ label, category, href }: { label: string; category: string; href: string }) {
  return (
    <Link href={href}
      className="flex items-center justify-between px-4 py-3 transition-all hover:bg-white/5 border-b"
      style={{ borderColor: "#E5E1D8" }}>
      <div>
        <span className="text-sm font-medium" style={{ color: "#0F1729" }}>{label}</span>
        <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8" }}>{category}</span>
      </div>
      <ChevronRight className="w-4 h-4" style={{ color: "#6B7280" }} />
    </Link>
  );
}

export default function MedicalKnowledgeHub() {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: { label: string; category: string; href: string }[] = [];

    medicalSubjects.forEach(s => {
      if (s.name.toLowerCase().includes(q)) {
        results.push({ label: s.name, category: "Subject", href: `${BASE}/study-hub/medical-knowledge-hub/subjects/${s.slug}` });
      }
      s.topics.forEach(t => {
        if (t.name.toLowerCase().includes(q)) {
          results.push({ label: t.name, category: s.name, href: `${BASE}/study-hub/medical-knowledge-hub/subjects/${s.slug}/${t.slug}` });
        }
      });
    });

    medicalDepartments.forEach(d => {
      if (d.name.toLowerCase().includes(q)) {
        results.push({ label: d.name, category: "Department", href: `${BASE}/study-hub/medical-knowledge-hub/departments/${d.slug}` });
      }
      d.conditions.forEach(c => {
        if (c.name.toLowerCase().includes(q)) {
          results.push({ label: c.name, category: d.name, href: `${BASE}/study-hub/medical-knowledge-hub/departments/${d.slug}/${c.slug}` });
        }
      });
    });

    return results.slice(0, 8);
  }, [query]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background photo — medical library / anatomy */}
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(245,243,238,0.95) 0%, rgba(255,255,255,0.92) 50%, rgba(245,243,238,0.95) 100%)" }} />
        {/* Teal ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(ellipse at 60% 50%, rgba(0,194,168,0.08) 0%, transparent 70%)",
        }} />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-semibold" style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.3)", color: "#00C2A8" }}>
            <Zap className="w-3.5 h-3.5" /> AI-Powered Medical Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: "#0F1729" }}>
            Medical Knowledge Hub
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto" style={{ color: "#6B7280", lineHeight: 1.7 }}>
            The most complete medical reference ever built. Every subject. Every department. Every condition. AI-generated encyclopedic content for MBBS, MD and clinical practice.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#6B7280" }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search subjects, topics, departments, conditions..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-base outline-none transition-all"
                style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", color: "#0F1729", boxShadow: "0 0 0 0 transparent" }}
                onFocus={e => (e.target.style.border = "1px solid #00C2A8")}
                onBlur={e => (e.target.style.border = "1px solid #E5E1D8")}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-xl" style={{ background: "#FFFFFF", border: "1px solid #E5E1D8" }}>
                {searchResults.map((r, i) => <HubSearchResult key={i} {...r} />)}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              ["20+", "Subjects"],
              ["35+", "Departments"],
              ["500+", "Topics"],
              ["1000+", "Conditions"],
              ["AI-Powered", "Content"],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold" style={{ color: "#00C2A8" }}>{num}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section A: Medical Subjects */}
      <div id="subjects-section" className="relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=60')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.04
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(180deg, rgba(245,243,238,0) 0%, rgba(245,243,238,0.6) 40%, rgba(245,243,238,0.8) 100%)"
        }} />
      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#0F1729" }}>Medical Subjects</h2>
            <p style={{ color: "#6B7280" }}>Core pre-clinical and clinical subject areas</p>
          </div>
          <button
            onClick={() => document.getElementById("subjects-section")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.25)", color: "#00C2A8", cursor: "pointer" }}>
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {medicalSubjects.map(subject => (
            <Link key={subject.id} href={`${BASE}/study-hub/medical-knowledge-hub/subjects/${subject.slug}`}
              className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer"
              style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#00C2A8";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,194,168,0.15)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E1D8";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
              <div className="text-3xl mb-3">{subject.icon}</div>
              <div className="text-sm font-semibold mb-1.5 leading-tight" style={{ color: "#0F1729" }}>{subject.name}</div>
              <div className="text-xs mb-2" style={{ color: "#6B7280" }}>{subject.topics.length} topics</div>
              <div className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8" }}>
                {subject.category}
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>

      {/* Section B: Clinical Departments */}
      <div id="departments-section" className="relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=60')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.04
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(180deg, rgba(245,243,238,0.7) 0%, rgba(245,243,238,0.5) 50%, rgba(245,243,238,0.8) 100%)"
        }} />
      <div className="max-w-7xl mx-auto px-4 pb-16 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: "#0F1729" }}>Clinical Departments</h2>
            <p style={{ color: "#6B7280" }}>Complete condition libraries for all specialties</p>
          </div>
          <button
            onClick={() => document.getElementById("departments-section")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.25)", color: "#00C2A8", cursor: "pointer" }}>
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {medicalDepartments.map(dept => (
            <Link key={dept.id} href={`${BASE}/study-hub/medical-knowledge-hub/departments/${dept.slug}`}
              className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer flex items-center gap-4"
              style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = dept.color;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${dept.color}20`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E1D8";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
              <div className="text-3xl shrink-0">{dept.icon}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#0F1729" }}>{dept.name}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{dept.conditions.length} conditions</div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#00C2A8" }} />
            </Link>
          ))}
        </div>
      </div>
      </div>

      {/* Features */}
      <div className="relative border-t" style={{ borderColor: "#E5E1D8" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=60')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.04
        }} />
        <div className="max-w-5xl mx-auto px-4 py-16 relative z-10">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: "#0F1729" }}>Everything a Medical Student Needs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Brain className="w-6 h-6" />, title: "AI-Generated Content", desc: "Claude AI writes comprehensive, exam-focused content for every topic and condition." },
              { icon: <FlaskConical className="w-6 h-6" />, title: "SVG Medical Diagrams", desc: "Anatomical and pathological diagrams built directly in code — no external images." },
              { icon: <Stethoscope className="w-6 h-6" />, title: "MCQ Exam Practice", desc: "10 NEET-PG/USMLE style questions per topic with explanations." },
              { icon: <BookOpen className="w-6 h-6" />, title: "Quick Revision Flashcards", desc: "Flip card revision for every topic and condition — exam-ready in minutes." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border p-5" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(0,194,168,0.1)", color: "#00C2A8" }}>
                  {icon}
                </div>
                <div className="font-semibold mb-2 text-sm" style={{ color: "#0F1729" }}>{title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
