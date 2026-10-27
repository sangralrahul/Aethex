/**
 * Update 49, on the device (no AI): jaundice, proteinuria, splenomegaly, pancytopenia, varicose veins,
 * otitis externa and ear wax, dry eye and blepharitis, perianal abscess and pilonidal sinus, neck pain,
 * hyperhidrosis, seborrhoeic dermatitis and halitosis.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== jaundice */

export interface JaundiceInput { total: number; direct: number; alt: number; alp: number; fever: boolean; rucPain: boolean; painless: boolean; weightLoss: boolean; age: number; confusion: boolean; inrHigh: boolean; anaemia: boolean; alcohol: boolean; drugs: boolean; pregnant: boolean }
export function jaundiceType(total: number, direct: number, alt: number, alp: number): { kind: "none" | "unconjugated" | "hepatocellular" | "cholestatic" | "mixed"; directPct: number } {
  if (!(total > 0)) return { kind: "none", directPct: 0 };
  const directPct = direct > 0 ? Math.round((100 * direct) / total) : 0;
  if (total <= 1.2) return { kind: "none", directPct };
  if (direct > 0 && directPct < 20) return { kind: "unconjugated", directPct };
  if (alt >= 3 * 40 && alp < 2 * 120) return { kind: "hepatocellular", directPct };
  if (alp >= 2 * 120 && alt < 3 * 40) return { kind: "cholestatic", directPct };
  return { kind: alt || alp ? "mixed" : "unconjugated", directPct };
}
export function jaundicePlan(x: JaundiceInput): { urgency: "emergency" | "urgent" | "routine"; kind: string; steps: string[] } {
  const t = jaundiceType(x.total, x.direct, x.alt, x.alp);
  const s: string[] = [];
  let urgency: "emergency" | "urgent" | "routine" = "routine";
  if (x.confusion || x.inrHigh) { urgency = "emergency"; s.push("Confusion, drowsiness or a raised INR with jaundice: acute liver failure until proved otherwise — admit, check glucose, INR, ammonia, paracetamol level; discuss with a liver unit."); }
  if (x.fever && x.rucPain) { urgency = "emergency"; s.push("Fever, right upper quadrant pain and jaundice (Charcot's triad): ascending cholangitis — blood cultures, IV antibiotics (e.g. piperacillin–tazobactam), urgent ultrasound and ERCP drainage."); }
  if (x.painless && (x.weightLoss || x.age >= 40)) { if (urgency === "routine") urgency = "urgent"; s.push("Painless jaundice with weight loss or age 40 or over: urgent CT pancreas (pancreatic or bile duct cancer, NICE suspected cancer pathway)."); }
  if (x.pregnant) { if (urgency === "routine") urgency = "urgent"; s.push("Pregnant: hepatitis E (dangerous in pregnancy), intrahepatic cholestasis, HELLP and acute fatty liver of pregnancy — urgent obstetric review."); }
  if (t.kind === "unconjugated") {
    s.push(`Unconjugated (direct ${t.directPct}% of total): pre-hepatic.`);
    s.push(x.anaemia ? "With anaemia: haemolysis — CBC, reticulocytes, LDH, haptoglobin, blood film, direct Coombs test; G6PD deficiency (common in India), malaria, thalassaemia, autoimmune." : "Well, mild (bilirubin usually under 4–5 mg/dL), rises with fasting or illness, normal enzymes and CBC: Gilbert's syndrome — reassure, no treatment.");
  } else if (t.kind !== "none") {
    s.push(t.kind === "hepatocellular" ? "Hepatocellular pattern (ALT high): viral hepatitis (A and E are commonest in India; also B and C), alcohol, drugs (anti-TB drugs, paracetamol, herbal), autoimmune hepatitis, Wilson's disease under 40, ischaemic hepatitis." : t.kind === "cholestatic" ? "Cholestatic pattern (ALP high): obstruction (stones, cancer, strictures) or intrahepatic cholestasis (drugs, sepsis, PBC, PSC, infiltration)." : "Mixed pattern: work up both hepatocellular and cholestatic causes.");
    s.push("Ultrasound abdomen first: dilated bile ducts mean obstruction — MRCP or CT, then ERCP for stones; no dilatation — intrahepatic cause.");
    s.push("Tests: CBC, INR, albumin, LFT, IgM anti-HAV, IgM anti-HEV, HBsAg, IgM anti-HBc, anti-HCV, ANA and immunoglobulins (autoimmune), ferritin; ceruloplasmin under 40; lipase if pain.");
  } else s.push("Enter bilirubin (and the direct fraction, ALT and ALP) to see the pattern. Total bilirubin over about 2.5–3 mg/dL is needed to see jaundice clinically.");
  if (x.alcohol) s.push("Alcohol: AST:ALT ratio over 2 suggests alcohol-related hepatitis — Maddrey's discriminant function; stop alcohol; thiamine.");
  if (x.drugs) s.push("Drugs: anti-TB drugs (stop and refer if ALT over 3× with symptoms or 5× without), paracetamol, co-amoxiclav, NSAIDs, methotrexate, herbal and Ayurvedic products.");
  return { urgency, kind: t.kind, steps: s };
}

/* ================================================================== proteinuria */

export type ProtUnit = "mg/g" | "mg/mmol";
/** Albumin:creatinine ratio band (KDIGO A1–A3), in mg/g or mg/mmol. */
export function acrBand(acr: number, unit: ProtUnit): { band: "A1" | "A2" | "A3"; mgPerG: number } {
  const g = unit === "mg/g" ? acr : r1(acr * 8.84);
  return { band: g < 30 ? "A1" : g <= 300 ? "A2" : "A3", mgPerG: g };
}
export interface ProteinuriaInput { unit: ProtUnit; acr: number; diabetes: boolean; hypertension: boolean; haematuria: boolean; egfr: number; oedema: boolean; albumin: number; age: number; transient: boolean; confirmed: boolean }
export function proteinuriaPlan(x: ProteinuriaInput): { refer: boolean; nephrotic: boolean; steps: string[] } {
  const b = acrBand(x.acr, x.unit);
  const s: string[] = [];
  const nephrotic = (x.oedema && x.albumin > 0 && x.albumin < 3) || b.mgPerG >= 2200;
  if (x.acr > 0) s.push(`ACR ${x.acr} ${x.unit}${x.unit === "mg/mmol" ? ` (≈ ${b.mgPerG} mg/g)` : ""}: ${b.band === "A1" ? "A1, normal to mildly raised" : b.band === "A2" ? "A2, moderately raised (microalbuminuria)" : "A3, severely raised"}.`);
  if (x.transient) s.push("Fever, heavy exercise, UTI, menstruation or uncontrolled heart failure can raise protein for a while — treat and repeat once settled.");
  if (!x.confirmed && b.band !== "A1") s.push("Confirm with an early-morning urine ACR (2 of 3 samples over 3 months raised = persistent).");
  if (x.age > 0 && x.age < 30 && b.band !== "A3" && !x.haematuria) s.push("Young and well: check for orthostatic proteinuria — compare a first-morning sample with a daytime sample.");
  if (nephrotic) s.push("Nephrotic syndrome (heavy proteinuria, albumin under 3 g/dL, oedema): urgent nephrology — kidney biopsy in adults; diuretics, ACE inhibitor, statin; consider anticoagulation if albumin very low; check for diabetes, SLE, HBV, HCV, HIV, myeloma, drugs.");
  s.push("Tests: creatinine and eGFR, urine microscopy (red cells, casts), BP, HbA1c, lipids, albumin; kidney ultrasound; in diabetes check the eyes (retinopathy supports diabetic kidney disease).");
  if ((x.diabetes && b.mgPerG >= 30) || (x.hypertension && b.mgPerG >= 300) || b.mgPerG >= 600) s.push("Start an ACE inhibitor or ARB, titrated to the maximum tolerated dose (check potassium and creatinine in 1–2 weeks; up to 25–30% creatinine rise is acceptable). Target BP under 130/80.");
  if ((x.diabetes && x.egfr >= 20) || (b.mgPerG >= 200 && x.egfr >= 20)) s.push("Add an SGLT2 inhibitor (e.g. dapagliflozin 10 mg or empagliflozin 10 mg daily) if eGFR is 20 or more — slows CKD progression (KDIGO 2024).");
  const refer = nephrotic || b.mgPerG >= 600 || (x.haematuria && b.mgPerG >= 300) || (x.egfr > 0 && x.egfr < 30);
  if (refer && !nephrotic) s.push("Refer to nephrology: ACR about 600 mg/g (70 mg/mmol) or more, ACR 300 mg/g or more with haematuria, eGFR under 30, or a rapid fall in eGFR.");
  if (x.haematuria) s.push("Haematuria with proteinuria suggests glomerulonephritis — check complement, ANA, ANCA, anti-GBM if eGFR is falling; urgent if creatinine is rising.");
  return { refer, nephrotic, steps: s };
}

/* ================================================================== splenomegaly */

export interface SplenoInput { size: "mild" | "moderate" | "massive"; fever: boolean; kalaAzarArea: boolean; highWbc: boolean; cytopenias: boolean; liverDisease: boolean; haemolysis: boolean; nodes: boolean; weightLoss: boolean; childhoodAnaemia: boolean }
export function splenoPlan(x: SplenoInput): string[] {
  const s: string[] = [];
  s.push(x.size === "massive" ? "Massive (more than 8 cm below the costal margin or crossing the midline): in India think CML, myelofibrosis, kala-azar, chronic malaria (hyperreactive malarial splenomegaly), thalassaemia major, non-cirrhotic portal fibrosis or EHPVO, and lymphoma." : x.size === "moderate" ? "Moderate: portal hypertension (cirrhosis), lymphoma, leukaemias, haemolytic anaemias, chronic infections (TB, brucellosis, infective endocarditis)." : "Mild (just palpable): acute infections (malaria, typhoid, EBV, dengue, HIV), haemolysis, early portal hypertension.");
  s.push("First tests: CBC with peripheral smear, reticulocytes, LFT, malaria test, HIV, HBsAg and anti-HCV, LDH; ultrasound abdomen with Doppler of the portal and splenic veins.");
  if (x.fever) s.push("With fever: malaria smear/RDT, blood cultures, Widal is unreliable (use culture); echocardiogram if murmur; TB work-up.");
  if (x.kalaAzarArea) s.push("From Bihar, Jharkhand, West Bengal or eastern UP: rK39 rapid test for visceral leishmaniasis; single-dose liposomal amphotericin B under the national programme.");
  if (x.highWbc) s.push("High white count with immature cells or basophils: CML — BCR-ABL (PCR or FISH); JAK2 if high platelets or Hb (myeloproliferative neoplasm). Haematology referral.");
  if (x.cytopenias) s.push("Low counts with a big spleen: hypersplenism (portal hypertension) vs marrow disease (leukaemia, myelofibrosis, kala-azar) — bone marrow if no portal hypertension.");
  if (x.liverDisease) s.push("Liver disease signs or varices: portal hypertension — endoscopy for varices; non-cirrhotic portal hypertension is common in India (normal LFT, big spleen, varices).");
  if (x.haemolysis) s.push("Jaundice, anaemia, high reticulocytes: haemolysis — DAT, haemoglobin electrophoresis (thalassaemia, sickle cell), G6PD, osmotic fragility (spherocytosis).");
  if (x.childhoodAnaemia) s.push("Child with anaemia and big spleen: thalassaemia major or intermedia — HPLC; transfusion and chelation programme.");
  if (x.nodes || x.weightLoss) s.push("Lymph nodes, night sweats or weight loss: lymphoma — CT, node biopsy.");
  s.push("Advise avoiding contact sports and heavy blows to the abdomen (rupture risk). If splenectomy is ever needed: vaccinate (pneumococcal, meningococcal, Hib) at least 2 weeks before.");
  return s;
}

/* ================================================================== pancytopenia */

export interface PancytoInput { hb: number; wbc: number; anc: number; plt: number; mcv: number; fever: boolean; bleeding: boolean; blasts: boolean; spleen: boolean; drugs: boolean; alcohol: boolean; vegetarian: boolean; age: number }
export function pancytoPlan(x: PancytoInput): { pancytopenia: boolean; urgency: "emergency" | "urgent" | "routine"; steps: string[] } {
  const pancytopenia = x.hb > 0 && x.hb < 10 && x.wbc > 0 && x.wbc < 4 && x.plt > 0 && x.plt < 150;
  const s: string[] = [];
  let urgency: "emergency" | "urgent" | "routine" = "routine";
  if (x.fever && x.anc > 0 && x.anc < 0.5) { urgency = "emergency"; s.push("Neutrophils under 0.5 with fever: febrile neutropenia — broad-spectrum IV antibiotics within 1 hour."); }
  if (x.bleeding && x.plt > 0 && x.plt < 20) { urgency = "emergency"; s.push("Bleeding with platelets under 20: urgent haematology; platelet transfusion; avoid IM injections and NSAIDs."); }
  if (x.blasts) { urgency = "emergency"; s.push("Blasts on the film: acute leukaemia until proved otherwise — same-day haematology (check for DIC and tumour lysis)."); }
  if (urgency === "routine" && pancytopenia && (x.anc < 1 || x.plt < 50 || x.hb < 7)) urgency = "urgent";
  s.push(pancytopenia ? "Pancytopenia: low Hb, white cells and platelets together." : "Enter Hb (g/dL), WBC and platelets (×10⁹/L); pancytopenia means all three are low.");
  s.push("Tests: peripheral blood film (by a haematologist), reticulocytes, vitamin B12 and folate, LFT, LDH, creatinine, ultrasound abdomen (spleen, liver), HIV, HBsAg and anti-HCV, ANA; with fever — dengue NS1/IgM, malaria, blood cultures.");
  if (x.mcv > 100 || x.vegetarian) s.push(`${x.mcv > 100 ? `MCV ${x.mcv} (macrocytic): ` : ""}megaloblastic anaemia from B12 or folate deficiency is the commonest cause in India (vegetarian diet) — check B12 before giving folate; hydroxocobalamin 1 mg IM three times a week for 2 weeks, then every 3 months (or as local protocol with methylcobalamin).`);
  if (x.spleen) s.push("Big spleen: hypersplenism (portal hypertension), kala-azar, lymphoma, myelofibrosis, leukaemia.");
  if (x.drugs) s.push("Drugs: methotrexate (with folinic acid rescue if toxic), azathioprine (TPMT), chemotherapy, chloramphenicol, linezolid, co-trimoxazole, carbamazepine, valproate, antithyroid drugs — stop if possible.");
  if (x.alcohol) s.push("Alcohol: direct marrow toxicity, folate deficiency and hypersplenism from cirrhosis.");
  if (x.age >= 60) s.push("Older adult with macrocytosis and no deficiency: myelodysplastic syndrome — bone marrow with cytogenetics.");
  s.push("No cause found, or blasts, or persistent severe cytopenias: bone marrow aspirate and trephine biopsy (aplastic anaemia, leukaemia, infiltration, TB, kala-azar); PNH flow cytometry if haemolysis with aplasia.");
  return { pancytopenia, urgency, steps: s };
}

/* ================================================================== varicose veins */

export const CEAP = ["C0: no visible signs", "C1: thread veins or reticular veins", "C2: varicose veins", "C3: oedema", "C4: skin changes (pigmentation, eczema, lipodermatosclerosis)", "C5: healed venous ulcer", "C6: active venous ulcer"];
export interface VaricoseInput { ceap: number; symptomatic: boolean; bleeding: boolean; thrombophlebitis: boolean; nearJunction: boolean; abpi: number; pregnant: boolean }
export function varicosePlan(x: VaricoseInput): { urgency: "emergency" | "urgent" | "routine" | "none"; steps: string[] } {
  const s: string[] = [];
  let urgency: "emergency" | "urgent" | "routine" | "none" = "none";
  if (x.bleeding) { urgency = "emergency"; s.push("Bleeding varicose vein: lie down, elevate the leg, firm direct pressure for 10+ minutes; then immediate vascular referral (can be fatal, especially in the elderly)."); }
  if (x.ceap >= 6) { if (urgency === "none") urgency = "urgent"; s.push("Active venous ulcer: refer to vascular services within 2 weeks; check ABPI, then compression bandaging if ABPI 0.8 or more; treat the superficial reflux to speed healing."); }
  else if (x.ceap === 5) { urgency = urgency === "none" ? "routine" : urgency; s.push("Healed ulcer: refer for treatment of the venous reflux to prevent recurrence; long-term compression."); }
  if (x.thrombophlebitis) { if (urgency === "none") urgency = "routine"; s.push(x.nearJunction ? "Superficial thrombophlebitis near the groin or knee crease (within 3 cm of the junction): duplex ultrasound to exclude DVT; fondaparinux 2.5 mg daily for 45 days if 5 cm or longer." : "Superficial thrombophlebitis: NSAID (or topical), warm compresses, keep walking; duplex if it extends or is 5 cm or longer (anticoagulation)."); }
  if (x.ceap >= 2 && x.ceap <= 4 && (x.symptomatic || x.ceap >= 4)) { if (urgency === "none") urgency = "routine"; s.push(`${x.ceap >= 4 ? "Skin changes" : "Symptomatic varicose veins (aching, heaviness, itching, swelling)"}: refer for duplex ultrasound and treatment — endothermal ablation (radiofrequency or laser) first, then ultrasound-guided foam sclerotherapy, then surgery.`); }
  if (x.ceap <= 1 || (x.ceap === 2 && !x.symptomatic)) s.push("Cosmetic thread veins or symptom-free varicose veins: reassure; no NHS-style intervention needed; leg elevation and exercise.");
  if (x.pregnant) s.push("Pregnancy: compression stockings help symptoms; most improve after delivery — defer treatment until at least 3 months postpartum.");
  if (x.abpi > 0) s.push(x.abpi < 0.8 ? `ABPI ${x.abpi}: arterial disease — do not use strong compression; vascular review.` : `ABPI ${x.abpi}: compression is safe.`);
  s.push("Everyone: walk daily, raise the legs when resting, avoid long standing, lose weight; class 2 compression stockings if intervention is not wanted or suitable.");
  return { urgency, steps: s };
}

/* ================================================================== otitis externa and ear wax */

export interface OeInput { fungal: boolean; perforation: boolean; swollenShut: boolean; diabeticElderly: boolean; nervePalsy: boolean; cellulitis: boolean; severePain: boolean }
export function oePlan(x: OeInput): { urgency: "emergency" | "urgent" | "routine"; steps: string[] } {
  if (x.nervePalsy || (x.diabeticElderly && x.severePain)) {
    return { urgency: "emergency", steps: ["Severe pain out of proportion in an older person with diabetes or immunosuppression, granulation tissue in the canal, or a facial nerve palsy: necrotising (malignant) otitis externa — same-day ENT; CT or MRI temporal bone; IV anti-pseudomonal antibiotics (e.g. ciprofloxacin or ceftazidime) for weeks; tight glucose control."] };
  }
  const s: string[] = [];
  s.push("Clean the canal (dry mopping or microsuction) so drops can reach; keep the ear dry (cotton wool with petroleum jelly while showering; no swimming for 7–10 days); no cotton buds.");
  if (x.fungal) s.push("Otomycosis (itch, white fluffy or black debris): clotrimazole 1% solution 3 times daily for at least 14 days after cleaning.");
  else s.push(x.perforation ? "Perforated eardrum or grommets: use non-ototoxic quinolone drops — ciprofloxacin (± dexamethasone) twice daily for 7 days; avoid aminoglycoside (neomycin, gentamicin) drops." : "Antibiotic–steroid drops for 7 days (up to 14 if needed): e.g. ciprofloxacin–dexamethasone, or neomycin–polymyxin B–hydrocortisone if the eardrum is intact. Paracetamol or ibuprofen for pain.");
  if (x.swollenShut) s.push("Canal swollen shut: ENT to insert an ear wick so drops get in.");
  if (x.cellulitis) s.push("Cellulitis spreading to the pinna or face: add oral antibiotics (flucloxacillin/cloxacillin; ciprofloxacin if Pseudomonas suspected).");
  s.push("Not better in 1 week, or recurrent: ENT — check for skin disease (eczema, psoriasis), fungal infection, or a hidden cholesteatoma.");
  return { urgency: x.swollenShut || x.cellulitis ? "urgent" : "routine", steps: s };
}
export function waxPlan(perforationOrSurgery: boolean, symptomatic: boolean): string[] {
  if (!symptomatic) return ["Wax without symptoms needs no treatment — it cleans itself; avoid cotton buds and hairpins."];
  return [
    "Softening drops for 3–5 days: olive or almond oil, or sodium bicarbonate 5% drops, 2–3 times a day (lie with the ear up for a few minutes).",
    perforationOrSurgery ? "Previous perforation, ear surgery or grommets: do not irrigate — microsuction by ENT." : "Still blocked: ear irrigation (low-pressure electronic irrigator) or microsuction. Do not irrigate with active otitis externa or a perforation.",
    "Recurrent build-up: oil drops once or twice a week to prevent it.",
  ];
}

/* ================================================================== dry eye and blepharitis */

export interface EyeInput { pain: boolean; photophobia: boolean; vision: boolean; oneEye: boolean; contactLens: boolean; dryMouth: boolean; lagophthalmos: boolean; blepharitis: boolean; mgd: boolean; rosacea: boolean; screen: boolean; drugs: boolean }
export function eyePlan(x: EyeInput): { refer: boolean; steps: string[] } {
  const red = x.pain || x.photophobia || x.vision || (x.contactLens && x.pain);
  const s: string[] = [];
  if (red) s.push("Pain, light sensitivity, blurred vision or one red painful eye: not simple dry eye — same-day ophthalmology (keratitis, iritis, acute glaucoma, scleritis). Contact lens wearer with pain: stop lenses, urgent review for microbial keratitis.");
  if (x.lagophthalmos) s.push("Eye doesn't close fully (Bell's palsy, thyroid eye disease): lubricating ointment at night and tape the lid; ophthalmology for exposure keratopathy.");
  if (x.dryMouth) s.push("Dry mouth, joint pains or fatigue as well: Sjögren's syndrome — anti-Ro/La, ANA, rheumatology.");
  if (x.blepharitis || x.mgd) {
    s.push("Lid hygiene daily, long term: warm compress for 5–10 minutes, then gently massage the lids towards the lashes and clean the lid margin (lid wipes or a few drops of baby shampoo in warm water).");
    if (x.mgd || x.rosacea) s.push(`Meibomian gland dysfunction${x.rosacea ? " with rosacea" : ""} not settling after 6 weeks of lid care: topical azithromycin, or doxycycline 50–100 mg daily for 6–12 weeks (not in pregnancy or children under 12).`);
  }
  s.push("Lubricants: artificial tears (carboxymethylcellulose or hypromellose) 4–6 times a day, preservative-free if using more than 4 times a day; a gel or ointment at night.");
  if (x.screen) s.push("Screens: the 20-20-20 rule (every 20 minutes look 20 feet away for 20 seconds), blink fully, lower the screen, avoid fans and AC blowing at the face.");
  if (x.drugs) s.push("Drying medicines: antihistamines, antidepressants, isotretinoin, diuretics, beta-blocker eye drops — review.");
  s.push("Refer to ophthalmology if no better after 6–8 weeks, if the cornea stains, or if a lid lump persists (exclude sebaceous carcinoma if one-sided and recurrent).");
  return { refer: red || x.lagophthalmos, steps: s };
}

/* ================================================================== perianal abscess and pilonidal */

export interface PerianalInput { type: "perianal" | "pilonidal"; acute: boolean; fluctuant: boolean; fever: boolean; diabetes: boolean; crepitus: boolean; recurrent: boolean; chronicDischarge: boolean; crohns: boolean }
export function perianalPlan(x: PerianalInput): { urgency: "emergency" | "urgent" | "routine"; steps: string[] } {
  if (x.crepitus) return { urgency: "emergency", steps: ["Crepitus, rapidly spreading redness or black skin, pain out of proportion, or systemic toxicity: necrotising infection (Fournier's gangrene) — emergency surgery for debridement, broad-spectrum IV antibiotics, resuscitation."] };
  const s: string[] = [];
  let urgency: "emergency" | "urgent" | "routine" = "routine";
  if (x.type === "perianal") {
    if (x.acute) {
      urgency = x.fever || x.diabetes ? "emergency" : "urgent";
      s.push("Perianal abscess: incision and drainage the same or next day — antibiotics alone don't cure it and delay allows spread. Don't wait for it to 'point'.");
      s.push(`Antibiotics only if cellulitis, diabetes, immunosuppression or sepsis${x.diabetes ? " (applies here)" : ""}: e.g. co-amoxiclav, or ciprofloxacin plus metronidazole.`);
      s.push("Deep pain with fever but little to see outside: ischiorectal, intersphincteric or supralevator abscess — examination under anaesthesia, MRI.");
    }
    if (x.chronicDischarge) s.push("Persistent discharge after an abscess heals (in up to a third): anal fistula — refer to colorectal surgery; MRI fistulogram for complex tracts.");
    if (x.recurrent || x.crohns) s.push("Recurrent or multiple abscesses, or bowel symptoms: Crohn's disease — calprotectin, colonoscopy, MRI pelvis; also check glucose (diabetes) and HIV.");
  } else {
    if (x.acute) {
      urgency = x.fever || x.diabetes ? "urgent" : "routine";
      s.push("Acute pilonidal abscess: incision and drainage (off the midline), pack or leave open; antibiotics only if cellulitis.");
    }
    s.push(x.chronicDischarge || x.recurrent ? "Chronic or recurrent pilonidal sinus: elective surgery — off-midline closure (Karydakis or Bascom cleft lift) has lower recurrence than midline closure; minimally invasive options (EPSiT, pit picking) for small disease." : "Pits with no symptoms: no surgery needed.");
    s.push("Prevention: keep the natal cleft clean and dry, remove hair (laser hair removal reduces recurrence), lose weight, avoid long sitting.");
  }
  return { urgency, steps: s };
}

/* ================================================================== neck pain (mine) */

export interface NeckInput { trauma: boolean; fever: boolean; cancer: boolean; myelopathy: boolean; radicular: boolean; weakness: boolean; inflammatory: boolean; gca: boolean; suddenNeuro: boolean; weeks: number }
export function neckPlan(x: NeckInput): { urgency: "emergency" | "urgent" | "routine"; steps: string[] } {
  const s: string[] = [];
  let urgency: "emergency" | "urgent" | "routine" = "routine";
  if (x.trauma) { urgency = "emergency"; s.push("After trauma: Canadian C-spine rule — immobilise and image (CT) if high risk (age 65 or over, dangerous mechanism, limb tingling) or unable to rotate 45° both ways."); }
  if (x.suddenNeuro) { urgency = "emergency"; s.push("Sudden neck pain with headache, vertigo, visual loss or Horner's: carotid or vertebral artery dissection — emergency CT or MR angiography."); }
  if (x.myelopathy) { urgency = "emergency"; s.push("Clumsy hands, unsteady gait, bladder change, brisk reflexes or Hoffmann's sign: cervical myelopathy — urgent MRI and spinal surgery referral."); }
  if (x.fever || x.cancer) { if (urgency !== "emergency") urgency = "urgent"; s.push(`${x.fever ? "Fever or IV drug use: spinal infection (discitis, epidural abscess, TB) — " : ""}${x.cancer ? "Cancer history, weight loss or night pain: metastasis — " : ""}urgent MRI, CBC, ESR/CRP.`); }
  if (x.gca) { if (urgency !== "emergency") urgency = "urgent"; s.push("Over 50 with headache, scalp tenderness, jaw pain on chewing, or shoulder-girdle stiffness: giant cell arteritis or PMR — ESR/CRP today; prednisolone the same day if GCA is likely."); }
  if (x.inflammatory) s.push("Morning stiffness over 30 minutes, better with movement, young: inflammatory (ankylosing spondylitis, RA of the cervical spine) — ESR/CRP, HLA-B27, rheumatology.");
  if (x.radicular) {
    if (x.weakness && urgency === "routine") urgency = "urgent";
    s.push(`Arm pain in a nerve root pattern${x.weakness ? " with weakness" : ""}: cervical radiculopathy — most improve in 6–12 weeks; ${x.weakness ? "progressive or significant weakness needs urgent MRI and a spinal opinion" : "MRI if pain is severe beyond 6 weeks or weakness develops"}; neuropathic pain medicine (e.g. amitriptyline or pregabalin) and physiotherapy.`);
  }
  s.push("Mechanical neck pain: keep moving, neck exercises and posture breaks (screens at eye level), heat, short course of paracetamol or NSAID; avoid collars and prolonged rest; physiotherapy if not better in 2–4 weeks. Imaging is not needed without red flags.");
  if (x.weeks >= 12) s.push("Over 3 months: chronic neck pain — exercise-based physiotherapy, manage sleep, stress and work posture; screen for depression.");
  return { urgency, steps: s };
}

/* ================================================================== hyperhidrosis (mine) */

export interface SweatInput { focal: boolean; bilateral: boolean; onsetUnder25: boolean; stopsAsleep: boolean; family: boolean; nightSweats: boolean; weightLoss: boolean; fever: boolean; heat: boolean; menopause: boolean; drugs: boolean; hdss: number; site: "axillae" | "palms" | "soles" | "face" }
export function sweatPlan(x: SweatInput): { primary: boolean; steps: string[] } {
  const features = [x.bilateral, x.onsetUnder25, x.stopsAsleep, x.family].filter(Boolean).length;
  const secondary = x.nightSweats || x.weightLoss || x.fever || !x.focal;
  const primary = x.focal && features >= 2 && !secondary;
  const s: string[] = [];
  if (secondary) {
    s.push("Generalised sweating, night sweats, or with weight loss or fever: look for a cause — TB, lymphoma, HIV, endocarditis; hyperthyroidism (TSH), diabetes and hypoglycaemia, menopause, phaeochromocytoma, anxiety, alcohol withdrawal.");
    s.push("Tests: CBC, ESR/CRP, TSH, glucose/HbA1c, HIV, chest X-ray; metanephrines if episodic with headache, palpitations and high BP.");
    if (x.drugs) s.push("Medicines: SSRIs and SNRIs, opioids, insulin and sulfonylureas, cholinergic drugs, antipyretics — review.");
    if (x.menopause) s.push("Hot flushes and night sweats around menopause: see Menopause & HRT.");
  }
  if (x.focal) {
    s.push(primary ? "Primary focal hyperhidrosis (symmetrical, started young, stops in sleep, family history): common and benign." : "Focal sweating: check for primary features (2 or more of: symmetrical, onset under 25, stops in sleep, family history, at least weekly).");
    if (x.hdss > 0) s.push(`HDSS ${x.hdss}/4: ${x.hdss >= 3 ? "severe — affects daily life a lot" : "mild to moderate"}.`);
    s.push(x.site === "palms" || x.site === "soles" ? "Palms and soles: aluminium chloride hexahydrate 20% at night, then tap-water iontophoresis (several sessions a week, then maintenance) — very effective." : x.site === "face" ? "Face: topical glycopyrronium where available; oral anticholinergics; botulinum toxin by a specialist." : "Armpits: aluminium chloride hexahydrate 20% on completely dry skin at bedtime, wash off in the morning, nightly until controlled then once or twice a week (irritation: use less often, apply hydrocortisone).");
    if (x.hdss >= 3) s.push("Not controlled: oral oxybutynin 2.5 mg twice daily (up to 5 mg twice daily) or glycopyrrolate 1 mg twice daily (dry mouth, avoid in glaucoma and urinary retention); botulinum toxin injections (axillae, last 4–9 months); microwave thermolysis; sympathectomy as a last resort (compensatory sweating is common).");
  }
  return { primary, steps: s };
}

/* ================================================================== seborrhoeic dermatitis (mine) */

export function sebPlan(site: "scalp" | "face" | "infant", severe: boolean, widespread: boolean): string[] {
  const s: string[] = [];
  if (site === "infant") {
    s.push("Cradle cap: harmless, usually gone by 6–12 months. Rub in baby oil, olive oil or emollient at night, gently brush off scales in the morning, wash with mild baby shampoo.");
    s.push("Red, spreading to the face or nappy area: clotrimazole or miconazole cream; 1% hydrocortisone for a few days if inflamed. Weeping, unwell or not settling: think atopic eczema, psoriasis, or (rarely) Langerhans cell histiocytosis.");
    return s;
  }
  if (site === "scalp") {
    s.push("Dandruff and scalp seborrhoeic dermatitis: ketoconazole 2% shampoo twice a week for 2–4 weeks (leave on 5 minutes), then once every 1–2 weeks to prevent relapse; alternatives — selenium sulphide, zinc pyrithione, coal tar.");
    s.push("Thick adherent scale: salicylic acid or coal tar–salicylic scalp ointment overnight, then shampoo.");
    if (severe) s.push("Very itchy or inflamed: a potent steroid scalp application (e.g. betamethasone valerate 0.1%) once daily for up to 2–4 weeks alongside the shampoo.");
  } else {
    s.push("Face and body (sides of nose, eyebrows, beard, chest): ketoconazole 2% cream once or twice daily for 2–4 weeks; ketoconazole shampoo can be used as a face wash.");
    s.push("Flares: hydrocortisone 1% cream for up to 1 week (avoid stronger steroids on the face); tacrolimus or pimecrolimus as a steroid-sparing option.");
  }
  s.push("It tends to come back (worse with stress, cold weather, and in oily skin): continue the antifungal regularly once controlled.");
  if (widespread || severe) s.push("Severe, widespread or sudden in an adult: test for HIV; also more common with Parkinson's disease. Refer to dermatology if not responding.");
  return s;
}

/* ================================================================== halitosis (mine) */

export interface HalitosisInput { tongue: boolean; gums: boolean; dryMouth: boolean; dentures: boolean; tonsilStones: boolean; sinus: boolean; reflux: boolean; smoker: boolean; diabetes: boolean; kidney: boolean; liver: boolean; child: boolean; unilateralNasal: boolean; othersNotice: boolean }
export function halitosisPlan(x: HalitosisInput): string[] {
  const s: string[] = [];
  if (x.child && x.unilateralNasal) s.push("Child with foul, one-sided nasal discharge: nasal foreign body until proved otherwise — ENT to remove.");
  if (!x.othersNotice) s.push("If no one else notices it and you can't detect it on examination: pseudo-halitosis or halitophobia — explain gently; CBT may help if it causes distress.");
  s.push("Most bad breath (80–90%) comes from the mouth: bacteria on the back of the tongue, gum disease, decay, dry mouth.");
  s.push("Brush twice daily with fluoride toothpaste, clean between teeth daily (floss or interdental brushes), and scrape or brush the back of the tongue every day.");
  if (x.tongue) s.push("Coated tongue: daily tongue scraping is the single most effective step.");
  if (x.gums || x.dentures) s.push(`${x.gums ? "Bleeding or swollen gums: periodontal disease — dental scaling and treatment. " : ""}${x.dentures ? "Dentures: remove at night, clean daily and soak; review fit." : ""}`.trim());
  if (x.dryMouth) s.push("Dry mouth: sip water, sugar-free gum, review drying medicines (anticholinergics, antihistamines, antidepressants); consider Sjögren's.");
  s.push("Short-term mouthwash: chlorhexidine 0.12–0.2% (stains teeth with long use) or a zinc/cetylpyridinium mouthwash; avoid alcohol-based mouthwashes.");
  if (x.smoker) s.push("Smoking and tobacco (including gutka and paan): stop — major cause, and a cancer risk.");
  if (x.tonsilStones || x.sinus) s.push("Tonsil stones or sinus and post-nasal drip: ENT — saline rinses, treat sinusitis; tonsillectomy for troublesome tonsil stones.");
  if (x.reflux) s.push("Reflux symptoms: treat GERD (see GERD & Heartburn); H. pylori is a rare cause.");
  if (x.diabetes) s.push("Fruity breath in diabetes: check ketones (DKA).");
  if (x.kidney) s.push("Ammonia or fishy breath with kidney disease: uraemia — check creatinine.");
  if (x.liver) s.push("Sweet, musty breath (fetor hepaticus) with liver disease: severe liver dysfunction — urgent review.");
  return s;
}
