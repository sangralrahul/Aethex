/** Drug Cards (update 53): a one-page revision card per drug, kept as a deck, with flashcards and printing. */
import { useState } from "react";
import { Layers, Loader2, Pill, Printer, Save, Search, Trash2 } from "lucide-react";
import { addDrugCard, allCrew, drugCardFlashcards, drugCardMarkdown, drugCardPrompt, findCrew, parseDrugCard, readDrugCards, saveDrugCards, type CrewMember, type DrugCard } from "@/lib/cadus/crew";
import { printMarkdown } from "@/lib/cadus/printdoc";
import { readLetterhead } from "@/lib/cadus/letterhead";
import SubjectSelect from "./SubjectSelect";

export default function CrewDrugCardsView({ mine, ask, canAsk, friendlyError, toast, onSave }: {
  mine: CrewMember[];
  ask: (c: CrewMember, message: string) => Promise<string>;
  canAsk: (n: number) => boolean;
  friendlyError: (raw: string) => string;
  toast: (t: string) => void;
  onSave: (crewId: string, text: string, title: string, cards: { front: string; back: string }[]) => void;
}) {
  const [drug, setDrug] = useState("");
  const [subject, setSubject] = useState("Pharmacology");
  const [crewId, setCrewId] = useState("crew-pharmacist");
  const [busy, setBusy] = useState(false);
  const [deck, setDeck] = useState<DrugCard[]>(() => readDrugCards());
  const [open, setOpen] = useState<DrugCard | null>(null);
  const [find, setFind] = useState("");
  const update = (d: DrugCard[]) => { setDeck(d); saveDrugCards(d); };
  const go = async () => {
    const name = drug.trim();
    if (!name) { toast("Type a drug name"); return; }
    const have = deck.find((x) => x.drug.toLowerCase() === name.toLowerCase());
    if (have) { setOpen(have); return; }
    const c = findCrew(crewId, mine);
    if (!c || !canAsk(1)) return;
    setBusy(true);
    try {
      const card = parseDrugCard(await ask(c, drugCardPrompt(name, subject)));
      if (!card) { toast("The card didn't come back in a usable form. Try again."); return; }
      update(addDrugCard(deck, card)); setOpen(card); setDrug("");
    } catch (e) { toast(friendlyError(e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };
  const shown = deck.filter((c) => !find.trim() || `${c.drug} ${c.drugClass}`.toLowerCase().includes(find.trim().toLowerCase()));
  const sec = (t: string, items: string[]) => items.length ? <div><h5>{t}</h5><ul>{items.map((x) => <li key={x}>{x}</li>)}</ul></div> : null;
  return (
    <section className="cx-page cx-lab cx-dc">
      <header className="cx-page-h"><div><h1>Drug Cards</h1><p>One page per drug: class, mechanism, uses, dose, adverse effects and exam pearls. Build a deck, turn cards into flashcards, print them.</p></div></header>
      <div className="cx-c23-row">
        <label className="cx-field"><span>Drug</span><input className="cx-input" value={drug} onChange={(e) => setDrug(e.target.value.slice(0, 80))} onKeyDown={(e) => { if (e.key === "Enter") void go(); }} placeholder="e.g. Amiodarone" data-dc="drug" /></label>
        <label className="cx-field"><span>Subject</span><SubjectSelect value={subject} onChange={setSubject} data="dc" /></label>
        <label className="cx-field"><span>Assistant</span><select className="cx-select" value={crewId} onChange={(e) => setCrewId(e.target.value)} data-dc="crew">{allCrew(mine).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="cx-sc-acts"><button className="cx-btn primary" onClick={() => void go()} disabled={busy} data-dc="go">{busy ? <Loader2 size={14} className="cx-rot" /> : <Pill size={14} />} {busy ? "Making the card…" : "Make card"}</button></div>
      {open && (
        <article className="cx-dc-card" data-dc="card">
          <header><h2>{open.drug}</h2><span>{open.drugClass}</span></header>
          <p><b>Mechanism:</b> {open.mechanism}</p>
          <p><b>Dose:</b> {open.dose}</p>
          <div className="cx-dc-grid">{sec("Uses", open.uses)}{sec("Adverse effects", open.adverse)}{sec("Contraindications", open.contraindications)}{sec("Interactions", open.interactions)}</div>
          {open.monitoring && <p><b>Monitoring:</b> {open.monitoring}</p>}
          {open.pearls.length > 0 && <div className="cx-dc-pearls" data-dc="pearls"><h5>Exam pearls</h5><ul>{open.pearls.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <div className="cx-sc-acts">
            <button className="cx-btn" onClick={() => { onSave(crewId, drugCardMarkdown(open), `Drug card: ${open.drug}`, drugCardFlashcards(open)); toast("Saved to notes with flashcards"); }} data-dc="save"><Save size={14} /> Save with flashcards</button>
            <button className="cx-btn" onClick={() => void printMarkdown({ title: `Drug card: ${open.drug}`, md: drugCardMarkdown(open), letterhead: readLetterhead(), footer: "Drug card made with Cadus Crew by Aethex. Check doses against the current formulary." })} data-dc="print"><Printer size={14} /> Print</button>
          </div>
        </article>
      )}
      {deck.length > 0 && (
        <div className="cx-dc-deck" data-dc="deck">
          <div className="cx-dc-bar"><h4><Layers size={15} /> My deck ({deck.length})</h4><span className="cx-dc-find"><Search size={14} /><input className="cx-input" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find a drug" data-dc="find" /></span>
            <button className="cx-btn" onClick={() => void printMarkdown({ title: "Drug cards", md: shown.map(drugCardMarkdown).join("\n\n---\n\n"), letterhead: readLetterhead() })} data-dc="print-all"><Printer size={14} /> Print all</button></div>
          <div className="cx-dc-chips">{shown.map((c) => <span key={c.drug} className={`cx-dc-chip ${open?.drug === c.drug ? "on" : ""}`}><button onClick={() => setOpen(c)} data-dc="chip">{c.drug}</button><button className="cx-ib" aria-label={`Remove ${c.drug}`} onClick={() => { update(deck.filter((x) => x !== c)); if (open?.drug === c.drug) setOpen(null); }} data-dc="remove"><Trash2 size={12} /></button></span>)}</div>
        </div>
      )}
    </section>
  );
}
