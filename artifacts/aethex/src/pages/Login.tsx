import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, RefreshCw, ShieldCheck, Sparkles, GraduationCap, ShoppingBag, BrainCircuit, CheckCircle2, Mail, Phone } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { auth } from "@/lib/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";

const LOGO = `${import.meta.env.BASE_URL}aethex-logo.jpg`;

type AuthTab = "email" | "phone";
type EmailMode = "password" | "otp-email" | "otp-verify";
type PhoneMode = "phone-enter" | "phone-verify";

const features = [
  { icon: BrainCircuit, label: "Cadus AI", desc: "AI clinical assistant, 20 queries/day free" },
  { icon: ShoppingBag, label: "Medical Store", desc: "1,000+ genuine products, fast delivery" },
  { icon: GraduationCap, label: "Study Hub", desc: "NEET PG, NEXT, FMGE & USMLE prep" },
  { icon: ShieldCheck, label: "GST Invoices", desc: "Tax invoices included with every order" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, otpLogin, phoneLogin, isLoggedIn } = useUserAuth();

  const [tab, setTab] = useState<AuthTab>("email");

  // Email states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Phone states
  const [phone, setPhone] = useState("");
  const [phoneMode, setPhoneMode] = useState<PhoneMode>("phone-enter");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneTimer, setPhoneTimer] = useState(0);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Common states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (isLoggedIn) setLocation("/"); }, [isLoggedIn]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer(t => (t <= 1 ? (clearInterval(id), 0) : t - 1)), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

  useEffect(() => {
    if (phoneTimer <= 0) return;
    const id = setInterval(() => setPhoneTimer(t => (t <= 1 ? (clearInterval(id), 0) : t - 1)), 1000);
    return () => clearInterval(id);
  }, [phoneTimer]);

  const switchTab = (t: AuthTab) => { setTab(t); setError(""); };

  // ── Email handlers ────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = login(email, password);
      if (!res.success) { setError(res.error || "Invalid email or password."); return; }
      setLocation("/");
    } finally { setLoading(false); }
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", { body: { email: otpEmail } });
      if (error || (data && (data as any).error)) {
        setError(((data as any)?.error) || error?.message || "Failed to send OTP.");
        return;
      }
      setEmailMode("otp-verify"); setOtpTimer(60);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email: otpEmail, otp: otpCode },
      });
      if (error || !data || (data as any).error) {
        setError(((data as any)?.error) || error?.message || "Verification failed.");
        return;
      }
      const payload = data as { hashed_token?: string; email: string };
      if (payload.hashed_token) {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          type: "magiclink",
          token_hash: payload.hashed_token,
        });
        if (verifyErr) { setError(verifyErr.message); return; }
      }
      otpLogin(otpEmail, "supabase");
      setSuccess(true);
      setTimeout(() => setLocation("/"), 1000);
    } catch (err) { setError((err as Error).message || "Network error. Please try again."); }
    finally { setLoading(false); }
  };

  // ── Phone handlers (Firebase) ─────────────────────────────────────────────
  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    return d.length === 10 ? `+91${d}` : raw;
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, { size: "invisible" });
      }
      const result = await signInWithPhoneNumber(auth, formatPhone(phone), recaptchaVerifierRef.current);
      confirmationResultRef.current = result;
      setPhoneMode("phone-verify"); setPhoneTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Check your number.");
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally { setLoading(false); }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (!confirmationResultRef.current) { setError("Session expired. Please resend OTP."); return; }
      const result = await confirmationResultRef.current.confirm(phoneOtp);
      const u = result.user;
      phoneLogin(u.phoneNumber || phone, "");
      setSuccess(true);
      setTimeout(() => setLocation("/"), 1000);
    } catch { setError("Invalid OTP. Please check and try again."); }
    finally { setLoading(false); }
  };

  const resendPhoneOtp = async () => {
    if (phoneTimer > 0) return;
    setLoading(true); setError("");
    try {
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, formatPhone(phone), recaptchaVerifierRef.current);
      confirmationResultRef.current = result;
      setPhoneOtp(""); setPhoneTimer(60);
    } catch (err: any) { setError(err.message || "Failed to resend OTP."); }
    finally { setLoading(false); }
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

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative", zIndex: 1 }}>
          <img src={LOGO} alt="aethex" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: "#FFFFFF" }} />
          <span style={{ color: "#1C1C1E", fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>aethex</span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(0,194,168,0.1)", border: "1px solid rgba(0,194,168,0.25)", marginBottom: 20, width: "fit-content" }}>
            <Sparkles style={{ width: 12, height: 12, color: "#00A893" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#00A893", letterSpacing: "0.02em" }}>India's #1 Medical Platform</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, color: "#1C1C1E", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Study, Diagnose,<br />and Source —{" "}
            <span style={{ background: "linear-gradient(135deg,#007AFF,#00C2A8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>All in One.</span>
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
        <div style={{ width: "100%", maxWidth: 380 }}>
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
                <p style={{ color: "#1C1C1E", fontWeight: 700, fontSize: 18 }}>Verified!</p>
                <p style={{ color: "#AEAEB2", fontSize: 13, marginTop: 6 }}>Signing you in…</p>
              </div>
            ) : (
              <>
                <h2 style={headingStyle}>Welcome back</h2>
                <p style={subStyle}>Sign in to your aethex account</p>

                {/* Tab switcher */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#F2F2F7", borderRadius: 12, padding: 4 }}>
                  {([["email", Mail, "Email"], ["phone", Phone, "Phone"]] as const).map(([t, Icon, label]) => (
                    <button key={t} type="button" onClick={() => switchTab(t as AuthTab)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 600, transition: "all 0.18s",
                        background: tab === t ? "#FFFFFF" : "transparent",
                        color: tab === t ? "#007AFF" : "#636366",
                        boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                      }}>
                      <Icon style={{ width: 14, height: 14 }} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Email tab ── */}
                {tab === "email" && (
                  <>
                    {emailMode === "otp-verify" ? (
                      <>
                        <p style={{ fontSize: 13, color: "#636366", marginBottom: 20 }}>
                          Enter the 6-digit code sent to <strong style={{ color: "#1C1C1E" }}>{otpEmail}</strong>
                        </p>
                        <form onSubmit={handleVerifyEmailOtp} style={formStyle}>
                          <div>
                            <label style={labelStyle}>OTP CODE</label>
                            <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                              value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                              required placeholder="• • • • • •"
                              style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.6em", fontFamily: "monospace" }}
                              onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                              onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                          </div>
                          {error && <div style={errorStyle}>{error}</div>}
                          <button type="submit" disabled={loading || otpCode.length !== 6} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {loading ? <><BtnSpinner />Verifying…</> : "Verify & Sign In"}
                          </button>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <button type="button" onClick={() => { setEmailMode("otp-email"); setOtpCode(""); setError(""); }}
                              style={{ background: "none", border: "none", color: "#636366", cursor: "pointer" }}>← Change email</button>
                            <button type="button" disabled={otpTimer > 0 || loading}
                              onClick={async () => {
                                if (otpTimer > 0) return;
                                setLoading(true);
                                try {
                                  const { data, error: fnErr } = await supabase.functions.invoke("send-otp", { body: { email: otpEmail } });
                                  if (!fnErr && !(data as any)?.error) { setOtpCode(""); setOtpTimer(60); } else setError(((data as any)?.error) || fnErr?.message || "Failed.");
                                } catch { setError("Network error."); } finally { setLoading(false); }
                              }}
                              style={{ background: "none", border: "none", color: otpTimer > 0 ? "#AEAEB2" : "#007AFF", cursor: otpTimer > 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              <RefreshCw style={{ width: 11, height: 11 }} />
                              {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : emailMode === "otp-email" ? (
                      <>
                        <p style={{ fontSize: 13, color: "#636366", marginBottom: 20 }}>We'll send a 6-digit code to your email</p>
                        <form onSubmit={handleSendEmailOtp} style={formStyle}>
                          <div>
                            <label style={labelStyle}>EMAIL</label>
                            <input type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} required
                              placeholder="doctor@hospital.in" style={inputStyle}
                              onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                              onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                          </div>
                          {error && <div style={errorStyle}>{error}</div>}
                          <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? <><BtnSpinner />Sending…</> : "Send OTP"}</button>
                          <button type="button" onClick={() => { setEmailMode("password"); setError(""); }}
                            style={{ background: "none", border: "none", color: "#636366", cursor: "pointer", fontSize: 13, textAlign: "center" as const }}>
                            ← Back to password login
                          </button>
                        </form>
                      </>
                    ) : (
                      <form onSubmit={handlePasswordLogin} style={formStyle}>
                        <div>
                          <label style={labelStyle}>EMAIL</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            placeholder="doctor@hospital.in" autoComplete="username" style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                            onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                        </div>
                        <div>
                          <label style={labelStyle}>PASSWORD</label>
                          <div style={{ position: "relative" }}>
                            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                              placeholder="••••••••" autoComplete="current-password" style={{ ...inputStyle, paddingRight: 44 }}
                              onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                              onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                            <button type="button" onClick={() => setShowPassword(s => !s)}
                              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#AEAEB2", cursor: "pointer", display: "flex", padding: 0 }}>
                              {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                            </button>
                          </div>
                          <div style={{ textAlign: "right", marginTop: 7 }}>
                            <button type="button" style={{ background: "none", border: "none", color: "#007AFF", fontSize: 12, cursor: "pointer", padding: 0 }}>Forgot password?</button>
                          </div>
                        </div>
                        {error && <div style={errorStyle}>{error}</div>}
                        <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? <><BtnSpinner />Signing in…</> : "Sign In to aethex"}</button>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, height: 1, background: "rgba(60,60,67,0.12)" }} />
                          <span style={{ fontSize: 11, color: "#AEAEB2" }}>or</span>
                          <div style={{ flex: 1, height: 1, background: "rgba(60,60,67,0.12)" }} />
                        </div>
                        <button type="button" onClick={() => { setEmailMode("otp-email"); setOtpEmail(email); setError(""); }} style={ghostBtnStyle}>
                          <ShieldCheck style={{ width: 15, height: 15, color: "#007AFF" }} />
                          <span>Email OTP (Passwordless)</span>
                        </button>
                      </form>
                    )}
                  </>
                )}

                {/* ── Phone tab ── */}
                {tab === "phone" && (
                  <>
                    <div ref={recaptchaContainerRef} />
                    {phoneMode === "phone-verify" ? (
                      <>
                        <p style={{ fontSize: 13, color: "#636366", marginBottom: 20 }}>
                          Enter the 6-digit code sent to <strong style={{ color: "#1C1C1E" }}>+91 {phone}</strong>
                        </p>
                        <form onSubmit={handleVerifyPhoneOtp} style={formStyle}>
                          <div>
                            <label style={labelStyle}>OTP CODE</label>
                            <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                              value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                              required placeholder="• • • • • •"
                              style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.6em", fontFamily: "monospace" }}
                              onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                              onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                          </div>
                          {error && <div style={errorStyle}>{error}</div>}
                          <button type="submit" disabled={loading || phoneOtp.length !== 6} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {loading ? <><BtnSpinner />Verifying…</> : "Verify & Sign In"}
                          </button>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <button type="button" onClick={() => { setPhoneMode("phone-enter"); setPhoneOtp(""); setError(""); }}
                              style={{ background: "none", border: "none", color: "#636366", cursor: "pointer" }}>← Change number</button>
                            <button type="button" disabled={phoneTimer > 0 || loading} onClick={resendPhoneOtp}
                              style={{ background: "none", border: "none", color: phoneTimer > 0 ? "#AEAEB2" : "#007AFF", cursor: phoneTimer > 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              <RefreshCw style={{ width: 11, height: 11 }} />
                              {phoneTimer > 0 ? `Resend in ${phoneTimer}s` : "Resend OTP"}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <form onSubmit={handleSendPhoneOtp} style={formStyle}>
                        <div>
                          <label style={labelStyle}>MOBILE NUMBER</label>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#F2F2F7", border: "1.5px solid rgba(60,60,67,0.2)", borderRadius: 12, flexShrink: 0 }}>
                              <span style={{ fontSize: 16 }}>🇮🇳</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>+91</span>
                            </div>
                            <input type="tel" inputMode="numeric" maxLength={10}
                              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              required placeholder="98765 43210" style={{ ...inputStyle, flex: 1 }}
                              onFocus={e => { e.target.style.borderColor = "#007AFF"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.14)"; }}
                              onBlur={e => { e.target.style.borderColor = "rgba(60,60,67,0.2)"; e.target.style.boxShadow = "none"; }} />
                          </div>
                        </div>
                        {error && <div style={errorStyle}>{error}</div>}
                        <button type="submit" disabled={loading || phone.length !== 10} style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {loading ? <><BtnSpinner />Sending OTP…</> : "Send OTP via SMS"}
                        </button>
                        <p style={{ fontSize: 11, color: "#AEAEB2", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
                          An SMS will be sent to your Indian mobile number via Twilio.
                        </p>
                      </form>
                    )}
                  </>
                )}

                <p style={{ fontSize: 12, color: "#AEAEB2", textAlign: "center", margin: "20px 0 0" }}>
                  No account?{" "}
                  <Link href="/signup" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Create one free</Link>
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
