/**
 * Cadus update 15 in the browser: types, presets and what is kept on this device for the
 * ECG Reader, Antibiotic Guide, Procedure Guide and Poisoning & Snakebite.
 */

const readKey = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; } };
const saveKey = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* full or blocked */ } };

/* ------------------------------------------------------------------ ECG */

export interface EcgFinding { lead: string; finding: string; significance: "normal" | "abnormal" | "critical" }
export interface EcgResult {
  urgent: boolean; urgentLabel: string; rate: string; rhythm: string; axis: string;
  intervals: { pr: string; qrs: string; qt: string; qtc: string };
  findings: EcgFinding[]; impression: string; differentials: string[]; actions: string[];
  confidence: "high" | "moderate" | "low"; limits: string;
}
/** The image itself is not kept (it may show a name); only a small thumbnail. */
export interface EcgRecord { id: string; at: number; age: string; sex: string; context: string; thumb: string; result: EcgResult }
export const ECG_KEY = "cadus3.ecg";
export const readEcgs = () => readKey<EcgRecord[]>(ECG_KEY, []).filter((x) => x && x.result && Array.isArray(x.result.findings));
export const saveEcgs = (l: EcgRecord[]) => saveKey(ECG_KEY, l.slice(0, 25));
export function ecgMarkdown(r: EcgRecord): string {
  const x = r.result;
  return [
    "# ECG report",
    [r.age && `${r.age} years`, r.sex, r.context].filter(Boolean).join(" · "),
    x.urgent ? `**URGENT: ${x.urgentLabel}**` : "",
    `**Impression:** ${x.impression}`,
    `| Rate | Rhythm | Axis | PR | QRS | QT | QTc |\n|---|---|---|---|---|---|---|\n| ${x.rate || "-"} | ${x.rhythm || "-"} | ${x.axis || "-"} | ${x.intervals.pr || "-"} | ${x.intervals.qrs || "-"} | ${x.intervals.qt || "-"} | ${x.intervals.qtc || "-"} |`,
    `## Findings\n${x.findings.map((f) => `- ${f.lead ? `**${f.lead}:** ` : ""}${f.finding}${f.significance === "critical" ? " (critical)" : ""}`).join("\n")}`,
    x.differentials.length ? `## Also consider\n${x.differentials.map((d) => `- ${d}`).join("\n")}` : "",
    x.actions.length ? `## Next steps\n${x.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}` : "",
    x.limits ? `*Limits of this read: ${x.limits}*` : "",
    "*Machine-assisted read: confirm against the original tracing.*",
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Antibiotic Guide */

export interface AbxDrug { name: string; dose: string; route: string; frequency: string; note: string }
export interface AbxRegimen { label: string; drugs: AbxDrug[]; duration: string; why: string }
export interface AbxResult { summary: string; regimens: AbxRegimen[]; beforeStarting: string[]; review: string[]; cautions: string[]; redFlags: string[]; source: string }
export interface AbxRecord { id: string; at: number; infection: string; setting: string; severity: string; patient: string; result: AbxResult }
export const ABX_KEY = "cadus3.abx";
export const readAbx = () => readKey<AbxRecord[]>(ABX_KEY, []).filter((x) => x && x.result && Array.isArray(x.result.regimens));
export const saveAbx = (l: AbxRecord[]) => saveKey(ABX_KEY, l.slice(0, 30));
export const INFECTIONS: { group: string; items: string[] }[] = [
  { group: "Chest", items: ["Community-acquired pneumonia", "Hospital-acquired pneumonia", "Ventilator-associated pneumonia", "Aspiration pneumonia", "COPD exacerbation", "Lung abscess / empyema"] },
  { group: "Urinary", items: ["Cystitis", "Acute pyelonephritis", "Catheter-associated UTI", "UTI in pregnancy"] },
  { group: "Abdomen", items: ["Intra-abdominal infection (perforation, abscess)", "Cholangitis", "Spontaneous bacterial peritonitis", "Acute infective diarrhoea", "Liver abscess"] },
  { group: "Skin and bone", items: ["Cellulitis", "Necrotising fasciitis", "Diabetic foot infection", "Osteomyelitis", "Septic arthritis"] },
  { group: "Brain and blood", items: ["Bacterial meningitis", "Sepsis, source unknown", "Febrile neutropenia", "Infective endocarditis", "Line-related bloodstream infection"] },
  { group: "Tropical", items: ["Enteric fever", "Scrub typhus", "Leptospirosis", "Melioidosis"] },
  { group: "Women and children", items: ["Puerperal sepsis", "Pelvic inflammatory disease", "Neonatal sepsis"] },
];
export const ABX_RISKS = ["Antibiotics in the last 90 days", "Hospital stay in the last 90 days", "Known ESBL or MDR colonisation", "Nursing home or long-term care", "On dialysis", "Immunosuppressed", "Recent surgery"];
export function abxMarkdown(r: AbxRecord): string {
  const x = r.result;
  return [
    `# Antibiotics: ${r.infection}`,
    [r.setting, r.severity, r.patient].filter(Boolean).join(" · "),
    x.summary,
    ...x.regimens.map((g) => `## ${g.label}${g.duration ? ` (${g.duration})` : ""}\n${g.drugs.map((d) => `- **${d.name}** ${d.dose} ${d.route} ${d.frequency}${d.note ? ` (${d.note})` : ""}`).join("\n")}${g.why ? `\n\n${g.why}` : ""}`),
    x.beforeStarting.length ? `## Before the first dose\n${x.beforeStarting.map((s) => `- ${s}`).join("\n")}` : "",
    x.review.length ? `## Review\n${x.review.map((s) => `- ${s}`).join("\n")}` : "",
    x.cautions.length ? `## Cautions\n${x.cautions.map((s) => `- ${s}`).join("\n")}` : "",
    x.source ? `*Source: ${x.source}*` : "",
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Procedure Guide */

export interface ProcResult {
  indications: string[]; contraindications: string[]; equipment: string[]; preparation: string[];
  steps: { title: string; detail: string }[]; aftercare: string[];
  complications: { name: string; frequency: string; action: string }[]; pearls: string[]; consent: string;
}
export interface ProcRecord { id: string; at: number; procedure: string; language: string; result: ProcResult }
export const PROC_KEY = "cadus3.procedures";
export const readProcs = () => readKey<ProcRecord[]>(PROC_KEY, []).filter((x) => x && x.result && Array.isArray(x.result.steps));
export const saveProcs = (l: ProcRecord[]) => saveKey(PROC_KEY, l.slice(0, 40));
export const PROCEDURES: { group: string; items: string[] }[] = [
  { group: "Ward", items: ["Arterial blood gas (radial)", "Peripheral IV cannula", "Urinary catheter (male)", "Urinary catheter (female)", "Nasogastric tube", "Lumbar puncture"] },
  { group: "Chest and abdomen", items: ["Pleural tap (thoracentesis)", "Intercostal drain (Seldinger)", "Ascitic tap (paracentesis)", "Large-volume paracentesis"] },
  { group: "Lines and airway", items: ["Central venous line (internal jugular, ultrasound)", "Arterial line", "Intraosseous access", "Endotracheal intubation (RSI)"] },
  { group: "Other", items: ["Bone marrow aspiration and biopsy", "Knee joint aspiration", "Suturing a laceration", "Incision and drainage of an abscess", "Blood transfusion (bedside checks)"] },
];
export function procMarkdown(r: ProcRecord): string {
  const x = r.result;
  const sec = (t: string, l: string[]) => (l.length ? `## ${t}\n${l.map((s) => `- ${s}`).join("\n")}` : "");
  return [
    `# ${r.procedure}`,
    sec("Indications", x.indications), sec("Contraindications", x.contraindications), sec("Equipment", x.equipment.map((e) => `☐ ${e}`)), sec("Before you start", x.preparation),
    `## Steps\n${x.steps.map((s, i) => `${i + 1}. **${s.title}.** ${s.detail}`).join("\n")}`,
    sec("Aftercare", x.aftercare),
    x.complications.length ? `## Complications\n| Complication | How often | If it happens |\n|---|---|---|\n${x.complications.map((c) => `| ${c.name} | ${c.frequency} | ${c.action} |`).join("\n")}` : "",
    sec("Tips", x.pearls),
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Poisoning & Snakebite */

export interface PoisonResult {
  severity: "mild" | "moderate" | "severe" | "unclear"; summary: string; immediate: string[];
  antidotes: { name: string; dose: string; how: string; endpoint: string }[]; avoid: string[];
  investigations: string[]; monitoring: string[]; disposition: string; redFlags: string[]; source: string;
}
export interface PoisonRecord { id: string; at: number; agent: string; patient: string; result: PoisonResult }
export const POISON_KEY = "cadus3.poison";
export const readPoisons = () => readKey<PoisonRecord[]>(POISON_KEY, []).filter((x) => x && x.result && Array.isArray(x.result.immediate));
export const savePoisons = (l: PoisonRecord[]) => saveKey(POISON_KEY, l.slice(0, 30));
export const POISONS: { group: string; items: string[] }[] = [
  { group: "Bites and stings", items: ["Snakebite: neurotoxic (krait, cobra)", "Snakebite: haemotoxic (Russell's viper, saw-scaled viper)", "Snakebite: species unknown", "Scorpion sting"] },
  { group: "Pesticides", items: ["Organophosphate", "Carbamate", "Aluminium phosphide (celphos)", "Paraquat", "Zinc phosphide", "Yellow phosphorus (ratol)", "Pyrethroid"] },
  { group: "Medicines", items: ["Paracetamol", "Benzodiazepines", "Tricyclic antidepressants", "Iron", "Digoxin", "Opioids", "Beta-blocker or calcium-channel blocker"] },
  { group: "Plants and others", items: ["Yellow oleander", "Dhatura", "Kerosene", "Methanol", "Corrosive (acid or alkali)", "Carbon monoxide"] },
];
export const SEVERITY_TONE: Record<PoisonResult["severity"], "ok" | "review" | "unsafe"> = { mild: "ok", moderate: "review", severe: "unsafe", unclear: "review" };
export function poisonMarkdown(r: PoisonRecord): string {
  const x = r.result;
  const sec = (t: string, l: string[], ol = false) => (l.length ? `## ${t}\n${l.map((s, i) => `${ol ? `${i + 1}.` : "-"} ${s}`).join("\n")}` : "");
  return [
    `# ${r.agent || "Poisoning"}: ${x.severity}`,
    r.patient, x.summary,
    sec("Do now", x.immediate, true),
    x.antidotes.length ? `## Antidotes\n${x.antidotes.map((a) => `- **${a.name}:** ${a.dose}. ${a.how}${a.endpoint ? ` **Endpoint:** ${a.endpoint}` : ""}`).join("\n")}` : "",
    sec("Avoid", x.avoid), sec("Investigations", x.investigations), sec("Monitoring", x.monitoring),
    x.disposition ? `## Disposition\n${x.disposition}` : "", sec("Red flags", x.redFlags),
    x.source ? `*Source: ${x.source}*` : "",
  ].filter(Boolean).join("\n\n");
}
