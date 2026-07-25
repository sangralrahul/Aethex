import { useState } from "react";
import { Link } from "wouter";
import { Monitor, Star, Clock, Globe, ArrowRight, Sparkles, CheckCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cadusUrl } from "@/lib/host";


const PLATFORMS = [
  { id: 1, name: "eSanjeevani", govt: true, logo: "🏥", fees: "Free", specialties: ["General Medicine", "Psychiatry", "Dermatology", "Paediatrics", "All Specialties"], wait: "15–45 min", languages: ["Hindi", "English", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati"], rating: 4.3, reviews: 18200, patients: "20M+", register: "https://esanjeevaniopd.in", desc: "India's national telemedicine service by MoHFW. Free consultations for patients. Open to all registered doctors.", forDoctors: ["Aadhaar-based verification", "NMC registration required", "Simple web interface", "Available pan-India"], highlight: "Government of India initiative — largest telemedicine network" },
  { id: 2, name: "Practo", govt: false, logo: "💊", fees: "₹200–800/consult", specialties: ["General Medicine", "Dermatology", "Gynaecology", "Orthopaedics", "Psychiatry", "Cardiology"], wait: "5–20 min", languages: ["English", "Hindi"], rating: 4.5, reviews: 42000, patients: "10M+", register: "https://practo.com/doctors", desc: "India's largest digital health platform. Doctors can list their practice and offer video/chat consultations.", forDoctors: ["Free listing", "₹0 platform fee (commission-based)", "Scheduling & payment handled", "Patient rating system"], highlight: "Best for building online patient base" },
  { id: 3, name: "Apollo 247", govt: false, logo: "🔵", fees: "₹299–999/consult", specialties: ["General Medicine", "Cardiology", "Neurology", "Endocrinology", "Dermatology"], wait: "10–30 min", languages: ["English", "Hindi", "Telugu", "Tamil"], rating: 4.6, reviews: 28000, patients: "5M+", register: "https://apollo247.com/doctors", desc: "Premium telemedicine by Apollo Hospitals Group. High patient volume in metros. Strong brand recognition.", forDoctors: ["Fixed consultation fee", "Apollo brand credibility", "EMR integration", "Follow-up scheduling"], highlight: "Premium segment — highest per-consultation earnings" },
  { id: 4, name: "Tata 1mg", govt: false, logo: "❤️", fees: "₹199–599/consult", specialties: ["General Medicine", "Dermatology", "Gynaecology", "Psychiatry", "Paediatrics"], wait: "15–40 min", languages: ["English", "Hindi"], rating: 4.4, reviews: 15000, patients: "3M+", register: "https://1mg.com/doctors", desc: "Tata group's health platform integrating medicines, diagnostics and doctor consultations in one place.", forDoctors: ["Instant payout", "Integrated pharmacy for prescriptions", "Simple mobile app", "Flexible schedule"], highlight: "Integrated pharmacy — prescriptions fulfilled instantly" },
  { id: 5, name: "MFine", govt: false, logo: "🟢", fees: "₹249–699/consult", specialties: ["General Medicine", "Dermatology", "Gynaecology", "Orthopaedics", "Gastroenterology"], wait: "Instant–15 min", languages: ["English", "Hindi", "Kannada"], rating: 4.5, reviews: 9800, patients: "2M+", register: "https://mfine.co/doctors", desc: "AI-first telemedicine platform. Uses AI to pre-screen patients before connecting to doctors, reducing consultation time.", forDoctors: ["AI pre-screening reduces consult time", "High volume in Bangalore", "₹150–500 per consult", "Mobile-first workflow"], highlight: "AI pre-screening = faster, more focused consultations" },
];

const GUIDELINES = [
  "Telemedicine Practice Guidelines 2020 (MoHFW) permit registered practitioners to practice telemedicine across India.",
  "Audio-only consultations are permitted for follow-up cases. Video is recommended for first consultations.",
  "Controlled substances (Schedule H1, X) cannot be prescribed via telemedicine — in-person visit required.",
  "Prescriptions must include doctor's name, qualification, registration number, date, and patient details.",
  "Maintain patient records of all telemedicine consultations for a minimum of 3 years.",
  "Emergency situations requiring in-person care must be referred immediately with clear guidance to the patient.",
];

export default function TelemedicineDirectory() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-14 pb-16">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(8,18,36,0.93) 0%,rgba(10,26,50,0.88) 100%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(0,194,168,0.15)", border: "1px solid rgba(0,194,168,0.25)", color: "#34D399" }}>
            <Monitor className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Telemedicine Integration Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-1px" }}>
            Telemedicine <span style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Platforms in India</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>Compare all major telemedicine platforms. Register as a doctor, set your schedule, and start earning online.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Cadus AI help button */}
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-4" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <Sparkles className="w-5 h-5 shrink-0" style={{ color: "#7C3AED" }} />
          <p className="text-sm flex-1" style={{ color: "#636366" }}>Not sure which platform to join? Let Cadus AI help you set up your telemedicine practice based on your specialty and location.</p>
          <Link href="/ai-assistant" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap" style={{ background: "#7C3AED", color: "#FFFFFF" }}>
            Ask Cadus AI <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Platforms */}
        <div className="space-y-4 mb-8">
          {PLATFORMS.map(p => (
            <div key={p.id} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: "#F2F2F7" }}>{p.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-base" style={{ color: "#1C1C1E" }}>{p.name}</h3>
                      {p.govt && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>Government</span>}
                    </div>
                    <p className="text-xs mb-2" style={{ color: "#636366" }}>{p.desc}</p>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                      ✨ {p.highlight}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Fees", value: p.fees },
                    { label: "Wait Time", value: p.wait },
                    { label: "Patients", value: p.patients },
                    { label: "Rating", value: `${p.rating}★ (${(p.reviews / 1000).toFixed(0)}k)` },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: "#F2F2F7" }}>
                      <div className="font-bold text-sm" style={{ color: "#1C1C1E" }}>{s.value}</div>
                      <div className="text-[10px]" style={{ color: "#AEAEB2" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.specialties.slice(0, 4).map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F2F2F7", color: "#636366" }}>{s}</span>)}
                  {p.specialties.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F2F2F7", color: "#AEAEB2" }}>+{p.specialties.length - 4}</span>}
                </div>

                <div className="flex gap-2">
                  <a href={p.register} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
                    Register as Doctor <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "#F2F2F7", color: "#636366" }}>
                    {expanded === p.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Details
                  </button>
                </div>
              </div>

              {expanded === p.id && (
                <div className="px-5 pb-5 pt-0">
                  <div className="rounded-xl p-4" style={{ background: "#F2F2F7" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "#1C1C1E" }}>For Doctors — Key Features:</p>
                    <ul className="space-y-1.5">
                      {p.forDoctors.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "#636366" }}>
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#00C2A8" }} />{f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <p className="text-xs font-semibold mb-1" style={{ color: "#1C1C1E" }}>Languages supported:</p>
                      <div className="flex flex-wrap gap-1">
                        {p.languages.map(l => <span key={l} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{l}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* MCI Guidelines */}
        <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
            <Globe className="w-4.5 h-4.5" style={{ color: "#007AFF" }} /> MCI / NMC Telemedicine Guidelines — Summary
          </h2>
          <ul className="space-y-3">
            {GUIDELINES.map((g, i) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "#636366" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{i + 1}</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
