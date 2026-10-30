/**
 * Update 71: the top of every platform's home page, in the marketplace layout the Store uses: a title strip with the
 * page's own search or actions, then departments on the left, a rotating banner in the middle and two promo tiles on
 * the right, then a strip of promises. Built on the Store's ec-* styles (src/site-ec.css), coloured per platform by
 * .mk-<portal> (src/shop.css).
 */
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, type LucideProps } from "lucide-react";
import { HeroScene, type SceneKind } from "@/components/visual/HeroScene";
import { hideBroken, ph, type PhotoKey } from "@/config/photos";

type Icon = ComponentType<LucideProps>;
export interface MkAction { label: string; href?: string; onClick?: () => void }
export interface MkDept { label: string; icon: Icon; href?: string; onClick?: () => void; key?: string }
/** bg: a photograph (src/config/photos.ts) filling the whole banner; the product picture is then left out. */
export interface MkSlide { kicker: string; title: string; text: string; cta: MkAction; second?: MkAction; tone: string; photo?: string; bg?: PhotoKey; icon: Icon }
export interface MkPromo { kicker: string; title: string; text: string; href: string; icon: Icon; dark?: boolean; bg?: PhotoKey; onClick?: () => void }
export interface MkTile { title: string; sub?: string; bg: PhotoKey; href?: string; onClick?: () => void; key?: string }
export interface MkTrust { icon: Icon; t: string; d: string }

const IMG = (n: string) => `${import.meta.env.BASE_URL}product-images/${n}.jpg`;
const still = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Act({ a, className, tab }: { a: MkAction; className: string; tab?: number }) {
  if (a.onClick) return <button type="button" className={className} onClick={a.onClick} tabIndex={tab}>{a.label} <ArrowRight size={16} /></button>;
  const href = a.href ?? "/";
  return href.includes("#") ? <a href={href} className={className} tabIndex={tab}>{a.label} <ArrowRight size={16} /></a> : <Link href={href} className={className} tabIndex={tab}>{a.label} <ArrowRight size={16} /></Link>;
}

function Slider({ slides, scene, rgb }: { slides: MkSlide[]; scene: SceneKind | SceneKind[]; rgb: string }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (still() || hold || slides.length < 2) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % slides.length), 6500);
    return () => window.clearInterval(t);
  }, [hold, slides.length]);
  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);
  return (
    <div className="ec-ban mk-ban" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} aria-roledescription="carousel" data-mk="banners">
      <div className="ec-ban-scene" aria-hidden="true"><HeroScene kind={scene} rgb={rgb} /></div>
      {slides.map((b, k) => {
        const I = b.icon;
        return (
          <div key={b.title} className={`ec-slide ${b.tone}${b.bg ? " has-bg" : ""}${k === i ? " on" : ""}`} aria-hidden={k !== i}>
            {b.bg && <img className="mk-bg" onError={hideBroken} src={ph(b.bg, 1400)} srcSet={`${ph(b.bg, 800)} 800w, ${ph(b.bg, 1400)} 1400w, ${ph(b.bg, 2000)} 2000w`} sizes="(max-width: 900px) 100vw, 60vw" alt="" loading={k === 0 ? "eager" : "lazy"} decoding="async" />}
            <div className="txt">
              <small>{b.kicker}</small>
              <h2>{b.title}</h2>
              <p>{b.text}</p>
              <div className="row">
                <Act a={b.cta} className="ec-btn" tab={k === i ? 0 : -1} />
                {b.second && <Act a={b.second} className="ec-btn ghost" tab={k === i ? 0 : -1} />}
              </div>
            </div>
            {!b.bg && <div className={`pic${b.photo ? "" : " ico"}`}>{b.photo ? <img src={IMG(b.photo)} alt="" loading={k === 0 ? "eager" : "lazy"} decoding="async" /> : <span><I strokeWidth={1.2} /></span>}</div>}
          </div>
        );
      })}
      {slides.length > 1 && <>
        <button type="button" className="ec-ban-arrow l" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft size={20} /></button>
        <button type="button" className="ec-ban-arrow r" onClick={() => go(1)} aria-label="Next"><ChevronRight size={20} /></button>
        <div className="ec-ban-dots">{slides.map((b, k) => <button key={b.title} type="button" className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Banner ${k + 1}`} />)}</div>
      </>}
    </div>
  );
}

export function MarketTop({ portal, title, sub, right, deptTitle = "Departments", depts, all, slides, promos, trust, scene, rgb }: {
  portal: string; title: ReactNode; sub?: ReactNode; right?: ReactNode;
  deptTitle?: string; depts: MkDept[]; all?: MkAction;
  slides: MkSlide[]; promos: MkPromo[]; trust: MkTrust[];
  scene: SceneKind | SceneKind[]; rgb: string;
}) {
  return (
    <section className={`mk mk-${portal}`} data-mk={portal}>
      <div className="ax-wrap mk-strip">
        <div className="mk-title"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
        {right && <div className="mk-right">{right}</div>}
      </div>
      <div className="ax-wrap ec-hero-grid">
        <aside className="ec-depts" aria-label={deptTitle}>
          <b>{deptTitle}</b>
          {depts.map((d) => {
            const I = d.icon;
            const inner = <><I size={17} /> <span>{d.label}</span><ChevronRight size={14} className="ch" /></>;
            return d.onClick ? <button key={d.key ?? d.label} type="button" onClick={d.onClick} data-mk-dept={d.key}>{inner}</button> : <Link key={d.key ?? d.label} href={d.href ?? "/"}>{inner}</Link>;
          })}
          {all && (all.onClick ? <button type="button" className="all" onClick={all.onClick}>{all.label} <ArrowRight size={14} /></button> : <Link href={all.href ?? "/"} className="all">{all.label} <ArrowRight size={14} /></Link>)}
        </aside>
        <Slider slides={slides} scene={scene} rgb={rgb} />
        <div className="ec-promos">
          {promos.map((p) => {
            const I = p.icon;
            const body = <>{p.bg && <img className="mk-bg" onError={hideBroken} src={ph(p.bg, 640)} alt="" loading="lazy" decoding="async" />}<small>{p.kicker}</small><b>{p.title}</b><span>{p.text} <ArrowRight size={14} /></span>{!p.bg && <I className="art" size={60} strokeWidth={1.3} />}</>;
            const cls = `ec-promo mk-promo${p.dark ? " dark" : ""}${p.bg ? " has-bg" : ""}`;
            if (p.onClick) return <button key={p.title} type="button" className={cls} onClick={p.onClick}>{body}</button>;
            return p.href.includes("#") ? <a key={p.title} href={p.href} className={cls}>{body}</a> : <Link key={p.title} href={p.href} className={cls}>{body}</Link>;
          })}
        </div>
      </div>
      <div className="ec-services mk-trust">
        <div className="ax-wrap"><ul>{trust.map(({ icon: I, t, d }) => <li key={t}><span className="ic"><I size={22} /></span><span><b>{t}</b><small>{d}</small></span></li>)}</ul></div>
      </div>
    </section>
  );
}

/**
 * Update 74: a row of photo tiles, the way Practo shows "consult by concern" and Amazon its departments: a
 * photograph, a dark fade and the title on it. Styles: src/shop.css (.mk-tiles).
 */
export function PhotoTiles({ id, kicker, title, text, tiles, more }: { id?: string; kicker: string; title: string; text?: string; tiles: MkTile[]; more?: MkAction }) {
  return (
    <section className="ax-wrap mk-tiles" id={id} data-mk="tiles">
      <div className="mk-tiles-h">
        <div className="ax-ihead"><span>{kicker}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>
        {more && <Act a={more} className="mk-more" />}
      </div>
      <div className="mk-tiles-g">
        {tiles.map((t) => {
          const inner = <><img onError={hideBroken} src={ph(t.bg, 520, 360)} alt="" loading="lazy" decoding="async" /><span className="cap"><b>{t.title}</b>{t.sub && <small>{t.sub}</small>}</span><ArrowRight size={16} className="go" /></>;
          if (t.onClick) return <button key={t.key ?? t.title} type="button" className="mk-tile" onClick={t.onClick} data-mk-tile={t.key}>{inner}</button>;
          const href = t.href ?? "/";
          return href.includes("#") || /^https?:/.test(href) ? <a key={t.key ?? t.title} href={href} className="mk-tile" data-mk-tile={t.key}>{inner}</a> : <Link key={t.key ?? t.title} href={href} className="mk-tile" data-mk-tile={t.key}>{inner}</Link>;
        })}
      </div>
    </section>
  );
}
