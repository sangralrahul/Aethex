import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { Brain, RotateCcw, ChevronLeft, Check, X } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { useFlashcards } from "@/hooks/use-flashcards";

export default function Flashcards() {
  const [, params] = useRoute("/flashcards/:deckId");
  const deckId = params?.deckId;

  if (deckId) return <DeckStudy deckId={deckId} />;
  return <DeckList />;
}

function DeckList() {
  const { decks, deckStats } = useFlashcards();
  return (
    <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
      <PageHero
        icon={<Brain className="w-6 h-6" />}
        title="Smart Flashcards"
        subtitle="Spaced repetition powered by the SM-2 algorithm"
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((d) => {
            const s = deckStats(d.id);
            const pct = s.total ? Math.round((s.learned / s.total) * 100) : 0;
            return (
              <Link key={d.id} href={`/flashcards/${d.id}`}>
                <a className="block bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{d.emoji}</div>
                    {s.due > 0 && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                        {s.due} due
                      </span>
                    )}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{d.subject}</div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: "#1C1C1E" }}>{d.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{d.description}</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0F766E" }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>{s.learned}/{s.total} learned</span>
                    <span>{pct}%</span>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeckStudy({ deckId }: { deckId: string }) {
  const { cards, dueCards, review, resetDeck, decks } = useFlashcards(deckId);
  const deck = decks.find((d) => d.id === deckId);
  const [queue, setQueue] = useState<string[]>(() => (dueCards.length ? dueCards.map((c) => c.id) : cards.map((c) => c.id)));
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const currentCard = useMemo(() => cards.find((c) => c.id === queue[0]), [cards, queue]);

  function grade(quality: number) {
    if (!currentCard) return;
    review(currentCard.id, quality);
    setReviewed((r) => r + 1);
    setFlipped(false);
    setQueue((q) => (quality < 3 ? [...q.slice(1), q[0]] : q.slice(1)));
  }

  if (!deck) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p>Deck not found.</p>
        <Link href="/flashcards"><a className="text-teal-700 underline">Back to decks</a></Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
      <PageHero icon={<span className="text-2xl">{deck.emoji}</span>} title={deck.name} subtitle={deck.subject} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/flashcards">
            <a className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
              <ChevronLeft className="w-4 h-4" /> All decks
            </a>
          </Link>
          <div className="text-sm text-slate-600">
            {queue.length} left · {reviewed} reviewed
          </div>
          <button onClick={() => { resetDeck(deckId); setQueue(cards.map((c) => c.id)); setReviewed(0); setFlipped(false); }} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {!currentCard ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Check className="w-12 h-12 mx-auto text-teal-600 mb-3" />
            <h3 className="text-xl font-bold mb-2">All caught up!</h3>
            <p className="text-slate-600 mb-6">You've reviewed every due card in this deck.</p>
            <Link href="/flashcards"><Button>Choose another deck</Button></Link>
          </div>
        ) : (
          <>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="w-full min-h-[280px] bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center text-center hover:shadow-md transition"
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                  {flipped ? "Answer" : "Question"}
                </div>
                <div className="text-xl font-medium leading-relaxed" style={{ color: "#1C1C1E" }}>
                  {flipped ? currentCard.back : currentCard.front}
                </div>
                {!flipped && <div className="text-xs text-slate-400 mt-6">Click to reveal</div>}
              </div>
            </button>

            {flipped ? (
              <div className="grid grid-cols-4 gap-2 mt-4">
                <Button variant="outline" onClick={() => grade(0)} className="border-red-300 text-red-700 hover:bg-red-50">
                  <X className="w-4 h-4 mr-1" /> Again
                </Button>
                <Button variant="outline" onClick={() => grade(3)} className="border-amber-300 text-amber-700 hover:bg-amber-50">Hard</Button>
                <Button variant="outline" onClick={() => grade(4)} className="border-teal-300 text-teal-700 hover:bg-teal-50">Good</Button>
                <Button onClick={() => grade(5)} style={{ background: "#0F766E" }}>Easy</Button>
              </div>
            ) : (
              <div className="mt-4">
                <Button onClick={() => setFlipped(true)} className="w-full" style={{ background: "#1C1C1E" }}>
                  Show answer
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
