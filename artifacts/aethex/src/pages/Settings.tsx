import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Settings, Monitor, Brain, MessageSquare, UserCheck, User, Info,
  ChevronRight, ChevronDown, ChevronUp,
  Download, Upload, Archive, Trash2, RotateCcw,
  Key, Lock, Cookie, Pencil, Volume2,
  CheckCircle, Activity, Zap, Crown, ArrowLeft,
  MessageCircle, Bot, Bell, Link2, Eye, EyeOff, Copy,
} from "lucide-react";
import {
  loadSettings, saveSettings, type CadusSettings,
} from "@/components/cadus/SettingsModal";
import { useUserAuth } from "@/hooks/use-user-auth";
import { getTranslation } from "@/lib/translations";

/* ─────────────────────────────────────────────────────────────────
   Animated particle background
───────────────────────────────────────────────────────────────── */
function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 60;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,122,255,${0.05 + p.a * 0.07})`;
        ctx.fill();
      });
      // draw faint connection lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,122,255,${0.03 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

/* ─────────────────────────────────────────────────────────────────
   Toggle
───────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex shrink-0 cursor-pointer transition-colors duration-200"
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? "rgba(0,122,255,0.9)" : "rgba(0,0,0,0.12)",
        border: checked ? "1px solid rgba(0,122,255,0.5)" : "1px solid rgba(0,0,0,0.15)",
      }}>
      <span className="absolute top-0.5 transition-transform duration-200" style={{
        width: 20, height: 20, borderRadius: "50%",
        background: checked ? "white" : "rgba(120,120,130,0.4)",
        transform: checked ? "translateX(22px)" : "translateX(2px)",
        boxShadow: checked ? "0 0 8px rgba(0,122,255,0.35)" : "none",
      }} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Row
───────────────────────────────────────────────────────────────── */
function Row({ label, desc, children, last }: { label: string; desc?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4"
      style={{ borderBottom: last ? "none" : "1px solid rgba(0,0,0,0.06)" }}>
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: "#1c1c1e" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(60,60,67,0.55)" }}>{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
      style={{ color: "rgba(0,122,255,0.55)" }}>
      {children}
    </p>
  );
}

function DangerBtn({ label, desc, icon: Icon, onClick }: {
  label: string; desc?: string; icon: React.ElementType; onClick: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
      <button type="button"
        onClick={() => { if (confirm) { onClick(); setConfirm(false); } else setConfirm(true); }}
        onBlur={() => setTimeout(() => setConfirm(false), 300)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
        style={{ background: confirm ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.05)" }}>
        <Icon className="w-4 h-4 shrink-0 text-red-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400">{label}</p>
          {desc && <p className="text-xs mt-0.5" style={{ color: "rgba(220,38,38,0.55)" }}>{desc}</p>}
        </div>
        {confirm
          ? <span className="text-xs font-bold text-red-400 shrink-0">Tap again to confirm</span>
          : <ChevronRight className="w-3.5 h-3.5 text-red-400/40 shrink-0" />}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: General
───────────────────────────────────────────────────────────────── */
function SectionGeneral({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  return (
    <div className="space-y-3">
      <Card>
        <SectionTitle>Appearance</SectionTitle>
        <Row label="Theme" desc="Choose how the interface looks">
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(0,122,255,0.18)", background: "rgba(0,0,0,0.06)" }}>
            {([{ value: "auto", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }] as const).map((t) => (
              <button key={t.value} type="button" onClick={() => set("theme", t.value)}
                className="px-4 py-2 text-xs font-semibold transition-all"
                style={s.theme === t.value
                  ? { background: "rgba(0,122,255,0.18)", color: "#007AFF" }
                  : { color: "rgba(60,60,67,0.55)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Font size" desc="Adjust text size in the AI chat" last>
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(0,122,255,0.18)", background: "rgba(0,0,0,0.06)" }}>
            {([{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] as const).map((t) => (
              <button key={t.value} type="button" onClick={() => set("fontSize", t.value)}
                className="px-4 py-2 text-xs font-bold transition-all"
                style={s.fontSize === t.value
                  ? { background: "rgba(0,122,255,0.18)", color: "#007AFF" }
                  : { color: "rgba(60,60,67,0.55)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </Row>
      </Card>

      <Card>
        <SectionTitle>Language & Voice</SectionTitle>
        <Row label="Language" desc="Interface and AI response language">
          <select value={s.language} onChange={(e) => set("language", e.target.value)}
            className="text-sm px-3 py-2 rounded-xl outline-none cursor-pointer"
            style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,122,255,0.2)", color: "#1c1c1e", minWidth: 160 }}>
            {[
              { value: "en", label: "English (US)" },
              { value: "hi", label: "हिन्दी (Hindi)" },
              { value: "as", label: "অসমীয়া (Assamese)" },
              { value: "bn", label: "বাংলা (Bengali)" },
              { value: "brx", label: "बड़ो (Bodo)" },
              { value: "doi", label: "डोगरी (Dogri)" },
              { value: "gu", label: "ગુજરાતી (Gujarati)" },
              { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
              { value: "ks", label: "کٲشُر (Kashmiri)" },
              { value: "kok", label: "कोंकणी (Konkani)" },
              { value: "mai", label: "मैथिली (Maithili)" },
              { value: "ml", label: "മലയാളം (Malayalam)" },
              { value: "mni", label: "মৈতৈলোন্ (Manipuri)" },
              { value: "mr", label: "मराठी (Marathi)" },
              { value: "ne", label: "नेपाली (Nepali)" },
              { value: "or", label: "ଓଡ଼ିଆ (Odia)" },
              { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
              { value: "sa", label: "संस्कृतम् (Sanskrit)" },
              { value: "sat", label: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)" },
              { value: "sd", label: "سنڌي / सिन्धी (Sindhi)" },
              { value: "ta", label: "தமிழ் (Tamil)" },
              { value: "te", label: "తెలుగు (Telugu)" },
              { value: "ur", label: "اردو (Urdu)" },
            ].map((o) => <option key={o.value} value={o.value} style={{ background: "#F2F2F7" }}>{o.label}</option>)}
          </select>
        </Row>
        <Row label="Voice" desc="Text-to-speech for AI replies" last>
          <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(0,122,255,0.18)", color: "rgba(60,60,67,0.65)" }}>
            <Volume2 className="w-4 h-4" />
            Configure
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        </Row>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: Interface
───────────────────────────────────────────────────────────────── */
function SectionInterface({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  return (
    <div className="space-y-3">
      <Card>
        <SectionTitle>Chat</SectionTitle>
        <Row label="Title auto-generation" desc="Generate a title for each chat from the first message">
          <Toggle checked={s.autoTitleChats} onChange={(v) => set("autoTitleChats", v)} />
        </Row>
        <Row label="Auto-copy response to clipboard" desc="Automatically copy each reply">
          <Toggle checked={s.autoCopyResponse} onChange={(v) => set("autoCopyResponse", v)} />
        </Row>
        <Row label="Paste large text as file" desc="Treat pastes over 2 KB as file attachments" last>
          <Toggle checked={s.pasteLargeTextAsFile} onChange={(v) => set("pasteLargeTextAsFile", v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Display</SectionTitle>
        <Row label="Show timestamps" desc="Display time on each message">
          <Toggle checked={s.showTimestamps} onChange={(v) => set("showTimestamps", v)} />
        </Row>
        <Row label="Compact mode" desc="Reduce vertical spacing between messages">
          <Toggle checked={s.compactMode} onChange={(v) => set("compactMode", v)} />
        </Row>
        <Row label="Show thinking steps" desc="Display reasoning chain for supported models">
          <Toggle checked={s.showThinking} onChange={(v) => set("showThinking", v)} />
        </Row>
        <Row label="Sound effects" desc="Play subtle sounds for actions" last>
          <Toggle checked={s.soundEnabled} onChange={(v) => set("soundEnabled", v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Response</SectionTitle>
        <Row label="Response style" last>
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(0,122,255,0.18)", background: "rgba(0,0,0,0.06)" }}>
            {([{ value: "concise", label: "Concise" }, { value: "balanced", label: "Balanced" }, { value: "detailed", label: "Detailed" }] as const).map((t) => (
              <button key={t.value} type="button" onClick={() => set("responseStyle", t.value)}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={s.responseStyle === t.value
                  ? { background: "rgba(0,122,255,0.18)", color: "#007AFF" }
                  : { color: "rgba(60,60,67,0.55)" }}>
                {t.label}
              </button>
            ))}
          </div>
        </Row>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: Models
───────────────────────────────────────────────────────────────── */
const MODEL_DATA = [
  { id: "pulse45" as const, name: "Cadus Minor", tier: "Free", color: "#10B981",
    desc: "Vitals, Emergency & Critical Care. Optimised for fast, accurate clinical triage.",
    context: "512,000 tokens", summary: "8,192 tokens", modality: "text, image" },
  { id: "flux36" as const, name: "Cadus Medius", tier: "Standard", color: "#F59E0B",
    desc: "Pharmacology, Drug Interactions & Lab Analysis. Deep biomedical knowledge base.",
    context: "256,000 tokens", summary: "4,096 tokens", modality: "text" },
  { id: "nova46" as const, name: "Cadus Magnus", tier: "Pro", color: "#A855F7",
    desc: "Advanced Diagnostics, Research & Multimodal. State-of-the-art reasoning for complex cases.",
    context: "1,000,000 tokens", summary: "65,536 tokens", modality: "text, image, video" },
];

function SectionModels({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  const [expanded, setExpanded] = useState<string | null>(s.defaultModel);
  return (
    <div className="space-y-3">
      {MODEL_DATA.map((m) => {
        const isOpen = expanded === m.id;
        const isSelected = s.defaultModel === m.id;
        return (
          <div key={m.id} className="rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              border: isSelected ? `1px solid ${m.color}55` : "1px solid rgba(0,0,0,0.08)",
              background: isSelected ? `${m.color}0d` : "rgba(0,0,0,0.02)",
              boxShadow: isSelected ? `0 0 24px ${m.color}18` : "none",
            }}>
            <button type="button" className="w-full flex items-center gap-4 px-5 py-4 text-left"
              onClick={() => { set("defaultModel", m.id); setExpanded(isOpen ? null : m.id); }}>
              <div className="w-3 h-3 rounded-full shrink-0"
                style={{ background: m.color, boxShadow: `0 0 10px ${m.color}90` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: isSelected ? "#1c1c1e" : "rgba(60,60,67,0.7)" }}>
                    {m.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44` }}>
                    {m.tier}
                  </span>
                </div>
              </div>
              {isSelected && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: m.color }} />}
              {isOpen
                ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "rgba(60,60,67,0.45)" }} />
                : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "rgba(60,60,67,0.5)" }} />}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-xs mt-4 leading-relaxed" style={{ color: "rgba(60,60,67,0.65)" }}>{m.desc}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Max context", value: m.context },
                    { label: "Max summary", value: m.summary },
                    { label: "Modality", value: m.modality },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl px-3 py-3"
                      style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(0,122,255,0.5)" }}>{stat.label}</p>
                      <p className="text-xs font-bold" style={{ color: "rgba(200,235,255,0.9)" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: Chats
───────────────────────────────────────────────────────────────── */
function SectionChats({ onClearAll, onExport }: { onClearAll?: () => void; onExport?: () => void }) {
  const [deleteChatConfirm, setDeleteChatConfirm] = useState(false);

  return (
    <div className="space-y-3">
      <Card>
        <SectionTitle>Chat Data</SectionTitle>
        {[
          {
            label: "Import Chats", icon: Upload, desc: "Restore chats from a JSON backup",
            right: <button type="button" className="text-sm px-3 py-1.5 rounded-xl"
              style={{ border: "1px solid rgba(0,122,255,0.2)", color: "rgba(0,200,255,0.65)" }}>
              Import
            </button>
          },
          {
            label: "Export Chats", icon: Download, desc: "Download all chats as JSON",
            right: <button type="button" onClick={onExport}
              className="text-sm px-3 py-1.5 rounded-xl"
              style={{ border: "1px solid rgba(0,122,255,0.2)", color: "rgba(0,200,255,0.65)" }}>
              Export
            </button>
          },
          {
            label: "Archive All Chats", icon: Archive, desc: "Move all chats to archive",
            right: <button type="button" className="text-sm px-3 py-1.5 rounded-xl"
              style={{ border: "1px solid rgba(0,122,255,0.2)", color: "rgba(0,200,255,0.65)" }}>
              Archive
            </button>
          },
        ].map((r, i, arr) => (
          <Row key={r.label} label={r.label} desc={r.desc} last={i === arr.length - 1}>
            {r.right}
          </Row>
        ))}
      </Card>

      <Card>
        <SectionTitle>Danger Zone</SectionTitle>
        <DangerBtn label="Delete All Chats" desc="Permanently remove every conversation — cannot be undone"
          icon={Trash2}
          onClick={() => { onClearAll?.(); }} />
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: Personalization
───────────────────────────────────────────────────────────────── */
function SectionPersonalization({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionTitle>Memory</SectionTitle>
          <button type="button" className="flex items-center gap-1.5 text-xs mb-3"
            style={{ color: "rgba(0,122,255,0.65)" }}>
            <Archive className="w-3 h-3" /> Manage
          </button>
        </div>
        <Row label="Reference saved memories" desc="Cadus will save and reference memories when generating replies">
          <Toggle checked={s.referenceSavedMemories} onChange={(v) => set("referenceSavedMemories", v)} />
        </Row>
        <Row label="Reference chat history" desc="Cadus will reference saved memory when generating responses" last>
          <Toggle checked={s.referenceChatHistory} onChange={(v) => set("referenceChatHistory", v)} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Customize Cadus</SectionTitle>
        <button type="button" className="w-full flex items-center gap-3 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Pencil className="w-4 h-4 shrink-0" style={{ color: "rgba(0,188,212,0.6)" }} />
          <span className="flex-1 text-sm text-left" style={{ color: "rgba(200,230,255,0.85)" }}>
            Customize Cadus instructions
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: "rgba(120,170,220,0.3)" }} />
        </button>
        <button type="button" className="w-full flex items-center gap-3 py-3">
          <Cookie className="w-4 h-4 shrink-0" style={{ color: "rgba(0,188,212,0.6)" }} />
          <span className="flex-1 text-sm text-left" style={{ color: "rgba(200,230,255,0.85)" }}>
            Manage Cookies
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: "rgba(120,170,220,0.3)" }} />
        </button>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: Account
───────────────────────────────────────────────────────────────── */
function SectionAccount({ user }: { user: ReturnType<typeof useUserAuth>["user"] }) {
  const name = user?.name || "Cadus User";
  const email = user?.email || "user@aethex.in";
  const isPro = user?.isPro ?? false;
  const dailyCount = user?.cadusDailyCount ?? 0;
  const dailyLimit = isPro ? 200 : 20;
  const dailyPct = Math.min(100, Math.round((dailyCount / dailyLimit) * 100));
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const [delConfirm, setDelConfirm] = useState(false);

  return (
    <div className="space-y-3">
      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg text-white"
            style={{ background: "linear-gradient(135deg,#00BCD4,#7C3AED)", boxShadow: "0 0 24px rgba(0,188,212,0.3)" }}>
            {initials || <User className="w-7 h-7" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-base truncate" style={{ color: "#1c1c1e" }}>{name}</p>
              {isPro && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(0,194,168,0.15)", border: "1px solid rgba(0,194,168,0.35)", color: "#00C2A8" }}>
                  <Crown className="w-2.5 h-2.5" />PRO
                </span>
              )}
            </div>
            <p className="text-sm truncate" style={{ color: "rgba(60,60,67,0.55)" }}>{email}</p>
          </div>
          <button type="button" className="shrink-0 text-sm px-4 py-2 rounded-xl font-medium"
            style={{ border: "1px solid rgba(0,188,212,0.25)", color: "rgba(0,210,255,0.75)" }}>
            Edit account
          </button>
        </div>
      </Card>

      {/* Daily usage */}
      <Card>
        <SectionTitle>Daily AI Usage</SectionTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "rgba(180,215,255,0.7)" }}>Queries today</p>
            <p className="text-sm font-bold"
              style={{ color: dailyCount >= dailyLimit ? "#F87171" : "rgba(0,210,255,0.8)" }}>
              {dailyCount} / {dailyLimit}
            </p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${dailyPct}%`,
                background: dailyCount >= dailyLimit
                  ? "linear-gradient(90deg,#F87171,#ef4444)"
                  : "linear-gradient(90deg,#00BCD4,#00E5FF)",
                boxShadow: dailyCount < dailyLimit ? "0 0 10px rgba(0,229,255,0.4)" : "none",
              }} />
          </div>
          {!isPro && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs" style={{ color: "rgba(60,60,67,0.5)" }}>
                Upgrade to Cadus Magnus for 200 daily queries
              </p>
              <button type="button" className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#A855F7" }}>
                Upgrade
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <SectionTitle>Security</SectionTitle>
        <Row label="Password management" desc="Change your account password" last>
          <button type="button" className="text-sm px-3 py-1.5 rounded-xl"
            style={{ border: "1px solid rgba(0,122,255,0.2)", color: "rgba(0,200,255,0.65)" }}>
            Change password
          </button>
        </Row>
      </Card>

      {/* Danger */}
      <Card>
        <SectionTitle>Danger Zone</SectionTitle>
        <DangerBtn label="Delete Account" desc="Permanently delete your account and all associated data"
          icon={Lock} onClick={() => {}} />
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: About
───────────────────────────────────────────────────────────────── */
function SectionAbout() {
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,229,255,0.2)" }}>
            <Zap className="w-6 h-6" style={{ color: "#007AFF" }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "#1c1c1e", fontFamily: "'Orbitron',monospace", letterSpacing: "0.06em" }}>Cadus</p>
            <p className="text-xs" style={{ color: "rgba(100,170,220,0.5)" }}>Medical AI Suite · v3.0.0</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(120,175,220,0.6)" }}>
          Cadus is dedicated to pursuing next-generation medical AI, focused on building specialist models for Indian doctors and medical students. Our mission is to create safe, responsible, and intelligent tools that make quality clinical decision support accessible to every healthcare professional.
        </p>
      </Card>

      <Card>
        <SectionTitle>About</SectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(60,60,67,0.65)" }}>
          A product of Clavix Technologies Pvt Ltd. Cadus provides AI-powered clinical assistance including diagnostic support, drug interaction checking, and medical image generation. All outputs must be verified by qualified medical professionals before clinical use.
        </p>
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(180,215,255,0.6)" }}>Feedback & Support</p>
          <p className="text-sm" style={{ color: "rgba(0,200,255,0.55)" }}>email@aethex.in</p>
        </div>
      </Card>

      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
        style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <Activity className="w-4 h-4 text-emerald-400" />
        <p className="text-sm" style={{ color: "rgba(110,231,183,0.85)" }}>All systems operational</p>
        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400"
          style={{ animation: "pulse 2s ease-in-out infinite" }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Terms of Service", href: "#" },
          { label: "Privacy Policy", href: "#" },
          { label: "Cookie Notice", href: "#" },
          { label: "Aethex Store", href: "/" },
        ].map((l) => (
          <a key={l.label} href={l.href}
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(0,188,212,0.1)", color: "rgba(0,200,255,0.55)" }}>
            {l.label}
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Section: WhatsApp Bot
───────────────────────────────────────────────────────────────── */
function SectionWhatsApp() {
  const [enabled, setEnabled] = useState(() => { try { return localStorage.getItem("wa_bot_enabled") === "true"; } catch { return false; } });
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem("wa_bot_phone") || ""; } catch { return ""; } });
  const [weeklyDigest, setWeeklyDigest] = useState(() => { try { return localStorage.getItem("wa_bot_weekly") !== "false"; } catch { return true; } });
  const [cmeAlerts, setCmeAlerts] = useState(() => { try { return localStorage.getItem("wa_bot_cme") !== "false"; } catch { return true; } });
  const [quizReminders, setQuizReminders] = useState(() => { try { return localStorage.getItem("wa_bot_quiz") !== "false"; } catch { return true; } });
  const [mentorUpdates, setMentorUpdates] = useState(() => { try { return localStorage.getItem("wa_bot_mentor") !== "false"; } catch { return true; } });
  const [copied, setCopied] = useState(false);
  const BOT_NUMBER = "+91 98765 43210";
  const BOT_LINK = "https://wa.me/919876543210?text=Hi%20AETHEX";

  const save = (key: string, val: string | boolean) => { try { localStorage.setItem(key, String(val)); } catch {} };

  const handleToggleEnabled = (v: boolean) => { setEnabled(v); save("wa_bot_enabled", v); };
  const handlePhone = (v: string) => { setPhone(v); save("wa_bot_phone", v); };

  const copyLink = () => {
    navigator.clipboard.writeText(BOT_LINK).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const ToggleRow = ({ label, sub, val, onChange }: { label: string; sub: string; val: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: "#1c1c1e" }}>{label}</p>
        <p className="text-xs" style={{ color: "rgba(60,60,67,0.5)" }}>{sub}</p>
      </div>
      <button onClick={() => onChange(!val)} className="relative w-11 h-6 rounded-full transition-all shrink-0" style={{ background: val ? "#34c759" : "#e5e5ea" }}>
        <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full shadow bg-white" style={{ left: val ? "calc(100% - 1.375rem)" : "0.125rem" }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1c1c1e" }}>AETHEX WhatsApp Bot</p>
              <p className="text-xs" style={{ color: "rgba(60,60,67,0.5)" }}>Get alerts & daily digests on WhatsApp</p>
            </div>
          </div>
          <button onClick={() => handleToggleEnabled(!enabled)} className="relative w-11 h-6 rounded-full transition-all shrink-0" style={{ background: enabled ? "#34c759" : "#e5e5ea" }}>
            <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full shadow bg-white" style={{ left: enabled ? "calc(100% - 1.375rem)" : "0.125rem" }} />
          </button>
        </div>

        {enabled && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(60,60,67,0.6)" }}>Your WhatsApp Number</label>
            <div className="flex gap-2">
              <input type="tel" value={phone} onChange={e => handlePhone(e.target.value)} placeholder="+91 98765 43210"
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: "#f2f2f7", border: "1px solid rgba(0,0,0,0.08)", color: "#1c1c1e" }} />
              <a href={BOT_LINK} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", whiteSpace: "nowrap" }}>
                <Bot className="w-3.5 h-3.5" /> Connect Bot
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Quick link */}
      <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <SectionTitle>Quick Link</SectionTitle>
        <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg" style={{ background: "#f2f2f7" }}>
          <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#007AFF" }} />
          <span className="flex-1 text-xs truncate" style={{ color: "rgba(60,60,67,0.7)" }}>{BOT_LINK}</span>
          <button onClick={copyLink} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#007AFF" }}>
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "rgba(60,60,67,0.45)" }}>Bot Number: {BOT_NUMBER}</p>
      </div>

      {/* Notification types */}
      <div className="rounded-xl px-5 pt-4 pb-1" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <SectionTitle>Notification Preferences</SectionTitle>
        <ToggleRow label="Weekly Digest" sub="Sunday summary of your progress" val={weeklyDigest} onChange={v => { setWeeklyDigest(v); save("wa_bot_weekly", v); }} />
        <ToggleRow label="CME & Webinar Alerts" sub="Reminders 1 hour before live events" val={cmeAlerts} onChange={v => { setCmeAlerts(v); save("wa_bot_cme", v); }} />
        <ToggleRow label="Quiz Reminders" sub="Daily streak nudge if no quiz taken" val={quizReminders} onChange={v => { setQuizReminders(v); save("wa_bot_quiz", v); }} />
        <ToggleRow label="Mentor Updates" sub="New message from your mentor" val={mentorUpdates} onChange={v => { setMentorUpdates(v); save("wa_bot_mentor", v); }} />
      </div>

      {/* Status */}
      <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: enabled ? "#34c759" : "#aeaeb2", boxShadow: enabled ? "0 0 6px rgba(52,199,89,0.5)" : "none" }} />
        <p className="text-sm" style={{ color: "rgba(60,60,67,0.7)" }}>
          {enabled ? "WhatsApp Bot is active. Messages will be delivered to your linked number." : "WhatsApp Bot is disabled. Enable above to start receiving alerts."}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Nav config
───────────────────────────────────────────────────────────────── */
type SectionId = "general" | "interface" | "models" | "chats" | "personalization" | "account" | "whatsapp" | "about";

const NAV: { id: SectionId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "general",         label: "General",          icon: Settings,      desc: "Theme, language & voice" },
  { id: "interface",       label: "Interface",         icon: Monitor,       desc: "Chat & display options" },
  { id: "models",          label: "Models",            icon: Brain,         desc: "Default AI model" },
  { id: "chats",           label: "Chats",             icon: MessageSquare, desc: "Import, export & delete" },
  { id: "personalization", label: "Personalization",   icon: UserCheck,     desc: "Memory & customisation" },
  { id: "account",         label: "Account",           icon: User,          desc: "Profile & usage" },
  { id: "whatsapp",        label: "WhatsApp Bot",      icon: MessageCircle, desc: "Bot number & notifications" },
  { id: "about",           label: "About",             icon: Info,          desc: "Version & legal" },
];

/* ─────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useUserAuth();
  const [settings, setSettingsState] = useState<CadusSettings>(loadSettings);
  const [active, setActive] = useState<SectionId>("general");
  const [animKey, setAnimKey] = useState(0);

  const set = (key: keyof CadusSettings, value: any) => {
    const next = { ...settings, [key]: value };
    setSettingsState(next);
    saveSettings(next);
  };

  const handleSectionChange = (id: SectionId) => {
    setActive(id);
    setAnimKey((k) => k + 1);
  };

  const handleClearAllChats = () => {
    try { localStorage.removeItem("cadus_sessions_v2"); } catch {}
    window.dispatchEvent(new StorageEvent("storage", { key: "cadus_sessions_v2", newValue: null }));
  };

  const handleExportChats = () => {
    try {
      const raw = localStorage.getItem("cadus_sessions_v2") ?? "[]";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `cadus-chats-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const activeNav = NAV.find((n) => n.id === active)!;

  return (
    <div className="min-h-screen w-full relative overflow-hidden"
      style={{ background: "#F2F2F7", fontFamily: "'Outfit','Inter',sans-serif" }}>

      {/* Animated particle canvas */}
      <ParticleBg />

      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.06) 0%, transparent 70%)", animation: "slowPulse 8s ease-in-out infinite" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,194,168,0.05) 0%, transparent 70%)", animation: "slowPulse 10s ease-in-out infinite reverse" }} />
      </div>

      {/* Page container */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <button type="button" onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: "rgba(0,122,255,0.75)" }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Aethex
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#007AFF", boxShadow: "0 0 6px rgba(0,122,255,0.4)" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,122,255,0.65)", fontFamily: "'Orbitron',monospace" }}>
              Cadus Settings
            </span>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left sidebar ── */}
          <aside className="shrink-0 flex flex-col py-6"
            style={{
              width: 260,
              background: "rgba(0,0,0,0.03)",
              borderRight: "1px solid rgba(0,0,0,0.07)",
            }}>
            <div className="px-5 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(0,122,255,0.5)" }}>Settings</p>
            </div>
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
              {NAV.map(({ id, label, icon: Icon, desc }) => {
                const isActive = active === id;
                return (
                  <button key={id} type="button"
                    onClick={() => handleSectionChange(id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group"
                    style={isActive
                      ? { background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.18)" }
                      : { border: "1px solid transparent" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: isActive ? "rgba(0,122,255,0.15)" : "rgba(0,0,0,0.04)",
                        border: isActive ? "1px solid rgba(0,122,255,0.2)" : "1px solid rgba(0,0,0,0.06)",
                      }}>
                      <Icon className="w-4 h-4" style={{ color: isActive ? "#007AFF" : "rgba(60,60,67,0.5)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none mb-0.5"
                        style={{ color: isActive ? "#1c1c1e" : "rgba(28,28,30,0.65)" }}>
                        {label}
                      </p>
                      <p className="text-[10px] leading-none" style={{ color: "rgba(60,60,67,0.4)" }}>{desc}</p>
                    </div>
                    {isActive && <div className="w-1 h-5 rounded-full shrink-0"
                      style={{ background: "linear-gradient(180deg,#007AFF,#005CC8)" }} />}
                  </button>
                );
              })}
            </nav>
            <div className="px-5 pt-4 mt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-[10px]" style={{ color: "rgba(0,122,255,0.4)" }}>Cadus · v3.0.0 · Clavix Technologies</p>
            </div>
          </aside>

          {/* ── Right content ── */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8">
              {/* Section header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  {(() => { const Icon = activeNav.icon; return <Icon className="w-5 h-5" style={{ color: "#007AFF" }} />; })()}
                  <h1 className="text-2xl font-bold" style={{ color: "#1c1c1e" }}>
                    {activeNav.label}
                  </h1>
                </div>
                <p className="text-sm" style={{ color: "rgba(60,60,67,0.6)" }}>{activeNav.desc}</p>
              </div>

              {/* Section content with fade-in animation */}
              <div key={animKey} style={{ animation: "fadeSlideIn 0.25s ease-out" }}>
                {active === "general"         && <SectionGeneral s={settings} set={set} />}
                {active === "interface"       && <SectionInterface s={settings} set={set} />}
                {active === "models"          && <SectionModels s={settings} set={set} />}
                {active === "chats"           && <SectionChats onClearAll={handleClearAllChats} onExport={handleExportChats} />}
                {active === "personalization" && <SectionPersonalization s={settings} set={set} />}
                {active === "account"         && <SectionAccount user={user} />}
                {active === "whatsapp"        && <SectionWhatsApp />}
                {active === "about"           && <SectionAbout />}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes slowPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
