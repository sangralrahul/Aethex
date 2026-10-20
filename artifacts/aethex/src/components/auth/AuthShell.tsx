/**
 * The frame of the Aethex sign-in pages (login.aethex.in: sign in and create
 * an account). A dark brand panel that is alive: a drifting constellation that
 * reacts to the pointer, a pulse line, a product window playing short demos of
 * Cadus AI, the Study Hub and the store, floating feature chips and rotating
 * testimonials. The form sits on white with soft moving light. Phones show only
 * the form. Everything stops with reduced motion. The Cadus sign-in
 * (auth.aethex.in) has its own design.
 */
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft, BadgeCheck, BookOpen, Check, ClipboardList, GraduationCap, ReceiptText, ShieldCheck, ShoppingBag,
  Sparkles, Star, Timer, type LucideProps,
} from "lucide-react";
import { mainUrl } from "@/lib/host";

type Icon = ComponentType<LucideProps>;
const MARK = `${import.meta.env.BASE_URL}aethex-mark.png`;
const calmMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <a className={`au-brand${light ? " light" : ""}`} href={mainUrl("/")} aria-label="Aethex home">
      <span className="au-tile"><img src={MARK} alt="" width={26} height={26} /></span>
      <span className="au-word"><span className="sh">Aethex</span></span>
    </a>
  );
}

/* ------------------------------------------------------------------ the constellation */

function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const calm = calmMotion();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0, raf = 0, last = 0, nextPing = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; blue: boolean };
    let pts: P[] = [];
    const pings: { x: number; y: number; t: number }[] = [];
    const pointer = { x: -1e4, y: -1e4 };

    const seed = () => {
      const n = Math.max(26, Math.min(72, Math.round((w * h) / 15000)));
      pts = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2, s = 6 + Math.random() * 10;
        return { x: Math.random() * w, y: Math.random() * h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 0.8 + Math.random() * 1.5, blue: Math.random() < 0.3 };
      });
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const D = 132;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < D * D) {
            ctx.strokeStyle = `rgba(127,224,207,${(1 - Math.sqrt(d2) / D) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const px = a.x - pointer.x, py = a.y - pointer.y, pd = Math.sqrt(px * px + py * py);
        if (pd < 170) {
          ctx.strokeStyle = `rgba(160,236,222,${(1 - pd / 170) * 0.42})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = p.blue ? "rgba(140,155,245,.75)" : "rgba(127,224,207,.7)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const g of pings) {
        const k = g.t / 1.6;
        ctx.strokeStyle = `rgba(127,224,207,${0.55 * (1 - k)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(g.x, g.y, 3 + k * 22, 0, Math.PI * 2); ctx.stroke();
      }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!w || !h) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      for (const p of pts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }
      if (now > nextPing && pts.length) {
        const p = pts[Math.floor(Math.random() * pts.length)];
        pings.push({ x: p.x, y: p.y, t: 0 });
        nextPing = now + 900 + Math.random() * 1300;
      }
      for (const g of pings) g.t += dt;
      while (pings.length && pings[0].t > 1.6) pings.shift();
      draw();
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && !calm && w && h && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.round(r.width); h = Math.round(r.height);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (w && h) { if (!pts.length) seed(); draw(); start(); }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const host = canvas.parentElement;
    const move = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    const leave = () => { pointer.x = -1e4; pointer.y = -1e4; };
    host?.addEventListener("pointermove", move);
    host?.addEventListener("pointerleave", leave);
    const vis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : start());
    document.addEventListener("visibilitychange", vis);
    return () => {
      ro.disconnect(); cancelAnimationFrame(raf);
      host?.removeEventListener("pointermove", move);
      host?.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  return <canvas ref={ref} className="au-stars" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ the product window */

const TABS = [
  { id: "cadus", label: "Cadus AI", icon: Sparkles, url: "cadus.aethex.in" },
  { id: "study", label: "Study Hub", icon: GraduationCap, url: "aethex.in/study-hub" },
  { id: "store", label: "Store", icon: ShoppingBag, url: "aethex.in/orders" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const CHIPS: Record<TabId, [Icon, string][]> = {
  cadus: [[ShieldCheck, "Safety reviewed"], [BookOpen, "Sources on every answer"]],
  study: [[ClipboardList, "A new case every day"], [Timer, "Timed mock tests"]],
  store: [[BadgeCheck, "Genuine brands"], [ReceiptText, "Cash on delivery"]],
};
const SLIDE_MS = 7500;

function useTyping(text: string, wait: number, calm: boolean) {
  const [n, setN] = useState(calm ? text.length : 0);
  useEffect(() => {
    if (calm) return;
    let i = 0, iv = 0;
    const t = window.setTimeout(() => {
      iv = window.setInterval(() => { i += 2; setN(Math.min(i, text.length)); if (i >= text.length) window.clearInterval(iv); }, 26);
    }, wait);
    return () => { window.clearTimeout(t); window.clearInterval(iv); };
  }, [text, wait, calm]);
  return n;
}

function useSteps(times: number[], calm: boolean) {
  const [s, setS] = useState(calm ? times.length : 0);
  useEffect(() => {
    if (calm) return;
    const ts = times.map((ms, k) => window.setTimeout(() => setS(k + 1), ms));
    return () => ts.forEach((t) => window.clearTimeout(t));
  }, [calm]); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
}

const CADUS_Q = "Febrile neutropenia after chemotherapy. First hour?";
const CADUS_A = "Treat it as an emergency: take blood cultures and start IV broad-spectrum antibiotics within 60 minutes.";
function CadusDemo({ calm }: { calm: boolean }) {
  const n = useTyping(CADUS_A, 1100, calm);
  const done = n >= CADUS_A.length;
  return (
    <div className="au-d-cadus">
      <div className="q">{CADUS_Q}</div>
      <div className="a">
        <span className="who"><span className="tile"><Sparkles size={11} /></span>Cadus</span>
        {n === 0 ? <span className="typing" aria-label="Cadus is answering"><i /><i /><i /></span> : <p><span className="lab">Bottom line</span>{CADUS_A.slice(0, n)}{!done && <span className="caret" />}</p>}
        <div className={`chips${done ? " on" : ""}`}><span className="ok"><ShieldCheck size={11} /> Safety reviewed</span><span><BookOpen size={11} /> 3 sources</span></div>
      </div>
    </div>
  );
}

const OPTIONS = ["Phenytoin", "Ethosuximide", "Carbamazepine", "Phenobarbitone"];
function StudyDemo({ calm }: { calm: boolean }) {
  const phase = useSteps([1000, 1800, 2500], calm);
  return (
    <div className="au-d-study">
      <small>NEET-PG · Pharmacology</small>
      <b>Drug of choice for absence seizures in a child?</b>
      <div className="opts">
        {OPTIONS.map((o, k) => (
          <span key={o} className={k === 1 ? (phase >= 2 ? "right" : phase === 1 ? "pick" : "") : ""}>
            {String.fromCharCode(65 + k)}. {o}{k === 1 && phase >= 2 && <Check size={13} />}
          </span>
        ))}
      </div>
      <div className={`exp${phase >= 3 ? " on" : ""}`}><b>Correct.</b> Ethosuximide is first-line for typical absence seizures.</div>
    </div>
  );
}

const STEPS = ["Ordered", "Packed", "Shipped", "Delivered"];
const STATUS = ["Order placed", "Packed at the warehouse", "On its way to you", "Delivered"];
function StoreDemo({ calm }: { calm: boolean }) {
  const s = useSteps([900, 1800, 2700], calm);
  return (
    <div className="au-d-store">
      <div className="item">
        <img src={`${import.meta.env.BASE_URL}product-images/bp-monitor.jpg`} alt="" />
        <span><small>OMRON</small><b>HEM-7181 BP Monitor</b><em>₹1,799 · cash on delivery</em></span>
      </div>
      <div className="track" style={{ "--p": s / 3 } as CSSProperties}>
        <i className="bar"><i /></i>
        {STEPS.map((t, k) => <span key={t} className={k <= s ? "on" : ""}><b>{k < s || (k === 3 && s === 3) ? <Check size={11} /> : null}</b>{t}</span>)}
      </div>
      <p className="status" key={s}>{STATUS[s]}</p>
    </div>
  );
}

function LiveDemo() {
  const [tab, setTab] = useState<TabId>("cadus");
  const [hold, setHold] = useState(false);
  const [calm] = useState(calmMotion);
  useEffect(() => {
    if (calm || hold) return;
    const t = window.setTimeout(() => setTab((x) => TABS[(TABS.findIndex((s) => s.id === x) + 1) % TABS.length].id), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [tab, hold, calm]);
  const cur = TABS.find((t) => t.id === tab)!;
  return (
    <div className="au-live au-in" style={delay(0.38)} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="au-tabs" role="tablist" aria-label="Aethex products">
        {TABS.map(({ id, label, icon: I }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <I size={14} /> {label}{tab === id && !hold && !calm && <i className="prog" />}
          </button>
        ))}
      </div>
      <div className="au-win-wrap">
        <div className="au-win">
          <div className="au-win-bar"><i /><i /><i /><span key={cur.url}>{cur.url}</span></div>
          <div className="au-win-body" key={tab}>
            {tab === "cadus" ? <CadusDemo calm={calm} /> : tab === "study" ? <StudyDemo calm={calm} /> : <StoreDemo calm={calm} />}
          </div>
        </div>
        {CHIPS[tab].map(([I, t], k) => <span key={tab + t} className={`au-float f${k}`}><I size={13} /> {t}</span>)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ testimonials (real, as on the homepage) */

const QUOTES = [
  { quote: "Aethex has completely changed how I manage patient care. Cadus AI gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.", name: "Dr. Priya Sharma", role: "Cardiologist, Mumbai", initials: "PS" },
  { quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.", name: "Dr. Arjun Mehta", role: "General Physician, Delhi", initials: "AM" },
  { quote: "Cadus AI helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.", name: "Dr. Vikram Nair", role: "Neurologist, Chennai", initials: "VN" },
];

function Quotes() {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (calmMotion() || hold) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % QUOTES.length), 8000);
    return () => window.clearTimeout(t);
  }, [i, hold]);
  return (
    <figure className="au-quote au-in" style={delay(0.55)} onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="top">
        <span className="stars">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={13} fill="currentColor" />)}</span>
        <span className="dots">{QUOTES.map((q, k) => <button key={q.name} type="button" className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Show ${q.name}'s review`} />)}</span>
      </div>
      <div className="qs">
        {QUOTES.map((q, k) => (
          <div key={q.name} className={`qi${k === i ? " on" : ""}`} aria-hidden={k !== i}>
            <blockquote>"{q.quote}"</blockquote>
            <figcaption><span className="av">{q.initials}</span><span><b>{q.name}</b><small>{q.role}</small></span></figcaption>
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ the frame */

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="au">
      <style>{CSS}</style>
      <aside className="au-side">
        <span className="au-aurora a" aria-hidden="true" />
        <span className="au-aurora b" aria-hidden="true" />
        <Constellation />
        <svg className="au-pulse" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="auPulse" x1="0" x2="1">
              <stop offset="0" stopColor="#5fd3c0" stopOpacity="0" />
              <stop offset=".25" stopColor="#5fd3c0" stopOpacity=".9" />
              <stop offset=".75" stopColor="#7d8cf0" stopOpacity=".9" />
              <stop offset="1" stopColor="#7d8cf0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="bg" d="M0 110 H220 l16 -9 l12 9 H300 l10 20 l18 -100 l20 136 l14 -56 H500 l14 -11 l14 11 H680 l10 20 l18 -100 l20 136 l14 -56 H880 l14 -11 l14 11 H1200" />
          <path className="fg" d="M0 110 H220 l16 -9 l12 9 H300 l10 20 l18 -100 l20 136 l14 -56 H500 l14 -11 l14 11 H680 l10 20 l18 -100 l20 136 l14 -56 H880 l14 -11 l14 11 H1200" stroke="url(#auPulse)" />
        </svg>
        <div className="au-side-in">
          <AuthBrand />
          <div className="au-pitch">
            <p className="au-eyebrow au-in" style={delay(0.1)}>Your Aethex account</p>
            <h1 className="au-in" style={delay(0.18)}>One sign-in for everything on Aethex</h1>
            <p className="au-lead au-in" style={delay(0.26)}>The same account works on aethex.in, in Cadus AI on the web and on your desktop, and in the Study Hub.</p>
            <LiveDemo />
          </div>
          <Quotes />
        </div>
      </aside>
      <main className="au-main">
        <span className="au-glow a" aria-hidden="true" />
        <span className="au-glow b" aria-hidden="true" />
        <div className="au-top">
          <a className="au-back" href={mainUrl("/")}><ArrowLeft size={16} /> aethex.in</a>
          <span className="au-top-brand"><AuthBrand light /></span>
        </div>
        <div className="au-form-wrap">{children}</div>
        <p className="au-legal">
          By continuing you agree to the <a href={mainUrl("/terms-of-service")}>Terms</a> and the <a href={mainUrl("/privacy-policy")}>Privacy Policy</a>.
        </p>
      </main>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function Spinner() {
  return <span className="au-spin" aria-hidden="true" />;
}

const CSS = `
.au{min-height:100vh;display:grid;grid-template-columns:minmax(440px,47%) 1fr;background:#fff;color:#0b1220;
  font-family:var(--ax-font);-webkit-font-smoothing:antialiased;letter-spacing:normal}
.au *{box-sizing:border-box}
.au h1,.au h2,.au h3{font-family:var(--ax-display);color:inherit;letter-spacing:-.025em;margin:0}
.au-in{animation:auUp .8s cubic-bezier(.2,.7,.2,1) var(--d,0s) both}
@keyframes auUp{from{opacity:0;transform:translateY(14px)}}

/* ---------- brand panel */
.au-side{position:relative;overflow:hidden;color:#fff;background:#0b1220;isolation:isolate}
.au-side::before{content:"";position:absolute;inset:0;z-index:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:44px 44px;
  -webkit-mask-image:radial-gradient(ellipse 80% 70% at 40% 40%,#000 30%,transparent 80%);mask-image:radial-gradient(ellipse 80% 70% at 40% 40%,#000 30%,transparent 80%);pointer-events:none}
.au-aurora{position:absolute;z-index:0;width:620px;height:620px;border-radius:50%;filter:blur(70px);opacity:.55;pointer-events:none}
.au-aurora.a{top:-260px;left:-200px;background:radial-gradient(closest-side,rgba(95,211,192,.55),transparent);animation:auDrift 22s ease-in-out infinite alternate}
.au-aurora.b{bottom:-300px;right:-240px;background:radial-gradient(closest-side,rgba(99,117,224,.6),transparent);animation:auDrift 26s ease-in-out -8s infinite alternate-reverse}
@keyframes auDrift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(90px,60px) scale(1.12)}100%{transform:translate(-40px,120px) scale(.95)}}
.au-stars{position:absolute;inset:0;z-index:0;width:100%;height:100%;pointer-events:none}
.au-pulse{position:absolute;left:0;right:0;bottom:4%;z-index:0;width:100%;height:120px;pointer-events:none;opacity:.8}
.au-pulse path{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.au-pulse .bg{stroke:rgba(255,255,255,.06)}
.au-pulse .fg{stroke-width:2.4;stroke-dasharray:360 2400;stroke-dashoffset:2760;animation:auTrace 6s linear infinite}
@keyframes auTrace{to{stroke-dashoffset:0}}
.au-side-in{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;gap:34px;padding:36px clamp(40px,4vw,72px) 40px}

.au-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;width:max-content}
.au-tile{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:#fff;box-shadow:0 6px 18px -8px rgba(0,0,0,.5);animation:auMark .9s cubic-bezier(.2,1.3,.3,1) both}
@keyframes auMark{from{opacity:0;transform:translateY(6px) rotate(-14deg) scale(.7)}}
.au-tile img{display:block;width:26px;height:26px;object-fit:contain;transition:transform .35s cubic-bezier(.2,1.3,.3,1)}
.au-brand:hover .au-tile img{transform:rotate(-8deg) scale(1.08)}
.au-word{display:block;font-family:"Aethex Script","Pinyon Script","Great Vibes",cursive;font-weight:400;font-size:38px;line-height:1.3;letter-spacing:.01em;animation:axWordIn .7s cubic-bezier(.22,1,.36,1) .15s backwards}
.au-word .sh{display:block;padding:0 6px 0 2px;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:300% auto;animation:axShine 4s linear .7s infinite;
  background-image:linear-gradient(105deg,#c9d1df 0%,#dfe5ef 20%,#f4f6fb 38%,#ffffff 45%,#9fe3d6 50%,#ffffff 55%,#f4f6fb 62%,#dfe5ef 80%,#c9d1df 100%)}
.au-brand.light .au-tile{box-shadow:none;border:1px solid #e6e9ef;width:36px;height:36px;border-radius:10px}
.au-brand.light .au-tile img{width:23px;height:23px}
.au-brand.light .au-word{font-size:32px}
.au-brand.light .au-word .sh{background-image:linear-gradient(105deg,#1a1a2e 0%,#2d2d4e 20%,#4a4a6a 38%,#8585a8 45%,#b0b0cc 50%,#8585a8 55%,#4a4a6a 62%,#2d2d4e 80%,#1a1a2e 100%)}

.au-pitch{max-width:520px}
.au-eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 14px;font-size:14px;font-weight:600;color:#7fe0cf}
.au-eyebrow::before{content:"";width:22px;height:2px;border-radius:2px;background:#7fe0cf}
.au-side h1{font-size:clamp(28px,2.5vw,38px);line-height:1.12;font-weight:750;color:#fff}
.au-lead{margin:14px 0 0;font-size:15.5px;line-height:1.65;color:#aab4c3}

/* the product window */
.au-live{margin-top:26px}
.au-tabs{display:flex;gap:4px;width:max-content;max-width:100%;padding:4px;border-radius:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09)}
.au-tabs button{position:relative;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 13px;border:0;border-radius:8px;background:none;color:#aab4c3;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;overflow:hidden;transition:background .2s,color .2s}
.au-tabs button:hover{color:#fff}
.au-tabs button.on{background:#fff;color:#0b1220}
.au-tabs .prog{position:absolute;left:0;bottom:0;height:2px;background:#2b7a6f;animation:auProg ${SLIDE_MS}ms linear forwards}
@keyframes auProg{from{width:0}to{width:100%}}
.au-win-wrap{position:relative;margin-top:14px}
.au-win{position:relative;border-radius:14px;background:#fff;color:#0b1220;overflow:hidden;box-shadow:0 30px 60px -24px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.06);animation:auFloat 7s ease-in-out infinite}
@keyframes auFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.au-win-bar{display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;background:#f7f8fa;border-bottom:1px solid #e6e9ef}
.au-win-bar i{width:9px;height:9px;border-radius:50%;background:#e1e5ec}
.au-win-bar span{margin:0 auto;padding:3px 12px;border-radius:6px;background:#fff;border:1px solid #e6e9ef;font-size:11.5px;color:#667085;animation:auFade .4s ease}
.au-win-body{height:222px;padding:16px 18px 18px;animation:auFade .45s ease}
@keyframes auFade{from{opacity:0;transform:translateY(6px)}}

.au-d-cadus .q{margin-left:auto;width:max-content;max-width:88%;padding:9px 13px;border-radius:13px 13px 4px 13px;background:#f2f4f7;font-size:13.5px;color:#0b1220}
.au-d-cadus .a{margin-top:12px}
.au-d-cadus .who{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:#0b1220}
.au-d-cadus .who .tile{display:grid;place-items:center;width:20px;height:20px;border-radius:6px;background:#0b1220;color:#fff}
.au-d-cadus p{margin:8px 0 0;font-size:14px;line-height:1.55;color:#0b1220;min-height:44px}
.au-d-cadus .lab{display:block;margin-bottom:2px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2f7f72}
.au-d-cadus .caret{display:inline-block;width:7px;height:15px;margin-left:1px;vertical-align:-2px;background:#2b7a6f;animation:auBlink .8s steps(1) infinite}
@keyframes auBlink{50%{opacity:0}}
.au-d-cadus .typing{display:inline-flex;gap:4px;margin:12px 0 0 2px}
.au-d-cadus .typing i{width:6px;height:6px;border-radius:50%;background:#98a2b3;animation:auDot 1s ease-in-out infinite}
.au-d-cadus .typing i:nth-child(2){animation-delay:.15s}.au-d-cadus .typing i:nth-child(3){animation-delay:.3s}
@keyframes auDot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
.au-d-cadus .chips{display:flex;gap:6px;margin-top:10px;opacity:0;transform:translateY(4px);transition:opacity .4s,transform .4s}
.au-d-cadus .chips.on{opacity:1;transform:none}
.au-d-cadus .chips span{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;border:1px solid #e6e9ef;background:#f7f8fa;font-size:11.5px;color:#475467}
.au-d-cadus .chips .ok{background:#eaf5f2;border-color:#cfe7e1;color:#2f7f72}

.au-d-study small{display:block;font-size:11.5px;color:#667085}
.au-d-study>b{display:block;margin:5px 0 10px;font-size:14.5px;line-height:1.4;color:#0b1220}
.au-d-study .opts{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.au-d-study .opts span{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 10px;border-radius:9px;border:1px solid #e6e9ef;font-size:13px;color:#344054;transition:all .3s}
.au-d-study .opts span.pick{border-color:#98a2b3;background:#f7f8fa}
.au-d-study .opts span.right{border-color:#9fd2c6;background:#eaf5f2;color:#2f7f72;font-weight:600}
.au-d-study .exp{margin-top:10px;font-size:12.5px;line-height:1.5;color:#475467;opacity:0;transform:translateY(4px);transition:opacity .4s,transform .4s}
.au-d-study .exp.on{opacity:1;transform:none}
.au-d-study .exp b{color:#2f7f72}

.au-d-store .item{display:flex;align-items:center;gap:12px}
.au-d-store img{width:54px;height:54px;border-radius:10px;object-fit:cover;background:#f2f4f7}
.au-d-store small{display:block;font-size:11.5px;color:#667085}
.au-d-store .item b{display:block;font-size:14.5px;color:#0b1220}
.au-d-store em{display:block;margin-top:2px;font-style:normal;font-size:12px;color:#475467}
.au-d-store .track{position:relative;display:grid;grid-template-columns:repeat(4,1fr);margin-top:18px}
.au-d-store .track .bar{position:absolute;left:12.5%;right:12.5%;top:9px;height:2px;background:#e6e9ef}
.au-d-store .track .bar i{display:block;height:100%;width:calc(var(--p) * 100%);background:#2b7a6f;transition:width .6s ease}
.au-d-store .track span{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11.5px;color:#98a2b3;transition:color .3s}
.au-d-store .track span b{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:2px solid #e6e9ef;background:#fff;color:#fff;transition:all .3s}
.au-d-store .track span.on{color:#0b1220;font-weight:600}
.au-d-store .track span.on b{border-color:#2b7a6f;background:#2b7a6f}
.au-d-store .status{margin:14px 0 0;font-size:13px;color:#2f7f72;font-weight:600;animation:auFade .35s ease}

/* floating feature chips */
.au-float{position:absolute;z-index:2;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(17,26,43,.92);border:1px solid rgba(255,255,255,.12);color:#e6ebf2;font-size:12.5px;font-weight:600;white-space:nowrap;box-shadow:0 14px 30px -14px rgba(0,0,0,.7);backdrop-filter:blur(6px);
  animation:auPop .5s cubic-bezier(.2,1.3,.3,1) both,auBob 5.5s ease-in-out infinite}
.au-float svg{color:#7fe0cf}
.au-float.f0{top:-15px;right:-14px;animation-delay:.5s,.9s}
.au-float.f1{bottom:-16px;right:30px;animation-delay:.8s,0s}
@keyframes auPop{from{opacity:0;transform:scale(.85) translateY(6px)}}
@keyframes auBob{0%,100%{translate:0 0}50%{translate:0 -6px}}

/* testimonials */
.au-quote{position:relative;margin:0;max-width:520px;padding:18px 22px 20px;border-radius:16px;background:rgba(17,26,43,.88);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(4px)}
.au-quote .top{display:flex;align-items:center;justify-content:space-between}
.au-quote .stars{display:flex;gap:2px;color:#f5b945}
.au-quote .dots{display:flex;gap:6px}
.au-quote .dots button{width:7px;height:7px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.22);cursor:pointer;transition:width .3s,background .3s}
.au-quote .dots button.on{width:20px;background:#7fe0cf}
.au-quote .qs{display:grid;margin-top:10px}
.au-quote .qi{grid-area:1/1;opacity:0;transform:translateY(6px);transition:opacity .6s ease,transform .6s ease;pointer-events:none}
.au-quote .qi.on{opacity:1;transform:none;pointer-events:auto}
.au-quote blockquote{margin:0;font-size:14px;line-height:1.65;color:#d6dbe4}
.au-quote figcaption{display:flex;align-items:center;gap:11px;margin-top:12px}
.au-quote .av{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:rgba(95,211,192,.16);color:#7fe0cf;font-size:12.5px;font-weight:700}
.au-quote b{display:block;font-size:14px;color:#fff}
.au-quote small{display:block;font-size:12.5px;color:#9aa5b5}

/* ---------- form side */
.au-main{position:relative;overflow:hidden;isolation:isolate;display:flex;flex-direction:column;min-height:100vh;padding:28px 40px}
.au-glow{position:absolute;z-index:-1;width:520px;height:520px;border-radius:50%;filter:blur(80px);opacity:.5;pointer-events:none}
.au-glow.a{top:-280px;right:-200px;background:radial-gradient(closest-side,rgba(95,211,192,.35),transparent);animation:auDrift 24s ease-in-out infinite alternate}
.au-glow.b{bottom:-300px;left:-220px;background:radial-gradient(closest-side,rgba(99,117,224,.25),transparent);animation:auDrift 28s ease-in-out -10s infinite alternate-reverse}
.au-top{display:flex;align-items:center;justify-content:space-between;min-height:40px}
.au-back{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:500;color:#475467;text-decoration:none;padding:6px 10px;margin-left:-10px;border-radius:8px;transition:background .15s,color .15s}
.au-back:hover{background:#f2f4f7;color:#0b1220}
.au-back svg{transition:transform .2s}
.au-back:hover svg{transform:translateX(-3px)}
.au-top-brand{display:none}
.au-form-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;width:100%;max-width:400px;margin:0 auto;padding:32px 0}
.au-step>*{animation:auUp .6s cubic-bezier(.2,.7,.2,1) both}
.au-step>:nth-child(2){animation-delay:.06s}.au-step>:nth-child(3){animation-delay:.12s}.au-step>:nth-child(4){animation-delay:.18s}
.au-legal{margin:0;text-align:center;font-size:12.5px;color:#667085}
.au-legal a{color:#475467;text-decoration:underline;text-underline-offset:2px}
.au-legal a:hover{color:#0b1220}

.au-title{font-size:30px;line-height:1.15;font-weight:750;color:#0b1220}
.au-sub{margin:10px 0 0;font-size:15.5px;line-height:1.6;color:#475467}
.au-sub b{color:#0b1220;font-weight:600}
.au-body{margin-top:28px;display:flex;flex-direction:column;gap:16px}
.au-form{display:flex;flex-direction:column;gap:16px;margin:0}
.au-field{display:flex;flex-direction:column;gap:7px}
.au-label-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.au label,.au .au-label{font-size:14px;font-weight:600;color:#344054;transition:color .15s}
.au-field:focus-within label{color:#2b7a6f}
.au .au-input{width:100%;height:48px;padding:0 14px;border-radius:11px;border:1px solid #d0d5dd;background:#fff;color:#0b1220;font-size:15.5px;font-family:inherit;box-shadow:0 1px 2px rgba(16,24,40,.05);transition:border-color .15s,box-shadow .2s;outline:none}
.au .au-input::placeholder{color:#98a2b3;opacity:1}
.au .au-input:hover{border-color:#b9c0cb}
.au .au-input:focus{border-color:#2b7a6f;box-shadow:0 0 0 4px rgba(43,122,111,.14)}
.au .au-input.code{height:58px;text-align:center;font-size:26px;letter-spacing:.5em;padding-left:.5em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.au-pw{position:relative}
.au-pw .au-input{padding-right:48px}
.au-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:8px;background:none;color:#667085;cursor:pointer}
.au-eye:hover{background:#f2f4f7;color:#0b1220}
.au-link{border:0;background:none;padding:0;font:inherit;font-size:14px;font-weight:600;color:#2b7a6f;cursor:pointer;text-decoration:none}
.au-link:hover{color:#1f5f56;text-decoration:underline;text-underline-offset:2px}
.au-link:disabled{color:#98a2b3;cursor:default;text-decoration:none}
.au-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;height:50px;border-radius:11px;font-family:inherit;font-size:15.5px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s,box-shadow .2s,transform .2s}
.au-btn.primary{border:0;background:#2b7a6f;color:#fff;box-shadow:0 8px 20px -10px rgba(43,122,111,.7)}
.au-btn.primary::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);transform:translateX(-120%);transition:transform .9s ease}
.au-btn.primary:hover{background:#246a60;box-shadow:0 12px 26px -12px rgba(43,122,111,.8)}
.au-btn.primary:hover::after{transform:translateX(120%)}
.au-btn.primary:active{transform:translateY(1px)}
.au-btn.google{border:1px solid #d0d5dd;background:#fff;color:#0b1220;box-shadow:0 1px 2px rgba(16,24,40,.05)}
.au-btn.google:hover{background:#f9fafb;border-color:#b9c0cb;transform:translateY(-1px);box-shadow:0 8px 18px -12px rgba(16,24,40,.35)}
.au-btn:disabled{opacity:.6;cursor:default;transform:none}
.au-btn:disabled::after{display:none}
.au-or{display:flex;align-items:center;gap:12px;font-size:13px;color:#667085}
.au-or::before,.au-or::after{content:"";flex:1;height:1px;background:#e4e7ec}
.au-err{padding:11px 14px;border-radius:10px;background:#fef3f2;border:1px solid #fecdca;color:#b42318;font-size:14px;line-height:1.5;animation:auShake .4s ease}
@keyframes auShake{20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
.au-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px}
.au-row .au-link.muted,.au-link.muted{color:#475467;font-weight:500}
.au-switch{margin:6px 0 0;text-align:center;font-size:14.5px;color:#475467}
.au-switch a{color:#2b7a6f;font-weight:600;text-decoration:none}
.au-switch a:hover{text-decoration:underline;text-underline-offset:2px}
.au-done{display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 0}
.au-done .ok{display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:#ecfdf3;color:#12805c;margin-bottom:16px;animation:auPop .5s cubic-bezier(.2,1.3,.3,1) both}
.au-done b{font-size:19px;color:#0b1220}
.au-done span{margin-top:6px;font-size:14.5px;color:#475467}
.au-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:auSpin .7s linear infinite}
.au-btn.google .au-spin{border-color:rgba(11,18,32,.15);border-top-color:#0b1220}
@keyframes auSpin{to{transform:rotate(360deg)}}

@media (max-height:880px){ .au-quote{display:none} }
@media (max-width:1180px){
  .au{grid-template-columns:minmax(400px,45%) 1fr}
  .au-win-body{height:264px}
  .au-side-in{padding:32px 36px 36px}
  .au-quote{display:none}
  .au-float.f0{right:-6px}
}
@media (max-width:980px){ .au-float{display:none} .au-tabs button{padding:0 10px;font-size:12.5px} }
@media (max-width:860px){
  .au{display:block}
  .au-side{display:none}
  .au-main{padding:18px 20px 24px}
  .au-top-brand{display:block}
  .au-back{display:none}
  .au-form-wrap{padding:28px 0 32px;justify-content:flex-start}
  .au-title{font-size:27px}
}
@media (prefers-reduced-motion:reduce){
  .au *,.au *::before,.au *::after{animation:none!important;transition:none!important}
}
`;
