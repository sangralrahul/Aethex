import { useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, ChevronRight, Stethoscope, Brain, Phone } from "lucide-react";
import { cadusUrl } from "@/lib/host";


function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); (m as HTMLMetaElement).name = "description"; document.head.appendChild(m); }
    (m as HTMLMetaElement).content = description;
  }, [title, description]);
}

export default function MedicalDisclaimer() {
  useSEO(
    "Medical Disclaimer — AETHEX | Cadus AI",
    "AETHEX Medical Disclaimer: AI-generated content is for educational purposes only and is not a substitute for professional medical advice.",
  );

  return (
    <div className="min-h-screen " style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="py-14" style={{ background: "linear-gradient(160deg,#FFF3E0 0%,#FFF8F0 50%,#FFF0E8 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#636366" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span style={{ color: "#FF9500" }}>Medical Disclaimer</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,149,0,0.12)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#FF9500" }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold" style={{ color: "#1C1C1E" }}>Medical Disclaimer</h1>
          </div>
          <p className="text-base" style={{ color: "#636366" }}>
            Last updated: <strong>1 April 2026</strong>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">

        {/* Primary notice */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: "#FFF3CD", border: "1px solid rgba(255,149,0,0.3)" }}>
          <p className="text-lg font-bold mb-3" style={{ color: "#1C1C1E" }}>Important Notice</p>
          <p className="text-base leading-relaxed" style={{ color: "#3A3A3C" }}>
            This platform provides AI-generated medical information for <strong>educational purposes only</strong> and is <strong>not a substitute for professional medical advice, diagnosis, or treatment</strong>. Always seek the guidance of a qualified healthcare professional with any questions you may have regarding a medical condition.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Stethoscope, color: "#007AFF", title: "Not Medical Advice", body: "Content from Cadus AI and all clinical tools is informational only. It does not constitute clinical advice from a licensed physician." },
            { icon: Brain, color: "#AF52DE", title: "AI Limitations", body: "AI models can make errors. Outputs may be incomplete, outdated, or contextually incorrect. Always verify clinical information from authoritative sources." },
            { icon: Phone, color: "#FF3B30", title: "Emergency — Call 108", body: "In a medical emergency, do not use this platform. Call emergency services (108) immediately or go to the nearest hospital." },
          ].map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="font-bold text-sm mb-1.5" style={{ color: "#1C1C1E" }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "#636366" }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Detailed sections */}
        {[
          {
            title: "Scope of This Disclaimer",
            items: [
              "This disclaimer applies to all content on AETHEX, including Cadus AI chat responses, clinical tool outputs, blog articles, and medical news.",
              "It applies regardless of whether you access the platform as a registered user or visitor.",
              "This disclaimer is subject to change; continued use of the platform indicates acceptance.",
            ],
          },
          {
            title: "Cadus AI — Specific Limitations",
            items: [
              "Cadus AI is a large-language model assistant. It does not have access to your personal medical records or history.",
              "AI outputs are probabilistic and may not reflect the latest clinical guidelines.",
              "Drug dosages, interactions, and protocols provided by Cadus AI must be verified against current pharmacopoeia and senior clinical guidance.",
              "Cadus AI should not be used for making time-critical clinical decisions in emergency settings.",
              "Cadus AI is not a licensed medical practitioner and does not establish a doctor–patient relationship.",
            ],
          },
          {
            title: "Clinical Tools",
            items: [
              "Tools such as the Symptom Checker, Drug Interaction Checker, BMI Calculator, and Dosage Calculator are decision-support aids only.",
              "Results from these tools must be interpreted in the context of a full clinical assessment by a qualified professional.",
              "Reference ranges and dosage guidelines may vary by institution, region, and individual patient factors.",
            ],
          },
          {
            title: "Regulatory Compliance",
            items: [
              "AETHEX operates in compliance with the Indian Information Technology Act, 2000 and applicable health regulations.",
              "We do not store or transmit individually identifiable health information (IIHI) as defined under applicable privacy laws.",
              "Our platform is not a Telemedicine provider under the Telemedicine Practice Guidelines, 2020.",
            ],
          },
          {
            title: "Third-Party Content",
            items: [
              "Blog articles and medical news on AETHEX may reference third-party sources. We do not guarantee the accuracy of external content.",
              "Links to third-party websites are provided for convenience only and do not constitute endorsement.",
            ],
          },
          {
            title: "Contact & Concerns",
            items: [
              "If you have concerns about the accuracy of medical information on our platform, please contact us at email@aethex.in.",
              "We are committed to maintaining the highest standards of clinical accuracy and will respond within 5 business days.",
            ],
          },
        ].map(sec => (
          <div key={sec.title} className="rounded-2xl p-6 sm:p-8" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
            <h2 className="text-xl font-display font-bold mb-4" style={{ color: "#1C1C1E" }}>{sec.title}</h2>
            <ul className="space-y-2.5">
              {sec.items.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#3A3A3C" }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FF9500" }} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* CTA */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4"
          style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.06),rgba(0,194,168,0.06))", border: "1px solid rgba(0,122,255,0.15)" }}>
          <div className="flex-1">
            <p className="font-bold text-base" style={{ color: "#1C1C1E" }}>Ready to use Cadus AI responsibly?</p>
            <p className="text-sm mt-1" style={{ color: "#636366" }}>Use our clinical tools as a reference — not a replacement — for professional judgement.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/tools" className="px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF" }}>
              Explore Tools
            </Link>
            <Link href="/ai-assistant" className="px-5 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{ background: "rgba(120,120,128,0.12)", color: "#1C1C1E" }}>
              Open Cadus AI
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm pt-2" style={{ color: "#636366" }}>
          <Link href="/privacy-policy" className="hover:underline" style={{ color: "#007AFF" }}>Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:underline" style={{ color: "#007AFF" }}>Terms of Service</Link>
          <Link href="/contact" className="hover:underline" style={{ color: "#007AFF" }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
