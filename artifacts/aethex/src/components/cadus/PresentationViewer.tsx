import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";

export interface PresentationSlide {
  n: number;
  type: string;
  layout?: string;
  t: string;
  sub?: string;
  bullets: string[];
  ki?: string;
  caption?: string;
  stats?: { value: string; label: string; desc: string }[];
  cards?: { heading: string; body: string }[];
  leftHeading?: string;
  leftBody?: string;
  rightPoints?: string[];
  diag?: string;
  nodes?: string[];
  edges?: [number, number][];
  imageUrl?: string;
}

export interface PresentationData {
  title: string;
  subtitle: string;
  slides: PresentationSlide[];
  faq?: { question: string; answer: string }[];
  refs?: { term: string; definition: string }[];
  conditions?: { name: string; features: string; clue: string }[];
  redflags?: string[];
  pdfBase64?: string;
  docxBase64?: string;
}

interface Props {
  data: PresentationData;
  onClose: () => void;
  pdfBase64?: string;
  docxBase64?: string;
  initialIdx?: number;
}

const TEAL = "#00BCD4";
const TEAL_DIM = "#007C91";
const TEAL_BRT = "#4DD0E1";
const NAVY = "#0A0F2C";
const NAVY2 = "#1a1f4e";

function nodesToMermaid(diag: string, nodes: string[], edges: [number, number][]): string {
  if (!nodes.length) return "";

  const cleanLabel = (s: string) =>
    s.replace(/"/g, "'").replace(/[<>{}|]/g, " ").replace(/\s+/g, " ").trim().substring(0, 28);

  if (diag === "mindmap") {
    let chart = `mindmap\n  root((${cleanLabel(nodes[0] ?? "Overview")}))\n`;
    nodes.slice(1, 8).forEach((n) => {
      chart += `    ${cleanLabel(n)}\n`;
    });
    return chart;
  }

  const dir = diag === "concept" ? "LR" : "TD";
  let chart = `flowchart ${dir}\n`;

  nodes.forEach((node, i) => {
    const label = cleanLabel(node);
    const isTerminal = diag === "flowchart" && (i === 0 || i === nodes.length - 1);
    chart += isTerminal
      ? `  N${i}([${label}])\n`
      : `  N${i}[${label}]\n`;
  });

  if (edges.length) {
    edges.forEach(([src, dst]) => {
      if (src < nodes.length && dst < nodes.length) {
        chart += `  N${src} --> N${dst}\n`;
      }
    });
  } else {
    if (diag === "concept") {
      for (let i = 1; i < nodes.length; i++) chart += `  N0 --> N${i}\n`;
    } else {
      for (let i = 0; i < nodes.length - 1; i++) chart += `  N${i} --> N${i + 1}\n`;
    }
  }

  chart += `  style N0 fill:#00BCD4,color:#fff,stroke:#007C91\n`;
  if (nodes.length > 1 && (diag === "flowchart" || diag === "pathway")) {
    chart += `  style N${nodes.length - 1} fill:#007C91,color:#fff,stroke:#004D61\n`;
  }
  return chart;
}

function DiagramLabel({ diag }: { diag: string }) {
  const labels: Record<string, string> = {
    flowchart: "MECHANISM FLOWCHART",
    anatomy: "ANATOMY DIAGRAM",
    mindmap: "MIND MAP",
    pathway: "CLINICAL PATHWAY",
    concept: "CONCEPT MAP",
  };
  return (
    <p style={{ color: TEAL, fontSize: 10, fontWeight: "bold", textTransform: "uppercase", margin: "0 0 10px", letterSpacing: "0.06em" }}>
      {labels[diag] ?? "DIAGRAM"}
    </p>
  );
}

function ConceptStrip({ nodes }: { nodes: string[] }) {
  if (!nodes.length) return null;
  return (
    <div style={{
      background: "rgba(0,0,0,0.38)",
      padding: "7px 28px",
      display: "flex",
      gap: 6,
      alignItems: "center",
      flexWrap: "nowrap",
      overflowX: "auto",
      flexShrink: 0,
    }}>
      {nodes.slice(0, 7).map((node, i) => (
        <React.Fragment key={i}>
          <div style={{
            background: "rgba(0,188,212,0.18)",
            border: `1px solid ${TEAL}`,
            borderRadius: 20,
            padding: "3px 11px",
            color: "white",
            fontSize: 10,
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}>
            {node}
          </div>
          {i < Math.min(nodes.length, 7) - 1 && (
            <span style={{ color: TEAL, fontSize: 14, flexShrink: 0, lineHeight: 1 }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function SlideImagePanel({ imageUrl, diag, nodes, edges }: {
  imageUrl?: string;
  diag: string;
  nodes: string[];
  edges: [number, number][];
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasDiag = diag !== "none" && nodes.length > 0;
  const chart = hasDiag ? nodesToMermaid(diag, nodes, edges) : "";

  if (imageUrl && !imgError) {
    return (
      <div style={{
        background: "rgba(0,0,0,0.6)",
        borderRadius: 14,
        border: `1px solid rgba(0,188,212,0.35)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        {!imgLoaded && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10,
            background: "#0A0F2C",
          }}>
            <div style={{ width: 48, height: 48, border: `3px solid rgba(0,188,212,0.2)`, borderTop: `3px solid ${TEAL}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "rgba(0,188,212,0.5)", fontSize: 11 }}>Loading illustration…</span>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`Medical illustration`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            display: imgLoaded ? "block" : "none",
          }}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
          padding: "18px 12px 8px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "bold", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            AI Medical Illustration · CADUS
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 14,
      border: `1px solid rgba(0,188,212,0.28)`,
      padding: "14px 14px 10px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: hasDiag ? "flex-start" : "center",
      overflow: "hidden",
    }}>
      {hasDiag ? (
        <>
          <DiagramLabel diag={diag} />
          <div style={{ width: "100%", overflow: "auto", flex: 1 }}>
            <MermaidDiagram chart={chart} />
          </div>
        </>
      ) : (
        <p style={{ color: "rgba(0,188,212,0.25)", fontSize: 12, margin: 0 }}>No diagram available</p>
      )}
    </div>
  );
}

// ── Shared slide frame — clean white Gamma-style ─────────────────────────
function ContentFrame({ slide, current, total, children }: {
  slide: PresentationSlide; current: number; total: number; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "white",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', 'DM Sans', sans-serif",
      overflow: "hidden",
    }}>
      {/* Top teal stripe */}
      <div style={{ height: 7, background: `linear-gradient(90deg, ${TEAL}, #3884FF)`, flexShrink: 0 }} />

      {/* Title row — inside the white slide */}
      <div style={{
        padding: "14px 28px 12px 24px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexShrink: 0, gap: 16,
        borderBottom: "1.5px solid #E4EBF0",
        background: "white",
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: TEAL, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
            CADUS MEDICAL EDUCATION
          </div>
          <h2 style={{
            color: "#0A1F3C", fontSize: 24, fontWeight: 900,
            margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {slide.t}
          </h2>
        </div>
        <div style={{
          flexShrink: 0, width: 44, height: 44, background: TEAL,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, fontSize: 20, fontWeight: 900, color: "white",
        }}>
          {current}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {children}
      </div>

      {/* Progress bar */}
      <div style={{ flexShrink: 0, height: 5, background: "#E4EBF0" }}>
        <div style={{ width: `${(current / total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${TEAL}, #3884FF)`, transition: "width 0.35s ease" }} />
      </div>
    </div>
  );
}

// card accent colors per column index
const CARD_ACCENTS = [
  { bg: "linear-gradient(160deg, #ffffff 60%, #e8fdf8 100%)", border: "rgba(0,188,212,0.25)", num: "#00BCD4" },
  { bg: "linear-gradient(160deg, #ffffff 60%, #e8f4ff 100%)", border: "rgba(56,132,255,0.25)", num: "#3884FF" },
  { bg: "linear-gradient(160deg, #ffffff 60%, #f3eeff 100%)", border: "rgba(124,77,255,0.25)", num: "#7C4DFF" },
];

// ── STATS layout — giant numbers filling the slide ────────────────────────
function StatsLayout({ slide }: { slide: PresentationSlide }) {
  const stats = (slide.stats ?? []).slice(0, 3);
  if (!stats.length) return <ListLayout slide={slide} />;
  const nCols = stats.length;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "white" }}>
      {/* Numbers zone — takes 65% height */}
      <div style={{ flex: "0 0 65%", display: "grid", gridTemplateColumns: `repeat(${nCols}, 1fr)`, minHeight: 0 }}>
        {stats.map((st, ci) => (
          <div key={ci} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "0 16px", position: "relative",
            borderRight: ci < nCols - 1 ? "1px solid #e8f0f2" : "none",
          }}>
            {/* Subtle glow circle behind number */}
            <div style={{
              position: "absolute", width: 140, height: 140, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 70%)",
            }} />
            {/* Accent dash above */}
            <div style={{ width: 40, height: 5, background: TEAL, borderRadius: 3, marginBottom: 12 }} />
            {/* Giant number */}
            <span style={{
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 900,
              color: TEAL,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              whiteSpace: "nowrap",
            }}>{st.value}</span>
          </div>
        ))}
      </div>

      {/* Labels zone — 35% height, light teal bg */}
      <div style={{
        flex: "0 0 35%", display: "grid", gridTemplateColumns: `repeat(${nCols}, 1fr)`,
        background: "#EBF7F9", borderTop: "2px solid rgba(0,188,212,0.30)", minHeight: 0,
      }}>
        {stats.map((st, ci) => (
          <div key={ci} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "8px 16px", gap: 4,
            borderRight: ci < nCols - 1 ? "1px solid rgba(0,188,212,0.20)" : "none",
          }}>
            <span style={{ color: "#0A1F3C", fontSize: 15, fontWeight: 800, textAlign: "center", letterSpacing: "-0.01em" }}>
              {st.label}
            </span>
            <span style={{ color: "#5A7080", fontSize: 11, lineHeight: 1.45, textAlign: "center" }}>
              {st.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Caption */}
      {slide.caption && (
        <div style={{ padding: "5px 28px", textAlign: "center", borderTop: "1px solid #e8f0f2", flexShrink: 0, background: "white" }}>
          <span style={{ color: "#8A9AAB", fontSize: 10, fontStyle: "italic" }}>{slide.caption}</span>
        </div>
      )}
    </div>
  );
}

// ── CARDS layout — rich 3-column cards ───────────────────────────────────
function CardsLayout({ slide }: { slide: PresentationSlide }) {
  const cards = (slide.cards ?? []).slice(0, 3);
  if (!cards.length) return <ListLayout slide={slide} />;
  return (
    <div style={{
      height: "100%", display: "grid",
      gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
      gap: 14, padding: "14px 16px",
      background: "#F5F8FA",
    }}>
      {cards.map((card, ci) => {
        const accent = CARD_ACCENTS[ci] ?? CARD_ACCENTS[0];
        return (
          <div key={ci} style={{
            background: accent.bg,
            borderRadius: 10,
            border: `1.5px solid ${accent.border}`,
            boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Top teal stripe — full width, 8px */}
            <div style={{ height: 8, background: TEAL, flexShrink: 0 }} />

            <div style={{ padding: "14px 18px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Large decorative number */}
              <span style={{
                fontSize: 32, fontWeight: 900, lineHeight: 1,
                color: accent.num, opacity: 0.35,
                letterSpacing: "-0.02em",
              }}>
                {String(ci + 1).padStart(2, "0")}
              </span>

              {/* Heading */}
              <h3 style={{
                color: "#0A1F3C", fontSize: 15, fontWeight: 800, margin: 0,
                lineHeight: 1.25, letterSpacing: "-0.01em",
              }}>
                {card.heading}
              </h3>

              {/* Teal separator */}
              <div style={{ height: 2, background: TEAL, borderRadius: 1, opacity: 0.6, flexShrink: 0 }} />

              {/* Body text */}
              <p style={{
                color: "#3A4A60", fontSize: 11.5, lineHeight: 1.7, margin: 0, flex: 1,
              }}>
                {card.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TWOCOL layout — magazine spread ──────────────────────────────────────
function TwoColLayout({ slide }: { slide: PresentationSlide }) {
  const rightPoints = slide.rightPoints ?? [];
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "53% 47%", minHeight: 0, background: "white" }}>
      {/* LEFT — heading + paragraph */}
      <div style={{
        padding: "22px 28px 22px 24px",
        display: "flex", flexDirection: "column", gap: 0, overflow: "hidden",
        borderRight: "2px solid #EBF0F4",
      }}>
        {slide.leftHeading && (
          <h2 style={{
            color: "#0A1F3C", fontSize: 21, fontWeight: 900, margin: "0 0 10px",
            lineHeight: 1.15, letterSpacing: "-0.02em",
          }}>
            {slide.leftHeading}
          </h2>
        )}
        {/* Bold teal accent bar */}
        <div style={{ width: 60, height: 5, background: TEAL, borderRadius: 3, marginBottom: 16, flexShrink: 0 }} />

        <p style={{ color: "#2A3B52", fontSize: 13, lineHeight: 1.85, margin: 0, flex: 1 }}>
          {slide.leftBody}
        </p>

        {/* Decorative large quote mark — bottom right of left column */}
        <div style={{
          alignSelf: "flex-end", fontSize: 90, fontWeight: 900,
          color: "rgba(0,188,212,0.08)", lineHeight: 0.7, flexShrink: 0,
          userSelect: "none",
        }}>
          &rdquo;
        </div>
      </div>

      {/* RIGHT — bullet points on teal-tinted bg */}
      <div style={{ background: "#EBF7F9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top accent */}
        <div style={{ height: 5, background: TEAL, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: "14px 20px", display: "flex", flexDirection: "column", gap: 0, overflow: "hidden" }}>
          {rightPoints.map((rp, ri) => (
            <React.Fragment key={ri}>
              <div style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                padding: "11px 0", flex: 1, minHeight: 0,
              }}>
                {/* Teal square bullet */}
                <div style={{ width: 12, height: 12, background: TEAL, flexShrink: 0, marginTop: 2, borderRadius: 2 }} />
                <p style={{
                  color: "#1A2A40", fontSize: 12.5, lineHeight: 1.6, margin: 0,
                  fontWeight: ri === 0 ? 700 : 400,
                }}>
                  {rp}
                </p>
              </div>
              {ri < rightPoints.length - 1 && (
                <div style={{ height: 1, background: "rgba(0,188,212,0.22)", flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LIST layout — bold numbered rows ─────────────────────────────────────
function ListLayout({ slide }: { slide: PresentationSlide }) {
  const bullets = slide.bullets.slice(0, 5);
  const ki = slide.ki;
  const listBg = ["#F0FBFA", "white", "#F0FBFA", "white", "#F0FBFA"];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "white" }}>
      {/* Left thick teal bar + rows */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ width: 7, background: TEAL, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {bullets.map((bullet, bi) => (
            <div key={bi} style={{
              display: "flex", alignItems: "center",
              flex: 1, minHeight: 0,
              background: listBg[bi] ?? "white",
              borderBottom: bi < bullets.length - 1 ? "1px solid #E2EDF2" : "none",
            }}>
              {/* Number badge — large teal circle */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: TEAL, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 18px 0 14px",
                boxShadow: "0 2px 8px rgba(0,188,212,0.30)",
              }}>
                <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>{bi + 1}</span>
              </div>
              <p style={{
                color: "#1A2A40", fontSize: 14, lineHeight: 1.5, margin: 0,
                flex: 1, paddingRight: 24,
                fontWeight: bi === 0 ? 700 : 500,
              }}>
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* KEY INSIGHT — dark band */}
      {ki && (
        <div style={{
          background: NAVY, flexShrink: 0,
          padding: "10px 22px 10px 18px",
          display: "flex", alignItems: "center", gap: 14,
          borderTop: `5px solid ${TEAL}`,
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ color: TEAL_BRT, fontSize: 8, fontWeight: 900, letterSpacing: "0.1em", marginBottom: 3 }}>
              ⚡ KEY INSIGHT
            </div>
            <p style={{ color: "white", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{ki}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ContentSlide — dispatches to the correct layout ───────────────────────
function ContentSlide({ slide, current, total }: { slide: PresentationSlide; current: number; total: number }) {
  const layout = slide.layout ?? "list";
  let body: React.ReactNode;

  if (layout === "stats" && (slide.stats?.length ?? 0) >= 2) {
    body = <StatsLayout slide={slide} />;
  } else if (layout === "cards" && (slide.cards?.length ?? 0) >= 2) {
    body = <CardsLayout slide={slide} />;
  } else if (layout === "twocol" && slide.leftBody) {
    body = <TwoColLayout slide={slide} />;
  } else {
    body = <ListLayout slide={slide} />;
  }

  return (
    <ContentFrame slide={slide} current={current} total={total}>
      {body}
    </ContentFrame>
  );
}

function TitleSlide({ slide, current, total }: { slide: PresentationSlide; current: number; total: number }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, #040B1A 0%, #071428 45%, #0A1F3C 100%)`,
      height: "100%", display: "flex", flexDirection: "column",
      fontFamily: "'Inter', 'DM Sans', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative large circle — top right */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle at center, rgba(0,188,212,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {/* Decorative small circle — bottom left */}
      <div style={{
        position: "absolute", bottom: -40, left: 60,
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle at center, rgba(56,132,255,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {/* Teal top stripe */}
      <div style={{ height: 7, background: `linear-gradient(90deg, ${TEAL}, #3884FF)`, flexShrink: 0, position: "relative", zIndex: 1 }} />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 56px", textAlign: "center", gap: 18, position: "relative", zIndex: 1 }}>
        {/* Teal pill label */}
        <div style={{ background: "rgba(0,188,212,0.15)", border: `1px solid rgba(0,188,212,0.35)`, borderRadius: 20, padding: "5px 16px", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL }} />
          <span style={{ color: TEAL_BRT, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>CADUS MEDICAL EDUCATION</span>
        </div>

        {/* Main title */}
        <h1 style={{
          color: "white", fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 900, margin: 0, lineHeight: 1.08, letterSpacing: "-0.03em",
          textShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}>
          {slide.t}
        </h1>

        {/* Teal divider */}
        <div style={{ width: 80, height: 4, background: `linear-gradient(90deg, ${TEAL}, #3884FF)`, borderRadius: 2 }} />

        {/* Subtitle */}
        {slide.sub && (
          <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 15, margin: 0, maxWidth: 560, lineHeight: 1.65 }}>{slide.sub}</p>
        )}

        {/* Badges */}
        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ padding: "8px 20px", borderRadius: 24, fontSize: 12, fontWeight: 700, background: TEAL, color: "white", letterSpacing: "0.02em" }}>
            {total} Slides
          </span>
          <span style={{ padding: "8px 20px", borderRadius: 24, fontSize: 12, fontWeight: 600, border: `1.5px solid rgba(0,188,212,0.4)`, color: TEAL_BRT }}>
            AETHEX · Medical AI
          </span>
        </div>
      </div>

      {/* Bottom branding */}
      <div style={{ padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Powered by CADUS</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>1 / {total}</span>
      </div>
    </div>
  );
}

function ConditionsSlide({ slide, conditions, current, total }: { slide: PresentationSlide; conditions?: PresentationData["conditions"]; current: number; total: number }) {
  const items = conditions?.slice(0, 6) ?? [];
  return (
    <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>MEDICAL EDUCATION | CADUS</span>
        <span style={{ color: "white", fontSize: 12 }}>Slide {current} / {total}</span>
      </div>
      <div style={{ padding: "14px 24px 8px", borderBottom: `2px solid ${TEAL}`, flexShrink: 0 }}>
        <h2 style={{ color: TEAL, fontSize: 20, fontWeight: 800, margin: 0 }}>{slide.t}</h2>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "14px 24px", overflow: "auto" }}>
        {(items.length ? items : slide.bullets.slice(0, 6).map(b => ({ name: b, features: "", clue: "" }))).map((c, i) => (
          <div key={i} style={{ borderRadius: 12, padding: 12, background: "rgba(0,188,212,0.07)", border: `1px solid ${TEAL_DIM}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: TEAL, color: "white", fontSize: 9, fontWeight: "black", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>{c.name}</span>
            </div>
            {c.features && <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, lineHeight: 1.5, margin: "0 0 4px" }}>{c.features}</p>}
            {c.clue && <p style={{ color: TEAL_BRT, fontSize: 10, fontWeight: 600, margin: 0 }}>↗ {c.clue}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RedFlagsSlide({ slide, redflags, current, total }: { slide: PresentationSlide; redflags?: string[]; current: number; total: number }) {
  const flags = redflags?.length ? redflags.slice(0, 8) : slide.bullets.slice(0, 8);
  return (
    <div style={{ background: "#140A0A", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#c62828", padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>MEDICAL EDUCATION | CADUS — RED FLAGS</span>
        <span style={{ color: "white", fontSize: 12 }}>Slide {current} / {total}</span>
      </div>
      <div style={{ padding: "14px 24px 8px", borderBottom: "2px solid #EF4444", flexShrink: 0 }}>
        <h2 style={{ color: "white", fontSize: 20, fontWeight: 800, margin: 0 }}>{slide.t}</h2>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "14px 24px", overflow: "auto" }}>
        {flags.map((f, i) => (
          <div key={i} style={{ borderRadius: 12, padding: 12, display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ color: "white", fontSize: 13, lineHeight: 1.5, margin: 0, opacity: 0.9 }}>{f}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQSlide({ slide, faq, current, total }: { slide: PresentationSlide; faq?: PresentationData["faq"]; current: number; total: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = faq?.length ? faq.slice(0, 10) : [];
  return (
    <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>MEDICAL EDUCATION | CADUS</span>
        <span style={{ color: "white", fontSize: 12 }}>Slide {current} / {total}</span>
      </div>
      <div style={{ padding: "14px 24px 8px", borderBottom: `2px solid ${TEAL}`, flexShrink: 0 }}>
        <h2 style={{ color: TEAL, fontSize: 20, fontWeight: 800, margin: 0 }}>{slide.t}</h2>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {(items.length ? items : slide.bullets.map(b => ({ question: b, answer: "" }))).map((qa, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${open === i ? TEAL : TEAL_DIM}` }}>
            <button
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", textAlign: "left", background: open === i ? "rgba(0,188,212,0.12)" : "rgba(0,188,212,0.04)", cursor: "pointer", border: "none" }}
              onClick={() => setOpen(open === i ? null : i)}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: TEAL, color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>Q{i + 1}</span>
              <span style={{ color: "white", fontSize: 12, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>{qa.question}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && qa.answer && (
              <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderTop: `1px solid ${TEAL_DIM}` }}>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{qa.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GlossarySlide({ slide, refs, current, total }: { slide: PresentationSlide; refs?: PresentationData["refs"]; current: number; total: number }) {
  const items = refs?.length ? refs.slice(0, 10) : [];
  return (
    <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>MEDICAL EDUCATION | CADUS</span>
        <span style={{ color: "white", fontSize: 12 }}>Slide {current} / {total}</span>
      </div>
      <div style={{ padding: "14px 24px 8px", borderBottom: `2px solid ${TEAL}`, flexShrink: 0 }}>
        <h2 style={{ color: TEAL, fontSize: 20, fontWeight: 800, margin: 0 }}>{slide.t}</h2>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(items.length ? items : slide.bullets.map(b => ({ term: b, definition: "" }))).map((r, i) => (
            <div key={i} style={{ borderRadius: 12, padding: 12, background: "rgba(0,188,212,0.06)", border: `1px solid ${TEAL_DIM}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: 5, background: TEAL, color: "white", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ color: TEAL_BRT, fontSize: 11, fontWeight: "bold" }}>{r.term}</span>
              </div>
              {r.definition && <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 10, lineHeight: 1.55, margin: 0 }}>{r.definition}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummarySlide({ slide, current, total }: { slide: PresentationSlide; current: number; total: number }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0A1F3C 100%)`, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>MEDICAL EDUCATION | CADUS</span>
        <span style={{ color: "white", fontSize: 12 }}>Slide {current} / {total}</span>
      </div>
      <div style={{ padding: "14px 24px 8px", borderBottom: `2px solid ${TEAL}`, flexShrink: 0 }}>
        <h2 style={{ color: TEAL, fontSize: 20, fontWeight: 800, margin: 0 }}>{slide.t}</h2>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 24px", gap: 10, overflow: "auto" }}>
        {slide.bullets.slice(0, 6).map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, borderRadius: 12, padding: "10px 14px", background: "rgba(0,188,212,0.07)", border: `1px solid ${TEAL_DIM}` }}>
            <span style={{ fontSize: 20, fontWeight: 900, flexShrink: 0, color: TEAL_DIM, opacity: 0.7 }}>0{i + 1}</span>
            <p style={{ color: "white", fontSize: 13, lineHeight: 1.55, margin: 0, opacity: 0.92 }}>{b}</p>
          </div>
        ))}
        {slide.ki && (
          <div style={{ borderLeft: `4px solid ${TEAL}`, background: "rgba(0,188,212,0.10)", padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>
            <div style={{ color: TEAL, fontWeight: "bold", fontSize: 10, letterSpacing: "0.06em", marginBottom: 4 }}>⚡ KEY INSIGHT</div>
            <p style={{ color: "#e0f7fa", fontStyle: "italic", fontSize: 12, margin: 0, lineHeight: 1.55 }}>{slide.ki}</p>
          </div>
        )}
      </div>
      <div style={{ padding: "0 24px 16px", display: "flex", alignItems: "center", gap: 10, opacity: 0.3, flexShrink: 0 }}>
        <div style={{ flex: 1, height: 1, background: TEAL_DIM }} />
        <span style={{ color: TEAL, fontSize: 9, fontWeight: "bold", letterSpacing: "0.08em" }}>CADUS · aethex Medical Education</span>
        <div style={{ flex: 1, height: 1, background: TEAL_DIM }} />
      </div>
    </div>
  );
}

function renderSlide(slide: PresentationSlide, data: PresentationData, current: number, total: number) {
  switch (slide.type) {
    case "title":      return <TitleSlide slide={slide} current={current} total={total} />;
    case "conditions": return <ConditionsSlide slide={slide} conditions={data.conditions} current={current} total={total} />;
    case "redflags":   return <RedFlagsSlide slide={slide} redflags={data.redflags} current={current} total={total} />;
    case "faq":        return <FAQSlide slide={slide} faq={data.faq} current={current} total={total} />;
    case "glossary":   return <GlossarySlide slide={slide} refs={data.refs} current={current} total={total} />;
    case "summary":    return <ContentSlide slide={slide} current={current} total={total} />;
    default:           return <ContentSlide slide={slide} current={current} total={total} />;
  }
}

export default function PresentationViewer({ data, onClose, pdfBase64, docxBase64, initialIdx = 0 }: Props) {
  const [idx, setIdx] = useState(initialIdx);
  const total = data.slides.length;
  const slide = data.slides[idx];

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  const pdf64 = pdfBase64 ?? data.pdfBase64;
  const docx64 = docxBase64 ?? data.docxBase64;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "#0B1221", fontFamily: "'Inter','DM Sans',sans-serif" }}>

      {/* ── Top bar: title + downloads + close ── */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 16px", background: "#060D1E", borderBottom: `1px solid rgba(0,188,212,0.18)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, background: TEAL, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 11 }}>S</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {pdf64 && (
            <a href={`data:application/pdf;base64,${pdf64}`} download={`${data.title}.pdf`}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "white", background: TEAL_DIM, textDecoration: "none" }}>
              <Download style={{ width: 12, height: 12 }} /> PDF
            </a>
          )}
          {docx64 && (
            <a href={`data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docx64}`} download={`${data.title}.docx`}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "white", background: "#1E3A5F", textDecoration: "none" }}>
              <Download style={{ width: 12, height: 12 }} /> DOCX
            </a>
          )}
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* ── Stage — dark bg, slide centered ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "stretch", minHeight: 0, background: "#0B1221" }}>
        {/* Prev arrow */}
        <button onClick={prev} disabled={idx === 0} style={{
          flexShrink: 0, width: 52,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", cursor: idx === 0 ? "default" : "pointer",
          color: "white", opacity: idx === 0 ? 0.1 : 0.55, transition: "opacity 0.2s",
        }}>
          <ChevronLeft style={{ width: 32, height: 32 }} />
        </button>

        {/* Slide with drop shadow — fills the stage vertically */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "18px 0" }}>
          <div style={{ flex: 1, minHeight: 0, boxShadow: "0 24px 60px rgba(0,0,0,0.65)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
            {slide && renderSlide(slide, data, idx + 1, total)}
          </div>
        </div>

        {/* Next arrow */}
        <button onClick={next} disabled={idx === total - 1} style={{
          flexShrink: 0, width: 52,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "none", cursor: idx === total - 1 ? "default" : "pointer",
          color: "white", opacity: idx === total - 1 ? 0.1 : 0.55, transition: "opacity 0.2s",
        }}>
          <ChevronRight style={{ width: 32, height: 32 }} />
        </button>
      </div>

      {/* ── Dot nav ── */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 7, padding: "10px 16px", background: "#060D1E",
        borderTop: `1px solid rgba(0,188,212,0.15)`, flexWrap: "wrap",
      }}>
        {data.slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            borderRadius: 4, height: 7,
            width: i === idx ? 24 : 7,
            background: i === idx ? TEAL : "rgba(0,188,212,0.25)",
            border: "none", cursor: "pointer", padding: 0,
            transition: "width 0.25s, background 0.25s",
          }} />
        ))}
      </div>
    </div>
  );
}
