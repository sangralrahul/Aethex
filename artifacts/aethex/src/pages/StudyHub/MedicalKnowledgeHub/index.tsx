/**
 * The Medical Knowledge Hub (study.aethex.in/study-hub/medical-knowledge-hub): every subject and clinical department,
 * with a search across subjects, topics, departments and conditions. Update 68: Study's hero with the living
 * background, figures counted from the data, line icons instead of emoji, subjects filtered by stage.
 * Styles: src/shop.css (.kh-*).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowRight, BookOpen, ChevronRight, ClipboardCheck, Layers, Network, Search, X } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { CardArt } from "@/components/visual/CardArt";
import { PhotoTiles } from "@/components/layout/MarketTop";
import { medicalSubjects } from "@/data/medicalSubjects";
import { medicalDepartments } from "@/data/medicalDepartments";
import { KhHero, KhIcon, KH_HUB, khIcon } from "@/components/MedKnowledge/KhParts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const STAGES = ["All", "Pre-Clinical", "Para-Clinical", "Clinical"] as const;

export default function MedicalKnowledgeHub() {
  useSeo({ title: "Medical Knowledge Hub: subjects, topics and conditions | Aethex Study", description: "Browse every subject, topic and condition in the Aethex Medical Knowledge Hub, with explanations, diagrams, exam questions and flashcards.", path: KH_HUB });
  // The header's search sends "?q=" here.
  const urlQ = useSearch();
  const [query, setQuery] = useState(() => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("q") ?? "");
  useEffect(() => { const q = new URLSearchParams(urlQ).get("q"); if (q) setQuery(q); }, [urlQ]);
  const [stage, setStage] = useState<(typeof STAGES)[number]>("All");

  const stats = useMemo(() => ({
    subjects: medicalSubjects.length,
    topics: medicalSubjects.reduce((n, s) => n + s.topics.length, 0),
    departments: medicalDepartments.length,
    conditions: medicalDepartments.reduce((n, d) => n + d.conditions.length, 0),
  }), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { label: string; category: string; href: string }[] = [];
    for (const s of medicalSubjects) {
      if (s.name.toLowerCase().includes(q)) out.push({ label: s.name, category: "Subject", href: `${BASE}${KH_HUB}/subjects/${s.slug}` });
      for (const t of s.topics) if (t.name.toLowerCase().includes(q)) out.push({ label: t.name, category: s.name, href: `${BASE}${KH_HUB}/subjects/${s.slug}/${t.slug}` });
    }
    for (const d of medicalDepartments) {
      if (d.name.toLowerCase().includes(q)) out.push({ label: d.name, category: "Department", href: `${BASE}${KH_HUB}/departments/${d.slug}` });
      for (const c of d.conditions) if (c.name.toLowerCase().includes(q)) out.push({ label: c.name, category: d.name, href: `${BASE}${KH_HUB}/departments/${d.slug}/${c.slug}` });
    }
    return out.slice(0, 8);
  }, [query]);

  const toStage = (s: (typeof STAGES)[number]) => { setStage(s); document.getElementById("subjects-section")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const subjects = stage === "All" ? medicalSubjects : medicalSubjects.filter((s) => s.category === stage);

  return (
    <div className="kh-page">
      <KhHero eyebrow={<><BookOpen size={15} /> Medical Knowledge Hub<em>MBBS · NEET-PG · NExT</em></>} title="Every subject. Every condition.">
        <p>A structured medical reference for MBBS, NEET-PG and clinical practice: explanations, diagrams, exam questions and flashcards for each topic and condition.</p>
        <div className="kh-search" role="search">
          <Search size={19} aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subjects, topics, departments, conditions…" aria-label="Search the Knowledge Hub" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear the search"><X size={16} /></button>}
          {results.length > 0 && (
            <div className="kh-drop" role="listbox">
              {results.map((r) => <Link key={r.href} href={r.href}><span>{r.label}</span><em>{r.category}</em><ChevronRight size={15} /></Link>)}
            </div>
          )}
          {query.trim().length >= 2 && results.length === 0 && <div className="kh-drop"><p>Nothing matches “{query.trim()}”.</p></div>}
        </div>
        <dl className="facts">
          <div><dt>{stats.subjects}</dt><dd>subjects</dd></div>
          <div><dt>{stats.topics.toLocaleString("en-IN")}</dt><dd>topics</dd></div>
          <div><dt>{stats.departments}</dt><dd>departments</dd></div>
          <div><dt>{stats.conditions.toLocaleString("en-IN")}</dt><dd>conditions</dd></div>
        </dl>
      </KhHero>

      <PhotoTiles kicker="Start here" title="Study by stage" text="From the dissection hall to the ward."
        tiles={[
          { key: "pre", title: "Pre-clinical", sub: "Anatomy, physiology, biochemistry", bg: "lectureRoom", onClick: () => toStage("Pre-Clinical") },
          { key: "para", title: "Para-clinical", sub: "Pathology, pharmacology, microbiology", bg: "microscopeLab", onClick: () => toStage("Para-Clinical") },
          { key: "clin", title: "Clinical", sub: "Medicine, surgery, OBG, paediatrics", bg: "consultation", onClick: () => toStage("Clinical") },
          { key: "dept", title: "Conditions", sub: "By clinical department", bg: "wardBeds", href: "#departments-section" },
          { key: "mcq", title: "Exam questions", sub: "NEET-PG pattern", bg: "studentBooks", href: "/neet-pg" },
          { key: "cards", title: "Flashcards", sub: "Quick revision", bg: "studentScrubs", href: "/flashcards" },
        ]} />

      <section className="ax-wrap kh-sec" id="subjects-section">
        <div className="kh-sec-h">
          <div className="ax-ihead"><span>Subjects</span><h2>Pre-clinical to clinical</h2><p>Every subject of the MBBS course, broken into topics you can read, practise and revise.</p></div>
          <div className="kh-tabs" role="tablist" aria-label="Stage">
            {STAGES.map((s) => <button key={s} type="button" role="tab" aria-selected={stage === s} className={stage === s ? "on" : ""} onClick={() => setStage(s)}>{s}</button>)}
          </div>
        </div>
        <div className="kh-grid">
          {subjects.map((s) => (
            <Link key={s.id} href={`${BASE}${KH_HUB}/subjects/${s.slug}`} className="kh-card has-art">
              <CardArt icon={khIcon(s.slug)} color={s.color} seed={s.topics.length} />
              <KhIcon slug={s.slug} color={s.color} />
              <b>{s.name}</b>
              <small>{s.topics.length} topics</small>
              <em>{s.category}</em>
              <ArrowRight size={16} className="go" />
            </Link>
          ))}
        </div>
      </section>

      <section className="kh-band" id="departments-section">
        <div className="ax-wrap kh-sec">
          <div className="ax-ihead"><span>Clinical departments</span><h2>Conditions, by specialty</h2><p>Each department lists its conditions with ICD-10 codes and how serious they are; open one for the full reference.</p></div>
          <div className="kh-depts">
            {medicalDepartments.map((d) => (
              <Link key={d.id} href={`${BASE}${KH_HUB}/departments/${d.slug}`} className="kh-dept has-art">
                <CardArt icon={khIcon(d.slug)} color={d.color} seed={d.conditions.length} />
                <KhIcon slug={d.slug} color={d.color} size={20} />
                <span><b>{d.name}</b><small>{d.conditions.length} conditions</small></span>
                <ChevronRight size={16} className="go" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ax-wrap kh-sec">
        <div className="ax-ihead"><span>On every page</span><h2>Read, see, practise, revise</h2></div>
        <div className="kh-feats">
          {[
            { I: BookOpen, t: "A clear explanation", d: "Exam-focused notes for every topic and condition, written with Cadus, the Aethex medical assistant." },
            { I: Network, t: "Labelled diagrams", d: "Anatomy, physiology and pathways drawn as clean, labelled diagrams." },
            { I: ClipboardCheck, t: "Exam questions", d: "NEET-PG and USMLE style questions on each topic, with explanations." },
            { I: Layers, t: "Flashcards", d: "Quick revision cards for each topic and condition." },
          ].map(({ I, t, d }) => <div key={t} className="kh-feat" data-reveal><span className="ic"><I size={20} /></span><b>{t}</b><small>{d}</small></div>)}
        </div>
        <p className="kh-note">For learning and revision. It does not replace clinical judgement, current guidelines or a doctor's advice.</p>
      </section>
    </div>
  );
}
