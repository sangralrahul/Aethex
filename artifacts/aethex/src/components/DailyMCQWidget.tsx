import { useState, useEffect } from "react";
import { BookOpen, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useUserAuth } from "@/hooks/use-user-auth";
import { loginUrl } from "@/lib/host";


const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DailyMCQ {
  id: number;
  question: string;
  options: string[];
  subject: string;
  date: string;
}

interface MCQAnswer {
  correct: string;
  explanation: string;
  subject: string;
}

function WhatsAppShareButton({ question, subject }: { question: string; subject: string }) {
  const shareText = encodeURIComponent(
    `Check this NEET-PG MCQ on Aethex 👨‍⚕️\n\n${subject}: ${question}\n\nPractice more at aethex.in`
  );
  return (
    <a
      href={`https://wa.me/?text=${shareText}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80"
      style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.25)" }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Share on WhatsApp
    </a>
  );
}

export function DailyMCQWidget() {
  const { user, getJwt } = useUserAuth();
  const [mcq, setMcq] = useState<DailyMCQ | null>(null);
  const [answer, setAnswer] = useState<MCQAnswer | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/monetization/daily-mcq`)
      .then(r => r.json())
      .then(data => { setMcq(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSelect = async (opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const jwt = getJwt();
    const headers: Record<string, string> = {};
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    const res = await fetch(`${API_BASE}/api/monetization/daily-mcq/answer`, { headers });
    if (res.ok) setAnswer(await res.json());
  };

  if (loading) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", height: 200 }} />
  );
  if (!mcq) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg,rgba(10,22,50,0.95) 0%,rgba(13,33,68,0.95) 100%)",
        border: "1px solid rgba(0,194,168,0.2)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,194,168,0.15)" }}>
            <BookOpen className="w-3.5 h-3.5" style={{ color: "#00C2A8" }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#00C2A8" }}>FREE DAILY MCQ</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{mcq.subject} · {new Date(mcq.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          </div>
        </div>
        <Link href="/study-hub">
          <button className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(0,194,168,0.12)", color: "#00C2A8", border: "1px solid rgba(0,194,168,0.2)" }}>
            Study Hub
          </button>
        </Link>
      </div>

      <div className="p-5">
        <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>{mcq.question}</p>

        <div className="space-y-2.5 mb-4">
          {mcq.options.map((opt) => {
            const optLetter = opt.charAt(0);
            const isCorrect = answered && answer && optLetter === answer.correct;
            const isWrong = answered && selected === opt && answer && optLetter !== answer.correct;
            let bg = "rgba(255,255,255,0.04)";
            let border = "rgba(255,255,255,0.08)";
            let textColor = "rgba(255,255,255,0.75)";
            if (isCorrect) { bg = "rgba(34,197,94,0.12)"; border = "rgba(34,197,94,0.4)"; textColor = "rgba(134,239,172,0.95)"; }
            if (isWrong) { bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.35)"; textColor = "rgba(252,165,165,0.9)"; }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={answered}
                className="w-full text-left px-3.5 py-2.5 rounded-xl border text-sm flex items-center gap-2.5 transition-all"
                style={{ background: bg, borderColor: border, color: textColor, cursor: answered ? "default" : "pointer" }}
              >
                {answered && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#4ade80" }} />}
                {answered && isWrong && <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#f87171" }} />}
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && answer && (
          <div className="rounded-xl p-3.5 text-sm mb-3" style={{ background: "rgba(0,194,168,0.07)", border: "1px solid rgba(0,194,168,0.18)" }}>
            {user ? (
              <>
                <p className="font-semibold text-xs mb-1" style={{ color: "#00C2A8" }}>Explanation</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{answer.explanation}</p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "#f59e0b" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    Sign up to reveal the explanation
                  </p>
                  <Link href="/signup">
                    <span className="text-xs underline" style={{ color: "#00C2A8" }}>Create free account →</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {answered && (
          <WhatsAppShareButton question={mcq.question} subject={mcq.subject} />
        )}

        {!answered && (
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Select an option to reveal the answer</p>
        )}
      </div>
    </div>
  );
}
