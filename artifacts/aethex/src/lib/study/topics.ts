/**
 * Update 90: which Knowledge Hub topic a question belongs to, for the topic mastery map. Questions written by Cadus
 * carry their topic; bank questions are matched to a topic of their subject by the words in the question, its options
 * and explanation (the topic's name and the conditions listed under it). A question that matches nothing is "Other".
 */
import { medicalSubjects, type MedicalSubject } from "@/data/medicalSubjects";

/** The bank's subject names to Knowledge Hub subjects. */
const BANK_TO_SLUG: Record<string, string> = {
  Anatomy: "anatomy", Physiology: "physiology", Biochemistry: "biochemistry", Pathology: "pathology", Pharmacology: "pharmacology",
  Microbiology: "microbiology", Medicine: "medicine", Surgery: "surgery", Gynaecology: "obstetrics-gynecology", Paediatrics: "pediatrics",
  "Community Medicine": "community-medicine", "Forensic Medicine": "forensic-medicine", Ophthalmology: "ophthalmology", ENT: "ent",
  Psychiatry: "psychiatry", Dermatology: "dermatology", Orthopaedics: "orthopedics", Anaesthesia: "anesthesiology", Radiology: "radiology",
};
export const OTHER_TOPIC = "Other";
const STOP = new Set(["system", "systems", "disorders", "disorder", "diseases", "disease", "general", "basic", "basics", "principles", "and", "the", "with", "of", "syndrome", "syndromes", "cancer", "tumors", "tumours", "infections", "infection", "management", "clinical", "medicine", "therapy", "agents", "drugs", "body", "human", "normal", "acute", "chronic"]);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ies|es|s)$/, "");

/** The Knowledge Hub subject for a subject name (bank or hub). */
export function hubSubject(name: string): MedicalSubject | undefined {
  const slug = BANK_TO_SLUG[name];
  return medicalSubjects.find((s) => s.slug === slug || s.name === name || s.slug === name);
}

const cache = new Map<string, { topic: string; keys: string[] }[]>();
function keysOf(sub: MedicalSubject) {
  let k = cache.get(sub.slug);
  if (!k) {
    k = sub.topics.map((t) => ({ topic: t.name, keys: [...new Set([...words(t.name), ...(t.relatedConditions ?? []).flatMap(words)].map(stem))] }));
    cache.set(sub.slug, k);
  }
  return k;
}
/** The best-matching topic of the subject for this text, or "Other". */
export function topicFor(subject: string, text: string): string {
  const sub = hubSubject(subject);
  if (!sub) return OTHER_TOPIC;
  const have = new Set(words(text).map(stem));
  let best = OTHER_TOPIC, score = 0;
  for (const t of keysOf(sub)) {
    const s = t.keys.reduce((n, k) => n + (have.has(k) ? 1 : 0), 0);
    if (s > score) { best = t.topic; score = s; }
  }
  return best;
}
