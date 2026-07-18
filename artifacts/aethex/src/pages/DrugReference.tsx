import { useState, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, FlaskConical, Pill, Info, Shield, AlertTriangle, CheckCircle2, Package, Stethoscope, Lock, Star, Crown, Zap, Globe, Database, ChevronRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { DRUG_DATABASE, FREE_DRUG_LIMIT, DRUG_CLASSES_LIST, type Drug, type Schedule } from "@/data/drugDatabase";

/* ── Schedule badge meta ─────────────────────────────────────────── */
const scheduleMeta: Record<Schedule, { label: string; bg: string; color: string; border: string }> = {
  OTC: { label: "OTC",        bg: "rgba(16,185,129,0.1)",  color: "#059669", border: "rgba(16,185,129,0.3)"  },
  H:   { label: "Schedule H", bg: "rgba(245,158,11,0.1)",  color: "#D97706", border: "rgba(245,158,11,0.3)"  },
  H1:  { label: "Schedule H1",bg: "rgba(239,68,68,0.1)",   color: "#DC2626", border: "rgba(239,68,68,0.3)"   },
  X:   { label: "Schedule X", bg: "rgba(124,58,237,0.1)",  color: "#7C3AED", border: "rgba(124,58,237,0.3)"  },
  Rx:  { label: "Rx Only",    bg: "rgba(59,130,246,0.1)",  color: "#2563EB", border: "rgba(59,130,246,0.3)"  },
};

function ScheduleBadge({ schedule }: { schedule: Schedule }) {
  const m = scheduleMeta[schedule] ?? scheduleMeta["Rx"];
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      <Shield className="w-2.5 h-2.5" />
      {m.label}
    </span>
  );
}

/* ── Drug Card ──────────────────────────────────────────────────── */
function DrugCard({ drug, onViewDetails }: { drug: Drug; onViewDetails: (d: Drug) => void }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3.5 transition-all duration-300 hover:-translate-y-1 h-full"
      style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,122,255,0.12)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,122,255,0.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(60,60,67,0.1)"; }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.15)" }}>
            <Pill className="w-4 h-4" style={{ color: "#007AFF" }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[14px] leading-tight" style={{ color: "#1C1C1E" }}>{drug.brandName}</h3>
            <p className="text-[12px] mt-0.5 font-medium" style={{ color: "#007AFF" }}>{drug.genericName}</p>
            <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{drug.saltName}</p>
          </div>
        </div>
        <ScheduleBadge schedule={drug.schedule} />
      </div>

      {/* Class */}
      <div className="flex flex-wrap gap-1">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ background: "rgba(0,194,168,0.08)", color: "#00A893", border: "1px solid rgba(0,194,168,0.2)" }}>
          {drug.drugClass}
        </span>
      </div>

      {/* Forms */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#AEAEB2" }}>Forms</p>
        <div className="flex flex-wrap gap-1">
          {drug.forms.slice(0, 3).map(f => (
            <span key={f} className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: "rgba(0,122,255,0.06)", color: "#007AFF" }}>{f}</span>
          ))}
          {drug.dosages.length > 0 && (
            <span className="text-[10px]" style={{ color: "#636366" }}>{drug.dosages[0]}{drug.dosages.length > 1 ? ` +${drug.dosages.length - 1}` : ""}</span>
          )}
        </div>
      </div>

      {/* Indications */}
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#AEAEB2" }}>Indications</p>
        <div className="flex flex-col gap-0.5">
          {drug.indications.slice(0, 3).map(ind => (
            <span key={ind} className="flex items-start gap-1 text-[11px]" style={{ color: "#636366" }}>
              <CheckCircle2 className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
              {ind}
            </span>
          ))}
          {drug.indications.length > 3 && (
            <span className="text-[10px]" style={{ color: "#AEAEB2" }}>+{drug.indications.length - 3} more</span>
          )}
        </div>
      </div>

      {/* Contraindications */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#AEAEB2" }}>Key Contraindications</p>
        <div className="flex flex-col gap-0.5">
          {drug.contraindications.slice(0, 2).map(ci => (
            <span key={ci} className="flex items-start gap-1 text-[11px]" style={{ color: "#636366" }}>
              <AlertTriangle className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
              {ci}
            </span>
          ))}
          {drug.contraindications.length > 2 && (
            <span className="text-[10px]" style={{ color: "#AEAEB2" }}>+{drug.contraindications.length - 2} more</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: "rgba(60,60,67,0.08)" }}>
        <span className="text-[10px]" style={{ color: "#AEAEB2" }}>{drug.manufacturer || ""}</span>
        <button
          onClick={() => onViewDetails(drug)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)", color: "#FFFFFF" }}>
          <Info className="w-3 h-3" />
          Full Details
        </button>
      </div>
    </div>
  );
}

/* ── Locked Card ────────────────────────────────────────────────── */
function LockedDrugCard({ drug, onUnlock }: { drug: Drug; onUnlock: () => void }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* Blurred content */}
      <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "rgba(0,122,255,0.08)" }} />
          <div>
            <div className="h-4 rounded w-32 mb-1" style={{ background: "rgba(60,60,67,0.1)" }} />
            <div className="h-3 rounded w-24" style={{ background: "rgba(0,122,255,0.1)" }} />
          </div>
        </div>
        <div className="h-3 rounded w-full mb-1.5" style={{ background: "rgba(60,60,67,0.07)" }} />
        <div className="h-3 rounded w-4/5 mb-1.5" style={{ background: "rgba(60,60,67,0.07)" }} />
        <div className="h-3 rounded w-3/5" style={{ background: "rgba(60,60,67,0.07)" }} />
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "linear-gradient(135deg, #007AFF14, #00C2A814)", border: "2px solid rgba(0,122,255,0.2)" }}>
          <Lock className="w-5 h-5" style={{ color: "#007AFF" }} />
        </div>
        <p className="font-bold text-sm mb-0.5" style={{ color: "#1C1C1E" }}>Premium Drug</p>
        <p className="text-[11px] mb-3 text-center px-4" style={{ color: "#636366" }}>Subscribe to access this drug's full information</p>
        <button
          onClick={onUnlock}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)", color: "#FFFFFF" }}>
          <Crown className="w-3.5 h-3.5" />
          Unlock Access
        </button>
      </div>
    </div>
  );
}

/* ── Detail Modal ───────────────────────────────────────────────── */
function DrugModal({ drug, onClose }: { drug: Drug; onClose: () => void }) {
  const m = scheduleMeta[drug.schedule] ?? scheduleMeta["Rx"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{ background: "#FFFFFF", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-start justify-between gap-4"
          style={{ background: "#FFFFFF", borderColor: "rgba(60,60,67,0.1)" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.1), rgba(0,194,168,0.1))", border: "1px solid rgba(0,122,255,0.15)" }}>
              <Pill className="w-5 h-5" style={{ color: "#007AFF" }} />
            </div>
            <div>
              <h2 className="font-bold text-[17px] leading-tight" style={{ color: "#1C1C1E" }}>{drug.brandName}</h2>
              <p className="text-sm font-medium" style={{ color: "#007AFF" }}>{drug.genericName}</p>
              <p className="text-[11px]" style={{ color: "#AEAEB2" }}>{drug.saltName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ScheduleBadge schedule={drug.schedule} />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check this on Aethex 👨‍⚕️ ${drug.brandName} (${drug.genericName}) — aethex.in/drug-reference`)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on WhatsApp"
              className="p-2 rounded-xl hover:bg-green-50 transition-colors"
              style={{ color: "#25D366" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5" style={{ color: "#636366" }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Overview grid */}
          <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04), rgba(0,194,168,0.04))", border: "1px solid rgba(0,122,255,0.1)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Drug Class", value: drug.drugClass },
                { label: "Category", value: drug.category },
                { label: "Manufacturer", value: drug.manufacturer || "—" },
                { label: "Pregnancy", value: drug.pregnancyCategory || "—" },
                { label: "Schedule", value: drug.schedule === "OTC" ? "Over the Counter" : `${m.label} (Rx Required)` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#AEAEB2" }}>{label}</p>
                  <p className="text-[13px] font-medium" style={{ color: "#1C1C1E" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {drug.mechanism && (
            <ModalSection icon={<FlaskConical className="w-4 h-4" />} title="Mechanism of Action" color="#7C3AED">
              <p className="text-[13px] leading-relaxed" style={{ color: "#3C3C43" }}>{drug.mechanism}</p>
            </ModalSection>
          )}

          <ModalSection icon={<Package className="w-4 h-4" />} title="Available Forms & Dosages" color="#007AFF">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {drug.forms.map(f => (
                <span key={f} className="px-2 py-0.5 rounded-lg text-[12px] font-medium"
                  style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF", border: "1px solid rgba(0,122,255,0.15)" }}>{f}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {drug.dosages.map(d => (
                <span key={d} className="px-2 py-0.5 rounded-lg text-[12px]"
                  style={{ background: "rgba(60,60,67,0.05)", color: "#636366", border: "1px solid rgba(60,60,67,0.1)" }}>{d}</span>
              ))}
            </div>
          </ModalSection>

          <ModalSection icon={<Stethoscope className="w-4 h-4" />} title="Indications" color="#10B981">
            <ul className="space-y-1">
              {drug.indications.map(ind => (
                <li key={ind} className="flex items-start gap-2 text-[13px]" style={{ color: "#3C3C43" }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                  {ind}
                </li>
              ))}
            </ul>
          </ModalSection>

          <ModalSection icon={<AlertTriangle className="w-4 h-4" />} title="Contraindications" color="#EF4444">
            <ul className="space-y-1">
              {drug.contraindications.map(ci => (
                <li key={ci} className="flex items-start gap-2 text-[13px]" style={{ color: "#3C3C43" }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#EF4444" }} /> {ci}
                </li>
              ))}
            </ul>
          </ModalSection>

          {drug.sideEffects && drug.sideEffects.length > 0 && (
            <ModalSection icon={<Info className="w-4 h-4" />} title="Side Effects" color="#F59E0B">
              <div className="flex flex-wrap gap-1.5">
                {drug.sideEffects.map(se => (
                  <span key={se} className="px-2.5 py-1 rounded-full text-[12px]"
                    style={{ background: "rgba(245,158,11,0.08)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}>{se}</span>
                ))}
              </div>
            </ModalSection>
          )}

          {drug.interactions && drug.interactions.length > 0 && (
            <ModalSection icon={<Shield className="w-4 h-4" />} title="Drug Interactions" color="#EF4444">
              <ul className="space-y-1">
                {drug.interactions.map(inter => (
                  <li key={inter} className="flex items-start gap-2 text-[13px]" style={{ color: "#3C3C43" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "#EF4444" }} />
                    {inter}
                  </li>
                ))}
              </ul>
            </ModalSection>
          )}

          <div className="p-4 rounded-2xl text-center"
            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-[11px] leading-relaxed" style={{ color: "#92400E" }}>
              <span className="font-bold">Disclaimer:</span> This information is for reference only, intended for qualified healthcare professionals. Always consult current prescribing information and clinical judgement before prescribing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalSection({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}14`, color }}>
          {icon}
        </div>
        <h3 className="text-[14px] font-bold" style={{ color: "#1C1C1E" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── Subscription Modal ─────────────────────────────────────────── */
function SubscriptionModal({ onClose }: { onClose: () => void }) {
  const plans = [
    { name: "Monthly", price: "₹299", period: "/month", desc: "Full access to all 500+ drugs", popular: false },
    { name: "Annual", price: "₹1,999", period: "/year", desc: "Save 44% · Best for practitioners", popular: true },
    { name: "Lifetime", price: "₹4,999", period: "one-time", desc: "Pay once, access forever", popular: false },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div className="relative px-6 py-6 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <Crown className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold text-white">Aethex Drug Reference Pro</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Unlock Full Database</h2>
            <p className="text-white/75 text-sm">Access all {DRUG_DATABASE.length}+ drugs, complete clinical data,<br className="hidden sm:block" /> interactions, and pregnancy categories</p>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(60,60,67,0.08)" }}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Database, text: `${DRUG_DATABASE.length}+ World Drugs` },
              { icon: Globe, text: "Global Brands & Salts" },
              { icon: Shield, text: "CDSCO & WHO Schedules" },
              { icon: Zap, text: "Instant Offline Access" },
              { icon: Star, text: "Drug Interactions" },
              { icon: FlaskConical, text: "Pregnancy Categories" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,122,255,0.08)" }}>
                  <Icon className="w-3 h-3" style={{ color: "#007AFF" }} />
                </div>
                <span className="text-[12px] font-medium" style={{ color: "#3C3C43" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="px-6 py-4">
          <div className="flex flex-col gap-2">
            {plans.map(plan => (
              <div key={plan.name}
                className="relative flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
                style={{
                  border: plan.popular ? "2px solid #007AFF" : "1px solid rgba(60,60,67,0.12)",
                  background: plan.popular ? "rgba(0,122,255,0.04)" : "#FAFAFA",
                  boxShadow: plan.popular ? "0 4px 16px rgba(0,122,255,0.12)" : "none",
                }}>
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)" }}>
                    MOST POPULAR
                  </span>
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "#1C1C1E" }}>{plan.name}</p>
                  <p className="text-[11px]" style={{ color: "#636366" }}>{plan.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-lg" style={{ color: plan.popular ? "#007AFF" : "#1C1C1E" }}>{plan.price}</p>
                  <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{plan.period}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#AEAEB2" }} />
              </div>
            ))}
          </div>

          <button
            className="w-full mt-3 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)" }}>
            Start Pro Access
          </button>
          <p className="text-center text-[11px] mt-2" style={{ color: "#AEAEB2" }}>
            Cancel anytime · Trusted by 50,000+ doctors
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Filter Select ──────────────────────────────────────────────── */
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
        style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.startsWith("All") ? `${label}: All` : opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#AEAEB2" }} />
    </div>
  );
}

const SCHEDULES = ["All", "OTC", "H", "H1", "X", "Rx"];
const FORMS_LIST = ["All", "Tablet", "Capsule", "Syrup", "Injection", "Inhaler", "Cream", "Drops", "Patch"];

/* ── Main Page ──────────────────────────────────────────────────── */
export default function DrugReference() {
  const [query, setQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSchedule, setSelectedSchedule] = useState("All");
  const [selectedForm, setSelectedForm] = useState("All");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);

  const allFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DRUG_DATABASE.filter(d => {
      const matchSearch = !q ||
        d.brandName.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        d.saltName.toLowerCase().includes(q) ||
        d.drugClass.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.indications.some(i => i.toLowerCase().includes(q));
      const matchClass = selectedClass === "All Classes" || d.category === selectedClass || d.drugClass.includes(selectedClass);
      const matchSchedule = selectedSchedule === "All" || d.schedule === selectedSchedule;
      const matchForm = selectedForm === "All" || d.forms.some(f => f.toLowerCase().includes(selectedForm.toLowerCase()));
      return matchSearch && matchClass && matchSchedule && matchForm;
    });
  }, [query, selectedClass, selectedSchedule, selectedForm]);

  const freeResults = useMemo(() => allFiltered.filter((_, i) => DRUG_DATABASE.indexOf(_) < FREE_DRUG_LIMIT), [allFiltered]);
  const lockedResults = useMemo(() => allFiltered.filter((_, i) => DRUG_DATABASE.indexOf(_) >= FREE_DRUG_LIMIT), [allFiltered]);

  const hasFilters = query || selectedClass !== "All Classes" || selectedSchedule !== "All" || selectedForm !== "All";
  const clearAll = useCallback(() => { setQuery(""); setSelectedClass("All Classes"); setSelectedSchedule("All"); setSelectedForm("All"); }, []);

  const totalFree = DRUG_DATABASE.filter((_, i) => i < FREE_DRUG_LIMIT).length;
  const totalLocked = DRUG_DATABASE.length - totalFree;

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <PageHero
        tag="Drug Reference"
        title="Indian Drug Reference"
        subtitle={`${DRUG_DATABASE.length}+ drugs · CDSCO & WHO Schedules · First ${FREE_DRUG_LIMIT} free`}
        icon={<Pill className="w-7 h-7" style={{ color: "rgba(255,255,255,0.85)" }} />}
        right={
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.35)" }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search drug name, salt, brand…"
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#FFFFFF" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.6)" }} />
              </button>
            )}
          </div>
        }
      />


      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Schedule legend */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(Object.entries(scheduleMeta) as [Schedule, typeof scheduleMeta[Schedule]][]).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: val.bg, color: val.color, border: `1px solid ${val.border}` }}>
              <Shield className="w-3 h-3" />
              {val.label}
            </span>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <FilterSelect label="Class" value={selectedClass} options={DRUG_CLASSES_LIST} onChange={setSelectedClass} />
          <FilterSelect label="Schedule" value={selectedSchedule} options={SCHEDULES} onChange={setSelectedSchedule} />
          <FilterSelect label="Form" value={selectedForm} options={FORMS_LIST} onChange={setSelectedForm} />
          {hasFilters && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80"
              style={{ color: "#007AFF" }}>
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
          <span className="ml-auto text-sm font-medium" style={{ color: "#636366" }}>
            {freeResults.length} free{lockedResults.length > 0 ? ` + ${lockedResults.length} premium` : ""} drug{allFiltered.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* Results */}
        {allFiltered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,122,255,0.08)" }}>
              <Search className="w-6 h-6" style={{ color: "#007AFF" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#1C1C1E" }}>No drugs found</p>
            <p className="text-sm mb-4" style={{ color: "#AEAEB2" }}>Try a different name, salt, or brand.</p>
            <button onClick={clearAll} className="text-sm font-semibold hover:underline" style={{ color: "#007AFF" }}>Clear all filters</button>
          </div>
        ) : (
          <>
            {/* Free drugs grid */}
            {freeResults.length > 0 && (
              <>
                {freeResults.length > 0 && lockedResults.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#10B981" }} />
                    <span className="text-[13px] font-semibold" style={{ color: "#059669" }}>Free Access — {freeResults.length} drug{freeResults.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {freeResults.map(drug => (
                    <DrugCard key={drug.id} drug={drug} onViewDetails={d => setSelectedDrug(d)} />
                  ))}
                </div>
              </>
            )}

            {/* Premium drugs section */}
            {lockedResults.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: "#007AFF" }} />
                    <span className="text-[13px] font-bold" style={{ color: "#1C1C1E" }}>
                      Premium Drugs — {lockedResults.length} drug{lockedResults.length !== 1 ? "s" : ""} locked
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSubscription(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)", color: "#FFFFFF" }}>
                    <Crown className="w-3.5 h-3.5" />
                    Unlock All
                  </button>
                </div>

                {/* Paywall banner */}
                <div className="mb-4 p-4 rounded-2xl flex items-center gap-3"
                  style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.06), rgba(0,194,168,0.06))", border: "1px solid rgba(0,122,255,0.15)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)" }}>
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "#1C1C1E" }}>Subscribe to unlock {totalLocked}+ premium drugs</p>
                    <p className="text-[12px]" style={{ color: "#636366" }}>Full clinical data, interactions, mechanisms, and pregnancy categories for all worldwide drugs</p>
                  </div>
                  <button
                    onClick={() => setShowSubscription(true)}
                    className="shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-90 hidden sm:block"
                    style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)", color: "#FFFFFF" }}>
                    View Plans
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedResults.slice(0, 12).map(drug => (
                    <LockedDrugCard key={drug.id} drug={drug} onUnlock={() => setShowSubscription(true)} />
                  ))}
                  {lockedResults.length > 12 && (
                    <div
                      className="rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all hover:-translate-y-1"
                      style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.05), rgba(0,194,168,0.05))", border: "2px dashed rgba(0,122,255,0.25)" }}
                      onClick={() => setShowSubscription(true)}>
                      <Lock className="w-8 h-8 mb-3" style={{ color: "#007AFF" }} />
                      <p className="font-bold text-sm text-center mb-1" style={{ color: "#1C1C1E" }}>
                        +{lockedResults.length - 12} more premium drugs
                      </p>
                      <p className="text-[12px] text-center mb-3" style={{ color: "#636366" }}>Subscribe to access all</p>
                      <button
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                        style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)", color: "#FFFFFF" }}>
                        <Crown className="w-3.5 h-3.5" /> Unlock Access
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* No filters — show full database preview */}
        {!hasFilters && freeResults.length === 0 && lockedResults.length === 0 && (
          <div className="text-center py-16">
            <Database className="w-10 h-10 mx-auto mb-4" style={{ color: "#AEAEB2" }} />
            <p style={{ color: "#636366" }}>Start searching to explore the drug database</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-5 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "#92400E" }}>Medical Disclaimer</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#B45309" }}>
                This database is for informational and educational purposes for qualified healthcare professionals only. Drug information may not be exhaustive. Always refer to official prescribing information and CDSCO guidelines before prescribing. Aethex is not liable for clinical decisions made based on this data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedDrug && <DrugModal drug={selectedDrug} onClose={() => setSelectedDrug(null)} />}
      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
    </div>
  );
}
