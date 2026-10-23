/**
 * Patient Messages: appointment reminders, reports ready, follow-up, fasting before a test, how to
 * take a medicine and more, written in the patient's language with an English check, to send on
 * WhatsApp or copy.
 */
import { useState } from "react";
import { Copy, Loader2, MessageCircle, Send, TriangleAlert } from "lucide-react";
import { LANGUAGES } from "@/lib/cadus/leaflets";

const PURPOSES = [
  { id: "appointment", label: "Appointment reminder", ph: "e.g. Monday 3 Nov, 10:30 am, bring old reports" },
  { id: "reports", label: "Reports are ready", ph: "e.g. Blood reports ready; collect from the counter after 4 pm" },
  { id: "follow-up", label: "Follow-up due", ph: "e.g. Diabetes review due this week; come fasting for sugar test" },
  { id: "fasting", label: "Fasting before a test", ph: "e.g. Lipid profile tomorrow 8 am: nothing to eat after 9 pm, water allowed" },
  { id: "medicine", label: "How to take a medicine", ph: "e.g. Insulin 10 units before breakfast; keep it in the fridge door" },
  { id: "vaccination", label: "Vaccination due", ph: "e.g. Baby's 14-week vaccines due on 20 Nov" },
  { id: "procedure", label: "Before a procedure", ph: "e.g. Endoscopy on Friday 9 am: nothing to eat from midnight, come with an attendant" },
  { id: "custom", label: "Anything else", ph: "Write what the message should say" },
];

export default function PatientMessageView({ generate, friendlyError, toast, defaultLanguage, clinic }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  defaultLanguage: string;
  /** The clinic's name and phone from the letterhead. */
  clinic: string;
}) {
  const [purpose, setPurpose] = useState("appointment");
  const [details, setDetails] = useState("");
  const [language, setLanguage] = useState(LANGUAGES.includes(defaultLanguage) && defaultLanguage !== "English" ? defaultLanguage : "Hindi");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ message: string; english: string } | null>(null);
  const def = PURPOSES.find((p) => p.id === purpose)!;
  const run = async () => {
    setBusy(true);
    try {
      const r = await generate({ action: "patient-message", purpose, details: details.trim(), language, clinic });
      if (!r?.result) throw new Error("No message came back");
      setOut(r.result);
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  };
  return (
    <section className="cx-page cx-lab cx-pmsg">
      <header className="cx-page-h"><div><h1>Patient Messages</h1><p>Reminders and instructions for patients in their own language, with an English version to check, ready to send on WhatsApp.</p></div></header>
      <div className="cx-oncall-calls">{PURPOSES.map((p) => <button key={p.id} className={purpose === p.id ? "on" : ""} onClick={() => setPurpose(p.id)} data-pmsg-purpose={p.id}>{p.label}</button>)}</div>
      <label className="cx-field"><span>Details</span><textarea className="cx-input" rows={3} value={details} onChange={(e) => setDetails(e.target.value.slice(0, 1500))} placeholder={def.ph} data-pmsg="details" /></label>
      <div className="cx-mr-pt">
        <label className="cx-field"><span>Language</span><select className="cx-select" value={language} onChange={(e) => setLanguage(e.target.value)} data-pmsg="lang">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void run()} disabled={busy || details.trim().length < 4} data-pmsg="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <MessageCircle size={14} />} Write the message</button></div>
      {out && (
        <div className="cx-cmp-out" data-pmsg="out">
          <div className="cx-pmsg-bubble" lang="und">{out.message}</div>
          {out.english && language !== "English" && <details className="cx-pa-script" open><summary>In English, to check</summary><p>{out.english}</p></details>}
          <div className="cx-sc-acts">
            <a className="cx-btn primary" href={`https://wa.me/?text=${encodeURIComponent(out.message)}`} target="_blank" rel="noopener noreferrer" data-pmsg="whatsapp"><Send size={14} /> WhatsApp</a>
            <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(out.message); toast("Copied"); }}><Copy size={14} /> Copy</button>
          </div>
        </div>
      )}
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Read the English version before sending. Don't add the patient's name here; add it in WhatsApp if you need to.</p>
    </section>
  );
}
