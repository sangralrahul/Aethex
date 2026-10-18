import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockApi } from "@/lib/mockApi";
import { installAiBridge } from "@/lib/ai-bridge";
import { bootAccount } from "@/lib/account";

installMockApi();
installAiBridge();

// Who is signed in comes from the Worker (one session for every aethex.in
// site); old sign-in addresses go to auth.aethex.in or login.aethex.in.
const { leaving, ready } = bootAccount();
if (!leaving) void ready.then(() => createRoot(document.getElementById("root")!).render(<App />));

// The service worker caches the app shell, so Aethex and Cadus open fast and work offline.
// A new deploy is picked up on the next visit (the worker updates itself).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}
