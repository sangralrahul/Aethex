import { useState } from "react";
import {
  X, Settings, Monitor, Brain, MessageSquare, User, Info,
  Moon, Sun, ChevronDown, ChevronUp, ChevronRight,
  Download, Upload, Archive, Trash2, Lock,
  UserCheck, Pencil, Key, Cookie,
  Activity, CheckCircle, Zap, RotateCcw, Volume2, Crown,
  GraduationCap, Building2,
} from "lucide-react";
import { getTranslation } from "@/lib/translations";
import type { UserProfile } from "@/hooks/use-user-auth";

/* ── Types ──────────────────────────────────────────────────────────────── */
export interface CadusSettings {
  theme: "dark" | "auto" | "light";
  fontSize: "sm" | "md" | "lg";
  compactMode: boolean;
  showTimestamps: boolean;
  responseStyle: "concise" | "balanced" | "detailed";
  showThinking: boolean;
  autoTitleChats: boolean;
  streamResponses: boolean;
  researchSources: 5 | 10 | 15;
  defaultModel: "pulse45" | "flux36" | "nova46";
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  autoCopyResponse: boolean;
  pasteLargeTextAsFile: boolean;
  referenceSavedMemories: boolean;
  referenceChatHistory: boolean;
}

export const DEFAULT_SETTINGS: CadusSettings = {
  theme: "dark",
  fontSize: "md",
  compactMode: false,
  showTimestamps: true,
  responseStyle: "balanced",
  showThinking: true,
  autoTitleChats: true,
  streamResponses: true,
  researchSources: 10,
  defaultModel: "pulse45",
  soundEnabled: false,
  notificationsEnabled: false,
  language: "en",
  autoCopyResponse: false,
  pasteLargeTextAsFile: true,
  referenceSavedMemories: true,
  referenceChatHistory: true,
};

const LS_KEY = "cadus-settings-v2";
const LS_KEY_OLD = "cadus-settings-v1";
export function loadSettings(): CadusSettings {
  try {
    localStorage.removeItem(LS_KEY_OLD);
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(s: CadusSettings) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

/* ── Props ──────────────────────────────────────────────────────────────── */
interface SettingsModalProps {
  settings: CadusSettings;
  onSettingsChange: (s: CadusSettings) => void;
  onClearAllChats?: () => void;
  onClearCurrentChat?: () => void;
  onExportChats?: () => void;
  onClose: () => void;
  user?: UserProfile | null;
  /** When true, chat-destructive actions are hidden (opened from website, not AI page) */
  isFromWebsite?: boolean;
}

type SectionId = "general" | "interface" | "models" | "chats" | "personalization" | "account" | "about";

/* ── Shared sub-components ──────────────────────────────────────────────── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex shrink-0 cursor-pointer transition-colors duration-200"
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? "rgba(0,188,212,0.8)" : "rgba(255,255,255,0.1)",
        border: checked ? "1px solid rgba(0,229,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="absolute top-0.5 transition-transform duration-200"
        style={{
          width: 20, height: 20, borderRadius: "50%",
          background: checked ? "white" : "rgba(150,180,220,0.6)",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
          boxShadow: checked ? "0 0 8px rgba(0,229,255,0.4)" : "none",
        }}
      />
    </button>
  );
}

function Row({ label, desc, children, last }: { label: string; desc?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: "rgba(200,230,255,0.9)" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "rgba(120,170,220,0.45)" }}>{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,200,255,0.4)" }}>
      {children}
    </p>
  );
}

function DangerButton({ label, desc, icon: Icon, onClick }: {
  label: string; desc?: string; icon: React.ElementType; onClick: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(248,113,113,0.2)" }}>
      <button
        type="button"
        onClick={() => { if (confirming) { onClick(); setConfirming(false); } else setConfirming(true); }}
        onBlur={() => setTimeout(() => setConfirming(false), 300)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
        style={{ background: confirming ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.07)" }}
      >
        <Icon className="w-4 h-4 shrink-0 text-red-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400">{label}</p>
          {desc && <p className="text-xs mt-0.5" style={{ color: "rgba(248,113,113,0.5)" }}>{desc}</p>}
        </div>
        {confirming
          ? <span className="text-xs font-bold text-red-400 shrink-0">Tap again to confirm</span>
          : <ChevronRight className="w-3.5 h-3.5 text-red-400/50 shrink-0" />}
      </button>
    </div>
  );
}

/* ── Section: General ───────────────────────────────────────────────────── */
function SectionGeneral({ s, set, tr }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void; tr: ReturnType<typeof getTranslation> }) {
  return (
    <div className="space-y-6">
      {/* Theme */}
      <Row label="Theme">
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(0,188,212,0.2)", background: "rgba(0,10,30,0.5)" }}>
          {([
            { value: "auto",  label: "System" },
            { value: "light", label: "Light" },
            { value: "dark",  label: "Dark" },
          ] as const).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set("theme", t.value)}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={s.theme === t.value
                ? { background: "rgba(0,188,212,0.25)", color: "#00E5FF" }
                : { color: "rgba(120,170,220,0.55)" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Row>

      {/* Language */}
      <Row label="Language">
        <select
          value={s.language}
          onChange={(e) => set("language", e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg outline-none cursor-pointer"
          style={{
            background: "rgba(0,188,212,0.08)",
            border: "1px solid rgba(0,188,212,0.2)",
            color: "rgba(180,225,255,0.9)",
            minWidth: 140,
          }}
        >
          {[
            { value: "en",  label: "English (US)" },
            { value: "hi",  label: "हिन्दी (Hindi)" },
            { value: "as",  label: "অসমীয়া (Assamese)" },
            { value: "bn",  label: "বাংলা (Bengali)" },
            { value: "brx", label: "बड़ो (Bodo)" },
            { value: "doi", label: "डोगरी (Dogri)" },
            { value: "gu",  label: "ગુજરાતી (Gujarati)" },
            { value: "kn",  label: "ಕನ್ನಡ (Kannada)" },
            { value: "ks",  label: "کٲشُر (Kashmiri)" },
            { value: "kok", label: "कोंकणी (Konkani)" },
            { value: "mai", label: "मैथिली (Maithili)" },
            { value: "ml",  label: "മലയാളം (Malayalam)" },
            { value: "mni", label: "মৈতৈলোন্ (Manipuri)" },
            { value: "mr",  label: "मराठी (Marathi)" },
            { value: "ne",  label: "नेपाली (Nepali)" },
            { value: "or",  label: "ଓଡ଼ିଆ (Odia)" },
            { value: "pa",  label: "ਪੰਜਾਬੀ (Punjabi)" },
            { value: "sa",  label: "संस्कृतम् (Sanskrit)" },
            { value: "sat", label: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)" },
            { value: "sd",  label: "سنڌي / सिन्धी (Sindhi)" },
            { value: "ta",  label: "தமிழ் (Tamil)" },
            { value: "te",  label: "తెలుగు (Telugu)" },
            { value: "ur",  label: "اردو (Urdu)" },
          ].map((o) => (
            <option key={o.value} value={o.value} style={{ background: "#071030" }}>{o.label}</option>
          ))}
        </select>
      </Row>

      {/* Voice */}
      <button
        type="button"
        className="w-full flex items-center gap-3 py-3.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Volume2 className="w-4 h-4 shrink-0" style={{ color: "rgba(0,188,212,0.6)" }} />
        <span className="flex-1 text-sm text-left" style={{ color: "rgba(200,230,255,0.9)" }}>Voice</span>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(120,170,220,0.35)" }} />
      </button>
    </div>
  );
}

/* ── Section: Interface ─────────────────────────────────────────────────── */
function SectionInterface({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  return (
    <div>
      <SectionTitle>Chat</SectionTitle>
      <div>
        <Row label="Title Auto-Generation" desc="Generate chat title from first message">
          <Toggle checked={s.autoTitleChats} onChange={(v) => set("autoTitleChats", v)} />
        </Row>
        <Row label="Auto-Copy Response to Clipboard" desc="Automatically copy each reply">
          <Toggle checked={s.autoCopyResponse} onChange={(v) => set("autoCopyResponse", v)} />
        </Row>
        <Row label="Paste Large Text as File" desc="Treat pastes over 2 KB as file attachments" last>
          <Toggle checked={s.pasteLargeTextAsFile} onChange={(v) => set("pasteLargeTextAsFile", v)} />
        </Row>
      </div>

      <div className="mt-6">
        <SectionTitle>Display</SectionTitle>
        <Row label="Show timestamps" desc="Display time on each message">
          <Toggle checked={s.showTimestamps} onChange={(v) => set("showTimestamps", v)} />
        </Row>
        <Row label="Compact mode" desc="Reduce spacing between messages">
          <Toggle checked={s.compactMode} onChange={(v) => set("compactMode", v)} />
        </Row>
        <Row label="Sound effects" desc="Play subtle sounds for actions" last>
          <Toggle checked={s.soundEnabled} onChange={(v) => set("soundEnabled", v)} />
        </Row>
      </div>
    </div>
  );
}

/* ── Section: Models ────────────────────────────────────────────────────── */
const MODEL_DATA = [
  {
    id: "pulse45" as const,
    name: "Cadus Minor",
    color: "#10B981",
    desc: "Vitals, Emergency & Critical Care. Optimised for fast, accurate clinical triage.",
    context: "512,000 tokens",
    summary: "8,192 tokens",
    modality: "text, image",
  },
  {
    id: "flux36" as const,
    name: "Cadus Medius",
    color: "#F59E0B",
    desc: "Pharmacology, Drug Interactions & Lab Analysis. Deep biomedical knowledge base.",
    context: "256,000 tokens",
    summary: "4,096 tokens",
    modality: "text",
  },
  {
    id: "nova46" as const,
    name: "Cadus Magnus",
    color: "#A855F7",
    desc: "Advanced Diagnostics, Research & Multimodal. State-of-the-art reasoning for complex cases.",
    context: "1,000,000 tokens",
    summary: "65,536 tokens",
    modality: "text, image, video",
  },
];

function SectionModels({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  const [expanded, setExpanded] = useState<string | null>(s.defaultModel);
  return (
    <div className="space-y-2">
      {MODEL_DATA.map((m) => {
        const isOpen = expanded === m.id;
        const isSelected = s.defaultModel === m.id;
        return (
          <div key={m.id} className="rounded-xl overflow-hidden" style={{
            border: isSelected ? `1px solid ${m.color}44` : "1px solid rgba(255,255,255,0.07)",
            background: isSelected ? `${m.color}08` : "rgba(255,255,255,0.02)",
          }}>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              onClick={() => { set("defaultModel", m.id); setExpanded(isOpen ? null : m.id); }}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}80` }} />
              <span className="flex-1 text-sm font-medium" style={{ color: isSelected ? "rgba(210,240,255,0.95)" : "rgba(160,205,245,0.7)" }}>
                {m.name}
              </span>
              {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: m.color }} />}
              {isOpen
                ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "rgba(120,170,220,0.4)" }} />
                : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "rgba(120,170,220,0.4)" }} />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: "rgba(130,180,230,0.6)" }}>{m.desc}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(0,10,30,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(0,200,255,0.35)" }}>Max context length</p>
                    <p className="text-sm font-semibold" style={{ color: "rgba(200,235,255,0.9)" }}>{m.context}</p>
                  </div>
                  <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(0,10,30,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(0,200,255,0.35)" }}>Max summary length</p>
                    <p className="text-sm font-semibold" style={{ color: "rgba(200,235,255,0.9)" }}>{m.summary}</p>
                  </div>
                </div>
                <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(0,10,30,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(0,200,255,0.35)" }}>Modality</p>
                  <p className="text-sm font-semibold" style={{ color: "rgba(200,235,255,0.9)" }}>{m.modality}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Section: Chats ─────────────────────────────────────────────────────── */
function SectionChatsClean({ onClearAll, onClearCurrent, onExport, onClose, isFromWebsite }: {
  onClearAll?: () => void; onClearCurrent?: () => void; onExport?: () => void; onClose: () => void; isFromWebsite?: boolean;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const rows: { label: string; icon: React.ElementType; right: React.ReactNode }[] = [
    {
      label: "Import Chats",
      icon: Upload,
      right: <span className="text-sm" style={{ color: "rgba(120,170,220,0.6)" }}>Import Chats</span>,
    },
    {
      label: "Export Chats",
      icon: Download,
      right: onExport ? (
        <button type="button" onClick={() => { onExport!(); onClose(); }}
          className="text-sm" style={{ color: "rgba(120,170,220,0.6)" }}>
          Export Chats
        </button>
      ) : (
        <span className="text-sm" style={{ color: "rgba(120,170,220,0.35)" }}>Open AI page first</span>
      ),
    },
    {
      label: "Archive All Chats",
      icon: Archive,
      right: <span className="text-sm" style={{ color: "rgba(120,170,220,0.6)" }}>Archive All Chats</span>,
    },
    {
      label: "Delete All Chats",
      icon: Trash2,
      right: onClearAll ? (deleteConfirm ? (
        <button type="button" onClick={() => { onClearAll!(); setDeleteConfirm(false); onClose(); }}
          className="text-xs font-bold px-2 py-1 rounded-lg"
          style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" }}>
          Confirm
        </button>
      ) : (
        <button type="button" onClick={() => setDeleteConfirm(true)}
          className="text-sm px-2 py-1 rounded-lg"
          style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }}>
          Delete Chat
        </button>
      )) : (
        <span className="text-sm" style={{ color: "rgba(120,170,220,0.35)" }}>Open AI page first</span>
      ),
    },
  ];

  return (
    <div>
      {isFromWebsite && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{ background: "rgba(0,188,212,0.07)", border: "1px solid rgba(0,188,212,0.15)", color: "rgba(0,200,255,0.6)" }}>
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          Chat actions are available inside the Cadus page.
        </div>
      )}
      {rows.map((r, i) => {
        const Icon = r.icon;
        const isLast = i === rows.length - 1;
        const isDanger = r.label === "Delete All Chats";
        return (
          <div key={r.label} className="flex items-center gap-3 py-3.5"
            style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
            <Icon className="w-4 h-4 shrink-0" style={{ color: isDanger ? "#F87171" : "rgba(0,188,212,0.6)" }} />
            <span className="flex-1 text-sm" style={{ color: isDanger ? "rgba(248,180,180,0.85)" : "rgba(200,230,255,0.85)" }}>
              {r.label}
            </span>
            {r.right}
          </div>
        );
      })}

      {!isFromWebsite && (
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <SectionTitle>Current Session</SectionTitle>
          <DangerButton label="Clear current chat" desc="Remove messages from active session"
            icon={RotateCcw} onClick={onClearCurrent ?? (() => {})} />
        </div>
      )}
    </div>
  );
}

/* ── Section: Personalization ───────────────────────────────────────────── */
function SectionPersonalization({ s, set }: { s: CadusSettings; set: (k: keyof CadusSettings, v: any) => void }) {
  return (
    <div className="space-y-6">
      {/* Memory */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Memory</SectionTitle>
          <button type="button" className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(0,200,255,0.5)" }}>
            <Archive className="w-3 h-3" />
            Manage
          </button>
        </div>
        <Row label="Reference saved memories" desc="Cadus will save and reference memories when generating replies">
          <Toggle checked={s.referenceSavedMemories} onChange={(v) => set("referenceSavedMemories", v)} />
        </Row>
        <Row label="Reference the chat history" desc="Cadus will reference saved memory when generating responses" last>
          <Toggle checked={s.referenceChatHistory} onChange={(v) => set("referenceChatHistory", v)} />
        </Row>
      </div>

      {/* Customize */}
      <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <SectionTitle>Customize Cadus</SectionTitle>
        <button type="button" className="w-full flex items-center gap-3 py-3.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Pencil className="w-4 h-4 shrink-0" style={{ color: "rgba(0,188,212,0.6)" }} />
          <span className="flex-1 text-sm text-left" style={{ color: "rgba(200,230,255,0.85)" }}>Customize Cadus</span>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(0,200,255,0.5)" }}>
            <Archive className="w-3 h-3" />
            Settings
          </div>
        </button>
      </div>

      {/* Cookies */}
      <div>
        <SectionTitle>Manage Cookies</SectionTitle>
        <button type="button" className="w-full flex items-center gap-3 py-3.5">
          <Cookie className="w-4 h-4 shrink-0" style={{ color: "rgba(0,188,212,0.6)" }} />
          <span className="flex-1 text-sm text-left" style={{ color: "rgba(200,230,255,0.85)" }}>Manage Cookies</span>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(0,200,255,0.5)" }}>
            <Archive className="w-3 h-3" />
            Manage
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── Section: Account ───────────────────────────────────────────────────── */
function SectionAccount({ user }: { user?: UserProfile | null }) {
  const displayName = user?.name || "Cadus User";
  const displayEmail = user?.email || "user@aethex.in";
  const isPro = user?.isPro ?? false;
  const dailyCount = user?.cadusDailyCount ?? 0;
  const dailyLimit = isPro ? 200 : 20;
  const dailyPct = Math.min(100, Math.round((dailyCount / dailyLimit) * 100));
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="flex items-center gap-4 px-4 py-4 rounded-xl"
        style={{ background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.12)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-base text-white"
          style={{ background: "linear-gradient(135deg, #00BCD4, #7C3AED)", boxShadow: "0 0 16px rgba(0,188,212,0.3)" }}>
          {initials || <User className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: "rgba(210,240,255,0.95)" }}>{displayName}</p>
            {isPro && (
              <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(0,194,168,0.15)", border: "1px solid rgba(0,194,168,0.35)", color: "#00C2A8" }}>
                <Crown className="w-2.5 h-2.5" />PRO
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(120,170,220,0.5)" }}>{displayEmail}</p>
        </div>
        <button type="button" className="text-sm px-3 py-1.5 rounded-lg"
          style={{ color: "rgba(0,200,255,0.7)", border: "1px solid rgba(0,188,212,0.2)" }}>
          Edit account
        </button>
      </div>

      {/* Role / College / Hospital info */}
      {(user?.role || user?.college || user?.hospital) && (
        <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {user?.role && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,188,212,0.5)" }} />
              <span className="text-xs capitalize" style={{ color: "rgba(120,170,220,0.6)" }}>
                {user.role === "student" ? "Medical Student" : user.role === "doctor" ? "Doctor" : "General User"}
              </span>
            </div>
          )}
          {user?.college && (
            <div className="flex items-start gap-2">
              <GraduationCap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "rgba(0,188,212,0.5)" }} />
              <span className="text-xs" style={{ color: "rgba(180,215,255,0.75)" }}>{user.college}</span>
            </div>
          )}
          {user?.hospital && (
            <div className="flex items-start gap-2">
              <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "rgba(0,188,212,0.5)" }} />
              <span className="text-xs" style={{ color: "rgba(180,215,255,0.75)" }}>{user.hospital}</span>
            </div>
          )}
        </div>
      )}

      {/* Daily usage bar */}
      <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: "rgba(180,215,255,0.75)" }}>Daily AI queries</p>
          <p className="text-xs font-bold" style={{ color: dailyCount >= dailyLimit ? "#F87171" : "rgba(0,200,255,0.7)" }}>
            {dailyCount} / {dailyLimit}
          </p>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dailyPct}%`,
              background: dailyCount >= dailyLimit
                ? "linear-gradient(90deg,#F87171,#ef4444)"
                : "linear-gradient(90deg,#00BCD4,#00E5FF)",
            }} />
        </div>
        {!isPro && (
          <p className="text-[10px] mt-1.5" style={{ color: "rgba(120,170,220,0.4)" }}>
            Upgrade to Cadus Magnus for 200 daily queries
          </p>
        )}
      </div>

      {/* Password */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 py-3.5">
          <Key className="w-4 h-4 shrink-0" style={{ color: "rgba(0,188,212,0.6)" }} />
          <span className="flex-1 text-sm" style={{ color: "rgba(200,230,255,0.85)" }}>Password management</span>
          <button type="button" className="text-sm" style={{ color: "rgba(120,170,220,0.55)" }}>
            Change password
          </button>
        </div>
      </div>

      {/* Account management */}
      <div>
        <div className="flex items-center gap-3 py-3.5">
          <Lock className="w-4 h-4 shrink-0 text-red-400" />
          <span className="flex-1 text-sm" style={{ color: "rgba(200,230,255,0.85)" }}>Account Management</span>
          <AccountDeleteButton />
        </div>
      </div>
    </div>
  );
}

function AccountDeleteButton() {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <button type="button"
      onBlur={() => setTimeout(() => setConfirming(false), 300)}
      className="text-xs font-bold px-2 py-1 rounded-lg"
      style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" }}>
      Confirm?
    </button>
  ) : (
    <button type="button" onClick={() => setConfirming(true)}
      className="text-sm px-2 py-1 rounded-lg"
      style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.25)" }}>
      Delete Account
    </button>
  );
}

/* ── Section: About ─────────────────────────────────────────────────────── */
function SectionAbout() {
  return (
    <div className="space-y-5">
      {/* Version card */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,229,255,0.2)" }}>
            <Zap className="w-5 h-5" style={{ color: "#00E5FF" }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "rgba(200,240,255,0.95)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em" }}>Cadus</p>
            <p className="text-xs" style={{ color: "rgba(100,170,220,0.55)" }}>Medical AI Suite · v3.0.0</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(120,175,220,0.6)" }}>
          Cadus is dedicated to pursuing next-generation medical AI, focused on building specialist models for Indian doctors and medical students. Our mission is to create safe, responsible, and intelligent tools that make quality clinical decision support accessible to every healthcare professional.
        </p>
      </div>

      {/* About section */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-sm font-semibold mb-2" style={{ color: "rgba(200,235,255,0.9)" }}>About</p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(120,170,220,0.55)" }}>
          A product of Clavix Technologies Pvt Ltd. Cadus provides AI-powered clinical assistance including diagnostic support, drug interaction checking, and medical image generation. All outputs must be verified by qualified medical professionals before clinical use.
        </p>
      </div>

      {/* Feedback */}
      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: "rgba(180,215,255,0.7)" }}>Feedback email</p>
        <p className="text-xs" style={{ color: "rgba(0,200,255,0.55)" }}>email@aethex.in</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <Activity className="w-4 h-4 text-emerald-400" />
        <p className="text-sm" style={{ color: "rgba(110,231,183,0.85)" }}>All systems operational</p>
        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" style={{ animation: "cadus-breathe 2s ease-in-out infinite" }} />
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Terms of Service", href: "#" },
          { label: "Privacy Policy", href: "#" },
          { label: "Cookie Notice", href: "#" },
          { label: "aethex Store", href: "/" },
        ].map((l) => (
          <a key={l.label} href={l.href}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors"
            style={{ color: "rgba(0,200,255,0.6)", border: "1px solid rgba(0,188,212,0.12)" }}>
            {l.label}
            <ChevronRight className="w-3 h-3 opacity-50" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Nav config ─────────────────────────────────────────────────────────── */
const NAV: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "general",         label: "General",         icon: Settings },
  { id: "interface",       label: "Interface",        icon: Monitor },
  { id: "models",          label: "Models",           icon: Brain },
  { id: "chats",           label: "Chats",            icon: MessageSquare },
  { id: "personalization", label: "Personalization",  icon: UserCheck },
  { id: "account",         label: "Account",          icon: User },
  { id: "about",           label: "About",            icon: Info },
];

/* ── Main Modal ─────────────────────────────────────────────────────────── */
export default function SettingsModal({
  settings, onSettingsChange, onClearAllChats, onClearCurrentChat, onExportChats, onClose, user, isFromWebsite,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const tr = getTranslation(settings.language);

  const set = (key: keyof CadusSettings, value: any) => {
    const next = { ...settings, [key]: value };
    onSettingsChange(next);
    saveSettings(next);
  };

  const activeNav = NAV.find((x) => x.id === activeSection)!;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex overflow-hidden w-full"
        style={{
          maxWidth: 800,
          height: "min(88vh, 620px)",
          background: "rgba(3,9,24,0.97)",
          border: "1px solid rgba(0,188,212,0.2)",
          borderRadius: 20,
          boxShadow: "0 0 80px rgba(0,188,212,0.1), 0 40px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Left nav ── */}
        <div
          className="flex flex-col shrink-0 py-5"
          style={{
            width: 200,
            background: "rgba(0,0,0,0.3)",
            borderRight: "1px solid rgba(0,188,212,0.1)",
          }}
        >
          <div className="px-5 pb-4 mb-1" style={{ borderBottom: "1px solid rgba(0,188,212,0.08)" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(0,200,255,0.45)" }}>
              {tr.settings}
            </p>
          </div>

          <nav className="flex-1 px-2 pt-2 space-y-0.5 overflow-y-auto">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={
                  activeSection === id
                    ? { background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,229,255,0.2)", color: "#00E5FF" }
                    : { border: "1px solid transparent", color: "rgba(120,175,220,0.6)" }
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="px-4 pt-3 mt-2" style={{ borderTop: "1px solid rgba(0,188,212,0.08)" }}>
            <p className="text-[10px]" style={{ color: "rgba(0,200,255,0.25)" }}>Cadus · v3.0.0</p>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Content header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(0,188,212,0.1)" }}>
            <h2 className="font-semibold text-base" style={{ color: "rgba(200,235,255,0.95)" }}>
              {activeNav.label}
            </h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(100,170,220,0.5)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {activeSection === "general" && <SectionGeneral s={settings} set={set} tr={tr} />}
            {activeSection === "interface" && <SectionInterface s={settings} set={set} />}
            {activeSection === "models" && <SectionModels s={settings} set={set} />}
            {activeSection === "chats" && (
              <SectionChatsClean
                onClearAll={onClearAllChats}
                onClearCurrent={onClearCurrentChat}
                onExport={onExportChats}
                onClose={onClose}
                isFromWebsite={isFromWebsite}
              />
            )}
            {activeSection === "personalization" && <SectionPersonalization s={settings} set={set} />}
            {activeSection === "account" && <SectionAccount user={user} />}
            {activeSection === "about" && <SectionAbout />}
          </div>
        </div>
      </div>
    </div>
  );
}
