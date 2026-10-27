/**
 * Question Inbox: jot questions as they come up (here, or with /later in any chat), then have the
 * best-fitting assistants answer them all at once. Kept on this device.
 */
import { useState, type ReactNode } from "react";
import { Inbox, Loader2, MessageSquare, Plus, Save, Send, Trash2 } from "lucide-react";
import { addInbox, allCrew, findCrew, inboxPending, type CrewMember, type InboxItem } from "@/lib/cadus/crew";
import { MdBlock } from "./LiveAnswer";

export default function CrewInboxView({ mine, badge, ask, canAsk, friendlyError, toast, inbox, setInbox, onNote, onChat }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  inbox: InboxItem[];
  setInbox: (f: (l: InboxItem[]) => InboxItem[]) => void;
  onNote: (crewId: string, text: string, title: string) => void;
  onChat: (c: CrewMember, q: string) => void;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [openId, setOpenId] = useState("");
  const pending = inboxPending(inbox);
  const answered = inbox.filter((x) => x.answer);
  const add = () => { if (!q.trim()) return; setInbox((l) => addInbox(l, q, mine)); setQ(""); };
  const answer = async (items: InboxItem[]) => {
    if (!items.length || !canAsk(items.length)) return;
    for (const it of items) {
      const c = findCrew(it.crewId, mine) ?? findCrew("crew-neetpg", mine);
      if (!c) continue;
      setBusy(it.id);
      try {
        const a = (await ask(c, it.q)).trim();
        setInbox((l) => l.map((x) => (x.id === it.id ? { ...x, answer: a, answeredAt: Date.now() } : x)));
      } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); break; }
    }
    setBusy("");
  };
  return (
    <section className="cx-page cx-lab cx-inbox">
      <header className="cx-page-h"><div><h1>Question Inbox</h1><p>Jot down questions as they come up — on rounds, in class, while reading — and get them all answered later. In any chat, type <code>/later</code> followed by your question to drop it here.</p></div></header>
      <div className="cx-gs-row"><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value.slice(0, 1000))} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="e.g. Why does digoxin cause yellow vision?" data-ib="q" /><button className="cx-btn" onClick={add} disabled={!q.trim()} data-ib="add"><Plus size={14} /> Add</button></div>
      {pending.length > 0 && (
        <>
          <div className="cx-ib-h"><h4>Waiting ({pending.length})</h4><button className="cx-btn primary" onClick={() => void answer(pending)} disabled={!!busy} data-ib="ask-all">{busy ? <Loader2 size={14} className="cx-rot" /> : <Send size={14} />} Answer all</button></div>
          <ul className="cx-ib-list" data-ib="pending">{pending.map((x) => { const c = findCrew(x.crewId, mine); return (
            <li key={x.id} className="cx-ib-item" data-ib-item={x.q}>
              <span className="cx-ib-q">{x.q}</span>
              <span className="cx-ib-acts">
                <select className="cx-select sm" value={x.crewId} onChange={(e) => setInbox((l) => l.map((y) => (y.id === x.id ? { ...y, crewId: e.target.value } : y)))} aria-label="Assistant" data-ib-crew={x.q}>{allCrew(mine).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                {c && badge(c, 20)}
                {busy === x.id ? <Loader2 size={14} className="cx-rot" /> : <button className="cx-ib" onClick={() => void answer([x])} disabled={!!busy} aria-label="Answer this one" data-ib-one={x.q}><Send size={14} /></button>}
                <button className="cx-ib" onClick={() => setInbox((l) => l.filter((y) => y.id !== x.id))} aria-label="Delete" data-ib-del={x.q}><Trash2 size={14} /></button>
              </span>
            </li>
          ); })}</ul>
        </>
      )}
      {answered.length > 0 && (
        <>
          <div className="cx-ib-h"><h4>Answered ({answered.length})</h4><button className="cx-btn" onClick={() => setInbox((l) => l.filter((x) => !x.answer))} data-ib="clear">Clear answered</button></div>
          <div className="cx-lp-list" data-ib="answered">{answered.map((x) => { const c = findCrew(x.crewId, mine); return (
            <div key={x.id} className={`cx-lp ${openId === x.id ? "open" : ""}`} data-ib-done={x.q}>
              <button className="cx-lp-h" onClick={() => setOpenId(openId === x.id ? "" : x.id)}>{c && badge(c, 22)}<span className="cx-lp-t"><b>{x.q}</b><small>{c?.name ?? "Assistant"}</small></span></button>
              {openId === x.id && (
                <div className="cx-lp-b">
                  <div data-ib="answer"><MdBlock text={x.answer ?? ""} /></div>
                  <div className="cx-sc-acts">
                    <button className="cx-btn" onClick={() => { onNote(x.crewId, `**Q: ${x.q}**\n\n${x.answer}`, x.q.slice(0, 80)); toast("Saved to Crew notes"); }} data-ib="save"><Save size={14} /> Save to notes</button>
                    {c && <button className="cx-btn" onClick={() => onChat(c, x.q)} data-ib="chat"><MessageSquare size={14} /> Continue in a chat</button>}
                    <button className="cx-btn" onClick={() => setInbox((l) => l.filter((y) => y.id !== x.id))} data-ib="remove"><Trash2 size={14} /> Remove</button>
                  </div>
                </div>
              )}
            </div>
          ); })}</div>
        </>
      )}
      {!inbox.length && <p className="cx-set-hint" data-ib="empty"><Inbox size={13} /> Your inbox is empty.</p>}
    </section>
  );
}
