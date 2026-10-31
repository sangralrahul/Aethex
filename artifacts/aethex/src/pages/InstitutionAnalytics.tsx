import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, AlertTriangle, Download, TrendingUp, Activity, CheckCircle, Clock, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const MODULES = [
  { name: "Cardiac Pharm", views: 4200, completion: 78 },
  { name: "ECG Basics", views: 3800, completion: 65 },
  { name: "Renal Physiol", views: 3100, completion: 72 },
  { name: "Antibiotics", views: 2700, completion: 58 },
  { name: "Neuro Anatomy", views: 2400, completion: 61 },
  { name: "Endocrinology", views: 2100, completion: 54 },
  { name: "GI Pathology", views: 1900, completion: 69 },
];

const WEEKLY = [
  { day: "Mon", active: 142 }, { day: "Tue", active: 168 }, { day: "Wed", active: 189 },
  { day: "Thu", active: 201 }, { day: "Fri", active: 175 }, { day: "Sat", active: 98 }, { day: "Sun", active: 76 },
];

const STATUS_DATA = [
  { name: "Active", value: 68, color: "#22c55e" },
  { name: "At Risk", value: 22, color: "#f59e0b" },
  { name: "Inactive", value: 10, color: "#ef4444" },
];

interface Student {
  id: number; name: string; year: string; lastActive: string;
  status: "active" | "at-risk" | "inactive";
  completionRate: number; points: number; modules: number;
}

const STUDENTS: Student[] = [
  { id: 1, name: "Riya Sharma", year: "MBBS Y3", lastActive: "Today", status: "active", completionRate: 89, points: 4200, modules: 12 },
  { id: 2, name: "Arjun Nair", year: "MBBS Y2", lastActive: "Today", status: "active", completionRate: 74, points: 3100, modules: 9 },
  { id: 3, name: "Sneha Patel", year: "Intern", lastActive: "Yesterday", status: "active", completionRate: 91, points: 5600, modules: 15 },
  { id: 4, name: "Karthik M", year: "MBBS Y3", lastActive: "3 days ago", status: "at-risk", completionRate: 42, points: 1200, modules: 4 },
  { id: 5, name: "Priya Reddy", year: "MBBS Y1", lastActive: "5 days ago", status: "at-risk", completionRate: 28, points: 800, modules: 3 },
  { id: 6, name: "Aditya Singh", year: "MBBS Y2", lastActive: "8 days ago", status: "inactive", completionRate: 15, points: 300, modules: 1 },
  { id: 7, name: "Meera Iyer", year: "Intern", lastActive: "Today", status: "active", completionRate: 83, points: 4800, modules: 13 },
  { id: 8, name: "Rohan Gupta", year: "MBBS Y3", lastActive: "10 days ago", status: "inactive", completionRate: 8, points: 200, modules: 0 },
  { id: 9, name: "Anjali Kumar", year: "MBBS Y1", lastActive: "2 days ago", status: "at-risk", completionRate: 38, points: 950, modules: 2 },
  { id: 10, name: "Vivek Pillai", year: "MBBS Y2", lastActive: "Today", status: "active", completionRate: 67, points: 2900, modules: 8 },
];

const HEATMAP_DATA = Array.from({ length: 7 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week, day,
    value: Math.floor(Math.random() * 100),
  }))
).flat();

const statusStyle = (s: Student["status"]) =>
  s === "active" ? { bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Active" }
    : s === "at-risk" ? { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "At Risk" }
      : { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Inactive" };

export default function InstitutionAnalytics() {
  const [filter, setFilter] = useState<"all" | "active" | "at-risk" | "inactive">("all");

  const filtered = STUDENTS.filter(s => filter === "all" || s.status === filter);
  const inactive = STUDENTS.filter(s => s.status === "inactive").length;
  const atRisk = STUDENTS.filter(s => s.status === "at-risk").length;

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0B0F1A,#0d0f1a)", borderBottom: "1px solid rgba(0,122,255,0.15)", padding: "48px 0 32px" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div style={{ background: "rgba(0,122,255,0.15)", borderRadius: 12, padding: 10 }}>
              <BarChart3 size={28} style={{ color: "#007AFF" }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Institution Analytics</h1>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>AIIMS Delhi · Batch 2023-24 · {STUDENTS.length} students</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
                <Download size={14} /> Export CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "#007AFF", color: "#fff" }}>
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Alert Banners */}
        {inactive > 0 && (
          <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertTriangle size={18} style={{ color: "#ef4444" }} />
            <span style={{ color: "#fca5a5" }}>
              <strong>{inactive} students</strong> have been inactive for 7+ days. Consider sending them a nudge.
            </span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Students", val: STUDENTS.length, sub: "Enrolled", color: "#007AFF", icon: Users },
            { label: "Avg Completion", val: "62%", sub: "vs 58% national avg", color: "#22c55e", icon: TrendingUp },
            { label: "Active Today", val: WEEKLY[6].active, sub: "Logged in today", color: "#8B5CF6", icon: Activity },
            { label: "Avg Points", val: "2,275", sub: "per student this week", color: "#f59e0b", icon: CheckCircle },
          ].map(({ label, val, sub, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} style={{ color }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color }}>{val}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Activity */}
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} style={{ color: "#007AFF" }} /> Weekly Active Students
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={WEEKLY}>
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#161B2E", border: "1px solid rgba(0,122,255,0.3)", borderRadius: 8, color: "#fff" }} />
                <Line type="monotone" dataKey="active" stroke="#007AFF" strokeWidth={2.5} dot={{ fill: "#007AFF", r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie */}
          <div className="rounded-2xl p-5" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-semibold mb-4">Student Status</div>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={STATUS_DATA} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                  {STATUS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {STATUS_DATA.map(({ name, value, color }) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>
                  <span className="ml-auto font-semibold" style={{ color }}>{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module Engagement */}
        <div className="rounded-2xl p-5" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={16} style={{ color: "#8B5CF6" }} /> Module Engagement
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MODULES} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#161B2E", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="views" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Student Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#161B2E", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="font-semibold">Per-Student Activity</div>
            <div className="ml-auto flex flex-wrap gap-2">
              {(["all", "active", "at-risk", "inactive"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all capitalize"
                  style={filter === f
                    ? { background: f === "active" ? "#22c55e" : f === "at-risk" ? "#f59e0b" : f === "inactive" ? "#ef4444" : "#007AFF", color: "#fff" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                  {f === "all" ? "All" : f === "at-risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {filtered.map((s, i) => {
              const st = statusStyle(s.status);
              return (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5">
                  <div className="font-medium text-sm w-32 flex-shrink-0">{s.name}</div>
                  <div className="text-xs w-20 flex-shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>{s.year}</div>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.completionRate}%`, background: st.color }} />
                    </div>
                  </div>
                  <div className="text-xs w-10 text-right" style={{ color: st.color }}>{s.completionRate}%</div>
                  <div className="text-xs w-16 text-right" style={{ color: "rgba(255,255,255,0.5)" }}>{s.points.toLocaleString()}pts</div>
                  <div className="w-24 text-right">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                      {s.status === "inactive" ? <><XCircle size={10} className="inline mr-0.5" /></> : null}
                      {st.label}
                    </span>
                  </div>
                  <div className="text-xs w-24 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Clock size={10} className="inline mr-1" />{s.lastActive}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
