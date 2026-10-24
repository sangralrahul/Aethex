/**
 * Update 26 on the device: a backup and restore of everything Cadus keeps in this browser (with an
 * optional passphrase, AES-GCM), and clinical helpers: NCD (blood pressure and diabetes) step
 * protocols, anaemia and iron, dengue fluids, electrolyte replacement, obstetric emergencies,
 * infection control and biomedical waste, and how long an oxygen cylinder lasts. No AI here.
 */

/* ------------------------------------------------------------------ backup and restore */

const PREFIX = "cadus3.";
/** Not backed up: the daily usage counter (it belongs to this device's plan limits). */
const SKIP = new Set(["cadus3.usage", "cadus3.lastBackup", "cadus3.authKey"]);
export const LAST_BACKUP_KEY = "cadus3.lastBackup";
export interface BackupFile { format: "cadus-backup"; v: 1; createdAt: string; keys: number; encrypted: boolean; data?: Record<string, string>; salt?: string; iv?: string; cipher?: string }

const ls = (): Storage | null => { try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; } };
export function cadusKeys(): string[] {
  const s = ls(); if (!s) return [];
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k && k.startsWith(PREFIX) && !SKIP.has(k)) out.push(k); }
  return out.sort();
}
/** About how much of the browser's storage Cadus is using (strings are stored as UTF-16). */
export function storageUse(): { bytes: number; keys: number; pct: number; biggest: { key: string; bytes: number }[] } {
  const s = ls(); if (!s) return { bytes: 0, keys: 0, pct: 0, biggest: [] };
  const rows = cadusKeys().map((k) => ({ key: k, bytes: ((s.getItem(k) ?? "").length + k.length) * 2 }));
  const bytes = rows.reduce((a, r) => a + r.bytes, 0);
  return { bytes, keys: rows.length, pct: Math.min(100, Math.round((bytes / (5 * 1024 * 1024)) * 100)), biggest: rows.sort((a, b) => b.bytes - a.bytes).slice(0, 6) };
}
export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

/** What each stored key holds, in words, for the restore preview. */
export const KEY_LABELS: Record<string, string> = {
  "cadus3.sessions": "Chats", "cadus3.projects": "Projects", "cadus3.library": "Saved answers", "cadus3.docs": "Documents", "cadus3.prefs": "Settings",
  "cadus3.patients": "Patient records", "cadus3.opd": "OPD queue", "cadus3.opdhistory": "OPD history", "cadus3.opd.history": "OPD history", "cadus3.rx": "Prescriptions", "cadus3.flashcards": "Flashcards", "cadus3.learn": "Learning progress", "cadus3.logbook": "PG logbook", "cadus3.letterhead": "Letterhead", "cadus3.crew": "Crew assistants", "cadus3.followups": "Follow-ups", "cadus3.revnotes": "Revision notes", "cadus3.roster": "Duty roster", "cadus3.audit": "Answer history", "cadus3.vaxkids": "Vaccination records", "cadus3.anc": "Antenatal records",
  "cadus3.bills": "Receipts", "cadus3.expenses": "Expenses", "cadus3.stock": "Pharmacy stock", "cadus3.appts": "Appointments", "cadus3.contacts": "Referral contacts",
  "cadus3.cme": "CME credits", "cadus3.drafts23": "Saved drafts (ICD, consent, MLC, diet, teleconsultation)", "cadus3.ward": "Ward list", "cadus3.cases": "Patient cases", "cadus3.profile": "Profile",
};
export const keyLabel = (k: string) => KEY_LABELS[k] ?? k.slice(PREFIX.length).replace(/[._-]+/g, " ");

const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function deriveKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
  // (cast: TypeScript's DOM types want an ArrayBuffer-backed view)
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: 210000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function makeBackup(passphrase = "", now = new Date()): Promise<BackupFile> {
  const s = ls();
  const data: Record<string, string> = {};
  for (const k of cadusKeys()) { const v = s?.getItem(k); if (v !== null && v !== undefined) data[k] = v; }
  const head = { format: "cadus-backup" as const, v: 1 as const, createdAt: now.toISOString(), keys: Object.keys(data).length };
  if (!passphrase) return { ...head, encrypted: false, data };
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(data))));
  return { ...head, encrypted: true, salt: b64(salt), iv: b64(iv), cipher: b64(cipher) };
}

export class BackupError extends Error {}
/** Reads a backup file: checks the format, decrypts it with the passphrase, and keeps only Cadus keys. */
export async function openBackup(text: string, passphrase = ""): Promise<{ createdAt: string; data: Record<string, string> }> {
  let f: BackupFile;
  try { f = JSON.parse(text); } catch { throw new BackupError("This isn't a Cadus backup file."); }
  if (!f || f.format !== "cadus-backup" || f.v !== 1) throw new BackupError("This isn't a Cadus backup file.");
  let data: Record<string, string> | undefined = f.data;
  if (f.encrypted) {
    if (!passphrase) throw new BackupError("This backup is protected: enter its passphrase.");
    try {
      const key = await deriveKey(passphrase, unb64(f.salt ?? ""));
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(f.iv ?? "") }, key, unb64(f.cipher ?? ""));
      data = JSON.parse(new TextDecoder().decode(plain));
    } catch { throw new BackupError("The passphrase is wrong, or the file is damaged."); }
  }
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(data ?? {})) if (k.startsWith(PREFIX) && !SKIP.has(k) && typeof v === "string") clean[k] = v;
  if (!Object.keys(clean).length) throw new BackupError("The backup is empty.");
  return { createdAt: f.createdAt, data: clean };
}

/** Puts a backup on this device. "replace" first removes Cadus data that isn't in the backup. */
export function restoreBackup(data: Record<string, string>, mode: "replace" | "merge"): number {
  const s = ls(); if (!s) return 0;
  if (mode === "replace") for (const k of cadusKeys()) if (!(k in data) && k !== "cadus3.prefs") s.removeItem(k);
  let n = 0;
  for (const [k, v] of Object.entries(data)) { try { s.setItem(k, v); n++; } catch { /* storage full */ } }
  return n;
}
/** Removes everything Cadus keeps in this browser (for handing over a shared computer). */
export function wipeCadus(): number { const s = ls(); if (!s) return 0; const keys = cadusKeys(); for (const k of [...keys, LAST_BACKUP_KEY]) s.removeItem(k); return keys.length; }
export const markBackedUp = (at = Date.now()) => { try { ls()?.setItem(LAST_BACKUP_KEY, String(at)); } catch { /* blocked */ } };
export const lastBackupAt = () => { const n = Number(ls()?.getItem(LAST_BACKUP_KEY) ?? 0); return Number.isFinite(n) && n > 0 ? n : 0; };
const CLINICAL = ["cadus3.patients", "cadus3.bills", "cadus3.anc", "cadus3.vaxkids", "cadus3.stock", "cadus3.appts", "cadus3.expenses", "cadus3.cases", "cadus3.ward"];
/** A backup is due when records worth keeping exist and the last backup is older than 14 days. */
export function backupDue(now = Date.now()): boolean {
  const s = ls(); if (!s) return false;
  const has = CLINICAL.some((k) => { const v = s.getItem(k); return !!v && v.length > 30; });
  return has && now - lastBackupAt() > 14 * 86400000;
}

/* ------------------------------------------------------------------ NCD protocols: BP and diabetes */

export const BP_STEPS = [
  { step: 1, drug: "Amlodipine 5 mg once daily" },
  { step: 2, drug: "Amlodipine 10 mg once daily (or amlodipine 5 mg + telmisartan 40 mg)" },
  { step: 3, drug: "Amlodipine 10 mg + telmisartan 40 mg once daily" },
  { step: 4, drug: "Amlodipine 10 mg + telmisartan 80 mg once daily" },
  { step: 5, drug: "Add chlorthalidone 12.5 mg once daily (or hydrochlorothiazide 25 mg)" },
];
export interface BpAdvice { grade: string; target: string; step: number; action: string; notes: string[] }
/** Step-up by the visit's BP, in the style of the India Hypertension Control Initiative protocol. */
export function bpAdvice(sys: number, dia: number, o: { step?: number; age?: number; diabetes?: boolean; ckd?: boolean; pregnant?: boolean } = {}): BpAdvice | null {
  if (!(sys > 60 && sys < 300 && dia > 30 && dia < 200)) return null;
  const grade = sys >= 180 || dia >= 110 ? "Grade 3 (severe)" : sys >= 160 || dia >= 100 ? "Grade 2" : sys >= 140 || dia >= 90 ? "Grade 1" : sys >= 130 || dia >= 85 ? "High-normal" : "Normal";
  const target = (o.age ?? 0) >= 80 ? "Under 150/90 (aged 80 or over), lower if tolerated" : "Under 140/90; under 130/80 if tolerated, especially with diabetes or CKD";
  const above = (o.age ?? 0) >= 80 ? sys >= 150 || dia >= 90 : sys >= 140 || dia >= 90;
  const step = o.step ?? 0;
  const notes = ["Check adherence and the technique of measurement before stepping up.", "Lifestyle: salt under 5 g a day, regular activity, weight, alcohol and tobacco."];
  if (o.pregnant) return { grade, target: "Under 140/90 in pregnancy", step, action: "Pregnancy: don't use telmisartan or other ACE inhibitors/ARBs; use labetalol, nifedipine or methyldopa (see Obstetric Emergencies for severe BP).", notes };
  if (o.diabetes || o.ckd) notes.push("With diabetes or CKD with albuminuria, an ACE inhibitor or ARB should be part of the treatment; check creatinine and potassium in 1–2 weeks.");
  if (sys >= 180 || dia >= 110) notes.unshift("Severe: look for chest pain, breathlessness, neurological signs, headache or vision change (hypertensive emergency: refer now).");
  if (!above) return { grade, target, step, action: step ? `At target: continue step ${step}. Review every 1–3 months.` : grade === "Normal" ? "No medicine needed; recheck yearly." : "Lifestyle advice; recheck in 3–6 months.", notes };
  if (!step) return { grade, target, step: 1, action: `Start step 1: ${BP_STEPS[0].drug}${grade === "Grade 2" || grade === "Grade 3 (severe)" ? " (with BP 160/100 or more, starting at step 3 is reasonable)" : ""}. Review in 4 weeks.`, notes };
  if (step >= 5) return { grade, target, step, action: "Not at target on step 5: refer to a physician (resistant hypertension: check for secondary causes, add spironolactone if potassium allows).", notes };
  return { grade, target, step: step + 1, action: `Not at target: move to step ${step + 1}: ${BP_STEPS[step].drug}. Review in 4 weeks.`, notes };
}

export interface DmAdvice { control: string; action: string[]; targets: string[] }
/** Type 2 diabetes in primary care (RSSDI and ADA): what to add, by HbA1c and comorbidities. */
export function dmAdvice(hba1c: number, o: { onMetformin?: boolean; ascvd?: boolean; hf?: boolean; ckd?: boolean; obese?: boolean; symptomatic?: boolean; egfr?: number } = {}): DmAdvice | null {
  if (!(hba1c >= 4 && hba1c <= 20)) return null;
  const control = hba1c < 7 ? "At target" : hba1c < 8 ? "Above target" : hba1c < 10 ? "Poorly controlled" : "Very poorly controlled";
  const action: string[] = [];
  if (hba1c >= 10 || o.symptomatic) action.push("HbA1c 10% or more, or weight loss, thirst and ketones: start insulin (basal 0.1–0.2 U/kg) with metformin; see the Insulin Planner.");
  if (!o.onMetformin) action.push(o.egfr !== undefined && o.egfr < 30 ? "Metformin is contraindicated (eGFR under 30): use a DPP-4 inhibitor (linagliptin) or insulin." : "Start metformin 500 mg once or twice daily with food, increasing over 2–4 weeks to 1 g twice daily (check the dose for kidney function).");
  if (hba1c >= 7 && o.onMetformin) {
    if (o.hf || o.ckd) action.push("Add an SGLT2 inhibitor (dapagliflozin or empagliflozin 10 mg) for heart and kidney protection, whatever the HbA1c.");
    else if (o.ascvd) action.push("Add an SGLT2 inhibitor or a GLP-1 receptor agonist with proven cardiovascular benefit.");
    else if (o.obese) action.push("Add a GLP-1 receptor agonist or an SGLT2 inhibitor to help with weight.");
    else action.push("Add a second drug: a sulfonylurea (glimepiride 1 mg, low cost; watch for hypoglycaemia), a DPP-4 inhibitor (sitagliptin, vildagliptin, teneligliptin) or an SGLT2 inhibitor.");
  } else if (o.onMetformin && (o.hf || o.ckd || o.ascvd)) action.push("At target, but with heart or kidney disease an SGLT2 inhibitor is still recommended for protection.");
  if (!action.length) action.push("At target: continue; recheck HbA1c every 3–6 months.");
  const targets = ["HbA1c under 7% for most (under 8% if older, frail or prone to hypoglycaemia)", "BP under 130/80; LDL under 100 mg/dL (under 70 with heart disease): a statin for most adults over 40 with diabetes", "Every year: eyes (fundus), feet, urine albumin-creatinine ratio, eGFR, lipids"];
  return { control, action, targets };
}

/* ------------------------------------------------------------------ anaemia and iron */

export type AnaemiaGroup = "man" | "woman" | "pregnant" | "child6-59m" | "child5-11y" | "child12-14y";
const HB_CUT: Record<AnaemiaGroup, [number, number, number]> = { man: [13, 11, 8], woman: [12, 11, 8], pregnant: [11, 10, 7], "child6-59m": [11, 10, 7], "child5-11y": [11.5, 11, 8], "child12-14y": [12, 11, 8] };
/** WHO (2011) grades: normal at or above the first cut-off, mild down to the second, moderate down to the third, severe below it. */
export function anaemiaGrade(hb: number, g: AnaemiaGroup): "none" | "mild" | "moderate" | "severe" {
  const [n, mild, mod] = HB_CUT[g];
  return hb >= n ? "none" : hb >= mild ? "mild" : hb >= mod ? "moderate" : "severe";
}
/** Ganzoni: deficit (mg) = weight × (target Hb − Hb) × 2.4 + stores (500 mg from 35 kg, else 15 mg/kg). */
export function ganzoni(weightKg: number, hb: number, targetHb: number): number | null {
  if (!(weightKg > 2 && hb > 0 && targetHb > hb)) return null;
  const stores = weightKg >= 35 ? 500 : 15 * weightKg;
  return Math.round((weightKg * (targetHb - hb) * 2.4 + stores) / 50) * 50;
}
export function ivIronPlan(totalMg: number, weightKg: number) {
  const fcmMax = Math.min(1000, Math.round(20 * weightKg));
  const fcmDoses = Math.max(1, Math.ceil(totalMg / fcmMax));
  const isDoses = Math.max(1, Math.ceil(totalMg / 200));
  return { fcm: `Ferric carboxymaltose: ${fcmDoses} dose${fcmDoses > 1 ? "s" : ""} of up to ${fcmMax} mg (20 mg/kg, maximum 1000 mg) a week apart, over at least 15 minutes`, sucrose: `Iron sucrose: ${isDoses} doses of 200 mg (up to 3 a week), each over 15–30 minutes` };
}

/* ------------------------------------------------------------------ dengue */

export const DENGUE_WARNING = ["Abdominal pain or tenderness", "Persistent vomiting", "Fluid accumulation (ascites, pleural effusion)", "Mucosal bleeding", "Lethargy or restlessness", "Liver enlarged more than 2 cm", "Rising haematocrit with a rapid fall in platelets"];
export const DENGUE_SEVERE = ["Shock: cold extremities, weak fast pulse, capillary refill over 2 s, narrow pulse pressure (20 mmHg or less) or low BP", "Respiratory distress from fluid accumulation", "Severe bleeding", "Severe organ involvement: ALT or AST 1000 or more, altered sensorium, heart or kidney failure"];
export interface DenguePlan { group: "A" | "B" | "C"; label: string; steps: string[]; fluids: { phase: string; rate: string; ml?: string }[] }
/** WHO (2009) and national (NCVBDC) dengue guidelines: grouping and crystalloid rates by weight (use ideal body weight if obese). */
export function denguePlan(weightKg: number, warning: number, severe: number, opts: { hypotensive?: boolean; risk?: boolean; oralOk?: boolean } = {}): DenguePlan | null {
  if (!(weightKg > 2)) return null;
  const ml = (lo: number, hi: number) => `${Math.round(weightKg * lo)}–${Math.round(weightKg * hi)} ml/hour`;
  if (severe > 0) {
    if (opts.hypotensive) return { group: "C", label: "Severe dengue: hypotensive shock", steps: ["Resuscitate now in a high-dependency area; haematocrit before and after each bolus.", "If haematocrit falls with continuing shock, suspect bleeding: transfuse blood.", "Avoid IM injections, NSAIDs and aspirin; watch for fluid overload once the leak stops (48–72 hours)."], fluids: [{ phase: "Bolus", rate: "20 ml/kg over 15 minutes (crystalloid or colloid)", ml: `${Math.round(weightKg * 20)} ml` }, { phase: "If better", rate: "Crystalloid 10 ml/kg/hour for 1 hour, then reduce as below", ml: `${Math.round(weightKg * 10)} ml/hour` }, { phase: "Then", rate: "5–7, 3–5, then 2–3 ml/kg/hour as the patient improves", ml: ml(2, 7) }] };
    return { group: "C", label: "Severe dengue: compensated shock", steps: ["Admit to a high-dependency area; haematocrit every 1–2 hours at first.", "If still in shock after the first hour: repeat haematocrit; if it is rising, give a second bolus of 10–20 ml/kg; if falling, look for bleeding.", "Stop IV fluids at 24–48 hours once stable; watch for fluid overload."], fluids: [{ phase: "Hour 1", rate: "5–10 ml/kg/hour", ml: ml(5, 10) }, { phase: "Next 1–2 h", rate: "5–7 ml/kg/hour", ml: ml(5, 7) }, { phase: "Next 2–4 h", rate: "3–5 ml/kg/hour", ml: ml(3, 5) }, { phase: "Then", rate: "2–3 ml/kg/hour, reducing over 24–48 hours", ml: ml(2, 3) }] };
  }
  if (warning > 0 || opts.risk || opts.oralOk === false) return { group: "B", label: warning > 0 ? "Dengue with warning signs: admit" : "Dengue without warning signs, but admit (risk factors or can't drink)", steps: ["Haematocrit before fluids, then every 4–6 hours; platelets daily.", "Paracetamol only for fever; no NSAIDs, aspirin or IM injections.", "Platelet transfusion only for significant bleeding (not for a low count alone)."], fluids: warning > 0 ? [{ phase: "Hours 1–2", rate: "5–7 ml/kg/hour", ml: ml(5, 7) }, { phase: "Next 2–4 h", rate: "3–5 ml/kg/hour", ml: ml(3, 5) }, { phase: "Then", rate: "2–3 ml/kg/hour, for 24–48 hours as needed", ml: ml(2, 3) }] : [{ phase: "Oral or IV", rate: "Maintenance fluids; encourage oral fluids", ml: ml(1.5, 2) }] };
  return { group: "A", label: "Dengue without warning signs: home care", steps: ["Rest, plenty of oral fluids (ORS, juices, soups: about 2.5 L a day for adults), paracetamol (maximum 3 g a day in adults).", "No NSAIDs or aspirin; mosquito net.", "Daily review with platelets and haematocrit from day 3 until 48 hours after the fever settles (the critical phase).", "Come back at once with any warning sign, no urine for 6 hours, or feeling worse as the fever falls."], fluids: [] };
}

/* ------------------------------------------------------------------ electrolytes */

export interface ElectroPlan { severity: string; steps: string[] }
export function potassiumPlan(k: number, o: { ecg?: boolean; oral?: boolean } = {}): ElectroPlan | null {
  if (!(k > 1 && k < 9)) return null;
  if (k >= 5.5) return { severity: k >= 6.5 || o.ecg ? "Severe hyperkalaemia" : "Hyperkalaemia", steps: ["Use the Hyperkalaemia emergency protocol: calcium gluconate 10% 10 ml IV over 10 minutes if ECG changes, insulin 10 units with 25 g glucose, salbutamol nebulisation, then remove potassium (binders, dialysis).", "Stop potassium supplements, ACE inhibitors/ARBs, spironolactone and NSAIDs; repeat the level (rule out a haemolysed sample)."] };
  if (k >= 3.5) return { severity: "Normal", steps: ["No replacement needed."] };
  const steps = ["Check magnesium and correct it too (potassium won't stay up while magnesium is low).", "Every 10 mmol of KCl raises serum potassium by about 0.1 mmol/L; recheck after each 40–60 mmol."];
  if (k >= 3) return { severity: "Mild hypokalaemia", steps: [o.oral === false ? "IV KCl 10 mmol/hour in a peripheral line (no more than 40 mmol/L concentration)." : "Oral KCl 40–80 mmol a day in divided doses (syrup or tablets), with food.", ...steps] };
  if (k >= 2.5 && !o.ecg) return { severity: "Moderate hypokalaemia", steps: ["IV KCl 10 mmol/hour in a peripheral line (up to 40 mmol in 1 L saline), plus oral KCl if able to swallow.", ...steps] };
  return { severity: "Severe hypokalaemia", steps: ["Cardiac monitor. IV KCl up to 20 mmol/hour, only through a central line with monitoring (10 mmol/hour peripherally).", "Never give KCl as an IV push.", ...steps] };
}
export function sodiumPlan(na: number, o: { severeSymptoms?: boolean; highRisk?: boolean; weightKg?: number } = {}): ElectroPlan | null {
  if (!(na > 90 && na < 200)) return null;
  const limit = o.highRisk ? 8 : 10;
  if (na >= 135 && na <= 145) return { severity: "Normal", steps: ["No correction needed."] };
  if (na > 145) return { severity: na >= 160 ? "Severe hypernatraemia" : "Hypernatraemia", steps: [`Replace water slowly: free-water deficit ≈ ${o.weightKg ? Math.round(0.5 * o.weightKg * (na / 140 - 1) * 10) / 10 : "0.5 × weight × (Na ÷ 140 − 1)"} L (0.5 for women and older people, 0.6 for men).`, "Lower sodium by no more than 10–12 mmol/L in 24 hours if it developed over more than 48 hours; oral water or 5% dextrose."] };
  if (o.severeSymptoms) return { severity: "Hyponatraemia with severe symptoms", steps: ["3% saline 150 ml IV over 20 minutes; check sodium; repeat up to twice until sodium rises by 5 mmol/L or symptoms improve (seizures, coma, vomiting, confusion).", `Then stop hypertonic saline and limit the rise to ${limit} mmol/L in the first 24 hours and 8 mmol/L in each 24 hours after (osmotic demyelination risk${o.highRisk ? ": alcohol, malnutrition, hypokalaemia, liver disease or sodium under 105" : ""}).`, "Find the cause: volume status, urine osmolality and sodium, glucose, thyroid, cortisol, drugs (thiazides, SSRIs, carbamazepine)."] };
  return { severity: na < 125 ? "Severe hyponatraemia (without severe symptoms)" : na < 130 ? "Moderate hyponatraemia" : "Mild hyponatraemia", steps: ["Treat the cause by volume status: hypovolaemic, 0.9% saline; euvolaemic (SIADH), fluid restriction; hypervolaemic, fluid restriction and diuretics.", `Limit the rise to ${limit} mmol/L in 24 hours; check sodium every 4–6 hours while correcting.`, "Stop thiazides and other causative drugs."] };
}
export const MG_CA_STEPS = {
  magnesium: ["Magnesium under 1.2 mg/dL (0.5 mmol/L) or with symptoms or arrhythmia: magnesium sulphate 2 g IV over 1–2 hours (over 2–15 minutes in torsades); repeat by level.", "Mild and no symptoms: oral magnesium.", "Reduce the dose in kidney failure."],
  calcium: ["Correct for albumin: corrected calcium = calcium + 0.8 × (4 − albumin g/dL).", "With tetany, seizures or a long QT: calcium gluconate 10% 10–20 ml IV over 10 minutes, then an infusion; cardiac monitor.", "Check magnesium, phosphate, vitamin D and PTH; oral calcium and vitamin D for chronic low calcium."],
};

/* ------------------------------------------------------------------ obstetric emergencies */

export const OBS_EMERGENCIES: { id: string; title: string; steps: string[] }[] = [
  { id: "eclampsia", title: "Eclampsia and severe pre-eclampsia: magnesium sulphate", steps: ["Call for help; airway, left lateral position, oxygen; protect from injury.", "Pritchard regimen: loading 4 g of 20% magnesium sulphate IV over 5–10 minutes, plus 10 g of 50% IM (5 g in each buttock).", "Maintenance: 5 g of 50% IM every 4 hours in alternate buttocks, for 24 hours after delivery or the last fit (or the IV Zuspan regimen: 4 g IV loading, then 1 g/hour).", "Before each dose: knee jerks present, breathing 16 or more a minute, urine 30 ml/hour (100 ml in 4 hours) or more.", "Toxicity (no knee jerks, slow breathing): stop magnesium; calcium gluconate 10% 10 ml IV over 10 minutes.", "Control BP, then plan delivery once stable."] },
  { id: "severebp", title: "Severe hypertension in pregnancy (160/110 or more)", steps: ["Treat within 30–60 minutes; aim for 140–150/90–100, not lower.", "Labetalol 20 mg IV over 2 minutes, then 40 mg, 80 mg, 80 mg every 10 minutes (maximum 220 mg) if still high; avoid in asthma.", "Or oral nifedipine 10 mg (not sublingual), repeated every 20–30 minutes up to 30 mg.", "Magnesium sulphate for severe features; fetal monitoring."] },
  { id: "pph", title: "Postpartum haemorrhage", steps: ["Call for help; two large-bore IV lines; bloods for group and cross-match; warm crystalloid; catheterise and measure urine.", "Massage the uterus; oxytocin 10 units IM or IV slowly, then 20–40 units in 1 L at 60 drops/minute.", "Tranexamic acid 1 g IV over 10 minutes within 3 hours of birth; repeat once after 30 minutes if bleeding continues.", "Methylergometrine 0.2 mg IM (not with hypertension or heart disease); carboprost 250 microgram IM every 15 minutes (maximum 8 doses), not in asthma; misoprostol 800 microgram sublingual.", "Look for the 4 Ts: tone, trauma (tears), tissue (retained placenta), thrombin (clotting).", "Still bleeding: bimanual compression, uterine balloon tamponade, and theatre (compression sutures, ligation, hysterectomy); transfuse."] },
  { id: "cord", title: "Cord prolapse", steps: ["Call for help; don't handle the cord; keep it in the vagina.", "Knee-chest or exaggerated Sims position; or fill the bladder with 500 ml saline to lift the presenting part.", "Push the presenting part up with fingers if needed; tocolysis (terbutaline 0.25 mg SC) while preparing.", "Deliver by the quickest safe route, usually emergency caesarean."] },
  { id: "dystocia", title: "Shoulder dystocia", steps: ["Call for help; stop pushing; note the time.", "McRoberts position (thighs to abdomen) with suprapubic pressure.", "Consider an episiotomy for access; deliver the posterior arm, or internal rotation (Rubin II, Woods screw).", "All-fours position; record the times and manoeuvres used; examine the baby for injury."] },
];

/* ------------------------------------------------------------------ infection control and biomedical waste */

export const PRECAUTIONS: { disease: string; type: string; note: string }[] = [
  { disease: "Pulmonary or laryngeal TB", type: "Airborne", note: "Single room, N95 for staff, mask on the patient when moving; until 2 weeks of effective treatment and improving." },
  { disease: "Measles", type: "Airborne", note: "Until 4 days after the rash starts; immune staff only." },
  { disease: "Chickenpox, disseminated zoster", type: "Airborne + contact", note: "Until all lesions are crusted; immune staff only." },
  { disease: "COVID-19", type: "Droplet + contact (airborne for aerosol procedures)", note: "N95 for aerosol-generating procedures." },
  { disease: "Influenza", type: "Droplet", note: "Surgical mask within 1–2 metres; 7 days or until 24 hours without fever." },
  { disease: "Meningococcal disease", type: "Droplet", note: "Until 24 hours of effective antibiotics; prophylaxis for close contacts." },
  { disease: "Pertussis, diphtheria (pharyngeal), mumps, rubella", type: "Droplet", note: "Pertussis until 5 days of treatment; mumps 5 days after swelling; rubella 7 days after rash." },
  { disease: "MRSA, VRE, carbapenem-resistant organisms", type: "Contact", note: "Gloves and gown; dedicated equipment; single room or cohort." },
  { disease: "Clostridioides difficile, acute infectious diarrhoea", type: "Contact", note: "Wash hands with soap and water (alcohol rub doesn't kill spores); clean with chlorine." },
  { disease: "Scabies, lice", type: "Contact", note: "Until 24 hours after treatment." },
  { disease: "HIV, hepatitis B and C", type: "Standard", note: "Standard precautions only; safe sharps handling." },
  { disease: "Every patient", type: "Standard", note: "Hand hygiene (5 moments), gloves for body fluids, safe injection practice, respiratory etiquette." },
];
export const BMW_BINS: { colour: string; what: string[]; treatment: string }[] = [
  { colour: "Yellow", what: ["Human anatomical waste, placenta", "Items soiled with blood or body fluids: dressings, cotton swabs, plaster casts", "Expired or discarded medicines, cytotoxic drugs", "Chemical waste, discarded linen, lab cultures (pre-treated)"], treatment: "Incineration or deep burial (as allowed)" },
  { colour: "Red", what: ["Contaminated recyclable plastics: tubing, catheters, IV sets, urine bags", "Syringes without needles, gloves, vacutainers"], treatment: "Autoclave or microwave, then shredding and recycling" },
  { colour: "White (translucent, puncture-proof)", what: ["Sharps: needles, syringes with fixed needles, scalpel blades, lancets", "Any metal sharp that can cut or puncture"], treatment: "Autoclave or dry heat, then shredding or encapsulation" },
  { colour: "Blue (cardboard box with blue marking)", what: ["Glassware: broken or discarded glass, vials, ampoules", "Metallic body implants"], treatment: "Disinfection or autoclave, then recycling" },
];
export const findBin = (q: string) => {
  const t = q.trim().toLowerCase().replace(/s$/, "");
  // "Syringes without needles" is not where a needle goes.
  return t ? BMW_BINS.filter((b) => b.what.some((w) => { const x = w.toLowerCase(); return x.includes(t) && !x.includes(`without ${t}`); })) : BMW_BINS;
};

/* ------------------------------------------------------------------ oxygen cylinder */

/** Litres of gas ≈ water capacity (L) × pressure (bar); minutes = (litres − reserve) ÷ flow. */
export function cylinderMinutes(waterLitres: number, pressureBar: number, flowLpm: number, reserveBar = 0): number | null {
  if (!(waterLitres > 0 && pressureBar > 0 && flowLpm > 0) || pressureBar <= reserveBar) return null;
  return Math.floor((waterLitres * (pressureBar - reserveBar)) / flowLpm);
}
export const psiToBar = (psi: number) => psi / 14.504;
