/**
 * Update 83: more Aethex Doctors pieces.
 * - ClinicQueue (the doctor's dashboard): today's clinic patients; mark arrived, call in, done or no-show. The wait
 *   estimate patients see comes from how long today's consultations actually took.
 * - QueueStatus (My appointments, on the day): your place in the queue, who is in now, the expected time, and how late
 *   the doctor is running. Refreshes every 30 seconds.
 * - ShareRecords (My appointments) and ShareRecordButton (Health records): send reports or scans to the doctor before
 *   a visit. Photos are shrunk to under 1 MB; files are deleted 30 days after the visit. SharedFiles shows them to the
 *   doctor on the appointment.
 * - LeaveDays (dashboard): leave as a range with a note patients see, and the choice to cancel and tell the patients
 *   already booked, with a link to the next working day.
 * - ReplyBox (dashboard): reply to a review, edit or remove it; the patient is emailed the first reply.
 * - ReviewList (doctor profile): filter and sort patient stories, and report one. ReportedReviews (admin).
 * Styles: src/site-hub.css (fd-q*, fd-share*, fd-leave*, fd-rv*).
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX2, Check, CheckCheck, Clock, Eye, EyeOff, Flag, Hourglass, LogIn, Paperclip, Pencil, Plus, Reply, RotateCcw, Share2, Trash2, Upload, UserCheck, Users, UserX, X } from "lucide-react";
import { Stars } from "./FindParts";
import { addDays, dateLabel, displayName, findApi, time12, useMyAppointments, type Appointment, type FindError, type Review } from "@/lib/find";

const todayIst = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const KINDS = ["Lab report", "Prescription", "Scan or X-ray", "Discharge summary", "Vaccination", "Bill", "Other"];
const MAX = 1_048_576;

/* ---------------------------------------------------------------- the clinic queue (doctor) */
type QRow = { id: string; time: string; name: string; age: number | null; phone: string; reason: string | null; status: string; state: "waiting" | "arrived" | "in" | "done" | "gone"; arrivedAt: number | null; startedAt: number | null; doneAt: number | null; files: number };
type Queue = { date: string; list: QRow[]; avgMin: number; lateMin: number; started: boolean; counts: { waiting: number; arrived: number; done: number } };
const Q_LABEL: Record<QRow["state"], string> = { waiting: "Not arrived", arrived: "Waiting", in: "With the doctor", done: "Done", gone: "No-show" };

export function ClinicQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["find", "queue"], queryFn: () => findApi<Queue>("/practice/queue"), refetchInterval: 30_000, retry: false });
  const [busy, setBusy] = useState(""), [err, setErr] = useState("");
  if (!data || !data.list.length) return null;
  const step = async (r: QRow, s: string) => {
    setBusy(r.id); setErr("");
    try { qc.setQueryData(["find", "queue"], await findApi<Queue>(`/practice/queue/${r.id}`, { step: s })); void qc.invalidateQueries({ queryKey: ["find", "practice"] }); }
    catch (x) { setErr((x as FindError).message); } finally { setBusy(""); }
  };
  const inRoom = data.list.find((x) => x.state === "in");
  return (
    <section className="fd-box fd-q" data-find="queue">
      <div className="fd-q-head">
        <h2><Users size={18} /> Today's queue</h2>
        <p className="mu">{data.counts.arrived} waiting · {data.counts.waiting} not arrived · {data.counts.done} done · about {data.avgMin} min a patient{data.lateMin >= 5 ? <> · <b className="late">running {data.lateMin} min late</b></> : ""}</p>
      </div>
      {inRoom && <p className="fd-q-now" data-find="q-now"><Hourglass size={15} /> With you now: <b>{inRoom.name}</b> ({time12(inRoom.time)})</p>}
      {err && <p className="fd-err">{err}</p>}
      <ol className="fd-q-list">{data.list.map((r) => (
        <li key={r.id} className={`s-${r.state}`} data-q={r.id} data-state={r.state}>
          <span className="t">{time12(r.time)}</span>
          <span className="n"><b>{r.name}</b>{r.age != null && <small>{r.age} y</small>}{r.reason && <small>{r.reason}</small>}{r.files > 0 && <small><Paperclip size={11} /> {r.files} record{r.files === 1 ? "" : "s"} shared</small>}</span>
          <span className={`fd-q-pill s-${r.state}`}>{Q_LABEL[r.state]}</span>
          <span className="a">
            {r.state === "waiting" && <button type="button" className="fd-btn sm ghost" disabled={busy === r.id} onClick={() => void step(r, "arrived")} data-q-step="arrived"><UserCheck size={14} /> Arrived</button>}
            {(r.state === "waiting" || r.state === "arrived") && <button type="button" className="fd-btn sm" disabled={busy === r.id} onClick={() => void step(r, "start")} data-q-step="start"><LogIn size={14} /> Call in</button>}
            {r.state === "in" && <button type="button" className="fd-btn sm" disabled={busy === r.id} onClick={() => void step(r, "done")} data-q-step="done"><CheckCheck size={14} /> Done</button>}
            {r.state === "waiting" && <button type="button" className="fd-btn sm ghost" disabled={busy === r.id} onClick={() => void step(r, "no-show")}><UserX size={14} /> No-show</button>}
            {(r.state !== "waiting") && <button type="button" className="fd-icon" disabled={busy === r.id} onClick={() => void step(r, "undo")} aria-label={`Undo the last step for ${r.name}`} data-q-step="undo"><RotateCcw size={14} /></button>}
          </span>
        </li>
      ))}</ol>
      <p className="tiny">Patients see their place in the line and an estimated time on their phone. Calling a patient in marks whoever was with you as done.</p>
    </section>
  );
}

/* ---------------------------------------------------------------- the patient's place in the queue */
type MyQ = { state: "not-today" | "closed" | "done" | "in" | "waiting" | "arrived"; ahead?: number; nowServing?: string | null; waitMin?: number; expectedAt?: string; lateMin?: number; started?: boolean; avgMin?: number; updatedAt?: number };
export function QueueStatus({ a }: { a: Appointment }) {
  const on = a.mode === "clinic" && a.date === todayIst() && ["booked", "confirmed"].includes(a.status);
  const { data } = useQuery({ enabled: on, queryKey: ["find", "myq", a.id], queryFn: () => findApi<MyQ>(`/queue/${a.id}`), refetchInterval: 30_000, retry: false });
  if (!on || !data || ["not-today", "closed", "done"].includes(data.state)) return null;
  if (data.state === "in") return <div className="fd-myq in" data-find="myq" role="status"><Check size={18} /><b>It's your turn. Please go in.</b></div>;
  return (
    <div className="fd-myq" data-find="myq" role="status" aria-live="polite">
      <div className="big"><b data-find="myq-ahead">{data.ahead}</b><small>{data.ahead === 1 ? "patient" : "patients"} ahead of you</small></div>
      <div className="txt">
        <p><Clock size={14} /> Expected around <b data-find="myq-at">{time12(data.expectedAt!)}</b>{data.waitMin! > 0 ? ` (about ${data.waitMin} min)` : ""}</p>
        {data.nowServing ? <p className="mu">Now seeing the {time12(data.nowServing)} patient{data.lateMin! >= 5 ? <>; the doctor is running about <b>{data.lateMin} min</b> late</> : ""}.</p>
          : <p className="mu">{data.started ? "The doctor is between patients." : "The doctor hasn't started seeing patients yet."}</p>}
        <p className="tiny">An estimate from today's consultations{data.state === "arrived" ? "" : ". Tell the reception when you arrive"}. Updates every 30 seconds.</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sharing records with the doctor */
type Shared = { id: string; name: string; type: string; size: number; kind: string | null; at: number; viewed: boolean };
const toB64 = (buf: ArrayBuffer) => { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
/** A photo is redrawn as a JPEG small enough to share; a PDF must already be under 1 MB. */
async function prepare(blob: Blob, name: string): Promise<{ name: string; data: string }> {
  if (blob.type === "application/pdf" || /\.pdf$/i.test(name)) {
    if (blob.size > MAX) throw new Error("This PDF is over 1 MB. Share the important pages, or a photo of them.");
    return { name, data: toB64(await blob.arrayBuffer()) };
  }
  if (!blob.type.startsWith("image/")) throw new Error("Share a PDF or a photo.");
  if (blob.size <= MAX && /^image\/(jpeg|png|webp)$/.test(blob.type)) return { name, data: toB64(await blob.arrayBuffer()) };
  const img = await createImageBitmap(blob);
  for (const [side, q] of [[2000, 0.82], [1600, 0.78], [1280, 0.72], [1000, 0.65]] as const) {
    const k = Math.min(1, side / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const out = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", q));
    if (out && out.size <= MAX) return { name: name.replace(/\.[^.]+$/, "") + ".jpg", data: toB64(await out.arrayBuffer()) };
  }
  throw new Error("This photo is too large to share.");
}
type DeviceRec = { id: string; name: string; kind: string; person: string; date: string; data: Blob };
function deviceRecords(): Promise<DeviceRec[]> {
  return new Promise((res) => {
    try {
      const r = indexedDB.open("aethex-records", 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("records", { keyPath: "id" }); };
      r.onsuccess = () => { const q = r.result.transaction("records", "readonly").objectStore("records").getAll(); q.onsuccess = () => res((q.result as DeviceRec[]).sort((x, y) => y.date.localeCompare(x.date))); q.onerror = () => res([]); };
      r.onerror = () => res([]);
    } catch { res([]); }
  });
}
async function upload(apptId: string, blob: Blob, name: string, kind: string) {
  const p = await prepare(blob, name);
  return findApi<{ files: Shared[] }>(`/appointments/${apptId}/files`, { ...p, kind });
}

export function ShareRecords({ a }: { a: Appointment }) {
  const on = ["booked", "confirmed", "completed"].includes(a.status) && a.date >= addDays(todayIst(), -7);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ enabled: on && open, queryKey: ["find", "shared", a.id], queryFn: () => findApi<{ files: Shared[] }>(`/appointments/${a.id}/files`).then((r) => r.files), retry: false });
  const [kind, setKind] = useState("Lab report"), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const [device, setDevice] = useState<DeviceRec[] | null>(null);
  if (!on) return null;
  const done = (f: Shared[]) => qc.setQueryData(["find", "shared", a.id], f);
  const send = async (blob: Blob, name: string, k = kind) => {
    setBusy(true); setErr("");
    try { done((await upload(a.id, blob, name, k)).files); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const remove = async (f: Shared) => { try { done((await findApi<{ files: Shared[] }>(`/files/${f.id}/delete`, {})).files); } catch (x) { setErr((x as FindError).message); } };
  return (
    <div className="fd-share" data-find="share">
      <button type="button" className="fd-btn sm ghost" onClick={() => { setOpen(!open); if (!device) void deviceRecords().then(setDevice); }} aria-expanded={open} data-find="share-toggle"><Share2 size={14} /> Share records with the doctor{data?.length ? ` (${data.length})` : ""}</button>
      {open && (
        <div className="fd-share-box">
          <p className="tiny">Reports, scans or old prescriptions the doctor should see. Only this doctor can open them, and they're deleted 30 days after the visit. Up to 6 files, 1 MB each (photos are shrunk for you).</p>
          {data && data.length > 0 && <ul className="fd-share-list">{data.map((f) => (
            <li key={f.id} data-shared={f.id}><Paperclip size={14} /><span><b>{f.name}</b><small>{f.kind ?? "Record"} · {kb(f.size)}{f.viewed ? " · Seen by the doctor" : ""}</small></span><a className="fd-icon" href={`/api/find/files/${f.id}`} target="_blank" rel="noopener" aria-label={`Open ${f.name}`}><Eye size={14} /></a><button type="button" className="fd-icon" onClick={() => void remove(f)} aria-label={`Remove ${f.name}`}><Trash2 size={14} /></button></li>
          ))}</ul>}
          <div className="fd-share-add">
            <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type of record">{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
            <label className="fd-btn sm"><Upload size={14} /> {busy ? "Uploading…" : "Choose a file"}<input type="file" accept="image/*,application/pdf" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void send(f, f.name); }} data-find="share-file" /></label>
          </div>
          {device && device.length > 0 && (
            <div className="fd-share-device"><small>From your health records on this device</small>
              <div>{device.slice(0, 12).map((r) => <button key={r.id} type="button" className="fd-chip" disabled={busy} onClick={() => void send(r.data, r.name, r.kind)}><Plus size={12} /> {r.kind} · {r.person} · {dateLabel(r.date, { day: "numeric", month: "short" })}</button>)}</div>
            </div>
          )}
          {err && <p className="fd-err" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}

/** On a record in Health records: share it for one of your upcoming visits. */
export function ShareRecordButton({ rec }: { rec: DeviceRec }) {
  const { data } = useMyAppointments();
  const [open, setOpen] = useState(false), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const today = todayIst();
  const visits = (data?.appointments ?? []).filter((a) => ["booked", "confirmed"].includes(a.status) && a.date >= today);
  if (!visits.length) return null;
  return (
    <span className="fd-share-one">
      <button type="button" className="fd-btn sm ghost" onClick={() => { setOpen(!open); setMsg(""); }} aria-expanded={open}><Share2 size={14} /> Share</button>
      {open && <span className="pop">
        <small>Share with the doctor for</small>
        {visits.slice(0, 6).map((a) => <button key={a.id} type="button" disabled={busy} onClick={async () => { setBusy(true); setMsg(""); try { await upload(a.id, rec.data, rec.name, rec.kind); setMsg(`Shared with ${a.doctor ? displayName(a.doctor.name) : "the doctor"}.`); } catch (x) { setMsg((x as Error).message); } finally { setBusy(false); } }}>{a.doctor ? displayName(a.doctor.name) : "Doctor"} · {dateLabel(a.date)}, {time12(a.time)}</button>)}
        {msg && <em role="status">{msg}</em>}
      </span>}
    </span>
  );
}

/** The doctor's view of what a patient shared for a visit. */
export function SharedFiles({ id, count }: { id: string; count: number }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ enabled: open, queryKey: ["find", "shared", id], queryFn: () => findApi<{ files: Shared[] }>(`/appointments/${id}/files`).then((r) => r.files), retry: false });
  if (!count) return null;
  return (
    <div className="fd-share doc" data-find="shared-files">
      <button type="button" className="fd-btn sm ghost" onClick={() => setOpen(!open)} aria-expanded={open}><Paperclip size={14} /> {count} record{count === 1 ? "" : "s"} from the patient</button>
      {open && data && <ul className="fd-share-list">{data.map((f) => <li key={f.id}><Paperclip size={14} /><span><b>{f.name}</b><small>{f.kind ?? "Record"} · {kb(f.size)}</small></span><a className="fd-btn sm ghost" href={`/api/find/files/${f.id}`} target="_blank" rel="noopener" data-find="open-shared">Open</a></li>)}</ul>}
    </div>
  );
}

/* ---------------------------------------------------------------- leave */
export function LeaveDays({ off, note, onSaved }: { off: string[]; note: string | null; onSaved: () => void }) {
  const [dates, setDates] = useState<string[]>(off), [from, setFrom] = useState(""), [to, setTo] = useState(""), [why, setWhy] = useState(note ?? "");
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [clash, setClash] = useState<{ id: string; name: string; date: string; time: string }[]>([]);
  useEffect(() => { setDates(off); }, [off.join()]);
  useEffect(() => { setWhy(note ?? ""); }, [note]);
  const save = async (next: string[], notify = false) => {
    setBusy(true); setMsg("");
    try {
      const r = await findApi<{ dates: string[]; clashList: typeof clash; cancelled: number; notified: number }>("/me/timeoff", { dates: next, note: why, notify });
      setDates(r.dates); setClash(r.clashList);
      setMsg(notify ? `Cancelled ${r.cancelled} booking${r.cancelled === 1 ? "" : "s"} and emailed ${r.notified} patient${r.notified === 1 ? "" : "s"} a link to book again.` : r.clashList.length ? "" : "Saved.");
      onSaved();
    } catch (x) { setMsg((x as FindError).message); } finally { setBusy(false); }
  };
  const addRange = () => {
    const end = to && to >= from ? to : from, add: string[] = [];
    for (let d = from; d <= end && add.length < 60; d = addDays(d, 1)) add.push(d);
    void save(Array.from(new Set([...dates, ...add])).sort()); setFrom(""); setTo("");
  };
  return (
    <section className="fd-box fd-leave" data-find="timeoff">
      <h2><CalendarX2 size={18} /> Leave days</h2>
      <p className="mu">Patients can't book these days. They see the note on your profile.</p>
      <div className="fd-chips">{dates.length ? dates.map((x) => <span key={x}>{dateLabel(x)} <button type="button" onClick={() => void save(dates.filter((y) => y !== x))} aria-label={`Remove ${x}`}>×</button></span>) : <span className="none">No leave planned</span>}</div>
      <div className="fd-leave-form">
        <label>From<input type="date" value={from} min={todayIst()} onChange={(e) => setFrom(e.target.value)} data-find="leave-from" /></label>
        <label>To <em>(optional)</em><input type="date" value={to} min={from || todayIst()} onChange={(e) => setTo(e.target.value)} data-find="leave-to" /></label>
        <button type="button" className="fd-btn sm" disabled={!from || busy} onClick={addRange} data-find="leave-add"><Plus size={14} /> Add</button>
      </div>
      <div className="fd-replyform"><input value={why} onChange={(e) => setWhy(e.target.value)} maxLength={140} placeholder="Note for patients (optional), e.g. At a conference" aria-label="Note for patients" data-find="leave-note" /><button type="button" className="fd-btn sm ghost" disabled={busy || why === (note ?? "") || !dates.length} onClick={() => void save(dates)}>Save note</button></div>
      {clash.length > 0 && (
        <div className="fd-leave-clash" data-find="leave-clash">
          <p><b>{clash.length} patient{clash.length === 1 ? " is" : "s are"} already booked on these days:</b></p>
          <ul>{clash.map((c) => <li key={c.id}>{c.name} · {dateLabel(c.date)}, {time12(c.time)}</li>)}</ul>
          <div className="row"><button type="button" className="fd-btn sm danger" disabled={busy} onClick={() => void save(dates, true)} data-find="leave-notify"><X size={14} /> Cancel them and email a link to rebook</button><button type="button" className="fd-btn sm ghost" onClick={() => setClash([])}>Keep them</button></div>
        </div>
      )}
      {msg && <p className="tiny" role="status">{msg}</p>}
    </section>
  );
}

/* ---------------------------------------------------------------- replies to reviews */
export function ReplyBox({ r, onSaved }: { r: Review & { replyAt?: number | null; hidden?: boolean }; onSaved: () => void }) {
  const [edit, setEdit] = useState(false), [text, setText] = useState(r.reply ?? ""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const save = async (reply: string) => {
    setBusy(true); setErr("");
    try { await findApi(`/practice/reviews/${r.id}`, { reply }); setEdit(false); onSaved(); } catch (x) { setErr((x as FindError).message); } finally { setBusy(false); }
  };
  return (
    <>
      {r.hidden && <p className="tiny fd-rv-hidden"><EyeOff size={12} /> Hidden from your profile after a report.</p>}
      {r.reply && !edit ? (
        <div className="fd-reply"><b>Your reply</b><p>{r.reply}</p>
          <div className="fd-rv-acts"><button type="button" className="fd-link" onClick={() => { setText(r.reply ?? ""); setEdit(true); }} data-find="reply-edit"><Pencil size={13} /> Edit</button><button type="button" className="fd-link" onClick={() => { if (window.confirm("Remove your reply?")) void save(""); }} data-find="reply-remove"><Trash2 size={13} /> Remove</button></div>
        </div>
      ) : (
        <div className="fd-replyform"><input placeholder="Reply publicly (optional). The patient is emailed." value={text} maxLength={600} onChange={(e) => setText(e.target.value)} aria-label="Your reply" data-find="reply-input" /><button type="button" className="fd-btn sm" disabled={!text.trim() || busy} onClick={() => void save(text)} data-find="reply-save"><Reply size={14} /> {r.reply ? "Save" : "Reply"}</button>{edit && <button type="button" className="fd-btn sm ghost" onClick={() => setEdit(false)}>Cancel</button>}</div>
      )}
      {err && <p className="fd-err">{err}</p>}
    </>
  );
}

/* ---------------------------------------------------------------- patient stories on the profile */
const REASONS = ["Not a real visit", "Offensive or abusive", "Personal or private details", "Spam or advertising", "Other"];
function ReportReview({ id }: { id: string }) {
  const [open, setOpen] = useState(false), [msg, setMsg] = useState("");
  const send = async (reason: string) => {
    try { await findApi(`/reviews/${id}/report`, { reason }); setMsg("Thanks. We'll take a look."); }
    catch (x) { const e = x as FindError; setMsg(e.status === 401 ? "Sign in to report a review." : e.message); }
    setOpen(false);
  };
  if (msg) return <small className="fd-rv-msg" role="status">{msg}</small>;
  return (
    <span className="fd-rv-report">
      <button type="button" className="fd-link" onClick={() => setOpen(!open)} aria-expanded={open} data-find="report-review"><Flag size={12} /> Report</button>
      {open && <span className="pop" role="menu">{REASONS.map((r) => <button key={r} type="button" role="menuitem" onClick={() => void send(r)}>{r}</button>)}</span>}
    </span>
  );
}

type Filter = "all" | "positive" | "critical" | "replied";
export function ReviewList({ reviews, doctorName }: { reviews: (Review & { replyAt?: number | null })[]; doctorName: string }) {
  const [f, setF] = useState<Filter>("all"), [sort, setSort] = useState<"new" | "high" | "low">("new");
  const count = (k: Filter) => reviews.filter((r) => k === "all" || (k === "positive" ? r.rating >= 4 : k === "critical" ? r.rating <= 3 : !!r.reply)).length;
  const list = useMemo(() => reviews.filter((r) => f === "all" || (f === "positive" ? r.rating >= 4 : f === "critical" ? r.rating <= 3 : !!r.reply))
    .sort((a, b) => (sort === "new" ? b.at - a.at : sort === "high" ? b.rating - a.rating || b.at - a.at : a.rating - b.rating || b.at - a.at)), [reviews, f, sort]);
  if (!reviews.length) return <p className="mu">No stories yet. Only patients whose visit was completed can share one.</p>;
  return (
    <>
      {reviews.length >= 3 && (
        <div className="fd-rv-bar" data-find="review-filters">
          <div className="fd-tabs">{([["all", "All"], ["positive", "4–5 stars"], ["critical", "1–3 stars"], ["replied", "With a reply"]] as const).map(([k, l]) => <button key={k} type="button" className={f === k ? "on" : ""} onClick={() => setF(k)} data-rf={k}>{l} <small>{count(k)}</small></button>)}</div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort stories" data-find="review-sort"><option value="new">Newest</option><option value="high">Highest rated</option><option value="low">Lowest rated</option></select>
        </div>
      )}
      {list.length ? list.map((r, i) => (
        <div key={r.id ?? i} className="fd-review" data-review={r.id}>
          <div className="top"><Stars value={r.rating} size={13} />{r.recommend != null && <span className={`pill ${r.recommend ? "completed" : "cancelled"}`}>{r.recommend ? "Recommends the doctor" : "Doesn't recommend"}</span>}</div>
          {r.visited && <small className="mu">Visited for {r.visited}</small>}
          <p>{r.text || "No comment."}</p>
          {r.wait && <small className="mu"><Clock size={12} /> Waited {r.wait.toLowerCase()}</small>}
          {r.reply && <div className="fd-reply"><b>Reply from {doctorName}</b>{r.replyAt && <small className="mu"> · {new Date(r.replyAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>}<p>{r.reply}</p></div>}
          <small>{r.name} · {new Date(r.at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · Verified visit{r.id && <> · <ReportReview id={r.id} /></>}</small>
        </div>
      )) : <p className="mu">No stories match.</p>}
    </>
  );
}

/* ---------------------------------------------------------------- admin: reported reviews */
type Reported = { id: string; rating: number; text: string | null; name: string; at: number; reply: string | null; hidden: boolean; doctor: { name: string; slug: string }; open: number; reasons: string[] };
export function ReportedReviews() {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["find", "admin", "reports"], queryFn: () => findApi<{ reports: Reported[] }>("/admin/review-reports").then((r) => r.reports), retry: false });
  const act = async (id: string, action: string) => { await findApi(`/admin/review-reports/${id}`, { action }); void qc.invalidateQueries({ queryKey: ["find", "admin", "reports"] }); };
  if (error || !data) return null;
  return (
    <section className="fd-box" data-find="reported-reviews">
      <h2><Flag size={18} /> Reported reviews <small className="mu">{data.filter((r) => r.open).length} open</small></h2>
      {!data.length ? <p className="mu">No reports.</p> : data.map((r) => (
        <div key={r.id} className={`fd-review${r.hidden ? " hid" : ""}`} data-reported={r.id}>
          <div className="top"><Stars value={r.rating} size={13} /> <b>{displayName(r.doctor.name)}</b>{r.hidden && <span className="pill cancelled">Hidden</span>}{r.open > 0 && <span className="pill booked">{r.open} open</span>}</div>
          <p>{r.text || "No comment."}</p>
          <small className="mu">By {r.name} · reported as: {Array.from(new Set(r.reasons)).join(", ")}</small>
          <div className="fd-rv-acts">
            {r.hidden ? <button type="button" className="fd-btn sm ghost" onClick={() => void act(r.id, "restore")}><Eye size={14} /> Show again</button>
              : <><button type="button" className="fd-btn sm danger" onClick={() => void act(r.id, "hide")} data-find="hide-review"><EyeOff size={14} /> Hide</button><button type="button" className="fd-btn sm ghost" onClick={() => void act(r.id, "keep")}><Check size={14} /> Keep</button></>}
          </div>
        </div>
      ))}
    </section>
  );
}
