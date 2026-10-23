/**
 * Clinical Image Quiz: the user's own X-rays, ECGs and clinical photos (de-identified) turned into
 * questions with explanations. Play it here, keep it on this device, or send the batch a single page
 * with the images inside that works on any phone.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Download, ImagePlus, Images, Loader2, Play, Share2, ShieldAlert, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { attachmentPayload, type Attachment } from "@/lib/cadus/files";
import { deleteQuizSet, listQuizSets, newQuizSet, quizHtml, saveQuizSet, type ImageQuizSet } from "@/lib/cadus/clinic21";

export default function ImageQuizView({ generate, readFile, friendlyError, toast }: {
  generate: (body: Record<string, unknown>) => Promise<any>;
  readFile: (f: File) => Promise<Attachment>;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [hint, setHint] = useState("");
  const [level, setLevel] = useState("MBBS");
  const [per, setPer] = useState(2);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<{ identifiers: number[]; unsure: number[] } | null>(null);
  const [sets, setSets] = useState<ImageQuizSet[]>([]);
  const [play, setPlay] = useState<{ set: ImageQuizSet; picks: (number | null)[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { void listQuizSets().then(setSets); }, []);

  const add = async (fl: FileList | null) => {
    const out = [...files];
    for (const f of Array.from(fl ?? []).slice(0, 6 - files.length)) {
      if (!f.type.startsWith("image/")) { toast("Add images (JPG or PNG)"); continue; }
      try { out.push(await readFile(f)); } catch (e) { toast(e instanceof Error ? e.message : "Couldn't read that image"); }
    }
    setFiles(out.slice(0, 6));
    if (fileRef.current) fileRef.current.value = "";
  };

  const make = async () => {
    if (!files.length) { toast("Add one or more images"); return; }
    setBusy(true);
    try {
      const r = await generate({ action: "image-quiz", files: attachmentPayload(files), hint: hint.trim(), level, perImage: per });
      if (!r?.result) throw new Error("No quiz came back");
      const s = newQuizSet(r.result.title, files.map((f) => f.data ?? ""), r.result.questions);
      await saveQuizSet(s).catch(() => toast("Couldn't keep it on this device (storage full?)"));
      setSets((l) => [s, ...l]);
      setWarn({ identifiers: r.result.identifiers ?? [], unsure: r.result.unsure ?? [] });
      setPlay({ set: s, picks: s.questions.map(() => null) });
      setFiles([]); setHint("");
    } catch (e) {
      toast(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  };

  const exportPage = async (s: ImageQuizSet) => {
    const blob = new Blob([quizHtml(s)], { type: "text/html" });
    const name = `${s.title.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) || "Image quiz"}.html`;
    const file = new File([blob], name, { type: "text/html" });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], title: s.title }); return; } catch { /* closed */ } }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Saved the quiz page: send it on WhatsApp or email; it opens on any phone");
  };

  if (play) {
    const { set, picks } = play;
    const score = picks.filter((p, i) => p === set.questions[i].answer).length;
    const done = picks.every((p) => p !== null);
    return (
      <section className="cx-page cx-lab cx-iq">
        <header className="cx-page-h"><div><h1>{set.title}</h1><p>{set.questions.length} questions from {set.images.length} image{set.images.length === 1 ? "" : "s"}</p></div><button className="cx-ib" onClick={() => setPlay(null)} aria-label="Close the quiz"><X size={18} /></button></header>
        {warn?.identifiers.length ? <div className="cx-ltv-urgent" data-iq="identifiers"><ShieldAlert size={15} /><div><b>Patient details may be visible</b><p>Image {warn.identifiers.join(", ")} may show a name, number or face. Crop it before you share this quiz.</p></div></div> : null}
        {warn?.unsure.length ? <div className="cx-sc-gaps"><b>Check:</b> Cadus wasn't sure what image {warn.unsure.join(", ")} shows; check those questions.</div> : null}
        <ol className="cx-daily-qs" data-iq="questions">
          {set.questions.map((q, qi) => {
            const a = picks[qi];
            return (
              <li key={qi} data-iq-q={qi}>
                {set.images[q.image - 1] && <img className="cx-iq-img" src={set.images[q.image - 1]} alt={`Image ${q.image}`} />}
                <p className="cx-daily-q"><b>Q{qi + 1}.</b> {q.q}</p>
                <div className="cx-daily-opts">{q.options.map((o, oi) => {
                  const cls = a === null ? "" : oi === q.answer ? "right" : oi === a ? "wrong" : "dim";
                  return <button key={oi} className={cls} disabled={a !== null} onClick={() => setPlay({ set, picks: picks.map((p, k) => (k === qi ? oi : p)) })} data-iq-opt={oi}><span>{"ABCD"[oi]}</span>{o}{a !== null && oi === q.answer && <Check size={14} />}</button>;
                })}</div>
                {a !== null && <p className={`cx-daily-ex ${a === q.answer ? "ok" : "no"}`}>{q.explain}</p>}
              </li>
            );
          })}
        </ol>
        {done && <div className="cx-daily-done" data-iq="done"><div><b>{score} / {set.questions.length}</b><small>Send it to your batch to see how they do.</small></div></div>}
        <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void exportPage(set)} data-iq="share"><Share2 size={14} /> Send to your batch</button></div>
      </section>
    );
  }

  return (
    <section className="cx-page cx-lab cx-iq">
      <header className="cx-page-h"><div><h1>Clinical Image Quiz</h1><p>Add your own X-rays, ECGs, CT slices or clinical photos. Cadus writes exam-style questions about what's on them, with explanations. Play the quiz here, or send your batch one page with the images inside that works on any phone.</p></div></header>
      <div className="cx-lab-files">
        <input ref={fileRef} type="file" hidden multiple accept="image/*" onChange={(e) => void add(e.target.files)} data-iq="file" />
        <button className="cx-btn" onClick={() => fileRef.current?.click()} disabled={files.length >= 6}><ImagePlus size={14} /> Add images ({files.length}/6)</button>
      </div>
      {files.length > 0 && <div className="cx-iq-thumbs">{files.map((f, i) => <figure key={f.id}><img src={f.data} alt={`Image ${i + 1}`} /><figcaption>{i + 1}</figcaption><button className="cx-ib" onClick={() => setFiles(files.filter((x) => x.id !== f.id))} aria-label={`Remove image ${i + 1}`}><X size={12} /></button></figure>)}</div>}
      <div className="cx-mr-pt">
        <div className="cx-field"><span>Learners</span><div className="cx-seg">{["MBBS", "Intern", "PG"].map((l) => <button key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>{l}</button>)}</div></div>
        <div className="cx-field"><span>Questions per image</span><div className="cx-seg">{[1, 2, 3].map((n) => <button key={n} className={per === n ? "on" : ""} onClick={() => setPer(n)}>{n}</button>)}</div></div>
      </div>
      <label className="cx-field"><span>What the images show (optional, makes the questions more accurate)</span><textarea className="cx-input" rows={2} value={hint} onChange={(e) => setHint(e.target.value.slice(0, 1500))} placeholder="e.g. 1: right middle lobe pneumonia; 2: inferior STEMI; 3: vitiligo" data-iq="hint" /></label>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void make()} disabled={busy || !files.length} data-iq="go">{busy ? <><Loader2 size={15} className="cx-rot" /> Writing the questions…</> : <><Sparkles size={15} /> Make the quiz</>}</button></div>
      <p className="cx-rs-foot"><TriangleAlert size={13} /> Use images you're allowed to share, with names, hospital numbers, dates and faces cropped out. Cadus warns if it sees any.</p>
      {sets.length > 0 ? (
        <div className="cx-lf-saved">
          <p className="cx-gl"><span>Your quizzes</span></p>
          {sets.map((s) => (
            <div key={s.id} className="cx-sc-row cx-iq-row">
              <button className="cx-ltv-open" onClick={() => { setWarn(null); setPlay({ set: s, picks: s.questions.map(() => null) }); }}><b><Images size={13} /> {s.title}</b><small>{s.questions.length} questions · {s.images.length} images · {new Date(s.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></button>
              <button className="cx-ib" onClick={() => void exportPage(s)} aria-label={`Send ${s.title}`}><Download size={14} /></button>
              <button className="cx-ib" onClick={async () => { await deleteQuizSet(s.id); setSets((l) => l.filter((x) => x.id !== s.id)); }} aria-label={`Delete ${s.title}`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ) : !files.length && <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Play size={20} /></span><h3>Teach with your own cases</h3><p>Great for a ward teaching session, a batch WhatsApp group or your own revision.</p></div>}
    </section>
  );
}
