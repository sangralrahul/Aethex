/**
 * aethex.in/downloads: the Cadus desktop app for Windows (x64 and ARM) and
 * Linux, with macOS coming soon. Picks the right download for the visitor's
 * computer, and lists every file with its size and SHA-256, the system
 * requirements, install help and release notes. The installers are served
 * from Cloudflare R2 at downloads.aethex.in; the list comes from
 * lib/downloads/release.json, written by desktop/scripts/manifest.mjs.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, Cpu, Download, HardDrive, Laptop, LockKeyhole, Mail, RefreshCw, ShieldCheck, Terminal, Wifi } from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { CADUS_WS_CSS } from "@/components/cadus/cadus-ws-styles";
import { CADUS_SIGNIN_CSS } from "@/components/cadus/cadus-signin-styles";
import { CADUS_CLINIC_CSS } from "@/components/cadus/cadus-clinic-styles";
import { CADUS_LOOKS_CSS } from "@/components/cadus/cadus-looks-styles";
import { LEGAL_PATH, SUPPORT_EMAIL } from "@/lib/cadus/legal";
import { cadusUrl, isCadusHost } from "@/lib/host";
import RELEASE from "@/lib/downloads/release.json";

type FileEntry = (typeof RELEASE.files)[number];
type Os = "windows" | "mac" | "linux" | "mobile" | "unknown";
type Detected = { os: Os; arch: "x64" | "arm64" | "unknown" };

const byId = (id: string) => RELEASE.files.find((f) => f.id === id) as FileEntry;
const mb = (n: number) => `${(n / 1048576).toFixed(0)} MB`;
const releasedOn = new Date(`${RELEASE.released}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

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

function FileRow({ f, primary }: { f: FileEntry; primary?: boolean }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(f.sha256).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }); };
  return (
    <div className="dl-file" data-file={f.id}>
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

export default function Downloads() {
  const [sys, setSys] = useState<Detected>({ os: "unknown", arch: "unknown" });
  useEffect(() => { void detect().then(setSys); }, []);
  useEffect(() => {
    const before = document.title;
    document.title = "Download Cadus for Windows and Linux · Aethex";
    return () => { document.title = before; };
  }, []);
  const look = (() => { try { const l = JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").look; return ["clinical", "editorial", "mono"].includes(l) ? l : "editorial"; } catch { return "editorial"; } })();
  const dark = (() => { try { return JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").theme === "dark"; } catch { return false; } })();
  const openCadus = isCadusHost() ? "/" : cadusUrl("/");
  const legal = (k: "terms" | "privacy" | "disclaimer") => (isCadusHost() ? LEGAL_PATH(k, true) : `https://cadus.aethex.in/${k}`);
  const [help, setHelp] = useState<"windows" | "linux">("windows");
  useEffect(() => { if (sys.os === "linux") setHelp("linux"); }, [sys.os]);

  const best = useMemo(() => {
    if (sys.os === "windows") return sys.arch === "arm64" ? byId("win-arm64") : byId("win-x64");
    if (sys.os === "linux") return byId("linux-appimage");
    return null;
  }, [sys]);
  const label = (f: FileEntry) => (f.os === "windows" ? `Windows ${f.arch === "arm64" ? "on ARM" : "(64-bit)"}` : f.id === "linux-deb" ? "Ubuntu / Debian" : "Linux");

  return (
    <div className={`cx dl ${dark ? "cx-dark" : "cx-light"} ans-sans`} data-look={look}>
      <style>{CADUS_CSS + CADUS_WS_CSS + CADUS_SIGNIN_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS + DOWNLOADS_CSS}</style>
      <header className="cx-shared-top">
        <a className="cx-si-brand small" href={openCadus} style={{ display: "flex", marginBottom: 0 }}><CadusMark size={24} /><span>Cadus</span></a>
        <span className="cx-shared-tag">Downloads</span>
        <a className="cx-btn" href={openCadus}>Open in the browser <ArrowRight size={14} /></a>
      </header>

      <main className="dl-main">
        <section className="dl-hero">
          <div className="dl-hero-text">
            <p className="cx-si-eyebrow">Cadus for desktop · version {RELEASE.version}</p>
            <h1>Cadus, on your computer</h1>
            <p className="dl-lead">The same Cadus you use in the browser, in its own window: one click from the taskbar, ready between patients, with your sign-in, chats and settings kept on this computer.</p>
            <div className="dl-cta">
              {best ? (
                <>
                  <a className="cx-btn primary dl-big" href={best.url} download={best.file} rel="noopener" data-best={best.id}><Download size={17} /> Download for {label(best)}</a>
                  <span className="dl-meta">{best.kind} · {mb(best.size)} · released {releasedOn}</span>
                </>
              ) : sys.os === "mac" ? (
                <>
                  <span className="cx-btn dl-big" aria-disabled="true"><Laptop size={17} /> Cadus for Mac is coming soon</span>
                  <span className="dl-meta">Until then, Cadus works fully in Safari or Chrome. <a href={openCadus}>Open Cadus</a> · <a href={MAC_MAIL}>Email me when it's ready</a></span>
                </>
              ) : sys.os === "mobile" ? (
                <>
                  <a className="cx-btn primary dl-big" href={openCadus}><ArrowRight size={17} /> Open Cadus on this phone</a>
                  <span className="dl-meta">On phones and tablets Cadus runs in the browser. Use "Add to Home Screen" to keep it a tap away.</span>
                </>
              ) : (
                <>
                  <a className="cx-btn primary dl-big" href="#all"><Download size={17} /> Choose your download</a>
                  <span className="dl-meta">Windows, Linux, and macOS soon.</span>
                </>
              )}
            </div>
          </div>
          <div className="dl-window" aria-hidden="true">
            <div className="dl-window-bar"><i /><i /><i /><span>Cadus</span></div>
            <div className="dl-window-body">
              <aside><CadusMark size={18} /><b /><b /><b /><b /></aside>
              <div className="dl-window-page">
                <em className="dl-q">Febrile neutropenia in a 54-year-old on chemotherapy: first hour?</em>
                <div className="dl-a"><strong>Bottom line</strong><span /><span /><span className="short" /><strong>Within the hour</strong><span /><span className="short" /></div>
                <div className="dl-input"><span>Ask Cadus anything clinical</span><i /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="dl-all" id="all" aria-labelledby="dl-all-t">
          <h2 id="dl-all-t">All downloads</h2>
          <div className="dl-grid">
            <article className="dl-card" data-os="windows">
              <header><WindowsLogo /><div><h3>Windows</h3><p>Windows 10 and 11</p></div>{sys.os === "windows" && <span className="dl-you">This computer</span>}</header>
              <FileRow f={byId("win-x64")} primary={sys.os === "windows" && sys.arch !== "arm64"} />
              <FileRow f={byId("win-arm64")} primary={sys.os === "windows" && sys.arch === "arm64"} />
              <p className="dl-note">x64 for most PCs (Intel and AMD). ARM64 for Snapdragon and other Windows on ARM laptops.</p>
            </article>
            <article className="dl-card soon" data-os="mac">
              <header><AppleLogo /><div><h3>macOS</h3><p>Apple silicon and Intel</p></div><span className="dl-soon">Coming soon</span></header>
              <div className="dl-file soon"><div className="dl-file-main"><div><b>Apple silicon</b><small>M1 and later</small></div><span className="cx-btn" aria-disabled="true">Coming soon</span></div></div>
              <div className="dl-file soon"><div className="dl-file-main"><div><b>Intel</b><small>Macs with Intel processors</small></div><span className="cx-btn" aria-disabled="true">Coming soon</span></div></div>
              <p className="dl-note">The Mac app is being signed and notarised with Apple. Until then, use Cadus in Safari or Chrome. <a href={MAC_MAIL}><Mail size={12} /> Email me when it's ready</a></p>
            </article>
            <article className="dl-card" data-os="linux">
              <header><LinuxLogo /><div><h3>Linux</h3><p>64-bit (x86_64)</p></div>{sys.os === "linux" && <span className="dl-you">This computer</span>}</header>
              <FileRow f={byId("linux-appimage")} primary={sys.os === "linux"} />
              <FileRow f={byId("linux-deb")} />
              <p className="dl-note">AppImage runs on most distributions without installing. The .deb is for Ubuntu, Debian, Linux Mint and Pop!_OS.</p>
            </article>
          </div>
        </section>

        <section className="dl-two">
          <div className="dl-panel" aria-labelledby="dl-req-t">
            <h2 id="dl-req-t">System requirements</h2>
            <ul className="dl-req">
              <li><Laptop size={16} /><span><b>Windows</b> 10 (version 1809 or later) or 11, 64-bit; Windows 11 on ARM for the ARM64 build.</span></li>
              <li><Terminal size={16} /><span><b>Linux</b> Ubuntu 20.04, Debian 11, Fedora 36 or later, 64-bit.</span></li>
              <li><Cpu size={16} /><span><b>Memory</b> 4 GB of RAM; 8 GB recommended.</span></li>
              <li><HardDrive size={16} /><span><b>Space</b> about 400 MB once installed.</span></li>
              <li><Wifi size={16} /><span><b>Internet</b> needed for answers; Cadus tells you when you're offline.</span></li>
            </ul>
          </div>
          <div className="dl-panel" aria-labelledby="dl-how-t">
            <h2 id="dl-how-t">Installing</h2>
            <div className="cx-seg dl-tabs" role="tablist" aria-label="Operating system">
              <button role="tab" aria-selected={help === "windows"} className={help === "windows" ? "on" : ""} onClick={() => setHelp("windows")}>Windows</button>
              <button role="tab" aria-selected={help === "linux"} className={help === "linux" ? "on" : ""} onClick={() => setHelp("linux")}>Linux</button>
            </div>
            {help === "windows" ? (
              <ol className="dl-steps">
                <li>Open <b>Cadus-Setup-{RELEASE.version}-x64.exe</b> (or the ARM64 file) from your Downloads folder.</li>
                <li>If Windows shows <b>"Windows protected your PC"</b>, choose <b>More info</b>, then <b>Run anyway</b>. Windows shows this for new apps until they build a download history; the installer is the one listed here, and you can check its SHA-256 below.</li>
                <li>Choose where to install, or keep the suggested folder, and finish. Cadus opens and adds itself to the Start menu and the desktop.</li>
                <li>Sign in with your Aethex account. To remove Cadus later: Settings › Apps › Installed apps › Cadus › Uninstall.</li>
              </ol>
            ) : (
              <ol className="dl-steps">
                <li><b>AppImage:</b> make it runnable, then open it:<code className="dl-cmd">chmod +x Cadus-{RELEASE.version}-x86_64.AppImage<br />./Cadus-{RELEASE.version}-x86_64.AppImage</code></li>
                <li><b>Ubuntu / Debian:</b> install the package; Cadus appears in your applications:<code className="dl-cmd">sudo apt install ./Cadus-{RELEASE.version}-amd64.deb</code></li>
                <li>Sign in with your Aethex account. To remove the .deb later: <code>sudo apt remove cadus-desktop</code></li>
              </ol>
            )}
          </div>
        </section>

        <section className="dl-two">
          <div className="dl-panel" aria-labelledby="dl-verify-t">
            <h2 id="dl-verify-t">Check your download</h2>
            <p className="dl-p">Every file has a SHA-256 fingerprint (shown under each download). Compare it with the one your computer calculates:</p>
            <p className="dl-p"><b>Windows (PowerShell)</b></p>
            <code className="dl-cmd">Get-FileHash .\Cadus-Setup-{RELEASE.version}-x64.exe -Algorithm SHA256</code>
            <p className="dl-p"><b>Linux</b></p>
            <code className="dl-cmd">sha256sum Cadus-{RELEASE.version}-x86_64.AppImage</code>
          </div>
          <div className="dl-panel" aria-labelledby="dl-notes-t">
            <h2 id="dl-notes-t">What's new in {RELEASE.version}</h2>
            <p className="dl-date">{releasedOn}</p>
            <ul className="dl-notes">{RELEASE.notes.map((n) => <li key={n}><Check size={14} /> {n}</li>)}</ul>
          </div>
        </section>

        <section className="dl-faq" aria-labelledby="dl-faq-t">
          <h2 id="dl-faq-t">Questions</h2>
          <div className="dl-faq-grid">
            <div><h3><RefreshCw size={15} /> Is it the same as the website?</h3><p>Yes. The app shows the live Cadus, so every improvement reaches it at once. The app itself checks once a day for a newer version and tells you when to download it.</p></div>
            <div><h3><LockKeyhole size={15} /> Where is my data?</h3><p>Exactly where it is in the browser: chats, cases and settings stay on this computer, and your account is kept by Aethex on Cloudflare. The app adds no tracking of its own.</p></div>
            <div><h3><ShieldCheck size={15} /> Is it safe to install?</h3><p>Download only from this page. The app opens nothing but Cadus and Aethex inside its window; other links open in your usual browser.</p></div>
            <div><h3><Laptop size={15} /> When is the Mac app coming?</h3><p>Once it is signed and notarised with Apple, so macOS opens it without warnings. <a href={MAC_MAIL}>Leave your email</a> and we'll tell you.</p></div>
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
.dl{position:fixed;inset:0;overflow:auto;display:flex;flex-direction:column;background:var(--bg)}
.dl .cx-shared-top{position:sticky;top:0;z-index:5}
.dl .cx-shared-top .cx-btn{margin-left:auto}
.dl-main{flex:1;width:100%;max-width:1120px;margin:0 auto;padding:48px 24px 56px;display:flex;flex-direction:column;gap:44px}
.dl-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center}
.cx .dl-hero h1{font-size:44px;line-height:1.08;letter-spacing:-.025em;margin:10px 0 14px}
.cx[data-look="editorial"] .dl-hero h1{font-family:var(--display);font-weight:500;font-size:50px}
.dl-lead{font-size:17px;line-height:1.6;color:var(--t2);max-width:520px}
.dl-cta{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-top:26px}
.dl .cx-btn.dl-big{height:50px;padding:0 22px;font-size:15.5px;gap:10px;border-radius:var(--r-lg,10px)}
.dl .cx-btn[aria-disabled="true"]{opacity:.65;cursor:default;pointer-events:none}
.dl-meta{font-size:13px;color:var(--t3)}
.dl-meta a,.dl-note a,.dl-faq a{color:var(--acc);text-decoration:none;font-weight:550}
.dl-note a{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.dl-window{border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:0 24px 60px -28px rgba(15,23,42,.35),0 2px 6px rgba(15,23,42,.06);overflow:hidden}
.dl-window-bar{display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-bottom:1px solid var(--line);background:var(--s2)}
.dl-window-bar i{width:9px;height:9px;border-radius:50%;background:var(--line2)}
.dl-window-bar span{margin-left:8px;font-size:12px;font-weight:600;color:var(--t2)}
.dl-window-body{display:grid;grid-template-columns:56px 1fr;min-height:300px}
.dl-window-body aside{display:flex;flex-direction:column;align-items:center;gap:12px;padding:14px 0;border-right:1px solid var(--line);background:var(--s2)}
.dl-window-body aside b{width:22px;height:6px;border-radius:3px;background:var(--line2)}
.dl-window-page{display:flex;flex-direction:column;gap:14px;padding:20px 22px}
.dl-q{align-self:flex-end;max-width:82%;padding:9px 12px;border-radius:12px 12px 4px 12px;background:var(--s2);font-size:12.5px;font-style:normal;color:var(--text)}
.dl-a{display:flex;flex-direction:column;gap:7px;padding:14px 16px;border:1px solid var(--line);border-radius:10px}
.dl-a strong{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.dl-a span{height:7px;border-radius:4px;background:var(--line)}
.dl-a span.short{width:62%}
.dl-input{display:flex;align-items:center;justify-content:space-between;margin-top:auto;height:38px;padding:0 6px 0 14px;border:1px solid var(--line2);border-radius:10px;font-size:12px;color:var(--t3)}
.dl-input i{width:26px;height:26px;border-radius:7px;background:var(--acc)}
.dl-all h2,.dl-panel h2,.dl-faq h2{font-size:22px;letter-spacing:-.015em;margin-bottom:16px}
.cx[data-look="editorial"] .dl-all h2,.cx[data-look="editorial"] .dl-panel h2,.cx[data-look="editorial"] .dl-faq h2{font-family:var(--display);font-weight:500;font-size:26px}
.dl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.dl-card{display:flex;flex-direction:column;gap:10px;padding:18px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.dl-card>header{display:flex;align-items:center;gap:12px;margin-bottom:4px}
.dl-card>header h3{font-size:16px;font-weight:650}
.dl-card>header p{font-size:12.5px;color:var(--t3)}
.dl-logo{width:30px;height:30px;color:var(--text);flex-shrink:0}
.dl-card.soon .dl-logo{color:var(--t3)}
.dl-you,.dl-soon{margin-left:auto;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:650;white-space:nowrap}
.dl-you{background:color-mix(in srgb,var(--acc) 12%,transparent);color:var(--acc)}
.dl-soon{background:var(--s2);color:var(--t2);border:1px solid var(--line)}
.dl-file{padding:11px 12px;border:1px solid var(--line);border-radius:var(--r,8px);background:var(--bg)}
.dl-file-main{display:flex;align-items:center;justify-content:space-between;gap:10px}
.dl-file b{display:block;font-size:13.5px;font-weight:600}
.dl-file small{font-size:12px;color:var(--t3)}
.dl-file .cx-btn{height:32px;font-size:12.5px;flex-shrink:0}
.dl-file.soon b{color:var(--t2)}
.dl-link{padding:0;border:0;background:none;font:inherit;color:var(--acc);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.dl-hash{display:flex;align-items:center;gap:6px;margin-top:8px}
.dl-hash code{flex:1;min-width:0;overflow-wrap:anywhere;font-family:var(--mono,ui-monospace,monospace);font-size:11px;line-height:1.5;color:var(--t2)}
.dl-note{font-size:12.5px;line-height:1.55;color:var(--t2);margin-top:auto}
.dl-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dl-panel{padding:22px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.dl-req{display:flex;flex-direction:column;gap:12px;list-style:none;padding:0;margin:0}
.dl-req li{display:flex;gap:10px;font-size:14px;line-height:1.5;color:var(--t2)}
.dl-req li svg{flex-shrink:0;margin-top:3px;color:var(--acc)}
.dl-req b{color:var(--text);font-weight:600;margin-right:4px}
.dl-tabs{display:inline-flex;margin-bottom:14px}
.dl-steps{display:flex;flex-direction:column;gap:12px;padding-left:20px;margin:0;font-size:14px;line-height:1.55;color:var(--t2)}
.dl-steps b{color:var(--text);font-weight:600}
.dl-cmd{display:block;margin:8px 0 2px;padding:10px 12px;border-radius:var(--r,8px);background:var(--s2);border:1px solid var(--line);font-family:var(--mono,ui-monospace,monospace);font-size:12.5px;line-height:1.6;color:var(--text);overflow-x:auto;white-space:pre-wrap;overflow-wrap:anywhere}
.dl-steps code:not(.dl-cmd){font-family:var(--mono,ui-monospace,monospace);font-size:12.5px}
.dl-p{font-size:14px;line-height:1.55;color:var(--t2);margin:0 0 6px}
.dl-p+.dl-cmd{margin-bottom:12px}
.dl-date{font-size:13px;color:var(--t3);margin:-8px 0 12px}
.dl-notes{display:flex;flex-direction:column;gap:10px;list-style:none;padding:0;margin:0}
.dl-notes li{display:flex;gap:8px;font-size:14px;line-height:1.5;color:var(--t2)}
.dl-notes li svg{flex-shrink:0;margin-top:4px;color:var(--ok)}
.dl-faq-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 28px}
.dl-faq h3{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;margin-bottom:6px}
.dl-faq h3 svg{color:var(--acc)}
.dl-faq p{font-size:14px;line-height:1.6;color:var(--t2)}
.dl-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:18px 24px;border-top:1px solid var(--line);font-size:12.5px;color:var(--t3)}
.dl-foot a{color:var(--t2);text-decoration:none}
@media (max-width:920px){.dl-hero{grid-template-columns:1fr}.dl-window{display:none}.dl-grid{grid-template-columns:1fr}.dl-two,.dl-faq-grid{grid-template-columns:1fr}.cx .dl-hero h1,.cx[data-look="editorial"] .dl-hero h1{font-size:36px}}
@media (max-width:520px){.dl-main{padding:28px 16px 40px;gap:32px}.dl .cx-shared-top .cx-shared-tag{display:none}.dl .cx-btn.dl-big{width:100%;justify-content:center}}
`;
