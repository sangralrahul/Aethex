/**
 * Stop alerts (/alerts/stop?token=…), from the link in a back-in-stock or
 * price-drop email: one button removes every alert for that email address.
 * The button (not the link alone) does it, so mail scanners that open links
 * don't. Data: POST /api/store/alerts/stop (worker/store.ts).
 */
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { BellOff, Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { stopAlerts } from "@/lib/store/api";

export default function AlertsStop() {
  useSeo({ title: "Stop alerts | Aethex", description: "Stop back-in-stock and price-drop emails.", path: "/alerts/stop" });
  const token = new URLSearchParams(useSearch()).get("token") ?? "";
  const [state, setState] = useState<"ask" | "busy" | "done" | "error">("ask");
  const [msg, setMsg] = useState("");
  const stop = async () => {
    setState("busy");
    try { const r = await stopAlerts(token); setMsg(r.email); setState("done"); }
    catch (e) { setMsg((e as Error).message); setState("error"); }
  };
  return (
    <div className="ax-cart-page">
      <div className="ax-wrap">
      <div className="ax-co-done ax-solo">
        <span className={state === "done" ? "ok" : "ok plain"}>{state === "done" ? <svg className="draw" viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : <BellOff size={32} />}</span>
        <h1>{state === "done" ? "Alerts stopped" : "Stop alert emails"}</h1>
        {state === "done" ? (
          <p className="lead">We won't send any more back-in-stock or price-drop emails to {msg}.</p>
        ) : !token ? (
          <p className="lead">This link is incomplete. Use the link at the bottom of the alert email.</p>
        ) : (
          <>
            <p className="lead">Stop every back-in-stock and price-drop alert sent to the email address this link came to.</p>
            <div className="ax-co-next">
              <button type="button" className="ax-btn teal lg" onClick={stop} disabled={state === "busy"}>{state === "busy" ? <Loader2 size={17} className="spin" /> : <BellOff size={17} />} Stop all alerts</button>
            </div>
            {state === "error" && <p className="ax-form-err" role="alert">{msg}</p>}
          </>
        )}
        <div className="ax-co-next"><Link href="/shop" className="ax-btn lg">Back to the store</Link></div>
      </div>
      </div>
    </div>
  );
}
