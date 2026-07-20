/* ──────────────────────────────────────────────────────────
   Subject-specific diagrams for Biochemistry, Pharmacology,
   Pathology, Physiology (extra), Microbiology, Surgery etc.
   ────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════
   1. ENZYME KINETICS — Michaelis-Menten + Inhibition
   ═══════════════════════════════════════════════════════════ */
export function EnzymeKineticsDiagram() {
  const W = 560, H = 420;
  const px = (x: number) => 60 + x * 3.8;
  const py = (v: number, vmax: number) => H - 60 - (v / vmax) * (H - 120);

  const vmax = 100;
  const km = 30;
  const pts = Array.from({ length: 100 }, (_, i) => {
    const s = i * 1.2;
    const v = (vmax * s) / (km + s);
    return `${px(s)},${py(v, vmax)}`;
  });
  const ptsComp = Array.from({ length: 100 }, (_, i) => {
    const s = i * 1.2;
    const v = (vmax * s) / (km * 3 + s);
    return `${px(s)},${py(v, vmax)}`;
  });
  const ptsNoncomp = Array.from({ length: 100 }, (_, i) => {
    const s = i * 1.2;
    const v = ((vmax * 0.6) * s) / (km + s);
    return `${px(s)},${py(v, vmax * 0.6)}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Enzyme Kinetics — Michaelis-Menten</title>
      <defs>
        <marker id="ek_arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="#6B7280" />
        </marker>
      </defs>
      <text x="280" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Enzyme Kinetics — Michaelis-Menten</text>

      {/* Axes */}
      <line x1="60" y1={H-60} x2={W-30} y2={H-60} stroke="#4B5563" strokeWidth="1.5" markerEnd="url(#ek_arrow)" />
      <line x1="60" y1={H-60} x2="60" y2="35" stroke="#4B5563" strokeWidth="1.5" markerEnd="url(#ek_arrow)" />
      <text x="295" y={H-20} textAnchor="middle" fontSize="11" fill="#6B7280">[S] Substrate concentration (mM)</text>
      <text x="22" y="230" textAnchor="middle" fontSize="11" fill="#6B7280" transform="rotate(-90,22,230)">Reaction velocity (V)</text>

      {/* Vmax line */}
      <line x1="60" y1={py(vmax, vmax)} x2={W-30} y2={py(vmax, vmax)} stroke="#22C55E" strokeWidth="1" strokeDasharray="6,4" />
      <text x={W-28} y={py(vmax, vmax)-4} fontSize="10" fill="#22C55E" textAnchor="end">Vmax</text>
      {/* Vmax/2 line */}
      <line x1="60" y1={py(vmax/2, vmax)} x2={px(km)} y2={py(vmax/2, vmax)} stroke="#6B7280" strokeWidth="0.8" strokeDasharray="4,3" />
      <line x1={px(km)} y1={py(vmax/2, vmax)} x2={px(km)} y2={H-60} stroke="#6B7280" strokeWidth="0.8" strokeDasharray="4,3" />
      <text x={px(km)} y={H-48} textAnchor="middle" fontSize="10" fill="#F59E0B">Km</text>
      <text x="58" y={py(vmax/2, vmax)+4} textAnchor="end" fontSize="10" fill="#F59E0B">Vmax/2</text>

      {/* Normal curve */}
      <polyline points={pts.join(" ")} fill="none" stroke="#00C2A8" strokeWidth="2.5" />

      {/* Competitive inhibition */}
      <polyline points={ptsComp.join(" ")} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="7,3" />

      {/* Noncompetitive inhibition */}
      <polyline points={ptsNoncomp.join(" ")} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,4" />

      {/* Legend */}
      <rect x="300" y="50" width="220" height="80" rx="6" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <line x1="310" y1="70" x2="340" y2="70" stroke="#00C2A8" strokeWidth="2.5" />
      <text x="346" y="74" fontSize="10" fill="#6B7280">Normal (no inhibitor)</text>
      <line x1="310" y1="90" x2="340" y2="90" stroke="#EF4444" strokeWidth="2" strokeDasharray="7,3" />
      <text x="346" y="94" fontSize="10" fill="#6B7280">Competitive inhibition</text>
      <line x1="310" y1="110" x2="340" y2="110" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,4" />
      <text x="346" y="114" fontSize="10" fill="#6B7280">Non-competitive inhibition</text>

      {/* Key fact */}
      <rect x="55" y="38" width="230" height="38" rx="5" fill="#1A3A2A" stroke="#22C55E" strokeWidth="0.8" />
      <text x="170" y="55" textAnchor="middle" fontSize="9" fill="#86EFAC">Km = substrate conc. at ½ Vmax</text>
      <text x="170" y="68" textAnchor="middle" fontSize="9" fill="#86EFAC">Low Km = high enzyme affinity</text>

      <text x="280" y={H-4} textAnchor="middle" fontSize="10" fill="#6B7280">Competitive inhibitor: ↑Km, Vmax unchanged · Non-competitive: ↓Vmax, Km unchanged</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   2. DNA STRUCTURE & REPLICATION
   ═══════════════════════════════════════════════════════════ */
export function DNAStructureDiagram() {
  const helixPoints: { x: number; y: number; top: boolean }[] = [];
  for (let i = 0; i <= 28; i++) {
    const y = 50 + i * 16;
    const x = 220 + Math.sin(i * 0.8) * 70;
    helixPoints.push({ x, y, top: true });
  }
  const helixPoints2: { x: number; y: number }[] = [];
  for (let i = 0; i <= 28; i++) {
    const y = 50 + i * 16;
    const x = 220 - Math.sin(i * 0.8) * 70;
    helixPoints2.push({ x, y });
  }

  return (
    <svg viewBox="0 0 560 530" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>DNA Double Helix & Base Pairing</title>
      <text x="280" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">DNA Structure & Base Pairing</text>

      {/* Backbone strands */}
      <polyline points={helixPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
      <polyline points={helixPoints2.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />

      {/* Base pairs (rungs) */}
      {Array.from({ length: 14 }, (_, i) => {
        const y = 50 + i * 32;
        const x1 = 220 + Math.sin(i * 1.6) * 70;
        const x2 = 220 - Math.sin(i * 1.6) * 70;
        const basePairs = ["A=T", "G≡C", "T=A", "C≡G", "A=T", "G≡C", "T=A", "C≡G", "A=T", "G≡C", "T=A", "C≡G", "A=T", "G≡C"];
        const bp = basePairs[i % basePairs.length];
        const isStrong = bp.includes("≡");
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={isStrong ? "#8B5CF6" : "#F59E0B"} strokeWidth="2" />
            <circle cx={x1} cy={y} r="5" fill="#3B82F6" />
            <circle cx={x2} cy={y} r="5" fill="#EF4444" />
            <text x="220" y={y+4} textAnchor="middle" fontSize="9" fontWeight="bold" fill={isStrong ? "#A78BFA" : "#FCD34D"}>{bp}</text>
          </g>
        );
      })}

      {/* Labels */}
      <text x="155" y="80" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B82F6">5' →</text>
      <text x="155" y="95" fontSize="10" fill="#3B82F6">Sense</text>
      <text x="155" y="107" fontSize="10" fill="#3B82F6">strand</text>
      <text x="285" y="80" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#EF4444">← 3'</text>
      <text x="285" y="95" fontSize="10" fill="#EF4444">Template</text>
      <text x="285" y="107" fontSize="10" fill="#EF4444">strand</text>

      {/* Arrows at bottom */}
      <text x="155" y="470" textAnchor="middle" fontSize="11" fill="#3B82F6">← 3'</text>
      <text x="285" y="470" textAnchor="middle" fontSize="11" fill="#EF4444">5' →</text>

      {/* Information panel */}
      <rect x="340" y="40" width="200" height="200" rx="8" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="440" y="60" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F1729">Base Pairs</text>
      {([
        ["Purines", "A, G (double ring)", "#F59E0B"],
        ["Pyrimidines", "C, T, U (single ring)", "#8B5CF6"],
        ["A = T", "2 hydrogen bonds", "#FCD34D"],
        ["G ≡ C", "3 hydrogen bonds", "#A78BFA"],
        ["Chargaff's Rule", "%A=%T, %G=%C", "#00C2A8"],
        ["B-DNA", "Most common form", "#86EFAC"],
        ["Antiparallel", "5'→3' / 3'→5'", "#60A5FA"],
      ] as [string, string, string][]).map(([k, v, c], i) => (
        <g key={k}>
          <circle cx="350" cy={80 + i * 22} r="3" fill={c} />
          <text x="358" y={84 + i * 22} fontSize="9" fontWeight="bold" fill={c}>{k}:</text>
          <text x="358" y={96 + i * 22} fontSize="9" fill="#6B7280">{v}</text>
        </g>
      ))}

      {/* Nucleotide structure */}
      <rect x="340" y="260" width="200" height="145" rx="8" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="440" y="278" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F1729">Nucleotide = 3 parts</text>
      {([
        ["1. Phosphate group", "#F97316"],
        ["2. Pentose sugar (deoxyribose/ribose)", "#22C55E"],
        ["3. Nitrogenous base", "#3B82F6"],
      ] as [string, string][]).map(([t, c], i) => (
        <g key={t}>
          <rect x="348" y={290 + i * 34} width="184" height="26" rx="4" fill={`${c}18`} stroke={c} strokeWidth="0.8" />
          <text x="440" y={307 + i * 34} textAnchor="middle" fontSize="9" fill={c}>{t}</text>
        </g>
      ))}
      <text x="440" y="395" textAnchor="middle" fontSize="9" fill="#6B7280">DNA vs RNA: thymine vs uracil</text>

      <text x="130" y="516" textAnchor="middle" fontSize="10" fill="#6B7280">Watson-Crick double helix model (1953)</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   3. PHARMACOKINETICS — Plasma Concentration vs Time
   ═══════════════════════════════════════════════════════════ */
export function PharmacokineticsDiagram() {
  const W = 560, H = 420;
  const margin = { left: 65, right: 30, top: 45, bottom: 65 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  const maxC = 100;
  const tmax = 1.5;
  const ka = 1.2, ke = 0.3;
  const pts = Array.from({ length: 120 }, (_, i) => {
    const t = i * 0.1;
    const c = maxC * (Math.exp(-ke * t) - Math.exp(-ka * t)) / (ka - ke) * (ka - ke);
    const x = margin.left + (t / 12) * plotW;
    const y = margin.top + plotH - (Math.max(0, c) / maxC) * plotH;
    return `${x},${y}`;
  });
  // IV bolus curve (faster peak, faster decline)
  const ptsIV = Array.from({ length: 120 }, (_, i) => {
    const t = i * 0.1;
    const c = maxC * 1.5 * Math.exp(-ke * 1.5 * t);
    const x = margin.left + (t / 12) * plotW;
    const y = margin.top + plotH - (Math.max(0, c) / maxC) * plotH;
    return `${x},${y}`;
  });
  // Multiple dose curve
  const ptsMD = Array.from({ length: 120 }, (_, i) => {
    const t = i * 0.1;
    let c = 0;
    for (let d = 0; d <= 3; d++) {
      const td = t - d * 2;
      if (td > 0) c += 60 * (Math.exp(-ke * td) - Math.exp(-ka * td)) / (ka - ke) * (ka - ke) * 0.6;
    }
    const x = margin.left + (t / 12) * plotW;
    const y = margin.top + plotH - (Math.max(0, Math.min(c, maxC)) / maxC) * plotH;
    return `${x},${y}`;
  });

  const scaleX = (t: number) => margin.left + (t / 12) * plotW;
  const scaleY = (c: number) => margin.top + plotH - (c / maxC) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Pharmacokinetics — Drug Concentration Curves</title>
      <defs>
        <marker id="pk_arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="#6B7280" />
        </marker>
      </defs>
      <text x="280" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Pharmacokinetics — Drug Concentration vs Time</text>

      {/* Axes */}
      <line x1={margin.left} y1={margin.top + plotH} x2={W - margin.right} y2={margin.top + plotH} stroke="#4B5563" strokeWidth="1.5" markerEnd="url(#pk_arrow)" />
      <line x1={margin.left} y1={margin.top + plotH} x2={margin.left} y2={margin.top} stroke="#4B5563" strokeWidth="1.5" markerEnd="url(#pk_arrow)" />
      <text x="280" y={H - 8} textAnchor="middle" fontSize="11" fill="#6B7280">Time (hours)</text>
      <text x="20" y="220" textAnchor="middle" fontSize="11" fill="#6B7280" transform="rotate(-90,20,220)">Plasma [Drug] (µg/mL)</text>

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(c => (
        <g key={c}>
          <line x1={margin.left} y1={scaleY(c)} x2={W - margin.right} y2={scaleY(c)} stroke="#E5E1D8" strokeWidth="0.8" />
          <text x={margin.left - 8} y={scaleY(c) + 4} textAnchor="end" fontSize="9" fill="#6B7280">{c}</text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map(t => (
        <g key={t}>
          <line x1={scaleX(t)} y1={margin.top + plotH} x2={scaleX(t)} y2={margin.top} stroke="#E5E1D8" strokeWidth="0.8" />
          <text x={scaleX(t)} y={margin.top + plotH + 14} textAnchor="middle" fontSize="9" fill="#6B7280">{t}</text>
        </g>
      ))}

      {/* Therapeutic window */}
      <rect x={margin.left} y={scaleY(70)} width={plotW} height={scaleY(30) - scaleY(70)} fill="#22C55E" fillOpacity="0.08" />
      <line x1={margin.left} y1={scaleY(70)} x2={W - margin.right} y2={scaleY(70)} stroke="#22C55E" strokeWidth="1" strokeDasharray="5,4" />
      <line x1={margin.left} y1={scaleY(30)} x2={W - margin.right} y2={scaleY(30)} stroke="#F59E0B" strokeWidth="1" strokeDasharray="5,4" />
      <text x={W - 32} y={scaleY(70) - 4} fontSize="9" fill="#22C55E" textAnchor="end">MTC</text>
      <text x={W - 32} y={scaleY(30) + 12} fontSize="9" fill="#F59E0B" textAnchor="end">MEC</text>
      <text x={W - 26} y={scaleY(50)} fontSize="10" fontWeight="bold" fill="#00C2A8" textAnchor="end">Therapeutic</text>
      <text x={W - 26} y={scaleY(50) + 12} fontSize="9" fill="#00C2A8" textAnchor="end">Window</text>

      {/* IV curve */}
      <polyline points={ptsIV.join(" ")} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="6,3" />
      {/* Oral curve */}
      <polyline points={pts.join(" ")} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
      {/* Multiple dose */}
      <polyline points={ptsMD.join(" ")} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4,3" />

      {/* Cmax and Tmax markers */}
      {(() => {
        const tmaxPt = 1.5;
        const cmaxPt = 68;
        return (
          <>
            <line x1={scaleX(tmaxPt)} y1={scaleY(cmaxPt)} x2={scaleX(tmaxPt)} y2={margin.top + plotH} stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="3,2" />
            <line x1={margin.left} y1={scaleY(cmaxPt)} x2={scaleX(tmaxPt)} y2={scaleY(cmaxPt)} stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="3,2" />
            <text x={scaleX(tmaxPt)} y={margin.top + plotH + 28} textAnchor="middle" fontSize="9" fill="#60A5FA">Tmax</text>
            <text x={margin.left - 8} y={scaleY(cmaxPt) + 4} textAnchor="end" fontSize="9" fill="#60A5FA">Cmax</text>
          </>
        );
      })()}

      {/* t1/2 arrow */}
      <line x1={scaleX(3)} y1={scaleY(55)} x2={scaleX(5.3)} y2={scaleY(28)} stroke="#EF4444" strokeWidth="0.8" strokeDasharray="2,2" />
      <text x={scaleX(4.8)} y={scaleY(42)} fontSize="9" fill="#FCA5A5">t½</text>

      {/* Legend */}
      <rect x={margin.left + 5} y={margin.top + 5} width="195" height="75" rx="5" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <line x1={margin.left + 15} y1={margin.top + 22} x2={margin.left + 45} y2={margin.top + 22} stroke="#EF4444" strokeWidth="2" strokeDasharray="6,3" />
      <text x={margin.left + 50} y={margin.top + 26} fontSize="10" fill="#6B7280">IV Bolus</text>
      <line x1={margin.left + 15} y1={margin.top + 42} x2={margin.left + 45} y2={margin.top + 42} stroke="#3B82F6" strokeWidth="2.5" />
      <text x={margin.left + 50} y={margin.top + 46} fontSize="10" fill="#6B7280">Oral (single dose)</text>
      <line x1={margin.left + 15} y1={margin.top + 62} x2={margin.left + 45} y2={margin.top + 62} stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4,3" />
      <text x={margin.left + 50} y={margin.top + 66} fontSize="10" fill="#6B7280">Multiple doses</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   4. LUNG VOLUMES — Spirometry
   ═══════════════════════════════════════════════════════════ */
export function LungVolumesDiagram() {
  const W = 560, H = 440;
  const baseY = 360;

  const wave = (x: number) => Math.sin(x * 0.12) * 18;

  const tvPts: string[] = [];
  const vcPts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = 60 + i * 2;
    const y = baseY - 30 + wave(i * 0.8);
    tvPts.push(`${x},${y}`);
  }
  // Deep inhalation
  const inspirePts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = 300 + i * 2;
    const y = baseY - 30 - i * 1.8 + wave(i * 0.8);
    inspirePts.push(`${x},${y}`);
  }
  // Deep exhalation
  const expirePts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = 420 + i * 2;
    const y = (baseY - 30 - 108) + i * 3.2 + wave(i * 0.8);
    expirePts.push(`${x},${y}`);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Lung Volumes & Capacities — Spirometry</title>
      <defs>
        <marker id="lv_arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 Z" fill="#6B7280" />
        </marker>
      </defs>
      <text x="280" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Lung Volumes & Capacities — Spirometry</text>

      {/* Background zones */}
      {/* IRV */}
      <rect x="55" y="140" width="480" height="108" fill="#3B82F6" fillOpacity="0.06" />
      {/* TV */}
      <rect x="55" y="248" width="480" height="112" fill="#22C55E" fillOpacity="0.06" />
      {/* ERV */}
      <rect x="55" y="360" width="480" height="72" fill="#F59E0B" fillOpacity="0.07" />
      {/* RV (cannot be expired) */}
      <rect x="55" y="380" width="480" height="52" fill="#EF4444" fillOpacity="0.07" />

      {/* Reference lines */}
      {([
        [140, "#3B82F6", "IRV top"],
        [248, "#3B82F6", "IRV/TV boundary"],
        [360, "#F59E0B", "ERV top / FRC"],
        [412, "#EF4444", "RV top"],
      ] as [number, string, string][]).map(([y, c]) => (
        <line key={y} x1="55" y1={y} x2="535" y2={y} stroke={c} strokeWidth="0.8" strokeDasharray="5,4" />
      ))}

      {/* Spirometry tracing */}
      {/* Normal breathing */}
      <polyline points={tvPts.join(" ")} fill="none" stroke="#00C2A8" strokeWidth="2" />
      {/* Deep breath in */}
      <polyline points={inspirePts.join(" ")} fill="none" stroke="#00C2A8" strokeWidth="2" />
      {/* Deep breath out */}
      <polyline points={expirePts.join(" ")} fill="none" stroke="#00C2A8" strokeWidth="2" />
      {/* Continue normal after */}
      {(() => {
        const contPts: string[] = [];
        for (let i = 0; i <= 30; i++) {
          const x = 540 + i * 0.7;
          const y = baseY - 30 + wave(i * 0.8);
          contPts.push(`${x},${y}`);
        }
        return <polyline points={contPts.join(" ")} fill="none" stroke="#00C2A8" strokeWidth="2" />;
      })()}

      {/* Residual volume fill */}
      <rect x="55" y="412" width="480" height="40" fill="#EF4444" fillOpacity="0.12" />

      {/* Volume labels */}
      {([
        [186, "IRV", "Inspiratory Reserve Volume", "#60A5FA", "~3000 mL"],
        [300, "TV", "Tidal Volume", "#86EFAC", "~500 mL"],
        [382, "ERV", "Expiratory Reserve Volume", "#FCD34D", "~1200 mL"],
        [430, "RV", "Residual Volume", "#FCA5A5", "~1200 mL (cannot expire)"],
      ] as [number, string, string, string, string][]).map(([y, abbr, name, c, val]) => (
        <g key={abbr}>
          <text x="540" y={y} fontSize="11" fontWeight="bold" fill={c}>{abbr}</text>
          <line x1="536" y1={y - 2} x2="526" y2={y - 2} stroke={c} strokeWidth="0.8" />
        </g>
      ))}

      {/* Capacity brackets */}
      {([
        [140, 248, "IC", "#3B82F6"],  // Inspiratory capacity (IRV+TV)
        [248, 412, "FRC", "#F97316"], // FRC (ERV+RV)
        [140, 360, "VC", "#22C55E"],  // Vital capacity
        [140, 412, "TLC", "#0F1729"], // TLC
      ] as [number, number, string, string][]).map(([y1, y2, label, c]) => (
        <g key={label}>
          <line x1="52" y1={y1} x2="52" y2={y2} stroke={c} strokeWidth="1.5" />
          <line x1="48" y1={y1} x2="56" y2={y1} stroke={c} strokeWidth="1.5" />
          <line x1="48" y1={y2} x2="56" y2={y2} stroke={c} strokeWidth="1.5" />
          <text x="40" y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill={c}>{label}</text>
        </g>
      ))}

      {/* X-axis label */}
      <text x="280" y="425" textAnchor="middle" fontSize="10" fill="#6B7280">Time (seconds)</text>
      <line x1="55" y1="415" x2="535" y2="415" stroke="#4B5563" strokeWidth="1" />

      <text x="280" y={H - 4} textAnchor="middle" fontSize="10" fill="#6B7280">TLC ≈ 6L · VC ≈ 4.8L · FRC ≈ 2.4L · RV ≈ 1.2L (average adult male)</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   5. INFLAMMATION — Acute vs Chronic
   ═══════════════════════════════════════════════════════════ */
export function InflammationDiagram() {
  const phases = [
    { label: "Injury / Trigger", x: 55, color: "#EF4444", events: ["Trauma/infection/ischemia", "Tissue damage → DAMPs/PAMPs"] },
    { label: "Vascular Phase\n(minutes–hours)", x: 175, color: "#F97316", events: ["Vasodilation → ↑blood flow", "↑Permeability → edema", "Exudate formation"] },
    { label: "Cellular Phase\n(hours–days)", x: 295, color: "#F59E0B", events: ["Neutrophil margination", "Chemotaxis (IL-8, C5a)", "Phagocytosis of pathogens"] },
    { label: "Resolution\n(days–weeks)", x: 415, color: "#22C55E", events: ["Macrophage cleanup", "Tissue repair", "Return to homeostasis"] },
  ];

  return (
    <svg viewBox="0 0 560 460" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Inflammation — Acute to Chronic Progression</title>

      <text x="280" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Acute Inflammation — Phases</text>

      {/* Timeline arrow */}
      <line x1="55" y1="75" x2="505" y2="75" stroke="#374151" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map(i => (
        <circle key={i} cx={55 + i * 112.5} cy="75" r="6" fill={i < 4 ? phases[Math.min(i, 3)].color : "#374151"} />
      ))}
      <path d="M497,68 L509,75 L497,82 Z" fill="#374151" />
      <text x="510" y="79" fontSize="10" fill="#6B7280">Chronic</text>

      {/* Time markers */}
      {(["0h", "2-4h", "24-48h", "Days", "Weeks+"] as string[]).map((t, i) => (
        <text key={t} x={55 + i * 112.5} y="96" textAnchor="middle" fontSize="9" fill="#6B7280">{t}</text>
      ))}

      {/* Phase blocks */}
      {phases.map(({ label, x, color, events }, i) => (
        <g key={label}>
          <rect x={x} y="110" width="110" height="130" rx="8" fill={`${color}12`} stroke={color} strokeWidth="1.3" />
          {label.split("\n").map((line, li) => (
            <text key={li} x={x + 55} y={128 + li * 14} textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>{line}</text>
          ))}
          {events.map((e, ei) => (
            <text key={ei} x={x + 55} y={158 + ei * 28} textAnchor="middle" fontSize="8" fill="#6B7280">{e}</text>
          ))}
          {i < 3 && <path d={`M${x + 114},175 L${x + 125},175`} fill="none" stroke={color} strokeWidth="1.5" />}
          {i < 3 && <path d={`M${x + 121},169 L${x + 129},175 L${x + 121},181 Z`} fill={color} />}
        </g>
      ))}

      {/* Mediators */}
      <rect x="55" y="260" width="230" height="150" rx="8" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="170" y="278" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F1729">Key Mediators</text>
      {([
        ["Histamine", "↑permeability, vasodilate", "#EF4444"],
        ["Prostaglandins (PGE2)", "Pain, fever, vasodilation", "#F97316"],
        ["Leukotrienes", "Bronchospasm, ↑permeability", "#F59E0B"],
        ["TNF-α, IL-1, IL-6", "Systemic inflammatory response", "#3B82F6"],
        ["Complement (C3a, C5a)", "Opsonisation, chemotaxis", "#8B5CF6"],
      ] as [string, string, string][]).map(([med, action, c], i) => (
        <g key={med}>
          <circle cx="66" cy={294 + i * 22} r="3" fill={c} />
          <text x="74" y={298 + i * 22} fontSize="9" fontWeight="bold" fill={c}>{med}:</text>
          <text x="74" y={310 + i * 22} fontSize="8" fill="#6B7280">{action}</text>
        </g>
      ))}

      {/* Cardinal signs */}
      <rect x="305" y="260" width="230" height="150" rx="8" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="420" y="278" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F1729">Cardinal Signs (Celsus)</text>
      {([
        ["Rubor", "Redness", "↑blood flow", "#EF4444"],
        ["Calor", "Heat", "↑metabolic activity", "#F97316"],
        ["Tumor", "Swelling", "↑vascular permeability", "#F59E0B"],
        ["Dolor", "Pain", "Bradykinin, PGE2", "#3B82F6"],
        ["Functio laesa", "Loss of function", "Virchow's 5th sign", "#8B5CF6"],
      ] as [string, string, string, string][]).map(([latin, eng, mech, c], i) => (
        <g key={latin}>
          <text x="316" y={296 + i * 22} fontSize="10" fontWeight="bold" fill={c} fontStyle="italic">{latin}</text>
          <text x="380" y={296 + i * 22} fontSize="9" fill="#6B7280">({eng})</text>
          <text x="316" y={308 + i * 22} fontSize="8" fill="#6B7280">{mech}</text>
        </g>
      ))}

      <text x="280" y={450} textAnchor="middle" fontSize="10" fill="#6B7280">Acute ≤2 weeks · Subacute 2-6 weeks · Chronic 6+ weeks</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   6. GRAM STAIN + BACTERIAL CLASSIFICATION
   (Enhanced from existing GramStainTree)
   ═══════════════════════════════════════════════════════════ */
export function BacterialClassificationDiagram() {
  return (
    <svg viewBox="0 0 620 480" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Bacterial Cell Structure — Gram +ve vs −ve</title>

      <text x="310" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Gram +ve vs Gram −ve Cell Wall</text>

      {/* Gram Positive */}
      <rect x="20" y="38" width="280" height="260" rx="10" fill="#3B82F612" stroke="#3B82F6" strokeWidth="1.5" />
      <text x="160" y="58" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#60A5FA">Gram Positive (+)</text>
      <text x="160" y="74" textAnchor="middle" fontSize="10" fill="#6B7280">Stains purple (crystal violet retained)</text>

      {/* Gram positive cell wall layers */}
      {([
        [80, 16, "#F59E0B", "Thick Peptidoglycan (20-80 nm)", "Main layer, ~90% of wall"],
        [100, 12, "#22C55E", "Teichoic Acid", "Unique to Gram +ve"],
        [116, 10, "#3B82F6", "Cytoplasmic Membrane", "Phospholipid bilayer"],
      ] as [number, number, string, string, string][]).map(([y, h, c, name, desc]) => (
        <g key={name}>
          <rect x="40" y={y + 30} width="240" height={h} rx="3" fill={c} fillOpacity="0.25" stroke={c} strokeWidth="1" />
          <text x="280" y={y + 30 + h / 2 + 4} fontSize="9" fontWeight="bold" fill={c}>{name}</text>
          <text x="280" y={y + 30 + h / 2 + 16} fontSize="8" fill="#6B7280">{desc}</text>
        </g>
      ))}

      {/* Cytoplasm */}
      <rect x="40" y="160" width="240" height="80" rx="5" fill="#F5F3EE" stroke="#374151" strokeWidth="1" />
      <text x="160" y="196" textAnchor="middle" fontSize="11" fill="#6B7280">CYTOPLASM</text>
      {/* Ribosome dots */}
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={60 + i * 26} cy="208" r="4" fill="#8B5CF6" fillOpacity="0.6" />)}
      <text x="160" y="225" textAnchor="middle" fontSize="9" fill="#8B5CF6">70S ribosomes</text>

      {/* G+ examples */}
      <rect x="40" y="250" width="240" height="36" rx="5" fill="#1A3A2A" stroke="#22C55E" strokeWidth="0.8" />
      <text x="160" y="265" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#86EFAC">Examples:</text>
      <text x="160" y="279" textAnchor="middle" fontSize="9" fill="#6B7280">Staph, Strep, Clostridium, Bacillus, Listeria</text>

      {/* Gram Negative */}
      <rect x="320" y="38" width="280" height="260" rx="10" fill="#EF444412" stroke="#EF4444" strokeWidth="1.5" />
      <text x="460" y="58" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#FCA5A5">Gram Negative (−)</text>
      <text x="460" y="74" textAnchor="middle" fontSize="10" fill="#6B7280">Stains pink (decolorized, counterstain)</text>

      {([
        [80, 8, "#EF4444", "Outer Membrane", "Contains LPS (endotoxin)"],
        [92, 10, "#F97316", "Thin Peptidoglycan (2-7 nm)", "Only 10% of wall"],
        [106, 8, "#F59E0B", "Periplasmic Space", "Contains β-lactamases"],
        [118, 10, "#3B82F6", "Inner Membrane", "Phospholipid bilayer"],
      ] as [number, number, string, string, string][]).map(([y, h, c, name, desc]) => (
        <g key={name}>
          <rect x="340" y={y + 30} width="240" height={h} rx="3" fill={c} fillOpacity="0.25" stroke={c} strokeWidth="1" />
          <text x="582" y={y + 30 + h / 2 + 4} fontSize="9" fontWeight="bold" fill={c}>{name}</text>
          <text x="582" y={y + 30 + h / 2 + 16} fontSize="8" fill="#6B7280">{desc}</text>
        </g>
      ))}

      {/* LPS detail */}
      <path d="M340,112 C320,96 320,80 340,68" fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2" />
      <text x="290" y="93" fontSize="8" fill="#EF4444" textAnchor="middle">LPS /</text>
      <text x="290" y="104" fontSize="8" fill="#EF4444" textAnchor="middle">Endotoxin</text>

      <rect x="340" y="160" width="240" height="80" rx="5" fill="#F5F3EE" stroke="#374151" strokeWidth="1" />
      <text x="460" y="196" textAnchor="middle" fontSize="11" fill="#6B7280">CYTOPLASM</text>
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={360 + i * 26} cy="208" r="4" fill="#8B5CF6" fillOpacity="0.6" />)}
      <text x="460" y="225" textAnchor="middle" fontSize="9" fill="#8B5CF6">70S ribosomes</text>

      <rect x="340" y="250" width="240" height="36" rx="5" fill="#3A1010" stroke="#EF4444" strokeWidth="0.8" />
      <text x="460" y="265" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FCA5A5">Examples:</text>
      <text x="460" y="279" textAnchor="middle" fontSize="9" fill="#6B7280">E. coli, Klebsiella, Pseudomonas, Salmonella, H. pylori</text>

      {/* Clinical significance table */}
      <rect x="20" y="315" width="580" height="130" rx="8" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="310" y="333" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F1729">Clinical Significance</text>
      {([
        ["Feature", "Gram +ve", "Gram −ve"],
        ["Antibiotic sensitivity", "Penicillins (thin PG)", "Broader spectrum needed"],
        ["Endotoxin", "None", "LPS → septic shock"],
        ["Exotoxin", "Common", "Less common"],
        ["Treatment", "Beta-lactams, Vancomycin", "Cephalosporins, Carbapenems"],
      ] as string[][]).map((row, i) => (
        <g key={i}>
          {row.map((cell, j) => (
            <text key={j} x={30 + j * 192} y={352 + i * 18} fontSize={i === 0 ? "10" : "9"}
              fontWeight={i === 0 ? "bold" : "normal"}
              fill={i === 0 ? "#6B7280" : j === 1 ? "#60A5FA" : j === 2 ? "#FCA5A5" : "#6B7280"}>{cell}</text>
          ))}
        </g>
      ))}
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   7. METABOLIC PATHWAYS — Overview
   ═══════════════════════════════════════════════════════════ */
export function MetabolicPathwaysDiagram() {
  const box = (x: number, y: number, label: string, sub: string, c: string) => (
    <g>
      <rect x={x - 55} y={y - 20} width="110" height="40" rx="8" fill={`${c}18`} stroke={c} strokeWidth="1.4" />
      <text x={x} y={y - 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill={c}>{label}</text>
      <text x={x} y={y + 13} textAnchor="middle" fontSize="8" fill="#6B7280">{sub}</text>
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number, label: string, c: string) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1.5" markerEnd="url(#mp_arrow)" />
      {label && <text x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2 + 4} fontSize="9" fill={c}>{label}</text>}
    </g>
  );

  return (
    <svg viewBox="0 0 620 500" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Metabolic Pathways Overview</title>
      <defs>
        <marker id="mp_arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 Z" fill="#6B7280" />
        </marker>
      </defs>
      <text x="310" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Core Metabolic Pathways — Overview</text>

      {/* Input nodes */}
      {box(100, 70, "Carbohydrates", "Glucose, Glycogen", "#3B82F6")}
      {box(310, 70, "Lipids", "Fatty acids, TG", "#F59E0B")}
      {box(520, 70, "Proteins", "Amino acids", "#8B5CF6")}

      {/* Glycolysis */}
      {box(100, 165, "Glycolysis", "Cytoplasm · 10 steps", "#22C55E")}
      {arrow(100, 90, 100, 145, "", "#3B82F6")}
      {/* ATP yield label */}
      <text x="116" y="130" fontSize="9" fill="#22C55E">2 ATP net</text>

      {/* Glycogen storage */}
      {box(100, 260, "Pyruvate", "Anaerobic → Lactate", "#F97316")}
      {arrow(100, 185, 100, 240, "", "#22C55E")}

      {/* Acetyl-CoA */}
      {box(310, 260, "Acetyl-CoA", "Key crossroads", "#00C2A8")}
      {arrow(100, 280, 250, 260, "Pyruvate DH", "#F97316")}
      {arrow(310, 90, 310, 240, "β-oxidation", "#F59E0B")}
      {arrow(520, 90, 380, 245, "Transamination", "#8B5CF6")}

      {/* TCA Cycle */}
      {box(310, 355, "TCA Cycle", "Krebs · Mitochondria", "#EF4444")}
      {arrow(310, 280, 310, 335, "", "#00C2A8")}
      {/* Yields */}
      <text x="326" y="318" fontSize="9" fill="#EF4444">3 NADH, 1 FADH2</text>
      <text x="326" y="330" fontSize="9" fill="#EF4444">1 GTP, 2 CO2</text>

      {/* ETC */}
      {box(310, 445, "ETC / ATP Synthase", "Mitochondria inner membrane", "#EC4899")}
      {arrow(310, 375, 310, 425, "", "#EF4444")}
      <text x="326" y="406" fontSize="9" fill="#EC4899">~32 ATP</text>
      <text x="326" y="418" fontSize="9" fill="#EC4899">NADH → 2.5 ATP</text>

      {/* Gluconeogenesis */}
      <path d="M100,240 C50,240 50,340 95,350" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="6,3" markerEnd="url(#mp_arrow)" />
      <text x="24" y="302" fontSize="9" fill="#3B82F6">Gluco-</text>
      <text x="20" y="314" fontSize="9" fill="#3B82F6">neogenesis</text>

      {/* Fatty acid synthesis */}
      <path d="M310,260 C430,260 450,160 390,120" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6,3" markerEnd="url(#mp_arrow)" />
      <text x="438" y="190" fontSize="9" fill="#F59E0B">Fatty acid</text>
      <text x="438" y="202" fontSize="9" fill="#F59E0B">synthesis</text>

      {/* Ketogenesis */}
      {box(490, 355, "Ketones", "β-hydroxybutyrate", "#F97316")}
      <path d="M365,280 C430,280 490,320 490,335" fill="none" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#mp_arrow)" />
      <text x="450" y="305" fontSize="9" fill="#F97316">Ketogenesis</text>

      {/* Legend */}
      <rect x="480" y="415" width="130" height="72" rx="6" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="545" y="432" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B7280">Location</text>
      {(["Glycolysis: cytoplasm", "TCA: mitochondria", "β-ox.: mitochondria", "Synth.: cytoplasm"] as string[]).map((t, i) => (
        <text key={t} x="488" y={448 + i * 12} fontSize="8" fill="#6B7280">{t}</text>
      ))}
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   8. NEPHRON — Renal Tubule Diagram
   ═══════════════════════════════════════════════════════════ */
export function NephronDiagram() {
  return (
    <svg viewBox="0 0 620 500" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Nephron — Structure & Function</title>

      <text x="310" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Nephron — Structure & Function</text>

      {/* Glomerulus */}
      <circle cx="120" cy="85" r="30" fill="none" stroke="#EF4444" strokeWidth="2" />
      <text x="120" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FCA5A5">Glomerulus</text>
      <text x="120" y="93" textAnchor="middle" fontSize="8" fill="#6B7280">Filtration</text>
      {/* Afferent / Efferent */}
      <path d="M80,72 C60,65 45,60 35,55" fill="none" stroke="#EF4444" strokeWidth="3" />
      <text x="30" y="50" fontSize="9" fill="#FCA5A5" textAnchor="middle">Afferent</text>
      <text x="30" y="62" fontSize="9" fill="#FCA5A5" textAnchor="middle">arteriole</text>
      <path d="M80,98 C60,105 45,110 35,115" fill="none" stroke="#60A5FA" strokeWidth="2" />
      <text x="30" y="108" fontSize="9" fill="#60A5FA" textAnchor="middle">Efferent</text>
      <text x="30" y="120" fontSize="9" fill="#60A5FA" textAnchor="middle">arteriole</text>
      {/* Bowman's capsule */}
      <circle cx="120" cy="85" r="44" fill="none" stroke="#F97316" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x="170" y="62" fontSize="9" fill="#FB923C">Bowman's</text>
      <text x="170" y="74" fontSize="9" fill="#FB923C">Capsule</text>

      {/* PCT */}
      <path d="M120,129 C140,150 200,150 220,130 C240,110 260,120 270,145 C280,170 240,185 220,165 C200,145 160,145 140,165 C120,185 120,210 140,215"
        fill="none" stroke="#22C55E" strokeWidth="7" strokeLinecap="round" />
      <text x="245" y="102" fontSize="10" fontWeight="bold" fill="#86EFAC">PCT</text>
      <text x="245" y="115" fontSize="9" fill="#6B7280">Proximal</text>
      <text x="245" y="127" fontSize="9" fill="#6B7280">Convoluted</text>
      <text x="245" y="139" fontSize="9" fill="#6B7280">Tubule</text>
      <line x1="245" y1="103" x2="215" y2="115" stroke="#4B5563" strokeWidth="0.8" />

      {/* PCT absorption label */}
      <rect x="295" y="90" width="150" height="60" rx="5" fill="#1A3A2A" stroke="#22C55E" strokeWidth="0.8" />
      <text x="370" y="107" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#86EFAC">PCT reabsorbs:</text>
      <text x="370" y="122" textAnchor="middle" fontSize="8" fill="#6B7280">67% of Na+, K+, Cl−, H2O</text>
      <text x="370" y="135" textAnchor="middle" fontSize="8" fill="#6B7280">All glucose, amino acids</text>
      <text x="370" y="148" textAnchor="middle" fontSize="8" fill="#6B7280">HCO3−, urea, phosphate</text>

      {/* Loop of Henle */}
      {/* Descending limb */}
      <path d="M140,215 C140,250 145,290 150,320 C155,350 165,375 175,390"
        fill="none" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />
      {/* Hairpin */}
      <path d="M175,390 C185,400 205,402 215,392 C225,380 230,360 230,330"
        fill="none" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />
      {/* Ascending limb */}
      <path d="M230,330 C230,295 232,265 235,235 C238,205 244,185 252,175"
        fill="none" stroke="#60A5FA" strokeWidth="7" strokeLinecap="round" />
      <text x="105" y="310" fontSize="10" fontWeight="bold" fill="#93C5FD">Loop of</text>
      <text x="105" y="323" fontSize="10" fontWeight="bold" fill="#93C5FD">Henle</text>
      <text x="45" y="346" fontSize="9" fill="#6B7280">↓ Limb: H2O</text>
      <text x="45" y="358" fontSize="9" fill="#6B7280">(permeable)</text>
      <text x="45" y="380" fontSize="9" fill="#60A5FA">↑ Limb: NaCl</text>
      <text x="45" y="392" fontSize="9" fill="#60A5FA">(impermeable</text>
      <text x="45" y="404" fontSize="9" fill="#60A5FA">to water)</text>

      {/* DCT */}
      <path d="M252,175 C270,160 300,155 320,165 C340,175 360,170 375,155 C390,140 395,125 385,115"
        fill="none" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
      <text x="340" y="200" fontSize="10" fontWeight="bold" fill="#FCD34D">DCT</text>
      <text x="340" y="213" fontSize="9" fill="#6B7280">Distal</text>
      <text x="340" y="225" fontSize="9" fill="#6B7280">Convoluted</text>

      <rect x="420" y="155" width="170" height="55" rx="5" fill="#2A2810" stroke="#F59E0B" strokeWidth="0.8" />
      <text x="505" y="172" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FCD34D">DCT regulated by:</text>
      <text x="505" y="187" textAnchor="middle" fontSize="8" fill="#6B7280">Aldosterone → ↑Na+ reabs</text>
      <text x="505" y="200" textAnchor="middle" fontSize="8" fill="#6B7280">PTH → ↑Ca2+ reabs</text>

      {/* Collecting Duct */}
      <path d="M385,115 C395,95 400,75 405,55 C408,42 416,38 425,40"
        fill="none" stroke="#8B5CF6" strokeWidth="7" strokeLinecap="round" />
      <text x="445" y="55" fontSize="10" fontWeight="bold" fill="#A78BFA">Collecting</text>
      <text x="445" y="68" fontSize="10" fontWeight="bold" fill="#A78BFA">Duct</text>
      <rect x="490" y="44" width="120" height="42" rx="5" fill="#1A1040" stroke="#8B5CF6" strokeWidth="0.8" />
      <text x="550" y="60" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#A78BFA">ADH → ↑H2O</text>
      <text x="550" y="75" textAnchor="middle" fontSize="8" fill="#6B7280">Aldosterone → Na+</text>

      {/* Urine arrow */}
      <path d="M425,40 C435,30 445,28 455,25" fill="none" stroke="#6B7280" strokeWidth="2" />
      <text x="472" y="22" fontSize="9" fill="#6B7280">→ Ureter</text>

      <text x="310" y="486" textAnchor="middle" fontSize="10" fill="#6B7280">Each kidney has ~1 million nephrons · Filters ~180 L/day · Excretes ~1.5 L urine</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   9. ACID-BASE BALANCE — pH Map
   ═══════════════════════════════════════════════════════════ */
export function AcidBaseDiagram() {
  const disorders = [
    { label: "Met.\nAcidosis", pH: "< 7.35", HCO3: "↓ (<22)", PCO2: "↓ (comp)", cause: "DKA, diarrhoea, renal failure", x: 55, color: "#EF4444" },
    { label: "Resp.\nAcidosis", pH: "< 7.35", HCO3: "↑ (comp)", PCO2: "↑ (>45)", cause: "COPD, hypoventilation", x: 190, color: "#F97316" },
    { label: "Normal", pH: "7.35–7.45", HCO3: "22–26", PCO2: "35–45", cause: "pH 7.40 · PaCO2 40 · HCO3 24", x: 325, color: "#22C55E" },
    { label: "Resp.\nAlkalosis", pH: "> 7.45", HCO3: "↓ (comp)", PCO2: "↓ (<35)", cause: "Hyperventilation, anxiety, PE", x: 460, color: "#3B82F6" },
    { label: "Met.\nAlkalosis", pH: "> 7.45", HCO3: "↑ (>26)", PCO2: "↑ (comp)", cause: "Vomiting, loop diuretics", x: 555, color: "#8B5CF6" },
  ];

  return (
    <svg viewBox="0 0 630 420" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Acid-Base Balance Disorders</title>

      <text x="315" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Acid-Base Balance — Disorders & Compensation</text>

      {/* pH scale */}
      <defs>
        <linearGradient id="ab_ph" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="65%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="30" y="40" width="570" height="20" rx="10" fill="url(#ab_ph)" />
      {[6.8, 7.0, 7.2, 7.35, 7.45, 7.6, 7.8].map((ph, i) => {
        const x = 30 + ((ph - 6.8) / 1.0) * 570;
        return (
          <g key={ph}>
            <line x1={x} y1="58" x2={x} y2="68" stroke="#0F1729" strokeWidth="1" />
            <text x={x} y="80" textAnchor="middle" fontSize="9" fill="#6B7280">{ph}</text>
          </g>
        );
      })}
      <text x="30" y="38" fontSize="9" fill="#EF4444">Acidemia</text>
      <text x="528" y="38" fontSize="9" fill="#8B5CF6">Alkalemia</text>
      <rect x="30 + ((7.35-6.8)/1.0)*570" y="36" width={(0.1/1.0)*570} height="28" rx="3" fill="none" stroke="#22C55E" strokeWidth="2" />
      <text x="310" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#22C55E">Normal range: 7.35–7.45</text>

      {/* Cards */}
      {disorders.map(({ label, pH, HCO3, PCO2, cause, x, color }) => (
        <g key={label}>
          <rect x={x - 55} y="116" width="112" height="155" rx="8" fill={`${color}10`} stroke={color} strokeWidth="1.4" />
          {label.split("\n").map((line, li) => (
            <text key={li} x={x} y={134 + li * 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill={color}>{line}</text>
          ))}
          <line x1={x - 45} y1="168" x2={x + 45} y2="168" stroke={color} strokeWidth="0.6" strokeOpacity="0.4" />
          <text x={x} y="184" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F1729">pH: {pH}</text>
          <text x={x} y="200" textAnchor="middle" fontSize="9" fill="#6B7280">HCO3: {HCO3}</text>
          <text x={x} y="215" textAnchor="middle" fontSize="9" fill="#6B7280">PCO2: {PCO2}</text>
          <text x={x} y="234" textAnchor="middle" fontSize="8" fill="#6B7280" style={{ maxWidth: "100px" }}>{cause.slice(0, 22)}</text>
          <text x={x} y="247" textAnchor="middle" fontSize="8" fill="#6B7280">{cause.slice(22)}</text>
        </g>
      ))}

      {/* Compensation rules */}
      <rect x="30" y="285" width="570" height="118" rx="8" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="315" y="302" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0F1729">Compensation Rules (Winter's Formula etc.)</text>
      {([
        ["Metabolic Acidosis", "Expected PCO2 = 1.5 × HCO3 + 8 ± 2 (Winter's formula)", "#EF4444"],
        ["Metabolic Alkalosis", "Expected PCO2 = 0.7 × HCO3 + 21 ± 2", "#8B5CF6"],
        ["Resp. Acidosis (acute)", "↑HCO3 by 1 per 10 mmHg ↑PCO2; (chronic: 3.5 per 10)", "#F97316"],
        ["Resp. Alkalosis (acute)", "↓HCO3 by 2 per 10 mmHg ↓PCO2; (chronic: 5 per 10)", "#3B82F6"],
      ] as [string, string, string][]).map(([d, r, c], i) => (
        <g key={d}>
          <circle cx="42" cy={318 + i * 20} r="4" fill={c} />
          <text x="52" y={322 + i * 20} fontSize="9" fontWeight="bold" fill={c}>{d}:</text>
          <text x="52" y={334 + i * 20} fontSize="8" fill="#6B7280">{r}</text>
        </g>
      ))}
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   10. CELL INJURY — Necrosis vs Apoptosis
   ═══════════════════════════════════════════════════════════ */
export function CellDeathDiagram() {
  const features = [
    ["Trigger", "Pathological (toxin, ischemia)", "Physiological or pathological"],
    ["Cell swelling", "Yes → lysis", "No → cell shrinks"],
    ["Membrane integrity", "Lost early", "Maintained till late"],
    ["Chromatin pattern", "Diffuse degradation", "Ladder pattern, apoptotic bodies"],
    ["Inflammation", "Yes — releases DAMPs", "No — anti-inflammatory"],
    ["Energy", "Passive (no ATP needed)", "Active — requires ATP & caspases"],
    ["Phagocytosis", "Neutrophils, macrophages", "Macrophages / neighboring cells"],
    ["Programmed?", "No", "Yes (p53, Bcl-2, Caspases)"],
  ];

  return (
    <svg viewBox="0 0 640 480" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Cell Death — Necrosis vs Apoptosis</title>

      <text x="320" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Cell Death — Necrosis vs Apoptosis</text>

      {/* Column headers */}
      <rect x="20" y="36" width="200" height="32" rx="6" fill="#EF444420" stroke="#EF4444" strokeWidth="1.3" />
      <text x="120" y="57" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#FCA5A5">NECROSIS</text>
      <rect x="220" y="36" width="200" height="32" rx="6" fill="#3B82F620" stroke="#3B82F6" strokeWidth="1.3" />
      <text x="320" y="57" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#60A5FA">FEATURE</text>
      <rect x="420" y="36" width="200" height="32" rx="6" fill="#22C55E20" stroke="#22C55E" strokeWidth="1.3" />
      <text x="520" y="57" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#86EFAC">APOPTOSIS</text>

      {/* Table rows */}
      {features.map(([feat, nec, apo], i) => (
        <g key={feat}>
          <rect x="20" y={76 + i * 44} width="200" height="40" rx="4" fill={i % 2 === 0 ? "#1C2128" : "#FFFFFF"} stroke="#E5E1D8" strokeWidth="0.8" />
          <rect x="220" y={76 + i * 44} width="200" height="40" rx="4" fill={i % 2 === 0 ? "#E5E1D8" : "#1C2128"} stroke="#E5E1D8" strokeWidth="0.8" />
          <rect x="420" y={76 + i * 44} width="200" height="40" rx="4" fill={i % 2 === 0 ? "#1C2128" : "#FFFFFF"} stroke="#E5E1D8" strokeWidth="0.8" />
          {nec.split(" / ").map((t, ti) => (
            <text key={ti} x="120" y={92 + i * 44 + ti * 14} textAnchor="middle" fontSize="8.5" fill="#FCA5A5">{t}</text>
          ))}
          <text x="320" y={96 + i * 44} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F1729">{feat}</text>
          {apo.split(" / ").map((t, ti) => (
            <text key={ti} x="520" y={92 + i * 44 + ti * 14} textAnchor="middle" fontSize="8.5" fill="#86EFAC">{t}</text>
          ))}
        </g>
      ))}

      <text x="320" y={76 + features.length * 44 + 20} textAnchor="middle" fontSize="10" fill="#6B7280">
        Apoptosis: regulated by p53 (promoter), Bcl-2 (suppressor), Caspase cascade
      </text>
    </svg>
  );
}
