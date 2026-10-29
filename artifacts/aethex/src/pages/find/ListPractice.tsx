/** /list-your-practice: a doctor creates or edits their Aethex Doctors profile. It goes live after an admin check. */
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CheckCircle2, Clock, GraduationCap, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { DAY_NAMES, SPECIALTIES, findApi, signInHere, useMyProfile, type FindError, type Hours, type OwnDoctor } from "@/lib/find";
import { FindNav, SignInCard } from "./FindParts";

const COUNCILS = ["National Medical Commission", "Andhra Pradesh Medical Council", "Assam Medical Council", "Bihar Medical Council", "Chhattisgarh Medical Council", "Delhi Medical Council", "Goa Medical Council", "Gujarat Medical Council", "Haryana Medical Council", "Himachal Pradesh Medical Council", "Jammu & Kashmir Medical Council", "Jharkhand Medical Council", "Karnataka Medical Council", "Travancore Cochin Medical Council (Kerala)", "Madhya Pradesh Medical Council", "Maharashtra Medical Council", "Odisha Council of Medical Registration", "Punjab Medical Council", "Rajasthan Medical Council", "Tamil Nadu Medical Council", "Telangana State Medical Council", "Uttar Pradesh Medical Council", "Uttarakhand Medical Council", "West Bengal Medical Council", "Dental Council of India / State Dental Council", "Other"];

type Form = {
  name: string; gender: string; specialty: string; qualifications: string; regNo: string; regCouncil: string; experience: string;
  clinic: string; address: string; locality: string; city: string; pincode: string; fee: string; video: boolean; videoFee: string;
  languages: string; about: string; services: string; hours: Hours;
  education: { degree: string; college: string; year: string }[]; awards: string; memberships: string;
};
const EMPTY: Form = {
  name: "", gender: "", specialty: "", qualifications: "", regNo: "", regCouncil: "", experience: "", clinic: "", address: "", locality: "", city: "", pincode: "",
  fee: "", video: false, videoFee: "", languages: "English, Hindi", about: "", services: "",
  hours: { days: [1, 2, 3, 4, 5, 6], sessions: [{ start: "10:00", end: "13:00" }, { start: "17:00", end: "20:00" }], slot: 15 },
  education: [{ degree: "MBBS", college: "", year: "" }], awards: "", memberships: "",
};
const fromDoctor = (d: OwnDoctor): Form => ({
  name: d.name, gender: d.gender ?? "", specialty: d.specialty, qualifications: d.qualifications, regNo: d.regNo, regCouncil: d.regCouncil, experience: String(d.experience),
  clinic: d.clinic, address: d.address, locality: d.locality ?? "", city: d.city, pincode: d.pincode, fee: String(d.fee), video: d.video, videoFee: d.videoFee != null ? String(d.videoFee) : "",
  languages: d.languages.join(", "), about: d.about ?? "", services: d.services.join(", "), hours: d.hours ?? EMPTY.hours,
  education: d.education?.length ? d.education : EMPTY.education, awards: (d.awards ?? []).join("\n"), memberships: (d.memberships ?? []).join("\n"),
});
export const STATUS_TEXT: Record<OwnDoctor["status"], [string, string]> = {
  pending: ["Waiting for our check", "We're checking your registration number. Your profile goes live once it's approved; we'll email you."],
  live: ["Live", "Patients can find you and book your free slots."],
  paused: ["Paused", "Your profile is hidden from search and no new bookings can be made."],
  rejected: ["Needs changes", "We couldn't approve your profile yet. Update the details below and save to send it for another check."],
};

export default function ListPractice() {
  useSeo({ title: "List your practice free | Aethex Doctors", description: "Doctors: list your clinic, fees and consulting hours on Aethex Doctors and get online bookings. Free.", path: "/list-your-practice" });
  const qc = useQueryClient();
  const { data, isLoading, error } = useMyProfile();
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [saved, setSaved] = useState(false);
  useEffect(() => { if (data?.doctor) setF(fromDoctor(data.doctor)); else if (data?.name) setF((x) => ({ ...x, name: x.name || data.name })); }, [data]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setSaved(false); };
  const setH = (h: Partial<Hours>) => set("hours", { ...f.hours, ...h });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await findApi<{ doctor: OwnDoctor }>("/me", { ...f, experience: Number(f.experience || 0), fee: f.fee === "" ? null : Number(f.fee), videoFee: f.videoFee === "" ? undefined : Number(f.videoFee) });
      await qc.invalidateQueries({ queryKey: ["find"] });
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };

  const signedOut = (error as FindError | null)?.status === 401;
  const doc = data?.doctor;

  return (
    <div className="fd-page" data-find="list">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <header className="fd-pagehead">
          <h1><UserPlus size={26} /> {doc ? "Your Aethex Doctors profile" : "List your practice. Free."}</h1>
          <p>Add your clinic, fees and consulting hours. Patients book your free slots and you confirm them from your practice dashboard.</p>
        </header>
        {isLoading ? <div className="fd-card sk" style={{ height: 300 }} />
          : signedOut ? <SignInCard title="Sign in to list your practice" text="Your profile is tied to your Aethex account, so only you can change it." href={signInHere()} />
          : error ? <div className="fd-empty"><b>Couldn't open your profile</b><p>{(error as Error).message}</p></div>
          : (
          <>
            {doc && (
              <div className={`fd-status ${doc.status}`} data-find="status">
                <b>{STATUS_TEXT[doc.status][0]}</b><span>{STATUS_TEXT[doc.status][1]}</span>
                {doc.adminNote && <em>Note from Aethex: {doc.adminNote}</em>}
                <div className="row"><Link href={`/doctor/${doc.slug}`} className="fd-link">View profile</Link><Link href="/practice" className="fd-link">Practice dashboard</Link></div>
              </div>
            )}
            {saved && <div className="fd-note ok" data-find="saved"><CheckCircle2 size={16} /> Saved. {doc?.status === "pending" ? "We'll check your registration and email you when you're live." : ""}</div>}
            <form className="fd-pform" onSubmit={save}>
              <fieldset><legend>About you</legend>
                <div className="two">
                  <label>Full name<input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Dr Asha Verma" /></label>
                  <label>Gender<select value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
                </div>
                <div className="two">
                  <label>Specialty<select required value={f.specialty} onChange={(e) => set("specialty", e.target.value)}><option value="">Choose…</option>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></label>
                  <label>Years of experience<input required inputMode="numeric" value={f.experience} onChange={(e) => set("experience", e.target.value.replace(/\D/g, ""))} /></label>
                </div>
                <label>Qualifications<input required value={f.qualifications} onChange={(e) => set("qualifications", e.target.value)} placeholder="MBBS, MD (General Medicine)" /></label>
                <label>About you (optional)<textarea rows={3} value={f.about} onChange={(e) => set("about", e.target.value)} placeholder="Your experience, interests and the conditions you treat." /></label>
                <div className="two">
                  <label>Languages<input value={f.languages} onChange={(e) => set("languages", e.target.value)} placeholder="English, Hindi" /></label>
                  <label>Services (comma-separated, optional)<input value={f.services} onChange={(e) => set("services", e.target.value)} placeholder="Diabetes care, ECG, Vaccination" /></label>
                </div>
              </fieldset>
              <fieldset data-find="education"><legend><GraduationCap size={16} /> Education and recognitions</legend>
                {f.education.map((e, i) => (
                  <div key={i} className="fd-edu">
                    <input aria-label="Degree" value={e.degree} onChange={(ev) => set("education", f.education.map((x, j) => (j === i ? { ...x, degree: ev.target.value } : x)))} placeholder="Degree, e.g. MD (Medicine)" />
                    <input aria-label="College" value={e.college} onChange={(ev) => set("education", f.education.map((x, j) => (j === i ? { ...x, college: ev.target.value } : x)))} placeholder="College" />
                    <input aria-label="Year" inputMode="numeric" maxLength={4} value={e.year} onChange={(ev) => set("education", f.education.map((x, j) => (j === i ? { ...x, year: ev.target.value.replace(/\D/g, "") } : x)))} placeholder="Year" />
                    <button type="button" className="fd-icon" onClick={() => set("education", f.education.length > 1 ? f.education.filter((_, j) => j !== i) : [{ degree: "", college: "", year: "" }])} aria-label="Remove"><Trash2 size={14} /></button>
                  </div>
                ))}
                {f.education.length < 6 && <button type="button" className="fd-link" onClick={() => set("education", [...f.education, { degree: "", college: "", year: "" }])}><Plus size={14} /> Add a degree</button>}
                <div className="two" style={{ marginTop: 12 }}>
                  <label>Awards (one per line, optional)<textarea rows={3} value={f.awards} onChange={(e) => set("awards", e.target.value)} /></label>
                  <label>Memberships (one per line, optional)<textarea rows={3} value={f.memberships} onChange={(e) => set("memberships", e.target.value)} placeholder="Indian Medical Association" /></label>
                </div>
              </fieldset>
              <fieldset><legend><ShieldCheck size={16} /> Medical registration</legend>
                <p className="tiny">We check this on the National Medical Commission's register before your profile goes live. It's shown on your profile so patients can check it too.</p>
                <div className="two">
                  <label>Registration number<input required value={f.regNo} onChange={(e) => set("regNo", e.target.value)} /></label>
                  <label>Council<select required value={f.regCouncil} onChange={(e) => set("regCouncil", e.target.value)}><option value="">Choose…</option>{COUNCILS.map((c) => <option key={c}>{c}</option>)}</select></label>
                </div>
              </fieldset>
              <fieldset><legend>Clinic</legend>
                <label>Clinic or hospital name<input required value={f.clinic} onChange={(e) => set("clinic", e.target.value)} /></label>
                <label>Address<input required value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Building, street" /></label>
                <div className="three">
                  <label>Area / locality<input value={f.locality} onChange={(e) => set("locality", e.target.value)} /></label>
                  <label>City<input required value={f.city} onChange={(e) => set("city", e.target.value)} /></label>
                  <label>PIN code<input required inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} /></label>
                </div>
                <div className="two">
                  <label>Consultation fee at clinic (₹)<input required inputMode="numeric" value={f.fee} onChange={(e) => set("fee", e.target.value.replace(/\D/g, ""))} placeholder="0 if free" /></label>
                  <div className="vid">
                    <label className="chk"><input type="checkbox" checked={f.video} onChange={(e) => set("video", e.target.checked)} /> I also offer video consultations</label>
                    {f.video && <label>Video consult fee (₹)<input inputMode="numeric" value={f.videoFee} onChange={(e) => set("videoFee", e.target.value.replace(/\D/g, ""))} placeholder="Same as clinic" /></label>}
                  </div>
                </div>
              </fieldset>
              <fieldset data-find="hours"><legend><Clock size={16} /> Consulting hours</legend>
                <div className="fd-daypick">{DAY_NAMES.map((n, i) => (
                  <button key={n} type="button" aria-pressed={f.hours.days.includes(i)} className={f.hours.days.includes(i) ? "on" : ""} onClick={() => setH({ days: f.hours.days.includes(i) ? f.hours.days.filter((x) => x !== i) : [...f.hours.days, i].sort() })}>{n}</button>
                ))}</div>
                {f.hours.sessions.map((s, i) => (
                  <div key={i} className="fd-sess">
                    <span>Session {i + 1}</span>
                    <input type="time" value={s.start} onChange={(e) => setH({ sessions: f.hours.sessions.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} aria-label={`Session ${i + 1} starts`} />
                    <span>to</span>
                    <input type="time" value={s.end} onChange={(e) => setH({ sessions: f.hours.sessions.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })} aria-label={`Session ${i + 1} ends`} />
                    {f.hours.sessions.length > 1 && <button type="button" className="fd-icon" onClick={() => setH({ sessions: f.hours.sessions.filter((_, j) => j !== i) })} aria-label="Remove session"><Trash2 size={15} /></button>}
                  </div>
                ))}
                <div className="fd-sess-foot">
                  {f.hours.sessions.length < 3 && <button type="button" className="fd-link" onClick={() => setH({ sessions: [...f.hours.sessions, { start: "18:00", end: "20:00" }] })}><Plus size={14} /> Add a session</button>}
                  <label>Each appointment<select value={f.hours.slot} onChange={(e) => setH({ slot: Number(e.target.value) })}>{[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></label>
                </div>
              </fieldset>
              {err && <p className="fd-err" role="alert">{err}</p>}
              <div className="fd-pform-foot">
                <p className="tiny"><BadgeCheck size={14} /> By listing, you confirm the details are yours and correct.</p>
                <button type="submit" className="fd-btn lg" disabled={busy}>{busy ? "Saving…" : doc ? "Save changes" : "Submit for approval"}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
