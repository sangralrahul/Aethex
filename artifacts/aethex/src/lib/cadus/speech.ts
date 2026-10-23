/**
 * Speech input (dictation) for Cadus. Chrome, Edge and Safari have their own recognition
 * service and use it (live words as you speak). The Cadus desktop app and browsers without
 * one (Firefox) record the microphone and transcribe it on the site's own server instead
 * (lib/cadus/recorder.ts), so voice typing works everywhere there is a microphone.
 * Reading aloud (speech synthesis) uses the computer's own voices.
 */
import { canRecord, ServerRecognition } from "./recorder";

export const IN_DESKTOP_APP = typeof navigator !== "undefined" && /CadusDesktop\//.test(navigator.userAgent);

/** The browser's own speech recognition, or null in the desktop app and where there is none. */
function nativeRecognition(): any {
  if (typeof window === "undefined" || IN_DESKTOP_APP) return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** A SpeechRecognition-like constructor: the browser's own, or Cadus's server transcription. */
export function speechRecognition(): any {
  return nativeRecognition() || (canRecord() ? ServerRecognition : null);
}
export const canDictate = () => !!speechRecognition();
/** True where words appear only after a pause (server transcription), not while speaking. */
export const dictatesAfterPause = () => !nativeRecognition() && canRecord();

/** Why dictation isn't available here, in one line for a toast. */
export const NO_DICTATION = "Voice typing needs a microphone, and this browser can't use one. Type instead.";

/** A message for a recognition error, or "" when it needs none (silence, or the user stopped). */
export function dictationError(code: unknown): string {
  switch (String(code)) {
    case "not-allowed":
    case "service-not-allowed": return IN_DESKTOP_APP ? "Allow Cadus to use the microphone: Windows Settings › Privacy › Microphone, then try again." : "Allow the microphone for Cadus to use voice typing.";
    case "audio-capture": return "No microphone was found.";
    case "network": return "Voice typing couldn't reach the speech service. Check the connection, or type instead.";
    case "server-unavailable": return "Voice typing is being set up on the server. Type for now.";
    case "too-long": return "That was too long to transcribe in one go. Pause a little more often.";
    case "language-not-supported": return "Voice typing doesn't support this language in this browser. Type instead.";
    default: return "";
  }
}
