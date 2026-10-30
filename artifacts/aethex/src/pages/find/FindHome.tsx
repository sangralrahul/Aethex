/**
 * doctors.aethex.in (and /find): find a doctor by city and specialty and book a time. Doctors list their own
 * practice for free; listings show after an admin checks the registration number.
 */
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Baby, BadgeCheck, Bone, Brain, CalendarCheck, ClipboardCheck, Ear, Eye, HeartPulse, LayoutDashboard, MapPin,
  Search, ShieldCheck, Smile, Sparkles, Stethoscope, Thermometer, UserPlus, Video, Droplet, Soup, Flower2,
  Building2, FileText, FolderHeart, MessageCircleQuestionMark, Newspaper,
} from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { CITIES, CONCERNS, SPECIALTIES, findHome, useDoctors } from "@/lib/find";
import { FindNav } from "./FindParts";
import { HeroScene } from "@/components/visual/HeroScene";

const CONCERN_ICON = [Thermometer, Baby, Flower2, Sparkles, Smile, Bone, Ear, Eye, HeartPulse, Brain, Droplet, Soup];

export default function FindHome() {
  useSeo({ title: "Aethex Doctors: find a doctor, book an appointment, ask a doctor", description: "Find doctors and clinics by city and specialty, see fees, timings and patient stories, book a clinic visit or video consult, ask a doctor free and read health articles.", path: findHome() });
  const [, go] = useLocation();
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const { data } = useDoctors({});
  const listed = data?.doctors.length ?? 0;
  const search = (e?: FormEvent, extra: Record<string, string> = {}) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    const spec = SPECIALTIES.find((s) => s.toLowerCase() === q.trim().toLowerCase());
    if (spec) p.set("specialty", spec); else if (q.trim()) p.set("q", q.trim());
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    go(`/doctors?${p}`);
  };

  return (
    <div className="fd-page" data-find="home">
      <FindNav />
      {/* update 67: the same hero as the other platforms, in the Doctors blue */}
      <section className="ax-ihero fd-hero2">
        <div className="ax-ihero-bg" aria-hidden="true"><i /><i /><i /><HeroScene kind="pulse" rgb="56,189,248" ghosts={["stethoscope", "otoscope"]} /></div>
        <div className="ax-wrap ax-ihero-in">
          <div className="txt">
            <span className="eyebrow"><Stethoscope size={15} /> Aethex Doctors<em>Clinic visits and video consults</em></span>
            <h1>Find a doctor. Book a visit.</h1>
            <p>Search by city and specialty, see fees and consulting hours, and book a clinic visit or a video consult in a minute.</p>
          <form className="fd-search" onSubmit={search} role="search">
            <label className="city"><MapPin size={18} />
              <input list="fd-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" />
              <datalist id="fd-cities">{(data?.cities.length ? data.cities.map((c) => c.city) : CITIES).map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="q"><Search size={18} />
              <input list="fd-specs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search doctors, specialties, clinics" aria-label="Search doctors" />
              <datalist id="fd-specs">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist>
            </label>
            <button type="submit" className="fd-btn lg">Search</button>
          </form>
          <div className="fd-quick">
            {["General Physician", "Paediatrician", "Gynaecologist / Obstetrician", "Dermatologist", "Dentist", "Orthopaedic Surgeon"].map((s) => (
              <button key={s} type="button" onClick={() => go(`/doctors?specialty=${encodeURIComponent(s)}${city ? `&city=${encodeURIComponent(city)}` : ""}`)}>{s}</button>
            ))}
          </div>
            <ul className="fd-assure">
              <li><BadgeCheck size={16} /> Every doctor's registration is checked before they're listed</li>
              <li><Sparkles size={16} /> Reviews only from completed visits</li>
            </ul>
          </div>
          <div className="art" aria-hidden="true">
            {["stethoscope", "bp-monitor", "otoscope", "thermometer"].map((n, i) => <span key={n} className={`ph p${i}`}><img src={`${import.meta.env.BASE_URL}product-images/${n}.jpg`} alt="" loading="eager" decoding="async" /></span>)}
            <div className="ticket">
              <b><ShieldCheck size={16} /> Checked doctors only</b>
              <small>Each doctor's medical registration number is checked before the profile goes live.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="fd-services">
        <div className="ax-wrap fd-svc-grid">
          <button type="button" className="fd-svc blue" onClick={() => search()}><span className="ic"><CalendarCheck size={26} /></span><b>Book a clinic visit</b><small>Choose a doctor and a time that suits you</small></button>
          <button type="button" className="fd-svc teal" onClick={() => search(undefined, { video: "1" })}><span className="ic"><Video size={26} /></span><b>Video consultation</b><small>Doctors who also see patients online</small></button>
          <Link href="/ask" className="fd-svc violet" data-find="svc-ask"><span className="ic"><MessageCircleQuestionMark size={26} /></span><b>Ask a doctor, free</b><small>Get answers from checked doctors</small></Link>
          <Link href="/clinics" className="fd-svc navy"><span className="ic"><Building2 size={26} /></span><b>Clinics near you</b><small>Every doctor at each clinic</small></Link>
          <Link href="/articles" className="fd-svc amber"><span className="ic"><Newspaper size={26} /></span><b>Health articles</b><small>Written by doctors</small></Link>
          <Link href="/records" className="fd-svc rose"><span className="ic"><FolderHeart size={26} /></span><b>Health records</b><small>Reports and prescriptions, on your device</small></Link>
        </div>
      </section>

      <section className="fd-sec">
        <div className="ax-wrap">
          <div className="fd-head"><div><h2>Consult a doctor for any health concern</h2><p>Pick what's bothering you; we'll show the right specialists.</p></div><Link href="/doctors" className="fd-more">All specialties <ArrowRight size={15} /></Link></div>
          <div className="fd-concerns">
            {CONCERNS.map((c, i) => {
              const I = CONCERN_ICON[i] ?? Stethoscope;
              return <Link key={c.label} href={`/doctors?specialty=${encodeURIComponent(c.specialty)}`}><span className="ic"><I size={28} /></span><b>{c.label}</b><small>{c.specialty}</small></Link>;
            })}
          </div>
        </div>
      </section>

      <section className="fd-sec">
        <div className="ax-wrap">
          <div className="fd-head"><div><h2>Find doctors by specialty</h2><p>{listed ? `${listed} doctor${listed === 1 ? "" : "s"} listed so far.` : "New doctors are joining. Listings appear once their registration is checked."}</p></div></div>
          <div className="fd-specs">
            {SPECIALTIES.map((s) => <Link key={s} href={`/doctors?specialty=${encodeURIComponent(s)}`}>{s} <ArrowRight size={14} /></Link>)}
          </div>
        </div>
      </section>

      <section className="fd-sec">
        <div className="ax-wrap fd-how">
          <div>
            <h2>How booking works</h2>
            <ol>
              <li><span>1</span><div><b>Search</b><small>By city, specialty, clinic or the doctor's name.</small></div></li>
              <li><span>2</span><div><b>Choose a time</b><small>Only the doctor's free slots are shown.</small></div></li>
              <li><span>3</span><div><b>Get confirmed</b><small>The doctor confirms; you get an email. Cancel any time before.</small></div></li>
            </ol>
          </div>
          <div className="fd-trust">
            <p><ShieldCheck size={20} /> <span><b>Checked doctors only.</b> We check each doctor's medical registration number before the profile goes live.</span></p>
            <p><Star2 /> <span><b>Real reviews.</b> Only patients whose visit the doctor marked as completed can leave a review.</span></p>
            <p><HeartPulse size={20} /> <span><b>Not for emergencies.</b> In an emergency call 112 or go to the nearest hospital.</span></p>
          </div>
        </div>
      </section>

      <section className="fd-sec last">
        <div className="ax-wrap">
          <div className="fd-docband">
            <div>
              <small>For doctors</small>
              <h2>List your practice on Aethex Doctors. Free.</h2>
              <p>Add your clinic, fees and consulting hours. Patients book your free slots, and you confirm them from your practice dashboard. Your profile goes live once we've checked your registration number.</p>
              <div className="row">
                <Link href="/list-your-practice" className="fd-btn white lg"><UserPlus size={17} /> List your practice</Link>
                <Link href="/practice" className="fd-btn outline lg"><LayoutDashboard size={17} /> Practice dashboard</Link>
              </div>
            </div>
            <ul>
              <li><CalendarCheck size={18} /> Online bookings for your free slots</li>
              <li><Video size={18} /> Video consultations, with your own meeting link</li>
              <li><ClipboardCheck size={18} /> Confirm, complete and track every visit</li>
              <li><FileText size={18} /> Digital prescriptions your patients can print</li>
              <li><Newspaper size={18} /> Answer questions and publish articles</li>
              <li><BadgeCheck size={18} /> A checked profile patients can trust</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Star2() { return <Sparkles size={20} />; }
