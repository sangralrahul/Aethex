/**
 * Sources beside the chat: every source an answer cites, numbered as in the
 * answer, with its title, site and link. Opens from an answer's sources or
 * from a citation badge (which highlights that source).
 */
import { useEffect, useRef } from "react";
import { BookOpenText, ExternalLink, Globe, X } from "lucide-react";

export interface PanelSource {
  n: number;
  url: string;
  title: string;
}

const host = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

/** A friendly name for well-known medical sites. */
function siteName(u: string): string {
  const h = host(u);
  if (/pubmed\.ncbi\.nlm\.nih\.gov$/.test(h)) return "PubMed";
  if (/ncbi\.nlm\.nih\.gov$/.test(h)) return "NCBI";
  if (/(^|\.)who\.int$/.test(h)) return "WHO";
  if (/(^|\.)nice\.org\.uk$/.test(h)) return "NICE";
  if (/(^|\.)icmr\.(gov|nic)\.in$/.test(h)) return "ICMR";
  if (/(^|\.)mohfw\.gov\.in$/.test(h)) return "MoHFW";
  if (/(^|\.)cdc\.gov$/.test(h)) return "CDC";
  if (/(^|\.)nih\.gov$/.test(h)) return "NIH";
  if (/wikipedia\.org$/.test(h)) return "Wikipedia";
  return h;
}

export default function SourcesPanel({ sources, focus, question, onClose }: {
  sources: PanelSource[];
  /** The source to highlight (from a citation badge). */
  focus?: number;
  question: string;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const el = focus ? list?.querySelector<HTMLElement>(`[data-n="${focus}"]`) : null;
    if (!list || !el) return;
    // Scroll the list only (scrollIntoView would also shift the page while the panel slides in).
    const top = el.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
  }, [focus]);
  const pubmed = sources.filter((s) => siteName(s.url) === "PubMed").length;
  return (
    <aside className="cx-sp" aria-label="Sources">
      <header className="cx-sp-h">
        <span className="cx-cv-ic"><Globe size={16} /></span>
        <div className="cx-sp-t">
          <b>Sources</b>
          <small>{sources.length} cited{pubmed ? ` · ${pubmed} from PubMed` : ""}</small>
        </div>
        <button className="cx-ib" onClick={onClose} aria-label="Close sources"><X size={18} /></button>
      </header>
      {question && <p className="cx-sp-q">{question}</p>}
      <ol className="cx-sp-list" ref={listRef}>
        {sources.map((s) => {
          const site = siteName(s.url);
          return (
            <li key={s.n} data-n={s.n} className={focus === s.n ? "on" : ""}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                <span className="n">{s.n}</span>
                <span className="b">
                  <span className="site">{site === "PubMed" ? <BookOpenText size={12} /> : <Globe size={12} />} {site}</span>
                  <b>{s.title}</b>
                  <small>{s.url.replace(/^https?:\/\//, "").slice(0, 80)}</small>
                </span>
                <ExternalLink size={14} className="go" />
              </a>
            </li>
          );
        })}
      </ol>
      <footer className="cx-sp-f">The answer cites these as [1], [2] and so on. Open the original before acting on a recommendation.</footer>
    </aside>
  );
}
