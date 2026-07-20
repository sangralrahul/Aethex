import { useState, useEffect, useRef } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, ShieldCheck, RefreshCw, GraduationCap, Building2, ChevronDown, Search } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { MEDICAL_COLLEGES, HOSPITALS } from "@/lib/india-institutions";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup" | "otp";
}

type Tab = "login" | "signup" | "otp";
type OtpStep = "email" | "verify";
type Role = "student" | "doctor" | "other";

function InstitutionCombobox({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: { name: string; city: string; state: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.length < 2
    ? []
    : options.filter(o =>
        o.name.toLowerCase().includes(query.toLowerCase()) ||
        o.city.toLowerCase().includes(query.toLowerCase()) ||
        o.state.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  useEffect(() => { setHighlighted(0); }, [query]);

  const select = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (filtered[highlighted]) select(filtered[highlighted].name); }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all text-sm"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul ref={listRef}
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: "#1A2035", border: "1px solid rgba(255,255,255,0.1)", maxHeight: 220, overflowY: "auto" }}>
          {filtered.map((opt, i) => (
            <li key={opt.name}
              onMouseDown={() => select(opt.name)}
              className="px-4 py-2.5 cursor-pointer transition-colors text-sm"
              style={{
                background: i === highlighted ? "rgba(0,194,168,0.15)" : "transparent",
                color: i === highlighted ? "#00C2A8" : "rgba(255,255,255,0.8)",
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
              <span className="font-medium">{opt.name}</span>
              <span className="ml-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{opt.city}, {opt.state}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 px-4 py-3 rounded-xl text-sm text-[#6c6c70]"
          style={{ background: "#1A2035", border: "1px solid rgba(255,255,255,0.1)" }}>
          No results — you can type your own
        </div>
      )}
    </div>
  );
}

export function AuthModal({ open, onClose, defaultMode = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [college, setCollege] = useState("");
  const [hospital, setHospital] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, login, otpLogin, googleLogin } = useUserAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [otpMethod, setOtpMethod] = useState<"email" | "phone">("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!open) { setTab(defaultMode); reset(); resetOtp(); }
  }, [open, defaultMode]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!open) return null;

  function reset() {
    setName(""); setEmail(""); setPassword(""); setError(""); setLoading(false);
    setRole("student"); setCollege(""); setHospital("");
  }

  function resetOtp() {
    setOtpStep("email"); setOtpEmail(""); setOtpCode("");
    setOtpTimer(0); setOtpSuccess(false); setError("");
    if (timerRef.current) clearInterval(timerRef.current);
    setPhoneNumber(""); setPhoneOtpCode(""); setPhoneStep("input");
    setConfirmationResult(null);
  }

  function switchTab(t: Tab) { setTab(t); reset(); resetOtp(); }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      googleLogin(result.user);
      onClose();
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Google Sign-In is not enabled for this domain.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for aethex.in and try again.");
      } else {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setPhoneLoading(true);
    setError("");
    try {
      const digits = phoneNumber.replace(/\D/g, "");
      const formatted = digits.length === 10 ? `+91${digits}` : digits.startsWith("91") && digits.length === 12 ? `+${digits}` : phoneNumber;
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current!, { size: "invisible" });
      }
      const result = await signInWithPhoneNumber(auth, formatted, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setPhoneStep("verify");
      startTimer();
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Check your number and try again.");
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!confirmationResult || phoneOtpCode.length !== 6) return;
    setPhoneLoading(true);
    setError("");
    try {
      const result = await confirmationResult.confirm(phoneOtpCode);
      const u = result.user;
      googleLogin({ uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL });
      setOtpSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError("Invalid OTP. Please check the code and try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  function startTimer() {
    setOtpTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (tab === "signup") {
        if (!name.trim()) { setError("Please enter your name."); return; }
        const res = signup(
          name.trim(), email, password, role,
          role === "student" ? college || undefined : undefined,
          role === "doctor" ? hospital || undefined : undefined,
        );
        if (!res.success) { setError(res.error || "Signup failed."); return; }
      } else {
        const res = login(email, password);
        if (!res.success) { setError(res.error || "Login failed."); return; }
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP."); return; }
      setOtpStep("verify");
      startTimer();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed."); return; }
      otpLogin(otpEmail, data.token);
      setOtpSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to resend OTP."); return; }
      setOtpCode(""); startTimer();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: Role; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "student", label: "Student", icon: <GraduationCap className="w-4 h-4" />, desc: "MBBS / PG" },
    { value: "doctor", label: "Doctor", icon: <Building2 className="w-4 h-4" />, desc: "Practising" },
    { value: "other", label: "Other", icon: <User className="w-4 h-4" />, desc: "General" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden">

        <div className="relative p-6 pb-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-[#6c6c70] hover:text-[#1c1c1e] hover:bg-black/10 transition-all">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00C2A8]/20 flex items-center justify-center">
              {tab === "otp" ? <ShieldCheck className="w-5 h-5 text-[#00C2A8]" /> : <Sparkles className="w-5 h-5 text-[#00C2A8]" />}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-[#1c1c1e]">
                {tab === "login" ? "Welcome back" : tab === "signup" ? "Create account" : "Email OTP Login"}
              </h2>
              <p className="text-sm text-[#6c6c70]">
                {tab === "login" ? "Sign in to your aethex account"
                  : tab === "signup" ? "Join 50,000+ medical professionals"
                  : "Passwordless · Secure · Instant"}
              </p>
            </div>
          </div>

          <div className="flex rounded-xl bg-black/5 p-1 mb-6">
            {(["login", "signup", "otp"] as const).map(t => (
              <button key={t} onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  tab === t ? "bg-[#00C2A8] text-[#F5F3EE]" : "text-[#6c6c70] hover:text-[#1c1c1e]"
                }`}>
                {t === "login" ? "Sign In" : t === "signup" ? "Sign Up" : "OTP"}
              </button>
            ))}
          </div>
        </div>

        {tab === "otp" ? (
          <div className="p-6 pt-2">
            <div ref={recaptchaRef} />
            {otpSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#00C2A8]/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-[#00C2A8]" />
                </div>
                <p className="text-[#1c1c1e] font-bold text-lg">Verified!</p>
                <p className="text-[#6c6c70] text-sm mt-1">Logging you in…</p>
              </div>
            ) : (
              <>
                {/* Email / Phone toggle */}
                <div className="flex rounded-xl bg-black/5 p-1 mb-5">
                  {(["email", "phone"] as const).map(m => (
                    <button key={m} type="button" onClick={() => { setOtpMethod(m); setError(""); }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${otpMethod === m ? "bg-[#00C2A8] text-[#F5F3EE]" : "text-[#6c6c70] hover:text-[#1c1c1e]"}`}>
                      {m === "email" ? "Email OTP" : "Phone OTP"}
                    </button>
                  ))}
                </div>

                {otpMethod === "email" ? (
                  otpStep === "email" ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                          <input type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} required
                            placeholder="doctor@hospital.in"
                            className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                        </div>
                      </div>
                      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}
                      <button type="submit" disabled={loading}
                        className="w-full py-3 bg-[#00C2A8] hover:bg-[#00D4B8] text-[#F5F3EE] font-bold rounded-xl transition-all disabled:opacity-60">
                        {loading ? "Sending OTP…" : "Send OTP"}
                      </button>
                      <p className="text-center text-xs text-[#8e8e93]">A 6-digit code will be sent to your email</p>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 bg-[#00C2A8]/10 border border-[#00C2A8]/20 rounded-xl text-sm text-[#00C2A8] text-center">
                        OTP sent to <strong>{otpEmail}</strong>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Enter 6-digit OTP</label>
                        <input type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                          value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))} required
                          placeholder="• • • • • •"
                          className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/25 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                      </div>
                      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}
                      <button type="submit" disabled={loading || otpCode.length !== 6}
                        className="w-full py-3 bg-[#00C2A8] hover:bg-[#00D4B8] text-[#F5F3EE] font-bold rounded-xl transition-all disabled:opacity-60">
                        {loading ? "Verifying…" : "Verify & Login"}
                      </button>
                      <div className="flex items-center justify-between text-xs">
                        <button type="button" onClick={() => { resetOtp(); }} className="text-[#6c6c70] hover:text-[#1c1c1e] transition-colors">
                          ← Change email
                        </button>
                        <button type="button" onClick={handleResendOtp} disabled={otpTimer > 0 || loading}
                          className="flex items-center gap-1 text-[#6c6c70] hover:text-[#00C2A8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <RefreshCw className="w-3 h-3" />
                          {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  phoneStep === "input" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Mobile Number</label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3 py-3 bg-black/5 border border-black/10 rounded-xl text-[#3c3c43] text-sm font-medium shrink-0">
                            🇮🇳 +91
                          </div>
                          <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className="flex-1 px-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                        </div>
                      </div>
                      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}
                      <button type="button" onClick={handleSendPhoneOtp} disabled={phoneLoading || phoneNumber.length !== 10}
                        className="w-full py-3 bg-[#00C2A8] hover:bg-[#00D4B8] text-[#F5F3EE] font-bold rounded-xl transition-all disabled:opacity-60">
                        {phoneLoading ? "Sending OTP…" : "Send OTP via SMS"}
                      </button>
                      <p className="text-center text-xs text-[#8e8e93]">OTP sent via Firebase · Indian numbers only</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-[#00C2A8]/10 border border-[#00C2A8]/20 rounded-xl text-sm text-[#00C2A8] text-center">
                        OTP sent to <strong>+91 {phoneNumber}</strong>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Enter 6-digit OTP</label>
                        <input type="text" inputMode="numeric" maxLength={6}
                          value={phoneOtpCode} onChange={e => setPhoneOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="• • • • • •"
                          className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/25 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                      </div>
                      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}
                      <button type="button" onClick={handleVerifyPhoneOtp} disabled={phoneLoading || phoneOtpCode.length !== 6}
                        className="w-full py-3 bg-[#00C2A8] hover:bg-[#00D4B8] text-[#F5F3EE] font-bold rounded-xl transition-all disabled:opacity-60">
                        {phoneLoading ? "Verifying…" : "Verify & Login"}
                      </button>
                      <div className="flex items-center justify-between text-xs">
                        <button type="button" onClick={() => { setPhoneStep("input"); setPhoneOtpCode(""); setError(""); }} className="text-[#6c6c70] hover:text-[#1c1c1e] transition-colors">
                          ← Change number
                        </button>
                        <button type="button" onClick={handleSendPhoneOtp} disabled={phoneLoading || otpTimer > 0}
                          className="flex items-center gap-1 text-[#6c6c70] hover:text-[#00C2A8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <RefreshCw className="w-3 h-3" />
                          {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="p-6 pt-2 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-black/10 bg-white hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {googleLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#8e8e93]" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span className="text-sm font-semibold text-[#1c1c1e]">
                {googleLoading ? "Signing in…" : `Continue with Google`}
              </span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10" />
              </div>
              <div className="relative flex justify-center text-xs text-[#8e8e93]">
                <span className="px-2 bg-white">or continue with email</span>
              </div>
            </div>

            {tab === "signup" && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                      placeholder="Dr. Priya Sharma"
                      className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-medium text-[#3c3c43] mb-2">I am a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map(r => (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all"
                        style={role === r.value ? {
                          background: "rgba(0,194,168,0.15)",
                          border: "1.5px solid rgba(0,194,168,0.5)",
                          color: "#00C2A8",
                        } : {
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.45)",
                        }}>
                        {r.icon}
                        <span>{r.label}</span>
                        <span className="text-[10px] opacity-60">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* College (for students) */}
                {role === "student" && (
                  <div>
                    <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">
                      <GraduationCap className="inline w-3.5 h-3.5 mr-1.5 opacity-60" />
                      Medical College
                      <span className="text-[#8e8e93] font-normal ml-1">(optional)</span>
                    </label>
                    <InstitutionCombobox
                      placeholder="Search your college…"
                      options={MEDICAL_COLLEGES}
                      value={college}
                      onChange={setCollege}
                    />
                  </div>
                )}

                {/* Hospital (for doctors) */}
                {role === "doctor" && (
                  <div>
                    <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">
                      <Building2 className="inline w-3.5 h-3.5 mr-1.5 opacity-60" />
                      Hospital / Institution
                      <span className="text-[#8e8e93] font-normal ml-1">(optional)</span>
                    </label>
                    <InstitutionCombobox
                      placeholder="Search your hospital…"
                      options={HOSPITALS}
                      value={hospital}
                      onChange={setHospital}
                    />
                  </div>
                )}
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="doctor@hospital.in"
                  className="w-full pl-10 pr-4 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e93]" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder={tab === "signup" ? "Min. 6 characters" : "Your password"}
                  minLength={tab === "signup" ? 6 : 1}
                  className="w-full pl-10 pr-12 py-3 bg-black/5 border border-black/10 rounded-xl text-[#1c1c1e] placeholder-black/30 focus:outline-none focus:border-[#00C2A8] focus:ring-1 focus:ring-[#00C2A8]/30 transition-all" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#3c3c43] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#00C2A8] hover:bg-[#00D4B8] text-[#F5F3EE] font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10" />
              </div>
              <div className="relative flex justify-center text-xs text-[#8e8e93]">
                <span className="px-2 bg-white">or</span>
              </div>
            </div>

            <button type="button" onClick={() => switchTab("otp")}
              className="w-full py-3 bg-black/5 hover:bg-black/10 border border-black/10 rounded-xl text-[#1c1c1e] font-medium transition-all flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00C2A8]" />
              Login with Email OTP (Passwordless)
            </button>

            <p className="text-center text-xs text-[#8e8e93]">
              {tab === "login" ? (
                <>Don't have an account? <button type="button" onClick={() => switchTab("signup")} className="text-[#00C2A8] hover:underline">Sign up free</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchTab("login")} className="text-[#00C2A8] hover:underline">Sign in</button></>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
