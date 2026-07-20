export function MIBiomarkersDiagram() {
  return (
    <svg viewBox="0 0 620 380" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Cardiac Biomarkers After MI — Rise & Fall Timeline</title>
      {/* Axes */}
      <line x1="80" y1="40" x2="80" y2="320" stroke="#6B7280" strokeWidth="2" />
      <line x1="80" y1="320" x2="600" y2="320" stroke="#6B7280" strokeWidth="2" />
      <text x="30" y="190" fontSize="11" fill="#6B7280" transform="rotate(-90,30,190)">Relative Rise</text>
      <text x="340" y="345" fontSize="11" textAnchor="middle" fill="#6B7280">Time after MI (hours)</text>
      {/* Grid */}
      {[12,24,48,72,96,120].map((h,i) => (
        <g key={h}>
          <line x1={80+(i+1)*80} y1="40" x2={80+(i+1)*80} y2="320" stroke="#E5E1D8" strokeWidth="1" />
          <text x={80+(i+1)*80} y="332" textAnchor="middle" fontSize="10" fill="#6B7280">{h}h</text>
        </g>
      ))}

      {/* Myoglobin — earliest, low specificity */}
      <polyline points="80,310 120,250 160,200 200,240 260,290 320,310" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="5,3" />
      <text x="160" y="188" fontSize="11" fill="#F59E0B">Myoglobin</text>
      <text x="160" y="200" fontSize="9" fill="#6B7280">1-4h rise, 24h normal</text>

      {/* CK-MB */}
      <polyline points="80,310 140,310 200,240 270,160 320,240 380,310 420,310" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
      <text x="260" y="148" fontSize="11" fill="#3B82F6">CK-MB</text>
      <text x="260" y="160" fontSize="9" fill="#6B7280">3-6h rise, peaks 24h</text>

      {/* Troponin I */}
      <polyline points="80,310 160,310 220,250 290,120 380,150 460,200 540,250 590,280" fill="none" stroke="#00C2A8" strokeWidth="3" />
      <text x="290" y="108" fontSize="12" fontWeight="bold" fill="#00C2A8">Troponin I/T</text>
      <text x="290" y="122" fontSize="9" fill="#6B7280">3-6h rise, elevated 7-14d</text>

      {/* Troponin T separate */}
      <polyline points="80,310 170,310 230,260 300,130 390,160 470,210 550,260" fill="none" stroke="#EC4899" strokeWidth="2" strokeDasharray="3,2" />

      {/* Legend */}
      <g transform="translate(400,50)">
        {[["Troponin I/T","#00C2A8"],["CK-MB","#3B82F6"],["Myoglobin","#F59E0B"]].map(([l,c],i) => (
          <g key={l} transform={`translate(0,${i*22})`}>
            <line x1="0" y1="0" x2="25" y2="0" stroke={c} strokeWidth="3" />
            <text x="30" y="5" fontSize="11" fill="#0F1729">{l}</text>
          </g>
        ))}
      </g>

      {/* Normal range */}
      <rect x="80" y="300" width="520" height="20" fill="#238636" fillOpacity="0.1" />
      <text x="340" y="313" textAnchor="middle" fontSize="10" fill="#238636">Normal Range</text>
    </svg>
  );
}

export function MIECGChangesDiagram() {
  return (
    <svg viewBox="0 0 680 320" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>ECG Changes After STEMI — Evolution Timeline</title>
      {/* Timeline arrow */}
      <line x1="40" y1="40" x2="640" y2="40" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arr)" />
      {[["0-30 min","80"],["1-6 hrs","220"],["6-24 hrs","370"],["Days","490"],["Weeks+","600"]].map(([t,x]) => (
        <g key={t}>
          <line x1={x} y1="35" x2={x} y2="50" stroke="#6B7280" strokeWidth="1.5" />
          <text x={x} y="30" textAnchor="middle" fontSize="11" fill="#6B7280">{t}</text>
        </g>
      ))}

      {/* Phase 1: Hyperacute T waves */}
      <g transform="translate(40,70)">
        <rect x="0" y="0" width="120" height="200" rx="8" fill="#F59E0B" fillOpacity="0.08" stroke="#F59E0B" strokeWidth="1" />
        <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#F59E0B">Hyperacute</text>
        <text x="60" y="30" textAnchor="middle" fontSize="10" fill="#6B7280">T Waves</text>
        <polyline points="20,120 40,120 45,115 50,60 55,120 80,120 85,112 90,80 95,120 100,120" fill="none" stroke="#F59E0B" strokeWidth="2" />
        <text x="60" y="195" textAnchor="middle" fontSize="9" fill="#6B7280">Tall peaked T</text>
      </g>

      {/* Phase 2: ST elevation */}
      <g transform="translate(180,70)">
        <rect x="0" y="0" width="120" height="200" rx="8" fill="#EF4444" fillOpacity="0.08" stroke="#EF4444" strokeWidth="1" />
        <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#EF4444">ST Elevation</text>
        <text x="60" y="30" textAnchor="middle" fontSize="10" fill="#6B7280">STEMI</text>
        <polyline points="20,120 40,120 45,115 50,100 55,85 60,80 65,120 80,120 85,110 90,120 100,120" fill="none" stroke="#EF4444" strokeWidth="2.5" />
        <text x="60" y="195" textAnchor="middle" fontSize="9" fill="#6B7280">Tombstone ST↑</text>
      </g>

      {/* Phase 3: Q waves */}
      <g transform="translate(330,70)">
        <rect x="0" y="0" width="120" height="200" rx="8" fill="#8B5CF6" fillOpacity="0.08" stroke="#8B5CF6" strokeWidth="1" />
        <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8B5CF6">Q Waves</text>
        <text x="60" y="30" textAnchor="middle" fontSize="10" fill="#6B7280">Pathological</text>
        <polyline points="20,120 40,120 43,120 48,150 55,110 60,100 62,120 75,120 80,112 85,120 100,120" fill="none" stroke="#8B5CF6" strokeWidth="2" />
        <text x="60" y="195" textAnchor="middle" fontSize="9" fill="#6B7280">Deep Q + ST↑</text>
      </g>

      {/* Phase 4: T inversion */}
      <g transform="translate(460,70)">
        <rect x="0" y="0" width="120" height="200" rx="8" fill="#00C2A8" fillOpacity="0.08" stroke="#00C2A8" strokeWidth="1" />
        <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#00C2A8">T Inversion</text>
        <text x="60" y="30" textAnchor="middle" fontSize="10" fill="#6B7280">Evolving MI</text>
        <polyline points="20,110 38,110 42,150 48,170 55,120 60,110 65,120 75,120 80,160 86,160 90,120 100,110" fill="none" stroke="#00C2A8" strokeWidth="2" />
        <text x="60" y="195" textAnchor="middle" fontSize="9" fill="#6B7280">Q + inverted T</text>
      </g>
    </svg>
  );
}

export function HeartFailureFrankStarlingDiagram() {
  return (
    <svg viewBox="0 0 560 380" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Frank-Starling Curve — Normal vs Heart Failure</title>
      {/* Axes */}
      <line x1="80" y1="50" x2="80" y2="320" stroke="#6B7280" strokeWidth="2" />
      <line x1="80" y1="320" x2="540" y2="320" stroke="#6B7280" strokeWidth="2" />
      <text x="28" y="200" fontSize="11" fill="#6B7280" transform="rotate(-90,28,200)">Cardiac Output (L/min)</text>
      <text x="310" y="345" fontSize="11" textAnchor="middle" fill="#6B7280">Preload (End-diastolic Volume)</text>
      {/* Y labels */}
      {[2,4,6,8].map((v,i) => (
        <g key={v}>
          <line x1="75" y1={310-i*60} x2="80" y2={310-i*60} stroke="#6B7280" strokeWidth="1.5" />
          <text x="70" y={315-i*60} textAnchor="end" fontSize="10" fill="#6B7280">{v}</text>
        </g>
      ))}
      {/* Grid */}
      {[1,2,3].map(i => <line key={i} x1="80" y1={310-i*60} x2="540" y2={310-i*60} stroke="#E5E1D8" strokeWidth="1" />)}

      {/* Normal heart curve */}
      <path d="M80,310 Q150,250 220,200 Q280,165 340,160 Q380,158 420,158 Q460,160 500,162"
        fill="none" stroke="#00C2A8" strokeWidth="3" />
      <text x="505" y="155" fontSize="12" fill="#00C2A8">Normal</text>

      {/* Compensated HF */}
      <path d="M80,310 Q150,290 220,260 Q280,240 340,235 Q380,233 420,234 Q460,236 500,238"
        fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="6,3" />
      <text x="505" y="232" fontSize="12" fill="#F59E0B">Comp. HF</text>

      {/* Decompensated HF */}
      <path d="M80,310 Q150,310 220,305 Q280,302 340,300 Q380,300 420,300 Q460,302 500,305"
        fill="none" stroke="#EF4444" strokeWidth="2.5" />
      <text x="505" y="300" fontSize="12" fill="#EF4444">Decomp. HF</text>

      {/* Treatment arrows */}
      <path d="M300,302 L300,240" stroke="#238636" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="3,2" />
      <text x="308" y="275" fontSize="10" fill="#238636">Diuretics</text>
      <path d="M340,238 L310,170" stroke="#3B82F6" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="3,2" />
      <text x="350" y="210" fontSize="10" fill="#3B82F6">Inotropes</text>

      {/* Legend */}
      <text x="140" y="60" fontSize="11" fontWeight="bold" fill="#6B7280">Frank-Starling Mechanism</text>
      <text x="140" y="75" fontSize="10" fill="#6B7280">↑ Preload → ↑ Stroke Volume (within limits)</text>
    </svg>
  );
}

export function HypertensionRAASDiagram() {
  return (
    <svg viewBox="0 0 640 500" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Renin-Angiotensin-Aldosterone System (RAAS)</title>

      {[
        ["Kidney (JGA)", 280, 50, "#00C2A8"],
        ["Renin", 280, 130, "#3B82F6"],
        ["Angiotensinogen\n(Liver)", 280, 210, "#F59E0B"],
        ["Angiotensin I", 280, 290, "#8B5CF6"],
        ["Angiotensin II", 280, 380, "#EF4444"],
      ].map(([label, x, y, color], i) => (
        <g key={i}>
          <rect x={Number(x)-90} y={Number(y)-22} width="180" height="44" rx="12" fill={color as string} fillOpacity="0.15" stroke={color as string} strokeWidth="2" />
          {(label as string).split("\n").map((line, j) => (
            <text key={j} x={x} y={Number(y)+5+(j-Math.floor((label as string).split("\n").length/2))*14} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0F1729">{line}</text>
          ))}
          {i < 4 && <line x1={x} y1={Number(y)+22} x2={x} y2={Number(y)+68} stroke="#6B7280" strokeWidth="2" markerEnd="url(#garrow)" />}
        </g>
      ))}

      {/* ACE inhibitor */}
      <rect x="380" y="330" width="120" height="34" rx="8" fill="#238636" fillOpacity="0.15" stroke="#238636" strokeWidth="1.5" />
      <text x="440" y="351" textAnchor="middle" fontSize="10" fill="#238636">ACE (Lungs)</text>
      <line x1="370" y1="310" x2="380" y2="340" stroke="#238636" strokeWidth="1.5" strokeDasharray="3,2" />

      {/* ACEi drug */}
      <rect x="510" y="330" width="100" height="34" rx="8" fill="#EF4444" fillOpacity="0.12" stroke="#EF4444" strokeWidth="1.5" />
      <text x="560" y="351" textAnchor="middle" fontSize="10" fill="#EF4444">ACE Inhibitors</text>
      <line x1="500" y1="347" x2="510" y2="347" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,2" />
      <text x="550" y="342" fontSize="8" fill="#EF4444">Block →</text>

      {/* Angiotensin II effects */}
      {[
        ["Vasoconstriction","100","430","#EF4444"],
        ["Aldosterone ↑","400","430","#F59E0B"],
        ["ADH ↑","250","460","#3B82F6"],
      ].map(([effect,x,y,color]) => (
        <g key={effect as string}>
          <rect x={Number(x)-60} y={Number(y)-14} width="130" height="28" rx="6" fill={color as string} fillOpacity="0.1" stroke={color as string} strokeWidth="1" />
          <text x={x} y={Number(y)+5} textAnchor="middle" fontSize="10" fill={color as string}>{effect}</text>
          <line x1="280" y1="402" x2={x} y2={Number(y)-14} stroke={color as string} strokeWidth="1" strokeDasharray="3,2" />
        </g>
      ))}

      {/* ARB label */}
      <rect x="500" y="368" width="120" height="28" rx="6" fill="#8B5CF6" fillOpacity="0.12" stroke="#8B5CF6" strokeWidth="1.5" />
      <text x="560" y="386" textAnchor="middle" fontSize="10" fill="#8B5CF6">ARBs (block AT1R)</text>
      <line x1="370" y1="380" x2="500" y2="380" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3,2" />

      <text x="320" y="488" textAnchor="middle" fontSize="11" fill="#6B7280">Net effect: ↑ BP via volume expansion + vasoconstriction</text>
    </svg>
  );
}

export function CoagulationCascadeDiagram() {
  return (
    <svg viewBox="0 0 700 520" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Coagulation Cascade — Intrinsic, Extrinsic & Common Pathways</title>
      {/* Title */}
      <text x="350" y="28" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0F1729">Coagulation Cascade</text>

      {/* Intrinsic Pathway (left) */}
      <text x="140" y="55" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3B82F6">INTRINSIC (Contact)</text>
      {[["XII","90"],["XI","140"],["IX","190"],["VIIIa","240"]].map(([f,y]) => (
        <g key={f}>
          <rect x="80" y={Number(y)-16} width="120" height="32" rx="8" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="1.5" />
          <text x="140" y={Number(y)+6} textAnchor="middle" fontSize="12" fill="#0F1729">Factor {f}</text>
          <line x1="140" y1={Number(y)+16} x2="140" y2={Number(y)+33} stroke="#3B82F6" strokeWidth="1.5" />
        </g>
      ))}

      {/* Extrinsic Pathway (right) */}
      <text x="560" y="55" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#F59E0B">EXTRINSIC (TF)</text>
      {[["Tissue Factor","90"],["VII + TF","140"],["VIIa + TF","200"]].map(([f,y]) => (
        <g key={f}>
          <rect x="480" y={Number(y)-16} width="160" height="32" rx="8" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1.5" />
          <text x="560" y={Number(y)+6} textAnchor="middle" fontSize="12" fill="#0F1729">{f}</text>
          <line x1="560" y1={Number(y)+16} x2="560" y2={Number(y)+33} stroke="#F59E0B" strokeWidth="1.5" />
        </g>
      ))}

      {/* Common Pathway */}
      <text x="350" y="295" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#00C2A8">COMMON PATHWAY</text>
      <line x1="140" y1="256" x2="280" y2="316" stroke="#3B82F6" strokeWidth="2" />
      <line x1="560" y1="216" x2="420" y2="316" stroke="#F59E0B" strokeWidth="2" />
      {[["Factor X","316"],["Factor V","366"],["Prothrombin → Thrombin","416"],["Fibrinogen → Fibrin","476"]].map(([f,y]) => (
        <g key={f}>
          <rect x="240" y={Number(y)-16} width="220" height="32" rx="8" fill="#00C2A8" fillOpacity="0.15" stroke="#00C2A8" strokeWidth="1.5" />
          <text x="350" y={Number(y)+6} textAnchor="middle" fontSize="11" fill="#0F1729">{f}</text>
          <line x1="350" y1={Number(y)+16} x2="350" y2={Number(y)+33} stroke="#00C2A8" strokeWidth="1.5" />
        </g>
      ))}

      {/* Drug labels */}
      <rect x="30" y="380" width="80" height="26" rx="6" fill="#EC4899" fillOpacity="0.12" stroke="#EC4899" strokeWidth="1" />
      <text x="70" y="397" textAnchor="middle" fontSize="9" fill="#EC4899">Heparin (IIa,Xa)</text>

      <rect x="590" y="416" width="90" height="26" rx="6" fill="#8B5CF6" fillOpacity="0.12" stroke="#8B5CF6" strokeWidth="1" />
      <text x="635" y="433" textAnchor="middle" fontSize="9" fill="#8B5CF6">Warfarin (II,VII,IX,X)</text>

      <rect x="590" y="446" width="90" height="26" rx="6" fill="#F59E0B" fillOpacity="0.12" stroke="#F59E0B" strokeWidth="1" />
      <text x="635" y="463" textAnchor="middle" fontSize="9" fill="#F59E0B">DOACs (Xa or IIa)</text>

      <text x="350" y="510" textAnchor="middle" fontSize="10" fill="#6B7280">Result: Stable Fibrin Clot → Hemostasis</text>
    </svg>
  );
}

export function DoseResponseCurveDiagram() {
  return (
    <svg viewBox="0 0 580 380" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Dose-Response Curves — Pharmacodynamics</title>
      {/* Axes */}
      <line x1="80" y1="50" x2="80" y2="310" stroke="#6B7280" strokeWidth="2" />
      <line x1="80" y1="310" x2="560" y2="310" stroke="#6B7280" strokeWidth="2" />
      <text x="30" y="190" fontSize="11" fill="#6B7280" transform="rotate(-90,30,190)">Effect (%)</text>
      <text x="320" y="335" fontSize="11" textAnchor="middle" fill="#6B7280">Log Dose</text>
      {/* Grid */}
      {[25,50,75,100].map(v => (
        <g key={v}>
          <line x1="75" y1={310-v*2.4} x2="80" y2={310-v*2.4} stroke="#6B7280" strokeWidth="1.5" />
          <text x="70" y={315-v*2.4} textAnchor="end" fontSize="10" fill="#6B7280">{v}%</text>
          <line x1="80" y1={310-v*2.4} x2="560" y2={310-v*2.4} stroke="#E5E1D8" strokeWidth="1" />
        </g>
      ))}
      {/* EC50 */}
      <line x1="80" y1="190" x2="560" y2="190" stroke="#6B7280" strokeWidth="1" strokeDasharray="4,3" />

      {/* Drug A — full agonist */}
      <path d="M80,305 Q150,302 200,280 Q250,240 300,190 Q350,140 400,100 Q440,80 480,72 Q510,70 540,68"
        fill="none" stroke="#00C2A8" strokeWidth="3" />
      <text x="545" y="65" fontSize="11" fill="#00C2A8">Drug A</text>
      <text x="545" y="76" fontSize="9" fill="#6B7280">Full agonist</text>

      {/* Drug B — partial agonist */}
      <path d="M80,305 Q150,302 200,285 Q250,255 300,220 Q350,190 400,170 Q440,160 480,155 Q510,153 540,152"
        fill="none" stroke="#3B82F6" strokeWidth="2.5" />
      <text x="545" y="150" fontSize="11" fill="#3B82F6">Drug B</text>
      <text x="545" y="162" fontSize="9" fill="#6B7280">Partial agonist</text>

      {/* Drug C — right shifted (less potent) */}
      <path d="M80,305 Q200,305 250,285 Q320,245 370,190 Q420,140 480,100 Q510,82 540,75"
        fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="7,3" />
      <text x="545" y="72" fontSize="11" fill="#F59E0B">Drug C</text>
      <text x="545" y="83" fontSize="9" fill="#6B7280">Less potent</text>

      {/* ED50 markers */}
      <line x1="295" y1="190" x2="295" y2="310" stroke="#00C2A8" strokeWidth="1" strokeDasharray="3,2" />
      <text x="295" y="325" textAnchor="middle" fontSize="10" fill="#00C2A8">ED₅₀ (A)</text>

      <line x1="365" y1="190" x2="365" y2="310" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3,2" />
      <text x="365" y="325" textAnchor="middle" fontSize="10" fill="#F59E0B">ED₅₀ (C)</text>

      {/* Max effect label */}
      <text x="100" y="60" fontSize="11" fill="#6B7280">Emax</text>
      <text x="100" y="200" fontSize="11" fill="#6B7280">50%</text>

      {/* Annotations */}
      <text x="140" y="180" fontSize="11" fontWeight="bold" fill="#6B7280">← Potency →</text>
      <text x="140" y="78" fontSize="11" fontWeight="bold" fill="#6B7280">← Efficacy →</text>
    </svg>
  );
}

export function GramStainTree() {
  return (
    <svg viewBox="0 0 700 500" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Gram Stain Classification Tree</title>
      <text x="350" y="28" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0F1729">Bacterial Classification (Gram Stain)</text>

      {/* Root — Bacteria */}
      <rect x="290" y="45" width="120" height="34" rx="8" fill="#00C2A8" fillOpacity="0.2" stroke="#00C2A8" strokeWidth="2" />
      <text x="350" y="66" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#00C2A8">BACTERIA</text>

      {/* Split lines */}
      <line x1="350" y1="79" x2="350" y2="100" stroke="#6B7280" strokeWidth="1.5" />
      <line x1="170" y1="100" x2="530" y2="100" stroke="#6B7280" strokeWidth="1.5" />

      {/* Gram +ve */}
      <line x1="170" y1="100" x2="170" y2="120" stroke="#3B82F6" strokeWidth="1.5" />
      <rect x="100" y="120" width="140" height="34" rx="8" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2" />
      <text x="170" y="141" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#3B82F6">GRAM +ve</text>
      <text x="170" y="155" textAnchor="middle" fontSize="9" fill="#6B7280">Purple/Violet</text>

      {/* Gram -ve */}
      <line x1="530" y1="100" x2="530" y2="120" stroke="#EC4899" strokeWidth="1.5" />
      <rect x="460" y="120" width="140" height="34" rx="8" fill="#EC4899" fillOpacity="0.2" stroke="#EC4899" strokeWidth="2" />
      <text x="530" y="141" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#EC4899">GRAM −ve</text>
      <text x="530" y="155" textAnchor="middle" fontSize="9" fill="#6B7280">Pink/Red</text>

      {/* Gram +ve branches */}
      <line x1="170" y1="154" x2="170" y2="175" stroke="#3B82F6" strokeWidth="1" />
      <line x1="100" y1="175" x2="240" y2="175" stroke="#3B82F6" strokeWidth="1" />
      {[
        ["Cocci","90","175","Staph,Strep,Enterococcus"],
        ["Bacilli","250","175","Bacillus,Clostridium,Listeria"],
      ].map(([l,x,y,ex]) => (
        <g key={l}>
          <line x1={x} y1={y} x2={x} y2={Number(y)+25} stroke="#3B82F6" strokeWidth="1" />
          <rect x={Number(x)-55} y={Number(y)+25} width="110" height="32" rx="6" fill="#3B82F6" fillOpacity="0.12" stroke="#3B82F6" strokeWidth="1" />
          <text x={x} y={Number(y)+38} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B82F6">{l}</text>
          <text x={x} y={Number(y)+52} textAnchor="middle" fontSize="9" fill="#6B7280">{ex}</text>
        </g>
      ))}

      {/* Gram -ve branches */}
      <line x1="530" y1="154" x2="530" y2="175" stroke="#EC4899" strokeWidth="1" />
      <line x1="430" y1="175" x2="630" y2="175" stroke="#EC4899" strokeWidth="1" />
      {[
        ["Cocci","420","175","Neisseria,Moraxella"],
        ["Bacilli","570","175","E.coli,Klebsiella,Salmonella,Pseudomonas"],
        ["Spiral","680","175","Vibrio,Helicobacter"],
      ].map(([l,x,y,ex]) => (
        <g key={l}>
          <line x1={x} y1={y} x2={x} y2={Number(y)+25} stroke="#EC4899" strokeWidth="1" />
          <rect x={Number(x)-70} y={Number(y)+25} width="140" height="32" rx="6" fill="#EC4899" fillOpacity="0.1" stroke="#EC4899" strokeWidth="1" />
          <text x={x} y={Number(y)+38} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#EC4899">{l}</text>
          <text x={x} y={Number(y)+52} textAnchor="middle" fontSize="8" fill="#6B7280">{ex}</text>
        </g>
      ))}

      {/* Special categories */}
      <text x="350" y="300" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#F59E0B">Special Staining Required:</text>
      {[
        ["Mycobacteria","ZN Stain","Acid-fast bacilli","150","330"],
        ["Spirochetes","Dark Field","Treponema,Leptospira","350","330"],
        ["Fungi","KOH / India Ink","Candida,Cryptococcus","550","330"],
      ].map(([org,stain,ex,x,y]) => (
        <g key={org}>
          <rect x={Number(x)-75} y={Number(y)-16} width="150" height="60" rx="6" fill="#F59E0B" fillOpacity="0.08" stroke="#F59E0B" strokeWidth="1.5" />
          <text x={x} y={Number(y)} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#F59E0B">{org}</text>
          <text x={x} y={Number(y)+15} textAnchor="middle" fontSize="9" fill="#6B7280">{stain}</text>
          <text x={x} y={Number(y)+30} textAnchor="middle" fontSize="9" fill="#6B7280">{ex}</text>
        </g>
      ))}

      <text x="350" y="440" textAnchor="middle" fontSize="11" fill="#6B7280">Gram stain uses Crystal Violet → Iodine fixation → Decolorizer → Safranin counterstain</text>
    </svg>
  );
}
