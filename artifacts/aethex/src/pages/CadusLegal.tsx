/**
 * Terms of use, privacy policy, medical disclaimer and about: plain, readable
 * pages with a contents rail, the release notes on About, and a product footer.
 */
import { ArrowRight } from "lucide-react";
import CadusMark from "@/components/cadus/CadusMark";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { CADUS_REF_CSS } from "@/components/cadus/cadus-ref-styles";
import { CADUS_WS_CSS } from "@/components/cadus/cadus-ws-styles";
import { CADUS_SIGNIN_CSS } from "@/components/cadus/cadus-signin-styles";
import { CADUS_CLINIC_CSS } from "@/components/cadus/cadus-clinic-styles";
import { CADUS_LOOKS_CSS } from "@/components/cadus/cadus-looks-styles";
import { CADUS_VERSION, LEGAL, LEGAL_PATH, RELEASES, SUPPORT_EMAIL, type LegalKind } from "@/lib/cadus/legal";
import { isCadusHost } from "@/lib/host";

const ORDER: LegalKind[] = ["about", "terms", "privacy", "disclaimer"];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CadusLegal({ kind }: { kind: LegalKind }) {
  const page = LEGAL[kind];
  const cadus = isCadusHost();
  const home = cadus ? "/" : "/ai-assistant";
  const look = (() => { try { const l = JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").look; return ["clinical", "editorial", "mono"].includes(l) ? l : "clinical"; } catch { return "clinical"; } })();
  const dark = (() => { try { return JSON.parse(localStorage.getItem("cadus3.prefs") || "{}").theme === "dark"; } catch { return false; } })();
  return (
    <div className={`cx cx-legal ${dark ? "cx-dark" : "cx-light"} ans-sans`} data-look={look} style={{ ["--fs" as string]: "15.5px" }}>
      <style>{CADUS_CSS + CADUS_REF_CSS + CADUS_WS_CSS + CADUS_SIGNIN_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS + LEGAL_CSS}</style>
      <header className="cx-shared-top">
        <a className="cx-si-brand small" href={home} style={{ display: "flex", marginBottom: 0 }}><CadusMark size={24} /><span>Cadus</span></a>
        <nav className="cx-legal-nav" aria-label="Trust pages">
          {ORDER.map((k) => <a key={k} href={LEGAL_PATH(k, cadus)} aria-current={k === kind ? "page" : undefined} className={k === kind ? "on" : ""}>{LEGAL[k].title.replace("About Cadus", "About")}</a>)}
        </nav>
        <a className="cx-btn primary" href={home}>Open Cadus <ArrowRight size={14} /></a>
      </header>
      <main className="cx-legal-main">
        <aside className="cx-legal-toc" aria-label="Contents">
          <p className="cx-gl"><span>Contents</span></p>
          {page.sections.map((s) => <a key={s.heading} href={`#${slug(s.heading)}`}>{s.heading}</a>)}
          {kind === "about" && <a href="#release-notes">Release notes</a>}
        </aside>
        <article className="cx-legal-doc">
          <h1>{page.title}</h1>
          <p className="cx-legal-lead">{page.lead}</p>
          {page.sections.map((s) => (
            <section key={s.heading} id={slug(s.heading)}>
              <h2>{s.heading}</h2>
              {s.body.map((p, i) => (p.startsWith("- ") ? <ul key={i}><li>{p.slice(2)}</li></ul> : <p key={i}>{p}</p>))}
            </section>
          ))}
          {kind === "about" && (
            <section id="release-notes">
              <h2>Release notes</h2>
              {RELEASES.map((r) => (
                <div key={r.version} className="cx-legal-rel">
                  <h3>Cadus {r.version} <small>{r.date}</small></h3>
                  <ul>{r.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
              ))}
            </section>
          )}
        </article>
      </main>
      <footer className="cx-legal-foot">
        <span>Cadus {CADUS_VERSION} · Clinical AI by Aethex</span>
        <nav aria-label="Legal">{ORDER.map((k) => <a key={k} href={LEGAL_PATH(k, cadus)}>{LEGAL[k].title.replace("About Cadus", "About")}</a>)}<a href={`mailto:${SUPPORT_EMAIL}`}>Support</a></nav>
      </footer>
    </div>
  );
}

const LEGAL_CSS = `
.cx-legal{position:fixed;inset:0;overflow:auto;display:flex;flex-direction:column;background:var(--bg)}
.cx-legal .cx-shared-top{position:sticky;top:0;z-index:5;background:var(--bg)}
.cx-legal-nav{display:flex;gap:2px;margin:0 auto}
.cx-legal-nav a{padding:6px 10px;border-radius:var(--r-sm,6px);font-size:13.5px;font-weight:500;color:var(--t2)}
.cx-legal-nav a:hover{background:var(--hover);color:var(--text)}
.cx-legal-nav a.on{background:var(--s3);color:var(--text);font-weight:600}
.cx-legal-main{flex:1;display:grid;grid-template-columns:200px minmax(0,680px);gap:48px;justify-content:center;width:100%;max-width:1040px;margin:0 auto;padding:40px 24px 64px}
.cx-legal-toc{position:sticky;top:76px;align-self:start;display:flex;flex-direction:column;gap:2px}
.cx-legal-toc .cx-gl{margin-bottom:6px;padding:0 8px;background:none}
.cx-legal-toc a{padding:5px 8px;border-radius:var(--r-sm,6px);font-size:13px;color:var(--t2);line-height:1.35}
.cx-legal-toc a:hover{background:var(--hover);color:var(--text)}
.cx .cx-legal-doc h1{font-size:30px;font-weight:600;letter-spacing:-.02em;margin-bottom:10px}
.cx-legal-lead{font-size:15.5px;line-height:1.6;color:var(--t2);padding-bottom:20px;border-bottom:1px solid var(--line);margin-bottom:8px}
.cx-legal-doc section{padding-top:26px}
.cx .cx-legal-doc h2{font-size:17px;font-weight:600;margin-bottom:8px;scroll-margin-top:80px}
.cx .cx-legal-doc h3{font-size:15px;font-weight:600;margin:16px 0 6px}
.cx-legal-doc h3 small{font-weight:500;color:var(--t3);margin-left:8px;font-size:13px}
.cx-legal-doc p,.cx-legal-doc li{font-size:15px;line-height:1.7;color:var(--text)}
.cx-legal-doc p+p{margin-top:10px}
.cx-legal-doc ul{margin:6px 0 0 18px;padding:0}
.cx-legal-doc li+li{margin-top:4px}
.cx-legal-rel+.cx-legal-rel{margin-top:4px}
.cx-legal-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 20px;padding:18px 24px;border-top:1px solid var(--line);font-size:12.5px;color:var(--t3)}
.cx-legal-foot nav{display:flex;flex-wrap:wrap;gap:14px}
.cx-legal-foot a:hover{color:var(--text);text-decoration:underline}
@media (max-width:860px){
  .cx-legal-main{grid-template-columns:minmax(0,1fr);gap:20px;padding:24px 16px 48px}
  .cx-legal-toc{position:static;flex-direction:row;flex-wrap:wrap;gap:4px}
  .cx-legal-toc .cx-gl{display:none}
  .cx-legal-toc a{border:1px solid var(--line);font-size:12.5px}
  .cx-legal-nav{display:none}
  .cx .cx-legal-doc h1{font-size:24px}
}
`;
