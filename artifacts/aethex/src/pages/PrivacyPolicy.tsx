import { useEffect } from "react";
import { Link } from "wouter";
import { Shield, ChevronRight } from "lucide-react";

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
    title: "1. Information We Collect",
    content: [
      "**Account Information:** Name, email address, and password when you register.",
      "**Order Data:** Shipping address, phone number, and purchase history for medical supplies.",
      "**Usage Data:** Pages visited, tools used, and interactions with Cadus AI — used to improve our services.",
      "**Device Information:** Browser type, IP address, and device identifiers for security purposes.",
      "**Health Queries:** Anonymised queries submitted to Cadus AI to improve model accuracy. We do not link these to personal identifiers.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "To process and fulfil your medical supply orders.",
      "To operate and improve Cadus AI and all clinical tools.",
      "To send order confirmations, shipping updates, and support messages.",
      "To send optional newsletters and medical insights (you can unsubscribe at any time).",
      "To comply with applicable Indian laws and regulations.",
      "To detect, prevent, and investigate fraud or security incidents.",
    ],
  },
  {
    title: "3. Sharing of Information",
    content: [
      "**We do not sell your personal data.**",
      "We share data with logistics partners (e.g., Shiprocket, Delhivery) solely to fulfil deliveries.",
      "We share data with payment processors (Razorpay, Stripe) for secure transactions.",
      "We may disclose data to government or regulatory authorities when required by Indian law.",
      "Anonymised, aggregated analytics may be shared with research partners.",
    ],
  },
  {
    title: "4. Data Storage & Security",
    content: [
      "All data is stored on secure servers hosted in India and the European Union.",
      "We use industry-standard encryption (TLS 1.3) for data in transit.",
      "Passwords are hashed using bcrypt and never stored in plain text.",
      "Access to personal data is restricted to authorised personnel only.",
      "We retain account data for as long as your account is active, or as required by law.",
    ],
  },
  {
    title: "5. Your Rights",
    content: [
      "**Right to Access:** Request a copy of the personal data we hold about you.",
      "**Right to Correction:** Ask us to correct inaccurate or incomplete information.",
      "**Right to Deletion:** Request deletion of your account and associated data.",
      "**Right to Portability:** Receive your data in a structured, machine-readable format.",
      "**Right to Opt-Out:** Unsubscribe from marketing communications at any time.",
      "To exercise any of these rights, email us at email@aethex.in.",
    ],
  },
  {
    title: "6. Cookies",
    content: [
      "We use essential cookies for authentication and session management.",
      "We use analytics cookies (anonymised) to understand how users interact with the platform.",
      "We do not use third-party advertising or tracking cookies.",
      "You can disable cookies in your browser settings — this may affect certain features.",
    ],
  },
  {
    title: "7. Children's Privacy",
    content: [
      "This platform is intended for medical professionals, students aged 18+, and healthcare workers.",
      "We do not knowingly collect data from individuals under 18 years of age.",
      "If we discover such data has been collected, we will delete it promptly.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time.",
      "Material changes will be communicated by email or a prominent notice on the platform.",
      "Continued use of the platform after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "9. Contact",
    content: [
      "Data Controller: Clavix Technologies Pvt Ltd",
      "Email: email@aethex.in",
      "Registered Address: India",
      "For any privacy concerns, please contact us within 30 days of an incident.",
    ],
  },
];

export default function PrivacyPolicy() {
  useSEO(
    "Privacy Policy — AETHEX | Clavix Technologies Pvt Ltd",
    "Read the AETHEX Privacy Policy to understand how Clavix Technologies Pvt Ltd collects, uses, and protects your personal data.",
  );

  return (
    <div className="min-h-screen " style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="py-14" style={{ background: "linear-gradient(160deg,#EBF4FF 0%,#F0F8FF 50%,#E8F5F3 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#636366" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span style={{ color: "#007AFF" }}>Privacy Policy</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,122,255,0.1)" }}>
              <Shield className="w-5 h-5" style={{ color: "#007AFF" }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold" style={{ color: "#1C1C1E" }}>Privacy Policy</h1>
          </div>
          <p className="text-base" style={{ color: "#636366" }}>
            Last updated: <strong>1 April 2026</strong> · Effective immediately
          </p>
          <p className="mt-3 text-base leading-relaxed" style={{ color: "#636366" }}>
            Clavix Technologies Pvt Ltd ("we", "our", "us") operates the AETHEX platform, including its medical store, Cadus AI assistant, and clinical tools. This Privacy Policy describes how we collect, use, and safeguard your information.
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
                return (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#3A3A3C" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#007AFF" }} />
                    <span dangerouslySetInnerHTML={{ __html: boldified }} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Footer links */}
        <div className="flex flex-wrap gap-4 text-sm pt-4" style={{ color: "#636366" }}>
          <a href="/terms-of-service.html" className="hover:underline" style={{ color: "#007AFF" }}>Terms of Service</a>
          <a href="/medical-disclaimer.html" className="hover:underline" style={{ color: "#007AFF" }}>Medical Disclaimer</a>
          <Link href="/contact" className="hover:underline" style={{ color: "#007AFF" }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
