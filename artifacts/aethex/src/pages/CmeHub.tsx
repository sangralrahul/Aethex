/**
 * /cme-hub: clinical refresher modules for practising doctors, each opening the matching part of the Medical
 * Knowledge Hub. Update 69: the page used to show invented instructors, enrolment numbers, star ratings and
 * "NMC / IAP / CSI approved" credit badges, with buttons that did nothing. Aethex is not an accredited CME provider,
 * so the modules carry no credit hours and the page says so. Styles: src/shop.css (.cme-*).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Activity, ArrowRight, Baby, BookOpen, Brain, Clock, FlaskConical, GraduationCap, HeartPulse, Info, Layers, Scissors, Siren, Stethoscope } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useSeo } from "@/hooks/use-seo";

type Level = "Foundation" | "Intermediate" | "Advanced";
type Specialty = "Cardiology" | "Neurology" | "Oncology" | "Pediatrics" | "Surgery" | "General Medicine" | "Psychiatry" | "Emergency Medicine";

interface Module {
  title: string;
  specialty: Specialty;
  hours: number;
  level: Level;
  description: string;
  tags: string[];
  /** Where it is studied: a Knowledge Hub department or subject. */
  href: string;
}

const KH = "/study-hub/medical-knowledge-hub";

const MODULES: Module[] = [
  { title: "Heart failure: from diagnosis to device therapy", specialty: "Cardiology", hours: 4, level: "Advanced", description: "HFrEF and HFpEF, guideline-directed medical therapy and its optimisation, device therapy indications and newer drug classes such as SGLT2 inhibitors.", tags: ["HFrEF", "GDMT", "CRT", "SGLT2"], href: `${KH}/departments/cardiology` },
  { title: "Stroke: recognition, thrombolysis and rehabilitation", specialty: "Neurology", hours: 3, level: "Intermediate", description: "Early recognition, NIHSS, eligibility for thrombolysis and thrombectomy, and planning rehabilitation.", tags: ["Stroke", "tPA", "Thrombectomy", "NIHSS"], href: `${KH}/departments/neurology` },
  { title: "Targeted therapy and immunotherapy in oncology", specialty: "Oncology", hours: 5, level: "Advanced", description: "How targeted agents and immune checkpoint inhibitors work, where they are used and the toxicities to watch for.", tags: ["Immunotherapy", "CAR-T", "PD-L1", "Targeted therapy"], href: `${KH}/departments/oncology` },
  { title: "Neonatal emergencies: resuscitation, sepsis and respiratory distress", specialty: "Pediatrics", hours: 2.5, level: "Intermediate", description: "Neonatal resuscitation steps, recognising and treating neonatal sepsis, and respiratory distress including surfactant use.", tags: ["NRP", "Neonatal sepsis", "RDS", "Surfactant"], href: `${KH}/departments/pediatrics-dept` },
  { title: "Laparoscopic surgery fundamentals", specialty: "Surgery", hours: 3.5, level: "Intermediate", description: "Principles of laparoscopy, cholecystectomy and hernia repair, and the safe use of energy devices.", tags: ["Laparoscopy", "Cholecystectomy", "Hernia", "Energy devices"], href: `${KH}/subjects/surgery` },
  { title: "Diabetes: insulin intensification and newer drug classes", specialty: "General Medicine", hours: 2, level: "Foundation", description: "When and how to intensify insulin, GLP-1 receptor agonists, SGLT2 inhibitors and continuous glucose monitoring in type 2 diabetes.", tags: ["Insulin", "GLP-1", "SGLT2", "CGM", "T2DM"], href: `${KH}/departments/endocrinology` },
  { title: "Depression and anxiety in clinical practice", specialty: "Psychiatry", hours: 2.5, level: "Foundation", description: "Screening with PHQ-9, starting and monitoring SSRIs, and when to refer for psychological therapy.", tags: ["PHQ-9", "SSRIs", "CBT", "Depression", "Anxiety"], href: `${KH}/departments/psychiatry-dept` },
  { title: "Emergency airway management and rapid sequence intubation", specialty: "Emergency Medicine", hours: 3, level: "Advanced", description: "Airway assessment, the steps of rapid sequence intubation, video laryngoscopy and starting ventilation.", tags: ["RSI", "Video laryngoscopy", "Airway", "Ventilator"], href: `${KH}/departments/emergency-medicine-dept` },
  { title: "ECG interpretation: from the basics to STEMI equivalents", specialty: "Cardiology", hours: 2.5, level: "Intermediate", description: "A systematic approach to the ECG, arrhythmias, AV blocks and the patterns that need the cath lab.", tags: ["ECG", "STEMI", "Arrhythmia", "AV block"], href: `${KH}/departments/cardiology` },
  { title: "Sepsis and septic shock: the first hours", specialty: "Emergency Medicine", hours: 3, level: "Intermediate", description: "Sepsis-3 definitions, SOFA, early antibiotics, fluids and vasopressors.", tags: ["Sepsis-3", "SOFA", "Vasopressors", "Antibiotics"], href: `${KH}/departments/infectious-diseases` },
];

const FILTERS = ["All", "Cardiology", "Neurology", "Oncology", "Pediatrics", "Surgery", "General Medicine", "Psychiatry", "Emergency Medicine"] as const;
const ICON: Record<Specialty, typeof HeartPulse> = {
  Cardiology: HeartPulse, Neurology: Brain, Oncology: FlaskConical, Pediatrics: Baby, Surgery: Scissors, "General Medicine": Stethoscope, Psychiatry: Brain, "Emergency Medicine": Siren,
};
const COLOR: Record<Specialty, string> = {
  Cardiology: "#dc2626", Neurology: "#6d28d9", Oncology: "#0f766e", Pediatrics: "#db2777", Surgery: "#c2410c", "General Medicine": "#1d4ed8", Psychiatry: "#7c3aed", "Emergency Medicine": "#b91c1c",
};

export default function CmeHub() {
  useSeo({ title: "CME Hub: clinical refresher modules | Aethex Study", description: "Clinical refresher modules for practising doctors, each built on the Aethex Medical Knowledge Hub.", path: "/cme-hub" });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = filter === "All" ? MODULES : MODULES.filter((m) => m.specialty === filter);
  const hours = useMemo(() => MODULES.reduce((n, m) => n + m.hours, 0), []);
  const specialties = useMemo(() => new Set(MODULES.map((m) => m.specialty)).size, []);

  return (
    <div className="cme-page">
      <PageHero
        tag="Continuing medical education"
        title="CME Hub"
        subtitle="Clinical refresher modules for practising doctors, each built on the Medical Knowledge Hub: explanations, diagrams, exam questions and flashcards."
        icon={<GraduationCap className="w-7 h-7" />}
      />

      <div className="ax-wrap cme-body">
        <dl className="cme-facts">
          <div><dt>{MODULES.length}</dt><dd>modules</dd></div>
          <div><dt>{specialties}</dt><dd>specialties</dd></div>
          <div><dt>{hours}</dt><dd>hours of study</dd></div>
          <div><dt>Free</dt><dd>to read</dd></div>
        </dl>

        <p className="cme-note"><Info size={17} /> <span><b>No credit hours.</b> Aethex is not an accredited CME provider, so these modules do not carry NMC or state medical council CME credits. Use them to refresh and revise.</span></p>

        <div className="cme-head">
          <div className="ax-ihead"><span>Modules</span><h2>Choose a refresher</h2></div>
          <div className="kh-tabs" role="tablist" aria-label="Specialty">
            {FILTERS.map((f) => <button key={f} type="button" role="tab" aria-selected={filter === f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
        </div>

        <div className="cme-grid">
          {shown.map((m) => {
            const I = ICON[m.specialty];
            const c = COLOR[m.specialty];
            return (
              <article key={m.title} className="cme-card" data-reveal>
                <div className="top">
                  <span className="ic" style={{ color: c, background: `${c}12`, borderColor: `${c}30` }}><I size={20} /></span>
                  <span className="sp" style={{ color: c }}>{m.specialty}</span>
                </div>
                <h3>{m.title}</h3>
                <p>{m.description}</p>
                <ul className="tags">{m.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="meta"><span><Clock size={14} /> {m.hours} hours</span><span><Layers size={14} /> {m.level}</span></div>
                <Link href={m.href} className="ax-btn go"><BookOpen size={16} /> Start studying <ArrowRight size={15} /></Link>
              </article>
            );
          })}
        </div>

        <section className="cme-more">
          <div>
            <h2>Keep learning</h2>
            <p>Every subject and condition is in the Medical Knowledge Hub, and the Case of the day gives you one clinical case each day.</p>
          </div>
          <div className="acts">
            <Link href={KH} className="ax-btn teal lg"><BookOpen size={17} /> Open the Knowledge Hub</Link>
            <Link href="/case-of-the-day" className="ax-btn lg"><Activity size={17} /> Case of the day</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
