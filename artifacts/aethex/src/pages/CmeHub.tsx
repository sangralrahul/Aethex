import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { Link } from "wouter";
import {
  GraduationCap, Clock, Users, Star, Lock, Play, BookOpen,
  Award, ChevronRight, Sparkles, CheckCircle2, Crown,
  Heart, Brain, Baby, Activity, Scissors, Stethoscope,
  FlaskConical, Shield, ArrowRight, Zap, TrendingUp,
} from "lucide-react";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type Specialty =
  | "Cardiology" | "Neurology" | "Oncology" | "Pediatrics"
  | "Surgery" | "General Medicine" | "Psychiatry" | "Emergency Medicine";

interface CMECourse {
  id: number;
  title: string;
  specialty: Specialty;
  credits: number;
  duration: string;
  difficulty: Difficulty;
  instructor: string;
  designation: string;
  description: string;
  enrolled: number;
  rating: number;
  isPremium: boolean;
  isFeatured?: boolean;
  gradient: string;
  icon: React.ElementType;
  tags: string[];
  approved: string;
}

const COURSES: CMECourse[] = [
  {
    id: 1,
    title: "Advanced Heart Failure Management: From Diagnosis to Device Therapy",
    specialty: "Cardiology",
    credits: 8,
    duration: "4 hours",
    difficulty: "Advanced",
    instructor: "Dr. Rajesh Gupta",
    designation: "Senior Cardiologist, AIIMS New Delhi",
    description: "Comprehensive coverage of HFrEF and HFpEF management, GDMT optimization, device therapy indications, and emerging therapies including SGLT2 inhibitors in heart failure.",
    enrolled: 4821,
    rating: 4.9,
    isPremium: false,
    isFeatured: true,
    gradient: "from-rose-600 to-rose-900",
    icon: Heart,
    tags: ["HFrEF", "GDMT", "CRT", "SGLT2"],
    approved: "NMC Approved · 8 CME Credits",
  },
  {
    id: 2,
    title: "Stroke Recognition, Thrombolysis & Neurorehabilitation",
    specialty: "Neurology",
    credits: 6,
    duration: "3 hours",
    difficulty: "Intermediate",
    instructor: "Dr. Meena Iyer",
    designation: "Neurologist, KEM Hospital Mumbai",
    description: "Evidence-based approach to acute ischemic stroke — NIHSS scoring, IV tPA protocols, mechanical thrombectomy criteria, and early rehabilitation strategies.",
    enrolled: 3142,
    rating: 4.8,
    isPremium: false,
    gradient: "from-violet-600 to-violet-900",
    icon: Brain,
    tags: ["Stroke", "tPA", "Thrombectomy", "NIHSS"],
    approved: "NMC Approved · 6 CME Credits",
  },
  {
    id: 3,
    title: "Oncology Essentials: Targeted Therapy & Immunotherapy Updates 2024",
    specialty: "Oncology",
    credits: 10,
    duration: "5 hours",
    difficulty: "Advanced",
    instructor: "Dr. Ananya Krishnamurthy",
    designation: "Medical Oncologist, Tata Memorial Centre",
    description: "Current landscape of targeted therapy in breast, lung, and colorectal cancers. Checkpoint inhibitors, CAR-T therapy, and managing immune-related adverse events.",
    enrolled: 2876,
    rating: 4.9,
    isPremium: true,
    gradient: "from-teal-600 to-teal-900",
    icon: FlaskConical,
    tags: ["Immunotherapy", "CAR-T", "PD-L1", "Targeted Therapy"],
    approved: "NMC Approved · 10 CME Credits",
  },
  {
    id: 4,
    title: "Neonatal Emergencies: NRP, Sepsis & Respiratory Distress",
    specialty: "Pediatrics",
    credits: 5,
    duration: "2.5 hours",
    difficulty: "Intermediate",
    instructor: "Dr. Priya Nair",
    designation: "Neonatologist, St John's Medical College",
    description: "Neonatal Resuscitation Program (NRP) protocols, recognition and management of neonatal sepsis, RDS, transient tachypnea, and surfactant therapy indications.",
    enrolled: 5209,
    rating: 4.7,
    isPremium: false,
    gradient: "from-pink-500 to-pink-800",
    icon: Baby,
    tags: ["NRP", "Neonatal Sepsis", "RDS", "Surfactant"],
    approved: "IAP Approved · 5 CME Credits",
  },
  {
    id: 5,
    title: "Laparoscopic Surgery Fundamentals for General Surgeons",
    specialty: "Surgery",
    credits: 7,
    duration: "3.5 hours",
    difficulty: "Intermediate",
    instructor: "Dr. Vikram Khanna",
    designation: "GI & Laparoscopic Surgeon, Medanta Hospital",
    description: "Ergonomics, trocar placement, pneumoperitoneum safety, energy devices, and technique for laparoscopic cholecystectomy, appendicectomy, and hernia repair.",
    enrolled: 3654,
    rating: 4.8,
    isPremium: true,
    gradient: "from-orange-500 to-orange-800",
    icon: Scissors,
    tags: ["Laparoscopy", "Cholecystectomy", "Hernia", "Energy Devices"],
    approved: "ASI Approved · 7 CME Credits",
  },
  {
    id: 6,
    title: "Diabetes Management: Insulin Intensification & New Drug Classes",
    specialty: "General Medicine",
    credits: 4,
    duration: "2 hours",
    difficulty: "Beginner",
    instructor: "Dr. Suresh Babu",
    designation: "Diabetologist, Apollo Hospitals Chennai",
    description: "Practical guide to insulin regimens, basal-bolus therapy, GLP-1 agonists, SGLT2 inhibitors, and continuous glucose monitoring (CGM) interpretation in T2DM.",
    enrolled: 7432,
    rating: 4.6,
    isPremium: false,
    gradient: "from-amber-500 to-amber-800",
    icon: Activity,
    tags: ["Insulin", "GLP-1", "SGLT2", "CGM", "T2DM"],
    approved: "RSSDI Approved · 4 CME Credits",
  },
  {
    id: 7,
    title: "Depression & Anxiety in Clinical Practice: Screening to Treatment",
    specialty: "Psychiatry",
    credits: 5,
    duration: "2.5 hours",
    difficulty: "Beginner",
    instructor: "Dr. Pooja Sharma",
    designation: "Consultant Psychiatrist, NIMHANS Bangalore",
    description: "PHQ-9, GAD-7 screening in primary care. Antidepressant selection, SSRIs vs SNRIs, CBT referral criteria, and management of treatment-resistant depression.",
    enrolled: 6118,
    rating: 4.7,
    isPremium: false,
    gradient: "from-indigo-500 to-indigo-800",
    icon: Brain,
    tags: ["PHQ-9", "SSRIs", "CBT", "Depression", "Anxiety"],
    approved: "IPS Approved · 5 CME Credits",
  },
  {
    id: 8,
    title: "Emergency Airway Management & Rapid Sequence Intubation",
    specialty: "Emergency Medicine",
    credits: 6,
    duration: "3 hours",
    difficulty: "Advanced",
    instructor: "Dr. Rahul Desai",
    designation: "Emergency Physician, LTMG Hospital Mumbai",
    description: "RSI drug selection and dosing, video laryngoscopy, supraglottic airway devices, surgical airway as rescue, and post-intubation ventilator settings in the ED.",
    enrolled: 2943,
    rating: 4.9,
    isPremium: true,
    gradient: "from-red-600 to-red-900",
    icon: Shield,
    tags: ["RSI", "Video Laryngoscopy", "Airway", "Ventilator"],
    approved: "NMC Approved · 6 CME Credits",
  },
  {
    id: 9,
    title: "ECG Interpretation Masterclass: From Basics to STEMI Equivalents",
    specialty: "Cardiology",
    credits: 5,
    duration: "2.5 hours",
    difficulty: "Intermediate",
    instructor: "Dr. Anil Menon",
    designation: "Interventional Cardiologist, PGIMER Chandigarh",
    description: "Systematic ECG reading, arrhythmia recognition, STEMI equivalents (DeWinter, Wellens, Sgarbossa), wide complex tachycardia, and AV blocks.",
    enrolled: 8912,
    rating: 4.9,
    isPremium: false,
    gradient: "from-rose-500 to-red-800",
    icon: Heart,
    tags: ["ECG", "STEMI", "Arrhythmia", "AV Block"],
    approved: "CSI Approved · 5 CME Credits",
  },
  {
    id: 10,
    title: "Sepsis & Septic Shock: Surviving Sepsis Campaign 2024 Update",
    specialty: "Emergency Medicine",
    credits: 6,
    duration: "3 hours",
    difficulty: "Intermediate",
    instructor: "Dr. Kavitha Rao",
    designation: "Critical Care Physician, Manipal Hospital",
    description: "Updated sepsis-3 definitions, SOFA scoring, early goal-directed therapy, fluid resuscitation strategies, vasopressor choice, and antibiotic stewardship in sepsis.",
    enrolled: 4231,
    rating: 4.8,
    isPremium: true,
    gradient: "from-red-500 to-rose-900",
    icon: Activity,
    tags: ["Sepsis-3", "SOFA", "Vasopressors", "Antibiotics"],
    approved: "ISCCM Approved · 6 CME Credits",
  },
];

const FILTERS = ["All", "Cardiology", "Neurology", "Oncology", "Pediatrics", "Surgery", "General Medicine", "Psychiatry", "Emergency Medicine"] as const;

const SPECIALTY_ICONS: Record<Specialty, React.ElementType> = {
  Cardiology: Heart, Neurology: Brain, Oncology: FlaskConical, Pediatrics: Baby,
  Surgery: Scissors, "General Medicine": Stethoscope, Psychiatry: Brain, "Emergency Medicine": Shield,
};

const DIFFICULTY_STYLES: Record<Difficulty, { bg: string; color: string; border: string }> = {
  Beginner: { bg: "rgba(52,199,89,0.12)", color: "#34C759", border: "rgba(52,199,89,0.25)" },
  Intermediate: { bg: "rgba(255,149,0,0.12)", color: "#FF9500", border: "rgba(255,149,0,0.25)" },
  Advanced: { bg: "rgba(255,59,48,0.12)", color: "#FF3B30", border: "rgba(255,59,48,0.25)" },
};

const SPECIALTY_COLORS: Record<Specialty, string> = {
  Cardiology: "#FF3B30", Neurology: "#5856D6", Oncology: "#00C2A8",
  Pediatrics: "#FF2D92", Surgery: "#FF9500", "General Medicine": "#007AFF",
  Psychiatry: "#AF52DE", "Emergency Medicine": "#FF3B30",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className="w-3 h-3" viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#FF9500" : "none"}
          stroke={s <= Math.round(rating) ? "#FF9500" : "#AEAEB2"} strokeWidth={2}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
      <span className="text-xs font-semibold ml-0.5" style={{ color: "#FF9500" }}>{rating}</span>
    </div>
  );
}

function CourseCard({ course }: { course: CMECourse }) {
  const Icon = course.icon;
  const diff = DIFFICULTY_STYLES[course.difficulty];
  const specColor = SPECIALTY_COLORS[course.specialty];

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl group"
      style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      {/* Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${course.gradient} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
        <Icon className="w-14 h-14 text-white opacity-30 group-hover:opacity-50 transition-all group-hover:scale-110 duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
            {course.approved.split("·")[0].trim()}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {course.isPremium && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.5)", color: "#FFD60A" }}>
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,122,255,0.9)", color: "#FFFFFF" }}>
            <Award className="w-3 h-3" /> {course.credits} Credits
          </span>
        </div>

        {course.isPremium && (
          <div className="absolute inset-0 flex items-end justify-center pb-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
              <Lock className="w-3 h-3" /> Premium course
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Specialty + Difficulty */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${specColor}14`, color: specColor, border: `1px solid ${specColor}25` }}>
            {course.specialty}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}>
            {course.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#007AFF] transition-colors"
          style={{ color: "#1C1C1E" }}>
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-xs leading-relaxed mb-3 line-clamp-2 flex-1" style={{ color: "#636366" }}>
          {course.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {course.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: "rgba(0,122,255,0.07)", color: "#007AFF" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(60,60,67,0.08)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
            {course.instructor.split(" ").slice(-1)[0][0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#1C1C1E" }}>{course.instructor}</p>
            <p className="text-[10px] truncate" style={{ color: "#AEAEB2" }}>{course.designation}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 text-xs" style={{ color: "#AEAEB2" }}>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {course.enrolled.toLocaleString("en-IN")}
          </span>
          <div className="ml-auto">
            <StarRating rating={course.rating} />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
            style={{ background: course.isPremium ? "linear-gradient(135deg,#FFD60A,#FF9500)" : "linear-gradient(135deg,#007AFF,#00C2A8)", color: course.isPremium ? "#1C1C1E" : "#FFFFFF" }}>
            {course.isPremium ? <><Crown className="w-3.5 h-3.5" /> Unlock</> : <><BookOpen className="w-3.5 h-3.5" /> Enroll Free</>}
          </button>
          <button className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all hover:bg-gray-100"
            style={{ border: "1px solid rgba(60,60,67,0.15)", color: "#636366" }}>
            <Play className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedCourse({ course }: { course: CMECourse }) {
  const Icon = course.icon;
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${course.gradient} mb-12`}
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(255,255,255,0.35) 0%, transparent 60%)" }} />
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <Icon className="w-64 h-64 text-white -translate-y-8 translate-x-8" />
      </div>

      <div className="relative z-10 p-8 lg:p-12">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF", backdropFilter: "blur(8px)" }}>
            <Sparkles className="w-3.5 h-3.5" /> Featured Course
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>
            <Award className="w-3.5 h-3.5" /> {course.credits} CME Credits
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
            {course.approved}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white leading-tight mb-4">
              {course.title}
            </h2>
            <p className="text-sm lg:text-base mb-6 max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}>
                  {course.instructor.split(" ").slice(-1)[0][0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{course.instructor}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{course.designation}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.enrolled.toLocaleString("en-IN")} enrolled</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {course.tags.map(tag => (
                <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[200px]">
            <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "#FFFFFF", color: "#1C1C1E", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
              <BookOpen className="w-4 h-4" />
              Enroll Free
            </button>
            <button className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-semibold text-sm transition-all hover:bg-white/20"
              style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Play className="w-4 h-4" />
              Watch Preview
            </button>
            <div className="text-center">
              <StarRating rating={course.rating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CmeHub() {
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>("All");

  const featuredCourse = COURSES.find(c => c.isFeatured)!;
  const filteredCourses = activeFilter === "All"
    ? COURSES.filter(c => !c.isFeatured)
    : COURSES.filter(c => c.specialty === activeFilter && !c.isFeatured);

  const totalCredits = COURSES.reduce((sum, c) => sum + c.credits, 0);
  const totalEnrolled = COURSES.reduce((sum, c) => sum + c.enrolled, 0);
  const specialties = [...new Set(COURSES.map(c => c.specialty))].length;

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>

      <PageHero
        tag="NMC · MCI · IAP · CSI Approved"
        title="CME Hub"
        subtitle="Accredited continuing medical education — earn CME credits with NMC-approved courses for Indian doctors"
        icon={<GraduationCap className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />

      {/* ── Stats Bar ── */}
      <section className="py-8" style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(60,60,67,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${COURSES.length}+`, label: "Total Courses", icon: BookOpen, color: "#007AFF" },
              { value: `${totalCredits}+`, label: "CME Credits Available", icon: Award, color: "#00C2A8" },
              { value: `${Math.round(totalEnrolled / 1000)}K+`, label: "Enrolled Doctors", icon: Users, color: "#5856D6" },
              { value: `${specialties}`, label: "Specialties Covered", icon: Stethoscope, color: "#FF9500" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center px-4 py-2"
                  style={i > 0 ? { borderLeft: "1px solid rgba(60,60,67,0.1)" } : {}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: `${stat.color}14` }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="text-2xl font-display font-bold mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs font-medium leading-snug" style={{ color: "#636366" }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="courses">

        {/* Featured Course */}
        <FeaturedCourse course={featuredCourse} />

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold" style={{ color: "#1C1C1E" }}>All Courses</h2>
            <p className="text-sm mt-1" style={{ color: "#636366" }}>
              {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} · NMC / MCI approved
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#636366" }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: "#34C759" }} />
            All courses NMC / MCI approved
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map(filter => (
            <button key={filter} onClick={() => setActiveFilter(filter)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={activeFilter === filter
                ? { background: "#007AFF", color: "#FFFFFF", boxShadow: "0 2px 10px rgba(0,122,255,0.25)" }
                : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.15)" }}>
              {filter}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
            <GraduationCap className="w-12 h-12 mx-auto mb-4" style={{ color: "#AEAEB2" }} />
            <p className="font-semibold" style={{ color: "#636366" }}>No courses found for this specialty.</p>
            <button onClick={() => setActiveFilter("All")} className="mt-4 text-sm font-semibold" style={{ color: "#007AFF" }}>
              View all courses →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-16 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(0,122,255,0.1)", transform: "translate(30%, -30%)" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: "rgba(0,194,168,0.15)", border: "1px solid rgba(0,194,168,0.3)", color: "#2DD4BF" }}>
              <Crown className="w-3.5 h-3.5" />
              Aethex Pro — Unlock Everything
            </div>
            <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
              Get Unlimited CME Access
            </h3>
            <p className="mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
              Subscribe to Aethex Pro to access all premium CME courses, earn unlimited credits, and get a verified CME certificate recognised by NMC.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF", boxShadow: "0 4px 20px rgba(0,122,255,0.35)" }}>
                <Sparkles className="w-4 h-4" />
                View Pricing Plans
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Starting at ₹299/month · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
