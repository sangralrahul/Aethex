export function UpperLimbBonesDiagram() {
  return (
    <svg viewBox="0 0 560 780" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Bones of the Upper Limb — Anterior View</title>
      <defs>
        <linearGradient id="boneH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A88550" />
          <stop offset="25%" stopColor="#C8A870" />
          <stop offset="60%" stopColor="#E2CFA0" />
          <stop offset="85%" stopColor="#D0B880" />
          <stop offset="100%" stopColor="#A88050" />
        </linearGradient>
        <linearGradient id="boneShaft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9A7848" />
          <stop offset="20%" stopColor="#BFA070" />
          <stop offset="50%" stopColor="#D8C090" />
          <stop offset="80%" stopColor="#BFA070" />
          <stop offset="100%" stopColor="#9A7848" />
        </linearGradient>
        <linearGradient id="cartilage" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5888A8" />
          <stop offset="50%" stopColor="#80B0D0" />
          <stop offset="100%" stopColor="#5888A8" />
        </linearGradient>
        <filter id="bs">
          <feDropShadow dx="1.5" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.45"/>
        </filter>
      </defs>

      {/* ── TITLE ── */}
      <text x="200" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F1729">Upper Limb Bones — Anterior View</text>
      <text x="200" y="38" textAnchor="middle" fontSize="10" fill="#6B7280">(Right side)</text>

      {/* ══════ CLAVICLE ══════ */}
      {/* S-shaped, slightly curved horizontal bone */}
      <path d="M82,68 C92,58 115,57 140,62 C165,67 185,65 205,63
               C225,61 248,60 268,64 C288,68 302,74 306,81
               C309,87 303,94 293,92 C283,90 268,85 248,82
               C228,79 208,78 188,80 C168,82 148,80 128,76
               C108,72 90,76 82,70 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1.3" filter="url(#bs)" />
      <line x1="194" y1="62" x2="194" y2="44" stroke="#4B5563" strokeWidth="0.8" />
      <text x="194" y="40" textAnchor="middle" fontSize="11" fill="#CBD5E1" fontStyle="italic">Clavicle</text>

      {/* ══════ SCAPULA (partial) ══════ */}
      {/* Acromion process at lateral end */}
      <path d="M294,84 C306,78 320,77 324,83 C328,89 320,98 308,102 C297,105 287,101 285,94 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1.2" filter="url(#bs)" />
      {/* Coracoid process */}
      <path d="M284,94 C282,100 278,108 276,116 C274,124 276,130 280,130 C284,130 287,124 286,116 C285,108 284,100 284,94 Z"
        fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="1" />
      {/* Scapular body (triangular, partially visible behind humerus) */}
      <path d="M286,96 C283,105 279,122 276,142 C273,160 273,172 276,178
               C268,172 261,152 260,128 C259,106 265,90 274,86 Z"
        fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="1.2" />
      <line x1="324" y1="82" x2="365" y2="68" stroke="#4B5563" strokeWidth="0.8" />
      <text x="368" y="65" fontSize="10" fill="#CBD5E1" fontStyle="italic">Acromion</text>
      <line x1="262" y1="135" x2="225" y2="155" stroke="#4B5563" strokeWidth="0.8" />
      <text x="168" y="152" fontSize="10" fill="#CBD5E1" fontStyle="italic">Scapula</text>

      {/* ══════ HUMERUS ══════ */}
      {/* Humeral head — articular cartilage */}
      <ellipse cx="257" cy="110" rx="33" ry="27" fill="url(#cartilage)" stroke="#4A7898" strokeWidth="1.3" filter="url(#bs)" />
      {/* Humeral head bone beneath */}
      <ellipse cx="255" cy="108" rx="25" ry="21" fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Greater tuberosity */}
      <path d="M281,100 C293,95 300,102 298,114 C295,123 286,126 278,120 C275,115 277,106 281,100 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Lesser tuberosity */}
      <path d="M236,114 C228,110 224,115 225,124 C226,132 233,136 240,133 C243,130 241,120 236,114 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.8" />
      {/* Intertubercular groove label line */}
      <line x1="250" y1="118" x2="225" y2="138" stroke="#4B5563" strokeWidth="0.6" strokeDasharray="2,1" />
      {/* Surgical neck */}
      <path d="M232,128 C236,132 244,136 256,137 C268,137 278,133 282,128
               C281,138 279,146 275,150 C271,154 264,156 256,156
               C248,156 241,154 237,150 C233,146 231,138 232,128 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Humerus shaft — organic form, gently bowed anteriorly */}
      <path d="M238,154 C234,164 232,184 231,214
               C230,254 231,294 233,324
               C234,334 237,340 240,346
               C244,354 250,358 257,358
               C264,358 270,354 274,346
               C277,340 279,334 280,324
               C283,294 283,254 282,214
               C281,184 279,164 275,154
               C270,149 262,147 256,147
               C250,147 242,149 238,154 Z"
        fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="1.3" filter="url(#bs)" />
      {/* Lateral supracondylar ridge */}
      <path d="M279,314 C283,320 288,328 292,338 C295,346 295,356 290,362 C286,366 280,366 276,362 L279,354 C282,348 282,338 280,326 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Medial supracondylar ridge */}
      <path d="M234,316 C230,322 225,330 221,340 C218,348 218,358 223,363 C227,367 233,367 237,363 L234,354 C231,348 231,338 233,326 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Distal articular surface — trochlea + capitulum */}
      <path d="M221,360 C221,368 224,375 229,380 C234,384 242,385 250,382
               L257,384 L264,382
               C272,385 280,384 285,380 C290,375 292,368 292,360 Z"
        fill="url(#cartilage)" stroke="#4A7898" strokeWidth="1" />
      {/* Labels */}
      <line x1="300" y1="108" x2="348" y2="92" stroke="#4B5563" strokeWidth="0.8" />
      <text x="350" y="89" fontSize="10" fill="#CBD5E1" fontStyle="italic">Humeral</text>
      <text x="350" y="101" fontSize="10" fill="#CBD5E1" fontStyle="italic">Head</text>
      <line x1="283" y1="250" x2="325" y2="250" stroke="#4B5563" strokeWidth="0.8" />
      <text x="327" y="254" fontSize="12" fill="#0F1729" fontWeight="bold">Humerus</text>
      <text x="327" y="267" fontSize="9" fill="#9CA3AF">(arm bone)</text>
      <line x1="222" y1="362" x2="175" y2="362" stroke="#4B5563" strokeWidth="0.8" />
      <text x="110" y="358" fontSize="10" fill="#CBD5E1">Medial</text>
      <text x="104" y="370" fontSize="10" fill="#CBD5E1">Epicondyle</text>
      <line x1="292" y1="362" x2="338" y2="362" stroke="#4B5563" strokeWidth="0.8" />
      <text x="340" y="366" fontSize="10" fill="#CBD5E1">Lateral</text>
      <text x="340" y="378" fontSize="10" fill="#CBD5E1">Epicondyle</text>

      {/* ══════ RADIUS (lateral — thumb side) ══════ */}
      {/* Radial head — circular, articular */}
      <ellipse cx="243" cy="390" rx="15" ry="11" fill="url(#cartilage)" stroke="#4A7898" strokeWidth="1.2" filter="url(#bs)" />
      <ellipse cx="243" cy="390" rx="11" ry="8" fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.8" />
      {/* Radial neck */}
      <path d="M237,398 C238,403 239,412 240,420 L248,420 C249,412 250,403 251,398 Z"
        fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="0.8" />
      {/* Radial tuberosity */}
      <path d="M237,418 C232,422 229,430 231,437 C233,443 238,445 243,443 L243,430 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Radius shaft — widens distally (characteristic) */}
      <path d="M238,428 C235,442 233,465 232,492
               C231,515 232,536 234,548
               C236,558 240,565 246,569
               C252,573 258,573 263,569
               C268,565 271,556 272,546
               C274,532 274,512 272,490
               C270,464 268,440 265,428
               C262,421 258,418 252,418
               C246,418 241,421 238,428 Z"
        fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="1.2" filter="url(#bs)" />
      {/* Distal radius — expanded, wider end */}
      <path d="M229,550 C227,557 226,564 228,571 C231,578 238,583 248,583
               C258,583 265,578 268,571 C270,564 269,557 267,550 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1.2" />
      {/* Radial styloid process */}
      <path d="M228,572 C225,576 224,581 226,586 C228,590 232,591 235,589 C237,586 237,580 235,575 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Labels */}
      <line x1="229" y1="390" x2="190" y2="388" stroke="#4B5563" strokeWidth="0.8" />
      <text x="132" y="384" fontSize="10" fill="#CBD5E1">Radial</text>
      <text x="138" y="396" fontSize="10" fill="#CBD5E1">Head</text>
      <line x1="231" y1="505" x2="190" y2="505" stroke="#4B5563" strokeWidth="0.8" />
      <text x="145" y="509" fontSize="12" fill="#0F1729" fontWeight="bold">Radius</text>
      <line x1="226" y1="578" x2="190" y2="590" stroke="#4B5563" strokeWidth="0.8" />
      <text x="130" y="588" fontSize="9" fill="#CBD5E1">Styloid</text>
      <text x="128" y="599" fontSize="9" fill="#CBD5E1">Process</text>

      {/* ══════ ULNA (medial — pinky side) ══════ */}
      {/* Olecranon process — prominent bony projection */}
      <path d="M271,364 C272,354 278,348 287,350 C296,352 300,360 299,370
               C298,380 291,386 283,387 C276,388 270,383 268,374 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="1.3" filter="url(#bs)" />
      {/* Trochlear notch (articulates with humerus trochlea) */}
      <path d="M269,374 C268,382 270,392 275,398 C279,403 285,404 290,400
               C295,395 297,386 296,376 Z"
        fill="url(#cartilage)" stroke="#4A7898" strokeWidth="1" />
      {/* Coronoid process */}
      <path d="M275,396 C273,403 272,410 274,416 C276,420 280,420 283,416 C285,410 285,402 283,396 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.9" />
      {/* Ulna shaft — tapers distally */}
      <path d="M272,410 C270,424 268,448 267,472
               C266,498 267,524 269,542
               C270,552 272,560 275,565
               C277,568 280,569 283,568
               C286,567 288,565 289,562
               C291,556 292,546 291,534
               C290,514 288,490 287,464
               C286,440 284,420 282,410
               C279,407 276,405 274,405 Z"
        fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="1.2" filter="url(#bs)" />
      {/* Distal ulna (ulnar head) — small, round */}
      <ellipse cx="281" cy="571" rx="10" ry="8" fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" />
      {/* Ulnar styloid process */}
      <path d="M279,578 C278,582 279,588 281,590 C283,590 285,587 285,583 C285,579 283,576 281,576 Z"
        fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.9" />
      {/* Labels */}
      <line x1="299" y1="364" x2="340" y2="350" stroke="#4B5563" strokeWidth="0.8" />
      <text x="342" y="347" fontSize="10" fill="#CBD5E1">Olecranon</text>
      <text x="342" y="359" fontSize="9" fill="#9CA3AF">Process</text>
      <line x1="292" y1="505" x2="335" y2="505" stroke="#4B5563" strokeWidth="0.8" />
      <text x="337" y="509" fontSize="12" fill="#0F1729" fontWeight="bold">Ulna</text>
      <line x1="285" y1="584" x2="320" y2="592" stroke="#4B5563" strokeWidth="0.8" />
      <text x="322" y="592" fontSize="9" fill="#CBD5E1">Ulnar</text>
      <text x="322" y="603" fontSize="9" fill="#CBD5E1">Styloid</text>

      {/* ══════ CARPAL BONES ══════ */}
      {/* Proximal row */}
      {([
        {cx:233, cy:600, rx:14, ry:10, label:"Scaphoid"},
        {cx:249, cy:598, rx:12, ry:11, label:"Lunate"},
        {cx:265, cy:598, rx:11, ry:10, label:"Triquetrum"},
        {cx:277, cy:606, rx:9, ry:8, label:"Pisiform"},
      ] as {cx:number;cy:number;rx:number;ry:number;label:string}[]).map(({cx,cy,rx,ry,label}) => (
        <ellipse key={label} cx={cx} cy={cy} rx={rx} ry={ry}
          fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" filter="url(#bs)" />
      ))}
      {/* Distal row */}
      {([
        {cx:231, cy:620, rx:13, ry:9},
        {cx:247, cy:619, rx:11, ry:10},
        {cx:261, cy:619, rx:11, ry:10},
        {cx:275, cy:618, rx:10, ry:10},
      ] as {cx:number;cy:number;rx:number;ry:number}[]).map(({cx,cy,rx,ry},i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill="url(#boneH)" stroke="#8A6840" strokeWidth="1" filter="url(#bs)" />
      ))}
      <line x1="222" y1="598" x2="185" y2="588" stroke="#4B5563" strokeWidth="0.8" />
      <text x="120" y="584" fontSize="10" fill="#CBD5E1">8 Carpal</text>
      <text x="125" y="596" fontSize="10" fill="#CBD5E1">Bones</text>

      {/* ══════ METACARPALS ══════ */}
      {([218,233,248,263,278] as number[]).map((x,i) => (
        <g key={i}>
          <path d={`M${x-5},633 C${x-7},637 ${x-7},642 ${x-6},655
                    L${x-3},672 C${x-2},676 ${x+1},678 ${x+4},678
                    C${x+7},678 ${x+10},676 ${x+11},672
                    L${x+13},655 C${x+14},642 ${x+13},637 ${x+11},633 Z`}
            fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="0.9" />
          <ellipse cx={x+3} cy={629} rx={8} ry={6}
            fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.9" />
        </g>
      ))}
      <line x1="224" y1="629" x2="185" y2="648" stroke="#4B5563" strokeWidth="0.8" />
      <text x="110" y="646" fontSize="10" fill="#CBD5E1">Metacarpals</text>
      <text x="122" y="658" fontSize="9" fill="#9CA3AF">I – V</text>

      {/* ══════ PHALANGES ══════ */}
      {([219,234,249,265,280] as number[]).map((x,i) => (
        <g key={i}>
          {/* Proximal phalanx */}
          <path d={`M${x-4},681 C${x-5},684 ${x-6},692 ${x-5},699
                    C${x-4},704 ${x},706 ${x+4},706
                    C${x+8},706 ${x+11},704 ${x+12},699
                    C${x+13},692 ${x+12},684 ${x+11},681 Z`}
            fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="0.8" />
          {i > 0 && (
            <path d={`M${x-3},709 C${x-4},712 ${x-5},719 ${x-4},725
                      C${x-3},729 ${x},731 ${x+4},731
                      C${x+8},731 ${x+10},729 ${x+11},725
                      C${x+12},719 ${x+11},712 ${x+10},709 Z`}
              fill="url(#boneShaft)" stroke="#8A6840" strokeWidth="0.8" />
          )}
          {i > 0 ? (
            <path d={`M${x-2},734 C${x-3},737 ${x-3},743 ${x-2},748
                      C${x-1},752 ${x+3},754 ${x+6},753
                      C${x+9},752 ${x+11},749 ${x+11},745
                      C${x+11},741 ${x+10},736 ${x+9},734 Z`}
              fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.8" />
          ) : (
            <path d={`M${x-3},709 C${x-4},712 ${x-4},718 ${x-3},723
                      C${x-2},727 ${x+2},729 ${x+5},728
                      C${x+8},727 ${x+10},724 ${x+10},720
                      C${x+10},716 ${x+9},711 ${x+8},709 Z`}
              fill="url(#boneH)" stroke="#8A6840" strokeWidth="0.8" />
          )}
        </g>
      ))}
      <line x1="228" y1="693" x2="188" y2="707" stroke="#4B5563" strokeWidth="0.8" />
      <text x="108" y="704" fontSize="10" fill="#CBD5E1">Phalanges</text>
      <text x="106" y="716" fontSize="9" fill="#9CA3AF">Prox·Mid·Distal</text>

      {/* ══════ JOINT LABELS ══════ */}
      <line x1="289" y1="116" x2="338" y2="116" stroke="#374151" strokeWidth="0.7" />
      <text x="340" y="113" fontSize="10" fill="#6B7280">Shoulder</text>
      <text x="340" y="125" fontSize="10" fill="#6B7280">Joint</text>

      <line x1="295" y1="381" x2="335" y2="388" stroke="#374151" strokeWidth="0.7" />
      <text x="337" y="386" fontSize="10" fill="#6B7280">Elbow</text>
      <text x="337" y="398" fontSize="10" fill="#6B7280">Joint</text>

      <line x1="253" y1="584" x2="280" y2="610" stroke="#374151" strokeWidth="0.7" />
      <text x="170" y="612" fontSize="10" fill="#6B7280" textAnchor="middle">Wrist Joint</text>

      {/* ══════ INTEROSSEOUS MEMBRANE ══════ */}
      <line x1="253" y1="435" x2="270" y2="435" stroke="#5A6572" strokeWidth="0.6" strokeDasharray="3,2" />
      <line x1="252" y1="465" x2="269" y2="465" stroke="#5A6572" strokeWidth="0.6" strokeDasharray="3,2" />
      <line x1="252" y1="495" x2="270" y2="495" stroke="#5A6572" strokeWidth="0.6" strokeDasharray="3,2" />
      <text x="145" y="470" fontSize="9" fill="#4B5563">Interosseous</text>
      <text x="148" y="481" fontSize="9" fill="#4B5563">Membrane</text>
      <line x1="192" y1="473" x2="250" y2="465" stroke="#4B5563" strokeWidth="0.6" strokeDasharray="2,1" />
    </svg>
  );
}


export function BrachialPlexusDiagram() {
  return (
    <svg viewBox="0 0 800 560" className="w-full" style={{ background: "#FFFFFF", borderRadius: 12 }}>
      <title>Brachial Plexus — Roots, Trunks, Divisions, Cords, Branches</title>
      <defs>
        <linearGradient id="nerveBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E4080" /><stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="nerveAmber" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#92400E" /><stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="nervePink" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#831843" /><stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <filter id="ns"><feDropShadow dx="1" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.5"/></filter>
      </defs>

      {/* Column headers */}
      {(["Roots","Trunks","Div","Cords","Branches"] as string[]).map((h,i) => (
        <text key={h} x={110+i*148} y={22} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#6B7280">{h}</text>
      ))}
      {/* Column dividers */}
      {[185,333,481,629].map(x => (
        <line key={x} x1={x} y1={30} x2={x} y2={530} stroke="#E5E1D8" strokeWidth="1" />
      ))}

      {/* ─── Roots C5–T1 with nerve-like shapes ─── */}
      {([
        ["C5", 70, "#60A5FA"],["C6", 140, "#60A5FA"],
        ["C7", 230, "#A78BFA"],
        ["C8", 320, "#FCA5A5"],["T1", 390, "#FCA5A5"],
      ] as [string,number,string][]).map(([r,y,col]) => (
        <g key={r}>
          {/* Nerve root as elongated organic shape */}
          <path d={`M62,${y-18} C55,${y-14} 52,${y-5} 54,${y+5} C56,${y+14} 63,${y+18} 72,${y+16} C80,${y+14} 85,${y+6} 83,${y-4} C81,${y-14} 72,${y-20} 62,${y-18} Z`}
            fill={col} fillOpacity="0.2" stroke={col} strokeWidth="1.5" />
          <text x="72" y={y+5} textAnchor="middle" fontSize="13" fontWeight="bold" fill={col}>{r}</text>
        </g>
      ))}

      {/* ─── Trunks ─── */}
      {/* Upper trunk (C5+C6) */}
      <path d="M85,70 Q135,70 155,105" stroke="#3B82F6" strokeWidth="3" fill="none" />
      <path d="M85,140 Q135,140 155,105" stroke="#3B82F6" strokeWidth="3" fill="none" />
      <rect x="145" y="83" width="82" height="44" rx="10" fill="#1D3A6E" stroke="#3B82F6" strokeWidth="1.8" filter="url(#ns)" />
      <text x="186" y="101" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#93C5FD">Upper</text>
      <text x="186" y="116" textAnchor="middle" fontSize="10" fill="#93C5FD">Trunk</text>

      {/* Middle trunk (C7) */}
      <path d="M85,230 Q135,230 155,238" stroke="#8B5CF6" strokeWidth="3" fill="none" />
      <rect x="145" y="216" width="82" height="44" rx="10" fill="#2D1B54" stroke="#8B5CF6" strokeWidth="1.8" filter="url(#ns)" />
      <text x="186" y="234" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C4B5FD">Middle</text>
      <text x="186" y="249" textAnchor="middle" fontSize="10" fill="#C4B5FD">Trunk</text>

      {/* Lower trunk (C8+T1) */}
      <path d="M85,320 Q135,340 155,355" stroke="#F59E0B" strokeWidth="3" fill="none" />
      <path d="M85,390 Q135,380 155,355" stroke="#F59E0B" strokeWidth="3" fill="none" />
      <rect x="145" y="333" width="82" height="44" rx="10" fill="#451A03" stroke="#F59E0B" strokeWidth="1.8" filter="url(#ns)" />
      <text x="186" y="351" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FCD34D">Lower</text>
      <text x="186" y="366" textAnchor="middle" fontSize="10" fill="#FCD34D">Trunk</text>

      {/* ─── Divisions ─── */}
      {/* Each trunk splits into Anterior (A) and Posterior (P) */}
      {([
        [105, "#3B82F6","A"], [145, "#3B82F6","P"],
        [230, "#8B5CF6","A"], [268, "#8B5CF6","P"],
        [350, "#F59E0B","A"], [390, "#F59E0B","P"],
      ] as [number,string,string][]).map(([y,col,type],i) => {
        const cx = 425;
        return (
          <g key={i}>
            <path d={`M227,${(i<2?105:i<4?238:355)} Q310,${y} 418,${y}`} stroke={col} strokeWidth="2" fill="none" />
            <circle cx={cx} cy={y} r="14" fill={col} fillOpacity="0.18" stroke={col} strokeWidth="1.5" />
            <text x={cx} y={y+5} textAnchor="middle" fontSize="11" fontWeight="bold" fill={col}>{type}</text>
          </g>
        );
      })}

      {/* ─── Cords ─── */}
      {/* Posterior cord (all posterior divs) */}
      <path d="M439,145 Q480,230 490,248" stroke="#EC4899" strokeWidth="2.5" fill="none" />
      <path d="M439,268 Q480,248 490,248" stroke="#EC4899" strokeWidth="2.5" fill="none" />
      <path d="M439,390 Q480,320 490,248" stroke="#EC4899" strokeWidth="2.5" fill="none" />
      <rect x="482" y="226" width="90" height="44" rx="10" fill="#500724" stroke="#EC4899" strokeWidth="1.8" filter="url(#ns)" />
      <text x="527" y="244" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#F9A8D4">Posterior</text>
      <text x="527" y="259" textAnchor="middle" fontSize="10" fill="#F9A8D4">Cord</text>

      {/* Lateral cord */}
      <path d="M439,105 Q480,200 490,316" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      <path d="M439,230 Q480,280 490,316" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
      <rect x="482" y="294" width="90" height="44" rx="10" fill="#1E3A5F" stroke="#3B82F6" strokeWidth="1.8" filter="url(#ns)" />
      <text x="527" y="312" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#93C5FD">Lateral</text>
      <text x="527" y="327" textAnchor="middle" fontSize="10" fill="#93C5FD">Cord</text>

      {/* Medial cord */}
      <path d="M439,350 Q480,370 490,385" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
      <path d="M439,390 Q480,395 490,385" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
      <rect x="482" y="363" width="90" height="44" rx="10" fill="#451A03" stroke="#F59E0B" strokeWidth="1.8" filter="url(#ns)" />
      <text x="527" y="381" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FCD34D">Medial</text>
      <text x="527" y="396" textAnchor="middle" fontSize="10" fill="#FCD34D">Cord</text>

      {/* ─── Terminal Branches ─── */}
      {([
        ["Axillary n.",     "#EC4899", 80],
        ["Radial n.",       "#EC4899", 140],
        ["Musculocutaneous","#3B82F6", 210],
        ["Median (lat.)",   "#3B82F6", 270],
        ["Median (med.)",   "#F59E0B", 335],
        ["Ulnar n.",        "#F59E0B", 395],
        ["Med. Cutaneous",  "#F59E0B", 452],
      ] as [string,string,number][]).map(([name,col,y]) => (
        <g key={name}>
          <path d={`M572,${y<270?248:y<400?316:385} Q618,${y} 636,${y}`}
            stroke={col} strokeWidth="1.8" fill="none" strokeDasharray="4,2" />
          <rect x="636" y={y-15} width="142" height="30" rx="8"
            fill={col} fillOpacity="0.1" stroke={col} strokeWidth="1.2" />
          <text x="707" y={y+5} textAnchor="middle" fontSize="10" fill="#0F1729">{name}</text>
        </g>
      ))}

      {/* Legend */}
      <g transform="translate(30,455)">
        <text x="0" y="0" fontSize="11" fontWeight="bold" fill="#6B7280">Legend</text>
        {([
          ["Upper (C5–C6)", "#3B82F6"],
          ["Middle (C7)",   "#8B5CF6"],
          ["Lower (C8–T1)", "#F59E0B"],
          ["Posterior div.","#EC4899"],
        ] as [string,string][]).map(([l,c],i) => (
          <g key={l} transform={`translate(0,${16+i*18})`}>
            <rect x="0" y="-11" width="20" height="12" rx="3" fill={c} fillOpacity="0.45" />
            <text x="26" y="0" fontSize="10" fill="#6B7280">{l}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}


export function ActionPotentialDiagram() {
  return (
    <svg viewBox="0 0 600 360" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Nerve Action Potential — Phases</title>
      {/* Grid */}
      {[0,1,2,3,4,5].map(i => <line key={`h${i}`} x1="60" y1={60+i*50} x2="560" y2={60+i*50} stroke="#E5E1D8" strokeWidth="1" />)}
      {/* Y-axis */}
      <line x1="80" y1="40" x2="80" y2="340" stroke="#6B7280" strokeWidth="2" />
      {/* X-axis */}
      <line x1="80" y1="220" x2="560" y2="220" stroke="#6B7280" strokeWidth="2" />
      {/* Y labels */}
      {([["+40","100"],["+20","140"],["0","180"],["-20","220"],["-40","260"],["-65","300"],["-90","340"]] as [string,string][]).map(([v,y]) => (
        <text key={v} x="68" y={Number(y)+5} fontSize="10" textAnchor="end" fill="#6B7280">{v}</text>
      ))}
      <text x="30" y="190" fontSize="11" fontWeight="bold" fill="#6B7280" transform="rotate(-90,30,190)">mV</text>
      <text x="320" y="355" fontSize="11" textAnchor="middle" fill="#6B7280">Time (ms)</text>
      {/* Resting potential line */}
      <line x1="80" y1="300" x2="560" y2="300" stroke="#3B82F6" strokeWidth="1" strokeDasharray="5,3" />
      {/* Action Potential curve */}
      <path d="M80,300 L150,300 L165,300 C170,300 175,260 180,180 C185,140 188,110 192,100 C196,110 200,180 205,240 C210,280 215,300 220,300 C225,300 235,310 240,310 C255,310 260,300 290,300 L560,300"
        fill="none" stroke="#00C2A8" strokeWidth="3" />
      {/* Phase labels */}
      <line x1="150" y1="40" x2="150" y2="300" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3,2" />
      <text x="150" y="38" textAnchor="middle" fontSize="10" fill="#F59E0B">Threshold</text>
      <line x1="192" y1="40" x2="192" y2="100" stroke="#EC4899" strokeWidth="1" strokeDasharray="3,2" />
      <text x="192" y="38" textAnchor="middle" fontSize="10" fill="#EC4899">Peak</text>
      <text x="192" y="50" textAnchor="middle" fontSize="9" fill="#6B7280">+40mV</text>
      {/* Annotations */}
      {([
        [130,250,"Depolarization","#00C2A8"],
        [205,170,"Repolarization","#3B82F6"],
        [240,320,"Hyperpolarization","#F59E0B"],
        [320,290,"Resting (-65mV)","#6B7280"],
      ] as [number,number,string,string][]).map(([x,y,label,color]) => (
        <text key={label} x={x} y={y} fontSize="10" fill={color}>{label}</text>
      ))}
      <text x="170" y="130" fontSize="9" fill="#6B7280">Na⁺ influx</text>
      <text x="205" y="200" fontSize="9" fill="#6B7280">K⁺ efflux</text>
      <rect x="200" y="280" width="60" height="20" rx="4" fill="#F59E0B" fillOpacity="0.1" stroke="#F59E0B" strokeWidth="1" />
      <text x="230" y="294" textAnchor="middle" fontSize="9" fill="#F59E0B">Absolute Ref.</text>
      <rect x="260" y="280" width="50" height="20" rx="4" fill="#EC4899" fillOpacity="0.1" stroke="#EC4899" strokeWidth="1" />
      <text x="285" y="294" textAnchor="middle" fontSize="9" fill="#EC4899">Rel. Ref.</text>
    </svg>
  );
}

export function CardiacCycleDiagram() {
  return (
    <svg viewBox="0 0 650 380" className="w-full" style={{ background: "#1C2128", borderRadius: 12 }}>
      <title>Cardiac Cycle — Pressure Volume Relationships</title>
      <line x1="80" y1="40" x2="80" y2="340" stroke="#6B7280" strokeWidth="2" />
      <line x1="80" y1="340" x2="600" y2="340" stroke="#6B7280" strokeWidth="2" />
      <text x="30" y="200" fontSize="11" fill="#6B7280" transform="rotate(-90,30,200)">Pressure (mmHg)</text>
      <text x="340" y="365" fontSize="11" textAnchor="middle" fill="#6B7280">Volume (mL)</text>
      {[40,80,120,160,200].map(v => (
        <g key={v}>
          <line x1="80" y1={340-v*1.2} x2="600" y2={340-v*1.2} stroke="#E5E1D8" strokeWidth="1" />
          <text x="72" y={344-v*1.2} textAnchor="end" fontSize="9" fill="#6B7280">{v}</text>
        </g>
      ))}
      {[50,100,150].map(v => (
        <g key={v}>
          <line x1={80+v*2.8} y1="40" x2={80+v*2.8} y2="340" stroke="#E5E1D8" strokeWidth="1" />
          <text x={80+v*2.8} y="352" textAnchor="middle" fontSize="9" fill="#6B7280">{v}</text>
        </g>
      ))}
      <path d="M220,330 L220,190 C220,180 240,180 260,180 C300,180 360,200 380,180 C400,175 420,170 420,100 C420,90 380,88 360,90 C300,95 240,160 220,180 Z"
        fill="none" stroke="#00C2A8" strokeWidth="2.5" />
      <text x="400" y="160" fontSize="10" fill="#00C2A8">Isovolumetric</text>
      <text x="400" y="173" fontSize="10" fill="#00C2A8">Contraction</text>
      <text x="300" y="90" fontSize="10" fill="#EC4899">Ejection Phase</text>
      <text x="235" y="270" fontSize="10" fill="#3B82F6">Isovolumetric</text>
      <text x="235" y="283" fontSize="10" fill="#3B82F6">Relaxation</text>
      <text x="290" y="200" fontSize="10" fill="#F59E0B">Filling</text>
      <text x="218" y="342" textAnchor="middle" fontSize="10" fill="#6B7280">ESV</text>
      <text x="420" y="342" textAnchor="middle" fontSize="10" fill="#6B7280">EDV</text>
      <line x1="218" y1="338" x2="218" y2="330" stroke="#6B7280" strokeWidth="1" />
      <line x1="420" y1="338" x2="420" y2="330" stroke="#6B7280" strokeWidth="1" />
      <line x1="218" y1="355" x2="420" y2="355" stroke="#00C2A8" strokeWidth="1.5" />
      <text x="319" y="368" textAnchor="middle" fontSize="10" fill="#00C2A8">Stroke Volume ~70mL</text>
    </svg>
  );
}
