/**
 * Renders overlays (sheets, dialogs, bottom bars) straight into the site
 * wrapper (.ax-site), outside <main>. Inner pages' <main> is its own stacking
 * layer, so an overlay left inside it would sit under the sticky header.
 * Inside .ax-site the overlay keeps the site's fonts. Falls back to <body>.
 */
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function TopLayer({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.querySelector(".ax-site") ?? document.body);
}
