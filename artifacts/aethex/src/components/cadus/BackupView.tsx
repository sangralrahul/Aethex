/**
 * Backup & Restore: everything Cadus keeps in this browser (chats, patient records, receipts,
 * stock, appointments and the rest) in one file, optionally locked with a passphrase (AES-GCM),
 * restored on this or another computer; how much storage is used; and wiping a shared computer.
 */
import { useRef, useState } from "react";
import { DatabaseBackup, Download, HardDrive, Lock, ShieldAlert, Trash2, Upload } from "lucide-react";
import { BackupError, fmtBytes, keyLabel, lastBackupAt, makeBackup, markBackedUp, openBackup, restoreBackup, storageUse, wipeCadus } from "@/lib/cadus/clinic26";

export default function BackupView({ toast }: { toast: (t: string) => void }) {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [use, setUse] = useState(storageUse);
  const [last, setLast] = useState(lastBackupAt);
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [rpass, setRpass] = useState("");
  const [preview, setPreview] = useState<{ createdAt: string; data: Record<string, string> } | null>(null);
  const [err, setErr] = useState("");
  const [wipeArmed, setWipeArmed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (pass && pass !== pass2) { toast("The passphrases don't match"); return; }
    setBusy(true);
    try {
      const b = await makeBackup(pass);
      const url = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `cadus-backup-${b.createdAt.slice(0, 10)}${b.encrypted ? "-locked" : ""}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      markBackedUp(); setLast(lastBackupAt());
      toast(`Backed up ${b.keys} kinds of data`);
    } catch { toast("Couldn't make the backup in this browser"); } finally { setBusy(false); }
  };
  const read = async () => {
    if (!file) return;
    setErr(""); setPreview(null);
    try { setPreview(await openBackup(file.text, rpass)); } catch (e) { setErr(e instanceof BackupError ? e.message : "Couldn't read that file."); }
  };
  const restore = (mode: "replace" | "merge") => {
    if (!preview) return;
    if (mode === "replace" && !window.confirm("Replace the Cadus data on this device with the backup? Data that isn't in the backup will be removed.")) return;
    const n = restoreBackup(preview.data, mode);
    toast(`Restored ${n} kinds of data: reloading`);
    window.setTimeout(() => window.location.reload(), 900);
  };

  return (
    <section className="cx-page cx-lab cx-backup">
      <header className="cx-page-h"><div><h1>Backup &amp; Restore</h1><p>Cadus keeps your chats, patient records, receipts, stock, appointments and every tool's data in this browser only. Back it all up to one file, lock it with a passphrase, and restore it here or on another computer.</p></div></header>
      <div className="cx-sim-stats" data-bk="use">
        <div><b>{fmtBytes(use.bytes)}</b><small>used by Cadus ({use.keys} kinds of data)</small></div>
        <div><b>{use.pct}%</b><small>of the usual 5 MB browser limit</small></div>
        <div><b>{last ? new Date(last).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never"}</b><small>last backup</small></div>
      </div>
      <div className="cx-cme-bar" role="progressbar" aria-valuenow={use.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used"><i style={{ width: `${use.pct}%` }} /></div>
      {use.pct >= 70 && <div className="cx-sc-gaps"><b><HardDrive size={13} /> Storage is filling up</b> Back up, then delete old chats or drafts. The largest: {use.biggest.slice(0, 3).map((b) => `${keyLabel(b.key)} (${fmtBytes(b.bytes)})`).join(", ")}.</div>}

      <h3 className="cx-lab-h3"><DatabaseBackup size={15} /> Back up</h3>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Passphrase (recommended for patient data)</span><input className="cx-input" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Leave empty for an unlocked file" data-bk="pass" /></label>
        {pass && <label className="cx-field"><span>Passphrase again</span><input className="cx-input" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} data-bk="pass2" /></label>}
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void save()} disabled={busy || !use.keys} data-bk="save">{pass ? <Lock size={14} /> : <Download size={14} />} {pass ? "Download locked backup" : "Download backup"}</button></div>
      {pass && <p className="cx-set-hint">Without the passphrase the file can't be opened by anyone, including you: keep it safe. Locked with AES-256 in this browser; nothing is sent anywhere.</p>}

      <h3 className="cx-lab-h3"><Upload size={15} /> Restore</h3>
      <input ref={input} type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setFile({ name: f.name, text: await f.text() }); setPreview(null); setErr(""); e.target.value = ""; }} data-bk="file" />
      <div className="cx-c23-row">
        <button className="cx-btn" onClick={() => input.current?.click()} data-bk="choose"><Upload size={14} /> {file ? file.name : "Choose a backup file"}</button>
        {file && <label className="cx-field"><span>Passphrase (if locked)</span><input className="cx-input" type="password" value={rpass} onChange={(e) => setRpass(e.target.value)} data-bk="rpass" /></label>}
        {file && <button className="cx-btn primary" onClick={() => void read()} data-bk="read">Open</button>}
      </div>
      {err && <p className="cx-bk-err" role="alert" data-bk="err">{err}</p>}
      {preview && (
        <div className="cx-cmp-out" data-bk="preview">
          <p>Backup from <b>{new Date(preview.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</b> with {Object.keys(preview.data).length} kinds of data:</p>
          <p className="cx-bk-keys">{Object.keys(preview.data).map((k) => <span key={k}>{keyLabel(k)}</span>)}</p>
          <div className="cx-sc-acts">
            <button className="cx-btn primary" onClick={() => restore("replace")} data-bk="replace">Replace this device's data</button>
            <button className="cx-btn" onClick={() => restore("merge")} data-bk="merge">Add to this device (backup wins where both have data)</button>
          </div>
        </div>
      )}

      <h3 className="cx-lab-h3"><ShieldAlert size={15} /> Shared or old computer</h3>
      <div className="cx-set-row">
        <div><b>Delete all Cadus data on this device</b><small>Chats, records, receipts and every tool's data in this browser. Back up first. Your account and plan are not affected.</small></div>
        <button className={`cx-btn danger ${wipeArmed ? "armed" : ""}`} onClick={() => { if (!wipeArmed) { setWipeArmed(true); return; } const n = wipeCadus(); setUse(storageUse()); toast(`Deleted ${n} kinds of data: reloading`); window.setTimeout(() => window.location.reload(), 900); }} data-bk="wipe"><Trash2 size={14} /> {wipeArmed ? "Click again to delete everything" : "Delete all"}</button>
      </div>
      <p className="cx-rs-foot"><Lock size={13} /> Patient data is yours to protect under the DPDP Act: use a passphrase, and keep backups off shared drives. Saved images in the image quiz and recorded voices are not in the backup.</p>
    </section>
  );
}
