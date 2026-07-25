import { Link, useLocation } from "wouter";
import { Heart, ShieldCheck, Truck, Twitter, Linkedin, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cadusUrl } from "@/lib/host";

const apiBase = () => import.meta.env.BASE_URL.replace(/\/$/, "");


function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${apiBase()}/api/newsletter/subscribe`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      setDone(true);
    } catch {} finally { setLoading(false); }
  };

  if (done) return (
    <div className="flex items-center gap-2 text-emerald-400 font-semibold"><CheckCircle2 className="w-5 h-5" /> You're subscribed! Weekly updates incoming.</div>
  );

  return (
    <form className="flex w-full md:w-auto gap-2" onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required
        className="rounded-xl px-4 py-3 flex-1 md:w-64 focus:outline-none"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }} />
      <button type="submit" disabled={loading}
        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-60"
        style={{ background: "#007AFF", color: "#FFFFFF" }}>
        {loading ? "..." : <><Send className="w-4 h-4" /> Subscribe</>}
      </button>
    </form>
  );
}

export function Footer() {
  const [location] = useLocation();
  if (location === "/ai-assistant") return null;
  return (
    <footer style={{ background: "#06060C", borderTop: "1px solid rgba(255,255,255,0.05)" }} className="pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">

        {/* Top row — wordmark + tagline */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 pb-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src={`${import.meta.env.BASE_URL}aethex-logo.jpg`} alt="AETHEX" className="w-8 h-8 rounded object-contain" style={{ filter: "brightness(1.1)" }} />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 22, letterSpacing: "0.1em", color: "#EEEEF8" }}>AETHEX</span>
            </Link>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.25)", maxWidth: 320, lineHeight: 1.7 }}>
              Medicine Made Effortless. India's platform for medical professionals — supplies, AI tools, and study resources.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Twitter className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-70" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <Linkedin className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
            </a>
          </div>
        </div>

        {/* Nav links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 16 }}>Shop</p>
            <ul className="space-y-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              {[
                { href: "/shop?category=stethoscopes", label: "Stethoscopes" },
                { href: "/shop?category=scrubs-clothing", label: "Scrubs & Aprons" },
                { href: "/shop?category=books", label: "Books & Notes" },
                { href: "/shop?category=surgical-instruments", label: "Surgical Instruments" },
                { href: "/shop", label: "View All Products" },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 16 }}>Study Hub</p>
            <ul className="space-y-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              <li><Link href="/study-hub" className="hover:text-white transition-colors">NEET PG Prep</Link></li>
              <li><Link href="/study-hub" className="hover:text-white transition-colors">USMLE Resources</Link></li>
              <li><Link href="/study-hub" className="hover:text-white transition-colors">FMGE Study</Link></li>
              <li><Link href="/ai-assistant" className="hover:text-white transition-colors">Cadus AI</Link></li>
              <li><Link href="/tools" className="hover:text-white transition-colors">Clinical Tools</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Medical Blog</Link></li>
            </ul>
          </div>

          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 16 }}>Company</p>
            <ul className="space-y-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              <li><a href="https://clavix.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About Us</a></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors">Medical News</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 16 }}>Support</p>
            <ul className="space-y-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              <li><Link href="/orders/track" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><a href="mailto:email@aethex.in" className="hover:text-white transition-colors">email@aethex.in</a></li>
              <li><Link href="/medical-disclaimer" className="hover:text-white transition-colors">Medical Disclaimer</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
            © 2026 Clavix Technologies Pvt Ltd. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/medical-disclaimer" className="hover:text-white transition-colors">Medical Disclaimer</Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <span>A product of</span>
          <a href="https://clavix.in" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">Clavix Technologies Pvt Ltd</a>
        </div>
      </div>
    </footer>
  );
}
