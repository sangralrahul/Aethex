# Cadus desktop app

Cadus for Windows (x64 and ARM64) and Linux (AppImage and .deb), built with
Electron. The app is a secure window onto https://cadus.aethex.in: sign-in,
chats and settings work as in the browser and stay on the computer; links
outside aethex.in open in the default browser; with no connection it shows a
local "can't connect" page that retries. Once a day it reads
https://aethex.in/downloads/latest.json and offers the download page when a
newer version is out. macOS is "coming soon" until the app is signed and
notarised with an Apple Developer ID.

The download page is https://aethex.in/downloads
(`artifacts/aethex/src/pages/Downloads.tsx`). The installers are served from
Cloudflare R2 at https://downloads.aethex.in/cadus/<version>/.

## Build

Needs Node 22 on Linux (Wine, with 32-bit support, for the Windows installers:
`apt install wine64 wine32:i386`). From this folder:

    npm install
    npm run dist

`npm run dist` builds the four installers into `release/`, then runs
`scripts/manifest.mjs`, which writes their sizes and SHA-256 to
`artifacts/aethex/src/lib/downloads/release.json` (the download page) and
`artifacts/aethex/public/downloads/latest.json` (the app's update check).
`scripts/after-pack.cjs` writes the Cadus icon and version details into
`Cadus.exe`.

## Publish a version

1. One time: create the bucket and its address.

       npx wrangler r2 bucket create aethex-downloads

   Then in the Cloudflare dashboard: R2 > aethex-downloads > Settings >
   Custom Domains > Connect Domain > `downloads.aethex.in`.

2. Upload the files (from the Aethex folder, on Windows):

       desktop\upload-r2.cmd

3. Commit the updated `release.json` and `latest.json` and push; the download
   page then lists the new files and installed apps offer the update.

For a new version, raise `version` in `package.json` (and `VER` in
`upload-r2.cmd`), build, upload, push.

## Signing (later)

Windows shows "Windows protected your PC" for unsigned installers until they
build a reputation. A code-signing certificate (for example an EV or Azure
Trusted Signing certificate) removes that; electron-builder signs during the
build once it is configured. macOS builds need an Apple Developer ID to sign and
notarise.
