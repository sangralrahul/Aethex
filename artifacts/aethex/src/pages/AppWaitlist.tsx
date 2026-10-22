import { useState } from "react";
import { Smartphone, CheckCircle, Share2, Gift, Star, Bell, Brain, BookOpen, ShoppingBag } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FEATURES = [
  { icon: Brain, title: "Cadus on the go", desc: "Ask clinical questions, get SOAP notes, and drug info — anytime, anywhere.", color: "#8B5CF6" },
  { icon: BookOpen, title: "Offline Study Mode", desc: "Download MCQ packs and study notes for use without internet connection.", color: "#007AFF" },
  { icon: Bell, title: "Smart Reminders", desc: "Daily study reminders, live class alerts, and streak notifications.", color: "#F59E0B" },
  { icon: ShoppingBag, title: "Quick Medical Supply Orders", desc: "Order stethoscopes, equipment, and scrubs with one tap.", color: "#00C2A8" },
  { icon: Star, title: "CME on Mobile", desc: "Attend live classes and earn CME credits from your phone.", color: "#EF4444" },
  { icon: Gift, title: "Exclusive App Launch Offer", desc: "First 10,000 users get 3 months Magnus free at launch.", color: "#10B981" },
];

export default function AppWaitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [referral] = useState(`AETHEX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`Join the Aethex app waitlist and get 3 months Magnus free! Use my code: ${referral} — https://aethex.in/app`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0A0E1A" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-20 pb-24">
        {/* Background photo — mobile/smartphone lifestyle */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }} />
        {/* Dark overlay */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(10,14,26,0.88) 0%, rgba(10,20,40,0.82) 50%, rgba(10,14,26,0.90) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2" style={{ background: "rgba(0,194,168,0.08)" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Phone mockup */}
          <div className="w-20 h-36 rounded-3xl mx-auto mb-8 flex items-center justify-center relative" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", boxShadow: "0 30px 80px rgba(0,122,255,0.3)" }}>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.3)" }} />
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(0,122,255,0.15)", border: "1px solid rgba(0,122,255,0.25)", color: "#60A5FA" }}>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold">Coming Soon — iOS & Android</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4" style={{ letterSpacing: "-2px" }}>
            Aethex <span style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>App</span>
          </h1>
          <p className="text-lg max-w-lg mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>India's medical platform — now in your pocket. Cadus, MCQs, live classes, and medical supplies. All in one app.</p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required
                  className="flex-1 px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF" }} />
                <button type="submit" className="px-5 py-3.5 rounded-2xl font-bold text-sm" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
                  Join Waitlist
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>Join waitlist + refer 3 doctors = 3 months Magnus free at launch</p>
            </form>
          ) : (
            <div className="max-w-md mx-auto rounded-3xl p-6 text-center" style={{ background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.25)" }}>
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">You're on the list! 🎉</h3>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Share your referral link to get 3 months Magnus free at launch.</p>
              <div className="rounded-xl p-3 mb-3 text-left" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Your referral code</p>
                <p className="font-mono font-bold text-white">{referral}</p>
              </div>
              <button onClick={copyReferral} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
                <Share2 className="w-4 h-4" /> {copied ? "Copied! 🎉" : "Copy Referral Link"}
              </button>
            </div>
          )}

          {/* Official Store Badges */}
          <div className="flex flex-wrap gap-4 justify-center mt-8 items-center">
            {/* App Store — object tag renders SVG inline styles correctly */}
            <a href="#" onClick={e => e.preventDefault()} className="transition-transform hover:scale-105 active:scale-95" style={{ display: "inline-block", height: 52 }}>
              <object
                data={`${BASE}/app-store-badge.svg`}
                type="image/svg+xml"
                style={{ height: 52, width: "auto", display: "block", pointerEvents: "none" }}
                aria-label="Download on the App Store"
              />
            </a>
            {/* Google Play — PNG works fine as img */}
            <a href="#" onClick={e => e.preventDefault()} className="transition-transform hover:scale-105 active:scale-95">
              <img src={`${BASE}/google-play-badge.png`} alt="Get it on Google Play" style={{ height: 52 }} />
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-8">Everything you love about Aethex — on mobile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1 text-white">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
