import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, ArrowLeft, ChevronRight } from "lucide-react";
import { getDepartmentBySlug } from "@/data/medicalDepartments";
import { BreadcrumbNav } from "@/components/MedKnowledge/BreadcrumbNav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

const severityConfig: Record<string, { bg: string; color: string }> = {
  Mild: { bg: "rgba(35,134,54,0.12)", color: "#238636" },
  Moderate: { bg: "rgba(227,179,65,0.12)", color: "#E3B341" },
  Severe: { bg: "rgba(249,115,22,0.12)", color: "#F97316" },
  Critical: { bg: "rgba(248,81,73,0.12)", color: "#F85149" },
};

export default function DepartmentPage() {
  const params = useParams<{ deptSlug: string }>();
  const dept = getDepartmentBySlug(params.deptSlug || "");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("All");

  if (!dept) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Department not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#00C2A8" }}>← Back to Hub</Link>
        </div>
      </div>
    );
  }

  const filtered = dept.conditions.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.icd10.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "All" || c.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      {/* Hero */}
      <div className="relative border-b overflow-hidden" style={{ borderColor: "#E5E1D8" }}>
        <div className="absolute inset-0" style={{ backgroundImage: `url('${DEPT_BG[dept.slug] ?? FALLBACK_DEPT_BG}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(245,243,238,0.96) 0%, rgba(255,255,255,0.94) 100%)" }} />
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <BreadcrumbNav crumbs={[
            { label: "Study Hub", href: `${BASE}/study-hub` },
            { label: "Knowledge Hub", href: `${BASE}/study-hub/medical-knowledge-hub` },
            { label: "Departments", href: `${BASE}/study-hub/medical-knowledge-hub/departments` },
            { label: dept.name },
          ]} />
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`}
            className="flex items-center gap-2 text-sm mt-4 mb-6 hover:opacity-80" style={{ color: "#6B7280" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Link>
          <div className="flex items-start gap-5">
            <div className="text-5xl">{dept.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#0F1729" }}>{dept.name}</h1>
              <p className="text-base mb-4 leading-relaxed" style={{ color: "#6B7280", maxWidth: 700 }}>{dept.description}</p>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: "#6B7280" }}>
                <span>{dept.conditions.length} conditions</span>
                <span style={{ color: "#238636" }}>{dept.conditions.filter(c => c.severity === "Mild").length} Mild</span>
                <span style={{ color: "#E3B341" }}>{dept.conditions.filter(c => c.severity === "Moderate").length} Moderate</span>
                <span style={{ color: "#F97316" }}>{dept.conditions.filter(c => c.severity === "Severe").length} Severe</span>
                <span style={{ color: "#F85149" }}>{dept.conditions.filter(c => c.severity === "Critical").length} Critical</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${dept.conditions.length} conditions...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#FFFFFF", border: "1px solid #E5E1D8", color: "#0F1729" }} />
          </div>
          <div className="flex gap-2">
            {["All", "Mild", "Moderate", "Severe", "Critical"].map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: severityFilter === s ? (s === "All" ? "#00C2A8" : severityConfig[s]?.bg) : "#E5E1D8",
                  color: severityFilter === s ? (s === "All" ? "#F5F3EE" : severityConfig[s]?.color) : "#6B7280",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm mb-4" style={{ color: "#6B7280" }}>
          {filtered.length} condition{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
          {severityFilter !== "All" && ` · ${severityFilter}`}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(condition => {
            const sev = severityConfig[condition.severity];
            return (
              <Link key={condition.slug} href={`${BASE}/study-hub/medical-knowledge-hub/departments/${dept.slug}/${condition.slug}`}
                className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer"
                style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#00C2A8";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(0,194,168,0.12)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E5E1D8";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#E5E1D8", color: "#00C2A8" }}>{condition.icd10}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color }}>{condition.severity}</span>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight" style={{ color: "#0F1729" }}>{condition.name}</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: "#00C2A8" }} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{condition.description}</p>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: "#6B7280" }}>
            No conditions found for "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
