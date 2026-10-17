/**
 * Research: PubMed search with real PMIDs and DOIs, a reading list kept on this
 * device, Vancouver and RIS citations, and evidence summaries written by Cadus
 * from the abstracts you select. The thesis kit (sample size and choosing a
 * statistical test) sits alongside.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, BookMarked, BookOpenText, Bookmark, BookmarkCheck, Check, ChevronDown, Copy, Download,
  ExternalLink, FileDown, Info, Microscope, Quote, Search, Sigma, Sparkles, Trash2, X,
} from "lucide-react";
import {
  DEFAULT_FILTERS, doiUrl, pmcUrl, pubmedUrl, readReading, ris, saveReading, shortAuthors, TYPE_OPTIONS, typeBadges, vancouver, vancouverList,
  type LiteratureFilters, type LiteratureResult, type Paper, type SavedPaper,
} from "@/lib/cadus/pubmed";
import { downloadBlob } from "@/lib/cadus/docx";
import ThesisKit from "./ThesisKit";

export type ResearchTab = "search" | "reading" | "thesis";

/** At most this many papers go into one evidence summary. */
export const SUMMARY_MAX = 12;

const EXAMPLES = [
  "SGLT2 inhibitors heart failure",
  "dengue fluid management",
  "tranexamic acid postpartum haemorrhage",
  "snakebite antivenom dose",
  "tuberculosis shorter regimen",
];
const YEARS: { id: LiteratureFilters["years"]; label: string }[] = [
  { id: 0, label: "Any time" },
  { id: 1, label: "Last year" },
  { id: 5, label: "5 years" },
  { id: 10, label: "10 years" },
];

/** The last search, kept while you move around Cadus. */
let lastSearch: { input: string; q: string; filters: LiteratureFilters; result: LiteratureResult | null; selected: Paper[] } | null = null;

function PaperCard({ p, selected, onSelect, saved, onSave, onCite, onAsk, expanded, onExpand, extra }: {
  p: Paper;
  selected: boolean;
  onSelect: () => void;
  saved: boolean;
  onSave: () => void;
  onCite: () => void;
  onAsk: () => void;
  expanded: boolean;
  onExpand: () => void;
  extra?: ReactNode;
}) {
  const badges = typeBadges(p.types);
  const where = p.volume ? `${p.year};${p.volume}${p.issue ? `(${p.issue})` : ""}${p.pages ? `:${p.pages}` : ""}` : p.year;
  return (
    <article className={`cx-pp ${selected ? "on" : ""}`}>
      <button className={`cx-ck ${selected ? "on" : ""}`} role="checkbox" aria-checked={selected} onClick={onSelect} aria-label={selected ? "Deselect this paper" : "Select this paper"} />
      <div className="cx-pp-b">
        {badges.length > 0 && (
          <div className="cx-pp-badges">
            {badges.map((b) => <span key={b} className={`cx-ev ${b === "Retracted" ? "bad" : /Meta|Systematic|Guideline|RCT/.test(b) ? "strong" : ""}`}>{b}</span>)}
          </div>
        )}
        <a className="cx-pp-t" href={pubmedUrl(p.pmid)} target="_blank" rel="noopener noreferrer">{p.title}</a>
        <p className="cx-pp-au">{shortAuthors(p.authors, 4)}</p>
        <p className="cx-pp-j"><i>{p.journal}</i>{where ? ` ${where}` : ""}<span className="pm">PMID {p.pmid}</span></p>
        <div className="cx-pp-acts">
          {p.abstract.length > 0 ? (
            <button className={expanded ? "open" : ""} onClick={onExpand} aria-expanded={expanded}><ChevronDown size={14} className="chev" /> Abstract</button>
          ) : <span className="none">No abstract in PubMed</span>}
          <a href={pubmedUrl(p.pmid)} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> PubMed</a>
          {p.doi && <a href={doiUrl(p.doi)} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> DOI</a>}
          {p.pmcid && <a className="free" href={pmcUrl(p.pmcid)} target="_blank" rel="noopener noreferrer"><BookOpenText size={13} /> Free full text</a>}
          <span className="sp" />
          <button onClick={onCite} title="Copy the Vancouver citation"><Quote size={13} /> Cite</button>
          <button onClick={onSave} className={saved ? "on" : ""} title={saved ? "Remove from your reading list" : "Save to your reading list"}>
            {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />} {saved ? "Saved" : "Save"}
          </button>
          <button onClick={onAsk} title="Cadus appraises this study from its abstract"><Sparkles size={13} /> Appraise</button>
        </div>
        {expanded && (
          <div className="cx-pp-abs">
            {p.abstract.map((a, i) => <p key={i}>{a.label && <b>{a.label.charAt(0) + a.label.slice(1).toLowerCase()}</b>}{a.text}</p>)}
          </div>
        )}
        {extra}
      </div>
    </article>
  );
}

export default function ResearchView({ initial, search, onSummarise, onAsk, toast, friendlyError }: {
  initial?: { tab?: ResearchTab; query?: string; key: number };
  search: (body: Record<string, unknown>) => Promise<LiteratureResult>;
  /** Start an evidence chat from these papers; `ask` replaces the default request. */
  onSummarise: (query: string, papers: Paper[], ask?: string) => void;
  onAsk: (text: string, mode?: string) => void;
  toast: (t: string) => void;
  friendlyError: (raw: string) => string;
}) {
  const [tab, setTab] = useState<ResearchTab>(initial?.tab ?? "search");
  const [input, setInput] = useState(lastSearch?.input ?? "");
  const [q, setQ] = useState(lastSearch?.q ?? "");
  const [filters, setFilters] = useState<LiteratureFilters>(lastSearch?.filters ?? DEFAULT_FILTERS);
  const [result, setResult] = useState<LiteratureResult | null>(lastSearch?.result ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Paper[]>(lastSearch?.selected ?? []);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reading, setReading] = useState<SavedPaper[]>(readReading);
  const [readQ, setReadQ] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const reqId = useRef(0);
  const topRef = useRef<HTMLElement>(null);
  const inRef = useRef<HTMLInputElement>(null);

  useEffect(() => { lastSearch = { input, q, filters, result, selected }; }, [input, q, filters, result, selected]);
  useEffect(() => saveReading(reading), [reading]);
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement)?.closest?.(".cx-rs-export")) setExportOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [exportOpen]);

  const run = async (query: string, f: LiteratureFilters, page = 1) => {
    const text = query.trim();
    if (!text) return;
    const id = ++reqId.current;
    setBusy(true);
    setError("");
    try {
      const r = await search({ action: "literature", query: text, type: f.type, years: f.years, free: f.free, india: f.india, sort: f.sort, page });
      if (id !== reqId.current) return;
      setResult({ count: Number(r?.count) || 0, page: Number(r?.page) || page, perPage: Number(r?.perPage) || 20, translation: r?.translation, papers: Array.isArray(r?.papers) ? r.papers : [] });
      setQ(text);
      setExpanded(new Set());
      if (page > 1 || result) topRef.current?.scrollIntoView({ block: "start" });
    } catch (e) {
      if (id !== reqId.current) return;
      setError(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally {
      if (id === reqId.current) setBusy(false);
    }
  };

  // Searches handed over from elsewhere (the home page, the palette).
  useEffect(() => {
    if (!initial) return;
    if (initial.tab) setTab(initial.tab);
    if (initial.query) {
      setInput(initial.query);
      setTab("search");
      void run(initial.query, filters);
    } else if (initial.tab !== "thesis" && initial.tab !== "reading") {
      window.setTimeout(() => inRef.current?.focus(), 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.key]);

  const setFilter = (patch: Partial<LiteratureFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (q) void run(q, next);
  };

  const savedIds = useMemo(() => new Set(reading.map((p) => p.pmid)), [reading]);
  const selIds = useMemo(() => new Set(selected.map((p) => p.pmid)), [selected]);
  const toggleSel = (p: Paper) => setSelected((s) => (s.some((x) => x.pmid === p.pmid) ? s.filter((x) => x.pmid !== p.pmid) : [...s, p]));
  const toggleSave = (p: Paper) => {
    if (savedIds.has(p.pmid)) {
      setReading((l) => l.filter((x) => x.pmid !== p.pmid));
      toast("Removed from your reading list");
    } else {
      setReading((l) => [{ ...p, savedAt: Date.now() }, ...l]);
      toast("Saved to your reading list");
    }
  };
  const toggleOpen = (pmid: string) => setExpanded((s) => {
    const n = new Set(s);
    if (n.has(pmid)) n.delete(pmid); else n.add(pmid);
    return n;
  });
  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(done);
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };
  const summarise = (papers: Paper[], query: string) => {
    if (!papers.length) return;
    if (papers.length > SUMMARY_MAX) { toast(`Select up to ${SUMMARY_MAX} papers for one summary`); return; }
    onSummarise(query, papers);
  };
  const appraise = (p: Paper) =>
    onSummarise(p.title, [p], "Critically appraise this study from its abstract: the question, design and population, intervention and comparison, main results with effect sizes, risk of bias and limitations, and how far it applies to practice in India.");

  const pages = result ? Math.max(1, Math.ceil(Math.min(result.count, 9999) / result.perPage)) : 1;
  const papers = result?.papers ?? [];
  const allOnPage = papers.length > 0 && papers.every((p) => selIds.has(p.pmid));
  const readFiltered = reading.filter((p) => {
    const t = readQ.trim().toLowerCase();
    return !t || `${p.title} ${p.journal} ${p.authors.join(" ")}`.toLowerCase().includes(t);
  });
  const readSelected = selected.filter((p) => savedIds.has(p.pmid));
  const exportSet = tab === "reading" ? (readSelected.length ? readSelected : reading) : selected;

  const selectionBar = (list: Paper[], query: string) => list.length > 0 && (
    <div className="cx-selbar" role="region" aria-label="Selected papers">
      <b>{list.length} selected</b>
      <button className="cx-btn primary" onClick={() => summarise(list, query)}><Sparkles size={14} /> Summarise with Cadus</button>
      <button className="cx-btn" onClick={() => void copy(vancouverList(list), `${list.length === 1 ? "Citation" : `${list.length} citations`} copied (Vancouver)`)}><Quote size={14} /> Copy citations</button>
      <button className="cx-btn" onClick={() => { downloadBlob("cadus-references.ris", new Blob([ris(list)], { type: "application/x-research-info-systems" })); toast("RIS file downloaded for Zotero, Mendeley or EndNote"); }}><Download size={14} /> RIS</button>
      {tab === "search" && (
        <button className="cx-btn" onClick={() => {
          const add = list.filter((p) => !savedIds.has(p.pmid));
          setReading((l) => [...add.map((p) => ({ ...p, savedAt: Date.now() })), ...l]);
          toast(add.length ? `Saved ${add.length} to your reading list` : "Already in your reading list");
        }}><BookMarked size={14} /> Save</button>
      )}
      <button className="cx-ib" onClick={() => setSelected((s) => s.filter((p) => !list.some((x) => x.pmid === p.pmid)))} aria-label="Clear the selection"><X size={16} /></button>
    </div>
  );

  return (
    <section className="cx-page cx-rs" ref={topRef}>
      <header className="cx-page-h">
        <div>
          <h1>Research</h1>
          <p>
            {tab === "thesis"
              ? "Sample size for your thesis or protocol, worked step by step from the standard formulas, and the right statistical test for your question."
              : "Search PubMed for real papers with their PMIDs and DOIs, keep a reading list, export citations, and let Cadus summarise only what the abstracts you choose say."}
          </p>
        </div>
        <div className="cx-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "search"} className={tab === "search" ? "on" : ""} onClick={() => setTab("search")}>PubMed search</button>
          <button role="tab" aria-selected={tab === "reading"} className={tab === "reading" ? "on" : ""} onClick={() => setTab("reading")}>Reading list{reading.length ? ` · ${reading.length}` : ""}</button>
          <button role="tab" aria-selected={tab === "thesis"} className={tab === "thesis" ? "on" : ""} onClick={() => setTab("thesis")}>Thesis kit</button>
        </div>
      </header>

      {tab === "thesis" ? (
        <ThesisKit onAsk={onAsk} toast={toast} />
      ) : tab === "reading" ? (
        reading.length === 0 ? (
          <div className="cx-empty-state">
            <span className="cx-proj-ic" style={{ marginBottom: 0 }}><BookMarked size={20} /></span>
            <h3>Your reading list is empty</h3>
            <p>Save papers from a PubMed search to keep them here for your thesis, journal club or next presentation. The list stays on this device.</p>
            <button className="cx-btn" onClick={() => setTab("search")}><Search size={15} /> Search PubMed</button>
          </div>
        ) : (
          <>
            <div className="cx-rs-tools">
              <label className="cx-search">
                <Search size={15} />
                <input value={readQ} onChange={(e) => setReadQ(e.target.value)} placeholder="Search your reading list" aria-label="Search your reading list" />
              </label>
              <span className="cx-rs-count">{reading.length} paper{reading.length === 1 ? "" : "s"} saved on this device</span>
              <div className="cx-rel cx-rs-export">
                <button className="cx-btn" onClick={() => setExportOpen((o) => !o)} aria-haspopup="menu" aria-expanded={exportOpen}><FileDown size={14} /> Export {readSelected.length ? "selected" : "all"} <ChevronDown size={13} /></button>
                {exportOpen && (
                  <div className="cx-pop cx-rs-menu" role="menu">
                    <button className="cx-pop-i" onClick={() => { setExportOpen(false); void copy(vancouverList(exportSet), `${exportSet.length} citations copied (Vancouver)`); }}><Copy size={16} /> Copy Vancouver references</button>
                    <button className="cx-pop-i" onClick={() => { setExportOpen(false); downloadBlob("cadus-reading-list.ris", new Blob([ris(exportSet)], { type: "application/x-research-info-systems" })); }}><Download size={16} /> RIS for reference managers</button>
                    <button className="cx-pop-i" onClick={() => { setExportOpen(false); downloadBlob("cadus-reading-list.txt", new Blob([vancouverList(exportSet) + "\n"], { type: "text/plain" })); }}><FileDown size={16} /> Text file (Vancouver)</button>
                  </div>
                )}
              </div>
            </div>
            <div className="cx-pp-list">
              {readFiltered.map((p) => (
                <PaperCard
                  key={p.pmid}
                  p={p}
                  selected={selIds.has(p.pmid)}
                  onSelect={() => toggleSel(p)}
                  saved
                  onSave={() => toggleSave(p)}
                  onCite={() => void copy(vancouver(p), "Citation copied (Vancouver)")}
                  onAsk={() => appraise(p)}
                  expanded={expanded.has(p.pmid)}
                  onExpand={() => toggleOpen(p.pmid)}
                  extra={<p className="cx-pp-saved">Saved {new Date(p.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                />
              ))}
              {!readFiltered.length && <p className="cx-rs-none">No saved paper matches “{readQ}”.</p>}
            </div>
            {selectionBar(readSelected, readSelected.length === 1 ? readSelected[0].title : "my reading list")}
            {reading.length > 0 && (
              <button
                className={`cx-rs-clear ${clearArmed ? "armed" : ""}`}
                onClick={() => {
                  if (!clearArmed) { setClearArmed(true); window.setTimeout(() => setClearArmed(false), 4000); return; }
                  setReading([]);
                  setSelected([]);
                  setClearArmed(false);
                  toast("Reading list cleared");
                }}
              >
                <Trash2 size={13} /> {clearArmed ? `Click again to remove all ${reading.length} papers` : "Clear the reading list"}
              </button>
            )}
          </>
        )
      ) : (
        <>
          <form className="cx-rs-form" onSubmit={(e) => { e.preventDefault(); void run(input, filters); }}>
            <Search size={18} />
            <input
              ref={inRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search PubMed, e.g. empagliflozin heart failure outcomes"
              aria-label="Search PubMed"
              maxLength={300}
            />
            {input && <button type="button" className="cx-ib" onClick={() => { setInput(""); inRef.current?.focus(); }} aria-label="Clear"><X size={15} /></button>}
            <button type="submit" className="cx-btn primary" disabled={!input.trim()}>{busy ? <><i className="cx-spin" /> Searching</> : "Search"}</button>
          </form>
          <div className="cx-rs-filters">
            <div className="cx-opts" role="radiogroup" aria-label="Type of article">
              {TYPE_OPTIONS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={filters.type === t.id} className={filters.type === t.id ? "on" : ""} onClick={() => setFilter({ type: t.id })}>{t.label}</button>
              ))}
            </div>
            <div className="cx-rs-f2">
              <select className="cx-select" value={filters.years} onChange={(e) => setFilter({ years: Number(e.target.value) as LiteratureFilters["years"] })} aria-label="Publication date">
                {YEARS.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}
              </select>
              <select className="cx-select" value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value as LiteratureFilters["sort"] })} aria-label="Sort by">
                <option value="relevance">Best match</option>
                <option value="date">Most recent</option>
              </select>
              <button type="button" className={`cx-tgl ${filters.free ? "on" : ""}`} aria-pressed={filters.free} onClick={() => setFilter({ free: !filters.free })}><Check size={13} /> Free full text</button>
              <button type="button" className={`cx-tgl ${filters.india ? "on" : ""}`} aria-pressed={filters.india} onClick={() => setFilter({ india: !filters.india })}><Check size={13} /> Indian studies</button>
            </div>
          </div>

          {error && <div className="cx-err cx-rs-err"><Info size={16} /><span>{error}</span><button onClick={() => void run(input || q, filters)}>Try again</button></div>}

          {!result && !busy ? (
            <div className="cx-rs-intro">
              <div className="cx-rs-how">
                <span className="cx-rs-how-ic"><Microscope size={18} /></span>
                <div>
                  <b>Real papers, not AI references</b>
                  <p>Results come straight from PubMed at the US National Library of Medicine, with their PMIDs, DOIs and abstracts. Select papers and Cadus summarises only what those abstracts say, citing each one, and a second model checks the summary against them.</p>
                </div>
              </div>
              <p className="cx-rs-try">Try a search</p>
              <div className="cx-ideas">
                {EXAMPLES.map((x) => <button key={x} className="cx-chip" onClick={() => { setInput(x); void run(x, filters); }}><Search size={14} /> {x}</button>)}
              </div>
            </div>
          ) : (
            <>
              {result && (
                <div className="cx-rs-head">
                  <button className={`cx-ck ${allOnPage ? "on" : ""}`} role="checkbox" aria-checked={allOnPage} disabled={!papers.length} onClick={() => setSelected((s) => (allOnPage ? s.filter((p) => !papers.some((x) => x.pmid === p.pmid)) : [...s, ...papers.filter((p) => !selIds.has(p.pmid))]))} aria-label="Select all on this page" />
                  <span className="cx-rs-count">
                    {result.count ? <><b>{result.count.toLocaleString("en-IN")}</b> result{result.count === 1 ? "" : "s"} for “{q}”</> : <>No results for “{q}”</>}
                  </span>
                  {!selected.length && papers.length > 0 && <span className="cx-rs-tip">Tick papers to summarise, cite or save them</span>}
                  {result.translation && (
                    <details className="cx-rs-tr">
                      <summary>How PubMed read it</summary>
                      <code>{result.translation}</code>
                    </details>
                  )}
                </div>
              )}
              {busy && !papers.length ? (
                <div className="cx-pp-list" aria-busy="true">
                  {[0, 1, 2].map((i) => <div key={i} className="cx-pp sk"><i className="cx-sk" style={{ width: "72%" }} /><i className="cx-sk" style={{ width: "48%" }} /><i className="cx-sk" style={{ width: "30%" }} /></div>)}
                </div>
              ) : result && !papers.length ? (
                <div className="cx-empty-state">
                  <h3>No papers found</h3>
                  <p>Try fewer or broader words, a generic drug name, or remove a filter. PubMed matches medical subject headings, so “heart attack” also finds “myocardial infarction”.</p>
                </div>
              ) : (
                <div className={`cx-pp-list ${busy ? "busy" : ""}`}>
                  {papers.map((p) => (
                    <PaperCard
                      key={p.pmid}
                      p={p}
                      selected={selIds.has(p.pmid)}
                      onSelect={() => toggleSel(p)}
                      saved={savedIds.has(p.pmid)}
                      onSave={() => toggleSave(p)}
                      onCite={() => void copy(vancouver(p), "Citation copied (Vancouver)")}
                      onAsk={() => appraise(p)}
                      expanded={expanded.has(p.pmid)}
                      onExpand={() => toggleOpen(p.pmid)}
                    />
                  ))}
                </div>
              )}
              {result && result.count > result.perPage && (
                <nav className="cx-rs-pages" aria-label="Pages">
                  <button className="cx-btn" disabled={busy || result.page <= 1} onClick={() => void run(q, filters, result.page - 1)}><ArrowLeft size={14} /> Previous</button>
                  <span>Page {result.page} of {pages.toLocaleString("en-IN")}</span>
                  <button className="cx-btn" disabled={busy || result.page >= pages} onClick={() => void run(q, filters, result.page + 1)}>Next <ArrowRight size={14} /></button>
                </nav>
              )}
            </>
          )}
          {selectionBar(selected, q || input)}
          <p className="cx-rs-foot"><Sigma size={13} /> Search results are not generated by AI. Only the summaries you ask for are written by Cadus, from the abstracts alone: read the full paper before changing practice.</p>
        </>
      )}
    </section>
  );
}
