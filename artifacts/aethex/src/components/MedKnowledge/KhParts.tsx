/**
 * Update 68: the Knowledge Hub's own look. Line icons for every subject and department (in place of emoji), and the
 * hero shared by the hub, subject, department, topic and condition pages: Study's violet, with the living
 * background (HeroScene). Styles: src/shop.css (.kh-*).
 */
import type { ComponentType, ReactNode } from "react";
import { Link } from "wouter";
import {
  Activity, Baby, Bone, Brain, Bug, ChevronRight, Droplet, Droplets, Ear, Eye, FlaskConical, Hand, HeartPulse, Microscope, Pill, ScanLine,
  Scale, Scissors, ShieldPlus, Siren, Soup, Sparkles, Stethoscope, Syringe, Users, Wind, type LucideProps,
} from "lucide-react";
import { HeroScene } from "@/components/visual/HeroScene";

const RULES: [RegExp, ComponentType<LucideProps>][] = [
  [/cardio|heart/, HeartPulse], [/neuro|psychiat|mental/, Brain], [/ortho|anatomy|skelet/, Bone], [/ophthal|eye/, Eye], [/^ent(-|$)|otorhino/, Ear],
  [/pulmo|respir/, Wind], [/gastro|hepat/, Soup], [/nephro|uro/, Droplets], [/hemat|blood/, Droplet], [/endocrin|physiolog/, Activity],
  [/onco|patholog/, Microscope], [/infect|microbio/, Bug], [/rheumat|dermat/, Hand], [/immun/, ShieldPlus], [/obstet|gyn|pediat|paediat/, Baby],
  [/anesth|anaesth/, Syringe], [/emergency|trauma/, Siren], [/geriat|community/, Users], [/pharmac/, Pill], [/biochem/, FlaskConical],
  [/radiolog|imaging/, ScanLine], [/forensic/, Scale], [/surgery/, Scissors], [/medicine/, Stethoscope],
];

export function khIcon(slug: string): ComponentType<LucideProps> {
  for (const [re, I] of RULES) if (re.test(slug)) return I;
  return Sparkles;
}

/** A coloured icon tile. */
export function KhIcon({ slug, color, size = 22 }: { slug: string; color: string; size?: number }) {
  const I = khIcon(slug);
  return <span className="kh-ic" style={{ color, background: `${color}14`, borderColor: `${color}33` }}><I size={size} /></span>;
}

const HUB = "/study-hub/medical-knowledge-hub";

export function KhHero({ crumbs, eyebrow, title, children, compact = false, width }: {
  crumbs?: { label: string; href?: string }[]; eyebrow?: ReactNode; title: ReactNode; children?: ReactNode; compact?: boolean;
  /** Line the hero up with a page whose content is narrower than the site width. */
  width?: "w6" | "w5";
}) {
  return (
    <section className={`ax-ihero kh-hero${compact ? " compact" : ""}${width ? ` ${width}` : ""}`}>
      <div className="ax-ihero-bg" aria-hidden="true"><i /><i /><i /><HeroScene kind={compact ? "molecules" : ["molecules", "dna"]} rgb="167,139,250" ghosts={compact ? [] : ["neuro-kit", "stethoscope"]} /></div>
      <div className="ax-wrap kh-hero-in">
        {crumbs && (
          <nav className="kh-crumbs" aria-label="Breadcrumb">
            <Link href="/study-hub">Study Hub</Link>
            {crumbs.map((c) => <span key={c.label}><ChevronRight size={13} />{c.href ? <Link href={c.href}>{c.label}</Link> : <b aria-current="page">{c.label}</b>}</span>)}
          </nav>
        )}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}

export { HUB as KH_HUB };
