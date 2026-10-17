/**
 * Clinical safety: how Cadus drafts, checks and sources every answer, how to
 * read its labels, what does and doesn't use AI, and where its limits are,
 * with this device's own numbers from the answer history.
 */
import {
  ArrowRight, BadgeCheck, BookOpenText, Calculator, ClipboardCheck, FileText, History, LockKeyhole, PenLine, ShieldAlert, ShieldCheck, Siren,
} from "lucide-react";
import type { AuditStats } from "@/lib/cadus/audit";
import { EVIDENCE } from "@/lib/cadus/reference";

export default function SafetyView({ stats, reviewOn, onTurnOnReview, calcCount, ixRules, onOpenHistory, onOpenPrivacy }: {
  stats: AuditStats;
  reviewOn: boolean;
  onTurnOnReview: () => void;
  calcCount: number;
  ixRules: number;
  onOpenHistory: () => void;
  onOpenPrivacy: () => void;
}) {
  const steps: { icon: typeof ShieldCheck; title: string; text: string }[] = [
    { icon: LockKeyhole, title: "Privacy guard", text: "Names, phone numbers, Aadhaar and ABHA numbers, UHIDs and other identifiers are replaced with placeholders before your question leaves this device." },
    { icon: PenLine, title: "Draft", text: "Cadus Medius 3.1, or Magnus 3.6 if you choose it, writes to the Cadus clinical standards: current guidelines with Indian practice first, every dose with units, route and maximum, red flags and when to refer." },
    { icon: ShieldCheck, title: "Safety review", text: "Cadus Magnus 3.6 audits the draft as a senior physician and clinical pharmacologist would: doses and units, interactions, contraindications, red flags, reasoning and invented facts. It corrects errors before you see the answer." },
    { icon: ClipboardCheck, title: "What you see", text: "The reviewed answer with its confidence, the corrections made, the sources it cites, labels for the certainty of the evidence and dose cards for drugs." },
  ];
  return (
    <section className="cx-page cx-safe-pg">
      <header className="cx-page-h">
        <div>
          <h1>Clinical safety</h1>
          <p>How Cadus drafts, checks and sources every answer, how to read what it shows you, and where its limits are.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn" onClick={onOpenHistory}><History size={15} /> Answer history</button>
        </div>
      </header>

      <div className="cx-sf-stats" aria-label="On this device">
        <div><small>Answers on this device</small><b>{stats.answers.toLocaleString("en-IN")}</b></div>
        <div><small>Safety-reviewed</small><b>{stats.answers ? `${stats.reviewedPct}%` : "–"}</b></div>
        <div><small>Corrected before you saw them</small><b>{stats.corrected.toLocaleString("en-IN")}</b></div>
        <div><small>Identifiers hidden</small><b>{stats.hidden.toLocaleString("en-IN")}</b></div>
      </div>
      {!reviewOn && (
        <div className="cx-sf-off" role="alert">
          <ShieldAlert size={16} />
          <span>The safety review is off, so answers reach you as drafts. Turn it on for clinical use.</span>
          <button className="cx-btn primary" onClick={onTurnOnReview}>Turn on the review</button>
        </div>
      )}

      <section className="cx-sf-sec">
        <h2>How an answer is made</h2>
        <ol className="cx-sf-steps">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="cx-sf-n">{i + 1}</span>
              <span className="cx-sf-ic"><s.icon size={17} /></span>
              <b>{s.title}</b>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="cx-sf-sec">
        <h2>Reading an answer</h2>
        <div className="cx-sf-legend">
          <div>
            <span className="cx-rv"><ShieldCheck size={13} /> Safety-reviewed · 1 correction</span>
            <p>The review checked the answer and lists every change it made under “Safety review details”.</p>
          </div>
          <div>
            <span className="cx-sf-chips"><span className="cx-conf high">High confidence</span><span className="cx-conf moderate">Moderate</span><span className="cx-conf low">Low</span></span>
            <p>High: established standard of care and enough detail. Moderate: some uncertainty or missing details. Low: weak evidence or not enough information to answer safely.</p>
          </div>
          <div>
            <span className="cx-sf-chips">{(["high", "moderate", "low", "expert"] as const).map((l) => <span key={l} className={`md-ev md-ev-${l}`}>{EVIDENCE[l].label}</span>)}</span>
            <p>On key recommendations: how certain the evidence behind them is, from consistent trials and guidelines down to expert opinion.</p>
          </div>
          <div>
            <span className="cx-sf-chips"><span className="cx-sf-dose">Dose card</span><sup className="cx-sf-cite">1</sup></span>
            <p>Dose cards set out dose, route, frequency, maximum and adjustments for each drug. Numbered badges link to the sources an answer cites.</p>
          </div>
        </div>
      </section>

      <section className="cx-sf-sec cx-sf-two">
        <div>
          <h2>Built without AI</h2>
          <ul className="cx-sf-list">
            <li><Calculator size={15} /> {calcCount} clinical calculators, lab trend charts and sample-size formulas, computed from published formulas in your browser.</li>
            <li><BadgeCheck size={15} /> The interaction checker: {ixRules} high-risk interaction rules from standard references.</li>
            <li><BookOpenText size={15} /> PubMed search results, with their PMIDs and DOIs, straight from the National Library of Medicine.</li>
          </ul>
        </div>
        <div>
          <h2>Written by AI, then checked</h2>
          <ul className="cx-sf-list">
            <li><ShieldCheck size={15} /> Answers, differentials, dose calculations and evidence summaries.</li>
            <li><FileText size={15} /> Notes, letters, certificates and prescriptions: drafts for you to check, sign and stamp.</li>
            <li><PenLine size={15} /> Lecture decks are fact-checked slide by slide; viva and OSCE practice is not reviewed.</li>
          </ul>
        </div>
      </section>

      <section className="cx-sf-sec">
        <h2>Limits</h2>
        <ul className="cx-sf-limits">
          <li>Cadus is clinical decision support for qualified professionals and students. It is not a certified medical device and does not replace examination, investigations, local protocols or your judgement.</li>
          <li>The safety review catches most errors but cannot guarantee there are none. Confirm doses and decisions against current guidelines, the National Formulary of India or the product label.</li>
          <li>If the AI is unavailable, Cadus answers from its offline medical library and labels those answers; they are not safety-reviewed.</li>
          <li>Evidence summaries are written from PubMed abstracts only. Read the full paper before changing practice.</li>
        </ul>
        <p className="cx-sf-sos"><Siren size={16} /> For a patient in danger, call 112, or 108 for an ambulance, before anything else.</p>
      </section>

      <section className="cx-sf-sec cx-sf-data">
        <div>
          <h2>Your data</h2>
          <p>Chats, documents, your ward list, reading list and letterhead stay in this browser. Only what you ask, after the privacy guard, is sent to the AI to write an answer.</p>
        </div>
        <button className="cx-btn" onClick={onOpenPrivacy}>Privacy centre <ArrowRight size={14} /></button>
      </section>
    </section>
  );
}
