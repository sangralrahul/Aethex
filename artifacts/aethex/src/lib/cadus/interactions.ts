/**
 * Cadus interaction check: a curated list of high-risk drug interactions that is
 * matched in the browser, with no AI involved. It recognises generic names, common
 * Indian brand names and drug classes ("NSAIDs", "ACE inhibitors") in free text.
 *
 * The list covers the interactions that matter most in day-to-day Indian practice
 * (TB and HIV regimens, anticoagulants, antibiotics, psychiatric drugs and so on).
 * It is not exhaustive: a pair that is not listed may still interact, and the
 * interface says so.
 */

export type IxSeverity = "major" | "moderate" | "minor";

interface DrugDef {
  id: string;
  /** Display name (generic). */
  name: string;
  /** Other generic names and abbreviations. */
  aka?: string[];
  /** Brand names, shown as "Brand (generic)". */
  brands?: string[];
  classes?: string[];
}

/** Brands that combine several drugs. */
interface ComboDef {
  brand: string;
  ids: string[];
}

interface ClassWord {
  words: string[];
  cls: string;
  label: string;
}

interface Rule {
  /** Drug ids or "@class" references. */
  a: string[];
  b: string[];
  severity: IxSeverity;
  effect: string;
  mechanism: string;
  action: string;
}

/* ------------------------------------------------------------------ drugs */

const DRUGS: DrugDef[] = [
  // anticoagulants and antiplatelets
  { id: "warfarin", name: "Warfarin", brands: ["Warf", "Coumadin"], classes: ["anticoag", "vka"] },
  { id: "acenocoumarol", name: "Acenocoumarol", aka: ["nicoumalone"], brands: ["Acitrom"], classes: ["anticoag", "vka"] },
  { id: "apixaban", name: "Apixaban", brands: ["Eliquis"], classes: ["anticoag", "doac"] },
  { id: "rivaroxaban", name: "Rivaroxaban", brands: ["Xarelto"], classes: ["anticoag", "doac"] },
  { id: "dabigatran", name: "Dabigatran", brands: ["Pradaxa"], classes: ["anticoag", "doac"] },
  { id: "edoxaban", name: "Edoxaban", classes: ["anticoag", "doac"] },
  { id: "heparin", name: "Heparin", aka: ["unfractionated heparin", "ufh"], classes: ["anticoag"] },
  { id: "enoxaparin", name: "Enoxaparin", aka: ["lmwh", "low molecular weight heparin"], brands: ["Clexane"], classes: ["anticoag"] },
  { id: "aspirin", name: "Aspirin", aka: ["acetylsalicylic acid"], brands: ["Ecosprin", "Disprin"], classes: ["antiplatelet"] },
  { id: "clopidogrel", name: "Clopidogrel", brands: ["Clopilet", "Deplatt", "Plavix"], classes: ["antiplatelet"] },
  { id: "prasugrel", name: "Prasugrel", classes: ["antiplatelet"] },
  { id: "ticagrelor", name: "Ticagrelor", brands: ["Brilinta"], classes: ["antiplatelet"] },

  // analgesics
  { id: "paracetamol", name: "Paracetamol", aka: ["acetaminophen", "pcm"], brands: ["Dolo", "Crocin", "Calpol", "Pacimol", "Tylenol"] },
  { id: "ibuprofen", name: "Ibuprofen", brands: ["Brufen", "Ibugesic"], classes: ["nsaid"] },
  { id: "diclofenac", name: "Diclofenac", brands: ["Voveran", "Dynapar", "Voltaren"], classes: ["nsaid"] },
  { id: "naproxen", name: "Naproxen", brands: ["Naprosyn"], classes: ["nsaid"] },
  { id: "aceclofenac", name: "Aceclofenac", brands: ["Zerodol", "Hifenac"], classes: ["nsaid"] },
  { id: "ketorolac", name: "Ketorolac", brands: ["Ketanov", "Toradol"], classes: ["nsaid"] },
  { id: "indomethacin", name: "Indomethacin", aka: ["indometacin"], classes: ["nsaid"] },
  { id: "piroxicam", name: "Piroxicam", brands: ["Dolonex"], classes: ["nsaid"] },
  { id: "mefenamic acid", name: "Mefenamic acid", brands: ["Meftal"], classes: ["nsaid"] },
  { id: "etoricoxib", name: "Etoricoxib", brands: ["Arcoxia", "Nucoxia"], classes: ["nsaid"] },
  { id: "celecoxib", name: "Celecoxib", brands: ["Celebrex"], classes: ["nsaid"] },
  { id: "nimesulide", name: "Nimesulide", brands: ["Nise", "Nimulid"], classes: ["nsaid"] },
  { id: "tramadol", name: "Tramadol", brands: ["Contramal", "Tramazac"], classes: ["opioid", "serotonergic"] },
  { id: "tapentadol", name: "Tapentadol", classes: ["opioid", "serotonergic"] },
  { id: "morphine", name: "Morphine", classes: ["opioid"] },
  { id: "codeine", name: "Codeine", classes: ["opioid"] },
  { id: "fentanyl", name: "Fentanyl", classes: ["opioid"] },
  { id: "buprenorphine", name: "Buprenorphine", classes: ["opioid"] },
  { id: "methadone", name: "Methadone", classes: ["opioid", "qt"] },
  { id: "oxycodone", name: "Oxycodone", classes: ["opioid"] },
  { id: "pethidine", name: "Pethidine", aka: ["meperidine"], classes: ["opioid", "serotonergic"] },

  // psychiatry and neurology
  { id: "fluoxetine", name: "Fluoxetine", brands: ["Fludac", "Prozac"], classes: ["ssri", "serotonergic"] },
  { id: "sertraline", name: "Sertraline", brands: ["Daxid", "Zoloft"], classes: ["ssri", "serotonergic"] },
  { id: "escitalopram", name: "Escitalopram", aka: ["s-citalopram"], brands: ["Nexito", "Cipralex", "Lexapro"], classes: ["ssri", "serotonergic", "qt"] },
  { id: "citalopram", name: "Citalopram", brands: ["Celexa"], classes: ["ssri", "serotonergic", "qt"] },
  { id: "paroxetine", name: "Paroxetine", brands: ["Paxil"], classes: ["ssri", "serotonergic"] },
  { id: "fluvoxamine", name: "Fluvoxamine", brands: ["Luvox"], classes: ["ssri", "serotonergic"] },
  { id: "venlafaxine", name: "Venlafaxine", brands: ["Venlor", "Effexor"], classes: ["snri", "serotonergic"] },
  { id: "duloxetine", name: "Duloxetine", brands: ["Duzela", "Cymbalta"], classes: ["snri", "serotonergic"] },
  { id: "desvenlafaxine", name: "Desvenlafaxine", brands: ["Pristiq"], classes: ["snri", "serotonergic"] },
  { id: "selegiline", name: "Selegiline", classes: ["maoi"] },
  { id: "rasagiline", name: "Rasagiline", classes: ["maoi"] },
  { id: "phenelzine", name: "Phenelzine", classes: ["maoi"] },
  { id: "tranylcypromine", name: "Tranylcypromine", classes: ["maoi"] },
  { id: "moclobemide", name: "Moclobemide", classes: ["maoi"] },
  { id: "lithium", name: "Lithium", brands: ["Lithosun", "Licab"] },
  { id: "haloperidol", name: "Haloperidol", brands: ["Serenace", "Haldol"], classes: ["qt"] },
  { id: "chlorpromazine", name: "Chlorpromazine", brands: ["Largactil"], classes: ["qt"] },
  { id: "clozapine", name: "Clozapine", brands: ["Sizopin", "Clozaril"] },
  { id: "olanzapine", name: "Olanzapine", brands: ["Oleanz"] },
  { id: "risperidone", name: "Risperidone", brands: ["Sizodon"] },
  { id: "quetiapine", name: "Quetiapine", brands: ["Qutipin", "Seroquel"] },
  { id: "donepezil", name: "Donepezil", classes: ["qt"] },
  { id: "diazepam", name: "Diazepam", brands: ["Calmpose", "Valium"], classes: ["benzo"] },
  { id: "lorazepam", name: "Lorazepam", brands: ["Ativan"], classes: ["benzo"] },
  { id: "alprazolam", name: "Alprazolam", brands: ["Alprax", "Restyl", "Xanax"], classes: ["benzo"] },
  { id: "clonazepam", name: "Clonazepam", brands: ["Clonotril", "Lonazep", "Rivotril"], classes: ["benzo"] },
  { id: "midazolam", name: "Midazolam", classes: ["benzo"] },
  { id: "chlordiazepoxide", name: "Chlordiazepoxide", brands: ["Librium"], classes: ["benzo"] },
  { id: "nitrazepam", name: "Nitrazepam", brands: ["Nitrosun"], classes: ["benzo"] },
  { id: "etizolam", name: "Etizolam", brands: ["Etilaam"], classes: ["benzo"] },
  { id: "phenytoin", name: "Phenytoin", aka: ["fosphenytoin"], brands: ["Eptoin", "Dilantin"], classes: ["inducer"] },
  { id: "carbamazepine", name: "Carbamazepine", brands: ["Tegretol", "Mazetol", "Zeptol"], classes: ["inducer"] },
  { id: "phenobarbital", name: "Phenobarbital", aka: ["phenobarbitone"], brands: ["Gardenal"], classes: ["inducer"] },
  { id: "valproate", name: "Valproate", aka: ["sodium valproate", "valproic acid", "divalproex"], brands: ["Encorate", "Valparin"] },
  { id: "lamotrigine", name: "Lamotrigine", brands: ["Lamitor", "Lametec", "Lamictal"] },
  { id: "levetiracetam", name: "Levetiracetam", brands: ["Levipil", "Keppra"] },
  { id: "tizanidine", name: "Tizanidine" },

  // cardiovascular
  { id: "amiodarone", name: "Amiodarone", brands: ["Cordarone", "Tachyra"], classes: ["qt"] },
  { id: "sotalol", name: "Sotalol", classes: ["qt", "bb"] },
  { id: "digoxin", name: "Digoxin", brands: ["Lanoxin"] },
  { id: "verapamil", name: "Verapamil", brands: ["Calaptin"] },
  { id: "diltiazem", name: "Diltiazem", brands: ["Dilzem", "Angizem"] },
  { id: "amlodipine", name: "Amlodipine", brands: ["Amlong", "Amlokind", "Stamlo", "Amlopres", "Norvasc"] },
  { id: "metoprolol", name: "Metoprolol", brands: ["Metolar", "Met XL", "Betaloc"], classes: ["bb"] },
  { id: "atenolol", name: "Atenolol", brands: ["Aten", "Tenormin"], classes: ["bb"] },
  { id: "propranolol", name: "Propranolol", brands: ["Ciplar", "Inderal"], classes: ["bb"] },
  { id: "bisoprolol", name: "Bisoprolol", brands: ["Concor"], classes: ["bb"] },
  { id: "carvedilol", name: "Carvedilol", brands: ["Carca", "Cardivas"], classes: ["bb"] },
  { id: "nebivolol", name: "Nebivolol", brands: ["Nebicard", "Nebistar"], classes: ["bb"] },
  { id: "labetalol", name: "Labetalol", classes: ["bb"] },
  { id: "esmolol", name: "Esmolol", classes: ["bb"] },
  { id: "enalapril", name: "Enalapril", brands: ["Envas"], classes: ["acei"] },
  { id: "ramipril", name: "Ramipril", brands: ["Cardace"], classes: ["acei"] },
  { id: "lisinopril", name: "Lisinopril", brands: ["Listril"], classes: ["acei"] },
  { id: "perindopril", name: "Perindopril", brands: ["Coversyl"], classes: ["acei"] },
  { id: "captopril", name: "Captopril", classes: ["acei"] },
  { id: "losartan", name: "Losartan", brands: ["Losar", "Repace", "Losacar"], classes: ["arb"] },
  { id: "telmisartan", name: "Telmisartan", brands: ["Telma", "Telsartan"], classes: ["arb"] },
  { id: "olmesartan", name: "Olmesartan", brands: ["Olmezest"], classes: ["arb"] },
  { id: "valsartan", name: "Valsartan", brands: ["Diovan"], classes: ["arb"] },
  { id: "irbesartan", name: "Irbesartan", classes: ["arb"] },
  { id: "candesartan", name: "Candesartan", classes: ["arb"] },
  { id: "sacubitril", name: "Sacubitril/valsartan", aka: ["sacubitril", "sacubitril valsartan", "arni"], classes: ["arb"] },
  { id: "spironolactone", name: "Spironolactone", brands: ["Aldactone"], classes: ["ksparing"] },
  { id: "eplerenone", name: "Eplerenone", brands: ["Eptus"], classes: ["ksparing"] },
  { id: "amiloride", name: "Amiloride", classes: ["ksparing"] },
  { id: "potassium", name: "Potassium supplements", aka: ["potassium chloride", "kcl", "potassium supplement", "potassium supplements", "salt substitute", "salt substitutes"], brands: ["Potklor"] },
  { id: "hydrochlorothiazide", name: "Hydrochlorothiazide", aka: ["hctz"], brands: ["Aquazide"], classes: ["thiazide"] },
  { id: "chlorthalidone", name: "Chlorthalidone", aka: ["chlortalidone"], classes: ["thiazide"] },
  { id: "indapamide", name: "Indapamide", brands: ["Natrilix"], classes: ["thiazide"] },
  { id: "furosemide", name: "Furosemide", aka: ["frusemide"], brands: ["Lasix"], classes: ["loop"] },
  { id: "torsemide", name: "Torsemide", aka: ["torasemide"], brands: ["Dytor"], classes: ["loop"] },
  { id: "isdn", name: "Isosorbide dinitrate", aka: ["isdn"], brands: ["Sorbitrate", "Isordil"], classes: ["nitrate"] },
  { id: "ismn", name: "Isosorbide mononitrate", aka: ["ismn"], brands: ["Monotrate"], classes: ["nitrate"] },
  { id: "gtn", name: "Nitroglycerin", aka: ["nitroglycerine", "glyceryl trinitrate", "gtn", "ntg"], brands: ["Nitrocontin"], classes: ["nitrate"] },
  { id: "nicorandil", name: "Nicorandil", brands: ["Nikoran"], classes: ["nitrate"] },
  { id: "sildenafil", name: "Sildenafil", brands: ["Penegra", "Manforce", "Suhagra", "Viagra"], classes: ["pde5"] },
  { id: "tadalafil", name: "Tadalafil", brands: ["Tadacip", "Megalis", "Cialis"], classes: ["pde5"] },
  { id: "vardenafil", name: "Vardenafil", classes: ["pde5"] },
  { id: "tamsulosin", name: "Tamsulosin", brands: ["Urimax", "Contiflo"], classes: ["alpha"] },
  { id: "prazosin", name: "Prazosin", brands: ["Minipress"], classes: ["alpha"] },
  { id: "doxazosin", name: "Doxazosin", brands: ["Doxacard"], classes: ["alpha"] },
  { id: "terazosin", name: "Terazosin", classes: ["alpha"] },
  { id: "alfuzosin", name: "Alfuzosin", classes: ["alpha"] },
  { id: "silodosin", name: "Silodosin", classes: ["alpha"] },
  { id: "simvastatin", name: "Simvastatin", classes: ["statin3a4"] },
  { id: "atorvastatin", name: "Atorvastatin", brands: ["Storvas", "Atorva", "Atocor", "Tonact", "Lipitor"], classes: ["statin3a4"] },
  { id: "lovastatin", name: "Lovastatin", classes: ["statin3a4"] },
  { id: "rosuvastatin", name: "Rosuvastatin", brands: ["Rosuvas", "Rozavel", "Crestor"] },

  // anti-infectives
  { id: "clarithromycin", name: "Clarithromycin", brands: ["Claribid", "Klacid"], classes: ["strong3a4", "qt"] },
  { id: "erythromycin", name: "Erythromycin", brands: ["Althrocin"], classes: ["strong3a4", "qt"] },
  { id: "azithromycin", name: "Azithromycin", brands: ["Azithral", "Azee", "Azax", "Zithromax"], classes: ["qt", "inr_abx"] },
  { id: "ciprofloxacin", name: "Ciprofloxacin", aka: ["cipro"], brands: ["Ciplox", "Cifran"], classes: ["fq", "qt"] },
  { id: "levofloxacin", name: "Levofloxacin", brands: ["Levoflox", "Levomac", "Tavanic"], classes: ["fq", "qt"] },
  { id: "moxifloxacin", name: "Moxifloxacin", brands: ["Avelox"], classes: ["fq", "qt"] },
  { id: "ofloxacin", name: "Ofloxacin", brands: ["Zanocin", "Oflox"], classes: ["fq"] },
  { id: "norfloxacin", name: "Norfloxacin", brands: ["Norflox"], classes: ["fq"] },
  { id: "doxycycline", name: "Doxycycline", aka: ["doxy"], brands: ["Doxt", "Microdox"], classes: ["tetracycline", "inr_abx"] },
  { id: "tetracycline", name: "Tetracycline", classes: ["tetracycline"] },
  { id: "minocycline", name: "Minocycline", classes: ["tetracycline"] },
  { id: "metronidazole", name: "Metronidazole", brands: ["Flagyl", "Metrogyl", "Aristogyl"] },
  { id: "tinidazole", name: "Tinidazole", brands: ["Tiniba"] },
  { id: "cotrimoxazole", name: "Co-trimoxazole", aka: ["cotrimoxazole", "trimethoprim-sulfamethoxazole", "trimethoprim sulfamethoxazole", "tmp-smx", "sulfamethoxazole"], brands: ["Septran", "Bactrim"], classes: ["tmp"] },
  { id: "trimethoprim", name: "Trimethoprim", classes: ["tmp"] },
  { id: "amoxicillin", name: "Amoxicillin", aka: ["amoxycillin"], brands: ["Novamox"], classes: ["inr_abx"] },
  { id: "ceftriaxone", name: "Ceftriaxone", brands: ["Monocef", "Oframax", "Rocephin"] },
  { id: "gentamicin", name: "Gentamicin", brands: ["Garamycin"], classes: ["aminoglycoside"] },
  { id: "amikacin", name: "Amikacin", brands: ["Mikacin"], classes: ["aminoglycoside"] },
  { id: "vancomycin", name: "Vancomycin", brands: ["Vancocin"] },
  { id: "linezolid", name: "Linezolid", brands: ["Linospan", "Lizolid", "Zyvox"] },
  { id: "meropenem", name: "Meropenem", brands: ["Meronem"], classes: ["carbapenem"] },
  { id: "imipenem", name: "Imipenem", classes: ["carbapenem"] },
  { id: "ertapenem", name: "Ertapenem", classes: ["carbapenem"] },
  { id: "doripenem", name: "Doripenem", classes: ["carbapenem"] },
  { id: "fluconazole", name: "Fluconazole", brands: ["Forcan", "Zocon", "Diflucan"], classes: ["qt"] },
  { id: "itraconazole", name: "Itraconazole", brands: ["Canditral", "Itaspor", "Sporanox"], classes: ["strong3a4"] },
  { id: "ketoconazole", name: "Ketoconazole", classes: ["strong3a4"] },
  { id: "voriconazole", name: "Voriconazole", brands: ["Vfend"], classes: ["strong3a4"] },
  { id: "posaconazole", name: "Posaconazole", classes: ["strong3a4"] },
  { id: "miconazole", name: "Miconazole", brands: ["Daktarin"] },
  { id: "rifampicin", name: "Rifampicin", aka: ["rifampin"], brands: ["Rifadin"], classes: ["inducer"] },
  { id: "isoniazid", name: "Isoniazid", aka: ["inh"], brands: ["Isonex"] },
  { id: "rifabutin", name: "Rifabutin" },
  { id: "bedaquiline", name: "Bedaquiline", brands: ["Sirturo"], classes: ["qt"] },
  { id: "clofazimine", name: "Clofazimine", brands: ["Lamprene"], classes: ["qt"] },
  { id: "chloroquine", name: "Chloroquine", brands: ["Lariago"], classes: ["qt"] },
  { id: "hydroxychloroquine", name: "Hydroxychloroquine", aka: ["hcq", "hcqs"], classes: ["qt"] },
  { id: "dolutegravir", name: "Dolutegravir", aka: ["dtg"], brands: ["Tivicay"] },
  { id: "lopinavir", name: "Lopinavir/ritonavir", aka: ["lopinavir", "lpv/r"], brands: ["Kaletra"], classes: ["strong3a4", "pi"] },
  { id: "ritonavir", name: "Ritonavir", classes: ["strong3a4", "pi"] },
  { id: "atazanavir", name: "Atazanavir", classes: ["pi"] },
  { id: "sofosbuvir", name: "Sofosbuvir", brands: ["Hepcinat", "MyHep", "Sovaldi"], classes: ["hcv"] },
  { id: "velpatasvir", name: "Velpatasvir", classes: ["hcv"] },
  { id: "ledipasvir", name: "Ledipasvir", classes: ["hcv"] },
  { id: "daclatasvir", name: "Daclatasvir", classes: ["hcv"] },

  // endocrine and others
  { id: "metformin", name: "Metformin", brands: ["Glycomet", "Glyciphage", "Gluconorm"] },
  { id: "glimepiride", name: "Glimepiride", brands: ["Amaryl", "Glimy", "Glimisave"], classes: ["su"] },
  { id: "gliclazide", name: "Gliclazide", brands: ["Diamicron", "Glizid", "Reclide"], classes: ["su"] },
  { id: "glibenclamide", name: "Glibenclamide", aka: ["glyburide"], brands: ["Daonil", "Euglucon"], classes: ["su"] },
  { id: "glipizide", name: "Glipizide", brands: ["Glynase"], classes: ["su"] },
  { id: "levothyroxine", name: "Levothyroxine", aka: ["thyroxine"], brands: ["Thyronorm", "Eltroxin", "Thyrox"] },
  { id: "prednisolone", name: "Prednisolone", brands: ["Wysolone", "Omnacortil"], classes: ["steroid"] },
  { id: "dexamethasone", name: "Dexamethasone", brands: ["Dexona", "Decadron"], classes: ["steroid"] },
  { id: "methylprednisolone", name: "Methylprednisolone", brands: ["Medrol"], classes: ["steroid"] },
  { id: "hydrocortisone", name: "Hydrocortisone", classes: ["steroid"] },
  { id: "deflazacort", name: "Deflazacort", classes: ["steroid"] },
  { id: "methotrexate", name: "Methotrexate", aka: ["mtx"], brands: ["Folitrax", "Imutrex"] },
  { id: "azathioprine", name: "Azathioprine", brands: ["Azoran", "Imuran"], classes: ["thiopurine"] },
  { id: "mercaptopurine", name: "Mercaptopurine", aka: ["6-mp", "6 mp"], brands: ["Purinethol"], classes: ["thiopurine"] },
  { id: "allopurinol", name: "Allopurinol", brands: ["Zyloric", "Zyloprim"], classes: ["xoi"] },
  { id: "febuxostat", name: "Febuxostat", brands: ["Febutaz", "Zurig"], classes: ["xoi"] },
  { id: "colchicine", name: "Colchicine", brands: ["Zycolchin"] },
  { id: "tacrolimus", name: "Tacrolimus", brands: ["Pangraf"], classes: ["cni"] },
  { id: "cyclosporine", name: "Cyclosporine", aka: ["ciclosporin", "cyclosporin"], brands: ["Sandimmun", "Panimun"], classes: ["cni"] },
  { id: "theophylline", name: "Theophylline", aka: ["aminophylline", "etofylline and theophylline"], brands: ["Deriphyllin"] },
  { id: "ondansetron", name: "Ondansetron", brands: ["Emeset", "Ondem", "Zofran"], classes: ["qt"] },
  { id: "domperidone", name: "Domperidone", brands: ["Domstal"], classes: ["qt"] },
  { id: "omeprazole", name: "Omeprazole", brands: ["Omez"], classes: ["ppi2c19"] },
  { id: "esomeprazole", name: "Esomeprazole", brands: ["Nexpro"], classes: ["ppi2c19"] },
  { id: "pantoprazole", name: "Pantoprazole", brands: ["Pantocid"] },
  { id: "antacid", name: "Antacids", aka: ["antacid", "antacids", "aluminium hydroxide", "magnesium hydroxide"], brands: ["Digene", "Gelusil", "Mucaine"], classes: ["cation"] },
  { id: "calcium", name: "Calcium supplements", aka: ["calcium carbonate", "calcium citrate", "calcium supplement", "calcium supplements"], brands: ["Shelcal", "Calcimax"], classes: ["cation"] },
  { id: "calcium gluconate", name: "Calcium gluconate", aka: ["iv calcium", "calcium chloride"], classes: ["ivcalcium"] },
  { id: "iron", name: "Oral iron", aka: ["ferrous sulphate", "ferrous sulfate", "ferrous fumarate", "ferrous ascorbate", "iron supplement", "iron supplements", "iron tablets", "oral iron"], brands: ["Livogen", "Orofer", "Ferium", "Autrin"], classes: ["cation"] },
  { id: "zinc", name: "Zinc", aka: ["zinc sulphate", "zinc sulfate"], classes: ["cation"] },
  { id: "sucralfate", name: "Sucralfate", classes: ["cation"] },
  { id: "contrast", name: "Iodinated contrast", aka: ["iodinated contrast", "contrast media", "contrast medium", "contrast dye", "contrast agent", "contrast agents", "iv contrast", "ct contrast", "contrast-enhanced ct", "cect", "angiography", "angiogram", "iohexol"], brands: ["Omnipaque"] },
  { id: "alcohol", name: "Alcohol", aka: ["ethanol"] },
];

const COMBOS: ComboDef[] = [
  { brand: "Combiflam", ids: ["ibuprofen", "paracetamol"] },
  { brand: "Ultracet", ids: ["tramadol", "paracetamol"] },
  { brand: "Zerodol-P", ids: ["aceclofenac", "paracetamol"] },
  { brand: "Augmentin", ids: ["amoxicillin"] },
  { brand: "Clavam", ids: ["amoxicillin"] },
  { brand: "R-Cinex", ids: ["rifampicin", "isoniazid"] },
  { brand: "Akurit", ids: ["rifampicin", "isoniazid"] },
  { brand: "Forecox", ids: ["rifampicin", "isoniazid"] },
  { brand: "TLD", ids: ["dolutegravir"] },
  { brand: "Vymada", ids: ["sacubitril"] },
  { brand: "Entresto", ids: ["sacubitril"] },
  { brand: "Mala-D", ids: ["ocp"] },
  { brand: "Mala-N", ids: ["ocp"] },
];

/** Contraception is matched as a class-like item. */
DRUGS.push({ id: "ocp", name: "Hormonal contraceptive pill", aka: ["oral contraceptive", "oral contraceptives", "oral contraceptive pill", "oral contraceptive pills", "contraceptive pill", "contraceptive pills", "combined pill", "combined oral contraceptive", "ocp", "ocps", "coc", "cocs", "birth control pill", "birth control pills", "progestogen-only pill", "mini pill", "minipill"], classes: ["ocp"] });

const CLASS_WORDS: ClassWord[] = [
  { words: ["nsaid", "nsaids", "nsaid's"], cls: "nsaid", label: "NSAIDs" },
  { words: ["ssri", "ssris", "ssri's"], cls: "ssri", label: "SSRIs" },
  { words: ["snri", "snris"], cls: "snri", label: "SNRIs" },
  { words: ["maoi", "maois", "mao inhibitor", "mao inhibitors"], cls: "maoi", label: "MAO inhibitors" },
  { words: ["ace inhibitor", "ace inhibitors", "acei", "ace-i", "aceis"], cls: "acei", label: "ACE inhibitors" },
  { words: ["arb", "arbs", "angiotensin receptor blocker", "angiotensin receptor blockers"], cls: "arb", label: "ARBs" },
  { words: ["statin", "statins"], cls: "statin3a4", label: "Statins" },
  { words: ["nitrate", "nitrates"], cls: "nitrate", label: "Nitrates" },
  { words: ["pde5 inhibitor", "pde5 inhibitors", "pde-5 inhibitor", "pde-5 inhibitors"], cls: "pde5", label: "PDE5 inhibitors" },
  { words: ["beta blocker", "beta blockers", "beta-blocker", "beta-blockers", "β-blocker", "β-blockers"], cls: "bb", label: "Beta-blockers" },
  { words: ["benzodiazepine", "benzodiazepines", "benzos"], cls: "benzo", label: "Benzodiazepines" },
  { words: ["opioid", "opioids", "opiate", "opiates"], cls: "opioid", label: "Opioids" },
  { words: ["loop diuretic", "loop diuretics"], cls: "loop", label: "Loop diuretics" },
  { words: ["thiazide", "thiazides", "thiazide diuretic", "thiazide diuretics"], cls: "thiazide", label: "Thiazides" },
  { words: ["aminoglycoside", "aminoglycosides"], cls: "aminoglycoside", label: "Aminoglycosides" },
  { words: ["fluoroquinolone", "fluoroquinolones", "quinolones"], cls: "fq", label: "Fluoroquinolones" },
  { words: ["sulfonylurea", "sulfonylureas", "sulphonylurea", "sulphonylureas"], cls: "su", label: "Sulfonylureas" },
  { words: ["anticoagulant", "anticoagulants", "blood thinner", "blood thinners"], cls: "anticoag", label: "Anticoagulants" },
  { words: ["doac", "doacs", "noac", "noacs"], cls: "doac", label: "DOACs" },
  { words: ["antiplatelet", "antiplatelets"], cls: "antiplatelet", label: "Antiplatelets" },
  { words: ["corticosteroid", "corticosteroids", "steroid", "steroids"], cls: "steroid", label: "Corticosteroids" },
  { words: ["carbapenem", "carbapenems"], cls: "carbapenem", label: "Carbapenems" },
  { words: ["potassium-sparing diuretic", "potassium-sparing diuretics", "potassium sparing diuretic", "potassium sparing diuretics"], cls: "ksparing", label: "Potassium-sparing diuretics" },
];

/* ------------------------------------------------------------------ rules */

const ENZYME_INDUCERS = ["rifampicin", "carbamazepine", "phenytoin", "phenobarbital"];
const STRONG_3A4 = ["@strong3a4"];
const SEROTONERGIC_PAIN = ["tramadol", "tapentadol", "pethidine"];

const RULES: Rule[] = [
  // ---- contraindicated or avoid
  {
    a: ["@pde5"], b: ["@nitrate"], severity: "major",
    effect: "Severe, potentially fatal hypotension.",
    mechanism: "Both raise cGMP and dilate blood vessels.",
    action: "Contraindicated. Do not give a nitrate (or nicorandil) within 24 hours of sildenafil or vardenafil, or 48 hours of tadalafil.",
  },
  {
    a: ["@acei"], b: ["sacubitril"], severity: "major",
    effect: "Angioedema, which can be life-threatening.",
    mechanism: "Both block the breakdown of bradykinin.",
    action: "Contraindicated. Stop the ACE inhibitor at least 36 hours before starting sacubitril/valsartan.",
  },
  {
    a: ["@maoi"], b: ["@ssri", "@snri", ...SEROTONERGIC_PAIN, "linezolid"], severity: "major",
    effect: "Serotonin syndrome, which can be fatal.",
    mechanism: "Additive serotonergic effects.",
    action: "Contraindicated. Allow a washout: at least 2 weeks after stopping an MAOI, and 5 weeks after stopping fluoxetine before starting an MAOI.",
  },
  {
    a: ["linezolid"], b: ["@ssri", "@snri", ...SEROTONERGIC_PAIN], severity: "major",
    effect: "Serotonin syndrome.",
    mechanism: "Linezolid is a weak, reversible MAO inhibitor.",
    action: "Avoid if possible. If linezolid is essential, consider pausing the serotonergic drug and watch closely for agitation, tremor, clonus and fever.",
  },
  {
    a: ["@ssri", "@snri"], b: ["tramadol", "tapentadol"], severity: "major",
    effect: "Serotonin syndrome and a lower seizure threshold.",
    mechanism: "Additive serotonergic effects; fluoxetine and paroxetine also reduce tramadol's pain relief (CYP2D6).",
    action: "Avoid if possible. If used, keep the opioid dose low and watch for serotonin toxicity and seizures.",
  },
  {
    a: ["ciprofloxacin", "fluvoxamine"], b: ["tizanidine"], severity: "major",
    effect: "Profound hypotension, bradycardia and sedation.",
    mechanism: "Strong CYP1A2 inhibition raises tizanidine levels about tenfold.",
    action: "Contraindicated. Use another antibiotic or muscle relaxant.",
  },
  {
    a: ["domperidone"], b: [...STRONG_3A4, "fluconazole"], severity: "major",
    effect: "QT prolongation and ventricular arrhythmias.",
    mechanism: "CYP3A4 inhibition raises domperidone levels, and several of these drugs prolong the QT interval too.",
    action: "Contraindicated (EMA and MHRA advice). Use a different antiemetic or prokinetic.",
  },
  {
    a: ["domperidone"], b: ["@qt"], severity: "major",
    effect: "QT prolongation and arrhythmia.",
    mechanism: "Additive QT prolongation.",
    action: "Contraindicated with other QT-prolonging drugs (EMA and MHRA advice). Choose another antiemetic and check an ECG if they were combined.",
  },
  {
    a: ["@xoi"], b: ["@thiopurine"], severity: "major",
    effect: "Severe, potentially fatal bone marrow suppression.",
    mechanism: "Xanthine oxidase, which breaks down azathioprine and mercaptopurine, is blocked.",
    action: "Febuxostat: contraindicated. Allopurinol: avoid; if essential, cut azathioprine or mercaptopurine to a quarter of the dose and monitor blood counts closely.",
  },
  {
    a: ["methotrexate"], b: ["@tmp"], severity: "major",
    effect: "Severe bone marrow suppression (pancytopenia), which can be fatal.",
    mechanism: "Additive antifolate effects and slower methotrexate clearance.",
    action: "Avoid. Choose a different antibiotic.",
  },
  {
    a: ["colchicine"], b: [...STRONG_3A4, "cyclosporine", "verapamil", "diltiazem"], severity: "major",
    effect: "Colchicine toxicity: diarrhoea, bone marrow suppression and multi-organ failure; deaths are reported.",
    mechanism: "Inhibition of CYP3A4 and P-glycoprotein.",
    action: "Avoid, especially with kidney or liver impairment. If essential, reduce the colchicine dose as the product information advises and monitor.",
  },
  {
    a: ["valproate"], b: ["@carbapenem"], severity: "major",
    effect: "Valproate levels fall within a day, causing breakthrough seizures; raising the valproate dose does not help.",
    mechanism: "Carbapenems block the recycling of valproate glucuronide.",
    action: "Avoid. Use another antibiotic, or cover with another antiepileptic for the course.",
  },
  {
    a: ["valproate"], b: ["lamotrigine"], severity: "major",
    effect: "Lamotrigine levels about double, raising the risk of serious rashes including Stevens-Johnson syndrome.",
    mechanism: "Valproate inhibits lamotrigine glucuronidation.",
    action: "Use the valproate-specific lamotrigine schedule: a lower starting dose and slower titration (about half the usual).",
  },
  {
    a: ["clozapine"], b: ["ciprofloxacin", "fluvoxamine"], severity: "major",
    effect: "Clozapine levels rise steeply: sedation, hypotension and seizures.",
    mechanism: "CYP1A2 inhibition.",
    action: "Avoid if possible. If needed, reduce the clozapine dose and monitor levels and symptoms closely.",
  },
  {
    a: ["clozapine"], b: ["carbamazepine"], severity: "major",
    effect: "Higher risk of agranulocytosis, and lower clozapine levels.",
    mechanism: "Both can suppress the bone marrow; carbamazepine also induces clozapine metabolism.",
    action: "Avoid the combination.",
  },
  {
    a: ["amiodarone"], b: ["@hcv"], severity: "major",
    effect: "Serious, sometimes fatal bradycardia.",
    mechanism: "Not fully understood; reported with sofosbuvir-based hepatitis C regimens.",
    action: "Avoid. If there is no alternative, monitor the heart rate in hospital for the first 48 hours and closely for 2 weeks.",
  },
  {
    a: ["ceftriaxone"], b: ["@ivcalcium"], severity: "major",
    effect: "Ceftriaxone-calcium precipitates in the lungs and kidneys; deaths are reported in neonates.",
    mechanism: "Ceftriaxone forms an insoluble calcium salt.",
    action: "Neonates: never give ceftriaxone with IV calcium (use cefotaxime instead). Older patients: never mix them or give them through the same line without flushing.",
  },

  // ---- bleeding
  {
    a: ["@anticoag"], b: ["@nsaid"], severity: "major",
    effect: "Major bleeding, especially gastrointestinal.",
    mechanism: "NSAIDs impair platelet function and injure the gut mucosa.",
    action: "Avoid; use paracetamol for pain. If an NSAID is unavoidable, keep the course short, add a PPI and monitor closely (INR for warfarin or acenocoumarol).",
  },
  {
    a: ["@anticoag"], b: ["@antiplatelet"], severity: "major",
    effect: "Higher risk of major bleeding.",
    mechanism: "Additive effects on clotting and platelets.",
    action: "Combine only with a clear indication (for example a recent coronary stent in a patient with AF), for the shortest time, with a PPI and a planned stop date.",
  },
  {
    a: ["@vka"], b: ["fluconazole", "miconazole", "voriconazole", "metronidazole", "tinidazole", "@tmp"], severity: "major",
    effect: "The INR rises markedly, with a risk of serious bleeding.",
    mechanism: "Inhibition of CYP2C9, which clears warfarin and acenocoumarol.",
    action: "Avoid if possible. If needed, many clinicians reduce the anticoagulant dose pre-emptively; check the INR within 3 to 5 days and again after the course.",
  },
  {
    a: ["@vka"], b: ["amiodarone"], severity: "major",
    effect: "The INR rises over several weeks, with a risk of bleeding.",
    mechanism: "Amiodarone inhibits CYP2C9 and CYP3A4, and the effect lasts for months after stopping.",
    action: "Reduce the anticoagulant dose (commonly by 30 to 50%) and check the INR weekly for at least 6 to 8 weeks.",
  },
  {
    a: ["@vka"], b: ENZYME_INDUCERS, severity: "major",
    effect: "The INR falls sharply, so anticoagulation fails; it rises again when the inducer is stopped.",
    mechanism: "Enzyme induction (CYP2C9 and CYP3A4).",
    action: "Avoid if possible. If needed, check the INR often and expect large dose changes, including after stopping the inducer (rifampicin's effect wears off over about 2 weeks).",
  },
  {
    a: ["@doac"], b: ENZYME_INDUCERS, severity: "major",
    effect: "DOAC levels fall, with a risk of stroke or clotting.",
    mechanism: "Induction of P-glycoprotein and CYP3A4.",
    action: "Avoid. Choose another anticoagulant with specialist advice.",
  },
  {
    a: ["@doac"], b: ["ketoconazole", "itraconazole", "voriconazole", "posaconazole", "@pi"], severity: "major",
    effect: "DOAC levels rise, with a risk of major bleeding.",
    mechanism: "Strong inhibition of CYP3A4 and P-glycoprotein.",
    action: "Avoid. If unavoidable, get specialist advice on the choice of anticoagulant.",
  },
  {
    a: ["@antiplatelet"], b: ["@antiplatelet"], severity: "moderate",
    effect: "More bleeding than with either drug alone.",
    mechanism: "Additive antiplatelet effects.",
    action: "Standard after ACS or stenting for a defined period. Add pantoprazole if gastrointestinal bleeding risk is high, and review the duration.",
  },
  {
    a: ["@ssri", "@snri"], b: ["@nsaid", "@anticoag", "@antiplatelet"], severity: "moderate",
    effect: "Higher risk of bleeding, especially from the upper gut.",
    mechanism: "SSRIs and SNRIs deplete platelet serotonin; NSAIDs, antiplatelets and anticoagulants add to it.",
    action: "Consider a PPI for gastroprotection, monitor for bleeding and prefer paracetamol for pain.",
  },
  {
    a: ["@vka"], b: ["@inr_abx", "clarithromycin", "erythromycin", "ciprofloxacin", "levofloxacin", "ofloxacin", "norfloxacin", "moxifloxacin", "ceftriaxone"], severity: "moderate",
    effect: "The INR can rise during and after the course.",
    mechanism: "Infection, less vitamin K from gut bacteria and, for some antibiotics, slower warfarin clearance.",
    action: "Check the INR 3 to 5 days after starting and again after finishing the antibiotic.",
  },
  {
    a: ["@vka"], b: ["paracetamol"], severity: "minor",
    effect: "Regular paracetamol (more than about 2 g a day for several days) can raise the INR.",
    mechanism: "Uncertain; possibly interference with vitamin K-dependent clotting factors.",
    action: "Paracetamol is still the preferred analgesic. Check the INR if regular use starts or stops.",
  },
  {
    a: ["clopidogrel"], b: ["@ppi2c19"], severity: "moderate",
    effect: "Clopidogrel works less well.",
    mechanism: "CYP2C19 inhibition reduces the activation of clopidogrel.",
    action: "Use pantoprazole instead if a PPI is needed.",
  },

  // ---- statins
  {
    a: ["@statin3a4"], b: STRONG_3A4, severity: "major",
    effect: "Myopathy and rhabdomyolysis.",
    mechanism: "Strong CYP3A4 inhibition raises statin levels.",
    action: "Simvastatin and lovastatin: contraindicated, so pause the statin during the course. Atorvastatin: pause it or keep to 20 mg a day or less. Rosuvastatin and pravastatin are safer choices.",
  },
  {
    a: ["simvastatin"], b: ["amlodipine", "amiodarone"], severity: "moderate",
    effect: "Higher risk of myopathy.",
    mechanism: "Slower simvastatin clearance.",
    action: "Keep simvastatin at 20 mg a day or less, or switch to atorvastatin or rosuvastatin.",
  },
  {
    a: ["simvastatin"], b: ["verapamil", "diltiazem"], severity: "moderate",
    effect: "Higher risk of myopathy.",
    mechanism: "CYP3A4 inhibition raises simvastatin levels.",
    action: "Keep simvastatin at 10 mg a day or less, or switch statin.",
  },
  {
    a: ["amlodipine"], b: ["clarithromycin", "erythromycin"], severity: "moderate",
    effect: "Hypotension and acute kidney injury, mainly in older people.",
    mechanism: "CYP3A4 inhibition raises calcium channel blocker levels.",
    action: "Prefer azithromycin, or monitor blood pressure.",
  },

  // ---- kidney, potassium and lithium
  {
    a: ["@acei"], b: ["@arb"], severity: "major",
    effect: "Hyperkalaemia, acute kidney injury and hypotension, without added benefit for most patients.",
    mechanism: "Dual blockade of the renin-angiotensin system.",
    action: "Avoid combining them (ONTARGET; current guidelines).",
  },
  {
    a: ["@acei", "@arb", "@ksparing"], b: ["potassium"], severity: "major",
    effect: "Hyperkalaemia, which can cause fatal arrhythmias.",
    mechanism: "Reduced potassium excretion plus extra potassium.",
    action: "Avoid potassium supplements and salt substitutes unless potassium is documented to be low; then monitor potassium and creatinine closely.",
  },
  {
    a: ["@acei", "@arb"], b: ["@ksparing"], severity: "moderate",
    effect: "Hyperkalaemia and worsening kidney function.",
    mechanism: "Additive potassium retention.",
    action: "Often intended (heart failure). Check potassium and creatinine before starting, at 1 and 4 weeks, then regularly; avoid if potassium is above 5.0 mmol/L or eGFR is below 30.",
  },
  {
    a: ["@acei", "@arb"], b: ["@nsaid"], severity: "moderate",
    effect: "Acute kidney injury, poorer blood pressure control and hyperkalaemia; the risk is highest with a diuretic as well (the 'triple whammy').",
    mechanism: "NSAIDs block the prostaglandins that maintain kidney blood flow.",
    action: "Avoid regular NSAIDs, especially in older or dehydrated patients or those with CKD. If used, keep the course short and check creatinine and potassium.",
  },
  {
    a: ["@tmp"], b: ["@acei", "@arb", "@ksparing"], severity: "moderate",
    effect: "Hyperkalaemia, sometimes severe in older patients.",
    mechanism: "Trimethoprim blocks potassium excretion in the same way as amiloride.",
    action: "Check potassium within a few days of starting, or choose another antibiotic for high-risk patients.",
  },
  {
    a: ["lithium"], b: ["@nsaid"], severity: "major",
    effect: "Lithium toxicity: tremor, confusion, kidney injury and arrhythmias.",
    mechanism: "NSAIDs reduce renal lithium clearance.",
    action: "Avoid; use paracetamol. If an NSAID is needed, check the lithium level within 4 to 5 days and monitor.",
  },
  {
    a: ["lithium"], b: ["@acei", "@arb", "@thiazide"], severity: "major",
    effect: "Lithium levels rise, with a risk of toxicity.",
    mechanism: "Reduced renal lithium excretion.",
    action: "Avoid if possible. If combined, reduce the lithium dose as needed and check levels within about a week of starting or changing either drug.",
  },
  {
    a: ["lithium"], b: ["haloperidol"], severity: "moderate",
    effect: "Rare but serious neurotoxicity (confusion, rigidity, fever).",
    mechanism: "Uncertain.",
    action: "Monitor for neurological symptoms, especially early in treatment and at higher lithium levels.",
  },
  {
    a: ["@aminoglycoside"], b: ["@loop"], severity: "moderate",
    effect: "Ototoxicity and nephrotoxicity.",
    mechanism: "Additive toxicity to the ear and kidney.",
    action: "Avoid if possible; monitor aminoglycoside levels, kidney function and hearing, and avoid dehydration.",
  },
  {
    a: ["@aminoglycoside"], b: ["vancomycin"], severity: "moderate",
    effect: "Nephrotoxicity.",
    mechanism: "Additive kidney toxicity.",
    action: "Monitor drug levels and creatinine closely and keep the course as short as possible.",
  },
  {
    a: ["metformin"], b: ["contrast"], severity: "moderate",
    effect: "Lactic acidosis if the contrast causes acute kidney injury.",
    mechanism: "Metformin builds up when the kidneys fail.",
    action: "With eGFR 30 or more and no acute kidney injury, metformin can usually continue. With eGFR below 30 or AKI, stop it at the time of contrast and restart after 48 hours once kidney function is stable (ACR and RCR guidance).",
  },

  // ---- heart rate and rhythm
  {
    a: ["digoxin"], b: ["amiodarone"], severity: "major",
    effect: "Digoxin toxicity: nausea, visual changes, bradycardia and arrhythmias.",
    mechanism: "Amiodarone reduces digoxin clearance (P-glycoprotein).",
    action: "Halve the digoxin dose when starting amiodarone and check digoxin levels and heart rate.",
  },
  {
    a: ["digoxin"], b: ["verapamil", "diltiazem", "clarithromycin", "erythromycin"], severity: "moderate",
    effect: "Higher digoxin levels; verapamil and diltiazem also slow the heart further.",
    mechanism: "P-glycoprotein inhibition, plus additive effects on the AV node for the calcium channel blockers.",
    action: "Reduce the digoxin dose as needed and monitor levels, heart rate and symptoms.",
  },
  {
    a: ["@bb"], b: ["verapamil"], severity: "major",
    effect: "Severe bradycardia, heart block, hypotension and heart failure.",
    mechanism: "Additive effects on heart rate, conduction and contractility.",
    action: "Avoid, and never give IV verapamil to a patient on a beta-blocker. If an oral combination is essential, use specialist supervision and ECG monitoring.",
  },
  {
    a: ["@bb"], b: ["diltiazem"], severity: "moderate",
    effect: "Bradycardia and AV block.",
    mechanism: "Additive effects on the AV node.",
    action: "Use with caution and monitor heart rate and blood pressure, especially in older people or with conduction disease.",
  },
  {
    a: ["@qt"], b: ["@qt"], severity: "moderate",
    effect: "Additive QT prolongation, with a risk of torsades de pointes.",
    mechanism: "Both drugs prolong the QT interval.",
    action: "Check a baseline ECG and correct potassium and magnesium. Avoid if the QTc is above 500 ms or with congenital long QT, and repeat the ECG after starting.",
  },
  {
    a: ["@pde5"], b: ["@alpha"], severity: "moderate",
    effect: "Additive blood pressure lowering, with dizziness and postural hypotension.",
    mechanism: "Both are vasodilators.",
    action: "Start the PDE5 inhibitor at the lowest dose once the alpha-blocker dose is stable, and warn about postural symptoms.",
  },

  // ---- enzyme induction and inhibition
  {
    a: ENZYME_INDUCERS, b: ["ocp"], severity: "major",
    effect: "Hormonal contraception can fail.",
    mechanism: "Enzyme induction speeds up oestrogen and progestogen metabolism.",
    action: "Use a copper IUD, a levonorgestrel IUS or the progestogen injection during treatment and for 28 days after the inducer is stopped.",
  },
  {
    a: ["rifampicin"], b: ["dolutegravir"], severity: "major",
    effect: "Dolutegravir levels fall, risking HIV treatment failure and resistance.",
    mechanism: "Rifampicin induces UGT1A1 and CYP3A4.",
    action: "Give dolutegravir 50 mg twice daily during rifampicin treatment and for 2 weeks after it stops (WHO and NACO guidance).",
  },
  {
    a: ["rifampicin"], b: ["@pi"], severity: "major",
    effect: "Protease inhibitor levels fall sharply, risking HIV treatment failure.",
    mechanism: "Strong enzyme induction.",
    action: "Avoid. Use rifabutin instead of rifampicin, or follow NACO guidance with HIV specialist input.",
  },
  {
    a: ["@cni"], b: [...STRONG_3A4, "fluconazole", "diltiazem", "verapamil"], severity: "major",
    effect: "Tacrolimus or cyclosporine levels rise: kidney injury, neurotoxicity and hyperkalaemia.",
    mechanism: "CYP3A4 and P-glycoprotein inhibition.",
    action: "Avoid if possible; otherwise reduce the dose and check trough levels within a few days, with specialist input.",
  },
  {
    a: ["@cni"], b: ENZYME_INDUCERS, severity: "major",
    effect: "Tacrolimus or cyclosporine levels fall, risking rejection.",
    mechanism: "Enzyme induction.",
    action: "Avoid if possible; otherwise monitor trough levels closely and expect large dose increases, with specialist input.",
  },
  {
    a: ["rifampicin"], b: ["@steroid"], severity: "moderate",
    effect: "The steroid effect is reduced, risking adrenal crisis or a disease flare.",
    mechanism: "Enzyme induction speeds up steroid metabolism.",
    action: "A common approach is to double the corticosteroid dose during rifampicin treatment, then adjust by response.",
  },
  {
    a: ["rifampicin"], b: ["phenytoin"], severity: "moderate",
    effect: "Phenytoin levels fall, with a risk of seizures.",
    mechanism: "Enzyme induction.",
    action: "Monitor phenytoin levels and adjust the dose.",
  },
  {
    a: ["isoniazid"], b: ["phenytoin", "carbamazepine"], severity: "moderate",
    effect: "Phenytoin or carbamazepine toxicity (ataxia, nystagmus, drowsiness), especially in slow acetylators.",
    mechanism: "Isoniazid inhibits their metabolism.",
    action: "Monitor drug levels and for toxicity, and reduce the dose if needed.",
  },
  {
    a: ["phenytoin"], b: ["fluconazole"], severity: "major",
    effect: "Phenytoin toxicity.",
    mechanism: "Fluconazole inhibits CYP2C9.",
    action: "Monitor phenytoin levels and reduce the dose if needed, or choose another antifungal.",
  },
  {
    a: ["carbamazepine"], b: ["clarithromycin", "erythromycin"], severity: "major",
    effect: "Carbamazepine toxicity: dizziness, ataxia and double vision.",
    mechanism: "CYP3A4 inhibition.",
    action: "Avoid; use azithromycin instead, or monitor carbamazepine levels closely.",
  },
  {
    a: ["theophylline"], b: ["ciprofloxacin", "clarithromycin", "erythromycin", "fluvoxamine"], severity: "moderate",
    effect: "Theophylline toxicity: vomiting, tachycardia, arrhythmias and seizures.",
    mechanism: "CYP1A2 (and CYP3A4) inhibition slows theophylline clearance.",
    action: "Avoid if possible; otherwise reduce the theophylline dose and check levels.",
  },
  {
    a: ["@su"], b: ["fluconazole", "@tmp"], severity: "moderate",
    effect: "Hypoglycaemia, which can be severe and prolonged.",
    mechanism: "Slower sulfonylurea clearance (CYP2C9).",
    action: "Monitor blood glucose closely during the course and consider a lower sulfonylurea dose.",
  },
  {
    a: ["@su"], b: ["@fq"], severity: "moderate",
    effect: "Severe hypoglycaemia (and sometimes hyperglycaemia).",
    mechanism: "Fluoroquinolones affect insulin release.",
    action: "Monitor blood glucose closely, especially in older patients.",
  },
  {
    a: ["methotrexate"], b: ["@nsaid"], severity: "moderate",
    effect: "Higher methotrexate levels and toxicity.",
    mechanism: "NSAIDs reduce renal clearance of methotrexate.",
    action: "With high (anticancer) doses, avoid. With low weekly doses for arthritis the combination is common: monitor blood counts and kidney function.",
  },

  // ---- absorption
  {
    a: ["@fq"], b: ["@cation"], severity: "moderate",
    effect: "Much less of the antibiotic is absorbed, so treatment can fail.",
    mechanism: "Chelation with calcium, magnesium, aluminium, iron and zinc.",
    action: "Give the antibiotic at least 2 hours before or 4 to 6 hours after these products.",
  },
  {
    a: ["@tetracycline"], b: ["@cation"], severity: "moderate",
    effect: "Antibiotic absorption falls sharply.",
    mechanism: "Chelation.",
    action: "Separate the doses by 2 to 3 hours, giving the antibiotic first.",
  },
  {
    a: ["levothyroxine"], b: ["calcium", "iron", "antacid", "sucralfate"], severity: "moderate",
    effect: "Less levothyroxine is absorbed, so TSH rises.",
    mechanism: "Binding in the gut.",
    action: "Take levothyroxine on an empty stomach and separate these products by at least 4 hours.",
  },

  // ---- steroids
  {
    a: ["@fq"], b: ["@steroid"], severity: "moderate",
    effect: "Tendinitis and tendon rupture, especially over the age of 60.",
    mechanism: "Additive effects on tendon tissue.",
    action: "Avoid the combination where possible, and stop the fluoroquinolone at the first sign of tendon pain.",
  },
  {
    a: ["@nsaid"], b: ["@steroid"], severity: "moderate",
    effect: "Peptic ulceration and gastrointestinal bleeding.",
    mechanism: "Additive injury to the gut mucosa.",
    action: "Avoid if possible; otherwise add a PPI.",
  },

  // ---- sedation and alcohol
  {
    a: ["@opioid"], b: ["@benzo"], severity: "major",
    effect: "Profound sedation, respiratory depression, coma and death.",
    mechanism: "Additive central nervous system depression.",
    action: "Avoid unless there is no alternative. If needed, use the lowest doses for the shortest time, monitor breathing and sedation, and keep naloxone available.",
  },
  {
    a: ["alcohol"], b: ["@opioid", "@benzo"], severity: "major",
    effect: "Dangerous sedation and respiratory depression.",
    mechanism: "Additive central nervous system depression.",
    action: "Advise the patient not to drink alcohol.",
  },
  {
    a: ["alcohol"], b: ["metronidazole", "tinidazole"], severity: "moderate",
    effect: "Flushing, nausea, vomiting and palpitations (a disulfiram-like reaction) are reported.",
    mechanism: "Possibly inhibition of aldehyde dehydrogenase.",
    action: "Advise no alcohol during treatment and for at least 48 hours after metronidazole (72 hours after tinidazole).",
  },
  {
    a: ["alcohol"], b: ["metformin"], severity: "moderate",
    effect: "Lactic acidosis and hypoglycaemia with heavy drinking.",
    mechanism: "Alcohol raises lactate and blocks glucose production by the liver.",
    action: "Advise against heavy or binge drinking.",
  },
  {
    a: ["alcohol"], b: ["paracetamol"], severity: "minor",
    effect: "Higher risk of liver injury in chronic heavy drinkers.",
    mechanism: "Chronic alcohol use induces CYP2E1 and depletes glutathione.",
    action: "Normal doses are usually fine with occasional drinking. In chronic heavy drinkers or malnutrition, consider a lower daily maximum (often 2 g).",
  },
];

/* ------------------------------------------------------------------ matching */

export interface DetectedDrug {
  /** A key unique to this item. */
  key: string;
  /** Drug id, or "@class" for a class word such as "NSAIDs". */
  id: string;
  /** What to show, e.g. "Ecosprin (aspirin)" or "NSAIDs". */
  label: string;
  classes: string[];
}

export interface IxMatch {
  severity: IxSeverity;
  /** The two items, e.g. "Clarithromycin" and "Atorvastatin". */
  a: string;
  b: string;
  effect: string;
  mechanism: string;
  action: string;
}

const BY_ID = new Map(DRUGS.map((d) => [d.id, d]));
const norm = (s: string) => s.toLowerCase().replace(/[‐-―]/g, "-").replace(/[\s-]+/g, " ").trim();

type Entry = { kind: "drug"; id: string; brand?: string } | { kind: "combo"; combo: ComboDef } | { kind: "class"; cw: ClassWord };
const LEXICON = new Map<string, Entry>();
const add = (name: string, e: Entry) => {
  const k = norm(name);
  if (k && !LEXICON.has(k)) LEXICON.set(k, e);
};
for (const d of DRUGS) {
  add(d.id, { kind: "drug", id: d.id });
  add(d.name, { kind: "drug", id: d.id });
  d.aka?.forEach((n) => add(n, { kind: "drug", id: d.id }));
}
for (const d of DRUGS) d.brands?.forEach((b) => add(b, { kind: "drug", id: d.id, brand: b }));
for (const c of COMBOS) add(c.brand, { kind: "combo", combo: c });
for (const cw of CLASS_WORDS) cw.words.forEach((w) => add(w, { kind: "class", cw }));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The word boundary before a name is a captured group rather than a lookbehind,
// which older Safari versions cannot parse.
const NAME_RE = new RegExp(
  `(^|[^\\p{L}\\p{N}])(${[...LEXICON.keys()]
    .sort((x, y) => y.length - x.length)
    .map((k) => k.split(" ").map(escapeRe).join("[\\s\\-‐-―]+"))
    .join("|")})(?![\\p{L}\\p{N}])`,
  "giu",
);
/** "alcohol" in these phrases is not a drink. */
const NOT_DRINK = /^[\s-]*(withdrawal|based|swab|swabs|hand|rub|wipe|wipes|sanitiser|sanitizer)/i;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const drugItem = (id: string, brand?: string): DetectedDrug | null => {
  const d = BY_ID.get(id);
  if (!d) return null;
  return { key: `${id}|${brand ?? ""}`, id, label: brand ? `${brand} (${d.name.toLowerCase()})` : d.name, classes: d.classes ?? [] };
};

/** Drugs, brands and drug classes mentioned in free text, in order of appearance. */
export function detectDrugs(text: string): DetectedDrug[] {
  const out: DetectedDrug[] = [];
  const seen = new Set<string>();
  const push = (x: DetectedDrug | null) => {
    if (x && !seen.has(x.key)) { seen.add(x.key); out.push(x); }
  };
  for (const m of text.matchAll(NAME_RE)) {
    const e = LEXICON.get(norm(m[2]));
    if (!e) continue;
    if (e.kind === "drug") {
      if (e.id === "alcohol" && NOT_DRINK.test(text.slice((m.index ?? 0) + m[0].length))) continue;
      push(drugItem(e.id, e.brand));
    } else if (e.kind === "combo") {
      for (const id of e.combo.ids) {
        const d = BY_ID.get(id);
        if (d) push({ key: `${id}|${e.combo.brand}`, id, label: `${e.combo.brand} (${d.name.toLowerCase()})`, classes: d.classes ?? [] });
      }
    } else {
      push({ key: `@${e.cw.cls}`, id: `@${e.cw.cls}`, label: e.cw.label, classes: [e.cw.cls] });
    }
  }
  // A brand and its generic named together count once (keep the first mention).
  const ids = new Set<string>();
  return out.filter((x) => (ids.has(x.id) ? false : (ids.add(x.id), true)));
}

const fits = (x: DetectedDrug, side: string[]) =>
  side.some((t) => (t.startsWith("@") ? x.classes.includes(t.slice(1)) : t === x.id));

const RANK: Record<IxSeverity, number> = { major: 0, moderate: 1, minor: 2 };

/** Interactions between the detected drugs, most severe first, one per pair. */
export function findInteractions(drugs: DetectedDrug[]): IxMatch[] {
  const found: (IxMatch & { pair: string; order: number })[] = [];
  RULES.forEach((r, order) => {
    for (const x of drugs) {
      if (!fits(x, r.a)) continue;
      for (const y of drugs) {
        if (x === y || x.id === y.id || !fits(y, r.b)) continue;
        const pair = [x.id, y.id].sort().join("+");
        found.push({ severity: r.severity, a: cap(x.label), b: cap(y.label), effect: r.effect, mechanism: r.mechanism, action: r.action, pair, order });
      }
    }
  });
  found.sort((p, q) => RANK[p.severity] - RANK[q.severity] || p.order - q.order);
  const used = new Set<string>();
  return found
    .filter((f) => (used.has(f.pair) ? false : (used.add(f.pair), true)))
    .map(({ pair: _p, order: _o, ...m }) => m);
}

/** Detect the drugs in a text and check them against each other. */
export function checkText(text: string): { drugs: DetectedDrug[]; matches: IxMatch[] } {
  const drugs = detectDrugs(text);
  return { drugs, matches: drugs.length >= 2 ? findInteractions(drugs) : [] };
}

/** Names that start with what the user typed, for the checker's suggestions. */
export function suggestDrugNames(prefix: string, max = 8): string[] {
  const p = norm(prefix);
  if (p.length < 2) return [];
  const names: string[] = [];
  const add2 = (s: string) => { if (norm(s).startsWith(p) && !names.includes(s)) names.push(s); };
  for (const d of DRUGS) { add2(d.name); d.brands?.forEach(add2); }
  for (const c of COMBOS) add2(c.brand);
  for (const cw of CLASS_WORDS) add2(cw.label);
  return names.sort((x, y) => x.length - y.length).slice(0, max);
}

export const IX_RULE_COUNT = RULES.length;
export const IX_DRUG_COUNT = DRUGS.length;
