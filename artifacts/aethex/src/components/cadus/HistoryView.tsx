/**
 * Answer history: every answer Cadus gave on this device, with the tool, the
 * model, what the safety review found and how many sources it cited. It is an
 * append-only record kept apart from chats, exportable as CSV.
 */
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Download, ExternalLink, History, Search, ShieldCheck, Trash2 } from "lucide-react";
import { auditCsv, auditStats, STATUS_TEXT, type AuditEntry, type AuditStatus } from "@/lib/cadus/audit";
import { downloadBlob } from "@/lib/cadus/docx";

type StatusFilter = "all" | "corrected" | "approved" | "unreviewed" | "other";

const when = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return same ? `Today, ${time}` : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
};

export default function HistoryView({ entries, modeLabel, sessionExists, onOpen, onClear, toast }: {
  entries: AuditEntry[];
  modeLabel: (mode: string) => string;
  sessionExists: (sid: string) => boolean;
  onOpen: (sid: string, mid: string) => void;
  onClear: () => void;
  toast: (t: string) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [mode, setMode] = useState("all");
  const [open, setOpen] = useState("");
  const [armed, setArmed] = useState(false);
  const stats = useMemo(() => auditStats(entries), [entries]);
  const modes = useMemo(() => [...new Set(entries.map((e) => e.mode))].sort((a, b) => modeLabel(a).localeCompare(modeLabel(b))), [entries, modeLabel]);
  const shown = entries.filter((e) => {
    if (q.trim() && !e.question.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (mode !== "all" && e.mode !== mode) return false;
    if (status === "other") return e.status === "library" || e.status === "stopped" || e.status === "error";
    return status === "all" || e.status === status;
  });
  const badge = (s: AuditStatus, n: number) => (
    <span className={`cx-hs-st ${s}`}>{s === "corrected" ? `Corrected${n ? ` · ${n}` : ""}` : s === "approved" ? "Approved" : STATUS_TEXT[s]}</span>
  );

  return (
    <section className="cx-page cx-hs">
      <header className="cx-page-h">
        <div>
          <h1>Answer history</h1>
          <p>Every answer Cadus gave on this device: the tool, the model, what the safety review found and the sources it cited. It is kept apart from your chats, so deleting a chat doesn't erase its record. Temporary chats aren't recorded.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn" disabled={!entries.length} onClick={() => { downloadBlob(`cadus-answer-history-${new Date().toISOString().slice(0, 10)}.csv`, new Blob(["\uFEFF", auditCsv(entries)], { type: "text/csv;charset=utf-8" })); toast("Answer history downloaded (CSV)"); }}><Download size={15} /> Export CSV</button>
          <button
            className={`cx-btn danger ${armed ? "armed" : ""}`}
            disabled={!entries.length}
            onClick={() => {
              if (!armed) { setArmed(true); window.setTimeout(() => setArmed(false), 4000); return; }
              setArmed(false);
              onClear();
            }}
          >
            <Trash2 size={15} /> {armed ? "Click again to clear" : "Clear"}
          </button>
        </div>
      </header>

      <div className="cx-sf-stats">
        <div><small>Answers</small><b>{stats.answers.toLocaleString("en-IN")}</b></div>
        <div><small>Safety-reviewed</small><b>{stats.answers ? `${stats.reviewedPct}%` : "–"}</b></div>
        <div><small>Corrected by the review</small><b>{stats.corrected.toLocaleString("en-IN")}</b></div>
        <div><small>High confidence</small><b>{stats.reviewed ? `${stats.highConfidencePct}%` : "–"}</b></div>
      </div>

      {entries.length === 0 ? (
        <div className="cx-empty-state">
          <span className="cx-proj-ic" style={{ marginBottom: 0 }}><History size={20} /></span>
          <h3>No answers yet</h3>
          <p>When Cadus answers a question, the record appears here: when it was asked, by which model, and whether the safety review approved or corrected it.</p>
        </div>
      ) : (
        <>
          <div className="cx-hs-tools">
            <label className="cx-search">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions" aria-label="Search questions" />
            </label>
            <select className="cx-select" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label="Review result">
              <option value="all">Every result</option>
              <option value="corrected">Corrected by review</option>
              <option value="approved">Approved by review</option>
              <option value="unreviewed">Not reviewed</option>
              <option value="other">Library, stopped or failed</option>
            </select>
            <select className="cx-select" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Tool">
              <option value="all">Every tool</option>
              {modes.map((m) => <option key={m} value={m}>{modeLabel(m)}</option>)}
            </select>
            <span className="cx-hs-count">{shown.length.toLocaleString("en-IN")} of {entries.length.toLocaleString("en-IN")}</span>
          </div>
          <div className="cx-hs-table">
            <table>
              <thead>
                <tr><th>When</th><th>Question</th><th>Tool</th><th>Model</th><th>Safety review</th><th>Sources</th><th aria-label="Open" /></tr>
              </thead>
              <tbody>
                {shown.slice(0, 500).map((e) => {
                  const exists = sessionExists(e.sid);
                  const isOpen = open === e.id;
                  return (
                    <Fragment key={e.id}>
                      <tr className={isOpen ? "open" : ""}>
                        <td className="w">{when(e.at)}</td>
                        <td className="q">
                          <button onClick={() => setOpen(isOpen ? "" : e.id)} aria-expanded={isOpen}>
                            <ChevronDown size={14} className="chev" /><span>{e.question || "(attachment only)"}</span>
                          </button>
                        </td>
                        <td>{modeLabel(e.mode)}</td>
                        <td className="m">{e.model}{e.ms ? <small>{Math.max(1, Math.round(e.ms / 1000))} s</small> : null}</td>
                        <td>
                          {badge(e.status, e.changes.length)}
                          {e.confidence && <span className={`cx-conf ${e.confidence}`}>{e.confidence[0].toUpperCase() + e.confidence.slice(1)}</span>}
                        </td>
                        <td className="n">{e.sources || "–"}</td>
                        <td className="o">
                          {exists
                            ? <button className="cx-ib" onClick={() => onOpen(e.sid, e.mid)} aria-label="Open the chat" title="Open the chat"><ExternalLink size={15} /></button>
                            : <span className="gone" title="The chat was deleted">Deleted</span>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="cx-hs-det">
                          <td colSpan={7}>
                            <dl>
                              <div><dt>Reviewed by</dt><dd>{e.reviewer || "Not reviewed"}</dd></div>
                              <div><dt>Corrections</dt><dd>{e.changes.length ? <ul>{e.changes.map((c) => <li key={c}>{c}</li>)}</ul> : e.status === "approved" ? "None needed" : "–"}</dd></div>
                              <div><dt>Privacy guard</dt><dd>{e.hidden ? `${e.hidden} identifier${e.hidden === 1 ? "" : "s"} hidden` : "Nothing to hide"}</dd></div>
                              <div><dt>Details</dt><dd>{[e.think && "Think deeper", e.files && `${e.files} attachment${e.files === 1 ? "" : "s"}`, new Date(e.at).toLocaleString("en-IN")].filter(Boolean).join(" · ")}</dd></div>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {!shown.length && <p className="cx-hs-none">No answers match these filters.</p>}
          </div>
          <p className="cx-rs-foot"><ShieldCheck size={13} /> Stored only in this browser. The CSV opens in Excel for audit or teaching; questions appear as sent, after the privacy guard.</p>
        </>
      )}
    </section>
  );
}
