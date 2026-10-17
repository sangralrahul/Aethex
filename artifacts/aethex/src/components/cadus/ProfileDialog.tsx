/** The "Personalise Cadus" dialog: who the user is, so answers fit their level. */
import { useState } from "react";
import { ShieldCheck, Sparkles, X } from "lucide-react";
import { EXAMS, MBBS_YEARS, REGISTERED_ROLES, ROLES, SPECIALTIES, type MedicalProfile, type ProfileRole } from "@/lib/cadus/profile";
import { COUNCILS, STATES } from "@/lib/cadus/onboarding";

const EFFECT: Record<ProfileRole, (exam: string) => string> = {
  student: () => "Answers explain from first principles, link to the basic sciences and follow the structure of university exam answers.",
  aspirant: (exam) => `Answers are exam-focused, point out classic traps and end with “High-yield for ${exam}”. Practice questions are set at ${exam} level.`,
  intern: () => "Answers focus on what to do now on the ward, first-line doses, what to monitor and when to call your senior.",
  resident: () => "Answers go to specialist depth: guideline nuances, strength of evidence and recent changes.",
  doctor: () => "Answers are concise and practice-ready, with doses, availability in India and referral criteria.",
  nurse: () => "Answers focus on nursing assessment, monitoring, safe drug administration and patient education.",
  pharmacist: () => "Answers focus on dosing, interactions, availability in India and counselling points.",
};

export default function ProfileDialog({ profile, onSave, onClose }: {
  profile: MedicalProfile | null;
  onSave: (p: MedicalProfile | null) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState<ProfileRole | null>(profile?.role ?? null);
  const [year, setYear] = useState(profile?.year ?? "");
  const [exam, setExam] = useState(profile?.exam ?? "NEET-PG");
  const [examDate, setExamDate] = useState(profile?.examDate ?? "");
  const [specialty, setSpecialty] = useState(profile?.specialty ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const [registration, setRegistration] = useState(profile?.registration ?? "");
  const [council, setCouncil] = useState(profile?.council ?? "");
  const [declared, setDeclared] = useState(!!profile?.declared);
  const reg = role ? REGISTERED_ROLES.has(role) : false;

  const save = () => {
    if (!role) return;
    const r = reg ? registration.trim().slice(0, 40) : "";
    onSave({
      role,
      year: role === "student" && year ? year : undefined,
      exam: role === "aspirant" ? exam : undefined,
      examDate: role === "aspirant" && /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? examDate : undefined,
      specialty: (role === "resident" || role === "doctor") && specialty ? specialty : undefined,
      state: state || undefined,
      registration: r || undefined,
      council: r && council.trim() ? council.trim().slice(0, 80) : undefined,
      declared: r && declared ? true : undefined,
    });
  };

  return (
    <div className="cx-overlay center" onMouseDown={onClose}>
      <form
        className="cx-dialog cx-prof"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); save(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cx-prof-title"
      >
        <div className="cx-dialog-h">
          <div>
            <h3 id="cx-prof-title">Personalise Cadus</h3>
            <p>Tell Cadus who you are and every answer is pitched at your level. Saved only on this device.</p>
          </div>
          <button type="button" className="cx-ib" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="cx-dialog-b">
          <div className="cx-field">
            <span>I am</span>
            <div className="cx-roles" role="radiogroup" aria-label="Role">
              {ROLES.map((r) => (
                <button key={r.id} type="button" role="radio" aria-checked={role === r.id} className={`cx-role ${role === r.id ? "on" : ""}`} onClick={() => setRole(r.id)}>
                  <b>{r.label}</b>
                  <small>{r.hint}</small>
                </button>
              ))}
            </div>
          </div>
          {role === "student" && (
            <div className="cx-field">
              <span>Year</span>
              <div className="cx-opts">
                {MBBS_YEARS.map((y) => <button key={y} type="button" className={year === y ? "on" : ""} onClick={() => setYear(year === y ? "" : y)}>{y}</button>)}
              </div>
            </div>
          )}
          {role === "aspirant" && (
            <>
              <div className="cx-field">
                <span>Exam</span>
                <div className="cx-opts">
                  {EXAMS.map((x) => <button key={x} type="button" className={exam === x ? "on" : ""} onClick={() => setExam(x)}>{x}</button>)}
                </div>
              </div>
              <label className="cx-field">
                <span>Exam date <span className="opt">(optional)</span></span>
                <input type="date" className="cx-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                <small>Cadus shows a countdown on your dashboard and in Practice.</small>
              </label>
            </>
          )}
          {(role === "resident" || role === "doctor") && (
            <label className="cx-field">
              <span>Specialty <span className="opt">(optional)</span></span>
              <select className="cx-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="">Not specified</option>
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
          {role && (
            <label className="cx-field">
              <span>State or union territory <span className="opt">(optional)</span></span>
              <select className="cx-input" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Not specified</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
          {reg && (
            <div className="cx-field">
              <span>Professional registration <span className="opt">(optional, self-declared)</span></span>
              <div className="cx-ob-two">
                <input className="cx-input" value={registration} maxLength={40} onChange={(e) => setRegistration(e.target.value)} placeholder="Registration number" aria-label="Registration number" />
                <input className="cx-input" list="cx-prof-councils" value={council} maxLength={80} onChange={(e) => setCouncil(e.target.value)} placeholder="Council" aria-label="Council" />
                <datalist id="cx-prof-councils">{COUNCILS.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              {registration.trim() && (
                <button type="button" className={`cx-tg ${declared ? "on" : ""}`} role="checkbox" aria-checked={declared} onClick={() => setDeclared(!declared)}>
                  <span className="cx-tg-box" aria-hidden />
                  <span className="cx-tg-l">These are my registration details and they are correct.<small>Shown on your profile as self-declared. Never sent to the AI.</small></span>
                </button>
              )}
              {registration.trim() && declared && <small className="cx-prof-badge"><ShieldCheck size={13} /> Registered practitioner (self-declared)</small>}
            </div>
          )}
          {role && <p className="cx-prof-prev"><Sparkles size={15} /> {EFFECT[role](exam)}</p>}
        </div>
        <div className="cx-dialog-f">
          {profile && <button type="button" className="cx-btn" onClick={() => onSave(null)}>Clear profile</button>}
          <span className="count" />
          <button type="button" className="cx-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="cx-btn primary" disabled={!role}>Save</button>
        </div>
      </form>
    </div>
  );
}
