/**
 * Live card backgrounds for the Downloads page: a small, quiet animated picture behind each card
 * that shows what the card says (a window opening from the taskbar, a queue moving up, a pill chart's
 * sun and moon, an ECG trace…). Drawn in the brand teal, kept in the card's lower-right corner below
 * the text, running only while its section is on screen and never for reduced motion.
 */
import type { CSSProperties } from "react";

export type FxKind =
  | "pulse" | "wave" | "scan" | "orbit" | "flow" | "spark" | "chart" | "write"
  | "window" | "sync" | "account" | "shield" | "lock" | "wifi" | "mic" | "devices"
  | "chat" | "queue" | "calendar" | "sunmoon" | "curve" | "line" | "cards" | "envelope" | "phone" | "book"
  | "pill" | "folder" | "drop" | "check" | "scale" | "timer" | "alert" | "chain" | "letters" | "blocks";

/** Each card's picture, by its title. */
const BY_TITLE: Record<string, FxKind> = {
  // Under the hood
  "Its own window": "window", "Always up to date": "sync", "One account": "account", "Safety review": "shield",
  "Private and contained": "lock", "Knows when you're offline": "wifi", "Voice typing and read aloud": "mic", "Runs on what you have": "devices",
  // New in Cadus
  "Patient Records": "folder", "Ward Rounds by Voice": "mic", "Revision Notes": "cards", "Clinic Analytics": "chart",
  "Pre-op Assessment": "check", "Patient Messages": "chat", "Pregnancy & Breastfeeding": "pulse", "Pill Chart": "sunmoon",
  "OPD Queue": "queue", "Clinical Image Quiz": "scan", "Dose Card by Weight": "scale", "Subject-wise mock tests": "timer",
  "On-call Helper": "phone", "Journal Club": "book", "Statistics Test Chooser": "curve", "Duty Roster": "calendar",
  "Prescription Writer": "write", "Lab Trends": "line", "Daily Clinical Case": "calendar", "Letters & Certificates": "envelope",
  "ADR Report (PvPI)": "alert", "Cause of Death (MCCD)": "chain", "Mnemonic Maker": "letters", "Generic Finder": "pill",
  "Voice Viva": "chat", "Voice OSCE and simulator": "chat", "Your own voice": "wave", "Patient Audio Library": "wave",
  "Natural voices": "wave", "Audio for the patient": "wave", "Revision Podcasts": "wave", "Crew Debate": "chat",
  "Crew Playbooks": "chain", "Assistant Builder": "blocks", "ECG Reader": "pulse", "Antibiotic Guide": "spark",
  "Procedure Guide": "check", "Poisoning & Snakebite": "alert", "Infusions": "drop", "ABG Interpreter": "line",
  "Dose Converter": "scale", "PG Logbook": "write", "Follow-ups": "calendar", "Discharge Summary": "write",
  "Shift Handover": "flow", "Differential Builder": "check", "Exam Study Planner": "calendar", "Today": "sunmoon",
  "Cadus Crew": "orbit", "Crew Huddle": "orbit", "Rx Safety Check": "shield", "Med Reconciliation": "pill",
  "Clinical Pathways": "chain", "Consult Translator": "chat", "Report Explainer": "scan", "Compare over time": "line",
  "Guideline Watch": "spark", "Case Simulator": "pulse", "Presentation Coach": "mic", "Flashcards": "cards",
};

/** The picture for a card: by its title, or by what the title says for a card added later. */
export function fxFor(title: string): FxKind {
  if (BY_TITLE[title]) return BY_TITLE[title];
  const t = title.toLowerCase();
  if (/voice|audio|podcast|natural/.test(t)) return "wave";
  if (/message|translat|viva|osce|debate|chat/.test(t)) return "chat";
  if (/ecg|heart|simulat|pregnan/.test(t)) return "pulse";
  if (/analytic|statistic/.test(t)) return "chart";
  if (/trend|compare|abg/.test(t)) return "line";
  if (/image|photo|scan|report|reader/.test(t)) return "scan";
  if (/crew|huddle|assistant/.test(t)) return "orbit";
  if (/queue|token/.test(t)) return "queue";
  if (/roster|planner|follow|calendar|daily|today/.test(t)) return "calendar";
  if (/letter|certificate|referral/.test(t)) return "envelope";
  if (/record|file/.test(t)) return "folder";
  if (/flashcard|revision|note/.test(t)) return "cards";
  if (/safety|check|guard/.test(t)) return "shield";
  if (/pathway|playbook|sequence/.test(t)) return "chain";
  if (/generic|pill|medicine|drug|rx/.test(t)) return "pill";
  if (/dose|weight|convert/.test(t)) return "scale";
  if (/prescription|summary|logbook|writer/.test(t)) return "write";
  return "spark";
}

const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

export default function LiveFx({ kind, seed = 0 }: { kind: FxKind; seed?: number }) {
  const d = (n: number) => delay(-((seed * 0.37 + n * 0.53) % 4));
  const svg = (children: React.ReactNode) => <svg viewBox="0 0 240 96" preserveAspectRatio="xMaxYMax meet" className="hx">{children}</svg>;
  let art: React.ReactNode = null;
  switch (kind) {
    case "pulse": art = svg(<><path className="hx-o ghost" d="M0 60 H70 L80 60 L88 40 L96 74 L106 22 L116 68 L124 60 H170 L178 54 L186 60 H240" /><path className="hx-o hx-trace" style={d(0)} d="M0 60 H70 L80 60 L88 40 L96 74 L106 22 L116 68 L124 60 H170 L178 54 L186 60 H240" /></>); break;
    case "wave": art = <span className="fx-bars">{Array.from({ length: 14 }, (_, i) => <i key={i} style={d(i)} />)}</span>; break;
    case "scan": art = svg(<><rect className="hx-o" x="96" y="8" width="120" height="80" rx="8" /><path className="hx-o thin" d="M108 76 L138 46 L156 62 L174 40 L204 76" /><circle className="hx-f soft" cx="190" cy="26" r="7" /><rect className="hx-beam" x="97" y="8" width="118" height="14" /></>); break;
    case "orbit": art = svg(<><circle className="hx-o thin hx-dash slow" cx="160" cy="52" r="34" /><path className="hx-o thin" d="M160 52 L126 52 M160 52 L194 52 M160 52 L160 18 M160 52 L160 86" opacity=".35" /><circle className="hx-f" cx="160" cy="52" r="9" /><circle className="hx-ring" cx="160" cy="52" r="12" /><g className="hx-crew">{[[160, 18], [194, 52], [160, 86], [126, 52]].map(([x, y], i) => <g key={i}><circle className="hx-o paper" cx={x} cy={y} r="9" /><circle className="hx-f" cx={x} cy={y - 2} r="3" /><path className="hx-f" d={`M${x - 5} ${y + 6} q5 -6 10 0 z`} /></g>)}</g></>); break;
    case "flow": art = svg(<><path className="hx-o hx-dash" d="M0 74 C 50 74, 60 30, 120 30 S 190 74, 240 44" /><path className="hx-o hx-dash slow thin" d="M0 88 C 60 88, 80 52, 130 52 S 200 88, 240 66" /><circle className="hx-f" cx="120" cy="30" r="5" /><circle className="hx-f soft" cx="240" cy="44" r="5" /></>); break;
    case "spark": art = <span className="fx-dots">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ ...d(i), left: `${(i * 37 + seed * 13) % 92}%`, width: 4 + (i % 3) * 3, height: 4 + (i % 3) * 3 }} />)}</span>; break;
    case "chart": art = <span className="fx-cols">{[38, 62, 46, 80, 58, 92, 70].map((h, i) => <i key={i} style={{ ...d(i), height: `${h}%` }} />)}</span>; break;
    case "write": art = svg(<><rect className="hx-o" x="104" y="6" width="104" height="86" rx="6" /><text className="hx-t" x="114" y="28">Rx</text>{[40, 54, 68, 82].map((y, i) => <rect key={y} className="hx-f hx-type" style={delay(i * 0.55)} x="114" y={y - 4} width={[80, 66, 74, 50][i]} height="5" rx="2.5" />)}</>); break;

    case "window": art = svg(<><rect className="hx-o" x="30" y="80" width="190" height="14" rx="4" />{[44, 60, 76].map((x) => <rect key={x} className="hx-f soft" x={x} y="84" width="10" height="6" rx="1.5" />)}<rect className="hx-f hx-blink" x="96" y="83" width="14" height="8" rx="2" /><g className="hx-pop"><rect className="hx-o paper" x="92" y="8" width="128" height="62" rx="7" /><path className="hx-o thin" d="M92 22 H220" /><circle className="hx-f soft" cx="102" cy="15" r="2.5" /><circle className="hx-f soft" cx="111" cy="15" r="2.5" /><rect className="hx-f soft" x="104" y="32" width="60" height="5" rx="2.5" /><rect className="hx-f soft" x="104" y="44" width="96" height="5" rx="2.5" /><rect className="hx-f soft" x="104" y="56" width="78" height="5" rx="2.5" /></g></>); break;
    case "sync": art = svg(<><g className="hx-spin" style={{ transformOrigin: "190px 42px" }}><path className="hx-o" d="M168 42 a22 22 0 0 1 38 -15" /><path className="hx-o" d="M206 20 v8 h-8" /><path className="hx-o" d="M212 42 a22 22 0 0 1 -38 15" /><path className="hx-o" d="M174 64 v-8 h8" /></g><rect className="hx-o thin" x="40" y="78" width="160" height="8" rx="4" /><rect className="hx-f hx-fill" x="40" y="78" width="160" height="8" rx="4" /><path className="hx-o hx-tick late" d="M206 80 l5 5 l10 -11" /></>); break;
    case "account": art = svg(<><path className="hx-o hx-dash" d="M120 48 L60 30" /><path className="hx-o hx-dash" d="M120 48 L196 28" /><path className="hx-o hx-dash" d="M120 48 L196 72" /><rect className="hx-o paper hx-blink" style={delay(0)} x="40" y="20" width="36" height="22" rx="3" /><path className="hx-o" d="M34 46 h48" /><rect className="hx-o paper hx-blink" style={delay(0.7)} x="190" y="12" width="16" height="28" rx="4" /><rect className="hx-o paper hx-blink" style={delay(1.4)} x="180" y="60" width="36" height="26" rx="4" /><circle className="hx-f" cx="120" cy="40" r="8" /><path className="hx-f" d="M106 62 q14 -16 28 0 z" /></>); break;
    case "shield": art = svg(<><rect className="hx-o paper" x="64" y="6" width="76" height="86" rx="6" />{[20, 34, 48, 62, 76].map((y, i) => <rect key={y} className={`hx-f soft ${i === 2 ? "hx-flag" : ""}`} x="74" y={y} width={[52, 44, 50, 38, 46][i]} height="5" rx="2.5" />)}<rect className="hx-scanv" x="65" y="10" width="74" height="10" /><path className="hx-o paper" d="M184 14 l26 9 v20 c0 18 -13 29 -26 34 c-13 -5 -26 -16 -26 -34 v-20 z" /><path className="hx-o hx-tick" d="M173 46 l8 8 l15 -17" /></>); break;
    case "lock": art = svg(<><rect className="hx-o hx-dash slow" x="72" y="8" width="96" height="82" rx="14" /><path className="hx-o hx-shackle" d="M110 50 v-10 a10 10 0 0 1 20 0 v10" /><rect className="hx-f" x="104" y="48" width="32" height="26" rx="5" /><circle className="hx-cut" cx="120" cy="60" r="3" />{[[36, 24, "L"], [32, 64, "L"], [206, 30, "R"], [210, 70, "R"]].map(([x, y, side], i) => <circle key={i} className={`hx-f soft hx-bounce${side}`} style={delay(i * 0.6)} cx={x as number} cy={y as number} r="4" />)}</>); break;
    case "wifi": art = svg(<><path className="hx-o hx-w1" d="M108 70 Q120 60 132 70" /><path className="hx-o hx-w2" d="M96 58 Q120 38 144 58" /><path className="hx-o hx-w3" d="M84 46 Q120 16 156 46" /><circle className="hx-f" cx="120" cy="80" r="4" /><path className="hx-o hx-slash" d="M88 22 L152 86" /><circle className="hx-f hx-online" cx="176" cy="80" r="5" /></>); break;
    case "mic": art = svg(<><rect className="hx-f" x="44" y="18" width="18" height="34" rx="9" /><path className="hx-o" d="M36 42 a17 17 0 0 0 34 0 M53 60 v12 M44 74 h18" /><path className="hx-o hx-ripple" d="M78 22 q10 15 0 30" /><path className="hx-o hx-ripple late" d="M88 14 q16 23 0 46" />{[24, 40, 56, 72].map((y, i) => <rect key={y} className="hx-f hx-type" style={delay(i * 0.5)} x="110" y={y} width={[110, 92, 104, 70][i]} height="6" rx="3" />)}</>); break;
    case "devices": art = svg(<><g className="hx-dev" style={delay(0)}><rect className="hx-o paper" x="20" y="32" width="56" height="36" rx="3" /><path className="hx-o" d="M12 72 h72" /></g><g className="hx-dev" style={delay(1.2)}><rect className="hx-o paper" x="98" y="12" width="70" height="46" rx="3" /><path className="hx-o" d="M133 58 v12 M118 72 h30" /></g><g className="hx-dev" style={delay(2.4)}><rect className="hx-o paper" x="190" y="28" width="26" height="46" rx="5" /><path className="hx-o thin" d="M199 68 h8" /></g></>); break;
    case "chat": art = svg(<><g className="hx-b1"><path className="hx-o paper" d="M40 12 h96 a12 12 0 0 1 12 12 v10 a12 12 0 0 1 -12 12 h-80 l-12 10 v-10 a12 12 0 0 1 -4 -10 v-12 a12 12 0 0 1 12 -12 z" />{[0, 1, 2].map((i) => <circle key={i} className="hx-f hx-dot" style={delay(i * 0.18)} cx={72 + i * 14} cy="29" r="3.2" />)}</g><g className="hx-b2"><path className="hx-f soft2" d="M104 52 h96 a12 12 0 0 1 12 12 v8 a12 12 0 0 1 -12 12 h-4 v10 l-12 -10 h-80 a12 12 0 0 1 -12 -12 v-8 a12 12 0 0 1 12 -12 z" /><rect className="hx-f" x="114" y="62" width="72" height="5" rx="2.5" /><rect className="hx-f" x="114" y="72" width="50" height="5" rx="2.5" /></g></>); break;
    case "queue": art = svg(<><rect className="hx-o paper" x="168" y="8" width="56" height="36" rx="6" /><text className="hx-t big hx-flipn" x="196" y="34" textAnchor="middle">12</text><g className="hx-conv">{[0, 1, 2, 3, 4, 5].map((i) => <g key={i}><circle className={`hx-${i === 0 ? "f" : "o"} ${i === 0 ? "" : "paper"}`} cx={40 + i * 30} cy="74" r="10" /><path className="hx-o thin" d={`M${34 + i * 30} 92 q6 -6 12 0`} /></g>)}</g></>); break;
    case "calendar": art = svg(<><rect className="hx-o paper" x="78" y="8" width="140" height="84" rx="8" /><path className="hx-o thin" d="M78 26 H218" /><rect className="hx-f soft" x="96" y="2" width="5" height="12" rx="2" /><rect className="hx-f soft" x="194" y="2" width="5" height="12" rx="2" />{Array.from({ length: 21 }, (_, i) => <rect key={i} className="hx-cell" style={delay(i * 0.22)} x={88 + (i % 7) * 18} y={34 + Math.floor(i / 7) * 18} width="12" height="12" rx="3" />)}</>); break;
    case "sunmoon": art = svg(<><defs><clipPath id={`sky${seed}`}><rect x="0" y="0" width="240" height="78" /></clipPath></defs><path className="hx-o thin" d="M40 78 H220" /><g clipPath={`url(#sky${seed})`}><g className="hx-sky"><circle className="hx-f sun" cx="70" cy="78" r="11" /><path className="hx-f soft moon" d="M178 70 a11 11 0 1 0 12 14 a9 9 0 1 1 -12 -14 z" /></g></g>{[150, 166, 182].map((x, i) => <rect key={x} className="hx-f soft" x={x} y={86} width="10" height="5" rx="2.5" style={delay(i)} />)}</>); break;
    case "curve": art = svg(<><path className="hx-o thin" d="M20 86 H224" /><path className="hx-area" d="M24 86 C 84 86, 94 16, 122 16 S 160 86, 220 86 Z" /><path className="hx-o hx-draw" d="M24 86 C 84 86, 94 16, 122 16 S 160 86, 220 86" /><path className="hx-o thin hx-dash" d="M122 18 V86" /></>); break;
    case "line": art = svg(<><path className="hx-o thin" d="M30 86 H226 M30 86 V10" />{[[40, 70], [76, 62], [112, 66], [148, 44], [184, 34], [220, 16]].map(([x, y], i) => <circle key={i} className="hx-f hx-pt" style={delay(0.35 * i)} cx={x} cy={y} r="4" />)}<path className="hx-o hx-draw" d="M40 70 L76 62 L112 66 L148 44 L184 34 L220 16" /></>); break;
    case "cards": art = svg(<><rect className="hx-o paper" x="118" y="20" width="96" height="62" rx="8" transform="rotate(6 166 51)" /><g className="hx-flip"><rect className="hx-o paper" x="104" y="14" width="96" height="62" rx="8" /><text className="hx-t big front" x="152" y="52" textAnchor="middle">?</text><path className="hx-o hx-tick back" d="M140 46 l8 8 l16 -18" /></g></>); break;
    case "envelope": art = svg(<><rect className="hx-o paper hx-out" x="98" y="18" width="84" height="56" rx="3" /><rect className="hx-f soft hx-out" x="108" y="28" width="50" height="4" rx="2" /><rect className="hx-f soft hx-out" x="108" y="38" width="62" height="4" rx="2" /><rect className="hx-o paper" x="84" y="44" width="112" height="48" rx="6" /><path className="hx-o hx-flap" d="M84 46 L140 76 L196 46" /></>); break;
    case "phone": art = svg(<><g className="hx-shake"><path className="hx-f" d="M108 36 c-6 6 -6 20 6 34 c12 14 26 16 32 10 l6 -6 c2 -2 2 -5 0 -7 l-10 -8 c-2 -2 -5 -2 -7 0 l-4 4 c-6 -2 -14 -10 -16 -16 l4 -4 c2 -2 2 -5 0 -7 l-8 -10 c-2 -2 -5 -2 -7 0 z" /></g><path className="hx-o hx-ripple" d="M158 30 q10 10 0 22" /><path className="hx-o hx-ripple late" d="M170 20 q18 20 0 42" /><path className="hx-o hx-ripple later" d="M182 10 q26 30 0 62" /></>); break;
    case "book": art = svg(<><path className="hx-o paper" d="M64 18 h56 v66 h-56 z" /><path className="hx-o paper" d="M120 18 h56 v66 h-56 z" />{[30, 40, 50, 60].map((y) => <rect key={y} className="hx-f soft" x="72" y={y} width="38" height="4" rx="2" />)}<g className="hx-turn"><path className="hx-o paper" d="M120 18 h56 v66 h-56 z" />{[30, 40, 50].map((y) => <rect key={y} className="hx-f soft" x="130" y={y} width="38" height="4" rx="2" />)}</g></>); break;
    case "pill": art = svg(<><g className="hx-half l"><path className="hx-o paper" d="M120 32 h-22 a16 16 0 0 0 0 32 h22 z" /><path className="hx-f soft" d="M120 32 h-22 a16 16 0 0 0 0 32 h22 z" /></g><g className="hx-half r"><path className="hx-f" d="M120 32 h22 a16 16 0 0 1 0 32 h-22 z" /></g><path className="hx-o hx-tick late" d="M184 50 l7 7 l14 -16" /><text className="hx-t" x="40" y="88">brand</text><text className="hx-t" x="150" y="88">generic</text></>); break;
    case "folder": art = svg(<><path className="hx-o paper" d="M70 30 h36 l8 -10 h56 a6 6 0 0 1 6 6 v62 a6 6 0 0 1 -6 6 h-100 a6 6 0 0 1 -6 -6 v-52 a6 6 0 0 1 6 -6 z" />{[0, 1, 2].map((i) => <rect key={i} className="hx-o paper hx-page" style={delay(i * 0.8)} x={86 + i * 6} y="34" width="70" height="48" rx="3" />)}<path className="hx-f soft" d="M64 50 h118 l-6 44 h-106 z" /></>); break;
    case "drop": art = svg(<><rect className="hx-o paper" x="108" y="2" width="28" height="30" rx="7" /><rect className="hx-f soft hx-level" x="110" y="12" width="24" height="18" rx="5" /><path className="hx-o thin" d="M122 32 v10" /><rect className="hx-o paper" x="114" y="42" width="16" height="26" rx="4" /><path className="hx-f hx-fall" d="M122 46 c-3 4 -4 6 -4 8 a4 4 0 0 0 8 0 c0 -2 -1 -4 -4 -8 z" /><path className="hx-o thin hx-dash" d="M122 68 C 122 84, 170 84, 210 90" /></>); break;
    case "check": art = svg(<>{[18, 42, 66].map((y, i) => <g key={y}><rect className="hx-o paper" x="80" y={y} width="16" height="16" rx="4" /><path className="hx-o hx-tick" style={delay(i * 0.8)} d={`M84 ${y + 8} l3 4 l6 -8`} /><rect className="hx-f soft" x="106" y={y + 5} width={[96, 80, 104][i]} height="6" rx="3" /></g>)}</>); break;
    case "scale": art = svg(<><path className="hx-o" d="M120 26 V84 M98 88 h44" /><g className="hx-beam2"><path className="hx-o" d="M70 30 H170" /><path className="hx-o thin" d="M78 30 l-12 26 h24 z M162 30 l-12 26 h24 z" /><circle className="hx-f" cx="78" cy="50" r="7" /><rect className="hx-f soft" x="152" y="44" width="20" height="10" rx="3" /></g><circle className="hx-f" cx="120" cy="26" r="4" /></>); break;
    case "timer": art = svg(<><circle className="hx-o paper" cx="70" cy="52" r="30" /><path className="hx-o" d="M64 18 h12 M70 18 v4" /><path className="hx-o hx-hand" d="M70 52 V30" />{Array.from({ length: 12 }, (_, i) => <circle key={i} className="hx-bub" style={delay(i * 0.3)} cx={130 + (i % 4) * 22} cy={30 + Math.floor(i / 4) * 22} r="7" />)}</>); break;
    case "alert": art = svg(<><circle className="hx-ring" cx="150" cy="54" r="30" /><path className="hx-o paper" d="M150 18 L184 78 H116 Z" /><path className="hx-o hx-bang" d="M150 40 V60 M150 68 v1" /></>); break;
    case "chain": art = svg(<>{[24, 98, 172].map((x, i) => <rect key={x} className="hx-o paper hx-node" style={delay(i * 0.7)} x={x} y="34" width="48" height="28" rx="7" />)}<path className="hx-o hx-dash" d="M72 48 H98 M146 48 H172" /><path className="hx-o thin" d="M92 43 l6 5 l-6 5 M166 43 l6 5 l-6 5" /></>); break;
    case "letters": art = svg(<>{["I", "G", "E", "T", "S"].map((c, i) => <text key={i} className="hx-letter" style={delay(i * 0.45)} x={88 + i * 28} y="64" textAnchor="middle">{c}</text>)}<path className="hx-o thin" d="M74 76 H216" /></>); break;
    case "blocks": art = svg(<>{[[150, 70], [176, 70], [202, 70], [163, 48], [189, 48], [176, 26]].map(([x, y], i) => <rect key={i} className="hx-f hx-block" style={delay(i * 0.4)} x={x - 12} y={y - 10} width="22" height="20" rx="4" />)}<path className="hx-o thin" d="M120 82 H226" /></>); break;
  }
  return <span className={`fx fx-${kind}`} aria-hidden="true">{art}<span className="fx-glow" style={d(3)} /></span>;
}

/** The styles, for the page's style block. */
export const FX_CSS = `
.ax .fx-card{position:relative;overflow:hidden;isolation:isolate}
.ax .fx-card>:not(.fx){position:relative;z-index:1}
.ax .hood .fx-card{padding-bottom:104px}
.ax .new-grid .fx-card{padding-bottom:104px}
.ax .fx{position:absolute;inset:auto 0 0 auto;width:100%;height:104px;z-index:0;pointer-events:none;opacity:.6;color:var(--teal);transition:opacity .4s ease}
.ax .fx-card:hover .fx{opacity:1}
.ax .fx *{animation-play-state:paused}
.ax .live .fx *{animation-play-state:running}
.ax .fx .hx{position:absolute;right:14px;bottom:10px;width:min(240px,88%);height:96px;overflow:visible}
.ax .fx .hx *{transform-box:fill-box;transform-origin:center}
.ax .hx-o{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ax .hx-o.thin{stroke-width:1.2;opacity:.6}
.ax .hx-o.ghost{opacity:.14}
.ax .hx-o.paper{fill:#fff}
.ax .hx-f{fill:currentColor;opacity:.55}
.ax .hx-f.soft{opacity:.22}
.ax .hx-f.soft2{opacity:.12}
.ax .hx-t{fill:currentColor;opacity:.55;font:600 11px/1 Inter,system-ui,sans-serif}
.ax .hx-t.big{font-size:20px;opacity:.7}
.ax .fx-glow{position:absolute;right:-20%;bottom:-60%;width:80%;height:200%;border-radius:50%;background:radial-gradient(closest-side,rgba(43,122,111,.12),transparent);animation:fxDrift 9s ease-in-out infinite alternate}
/* generic motifs */
.ax .hx-trace{stroke-dasharray:90 400;animation:fxTrace 3.2s linear infinite}
.ax .fx-bars{position:absolute;inset:auto 18px 16px auto;display:flex;align-items:flex-end;gap:5px;height:64px}
.ax .fx-bars i{width:4px;height:100%;border-radius:3px;background:currentColor;opacity:.4;transform-origin:bottom;animation:fxEq 1.4s ease-in-out infinite}
.ax .fx-bars i:nth-child(3n){animation-duration:1.1s}.ax .fx-bars i:nth-child(4n+1){animation-duration:1.7s}
.ax .hx-beam{fill:rgba(43,122,111,.18);animation:hxScan 3.2s ease-in-out infinite}
.ax .fx-orbits{position:absolute;right:16%;bottom:-62px;width:150px;height:150px}
.ax .fx-orbits i{position:absolute;inset:0;border:1px dashed rgba(43,122,111,.35);border-radius:50%;animation:fxSpin 12s linear infinite}
.ax .fx-orbits i:nth-child(2){inset:22px;animation-duration:8s;animation-direction:reverse}
.ax .fx-orbits i:nth-child(3){inset:46px;animation-duration:5s}
.ax .fx-orbits b{position:absolute;top:-4px;left:calc(50% - 4px);width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.7}
.ax .hx-dash{stroke-dasharray:6 8;animation:fxDash 1.8s linear infinite}
.ax .hx-dash.slow{animation-duration:4s}
.ax .fx-dots i{position:absolute;bottom:-8px;border-radius:50%;background:currentColor;opacity:0;animation:fxRise 5s ease-in infinite}
.ax .fx-dots i:nth-child(2n){animation-duration:6.5s}.ax .fx-dots i:nth-child(3n){animation-duration:4.2s}
.ax .fx-cols{position:absolute;inset:auto 18px 0 auto;display:flex;align-items:flex-end;gap:7px;height:78px}
.ax .fx-cols i{width:10px;border-radius:3px 3px 0 0;background:linear-gradient(to top,rgba(43,122,111,.45),rgba(43,122,111,.1));transform-origin:bottom;animation:fxGrow 3s ease-in-out infinite}
.ax .hx-type{transform-origin:left!important;animation:hxType 4.4s cubic-bezier(.6,0,.3,1) infinite}
/* pictures */
.ax .hx-pop{transform-origin:24% 120%!important;animation:hxPop 5s cubic-bezier(.2,.8,.2,1) infinite}
.ax .hx-blink{animation:hxBlink 5s ease-in-out infinite}
.ax .fx-sync .hx-spin{transform-box:view-box;animation:fxSpin 2.4s linear infinite}
.ax .hx-fill{transform-origin:left!important;animation:hxFill 4s ease-in-out infinite}
.ax .hx-tick{stroke-dasharray:40;stroke-dashoffset:40;stroke-width:2.4;animation:hxTick 3.6s ease-in-out infinite}
.ax .hx-tick.late{animation-name:hxTickLate;animation-duration:4s}
.ax .hx-scanv{fill:rgba(43,122,111,.16);animation:hxScanDoc 3.6s ease-in-out infinite}
.ax .hx-flag{animation:hxFlag 3.6s ease-in-out infinite}
.ax .hx-shackle{animation:hxShackle 4s ease-in-out infinite}
.ax .hx-cut{fill:#fff}
.ax .hx-bounceL{animation:hxBounceL 2.8s ease-in-out infinite}
.ax .hx-bounceR{animation:hxBounceR 2.8s ease-in-out infinite}
.ax .hx-w1,.ax .hx-w2,.ax .hx-w3{animation:hxWifi 4.8s ease-in-out infinite}
.ax .hx-w2{animation-delay:.25s}.ax .hx-w3{animation-delay:.5s}
.ax .hx-slash{stroke:#c2610c;animation:hxSlash 4.8s ease-in-out infinite}
.ax .hx-online{animation:hxOnline 4.8s ease-in-out infinite}
.ax .hx-ripple{animation:hxRipple 1.8s ease-out infinite}
.ax .hx-ripple.late{animation-delay:.3s}.ax .hx-ripple.later{animation-delay:.6s}
.ax .hx-dev{animation:hxDev 3.6s ease-in-out infinite}
.ax .hx-b1{transform-origin:10% 100%!important;animation:hxB1 5s ease-in-out infinite}
.ax .hx-b2{transform-origin:90% 100%!important;animation:hxB2 5s ease-in-out infinite}
.ax .hx-dot{animation:hxDot 1s ease-in-out infinite}
.ax .hx-conv{transform-box:view-box!important;animation:hxConv 2.6s cubic-bezier(.6,0,.3,1) infinite}
.ax .hx-flipn{animation:hxBlink 2.6s ease-in-out infinite}
.ax .hx-cell{fill:currentColor;opacity:.08;animation:hxCell 4.6s ease-in-out infinite}
.ax .hx-sky{transform-box:view-box!important;transform-origin:124px 78px!important;animation:fxSpin 10s linear infinite}
.ax .hx-sky .sun{opacity:.5}
.ax .hx-area{fill:rgba(43,122,111,.1);animation:hxArea 4s ease-in-out infinite}
.ax .hx-draw{stroke-dasharray:320;stroke-dashoffset:320;animation:hxDraw 4s ease-in-out infinite}
.ax .hx-pt{animation:hxPt 4s ease-in-out infinite}
.ax .hx-flip{animation:hxFlip 4s ease-in-out infinite}
.ax .hx-flip .back{opacity:0;animation:hxBack 4s ease-in-out infinite}
.ax .hx-flip .front{animation:hxFront 4s ease-in-out infinite}
.ax .hx-out{animation:hxLetterUp 4.4s ease-in-out infinite}
.ax .hx-flap{transform-origin:50% 0!important;animation:hxFlap 4.4s ease-in-out infinite}
.ax .hx-shake{animation:hxShake 1.8s ease-in-out infinite}
.ax .hx-turn{transform-origin:0% 50%!important;animation:hxTurn 3.6s ease-in-out infinite}
.ax .hx-half.l{animation:hxHalfL 3.6s ease-in-out infinite}
.ax .hx-half.r{animation:hxHalfR 3.6s ease-in-out infinite}
.ax .hx-page{animation:hxPage 3.6s ease-in-out infinite}
.ax .hx-level{transform-origin:50% 100%!important;animation:hxLevel 8s linear infinite}
.ax .hx-fall{animation:hxFall 1.4s ease-in infinite}
.ax .hx-beam2{transform-box:view-box!important;transform-origin:120px 30px!important;animation:hxTilt 3.4s ease-in-out infinite}
.ax .hx-hand{transform-box:view-box!important;transform-origin:70px 52px!important;animation:fxSpin 4s linear infinite}
.ax .hx-bub{fill:none;stroke:currentColor;stroke-width:1.4;opacity:.5;animation:hxBub 3.6s ease-in-out infinite}
.ax .hx-ring{fill:none;stroke:currentColor;stroke-width:1.4;animation:hxRing 2.4s ease-out infinite}
.ax .hx-bang{stroke-width:3;animation:hxBlink 1.2s ease-in-out infinite}
.ax .hx-node{animation:hxNode 2.1s ease-in-out infinite}
.ax .fx-letters .hx-letter,.ax text.hx-letter{fill:currentColor;font:700 28px/1 Inter,system-ui,sans-serif;opacity:.18;animation:hxLetter 2.25s ease-in-out infinite}
.ax .hx-crew{transform-box:view-box!important;transform-origin:160px 52px!important;animation:fxSpin 16s linear infinite}
.ax .hx-block{animation:hxBlock 4.8s cubic-bezier(.3,1.3,.5,1) infinite}
@keyframes fxTrace{from{stroke-dashoffset:490}to{stroke-dashoffset:0}}
@keyframes fxEq{0%,100%{transform:scaleY(.18)}50%{transform:scaleY(1)}}
@keyframes fxSpin{to{transform:rotate(360deg)}}
@keyframes fxDash{to{stroke-dashoffset:-28}}
@keyframes fxRise{0%{transform:translateY(0);opacity:0}15%{opacity:.45}100%{transform:translateY(-110px);opacity:0}}
@keyframes fxGrow{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
@keyframes fxDrift{from{transform:translate(0,0)}to{transform:translate(-14%,-8%)}}
@keyframes hxScan{0%{transform:translateY(0)}50%{transform:translateY(64px)}100%{transform:translateY(0)}}
@keyframes hxType{0%{transform:scaleX(0);opacity:.6}50%{transform:scaleX(1);opacity:.6}85%{transform:scaleX(1);opacity:0}100%{transform:scaleX(0);opacity:0}}
@keyframes hxPop{0%,6%{transform:scale(.08);opacity:0}22%,78%{transform:scale(1);opacity:1}94%,100%{transform:scale(.08);opacity:0}}
@keyframes hxBlink{0%,100%{opacity:.25}50%{opacity:.85}}
@keyframes hxFill{0%{transform:scaleX(0);opacity:.55}70%,85%{transform:scaleX(1);opacity:.55}100%{transform:scaleX(1);opacity:0}}
@keyframes hxTick{0%,25%{stroke-dashoffset:40}45%,85%{stroke-dashoffset:0;opacity:.9}100%{stroke-dashoffset:0;opacity:0}}
@keyframes hxTickLate{0%,65%{stroke-dashoffset:40;opacity:.9}80%,95%{stroke-dashoffset:0;opacity:.9}100%{opacity:0}}
@keyframes hxScanDoc{0%{transform:translateY(0)}50%{transform:translateY(68px)}100%{transform:translateY(0)}}
@keyframes hxFlag{0%,30%{fill:currentColor;opacity:.22}40%,60%{fill:#c2410c;opacity:.6}75%,100%{fill:currentColor;opacity:.6}}
@keyframes hxShackle{0%,40%,100%{transform:translateY(0)}55%,80%{transform:translateY(-6px)}}
@keyframes hxBounceL{0%,100%{transform:translateX(0)}50%{transform:translateX(26px)}}
@keyframes hxBounceR{0%,100%{transform:translateX(0)}50%{transform:translateX(-26px)}}
@keyframes hxWifi{0%,30%{opacity:.12}45%,100%{opacity:.85}}
@keyframes hxSlash{0%,28%{opacity:.8;stroke-dasharray:100;stroke-dashoffset:0}40%,100%{opacity:0;stroke-dashoffset:100}}
@keyframes hxOnline{0%,40%{opacity:.1}55%,100%{opacity:.75}}
@keyframes hxRipple{0%{opacity:0;transform:translateX(-6px)}30%{opacity:.8}100%{opacity:0;transform:translateX(6px)}}
@keyframes hxDev{0%,100%{transform:translateY(0);opacity:.5}20%,40%{transform:translateY(-5px);opacity:1}}
@keyframes hxB1{0%,5%{transform:scale(0);opacity:0}15%,80%{transform:scale(1);opacity:1}95%,100%{transform:scale(1);opacity:0}}
@keyframes hxB2{0%,40%{transform:scale(0);opacity:0}52%,80%{transform:scale(1);opacity:1}95%,100%{transform:scale(1);opacity:0}}
@keyframes hxDot{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes hxConv{0%,40%{transform:translateX(0)}80%,100%{transform:translateX(-30px)}}
@keyframes hxCell{0%,10%{opacity:.08}20%,80%{opacity:.5}100%{opacity:.08}}
@keyframes hxArea{0%,20%{opacity:0}60%,90%{opacity:1}100%{opacity:0}}
@keyframes hxDraw{0%{stroke-dashoffset:320}55%,85%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes hxPt{0%,10%{transform:scale(0)}25%,85%{transform:scale(1)}100%{transform:scale(0)}}
@keyframes hxFlip{0%,30%{transform:scaleX(1)}45%{transform:scaleX(0)}60%,100%{transform:scaleX(1)}}
@keyframes hxFront{0%,44%{opacity:.7}45%,100%{opacity:0}}
@keyframes hxBack{0%,44%{opacity:0;stroke-dashoffset:40}46%{opacity:.9;stroke-dashoffset:40}70%,100%{opacity:.9;stroke-dashoffset:0}}
@keyframes hxLetterUp{0%,20%{transform:translateY(26px)}50%,80%{transform:translateY(-6px)}100%{transform:translateY(26px)}}
@keyframes hxFlap{0%,20%{transform:scaleY(1)}40%,80%{transform:scaleY(-1)}100%{transform:scaleY(1)}}
@keyframes hxShake{0%,60%,100%{transform:rotate(0)}65%{transform:rotate(-10deg)}70%{transform:rotate(10deg)}75%{transform:rotate(-8deg)}80%{transform:rotate(6deg)}}
@keyframes hxTurn{0%,15%{transform:scaleX(1)}50%{transform:scaleX(-1)}85%,100%{transform:scaleX(-1);opacity:0}}
@keyframes hxHalfL{0%,100%{transform:translateX(0)}35%,55%{transform:translateX(-14px)}}
@keyframes hxHalfR{0%,100%{transform:translateX(0)}35%,55%{transform:translateX(14px)}}
@keyframes hxPage{0%,100%{transform:translateY(0)}40%,60%{transform:translateY(-14px)}}
@keyframes hxLevel{from{transform:scaleY(1)}to{transform:scaleY(.25)}}
@keyframes hxFall{0%{transform:translateY(0);opacity:.8}80%{opacity:.8}100%{transform:translateY(14px);opacity:0}}
@keyframes hxTilt{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes hxBub{0%,15%{fill:transparent}30%,80%{fill:currentColor;fill-opacity:.45}100%{fill:transparent}}
@keyframes hxRing{0%{transform:scale(.6);opacity:.6}100%{transform:scale(1.25);opacity:0}}
@keyframes hxNode{0%,100%{fill:#fff}30%,60%{fill:rgba(43,122,111,.25)}}
@keyframes hxLetter{0%,100%{opacity:.18}40%,60%{opacity:.9}}
@keyframes hxBlock{0%,5%{transform:translateY(-60px);opacity:0}20%,85%{transform:translateY(0);opacity:.55}100%{opacity:0}}
`;
