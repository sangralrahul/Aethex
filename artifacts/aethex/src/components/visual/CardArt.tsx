/**
 * Update 70: the background picture of a card, drawn for its category: the category's own illustration, large and
 * faded in the corner, drifting slowly, with a soft glow and a turning orbit in the category's colour. It brightens
 * when the card is hovered. Put it first inside a card that has the class "has-art". Styles: src/shop.css (.cart).
 */
import { cloneElement, isValidElement, type ComponentType, type ReactElement } from "react";
import type { LucideProps } from "lucide-react";

export function CardArt({ icon: Icon, node, color, seed = 0 }: { icon?: ComponentType<LucideProps>; node?: ReactElement; color: string; seed?: number }) {
  const d = `${-((seed * 1.7) % 9).toFixed(1)}s`;
  return (
    <span className="cart" aria-hidden="true" style={{ ["--c" as string]: color, ["--d" as string]: d }}>
      <span className="glow" />
      <svg className="orbit" viewBox="0 0 200 200"><circle cx="100" cy="100" r="78" /><circle cx="100" cy="100" r="58" /><circle className="dot" cx="100" cy="22" r="4" /></svg>
      {Icon ? <Icon className="big" strokeWidth={1.1} /> : isValidElement(node) ? cloneElement(node as ReactElement<{ className?: string; strokeWidth?: number }>, { className: "big", strokeWidth: 1.1 }) : null}
    </span>
  );
}
