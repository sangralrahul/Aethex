/**
 * The Cadus formulary: the Aethex drug database (344 Indian brands and
 * generics) with a dosing overlay for the most-prescribed generics (usual
 * adult and paediatric doses, maximums, renal and hepatic notes and NLEM 2022
 * status), search, and a prescription model that the interaction checker runs
 * over and the letterhead prints. All data lives in the app: no AI.
 *
 * Doses are usual starting references from the National Formulary of India,
 * BNF and standard texts, for a prescriber to confirm; they are not patient-
 * specific advice.
 */
import { DRUG_DATABASE, type Drug } from "@/data/drugDatabase";

export interface Dosing {
  /** Drug id in the database. */
  id: string;
  adult: string;
  child?: string;
  max?: string;
  renal?: string;
  hepatic?: string;
  pregnancy?: string;
  /** On India's National List of Essential Medicines 2022. */
  nlem: boolean;
  /** Price band for a usual course or a month, in rupees, as a rough guide. */
  cost?: "low" | "medium" | "high";
  tips?: string;
}

const D = (id: string, adult: string, extra: Partial<Dosing> & { nlem: boolean }): Dosing => ({ id, adult, ...extra });

export const DOSING: Dosing[] = [
  D("paracetamol", "500–1000 mg every 4–6 h", { child: "15 mg/kg every 4–6 h", max: "4 g/day (3 g if under 50 kg, liver disease or alcohol)", hepatic: "Reduce to 2–3 g/day", nlem: true, cost: "low", tips: "Count paracetamol in combination products." }),
  D("ibuprofen", "400 mg every 6–8 h with food", { child: "5–10 mg/kg every 6–8 h (over 3 months)", max: "2.4 g/day (1.2 g OTC)", renal: "Avoid if eGFR below 30; use lowest dose briefly if 30–60", nlem: true, cost: "low", tips: "Avoid in dengue (bleeding) and in the third trimester." }),
  D("diclofenac", "50 mg 2–3 times daily", { max: "150 mg/day", renal: "Avoid in significant impairment", nlem: false, cost: "low", tips: "Highest cardiovascular risk among common NSAIDs; avoid in heart failure." }),
  D("tramadol", "50–100 mg every 4–6 h", { max: "400 mg/day (300 mg over 75 years)", renal: "Every 12 h if CrCl below 30; avoid below 10", hepatic: "50 mg every 12 h in severe impairment", nlem: true, cost: "low", tips: "Seizure risk with SSRIs, tricyclics and in epilepsy." }),
  D("morphine", "2.5–10 mg IV/SC every 4 h, titrated (oral 5–10 mg every 4 h)", { child: "0.1 mg/kg IV every 4 h", renal: "Reduce dose and extend interval; accumulates", nlem: true, cost: "low", tips: "Prescribe a laxative with it. Naloxone to hand." }),
  D("amoxicillin", "500 mg every 8 h (1 g every 8 h for pneumonia)", { child: "25–45 mg/kg/day in 2–3 doses (80–90 mg/kg/day for otitis media or pneumonia)", max: "3 g/day", renal: "250–500 mg every 12 h if CrCl below 30", nlem: true, cost: "low" }),
  D("augmentin", "625 mg every 8 h or 1 g every 12 h", { child: "25–45 mg/kg/day of amoxicillin in 2 doses", renal: "Every 12 h if CrCl 10–30; every 24 h below 10", hepatic: "Avoid if previous cholestatic jaundice with it", nlem: true, cost: "medium", tips: "Diarrhoea is common; take with food." }),
  D("azithromycin", "500 mg once daily for 3 days (or 500 mg day 1 then 250 mg for 4 days)", { child: "10 mg/kg once daily for 3 days", max: "500 mg/day (1 g single dose for chlamydia)", hepatic: "Caution", nlem: true, cost: "low", tips: "QT prolongation with other QT-prolonging drugs; enteric fever 20 mg/kg/day for 7 days." }),
  D("doxycycline", "100 mg every 12 h (200 mg first day for some infections)", { child: "Over 8 years: 2–4 mg/kg/day in 1–2 doses", max: "200 mg/day", nlem: true, cost: "low", tips: "Scrub typhus and leptospirosis first-line. Take with a full glass of water, sitting up. Avoid in pregnancy." }),
  D("ciprofloxacin", "500–750 mg every 12 h", { max: "1.5 g/day", renal: "250–500 mg every 12 h if CrCl below 30", nlem: true, cost: "low", tips: "Tendon rupture, QT, dysglycaemia; avoid in children unless no alternative. Not for enteric fever in India (resistance)." }),
  D("levofloxacin", "500–750 mg once daily", { renal: "750 mg every 48 h if CrCl 20–49; 500 mg every 48 h below 20", nlem: true, cost: "low" }),
  D("ceftriaxone", "1–2 g once daily (2 g every 12 h in meningitis)", { child: "50–80 mg/kg once daily (100 mg/kg/day in meningitis, max 4 g)", max: "4 g/day", nlem: true, cost: "medium", tips: "Do not mix with calcium-containing fluids in neonates." }),
  D("cefixime", "200 mg every 12 h or 400 mg once daily", { child: "8 mg/kg/day in 1–2 doses (10–20 mg/kg/day in enteric fever)", max: "400 mg/day", renal: "200 mg/day if CrCl below 20", nlem: true, cost: "low" }),
  D("cefuroxime", "250–500 mg every 12 h (750 mg–1.5 g IV every 8 h)", { child: "10–15 mg/kg every 12 h", renal: "Every 12–24 h below CrCl 20", nlem: false, cost: "medium" }),
  D("piperacillin-tazobactam", "4.5 g IV every 6–8 h", { child: "90 mg/kg every 8 h (over 2 months)", renal: "2.25–3.375 g every 6–8 h if CrCl below 40", nlem: true, cost: "high", tips: "Extended 4-hour infusion improves killing in severe infection." }),
  D("meropenem", "1 g IV every 8 h (2 g every 8 h in meningitis)", { child: "20 mg/kg every 8 h (40 mg/kg in meningitis)", renal: "1 g every 12 h if CrCl 26–50; 500 mg every 12 h if 10–25", nlem: true, cost: "high", tips: "Reserve antibiotic: needs ID or stewardship approval in most hospitals." }),
  D("vancomycin", "15–20 mg/kg IV every 8–12 h (loading 25–30 mg/kg in sepsis)", { child: "15 mg/kg every 6 h", renal: "Dose by levels; extend interval", nlem: true, cost: "medium", tips: "Trough 15–20 mg/L or AUC-guided; infuse over at least 1 h." }),
  D("metronidazole", "400–500 mg every 8 h (oral or IV)", { child: "7.5 mg/kg every 8 h", max: "4 g/day", hepatic: "Reduce by a third in severe impairment", nlem: true, cost: "low", tips: "No alcohol during and for 48 h after (disulfiram-like reaction)." }),
  D("cotrimoxazole", "960 mg (sulfamethoxazole 800/trimethoprim 160) every 12 h", { child: "24 mg/kg (of sulfamethoxazole) every 12 h", renal: "Halve if CrCl 15–30; avoid below 15", nlem: true, cost: "low", tips: "Hyperkalaemia with ACE inhibitors or spironolactone; PCP treatment 15–20 mg/kg/day of trimethoprim." }),
  D("nitrofurantoin", "100 mg every 12 h (modified release) for 5 days", { max: "400 mg/day", renal: "Avoid if eGFR below 45", nlem: true, cost: "low", tips: "Lower urinary tract infection only; not for pyelonephritis." }),
  D("gentamicin", "5–7 mg/kg IV once daily", { child: "7.5 mg/kg once daily", renal: "Extend the interval by levels; avoid if possible", nlem: true, cost: "low", tips: "Ototoxic and nephrotoxic: levels from day 2, limit to 5–7 days." }),
  D("amikacin", "15 mg/kg IV once daily", { child: "15 mg/kg once daily", max: "1.5 g/day", renal: "By levels; extend the interval", nlem: true, cost: "low" }),
  D("clindamycin", "300–450 mg every 6–8 h (600–900 mg IV every 8 h)", { child: "20–40 mg/kg/day in 3–4 doses", nlem: true, cost: "medium", tips: "C. difficile risk; stop if significant diarrhoea." }),
  D("linezolid", "600 mg every 12 h", { child: "10 mg/kg every 8 h", nlem: true, cost: "medium", tips: "Myelosuppression after 2 weeks (weekly counts); serotonin syndrome with SSRIs." }),
  D("rifampicin", "10 mg/kg once daily (450 mg under 50 kg, 600 mg over 50 kg)", { child: "10–20 mg/kg once daily", max: "600 mg/day", hepatic: "Monitor LFTs; stop if ALT over 3× with symptoms", nlem: true, cost: "low", tips: "NTEP daily regimen is weight-banded fixed-dose combinations. Induces many drugs (OCPs, warfarin, ART)." }),
  D("isoniazid", "5 mg/kg once daily (max 300 mg)", { child: "10 mg/kg once daily", max: "300 mg/day", nlem: true, cost: "low", tips: "Pyridoxine 10–25 mg daily with it in pregnancy, diabetes, HIV, malnutrition or renal failure." }),
  D("ethambutol", "15–20 mg/kg once daily", { child: "20 mg/kg once daily", renal: "Every 36 h if CrCl below 30", nlem: true, cost: "low", tips: "Baseline visual acuity and colour vision; stop if vision changes." }),
  D("pyrazinamide", "25 mg/kg once daily", { child: "35 mg/kg once daily", max: "2 g/day", hepatic: "Most hepatotoxic of the four; monitor", nlem: true, cost: "low", tips: "Raises uric acid; gout rarely needs treatment." }),
  D("fluconazole", "150 mg single dose (vaginal candidiasis); 200–400 mg once daily (oesophageal, cryptococcal 800 mg)", { child: "6–12 mg/kg once daily", renal: "Halve if CrCl below 50", nlem: true, cost: "low", tips: "Many interactions (warfarin, statins, QT)." }),
  D("acyclovir", "400 mg 3 times daily (genital herpes); 800 mg 5 times daily (zoster); 10 mg/kg IV every 8 h (encephalitis)", { child: "20 mg/kg every 6 h (chickenpox, max 800 mg)", renal: "Extend the interval; hydrate for IV", nlem: true, cost: "low" }),
  D("oseltamivir", "75 mg every 12 h for 5 days", { child: "By weight: 30–75 mg every 12 h", renal: "75 mg once daily if CrCl 30–60; 30 mg once daily if 10–30", nlem: true, cost: "medium", tips: "Start within 48 h; still worth starting later in severe illness." }),
  D("metformin", "500 mg once or twice daily with meals, up to 1 g twice daily", { max: "2–2.5 g/day", renal: "Max 1 g/day if eGFR 30–45; stop below 30 and before iodinated contrast", nlem: true, cost: "low", tips: "Hold in sepsis, dehydration or surgery; B12 yearly after 4 years." }),
  D("glimepiride", "1–2 mg once daily before breakfast, up to 4 mg", { max: "6 mg/day", renal: "Start 1 mg; hypoglycaemia risk", nlem: true, cost: "low", tips: "Hypoglycaemia in the elderly and in missed meals." }),
  D("gliclazide", "40–80 mg once or twice daily (MR 30–120 mg once daily)", { max: "320 mg/day (MR 120 mg)", nlem: false, cost: "low" }),
  D("sitagliptin", "100 mg once daily", { renal: "50 mg if eGFR 30–45; 25 mg below 30", nlem: false, cost: "medium" }),
  D("empagliflozin", "10 mg once daily (25 mg if needed)", { renal: "Not started below eGFR 20 (30 for glycaemia); continue for heart or kidney benefit", nlem: false, cost: "medium", tips: "Genital infections, volume depletion; hold on sick days (euglycaemic ketoacidosis)." }),
  D("insulin-regular", "0.1 unit/kg/h IV infusion (DKA); 4–6 units SC before meals to start", { child: "0.05–0.1 unit/kg/h in DKA", nlem: true, cost: "low", tips: "Potassium before and during an infusion." }),
  D("amlodipine", "5 mg once daily, up to 10 mg", { max: "10 mg/day", hepatic: "Start 2.5 mg", nlem: true, cost: "low", tips: "Ankle oedema is dose-related." }),
  D("telmisartan", "40 mg once daily, up to 80 mg", { max: "80 mg/day", renal: "Check creatinine and potassium within 2 weeks", pregnancy: "Contraindicated", nlem: true, cost: "low" }),
  D("losartan", "50 mg once daily, up to 100 mg", { max: "100 mg/day", pregnancy: "Contraindicated", nlem: true, cost: "low" }),
  D("enalapril", "5 mg once daily, up to 10–20 mg twice daily", { max: "40 mg/day", renal: "Start 2.5 mg if CrCl below 30", pregnancy: "Contraindicated", nlem: true, cost: "low", tips: "Dry cough in 10%; angioedema." }),
  D("ramipril", "2.5 mg once daily, up to 10 mg", { max: "10 mg/day", renal: "1.25 mg start if CrCl below 30", pregnancy: "Contraindicated", nlem: false, cost: "low" }),
  D("metoprolol", "25–50 mg twice daily (succinate 25–200 mg once daily)", { max: "400 mg/day", hepatic: "Reduce", nlem: true, cost: "low", tips: "Do not stop abruptly." }),
  D("atenolol", "25–50 mg once daily", { max: "100 mg/day", renal: "25 mg daily if CrCl below 15", nlem: true, cost: "low" }),
  D("carvedilol", "3.125 mg twice daily, doubled every 2 weeks to 25 mg twice daily (50 mg if over 85 kg)", { nlem: true, cost: "low", tips: "Heart failure: start low when euvolaemic." }),
  D("atorvastatin", "10–20 mg at night (40–80 mg after ACS or stroke)", { max: "80 mg/day", hepatic: "Avoid in active liver disease", nlem: true, cost: "low", tips: "Myalgia; check CK only if symptomatic." }),
  D("rosuvastatin", "5–10 mg once daily, up to 20 mg (40 mg rarely)", { renal: "Max 10 mg if CrCl below 30", nlem: false, cost: "low", tips: "Asians: start 5 mg." }),
  D("aspirin", "75–150 mg once daily (300 mg loading in ACS)", { max: "150 mg/day for antiplatelet use", nlem: true, cost: "low", tips: "Avoid in dengue and in children with viral illness." }),
  D("clopidogrel", "75 mg once daily (300–600 mg loading)", { nlem: true, cost: "low", tips: "Omeprazole reduces its effect; use pantoprazole." }),
  D("warfarin", "5 mg once daily to start, adjusted to INR", { nlem: true, cost: "low", tips: "Target INR 2–3 (2.5–3.5 mechanical mitral valves). Many interactions." }),
  D("enoxaparin", "1 mg/kg SC every 12 h (treatment); 40 mg SC once daily (prophylaxis)", { renal: "1 mg/kg once daily if CrCl below 30", nlem: true, cost: "medium" }),
  D("furosemide", "20–40 mg once or twice daily (IV 40–80 mg in acute pulmonary oedema)", { child: "1–2 mg/kg per dose", max: "Up to 600 mg/day in resistant oedema", nlem: true, cost: "low", tips: "Check potassium and creatinine; ototoxic at high IV rates." }),
  D("spironolactone", "25 mg once daily (heart failure); 50–200 mg (ascites)", { renal: "Avoid if eGFR below 30 or K above 5", nlem: true, cost: "low", tips: "Hyperkalaemia with ACE inhibitors or ARBs." }),
  D("digoxin", "0.125–0.25 mg once daily (loading 0.5 mg then 0.25 mg 6-hourly ×2)", { renal: "0.0625–0.125 mg; level-guided", nlem: true, cost: "low", tips: "Toxicity with hypokalaemia; levels 0.5–0.9 ng/mL in heart failure." }),
  D("amiodarone", "200 mg 3 times daily for 1 week, twice daily for 1 week, then 200 mg daily (IV 300 mg over 1 h then 900 mg over 23 h)", { nlem: true, cost: "low", tips: "Thyroid, liver, lung and eye monitoring; many interactions." }),
  D("pantoprazole", "40 mg once daily before breakfast (80 mg IV bolus then 8 mg/h infusion in bleeding ulcer)", { nlem: true, cost: "low", tips: "Review long-term use: B12, magnesium, fracture, C. difficile." }),
  D("omeprazole", "20 mg once daily (40 mg in reflux oesophagitis)", { max: "40 mg twice daily", nlem: true, cost: "low" }),
  D("ondansetron", "4–8 mg every 8 h (oral or IV)", { child: "0.15 mg/kg per dose (max 8 mg)", max: "24 mg/day (16 mg IV single dose)", hepatic: "Max 8 mg/day in severe impairment", nlem: true, cost: "low", tips: "QT prolongation." }),
  D("domperidone", "10 mg 3 times daily before meals", { max: "30 mg/day", nlem: true, cost: "low", tips: "Avoid over 60 years, in heart disease and with QT-prolonging drugs." }),
  D("salbutamol", "100–200 micrograms (1–2 puffs) as needed; 2.5–5 mg nebulised every 20 min ×3 in acute asthma", { child: "2.5 mg nebulised (under 5 years)", nlem: true, cost: "low", tips: "Use a spacer; hypokalaemia with repeated nebulisation." }),
  D("budesonide-inhaled", "200–400 micrograms inhaled twice daily (up to 800 micrograms twice daily)", { child: "100–200 micrograms twice daily", nlem: true, cost: "low", tips: "Rinse the mouth after use." }),
  D("prednisolone", "30–40 mg once daily for 5 days (acute asthma, COPD); 1 mg/kg (max 60 mg) in many immune conditions", { child: "1–2 mg/kg once daily (max 40 mg)", nlem: true, cost: "low", tips: "No taper needed under 2–3 weeks. Screen for strongyloides and TB before long courses." }),
  D("hydrocortisone", "100 mg IV every 6–8 h (adrenal crisis, septic shock 50 mg every 6 h)", { child: "2–4 mg/kg IV", nlem: true, cost: "low" }),
  D("dexamethasone", "6 mg once daily for up to 10 days (severe COVID-19); 0.15 mg/kg every 6 h for 4 days (bacterial meningitis); 8 mg IV (raised intracranial pressure)", { child: "0.6 mg/kg single dose (croup, max 16 mg)", nlem: true, cost: "low" }),
  D("cetirizine", "10 mg once daily", { child: "2.5–5 mg once or twice daily (2–6 years)", renal: "5 mg daily if CrCl below 50", nlem: true, cost: "low" }),
  D("chlorpheniramine", "4 mg every 4–6 h", { child: "0.1 mg/kg per dose", max: "24 mg/day", nlem: true, cost: "low", tips: "Sedating; avoid in the elderly." }),
  D("levothyroxine", "1.6 micrograms/kg once daily on an empty stomach (25–50 micrograms start in the elderly or heart disease)", { nlem: true, cost: "low", tips: "Recheck TSH after 6–8 weeks; raise the dose by 25–30% in pregnancy." }),
  D("sertraline", "50 mg once daily, up to 200 mg", { max: "200 mg/day", hepatic: "Reduce", nlem: false, cost: "low", tips: "Safest SSRI in heart disease; 2–4 weeks to work." }),
  D("escitalopram", "10 mg once daily, up to 20 mg", { max: "20 mg/day (10 mg over 65 years)", nlem: false, cost: "low", tips: "QT prolongation at higher doses." }),
  D("fluoxetine", "20 mg once daily, up to 60 mg", { max: "80 mg/day", nlem: true, cost: "low" }),
  D("amitriptyline", "10–25 mg at night (neuropathic pain); 75–150 mg (depression)", { max: "150 mg/day outpatient", nlem: true, cost: "low", tips: "Anticholinergic; dangerous in overdose." }),
  D("haloperidol", "2–10 mg every 4–8 h (acute agitation 2.5–5 mg IM)", { max: "20 mg/day", nlem: true, cost: "low", tips: "Extrapyramidal effects; QT; avoid in Parkinson's and dementia with Lewy bodies." }),
  D("olanzapine", "5–10 mg once daily, up to 20 mg", { max: "20 mg/day", nlem: true, cost: "low", tips: "Weight gain, diabetes; monitor metabolic profile." }),
  D("risperidone", "1–2 mg once or twice daily, up to 6 mg", { max: "16 mg/day (rarely above 6)", renal: "Halve", nlem: true, cost: "low" }),
  D("lorazepam", "1–4 mg (0.5–1 mg in the elderly); 4 mg IV for status epilepticus (0.1 mg/kg)", { child: "0.1 mg/kg IV (max 4 mg)", nlem: true, cost: "low", tips: "Respiratory depression with opioids." }),
  D("diazepam", "2–10 mg 2–4 times daily; 10 mg IV/rectal in seizures", { child: "0.2–0.3 mg/kg IV; 0.5 mg/kg rectal", nlem: true, cost: "low" }),
  D("phenytoin", "Loading 15–20 mg/kg IV at up to 50 mg/min; then 300 mg once daily (5 mg/kg)", { child: "Loading 20 mg/kg; 5–8 mg/kg/day", nlem: true, cost: "low", tips: "Narrow therapeutic range; levels; many interactions; purple glove syndrome with extravasation." }),
  D("levetiracetam", "500 mg every 12 h, up to 1.5 g every 12 h (loading 60 mg/kg IV, max 4.5 g, in status)", { child: "10–30 mg/kg every 12 h", renal: "Halve if CrCl below 50", nlem: true, cost: "low", tips: "Irritability and mood change." }),
  D("valproate", "10–15 mg/kg/day, up to 20–30 mg/kg/day (loading 20–40 mg/kg IV in status)", { child: "Same per kg", max: "2.5 g/day", hepatic: "Contraindicated in liver disease", pregnancy: "Avoid: neural tube defects", nlem: true, cost: "low", tips: "Hepatotoxicity, pancreatitis, hyperammonaemia; weight gain." }),
  D("carbamazepine", "100–200 mg twice daily, up to 400–600 mg twice daily", { max: "1.6 g/day", nlem: true, cost: "low", tips: "HLA-B*1502 testing in those of Asian ancestry (SJS); hyponatraemia; enzyme inducer." }),
  D("gabapentin", "300 mg at night, increased to 300 mg 3 times daily, up to 3.6 g/day", { renal: "Reduce by CrCl", nlem: false, cost: "low" }),
  D("pregabalin", "75 mg twice daily, up to 300 mg twice daily", { renal: "Reduce by CrCl", nlem: false, cost: "medium", tips: "Misuse potential; sedation with opioids." }),
  D("artesunate", "2.4 mg/kg IV at 0, 12 and 24 h, then daily (3 mg/kg under 20 kg)", { child: "3 mg/kg per dose under 20 kg", nlem: true, cost: "low", tips: "Severe malaria first-line (NCVBDC). Follow with a full ACT course. Check haemoglobin for 4 weeks (delayed haemolysis)." }),
  D("artemether-lumefantrine", "4 tablets (20/120) twice daily for 3 days with fatty food (over 35 kg)", { child: "By weight: 1–3 tablets twice daily for 3 days", nlem: true, cost: "low", tips: "Uncomplicated P. falciparum in the north-east; ACT with SP elsewhere per NCVBDC." }),
  D("chloroquine", "600 mg base day 1, 600 mg day 2, 300 mg day 3 (10, 10, 5 mg/kg)", { child: "10 mg/kg then 10 mg/kg then 5 mg/kg", nlem: true, cost: "low", tips: "P. vivax only in India; add primaquine 0.25 mg/kg daily for 14 days after G6PD testing." }),
  D("primaquine", "0.25 mg/kg once daily for 14 days (P. vivax); 0.75 mg/kg single dose (P. falciparum gametocytes)", { nlem: true, cost: "low", tips: "Test G6PD first; contraindicated in pregnancy and infants." }),
  D("albendazole", "400 mg single dose (worms); 400 mg twice daily for 8–30 days (neurocysticercosis)", { child: "200 mg single dose (1–2 years)", nlem: true, cost: "low", tips: "Steroids with it in neurocysticercosis." }),
  D("ivermectin", "200 micrograms/kg single dose (scabies: repeat after 7–14 days)", { child: "Over 15 kg", nlem: true, cost: "low" }),
  D("iron-folic-acid", "1 tablet (100 mg elemental iron + 500 micrograms folic acid) once daily (pregnancy prophylaxis); twice daily for anaemia", { child: "3 mg/kg/day elemental iron", nlem: true, cost: "low", tips: "Anaemia Mukt Bharat regimens; take with vitamin C, away from tea and calcium." }),
  D("cholecalciferol", "60,000 IU once weekly for 8 weeks, then monthly (deficiency); 1,000–2,000 IU daily (maintenance)", { child: "Deficiency: 2,000 IU daily or 60,000 IU weekly for 6 weeks", nlem: false, cost: "low" }),
  D("epinephrine", "0.5 mg IM (0.5 mL of 1:1000) in anaphylaxis, repeat every 5 min; 1 mg IV every 3–5 min in cardiac arrest", { child: "10 micrograms/kg IM (0.01 mL/kg of 1:1000; max 0.5 mg)", nlem: true, cost: "low", tips: "IM into the anterolateral thigh; never IV bolus for anaphylaxis." }),
  D("norepinephrine", "0.05–0.5 micrograms/kg/min IV infusion, titrated to MAP 65", { child: "0.05–1 micrograms/kg/min", nlem: true, cost: "low", tips: "Central line preferred; extravasation causes necrosis (phentolamine)." }),
  D("atropine", "0.5–1 mg IV every 3–5 min (bradycardia, max 3 mg); 2–5 mg IV doubled every 5 min until atropinised (organophosphate)", { child: "20 micrograms/kg (min 0.1 mg)", nlem: true, cost: "low", tips: "Organophosphate: aim for a dry chest and HR over 80, not dilated pupils." }),
  D("naloxone", "0.4 mg IV/IM, repeat every 2–3 min up to 2 mg (0.04–0.1 mg increments in opioid dependence)", { child: "10 micrograms/kg", nlem: true, cost: "low", tips: "Shorter than most opioids: observe and consider an infusion." }),
  D("magnesium-sulfate", "4 g IV over 5–15 min then 1 g/h IV for 24 h (Zuspan) or 4 g IV + 10 g IM then 5 g IM every 4 h (Pritchard) for eclampsia; 2 g IV over 20 min (acute severe asthma)", { child: "25–50 mg/kg (asthma, max 2 g)", renal: "Reduce the infusion; monitor levels and reflexes", nlem: true, cost: "low", tips: "Stop if reflexes are lost, RR under 12 or urine under 30 mL/h; calcium gluconate antidote." }),
  D("oxytocin", "10 units IM after delivery (third stage); 5 units IV slow (caesarean); 20–40 units in 1 L at 125 mL/h (postpartum haemorrhage)", { nlem: true, cost: "low" }),
  D("misoprostol", "600–800 micrograms sublingual or rectal (postpartum haemorrhage); 25 micrograms vaginal every 4–6 h (induction)", { nlem: true, cost: "low" }),
  D("tranexamic-acid", "1 g IV over 10 min within 3 h, then 1 g over 8 h (trauma, postpartum haemorrhage)", { child: "15 mg/kg (max 1 g)", renal: "Reduce", nlem: true, cost: "low" }),
  D("ors", "50–100 mL/kg over 4 h (some dehydration); then 10 mL/kg per loose stool", { child: "Same per kg; zinc 20 mg (10 mg under 6 months) daily for 14 days", nlem: true, cost: "low", tips: "Low-osmolarity ORS; continue feeding." }),
  D("zinc-sulfate", "20 mg once daily for 14 days (10 mg under 6 months) in childhood diarrhoea", { nlem: true, cost: "low" }),
  D("anti-snake-venom", "10 vials IV over 1 h (polyvalent), repeat 10 vials after 6 h if 20WBCT still positive, or 1–2 h if neurotoxic signs worsen", { child: "Same dose as adults (not weight-based)", nlem: true, cost: "high", tips: "Adrenaline 0.25 mg IM prophylaxis reduces reactions. No test dose." }),
];

export const DOSING_BY_ID = Object.fromEntries(DOSING.map((d) => [d.id, d])) as Record<string, Dosing>;
export const NLEM_IDS = new Set(DOSING.filter((d) => d.nlem).map((d) => d.id));

/** A drug in the database, by id. */
export const drugById = (id: string): Drug | undefined => DRUG_DATABASE.find((d) => d.id === id);

export interface DrugHit {
  drug: Drug;
  dosing?: Dosing;
  score: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Search by generic, brand, salt, class or indication; generics with dosing data come first. */
export function searchDrugs(query: string, max = 30): DrugHit[] {
  const q = norm(query);
  if (!q) return [];
  const hits: DrugHit[] = [];
  for (const drug of DRUG_DATABASE) {
    const generic = norm(drug.genericName);
    const brand = norm(drug.brandName);
    const salt = norm(drug.saltName);
    let score = 0;
    if (generic === q) score = 100;
    else if (generic.startsWith(q)) score = 80;
    else if (brand.split(/ \/ /).some((b) => b.startsWith(q))) score = 70;
    else if (generic.includes(q) || brand.includes(q) || salt.includes(q)) score = 50;
    else if (norm(drug.drugClass).includes(q) || norm(drug.category).includes(q)) score = 30;
    else if (drug.indications.some((i) => norm(i).includes(q))) score = 20;
    if (!score) continue;
    const dosing = DOSING_BY_ID[drug.id];
    hits.push({ drug, dosing, score: score + (dosing ? 5 : 0) });
  }
  return hits.sort((a, b) => b.score - a.score || a.drug.genericName.localeCompare(b.drug.genericName)).slice(0, max);
}

/* ------------------------------------------------------------------ prescriptions */

export interface RxItem {
  id: string;
  /** Drug id in the database, when picked from it. */
  drugId?: string;
  name: string;
  strength: string;
  form: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  /** Age and sex or bed, never a name. */
  patient: string;
  diagnosis: string;
  items: RxItem[];
  advice: string;
  followUp: string;
  createdAt: number;
  updatedAt: number;
}

export const RX_KEY = "cadus3.rx";
export const RX_MAX = 200;
export const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 6 hours", "Every 8 hours", "Every 12 hours", "At night", "As needed", "Once weekly", "Stat"];
export const ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Inhaled", "Sublingual", "Per rectum", "Eye drops", "Ear drops", "Nasal"];
export const FORMS = ["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Cream", "Ointment", "Drops", "Inhaler", "Sachet", "Patch"];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "");

export function newRxItem(fields: Partial<RxItem> = {}): RxItem {
  return { id: uid(), name: "", strength: "", form: "Tablet", dose: "1", route: "Oral", frequency: "Twice daily", duration: "5 days", instructions: "", ...fields };
}

/** A prescription line from a database entry: its first form and strength, and a sensible frequency. */
export function rxItemFromDrug(drug: Drug): RxItem {
  const dosing = DOSING_BY_ID[drug.id];
  const freq = /once daily|once a day/i.test(dosing?.adult ?? "") ? "Once daily" : /three times|every 8 h/i.test(dosing?.adult ?? "") ? "Three times daily" : /every 6 h|four times/i.test(dosing?.adult ?? "") ? "Every 6 hours" : "Twice daily";
  const form = drug.forms[0] ?? "Tablet";
  return newRxItem({
    drugId: drug.id,
    name: drug.genericName,
    strength: drug.dosages[0] ?? "",
    form: FORMS.includes(form) ? form : form,
    route: /injection/i.test(form) ? "IV" : /cream|ointment/i.test(form) ? "Topical" : /inhaler/i.test(form) ? "Inhaled" : /drops/i.test(form) ? "Eye drops" : "Oral",
    frequency: freq,
  });
}

export function newPrescription(fields: Partial<Prescription> = {}): Prescription {
  const now = Date.now();
  return { id: uid(), patient: "", diagnosis: "", items: [], advice: "", followUp: "", createdAt: now, updatedAt: now, ...fields };
}

export function cleanPrescription(raw: unknown): Prescription | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  return {
    id: r.id.slice(0, 40),
    patient: str(r.patient, 60),
    diagnosis: str(r.diagnosis, 200),
    items: (Array.isArray(r.items) ? r.items : []).filter((i): i is Record<string, unknown> => !!i && typeof i === "object").map((i) => ({
      id: typeof i.id === "string" && i.id ? i.id.slice(0, 40) : uid(),
      ...(typeof i.drugId === "string" ? { drugId: i.drugId.slice(0, 60) } : {}),
      name: str(i.name, 80), strength: str(i.strength, 40), form: str(i.form, 30) || "Tablet", dose: str(i.dose, 40) || "1", route: str(i.route, 30) || "Oral",
      frequency: str(i.frequency, 40) || "Once daily", duration: str(i.duration, 40), instructions: str(i.instructions, 160),
    })).filter((i) => i.name).slice(0, 30),
    advice: typeof r.advice === "string" ? r.advice.slice(0, 1000) : "",
    followUp: str(r.followUp, 120),
    createdAt: Number.isFinite(r.createdAt) ? Number(r.createdAt) : Date.now(),
    updatedAt: Number.isFinite(r.updatedAt) ? Number(r.updatedAt) : Date.now(),
  };
}

export function readPrescriptions(): Prescription[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RX_KEY) || "[]");
    return (Array.isArray(raw) ? raw : []).map(cleanPrescription).filter((p): p is Prescription => !!p).slice(0, RX_MAX);
  } catch { return []; }
}
export function savePrescriptions(list: Prescription[]) {
  try { localStorage.setItem(RX_KEY, JSON.stringify(list.slice(0, RX_MAX))); } catch { /* full or blocked */ }
}

/** The prescription as markdown, for printing on the letterhead, Word and copying. */
export function prescriptionMarkdown(p: Prescription, opts: { title?: boolean } = {}): string {
  const lines: string[] = [];
  if (opts.title !== false) lines.push("# Prescription", "");
  if (p.patient || p.diagnosis) lines.push(`**Patient:** ${p.patient || "—"}${p.diagnosis ? `  \n**Diagnosis:** ${p.diagnosis}` : ""}`, "");
  if (p.items.length) {
    lines.push("| | Medicine | Dose | Frequency | Duration | Instructions |", "|---|---|---|---|---|---|");
    p.items.forEach((i, k) => lines.push(`| ${k + 1} | **${i.name}** ${i.strength}${i.form ? ` ${i.form.toLowerCase()}` : ""} | ${i.dose} ${i.route !== "Oral" ? i.route : ""} | ${i.frequency} | ${i.duration} | ${i.instructions} |`));
    lines.push("");
  }
  if (p.advice.trim()) lines.push("## Advice", p.advice.trim(), "");
  if (p.followUp.trim()) lines.push(`**Follow-up:** ${p.followUp.trim()}`, "");
  return lines.join("\n").trim();
}

/** The drug names in a prescription, for the interaction checker. */
export const prescriptionDrugText = (p: Prescription) => p.items.map((i) => i.name).filter(Boolean).join(", ");
