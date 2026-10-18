/**
 * The first screen after sign-in: who you are, so Cadus can pitch answers,
 * sign documents and keep the account's profile on the server for the next
 * sign-in on any device. Shown once; Settings edits it afterwards.
 */
import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import CadusMark from "./CadusMark";
import { COUNCILS, STATES } from "@/lib/cadus/onboarding";
import { EXAMS, MBBS_YEARS, REGISTERED_ROLES, ROLES, SPECIALTIES, type MedicalProfile, type ProfileRole } from "@/lib/cadus/profile";
import { LANGUAGES } from "@/lib/cadus/leaflets";

export default function ProfileSetup({ initial, accountName, accountEmail, onDone, saving, serverNote }: {
  initial: MedicalProfile | null;
  accountName: string;
  accountEmail: string;
  onDone: (p: MedicalProfile) => void;
  saving: boolean;
  /** A line about where the profile is kept (server or device). */
  serverNote: string;
}) {
  const [fullName, setFullName] = useState(initial?.fullName || accountName || "");
  const [role, setRole] = useState<ProfileRole>(initial?.role ?? "doctor");
  const [year, setYear] = useState(initial?.year || MBBS_YEARS[0]);
  const [exam, setExam] = useState(initial?.exam || EXAMS[0]);
  const [examDate, setExamDate] = useState(initial?.examDate || "");
  const [specialty, setSpecialty] = useState(initial?.specialty || "");
  const [institution, setInstitution] = useState(initial?.institution || "");
  const [city, setCity] = useState(initial?.city || "");
  const [state, setState] = useState(initial?.state || "");
  const [registration, setRegistration] = useState(initial?.registration || "");
  const [council, setCouncil] = useState(initial?.council || "");
  const [declared, setDeclared] = useState(!!initial?.declared);
  const [phone, setPhone] = useState(initial?.phone || "");
  const [languagePref, setLanguagePref] = useState(initial?.languagePref || "English");
  const [error, setError] = useState("");
  const registered = REGISTERED_ROLES.has(role);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return setError("Please enter your full name as it should appear on documents.");
    if (!institution.trim()) return setError("Please enter your college, hospital or clinic.");
    if (!state) return setError("Please choose your state.");
    if (registration.trim() && !declared) return setError("Please confirm the registration details are yours.");
    if (phone.trim() && !/^\+?[0-9 ]{10,15}$/.test(phone.trim())) return setError("Please enter a valid mobile number, or leave it blank.");
    setError("");
    const p: MedicalProfile = {
      role,
      ...(role === "student" ? { year } : {}),
      ...(role === "aspirant" ? { exam, ...(examDate ? { examDate } : {}) } : {}),
      ...(role === "resident" || role === "doctor" ? { specialty: specialty || undefined } : {}),
      state,
      ...(registered && registration.trim() ? { registration: registration.trim(), council: council.trim() || undefined, declared: true } : {}),
      fullName: fullName.trim(), institution: institution.trim(), city: city.trim() || undefined, phone: phone.trim() || undefined, languagePref,
      completedAt: Date.now(),
    };
    onDone(p);
  };

  return (
    <div className="cx-ps-wrap">
      <form className="cx-ps" onSubmit={submit} aria-labelledby="cx-ps-t" noValidate>
        <div className="cx-ps-head">
          <CadusMark size={30} />
          <div><h1 id="cx-ps-t">Set up your Cadus profile</h1><p>Signed in as {accountEmail || accountName}. This takes a minute, and it is saved to your account so you never fill it in again.</p></div>
        </div>

        <section className="cx-ps-sec">
          <h2>About you</h2>
          <label className="cx-field"><span>Full name, as on documents</span><input className="cx-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr Ananya Rao" maxLength={80} autoComplete="name" required /></label>
          <div className="cx-ps-roles" role="radiogroup" aria-label="Role">
            {ROLES.map((r) => <button type="button" key={r.id} role="radio" aria-checked={role === r.id} className={role === r.id ? "on" : ""} onClick={() => setRole(r.id)}><b>{r.label}</b><small>{r.hint}</small></button>)}
          </div>
          {role === "student" && <label className="cx-field"><span>MBBS year</span><select className="cx-select" value={year} onChange={(e) => setYear(e.target.value)}>{MBBS_YEARS.map((y) => <option key={y}>{y}</option>)}</select></label>}
          {role === "aspirant" && (
            <div className="cx-ps-row">
              <label className="cx-field"><span>Target exam</span><select className="cx-select" value={exam} onChange={(e) => setExam(e.target.value)}>{EXAMS.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="cx-field"><span>Exam date (optional)</span><input className="cx-input" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></label>
            </div>
          )}
          {(role === "resident" || role === "doctor") && <label className="cx-field"><span>Specialty</span><input className="cx-input" list="cx-ps-spec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="General Medicine" maxLength={60} /><datalist id="cx-ps-spec">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist></label>}
        </section>

        <section className="cx-ps-sec">
          <h2>Where you work or study</h2>
          <label className="cx-field"><span>College, hospital or clinic</span><input className="cx-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Victoria Hospital, Bangalore Medical College" maxLength={160} required /></label>
          <div className="cx-ps-row">
            <label className="cx-field"><span>City</span><input className="cx-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bengaluru" maxLength={60} /></label>
            <label className="cx-field"><span>State</span><select className="cx-select" value={state} onChange={(e) => setState(e.target.value)} required><option value="">Choose</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
        </section>

        {registered && (
          <section className="cx-ps-sec">
            <h2>Professional registration <small>optional, never sent to the AI</small></h2>
            <div className="cx-ps-row">
              <label className="cx-field"><span>Registration number</span><input className="cx-input" value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="e.g. 54321" maxLength={40} /></label>
              <label className="cx-field"><span>Council</span><input className="cx-input" list="cx-ps-council" value={council} onChange={(e) => setCouncil(e.target.value)} placeholder="Karnataka Medical Council" maxLength={80} /><datalist id="cx-ps-council">{COUNCILS.map((c) => <option key={c} value={c} />)}</datalist></label>
            </div>
            {registration.trim() && <label className="cx-ps-check"><input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} /> I confirm these registration details are mine and correct. They appear on documents I sign in Cadus.</label>}
          </section>
        )}

        <section className="cx-ps-sec">
          <h2>Contact and language</h2>
          <div className="cx-ps-row">
            <label className="cx-field"><span>Mobile (optional)</span><input className="cx-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" maxLength={20} autoComplete="tel" /></label>
            <label className="cx-field"><span>Patient material language</span><select className="cx-select" value={languagePref} onChange={(e) => setLanguagePref(e.target.value)}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
          </div>
        </section>

        {error && <p className="cx-si-err" role="alert">{error}</p>}
        <div className="cx-ps-foot">
          <button className="cx-btn primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save and open Cadus"} <ArrowRight size={15} /></button>
          <p><ShieldCheck size={13} /> {serverNote} Patient data never goes with it. You can change all of this later in Settings.</p>
        </div>
      </form>
    </div>
  );
}

export const PROFILE_SETUP_CSS = `
.cx-ps-wrap{position:fixed;inset:0;overflow:auto;display:flex;justify-content:center;padding:40px 20px;background:var(--bg);color:var(--text)}
.cx-ps{width:100%;max-width:640px;display:flex;flex-direction:column;gap:22px;align-self:flex-start}
.cx-ps-head{display:flex;gap:14px;align-items:flex-start}
.cx .cx-ps-head h1{font-size:26px;font-weight:600;letter-spacing:-.02em;line-height:1.2}
.cx-ps-head p{margin-top:6px;font-size:14px;line-height:1.55;color:var(--t2)}
.cx-ps-sec{display:flex;flex-direction:column;gap:12px;padding:18px 20px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx .cx-ps-sec h2{font-size:15px;font-weight:600;display:flex;align-items:baseline;gap:8px}
.cx-ps-sec h2 small{font-size:12px;font-weight:500;color:var(--t3)}
.cx-ps-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cx-ps-roles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.cx-ps-roles button{display:flex;flex-direction:column;gap:2px;padding:9px 11px;border:1px solid var(--line);border-radius:var(--r,8px);background:var(--surface);text-align:left}
.cx-ps-roles button b{font-size:13.5px;font-weight:600;color:var(--text)}
.cx-ps-roles button small{font-size:11.5px;color:var(--t3);line-height:1.35}
.cx-ps-roles button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 7%,var(--surface))}
.cx-ps-check{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--t2)}
.cx-ps-check input{margin-top:3px}
.cx-ps-foot{display:flex;flex-direction:column;gap:10px}
.cx-ps-foot .cx-btn{height:44px;justify-content:center;font-size:15px}
.cx-ps-foot p{display:flex;gap:6px;align-items:flex-start;font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-ps-foot p svg{flex-shrink:0;margin-top:2px}
.cx[data-look="editorial"] .cx-ps-head h1{font-family:var(--display);font-weight:500;font-size:30px}
@media (max-width:600px){.cx-ps-row{grid-template-columns:1fr}.cx-ps-wrap{padding:20px 14px}}
`;
