/**
 * Patient leaflets and consent forms: what to ask the server for, the
 * languages offered, and the leaflets kept on this device for reuse.
 */

export type LeafletKind = "condition" | "procedure" | "medicine" | "consent";

export const LEAFLET_KINDS: { id: LeafletKind; label: string; hint: string; placeholder: string }[] = [
  { id: "condition", label: "A condition", hint: "What it is, what to do at home, when to come back", placeholder: "Type 2 diabetes, newly diagnosed" },
  { id: "procedure", label: "A procedure", hint: "Before, during, after, and the risks in plain words", placeholder: "Upper GI endoscopy" },
  { id: "medicine", label: "A medicine", hint: "How to take it, side effects, what to avoid", placeholder: "Metformin 500 mg twice daily" },
  { id: "consent", label: "Consent form", hint: "Informed consent with risks, alternatives and signatures", placeholder: "Laparoscopic cholecystectomy under general anaesthesia" },
];

export const LANGUAGES = ["English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Urdu", "Assamese"];

export const CONSENT_PRESETS = ["General surgery under general anaesthesia", "Caesarean section", "Blood transfusion", "Spinal anaesthesia", "Upper GI endoscopy", "Colonoscopy", "Central venous line", "Lumbar puncture", "HIV testing", "Clinical photography for records", "Chemotherapy", "Dialysis"];

export interface Leaflet {
  id: string;
  kind: LeafletKind;
  subject: string;
  language: string;
  level: "simple" | "standard";
  text: string;
  createdAt: number;
}

export const LEAFLETS_KEY = "cadus3.leaflets";
export const LEAFLETS_MAX = 100;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function newLeaflet(fields: Omit<Leaflet, "id" | "createdAt">): Leaflet {
  return { id: uid(), createdAt: Date.now(), ...fields };
}

export function readLeaflets(): Leaflet[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LEAFLETS_KEY) || "[]");
    return (Array.isArray(raw) ? raw : []).filter((l: any) => l && typeof l.id === "string" && typeof l.text === "string" && LEAFLET_KINDS.some((k) => k.id === l.kind)).map((l: any): Leaflet => ({ id: String(l.id).slice(0, 40), kind: l.kind as LeafletKind, subject: String(l.subject || "").slice(0, 200), language: String(l.language || "English").slice(0, 40), level: (l.level === "simple" ? "simple" : "standard") as "simple" | "standard", text: String(l.text).slice(0, 40000), createdAt: Number(l.createdAt) || 0 })).slice(0, LEAFLETS_MAX);
  } catch { return []; }
}
export function saveLeaflets(list: Leaflet[]) {
  try { localStorage.setItem(LEAFLETS_KEY, JSON.stringify(list.slice(0, LEAFLETS_MAX))); } catch { /* full or blocked */ }
}

/** The leaflet as plain text for WhatsApp (markdown marks removed). */
export function leafletText(l: Leaflet): string {
  return l.text.replace(/^#+\s*/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[-*]\s+/gm, "• ").replace(/\|/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
