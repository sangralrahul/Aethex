/**
 * Comparing products: the "Compare" tick on product cards and pages, and the
 * tray along the bottom of the screen with the picked products (up to three)
 * and the way to /compare. Products only, not books. Styles: src/shop.css
 * (.ax-cmp-tick, .ax-cmp-tray).
 */
import { Link, useLocation } from "wouter";
import { Check, GitCompareArrows, X } from "lucide-react";
import { compare, COMPARE_MAX, useCompareIds } from "@/lib/store/compare";
import { useStore } from "@/lib/store/api";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "./ProductImage";

export function CompareTick({ id, name, label = "Compare" }: { id: number; name: string; label?: string }) {
  const ids = useCompareIds();
  const { toast } = useToast();
  const on = ids.includes(id);
  return (
    <button
      type="button"
      className={`ax-cmp-tick${on ? " on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from compare` : `Compare ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!compare.toggle(id)) toast({ variant: "destructive", title: `You can compare up to ${COMPARE_MAX} products`, description: "Remove one from the tray first." });
      }}
    >
      <span className="box">{on && <Check size={12} strokeWidth={3} />}</span>{label}
    </button>
  );
}

export function CompareTray() {
  const ids = useCompareIds();
  const [, setLocation] = useLocation();
  const { data: store } = useStore(ids.length > 0);
  if (!ids.length) return null;
  const items = ids.map((id) => store?.byId.get(id)).filter(Boolean);
  return (
    <div className="ax-cmp-tray" role="region" aria-label="Products to compare">
      <div className="in">
        <span className="lbl"><GitCompareArrows size={17} /> <span className="w">Compare</span> <em>{ids.length} of {COMPARE_MAX}</em></span>
        <ul>
          {items.map((p) => (
            <li key={p!.id}>
              <Link href={`/products/${p!.slug}`} className="pic" title={p!.name}><ProductImage src={p!.image} width={96} /></Link>
              <button type="button" onClick={() => compare.remove(p!.id)} aria-label={`Remove ${p!.name}`}><X size={12} /></button>
            </li>
          ))}
          {Array.from({ length: COMPARE_MAX - items.length }, (_, i) => <li key={`e${i}`} className="empty" aria-hidden="true" />)}
        </ul>
        <button type="button" className="ax-btn teal" disabled={ids.length < 2} onClick={() => setLocation(`/compare?ids=${ids.join(",")}`)}>{ids.length < 2 ? "Pick one more" : <>Compare<span className="w"> now</span></>}</button>
        <button type="button" className="clr" onClick={() => compare.clear()} aria-label="Clear the products to compare"><X size={16} /></button>
      </div>
    </div>
  );
}
