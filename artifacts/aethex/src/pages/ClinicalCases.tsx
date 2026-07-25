import { useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { Eye, EyeOff, Sparkles, ChevronDown, ChevronUp, Search, BookOpen, Stethoscope, AlertCircle, CheckCircle, Lightbulb, ClipboardList, FlaskConical, Tag, Filter } from "lucide-react";
import { cadusUrl } from "@/lib/host";


interface Investigation {
  name: string;
  value: string;
  normal?: string;
  abnormal?: boolean;
}

interface ClinicalCase {
  id: number;
  title: string;
  specialty: string;
  difficulty: "Intern" | "Resident" | "Consultant";
  chiefComplaint: string;
  history: string;
  examination: string;
  investigations: Investigation[];
  diagnosis: string;
  management: string[];
  learningPoints: string[];
  tags: string[];
}

const CASES: ClinicalCase[] = [
  {
    id: 1,
    title: "Young male with acute chest pain and ST elevation",
    specialty: "Cardiology",
    difficulty: "Resident",
    chiefComplaint: "Chest pain radiating to left arm for 2 hours, diaphoresis",
    history: "32-year-old male, smoker (15 pack-years), family history of CAD (father MI at 48). Sudden onset crushing retrosternal chest pain radiating to left arm and jaw for 2 hours. Associated with profuse sweating. No prior cardiac history. Cocaine use denied. On no regular medications.",
    examination: "BP 140/90 R arm, 138/88 L arm. HR 100 bpm, regular. RR 18. Saturations 94% room air. Diaphoretic and pale. JVP not elevated. Heart sounds normal, no murmurs. Chest clear. No peripheral oedema.",
    investigations: [
      { name: "ECG", value: "ST elevation 3mm in leads II, III, aVF. Reciprocal depression in I, aVL. No LBBB.", abnormal: true },
      { name: "Troponin I (high sensitivity)", value: "4.2 ng/mL", normal: "<0.04 ng/mL", abnormal: true },
      { name: "CK-MB", value: "86 U/L", normal: "<25 U/L", abnormal: true },
      { name: "Hb", value: "14.2 g/dL", normal: "12–16 g/dL" },
      { name: "Platelet count", value: "2.8 lakh/μL", normal: "1.5–4 lakh" },
      { name: "Creatinine", value: "1.0 mg/dL", normal: "<1.2" },
      { name: "Cholesterol (LDL)", value: "3.9 mmol/L (151 mg/dL)", normal: "<2.6 mmol/L", abnormal: true },
      { name: "Random blood glucose", value: "7.8 mmol/L (140 mg/dL)", normal: "<11.1 mmol/L" },
    ],
    diagnosis: "Inferior STEMI (ST-elevation myocardial infarction) — Inferior wall",
    management: [
      "Activate CATH lab immediately — door-to-balloon time target < 90 minutes",
      "Aspirin 300mg loading dose stat, Ticagrelor 180mg loading (or Clopidogrel 600mg if Ticagrelor unavailable)",
      "Heparin UFH 60 units/kg IV bolus (max 4000 units)",
      "GTN sublingual if BP permits; IV morphine for pain (AVOID routine morphine — impairs P2Y12 absorption)",
      "Oxygen only if SpO2 <90% — routine O₂ is harmful in STEMI",
      "Primary PCI is preferred reperfusion strategy — right coronary artery most likely culprit",
      "If PCI not available within 120 min, consider thrombolysis with Tenecteplase",
      "Post-PCI: Dual antiplatelet, Beta-blocker, ACEi/ARB, High-intensity statin (Atorvastatin 80mg)",
      "Cardiac rehab referral before discharge",
    ],
    learningPoints: [
      "Inferior STEMI: ST elevation in II, III, aVF with reciprocal changes in I and aVL — the most common STEMI territory",
      "Right ventricular infarction complicates 30–50% of inferior STEMIs — check V4R lead; AVOID nitrates if RV infarction",
      "Young STEMI in a smoker: screen for familial hypercholesterolaemia and thrombophilia",
      "Premature coronary disease definition: Male <55 years or Female <65 years",
      "Routine oxygen in STEMI with normal saturations increases mortality (AVOID-O2 trial)",
    ],
    tags: ["STEMI", "inferior MI", "cath lab", "ACS", "chest pain"],
  },
  {
    id: 2,
    title: "Elderly woman with confusion, hyponatraemia and fall",
    specialty: "General Medicine",
    difficulty: "Resident",
    chiefComplaint: "72-year-old woman found confused at home, unable to give history",
    history: "72-year-old female, brought by family. Found confused at home. Has history of hypertension (on Amlodipine 5mg and Hydrochlorothiazide 25mg), hypothyroidism (on Thyroxine 50mcg). Lives alone. Not eating well for 5 days. 'Drunk-like' behaviour for 2 days. One fall today without loss of consciousness. No fever. No medications changed recently.",
    examination: "GCS 12/15 (E3V4M5). BP 118/76 lying, 96/68 standing (orthostatic hypotension). HR 78 bpm. Temp 36.4°C. Dry mucous membranes. Skin tenting present. Mild confusion to time and place. Gait wide-based and unsteady. No focal neurology. No neck stiffness.",
    investigations: [
      { name: "Serum Sodium (Na⁺)", value: "118 mEq/L", normal: "135–145 mEq/L", abnormal: true },
      { name: "Serum Potassium (K⁺)", value: "3.1 mEq/L", normal: "3.5–5.0 mEq/L", abnormal: true },
      { name: "Serum Osmolality", value: "248 mOsm/kg", normal: "275–295", abnormal: true },
      { name: "Urine Osmolality", value: "420 mOsm/kg", normal: ">100 if hypo-osmolar" },
      { name: "Urine Sodium", value: "52 mEq/L", normal: ">20 mEq/L suggests renal loss", abnormal: true },
      { name: "TSH", value: "4.2 mIU/L", normal: "0.4–4.0", abnormal: true },
      { name: "Creatinine", value: "1.6 mg/dL", normal: "<1.2", abnormal: true },
      { name: "Cortisol (9am)", value: "18 μg/dL", normal: ">18 μg/dL (normal)" },
      { name: "CT Brain (non-contrast)", value: "No haemorrhage, no acute changes, age-appropriate cortical atrophy" },
    ],
    diagnosis: "Severe Hyponatraemia (Na 118) secondary to Thiazide-induced SIADH pattern — most likely SIADH-like state from Hydrochlorothiazide with volume depletion component",
    management: [
      "STOP Hydrochlorothiazide — most likely causative agent",
      "Fluid restriction 800–1000 mL/day (if euvolaemic/hypervolaemic SIADH component)",
      "Careful IV 0.9% NaCl if volume depleted — correct hypovolaemia slowly",
      "Rate of correction: Maximum 8–10 mEq/L per 24 hours; max 18 mEq/L in first 48h (risk of osmotic demyelination syndrome)",
      "Monitor serum Na 2-hourly initially, then 6-hourly once stable",
      "IV KCl supplementation for hypokalaemia",
      "Falls precautions, Vitamin D supplementation",
      "Review medications: Amlodipine can continue. Consider alternative antihypertensive.",
      "Optimize Thyroxine dose (TSH mildly elevated)",
      "Discharge with serum Na monitoring at 1 and 4 weeks",
    ],
    learningPoints: [
      "Thiazide diuretics are the most common drug cause of severe symptomatic hyponatraemia in the elderly",
      "SIADH diagnosis requires: hypo-osmolar hyponatraemia + urine osmolality > serum osmolality + urine Na > 20 mEq/L + clinically euvolaemic",
      "Osmotic Demyelination Syndrome (ODS): Prevent by correcting Na no faster than 8-10 mEq/L/24h — this is the critical safety limit",
      "Volume status assessment is crucial: clinical signs + urine Na + BUN:Creatinine ratio",
      "Hyponatraemia is the commonest electrolyte disorder and the most common cause of falls in the elderly",
    ],
    tags: ["hyponatraemia", "SIADH", "thiazide", "confusion", "elderly", "falls"],
  },
  {
    id: 3,
    title: "Teenage girl with polyuria, polydipsia and weight loss",
    specialty: "Endocrinology",
    difficulty: "Intern",
    chiefComplaint: "14-year-old girl, 3-week history of excessive thirst, frequent urination, weight loss of 4kg",
    history: "14-year-old girl, previously well, no family history of diabetes (though maternal grandmother has 'sugar'). Parents note her waking multiple times at night to drink water and urinate. She has lost 4 kg over 3 weeks despite eating more. Increasingly tired and unable to concentrate at school. Nausea today. No previous hospital admissions. No medications. No recent infections.",
    examination: "Weight 48 kg (was 52 kg 3 weeks ago). Height 162 cm. BMI 18.3. BP 110/72. HR 98. Temp 37.0°C. Deep, rapid breathing (Kussmaul breathing). Fruity smell to breath. Dry mucous membranes. Mild diffuse abdominal tenderness. No signs of chronic disease.",
    investigations: [
      { name: "Random Blood Glucose (capillary)", value: "28.4 mmol/L (511 mg/dL)", normal: "<7.8 mmol/L (non-fasting)", abnormal: true },
      { name: "Venous Blood Gas", value: "pH 7.18, HCO₃ 8.2, PaCO₂ 22, Anion Gap 26", abnormal: true },
      { name: "Serum Ketones", value: "5.8 mmol/L", normal: "<0.5 mmol/L", abnormal: true },
      { name: "HbA1c", value: "12.6%", normal: "<5.7%", abnormal: true },
      { name: "Serum Sodium (corrected)", value: "132 mEq/L (corrected for glucose)", abnormal: true },
      { name: "Serum Potassium", value: "5.8 mEq/L (likely pseudohyperkalaemia; may drop with treatment)", normal: "3.5–5.0", abnormal: true },
      { name: "Creatinine", value: "1.3 mg/dL", normal: "<1.0 in adolescents", abnormal: true },
      { name: "Urine Dipstick", value: "Glucose 4+, Ketones 3+, Protein trace" },
    ],
    diagnosis: "Diabetic Ketoacidosis (DKA) — likely new presentation of Type 1 Diabetes Mellitus",
    management: [
      "ABCs: Assess airway, breathing, circulation — High-flow O₂ if SpO2 <92%",
      "IV Access x2, Bloods: FBC, CMP, VBG, ketones, HbA1c, C-peptide, GAD antibodies",
      "IV 0.9% NaCl 1L over 1 hour (fluid resuscitation — avoid rapid correction)",
      "Insulin infusion: 0.1 units/kg/hour regular insulin IV (start only after K+ confirmed > 3.5 mEq/L)",
      "Potassium replacement: Add KCl 20-40mEq/L to IVF once urine output established and K < 5.5",
      "Monitor: Blood glucose hourly, VBG/ketones 2-hourly, electrolytes 2-4 hourly",
      "Target: Blood glucose falling 2-4 mmol/L/hour. When glucose <14 mmol/L, change to 0.45% NaCl + 5% dextrose",
      "Transition to subcutaneous insulin after anion gap closes (<12) and patient tolerating oral intake",
      "Refer to Paediatric Diabetes team; HbA1c confirms new diagnosis T1DM",
      "Diabetes education (insulin, SMBG, sick day rules, hypoglycaemia management)",
    ],
    learningPoints: [
      "Kussmaul breathing (deep, rapid breathing) is a compensatory mechanism for metabolic acidosis — respiratory system blowing off CO₂",
      "Corrected Na = Measured Na + [1.6 × (Glucose in mmol/L − 5.6)/5.6] — pseudohyponatraemia in hyperglycaemia",
      "Start insulin ONLY after potassium is confirmed >3.5 mEq/L — insulin drives K+ intracellularly, worsening hypokalaemia",
      "Cerebral oedema is the most feared complication of DKA treatment in children — avoid rapid fluid correction",
      "C-peptide and GAD antibodies help distinguish T1DM from T2DM in young patients",
    ],
    tags: ["DKA", "Type 1 diabetes", "paediatrics", "ketoacidosis", "polyuria"],
  },
  {
    id: 4,
    title: "Middle-aged man with jaundice, right upper quadrant pain and fever",
    specialty: "Gastroenterology",
    difficulty: "Resident",
    chiefComplaint: "5 days of jaundice, RUQ pain and fever — Charcot's triad",
    history: "52-year-old male, known gallstone disease for 3 years (refused cholecystectomy). Jaundice progressively worsening for 5 days. RUQ pain, dull, non-radiating. Fever (38.8°C) with chills. Pale stools and dark urine. No alcohol. No liver disease. No weight loss. Recent travel to Rajasthan.",
    examination: "Temp 38.8°C. HR 108. BP 100/65. RR 20. Jaundiced. Tender RUQ with mild guarding. Palpable gallbladder. Mild hepatomegaly 2cm below costal margin. No splenomegaly. Murphy's sign positive. No ascites.",
    investigations: [
      { name: "Bilirubin (Total / Direct)", value: "8.6 / 6.2 mg/dL", normal: "<1.2 / <0.3", abnormal: true },
      { name: "AST / ALT", value: "186 / 214 U/L", normal: "<40 U/L", abnormal: true },
      { name: "ALP", value: "412 U/L", normal: "<120 U/L", abnormal: true },
      { name: "GGT", value: "318 U/L", normal: "<55 U/L", abnormal: true },
      { name: "Albumin", value: "3.1 g/dL", normal: "3.5–5.0", abnormal: true },
      { name: "WBC", value: "18,400/μL with 92% neutrophils", normal: "4000–11000", abnormal: true },
      { name: "CRP", value: "186 mg/L", normal: "<5 mg/L", abnormal: true },
      { name: "Blood Cultures", value: "Pending — 2 sets drawn" },
      { name: "Ultrasound Abdomen", value: "Multiple calculi in GB, CBD dilated 12mm, no CBD calculus seen on USS (low sensitivity). Mild intrahepatic biliary dilatation." },
      { name: "MRCP (obtained next day)", value: "2.1cm calculus in distal CBD causing obstruction with upstream dilatation" },
    ],
    diagnosis: "Acute Cholangitis (Charcot's Triad: jaundice + fever + RUQ pain) secondary to Choledocholithiasis",
    management: [
      "IV antibiotics: Piperacillin-tazobactam 4.5g TDS IV (cover Gram-negatives and anaerobes — E. coli, Klebsiella commonest)",
      "IV fluid resuscitation — hypotension suggests developing Reynold's Pentad (add confusion + septic shock = severe cholangitis)",
      "NBM, NG tube if vomiting",
      "URGENT ERCP — the definitive treatment. Target within 24–48 hours in moderate; EMERGENCY in severe cholangitis",
      "ERCP: Sphincterotomy + CBD stone extraction + biliary stenting if incomplete clearance",
      "If ERCP fails: Percutaneous transhepatic cholangiography (PTC) or surgical CBD exploration",
      "Elective laparoscopic cholecystectomy 4–6 weeks after recovery (interval cholecystectomy)",
      "Blood cultures to guide antibiotic de-escalation once 48h results available",
    ],
    learningPoints: [
      "Charcot's Triad: RUQ pain + Fever + Jaundice — pathognomonic of cholangitis but only present in 50–70% of cases",
      "Reynold's Pentad = Charcot's Triad + altered consciousness + septic shock — sign of severe cholangitis requiring EMERGENCY decompression",
      "USS has poor sensitivity (~30%) for CBD stones; MRCP is gold standard (sensitivity >90%)",
      "Tokyo Guidelines 2018 grade cholangitis as Mild (Grade I), Moderate (Grade II), Severe (Grade III) — guides timing of ERCP",
      "CBD stones missed on initial USS are a common medicolegal pitfall — reimage or proceed to MRCP/EUS in strong clinical suspicion",
    ],
    tags: ["cholangitis", "choledocholithiasis", "jaundice", "ERCP", "Charcot's triad"],
  },
  {
    id: 5,
    title: "Young woman with pleuritic chest pain, haemoptysis and leg swelling",
    specialty: "Pulmonology",
    difficulty: "Resident",
    chiefComplaint: "Sudden onset right-sided pleuritic chest pain, haemoptysis, and right leg swelling",
    history: "27-year-old woman, 6 weeks postpartum (Caesarean section for pre-eclampsia). On combined oral contraceptive pill restarted 2 weeks ago. Sudden onset sharp right-sided chest pain worsening with breathing. Haemoptysis — small amount of bright red blood x2. Swelling and pain in right calf for 3 days. Non-smoker. No prior thrombosis. Resting at home since delivery.",
    examination: "BP 118/76. HR 112. RR 22. SpO2 91% room air. Right calf tender, warm, swollen and red. Mild tachypnoea. Decreased air entry right base. Pleural rub right lower zone. No haemodynamic collapse.",
    investigations: [
      { name: "D-dimer", value: "6800 ng/mL", normal: "<500 ng/mL", abnormal: true },
      { name: "ABG (room air)", value: "pH 7.46, PaO2 68, PaCO2 32, SpO2 91%. A-a gradient elevated.", abnormal: true },
      { name: "ECG", value: "Sinus tachycardia 112 bpm. S1Q3T3 pattern. Right heart strain.", abnormal: true },
      { name: "Wells Score for PE", value: "6 — High probability" },
      { name: "Lower limb Doppler USS", value: "DVT confirmed right popliteal and femoral veins — extensive proximal DVT", abnormal: true },
      { name: "CTPA", value: "Bilateral pulmonary emboli — right lower lobe segmental and subsegmental PE. No saddle embolus. No RV strain on CT.", abnormal: true },
      { name: "Echo (bedside)", value: "Mild RV dilatation. TAPSE 17mm. No intracardiac thrombus." },
      { name: "Troponin I", value: "0.06 ng/mL", normal: "<0.04", abnormal: true },
    ],
    diagnosis: "Massive Proximal DVT with Pulmonary Embolism (Intermediate-High Risk PE) — Risk factors: Recent Caesarean, puerperium, OCP",
    management: [
      "Immediately: High-flow O₂, IV access, haemodynamic monitoring",
      "Anticoagulate NOW: LMWH (Enoxaparin 1mg/kg SC BD) — do NOT wait for CTPA if clinical probability high and no absolute contraindication",
      "This is Intermediate-high risk PE (haemodynamically stable but with RV dysfunction + troponin rise) — close monitoring required",
      "STOP oral contraceptive pill immediately",
      "Transition to DOAC after stable: Rivaroxaban 15mg BD for 21 days, then 20mg OD for ≥3 months",
      "Warfarin: Use if breastfeeding — safe. Target INR 2–3. DOACs: most not recommended in breastfeeding (rivaroxaban data emerging).",
      "Minimum 3 months anticoagulation; consider extended therapy given provoked thrombosis in high-risk context",
      "Investigate for thrombophilia 3 months after stopping anticoagulation (Antiphospholipid syndrome important in young women)",
      "Contraception counselling: OCP ABSOLUTELY CONTRAINDICATED. Options: Progesterone-only pill, copper IUD, condoms",
    ],
    learningPoints: [
      "Virchow's Triad: Hypercoagulability + Venous stasis + Endothelial injury — all three present in postpartum period",
      "OCP + puerperium = extremely high VTE risk. Prescribers must be aware of timing of OCP restart postpartum.",
      "S1Q3T3 on ECG is specific but not sensitive (seen in only ~20% of PE). Sinus tachycardia is the most common ECG finding.",
      "PE risk stratification: Haemodynamic instability = Massive (high risk). Stable with RV dysfunction = Intermediate. Stable without RV dysfunction = Low risk.",
      "Anticoagulation in pregnancy: LMWH is safe throughout. DOACs cross placenta — AVOID. Warfarin: avoid first trimester.",
    ],
    tags: ["pulmonary embolism", "DVT", "PE", "postpartum", "OCP", "thrombosis"],
  },
  {
    id: 6,
    title: "Child with high fever, neck stiffness and non-blanching rash",
    specialty: "Paediatrics",
    difficulty: "Intern",
    chiefComplaint: "6-year-old with sudden high fever, severe headache, vomiting and now a spreading rash",
    history: "6-year-old boy, previously immunised (but family history of missed meningococcal booster). 12-hour history of sudden onset high fever (39.8°C), severe headache, photophobia, and 3 episodes of vomiting. 4 hours ago mother noticed small red spots on legs and trunk — now spreading and not fading with pressure. School outbreak of meningitis this week.",
    examination: "Very unwell. Temp 39.8°C. HR 148. RR 28. BP 82/50 (shock). GCS 13/15. Photophobia. Neck stiffness present. Kernig's sign positive. Petechiae and purpura over trunk, legs and palms — non-blanching on glass test. Mottled skin. CRT 4 seconds.",
    investigations: [
      { name: "WBC", value: "22,000/μL (neutrophilia)", abnormal: true },
      { name: "CRP", value: "210 mg/L", abnormal: true },
      { name: "Procalcitonin", value: "18.6 ng/mL", normal: "<0.5", abnormal: true },
      { name: "Blood cultures", value: "TAKEN — DO NOT WAIT FOR RESULTS" },
      { name: "Lactate", value: "5.8 mmol/L", normal: "<2", abnormal: true },
      { name: "Coagulation screen", value: "PT 22s, APTT 58s, Fibrinogen 0.8 g/L — features of DIC", abnormal: true },
      { name: "Lumbar puncture", value: "DEFERRED — raised ICP suspected, shock present, DIC — LP CONTRAINDICATED now" },
      { name: "CSF later (after stabilisation)", value: "Turbid CSF. WBC 4800/μL (neutrophils). Glucose 1.2 mmol/L (serum 7.2). Protein 3.2 g/L. Gram negative diplococci on stain." },
    ],
    diagnosis: "Meningococcal Septicaemia with Meningitis (Neisseria meningitidis serogroup B) — DO NOT DELAY ANTIBIOTICS for any investigation",
    management: [
      "⚡ IMMEDIATE: Ceftriaxone 2g IV/IM stat — DO NOT DELAY. Give even before cannula if needed (IM ceftriaxone acceptable).",
      "IV fluid bolus 10mL/kg 0.9% NaCl over 5–10 min, repeat if haemodynamically unstable (FEAST trial: caution with large boluses in resource-limited settings)",
      "Dexamethasone 0.15mg/kg IV 6-hourly x4 days (START with or before first antibiotic dose — reduces deafness complication)",
      "Blood cultures, FBC, CMP, coagulation, meningococcal PCR blood — ALL before antibiotics if <2 min delay; otherwise TREAT FIRST",
      "LP: CONTRAINDICATED in: papilloedema, GCS <13, haemodynamic instability, coagulopathy, skin infection over LP site",
      "ICU referral: PICU admission for haemodynamic monitoring, vasopressors (noradrenaline) if needed",
      "DIC management: FFP, cryoprecipitate, platelets as guided by coagulation results",
      "Notifiable disease: Contact public health immediately for contact tracing and prophylaxis (Ciprofloxacin 500mg single dose for close contacts)",
      "MenACWY and MenB vaccines for contacts; school notification",
    ],
    learningPoints: [
      "NON-BLANCHING rash = Petechiae/Purpura = Meningococcal septicaemia until proven otherwise — this is a TRUE MEDICAL EMERGENCY",
      "The glass test: A blanching rash fades under glass pressure; petechiae and purpura do NOT — this is how parents and physicians should check",
      "Lumbar puncture contraindications are critical: papilloedema, GCS <13, focal neuro signs, coagulopathy, haemodynamic instability",
      "Dexamethasone reduces deafness and neurological sequelae — start with (not after) antibiotics",
      "A well-vaccinated child can still get meningococcal disease — there are multiple serogroups",
    ],
    tags: ["meningococcal", "meningitis", "septicaemia", "paediatrics", "non-blanching rash", "emergency"],
  },
  {
    id: 7,
    title: "Elderly man with weight loss, dysphagia and iron deficiency anaemia",
    specialty: "Gastroenterology",
    difficulty: "Resident",
    chiefComplaint: "6-month progressive difficulty swallowing and 8kg weight loss",
    history: "68-year-old male, long-standing history of heartburn (30 years, on PPI intermittently). Progressive dysphagia starting with solids, now also liquids. 8 kg weight loss over 6 months. Appetite reduced. Occasional regurgitation. No haematemesis. Ex-smoker (40 pack-years, quit 10 years ago). Social alcohol drinker. Retired factory worker.",
    examination: "Thin and cachexic. Weight 58 kg (was 66 kg). Mild pallor. No jaundice. No palpable lymphadenopathy (Virchow's node absent). Epigastric fullness but no definite mass. No ascites. Chest clear.",
    investigations: [
      { name: "FBC: Hb / MCV / MCH", value: "8.9 g/dL / 72 fL / 24 pg", normal: "13–17 / 80–100 / 27–33", abnormal: true },
      { name: "Ferritin", value: "8 μg/L", normal: "20–300", abnormal: true },
      { name: "CEA", value: "12.4 U/mL", normal: "<5", abnormal: true },
      { name: "CA 19-9", value: "42 U/mL", normal: "<37", abnormal: true },
      { name: "LFTs", value: "Normal" },
      { name: "OGD (Gastroscopy)", value: "Irregular ulcero-proliferative growth at 30–36 cm from incisors at the gastro-oesophageal junction. Biopsy taken.", abnormal: true },
      { name: "Biopsy", value: "Poorly differentiated adenocarcinoma of the oesophago-gastric junction (Siewert Type II)", abnormal: true },
      { name: "CT Chest/Abdomen/Pelvis", value: "GOJ mass 5.2cm. 2 peritumoural lymph nodes. No liver metastases. No peritoneal deposits. Lungs clear.", abnormal: true },
      { name: "PET scan", value: "FDG-avid primary with nodal disease. No distant metastases confirmed." },
    ],
    diagnosis: "Carcinoma of the Oesophago-gastric Junction (Siewert Type II Adenocarcinoma) — Locally Advanced, potentially resectable",
    management: [
      "Multidisciplinary Team (MDT) meeting — mandatory before any treatment decision",
      "Staging: CT+PET confirms locally advanced (cT3N1M0) — potential for curative intent surgery",
      "Neoadjuvant FLOT chemotherapy (Fluorouracil, Leucovorin, Oxaliplatin, Docetaxel) x4 cycles before surgery — FLOT4 trial",
      "Repeat staging CT after neoadjuvant chemotherapy — response assessment",
      "Curative surgery: Oesophago-gastrectomy with D2 lymph node dissection (if fit for surgery — cardiac/pulmonary assessment)",
      "Post-operative FLOT x4 cycles if pCR not achieved",
      "If HER2 positive: Add Trastuzumab (ToGA trial data)",
      "Iron supplementation + nutritional support pre-operatively (enteral feeding if dysphagia severe)",
      "Palliative options if unresectable: EOX chemotherapy ± Trastuzumab, oesophageal stenting for dysphagia",
      "PPI (high dose) for symptom control",
    ],
    learningPoints: [
      "Barrett's oesophagus — chronic acid exposure → metaplasia → dysplasia → adenocarcinoma. This patient had 30 years of reflux without endoscopic surveillance.",
      "Siewert Classification of GOJ tumours: Type I (lower oesophagus), Type II (true cardia), Type III (subcardial stomach) — determines surgical approach",
      "Iron deficiency anaemia + dysphagia + weight loss = UPPER GI MALIGNANCY until proven otherwise — URGENT OGD",
      "Virchow's node (left supraclavicular LN) = Troisier's sign — indicates abdominal malignancy with lymphatic spread",
      "HER2 testing is now mandatory in GOJ adenocarcinoma — positive in ~15–20%, eligible for Trastuzumab",
    ],
    tags: ["oesophageal cancer", "GOJ", "dysphagia", "adenocarcinoma", "Barrett's", "weight loss"],
  },
  {
    id: 8,
    title: "Young woman with facial rash, joint pain and proteinuria",
    specialty: "Rheumatology",
    difficulty: "Consultant",
    chiefComplaint: "22-year-old woman with 3-month facial rash, joint pains and recent ankle swelling",
    history: "22-year-old female medical student. 3-month history of butterfly-shaped facial rash worsening in sunlight, bilateral symmetric small joint arthralgia (fingers, wrists), fatigue, and 2 episodes of oral ulcers. 3 weeks of ankle swelling and frothy urine. No recent infections. Family history: maternal aunt with 'lupus'. On oral contraceptive pill.",
    examination: "BP 148/96 (new). HR 78. Well-nourished. Malar rash (butterfly distribution — sparing nasolabial folds). No alopecia currently but reports hair thinning. Mild bilateral ankle oedema. Joints: bilateral PIP and wrist tenderness, no active synovitis. Urinalysis: Protein 3+, Blood 2+, no casts seen on dipstick.",
    investigations: [
      { name: "Hb", value: "9.8 g/dL", normal: "12–16", abnormal: true },
      { name: "WBC", value: "3200/μL", normal: "4000–11000", abnormal: true },
      { name: "Lymphocytes", value: "900/μL (lymphopenia)", normal: ">1000", abnormal: true },
      { name: "Platelet count", value: "98,000/μL", normal: "150,000–400,000", abnormal: true },
      { name: "Creatinine", value: "1.4 mg/dL", normal: "<1.0 in young women", abnormal: true },
      { name: "ANA (antinuclear antibody)", value: "Positive 1:1280 (speckled pattern)", normal: "<1:80", abnormal: true },
      { name: "Anti-dsDNA antibody", value: "286 IU/mL (highly elevated)", normal: "<10 IU/mL", abnormal: true },
      { name: "C3 / C4 complement", value: "C3 48 mg/dL (↓) / C4 6 mg/dL (↓)", normal: "C3: 90–180 / C4: 16–47", abnormal: true },
      { name: "24-hour Urine Protein", value: "3.8 g/24h", normal: "<0.3 g/24h", abnormal: true },
      { name: "Renal Biopsy", value: "Class III/IV (Focal/Diffuse Proliferative Lupus Nephritis) — crescents present" },
    ],
    diagnosis: "Systemic Lupus Erythematosus (SLE) with Active Lupus Nephritis (Class IV)",
    management: [
      "Induction therapy: Methylprednisolone 1g IV x3 days (pulse steroids), then Prednisolone 60mg daily",
      "Mycophenolate mofetil (MMF) 2-3g/day in divided doses — superior to cyclophosphamide for induction in LN per LUNAR trial",
      "OR Cyclophosphamide (low-dose Euro-Lupus protocol: 500mg IV fortnightly x6) — alternative induction",
      "Add Hydroxychloroquine 200-400mg/day — reduces flares, long-term organ damage, and mortality. Check G6PD first.",
      "Belimumab (BLyS inhibitor): Consider add-on in refractory or severe active lupus nephritis",
      "Blood pressure control: Target <130/80 — ACEi/ARB preferred (nephroprotective; also reduces proteinuria)",
      "STOP combined oral contraceptive pill — increases thrombosis risk in SLE (especially if Antiphospholipid antibodies positive)",
      "Screen for: Antiphospholipid syndrome (APS), SS-A/SS-B, Anti-Sm, Antiphospholipid antibodies",
      "Bone protection: Calcium + Vitamin D, consider bisphosphonate with prolonged steroids",
      "Maintenance: After 6 months induction, switch to Azathioprine or MMF. Taper steroids to minimum.",
      "Ophthalmology review for hydroxychloroquine retinopathy (annual after 5 years)",
    ],
    learningPoints: [
      "ACR/EULAR 2019 SLE classification criteria: Positive ANA threshold score + domain criteria across 7 organs. ≥10 points = SLE.",
      "Active Lupus Nephritis indicators: Rising creatinine + proteinuria >0.5g/day + active urinary sediment + ↓ complement + ↑ anti-dsDNA",
      "Malar rash spares the nasolabial folds — distinguishes it from rosacea (which involves nasolabial folds)",
      "SLE in women: Oestrogen drives disease — OCP (especially combined) can precipitate flares and thrombosis",
      "Hydroxychloroquine: The 'aspirin of lupus' — should be started in ALL SLE patients unless contraindicated (reduces mortality)",
    ],
    tags: ["SLE", "lupus", "lupus nephritis", "ANA", "autoimmune", "malar rash"],
  },
  {
    id: 9,
    title: "Fever, rash and lymphadenopathy — tropical disease workup",
    specialty: "Infectious Disease",
    difficulty: "Resident",
    chiefComplaint: "22-year-old college student, returned from Rajasthan, 8-day fever with generalised rash and lymphadenopathy",
    history: "22-year-old male, BSc student. Returned from a rural Rajasthan trip 12 days ago (camping, insect bites noted). 8 days of fever (38.5–39.5°C), headache, myalgia, and a rash starting on trunk now spreading to arms. Dry cough. No diarrhoea. No jaundice. Not immunosuppressed. Childhood vaccinations up to date.",
    examination: "Temp 39.0°C. HR 88 (relative bradycardia for level of fever). BP 118/74. Maculopapular rash trunk, arms, palms — Rose spots seen. Splenomegaly 3cm. Bilateral posterior cervical and inguinal lymphadenopathy. No meningism. Mild hepatomegaly.",
    investigations: [
      { name: "WBC", value: "2,800/μL (leucopenia)", normal: "4000–11000", abnormal: true },
      { name: "Neutrophils", value: "1200/μL", normal: ">2000", abnormal: true },
      { name: "Platelet count", value: "88,000/μL", normal: "150,000–400,000", abnormal: true },
      { name: "Widal test", value: "O agglutinins 1:320, H agglutinins 1:160 (suggestive but not diagnostic)", abnormal: true },
      { name: "Blood culture (Salmonella)", value: "Salmonella typhi isolated — FINAL REPORT DAY 5" },
      { name: "Dengue NS1 + IgM/IgG", value: "Negative" },
      { name: "Malaria smear + RDT", value: "Negative x2" },
      { name: "Leptospira IgM", value: "Negative" },
      { name: "Scrub typhus IgM (Orientia tsutsugamushi)", value: "POSITIVE — titre 1:400 (reference >1:160 positive)", abnormal: true },
    ],
    diagnosis: "Co-infection: Scrub Typhus + Typhoid Fever — both confirmed. Rural Rajasthan exposure.",
    management: [
      "Doxycycline 100mg BD x7–14 days — first-line for scrub typhus (all rickettsioses)",
      "Azithromycin 1g OD as alternative (preferred in pregnancy, children <8 years)",
      "For typhoid: Azithromycin 500mg OD x7 days (oral) — preferred in uncomplicated enteric fever in India",
      "If severe typhoid (complications): Ceftriaxone 2g IV OD x14 days",
      "IV fluids, antipyretics, monitor for complications",
      "Scrub typhus complications to watch: Meningoencephalitis, ARDS, myocarditis, acute renal failure",
      "Typhoid complications: Intestinal perforation, haemorrhage, cholecystitis, encephalopathy",
      "Isolate enteric precautions for typhoid (faeco-oral transmission)",
      "Notify to local disease surveillance: Both are notifiable in India",
    ],
    learningPoints: [
      "Relative bradycardia (Faget's sign): Pulse–temperature dissociation — fever without corresponding tachycardia suggests enteric fever, brucellosis or yellow fever",
      "Rose spots: Salmon-pink maculopapular lesions on trunk in enteric fever — seen in only 30% of cases",
      "Widal test: POOR specificity in endemic areas (prior exposure, vaccination). Blood culture remains gold standard.",
      "Scrub typhus: Endemic in 'scrub triangle' (India, SE Asia, Pacific). Vector = chigger mite (Leptotrombidium). Eschar = pathognomonic (but often missed — check hairline, axillae, groin).",
      "Co-infections are common in tropical medicine — investigate for multiple diagnoses when fever doesn't respond to initial treatment",
    ],
    tags: ["scrub typhus", "typhoid", "enteric fever", "co-infection", "tropical", "fever"],
  },
  {
    id: 10,
    title: "Sudden unilateral visual loss in a diabetic — fundus emergency",
    specialty: "Ophthalmology",
    difficulty: "Consultant",
    chiefComplaint: "55-year-old diabetic woman with sudden painless loss of vision in left eye this morning",
    history: "55-year-old woman, T2DM for 14 years (HbA1c 9.8% — poor control), hypertension, hyperlipidaemia. Sudden painless loss of vision in left eye on waking this morning — 'like a curtain came down.' Has had 'floaters' in that eye for the past week. Past history of laser treatment to right eye. No ocular pain. No trauma.",
    examination: "Visual acuity: R 6/12 (with glasses). L Hand movements only. R eye: posterior segment shows photocoagulation scars. L eye: fundus has DENSE VITREOUS HAEMORRHAGE — no view of retina. IOP L eye 16 mmHg. RAPD present in left eye. B-scan ultrasound performed.",
    investigations: [
      { name: "Visual Acuity (L eye)", value: "Hand movements only", normal: "6/6", abnormal: true },
      { name: "IOP (L eye)", value: "16 mmHg", normal: "10–21 mmHg" },
      { name: "RAPD (L eye)", value: "Positive — suggests significant retinal dysfunction", abnormal: true },
      { name: "B-scan Ultrasound (L eye)", value: "Dense vitreous haemorrhage. Possible tractional retinal detachment — membrane formation seen. Area of detached retina possible but unclear due to VH.", abnormal: true },
      { name: "HbA1c", value: "9.8%", normal: "<7%", abnormal: true },
      { name: "Blood pressure", value: "168/102 mmHg", normal: "<130/80", abnormal: true },
      { name: "Lipids (LDL)", value: "3.8 mmol/L", normal: "<1.8 mmol/L in high-risk", abnormal: true },
      { name: "Renal function", value: "Creatinine 1.5 mg/dL, eGFR 42 mL/min — CKD G3a", abnormal: true },
    ],
    diagnosis: "Vitreous Haemorrhage secondary to Proliferative Diabetic Retinopathy (PDR) with possible Tractional Retinal Detachment",
    management: [
      "URGENT VITREORETINAL REFERRAL — same day/within 24–48 hours if TRD suspected",
      "Pars plana vitrectomy (PPV): Surgical removal of vitreous haemorrhage + treatment of underlying PDR",
      "If retinal detachment confirmed: Combined vitrectomy + retinal reattachment + silicone oil/gas tamponade",
      "Anti-VEGF injection (Ranibizumab/Bevacizumab) pre-operatively if needed to reduce vascular proliferation and bleeding",
      "Optimise systemic: Tight glycaemic control (HbA1c target <7%), BP <130/80, High-intensity statin",
      "Other eye (R eye): Check for active PDR — may need urgent PRP (panretinal photocoagulation)",
      "Diabetes team referral for HbA1c optimization — current 9.8% needs intensive management",
      "Screen for diabetic nephropathy, neuropathy (other microvascular complications likely)",
      "Patient education: Report any new floaters, flashes, curtain defect IMMEDIATELY",
    ],
    learningPoints: [
      "Sudden painless visual loss in a diabetic = PDR with VH or TRD until proven otherwise — OPHTHALMOLOGY EMERGENCY",
      "RAPD (Relative Afferent Pupillary Defect): Swinging flashlight test — indicates optic nerve or extensive retinal disease on that side",
      "Proliferative Diabetic Retinopathy: New vessel formation (NVD = new vessels at disc; NVE = elsewhere) — fragile vessels rupture causing vitreous haemorrhage",
      "All T2DM patients need annual fundoscopy from diagnosis — all T1DM from 5 years after diagnosis",
      "Anti-VEGF is transforming diabetic eye disease — both as primary treatment for DMO and adjunct in PDR surgery",
    ],
    tags: ["diabetic retinopathy", "vitreous haemorrhage", "PDR", "visual loss", "ophthalmology", "emergency"],
  },
];

const difficultyColors: Record<string, { bg: string; color: string }> = {
  Intern: { bg: "rgba(16,185,129,0.1)", color: "#059669" },
  Resident: { bg: "rgba(245,158,11,0.1)", color: "#D97706" },
  Consultant: { bg: "rgba(239,68,68,0.1)", color: "#DC2626" },
};

function CaseCard({ c }: { c: ClinicalCase }) {
  const [diagnosisRevealed, setDiagnosisRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: "rgba(60,60,67,0.08)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${difficultyColors[c.difficulty].bg}`, color: difficultyColors[c.difficulty].color }}>{c.difficulty}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{c.specialty}</span>
              <span className="text-xs font-mono" style={{ color: "#AEAEB2" }}>Case #{c.id.toString().padStart(3, "0")}</span>
            </div>
            <h3 className="text-base font-bold leading-snug" style={{ color: "#1C1C1E" }}>{c.title}</h3>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-xl transition-all hover:bg-black/5 shrink-0">
            {expanded ? <ChevronUp className="w-5 h-5" style={{ color: "#636366" }} /> : <ChevronDown className="w-5 h-5" style={{ color: "#636366" }} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {c.tags.slice(0, 4).map(t => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F5F3EE", color: "#636366" }}>#{t}</span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Chief Complaint */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#007AFF" }}>
              <AlertCircle className="w-3.5 h-3.5" />Chief Complaint
            </h4>
            <p className="text-sm font-medium" style={{ color: "#1C1C1E" }}>{c.chiefComplaint}</p>
          </div>

          {/* History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#636366" }}>
              <ClipboardList className="w-3.5 h-3.5" />History
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: "#636366" }}>{c.history}</p>
          </div>

          {/* Examination */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#636366" }}>
              <Stethoscope className="w-3.5 h-3.5" />Examination
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: "#636366" }}>{c.examination}</p>
          </div>

          {/* Investigations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#636366" }}>
              <FlaskConical className="w-3.5 h-3.5" />Investigations
            </h4>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(60,60,67,0.1)" }}>
              {c.investigations.map((inv, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : ""}`} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F9F9FB", borderBottom: i < c.investigations.length - 1 ? "1px solid rgba(60,60,67,0.06)" : "" }}>
                  <span className="font-medium shrink-0" style={{ color: "#1C1C1E", width: 200 }}>{inv.name}</span>
                  <span className={`flex-1 font-mono text-xs ${inv.abnormal ? "font-bold" : ""}`} style={{ color: inv.abnormal ? "#EF4444" : "#636366" }}>{inv.value}</span>
                  {inv.normal && <span className="text-xs shrink-0" style={{ color: "#AEAEB2" }}>Normal: {inv.normal}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosis — Hidden */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#636366" }}>
              <Eye className="w-3.5 h-3.5" />Diagnosis
            </h4>
            {!diagnosisRevealed ? (
              <button onClick={() => setDiagnosisRevealed(true)} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: "rgba(0,122,255,0.08)", border: "2px dashed rgba(0,122,255,0.3)", color: "#007AFF" }}>
                <EyeOff className="w-4 h-4" />
                <span className="text-sm font-semibold">Tap to reveal diagnosis</span>
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: "rgba(0,194,168,0.08)", border: "1px solid rgba(0,194,168,0.2)" }}>
                <p className="text-sm font-bold" style={{ color: "#00A893" }}>{c.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Management */}
          {diagnosisRevealed && (
            <>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#636366" }}>
                  <CheckCircle className="w-3.5 h-3.5" />Management
                </h4>
                <ol className="space-y-2">
                  {c.management.map((m, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#636366" }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>{i + 1}</span>
                      {m}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl p-4" style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)" }}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#D97706" }}>
                  <Lightbulb className="w-3.5 h-3.5" />Learning Points
                </h4>
                <ul className="space-y-1.5">
                  {c.learningPoints.map((lp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#636366" }}>
                      <span className="text-[#F59E0B] shrink-0 mt-0.5">★</span>{lp}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <a href="/ai-assistant" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "#007AFF", color: "#FFFFFF" }}>
            <Sparkles className="w-4 h-4" />Discuss this case with Cadus AI
          </a>
        </div>
      )}
    </div>
  );
}

const specialties = ["All Specialties", ...Array.from(new Set(CASES.map(c => c.specialty))).sort()];
const difficulties = ["All Levels", "Intern", "Resident", "Consultant"];

export default function ClinicalCases() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [difficulty, setDifficulty] = useState("All Levels");

  const filtered = useMemo(() =>
    CASES.filter(c =>
      (specialty === "All Specialties" || c.specialty === specialty) &&
      (difficulty === "All Levels" || c.difficulty === difficulty) &&
      (search === "" || c.title.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.includes(search.toLowerCase())))
    ), [search, specialty, difficulty]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Case Library"
        title="Clinical Cases"
        subtitle="Real-world anonymised cases with diagnosis reveal, management steps and teaching points"
        icon={<Stethoscope className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases or tags…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E" }} />
          </div>
          <select className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E" }} value={specialty} onChange={e => setSpecialty(e.target.value)}>
            {specialties.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-1.5">
            {difficulties.map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                style={{ background: difficulty === d ? "#007AFF" : "#FFFFFF", color: difficulty === d ? "#FFFFFF" : "#636366", border: difficulty === d ? "1px solid #007AFF" : "1px solid rgba(60,60,67,0.15)" }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm mb-4" style={{ color: "#636366" }}>
          Showing <strong style={{ color: "#1C1C1E" }}>{filtered.length}</strong> of {CASES.length} cases
        </p>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
              <p className="text-sm font-semibold" style={{ color: "#636366" }}>No cases found</p>
            </div>
          ) : (
            filtered.map(c => <CaseCard key={c.id} c={c} />)
          )}
        </div>
      </div>
    </div>
  );
}
