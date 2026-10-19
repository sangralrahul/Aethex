// After `npm run dist`: lists the installers with their sizes and SHA-256 and
// writes the release manifest twice:
//   artifacts/aethex/src/lib/downloads/release.json   read by the download page
//   artifacts/aethex/public/downloads/latest.json      checked by the app for updates
// The installers themselves are uploaded to Cloudflare R2 (see desktop/README.md).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const BASE = `https://downloads.aethex.in/cadus/${version}`;
const rel = path.join(root, "release");

const want = [
  { id: "win-x64", os: "windows", arch: "x64", kind: "Installer (.exe)", file: `Cadus-Setup-${version}-x64.exe` },
  { id: "win-arm64", os: "windows", arch: "arm64", kind: "Installer (.exe)", file: `Cadus-Setup-${version}-arm64.exe` },
  { id: "linux-appimage", os: "linux", arch: "x64", kind: "AppImage", file: `Cadus-${version}-x86_64.AppImage` },
  { id: "linux-deb", os: "linux", arch: "x64", kind: "Debian / Ubuntu (.deb)", file: `Cadus-${version}-amd64.deb` },
];

const files = want.map((w) => {
  const p = path.join(rel, w.file);
  if (!fs.existsSync(p)) throw new Error(`missing ${w.file} in release/`);
  const buf = fs.readFileSync(p);
  return { ...w, url: `${BASE}/${w.file}`, size: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex") };
});

const manifest = {
  product: "Cadus",
  version,
  released: new Date().toISOString().slice(0, 10),
  electron: pkg.devDependencies.electron,
  files,
  notes: [
    "Continue with Google now works: Google sign-in opens in your usual browser, then brings you back to Cadus signed in.",
    "Opens Cadus in its own window, with your sign-in, chats and settings kept on this computer.",
    "Checks once a day for a newer version and tells you when one is ready.",
  ],
};

const site = path.resolve(root, "../artifacts/aethex");
fs.mkdirSync(path.join(site, "src/lib/downloads"), { recursive: true });
fs.mkdirSync(path.join(site, "public/downloads"), { recursive: true });
fs.writeFileSync(path.join(site, "src/lib/downloads/release.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(site, "public/downloads/latest.json"), JSON.stringify({ product: "Cadus", version, released: manifest.released, url: "https://aethex.in/downloads" }, null, 2) + "\n");
fs.writeFileSync(path.join(rel, "SHA256SUMS.txt"), files.map((f) => `${f.sha256}  ${f.file}`).join("\n") + "\n");
for (const f of files) console.log(`${f.file.padEnd(34)} ${(f.size / 1048576).toFixed(1).padStart(6)} MB  ${f.sha256}`);
