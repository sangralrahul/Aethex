/**
 * Sign in to Cadus: a calm, clinical sign-in page in the Cadus style. Email and
 * password, a one-time code by email, or Google, all handled by the Aethex
 * Worker on Cloudflare (lib/account.ts). On auth.aethex.in a sign-in returns
 * to cadus.aethex.in; the session cookie is shared by every aethex.in site.
 * Cadus needs an account, so there is no guest route; the aside explains the plans.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { isAuthHost, isCadusHost } from "@/lib/host";
import { authErrorMessage, googleSignInHref, sendEmailCode, signIn, signUp, signedInDestination, verifyEmailCode } from "@/lib/account";
import { LEGAL_PATH } from "@/lib/cadus/legal";
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
const nextPath = () => { try { const n = new URLSearchParams(window.location.search).get("next") || ""; return /^\/(?![/\\])/.test(n) ? n : ""; } catch { return ""; } };

type Method = "password" | "email";
type Step = "enter" | "verify";

const WHY = [
  { icon: ShieldCheck, title: "Checked twice", text: "A second model reviews every clinical answer for doses, interactions and red flags." },
  { icon: BookOpenText, title: "Sourced", text: "Guidelines and PubMed papers with their PMIDs, labelled by the strength of the evidence." },
  { icon: LockKeyhole, title: "Private", text: "Chats, cases and ward lists stay on your device. Identifiers are hidden before anything is sent." },
];

export default function CadusSignIn() {
  const [, setLocation] = useLocation();
  const { isLoggedIn } = useUserAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [method, setMethod] = useState<Method>("password");
  const [step, setStep] = useState<Step>("enter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState(authErrorMessage);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const look = (() => { try { const l = JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").look; return ["clinical", "editorial", "mono"].includes(l) ? l : "editorial"; } catch { return "editorial"; } })();
  const dark = typeof window !== "undefined" && (() => { try { return JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").theme === "dark"; } catch { return false; } })();
  const leaving = useRef(false);
  /** Set while a sign-up waits for its emailed code (a resend repeats the sign-up). */
  const [pending, setPending] = useState(false);

  /** Where Cadus lives from here: cadus.aethex.in from auth.aethex.in, else this site. */
  const cadusPath = (next = nextPath()) => next || (isCadusHost() ? "/" : "/ai-assistant");
  const toCadus = () => {
    if (leaving.current) return;
    leaving.current = true;
    const away = signedInDestination(nextPath() || "/");
    if (away) window.location.href = away;
    else setLocation(cadusPath());
  };
  // Already signed in (on any aethex.in site): straight on to Cadus.
  useEffect(() => { if (isLoggedIn) toCadus(); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps
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
    if (mode === "up") {
      if (name.trim().length < 2) throw new Error("Please enter your name.");
      if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
    }
    if (mode === "up") {
      // The account is created once the emailed code is entered.
      const r = await signUp(name.trim(), email.trim(), password);
      if (!r.ok) throw new Error(r.error);
      setPending(true); setMethod("email"); setStep("verify"); setTimer(60); setCode("");
      return;
    }
    const r = await signIn(email.trim(), password);
    if (!r.ok) throw new Error(r.error);
    finish();
  }); };
  const sendCode = (e?: FormEvent) => { e?.preventDefault(); void run(async () => {
    const r = pending ? await signUp(name.trim(), email.trim(), password) : await sendEmailCode(email.trim());
    if (!r.ok) throw new Error(r.error);
    setStep("verify"); setTimer(60); setCode("");
  }); };
  const verifyCode = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const r = await verifyEmailCode(email.trim(), code.trim(), mode === "up" ? name.trim() : undefined);
    if (!r.ok) throw new Error(r.error);
    finish();
  }); };
  // Google returns to Cadus directly (the Worker sets the session cookie on the way back).
  const googleHref = () => {
    const away = signedInDestination(nextPath() || "/");
    return googleSignInHref(away ?? `${window.location.origin}${cadusPath()}`);
  };
  const pick = (m: Method) => { setMethod(m); setStep("enter"); setError(""); setCode(""); setPending(false); };

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

              <a className="cx-si-google" href={googleHref()} aria-disabled={busy}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 38 46.5 31.8 46.5 24.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
                Continue with Google
              </a>
              <div className="cx-si-or"><span>or</span></div>

              <div className="cx-seg cx-si-seg" role="tablist" aria-label="Sign-in method">
                <button type="button" role="tab" aria-selected={method === "password"} className={method === "password" ? "on" : ""} onClick={() => pick("password")}><LockKeyhole size={14} /> Password</button>
                <button type="button" role="tab" aria-selected={method === "email"} className={method === "email" ? "on" : ""} onClick={() => pick("email")}><Mail size={14} /> Email code</button>
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
                <form className="cx-si-form" onSubmit={sendCode}>
                  <label className="cx-field"><span>Email</span><input className="cx-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@hospital.in" required /></label>
                  {mode === "up" && <label className="cx-field"><span>Name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Dr Ananya Rao" /></label>}
                  <small className="cx-si-hint">We'll email you a six-digit code. No password needed.</small>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"} <ArrowRight size={15} /></button>
                </form>
              ) : (
                <form className="cx-si-form" onSubmit={verifyCode}>
                  <button type="button" className="cx-si-back" onClick={() => { if (pending) pick("password"); else setStep("enter"); }}><ArrowLeft size={14} /> {email}</button>
                  {pending && <small className="cx-si-hint">We emailed you a code to confirm the address. Enter it to finish creating your account.</small>}
                  <label className="cx-field"><span>Code from your email</span><input className="cx-input cx-si-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required /></label>
                  {error && <p className="cx-si-err" role="alert">{error}</p>}
                  <button className="cx-btn primary cx-si-submit" type="submit" disabled={busy}>{busy ? "Checking…" : pending ? "Confirm and create account" : "Verify and sign in"} <ArrowRight size={15} /></button>
                  <button type="button" className="cx-si-resend" disabled={timer > 0 || busy} onClick={() => sendCode()}>{timer > 0 ? `Resend in ${timer} s` : "Resend the code"}</button>
                </form>
              ))}

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
