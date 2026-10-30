import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Star, Calendar, MessageCircle, CheckCircle, ChevronRight, Search, Filter, Award, Briefcase, Clock, X } from "lucide-react";

interface Mentor {
  id: number;
  name: string;
  specialty: string;
  designation: string;
  hospital: string;
  experience: number;
  rating: number;
  reviews: number;
  slots: number;
  tags: string[];
  avatar: string;
  bio: string;
  verified: boolean;
  sessionRate: string;
}

// Update 69: the list used to hold invented doctors (with real hospital names, ratings and reviews). Mentors appear
// here only once real doctors have agreed to mentor.
const MENTORS: Mentor[] = [];

const SPECIALTIES = ["All", "Cardiology", "Neurosurgery", "Paediatrics", "Radiology", "Psychiatry", "Emergency Medicine"];

export default function Mentorship() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Mentor | null>(null);
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [showRequest, setShowRequest] = useState(false);
  const [goal, setGoal] = useState("");
  const [year, setYear] = useState("");

  const filtered = MENTORS.filter(m =>
    (filter === "All" || m.specialty === filter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  function handleRequest(mentor: Mentor) {
    setSelected(mentor);
    setShowRequest(true);
  }

  function submitRequest() {
    if (!selected) return;
    setRequested(s => { const n = new Set(s); n.add(selected.id); return n; });
    setShowRequest(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0B0F1A,#0d1020)", borderBottom: "1px solid rgba(0,200,100,0.15)", padding: "48px 0 32px" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ background: "rgba(0,200,100,0.15)", borderRadius: 12, padding: 10 }}>
              <Users size={28} style={{ color: "#00c864" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mentorship Matching</h1>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Connect with senior doctors · Free 1-on-1 sessions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.35)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or specialty..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
              style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", outline: "none" }} />
          </div>
        </div>

        {/* Specialty Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={filter === s
                ? { background: "#00c864", color: "#0B0F1A" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-lg font-semibold">Mentors are joining</p>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>We are inviting senior doctors and residents to mentor. If you'd like to mentor, write to <a href="mailto:support@aethex.in" style={{ color: "#00c864" }}>support@aethex.in</a>.</p>
          </div>
        )}
        {/* Mentor Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mentor, i) => (
            <motion.div key={mentor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start gap-3 mb-4">
                <img src={mentor.avatar} alt={mentor.name} className="w-14 h-14 rounded-full bg-gray-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">{mentor.name}</span>
                    {mentor.verified && <CheckCircle size={14} style={{ color: "#007AFF" }} />}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#00c864" }}>{mentor.specialty}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{mentor.designation}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{mentor.hospital}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1 text-xs">
                  <Star size={12} fill="#f59e0b" style={{ color: "#f59e0b" }} />
                  <span style={{ color: "#fcd34d" }}>{mentor.rating}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>({mentor.reviews})</span>
                </div>
                <div className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <Briefcase size={11} />{mentor.experience}y experience
                </div>
                <div className="text-xs flex items-center gap-1" style={{ color: "#22c55e" }}>
                  <Clock size={11} />{mentor.slots} slots open
                </div>
              </div>

              <p className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{mentor.bio}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {mentor.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,200,100,0.1)", color: "#4ade80", border: "1px solid rgba(0,200,100,0.2)" }}>
                    {t}
                  </span>
                ))}
              </div>

              <button onClick={() => handleRequest(mentor)} disabled={requested.has(mentor.id)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={requested.has(mentor.id)
                  ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
                  : { background: "#00c864", color: "#0B0F1A" }}>
                {requested.has(mentor.id) ? "✓ Request Sent" : "Request Session"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequest && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={e => e.target === e.currentTarget && setShowRequest(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-2xl p-6" style={{ background: "#161B2E" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">Request Mentorship Session</h3>
                <button onClick={() => setShowRequest(false)} style={{ color: "rgba(255,255,255,0.4)" }}><X size={20} /></button>
              </div>
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <img src={selected.avatar} alt={selected.name} className="w-12 h-12 rounded-full bg-gray-700" />
                <div>
                  <div className="font-semibold">{selected.name}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{selected.specialty} · {selected.hospital}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Your Year / Stage</label>
                  <select value={year} onChange={e => setYear(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }}>
                    <option value="">Select stage</option>
                    {["1st Year MBBS", "2nd Year MBBS", "3rd Year MBBS", "Intern", "NEET-PG aspirant", "Resident (PG1)", "Resident (PG2)", "Resident (PG3)", "Senior Resident"].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Your Goal / What you'd like help with</label>
                  <textarea value={goal} onChange={e => setGoal(e.target.value)}
                    placeholder="e.g. I want to pursue Cardiology and need guidance on NEET-PG preparation and choosing the right college..."
                    rows={4} className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
                </div>
                <button onClick={submitRequest} disabled={!year || !goal.trim()}
                  className="w-full py-3 rounded-xl font-semibold transition-all"
                  style={{ background: !year || !goal.trim() ? "rgba(0,200,100,0.3)" : "#00c864", color: "#0B0F1A" }}>
                  Send Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
