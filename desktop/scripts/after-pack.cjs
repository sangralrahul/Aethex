// electron-builder afterPack hook: on Windows builds, put the Cadus icon and
// version details into Cadus.exe (what Explorer, the taskbar and "Apps &
// features" show). Done in JavaScript with resedit, so Windows installers can
// be built on Linux without Wine.
const fs = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;
  const ResEdit = await import("resedit");
  const PE = await import("pe-library");
  const info = context.packager.appInfo;
  const exePath = path.join(context.appOutDir, `${info.productFilename}.exe`);
  const icoPath = path.join(context.packager.info.buildResourcesDir, "icon.ico");

  const exe = PE.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = PE.NtExecutableResource.from(exe);

  // Replace every icon group (Electron ships one) with the Cadus icon.
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const ids = groups.length ? groups.map((g) => [g.id, g.lang]) : [[1, 1033]];
  for (const [id, lang] of ids) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, id, lang, ico.icons.map((i) => i.data));
  }

  // Version details.
  const [major, minor, patch] = info.version.split(".").map((n) => parseInt(n, 10) || 0);
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
  const langs = vi.getAllLanguagesForStringValues();
  const lang = langs[0] || { lang: 1033, codepage: 1200 };
  vi.setFileVersion(major, minor, patch, 0, lang.lang);
  vi.setProductVersion(major, minor, patch, 0, lang.lang);
  vi.setStringValues(lang, {
    CompanyName: "Aethex",
    FileDescription: "Cadus",
    ProductName: "Cadus",
    InternalName: "Cadus",
    OriginalFilename: "Cadus.exe",
    LegalCopyright: info.copyright || "Copyright © 2026 Aethex",
    FileVersion: info.version,
    ProductVersion: info.version,
  });
  vi.outputToResourceEntries(res.entries);

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log(`  • Cadus icon and version ${info.version} written into ${path.basename(exePath)}`);
};
