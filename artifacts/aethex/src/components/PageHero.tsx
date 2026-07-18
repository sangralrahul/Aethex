import { type ReactNode } from "react";
import { Link } from "wouter";
import { Home, ChevronLeft } from "lucide-react";

interface PageHeroProps {
  tag?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}

/**
 * PageHero — professional marketplace-style hero shared across pages.
 * Matches the homepage HeroMarketplace theme:
 *  - deep navy → indigo gradient body
 *  - teal (#00C2A8) accent orbs
 *  - amber (#FFB84A) eyebrow chip
 *  - Cormorant Garamond title, Plus Jakarta Sans body
 */
export function PageHero({ tag, title, subtitle, icon, right }: PageHeroProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(120deg, #0F1729 0%, #17325C 55%, #1E4A8C 100%)",
        minHeight: 200,
      }}
    >
      {/* soft teal glow — homepage's brand accent */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          right: "-6%",
          top: "-30%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,194,168,0.28) 0%, transparent 65%)",
          filter: "blur(24px)",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: "-8%",
          bottom: "-40%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30,74,140,0.55) 0%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />
      {/* subtle fine grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.06,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      {/* warm bottom fade into paper background */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(245,243,238,0.35))",
        }}
      />

      {/* Top: back-home pill */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1 flex items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group active:scale-95 transition-transform"
          style={{ textDecoration: "none" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all group-hover:bg-white/15"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              backdropFilter: "blur(8px)",
              minHeight: 36,
            }}
          >
            <ChevronLeft
              className="w-4 h-4 shrink-0"
              style={{ color: "rgba(255,255,255,0.9)" }}
            />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 500,
                fontSize: "1.05rem",
                letterSpacing: "0.07em",
                color: "#FFFFFF",
              }}
            >
              AETHEX
            </span>
            <Home
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "rgba(255,255,255,0.55)" }}
            />
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          {icon && (
            <div
              className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(140deg, rgba(0,194,168,0.28), rgba(0,194,168,0.08))",
                border: "1px solid rgba(0,194,168,0.35)",
                boxShadow:
                  "0 10px 30px rgba(0,194,168,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {tag && (
              <span
                className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                style={{
                  background: "#FFB84A",
                  color: "#0F1729",
                  letterSpacing: "0.15em",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#0F1729",
                  }}
                />
                {tag}
              </span>
            )}
            <h1
              className="leading-tight tracking-tight truncate"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: "clamp(2rem, 4.4vw, 3rem)",
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-2 text-sm sm:text-[15px]"
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  lineHeight: 1.55,
                  maxWidth: 640,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {right && <div className="w-full sm:w-auto shrink-0">{right}</div>}
      </div>
    </div>
  );
}
