import { X, Crown, Zap, Shield, Brain, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface UpgradeModalProps {
  onClose: () => void;
  featureName?: string;
}

const FEATURES = [
  { icon: Brain, text: "Full MCQ answers & explanations" },
  { icon: Shield, text: "Complete drug interaction details" },
  { icon: Zap, text: "Unlimited Cadus queries" },
  { icon: Star, text: "Deep Research & PDF reports" },
];

export function UpgradeModal({ onClose, featureName }: UpgradeModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#0a1223 0%,#0d2142 60%,#0a3060 100%)",
          border: "1px solid rgba(0,194,168,0.2)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 60px rgba(0,194,168,0.1)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,194,168,0.15) 0%, transparent 60%)"
        }} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="relative p-7">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", boxShadow: "0 8px 24px rgba(245,158,11,0.4)" }}>
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Cadus Magnus</h2>
            {featureName && (
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
                Unlock <span className="text-[#00C2A8] font-medium">{featureName}</span> and more
              </p>
            )}
          </div>

          <div className="space-y-2.5 mb-6">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,194,168,0.15)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{text}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-3xl font-bold text-white">₹499</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>/month</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>or ₹3,999/year · Save 33%</p>
          </div>

          <Link href="/account?tab=subscription" onClick={onClose}>
            <button className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", color: "#fff" }}>
              Upgrade Now <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            Cancel anytime · Instant activation
          </p>
        </div>
      </div>
    </div>
  );
}
