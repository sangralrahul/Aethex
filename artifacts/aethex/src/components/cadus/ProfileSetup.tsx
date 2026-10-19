/**
 * The first screen after sign-in: who you are, so Cadus can pitch answers,
 * sign documents and keep the account's profile on the server for the next
 * sign-in on any device.
 *
 * A short guided setup, one question per page. Only the name is typed; every
 * other answer is a tap (role, year or exam, specialty, state, city, where you
 * work, language). Single-choice pages move on by themselves. Opened again
 * from Settings, it starts on the summary, where any answer can be changed.
 * Registration, council and phone are kept as they are (Settings › Letterhead
 * and Profile edit them).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, Baby, Bone, Brain, Building2, CalendarDays, Check, ClipboardList, Ear, Eye, GraduationCap,
  HeartPulse, Home, Hospital, Landmark, Languages, MapPin, Microscope, Pencil, Pill, Scan, School, ShieldCheck,
  Sparkles, Stethoscope, Store, Syringe, Target, UserRound, Users, type LucideProps,
} from "lucide-react";
import CadusMark from "./CadusMark";
import { STATES } from "@/lib/cadus/onboarding";
import { EXAMS, MBBS_YEARS, ROLES, SPECIALTIES, type MedicalProfile, type ProfileRole } from "@/lib/cadus/profile";
import { LANGUAGES } from "@/lib/cadus/leaflets";
import { CITIES, SETTINGS, examMonths } from "@/lib/cadus/places";

type Icon = ComponentType<LucideProps>;
type Step = "name" | "role" | "details" | "state" | "city" | "setting" | "language" | "review";

const ROLE_ICON: Record<ProfileRole, Icon> = {
  student: GraduationCap, aspirant: Target, intern: ClipboardList, resident: Stethoscope,
  doctor: UserRound, nurse: HeartPulse, pharmacist: Pill,
};
const SETTING_ICON: Record<string, Icon> = {
  gmc: Landmark, pmc: School, gh: Building2, ph: Hospital, clinic: Home, phc: Users, pharmacy: Store, prep: Target,
};
const SPECIALTY_ICON: Record<string, Icon> = {
  Paediatrics: Baby, Orthopaedics: Bone, Neurology: Brain, Psychiatry: Brain, Ophthalmology: Eye, ENT: Ear,
  Radiology: Scan, Pathology: Microscope, Cardiology: HeartPulse, Anaesthesiology: Syringe, "Critical Care": HeartPulse,
};

export default function ProfileSetup({ initial, accountName, accountEmail, onDone, saving, serverNote }: {
  initial: MedicalProfile | null;
  accountName: string;
  accountEmail: string;
  onDone: (p: MedicalProfile) => void;
  saving: boolean;
  /** A line about where the profile is kept (server or device). */
  serverNote: string;
}) {
  const editing = !!initial?.completedAt;
  const [fullName, setFullName] = useState(initial?.fullName || accountName || "");
  const [role, setRole] = useState<ProfileRole | "">(initial?.role ?? "");
  const [year, setYear] = useState(initial?.year || "");
  const [exam, setExam] = useState(initial?.exam || "");
  const [examDate, setExamDate] = useState(initial?.examDate || "");
  const [specialty, setSpecialty] = useState(initial?.specialty || "");
  const [state, setState] = useState(initial?.state || "");
  const [city, setCity] = useState(initial?.city || "");
  const initialSetting = SETTINGS.find((s) => s.label === initial?.institution)?.id ?? "";
  const [setting, setSetting] = useState(initialSetting);
  const [languagePref, setLanguagePref] = useState(initial?.languagePref || "English");
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>(editing ? "review" : "name");
  const [returnTo, setReturnTo] = useState<Step | null>(null);
  const [dir, setDir] = useState<"f" | "b">("f");
  const nameRef = useRef<HTMLInputElement>(null);
  const months = useMemo(() => examMonths(), []);

  /** Someone who already wrote an institution keeps it until they pick a setting. */
  const institution = setting ? SETTINGS.find((s) => s.id === setting)!.label : initial?.institution || "";
  const hasDetails = role === "" || role === "student" || role === "aspirant" || role === "resident" || role === "doctor";
  const steps = useMemo<Step[]>(() => ["name", "role", ...(hasDetails ? ["details" as Step] : []), "state", "city", "setting", "language", "review"], [hasDetails]);
  const at = steps.indexOf(step);
  const settings = SETTINGS.filter((s) => !s.for || (role && s.for.includes(role)));
  const cities = CITIES[state] ?? [];

  useEffect(() => { if (step === "name") nameRef.current?.focus(); }, [step]);

  const go = (to: Step, d: "f" | "b" = "f") => { setError(""); setDir(d); setStep(to); };
  const hasDetailsFor = (r: ProfileRole | "") => r === "student" || r === "aspirant" || r === "resident" || r === "doctor";
  const detailsDone = () => (role === "student" ? !!year : role === "aspirant" ? !!exam : true);
  /** Forward: the next page, or back to the summary when changing one answer (after its follow-up page). */
  const next = (from: Step = step) => {
    if (returnTo) {
      if (from === "role" && hasDetailsFor(role)) return go("details");
      if (from === "state") return go("city");
      const r = returnTo; setReturnTo(null); return go(r);
    }
    go(steps[Math.min(steps.indexOf(from) + 1, steps.length - 1)]);
  };
  const back = () => { setReturnTo(null); go(steps[Math.max(at - 1, 0)], "b"); };

  /** Single-choice pages move on by themselves, a beat after the tick shows (with the new answer in place). */
  const [advance, setAdvance] = useState<Step | null>(null);
  useEffect(() => {
    if (!advance) return;
    const t = window.setTimeout(() => { setAdvance(null); next(advance); }, 230);
    return () => window.clearTimeout(t);
  }, [advance]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (apply: () => void, from: Step) => { apply(); setAdvance(from); };
  const [cityNone, setCityNone] = useState(!!initial?.completedAt && !initial?.city);

  const canContinue = step === "name" ? fullName.trim().length >= 2
    : step === "role" ? !!role
    : step === "details" ? detailsDone()
    : step === "state" ? !!state
    : step === "setting" ? !!institution
    : true;

  const save = () => {
    if (fullName.trim().length < 2) { go("name", "b"); return setError("Please enter your full name as it should appear on documents."); }
    if (!role) { go("role", "b"); return setError("Please choose what describes you best."); }
    if (!state) { go("state", "b"); return setError("Please choose your state."); }
    if (!institution) { go("setting", "b"); return setError("Please choose where you work or study."); }
    const p: MedicalProfile = {
      role,
      ...(role === "student" ? { year: year || MBBS_YEARS[0] } : {}),
      ...(role === "aspirant" ? { exam: exam || EXAMS[0], ...(examDate ? { examDate } : {}) } : {}),
      ...(role === "resident" || role === "doctor" ? { specialty: specialty || undefined } : {}),
      state,
      // kept from before: edited in Settings
      ...(initial?.registration ? { registration: initial.registration, council: initial.council, declared: initial.declared } : {}),
      ...(initial?.phone ? { phone: initial.phone } : {}),
      fullName: fullName.trim(), institution, city: city || undefined, languagePref,
      completedAt: Date.now(),
    };
    onDone(p);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "review") return save();
    if (canContinue) next();
  };

  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? "";
  const detailLabel = role === "student" ? year : role === "aspirant" ? [exam, examDate ? months.find((m) => m.value === examDate)?.label ?? examDate.slice(0, 7) : "date not decided"].filter(Boolean).join(" · ") : role === "resident" || role === "doctor" ? specialty || "No specialty chosen" : "";
  const first = fullName.trim().split(/\s+/).find((w) => !/^dr\.?$/i.test(w)) || "";

  const Option = ({ on, onClick, icon: I, label, hint, small }: { on: boolean; onClick: () => void; icon?: Icon; label: string; hint?: string; small?: boolean }) => (
    <button type="button" role="radio" aria-checked={on} className={`cx-ps-opt ${on ? "on" : ""} ${small ? "sm" : ""}`} onClick={onClick}>
      {I && <span className="ic"><I size={small ? 15 : 19} /></span>}
      <span className="tx"><b>{label}</b>{hint && <small>{hint}</small>}</span>
      <span className="tick" aria-hidden="true"><Check size={13} /></span>
    </button>
  );

  return (
    <div className="cx-ps-wrap">
      <form className="cx-ps" onSubmit={submit} aria-labelledby="cx-ps-t" noValidate>
        <div className="cx-ps-head">
          <CadusMark size={28} />
          <div>
            <p className="cx-ps-kicker">{editing && step === "review" ? "Your Cadus profile" : `Step ${at + 1} of ${steps.length}`}</p>
            <p className="cx-ps-who">Signed in as {accountEmail || accountName}</p>
          </div>
        </div>
        <div className="cx-ps-bar" aria-hidden="true">{steps.map((s, k) => <i key={s} className={k < at ? "done" : k === at ? "now" : ""} />)}</div>

        <div className={`cx-ps-page ${dir}`} key={step}>
          {step === "name" && (
            <>
              <h1 id="cx-ps-t">Welcome to Cadus. What's your name?</h1>
              <p className="cx-ps-sub">As it should appear on prescriptions, letters and certificates you make in Cadus.</p>
              <input ref={nameRef} className="cx-input cx-ps-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr Ananya Rao" maxLength={80} autoComplete="name" aria-label="Full name" />
              <p className="cx-ps-tip"><Sparkles size={13} /> This is the only thing you type. Everything else is a tap.</p>
            </>
          )}

          {step === "role" && (
            <>
              <h1 id="cx-ps-t">{first ? `Nice to meet you, ${first}.` : "Nice to meet you."} What describes you best?</h1>
              <p className="cx-ps-sub">Cadus pitches every answer at your level.</p>
              <div className="cx-ps-grid two cx-ps-roles" role="radiogroup" aria-label="Role">
                {ROLES.map((r) => <Option key={r.id} on={role === r.id} icon={ROLE_ICON[r.id]} label={r.label} hint={r.hint} onClick={() => pick(() => setRole(r.id), "role")} />)}
              </div>
            </>
          )}

          {step === "details" && role === "student" && (
            <>
              <h1 id="cx-ps-t">Which year of MBBS are you in?</h1>
              <p className="cx-ps-sub">For explanations at the depth your university exams expect.</p>
              <div className="cx-ps-grid two" role="radiogroup" aria-label="MBBS year">
                {MBBS_YEARS.map((y) => <Option key={y} on={year === y} icon={GraduationCap} label={y} onClick={() => pick(() => setYear(y), "details")} />)}
              </div>
            </>
          )}
          {step === "details" && role === "aspirant" && (
            <>
              <h1 id="cx-ps-t">Which exam are you preparing for?</h1>
              <p className="cx-ps-sub">Practice questions and revision follow this exam.</p>
              <div className="cx-ps-chips" role="radiogroup" aria-label="Target exam">
                {EXAMS.map((x) => <Option key={x} small on={exam === x} label={x} onClick={() => setExam(x)} />)}
              </div>
              <h2 className="cx-ps-h2"><CalendarDays size={15} /> When is it?</h2>
              <div className="cx-ps-chips" role="radiogroup" aria-label="Exam month">
                <Option small on={!examDate} label="Not decided yet" onClick={() => setExamDate("")} />
                {months.map((m) => <Option key={m.value} small on={examDate === m.value} label={m.label} onClick={() => setExamDate(m.value)} />)}
              </div>
            </>
          )}
          {step === "details" && (role === "resident" || role === "doctor") && (
            <>
              <h1 id="cx-ps-t">What's your specialty?</h1>
              <p className="cx-ps-sub">Answers go into specialist depth where it helps.</p>
              <div className="cx-ps-grid three" role="radiogroup" aria-label="Specialty">
                {SPECIALTIES.map((s) => <Option key={s} small on={specialty === s} icon={SPECIALTY_ICON[s] ?? Stethoscope} label={s} onClick={() => pick(() => setSpecialty(s), "details")} />)}
                <Option small on={specialty === ""} icon={Users} label="Other or none" onClick={() => pick(() => setSpecialty(""), "details")} />
              </div>
            </>
          )}

          {step === "state" && (
            <>
              <h1 id="cx-ps-t">Where do you work or study?</h1>
              <p className="cx-ps-sub">For your state's programmes, schemes and local guidance.</p>
              <div className="cx-ps-grid three cx-ps-states" role="radiogroup" aria-label="State">
                {STATES.map((s) => <Option key={s} small on={state === s} icon={MapPin} label={s} onClick={() => pick(() => { if (s !== state) { setCity(""); setCityNone(false); } setState(s); }, "state")} />)}
              </div>
            </>
          )}

          {step === "city" && (
            <>
              <h1 id="cx-ps-t">Which city in {state}?</h1>
              <p className="cx-ps-sub">Shown on your documents with your workplace. Not listed? Choose the nearest, or skip.</p>
              <div className="cx-ps-grid three" role="radiogroup" aria-label="City">
                {cities.map((c) => <Option key={c} small on={city === c} icon={MapPin} label={c} onClick={() => pick(() => { setCity(c); setCityNone(false); }, "city")} />)}
                <Option small on={!city && cityNone} icon={MapPin} label="Somewhere else" onClick={() => pick(() => { setCity(""); setCityNone(true); }, "city")} />
              </div>
            </>
          )}

          {step === "setting" && (
            <>
              <h1 id="cx-ps-t">Where do you work or study?</h1>
              <p className="cx-ps-sub">You can add the name of your college or hospital later in Settings.</p>
              <div className="cx-ps-grid two" role="radiogroup" aria-label="Where you work">
                {settings.map((s) => <Option key={s.id} on={setting === s.id} icon={SETTING_ICON[s.id]} label={s.label} hint={s.hint} onClick={() => pick(() => setSetting(s.id), "setting")} />)}
              </div>
            </>
          )}

          {step === "language" && (
            <>
              <h1 id="cx-ps-t">Which language do your patients read?</h1>
              <p className="cx-ps-sub">Patient leaflets and instructions are written in this language. Cadus itself stays in English.</p>
              <div className="cx-ps-grid three" role="radiogroup" aria-label="Patient material language">
                {LANGUAGES.map((l) => <Option key={l} small on={languagePref === l} icon={Languages} label={l} onClick={() => pick(() => setLanguagePref(l), "language")} />)}
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <h1 id="cx-ps-t">{editing ? "Your profile" : "All set. Does this look right?"}</h1>
              <p className="cx-ps-sub">{editing ? "Change any answer, then save." : "Change anything with a tap, then open Cadus."}</p>
              <dl className="cx-ps-review">
                {([
                  ["name", "Name", fullName.trim()],
                  ["role", "You are", roleLabel],
                  ...(hasDetails ? [["details", role === "student" ? "MBBS year" : role === "aspirant" ? "Exam" : "Specialty", detailLabel]] : []),
                  ["state", "State", state],
                  ["city", "City", city || "Not chosen"],
                  ["setting", "Where you work", institution],
                  ["language", "Patient language", languagePref],
                ] as [Step, string, string][]).map(([s, k, v]) => (
                  <div key={s}>
                    <dt>{k}</dt>
                    <dd>{v || <em>Not chosen</em>}</dd>
                    <button type="button" className="cx-ps-change" onClick={() => { setReturnTo("review"); go(s, "b"); }} aria-label={`Change ${k.toLowerCase()}`}><Pencil size={13} /> Change</button>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>

        {error && <p className="cx-si-err" role="alert">{error}</p>}
        <div className="cx-ps-foot">
          <div className="cx-ps-nav">
            {at > 0 && step !== "review" ? <button type="button" className="cx-btn ghost" onClick={back}><ArrowLeft size={15} /> Back</button> : <span />}
            {step === "review"
              ? <button className="cx-btn primary" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Save and open Cadus"} <ArrowRight size={15} /></button>
              : <button className="cx-btn primary" type="submit" disabled={!canContinue}>{step === "city" && !city ? "Skip" : "Continue"} <ArrowRight size={15} /></button>}
          </div>
          <p><ShieldCheck size={13} /> {serverNote} Patient data never goes with it. You can change all of this later in Settings.</p>
        </div>
      </form>
    </div>
  );
}

export const PROFILE_SETUP_CSS = `
.cx-ps-wrap{--ps-acc:var(--primary);--ps-on:var(--primary-ink);position:fixed;inset:0;overflow:auto;display:flex;justify-content:center;padding:48px 20px;background:var(--bg);color:var(--text)}
.cx-ps{width:100%;max-width:720px;display:flex;flex-direction:column;gap:18px;align-self:flex-start;min-height:min(720px,calc(100vh - 96px))}
.cx-ps-head{display:flex;gap:12px;align-items:center}
.cx-ps-kicker{font-size:12px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--ps-acc)}
.cx-ps-who{font-size:13px;color:var(--t3);margin-top:1px}
.cx-ps-bar{display:flex;gap:6px}
.cx-ps-bar i{flex:1;height:4px;border-radius:999px;background:var(--line);transition:background .35s}
.cx-ps-bar i.done{background:var(--ps-acc)}
.cx-ps-bar i.now{position:relative;overflow:hidden}
.cx-ps-bar i.now::after{content:"";position:absolute;inset:0;width:50%;border-radius:inherit;background:var(--ps-acc);animation:cxPsFill .5s ease}
@keyframes cxPsFill{from{width:0}}
.cx-ps-page{display:flex;flex-direction:column;gap:14px;margin-top:14px;animation:cxPsIn .35s cubic-bezier(.2,.7,.2,1)}
.cx-ps-page.b{animation-name:cxPsBack}
@keyframes cxPsIn{from{opacity:0;transform:translateX(18px)}}
@keyframes cxPsBack{from{opacity:0;transform:translateX(-18px)}}
.cx .cx-ps-page h1{font-size:30px;font-weight:650;letter-spacing:-.025em;line-height:1.18}
.cx[data-look="editorial"] .cx-ps-page h1{font-family:var(--display);font-weight:500;font-size:34px}
.cx-ps-sub{font-size:15px;line-height:1.55;color:var(--t2);margin-top:-4px}
.cx .cx-ps-h2{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:15px;font-weight:600}
.cx-ps-name.cx-input{height:58px;font-size:20px;padding:0 18px;margin-top:8px;border-radius:12px}
.cx-ps-tip{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--t3)}
.cx-ps-tip svg{color:var(--ps-acc)}
.cx-ps-grid{display:grid;gap:10px;margin-top:6px}
.cx-ps-grid.two{grid-template-columns:repeat(2,1fr)}
.cx-ps-grid.three{grid-template-columns:repeat(3,1fr)}
.cx-ps-states{max-height:min(460px,52vh);overflow:auto;padding:2px;margin:4px -2px 0}
.cx-ps-chips{display:flex;flex-wrap:wrap;gap:8px}
.cx-ps-opt{position:relative;display:flex;align-items:center;gap:12px;min-height:64px;padding:12px 40px 12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);text-align:left;cursor:pointer;transition:border-color .15s,background .15s,transform .15s,box-shadow .2s}
.cx-ps-opt:hover{border-color:var(--line2,var(--t3));transform:translateY(-1px);box-shadow:0 6px 18px -12px rgba(16,24,40,.35)}
.cx-ps-opt .ic{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border-radius:10px;background:var(--s2);color:var(--t2);transition:background .15s,color .15s}
.cx-ps-opt .tx{display:flex;flex-direction:column;gap:2px;min-width:0}
.cx-ps-opt b{font-size:15px;font-weight:600;line-height:1.3}
.cx-ps-opt small{font-size:12.5px;line-height:1.35;color:var(--t3)}
.cx-ps-opt .tick{position:absolute;right:12px;top:50%;translate:0 -50%;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--line2,var(--line));color:transparent;transition:all .15s}
.cx-ps-opt.on{border-color:var(--ps-acc);background:color-mix(in srgb,var(--ps-acc) 7%,var(--surface));box-shadow:0 0 0 3px color-mix(in srgb,var(--ps-acc) 14%,transparent)}
.cx-ps-opt.on .ic{background:var(--ps-acc);color:var(--ps-on)}
.cx-ps-opt.on .tick{background:var(--ps-acc);border-color:var(--ps-acc);color:var(--ps-on);animation:cxPsTick .25s ease}
@keyframes cxPsTick{from{transform:scale(.4)}}
.cx-ps-opt.sm{min-height:48px;padding:9px 36px 9px 11px;gap:9px}
.cx-ps-opt.sm .ic{width:28px;height:28px;border-radius:8px}
.cx-ps-opt.sm b{font-size:13.5px;font-weight:550}
.cx-ps-chips .cx-ps-opt.sm{min-height:40px;padding:8px 34px 8px 14px;border-radius:999px}
.cx-ps-chips .cx-ps-opt .tick{right:9px;width:18px;height:18px}
.cx-ps-review{display:flex;flex-direction:column;margin:6px 0 0;border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}
.cx-ps-review>div{display:grid;grid-template-columns:160px 1fr auto;align-items:center;gap:12px;padding:14px 18px;border-top:1px solid var(--line)}
.cx-ps-review>div:first-child{border-top:0}
.cx-ps-review dt{font-size:13px;color:var(--t3)}
.cx-ps-review dd{margin:0;font-size:15px;font-weight:550;color:var(--text);min-width:0;overflow-wrap:anywhere}
.cx-ps-review dd em{font-style:normal;color:var(--t3);font-weight:400}
.cx-ps-change{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border:0;border-radius:8px;background:none;color:var(--ps-acc);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.cx-ps-change:hover{background:var(--s2)}
.cx-ps-foot{display:flex;flex-direction:column;gap:12px;margin-top:auto;padding-top:18px}
.cx-ps-nav{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cx-ps-nav .cx-btn{height:46px;padding:0 20px;font-size:15px;justify-content:center}
.cx-ps-nav .cx-btn.primary{min-width:180px}
.cx-ps-nav .cx-btn:disabled{opacity:.45;cursor:default}
.cx-ps-foot p{display:flex;gap:6px;align-items:flex-start;font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-ps-foot p svg{flex-shrink:0;margin-top:2px}
@media (max-width:640px){
  .cx-ps-wrap{padding:22px 14px}
  .cx-ps{min-height:calc(100vh - 44px)}
  .cx .cx-ps-page h1,.cx[data-look="editorial"] .cx-ps-page h1{font-size:24px}
  .cx-ps-grid.two{grid-template-columns:1fr}
  .cx-ps-grid.three{grid-template-columns:1fr 1fr}
  .cx-ps-review>div{grid-template-columns:1fr auto;gap:2px 10px}
  .cx-ps-review dt{grid-column:1}
  .cx-ps-review dd{grid-column:1}
  .cx-ps-review .cx-ps-change{grid-column:2;grid-row:1 / span 2}
  .cx-ps-nav .cx-btn.primary{min-width:0;flex:1}
}
@media (prefers-reduced-motion:reduce){.cx-ps-page,.cx-ps-bar i.now::after,.cx-ps-opt.on .tick{animation:none}}
`;
