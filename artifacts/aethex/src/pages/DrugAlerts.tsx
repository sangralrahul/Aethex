import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle, Info, X, Search, Bell, Sparkles, ExternalLink, Calendar, Filter } from "lucide-react";
import { cadusUrl } from "@/lib/host";


const ALERTS = [
  { id: 1, type: "recall", title: "Voluntary Recall: Metformin HCl 500mg Tablets — Batch No. MF-2024-0311", drug: "Metformin HCl", category: "Antidiabetic", source: "CDSCO", date: "Apr 02, 2026", severity: "high", summary: "Contamination with NDMA (N-Nitrosodimethylamine) above acceptable limits detected in Batch MF-2024-0311. Patients on this batch should be shifted to alternative brands immediately.", action: "Recall all units of Batch MF-2024-0311 from market and hospital pharmacies." },
  { id: 2, type: "safety", title: "Safety Alert: Risk of QT Prolongation with Azithromycin in Elderly Patients", drug: "Azithromycin", category: "Antibiotic", source: "CDSCO", date: "Mar 28, 2026", severity: "medium", summary: "Post-marketing surveillance data indicates increased risk of cardiac arrhythmia due to QT interval prolongation in patients >65 years with pre-existing cardiac conditions.", action: "Exercise caution in elderly patients; monitor ECG in high-risk individuals." },
  { id: 3, type: "approval", title: "New Approval: Semaglutide 1mg Injection (Ozempic) — Type 2 Diabetes", drug: "Semaglutide", category: "Antidiabetic (GLP-1 RA)", source: "CDSCO", date: "Mar 25, 2026", severity: "low", summary: "CDSCO has approved Semaglutide 1mg subcutaneous injection for the treatment of Type 2 Diabetes Mellitus as an adjunct to diet and exercise.", action: "Available by prescription. Refer to full prescribing information for dosing guidelines." },
  { id: 4, type: "recall", title: "Urgent Recall: Paracetamol IV Infusion 10mg/mL — Manufacturing Defect", drug: "Paracetamol IV", category: "Analgesic/Antipyretic", source: "CDSCO", date: "Mar 20, 2026", severity: "high", summary: "Subpotent batches identified due to incorrect manufacturing process. Risk of therapeutic failure in critically ill patients.", action: "Remove all recalled batches from ICU and emergency stock immediately." },
  { id: 5, type: "safety", title: "Drug Interaction Alert: Warfarin + Fluconazole — Risk of Life-Threatening Bleeding", drug: "Warfarin / Fluconazole", category: "Anticoagulant / Antifungal", source: "CDSCO", date: "Mar 15, 2026", severity: "high", summary: "Co-administration significantly increases INR. Multiple case reports of fatal haemorrhage. This combination should be avoided or INR monitored very closely.", action: "Avoid concurrent use. If unavoidable, reduce warfarin dose and monitor INR daily." },
  { id: 6, type: "approval", title: "New Approval: Nirmatrelvir/Ritonavir (Paxlovid) for COVID-19 — High-Risk Adults", drug: "Nirmatrelvir/Ritonavir", category: "Antiviral", source: "CDSCO", date: "Mar 10, 2026", severity: "low", summary: "Approved for treatment of mild-to-moderate COVID-19 in high-risk adults (immunocompromised, elderly, comorbidities). Must be initiated within 5 days of symptom onset.", action: "Prescription-only. Multiple drug interactions — review concomitant medications before prescribing." },
  { id: 7, type: "safety", title: "Alert: Tramadol — Updated Warnings for Paediatric Use", drug: "Tramadol", category: "Opioid Analgesic", source: "CDSCO", date: "Mar 05, 2026", severity: "medium", summary: "Updated prescribing information warns against use in children under 12 years and adolescents with obesity or respiratory conditions due to risk of respiratory depression.", action: "Avoid in children <12 years. Monitor respiratory rate in adolescents." },
  { id: 8, type: "recall", title: "Recall: Atorvastatin 40mg Tablets — Failed Dissolution Test", drug: "Atorvastatin", category: "Statin", source: "CDSCO", date: "Feb 28, 2026", severity: "medium", summary: "Batches AT-2025-88 and AT-2025-89 failed in-vitro dissolution testing, indicating reduced bioavailability and potential therapeutic failure.", action: "Switch patients on recalled batches to alternative brands." },
];

const typeConfig = {
  recall: { icon: AlertTriangle, label: "Recall", bg: "rgba(239,68,68,0.08)", color: "#EF4444", border: "rgba(239,68,68,0.2)" },
  safety: { icon: Info, label: "Safety Alert", bg: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  approval: { icon: CheckCircle, label: "New Approval", bg: "rgba(0,194,168,0.08)", color: "#00C2A8", border: "rgba(0,194,168,0.2)" },
};
const severityConfig = {
  high: { label: "High", bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
  medium: { label: "Medium", bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  low: { label: "Info", bg: "rgba(0,194,168,0.1)", color: "#00C2A8" },
};

export default function DrugAlerts() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());

  const cats = ["Antidiabetic", "Antibiotic", "Antiviral", "Statin", "Analgesic/Antipyretic", "Anticoagulant / Antifungal"];

  const filtered = ALERTS.filter(a => {
    const q = query.toLowerCase();
    return (!q || a.title.toLowerCase().includes(q) || a.drug.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
      && (filterType === "all" || a.type === filterType);
  });

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-14 pb-16">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(8,18,36,0.95) 0%,rgba(10,26,50,0.9) 100%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171" }}>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-semibold">CDSCO Drug Safety Alerts</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-1px" }}>
            Drug <span style={{ background: "linear-gradient(135deg,#EF4444,#F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Safety Alerts</span>
          </h1>
          <p className="text-base max-w-xl mx-auto mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Real-time drug recalls, safety alerts & new approvals from CDSCO. Stay informed, protect your patients.</p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input type="text" placeholder="Search by drug name or category..." value={query} onChange={e => setQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#FFFFFF" }} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filter row */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ v: "all", l: "All Alerts" }, { v: "recall", l: "🚨 Recalls" }, { v: "safety", l: "⚠️ Safety Alerts" }, { v: "approval", l: "✅ New Approvals" }].map(f => (
            <button key={f.v} onClick={() => setFilterType(f.v)} className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={filterType === f.v ? { background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}>
              {f.l}
            </button>
          ))}
          <span className="ml-auto self-center text-sm" style={{ color: "#AEAEB2" }}>{filtered.length} alerts</span>
        </div>

        {/* Subscribe section */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(0,122,255,0.04)", border: "1px solid rgba(0,122,255,0.15)" }}>
          <div className="flex items-start gap-3 mb-3">
            <Bell className="w-4.5 h-4.5 mt-0.5" style={{ color: "#007AFF" }} />
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "#1C1C1E" }}>Subscribe to Drug Category Alerts</p>
              <p className="text-xs" style={{ color: "#636366" }}>Get instant browser push notifications when alerts are posted for your subscribed categories.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {cats.map(c => {
              const sub = subscribed.has(c);
              return (
                <button key={c} onClick={() => setSubscribed(p => { const n = new Set(p); sub ? n.delete(c) : n.add(c); return n; })} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={sub ? { background: "rgba(0,122,255,0.12)", color: "#007AFF", border: "1px solid rgba(0,122,255,0.3)" } : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                  {sub ? "✓ " : "+ "}{c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerts list */}
        <div className="space-y-4">
          {filtered.map(a => {
            const tc = typeConfig[a.type as keyof typeof typeConfig];
            const sc = severityConfig[a.severity as keyof typeof severityConfig];
            const Icon = tc.icon;
            return (
              <div key={a.id} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: `1px solid ${tc.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tc.bg }}>
                    <Icon className="w-5 h-5" style={{ color: tc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label} Severity</span>
                      <span className="text-[10px] ml-auto flex items-center gap-1" style={{ color: "#AEAEB2" }}><Calendar className="w-3 h-3" />{a.date}</span>
                    </div>
                    <h3 className="font-bold text-sm leading-snug" style={{ color: "#1C1C1E" }}>{a.title}</h3>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: "#636366" }}>Drug: <span style={{ color: "#1C1C1E" }}>{a.drug}</span></span>
                    <span className="text-xs" style={{ color: "#AEAEB2" }}>·</span>
                    <span className="text-xs" style={{ color: "#636366" }}>{a.category}</span>
                    <span className="text-xs" style={{ color: "#AEAEB2" }}>· Source: <span style={{ color: "#007AFF" }}>{a.source}</span></span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#636366" }}>{a.summary}</p>
                </div>
                {a.type !== "approval" && (
                  <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#EF4444" }}>Recommended Action:</p>
                    <p className="text-xs" style={{ color: "#636366" }}>{a.action}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <a href={cadusUrl("/")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", textDecoration: "none" }}>
                    <Sparkles className="w-3.5 h-3.5" /> Ask Cadus AI
                  </a>

                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "#F2F2F7", color: "#636366" }}>
                    <ExternalLink className="w-3.5 h-3.5" /> CDSCO Source
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
