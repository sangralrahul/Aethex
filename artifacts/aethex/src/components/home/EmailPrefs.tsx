/**
 * Update 86: /email-preferences on aethex.in: switch each kind of reminder email on or off, for the whole of Aethex.
 * Emails about something you did (orders, bookings, sign-in codes, replies to you) always go.
 * Data: GET/POST /api/notifications/prefs (worker/notify.ts, worker/prefs.ts). Styles: src/site-hub.css (.hb-prefs).
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Bell, Check, Loader2, Mail } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { loginUrl } from "@/lib/host";

type Data = { prefs: Record<string, boolean>; kinds: Record<string, string>; email: string };
export default function EmailPrefs() {
  useSeo({ title: "Email preferences | Aethex", description: "Choose which reminder emails Aethex sends you.", path: "/email-preferences" });
  const { isLoggedIn } = useUserAuth();
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState(""), [saved, setSaved] = useState(false), [busy, setBusy] = useState("");
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/notifications/prefs", { credentials: "same-origin" }).then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Couldn't load them."); setD(await r.json()); }).catch((e) => setErr((e as Error).message));
  }, [isLoggedIn]);
  const toggle = async (k: string, v: boolean) => {
    if (!d) return;
    setBusy(k); setSaved(false); setErr("");
    try {
      const r = await fetch("/api/notifications/prefs", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefs: { [k]: v } }) });
      if (!r.ok) throw new Error("Couldn't save. Try again.");
      const out = (await r.json()) as { prefs: Record<string, boolean> };
      setD({ ...d, prefs: out.prefs }); setSaved(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  };
  return (
    <div className="hb hb-prefs-page" data-home="prefs">
      <div className="hb-prefs">
        <Link href="/" className="back">Aethex</Link>
        <h1><Mail size={24} /> Email preferences</h1>
        {!isLoggedIn ? <><p>Sign in to choose which reminders we email you.</p><a className="hb-btn" href={loginUrl("/", { next: "/email-preferences" })}>Sign in</a></>
          : !d ? <p>{err || <><Loader2 size={16} className="spin" /> Loading…</>}</p> : <>
            <p className="sub">For {d.email}, across Aethex Doctors, Store, Study and the hospital and college portals.</p>
            <ul>{Object.entries(d.kinds).map(([k, label]) => (
              <li key={k}><label className="sw"><input type="checkbox" checked={d.prefs[k] !== false} disabled={busy === k} onChange={(e) => void toggle(k, e.target.checked)} data-pref={k} /><span className="track"><i /></span><span>{label}</span></label></li>
            ))}</ul>
            {saved && <p className="ok" role="status"><Check size={15} /> Saved.</p>}
            {err && <p className="err" role="alert">{err}</p>}
            <p className="fine"><Bell size={14} /> Emails about something you did, such as an order, an appointment you booked, a sign-in code or a reply to you, always go. In-app notifications are in the bell on aethex.in.</p>
          </>}
      </div>
    </div>
  );
}
