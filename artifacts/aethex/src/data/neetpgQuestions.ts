/**
 * The NEET-PG question bank used by the NEET-PG practice, the quick test, the custom test builder (update 77) and the
 * revision deck. Moved out of src/pages/NeetPg.tsx unchanged.
 */
// ── Types ──────────────────────────────────────────────────────────────────
export type Difficulty = "Easy" | "Medium" | "Hard";
export type Subject =
  | "Anatomy" | "Physiology" | "Biochemistry" | "Pathology"
  | "Pharmacology" | "Microbiology" | "Medicine" | "Surgery" | "Gynaecology";

export interface MCQ {
  id: number;
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  subject: Subject;
  difficulty: Difficulty;
  reference?: string;
}

// ── Question Bank ──────────────────────────────────────────────────────────
export const QUESTIONS: MCQ[] = [
  {
    id: 1,
    subject: "Anatomy",
    difficulty: "Medium",
    question: "The structure that passes through the foramen ovale of the sphenoid bone is:",
    options: [
      "Mandibular nerve (V3)",
      "Maxillary nerve (V2)",
      "Ophthalmic nerve (V1)",
      "Abducens nerve (VI)",
    ],
    correct: 0,
    explanation: "The mandibular nerve (V3), the largest division of the trigeminal nerve, passes through the foramen ovale. V2 passes through foramen rotundum, V1 passes through the superior orbital fissure, and the abducens nerve also passes through the superior orbital fissure.",
    reference: "Gray's Anatomy, 41st ed",
  },
  {
    id: 2,
    subject: "Anatomy",
    difficulty: "Hard",
    question: "Trendelenburg's sign is positive when there is paralysis of:",
    options: [
      "Gluteus medius and minimus",
      "Gluteus maximus",
      "Iliopsoas",
      "Quadriceps femoris",
    ],
    correct: 0,
    explanation: "Trendelenburg's sign indicates weakness/paralysis of the gluteus medius and minimus (hip abductors), supplied by the superior gluteal nerve (L4, L5, S1). When the patient stands on the affected leg, the pelvis drops to the opposite side because the hip abductors cannot support the pelvis.",
    reference: "Snell's Clinical Anatomy",
  },
  {
    id: 3,
    subject: "Physiology",
    difficulty: "Easy",
    question: "The normal resting membrane potential of a cardiac ventricular muscle cell is approximately:",
    options: ["-70 mV", "-90 mV", "-55 mV", "-110 mV"],
    correct: 1,
    explanation: "The resting membrane potential of cardiac ventricular muscle cells is approximately -90 mV, primarily due to the high K+ permeability through IK1 channels. This is more negative than skeletal muscle (-70 mV) and neurons (-70 mV).",
    reference: "Guyton & Hall Medical Physiology, 14th ed",
  },
  {
    id: 4,
    subject: "Physiology",
    difficulty: "Medium",
    question: "The oxygen-hemoglobin dissociation curve shifts to the right in response to all of the following EXCEPT:",
    options: [
      "Increased CO2",
      "Increased temperature",
      "Increased 2,3-DPG",
      "Decreased pH (alkalosis)",
    ],
    correct: 3,
    explanation: "The oxygen-hemoglobin dissociation curve shifts RIGHT (decreased O2 affinity) with increased CO2, increased temperature, increased 2,3-DPG, and DECREASED pH (acidosis — Bohr effect). Alkalosis (INCREASED pH) shifts the curve to the LEFT, increasing O2 affinity.",
    reference: "Ganong's Review of Medical Physiology",
  },
  {
    id: 5,
    subject: "Biochemistry",
    difficulty: "Medium",
    question: "Lesch-Nyhan syndrome is caused by deficiency of which enzyme?",
    options: [
      "HGPRT (Hypoxanthine-guanine phosphoribosyltransferase)",
      "Adenosine deaminase",
      "Xanthine oxidase",
      "PRPP synthetase",
    ],
    correct: 0,
    explanation: "Lesch-Nyhan syndrome is an X-linked recessive disorder caused by complete deficiency of HGPRT (hypoxanthine-guanine phosphoribosyltransferase). This leads to accumulation of hypoxanthine and guanine, which are converted to uric acid. Features: hyperuricemia, gout, mental retardation, choreoathetosis, and self-mutilation.",
    reference: "Harper's Illustrated Biochemistry",
  },
  {
    id: 6,
    subject: "Biochemistry",
    difficulty: "Hard",
    question: "Which enzyme is allosterically inhibited by citrate in glycolysis?",
    options: [
      "Phosphofructokinase-1 (PFK-1)",
      "Hexokinase",
      "Pyruvate kinase",
      "Phosphoglycerate kinase",
    ],
    correct: 0,
    explanation: "Phosphofructokinase-1 (PFK-1) is the key regulatory enzyme of glycolysis. Citrate (an indicator of abundant energy and biosynthetic precursors) allosterically inhibits PFK-1, slowing glycolysis. It is activated by AMP/ADP. This is an important regulatory mechanism linking the TCA cycle to glycolysis.",
    reference: "Lippincott's Illustrated Reviews: Biochemistry",
  },
  {
    id: 7,
    subject: "Pathology",
    difficulty: "Medium",
    question: "Reed-Sternberg cells are characteristically seen in:",
    options: [
      "Hodgkin's lymphoma",
      "Non-Hodgkin's lymphoma",
      "Burkitt's lymphoma",
      "Multiple myeloma",
    ],
    correct: 0,
    explanation: "Reed-Sternberg cells are large binucleated or multinucleated cells with prominent eosinophilic 'owl-eye' nucleoli. They are the hallmark of Hodgkin's lymphoma, derived from germinal center B cells. Owl-eye nucleoli + mirror image nuclei = classic RS cells.",
    reference: "Robbins & Cotran Pathologic Basis of Disease",
  },
  {
    id: 8,
    subject: "Pathology",
    difficulty: "Easy",
    question: "The most common type of myocardial infarction involves occlusion of:",
    options: [
      "Left anterior descending artery (LAD)",
      "Right coronary artery (RCA)",
      "Left circumflex artery (LCx)",
      "Posterior descending artery (PDA)",
    ],
    correct: 0,
    explanation: "The left anterior descending artery (LAD) is the most commonly occluded artery in MI, causing anterior wall MI (hence LAD is called 'widow maker'). It supplies the anterior wall of LV, anterior 2/3 of interventricular septum, and apex. It accounts for ~40-50% of all MIs.",
    reference: "Robbins & Cotran Pathologic Basis of Disease",
  },
  {
    id: 9,
    subject: "Pharmacology",
    difficulty: "Medium",
    question: "The drug of choice for status epilepticus is:",
    options: [
      "IV Lorazepam (or Diazepam)",
      "IV Phenytoin",
      "IV Valproate",
      "IV Phenobarbitone",
    ],
    correct: 0,
    explanation: "IV Lorazepam is now the preferred first-line drug for status epilepticus due to its longer duration of action compared to diazepam. Both act by enhancing GABA-A receptor activity. If benzodiazepines fail, IV phenytoin/fosphenytoin or levetiracetam is used as second-line therapy.",
    reference: "KD Tripathi Essentials of Medical Pharmacology",
  },
  {
    id: 10,
    subject: "Pharmacology",
    difficulty: "Hard",
    question: "A patient on warfarin therapy develops resistance to anticoagulation. Which vitamin K-dependent clotting factor has the shortest half-life and will be depleted first?",
    options: [
      "Factor VII",
      "Factor II (prothrombin)",
      "Factor IX",
      "Factor X",
    ],
    correct: 0,
    explanation: "Factor VII has the shortest half-life (~4-6 hours) among vitamin K-dependent clotting factors. This is why PT (which tests the extrinsic pathway including Factor VII) becomes prolonged first with warfarin therapy. Mnemonic: 1972 — Factors II, VII, IX, X + Protein C, S are vitamin K-dependent.",
    reference: "Goodman & Gilman's Pharmacological Basis of Therapeutics",
  },
  {
    id: 11,
    subject: "Microbiology",
    difficulty: "Easy",
    question: "The causative organism of gas gangrene (clostridial myonecrosis) is:",
    options: [
      "Clostridium perfringens",
      "Clostridium tetani",
      "Clostridium botulinum",
      "Clostridium difficile",
    ],
    correct: 0,
    explanation: "Clostridium perfringens type A is the most common cause of gas gangrene. It produces alpha toxin (lecithinase/phospholipase C), which destroys cell membranes, causing rapid tissue destruction with gas production. Treatment: immediate surgical debridement + IV penicillin + hyperbaric O2.",
    reference: "Ananthanarayan & Paniker's Microbiology",
  },
  {
    id: 12,
    subject: "Microbiology",
    difficulty: "Medium",
    question: "The Weil-Felix test is used in the diagnosis of:",
    options: [
      "Rickettsial infections",
      "Leptospirosis",
      "Typhoid fever",
      "Brucellosis",
    ],
    correct: 0,
    explanation: "The Weil-Felix test is an agglutination test that uses Proteus vulgaris strains (OX-19, OX-2, OX-K) to detect antibodies against Rickettsia species. It is based on antigenic cross-reactivity between rickettsiae and certain Proteus strains. OX-19 & OX-2 positive → typhus group; OX-K positive → scrub typhus.",
    reference: "Ananthanarayan & Paniker's Microbiology",
  },
  {
    id: 13,
    subject: "Medicine",
    difficulty: "Medium",
    question: "A 55-year-old man presents with haemoptysis, weight loss, and a chest X-ray showing a coin lesion with spiculated margins in the right upper lobe. The most likely diagnosis is:",
    options: [
      "Bronchogenic carcinoma",
      "Pulmonary tuberculosis",
      "Pulmonary hamartoma",
      "Pulmonary AV malformation",
    ],
    correct: 0,
    explanation: "A spiculated (irregular, speculated margins) coin lesion in the upper lobe in a middle-aged smoker with haemoptysis and weight loss is highly suspicious for bronchogenic carcinoma (most likely adenocarcinoma or squamous cell carcinoma). Hamartoma classically shows 'popcorn calcification' and smooth margins. TB usually shows upper lobe infiltrates with cavitation.",
    reference: "Harrison's Principles of Internal Medicine",
  },
  {
    id: 14,
    subject: "Surgery",
    difficulty: "Medium",
    question: "The most common complication of appendicectomy is:",
    options: [
      "Wound infection",
      "Fecal fistula",
      "Paralytic ileus",
      "Reactionary haemorrhage",
    ],
    correct: 0,
    explanation: "Wound infection (surgical site infection) is the most common complication after appendicectomy, occurring in 5-20% of cases (higher in perforated appendicitis). It is caused by contamination of the wound with gut flora during surgery. Prophylactic antibiotics and careful wound closure reduce this risk.",
    reference: "Bailey & Love's Short Practice of Surgery",
  },
  {
    id: 15,
    subject: "Gynaecology",
    difficulty: "Medium",
    question: "The most common site of ectopic pregnancy is:",
    options: [
      "Ampulla of fallopian tube",
      "Isthmus of fallopian tube",
      "Ovary",
      "Cornua of uterus",
    ],
    correct: 0,
    explanation: "The ampulla of the fallopian tube is the most common site of ectopic pregnancy (~70-80%), followed by the isthmus (~12%), fimbria (~5%), and cornua (~2%). Ovarian and abdominal ectopics are rare. Risk factors include PID, previous tubal surgery, and IUD use.",
    reference: "DC Dutta's Textbook of Gynaecology",
  },
  {
    id: 16,
    subject: "Anatomy",
    difficulty: "Easy",
    question: "The largest nerve in the human body is:",
    options: [
      "Sciatic nerve",
      "Femoral nerve",
      "Vagus nerve",
      "Brachial plexus",
    ],
    correct: 0,
    explanation: "The sciatic nerve is the largest and longest nerve in the human body, formed from L4, L5, S1, S2, S3 nerve roots. It exits the pelvis through the greater sciatic foramen below the piriformis muscle and supplies the posterior thigh and entire leg and foot (via its tibial and common peroneal divisions).",
    reference: "Gray's Anatomy",
  },
  {
    id: 17,
    subject: "Physiology",
    difficulty: "Hard",
    question: "Which of the following is NOT a function of the juxtaglomerular apparatus (JGA)?",
    options: [
      "Direct filtration of plasma",
      "Renin secretion",
      "Tubuloglomerular feedback",
      "Erythropoietin secretion (minor role)",
    ],
    correct: 0,
    explanation: "The JGA consists of macula densa cells (detecting NaCl in tubular fluid), juxtaglomerular cells (granular cells that secrete renin), and extraglomerular mesangial cells. It mediates tubuloglomerular feedback and renin secretion. Direct plasma filtration occurs at the glomerular capillaries — this is NOT a function of the JGA.",
    reference: "Ganong's Review of Medical Physiology",
  },
  {
    id: 18,
    subject: "Pharmacology",
    difficulty: "Easy",
    question: "Penicillin acts by inhibiting:",
    options: [
      "Transpeptidase enzyme (cell wall synthesis)",
      "DNA gyrase",
      "Protein synthesis at 30S ribosome",
      "Cell membrane ergosterol",
    ],
    correct: 0,
    explanation: "Penicillin inhibits bacterial cell wall synthesis by irreversibly binding to penicillin-binding proteins (PBPs), which include transpeptidase enzymes. This prevents cross-linking of peptidoglycan chains, leading to cell lysis. It is bactericidal and effective against gram-positive organisms primarily.",
    reference: "KD Tripathi Essentials of Medical Pharmacology",
  },
  {
    id: 19,
    subject: "Pathology",
    difficulty: "Hard",
    question: "A 4-year-old boy presents with nephrotic syndrome. Renal biopsy shows no changes on light microscopy but electron microscopy reveals effacement of podocyte foot processes. The diagnosis is:",
    options: [
      "Minimal Change Disease (Lipoid nephrosis)",
      "Focal segmental glomerulosclerosis",
      "Membranous nephropathy",
      "Mesangial proliferative glomerulonephritis",
    ],
    correct: 0,
    explanation: "Minimal Change Disease (MCD/Lipoid nephrosis) is the most common cause of nephrotic syndrome in children. It shows NO changes on light microscopy, NORMAL immunofluorescence, but EM shows diffuse effacement of podocyte foot processes. Excellent response to steroids (~90% remission). Associated with Hodgkin's lymphoma in adults.",
    reference: "Robbins & Cotran Pathologic Basis of Disease",
  },
  {
    id: 20,
    subject: "Medicine",
    difficulty: "Hard",
    question: "A patient presents with hypertension, hypokalemia, and metabolic alkalosis. Aldosterone is elevated but renin is suppressed. The most likely diagnosis is:",
    options: [
      "Primary hyperaldosteronism (Conn's syndrome)",
      "Renal artery stenosis",
      "Cushing's syndrome",
      "Pheochromocytoma",
    ],
    correct: 0,
    explanation: "Primary hyperaldosteronism (Conn's syndrome) classically presents with hypertension, hypokalemia, metabolic alkalosis, HIGH aldosterone, and LOW renin (negative feedback). Most common cause is bilateral adrenal hyperplasia (60%), followed by aldosterone-producing adenoma (40%). Renal artery stenosis would show high renin AND high aldosterone.",
    reference: "Harrison's Principles of Internal Medicine",
  },
];
