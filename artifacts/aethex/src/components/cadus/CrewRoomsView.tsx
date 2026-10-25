/**
 * Crew Chat Rooms: a running group chat with up to five assistants. @-mention one or more, @all
 * for everyone, or let the best-matched assistant reply. Each reply sees the recent conversation.
 * Rooms stay on this device.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Copy, Loader2, MessagesSquare, Plus, Send, Trash2, Users } from "lucide-react";
import { MdBlock } from "./LiveAnswer";
import { deidentify } from "@/lib/cadus/deidentify";
import { allCrew, findCrew, newRoom, readRooms, ROOM_MAX, ROOM_MEMBERS_MAX, roomMd, roomMessage, roomTargets, saveRooms, type CrewMember, type CrewRoom, type RoomMsg } from "@/lib/cadus/crew";

const uid = () => `rm-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function CrewRoomsView({ mine, badge, ask, canAsk, friendlyError, toast }: {
  mine: CrewMember[];
  badge: (c: Pick<CrewMember, "icon" | "tone">, size: number) => ReactNode;
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [rooms, setRooms] = useState<CrewRoom[]>(readRooms);
  const [openId, setOpenId] = useState("");
  const [name, setName] = useState("");
  const [pick, setPick] = useState<string[]>(["crew-rounds", "crew-pharmacist"]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => saveRooms(rooms), [rooms]);
  const room = rooms.find((r) => r.id === openId);
  const members = room ? room.members.map((id) => findCrew(id, mine)).filter((c): c is CrewMember => !!c) : [];
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: "end" }); }, [room?.messages.length, busy.length]);
  const update = (id: string, f: (r: CrewRoom) => CrewRoom) => setRooms((list) => list.map((r) => (r.id === id ? f(r) : r)));

  const create = () => {
    if (pick.length < 2) { toast("Choose at least two assistants"); return; }
    if (rooms.length >= ROOM_MAX) { toast(`You can keep up to ${ROOM_MAX} rooms`); return; }
    const r = newRoom(name || pick.map((id) => findCrew(id, mine)?.name.split(" ")[0]).join(", "), pick);
    setRooms((l) => [r, ...l]); setOpenId(r.id); setName("");
  };
  const send = async () => {
    if (!room || !text.trim() || busy.length) return;
    const clean = deidentify(text.trim()).text;
    const targets = roomTargets(clean, members, room.mode).map((id) => members.find((m) => m.id === id)).filter((c): c is CrewMember => !!c);
    if (!targets.length || !canAsk(targets.length)) return;
    const userMsg: RoomMsg = { id: uid(), role: "user", text: clean, at: Date.now() };
    let snapshot: CrewRoom = { ...room, messages: [...room.messages, userMsg], updatedAt: Date.now() };
    update(room.id, () => snapshot);
    setText("");
    setBusy(targets.map((t) => t.id));
    for (const c of targets) {
      let reply: RoomMsg;
      try { reply = { id: uid(), role: "crew", crewId: c.id, name: c.name, text: await ask(c, roomMessage({ ...snapshot, messages: snapshot.messages.filter((m) => m.id !== userMsg.id) }, c, members, clean)), at: Date.now() }; }
      catch (e) { reply = { id: uid(), role: "crew", crewId: c.id, name: c.name, text: friendlyError(e instanceof Error ? e.message : String(e)), at: Date.now(), error: true }; }
      snapshot = { ...snapshot, messages: [...snapshot.messages, reply], updatedAt: Date.now() };
      update(room.id, () => snapshot);
      setBusy((b) => b.filter((x) => x !== c.id));
    }
    setBusy([]);
  };

  if (room) return (
    <section className="cx-page cx-lab cx-rooms">
      <header className="cx-page-h"><div><button className="cx-link" onClick={() => setOpenId("")} data-rm="back"><ArrowLeft size={13} /> All rooms</button><h1>{room.name}</h1><p className="cx-rm-members">{members.map((m) => <span key={m.id} className="cx-chip">{badge(m, 18)} {m.name}</span>)}</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Who replies when no one is @-mentioned</span><select className="cx-select" value={room.mode} onChange={(e) => update(room.id, (r) => ({ ...r, mode: e.target.value === "all" ? "all" : "best" }))} data-rm="mode"><option value="best">The best match for the message</option><option value="all">Everyone in the room</option></select></label>
        <button className="cx-btn" onClick={() => { void navigator.clipboard?.writeText(roomMd(room)); toast("Conversation copied"); }} data-rm="copy"><Copy size={14} /> Copy</button>
        <button className="cx-btn" onClick={() => update(room.id, (r) => ({ ...r, messages: [] }))} data-rm="clear">Clear</button>
      </div>
      <div className="cx-rm-log" data-rm="log">
        {room.messages.length === 0 && <p className="cx-set-hint">Ask anything. Type @ and a name (or @all) to choose who answers, e.g. "@{members[1]?.name.split(" ")[0] ?? "Pharmacist"} is this dose safe?"</p>}
        {room.messages.map((m) => { const c = m.crewId ? findCrew(m.crewId, mine) : undefined; return (
          <div key={m.id} className={`cx-rm-msg ${m.role}${m.error ? " err" : ""}`} data-rm-msg={m.role}>
            {m.role === "crew" && <div className="cx-rm-who">{c && badge(c, 22)}<b>{m.name}</b></div>}
            {m.role === "crew" ? <MdBlock text={m.text} /> : <p>{m.text}</p>}
          </div>); })}
        {busy.map((id) => <p key={id} className="cx-set-hint"><Loader2 size={13} className="cx-rot" /> {findCrew(id, mine)?.name} is typing…</p>)}
        <div ref={endRef} />
      </div>
      <div className="cx-rm-compose">
        <textarea className="cx-input" rows={2} value={text} onChange={(e) => setText(e.target.value.slice(0, 3000))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="Message the room (no patient names)" data-rm="text" />
        <button className="cx-btn primary" onClick={() => void send()} disabled={!text.trim() || busy.length > 0} data-rm="send"><Send size={14} /> Send</button>
      </div>
      <div className="cx-crew-chips">{["@all", ...members.map((m) => `@${m.name}`)].map((t) => <button key={t} className="cx-chip" onClick={() => setText((x) => `${t} ${x}`.slice(0, 3000))} data-rm-at={t}>{t}</button>)}</div>
    </section>
  );

  return (
    <section className="cx-page cx-lab cx-rooms">
      <header className="cx-page-h"><div><h1>Crew Chat Rooms</h1><p>A group chat with up to five assistants. Mention one with @, everyone with @all, or let the best one answer. Each sees what the others said, so they build on and correct each other.</p></div></header>
      <h4><Plus size={14} /> New room</h4>
      <div className="cx-c23-row"><label className="cx-field"><span>Room name</span><input className="cx-input" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="e.g. Night shift, Thesis team" data-rm="name" /></label></div>
      <div className="cx-pack-pick" data-rm="pick">{allCrew(mine).map((c) => <label key={c.id} className={`cx-chip ${pick.includes(c.id) ? "on" : ""}`}><input type="checkbox" hidden checked={pick.includes(c.id)} onChange={() => setPick((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : p.length >= ROOM_MEMBERS_MAX ? p : [...p, c.id]))} data-rm-pick={c.id} />{badge(c, 18)} {c.name}</label>)}</div>
      <p className="cx-set-hint">{pick.length} chosen (2 to {ROOM_MEMBERS_MAX}).</p>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={create} disabled={pick.length < 2} data-rm="create"><Users size={14} /> Create the room</button></div>
      {rooms.length > 0 && <h4><MessagesSquare size={14} /> Your rooms</h4>}
      <div className="cx-rm-list" data-rm="list">{rooms.map((r) => (
        <div key={r.id} className="cx-rm-card">
          <button className="cx-rm-open" onClick={() => setOpenId(r.id)} data-rm-open={r.name}><b>{r.name}</b><small>{r.members.map((id) => findCrew(id, mine)?.name).filter(Boolean).join(", ")} · {r.messages.length} messages</small></button>
          <button className="cx-ib" onClick={() => setRooms((l) => l.filter((x) => x.id !== r.id))} aria-label={`Delete ${r.name}`} data-rm-del={r.name}><Trash2 size={15} /></button>
        </div>
      ))}</div>
    </section>
  );
}
