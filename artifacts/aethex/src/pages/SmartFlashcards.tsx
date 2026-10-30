import { useState, useEffect } from "react";
import { MyCardsBanner } from "@/components/study/StudyBits2";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Loader2, RotateCcw, CheckCircle, XCircle, ChevronDown, Trash2, Brain, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const STORAGE = "aethex_flashcards";

interface Card { id: string; front: string; back: string; interval: number; efFactor: number; due: number; reps: number; }
interface Deck { id: string; name: string; topic: string; cards: Card[]; created: number; }

function sm2(card: Card, quality: number): Card {
  const q = Math.max(0, Math.min(5, quality));
  const ef = Math.max(1.3, card.efFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const interval = card.reps === 0 ? 1 : card.reps === 1 ? 6 : Math.round(card.interval * ef);
  return { ...card, efFactor: ef, interval, reps: card.reps + 1, due: Date.now() + interval * 86400000 };
}

function loadDecks(): Deck[] {
  try { return JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch { return []; }
}
function saveDecks(d: Deck[]) { localStorage.setItem(STORAGE, JSON.stringify(d)); }

const SAMPLE_TOPICS = ["Cardiac pharmacology", "Cranial nerves", "Haematology basics", "Renal physiology", "Antibiotics"];

export default function SmartFlashcards() {
  const [decks, setDecks] = useState<Deck[]>(loadDecks);
  const [view, setView] = useState<"home" | "study" | "create">("home");
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [topic, setTopic] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [studyIdx, setStudyIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Card[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, hard: 0, again: 0 });

  useEffect(() => { saveDecks(decks); }, [decks]);

  const dueCards = (deck: Deck) => deck.cards.filter(c => c.due <= Date.now()).length;
  const totalDue = decks.reduce((s, d) => s + dueCards(d), 0);

  async function generateDeck() {
    if (!topic.trim()) return;
    setLoading(true);
    const prompt = `Generate ${cardCount} medical flashcards on the topic: "${topic}" for NEET-PG preparation.
Respond ONLY as valid JSON (no markdown):
{
  "cards": [
    { "front": "Question or term", "back": "Detailed answer or definition (2-3 sentences)" }
  ]
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
        const newCards: Card[] = (parsed.cards || []).map((c: any, i: number) => ({
          id: `${Date.now()}-${i}`,
          front: c.front,
          back: c.back,
          interval: 1,
          efFactor: 2.5,
          due: Date.now(),
          reps: 0,
        }));
        const newDeck: Deck = { id: Date.now().toString(), name: topic, topic, cards: newCards, created: Date.now() };
        setDecks(prev => [newDeck, ...prev]);
        setView("home");
        setTopic("");
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  function startStudy(deck: Deck) {
    const due = deck.cards.filter(c => c.due <= Date.now());
    const queue = due.length > 0 ? due : deck.cards.slice(0, 10);
    setStudyQueue(queue);
    setActiveDeck(deck);
    setStudyIdx(0);
    setFlipped(false);
    setSessionDone(false);
    setStats({ correct: 0, hard: 0, again: 0 });
    setView("study");
  }

  function handleRating(quality: number) {
    if (!studyQueue[studyIdx] || !activeDeck) return;
    const updatedCard = sm2(studyQueue[studyIdx], quality);
    const updatedDeck = { ...activeDeck, cards: activeDeck.cards.map(c => c.id === updatedCard.id ? updatedCard : c) };
    setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));
    setActiveDeck(updatedDeck);
    setStats(s => quality >= 4 ? { ...s, correct: s.correct + 1 } : quality >= 3 ? { ...s, hard: s.hard + 1 } : { ...s, again: s.again + 1 });
    if (studyIdx + 1 >= studyQueue.length) { setSessionDone(true); }
    else { setStudyIdx(i => i + 1); setFlipped(false); }
  }

  function deleteDeck(id: string) { setDecks(prev => prev.filter(d => d.id !== id)); }

  const pct = (deck: Deck) => deck.cards.length ? Math.round((deck.cards.filter(c => c.reps > 0).length / deck.cards.length) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#fff" }}>
      <div className="max-w-4xl mx-auto px-4 pt-6"><MyCardsBanner /></div>
      <div style={{ background: "linear-gradient(135deg,#0B0F1A,#0d1020)", borderBottom: "1px solid rgba(139,92,246,0.2)", padding: "48px 0 32px" }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ background: "rgba(139,92,246,0.15)", borderRadius: 12, padding: 10 }}>
              <BookOpen size={28} style={{ color: "#8B5CF6" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Flashcards</h1>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>SM-2 spaced repetition · AI-generated decks</p>
            </div>
            {totalDue > 0 && (
              <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Clock size={16} style={{ color: "#8B5CF6" }} />
                <span style={{ color: "#a78bfa", fontWeight: 600 }}>{totalDue} cards due today</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {view === "home" && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setView("create")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all"
                style={{ background: "#8B5CF6", color: "#fff" }}>
                <Plus size={18} /> Generate Deck with AI
              </button>
            </div>

            {/* Decks */}
            {decks.length === 0 ? (
              <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.35)" }}>
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No decks yet</p>
                <p className="text-sm">Generate your first deck from any medical topic</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {decks.map(deck => (
                  <div key={deck.id} className="rounded-2xl p-5" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold">{deck.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{deck.cards.length} cards · {pct(deck)}% reviewed</div>
                      </div>
                      <button onClick={() => deleteDeck(deck.id)} style={{ color: "rgba(255,255,255,0.3)" }}><Trash2 size={14} /></button>
                    </div>
                    <div className="h-1.5 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct(deck)}%`, background: "#8B5CF6" }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startStudy(deck)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: dueCards(deck) > 0 ? "#8B5CF6" : "rgba(139,92,246,0.2)", color: dueCards(deck) > 0 ? "#fff" : "#a78bfa" }}>
                        {dueCards(deck) > 0 ? `Study (${dueCards(deck)} due)` : "Review All"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "create" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              ← Back to decks
            </button>
            <div className="rounded-2xl p-6" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="font-semibold text-lg mb-5">Generate New Deck</h2>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Cardiac pharmacology, ECG interpretation, Cranial nerves..."
                className="w-full rounded-xl px-4 py-3 text-sm mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />

              <div className="flex flex-wrap gap-2 mb-5">
                {SAMPLE_TOPICS.map(t => (
                  <button key={t} onClick={() => setTopic(t)} className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                    {t}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Number of cards: {cardCount}</label>
              <input type="range" min={5} max={30} step={5} value={cardCount} onChange={e => setCardCount(+e.target.value)}
                className="w-full mb-5 accent-purple-500" />

              <button onClick={generateDeck} disabled={loading || !topic.trim()}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: loading || !topic.trim() ? "rgba(139,92,246,0.3)" : "#8B5CF6", color: "#fff" }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                {loading ? "Generating cards..." : `Generate ${cardCount} Cards`}
              </button>
            </div>
          </motion.div>
        )}

        {view === "study" && activeDeck && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView("home")} className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>← Exit</button>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {sessionDone ? "Complete!" : `${studyIdx + 1} / ${studyQueue.length}`}
              </div>
            </div>

            {sessionDone ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-8 text-center" style={{ background: "#161B2E" }}>
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
                <p className="mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Great study session on {activeDeck.name}</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.1)" }}>
                    <div className="text-2xl font-bold" style={{ color: "#22c55e" }}>{stats.correct}</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Easy</div>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.1)" }}>
                    <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{stats.hard}</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Hard</div>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <div className="text-2xl font-bold" style={{ color: "#ef4444" }}>{stats.again}</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Again</div>
                  </div>
                </div>
                <button onClick={() => setView("home")}
                  className="px-8 py-3 rounded-xl font-semibold" style={{ background: "#8B5CF6", color: "#fff" }}>
                  Back to Decks
                </button>
              </motion.div>
            ) : (
              <div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full mb-6" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${((studyIdx) / studyQueue.length) * 100}%`, background: "#8B5CF6" }} />
                </div>

                {/* Card */}
                <div className="relative cursor-pointer mb-6" style={{ perspective: 1000, minHeight: 280 }} onClick={() => setFlipped(f => !f)}>
                  <motion.div className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center"
                    style={{ background: "#161B2E", border: "1px solid rgba(139,92,246,0.3)", backfaceVisibility: "hidden" }}
                    animate={{ rotateY: flipped ? -180 : 0 }} transition={{ duration: 0.4 }}>
                    <div className="text-xs uppercase tracking-widest mb-4" style={{ color: "#8B5CF6" }}>Front — Tap to flip</div>
                    <p className="text-xl font-semibold text-center leading-relaxed">{studyQueue[studyIdx]?.front}</p>
                  </motion.div>
                  <motion.div className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.4)", backfaceVisibility: "hidden" }}
                    initial={{ rotateY: 180 }} animate={{ rotateY: flipped ? 0 : 180 }} transition={{ duration: 0.4 }}>
                    <div className="text-xs uppercase tracking-widest mb-4" style={{ color: "#a78bfa" }}>Answer</div>
                    <p className="text-base text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{studyQueue[studyIdx]?.back}</p>
                  </motion.div>
                </div>

                {/* Rating buttons — only shown when flipped */}
                <AnimatePresence>
                  {flipped && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleRating(1)}
                        className="py-3 rounded-xl font-semibold transition-all"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                        Again
                      </button>
                      <button onClick={() => handleRating(3)}
                        className="py-3 rounded-xl font-semibold transition-all"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                        Hard
                      </button>
                      <button onClick={() => handleRating(5)}
                        className="py-3 rounded-xl font-semibold transition-all"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                        Easy
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!flipped && <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Tap the card to reveal the answer</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
