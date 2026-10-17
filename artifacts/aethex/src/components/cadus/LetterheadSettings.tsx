/**
 * Settings > Letterhead: your name, degrees, registration and hospital for the
 * top of Word, PDF and printed documents, with an optional logo and a live
 * preview. Kept on this device.
 */
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { hasLetterhead, letterheadLines, readLogo, type Letterhead } from "@/lib/cadus/letterhead";

const FIELDS: { id: keyof Omit<Letterhead, "enabled" | "logo">; label: string; placeholder: string; wide?: boolean; max: number }[] = [
  { id: "name", label: "Name", placeholder: "Dr Ananya Rao", max: 80 },
  { id: "qualifications", label: "Qualifications", placeholder: "MBBS, MD (General Medicine)", max: 120 },
  { id: "designation", label: "Designation", placeholder: "Consultant Physician", max: 100 },
  { id: "registration", label: "Registration number", placeholder: "Reg. No. 54321, Karnataka Medical Council", max: 120 },
  { id: "hospital", label: "Hospital or clinic", placeholder: "City General Hospital", max: 120 },
  { id: "phone", label: "Phone", placeholder: "080 1234 5678", max: 60 },
  { id: "address", label: "Address", placeholder: "12 MG Road, Bengaluru 560001", wide: true, max: 200 },
  { id: "email", label: "Email", placeholder: "opd@hospital.example", max: 100 },
];

export const SIGNED_LABEL = "Referral letters, discharge and death summaries, admission and operative notes, certificates and prescriptions";

export default function LetterheadSettings({ value, onChange, toast }: {
  value: Letterhead;
  onChange: (l: Letterhead) => void;
  toast: (t: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const lines = letterheadLines(value);
  // A copy, so the type guard does not narrow `value` itself.
  const ready = hasLetterhead({ ...value });

  const pickLogo = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange({ ...value, logo: await readLogo(f) });
      toast("Logo added");
    } catch (e) {
      toast(e instanceof Error ? e.message : "That image couldn't be used");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cx-lh">
      <div className="cx-set-row">
        <div>
          <b>Use a letterhead</b>
          <small>Your details go at the top of Word, PDF and printed documents. {SIGNED_LABEL} also end with a signature block. Kept only on this device.</small>
        </div>
        <button className={`cx-switch ${value.enabled ? "on" : ""}`} role="switch" aria-checked={value.enabled} aria-label="Use a letterhead" onClick={() => onChange({ ...value, enabled: !value.enabled })} />
      </div>
      <div className={`cx-lh-form ${value.enabled ? "" : "off"}`}>
        {FIELDS.map((f) => (
          <label key={f.id} className={`cx-field ${f.wide ? "wide" : ""}`}>
            <span>{f.label}</span>
            <input
              className="cx-input"
              value={value[f.id]}
              maxLength={f.max}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...value, [f.id]: e.target.value.replace(/[\r\n]+/g, " ") })}
              disabled={!value.enabled}
            />
          </label>
        ))}
        <div className="cx-field wide">
          <span>Logo <span className="opt">(optional, PNG or JPEG)</span></span>
          <div className="cx-lh-logo">
            {value.logo ? <img src={value.logo.data} alt="Your logo" /> : <span className="ph"><ImagePlus size={18} /></span>}
            <button type="button" className="cx-btn" onClick={() => fileRef.current?.click()} disabled={!value.enabled || busy}>{busy ? "Reading…" : value.logo ? "Replace" : "Upload logo"}</button>
            {value.logo && <button type="button" className="cx-btn danger" onClick={() => onChange({ ...value, logo: undefined })} disabled={!value.enabled}><Trash2 size={14} /> Remove</button>}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>
      </div>
      <p className="cx-set-sub">Preview</p>
      <div className={`cx-lh-prev ${ready ? "" : "empty"}`} aria-label="Letterhead preview">
        {ready ? (
          <>
            <div className="cx-lh-head">
              {value.logo && <img src={value.logo.data} alt="" />}
              <div className="l">{lines.left.map((x, i) => (i === 0 ? <b key={i}>{x}</b> : <span key={i}>{x}</span>))}</div>
              <div className="r">{lines.right.map((x, i) => (i === 0 ? <b key={i}>{x}</b> : <span key={i}>{x}</span>))}</div>
            </div>
            <div className="cx-lh-body">
              <b>Referral letter</b>
              <i /><i /><i style={{ width: "62%" }} />
            </div>
            <div className="cx-lh-sign">
              <span className="ln" />
              <b>{value.name || "Signature"}</b>
              {value.qualifications && <span>{value.qualifications}</span>}
              <span>{value.registration || "Registration no. ____________"}</span>
            </div>
          </>
        ) : (
          <p>{value.enabled ? "Add your name or your hospital to see the letterhead." : "The letterhead is off, so documents use the plain Cadus header."}</p>
        )}
      </div>
      <p className="cx-lh-note">Prescriptions and certificates from Cadus are drafts: check every detail, then sign and stamp them yourself.</p>
    </div>
  );
}
