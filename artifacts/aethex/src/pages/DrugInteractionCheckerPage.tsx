import { useState, useRef, KeyboardEvent } from "react";
import { PageHero } from "@/components/PageHero";
import { Link } from "wouter";
import {
  Pill, X, AlertTriangle, CheckCircle2, Info, ChevronLeft,
  ChevronRight, Sparkles, Search, Plus, Shield, AlertCircle,
  BookOpen, TriangleAlert,
} from "lucide-react";
import { checkInteractions, type DrugPair, type Severity } from "@/data/drugInteractions";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
const MAX_DRUGS = 5;

const SEVERITY_CONFIG: Record<Severity, {
  label: string; color: string; bg: string; border: string;
  icon: React.ElementType; darkColor: string;
}> = {
  major: {
    label: "Major", color: "#D70015", bg: "rgba(255,59,48,0.07)",
    border: "rgba(255,59,48,0.25)", icon: AlertTriangle, darkColor: "#FF3B30",
  },
  moderate: {
    label: "Moderate", color: "#C45000", bg: "rgba(255,149,0,0.07)",
    border: "rgba(255,149,0,0.25)", icon: AlertCircle, darkColor: "#FF9500",
  },
  minor: {
    label: "Minor", color: "#856404", bg: "rgba(255,214,10,0.07)",
    border: "rgba(255,204,0,0.3)", icon: Info, darkColor: "#FFD60A",
  },
  none: {
    label: "No Interaction", color: "#248A3D", bg: "rgba(52,199,89,0.07)",
    border: "rgba(52,199,89,0.25)", icon: CheckCircle2, darkColor: "#34C759",
  },
};

const COMMON_DRUGS = [
  "Warfarin", "Aspirin", "Metformin", "Amoxicillin", "Atorvastatin",
  "Amlodipine", "Metoprolol", "Omeprazole", "Ciprofloxacin", "Digoxin",
  "Lithium", "Ibuprofen", "Fluconazole", "Metronidazole", "Sildenafil",
  "SSRIs", "Tramadol", "Clopidogrel", "Clarithromycin", "Carbamazepine",
type AiInteraction = {
  drug1: string;
  drug2: string;
  severity: Severity;
  mechanism?: string;
  clinical_effect?: string;
  management?: string;
  onset?: string;
};
type AiReport = {
  overall_risk?: "low" | "moderate" | "high";
  summary?: string;
  interactions?: AiInteraction[];
  monitoring?: string[];
  alternatives?: string[];
  patient_counseling?: string[];
};


function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function InteractionCard({ pair }: { pair: DrugPair }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[pair.interaction.severity];
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <button
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: cfg.color + "18" }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold" style={{ color: "#1C1C1E" }}>
                {pair.drug1}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(60,60,67,0.1)", color: "#636366" }}>
                + {pair.drug2}
              </span>
              <SeverityBadge severity={pair.interaction.severity} />
            </div>
            <p className="text-xs leading-snug" style={{ color: "#3A3A3C" }}>
              {pair.interaction.description}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 mt-1 transition-transform"
          style={{ color: "#8E8E93", transform: expanded ? "rotate(90deg)" : "none" }} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t"
          style={{ borderColor: cfg.border }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div className="p-3 rounded-xl" style={{ background: "#FFFFFF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8E8E93" }}>
                Clinical Effect
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#3A3A3C" }}>
                {pair.interaction.clinical_effect}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "#FFFFFF" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8E8E93" }}>
                Management
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#3A3A3C" }}>
                {pair.interaction.management}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DrugInteractionCheckerPage() {
  const [inputValue, setInputValue] = useState("");
  const [drugs, setDrugs] = useState<string[]>([]);
  const [results, setResults] = useState<DrugPair[] | null>(null);
  const [checked, setChecked] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setChecked(false);
    setResults(null);
    setAiReport(null);
    setAiError(null);
  };

  const addDrug = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (drugs.length >= MAX_DRUGS) return;
    if (drugs.some((d) => d.toLowerCase() === trimmed.toLowerCase())) return;
    const next = [...drugs, trimmed];
    setDrugs(next);
    setInputValue("");
    resetAll();
    inputRef.current?.focus();
  };

  const removeDrug = (idx: number) => {
    const next = drugs.filter((_, i) => i !== idx);
    setDrugs(next);
    resetAll();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addDrug(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && drugs.length > 0) {
      removeDrug(drugs.length - 1);
    }
  };

  const handleCheck = () => {
    if (drugs.length < 2) return;
    const found = checkInteractions(drugs);
    setResults(found);
    setChecked(true);
    setAiReport(null);
    setAiError(null);
  };

  const handleAiAnalyze = async () => {
    if (drugs.length < 2) return;
    setAiLoading(true);
    setAiError(null);
    setAiReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-drug-interactions", {
        body: { drugs },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || "AI analysis failed");
      setAiReport(data.report as AiReport);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  };

  const buildCadusContext = () => {
    const drugList = drugs.join(", ");
    let ctx = `Please analyse the drug interactions for the following combination:\n\nDrugs: ${drugList}\n\n`;
    if (results && results.length > 0) {
      ctx += `Known interactions found:\n`;
      results.forEach((p) => {
        ctx += `• ${p.drug1} + ${p.drug2} (${p.interaction.severity.toUpperCase()}): ${p.interaction.description}. Clinical effect: ${p.interaction.clinical_effect}\n`;
      });
      ctx += `\nPlease provide a comprehensive clinical analysis and management recommendations for a patient on this drug combination.`;
    } else {
      ctx += `Our database found no known interactions, but please verify and provide any additional clinical insights or precautions for this drug combination.`;
    }
    return encodeURIComponent(ctx);
  };

  const majorCount = results?.filter((r) => r.interaction.severity === "major").length ?? 0;
  const moderateCount = results?.filter((r) => r.interaction.severity === "moderate").length ?? 0;
  const minorCount = results?.filter((r) => r.interaction.severity === "minor").length ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Clinical Reference Only"
        title="Drug Interaction Checker"
        subtitle="Check interactions for up to 5 drugs simultaneously — powered by a curated pharmacology database"
        icon={<Pill className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Input Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
            <h2 className="font-display font-bold text-base mb-0.5" style={{ color: "#1C1C1E" }}>Enter Drug Names</h2>
            <p className="text-xs" style={{ color: "#8E8E93" }}>
              Type a drug name and press Enter or comma to add. Add 2–5 drugs.
            </p>
          </div>

          <div className="px-5 py-4">
            {/* Tag input area */}
            <div
              className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[52px] cursor-text transition-all"
              style={{ background: "#F5F3EE", border: "1.5px solid rgba(60,60,67,0.14)" }}
              onClick={() => inputRef.current?.focus()}>
              {drugs.map((drug, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF", border: "1px solid rgba(0,122,255,0.2)" }}>
                  <Pill className="w-3 h-3" />
                  {drug}
                  <button onClick={(e) => { e.stopPropagation(); removeDrug(i); }}
                    className="ml-0.5 hover:opacity-70 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {drugs.length < MAX_DRUGS && (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={drugs.length === 0 ? "e.g. Warfarin, Aspirin, Metformin…" : "Add another drug…"}
                  className="flex-1 min-w-[150px] bg-transparent text-sm outline-none"
                  style={{ color: "#1C1C1E" }}
                />
              )}
              {inputValue.trim() && (
                <button
                  onClick={() => addDrug(inputValue)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors"
                  style={{ background: "#007AFF", color: "#FFFFFF" }}>
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>

            {drugs.length >= MAX_DRUGS && (
              <p className="text-xs mt-2" style={{ color: "#8E8E93" }}>Maximum of {MAX_DRUGS} drugs reached.</p>
            )}

            {/* Quick-add chips */}
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#8E8E93" }}>Quick add</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DRUGS.filter((d) => !drugs.some((x) => x.toLowerCase() === d.toLowerCase())).slice(0, 12).map((drug) => (
                  <button
                    key={drug}
                    onClick={() => addDrug(drug)}
                    disabled={drugs.length >= MAX_DRUGS}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: drugs.length >= MAX_DRUGS ? "rgba(60,60,67,0.05)" : "rgba(60,60,67,0.07)",
                      color: drugs.length >= MAX_DRUGS ? "#C7C7CC" : "#636366",
                      border: "1px solid rgba(60,60,67,0.1)",
                    }}>
                    {drug}
                  </button>
                ))}
              </div>
            </div>

            {/* Check button */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCheck}
                disabled={drugs.length < 2}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: drugs.length >= 2 ? "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" : "rgba(60,60,67,0.1)",
                  color: drugs.length >= 2 ? "#FFFFFF" : "#C7C7CC",
                  cursor: drugs.length >= 2 ? "pointer" : "not-allowed",
                  boxShadow: drugs.length >= 2 ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
                }}>
                <Search className="w-4 h-4" />
                Check Interactions
                {drugs.length >= 2 && (
                  <span className="text-xs opacity-80">({drugs.length} drugs, {drugs.length * (drugs.length - 1) / 2} pairs)</span>
                )}
              </button>
              {drugs.length > 0 && (
                <button
                  onClick={() => { setDrugs([]); setResults(null); setChecked(false); }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-black/5"
                  style={{ border: "1px solid rgba(60,60,67,0.12)", color: "#636366" }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {checked && results !== null && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="rounded-2xl p-5"
              style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
              <h3 className="font-display font-bold text-base mb-4" style={{ color: "#1C1C1E" }}>
                Results for: {drugs.join(", ")}
              </h3>

              {results.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.25)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(52,199,89,0.15)" }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: "#34C759" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#248A3D" }}>No known interactions found</p>
                    <p className="text-xs mt-0.5" style={{ color: "#636366" }}>
                      No interactions were found in our database for this drug combination. This does not guarantee safety — always verify with a clinical pharmacist or prescriber.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { count: majorCount, label: "Major", color: "#FF3B30", bg: "rgba(255,59,48,0.08)" },
                    { count: moderateCount, label: "Moderate", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                    { count: minorCount, label: "Minor", color: "#FFD60A", bg: "rgba(255,214,10,0.08)" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: stat.bg }}>
                      <p className="text-2xl font-display font-bold" style={{ color: stat.color }}>{stat.count}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: "#636366" }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interaction cards */}
            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((pair, i) => (
                  <InteractionCard key={i} pair={pair} />
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex gap-2.5 p-4 rounded-xl"
              style={{ background: "rgba(60,60,67,0.05)", border: "1px solid rgba(60,60,67,0.1)" }}>
              <BookOpen className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8E8E93" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#636366" }}>
                <span className="font-semibold">Disclaimer:</span> This tool is for clinical reference only and may not include all known interactions. Always verify with the prescriber, pharmacist, or an authoritative drug reference. Not a substitute for professional clinical judgment.
              </p>
            </div>

            {/* Ask Cadus AI */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.05) 0%, rgba(0,194,168,0.05) 100%)", border: "1px solid rgba(0,122,255,0.15)" }}>
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)" }}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "#1C1C1E" }}>
                      Ask Cadus AI about these interactions
                    </p>
                    <p className="text-xs mt-0.5 mb-3" style={{ color: "#636366" }}>
                      Get an in-depth clinical analysis, mechanism of action, and personalised management recommendations for this drug combination.
                    </p>
                    <a
                      href={`${BASE_URL}/ai-assistant?context=${buildCadusContext()}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={{
                        background: "linear-gradient(135deg, #007AFF 0%, #00C2A8 100%)",
                        color: "#FFFFFF",
                        boxShadow: "0 4px 16px rgba(0,122,255,0.25)",
                      }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Discuss with Cadus AI
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info card when not yet checked */}
        {!checked && (
          <div className="rounded-2xl p-5"
            style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#8E8E93" }}>
              Severity Guide
            </p>
            <div className="space-y-2.5">
              {(["major", "moderate", "minor", "none"] as Severity[]).map((s) => {
                const cfg = SEVERITY_CONFIG[s];
                const Icon = cfg.icon;
                const descriptions: Record<Severity, string> = {
                  major: "Contraindicated or requires dose modification. Risk of life-threatening effects.",
                  moderate: "Use with caution. May require monitoring or dose adjustment.",
                  minor: "Clinical significance is limited. Standard monitoring is appropriate.",
                  none: "No clinically significant interaction found in our database.",
                };
                return (
                  <div key={s} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label} — </span>
                      <span className="text-xs" style={{ color: "#636366" }}>{descriptions[s]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
