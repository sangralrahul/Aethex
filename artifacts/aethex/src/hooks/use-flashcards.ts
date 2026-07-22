import { useCallback, useEffect, useState } from "react";
import { FLASHCARDS, DECKS, type Flashcard } from "@/data/flashcards";

// SM-2 spaced repetition state per card
export type CardState = {
  id: string;
  ease: number; // EF, starts at 2.5
  interval: number; // days
  repetitions: number;
  dueAt: number; // epoch ms
  lastReviewedAt?: number;
};

const STORAGE_KEY = "aethex_flashcards_v1";
const EVENT = "aethex-flashcards-changed";

function loadState(): Record<string, CardState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState(s: Record<string, CardState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVENT));
}

function ensureState(existing: Record<string, CardState>, id: string): CardState {
  return (
    existing[id] || {
      id,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      dueAt: Date.now(),
    }
  );
}

// quality: 0 = Again, 3 = Hard, 4 = Good, 5 = Easy
export function sm2(card: CardState, quality: number): CardState {
  const now = Date.now();
  let { ease, interval, repetitions } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 0; // review again within same session
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * ease);
    repetitions += 1;
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  const dueAt = quality < 3 ? now + 60_000 : now + interval * 24 * 60 * 60 * 1000;
  return { ...card, ease, interval, repetitions, dueAt, lastReviewedAt: now };
}

export function useFlashcards(deckId?: string) {
  const [state, setState] = useState<Record<string, CardState>>({});

  useEffect(() => {
    setState(loadState());
    const sync = () => setState(loadState());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const review = useCallback((cardId: string, quality: number) => {
    const s = loadState();
    const next = sm2(ensureState(s, cardId), quality);
    s[cardId] = next;
    saveState(s);
  }, []);

  const resetDeck = useCallback((id: string) => {
    const s = loadState();
    FLASHCARDS.filter((c) => c.deckId === id).forEach((c) => delete s[c.id]);
    saveState(s);
  }, []);

  const cards: Flashcard[] = deckId ? FLASHCARDS.filter((c) => c.deckId === deckId) : FLASHCARDS;
  const now = Date.now();
  const dueCards = cards.filter((c) => {
    const st = state[c.id];
    return !st || st.dueAt <= now;
  });

  const deckStats = (id: string) => {
    const deckCards = FLASHCARDS.filter((c) => c.deckId === id);
    const learned = deckCards.filter((c) => (state[c.id]?.repetitions ?? 0) > 0).length;
    const due = deckCards.filter((c) => {
      const st = state[c.id];
      return !st || st.dueAt <= now;
    }).length;
    return { total: deckCards.length, learned, due };
  };

  return { state, cards, dueCards, review, resetDeck, decks: DECKS, deckStats };
}
