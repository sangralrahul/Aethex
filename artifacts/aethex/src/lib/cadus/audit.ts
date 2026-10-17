/**
 * Answer history: an append-only record of every answer Cadus gave on this
 * device: when, for which tool, by which model, whether the safety review
 * approved or corrected it, with what confidence and how many sources. It is
 * kept separately from chats, so deleting a chat doesn't erase its record.
 * The question is stored de-identified (after the privacy guard) and clipped.
 */

export type AuditStatus = "approved" | "corrected" | "unreviewed" | "library" | "stopped" | "error";

export interface AuditEntry {
  id: string;
  at: number;
  /** The chat and answer it belongs to (the chat may since have been deleted). */
  sid: string;
  mid: string;
  mode: string;
  /** The question after the privacy guard, at most 160 characters. */
  question: string;
  status: AuditStatus;
  /** Display names, e.g. "Cadus Medius 3.1". */
  model: string;
  reviewer?: string;
  confidence?: "high" | "moderate" | "low";
  /** One short line per correction the review made (at most five). */
  changes: string[];
  sources: number;
  /** Identifiers the privacy guard hid from the question. */
  hidden: number;
  ms?: number;
  think?: boolean;
  files?: number;
}

export const AUDIT_KEY = "cadus3.audit";
export const AUDIT_MAX = 2000;

const STATUSES: AuditStatus[] = ["approved", "corrected", "unreviewed", "library", "stopped", "error"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function cleanAudit(raw: unknown): AuditEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e === "object" && typeof e.id === "string" && Number.isFinite(e.at))
    .map((e: any): AuditEntry => ({
      id: e.id,
      at: Number(e.at),
      sid: str(e.sid, 40),
      mid: str(e.mid, 40),
      mode: str(e.mode, 20) || "general",
      question: str(e.question, 160),
      status: STATUSES.includes(e.status) ? e.status : "unreviewed",
      model: str(e.model, 60),
      ...(e.reviewer ? { reviewer: str(e.reviewer, 60) } : {}),
      ...(["high", "moderate", "low"].includes(e.confidence) ? { confidence: e.confidence } : {}),
      changes: Array.isArray(e.changes) ? e.changes.filter((c: unknown) => typeof c === "string").slice(0, 5).map((c: string) => str(c, 160)) : [],
      sources: Math.max(0, Math.round(Number(e.sources) || 0)),
      hidden: Math.max(0, Math.round(Number(e.hidden) || 0)),
      ...(Number.isFinite(e.ms) && e.ms > 0 ? { ms: Math.round(e.ms) } : {}),
      ...(e.think ? { think: true } : {}),
      ...(Number(e.files) > 0 ? { files: Math.round(Number(e.files)) } : {}),
    }));
}

export function readAudit(): AuditEntry[] {
  try {
    return cleanAudit(JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"));
  } catch {
    return [];
  }
}

function write(list: AuditEntry[]) {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
  } catch {
    // Storage is full: keep the newest half.
    try { localStorage.setItem(AUDIT_KEY, JSON.stringify(list.slice(0, Math.floor(list.length / 2)))); } catch { /* blocked */ }
  }
}

/** Adds an entry (newest first). Entries are never edited, only added or cleared. */
export function recordAudit(entry: AuditEntry, list = readAudit()): AuditEntry[] {
  const next = [cleanAudit([entry])[0], ...list.filter((e) => e.id !== entry.id)].slice(0, AUDIT_MAX);
  write(next);
  return next;
}

export function clearAudit() {
  try { localStorage.removeItem(AUDIT_KEY); } catch { /* blocked */ }
}

export interface AuditStats {
  answers: number;
  reviewed: number;
  corrected: number;
  corrections: number;
  hidden: number;
  /** Share of answers that went through the safety review, 0 to 100. */
  reviewedPct: number;
  highConfidencePct: number;
}

export function auditStats(list: AuditEntry[]): AuditStats {
  const answered = list.filter((e) => e.status !== "error" && e.status !== "stopped");
  const reviewed = answered.filter((e) => e.status === "approved" || e.status === "corrected");
  const corrected = reviewed.filter((e) => e.status === "corrected");
  const high = reviewed.filter((e) => e.confidence === "high").length;
  return {
    answers: answered.length,
    reviewed: reviewed.length,
    corrected: corrected.length,
    corrections: corrected.reduce((n, e) => n + Math.max(1, e.changes.length), 0),
    hidden: list.reduce((n, e) => n + e.hidden, 0),
    reviewedPct: answered.length ? Math.round((reviewed.length / answered.length) * 100) : 0,
    highConfidencePct: reviewed.length ? Math.round((high / reviewed.length) * 100) : 0,
  };
}

export const STATUS_TEXT: Record<AuditStatus, string> = {
  approved: "Approved by review",
  corrected: "Corrected by review",
  unreviewed: "Not reviewed",
  library: "Medical Library",
  stopped: "Stopped",
  error: "Failed",
};

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? "" : String(v);
  // Quote everything; neutralise spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** The history as CSV (opens in Excel), oldest first. */
export function auditCsv(list: AuditEntry[]): string {
  const head = ["Date", "Time", "Tool", "Question", "Status", "Model", "Reviewer", "Confidence", "Corrections", "Sources", "Identifiers hidden", "Seconds"];
  const rows = [...list].sort((a, b) => a.at - b.at).map((e) => {
    const d = new Date(e.at);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return [date, time, e.mode, e.question, STATUS_TEXT[e.status], e.model, e.reviewer ?? "", e.confidence ?? "", e.changes.join(" | "), e.sources, e.hidden, e.ms ? Math.round(e.ms / 1000) : ""]
      .map(csvCell).join(",");
  });
  return [head.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}
