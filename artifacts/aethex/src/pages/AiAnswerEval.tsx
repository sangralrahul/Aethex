import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Loader2, Star, ChevronDown, ChevronUp, Clock, BarChart3, AlertTriangle, Trophy, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SAMPLE_TOPICS = [
  "Pathophysiology of acute myocardial infarction",
  "Management of diabetic ketoacidosis",
  "Mechanism and clinical features of meningitis",
  "Approach to a patient with haemoptysis",
  "Pathophysiology of cardiac tamponade",
];

interface Attempt {
  id: string;
  topic: string;
  answer: string;
  score: number;
  accuracy: number;
  completeness: number;
  clinicalRelevance: number;
  feedback: string;
  missedPoints: string[];
  idealStructure: string;
  timestamp: number;
}

const STORAGE_KEY = "aethex_answer_eval_attempts";

function loadAttempts(): Attempt[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveAttempts(a: Attempt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(a.slice(0, 50)));
}

export default function AiAnswerEval() {
  const [topic, setTopic] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>(loadAttempts);
  const [tab, setTab] = useState<"evaluate" | "history">("evaluate");
  const [historyExpanded, setHistoryExpanded] = useState<string | null>(null);

  useEffect(() => { saveAttempts(attempts); }, [attempts]);

  async function handleEvaluate() {
    if (!topic.trim() || !answer.trim()) return;
    setLoading(true);
    setResult(null);

    const prompt = `You are an expert NEET-PG examiner evaluating an Indian medical student's answer.

Topic/Question: ${topic}

Student's Answer:
${answer}

Evaluate this answer strictly as a NEET-PG examiner and respond ONLY as valid JSON (no markdown):
{
  "score": <number 0-10>,
  "accuracy": <number 0-10>,
  "completeness": <number 0-10>,
  "clinicalRelevance": <number 0-10>,
  "feedback": "<2-3 sentence overall feedback>",
  "missedPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "idealStructure": "<How the ideal answer should be structured for NEET-PG>"
}`;

    try {
      const res = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, conversationHistory: [], agent: "cadus", mode: "normal" }),
      });
      const data = await res.json();
      const text: string = data.message || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const attempt: Attempt = {
          id: Date.now().toString(),
          topic,
          answer,
          score: parsed.score || 0,
          accuracy: parsed.accuracy || 0,
          completeness: parsed.completeness || 0,
          clinicalRelevance: parsed.clinicalRelevance || 0,
          feedback: parsed.feedback || "",
          missedPoints: parsed.missedPoints || [],
          idealStructure: parsed.idealStructure || "",
          timestamp: Date.now(),
        };
        setResult(attempt);
        setAttempts(prev => [attempt, ...prev]);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  function deleteAttempt(id: string) {
    setAttempts(prev => prev.filter(a => a.id !== id));
  }

  const scoreColor = (s: number) => s >= 7 ? "#22c55e" : s >= 4 ? "#f59e0b" : "#ef4444";
  const scoreLabel = (s: number) => s >= 7 ? "Excellent" : s >= 4 ? "Needs Improvement" : "Below Standard";

  const chartData = [...attempts].reverse().slice(-10).map((a, i) => ({ i: i + 1, score: a.score }));

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#fff" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0B0F1A 0%,#0d1730 100%)", borderBottom: "1px solid rgba(0,122,255,0.2)", padding: "48px 0 32px" }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ background: "rgba(0,122,255,0.15)", borderRadius: 12, padding: 10 }}>
              <PenLine size={28} style={{ color: "#007AFF" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Answer Evaluator</h1>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>NEET-PG format · Scored by Cadus</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            <p style={{ color: "#fca5a5", fontSize: 13 }}>Educational tool. AI evaluations are not official NEET-PG assessments.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl mb-8 w-fit" style={{ background: "rgba(255,255,255,0.06)" }}>
          {(["evaluate", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={tab === t ? { background: "#007AFF", color: "#fff" } : { color: "rgba(255,255,255,0.6)" }}>
              {t === "evaluate" ? "✏️ Evaluate Answer" : `📊 History (${attempts.length})`}
            </button>
          ))}
        </div>

        {tab === "evaluate" && (
          <div className="space-y-5">
            {/* Topic */}
            <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <label className="block text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>Topic / Question</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Pathophysiology of acute myocardial infarction"
                className="w-full rounded-xl px-4 py-3 text-sm mb-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TOPICS.map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{ background: "rgba(0,122,255,0.1)", color: "#60a5fa", border: "1px solid rgba(0,122,255,0.2)" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer */}
            <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Your Answer</label>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{answer.length} chars</span>
              </div>
              <textarea
                value={answer} onChange={e => setAnswer(e.target.value)}
                placeholder="Write your answer here as you would in the NEET-PG exam. Be comprehensive — cover definition, pathophysiology, clinical features, investigations, and management..."
                rows={10}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}
              />
              <button onClick={handleEvaluate} disabled={loading || !topic.trim() || !answer.trim()}
                className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ background: loading || !topic.trim() || !answer.trim() ? "rgba(0,122,255,0.3)" : "#007AFF", color: "#fff" }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} />}
                {loading ? "Evaluating..." : "Evaluate Answer"}
              </button>
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Score Card */}
                  <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: `1px solid ${scoreColor(result.score)}40` }}>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold" style={{ color: scoreColor(result.score) }}>{result.score}</div>
                        <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>/ 10</div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{scoreLabel(result.score)}</div>
                        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{result.feedback}</p>
                      </div>
                    </div>

                    {/* Sub-scores */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Accuracy", val: result.accuracy },
                        { label: "Completeness", val: result.completeness },
                        { label: "Clinical Relevance", val: result.clinicalRelevance },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="text-2xl font-bold" style={{ color: scoreColor(val) }}>{val}/10</div>
                          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</div>
                          <div className="mt-2 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${val * 10}%`, background: scoreColor(val) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missed Points */}
                  {result.missedPoints.length > 0 && (
                    <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div className="font-semibold mb-3 flex items-center gap-2">
                        <span style={{ color: "#ef4444" }}>✗</span> Points You Missed
                      </div>
                      <ul className="space-y-2">
                        {result.missedPoints.map((p, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                            <span style={{ color: "#ef4444", flexShrink: 0 }}>•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ideal Structure */}
                  <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <div className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy size={16} style={{ color: "#22c55e" }} /> Ideal NEET-PG Answer Structure
                    </div>
                    <p className="text-sm whitespace-pre-line" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                      {result.idealStructure}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            {chartData.length > 1 && (
              <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={18} style={{ color: "#007AFF" }} /> Score Progression
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="i" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#161B2E", border: "1px solid rgba(0,122,255,0.3)", borderRadius: 8, color: "#fff" }} />
                    <Line type="monotone" dataKey="score" stroke="#007AFF" strokeWidth={2} dot={{ fill: "#007AFF", strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {attempts.length === 0 && (
              <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.4)" }}>
                <PenLine size={40} className="mx-auto mb-4 opacity-30" />
                <p>No attempts yet. Evaluate your first answer!</p>
              </div>
            )}

            {attempts.map(a => (
              <div key={a.id} className="rounded-2xl overflow-hidden" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setHistoryExpanded(historyExpanded === a.id ? null : a.id)}>
                  <div className="text-2xl font-bold w-12 text-center" style={{ color: scoreColor(a.score) }}>{a.score}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.topic}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <Clock size={10} className="inline mr-1" />
                      {new Date(a.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${scoreColor(a.score)}20`, color: scoreColor(a.score) }}>
                      {scoreLabel(a.score)}
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteAttempt(a.id); }} style={{ color: "rgba(255,255,255,0.3)" }}>
                      <Trash2 size={14} />
                    </button>
                    {historyExpanded === a.id ? <ChevronUp size={16} style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown size={16} style={{ color: "rgba(255,255,255,0.4)" }} />}
                  </div>
                </div>
                <AnimatePresence>
                  {historyExpanded === a.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                      <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <p className="text-sm pt-4" style={{ color: "rgba(255,255,255,0.6)" }}>{a.feedback}</p>
                        {a.missedPoints.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>Missed points:</div>
                            <ul className="space-y-1">{a.missedPoints.map((p, i) => <li key={i} className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>• {p}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
