/**
 * Sign in to Cadus: a calm, clinical sign-in page in the Cadus style. Email and
 * password, a one-time code by email or SMS, or Google, with the same account
 * plumbing as the Aethex login page. Cadus needs an account, so there is no
 * guest route; the aside explains the plans.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { auth } from "@/lib/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import { isAuthHost, isCadusHost, mainUrl } from "@/lib/host";
import { completeSignIn } from "@/lib/handoff";
import { LEGAL_PATH } from "@/lib/cadus/legal";
import { passwordKey, rememberPasswordKey } from "@/lib/cadus/profileSync";
import CadusMark from "@/components/cadus/CadusMark";
import SignInScene, { SIGNIN_SCENE_CSS } from "@/components/cadus/SignInScene";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { CADUS_SIGNIN_CSS } from "@/components/cadus/cadus-signin-styles";
import { CADUS_CLINIC_CSS } from "@/components/cadus/cadus-clinic-styles";
import { CADUS_LOOKS_CSS } from "@/components/cadus/cadus-looks-styles";
// auth.aethex.in has the same short paths as cadus.aethex.in.
const shortPaths = () => isCadusHost() || isAuthHost();
const legalPath = (kind: "terms" | "privacy" | "disclaimer") => LEGAL_PATH(kind, shortPaths());
const plansPath = () => (shortPaths() ? "/plans" : "/ai-assistant/plans");
/** Where to go after signing in: a same-site path from ?next=, else Cadus. */
const nextPath = () => { try { const n = new URLSearchParams(window.location.search).get("next") || ""; return /^\/(?!\/)/.test(n) ? n : ""; } catch { return ""; } };

type Method = "password" | "email" | "phone";
type Step = "enter" | "verify";

const WHY = [
  { icon: ShieldCheck, title: "Checked twice", text: "A second model reviews every clinical answer for doses, interactions and red flags." },
  { icon: BookOpenText, title: "Sourced", text: "Guidelines and PubMed papers with their PMIDs, labelled by the strength of the evidence." },
  { icon: LockKeyhole, title: "Private", text: "Chats, cases and ward lists stay on your device. Identifiers are hidden before anything is sent." },
];

export default function CadusSignIn() {
  const [, setLocation] = useLocation();
  const { login, signup, otpLogin, phoneLogin, googleLogin, isLoggedIn } = useUserAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [method, setMethod] = useState<Method>("password");
  const [step, setStep] = useState<Step>("enter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const look = (() => { try { const l = JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").look; return ["clinical", "editorial", "mono"].includes(l) ? l : "editorial"; } catch { return "editorial"; } })();
  const dark = typeof window !== "undefined" && (() => { try { return JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").theme === "dark"; } catch { return false; } })();
  const confirmation = useRef<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const captcha = useRef<HTMLDivElement>(null);

  const toCadus = () => {
    const next = nextPath();
    if (isAuthHost()) void completeSignIn("cadus", next || "/");
    else if (next) setLocation(next);
    else if (isCadusHost()) setLocation("/");
    else setLocation("/ai-assistant");
  };
  useEffect(() => { if (isLoggedIn) toCadus(); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !isLoggedIn) googleLogin({ uid: user.id, displayName: (user.user_metadata?.full_name as string | undefined) ?? null, email: user.email ?? null, photoURL: (user.user_metadata?.avatar_url as string | undefined) ?? null });
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (timer <= 0) return;
    const id = window.setInterval(() => setTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  const run = async (fn: () => Promise<void> | void) => {
    setError("");
    setBusy(true);
    try { await fn(); } catch (e) { setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again."); } finally { setBusy(false); }
  };
  const finish = () => { setDone(true); window.setTimeout(toCadus, 700); };

  const withPassword = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    // The key that lets this account read its profile from the server on any device.
    // Made before signing in, so it is stored by the time the hand-off reads it.
    const key = await passwordKey(email, password);
    if (mode === "up") {
      if (name.trim().length < 2) throw new Error("Please enter your name.");
      if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
      const r = signup(name.trim(), email.trim(), password, "doctor");
      if (!r.success) throw new Error(r.error);
    } else {
      const r = login(email.trim(), password);
      if (!r.success) throw new Error(r.error);
    }
    rememberPasswordKey(key);
    finish();
  }); };
  const sendEmailCode = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const { data, error: err } = await supabase.functions.invoke("send-otp", { body: { email: email.trim() } });
    if (err || (data as any)?.error) throw new Error((data as any)?.error || err?.message || "The code couldn't be sent.");
    setStep("verify"); setTimer(60); setCode("");
  }); };
  const verifyEmailCode = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const { data, error: err } = await supabase.functions.invoke("verify-otp", { body: { email: email.trim(), otp: code.trim() } });
    if (err || !data || (data as any).error) throw new Error((data as any)?.error || err?.message || "That code didn't match.");
    const payload = data as { hashed_token?: string };
    if (payload.hashed_token) {
      const { error: v } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: payload.hashed_token });
      if (v) throw new Error(v.message);
    }
    otpLogin(email.trim(), "supabase");
    finish();
  }); };
  const fullPhone = () => { const d = phone.replace(/\D/g, ""); return d.length === 10 ? `+91${d}` : phone.trim(); };
  const sendSms = (e?: FormEvent) => { e?.preventDefault(); void run(async () => {
    verifier.current?.clear();
    verifier.current = new RecaptchaVerifier(auth, captcha.current!, { size: "invisible" });
    confirmation.current = await signInWithPhoneNumber(auth, fullPhone(), verifier.current);
    setStep("verify"); setTimer(60); setCode("");
  }); };
  const verifySms = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    if (!confirmation.current) throw new Error("The code has expired. Send a new one.");
    let user;
    try { user = (await confirmation.current.confirm(code.trim())).user; } catch { throw new Error("That code didn't match. Check it and try again."); }
    phoneLogin(user.phoneNumber || fullPhone(), "");
    finish();
  }); };
  const withGoogle = () => void run(async () => {
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (err) throw new Error(err.message || "Google sign-in didn't work.");
  });
  const pick = (m: Method) => { setMethod(m); setStep("enter"); setError(""); setCode(""); };

  const title = done ? "Signed in" : mode === "up" ? "Create your Cadus account" : "Sign in to Cadus";
  return (
    <div className={`cx cx-si ${dark ? "cx-dark" : "cx-light"}`} data-look={look}>
      <style>{CADUS_CSS + CADUS_SIGNIN_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS + SIGNIN_SCENE_CSS}</style>
      <aside className="cx-si-side" aria-hidden>
        <div className="cx-si-brand"><CadusMark size={30} /><span>Cadus<small>Clinical AI by Aethex</small></span></div>
        <div className="cx-si-pitch">
          <p className="cx-si-eyebrow">Clinical AI for India</p>
          <h2>Clinical answers you can check, for doctors and medical students.</h2>
          <SignInScene />
          <ul>{WHY.map((w) => <li key={w.title}><w.icon size={18} /><span><b>{w.title}.</b> {w.text}</span></li>)}</ul>
          <p className="cx-si-plans">Every account starts on the free Starter plan. <a href={plansPath()}>Core, Professional and Enterprise plans</a> add sources, image reading, the prescriber and institution-wide features.</p>
        </div>
        <p className="cx-si-foot">Decision support for qualified professionals and students. Not a substitute for clinical judgement. <a href={legalPath("terms")}>Terms</a> · <a href={legalPath("privacy")}>Privacy</a> · <a href={legalPath("disclaimer")}>Disclaimer</a></p>
      </aside>

      <main className="cx-si-main">
        <div className="cx-si-card" role="form" aria-labelledby="cx-si-title">
          <div className="cx-si-brand small"><CadusMark size={26} /><span>Cadus</span></div>
          {done ? (
            <div className="cx-si-done"><span className="cx-ob-done"><Check size={22} strokeWidth={2.6} /></span><h1 id="cx-si-title">{title}</h1><p>Taking you to Cadus…</p></div>
          ) : (
            <>
              <h1 id="cx-si-title">{title}</h1>
              <p className="cx-si-lead">{mode === "up" ? "A free account starts you on the Starter plan. Your chats and cases stay on this device." : "Cadus is for signed-in clinicians and students. Use your Aethex account to continue."}</p>

              <button type="button" className="cx-si-google" onClick={withGoogle} disabled={busy}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 38 46.5 31.8 46.5 24.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
                Continue with Google
              </button>
              <div className="cx-si-or"><span>or</span></div>

              <div className="cx-seg cx-si-seg" role="tablist" aria-label="Sign-in method">
                <button type="button" role="tab" aria-selected={method === "password"} className={method === "password" ? "on" : ""} onClick={() => pick("password")}><LockKeyhole size={14} /> Password</button>
                <button type="button" role="tab" aria-selected={method === "email"} className={method === "email" ? "on" : ""} onClick={() => pick("email")}><Mail size={14} /> Email code</button>
                <button type="button" role="tab" aria-selected={method === "phone"} className={method === "phone" ? "on" : ""} onClick={() => pick("phone")}><Phone size={14} /> SMS code</button>
              </div>

              {method === "password" && (
                <form className="cx-si-form" onSubmit={withPassword}>
                  {mode === "up" && <label className="cx-field"><span>Name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Dr Ananya Rao" required /></label>}
                  <label className="cx-field"><span>Email</span><input className="cx-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@hospital.in" required /></label>
                  <label className="cx-field">
                    <span>Password</span>
                    <span className="cx-si-pw">
                      <input className="cx-input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} required />
                      <button type="button" className="cx-ib" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </span>
                  </label>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"} <ArrowRight size={15} /></button>
                </form>
              )}
              {method === "email" && (step === "enter" ? (
                <form className="cx-si-form" onSubmit={sendEmailCode}>
                  <label className="cx-field"><span>Email</span><input className="cx-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@hospital.in" required /></label>
                  <small className="cx-si-hint">We'll email you a six-digit code. No password needed.</small>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"} <ArrowRight size={15} /></button>
                </form>
              ) : (
                <form className="cx-si-form" onSubmit={verifyEmailCode}>
                  <button type="button" className="cx-si-back" onClick={() => setStep("enter")}><ArrowLeft size={14} /> {email}</button>
                  <label className="cx-field"><span>Code from your email</span><input className="cx-input cx-si-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required /></label>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Checking…" : "Verify and sign in"} <ArrowRight size={15} /></button>
                  <button type="button" className="cx-si-resend" disabled={timer > 0 || busy} onClick={(e) => sendEmailCode(e)}>{timer > 0 ? `Resend in ${timer} s` : "Resend the code"}</button>
                </form>
              ))}
              {method === "phone" && (step === "enter" ? (
                <form className="cx-si-form" onSubmit={sendSms}>
                  <label className="cx-field"><span>Mobile number</span><span className="cx-si-phone"><em>+91</em><input className="cx-input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel-national" placeholder="98765 43210" required /></span></label>
                  <small className="cx-si-hint">We'll text you a code. Standard SMS rates may apply.</small>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"} <ArrowRight size={15} /></button>
                </form>
              ) : (
                <form className="cx-si-form" onSubmit={verifySms}>
                  <button type="button" className="cx-si-back" onClick={() => setStep("enter")}><ArrowLeft size={14} /> {fullPhone()}</button>
                  <label className="cx-field"><span>Code from the SMS</span><input className="cx-input cx-si-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required /></label>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Checking…" : "Verify and sign in"} <ArrowRight size={15} /></button>
                  <button type="button" className="cx-si-resend" disabled={timer > 0 || busy} onClick={() => sendSms()}>{timer > 0 ? `Resend in ${timer} s` : "Resend the code"}</button>
                </form>
              ))}
              <div ref={captcha} />

              <p className="cx-si-switch">
                {mode === "up" ? <>Already have an account? <button type="button" onClick={() => { setMode("in"); setError(""); }}>Sign in</button></> : <>New to Aethex? <button type="button" onClick={() => { setMode("up"); pick("password"); }}>Create an account</button></>}
              </p>
              <p className="cx-si-legal">By continuing you agree to the <a href={legalPath("terms")}>Terms of use</a> and <a href={legalPath("privacy")}>Privacy policy</a>. Cadus is decision support, not a substitute for clinical judgement.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
