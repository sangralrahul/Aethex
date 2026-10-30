/**
 * Update 68: the living background behind each platform's hero (doctors, study, hospitals, medical colleges, the
 * Knowledge Hub and the store's banner). Three layers, all our own art:
 *  - a slow network of points drawn on a canvas (paused when off screen or when motion is reduced),
 *  - a themed illustration: a heartbeat line, molecules, a DNA helix or medical crosses,
 *  - "X-ray" ghosts of our product photos, inverted and blended into the dark background.
 * Styles: src/shop.css (.ax-scene).
 */
import { useEffect, useRef } from "react";

export type SceneKind = "pulse" | "molecules" | "dna" | "cross";

const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;

function NetCanvas({ rgb }: { rgb: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, on = true, mx = -1e4, my = -1e4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = window.innerWidth < 760 ? 28 : 64;
    const dots = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0003, vy: (Math.random() - 0.5) * 0.0003, r: 1 + Math.random() * 1.8, t: Math.random() * 6.28 }));
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const io = new IntersectionObserver(([e]) => { on = !!e?.isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); });
    io.observe(c);
    const onMove = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const draw = (now: number) => {
      raf = 0;
      if (!on || document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy; d.t += 0.01;
        if (d.x < -0.02 || d.x > 1.02) d.vx *= -1;
        if (d.y < -0.02 || d.y > 1.02) d.vy *= -1;
      }
      const L = Math.min(Math.max(w, h) * 0.12, 190);
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i]!, ax = a.x * w, ay = a.y * h;
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j]!, dist = Math.hypot(ax - b.x * w, ay - b.y * h);
          if (dist < L) { ctx.strokeStyle = `rgba(${rgb},${(1 - dist / L) * 0.22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(b.x * w, b.y * h); ctx.stroke(); }
        }
        const dm = Math.hypot(ax - mx, ay - my);
        if (dm < 150) { ctx.strokeStyle = `rgba(255,255,255,${(1 - dm / 150) * 0.25})`; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.stroke(); }
        const pulse = 0.6 + 0.4 * Math.sin(a.t + now / 900);
        ctx.fillStyle = i % 3 === 0 ? `rgba(255,255,255,${0.5 * pulse})` : `rgba(${rgb},${0.55 * pulse})`;
        ctx.beginPath(); ctx.arc(ax, ay, a.r * (0.8 + 0.3 * pulse), 0, 6.28); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const wake = () => { if (!document.hidden && on && !raf) raf = requestAnimationFrame(draw); };
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", wake);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", size); window.removeEventListener("pointermove", onMove); document.removeEventListener("visibilitychange", wake); };
  }, [rgb]);
  return <canvas ref={ref} className="net" aria-hidden="true" />;
}

function Pulse() {
  // One heartbeat, repeated across the width.
  const beat = "h70 l10 -6 l8 6 h16 l6 10 l10 -64 l10 80 l8 -26 h22 l12 -10 l12 10 h60";
  return (
    <svg className="art pulse" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <path className="trace" d={`M0 120 ${beat.repeat(6)}`} />
      <path className="glow" d={`M0 120 ${beat.repeat(6)}`} />
    </svg>
  );
}

function Hex({ x, y, s, d }: { x: number; y: number; s: number; d: number }) {
  const p = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i + Math.PI / 6; return `${(x + s * Math.cos(a)).toFixed(1)},${(y + s * Math.sin(a)).toFixed(1)}`; }).join(" ");
  return (
    <g className="mol" style={{ animationDelay: `${-d}s`, transformOrigin: `${x}px ${y}px` }}>
      <polygon points={p} />
      <line x1={x + s * Math.cos(Math.PI / 6)} y1={y + s * Math.sin(Math.PI / 6)} x2={x + s * 2.1} y2={y + s * 1.2} />
      <circle cx={x + s * 2.1} cy={y + s * 1.2} r={4} />
      <line x1={x} y1={y - s} x2={x} y2={y - s * 1.9} />
      <circle cx={x} cy={y - s * 1.9} r={4} />
    </g>
  );
}

function Molecules() {
  return (
    <svg className="art molecules" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice">
      <Hex x={1060} y={150} s={38} d={0} />
      <Hex x={1290} y={420} s={30} d={3} />
      <Hex x={860} y={520} s={24} d={6} />
      <Hex x={180} y={540} s={26} d={9} />
      <Hex x={620} y={90} s={18} d={12} />
    </svg>
  );
}

function Dna() {
  const rungs = 26;
  return (
    <div className="art dna" aria-hidden="true">
      {Array.from({ length: rungs }, (_, i) => <span key={i} style={{ animationDelay: `${-i * 0.22}s`, top: `${(i / rungs) * 100}%` }}><i /><b /><i /></span>)}
    </div>
  );
}

function Crosses() {
  const at: [number, number, number, number][] = [[1120, 120, 22, 0], [1330, 330, 16, 2], [900, 470, 14, 4], [160, 500, 18, 6], [640, 70, 12, 8], [1220, 560, 12, 10]];
  return (
    <svg className="art crosses" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice">
      {at.map(([x, y, s, d]) => <path key={`${x}${y}`} className="cr" style={{ animationDelay: `${-d}s`, transformOrigin: `${x}px ${y}px` }} d={`M${x - s / 3} ${y - s} h${(s * 2) / 3} v${(s * 2) / 3} h${(s * 2) / 3} v${(s * 2) / 3} h${-(s * 2) / 3} v${(s * 2) / 3} h${-(s * 2) / 3} v${-(s * 2) / 3} h${-(s * 2) / 3} v${-(s * 2) / 3} h${(s * 2) / 3}z`} />)}
    </svg>
  );
}

/** rgb: the accent as "r,g,b" for the canvas. ghosts: product photos shown as X-ray outlines. */
export function HeroScene({ kind, rgb, ghosts = [] }: { kind: SceneKind | SceneKind[]; rgb: string; ghosts?: string[] }) {
  const kinds = Array.isArray(kind) ? kind : [kind];
  return (
    <div className="ax-scene" aria-hidden="true">
      {ghosts.map((g, i) => <img key={g} className={`ghost g${i}`} src={IMG(g)} alt="" loading="lazy" decoding="async" />)}
      <NetCanvas rgb={rgb} />
      {kinds.includes("molecules") && <Molecules />}
      {kinds.includes("dna") && <Dna />}
      {kinds.includes("cross") && <Crosses />}
      {kinds.includes("pulse") && <Pulse />}
    </div>
  );
}
