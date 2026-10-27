import fs from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";
const buildOutDir = path.resolve(import.meta.dirname, "..", "..", "dist");

/**
 * The scripts the app shell needs to start offline: the entry, Cadus, and every
 * script they import statically (react-dom, icons and so on). Other pages and
 * heavy extras (diagram types, PDF export) are cached the first time they load.
 */
const shellScripts = new Set<string>();
function appShell(): Plugin {
  return {
    name: "aethex-app-shell",
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((c): c is Extract<typeof c, { type: "chunk" }> => c.type === "chunk");
      const byFile = new Map(chunks.map((c) => [c.fileName, c]));
      const add = (file: string) => {
        if (shellScripts.has(file)) return;
        shellScripts.add(file);
        byFile.get(file)?.imports.forEach(add);
      };
      for (const c of chunks) if (c.isEntry || /[\\/]pages[\\/]CadusAI\.tsx$/.test(c.facadeModuleId ?? "")) add(c.fileName);
    },
  };
}

function spaRouteFallbacks(): Plugin {
  const routes = ["login", "sign-in", "signup", "onboarding", "ai-assistant", "ai-assistant/sign-in", "shared", "ai-assistant/shared", "terms", "privacy", "disclaimer", "about", "ai-assistant/terms", "ai-assistant/privacy", "ai-assistant/disclaimer", "ai-assistant/about", "plans", "ai-assistant/plans", "downloads", "ai-assistant-classic", "cadus-standalone"];

  return {
    name: "aethex-spa-route-fallbacks",
    closeBundle() {
      const indexFile = path.join(buildOutDir, "index.html");
      if (!fs.existsSync(indexFile)) return;

      fs.copyFileSync(indexFile, path.join(buildOutDir, "404.html"));
      for (const route of routes) {
        const routeDir = path.join(buildOutDir, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.copyFileSync(indexFile, path.join(routeDir, "index.html"));
      }
    },
  };
}

/**
 * Update 49: search-engine heads for the main public pages. Each gets its own copy of index.html
 * (served for /shop as shop.html) with its title, description, canonical link and preview tags in
 * the HTML itself, so crawlers and link previews see them without running the app.
 */
const SEO_PAGES: { file: string; path: string; title: string; description: string }[] = [
  { file: "shop.html", path: "/shop", title: "Medical devices and supplies | Aethex Store", description: "Genuine BP monitors, stethoscopes, glucometers, oximeters, orthopaedic supports and diagnostic instruments from verified brands, with cash on delivery across India." },
  { file: "brands.html", path: "/brands", title: "Brands we stock | Aethex Store", description: "OMRON, Dr Trust, Tynor, Accu-Chek, Rossmax, 3M Littmann, MDF Instruments and HEINE, and for hospitals and colleges BD, Mindray, Ambu, Laerdal, 3B Scientific, Narang Medical, Magnus, Remi, Borosil and more." },
  { file: "books.html", path: "/books", title: "Medical books for every course | Aethex", description: "Textbooks, reviews and exam books for MBBS, MD/MS, nursing, dental, pharmacy, physiotherapy, AYUSH and allied health, with the publishers' latest editions and prices." },
  { file: "study-hub.html", path: "/study-hub", title: "Study Hub — NEET-PG, NExT, FMGE & USMLE preparation | Aethex", description: "Question banks, mock tests, flashcards, a medical knowledge hub and a clinical case every day, plus a comparison of coaching platforms, books and free resources." },
  { file: "contact.html", path: "/contact", title: "Contact us | Aethex", description: "Questions about an order, a product, returns or Cadus: write to the Aethex team." },
  { file: "ai-assistant/index.html", path: "/ai-assistant", title: "Cadus: clinical AI assistant for doctors and medical students in India", description: "Ask Cadus clinical questions free, no sign-up needed for simple chat. Safety-reviewed answers with sources, 300+ clinical tools and calculators, NEET-PG practice and Cadus Crew assistants." },
];
function seoPages(): Plugin {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return {
    name: "aethex-seo-pages",
    closeBundle() {
      const indexFile = path.join(buildOutDir, "index.html");
      if (!fs.existsSync(indexFile)) return;
      const base = fs.readFileSync(indexFile, "utf8");
      for (const p of SEO_PAGES) {
        const url = `https://aethex.in${p.path}`;
        let html = base
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`)
          .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(p.description)}" />`)
          .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
        const meta = (attr: string, key: string, value: string) => { html = html.replace(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*\\/?>`), `<meta ${attr}="${key}" content="${esc(value)}" />`); };
        meta("property", "og:url", url);
        meta("property", "og:title", p.title);
        meta("property", "og:description", p.description);
        meta("name", "twitter:title", p.title);
        meta("name", "twitter:description", p.description);
        const out = path.join(buildOutDir, p.file);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, html);
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered in src/main.tsx.
      injectRegister: false,
      base: basePath,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "favicon-32.png"],
      manifest: {
        name: "AETHEX - Medical Store",
        short_name: "AETHEX",
        description: "India's trusted medical SaaS platform for doctors and medical students",
        theme_color: "#007AFF",
        background_color: "#0B0F1A",
        display: "standalone",
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: "favicon-32.png", sizes: "32x32", type: "image/png" },
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" },
          { src: "favicon.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        ],
        categories: ["medical", "education", "health"],
        lang: "en",
      },
      workbox: {
        // The app shell (entry script, styles, fonts and icons) is precached so the app opens
        // offline and fast on a slow connection; page chunks are cached the first time they load.
        globPatterns: ["index.html", "assets/*.js", "**/*.{css,ico,svg}", "*.png", "fonts/cadus/plus-jakarta-sans-latin-wght-normal.woff2"],
        manifestTransforms: [
          async (entries) => ({
            manifest: entries.filter((e) => !/^assets\/[^/]+\.js$/.test(e.url) || shellScripts.has(e.url)),
            warnings: [],
          }),
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // A new version takes over as soon as it is installed. (Without this it waited
        // until every tab was closed, and kept serving the previous build's pages, whose
        // files are gone from the server after a deploy: "This page couldn't load".)
        skipWaiting: true,
        clientsClaim: true,
        // Pages come from the network first, so a deploy shows at once; offline, the last
        // copy (or the precached shell) is used. Neither "/" nor any other page is answered
        // from the precache while online: that copy can be an older build than the server's.
        navigateFallback: null,
        directoryIndex: null,
        runtimeCaching: [
          {
            // /api/* is the Cloudflare Worker (AI endpoints, /api/health), never a page.
            urlPattern: ({ request, url }: { request: Request; url: URL }) => request.mode === "navigate" && !url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "aethex-pages",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              precacheFallback: { fallbackURL: "index.html" },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // Hashed build files and fonts never change, so a cached copy is always right.
            urlPattern: ({ url }: { url: URL }) => url.origin === self.location.origin && (url.pathname.includes("/assets/") || url.pathname.includes("/fonts/")),
            handler: "CacheFirst",
            options: {
              cacheName: "aethex-chunks",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              // A file that is gone (an older build's chunk) is answered with the app's
              // index.html and status 200: never keep that as a script or a font.
              plugins: [{
                cacheWillUpdate: async ({ response }: { response?: Response }) =>
                  response && response.status === 200 && !(response.headers.get("content-type") || "").includes("text/html") ? response : null,
              }],
            },
          },
          {
            // Our own API, network first. Orders and the store admin are never kept on the device.
            urlPattern: ({ url }: { url: URL }) => url.origin === self.location.origin && url.pathname.startsWith("/api/") && !/^\/api\/store\/(?:admin|orders)/.test(url.pathname),
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
    }),
    appShell(),
    spaRouteFallbacks(),
    seoPages(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  envDir: path.resolve(import.meta.dirname, "..", ".."),
  build: {
    outDir: buildOutDir,
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
