// Runs before every install (Windows, macOS, Linux and Cloudflare's build): removes npm and
// Yarn lockfiles and stops installs that don't use pnpm. Plain Node, so no shell is needed.
const fs = require("node:fs");
for (const f of ["package-lock.json", "yarn.lock"]) {
  try { fs.rmSync(f, { force: true }); } catch { /* not there */ }
}
if (!/^pnpm\//.test(process.env.npm_config_user_agent || "")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
