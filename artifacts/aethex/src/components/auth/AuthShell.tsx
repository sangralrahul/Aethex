/**
 * The frame of the Aethex sign-in pages (login.aethex.in: sign in and create
 * an account). A dark brand panel with the Aethex mark and a live pulse line,
 * and the form on white. Phones show only the form, under the logo.
 * The Cadus sign-in (auth.aethex.in) has its own design.
 */
import type { ReactNode } from "react";
import { ArrowLeft, BookOpenCheck, ShoppingBag, Sparkles, Star } from "lucide-react";
import { mainUrl } from "@/lib/host";

const MARK = `${import.meta.env.BASE_URL}aethex-mark.png`;

const PRODUCTS = [
  { icon: Sparkles, t: "Cadus AI", d: "Clinical answers with sources, on the web and desktop" },
  { icon: BookOpenCheck, t: "Study Hub", d: "NEET-PG, NExT, FMGE and USMLE preparation" },
  { icon: ShoppingBag, t: "Medical Store", d: "Genuine supplies, delivered across India" },
];

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <a className={`au-brand${light ? " light" : ""}`} href={mainUrl("/")} aria-label="Aethex home">
      <span className="au-tile"><img src={MARK} alt="" width={26} height={26} /></span>
      <span className="au-word"><span className="sh">Aethex</span></span>
    </a>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="au">
      <style>{CSS}</style>
      <aside className="au-side" aria-hidden="false">
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
            <p className="au-eyebrow">Your Aethex account</p>
            <h1>One sign-in for everything you do on Aethex</h1>
            <p className="au-lead">The same account works on aethex.in, in Cadus AI on the web and on your desktop, and in the Study Hub.</p>
            <ul className="au-products">
              {PRODUCTS.map(({ icon: I, t, d }) => (
                <li key={t}><span className="ic"><I size={18} /></span><span><b>{t}</b><small>{d}</small></span></li>
              ))}
            </ul>
          </div>
          <figure className="au-quote">
            <span className="stars">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={13} fill="currentColor" />)}</span>
            <blockquote>"Aethex has completely changed how I manage patient care. Cadus AI gives me instant drug references mid-consultation — it's like having a pharmacologist in the room."</blockquote>
            <figcaption><span className="av">PS</span><span><b>Dr. Priya Sharma</b><small>Cardiologist, Mumbai</small></span></figcaption>
          </figure>
        </div>
      </aside>
      <main className="au-main">
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
.au{min-height:100vh;display:grid;grid-template-columns:minmax(420px,46%) 1fr;background:#fff;color:#0b1220;
  font-family:var(--ax-font);-webkit-font-smoothing:antialiased;letter-spacing:normal}
.au *{box-sizing:border-box}
.au h1,.au h2,.au h3{font-family:var(--ax-display);color:inherit;letter-spacing:-.025em;margin:0}

/* brand panel */
.au-side{position:relative;overflow:hidden;color:#fff;
  background:radial-gradient(700px 420px at 15% 0%,rgba(95,211,192,.20),transparent 60%),radial-gradient(600px 400px at 100% 100%,rgba(99,117,224,.20),transparent 60%),#0b1220}
.au-side::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:44px 44px;
  -webkit-mask-image:radial-gradient(ellipse 80% 70% at 40% 40%,#000 30%,transparent 80%);mask-image:radial-gradient(ellipse 80% 70% at 40% 40%,#000 30%,transparent 80%);pointer-events:none}
.au-pulse{position:absolute;left:0;right:0;top:46%;width:100%;height:150px;pointer-events:none;opacity:.9}
.au-pulse path{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.au-pulse .bg{stroke:rgba(255,255,255,.07)}
.au-pulse .fg{stroke-width:2.4;stroke-dasharray:360 2400;stroke-dashoffset:2760;animation:auTrace 6s linear infinite}
@keyframes auTrace{to{stroke-dashoffset:0}}
.au-side-in{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;gap:40px;padding:40px clamp(40px,4vw,72px) 44px}

.au-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;width:max-content}
.au-tile{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:#fff;box-shadow:0 6px 18px -8px rgba(0,0,0,.5)}
.au-tile img{display:block;width:26px;height:26px;object-fit:contain}
.au-word{display:block;font-family:"Aethex Script","Pinyon Script","Great Vibes",cursive;font-weight:400;font-size:38px;line-height:1.3;letter-spacing:.01em;animation:axWordIn .7s cubic-bezier(.22,1,.36,1) .1s backwards}
.au-word .sh{display:block;padding:0 6px 0 2px;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:300% auto;animation:axShine 4s linear .7s infinite;
  background-image:linear-gradient(105deg,#c9d1df 0%,#dfe5ef 20%,#f4f6fb 38%,#ffffff 45%,#9fe3d6 50%,#ffffff 55%,#f4f6fb 62%,#dfe5ef 80%,#c9d1df 100%)}
.au-brand.light .au-tile{box-shadow:none;border:1px solid #e6e9ef;width:36px;height:36px;border-radius:10px}
.au-brand.light .au-tile img{width:23px;height:23px}
.au-brand.light .au-word{font-size:32px}
.au-brand.light .au-word .sh{background-image:linear-gradient(105deg,#1a1a2e 0%,#2d2d4e 20%,#4a4a6a 38%,#8585a8 45%,#b0b0cc 50%,#8585a8 55%,#4a4a6a 62%,#2d2d4e 80%,#1a1a2e 100%)}

.au-pitch{max-width:500px}
.au-eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 16px;font-size:14px;font-weight:600;color:#7fe0cf}
.au-eyebrow::before{content:"";width:22px;height:2px;border-radius:2px;background:#7fe0cf}
.au-side h1{font-size:clamp(30px,2.7vw,40px);line-height:1.12;font-weight:750;color:#fff}
.au-lead{margin:16px 0 0;font-size:16px;line-height:1.65;color:#aab4c3}
.au-products{list-style:none;margin:30px 0 0;padding:0;display:grid;gap:10px}
.au-products li{position:relative;display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:#111a2b;border:1px solid rgba(255,255,255,.08)}
.au-products .ic{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border-radius:10px;background:rgba(95,211,192,.14);color:#7fe0cf}
.au-products b{display:block;font-size:15px;font-weight:600;color:#fff}
.au-products small{display:block;margin-top:2px;font-size:13.5px;color:#9aa5b5}

.au-quote{position:relative;margin:0;max-width:470px;padding:20px 22px;border-radius:16px;background:#111a2b;border:1px solid rgba(255,255,255,.08)}
.au-quote .stars{display:flex;gap:2px;color:#f5b945}
.au-quote blockquote{margin:10px 0 0;font-size:14.5px;line-height:1.65;color:#d6dbe4}
.au-quote figcaption{display:flex;align-items:center;gap:11px;margin-top:14px}
.au-quote .av{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:rgba(95,211,192,.16);color:#7fe0cf;font-size:12.5px;font-weight:700}
.au-quote b{display:block;font-size:14px;color:#fff}
.au-quote small{display:block;font-size:12.5px;color:#9aa5b5}

/* form side */
.au-main{display:flex;flex-direction:column;min-height:100vh;padding:28px 40px}
.au-top{display:flex;align-items:center;justify-content:space-between;min-height:40px}
.au-back{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:500;color:#475467;text-decoration:none;padding:6px 10px;margin-left:-10px;border-radius:8px}
.au-back:hover{background:#f2f4f7;color:#0b1220}
.au-top-brand{display:none}
.au-form-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;width:100%;max-width:400px;margin:0 auto;padding:32px 0}
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
.au label,.au .au-label{font-size:14px;font-weight:600;color:#344054}
.au .au-input{width:100%;height:48px;padding:0 14px;border-radius:11px;border:1px solid #d0d5dd;background:#fff;color:#0b1220;font-size:15.5px;font-family:inherit;box-shadow:0 1px 2px rgba(16,24,40,.05);transition:border-color .15s,box-shadow .15s;outline:none}
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
.au-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;height:50px;border-radius:11px;font-family:inherit;font-size:15.5px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s,box-shadow .15s,transform .15s}
.au-btn.primary{border:0;background:#2b7a6f;color:#fff;box-shadow:0 8px 20px -10px rgba(43,122,111,.7)}
.au-btn.primary:hover{background:#246a60}
.au-btn.primary:active{transform:translateY(1px)}
.au-btn.google{border:1px solid #d0d5dd;background:#fff;color:#0b1220;box-shadow:0 1px 2px rgba(16,24,40,.05)}
.au-btn.google:hover{background:#f9fafb;border-color:#b9c0cb}
.au-btn:disabled{opacity:.6;cursor:default;transform:none}
.au-or{display:flex;align-items:center;gap:12px;font-size:13px;color:#667085}
.au-or::before,.au-or::after{content:"";flex:1;height:1px;background:#e4e7ec}
.au-err{padding:11px 14px;border-radius:10px;background:#fef3f2;border:1px solid #fecdca;color:#b42318;font-size:14px;line-height:1.5}
.au-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px}
.au-row .au-link.muted{color:#475467;font-weight:500}
.au-switch{margin:6px 0 0;text-align:center;font-size:14.5px;color:#475467}
.au-switch a{color:#2b7a6f;font-weight:600;text-decoration:none}
.au-switch a:hover{text-decoration:underline;text-underline-offset:2px}
.au-hint{font-size:13px;color:#667085}
.au-done{display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 0}
.au-done .ok{display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:#ecfdf3;color:#12805c;margin-bottom:16px}
.au-done b{font-size:19px;color:#0b1220}
.au-done span{margin-top:6px;font-size:14.5px;color:#475467}
.au-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:auSpin .7s linear infinite}
.au-btn.google .au-spin{border-color:rgba(11,18,32,.15);border-top-color:#0b1220}
@keyframes auSpin{to{transform:rotate(360deg)}}

@media (max-width:1100px){
  .au{grid-template-columns:minmax(380px,42%) 1fr}
  .au-side-in{padding:36px 36px 40px}
  .au-quote{display:none}
}
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
