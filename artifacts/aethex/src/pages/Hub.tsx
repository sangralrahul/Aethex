/**
 * aethex.in (update 58): the front door to Aethex, in the style of Practo: one search, then the six portals:
 * Cadus (cadus.aethex.in), the Store (store.aethex.in), Study (study.aethex.in), Find a doctor (find.aethex.in),
 * Hospitals (hospitals.aethex.in) and Medical colleges (medicalcolleges.aethex.in). Styles: src/site-hub.css (hb-*).
 */
import { useState, type ComponentType, type FormEvent } from "react";
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

const PORTALS: { id: Portal; icon: Icon | "cadus"; tone: string; title: string; text: string; host: string; points: string[]; cta: string }[] = [
  { id: "cadus", icon: "cadus", tone: "ink", title: "Cadus", text: "Clinical answers you can check, with sources, and 320+ bedside tools.", host: "cadus.aethex.in", points: ["Doses and interactions", "Safety-reviewed answers", "Cadus Crew for exams"], cta: "Open Cadus" },
  { id: "find", icon: CalendarCheck, tone: "sky", title: "Find a doctor", text: "Search doctors by city and specialty and book a clinic visit or video consult.", host: "find.aethex.in", points: ["Checked registrations", "Free slots only", "Doctors list free"], cta: "Find a doctor" },
  { id: "store", icon: ShoppingBag, tone: "teal", title: "Medical store", text: "Genuine instruments, monitors and supplies from verified brands.", host: "store.aethex.in", points: ["Cash on delivery", `Free delivery from ${formatINR(FREE_DELIVERY_FROM)}`, "Medical books"], cta: "Shop now" },
  { id: "study", icon: GraduationCap, tone: "violet", title: "Study", text: "NEET-PG preparation, mock tests, flashcards and a knowledge hub for every subject.", host: "study.aethex.in", points: ["Timed mock tests", "Case of the day", "Every subject"], cta: "Start studying" },
  { id: "hospitals", icon: Hospital, tone: "navy", title: "For hospitals", text: "Furniture, ICU, emergency and diagnostic equipment: one list, one quotation.", host: "hospitals.aethex.in", points: ["Bank transfer or PO", "Every ward", "Delivered across India"], cta: "Get a quotation" },
  { id: "medicalcolleges", icon: Building2, tone: "amber", title: "For medical colleges", text: "Skills trainers, manikins, anatomy models, lab equipment and books.", host: "medicalcolleges.aethex.in", points: ["Skills labs", "Anatomy and labs", "One quotation"], cta: "Equip your college" },
];
const CONCERN_ICON = [Thermometer, Baby, Flower2, Sparkles, Smile, Bone, Ear, Eye, HeartPulse, Brain];
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
      <section className="hb-hero" data-home="platform">
        <div className="ax-wrap">
          <h1>Your home for health, medicine and medical learning.</h1>
          <p className="sub">Book doctors. Buy genuine medical supplies. Ask clinical questions. Prepare for NEET-PG. All with one Aethex account.</p>
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

      <section className="hb-sec hb-portals-sec" data-home="portals">
        <div className="ax-wrap">
          <div className="hb-portals">
            {PORTALS.map((p) => {
              const I = p.icon;
              return (
                <a key={p.id} href={go(p.id)} className={`hb-portal ${p.tone}`} data-portal={p.id}>
                  <span className="art">{I === "cadus" ? <CadusMark size={34} variant="mono" color="currentColor" /> : <I size={32} />}</span>
                  <b>{p.title}</b>
                  <small className="host">{p.host}</small>
                  <p>{p.text}</p>
                  <ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
                  <em>{p.cta} <ArrowRight size={15} /></em>
                </a>
              );
            })}
          </div>
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
