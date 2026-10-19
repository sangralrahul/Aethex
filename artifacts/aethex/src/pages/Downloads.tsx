/**
 * The Cadus desktop download page: downloads.aethex.in, and /downloads on
 * aethex.in and cadus.aethex.in. Windows (x64 and ARM) and Linux, macOS coming
 * soon. Picks the right download for the visitor's computer and lists every
 * file with its size and SHA-256, install help, requirements and release notes.
 *
 * Look: dark, with live animation (an aurora background, a Cadus window that
 * answers clinical questions on its own, scroll-in sections, spotlight cards).
 * Everything still works, and stays still, with "reduce motion" on.
 *
 * The installers are served from Cloudflare R2 through the Worker at
 * downloads.aethex.in/cadus/<version>/; the list comes from
 * lib/downloads/release.json, written by desktop/scripts/manifest.mjs.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, type HTMLAttributes } from "react";
import {
  ArrowRight, AppWindow, Check, ChevronDown, Copy, Cpu, Download, FileDown, HardDrive, Laptop, LockKeyhole, Mail, Mic,
  RefreshCw, ShieldCheck, Sparkles, Terminal, UserRound, Wifi, WifiOff,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { FONT_FACES } from "@/components/cadus/cadus-styles";
import { LEGAL_PATH, SUPPORT_EMAIL } from "@/lib/cadus/legal";
import { cadusUrl, isCadusHost } from "@/lib/host";
import RELEASE from "@/lib/downloads/release.json";

type FileEntry = (typeof RELEASE.files)[number];
type Os = "windows" | "mac" | "linux" | "mobile" | "unknown";
type Detected = { os: Os; arch: "x64" | "arm64" | "unknown" };

const byId = (id: string) => RELEASE.files.find((f) => f.id === id) as FileEntry;
const mb = (n: number) => `${(n / 1048576).toFixed(0)} MB`;
const releasedOn = new Date(`${RELEASE.released}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The visitor's system, from Client Hints where the browser offers them (that is how Windows on ARM shows up). */
async function detect(): Promise<Detected> {
  const ua = navigator.userAgent;
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string; mobile?: boolean; getHighEntropyValues?: (h: string[]) => Promise<{ architecture?: string; bitness?: string; platform?: string }> } }).userAgentData;
  if (uaData?.mobile || /Android|iPhone|iPad|iPod/i.test(ua)) return { os: "mobile", arch: "unknown" };
  let os: Os = /Windows/i.test(ua) ? "windows" : /Mac OS X|Macintosh/i.test(ua) ? "mac" : /Linux|X11/i.test(ua) ? "linux" : "unknown";
  let arch: Detected["arch"] = /arm64|aarch64/i.test(ua) ? "arm64" : os === "unknown" ? "unknown" : "x64";
  try {
    const h = await uaData?.getHighEntropyValues?.(["architecture", "bitness", "platform"]);
    if (h?.platform === "Windows") os = "windows";
    if (h?.platform === "macOS") os = "mac";
    if (h?.architecture === "arm") arch = "arm64";
    if (h?.architecture === "x86" && h.bitness === "64") arch = "x64";
  } catch { /* not offered */ }
  return { os, arch };
}

const MAC_MAIL = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Tell me when Cadus for Mac is ready")}&body=${encodeURIComponent("Please email me when the Cadus app for macOS is available.\n\nMy Mac: Apple silicon / Intel (delete one)")}`;

/* ------------------------------------------------------------------ motion helpers */

/** Sections fade and rise in as they scroll into view. */
function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".rv"));
    if (reducedMotion() || typeof IntersectionObserver === "undefined") { items.forEach((i) => i.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root]);
}

/** A card whose border and background light up under the pointer. */
function Spot({ className = "", children, ...rest }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return <article className={`spot ${className}`} onPointerMove={move} {...rest}>{children}</article>;
}

/** A number that counts up once it is on screen. */
function CountUp({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(reducedMotion() ? to : 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === "undefined") { setV(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{v.toFixed(decimals)}{suffix}</span>;
}

/* ------------------------------------------------------------------ the live Cadus window */

const DEMOS = [
  {
    q: "Febrile neutropenia in a 54-year-old on chemotherapy: first hour?",
    bottom: "Treat as an emergency: take cultures and start empirical broad-spectrum IV antibiotics within 60 minutes.",
    points: ["Blood cultures before the first dose, but never delay antibiotics for them", "Screen for sepsis: lactate, BP, urine output", "Choose the antibiotic by local policy and allergy history"],
    tag: "Oncology",
  },
  {
    q: "3-year-old with croup and stridor at rest: what now?",
    bottom: "Moderate to severe croup: give oral dexamethasone now, and nebulised adrenaline for stridor at rest.",
    points: ["Keep the child calm, on a parent's lap", "Observe for 2 to 4 hours after adrenaline", "Escalate if stridor persists or saturation falls"],
    tag: "Paediatrics",
  },
  {
    q: "Warfarin and clarithromycin together: is it safe?",
    bottom: "A significant interaction: clarithromycin raises the INR and the risk of bleeding.",
    points: ["Prefer another antibiotic if one is suitable", "If it is used, check the INR within 3 to 5 days", "Tell the patient which bleeding signs to watch for"],
    tag: "Drug interactions",
  },
];

type Phase = "typing" | "thinking" | "answering" | "done";

function LiveWindow() {
  const still = reducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(still ? "done" : "typing");
  const [typed, setTyped] = useState(still ? DEMOS[0].q.length : 0);
  const [words, setWords] = useState(still ? 999 : 0);
  const demo = DEMOS[i];
  const answerWords = useMemo(() => [demo.bottom, ...demo.points].join(" \u0000 ").split(" "), [demo]);

  useEffect(() => {
    if (still) return;
    let t: number;
    if (phase === "typing") {
      if (typed < demo.q.length) t = window.setTimeout(() => setTyped(typed + 1), 28 + Math.random() * 40);
      else t = window.setTimeout(() => setPhase("thinking"), 450);
    } else if (phase === "thinking") {
      t = window.setTimeout(() => setPhase("answering"), 1500);
    } else if (phase === "answering") {
      if (words < answerWords.length) t = window.setTimeout(() => setWords(words + 1), 45);
      else t = window.setTimeout(() => setPhase("done"), 200);
    } else {
      t = window.setTimeout(() => { setI((i + 1) % DEMOS.length); setTyped(0); setWords(0); setPhase("typing"); }, 4200);
    }
    return () => window.clearTimeout(t);
  }, [still, phase, typed, words, demo, answerWords.length, i]);

  // Split the streamed words back into the bottom line and the points.
  const shown = answerWords.slice(0, words).join(" ").split(" \u0000 ");
  const asked = phase !== "typing";
  const answering = phase === "answering" || phase === "done";

  // A gentle 3D tilt that follows the pointer.
  const tilt = useRef<HTMLDivElement>(null);
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (still || !tilt.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    tilt.current.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  };
  const onLeave = () => { if (tilt.current) tilt.current.style.transform = ""; };

  return (
    <div className="lw-stage" onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      <div className="lw-glow" />
      <div className="lw" ref={tilt}>
        <div className="lw-bar"><i /><i /><i /><span><CadusMark size={13} variant="mono" color="currentColor" /> Cadus</span><em>{demo.tag}</em></div>
        <div className="lw-body">
          <aside>
            <CadusMark size={20} variant="mono" color="currentColor" thinking={phase === "thinking"} />
            <b className="on" /><b /><b /><b />
          </aside>
          <div className="lw-page">
            <div className="lw-chat">
              {asked && <div className="lw-q" key={`q${i}`}>{demo.q}</div>}
              {phase === "thinking" && (
                <div className="lw-think"><span className="lw-dots"><i /><i /><i /></span> Checking guidelines and sources</div>
              )}
              {answering && (
                <div className="lw-a" key={`a${i}`}>
                  <strong>Bottom line</strong>
                  <p>{shown[0]}{phase === "answering" && shown.length === 1 && <span className="lw-caret" />}</p>
                  {shown.length > 1 && (
                    <ul>
                      {shown.slice(1).map((p, k) => <li key={k}>{p}{phase === "answering" && k === shown.length - 2 && <span className="lw-caret" />}</li>)}
                    </ul>
                  )}
                  {phase === "done" && (
                    <div className="lw-chips"><span><ShieldCheck size={11} /> Safety reviewed</span><span><Sparkles size={11} /> 3 sources</span></div>
                  )}
                </div>
              )}
            </div>
            <div className={`lw-input ${phase === "typing" ? "live" : ""}`}>
              <span>{phase === "typing" ? <>{demo.q.slice(0, typed)}<span className="lw-caret" /></> : "Ask Cadus anything clinical"}</span>
              <i><ArrowRight size={13} /></i>
            </div>
          </div>
        </div>
      </div>
      <div className="lw-float f1"><ShieldCheck size={14} /> Every answer safety-reviewed</div>
      <div className="lw-float f2"><RefreshCw size={14} /> Always the latest Cadus</div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function FileRow({ f, primary }: { f: FileEntry; primary?: boolean }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(f.sha256).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }); };
  return (
    <div className={`dl-file ${primary ? "best" : ""}`} data-file={f.id}>
      <div className="dl-file-main">
        <div>
          <b>{f.os === "windows" ? (f.arch === "arm64" ? "ARM64" : "64-bit (x64)") : f.kind}</b>
          <small>{f.os === "windows" ? "Installer (.exe)" : "x64"} · {mb(f.size)} · <button type="button" className="dl-link" onClick={() => setShown(!shown)} aria-expanded={shown}>SHA-256</button></small>
        </div>
        <a className={`cx-btn ${primary ? "primary" : ""}`} href={f.url} download={f.file} rel="noopener"><Download size={14} /> Download</a>
      </div>
      {shown && (
        <div className="dl-hash">
          <code>{f.sha256}</code>
          <button type="button" className="cx-ib" onClick={copy} aria-label="Copy SHA-256">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
        </div>
      )}
    </div>
  );
}

const FEATURES = [
  { icon: AppWindow, t: "Its own window", d: "Cadus on the taskbar and in the Start menu, one click away between patients, instead of lost among browser tabs." },
  { icon: RefreshCw, t: "Always up to date", d: "The app shows the live Cadus, so every improvement reaches you at once. It checks daily for a new app version too." },
  { icon: UserRound, t: "Your account, your chats", d: "Sign in with your Aethex account. Your chats, cases and settings work exactly as they do in the browser." },
  { icon: LockKeyhole, t: "Private and contained", d: "The window opens only Cadus and Aethex. Every other link goes to your usual browser, and the app adds no tracking." },
  { icon: WifiOff, t: "Knows when you're offline", d: "No connection? Cadus says so plainly and reconnects by itself the moment you're back online." },
  { icon: Mic, t: "Dictation and exports", d: "Dictate questions with your microphone, and save notes, letters and PDFs through the usual Save dialog." },
];

/* ------------------------------------------------------------------ page */

export default function Downloads() {
  const [sys, setSys] = useState<Detected>({ os: "unknown", arch: "unknown" });
  useEffect(() => { void detect().then(setSys); }, []);
  useEffect(() => {
    const before = document.title;
    document.title = "Download Cadus for Windows and Linux · Aethex";
    return () => { document.title = before; };
  }, []);
  const openCadus = isCadusHost() ? "/" : cadusUrl("/");
  const legal = (k: "terms" | "privacy" | "disclaimer") => (isCadusHost() ? LEGAL_PATH(k, true) : `https://cadus.aethex.in/${k}`);
  const [help, setHelp] = useState<"windows" | "linux">("windows");
  useEffect(() => { if (sys.os === "linux") setHelp("linux"); }, [sys.os]);
  const [scrolled, setScrolled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  const best = useMemo(() => {
    if (sys.os === "windows") return sys.arch === "arm64" ? byId("win-arm64") : byId("win-x64");
    if (sys.os === "linux") return byId("linux-appimage");
    return null;
  }, [sys]);
  const label = (f: FileEntry) => (f.os === "windows" ? `Windows ${f.arch === "arm64" ? "on ARM" : "(64-bit)"}` : f.id === "linux-deb" ? "Ubuntu / Debian" : "Linux");

  // Particles drifting up through the hero (positions fixed, so every render matches).
  const particles = useMemo(() => Array.from({ length: 22 }, (_, k) => ({
    left: `${(k * 37) % 100}%`, delay: `${-((k * 1.7) % 14)}s`, dur: `${12 + ((k * 5) % 10)}s`, size: `${2 + (k % 3)}px`,
  })), []);

  return (
    <div className="dl dlx" ref={root} onScroll={(e) => setScrolled((e.currentTarget as HTMLDivElement).scrollTop > 12)}>
      <style>{FONT_FACES + DOWNLOADS_CSS}</style>

      <div className="bg" aria-hidden="true">
        <div className="aurora a1" /><div className="aurora a2" /><div className="aurora a3" />
        <div className="grid" />
        {particles.map((p, k) => <i key={k} className="pt" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, width: p.size, height: p.size } as CSSProperties} />)}
      </div>

      <header className={`top ${scrolled ? "scrolled" : ""}`}>
        <a className="brand" href={openCadus}><span className="brand-mark"><CadusMark size={18} variant="mono" color="currentColor" /></span><span>Cadus</span><em>for desktop</em></a>
        <nav>
          <a href="#features">Features</a>
          <a href="#all">Downloads</a>
          <a href="#install">Install</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="cx-btn ghost" href={openCadus}>Open in the browser <ArrowRight size={14} /></a>
      </header>

      <main className="dl-main">
        <section className="dl-hero">
          <div className="dl-hero-text">
            <a className="pill rv" href="#notes"><span className="live" /> Version {RELEASE.version} is here <ArrowRight size={13} /></a>
            <h1 className="rv d1">Cadus, <span className="grad">on your desktop.</span></h1>
            <p className="dl-lead rv d2">The clinical AI you use in the browser, in its own fast window: one click from the taskbar, ready between patients, with your sign-in, chats and settings kept on this computer.</p>
            <div className="dl-cta rv d3">
              {best ? (
                <>
                  <a className="cx-btn primary dl-big shine" href={best.url} download={best.file} rel="noopener" data-best={best.id}><Download size={18} /> Download for {label(best)}</a>
                  <span className="dl-meta">{best.kind} · {mb(best.size)} · released {releasedOn} · <a href="#all">Other systems</a></span>
                </>
              ) : sys.os === "mac" ? (
                <>
                  <span className="cx-btn dl-big" aria-disabled="true"><Laptop size={18} /> Cadus for Mac is coming soon</span>
                  <span className="dl-meta">Until then, Cadus works fully in Safari or Chrome. <a href={openCadus}>Open Cadus</a> · <a href={MAC_MAIL}>Email me when it's ready</a></span>
                </>
              ) : sys.os === "mobile" ? (
                <>
                  <a className="cx-btn primary dl-big shine" href={openCadus}><ArrowRight size={18} /> Open Cadus on this phone</a>
                  <span className="dl-meta">On phones and tablets Cadus runs in the browser. Use "Add to Home Screen" to keep it a tap away.</span>
                </>
              ) : (
                <>
                  <a className="cx-btn primary dl-big shine" href="#all"><Download size={18} /> Choose your download</a>
                  <span className="dl-meta">Windows, Linux, and macOS soon.</span>
                </>
              )}
            </div>
            <div className="oses rv d4">
              <span className={sys.os === "windows" ? "on" : ""}><WindowsLogo /> Windows</span>
              <span className={sys.os === "linux" ? "on" : ""}><LinuxLogo /> Linux</span>
              <span className="soon"><AppleLogo /> macOS <em>soon</em></span>
            </div>
          </div>
          <div className="rv d2 hero-art"><LiveWindow /></div>
        </section>

        <section className="stats rv" aria-label="At a glance">
          <div><b><CountUp to={byId("win-x64").size / 1048576} suffix=" MB" /></b><span>Windows download</span></div>
          <div><b><CountUp to={3} /></b><span>Desktop builds, macOS next</span></div>
          <div><b>~<CountUp to={1} suffix=" min" /></b><span>From download to signed in</span></div>
          <div><b><CountUp to={24} suffix=" h" /></b><span>Between update checks</span></div>
        </section>

        <section className="sec" id="features" aria-labelledby="ft-t">
          <p className="eyebrow rv">Why the desktop app</p>
          <h2 className="rv d1" id="ft-t">Built for the moments between patients</h2>
          <div className="feat-grid">
            {FEATURES.map(({ icon: Icon, t, d }, k) => (
              <Spot key={t} className={`feat rv d${(k % 3) + 1}`}>
                <span className="ic"><Icon size={18} /></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </Spot>
            ))}
          </div>
        </section>

        <section className="sec dl-all" id="all" aria-labelledby="dl-all-t">
          <p className="eyebrow rv">Downloads</p>
          <h2 className="rv d1" id="dl-all-t">All downloads</h2>
          <div className="dl-grid">
            <Spot className={`dl-card rv d1 ${sys.os === "windows" ? "mine" : ""}`} data-os="windows">
              <header><WindowsLogo /><div><h3>Windows</h3><p>Windows 10 and 11</p></div>{sys.os === "windows" && <span className="dl-you">This computer</span>}</header>
              <FileRow f={byId("win-x64")} primary={sys.os === "windows" && sys.arch !== "arm64"} />
              <FileRow f={byId("win-arm64")} primary={sys.os === "windows" && sys.arch === "arm64"} />
              <p className="dl-note">x64 for most PCs (Intel and AMD). ARM64 for Snapdragon and other Windows on ARM laptops.</p>
            </Spot>
            <Spot className="dl-card soon rv d2" data-os="mac">
              <header><AppleLogo /><div><h3>macOS</h3><p>Apple silicon and Intel</p></div><span className="dl-soon">Coming soon</span></header>
              <div className="dl-file soon"><div className="dl-file-main"><div><b>Apple silicon</b><small>M1 and later</small></div><span className="cx-btn" aria-disabled="true">Coming soon</span></div></div>
              <div className="dl-file soon"><div className="dl-file-main"><div><b>Intel</b><small>Macs with Intel processors</small></div><span className="cx-btn" aria-disabled="true">Coming soon</span></div></div>
              <p className="dl-note">The Mac app is being signed and notarised with Apple. Until then, use Cadus in Safari or Chrome. <a href={MAC_MAIL}><Mail size={12} /> Email me when it's ready</a></p>
            </Spot>
            <Spot className={`dl-card rv d3 ${sys.os === "linux" ? "mine" : ""}`} data-os="linux">
              <header><LinuxLogo /><div><h3>Linux</h3><p>64-bit (x86_64)</p></div>{sys.os === "linux" && <span className="dl-you">This computer</span>}</header>
              <FileRow f={byId("linux-appimage")} primary={sys.os === "linux"} />
              <FileRow f={byId("linux-deb")} />
              <p className="dl-note">AppImage runs on most distributions without installing. The .deb is for Ubuntu, Debian, Linux Mint and Pop!_OS.</p>
            </Spot>
          </div>
        </section>

        <section className="sec" id="install" aria-labelledby="dl-how-t">
          <p className="eyebrow rv">Install</p>
          <h2 className="rv d1" id="dl-how-t">Up and running in a minute</h2>
          <div className="two">
            <div className="panel rv d1">
              <div className="dl-tabs" role="tablist" aria-label="Operating system">
                <button role="tab" aria-selected={help === "windows"} className={help === "windows" ? "on" : ""} onClick={() => setHelp("windows")}><WindowsLogo /> Windows</button>
                <button role="tab" aria-selected={help === "linux"} className={help === "linux" ? "on" : ""} onClick={() => setHelp("linux")}><LinuxLogo /> Linux</button>
              </div>
              {help === "windows" ? (
                <ol className="dl-steps" key="w">
                  <li>Open <b>Cadus-Setup-{RELEASE.version}-x64.exe</b> (or the ARM64 file) from your Downloads folder.</li>
                  <li>If Windows shows <b>"Windows protected your PC"</b>, choose <b>More info</b>, then <b>Run anyway</b>. Windows shows this for new apps until they build a download history; the installer is the one listed here, and you can check its SHA-256.</li>
                  <li>Choose where to install, or keep the suggested folder, and finish. Cadus opens and adds itself to the Start menu and the desktop.</li>
                  <li>Sign in with your Aethex account. To remove Cadus later: Settings › Apps › Installed apps › Cadus › Uninstall.</li>
                </ol>
              ) : (
                <ol className="dl-steps" key="l">
                  <li><b>AppImage:</b> make it runnable, then open it:<code className="dl-cmd">chmod +x Cadus-{RELEASE.version}-x86_64.AppImage<br />./Cadus-{RELEASE.version}-x86_64.AppImage</code></li>
                  <li><b>Ubuntu / Debian:</b> install the package; Cadus appears in your applications:<code className="dl-cmd">sudo apt install ./Cadus-{RELEASE.version}-amd64.deb</code></li>
                  <li>Sign in with your Aethex account. To remove the .deb later: <code>sudo apt remove cadus-desktop</code></li>
                </ol>
              )}
            </div>
            <div className="panel rv d2" aria-labelledby="dl-req-t">
              <h3 className="ph" id="dl-req-t">System requirements</h3>
              <ul className="dl-req">
                <li><Laptop size={16} /><span><b>Windows</b> 10 (version 1809 or later) or 11, 64-bit; Windows 11 on ARM for the ARM64 build.</span></li>
                <li><Terminal size={16} /><span><b>Linux</b> Ubuntu 20.04, Debian 11, Fedora 36 or later, 64-bit.</span></li>
                <li><Cpu size={16} /><span><b>Memory</b> 4 GB of RAM; 8 GB recommended.</span></li>
                <li><HardDrive size={16} /><span><b>Space</b> about 400 MB once installed.</span></li>
                <li><Wifi size={16} /><span><b>Internet</b> needed for answers; Cadus tells you when you're offline.</span></li>
              </ul>
              <h3 className="ph" id="dl-verify-t">Check your download</h3>
              <p className="dl-p">Compare the file's SHA-256 with the one listed under its download:</p>
              <code className="dl-cmd">Get-FileHash .\Cadus-Setup-{RELEASE.version}-x64.exe -Algorithm SHA256</code>
              <code className="dl-cmd">sha256sum Cadus-{RELEASE.version}-x86_64.AppImage</code>
            </div>
          </div>
        </section>

        <section className="sec" id="notes" aria-labelledby="dl-notes-t">
          <div className="notes rv">
            <div>
              <p className="eyebrow">Release notes</p>
              <h2 id="dl-notes-t">What's new in {RELEASE.version}</h2>
              <p className="dl-date">{releasedOn}</p>
            </div>
            <ul className="dl-notes">{RELEASE.notes.map((n) => <li key={n}><span><Check size={13} /></span> {n}</li>)}</ul>
          </div>
        </section>

        <section className="sec" id="faq" aria-labelledby="dl-faq-t">
          <p className="eyebrow rv">FAQ</p>
          <h2 className="rv d1" id="dl-faq-t">Questions</h2>
          <div className="faq">
            {[
              { i: RefreshCw, q: "Is it the same as the website?", a: <>Yes. The app shows the live Cadus, so every improvement reaches it at once. The app itself checks once a day for a newer version and tells you when to download it.</> },
              { i: LockKeyhole, q: "Where is my data?", a: <>Exactly where it is in the browser: chats, cases and settings stay on this computer, and your account is kept by Aethex on Cloudflare. The app adds no tracking of its own.</> },
              { i: ShieldCheck, q: "Is it safe to install?", a: <>Download only from this page, and check the SHA-256 if you like. The app opens nothing but Cadus and Aethex inside its window; other links open in your usual browser.</> },
              { i: FileDown, q: "Why does Windows warn me about the installer?", a: <>Windows SmartScreen warns about new apps until they have been downloaded many times. Choose <b>More info</b>, then <b>Run anyway</b>.</> },
              { i: Laptop, q: "When is the Mac app coming?", a: <>Once it is signed and notarised with Apple, so macOS opens it without warnings. <a href={MAC_MAIL}>Leave your email</a> and we'll tell you.</> },
            ].map(({ i: Icon, q, a }, k) => (
              <details key={q} className={`rv d${(k % 3) + 1}`}>
                <summary><Icon size={16} /> <span>{q}</span> <ChevronDown size={16} className="chev" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="final rv" aria-label="Get Cadus">
          <div className="final-glow" aria-hidden="true" />
          <span className="final-mark"><CadusMark size={34} variant="mono" color="currentColor" /></span>
          <h2>Ready when your next patient is.</h2>
          <p>Free to download. Sign in with the same Aethex account you use on the web.</p>
          <div className="final-row">
            {best ? <a className="cx-btn primary shine big2" href={best.url} download={best.file} rel="noopener"><Download size={17} /> Download for {label(best)}</a>
              : <a className="cx-btn primary shine big2" href="#all"><Download size={17} /> Choose your download</a>}
            <a className="cx-btn ghost big2" href={openCadus}>Open in the browser <ArrowRight size={15} /></a>
          </div>
        </section>
      </main>

      <footer className="dl-foot">
        <span>© {new Date().getFullYear()} Aethex · Cadus is decision support, not a substitute for clinical judgement.</span>
        <span><a href={legal("terms")}>Terms</a> · <a href={legal("privacy")}>Privacy</a> · <a href={legal("disclaimer")}>Disclaimer</a> · <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></span>
      </footer>
    </div>
  );
}

function WindowsLogo() {
  return <svg className="dl-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5.2 10.4 4.2v7.1H3zm8.3-1.1L21 2.8v8.5h-9.7zM3 12.7h7.4v7.1L3 18.8zm8.3 0H21v8.5l-9.7-1.3z" /></svg>;
}
function AppleLogo() {
  return <svg className="dl-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.9zM14.2 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg>;
}
function LinuxLogo() {
  return <svg className="dl-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c-2.2 0-3.6 1.9-3.6 4.6 0 1.4.3 2.3-.5 3.8C6.7 12.6 5 14.5 5.4 17c.2 1.1.9 1.3 1.4 1.6.6.4.9 1.2 1.9 1.6 1.1.4 2.1-.2 3.3-.2s2.2.6 3.3.2c1-.4 1.3-1.2 1.9-1.6.5-.3 1.2-.5 1.4-1.6.4-2.5-1.3-4.4-2.5-6.6-.8-1.5-.5-2.4-.5-3.8C15.6 3.9 14.2 2 12 2zm-1.5 4.3c.4 0 .7.5.7 1.1s-.3 1.1-.7 1.1-.7-.5-.7-1.1.3-1.1.7-1.1zm3 0c.4 0 .7.5.7 1.1s-.3 1.1-.7 1.1-.7-.5-.7-1.1.3-1.1.7-1.1zM12 9.3c.9 0 1.8.4 1.8.8 0 .5-.9 1-1.8 1s-1.8-.5-1.8-1c0-.4.9-.8 1.8-.8z" /></svg>;
}

const DOWNLOADS_CSS = `
.dlx{
  --bg:#05070b;--s1:rgba(255,255,255,.035);--s2:rgba(255,255,255,.06);--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.16);
  --text:#eef2f7;--t2:#a6b0bf;--t3:#6f7a8b;--acc:#2dd4bf;--acc2:#38bdf8;--acc3:#a78bfa;--ok:#34d399;
  --grad:linear-gradient(100deg,#5eead4 0%,#38bdf8 40%,#a78bfa 75%,#5eead4 100%);
  --sans:"Cadus UI","Plus Jakarta Sans","Cadus Sans",Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Code",Consolas,monospace;
  position:fixed;inset:0;z-index:40;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth;
  background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.55;color-scheme:dark;
  -webkit-font-smoothing:antialiased;display:flex;flex-direction:column;isolation:isolate;
}
.dlx *{box-sizing:border-box}
.dlx h1,.dlx h2,.dlx h3,.dlx p,.dlx ul,.dlx ol{margin:0}
.dlx h1,.dlx h2,.dlx h3,.dlx h4{font-family:var(--sans);color:inherit}
.dlx,.dlx button,.dlx input{letter-spacing:normal}
.dlx a{color:inherit}
.dlx ::selection{background:rgba(45,212,191,.35)}

/* background: aurora, grid and particles */
.dlx .bg{position:absolute;left:0;right:0;top:0;height:1300px;z-index:-1;overflow:hidden;pointer-events:none}
.dlx .aurora{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;will-change:transform}
.dlx .a1{width:620px;height:620px;left:-140px;top:-220px;background:radial-gradient(circle,#0d9488 0%,transparent 65%);animation:drift1 18s ease-in-out infinite alternate}
.dlx .a2{width:560px;height:560px;right:-160px;top:-120px;background:radial-gradient(circle,#4f46e5 0%,transparent 65%);animation:drift2 22s ease-in-out infinite alternate}
.dlx .a3{width:520px;height:520px;left:35%;top:280px;background:radial-gradient(circle,#0369a1 0%,transparent 65%);opacity:.4;animation:drift3 26s ease-in-out infinite alternate}
@keyframes drift1{to{transform:translate(160px,120px) scale(1.15)}}
@keyframes drift2{to{transform:translate(-140px,160px) scale(1.1)}}
@keyframes drift3{to{transform:translate(-120px,-80px) scale(1.2)}}
.dlx .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:56px 56px;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 20%,#000 30%,transparent 75%);mask-image:radial-gradient(ellipse 70% 60% at 50% 20%,#000 30%,transparent 75%)}
.dlx .pt{position:absolute;bottom:-10px;border-radius:50%;background:#99f6e4;opacity:0;box-shadow:0 0 8px #5eead4;animation:rise linear infinite}
@keyframes rise{0%{transform:translateY(0);opacity:0}10%{opacity:.7}90%{opacity:.5}100%{transform:translateY(-1200px);opacity:0}}

/* top bar */
.dlx .top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:20px;padding:14px max(24px,calc((100% - 1160px)/2));transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent}
.dlx .top.scrolled{background:rgba(5,7,11,.72);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);border-bottom-color:var(--line)}
.dlx .brand{display:flex;align-items:center;gap:9px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:-.01em}
.dlx .brand em{font-style:normal;font-weight:500;color:var(--t3);font-size:13px}
.dlx .brand-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(140deg,#14b8a6,#6366f1);color:#fff;box-shadow:0 0 20px -4px rgba(45,212,191,.6)}
.dlx .top nav{display:flex;gap:4px;margin-left:12px}
.dlx .top nav a{padding:7px 12px;border-radius:8px;text-decoration:none;font-size:13.5px;color:var(--t2);transition:color .2s,background .2s}
.dlx .top nav a:hover{color:var(--text);background:var(--s2)}
.dlx .top>.cx-btn{margin-left:auto}

/* buttons */
.dlx .cx-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--line2);background:var(--s1);color:var(--text);font:600 13px/1 var(--sans);text-decoration:none;cursor:pointer;overflow:hidden;transition:transform .2s,background .2s,border-color .2s,box-shadow .25s;white-space:nowrap}
.dlx .cx-btn:hover{background:var(--s2);border-color:rgba(255,255,255,.26);transform:translateY(-1px)}
.dlx .cx-btn.primary{border:0;color:#04211d;background:linear-gradient(135deg,#5eead4,#38bdf8);box-shadow:0 8px 30px -10px rgba(56,189,248,.7),inset 0 1px 0 rgba(255,255,255,.5)}
.dlx .cx-btn.primary:hover{box-shadow:0 12px 40px -8px rgba(45,212,191,.85),inset 0 1px 0 rgba(255,255,255,.5)}
.dlx .cx-btn.ghost{background:rgba(255,255,255,.04);backdrop-filter:blur(8px)}
.dlx .cx-btn[aria-disabled="true"]{opacity:.55;cursor:default;pointer-events:none}
.dlx .shine::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);animation:shine 3.6s ease-in-out infinite}
@keyframes shine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
.dlx .cx-ib{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;border:1px solid var(--line);background:var(--s1);color:var(--t2);cursor:pointer}
.dlx .cx-ib:hover{color:var(--text);border-color:var(--line2)}

/* layout */
.dlx .dl-main{flex:1;width:100%;max-width:1160px;margin:0 auto;padding:40px 24px 64px;display:flex;flex-direction:column;gap:96px}
.dlx .sec h2,.dlx .final h2,.dlx .notes h2{font-size:clamp(28px,3.4vw,40px);line-height:1.12;letter-spacing:-.03em;font-weight:750;margin-bottom:28px}
.dlx .eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);margin-bottom:12px}

/* reveal */
.dlx .rv{opacity:0;transform:translateY(22px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.dlx .rv.in{opacity:1;transform:none}
.dlx .rv.d1{transition-delay:.08s}.dlx .rv.d2{transition-delay:.16s}.dlx .rv.d3{transition-delay:.24s}.dlx .rv.d4{transition-delay:.32s}

/* hero */
.dlx .dl-hero{display:grid;grid-template-columns:1fr 1.02fr;gap:56px;align-items:center;min-height:min(600px,calc(100vh - 120px));padding-top:20px}
.dlx .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 10px;border-radius:999px;border:1px solid rgba(45,212,191,.35);background:rgba(45,212,191,.08);color:#99f6e4;font-size:12.5px;font-weight:600;text-decoration:none;transition:background .2s}
.dlx .pill:hover{background:rgba(45,212,191,.15)}
.dlx .live{width:7px;height:7px;border-radius:50%;background:#2dd4bf;box-shadow:0 0 0 0 rgba(45,212,191,.7);animation:ping 1.8s infinite}
@keyframes ping{70%{box-shadow:0 0 0 8px rgba(45,212,191,0)}100%{box-shadow:0 0 0 0 rgba(45,212,191,0)}}
.dlx .dl-hero h1{font-size:clamp(42px,6vw,72px);line-height:1.02;letter-spacing:-.045em;font-weight:800;margin:22px 0 20px}
.dlx .grad{background:var(--grad);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:flow 8s linear infinite}
@keyframes flow{to{background-position:220% 0}}
.dlx .dl-lead{font-size:18px;line-height:1.65;color:var(--t2);max-width:540px}
.dlx .dl-cta{display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-top:32px}
.dlx .cx-btn.dl-big{height:56px;padding:0 26px;font-size:16px;border-radius:14px;gap:10px}
.dlx .dl-meta{font-size:13px;color:var(--t3)}
.dlx .dl-meta a,.dlx .dl-note a,.dlx .faq a{color:#5eead4;text-decoration:none;font-weight:600}
.dlx .dl-meta a:hover,.dlx .dl-note a:hover,.dlx .faq a:hover{text-decoration:underline}
.dlx .oses{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}
.dlx .oses span{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:9px;border:1px solid var(--line);background:var(--s1);font-size:12.5px;color:var(--t2)}
.dlx .oses span.on{border-color:rgba(45,212,191,.45);color:var(--text);background:rgba(45,212,191,.08)}
.dlx .oses .dl-logo{width:14px;height:14px}
.dlx .oses em{font-style:normal;font-size:10.5px;padding:1px 6px;border-radius:5px;background:var(--s2);color:var(--t3)}

/* the live window */
.dlx .hero-art{position:relative}
.dlx .lw-stage{position:relative;perspective:1400px;padding:20px 0}
.dlx .lw-glow{position:absolute;inset:8% 6%;border-radius:30px;background:conic-gradient(from 0deg,#14b8a6,#38bdf8,#818cf8,#14b8a6);filter:blur(60px);opacity:.45;animation:spin 14s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.dlx .lw{position:relative;border-radius:18px;border:1px solid var(--line2);background:linear-gradient(180deg,rgba(17,22,31,.96),rgba(10,13,19,.97));box-shadow:0 40px 100px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.03) inset;overflow:hidden;transition:transform .25s ease-out;transform-style:preserve-3d;animation:bob 7s ease-in-out infinite}
@keyframes bob{50%{translate:0 -8px}}
.dlx .lw-bar{display:flex;align-items:center;gap:7px;height:40px;padding:0 14px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.02)}
.dlx .lw-bar i{width:11px;height:11px;border-radius:50%;background:#ff5f57}.dlx .lw-bar i:nth-child(2){background:#febc2e}.dlx .lw-bar i:nth-child(3){background:#28c840}
.dlx .lw-bar span{display:flex;align-items:center;gap:6px;margin-left:10px;font-size:12.5px;font-weight:650;color:var(--t2)}
.dlx .lw-bar em{margin-left:auto;font-style:normal;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(167,139,250,.12);color:#c4b5fd;border:1px solid rgba(167,139,250,.25)}
.dlx .lw-body{display:grid;grid-template-columns:60px 1fr;height:400px}
.dlx .lw-body aside{display:flex;flex-direction:column;align-items:center;gap:14px;padding:16px 0;border-right:1px solid var(--line);color:#5eead4;background:rgba(255,255,255,.015)}
.dlx .lw-body aside b{width:24px;height:6px;border-radius:3px;background:var(--line2)}
.dlx .lw-body aside b.on{background:#2dd4bf;box-shadow:0 0 10px rgba(45,212,191,.6)}
.dlx .lw-page{display:flex;flex-direction:column;padding:18px 20px;min-width:0}
.dlx .lw-chat{flex:1;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.dlx .lw-q{align-self:flex-end;max-width:85%;padding:10px 13px;border-radius:14px 14px 4px 14px;background:linear-gradient(135deg,rgba(45,212,191,.18),rgba(56,189,248,.14));border:1px solid rgba(45,212,191,.25);font-size:13px;line-height:1.45;animation:pop .35s cubic-bezier(.2,.9,.3,1.3)}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.97)}}
.dlx .lw-think{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--t2);background:linear-gradient(90deg,var(--t3),#e2e8f0,var(--t3));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:flow 1.6s linear infinite,pop .3s}
.dlx .lw-dots{display:inline-flex;gap:4px;-webkit-text-fill-color:initial}
.dlx .lw-dots i{width:6px;height:6px;border-radius:50%;background:#5eead4;animation:dot 1s infinite}
.dlx .lw-dots i:nth-child(2){animation-delay:.15s}.dlx .lw-dots i:nth-child(3){animation-delay:.3s}
@keyframes dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.dlx .lw-a{padding:14px 16px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.025);font-size:13px;line-height:1.55;animation:pop .35s}
.dlx .lw-a strong{display:block;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#5eead4;margin-bottom:5px}
.dlx .lw-a p{color:var(--text);font-weight:550}
.dlx .lw-a ul{margin:9px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}
.dlx .lw-a li{position:relative;padding-left:15px;color:var(--t2)}
.dlx .lw-a li::before{content:"";position:absolute;left:2px;top:.6em;width:5px;height:5px;border-radius:50%;background:#38bdf8}
.dlx .lw-chips{display:flex;gap:6px;margin-top:11px}
.dlx .lw-chips span{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(52,211,153,.1);color:#6ee7b7;border:1px solid rgba(52,211,153,.25);animation:pop .4s backwards}
.dlx .lw-chips span+span{animation-delay:.12s;background:rgba(56,189,248,.1);color:#7dd3fc;border-color:rgba(56,189,248,.25)}
.dlx .lw-caret{display:inline-block;width:2px;height:1.05em;margin-left:2px;vertical-align:-.15em;background:#5eead4;animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.dlx .lw-input{display:flex;align-items:center;justify-content:space-between;gap:10px;height:44px;margin-top:12px;padding:0 6px 0 14px;border-radius:12px;border:1px solid var(--line2);background:rgba(255,255,255,.03);font-size:12.5px;color:var(--t3);transition:border-color .3s,box-shadow .3s}
.dlx .lw-input>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dlx .lw-input.live{border-color:rgba(45,212,191,.5);box-shadow:0 0 0 4px rgba(45,212,191,.08);color:var(--text)}
.dlx .lw-input i{display:grid;place-items:center;flex-shrink:0;width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#5eead4,#38bdf8);color:#04211d}
.dlx .lw-float{position:absolute;display:flex;align-items:center;gap:8px;padding:9px 13px;border-radius:12px;font-size:12.5px;font-weight:600;background:rgba(15,20,28,.85);backdrop-filter:blur(10px);border:1px solid var(--line2);box-shadow:0 18px 40px -16px rgba(0,0,0,.8);animation:float 6s ease-in-out infinite}
.dlx .lw-float svg{color:#5eead4}
.dlx .lw-float.f1{left:-32px;bottom:-4px}
.dlx .lw-float.f2{right:-22px;top:-18px;animation-delay:-3s}
.dlx .lw-float.f2 svg{color:#a78bfa}
@keyframes float{50%{transform:translateY(-10px)}}

/* stats */
.dlx .stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));overflow:hidden;margin-top:-24px}
.dlx .stats>div{padding:26px 24px;border-right:1px solid var(--line)}
.dlx .stats>div:last-child{border-right:0}
.dlx .stats b{display:block;font-size:34px;font-weight:800;letter-spacing:-.03em;background:linear-gradient(180deg,#fff,#94a3b8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-variant-numeric:tabular-nums}
.dlx .stats>div>span{font-size:13px;color:var(--t3)}

/* spotlight cards */
.dlx .spot{position:relative;border:1px solid var(--line);border-radius:18px;background:var(--s1);overflow:hidden;transition:border-color .3s,transform .3s,opacity .8s cubic-bezier(.2,.7,.2,1)}
.dlx .spot::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(45,212,191,.12),transparent 45%)}
.dlx .spot:hover{border-color:rgba(45,212,191,.35)}
.dlx .spot:hover::before{opacity:1}
.dlx .spot>*{position:relative}

.dlx .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.dlx .feat{padding:26px}
.dlx .feat .ic{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;margin-bottom:18px;color:#5eead4;background:linear-gradient(140deg,rgba(45,212,191,.18),rgba(99,102,241,.14));border:1px solid rgba(45,212,191,.25);transition:transform .4s cubic-bezier(.2,.9,.3,1.4)}
.dlx .feat:hover .ic{transform:scale(1.1) rotate(-6deg)}
.dlx .feat h3{font-size:16.5px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em}
.dlx .feat p{font-size:14px;line-height:1.6;color:var(--t2)}

/* download cards */
.dlx .dl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.dlx .dl-card{display:flex;flex-direction:column;gap:12px;padding:22px}
.dlx .dl-card.mine{border-color:rgba(45,212,191,.45);box-shadow:0 0 0 1px rgba(45,212,191,.15),0 30px 60px -30px rgba(45,212,191,.35)}
.dlx .dl-card.mine::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;background:conic-gradient(from var(--ang,0deg),transparent 0 70%,#5eead4 80%,#38bdf8 88%,transparent 95%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:ring 4s linear infinite}
@property --ang{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes ring{to{--ang:360deg}}
.dlx .dl-card>header{display:flex;align-items:center;gap:13px;margin-bottom:4px}
.dlx .dl-card>header h3{font-size:17px;font-weight:700}
.dlx .dl-card>header p{font-size:12.5px;color:var(--t3)}
.dlx .dl-logo{width:30px;height:30px;color:var(--text);flex-shrink:0}
.dlx .dl-card.soon .dl-logo{color:var(--t3)}
.dlx .dl-you,.dlx .dl-soon{margin-left:auto;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.dlx .dl-you{background:rgba(45,212,191,.12);color:#5eead4;border:1px solid rgba(45,212,191,.3)}
.dlx .dl-soon{background:rgba(167,139,250,.1);color:#c4b5fd;border:1px solid rgba(167,139,250,.25)}
.dlx .dl-file{padding:12px 13px;border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.25);transition:border-color .2s,background .2s}
.dlx .dl-file:hover{border-color:var(--line2);background:rgba(255,255,255,.03)}
.dlx .dl-file.best{border-color:rgba(45,212,191,.35)}
.dlx .dl-file-main{display:flex;align-items:center;justify-content:space-between;gap:10px}
.dlx .dl-file b{display:block;font-size:14px;font-weight:650}
.dlx .dl-file small{font-size:12px;color:var(--t3)}
.dlx .dl-file .cx-btn{height:34px;font-size:12.5px;flex-shrink:0}
.dlx .dl-file.soon b{color:var(--t2)}
.dlx .dl-link{padding:0;border:0;background:none;font:inherit;color:#5eead4;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.dlx .dl-hash{display:flex;align-items:center;gap:6px;margin-top:9px;animation:pop .3s}
.dlx .dl-hash code{flex:1;min-width:0;overflow-wrap:anywhere;font-family:var(--mono);font-size:11px;line-height:1.5;color:var(--t2)}
.dlx .dl-note{font-size:12.5px;line-height:1.6;color:var(--t2);margin-top:auto}
.dlx .dl-note a{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}

/* install */
.dlx .two{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}
.dlx .panel{padding:26px;border:1px solid var(--line);border-radius:18px;background:var(--s1)}
.dlx .ph{font-size:15px;font-weight:700;margin-bottom:14px}
.dlx .ph+.dl-p{margin-top:-6px}
.dlx .dl-req+.ph{margin-top:24px}
.dlx .dl-tabs{display:inline-flex;gap:4px;padding:4px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid var(--line);margin-bottom:22px}
.dlx .dl-tabs button{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border:0;border-radius:9px;background:none;color:var(--t2);font:600 13px var(--sans);cursor:pointer;transition:background .25s,color .25s}
.dlx .dl-tabs button .dl-logo{width:14px;height:14px;color:currentColor}
.dlx .dl-tabs button.on{background:var(--s2);color:var(--text);box-shadow:inset 0 0 0 1px var(--line2)}
.dlx .dl-steps{counter-reset:s;list-style:none;padding:0;display:flex;flex-direction:column;gap:18px;font-size:14px;line-height:1.6;color:var(--t2)}
.dlx .dl-steps li{counter-increment:s;position:relative;padding-left:44px;animation:pop .45s backwards}
.dlx .dl-steps li:nth-child(2){animation-delay:.07s}.dlx .dl-steps li:nth-child(3){animation-delay:.14s}.dlx .dl-steps li:nth-child(4){animation-delay:.21s}
.dlx .dl-steps li::before{content:counter(s);position:absolute;left:0;top:-2px;display:grid;place-items:center;width:28px;height:28px;border-radius:9px;font-size:12.5px;font-weight:700;color:#04211d;background:linear-gradient(135deg,#5eead4,#38bdf8)}
.dlx .dl-steps li:not(:last-child)::after{content:"";position:absolute;left:13.5px;top:32px;bottom:-16px;width:1px;background:linear-gradient(var(--line2),transparent)}
.dlx .dl-steps b{color:var(--text);font-weight:650}
.dlx .dl-cmd{display:block;margin:9px 0 2px;padding:11px 13px;border-radius:10px;background:rgba(0,0,0,.45);border:1px solid var(--line);font-family:var(--mono);font-size:12.5px;line-height:1.65;color:#a7f3d0;overflow-x:auto;white-space:pre-wrap;overflow-wrap:anywhere}
.dlx .dl-steps code:not(.dl-cmd){font-family:var(--mono);font-size:12.5px;color:#a7f3d0}
.dlx .dl-req{display:flex;flex-direction:column;gap:12px;list-style:none;padding:0}
.dlx .dl-req li{display:flex;gap:11px;font-size:13.5px;line-height:1.55;color:var(--t2)}
.dlx .dl-req li svg{flex-shrink:0;margin-top:3px;color:#5eead4}
.dlx .dl-req b{color:var(--text);font-weight:650;margin-right:4px}
.dlx .dl-p{font-size:13.5px;line-height:1.55;color:var(--t2);margin-bottom:4px}

/* release notes */
.dlx .notes{display:grid;grid-template-columns:.8fr 1.2fr;gap:40px;align-items:center;padding:36px;border-radius:22px;border:1px solid var(--line);background:radial-gradient(600px circle at 0% 0%,rgba(45,212,191,.1),transparent 60%),var(--s1)}
.dlx .notes h2{margin-bottom:6px}
.dlx .dl-date{font-size:13px;color:var(--t3)}
.dlx .dl-notes{display:flex;flex-direction:column;gap:14px;list-style:none;padding:0}
.dlx .dl-notes li{display:flex;gap:12px;align-items:flex-start;font-size:15px;line-height:1.55;color:var(--t2)}
.dlx .dl-notes li>span{display:grid;place-items:center;flex-shrink:0;width:22px;height:22px;margin-top:1px;border-radius:7px;background:rgba(52,211,153,.14);color:var(--ok)}

/* faq */
.dlx .faq{display:flex;flex-direction:column;gap:10px;max-width:860px}
.dlx .faq details{border:1px solid var(--line);border-radius:14px;background:var(--s1);transition:border-color .25s,background .25s,opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.dlx .faq details[open]{border-color:rgba(45,212,191,.3);background:rgba(45,212,191,.04)}
.dlx .faq summary{display:flex;align-items:center;gap:12px;padding:17px 20px;cursor:pointer;list-style:none;font-size:15px;font-weight:650}
.dlx .faq summary::-webkit-details-marker{display:none}
.dlx .faq summary>svg:first-child{color:#5eead4;flex-shrink:0}
.dlx .faq summary span{flex:1}
.dlx .faq .chev{color:var(--t3);transition:transform .3s}
.dlx .faq details[open] .chev{transform:rotate(180deg)}
.dlx .faq details p{padding:0 20px 18px 48px;font-size:14px;line-height:1.65;color:var(--t2);animation:pop .3s}

/* final call */
.dlx .final{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:64px 24px;border-radius:28px;border:1px solid var(--line);overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01))}
.dlx .final-glow{position:absolute;left:50%;top:-60%;width:900px;height:600px;translate:-50% 0;background:radial-gradient(closest-side,rgba(45,212,191,.35),rgba(99,102,241,.18),transparent);filter:blur(20px);animation:breathe 6s ease-in-out infinite}
@keyframes breathe{50%{opacity:.6;transform:scale(1.08)}}
.dlx .final>*:not(.final-glow){position:relative}
.dlx .final-mark{display:grid;place-items:center;width:68px;height:68px;border-radius:20px;margin-bottom:22px;color:#fff;background:linear-gradient(140deg,#14b8a6,#6366f1);box-shadow:0 0 50px -6px rgba(45,212,191,.7)}
.dlx .final h2{margin-bottom:12px}
.dlx .final p{color:var(--t2);font-size:16px;max-width:520px}
.dlx .final-row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:28px}
.dlx .cx-btn.big2{height:50px;padding:0 22px;font-size:15px;border-radius:13px}

.dlx .dl-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:22px max(24px,calc((100% - 1160px)/2));border-top:1px solid var(--line);font-size:12.5px;color:var(--t3)}
.dlx .dl-foot a{color:var(--t2);text-decoration:none}
.dlx .dl-foot a:hover{color:var(--text)}

@media (max-width:980px){
  .dlx .dl-hero{grid-template-columns:1fr;min-height:0;gap:40px}
  .dlx .lw-float.f1{left:8px}.dlx .lw-float.f2{right:8px}
  .dlx .feat-grid,.dlx .dl-grid{grid-template-columns:1fr 1fr}
  .dlx .two,.dlx .notes{grid-template-columns:1fr}
  .dlx .stats{grid-template-columns:1fr 1fr;margin-top:0}
  .dlx .stats>div:nth-child(2){border-right:0}
  .dlx .stats>div:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .dlx .top nav{display:none}
}
@media (max-width:640px){
  .dlx .dl-main{padding:24px 16px 48px;gap:64px}
  .dlx .feat-grid,.dlx .dl-grid{grid-template-columns:1fr}
  .dlx .hero-art{display:none}
  .dlx .cx-btn.dl-big{width:100%}
  .dlx .top{padding:12px 16px;gap:10px}
  .dlx .top>.cx-btn{font-size:12px;padding:0 10px}
  .dlx .brand em{display:none}
  .dlx .stats b{font-size:26px!important}
  .dlx .stats>div{padding:18px 16px}
  .dlx .panel,.dlx .notes{padding:20px}
  .dlx .final{padding:44px 18px}
  .dlx .final-row .cx-btn{width:100%}
}
@media (prefers-reduced-motion:reduce){
  .dlx *,.dlx *::before,.dlx *::after{animation:none!important;transition:none!important}
  .dlx .rv{opacity:1;transform:none}
  .dlx{scroll-behavior:auto}
}
`;
