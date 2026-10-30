/** Update 77: questions from each source as the study record keeps them (QSnap). */
import type { MCQ } from "@/data/neetpgQuestions";
import { qKey, type QSnap } from "./progress";

export const fromBank = (q: MCQ): QSnap => ({ key: qKey("neetpg", q.question, q.id), question: q.question, options: [...q.options], correct: q.correct, explanation: q.explanation, subject: q.subject, source: "neetpg" });

/** A generated question ({question, options: ["A) …"], correct: "A", explanation}) as a QSnap, or null if malformed. */
export function fromGenerated(x: unknown, subject: string, topic: string): QSnap | null {
  const g = x as { question?: unknown; options?: unknown; correct?: unknown; explanation?: unknown };
  if (!g || typeof g.question !== "string" || !Array.isArray(g.options) || g.options.length < 2) return null;
  const options = g.options.map((o) => String(o).replace(/^\s*[A-Ea-e][).:]\s*/, "").trim());
  const c = String(g.correct ?? "").trim().toUpperCase();
  const idx = /^[A-E]/.test(c) ? c.charCodeAt(0) - 65 : options.findIndex((o) => o.toLowerCase() === c.toLowerCase());
  if (idx < 0 || idx >= options.length) return null;
  return { key: qKey("ai", g.question), question: g.question, options, correct: idx, explanation: String(g.explanation ?? ""), subject, topic, source: "cadus" };
}
export function parseArray(raw: string): unknown[] | null {
  const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try { const a = JSON.parse(s); if (Array.isArray(a)) return a; } catch { /* below */ }
  const m = raw.match(/(\[[\s\S]*\])/);
  try { const a = m ? JSON.parse(m[1]!) : null; return Array.isArray(a) ? a : null; } catch { return null; }
}
