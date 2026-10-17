/**
 * Privacy centre: what Cadus keeps in this browser, what it sends to write an
 * answer and what it never sends, the privacy guard (with a box to try it),
 * and controls to export or delete each kind of data.
 */
import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  Archive, BedDouble, BookMarked, Bookmark, Brain, Download, EyeOff, FilePen, Folder, HardDrive, History, IdCard, MessageSquare,
  Building2, ClipboardList, Send, ShieldCheck, Target, Trash2,
} from "lucide-react";
import { deidentify, describeHits } from "@/lib/cadus/deidentify";

export interface PrivacyCounts {
  chats: number;
  archived: number;
  docs: number;
  saved: number;
  projects: number;
  ward: number;
  reading: number;
  memory: number;
  history: number;
  hidden: number;
  practice: number;
  protocols: number;
  cases: number;
  letterhead: boolean;
  profile: boolean;
}

function Item({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: string; children?: ReactNode }) {
  return (
    <div className="cx-pv-item">
      <span className="cx-pv-ic">{icon}</span>
      <div className="cx-pv-t"><b>{title}</b><small>{detail}</small></div>
      <div className="cx-pv-acts">{children}</div>
    </div>
  );
}

/** A delete button that asks for a second click. */
function Armed({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`cx-btn danger ${armed ? "armed" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (!armed) { setArmed(true); window.setTimeout(() => setArmed(false), 4000); return; }
        setArmed(false);
        onConfirm();
      }}
    >
      <Trash2 size={14} /> {armed ? "Click again" : label}
    </button>
  );
}

export default function PrivacyView({ counts, guardOn, onToggleGuard, actions }: {
  counts: PrivacyCounts;
  guardOn: boolean;
  onToggleGuard: () => void;
  actions: {
    exportAll: () => void;
    deleteChats: () => void;
    deleteDocs: () => void;
    clearSaved: () => void;
    clearWard: () => void;
    clearReading: () => void;
    manageMemory: () => void;
    editProfile: () => void;
    openHistory: () => void;
    clearPractice: () => void;
    manageInstitution: () => void;
    clearCases: () => void;
    deleteEverything: () => void;
  };
}) {
  const [sample, setSample] = useState("Ramesh Kumar, 54M, UHID 4471822, mobile 9876543210, admitted with chest pain since morning.");
  const guarded = useMemo(() => deidentify(sample), [sample]);
  const n = (v: number, one: string, many = `${one}s`) => `${v.toLocaleString("en-IN")} ${v === 1 ? one : many}`;
  return (
    <section className="cx-page cx-pv">
      <header className="cx-page-h">
        <div>
          <h1>Privacy centre</h1>
          <p>What Cadus keeps in this browser, what it sends to write an answer, and what it never sends. Everything here is stored on this device only; nothing syncs to other devices.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn" onClick={actions.exportAll}><Download size={15} /> Export everything</button>
        </div>
      </header>

      <section className="cx-pv-guard">
        <div className="cx-pv-guard-h">
          <span className="cx-pv-ic big"><EyeOff size={18} /></span>
          <div>
            <b>Privacy guard</b>
            <p>Before a message is sent, Cadus replaces patient identifiers with placeholders: names, phone numbers, Aadhaar and ABHA numbers, UHIDs and other record numbers, dates of birth, addresses and email addresses. {counts.hidden ? `It has hidden ${n(counts.hidden, "identifier")} on this device so far.` : ""}</p>
          </div>
          <button className={`cx-switch ${guardOn ? "on" : ""}`} role="switch" aria-checked={guardOn} aria-label="Privacy guard" onClick={onToggleGuard} />
        </div>
        <div className="cx-pv-try">
          <label>
            <span>Try it: type a line from your notes</span>
            <textarea value={sample} onChange={(e) => setSample(e.target.value)} rows={2} aria-label="Text to test the privacy guard" />
          </label>
          <div className="cx-pv-out" aria-live="polite">
            <span>What Cadus would send{guarded.total ? ` · ${describeHits(guarded.hits)}` : ""}</span>
            <p>{guarded.text.split(/(\[[a-z .]+\])/gi).map((part, i) => (/^\[[a-z .]+\]$/i.test(part) ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}</p>
          </div>
        </div>
        <p className="cx-pv-note">It is a safety net, not a guarantee, so still avoid typing identifiers.</p>
      </section>

      <div className="cx-pv-cols">
        <section className="cx-pv-sec">
          <h2><HardDrive size={16} /> Kept in this browser</h2>
          <div className="cx-pv-list">
            <Item icon={<MessageSquare size={16} />} title="Chats" detail={`${n(counts.chats, "chat")}${counts.archived ? `, ${counts.archived} archived` : ""}`}>
              <Armed label="Delete" onConfirm={actions.deleteChats} disabled={!counts.chats && !counts.archived} />
            </Item>
            <Item icon={<FilePen size={16} />} title="Documents" detail={n(counts.docs, "document")}>
              <Armed label="Delete" onConfirm={actions.deleteDocs} disabled={!counts.docs} />
            </Item>
            <Item icon={<Bookmark size={16} />} title="Saved answers" detail={n(counts.saved, "answer")}>
              <Armed label="Clear" onConfirm={actions.clearSaved} disabled={!counts.saved} />
            </Item>
            <Item icon={<ClipboardList size={16} />} title="Patient cases" detail={`${n(counts.cases, "case")}, de-identified`}>
              <Armed label="Delete" onConfirm={actions.clearCases} disabled={!counts.cases} />
            </Item>
            <Item icon={<BedDouble size={16} />} title="Ward round list" detail={`${n(counts.ward, "patient")}, de-identified`}>
              <Armed label="Clear" onConfirm={actions.clearWard} disabled={!counts.ward} />
            </Item>
            <Item icon={<BookMarked size={16} />} title="Reading list" detail={n(counts.reading, "paper")}>
              <Armed label="Clear" onConfirm={actions.clearReading} disabled={!counts.reading} />
            </Item>
            <Item icon={<Brain size={16} />} title="Memory and custom instructions" detail={n(counts.memory, "memory", "memories")}>
              <button className="cx-btn" onClick={actions.manageMemory}>Manage</button>
            </Item>
            <Item icon={<IdCard size={16} />} title="Profile and letterhead" detail={[counts.profile ? "Profile set" : "No profile", counts.letterhead ? "letterhead set" : "no letterhead"].join(", ")}>
              <button className="cx-btn" onClick={actions.editProfile}>Edit</button>
            </Item>
            <Item icon={<History size={16} />} title="Answer history" detail={n(counts.history, "record")}>
              <button className="cx-btn" onClick={actions.openHistory}>Open</button>
            </Item>
            <Item icon={<Target size={16} />} title="Practice progress" detail={n(counts.practice, "question")}>
              <Armed label="Reset" onConfirm={actions.clearPractice} disabled={!counts.practice} />
            </Item>
            <Item icon={<Building2 size={16} />} title="Institution protocols" detail={n(counts.protocols, "protocol")}>
              <button className="cx-btn" onClick={actions.manageInstitution}>Manage</button>
            </Item>
            <Item icon={<Folder size={16} />} title="Projects" detail={n(counts.projects, "project")} />
          </div>
        </section>

        <div className="cx-pv-side">
          <section className="cx-pv-sec">
            <h2><Send size={16} /> Sent to write an answer</h2>
            <ul className="cx-pv-bul">
              <li>Your message, after the privacy guard, and earlier messages in the same chat</li>
              <li>Files you attach: images, PDFs and text files</li>
              <li>Custom instructions and memory (memory is off in temporary chats)</li>
              <li>Your role, specialty or exam, and your units, formulary and state preferences</li>
              <li>A project's instructions, for chats in that project</li>
              <li>Your institution's protocols that match the question, with its formulary and antibiotic notes (when turned on)</li>
            </ul>
            <p className="cx-pv-note">Sent securely to Cadus's AI service through the Aethex server, only to write the answer you asked for.</p>
          </section>
          <section className="cx-pv-sec">
            <h2><ShieldCheck size={16} /> Never sent</h2>
            <ul className="cx-pv-bul ok">
              <li>Your letterhead and registration number</li>
              <li>Your ward list and patient cases, unless you ask Cadus about a patient</li>
              <li>Your reading list, answer history and practice progress</li>
              <li>Documents, unless you ask Cadus to edit one</li>
              <li>Temporary chats are never stored at all</li>
            </ul>
          </section>
          <section className="cx-pv-sec danger">
            <h2><Archive size={16} /> Delete everything</h2>
            <p className="cx-pv-note">Removes every chat, document, list, setting and record Cadus keeps in this browser. This can't be undone, so export first if you need a copy.</p>
            <Armed label="Delete everything" onConfirm={actions.deleteEverything} />
          </section>
        </div>
      </div>
    </section>
  );
}
