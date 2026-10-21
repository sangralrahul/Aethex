/**
 * The addresses kept in the account (on Cloudflare, /api/store/addresses): add,
 * change, make one the default, remove. Checkout lists them to pick from.
 * Styles: src/buy.css (.ax-addrs).
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { addAddress, removeAddress, updateAddress, useAddresses } from "@/lib/store/api";
import { INDIAN_STATES, MAX_ADDRESSES, normPhone, validPincode } from "@/lib/store/rules";
import type { Address, SavedAddress } from "@/lib/store/types";
import { useUserAuth } from "@/hooks/use-user-auth";

const LABELS = ["Home", "Hostel", "Clinic", "Work", "Other"];
const BLANK = { label: "Home", name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", isDefault: false };
type Form = typeof BLANK;

export function SavedAddresses() {
  const { user } = useUserAuth();
  const qc = useQueryClient();
  const q = useAddresses(!!user);
  const list = q.data ?? [];
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState<Form>(BLANK);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const put = (addresses: SavedAddress[]) => qc.setQueryData(["store", "addresses"], addresses);

  const open = (a?: SavedAddress) => {
    setErr("");
    setEditing(a ? a.id : "new");
    setF(a ? { label: a.label, isDefault: a.isDefault, name: a.address.name, phone: a.address.phone, line1: a.address.line1, line2: a.address.line2 ?? "", landmark: a.address.landmark ?? "", city: a.address.city, state: a.address.state, pincode: a.address.pincode }
      : { ...BLANK, label: list.length ? "Other" : "Home", name: user?.name ?? "", phone: user?.phone ?? "" });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr("Please enter the name of the person receiving orders here.");
    if (!normPhone(f.phone)) return setErr("Please enter a 10-digit Indian mobile number.");
    if (f.line1.trim().length < 4) return setErr("Please enter the house, flat or building and street.");
    if (!validPincode(f.pincode)) return setErr("Please enter a 6-digit PIN code.");
    if (f.city.trim().length < 2) return setErr("Please enter the town or city.");
    if (!f.state) return setErr("Please choose the state.");
    const address: Address = { name: f.name.trim(), phone: normPhone(f.phone), line1: f.line1.trim(), city: f.city.trim(), state: f.state, pincode: f.pincode.trim(), ...(f.line2.trim() ? { line2: f.line2.trim() } : {}), ...(f.landmark.trim() ? { landmark: f.landmark.trim() } : {}) };
    setBusy("save"); setErr("");
    try {
      const r = editing === "new" ? await addAddress({ address, label: f.label, isDefault: f.isDefault }) : await updateAddress(editing!, { address, label: f.label, isDefault: f.isDefault || undefined });
      put(r.addresses);
      setEditing(null);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(""); }
  };
  const act = async (id: string, what: "default" | "remove") => {
    setBusy(`${what}:${id}`); setErr("");
    try { put((what === "remove" ? await removeAddress(id) : await updateAddress(id, { isDefault: true })).addresses); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(""); }
  };
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  if (!user) return <p className="ax-addrs-none">Sign in to keep your addresses.</p>;
  return (
    <div className="ax-addrs">
      <div className="ax-addrs-head">
        <div><h2><MapPin size={18} /> Your addresses</h2><p>Pick them at checkout. Up to {MAX_ADDRESSES}, kept in your account on every device.</p></div>
        {editing === null && list.length < MAX_ADDRESSES && <button type="button" className="ax-btn teal" onClick={() => open()}><Plus size={16} /> Add an address</button>}
      </div>
      {err && <p className="ax-form-err" role="alert">{err}</p>}
      {editing !== null && (
        <form className="ax-addrs-form" onSubmit={save} noValidate>
          <h3>{editing === "new" ? "A new address" : "Change this address"}</h3>
          <div className="ax-chips" role="group" aria-label="Call it">
            {LABELS.map((l) => <button key={l} type="button" className={f.label === l ? "on" : ""} onClick={() => setF((x) => ({ ...x, label: l }))}>{l}</button>)}
          </div>
          <div className="ax-form">
            <label className="f"><span>Full name</span><input value={f.name} onChange={set("name")} autoComplete="name" maxLength={80} /></label>
            <label className="f"><span>Mobile number</span><input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} /></label>
            <label className="f wide"><span>Flat, house, building and street</span><input value={f.line1} onChange={set("line1")} autoComplete="address-line1" maxLength={160} /></label>
            <label className="f wide"><span>Area or locality <em>(optional)</em></span><input value={f.line2} onChange={set("line2")} autoComplete="address-line2" maxLength={160} /></label>
            <label className="f"><span>PIN code</span><input value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} inputMode="numeric" autoComplete="postal-code" maxLength={6} /></label>
            <label className="f"><span>Landmark <em>(optional)</em></span><input value={f.landmark} onChange={set("landmark")} maxLength={100} /></label>
            <label className="f"><span>Town or city</span><input value={f.city} onChange={set("city")} autoComplete="address-level2" maxLength={60} /></label>
            <label className="f"><span>State</span><select value={f.state} onChange={set("state")}><option value="">Choose the state</option>{INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          </div>
          {!(editing !== "new" && list.find((a) => a.id === editing)?.isDefault) && (
            <label className="ax-check"><input type="checkbox" checked={f.isDefault} onChange={(e) => setF((x) => ({ ...x, isDefault: e.target.checked }))} /><span className="box" /> Use it first at checkout (the default)</label>
          )}
          <div className="row">
            <button type="submit" className="ax-btn teal" disabled={busy === "save"}>{busy === "save" ? <Loader2 size={16} className="spin" /> : null} Save address</button>
            <button type="button" className="ax-btn" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      {q.isLoading ? <p className="ax-addrs-none"><Loader2 size={16} className="spin" /> Loading…</p> : list.length === 0 && editing === null ? (
        <div className="ax-empty"><span className="ic"><MapPin size={24} /></span><h2>No addresses yet</h2><p>Add one here, or tick &ldquo;Keep this address&rdquo; at checkout.</p></div>
      ) : (
        <ul className="ax-addrs-list">
          {list.map((a, i) => (
            <li key={a.id} className={a.isDefault ? "def" : ""} style={{ ["--d" as string]: `${i * 40}ms` }}>
              <div className="h"><b>{a.label}</b>{a.isDefault && <em>Default</em>}</div>
              <p>{a.address.name}<br />{a.address.line1}{a.address.line2 ? `, ${a.address.line2}` : ""}{a.address.landmark ? <><br />Near {a.address.landmark}</> : null}<br />{a.address.city}, {a.address.state} {a.address.pincode}<br /><span>{a.address.phone}</span></p>
              <div className="acts">
                <button type="button" className="ax-link" onClick={() => open(a)}><Pencil size={13} /> Change</button>
                {!a.isDefault && <button type="button" className="ax-link" onClick={() => act(a.id, "default")} disabled={!!busy}>{busy === `default:${a.id}` ? <Loader2 size={13} className="spin" /> : <Star size={13} />} Make default</button>}
                <button type="button" className="ax-link danger" onClick={() => act(a.id, "remove")} disabled={!!busy}>{busy === `remove:${a.id}` ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
