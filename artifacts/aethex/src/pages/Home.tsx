import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Activity, BrainCircuit, Sparkles, Shirt, FlaskConical, BookOpen,
  Stethoscope, Scissors, HeartPulse, Shield, Quote, GraduationCap, FileText,
  Microscope, PenLine, Trophy, ShieldCheck, Truck, RotateCcw, Receipt, Send,
  MessageSquare, Search, Image, Zap, Wrench, ClipboardList, CheckCircle2,
  Smartphone, Users, CheckCheck, Bot, ChevronRight, Pill, Plus, Syringe,
  Bone, Thermometer, Eye, Baby, Brain, Store, Calculator,
  Wind, Droplets, Waves, ScanLine, Heart, AlertTriangle, Scan, Dna,
  Gauge, Dumbbell, Pipette, Apple, HeartHandshake, Radiation, TestTube2,
  Rss, Globe, Clock, ExternalLink, CalendarCheck, BadgeCheck, Star, ArrowUpRight
} from "lucide-react";
import { getTodaysCase } from "@/data/clinicalCases";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { useSession } from "@/hooks/use-session";
import { useAddToCart } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DailyMCQWidget } from "@/components/DailyMCQWidget";
import { formatINR } from "@/lib/utils";

function HeroAIInput() {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/ai-assistant?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative rounded-2xl transition-all duration-300 group"
        style={{
          background: "#FFFFFF",
          border: "1.5px solid rgba(0,0,0,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)",
        }}
        onFocus={() => {}}
      >
        <div className="flex items-center px-5 py-4 gap-4">
          <Sparkles className="w-5 h-5 shrink-0" style={{ color: "#00C2A8" }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask Cadus AI — symptom, drug, calculation, differential…"
            className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-gray-400"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              color: "#0A0A0F",
            }}
            onFocus={e => {
              const wrapper = e.currentTarget.closest("div[class*='rounded-2xl']") as HTMLElement | null;
              if (wrapper) {
                wrapper.style.borderColor = "rgba(0,194,168,0.45)";
                wrapper.style.boxShadow = "0 0 0 4px rgba(0,194,168,0.08), 0 4px 24px rgba(0,0,0,0.07)";
              }
            }}
            onBlur={e => {
              const wrapper = e.currentTarget.closest("div[class*='rounded-2xl']") as HTMLElement | null;
              if (wrapper) {
                wrapper.style.borderColor = "rgba(0,0,0,0.1)";
                wrapper.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)";
              }
            }}
          />
          <button type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97] shrink-0"
            style={{
              background: "#00C2A8",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 2px 12px rgba(0,194,168,0.3)",
            }}>
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </form>
  );
}

const categoryIconMap: Record<string, React.ElementType> = {
  Shirt, FlaskConical, BookOpen, Stethoscope, Scissors, Activity, Shield, HeartPulse,
  Pill, Plus, Syringe, Bone, Thermometer, Eye, Baby, Brain, BrainCircuit, Microscope,
  Wind, Droplets, Waves, ScanLine, Heart, AlertTriangle, Scan, Dna,
  Gauge, Dumbbell, Pipette, Apple, HeartHandshake, Radiation, TestTube2, Trophy, Zap
};

// ── Shop-by-Specialty animated backgrounds ────────────────────
function CategoryAnimBg({ slug }: { slug: string }) {
  const wrap: React.CSSProperties = { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 };

  if (slug === "stethoscopes") return (
    <div style={wrap}>
      <svg viewBox="0 0 240 70" style={{ position: "absolute", left: 0, bottom: "22%", width: "100%", opacity: 0.13 }} preserveAspectRatio="none">
        <path d="M-10,35 L20,35 L30,12 L40,58 L48,35 L70,35 L78,14 L86,56 L92,35 L130,35 L140,12 L150,58 L158,35 L180,35 L188,14 L196,56 L202,35 L250,35"
          fill="none" stroke="#00C2A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="560" strokeDashoffset="560"
          style={{ animation: "catECGDraw 3s ease-in-out infinite" }} />
      </svg>
      <div style={{ position: "absolute", left: "8%", bottom: "22%", width: 7, height: 7, borderRadius: "50%", background: "rgba(0,194,168,0.65)", transform: "translateY(3px)", animation: "catNeuralPulse 1.5s ease-in-out infinite" }} />
    </div>
  );

  if (slug === "cardiac-care") return (
    <div style={wrap}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "52%", width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(244,63,94,0.55)", marginLeft: -14, marginTop: -14, animation: `catPulseRing 3s cubic-bezier(0,0,0.2,1) ${i * 0.75}s infinite` }} />
      ))}
      <svg viewBox="0 0 220 60" style={{ position: "absolute", left: 0, bottom: "18%", width: "100%", opacity: 0.12 }}>
        <path d="M-10,30 L22,30 L32,10 L42,50 L50,30 L70,30 L78,12 L86,48 L92,30 L124,30 L134,10 L144,50 L152,30 L172,30 L180,12 L188,48 L194,30 L230,30"
          fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="560" strokeDashoffset="560"
          style={{ animation: "catECGDraw 2.6s ease-in-out 0.4s infinite" }} />
      </svg>
    </div>
  );

  if (slug === "neurology") return (
    <div style={wrap}>
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}>
        {([[28,38,82,70],[82,70,145,48],[82,70,105,128],[28,38,62,128],[62,128,105,128],[105,128,162,142],[145,48,172,98],[172,98,162,142],[62,128,48,172],[105,128,122,175]] as number[][]).map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7C3AED" strokeWidth="1" style={{ animation: `catNeuralPulse 2.8s ease-in-out ${i*0.28}s infinite` }} />
        ))}
        {([[28,38,4.5,0],[82,70,6,0.4],[145,48,3.5,0.8],[62,128,4,0.2],[105,128,5,0.6],[162,142,3,1.0],[172,98,3.5,0.3],[48,172,3,0.7],[122,175,3,0.9]] as number[][]).map(([cx,cy,r,d],i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#7C3AED" style={{ animation: `catNeuralPulse 2.8s ease-in-out ${d}s infinite` }} />
        ))}
      </svg>
    </div>
  );

  if (slug === "equipment") return (
    <div style={wrap}>
      <svg viewBox="0 0 100 100" style={{ position: "absolute", right: "-14%", bottom: "-14%", width: "62%", height: "62%", opacity: 0.09, overflow: "visible" }}>
        <g style={{ transformOrigin: "50px 50px", animation: "catGearSpin 14s linear infinite" }}>
          <circle cx="50" cy="50" r="28" fill="none" stroke="#64748B" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="13" fill="none" stroke="#64748B" strokeWidth="1.5" />
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
            <rect key={a} x="46" y="14" width="8" height="11" rx="1.5" fill="#64748B" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
      </svg>
      <svg viewBox="0 0 60 60" style={{ position: "absolute", left: "-8%", top: "-8%", width: "38%", height: "38%", opacity: 0.09, overflow: "visible" }}>
        <g style={{ transformOrigin: "30px 30px", animation: "catGearSpin 9s linear infinite reverse" }}>
          <circle cx="30" cy="30" r="16" fill="none" stroke="#64748B" strokeWidth="2" />
          <circle cx="30" cy="30" r="7" fill="none" stroke="#64748B" strokeWidth="1.5" />
          {[0,45,90,135,180,225,270,315].map(a => (
            <rect key={a} x="27" y="8" width="6" height="9" rx="1" fill="#64748B" transform={`rotate(${a} 30 30)`} />
          ))}
        </g>
      </svg>
    </div>
  );

  if (slug === "surgical") return (
    <div style={wrap}>
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }}>
        <circle cx="100" cy="100" r="52" fill="none" stroke="#EF4444" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="28" fill="none" stroke="#EF4444" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="4" fill="#EF4444" />
        <line x1="100" y1="36" x2="100" y2="70" stroke="#EF4444" strokeWidth="0.8" />
        <line x1="100" y1="130" x2="100" y2="164" stroke="#EF4444" strokeWidth="0.8" />
        <line x1="36" y1="100" x2="70" y2="100" stroke="#EF4444" strokeWidth="0.8" />
        <line x1="130" y1="100" x2="164" y2="100" stroke="#EF4444" strokeWidth="0.8" />
        <path d="M14,14 L14,36 M14,14 L36,14" fill="none" stroke="#EF4444" strokeWidth="1.2" />
        <path d="M186,14 L186,36 M186,14 L164,14" fill="none" stroke="#EF4444" strokeWidth="1.2" />
        <path d="M14,186 L14,164 M14,186 L36,186" fill="none" stroke="#EF4444" strokeWidth="1.2" />
        <path d="M186,186 L186,164 M186,186 L164,186" fill="none" stroke="#EF4444" strokeWidth="1.2" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, height: 1.5, background: "linear-gradient(to right, transparent, rgba(239,68,68,0.55), transparent)", animation: "catScan 3.2s ease-in-out infinite" }} />
    </div>
  );

  if (slug === "books") return (
    <div style={wrap}>
      {[{l:"18%",delay:0,dur:3.6},{l:"46%",delay:1.3,dur:4},{l:"72%",delay:0.7,dur:3.3},{l:"32%",delay:2.1,dur:3.9},{l:"60%",delay:1.7,dur:4.2}].map((p,i) => (
        <div key={i} style={{ position: "absolute", left: p.l, bottom: "-10%", width: 14, height: 18, borderRadius: 2, background: "rgba(217,119,6,0.2)", border: "1px solid rgba(217,119,6,0.3)", animation: `catFloatUp ${p.dur}s ease-in-out ${p.delay}s infinite` }} />
      ))}
      <svg viewBox="0 0 130 90" style={{ position: "absolute", bottom: "10%", right: "4%", width: "58%", opacity: 0.08 }}>
        <path d="M65,8 Q40,10 12,20 L12,75 Q40,65 65,63 Q90,65 118,75 L118,20 Q90,10 65,8 Z" fill="none" stroke="#D97706" strokeWidth="2" />
        <line x1="65" y1="8" x2="65" y2="63" stroke="#D97706" strokeWidth="1.5" />
        <line x1="22" y1="32" x2="60" y2="30" stroke="#D97706" strokeWidth="1" />
        <line x1="22" y1="43" x2="60" y2="41" stroke="#D97706" strokeWidth="1" />
        <line x1="70" y1="30" x2="108" y2="32" stroke="#D97706" strokeWidth="1" />
        <line x1="70" y1="41" x2="108" y2="43" stroke="#D97706" strokeWidth="1" />
        <line x1="22" y1="54" x2="60" y2="52" stroke="#D97706" strokeWidth="0.8" />
        <line x1="70" y1="52" x2="108" y2="54" stroke="#D97706" strokeWidth="0.8" />
      </svg>
    </div>
  );

  if (slug === "scrubs") return (
    <div style={wrap}>
      <div style={{ position: "absolute", inset: "-100%", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(59,130,246,0.07) 18px, rgba(59,130,246,0.07) 20px)", animation: "catDiagStripe 3s linear infinite" }} />
      <svg viewBox="0 0 130 140" style={{ position: "absolute", bottom: "-8%", right: "-2%", width: "55%", opacity: 0.08 }}>
        <path d="M40,18 L18,42 L38,48 L38,112 L92,112 L92,48 L112,42 L90,18 Q65,28 40,18 Z" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <path d="M40,18 Q52,10 65,10 Q78,10 90,18" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
        <line x1="45" y1="65" x2="85" y2="65" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="45" y1="78" x2="85" y2="78" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 3" />
      </svg>
    </div>
  );

  if (slug === "orthopaedic") return (
    <div style={wrap}>
      <svg viewBox="0 0 200 220" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.11, animation: "catBoneGlow 4.5s ease-in-out infinite" }}>
        <path d="M80,22 Q98,18 104,34 L100,72 L112,108 L112,152 L100,185 Q96,198 80,198 Q64,198 60,185 L48,152 L48,108 L60,72 L56,34 Q62,18 80,22 Z" fill="none" stroke="#0EA5E9" strokeWidth="1.8" />
        <circle cx="122" cy="36" r="22" fill="none" stroke="#0EA5E9" strokeWidth="1.8" />
        <line x1="60" y1="90" x2="100" y2="90" stroke="#0EA5E9" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1="60" y1="150" x2="100" y2="150" stroke="#0EA5E9" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1="66" y1="100" x2="94" y2="140" stroke="#0EA5E9" strokeWidth="0.8" />
        <line x1="94" y1="100" x2="66" y2="140" stroke="#0EA5E9" strokeWidth="0.8" />
        <circle cx="80" cy="120" r="5" fill="none" stroke="#0EA5E9" strokeWidth="1" />
      </svg>
    </div>
  );

  return null;
}

// ── Specialty catalogue metadata (color must mirror CategoryAnimBg) ──
const SPECIALTY_META: Record<string, { color: string; bg: string; description: string }> = {
  "stethoscopes": { color: "#00C2A8", bg: "rgba(0,194,168,0.07)",   description: "Auscultation & diagnostic instruments" },
  "cardiac-care": { color: "#F43F5E", bg: "rgba(244,63,94,0.07)",   description: "ECG, BP monitors & cardiac devices" },
  "neurology":    { color: "#7C3AED", bg: "rgba(124,58,237,0.07)",  description: "Neurological assessment & imaging" },
  "equipment":    { color: "#64748B", bg: "rgba(100,116,139,0.07)", description: "Clinical & diagnostic equipment" },
  "surgical":     { color: "#EF4444", bg: "rgba(239,68,68,0.07)",   description: "Instruments, PPE & procedure kits" },
  "books":        { color: "#D97706", bg: "rgba(217,119,6,0.07)",   description: "Textbooks, references & study guides" },
  "scrubs":       { color: "#3B82F6", bg: "rgba(59,130,246,0.07)",  description: "Clinical wear & professional uniforms" },
  "orthopaedic":  { color: "#0EA5E9", bg: "rgba(14,165,233,0.07)",  description: "Braces, rehabilitation & ortho tools" },
};
const SPECIALTY_ORDER = ["stethoscopes","cardiac-care","neurology","equipment","surgical","books","scrubs","orthopaedic"];

function CatalogueCard({ product, color }: { product: any; color: string }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  return (
    <Link href={`/products/${product.id}`} className="group block rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Colored top accent bar */}
      <div style={{ height: 3, background: color, flexShrink: 0 }} />

      {/* Image */}
      <div style={{ background: "#F7F5F1", aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80"; }}
        />
        {discount > 0 && (
          <span style={{ position: "absolute", top: 10, left: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "#FFFFFF", background: color, borderRadius: 4, padding: "2px 7px", letterSpacing: "0.05em" }}>
            -{discount}%
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        {product.brand && (
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(0,0,0,0.32)", marginBottom: 5 }}>{product.brand}</p>
        )}
        <h4 className="line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#0A0A0F", lineHeight: 1.4, marginBottom: 12 }}>
          {product.name}
        </h4>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "#0A0A0F" }}>{formatINR(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(0,0,0,0.3)", textDecoration: "line-through", marginLeft: 6 }}>{formatINR(product.originalPrice)}</span>
            )}
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color, letterSpacing: "0.1em", textTransform: "uppercase" }} className="group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

function SpecialtyCatalogue({ categories }: { categories: any[] }) {
  const [activeSlug, setActiveSlug] = useState("stethoscopes");
  const { data: productsData, isLoading } = useListProducts({ category: activeSlug, limit: 6 });
  const meta = SPECIALTY_META[activeSlug] || SPECIALTY_META["stethoscopes"];
  const products = (productsData?.products || []).slice(0, 6);
  const activeCat = categories.find((c: any) => c.slug === activeSlug);

  return (
    <div style={{ marginTop: 32 }}>
      {/* ── Tab bar ─────────────────────────────────── */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.08)", gap: 0, minWidth: "max-content" }}>
          {SPECIALTY_ORDER.map(slug => {
            const cat = categories.find((c: any) => c.slug === slug);
            const m = SPECIALTY_META[slug];
            const Icon = categoryIconMap[cat?.iconName as string] || Activity;
            const isActive = slug === activeSlug;
            return (
              <button key={slug} onClick={() => setActiveSlug(slug)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 18px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: isActive ? 600 : 400,
                  color: isActive ? m.color : "rgba(0,0,0,0.38)",
                  borderBottom: isActive ? `2px solid ${m.color}` : "2px solid transparent",
                  marginBottom: -1, background: "transparent", border: "none", cursor: "pointer",
                  transition: "color 0.18s",
                  borderBottomStyle: "solid", borderBottomWidth: 2, borderBottomColor: isActive ? m.color : "transparent",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.65)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.38)"; }}
              >
                <Icon style={{ width: 13, height: 13, flexShrink: 0, color: isActive ? m.color : undefined }} />
                {cat?.name || slug}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Catalogue meta row ───────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 18px", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FFFFFF", background: meta.color, borderRadius: 4, padding: "3px 8px" }}>
            {activeCat?.productCount ? `${activeCat.productCount} items` : "Catalogue"}
          </span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            {meta.description}
          </span>
        </div>
        <Link href={`/shop?category=${activeSlug}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: meta.color, fontWeight: 600 }}>
          Browse all →
        </Link>
      </div>

      {/* ── Product grid ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div style={{ height: 3, background: meta.color, opacity: 0.4 }} />
                <div style={{ background: "rgba(0,0,0,0.04)", aspectRatio: "4/3" }} className="animate-pulse" />
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 4, marginBottom: 10, width: "40%" }} className="animate-pulse" />
                  <div style={{ height: 12, background: "rgba(0,0,0,0.06)", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
                  <div style={{ height: 12, background: "rgba(0,0,0,0.04)", borderRadius: 4, width: "70%" }} className="animate-pulse" />
                </div>
              </div>
            ))
          : products.length > 0
            ? products.map((product: any) => (
                <CatalogueCard key={product.id} product={product} color={meta.color} />
              ))
            : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.35)" }}>
                  No products yet in this specialty — check back soon.
                </p>
                <Link href={`/shop?category=${activeSlug}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: meta.color, fontWeight: 600, marginTop: 12, display: "inline-block" }}>
                  Browse full catalogue →
                </Link>
              </div>
            )
        }
      </div>
    </div>
  );
}

const trustedBrands = [
  "3M Littmann", "OMRON", "Accu-Chek", "MDF Instruments",
  "Dr. Trust", "SurgiMed", "Heine", "Elsevier", "DAMS", "Tynor",
];

const testimonials = [
  {
    quote: "Aethex has completely changed how I manage patient care. Cadus AI gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.",
    name: "Dr. Priya Sharma",
    role: "Cardiologist, Mumbai",
    initials: "PS",
  },
  {
    quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.",
    name: "Dr. Arjun Mehta",
    role: "General Physician, Delhi",
    initials: "AM",
  },
  {
    quote: "Cadus AI helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.",
    name: "Dr. Vikram Nair",
    role: "Neurologist, Chennai",
    initials: "VN",
  },
];

interface ChatMsg { role: "user" | "assistant"; text: string; }

const STARTER_MESSAGES: ChatMsg[] = [
  { role: "assistant", text: "Hi — I'm Cadus AI. Ask me any clinical question." },
];

const SUGGESTIONS = [
  "What are the STEMI criteria on ECG?",
  "Paediatric dose of amoxicillin",
  "Causes of elevated troponin",
];

function AIChatPreview() {
  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [messages, setMessages] = useState<ChatMsg[]>(STARTER_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const next: ChatMsg[] = [...messages, { role: "user", text: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, agent: "pulse45", mode: "normal" }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", text: data.message ?? "Sorry, I couldn't respond. Please try again." }]);
    } catch {
      setMessages([...next, { role: "assistant", text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full" style={{ maxWidth: 520 }}>
      <div className="rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#F8F7F4", border: "1px solid rgba(0,0,0,0.09)", height: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>

        <div className="px-5 py-3.5 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#FFFFFF" }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#0A0A0F", lineHeight: 1 }}>Cadus AI</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>● Clinical Mode</p>
            </div>
          </div>
          <Link href="/ai-assistant"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase", color: "rgba(0,0,0,0.35)", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.8)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)"}>
            Full Experience →
          </Link>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: "#F8F7F4" }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[88%] px-4 py-3 rounded-2xl"
                style={msg.role === "user"
                  ? { background: "#007AFF", color: "#FFFFFF", borderBottomRightRadius: 4, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }
                  : { background: "#FFFFFF", color: "rgba(0,0,0,0.8)", borderBottomLeftRadius: 4, border: "1px solid rgba(0,0,0,0.08)", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6 }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl" style={{ background: "#FFFFFF", borderBottomLeftRadius: 4, border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.3)", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.length === 1 && !loading && (
            <div className="flex flex-col gap-2 pt-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left px-3.5 py-2.5 rounded-xl transition-all hover:bg-white"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.55)", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-3 shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#FFFFFF" }}>
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a clinical question…"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl outline-none"
              style={{ background: "#F3F2EF", border: "1px solid rgba(0,0,0,0.1)", color: "#0A0A0F", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:opacity-90 shrink-0"
              style={{ background: "#00C2A8" }}>
              <Send className="w-3.5 h-3.5 text-black" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CaseOfTheDaySection() {
  const todaysCase = getTodaysCase();
  const today = new Date();

  return (
    <section className="py-24 relative" style={{ background: "#F3F1ED", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          <div className="flex-1">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)", lineHeight: 1.05, color: "#0A0A0F", marginBottom: "1.5rem" }}>
              Sharpen Your<br />
              <span style={{ fontStyle: "italic", color: "rgba(0,0,0,0.4)" }}>Clinical Thinking.</span>
            </h2>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(0,0,0,0.45)", lineHeight: 1.85, maxWidth: 360, marginBottom: "2.5rem" }}>
              A new real-world clinical case every day — patient history, investigations, and MCQ diagnosis. Discuss with Cadus AI.
            </p>
            <Link href="/case-of-the-day"
              className="inline-flex items-center gap-2.5 transition-all hover:opacity-90"
              style={{ background: "#00C2A8", color: "#000", borderRadius: 2, padding: "12px 24px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Solve Today's Case <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#F7F5F1", border: "1px solid rgba(0,0,0,0.09)" }}>
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck className="w-4 h-4" style={{ color: "rgba(0,0,0,0.52)" }} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(0,0,0,0.45)", fontWeight: 600 }}>
                    {today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "1.25rem", color: "#0A0A0F", lineHeight: 1.3 }}>{todaysCase.title}</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(0,0,0,0.45)", marginTop: 4 }}>{todaysCase.specialty}</p>
              </div>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(0,0,0,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Chief Complaint</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.65)", lineHeight: 1.6 }}>
                  "{todaysCase.patient_info.chief_complaint.length > 90
                    ? todaysCase.patient_info.chief_complaint.slice(0, 90) + "…"
                    : todaysCase.patient_info.chief_complaint}"
                </p>
              </div>
              <div className="px-5 py-4">
                <Link href="/case-of-the-day"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #007AFF, #00C2A8)", color: "#FFFFFF", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <Stethoscope className="w-3.5 h-3.5" /> Solve Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const BLOG_CAT_COLORS: Record<string, string> = {
  "Clinical Tips": "#007AFF", "NEET-PG Prep": "#5856D6", "Medical News": "#FF3B30",
  "Product Guides": "#34C759", "Doctor Life": "#FF9500", "Research & Studies": "#8888A8",
};

function BlogNewsSection() {
  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/blog/posts?limit=3`)
      .then(r => r.json()).then(d => setBlogPosts(d.posts ?? [])).catch(() => {}).finally(() => setLoadingBlog(false));
    fetch(`${apiBase}/api/news`)
      .then(r => r.json()).then(d => setNewsArticles((d.articles ?? []).slice(0, 3))).catch(() => {}).finally(() => setLoadingNews(false));
  }, []);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d >= 1) return `${d}d ago`;
    if (h >= 1) return `${h}h ago`;
    return "Just now";
  };

  return (
    <section className="py-24 relative" style={{ background: "#FAFAF8", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between mb-14 gap-4">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)", lineHeight: 1.15, color: "#0A0A0F" }}>
            Latest from Aethex
          </h2>
          <Link href="/blog" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", fontWeight: 600 }}>
            All articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Rss className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.4)" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>From the Blog</span>
            </div>
            {loadingBlog ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded" style={{ background: "rgba(0,0,0,0.04)" }} />)}</div>
            ) : blogPosts.length === 0 ? (
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.28)" }}>Articles coming soon.</p>
            ) : (
              <div className="space-y-0">
                {blogPosts.map((post, i) => (
                  <Link key={post.id || i} href={`/blog/${post.slug}`}
                    className="group flex items-start gap-5 py-5 transition-all"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 300, color: "rgba(0,0,0,0.1)", lineHeight: 1, minWidth: 40 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1">
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.7)", fontWeight: 500, lineHeight: 1.5, marginBottom: 4 }} className="group-hover:text-black transition-colors">
                        {post.title}
                      </p>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "rgba(0,0,0,0.35)" }}>
                        {post.category} · {new Date(post.publishedAt || post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(0,0,0,0.55)", marginTop: 2 }} />
                  </Link>
                ))}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.4)" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>Medical News</span>
            </div>
            {loadingNews ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded" style={{ background: "rgba(0,0,0,0.04)" }} />)}</div>
            ) : newsArticles.length === 0 ? (
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.28)" }}>News feed loading.</p>
            ) : (
              <div className="space-y-0">
                {newsArticles.map((article, i) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-start gap-5 py-5 transition-all"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 300, color: "rgba(0,0,0,0.1)", lineHeight: 1, minWidth: 40 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1">
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.7)", fontWeight: 500, lineHeight: 1.5, marginBottom: 4 }} className="group-hover:text-white transition-colors">
                        {article.title?.length > 85 ? article.title.slice(0, 85) + "…" : article.title}
                      </p>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "rgba(0,0,0,0.35)" }}>
                        {article.source?.name ?? "Medical News"} · {timeAgo(article.publishedAt)}
                      </span>
                    </div>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(0,0,0,0.55)", marginTop: 3 }} />
                  </a>
                ))}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setDone(true);
    setLoading(false);
  };

  return (
    <section className="py-28 relative overflow-hidden" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#0A0A0F" }}>
      {/* Dark section gradient orbs */}
      <div className="absolute pointer-events-none" style={{ top: "-20%", left: "30%", width: "50%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,194,168,0.12) 0%, transparent 65%)", filter: "blur(60px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-10%", right: "20%", width: "35%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,122,255,0.09) 0%, transparent 70%)", filter: "blur(50px)" }} />
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center relative z-10">
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 20 }}>Newsletter</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 1.15, color: "#EEEEF8", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
          Weekly insights<br />
          <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>delivered free.</span>
        </h2>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.32)", maxWidth: 400, margin: "0 auto 2.5rem", lineHeight: 1.85 }}>
          Clinical tips, exam updates, and exclusive deals. Join 12,000+ Indian doctors.
        </p>
        {done ? (
          <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl"
            style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.25)", color: "#00C2A8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>
            <CheckCircle2 className="w-4 h-4" /> You're in. Weekly updates incoming.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="doctor@hospital.in"
              className="flex-1 px-5 py-3.5 rounded-xl focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#EEEEF8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }} />
            <button type="submit" disabled={loading}
              className="px-6 py-3.5 font-bold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 justify-center whitespace-nowrap hover:opacity-90"
              style={{ background: "#00C2A8", color: "#000", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "0 4px 20px rgba(0,194,168,0.3)" }}>
              <Send className="w-3.5 h-3.5" />
              {loading ? "Subscribing…" : "Subscribe Free"}
            </button>
          </form>
        )}
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 16 }}>No spam. Unsubscribe any time.</p>
      </div>
    </section>
  );
}

export default function Home() {
  const sessionId = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: loadingProducts } = useListProducts({ limit: 8, featured: true });
  const { data: categoriesData, isLoading: loadingCategories } = useListCategories();
  const categories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : Array.isArray((categoriesData as any)?.data)
      ? (categoriesData as any).data
      : Array.isArray((categoriesData as any)?.categories)
        ? (categoriesData as any).categories
        : Array.isArray((categoriesData as any)?.items)
          ? (categoriesData as any).items
          : [];

  const addToCartMutation = useAddToCart();

  const handleAddToCart = (productId: number) => {
    if (!sessionId) return;
    addToCartMutation.mutate(
      { data: { productId, sessionId, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
          toast({ title: "Added to cart", description: "Item successfully added to your cart." });
        },
        onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to add item to cart." }),
      }
    );
  };

  const featuredCategories = [
    "stethoscopes", "books", "scrubs", "equipment", "surgical", "cardiac-care", "neurology", "orthopaedic"
  ];

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF8" }}>

      {/* ══ HERO — Replit-inspired centered layout ══ */}
      <section className="relative overflow-hidden" style={{ minHeight: "calc(100vh - 141px)", background: "#FAFAF8", display: "flex", alignItems: "center" }}>

        {/* Subtle grain texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.018, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }} />
        {/* Atmospheric gradient orbs */}
        <div className="absolute pointer-events-none" style={{ top: "-8%", left: "18%", width: "42%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,194,168,0.13) 0%, transparent 68%)", filter: "blur(72px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "5%", right: "12%", width: "36%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,122,255,0.09) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute pointer-events-none" style={{ top: "28%", left: "-4%", width: "26%", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 72%)", filter: "blur(50px)" }} />

        {/* Centered hero content */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-20 text-center">

          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: "#FFFFFF", color: "#007A6A", border: "1.5px solid rgba(0,194,168,0.3)", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", boxShadow: "0 2px 16px rgba(0,194,168,0.12), 0 1px 4px rgba(0,0,0,0.06)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00C2A8", display: "inline-block", boxShadow: "0 0 6px rgba(0,194,168,0.7)" }} />
              India's Clinical Platform
            </span>
          </motion.div>

          {/* Main headline */}
          <div style={{ overflow: "hidden", marginBottom: "0.2em" }}>
            <motion.h1
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: "clamp(3.5rem, 10vw, 7.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#0A0A0F",
              }}
            >
              Everything
            </motion.h1>
          </div>
          <div style={{ overflow: "hidden", marginBottom: "1.5rem" }}>
            <motion.h1
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontStyle: "italic",
                fontSize: "clamp(3.5rem, 10vw, 7.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "rgba(10,10,15,0.28)",
              }}
            >
              Medicine.
            </motion.h1>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(0,0,0,0.45)", lineHeight: 1.65, marginBottom: "2.5rem", maxWidth: 520, margin: "0 auto 2.5rem" }}
          >
            AI clinical assistant · Drug reference · NEET‑PG prep · Medical supplies — one platform built for Indian physicians.
          </motion.p>

          {/* ── MAIN AI INPUT BOX — like Replit's prompt input ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <HeroAIInput />
          </motion.div>

          {/* ── CATEGORY QUICK LINKS ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.58, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-1 flex-wrap mb-5"
          >
            {[
              { href: "/ai-assistant", icon: Brain, label: "AI Consult" },
              { href: "/drug-reference", icon: Pill, label: "Drug Ref" },
              { href: "/neet-pg", icon: FileText, label: "NEET-PG" },
              { href: "/shop", icon: Store, label: "Shop" },
              { href: "/books", icon: BookOpen, label: "Books" },
              { href: "/calculator", icon: Calculator, label: "Calculators" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ color: "rgba(0,0,0,0.5)", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                    (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.8)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.5)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </motion.div>

          {/* ── EXAMPLE PROMPTS ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.72 }}
          >
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(0,0,0,0.3)", marginRight: 8 }}>Try an example →</span>
            {[
              "Diabetic nephropathy DDx",
              "NEET PG 2025 schedule",
              "Drug interaction check",
            ].map((prompt) => (
              <Link key={prompt} href={`/ai-assistant?q=${encodeURIComponent(prompt)}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs transition-all mr-2 mb-2"
                style={{ background: "#FFFFFF", color: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,0,0,0.1)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#00C2A8"; (e.currentTarget as HTMLElement).style.color = "#009E87"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.6)"; }}>
                {prompt}
              </Link>
            ))}
          </motion.div>

          {/* Trust stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex items-center justify-center gap-8 mt-10 pt-8 flex-wrap"
            style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
          >
            {[
              { value: "40,000+", label: "Verified Doctors" },
              { value: "20+", label: "AI Clinical Modes" },
              { value: "2-Day", label: "Pan-India Delivery" },
              { value: "NMC", label: "Compliant" },
            ].map((s, i) => (
              <div key={i} className="text-center px-4">
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A0A0F", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.22em", color: "rgba(0,0,0,0.32)", textTransform: "uppercase", marginTop: 5, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #F3F1ED)" }} />
      </section>

      {/* ══ PLATFORM — table of contents, architectural ══ */}
      <section className="relative" style={{ background: "#FAFAF8" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Section label */}
          <div className="flex items-center gap-4 pt-20 pb-12" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", fontWeight: 600 }}>
              The Platform
            </span>
          </div>

          {/* Three platform pillars — full-width rows */}
          {[
            {
              index: "01",
              name: "Cadus AI",
              headline: "Clinical Intelligence",
              desc: "Instant DDx, drug interactions, SOAP notes, and evidence-based answers — powered by medical AI built for Indian physicians.",
              href: "/ai-assistant",
              cta: "Start Consulting",
              color: "#00C2A8",
            },
            {
              index: "02",
              name: "Study Hub",
              headline: "NEET PG Prep",
              desc: "Structured notes, previous year questions, MCQ banks, and smart revision tools for NEET PG, NEXT, FMGE and USMLE aspirants.",
              href: "/study-hub",
              cta: "Explore Hub",
              color: "#5856D6",
            },
            {
              index: "03",
              name: "Medical Store",
              headline: "Genuine Supplies",
              desc: "Stethoscopes, scrubs, surgical instruments, and essential equipment — 100% authentic, delivered pan-India in 2 days.",
              href: "/shop",
              cta: "Shop Now",
              color: "#FF9500",
            },
          ].map((pillar, i) => (
            <Link
              key={i}
              href={pillar.href}
              className="group block py-12 transition-all"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = "16px"; (e.currentTarget as HTMLElement).style.borderLeft = `3px solid ${pillar.color}`; (e.currentTarget as HTMLElement).style.marginLeft = "-16px"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = "0"; (e.currentTarget as HTMLElement).style.borderLeft = "none"; (e.currentTarget as HTMLElement).style.marginLeft = "0"; }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-center">
                {/* Index number */}
                <div className="lg:col-span-1">
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1rem", color: "rgba(0,0,0,0.18)", letterSpacing: "0.1em" }}>{pillar.index}</span>
                </div>

                {/* Service name — large */}
                <div className="lg:col-span-3">
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#0A0A0F", lineHeight: 1.15, letterSpacing: "-0.01em", transition: "color 0.2s" }}
                    className="group-hover:text-black">
                    {pillar.name}
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: pillar.color, fontWeight: 600, marginTop: 8, opacity: 0.8 }}>
                    {pillar.headline}
                  </div>
                </div>

                {/* Description */}
                <div className="lg:col-span-6">
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(0,0,0,0.45)", lineHeight: 1.8, maxWidth: 500 }}>
                    {pillar.desc}
                  </p>
                </div>

                {/* CTA arrow */}
                <div className="lg:col-span-2 lg:text-right">
                  <span className="inline-flex items-center gap-2 transition-all group-hover:gap-3"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: pillar.color, fontWeight: 700, opacity: 0.75 }}>
                    {pillar.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ AI DEMO — the centerpiece ══ */}
      <section className="relative py-32 overflow-hidden" style={{ background: "#F0EDE8", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 70% at 95% 50%, rgba(0,194,168,0.09) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 50% at 0% 50%, rgba(0,122,255,0.07) 0%, transparent 60%)" }} />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(3rem, 6vw, 5.5rem)", lineHeight: 1.1, color: "#0A0A0F", marginBottom: "2rem", letterSpacing: "-0.02em" }}>
                Your clinical<br />
                <em style={{ color: "rgba(0,0,0,0.32)", fontWeight: 300 }}>intelligence layer.</em>
              </h2>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: "rgba(0,0,0,0.45)", lineHeight: 1.85, maxWidth: 400, marginBottom: "2rem" }}>
                Ask clinical questions, generate differential diagnoses, check drug interactions, produce SOAP notes, and prepare for exams — all in one conversation.
              </p>

              {/* Feature list — minimal */}
              <div className="space-y-0 mb-10">
                {[
                  "Instant differential diagnosis",
                  "Drug interaction checks",
                  "SOAP note generation",
                  "NEET PG exam prep",
                  "Paediatric dose calculator",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(0,0,0,0.35)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.55)" }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/ai-assistant"
                className="inline-flex items-center gap-2.5 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#00C2A8", color: "#000", borderRadius: 2, padding: "13px 28px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Sparkles className="w-3.5 h-3.5" /> Try Free — 20 queries/day
              </Link>
            </div>

            {/* Right — live chat widget */}
            <div className="flex justify-center lg:justify-end">
              <AIChatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES — curated editorial selection ══ */}
      <section className="py-24 relative" style={{ background: "#FAFAF8", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-end justify-between mb-14">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2.2rem, 4.5vw, 4rem)", lineHeight: 1.15, color: "#0A0A0F", letterSpacing: "-0.01em" }}>
              Shop by<br />
              <em style={{ color: "rgba(0,0,0,0.4)" }}>Specialty</em>
            </h2>
            <Link href="/shop"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.7)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)"}>
              View All →
            </Link>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "rgba(0,0,0,0.04)" }}>
              {[...Array(8)].map((_, i) => <div key={i} className="h-28 animate-pulse" style={{ background: "#FAFAF8" }} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "rgba(0,0,0,0.04)" }}>
              {(categories || [])
                .filter((cat: any) => featuredCategories.includes(cat.slug))
                .sort((a: any, b: any) => featuredCategories.indexOf(a.slug) - featuredCategories.indexOf(b.slug))
                .slice(0, 8)
                .map((cat: any) => {
                  const Icon = categoryIconMap[cat.iconName as string] || Activity;
                  return (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      className="group flex flex-col justify-between p-7 transition-all relative overflow-hidden"
                      style={{ background: "#FAFAF8", aspectRatio: "1/1" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EDE9E3"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FAFAF8"; }}
                    >
                      <CategoryAnimBg slug={cat.slug} />
                      <Icon className="w-6 h-6 transition-colors group-hover:text-black relative z-10" style={{ color: "rgba(0,0,0,0.28)" }} />
                      <div className="relative z-10">
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.6)", lineHeight: 1.3, display: "block" }}>{cat.name}</span>
                        {cat.productCount > 0 && (
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "rgba(0,0,0,0.28)", display: "block", marginTop: 4 }}>
                            {cat.productCount} items
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}

          {/* ── Specialty Catalogue ──────────────────── */}
          <SpecialtyCatalogue categories={categories || []} />
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS ══ */}
      <section className="py-24 relative" style={{ background: "#F3F1ED", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-end justify-between mb-14">
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2.2rem, 4.5vw, 4rem)", lineHeight: 1.15, color: "#0A0A0F", letterSpacing: "-0.01em" }}>
                Editor's Selection
              </h2>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.35)", marginTop: 8 }}>
                Trusted by Indian doctors nationwide
              </p>
            </div>
            <Link href="/shop"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: "0.15em", color: "rgba(0,0,0,0.35)", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.7)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.35)"}>
              View All →
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse" style={{ background: "rgba(0,0,0,0.04)", borderRadius: 4 }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(productsData?.products || []).slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} onAddToCart={() => handleAddToCart(product.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ TRUSTED BRANDS — marquee ══ */}
      <section className="overflow-hidden" style={{ background: "#FAFAF8", borderTop: "1px solid rgba(0,0,0,0.07)", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingTop: 24, paddingBottom: 24 }}>
        <p className="text-center mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.28em", color: "rgba(0,0,0,0.22)", textTransform: "uppercase" }}>
          Stocked &amp; sold on Aethex
        </p>
        <div style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)", WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)" }}>
          <div className="marquee-track" style={{ gap: 56, width: "max-content" }}>
            {[...trustedBrands, ...trustedBrands].map((brand, idx) => (
              <span key={idx} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.1rem", color: "rgba(0,0,0,0.28)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                {brand}
                {idx % trustedBrands.length < trustedBrands.length - 1 && (
                  <span style={{ color: "rgba(0,0,0,0.18)", margin: "0 14px" }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS — pull-quote editorial ══ */}
      <section className="py-28 relative" style={{ background: "#F3F1ED", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-end justify-between mb-20">
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)", fontWeight: 600, marginBottom: 12 }}>Testimonials</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(2.2rem, 4.5vw, 4rem)", lineHeight: 1.15, color: "#0A0A0F", letterSpacing: "-0.01em" }}>
                What doctors<br />
                <em style={{ color: "rgba(0,0,0,0.35)" }}>are saying</em>
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(0,0,0,0.22)" }}>
                Verified reviews
              </div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-3 h-3" viewBox="0 0 24 24" fill="#FF9500">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
            </div>
          </div>

          <div>
            {testimonials.map((t, i) => (
              <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12"
                style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {/* Quote — wide */}
                <div className={`lg:col-span-9 ${i % 2 !== 0 ? "lg:order-last" : ""}`}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(1.1rem, 2vw, 1.4rem)", color: "rgba(0,194,168,0.6)", marginBottom: 12, lineHeight: 1 }}>"</div>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: "clamp(1.4rem, 2.8vw, 2.1rem)",
                    lineHeight: 1.42,
                    color: "rgba(0,0,0,0.7)",
                  }}>
                    {t.quote}
                  </p>
                </div>

                {/* Attribution — narrow */}
                <div className={`lg:col-span-3 flex flex-col justify-center ${i % 2 !== 0 ? "lg:order-first" : ""}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #001A6E, #00C2A8)", boxShadow: "0 2px 12px rgba(0,194,168,0.25)" }}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#0A0A0F" }}>{t.name}</span>
                        <BadgeCheck className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />
                      </div>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "rgba(0,0,0,0.4)" }}>{t.role}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="w-3 h-3" viewBox="0 0 24 24" fill="#FF9500">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
          </div>
        </div>
      </section>

      {/* ══ DAILY MCQ — minimal sidebar layout ══ */}
      <section className="py-24 relative" style={{ background: "#FAFAF8", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row lg:items-start gap-16">
            <div className="lg:w-72 shrink-0">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(3rem, 6vw, 5rem)", lineHeight: 1.05, color: "rgba(0,0,0,0.08)", marginBottom: "0.75rem", letterSpacing: "-0.03em" }}>MCQ</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "clamp(1.8rem, 3vw, 2.5rem)", lineHeight: 1.1, color: "#0A0A0F", marginBottom: "1rem" }}>
                Question of<br />the Day
              </h2>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(0,0,0,0.38)", lineHeight: 1.7 }}>
                One clinical question.<br />Every day. Free.
              </p>
            </div>
            <div className="flex-1">
              <DailyMCQWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CASE OF THE DAY ══ */}
      <CaseOfTheDaySection />

      {/* ══ DRUG INTERACTION CTA — tight strip ══ */}
      <section className="py-8" style={{ background: "#FAFAF8", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <Link href="/drug-interaction-checker"
            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6"
            style={{ background: "#FFFFFF", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.15)"; }}>
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(245,158,11,0.1)" }}>
                <Pill className="w-4.5 h-4.5" style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#0A0A0F" }}>Drug Interaction Checker</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                  Instantly check interactions for up to 5 drugs — with severity ratings and clinical guidance.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 transition-all group-hover:gap-3 shrink-0"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "#F59E0B" }}>
              Check Now <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ══ BLOG & NEWS ══ */}
      <BlogNewsSection />

      {/* ══ NEWSLETTER ══ */}
      <NewsletterSection />

      {/* ══ MOBILE STICKY CTA ══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden p-4"
        style={{ background: "rgba(250,249,246,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <Link href="/ai-assistant"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-bold"
          style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, boxShadow: "0 4px 20px rgba(0,122,255,0.3)", whiteSpace: "nowrap" }}>
          <Sparkles className="w-4 h-4" /> Start AI Consultation
        </Link>
      </div>
    </div>
  );
}
