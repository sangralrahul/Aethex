/**
 * The animated scene on the sign-in page: a question card, an answer that
 * writes itself, a second-model check that stamps it, and the sources that
 * appear underneath, over an ECG trace that keeps drawing. Pure SVG and CSS,
 * in the page's own colours; it stands still when motion is reduced.
 */
export default function SignInScene() {
  return (
    <div className="cx-scene" aria-hidden="true">
      <svg viewBox="0 0 520 330" width="100%" height="100%" role="img">
        <defs>
          <linearGradient id="cx-sc-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--acc)" stopOpacity="0" />
            <stop offset=".25" stopColor="var(--acc)" stopOpacity=".9" />
            <stop offset="1" stopColor="var(--acc)" stopOpacity=".9" />
          </linearGradient>
          <clipPath id="cx-sc-clip"><rect x="0" y="0" width="520" height="330" rx="18" /></clipPath>
        </defs>

        {/* grid */}
        <g className="cx-sc-grid" clipPath="url(#cx-sc-clip)">
          {Array.from({ length: 13 }, (_, i) => <line key={`v${i}`} x1={i * 40 + 20} x2={i * 40 + 20} y1="0" y2="330" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" x2="520" y1={i * 40 + 5} y2={i * 40 + 5} />)}
        </g>

        {/* ECG trace, drawn continuously */}
        <g clipPath="url(#cx-sc-clip)">
          <path className="cx-sc-ecg" d="M-40 262 H40 l8 -6 l8 6 H96 l6 -40 l8 76 l6 -44 l6 8 H160 l10 -10 l10 10 H216 l8 -6 l8 6 H272 l6 -40 l8 76 l6 -44 l6 8 H336 l10 -10 l10 10 H392 l8 -6 l8 6 H448 l6 -40 l8 76 l6 -44 l6 8 H512 l10 -10 l10 10 H560" />
          <circle className="cx-sc-dot" r="4" />
        </g>

        {/* question card */}
        <g className="cx-sc-q">
          <rect x="40" y="34" width="300" height="52" rx="12" className="cx-sc-card" />
          <rect x="56" y="50" width="190" height="8" rx="4" className="cx-sc-ln strong" />
          <rect x="56" y="66" width="130" height="7" rx="3.5" className="cx-sc-ln" />
          <circle cx="314" cy="60" r="12" className="cx-sc-av" />
        </g>

        {/* answer card, lines write themselves */}
        <g className="cx-sc-a">
          <rect x="84" y="108" width="396" height="118" rx="14" className="cx-sc-card raised" />
          <rect x="102" y="126" width="56" height="7" rx="3.5" className="cx-sc-ln acc" />
          <rect x="102" y="146" width="330" height="8" rx="4" className="cx-sc-ln strong write w1" />
          <rect x="102" y="162" width="290" height="8" rx="4" className="cx-sc-ln write w2" />
          <rect x="102" y="178" width="312" height="8" rx="4" className="cx-sc-ln write w3" />
          <rect x="102" y="200" width="150" height="7" rx="3.5" className="cx-sc-ln write w4" />
          {/* second-model stamp */}
          <g className="cx-sc-stamp">
            <rect x="372" y="120" width="94" height="24" rx="12" className="cx-sc-pill" />
            <path d="M384 132 l5 5 l9 -10" className="cx-sc-tick" />
            <rect x="404" y="128" width="50" height="7" rx="3.5" className="cx-sc-ln ok" />
          </g>
        </g>

        {/* sources */}
        <g className="cx-sc-src">
          <g className="s1"><rect x="84" y="240" width="118" height="26" rx="13" className="cx-sc-pill" /><circle cx="100" cy="253" r="6" className="cx-sc-n" /><rect x="112" y="249" width="76" height="7" rx="3.5" className="cx-sc-ln" /></g>
          <g className="s2"><rect x="212" y="240" width="104" height="26" rx="13" className="cx-sc-pill" /><circle cx="228" cy="253" r="6" className="cx-sc-n" /><rect x="240" y="249" width="62" height="7" rx="3.5" className="cx-sc-ln" /></g>
          <g className="s3"><rect x="326" y="240" width="128" height="26" rx="13" className="cx-sc-pill" /><circle cx="342" cy="253" r="6" className="cx-sc-n" /><rect x="354" y="249" width="86" height="7" rx="3.5" className="cx-sc-ln" /></g>
        </g>
      </svg>
    </div>
  );
}

export const SIGNIN_SCENE_CSS = `
.cx-scene{width:100%;max-width:470px;aspect-ratio:520/330;margin:18px 0 4px}
@media (max-height:820px){.cx-scene{max-width:400px}}
.cx-scene svg{overflow:visible}
.cx-sc-grid line{stroke:var(--line);stroke-width:1;opacity:.55}
.cx-sc-card{fill:var(--surface);stroke:var(--line2);stroke-width:1}
.cx-sc-card.raised{filter:drop-shadow(0 10px 24px rgba(17,24,39,.08))}
.cx-dark .cx-sc-card.raised{filter:drop-shadow(0 10px 24px rgba(0,0,0,.45))}
.cx-sc-ln{fill:var(--line2)}
.cx-sc-ln.strong{fill:color-mix(in srgb,var(--text) 55%,var(--line2))}
.cx-sc-ln.acc{fill:var(--acc)}
.cx-sc-ln.ok{fill:var(--ok)}
.cx-sc-av{fill:var(--s3)}
.cx-sc-pill{fill:var(--s2);stroke:var(--line);stroke-width:1}
.cx-sc-n{fill:var(--acc)}
.cx-sc-tick{fill:none;stroke:var(--ok);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:24}
.cx-sc-ecg{fill:none;stroke:url(#cx-sc-fade);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:600 1400;stroke-dashoffset:600;animation:cxEcg 9s linear infinite}
.cx-sc-dot{fill:var(--acc);offset-path:path("M-40 262 H40 l8 -6 l8 6 H96 l6 -40 l8 76 l6 -44 l6 8 H160 l10 -10 l10 10 H216 l8 -6 l8 6 H272 l6 -40 l8 76 l6 -44 l6 8 H336 l10 -10 l10 10 H392 l8 -6 l8 6 H448 l6 -40 l8 76 l6 -44 l6 8 H512 l10 -10 l10 10 H560");animation:cxEcgDot 9s linear infinite;filter:drop-shadow(0 0 6px var(--acc))}
@keyframes cxEcg{from{stroke-dashoffset:600}to{stroke-dashoffset:-1400}}
@keyframes cxEcgDot{from{offset-distance:0%}to{offset-distance:100%}}
/* the story: question (0-1s), answer writes (1-4s), stamp (4.2s), sources (4.8-5.6s), hold, fade (8-9s) */
.cx-sc-q,.cx-sc-a,.cx-sc-src .s1,.cx-sc-src .s2,.cx-sc-src .s3,.cx-sc-stamp{animation-duration:9s;animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
.cx-sc-q{animation-name:cxScQ}
.cx-sc-a{animation-name:cxScA}
.cx-sc-ln.write{transform-origin:left center;animation:cxScWrite 9s cubic-bezier(.2,.7,.2,1) infinite}
.cx-sc-ln.w1{animation-delay:0s}.cx-sc-ln.w2{animation-delay:.35s}.cx-sc-ln.w3{animation-delay:.7s}.cx-sc-ln.w4{animation-delay:1.05s}
.cx-sc-stamp{transform-origin:419px 132px;animation-name:cxScStamp}
.cx-sc-stamp .cx-sc-tick{animation:cxScTick 9s ease-out infinite}
.cx-sc-src .s1{animation-name:cxScSrc}.cx-sc-src .s2{animation-name:cxScSrc;animation-delay:.18s}.cx-sc-src .s3{animation-name:cxScSrc;animation-delay:.36s}
@keyframes cxScQ{0%{opacity:0;transform:translateY(10px)}6%,86%{opacity:1;transform:none}94%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes cxScA{0%,10%{opacity:0;transform:translateY(14px)}18%,86%{opacity:1;transform:none}94%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes cxScWrite{0%,18%{transform:scaleX(0)}34%,100%{transform:scaleX(1)}}
@keyframes cxScStamp{0%,44%{opacity:0;transform:scale(.6)}50%,100%{opacity:1;transform:scale(1)}}
@keyframes cxScTick{0%,48%{stroke-dashoffset:24}56%,100%{stroke-dashoffset:0}}
@keyframes cxScSrc{0%,52%{opacity:0;transform:translateY(8px)}60%,86%{opacity:1;transform:none}94%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .cx-sc-ecg,.cx-sc-dot,.cx-sc-q,.cx-sc-a,.cx-sc-ln.write,.cx-sc-stamp,.cx-sc-stamp .cx-sc-tick,.cx-sc-src .s1,.cx-sc-src .s2,.cx-sc-src .s3{animation:none}
  .cx-sc-ecg{stroke-dasharray:none}
  .cx-sc-dot{display:none}
  .cx-sc-tick{stroke-dashoffset:0}
}
@media (max-width:860px){.cx-scene{display:none}}
`;
