import { Link } from "wouter";
import { useSeo } from "@/hooks/use-seo";
import { PageHero } from "@/components/PageHero";
import { sitePortal } from "@/lib/portals";
import { mainUrl } from "@/lib/host";
import { motion } from "framer-motion";
import {
  Building2, GraduationCap, HeartPulse, ShieldCheck, Truck, Banknote, Hospital, Sparkles,
  Users, ClipboardList, Phone, Mail, ArrowRight, CheckCircle2,
  Package, Headphones, CreditCard, FileText, BookOpen, Stethoscope, Loader2,
  Building, MapPin, Award, ChevronRight, Search, ChevronDown, SlidersHorizontal,
} from "lucide-react";
import { useState, useMemo } from "react";
import { sendEnquiry } from "@/lib/store/api";
import { normPhone, validEmail } from "@/lib/store/rules";
import { medicalColleges, majorHospitals, ALL_STATES, type InstitutionTier } from "@/data/medicalColleges";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.5, ease: "easeOut" } }),
};

const benefits = [
  { icon: ShieldCheck, title: "Genuine products", desc: "From OMRON, 3M Littmann, HEINE, Rossmax, MDF, Dr Trust, Tynor and Accu-Chek, with the manufacturer's warranty.", color: "#6375E0" },
  { icon: ClipboardList, title: "One list, one quotation", desc: "Build a list for every ward or department and get one quotation for all of it.", color: "#2B7A6F" },
  { icon: Banknote, title: "Bank transfer or purchase order", desc: "Pay on quotations the way your institution pays; small orders can be cash on delivery.", color: "#C2610C" },
  { icon: Truck, title: "Delivery across India", desc: "To your hospital, college or department.", color: "#0E7490" },
  { icon: Sparkles, title: "Cadus for your doctors", desc: "Clinical answers with sources, dose checks and drug interactions.", color: "#2B7A6F" },
  { icon: GraduationCap, title: "Study Hub for your students", desc: "NEET-PG preparation, subject notes, mock tests and flashcards.", color: "#6375E0" },
];

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Premier:   { bg: "rgba(124,58,237,0.1)",  text: "#7C3AED" },
  Govt:      { bg: "rgba(0,122,255,0.1)",   text: "#007AFF" },
  Private:   { bg: "rgba(0,194,168,0.1)",   text: "#00A893" },
  Corporate: { bg: "rgba(255,149,0,0.1)",   text: "#CC7A00" },
};

const HOSPITAL_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  "Government Hospital": { bg: "rgba(0,122,255,0.1)",  text: "#007AFF" },
  "Corporate Hospital":  { bg: "rgba(255,149,0,0.1)",  text: "#CC7A00" },
};

const PAGE_SIZE = 24;

interface InstitutionHubProps {
  mode?: "colleges" | "hospitals";
}

export default function InstitutionHub({ mode }: InstitutionHubProps = {}) {
  useSeo({ title: "Hospitals and medical colleges directory | Aethex", description: "A directory of hospitals and medical colleges across India on Aethex.", path: "/institutions" });
  const [formData, setFormData] = useState({
    institutionName: "",
    type: "medical_college",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const lockedTab: "colleges" | "hospitals" | null = mode ?? null;

  const [activeTab, setActiveTab] = useState<"colleges" | "hospitals">(
    lockedTab ?? "colleges"
  );
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [stateOpen, setStateOpen] = useState(false);

  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const TYPE_LABEL: Record<string, string> = { medical_college: "Medical college", hospital: "Hospital", nursing_college: "Nursing college", dental_college: "Dental college", pharmacy_college: "Pharmacy college", clinic_chain: "Clinic chain", diagnostic_centre: "Diagnostic centre" };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (formData.institutionName.trim().length < 3) return setFormError("Please enter the name of your institution.");
    if (formData.contactName.trim().length < 2) return setFormError("Please enter the name of the person we should contact.");
    if (!validEmail(formData.email)) return setFormError("Please enter an email address we can reply to.");
    if (!normPhone(formData.phone)) return setFormError("Please enter a 10-digit Indian mobile number.");
    setSending(true);
    try {
      await sendEnquiry({
        kind: "general", item: `Institution: ${formData.institutionName.trim()} (${TYPE_LABEL[formData.type] ?? formData.type})`,
        name: formData.contactName.trim(), phone: formData.phone, email: formData.email.trim(), city: formData.city.trim() || undefined,
        message: formData.message.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const filteredColleges = useMemo(() => {
    const q = search.toLowerCase();
    return medicalColleges.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      const matchState = selectedState === "All States" || c.state === selectedState;
      const matchTier = selectedTier === "All" || c.tier === selectedTier;
      return matchSearch && matchState && matchTier;
    });
  }, [search, selectedState, selectedTier]);

  const filteredHospitals = useMemo(() => {
    const q = search.toLowerCase();
    return majorHospitals.filter(h => {
      const matchSearch = !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q);
      const matchState = selectedState === "All States" || h.state === selectedState;
      const matchTier = selectedTier === "All" || h.tier === selectedTier;
      return matchSearch && matchState && matchTier;
    });
  }, [search, selectedState, selectedTier]);

  const activeList = activeTab === "colleges" ? filteredColleges : filteredHospitals;
  const totalCount = activeList.length;
  const visibleItems = activeList.slice(0, page * PAGE_SIZE);
  const hasMore = visibleItems.length < totalCount;

  const resetFilters = () => {
    setSearch("");
    setSelectedState("All States");
    setSelectedTier("All");
    setPage(1);
  };

  const handleTabChange = (tab: "colleges" | "hospitals") => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FA" }}>

      <PageHero
        tag={mode === "colleges" ? "Directory" : mode === "hospitals" ? "Directory" : "Directory"}
        title={mode === "colleges" ? "Medical Colleges" : mode === "hospitals" ? "Major Hospitals" : "Colleges & Hospitals"}
        subtitle={mode === "colleges"
          ? "A directory of NMC-recognised medical colleges across India. Buying supplies for a college? Order in bulk with Aethex for Medical Colleges."
          : mode === "hospitals"
          ? "A directory of major hospitals across India. Buying supplies for a hospital? Order in bulk with Aethex for Hospitals."
          : "A directory of NMC-recognised medical colleges and major hospitals across India. Buying supplies? Order in bulk with Aethex for Hospitals or Aethex for Medical Colleges."}
        right={
          sitePortal() ? (
            <Link href="/" className="ax-btn teal"><ClipboardList size={16} /> Request a quotation</Link>
          ) : (
          <div className="flex flex-wrap gap-2">
            <Link href="/hospitals" className="ax-btn teal"><Hospital size={16} /> For hospitals</Link>
            <Link href="/medical-colleges" className="ax-btn teal"><GraduationCap size={16} /> For medical colleges</Link>
          </div>
          )
        }
        icon={mode === "colleges"
          ? <GraduationCap className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />
          : mode === "hospitals"
          ? <HeartPulse className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />
          : <Building2 className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />

      {/* ── Institution Browser ── */}
      <section id="institutions" className="py-20" style={{ background: "#F5F5F7" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>NMC Recognized</p>
            <h2 className="text-3xl font-black mb-3" style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}>
              {lockedTab === "colleges" ? "Medical Colleges across India"
                : lockedTab === "hospitals" ? "Major Hospitals across India"
                : "All Institutions across India"}
            </h2>
            <p className="text-base" style={{ color: "#636366" }}>
              {lockedTab === "colleges"
                ? `Browse ${medicalColleges.length} NMC-recognized medical colleges`
                : lockedTab === "hospitals"
                ? `Browse ${majorHospitals.length} major hospitals across India`
                : `Browse ${medicalColleges.length} NMC-recognized medical colleges and ${majorHospitals.length} major hospitals`}
            </p>
          </div>

          {/* Tab switcher — hide the other tab when locked via URL param */}
          {!lockedTab && (
            <div className="flex gap-2 justify-center mb-6">
              {(["colleges", "hospitals"] as const).map((tab) => (
                <button key={tab} onClick={() => handleTabChange(tab)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                  style={activeTab === tab
                    ? { background: "#1C1C1E", color: "#FFFFFF" }
                    : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                  {tab === "colleges" ? `Medical Colleges (${medicalColleges.length})` : `Hospitals (${majorHospitals.length})`}
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-4 py-2.5 rounded-xl"
              style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "#AEAEB2" }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={activeTab === "colleges" ? "Search college name or city…" : "Search hospital name or city…"}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: "#1C1C1E" }}
              />
            </div>

            {/* State filter */}
            <div className="relative">
              <button
                onClick={() => setStateOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E", minWidth: 160 }}>
                <MapPin className="w-4 h-4" style={{ color: "#007AFF" }} />
                <span className="flex-1 text-left truncate">{selectedState}</span>
                <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "#AEAEB2" }} />
              </button>
              {stateOpen && (
                <div className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-auto shadow-xl"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", width: 220, maxHeight: 300 }}>
                  {["All States", ...Array.from(ALL_STATES)].map(s => (
                    <button key={s} onClick={() => { setSelectedState(s); setStateOpen(false); setPage(1); }}
                      className="w-full text-left text-sm px-4 py-2.5 hover:bg-gray-50 transition-colors truncate"
                      style={{ color: selectedState === s ? "#007AFF" : "#1C1C1E", fontWeight: selectedState === s ? 600 : 400 }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tier filter */}
            <div className="flex gap-2">
              {(activeTab === "colleges"
                ? ["All", "Premier", "Govt", "Private"]
                : ["All", "Premier", "Govt", "Corporate"]
              ).map(tier => (
                <button key={tier} onClick={() => { setSelectedTier(tier); setPage(1); }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={selectedTier === tier
                    ? { background: "#1C1C1E", color: "#FFFFFF" }
                    : { background: "#FFFFFF", color: "#636366", border: "1px solid rgba(60,60,67,0.12)" }}>
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "#AEAEB2" }}>
              Showing <span className="font-semibold" style={{ color: "#1C1C1E" }}>{Math.min(visibleItems.length, totalCount)}</span> of{" "}
              <span className="font-semibold" style={{ color: "#1C1C1E" }}>{totalCount}</span>{" "}
              {activeTab === "colleges" ? "colleges" : "hospitals"}
              {search || selectedState !== "All States" || selectedTier !== "All" ? " (filtered)" : ""}
            </p>
            {(search || selectedState !== "All States" || selectedTier !== "All") && (
              <button onClick={resetFilters}
                className="text-xs font-semibold transition-colors hover:opacity-70"
                style={{ color: "#007AFF" }}>
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {visibleItems.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: "#AEAEB2" }} />
              <p className="font-semibold mb-1" style={{ color: "#1C1C1E" }}>No results found</p>
              <p className="text-sm" style={{ color: "#AEAEB2" }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleItems.map((inst, i) => {
                const isHospital = activeTab === "hospitals";
                const tier = (inst as any).tier as string;
                const tc = TIER_COLORS[tier] ?? TIER_COLORS.Private;
                const hospType = (inst as any).type as string | undefined;
                const htc = hospType ? (HOSPITAL_TYPE_COLORS[hospType] ?? HOSPITAL_TYPE_COLORS["Corporate Hospital"]) : tc;
                return (
                  <motion.div key={`${inst.name}-${inst.city}-${i}`}
                    initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 24} variants={fadeUp}
                    className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.08)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isHospital ? "rgba(255,59,48,0.08)" : "rgba(0,122,255,0.08)" }}>
                      {isHospital
                        ? <HeartPulse className="w-5 h-5" style={{ color: "#FF3B30" }} />
                        : <GraduationCap className="w-5 h-5" style={{ color: "#007AFF" }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs leading-snug line-clamp-2" style={{ color: "#1C1C1E" }}>{inst.name}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px]" style={{ color: "#AEAEB2" }}>{inst.city}</span>
                        {isHospital && hospType ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: htc.bg, color: htc.text }}>
                            {hospType === "Government Hospital" ? "Govt" : "Corporate"}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: tc.bg, color: tc.text }}>{tier}</span>
                        )}
                        {isHospital && tier !== "Corporate" && tier !== "Govt" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: TIER_COLORS[tier]?.bg ?? "rgba(124,58,237,0.1)", color: TIER_COLORS[tier]?.text ?? "#7C3AED" }}>
                            {tier}
                          </span>
                        )}
                      </div>
                      {(inst as any).state && (
                        <div className="text-[11px] mt-0.5" style={{ color: "#737378" }}>{(inst as any).state}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="text-center mt-8">
              <button onClick={() => setPage(p => p + 1)}
                className="px-8 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "#1C1C1E", color: "#FFFFFF" }}>
                Load more ({totalCount - visibleItems.length} remaining)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Bulk buying ── */}
      <section id="plans" className="py-20" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#737378" }}>Supplies</p>
            <h2 className="text-3xl font-black" style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}>
              Order for your institution, in bulk
            </h2>
            <p className="text-base mt-3" style={{ color: "#636366" }}>Pick products and quantities, send the list, and we'll email a quotation.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { href: "/hospitals", icon: Hospital, tag: "Aethex for Hospitals", title: "Supplies for every ward and department", text: "BP monitors, oximeters, thermometers, diagnostic sets, nebulizers, diabetes care, supports and rehab aids.", color: "#4B5BC4", bg: "linear-gradient(120deg,#e9edfb,#f6f7fd)" },
              { href: "/medical-colleges", icon: GraduationCap, tag: "Aethex for Medical Colleges", title: "Stethoscopes, skills labs and textbooks", text: "For a whole batch or department: stethoscopes for students, instruments for skills labs and books for the library.", color: "#2B7A6F", bg: "linear-gradient(120deg,#e7f3f0,#f4faf8)" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="block rounded-2xl p-7 transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ background: c.bg, border: "1px solid rgba(60,60,67,0.08)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "#FFFFFF" }}>
                  <c.icon className="w-6 h-6" style={{ color: c.color }} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: c.color }}>{c.tag}</div>
                <div className="font-bold text-xl mb-2" style={{ color: "#1C1C1E" }}>{c.title}</div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#636366" }}>{c.text}</p>
                <span className="inline-flex items-center gap-2 font-semibold text-sm" style={{ color: "#1C1C1E" }}>Build a list <ArrowRight className="w-4 h-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20" style={{ background: "#F5F5F7" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#737378" }}>How it works</p>
            <h2 className="text-3xl font-black" style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}>
              From a list to a delivery in 3 steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", icon: ClipboardList, title: "Build your list", desc: "On Aethex for Hospitals or Aethex for Medical Colleges, pick products and the quantities you need.", color: "#4B5BC4" },
              { step: "02", icon: Mail, title: "Get a quotation", desc: "Send the list with your institution's details. We email your prices for those quantities, with delivery, usually within one business day.", color: "#2B7A6F" },
              { step: "03", icon: Package, title: "Confirm and receive", desc: "Accept the quotation, pay by bank transfer or purchase order, and we deliver across India.", color: "#B45309" },
            ].map((s, i) => (
              <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${s.color}15` }}>
                  <s.icon className="w-7 h-7" style={{ color: s.color }} />
                </div>
                <div className="text-xs font-black mb-2" style={{ color: s.color, letterSpacing: "0.1em" }}>{s.step}</div>
                <div className="font-bold text-base mb-2" style={{ color: "#1C1C1E" }}>{s.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: "#636366" }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry Form ── */}
      <section id="inquiry" className="py-20" style={{ background: "#FFFFFF" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#737378" }}>Get in touch</p>
            <h2 className="text-3xl font-black mb-3" style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}>
              Talk to us
            </h2>
            <p className="text-base" style={{ color: "#636366" }}>Questions about supplies for your institution, or about Cadus and the Study Hub for your doctors and students? Write to us. To order, <Link href="/hospitals" className="underline">build a list</Link> instead.</p>
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-8 rounded-2xl"
              style={{ background: "rgba(0,194,168,0.06)", border: "2px solid rgba(0,194,168,0.2)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(0,194,168,0.15)" }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: "#00C2A8" }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#1C1C1E" }}>Message sent</h3>
              <p className="text-sm" style={{ color: "#636366" }}>
                Thank you. We'll reply to <strong>{formData.email}</strong> or call you, usually within one business day.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Institution Name *</label>
                  <input required value={formData.institutionName}
                    onChange={e => setFormData(p => ({ ...p, institutionName: e.target.value }))}
                    placeholder="e.g. AIIMS New Delhi"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Institution Type *</label>
                  <select required value={formData.type}
                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none appearance-none"
                    style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }}>
                    <option value="medical_college">Medical College</option>
                    <option value="hospital">Hospital</option>
                    <option value="nursing_college">Nursing College</option>
                    <option value="dental_college">Dental College</option>
                    <option value="pharmacy_college">Pharmacy College</option>
                    <option value="clinic_chain">Clinic Chain</option>
                    <option value="diagnostic_centre">Diagnostic Centre</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Contact Person *</label>
                  <input required value={formData.contactName}
                    onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))}
                    placeholder="Dr. / Prof. / Mr."
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>City *</label>
                  <input required value={formData.city}
                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                    placeholder="City, State"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Official Email *</label>
                  <input required type="email" value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="procurement@hospital.in"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Phone Number *</label>
                  <input required type="tel" value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#636366" }}>Requirements / Message</label>
                <textarea value={formData.message} rows={4}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  placeholder="Tell us about your procurement needs, expected order volumes, and any specific products required..."
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ background: "#F5F5F7", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
              </div>

              {formError && <p className="ax-form-err" role="alert">{formError}</p>}
              <button type="submit" disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#2B7A6F", color: "#FFFFFF" }}>
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send message <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-center text-xs" style={{ color: "#AEAEB2" }}>
                By submitting, you agree to our{" "}
                <a href={mainUrl("/privacy-policy")} className="underline">Privacy Policy</a>.
                We usually reply within one business day.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Built for Institutions (dark) ── */}
      <section className="py-20" style={{ background: "radial-gradient(900px 420px at 85% 0%, rgba(43,122,111,0.28), transparent 70%), #0B1220" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#7FE0CF" }}>Why Aethex</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "#FFFFFF", letterSpacing: "-0.5px" }}>
              Built for Institutions
            </h2>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.72)" }}>
              For medical colleges and hospitals across India
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="p-6 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${b.color}18`, border: `1px solid ${b.color}30` }}>
                  <b.icon className="w-5 h-5" style={{ color: b.color }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#FFFFFF" }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
