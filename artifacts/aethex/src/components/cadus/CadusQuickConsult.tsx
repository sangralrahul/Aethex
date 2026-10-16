import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { X, Send, BotMessageSquare, Sparkles, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isCadusHost } from "@/lib/host";

const STORAGE_KEY = "cadus_quick_chat_v2";
const HIDDEN_ROUTES = ["/ai-assistant", "/ai-assistant-classic", "/cadus-standalone"];

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-60)));
  } catch {}
}

function AssistantBubble({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-1.5">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed" style={{ color: "#1C1C1E", whiteSpace: "pre-wrap" }}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </div>
  );
}

export default function CadusQuickConsult() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isHidden = isCadusHost() || HIDDEN_ROUTES.some(r => location === r || location.startsWith(r + "/"));

  useEffect(() => { saveHistory(messages); }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages.length]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const history = updated.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("groq-ai", {
        body: { action: "chat", message: text, history: history.slice(0, -1), style: "concise" },
      });
      if (error) throw error;
      const reply = data?.message ?? data?.error ?? "Sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Network error. Please check your connection and try again.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (isHidden) return null;

  return (
    <>
      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes cadus-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cadus-fab-pulse {
          0% { transform: scale(1); opacity: 0.55; }
          70% { transform: scale(1.65); opacity: 0; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes cadus-online-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-[89] sm:hidden"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Chat Drawer ── */}
      <div
        className="fixed z-[90]"
        style={{
          bottom: 0,
          right: 0,
          width: "100%",
          maxWidth: "min(420px, 100vw)",
          height: 520,
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
          background: "#FFFFFF",
          boxShadow: open ? "0 -8px 48px rgba(0,0,0,0.18), 0 0 0 1px rgba(60,60,67,0.09)" : "none",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(28px)",
          transition: "opacity 0.28s cubic-bezier(0.34,1.56,0.64,1), transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, #007AFF 0%, #00C2A8 100%)",
            height: 60,
          }}>
          <div className="flex items-center gap-2.5">
            {/* Brain icon in a circle */}
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}>
              <Brain className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              {/* Green online dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{
                  background: "#34C759",
                  animation: "cadus-online-pulse 2.4s ease-in-out infinite",
                }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-white leading-tight">Cadus AI</p>
                <span className="text-xs font-medium text-white/60 leading-tight">· online</span>
              </div>
              <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.65)" }}>
                Powered by Cadus AI — Aethex
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.12),rgba(0,194,168,0.12))" }}>
                <BotMessageSquare className="w-6 h-6" style={{ color: "#007AFF" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#1C1C1E" }}>Ask Cadus AI anything</p>
                <p className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>Drug info · Dosages · Clinical questions</p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {["What is metformin used for?", "Signs of PE?", "Normal INR range?"].map(q => (
                  <button key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF", border: "1px solid rgba(0,122,255,0.15)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,122,255,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,122,255,0.08)")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="max-w-[82%] px-3 py-2.5 text-sm"
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg,#007AFF,#005EC3)", color: "#FFF", borderRadius: "18px 18px 4px 18px" }
                  : { background: "#F2F2F7", color: "#1C1C1E", borderRadius: "4px 18px 18px 18px" }}
              >
                {msg.role === "assistant"
                  ? <AssistantBubble content={msg.content} />
                  : <p className="leading-relaxed">{msg.content}</p>}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)" }}>
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="px-3.5 py-3 rounded-2xl flex items-center gap-1.5"
                style={{ background: "#F2F2F7", borderRadius: "4px 18px 18px 18px" }}>
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full block"
                    style={{ background: "#007AFF", animation: `cadus-dot-bounce 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 flex items-end gap-2 shrink-0"
          style={{ borderTop: "1px solid rgba(60,60,67,0.09)", background: "#FAFAFA" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a medical question…"
            rows={1}
            className="flex-1 text-sm resize-none outline-none rounded-xl px-3 py-2.5"
            style={{
              background: "#F2F2F7",
              border: "1.5px solid rgba(60,60,67,0.1)",
              color: "#1C1C1E",
              maxHeight: 84,
              minHeight: 40,
              transition: "border-color 0.15s",
              lineHeight: "1.45",
            }}
            onFocus={e => (e.target.style.borderColor = "#007AFF")}
            onBlur={e => (e.target.style.borderColor = "rgba(60,60,67,0.1)")}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: input.trim() && !loading
                ? "linear-gradient(135deg,#007AFF,#00C2A8)"
                : "rgba(120,120,128,0.12)",
            }}
          >
            <Send className="w-4 h-4"
              style={{ color: input.trim() && !loading ? "#FFF" : "#AEAEB2" }} />
          </button>
        </div>
      </div>

    </>
  );
}
