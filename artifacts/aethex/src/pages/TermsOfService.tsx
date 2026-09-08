import { useEffect } from "react";
import { Link } from "wouter";
import { FileText, ChevronRight } from "lucide-react";

function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); (m as HTMLMetaElement).name = "description"; document.head.appendChild(m); }
    (m as HTMLMetaElement).content = description;
  }, [title, description]);
}

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using AETHEX, you agree to be bound by these Terms of Service.",
      "If you do not agree, you must discontinue use of the platform immediately.",
      "These terms apply to all users: medical students, doctors, healthcare professionals, and visitors.",
      "We reserve the right to update these terms at any time with reasonable notice.",
    ],
  },
  {
    title: "2. Use of the Platform",
    content: [
      "AETHEX is a platform for medical supplies, clinical tools, and AI-assisted medical education.",
      "You must be at least 18 years old to create an account and make purchases.",
      "You agree not to use the platform for any unlawful, harmful, or fraudulent purpose.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You must provide accurate, current, and complete information during registration.",
    ],
  },
  {
    title: "3. Medical Information Disclaimer",
    content: [
      "Cadus AI and all clinical tools on AETHEX are for **educational and informational purposes only**.",
      "No content on AETHEX constitutes professional medical advice, diagnosis, or treatment.",
      "Always consult a qualified healthcare professional for medical decisions.",
      "Do not disregard professional medical advice based on information from this platform.",
      "In a medical emergency, contact emergency services (108) immediately.",
    ],
  },
  {
    title: "4. Medical Supply Purchases",
    content: [
      "All products sold on AETHEX are sourced from verified, authorised distributors.",
      "Prices are subject to change without notice. The price at time of order confirmation is binding.",
      "We reserve the right to cancel orders in cases of pricing errors or stock unavailability.",
      "Returns and refunds are governed by our 7-Day Return Policy.",
      "Prescription-only products may require verification of medical credentials.",
    ],
  },
  {
    title: "5. Intellectual Property",
    content: [
      "All content on AETHEX — including text, images, tool interfaces, and AI outputs — is owned by Clavix Technologies Pvt Ltd or its licensors.",
      "You may not reproduce, distribute, or create derivative works without written permission.",
      "AI-generated outputs from Cadus AI are provided for personal use only.",
      "The AETHEX and Cadus AI names, logos, and trademarks are proprietary to Clavix Technologies Pvt Ltd.",
    ],
  },
  {
    title: "6. User Content",
    content: [
      "By submitting content (reviews, comments, queries), you grant us a non-exclusive, royalty-free licence to use it for platform improvement.",
      "You must not post content that is defamatory, abusive, or violates third-party rights.",
      "We reserve the right to remove content that violates these terms without notice.",
    ],
  },
  {
    title: "7. Limitation of Liability",
    content: [
      "AETHEX is provided 'as is' without warranties of any kind, express or implied.",
      "To the maximum extent permitted by law, Clavix Technologies Pvt Ltd is not liable for:",
      "— Indirect, incidental, or consequential damages arising from use of the platform.",
      "— Medical outcomes resulting from reliance on AI-generated information.",
      "— Loss of data, revenue, or business due to platform unavailability.",
      "Our total liability shall not exceed the amount paid by you in the preceding 3 months.",
    ],
  },
  {
    title: "8. Governing Law",
    content: [
      "These terms are governed by the laws of the Republic of India.",
      "Disputes shall be subject to the exclusive jurisdiction of courts in India.",
      "We encourage resolution of disputes through direct communication before legal action.",
    ],
  },
  {
    title: "9. Termination",
    content: [
      "We may suspend or terminate your account for violation of these terms.",
      "You may delete your account at any time through Account Settings.",
      "On termination, your right to access the platform ceases immediately.",
      "Provisions relating to IP, liability, and governing law survive termination.",
    ],
  },
  {
    title: "10. Contact",
    content: [
      "Clavix Technologies Pvt Ltd",
      "Email: email@aethex.in",
      "For legal queries: legal@clavixtech.in",
      "Response time: within 5 business days.",
    ],
  },
];

export default function TermsOfService() {
  useSEO(
    "Terms of Service — AETHEX | Clavix Technologies Pvt Ltd",
    "Read the Terms of Service for AETHEX, operated by Clavix Technologies Pvt Ltd — covering platform use, medical disclaimers, purchases, and liability.",
  );

  return (
    <div className="min-h-screen " style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="py-14" style={{ background: "linear-gradient(160deg,#EBF4FF 0%,#F0F8FF 50%,#E8F5F3 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#636366" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span style={{ color: "#007AFF" }}>Terms of Service</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,122,255,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#007AFF" }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold" style={{ color: "#1C1C1E" }}>Terms of Service</h1>
          </div>
          <p className="text-base" style={{ color: "#636366" }}>
            Last updated: <strong>1 April 2026</strong> · Effective immediately
          </p>
          <p className="mt-3 text-base leading-relaxed" style={{ color: "#636366" }}>
            Please read these Terms of Service carefully before using AETHEX, operated by Clavix Technologies Pvt Ltd. These terms govern your use of our medical store, Cadus AI assistant, and all clinical tools.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {SECTIONS.map(sec => (
          <div key={sec.title} className="rounded-2xl p-6 sm:p-8"
            style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
            <h2 className="text-xl font-display font-bold mb-4" style={{ color: "#1C1C1E" }}>{sec.title}</h2>
            <ul className="space-y-2.5">
              {sec.content.map((line, i) => {
                const boldified = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
                const isDash = line.startsWith("—");
                return (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#3A3A3C" }}>
                    {isDash ? (
                      <span className="shrink-0 mt-0.5 font-bold" style={{ color: "#007AFF" }}>—</span>
                    ) : (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#007AFF" }} />
                    )}
                    <span dangerouslySetInnerHTML={{ __html: boldified }} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex flex-wrap gap-4 text-sm pt-4" style={{ color: "#636366" }}>
          <a href="/privacy-policy.html" className="hover:underline" style={{ color: "#007AFF" }}>Privacy Policy</a>
          <a href="/medical-disclaimer.html" className="hover:underline" style={{ color: "#007AFF" }}>Medical Disclaimer</a>
          <Link href="/contact" className="hover:underline" style={{ color: "#007AFF" }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
