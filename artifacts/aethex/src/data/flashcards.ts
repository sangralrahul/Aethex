export type Flashcard = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags?: string[];
};

export type Deck = {
  id: string;
  name: string;
  subject: string;
  emoji: string;
  description: string;
};

export const DECKS: Deck[] = [
  { id: "anatomy-upper-limb", name: "Upper Limb Anatomy", subject: "Anatomy", emoji: "🦴", description: "Bones, muscles, nerves of the upper limb" },
  { id: "physio-cardio", name: "Cardiovascular Physiology", subject: "Physiology", emoji: "❤️", description: "Cardiac cycle, ECG, hemodynamics" },
  { id: "pharma-antibiotics", name: "Antibiotics", subject: "Pharmacology", emoji: "💊", description: "MOA, spectrum, adverse effects" },
  { id: "path-neoplasia", name: "Neoplasia", subject: "Pathology", emoji: "🔬", description: "Tumor markers, grading, staging" },
  { id: "micro-bacteria", name: "Bacteriology", subject: "Microbiology", emoji: "🦠", description: "Gram stain, culture, pathogenesis" },
  { id: "biochem-metab", name: "Metabolism", subject: "Biochemistry", emoji: "⚗️", description: "Glycolysis, TCA, urea cycle" },
];

export const FLASHCARDS: Flashcard[] = [
  // Anatomy
  { id: "a1", deckId: "anatomy-upper-limb", front: "Which nerve is affected in wrist drop?", back: "Radial nerve (posterior interosseous branch)." },
  { id: "a2", deckId: "anatomy-upper-limb", front: "Rotator cuff muscles (SITS)?", back: "Supraspinatus, Infraspinatus, Teres minor, Subscapularis." },
  { id: "a3", deckId: "anatomy-upper-limb", front: "Nerve at risk in surgical neck of humerus fracture?", back: "Axillary nerve → deltoid paralysis, loss of shoulder abduction 15–90°." },
  { id: "a4", deckId: "anatomy-upper-limb", front: "Boundaries of the cubital fossa?", back: "Superior: line between epicondyles; Lateral: brachioradialis; Medial: pronator teres." },
  { id: "a5", deckId: "anatomy-upper-limb", front: "Sign of median nerve injury at wrist?", back: "Ape hand deformity, loss of thumb opposition." },
  { id: "a6", deckId: "anatomy-upper-limb", front: "Which nerve winds around the medial epicondyle?", back: "Ulnar nerve — 'funny bone'." },

  // Physiology
  { id: "p1", deckId: "physio-cardio", front: "Normal cardiac output at rest?", back: "≈ 5 L/min (SV 70 mL × HR 72)." },
  { id: "p2", deckId: "physio-cardio", front: "What does the P wave represent?", back: "Atrial depolarization." },
  { id: "p3", deckId: "physio-cardio", front: "Frank–Starling law states?", back: "Stroke volume increases with end-diastolic volume (preload)." },
  { id: "p4", deckId: "physio-cardio", front: "Normal PR interval?", back: "0.12 – 0.20 seconds." },
  { id: "p5", deckId: "physio-cardio", front: "Ejection fraction formula?", back: "EF = SV / EDV × 100. Normal ≥ 55%." },
  { id: "p6", deckId: "physio-cardio", front: "Effect of sympathetic stimulation on SA node?", back: "Positive chronotropy — increases heart rate via β1 receptors." },

  // Pharmacology
  { id: "ph1", deckId: "pharma-antibiotics", front: "MOA of penicillins?", back: "Inhibit transpeptidase → block peptidoglycan cross-linking → bacterial lysis." },
  { id: "ph2", deckId: "pharma-antibiotics", front: "Aminoglycoside toxicities?", back: "Nephrotoxicity, ototoxicity, neuromuscular blockade." },
  { id: "ph3", deckId: "pharma-antibiotics", front: "Which antibiotic causes red-man syndrome?", back: "Vancomycin — infusion-related histamine release." },
  { id: "ph4", deckId: "pharma-antibiotics", front: "MOA of fluoroquinolones?", back: "Inhibit DNA gyrase (topo II) and topo IV." },
  { id: "ph5", deckId: "pharma-antibiotics", front: "First-line for MRSA?", back: "Vancomycin (or linezolid / daptomycin)." },
  { id: "ph6", deckId: "pharma-antibiotics", front: "Antibiotic contraindicated in pregnancy — tooth staining?", back: "Tetracyclines." },

  // Pathology
  { id: "pa1", deckId: "path-neoplasia", front: "Tumor marker for hepatocellular carcinoma?", back: "Alpha-fetoprotein (AFP)." },
  { id: "pa2", deckId: "path-neoplasia", front: "CA 19-9 is associated with?", back: "Pancreatic adenocarcinoma." },
  { id: "pa3", deckId: "path-neoplasia", front: "Psammoma bodies are seen in?", back: "Papillary thyroid, serous ovarian, meningioma, mesothelioma." },
  { id: "pa4", deckId: "path-neoplasia", front: "Philadelphia chromosome?", back: "t(9;22) BCR-ABL — CML." },
  { id: "pa5", deckId: "path-neoplasia", front: "Grading vs staging?", back: "Grade = histologic differentiation; Stage = extent of spread (TNM)." },
  { id: "pa6", deckId: "path-neoplasia", front: "Most common cancer in women worldwide?", back: "Breast cancer." },

  // Micro
  { id: "m1", deckId: "micro-bacteria", front: "Gram-positive cocci in clusters?", back: "Staphylococcus." },
  { id: "m2", deckId: "micro-bacteria", front: "Bacteria causing rice-water stools?", back: "Vibrio cholerae." },
  { id: "m3", deckId: "micro-bacteria", front: "Acid-fast bacillus causing TB?", back: "Mycobacterium tuberculosis (Ziehl-Neelsen stain)." },
  { id: "m4", deckId: "micro-bacteria", front: "Toxin of Corynebacterium diphtheriae MOA?", back: "ADP-ribosylation of EF-2 → inhibits protein synthesis." },
  { id: "m5", deckId: "micro-bacteria", front: "Cause of pseudomembranous colitis?", back: "Clostridioides difficile (toxin A & B)." },
  { id: "m6", deckId: "micro-bacteria", front: "Lancefield group A strep?", back: "Streptococcus pyogenes." },

  // Biochem
  { id: "b1", deckId: "biochem-metab", front: "Rate-limiting enzyme of glycolysis?", back: "Phosphofructokinase-1 (PFK-1)." },
  { id: "b2", deckId: "biochem-metab", front: "Net ATP yield from glycolysis?", back: "2 ATP (aerobic net; substrate-level)." },
  { id: "b3", deckId: "biochem-metab", front: "Urea cycle location?", back: "Mitochondria + cytosol of hepatocytes." },
  { id: "b4", deckId: "biochem-metab", front: "Deficiency causing classic galactosemia?", back: "Galactose-1-phosphate uridyltransferase (GALT)." },
  { id: "b5", deckId: "biochem-metab", front: "Cofactor for pyruvate dehydrogenase?", back: "Thiamine (B1), lipoate, CoA, FAD, NAD." },
  { id: "b6", deckId: "biochem-metab", front: "Ketone bodies produced in?", back: "Liver mitochondria (from acetyl-CoA) — used by brain in fasting." },
];
