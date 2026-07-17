import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockApi } from "@/lib/mockApi";

installMockApi();

// Subdomain routing: cadus.aethex.in → /cadus-ai/
if (window.location.hostname === "cadus.aethex.in") {
  const target = "/cadus-ai/";
  if (!window.location.pathname.startsWith("/cadus-ai")) {
    window.location.replace(target);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
