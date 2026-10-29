/**
 * aethex.in (update 62): the front door to Aethex. A clean white launcher: the logo, one headline, and five cards,
 * one per platform (find., store., study., hospitals. and medicalcolleges.aethex.in), with the catalogue's own
 * product photos, three facts each and a button. A soft animated background, cards that rise in, photos that drift.
 * Cadus is inside every portal (and on the header button). Styles: src/site-hub.css (hb-*).
 */
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, Building2, CalendarCheck, Check, GraduationCap, Hospital, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Navbar";
import { useSeo } from "@/hooks/use-seo";
import { cadusUrl, loginUrl, mainUrl, portalUrl, type Portal } from "@/lib/host";
import { FREE_DELIVERY_FROM } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";

const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;

/** A living network of dots behind the page (light, slow, mouse-aware); off when motion is reduced. */
function Network() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, mx = -1e4, my = -1e4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = window.innerWidth < 760 ? 40 : 90;
    const dots = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00025, vy: (Math.random() - 0.5) * 0.00025, r: 1.2 + Math.random() * 2.2, t: Math.random() * 6.28 }));
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const onMove = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const onLeave = () => { mx = -1e4; my = -1e4; };
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy; d.t += 0.01;
        if (d.x < -0.02 || d.x > 1.02) d.vx *= -1;
        if (d.y < -0.02 || d.y > 1.02) d.vy *= -1;
      }
      const L = Math.min(w, h) * 0.16;
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i]!, ax = a.x * w, ay = a.y * h;
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j]!, bx = b.x * w, by = b.y * h, dx = ax - bx, dy = ay - by, dist = Math.hypot(dx, dy);
          if (dist < L) { ctx.strokeStyle = `rgba(37,99,235,${(1 - dist / L) * 0.16})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
        }
        const dm = Math.hypot(ax - mx, ay - my);
        if (dm < 160) { ctx.strokeStyle = `rgba(13,148,136,${(1 - dm / 160) * 0.35})`; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.stroke(); }
        const pulse = 0.6 + 0.4 * Math.sin(a.t + now / 900);
        ctx.fillStyle = i % 3 === 0 ? `rgba(13,148,136,${0.35 * pulse})` : `rgba(37,99,235,${0.3 * pulse})`;
        ctx.beginPath(); ctx.arc(ax, ay, a.r * (0.8 + 0.3 * pulse), 0, 6.28); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerleave", onLeave); };
  }, []);
  return <canvas ref={ref} className="hb-net" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ the living art inside each card's photo panel */
const FindArt = () => (
  <svg className="art map" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><pattern id="hbG" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="rgba(29,78,216,.12)" /></pattern></defs>
    <rect width="300" height="150" fill="url(#hbG)" />
    <path d="M-10 110 C 60 80, 110 130, 170 95 S 260 60, 310 80" fill="none" stroke="rgba(29,78,216,.25)" strokeWidth="4" strokeLinecap="round" />
    {[[40, 40], [250, 35], [60, 120], [230, 118]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><circle className="ring" r="6" fill="none" stroke="#2563eb" strokeWidth="1.5" style={{ animationDelay: `${i * 0.6}s` }} /><circle r="4" fill="#2563eb" stroke="#fff" strokeWidth="1.5" /></g>)}
  </svg>
);
const StoreArt = () => (
  <span className="art drift" aria-hidden="true">
    {["otoscope", "oximeter", "glucometer", "nebulizer"].map((n, i) => <img key={n} src={IMG(n)} alt="" loading="lazy" style={{ animationDelay: `${-i * 2}s` }} />)}
  </span>
);
const StudyArt = () => (
  <span className="art flip" aria-hidden="true">
    {["Drug of choice in absence seizures?", "Nerve injured in a humerus fracture?", "Commonest nephrotic syndrome in children?"].map((q, i) => <i key={q} style={{ animationDelay: `${i * 2.4}s` }}><small>NEET-PG</small>{q}</i>)}
  </span>
);
const HospitalArt = () => (
  <svg className="art ecg" viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true">
    <path className="trace" d="M0 75 H60 L70 55 L80 95 L90 75 H140 L150 20 L160 130 L170 75 H220 L230 60 L240 90 L250 75 H300" fill="none" stroke="#0e7490" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
const CollegeArt = () => (
  <svg className="art helix" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {Array.from({ length: 11 }, (_, i) => { const x = 15 + i * 27, y1 = 75 + Math.sin(i * 0.9) * 42, y2 = 75 - Math.sin(i * 0.9) * 42; return <g key={i} className="rung" style={{ animationDelay: `${i * 0.2}s` }}><line x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(180,83,9,.35)" strokeWidth="2" /><circle cx={x} cy={y1} r="4" fill="#f59e0b" /><circle cx={x} cy={y2} r="4" fill="#b45309" /></g>; })}
  </svg>
);
const ART: Record<string, ReactNode> = { doctors: <FindArt />, store: <StoreArt />, study: <StudyArt />, hospitals: <HospitalArt />, medicalcolleges: <CollegeArt /> };



const CARDS: { id: Portal; tone: string; icon: ReactNode; photo: string; title: string; who: string; points: string[]; cta: string }[] = [
  { id: "doctors", tone: "blue", icon: <CalendarCheck size={20} />, photo: "stethoscope", title: "Find a doctor", who: "For patients", points: ["Search by city and specialty", "Clinic visit or video consult", "Every registration checked"], cta: "Book now" },
  { id: "store", tone: "teal", icon: <ShoppingBag size={20} />, photo: "bp-monitor", title: "Medical store", who: "For everyone", points: ["Genuine, verified brands", "Cash on delivery across India", `Free delivery from ${formatINR(FREE_DELIVERY_FROM)}`], cta: "Shop now" },
  { id: "study", tone: "violet", icon: <GraduationCap size={20} />, photo: "test-books", title: "Study", who: "For students", points: ["NEET-PG preparation", "Mock tests and flashcards", "Every subject, every exam"], cta: "Start studying" },
  { id: "hospitals", tone: "cyan", icon: <Hospital size={20} />, photo: "ecg", title: "Hospitals", who: "For institutions", points: ["ICU, emergency and furniture", "One list, one quotation", "Bank transfer or purchase order"], cta: "Get a quotation" },
  { id: "medicalcolleges", tone: "amber", icon: <Building2 size={20} />, photo: "surgical-set", title: "Medical colleges", who: "For institutions", points: ["Skills labs and manikins", "Anatomy models and lab equipment", "Textbooks for every course"], cta: "Equip your college" },
];

export default function Hub() {
  useSeo({
    title: "Aethex: find doctors, medical supplies, study and Cadus clinical AI, in one place",
    description: "Aethex for India's patients, doctors, students, hospitals and medical colleges: book doctors, shop genuine medical supplies, prepare for NEET-PG and ask Cadus. One account, five platforms.",
    path: "/",
  });
  const year = new Date().getFullYear();
  return (
    <div className="hb" data-home="hub">
      <div className="hb-bg" aria-hidden="true"><i /><i /><i /><Network /><svg className="pulse" viewBox="0 0 1600 120" preserveAspectRatio="none"><path d="M0 60 H520 L540 20 L560 100 L580 60 H1040 L1060 30 L1080 90 L1100 60 H1600" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>

      <header className="hb-top">
        <Logo />
        <nav aria-label="Account">
          <a href={loginUrl("/")}>Sign in</a>
          <a href={cadusUrl("/")} className="p" data-home="cta-cadus"><Sparkles size={15} /> Try Cadus free</a>
        </nav>
      </header>

      <section className="hb-intro" data-home="platform">
        <span className="hb-badge">One account · Five platforms</span>
        <h1>Everything medical, in one place.</h1>
        <p>Choose the platform you need. Cadus, the clinical assistant, is inside every one.</p>
      </section>

      <section className="hb-cards" aria-label="Aethex platforms">
        {CARDS.map((c, i) => (
          <a key={c.id} href={portalUrl(c.id)} className={`hb-card ${c.tone}`} data-portal={c.id} style={{ animationDelay: `${0.12 + i * 0.09}s` }}>
            <span className="ph">{ART[c.id]}<img src={IMG(c.photo)} alt="" loading="eager" decoding="async" style={{ animationDelay: `${-i * 1.7}s` }} /></span>
            <span className="ic">{c.icon}</span>
            <b>{c.title}</b>
            <small>{c.who}</small>
            <ul>{c.points.map((p) => <li key={p}><Check size={14} /> {p}</li>)}</ul>
            <em>{c.cta} <ArrowRight size={15} /></em>
          </a>
        ))}
      </section>

      <footer className="hb-foot">
        <span><ShieldCheck size={14} /> © {year} Clavix Technologies Private Limited · Made in India for medical professionals</span>
        <nav aria-label="Legal"><a href={mainUrl("/privacy-policy")}>Privacy</a><a href={mainUrl("/terms-of-service")}>Terms</a><a href={mainUrl("/contact")}>Contact</a></nav>
      </footer>
    </div>
  );
}
