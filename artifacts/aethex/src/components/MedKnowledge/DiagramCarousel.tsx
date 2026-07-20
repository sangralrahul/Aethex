import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BrachialPlexusDiagram, UpperLimbBonesDiagram,
  ActionPotentialDiagram, CardiacCycleDiagram
} from "./diagrams/AnatomyDiagrams";
import {
  LowerLimbBonesDiagram, VertebralColumnDiagram, ThoraxSkeletonDiagram,
  SkullDiagram, BrainLateralDiagram, HeartAnatomyDiagram,
  AbdomenRegionsDiagram, CranialNervesDiagram
} from "./diagrams/AnatomyDiagrams2";
import {
  MIBiomarkersDiagram, MIECGChangesDiagram,
  HeartFailureFrankStarlingDiagram, HypertensionRAASDiagram,
  CoagulationCascadeDiagram, DoseResponseCurveDiagram,
  GramStainTree
} from "./diagrams/ConditionDiagrams";
import {
  EnzymeKineticsDiagram, DNAStructureDiagram, PharmacokineticsDiagram,
  LungVolumesDiagram, InflammationDiagram, BacterialClassificationDiagram,
  MetabolicPathwaysDiagram, NephronDiagram, AcidBaseDiagram, CellDeathDiagram
} from "./diagrams/SubjectDiagrams";

interface DiagramItem { title: string; component: React.ReactNode; }

function getDiagrams(topicSlug: string, subjectSlug: string, conditionSlug: string, deptSlug: string): DiagramItem[] {
  const slug = (topicSlug || conditionSlug || "").toLowerCase();
  const subj = (subjectSlug || "").toLowerCase();
  const dept = (deptSlug || "").toLowerCase();

  /* ══════════════════════════════════════════
     ANATOMY — per region
  ══════════════════════════════════════════ */
  if (slug === "upper-limb" || slug.includes("brachial-plexus"))
    return [{ title: "Bones of Upper Limb", component: <UpperLimbBonesDiagram /> }, { title: "Brachial Plexus", component: <BrachialPlexusDiagram /> }];

  if (slug === "lower-limb" || slug.includes("femur") || slug.includes("knee"))
    return [{ title: "Bones of Lower Limb", component: <LowerLimbBonesDiagram /> }];

  if (slug === "head-neck" || slug.includes("skull") || slug === "nose-paranasal-sinuses" || slug === "pharynx-larynx" || slug === "salivary-glands" || slug === "thyroid-parathyroid")
    return [{ title: "Skull — Lateral View", component: <SkullDiagram /> }, { title: "12 Cranial Nerves", component: <CranialNervesDiagram /> }];

  if (slug === "eye-orbit" || slug === "ear-external-middle-inner" || slug === "special-senses-anatomy")
    return [{ title: "Skull — Lateral View", component: <SkullDiagram /> }, { title: "12 Cranial Nerves", component: <CranialNervesDiagram /> }];

  if (slug === "thorax" || slug === "respiratory-anatomy" || slug.includes("rib"))
    return [{ title: "Thorax Skeleton", component: <ThoraxSkeletonDiagram /> }];

  if (slug === "back-vertebral-column" || slug.includes("vertebral") || slug === "spinal-cord-meninges")
    return [{ title: "Vertebral Column", component: <VertebralColumnDiagram /> }, { title: "Action Potential", component: <ActionPotentialDiagram /> }];

  if (slug === "neuroanatomy" || slug === "cerebral-cortex-lobes" || slug === "brainstem-cerebellum" || slug === "basal-ganglia" || slug === "thalamus-hypothalamus" || slug === "ventricular-system-csf")
    return [{ title: "Brain — Lateral View", component: <BrainLateralDiagram /> }, { title: "Nerve Action Potential", component: <ActionPotentialDiagram /> }];

  if (slug === "cranial-nerves" || slug === "autonomic-nervous-system" || slug === "peripheral-nervous-system")
    return [{ title: "12 Cranial Nerves", component: <CranialNervesDiagram /> }, { title: "Brachial Plexus", component: <BrachialPlexusDiagram /> }];

  if (slug === "cardiovascular-anatomy" || slug === "heart-pericardium" || slug === "great-vessels" || slug === "fetal-circulation")
    return [{ title: "Heart Anatomy", component: <HeartAnatomyDiagram /> }, { title: "Cardiac Cycle", component: <CardiacCycleDiagram /> }];

  if (slug === "abdomen" || slug === "digestive-system-anatomy" || slug === "liver-biliary-system")
    return [{ title: "Abdominal Regions & Organs", component: <AbdomenRegionsDiagram /> }];

  if (slug === "pelvis-perineum" || slug === "urogenital-anatomy" || slug === "kidney-ureter" || slug === "bladder-urethra" || slug === "male-reproductive-anatomy" || slug === "female-reproductive-anatomy")
    return [{ title: "Abdominal & Pelvic Regions", component: <AbdomenRegionsDiagram /> }, { title: "Vertebral Column", component: <VertebralColumnDiagram /> }];

  if (slug === "osteology-bones" || slug === "joints-ligaments" || slug === "musculoskeletal-system")
    return [{ title: "Upper Limb Bones", component: <UpperLimbBonesDiagram /> }, { title: "Lower Limb Bones", component: <LowerLimbBonesDiagram /> }, { title: "Vertebral Column", component: <VertebralColumnDiagram /> }];

  /* ══════════════════════════════════════════
     PHYSIOLOGY — per topic
  ══════════════════════════════════════════ */
  if (slug.includes("action-potential") || slug === "nerve-physiology-action-potential" || slug === "cell-physiology-membrane-transport")
    return [{ title: "Nerve Action Potential", component: <ActionPotentialDiagram /> }];

  if (slug === "cardiac-cycle-ecg" || slug.includes("cardiac-cycle") || slug === "cardiovascular-physiology")
    return [{ title: "Cardiac Cycle (PV Loop)", component: <CardiacCycleDiagram /> }, { title: "Action Potential", component: <ActionPotentialDiagram /> }];

  if (slug === "respiratory-physiology" || slug === "lung-volumes-spirometry")
    return [{ title: "Lung Volumes & Spirometry", component: <LungVolumesDiagram /> }];

  if (slug === "renal-physiology-gfr" || slug === "tubular-functions-concentration")
    return [{ title: "Nephron — Structure & Function", component: <NephronDiagram /> }];

  if (slug === "acid-base-balance" || slug === "fluid-electrolytes")
    return [{ title: "Acid-Base Balance Disorders", component: <AcidBaseDiagram /> }];

  if (slug === "hemostasis-coagulation")
    return [{ title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  if (slug === "muscle-physiology-skeletal-smooth-cardiac")
    return [{ title: "Cardiac Cycle (PV Loop)", component: <CardiacCycleDiagram /> }, { title: "Action Potential", component: <ActionPotentialDiagram /> }];

  if (slug === "shock-physiology" || slug.includes("shock"))
    return [{ title: "Frank-Starling Curve", component: <HeartFailureFrankStarlingDiagram /> }, { title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  /* ══════════════════════════════════════════
     BIOCHEMISTRY — per topic
  ══════════════════════════════════════════ */
  if (slug.includes("enzyme") || slug.includes("enzyme-kinetics") || slug === "enzymes-enzyme-kinetics")
    return [{ title: "Enzyme Kinetics (Michaelis-Menten)", component: <EnzymeKineticsDiagram /> }];

  if (slug.includes("dna") || slug.includes("transcription") || slug.includes("translation") || slug.includes("replication") || slug === "dna-structure-replication")
    return [{ title: "DNA Structure & Base Pairing", component: <DNAStructureDiagram /> }];

  if (slug.includes("carbohydrate") || slug.includes("glycol") || slug.includes("tca") || slug === "carbohydrate-metabolism-glycolysis-tca" || slug === "gluconeogenesis-glycogen-metabolism")
    return [{ title: "Metabolic Pathways Overview", component: <MetabolicPathwaysDiagram /> }, { title: "Enzyme Kinetics", component: <EnzymeKineticsDiagram /> }];

  if (slug.includes("lipid") || slug.includes("fatty-acid") || slug.includes("ketone") || slug === "lipid-metabolism-fatty-acid-oxidation")
    return [{ title: "Metabolic Pathways Overview", component: <MetabolicPathwaysDiagram /> }];

  if (slug.includes("amino-acid") || slug.includes("protein") || slug.includes("urea") || slug === "amino-acids-proteins")
    return [{ title: "Metabolic Pathways Overview", component: <MetabolicPathwaysDiagram /> }, { title: "Enzyme Kinetics", component: <EnzymeKineticsDiagram /> }];

  if (slug.includes("acid-base-chemistry") || slug.includes("hemoglobin"))
    return [{ title: "Acid-Base Balance", component: <AcidBaseDiagram /> }];

  /* ══════════════════════════════════════════
     PHARMACOLOGY — per topic
  ══════════════════════════════════════════ */
  if (slug === "pharmacodynamics" || slug.includes("dose-response") || slug.includes("receptor"))
    return [{ title: "Dose-Response Curves", component: <DoseResponseCurveDiagram /> }];

  if (slug === "general-pharmacology-pharmacokinetics" || slug.includes("pharmacokinetics") || slug.includes("pk"))
    return [{ title: "Pharmacokinetics — Drug Concentration", component: <PharmacokineticsDiagram /> }, { title: "Dose-Response Curves", component: <DoseResponseCurveDiagram /> }];

  if (slug.includes("cardiovascular-drug") || slug.includes("antihypertensive") || slug.includes("antiarrhythmic") || slug === "cardiovascular-drugs-antihypertensives")
    return [{ title: "RAAS System", component: <HypertensionRAASDiagram /> }, { title: "Pharmacokinetics", component: <PharmacokineticsDiagram /> }];

  if (slug.includes("anticoagulant") || slug.includes("antiplatelets") || slug.includes("thrombolytic"))
    return [{ title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }, { title: "Pharmacokinetics", component: <PharmacokineticsDiagram /> }];

  if (slug.includes("antimicrobial") || slug.includes("penicillin") || slug.includes("antibiotic"))
    return [{ title: "Gram Stain Classification", component: <GramStainTree /> }, { title: "Pharmacokinetics", component: <PharmacokineticsDiagram /> }];

  if (slug.includes("heart-failure-drug") || slug.includes("diuretic"))
    return [{ title: "Frank-Starling Curve", component: <HeartFailureFrankStarlingDiagram /> }, { title: "RAAS System", component: <HypertensionRAASDiagram /> }];

  /* ══════════════════════════════════════════
     PATHOLOGY — per topic
  ══════════════════════════════════════════ */
  if (slug.includes("inflammation") || slug === "inflammation-acute-chronic")
    return [{ title: "Inflammation — Phases", component: <InflammationDiagram /> }, { title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  if (slug.includes("cell-injury") || slug.includes("necrosis") || slug.includes("apoptosis") || slug === "cell-injury-death-necrosis-apoptosis")
    return [{ title: "Necrosis vs Apoptosis", component: <CellDeathDiagram /> }];

  if (slug.includes("thrombosis") || slug.includes("coagulation") || slug.includes("hemostasis") || slug === "thrombosis-embolism-infarction")
    return [{ title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  if (slug.includes("cardiovascular-pathology") || slug.includes("cardiac"))
    return [{ title: "Heart Anatomy", component: <HeartAnatomyDiagram /> }, { title: "Cardiac Biomarkers", component: <MIBiomarkersDiagram /> }];

  if (slug.includes("respiratory-pathology"))
    return [{ title: "Thorax Skeleton", component: <ThoraxSkeletonDiagram /> }, { title: "Lung Volumes", component: <LungVolumesDiagram /> }];

  if (slug.includes("cns-pathology") || slug.includes("brain"))
    return [{ title: "Brain — Lateral View", component: <BrainLateralDiagram /> }];

  if (slug.includes("neoplasia") || slug.includes("tumor") || slug.includes("cancer") || slug.includes("lymphoma") || slug.includes("leukemia"))
    return [{ title: "Cell Death vs Apoptosis", component: <CellDeathDiagram /> }, { title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  if (slug.includes("anemia") || slug.includes("hematology") || slug.includes("blood"))
    return [{ title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  /* ══════════════════════════════════════════
     MICROBIOLOGY — per topic
  ══════════════════════════════════════════ */
  if (slug.includes("gram") || slug.includes("bacteria") || slug.includes("bacterial") || slug === "general-microbiology" || subj === "microbiology")
    return [{ title: "Gram +ve vs Gram −ve", component: <BacterialClassificationDiagram /> }, { title: "Gram Stain Classification", component: <GramStainTree /> }];

  /* ══════════════════════════════════════════
     CLINICAL CONDITIONS
  ══════════════════════════════════════════ */
  if (slug.includes("myocardial-infarction") || slug.includes("stemi") || slug.includes("nstemi") || slug.includes("acs"))
    return [{ title: "Cardiac Biomarkers Timeline", component: <MIBiomarkersDiagram /> }, { title: "ECG Changes (STEMI)", component: <MIECGChangesDiagram /> }, { title: "Frank-Starling Curve", component: <HeartFailureFrankStarlingDiagram /> }];

  if (slug.includes("heart-failure"))
    return [{ title: "Frank-Starling Curve", component: <HeartFailureFrankStarlingDiagram /> }, { title: "Cardiac Biomarkers", component: <MIBiomarkersDiagram /> }];

  if (slug.includes("hypertension") || slug.includes("raas"))
    return [{ title: "RAAS System", component: <HypertensionRAASDiagram /> }, { title: "Pharmacokinetics", component: <PharmacokineticsDiagram /> }];

  if (slug.includes("copd") || slug.includes("asthma") || slug.includes("pneumonia") || slug.includes("pulmonary"))
    return [{ title: "Lung Volumes & Spirometry", component: <LungVolumesDiagram /> }, { title: "Thorax Skeleton", component: <ThoraxSkeletonDiagram /> }];

  if (slug.includes("diabetes") || slug.includes("dka") || slug.includes("metabolic"))
    return [{ title: "Metabolic Pathways", component: <MetabolicPathwaysDiagram /> }, { title: "Acid-Base Balance", component: <AcidBaseDiagram /> }];

  if (slug.includes("ckd") || slug.includes("renal-failure") || slug.includes("nephro") || slug.includes("kidney"))
    return [{ title: "Nephron — Structure & Function", component: <NephronDiagram /> }, { title: "Acid-Base Balance", component: <AcidBaseDiagram /> }];

  if (slug.includes("sepsis") || slug.includes("infection") || slug.includes("meningitis"))
    return [{ title: "Gram Classification", component: <BacterialClassificationDiagram /> }, { title: "Inflammation", component: <InflammationDiagram /> }];

  if (slug.includes("stroke") || slug.includes("tia") || slug.includes("neuro"))
    return [{ title: "Brain — Lateral View", component: <BrainLateralDiagram /> }, { title: "Cranial Nerves", component: <CranialNervesDiagram /> }];

  if (slug.includes("fracture") || slug.includes("ortho") || slug.includes("bone"))
    return [{ title: "Upper Limb Bones", component: <UpperLimbBonesDiagram /> }, { title: "Lower Limb Bones", component: <LowerLimbBonesDiagram /> }];

  /* ══════════════════════════════════════════
     SUBJECT-LEVEL FALLBACKS
  ══════════════════════════════════════════ */
  if (subj === "anatomy")
    return [{ title: "Upper Limb Bones", component: <UpperLimbBonesDiagram /> }, { title: "Lower Limb Bones", component: <LowerLimbBonesDiagram /> }, { title: "Vertebral Column", component: <VertebralColumnDiagram /> }];

  if (subj === "physiology")
    return [{ title: "Action Potential", component: <ActionPotentialDiagram /> }, { title: "Cardiac Cycle", component: <CardiacCycleDiagram /> }, { title: "Lung Volumes", component: <LungVolumesDiagram /> }];

  if (subj === "biochemistry")
    return [{ title: "Metabolic Pathways", component: <MetabolicPathwaysDiagram /> }, { title: "Enzyme Kinetics", component: <EnzymeKineticsDiagram /> }, { title: "DNA Structure", component: <DNAStructureDiagram /> }];

  if (subj === "pharmacology")
    return [{ title: "Pharmacokinetics", component: <PharmacokineticsDiagram /> }, { title: "Dose-Response Curves", component: <DoseResponseCurveDiagram /> }];

  if (subj === "pathology")
    return [{ title: "Inflammation", component: <InflammationDiagram /> }, { title: "Necrosis vs Apoptosis", component: <CellDeathDiagram /> }, { title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  if (subj === "microbiology")
    return [{ title: "Gram +ve vs Gram −ve", component: <BacterialClassificationDiagram /> }, { title: "Gram Stain Tree", component: <GramStainTree /> }];

  /* ══════════════════════════════════════════
     DEPARTMENT FALLBACKS
  ══════════════════════════════════════════ */
  if (dept === "cardiology" || dept === "medicine")
    return [{ title: "Cardiac Biomarkers", component: <MIBiomarkersDiagram /> }, { title: "ECG (STEMI)", component: <MIECGChangesDiagram /> }, { title: "Frank-Starling Curve", component: <HeartFailureFrankStarlingDiagram /> }, { title: "RAAS System", component: <HypertensionRAASDiagram /> }];

  if (dept === "neurology")
    return [{ title: "Brain — Lateral View", component: <BrainLateralDiagram /> }, { title: "Cranial Nerves", component: <CranialNervesDiagram /> }, { title: "Action Potential", component: <ActionPotentialDiagram /> }];

  if (dept === "orthopedics-dept" || dept === "orthopedics")
    return [{ title: "Upper Limb Bones", component: <UpperLimbBonesDiagram /> }, { title: "Lower Limb Bones", component: <LowerLimbBonesDiagram /> }, { title: "Vertebral Column", component: <VertebralColumnDiagram /> }];

  if (dept === "pulmonology")
    return [{ title: "Lung Volumes & Spirometry", component: <LungVolumesDiagram /> }, { title: "Thorax Skeleton", component: <ThoraxSkeletonDiagram /> }];

  if (dept === "nephrology")
    return [{ title: "Nephron — Structure & Function", component: <NephronDiagram /> }, { title: "Acid-Base Balance", component: <AcidBaseDiagram /> }];

  if (dept === "gastroenterology")
    return [{ title: "Abdominal Regions", component: <AbdomenRegionsDiagram /> }, { title: "Metabolic Pathways", component: <MetabolicPathwaysDiagram /> }];

  if (dept === "hematology")
    return [{ title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> }];

  if (dept === "infectious-diseases")
    return [{ title: "Gram +ve vs Gram −ve", component: <BacterialClassificationDiagram /> }, { title: "Gram Stain Tree", component: <GramStainTree /> }, { title: "Inflammation", component: <InflammationDiagram /> }];

  if (dept === "endocrinology")
    return [{ title: "Metabolic Pathways", component: <MetabolicPathwaysDiagram /> }, { title: "Acid-Base Balance", component: <AcidBaseDiagram /> }];

  if (dept === "rheumatology")
    return [{ title: "Inflammation — Phases", component: <InflammationDiagram /> }, { title: "Upper Limb Bones", component: <UpperLimbBonesDiagram /> }];

  /* ── Default variety ── */
  return [
    { title: "Action Potential", component: <ActionPotentialDiagram /> },
    { title: "Coagulation Cascade", component: <CoagulationCascadeDiagram /> },
    { title: "Dose-Response Curve", component: <DoseResponseCurveDiagram /> },
  ];
}

interface DiagramCarouselProps {
  topicSlug?: string;
  subjectSlug?: string;
  conditionSlug?: string;
  deptSlug?: string;
}

export function DiagramCarousel({ topicSlug = "", subjectSlug = "", conditionSlug = "", deptSlug = "" }: DiagramCarouselProps) {
  const diagrams = getDiagrams(topicSlug, subjectSlug, conditionSlug, deptSlug);
  const [active, setActive] = useState(0);
  if (diagrams.length === 0) return null;

  return (
    <div>
      {diagrams.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {diagrams.map((d, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: active === i ? "#00C2A8" : "#E5E1D8",
                color: active === i ? "#F5F3EE" : "#6B7280",
                border: `1px solid ${active === i ? "#00C2A8" : "#E5E1D8"}`,
              }}>
              {d.title}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E5E1D8" }}>
        <div className="px-4 py-2 border-b flex items-center justify-between" style={{ background: "#FFFFFF", borderColor: "#E5E1D8" }}>
          <span className="text-sm font-semibold" style={{ color: "#0F1729" }}>{diagrams[active].title}</span>
          {diagrams.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setActive(i => Math.max(0, i - 1))} disabled={active === 0}
                className="p-1 rounded-lg disabled:opacity-30 transition-all hover:bg-white/5"
                style={{ color: "#6B7280" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs" style={{ color: "#6B7280" }}>{active + 1}/{diagrams.length}</span>
              <button onClick={() => setActive(i => Math.min(diagrams.length - 1, i + 1))} disabled={active === diagrams.length - 1}
                className="p-1 rounded-lg disabled:opacity-30 transition-all hover:bg-white/5"
                style={{ color: "#6B7280" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="p-4" style={{ background: "#F5F3EE" }}>
          {diagrams[active].component}
        </div>
      </div>
    </div>
  );
}
