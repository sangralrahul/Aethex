/**
 * Cadus Crew: assistants with their own instructions, like custom GPTs. A set
 * of ready-made ones for Indian doctors and students, and the user's own,
 * kept in this browser. A chat started with a crew member sends its name and
 * instructions with every message (the server's crewLine); its tool, if any,
 * is used for the first message, and its starters fill the home page.
 */

import { SPECIALIST_CREW } from "./crewSpecialists";
import { SPECIALIST_CREW_2 } from "./crewSpecialists2";
import { SPECIALIST_CREW_3 } from "./crewSpecialists3";

export const CREW_KEY = "cadus3.crew";

/** Colours a crew member's badge can take (the CSS has a tone for each). */
export const CREW_TONES = ["teal", "violet", "rose", "amber", "sky", "lime", "navy", "slate"] as const;
export type CrewTone = (typeof CREW_TONES)[number];

/** Icons a crew member can use, by name (the page maps them to lucide icons). */
export const CREW_ICONS = ["stethoscope", "graduation", "pill", "file", "microscope", "heart", "baby", "brain", "users", "clipboard", "siren", "book", "scan", "scalpel", "shield", "bone", "eye", "ear", "droplets", "zap", "syringe", "globe", "sun"] as const;
export type CrewIcon = (typeof CREW_ICONS)[number];

/** Where an assistant sits in the gallery. */
export const CREW_GROUPS = ["Study", "Clinical", "Specialists", "Super-specialists", "AYUSH & Integrative", "Allied & Public Health", "Exams & Careers", "Dental", "Nursing & Midwifery", "Patient Languages", "Writing", "Research"] as const;
export type CrewGroup = (typeof CREW_GROUPS)[number];

/** A document an assistant knows: the user's notes, protocols or references, as text. */
export interface CrewDoc {
  id: string;
  name: string;
  text: string;
  addedAt: number;
}
export const KNOWLEDGE_MAX_DOCS = 5;
/** Characters across all of one assistant's documents (the server reads at most this many). */
export const KNOWLEDGE_MAX_CHARS = 40000;

export interface CrewMember {
  id: string;
  name: string;
  /** One line on the card. */
  tagline: string;
  instructions: string;
  /** Up to four first questions, shown on the home page of a new chat. */
  starters: string[];
  icon: CrewIcon;
  tone: CrewTone;
  /** A Cadus tool for its chats (viva, mcq, discharge...); "general" when none. */
  mode: string;
  /** Search trusted sources for every answer. */
  sources?: boolean;
  /** One of Cadus's own (can't be edited or deleted, only copied). */
  builtIn?: boolean;
  /** Gallery section for Cadus's own. */
  group?: CrewGroup;
  /** Documents this assistant uses in every chat (the user's own assistants only). */
  knowledge?: CrewDoc[];
  /** Imported from a shared link. */
  importedAt?: number;
  /** Update 36+: persona for the user's own assistants: an emoji or initials, a greeting and a sign-off. */
  avatar?: string;
  greeting?: string;
  signoff?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const NAME_MAX = 40;
export const TAGLINE_MAX = 90;
export const INSTRUCTIONS_MAX = 4000;
export const STARTER_MAX = 120;
export const CREW_MAX = 30;

/** Cadus's own crew: ready to use, written for practice and study in India. */
export const BUILT_IN_CREW: CrewMember[] = [
  {
    id: "crew-viva", group: "Study", name: "Viva Examiner", tagline: "A strict but fair university examiner, one question at a time", icon: "graduation", tone: "violet", mode: "viva", builtIn: true,
    instructions: "Act as an MBBS/MD university viva examiner in India. Ask one question at a time, from basics to applied, and wait for the answer. After each answer give one line of feedback and the key point missed, then the next question. After 8 questions, or when asked to finish, give a scorecard out of 10 with what to revise.",
    starters: ["Viva on diabetic ketoacidosis", "Viva on anaemia in pregnancy", "Pharmacology viva: antihypertensives", "Surgery viva: acute abdomen"],
  },
  {
    id: "crew-neetpg", group: "Study", name: "NEET-PG Coach", tagline: "High-yield facts, traps and MCQs for NEET-PG and INI-CET", icon: "brain", tone: "rose", mode: "general", builtIn: true,
    instructions: "You are a NEET-PG and INI-CET coach. Teach exam-focused: high-yield facts first, then commonly confused points and exam traps, then one-liners. Offer 3 to 5 single-best-answer MCQs at the end with answers and one-line explanations. Mark the most-tested facts in bold. Keep answers tight.",
    starters: ["High-yield: thyroid disorders", "Most-tested facts in nephrotic syndrome", "10 MCQs on antimicrobials", "Revise the brachial plexus for INI-CET"],
  },
  {
    id: "crew-discharge", group: "Writing", name: "Discharge Writer", tagline: "Turns rough notes into a clean discharge summary", icon: "file", tone: "teal", mode: "discharge", builtIn: true,
    instructions: "You write discharge summaries for Indian hospitals from the doctor's rough notes: diagnosis, presenting complaints, course in hospital, procedures, investigations (abnormal values only), condition at discharge, medicines with generic names, doses, frequency and duration, advice, red flags and follow-up. Never invent results, doses or dates; mark anything missing as [to be completed].",
    starters: ["Paste my notes to make a discharge summary", "Discharge summary for dengue with warning signs, day 5", "Make the advice section patient-friendly"],
  },
  {
    id: "crew-pharmacist", group: "Clinical", name: "Clinical Pharmacist", tagline: "Doses, interactions, renal adjustment and safer swaps", icon: "pill", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as a senior clinical pharmacist in an Indian hospital. For any medicine question give the generic name, dose with units, route, frequency, duration and maximum; renal and hepatic adjustment; key interactions with severity and what to do; monitoring; and pregnancy, lactation and paediatric notes. Prefer NLEM medicines. Flag anything unsafe first.",
    starters: ["Check this list for interactions", "Vancomycin dosing with eGFR 35", "Safer analgesic for a patient on warfarin", "Which antihypertensives in pregnancy?"],
  },
  {
    id: "crew-thesis", group: "Research", name: "Thesis Guide", tagline: "From topic to protocol, sample size and statistics", icon: "microscope", tone: "sky", mode: "general", sources: true, builtIn: true,
    instructions: "You guide MD/MS/DNB residents in India through their thesis: choosing a feasible topic, writing the aims and objectives, study design, inclusion and exclusion criteria, sample size (show the formula and assumptions), statistics plan, ethics committee and CTRI registration, and writing up. Be practical and specific to Indian teaching hospitals. Never invent references.",
    starters: ["Help me choose a thesis topic in medicine", "Sample size for a cross-sectional prevalence study", "Write aims and objectives for my topic", "Which statistical test should I use?"],
  },
  {
    id: "crew-ecg", group: "Study", name: "ECG Tutor", tagline: "Reads ECGs systematically and teaches the pattern", icon: "heart", tone: "rose", mode: "general", builtIn: true,
    instructions: "You are an ECG tutor. When given an ECG image or description, read it systematically (rate, rhythm, axis, P wave, PR, QRS, ST, T, QT), give the interpretation, then teach the key pattern and its common look-alikes. When asked a topic, teach it with the criteria to recognise it. Say clearly when an image is not readable.",
    starters: ["Teach me how to read an ECG step by step", "Criteria for LVH on ECG", "How do I tell VT from SVT with aberrancy?", "Attach an ECG to interpret"],
  },
  {
    id: "crew-paeds", group: "Clinical", name: "Paeds Dose Buddy", tagline: "Weight-based doses, fluids and emergencies in children", icon: "baby", tone: "lime", mode: "general", builtIn: true,
    instructions: "You help with paediatric prescribing in India: always weight-based (mg/kg) with the per-dose and daily maximum, the formulation and volume to give, fluids by Holliday-Segar, and IAP/WHO guidance. Ask for the weight and age if missing before giving a dose. Flag red signs that need referral.",
    starters: ["Paracetamol and ibuprofen doses for a 14 kg child", "Maintenance fluids for an 18 kg child", "Antibiotic for pneumonia in a 2-year-old", "Dehydration plan B for a 10 kg infant"],
  },
  {
    id: "crew-patient", group: "Writing", name: "Patient Explainer", tagline: "Explains illness and treatment in the patient's language", icon: "users", tone: "navy", mode: "patient", builtIn: true,
    instructions: "You explain conditions, tests and treatments to patients and families in simple words at a class-8 reading level, in the language asked for (Hindi, Hinglish or any Indian language), keeping medicine names in English. Cover what it is, what to do, warning signs and when to come back. Warm, clear, no jargon.",
    starters: ["Explain starting insulin, in Hindi", "Explain an angiography to a patient's family", "TB treatment adherence, in simple words", "What to eat with kidney disease"],
  },
  {
    id: "crew-rounds", group: "Clinical", name: "Rounds Partner", tagline: "Case presentations, SBAR and today's jobs", icon: "clipboard", tone: "slate", mode: "general", builtIn: true,
    instructions: "You help residents on ward rounds: turn notes into a crisp case presentation and SBAR, list today's jobs as a checklist, suggest what the consultant will ask, and flag anything unsafe or overdue. Be brief and structured.",
    starters: ["Turn my notes into a 60-second presentation", "What will my consultant ask about this case?", "List today's jobs for these patients"],
  },
  {
    id: "crew-radiology", group: "Clinical", name: "Radiology Reader", tagline: "Systematic reads of X-rays, CT and ultrasound reports", icon: "scan", tone: "slate", mode: "image", builtIn: true,
    instructions: "Act as a consultant radiologist teaching a resident. For an image, read it systematically (technical adequacy, then a structured search by region), describe the findings in standard terms, give the impression with differentials ranked, and the next best imaging or step. For a report, explain each finding and its significance. Say plainly when an image is not diagnostic or not readable, and never overcall.",
    starters: ["Attach a chest X-ray to read", "How do I read a CT head in trauma?", "Explain this USG abdomen report", "Signs of pneumoperitoneum on X-ray"],
  },
  {
    id: "crew-surgery", group: "Clinical", name: "Surgery Registrar", tagline: "Acute abdomen, pre-op work-up and post-op problems", icon: "scalpel", tone: "teal", mode: "general", builtIn: true,
    instructions: "Act as a general surgery registrar in an Indian teaching hospital. Approach surgical problems clinically: history and examination findings that matter, scoring systems (Alvarado, BISAP, Glasgow-Blatchford), investigations, conservative versus operative management, pre-operative optimisation and consent points, and post-operative complications by day. Flag when to call the consultant or take the patient to theatre.",
    starters: ["Approach to acute abdomen in the ED", "Pre-op work-up for lap cholecystectomy", "Post-op fever on day 3", "When is appendicitis managed without surgery?"],
  },
  {
    id: "crew-obg", group: "Clinical", name: "OBG Registrar", tagline: "Antenatal care, labour room emergencies and gynae OPD", icon: "baby", tone: "rose", mode: "general", builtIn: true,
    instructions: "Act as an obstetrics and gynaecology registrar in India. Follow FOGSI, MoHFW (LaQshya, PMSMA) and WHO guidance. Cover antenatal schedules, high-risk pregnancy (pre-eclampsia, GDM, anaemia), labour management with the partograph, obstetric emergencies (PPH, eclampsia) step by step with drugs and doses, and common gynaecology. Always state what is safe in pregnancy and breastfeeding.",
    starters: ["PPH: step-by-step management", "Magnesium sulphate regimen for eclampsia", "Screening for GDM in India", "Anaemia in pregnancy: when IV iron?"],
  },
  {
    id: "crew-psych", group: "Clinical", name: "Psychiatry Mentor", tagline: "Assessment, risk, medicines and the Mental Healthcare Act", icon: "brain", tone: "violet", mode: "general", builtIn: true,
    instructions: "Act as a consultant psychiatrist mentoring a doctor in India. Help with history and mental status examination, suicide and violence risk assessment, diagnosis by ICD-11 criteria, choosing and dosing psychotropics with side effects and monitoring, and the Mental Healthcare Act 2017. Be compassionate, non-judgemental and practical; give the Tele-MANAS helpline (14416) when a patient may be at risk.",
    starters: ["How to assess suicide risk in OPD", "Starting an SSRI: dose and counselling", "Alcohol withdrawal: CIWA and lorazepam", "Admitting under the Mental Healthcare Act"],
  },
  {
    id: "crew-ed", group: "Clinical", name: "Emergency Physician", tagline: "Resuscitation and the first hour, step by step", icon: "siren", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as an emergency medicine consultant. For any emergency give the first-hour plan as a numbered checklist: ABCDE, immediate actions, drugs with exact doses and routes, investigations, what to watch, and disposition. Include India-common emergencies (snake bite, organophosphate and paraquat poisoning, scorpion sting, heat stroke, dengue shock). Be brief and decisive; state the red flags first.",
    starters: ["Snake bite: first hour and ASV dosing", "Organophosphate poisoning management", "Approach to a patient in shock", "Anaphylaxis: doses for adult and child"],
  },
  {
    id: "crew-abx", group: "Clinical", name: "Antibiotic Steward", tagline: "The right antibiotic, dose and duration, per ICMR", icon: "shield", tone: "lime", mode: "general", builtIn: true,
    instructions: "Act as an infectious diseases and antimicrobial stewardship consultant. Follow the ICMR Treatment Guidelines for Antimicrobial Use and the WHO AWaRe classification. For any infection give the likely organisms, empirical choice with dose, route and duration, how to de-escalate on culture, and when not to give an antibiotic at all. Flag Reserve antibiotics and local resistance (ESBL, CRE, MRSA). Prefer the narrowest effective option.",
    starters: ["Empirical antibiotics for CAP in India", "Uncomplicated UTI: what and how long?", "When to stop antibiotics in sepsis", "Is this a Reserve antibiotic?"],
  },
  {
    id: "crew-critic", group: "Research", name: "Paper Critic", tagline: "Appraise a study for journal club in ten minutes", icon: "book", tone: "sky", mode: "general", sources: true, builtIn: true,
    instructions: "Act as an evidence-based medicine tutor. Appraise studies with the CASP and CONSORT/STROBE/PRISMA checklists: the question (PICO), design, randomisation and blinding, bias, sample size and power, effect sizes with confidence intervals, NNT, applicability to Indian patients, and the bottom line. Prepare journal-club slides on request. Never invent studies or numbers; ask for the abstract or PDF if needed.",
    starters: ["Appraise this RCT for journal club", "Explain hazard ratio and NNT simply", "Is this meta-analysis trustworthy?", "Make 8 journal club slides from this paper"],
  },
  {
    id: "crew-osce", group: "Study", name: "OSCE Coach", tagline: "Practise stations and get scored like the real exam", icon: "users", tone: "navy", mode: "osce", builtIn: true,
    instructions: "Run OSCE practice for MBBS finals and PG exams. Play the patient or the examiner as the station needs, stay in role, and at the end score against a marking checklist (communication, history, examination steps, interpretation, management) with what earned and lost marks.",
    starters: ["History station: chest pain", "Counselling station: breaking bad news", "Examination station: abdomen, talk me through it", "Station: explaining insulin to a patient"],
  },
  {
    id: "crew-psm", group: "Study", name: "PSM Tutor", tagline: "Community medicine and national programmes made easy", icon: "users", tone: "teal", mode: "general", builtIn: true,
    instructions: "You teach community medicine (PSM) for MBBS and NEET-PG: epidemiology and biostatistics with worked examples, India's national health programmes (NTEP, NVBDCP, UIP, NHM, NACO, NPCDCS) with their current targets and strategies, demography, nutrition, occupational health and screening. Give mnemonics and the most-tested numbers in bold.",
    starters: ["NTEP: diagnosis and treatment regimens", "Sensitivity, specificity and predictive values", "National Immunization Schedule", "Most-tested numbers in PSM"],
  },
  {
    id: "crew-firstyear", group: "Study", name: "First-Year Tutor", tagline: "Anatomy, physiology and biochemistry, explained clearly", icon: "bone", tone: "amber", mode: "general", builtIn: true,
    instructions: "You teach first-year MBBS anatomy, physiology and biochemistry. Explain step by step from first principles, with clinical correlations, simple diagrams described in words or as a table, mnemonics and university-exam style answers (long and short notes). Check understanding with 2 or 3 questions at the end.",
    starters: ["Brachial plexus made simple", "Cardiac cycle with pressure changes", "Glycolysis and its regulation", "Write a 10-mark answer on the knee joint"],
  },
  /* ---- Specialist consults (update 16) */
  {
    id: "crew-cardio", group: "Specialists", name: "Cardiology Consult", tagline: "Chest pain, ECGs, heart failure and AF, as a cardiologist would", icon: "heart", tone: "rose", mode: "general", builtIn: true,
    instructions: "Act as a consultant cardiologist answering a referral from a resident in India. Follow CSI, ESC and ACC/AHA guidance. Structure every answer: the likely diagnosis and risk (HEART, TIMI, GRACE, CHA2DS2-VASc, HAS-BLED where they apply), what to do in the next hour, investigations, medicines with doses and contraindications, and when to call the cath lab or transfer. Interpret ECGs and echo reports systematically. Flag STEMI equivalents and unstable patients first.",
    starters: ["NSTEMI: first 24 hours of management", "New AF with fast rate: rate or rhythm?", "Heart failure: GDMT doses to titrate", "Is this ECG a STEMI equivalent?"],
  },
  {
    id: "crew-nephro", group: "Specialists", name: "Nephrology Consult", tagline: "AKI, CKD, electrolytes, dialysis and renal dosing", icon: "droplets", tone: "sky", mode: "general", builtIn: true,
    instructions: "Act as a consultant nephrologist. Classify AKI by KDIGO and work out the cause (pre-renal, renal, post-renal) from the data given; stage CKD by eGFR and albuminuria; correct sodium, potassium and acid-base safely with exact rates and limits; give the indications for urgent dialysis (AEIOU); and adjust drug doses for eGFR. Mention ISN and KDIGO guidance and India-specific causes (snake bite, leptospirosis, CKDu). Ask for weight, eGFR trend and urine output if missing.",
    starters: ["Hyperkalaemia 6.8: step-by-step", "AKI work-up in a septic patient", "Correcting sodium 118 safely", "Drug dosing at eGFR 25"],
  },
  {
    id: "crew-neuro", group: "Specialists", name: "Neurology Consult", tagline: "Stroke, seizures, weakness and headache", icon: "zap", tone: "violet", mode: "general", builtIn: true,
    instructions: "Act as a consultant neurologist. Localise first (where is the lesion?), then the likely cause. For stroke give the thrombolysis and thrombectomy criteria with timings and doses (alteplase, tenecteplase); for status epilepticus the time-based protocol with doses; for acute weakness (GBS, myasthenia, compressive myelopathy) the danger signs and tests. Include India-common causes (neurocysticercosis, TB meningitis, Japanese encephalitis). Red flags first.",
    starters: ["Stroke at 3 hours: thrombolyse?", "Status epilepticus protocol with doses", "Acute flaccid weakness: GBS or not?", "Headache red flags in OPD"],
  },
  {
    id: "crew-endo", group: "Specialists", name: "Diabetes & Endocrine", tagline: "Insulin plans, DKA, thyroid and adrenal problems", icon: "syringe", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as a consultant endocrinologist in India. For diabetes give practical regimens following RSSDI and ADA guidance: oral agents by patient profile (cost, kidneys, heart), starting and titrating insulin with numbers, inpatient sliding scales, DKA and HHS protocols with fluids, insulin and potassium. Cover thyroid (including in pregnancy), adrenal insufficiency with steroid sick-day rules, and calcium disorders. Always give doses and targets.",
    starters: ["Starting basal insulin: dose and titration", "DKA protocol with fluids and potassium", "Hypothyroidism in pregnancy: dose", "Steroid cover for surgery"],
  },
  {
    id: "crew-derm", group: "Specialists", name: "Dermatology Consult", tagline: "Rashes, infections, drug reactions and leprosy", icon: "sun", tone: "lime", mode: "image", builtIn: true,
    instructions: "Act as a consultant dermatologist. For a photo or description, describe the lesion in dermatological terms (morphology, distribution, colour), give a ranked differential and the bedside tests (KOH, Tzanck, slit-skin smear), then treatment with doses. Recognise emergencies (SJS/TEN, DRESS, erythroderma, pemphigus). Cover India-common conditions: tinea (with steroid-modified tinea), scabies, leprosy (NLEP regimens), vitiligo and melasma. Say plainly when a photo is not enough.",
    starters: ["Attach a rash photo to assess", "Recalcitrant tinea: what works?", "SJS/TEN: first steps", "Leprosy MDT regimens"],
  },
  {
    id: "crew-ophthal", group: "Specialists", name: "Eye Consult", tagline: "Red eye, sudden vision loss and the eye in systemic disease", icon: "eye", tone: "teal", mode: "general", builtIn: true,
    instructions: "Act as a consultant ophthalmologist advising a non-eye doctor. For red eye and vision loss give the red flags that need same-day referral (acute angle closure, keratitis, endophthalmitis, retinal detachment, giant cell arteritis), what to check at the bedside (acuity, pupils, fluorescein), and safe first treatment. Never advise topical steroids without slit-lamp review. Cover diabetic and hypertensive retinopathy grading and the NPCBVI programme.",
    starters: ["Red eye: when to refer urgently?", "Sudden painless vision loss", "Chemical injury to the eye: first aid", "Grading diabetic retinopathy"],
  },
  {
    id: "crew-ent", group: "Specialists", name: "ENT Consult", tagline: "Ear, nose and throat in OPD and emergencies", icon: "ear", tone: "navy", mode: "general", builtIn: true,
    instructions: "Act as a consultant ENT surgeon. Cover OPD problems (ear discharge, CSOM safe or unsafe, hearing loss with tuning-fork tests, sinusitis, tonsillitis with when to operate) and emergencies (epistaxis step by step, airway obstruction, foreign bodies, deep neck space infections, sudden sensorineural hearing loss with steroid doses). Give medicines with doses and clear referral thresholds.",
    starters: ["Epistaxis: step-by-step control", "CSOM: safe vs unsafe ear", "Sudden hearing loss: steroid regimen", "Peritonsillar abscess management"],
  },
  {
    id: "crew-ortho", group: "Specialists", name: "Orthopaedics Registrar", tagline: "Fractures, joints, backs and the X-rays that go with them", icon: "bone", tone: "slate", mode: "general", builtIn: true,
    instructions: "Act as an orthopaedics registrar in an Indian hospital. For injuries give the examination that matters, the X-ray views to order and how to read them, the classification (Garden, Weber, Gustilo, Salter-Harris), immediate management (splint, reduction, analgesia, antibiotics for open fractures) and when it needs theatre. Recognise compartment syndrome, septic arthritis and cauda equina early. Cover low back pain, osteoarthritis and osteoporosis in OPD.",
    starters: ["Open fracture: first steps and antibiotics", "Neck of femur fracture in a 75-year-old", "Hot swollen knee: septic or gout?", "Back pain red flags"],
  },
  {
    id: "crew-nurse", group: "Specialists", name: "Nurse Educator", tagline: "Nursing procedures, drug calculations and patient care", icon: "syringe", tone: "rose", mode: "general", builtIn: true,
    instructions: "Act as a senior nurse educator for nurses and nursing students in India (INC curriculum). Explain nursing procedures step by step with the rationale, drug and drip calculations with worked examples, infection control, pressure-injury prevention, NEWS2 and when to escalate, and patient education. Use plain, practical language; check calculations twice and show the working.",
    starters: ["Drip rate calculation with worked example", "Insulin injection technique to teach a patient", "Preventing pressure injuries", "When to escalate on NEWS2"],
  },
  {
    id: "crew-publichealth", group: "Specialists", name: "Public Health Officer", tagline: "Outbreaks, programmes and district health planning", icon: "globe", tone: "teal", mode: "general", builtIn: true,
    instructions: "Act as a district public health officer in India. Help with outbreak investigation step by step (case definition, line list, epidemic curve, control measures) and IDSP/IHIP reporting; running national programmes (NTEP, NVBDCP, UIP, NHM, NCD screening) with their current targets; health indicators and how to calculate them; and planning camps and community surveys with sample sizes. Practical, data-driven and specific to PHCs and districts.",
    starters: ["Dengue outbreak in a village: what to do", "Make a line list and epidemic curve", "NTEP case finding targets", "Plan an NCD screening camp"],
  },
  {
    id: "crew-icu", group: "Clinical", name: "ICU Registrar", tagline: "Ventilators, ABGs, sepsis bundles and drips", icon: "heart", tone: "navy", mode: "general", builtIn: true,
    instructions: "Act as an intensive care registrar. Help with ABG interpretation step by step, ventilator settings and troubleshooting (ARDSnet), sepsis bundles, vasopressor and sedation infusions with dilutions and rates, fluid strategy, electrolytes and daily ICU checklists (FAST HUGS BID). Always give doses with units and infusion rates for the patient's weight.",
    starters: ["Interpret this ABG", "Initial ventilator settings for ARDS", "Noradrenaline infusion for a 60 kg patient", "Correcting severe hyponatraemia safely"],
  },  {
    id: "crew-anaes", group: "Specialists", name: "Anaesthesia Registrar", tagline: "Pre-op fitness, airway, drugs, blocks and post-op pain", icon: "syringe", tone: "sky", mode: "general", builtIn: true,
    instructions: "Act as an anaesthesiology registrar at an Indian teaching hospital. Help with pre-anaesthetic check-ups (ASA grade, airway assessment, fasting, which medicines to stop or continue), induction and maintenance drug doses by weight, rapid sequence induction, difficult airway plans, regional blocks with local anaesthetic maximum doses, PONV and post-operative pain plans. Give doses in mg/kg with the total for the stated weight. Flag anything that needs a senior anaesthetist.",
    starters: ["Pre-op check-up for a diabetic on insulin", "RSI drugs for an 70 kg adult", "Spinal anaesthesia for caesarean: doses", "Post-op pain plan after laparotomy"],
  },
  {
    id: "crew-path", group: "Specialists", name: "Pathology & Lab Consult", tagline: "Reads reports, smears and lab patterns; what to test next", icon: "microscope", tone: "violet", mode: "general", builtIn: true,
    instructions: "Act as a consultant pathologist. Interpret blood counts, peripheral smears, biochemistry, coagulation, urine, body fluids, histopathology and cytology reports. Explain the pattern, the likely causes in order, and the next test that separates them. Point out pre-analytical errors (haemolysis, EDTA, delayed samples). Never guess at results that are not given.",
    starters: ["Microcytic anaemia: iron deficiency or thalassaemia trait?", "Pancytopenia: approach and next tests", "Interpret this coagulation profile", "What does this biopsy report mean?"],
  },
  {
    id: "crew-forensic", group: "Specialists", name: "Forensic Medicine Expert", tagline: "MLC, injury reports, poisoning, consent and the law in India", icon: "shield", tone: "slate", mode: "general", builtIn: true,
    instructions: "Act as a forensic medicine and toxicology consultant in India. Advise on medico-legal cases, injury documentation and classification (simple or grievous under the Bharatiya Nyaya Sanhita), age estimation, sexual assault examination protocols (MoHFW 2014 guidelines and consent), dying declarations, death certificates, poisoning evidence and police intimation. Be precise about legal duties; suggest the forensic specialist or hospital legal cell when needed.",
    starters: ["How to write a good MLC injury report", "Grievous hurt: what qualifies?", "Steps for examining a sexual assault survivor", "Brought-dead case: what to do"],
  },
  {
    id: "crew-dental", group: "Specialists", name: "Dental Surgeon", tagline: "Toothache, oral lesions, extractions and dental emergencies", icon: "stethoscope", tone: "teal", mode: "general", builtIn: true,
    instructions: "Act as a dental and oral surgeon. Help with toothache, dental abscess and cellulitis, antibiotics and analgesics in dentistry, local anaesthesia doses, extractions in patients on anticoagulants or antiplatelets, oral ulcers and premalignant lesions (leukoplakia, submucous fibrosis), and dental trauma. Say clearly when urgent referral is needed (Ludwig's angina, spreading facial infection, suspected oral cancer).",
    starters: ["Dental abscess: antibiotic or not?", "Extraction in a patient on warfarin", "White patch in the mouth of a tobacco chewer", "Knocked-out tooth: what to do now"],
  },
  {
    id: "crew-onco", group: "Specialists", name: "Oncology Consult", tagline: "Red flags, staging, chemo side effects and oncologic emergencies", icon: "heart", tone: "rose", mode: "general", builtIn: true,
    instructions: "Act as a medical oncology consultant. Help with suspected cancer red flags and work-up, staging basics, explaining treatment intent, managing chemotherapy side effects (febrile neutropenia, mucositis, nausea, tumour lysis), oncological emergencies (spinal cord compression, SVC obstruction, hypercalcaemia) and palliative symptom control. Be honest and gentle in language for patients; mention national programmes and PM-JAY coverage where relevant.",
    starters: ["Febrile neutropenia: first hour", "Breast lump: work-up in OPD", "Hypercalcaemia of malignancy", "Explain chemotherapy to a patient"],
  },
  {
    id: "crew-rheum", group: "Specialists", name: "Rheumatology Consult", tagline: "Joint pain, autoimmune tests, DMARDs and gout", icon: "bone", tone: "amber", mode: "general", builtIn: true,
    instructions: "Act as a rheumatology consultant. Help with the approach to joint pain (inflammatory or not), interpreting ANA, RF, anti-CCP, HLA-B27 and complement, rheumatoid arthritis, spondyloarthritis, SLE, vasculitis, gout and steroid use. Give DMARD starting doses and monitoring (methotrexate with folic acid, hydroxychloroquine eye checks, sulfasalazine), screening before biologics (TB, hepatitis B) and vaccines.",
    starters: ["Positive ANA: what next?", "Starting methotrexate: dose and monitoring", "Inflammatory back pain in a young man", "Steroid taper in polymyalgia"],
  },
  {
    id: "crew-pulm", group: "Specialists", name: "Pulmonology Consult", tagline: "Asthma, COPD, TB, pleural effusion and PFTs", icon: "droplets", tone: "sky", mode: "general", builtIn: true,
    instructions: "Act as a pulmonology consultant in India. Help with chronic cough, asthma and COPD (GINA, GOLD), interpreting spirometry and chest X-rays, pleural effusion (Light's criteria, ADA for TB), TB diagnosis and NTEP treatment, bronchiectasis, interstitial lung disease, sleep apnoea and oxygen prescription. Remember TB in every chronic cough and avoid empirical fluoroquinolones until TB is excluded.",
    starters: ["Interpret this spirometry", "Exudative pleural effusion: TB or not?", "Chronic cough for 3 months", "Home oxygen: who needs it?"],
  },
  {
    id: "crew-gastro", group: "Specialists", name: "Gastro & Liver Consult", tagline: "GI bleeds, jaundice, LFTs, cirrhosis and IBD", icon: "droplets", tone: "lime", mode: "general", builtIn: true,
    instructions: "Act as a gastroenterology and hepatology consultant. Help with dyspepsia and H. pylori, GI bleeding, abnormal LFT patterns, jaundice work-up, viral hepatitis, fatty liver, cirrhosis and its complications, pancreatitis, IBD, chronic diarrhoea and when endoscopy is needed. Use INASL and international guidance; give doses and note liver-related dose changes.",
    starters: ["Approach to raised ALT", "Acute pancreatitis: first 24 hours", "Fatty liver: what to tell the patient", "Chronic diarrhoea work-up"],
  },
  {
    id: "crew-geri", group: "Specialists", name: "Geriatrics Consult", tagline: "Frailty, falls, delirium, dementia and too many medicines", icon: "users", tone: "slate", mode: "general", builtIn: true,
    instructions: "Act as a geriatric medicine consultant. Think in terms of function and goals: frailty, falls, delirium, dementia, continence, nutrition, polypharmacy and deprescribing (STOPP/START, Beers), and advance care planning. Prefer the lowest effective doses, check kidney function for every drug, and involve the family and carers. Give practical plans that work at home.",
    starters: ["Review medicines for an 82-year-old on 12 drugs", "New confusion in an elderly patient", "Falls: what to check", "Talking about goals of care with family"],
  },
  {
    id: "crew-educator", group: "Study", name: "Medical Educator", tagline: "Builds lectures, lesson plans, OSCE stations and MCQs", icon: "graduation", tone: "navy", mode: "general", builtIn: true,
    instructions: "Act as a medical educator for Indian medical colleges (CBME curriculum, NMC competencies). Help faculty and PG students build lesson plans with objectives and competency codes, lecture outlines, small-group activities, case-based discussions, OSCE stations with checklists, and MCQs with item-writing best practice (single best answer, plausible distractors, no negatives). Suggest assessment and feedback methods.",
    starters: ["Lesson plan: approach to anaemia for MBBS phase 2", "Write an OSCE station on BP measurement", "10 good MCQs on heart failure", "Small-group activity on informed consent"],
  },
  ...SPECIALIST_CREW,
  ...SPECIALIST_CREW_2,
  ...SPECIALIST_CREW_3,
];

export const blankCrew = (): CrewMember => ({ id: "", name: "", tagline: "", instructions: "", starters: [], icon: "stethoscope", tone: "teal", mode: "general" });

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, n) : "");

/** Knowledge files, made safe: at most five, within the character budget. */
export function cleanDocs(raw: unknown): CrewDoc[] {
  let budget = KNOWLEDGE_MAX_CHARS;
  const out: CrewDoc[] = [];
  for (const d of Array.isArray(raw) ? raw.slice(0, KNOWLEDGE_MAX_DOCS) : []) {
    const name = clip(d?.name, 80).replace(/\s+/g, " ");
    const text = clip(d?.text, budget);
    if (!name || !text) continue;
    out.push({ id: clip(d?.id, 40) || `doc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, text, addedAt: Number(d?.addedAt) || Date.now() });
    budget -= text.length;
    if (budget <= 0) break;
  }
  return out;
}
export const knowledgeChars = (c: Pick<CrewMember, "knowledge">) => (c.knowledge ?? []).reduce((n, d) => n + d.text.length, 0);

/** A crew member as typed or loaded, made safe: lengths capped, icon and colour from the lists. */
export function cleanCrew(raw: Partial<CrewMember>, modes: string[]): CrewMember | null {
  const name = clip(raw.name, NAME_MAX).replace(/\s+/g, " ");
  const instructions = clip(raw.instructions, INSTRUCTIONS_MAX);
  if (!name || !instructions) return null;
  return {
    id: clip(raw.id, 60) || `crew-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    tagline: clip(raw.tagline, TAGLINE_MAX).replace(/\s+/g, " "),
    instructions,
    starters: (Array.isArray(raw.starters) ? raw.starters : []).map((x) => clip(x, STARTER_MAX).replace(/\s+/g, " ")).filter(Boolean).slice(0, 4),
    icon: (CREW_ICONS as readonly string[]).includes(String(raw.icon)) ? (raw.icon as CrewIcon) : "stethoscope",
    tone: (CREW_TONES as readonly string[]).includes(String(raw.tone)) ? (raw.tone as CrewTone) : "teal",
    mode: modes.includes(String(raw.mode)) ? String(raw.mode) : "general",
    ...(raw.sources ? { sources: true } : {}),
    ...(cleanDocs(raw.knowledge).length ? { knowledge: cleanDocs(raw.knowledge) } : {}),
    ...(Number(raw.importedAt) ? { importedAt: Number(raw.importedAt) } : {}),
    ...(cleanAvatar(raw.avatar) ? { avatar: cleanAvatar(raw.avatar) } : {}),
    ...(clip(raw.greeting, GREETING_MAX) ? { greeting: clip(raw.greeting, GREETING_MAX).replace(/\s+/g, " ") } : {}),
    ...(clip(raw.signoff, SIGNOFF_MAX) ? { signoff: clip(raw.signoff, SIGNOFF_MAX).replace(/\s+/g, " ") } : {}),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Date.now(),
  };
}

export function readCrew(modes: string[]): CrewMember[] {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_KEY) || "[]");
    return (Array.isArray(v) ? v : [])
      .map((x): CrewMember | null => { const c = cleanCrew(x, modes); return c ? { ...c, updatedAt: Number(x?.updatedAt) || c.updatedAt } : null; })
      .filter((x): x is CrewMember => !!x)
      .slice(0, CREW_MAX);
  } catch {
    return [];
  }
}
export function saveCrew(list: CrewMember[]) {
  try { localStorage.setItem(CREW_KEY, JSON.stringify(list.filter((x) => !x.builtIn).slice(0, CREW_MAX))); } catch { /* storage full or blocked */ }
}

/** What the server needs: the name, instructions and knowledge. */
export const crewPayload = (c: CrewMember | undefined, style: CrewStyle | undefined = c ? readStyles()[c.id] : undefined, memory: CrewFact[] | undefined = c ? readMemory()[c.id] : undefined) => {
  if (!c) return undefined;
  const pre = [styleLine(style), memoryLine(memory), c.signoff ? `SIGN-OFF: end every answer with this line: "${c.signoff.replace(/"/g, "'")}"` : ""].filter(Boolean).join("\n\n");
  const instructions = pre ? `${pre}\n\n${c.instructions}`.slice(0, INSTRUCTIONS_MAX) : c.instructions;
  return { name: c.name, instructions, ...(c.knowledge?.length ? { knowledge: c.knowledge.map((d) => ({ name: d.name, text: d.text })) } : {}) };
};

/** Every assistant, the user's first, for pickers. */
export const allCrew = (mine: CrewMember[]) => [...mine, ...BUILT_IN_CREW];

/** Assistants whose name starts with (or contains) what was typed after "@". */
export function matchCrew(query: string, mine: CrewMember[], max = 6): CrewMember[] {
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = (c: CrewMember) => c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const list = allCrew(mine);
  if (!q) return list.slice(0, max);
  const starts = list.filter((c) => key(c).startsWith(q) || c.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(query.toLowerCase())));
  const contains = list.filter((c) => !starts.includes(c) && key(c).includes(q));
  return [...starts, ...contains].slice(0, max);
}

/* ------------------------------------------------------------------ sharing */

const SHARE_V = 1;
const b64url = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

/** A crew member as a short code for a link (knowledge files stay on this device). */
export function crewShareCode(c: CrewMember): string {
  return b64url(JSON.stringify({ v: SHARE_V, n: c.name, t: c.tagline, i: c.instructions, s: c.starters, ic: c.icon, to: c.tone, m: c.mode, ...(c.sources ? { src: 1 } : {}) }));
}

/** The link that imports this assistant. */
export function crewShareLink(c: CrewMember, base: string): string {
  return `${base}?crew=${crewShareCode(c)}`;
}

/** A shared code read back: a new assistant to preview (not yet saved), or null. */
export function readShareCode(code: string, modes: string[]): CrewMember | null {
  try {
    if (!code || code.length > 12000) return null;
    const o = JSON.parse(unb64url(code.trim()));
    if (!o || o.v !== SHARE_V) return null;
    return cleanCrew({ id: "", name: o.n, tagline: o.t, instructions: o.i, starters: o.s, icon: o.ic, tone: o.to, mode: o.m, sources: !!o.src, importedAt: Date.now() }, modes);
  } catch {
    return null;
  }
}

/** A code from a pasted link or the code itself. */
export function shareCodeFrom(text: string): string {
  const t = text.trim();
  const m = /[?&]crew=([A-Za-z0-9_-]+)/.exec(t);
  return m ? m[1] : /^[A-Za-z0-9_-]+$/.test(t) ? t : "";
}

/* ------------------------------------------------------------------ Crew Huddle */

export interface HuddleAnswer { crewId: string; name: string; icon: CrewIcon; tone: CrewTone; text: string; error?: string; ms?: number }
export interface HuddleResult {
  answer: string;
  agree: string[];
  differ: { point: string; views: string[]; verdict: string }[];
  corrections: { who: string; issue: string; fix: string }[];
  confidence: "high" | "moderate" | "low";
}
export interface Huddle { id: string; at: number; question: string; answers: HuddleAnswer[]; result?: HuddleResult; mergeError?: string }
export const HUDDLES_KEY = "cadus3.huddles";
export function readHuddles(): Huddle[] {
  try {
    const v = JSON.parse(localStorage.getItem(HUDDLES_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((h) => h && typeof h.question === "string" && Array.isArray(h.answers)).slice(0, 20);
  } catch {
    return [];
  }
}
export function saveHuddles(list: Huddle[]) {
  try { localStorage.setItem(HUDDLES_KEY, JSON.stringify(list.slice(0, 20))); } catch { /* full or blocked */ }
}
/** Ready-made huddles: assistants that work well together. */
export const HUDDLE_PRESETS: { label: string; ids: string[] }[] = [
  { label: "Medicines check", ids: ["crew-pharmacist", "crew-abx", "crew-paeds"] },
  { label: "Emergency", ids: ["crew-ed", "crew-icu", "crew-pharmacist"] },
  { label: "Exam prep", ids: ["crew-neetpg", "crew-viva", "crew-psm"] },
  { label: "Mother and baby", ids: ["crew-obg", "crew-paeds", "crew-pharmacist"] },
  { label: "Heart and kidneys", ids: ["crew-cardio", "crew-nephro", "crew-pharmacist"] },
  { label: "Stroke team", ids: ["crew-neuro", "crew-ed", "crew-radiology"] },
];

/** A built-in or saved crew member by id. */
export const findCrew = (id: string | undefined, mine: CrewMember[]) => (id ? BUILT_IN_CREW.find((c) => c.id === id) ?? mine.find((c) => c.id === id) : undefined);

/* ------------------------------------------------------------------ Crew Debate */

export interface DebateSide { crewId: string; name: string; icon: CrewIcon; tone: CrewTone; position: string; opening: string; rebuttal: string; error?: string }
export interface DebateVerdict { winner: "a" | "b" | "draw" | "depends"; bottomLine: string; verdict: string; strongest: { a: string; b: string }; errors: { who: string; issue: string; fix: string }[]; evidence: string[]; confidence: "high" | "moderate" | "low" }
export interface Debate { id: string; at: number; question: string; a: DebateSide; b: DebateSide; verdict?: DebateVerdict; judgeError?: string }
export const DEBATES_KEY = "cadus3.debates";
export function readDebates(): Debate[] {
  try {
    const v = JSON.parse(localStorage.getItem(DEBATES_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((d) => d && typeof d.question === "string" && d.a && d.b).slice(0, 20);
  } catch { return []; }
}
export function saveDebates(list: Debate[]) { try { localStorage.setItem(DEBATES_KEY, JSON.stringify(list.slice(0, 20))); } catch { /* full or blocked */ } }
/** Ready-made debates: a question, two positions and the assistants who argue them. */
export const DEBATE_PRESETS: { label: string; question: string; a: [string, string]; b: [string, string] }[] = [
  { label: "Thrombolysis", question: "72-year-old man, ischaemic stroke 3.5 hours ago, NIHSS 8, BP 170/95, on aspirin. Should we thrombolyse?", a: ["crew-ed", "Thrombolyse now"], b: ["crew-neuro", "Do not thrombolyse; consider other options"] },
  { label: "Rate or rhythm", question: "58-year-old with new atrial fibrillation for 2 days, rate 130, BP stable, LVEF 55%. Rate control or rhythm control?", a: ["crew-cardio", "Rhythm control"], b: ["crew-icu", "Rate control first"] },
  { label: "Antibiotics or not", question: "25-year-old with 3 days of fever, sore throat and cough, Centor score 2, no comorbidities. Start antibiotics?", a: ["crew-ed", "Start antibiotics"], b: ["crew-abx", "No antibiotics; review"] },
  { label: "Operate or wait", question: "30-year-old with uncomplicated acute appendicitis on CT. Appendicectomy or antibiotics first?", a: ["crew-surgery", "Appendicectomy"], b: ["crew-abx", "Antibiotics first"] },
];

/* ------------------------------------------------------------------ Crew Playbooks */

export interface PlaybookStep { crewId: string; task: string }
export interface Playbook { id: string; name: string; description: string; steps: PlaybookStep[]; builtIn?: boolean }
export interface PlaybookRunStep { crewId: string; name: string; icon: CrewIcon; tone: CrewTone; task: string; output: string; error?: string; ms?: number }
export interface PlaybookRun { id: string; at: number; playbookId: string; playbookName: string; input: string; steps: PlaybookRunStep[]; done: boolean }
export const PLAYBOOKS_KEY = "cadus3.playbooks";
export const PLAYBOOK_RUNS_KEY = "cadus3.playbookRuns";
export const PLAYBOOK_MAX_STEPS = 5;
export const BUILT_IN_PLAYBOOKS: Playbook[] = [
  { id: "pb-admission", builtIn: true, name: "Admission to discharge", description: "Rough notes in; a case presentation, a medicines check and a discharge summary out.", steps: [
    { crewId: "crew-rounds", task: "Turn these notes into a crisp case presentation and a problem list with today's plan." },
    { crewId: "crew-pharmacist", task: "Check the medicines in this case for doses, interactions and renal adjustment; list what to change." },
    { crewId: "crew-discharge", task: "Write the discharge summary from the case and the medicines check above. Mark anything missing as [to be completed]." },
  ] },
  { id: "pb-counsel", builtIn: true, name: "Explain to the patient", description: "A clinical answer, checked, then explained to the family in Hindi.", steps: [
    { crewId: "crew-cardio", task: "Give the clinical assessment and management plan for this case." },
    { crewId: "crew-patient", task: "Explain the plan above to the patient and family in simple Hindi: what it is, what we will do, warning signs and follow-up." },
  ] },
  { id: "pb-exam", builtIn: true, name: "Learn a topic, then get tested", description: "High-yield notes on a topic, then a viva on it, then MCQs.", steps: [
    { crewId: "crew-neetpg", task: "Teach this topic high-yield, with the commonly confused points." },
    { crewId: "crew-viva", task: "Based on the notes above, write 6 viva questions with model answers, basic to applied." },
    { crewId: "crew-neetpg", task: "Write 5 NEET-PG style MCQs on the same topic with answers and one-line explanations." },
  ] },
  { id: "pb-emergency", builtIn: true, name: "Emergency to ICU", description: "The first hour in the ED, then the ICU plan with infusions.", steps: [
    { crewId: "crew-ed", task: "Give the first-hour emergency plan for this patient as a numbered checklist with doses." },
    { crewId: "crew-icu", task: "Continue from the ED plan above: the ICU plan for the next 24 hours with infusion rates for this patient's weight and targets." },
  ] },
];
export function readPlaybooks(): Playbook[] {
  try {
    const v = JSON.parse(localStorage.getItem(PLAYBOOKS_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((p) => p && typeof p.name === "string" && Array.isArray(p.steps) && p.steps.length).slice(0, 20)
      .map((p) => ({ id: String(p.id), name: String(p.name).slice(0, 60), description: String(p.description ?? "").slice(0, 200), steps: p.steps.slice(0, PLAYBOOK_MAX_STEPS).map((s: any) => ({ crewId: String(s.crewId), task: String(s.task ?? "").slice(0, 500) })) }));
  } catch { return []; }
}
export function savePlaybooks(list: Playbook[]) { try { localStorage.setItem(PLAYBOOKS_KEY, JSON.stringify(list.filter((p) => !p.builtIn).slice(0, 20))); } catch { /* full or blocked */ } }
export function readPlaybookRuns(): PlaybookRun[] {
  try {
    const v = JSON.parse(localStorage.getItem(PLAYBOOK_RUNS_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((r) => r && Array.isArray(r.steps)).slice(0, 15);
  } catch { return []; }
}
export function savePlaybookRuns(list: PlaybookRun[]) { try { localStorage.setItem(PLAYBOOK_RUNS_KEY, JSON.stringify(list.slice(0, 15))); } catch { /* full or blocked */ } }
/** The message one step sends: its task, the original input, and the previous step's output. */
export function stepMessage(task: string, input: string, previous: { name: string; output: string } | null): string {
  return [
    task,
    `<original_input>\n${input}\n</original_input>`,
    previous ? `<previous_step from="${previous.name.replace(/"/g, "'")}">\n${previous.output}\n</previous_step>` : "",
  ].filter(Boolean).join("\n\n");
}
export function runMarkdown(r: PlaybookRun): string {
  return [`# ${r.playbookName}`, `**Input:** ${r.input.slice(0, 600)}`, ...r.steps.map((s, i) => `## ${i + 1}. ${s.name}\n*${s.task}*\n\n${s.output || s.error || ""}`)].join("\n\n");
}

/* ------------------------------------------------------------------ gallery: favourites, use, sort, templates, coach, export */

export const CREW_FAV_KEY = "cadus3.crewFav";
export const CREW_USE_KEY = "cadus3.crewUse";
export function readFav(): string[] {
  try { const v = JSON.parse(localStorage.getItem(CREW_FAV_KEY) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 60) : []; } catch { return []; }
}
export function saveFav(ids: string[]) { try { localStorage.setItem(CREW_FAV_KEY, JSON.stringify(ids.slice(0, 60))); } catch { /* blocked */ } }
export type CrewUse = Record<string, { n: number; last: number }>;
export function readUse(): CrewUse {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_USE_KEY) || "{}");
    const out: CrewUse = {};
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v as Record<string, { n?: unknown; last?: unknown }>)) if (Number(x?.n) > 0) out[k] = { n: Number(x.n), last: Number(x.last) || 0 };
    return out;
  } catch { return {}; }
}
export function saveUse(u: CrewUse) { try { localStorage.setItem(CREW_USE_KEY, JSON.stringify(u)); } catch { /* blocked */ } }
export const recordUse = (u: CrewUse, id: string, at = Date.now()): CrewUse => ({ ...u, [id]: { n: (u[id]?.n ?? 0) + 1, last: at } });
export const recentCrew = (u: CrewUse, max = 6) => Object.entries(u).sort((a, b) => b[1].last - a[1].last).slice(0, max).map(([id]) => id);

export type CrewSort = "default" | "name" | "used";
export type CrewFilter = "all" | "fav" | "mine" | CrewGroup;
/** Filter and sort the whole crew for the gallery search. */
export function filterCrew(list: CrewMember[], q: string, filter: CrewFilter, sort: CrewSort, fav: string[], use: CrewUse): CrewMember[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let out = list.filter((c) => {
    if (filter === "fav" && !fav.includes(c.id)) return false;
    if (filter === "mine" && c.builtIn) return false;
    if (filter !== "all" && filter !== "fav" && filter !== "mine" && (c.builtIn ? (c.group ?? "Clinical") !== filter : true)) return false;
    if (!words.length) return true;
    const hay = `${c.name} ${c.tagline} ${c.group ?? ""} ${c.starters.join(" ")} ${c.instructions}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  if (sort === "name") out = [...out].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "used") out = [...out].sort((a, b) => (use[b.id]?.n ?? 0) - (use[a.id]?.n ?? 0) || a.name.localeCompare(b.name));
  return out;
}

/** Starting points for a new assistant. */
export const CREW_TEMPLATES: { label: string; make: () => CrewMember }[] = [
  { label: "Rotation buddy", make: () => ({ ...blankCrew(), name: "Rotation Buddy", tagline: "Knows my unit's routines and protocols", icon: "clipboard", tone: "teal", instructions: "You help me through my current rotation in [department] at [hospital]. Use the protocols in your knowledge files first, then national guidelines. Answer like a helpful senior resident: the plan first, doses with units, then what to watch for. Keep answers short enough to read on a ward round. Say when something needs a senior's decision.", starters: ["What should I do first for a new admission?", "Common drug doses on this unit", "Discharge checklist"] }) },
  { label: "Specialty examiner", make: () => ({ ...blankCrew(), name: "Specialty Examiner", tagline: "Exam questions in my specialty, one at a time", icon: "graduation", tone: "violet", mode: "viva", instructions: "You are an examiner for [exam, e.g. MD Medicine] in [specialty]. Ask one question at a time, from basic to applied, wait for my answer, then give one line of feedback and the key point I missed. After 8 questions give a score out of 10 and topics to revise.", starters: ["Start a viva", "Ask me about a long case", "Rapid-fire questions"] }) },
  { label: "Protocol bot", make: () => ({ ...blankCrew(), name: "Protocol Bot", tagline: "Answers only from my hospital's protocols", icon: "book", tone: "navy", instructions: "Answer only from the protocols in your knowledge files. Quote the protocol name and section for every answer. If the protocols do not cover the question, say so clearly and then give the standard national guideline answer, labelled as such.", starters: ["What does our protocol say about sepsis?", "Antibiotic policy for UTI"] }) },
  { label: "Patient letter writer", make: () => ({ ...blankCrew(), name: "Letter Writer", tagline: "Clear letters to patients and colleagues", icon: "file", tone: "amber", instructions: "Turn my notes into clear letters: referral letters to colleagues (reason, findings, question asked, medicines), and letters to patients in plain language at a class 8 reading level. Never invent findings or doses; mark anything missing as [to be completed].", starters: ["Referral letter to cardiology", "Explain the test results to the patient"] }) },
  { label: "Journal club partner", make: () => ({ ...blankCrew(), name: "Journal Club Partner", tagline: "Critical appraisal and slides from a paper", icon: "book", tone: "sky", sources: true, instructions: "Help me prepare a journal club: summarise the paper (PICO), appraise it with the right checklist (CONSORT, STROBE or PRISMA), explain the key statistics, list strengths and weaknesses, and suggest 6 slides with one message each.", starters: ["Appraise this RCT", "Explain hazard ratios simply"] }) },
];

/** A quick check of an assistant's instructions, with tips to make it better. */
export function instructionScore(c: Pick<CrewMember, "instructions" | "starters" | "tagline">): { score: number; tips: string[] } {
  const t = c.instructions.toLowerCase();
  const checks: [boolean, string][] = [
    [/\b(you are|act as|as a|you're)\b/.test(t), "Say who it is (\"You are a ... registrar\")."],
    [/(student|resident|intern|patient|doctor|nurse|pg|mbbs|md|audience|for me)/.test(t), "Say who it helps (students, residents, patients)."],
    [/(format|bullet|table|short|steps|first|then|structure|headings|one at a time|summary)/.test(t), "Say how answers should look (short, steps, a table, one question at a time)."],
    [/(guideline|icmr|nice|who|protocol|evidence|national|esc|gina|kdigo)/.test(t), "Name the guidelines or sources it should follow."],
    [/(dose|mg|units|weight|kg)/.test(t) || !/(drug|medicine|treat)/.test(t), "If it gives treatment, ask for doses with units and weight-based totals."],
    [/(senior|refer|red flag|urgent|escalat|safety|never invent|do not invent|unsure)/.test(t), "Add a safety line: when to escalate, and never to invent results or doses."],
    [c.instructions.length >= 200, "Add a little more detail: 3–6 sentences works best."],
    [c.instructions.length <= 3000, "Shorten it: very long instructions get diluted."],
    [c.starters.filter(Boolean).length >= 2, "Add two or more first questions so it is quick to start."],
    [!!c.tagline.trim(), "Add a one-line description for the card."],
  ];
  const ok = checks.filter(([v]) => v).length;
  return { score: Math.round((ok / checks.length) * 10), tips: checks.filter(([v]) => !v).map(([, tip]) => tip) };
}

export const CREW_FILE_V = 1;
/** All of the user's assistants as a JSON file (knowledge files included). */
export function exportCrewFile(list: CrewMember[]): string {
  return JSON.stringify({ app: "cadus-crew", v: CREW_FILE_V, exportedAt: new Date().toISOString(), crew: list.filter((c) => !c.builtIn) }, null, 2);
}
/** Assistants read back from an exported file (new ids; never replaces existing ones). */
export function importCrewFile(text: string, modes: string[]): CrewMember[] {
  try {
    const v = JSON.parse(text);
    const arr = Array.isArray(v) ? v : Array.isArray(v?.crew) ? v.crew : [];
    return arr.map((x: Partial<CrewMember>) => cleanCrew({ ...x, id: "", importedAt: Date.now() }, modes)).filter((x: CrewMember | null): x is CrewMember => !!x).slice(0, CREW_MAX);
  } catch { return []; }
}

/** The message that asks an assistant for a second opinion on someone's answer or plan. */
export function secondOpinionMessage(question: string, answer: string): string {
  return [
    "Give a second opinion on the plan or answer below, as the expert you are.",
    "Use these headings: Verdict (agree, agree with changes, or disagree, in one line); What is right; What is wrong or unsafe (with the correct version and why); What is missing; Final recommendation.",
    "Be specific, give doses where relevant, and say if anything needs urgent escalation. Do not invent patient details.",
    "",
    `Question or case:\n${question}`,
    "",
    `Answer or plan to review:\n${answer}`,
  ].join("\n");
}

/** Crew usage for the insights panel. */
export function crewInsights(mine: CrewMember[], use: CrewUse, chatsByCrew: Record<string, number>) {
  const all = allCrew(mine);
  const top = all.map((c) => ({ c, n: (use[c.id]?.n ?? 0) + 0, chats: chatsByCrew[c.id] ?? 0 })).filter((x) => x.n || x.chats).sort((a, b) => b.chats + b.n - (a.chats + a.n)).slice(0, 5);
  const docs = mine.reduce((n, c) => n + (c.knowledge?.length ?? 0), 0);
  const chars = mine.reduce((n, c) => n + knowledgeChars(c), 0);
  return { total: all.length, yours: mine.length, builtIn: BUILT_IN_CREW.length, docs, chars, top, usedEver: Object.keys(use).length };
}

/** Assistants best suited to a question (for "Who should I ask?"), scored on name, tagline, starters and instructions. */
export function suggestCrew(question: string, mine: CrewMember[], max = 3): CrewMember[] {
  const stop = new Set(["the", "a", "an", "of", "in", "and", "or", "for", "to", "with", "on", "is", "what", "how", "my", "me", "i", "patient", "about", "do", "should", "this", "that", "who"]);
  const words = question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
  if (!words.length) return [];
  const scored = allCrew(mine).map((c) => {
    const name = c.name.toLowerCase(), tag = c.tagline.toLowerCase(), st = c.starters.join(" ").toLowerCase(), ins = c.instructions.toLowerCase();
    const s = words.reduce((a, w) => a + (name.includes(w) ? 4 : 0) + (tag.includes(w) ? 3 : 0) + (st.includes(w) ? 2 : 0) + (ins.includes(w) ? 1 : 0), 0);
    return { c, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  return scored.slice(0, max).map((x) => x.c);
}

/* ------------------------------------------------------------------ Update 35: answer style and language per assistant */

export type CrewLength = "brief" | "standard" | "detailed";
export type CrewFormat = "default" | "bullets" | "table" | "steps" | "exam";
export interface CrewStyle { length?: CrewLength; format?: CrewFormat; language?: string; mentor?: boolean }
export const CREW_STYLE_KEY = "cadus3.crewStyle";
export const CREW_LANGS = ["English", "Hindi", "Hinglish", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Urdu", "Assamese"] as const;
export const CREW_LENGTHS: { id: CrewLength; label: string }[] = [{ id: "brief", label: "Brief" }, { id: "standard", label: "Standard" }, { id: "detailed", label: "Detailed" }];
export const CREW_FORMATS: { id: CrewFormat; label: string }[] = [{ id: "default", label: "As it sees fit" }, { id: "bullets", label: "Bullet points" }, { id: "table", label: "Tables where possible" }, { id: "steps", label: "Numbered steps" }, { id: "exam", label: "Exam answer (headings, key points)" }];

export function cleanStyle(raw: unknown): CrewStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const out: CrewStyle = {};
  if (CREW_LENGTHS.some((l) => l.id === r.length) && r.length !== "standard") out.length = r.length as CrewLength;
  if (CREW_FORMATS.some((f) => f.id === r.format) && r.format !== "default") out.format = r.format as CrewFormat;
  if ((CREW_LANGS as readonly string[]).includes(String(r.language)) && r.language !== "English") out.language = String(r.language);
  if (r.mentor === true) out.mentor = true;
  return Object.keys(out).length ? out : undefined;
}
export function readStyles(): Record<string, CrewStyle> {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_STYLE_KEY) || "{}");
    const out: Record<string, CrewStyle> = {};
    for (const [k, x] of Object.entries(v && typeof v === "object" ? v : {})) { const s = cleanStyle(x); if (s) out[k.slice(0, 60)] = s; }
    return out;
  } catch { return {}; }
}
export function saveStyles(m: Record<string, CrewStyle>) { try { localStorage.setItem(CREW_STYLE_KEY, JSON.stringify(m)); } catch { /* blocked */ } }
/** A new style map with one assistant's style set (or cleared when everything is default). */
export function setStyle(m: Record<string, CrewStyle>, id: string, style: CrewStyle): Record<string, CrewStyle> {
  const next = { ...m };
  const s = cleanStyle(style);
  if (s) next[id] = s; else delete next[id];
  return next;
}
/** The line put in front of the instructions. */
export function styleLine(s: CrewStyle | undefined): string {
  const c = cleanStyle(s);
  if (!c) return "";
  const parts: string[] = [];
  if (c.length === "brief") parts.push("Keep answers brief: the key points in under 150 words unless asked for more.");
  if (c.length === "detailed") parts.push("Give detailed, thorough answers with reasoning, doses and references to guidelines.");
  if (c.format === "bullets") parts.push("Format answers as bullet points.");
  if (c.format === "table") parts.push("Use tables wherever information can be compared.");
  if (c.format === "steps") parts.push("Format answers as numbered steps.");
  if (c.format === "exam") parts.push("Write like a model exam answer: short headings, key points, a diagram description or mnemonic where useful.");
  if (c.language) parts.push(`Always answer in ${c.language === "Hinglish" ? "Hinglish (Hindi in Roman script mixed with English medical terms)" : c.language}, keeping drug names and medical terms in English.`);
  if (c.mentor) parts.push("MENTOR MODE: teach by questioning. Do not give the full answer straight away: ask one or two guiding questions, wait for the user's reasoning, give a hint if they are stuck, and confirm or correct once they have tried. Give the full answer at once only for emergencies or if the user says 'just tell me'.");
  return `ANSWER STYLE (set by the user for this assistant): ${parts.join(" ")}`;
}
export const styleSummary = (s: CrewStyle | undefined) => {
  const c = cleanStyle(s);
  if (!c) return "";
  return [c.mentor && "Mentor", c.length && CREW_LENGTHS.find((l) => l.id === c.length)?.label, c.format && CREW_FORMATS.find((f) => f.id === c.format)?.label, c.language].filter(Boolean).join(" · ");
};

/* ------------------------------------------------------------------ Update 35: collections and private notes */

export interface CrewCollection { id: string; name: string; ids: string[] }
export interface CrewOrg { collections: CrewCollection[]; notes: Record<string, string> }
export const CREW_ORG_KEY = "cadus3.crewOrg";
export const COLLECTION_MAX = 20;
export const NOTE_MAX = 1000;
export function cleanOrg(raw: unknown): CrewOrg {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const collections = (Array.isArray(r.collections) ? r.collections : []).map((c: any) => ({
    id: clip(c?.id, 40) || `col-${Math.random().toString(36).slice(2, 8)}`,
    name: clip(c?.name, 40).replace(/\s+/g, " "),
    ids: [...new Set((Array.isArray(c?.ids) ? c.ids : []).map((x: unknown) => clip(x, 60)).filter(Boolean))].slice(0, 120) as string[],
  })).filter((c) => c.name).slice(0, COLLECTION_MAX);
  const notes: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.notes && typeof r.notes === "object" ? r.notes as Record<string, unknown> : {})) { const t = clip(v, NOTE_MAX); if (t) notes[k.slice(0, 60)] = t; }
  return { collections, notes };
}
export function readOrg(): CrewOrg { try { return cleanOrg(JSON.parse(localStorage.getItem(CREW_ORG_KEY) || "{}")); } catch { return { collections: [], notes: {} }; } }
export function saveOrg(o: CrewOrg) { try { localStorage.setItem(CREW_ORG_KEY, JSON.stringify(o)); } catch { /* blocked */ } }
export function addCollection(o: CrewOrg, name: string, ids: string[] = []): CrewOrg {
  const n = clip(name, 40).replace(/\s+/g, " ");
  if (!n || o.collections.length >= COLLECTION_MAX) return o;
  const existing = o.collections.find((c) => c.name.toLowerCase() === n.toLowerCase());
  if (existing) return { ...o, collections: o.collections.map((c) => (c === existing ? { ...c, ids: [...new Set([...c.ids, ...ids])] } : c)) };
  return { ...o, collections: [...o.collections, { id: `col-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: n, ids: [...new Set(ids)] }] };
}
export const renameCollection = (o: CrewOrg, id: string, name: string): CrewOrg => ({ ...o, collections: o.collections.map((c) => (c.id === id && clip(name, 40) ? { ...c, name: clip(name, 40) } : c)) });
export const deleteCollection = (o: CrewOrg, id: string): CrewOrg => ({ ...o, collections: o.collections.filter((c) => c.id !== id) });
export const toggleInCollection = (o: CrewOrg, colId: string, crewId: string): CrewOrg => ({
  ...o, collections: o.collections.map((c) => (c.id !== colId ? c : { ...c, ids: c.ids.includes(crewId) ? c.ids.filter((x) => x !== crewId) : [...c.ids, crewId] })),
});
export function setNote(o: CrewOrg, crewId: string, text: string): CrewOrg {
  const notes = { ...o.notes };
  const t = clip(text, NOTE_MAX);
  if (t) notes[crewId] = t; else delete notes[crewId];
  return { ...o, notes };
}
/** Collections an assistant belongs to. */
export const collectionsOf = (o: CrewOrg, crewId: string) => o.collections.filter((c) => c.ids.includes(crewId));

/* ------------------------------------------------------------------ Update 35: team packs */

export interface CrewPack { id: string; name: string; description: string; ids: string[] }
export const CREW_PACKS: CrewPack[] = [
  { id: "pack-surgical", name: "Surgical team", description: "General, GI, urology, vascular, plastics, anaesthesia and the surgical registrar.", ids: ["crew-surgery", "crew-gisurg", "crew-uro", "crew-vascular", "crew-plastic", "crew-anaes", "crew-ir"] },
  { id: "pack-medical", name: "Medical ward", description: "Cardiology, nephrology, gastro, pulmonology, ID, haematology and the pharmacist.", ids: ["crew-rounds", "crew-cardio", "crew-nephro", "crew-gastro", "crew-pulm", "crew-id", "crew-haem", "crew-pharmacist"] },
  { id: "pack-paeds", name: "Paediatrics", description: "Doses, newborns, cardiology, neurology, surgery and child psychiatry.", ids: ["crew-paeds", "crew-neonat", "crew-paedcardio", "crew-paedneuro", "crew-paedsurg", "crew-cap"] },
  { id: "pack-women", name: "Women's health", description: "Obstetrics, high-risk pregnancy, IVF, gynae oncology and breast.", ids: ["crew-obg", "crew-mfm", "crew-ivf", "crew-gynonc", "crew-surgonc"] },
  { id: "pack-cancer", name: "Tumour board", description: "Medical, surgical and radiation oncology, pathology, nuclear medicine and palliative care.", ids: ["crew-onco", "crew-surgonc", "crew-radonc", "crew-path", "crew-nucmed", "crew-palliative"] },
  { id: "pack-emergency", name: "Emergency & critical care", description: "ED, ICU, anaesthesia, neurosurgery, transfusion and toxicology help.", ids: ["crew-ed", "crew-icu", "crew-anaes", "crew-neurosurg", "crew-transfusion", "crew-tropical"] },
  { id: "pack-basics", name: "First-year to finals", description: "Anatomy, physiology, biochemistry, pharmacology, microbiology, pathology and the exam coaches.", ids: ["crew-anatomy", "crew-physio", "crew-biochem", "crew-pharmacology", "crew-micro", "crew-path", "crew-viva", "crew-neetpg"] },
  { id: "pack-rehab", name: "Rehab & allied health", description: "PMR, physiotherapy, speech and swallow, nutrition, psychology and geriatrics.", ids: ["crew-pmr", "crew-physioth", "crew-speech", "crew-nutrition", "crew-psychologist", "crew-geri"] },
];
export const PACK_V = 1;
/** A pack as a file: built-ins by id, the user's own in full (knowledge files stay on this device). */
export function packFile(name: string, ids: string[], mine: CrewMember[]): string {
  const own = mine.filter((c) => ids.includes(c.id)).map(({ knowledge: _k, ...c }) => c);
  return JSON.stringify({ app: "cadus-crew-pack", v: PACK_V, name: clip(name, 40) || "Crew pack", builtIn: ids.filter((id) => BUILT_IN_CREW.some((b) => b.id === id)), crew: own }, null, 2);
}
/** The short code for a pack link (built-ins as ids, the user's own compressed into the code). */
export function packCode(name: string, ids: string[], mine: CrewMember[]): string {
  const own = mine.filter((c) => ids.includes(c.id)).map((c) => ({ n: c.name, t: c.tagline, i: c.instructions, s: c.starters, ic: c.icon, to: c.tone, m: c.mode }));
  return b64url(JSON.stringify({ v: PACK_V, p: clip(name, 40) || "Crew pack", b: ids.filter((id) => BUILT_IN_CREW.some((x) => x.id === id)), o: own }));
}
export const packLink = (name: string, ids: string[], mine: CrewMember[], base: string) => `${base}?crewpack=${packCode(name, ids, mine)}`;
export interface ReadPack { name: string; builtInIds: string[]; custom: CrewMember[] }
/** A pack read back from a file, a link or a code. */
export function readPack(text: string, modes: string[]): ReadPack | null {
  const t = text.trim();
  try {
    if (t.startsWith("{")) {
      const v = JSON.parse(t);
      if (v?.app !== "cadus-crew-pack") return null;
      return {
        name: clip(v.name, 40) || "Crew pack",
        builtInIds: (Array.isArray(v.builtIn) ? v.builtIn : []).map(String).filter((id: string) => BUILT_IN_CREW.some((b) => b.id === id)).slice(0, 100),
        custom: (Array.isArray(v.crew) ? v.crew : []).map((x: Partial<CrewMember>) => cleanCrew({ ...x, id: "", importedAt: Date.now() }, modes)).filter((x: CrewMember | null): x is CrewMember => !!x).slice(0, CREW_MAX),
      };
    }
    const m = /[?&]crewpack=([A-Za-z0-9_-]+)/.exec(t);
    const code = m ? m[1] : /^[A-Za-z0-9_-]+$/.test(t) ? t : "";
    if (!code || code.length > 60000) return null;
    const o = JSON.parse(unb64url(code));
    if (!o || o.v !== PACK_V) return null;
    return {
      name: clip(o.p, 40) || "Crew pack",
      builtInIds: (Array.isArray(o.b) ? o.b : []).map(String).filter((id: string) => BUILT_IN_CREW.some((b) => b.id === id)).slice(0, 100),
      custom: (Array.isArray(o.o) ? o.o : []).map((x: any) => cleanCrew({ id: "", name: x?.n, tagline: x?.t, instructions: x?.i, starters: x?.s, icon: x?.ic, tone: x?.to, mode: x?.m, importedAt: Date.now() }, modes)).filter((x: CrewMember | null): x is CrewMember => !!x).slice(0, CREW_MAX),
    };
  } catch { return null; }
}

/* ------------------------------------------------------------------ Update 35: quiz battle */

export interface QuizQ { q: string; options: string[]; answer: number; why: string }
export type QuizLevel = "easy" | "exam" | "hard";
export function quizPrompt(topic: string, n: number, level: QuizLevel): string {
  return [
    `Write ${n} single-best-answer multiple-choice questions on: ${topic.trim().slice(0, 300)}.`,
    `Level: ${level === "easy" ? "MBBS university exam, core facts" : level === "hard" ? "NEET-PG/INI-CET hard, clinical vignettes and second-order thinking" : "NEET-PG standard, mix of recall and clinical vignettes"}.`,
    "Each question has exactly 4 options, one correct, plausible distractors, no 'all of the above'. Vary the position of the correct answer.",
    'Reply with ONLY a JSON array, no other text, in this shape: [{"q":"question","options":["A","B","C","D"],"answer":0,"why":"one or two lines on why it is right and the trap"}]. "answer" is the 0-based index of the correct option.',
  ].join("\n");
}
/** The questions from a reply, made safe; malformed items dropped. */
export function parseQuiz(text: string): QuizQ[] {
  const t = String(text ?? "");
  const start = t.indexOf("["), end = t.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    const v = JSON.parse(t.slice(start, end + 1));
    return (Array.isArray(v) ? v : []).map((x: any): QuizQ | null => {
      const options = Array.isArray(x?.options) ? x.options.map((o: unknown) => clip(o, 300)).filter(Boolean) : [];
      const answer = Number(x?.answer);
      const q = clip(x?.q, 1200);
      if (!q || options.length < 2 || options.length > 6 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;
      return { q, options, answer, why: clip(x?.why, 800) };
    }).filter((x): x is QuizQ => !!x).slice(0, 20);
  } catch { return []; }
}
export interface QuizPlayer { name: string; score: number; streak: number; best: number; answered: number }
/** Points for one answer: 10, plus a 5-point bonus from the third right answer in a row, plus up to 5 for speed. */
export function quizPoints(correct: boolean, streak: number, secondsLeft: number, limit: number): number {
  if (!correct) return 0;
  return 10 + (streak >= 2 ? 5 : 0) + (limit > 0 ? Math.max(0, Math.min(5, Math.round((secondsLeft / limit) * 5))) : 0);
}
export interface QuizResult { id: string; at: number; topic: string; level: QuizLevel; crewId: string; players: { name: string; score: number; correct: number; total: number }[] }
export const QUIZ_KEY = "cadus3.quizBattles";
export function readQuizResults(): QuizResult[] {
  try { const v = JSON.parse(localStorage.getItem(QUIZ_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((r) => r && Array.isArray(r.players)).slice(0, 40); } catch { return []; }
}
export function saveQuizResults(list: QuizResult[]) { try { localStorage.setItem(QUIZ_KEY, JSON.stringify(list.slice(0, 40))); } catch { /* blocked */ } }
/** Best scores by player across saved battles. */
export function quizLeaderboard(list: QuizResult[], max = 5): { name: string; best: number; games: number; accuracy: number }[] {
  const m = new Map<string, { best: number; games: number; correct: number; total: number }>();
  for (const r of list) for (const p of r.players) {
    const k = p.name.trim() || "You";
    const e = m.get(k) ?? { best: 0, games: 0, correct: 0, total: 0 };
    m.set(k, { best: Math.max(e.best, p.score), games: e.games + 1, correct: e.correct + p.correct, total: e.total + p.total });
  }
  return [...m.entries()].map(([name, e]) => ({ name, best: e.best, games: e.games, accuracy: e.total ? Math.round((e.correct / e.total) * 100) : 0 })).sort((a, b) => b.best - a.best).slice(0, max);
}

/* ------------------------------------------------------------------ Update 35: case round */

export interface CaseRoundPreset { id: string; label: string; ids: string[] }
export const CASE_ROUND_PRESETS: CaseRoundPreset[] = [
  { id: "medical", label: "Medical ward round", ids: ["crew-rounds", "crew-cardio", "crew-nephro", "crew-pharmacist"] },
  { id: "surgical", label: "Surgical MDT", ids: ["crew-surgery", "crew-radiology", "crew-anaes", "crew-gisurg"] },
  { id: "tumour", label: "Tumour board", ids: ["crew-onco", "crew-surgonc", "crew-radonc", "crew-palliative"] },
  { id: "paeds", label: "Paediatric round", ids: ["crew-paeds", "crew-neonat", "crew-id"] },
  { id: "fever", label: "Fever that won't settle", ids: ["crew-id", "crew-tropical", "crew-haem", "crew-abx"] },
  { id: "elderly", label: "Frail elderly patient", ids: ["crew-geri", "crew-pharmacist", "crew-pmr", "crew-nutrition"] },
];
export const CASE_ROUND_MAX = 6;
/** What each specialist sees: the case and what earlier specialists said. */
export function caseRoundMessage(caseText: string, me: string, previous: { name: string; text: string }[]): string {
  return [
    `This case is being discussed at a multidisciplinary case round. You are the ${me}. ${previous.length ? "The colleagues before you have spoken (below)." : "You speak first."}`,
    "Give your specialty's view only: your assessment, the key investigations, your recommendations with doses where relevant, and any disagreement with earlier colleagues (say why). Do not repeat what has already been said. Keep it under 250 words, with short headings.",
    `<case>\n${caseText}\n</case>`,
    ...previous.map((p) => `<colleague name="${p.name.replace(/"/g, "'")}">\n${p.text}\n</colleague>`),
  ].join("\n\n");
}
/** The final message that combines the round into one plan. */
export function caseSummaryMessage(caseText: string, outputs: { name: string; text: string }[]): string {
  return [
    "Chair this multidisciplinary case round and write the consensus. Use these headings: Summary of the case (2 lines); Agreed diagnosis or differentials; Agreed plan (numbered, with owner specialty); Points of disagreement and how they were resolved; Safety issues; Follow-up.",
    "Base it only on the case and the opinions below; do not invent findings.",
    `<case>\n${caseText}\n</case>`,
    ...outputs.map((p) => `<opinion from="${p.name.replace(/"/g, "'")}">\n${p.text}\n</opinion>`),
  ].join("\n\n");
}
export interface CaseRound { id: string; at: number; caseText: string; steps: { crewId: string; name: string; text: string; error?: string }[]; summary?: string }
export const CASE_ROUNDS_KEY = "cadus3.caseRounds";
export function readCaseRounds(): CaseRound[] {
  try { const v = JSON.parse(localStorage.getItem(CASE_ROUNDS_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((r) => r && Array.isArray(r.steps)).slice(0, 15); } catch { return []; }
}
export function saveCaseRounds(list: CaseRound[]) { try { localStorage.setItem(CASE_ROUNDS_KEY, JSON.stringify(list.slice(0, 15))); } catch { /* full or blocked */ } }
export function caseRoundMd(r: CaseRound): string {
  return ["# Case round", `**Case:** ${r.caseText.slice(0, 1500)}`, ...r.steps.map((s, i) => `## ${i + 1}. ${s.name}\n\n${s.text || s.error || ""}`), ...(r.summary ? [`## Consensus plan\n\n${r.summary}`] : [])].join("\n\n");
}

/* ------------------------------------------------------------------ Update 36: assistant memory */

export interface CrewFact { id: string; text: string; at: number }
export const CREW_MEMORY_KEY = "cadus3.crewMemory";
export const MEMORY_MAX = 15;
export const FACT_MAX = 200;
export function cleanFacts(raw: unknown): CrewFact[] {
  return (Array.isArray(raw) ? raw : []).map((f: any) => ({ id: clip(f?.id, 40) || `f-${Math.random().toString(36).slice(2, 8)}`, text: clip(f?.text, FACT_MAX).replace(/\s+/g, " "), at: Number(f?.at) || Date.now() })).filter((f) => f.text).slice(0, MEMORY_MAX);
}
export function readMemory(): Record<string, CrewFact[]> {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_MEMORY_KEY) || "{}");
    const out: Record<string, CrewFact[]> = {};
    for (const [k, x] of Object.entries(v && typeof v === "object" ? v : {})) { const f = cleanFacts(x); if (f.length) out[k.slice(0, 60)] = f; }
    return out;
  } catch { return {}; }
}
export function saveMemory(m: Record<string, CrewFact[]>) { try { localStorage.setItem(CREW_MEMORY_KEY, JSON.stringify(m)); } catch { /* blocked */ } }
export function addFact(m: Record<string, CrewFact[]>, crewId: string, text: string): Record<string, CrewFact[]> {
  const t = clip(text, FACT_MAX).replace(/\s+/g, " ");
  if (!t) return m;
  const list = (m[crewId] ?? []).filter((f) => f.text.toLowerCase() !== t.toLowerCase());
  return { ...m, [crewId]: [{ id: `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text: t, at: Date.now() }, ...list].slice(0, MEMORY_MAX) };
}
export function removeFact(m: Record<string, CrewFact[]>, crewId: string, factId: string): Record<string, CrewFact[]> {
  const list = (m[crewId] ?? []).filter((f) => f.id !== factId);
  const next = { ...m };
  if (list.length) next[crewId] = list; else delete next[crewId];
  return next;
}
/** "Remember: …" / "Remember that …" typed in a chat with an assistant: the fact to save, or "". */
export function rememberFrom(text: string): string {
  const m = /^\s*(?:please\s+)?remember(?:\s+that)?\s*[:,-]?\s+(.{3,})$/is.exec(text);
  return m ? clip(m[1], FACT_MAX).replace(/\s+/g, " ") : "";
}
export function memoryLine(facts: CrewFact[] | undefined): string {
  const f = cleanFacts(facts);
  if (!f.length) return "";
  return `WHAT THE USER ASKED YOU TO REMEMBER (use it when relevant; do not list it back unless asked):\n${f.map((x) => `- ${x.text}`).join("\n")}`;
}

/* ------------------------------------------------------------------ Update 36: chat rooms */

export interface RoomMsg { id: string; role: "user" | "crew"; crewId?: string; name?: string; text: string; at: number; error?: boolean }
export interface CrewRoom { id: string; name: string; members: string[]; mode: "best" | "all"; messages: RoomMsg[]; createdAt: number; updatedAt: number }
export const ROOMS_KEY = "cadus3.crewRooms";
export const ROOM_MAX = 10;
export const ROOM_MEMBERS_MAX = 5;
export const ROOM_MSGS_MAX = 80;
export function readRooms(): CrewRoom[] {
  try {
    const v = JSON.parse(localStorage.getItem(ROOMS_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((r) => r && typeof r.name === "string" && Array.isArray(r.members) && Array.isArray(r.messages)).slice(0, ROOM_MAX)
      .map((r) => ({ ...r, mode: r.mode === "all" ? "all" : "best", members: r.members.map(String).slice(0, ROOM_MEMBERS_MAX), messages: r.messages.slice(-ROOM_MSGS_MAX) }));
  } catch { return []; }
}
export function saveRooms(list: CrewRoom[]) { try { localStorage.setItem(ROOMS_KEY, JSON.stringify(list.slice(0, ROOM_MAX).map((r) => ({ ...r, messages: r.messages.slice(-ROOM_MSGS_MAX) })))); } catch { /* full or blocked */ } }
export function newRoom(name: string, members: string[]): CrewRoom {
  const now = Date.now();
  return { id: `room-${now.toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: clip(name, 40) || "Crew room", members: [...new Set(members)].slice(0, ROOM_MEMBERS_MAX), mode: "best", messages: [], createdAt: now, updatedAt: now };
}
/** Who replies: anyone @-mentioned; otherwise everyone, or the best match for the message. */
export function roomTargets(text: string, members: CrewMember[], mode: "best" | "all"): string[] {
  const low = text.toLowerCase();
  const named = members.filter((m) => low.includes(`@${m.name.toLowerCase()}`) || low.includes(`@${m.name.split(/\s+/)[0].toLowerCase()}`));
  if (/@(all|everyone)\b/.test(low)) return members.map((m) => m.id);
  if (named.length) return named.map((m) => m.id);
  if (mode === "all") return members.map((m) => m.id);
  const best = suggestCrewAmong(text, members)[0] ?? members[0];
  return best ? [best.id] : [];
}
function suggestCrewAmong(text: string, members: CrewMember[]): CrewMember[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  return members.map((c) => ({ c, s: words.reduce((a, w) => a + (c.name.toLowerCase().includes(w) ? 4 : 0) + (c.tagline.toLowerCase().includes(w) ? 3 : 0) + (c.instructions.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.c);
}
/** What one assistant is sent: the room, its members, the recent transcript and the new message. */
export function roomMessage(room: CrewRoom, me: CrewMember, members: CrewMember[], text: string): string {
  const recent = room.messages.slice(-12).map((m) => `${m.role === "user" ? "User" : m.name ?? "Assistant"}: ${m.text.slice(0, 800)}`).join("\n\n");
  return [
    `You are ${me.name}, in a group chat room called "${room.name}" with the user and these assistants: ${members.filter((m) => m.id !== me.id).map((m) => m.name).join(", ") || "no one else"}.`,
    "Reply as yourself only, to the user's latest message. Build on what the others said, politely correct them if they are wrong, and do not repeat them. Keep it under 200 words unless asked for more.",
    recent ? `<transcript>\n${recent}\n</transcript>` : "",
    `<latest_message>\n${text}\n</latest_message>`,
  ].filter(Boolean).join("\n\n");
}
export function roomMd(r: CrewRoom): string {
  return [`# ${r.name}`, ...r.messages.map((m) => `**${m.role === "user" ? "You" : m.name}:** ${m.text}`)].join("\n\n");
}

/* ------------------------------------------------------------------ Update 36: daily drill and streaks */

export interface DrillDay { topic: string; correct: number; total: number }
export interface DrillState { crewId: string; topics: string[]; level: QuizLevel; days: Record<string, DrillDay>; stats: Record<string, { c: number; t: number }> }
export const DRILL_KEY = "cadus3.crewDrill";
export const DRILL_N = 5;
export const blankDrill = (): DrillState => ({ crewId: "crew-neetpg", topics: [], level: "exam", days: {}, stats: {} });
export function readDrill(): DrillState {
  try {
    const v = JSON.parse(localStorage.getItem(DRILL_KEY) || "null");
    if (!v || typeof v !== "object") return blankDrill();
    return { crewId: clip(v.crewId, 60) || "crew-neetpg", topics: (Array.isArray(v.topics) ? v.topics : []).map((t: unknown) => clip(t, 60)).filter(Boolean).slice(0, 20), level: v.level === "easy" || v.level === "hard" ? v.level : "exam", days: v.days && typeof v.days === "object" ? v.days : {}, stats: v.stats && typeof v.stats === "object" ? v.stats : {} };
  } catch { return blankDrill(); }
}
export function saveDrill(d: DrillState) { try { localStorage.setItem(DRILL_KEY, JSON.stringify(d)); } catch { /* blocked */ } }
export const dateKey = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (key: string, n: number) => { const [y, m, d] = key.split("-").map(Number); return dateKey(new Date(y, m - 1, d + n)); };
/** Days in a row with a drill, ending today (or yesterday if today's is not done yet). */
export function drillStreak(days: Record<string, DrillDay>, today: string): number {
  let k = days[today] ? today : addDays(today, -1), n = 0;
  while (days[k]) { n++; k = addDays(k, -1); }
  return n;
}
export function bestStreak(days: Record<string, DrillDay>): number {
  const keys = Object.keys(days).sort();
  let best = 0, run = 0, prev = "";
  for (const k of keys) { run = prev && addDays(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; }
  return best;
}
/** Today's topic: the weakest (untried first), not the same as yesterday's when there is a choice. */
export function pickTopic(d: DrillState, today: string): string {
  if (!d.topics.length) return "";
  const yesterday = d.days[addDays(today, -1)]?.topic;
  const acc = (t: string) => (d.stats[t]?.t ? d.stats[t].c / d.stats[t].t : -1);
  const sorted = [...d.topics].sort((a, b) => acc(a) - acc(b) || a.localeCompare(b));
  return (sorted.length > 1 ? sorted.find((t) => t !== yesterday) : sorted[0]) ?? sorted[0];
}
export function recordDrill(d: DrillState, today: string, topic: string, correct: number, total: number): DrillState {
  const s = d.stats[topic] ?? { c: 0, t: 0 };
  return { ...d, days: { ...d.days, [today]: { topic, correct, total } }, stats: { ...d.stats, [topic]: { c: s.c + correct, t: s.t + total } } };
}
export function weakTopics(d: DrillState, min = 5): { topic: string; pct: number; answered: number }[] {
  return Object.entries(d.stats).filter(([, s]) => s.t >= min).map(([topic, s]) => ({ topic, pct: Math.round((s.c / s.t) * 100), answered: s.t })).sort((a, b) => a.pct - b.pct).slice(0, 5);
}
/** The last n days, oldest first, for the streak calendar. */
export function drillCalendar(d: DrillState, today: string, n = 28): { key: string; day?: DrillDay }[] {
  return Array.from({ length: n }, (_, i) => { const key = addDays(today, i - n + 1); return { key, day: d.days[key] }; });
}

/* ------------------------------------------------------------------ Update 36: rate and improve */

export interface CrewRating { msgId: string; vote: "up" | "down"; q: string; a: string; why?: string; at: number }
export const CREW_FEEDBACK_KEY = "cadus3.crewFeedback";
export const RATINGS_MAX = 30;
export function readRatings(): Record<string, CrewRating[]> {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_FEEDBACK_KEY) || "{}");
    const out: Record<string, CrewRating[]> = {};
    for (const [k, x] of Object.entries(v && typeof v === "object" ? v : {})) if (Array.isArray(x)) out[k.slice(0, 60)] = x.filter((r: any) => r && (r.vote === "up" || r.vote === "down")).slice(0, RATINGS_MAX);
    return out;
  } catch { return {}; }
}
export function saveRatings(m: Record<string, CrewRating[]>) { try { localStorage.setItem(CREW_FEEDBACK_KEY, JSON.stringify(m)); } catch { /* blocked */ } }
export function rateCrew(m: Record<string, CrewRating[]>, crewId: string, r: Omit<CrewRating, "at"> & { at?: number }): Record<string, CrewRating[]> {
  const item: CrewRating = { msgId: r.msgId, vote: r.vote, q: clip(r.q, 600), a: clip(r.a, 1200), ...(r.why ? { why: clip(r.why, 600) } : {}), at: r.at ?? Date.now() };
  return { ...m, [crewId]: [item, ...(m[crewId] ?? []).filter((x) => x.msgId !== r.msgId)].slice(0, RATINGS_MAX) };
}
export function unrateCrew(m: Record<string, CrewRating[]>, crewId: string, msgId: string): Record<string, CrewRating[]> {
  const list = (m[crewId] ?? []).filter((x) => x.msgId !== msgId);
  const next = { ...m };
  if (list.length) next[crewId] = list; else delete next[crewId];
  return next;
}
export function ratingSummary(list: CrewRating[] | undefined): { up: number; down: number; pct: number | null } {
  const up = (list ?? []).filter((r) => r.vote === "up").length, down = (list ?? []).filter((r) => r.vote === "down").length;
  return { up, down, pct: up + down ? Math.round((up / (up + down)) * 100) : null };
}
/** Asks for better instructions from the ratings. */
export function improvePrompt(c: CrewMember, list: CrewRating[]): string {
  const ex = list.slice(0, 12).map((r) => `<rated vote="${r.vote}">\nQuestion: ${r.q.slice(0, 300)}\nAnswer (start): ${r.a.slice(0, 500)}${r.why ? `\nUser's complaint: ${r.why}` : ""}\n</rated>`).join("\n");
  return [
    `Improve the instructions of a Cadus Crew assistant called "${c.name}" using the user's ratings of its answers.`,
    "Keep its role and purpose. Fix what the thumbs-down answers did wrong (length, format, accuracy, focus, tone, missing doses or sources) and keep what the thumbs-up answers did well.",
    "Reply with ONLY the new instructions, written to the assistant in the second person ('Act as…'), under 2,500 characters, no preamble, no headings, no code fences.",
    `<current_instructions>\n${c.instructions}\n</current_instructions>`,
    ex,
  ].join("\n\n");
}
export const cleanImproved = (text: string) => String(text ?? "").replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").replace(/^(new instructions|instructions)\s*:\s*/i, "").trim().slice(0, INSTRUCTIONS_MAX);

/* ------------------------------------------------------------------ Update 37: handoff */

/** The first message for the next assistant: who handed over, the conversation so far, and what is needed. */
export function handoffBrief(fromName: string, toName: string, msgs: { role: string; content: string }[], note: string): string {
  const recent = msgs.filter((m) => m.content.trim()).slice(-8).map((m) => `${m.role === "user" ? "Me" : fromName}: ${m.content.replace(/\s+/g, " ").trim().slice(0, 400)}${m.content.length > 400 ? "…" : ""}`);
  return [
    `Handover from ${fromName} to ${toName}.`,
    recent.length ? `Our conversation so far:\n${recent.map((r) => `- ${r}`).join("\n")}` : "",
    `Please take over${note.trim() ? `: ${note.trim().slice(0, 500)}` : " from here with your expertise."}`,
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Update 37: notes and flashcards */

export interface Flashcard { front: string; back: string; box: number; due: string }
export interface CrewNote { id: string; crewId: string; title: string; text: string; at: number; cards?: Flashcard[] }
export interface CrewNotes { notes: CrewNote[]; reviewed: number }
export const CREW_NOTES_KEY = "cadus3.crewNotes";
export const NOTES_MAX = 200;
export function readNotes(): CrewNotes {
  try {
    const v = JSON.parse(localStorage.getItem(CREW_NOTES_KEY) || "null");
    return { notes: (Array.isArray(v?.notes) ? v.notes : []).filter((n: any) => n && typeof n.text === "string").slice(0, NOTES_MAX), reviewed: Number(v?.reviewed) || 0 };
  } catch { return { notes: [], reviewed: 0 }; }
}
export function saveNotes(n: CrewNotes) { try { localStorage.setItem(CREW_NOTES_KEY, JSON.stringify({ ...n, notes: n.notes.slice(0, NOTES_MAX) })); } catch { /* full or blocked */ } }
export function noteTitle(text: string): string {
  const h = /^#{1,3}\s+(.+)$/m.exec(text);
  const first = (h ? h[1] : text.split("\n").find((l) => l.trim()) ?? "Note").replace(/[*_`>#]/g, "").trim();
  return first.length > 70 ? `${first.slice(0, 67)}…` : first || "Note";
}
export function addNote(n: CrewNotes, crewId: string, text: string, title?: string): CrewNotes {
  const t = clip(text, 20000);
  if (!t || n.notes.some((x) => x.crewId === crewId && x.text === t)) return n;
  return { ...n, notes: [{ id: `note-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, crewId, title: clip(title, 80) || noteTitle(t), text: t, at: Date.now() }, ...n.notes].slice(0, NOTES_MAX) };
}
export const deleteNote = (n: CrewNotes, id: string): CrewNotes => ({ ...n, notes: n.notes.filter((x) => x.id !== id) });
export function flashcardPrompt(text: string, count = 8): string {
  return [
    `Make ${count} flashcards for revision from the note below.`,
    "Each card tests one fact or concept: a short question on the front and a concise answer on the back (doses, numbers, criteria where present). No trivia, no duplicates.",
    'Reply with ONLY a JSON array: [{"front":"question","back":"answer"}].',
    `<note>\n${text.slice(0, 8000)}\n</note>`,
  ].join("\n");
}
export function parseCards(text: string, today: string): Flashcard[] {
  const t = String(text ?? ""), a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b <= a) return [];
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    return (Array.isArray(v) ? v : []).map((x: any) => ({ front: clip(x?.front, 300), back: clip(x?.back, 600), box: 1, due: today })).filter((c) => c.front && c.back).slice(0, 30);
  } catch { return []; }
}
const LEITNER = [1, 2, 4, 8, 16];
/** Leitner review: known moves up a box (due later), missed goes back to box 1 (due today). */
export function reviewCard(c: Flashcard, knew: boolean, today: string): Flashcard {
  const box = knew ? Math.min(5, c.box + 1) : 1;
  return { ...c, box, due: knew ? addDays(today, LEITNER[box - 1]) : today };
}
export const dueCards = (n: CrewNotes, today: string) => n.notes.reduce((k, x) => k + (x.cards ?? []).filter((c) => c.due <= today).length, 0);

/* ------------------------------------------------------------------ Update 37: scheduled check-ins */

export interface CheckIn { id: string; crewId: string; kind: "tip" | "plan"; topic: string; enabled: boolean }
export interface CheckInEntry { id: string; checkinId: string; crewId: string; date: string; text: string }
export interface CheckIns { items: CheckIn[]; history: CheckInEntry[] }
export const CHECKINS_KEY = "cadus3.crewCheckins";
export function readCheckins(): CheckIns {
  try {
    const v = JSON.parse(localStorage.getItem(CHECKINS_KEY) || "null");
    return { items: (Array.isArray(v?.items) ? v.items : []).filter((x: any) => x && x.crewId).slice(0, 6), history: (Array.isArray(v?.history) ? v.history : []).slice(0, 60) };
  } catch { return { items: [], history: [] }; }
}
export function saveCheckins(c: CheckIns) { try { localStorage.setItem(CHECKINS_KEY, JSON.stringify({ items: c.items.slice(0, 6), history: c.history.slice(0, 60) })); } catch { /* blocked */ } }
export function newCheckin(crewId: string, kind: "tip" | "plan", topic: string): CheckIn {
  return { id: `ci-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, crewId, kind, topic: clip(topic, 120), enabled: true };
}
/** A daily tip is due once a day; a weekly plan once every 7 days. */
export function isDue(item: CheckIn, history: CheckInEntry[], today: string): boolean {
  if (!item.enabled) return false;
  const mine = history.filter((h) => h.checkinId === item.id);
  if (item.kind === "tip") return !mine.some((h) => h.date === today);
  const weekAgo = addDays(today, -6);
  return !mine.some((h) => h.date >= weekAgo && h.date <= today);
}
export const dueCheckins = (c: CheckIns, today: string) => c.items.filter((i) => isDue(i, c.history, today));
export function checkinPrompt(item: CheckIn, today: string, who?: string): string {
  const me = who ? ` I am a ${who}.` : "";
  return item.kind === "tip"
    ? `Give me today's tip (${today}) on ${item.topic || "my work"}.${me} One practical, high-yield point I can use today, a short example or mnemonic, and one question to test myself (answer at the end). Under 150 words. Vary it from day to day.`
    : `Write my study plan for the week starting ${today} on ${item.topic || "my exam preparation"}.${me} A day-by-day table (Monday to Sunday) with topics, hours, active-recall tasks and one revision day, then three tips. Keep it realistic for a busy doctor.`;
}
export function addEntry(c: CheckIns, item: CheckIn, today: string, text: string): CheckIns {
  return { ...c, history: [{ id: `ce-${Date.now().toString(36)}`, checkinId: item.id, crewId: item.crewId, date: today, text: clip(text, 6000) }, ...c.history].slice(0, 60) };
}

/* ------------------------------------------------------------------ Update 37: badges and stats */

export interface CrewStats { chats: number; assistantsUsed: number; ownAssistants: number; quizBattles: number; bestQuiz: number; drillDays: number; bestStreak: number; caseRounds: number; roomMessages: number; ratings: number; facts: number; notes: number; cardsReviewed: number; collections: number; checkins: number }
export const BADGES: { id: string; name: string; desc: string; metric: keyof CrewStats; target: number }[] = [
  { id: "first", name: "First consult", desc: "Start a chat with an assistant", metric: "chats", target: 1 },
  { id: "explorer", name: "Explorer", desc: "Chat with 10 different assistants", metric: "assistantsUsed", target: 10 },
  { id: "polymath", name: "Polymath", desc: "Chat with 30 different assistants", metric: "assistantsUsed", target: 30 },
  { id: "builder", name: "Builder", desc: "Create 3 of your own assistants", metric: "ownAssistants", target: 3 },
  { id: "quiz", name: "Quiz contender", desc: "Play 5 Quiz Battles", metric: "quizBattles", target: 5 },
  { id: "champion", name: "Quiz champion", desc: "Score 100 points in one battle", metric: "bestQuiz", target: 100 },
  { id: "streak7", name: "One-week streak", desc: "7 daily drills in a row", metric: "bestStreak", target: 7 },
  { id: "streak30", name: "Iron streak", desc: "30 daily drills in a row", metric: "bestStreak", target: 30 },
  { id: "rounds", name: "Ward-round regular", desc: "Run 5 case rounds", metric: "caseRounds", target: 5 },
  { id: "rooms", name: "Team player", desc: "Send 25 messages in chat rooms", metric: "roomMessages", target: 25 },
  { id: "critic", name: "Constructive critic", desc: "Rate 10 assistant answers", metric: "ratings", target: 10 },
  { id: "memory", name: "Well known", desc: "Give your assistants 5 facts to remember", metric: "facts", target: 5 },
  { id: "notes", name: "Note keeper", desc: "Save 10 Crew notes", metric: "notes", target: 10 },
  { id: "cards", name: "Flashcard pro", desc: "Review 100 flashcards", metric: "cardsReviewed", target: 100 },
  { id: "curator", name: "Curator", desc: "Make 3 collections", metric: "collections", target: 3 },
  { id: "checkins", name: "Check-in habit", desc: "Receive 10 check-ins", metric: "checkins", target: 10 },
];
export function badges(st: CrewStats) {
  return BADGES.map((b) => ({ ...b, value: st[b.metric], earned: st[b.metric] >= b.target, progress: Math.min(1, st[b.metric] / b.target) }));
}
export function crewLevel(earned: number): { title: string; next: number | null } {
  const levels: [number, string][] = [[0, "Intern"], [3, "Resident"], [6, "Registrar"], [10, "Consultant"], [14, "Professor"]];
  const cur = [...levels].reverse().find(([n]) => earned >= n)!;
  const nxt = levels.find(([n]) => n > earned);
  return { title: cur[1], next: nxt ? nxt[0] : null };
}

/* ------------------------------------------------------------------ Update 38: compare assistants */

const sentences = (t: string) => t.replace(/[#*_`>|]/g, " ").split(/(?<=[.!?])\s+|\n+/).map((s) => s.replace(/^\s*[-•\d.)]+\s*/, "").trim()).filter((s) => s.split(/\s+/).length >= 4);
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3));
const jaccard = (a: Set<string>, b: Set<string>) => { let i = 0; a.forEach((w) => { if (b.has(w)) i++; }); return a.size + b.size - i ? i / (a.size + b.size - i) : 0; };
/** Doses and numbers with units in a text (e.g. "500 mg", "2 g", "10 mg/kg"). */
export function dosesIn(text: string): string[] {
  const m = text.match(/\b\d+(?:\.\d+)?\s?(?:mg\/kg|micrograms?|mcg|mg|g|ml\/kg|ml|units?\/kg|units?|mmol)\b/gi) ?? [];
  return [...new Set(m.map((x) => x.replace(/\s+/g, " ").toLowerCase()))].slice(0, 20);
}
export interface CompareRow { name: string; shared: string[]; unique: string[]; doses: string[] }
/** Which points each answer shares with the others, which only it makes, and its doses. */
export function compareAnswers(answers: { name: string; text: string }[], threshold = 0.3): { rows: CompareRow[]; doseOnlyIn: { dose: string; names: string[] }[] } {
  const sets = answers.map((a) => sentences(a.text).map((s) => ({ s, w: words(s) })));
  const rows = answers.map((a, i) => {
    const others = sets.filter((_, j) => j !== i).flat();
    const shared: string[] = [], unique: string[] = [];
    for (const x of sets[i]) (others.some((o) => jaccard(x.w, o.w) >= threshold) ? shared : unique).push(x.s);
    return { name: a.name, shared: shared.slice(0, 8), unique: unique.slice(0, 8), doses: dosesIn(a.text) };
  });
  const all = [...new Set(rows.flatMap((r) => r.doses))];
  const doseOnlyIn = all.map((d) => ({ dose: d, names: rows.filter((r) => r.doses.includes(d)).map((r) => r.name) })).filter((x) => x.names.length < rows.length);
  return { rows, doseOnlyIn };
}

/* ------------------------------------------------------------------ Update 38: voice chat */

export const VOICE_LANGS: { code: string; label: string }[] = [
  { code: "en-IN", label: "English (India)" }, { code: "hi-IN", label: "Hindi" }, { code: "ta-IN", label: "Tamil" }, { code: "te-IN", label: "Telugu" },
  { code: "bn-IN", label: "Bengali" }, { code: "mr-IN", label: "Marathi" }, { code: "kn-IN", label: "Kannada" }, { code: "ml-IN", label: "Malayalam" },
  { code: "gu-IN", label: "Gujarati" }, { code: "pa-IN", label: "Punjabi" }, { code: "en-GB", label: "English (UK)" }, { code: "en-US", label: "English (US)" },
];
/** Markdown made readable aloud: no symbols, tables or links. */
export function speakable(md: string): string {
  return String(md ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#|]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
/** Pieces short enough for speech engines (split at sentence ends). */
export function speechChunks(text: string, max = 180): string[] {
  const out: string[] = [];
  let cur = "";
  for (const s of text.split(/(?<=[.!?।])\s+/)) {
    if ((cur + " " + s).trim().length > max && cur) { out.push(cur.trim()); cur = ""; }
    if (s.length > max) { for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max)); continue; }
    cur = `${cur} ${s}`;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
export function voiceMessage(turns: { role: "user" | "crew"; text: string }[], text: string, language: string): string {
  const recent = turns.slice(-6).map((t) => `${t.role === "user" ? "User" : "You"}: ${t.text.slice(0, 500)}`).join("\n");
  return [
    `This is a spoken conversation. Reply in ${language}, in natural spoken sentences: no tables, headings, bullet symbols or links; under 120 words unless asked for more; give doses in words a listener can follow.`,
    recent ? `<conversation>\n${recent}\n</conversation>` : "",
    `User said: ${text}`,
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Update 38: prompt templates */

export interface PromptTemplate { id: string; crewId: string; title: string; text: string; builtIn?: boolean }
export const TEMPLATES_KEY = "cadus3.crewTemplates";
export const BUILT_IN_TEMPLATES: PromptTemplate[] = [
  { id: "tpl-rounds", builtIn: true, crewId: "crew-rounds", title: "Case summary for rounds", text: "Turn these notes into a 60-second case presentation with a problem list and today's plan:\n{notes}" },
  { id: "tpl-discharge", builtIn: true, crewId: "crew-discharge", title: "Discharge summary", text: "Write a discharge summary for a {age}-year-old admitted with {diagnosis}. Notes:\n{notes}" },
  { id: "tpl-drugcheck", builtIn: true, crewId: "crew-pharmacist", title: "Medicine check", text: "Check these medicines for interactions, doses and kidney adjustment (eGFR {egfr}):\n{medicines}" },
  { id: "tpl-mcq", builtIn: true, crewId: "crew-neetpg", title: "10 MCQs on a topic", text: "Write 10 NEET-PG style MCQs on {topic} with answers and one-line explanations." },
  { id: "tpl-viva", builtIn: true, crewId: "crew-viva", title: "Viva on a topic", text: "Take a viva on {topic}: one question at a time, then score me out of 10." },
  { id: "tpl-explain", builtIn: true, crewId: "crew-patient", title: "Explain to a patient", text: "Explain {condition} and its treatment to a patient in simple {language}, with warning signs and follow-up." },
  { id: "tpl-ddx", builtIn: true, crewId: "", title: "Differential diagnosis", text: "A {age}-year-old {sex} with {complaint}. Give the top differential diagnoses with the key features for and against each, and the first investigations." },
  { id: "tpl-abstract", builtIn: true, crewId: "crew-thesis", title: "Structured abstract", text: "Write a 250-word structured abstract (background, methods, results, conclusion) from:\n{text}" },
];
export function readTemplates(): PromptTemplate[] {
  try {
    const v = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((t) => t && typeof t.title === "string" && typeof t.text === "string").slice(0, 50)
      .map((t) => ({ id: String(t.id), crewId: String(t.crewId ?? ""), title: clip(t.title, 60), text: clip(t.text, 3000) }));
  } catch { return []; }
}
export function saveTemplates(list: PromptTemplate[]) { try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list.filter((t) => !t.builtIn).slice(0, 50))); } catch { /* blocked */ } }
export function newTemplate(crewId: string, title: string, text: string): PromptTemplate | null {
  const t = clip(title, 60), x = clip(text, 3000);
  if (!t || !x) return null;
  return { id: `tpl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, crewId, title: t, text: x };
}
/** The {placeholders} in a template, in order, without repeats. */
export const templateFields = (text: string) => [...new Set([...text.matchAll(/\{([a-z][a-z0-9 _-]{0,30})\}/gi)].map((m) => m[1]))];
export const fillTemplate = (text: string, values: Record<string, string>) => text.replace(/\{([a-z][a-z0-9 _-]{0,30})\}/gi, (all, k: string) => (values[k]?.trim() ? values[k].trim() : all));

/* ------------------------------------------------------------------ Update 38: Crew timeline */

export type TimelineKind = "chat" | "huddle" | "debate" | "playbook" | "quiz" | "drill" | "caseround" | "room" | "note" | "checkin";
export interface TimelineEvent { at: number; kind: TimelineKind; title: string; detail: string }
export const TIMELINE_LABELS: Record<TimelineKind, string> = { chat: "Chat", huddle: "Huddle", debate: "Debate", playbook: "Playbook", quiz: "Quiz Battle", drill: "Daily drill", caseround: "Case round", room: "Chat room", note: "Note", checkin: "Check-in" };
const dayStart = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 12).getTime(); };
export function buildTimeline(src: {
  chats?: { at: number; title: string; crew: string }[];
  huddles?: Huddle[]; debates?: Debate[]; runs?: PlaybookRun[]; quiz?: QuizResult[]; drill?: DrillState; rounds?: CaseRound[]; rooms?: CrewRoom[]; notes?: CrewNote[]; checkins?: CheckInEntry[];
  crewName?: (id: string) => string;
}): TimelineEvent[] {
  const nm = src.crewName ?? ((id: string) => id);
  const ev: TimelineEvent[] = [
    ...(src.chats ?? []).map((c) => ({ at: c.at, kind: "chat" as const, title: c.title || "Chat", detail: `with ${c.crew}` })),
    ...(src.huddles ?? []).map((h) => ({ at: h.at, kind: "huddle" as const, title: h.question.slice(0, 120), detail: `${h.answers.length} assistants` })),
    ...(src.debates ?? []).map((d) => ({ at: d.at, kind: "debate" as const, title: d.question.slice(0, 120), detail: `${d.a.name} vs ${d.b.name}${d.verdict ? `: ${d.verdict.bottomLine.slice(0, 120)}` : ""}` })),
    ...(src.runs ?? []).map((r) => ({ at: r.at, kind: "playbook" as const, title: r.playbookName, detail: r.input.slice(0, 120) })),
    ...(src.quiz ?? []).map((q) => ({ at: q.at, kind: "quiz" as const, title: q.topic || "Quiz", detail: q.players.map((p) => `${p.name} ${p.score} (${p.correct}/${p.total})`).join(" vs ") })),
    ...Object.entries(src.drill?.days ?? {}).map(([k, d]) => ({ at: dayStart(k), kind: "drill" as const, title: d.topic, detail: `${d.correct}/${d.total} right` })),
    ...(src.rounds ?? []).map((r) => ({ at: r.at, kind: "caseround" as const, title: r.caseText.slice(0, 120), detail: r.steps.map((s) => s.name).join(", ") })),
    ...(src.rooms ?? []).filter((r) => r.messages.length).map((r) => ({ at: r.updatedAt, kind: "room" as const, title: r.name, detail: `${r.messages.length} messages` })),
    ...(src.notes ?? []).map((n) => ({ at: n.at, kind: "note" as const, title: n.title, detail: `from ${nm(n.crewId)}${n.cards?.length ? `, ${n.cards.length} flashcards` : ""}` })),
    ...(src.checkins ?? []).map((c) => ({ at: dayStart(c.date), kind: "checkin" as const, title: `Check-in from ${nm(c.crewId)}`, detail: c.text.replace(/\s+/g, " ").slice(0, 140) })),
  ];
  return ev.filter((e) => Number.isFinite(e.at)).sort((a, b) => b.at - a.at);
}
export function filterTimeline(ev: TimelineEvent[], kinds: TimelineKind[], days: number | null, now = Date.now()): TimelineEvent[] {
  return ev.filter((e) => (!kinds.length || kinds.includes(e.kind)) && (days === null || e.at >= now - days * 86400000));
}
export function timelineMd(ev: TimelineEvent[]): string {
  const groups = new Map<string, TimelineEvent[]>();
  for (const e of ev) { const k = dateKey(new Date(e.at)); groups.set(k, [...(groups.get(k) ?? []), e]); }
  return ["# My Cadus Crew timeline", "", ...[...groups.entries()].flatMap(([k, list]) => [`## ${k}`, ...list.map((e) => `- **${TIMELINE_LABELS[e.kind]}:** ${e.title}${e.detail ? ` — ${e.detail}` : ""}`), ""])].join("\n");
}

/* ------------------------------------------------------------------ Update 39: personas */

export const GREETING_MAX = 200;
export const SIGNOFF_MAX = 80;
/** An avatar: up to two characters (letters, digits or one emoji), or "". */
export function cleanAvatar(v: unknown): string {
  if (typeof v !== "string") return "";
  const chars = [...v.trim().replace(/\s+/g, "")];
  if (!chars.length) return "";
  const emoji = /\p{Extended_Pictographic}/u.test(chars[0]);
  if (emoji) { const seg = (globalThis as any).Intl?.Segmenter ? [...new (Intl as any).Segmenter(undefined, { granularity: "grapheme" }).segment(v.trim())].map((x: any) => x.segment) : chars; return seg[0] ?? ""; }
  return chars.filter((c) => /[\p{L}\p{N}]/u.test(c)).slice(0, 2).join("").toUpperCase();
}

/* ------------------------------------------------------------------ Update 39: workspaces */

export interface CrewWorkspace { id: string; name: string; crewIds: string[]; templateIds: string[]; noteIds: string[]; createdAt: number }
export interface CrewWorkspaces { list: CrewWorkspace[]; active: string }
export const WORKSPACES_KEY = "cadus3.crewWorkspaces";
export const WORKSPACE_MAX = 12;
export function readWorkspaces(): CrewWorkspaces {
  try {
    const v = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || "null");
    const list = (Array.isArray(v?.list) ? v.list : []).filter((w: any) => w && typeof w.name === "string").slice(0, WORKSPACE_MAX).map((w: any) => ({
      id: String(w.id), name: clip(w.name, 40), crewIds: (Array.isArray(w.crewIds) ? w.crewIds : []).map(String).slice(0, 12), templateIds: (Array.isArray(w.templateIds) ? w.templateIds : []).map(String).slice(0, 20), noteIds: (Array.isArray(w.noteIds) ? w.noteIds : []).map(String).slice(0, 50), createdAt: Number(w.createdAt) || Date.now(),
    }));
    return { list, active: list.some((w: CrewWorkspace) => w.id === v?.active) ? String(v.active) : "" };
  } catch { return { list: [], active: "" }; }
}
export function saveWorkspaces(w: CrewWorkspaces) { try { localStorage.setItem(WORKSPACES_KEY, JSON.stringify(w)); } catch { /* blocked */ } }
export function newWorkspace(name: string, crewIds: string[] = []): CrewWorkspace | null {
  const n = clip(name, 40).replace(/\s+/g, " ");
  if (!n) return null;
  return { id: `ws-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: n, crewIds: [...new Set(crewIds)].slice(0, 12), templateIds: [], noteIds: [], createdAt: Date.now() };
}
export function toggleWsItem(w: CrewWorkspace, field: "crewIds" | "templateIds" | "noteIds", id: string): CrewWorkspace {
  const max = field === "crewIds" ? 12 : field === "templateIds" ? 20 : 50;
  const has = w[field].includes(id);
  return { ...w, [field]: has ? w[field].filter((x) => x !== id) : [...w[field], id].slice(0, max) };
}
export const WORKSPACE_IDEAS: { name: string; crewIds: string[] }[] = [
  { name: "Surgery posting", crewIds: ["crew-surgery", "crew-anaes", "crew-gisurg", "crew-uro", "crew-discharge"] },
  { name: "Medicine posting", crewIds: ["crew-rounds", "crew-cardio", "crew-nephro", "crew-pharmacist", "crew-discharge"] },
  { name: "NEET-PG prep", crewIds: ["crew-neetpg", "crew-viva", "crew-anatomy", "crew-pharmacology", "crew-micro"] },
  { name: "Paediatrics posting", crewIds: ["crew-paeds", "crew-neonat", "crew-paedcardio", "crew-patient"] },
  { name: "Thesis year", crewIds: ["crew-thesis", "crew-biostat", "crew-sysreview", "crew-medwriter", "crew-ethics"] },
];

/* ------------------------------------------------------------------ Update 39: fact-check */

export interface FactItem { claim: string; verdict: "ok" | "flag" | "unsure"; note: string }
export function factCheckPrompt(question: string, answer: string): string {
  return [
    "Fact-check the answer below as a careful senior colleague. Check every drug dose, route and frequency, every number and threshold, every guideline claim and every safety statement.",
    'Reply with ONLY JSON: {"summary":"one line overall verdict","items":[{"claim":"short quote or paraphrase","verdict":"ok" | "flag" | "unsure","note":"why, and the correct value if flagged"}]}. Include up to 12 of the most important claims, flagged ones first.',
    question ? `<question>\n${question.slice(0, 2000)}\n</question>` : "",
    `<answer>\n${answer.slice(0, 8000)}\n</answer>`,
  ].filter(Boolean).join("\n\n");
}
export function parseFactCheck(text: string): { summary: string; items: FactItem[] } | null {
  const t = String(text ?? ""), a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    const items: FactItem[] = (Array.isArray(v?.items) ? v.items : []).map((x: any): FactItem | null => {
      const claim = clip(x?.claim, 300), verdict = x?.verdict === "ok" || x?.verdict === "flag" ? x.verdict : "unsure";
      return claim ? { claim, verdict, note: clip(x?.note, 500) } : null;
    }).filter((x: FactItem | null): x is FactItem => !!x).slice(0, 12);
    const order = { flag: 0, unsure: 1, ok: 2 } as const;
    items.sort((p: FactItem, q: FactItem) => order[p.verdict] - order[q.verdict]);
    return { summary: clip(v?.summary, 300), items };
  } catch { return null; }
}

/* ------------------------------------------------------------------ Update 39: digest */

export interface DigestInput {
  chats: { at: number; crewId: string; question: string }[];
  quiz: QuizResult[]; drill: DrillState; rounds: CaseRound[]; notes: CrewNote[]; checkins: CheckInEntry[]; ratings: Record<string, CrewRating[]>;
  crewName: (id: string) => string;
}
export interface Digest { from: number; to: number; chats: number; topCrew: { name: string; n: number }[]; questions: string[]; quizzes: number; quizAccuracy: number | null; drillDays: number; drillAccuracy: number | null; weak: { topic: string; pct: number }[]; rounds: number; notes: string[]; checkins: number; flagged: number }
export function buildDigest(x: DigestInput, now: number, days: number): Digest {
  const from = now - days * 86400000;
  const inP = (at: number) => at >= from && at <= now;
  const chats = x.chats.filter((c) => inP(c.at));
  const counts = new Map<string, number>();
  chats.forEach((c) => counts.set(c.crewId, (counts.get(c.crewId) ?? 0) + 1));
  const quiz = x.quiz.filter((q) => inP(q.at));
  const qc = quiz.reduce((n, q) => n + (q.players[0]?.correct ?? 0), 0), qt = quiz.reduce((n, q) => n + (q.players[0]?.total ?? 0), 0);
  const ddays = Object.entries(x.drill.days).filter(([k]) => { const [y, m, d] = k.split("-").map(Number); return inP(new Date(y, m - 1, d, 12).getTime()); });
  const dc = ddays.reduce((n, [, d]) => n + d.correct, 0), dt = ddays.reduce((n, [, d]) => n + d.total, 0);
  return {
    from, to: now, chats: chats.length,
    topCrew: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ name: x.crewName(id), n })),
    questions: chats.slice().sort((a, b) => b.at - a.at).map((c) => c.question).filter(Boolean).slice(0, 8),
    quizzes: quiz.length, quizAccuracy: qt ? Math.round((qc / qt) * 100) : null,
    drillDays: ddays.length, drillAccuracy: dt ? Math.round((dc / dt) * 100) : null,
    weak: weakTopics(x.drill, 3).slice(0, 3).map((w) => ({ topic: w.topic, pct: w.pct })),
    rounds: x.rounds.filter((r) => inP(r.at)).length,
    notes: x.notes.filter((n) => inP(n.at)).map((n) => n.title).slice(0, 8),
    checkins: x.checkins.filter((c) => { const [y, m, d] = c.date.split("-").map(Number); return inP(new Date(y, m - 1, d, 12).getTime()); }).length,
    flagged: Object.values(x.ratings).flat().filter((r) => r.vote === "down" && inP(r.at)).length,
  };
}
export function digestMd(d: Digest): string {
  const day = (t: number) => dateKey(new Date(t));
  return [
    `# Cadus Crew digest: ${day(d.from)} to ${day(d.to)}`, "",
    `- **${d.chats}** chats with assistants${d.topCrew.length ? `; most used: ${d.topCrew.map((t) => `${t.name} (${t.n})`).join(", ")}` : ""}`,
    `- **${d.quizzes}** quiz battles${d.quizAccuracy !== null ? ` (${d.quizAccuracy}% right)` : ""}; **${d.drillDays}** daily drills${d.drillAccuracy !== null ? ` (${d.drillAccuracy}% right)` : ""}`,
    `- **${d.rounds}** case rounds; **${d.checkins}** check-ins; **${d.flagged}** answers marked not helpful`,
    ...(d.weak.length ? ["", "## Topics to revise", ...d.weak.map((w) => `- ${w.topic}: ${w.pct}%`)] : []),
    ...(d.questions.length ? ["", "## Recent questions", ...d.questions.map((q) => `- ${q}`)] : []),
    ...(d.notes.length ? ["", "## Notes saved", ...d.notes.map((n) => `- ${n}`)] : []),
  ].join("\n");
}

/* ------------------------------------------------------------------ Update 40: translations */

export function translatePrompt(text: string, language: string): string {
  return [
    `Translate the medical text below into ${language} for a patient or colleague. Keep the meaning exactly; keep every number, dose, unit and drug name unchanged (write drug names in English, with the ${language} spelling in brackets the first time).`,
    "Keep headings and bullet points. Reply with only the translation.",
    `<text>\n${text.slice(0, 8000)}\n</text>`,
  ].join("\n\n");
}
/** Numbers in a text (doses, values), for checking a translation dropped none. */
export const numbersIn = (t: string) => (String(t).match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
export function missingNumbers(original: string, translated: string): string[] {
  const have = new Map<string, number>();
  numbersIn(translated).forEach((n) => have.set(n, (have.get(n) ?? 0) + 1));
  const missing: string[] = [];
  for (const n of numbersIn(original)) { const k = have.get(n) ?? 0; if (k > 0) have.set(n, k - 1); else missing.push(n); }
  return [...new Set(missing)];
}

/* ------------------------------------------------------------------ Update 40: share cards */

/** Lines for a card, wrapped to a width with a measuring function (canvas measureText in the app). */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines = 18): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n+/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (measure(t) <= maxWidth || !line) line = t; else { out.push(line); line = w; }
      if (out.length >= maxLines) break;
    }
    if (line && out.length < maxLines) out.push(line);
    if (out.length >= maxLines) break;
  }
  const full = text.split(/\s+/).filter(Boolean).length, used = out.join(" ").split(/\s+/).filter(Boolean).length;
  if (used < full && out.length) out[out.length - 1] = `${out[out.length - 1].replace(/[.,;:]?$/, "")}…`;
  return out;
}
/** Card body: plain text from markdown, bullets kept as "•". */
export function cardText(md: string, max = 900): string {
  const t = String(md ?? "").replace(/```[\s\S]*?```/g, " ").replace(/^\s*\|.*\|\s*$/gm, "").replace(/^#{1,6}\s*/gm, "").replace(/^\s*[-*]\s+/gm, "• ").replace(/[*_`>]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > max ? `${t.slice(0, max).replace(/\s+\S*$/, "")}…` : t;
}

/* ------------------------------------------------------------------ Update 40: assistant schedules */

export interface CrewSchedule { id: string; crewId: string; prompt: string; days: number[]; time: string; enabled: boolean; lastDone: string }
export const SCHEDULES_KEY = "cadus3.crewSchedules";
export const SCHEDULE_MAX = 10;
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function readSchedules(): CrewSchedule[] {
  try {
    const v = JSON.parse(localStorage.getItem(SCHEDULES_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((x) => x && x.crewId && typeof x.prompt === "string").slice(0, SCHEDULE_MAX).map((x) => ({
      id: String(x.id), crewId: String(x.crewId), prompt: clip(x.prompt, 1000), days: (Array.isArray(x.days) ? x.days : []).map(Number).filter((d: number) => d >= 0 && d <= 6), time: /^\d{2}:\d{2}$/.test(x.time) ? x.time : "19:00", enabled: x.enabled !== false, lastDone: String(x.lastDone ?? ""),
    }));
  } catch { return []; }
}
export function saveSchedules(l: CrewSchedule[]) { try { localStorage.setItem(SCHEDULES_KEY, JSON.stringify(l.slice(0, SCHEDULE_MAX))); } catch { /* blocked */ } }
export function newSchedule(crewId: string, prompt: string, days: number[], time: string): CrewSchedule | null {
  const p = clip(prompt, 1000);
  if (!p || !days.length || !/^\d{2}:\d{2}$/.test(time)) return null;
  return { id: `sch-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, crewId, prompt: p, days: [...new Set(days)].sort(), time, enabled: true, lastDone: "" };
}
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
/** Due now: enabled, today is one of its days, the time has passed and it was not done today. */
export const schedDue = (list: CrewSchedule[], now: Date) => list.filter((x) => x.enabled && x.days.includes(now.getDay()) && hm(now) >= x.time && x.lastDone !== dateKey(now));
export function nextRun(x: CrewSchedule, now: Date): string {
  if (!x.enabled || !x.days.length) return "Paused";
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (!x.days.includes(d.getDay())) continue;
    if (i === 0 && (x.lastDone === dateKey(now) || hm(now) >= x.time)) { if (x.lastDone !== dateKey(now)) return "Due now"; continue; }
    return `${i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()]} at ${x.time}`;
  }
  return "Paused";
}
export const SCHEDULE_IDEAS: { label: string; crewId: string; prompt: string; days: number[]; time: string }[] = [
  { label: "Evening viva", crewId: "crew-viva", prompt: "Ask me 3 viva questions on a high-yield topic, one at a time, and score me.", days: [1, 2, 3, 4, 5], time: "20:00" },
  { label: "Morning MCQs", crewId: "crew-neetpg", prompt: "Give me 5 NEET-PG MCQs on a random subject with answers at the end.", days: [1, 2, 3, 4, 5, 6], time: "07:30" },
  { label: "Weekly ECG", crewId: "crew-ecg", prompt: "Describe an ECG case in words and ask me to interpret it step by step.", days: [0], time: "10:00" },
  { label: "Drug of the day", crewId: "crew-pharmacist", prompt: "Teach me one commonly used drug today: dose, key interactions, and one safety pearl.", days: [0, 1, 2, 3, 4, 5, 6], time: "08:00" },
];

/* ------------------------------------------------------------------ Update 41: plain-language rewrite */

export const PLAIN_LEVELS: { id: "simple" | "very-simple" | "child"; label: string; how: string }[] = [
  { id: "simple", label: "Simple (age 12 reading)", how: "plain everyday words, short sentences, explain any medical term in brackets" },
  { id: "very-simple", label: "Very simple (age 8 reading)", how: "very short sentences of under 12 words, the most common words only, no medical terms" },
  { id: "child", label: "For a child", how: "talk kindly to a 7-year-old, use a simple comparison, keep it to a few sentences" },
];
export function plainPrompt(text: string, level: "simple" | "very-simple" | "child", language: string): string {
  const l = PLAIN_LEVELS.find((x) => x.id === level) ?? PLAIN_LEVELS[0];
  return [
    `Rewrite the medical text below for a patient${level === "child" ? " who is a child" : ""}, in ${language}: ${l.how}.`,
    "Keep every medicine name, dose, number and warning exactly. Keep it as a few short bullet points under 3 headings: What it is, What to do, When to get help. Do not add new medical advice. Reply with only the rewrite.",
    `<text>\n${text.slice(0, 8000)}\n</text>`,
  ].join("\n\n");
}
const syllables = (w: string) => { const s = w.toLowerCase().replace(/[^a-z]/g, ""); if (!s) return 0; if (s.length <= 3) return 1; const m = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g); return Math.max(1, m ? m.length : 1); };
/** Flesch reading ease for English text (higher is easier); null if too short or not English. */
export function readingEase(text: string): number | null {
  const t = String(text ?? "").replace(/[#*_>`|-]/g, " ");
  const words: string[] = t.match(/[A-Za-z][A-Za-z'’]*/g) ?? [];
  if (words.length < 8) return null;
  const sentences = Math.max(1, (t.match(/[.!?](\s|$)|\n+/g) ?? []).length);
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  return Math.round(206.835 - 1.015 * (words.length / sentences) - 84.6 * (syl / words.length));
}
export const easeLabel = (n: number) => (n >= 80 ? "very easy" : n >= 70 ? "easy" : n >= 60 ? "plain English" : n >= 50 ? "fairly hard" : n >= 30 ? "hard" : "very hard");

/* ------------------------------------------------------------------ Update 41: mistake notebook */

export interface Mistake { id: string; q: string; options: string[]; answer: number; why: string; crewId: string; topic: string; at: number; wrong: number; streak: number; mastered: boolean }
export const MISTAKES_KEY = "cadus3.crewMistakes";
export const MISTAKES_MAX = 200;
export function readMistakes(): Mistake[] {
  try {
    const v = JSON.parse(localStorage.getItem(MISTAKES_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((x) => x && typeof x.q === "string" && Array.isArray(x.options) && x.options.length >= 2).slice(0, MISTAKES_MAX).map((x) => ({
      id: String(x.id), q: clip(x.q, 600), options: x.options.slice(0, 6).map((o: unknown) => clip(o, 200)), answer: Math.max(0, Math.min(x.options.length - 1, Number(x.answer) || 0)), why: clip(x.why, 800),
      crewId: String(x.crewId ?? ""), topic: clip(x.topic, 120), at: Number(x.at) || 0, wrong: Math.max(1, Number(x.wrong) || 1), streak: Math.max(0, Number(x.streak) || 0), mastered: x.mastered === true,
    }));
  } catch { return []; }
}
export function saveMistakes(l: Mistake[]) { try { localStorage.setItem(MISTAKES_KEY, JSON.stringify(l.slice(0, MISTAKES_MAX))); } catch { /* blocked */ } }
const qKey = (q: string) => q.toLowerCase().replace(/\W+/g, " ").trim();
export function addMistake(list: Mistake[], m: { q: string; options: string[]; answer: number; why: string; crewId: string; topic: string }, now = Date.now()): Mistake[] {
  const k = qKey(m.q);
  const i = list.findIndex((x) => qKey(x.q) === k);
  if (i >= 0) return list.map((x, j) => (j === i ? { ...x, wrong: x.wrong + 1, streak: 0, mastered: false, at: now } : x));
  const item: Mistake = { id: `mk-${now.toString(36)}${Math.random().toString(36).slice(2, 5)}`, q: clip(m.q, 600), options: m.options.slice(0, 6).map((o) => clip(o, 200)), answer: m.answer, why: clip(m.why, 800), crewId: m.crewId, topic: clip(m.topic, 120), at: now, wrong: 1, streak: 0, mastered: false };
  return [item, ...list].slice(0, MISTAKES_MAX);
}
/** Two right in a row masters a mistake; a wrong answer resets the streak. */
export function retestMistake(list: Mistake[], id: string, right: boolean): Mistake[] {
  return list.map((x) => (x.id !== id ? x : right ? { ...x, streak: x.streak + 1, mastered: x.streak + 1 >= 2 } : { ...x, wrong: x.wrong + 1, streak: 0, mastered: false }));
}
export const dueMistakes = (list: Mistake[]) => list.filter((x) => !x.mastered).sort((a, b) => b.wrong - a.wrong || a.at - b.at);

/* ------------------------------------------------------------------ Update 41: exam countdown */

export const EXAMS: { id: string; name: string }[] = [
  { id: "neetpg", name: "NEET-PG" }, { id: "inicet", name: "INI-CET" }, { id: "fmge", name: "FMGE" }, { id: "neetss", name: "NEET-SS" }, { id: "usmle1", name: "USMLE Step 1" }, { id: "custom", name: "Other exam" },
];
export const EXAM_SUBJECTS: [string, string][] = [
  ["Anatomy", "crew-firstyear"], ["Physiology", "crew-firstyear"], ["Biochemistry", "crew-firstyear"], ["Pathology", "crew-path"], ["Pharmacology", "crew-pharmacist"], ["Microbiology", "crew-path"],
  ["Forensic Medicine", "crew-forensic"], ["Community Medicine (PSM)", "crew-psm"], ["ENT", "crew-ent"], ["Ophthalmology", "crew-ophthal"], ["Medicine", "crew-rounds"], ["Surgery", "crew-surgery"],
  ["Obstetrics & Gynaecology", "crew-obg"], ["Paediatrics", "crew-paeds"], ["Orthopaedics", "crew-ortho"], ["Dermatology", "crew-derm"], ["Psychiatry", "crew-psych"], ["Anaesthesia", "crew-anaes"], ["Radiology", "crew-radiology"],
];
export interface ExamState { exam: string; name: string; date: string; done: string[] }
export const EXAM_KEY = "cadus3.crewExam";
export function readExam(): ExamState | null {
  try {
    const v = JSON.parse(localStorage.getItem(EXAM_KEY) || "null");
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(String(v.date))) return null;
    const names = EXAM_SUBJECTS.map((s) => s[0]);
    return { exam: EXAMS.some((e) => e.id === v.exam) ? v.exam : "custom", name: clip(v.name, 60), date: v.date, done: (Array.isArray(v.done) ? v.done : []).filter((d: string) => names.includes(d)) };
  } catch { return null; }
}
export function saveExam(s: ExamState | null) { try { if (s) localStorage.setItem(EXAM_KEY, JSON.stringify(s)); else localStorage.removeItem(EXAM_KEY); } catch { /* blocked */ } }
const dayNum = (key: string) => { const [y, m, d] = key.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export function examPlan(s: ExamState, today: string): { daysLeft: number; remaining: string[]; revisionDays: number; daysPerSubject: number | null; next: [string, string] | null; phase: "past" | "study" | "revision" | "done"; text: string } {
  const daysLeft = dayNum(s.date) - dayNum(today);
  const remaining = EXAM_SUBJECTS.map((x) => x[0]).filter((n) => !s.done.includes(n));
  const next = EXAM_SUBJECTS.find((x) => remaining.includes(x[0])) ?? null;
  const revisionDays = Math.max(7, Math.round(daysLeft * 0.15));
  const examName = s.exam === "custom" ? s.name || "Your exam" : EXAMS.find((e) => e.id === s.exam)?.name ?? "Your exam";
  if (daysLeft < 0) return { daysLeft, remaining, revisionDays: 0, daysPerSubject: null, next, phase: "past", text: `${examName} was ${-daysLeft} day${daysLeft === -1 ? "" : "s"} ago. Set the next exam date.` };
  if (!remaining.length) return { daysLeft, remaining, revisionDays, daysPerSubject: null, next: null, phase: "done", text: `${examName} in ${daysLeft} days: every subject done. Grand tests and revising your mistakes now.` };
  const study = daysLeft - revisionDays;
  if (study <= 0) return { daysLeft, remaining, revisionDays: daysLeft, daysPerSubject: null, next, phase: "revision", text: `${examName} in ${daysLeft} day${daysLeft === 1 ? "" : "s"}: revision time. Focus on high-yield topics and mistakes in ${remaining.length} remaining subject${remaining.length === 1 ? "" : "s"}.` };
  const dps = Math.round((study / remaining.length) * 10) / 10;
  return { daysLeft, remaining, revisionDays, daysPerSubject: dps, next, phase: "study", text: `${examName} in ${daysLeft} days: ${remaining.length} subject${remaining.length === 1 ? "" : "s"} left, about ${dps} day${dps === 1 ? "" : "s"} each, keeping the last ${revisionDays} days for revision.` };
}

/* ------------------------------------------------------------------ Update 41: pinned answers */

export const PINS_KEY = "cadus3.chatPins";
export const PIN_MAX = 10;
export function readPins(): Record<string, string[]> {
  try {
    const v = JSON.parse(localStorage.getItem(PINS_KEY) || "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, string[]> = {};
    for (const [k, ids] of Object.entries(v).slice(0, 100)) if (Array.isArray(ids)) out[k] = ids.map(String).slice(0, PIN_MAX);
    return out;
  } catch { return {}; }
}
export function savePins(m: Record<string, string[]>) { try { localStorage.setItem(PINS_KEY, JSON.stringify(m)); } catch { /* blocked */ } }
export function togglePin(m: Record<string, string[]>, sid: string, mid: string): Record<string, string[]> | null {
  const cur = m[sid] ?? [];
  if (cur.includes(mid)) { const next = cur.filter((x) => x !== mid); const out = { ...m }; if (next.length) out[sid] = next; else delete out[sid]; return out; }
  if (cur.length >= PIN_MAX) return null;
  return { ...m, [sid]: [...cur, mid] };
}
export function pinLabel(md: string, max = 70): string {
  const line = String(md ?? "").split("\n").map((l) => l.replace(/^[#>*\-\s]+/, "").replace(/[*_`]/g, "").trim()).find((l) => l.length > 0) ?? "Answer";
  return line.length > max ? `${line.slice(0, max).replace(/\s+\S*$/, "")}…` : line;
}

/* ------------------------------------------------------------------ Update 42: branch chat */

/** The messages up to and including one message, for a new chat that branches from it. */
export function branchMessages<T extends { id: string }>(msgs: T[], mid: string): T[] {
  const i = msgs.findIndex((m) => m.id === mid);
  return i < 0 ? [] : msgs.slice(0, i + 1).map((m) => ({ ...m }));
}
export const branchTitle = (title: string) => `Branch: ${String(title || "Chat").replace(/^Branch: /, "")}`.slice(0, 80);

/* ------------------------------------------------------------------ Update 42: answer remix */

export const REMIX_KINDS: { id: string; label: string; ask: string }[] = [
  { id: "shorter", label: "Shorter", ask: "Rewrite that answer in under 120 words, keeping every dose, number and safety point." },
  { id: "table", label: "As a table", ask: "Turn that answer into a clear comparison table (with a one-line summary above it). Keep every dose and number." },
  { id: "exam", label: "As an exam answer", ask: "Rewrite that answer as a 10-mark university theory answer: introduction, headings, labelled flowchart or table, and a short conclusion." },
  { id: "mnemonic", label: "With mnemonics", ask: "Rewrite that answer as high-yield revision points and add memorable mnemonics where they help." },
  { id: "viva", label: "As viva questions", ask: "Turn that answer into 6 viva questions an examiner might ask, each with a model answer in 1–2 lines." },
  { id: "patient", label: "For a patient", ask: "Explain that answer to a patient in simple words at an age-12 reading level, without medical jargon, keeping doses exact." },
];
export function remixPrompt(kind: string, answer: string): string {
  const k = REMIX_KINDS.find((x) => x.id === kind) ?? REMIX_KINDS[0];
  const start = String(answer ?? "").replace(/[#*_>`|]/g, "").replace(/\s+/g, " ").trim().slice(0, 90);
  return `${k.ask}\n\n(The answer that begins: "${start}${start.length >= 90 ? "…" : ""}")`;
}

/* ------------------------------------------------------------------ Update 42: reading list */

export interface ReadingItem { id: string; title: string; url: string; pmid: string; doi: string; note: string; read: boolean; at: number; crewId: string }
export const READING_KEY = "cadus3.crewReading";
export const READING_MAX = 300;
export function readReading(): ReadingItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(READING_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((x) => x && (x.title || x.url || x.pmid || x.doi)).slice(0, READING_MAX).map((x) => ({
      id: String(x.id), title: clip(x.title, 300), url: /^https?:\/\//.test(String(x.url)) ? clip(x.url, 600) : "", pmid: /^\d{5,9}$/.test(String(x.pmid)) ? String(x.pmid) : "", doi: clip(x.doi, 200), note: clip(x.note, 1000), read: x.read === true, at: Number(x.at) || 0, crewId: String(x.crewId ?? ""),
    }));
  } catch { return []; }
}
export function saveReading(l: ReadingItem[]) { try { localStorage.setItem(READING_KEY, JSON.stringify(l.slice(0, READING_MAX))); } catch { /* blocked */ } }
export type RefFound = { title: string; url: string; pmid: string; doi: string };
/** References in an answer: its source list, PMIDs, DOIs, links, and lines under a References/Sources heading. */
export function extractRefs(md: string, sources: { url: string; title: string }[] = []): RefFound[] {
  const out: RefFound[] = [];
  const text = String(md ?? "");
  for (const s of sources) if (s && /^https?:\/\//.test(s.url)) out.push({ title: clip(s.title, 300) || s.url, url: s.url, pmid: (/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{5,9})/.exec(s.url) ?? [])[1] ?? "", doi: (/doi\.org\/(10\.\d{4,9}\/[^\s?#]+)/i.exec(s.url) ?? [])[1] ?? "" });
  const lines = text.split("\n");
  let inRefs = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{1,6}\s*(references|sources|further reading|bibliography)\b/i.test(line) || /^\*\*(references|sources)\*\*:?$/i.test(line) || /^(references|sources):?$/i.test(line)) { inRefs = true; continue; }
    if (inRefs && /^#{1,6}\s/.test(line)) inRefs = false;
    const pmid = (/\bPMID:?\s*(\d{5,9})\b/i.exec(line) ?? [])[1] ?? "";
    const doi = ((/\b(10\.\d{4,9}\/[^\s)\]>,;]+)/.exec(line) ?? [])[1] ?? "").replace(/[.]$/, "");
    const url = ((/(https?:\/\/[^\s)\]>]+)/.exec(line) ?? [])[1] ?? "").replace(/[.,]$/, "");
    const isRefLine = inRefs && /^(\d+[.)]|[-*•]|\[\d+\])\s+\S/.test(line);
    if (!pmid && !doi && !url && !isRefLine) continue;
    const title = line.replace(/^(\d+[.)]|[-*•]|\[\d+\])\s+/, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/https?:\/\/\S+/g, "").replace(/\b(PMID|doi):?\s*\S+/gi, "").replace(/[*_`]/g, "").replace(/\s{2,}/g, " ").replace(/[\s.,;:-]+$/, "").trim();
    out.push({ title: clip(title, 300) || url || (pmid ? `PMID ${pmid}` : doi), url, pmid, doi });
  }
  const seen = new Set<string>();
  return out.filter((r) => { const k = (r.pmid || r.doi || r.url || r.title).toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
}
export function addReading(list: ReadingItem[], refs: RefFound[], crewId: string, now = Date.now()): { list: ReadingItem[]; added: number } {
  const key = (r: { pmid: string; doi: string; url: string; title: string }) => (r.pmid || r.doi || r.url || r.title).toLowerCase();
  const have = new Set(list.map(key));
  const fresh = refs.filter((r) => !have.has(key(r))).map((r, i) => ({ id: `rd-${now.toString(36)}${i}${Math.random().toString(36).slice(2, 5)}`, title: r.title, url: r.url, pmid: r.pmid, doi: r.doi, note: "", read: false, at: now, crewId }));
  return { list: [...fresh, ...list].slice(0, READING_MAX), added: fresh.length };
}
export function refLink(r: { url: string; pmid: string; doi: string; title: string }): string {
  if (r.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`;
  if (r.doi) return `https://doi.org/${r.doi}`;
  if (r.url) return r.url;
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(r.title.slice(0, 200))}`;
}
export function readingMarkdown(list: ReadingItem[]): string {
  return ["# Reading list", "", ...list.map((r, i) => `${i + 1}. ${r.title}${r.pmid ? ` PMID: ${r.pmid}.` : ""}${r.doi ? ` doi: ${r.doi}.` : ""} ${refLink(r)}${r.read ? " (read)" : ""}${r.note ? `\n   Note: ${r.note}` : ""}`)].join("\n");
}

/* ------------------------------------------------------------------ Update 42: compressed share codes for QR */

const toB64url = (bytes: Uint8Array) => { let bin = ""; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (ch) => ch.charCodeAt(0));
async function pipeBytes(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
export const canCompress = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
/** A shorter, compressed share code (with persona) so longer assistants fit in a QR code. */
export async function crewShareCodeZ(c: CrewMember): Promise<string> {
  const json = JSON.stringify({ v: SHARE_V, n: c.name, t: c.tagline, i: c.instructions, s: c.starters, ic: c.icon, to: c.tone, m: c.mode, ...(c.sources ? { src: 1 } : {}), ...(c.avatar ? { av: c.avatar } : {}), ...(c.greeting ? { gr: c.greeting } : {}), ...(c.signoff ? { so: c.signoff } : {}) });
  return toB64url(await pipeBytes(new TextEncoder().encode(json), new CompressionStream("deflate-raw")));
}
export async function crewShareLinkZ(c: CrewMember, base: string): Promise<string> { return `${base}?crewz=${await crewShareCodeZ(c)}`; }
export async function readShareCodeZ(code: string, modes: string[]): Promise<CrewMember | null> {
  try {
    if (!code || code.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
    const o = JSON.parse(new TextDecoder().decode(await pipeBytes(fromB64url(code), new DecompressionStream("deflate-raw"))));
    if (!o || o.v !== SHARE_V) return null;
    return cleanCrew({ id: "", name: o.n, tagline: o.t, instructions: o.i, starters: o.s, icon: o.ic, tone: o.to, mode: o.m, sources: !!o.src, avatar: o.av, greeting: o.gr, signoff: o.so, importedAt: Date.now() }, modes);
  } catch { return null; }
}

/* ------------------------------------------------------------------ Update 43: assistant version history */

export interface CrewVersion { at: number; name: string; tagline: string; instructions: string; starters: string[] }
export const VERSIONS_KEY = "cadus3.crewVersions";
export const VERSIONS_MAX = 10;
export function readVersions(): Record<string, CrewVersion[]> {
  try {
    const v = JSON.parse(localStorage.getItem(VERSIONS_KEY) || "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, CrewVersion[]> = {};
    for (const [k, l] of Object.entries(v).slice(0, 200)) if (Array.isArray(l)) out[k] = l.filter((x) => x && typeof x.instructions === "string").slice(0, VERSIONS_MAX).map((x) => ({ at: Number(x.at) || 0, name: clip(x.name, 80), tagline: clip(x.tagline, 160), instructions: clip(x.instructions, 4000), starters: Array.isArray(x.starters) ? x.starters.map((s: unknown) => clip(s, 200)).slice(0, 6) : [] }));
    return out;
  } catch { return {}; }
}
export function saveVersions(m: Record<string, CrewVersion[]>) { try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(m)); } catch { /* blocked */ } }
const snap = (c: Pick<CrewMember, "name" | "tagline" | "instructions" | "starters">, at: number): CrewVersion => ({ at, name: c.name, tagline: c.tagline ?? "", instructions: c.instructions, starters: [...(c.starters ?? [])] });
/** Keeps the previous version when an assistant's words change (newest first, up to 10). */
export function recordVersion(m: Record<string, CrewVersion[]>, id: string, prev: Pick<CrewMember, "name" | "tagline" | "instructions" | "starters">, next: Pick<CrewMember, "name" | "tagline" | "instructions" | "starters">, now = Date.now()): Record<string, CrewVersion[]> {
  const same = prev.name === next.name && (prev.tagline ?? "") === (next.tagline ?? "") && prev.instructions === next.instructions && (prev.starters ?? []).join("\n") === (next.starters ?? []).join("\n");
  if (same || !id) return m;
  return { ...m, [id]: [snap(prev, now), ...(m[id] ?? [])].slice(0, VERSIONS_MAX) };
}
export type DiffLine = { type: "same" | "add" | "del"; text: string };
/** A line diff (longest common subsequence) from a to b. */
export function lineDiff(a: string, b: string): DiffLine[] {
  const x = a.split("\n"), y = b.split("\n");
  if (x.length * y.length > 250000) return [...x.map((t) => ({ type: "del" as const, text: t })), ...y.map((t) => ({ type: "add" as const, text: t }))];
  const n = x.length, mm = y.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(mm + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = mm - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < mm) {
    if (x[i] === y[j]) { out.push({ type: "same", text: x[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push({ type: "del", text: x[i++] });
    else out.push({ type: "add", text: y[j++] });
  }
  while (i < n) out.push({ type: "del", text: x[i++] });
  while (j < mm) out.push({ type: "add", text: y[j++] });
  return out;
}
export const diffStats = (d: DiffLine[]) => ({ added: d.filter((x) => x.type === "add").length, removed: d.filter((x) => x.type === "del").length });

/* ------------------------------------------------------------------ Update 43: study timer (pomodoro) */

export interface PomoSession { at: number; crewId: string; topic: string; minutes: number }
export const POMO_KEY = "cadus3.crewPomodoro";
export function readPomo(): PomoSession[] {
  try { const v = JSON.parse(localStorage.getItem(POMO_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && Number(x.minutes) > 0).slice(0, 500).map((x) => ({ at: Number(x.at) || 0, crewId: String(x.crewId ?? ""), topic: clip(x.topic, 120), minutes: Math.min(240, Math.round(Number(x.minutes))) })); } catch { return []; }
}
export function savePomo(l: PomoSession[]) { try { localStorage.setItem(POMO_KEY, JSON.stringify(l.slice(0, 500))); } catch { /* blocked */ } }
export function pomoStats(list: PomoSession[], now: Date): { todayMin: number; todaySessions: number; weekMin: number; streak: number } {
  const key = (t: number) => dateKey(new Date(t));
  const today = dateKey(now);
  const days = new Set(list.map((s) => key(s.at)));
  const todays = list.filter((s) => key(s.at) === today);
  const weekAgo = now.getTime() - 7 * 86400000;
  let streak = 0;
  for (let d = new Date(now.getFullYear(), now.getMonth(), now.getDate()); ; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)) {
    if (days.has(dateKey(d))) streak++;
    else if (dateKey(d) !== today) break;
    if (streak > 365) break;
  }
  return { todayMin: todays.reduce((a, s) => a + s.minutes, 0), todaySessions: todays.length, weekMin: list.filter((s) => s.at >= weekAgo).reduce((a, s) => a + s.minutes, 0), streak };
}
export const pomoQuizPrompt = (topic: string, minutes: number) => `I just studied ${topic || "this topic"} for ${minutes} minute${minutes === 1 ? "" : "s"}. Quiz me now: ask 5 short questions one at a time (mix recall, a clinical scenario and a dose or number), wait for my answer each time, then score me and tell me the 3 points to revise.`;
export const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

/* ------------------------------------------------------------------ Update 43: slash commands */

export const SLASH_CMDS: { cmd: string; hint: string; arg: string }[] = [
  { cmd: "mcq", hint: "5 exam MCQs on a topic", arg: "topic" },
  { cmd: "viva", hint: "Viva questions on a topic, one at a time", arg: "topic" },
  { cmd: "explain", hint: "Explain a topic simply, step by step", arg: "topic" },
  { cmd: "ddx", hint: "Differential diagnosis for a presentation", arg: "case" },
  { cmd: "flowchart", hint: "A management flowchart", arg: "topic" },
  { cmd: "table", hint: "Last answer as a table", arg: "" },
  { cmd: "shorter", hint: "Last answer in under 120 words", arg: "" },
  { cmd: "mnemonic", hint: "Last answer with mnemonics", arg: "" },
  { cmd: "patient", hint: "Last answer for a patient", arg: "" },
  { cmd: "recap", hint: "Key points and to-dos from this chat", arg: "" },
  { cmd: "later", hint: "Save a question to your Question Inbox", arg: "question" },
];
export const matchSlash = (typed: string) => { const q = typed.replace(/^\//, "").toLowerCase(); return SLASH_CMDS.filter((c) => c.cmd.startsWith(q)); };
/** Expands a slash command: a message to send, the recap action, or null if it isn't one (or needs a missing topic). */
export function expandSlash(text: string, lastAnswer: string): { send: string } | { action: "recap" } | { action: "later"; text: string } | { error: string } | null {
  const m = /^\/([a-z]+)\b\s*([\s\S]*)$/i.exec(text.trim());
  if (!m) return null;
  const cmd = SLASH_CMDS.find((c) => c.cmd === m[1].toLowerCase());
  if (!cmd) return null;
  const arg = m[2].trim();
  if (cmd.cmd === "recap") return { action: "recap" };
  if (cmd.cmd === "later" && arg) return { action: "later", text: arg.slice(0, 1000) };
  if (cmd.arg && !arg) return { error: `Add a ${cmd.arg} after /${cmd.cmd}, e.g. /${cmd.cmd} ${cmd.arg === "case" ? "fever with rash in a 6-year-old" : "heart failure"}` };
  const remix: Record<string, string> = { table: "table", shorter: "shorter", mnemonic: "mnemonic", patient: "patient" };
  if (remix[cmd.cmd]) return lastAnswer ? { send: remixPrompt(remix[cmd.cmd], lastAnswer) } : { error: `/${cmd.cmd} works on the last answer: ask something first` };
  const out: Record<string, string> = {
    mcq: `Give me 5 single-best-answer MCQs (NEET-PG style) on ${arg}, with 4 options each. Put the answers with a one-line explanation at the end.`,
    viva: `Act as a viva examiner on ${arg}. Ask me one question at a time, wait for my answer, then give feedback and ask the next. 5 questions in all.`,
    explain: `Explain ${arg} simply and step by step, as to a final-year student: the key idea first, then mechanism, clinical relevance and one example.`,
    ddx: `Give a ranked differential diagnosis for: ${arg}. For each: the key clue for and against, and the one test that best separates it. Flag any can't-miss diagnoses first.`,
    flowchart: `Give a step-by-step management flowchart for ${arg}, using arrows (→) and decision points, with doses where relevant.`,
  };
  return { send: out[cmd.cmd] };
}

/* ------------------------------------------------------------------ Update 43: chat recap */

export function recapPrompt(msgs: { role: string; content: string }[]): string {
  const t = msgs.map((x) => `${x.role === "user" ? "Me" : "Assistant"}: ${x.content}`).join("\n\n");
  const tail = t.length > 12000 ? `…${t.slice(-12000)}` : t;
  return [
    "Recap the conversation below for my notes. Use exactly these headings:",
    "## Key points\n(5–8 bullets)\n## Doses and numbers\n(every dose, value and threshold mentioned, exactly as given; 'None' if none)\n## To do\n(actions or things to check)\n## Revise later\n(2–4 topics or questions to look up)",
    "Do not add anything that was not in the conversation.",
    `<conversation>\n${tail}\n</conversation>`,
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Update 44: teach-back */

export interface TeachResult { score: number; verdict: string; strengths: string[]; gaps: string[]; errors: string[]; model: string }
export function teachPrompt(topic: string, explanation: string): string {
  return [
    `I am a medical student. I will explain "${topic.trim().slice(0, 200)}" in my own words (the teach-back method). Grade my explanation as a strict but kind examiner.`,
    'Reply with ONLY JSON: {"score": 0-10, "verdict": "one sentence", "strengths": ["..."], "gaps": ["important points I missed"], "errors": ["anything wrong, with the correction"], "model": "a model explanation in 4-6 sentences"}.',
    `<explanation>\n${explanation.slice(0, 6000)}\n</explanation>`,
  ].join("\n\n");
}
export function parseTeach(text: string): TeachResult | null {
  const t = String(text ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const o = JSON.parse(t.slice(s, e + 1));
    const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => clip(x, 400)).filter(Boolean).slice(0, 8) : []);
    const score = Math.max(0, Math.min(10, Math.round(Number(o.score))));
    if (!Number.isFinite(score)) return null;
    return { score, verdict: clip(o.verdict, 300), strengths: list(o.strengths), gaps: list(o.gaps), errors: list(o.errors), model: clip(o.model, 2000) };
  } catch { return null; }
}
export interface TeachAttempt { at: number; crewId: string; topic: string; score: number }
export const TEACH_KEY = "cadus3.crewTeach";
export function readTeach(): TeachAttempt[] {
  try { const v = JSON.parse(localStorage.getItem(TEACH_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && Number.isFinite(Number(x.score))).slice(0, 200).map((x) => ({ at: Number(x.at) || 0, crewId: String(x.crewId ?? ""), topic: clip(x.topic, 200), score: Math.max(0, Math.min(10, Number(x.score))) })); } catch { return []; }
}
export function saveTeach(l: TeachAttempt[]) { try { localStorage.setItem(TEACH_KEY, JSON.stringify(l.slice(0, 200))); } catch { /* blocked */ } }

/* ------------------------------------------------------------------ Update 44: share a quiz */

export interface QuizShare { topic: string; qs: QuizQ[]; from?: { name: string; correct: number; total: number } }
export async function quizShareCode(s: QuizShare): Promise<string> {
  const json = JSON.stringify({ v: 1, t: s.topic, q: s.qs.map((x) => [x.q, x.options, x.answer, x.why]), ...(s.from ? { f: [s.from.name, s.from.correct, s.from.total] } : {}) });
  return toB64url(await pipeBytes(new TextEncoder().encode(json), new CompressionStream("deflate-raw")));
}
export async function readQuizShare(code: string): Promise<QuizShare | null> {
  try {
    if (!code || code.length > 30000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
    const o = JSON.parse(new TextDecoder().decode(await pipeBytes(fromB64url(code), new DecompressionStream("deflate-raw"))));
    if (!o || o.v !== 1 || !Array.isArray(o.q)) return null;
    const qs: QuizQ[] = o.q.filter((x: unknown) => Array.isArray(x) && typeof x[0] === "string" && Array.isArray(x[1]) && x[1].length >= 2).slice(0, 20).map((x: [string, unknown[], number, string]) => {
      const options = x[1].slice(0, 6).map((op) => clip(op, 300));
      return { q: clip(x[0], 800), options, answer: Math.max(0, Math.min(options.length - 1, Number(x[2]) || 0)), why: clip(x[3], 800) };
    });
    if (!qs.length) return null;
    const f = Array.isArray(o.f) ? { name: clip(o.f[0], 20) || "Your friend", correct: Math.max(0, Number(o.f[1]) || 0), total: Math.max(0, Number(o.f[2]) || 0) } : undefined;
    return { topic: clip(o.t, 120), qs, ...(f ? { from: f } : {}) };
  } catch { return null; }
}

/* ------------------------------------------------------------------ Update 44: weekly study goals */

export interface StudyGoals { minutes: number; questions: number; notes: number; chats: number; teach: number }
export const GOALS_KEY = "cadus3.crewGoals";
export const GOAL_DEFAULTS: StudyGoals = { minutes: 300, questions: 50, notes: 5, chats: 10, teach: 3 };
export const GOAL_LABELS: [keyof StudyGoals, string, string][] = [["minutes", "Study timer minutes", "min"], ["questions", "Quiz questions answered", "questions"], ["notes", "Notes saved", "notes"], ["chats", "Chats with assistants", "chats"], ["teach", "Teach-backs", "teach-backs"]];
export function readGoals(): StudyGoals | null {
  try {
    const v = JSON.parse(localStorage.getItem(GOALS_KEY) || "null");
    if (!v) return null;
    const out = { ...GOAL_DEFAULTS };
    for (const [k] of GOAL_LABELS) out[k] = Math.max(0, Math.min(10000, Math.round(Number(v[k]) || 0)));
    return out;
  } catch { return null; }
}
export function saveGoals(g: StudyGoals | null) { try { if (g) localStorage.setItem(GOALS_KEY, JSON.stringify(g)); else localStorage.removeItem(GOALS_KEY); } catch { /* blocked */ } }
/** Monday 00:00 of this week. */
export const weekStart = (now: Date) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
export function goalProgress(g: StudyGoals, data: { pomo: { at: number; minutes: number }[]; quiz: { at: number; total: number }[]; notes: { at: number }[]; chats: { at: number }[]; teach: { at: number }[] }, now: Date): { key: keyof StudyGoals; label: string; unit: string; done: number; target: number; pct: number }[] {
  const from = weekStart(now);
  const done: StudyGoals = {
    minutes: data.pomo.filter((x) => x.at >= from).reduce((a, x) => a + x.minutes, 0),
    questions: data.quiz.filter((x) => x.at >= from).reduce((a, x) => a + x.total, 0),
    notes: data.notes.filter((x) => x.at >= from).length,
    chats: data.chats.filter((x) => x.at >= from).length,
    teach: data.teach.filter((x) => x.at >= from).length,
  };
  return GOAL_LABELS.filter(([k]) => g[k] > 0).map(([k, label, unit]) => ({ key: k, label, unit, done: done[k], target: g[k], pct: Math.min(100, Math.round((done[k] / g[k]) * 100)) }));
}

/* ------------------------------------------------------------------ Update 44: select to explain */

export function explainPrompt(term: string, context: string): string {
  return [
    `Explain "${term.trim().slice(0, 200)}" briefly for a medical student, in 2–4 sentences: what it means and why it matters here. If it is an abbreviation, expand it first. No headings.`,
    context ? `It appeared in this text:\n"""${context.slice(0, 1200)}"""` : "",
  ].filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ Update 45: diagram it */

export function diagramPrompt(kind: "flowchart" | "mindmap", text: string): string {
  const how = kind === "mindmap"
    ? "a Mermaid mindmap (start with the line `mindmap`, then `  root((Topic))` and indented branches, at most 4 levels and 25 nodes)"
    : "a Mermaid flowchart (start with `flowchart TD`; short node labels in square brackets, decisions in curly braces, labelled arrows like -->|yes|, at most 20 nodes)";
  return [
    `Turn the medical text below into ${how}. Keep doses and key numbers in the labels. Use only plain words in labels (no quotes, parentheses inside labels are fine, no HTML, no special characters like # or ;).`,
    "Reply with ONLY the Mermaid code in a ```mermaid block, nothing else.",
    `<text>\n${text.slice(0, 6000)}\n</text>`,
  ].join("\n\n");
}
/** The Mermaid code from a reply, or "" if it isn't a flowchart or mindmap. */
export function extractMermaid(reply: string): string {
  const t = String(reply ?? "");
  const m = /```(?:mermaid)?\s*\n([\s\S]*?)```/.exec(t);
  const code = (m ? m[1] : t).replace(/%%\{[\s\S]*?\}%%/g, "").replace(/<[^>]*>/g, "").trim();
  if (!/^(flowchart|graph)\s+(TD|TB|LR|RL|BT)\b|^mindmap\b/.test(code)) return "";
  return code.slice(0, 6000);
}

/* ------------------------------------------------------------------ Update 45: learning paths */

export interface PathTask { text: string; done: boolean }
export interface LearningPath { id: string; crewId: string; topic: string; createdAt: number; days: { title: string; tasks: PathTask[] }[] }
export const PATHS_KEY = "cadus3.crewPaths";
export function pathPrompt(topic: string, days: number): string {
  return [
    `Make a ${days}-day learning path for a medical student on: ${topic.trim().slice(0, 200)}. Build from basics to clinical application and exam practice; the last day is revision and a self-test.`,
    'Reply with ONLY JSON: {"days": [{"title": "short day title", "tasks": ["3–4 concrete tasks, each under 15 words"]}]}.',
  ].join("\n\n");
}
export function parsePath(text: string, days: number): { title: string; tasks: PathTask[] }[] {
  const t = String(text ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return [];
  try {
    const o = JSON.parse(t.slice(s, e + 1));
    const list = Array.isArray(o?.days) ? o.days : [];
    return list.slice(0, days).map((d: { title?: unknown; tasks?: unknown }, i: number) => ({ title: clip(d?.title, 80) || `Day ${i + 1}`, tasks: (Array.isArray(d?.tasks) ? d.tasks : []).map((x: unknown) => clip(x, 160)).filter(Boolean).slice(0, 6).map((x: string) => ({ text: x, done: false })) })).filter((d: { tasks: PathTask[] }) => d.tasks.length);
  } catch { return []; }
}
export function readPaths(): LearningPath[] {
  try {
    const v = JSON.parse(localStorage.getItem(PATHS_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((p) => p && Array.isArray(p.days)).slice(0, 20).map((p) => ({ id: String(p.id), crewId: String(p.crewId ?? ""), topic: clip(p.topic, 200), createdAt: Number(p.createdAt) || 0, days: p.days.slice(0, 14).map((d: { title?: unknown; tasks?: unknown }) => ({ title: clip(d?.title, 80), tasks: (Array.isArray(d?.tasks) ? d.tasks : []).slice(0, 6).map((x: { text?: unknown; done?: unknown }) => ({ text: clip(x?.text, 160), done: x?.done === true })) })) }));
  } catch { return []; }
}
export function savePaths(l: LearningPath[]) { try { localStorage.setItem(PATHS_KEY, JSON.stringify(l.slice(0, 20))); } catch { /* blocked */ } }
export const pathProgress = (p: LearningPath) => { const all = p.days.flatMap((d) => d.tasks); const done = all.filter((x) => x.done).length; return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 }; };
/** Which day of the path today is (0-based), from the day it was made. */
export function pathToday(p: LearningPath, now: Date): number {
  const start = new Date(p.createdAt); const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()); const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.min(p.days.length - 1, Math.round((b - a) / 86400000)));
}
export const dayPrompt = (p: LearningPath, i: number) => `Day ${i + 1} of my ${p.days.length}-day learning path on ${p.topic}: "${p.days[i]?.title}". Teach me today's tasks step by step, then ask me 3 questions to check I understood:\n${(p.days[i]?.tasks ?? []).map((t) => `- ${t.text}`).join("\n")}`;

/* ------------------------------------------------------------------ Update 45: share flashcard decks */

export interface DeckShare { title: string; cards: { front: string; back: string }[]; crewId: string }
export async function deckShareCode(d: DeckShare): Promise<string> {
  const json = JSON.stringify({ v: 1, t: d.title, k: d.crewId, c: d.cards.slice(0, 60).map((x) => [x.front, x.back]) });
  return toB64url(await pipeBytes(new TextEncoder().encode(json), new CompressionStream("deflate-raw")));
}
export async function readDeckShare(code: string): Promise<DeckShare | null> {
  try {
    if (!code || code.length > 40000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
    const o = JSON.parse(new TextDecoder().decode(await pipeBytes(fromB64url(code), new DecompressionStream("deflate-raw"))));
    if (!o || o.v !== 1 || !Array.isArray(o.c)) return null;
    const cards = o.c.filter((x: unknown) => Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "string").slice(0, 60).map((x: [string, string]) => ({ front: clip(x[0], 400), back: clip(x[1], 800) })).filter((x: { front: string; back: string }) => x.front && x.back);
    if (!cards.length) return null;
    return { title: clip(o.t, 120) || "Shared deck", crewId: String(o.k ?? ""), cards };
  } catch { return null; }
}

/* ------------------------------------------------------------------ Update 45: smart assistant suggestions */

/** Topic patterns for the built-in assistants, most specific first (ties go to the earlier rule). */
const SUGGEST_RULES: [RegExp, string][] = [
  [/\b(x-?ray|ct scan|ct head|mri|ultrasound|usg|radiograph\w*|consolidation|opacity)\b/, "crew-radiology"],
  [/\b(child|children|infant|baby|neonat\w*|newborn|toddler|paediatric|pediatric|\d+[- ]?(month|year)s?[- ]old (boy|girl))\b/, "crew-paeds"],
  [/\b(pregnan\w*|antenatal|labou?r|postpartum|obstetric\w*|menstrua\w*|periods?|gyna?ec\w*|pcos|uterus|ovar\w*|contracepti\w*)\b/, "crew-obg"],
  [/\b(chest pain|myocardial|angina|acs|stemi|nstemi|acute coronary|heart failure|murmur|troponin|cardiac|statin|hypertension|blood pressure)\b/, "crew-cardio"],
  [/\b(ecg|ekg|st[- ]elevation|st[- ]depression|qrs|qtc|arrhythmi\w*|atrial fibrillation|heart block|tachycardia|bradycardia)\b/, "crew-ecg"],
  [/\b(neet|inicet|ini-cet|fmge|mcqs?)\b/, "crew-neetpg"],
  [/\b(viva|oral exam)\b/, "crew-viva"],
  [/\b(thesis|dissertation|sample size|study design|statistic\w*|p[- ]value)\b/, "crew-thesis"],
  [/\b(anatomy|physiology|biochem\w*|plexus|nerve supply|embryolog\w*|histolog\w*)\b/, "crew-firstyear"],
  [/\b(antibiotic\w*|antimicrobial\w*|culture report|sensitivity report)\b/, "crew-abx"],
  [/\b(pneumonia|asthma|copd|spirometry|pleural|tuberculosis|tb|cough|lungs?|inhaler\w*)\b/, "crew-pulm"],
  [/\b(diabet\w*|insulin|hba1c|thyroid|cortisol|adrenal|pituitary|endocrin\w*)\b/, "crew-endo"],
  [/\b(kidney|renal|creatinine|egfr|dialysis|proteinuria|nephr\w*|potassium|sodium)\b/, "crew-nephro"],
  [/\b(stroke|seizures?|epilep\w*|headache|migraine|neuropath\w*|parkinson\w*|dementia|paralysis|numbness)\b/, "crew-neuro"],
  [/\b(rash\w*|itch\w*|skin|eczema|psoriasis|acne|tinea|ringworm|urticaria|vitiligo|hair loss|alopecia)\b/, "crew-derm"],
  [/\b(eyes?|vision|retina\w*|glaucoma|cataract|conjunctiv\w*)\b/, "crew-ophthal"],
  [/\b(ears?|nose|throat|tonsil\w*|sinus\w*|hearing|vertigo|epistaxis)\b/, "crew-ent"],
  [/\b(fracture\w*|bones?|joints?|knee|hip|shoulder|back pain|sprain|orthop\w*)\b/, "crew-ortho"],
  [/\b(depress\w*|anxiety|suicid\w*|psychos\w*|schizo\w*|bipolar|insomnia|panic)\b/, "crew-psych"],
  [/\b(liver|jaundice|hepatitis|cirrhosis|gi bleed|stomach|abdominal pain|diarrho?ea|vomiting|pancrea\w*|ibd|crohn\w*)\b/, "crew-gastro"],
  [/\b(cancer|tumou?rs?|chemo\w*|oncolog\w*|malignan\w*|lymphoma|leukaemia|leukemia)\b/, "crew-onco"],
  [/\b(arthritis|lupus|sle|gout|vasculitis|rheumat\w*)\b/, "crew-rheum"],
  [/\b(tooth|teeth|dental|gums?|extraction)\b/, "crew-dental"],
  [/\b(anaesth\w*|anesth\w*|intubat\w*|epidural|spinal block)\b/, "crew-anaes"],
  [/\b(icu|ventilat\w*|vasopressor\w*|abg|septic shock)\b/, "crew-icu"],
  [/\b(appendic\w*|hernia|surgery|surgical|wound|abscess|cholecyst\w*)\b/, "crew-surgery"],
  [/\b(snake ?bite|poisoning|overdose|anaphylaxis|trauma|emergency|burns?)\b/, "crew-ed"],
  [/\b(elderly|older adults?|frail\w*|falls)\b/, "crew-geri"],
  [/\b(post-?mortem|autopsy|medico-?legal|mlc|inquest)\b/, "crew-forensic"],
  [/\b(vaccin\w*|epidemiolog\w*|outbreak|national programme|public health)\b/, "crew-psm"],
  [/\b(drug interactions?|side effects?|doses?|dosage)\b/, "crew-pharmacist"],
];
/** The Crew assistant that best fits a question, if one clearly does: your own assistants by name, then topic rules for the built-in ones. */
export function bestCrewFor(text: string, mine: CrewMember[]): { c: CrewMember; score: number } | null {
  const t = String(text ?? "").toLowerCase();
  if (t.trim().length < 15) return null;
  for (const c of mine) {
    const words = c.name.toLowerCase().match(/[a-z]{4,}/g) ?? [];
    if (words.length && words.every((w) => t.includes(w))) return { c, score: 5 };
  }
  const hits = new Map<string, number>();
  SUGGEST_RULES.forEach(([re, id], i) => { const m = t.match(new RegExp(re.source, "g")); if (m) hits.set(id, (hits.get(id) ?? 0) + m.length * 10 - i * 0.01); });
  const best = [...hits.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  const c = findCrew(best[0], mine);
  return c ? { c, score: Math.round(best[1] / 10) } : null;
}

/* ------------------------------------------------------------------ Update 46: weak topic radar */

const SUBJECT_RULES: [RegExp, string][] = [
  [/\b(anatom\w*|brachial plexus|nerve supply|muscles? of|embryolog\w*|histolog\w*|osteolog\w*)\b/, "Anatomy"],
  [/\b(physiolog\w*|cardiac cycle|renal physiology|action potential|respiratory physiology|endocrine physiology)\b/, "Physiology"],
  [/\b(biochem\w*|enzymes?|metabolism|vitamins?|glycolysis|urea cycle|lipoproteins?|genetics)\b/, "Biochemistry"],
  [/\b(patholog\w*|neoplasia|inflammation|haematolog\w*|hematolog\w*|anaemias?|anemias?|amyloid\w*)\b/, "Pathology"],
  [/\b(pharmacolog\w*|antiepileptics?|antibiotics?|antimicrobials?|autonomic drugs?|drugs?|antihypertensives?|anticoagulants?)\b/, "Pharmacology"],
  [/\b(microbiolog\w*|bacteria\w*|virolog\w*|viruses?|parasit\w*|mycolog\w*|immunolog\w*)\b/, "Microbiology"],
  [/\b(forensic\w*|toxicolog\w*|poisons?|post-?mortem|medico-?legal)\b/, "Forensic Medicine"],
  [/\b(psm|community medicine|epidemiolog\w*|biostatistics|statistics|national programmes?|screening tests?|vaccin\w*)\b/, "Community Medicine (PSM)"],
  [/\b(ent|ear|nose|throat|larynx|sinusitis|otitis|hearing)\b/, "ENT"],
  [/\b(ophthalm\w*|eyes?|glaucoma|cataract|retina\w*|uveitis|squint)\b/, "Ophthalmology"],
  [/\b(obstetric\w*|gynae\w*|gyne\w*|pregnan\w*|labour|antenatal|menstrua\w*|pcos|pre-?eclampsia)\b/, "Obstetrics & Gynaecology"],
  [/\b(paediatric\w*|pediatric\w*|neonat\w*|child\w*|infants?|milestones?)\b/, "Paediatrics"],
  [/\b(orthop\w*|fractures?|bones? tumou?rs?|joints?|spine)\b/, "Orthopaedics"],
  [/\b(dermatolog\w*|skin|psoriasis|leprosy|eczema|acne)\b/, "Dermatology"],
  [/\b(psychiatr\w*|depression|schizophrenia|bipolar|anxiety|psychosis)\b/, "Psychiatry"],
  [/\b(anaesth\w*|anesth\w*|airway|intubation)\b/, "Anaesthesia"],
  [/\b(radiolog\w*|x-?rays?|imaging|ct|mri|ultrasound)\b/, "Radiology"],
  [/\b(surg\w*|hernia|appendic\w*|trauma|breast|thyroid surgery|urolog\w*)\b/, "Surgery"],
  [/\b(medicine|cardio\w*|ecg|heart|diabetes|kidney|renal|lungs?|asthma|copd|neurolog\w*|stroke|gastro\w*|liver|endocrin\w*|thyroid|rheumat\w*|infectious)\b/, "Medicine"],
];
/** The NEET-PG subject a topic belongs to, if one clearly fits. */
export function subjectFor(topic: string): string | null {
  const t = String(topic ?? "").toLowerCase();
  const exact = EXAM_SUBJECTS.find(([s]) => s.toLowerCase() === t.trim() || (s === "Obstetrics & Gynaecology" && t.trim() === "obstetrics and gynaecology") || (s === "Community Medicine (PSM)" && t.trim() === "community medicine"));
  if (exact) return exact[0];
  for (const [re, s] of SUBJECT_RULES) if (re.test(t)) return s;
  return null;
}
/** The assistant to revise a topic with: the subject's assistant, then the topic rules, then the NEET-PG Coach. */
export function crewForTopic(topic: string, mine: CrewMember[]): CrewMember {
  const s = subjectFor(topic);
  const sid = s ? EXAM_SUBJECTS.find((x) => x[0] === s)?.[1] : undefined;
  const t = String(topic ?? "").toLowerCase();
  const rid = sid ? undefined : SUGGEST_RULES.find(([re]) => re.test(t))?.[1];
  return findCrew(sid ?? rid ?? "crew-neetpg", mine) ?? findCrew("crew-neetpg", mine)!;
}
export interface RadarItem { key: string; topic: string; subject: string | null; correct: number; total: number; mistakes: number; teachAvg: number | null; teachN: number; score: number; evidence: number; weak: boolean }
export interface RadarInput {
  quiz: QuizResult[];
  drill: Record<string, { c: number; t: number }>;
  mistakes: Mistake[];
  teach: TeachAttempt[];
  practice: Record<string, { attempted: number; correct: number }>;
  /** Update 47: spot-the-error rounds count like questions (errors found out of errors hidden). */
  spot?: { topic: string; found: number; total: number }[];
}
const rKey = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
/**
 * Topics by strength, weakest first. Score (0–100): accuracy from quizzes, daily drills and MCQ
 * practice, blended with teach-back scores (each attempt weighs like 3 questions), minus 5 points
 * per open mistake (up to 25). A topic is "weak" under 60 with at least 3 pieces of evidence.
 */
export function radarTopics(x: RadarInput): RadarItem[] {
  const m = new Map<string, { topic: string; c: number; t: number; mk: number; ts: number; tn: number }>();
  const get = (topic: string) => {
    const k = rKey(topic);
    if (!k) return null;
    let e = m.get(k);
    if (!e) { e = { topic: topic.trim().slice(0, 120), c: 0, t: 0, mk: 0, ts: 0, tn: 0 }; m.set(k, e); }
    return e;
  };
  for (const r of x.quiz) { const p = r.players[0]; const e = get(r.topic); if (e && p) { e.c += p.correct; e.t += p.total; } }
  for (const [t, s] of Object.entries(x.drill)) { const e = get(t); if (e) { e.c += s.c; e.t += s.t; } }
  for (const [t, s] of Object.entries(x.practice)) { const e = get(t); if (e) { e.c += s.correct; e.t += s.attempted; } }
  for (const sp of x.spot ?? []) { const e = get(sp.topic); if (e) { e.c += sp.found; e.t += sp.total; } }
  for (const mk of x.mistakes) if (!mk.mastered) { const e = get(mk.topic || "General"); if (e) e.mk += 1; }
  for (const a of x.teach) { const e = get(a.topic); if (e) { e.ts += a.score; e.tn += 1; } }
  return [...m.entries()].map(([key, e]) => {
    const parts: [number, number][] = [];
    if (e.t > 0) parts.push([(100 * e.c) / e.t, e.t]);
    if (e.tn > 0) parts.push([(10 * e.ts) / e.tn, e.tn * 3]);
    const w = parts.reduce((s, p) => s + p[1], 0);
    const base = w ? parts.reduce((s, p) => s + p[0] * p[1], 0) / w : 50;
    const score = Math.max(0, Math.min(100, Math.round(base - Math.min(25, 5 * e.mk))));
    const evidence = e.t + e.tn * 3 + e.mk;
    return { key, topic: e.topic, subject: subjectFor(e.topic), correct: e.c, total: e.t, mistakes: e.mk, teachAvg: e.tn ? Math.round((e.ts / e.tn) * 10) / 10 : null, teachN: e.tn, score, evidence, weak: score < 60 && evidence >= 3 };
  }).filter((i) => i.evidence > 0).sort((a, b) => a.score - b.score || b.evidence - a.evidence);
}
const radarLine = (i: RadarItem) => `${i.topic}: ${i.score}%${i.total ? `, ${i.correct}/${i.total} questions right` : ""}${i.mistakes ? `, ${i.mistakes} open mistake${i.mistakes === 1 ? "" : "s"}` : ""}${i.teachAvg !== null ? `, teach-back ${i.teachAvg}/10` : ""}`;
export function revisePrompt(i: RadarItem): string {
  return `I am weak on ${i.topic} (${radarLine(i)}). Teach me the high-yield points I am most likely missing and the common exam traps, in short bullets. Then give me 5 single-best-answer MCQs one at a time: wait for my answer, tell me if I was right and why, then ask the next.`;
}
export function radarPlanPrompt(items: RadarItem[]): string {
  return [
    "These are my weakest topics from quizzes, drills, MCQ practice, my mistakes notebook and teach-back scores:",
    items.slice(0, 6).map((i) => `- ${radarLine(i)}`).join("\n"),
    "Make me a 7-day fix-it plan as a markdown table (Day | Topic | What to do | Minutes), weakest topics first, mixing revision with active recall and MCQs. Then give 3 short tips on why I might be losing marks in these topics.",
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Update 46: smarter handoff */

/** Cadus itself, as the sender of a handoff from an ordinary (non-assistant) chat. */
export const CADUS_SELF: CrewMember = { id: "cadus-self", name: "Cadus", tagline: "", instructions: "", starters: [], icon: "stethoscope", tone: "teal", mode: "general" };
export function handoffAiPrompt(fromName: string, toName: string, msgs: { role: string; content: string }[], note: string): string {
  const convo = msgs.filter((m) => m.content.trim()).slice(-14).map((m) => `${m.role === "user" ? "User" : fromName}: ${m.content.replace(/\s+/g, " ").trim().slice(0, 1200)}`).join("\n");
  return [
    `Write a short handover brief so that ${toName} can take over this conversation from ${fromName}. Write it in the first person as the user ("I"), addressed to ${toName}.`,
    "Include: the question or case in one or two lines; key facts (age, findings, results, doses) exactly as given; what has already been answered or decided; what is still open. Use short bullets, under 180 words. Do not invent anything.",
    `End with one line asking ${toName} to ${note.trim() ? note.trim().slice(0, 300) : "take it from here"}.`,
    `<conversation>\n${convo.slice(-9000)}\n</conversation>`,
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Update 46: make a case from this */

export interface CaseQ { q: string; a: string }
export interface CaseVignette { title: string; vignette: string; questions: CaseQ[] }
export function casePrompt(text: string, level: "student" | "pg" = "pg"): string {
  return [
    `Turn the medical teaching below into a realistic clinical case vignette for ${level === "student" ? "an MBBS student" : "a postgraduate (NEET-PG) student"} in India.`,
    "The vignette: 5–8 sentences with age, sex, presenting complaint, relevant history, examination and key investigation results (with numbers), written so that the teaching below is the answer. Do not name the diagnosis in the vignette.",
    'Then 4 questions that test the key points (diagnosis, next investigation, management with doses, a complication or trap), each with a short model answer. Reply with ONLY JSON: {"title": "short case title without the diagnosis", "vignette": "…", "questions": [{"q": "…", "a": "…"}]}.',
    `<teaching>\n${text.slice(0, 6000)}\n</teaching>`,
  ].join("\n\n");
}
export function parseCase(reply: string): CaseVignette | null {
  const t = String(reply ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const v = JSON.parse(t.slice(s, e + 1));
    const vignette = clip(v.vignette, 3000);
    const questions = (Array.isArray(v.questions) ? v.questions : []).map((x: any) => ({ q: clip(x?.q, 400), a: clip(x?.a, 1200) })).filter((x: CaseQ) => x.q && x.a).slice(0, 6);
    if (!vignette || !questions.length) return null;
    return { title: clip(v.title, 120) || "Clinical case", vignette, questions };
  } catch { return null; }
}
export function caseMarkdown(c: CaseVignette): string {
  return [`## ${c.title}`, c.vignette, ...c.questions.map((x, i) => `**Q${i + 1}. ${x.q}**\n\n${x.a}`)].join("\n\n");
}
export function casePractisePrompt(c: CaseVignette): string {
  return [`Here is a clinical case. Ask me these questions one at a time, wait for my answer, grade it out of 10 against the model answer, then move on. Do not reveal the answers before I reply.`, `Case: ${c.vignette}`, c.questions.map((x, i) => `Q${i + 1}. ${x.q}\n(Model answer, keep hidden: ${x.a})`).join("\n")].join("\n\n");
}

/* ------------------------------------------------------------------ Update 46: cheat sheets */

export interface CheatSheet { id: string; title: string; crewId: string; md: string; at: number }
export const CHEATS_KEY = "cadus3.crewCheats";
export function readCheats(): CheatSheet[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHEATS_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((x) => x && typeof x.md === "string").slice(0, 30).map((x) => ({ id: String(x.id), title: clip(x.title, 120) || "Cheat sheet", crewId: String(x.crewId ?? ""), md: clip(x.md, 12000), at: Number(x.at) || 0 }));
  } catch { return []; }
}
export function saveCheats(l: CheatSheet[]) { try { localStorage.setItem(CHEATS_KEY, JSON.stringify(l.slice(0, 30))); } catch { /* blocked */ } }
export function cheatPrompt(topic: string, notes: { title: string; text: string }[]): string {
  const src = notes.map((n) => `### ${n.title}\n${n.text.slice(0, 3000)}`).join("\n\n").slice(0, 14000);
  return [
    `Make a one-page cheat sheet on: ${topic.trim().slice(0, 200) || "the notes below"}, for last-minute revision by a medical student.`,
    "Format in markdown: a one-line definition; then short sections with headings (key facts, numbers and cut-offs, drugs and doses, investigations, management steps, exam traps); a small comparison table if it helps; finish with a 3-line mnemonic or memory hook if a good one exists. Keep it under 450 words. Keep every number and dose exact.",
    src ? `Use these notes as the main source (add only standard, well-established facts):\n\n<notes>\n${src}\n</notes>` : "Use standard textbook facts (Harrison, Bailey & Love, Williams, Nelson, KD Tripathi).",
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Update 47: spot the error */

export interface SpotError { wrong: string; fix: string; why: string }
export interface SpotSet { topic: string; text: string; errors: SpotError[] }
export function spotPrompt(topic: string, n: number, level: QuizLevel): string {
  return [
    `Write a short teaching answer (120–200 words, 6–10 sentences, plain prose, no headings or lists) on: ${topic.trim().slice(0, 200)}, at ${level === "easy" ? "MBBS" : level === "hard" ? "hard NEET-PG/INI-CET" : "NEET-PG"} level.`,
    `Deliberately put exactly ${n} factual errors in it (a wrong dose, number, drug, sign, association or mechanism), each in a different sentence, so that a careful student could spot them. Everything else must be correct.`,
    'Reply with ONLY JSON: {"text": "the answer with the errors", "errors": [{"wrong": "the exact wrong words as they appear in the text (3–12 words)", "fix": "the correct fact", "why": "one line"}]}.',
  ].join("\n\n");
}
const normSp = (t: string) => t.toLowerCase().replace(/[^a-z0-9%.]+/g, " ").replace(/\s+/g, " ").trim();
/** Splits prose into sentences (keeps decimals like 0.5 and abbreviations like "e.g." together). */
export function splitSentences(text: string): string[] {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < t.length; i++) {
    cur += t[i];
    if (/[.!?]/.test(t[i]) && (i + 1 === t.length || (t[i + 1] === " " && /[A-Z0-9(]/.test(t[i + 2] ?? ""))) && !/\b(e\.g|i\.e|vs|Dr|approx|etc)\.$/i.test(cur)) { out.push(cur.trim()); cur = ""; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
export function parseSpot(reply: string, topic: string): SpotSet | null {
  const t = String(reply ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const v = JSON.parse(t.slice(s, e + 1));
    const text = clip(v.text, 3000);
    const nt = normSp(text);
    const errors = (Array.isArray(v.errors) ? v.errors : []).map((x: any) => ({ wrong: clip(x?.wrong, 200), fix: clip(x?.fix, 300), why: clip(x?.why, 300) })).filter((x: SpotError) => x.wrong && x.fix && nt.includes(normSp(x.wrong))).slice(0, 5);
    if (!text || !errors.length) return null;
    return { topic: clip(topic, 120), text, errors };
  } catch { return null; }
}
/** Which sentence holds each error (−1 if none). */
export function spotSentenceOf(sentences: string[], err: SpotError): number {
  const w = normSp(err.wrong);
  return sentences.findIndex((x) => normSp(x).includes(w));
}
export function spotCheck(sentences: string[], picked: number[], errors: SpotError[]): { found: number[]; missed: number[]; falsePicks: number[]; score: number } {
  const at = errors.map((er) => spotSentenceOf(sentences, er));
  const found = errors.map((_, i) => i).filter((i) => at[i] >= 0 && picked.includes(at[i]));
  const missed = errors.map((_, i) => i).filter((i) => !found.includes(i));
  const falsePicks = picked.filter((p) => !at.includes(p));
  const score = Math.max(0, Math.round((100 * found.length) / Math.max(1, errors.length)) - 10 * falsePicks.length);
  return { found, missed, falsePicks, score };
}
export interface SpotAttempt { at: number; topic: string; crewId: string; found: number; total: number; falsePicks: number }
export const SPOT_KEY = "cadus3.crewSpot";
export function readSpot(): SpotAttempt[] {
  try { const v = JSON.parse(localStorage.getItem(SPOT_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && Number.isFinite(Number(x.total))).slice(0, 100).map((x) => ({ at: Number(x.at) || 0, topic: clip(x.topic, 120), crewId: String(x.crewId ?? ""), found: Math.max(0, Number(x.found) || 0), total: Math.max(0, Number(x.total) || 0), falsePicks: Math.max(0, Number(x.falsePicks) || 0) })); } catch { return []; }
}
export function saveSpot(l: SpotAttempt[]) { try { localStorage.setItem(SPOT_KEY, JSON.stringify(l.slice(0, 100))); } catch { /* blocked */ } }

/* ------------------------------------------------------------------ Update 47: quiz from my notes */

export function notesQuizPrompt(notes: { title: string; text: string }[], n: number, level: QuizLevel): string {
  const src = notes.map((x) => `### ${x.title}\n${x.text.slice(0, 3000)}`).join("\n\n").slice(0, 14000);
  return [
    `Write ${n} single-best-answer multiple-choice questions that test the facts in my notes below (one or two questions per important fact; use clinical vignettes where natural).`,
    `Level: ${level === "easy" ? "MBBS university exam" : level === "hard" ? "hard NEET-PG/INI-CET" : "NEET-PG standard"}. Every question must be answerable from the notes; keep numbers and doses exactly as in the notes.`,
    'Reply with ONLY a JSON array: [{"q": "question", "options": ["A", "B", "C", "D"], "answer": 0, "why": "one-line explanation"}] where answer is the index of the correct option. Vary the position of the right answer.',
    `<notes>\n${src}\n</notes>`,
  ].join("\n\n");
}

/* ------------------------------------------------------------------ Update 47: guess the diagnosis */

export interface GuessTest { name: string; result: string }
export interface GuessCase { diagnosis: string; aliases: string[]; opening: string; profile: string; tests: GuessTest[]; teaching: string[] }
export const GUESS_AREAS = ["Any", "Medicine", "Surgery", "Paediatrics", "Obstetrics & Gynaecology", "Emergency", "Infectious disease (India)", "Neurology", "Cardiology", "Endocrinology"];
export function guessCasePrompt(area: string, level: QuizLevel): string {
  return [
    `Create a hidden diagnosis game case${area && area !== "Any" ? ` in ${area}` : ""} for ${level === "easy" ? "an MBBS student (common, classic presentation)" : level === "hard" ? "a postgraduate (less common or atypical but fair)" : "a NEET-PG student (common, exam-relevant)"} in India.`,
    "Reply with ONLY JSON: {\"diagnosis\": \"the diagnosis\", \"aliases\": [\"other accepted names or abbreviations\"], \"opening\": \"one or two lines: age, sex, presenting complaint only (no diagnosis, no key clue)\", \"profile\": \"the full hidden record: history, past history, drugs, social, family, examination findings (with numbers), 12–20 short lines\", \"tests\": [{\"name\": \"test name\", \"result\": \"result\"}] (6–10 tests including some normal ones), \"teaching\": [\"3–5 key teaching points\"]}.",
  ].join("\n\n");
}
export function parseGuessCase(reply: string): GuessCase | null {
  const t = String(reply ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const v = JSON.parse(t.slice(s, e + 1));
    const diagnosis = clip(v.diagnosis, 160), opening = clip(v.opening, 400), profile = clip(v.profile, 4000);
    const tests = (Array.isArray(v.tests) ? v.tests : []).map((x: any) => ({ name: clip(x?.name, 80), result: clip(x?.result, 300) })).filter((x: GuessTest) => x.name && x.result).slice(0, 12);
    if (!diagnosis || !opening || !profile) return null;
    return { diagnosis, aliases: (Array.isArray(v.aliases) ? v.aliases : []).map((a: unknown) => clip(a, 120)).filter(Boolean).slice(0, 8), opening, profile, tests, teaching: (Array.isArray(v.teaching) ? v.teaching : []).map((a: unknown) => clip(a, 300)).filter(Boolean).slice(0, 6) };
  } catch { return null; }
}
export function guessAnswerPrompt(c: GuessCase, log: { q: string; a: string }[], question: string): string {
  return [
    "You are the hidden patient record in a diagnosis game. Answer the student's question from the record below in ONE short line: start with Yes, No or Not known, then the specific fact if relevant. Use only the record; if it is not in the record, say it is not known or normal as appropriate.",
    "Never name, hint at or confirm the diagnosis, and never suggest what to ask next. If the student asks for the diagnosis, reply: \"Make a guess when you are ready.\"",
    `<record>\nPresenting: ${c.opening}\n${c.profile}\n</record>`,
    log.length ? `Earlier questions:\n${log.slice(-8).map((x) => `Q: ${x.q}\nA: ${x.a}`).join("\n")}` : "",
    `Question: ${question.trim().slice(0, 300)}`,
  ].filter(Boolean).join("\n\n");
}
const STOP = new Set(["the", "and", "with", "of", "in", "to", "a", "an", "acute", "chronic", "disease", "syndrome", "due", "secondary"]);
const toks = (t: string) => normSp(t).replace(/[.%]/g, " ").split(" ").filter((w) => w.length > 1 && !STOP.has(w));
/** True if the guess names the diagnosis or an accepted alias (all its key words, in any order). */
export function checkGuess(c: GuessCase, guess: string): boolean {
  const g = new Set(toks(guess));
  if (!g.size) return false;
  return [c.diagnosis, ...c.aliases].some((name) => { const k = toks(name); return k.length > 0 && k.every((w) => g.has(w)); });
}
export function guessScore(questions: number, tests: number, wrong: number, solved: boolean): number {
  return solved ? Math.max(10, 100 - 3 * questions - 2 * tests - 10 * wrong) : 0;
}
export interface GuessResult { at: number; diagnosis: string; solved: boolean; score: number; questions: number }
export const GUESS_KEY = "cadus3.crewGuess";
export function readGuess(): GuessResult[] {
  try { const v = JSON.parse(localStorage.getItem(GUESS_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && typeof x.diagnosis === "string").slice(0, 50).map((x) => ({ at: Number(x.at) || 0, diagnosis: clip(x.diagnosis, 160), solved: x.solved === true, score: Math.max(0, Number(x.score) || 0), questions: Math.max(0, Number(x.questions) || 0) })); } catch { return []; }
}
export function saveGuess(l: GuessResult[]) { try { localStorage.setItem(GUESS_KEY, JSON.stringify(l.slice(0, 50))); } catch { /* blocked */ } }

/* ------------------------------------------------------------------ Update 47: my glossary */

export interface GlossTerm { id: string; term: string; def: string; at: number; crewId: string }
export const GLOSS_KEY = "cadus3.crewGlossary";
export const GLOSS_MAX = 500;
export function readGlossary(): GlossTerm[] {
  try { const v = JSON.parse(localStorage.getItem(GLOSS_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && typeof x.term === "string" && typeof x.def === "string").slice(0, GLOSS_MAX).map((x) => ({ id: String(x.id), term: clip(x.term, 120), def: clip(x.def, 2000), at: Number(x.at) || 0, crewId: String(x.crewId ?? "") })); } catch { return []; }
}
export function saveGlossary(l: GlossTerm[]) { try { localStorage.setItem(GLOSS_KEY, JSON.stringify(l.slice(0, GLOSS_MAX))); } catch { /* blocked */ } }
/** Adds a term, or updates its definition if the term is already there (case-insensitive). */
export function addTerm(list: GlossTerm[], term: string, def: string, crewId = "", now = Date.now()): GlossTerm[] {
  const t = clip(term, 120), d = clip(def, 2000);
  if (!t || !d) return list;
  const i = list.findIndex((x) => x.term.toLowerCase() === t.toLowerCase());
  if (i >= 0) return list.map((x, j) => (j === i ? { ...x, def: d, at: now } : x));
  return [{ id: `gl-${now.toString(36)}${Math.random().toString(36).slice(2, 5)}`, term: t, def: d, at: now, crewId }, ...list].slice(0, GLOSS_MAX);
}
export const glossarySorted = (l: GlossTerm[]) => [...l].sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
export function definePrompt(term: string): string {
  return `Define the medical term "${term.trim().slice(0, 120)}" for a medical student in 2–3 sentences: expand it if it is an abbreviation, say what it means, and give one clinically important point (a cut-off, sign, cause or treatment). Plain text, no headings.`;
}
export function glossaryMarkdown(l: GlossTerm[]): string {
  return glossarySorted(l).map((x) => `**${x.term}**: ${x.def.replace(/\s+/g, " ")}`).join("\n\n");
}

/* ------------------------------------------------------------------ Update 48: compare two conditions */

export interface VsRow { aspect: string; a: string; b: string }
export interface VsTable { id: string; a: string; b: string; rows: VsRow[]; key: string[]; traps: string[]; at: number; crewId: string }
export function vsPrompt(a: string, b: string, level: QuizLevel): string {
  return [
    `Compare "${a.trim().slice(0, 120)}" with "${b.trim().slice(0, 120)}" for ${level === "easy" ? "an MBBS student" : level === "hard" ? "a postgraduate" : "a NEET-PG student"}.`,
    "Cover 8–12 aspects that actually distinguish them (e.g. cause, epidemiology, key symptoms, signs, investigations with cut-offs, imaging or histology, management with drug doses, complications, prognosis). Each cell under 20 words; keep numbers exact.",
    'Reply with ONLY JSON: {"rows": [{"aspect": "…", "a": "…", "b": "…"}], "key": ["3–4 single best differentiators"], "traps": ["2–3 common exam traps or confusions"]}.',
  ].join("\n\n");
}
export function parseVs(reply: string, a: string, b: string, crewId: string, now = Date.now()): VsTable | null {
  const t = String(reply ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const v = JSON.parse(t.slice(s, e + 1));
    const rows = (Array.isArray(v.rows) ? v.rows : []).map((x: any) => ({ aspect: clip(x?.aspect, 80), a: clip(x?.a, 300), b: clip(x?.b, 300) })).filter((x: VsRow) => x.aspect && (x.a || x.b)).slice(0, 16);
    if (rows.length < 2) return null;
    const list = (x: unknown) => (Array.isArray(x) ? x : []).map((y: unknown) => clip(y, 300)).filter(Boolean).slice(0, 6);
    return { id: `vs-${now.toString(36)}`, a: clip(a, 120), b: clip(b, 120), rows, key: list(v.key), traps: list(v.traps), at: now, crewId };
  } catch { return null; }
}
const cell = (t: string) => t.replace(/\|/g, "/").replace(/\s+/g, " ").trim();
export function vsMarkdown(v: VsTable): string {
  return [
    `## ${v.a} vs ${v.b}`,
    `| | ${cell(v.a)} | ${cell(v.b)} |\n|---|---|---|\n${v.rows.map((r) => `| **${cell(r.aspect)}** | ${cell(r.a)} | ${cell(r.b)} |`).join("\n")}`,
    v.key.length ? `### Key differentiators\n${v.key.map((k) => `- ${k}`).join("\n")}` : "",
    v.traps.length ? `### Exam traps\n${v.traps.map((k) => `- ${k}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}
export const vsCards = (v: VsTable) => v.rows.map((r) => ({ front: `${v.a} vs ${v.b}: ${r.aspect}?`, back: `${v.a}: ${r.a}\n${v.b}: ${r.b}` }));
export const VS_KEY = "cadus3.crewVs";
export function readVs(): VsTable[] {
  try { const v = JSON.parse(localStorage.getItem(VS_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && Array.isArray(x.rows)).slice(0, 30); } catch { return []; }
}
export function saveVs(l: VsTable[]) { try { localStorage.setItem(VS_KEY, JSON.stringify(l.slice(0, 30))); } catch { /* blocked */ } }

/* ------------------------------------------------------------------ Update 48: differential coach */

export type DdxKind = "likely" | "must" | "possible";
export interface DdxItem { dx: string; aliases: string[]; kind: DdxKind; why: string }
export interface DdxCase { vignette: string; items: DdxItem[]; clues: string[] }
const DDX_JSON = '{"vignette": "…", "items": [{"dx": "diagnosis", "aliases": ["other names or abbreviations"], "kind": "likely | must | possible", "why": "one line: the clue for or against"}], "clues": ["the 3–5 key clues in the case"]}';
export function ddxCasePrompt(area: string, level: QuizLevel): string {
  return [
    `Write a short clinical case (6–9 sentences: age, sex, complaint, history, examination with numbers, one or two first results) for ${level === "easy" ? "an MBBS student" : level === "hard" ? "a postgraduate" : "a NEET-PG student"} to practise building a differential diagnosis${area && area !== "Any" ? `, in ${area}` : ""}, set in India.`,
    "Then the model differential: 1 most likely diagnosis (kind \"likely\"), 1–3 must-not-miss diagnoses (kind \"must\"), and 2–5 other reasonable possibilities (kind \"possible\"). Do not name the diagnosis in the vignette.",
    `Reply with ONLY JSON: ${DDX_JSON}.`,
  ].join("\n\n");
}
export function ddxAnswerPrompt(caseText: string): string {
  return [
    "Give the model differential diagnosis for the case below: 1 most likely (kind \"likely\"), 1–3 must-not-miss (kind \"must\"), 2–5 other possibilities (kind \"possible\").",
    `Reply with ONLY JSON: ${DDX_JSON} (repeat the case as "vignette").`,
    `<case>\n${caseText.slice(0, 4000)}\n</case>`,
  ].join("\n\n");
}
export function parseDdx(reply: string): DdxCase | null {
  const t = String(reply ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const v = JSON.parse(t.slice(s, e + 1));
    const items = (Array.isArray(v.items) ? v.items : []).map((x: any) => ({ dx: clip(x?.dx, 120), aliases: (Array.isArray(x?.aliases) ? x.aliases : []).map((a: unknown) => clip(a, 80)).filter(Boolean).slice(0, 6), kind: (x?.kind === "likely" || x?.kind === "must" ? x.kind : "possible") as DdxKind, why: clip(x?.why, 300) })).filter((x: DdxItem) => x.dx).slice(0, 10);
    if (!items.length) return null;
    return { vignette: clip(v.vignette, 3000), items, clues: (Array.isArray(v.clues) ? v.clues : []).map((c: unknown) => clip(c, 200)).filter(Boolean).slice(0, 6) };
  } catch { return null; }
}
/** True if a line the student wrote names this diagnosis (all key words of the name or an alias, or a specific part of the name such as "pneumonia"). */
export function ddxMatch(line: string, item: DdxItem): boolean {
  const l = toks(line);
  if (!l.length) return false;
  const ls = new Set(l);
  return [item.dx, ...item.aliases].some((name) => {
    const k = toks(name);
    if (!k.length) return false;
    if (k.every((w) => ls.has(w))) return true;
    return l.every((w) => k.includes(w)) && l.some((w) => w.length >= 5);
  });
}
const DDX_W: Record<DdxKind, number> = { likely: 3, must: 3, possible: 1 };
export function scoreDdx(lines: string[], items: DdxItem[]): { matched: number[]; missedMust: number[]; extra: string[]; topRight: boolean; score: number } {
  const clean = lines.map((x) => x.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean).slice(0, 15);
  const matched = items.map((_, i) => i).filter((i) => clean.some((l) => ddxMatch(l, items[i])));
  const missedMust = items.map((_, i) => i).filter((i) => items[i].kind === "must" && !matched.includes(i));
  const extra = clean.filter((l) => !items.some((it) => ddxMatch(l, it)));
  const likelyIdx = items.findIndex((x) => x.kind === "likely");
  const topRight = likelyIdx >= 0 && clean.length > 0 && ddxMatch(clean[0], items[likelyIdx]);
  const total = items.reduce((s2, x) => s2 + DDX_W[x.kind], 0);
  const got = matched.reduce((s2, i) => s2 + DDX_W[items[i].kind], 0);
  const score = Math.min(100, Math.round((100 * got) / Math.max(1, total)) + (topRight ? 5 : 0));
  return { matched, missedMust, extra, topRight, score };
}
export function ddxFeedbackPrompt(c: DdxCase, lines: string[]): string {
  return [
    "Coach my clinical reasoning. Here is a case, my differential (in my order), and the model differential. In under 150 words: what I did well, what I missed and which clue should have pointed me to it, and one tip for building differentials. Be direct and kind.",
    `Case: ${c.vignette}`,
    `My differential:\n${lines.filter((x) => x.trim()).map((x, i) => `${i + 1}. ${x.trim()}`).join("\n")}`,
    `Model differential:\n${c.items.map((x) => `- ${x.dx} (${x.kind === "likely" ? "most likely" : x.kind === "must" ? "must not miss" : "possible"}): ${x.why}`).join("\n")}`,
  ].join("\n\n");
}
export interface DdxAttempt { at: number; score: number; topRight: boolean; missedMust: number }
export const DDX_KEY = "cadus3.crewDdx";
export function readDdx(): DdxAttempt[] {
  try { const v = JSON.parse(localStorage.getItem(DDX_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && Number.isFinite(Number(x.score))).slice(0, 100); } catch { return []; }
}
export function saveDdx(l: DdxAttempt[]) { try { localStorage.setItem(DDX_KEY, JSON.stringify(l.slice(0, 100))); } catch { /* blocked */ } }

/* ------------------------------------------------------------------ Update 48: lecture to notes */

export interface LectureNotes { title: string; notes: string; keyPoints: string[]; cards: { front: string; back: string }[] }
export function lecturePrompt(title: string, text: string, cards: number): string {
  return [
    `Turn this lecture${title.trim() ? ` ("${title.trim().slice(0, 120)}")` : ""} into revision notes for a medical student.`,
    `"notes": well-structured markdown with ## headings, short bullets, a table where it helps, every number and dose kept exactly; fix obvious transcription errors but do not add facts that are not in the lecture except to correct clear mistakes (mark those with "(corrected)"). "keyPoints": the 5–8 most important points. "cards": ${cards} question-and-answer flashcards on the most testable facts.`,
    'Reply with ONLY JSON: {"title": "short title", "notes": "markdown", "keyPoints": ["…"], "cards": [{"front": "question", "back": "answer"}]}.',
    `<lecture>\n${text.slice(0, 20000)}\n</lecture>`,
  ].join("\n\n");
}
export function parseLecture(reply: string, fallbackTitle: string): LectureNotes | null {
  const t = String(reply ?? "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    const v = JSON.parse(t.slice(s, e + 1));
    const notes = clip(v.notes, 16000);
    if (!notes) return null;
    return {
      title: clip(v.title, 120) || clip(fallbackTitle, 120) || "Lecture notes",
      notes,
      keyPoints: (Array.isArray(v.keyPoints) ? v.keyPoints : []).map((x: unknown) => clip(x, 300)).filter(Boolean).slice(0, 10),
      cards: (Array.isArray(v.cards) ? v.cards : []).map((x: any) => ({ front: clip(x?.front, 300), back: clip(x?.back, 600) })).filter((x: { front: string; back: string }) => x.front && x.back).slice(0, 30),
    };
  } catch { return null; }
}
export const lectureMarkdown = (l: LectureNotes) => [`# ${l.title}`, l.keyPoints.length ? `## Key points\n${l.keyPoints.map((k) => `- ${k}`).join("\n")}` : "", l.notes].filter(Boolean).join("\n\n");

/* ------------------------------------------------------------------ Update 48: question inbox */

export interface InboxItem { id: string; q: string; crewId: string; at: number; answer?: string; answeredAt?: number }
export const INBOX_KEY = "cadus3.crewInbox";
export function readInbox(): InboxItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(INBOX_KEY) || "[]");
    return (Array.isArray(v) ? v : []).filter((x) => x && typeof x.q === "string").slice(0, 200).map((x) => ({ id: String(x.id), q: clip(x.q, 1000), crewId: String(x.crewId ?? ""), at: Number(x.at) || 0, ...(typeof x.answer === "string" && x.answer ? { answer: clip(x.answer, 12000), answeredAt: Number(x.answeredAt) || 0 } : {}) }));
  } catch { return []; }
}
export function saveInbox(l: InboxItem[]) { try { localStorage.setItem(INBOX_KEY, JSON.stringify(l.slice(0, 200))); } catch { /* blocked */ } }
/** Adds a question (skips an exact duplicate that is still open); suggests an assistant from the topic rules. */
export function addInbox(list: InboxItem[], q: string, mine: CrewMember[], crewId = "", now = Date.now()): InboxItem[] {
  const t = clip(q, 1000);
  if (!t || list.some((x) => !x.answer && x.q.toLowerCase() === t.toLowerCase())) return list;
  const cid = crewId || bestCrewFor(t.length >= 15 ? t : `${t} — question`, mine)?.c.id || "crew-neetpg";
  return [{ id: `ib-${now.toString(36)}${Math.random().toString(36).slice(2, 5)}`, q: t, crewId: cid, at: now }, ...list].slice(0, 200);
}
export const inboxPending = (l: InboxItem[]) => l.filter((x) => !x.answer);

/* ------------------------------------------------------------------ Update 49: daily smart review */

export type SmartItem =
  | { kind: "card"; key: string; noteId: string; idx: number; front: string; back: string }
  | { kind: "mistake"; key: string; id: string; q: string; options: string[]; answer: number; why: string }
  | { kind: "term"; key: string; id: string; term: string; def: string };
/** Today's mixed review: due flashcards first, then open mistakes, then a few glossary terms (oldest-reviewed first). */
export function smartQueue(notes: CrewNotes, mistakes: Mistake[], glossary: GlossTerm[], today: string, max = { cards: 10, mistakes: 5, terms: 5 }): SmartItem[] {
  const cards: SmartItem[] = [];
  for (const n of notes.notes) (n.cards ?? []).forEach((c, i) => { if (c.due <= today && cards.length < max.cards) cards.push({ kind: "card", key: `c:${n.id}:${i}`, noteId: n.id, idx: i, front: c.front, back: c.back }); });
  const mk: SmartItem[] = dueMistakes(mistakes).slice(0, max.mistakes).map((m) => ({ kind: "mistake", key: `m:${m.id}`, id: m.id, q: m.q, options: m.options, answer: m.answer, why: m.why }));
  const terms: SmartItem[] = [...glossary].sort((a, b) => a.at - b.at).slice(0, max.terms).map((g) => ({ kind: "term", key: `g:${g.id}`, id: g.id, term: g.term, def: g.def }));
  return [...cards, ...mk, ...terms];
}
export interface SmartDay { done: number; right: number; total: number }
export const SMART_KEY = "cadus3.crewSmart";
export function readSmart(): Record<string, SmartDay> {
  try { const v = JSON.parse(localStorage.getItem(SMART_KEY) || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch { return {}; }
}
export function saveSmart(d: Record<string, SmartDay>) {
  try { const keys = Object.keys(d).sort().slice(-120); localStorage.setItem(SMART_KEY, JSON.stringify(Object.fromEntries(keys.map((k) => [k, d[k]])))); } catch { /* blocked */ }
}
/** Days in a row with a finished review, ending today (or yesterday if today's isn't done yet). */
export function smartStreak(days: Record<string, SmartDay>, today: string): number {
  const ok = (k: string) => (days[k]?.done ?? 0) > 0 && days[k].done >= days[k].total;
  let k = ok(today) ? today : addDays(today, -1), n = 0;
  while (ok(k)) { n++; k = addDays(k, -1); }
  return n;
}

/* ------------------------------------------------------------------ Update 49: rapid fire */

export interface RapidQ { s: string; t: boolean; why: string }
export function rapidPrompt(topic: string, level: QuizLevel, n = 20): string {
  return [
    `Write ${n} short true-or-false statements on: ${topic.trim().slice(0, 200)}, at ${level === "easy" ? "MBBS" : level === "hard" ? "hard NEET-PG/INI-CET" : "NEET-PG"} level.`,
    "Each statement under 20 words, a single clear fact (doses, signs, associations, drugs of choice, numbers). About half true and half false; false ones should be plausible (a changed number, drug or association).",
    'Reply with ONLY a JSON array: [{"s": "statement", "t": true, "why": "one short line"}].',
  ].join("\n\n");
}
export function parseRapid(reply: string): RapidQ[] {
  const t = String(reply ?? "");
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b <= a) return [];
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    return (Array.isArray(v) ? v : []).map((x: any) => ({ s: clip(x?.s, 300), t: x?.t === true || x?.t === "true", why: clip(x?.why, 300), ok: typeof x?.t === "boolean" || x?.t === "true" || x?.t === "false" })).filter((x: RapidQ & { ok: boolean }) => x.s && x.ok).map(({ s, t: tt, why }: RapidQ) => ({ s, t: tt, why })).slice(0, 40);
  } catch { return []; }
}
/** Rapid-fire score: 10 per right answer, +2 per answer in a streak of 3 or more, −5 per wrong answer (never below 0). */
export function rapidScore(answers: boolean[]): { score: number; right: number; wrong: number; bestStreak: number } {
  let score = 0, run = 0, best = 0, right = 0, wrong = 0;
  for (const ok of answers) {
    if (ok) { right++; run++; best = Math.max(best, run); score += 10 + (run >= 3 ? 2 : 0); }
    else { wrong++; run = 0; score -= 5; }
  }
  return { score: Math.max(0, score), right, wrong, bestStreak: best };
}
export interface RapidBest { topic: string; score: number; at: number }
export const RAPID_KEY = "cadus3.crewRapid";
export function readRapid(): RapidBest[] {
  try { const v = JSON.parse(localStorage.getItem(RAPID_KEY) || "[]"); return (Array.isArray(v) ? v : []).filter((x) => x && typeof x.topic === "string").slice(0, 50); } catch { return []; }
}
/** Keeps the best score per topic (case-insensitive); returns the new list and whether this is a new best. */
export function recordRapid(list: RapidBest[], topic: string, score: number, now = Date.now()): { list: RapidBest[]; best: boolean } {
  const k = topic.trim().toLowerCase();
  const i = list.findIndex((x) => x.topic.toLowerCase() === k);
  if (i >= 0 && list[i].score >= score) return { list, best: false };
  const item = { topic: clip(topic, 120), score, at: now };
  return { list: [item, ...list.filter((_, j) => j !== i)].slice(0, 50), best: true };
}
export function saveRapid(l: RapidBest[]) { try { localStorage.setItem(RAPID_KEY, JSON.stringify(l.slice(0, 50))); } catch { /* blocked */ } }

/* ------------------------------------------------------------------ Update 49: explain at 3 levels */

export interface ThreeLevels { simple: string; student: string; expert: string }
export function levelsPrompt(topic: string): string {
  return [
    `Explain "${topic.trim().slice(0, 200)}" at three levels.`,
    '"simple": for a 12-year-old or a patient, 60–100 words, an everyday analogy, no jargon. "student": for an MBBS student, 150–250 words, mechanism, key features and management in short markdown bullets. "expert": for a postgraduate or specialist, 200–300 words, pathophysiology detail, nuances, current guideline points, numbers and controversies, in markdown.',
    'Reply with ONLY JSON: {"simple": "…", "student": "…", "expert": "…"}.',
  ].join("\n\n");
}
export function parseLevels(reply: string): ThreeLevels | null {
  const t = String(reply ?? "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    const r = { simple: clip(v.simple, 3000), student: clip(v.student, 5000), expert: clip(v.expert, 6000) };
    return r.simple && r.student && r.expert ? r : null;
  } catch { return null; }
}
export const levelsMarkdown = (topic: string, l: ThreeLevels) => `## ${topic}\n\n### Simply put\n${l.simple}\n\n### For an MBBS student\n${l.student}\n\n### For a specialist\n${l.expert}`;

/* ------------------------------------------------------------------ Update 49: syllabus tracker */

export interface SyllabusTopic { t: string; done: boolean }
export type Syllabus = Record<string, { topics: SyllabusTopic[]; at: number }>;
export const SYLLABUS_KEY = "cadus3.crewSyllabus";
export function readSyllabus(): Syllabus {
  try {
    const v = JSON.parse(localStorage.getItem(SYLLABUS_KEY) || "{}");
    const names = EXAM_SUBJECTS.map((s) => s[0]);
    const out: Syllabus = {};
    for (const n of names) if (v?.[n] && Array.isArray(v[n].topics)) out[n] = { at: Number(v[n].at) || 0, topics: v[n].topics.filter((x: any) => x && typeof x.t === "string").slice(0, 60).map((x: any) => ({ t: clip(x.t, 160), done: x.done === true })) };
    return out;
  } catch { return {}; }
}
export function saveSyllabus(s: Syllabus) { try { localStorage.setItem(SYLLABUS_KEY, JSON.stringify(s)); } catch { /* blocked */ } }
export function syllabusPrompt(subject: string, exam: string): string {
  return [
    `List the high-yield topics in ${subject} for ${exam || "NEET-PG"} preparation in India, as a checklist a student can tick off.`,
    "Give 18–30 topics, each a short specific title (under 10 words), ordered from most to least frequently tested; group related small topics into one line.",
    'Reply with ONLY a JSON array of strings: ["topic", "topic", …].',
  ].join("\n\n");
}
export function parseSyllabus(reply: string): SyllabusTopic[] {
  const t = String(reply ?? "");
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b <= a) return [];
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    const seen = new Set<string>();
    return (Array.isArray(v) ? v : []).map((x: unknown) => clip(typeof x === "string" ? x : (x as any)?.t, 160)).filter((x: string) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase())).slice(0, 40).map((x: string) => ({ t: x, done: false }));
  } catch { return []; }
}
export function syllabusProgress(s: Syllabus): { subjects: number; done: number; total: number; pct: number } {
  const all = Object.values(s).flatMap((x) => x.topics);
  const done = all.filter((x) => x.done).length;
  return { subjects: Object.keys(s).length, done, total: all.length, pct: all.length ? Math.round((100 * done) / all.length) : 0 };
}
export const syllabusRevisePrompt = (subject: string, topic: string) => `Revise "${topic}" (${subject}) with me for NEET-PG: the 8–10 most-tested facts in short bullets, one table if it helps, the common traps, then 3 single-best-answer MCQs one at a time — wait for my answer before the next.`;

/* ------------------------------------------------------------------ Update 50: concept map */

export interface ConceptBranch { label: string; items: string[] }
export interface ConceptMap { center: string; branches: ConceptBranch[]; links: string[] }
export function conceptPrompt(topic: string): string {
  return [
    `Make a concept map of "${topic.trim().slice(0, 200)}" for a medical student.`,
    "5 to 7 branches chosen from: Definition, Causes / risk factors, Pathophysiology, Clinical features, Investigations, Treatment, Complications, Prognosis, Differentials. Each branch has 3–6 short items (under 12 words each, specific, with numbers or drug names where useful).",
    "Add 2–4 cross-links: one-line statements that connect two branches (e.g. \"Pathophysiology → Treatment: ACE inhibitors block the RAAS overdrive\").",
    'Reply with ONLY JSON: {"center": "…", "branches": [{"label": "…", "items": ["…"]}], "links": ["…"]}.',
  ].join("\n\n");
}
export function parseConcept(reply: string): ConceptMap | null {
  const t = String(reply ?? "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    const branches: ConceptBranch[] = (Array.isArray(v.branches) ? v.branches : [])
      .filter((x: any) => x && typeof x.label === "string" && Array.isArray(x.items))
      .slice(0, 8)
      .map((x: any) => ({ label: clip(x.label, 60), items: x.items.filter((i: unknown) => typeof i === "string" && i.trim()).slice(0, 8).map((i: string) => clip(i, 200)) }))
      .filter((x: ConceptBranch) => x.label && x.items.length);
    const links = (Array.isArray(v.links) ? v.links : []).filter((x: unknown) => typeof x === "string" && x.trim()).slice(0, 6).map((x: string) => clip(x, 240));
    const center = clip(v.center, 120);
    return center && branches.length >= 2 ? { center, branches, links } : null;
  } catch { return null; }
}
export const conceptMarkdown = (m: ConceptMap) => `## ${m.center} — concept map\n\n${m.branches.map((b) => `### ${b.label}\n${b.items.map((i) => `- ${i}`).join("\n")}`).join("\n\n")}${m.links.length ? `\n\n### Connections\n${m.links.map((l) => `- ${l}`).join("\n")}` : ""}`;

/* ------------------------------------------------------------------ Update 50: high-yield one-liners */

export interface OneLiner { q: string; a: string }
export function onelinerPrompt(topic: string, count = 20): string {
  return [
    `Give ${Math.max(10, Math.min(30, count))} high-yield one-liners on "${topic.trim().slice(0, 200)}" for NEET-PG / INI-CET revision.`,
    "Each is a short cue and its answer, the way toppers revise: \"Drug of choice for absence seizures\" → \"Ethosuximide (valproate if GTCS too)\". Prefer the most frequently tested facts: drugs of choice, investigations of choice, most common, pathognomonic signs, eponyms, numbers. No repeats.",
    'Reply with ONLY a JSON array: [{"q": "cue", "a": "answer"}].',
  ].join("\n\n");
}
export function parseOneliners(reply: string): OneLiner[] {
  const t = String(reply ?? "");
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a < 0 || b <= a) return [];
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    const seen = new Set<string>();
    return (Array.isArray(v) ? v : [])
      .filter((x: any) => x && typeof x.q === "string" && typeof x.a === "string" && x.q.trim() && x.a.trim())
      .map((x: any) => ({ q: clip(x.q, 240), a: clip(x.a, 240) }))
      .filter((x: OneLiner) => { const k = x.q.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 30);
  } catch { return []; }
}
export const onelinersMarkdown = (topic: string, list: OneLiner[], title = "High-yield one-liners") => `## ${title}: ${topic}\n\n${list.map((x, i) => `${i + 1}. **${x.q}** — ${x.a}`).join("\n")}`;

/* ------------------------------------------------------------------ Update 50: Socratic tutor */

export interface SocraticTurn { q: string; a: string; feedback?: string }
export interface SocraticReply { feedback: string; question: string; done: boolean; summary: string; score: number }
export const SOCRATIC_MAX = 6;
export function socraticPrompt(topic: string, level: string, turns: SocraticTurn[]): string {
  const history = turns.map((t, i) => `Q${i + 1}: ${t.q}\nStudent: ${t.a || "(no answer)"}`).join("\n\n");
  const last = turns.length >= SOCRATIC_MAX;
  return [
    `You are a Socratic medical tutor teaching "${topic.trim().slice(0, 200)}" to ${level || "an MBBS student"}. Don't lecture: lead the student to understanding with one short question at a time, building from basics (mechanism) to application (a patient).`,
    history ? `So far:\n\n${history}` : "This is the start: ask the first question.",
    turns.length ? "Give brief feedback on the student's last answer (1–3 sentences: what was right, gently correct what was wrong, add the one missing idea), then ask the next question that builds on it. If they were stuck, give a hint inside the question." : "",
    last ? 'This is the end: set "done" to true, leave "question" empty, write a 4–6 bullet markdown "summary" of what they worked out and what to revise, and a "score" from 0 to 10 for their reasoning.' : 'Set "done" to false, "summary" to "" and "score" to 0.',
    'Reply with ONLY JSON: {"feedback": "…", "question": "…", "done": false, "summary": "", "score": 0}.',
  ].filter(Boolean).join("\n\n");
}
export function parseSocratic(reply: string): SocraticReply | null {
  const t = String(reply ?? "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const v = JSON.parse(t.slice(a, b + 1));
    const r: SocraticReply = { feedback: clip(v.feedback, 1500), question: clip(v.question, 600), done: v.done === true, summary: clip(v.summary, 3000), score: Math.max(0, Math.min(10, Math.round(Number(v.score) || 0))) };
    return r.question || r.done ? r : null;
  } catch { return null; }
}
export const socraticMarkdown = (topic: string, turns: SocraticTurn[], summary: string) => `## Socratic session: ${topic}\n\n${turns.map((x, i) => `**Q${i + 1}. ${x.q}**\n\nMy answer: ${x.a || "—"}${x.feedback ? `\n\n> ${x.feedback}` : ""}`).join("\n\n")}${summary ? `\n\n### What I worked out\n${summary}` : ""}`;

/* ------------------------------------------------------------------ Update 50: long answer writer */

export const LONG_MARKS = [5, 10, 15] as const;
export function longAnswerPrompt(question: string, marks: number, subject: string, university: string): string {
  const words = marks >= 15 ? "900–1200" : marks >= 10 ? "600–800" : "300–400";
  return [
    `Write a model answer for this ${marks}-mark ${subject ? `${subject} ` : ""}long-answer question from an Indian MBBS university exam${university ? ` (${university.slice(0, 80)})` : ""}: "${question.trim().slice(0, 400)}".`,
    `About ${words} words, in the structure examiners reward: a one-line definition or introduction; then numbered markdown headings (as relevant: classification, aetiology, pathogenesis, clinical features, investigations, management, complications, prevention); bullet points, not paragraphs; one table where a comparison helps; standard textbook facts (Harrison, Robbins, Bailey & Love, Williams, Nelson, KD Tripathi).`,
    'Where a diagram earns marks, add a blockquote starting "Diagram to draw:" that describes exactly what to draw and label. End with a "Key points to underline" list of 4–6 must-mention terms and a one-line conclusion.',
    "Reply in markdown only.",
  ].join("\n\n");
}
export const cleanLongAnswer = (reply: string) => String(reply ?? "").replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "").trim().slice(0, 20000);

/* ------------------------------------------------------------------ Update 53: every subject */

/** Every subject the Crew study tools offer: the 19 MBBS / NEET-PG subjects, then specialties,
 * allied health and international exams. EXAM_SUBJECTS (used by the syllabus and exam countdown)
 * stays the 19 MBBS subjects. */
export const SUBJECT_GROUPS: [string, string[]][] = [
  ["MBBS / NEET-PG", EXAM_SUBJECTS.map((s) => s[0])],
  ["Clinical specialties", ["Respiratory Medicine", "Cardiology", "Neurology", "Nephrology", "Gastroenterology & Hepatology", "Endocrinology", "Rheumatology", "Haematology", "Medical Oncology", "Infectious Diseases", "Emergency Medicine", "Critical Care", "Neonatology", "Geriatrics", "Family Medicine", "Physical Medicine & Rehabilitation", "Radiotherapy", "Nuclear Medicine", "Transfusion Medicine", "Neurosurgery", "Urology", "Plastic Surgery", "Cardiothoracic Surgery", "Paediatric Surgery", "Surgical Gastroenterology", "Vascular Surgery", "Surgical Oncology", "Reproductive Medicine", "Palliative Medicine", "Sports Medicine", "Clinical Genetics", "Medical Ethics (AETCOM)"]],
  ["Allied health", ["Nursing", "Pharmacy (PharmD)", "Dentistry (BDS)", "Physiotherapy", "Public Health (MPH)", "Nutrition & Dietetics", "Medical Laboratory Technology", "Optometry", "Ayurveda (BAMS)", "Homoeopathy (BHMS)"]],
  ["International exams", ["USMLE Step 1", "USMLE Step 2 CK", "PLAB 1", "PLAB 2", "AMC", "FMGE / NExT"]],
];
export const ALL_SUBJECTS: string[] = SUBJECT_GROUPS.flatMap((g) => g[1]);
const subjectLine = (subject: string) => (subject ? ` (${subject.slice(0, 60)})` : "");
const jsonOf = (reply: string, open: "{" | "[") => {
  const t = String(reply ?? "");
  const a = t.indexOf(open), b = t.lastIndexOf(open === "{" ? "}" : "]");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
};
const strs = (v: unknown, n: number, len: number) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, n).map((x: string) => clip(x, len)) : []);

/* ------------------------------------------------------------------ Update 53: OSCE station */

export const OSCE_TYPES = ["History taking", "Clinical examination", "Counselling / communication", "Procedure", "Data interpretation", "Emergency management"] as const;
export interface OsceItem { item: string; marks: number }
export interface OsceStation { title: string; task: string; scenario: string; minutes: number; checklist: OsceItem[]; examinerNotes: string; pitfalls: string[] }
export function oscePrompt(subject: string, type: string, topic: string): string {
  return [
    `Create one OSCE station for an Indian MBBS final-year / internship exam${subjectLine(subject)}: type "${type}"${topic.trim() ? `, on "${topic.trim().slice(0, 160)}"` : ", on a common, high-yield condition"}.`,
    '"task": the candidate instructions exactly as posted on the door (2–4 sentences). "scenario": what the simulated patient or examiner knows (age, presentation, answers to likely questions, findings or data) — 80–160 words. "minutes": 5–10. "checklist": 10–16 observable items with marks (1 or 2 each; include introduction and consent, the key clinical points, safety-netting and closure). "examinerNotes": a short model performance. "pitfalls": 3–5 common mistakes.',
    'Reply with ONLY JSON: {"title": "…", "task": "…", "scenario": "…", "minutes": 8, "checklist": [{"item": "…", "marks": 1}], "examinerNotes": "…", "pitfalls": ["…"]}.',
  ].join("\n\n");
}
export function parseOsce(reply: string): OsceStation | null {
  const v = jsonOf(reply, "{");
  if (!v || typeof v !== "object") return null;
  const checklist: OsceItem[] = (Array.isArray(v.checklist) ? v.checklist : []).filter((x: any) => x && typeof x.item === "string" && x.item.trim()).slice(0, 20).map((x: any) => ({ item: clip(x.item, 240), marks: Math.max(1, Math.min(3, Math.round(Number(x.marks) || 1))) }));
  const r: OsceStation = { title: clip(v.title, 140), task: clip(v.task, 1200), scenario: clip(v.scenario, 2400), minutes: Math.max(3, Math.min(15, Math.round(Number(v.minutes) || 8))), checklist, examinerNotes: clip(v.examinerNotes, 2400), pitfalls: strs(v.pitfalls, 6, 240) };
  return r.task && checklist.length >= 4 ? r : null;
}
export function osceMarkPrompt(st: OsceStation, attempt: string): string {
  return [
    `Mark this OSCE attempt strictly against the checklist. Station: "${st.title}". Task: ${st.task}`,
    `Checklist (index: item):\n${st.checklist.map((c, i) => `${i}: ${c.item}`).join("\n")}`,
    `Candidate's attempt (what they said or did, typed):\n${attempt.trim().slice(0, 6000)}`,
    'Reply with ONLY JSON: {"done": [indexes of checklist items clearly covered], "feedback": "2–4 sentences: what went well and the most important thing to improve"}.',
  ].join("\n\n");
}
export function parseOsceMark(reply: string, n: number): { done: number[]; feedback: string } | null {
  const v = jsonOf(reply, "{");
  if (!v || !Array.isArray(v.done)) return null;
  const done = [...new Set(v.done.map((x: unknown) => Math.round(Number(x))).filter((x: number) => Number.isInteger(x) && x >= 0 && x < n))] as number[];
  return { done: done.sort((a, b) => a - b), feedback: clip(v.feedback, 1500) };
}
export const osceScore = (st: OsceStation, done: number[]) => {
  const total = st.checklist.reduce((a, c) => a + c.marks, 0);
  const got = st.checklist.reduce((a, c, i) => a + (done.includes(i) ? c.marks : 0), 0);
  return { got, total, pct: total ? Math.round((100 * got) / total) : 0 };
};
export const osceMarkdown = (st: OsceStation, done: number[]) => {
  const sc = osceScore(st, done);
  return `## OSCE: ${st.title}\n\n**Task:** ${st.task}\n\n**Score:** ${sc.got}/${sc.total} (${sc.pct}%)\n\n${st.checklist.map((c, i) => `- [${done.includes(i) ? "x" : " "}] ${c.item} (${c.marks})`).join("\n")}\n\n**Model performance:** ${st.examinerNotes}${st.pitfalls.length ? `\n\n**Pitfalls:**\n${st.pitfalls.map((p) => `- ${p}`).join("\n")}` : ""}`;
};

/* ------------------------------------------------------------------ Update 53: answer grader */

export interface Graded { score: number; outOf: number; verdict: string; strengths: string[]; missing: string[]; errors: string[]; structure: string[]; outline: string }
export function gradePrompt(question: string, marks: number, subject: string, answer: string): string {
  return [
    `You are a strict but fair Indian MBBS university examiner${subjectLine(subject)}. Grade this written answer out of ${marks} marks.`,
    `Question: "${question.trim().slice(0, 500)}"`,
    `Student's answer:\n${answer.trim().slice(0, 8000)}`,
    "Mark for content (correct, complete, specific facts and numbers), structure (definition, headings, points, diagrams, conclusion) and presentation. Give half marks where earned. Be specific: name the exact missing points.",
    `Reply with ONLY JSON: {"score": number (0 to ${marks}, steps of 0.5), "outOf": ${marks}, "verdict": "one sentence", "strengths": ["…"], "missing": ["key points not covered"], "errors": ["factual mistakes, with the correction"], "structure": ["how to present it better"], "outline": "a model answer outline in markdown headings and bullets"}.`,
  ].join("\n\n");
}
export function parseGrade(reply: string, marks: number): Graded | null {
  const v = jsonOf(reply, "{");
  if (!v || typeof v !== "object") return null;
  const raw = Number(v.score);
  if (!Number.isFinite(raw)) return null;
  const score = Math.max(0, Math.min(marks, Math.round(raw * 2) / 2));
  return { score, outOf: marks, verdict: clip(v.verdict, 400), strengths: strs(v.strengths, 8, 300), missing: strs(v.missing, 12, 300), errors: strs(v.errors, 8, 300), structure: strs(v.structure, 6, 300), outline: clip(v.outline, 6000) };
}
export const gradeMarkdown = (q: string, g: Graded) => `## Graded answer: ${q}\n\n**Score:** ${g.score}/${g.outOf} — ${g.verdict}${g.strengths.length ? `\n\n### Strengths\n${g.strengths.map((x) => `- ${x}`).join("\n")}` : ""}${g.missing.length ? `\n\n### Missing points\n${g.missing.map((x) => `- ${x}`).join("\n")}` : ""}${g.errors.length ? `\n\n### Errors\n${g.errors.map((x) => `- ${x}`).join("\n")}` : ""}${g.structure.length ? `\n\n### Presentation\n${g.structure.map((x) => `- ${x}`).join("\n")}` : ""}${g.outline ? `\n\n### Model outline\n${g.outline}` : ""}`;

/* ------------------------------------------------------------------ Update 53: drug cards */

export interface DrugCard { drug: string; drugClass: string; mechanism: string; uses: string[]; dose: string; adverse: string[]; contraindications: string[]; interactions: string[]; monitoring: string; pearls: string[] }
export function drugCardPrompt(drug: string, subject: string): string {
  return [
    `Make a one-page revision drug card for "${drug.trim().slice(0, 80)}" for Indian medical exams and practice${subjectLine(subject)}.`,
    'Fields: "drug" (generic name), "drugClass", "mechanism" (1–2 sentences), "uses" (3–6, most important first), "dose" (usual adult dose and route; child dose if commonly used), "adverse" (4–8, the exam favourites first), "contraindications" (2–5), "interactions" (2–5), "monitoring" (one line, or ""), "pearls" (3–5 high-yield exam one-liners: drug of choice for, antidote, eponyms, numbers).',
    'Reply with ONLY JSON: {"drug": "…", "drugClass": "…", "mechanism": "…", "uses": ["…"], "dose": "…", "adverse": ["…"], "contraindications": ["…"], "interactions": ["…"], "monitoring": "…", "pearls": ["…"]}.',
  ].join("\n\n");
}
export function parseDrugCard(reply: string): DrugCard | null {
  const v = jsonOf(reply, "{");
  if (!v || typeof v !== "object") return null;
  const c: DrugCard = { drug: clip(v.drug, 80), drugClass: clip(v.drugClass, 160), mechanism: clip(v.mechanism, 600), uses: strs(v.uses, 8, 200), dose: clip(v.dose, 500), adverse: strs(v.adverse, 10, 200), contraindications: strs(v.contraindications, 6, 200), interactions: strs(v.interactions, 6, 200), monitoring: clip(v.monitoring, 300), pearls: strs(v.pearls, 6, 240) };
  return c.drug && c.mechanism && c.uses.length ? c : null;
}
export const drugCardMarkdown = (c: DrugCard) => `## ${c.drug}\n\n*${c.drugClass}*\n\n**Mechanism:** ${c.mechanism}\n\n**Uses**\n${c.uses.map((x) => `- ${x}`).join("\n")}\n\n**Dose:** ${c.dose}\n\n**Adverse effects**\n${c.adverse.map((x) => `- ${x}`).join("\n")}${c.contraindications.length ? `\n\n**Contraindications**\n${c.contraindications.map((x) => `- ${x}`).join("\n")}` : ""}${c.interactions.length ? `\n\n**Interactions**\n${c.interactions.map((x) => `- ${x}`).join("\n")}` : ""}${c.monitoring ? `\n\n**Monitoring:** ${c.monitoring}` : ""}${c.pearls.length ? `\n\n**Exam pearls**\n${c.pearls.map((x) => `- ${x}`).join("\n")}` : ""}`;
/** Flashcards from a drug card, for Crew notes review. */
export const drugCardFlashcards = (c: DrugCard) => [
  { front: `${c.drug}: class and mechanism?`, back: `${c.drugClass}. ${c.mechanism}` },
  { front: `${c.drug}: main uses?`, back: c.uses.join("; ") },
  { front: `${c.drug}: key adverse effects?`, back: c.adverse.join("; ") },
  ...c.pearls.slice(0, 3).map((p, i) => ({ front: `${c.drug}: exam pearl ${i + 1}`, back: p })),
];
export const DRUG_CARDS_KEY = "cadus3.crewDrugCards";
export function readDrugCards(): DrugCard[] {
  try {
    const v = JSON.parse(localStorage.getItem(DRUG_CARDS_KEY) || "[]");
    return Array.isArray(v) ? v.map((x) => parseDrugCard(JSON.stringify(x))).filter((x): x is DrugCard => !!x).slice(0, 200) : [];
  } catch { return []; }
}
export function saveDrugCards(list: DrugCard[]) { try { localStorage.setItem(DRUG_CARDS_KEY, JSON.stringify(list.slice(0, 200))); } catch { /* blocked */ } }
export const addDrugCard = (list: DrugCard[], c: DrugCard) => [c, ...list.filter((x) => x.drug.toLowerCase() !== c.drug.toLowerCase())].slice(0, 200);

/* ------------------------------------------------------------------ Update 53: revision sprint */

export interface SprintQ { q: string; options: string[]; answer: number; why: string }
export interface Sprint { topic: string; keyPoints: string[]; questions: SprintQ[]; recap: string[] }
export const SPRINT_PHASES: [string, number][] = [["Key points", 10], ["Quick questions", 10], ["Recap", 5]];
export function sprintPrompt(subject: string, topic: string): string {
  return [
    `Plan a 25-minute revision sprint on "${topic.trim().slice(0, 160)}"${subjectLine(subject)} for an Indian medical student.`,
    '"keyPoints": 10–14 high-yield points, each one short line with specific facts and numbers. "questions": 6 single-best-answer MCQs (4 options, "answer" is the 0-based index, "why" one sentence) testing those points. "recap": 5 lines to read last — the things most likely to be asked.',
    'Reply with ONLY JSON: {"keyPoints": ["…"], "questions": [{"q": "…", "options": ["…", "…", "…", "…"], "answer": 0, "why": "…"}], "recap": ["…"]}.',
  ].join("\n\n");
}
export function parseSprint(reply: string, topic: string): Sprint | null {
  const v = jsonOf(reply, "{");
  if (!v || typeof v !== "object") return null;
  const questions: SprintQ[] = (Array.isArray(v.questions) ? v.questions : []).filter((x: any) => x && typeof x.q === "string" && Array.isArray(x.options) && x.options.length >= 2).slice(0, 10).map((x: any) => {
    const options = x.options.slice(0, 5).map((o: unknown) => clip(o, 200));
    const answer = Math.round(Number(x.answer));
    return { q: clip(x.q, 500), options, answer: Number.isInteger(answer) && answer >= 0 && answer < options.length ? answer : -1, why: clip(x.why, 400) };
  }).filter((x: SprintQ) => x.answer >= 0);
  const s: Sprint = { topic: clip(topic, 160), keyPoints: strs(v.keyPoints, 16, 300), questions, recap: strs(v.recap, 8, 300) };
  return s.keyPoints.length >= 3 && questions.length >= 2 ? s : null;
}
export const sprintMarkdown = (s: Sprint, right: number) => `## Revision sprint: ${s.topic}\n\n**Score:** ${right}/${s.questions.length}\n\n### Key points\n${s.keyPoints.map((x) => `- ${x}`).join("\n")}\n\n### Recap\n${s.recap.map((x) => `- ${x}`).join("\n")}`;
