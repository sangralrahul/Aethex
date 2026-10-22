import { useState } from "react";
import { Building2, Users, BarChart3, Award, CheckCircle, ArrowRight, GraduationCap, Sparkles, Mail, Phone } from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Bulk Seat Management", desc: "Purchase seats for your entire batch — 50 to 5,000 students or doctors.", color: "#007AFF" },
  { icon: BarChart3, title: "Faculty Dashboard", desc: "Track individual student progress, MCQ accuracy, study time, and CME credits.", color: "#8B5CF6" },
  { icon: GraduationCap, title: "Custom Certificates", desc: "College-branded CME certificates with your institution's logo and NMC-recognised credits.", color: "#F59E0B" },
  { icon: Award, title: "NEET-PG Analytics", desc: "Cohort-level performance analysis — identify weak areas across your batch.", color: "#00C2A8" },
  { icon: Sparkles, title: "Cadus for Students", desc: "Unlimited Cadus access for every enrolled student in your institution.", color: "#EF4444" },
  { icon: BarChart3, title: "Dedicated Account Manager", desc: "Dedicated support, onboarding training, and customisation for your institution.", color: "#10B981" },
];

const PLANS = [
  { name: "Starter", seats: "50–200", price: "₹499", unit: "per seat/year", badge: null, features: ["All Aethex features", "Faculty dashboard", "Progress reports", "Email support", "College-branded certificates"] },
  { name: "Professional", seats: "201–1,000", price: "₹399", unit: "per seat/year", badge: "Most Popular", features: ["Everything in Starter", "Dedicated account manager", "Custom MCQ packs", "Bulk analytics export", "Priority support (24h)", "Faculty training sessions"] },
  { name: "Enterprise", seats: "1,000+", price: "Custom", unit: "pricing", badge: null, features: ["Everything in Professional", "Fully custom branding", "API integration", "SLA guarantee", "On-site training", "Quarterly review calls"] },
];

const COLLEGES = ["AIIMS Delhi", "JIPMER Puducherry", "CMC Vellore", "PGI Chandigarh", "KEM Mumbai", "Grant Medical College", "St. John's Medical College", "Bangalore Medical College"];

export default function Enterprise() {
  const [form, setForm] = useState({ name: "", college: "", email: "", phone: "", seats: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-16 pb-20">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0A0E1A 0%,#1a1f3a 100%)" }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" style={{ background: "rgba(0,122,255,0.12)" }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(0,122,255,0.15)", border: "1px solid rgba(0,122,255,0.25)", color: "#60A5FA" }}>
            <Building2 className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Institutional Plan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing: "-1px" }}>
            Aethex for <span style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Medical Colleges</span>
          </h1>
          <p className="text-base max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>Give your students India's most advanced medical learning platform. Bulk licensing, faculty dashboards, branded certificates, and Cadus — at scale.</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[{ v: "50+", l: "Colleges Enrolled" }, { v: "25,000+", l: "Students Active" }, { v: "NMC", l: "Recognised CME" }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-white">{s.v}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}14` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: "#1C1C1E" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#636366" }}>{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Pricing */}
        <h2 className="text-2xl font-black text-center mb-6" style={{ color: "#1C1C1E" }}>Institutional Pricing</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {PLANS.map((p, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: i === 1 ? "2px solid #007AFF" : "1px solid rgba(60,60,67,0.1)", boxShadow: i === 1 ? "0 8px 32px rgba(0,122,255,0.12)" : "0 2px 8px rgba(0,0,0,0.05)" }}>
              {p.badge && <div className="py-1.5 text-center text-xs font-bold" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>{p.badge}</div>}
              <div className="p-6">
                <h3 className="font-black text-lg mb-1" style={{ color: "#1C1C1E" }}>{p.name}</h3>
                <p className="text-xs mb-4" style={{ color: "#AEAEB2" }}>{p.seats} seats</p>
                <div className="mb-5">
                  <span className="text-3xl font-black" style={{ color: "#007AFF" }}>{p.price}</span>
                  <span className="text-xs ml-1" style={{ color: "#AEAEB2" }}>{p.unit}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "#636366" }}>
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#00C2A8" }} />{f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl font-bold text-sm" style={i === 1 ? { background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" } : { background: "#F2F2F7", color: "#1C1C1E" }}>
                  Get a Quote <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-black mb-3" style={{ color: "#1C1C1E" }}>Get a Custom Quote</h2>
            <p className="text-sm mb-5" style={{ color: "#636366" }}>Fill in the form and our institutional sales team will get back to you within 1 business day with a customised proposal.</p>
            <div className="space-y-3 text-sm" style={{ color: "#636366" }}>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: "#007AFF" }} /> enterprise@aethex.in</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: "#007AFF" }} /> +91 98765 43210</div>
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold mb-3" style={{ color: "#AEAEB2" }}>TRUSTED BY LEADING INSTITUTIONS</p>
              <div className="flex flex-wrap gap-2">
                {COLLEGES.map(c => <span key={c} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", color: "#636366" }}>{c}</span>)}
              </div>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: "name", label: "Your Name", placeholder: "Dr. Rajesh Kumar", type: "text" },
                { key: "college", label: "Institution Name", placeholder: "ABC Medical College", type: "text" },
                { key: "email", label: "Email", placeholder: "principal@abcmc.edu.in", type: "email" },
                { key: "phone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
                { key: "seats", label: "Number of Seats", placeholder: "e.g. 200", type: "number" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#636366" }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} required
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E" }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#636366" }}>Message (optional)</label>
                <textarea rows={3} placeholder="Tell us about your requirements..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E" }} />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-2xl font-bold text-sm" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
                Submit Enquiry
              </button>
            </form>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(0,194,168,0.06)", border: "1px solid rgba(0,194,168,0.2)" }}>
              <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#00C2A8" }} />
              <h3 className="font-bold text-lg mb-2" style={{ color: "#1C1C1E" }}>Enquiry Received!</h3>
              <p className="text-sm" style={{ color: "#636366" }}>Our enterprise team will reach out within 1 business day with a customised proposal for your institution.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
