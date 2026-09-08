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

function spaRouteFallbacks(): Plugin {
  const routes = ["login", "signup", "onboarding", "ai-assistant", "cadus-standalone"];

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

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
    }),
    spaRouteFallbacks(),
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
