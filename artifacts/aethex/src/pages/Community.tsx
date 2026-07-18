import { useState, useMemo } from "react";
import { PageHero } from "@/components/PageHero";
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles, TrendingUp, Search, Plus, Clock, ChevronUp, ChevronDown, BookOpen, Stethoscope, GraduationCap, FlaskConical, Building2, Pill, Tag, X, Send } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  specialty: string;
  tier: "Free" | "Pro" | "Magnus";
  text: string;
  time: string;
  upvotes: number;
}

interface Post {
  id: number;
  title: string;
  body: string;
  category: string;
  author: string;
  specialty: string;
  tier: "Free" | "Pro" | "Magnus";
  upvotes: number;
  downvotes: number;
  commentCount: number;
  time: string;
  tags: string[];
  comments: Comment[];
  pinned?: boolean;
}

const CATEGORIES = [
  { id: "all", label: "All Posts", icon: TrendingUp, color: "#007AFF" },
  { id: "clinical-cases", label: "Clinical Cases", icon: Stethoscope, color: "#EF4444" },
  { id: "neet-pg", label: "NEET-PG Prep", icon: GraduationCap, color: "#8B5CF6" },
  { id: "career", label: "Career Advice", icon: Building2, color: "#F59E0B" },
  { id: "research", label: "Research & Publications", icon: FlaskConical, color: "#10B981" },
  { id: "hospital-reviews", label: "Hospital Reviews", icon: BookOpen, color: "#06B6D4" },
  { id: "drug-updates", label: "Drug Updates", icon: Pill, color: "#F43F5E" },
];

const POSTS: Post[] = [
  {
    id: 1, pinned: true,
    title: "Unusual presentation of dengue — multiorgan failure in a 28-year-old with no comorbidities",
    body: "Had an interesting case last week. A 28-year-old male with fever for 4 days presented to our ER with NS1 positive dengue. Within 24 hours developed hepatic encephalopathy (bilirubin 18), AKI (creatinine 4.2), thrombocytopenia (platelets 12k) and ARDS requiring intubation. No prior dengue and no comorbidities. Anyone else seen this pattern? Expanded dengue syndrome?",
    category: "clinical-cases", author: "Dr Aryan Kapoor", specialty: "Internal Medicine", tier: "Pro",
    upvotes: 142, downvotes: 3, commentCount: 34, time: "3 hours ago",
    tags: ["dengue", "multiorgan failure", "expanded dengue syndrome"],
    comments: [
      { id: 1, author: "Dr Priya Nair", specialty: "Hepatology", tier: "Magnus", text: "Classic expanded dengue syndrome. The hepatic component often mimics fulminant hepatic failure. Key is aggressive supportive care — watch for dengue shock syndrome overlap. Was his NS1 strongly positive?", time: "2h ago", upvotes: 45 },
      { id: 2, author: "Dr Rahul Sharma", specialty: "Critical Care", tier: "Pro", text: "We had similar case last monsoon. The AKI was the most challenging — ended up needing CRRT for 5 days. Did you start steroids? Controversial but some data supports it in severe dengue.", time: "1h ago", upvotes: 28 },
    ],
  },
  {
    id: 2,
    title: "NEET-PG 2025 Strategy: How I cleared with AIR 47 — detailed plan",
    body: "Getting a lot of DMs asking about my strategy, so posting here for everyone. I gave NEET-PG 3 times before clearing with AIR 47. Key changes in my final attempt: 1) Switched from reading to MCQ-based learning, 2) Solved AIIMS/PGI/USMLE Step 2 alongside NEET, 3) Focused on high-yield subjects (Medicine, Surgery, Obs-Gyne, PSM) which contributed ~60% of questions. Happy to answer any questions.",
    category: "neet-pg", author: "Dr Sneha Verma", specialty: "PG Aspirant", tier: "Pro",
    upvotes: 389, downvotes: 7, commentCount: 112, time: "1 day ago",
    tags: ["NEET-PG", "strategy", "AIR 47", "study plan"],
    comments: [
      { id: 3, author: "Ashok Kumar", specialty: "Final MBBS", tier: "Free", text: "Thank you for this! What book did you follow for Medicine? Mudit Khanna or Harrison's questions?", time: "20h ago", upvotes: 15 },
      { id: 4, author: "Dr Sneha Verma", specialty: "PG Aspirant", tier: "Pro", text: "Mudit Khanna for concepts + solved HARRISON'S SAA for depth. Don't use Harrison's main text — too detailed for NEET-PG. Focus on standard textbook summaries.", time: "19h ago", upvotes: 32 },
    ],
  },
  {
    id: 3,
    title: "PSA test: when do you actually order it? Share your clinical practice",
    body: "I've been increasingly confused about PSA guidelines. ACS recommends against routine screening, NCCN says discuss with patients 45+. But in Indian clinical practice, most urologists I know order it as a reflex for any man >50 with LUTS. What's the community's practice? Are we over-ordering PSA?",
    category: "clinical-cases", author: "Dr Vikram Singh", specialty: "General Practitioner", tier: "Free",
    upvotes: 67, downvotes: 8, commentCount: 29, time: "5 hours ago",
    tags: ["PSA", "urology", "screening", "LUTS"],
    comments: [
      { id: 5, author: "Dr Karan Malhotra", specialty: "Urology", tier: "Magnus", text: "Shared decision-making is key. I use PCPT risk calculator for anyone 50+ with LUTS before ordering PSA. Digital rectal exam is equally important and under-utilized.", time: "4h ago", upvotes: 41 },
    ],
  },
  {
    id: 4,
    title: "Apollo Hospitals vs Fortis — honest review after 3 years at each",
    body: "After working at both systems, here is my unfiltered view. Apollo: Better infrastructure, pay scale in line with market, but very target-driven culture. They monitor your OPD numbers weekly. Fortis: More clinical freedom, good ICU protocols, but pay has not kept pace with inflation. Both have excellent fellowship programmes. Would be happy to discuss specific departments if anyone is deciding.",
    category: "hospital-reviews", author: "Dr Mehta (anonymous)", specialty: "Cardiology", tier: "Pro",
    upvotes: 203, downvotes: 14, commentCount: 67, time: "2 days ago",
    tags: ["Apollo", "Fortis", "hospital review", "doctor experience"],
    comments: [
      { id: 6, author: "Dr Leela Krishnan", specialty: "Radiology", tier: "Free", text: "How is the work-life balance at Apollo compared to Fortis? That's my biggest concern before accepting a corporate hospital offer.", time: "1d ago", upvotes: 23 },
    ],
  },
  {
    id: 5,
    title: "CDSCO Alert: Metformin recall — which batches are affected?",
    body: "CDSCO issued a recall notice for certain batches of Metformin 500mg tablets from Sun Pharma due to NDMA contamination above acceptable limits. Batch numbers: ZX-2024-09 and ZX-2024-10. If you have dispensed these, please advise patients to consult their physician. Full CDSCO alert linked below. This is the third recall in this category since 2022.",
    category: "drug-updates", author: "Cadus AI Digest", specialty: "Pharmacovigilance", tier: "Magnus",
    upvotes: 445, downvotes: 2, commentCount: 89, time: "6 hours ago",
    tags: ["CDSCO", "recall", "metformin", "NDMA", "drug safety"],
    comments: [
      { id: 7, author: "Dr Anita Sharma", specialty: "Family Medicine", tier: "Pro", text: "I've already contacted 8 patients. CDSCO should make these alerts more proactive — I only found out via this forum.", time: "5h ago", upvotes: 67 },
    ],
  },
  {
    id: 6,
    title: "My research got published in JAPI — process, timeline and lessons",
    body: "After 3 desk rejections and 18 months of work, my case series on paraquat poisoning management got accepted in the Journal of Association of Physicians of India. Here's what I learnt: 1) Presentation matters as much as data, 2) Consult a biostatistician early, 3) The ICMJE authorship criteria are strictly followed now. Full paper link in comments. Happy to help others with their first publication.",
    category: "research", author: "Dr Naveen Rao", specialty: "Emergency Medicine", tier: "Pro",
    upvotes: 156, downvotes: 1, commentCount: 42, time: "3 days ago",
    tags: ["research", "publication", "JAPI", "clinical research India"],
    comments: [
      { id: 8, author: "Dr Swathi Reddy", specialty: "Resident", tier: "Free", text: "Congratulations! What statistical software did you use? SPSS or R?", time: "2d ago", upvotes: 12 },
      { id: 9, author: "Dr Naveen Rao", specialty: "Emergency Medicine", tier: "Pro", text: "Used SPSS v26 for the basics. My statistician co-author used R for survival analysis. For a case series, descriptive stats alone are often sufficient.", time: "2d ago", upvotes: 19 },
    ],
  },
  {
    id: 7,
    title: "Should doctors negotiate salaries in India? Culture vs reality",
    body: "I recently asked for a salary revision at a corporate hospital and was told 'we don't negotiate — take it or leave it.' But when I resigned, they immediately offered 40% more. How common is this? Do most Indian doctors simply accept the first offer? Would love to hear experiences, especially from senior consultants.",
    category: "career", author: "Dr Anonymous", specialty: "Medicine", tier: "Free",
    upvotes: 312, downvotes: 5, commentCount: 95, time: "4 days ago",
    tags: ["salary", "career", "negotiation", "corporate hospital"],
    comments: [
      { id: 10, author: "Dr Asha Menon", specialty: "Dermatology", tier: "Pro", text: "Always negotiate. Research market rates in your city first. Lever: competing offer (real or implied). Corporate hospitals have more flexibility than they admit.", time: "3d ago", upvotes: 88 },
    ],
  },
  {
    id: 8,
    title: "Interesting ECG — what's your diagnosis?",
    body: "45-year-old female, no cardiac history, presented with palpitations and near-syncope. ECG shows: regular narrow complex tachycardia at 178 bpm, short PR interval, delta waves visible in V1-V4 but not inferior leads. No chest pain, troponin negative. What's your diagnosis and immediate management?",
    category: "clinical-cases", author: "Dr Suresh Kumar", specialty: "Emergency Medicine", tier: "Pro",
    upvotes: 94, downvotes: 2, commentCount: 48, time: "8 hours ago",
    tags: ["ECG", "tachycardia", "WPW", "arrhythmia"],
    comments: [
      { id: 11, author: "Dr Ramesh Patel", specialty: "Cardiology", tier: "Magnus", text: "WPW with antidromic AVRT given the delta waves. DON'T use adenosine if AF is also possible — risk of VF. Procainamide is preferred. Get electrophysiology on call.", time: "7h ago", upvotes: 72 },
    ],
  },
  {
    id: 9,
    title: "Best resources for NEET-PG 2026 — comprehensive community list",
    body: "Compiled from top performers' recommendations. Will update this list. Medicine: Mudit Khanna, Harrison for reference. Surgery: Bailey & Love summaries + SRB for Indian context. Obs-Gyne: Dutta + high-yield notes. Paediatrics: OP Ghai. PSM: K Park — do NOT skip! Radiology: Recall pattern + Sumer Sethi videos. Ophthal + ENT: Short subjects — do them 2 weeks before exam.",
    category: "neet-pg", author: "Aethex Study Team", specialty: "Medical Education", tier: "Magnus",
    upvotes: 521, downvotes: 11, commentCount: 134, time: "1 week ago",
    tags: ["resources", "books", "NEET-PG 2026", "study material"],
    comments: [
      { id: 12, author: "Divya K", specialty: "3rd Year MBBS", tier: "Free", text: "Should we do Anatomy in detail or just focus on radiological anatomy for NEET-PG?", time: "5d ago", upvotes: 8 },
    ],
  },
  {
    id: 10,
    title: "Type 2 Diabetes new drug: Tirzepatide now available in India — clinical experience?",
    body: "Tirzepatide (Mounjaro) has now been launched in India at ₹8,000–12,000 per pen. GIP+GLP-1 dual agonist. SURPASS trials showed superior glycaemic control vs semaglutide. Anyone started patients on it? Practical questions: patient selection, weight, HbA1c targets, managing nausea, CGMS monitoring protocol?",
    category: "drug-updates", author: "Dr Preethi Nagarajan", specialty: "Endocrinology", tier: "Pro",
    upvotes: 178, downvotes: 3, commentCount: 56, time: "2 days ago",
    tags: ["tirzepatide", "diabetes", "GLP-1", "new drug India"],
    comments: [
      { id: 13, author: "Dr Inder Kapoor", specialty: "Endocrinology", tier: "Magnus", text: "Started 3 patients. Start at 2.5mg weekly for 4 weeks, uptitrate slowly to reduce GI side effects. Excellent for obese T2DM with BMI >30. Not covered under any insurance yet — affordability is the main barrier.", time: "1d ago", upvotes: 54 },
    ],
  },
  {
    id: 11,
    title: "How to handle patient complaints in private practice — legal perspective",
    body: "After 12 years in practice, I had my first consumer court notice last month. Patient alleged wrong diagnosis (false negative LFT before starting hepatotoxic drug). We had documented everything but the informed consent form was pre-printed without patient-specific details. Outcome: case dismissed but the 18-month stress was immense. Sharing lessons learned.",
    category: "career", author: "Dr Rajesh Nair", specialty: "General Medicine", tier: "Pro",
    upvotes: 267, downvotes: 4, commentCount: 78, time: "5 days ago",
    tags: ["medico-legal", "consumer court", "documentation", "private practice"],
    comments: [],
  },
  {
    id: 12,
    title: "NMC's new postgraduate regulations — what changes for DNB vs MD?",
    body: "NMC 2023 PG medical education regulations have significantly altered the landscape. Key changes: 1) NBE-DNB holders now at par with MCI-MD for all purposes including teaching, 2) Increased simulation-based training requirement, 3) New assessment framework replacing traditional theory exams with OSCEs. Thoughts from the community?",
    category: "career", author: "Dr Meera Subramaniam", specialty: "Medical Administration", tier: "Magnus",
    upvotes: 193, downvotes: 6, commentCount: 61, time: "6 days ago",
    tags: ["NMC", "DNB", "MD", "PG regulations 2023"],
    comments: [],
  },
  {
    id: 13,
    title: "Septic shock in paediatrics — when do you start vasopressors?",
    body: "Paeds ICU question for the community. In a 5-year-old in septic shock, after 60mL/kg fluid resuscitation over 1 hour, BP still 68/40, HR 155, cap refill 4 seconds, lactate 5.2. Do you start noradrenaline or dopamine as first vasopressor? And what's the trigger — do you wait for echocardiogram to assess cardiac function before deciding?",
    category: "clinical-cases", author: "Dr Ritu Sharma", specialty: "Paediatrics", tier: "Pro",
    upvotes: 88, downvotes: 1, commentCount: 32, time: "12 hours ago",
    tags: ["paediatric sepsis", "vasopressors", "PICU", "septic shock"],
    comments: [
      { id: 14, author: "Dr Anil Nair", specialty: "Paediatric ICU", tier: "Magnus", text: "PALS 2020 update: noradrenaline is now preferred first-line even in paediatric septic shock — not dopamine. Dopamine has worse side effect profile (arrhythmias) in children. Echo to guide fluid further resuscitation, not to delay vasopressors.", time: "10h ago", upvotes: 61 },
    ],
  },
  {
    id: 14,
    title: "ICMR guidelines on H3N2 influenza — management protocol updated",
    body: "ICMR released updated guidelines for seasonal influenza H3N2 management last week. Key updates: 1) Oseltamivir recommended for all high-risk groups within 48h of symptom onset, 2) Zanamivir as alternative for oseltamivir-resistant strains, 3) Routine chest X-ray no longer recommended for uncomplicated influenza, 4) Antibiotic stewardship — avoid unless bacterial co-infection suspected. Full guideline PDF in comments.",
    category: "drug-updates", author: "Cadus AI Digest", specialty: "Infectious Disease", tier: "Magnus",
    upvotes: 334, downvotes: 3, commentCount: 47, time: "1 week ago",
    tags: ["ICMR", "influenza", "H3N2", "oseltamivir", "guidelines"],
    comments: [],
  },
  {
    id: 15,
    title: "Pathological paper on TG-rich lipoprotein and cardiovascular risk — any clinical implications?",
    body: "Just read this NEJM paper suggesting remnant cholesterol from TG-rich lipoproteins (VLDL remnants, chylomicron remnants) contributes to ASCVD risk independently of LDL-C. In practice: patients with normal LDL-C but high triglycerides and low HDL may still be at risk. Do we need to treat beyond LDL targets? Any Indian data on this?",
    category: "research", author: "Dr Keshav Murthy", specialty: "Cardiology", tier: "Pro",
    upvotes: 112, downvotes: 2, commentCount: 38, time: "3 days ago",
    tags: ["lipids", "remnant cholesterol", "ASCVD", "NEJM", "cardiology"],
    comments: [],
  },
];

const tierColors: Record<string, { bg: string; color: string; label: string }> = {
  Free: { bg: "#F5F3EE", color: "#636366", label: "Member" },
  Pro: { bg: "rgba(0,122,255,0.1)", color: "#007AFF", label: "Pro" },
  Magnus: { bg: "rgba(0,194,168,0.12)", color: "#00A893", label: "Magnus" },
};

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const [votes, setVotes] = useState({ up: post.upvotes, down: post.downvotes, voted: null as "up" | "down" | null });
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments);
  const cat = CATEGORIES.find(c => c.id === post.category);

  const handleVote = (dir: "up" | "down") => {
    setVotes(v => {
      if (v.voted === dir) return { ...v, [dir === "up" ? "up" : "down"]: v[dir === "up" ? "up" : "down"] - 1, voted: null };
      const newV = { ...v, voted: dir };
      if (v.voted) newV[v.voted === "up" ? "up" : "down"] = v[v.voted === "up" ? "up" : "down"] - 1;
      newV[dir === "up" ? "up" : "down"] = v[dir === "up" ? "up" : "down"] + 1;
      return newV;
    });
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${post.pinned ? "ring-2 ring-[#007AFF]/20" : ""}`} style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Vote column */}
          <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
            <button onClick={() => handleVote("up")} className="p-1.5 rounded-lg transition-all hover:bg-blue-50">
              <ChevronUp className="w-5 h-5" style={{ color: votes.voted === "up" ? "#007AFF" : "#AEAEB2" }} />
            </button>
            <span className="text-sm font-bold" style={{ color: votes.up - votes.down > 0 ? "#007AFF" : "#636366" }}>{votes.up - votes.down}</span>
            <button onClick={() => handleVote("down")} className="p-1.5 rounded-lg transition-all hover:bg-red-50">
              <ChevronDown className="w-5 h-5" style={{ color: votes.voted === "down" ? "#EF4444" : "#AEAEB2" }} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                📌 Pinned
              </span>
            )}
            <button onClick={() => setExpanded(e => !e)} className="text-left w-full">
              <h3 className="text-base font-bold leading-snug mb-2 hover:text-[#007AFF] transition-colors" style={{ color: "#1C1C1E" }}>{post.title}</h3>
            </button>

            {/* Author */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                {post.author.replace("Dr ", "").charAt(0)}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: "#1C1C1E" }}>{post.author}</span>
                <span className="text-xs" style={{ color: "#AEAEB2" }}>·</span>
                <span className="text-xs" style={{ color: "#636366" }}>{post.specialty}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: tierColors[post.tier].bg, color: tierColors[post.tier].color }}>{post.tier}</span>
                <span className="text-xs" style={{ color: "#AEAEB2" }}>· {post.time}</span>
              </div>
            </div>

            {/* Category + Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {cat && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cat.color}14`, color: cat.color }}>
                  {cat.label}
                </span>
              )}
              {post.tags.map(t => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F5F3EE", color: "#636366" }}>#{t}</span>
              ))}
            </div>

            {/* Preview / Full body */}
            <p className="text-sm leading-relaxed" style={{ color: "#636366" }}>
              {expanded ? post.body : post.body.slice(0, 200) + (post.body.length > 200 ? "…" : "")}
            </p>
            {post.body.length > 200 && (
              <button onClick={() => setExpanded(e => !e)} className="text-xs font-semibold mt-1" style={{ color: "#007AFF" }}>
                {expanded ? "Show less" : "Read more"}
              </button>
            )}

            {/* Comments */}
            {expanded && (
              <div className="mt-4 space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 p-3 rounded-xl" style={{ background: "#F5F3EE" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(0,194,168,0.12)", color: "#00A893" }}>
                      {c.author.replace("Dr ", "").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: "#1C1C1E" }}>{c.author}</span>
                        <span className="text-[10px]" style={{ color: "#636366" }}>· {c.specialty}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: tierColors[c.tier].bg, color: tierColors[c.tier].color }}>{c.tier}</span>
                        <span className="text-[10px]" style={{ color: "#AEAEB2" }}>· {c.time}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#636366" }}>{c.text}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <ThumbsUp className="w-3 h-3" style={{ color: "#AEAEB2" }} />
                        <span className="text-[11px]" style={{ color: "#AEAEB2" }}>{c.upvotes}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add comment */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#F5F3EE", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && commentText.trim()) {
                        setComments(prev => [...prev, { id: Date.now(), author: "You", specialty: "Member", tier: "Free", text: commentText, time: "just now", upvotes: 0 }]);
                        setCommentText("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        setComments(prev => [...prev, { id: Date.now(), author: "You", specialty: "Member", tier: "Free", text: commentText, time: "just now", upvotes: 0 }]);
                        setCommentText("");
                      }
                    }}
                    className="p-2 rounded-xl transition-all"
                    style={{ background: "#007AFF", color: "#FFFFFF" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center gap-4 mt-3">
              <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1.5 text-xs" style={{ color: "#636366" }}>
                <MessageSquare className="w-3.5 h-3.5" />{comments.length} comments
              </button>
              <a href="/ai-assistant" className="flex items-center gap-1.5 text-xs transition-all hover:opacity-80" style={{ color: "#007AFF" }}>
                <Sparkles className="w-3.5 h-3.5" />Ask Cadus AI
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");

  const filtered = useMemo(() => {
    let posts = POSTS.filter(p =>
      (category === "all" || p.category === category) &&
      (search === "" || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase())))
    );
    if (sort === "hot") posts = [...posts].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    else if (sort === "new") posts = [...posts].sort((a, b) => a.id < b.id ? 1 : -1);
    else if (sort === "top") posts = [...posts].sort((a, b) => b.upvotes - a.upvotes);
    return posts;
  }, [category, search, sort]);

  const trending = [...POSTS].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Community"
        title="Doctor Community"
        subtitle="Peer discussions, clinical cases, career advice and drug updates — by doctors, for doctors"
        icon={<MessageSquare className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Main feed */}
          <div className="flex-1 min-w-0">
            {/* Category tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                    style={{
                      background: category === cat.id ? cat.color : "#FFFFFF",
                      color: category === cat.id ? "#FFFFFF" : "#636366",
                      border: category === cat.id ? `1px solid ${cat.color}` : "1px solid rgba(60,60,67,0.12)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />{cat.label}
                  </button>
                );
              })}
            </div>

            {/* Search + Sort */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.12)", color: "#1C1C1E" }} />
              </div>
              <div className="flex gap-1.5">
                {(["hot", "new", "top"] as const).map(s => (
                  <button key={s} onClick={() => setSort(s)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                    style={{ background: sort === s ? "#007AFF" : "#FFFFFF", color: sort === s ? "#FFFFFF" : "#636366", border: sort === s ? "1px solid #007AFF" : "1px solid rgba(60,60,67,0.12)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filtered.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 shrink-0 hidden xl:block">
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#FFFFFF", border: "1px solid rgba(60,60,67,0.1)" }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#1C1C1E" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "#007AFF" }} />Trending Posts
              </h3>
              <div className="space-y-3">
                {trending.map((p, i) => (
                  <button key={p.id} onClick={() => {}} className="w-full text-left group">
                    <div className="flex items-start gap-2">
                      <span className="text-xl font-black shrink-0" style={{ color: i < 3 ? "#007AFF" : "#AEAEB2" }}>0{i + 1}</span>
                      <div>
                        <p className="text-xs font-semibold leading-snug group-hover:text-[#007AFF] transition-colors" style={{ color: "#1C1C1E" }}>{p.title.slice(0, 60)}…</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#AEAEB2" }}>{p.upvotes} upvotes · {p.commentCount} comments</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.08), rgba(0,194,168,0.08))", border: "1px solid rgba(0,122,255,0.15)" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#1C1C1E" }}>Community Guidelines</h3>
              <ul className="space-y-1.5 text-xs" style={{ color: "#636366" }}>
                {["Be respectful and professional", "Share evidence-based information", "No promotional content", "Patient privacy is paramount", "Flag harmful content"].map(g => (
                  <li key={g} className="flex items-start gap-1.5"><span style={{ color: "#00C2A8" }}>✓</span>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
