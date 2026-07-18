import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockApi } from "@/lib/mockApi";

installMockApi();

// Subdomain routing: cadus.aethex.in → https://aethex.in/ai-assistant
if (window.location.hostname === "cadus.aethex.in") {
  window.location.replace("https://aethex.in/ai-assistant");
}

createRoot(document.getElementById("root")!).render(<App />);
