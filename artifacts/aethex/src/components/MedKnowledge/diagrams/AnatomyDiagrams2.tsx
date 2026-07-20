/* ──────────────────────────────────────────────────────────
   Additional Anatomical Diagrams — region-specific illustrations
   ────────────────────────────────────────────────────────── */

const DEFS = (
  <defs>
    <linearGradient id="ad2_boneH" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#A88550" />
      <stop offset="25%" stopColor="#C8A870" />
      <stop offset="60%" stopColor="#E2CFA0" />
      <stop offset="85%" stopColor="#D0B880" />
      <stop offset="100%" stopColor="#A88050" />
    </linearGradient>
    <linearGradient id="ad2_shaft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#9A7848" />
      <stop offset="20%" stopColor="#BFA070" />
      <stop offset="50%" stopColor="#D8C090" />
      <stop offset="80%" stopColor="#BFA070" />
      <stop offset="100%" stopColor="#9A7848" />
    </linearGradient>
    <linearGradient id="ad2_cart" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#5888A8" />
      <stop offset="50%" stopColor="#80B0D0" />
      <stop offset="100%" stopColor="#5888A8" />
    </linearGradient>
    <filter id="ad2_sh">
      <feDropShadow dx="1.5" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.45"/>
    </filter>
  </defs>
);

/* ═══════════════════════════════════════════════════════════
   1. LOWER LIMB BONES — Anterior View (Right Side)
   ═══════════════════════════════════════════════════════════ */
export function LowerLimbBonesDiagram() {
  return (
    <svg viewBox="0 0 480 800" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Bones of the Lower Limb — Anterior View</title>
      {DEFS}

      <text x="190" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Lower Limb Bones — Anterior View</text>
      <text x="190" y="38" textAnchor="middle" fontSize="10" fill="#6B7280">(Right side)</text>

      {/* ── ILIAC CREST (partial hip bone) ── */}
      <path d="M90,82 C112,56 148,50 183,54 C218,58 238,70 248,82
               C252,90 247,97 236,94 C220,90 200,84 180,82
               C160,80 135,80 110,86 C98,90 88,90 90,82 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.3" filter="url(#ad2_sh)" />
      {/* Acetabulum */}
      <ellipse cx="200" cy="118" rx="24" ry="22" fill="url(#ad2_cart)" stroke="#4A7898" strokeWidth="1.5" />
      <ellipse cx="200" cy="118" rx="16" ry="15" fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      <line x1="100" y1="75" x2="62" y2="60" stroke="#4B5563" strokeWidth="0.8" />
      <text x="35" y="56" fontSize="10" fill="#CBD5E1">Iliac</text>
      <text x="38" y="68" fontSize="10" fill="#CBD5E1">Crest</text>
      <line x1="198" y1="97" x2="160" y2="84" stroke="#4B5563" strokeWidth="0.8" />
      <text x="85" y="80" fontSize="10" fill="#CBD5E1">Acetabulum</text>

      {/* ── FEMUR ── */}
      {/* Femoral head */}
      <ellipse cx="200" cy="118" rx="17" ry="16" fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Femoral neck */}
      <path d="M194,132 C196,140 198,148 200,154 C202,160 208,163 214,163
               C220,163 225,158 224,151 C223,143 219,136 215,130 Z"
        fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="1" />
      {/* Greater trochanter */}
      <path d="M226,130 C237,126 247,130 248,141 C249,151 241,157 230,153
               C223,149 221,141 224,133 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      {/* Lesser trochanter */}
      <path d="M195,164 C187,164 182,172 184,180 C186,187 194,190 200,186
               C203,182 202,170 195,164 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Femur shaft */}
      <path d="M202,166 C198,180 195,205 193,240
               C191,278 191,315 193,350
               C194,364 197,373 201,377
               C203,381 208,383 213,383
               C218,383 224,380 227,374
               C231,365 232,352 231,338
               C229,300 226,260 223,225
               C220,192 217,172 214,164
               C211,161 208,160 205,160 Z"
        fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="1.4" filter="url(#ad2_sh)" />
      {/* Medial + lateral condyles */}
      <path d="M190,368 C185,375 183,386 186,394 C189,401 197,404 207,401
               L209,387 C205,380 200,374 195,369 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <path d="M224,368 C230,375 233,386 230,394 C227,401 219,404 212,401
               L212,387 C215,380 220,374 224,369 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <path d="M186,392 C186,400 192,407 201,408 C210,408 216,403 219,396
               C222,403 228,407 235,405 C240,403 243,396 240,389 Z"
        fill="url(#ad2_cart)" stroke="#4A7898" strokeWidth="1" />
      {/* Labels */}
      <line x1="248" y1="138" x2="290" y2="128" stroke="#4B5563" strokeWidth="0.8" />
      <text x="292" y="125" fontSize="10" fill="#CBD5E1">Greater</text>
      <text x="292" y="137" fontSize="10" fill="#CBD5E1">Trochanter</text>
      <line x1="232" y1="280" x2="272" y2="280" stroke="#4B5563" strokeWidth="0.8" />
      <text x="274" y="284" fontSize="12" fill="#0F1729" fontWeight="bold">Femur</text>
      <text x="274" y="297" fontSize="9" fill="#9CA3AF">(thigh bone)</text>
      <line x1="185" y1="398" x2="148" y2="398" stroke="#4B5563" strokeWidth="0.8" />
      <text x="82" y="394" fontSize="10" fill="#CBD5E1">Medial</text>
      <text x="78" y="406" fontSize="10" fill="#CBD5E1">Condyle</text>
      <line x1="240" y1="398" x2="278" y2="398" stroke="#4B5563" strokeWidth="0.8" />
      <text x="280" y="402" fontSize="10" fill="#CBD5E1">Lateral</text>
      <text x="280" y="414" fontSize="10" fill="#CBD5E1">Condyle</text>

      {/* ── PATELLA ── */}
      <path d="M193,408 C187,412 184,421 186,429 C188,437 197,441 206,439
               C214,437 218,428 216,420 C214,412 205,406 197,408 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.3" filter="url(#ad2_sh)" />
      <line x1="184" y1="424" x2="145" y2="424" stroke="#4B5563" strokeWidth="0.8" />
      <text x="94" y="420" fontSize="10" fill="#CBD5E1">Patella</text>
      <text x="98" y="432" fontSize="9" fill="#9CA3AF">(kneecap)</text>

      {/* ── TIBIA ── */}
      <path d="M177,434 C173,428 171,437 173,444 C175,452 182,455 190,454
               L196,445 C189,440 183,436 177,434 Z"
        fill="url(#ad2_cart)" stroke="#4A7898" strokeWidth="1" />
      <path d="M215,433 C220,428 224,436 222,444 C220,452 213,455 207,454
               L204,445 C208,440 214,436 215,433 Z"
        fill="url(#ad2_cart)" stroke="#4A7898" strokeWidth="1" />
      {/* Tibial tuberosity */}
      <path d="M189,450 C186,456 185,466 188,473 C190,479 194,480 197,476
               C200,471 200,462 197,453 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Tibia shaft */}
      <path d="M179,457 C176,470 174,495 173,525
               C172,553 173,579 175,595
               C176,606 179,612 183,616
               C185,619 189,620 192,619
               C196,618 199,615 200,611
               C202,601 202,578 201,553
               C200,522 197,495 195,471
               C193,459 191,451 189,450
               C186,448 183,448 181,451 Z"
        fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="1.3" filter="url(#ad2_sh)" />
      {/* Medial malleolus */}
      <path d="M173,604 C169,609 168,617 171,624 C174,630 180,632 185,628
               L186,617 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="172" y1="545" x2="130" y2="545" stroke="#4B5563" strokeWidth="0.8" />
      <text x="90" y="549" fontSize="12" fill="#0F1729" fontWeight="bold">Tibia</text>
      <line x1="169" y1="618" x2="130" y2="626" stroke="#4B5563" strokeWidth="0.8" />
      <text x="62" y="622" fontSize="10" fill="#CBD5E1">Medial</text>
      <text x="52" y="634" fontSize="10" fill="#CBD5E1">Malleolus</text>

      {/* ── FIBULA ── */}
      <ellipse cx="227" cy="450" rx="12" ry="10" fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <path d="M221,458 C219,474 218,502 218,530
               C218,557 219,581 221,597
               C222,606 224,612 227,616
               C229,619 232,619 234,616
               C237,612 238,601 237,587
               C236,564 234,534 232,508
               C230,484 229,464 229,458
               C227,454 224,452 222,454 Z"
        fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="1.1" />
      <path d="M220,601 C218,606 217,614 220,621 C223,628 229,630 234,626
               L233,614 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="227" y1="448" x2="266" y2="438" stroke="#4B5563" strokeWidth="0.8" />
      <text x="268" y="435" fontSize="10" fill="#CBD5E1">Fibular</text>
      <text x="268" y="447" fontSize="10" fill="#CBD5E1">Head</text>
      <line x1="238" y1="545" x2="270" y2="545" stroke="#4B5563" strokeWidth="0.8" />
      <text x="272" y="549" fontSize="12" fill="#0F1729" fontWeight="bold">Fibula</text>
      <line x1="234" y1="620" x2="268" y2="628" stroke="#4B5563" strokeWidth="0.8" />
      <text x="270" y="626" fontSize="10" fill="#CBD5E1">Lateral</text>
      <text x="270" y="638" fontSize="10" fill="#CBD5E1">Malleolus</text>
      {/* Interosseous membrane */}
      {[480, 510, 540, 568].map(y => (
        <line key={y} x1="201" y1={y} x2="219" y2={y} stroke="#5A6572" strokeWidth="0.6" strokeDasharray="3,2" />
      ))}
      <line x1="128" y1="524" x2="200" y2="524" stroke="#4B5563" strokeWidth="0.5" strokeDasharray="2,1" />
      <text x="56" y="520" fontSize="9" fill="#4B5563">Interosseous</text>
      <text x="60" y="532" fontSize="9" fill="#4B5563">Membrane</text>

      {/* ── TARSALS ── */}
      <path d="M155,668 C145,664 138,668 138,680 C138,692 148,700 163,698
               C177,696 184,686 181,676 C178,666 165,666 155,668 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" filter="url(#ad2_sh)" />
      <path d="M177,658 C172,652 167,652 165,658 C163,664 166,672 172,674
               C178,675 183,671 183,665 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      <ellipse cx="192" cy="661" rx="12" ry="9" fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      <ellipse cx="206" cy="668" rx="11" ry="9" fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      {[196, 208, 219].map((x, i) => (
        <ellipse key={i} cx={x} cy={680} rx={7} ry={8} fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="0.9" />
      ))}
      <line x1="147" y1="680" x2="108" y2="690" stroke="#4B5563" strokeWidth="0.8" />
      <text x="44" y="687" fontSize="10" fill="#CBD5E1">7 Tarsal</text>
      <text x="50" y="699" fontSize="10" fill="#CBD5E1">Bones</text>

      {/* ── METATARSALS ── */}
      {[165, 179, 193, 207, 220].map((x, i) => (
        <g key={i}>
          <path d={`M${x-5},690 C${x-6},694 ${x-6},702 ${x-5},714 L${x-3},730 C${x-2},734 ${x+1},736 ${x+4},736 C${x+7},736 ${x+10},734 ${x+10},730 L${x+11},714 C${x+12},702 ${x+12},694 ${x+11},690 Z`}
            fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="0.9" />
          <ellipse cx={x+3} cy={686} rx={8} ry={6} fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="0.9" />
        </g>
      ))}
      <line x1="168" y1="686" x2="118" y2="710" stroke="#4B5563" strokeWidth="0.8" />
      <text x="48" y="708" fontSize="10" fill="#CBD5E1">Metatarsals</text>
      <text x="62" y="720" fontSize="9" fill="#9CA3AF">I – V</text>

      {/* ── PHALANGES ── */}
      {[167, 181, 195, 209, 222].map((x, i) => (
        <g key={i}>
          <path d={`M${x-4},739 C${x-5},742 ${x-5},749 ${x-4},755 C${x-3},759 ${x},761 ${x+4},761 C${x+7},761 ${x+9},759 ${x+10},755 C${x+11},749 ${x+11},742 ${x+10},739 Z`}
            fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="0.8" />
          {i > 0 && <path d={`M${x-3},764 C${x-4},767 ${x-4},773 ${x-3},779 C${x-2},783 ${x+1},785 ${x+4},785 C${x+7},785 ${x+9},783 ${x+10},779 C${x+11},773 ${x+11},767 ${x+10},764 Z`}
            fill="url(#ad2_shaft)" stroke="#8A6840" strokeWidth="0.8" />}
          {i > 0 ?
            <path d={`M${x-2},788 C${x-3},791 ${x-3},797 ${x-2},802 C${x-1},805 ${x+3},807 ${x+6},806 C${x+9},805 ${x+11},802 ${x+11},798 C${x+11},794 ${x+10},790 ${x+9},788 Z`}
              fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="0.8" />
            :
            <path d={`M${x-3},764 C${x-4},767 ${x-4},773 ${x-3},778 C${x-2},782 ${x+2},784 ${x+5},783 C${x+8},782 ${x+10},779 ${x+10},775 C${x+10},771 ${x+9},767 ${x+8},764 Z`}
              fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="0.8" />}
        </g>
      ))}
      <line x1="176" y1="750" x2="116" y2="768" stroke="#4B5563" strokeWidth="0.8" />
      <text x="44" y="766" fontSize="10" fill="#CBD5E1">Phalanges</text>
      <text x="42" y="778" fontSize="9" fill="#9CA3AF">Prox·Mid·Distal</text>

      {/* ── JOINT LABELS ── */}
      <line x1="240" y1="118" x2="280" y2="106" stroke="#374151" strokeWidth="0.7" />
      <text x="282" y="103" fontSize="10" fill="#6B7280">Hip Joint</text>
      <line x1="240" y1="400" x2="282" y2="412" stroke="#374151" strokeWidth="0.7" />
      <text x="284" y="410" fontSize="10" fill="#6B7280">Knee</text>
      <text x="284" y="422" fontSize="10" fill="#6B7280">Joint</text>
      <line x1="165" y1="626" x2="126" y2="644" stroke="#374151" strokeWidth="0.7" />
      <text x="64" y="642" fontSize="10" fill="#6B7280">Ankle</text>
      <text x="64" y="654" fontSize="10" fill="#6B7280">Joint</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   2. VERTEBRAL COLUMN — Lateral View (Right)
   ═══════════════════════════════════════════════════════════ */
export function VertebralColumnDiagram() {
  const vertebrae: { label: string; y: number; x: number; w: number; h: number; fill: string; stroke: string }[] = [];

  // Cervical lordosis C1-C7 (curves anteriorly = bulges left in right-lateral view)
  const cervX = [175, 172, 168, 165, 163, 162, 163];
  for (let i = 0; i < 7; i++) {
    vertebrae.push({
      label: `C${i + 1}`, y: 56 + i * 34, x: cervX[i], w: 54, h: 26, fill: "#1A3A5C", stroke: "#3B82F6"
    });
  }
  // Thoracic kyphosis T1-T12 (curves posteriorly = bulges right)
  const thorX = [168, 172, 176, 180, 183, 185, 186, 185, 183, 180, 177, 175];
  for (let i = 0; i < 12; i++) {
    vertebrae.push({
      label: `T${i + 1}`, y: 300 + i * 26, x: thorX[i], w: 52, h: 20, fill: "#1A3A2A", stroke: "#22C55E"
    });
  }
  // Lumbar lordosis L1-L5 (curves anteriorly)
  const lumbX = [172, 168, 164, 162, 160];
  for (let i = 0; i < 5; i++) {
    vertebrae.push({
      label: `L${i + 1}`, y: 618 + i * 24, x: lumbX[i], w: 58, h: 20, fill: "#3A2010", stroke: "#F97316"
    });
  }

  return (
    <svg viewBox="0 0 420 780" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Vertebral Column — Lateral View</title>
      <defs>
        <filter id="vc_sh"><feDropShadow dx="1" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.5"/></filter>
      </defs>

      <text x="210" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Vertebral Column — Lateral View</text>

      {/* Region backgrounds */}
      <rect x="155" y="48" width="80" height="242" rx="6" fill="#3B82F6" fillOpacity="0.06" stroke="#3B82F6" strokeWidth="0.5" />
      <rect x="155" y="292" width="80" height="314" rx="6" fill="#22C55E" fillOpacity="0.06" stroke="#22C55E" strokeWidth="0.5" />
      <rect x="155" y="608" width="80" height="122" rx="6" fill="#F97316" fillOpacity="0.06" stroke="#F97316" strokeWidth="0.5" />

      {/* Spinal curve guide line */}
      <path d="M192,56 C188,100 182,150 165,200 C158,230 158,260 166,290
               C178,330 190,370 190,420 C190,470 185,510 180,560
               C172,600 163,630 162,660 C161,690 165,720 170,740"
        fill="none" stroke="#4B5563" strokeWidth="1" strokeDasharray="4,3" />

      {/* Vertebrae */}
      {vertebrae.map(({ label, y, x, w, h, fill, stroke }) => (
        <g key={label} filter="url(#vc_sh)">
          <rect x={x} y={y} width={w} height={h} rx="4"
            fill={fill} stroke={stroke} strokeWidth="1.2" />
          <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
            fontSize="9" fontWeight="bold" fill="#0F1729">{label}</text>
          {/* Spinous process (pointing posteriorly = right) */}
          <path d={`M${x + w},${y + h / 2 - 5} L${x + w + 16},${y + h / 2} L${x + w},${y + h / 2 + 5}`}
            fill={stroke} fillOpacity="0.5" stroke={stroke} strokeWidth="0.8" />
          {/* Vertebral body disc (intervertebral disc) */}
          <rect x={x + 2} y={y + h} width={w - 4} height="5" rx="2"
            fill="#4A6040" opacity="0.6" />
        </g>
      ))}

      {/* Sacrum */}
      <path d="M157,742 C157,745 160,750 165,753 C172,757 182,758 190,755
               C198,752 203,747 202,742 C200,737 192,733 183,732
               C173,731 161,735 157,742 Z"
        fill="#400020" stroke="#EC4899" strokeWidth="1.3" />
      <text x="180" y="748" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0F1729">SACRUM</text>
      {/* Coccyx */}
      <path d="M162,756 C160,762 162,770 166,774 C170,778 176,778 179,773
               C182,768 181,760 178,756 Z"
        fill="#300018" stroke="#EC4899" strokeWidth="1" />
      <text x="170" y="770" textAnchor="middle" fontSize="8" fill="#0F1729">Coccyx</text>

      {/* Region labels on right side */}
      <text x="252" y="80" fontSize="13" fontWeight="bold" fill="#3B82F6">Cervical</text>
      <text x="252" y="94" fontSize="10" fill="#6B7280">C1–C7</text>
      <text x="252" y="107" fontSize="9" fill="#3B82F6">Lordosis</text>
      <line x1="222" y1="90" x2="250" y2="90" stroke="#3B82F6" strokeWidth="0.8" />

      <text x="252" y="380" fontSize="13" fontWeight="bold" fill="#22C55E">Thoracic</text>
      <text x="252" y="394" fontSize="10" fill="#6B7280">T1–T12</text>
      <text x="252" y="407" fontSize="9" fill="#22C55E">Kyphosis</text>
      <line x1="238" y1="393" x2="250" y2="393" stroke="#22C55E" strokeWidth="0.8" />

      <text x="252" y="640" fontSize="13" fontWeight="bold" fill="#F97316">Lumbar</text>
      <text x="252" y="654" fontSize="10" fill="#6B7280">L1–L5</text>
      <text x="252" y="667" fontSize="9" fill="#F97316">Lordosis</text>
      <line x1="220" y1="653" x2="250" y2="653" stroke="#F97316" strokeWidth="0.8" />

      <text x="252" y="748" fontSize="11" fontWeight="bold" fill="#EC4899">Sacral</text>
      <line x1="204" y1="747" x2="250" y2="747" stroke="#EC4899" strokeWidth="0.8" />

      {/* Curve arrows */}
      <text x="96" y="180" fontSize="10" fill="#6B7280" transform="rotate(-90,96,180)">← Anterior</text>
      <text x="296" y="430" fontSize="10" fill="#6B7280" transform="rotate(90,296,430)">Posterior →</text>

      {/* Key */}
      <rect x="22" y="580" width="120" height="80" rx="6" fill="#FFFFFF" stroke="#E5E1D8" strokeWidth="1" />
      <text x="82" y="598" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B7280">Vertebrae: 33</text>
      {[["7 Cervical","#3B82F6"], ["12 Thoracic","#22C55E"], ["5 Lumbar","#F97316"], ["5+4 Sacral/Coccyx","#EC4899"]].map(([t,c], i) => (
        <g key={t}>
          <circle cx="32" cy={612 + i * 14} r="4" fill={c} />
          <text x="40" y={616 + i * 14} fontSize="9" fill="#6B7280">{t}</text>
        </g>
      ))}
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   3. THORAX SKELETON — Anterior View
   ═══════════════════════════════════════════════════════════ */
export function ThoraxSkeletonDiagram() {
  return (
    <svg viewBox="0 0 580 500" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Thorax Skeleton — Anterior View</title>
      {DEFS}

      <text x="290" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Thorax Skeleton — Anterior View</text>

      {/* ── STERNUM (center) ── */}
      {/* Manubrium */}
      <path d="M265,52 C262,48 258,46 258,52 C258,62 260,74 262,80 C264,86 268,88 272,88
               C276,88 281,86 282,80 C284,74 285,62 284,52 C284,46 280,48 278,52 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.4" filter="url(#ad2_sh)" />
      <text x="272" y="73" textAnchor="middle" fontSize="8" fill="#6B7280">Manub.</text>
      {/* Body of sternum */}
      <path d="M262,88 C260,94 259,140 260,200 C261,250 262,290 264,310 C266,316 270,318 272,318
               C274,318 278,316 280,310 C282,290 283,250 284,200 C285,140 284,94 282,88 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <text x="272" y="205" textAnchor="middle" fontSize="8" fill="#6B7280" transform="rotate(-90,272,205)">Body of Sternum</text>
      {/* Xiphoid process */}
      <path d="M264,310 C263,316 264,326 268,332 C270,336 274,336 276,332 C279,326 280,316 280,310 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1" />
      <line x1="285" y1="322" x2="330" y2="322" stroke="#4B5563" strokeWidth="0.8" />
      <text x="332" y="326" fontSize="9" fill="#CBD5E1">Xiphoid</text>

      {/* ── RIBS — both sides ── */}
      {/* True ribs 1-7 (attach directly to sternum via costal cartilage) */}
      {Array.from({ length: 7 }, (_, i) => {
        const y = 62 + i * 36;
        const leftX = 262 - (i < 2 ? 2 : 4) * (i + 1);
        const rightX = 282 + (i < 2 ? 2 : 4) * (i + 1);
        const curveDepth = 60 + i * 12;
        return (
          <g key={`true-${i}`}>
            {/* Left rib */}
            <path d={`M${leftX},${y} C${leftX - curveDepth},${y - 10} ${leftX - curveDepth - 40},${y + 15} ${leftX - curveDepth - 20},${y + 30}`}
              fill="none" stroke="url(#ad2_boneH)" strokeWidth={i < 2 ? 4 : 5} strokeLinecap="round" />
            <path d={`M${leftX},${y} C${leftX - curveDepth},${y - 10} ${leftX - curveDepth - 40},${y + 15} ${leftX - curveDepth - 20},${y + 30}`}
              fill="none" stroke="#8A6840" strokeWidth={i < 2 ? 1 : 1.2} strokeLinecap="round" />
            {/* Right rib */}
            <path d={`M${rightX},${y} C${rightX + curveDepth},${y - 10} ${rightX + curveDepth + 40},${y + 15} ${rightX + curveDepth + 20},${y + 30}`}
              fill="none" stroke="url(#ad2_boneH)" strokeWidth={i < 2 ? 4 : 5} strokeLinecap="round" />
            <path d={`M${rightX},${y} C${rightX + curveDepth},${y - 10} ${rightX + curveDepth + 40},${y + 15} ${rightX + curveDepth + 20},${y + 30}`}
              fill="none" stroke="#8A6840" strokeWidth={i < 2 ? 1 : 1.2} strokeLinecap="round" />
            {/* Costal cartilage (light blue, connects rib to sternum) */}
            <path d={`M${leftX},${y} L${263 - i * 0.5},${y}`}
              fill="none" stroke="#6090B0" strokeWidth={i < 2 ? 4 : 5} strokeLinecap="round" opacity="0.7" />
            <path d={`M${rightX},${y} L${281 + i * 0.5},${y}`}
              fill="none" stroke="#6090B0" strokeWidth={i < 2 ? 4 : 5} strokeLinecap="round" opacity="0.7" />
          </g>
        );
      })}

      {/* False ribs 8-10 (costal cartilage joins rib 7's cartilage) */}
      {Array.from({ length: 3 }, (_, i) => {
        const y = 62 + (7 + i) * 36;
        const curveDepth = 60 + (7 + i) * 12;
        return (
          <g key={`false-${i}`}>
            <path d={`M${272 - 30 - i * 10},${y} C${272 - 30 - i * 10 - curveDepth},${y - 12} ${50 - i * 15},${y + 15} ${30 - i * 8},${y + 32}`}
              fill="none" stroke="#9A7840" strokeWidth="4" strokeLinecap="round" />
            <path d={`M${272 + 30 + i * 10},${y} C${272 + 30 + i * 10 + curveDepth},${y - 12} ${494 + i * 15},${y + 15} ${510 + i * 8},${y + 32}`}
              fill="none" stroke="#9A7840" strokeWidth="4" strokeLinecap="round" />
            {/* Costal cartilage joining below */}
            <path d={`M${272 - 30 - i * 10},${y} Q${260 - i * 5},${y + 20} ${255},330`}
              fill="none" stroke="#5070A0" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
            <path d={`M${272 + 30 + i * 10},${y} Q${284 + i * 5},${y + 20} ${290},330`}
              fill="none" stroke="#5070A0" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          </g>
        );
      })}

      {/* Floating ribs 11-12 */}
      {Array.from({ length: 2 }, (_, i) => {
        const y = 62 + (10 + i) * 36;
        return (
          <g key={`float-${i}`}>
            <path d={`M${272 - 20 - i * 8},${y} C${140 - i * 20},${y - 8} ${95 - i * 20},${y + 20} ${115 - i * 15},${y + 35}`}
              fill="none" stroke="#8A6840" strokeWidth="3.5" strokeLinecap="round" />
            <path d={`M${272 + 20 + i * 8},${y} C${404 + i * 20},${y - 8} ${450 + i * 20},${y + 20} ${430 + i * 15},${y + 35}`}
              fill="none" stroke="#8A6840" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        );
      })}

      {/* ── CLAVICLES ── */}
      <path d="M258,54 C240,48 205,50 182,58 C165,64 158,72 162,78 C166,84 175,82 190,77 C210,71 235,64 258,60 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <path d="M286,54 C304,48 340,50 362,58 C378,64 385,72 381,78 C377,84 368,82 354,77 C334,71 308,64 285,60 Z"
        fill="url(#ad2_boneH)" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="195" y1="55" x2="165" y2="38" stroke="#4B5563" strokeWidth="0.8" />
      <text x="95" y="34" fontSize="10" fill="#CBD5E1">Clavicle (L)</text>
      <line x1="350" y1="55" x2="380" y2="38" stroke="#4B5563" strokeWidth="0.8" />
      <text x="382" y="34" fontSize="10" fill="#CBD5E1">Clavicle (R)</text>

      {/* ── LABELS ── */}
      <line x1="246" y1="60" x2="200" y2="48" stroke="#4B5563" strokeWidth="0.8" />
      <text x="108" y="44" fontSize="10" fill="#CBD5E1">Manubrium</text>
      <line x1="258" y1="200" x2="210" y2="200" stroke="#4B5563" strokeWidth="0.8" />
      <text x="130" y="204" fontSize="10" fill="#CBD5E1">Sternum</text>
      <text x="140" y="216" fontSize="9" fill="#9CA3AF">(Body)</text>

      {/* True / False / Floating rib labels */}
      <line x1="100" y1="156" x2="60" y2="156" stroke="#4B5563" strokeWidth="0.8" />
      <text x="4" y="145" fontSize="9" fill="#60A5FA">True Ribs</text>
      <text x="8" y="157" fontSize="9" fill="#60A5FA">1–7</text>
      <line x1="78" y1="320" x2="40" y2="320" stroke="#4B5563" strokeWidth="0.8" />
      <text x="4" y="316" fontSize="9" fill="#F59E0B">False Ribs</text>
      <text x="8" y="328" fontSize="9" fill="#F59E0B">8–10</text>
      <line x1="100" y1="418" x2="48" y2="418" stroke="#4B5563" strokeWidth="0.8" />
      <text x="4" y="415" fontSize="9" fill="#EC4899">Floating</text>
      <text x="4" y="427" fontSize="9" fill="#EC4899">11–12</text>

      {/* Costal cartilage label */}
      <text x="252" y="345" textAnchor="middle" fontSize="9" fill="#6090B0">Costal</text>
      <text x="252" y="357" textAnchor="middle" fontSize="9" fill="#6090B0">Cartilage</text>
      <text x="292" y="345" textAnchor="middle" fontSize="9" fill="#6090B0">Costal</text>
      <text x="292" y="357" textAnchor="middle" fontSize="9" fill="#6090B0">Cartilage</text>

      {/* Rib numbers on right side */}
      {Array.from({ length: 12 }, (_, i) => (
        <text key={i} x="435" y={67 + i * 36} fontSize="10" fill={i < 7 ? "#60A5FA" : i < 10 ? "#F59E0B" : "#EC4899"}>
          {i + 1}
        </text>
      ))}
      <text x="444" y="460" fontSize="9" fill="#6B7280">Rib #</text>

      <text x="290" y="486" textAnchor="middle" fontSize="10" fill="#6B7280">12 pairs of ribs protect thoracic viscera</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   4. SKULL — Lateral View (Right Side)
   ═══════════════════════════════════════════════════════════ */
export function SkullDiagram() {
  return (
    <svg viewBox="0 0 580 480" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Skull — Lateral View (Right Side)</title>
      <defs>
        <linearGradient id="skull_bone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C0A870" />
          <stop offset="40%" stopColor="#D8C090" />
          <stop offset="100%" stopColor="#A88848" />
        </linearGradient>
        <filter id="skull_sh"><feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/></filter>
      </defs>

      <text x="290" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Skull — Lateral View (Right Side)</text>

      {/* ── NEUROCRANIUM ── */}
      {/* Frontal bone (forehead) */}
      <path d="M160,180 C155,150 158,120 170,100 C180,84 196,72 215,66 C235,60 255,64 270,76
               C280,84 285,95 285,108 C285,120 280,128 272,132
               C255,140 235,145 218,150 C198,158 178,168 160,180 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.5" filter="url(#skull_sh)" />
      <text x="214" y="100" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2A1800">Frontal</text>
      <line x1="185" y1="90" x2="140" y2="70" stroke="#4B5563" strokeWidth="0.8" />
      <text x="75" y="66" fontSize="11" fill="#CBD5E1">Frontal</text>
      <text x="78" y="78" fontSize="11" fill="#CBD5E1">Bone</text>

      {/* Parietal bone (crown) */}
      <path d="M272,132 C288,126 310,122 330,126 C350,130 365,142 370,158
               C374,172 370,188 360,200 C348,214 330,222 310,226
               C290,230 270,226 255,218 C240,210 230,198 228,184
               C225,168 232,152 245,143 C254,138 262,134 272,132 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.5" filter="url(#skull_sh)" />
      <text x="308" y="178" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2A1800">Parietal</text>
      <line x1="375" y1="162" x2="425" y2="145" stroke="#4B5563" strokeWidth="0.8" />
      <text x="427" y="142" fontSize="11" fill="#CBD5E1">Parietal</text>
      <text x="431" y="154" fontSize="11" fill="#CBD5E1">Bone</text>

      {/* Temporal bone (side) */}
      <path d="M255,218 C240,224 226,235 218,250 C210,265 212,282 222,294
               C232,306 248,312 265,308 C280,304 293,294 300,280
               C308,264 308,244 300,230 C293,218 275,212 260,215 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.4" filter="url(#skull_sh)" />
      <text x="262" y="264" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2A1800">Temporal</text>
      <line x1="222" y1="278" x2="175" y2="292" stroke="#4B5563" strokeWidth="0.8" />
      <text x="102" y="289" fontSize="11" fill="#CBD5E1">Temporal</text>
      <text x="110" y="301" fontSize="11" fill="#CBD5E1">Bone</text>

      {/* Zygomatic process of temporal */}
      <path d="M300,262 C310,260 326,262 336,268 C344,274 346,284 340,290
               C334,296 320,296 310,290 C300,283 296,272 300,262 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.2" />

      {/* Mastoid process */}
      <path d="M282,302 C282,312 280,324 276,332 C272,340 266,344 260,342
               C254,340 252,332 254,324 C256,314 266,306 278,302 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="264" y1="336" x2="220" y2="350" stroke="#4B5563" strokeWidth="0.8" />
      <text x="145" y="347" fontSize="10" fill="#CBD5E1">Mastoid</text>
      <text x="148" y="359" fontSize="10" fill="#CBD5E1">Process</text>

      {/* External auditory meatus */}
      <ellipse cx="280" cy="278" rx="10" ry="8" fill="#F5F3EE" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="292" y1="274" x2="330" y2="258" stroke="#4B5563" strokeWidth="0.8" />
      <text x="332" y="255" fontSize="9" fill="#CBD5E1">Ext. Auditory</text>
      <text x="336" y="267" fontSize="9" fill="#CBD5E1">Meatus</text>

      {/* Occipital bone (back) */}
      <path d="M360,200 C374,215 380,235 378,258 C375,280 364,300 348,312
               C332,324 312,330 295,324 C280,318 268,308 264,295
               C260,282 266,268 278,258 C290,248 308,242 322,240
               C338,238 352,220 360,200 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.4" filter="url(#skull_sh)" />
      <text x="334" y="268" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2A1800">Occipital</text>
      <line x1="378" y1="255" x2="425" y2="258" stroke="#4B5563" strokeWidth="0.8" />
      <text x="427" y="255" fontSize="11" fill="#CBD5E1">Occipital</text>
      <text x="432" y="267" fontSize="11" fill="#CBD5E1">Bone</text>

      {/* ── VISCEROCRANIUM ── */}
      {/* Zygomatic bone (cheek) */}
      <path d="M190,200 C195,192 206,188 218,190 C228,192 235,200 234,210
               C232,220 222,228 210,228 C200,228 190,220 188,210 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.3" filter="url(#skull_sh)" />
      <text x="211" y="213" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2A1800">Zyg.</text>
      <line x1="188" y1="208" x2="148" y2="214" stroke="#4B5563" strokeWidth="0.8" />
      <text x="68" y="211" fontSize="10" fill="#CBD5E1">Zygomatic</text>
      <text x="76" y="223" fontSize="10" fill="#CBD5E1">(Cheek)</text>

      {/* Nasal bone */}
      <path d="M175,188 C172,180 170,172 172,166 C174,160 180,158 186,162
               C190,166 190,174 188,182 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.1" />
      <line x1="170" y1="172" x2="130" y2="158" stroke="#4B5563" strokeWidth="0.8" />
      <text x="72" y="155" fontSize="10" fill="#CBD5E1">Nasal</text>
      <text x="76" y="167" fontSize="10" fill="#CBD5E1">Bone</text>

      {/* Orbit / Eye socket */}
      <path d="M160,180 C162,168 168,158 178,152 C188,146 200,148 210,156
               C220,162 224,172 220,184 C216,194 206,200 194,200
               C182,200 170,194 162,186 Z"
        fill="#F5F3EE" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="183" y1="150" x2="150" y2="130" stroke="#4B5563" strokeWidth="0.8" />
      <text x="72" y="127" fontSize="10" fill="#CBD5E1">Orbit</text>
      <text x="65" y="139" fontSize="10" fill="#CBD5E1">(Eye socket)</text>

      {/* Maxilla */}
      <path d="M162,186 C158,196 156,210 158,224 C160,234 168,240 178,240
               C188,240 196,232 196,222 C196,212 192,202 186,196
               C180,190 170,186 162,186 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.3" />
      <text x="176" y="224" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2A1800">Maxilla</text>
      <line x1="155" y1="220" x2="112" y2="228" stroke="#4B5563" strokeWidth="0.8" />
      <text x="52" y="225" fontSize="10" fill="#CBD5E1">Maxilla</text>
      <text x="44" y="237" fontSize="10" fill="#CBD5E1">(Upper jaw)</text>

      {/* Mandible */}
      <path d="M157,242 C152,252 149,268 152,284 C155,300 168,312 185,316
               C202,320 222,314 236,302 C248,290 252,274 248,260
               C244,247 234,238 222,236 C208,234 192,240 178,244
               C168,247 160,244 157,242 Z"
        fill="url(#skull_bone)" stroke="#8A6840" strokeWidth="1.4" filter="url(#skull_sh)" />
      {/* Teeth (simplified) */}
      {[165, 177, 189, 201, 213, 225, 235].map((x, i) => (
        <rect key={i} x={x} y={238} width={8} height={9} rx="1" fill="#E8DCC0" stroke="#9A7840" strokeWidth="0.5" />
      ))}
      <text x="198" y="282" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2A1800">Mandible</text>
      <line x1="175" y1="308" x2="140" y2="326" stroke="#4B5563" strokeWidth="0.8" />
      <text x="56" y="323" fontSize="10" fill="#CBD5E1">Mandible</text>
      <text x="44" y="335" fontSize="10" fill="#CBD5E1">(Lower jaw)</text>

      {/* ── SUTURES ── */}
      <path d="M272,132 C268,145 262,162 255,178 C248,194 240,208 228,218"
        fill="none" stroke="#6A5030" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="200" y="142" fontSize="9" fill="#6A5030">Coronal</text>
      <text x="200" y="152" fontSize="9" fill="#6A5030">Suture</text>

      <path d="M310,226 C302,236 290,246 278,254 C266,262 254,268 244,274"
        fill="none" stroke="#6A5030" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="308" y="234" fontSize="9" fill="#6A5030">Squamous</text>
      <text x="318" y="246" fontSize="9" fill="#6A5030">Suture</text>

      <path d="M360,200 C348,208 334,212 320,214 C306,216 290,216 275,214"
        fill="none" stroke="#6A5030" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="315" y="205" fontSize="9" fill="#6A5030">Lambda</text>
      <text x="315" y="216" fontSize="9" fill="#6A5030">Suture</text>

      <text x="290" y="465" textAnchor="middle" fontSize="10" fill="#6B7280">Skull = 22 bones (8 cranial + 14 facial)</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   5. BRAIN — Lateral View (functional areas)
   ═══════════════════════════════════════════════════════════ */
export function BrainLateralDiagram() {
  return (
    <svg viewBox="0 0 620 460" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Brain — Lateral View (Left Hemisphere)</title>
      <defs>
        <linearGradient id="brain_base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7A3060" />
          <stop offset="50%" stopColor="#9A4880" />
          <stop offset="100%" stopColor="#6A2050" />
        </linearGradient>
        <filter id="brain_sh"><feDropShadow dx="2" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.6"/></filter>
      </defs>

      <text x="310" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Brain — Left Hemisphere (Lateral View)</text>

      {/* ── CEREBRAL HEMISPHERE outline ── */}
      <path d="M120,280 C112,260 105,230 108,200 C110,170 120,142 138,120
               C158,96 184,80 214,72 C244,64 278,68 308,80
               C340,92 368,114 388,142 C408,170 416,202 414,234
               C412,266 400,294 382,314 C362,336 334,350 304,356
               C274,362 242,360 215,348 C188,336 164,316 148,292 Z"
        fill="url(#brain_base)" stroke="#C070A0" strokeWidth="2" filter="url(#brain_sh)" />

      {/* ── LOBES (color-coded regions) ── */}
      {/* Frontal lobe */}
      <path d="M120,280 C115,255 110,224 116,192 C122,162 136,136 158,120
               C176,106 200,96 225,92 C240,90 248,95 248,108
               C248,125 238,142 226,160 C214,178 200,194 188,214
               C176,234 162,256 148,276 Z"
        fill="#3B82F6" fillOpacity="0.35" stroke="#3B82F6" strokeWidth="1.2" />
      <text x="182" y="160" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#93C5FD">Frontal</text>
      <text x="182" y="174" textAnchor="middle" fontSize="10" fill="#93C5FD">Lobe</text>

      {/* Parietal lobe */}
      <path d="M248,108 C266,100 290,96 314,100 C338,104 358,120 368,142
               C378,164 376,188 366,208 C354,228 336,242 314,248
               C292,254 270,250 252,240 C234,228 226,210 226,190
               C226,168 236,148 248,130 Z"
        fill="#22C55E" fillOpacity="0.3" stroke="#22C55E" strokeWidth="1.2" />
      <text x="306" y="176" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#86EFAC">Parietal</text>
      <text x="306" y="190" textAnchor="middle" fontSize="10" fill="#86EFAC">Lobe</text>

      {/* Occipital lobe */}
      <path d="M366,208 C380,228 390,254 388,280 C386,306 374,328 356,342
               C338,356 314,360 292,354 C270,348 250,334 242,316
               C234,298 240,278 252,262 C264,246 280,238 296,236
               C316,232 348,222 366,208 Z"
        fill="#F59E0B" fillOpacity="0.3" stroke="#F59E0B" strokeWidth="1.2" />
      <text x="318" y="294" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FCD34D">Occipital</text>
      <text x="318" y="308" textAnchor="middle" fontSize="10" fill="#FCD34D">Lobe</text>

      {/* Temporal lobe */}
      <path d="M148,276 C162,258 178,242 196,230 C214,218 234,210 252,214
               C260,216 264,224 260,236 C256,248 244,260 232,272
               C218,284 202,294 186,302 C170,310 152,316 140,310
               C128,304 126,290 132,280 Z"
        fill="#EC4899" fillOpacity="0.3" stroke="#EC4899" strokeWidth="1.2" />
      <text x="198" y="270" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#F9A8D4">Temporal</text>
      <text x="198" y="284" textAnchor="middle" fontSize="10" fill="#F9A8D4">Lobe</text>

      {/* ── FISSURES ── */}
      {/* Central sulcus (Rolandic) */}
      <path d="M248,108 C245,122 240,138 232,152 C224,166 214,180 206,194"
        fill="none" stroke="#0F1729" strokeWidth="1.5" opacity="0.6" />
      <text x="252" y="138" fontSize="9" fill="#0F1729" opacity="0.8">Central</text>
      <text x="252" y="150" fontSize="9" fill="#0F1729" opacity="0.8">Sulcus</text>

      {/* Lateral fissure (Sylvian) */}
      <path d="M150,236 C168,228 192,222 218,218 C244,214 268,216 288,224"
        fill="none" stroke="#0F1729" strokeWidth="1.5" opacity="0.6" />
      <text x="186" y="228" fontSize="9" fill="#0F1729" opacity="0.8">Lateral Fissure</text>

      {/* ── CEREBELLUM ── */}
      <path d="M340,340 C345,328 356,320 370,320 C390,320 408,332 414,350
               C420,368 412,388 396,398 C380,408 360,408 346,396
               C332,384 330,362 338,346 Z"
        fill="#6B4A8A" stroke="#A07AC8" strokeWidth="1.4" filter="url(#brain_sh)" />
      {/* Cerebellum folia lines */}
      {[345, 358, 372, 386, 398].map(x => (
        <line key={x} x1={x} y1="322" x2={x - 4} y2="395" stroke="#A07AC8" strokeWidth="0.6" opacity="0.5" />
      ))}
      <text x="378" y="362" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C4B5FD">Cerebellum</text>
      <line x1="420" y1="360" x2="465" y2="360" stroke="#4B5563" strokeWidth="0.8" />
      <text x="467" y="356" fontSize="10" fill="#CBD5E1">Cerebellum</text>
      <text x="467" y="368" fontSize="9" fill="#9CA3AF">(balance)</text>

      {/* ── BRAINSTEM ── */}
      <path d="M330,345 C326,355 324,368 326,382 C328,394 336,402 346,404
               C340,396 336,382 338,368 C340,355 338,348 334,344 Z"
        fill="#4A3070" stroke="#8B5CF6" strokeWidth="1.2" />
      <text x="316" y="380" textAnchor="middle" fontSize="9" fill="#C4B5FD">Brainstem</text>
      <line x1="296" y1="378" x2="312" y2="380" stroke="#4B5563" strokeWidth="0.8" />

      {/* ── FUNCTIONAL AREA LABELS ── */}
      <line x1="155" y1="125" x2="108" y2="100" stroke="#4B5563" strokeWidth="0.8" />
      <text x="30" y="97" fontSize="9" fill="#93C5FD">Motor</text>
      <text x="22" y="109" fontSize="9" fill="#93C5FD">Cortex</text>

      <line x1="160" y1="220" x2="105" y2="235" stroke="#4B5563" strokeWidth="0.8" />
      <text x="25" y="232" fontSize="9" fill="#F9A8D4">Wernicke's</text>
      <text x="20" y="244" fontSize="9" fill="#F9A8D4">Area (lang.)</text>

      <line x1="218" y1="88" x2="218" y2="52" stroke="#4B5563" strokeWidth="0.8" />
      <text x="158" y="48" fontSize="9" fill="#86EFAC">Prefrontal</text>
      <text x="158" y="60" fontSize="9" fill="#86EFAC">Cortex</text>

      <line x1="344" y1="108" x2="380" y2="84" stroke="#4B5563" strokeWidth="0.8" />
      <text x="382" y="81" fontSize="9" fill="#FCD34D">Visual</text>
      <text x="382" y="93" fontSize="9" fill="#FCD34D">Cortex</text>

      <text x="310" y="446" textAnchor="middle" fontSize="10" fill="#6B7280">Four lobes: Frontal · Parietal · Temporal · Occipital</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   6. HEART — Cross-Section Anatomy (Anterior View)
   ═══════════════════════════════════════════════════════════ */
export function HeartAnatomyDiagram() {
  return (
    <svg viewBox="0 0 580 500" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Heart Anatomy — Anterior Cross Section</title>
      <defs>
        <linearGradient id="ht_muscle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B1A1A" />
          <stop offset="50%" stopColor="#B83030" />
          <stop offset="100%" stopColor="#7A1010" />
        </linearGradient>
        <linearGradient id="ht_ao" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C03030" />
          <stop offset="100%" stopColor="#E04040" />
        </linearGradient>
        <linearGradient id="ht_pa" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A50A0" />
          <stop offset="100%" stopColor="#3070C0" />
        </linearGradient>
        <filter id="ht_sh"><feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.6"/></filter>
      </defs>

      <text x="290" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Heart — Anterior Cross Section</text>

      {/* ── HEART OUTLINE ── */}
      <path d="M180,100 C165,88 145,82 128,88 C105,96 90,120 88,148
               C86,175 98,202 118,224 C145,252 175,274 205,295
               C230,312 254,328 272,345
               C290,328 315,312 340,295
               C370,274 400,252 428,224
               C448,202 460,175 458,148
               C456,120 441,96 418,88
               C400,82 380,88 366,100
               C348,115 340,132 330,148
               C314,130 295,108 272,95
               C248,108 230,130 214,148
               C204,132 196,115 180,100 Z"
        fill="url(#ht_muscle)" stroke="#C05050" strokeWidth="2" filter="url(#ht_sh)" />

      {/* ── CHAMBERS ── */}
      {/* Right atrium (anatomical left in anterior view) */}
      <path d="M155,145 C145,150 138,162 140,176 C142,192 155,204 170,206
               C184,208 196,200 200,188 C204,175 198,160 186,153
               C176,146 165,142 155,145 Z"
        fill="#1A50A0" fillOpacity="0.6" stroke="#3B82F6" strokeWidth="1.5" />
      <text x="168" y="180" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#93C5FD">Right</text>
      <text x="168" y="192" textAnchor="middle" fontSize="9" fill="#93C5FD">Atrium</text>

      {/* Left atrium (anatomical right in anterior view) */}
      <path d="M345,145 C357,142 370,148 376,162 C382,176 376,192 362,200
               C348,208 334,204 327,190 C320,175 325,158 338,150 Z"
        fill="#C03030" fillOpacity="0.5" stroke="#EF4444" strokeWidth="1.5" />
      <text x="354" y="177" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FCA5A5">Left</text>
      <text x="354" y="189" textAnchor="middle" fontSize="9" fill="#FCA5A5">Atrium</text>

      {/* Right ventricle */}
      <path d="M148,212 C138,225 128,248 130,272 C132,296 148,316 170,330
               C192,344 220,348 240,338 C255,330 262,312 258,292
               C254,272 240,256 224,248 C210,240 194,234 178,228
               C163,222 152,214 148,212 Z"
        fill="#1A40A0" fillOpacity="0.5" stroke="#3B82F6" strokeWidth="1.5" />
      <text x="192" y="286" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#93C5FD">Right</text>
      <text x="192" y="298" textAnchor="middle" fontSize="9" fill="#93C5FD">Ventricle</text>

      {/* Left ventricle */}
      <path d="M295,248 C278,254 264,270 260,290 C256,312 264,336 282,348
               C300,360 325,358 344,344 C364,330 376,306 374,282
               C372,258 356,240 338,234 C322,228 308,242 295,248 Z"
        fill="#B01010" fillOpacity="0.5" stroke="#EF4444" strokeWidth="1.5" />
      <text x="318" y="298" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#FCA5A5">Left</text>
      <text x="318" y="310" textAnchor="middle" fontSize="9" fill="#FCA5A5">Ventricle</text>

      {/* Interventricular septum */}
      <path d="M258,200 C260,220 262,255 262,290 C262,310 260,330 258,345"
        fill="none" stroke="#0F1729" strokeWidth="2" opacity="0.4" />

      {/* ── GREAT VESSELS ── */}
      {/* Aorta (ascending) */}
      <path d="M295,88 C292,68 295,45 298,30 C302,16 310,10 316,15 C322,20 320,35 316,48
               C312,60 310,75 308,90 Z"
        fill="url(#ht_ao)" stroke="#C03030" strokeWidth="1.5" />
      {/* Aortic arch */}
      <path d="M295,88 C285,72 278,58 285,45 C292,33 305,28 318,32 C330,36 335,48 328,60 C320,72 308,82 295,88"
        fill="none" stroke="url(#ht_ao)" strokeWidth="10" />
      <text x="282" y="42" textAnchor="middle" fontSize="9" fill="#FCA5A5">Aorta</text>
      <line x1="282" y1="45" x2="255" y2="52" stroke="#4B5563" strokeWidth="0.8" />
      <text x="200" y="50" fontSize="10" fill="#FCA5A5">Ascending</text>
      <text x="207" y="62" fontSize="10" fill="#FCA5A5">Aorta</text>

      {/* Pulmonary artery */}
      <path d="M240,95 C234,75 238,52 244,38 C248,26 256,22 260,28 C264,35 260,50 256,64
               C252,78 248,88 244,98 Z"
        fill="url(#ht_pa)" stroke="#3B82F6" strokeWidth="1.5" />
      <line x1="244" y1="45" x2="195" y2="30" stroke="#4B5563" strokeWidth="0.8" />
      <text x="100" y="27" fontSize="10" fill="#93C5FD">Pulmonary</text>
      <text x="114" y="39" fontSize="10" fill="#93C5FD">Artery</text>

      {/* Superior vena cava */}
      <path d="M148,120 C145,102 145,82 148,68 C150,56 158,50 164,56 C168,62 166,78 164,94
               C162,108 156,118 150,122 Z"
        fill="#2040A0" stroke="#3B82F6" strokeWidth="1.3" />
      <line x1="148" y1="82" x2="100" y2="72" stroke="#4B5563" strokeWidth="0.8" />
      <text x="15" y="69" fontSize="9" fill="#93C5FD">Superior</text>
      <text x="15" y="81" fontSize="9" fill="#93C5FD">Vena Cava</text>

      {/* ── VALVES ── */}
      <ellipse cx="205" cy="210" rx="12" ry="8" fill="none" stroke="#FCD34D" strokeWidth="1.5" />
      <text x="165" y="210" fontSize="8" fill="#FCD34D">TV</text>
      <ellipse cx="330" cy="210" rx="12" ry="8" fill="none" stroke="#FCD34D" strokeWidth="1.5" />
      <text x="348" y="210" fontSize="8" fill="#FCD34D">MV</text>

      {/* ── CORONARY ARTERIES ── */}
      <path d="M265,115 C255,125 240,130 228,138 C215,148 206,162 200,178"
        fill="none" stroke="#F97316" strokeWidth="2" />
      <text x="228" y="122" fontSize="8" fill="#F97316">LCA</text>
      <path d="M280,115 C290,125 305,130 318,140 C330,152 338,168 342,184"
        fill="none" stroke="#F97316" strokeWidth="2" />
      <text x="308" y="122" fontSize="8" fill="#F97316">RCA</text>
      <line x1="232" y1="118" x2="195" y2="98" stroke="#4B5563" strokeWidth="0.7" />
      <text x="100" y="95" fontSize="9" fill="#F97316">Coronary</text>
      <text x="100" y="107" fontSize="9" fill="#F97316">Arteries</text>

      {/* Legend */}
      <rect x="420" y="360" width="145" height="105" rx="6" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="492" y="378" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B7280">Legend</text>
      {([
        ["Oxygenated blood","#EF4444"],
        ["Deoxygenated blood","#3B82F6"],
        ["Coronary aa.","#F97316"],
        ["Heart valves","#FCD34D"],
      ] as [string, string][]).map(([l, c], i) => (
        <g key={l}>
          <rect x="428" y={384 + i * 18} width="12" height="10" rx="2" fill={c} />
          <text x="446" y={393 + i * 18} fontSize="8" fill="#6B7280">{l}</text>
        </g>
      ))}

      <text x="290" y="486" textAnchor="middle" fontSize="10" fill="#6B7280">4 chambers · 4 valves · Average 70 bpm</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   7. ABDOMEN — 9 Regions & Quadrants
   ═══════════════════════════════════════════════════════════ */
export function AbdomenRegionsDiagram() {
  return (
    <svg viewBox="0 0 560 500" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Abdominal Regions — 9 Regions & Quadrants</title>

      <text x="280" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Abdomen — 9 Regions & Key Organs</text>

      {/* Abdominal outline */}
      <path d="M120,60 C105,65 92,80 86,100 C80,120 80,160 82,200
               C84,240 88,280 92,316 C96,352 104,380 118,400
               C132,420 152,430 172,435 C210,443 250,445 280,445
               C310,445 350,443 388,435 C408,430 428,420 442,400
               C456,380 464,352 468,316 C472,280 476,240 478,200
               C480,160 480,120 474,100 C468,80 455,65 440,60 Z"
        fill="#1C2128" stroke="#374151" strokeWidth="2" />

      {/* 9 Region grid */}
      {/* Horizontal lines */}
      <line x1="86" y1="175" x2="474" y2="175" stroke="#4B5563" strokeWidth="1.5" />
      <line x1="88" y1="330" x2="472" y2="330" stroke="#4B5563" strokeWidth="1.5" />
      {/* Vertical lines */}
      <line x1="200" y1="60" x2="186" y2="445" stroke="#4B5563" strokeWidth="1.5" />
      <line x1="360" y1="60" x2="374" y2="445" stroke="#4B5563" strokeWidth="1.5" />

      {/* Region fills & labels */}
      {([
        { name:"Right\nHypochondrium", x:100, y:80, w:104, h:95, fill:"#1E3A5C", organ:"Liver (R lobe)\nGallbladder" },
        { name:"Epigastric", x:200, y:80, w:160, h:95, fill:"#1A3A2A", organ:"Stomach\nLiver (L lobe)\nPancreas" },
        { name:"Left\nHypochondrium", x:360, y:80, w:104, h:95, fill:"#1E3A5C", organ:"Spleen\nStomach" },
        { name:"Right\nLumbar", x:88, y:175, w:112, h:155, fill:"#2A2A10", organ:"Ascending\nColon\nRight Kidney" },
        { name:"Umbilical", x:200, y:175, w:160, h:155, fill:"#1C2A3A", organ:"Small intestine\nTransverse colon\nAorta" },
        { name:"Left\nLumbar", x:360, y:175, w:112, h:155, fill:"#2A2A10", organ:"Descending\nColon\nLeft Kidney" },
        { name:"Right Iliac\n(Inguinal)", x:92, y:330, w:108, h:100, fill:"#2A1A10", organ:"Appendix\nCaecum" },
        { name:"Hypogastric\n(Pubic)", x:200, y:330, w:160, h:105, fill:"#1A1A3A", organ:"Bladder\nUterus/Prostate\nSigmoid colon" },
        { name:"Left Iliac\n(Inguinal)", x:360, y:330, w:108, h:100, fill:"#2A1A10", organ:"Sigmoid colon\nOvary (L)" },
      ] as {name:string;x:number;y:number;w:number;h:number;fill:string;organ:string}[]).map(({name, x, y, w, h, fill, organ}) => (
        <g key={name}>
          <rect x={x} y={y} width={w} height={h} fill={fill} opacity="0.7" />
          {name.split("\n").map((line, i) => (
            <text key={i} x={x + w / 2} y={y + 20 + i * 14} textAnchor="middle"
              fontSize="10" fontWeight="bold" fill="#0F1729">{line}</text>
          ))}
          {organ.split("\n").map((line, i) => (
            <text key={`org-${i}`} x={x + w / 2} y={y + h - 36 + i * 14}
              textAnchor="middle" fontSize="9" fill="#6B7280">{line}</text>
          ))}
        </g>
      ))}

      {/* Quadrant labels (overlay) */}
      <text x="144" y="260" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B82F6" opacity="0.4">RUQ</text>
      <text x="414" y="260" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3B82F6" opacity="0.4">LUQ</text>
      <text x="144" y="385" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#F59E0B" opacity="0.4">RLQ</text>
      <text x="414" y="385" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#F59E0B" opacity="0.4">LLQ</text>

      {/* Umbilicus */}
      <circle cx="280" cy="254" r="8" fill="#F5F3EE" stroke="#6B7280" strokeWidth="1.2" />
      <text x="280" y="276" textAnchor="middle" fontSize="9" fill="#6B7280">Umbilicus</text>

      <text x="280" y="472" textAnchor="middle" fontSize="10" fill="#6B7280">9 regions (3×3 grid) for clinical localization of abdominal pain</text>
    </svg>
  );
}


/* ═══════════════════════════════════════════════════════════
   8. CRANIAL NERVES — Overview Diagram
   ═══════════════════════════════════════════════════════════ */
export function CranialNervesDiagram() {
  const nerves: [string, string, string, number, string][] = [
    ["I", "Olfactory", "Sensory", 52, "Smell"],
    ["II", "Optic", "Sensory", 88, "Vision"],
    ["III", "Oculomotor", "Motor", 124, "Eye movement"],
    ["IV", "Trochlear", "Motor", 160, "Superior oblique"],
    ["V", "Trigeminal", "Both", 196, "Face sensation + chewing"],
    ["VI", "Abducens", "Motor", 232, "Lateral rectus"],
    ["VII", "Facial", "Both", 268, "Face expression + taste"],
    ["VIII", "Vestibulocochlear", "Sensory", 304, "Hearing + balance"],
    ["IX", "Glossopharyngeal", "Both", 340, "Throat sensation + taste"],
    ["X", "Vagus", "Both", 376, "Heart, lungs, gut"],
    ["XI", "Accessory", "Motor", 412, "SCM + trapezius"],
    ["XII", "Hypoglossal", "Motor", 448, "Tongue movement"],
  ];

  return (
    <svg viewBox="0 0 660 530" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Cranial Nerves I–XII</title>

      <text x="330" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">12 Cranial Nerves</text>

      {/* Headers */}
      {(["CN #", "Name", "Type", "Function"] as string[]).map((h, i) => (
        <text key={h} x={[38, 80, 282, 390][i]} y="42" fontSize="11" fontWeight="bold" fill="#6B7280">{h}</text>
      ))}
      <line x1="20" y1="48" x2="640" y2="48" stroke="#E5E1D8" strokeWidth="1.5" />

      {nerves.map(([num, name, type, y, fn]) => {
        const typeColor = type === "Sensory" ? "#3B82F6" : type === "Motor" ? "#22C55E" : "#F59E0B";
        const isEven = parseInt(num) % 2 === 0;
        return (
          <g key={num}>
            {isEven && <rect x="20" y={y - 16} width="620" height="36" fill="#E5E1D8" fillOpacity="0.3" />}
            {/* CN number */}
            <circle cx="38" cy={y + 2} r="13" fill={typeColor} fillOpacity="0.2" stroke={typeColor} strokeWidth="1.2" />
            <text x="38" y={y + 7} textAnchor="middle" fontSize="11" fontWeight="bold" fill={typeColor}>{num}</text>
            {/* Name */}
            <text x="80" y={y + 7} fontSize="11" fontWeight="bold" fill="#0F1729">{name}</text>
            {/* Type badge */}
            <rect x="280" y={y - 10} width="80" height="22" rx="6" fill={typeColor} fillOpacity="0.15" stroke={typeColor} strokeWidth="1" />
            <text x="320" y={y + 5} textAnchor="middle" fontSize="10" fill={typeColor}>{type}</text>
            {/* Function */}
            <text x="380" y={y + 7} fontSize="10" fill="#6B7280">{fn}</text>
          </g>
        );
      })}

      {/* Mnemonic */}
      <rect x="20" y="476" width="620" height="42" rx="6" fill="#1C2128" stroke="#E5E1D8" strokeWidth="1" />
      <text x="330" y="492" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#00C2A8">Mnemonic:</text>
      <text x="330" y="507" textAnchor="middle" fontSize="9" fill="#6B7280">"Oh Oh Oh To Touch And Feel Very Good Velvet. Ah Heaven!"</text>
    </svg>
  );
}
