/**
 * The Scribe: a dictated or typed consultation becomes a structured note
 * (SOAP, admission H&P, follow-up, procedure, discharge) with ICD-10 codes.
 * Notes stay on this device. The ICD-10 table here is a compact offline
 * lookup for the codes Indian OPDs and wards use most.
 */

export type NoteKind = "soap" | "hp" | "followup" | "procedure" | "discharge";

export const NOTE_KINDS: { id: NoteKind; label: string; hint: string }[] = [
  { id: "soap", label: "SOAP note", hint: "OPD or clinic consultation" },
  { id: "hp", label: "Admission H&P", hint: "History and physical on admission" },
  { id: "followup", label: "Follow-up", hint: "Review visit for a known problem" },
  { id: "procedure", label: "Procedure note", hint: "What was done, findings, plan" },
  { id: "discharge", label: "Discharge summary", hint: "Course, medicines, advice" },
];

export interface Icd10 { code: string; label: string }

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  /** The transcript as dictated or typed (kept so the note can be regenerated). */
  transcript: string;
  /** The structured note, markdown. */
  note: string;
  codes: Icd10[];
  gaps: string[];
  /** Age and sex, or bed: never a name. */
  patient: string;
  caseId?: string;
  signed?: { by: string; at: number };
  createdAt: number;
  updatedAt: number;
}

export const NOTES_KEY = "cadus3.notes";
export const NOTES_MAX = 300;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function newNote(fields: Partial<Note> = {}): Note {
  const now = Date.now();
  return { id: uid(), kind: "soap", title: "", transcript: "", note: "", codes: [], gaps: [], patient: "", createdAt: now, updatedAt: now, ...fields };
}

export function cleanNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  const kind = NOTE_KINDS.some((k) => k.id === r.kind) ? (r.kind as NoteKind) : "soap";
  const codes = (Array.isArray(r.codes) ? r.codes : []).filter((c): c is Record<string, unknown> => !!c && typeof c === "object").map((c) => ({ code: str(c.code, 8).toUpperCase(), label: str(c.label, 120) })).filter((c) => c.code).slice(0, 8);
  const signed = r.signed && typeof r.signed === "object" && typeof (r.signed as any).by === "string" ? { by: str((r.signed as any).by, 80), at: Number((r.signed as any).at) || 0 } : undefined;
  return {
    id: r.id.slice(0, 40), kind, title: str(r.title, 120), transcript: str(r.transcript, 20000), note: str(r.note, 40000), codes,
    gaps: (Array.isArray(r.gaps) ? r.gaps : []).filter((g): g is string => typeof g === "string").slice(0, 8).map((g) => g.slice(0, 200)),
    patient: str(r.patient, 60), ...(typeof r.caseId === "string" ? { caseId: r.caseId.slice(0, 40) } : {}), ...(signed ? { signed } : {}),
    createdAt: Number.isFinite(r.createdAt) ? Number(r.createdAt) : Date.now(), updatedAt: Number.isFinite(r.updatedAt) ? Number(r.updatedAt) : Date.now(),
  };
}

export function readNotes(): Note[] {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
    return (Array.isArray(raw) ? raw : []).map(cleanNote).filter((n): n is Note => !!n).slice(0, NOTES_MAX);
  } catch { return []; }
}
export function saveNotes(list: Note[]) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(list.slice(0, NOTES_MAX))); } catch { /* full or blocked */ }
}

/** The note as a document: heading, patient line, the note, codes, signature. */
export function noteMarkdown(n: Note): string {
  const kind = NOTE_KINDS.find((k) => k.id === n.kind)?.label ?? "Note";
  const lines = [`# ${n.title || kind}`, ""];
  lines.push(`**${kind}**${n.patient ? ` · ${n.patient}` : ""} · ${new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}`, "");
  lines.push(n.note.trim(), "");
  if (n.codes.length) lines.push("## Diagnoses (ICD-10)", ...n.codes.map((c) => `- **${c.code}** ${c.label}`), "");
  if (n.signed) lines.push(`*Signed by ${n.signed.by} on ${new Date(n.signed.at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}.*`);
  return lines.join("\n").trim();
}

/* ------------------------------------------------------------------ ICD-10 offline lookup */

export const ICD10: Icd10[] = [
  { code: "A09", label: "Infectious gastroenteritis and colitis" }, { code: "A01.0", label: "Typhoid fever" }, { code: "A15.0", label: "Pulmonary tuberculosis, confirmed" }, { code: "A16.2", label: "Pulmonary tuberculosis, not confirmed" }, { code: "A90", label: "Dengue fever" }, { code: "A91", label: "Dengue haemorrhagic fever" }, { code: "B54", label: "Malaria, unspecified" }, { code: "B50.9", label: "Plasmodium falciparum malaria" }, { code: "B51.9", label: "Plasmodium vivax malaria" }, { code: "A75.3", label: "Scrub typhus" }, { code: "A27.9", label: "Leptospirosis" }, { code: "B15.9", label: "Hepatitis A" }, { code: "B16.9", label: "Acute hepatitis B" }, { code: "B17.1", label: "Acute hepatitis C" }, { code: "B18.1", label: "Chronic hepatitis B" }, { code: "B20", label: "HIV disease" }, { code: "B34.9", label: "Viral infection, unspecified" }, { code: "J00", label: "Acute nasopharyngitis (common cold)" }, { code: "J02.9", label: "Acute pharyngitis" }, { code: "J03.9", label: "Acute tonsillitis" }, { code: "J06.9", label: "Acute upper respiratory infection" }, { code: "J11.1", label: "Influenza with respiratory manifestations" }, { code: "J18.9", label: "Pneumonia, unspecified" }, { code: "J20.9", label: "Acute bronchitis" }, { code: "J21.9", label: "Acute bronchiolitis" }, { code: "J44.1", label: "COPD with acute exacerbation" }, { code: "J44.9", label: "COPD, unspecified" }, { code: "J45.9", label: "Asthma, unspecified" }, { code: "J46", label: "Status asthmaticus" }, { code: "J30.4", label: "Allergic rhinitis" }, { code: "J32.9", label: "Chronic sinusitis" }, { code: "J90", label: "Pleural effusion" }, { code: "J93.9", label: "Pneumothorax" }, { code: "J96.0", label: "Acute respiratory failure" },
  { code: "I10", label: "Essential hypertension" }, { code: "I11.9", label: "Hypertensive heart disease" }, { code: "I20.0", label: "Unstable angina" }, { code: "I20.9", label: "Angina pectoris" }, { code: "I21.0", label: "Acute anterior STEMI" }, { code: "I21.1", label: "Acute inferior STEMI" }, { code: "I21.4", label: "Acute NSTEMI" }, { code: "I21.9", label: "Acute myocardial infarction, unspecified" }, { code: "I25.10", label: "Coronary artery disease" }, { code: "I26.9", label: "Pulmonary embolism" }, { code: "I48.91", label: "Atrial fibrillation" }, { code: "I49.9", label: "Cardiac arrhythmia" }, { code: "I50.9", label: "Heart failure" }, { code: "I50.1", label: "Left ventricular failure" }, { code: "I05.0", label: "Rheumatic mitral stenosis" }, { code: "I33.0", label: "Infective endocarditis" }, { code: "I42.0", label: "Dilated cardiomyopathy" }, { code: "I63.9", label: "Cerebral infarction (ischaemic stroke)" }, { code: "I61.9", label: "Intracerebral haemorrhage" }, { code: "I60.9", label: "Subarachnoid haemorrhage" }, { code: "G45.9", label: "Transient ischaemic attack" }, { code: "I80.2", label: "Deep vein thrombosis of lower limb" }, { code: "I83.9", label: "Varicose veins" }, { code: "I95.9", label: "Hypotension" }, { code: "R57.2", label: "Septic shock" }, { code: "R57.0", label: "Cardiogenic shock" },
  { code: "E11.9", label: "Type 2 diabetes without complications" }, { code: "E11.65", label: "Type 2 diabetes with hyperglycaemia" }, { code: "E11.22", label: "Type 2 diabetes with kidney disease" }, { code: "E11.40", label: "Type 2 diabetes with neuropathy" }, { code: "E11.319", label: "Type 2 diabetes with retinopathy" }, { code: "E11.621", label: "Type 2 diabetes with foot ulcer" }, { code: "E10.9", label: "Type 1 diabetes without complications" }, { code: "E10.10", label: "Type 1 diabetes with ketoacidosis" }, { code: "E11.10", label: "Type 2 diabetes with ketoacidosis" }, { code: "E16.2", label: "Hypoglycaemia" }, { code: "E03.9", label: "Hypothyroidism" }, { code: "E05.90", label: "Hyperthyroidism" }, { code: "E06.3", label: "Autoimmune thyroiditis" }, { code: "E04.9", label: "Nontoxic goitre" }, { code: "E66.9", label: "Obesity" }, { code: "E78.5", label: "Hyperlipidaemia" }, { code: "E55.9", label: "Vitamin D deficiency" }, { code: "E53.8", label: "Vitamin B12 deficiency" }, { code: "D50.9", label: "Iron deficiency anaemia" }, { code: "D64.9", label: "Anaemia, unspecified" }, { code: "D56.1", label: "Beta thalassaemia" }, { code: "D57.1", label: "Sickle cell disease" }, { code: "D69.6", label: "Thrombocytopenia" }, { code: "E86.0", label: "Dehydration" }, { code: "E87.1", label: "Hyponatraemia" }, { code: "E87.5", label: "Hyperkalaemia" }, { code: "E87.6", label: "Hypokalaemia" }, { code: "E83.51", label: "Hypocalcaemia" }, { code: "E27.1", label: "Primary adrenocortical insufficiency" }, { code: "E28.2", label: "Polycystic ovarian syndrome" },
  { code: "K21.9", label: "Gastro-oesophageal reflux disease" }, { code: "K29.70", label: "Gastritis" }, { code: "K25.9", label: "Gastric ulcer" }, { code: "K26.9", label: "Duodenal ulcer" }, { code: "K30", label: "Functional dyspepsia" }, { code: "K58.9", label: "Irritable bowel syndrome" }, { code: "K35.80", label: "Acute appendicitis" }, { code: "K80.20", label: "Gallstones without cholecystitis" }, { code: "K81.0", label: "Acute cholecystitis" }, { code: "K85.9", label: "Acute pancreatitis" }, { code: "K70.30", label: "Alcoholic cirrhosis" }, { code: "K74.60", label: "Cirrhosis, unspecified" }, { code: "K76.0", label: "Fatty liver" }, { code: "K92.2", label: "Gastrointestinal haemorrhage" }, { code: "K56.60", label: "Intestinal obstruction" }, { code: "K40.90", label: "Inguinal hernia" }, { code: "K64.9", label: "Haemorrhoids" }, { code: "K60.2", label: "Anal fissure" }, { code: "K59.00", label: "Constipation" }, { code: "A04.9", label: "Bacterial intestinal infection" },
  { code: "N39.0", label: "Urinary tract infection" }, { code: "N10", label: "Acute pyelonephritis" }, { code: "N20.0", label: "Renal calculus" }, { code: "N20.1", label: "Ureteric calculus" }, { code: "N17.9", label: "Acute kidney injury" }, { code: "N18.3", label: "Chronic kidney disease, stage 3" }, { code: "N18.5", label: "Chronic kidney disease, stage 5" }, { code: "N18.6", label: "End-stage renal disease" }, { code: "N04.9", label: "Nephrotic syndrome" }, { code: "N40.0", label: "Benign prostatic hyperplasia" }, { code: "N30.0", label: "Acute cystitis" }, { code: "N76.0", label: "Acute vaginitis" }, { code: "N92.0", label: "Heavy menstrual bleeding" }, { code: "N94.6", label: "Dysmenorrhoea" }, { code: "N80.9", label: "Endometriosis" }, { code: "D25.9", label: "Uterine fibroid" }, { code: "N91.2", label: "Amenorrhoea" },
  { code: "O80", label: "Normal vaginal delivery" }, { code: "O82", label: "Delivery by caesarean section" }, { code: "O14.90", label: "Pre-eclampsia" }, { code: "O15.9", label: "Eclampsia" }, { code: "O24.419", label: "Gestational diabetes" }, { code: "O99.019", label: "Anaemia complicating pregnancy" }, { code: "O21.0", label: "Mild hyperemesis gravidarum" }, { code: "O03.9", label: "Spontaneous abortion" }, { code: "O00.90", label: "Ectopic pregnancy" }, { code: "O36.5990", label: "Fetal growth restriction" }, { code: "O42.90", label: "Premature rupture of membranes" }, { code: "O72.1", label: "Postpartum haemorrhage" }, { code: "Z34.90", label: "Supervision of normal pregnancy" }, { code: "Z32.01", label: "Pregnancy confirmed" },
  { code: "P07.30", label: "Preterm newborn" }, { code: "P59.9", label: "Neonatal jaundice" }, { code: "P36.9", label: "Neonatal sepsis" }, { code: "P22.0", label: "Respiratory distress syndrome of newborn" }, { code: "E44.0", label: "Moderate acute malnutrition" }, { code: "E43", label: "Severe acute malnutrition" }, { code: "R50.9", label: "Fever, unspecified" }, { code: "R56.00", label: "Simple febrile seizure" }, { code: "J05.0", label: "Croup" }, { code: "B05.9", label: "Measles" }, { code: "B01.9", label: "Varicella" }, { code: "B26.9", label: "Mumps" }, { code: "A37.90", label: "Whooping cough" }, { code: "B08.4", label: "Hand, foot and mouth disease" }, { code: "H66.90", label: "Otitis media" }, { code: "L20.9", label: "Atopic dermatitis" }, { code: "B86", label: "Scabies" }, { code: "B35.4", label: "Tinea corporis" }, { code: "B35.6", label: "Tinea cruris" }, { code: "L01.00", label: "Impetigo" }, { code: "L03.90", label: "Cellulitis" }, { code: "L02.91", label: "Abscess" }, { code: "L40.9", label: "Psoriasis" }, { code: "L50.9", label: "Urticaria" }, { code: "L70.0", label: "Acne vulgaris" }, { code: "L30.9", label: "Dermatitis" }, { code: "B02.9", label: "Herpes zoster" },
  { code: "G40.909", label: "Epilepsy, unspecified" }, { code: "G41.9", label: "Status epilepticus" }, { code: "G43.909", label: "Migraine" }, { code: "G44.209", label: "Tension-type headache" }, { code: "G03.9", label: "Meningitis, unspecified" }, { code: "G00.9", label: "Bacterial meningitis" }, { code: "G04.90", label: "Encephalitis" }, { code: "G20", label: "Parkinson disease" }, { code: "G35", label: "Multiple sclerosis" }, { code: "G51.0", label: "Bell palsy" }, { code: "G56.00", label: "Carpal tunnel syndrome" }, { code: "G62.9", label: "Polyneuropathy" }, { code: "F32.9", label: "Depressive episode" }, { code: "F41.1", label: "Generalised anxiety disorder" }, { code: "F41.0", label: "Panic disorder" }, { code: "F20.9", label: "Schizophrenia" }, { code: "F31.9", label: "Bipolar disorder" }, { code: "F10.20", label: "Alcohol dependence" }, { code: "F17.200", label: "Nicotine dependence" }, { code: "F51.01", label: "Insomnia" }, { code: "F03.90", label: "Dementia" },
  { code: "M54.5", label: "Low back pain" }, { code: "M54.2", label: "Cervicalgia" }, { code: "M17.9", label: "Osteoarthritis of knee" }, { code: "M06.9", label: "Rheumatoid arthritis" }, { code: "M10.9", label: "Gout" }, { code: "M81.0", label: "Osteoporosis" }, { code: "M79.1", label: "Myalgia" }, { code: "M25.50", label: "Joint pain" }, { code: "M75.00", label: "Adhesive capsulitis of shoulder" }, { code: "M51.26", label: "Lumbar disc displacement" }, { code: "M86.9", label: "Osteomyelitis" }, { code: "S52.509A", label: "Fracture of distal radius" }, { code: "S72.009A", label: "Fracture of neck of femur" }, { code: "S82.90XA", label: "Fracture of lower leg" }, { code: "S93.409A", label: "Ankle sprain" }, { code: "S06.0X0A", label: "Concussion" }, { code: "S06.9X9A", label: "Traumatic brain injury" }, { code: "T14.90XA", label: "Injury, unspecified" }, { code: "T30.0", label: "Burn, unspecified degree" }, { code: "T63.001A", label: "Snake venom toxic effect" }, { code: "T60.0X1A", label: "Organophosphate poisoning" }, { code: "T39.1X1A", label: "Paracetamol poisoning" }, { code: "T14.1", label: "Open wound" }, { code: "W54.0XXA", label: "Dog bite" }, { code: "Z20.3", label: "Contact with rabies (post-exposure)" }, { code: "T78.2XXA", label: "Anaphylactic shock" },
  { code: "H10.9", label: "Conjunctivitis" }, { code: "H25.9", label: "Age-related cataract" }, { code: "H40.9", label: "Glaucoma" }, { code: "H52.4", label: "Presbyopia" }, { code: "H52.13", label: "Myopia" }, { code: "H00.019", label: "Hordeolum (stye)" }, { code: "H92.09", label: "Otalgia" }, { code: "H61.20", label: "Impacted cerumen" }, { code: "H81.10", label: "Benign paroxysmal positional vertigo" }, { code: "J34.2", label: "Deviated nasal septum" }, { code: "R04.0", label: "Epistaxis" }, { code: "K02.9", label: "Dental caries" }, { code: "K05.10", label: "Chronic gingivitis" },
  { code: "C50.919", label: "Breast cancer" }, { code: "C34.90", label: "Lung cancer" }, { code: "C53.9", label: "Cervical cancer" }, { code: "C06.9", label: "Oral cancer" }, { code: "C16.9", label: "Gastric cancer" }, { code: "C18.9", label: "Colon cancer" }, { code: "C22.0", label: "Hepatocellular carcinoma" }, { code: "C61", label: "Prostate cancer" }, { code: "C91.00", label: "Acute lymphoblastic leukaemia" }, { code: "C92.00", label: "Acute myeloid leukaemia" }, { code: "C81.90", label: "Hodgkin lymphoma" }, { code: "C83.30", label: "Diffuse large B-cell lymphoma" }, { code: "C90.00", label: "Multiple myeloma" },
  { code: "R07.9", label: "Chest pain, unspecified" }, { code: "R10.9", label: "Abdominal pain, unspecified" }, { code: "R10.11", label: "Right upper quadrant pain" }, { code: "R10.31", label: "Right lower quadrant pain" }, { code: "R51.9", label: "Headache" }, { code: "R42", label: "Dizziness and giddiness" }, { code: "R55", label: "Syncope and collapse" }, { code: "R06.02", label: "Shortness of breath" }, { code: "R05.9", label: "Cough" }, { code: "R11.2", label: "Nausea with vomiting" }, { code: "R19.7", label: "Diarrhoea, unspecified" }, { code: "R53.83", label: "Fatigue" }, { code: "R63.4", label: "Abnormal weight loss" }, { code: "R35.0", label: "Frequency of micturition" }, { code: "R31.9", label: "Haematuria" }, { code: "R04.2", label: "Haemoptysis" }, { code: "R21", label: "Rash" }, { code: "R60.9", label: "Oedema" }, { code: "R40.20", label: "Unspecified coma" }, { code: "R41.0", label: "Disorientation" }, { code: "R65.20", label: "Severe sepsis without shock" }, { code: "A41.9", label: "Sepsis, unspecified" }, { code: "R73.03", label: "Prediabetes" }, { code: "R03.0", label: "Elevated BP without hypertension" },
  { code: "Z00.00", label: "General adult medical examination" }, { code: "Z00.129", label: "Routine child health check" }, { code: "Z23", label: "Immunisation" }, { code: "Z71.3", label: "Dietary counselling" }, { code: "Z72.0", label: "Tobacco use" }, { code: "Z30.09", label: "Contraception counselling" }, { code: "Z39.2", label: "Routine postpartum follow-up" }, { code: "Z09", label: "Follow-up after treatment" }, { code: "Z51.11", label: "Chemotherapy encounter" }, { code: "Z49.31", label: "Haemodialysis encounter" }, { code: "Z02.1", label: "Pre-employment examination" }, { code: "Z02.71", label: "Medical certificate issued" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9. ]+/g, " ").replace(/\s+/g, " ").trim();

/** Search by code prefix or words in the label. */
export function searchIcd10(query: string, max = 12): Icd10[] {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(" ").filter(Boolean);
  const scored = ICD10.map((c) => {
    const code = c.code.toLowerCase(), label = norm(c.label);
    let score = 0;
    if (code === q) score = 100;
    else if (code.startsWith(q)) score = 80;
    else if (words.every((w) => label.includes(w))) score = 60 - label.length / 20;
    else if (words.some((w) => w.length > 3 && label.includes(w))) score = 20;
    return { c, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.c);
}
