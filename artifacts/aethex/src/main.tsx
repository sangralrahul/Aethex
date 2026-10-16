import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockApi } from "@/lib/mockApi";
import { installAiBridge } from "@/lib/ai-bridge";

installMockApi();
installAiBridge();


createRoot(document.getElementById("root")!).render(<App />);
