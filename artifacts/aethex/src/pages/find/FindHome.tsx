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
import { MarketTop, PhotoTiles } from "@/components/layout/MarketTop";
import { CardArt } from "@/components/visual/CardArt";

/** The specialties down the side of the home page, with their icons. */
const SPEC_LIST: [string, typeof Stethoscope][] = [
  ["General Physician", Stethoscope], ["Paediatrician", Baby], ["Gynaecologist / Obstetrician", Flower2], ["Dermatologist", Sparkles], ["Dentist", Smile],
  ["Orthopaedic Surgeon", Bone], ["ENT Specialist", Ear], ["Ophthalmologist", Eye], ["Cardiologist", HeartPulse], ["Psychiatrist", Brain], ["Endocrinologist", Droplet],
];
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
      {/* update 71: the marketplace top, like the Store's */}
      <MarketTop
        portal="doctors"
        title="Find a doctor. Book a visit."
        sub="Checked doctors and clinics near you: see fees and consulting hours, book a clinic visit or a video consult."
        right={<form className="fd-search" onSubmit={search} role="search">
            <label className="city"><MapPin size={18} />
              <input list="fd-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" />
              <datalist id="fd-cities">{(data?.cities.length ? data.cities.map((c) => c.city) : CITIES).map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="q"><Search size={18} />
              <input list="fd-specs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search doctors, specialties, clinics" aria-label="Search doctors" />
              <datalist id="fd-specs">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist>
            </label>
            <button type="submit" className="fd-btn lg">Search</button>
          </form>}
        deptTitle="Specialties"
        depts={SPEC_LIST.map(([sp, I]) => ({ label: sp, icon: I, href: `/doctors?specialty=${encodeURIComponent(sp)}${city ? `&city=${encodeURIComponent(city)}` : ""}` }))}
        all={{ label: "All specialties", href: "/doctors" }}
        scene="pulse" rgb="56,189,248"
        slides={[
          { kicker: "Clinic visits", title: "Book a doctor near you", text: "Search by city and specialty, see the doctor's free times and book in a minute. The doctor confirms by email.", cta: { label: "Find doctors", onClick: () => search() }, second: { label: "Clinics", href: "/clinics" }, tone: "navy", bg: "consultation", icon: CalendarCheck },
          { kicker: "Video consults", title: "See a doctor from home", text: "Doctors who also consult online, with their own video link. Book a time that suits you.", cta: { label: "Video consults", onClick: () => search(undefined, { video: "1" }) }, tone: "blue", bg: "videoConsult", icon: Video },
          { kicker: "Ask a doctor", title: "Ask a health question, free", text: "Post your question without your name. Doctors whose registration we've checked answer, usually within a day.", cta: { label: "Ask a question", href: "/ask" }, second: { label: "Health articles", href: "/articles" }, tone: "ink", bg: "doctorLaptop", icon: MessageCircleQuestionMark },
          { kicker: "For doctors", title: "List your practice. Free.", text: "Add your clinic, fees and consulting hours. Patients book your free slots and you confirm them from your dashboard.", cta: { label: "List your practice", href: "/list-your-practice" }, second: { label: "Practice dashboard", href: "/practice" }, tone: "slate", bg: "doctorDesk", icon: UserPlus },
        ]}
        promos={[
          { kicker: "Health records", title: "Your reports in one place", text: "Kept on your device", href: "/records", icon: FolderHeart, bg: "stethoscopePills" },
          { kicker: "Clinics", title: "Clinics near you", text: "Every doctor at each clinic", href: "/clinics", icon: Building2, dark: true, bg: "reception" },
        ]}
        trust={[
          { icon: BadgeCheck, t: "Checked doctors", d: "Registration verified" },
          { icon: Sparkles, t: "Real reviews", d: "Only after a visit" },
          { icon: Video, t: "Video consults", d: "From your home" },
          { icon: MessageCircleQuestionMark, t: "Ask free", d: "Answers from doctors" },
          { icon: FolderHeart, t: "Health records", d: "On your device only" },
        ]}
      />

      <section className="fd-services">
        <div className="ax-wrap fd-svc-grid">
          <button type="button" className="fd-svc blue has-art" onClick={() => search()}><CardArt icon={CalendarCheck} color="#1d4ed8" /><span className="ic"><CalendarCheck size={26} /></span><b>Book a clinic visit</b><small>Choose a doctor and a time that suits you</small></button>
          <button type="button" className="fd-svc teal has-art" onClick={() => search(undefined, { video: "1" })}><CardArt icon={Video} color="#0f766e" /><span className="ic"><Video size={26} /></span><b>Video consultation</b><small>Doctors who also see patients online</small></button>
          <Link href="/ask" className="fd-svc violet has-art" data-find="svc-ask"><CardArt icon={MessageCircleQuestionMark} color="#6d28d9" /><span className="ic"><MessageCircleQuestionMark size={26} /></span><b>Ask a doctor, free</b><small>Get answers from checked doctors</small></Link>
          <Link href="/clinics" className="fd-svc navy has-art"><CardArt icon={Building2} color="#1e3a8a" /><span className="ic"><Building2 size={26} /></span><b>Clinics near you</b><small>Every doctor at each clinic</small></Link>
          <Link href="/articles" className="fd-svc amber has-art"><CardArt icon={Newspaper} color="#b45309" /><span className="ic"><Newspaper size={26} /></span><b>Health articles</b><small>Written by doctors</small></Link>
          <Link href="/records" className="fd-svc rose has-art"><CardArt icon={FolderHeart} color="#be123c" /><span className="ic"><FolderHeart size={26} /></span><b>Health records</b><small>Reports and prescriptions, on your device</small></Link>
        </div>
      </section>

      <PhotoTiles kicker="Book in a minute" title="Care for every need" text="Checked doctors, at their clinic or on video."
        more={{ label: "All doctors", href: "/doctors" }}
        tiles={[
          { title: "Clinic visit", sub: "See a doctor near you", bg: "consultTablet", onClick: () => search() },
          { title: "Video consult", sub: "From your home", bg: "videoConsult", onClick: () => search(undefined, { video: "1" }) },
          { title: "General check-up", sub: "General Physician", bg: "bpCheck", href: `/doctors?specialty=${encodeURIComponent("General Physician")}` },
          { title: "Heart care", sub: "Cardiologist", bg: "stethoscopeHand", href: `/doctors?specialty=${encodeURIComponent("Cardiologist")}` },
          { title: "Women's health", sub: "Gynaecologist", bg: "doctorWoman", href: `/doctors?specialty=${encodeURIComponent("Gynaecologist / Obstetrician")}` },
          { title: "Ask a doctor", sub: "Free, without your name", bg: "doctorSmile", href: "/ask" },
        ]} />

      <section className="fd-sec">
        <div className="ax-wrap">
          <div className="fd-head"><div><h2>Consult a doctor for any health concern</h2><p>Pick what's bothering you; we'll show the right specialists.</p></div><Link href="/doctors" className="fd-more">All specialties <ArrowRight size={15} /></Link></div>
          <div className="fd-concerns">
            {CONCERNS.map((c, i) => {
              const I = CONCERN_ICON[i] ?? Stethoscope;
              return <Link key={c.label} href={`/doctors?specialty=${encodeURIComponent(c.specialty)}`} className="has-art"><CardArt icon={I} color="#1d4ed8" seed={i} /><span className="ic"><I size={28} /></span><b>{c.label}</b><small>{c.specialty}</small></Link>;
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
