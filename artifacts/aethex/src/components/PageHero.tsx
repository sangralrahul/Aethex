import { type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface PageHeroProps {
  tag?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}

/**
 * The header band of the inner pages (tools, study, blog and the rest): deep ink
 * with soft teal and indigo light, a breadcrumb, the page title in the display
 * face, and an optional slot on the right (search, actions) made for a dark
 * background. Styles: src/shop.css (.ax-ph).
 */
export function PageHero({ tag, title, subtitle, icon, right }: PageHeroProps) {
  return (
    <header className="ax-ph">
      <span className="ax-ph-glow a" aria-hidden="true" />
      <span className="ax-ph-glow b" aria-hidden="true" />
      <div className="ax-wrap ax-ph-in">
        <nav className="ax-ph-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
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
