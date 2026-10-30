import { useState } from "react";
import { Link, useParams } from "wouter";
import { Search, ChevronRight } from "lucide-react";
import { getDepartmentBySlug } from "@/data/medicalDepartments";
import { CardArt } from "@/components/visual/CardArt";
import { KhHero, KhIcon, KH_HUB, khIcon } from "@/components/MedKnowledge/KhParts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");


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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F8FA" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F1729" }}>Department not found</h1>
          <Link href={`${BASE}/study-hub/medical-knowledge-hub`} style={{ color: "#6D28D9" }}>← Back to Hub</Link>
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
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>
      <KhHero
        compact
        width="w6"
        crumbs={[{ label: "Knowledge Hub", href: `${BASE}${KH_HUB}` }, { label: "Departments", href: `${BASE}${KH_HUB}/departments` }, { label: dept.name }]}
        eyebrow={<>Clinical department<em>{dept.conditions.length} conditions</em></>}
        title={<span className="kh-title"><KhIcon slug={dept.slug} color="#c4b5fd" size={26} />{dept.name}</span>}
      >
        <p>{dept.description}</p>
        <ul className="kh-chips">
          {(["Mild", "Moderate", "Severe", "Critical"] as const).map((sv) => <li key={sv}><i style={{ background: severityConfig[sv]!.color }} /><b>{dept.conditions.filter(c => c.severity === sv).length}</b> {sv.toLowerCase()}</li>)}
        </ul>
      </KhHero>

      {/* Conditions */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${dept.conditions.length} conditions...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#FFFFFF", border: "1px solid #E6E9EF", color: "#0F1729" }} />
          </div>
          <div className="flex gap-2">
            {["All", "Mild", "Moderate", "Severe", "Critical"].map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: severityFilter === s ? (s === "All" ? "#6D28D9" : severityConfig[s]?.bg) : "#E6E9EF",
                  color: severityFilter === s ? (s === "All" ? "#F7F8FA" : severityConfig[s]?.color) : "#6B7280",
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
                className="kh-topic has-art group rounded-xl border p-4 transition-all duration-200 cursor-pointer"
                style={{ background: "#FFFFFF", borderColor: "#E6E9EF" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#6D28D9";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(109,40,217,0.12)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#E6E9EF";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}>
                <CardArt icon={khIcon(dept.slug)} color={dept.color} seed={condition.name.length} />
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "#E6E9EF", color: "#6D28D9" }}>{condition.icd10}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color }}>{condition.severity}</span>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight" style={{ color: "#0F1729" }}>{condition.name}</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: "#6D28D9" }} />
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
