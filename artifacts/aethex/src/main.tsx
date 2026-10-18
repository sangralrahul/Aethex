import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockApi } from "@/lib/mockApi";
import { installAiBridge } from "@/lib/ai-bridge";
import { bootHandoff } from "@/lib/handoff";

installMockApi();
installAiBridge();

// A sign-in handed back from auth.aethex.in or login.aethex.in is picked up
// before the app starts; a request to sign in leaves for the sign-in page.
const leaving = bootHandoff();
if (!leaving) createRoot(document.getElementById("root")!).render(<App />);

// The service worker caches the app shell, so Aethex and Cadus open fast and work offline.
// A new deploy is picked up on the next visit (the worker updates itself).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}
