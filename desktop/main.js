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
const { app, BrowserWindow, Menu, shell, session, dialog, nativeTheme, net } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

const START_URL = "https://cadus.aethex.in/";
const DOWNLOADS_URL = "https://aethex.in/downloads";
const MANIFEST_URL = "https://aethex.in/downloads/latest.json";
const PARTITION = "persist:cadus";

/** Addresses the window may show; everything else opens in the browser. */
const IN_APP = /^https:\/\/(?:(?:cadus|auth|login)\.)?aethex\.in(?:[/?#]|$)/;
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
  win.once("ready-to-show", () => win.show());
  win.on("close", saveState);

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
    { label: "File", submenu: [isMac ? { role: "close" } : { role: "quit", label: "Quit Cadus" }] },
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

app.on("second-instance", (_e, argv) => {
  const link = linkIn(argv);
  if (link) { handleAppLink(link); return; }
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.on("web-contents-created", (_e, contents) => {
  // No <webview> tags and no other windows, whatever a page asks for.
  contents.on("will-attach-webview", (e) => e.preventDefault());
});
app.whenReady().then(() => {
  secureSession();
  buildMenu();
  createWindow();
  const first = linkIn(process.argv);
  if (first) handleAppLink(first);
  setTimeout(() => checkForUpdate(false), 15_000);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
