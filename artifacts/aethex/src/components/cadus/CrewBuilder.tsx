/**
 * Assistant Builder: describe an assistant in one line and Cadus writes it (name, tagline,
 * instructions, starters, icon, colour, tool). It opens in the usual editor to review and save.
 */
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { CREW_ICONS, CREW_TONES, type CrewMember } from "@/lib/cadus/crew";

const IDEAS = ["A strict NEET-PG pharmacology examiner", "A night-shift buddy for the medicine ward", "Explains lab reports to patients in Tamil", "A dermatology resident who quizzes me on spot diagnoses"];

export default function CrewBuilder({ build, onBuilt, friendlyError, toast, disabled }: {
  build: (description: string) => Promise<any>;
  onBuilt: (c: CrewMember) => void;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    const d = text.trim();
    if (d.split(/\s+/).length < 2) { toast("Describe the assistant in a few words"); return; }
    setBusy(true);
    try {
      const r = await build(d);
      const a = r?.assistant;
      if (!a?.name || !a?.instructions) throw new Error("Couldn't build that assistant. Try describing it a little more.");
      onBuilt({
        id: "", name: String(a.name).slice(0, 40), tagline: String(a.tagline ?? "").slice(0, 90), instructions: String(a.instructions).slice(0, 4000),
        starters: (Array.isArray(a.starters) ? a.starters : []).slice(0, 4).map((s: unknown) => String(s).slice(0, 120)),
        icon: (CREW_ICONS as readonly string[]).includes(a.icon) ? a.icon : "stethoscope", tone: (CREW_TONES as readonly string[]).includes(a.tone) ? a.tone : "teal",
        mode: typeof a.mode === "string" ? a.mode : "general", sources: a.sources === true,
      });
      setText("");
      toast("Here's your assistant. Review it, then save.");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };
  return (
    <div className="cx-cb" data-crew="builder">
      <div className="cx-cb-h"><Wand2 size={16} /><b>Assistant Builder</b><small>Describe it in a line; Cadus writes the rest</small></div>
      <form className="cx-cb-form" onSubmit={(e) => { e.preventDefault(); void go(); }}>
        <input className="cx-input" value={text} onChange={(e) => setText(e.target.value.slice(0, 600))} placeholder="e.g. A strict NEET-PG pharmacology examiner who asks one MCQ at a time" aria-label="Describe your assistant" data-crew="describe" />
        <button className="cx-btn primary" type="submit" disabled={busy || disabled || !text.trim()} data-crew="build"><Wand2 size={15} /> {busy ? "Building…" : "Build it"}</button>
      </form>
      {!text && <div className="cx-cb-ideas">{IDEAS.map((i) => <button key={i} onClick={() => setText(i)}>{i}</button>)}</div>}
    </div>
  );
}
