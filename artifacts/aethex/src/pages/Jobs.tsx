import { useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { MapPin, Clock, Briefcase, IndianRupee, Search, Filter, MessageCircle, Mail, Building2, ChevronDown, Star, CheckCircle } from "lucide-react";

interface Job {
  id: number;
  role: string;
  hospital: string;
  location: string;
  city: string;
  specialty: string;
  experience: string;
  type: "Full-Time" | "Part-Time" | "Locum" | "Internship";
  salaryMin: number;
  salaryMax: number;
  posted: string;
  contact: string;
  email: string;
  whatsapp: string;
  urgent: boolean;
  description: string;
  requirements: string[];
}

const JOBS: Job[] = [
  { id: 1, role: "Senior Consultant Cardiologist", hospital: "Apollo Hospitals", location: "Indraprastha, New Delhi", city: "Delhi", specialty: "Cardiology", experience: "10+ years", type: "Full-Time", salaryMin: 250000, salaryMax: 450000, posted: "2 days ago", contact: "Dr Priya Singh", email: "careers@apollohospitals.com", whatsapp: "+919810000001", urgent: true, description: "Apollo Hospitals is seeking an experienced Cardiologist to lead our cardiac catheterisation programme. The ideal candidate will have significant experience in interventional cardiology.", requirements: ["DM Cardiology / DNB Cardiology", "10+ years post-DM experience", "Fellowship in Interventional Cardiology preferred", "CTVS exposure desirable"] },
  { id: 2, role: "Emergency Medicine Physician", hospital: "Fortis Memorial Research Institute", location: "Gurugram, Haryana", city: "Delhi", specialty: "Emergency Medicine", experience: "3–8 years", type: "Full-Time", salaryMin: 120000, salaryMax: 200000, posted: "5 days ago", contact: "HR Team", email: "hr@fortishealthcare.com", whatsapp: "+919810000002", urgent: true, description: "Join our 24×7 emergency department serving the NCR region. Position involves acute care, trauma management and critical care initiation.", requirements: ["MD / DNB Emergency Medicine", "ATLS certification preferred", "Experience in trauma management", "ACLS certified"] },
  { id: 3, role: "Paediatric Resident (Senior Resident)", hospital: "AIIMS New Delhi", location: "Ansari Nagar, New Delhi", city: "Delhi", specialty: "Paediatrics", experience: "Post-MD / Post-DNB", type: "Full-Time", salaryMin: 67700, salaryMax: 68500, posted: "1 week ago", contact: "Academic Section", email: "academics@aiims.edu", whatsapp: "+919810000003", urgent: false, description: "Senior Resident positions available in the Department of Paediatrics at AIIMS New Delhi. Fixed government pay scale.", requirements: ["MD Paediatrics / DNB Paediatrics", "Not more than 3 years since completion of degree", "Indian nationality required"] },
  { id: 4, role: "Orthopaedic Surgeon", hospital: "Kokilaben Dhirubhai Ambani Hospital", location: "Andheri West, Mumbai", city: "Mumbai", specialty: "Orthopaedics", experience: "5–12 years", type: "Full-Time", salaryMin: 180000, salaryMax: 320000, posted: "3 days ago", contact: "Dr Rohit Mehta", email: "talent@kdah.in", whatsapp: "+919820000001", urgent: false, description: "KDAH is expanding its orthopaedic programme and requires a Joint Replacement & Sports Medicine specialist to join our team.", requirements: ["MS Orthopaedics / DNB Orthopaedics", "Fellowship in Joint Replacement preferred", "Experience in arthroscopic procedures", "5+ years post-MS experience"] },
  { id: 5, role: "Dermatologist (Part-Time OPD)", hospital: "Skin & You Clinic", location: "Bandra West, Mumbai", city: "Mumbai", specialty: "Dermatology", experience: "2–5 years", type: "Part-Time", salaryMin: 60000, salaryMax: 90000, posted: "1 day ago", contact: "Dr Sneha Patel", email: "info@skinandyou.in", whatsapp: "+919820000002", urgent: false, description: "Busy cosmetic and clinical dermatology clinic in Bandra seeking a qualified dermatologist for OPD sessions (Mon–Sat, 10am–2pm).", requirements: ["MD Dermatology / DVL", "Cosmetology training preferred", "Laser and PRP experience a plus"] },
  { id: 6, role: "Anaesthesiologist", hospital: "Narayana Health", location: "Bommasandra, Bengaluru", city: "Bengaluru", specialty: "Anaesthesia", experience: "4–10 years", type: "Full-Time", salaryMin: 140000, salaryMax: 240000, posted: "4 days ago", contact: "NH Talent Acquisition", email: "careers@narayanahealth.org", whatsapp: "+919900000001", urgent: true, description: "Narayana Health City requires experienced anaesthesiologists for cardiac, neuro and general surgical cases in our 3000-bed facility.", requirements: ["MD Anaesthesiology / DNB Anaesthesia", "Cardiac anaesthesia experience preferred", "OT experience in tertiary care hospital"] },
  { id: 7, role: "Neurologist", hospital: "Manipal Hospitals", location: "HAL Airport Road, Bengaluru", city: "Bengaluru", specialty: "Neurology", experience: "8+ years", type: "Full-Time", salaryMin: 200000, salaryMax: 380000, posted: "6 days ago", contact: "Dr Ashwin Kumar", email: "careers@manipalhospitals.com", whatsapp: "+919900000002", urgent: false, description: "Manipal Hospitals is looking for a Senior Neurologist to establish and lead our comprehensive stroke and epilepsy programme.", requirements: ["DM Neurology / DNB Neurology", "Stroke fellowship preferred", "EEG and EMG interpretation skills", "8+ years post-DM experience"] },
  { id: 8, role: "Medical Officer (MO)", hospital: "Apollo Clinic", location: "T Nagar, Chennai", city: "Chennai", specialty: "General Medicine", experience: "1–4 years", type: "Full-Time", salaryMin: 55000, salaryMax: 80000, posted: "2 days ago", contact: "Clinic Manager", email: "hr-tn@apolloclinic.com", whatsapp: "+919840000001", urgent: false, description: "Apollo Clinic Chennai requires a Medical Officer for OPD and minor procedure management at our busy T. Nagar branch.", requirements: ["MBBS with 1+ years clinical experience", "Diploma in any clinical subject preferred", "Good communication skills"] },
  { id: 9, role: "Gastroenterologist", hospital: "SIMS Hospital", location: "Vadapalani, Chennai", city: "Chennai", specialty: "Gastroenterology", experience: "5–10 years", type: "Full-Time", salaryMin: 160000, salaryMax: 280000, posted: "1 week ago", contact: "Dr Senthil Raj", email: "careers@simshospital.com", whatsapp: "+919840000002", urgent: false, description: "SIMS Hospital requires a Gastroenterologist experienced in therapeutic endoscopy for our GI department.", requirements: ["DM Gastroenterology / DNB Gastroenterology", "ERCP and EUS experience mandatory", "5+ years post-DM experience"] },
  { id: 10, role: "Psychiatrist (Locum)", hospital: "Vandrevala Foundation", location: "Banjara Hills, Hyderabad", city: "Hyderabad", specialty: "Psychiatry", experience: "3+ years", type: "Locum", salaryMin: 80000, salaryMax: 120000, posted: "3 days ago", contact: "Operations Team", email: "hr@vandrevalafoundation.com", whatsapp: "+919700000001", urgent: true, description: "Locum psychiatrist required for 3-month engagement at our mental health facility in Hyderabad. Weekend availability preferred.", requirements: ["MD Psychiatry / DNB Psychiatry", "Experience in addiction medicine preferred", "Willing to work flexible shifts"] },
  { id: 11, role: "Gynaecologist & Obstetrician", hospital: "Rainbow Hospitals", location: "Banjara Hills, Hyderabad", city: "Hyderabad", specialty: "Gynaecology & Obs", experience: "6–15 years", type: "Full-Time", salaryMin: 160000, salaryMax: 290000, posted: "5 days ago", contact: "Dr Mamatha Reddy", email: "careers@rainbowhospitals.in", whatsapp: "+919700000002", urgent: false, description: "Rainbow Hospitals is a premier women & children hospital. We require a skilled Gynaecologist for high-risk obstetrics and laparoscopic gynaecological procedures.", requirements: ["MS Obstetrics & Gynaecology / DNB OBG", "Laparoscopy skills mandatory", "High-risk obstetrics experience"] },
  { id: 12, role: "Radiologist (Tele-radiology)", hospital: "Teleradiology Solutions", location: "Remote (Pan-India)", city: "Delhi", specialty: "Radiology", experience: "3–8 years", type: "Part-Time", salaryMin: 100000, salaryMax: 180000, posted: "1 day ago", contact: "Recruitment Team", email: "join@teleradiology.in", whatsapp: "+919810000010", urgent: false, description: "India's largest teleradiology company is hiring radiologists for remote reporting. Flexible hours, work from home.", requirements: ["MD Radiodiagnosis / DNB Radiodiagnosis", "Experience in CT and MRI reporting", "Reliable high-speed internet connection", "PACS experience"] },
  { id: 13, role: "Pulmonologist", hospital: "Yashoda Hospitals", location: "Secunderabad, Hyderabad", city: "Hyderabad", specialty: "Pulmonology", experience: "5–12 years", type: "Full-Time", salaryMin: 150000, salaryMax: 250000, posted: "4 days ago", contact: "Dr Suresh Rao", email: "careers@yashodahospitals.com", whatsapp: "+919700000003", urgent: false, description: "Seeking a Pulmonologist with bronchoscopy skills and ICU experience for our Respiratory Medicine department.", requirements: ["DM Pulmonary Medicine / DNB Pulmonology", "Bronchoscopy skills mandatory", "Sleep medicine experience preferred"] },
  { id: 14, role: "MBBS Intern (Rural Health)", hospital: "NRHM — Rajasthan", location: "Barmer, Rajasthan", city: "Delhi", specialty: "General Medicine", experience: "Internship", type: "Internship", salaryMin: 15000, salaryMax: 22000, posted: "2 weeks ago", contact: "CMHO Office", email: "nrhm.raj@gov.in", whatsapp: "+919810000020", urgent: false, description: "Government-sponsored rural internship programme under NRHM. Stipend provided. Certificate issued by Rajasthan government.", requirements: ["MBBS final year or completion", "Willing to work in rural/tribal area", "Own transport preferred"] },
  { id: 15, role: "Nephrology Consultant", hospital: "Medanta — The Medicity", location: "Sector 38, Gurugram", city: "Delhi", specialty: "Nephrology", experience: "8+ years", type: "Full-Time", salaryMin: 220000, salaryMax: 400000, posted: "1 week ago", contact: "Dr Vijay Kumar", email: "careers@medanta.org", whatsapp: "+919810000030", urgent: true, description: "Medanta requires a Nephrologist for our transplant-active renal unit. Dialysis setup available. CAPD programme to be expanded.", requirements: ["DM Nephrology / DNB Nephrology", "Renal transplant experience preferred", "Dialysis programme management experience"] },
  { id: 16, role: "Oncologist (Medical)", hospital: "Tata Memorial Hospital", location: "Parel, Mumbai", city: "Mumbai", specialty: "Oncology", experience: "Post-DM", type: "Full-Time", salaryMin: 70000, salaryMax: 90000, posted: "3 days ago", contact: "Academic Cell", email: "academic@tmc.gov.in", whatsapp: "+919820000010", urgent: false, description: "Tata Memorial Centre is India's premier cancer institute. Positions for medical oncology trainees and consultants available on rolling basis.", requirements: ["DM Medical Oncology / Fellowship in Oncology", "Research aptitude preferred", "Interest in clinical trials"] },
  { id: 17, role: "ENT Surgeon", hospital: "Columbia Asia Hospital", location: "Whitefield, Bengaluru", city: "Bengaluru", specialty: "ENT", experience: "4–10 years", type: "Full-Time", salaryMin: 130000, salaryMax: 220000, posted: "6 days ago", contact: "HR Department", email: "hr.whitefield@columbiaasia.com", whatsapp: "+919900000010", urgent: false, description: "Busy ENT OPD and surgical practice. Seeking an ENT Surgeon with endoscopic sinus surgery and cochlear implant programme experience.", requirements: ["MS ENT / DNB ENT", "Endoscopic sinus surgery skills", "Audiology knowledge preferred"] },
  { id: 18, role: "Ophthalmologist", hospital: "Aravind Eye Hospital", location: "Madurai, Tamil Nadu", city: "Chennai", specialty: "Ophthalmology", experience: "2–7 years", type: "Full-Time", salaryMin: 80000, salaryMax: 140000, posted: "4 days ago", contact: "Dr Lalitha", email: "careers@aravind.org", whatsapp: "+919840000010", urgent: false, description: "Join the world's largest eye care provider. Aravind Eye Hospital is seeking Ophthalmologists for cataract surgery and retina services.", requirements: ["MS Ophthalmology / DNB Ophthalmology", "Phaco surgery skills preferred", "Willingness to work in service model"] },
  { id: 19, role: "Sports Medicine Physician", hospital: "ESTER — Sports Medical Centre", location: "Lajpat Nagar, Delhi", city: "Delhi", specialty: "Sports Medicine", experience: "3–8 years", type: "Part-Time", salaryMin: 70000, salaryMax: 120000, posted: "5 days ago", contact: "Dr Arjun Kapoor", email: "info@estermedicine.com", whatsapp: "+919810000040", urgent: false, description: "ESTER Sports Medicine is looking for a Sports Medicine Physician with musculoskeletal ultrasound skills for our elite athlete clinic.", requirements: ["MBBS + Fellowship in Sports Medicine", "MSK ultrasound guided injections", "Experience with national/state level athletes preferred"] },
  { id: 20, role: "Pathologist", hospital: "SRL Diagnostics", location: "Lower Parel, Mumbai", city: "Mumbai", specialty: "Pathology", experience: "3–8 years", type: "Full-Time", salaryMin: 90000, salaryMax: 160000, posted: "2 days ago", contact: "Lab Director", email: "careers@srl.in", whatsapp: "+919820000020", urgent: false, description: "SRL Diagnostics requires a Pathologist for histopathology reporting at our CAP-accredited reference laboratory.", requirements: ["MD Pathology / DNB Pathology", "Histopathology reporting experience mandatory", "Cytology skills preferred", "Digital pathology exposure a plus"] },
];

const specialties = ["All Specialties", ...Array.from(new Set(JOBS.map(j => j.specialty))).sort()];
const cities = ["All Cities", "Delhi", "Mumbai", "Bengaluru", "Chennai", "Hyderabad"];
const types = ["All Types", "Full-Time", "Part-Time", "Locum", "Internship"];

function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: "#FFFFFF", border: `1px solid ${job.urgent ? "rgba(239,68,68,0.25)" : "rgba(60,60,67,0.12)"}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.15)" }}>
            <Building2 className="w-6 h-6" style={{ color: "#007AFF" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold" style={{ color: "#1C1C1E" }}>{job.role}</h3>
                  {job.urgent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>URGENT</span>
                  )}
                </div>
                <p className="text-sm font-medium mt-0.5" style={{ color: "#007AFF" }}>{job.hospital}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: job.type === "Full-Time" ? "rgba(0,194,168,0.1)" : job.type === "Locum" ? "rgba(245,158,11,0.1)" : "rgba(99,99,102,0.1)", color: job.type === "Full-Time" ? "#00A893" : job.type === "Locum" ? "#D97706" : "#636366" }}>
                {job.type}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              <span className="flex items-center gap-1 text-xs" style={{ color: "#636366" }}>
                <MapPin className="w-3.5 h-3.5" />{job.location}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "#636366" }}>
                <Star className="w-3.5 h-3.5" />{job.experience}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#1C1C1E" }}>
                <IndianRupee className="w-3.5 h-3.5" />
                {(job.salaryMin / 1000).toFixed(0)}k – {(job.salaryMax / 1000).toFixed(0)}k/mo
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "#AEAEB2" }}>
                <Clock className="w-3.5 h-3.5" />{job.posted}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{job.specialty}</span>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(60,60,67,0.08)" }}>
            <p className="text-sm mb-3" style={{ color: "#636366" }}>{job.description}</p>
            <p className="text-xs font-semibold mb-2" style={{ color: "#1C1C1E" }}>Requirements</p>
            <ul className="space-y-1">
              {job.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#636366" }}>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#00C2A8" }} />{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setExpanded(e => !e)} className="text-xs font-medium flex items-center gap-1" style={{ color: "#007AFF" }}>
            {expanded ? "Show less" : "View details"}
            {expanded ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <div className="flex gap-2">
            <a
              href={`mailto:${job.email}?subject=Application for ${encodeURIComponent(job.role)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF", border: "1px solid rgba(0,122,255,0.2)" }}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
            <a
              href={`https://wa.me/${job.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in the ${job.role} position at ${job.hospital}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(37,211,102,0.1)", color: "#16A34A", border: "1px solid rgba(37,211,102,0.25)" }}
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [city, setCity] = useState("All Cities");
  const [type, setType] = useState("All Types");
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() =>
    JOBS.filter(j =>
      (specialty === "All Specialties" || j.specialty === specialty) &&
      (city === "All Cities" || j.city === city) &&
      (type === "All Types" || j.type === type) &&
      (search === "" || j.role.toLowerCase().includes(search.toLowerCase()) || j.hospital.toLowerCase().includes(search.toLowerCase()) || j.specialty.toLowerCase().includes(search.toLowerCase()))
    ), [search, specialty, city, type]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Careers"
        title="Medical Jobs Board"
        subtitle="Curated hospital & clinic opportunities across India — full-time, part-time, locum & internships"
        icon={<Briefcase className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search + Filter */}
        <div className="mb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by role, hospital or specialty…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E" }}
              />
            </div>
            <button onClick={() => setFilterOpen(f => !f)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#636366" }}>
              <Filter className="w-4 h-4" />Filters
            </button>
          </div>
          {filterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)" }}>
              {([["Specialty", specialty, setSpecialty, specialties], ["City", city, setCity, cities], ["Type", type, setType, types]] as [string, string, (v: string) => void, string[]][]).map(([label, val, setter, opts]) => (
                <div key={label}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#636366" }}>{label}</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F3EE", border: "1px solid rgba(60,60,67,0.1)", color: "#1C1C1E" }}
                    value={val}
                    onChange={e => setter(e.target.value)}
                  >
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm mb-4" style={{ color: "#636366" }}>
          Showing <strong style={{ color: "#1C1C1E" }}>{filtered.length}</strong> jobs
          {search && ` for "${search}"`}
        </p>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
              <p className="text-sm font-semibold" style={{ color: "#636366" }}>No jobs match your filters</p>
              <button onClick={() => { setSearch(""); setSpecialty("All Specialties"); setCity("All Cities"); setType("All Types"); }} className="mt-3 text-xs font-semibold" style={{ color: "#007AFF" }}>Clear all filters</button>
            </div>
          ) : (
            filtered.map(job => <JobCard key={job.id} job={job} />)
          )}
        </div>

        {/* Post a job CTA */}
        <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.08), rgba(0,194,168,0.08))", border: "1px solid rgba(0,122,255,0.15)" }}>
          <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: "#007AFF" }} />
          <h3 className="text-base font-bold mb-1" style={{ color: "#1C1C1E" }}>Post a Job</h3>
          <p className="text-sm mb-4" style={{ color: "#636366" }}>Reach 50,000+ verified Indian doctors and medical professionals</p>
          <a href={`mailto:jobs@aethex.in?subject=Post a Job Listing`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#007AFF", color: "#FFFFFF" }}>
            <Mail className="w-4 h-4" /> Contact Us to Post
          </a>
        </div>
      </div>
    </div>
  );
}
