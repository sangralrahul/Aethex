/**
 * The Cadus desktop download page: downloads.aethex.in, and /downloads on
 * aethex.in and cadus.aethex.in. In the style of the AETHEX download page
 * (hms.aethex.in): light, Inter, deep teal, a DNA helix behind the hero, a
 * live Cadus window, a scrolling row of tools and one download card with
 * platform tabs. Windows (x64 and ARM) and Linux; macOS coming soon.
 *
 * The installers are served from Cloudflare R2 through the Worker at
 * downloads.aethex.in/cadus/<version>/; the list comes from
 * lib/downloads/release.json, written by desktop/scripts/manifest.mjs.
 * Everything stays still with "reduce motion" on.
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AppWindow, ArrowRight, BookOpen, Check, Copy, Download, LockKeyhole, Mic, Monitor, Plus, RefreshCw, Search,
  ShieldCheck, UserRound, WifiOff, X, BellRing, Pill, ShieldPlus, Users2, Keyboard, Power, PanelBottom,
  Activity, Volume2, MicVocal, FilePen, CalendarHeart, ScrollText, ListOrdered, AudioWaveform,
} from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import LiveFx, { FX_CSS, fxFor, type FxKind } from "@/components/downloads/LiveFx";
import { FONT_FACES } from "@/components/cadus/cadus-styles";
import { LEGAL_PATH, SUPPORT_EMAIL } from "@/lib/cadus/legal";
import { cadusUrl, isCadusHost } from "@/lib/host";
import RELEASE from "@/lib/downloads/release.json";
import { CALCULATORS } from "@/lib/cadus/calculators";

type FileEntry = (typeof RELEASE.files)[number];
type Os = "windows" | "mac" | "linux" | "mobile" | "unknown";
type Tab = "windows" | "mac" | "linux";
type Detected = { os: Os; arch: "x64" | "arm64" | "unknown" };

const byId = (id: string) => RELEASE.files.find((f) => f.id === id) as FileEntry;
const mb = (n: number) => `${(n / 1048576).toFixed(0)} MB`;
const releasedOn = new Date(`${RELEASE.released}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const MAC_MAIL = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Tell me when Cadus for Mac is ready")}&body=${encodeURIComponent("Please email me when the Cadus app for macOS is available.\n\nMy Mac: Apple silicon / Intel (delete one)")}`;

/** The visitor's system, from Client Hints where the browser offers them (that is how Windows on ARM shows up). */
async function detect(): Promise<Detected> {
  const ua = navigator.userAgent;
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string; mobile?: boolean; getHighEntropyValues?: (h: string[]) => Promise<{ architecture?: string; bitness?: string; platform?: string }> } }).userAgentData;
  if (uaData?.mobile || /Android|iPhone|iPad|iPod/i.test(ua)) return { os: "mobile", arch: "unknown" };
  let os: Os = /Windows/i.test(ua) ? "windows" : /Mac OS X|Macintosh/i.test(ua) ? "mac" : /Linux|X11/i.test(ua) ? "linux" : "unknown";
  let arch: Detected["arch"] = /arm64|aarch64/i.test(ua) ? "arm64" : os === "unknown" ? "unknown" : "x64";
  try {
    const h = await uaData?.getHighEntropyValues?.(["architecture", "bitness", "platform"]);
    if (h?.platform === "Windows") os = "windows";
    if (h?.platform === "macOS") os = "mac";
    if (h?.architecture === "arm") arch = "arm64";
    if (h?.architecture === "x86" && h.bitness === "64") arch = "x64";
  } catch { /* not offered */ }
  return { os, arch };
}

/* ------------------------------------------------------------------ motion */

/** Sections rise in gently as they scroll into view. */
function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const items = Array.from(root.current?.querySelectorAll<HTMLElement>(".rv") ?? []);
    if (still() || typeof IntersectionObserver === "undefined") { items.forEach((i) => i.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    items.forEach((i) => io.observe(i));
    // The live card backgrounds run only while their section is on screen.
    const live = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("live", e.isIntersecting)), { threshold: 0 });
    root.current?.querySelectorAll<HTMLElement>("#product, #new").forEach((sec) => live.observe(sec));
    return () => { io.disconnect(); live.disconnect(); };
  }, [root]);
}

/** A slowly turning double helix of dots behind the hero. */
function Helix() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0, t = 0, visible = true;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2, amp = Math.min(130, h * 0.36), k = (Math.PI * 2) / 620, step = 20;
      for (let x = -20; x < w + 20; x += step) {
        const p = x * k + t;
        const y1 = mid + Math.sin(p) * amp, y2 = mid - Math.sin(p) * amp;
        const z = Math.cos(p); // depth: which strand is in front
        ctx.strokeStyle = "rgba(43,122,111,.08)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        for (const [y, front, col] of [[y1, z, "43,122,111"], [y2, -z, "99,117,224"]] as const) {
          const r = 2.2 + (front + 1) * 1.6;
          ctx.fillStyle = `rgba(${col},${0.18 + (front + 1) * 0.28})`;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          if (front > 0.55) { ctx.fillStyle = `rgba(${col},.10)`; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill(); }
        }
      }
      for (const [sign, col] of [[1, "43,122,111"], [-1, "99,117,224"]] as const) {
        ctx.strokeStyle = `rgba(${col},.32)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let x = -20; x < w + 20; x += 6) { const y = mid + sign * Math.sin(x * k + t) * amp; if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
    };
    const loop = () => { if (visible) { t += 0.006; draw(); } raf = requestAnimationFrame(loop); };
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
    io?.observe(c);
    if (still()) draw(); else loop();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); io?.disconnect(); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas className="helix" ref={ref} aria-hidden="true" />;
}

/** A number that counts up once it is on screen. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || still() || typeof IntersectionObserver === "undefined") return;
    setV(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => { const p = Math.min(1, (now - t0) / 1300); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{v.toLocaleString("en-IN")}</span>;
}

/* ------------------------------------------------------------------ the live Cadus window */

const DEMOS = [
  {
    title: "Febrile neutropenia, first hour",
    q: "54-year-old on chemotherapy with a temperature of 38.6 °C. What do I do in the first hour?",
    bottom: "Treat as febrile neutropenia: take cultures and start empirical broad-spectrum IV antibiotics within 60 minutes.",
    points: ["Blood cultures before the first dose, but never delay antibiotics for them", "Screen for sepsis: lactate, blood pressure, urine output", "Choose the antibiotic by local policy and allergy history"],
  },
  {
    title: "Croup with stridor at rest",
    q: "3-year-old with croup and stridor at rest. What now?",
    bottom: "Moderate to severe croup: give oral dexamethasone now, and nebulised adrenaline for stridor at rest.",
    points: ["Keep the child calm, on a parent's lap", "Observe for 2 to 4 hours after adrenaline", "Escalate if stridor persists or saturation falls"],
  },
  {
    title: "Warfarin and clarithromycin",
    q: "Is it safe to give clarithromycin to a patient on warfarin?",
    bottom: "A significant interaction: clarithromycin raises the INR and the risk of bleeding.",
    points: ["Prefer another antibiotic if one is suitable", "If it is used, check the INR within 3 to 5 days", "Tell the patient which bleeding signs to watch for"],
  },
];
type Phase = "typing" | "thinking" | "answering" | "done";

function LiveWindow() {
  const calm = still();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(calm ? "done" : "typing");
  const [typed, setTyped] = useState(calm ? DEMOS[0].q.length : 0);
  const [words, setWords] = useState(calm ? 999 : 0);
  const demo = DEMOS[i];
  const all = useMemo(() => [demo.bottom, ...demo.points].join(" \u0000 ").split(" "), [demo]);
  useEffect(() => {
    if (calm) return;
    let t: number;
    if (phase === "typing") t = typed < demo.q.length ? window.setTimeout(() => setTyped(typed + 1), 24 + Math.random() * 34) : window.setTimeout(() => setPhase("thinking"), 420);
    else if (phase === "thinking") t = window.setTimeout(() => setPhase("answering"), 1600);
    else if (phase === "answering") t = words < all.length ? window.setTimeout(() => setWords(words + 1), 42) : window.setTimeout(() => setPhase("done"), 200);
    else t = window.setTimeout(() => { setI((i + 1) % DEMOS.length); setTyped(0); setWords(0); setPhase("typing"); }, 4600);
    return () => window.clearTimeout(t);
  }, [calm, phase, typed, words, demo, all.length, i]);
  const shown = all.slice(0, words).join(" ").split(" \u0000 ");
  const answering = phase === "answering" || phase === "done";

  return (
    <div className="shot" aria-hidden="true">
      <div className="win">
        <div className="win-bar"><i /><i /><i /><span>Cadus · {demo.title}</span></div>
        <div className="app">
          <aside className="app-side">
            <div className="app-brand"><span className="tile sm"><CadusMark size={13} variant="mono" color="currentColor" /></span> Cadus</div>
            <span className="app-new"><Plus size={12} /> New chat</span>
            <span className="app-search"><Search size={11} /> Search chats</span>
            <small>Today</small>
            {DEMOS.map((d, k) => <span key={d.title} className={`app-chat ${k === i ? "on" : ""}`}>{d.title}</span>)}
            <small>Tools</small>
            {["Today", "Cadus Crew", "Rx Safety Check", "Clinical Pathways"].map((t) => <span key={t} className="app-chat">{t}</span>)}
            <div className="app-user"><span>RS</span><div><b>Dr Rahul</b><em>Cadus Medius 3.1</em></div></div>
          </aside>
          <div className="app-main">
            <div className="app-top"><b>{demo.title}</b><span className="model">Cadus Medius 3.1</span></div>
            <div className="app-chatbox">
              {phase !== "typing" && <div className="msg-q" key={`q${i}`}>{demo.q}</div>}
              {phase === "thinking" && <div className="msg-think"><span className="dots"><i /><i /><i /></span> Checking guidelines and sources…</div>}
              {answering && (
                <div className="msg-a" key={`a${i}`}>
                  <span className="lab">Bottom line</span>
                  <p>{shown[0]}{phase === "answering" && shown.length === 1 && <span className="caret" />}</p>
                  {shown.length > 1 && <ul>{shown.slice(1).map((p, k) => <li key={k}>{p}{phase === "answering" && k === shown.length - 2 && <span className="caret" />}</li>)}</ul>}
                  {phase === "done" && <div className="chips"><span className="ok"><ShieldCheck size={11} /> Safety reviewed</span><span><BookOpen size={11} /> 3 sources</span></div>}
                </div>
              )}
            </div>
            <div className={`app-input ${phase === "typing" ? "live" : ""}`}>
              <span>{phase === "typing" ? <>{demo.q.slice(0, typed)}<span className="caret" /></> : "Ask a clinical question or describe a case…"}</span>
              <i><ArrowRight size={13} /></i>
            </div>
          </div>
        </div>
      </div>
      <div className="float f1">
        <span className="ic"><ShieldCheck size={16} /></span>
        <div><b>Safety review</b><small>Doses and red flags checked</small><span className={`bar ${phase === "done" ? "full" : phase === "answering" ? "half" : ""}`}><i /></span></div>
      </div>
      <div className="float f2">
        <div className="f2-top"><b>Sources</b><span className="live"><i /> Cited</span></div>
        <div className="src"><span>1</span> National treatment guideline</div>
        <div className="src"><span>2</span> Society practice statement</div>
        <div className="src"><span>3</span> Cadus Medical Library</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ download rows */

function FileRow({ f, title, sub, recommended }: { f: FileEntry; title: string; sub: string; recommended?: boolean }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(f.sha256).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }); };
  const ext = f.file.slice(f.file.lastIndexOf("."));
  return (
    <div className={`dl-file ${recommended ? "rec" : ""}`} data-file={f.id}>
      <div className="dl-file-main">
        <span className="os-tile">{f.os === "windows" ? <WindowsLogo /> : <LinuxLogo />}</span>
        <div className="dl-file-name">
          <b>{title} {recommended && <em className="badge">Recommended</em>}</b>
          <small>{sub} · <button type="button" className="dl-link" onClick={() => setShown(!shown)} aria-expanded={shown}>SHA-256</button></small>
        </div>
        <span className="tags"><i>{f.arch === "arm64" ? "ARM64" : "x64"}</i><i>{ext}</i></span>
        <span className="size">{mb(f.size)}</span>
        <a className={`cx-btn ${recommended ? "primary" : ""}`} href={f.url} download={f.file} rel="noopener"><Download size={16} /> Download</a>
      </div>
      {shown && (
        <div className="dl-hash">
          <code>{f.sha256}</code>
          <button type="button" className="cx-ib" onClick={copy} aria-label="Copy SHA-256">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
        </div>
      )}
    </div>
  );
}

const TOOLS: [string, string][] = [
  ["Clinical answers", "t"], ["Dose cards", "t"], ["Drug interactions", "r"], ["Rx Safety Check", "r"], ["Med Reconciliation", "r"],
  ["Lab interpretation", "t"], ["Report Explainer", "t"], ["Compare over time", "v"], ["Radiology reads", "v"], ["Clinical Pathways", "t"],
  ["Clinical calculators", "t"], ["Emergency", "r"], ["Paediatrics", "v"], ["Ward list", "t"], ["Consult Translator", "v"],
  ["Cadus Crew", "y"], ["Crew Huddle", "y"], ["Crew Debate", "y"], ["Crew Playbooks", "y"], ["Deep Dive research", "v"], ["Guideline Watch", "v"], ["Case Simulator", "y"],
  ["Presentation Coach", "y"], ["Flashcards", "y"], ["Exam practice", "y"], ["Patient leaflets", "t"], ["Offline library", "y"],
  ["Voice typing", "v"], ["Natural voices", "y"], ["Revision Podcasts", "y"], ["Discharge Summary", "t"], ["Shift Handover", "r"], ["Differential Builder", "v"], ["Study Planner", "y"],
  ["ECG Reader", "r"], ["Antibiotic Guide", "t"], ["Procedure Guide", "v"], ["Poisoning & Snakebite", "r"], ["Infusions", "t"],
  ["ABG Interpreter", "v"], ["Dose Converter", "t"], ["PG Logbook", "y"], ["Follow-ups", "y"],
  ["Voice Viva", "y"], ["Voice OSCE", "y"], ["Your own voice", "v"], ["Patient Audio Library", "t"],
  ["Prescription Writer", "t"], ["Lab Trends", "v"], ["Daily Clinical Case", "y"], ["Letters & Certificates", "r"], ["ADR Report", "r"], ["Cause of Death (MCCD)", "v"], ["Mnemonic Maker", "y"], ["Generic Finder", "t"],
  ["OPD Queue", "t"], ["Clinical Image Quiz", "y"], ["Dose Card by Weight", "r"], ["Mock Tests", "y"], ["On-call Helper", "r"], ["Journal Club", "v"], ["Statistics Test Chooser", "v"], ["Duty Roster", "t"],
  ["Patient Records", "t"], ["Ward Rounds by Voice", "v"], ["Revision Notes", "y"], ["Clinic Analytics", "v"], ["Pre-op Assessment", "r"], ["Patient Messages", "t"], ["Pregnancy & Breastfeeding", "r"], ["Pill Chart", "y"],
  ["Vaccination Scheduler", "t"], ["Diet Chart Maker", "y"], ["ICD-10 Coder", "v"], ["Consent Form Writer", "r"], ["Insulin Planner", "t"], ["Blood Transfusion", "r"], ["MLC Injury Report", "v"], ["TB Treatment (NTEP)", "t"],
  ["Antenatal Care Tracker", "r"], ["Ventilator Helper", "v"], ["Teleconsultation Note", "t"], ["Clinic Bills & Receipts", "y"], ["Animal Bite (Rabies PEP)", "r"], ["Needle-stick Injury", "v"], ["IMNCI Sick Child", "t"], ["CME Credits", "y"],
  ["Appointments", "t"], ["Pharmacy Stock & Expiry", "y"], ["Mental Health Screening", "v"], ["Kidney Dose Adjuster", "r"], ["Malnutrition (SAM) Helper", "t"], ["Referral Contacts", "y"], ["Clinic Accounts", "v"], ["Thyroid Dose Helper", "r"],
  ["Backup & Restore", "t"], ["BP & Sugar Protocols", "r"], ["Anaemia & Iron", "r"], ["Dengue Helper", "y"], ["Electrolyte Replacement", "v"], ["Obstetric Emergencies", "r"], ["Infection Control & Waste", "t"],
  ["Asthma & COPD Plans", "v"], ["Developmental Milestones", "y"], ["Contraception Advisor", "r"], ["Palliative Care Helper", "r"], ["Imaging Decision Rules", "v"], ["IV Fluids Planner", "t"], ["Sick-Day Rules", "y"], ["Lab Reference Ranges", "t"],
  ["Burns Helper", "r"], ["Neonatal Jaundice", "y"], ["Stroke & Thrombolysis", "v"], ["Sepsis & DKA Bundles", "r"], ["Alcohol Withdrawal", "v"], ["Diabetic Foot", "t"], ["Heat Illness", "y"], ["Wound & Suture Care", "t"],
  ["Warfarin & Anticoagulation", "r"], ["Tropical Fevers", "y"], ["Elderly Care", "t"], ["Quit Smoking Helper", "v"], ["Croup & Child Asthma", "t"], ["Rheumatic Fever", "r"], ["Weight Management", "y"], ["Hypoglycaemia", "v"],
  ["Gestational Diabetes", "r"], ["Infant Feeding", "y"], ["Antidepressant Switcher", "v"], ["Eye & ENT Triage", "t"], ["VTE Prophylaxis", "r"], ["Headache & Migraine", "v"], ["Skin Infections", "y"], ["Gout & Uric Acid", "t"],
  ["Pneumonia & UTI Antibiotics", "r"], ["CKD Care", "t"], ["Preterm Labour", "r"], ["Epilepsy & First Seizure", "v"], ["Fever in Under-5s", "y"], ["Cirrhosis & Ascites", "t"], ["Dementia & Memory", "v"], ["Hypertensive Emergency", "r"],
  ["Upper GI Bleed & H. pylori", "r"], ["Acute Kidney Injury", "t"], ["Hepatitis B & C", "y"], ["Newborn Resuscitation", "r"], ["Pain Relief Planner", "v"], ["Osteoporosis & Bone Health", "t"], ["Menopause & HRT", "v"], ["Syncope", "y"],
  ["Heart Failure GDMT", "r"], ["Atrial Fibrillation", "v"], ["Lipids & CV Risk", "y"], ["PE & DVT", "t"], ["HIV Care", "r"], ["Pre-eclampsia", "r"], ["Insomnia & Sleep", "v"], ["Urticaria & Angioedema", "y"],
  ["Anaphylaxis & Allergy Plan", "r"], ["Trauma Primary Survey", "r"], ["Toxicology", "y"], ["Pneumothorax & Chest Drain", "t"], ["Body Fluid Analysis", "v"], ["Adrenal Crisis & Steroid Cover", "v"], ["Refeeding & Nutrition", "y"], ["Back Pain & Cauda Equina", "t"],
  ["Chest Pain & ACS", "r"], ["Child Fluids & Dehydration", "t"], ["Agitation & Rapid Tranquillisation", "y"], ["Suicide Risk & Safety Plan", "v"], ["Head Injury & CT Rules", "v"], ["Acute Abdomen & Appendicitis", "t"], ["Febrile Neutropenia", "y"], ["Meningitis & Encephalitis", "r"],
  ["Status Epilepticus", "r"], ["Hyponatraemia & Sodium", "t"], ["Asthma & COPD Attack", "t"], ["Pre-op Risk & Anticoagulant Bridging", "v"], ["Oncology Emergencies", "y"], ["Spirometry Interpreter", "t"], ["Thyroid Storm & Myxoedema Coma", "v"], ["Sickle Cell & Thalassaemia", "r"],
  ["Hyperkalaemia & ECG", "r"], ["Acute Pancreatitis Plan", "y"], ["Paediatric Sepsis & Shock", "r"], ["Upper Airway & Stridor", "v"], ["Rhabdomyolysis & CK", "y"], ["Hypothermia & Drowning", "t"], ["Paediatric DKA", "v"], ["Acute Urinary Retention", "t"],
  ["Hypertension in Pregnancy & Postpartum", "r"], ["Kidney Stones & Colic", "t"], ["Children's Antibiotics by Weight", "y"], ["Opioid Conversion & Palliative Infusions", "v"], ["Cellulitis & Necrotising Fasciitis", "r"], ["Kawasaki Disease", "y"], ["Infective Endocarditis", "v"], ["Bell's Palsy & Facial Weakness", "t"],
  ["Postpartum Haemorrhage", "r"], ["Neonatal Sepsis & Antibiotics", "v"], ["Antibiotic Renal Dosing", "t"], ["Brain-stem Death & Organ Donation", "v"], ["Septic Arthritis & Hot Joint", "y"], ["Neonatal Hypoglycaemia", "y"], ["Altitude Illness", "t"], ["Serotonin Syndrome vs NMS", "r"],
  ["Acute Asthma in Children", "t"], ["DKA & HHS Adult Timer", "r"], ["Antenatal Steroids & Tocolysis", "v"], ["Iron, B12 & Folate Replacement", "y"], ["Therapeutic Drug Levels", "t"], ["Contrast Safety", "v"], ["Pressure Injuries", "y"], ["Hyperemesis Gravidarum", "r"],
  ["Bronchiolitis in Infants", "t"], ["Ectopic & Early Pregnancy Bleeding", "r"], ["Febrile Seizures", "y"], ["Testicular Torsion & Scrotal Pain", "r"], ["Myasthenic Crisis & GBS", "v"], ["Hypercalcaemia", "y"], ["Deprescribing (STOPP/START)", "t"], ["Acute Limb Ischaemia", "r"],
  ["Delirium & 4AT", "v"], ["Childhood Rashes", "y"], ["Sore Throat & Ear Infection", "t"], ["Falls & Hip Fracture", "v"],
  ["Vertigo & HINTS", "t"], ["Acute Pulmonary Oedema", "r"], ["Arrhythmias (ACLS)", "y"], ["Scorpion Sting", "r"], ["Pericarditis & Myocarditis", "v"], ["PCOS", "v"], ["Postnatal Depression (EPDS)", "t"], ["Red Eye & Acute Glaucoma", "r"],
  ["Cholecystitis & Cholangitis", "y"], ["Thyroid Nodule (TI-RADS)", "t"], ["VTE Risk in Pregnancy", "v"], ["Nephrotic Syndrome in Children", "y"],
  ["Leprosy (MDT)", "y"], ["Tinea & Dermatophytosis", "t"], ["Acne Treatment Ladder", "r"], ["Tetanus", "v"], ["Cervical Cancer Screening", "v"], ["WHO Labour Care Guide", "t"], ["DMARD Monitoring", "y"], ["Tumour Lysis Syndrome", "r"],
  ["BPH & LUTS (IPSS)", "t"], ["Haemorrhoids & Anal Fissure", "y"], ["Psoriasis", "v"], ["Acute Viral Hepatitis (A & E)", "r"],
  ["Lung Nodule (Fleischner)", "t"], ["ITP (Immune Thrombocytopenia)", "r"], ["Parkinson's Disease Medicines", "v"], ["Breast Lump & Screening", "r"], ["Constipation & Enuresis (Children)", "y"], ["ADHD in Children", "v"], ["Infertility Work-up", "t"], ["Knee & Hip Osteoarthritis", "y"],
  ["Allergic Rhinitis & Sinusitis", "t"], ["GERD & Heartburn", "r"], ["Shoulder Pain", "y"], ["Carpal Tunnel Syndrome", "v"],
  ["Chronic Cough", "s"], ["Haematuria Work-up", "r"], ["Abnormal LFTs", "y"], ["Lymphadenopathy", "v"],
  ["Abnormal Uterine Bleeding", "t"], ["Amenorrhoea", "s"], ["Vaginal Discharge & STI", "r"], ["UTI in Children", "y"],
  ["High Blood Counts", "v"], ["Peripheral Arterial Disease (ABPI)", "t"], ["Hair Loss (Alopecia)", "s"], ["Vitiligo", "r"],
  ["Chronic Diarrhoea & IBS", "y"], ["Sleep Apnoea (STOP-BANG)", "v"], ["Unexplained Weight Loss", "t"], ["Polyuria & Diabetes Insipidus", "s"],
  ["Short Stature & Growth", "r"], ["Urinary Incontinence (Women)", "y"], ["Dysmenorrhoea & Endometriosis", "v"], ["Hernia & Undescended Testis", "t"],
  ["Restless Legs Syndrome", "s"], ["Raynaud's Phenomenon", "r"], ["Scabies & Head Lice", "y"], ["Peripheral Neuropathy", "v"],
];

/**
 * What's new in Cadus: the ten biggest additions, each standing for a group of tools, so the page
 * stays short. The full list of tools is in the app.
 */
const NEW_IN_CADUS: { icon: typeof Pill; t: string; d: string; fx: FxKind }[] = [
  { icon: ListOrdered, fx: "queue", t: "Your OPD, organised", d: "Appointments, the token queue, a record for every patient, receipts, stock and the month's accounts." },
  { icon: FilePen, fx: "write", t: "Prescriptions in seconds", d: "Doses for age, weight and kidneys, interactions checked, advice and diet charts in the patient's language." },
  { icon: AudioWaveform, fx: "mic", t: "Ward rounds by voice", d: "Dictate at each bed; progress notes, handover and discharge summaries are written for you." },
  { icon: Activity, fx: "pulse", t: "Reads ECGs and reports", d: "Photograph an ECG or a lab report: a systematic read, trends charted, urgent findings flagged." },
  { icon: ScrollText, fx: "envelope", t: "Letters and forms done", d: "Referrals, bilingual consent forms, MLC injury reports, ICD-10 codes, PM-JAY pre-auth and the MCCD." },
  { icon: ShieldPlus, fx: "shield", t: "Safer at the bedside", d: "Rx safety check, ventilator and insulin plans, transfusion, rabies and needle-stick PEP, poisoning guides." },
  { icon: Volume2, fx: "wave", t: "Natural voices, 13 languages", d: "Hands-free voice mode, audio advice for patients on WhatsApp, podcasts, even your own voice." },
  { icon: Users2, fx: "orbit", t: "Cadus Crew", d: "Specialist assistants that consult, debate a hard case and work together; build your own." },
  { icon: CalendarHeart, fx: "calendar", t: "Learn a little every day", d: "A daily clinical case, revision notes on a schedule, flashcards and NEET-PG style mocks." },
  { icon: MicVocal, fx: "chat", t: "Practise like the real exam", d: "Voice viva and OSCE with a patient who answers back, a case simulator and a presentation coach." },
];

/** New in the desktop app itself: these need the new installer. */
const NEW_IN_APP = [
  { icon: ListOrdered, t: "Clinic tools menu", d: "New in 1.0.3: OPD Queue, Prescription Writer, Patient Records, Vaccination Scheduler, ICD-10 Coder and Emergencies, straight from the tray or the File menu." },
  { icon: Keyboard, t: "Quick-open shortcut", d: "Press Ctrl+Shift+Space in any app, even mid-note in the hospital system, and Cadus comes up with a new chat, ready to type." },
  { icon: PanelBottom, t: "Tray icon", d: "Close the window and Cadus waits in the tray: New chat, Today, Calculators, Flashcards and your study plan are one click away." },
  { icon: Power, t: "Start with Windows", d: "Turn it on and Cadus opens quietly in the tray when you sign in to your computer. Off unless you choose it." },
  { icon: BellRing, t: "Reminders", d: "A gentle notification when flashcards are due, ward jobs are open or your study plan has work for today. At most every 3 hours, 8 am to 9 pm." },
];

/** Notes from earlier versions, newest first (the current version's notes come from release.json). */
const EARLIER = [
  { v: "1.0.2", notes: ["Tray icon: Cadus keeps running when you close its window, with New chat, Today, Calculators, Flashcards and your study plan one click away.", "Quick-open shortcut: press Ctrl+Shift+Space in any app to bring Cadus up with a new chat, ready to type.", "Start with Windows (or with your Linux desktop): an option to open Cadus quietly in the tray when the computer starts.", "Reminders: a desktop notification when flashcards are due, ward jobs are still open or your study plan has work for today, at most every 3 hours, 8 am to 9 pm."] },
  { v: "1.0.1", notes: ["Continue with Google opens in your usual browser, then brings you back to Cadus signed in.", "Cadus in its own window, with your sign-in, chats and settings kept on this computer.", "Checks once a day for a newer version."] },
];

const UNDER_THE_HOOD = [
  { icon: AppWindow, t: "Its own window", d: "Cadus on the taskbar and in the Start menu, one click away between patients, not lost among browser tabs." },
  { icon: RefreshCw, t: "Always up to date", d: "The app shows the live Cadus, so improvements reach you at once. It checks daily for a new app version too." },
  { icon: UserRound, t: "One account", d: "Sign in with your aethex.in account. Chats, cases and settings work exactly as they do in the browser." },
  { icon: ShieldCheck, t: "Safety review", d: "Cadus checks its own answers for doses and red flags before you read them." },
  { icon: LockKeyhole, t: "Private and contained", d: "The window opens only Cadus and Aethex. Every other link opens in your usual browser. No added tracking." },
  { icon: WifiOff, t: "Knows when you're offline", d: "No connection? Cadus says so plainly and reconnects by itself the moment you're back online." },
  { icon: Mic, t: "Voice typing and read aloud", d: "Dictate questions, notes and presentations, talk in voice mode and speak to patients through the Consult Translator; hear answers read aloud." },
  { icon: Monitor, t: "Runs on what you have", d: "Windows 10 and 11 on x64 or ARM, and Linux. macOS coming soon." },
];

const FAQ = [
  { q: "Do I need an account?", a: <>Yes, the same aethex.in account you use on the web. Sign in once in the app and your chats, cases and settings are there.</> },
  { q: "Is it the same as Cadus on the website?", a: <>Yes. The app shows the live Cadus, so every improvement reaches it at once. The app itself checks once a day for a newer version and tells you when to download it.</> },
  { q: "Windows says it protected my PC. Is the file safe?", a: <>Windows SmartScreen warns about new apps until they have been downloaded many times. Choose <b>More info</b>, then <b>Run anyway</b>. You can check the file against its SHA-256 checksum above.</> },
  { q: "Which Windows version should I download?", a: <>The installer for most PCs (Intel and AMD) is x64. Laptops with a Snapdragon or other ARM processor need Windows on ARM. This page picks the right one for this computer.</> },
  { q: "When will Cadus for Mac be available?", a: <>Once it is signed and notarised with Apple, so macOS opens it without warnings. <a href={MAC_MAIL}>Leave your email</a> and we'll tell you.</> },
  { q: "Do I need to reinstall to get the new tools?", a: <>No. The ECG Reader, Antibiotic Guide, Infusions, ABG Interpreter, PG Logbook and every other tool are already in the app, because it shows the live Cadus. Only the app's own features (the tray, the shortcut, starting with Windows and reminders) need version {RELEASE.version}.</> },
  { q: `How do I get version ${RELEASE.version}?`, a: <>Download it above and install it over the old one: your sign-in, chats and settings stay. Cadus also tells you within a day that it's ready, or choose <b>Help › Check for updates</b>.</> },
  { q: "How do I turn off reminders, the tray or starting with Windows?", a: <>Right-click the Cadus icon in the tray, or open the <b>File</b> menu (press <b>Alt</b> if the menu bar is hidden), and untick what you don't want. <b>Quit Cadus</b> in the same menu closes it completely.</> },
  { q: "Can I use voice typing in the app?", a: <>Yes. Dictation, voice mode, the Scribe, Presentation Coach and the Consult Translator all work in the app, in English, Hindi and 11 more Indian languages. Speak, pause, and your words appear. The first time, allow Cadus to use the microphone (on Windows: Settings › Privacy › Microphone).</> },
  { q: "Where is my data kept?", a: <>Exactly where it is in the browser: chats, cases and settings stay on this computer, and your account is kept by Aethex on Cloudflare.</> },
];

/* ------------------------------------------------------------------ page */

export default function Downloads() {
  const [sys, setSys] = useState<Detected>({ os: "unknown", arch: "unknown" });
  const [tab, setTab] = useState<Tab>("windows");
  const [help, setHelp] = useState<"windows" | "linux">("windows");
  const [sums, setSums] = useState(false);
  const [open, setOpen] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  useEffect(() => { void detect().then((d) => { setSys(d); if (d.os === "linux" || d.os === "mac") setTab(d.os); if (d.os === "linux") setHelp("linux"); }); }, []);
  useEffect(() => {
    const before = document.title;
    document.title = "Download Cadus for Windows and Linux · Aethex";
    return () => { document.title = before; };
  }, []);
  const openCadus = isCadusHost() ? "/" : cadusUrl("/");
  const legal = (k: "terms" | "privacy" | "disclaimer") => (isCadusHost() ? LEGAL_PATH(k, true) : `https://cadus.aethex.in/${k}`);

  const best = useMemo(() => {
    if (sys.os === "windows") return sys.arch === "arm64" ? byId("win-arm64") : byId("win-x64");
    if (sys.os === "linux") return byId("linux-appimage");
    return null;
  }, [sys]);
  const label = (f: FileEntry) => (f.os === "windows" ? (f.arch === "arm64" ? "Windows on ARM" : "Windows") : "Linux");
  const winArm = sys.os === "windows" && sys.arch === "arm64";

  return (
    <div className="dl ax" ref={root} onScroll={(e) => setScrolled((e.currentTarget as HTMLDivElement).scrollTop > 8)}>
      <style>{FONT_FACES + CSS}</style>

      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap nav-in">
          <a className="brand" href={openCadus}><span className="tile"><CadusMark size={17} variant="mono" color="currentColor" /></span><span className="word"><span className="sh">Cadus</span></span></a>
          <nav>
            <a href="#product">Product</a>
            <a href="#all">Download</a>
            <a href="#app">New in {RELEASE.version}</a>
            <a href="#new">New in Cadus</a>
            <a href="#notes">Release notes</a>
            <a href="#help">Help</a>
          </nav>
          <a className="nav-link" href={openCadus}>cadus.aethex.in</a>
          <a className="cx-btn dark" href="#all">Download</a>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="hero dl-hero">
          <Helix />
          <div className="wrap hero-in">
            <a className="pill rv" href="#notes"><b>Cadus {RELEASE.version}</b> is here <span>Windows &amp; Linux</span></a>
            <h1 className="rv d1">Your clinical AI,<br /><span className="accent">on the desktop</span></h1>
            <p className="lead rv d2">Cadus answers clinical questions with sources and a safety review, checks doses and interactions, reads labs and keeps an offline medical library. Now in its own window. Sign in once with your aethex.in account.</p>
            <div className="dl-cta rv d3">
              <div className="cta-row">
                {best ? (
                  <a className="cx-btn primary lg dl-big" href={best.url} download={best.file} rel="noopener" data-best={best.id}><Download size={19} /> Download for {label(best)}</a>
                ) : sys.os === "mac" ? (
                  <span className="cx-btn primary lg dl-big" aria-disabled="true"><Download size={19} /> Cadus for Mac is coming soon</span>
                ) : sys.os === "mobile" ? (
                  <a className="cx-btn primary lg dl-big" href={openCadus}><ArrowRight size={19} /> Open Cadus on this phone</a>
                ) : (
                  <a className="cx-btn primary lg dl-big" href="#all"><Download size={19} /> Choose your download</a>
                )}
                <a className="cx-btn lg" href="#all">All platforms</a>
              </div>
              <span className="dl-meta">
                {best ? <><b>Version {RELEASE.version}</b> · {mb(best.size)} · {best.os === "windows" ? "Windows 10 and 11" : "64-bit Linux"} · <span className="soon-t">macOS coming soon</span></>
                  : sys.os === "mac" ? <>Until then, Cadus works fully in Safari or Chrome. <a href={openCadus}>Open Cadus</a> · <a href={MAC_MAIL}>Email me when it's ready</a></>
                  : sys.os === "mobile" ? <>On phones and tablets Cadus runs in the browser. Use "Add to Home Screen" to keep it a tap away.</>
                  : <><b>Version {RELEASE.version}</b> · Windows and Linux · <span className="soon-t">macOS coming soon</span></>}
              </span>
            </div>
            <div className="trust rv d4">
              <span><ShieldCheck size={16} /> Safety-reviewed answers</span>
              <span><BookOpen size={16} /> Sources on every answer</span>
              <span><UserRound size={16} /> Same account as the web</span>
            </div>
          </div>
          <div className="wrap shot-wrap rv d2"><LiveWindow /></div>
        </section>

        {/* tools marquee */}
        <section className="marquee" aria-label="What Cadus does">
          <div className="track">
            {[0, 1].map((n) => (
              <div className="row" key={n} aria-hidden={n === 1}>
                {TOOLS.map(([t, c]) => <span key={t} className="chip"><i className={c} /> {t}</span>)}
              </div>
            ))}
          </div>
        </section>

        {/* numbers */}
        <section className="wrap sec-sm">
          <div className="stats rv">
            <div><b><CountUp to={15515} /></b><span>library articles, available offline</span></div>
            <div><b><CountUp to={CALCULATORS.length} /></b><span>clinical calculators</span></div>
            <div><b><CountUp to={3} /></b><span>desktop builds, macOS next</span></div>
            <div><b><CountUp to={2} /></b><span>models: Medius 3.1 and Magnus 3.6</span></div>
          </div>
        </section>

        {/* download */}
        <section className="wrap sec" id="all" aria-labelledby="dl-all-t">
          <div className="center rv">
            <p className="eyebrow c">Download</p>
            <h2 id="dl-all-t">Get Cadus for your computer</h2>
            <p className="sub">Free to download. We've picked the right version for this computer.</p>
          </div>
          <div className="dl-box dl-all rv d1">
            <div className="tabs" role="tablist" aria-label="Operating system">
              <button role="tab" aria-selected={tab === "windows"} className={tab === "windows" ? "on" : ""} onClick={() => setTab("windows")}><WindowsLogo /> Windows</button>
              <button role="tab" aria-selected={tab === "mac"} className={tab === "mac" ? "on" : ""} onClick={() => setTab("mac")}><AppleLogo /> macOS <em>Soon</em></button>
              <button role="tab" aria-selected={tab === "linux"} className={tab === "linux" ? "on" : ""} onClick={() => setTab("linux")}><LinuxLogo /> Linux</button>
            </div>

            <div className="dl-card" data-os="windows" hidden={tab !== "windows"}>
              <header><h3>Windows</h3>{sys.os === "windows" && <span className="dl-you">This computer</span>}<p>Windows 10 and 11 · x64 and ARM64</p></header>
              <FileRow f={byId("win-x64")} title="Windows installer" sub="For most Windows PCs" recommended={!winArm} />
              <FileRow f={byId("win-arm64")} title="Windows on ARM" sub="For Snapdragon laptops" recommended={winArm} />
            </div>
            <div className="dl-card soon" data-os="mac" hidden={tab !== "mac"}>
              <header><h3>macOS</h3><span className="dl-soon">Coming soon</span><p>Apple silicon and Intel</p></header>
              <div className="dl-file soon"><div className="dl-file-main"><span className="os-tile"><AppleLogo /></span><div className="dl-file-name"><b>Apple silicon</b><small>M1 and later</small></div><span className="cx-btn" aria-disabled="true">Coming soon</span></div></div>
              <div className="dl-file soon"><div className="dl-file-main"><span className="os-tile"><AppleLogo /></span><div className="dl-file-name"><b>Intel</b><small>Macs with Intel processors</small></div><span className="cx-btn" aria-disabled="true">Coming soon</span></div></div>
              <p className="dl-note">The Mac app is being signed and notarised with Apple. Until then, Cadus works fully in Safari or Chrome. <a href={MAC_MAIL}>Email me when it's ready</a></p>
            </div>
            <div className="dl-card" data-os="linux" hidden={tab !== "linux"}>
              <header><h3>Linux</h3>{sys.os === "linux" && <span className="dl-you">This computer</span>}<p>64-bit (x86_64) · Ubuntu, Debian, Fedora and more</p></header>
              <FileRow f={byId("linux-appimage")} title="AppImage" sub="Runs on most distributions, no install" recommended />
              <FileRow f={byId("linux-deb")} title="Debian / Ubuntu" sub="Installs with apt" />
            </div>

            <div className="box-foot">
              <span>Version {RELEASE.version} · released {releasedOn}</span>
              <span><a href="#notes">Release notes</a> · <a href="#requirements">System requirements</a></span>
            </div>
            <div className={`verify ${sums ? "open" : ""}`}>
              <button type="button" onClick={() => setSums(!sums)} aria-expanded={sums}><span>Verify your download (SHA-256 checksums)</span><em>{sums ? "Hide" : "Show"}</em></button>
              {sums && (
                <div className="sums">
                  {RELEASE.files.map((f) => <div key={f.id}><b>{f.file}</b><code>{f.sha256}</code></div>)}
                  <p>Windows (PowerShell): <code>Get-FileHash .\{byId("win-x64").file}</code> · Linux: <code>sha256sum {byId("linux-appimage").file}</code></p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* install */}
        <section className="band" id="install">
          <div className="wrap split">
            <div className="rv">
              <p className="eyebrow">Install</p>
              <h2>Up and running in a minute</h2>
              <p className="sub l">Open the file you downloaded, follow the steps, and sign in. Cadus remembers you after that.</p>
            </div>
            <div className="steps-card rv d1">
              <div className="tabs sm" role="tablist" aria-label="Install on">
                <button role="tab" aria-selected={help === "windows"} className={help === "windows" ? "on" : ""} onClick={() => setHelp("windows")}><WindowsLogo /> Windows</button>
                <button role="tab" aria-selected={help === "linux"} className={help === "linux" ? "on" : ""} onClick={() => setHelp("linux")}><LinuxLogo /> Linux</button>
              </div>
              {help === "windows" ? (
                <ol className="dl-steps" key="w">
                  <li><b>Open the installer.</b> Cadus-Setup-{RELEASE.version}-x64.exe (or the ARM64 file) from your Downloads folder.</li>
                  <li><b>If Windows protects your PC,</b> choose <b>More info</b>, then <b>Run anyway</b>. Windows shows this for new apps until they build a download history.</li>
                  <li><b>Install.</b> Keep the suggested folder or choose another. Cadus adds itself to the Start menu and the desktop.</li>
                  <li><b>Sign in</b> with your aethex.in account. To remove Cadus later: Settings › Apps › Installed apps › Cadus.</li>
                </ol>
              ) : (
                <ol className="dl-steps" key="l">
                  <li><b>AppImage:</b> make it runnable, then open it.<code className="dl-cmd">chmod +x Cadus-{RELEASE.version}-x86_64.AppImage{"\n"}./Cadus-{RELEASE.version}-x86_64.AppImage</code></li>
                  <li><b>Ubuntu / Debian:</b> install the package; Cadus appears in your applications.<code className="dl-cmd">sudo apt install ./Cadus-{RELEASE.version}-amd64.deb</code></li>
                  <li><b>Sign in</b> with your aethex.in account. To remove the .deb later: <code>sudo apt remove cadus-desktop</code></li>
                </ol>
              )}
            </div>
          </div>
        </section>

        {/* under the hood */}
        <section className="wrap sec" id="product">
          <div className="rv">
            <p className="eyebrow">Under the hood</p>
            <h2 className="wide">Made for clinical work, built to be trusted</h2>
            <p className="sub l">Fast on everyday clinic computers, careful with patient data, and clear about what it knows.</p>
          </div>
          <div className="hood">
            {UNDER_THE_HOOD.map(({ icon: Icon, t, d }, k) => (
              <article key={t} className={`hood-card fx-card rv d${(k % 4) + 1}`} data-hood={t} data-fx={fxFor(t)}>
                <LiveFx kind={fxFor(t)} seed={k} />
                <span className="ic"><Icon size={19} /></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* new in the app */}
        <section className="band" id="app">
          <div className="wrap split app-split">
            <div className="rv">
              <p className="eyebrow">New in the app · {RELEASE.version}</p>
              <h2>Cadus, one shortcut away</h2>
              <p className="sub l">Version {RELEASE.version} stays close at hand without getting in the way. Install it over your current version; everything you have stays.</p>
              <p className="keys" aria-label="Control, Shift, Space"><kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>Space</kbd></p>
              <a className="cx-btn primary" href="#all"><Download size={17} /> Get {RELEASE.version}</a>
            </div>
            <div className="app-grid rv d1">
              {NEW_IN_APP.map(({ icon: Icon, t, d }) => (
                <article key={t} className="app-card" data-app={t}>
                  <span className="ic"><Icon size={18} /></span>
                  <div><h3>{t}</h3><p>{d}</p></div>
                </article>
              ))}
              <div className="tray-mock" aria-hidden="true">
                <p className="tm-h"><span className="tile"><CadusMark size={13} variant="mono" color="currentColor" /></span> Cadus</p>
                <span>Open Cadus</span><span>New chat <kbd>Ctrl+Shift+Space</kbd></span><span>Today</span><span>Study plan</span><span>Clinic tools <b aria-hidden="true">›</b></span>
                <i /><span className="muted">2 ward jobs open · 12 flashcards due</span><i />
                <span className="chk">Start with Windows</span><span className="chk on">Reminders</span>
              </div>
            </div>
          </div>
        </section>

        {/* new in Cadus */}
        <section className="wrap sec" id="new">
          <div className="rv">
            <p className="eyebrow">New in Cadus</p>
            <h2 className="wide">Already in your app, no update needed</h2>
            <p className="sub l">The app shows the live Cadus, so every new tool reaches it the moment it's released. Here is what's arrived lately.</p>
          </div>
          <div className="hood new-grid">
            {NEW_IN_CADUS.map(({ icon: Icon, t, d, fx }, k) => (
              <article key={t} className={`hood-card fx-card rv d${(k % 4) + 1}`} data-new={t} data-fx={fx}>
                <LiveFx kind={fx} seed={k} />
                <span className="ic"><Icon size={19} /></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* release notes */}
        <section className="band" id="notes">
          <div className="wrap split top">
            <div className="rv">
              <p className="eyebrow">What's new</p>
              <h2>Release notes</h2>
              <p className="sub l">Cadus tells you when a new version is ready. Install it over the old one; your sign-in, chats and settings stay.</p>
            </div>
            <div className="rv d1">
              <div className="notes-card">
                <div className="ver"><span>{RELEASE.version}</span> Released {releasedOn}</div>
                <h3 id="dl-notes-t">Cadus {RELEASE.version}{"title" in RELEASE && RELEASE.title ? `: ${RELEASE.title}` : ""}</h3>
                <ol className="dl-notes">{RELEASE.notes.map((n) => <li key={n}>{n}</li>)}</ol>
                {EARLIER.filter((e) => e.v !== RELEASE.version).map((e) => (
                  <details key={e.v} className="earlier" data-earlier={e.v}>
                    <summary>Earlier: version {e.v}</summary>
                    <ul>{e.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                  </details>
                ))}
              </div>
              <div className="req" id="requirements">
                <table>
                  <thead><tr><th>Platform</th><th>Version</th><th>Processor</th><th>Notes</th></tr></thead>
                  <tbody>
                    <tr><td><b>Windows</b></td><td>Windows 10 (1809+) or 11</td><td>x64 or ARM64</td><td>4 GB RAM, 8 GB recommended; about 400 MB of space</td></tr>
                    <tr><td><b>Linux</b></td><td>Ubuntu 20.04+, Debian 11+, Fedora 36+</td><td>x64</td><td>AppImage or .deb</td></tr>
                    <tr><td><b>macOS</b> <span className="soon-b">Coming soon</span></td><td>To be announced</td><td>Apple silicon and Intel</td><td>Planned</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* help */}
        <section className="wrap sec" id="help">
          <div className="split top">
            <div className="rv">
              <p className="eyebrow">Help</p>
              <h2>Questions, answered</h2>
              <p className="sub l">Can't find what you need? <a className="tlink" href={`mailto:${SUPPORT_EMAIL}`}>Contact us</a>.</p>
            </div>
            <div className="faq rv d1">
              {FAQ.map(({ q, a }, k) => (
                <div key={q} className={`qa ${open === k ? "open" : ""}`}>
                  <button type="button" onClick={() => setOpen(open === k ? -1 : k)} aria-expanded={open === k}><span>{q}</span><i>{open === k ? <X size={12} /> : <Plus size={12} />}</i></button>
                  <div className="ans"><p>{a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* closing */}
        <section className="wrap sec-sm">
          <div className="closing rv">
            <span className="tile lg"><CadusMark size={30} variant="mono" color="currentColor" /></span>
            <h2>Ready when your next patient is</h2>
            <p className="sub">Free to download. Sign in with the same aethex.in account you use on the web.</p>
            <div className="cta-row">
              {best ? <a className="cx-btn primary lg" href={best.url} download={best.file} rel="noopener"><Download size={18} /> Download for {label(best)}</a>
                : <a className="cx-btn primary lg" href="#all"><Download size={18} /> Choose your download</a>}
              <a className="cx-btn lg" href={openCadus}>Open in the browser <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <span className="brand sm"><span className="tile sm"><CadusMark size={12} variant="mono" color="currentColor" /></span> © {new Date().getFullYear()} Aethex</span>
          <span className="foot-note">Cadus is clinical decision support, not a substitute for clinical judgement.</span>
          <span><a href={legal("terms")}>Terms</a> · <a href={legal("privacy")}>Privacy</a> · <a href={legal("disclaimer")}>Disclaimer</a> · <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></span>
        </div>
      </footer>
    </div>
  );
}

function WindowsLogo() {
  return <svg className="dl-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5.2 10.4 4.2v7.1H3zm8.3-1.1L21 2.8v8.5h-9.7zM3 12.7h7.4v7.1L3 18.8zm8.3 0H21v8.5l-9.7-1.3z" /></svg>;
}
function AppleLogo() {
  return <svg className="dl-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.9zM14.2 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg>;
}
function LinuxLogo() {
  return <svg className="dl-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c-2.2 0-3.6 1.9-3.6 4.6 0 1.4.3 2.3-.5 3.8C6.7 12.6 5 14.5 5.4 17c.2 1.1.9 1.3 1.4 1.6.6.4.9 1.2 1.9 1.6 1.1.4 2.1-.2 3.3-.2s2.2.6 3.3.2c1-.4 1.3-1.2 1.9-1.6.5-.3 1.2-.5 1.4-1.6.4-2.5-1.3-4.4-2.5-6.6-.8-1.5-.5-2.4-.5-3.8C15.6 3.9 14.2 2 12 2zm-1.5 4.3c.4 0 .7.5.7 1.1s-.3 1.1-.7 1.1-.7-.5-.7-1.1.3-1.1.7-1.1zm3 0c.4 0 .7.5.7 1.1s-.3 1.1-.7 1.1-.7-.5-.7-1.1.3-1.1.7-1.1zM12 9.3c.9 0 1.8.4 1.8.8 0 .5-.9 1-1.8 1s-1.8-.5-1.8-1c0-.4.9-.8 1.8-.8z" /></svg>;
}

const CSS = `
.ax{
  --bg:#fff;--band:#f7f8fa;--ink:#0b1220;--t2:#475467;--t3:#667085;--line:#e6e9ef;--line2:#d5dae2;
  --teal:#2b7a6f;--teal2:#246a60;--teal-bg:#eaf5f2;--teal-t:#2f7f72;--soon:#c2610c;
  --sans:"Cadus Sans",Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Code",Consolas,monospace;
  position:fixed;inset:0;z-index:40;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth;
  background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55;letter-spacing:normal;
  -webkit-font-smoothing:antialiased;color-scheme:light;
}
.ax *{box-sizing:border-box}
.ax h1,.ax h2,.ax h3,.ax p,.ax ol,.ax ul{margin:0}
.ax h1,.ax h2,.ax h3{font-family:var(--sans);color:var(--ink)}
.ax a{color:inherit;text-decoration:none}
.ax .wrap{width:100%;max-width:1220px;margin:0 auto;padding:0 32px}

.ax .rv{opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.ax .rv.in{opacity:1;transform:none}
.ax .d1{transition-delay:.07s}.ax .d2{transition-delay:.14s}.ax .d3{transition-delay:.21s}.ax .d4{transition-delay:.28s}

.ax .nav{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.82);backdrop-filter:saturate(1.6) blur(14px);-webkit-backdrop-filter:saturate(1.6) blur(14px);border-bottom:1px solid transparent;transition:border-color .25s,box-shadow .25s}
.ax .nav.scrolled{border-bottom-color:var(--line);box-shadow:0 1px 12px rgba(16,24,40,.04)}
.ax .nav-in{display:flex;align-items:center;gap:40px;height:76px}
.ax .brand{display:flex;align-items:center;gap:12px}
.ax .tile{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:linear-gradient(160deg,#fff,#eef3f6);border:1px solid var(--line);color:#0f2a3a;box-shadow:0 1px 2px rgba(16,24,40,.06)}
.ax .tile.sm{width:22px;height:22px;border-radius:6px}
.ax .tile.lg{width:64px;height:64px;border-radius:18px}
@font-face{font-family:"Aethex Script";font-style:normal;font-weight:400;font-display:block;src:url(/fonts/pinyon/pinyon-script-latin-400-normal.woff2) format("woff2")}
.ax .word{display:block;font-family:"Aethex Script","Pinyon Script","Great Vibes",cursive;font-weight:400;font-size:36px;line-height:1.4;letter-spacing:.01em;animation:dlWordIn .7s cubic-bezier(.22,1,.36,1) .1s backwards}
.ax .word .sh{display:block;padding:0 6px 0 2px;background:linear-gradient(105deg,#1a1a2e 0%,#2d2d4e 20%,#4a4a6a 38%,#8585a8 45%,#b0b0cc 50%,#8585a8 55%,#4a4a6a 62%,#2d2d4e 80%,#1a1a2e 100%);background-size:300% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:dlShine 4s linear .7s infinite}
@keyframes dlWordIn{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:none}}
@keyframes dlShine{0%{background-position:-400% center}100%{background-position:400% center}}
.ax .nav nav{display:flex;gap:34px}
.ax .nav nav a,.ax .nav-link{font-size:15.5px;color:#344054;transition:color .2s}
.ax .nav nav a:hover,.ax .nav-link:hover{color:var(--ink)}
.ax .nav-link{margin-left:auto}

.ax .cx-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;height:42px;padding:0 18px;border-radius:10px;border:1px solid var(--line2);background:#fff;color:var(--ink);font:600 14.5px/1 var(--sans);cursor:pointer;white-space:nowrap;transition:background .2s,border-color .2s,box-shadow .2s,transform .2s}
.ax .cx-btn:hover{border-color:#b9c0cb;box-shadow:0 2px 8px rgba(16,24,40,.06)}
.ax .cx-btn.primary{background:var(--teal);border-color:var(--teal);color:#fff;box-shadow:0 6px 18px -8px rgba(43,122,111,.6)}
.ax .cx-btn.primary:hover{background:var(--teal2);transform:translateY(-1px);box-shadow:0 10px 24px -10px rgba(43,122,111,.7)}
.ax .cx-btn.dark{background:#0b1220;border-color:#0b1220;color:#fff;height:46px;padding:0 22px;font-size:15.5px}
.ax .cx-btn.dark:hover{background:#1d2939}
.ax .cx-btn.lg{height:60px;padding:0 30px;font-size:17px;border-radius:12px}
.ax .cx-btn[aria-disabled="true"]{opacity:.6;pointer-events:none;cursor:default}
.ax .cx-ib{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--t2);cursor:pointer}

.ax .hero{position:relative;padding:96px 0 0;overflow:hidden;background:radial-gradient(900px 420px at 50% -60px,#eef7f4 0%,rgba(238,247,244,0) 70%),linear-gradient(180deg,#fbfcfd,#fff 60%)}
.ax .hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(16,24,40,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(16,24,40,.035) 1px,transparent 1px);background-size:120px 120px;-webkit-mask-image:linear-gradient(#000 0,transparent 75%);mask-image:linear-gradient(#000 0,transparent 75%);pointer-events:none}
.ax .helix{position:absolute;left:0;top:150px;width:100%;height:400px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);opacity:.7;pointer-events:none}
.ax .lead,.ax .dl-meta,.ax .trust{position:relative;text-shadow:0 0 12px #fff,0 0 4px #fff}
.ax .hero-in{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center}
.ax .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 6px 6px 18px;border-radius:999px;background:#fff;border:1px solid var(--line);box-shadow:0 1px 3px rgba(16,24,40,.05);font-size:15.5px;color:var(--t2)}
.ax .pill b{color:var(--ink);font-weight:650}
.ax .pill span{padding:5px 12px;border-radius:999px;background:var(--teal-bg);color:var(--teal-t);font-weight:600;font-size:14.5px}
.ax h1{margin:34px 0 26px;font-size:clamp(44px,7vw,92px);line-height:1.02;letter-spacing:-.045em;font-weight:800}
.ax .accent{color:var(--teal)}
.ax .lead{max-width:780px;font-size:clamp(17px,1.6vw,21px);line-height:1.7;color:var(--t2)}
.ax .dl-cta{display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:40px}
.ax .cta-row{display:flex;flex-wrap:wrap;justify-content:center;gap:16px}
.ax .dl-meta{font-size:15.5px;color:var(--t3)}
.ax .dl-meta b{color:var(--ink);font-weight:600}
.ax .dl-meta a{color:var(--teal-t);font-weight:600}
.ax .soon-t{color:var(--soon);font-weight:600}
.ax .trust{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 34px;margin-top:40px;font-size:15.5px;color:var(--t2)}
.ax .trust span{display:inline-flex;align-items:center;gap:9px}
.ax .trust svg{color:var(--teal)}
.ax .shot-wrap{position:relative;margin-top:84px}

.ax .shot{position:relative;padding:0 40px}
.ax .win{border-radius:16px 16px 0 0;border:1px solid var(--line);border-bottom:0;background:#fff;box-shadow:0 40px 80px -30px rgba(16,24,40,.25),0 12px 24px -12px rgba(16,24,40,.08);overflow:hidden}
.ax .win-bar{position:relative;display:flex;align-items:center;gap:8px;height:44px;padding:0 18px;background:#fbfbfc;border-bottom:1px solid var(--line)}
.ax .win-bar i{width:12px;height:12px;border-radius:50%;background:#ff5f57}.ax .win-bar i:nth-child(2){background:#febc2e}.ax .win-bar i:nth-child(3){background:#28c840}
.ax .win-bar span{position:absolute;left:0;right:0;text-align:center;font-size:14px;color:var(--t2);pointer-events:none}
.ax .app{display:grid;grid-template-columns:230px 1fr;height:500px;font-size:13px}
.ax .app-side{display:flex;flex-direction:column;gap:4px;padding:16px 12px;border-right:1px solid var(--line);background:#fcfcfd}
.ax .app-brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;margin:0 4px 12px}
.ax .app-new{display:flex;align-items:center;justify-content:center;gap:6px;height:32px;border-radius:8px;background:var(--teal);color:#fff;font-weight:600;font-size:12.5px}
.ax .app-search{display:flex;align-items:center;gap:6px;height:30px;margin:6px 0 8px;padding:0 10px;border-radius:8px;border:1px solid var(--line);color:var(--t3);font-size:12px}
.ax .app-side small{margin:8px 6px 2px;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#98a2b3}
.ax .app-chat{padding:7px 10px;border-radius:7px;color:#344054;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .3s,color .3s}
.ax .app-chat.on{background:var(--teal);color:#fff;font-weight:600}
.ax .app-user{display:flex;align-items:center;gap:9px;margin-top:auto;padding:10px 6px 0;border-top:1px solid var(--line)}
.ax .app-user>span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#3b5bdb;color:#fff;font-size:10.5px;font-weight:700}
.ax .app-user b{display:block;font-size:12.5px}.ax .app-user em{font-style:normal;font-size:11px;color:var(--t3)}
.ax .app-main{display:flex;flex-direction:column;min-width:0;background:#fff}
.ax .app-top{display:flex;align-items:center;justify-content:space-between;height:50px;padding:0 22px;border-bottom:1px solid var(--line)}
.ax .app-top b{font-size:14px}
.ax .model{padding:4px 10px;border-radius:999px;border:1px solid var(--line);font-size:11.5px;color:var(--t2)}
.ax .app-chatbox{flex:1;display:flex;flex-direction:column;gap:14px;padding:22px 26px;overflow:hidden}
.ax .msg-q{align-self:flex-end;max-width:72%;padding:11px 15px;border-radius:14px 14px 4px 14px;background:#f2f4f7;font-size:13.5px;line-height:1.5;animation:pop .35s ease}
.ax .msg-think{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--t3)}
.ax .dots{display:inline-flex;gap:4px}.ax .dots i{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:dot 1s infinite}.ax .dots i:nth-child(2){animation-delay:.15s}.ax .dots i:nth-child(3){animation-delay:.3s}
@keyframes dot{0%,80%,100%{opacity:.25}40%{opacity:1}}
@keyframes pop{from{opacity:0;transform:translateY(6px)}}
.ax .msg-a{max-width:88%;font-size:13.5px;line-height:1.6;animation:pop .35s ease}
.ax .lab{display:inline-block;margin-bottom:6px;padding:3px 8px;border-radius:6px;background:var(--teal-bg);color:var(--teal-t);font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.ax .msg-a p{font-weight:600;color:var(--ink)}
.ax .msg-a ul{margin:8px 0 0;padding-left:18px;color:#344054}
.ax .msg-a li{margin:3px 0}.ax .msg-a li::marker{color:var(--teal)}
.ax .chips{display:flex;gap:6px;margin-top:12px}
.ax .chips span{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;border:1px solid var(--line);font-size:11.5px;color:var(--t2);animation:pop .4s backwards}
.ax .chips .ok{background:#ecfdf3;border-color:#abefc6;color:#067647}
.ax .chips span+span{animation-delay:.1s}
.ax .caret{display:inline-block;width:2px;height:1.05em;margin-left:2px;vertical-align:-.15em;background:var(--teal);animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.ax .app-input{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 22px 18px;height:48px;padding:0 7px 0 16px;border:1px solid var(--line2);border-radius:12px;color:#98a2b3;font-size:13px;transition:border-color .3s,box-shadow .3s}
.ax .app-input>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ax .app-input.live{border-color:var(--teal);box-shadow:0 0 0 4px rgba(43,122,111,.1);color:var(--ink)}
.ax .app-input i{display:grid;place-items:center;flex-shrink:0;width:34px;height:34px;border-radius:9px;background:var(--teal);color:#fff}
.ax .float{position:absolute;display:flex;gap:14px;padding:18px 20px;border-radius:16px;background:#fff;border:1px solid var(--line);box-shadow:0 24px 48px -18px rgba(16,24,40,.22);animation:bob 6s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-8px)}}
.ax .float .ic{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border-radius:10px;background:var(--teal-bg);color:var(--teal)}
.ax .float b{display:block;font-size:16px}
.ax .float small{display:block;font-size:13.5px;color:var(--t3);margin-top:2px}
.ax .f1{left:0;top:120px;width:300px}
.ax .bar{display:block;height:6px;margin-top:12px;border-radius:999px;background:#eef1f4;overflow:hidden}
.ax .bar i{display:block;height:100%;width:12%;border-radius:inherit;background:var(--teal);transition:width 1.2s ease}
.ax .bar.half i{width:58%}.ax .bar.full i{width:100%}
.ax .f2{right:0;top:250px;width:270px;flex-direction:column;gap:9px;animation-delay:-3s}
.ax .f2-top{display:flex;align-items:center;justify-content:space-between}
.ax .live{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#067647}
.ax .live i{width:8px;height:8px;border-radius:50%;background:#17b26a;box-shadow:0 0 0 0 rgba(23,178,106,.5);animation:ping 1.8s infinite}
@keyframes ping{70%{box-shadow:0 0 0 7px rgba(23,178,106,0)}100%{box-shadow:0 0 0 0 rgba(23,178,106,0)}}
.ax .src{display:flex;align-items:center;gap:9px;font-size:13px;color:#344054}
.ax .src span{display:grid;place-items:center;width:20px;height:20px;border-radius:6px;background:#f2f4f7;font-size:11px;font-weight:700;color:var(--t2)}

.ax .marquee{padding:26px 0;background:var(--band);border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.ax .track{display:flex;width:max-content;animation:slide 48s linear infinite}
.ax .marquee:hover .track{animation-play-state:paused}
.ax .row{display:flex;gap:14px;padding-right:14px}
@keyframes slide{to{transform:translateX(-50%)}}
.ax .chip{display:inline-flex;align-items:center;gap:10px;height:50px;padding:0 20px;border-radius:12px;background:#fff;border:1px solid var(--line);font-size:16px;font-weight:550;color:#1d2939;white-space:nowrap}
.ax .chip i{width:8px;height:8px;border-radius:50%;background:#4fb3a4}
.ax .chip i.r{background:#e5534b}.ax .chip i.v{background:#8b7cf6}.ax .chip i.y{background:#e9b949}

.ax .sec{padding:120px 32px}
.ax .sec-sm{padding:80px 32px 40px}
.ax .band{padding:120px 0;background:var(--band);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.ax .center{text-align:center;display:flex;flex-direction:column;align-items:center}
.ax .eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:16px;font-size:16px;font-weight:600;color:var(--teal-t)}
.ax .eyebrow::before{content:"";width:22px;height:2px;border-radius:2px;background:var(--teal-t)}
.ax .eyebrow.c::before{display:none}
.ax h2{font-size:clamp(34px,4.3vw,58px);line-height:1.08;letter-spacing:-.04em;font-weight:800}
.ax h2.wide{max-width:900px}
.ax .sub{margin-top:20px;max-width:720px;font-size:clamp(17px,1.5vw,21px);line-height:1.65;color:var(--t2)}
.ax .sub.l{max-width:600px}
.ax .tlink{color:var(--teal-t);font-weight:650}
.ax .split{display:grid;grid-template-columns:.9fr 1.1fr;gap:72px;align-items:center}
.ax .split.top{align-items:start}
.ax .split>*{min-width:0}

.ax .stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:20px;background:#fff}
.ax .stats>div{padding:40px 38px;border-right:1px solid var(--line)}
.ax .stats>div:last-child{border-right:0}
.ax .stats b{display:block;font-size:56px;line-height:1.05;letter-spacing:-.04em;font-weight:800;font-variant-numeric:tabular-nums}
.ax .stats>div>span{display:block;margin-top:14px;font-size:17px;line-height:1.55;color:var(--t2)}

.ax .dl-box{position:relative;margin-top:56px;padding:40px 36px 36px;border-radius:24px;border:1px solid var(--line);background:linear-gradient(180deg,#f6fbfa 0,#fff 140px);box-shadow:0 40px 80px -48px rgba(16,24,40,.28)}
.ax .tabs{position:absolute;right:36px;top:38px;display:inline-flex;gap:2px;padding:5px;border-radius:14px;background:#f2f4f7;border:1px solid var(--line)}
.ax .tabs button{display:inline-flex;align-items:center;gap:9px;height:44px;padding:0 20px;border:0;border-radius:10px;background:none;color:var(--t2);font:600 16px var(--sans);cursor:pointer;transition:background .2s,color .2s,box-shadow .2s}
.ax .tabs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(16,24,40,.1)}
.ax .tabs .dl-logo{width:17px;height:17px}
.ax .tabs em{font-style:normal;padding:2px 7px;border-radius:5px;background:#fef0c7;color:#93370d;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.ax .tabs.sm{position:static;margin-bottom:26px}
.ax .tabs.sm button{height:38px;font-size:14.5px;padding:0 16px}
.ax .dl-card[hidden]{display:none}
.ax .dl-card>header{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;min-height:56px;margin-bottom:28px;padding-right:440px}
.ax .dl-card>header h3{font-size:30px;letter-spacing:-.025em;font-weight:750}
.ax .dl-card>header p{flex-basis:100%;font-size:17px;color:var(--t2)}
.ax .dl-you,.ax .dl-soon{padding:4px 10px;border-radius:999px;font-size:12.5px;font-weight:650}
.ax .dl-you{background:var(--teal-bg);color:var(--teal-t)}
.ax .dl-soon{background:#fef0c7;color:#93370d}
.ax .dl-file{margin-bottom:16px;padding:22px;border-radius:16px;border:1px solid var(--line);background:#fff;transition:border-color .2s,box-shadow .2s}
.ax .dl-file:hover{box-shadow:0 8px 24px -14px rgba(16,24,40,.2)}
.ax .dl-file.rec{border-color:#a6dccf;background:linear-gradient(90deg,#f1faf7,#fff 70%)}
.ax .dl-file-main{display:flex;align-items:center;gap:22px}
.ax .os-tile{display:grid;place-items:center;flex-shrink:0;width:64px;height:64px;border-radius:14px;border:1px solid var(--line);background:#fafbfc;color:#1d2939}
.ax .os-tile .dl-logo{width:24px;height:24px}
.ax .dl-file-name{flex:1;min-width:0}
.ax .dl-file-name b{display:flex;align-items:center;flex-wrap:wrap;gap:12px;font-size:20px;font-weight:650;letter-spacing:-.01em}
.ax .badge{font-style:normal;padding:5px 11px;border-radius:7px;background:#dff3ee;color:var(--teal-t);font-size:15px;font-weight:600}
.ax .dl-file-name small{display:block;margin-top:5px;font-size:16.5px;color:var(--t2)}
.ax .dl-link{padding:0;border:0;background:none;font:inherit;font-size:15px;color:var(--t3);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ax .dl-link:hover{color:var(--teal-t)}
.ax .tags{display:flex;gap:10px}
.ax .tags i{font-style:normal;padding:8px 13px;border-radius:9px;border:1px solid var(--line);background:#fafbfc;font-size:15.5px;color:#344054}
.ax .size{width:96px;text-align:right;font-size:17px;color:var(--t2);font-variant-numeric:tabular-nums}
.ax .dl-file .cx-btn{height:54px;padding:0 30px;font-size:17px;border-radius:12px;flex-shrink:0}
.ax .dl-file.soon .dl-file-name b{color:var(--t2)}
.ax .dl-hash{display:flex;align-items:center;gap:10px;margin:16px 0 0 86px;padding:10px 12px;border-radius:10px;background:var(--band);animation:pop .3s}
.ax .dl-hash code{flex:1;min-width:0;overflow-wrap:anywhere;font-family:var(--mono);font-size:12.5px;color:#344054}
.ax .dl-note{margin-top:4px;font-size:16px;color:var(--t2)}
.ax .dl-note a{color:var(--teal-t);font-weight:600}
.ax .box-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-top:28px;padding-top:28px;border-top:1px solid var(--line);font-size:17px;color:var(--t2)}
.ax .box-foot a{color:var(--ink)}.ax .box-foot a:hover{color:var(--teal-t)}
.ax .verify{margin-top:20px;border:1px solid var(--line);border-radius:14px;background:var(--band)}
.ax .verify button{display:flex;width:100%;align-items:center;justify-content:space-between;padding:18px 22px;border:0;background:none;font:550 17px var(--sans);color:var(--ink);cursor:pointer}
.ax .verify em{font-style:normal;font-weight:500;color:var(--t2)}
.ax .sums{display:flex;flex-direction:column;gap:10px;padding:0 22px 20px;animation:pop .3s}
.ax .sums div{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:14px}
.ax .sums b{font-weight:600;min-width:260px}
.ax .sums code{font-family:var(--mono);font-size:12.5px;color:#344054;overflow-wrap:anywhere}
.ax .sums p{font-size:14px;color:var(--t2);margin-top:6px}

.ax .steps-card{padding:34px;border-radius:20px;border:1px solid var(--line);background:#fff;box-shadow:0 30px 60px -44px rgba(16,24,40,.3)}
.ax .dl-steps{counter-reset:s;list-style:none;padding:0;display:flex;flex-direction:column;gap:22px;font-size:16.5px;line-height:1.6;color:var(--t2)}
.ax .dl-steps li{counter-increment:s;position:relative;padding-left:46px;animation:pop .4s backwards}
.ax .dl-steps li:nth-child(2){animation-delay:.06s}.ax .dl-steps li:nth-child(3){animation-delay:.12s}.ax .dl-steps li:nth-child(4){animation-delay:.18s}
.ax .dl-steps li::before{content:counter(s);position:absolute;left:0;top:1px;display:grid;place-items:center;width:28px;height:28px;border-radius:8px;border:1px solid #bfe3da;background:#f1faf7;color:var(--teal-t);font-size:14px;font-weight:700}
.ax .dl-steps b{color:var(--ink);font-weight:650}
.ax .dl-cmd{display:block;margin:10px 0 0;padding:12px 14px;border-radius:10px;background:#0b1220;color:#d1fae5;font-family:var(--mono);font-size:13.5px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.ax .dl-steps code:not(.dl-cmd){font-family:var(--mono);font-size:14px;color:var(--ink)}

.ax .hood{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:64px}
.ax .new-grid{grid-template-columns:repeat(5,1fr);gap:16px}
.ax .new-grid .hood-card{padding:26px 22px}
.ax .new-grid .hood-card h3{margin:22px 0 10px;font-size:19px}
.ax .new-grid .hood-card p{font-size:15px;line-height:1.55}
.ax .hood-card{padding:34px 32px;border-radius:20px;border:1px solid var(--line);background:#fff;transition:transform .3s ease,box-shadow .3s ease,border-color .3s,opacity .7s ease}
.ax .hood-card:hover{transform:translateY(-4px);border-color:#cfe6e0;box-shadow:0 24px 48px -28px rgba(16,24,40,.25);background:radial-gradient(260px circle at 30% 0%,#f3faf8,#fff 70%)}
.ax .hood-card .ic{display:grid;place-items:center;width:54px;height:54px;border-radius:12px;background:var(--teal-bg);color:var(--teal);transition:transform .35s cubic-bezier(.2,.9,.3,1.4)}
.ax .hood-card:hover .ic{transform:scale(1.08)}
.ax .hood-card h3{margin:34px 0 12px;font-size:21px;font-weight:650;letter-spacing:-.01em}
.ax .hood-card p{font-size:17px;line-height:1.65;color:var(--t2)}

.ax .app-split{align-items:start}
.ax .keys{display:flex;align-items:center;gap:8px;margin:28px 0;color:var(--t3);font-weight:600}
.ax kbd{display:inline-block;padding:7px 12px;border-radius:9px;border:1px solid var(--line2);border-bottom-width:3px;background:#fff;color:var(--ink);font:650 15px/1 var(--sans)}
.ax .app-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ax .app-grid>.app-card:first-child:nth-last-child(even){grid-column:1/-1}
.ax .app-card{display:flex;gap:16px;padding:24px;border-radius:18px;border:1px solid var(--line);background:#fff}
.ax .app-card .ic{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:11px;background:var(--teal-bg);color:var(--teal)}
.ax .app-card h3{margin:2px 0 8px;font-size:18px;font-weight:650}
.ax .app-card p{margin:0;font-size:15.5px;line-height:1.6;color:var(--t2)}
.ax .tray-mock{grid-column:1/-1;justify-self:end;width:min(300px,100%);display:flex;flex-direction:column;padding:8px;border-radius:12px;border:1px solid var(--line2);background:#fff;box-shadow:0 24px 48px -24px rgba(16,24,40,.35);font-size:14px}
.ax .tray-mock .tm-h{display:flex;align-items:center;gap:8px;margin:0;padding:6px 10px 8px;font-weight:700}
.ax .tray-mock .tile{display:grid;place-items:center;width:22px;height:22px;border-radius:6px;background:var(--ink);color:#fff}
.ax .tray-mock span{display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:7px;color:var(--ink)}
.ax .tray-mock span:nth-of-type(2){background:var(--teal-bg)}
.ax .tray-mock span.muted{color:var(--t3);font-size:13px}
.ax .tray-mock kbd{padding:2px 6px;border-bottom-width:1px;font-size:11.5px;color:var(--t3)}
.ax .tray-mock i{height:1px;margin:4px 8px;background:var(--line)}
.ax .tray-mock .chk::after{content:"";width:14px;height:14px;border-radius:4px;border:1.5px solid var(--line2)}
.ax .tray-mock .chk.on::after{background:var(--teal);border-color:var(--teal)}
.ax .earlier{margin-top:26px;border-top:1px solid var(--line);padding-top:18px;color:var(--t2)}
.ax .earlier summary{cursor:pointer;font-weight:600;color:var(--ink)}
.ax .earlier ul{margin:12px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:16px}
@media (max-width:700px){.ax .app-grid{grid-template-columns:1fr}.ax .tray-mock{justify-self:stretch;width:auto}}
.ax .notes-card{padding:40px;border-radius:22px;border:1px solid var(--line);background:#fff}
.ax .ver{display:flex;align-items:center;gap:14px;font-size:17px;color:var(--t2)}
.ax .ver span{padding:6px 12px;border-radius:9px;background:var(--teal-bg);color:var(--teal-t);font-weight:700}
.ax .notes-card h3{margin:22px 0;font-size:28px;letter-spacing:-.02em;font-weight:750}
.ax .dl-notes{counter-reset:n;list-style:none;padding:0;display:flex;flex-direction:column;gap:18px}
.ax .dl-notes li{counter-increment:n;position:relative;padding-left:42px;font-size:18px;line-height:1.6;color:#344054}
.ax .dl-notes li::before{content:counter(n);position:absolute;left:0;top:2px;display:grid;place-items:center;width:28px;height:28px;border-radius:8px;border:1px solid #bfe3da;background:#f1faf7;color:var(--teal-t);font-size:14px;font-weight:700}
.ax .req{margin-top:36px;border-radius:22px;border:1px solid var(--line);background:#fff;overflow:hidden}
.ax .req table{width:100%;border-collapse:collapse;font-size:16.5px}
.ax .req th{padding:20px 22px;background:var(--band);text-align:left;font-size:14.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--t2)}
.ax .req td{padding:22px;border-top:1px solid var(--line);vertical-align:top;color:var(--t2);line-height:1.6}
.ax .req td b{color:var(--ink);font-weight:650}
.ax .soon-b{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:6px;background:#fef0c7;color:#93370d;font-size:13px;font-weight:650}

.ax .faq{border-top:1px solid var(--line)}
.ax .qa{border-bottom:1px solid var(--line)}
.ax .qa button{display:flex;width:100%;align-items:center;justify-content:space-between;gap:20px;padding:30px 0;border:0;background:none;text-align:left;font:650 20px/1.4 var(--sans);color:var(--ink);cursor:pointer}
.ax .qa button i{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;border-radius:50%;background:#f2f4f7;color:var(--ink);transition:background .3s}
.ax .qa.open button i{background:#e7ecf0}
.ax .ans{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
.ax .qa.open .ans{grid-template-rows:1fr}
.ax .ans>p{overflow:hidden;font-size:18px;line-height:1.7;color:var(--t2)}
.ax .qa.open .ans>p{padding-bottom:30px}
.ax .ans a{color:var(--teal-t);font-weight:600}

.ax .closing{display:flex;flex-direction:column;align-items:center;text-align:center;padding:80px 32px;border-radius:28px;border:1px solid var(--line);background:radial-gradient(700px 300px at 50% 0,#eef7f4,#fff 70%)}
.ax .closing h2{margin-top:28px}
.ax .closing .cta-row{margin-top:36px}

.ax .foot{margin-top:60px;border-top:1px solid var(--line);background:var(--band)}
.ax .foot-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding-top:30px;padding-bottom:30px;font-size:14.5px;color:var(--t3)}
.ax .foot .brand.sm{gap:9px;color:var(--ink);font-weight:600}
.ax .foot a{color:var(--t2)}.ax .foot a:hover{color:var(--ink)}

.ax .dl-logo{width:18px;height:18px;flex-shrink:0}

@media (max-width:1100px){.ax .new-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:1100px){
  .ax .nav nav{gap:22px}
  .ax .nav-link{display:none}
  .ax .hood{grid-template-columns:repeat(2,1fr)}
  .ax .tabs{position:static;margin-bottom:28px}
  .ax .dl-card>header{padding-right:0}
  .ax .f1,.ax .f2{display:none}
  .ax .shot{padding:0}
}
@media (max-width:860px){
  .ax .nav nav,.ax .nav-link{display:none}
  .ax .nav-in .cx-btn.dark{margin-left:auto}
  .ax .split{grid-template-columns:1fr;gap:40px}
  .ax .stats{grid-template-columns:1fr 1fr}
  .ax .stats>div:nth-child(2){border-right:0}
  .ax .stats>div:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .ax .app{grid-template-columns:1fr}
  .ax .app-side{display:none}
  .ax .dl-file-main{flex-wrap:wrap}
  .ax .dl-file-name{flex-basis:calc(100% - 90px)}
  .ax .tags{margin-left:86px}
  .ax .size{width:auto;margin-left:auto}
  .ax .dl-hash{margin-left:0}
  .ax .req{overflow-x:auto}
}
@media (max-width:600px){
  .ax .wrap{padding:0 18px}
  .ax .sec{padding:80px 18px}.ax .sec-sm{padding:56px 18px 24px}.ax .band{padding:80px 0}
  .ax .hero{padding-top:56px;padding-bottom:56px}
  .ax .helix{top:110px;height:300px;opacity:.35}
  .ax .os-tile{display:none}
  .ax .dl-file-name{flex-basis:100%}
  .ax .shot-wrap{display:none}
  .ax .cta-row{width:100%;flex-direction:column}
  .ax .cta-row .cx-btn{width:100%}
  .ax .cx-btn.lg{height:56px;font-size:16px;padding:0 20px}
  .ax .stats>div{padding:26px 20px}
  .ax .stats b{font-size:38px}
  .ax .stats>div>span{font-size:14.5px}
  .ax .hood{grid-template-columns:1fr}
  .ax .dl-box{padding:24px 16px}
  .ax .tabs{display:flex;width:100%}.ax .tabs button{flex:1;justify-content:center;padding:0 8px;font-size:14px}
  .ax .tabs button .dl-logo{display:none}
  .ax .dl-file{padding:16px}
  .ax .dl-file-name b{font-size:17px}
  .ax .tags{margin-left:0}
  .ax .dl-file .cx-btn{width:100%;height:50px}
  .ax .notes-card,.ax .steps-card{padding:24px}
  .ax .closing{padding:56px 18px}
  .ax .qa button{font-size:17px;padding:22px 0}
  .ax .sums b{min-width:0}
}

${FX_CSS}
@media (prefers-reduced-motion:reduce){
  .ax *,.ax *::before,.ax *::after{animation:none!important;transition:none!important}
  .ax .rv{opacity:1;transform:none}
  .ax{scroll-behavior:auto}
}
`;
