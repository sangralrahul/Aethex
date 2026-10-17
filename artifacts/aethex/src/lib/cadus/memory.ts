/**
 * Personalisation like ChatGPT's: custom instructions (what Cadus should know
 * about you, how it should respond) and memory (facts Cadus keeps across
 * chats). Stored on this device only; sent with each question as preferences.
 */

export interface MemoryItem {
  id: string;
  text: string;
  at: number;
}

export interface Personal {
  /** What Cadus should know about you. */
  about: string;
  /** How Cadus should respond. */
  style: string;
  useCustom: boolean;
  memory: MemoryItem[];
  useMemory: boolean;
}

export const PERSONAL_KEY = "cadus3.personal";
export const ABOUT_MAX = 1500;
export const MEMORY_MAX = 30;
export const MEMORY_ITEM_MAX = 200;

export const EMPTY_PERSONAL: Personal = { about: "", style: "", useCustom: true, memory: [], useMemory: true };

export function readPersonal(): Personal {
  try {
    const raw = JSON.parse(localStorage.getItem(PERSONAL_KEY) || "null");
    if (!raw || typeof raw !== "object") return { ...EMPTY_PERSONAL };
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    return {
      about: str(raw.about, ABOUT_MAX),
      style: str(raw.style, ABOUT_MAX),
      useCustom: raw.useCustom !== false,
      memory: Array.isArray(raw.memory)
        ? raw.memory
          .filter((m: any) => m && typeof m.text === "string" && m.text.trim())
          .slice(0, MEMORY_MAX)
          .map((m: any) => ({ id: String(m.id || Math.random().toString(36).slice(2, 9)), text: m.text.slice(0, MEMORY_ITEM_MAX), at: Number(m.at) || Date.now() }))
        : [],
      useMemory: raw.useMemory !== false,
    };
  } catch {
    return { ...EMPTY_PERSONAL };
  }
}

export function savePersonal(p: Personal) {
  try {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(p));
  } catch { /* storage full or blocked */ }
}

/** What the server needs, or undefined when there is nothing to send. */
export function personalPayload(p: Personal): { about?: string; style?: string; memory?: string[] } | undefined {
  const about = p.useCustom ? p.about.trim() : "";
  const style = p.useCustom ? p.style.trim() : "";
  const memory = p.useMemory ? p.memory.map((m) => m.text.trim()).filter(Boolean) : [];
  if (!about && !style && !memory.length) return undefined;
  return { ...(about ? { about } : {}), ...(style ? { style } : {}), ...(memory.length ? { memory } : {}) };
}

/**
 * "Remember that I work in a district hospital" → "I work in a district hospital".
 * Questions ("do you remember…?") and memory aids ("how to remember…") are not memories.
 */
export function rememberFrom(text: string): string | null {
  const t = text.trim();
  if (t.length > 400 || /\?\s*$/.test(t)) return null;
  const m = /^(?:please\s+|pls\s+|cadus,?\s+)?(?:remember|note|keep in mind|don'?t forget)\s*(?:that|:|,)?\s+(.{4,})$/i.exec(t);
  if (!m) return null;
  let fact = m[1].trim().replace(/[.!\s]+$/, "");
  if (/^(how|the mnemonic|mnemonics?|this (for|in)|these)\b/i.test(fact)) return null;
  // "remember I am a resident" → keep as stated; capitalise the first letter.
  fact = fact.charAt(0).toUpperCase() + fact.slice(1);
  return fact.length >= 4 ? fact.slice(0, MEMORY_ITEM_MAX) : null;
}

export function addMemory(p: Personal, text: string, now = Date.now()): Personal {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, MEMORY_ITEM_MAX);
  if (!clean) return p;
  const key = clean.toLowerCase();
  const rest = p.memory.filter((m) => m.text.toLowerCase() !== key);
  return { ...p, memory: [{ id: now.toString(36) + Math.random().toString(36).slice(2, 6), text: clean, at: now }, ...rest].slice(0, MEMORY_MAX) };
}

export function removeMemory(p: Personal, id: string): Personal {
  return { ...p, memory: p.memory.filter((m) => m.id !== id) };
}
