/**
 * A shared answer or case, opened from a link: read-only, with the safety
 * note, the sources, local comments, and a way into Cadus to continue.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, MessageSquare, Send, ShieldCheck, Trash2 } from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { CADUS_REF_CSS } from "@/components/cadus/cadus-ref-styles";
import { CADUS_WS_CSS } from "@/components/cadus/cadus-ws-styles";
import { CADUS_SIGNIN_CSS } from "@/components/cadus/cadus-signin-styles";
import { CADUS_CLINIC_CSS } from "@/components/cadus/cadus-clinic-styles";
import { CADUS_LOOKS_CSS } from "@/components/cadus/cadus-looks-styles";
import { MdBlock } from "@/components/cadus/LiveAnswer";
import { addComment, decodeShare, readComments, removeComment, shareKey, type Comment, type Shared } from "@/lib/cadus/share";
import { isCadusHost } from "@/lib/host";

export default function CadusShared() {
  const [item, setItem] = useState<Shared | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [by, setBy] = useState("");
  const [text, setText] = useState("");
  const look = (() => { try { const l = JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").look; return ["clinical", "editorial", "mono"].includes(l) ? l : "editorial"; } catch { return "editorial"; } })();
  const dark = (() => { try { return JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").theme === "dark"; } catch { return false; } })();
  useEffect(() => {
    const load = () => decodeShare(window.location.hash).then((s) => { setItem(s); if (s) setComments(readComments(shareKey(s))); });
    void load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);
  const key = useMemo(() => (item ? shareKey(item) : ""), [item]);
  const home = isCadusHost() ? "/" : "/ai-assistant";
  const when = item ? new Date(item.at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <div className={`cx cx-shared ${dark ? "cx-dark" : "cx-light"} ans-sans`} data-look={look} style={{ ["--fs" as string]: "15.5px" }}>
      <style>{CADUS_CSS + CADUS_REF_CSS + CADUS_WS_CSS + CADUS_SIGNIN_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS}</style>
      <header className="cx-shared-top">
        <a className="cx-si-brand small" href={home} style={{ display: "flex", marginBottom: 0 }}><CadusMark size={24} /><span>Cadus</span></a>
        <span className="cx-shared-tag">Shared {item?.kind === "case" ? "case" : "answer"} · read-only</span>
        <a className="cx-btn primary" href={home}>Open Cadus <ArrowRight size={14} /></a>
      </header>
      <main className="cx-shared-main">
        {item === undefined ? <p className="cx-shared-note">Opening…</p> : item === null ? (
          <div className="cx-empty-state"><h3>This link can't be opened</h3><p>It may be incomplete (some apps cut long links). Ask the sender for the text file instead.</p><a className="cx-btn" href={home}>Go to Cadus</a></div>
        ) : (
          <>
            <article className="cx-shared-card">
              <h1>{item.title}</h1>
              <p className="cx-shared-meta">Shared{item.from ? ` by ${item.from}` : ""} on {when}{item.kind === "answer" && item.reviewed ? <> · <ShieldCheck size={13} /> safety-reviewed</> : null}</p>
              {item.kind === "answer" ? (
                <>
                  {item.question && <blockquote className="cx-shared-q">{item.question}</blockquote>}
                  <MdBlock text={item.answer} cites={item.sources?.length ?? 0} />
                  {item.sources?.length ? (
                    <div className="cx-sources"><div className="cx-src-h">References · {item.sources.length}</div><ol>{item.sources.map((s, i) => <li key={`${s.n}-${i}`}><a href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}><span className="n">{s.n}</span><span className="t">{s.title}</span></a></li>)}</ol></div>
                  ) : null}
                </>
              ) : (
                <pre className="cx-shared-case">{item.summary}</pre>
              )}
              <p className="cx-shared-warn"><AlertTriangle size={14} /> Decision support for qualified professionals, shared de-identified. Verify against the patient, current guidelines and local protocols before acting.</p>
            </article>
            <section className="cx-shared-cm">
              <h2><MessageSquare size={16} /> Notes on this device</h2>
              <p className="cx-shared-note">Comments stay in this browser; they aren't sent to the person who shared it. Reply to them directly, or share your own version.</p>
              {comments.length > 0 && <ul>{comments.map((c) => <li key={c.id}><b>{c.by || "You"}</b><small>{new Date(c.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small><span>{c.text}</span><button className="cx-ib" onClick={() => { removeComment(c.id); setComments(readComments(key)); }} aria-label="Delete this note"><Trash2 size={14} /></button></li>)}</ul>}
              <form className="cx-shared-form" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addComment(key, by, text); setComments(readComments(key)); setText(""); }}>
                <input className="cx-input" value={by} onChange={(e) => setBy(e.target.value)} placeholder="Your name or role" maxLength={40} aria-label="Your name" />
                <textarea className="cx-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="A note for yourself or your team" maxLength={2000} aria-label="Note" />
                <button className="cx-btn primary" type="submit" disabled={!text.trim()}><Send size={14} /> Add note</button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
