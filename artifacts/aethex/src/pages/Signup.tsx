import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Sparkles, GraduationCap, ShoppingBag, BrainCircuit, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { isLoginHost, mainUrl, loginUrl } from "@/lib/host";
import { authErrorMessage, googleSignInHref, signedInDestination, verifyEmailCode } from "@/lib/account";


type Role = "Doctor" | "Medical Student" | "Patient";
const ROLES: Role[] = ["Doctor", "Medical Student", "Patient"];

const LOGO = `${import.meta.env.BASE_URL}aethex-logo.jpg`;
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const features = [
  { icon: BrainCircuit, label: "Cadus AI", desc: "AI clinical assistant, 20 queries/day free" },
  { icon: ShoppingBag, label: "Medical Store", desc: "1,000+ genuine products, fast delivery" },
  { icon: GraduationCap, label: "Study Hub", desc: "NEET PG, NEXT, FMGE & USMLE prep" },
  { icon: ShieldCheck, label: "GST Invoices", desc: "Tax invoices included with every order" },
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signup, isLoggedIn } = useUserAuth();


  // Email signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Doctor");
  const [showPassword, setShowPassword] = useState(false);

  // Common
  const [error, setError] = useState(authErrorMessage);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // After the form, the emailed code confirms the address and creates the account.
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeTimer, setCodeTimer] = useState(0);
  useEffect(() => {
    if (codeTimer <= 0) return;
    const id = setInterval(() => setCodeTimer(t => (t <= 1 ? (clearInterval(id), 0) : t - 1)), 1000);
    return () => clearInterval(id);
  }, [codeTimer]);

  // From login.aethex.in back to aethex.in; elsewhere, on this site. The first call wins
  // (a new account goes to onboarding, not home).
  const leaving = useRef(false);
  const go = (path: string) => {
    if (leaving.current) return;
    leaving.current = true;
    const away = signedInDestination(path);
    if (away) window.location.href = away;
    else setLocation(path);
  };
  const goHome = () => go("/");

  const signingUp = useRef(false);
  useEffect(() => { if (isLoggedIn && !signingUp.current) goHome(); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Google sign-up runs through the Worker; a new account then sees onboarding.
  const handleGoogle = () => {
    setLoading(true);
    try { localStorage.removeItem("aethex_onboarded"); } catch { /* blocked */ }
    window.location.href = googleSignInHref(signedInDestination("/onboarding") ?? `${window.location.origin}/onboarding`);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (!name.trim()) { setError("Please enter your full name."); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      localStorage.removeItem("aethex_onboarded");
      const res = await signup(name.trim(), email, password);
      if (!res.success) { setError(res.error || "Signup failed. Please try again."); return; }
      setCode(""); setAwaitingCode(true); setCodeTimer(60);
    } finally { setLoading(false); }

  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      signingUp.current = true;
      const r = await verifyEmailCode(email, code, name.trim());
      if (!r.ok) { signingUp.current = false; setError(r.error); return; }
      go("/onboarding");
    } finally { setLoading(false); }
  };
  const resendCode = async () => {
    if (codeTimer > 0) return;
    setError(""); setLoading(true);
    try {
      const res = await signup(name.trim(), email, password);
      if (!res.success) { setError(res.error || "The code couldn't be sent."); return; }
      setCode(""); setCodeTimer(60);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#F2F2F7" }}>

      {/* ── Left panel ── */}
      <div className="auth-left-panel" style={{
        width: "45%", minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", padding: "36px 44px",
        background: "linear-gradient(145deg, #EBF4FF 0%, #F0F8FF 40%, #E8F5F3 100%)",
        borderRight: "1px solid rgba(60,60,67,0.1)",
      }}>
        <div style={{ position: "absolute", top: "5%", right: "-10%", width: 320, height: 320, borderRadius: "50%", background: "rgba(0,122,255,0.08)", filter: "blur(90px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: 250, height: 250, borderRadius: "50%", background: "rgba(0,194,168,0.07)", filter: "blur(80px)", pointerEvents: "none" }} />

        <a href={mainUrl("/")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative", zIndex: 1 }}>
          <img src={LOGO} alt="aethex" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: "#FFFFFF" }} />
          <span style={{ color: "#1C1C1E", fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>aethex</span>
        </a>


        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.25)", marginBottom: 20, width: "fit-content" }}>
            <Sparkles style={{ width: 12, height: 12, color: "#00A893" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#00A893", letterSpacing: "0.02em" }}>Free to start</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, color: "#1C1C1E", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Join 50,000+<br />
            <span style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Indian Doctors</span>
          </h1>
          <p style={{ fontSize: 13, color: "#636366", lineHeight: 1.7, maxWidth: 340, margin: "0 0 36px" }}>
            AI-powered clinical tools, exam prep, and medical supplies — built for Indian medical students and doctors.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 14, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(60,60,67,0.1)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 16, height: 16, color: "#007AFF" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#636366", marginTop: 1 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 10, color: "#AEAEB2", textAlign: "center", position: "relative", zIndex: 1 }}>Free to start · No credit card required</p>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right-panel" style={{
        width: "55%", minHeight: "100vh", background: "#F2F2F7",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div className="auth-mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
            <img src={LOGO} alt="aethex" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: "#1C1C1E" }}>aethex</span>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid rgba(60,60,67,0.1)" }}>

            {success ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(52,199,89,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle2 style={{ width: 30, height: 30, color: "#34C759" }} />
                </div>
                <p style={{ color: "#1C1C1E", fontWeight: 700, fontSize: 18 }}>Account created!</p>
                <p style={{ color: "#AEAEB2", fontSize: 13, marginTop: 6 }}>Setting up your profile…</p>
              </div>
            ) : (
              <>
                <h2 style={headingStyle}>Create your account</h2>
                <p style={subStyle}>Join thousands of medical professionals on aethex</p>

                {/* ── Email tab ── */}
                {awaitingCode ? (
                  <form onSubmit={handleVerifyCode} style={formStyle}>
                    <p style={{ fontSize: 13, color: "#636366", margin: 0, lineHeight: 1.5 }}>
                      We emailed a 6-digit code to <strong style={{ color: "#1C1C1E" }}>{email}</strong>. Enter it to confirm the address and create your account.
                    </p>
                    <div>
                      <label style={labelStyle}>CODE</label>
                      <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code"
                        value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} required placeholder="• • • • • •"
                        style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.6em", fontFamily: "monospace" }} />
                    </div>
                    {error && <div style={errorStyle}>{error}</div>}
                    <button type="submit" disabled={loading || code.length !== 6} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? <><BtnSpinner />Checking…</> : "Confirm and create account"}</button>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <button type="button" onClick={() => { setAwaitingCode(false); setError(""); }} style={{ background: "none", border: "none", color: "#636366", cursor: "pointer" }}>← Change details</button>
                      <button type="button" disabled={codeTimer > 0 || loading} onClick={() => void resendCode()} style={{ background: "none", border: "none", color: codeTimer > 0 ? "#AEAEB2" : "#007AFF", cursor: codeTimer > 0 ? "not-allowed" : "pointer" }}>{codeTimer > 0 ? `Resend in ${codeTimer}s` : "Resend the code"}</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleEmailSignup} style={formStyle}>
                    <div>
                      <label style={labelStyle}>FULL NAME</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required
                        placeholder="Dr. Priya Sharma" style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div>
                      <label style={labelStyle}>I AM A</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {ROLES.map(r => (
                          <button key={r} type="button" onClick={() => setRole(r)}
                            style={{ flex: 1, padding: "10px 4px", background: role === r ? "rgba(0,122,255,0.08)" : "#F2F2F7", border: `1.5px solid ${role === r ? "#007AFF" : "rgba(60,60,67,0.2)"}`, borderRadius: 10, color: role === r ? "#007AFF" : "#636366", fontSize: 11, cursor: "pointer", transition: "all 0.18s", fontWeight: role === r ? 700 : 400 }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>EMAIL</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="doctor@hospital.in" style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <div>
                      <label style={labelStyle}>PASSWORD</label>
                      <div style={{ position: "relative" }}>
                        <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                          placeholder="At least 8 characters" autoComplete="new-password" style={{ ...inputStyle, paddingRight: 44 }}
                          onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                          onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                        <button type="button" onClick={() => setShowPassword(s => !s)}
                          style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#AEAEB2", cursor: "pointer", display: "flex", padding: 0 }}>
                          {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      </div>
                    </div>
                    {error && <div style={errorStyle}>{error}</div>}
                    <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? <><BtnSpinner />Creating account…</> : "Create Free Account"}</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(60,60,67,0.12)" }} />
                      <span style={{ fontSize: 11, color: "#AEAEB2" }}>or</span>
                      <div style={{ flex: 1, height: 1, background: "rgba(60,60,67,0.12)" }} />
                    </div>
                    <button type="button" style={ghostBtnStyle} onClick={handleGoogle} disabled={loading}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Sign up with Google</span>
                    </button>
                  </form>
                )}

                <p style={{ fontSize: 12, color: "#AEAEB2", textAlign: "center", margin: "20px 0 4px" }}>
                  Already have an account?{" "}
                  {isLoginHost() ? (
                    <Link href="/login" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
                  ) : (
                    <a href={loginUrl("/")} style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
                  )}
                </p>

                <p style={{ fontSize: 10, color: "#AEAEB2", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                  By creating an account, you agree to our{" "}
                  <a href="#" style={{ color: "#007AFF", textDecoration: "none" }}>Terms</a> and{" "}
                  <a href="#" style={{ color: "#007AFF", textDecoration: "none" }}>Privacy Policy</a>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .auth-left-panel { display: none !important; }
          .auth-right-panel { width: 100% !important; min-height: 100vh; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function BtnSpinner() {
  return <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.65s linear infinite", verticalAlign: "middle", marginRight: 7 }} />;
}

const headingStyle: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1C1C1E", margin: "0 0 5px", letterSpacing: "-0.02em" };
const subStyle: React.CSSProperties = { fontSize: 13, color: "#636366", margin: "0 0 20px" };
const formStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 16 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#AEAEB2", marginBottom: 7 };
const inputStyle: React.CSSProperties = { width: "100%", background: "#F2F2F7", border: "1.5px solid rgba(60,60,67,0.2)", borderRadius: 12, padding: "13px 15px", color: "#1C1C1E", fontSize: 14, outline: "none", transition: "border-color 0.18s ease, box-shadow 0.18s ease", boxSizing: "border-box" };
const primaryBtnStyle: React.CSSProperties = { width: "100%", background: "linear-gradient(135deg,#007AFF,#00C2A8)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "opacity 0.18s ease", letterSpacing: "-0.01em" };
const ghostBtnStyle: React.CSSProperties = { width: "100%", background: "#FFFFFF", border: "1.5px solid rgba(60,60,67,0.15)", borderRadius: 12, padding: "13px 0", fontSize: 13, color: "#1C1C1E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.18s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };
const errorStyle: React.CSSProperties = { background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 10, padding: "11px 14px", fontSize: 12, color: "#FF3B30" };
