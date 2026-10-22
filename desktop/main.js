// Cadus for Windows and Linux: a secure window onto cadus.aethex.in.
//
// The app shows the live Cadus site, so it is always up to date; sign-in,
// chats and settings work exactly as in the browser and stay on this computer.
// Pages outside aethex.in open in the default browser.
//
// Google sign-in: Google refuses to sign in inside app windows, so "Continue
// with Google" opens in the system browser. The app sends the SHA-256 of a
// one-time secret; when Google is done, the browser opens cadus://signed-in
// with a one-time code, and the app trades code + secret for its own sign-in
// (worker/auth.ts, /api/auth/desktop). A code alone is useless without the secret.
// When there is no connection, a local page explains and retries.
//
// Since 1.0.2: a tray icon (Cadus keeps running when its window is closed), a
// quick-open shortcut (Ctrl+Shift+Space) from any app, an option to start with
// the computer, and reminders when flashcards are due or ward jobs are open. The
// app never reads the page's data: it asks the page for counts through
// window.__cadusStatus() and opens parts of Cadus with a "cadus:open" event
// (artifacts/aethex/src/lib/cadus/desktop.ts).
const { app, BrowserWindow, Menu, Tray, Notification, globalShortcut, nativeImage, shell, session, dialog, nativeTheme, net } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

// A test build can point at a local copy of Cadus; an installed app always uses cadus.aethex.in.
const START_URL = (!app.isPackaged && process.env.CADUS_START_URL) || "https://cadus.aethex.in/";
const DOWNLOADS_URL = "https://aethex.in/downloads";
const MANIFEST_URL = "https://aethex.in/downloads/latest.json";
const PARTITION = "persist:cadus";

/** Addresses the window may show; everything else opens in the browser. */
const IN_APP_LIVE = /^https:\/\/(?:(?:cadus|auth|login)\.)?aethex\.in(?:[/?#]|$)/;
const IN_APP = START_URL.startsWith("https://cadus.aethex.in/") ? IN_APP_LIVE : { test: (u) => IN_APP_LIVE.test(u) || String(u).startsWith(START_URL) };
/** The Worker's Google sign-in start, on any aethex.in address. */
const GOOGLE_START = /^https:\/\/(?:(?:cadus|auth|login|www)\.)?aethex\.in\/api\/auth\/google(?:[?#]|$)/;
const PROTOCOL = "cadus";

app.setAppUserModelId("in.aethex.cadus");
if (!app.requestSingleInstanceLock()) { app.quit(); }
// cadus:// links open this app (Windows and Linux register it here; macOS from Info.plist).
if (process.defaultApp && process.argv.length >= 2) app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
else app.setAsDefaultProtocolClient(PROTOCOL);

/** The Google sign-in waiting to come back from the browser: its secret and where it started. */
let pendingGoogle = null; // { verifier, origin, at }

function startGoogleInBrowser(rawUrl) {
  const u = new URL(rawUrl);
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  pendingGoogle = { verifier, origin: u.origin, at: Date.now() };
  u.searchParams.set("desktop", challenge);
  shell.openExternal(u.toString());
  if (win && !win.isDestroyed()) win.loadFile(path.join(__dirname, "google-wait.html"), { query: { back: win.webContents.getURL() || START_URL } });
}

/** cadus://signed-in?code=… from the browser: finish the sign-in in the app window. */
function handleAppLink(link) {
  let u;
  try { u = new URL(link); } catch { return; }
  if (u.protocol !== `${PROTOCOL}:`) return;
  const code = u.searchParams.get("code") || "";
  const p = pendingGoogle;
  if (u.hostname !== "signed-in" || !/^[A-Za-z0-9_-]{43}$/.test(code) || !p || Date.now() - p.at > 15 * 60_000) return;
  pendingGoogle = null;
  const finish = new URL("/api/auth/desktop", p.origin);
  finish.searchParams.set("code", code);
  finish.searchParams.set("verifier", p.verifier);
  if (!win || win.isDestroyed()) createWindow();
  win.loadURL(finish.toString());
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
const linkIn = (argv) => argv.find((a) => typeof a === "string" && a.startsWith(`${PROTOCOL}://`));
app.on("open-url", (e, link) => { e.preventDefault(); app.whenReady().then(() => handleAppLink(link)); });

let win = null;
const statePath = () => path.join(app.getPath("userData"), "window-state.json");
const readState = () => { try { return JSON.parse(fs.readFileSync(statePath(), "utf8")); } catch { return {}; } };
const saveState = () => {
  if (!win || win.isDestroyed()) return;
  const s = { ...win.getNormalBounds(), maximized: win.isMaximized() };
  try { fs.writeFileSync(statePath(), JSON.stringify(s)); } catch { /* read-only profile */ }
};

/** The site sees an ordinary Chrome browser (Google refuses sign-in from embedded browsers), plus a Cadus tag. */
function userAgent() {
  const ua = session.defaultSession.getUserAgent()
    .replace(/\sElectron\/\S+/, "")
    .replace(new RegExp(`\\s${app.getName()}\\/\\S+`, "i"), "")
    .replace(/\scadus-desktop\/\S+/i, "");
  return `${ua} CadusDesktop/${app.getVersion()}`;
}

function openExternally(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:") shell.openExternal(u.toString());
  } catch { /* not a URL */ }
}

function createWindow() {
  const state = readState();
  win = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 840,
    x: state.x,
    y: state.y,
    minWidth: 380,
    minHeight: 560,
    title: "Cadus",
    show: false,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#111418" : "#FAFAF8",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: true,
      navigateOnDragDrop: false,
    },
  });
  if (state.maximized) win.maximize();
  win.once("ready-to-show", () => { if (!startHidden) win.show(); startHidden = false; });
  win.on("close", (e) => {
    saveState();
    // With the tray on, closing the window keeps Cadus running (for reminders and the shortcut).
    if (!quitting && settings.tray && tray) {
      e.preventDefault();
      win.hide();
      if (!settings.toldAboutTray) {
        settings.toldAboutTray = true;
        saveSettings();
        notify("Cadus is still running", "It's in the tray, for reminders and Ctrl+Shift+Space. Right-click the tray icon to quit.", null);
      }
    }
  });

  const wc = win.webContents;
  wc.setUserAgent(userAgent());

  // New windows (target=_blank, window.open): aethex.in stays in the app, the rest goes to the browser.
  wc.setWindowOpenHandler(({ url }) => {
    if (GOOGLE_START.test(url)) { startGoogleInBrowser(url); return { action: "deny" }; }
    if (IN_APP.test(url)) { wc.loadURL(url); return { action: "deny" }; }
    openExternally(url);
    return { action: "deny" };
  });
  // Navigation in the window: only aethex.in. Google sign-in goes to the system browser.
  wc.on("will-navigate", (e, url) => {
    if (GOOGLE_START.test(url)) { e.preventDefault(); startGoogleInBrowser(url); return; }
    if (IN_APP.test(url) || url.startsWith("file://")) return;
    e.preventDefault();
    openExternally(url);
  });
  wc.on("will-redirect", (e, url) => {
    if (IN_APP.test(url)) return;
    e.preventDefault();
    openExternally(url);
  });

  // No connection: a local page that retries.
  wc.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3: navigation replaced, not an error
    const retry = IN_APP.test(url) ? url : START_URL;
    win.loadFile(path.join(__dirname, "offline.html"), { query: { retry, code: String(code) } });
  });

  // Right-click: copy, paste and spelling suggestions.
  wc.on("context-menu", (_e, p) => {
    const items = [];
    for (const s of p.dictionarySuggestions.slice(0, 5)) items.push({ label: s, click: () => wc.replaceMisspelling(s) });
    if (p.misspelledWord) items.push({ label: "Add to dictionary", click: () => wc.session.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: "separator" });
    if (p.isEditable) items.push({ role: "cut", enabled: p.editFlags.canCut }, { role: "copy", enabled: p.editFlags.canCopy }, { role: "paste", enabled: p.editFlags.canPaste }, { role: "selectAll" });
    else if (p.selectionText.trim()) items.push({ role: "copy" });
    if (p.linkURL && !p.linkURL.startsWith("javascript:")) items.push({ type: "separator" }, { label: "Open link in browser", click: () => openExternally(p.linkURL) }, { label: "Copy link", click: () => require("electron").clipboard.writeText(p.linkURL) });
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });

  wc.loadURL(START_URL);
}

function secureSession() {
  const s = session.fromPartition(PARTITION);
  s.setUserAgent(userAgent());
  // Microphone for dictation, clipboard, notifications and full screen, for aethex.in only.
  const allowed = new Set(["media", "clipboard-read", "clipboard-sanitized-write", "notifications", "fullscreen"]);
  s.setPermissionRequestHandler((wc, permission, callback, details) => {
    const origin = details.requestingUrl || wc.getURL();
    callback(IN_APP.test(origin) && allowed.has(permission) && (permission !== "media" || !(details.mediaTypes || []).includes("video")));
  });
  s.setPermissionCheckHandler((_wc, permission, origin) => IN_APP.test(`${origin}/`) && allowed.has(permission));
  // Files saved from Cadus (Word, PDF, exports) go through the usual Save dialog.
  s.on("will-download", (_e, item) => { item.setSaveDialogOptions({ title: "Save from Cadus", defaultPath: path.join(app.getPath("downloads"), item.getFilename()) }); });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        { label: `New chat (${shortcutLabel()})`, click: () => openTarget("new-chat") },
        { label: "Today", click: () => openTarget("today") },
        { type: "separator" },
        ...settingsItems(),
        { type: "separator" },
        isMac ? { role: "close" } : { label: "Quit Cadus", accelerator: "CmdOrCtrl+Q", click: quitApp },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { label: "Home", accelerator: "Alt+Home", click: () => win && win.loadURL(START_URL) },
        { role: "reload" },
        { type: "separator" },
        { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        { label: "Cadus help and safety", click: () => openExternally("https://cadus.aethex.in/about") },
        { label: "Check for updates", click: () => checkForUpdate(true) },
        { label: "Download page", click: () => openExternally(DOWNLOADS_URL) },
        { type: "separator" },
        { label: `Cadus ${app.getVersion()}`, enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/** "1.2.0" > "1.1.9" */
const newer = (a, b) => {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
};

/** Once a day (and from the Help menu): a newer version on aethex.in/downloads? */
async function checkForUpdate(manual = false) {
  const stampPath = path.join(app.getPath("userData"), "update-check.json");
  if (!manual) {
    try { if (Date.now() - JSON.parse(fs.readFileSync(stampPath, "utf8")).at < 86400_000) return; } catch { /* first time */ }
  }
  try {
    const r = await net.fetch(MANIFEST_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    const m = await r.json();
    try { fs.writeFileSync(stampPath, JSON.stringify({ at: Date.now() })); } catch { /* read-only */ }
    if (m && m.version && newer(m.version, app.getVersion())) {
      const { response } = await dialog.showMessageBox(win, { type: "info", buttons: ["Download", "Later"], defaultId: 0, cancelId: 1, title: "Update available", message: `Cadus ${m.version} is available`, detail: `You have ${app.getVersion()}. The download page has the new installer.` });
      if (response === 0) openExternally(DOWNLOADS_URL);
    } else if (manual) {
      dialog.showMessageBox(win, { type: "info", buttons: ["OK"], title: "Cadus is up to date", message: `Cadus ${app.getVersion()} is the latest version.` });
    }
  } catch {
    if (manual) dialog.showMessageBox(win, { type: "warning", buttons: ["OK"], title: "Couldn't check", message: "Couldn't check for updates. Check your connection and try again." });
  }
}


/* ------------------------------------------------------------------ settings */

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");
const DEFAULTS = { tray: true, startAtLogin: false, reminders: true, shortcut: true, lastReminder: 0, toldAboutTray: false };
let settings = { ...DEFAULTS };
function loadSettings() {
  try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsPath(), "utf8")) }; } catch { settings = { ...DEFAULTS }; }
}
function saveSettings() { try { fs.writeFileSync(settingsPath(), JSON.stringify(settings)); } catch { /* read-only profile */ } }
/** Started by the computer at sign-in: stay in the tray until opened. */
let startHidden = process.argv.includes("--hidden");
let quitting = false;
function quitApp() { quitting = true; app.quit(); }
app.on("before-quit", () => { quitting = true; });

function setSetting(key, value) {
  settings[key] = value;
  saveSettings();
  if (key === "startAtLogin") applyStartAtLogin();
  if (key === "shortcut") applyShortcut();
  if (key === "tray") { if (value) makeTray(); else if (tray) { tray.destroy(); tray = null; } }
  buildMenu();
  refreshTray();
}
function settingsItems() {
  return [
    { label: "Keep running in the tray when closed", type: "checkbox", checked: settings.tray, click: (i) => setSetting("tray", i.checked) },
    { label: process.platform === "win32" ? "Start with Windows" : "Start when the computer starts", type: "checkbox", checked: settings.startAtLogin, enabled: process.platform !== "darwin", click: (i) => setSetting("startAtLogin", i.checked) },
    { label: "Reminders (cards due, ward jobs)", type: "checkbox", checked: settings.reminders, click: (i) => setSetting("reminders", i.checked) },
    { label: `Quick-open shortcut (${shortcutLabel()})`, type: "checkbox", checked: settings.shortcut, click: (i) => setSetting("shortcut", i.checked) },
  ];
}

/* ------------------------------------------------------------------ start with the computer */

function applyStartAtLogin() {
  const on = !!settings.startAtLogin;
  if (process.platform === "win32") {
    try { app.setLoginItemSettings({ openAtLogin: on, args: ["--hidden"] }); } catch { /* not allowed */ }
  } else if (process.platform === "linux") {
    // The freedesktop way: a .desktop file in ~/.config/autostart.
    const dir = path.join(app.getPath("home"), ".config", "autostart");
    const file = path.join(dir, "cadus.desktop");
    try {
      if (on) {
        const exe = process.env.APPIMAGE || process.execPath;
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(file, `[Desktop Entry]\nType=Application\nName=Cadus\nComment=Clinical AI by Aethex\nExec="${exe.replace(/"/g, '\\"')}" --hidden\nIcon=cadus\nTerminal=false\nX-GNOME-Autostart-enabled=true\n`);
      } else if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch { /* read-only home */ }
  }
}

/* ------------------------------------------------------------------ opening parts of Cadus */

const TARGETS = new Set(["new-chat", "today", "calculators", "flashcards", "ward", "studyplan", "handover", "discharge", "ddx", "practice"]);
function showWindow() {
  if (!win || win.isDestroyed()) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
/** Opens a part of Cadus: through the page when it is loaded, otherwise by address. */
async function openTarget(target) {
  if (!TARGETS.has(target)) return;
  showWindow();
  const wc = win.webContents;
  let viaPage = false;
  try {
    if (IN_APP.test(wc.getURL()) && !wc.isLoading()) {
      viaPage = await wc.executeJavaScript(`(function(){ if (typeof window.__cadusStatus !== "function") return false; window.dispatchEvent(new CustomEvent("cadus:open", { detail: ${JSON.stringify(target)} })); return true; })()`, true);
    }
  } catch { viaPage = false; }
  if (!viaPage) {
    const u = new URL(START_URL);
    u.searchParams.set("open", target);
    wc.loadURL(u.toString());
  }
}

/** What is waiting, from the page: counts only. null when Cadus isn't open or signed in. */
async function readStatus() {
  if (!win || win.isDestroyed()) return null;
  const wc = win.webContents;
  if (!IN_APP.test(wc.getURL()) || wc.isLoading()) return null;
  try {
    const s = await Promise.race([
      wc.executeJavaScript(`(function(){ try { return typeof window.__cadusStatus === "function" ? window.__cadusStatus() : null; } catch (e) { return null; } })()`, true),
      new Promise((r) => setTimeout(() => r(null), 3000)),
    ]);
    if (!s || typeof s !== "object") return null;
    const n = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(9999, Math.round(Number(v)))) : 0);
    return { cardsDue: n(s.cardsDue), learnDue: n(s.learnDue), openJobs: n(s.openJobs), studyToday: typeof s.studyToday === "string" ? s.studyToday.slice(0, 80) : "" };
  } catch { return null; }
}
function statusParts(s) {
  if (!s) return [];
  const p = [];
  if (s.openJobs) p.push(`${s.openJobs} ward job${s.openJobs === 1 ? "" : "s"} open`);
  if (s.cardsDue) p.push(`${s.cardsDue} flashcard${s.cardsDue === 1 ? "" : "s"} due`);
  if (s.learnDue) p.push(`${s.learnDue} Learn question${s.learnDue === 1 ? "" : "s"} to revise`);
  if (s.studyToday) p.push(s.studyToday);
  return p;
}

/* ------------------------------------------------------------------ tray */

let tray = null;
let lastStatus = null;
function trayImage() {
  const dir = path.join(__dirname, "build", "icons");
  const img = nativeImage.createFromPath(path.join(dir, "16x16.png"));
  const big = nativeImage.createFromPath(path.join(dir, "32x32.png"));
  if (!img.isEmpty() && !big.isEmpty()) { img.addRepresentation({ scaleFactor: 2, width: 32, height: 32, buffer: big.toPNG() }); return img; }
  return nativeImage.createFromPath(path.join(__dirname, "build", "icon.png")).resize({ width: 16, height: 16 });
}
function makeTray() {
  if (tray || process.platform === "darwin") return;
  try { tray = new Tray(trayImage()); } catch { tray = null; return; }
  tray.setToolTip("Cadus");
  tray.on("click", () => { if (win && win.isVisible() && win.isFocused()) win.hide(); else showWindow(); });
  refreshTray();
}
function refreshTray() {
  if (!tray) return;
  const parts = statusParts(lastStatus);
  tray.setToolTip(parts.length ? `Cadus: ${parts.join(", ")}` : "Cadus");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open Cadus", click: showWindow },
    { label: `New chat\t${shortcutLabel()}`, click: () => openTarget("new-chat") },
    { label: "Today", click: () => openTarget("today") },
    { label: "Calculators", click: () => openTarget("calculators") },
    { label: "Flashcards", click: () => openTarget("flashcards") },
    { label: "Study plan", click: () => openTarget("studyplan") },
    ...(parts.length ? [{ type: "separator" }, ...parts.map((p) => ({ label: p, enabled: false }))] : []),
    { type: "separator" },
    ...settingsItems(),
    { type: "separator" },
    { label: "Quit Cadus", click: quitApp },
  ]));
}

/* ------------------------------------------------------------------ quick-open shortcut */

const SHORTCUTS = ["CommandOrControl+Shift+Space", "CommandOrControl+Alt+C"];
let shortcut = "";
function shortcutLabel() { return (shortcut || SHORTCUTS[0]).replace("CommandOrControl", process.platform === "darwin" ? "Cmd" : "Ctrl"); }
function applyShortcut() {
  if (shortcut) { try { globalShortcut.unregister(shortcut); } catch { /* already gone */ } shortcut = ""; }
  if (!settings.shortcut) return;
  // Another app may own the first choice; then the second.
  for (const key of SHORTCUTS) {
    try { if (globalShortcut.register(key, () => openTarget("new-chat"))) { shortcut = key; return; } } catch { /* taken */ }
  }
}
app.on("will-quit", () => globalShortcut.unregisterAll());

/* ------------------------------------------------------------------ reminders */

/** Tests of an unpackaged build (CADUS_TEST=1) can reach these; an installed app never exposes them. */
const TEST = !app.isPackaged && process.env.CADUS_TEST === "1" ? (globalThis.__cadusTest = { notes: [] }) : null;
function notify(title, body, target) {
  if (TEST) TEST.notes.push({ title, body, target });
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, icon: path.join(__dirname, "build", "icon.png"), silent: false });
  if (target) n.on("click", () => openTarget(target));
  n.show();
}
const REMIND_EVERY = 3 * 3600_000;
/** Every 15 minutes: refresh the tray, and between 8 am and 9 pm, at most every 3 hours, remind. */
async function checkReminders() {
  lastStatus = await readStatus();
  refreshTray();
  if (!settings.reminders || !lastStatus) return;
  const h = new Date().getHours();
  if (h < 8 || h >= 21 || Date.now() - (settings.lastReminder || 0) < REMIND_EVERY) return;
  const parts = statusParts(lastStatus);
  if (!parts.length) return;
  settings.lastReminder = Date.now();
  saveSettings();
  notify("Cadus: waiting for you", parts.join(" · "), "today");
}

if (TEST) Object.assign(TEST, { checkReminders, readStatus, openTarget, setSetting, settings: () => settings, hasTray: () => !!tray, shortcut: () => shortcut, isQuitting: () => quitting });

app.on("second-instance", (_e, argv) => {
  const link = linkIn(argv);
  if (link) { handleAppLink(link); return; }
  // Opening Cadus again (or from the Start menu while it is in the tray) shows the window.
  if (!argv.includes("--hidden")) showWindow();
});
app.on("web-contents-created", (_e, contents) => {
  // No <webview> tags and no other windows, whatever a page asks for.
  contents.on("will-attach-webview", (e) => e.preventDefault());
});
app.whenReady().then(() => {
  loadSettings();
  if (!settings.tray) startHidden = false;
  secureSession();
  applyShortcut();
  buildMenu();
  createWindow();
  if (settings.tray) makeTray();
  if (settings.startAtLogin) applyStartAtLogin();
  setTimeout(() => void checkReminders(), 90_000);
  setInterval(() => void checkReminders(), 15 * 60_000);
  const first = linkIn(process.argv);
  if (first) handleAppLink(first);
  setTimeout(() => checkForUpdate(false), 15_000);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin" && !(settings.tray && tray)) app.quit(); });
