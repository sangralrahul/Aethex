/**
 * Referral Contacts: specialists, hospitals, labs and ambulances you refer to, with one tap to
 * call or WhatsApp, favourites first, and a contact card to share. On this device.
 */
import { useState } from "react";
import { Contact as ContactIcon, Download, MessageCircle, Phone, Plus, Search, Star, Trash2 } from "lucide-react";
import { newContact, readContacts, saveContacts, searchContacts, telHref, vcard, waHref, type Contact } from "@/lib/cadus/clinic25";

export default function ContactsView() {
  const [list, setList] = useState<Contact[]>(readContacts);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Contact>(() => newContact());
  const [open, setOpen] = useState(false);
  const put = (l: Contact[]) => { setList(l); saveContacts(l); };
  const shown = searchContacts(list, q);
  const share = (c: Contact) => { const url = URL.createObjectURL(new Blob([vcard(c)], { type: "text/vcard" })); const a = document.createElement("a"); a.href = url; a.download = `${c.name.replace(/[^\w ]+/g, "").trim() || "contact"}.vcf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); };

  return (
    <section className="cx-page cx-lab cx-contacts">
      <header className="cx-page-h"><div><h1>Referral Contacts</h1><p>The specialists, hospitals, labs and ambulance services you refer to, with one tap to call or WhatsApp. Kept on this device.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, speciality or place" aria-label="Search contacts" data-ct="q" /></label>
        <button className="cx-btn primary" onClick={() => setOpen(!open)} data-ct="new"><Plus size={14} /> New contact</button>
      </div>
      {open && (
        <form className="cx-rec-visit" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; put([...list, { ...f, name: f.name.trim(), whatsapp: f.whatsapp || f.phone, updatedAt: Date.now() }]); setF(newContact()); setOpen(false); }}>
          <div className="cx-c23-row">
            {([["name", "Name", "Dr A Sharma"], ["speciality", "Speciality or service", "Cardiology, ambulance, lab"], ["place", "Hospital or place", "City Hospital, Pune"], ["phone", "Phone", "98xxxxxxxx"], ["email", "Email", "Optional"]] as const).map(([k, l, ph]) => <label key={k} className="cx-field"><span>{l}</span><input className="cx-input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.slice(0, 120) })} placeholder={ph} inputMode={k === "phone" ? "tel" : undefined} data-ct={k} /></label>)}
          </div>
          <label className="cx-field"><span>Notes</span><input className="cx-input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value.slice(0, 300) })} placeholder="OPD days, takes PM-JAY, best time to call" /></label>
          <div className="cx-sc-acts"><button className="cx-btn primary" type="submit" data-ct="save">Save</button></div>
        </form>
      )}
      {shown.length ? (
        <ul className="cx-ct-list" data-ct="list">{shown.map((c) => (
          <li key={c.id} data-ct-name={c.name}>
            <button className={`cx-ib ${c.favourite ? "on" : ""}`} onClick={() => put(list.map((x) => (x.id === c.id ? { ...x, favourite: !x.favourite } : x)))} aria-label={c.favourite ? "Remove from favourites" : "Add to favourites"} aria-pressed={c.favourite}><Star size={15} /></button>
            <span className="cx-ct-who"><b>{c.name}</b><small>{[c.speciality, c.place].filter(Boolean).join(" · ")}</small>{c.notes && <small>{c.notes}</small>}</span>
            {c.phone && <a className="cx-btn" href={telHref(c.phone)} aria-label={`Call ${c.name}`}><Phone size={14} /> Call</a>}
            {(c.whatsapp || c.phone) && <a className="cx-btn" href={waHref(c.whatsapp || c.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${c.name}`}><MessageCircle size={14} /></a>}
            <button className="cx-ib" onClick={() => share(c)} aria-label={`Save ${c.name} to a phone (vCard)`}><Download size={14} /></button>
            <button className="cx-ib" onClick={() => { if (window.confirm(`Delete ${c.name}?`)) put(list.filter((x) => x.id !== c.id)); }} aria-label={`Delete ${c.name}`}><Trash2 size={13} /></button>
          </li>
        ))}</ul>
      ) : <div className="cx-empty-state"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><ContactIcon size={20} /></span><h3>{list.length ? "No match" : "No contacts yet"}</h3><p>Add the people and places you refer to most.</p></div>}
    </section>
  );
}
