/**
 * The light page header of the store pages (shop, product, cart, wishlist,
 * checkout) and the Study Hub: breadcrumb, title, a line under it, and an
 * optional slot on the right. Styles: src/shop.css (.ax-sh).
 */
import { Fragment, type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function ShopHead({ crumbs, title, sub, right, children, compact = false }: {
  crumbs: Crumb[]; title: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; compact?: boolean;
}) {
  return (
    <section className={`ax-sh${compact ? " compact" : ""}`}>
      <div className="ax-wrap">
        <nav className="ax-crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <ChevronRight size={13} aria-hidden="true" />}
              {c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}
            </Fragment>
          ))}
        </nav>
        <div className="ax-sh-row">
          <div className="ax-sh-text">
            <h1>{title}</h1>
            {sub && <p className="ax-sh-sub">{sub}</p>}
          </div>
          {right && <div className="ax-sh-right">{right}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
