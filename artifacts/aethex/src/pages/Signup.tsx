/**
 * Create an account (login.aethex.in/signup): Google, or name, email and
 * password confirmed by a code sent by email. A new account then sees onboarding.
 * The frame and styles are in components/auth/AuthShell.tsx.
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { isLoginHost, loginUrl } from "@/lib/host";
import { authErrorMessage, googleSignInHref, signedInDestination, verifyEmailCode } from "@/lib/account";
import { AuthShell, GoogleIcon, Spinner } from "@/components/auth/AuthShell";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signup, isLoggedIn } = useUserAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(authErrorMessage);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // After the form, the emailed code confirms the address and creates the account.
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeTimer, setCodeTimer] = useState(0);
  useEffect(() => {
    if (codeTimer <= 0) return;
    const id = setInterval(() => setCodeTimer((t) => (t <= 1 ? (clearInterval(id), 0) : t - 1)), 1000);
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
    setGoogleLoading(true);
    try { localStorage.removeItem("aethex_onboarded"); } catch { /* blocked */ }
    window.location.href = googleSignInHref(signedInDestination("/onboarding") ?? `${window.location.origin}/onboarding`);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (!name.trim()) { setError("Please enter your full name."); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      try { localStorage.removeItem("aethex_onboarded"); } catch { /* blocked */ }
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

  const signinLink = isLoginHost()
    ? <Link href="/login">Sign in</Link>
    : <a href={loginUrl("/")}>Sign in</a>;

  if (awaitingCode) {
    return (
      <AuthShell>
        <div className="au-step" key="confirm">
        <h2 className="au-title">Confirm your email</h2>
        <p className="au-sub">We sent a 6-digit code to <b>{email}</b>. Enter it to confirm the address and create your account.</p>
        <div className="au-body">
          <form className="au-form" onSubmit={handleVerifyCode}>
            <div className="au-field">
              <label htmlFor="au-code">Confirmation code</label>
              <input id="au-code" className="au-input code" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" autoFocus
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required placeholder="000000" />
            </div>
            {error && <div className="au-err" role="alert">{error}</div>}
            <button type="submit" className="au-btn primary" disabled={loading || code.length !== 6}>{loading ? <><Spinner />Checking…</> : "Confirm and create account"}</button>
            <div className="au-row">
              <button type="button" className="au-link muted" onClick={() => { setAwaitingCode(false); setError(""); }}>Change details</button>
              <button type="button" className="au-link" disabled={codeTimer > 0 || loading} onClick={() => void resendCode()}>
                <RefreshCw size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />{codeTimer > 0 ? `Resend in ${codeTimer}s` : "Resend code"}
              </button>
            </div>
          </form>
        </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="au-step" key="details">
      <h2 className="au-title">Create your Aethex account</h2>
      <p className="au-sub">Free to join. One account for the store, the Study Hub and Cadus.</p>
      <div className="au-body">
        <button type="button" className="au-btn google" onClick={handleGoogle} disabled={googleLoading || loading}>
          {googleLoading ? <Spinner /> : <GoogleIcon />} Sign up with Google
        </button>
        <div className="au-or">or with email</div>
        <form className="au-form" onSubmit={handleEmailSignup}>
          <div className="au-field">
            <label htmlFor="au-name">Full name</label>
            <input id="au-name" className="au-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required
              placeholder="Dr. Priya Sharma" autoComplete="name" />
          </div>
          <div className="au-field">
            <label htmlFor="au-email">Email</label>
            <input id="au-email" className="au-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="au-field">
            <label htmlFor="au-password">Password</label>
            <div className="au-pw">
              <input id="au-password" className="au-input" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="At least 8 characters" autoComplete="new-password" />
              <button type="button" className="au-eye" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {error && <div className="au-err" role="alert">{error}</div>}
          <button type="submit" className="au-btn primary" disabled={loading}>{loading ? <><Spinner />Creating account…</> : "Create account"}</button>
        </form>
        <p className="au-switch">Already have an account? {signinLink}</p>
      </div>
      </div>
    </AuthShell>
  );
}
