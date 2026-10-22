/**
 * Speech input (dictation) for Cadus. Browsers such as Chrome and Edge send speech to their
 * own recognition service; the Cadus desktop app (an Electron window) has no such service,
 * so there voice input is turned off with a clear message instead of failing silently.
 * Reading aloud (speech synthesis) uses the computer's own voices and works everywhere.
 */
export const IN_DESKTOP_APP = typeof navigator !== "undefined" && /CadusDesktop\//.test(navigator.userAgent);

/** The browser's speech recognition constructor, or null where it can't work. */
export function speechRecognition(): any {
  if (typeof window === "undefined" || IN_DESKTOP_APP) return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
export const canDictate = () => !!speechRecognition();

/** Why dictation isn't available here, in one line for a toast. */
export const NO_DICTATION = IN_DESKTOP_APP
  ? "Voice typing isn't available in the desktop app yet. Type instead, or use Cadus in Chrome or Edge for voice."
  : "Voice typing isn't supported in this browser. Use Chrome or Edge, or type instead.";

/** A message for a recognition error, or "" when it needs none (silence, or the user stopped). */
export function dictationError(code: unknown): string {
  switch (String(code)) {
    case "not-allowed":
    case "service-not-allowed": return "Allow the microphone for Cadus to use voice typing.";
    case "audio-capture": return "No microphone was found.";
    case "network": return "Voice typing couldn't reach the speech service. Check the connection, or type instead.";
    case "language-not-supported": return "Voice typing doesn't support this language in this browser. Type instead.";
    default: return "";
  }
}
