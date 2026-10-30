/**
 * Update 75: patient tools on Aethex Doctors.
 * /which-doctor   symptoms to the right specialty, then doctors near you (guidance, not a diagnosis)
 * /saved-doctors  saved doctors and the side-by-side comparison (kept in this browser)
 * /family         family members the patient books for
 * Also the pieces the other pages use: SaveCompare buttons, the CompareBar and the calendar buttons.
 * Styles: src/site-find.css (fd-tool-*, fd-cmp-*, fd-fam-*).
 */
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, BadgeCheck, CalendarPlus, Check, Columns3, Compass, Heart, Pencil, Plus, Siren, Star, Trash2, Users, Video, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { formatINR } from "@/lib/utils";
import { CITIES, displayName, findApi, hoursText, signInHere, useDoctorsBySlugs, useFamily, type Appointment, type Doctor, type FamilyMember, type FindError } from "@/lib/find";
import { BODY_AREAS, COMPARE_MAX, RED_FLAGS, downloadIcs, googleCalendarUrl, suggestSpecialties, symptomById, useDoctorLists } from "@/lib/doctorTools";
import { Avatar, FindNav, SignInCard, Stars } from "./FindParts";

/* ---------------------------------------------------------------- shared pieces */

/** Heart (save) and compare toggles for one doctor. */
export function SaveCompare({ slug, name, compact }: { slug: string; name: string; compact?: boolean }) {
  const L = useDoctorLists();
  const [full, setFull] = useState(false);
  const saved = L.isSaved(slug), cmp = L.inCompare(slug);
  return (
    <div className={`fd-sc${compact ? " compact" : ""}`}>
      <button type="button" className={`fd-sc-b save${saved ? " on" : ""}`} aria-pressed={saved} onClick={() => L.toggleSaved(slug)} aria-label={saved ? `Remove ${displayName(name)} from saved doctors` : `Save ${displayName(name)}`} data-find="save">
        <Heart size={15} fill={saved ? "currentColor" : "none"} />{!compact && <span>{saved ? "Saved" : "Save"}</span>}
      </button>
      <button type="button" className={`fd-sc-b cmp${cmp ? " on" : ""}`} aria-pressed={cmp} onClick={() => { const ok = L.toggleCompare(slug); setFull(!ok); if (!ok) window.setTimeout(() => setFull(false), 2500); }} data-find="compare">
        {cmp ? <Check size={15} /> : <Columns3 size={15} />}<span>{cmp ? "Comparing" : "Compare"}</span>
      </button>
      {full && <span className="fd-sc-full" role="status">Compare up to {COMPARE_MAX} doctors</span>}
    </div>
  );
}

/** The bar at the bottom of the screen while doctors are picked for comparison. */
export function CompareBar() {
  const L = useDoctorLists();
  const { data } = useDoctorsBySlugs(L.compare);
  if (!L.compare.length) return null;
  const docs = L.compare.map((s) => data?.doctors.find((d) => d.slug === s)).filter(Boolean) as Doctor[];
  return (
    <div className="fd-cmpbar" role="region" aria-label="Compare doctors" data-find="compare-bar">
      <div className="ax-wrap">
        <div className="who">
          {L.compare.map((s) => { const d = docs.find((x) => x.slug === s); return <span key={s} className="chip"><Avatar name={d?.name ?? s} size={26} /> {d ? displayName(d.name) : "…"}<button type="button" onClick={() => L.toggleCompare(s)} aria-label="Remove"><X size={13} /></button></span>; })}
          {L.compare.length < COMPARE_MAX && <span className="slot">Add {COMPARE_MAX - L.compare.length} more</span>}
        </div>
        <div className="act">
          <button type="button" className="fd-btn ghost sm" onClick={L.clearCompare}>Clear</button>
          <Link href="/saved-doctors?tab=compare" className={`fd-btn sm${L.compare.length < 2 ? " dis" : ""}`} aria-disabled={L.compare.length < 2}><Columns3 size={15} /> Compare {L.compare.length}</Link>
        </div>
      </div>
    </div>
  );
}

/** Add an appointment to a calendar. */
export function CalendarButtons({ a }: { a: Appointment }) {
  return (
    <span className="fd-cal" data-find="calendar">
      <button type="button" className="fd-btn sm ghost" onClick={() => downloadIcs(a)}><CalendarPlus size={14} /> Add to calendar</button>
      <a className="fd-btn sm ghost" href={googleCalendarUrl(a)} target="_blank" rel="noopener noreferrer">Google Calendar</a>
    </span>
  );
}

/* ---------------------------------------------------------------- which doctor should I see? */

export function WhichDoctor() {
  useSeo({ title: "Which doctor should I see? | Aethex Doctors", description: "Pick your symptoms and see which specialist usually treats them, then book a checked doctor near you.", path: "/which-doctor" });
  const [, go] = useLocation();
  const [area, setArea] = useState(BODY_AREAS[0]!.id);
  const [picked, setPicked] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const result = useMemo(() => suggestSpecialties(picked), [picked]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-8)));
  const find = (sp: string) => go(`/doctors?${new URLSearchParams({ specialty: sp, ...(city.trim() ? { city: city.trim() } : {}) })}`);
  const cur = BODY_AREAS.find((a) => a.id === area)!;
  return (
    <div className="fd-page" data-find="which">
      <FindNav />
      <div className="ax-wrap fd-tool">
        <header className="fd-pagehead"><h1><Compass size={26} /> Which doctor should I see?</h1><p>Choose what you're feeling. We'll show the specialist who usually treats it, and doctors near you.</p></header>
        <div className="fd-redflag" role="note"><Siren size={20} /><div><b>Go to the emergency department or call 112 now if you have:</b><ul>{RED_FLAGS.map((r) => <li key={r}>{r}</li>)}</ul></div></div>
        <div className="fd-tool-grid">
          <section className="fd-box">
            <h2>1. Where is the problem?</h2>
            <div className="fd-areas" role="tablist">{BODY_AREAS.map((a) => { const n = a.symptoms.filter((s) => picked.includes(s.id)).length; return <button key={a.id} type="button" role="tab" aria-selected={a.id === area} className={a.id === area ? "on" : ""} onClick={() => setArea(a.id)}>{a.label}{n > 0 && <em>{n}</em>}</button>; })}</div>
            <h2>2. What are you feeling?</h2>
            <div className="fd-symps">{cur.symptoms.map((s) => <button key={s.id} type="button" aria-pressed={picked.includes(s.id)} className={picked.includes(s.id) ? "on" : ""} onClick={() => toggle(s.id)} data-symptom={s.id}>{picked.includes(s.id) ? <Check size={14} /> : <Plus size={14} />} {s.label}</button>)}</div>
            {picked.length > 0 && <div className="fd-picked"><span>You chose:</span>{picked.map((id) => <button key={id} type="button" onClick={() => toggle(id)}>{symptomById(id)?.label} <X size={12} /></button>)}<button type="button" className="clr" onClick={() => setPicked([])}>Clear all</button></div>}
          </section>
          <aside className="fd-box fd-suggest" aria-live="polite" data-find="suggest">
            <h2>3. The right specialist</h2>
            {!result.length ? <p className="mu">Choose one or more symptoms to see who to book.</p> : <>
              <label className="fd-city">City (optional)<input list="fd-wd-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" /><datalist id="fd-wd-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></label>
              <ol>{result.map((r, i) => (
                <li key={r.specialty} className={i === 0 ? "top" : ""} data-specialty={r.specialty}>
                  <div><b>{r.specialty}</b>{i === 0 && <span className="best">Best match</span>}{r.because.length > 0 && <small>For {r.because.slice(0, 3).join(", ").toLowerCase()}</small>}</div>
                  <button type="button" className={`fd-btn sm${i ? " ghost" : ""}`} onClick={() => find(r.specialty)}>Find doctors <ArrowRight size={14} /></button>
                </li>
              ))}</ol>
              <p className="tiny"><AlertTriangle size={13} /> This points you to a specialty; it isn't a diagnosis. Not sure? A General Physician can see you first and refer you.</p>
            </>}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- saved and compared doctors */

function CompareTable({ docs }: { docs: Doctor[] }) {
  const L = useDoctorLists();
  const minFee = Math.min(...docs.map((d) => d.fee)), maxExp = Math.max(...docs.map((d) => d.experience));
  const bestRating = Math.max(...docs.map((d) => d.rating?.avg ?? 0));
  const rows: [string, (d: Doctor) => ReactNode][] = [
    ["Specialty", (d) => d.specialty],
    ["Qualifications", (d) => d.qualifications],
    ["Experience", (d) => <span className={d.experience === maxExp && docs.length > 1 ? "best" : ""}>{d.experience} years</span>],
    ["Clinic fee", (d) => <span className={d.fee === minFee && docs.length > 1 ? "best" : ""}>{d.fee ? formatINR(d.fee) : "Free"}</span>],
    ["Video consult", (d) => (d.video ? <>{(d.videoFee ?? d.fee) ? formatINR(d.videoFee ?? d.fee) : "Free"}</> : <span className="mu">Not offered</span>)],
    ["Patient rating", (d) => (d.rating ? <span className={d.rating.avg === bestRating && docs.length > 1 ? "best" : ""}><Stars value={d.rating.avg} size={12} /> {d.rating.avg.toFixed(1)} ({d.rating.count})</span> : <span className="mu">No reviews yet</span>)],
    ["Clinic", (d) => <>{d.clinic}<br /><span className="mu">{d.locality ? `${d.locality}, ` : ""}{d.city}</span></>],
    ["Consulting hours", (d) => hoursText(d.hours)],
    ["Languages", (d) => (d.languages.length ? d.languages.join(", ") : <span className="mu">Not given</span>)],
    ["Services", (d) => (d.services.length ? d.services.slice(0, 5).join(", ") : <span className="mu">Not given</span>)],
    ["Registration", (d) => <span className="ok"><BadgeCheck size={13} /> Checked · {d.regCouncil}</span>],
  ];
  return (
    <div className="fd-cmp" data-find="compare-table">
      <table>
        <thead><tr><th scope="col"><span className="sr-only">Detail</span></th>{docs.map((d) => (
          <th key={d.slug} scope="col"><Avatar name={d.name} size={56} /><Link href={`/doctor/${d.slug}`}><b>{displayName(d.name)}</b></Link><button type="button" className="rm" onClick={() => L.toggleCompare(d.slug)} aria-label={`Remove ${displayName(d.name)}`}><X size={14} /></button></th>
        ))}</tr></thead>
        <tbody>{rows.map(([k, f]) => <tr key={k}><th scope="row">{k}</th>{docs.map((d) => <td key={d.slug}>{f(d)}</td>)}</tr>)}</tbody>
        <tfoot><tr><th />{docs.map((d) => <td key={d.slug}><Link href={`/doctor/${d.slug}#book`} className="fd-btn sm full">Book</Link>{d.video && <Link href={`/doctor/${d.slug}?mode=video#book`} className="fd-btn sm ghost full"><Video size={13} /> Video</Link>}</td>)}</tr></tfoot>
      </table>
      <p className="tiny"><Star size={12} /> Green marks the lowest fee, the most experience and the best rating.</p>
    </div>
  );
}

export function SavedDoctors() {
  useSeo({ title: "Saved doctors and compare | Aethex Doctors", description: "Doctors you saved on Aethex Doctors, and a side-by-side comparison.", path: "/saved-doctors" });
  const L = useDoctorLists();
  const [tab, setTab] = useState<"saved" | "compare">(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "compare" ? "compare" : "saved"));
  const all = useMemo(() => [...new Set([...L.saved, ...L.compare])], [L.saved, L.compare]);
  const { data, isLoading } = useDoctorsBySlugs(all);
  const by = (s: string) => data?.doctors.find((d) => d.slug === s);
  const saved = L.saved.map(by).filter(Boolean) as Doctor[];
  const cmp = L.compare.map(by).filter(Boolean) as Doctor[];
  return (
    <div className="fd-page" data-find="saved">
      <FindNav />
      <div className="ax-wrap fd-tool">
        <header className="fd-pagehead"><h1><Heart size={26} /> Saved doctors</h1><p>Kept in this browser. Tap the heart on any doctor to save them; tick "Compare" to put up to {COMPARE_MAX} side by side.</p></header>
        <div className="kh-tabs fd-tabs2" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "on" : ""} onClick={() => setTab("saved")}>Saved ({L.saved.length})</button>
          <button type="button" role="tab" aria-selected={tab === "compare"} className={tab === "compare" ? "on" : ""} onClick={() => setTab("compare")} data-tab="compare">Compare ({L.compare.length})</button>
        </div>
        {isLoading && all.length > 0 ? <div className="fd-card sk" style={{ height: 220 }} />
          : tab === "saved" ? (
            saved.length ? <div className="fd-savedgrid">{saved.map((d) => (
              <article key={d.slug} className="fd-saved" data-doctor={d.slug}>
                <Link href={`/doctor/${d.slug}`} className="top"><Avatar name={d.name} size={56} /><span><b>{displayName(d.name)}</b><small>{d.specialty} · {d.experience} yrs</small><small>{d.clinic}, {d.city}</small></span></Link>
                <p className="fee">{d.fee ? formatINR(d.fee) : "Free"} at clinic{d.video ? " · video consult" : ""}</p>
                <SaveCompare slug={d.slug} name={d.name} />
                <Link href={`/doctor/${d.slug}#book`} className="fd-btn sm full">Book appointment</Link>
              </article>
            ))}</div> : <div className="fd-empty"><b>No saved doctors yet</b><p>Tap the heart on a doctor's card to keep them here.</p><Link href="/doctors" className="fd-btn">Find doctors</Link></div>
          ) : cmp.length >= 2 ? <CompareTable docs={cmp} />
          : <div className="fd-empty"><b>Pick {cmp.length ? "one more doctor" : "two or three doctors"} to compare</b><p>Tick "Compare" on doctors in search results or on their profiles.</p><Link href="/doctors" className="fd-btn">Find doctors</Link></div>}
        {tab === "saved" && L.saved.length > saved.length && !isLoading && <p className="tiny">{L.saved.length - saved.length} saved doctor{L.saved.length - saved.length === 1 ? " is" : "s are"} no longer listed.</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- family members */

const blank = { id: "", name: "", relation: "", age: "", gender: "", phone: "" };
export function MemberForm({ start, relations, onDone, onCancel }: { start?: FamilyMember; relations: string[]; onDone: (m: FamilyMember) => void; onCancel?: () => void }) {
  const [f, setF] = useState(start ? { id: start.id, name: start.name, relation: start.relation, age: start.age == null ? "" : String(start.age), gender: start.gender ?? "", phone: start.phone ?? "" } : blank);
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await findApi<{ member: FamilyMember }>("/family", f); onDone(r.member); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };
  return (
    <form className="fd-form fd-fam-form" onSubmit={save} data-find="member-form">
      <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <div className="two">
        <label>Relation<select required value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}><option value="">Choose</option>{relations.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label>Age<input inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></label>
      </div>
      <div className="two">
        <label>Gender<select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
        <label>Mobile (optional)<input inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="10 digits" /></label>
      </div>
      {err && <p className="fd-err" role="alert">{err}</p>}
      <div className="row"><button type="submit" className="fd-btn sm" disabled={busy}>{busy ? "Saving…" : start ? "Save changes" : "Add member"}</button>{onCancel && <button type="button" className="fd-btn sm ghost" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}

export function FamilyPage() {
  useSeo({ title: "Family members | Aethex Doctors", description: "Book appointments for your family from one account.", path: "/family" });
  const qc = useQueryClient();
  const { data, isLoading, error } = useFamily();
  const [editing, setEditing] = useState<string>(""), [err, setErr] = useState("");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["find", "family"] });
  const remove = async (m: FamilyMember) => {
    if (!window.confirm(`Remove ${m.name} from your family members? Their past appointments stay in My appointments.`)) return;
    try { await findApi(`/family/${m.id}/delete`, {}); refresh(); } catch (x) { setErr((x as FindError).message); }
  };
  const fe = error as FindError | null;
  return (
    <div className="fd-page" data-find="family">
      <FindNav />
      <div className="ax-wrap fd-narrow">
        <header className="fd-pagehead"><h1><Users size={26} /> Family members</h1><p>Book for your parents, children or partner from your account. Each person's appointments are kept separate.</p></header>
        {isLoading ? <div className="fd-card sk" style={{ height: 160 }} />
          : fe?.status === 401 ? <SignInCard title="Sign in to add family members" text="Add the people you book for, then choose them when you book." href={signInHere()} />
          : fe ? <div className="fd-empty"><b>Couldn't load your family</b><p>{fe.message}</p></div>
          : <>
            {err && <p className="fd-err">{err}</p>}
            <div className="fd-fam">
              {data!.members.map((m) => editing === m.id ? <MemberForm key={m.id} start={m} relations={data!.relations} onDone={() => { setEditing(""); refresh(); }} onCancel={() => setEditing("")} /> : (
                <article key={m.id} className="fd-fam-row" data-member={m.id}>
                  <Avatar name={m.name} size={48} />
                  <div><b>{m.name}</b><small>{m.relation}{m.age != null ? ` · ${m.age} y` : ""}{m.gender ? ` · ${m.gender}` : ""}{m.phone ? ` · ${m.phone}` : ""}</small></div>
                  <Link href={`/appointments?for=${m.id}`} className="fd-btn sm ghost">Appointments</Link>
                  <button type="button" className="fd-icon" onClick={() => setEditing(m.id)} aria-label={`Edit ${m.name}`}><Pencil size={15} /></button>
                  <button type="button" className="fd-icon danger" onClick={() => void remove(m)} aria-label={`Remove ${m.name}`}><Trash2 size={15} /></button>
                </article>
              ))}
              {editing === "new" ? <MemberForm relations={data!.relations} onDone={() => { setEditing(""); refresh(); }} onCancel={() => setEditing("")} />
                : data!.members.length < 12 && <button type="button" className="fd-fam-add" onClick={() => setEditing("new")} data-find="add-member"><Plus size={18} /> Add a family member</button>}
            </div>
          </>}
      </div>
    </div>
  );
}
