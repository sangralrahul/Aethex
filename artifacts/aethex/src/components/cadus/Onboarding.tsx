/**
 * First-run setup: what Cadus is (and isn't), who you are, your specialty,
 * state and registration, and your units, formulary and language. Everything
 * can be changed later in Settings; it is kept on this device.
 */
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, LockKeyhole, ShieldCheck, X } from "lucide-react";
import CadusMark from "./CadusMark";
import { EXAMS, MBBS_YEARS, REGISTERED_ROLES, ROLES, SPECIALTIES, type MedicalProfile, type ProfileRole } from "@/lib/cadus/profile";
import { COUNCILS, STATES, type Units } from "@/lib/cadus/onboarding";

export interface OnboardingResult {
  profile: MedicalProfile | null;
  units: Units;
  nlem: boolean;
  language: string;
  tour: boolean;
}

const STEPS = ["Welcome", "Your role", "About you", "Preferences", "Ready"];

export default function Onboarding({ languages, language: initialLanguage, profile: initial, units: initialUnits = "conventional", nlem: initialNlem = true, onDone, onCancel }: {
  languages: string[];
  language: string;
  /** When setup is run again: the current profile and preferences to start from. */
  profile?: MedicalProfile | null;
  units?: Units;
  nlem?: boolean;
  onDone: (r: OnboardingResult) => void;
  /** Only when setup is run again: close without changing anything. */
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [ack, setAck] = useState(!!initial);
  const [role, setRole] = useState<ProfileRole | null>(initial?.role ?? null);
  const [year, setYear] = useState(initial?.year ?? "");
  const [exam, setExam] = useState(initial?.exam ?? "NEET-PG");
  const [examDate, setExamDate] = useState(initial?.examDate ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [registration, setRegistration] = useState(initial?.registration ?? "");
  const [council, setCouncil] = useState(initial?.council ?? "");
  const [declared, setDeclared] = useState(!!initial?.declared);
  const [units, setUnits] = useState<Units>(initialUnits);
  const [nlem, setNlem] = useState(initialNlem);
  const [language, setLanguage] = useState(initialLanguage || "English");

  const profile = (): MedicalProfile | null => role ? {
    role,
    year: role === "student" && year ? year : undefined,
    exam: role === "aspirant" ? exam : undefined,
    examDate: role === "aspirant" && /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? examDate : undefined,
    specialty: (role === "resident" || role === "doctor") && specialty ? specialty : undefined,
    state: state || undefined,
    registration: REGISTERED_ROLES.has(role) && registration.trim() ? registration.trim().slice(0, 40) : undefined,
    council: REGISTERED_ROLES.has(role) && registration.trim() && council.trim() ? council.trim().slice(0, 80) : undefined,
    declared: REGISTERED_ROLES.has(role) && registration.trim() && declared ? true : undefined,
  } : null;
  const finish = (tour: boolean) => onDone({ profile: profile(), units, nlem, language, tour });
  // Keyboard and screen-reader users start inside the dialog, at each step's heading.
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.querySelector<HTMLElement>("#cx-ob-title")?.focus();
  }, [step]);
  /** Tab stays inside the dialog. */
  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !boxRef.current) return;
    const els = Array.from(boxRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input, select, textarea")).filter((el) => el.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !boxRef.current.contains(at) || at?.id === "cx-ob-title")) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === last || !boxRef.current.contains(at))) { e.preventDefault(); first.focus(); }
  };
  useEffect(() => {
    if (!onCancel) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onCancel]);
  const canNext = step === 0 ? ack : step === 1 ? !!role : true;
  const regRole = role && REGISTERED_ROLES.has(role);

  return (
    <div className="cx-overlay center cx-ob-wrap">
      <div className="cx-dialog cx-ob" role="dialog" aria-modal="true" aria-labelledby="cx-ob-title" ref={boxRef} onKeyDown={trapTab}>
        <div className="cx-ob-top">
          <div className="cx-ob-prog" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => <span key={s} className={i < step ? "done" : i === step ? "on" : ""} title={s} />)}
          </div>
          {onCancel && <button type="button" className="cx-ib" onClick={onCancel} aria-label="Close setup"><X size={17} /></button>}
        </div>

        {step === 0 && (
          <div className="cx-ob-b">
            <CadusMark size={44} />
            <h2 id="cx-ob-title" tabIndex={-1}>Welcome to Cadus</h2>
            <p className="cx-ob-lead">Clinical AI for doctors, nurses, pharmacists and medical students in India.</p>
            <ul className="cx-ob-why">
              <li><ShieldCheck size={18} /><span><b>Checked twice.</b> A second model reviews every clinical answer for doses, interactions and red flags before you see it.</span></li>
              <li><BookOpenText size={18} /><span><b>Sourced.</b> Guidelines and PubMed papers with their PMIDs, with labels for how strong the evidence is.</span></li>
              <li><LockKeyhole size={18} /><span><b>Private.</b> Chats and patient lists stay on this device, and identifiers are hidden before anything is sent.</span></li>
            </ul>
            <button type="button" className={`cx-tg cx-ob-ack ${ack ? "on" : ""}`} role="checkbox" aria-checked={ack} onClick={() => setAck(!ack)}>
              <span className="cx-tg-box" aria-hidden />
              <span className="cx-tg-l">I understand Cadus is decision support for qualified professionals and students. It can make mistakes, so I will check clinical decisions before acting on them.</span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="cx-ob-b">
            <h2 id="cx-ob-title" tabIndex={-1}>What best describes you?</h2>
            <p className="cx-ob-lead">Cadus pitches every answer at your level and puts the tools you use most on the home page.</p>
            <div className="cx-roles" role="radiogroup" aria-label="Role">
              {ROLES.map((r) => (
                <button key={r.id} type="button" role="radio" aria-checked={role === r.id} className={`cx-role ${role === r.id ? "on" : ""}`} onClick={() => setRole(r.id)}>
                  <b>{r.label}</b>
                  <small>{r.hint}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="cx-ob-b">
            <h2 id="cx-ob-title" tabIndex={-1}>About you</h2>
            <p className="cx-ob-lead">All optional. Your registration is never sent to the AI; it shows on your profile as self-declared.</p>
            <div className="cx-ob-form">
              {role === "student" && (
                <div className="cx-field">
                  <span>Year</span>
                  <div className="cx-opts">{MBBS_YEARS.map((y) => <button key={y} type="button" className={year === y ? "on" : ""} onClick={() => setYear(year === y ? "" : y)}>{y}</button>)}</div>
                </div>
              )}
              {role === "aspirant" && (
                <>
                  <div className="cx-field">
                    <span>Exam</span>
                    <div className="cx-opts">{EXAMS.map((x) => <button key={x} type="button" className={exam === x ? "on" : ""} onClick={() => setExam(x)}>{x}</button>)}</div>
                  </div>
                  <label className="cx-field">
                    <span>Exam date</span>
                    <input type="date" className="cx-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                  </label>
                </>
              )}
              {(role === "resident" || role === "doctor") && (
                <label className="cx-field">
                  <span>Specialty</span>
                  <select className="cx-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                    <option value="">Not specified</option>
                    {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
              )}
              <label className="cx-field">
                <span>State or union territory</span>
                <select className="cx-input" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Not specified</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <small>For your state's programmes and common practice where they matter.</small>
              </label>
              {regRole && (
                <>
                  <div className="cx-ob-two">
                    <label className="cx-field">
                      <span>Registration number</span>
                      <input className="cx-input" value={registration} maxLength={40} onChange={(e) => setRegistration(e.target.value)} placeholder="e.g. 54321" />
                    </label>
                    <label className="cx-field">
                      <span>Council</span>
                      <input className="cx-input" list="cx-councils" value={council} maxLength={80} onChange={(e) => setCouncil(e.target.value)} placeholder="e.g. Karnataka Medical Council" />
                      <datalist id="cx-councils">{COUNCILS.map((c) => <option key={c} value={c} />)}</datalist>
                    </label>
                  </div>
                  {registration.trim() && (
                    <button type="button" className={`cx-tg ${declared ? "on" : ""}`} role="checkbox" aria-checked={declared} onClick={() => setDeclared(!declared)}>
                      <span className="cx-tg-box" aria-hidden />
                      <span className="cx-tg-l">These are my registration details and they are correct.<small>Shown as “self-declared”: Cadus can't verify registrations.</small></span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="cx-ob-b">
            <h2 id="cx-ob-title" tabIndex={-1}>How you practise</h2>
            <p className="cx-ob-lead">Cadus follows these in every answer. You can change them in Settings.</p>
            <div className="cx-ob-form">
              <div className="cx-field">
                <span>Units</span>
                <div className="cx-seg cx-ob-seg">
                  <button type="button" className={units === "conventional" ? "on" : ""} onClick={() => setUnits("conventional")}>Conventional (mg/dL)</button>
                  <button type="button" className={units === "si" ? "on" : ""} onClick={() => setUnits("si")}>SI (mmol/L)</button>
                </div>
                <small>Indian laboratories mostly report conventional units; the other is given in brackets where it helps.</small>
              </div>
              <button type="button" className={`cx-tg ${nlem ? "on" : ""}`} role="checkbox" aria-checked={nlem} onClick={() => setNlem(!nlem)}>
                <span className="cx-tg-box" aria-hidden />
                <span className="cx-tg-l">Prefer essential medicines and generic names<small>Medicines on India's National List of Essential Medicines (NLEM 2022) first, noting any that aren't on it.</small></span>
              </button>
              <label className="cx-field">
                <span>Reply language</span>
                <select className="cx-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {languages.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="cx-ob-b">
            <span className="cx-ob-done"><Check size={22} strokeWidth={2.6} /></span>
            <h2 id="cx-ob-title" tabIndex={-1}>You're set</h2>
            <p className="cx-ob-lead">
              {role ? `${ROLES.find((r) => r.id === role)?.label}${specialty ? ` · ${specialty}` : ""}${state ? ` · ${state}` : ""}. ` : ""}
              Answers use {units === "si" ? "SI" : "conventional"} units{nlem ? " and prefer NLEM medicines" : ""}, in {language}.
            </p>
            <p className="cx-ob-small">Take a 30-second tour of where things are, or start straight away.</p>
          </div>
        )}

        <div className="cx-ob-f">
          {step > 0 && step < 4 && <button type="button" className="cx-btn" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>}
          {step > 0 && step < 4 && <button type="button" className="cx-ob-skip" onClick={() => setStep(4)}>Skip for now</button>}
          <span className="cx-ob-sp" />
          {step < 4 ? (
            <button type="button" className="cx-btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 0 ? "Get started" : "Continue"} <ArrowRight size={15} /></button>
          ) : (
            <>
              <button type="button" className="cx-btn" onClick={() => finish(false)}>Start using Cadus</button>
              <button type="button" className="cx-btn primary" onClick={() => finish(true)}>Take the tour <ArrowRight size={15} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
