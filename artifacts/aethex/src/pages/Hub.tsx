/**
 * aethex.in (update 58): the front door to Aethex, in the style of Practo: one search, then the six portals:
 * Cadus (cadus.aethex.in), the Store (store.aethex.in), Study (study.aethex.in), Find a doctor (find.aethex.in),
 * Hospitals (hospitals.aethex.in) and Medical colleges (medicalcolleges.aethex.in). Styles: src/site-hub.css (hb-*).
 */
import { useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight, BadgeCheck, Baby, BookOpen, Bone, Brain, Building2, Calculator, CalendarCheck, Ear, Eye, Flower2, GraduationCap, HeartPulse,
  Hospital, MapPin, Package, Search, ShieldCheck, ShoppingBag, Smile, Sparkles, Star, Stethoscope, Thermometer, Truck, UserPlus, Video,
  type LucideProps,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { useSeo } from "@/hooks/use-seo";
import { useStore } from "@/lib/store/api";
import { CONCERNS, SPECIALTIES } from "@/lib/find";
import { portalUrl, type Portal } from "@/lib/host";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";

type Icon = ComponentType<LucideProps>;
const TESTIMONIALS = [
  { quote: "Aethex has completely changed how I manage patient care. Cadus gives me instant drug references mid-consultation — it's like having a pharmacologist in the room.", name: "Dr. Priya Sharma", role: "Cardiologist, Mumbai", initials: "PS" },
  { quote: "As a GP seeing 40+ patients daily, the Drug Interaction Checker has saved me from three potentially dangerous prescriptions in a single week. I can't imagine going back.", name: "Dr. Arjun Mehta", role: "General Physician, Delhi", initials: "AM" },
  { quote: "Cadus helped me cross-reference a rare neuro case at 11 PM — the depth of the response was remarkable. This platform is what Indian medicine has been waiting for.", name: "Dr. Vikram Nair", role: "Neurologist, Chennai", initials: "VN" },
];

const CONCERN_ICON = [Thermometer, Baby, Flower2, Sparkles, Smile, Bone, Ear, Eye, HeartPulse, Brain];

/* ------------------------------------------------------------------ the living backgrounds of the five tiles */
const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;
/** A product photo floating in the tile, with its own drift. */
const Float = ({ n, x, y, w, d }: { n: string; x: number; y: number; w: number; d: number }) => (
  <img src={IMG(n)} alt="" loading="lazy" decoding="async" className="fl" style={{ left: `${x}%`, top: `${y}%`, width: w, animationDuration: `${d}s`, animationDelay: `${-d / 3}s` }} />
);
const FindArt = () => (
  <>
    <svg className="map" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><pattern id="hbGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.14)" /></pattern></defs>
      <rect width="600" height="400" fill="url(#hbGrid)" />
      <path d="M-20 300 C 120 250, 180 330, 320 270 S 520 200, 640 240" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="6" strokeLinecap="round" />
      <path d="M200 -20 C 230 100, 170 180, 260 260 S 330 380, 300 440" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="5" strokeLinecap="round" />
      {[[150, 120], [330, 200], [470, 110], [250, 320], [520, 300]].map(([x, y], i) => (
        <g key={i} className="pin" style={{ animationDelay: `${i * 0.7}s` }} transform={`translate(${x} ${y})`}>
          <circle className="ring" r="10" fill="none" stroke="#5de0ff" strokeWidth="2" />
          <circle r="7" fill="#14bef0" stroke="#fff" strokeWidth="2.5" />
        </g>
      ))}
    </svg>
    <Float n="stethoscope" x={62} y={42} w={160} d={11} />
  </>
);
const StoreArt = () => (
  <>
    <Float n="bp-monitor" x={50} y={8} w={140} d={12} />
    <Float n="otoscope" x={76} y={4} w={120} d={14} />
    <Float n="oximeter" x={78} y={50} w={110} d={10} />
    <Float n="nebulizer" x={52} y={54} w={120} d={13} />
    <Float n="glucometer" x={66} y={30} w={100} d={9} />
  </>
);
const StudyArt = () => (
  <>
    <div className="cards">
      {["Drug of choice in absence seizures?", "Nerve injured in a humerus fracture?", "Most common cause of nephrotic syndrome in children?"].map((q, i) => (
        <div key={q} className="mcq" style={{ animationDelay: `${i * 2.2}s` }}><small>NEET-PG · Q{i + 1}</small><b>{q}</b><span /><span className="ok" /><span /></div>
      ))}
    </div>
    <Float n="test-books" x={64} y={46} w={160} d={12} />
    <svg className="pring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="10" /><circle className="prog" cx="60" cy="60" r="50" fill="none" stroke="#c4b5fd" strokeWidth="10" strokeLinecap="round" strokeDasharray="314" /></svg>
  </>
);
const HospitalArt = () => (
  <>
    <svg className="ecg" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
      <path className="trace" d="M0 100 H120 L140 60 L160 140 L180 100 H300 L315 20 L330 180 L345 100 H470 L490 70 L510 130 L525 100 H650 L665 30 L680 170 L695 100 H800" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
    <Float n="ecg" x={52} y={8} w={150} d={13} />
    <Float n="xray-viewer" x={76} y={48} w={140} d={11} />
    <div className="vitals"><span><small>HR</small><b>72</b></span><span><small>SpO₂</small><b>98%</b></span><span><small>BP</small><b>118/76</b></span></div>
  </>
);
const CollegeArt = () => (
  <>
    <svg className="helix" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const x = 20 + i * 44, y1 = 150 + Math.sin(i * 0.9) * 70, y2 = 150 - Math.sin(i * 0.9) * 70;
        return <g key={i} className="rung" style={{ animationDelay: `${i * 0.18}s` }}><line x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(255,255,255,.35)" strokeWidth="3" /><circle cx={x} cy={y1} r="7" fill="#fcd34d" /><circle cx={x} cy={y2} r="7" fill="#fff" /></g>;
      })}
    </svg>
    <Float n="surgical-set" x={52} y={8} w={140} d={12} />
    <Float n="lab-coat" x={78} y={6} w={120} d={14} />
    <Float n="medical-book" x={66} y={50} w={130} d={10} />
  </>
);

const TILES: { id: Portal; kicker: string; title: string; text: string; cta: string; icon: ReactNode; art: ReactNode }[] = [
  { id: "find", kicker: "For patients", title: "Find a doctor", text: "Search by city and specialty. Book a clinic visit or a video consult.", cta: "Book now", icon: <CalendarCheck size={26} />, art: <FindArt /> },
  { id: "store", kicker: "For everyone", title: "Medical store", text: "Genuine instruments, monitors and supplies. Cash on delivery across India.", cta: "Shop now", icon: <ShoppingBag size={26} />, art: <StoreArt /> },
  { id: "study", kicker: "For students", title: "Study", text: "NEET-PG preparation, mock tests, flashcards and every subject.", cta: "Start studying", icon: <GraduationCap size={26} />, art: <StudyArt /> },
  { id: "hospitals", kicker: "For institutions", title: "Hospitals", text: "Furniture, ICU, emergency and diagnostics: one list, one quotation.", cta: "Get a quotation", icon: <Hospital size={26} />, art: <HospitalArt /> },
  { id: "medicalcolleges", kicker: "For institutions", title: "Medical colleges", text: "Skills labs, manikins, anatomy models and lab equipment.", cta: "Equip your college", icon: <Building2 size={26} />, art: <CollegeArt /> },
];
type Scope = "doctors" | "products" | "study";

export default function Hub() {
  useSeo({
    title: "Aethex: find doctors, medical supplies, Cadus clinical AI and NEET-PG study, in one place",
    description: "Aethex for India's doctors, patients and medical students: book doctors, shop genuine medical supplies, ask Cadus clinical questions and prepare for NEET-PG.",
    path: "/",
  });
  const { data: store } = useStore();
  const [scope, setScope] = useState<Scope>("doctors");
  const [q, setQ] = useState(""), [city, setCity] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (scope === "doctors") { const p = new URLSearchParams(); if (city.trim()) p.set("city", city.trim()); if (t) p.set("q", t); window.location.href = portalUrl("find", `/doctors?${p}`); }
    else if (scope === "products") window.location.href = portalUrl("store", t ? `/shop?search=${encodeURIComponent(t)}` : "/shop");
    else window.location.href = portalUrl("study", "/study-hub");
  };
  const go = (p: Portal, path = "/") => portalUrl(p, path);

  return (
    <div className="hb" data-home="hub">
      {/* The five dashboards: full-screen, each with its own living background; one click opens that platform. */}
      <section className="hb-mosaic" data-home="platform" aria-label="Choose your Aethex">
        <h1 className="sr-only">Aethex: find doctors, the medical store, study, hospitals and medical colleges, with Cadus in every one</h1>
        <div className="hb-tiles">
          {TILES.map((t) => (
            <a key={t.id} href={go(t.id)} className={`hb-tile ${t.id}`} data-portal={t.id} aria-label={`${t.title}: ${t.text}`}>
              <div className="bg" aria-hidden="true">{t.art}</div>
              <div className="veil" aria-hidden="true" />
              <div className="txt">
                <span className="ic">{t.icon}</span>
                <small className="k">{t.kicker}</small>
                <b>{t.title}</b>
                <p>{t.text}</p>
                <em>{t.cta} <ArrowRight size={18} /></em>
              </div>
            </a>
          ))}
        </div>
        <a href={go("cadus")} className="hb-cadus-bar" data-portal="cadus">
          <span className="mk"><CadusMark size={22} variant="mono" color="currentColor" /></span>
          <b>Cadus is in every one of them.</b>
          <span>Clinical answers with sources, 320+ bedside tools, and study assistants, free to try.</span>
          <em>Open Cadus <ArrowRight size={16} /></em>
        </a>
      </section>

      <section className="hb-hero hb-searchband" data-home="search-band">
        <div className="ax-wrap">
          <h2>Find what you need in one search.</h2>
          <form className="hb-search" onSubmit={submit} role="search" data-home="search">
            <div className="scopes" role="tablist">
              {([["doctors", "Doctors", Stethoscope], ["products", "Products", Package], ["study", "Study", BookOpen]] as const).map(([id, label, I]) => (
                <button key={id} type="button" role="tab" aria-selected={scope === id} className={scope === id ? "on" : ""} onClick={() => setScope(id)}><I size={15} /> {label}</button>
              ))}
            </div>
            <div className="row">
              {scope === "doctors" && <label className="city"><MapPin size={18} /><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" /></label>}
              <label className="q"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" placeholder={scope === "doctors" ? "Search doctors, specialties, clinics" : scope === "products" ? "Search stethoscopes, BP monitors, books…" : "Subjects, topics and mock tests"} /></label>
              <button type="submit" className="hb-btn">Search</button>
            </div>
          </form>
          <ul className="hb-trust">
            <li><BadgeCheck size={16} /> Checked doctors</li>
            <li><ShieldCheck size={16} /> Genuine brands</li>
            <li><Truck size={16} /> Cash on delivery</li>
            <li><Sparkles size={16} /> Cadus free to try</li>
          </ul>
        </div>
      </section>

      <section className="hb-sec" data-home="concerns">
        <div className="ax-wrap">
          <div className="hb-head"><div><h2>Consult a doctor for any health concern</h2><p>Book a clinic visit or a video consult with a checked doctor.</p></div><a href={go("find", "/doctors")} className="hb-more">See all specialties <ArrowRight size={15} /></a></div>
          <div className="hb-concerns">
            {CONCERNS.slice(0, 10).map((c, i) => { const I = CONCERN_ICON[i] ?? Stethoscope; return <a key={c.label} href={go("find", `/doctors?specialty=${encodeURIComponent(c.specialty)}`)}><span className="ic"><I size={30} /></span><b>{c.label}</b><small>Consult now <ArrowRight size={12} /></small></a>; })}
          </div>
        </div>
      </section>

      <section className="hb-sec" data-home="doctors">
        <div className="ax-wrap hb-doc">
          <div className="txt">
            <small>For doctors</small>
            <h2>Everything for your practice, on Aethex.</h2>
            <p>List your clinic and take online bookings, ask Cadus at the bedside, equip your clinic from the store, and keep learning.</p>
            <div className="row">
              <a href={go("find", "/list-your-practice")} className="hb-btn"><UserPlus size={17} /> List your practice free</a>
              <a href={go("cadus")} className="hb-btn ghost">Try Cadus</a>
            </div>
          </div>
          <div className="tiles">
            <a href={go("find", "/practice")}><CalendarCheck size={22} /><b>Practice dashboard</b><small>Confirm and track appointments</small></a>
            <a href={go("find", "/list-your-practice")}><Video size={22} /><b>Video consults</b><small>Offer them with your own link</small></a>
            <a href={go("store", "/category/diagnostic-instruments")}><Stethoscope size={22} /><b>Clinic equipment</b><small>Diagnostic sets and monitors</small></a>
            <a href={go("study", "/tools")}><Calculator size={22} /><b>Clinical tools</b><small>Drug reference and calculators</small></a>
          </div>
        </div>
      </section>

      <section className="hb-sec" data-home="numbers">
        <div className="ax-wrap">
          <div className="hb-nums">
            <div><b>{store ? store.products.length : "500+"}</b><small>medical products</small></div>
            <div><b>{store ? store.brands.length : "19"}</b><small>verified brands</small></div>
            <div><b>320+</b><small>clinical tools in Cadus</small></div>
            <div><b>{SPECIALTIES.length}</b><small>specialties on Aethex Find</small></div>
          </div>
        </div>
      </section>

      <section className="hb-sec last" data-home="quotes">
        <div className="ax-wrap">
          <div className="hb-head"><div><h2>What doctors say</h2></div></div>
          <div className="hb-quotes">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name}>
                <div className="stars" aria-hidden="true">{Array.from({ length: 5 }, (_, k) => <Star key={k} size={14} fill="currentColor" />)}</div>
                <blockquote>"{t.quote}"</blockquote>
                <figcaption><span className="av">{t.initials}</span><span><b>{t.name}</b><small>{t.role}</small></span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
