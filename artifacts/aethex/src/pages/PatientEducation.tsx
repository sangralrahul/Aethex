import { useState } from "react";
import { Link } from "wouter";
import { BookOpen, Globe, Printer, QrCode, Sparkles, ChevronRight, Search, Heart, Activity, Wind, Pill, Stethoscope } from "lucide-react";

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali"];
const TOPICS = [
  { id: "diabetes", title: "Diabetes Management", icon: Activity, color: "#007AFF", desc: "Blood sugar control, diet, medications, complications & lifestyle changes for Type 2 Diabetes patients.", tags: ["Chronic", "Lifestyle"], readTime: "5 min" },
  { id: "hypertension", title: "Hypertension (High BP)", icon: Heart, color: "#EF4444", desc: "Understanding blood pressure, medications, salt restriction, and daily monitoring tips for hypertensive patients.", tags: ["Chronic", "Cardiac"], readTime: "4 min" },
  { id: "asthma", title: "Asthma & Inhaler Use", icon: Wind, color: "#00C2A8", desc: "How to use inhalers correctly, identify triggers, manage attacks, and when to seek emergency care.", tags: ["Respiratory"], readTime: "6 min" },
  { id: "post-op-knee", title: "Post-Surgery Care: Knee Replacement", icon: Stethoscope, color: "#8B5CF6", desc: "Step-by-step recovery guide after total knee replacement — physiotherapy, wound care, activity restrictions.", tags: ["Post-surgery", "Orthopaedics"], readTime: "8 min" },
  { id: "medication", title: "Medication Adherence", icon: Pill, color: "#F59E0B", desc: "Why taking medicines on time matters, tips to remember doses, and what happens if you miss medications.", tags: ["General", "Lifestyle"], readTime: "3 min" },
  { id: "tb", title: "Tuberculosis (TB) Treatment", icon: Activity, color: "#EF4444", desc: "DOTS therapy, why completing treatment is critical, side effects of TB drugs, and infection prevention.", tags: ["Infectious", "Public Health"], readTime: "7 min" },
  { id: "ckd", title: "Chronic Kidney Disease (CKD)", icon: Activity, color: "#10B981", desc: "Diet restrictions, fluid management, dialysis preparation, and lifestyle modifications for CKD patients.", tags: ["Chronic", "Nephrology"], readTime: "6 min" },
  { id: "heart-attack", title: "Heart Attack Recovery", icon: Heart, color: "#EF4444", desc: "Life after a heart attack — cardiac rehab, medicines, diet, warning signs of recurrence, and support.", tags: ["Cardiac", "Post-surgery"], readTime: "8 min" },
  { id: "pregnancy", title: "Antenatal Care & Nutrition", icon: Heart, color: "#EC4899", desc: "What to expect during pregnancy, essential tests, nutrition, danger signs, and birth preparedness.", tags: ["Obstetrics", "Women's Health"], readTime: "10 min" },
  { id: "child-immunisation", title: "Child Immunisation Schedule", icon: Pill, color: "#007AFF", desc: "Complete NIP immunisation schedule for children from birth to 5 years with vaccine names and dates.", tags: ["Paediatrics", "Preventive"], readTime: "5 min" },
];

const CONTENT_EN: Record<string, string[]> = {
  diabetes: [
    "Check your blood sugar daily — target fasting sugar: 80–130 mg/dL, post-meal: below 180 mg/dL.",
    "Eat small meals every 3–4 hours. Avoid white rice, maida, sweets, and sugary drinks.",
    "Take your medicines at the same time every day, even if you feel well.",
    "Walk for at least 30 minutes every day — it helps lower blood sugar naturally.",
    "Never skip insulin injections. Carry glucose tablets or candy in case of low sugar (hypoglycaemia).",
    "Get HbA1c tested every 3 months, eye check yearly, kidney check and foot exam every 6 months.",
    "Call your doctor immediately if sugar goes below 70 or above 300 mg/dL.",
  ],
  hypertension: [
    "Your target blood pressure is less than 130/80 mmHg. Check it regularly at home.",
    "Reduce salt intake — avoid pickles, papad, chips, and adding extra salt to food.",
    "Take BP medicines every day without fail, even if you feel fine — high BP usually has no symptoms.",
    "Avoid alcohol, smoking, and excess caffeine (tea/coffee).",
    "Manage stress — practice deep breathing or yoga for 15 minutes daily.",
    "Regular walking for 30 minutes helps lower blood pressure by 5–8 mmHg.",
    "Visit your doctor if BP is consistently above 160/100 despite medicines.",
  ],
};

export default function PatientEducation() {
  const [lang, setLang] = useState("English");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  const filtered = TOPICS.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()));
  const topic = TOPICS.find(t => t.id === selected);

  const handleGenerate = () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setAiOutput(`[Generated patient instructions in ${lang} for: "${aiPrompt}"]\n\nPost-operative Instructions — Knee Replacement (Hindi):\n\n• ऑपरेशन के बाद 24 घंटे बिस्तर पर आराम करें।\n• फिजियोथेरेपिस्ट के निर्देशानुसार व्यायाम करें।\n• घाव को सूखा रखें — 10 दिन तक नहाते समय ध्यान दें।\n• दर्द की दवाई खाना खाने के बाद लें।\n• लाल सूजन, बुखार या घाव से पानी आने पर तुरंत डॉक्टर को दिखाएं।\n• 6 हफ्ते बाद ही सीढ़ियां चढ़ें — और केवल सहारे के साथ।`);
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Hero */}
      <div className="relative overflow-hidden pt-14 pb-16">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(8,18,36,0.93) 0%,rgba(10,26,50,0.88) 100%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5" style={{ background: "rgba(0,194,168,0.15)", border: "1px solid rgba(0,194,168,0.25)", color: "#34D399" }}>
            <Globe className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Available in 5 Languages</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ letterSpacing: "-1px" }}>
            Patient <span style={{ background: "linear-gradient(135deg,#00C2A8,#007AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Education</span> Hub
          </h1>
          <p className="text-base max-w-xl mx-auto mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Print-friendly health guides for your patients — in their language. Generate custom instructions with Cadus.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLang(l)} className="px-4 py-2 rounded-full text-sm font-medium transition-all" style={lang === l ? { background: "#FFFFFF", color: "#007AFF" } : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* AI Generator */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4.5 h-4.5" style={{ color: "#7C3AED" }} />
            <h2 className="font-bold text-sm" style={{ color: "#7C3AED" }}>Generate Custom Patient Instructions</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder={`e.g. "Post-op instructions for knee replacement in ${lang}"`} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.15)", color: "#1C1C1E", flexBasis: 200 }} />
            <button onClick={handleGenerate} disabled={!aiPrompt || generating} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5" style={{ background: "#7C3AED", color: "#FFFFFF" }}>
              {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Generate
            </button>
          </div>
          {aiOutput && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid rgba(124,58,237,0.15)" }}>
              <pre className="text-sm whitespace-pre-wrap font-sans" style={{ color: "#1C1C1E" }}>{aiOutput}</pre>
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}><Printer className="w-3.5 h-3.5" /> Print</button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(0,194,168,0.08)", color: "#00C2A8" }}><QrCode className="w-3.5 h-3.5" /> QR Code</button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
          <input type="text" placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm outline-none" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
        </div>

        {!selected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.id} onClick={() => setSelected(t.id)} className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 group" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${t.color}14` }}>
                    <Icon className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: "#1C1C1E" }}>{t.title}</h3>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: "#636366" }}>{t.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      {t.tags.map(tag => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F2F2F7", color: "#636366" }}>{tag}</span>)}
                    </div>
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" style={{ color: t.color }}>Read <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm mb-5" style={{ color: "#007AFF" }}>← Back to topics</button>
            <div className="rounded-2xl p-6 mb-4" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg" style={{ color: "#1C1C1E" }}>{topic?.title}</h2>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{lang}</span>
              </div>
              <ul className="space-y-3">
                {(CONTENT_EN[selected] || CONTENT_EN.diabetes).map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "#1C1C1E" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>{i + 1}</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-6">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}><Printer className="w-3.5 h-3.5" /> Print for Patient</button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,194,168,0.08)", color: "#00C2A8" }}><QrCode className="w-3.5 h-3.5" /> Generate QR Code</button>
              </div>
              <p className="text-[10px] mt-3" style={{ color: "#AEAEB2" }}>Note: These instructions are for patient education only. Always personalise advice based on individual clinical assessment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
