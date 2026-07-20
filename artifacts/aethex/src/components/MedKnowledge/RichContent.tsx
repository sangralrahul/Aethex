import { type ReactNode } from "react";

interface RichContentProps {
  content: string;
  lineByLine?: boolean;
}

function parseInlineMarkers(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|(?<!\*)\*([^*\n]+?)\*(?!\*)|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={key++} style={{ color: "#F85149", fontWeight: 700 }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <span key={key++} style={{ color: "#58A6FF", fontWeight: 500 }}>
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      parts.push(
        <span key={key++} style={{ color: "#3FB950" }}>
          {match[4]}
        </span>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function renderLine(line: string, i: number) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (/^#{1,3}\s/.test(trimmed)) {
    const text = trimmed.replace(/^#{1,3}\s/, "");
    return (
      <div key={i} className="mt-4 mb-1 text-sm font-bold uppercase tracking-wider" style={{ color: "#00C2A8" }}>
        {parseInlineMarkers(text)}
      </div>
    );
  }

  if (/^\*\*[^*]+\*\*[:：]?\s*$/.test(trimmed)) {
    return (
      <div key={i} className="mt-3 mb-0.5 text-sm font-bold" style={{ color: "#00C2A8" }}>
        {parseInlineMarkers(trimmed.replace(/\*\*/g, ""))}
      </div>
    );
  }

  if (/^\d+\.\s+\*\*/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
    return (
      <div key={i} className="flex gap-2 py-0.5">
        <span className="shrink-0 text-xs font-bold mt-0.5" style={{ color: "#00C2A8" }}>
          {trimmed.match(/^(\d+)\./)?.[1]}.
        </span>
        <span className="text-sm leading-relaxed" style={{ color: "#0F1729" }}>
          {parseInlineMarkers(trimmed.replace(/^\d+\.\s+/, ""))}
        </span>
      </div>
    );
  }

  if (/^[-•–]\s/.test(trimmed)) {
    return (
      <div key={i} className="flex gap-2 py-0.5 pl-1">
        <span className="shrink-0 text-xs mt-1" style={{ color: "#00C2A8" }}>▸</span>
        <span className="text-sm leading-relaxed" style={{ color: "#0F1729" }}>
          {parseInlineMarkers(trimmed.replace(/^[-•–]\s+/, ""))}
        </span>
      </div>
    );
  }

  if (trimmed.startsWith("Mnemonic:") || trimmed.startsWith("Mnemonic —")) {
    return (
      <div key={i} className="mt-2 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(227,179,65,0.08)", border: "1px solid rgba(227,179,65,0.2)", color: "#E3B341" }}>
        {parseInlineMarkers(trimmed)}
      </div>
    );
  }

  return (
    <p key={i} className="text-sm leading-relaxed py-0.5" style={{ color: "#C9D1D9" }}>
      {parseInlineMarkers(trimmed)}
    </p>
  );
}

export function RichContent({ content, lineByLine = true }: RichContentProps) {
  const lines = content.split("\n");

  return (
    <div className="space-y-0.5">
      {lineByLine ? (
        lines.map((line, i) => renderLine(line, i)).filter(Boolean)
      ) : (
        <div className="text-sm leading-relaxed" style={{ color: "#C9D1D9" }}>
          {content.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {parseInlineMarkers(line)}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #E5E1D8" }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#F85149" }} />
          Critical / Must-know
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#58A6FF" }} />
          Important
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#3FB950" }} />
          Notable
        </span>
      </div>
    </div>
  );
}
