import { type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { HeroScene, type SceneKind } from "@/components/visual/HeroScene";
import { PORTALS, sitePortal } from "@/lib/portals";

/** Update 69: each platform's colour and living background (the same as its home page hero). */
const LOOK: Record<string, { kind: SceneKind | SceneKind[]; rgb: string }> = {
  study: { kind: "molecules", rgb: "167,139,250" },
  doctors: { kind: "pulse", rgb: "56,189,248" },
  hospitals: { kind: ["cross", "pulse"], rgb: "34,211,238" },
  medicalcolleges: { kind: "dna", rgb: "251,191,36" },
  store: { kind: "pulse", rgb: "94,234,212" },
};

interface PageHeroProps {
  tag?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  /** The page body is a narrower centred column (Tailwind max-w-*): line the header up with it. */
  width?: "3xl" | "4xl" | "5xl" | "6xl";
}

/**
 * The header band of the inner pages (tools, study, blog and the rest): deep ink
 * with soft teal and indigo light, a breadcrumb, the page title in the display
 * face, and an optional slot on the right (search, actions) made for a dark
 * background. Styles: src/shop.css (.ax-ph).
 */
export function PageHero({ tag, title, subtitle, icon, right, width }: PageHeroProps) {
  const portal = sitePortal() ?? "study";
  const look = LOOK[portal] ?? LOOK.study!;
  const home = PORTALS[portal as keyof typeof PORTALS]?.name.replace(/^for /, "") ?? "Home";
  return (
    <header className={`ax-ph p-${portal}`}>
      <span className="ax-ph-glow a" aria-hidden="true" />
      <span className="ax-ph-glow b" aria-hidden="true" />
      <HeroScene kind={look.kind} rgb={look.rgb} />
      <div className="ax-wrap ax-ph-in" data-w={width}>
        <nav className="ax-ph-crumbs" aria-label="Breadcrumb">
          <Link href="/">{home}</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page">{tag || title}</span>
        </nav>
        <div className="ax-ph-row">
          <div className="ax-ph-main">
            {icon && <span className="ax-ph-icon" aria-hidden="true">{icon}</span>}
            <div className="ax-ph-text">
              {tag && <p className="ax-ph-tag">{tag}</p>}
              <h1>{title}</h1>
              {subtitle && <p className="ax-ph-sub">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="ax-ph-right">{right}</div>}
        </div>
      </div>
    </header>
  );
}
