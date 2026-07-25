import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserAuth } from "@/hooks/use-user-auth";
import { Check } from "lucide-react";
import { loginUrl } from "@/lib/host";


/* ── Step definitions ─────────────────────────────────────────── */
const STEPS = [
  {
    id: "role",
    question: "What best describes you?",
    subtitle: "We'll personalise Aethex for you.",
    multi: false,
    options: [
      { value: "doctor",          emoji: "🩺", label: "Doctor",           sub: "MBBS / MD / Specialist" },
      { value: "medical_student", emoji: "📚", label: "Medical Student",  sub: "UG / PG / Intern" },
      { value: "patient",         emoji: "🏥", label: "Patient",          sub: "Personal health" },
      { value: "nurse",           emoji: "💊", label: "Nurse / Para",     sub: "Nursing / Allied health" },
      { value: "researcher",      emoji: "🔬", label: "Researcher",       sub: "Academia / Lab" },
    ],
  },
  {
    id: "goal",
    question: "What will you mainly use Aethex for?",
    subtitle: "Pick all that apply.",
    multi: true,
    options: [
      { value: "ai",        emoji: "🤖", label: "Cadus AI",          sub: "Clinical decision support" },
      { value: "shop",      emoji: "🛒", label: "Medical Shop",       sub: "Equipment & supplies" },
      { value: "study",     emoji: "🎓", label: "Study Hub",          sub: "NEET-PG / MCQs / Notes" },
      { value: "invoices",  emoji: "🧾", label: "GST Invoices",       sub: "Billing & records" },
    ],
  },
  {
    id: "specialty",
    question: "Which area are you in?",
    subtitle: "Helps Cadus AI give better answers.",
    multi: false,
    options: [
      { value: "gp",        emoji: "👨‍⚕️", label: "General Practice",    sub: "" },
      { value: "cardio",    emoji: "❤️",  label: "Cardiology",           sub: "" },
      { value: "paeds",     emoji: "👶",  label: "Paediatrics",          sub: "" },
      { value: "ortho",     emoji: "🦴",  label: "Orthopaedics",         sub: "" },
      { value: "neuro",     emoji: "🧠",  label: "Neurology",            sub: "" },
      { value: "onco",      emoji: "🎗️",  label: "Oncology",             sub: "" },
      { value: "radiology", emoji: "📷",  label: "Radiology",            sub: "" },
      { value: "other",     emoji: "⚕️",  label: "Other",                sub: "" },
    ],
  },
  {
    id: "source",
    question: "How did you find Aethex?",
    subtitle: "One last thing.",
    multi: false,
    options: [
      { value: "social",   emoji: "📱", label: "Social media",       sub: "Instagram / Twitter / LinkedIn" },
      { value: "friend",   emoji: "👥", label: "Friend / Colleague", sub: "Word of mouth" },
      { value: "search",   emoji: "🔍", label: "Google / Search",    sub: "Searched online" },
      { value: "college",  emoji: "🏛️", label: "Medical College",    sub: "Professor / Notice board" },
      { value: "other",    emoji: "✨", label: "Other",              sub: "" },
    ],
  },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, isLoggedIn } = useUserAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  /* Redirect if not logged in */
  useEffect(() => {
    if (!isLoggedIn) window.location.href = loginUrl("/signup");
  }, [isLoggedIn]);


  /* If already onboarded, skip */
  useEffect(() => {
    if (localStorage.getItem("aethex_onboarded") === "true") {
      setLocation("/");
    }
  }, []);

  const currentStep = STEPS[step];
  const currentAnswer = answers[currentStep?.id];

  function select(value: string) {
    if (!currentStep) return;
    if (currentStep.multi) {
      const prev = (answers[currentStep.id] as string[] | undefined) || [];
      const next = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value];
      setAnswers(a => ({ ...a, [currentStep.id]: next }));
    } else {
      setAnswers(a => ({ ...a, [currentStep.id]: value }));
    }
  }

  function isSelected(value: string): boolean {
    const ans = answers[currentStep?.id];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.includes(value);
    return ans === value;
  }

  function canContinue(): boolean {
    const ans = answers[currentStep?.id];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return true;
  }

  async function next() {
    if (step < STEPS.length - 1) {
      setLeaving(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setLeaving(false);
      }, 220);
    } else {
      finish();
    }
  }

  function skip() {
    finish();
  }

  function finish() {
    localStorage.setItem("aethex_onboarded", "true");
    localStorage.setItem("aethex_onboarding_data", JSON.stringify(answers));
    setDone(true);
    setTimeout(() => setLocation("/ai-assistant"), 2200);
  }

  /* ── Done screen ── */
  if (done) {
    return (
      <div style={pageStyle}>
        <Orbs />
        <div style={{ textAlign: "center", animation: "ob-fade-in 0.5s ease both" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(0,194,168,0.15)", border: "1px solid rgba(0,194,168,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            animation: "ob-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <Check size={32} color="#00C2A8" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 26, color: "#fff", margin: "0 0 10px" }}>
            You're all set, {user?.name?.split(" ")[0]}!
          </h2>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#555", margin: 0 }}>
            Taking you to Cadus AI…
          </p>
        </div>
        <AnimationStyles />
      </div>
    );
  }

  /* ── Main wizard ── */
  return (
    <div style={pageStyle}>
      <Orbs />
      <div style={{
        width: "100%", maxWidth: 520, padding: "0 20px",
        animation: leaving ? "ob-slide-out 0.22s ease both" : "ob-slide-in 0.28s ease both",
      }}>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i < step ? "#00C2A8" : i === step ? "#00C2A8" : "#E5E5EA",
              opacity: i > step ? 0.5 : 1,
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 36 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#00C2A8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#050505", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>A</span>
          </div>
          <span style={{ color: "#1C1C1E", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15 }}>AETHEX</span>
        </div>

        {/* Question */}
        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 700,
          fontSize: 24, color: "#1C1C1E", margin: "0 0 8px", textAlign: "center",
        }}>
          {currentStep.question}
        </h1>
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#555", textAlign: "center", margin: "0 0 28px" }}>
          {currentStep.subtitle}
        </p>

        {/* Options grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: currentStep.options.length >= 6 ? "1fr 1fr" : currentStep.options.length >= 4 ? "1fr 1fr" : "1fr",
          gap: 10, marginBottom: 28,
        }}>
          {currentStep.options.map(opt => {
            const sel = isSelected(opt.value);
            return (
              <button key={opt.value} onClick={() => select(opt.value)}
                style={{
                  background: sel ? "rgba(0,194,168,0.1)" : "#FFFFFF",
                  border: `1px solid ${sel ? "#00C2A8" : "rgba(60,60,67,0.15)"}`,
                  borderRadius: 12, padding: "14px 16px",
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.18s ease",
                  transform: sel ? "scale(1.02)" : "scale(1)",
                }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13, color: sel ? "#00A893" : "#1C1C1E" }}>
                    {opt.label}
                  </div>
                  {opt.sub && (
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: "#AEAEB2", marginTop: 2 }}>
                      {opt.sub}
                    </div>
                  )}
                </div>
                {sel && (
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#00C2A8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Check size={10} color="#050505" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button onClick={next} disabled={!canContinue()}
          style={{
            width: "100%", background: canContinue() ? "#007AFF" : "#E5E5EA",
            border: "none",
            borderRadius: 12, padding: "14px 0",
            fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14,
            color: canContinue() ? "#FFFFFF" : "#AEAEB2",
            cursor: canContinue() ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            marginBottom: 14,
          }}>
          {step === STEPS.length - 1 ? "Finish & Go to Aethex →" : "Continue →"}
        </button>

        {/* Skip */}
        <div style={{ textAlign: "center" }}>
          <button onClick={skip} style={{
            background: "none", border: "none", color: "#AEAEB2",
            fontFamily: "'Outfit', sans-serif", fontSize: 11,
            cursor: "pointer", padding: "4px 8px",
          }}>
            Skip for now
          </button>
        </div>
      </div>

      <AnimationStyles />
    </div>
  );
}

function Orbs() {
  return (
    <>
      <div style={{ position: "absolute", top: "6%", right: "8%", width: 260, height: 260, borderRadius: "50%", background: "#00C2A815", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "4%", width: 180, height: 180, borderRadius: "50%", background: "#00C2A810", filter: "blur(55px)", pointerEvents: "none" }} />
    </>
  );
}

function AnimationStyles() {
  return (
    <style>{`
      @keyframes ob-slide-in {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes ob-slide-out {
        from { opacity: 1; transform: translateY(0); }
        to   { opacity: 0; transform: translateY(-14px); }
      }
      @keyframes ob-fade-in {
        from { opacity: 0; transform: scale(0.94); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes ob-pop {
        from { opacity: 0; transform: scale(0.5); }
        to   { opacity: 1; transform: scale(1); }
      }
    `}</style>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh", background: "#F2F2F7",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexDirection: "column", position: "relative", overflow: "hidden",
  padding: "40px 0",
};
