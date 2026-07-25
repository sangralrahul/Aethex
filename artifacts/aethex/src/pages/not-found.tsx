import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { cadusUrl } from "@/lib/host";


export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#F2F2F7" }}
    >
      {/* Background blobs */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          left: "50%",
          transform: "translate(-60%, -55%)",
          background: "radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 400,
          height: 400,
          bottom: "10%",
          right: "5%",
          background: "radial-gradient(circle, rgba(0,194,168,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 flex flex-col items-center text-center max-w-lg w-full"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(60,60,67,0.1)",
          borderRadius: 28,
          boxShadow: "0 8px 48px rgba(0,0,0,0.08)",
          padding: "52px 40px 48px",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <img
            src={`${import.meta.env.BASE_URL}aethex-logo.jpg`}
            alt="Aethex logo"
            className="w-10 h-10 object-contain rounded-xl"
          />
          <span
            className="text-xl font-display font-bold tracking-tight"
            style={{ color: "#1C1C1E", letterSpacing: "-0.02em" }}
          >
            aethex
          </span>
        </Link>

        {/* 404 number */}
        <div
          className="font-display font-extrabold mb-4 leading-none select-none"
          style={{
            fontSize: "clamp(80px, 18vw, 120px)",
            background: "linear-gradient(135deg,#007AFF 0%,#00C2A8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        {/* Headline */}
        <h1
          className="text-2xl sm:text-3xl font-display font-bold mb-3"
          style={{ color: "#1C1C1E" }}
        >
          Looks like this page went off-chart
        </h1>

        {/* Sub-message */}
        <p className="text-base mb-10 max-w-sm" style={{ color: "#636366" }}>
          The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: "linear-gradient(135deg,#007AFF,#00C2A8)",
              color: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(0,122,255,0.28)",
            }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLElement).style.boxShadow =
                "0 6px 24px rgba(0,122,255,0.38)")
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 16px rgba(0,122,255,0.28)")
            }
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: "#F2F2F7",
              color: "#1C1C1E",
              border: "1px solid rgba(60,60,67,0.12)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "#E5E5EA";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "#F2F2F7";
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 w-full" style={{ borderTop: "1px solid rgba(60,60,67,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#AEAEB2" }}>
            Or explore
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Shop", href: "/shop" },
              { label: "Cadus AI", href: cadusUrl("/") },

              { label: "Study Hub", href: "/study-hub" },
              { label: "Drug Reference", href: "/drug-reference" },
              { label: "NEET-PG", href: "/neet-pg" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: "rgba(0,122,255,0.07)",
                  color: "#007AFF",
                  border: "1px solid rgba(0,122,255,0.12)",
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "rgba(0,122,255,0.14)")
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "rgba(0,122,255,0.07)")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="relative z-10 mt-8 text-xs" style={{ color: "#AEAEB2" }}>
        © 2026 Clavix Technologies Private Limited
      </p>
    </div>
  );
}
