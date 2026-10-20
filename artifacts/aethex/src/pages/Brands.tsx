/**
 * The brands we stock (/brands): each verified brand with what it makes and a
 * way into its products. Styles: src/shop.css (.ax-brands).
 */
import { Link } from "wouter";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { ProductImage } from "@/components/store/ProductImage";
import { useSeo } from "@/hooks/use-seo";
import { useStore } from "@/lib/store/api";

export default function Brands() {
  useSeo({ title: "Brands we stock | Aethex Store", description: "OMRON, Dr Trust, Tynor, Accu-Chek, Rossmax, 3M Littmann, MDF Instruments and HEINE: genuine products from verified brands.", path: "/brands" });
  const { data: store } = useStore();
  return (
    <div className="ax-shop-page">
      <ShopHead crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Brands" }]} title="Brands we stock"
        sub="Every product comes from a verified brand, with the brand's own photos, details and warranty." />
      <div className="ax-wrap ax-brands">
        {!store ? Array.from({ length: 8 }, (_, i) => <div key={i} className="ax-brand sk" />) : store.brands.map((b) => {
          const picks = store.products.filter((p) => p.brand === b.slug && p.image).sort((x, y) => Number(y.featured) - Number(x.featured)).slice(0, 3);
          const cats = store.categories.filter((c) => store.products.some((p) => p.brand === b.slug && p.category === c.slug)).slice(0, 4);
          return (
            <Link key={b.slug} href={`/brand/${b.slug}`} className="ax-brand">
              <span className="pics">{picks.map((p) => <span key={p.id}><ProductImage src={p.image} width={200} /></span>)}</span>
              <span className="tx">
                <b><BadgeCheck size={17} /> {b.name}</b>
                <small>{b.about}</small>
                <span className="cats">{cats.map((c) => <em key={c.slug}>{c.name}</em>)}</span>
              </span>
              <span className="go">{b.count} products <ArrowRight size={15} /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
