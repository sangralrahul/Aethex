/**
 * aethex.in (update 59): the front door to Aethex: five full-screen dashboards, each with its own living background,
 * one click into that platform (find., store., study., hospitals. and medicalcolleges.aethex.in), a Cadus bar, and the
 * footer. Nothing else. Styles: src/site-hub.css (hb-*).
 */
import type { ReactNode } from "react";
import { ArrowRight, Building2, CalendarCheck, GraduationCap, Hospital, ShoppingBag } from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { useSeo } from "@/hooks/use-seo";
import { portalUrl, type Portal } from "@/lib/host";


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
    <Float n="test-books" x={66} y={48} w={150} d={12} />
    <svg className="pring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="10" /><circle className="prog" cx="60" cy="60" r="50" fill="none" stroke="#c4b5fd" strokeWidth="10" strokeLinecap="round" strokeDasharray="314" /></svg>
  </>
);
const HospitalArt = () => (
  <>
    <svg className="ecg" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
      <path className="trace" d="M0 100 H120 L140 60 L160 140 L180 100 H300 L315 20 L330 180 L345 100 H470 L490 70 L510 130 L525 100 H650 L665 30 L680 170 L695 100 H800" fill="none" stroke="#5eead4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
    <Float n="ecg" x={34} y={8} w={140} d={13} />
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

export default function Hub() {
  useSeo({
    title: "Aethex: find doctors, medical supplies, Cadus clinical AI and NEET-PG study, in one place",
    description: "Aethex for India's doctors, patients and medical students: book doctors, shop genuine medical supplies, ask Cadus clinical questions and prepare for NEET-PG.",
    path: "/",
  });
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

    </div>
  );
}
