/**
 * Sign in (login.aethex.in): Google, email and password, or a code sent by email.
 * The frame and styles are in components/auth/AuthShell.tsx.
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Check, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { isLoginHost, loginUrl } from "@/lib/host";
import { authErrorMessage, googleSignInHref, sendEmailCode, signedInDestination, verifyEmailCode } from "@/lib/account";
import { AuthShell, GoogleIcon, Spinner } from "@/components/auth/AuthShell";

type EmailMode = "password" | "otp-email" | "otp-verify";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoggedIn } = useUserAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  const [error, setError] = useState(authErrorMessage);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // From login.aethex.in back to aethex.in; elsewhere, this site's home.
  const leaving = useRef(false);
  const goHome = () => {
    if (leaving.current) return;
    leaving.current = true;
    const away = signedInDestination();
    if (away) window.location.href = away;
    else setLocation("/");
  };

  useEffect(() => { if (isLoggedIn) goHome(); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Google sign-in runs through the Worker and comes straight back signed in.
  const handleGoogle = () => {
    setGoogleLoading(true);
    window.location.href = googleSignInHref(signedInDestination() ?? `${window.location.origin}/`);
  };

  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer((t) => (t <= 1 ? (clearInterval(id), 0) : t - 1)), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) { setError(res.error || "Invalid email or password."); return; }
      goHome();
    } finally { setLoading(false); }
  };

  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError(""); setLoading(true);
    try {
      const r = await sendEmailCode(otpEmail);
      if (!r.ok) { setError(r.error); return; }
      setOtpCode(""); setEmailMode("otp-verify"); setOtpTimer(60);
    } finally { setLoading(false); }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const r = await verifyEmailCode(otpEmail, otpCode);
      if (!r.ok) { setError(r.error); return; }
      setSuccess(true);
      setTimeout(() => goHome(), 800);
    } finally { setLoading(false); }
  };

  const toCode = () => { setEmailMode("otp-email"); setOtpEmail(email); setError(""); };
  const signupLink = isLoginHost()
    ? <Link href="/signup">Create an account</Link>
    : <a href={loginUrl("/signup")}>Create an account</a>;

  if (success) {
    return (
      <AuthShell>
        <div className="au-done" role="status">
          <span className="ok"><Check size={28} /></span>
          <b>You're signed in</b>
          <span>Taking you back to Aethex…</span>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {emailMode === "otp-verify" ? (
        <div className="au-step" key="verify">
          <h2 className="au-title">Check your email</h2>
          <p className="au-sub">Enter the 6-digit code we sent to <b>{otpEmail}</b>.</p>
          <div className="au-body">
            <form className="au-form" onSubmit={handleVerifyEmailOtp}>
              <div className="au-field">
                <label htmlFor="au-code">Sign-in code</label>
                <input id="au-code" className="au-input code" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" autoFocus
                  value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} required placeholder="000000" />
              </div>
              {error && <div className="au-err" role="alert">{error}</div>}
              <button type="submit" className="au-btn primary" disabled={loading || otpCode.length !== 6}>{loading ? <><Spinner />Verifying…</> : "Verify and sign in"}</button>
              <div className="au-row">
                <button type="button" className="au-link muted" onClick={() => { setEmailMode("otp-email"); setOtpCode(""); setError(""); }}>Use a different email</button>
                <button type="button" className="au-link" disabled={otpTimer > 0 || loading} onClick={() => { if (otpTimer <= 0) void handleSendEmailOtp(); }}>
                  <RefreshCw size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />{otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : emailMode === "otp-email" ? (
        <div className="au-step" key="code">
          <h2 className="au-title">Sign in with a code</h2>
          <p className="au-sub">We'll email you a 6-digit code. No password needed.</p>
          <div className="au-body">
            <form className="au-form" onSubmit={handleSendEmailOtp}>
              <div className="au-field">
                <label htmlFor="au-otp-email">Email</label>
                <input id="au-otp-email" className="au-input" type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} required autoFocus
                  placeholder="you@example.com" autoComplete="email" />
              </div>
              {error && <div className="au-err" role="alert">{error}</div>}
              <button type="submit" className="au-btn primary" disabled={loading}>{loading ? <><Spinner />Sending…</> : "Email me a code"}</button>
              <button type="button" className="au-link muted" style={{ alignSelf: "center" }} onClick={() => { setEmailMode("password"); setError(""); }}>Sign in with a password instead</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="au-step" key="password">
          <h2 className="au-title">Sign in to Aethex</h2>
          <p className="au-sub">Welcome back. One account for the store, the Study Hub and Cadus.</p>
          <div className="au-body">
            <button type="button" className="au-btn google" onClick={handleGoogle} disabled={googleLoading || loading}>
              {googleLoading ? <Spinner /> : <GoogleIcon />} Continue with Google
            </button>
            <div className="au-or">or sign in with email</div>
            <form className="au-form" onSubmit={handlePasswordLogin}>
              <div className="au-field">
                <label htmlFor="au-email">Email</label>
                <input id="au-email" className="au-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com" autoComplete="username" />
              </div>
              <div className="au-field">
                <div className="au-label-row">
                  <label htmlFor="au-password">Password</label>
                  <button type="button" className="au-link" onClick={toCode}>Forgot password?</button>
                </div>
                <div className="au-pw">
                  <input id="au-password" className="au-input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="Your password" autoComplete="current-password" />
                  <button type="button" className="au-eye" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              {error && <div className="au-err" role="alert">{error}</div>}
              <button type="submit" className="au-btn primary" disabled={loading}>{loading ? <><Spinner />Signing in…</> : "Sign in"}</button>
              <button type="button" className="au-link muted" style={{ alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={toCode}>
                <Mail size={15} /> Email me a sign-in code instead
              </button>
            </form>
            <p className="au-switch">New to Aethex? {signupLink}</p>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
