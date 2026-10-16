/**
 * Styles for the Cadus workspace (src/pages/CadusAI.tsx). Scoped under `.cx`.
 * A calm, professional finish in the Aethex palette: white and cool grey
 * surfaces, Aethex navy ink and Aethex teal for highlights. Fonts are
 * self-hosted from /public/fonts/cadus (SIL Open Font License, see the .txt files there):
 *   Cadus UI    = Plus Jakarta Sans (interface and answers, the aethex.in font)
 *   Cadus Serif = Newsreader (optional serif answers, Settings > Personalisation)
 *   Cadus Sans  = Inter (fallback)
 */
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const GREEK = "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF";

function face(family: string, file: string, style: "normal" | "italic", weight: string, range: string): string {
  const url = `/fonts/cadus/${file}.woff2`;
  return `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:swap;src:url(${url}) format("woff2-variations"),url(${url}) format("woff2");unicode-range:${range}}`;
}

const FONT_FACES = [
  face("Cadus UI", "plus-jakarta-sans-latin-wght-normal", "normal", "200 800", LATIN),
  face("Cadus UI", "plus-jakarta-sans-latin-ext-wght-normal", "normal", "200 800", LATIN_EXT),
  face("Cadus UI", "plus-jakarta-sans-latin-wght-italic", "italic", "200 800", LATIN),
  face("Cadus UI", "plus-jakarta-sans-latin-ext-wght-italic", "italic", "200 800", LATIN_EXT),
  face("Cadus Sans", "inter-latin-opsz-normal", "normal", "100 900", LATIN),
  face("Cadus Sans", "inter-latin-ext-opsz-normal", "normal", "100 900", LATIN_EXT),
  face("Cadus Sans", "inter-greek-opsz-normal", "normal", "100 900", GREEK),
  face("Cadus Sans", "inter-latin-opsz-italic", "italic", "100 900", LATIN),
  face("Cadus Sans", "inter-latin-ext-opsz-italic", "italic", "100 900", LATIN_EXT),
  face("Cadus Serif", "newsreader-latin-opsz-normal", "normal", "200 800", LATIN),
  face("Cadus Serif", "newsreader-latin-ext-opsz-normal", "normal", "200 800", LATIN_EXT),
  face("Cadus Serif", "newsreader-latin-opsz-italic", "italic", "200 800", LATIN),
  face("Cadus Serif", "newsreader-latin-ext-opsz-italic", "italic", "200 800", LATIN_EXT),
].join("\n");

export const CADUS_CSS = `
${FONT_FACES}

/* ================================================================ tokens */
.cx{
  --sans:"Cadus UI","Plus Jakarta Sans","Cadus Sans",Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --display:var(--sans);
  --serif:"Cadus Serif",Newsreader,Georgia,"Times New Roman",serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  /* dark: midnight, the navy of the aethex.in hero */
  --bg:#0B1220;--side:#080E1A;--surface:#111A2B;--s2:#16223A;--s3:#1F2C45;--hover:rgba(242,239,232,.05);
  --line:#1A2539;--line2:#27344D;--text:#F2EFE8;--t2:#B8C0CE;--t3:#8590A6;
  --primary:#F2EFE8;--primary-ink:#0B1220;--on-acc:#04211C;--user:#16223A;--code:#0E1626;
  --sh1:0 1px 2px rgba(0,0,0,.45);--sh2:0 1px 3px rgba(0,0,0,.35),0 12px 30px -12px rgba(0,0,0,.65);
  --sh3:0 28px 72px -20px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.04);
  --grid:rgba(255,255,255,.035);--ans:#E4E7ED;
  --danger:#F87171;--ok:#34D399;--warn:#FBBF24;
  --acc-soft:color-mix(in srgb,var(--acc) 12%,transparent);--acc-line:color-mix(in srgb,var(--acc) 40%,var(--line2));
  position:fixed;inset:0;z-index:40;display:flex;overflow:hidden;background:var(--bg);color:var(--text);color-scheme:dark;
  font-family:var(--sans);font-size:14px;line-height:1.5;
  font-feature-settings:"cv05","cv08";-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
/* light: white and cool grey (the default) */
.cx-light{
  --bg:#FFFFFF;--side:#F7F8FA;--surface:#FFFFFF;--s2:#F3F4F7;--s3:#E9EBF0;--hover:rgba(15,23,41,.045);
  --line:#E6E8EE;--line2:#D8DCE4;--text:#0F1729;--t2:#4A5264;--t3:#667085;
  --primary:#0F1729;--primary-ink:#FFFFFF;--on-acc:#FFFFFF;--user:#F2F4F7;--code:#F7F8FA;
  --sh1:0 1px 2px rgba(15,23,41,.06);--sh2:0 1px 2px rgba(15,23,41,.04),0 10px 30px -12px rgba(15,23,41,.16);
  --sh3:0 24px 64px -16px rgba(15,23,41,.28),0 0 0 1px rgba(15,23,41,.05);
  --grid:rgba(15,23,41,.05);--ans:#1A2233;
  --danger:#DC2626;--ok:#059669;--warn:#B45309;
  color-scheme:light;
}

/* ================================================================ resets (zero specificity) */
.cx *{box-sizing:border-box}
:where(.cx) :where(h1,h2,h3,h4,p,figure){margin:0}
:where(.cx) :where(h1,h2,h3,h4){color:inherit;-webkit-text-fill-color:currentColor;background:none;font-family:inherit;letter-spacing:normal;font-weight:600}
:where(.cx) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit}
:where(.cx) button:disabled{cursor:default;opacity:.4}
:where(.cx) a{color:inherit;text-decoration:none}
:where(.cx) :where(input,textarea,select){font:inherit;color:var(--text);background:transparent;border:0;border-radius:0;transition:none;box-shadow:none;outline:0}
:where(.cx) :where(input,textarea)::placeholder{color:var(--t3);opacity:1}
:where(.cx) kbd{font:500 10.5px/1 var(--sans);color:var(--t3);padding:3px 5px;border:1px solid var(--line2);border-radius:5px;background:var(--surface)}
.cx :focus-visible{outline:2px solid var(--acc);outline-offset:2px;border-radius:8px}
.cx textarea:focus-visible,.cx input:focus-visible{outline:none}
.cx ::-webkit-scrollbar{width:10px;height:10px}
.cx ::-webkit-scrollbar-thumb{background:var(--s3);border-radius:10px;border:3px solid transparent;background-clip:content-box}
.cx ::-webkit-scrollbar-track{background:transparent}
.cx-m{display:none!important}
.cx .lucide{stroke-width:1.75px}

/* ================================================================ shared bits */
.cx-ib{width:34px;height:34px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;color:var(--t2);transition:background .12s,color .12s}
.cx-ib:hover,.cx-ib.open{background:var(--hover);color:var(--text)}
.cx-pop{position:absolute;z-index:80;min-width:220px;padding:6px;background:var(--surface);border:1px solid var(--line2);border-radius:14px;box-shadow:var(--sh3);animation:cxPop .14s ease-out}
.cx-pop-i{display:flex;align-items:center;gap:10px;width:100%;min-height:36px;padding:7px 10px;border-radius:9px;font-size:13.5px;color:var(--text);transition:background .1s}
.cx-pop-i:hover{background:var(--hover)}
.cx-pop-i svg{flex-shrink:0;color:var(--t2)}
.cx-pop-i.danger,.cx-pop-i.danger svg{color:var(--danger)}
.cx-pop-i .r{margin-left:auto;color:var(--t3);font-size:12px}
.cx-pop-sep{height:1px;margin:6px 4px;background:var(--line)}
.cx-pop-gl{padding:8px 10px 4px;font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-badge{display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:999px;background:var(--s2);color:var(--t2);font-size:11px;font-weight:550;white-space:nowrap}
.cx-tip{position:relative}
@media (hover:hover){.cx-tip:hover::after{content:attr(data-tip);position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);z-index:90;padding:5px 8px;border-radius:7px;background:var(--primary);color:var(--primary-ink);font-size:11.5px;font-weight:500;line-height:1.2;white-space:nowrap;pointer-events:none;animation:cxFade .12s ease-out}}
.cx-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 16px;background:rgba(5,7,10,.62);backdrop-filter:blur(3px);animation:cxFade .14s ease-out}
.cx-light .cx-overlay{background:rgba(15,23,42,.36)}
.cx-overlay.center{align-items:center;padding-top:16px}
.cx-toast{position:fixed;left:50%;bottom:28px;z-index:120;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;background:var(--primary);color:var(--primary-ink);font-size:13px;font-weight:500;box-shadow:var(--sh3);animation:cxToast .2s ease-out}

/* ================================================================ sidebar */
.cx-side{position:relative;z-index:30;width:272px;flex-shrink:0;display:flex;flex-direction:column;min-height:0;background:var(--side);border-right:1px solid var(--line);transition:width .2s ease}
.cx-side-head{height:56px;flex-shrink:0;display:flex;align-items:center;gap:6px;padding:0 10px 0 14px}
.cx-brand{flex:1;min-width:0;display:flex;align-items:center;gap:10px;height:36px;border-radius:9px}
.cx-wm{font-size:18px;font-weight:650;letter-spacing:-.035em;white-space:nowrap}
.cx-nav{display:flex;flex-direction:column;gap:1px;padding:2px 8px 6px}
.cx-nav-i{position:relative;display:flex;align-items:center;gap:11px;width:100%;height:36px;padding:0 10px;border-radius:9px;color:var(--t2);font-size:13.5px;font-weight:500;white-space:nowrap;text-align:left;transition:background .12s,color .12s}
.cx-nav-i:hover{background:var(--hover);color:var(--text)}
.cx-nav-i.on{background:var(--s3);color:var(--text)}
.cx-nav-i svg{flex-shrink:0}
.cx-nav-l{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.cx-nav-i kbd{opacity:0;transition:opacity .12s}
.cx-nav-i:hover kbd{opacity:1}
.cx-nav-i em{font-style:normal;min-width:20px;height:18px;padding:0 6px;border-radius:999px;background:var(--s3);color:var(--t2);font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.cx-nav-i.on em{background:var(--surface)}
.cx-chev{color:var(--t3);transition:transform .16s}
.cx-nav-i.open .cx-chev{transform:rotate(180deg)}
.cx-new{margin-bottom:4px;color:var(--text);font-weight:600}
.cx-new-ic{width:24px;height:24px;margin:0 -3.5px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--acc);color:var(--on-acc);transition:transform .18s}
.cx-new:hover .cx-new-ic{transform:rotate(90deg)}
.cx-more{display:flex;flex-direction:column;gap:1px;margin:1px 0 3px 19px;padding-left:9px;border-left:1px solid var(--line2);animation:cxFade .14s ease-out}
.cx-hist{flex:1;min-height:0;overflow-y:auto;padding:0 8px 12px}
.cx-sec{padding-top:8px}
.cx-gl{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:2px;height:32px;padding:0 4px 0 12px;background:var(--side);font-size:12px;font-weight:600;color:var(--t3)}
.cx-gl>span{flex:1}
.cx-gl-b{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;color:var(--t3);transition:background .12s,color .12s}
.cx-gl-b:hover,.cx-gl-b.open{background:var(--hover);color:var(--text)}
.cx-gl-b.on{color:var(--acc)}
.cx-rel{position:relative}
.cx-filter-menu{top:calc(100% + 4px);right:0;width:214px}
.cx-side-search{display:flex;align-items:center;gap:8px;height:34px;margin:0 2px 6px;padding:0 6px 0 10px;border:1px solid var(--line2);border-radius:9px;background:var(--surface);color:var(--t3)}
.cx-side-search:focus-within{border-color:var(--acc-line)}
.cx-side-search input{flex:1;min-width:0;height:100%;font-size:13px}
.cx-side-search button{width:22px;height:22px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px}
.cx-side-search button:hover{background:var(--hover);color:var(--text)}
.cx-filter-chip{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 2px 6px;padding:5px 5px 5px 10px;border-radius:9px;background:var(--acc-soft);color:var(--acc);font-size:12px;font-weight:550}
.cx-filter-chip button{height:22px;padding:0 8px;border-radius:6px;font-size:11.5px;font-weight:600}
.cx-filter-chip button:hover{background:color-mix(in srgb,var(--acc) 18%,transparent)}
.cx-hist-empty{margin:4px 2px;padding:14px;border:1px dashed var(--line2);border-radius:12px;font-size:12.5px;line-height:1.55;color:var(--t3)}
.cx-hist-none{padding:6px 12px;font-size:12.5px;color:var(--t3)}
.cx-row{position:relative;display:flex;align-items:center;gap:11px;height:34px;padding:0 8px 0 13px;border-radius:9px;color:var(--t2);cursor:pointer;transition:background .1s,color .1s}
.cx-row:hover{background:var(--hover);color:var(--text)}
.cx-row.on{background:var(--s3);color:var(--text)}
.cx-ring{width:8px;height:8px;flex-shrink:0;border:1.5px solid currentColor;border-radius:50%;opacity:.5;transition:opacity .12s,background .12s,border-color .12s}
.cx-row:hover .cx-ring{opacity:.9}
.cx-row.on .cx-ring{opacity:1;border-color:var(--acc);background:var(--acc)}
.cx-ring.busy{width:10px;height:10px;margin:0 -1px;opacity:1;border:2px solid var(--s3);border-top-color:var(--acc);background:none!important;animation:cxSpin .8s linear infinite}
.cx-row-t{flex:1;min-width:0;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-row-more{position:absolute;top:4px;right:4px;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;color:var(--t3);opacity:0;transition:opacity .1s}
.cx-row:hover .cx-row-more,.cx-row.on .cx-row-more,.cx-row-more.open,.cx-row-more:focus-visible{opacity:1}
.cx-row:hover .cx-row-t,.cx-row.on .cx-row-t,.cx-row:has(.cx-row-more.open) .cx-row-t,.cx-row:focus-within .cx-row-t{padding-right:24px}
.cx-row-more:hover{background:var(--hover);color:var(--text)}
.cx-row input{flex:1;min-width:0;height:26px;padding:0 8px;border:1px solid var(--acc)!important;border-radius:7px!important;background:var(--surface)!important;font-size:13.5px}
.cx-row-menu{overflow-y:auto}
.cx-side-foot{position:relative;flex-shrink:0;display:flex;align-items:center;gap:2px;padding:8px 8px 10px;border-top:1px solid var(--line)}
.cx-acct-wrap{position:relative;flex:1;min-width:0}
.cx-acct{display:flex;align-items:center;gap:10px;width:100%;padding:6px 8px;border-radius:11px;text-align:left;transition:background .12s}
.cx-acct:hover,.cx-acct.open{background:var(--hover)}
.cx-av{width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--acc);color:var(--on-acc);font-size:13px;font-weight:650}
.cx-av.guest{background:var(--s3);color:var(--t2);text-shadow:none}
.cx-acct-t{flex:1;min-width:0;line-height:1.25}
.cx-acct-t b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-acct-t small{display:block;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-acct>svg{flex-shrink:0;color:var(--t3)}
.cx-acct-menu{left:0;bottom:calc(100% + 8px);width:268px}
.cx-acct-head{display:flex;align-items:center;gap:10px;padding:8px 10px 10px}
.cx-acct-head b{display:block;font-size:13.5px;font-weight:600}
.cx-acct-head small{display:block;font-size:12px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-plan{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:5px;background:var(--acc-soft);color:var(--acc);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.cx-usage{margin:0 4px 6px;padding:10px 11px 11px;border-radius:10px;background:var(--s2)}
.cx-usage-top{display:flex;justify-content:space-between;font-size:12px;color:var(--t3)}
.cx-usage-top b{color:var(--t2);font-weight:600}
.cx-usage-bar{height:4px;margin-top:8px;border-radius:4px;background:var(--s3);overflow:hidden}
.cx-usage-bar i{display:block;height:100%;border-radius:4px;background:var(--acc)}
.cx-theme-seg{display:flex;gap:2px;margin:2px 4px 4px;padding:3px;border-radius:10px;background:var(--s2)}
.cx-theme-seg button{flex:1;height:28px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;font-size:12px;font-weight:500;color:var(--t2)}
.cx-theme-seg button.on{background:var(--surface);color:var(--text);box-shadow:var(--sh1)}
.cx-apps-wrap{flex-shrink:0}
.cx-apps-menu{left:8px;right:8px;bottom:calc(100% + 4px);min-width:0;padding:8px}
.cx-apps-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;padding:2px 0 4px}
.cx-app{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 4px 10px;border-radius:12px;font-size:12px;font-weight:500;line-height:1.25;color:var(--t2);text-align:center;transition:background .12s,color .12s}
.cx-app:hover{background:var(--hover);color:var(--text)}
.cx-app-ic{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line2);border-radius:13px;background:var(--s2);color:var(--text);transition:all .14s}
.cx-app:hover .cx-app-ic{border-color:var(--acc-line);background:var(--acc-soft);color:var(--acc)}
.cx-apps-foot{display:flex;align-items:center;gap:8px;margin-top:4px;padding:10px 8px 2px;border-top:1px solid var(--line);font-size:12px;color:var(--t3);transition:color .12s}
.cx-apps-foot:hover{color:var(--text)}

/* collapsed rail (desktop) */
.cx.is-collapsed .cx-side{width:60px}
.cx.is-collapsed .cx-side-head{padding:0 12px;justify-content:center}
.cx.is-collapsed .cx-brand{flex:0 0 auto;width:36px;justify-content:center}
.cx.is-collapsed :is(.cx-wm,.cx-collapse,.cx-nav-l,.cx-nav-i kbd,.cx-nav-i em,.cx-chev,.cx-hist,.cx-acct-t,.cx-acct>svg){display:none}
.cx.is-collapsed .cx-nav{padding:2px 12px;align-items:center}
.cx.is-collapsed .cx-nav-i{width:36px;padding:0;justify-content:center}
.cx.is-collapsed .cx-more{margin:0;padding:0;border:0}
.cx.is-collapsed .cx-side-foot{flex-direction:column;gap:6px;margin-top:auto;padding:8px 12px 12px;border-top:0}
.cx.is-collapsed .cx-acct-wrap{flex:0 0 auto}
.cx.is-collapsed .cx-acct{width:auto;padding:4px}
.cx.is-collapsed .cx-acct-menu{left:0;right:auto}
.cx.is-collapsed .cx-apps-menu{left:8px;right:auto;width:272px}

/* ================================================================ main + header */
.cx-main{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bg)}
.cx-top{position:relative;z-index:20;height:56px;flex-shrink:0;display:flex;align-items:center;gap:8px;padding:0 12px 0 14px}
.cx-top.lined{border-bottom:1px solid var(--line)}
.cx-picker-wrap,.cx-title-wrap{position:relative}
.cx-picker{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 10px 0 12px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:-.01em;transition:background .12s}
.cx-picker:hover,.cx-picker.open{background:var(--hover)}
.cx-picker span{color:var(--t3);font-weight:500;font-size:14px}
.cx-picker svg{color:var(--t3)}
.cx-picker-menu{top:calc(100% + 6px);left:0;width:300px}
.cx-pick{display:flex;align-items:flex-start;gap:12px;width:100%;padding:10px;border-radius:10px;text-align:left}
.cx-pick:hover{background:var(--hover)}
.cx-pick-ic{width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--s2);color:var(--t2)}
.cx-pick.on .cx-pick-ic{background:var(--acc-soft);color:var(--acc)}
.cx-pick b{display:block;font-size:13.5px;font-weight:600}
.cx-pick small{display:block;font-size:12px;color:var(--t3);margin-top:1px}
.cx-pick .ck{margin-left:auto;align-self:center;color:var(--acc)}
.cx-pick-foot{display:flex;align-items:center;gap:8px;padding:9px 10px 5px;font-size:11.5px;color:var(--t3);border-top:1px solid var(--line);margin-top:4px}
.cx-top-mid{flex:1;min-width:0;display:flex;justify-content:center}
.cx-title-btn{display:inline-flex;align-items:center;gap:6px;max-width:min(460px,100%);height:32px;padding:0 10px;border-radius:9px;font-size:13.5px;font-weight:500;color:var(--t2)}
.cx-title-btn:hover,.cx-title-btn.open{background:var(--hover);color:var(--text)}
.cx-title-btn span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-title-btn svg{flex-shrink:0;color:var(--t3)}
.cx-title-menu{top:calc(100% + 6px);left:50%;transform:translateX(-50%);width:220px;animation:none}
.cx-title-in{height:32px;width:min(420px,60vw);padding:0 10px;border:1px solid var(--acc)!important;border-radius:9px!important;background:var(--surface)!important;font-size:13.5px;text-align:center}
.cx-title-btn.static{cursor:default}
.cx-title-btn.static:hover{background:none;color:var(--t2)}
.cx-crumbs{display:flex;align-items:center;gap:2px;min-width:0;max-width:100%}
.cx-crumbs .cx-title-wrap{min-width:0}
.cx-crumb{display:inline-flex;align-items:center;gap:7px;min-width:0;max-width:220px;height:32px;padding:0 9px;border-radius:9px;font-size:13.5px;font-weight:500;color:var(--t3);transition:background .12s,color .12s}
.cx-crumb:hover{background:var(--hover);color:var(--text)}
.cx-crumb span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-crumb svg{flex-shrink:0}
.cx-crumb-sep{flex-shrink:0;color:var(--t3);opacity:.5;font-size:15px}
.cx-top-r{display:flex;align-items:center;gap:4px;margin-left:auto}
.cx-safe{display:inline-flex;align-items:center;gap:6px;height:30px;margin-right:6px;padding:0 11px;border:1px solid var(--line2);border-radius:999px;color:var(--t2);font-size:12px;font-weight:550;white-space:nowrap;transition:background .12s,color .12s}
.cx-safe svg{color:var(--ok)}
.cx-safe:hover{background:var(--hover);color:var(--text)}
.cx-safe.off svg{color:var(--warn)}
.cx-ghost{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px;border:1px solid var(--line2);border-radius:10px;font-size:13px;font-weight:500;color:var(--text);transition:background .12s}
.cx-ghost:hover{background:var(--hover)}
.cx-view{position:relative;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden}

/* ================================================================ home */
.cx-home{position:relative;display:flex;flex-direction:column;min-height:100%}
.cx-home-in{position:relative;flex:1;width:100%;max-width:880px;margin:0 auto;padding:40px 28px 13vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
.cx-hero-mark{display:flex;margin-bottom:18px}
.cx-home-note{display:flex;align-items:center;justify-content:center;gap:8px;padding:0 24px 22px;font-size:12px;color:var(--t3);text-align:center}
.cx-home-note svg{flex-shrink:0;color:var(--ok)}
.cx .cx-home h1{font-family:var(--serif);font-weight:400;font-size:clamp(32px,4.2vw,46px);line-height:1.12;letter-spacing:-.022em;text-align:center}
.cx .cx-sub{margin-top:10px;font-size:15.5px;line-height:1.55;color:var(--t2);text-align:center}
.cx-hero-c{width:100%;max-width:760px;margin-top:30px}
.cx-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:760px;margin-top:18px}
.cx-chip{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:1px solid var(--line2);border-radius:999px;background:var(--surface);font-size:13px;font-weight:500;color:var(--t2);transition:all .14s}
.cx-chip svg{color:var(--t3);transition:color .14s}
.cx-chip:hover{color:var(--text);border-color:color-mix(in srgb,var(--text) 22%,var(--line2));background:var(--s2)}
.cx-chip:hover svg{color:var(--text)}
.cx-chip.ghost{border-style:dashed}
.cx-section{width:100%;margin-top:64px}
.cx-section-h{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px}
.cx .cx-section-h h2{font-size:17px;font-weight:600;letter-spacing:-.015em}
.cx .cx-section-h p{margin-top:3px;font-size:13px;color:var(--t3)}
.cx-tabs{display:inline-flex;flex-shrink:0;gap:2px;padding:3px;border:1px solid var(--line);border-radius:11px;background:var(--surface)}
.cx-tabs button{height:28px;padding:0 12px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--t2);white-space:nowrap}
.cx-tabs button:hover{color:var(--text)}
.cx-tabs button.on{background:var(--s3);color:var(--text)}
.cx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cx-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;min-height:150px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface);text-align:left;overflow:hidden;transition:border-color .16s,box-shadow .16s}
.cx-card:hover{border-color:color-mix(in srgb,var(--text) 20%,var(--line2));box-shadow:var(--sh2)}
.cx-card-ic{width:38px;height:38px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;border-radius:11px;border:1px solid var(--line2);background:var(--s2);color:var(--text);transition:all .16s}
.cx-card:hover .cx-card-ic{border-color:var(--acc-line);background:var(--acc-soft);color:var(--acc)}
.cx-card b{font-size:14px;font-weight:600;letter-spacing:-.005em}
.cx-card small{display:block;margin-top:4px;font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-card-go{display:inline-flex;align-items:center;gap:6px;margin-top:auto;padding-top:14px;font-size:12.5px;font-weight:600;color:var(--acc);opacity:0;transform:translateX(-4px);transition:all .16s}
.cx-card:hover .cx-card-go{opacity:1;transform:none}
.cx-card .cx-card-ex{display:block;align-self:stretch;margin-top:10px;padding:8px 10px;border-radius:9px;background:var(--s2);font-size:12px;line-height:1.45;color:var(--t2);font-style:italic}
.cx-ex-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cx-ex{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);text-align:left;transition:border-color .16s,box-shadow .16s}
.cx-ex:hover{border-color:color-mix(in srgb,var(--text) 20%,var(--line2));box-shadow:var(--sh2)}
.cx-ex p{font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-ex:hover p{color:var(--text)}
.cx-ex-f{display:flex;align-items:center;justify-content:space-between;margin-top:auto;font-size:12px;color:var(--t3)}
.cx-ex-f svg{color:var(--t3);transition:transform .16s,color .16s}
.cx-ex:hover .cx-ex-f svg{color:var(--acc);transform:translateX(2px)}
.cx-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;margin-top:56px;padding-top:24px;border-top:1px solid var(--line);width:100%;font-size:12px;color:var(--t3)}
.cx-trust span{display:inline-flex;align-items:center;gap:7px}

/* ================================================================ pages (tools / library) */
.cx-page{max-width:1000px;margin:0 auto;padding:40px 32px 64px}
.cx-page-h{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
.cx .cx-page-h h1{font-family:var(--serif);font-weight:400;font-size:36px;letter-spacing:-.02em;line-height:1.12}
.cx .cx-page-h p{margin-top:6px;font-size:14px;color:var(--t2);max-width:560px}
.cx-search{display:flex;align-items:center;gap:8px;width:280px;height:38px;padding:0 12px;border:1px solid var(--line2);border-radius:11px;background:var(--surface);color:var(--t3)}
.cx-search:focus-within{border-color:var(--acc-line)}
.cx-search input{flex:1;min-width:0;height:100%;font-size:13.5px}
.cx-lib{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.cx-lib-card{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-lib-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--t3)}
.cx-lib-card h3{font-size:14.5px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cx-lib-card p{font-size:13px;line-height:1.55;color:var(--t2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cx-lib-acts{display:flex;gap:6px;margin-top:auto;padding-top:4px}
.cx-lib-acts button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border:1px solid var(--line2);border-radius:8px;font-size:12.5px;font-weight:500;color:var(--t2)}
.cx-lib-acts button:hover{background:var(--hover);color:var(--text)}
.cx-lib-acts button.danger:hover{color:var(--danger)}
.cx-empty-state{display:flex;flex-direction:column;align-items:center;gap:12px;padding:72px 24px;border:1px dashed var(--line2);border-radius:18px;text-align:center}
.cx .cx-empty-state h3{font-size:16px;font-weight:600}
.cx .cx-empty-state p{max-width:380px;font-size:13.5px;line-height:1.55;color:var(--t3)}

/* ================================================================ composer */
.cx-composer{position:relative;background:var(--surface);border:1px solid var(--line2);border-radius:24px;box-shadow:var(--sh2);transition:border-color .16s,box-shadow .16s}
.cx-composer:focus-within{border-color:color-mix(in srgb,var(--text) 26%,var(--line2));box-shadow:var(--sh2)}
.cx-composer.is-rec{border-color:color-mix(in srgb,var(--danger) 60%,var(--line2))}
.cx-composer textarea{display:block;width:100%;min-height:56px;max-height:260px;padding:17px 20px 6px;resize:none;font-size:15.5px;line-height:1.55}
.cx-composer.is-hero textarea{min-height:88px}
.cx-att-row{display:flex;gap:8px;padding:12px 14px 0}
.cx-att{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 6px;border:1px solid var(--line2);border-radius:12px;background:var(--s2)}
.cx-att img{width:44px;height:44px;display:block;object-fit:cover;border-radius:8px}
.cx-att b{display:block;font-size:12.5px;font-weight:600}
.cx-att small{display:block;font-size:11.5px;color:var(--t3)}
.cx-att button{width:24px;height:24px;margin-left:4px;display:flex;align-items:center;justify-content:center;border-radius:7px;color:var(--t3)}
.cx-att button:hover{background:var(--hover);color:var(--text)}
.cx-cbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px 10px 12px}
.cx-cbar-l,.cx-cbar-r{display:flex;align-items:center;gap:4px;min-width:0}
.cx-cbtn{height:34px;min-width:34px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 9px;border-radius:999px;color:var(--t2);font-size:13px;font-weight:500;transition:background .12s,color .12s}
.cx-cbtn:hover,.cx-cbtn.open{background:var(--hover);color:var(--text)}
.cx-cbtn.bordered{border:1px solid var(--line2)}
.cx-cbtn.rec{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-mode-pill{display:inline-flex;align-items:center;gap:7px;height:32px;max-width:220px;padding:0 6px 0 11px;border-radius:999px;background:var(--acc-soft);color:var(--acc);font-size:12.5px;font-weight:600;white-space:nowrap}
.cx-mode-pill span{overflow:hidden;text-overflow:ellipsis}
.cx-mode-pill button{width:20px;height:20px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:var(--acc)}
.cx-mode-pill button:hover{background:color-mix(in srgb,var(--acc) 20%,transparent)}
.cx-rec-l{display:inline-flex;align-items:center;gap:6px;margin-right:6px;font-size:12px;font-weight:600;color:var(--danger)}
.cx-rec-l i{width:7px;height:7px;border-radius:50%;background:var(--danger);animation:cxBlink 1s ease-in-out infinite}
.cx-send{width:36px;height:36px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--primary)!important;color:var(--primary-ink)!important;transition:transform .1s,opacity .12s}
.cx-send:not(:disabled):hover{opacity:.88}
.cx-send:not(:disabled):active{transform:scale(.94)}
.cx-send:disabled{background:var(--s3)!important;color:var(--t3)!important;opacity:1}
.cx-add-menu{left:8px;width:250px;overflow-y:auto}
.cx-tools-menu{left:8px;width:min(560px,calc(100vw - 48px));padding:8px;overflow-y:auto;overscroll-behavior:contain}
.cx-add-menu.up,.cx-tools-menu.up{bottom:calc(100% + 8px)}
.cx-add-menu.down,.cx-tools-menu.down{top:calc(100% + 8px)}
.cx-tools-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 6px}
.cx-tools-grid .cx-pop-gl{grid-column:1/-1}
.cx-tool-i{display:flex;align-items:center;gap:10px;width:100%;padding:8px;border-radius:10px;text-align:left}
.cx-tool-i:hover{background:var(--hover)}
.cx-tool-i.on{background:var(--acc-soft)}
.cx-tool-i-ic{width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:8px;border:1px solid var(--line2);color:var(--t2);background:var(--surface)}
.cx-tool-i.on .cx-tool-i-ic{border-color:transparent;background:var(--acc);color:var(--on-acc)}
.cx-tool-i b{display:block;font-size:13px;font-weight:600;line-height:1.25}
.cx-tool-i small{display:block;font-size:11.5px;color:var(--t3);line-height:1.35}
.cx-dock{position:relative;z-index:10;flex-shrink:0;padding:8px 24px 14px;background:linear-gradient(to bottom,transparent,var(--bg) 18px)}
.cx-dock-in{max-width:780px;margin:0 auto}
.cx .cx-fine{margin-top:9px;font-size:11.5px;color:var(--t3);text-align:center}
.cx-scrolldown{position:absolute;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line2);border-radius:50%;background:var(--surface);color:var(--text);box-shadow:var(--sh2);animation:cxFade .15s}

/* ================================================================ thread */
.cx-thread{max-width:780px;margin:0 auto;padding:28px 24px 36px;display:flex;flex-direction:column;gap:34px}
.cx-u{display:flex;flex-direction:column;align-items:flex-end;gap:7px;animation:cxIn .24s ease-out}
.cx-u-mode{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--t3)}
.cx-u-img{display:block;max-width:320px;max-height:260px;object-fit:cover;border:1px solid var(--line2);border-radius:16px}
.cx-u-b{max-width:80%;padding:12px 17px;border-radius:22px;background:var(--user);font-size:var(--fs-u,var(--fs));line-height:1.6;white-space:pre-wrap;word-wrap:break-word}
.cx-a{display:flex;flex-direction:column;gap:12px;animation:cxIn .24s ease-out}
.cx-a-h{display:flex;flex-wrap:wrap;align-items:center;gap:7px 9px;font-size:13.5px}
.cx-a-h b{font-weight:600}
.cx-a-meta{font-size:12px;color:var(--t3)}
.cx-a-acts{display:flex;align-items:center;gap:2px;margin:2px 0 0 -7px}
.cx-act{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;color:var(--t3);transition:background .12s,color .12s}
.cx-act:hover:not(:disabled){background:var(--hover);color:var(--text)}
.cx-act.on{color:var(--acc)}
.cx-follow{display:flex;flex-direction:column;gap:2px;margin-top:6px;padding-top:14px;border-top:1px solid var(--line)}
.cx .cx-follow>p{margin-bottom:6px;font-size:12px;font-weight:600;color:var(--t3)}
.cx-follow button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;font-size:13.5px;color:var(--t2);text-align:left;transition:background .12s,color .12s}
.cx-follow button:hover{background:var(--hover);color:var(--text)}
.cx-follow button svg{flex-shrink:0;color:var(--t3)}
.cx-err{display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border:1px solid color-mix(in srgb,var(--danger) 35%,var(--line));border-radius:14px;background:color-mix(in srgb,var(--danger) 8%,transparent);color:var(--danger);font-size:13.5px}
.cx-err span{flex:1}
.cx-err button,.cx-stopped button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border:1px solid var(--line2);border-radius:9px;background:var(--surface);color:var(--text);font-size:12.5px;font-weight:550;white-space:nowrap}
.cx-stopped{display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--t3);font-style:italic}
.cx-stopped button{font-style:normal}
.cx-think{display:flex;flex-direction:column;gap:11px;max-width:580px}
.cx-think-l{font-size:14px;font-weight:500;background:linear-gradient(90deg,var(--t3) 0%,var(--text) 45%,var(--t3) 90%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:cxShine 1.8s linear infinite}
.cx-sk{display:block;height:10px;border-radius:6px;background:linear-gradient(90deg,var(--s2) 0%,var(--s3) 50%,var(--s2) 100%);background-size:200% 100%;animation:cxSk 1.4s ease-in-out infinite}
.cx-deck{display:flex;align-items:center;gap:14px;max-width:500px;padding:12px;border:1px solid var(--line2);border-radius:16px;background:var(--surface);box-shadow:var(--sh1)}
.cx-deck-ic{width:46px;height:46px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:12px;background:var(--acc-soft);color:var(--acc)}
.cx-deck-t{flex:1;min-width:0}
.cx-deck-t b{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-deck-t small{font-size:12px;color:var(--t3)}
.cx-deck-go{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:999px;background:var(--primary)!important;color:var(--primary-ink)!important;font-size:13px;font-weight:600}

/* ================================================================ markdown */
.cx-md{font-size:var(--fs);line-height:1.74;color:var(--text);word-wrap:break-word}
.cx-dark .cx-md{color:#E2E8F0}
.cx-md>*:first-child{margin-top:0!important}
.cx-md>*:last-child{margin-bottom:0!important}
.cx-md p{margin:0 0 14px}
.cx .cx-md h2,.cx .cx-md h3,.cx .cx-md h4{margin:26px 0 10px;font-weight:650;line-height:1.35;letter-spacing:-.012em;color:var(--text)}
.cx .cx-md h2{font-size:1.25em}
.cx .cx-md h3{font-size:1.08em}
.cx .cx-md h4{font-size:1em}
.cx-md ul,.cx-md ol{margin:0 0 14px;padding-left:24px}
.cx-md ul{list-style:disc}
.cx-md ol{list-style:decimal}
.cx-md li{margin:6px 0;padding-left:4px}
.cx-md li::marker{color:var(--t3)}
.cx-md strong{font-weight:650;color:var(--text)}
.cx-md em{font-style:italic}
.cx-md code{padding:2px 6px;border:1px solid var(--line);border-radius:6px;background:var(--code);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em}
.cx-md pre{margin:0 0 16px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--code);overflow-x:auto;font-size:.87em;line-height:1.6}
.cx-md pre code{padding:0;border:0;background:none}
.cx-md blockquote{margin:6px 0 16px;padding:13px 16px 13px 18px;border:1px solid var(--acc-line);border-left:3px solid var(--acc);border-radius:12px;background:var(--acc-soft)}
.cx-md blockquote p:last-child{margin:0}
.cx-md hr{margin:24px 0;border:0;border-top:1px solid var(--line)}
.cx-md a{color:var(--acc);text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
.cx-md .md-table{margin:8px 0 18px;border:1px solid var(--line2);border-radius:12px;overflow-x:auto}
.cx-md table{width:100%;border-collapse:collapse;font-size:.92em;line-height:1.55}
.cx-md th{background:var(--s2);color:var(--t2);font-size:.88em;font-weight:600;text-align:left;white-space:nowrap;letter-spacing:.01em}
.cx-md th,.cx-md td{padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
.cx-md tbody tr:nth-child(even) td{background:color-mix(in srgb,var(--s2) 45%,transparent)}
.cx-md tbody tr:last-child td{border-bottom:0}
.cx-md td:first-child{font-weight:550;color:var(--text)}
.cx-md table{font-family:var(--sans);font-variant-numeric:tabular-nums}
.cx-md sup.md-cite{font-family:var(--sans)}

/* serif answers (the default). Tables, code and citations stay in the sans for crisp numbers and doses. */
.ans-serif .cx-md{font-family:var(--serif);line-height:1.66}
.ans-serif.cx-dark .cx-md{color:#E6EBF2}
.cx.ans-serif .cx-md :is(h2,h3,h4){font-family:var(--serif);font-weight:600;letter-spacing:-.006em;line-height:1.3}
.cx.ans-serif .cx-md h2{font-size:1.3em}
.cx.ans-serif .cx-md h3{font-size:1.13em}
.ans-serif .cx-md strong{font-weight:640}
.ans-serif .cx-md li{margin:5px 0}
.ans-serif .cx-md table{font-size:.84em}
.ans-serif .cx-md code{font-size:.8em}

/* ================================================================ command palette */
.cx-palette{width:100%;max-width:640px;overflow:hidden;border:1px solid var(--line2);border-radius:18px;background:var(--surface);box-shadow:var(--sh3);animation:cxPop .16s ease-out}
.cx-pal-in{display:flex;align-items:center;gap:12px;height:56px;padding:0 16px;border-bottom:1px solid var(--line);color:var(--t3)}
.cx-pal-in input{flex:1;min-width:0;height:100%;font-size:15.5px}
.cx-pal-list{max-height:min(420px,56vh);overflow-y:auto;padding:6px}
.cx-pal-gl{padding:10px 10px 4px;font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-pal-i{display:flex;align-items:center;gap:12px;width:100%;height:40px;padding:0 10px;border-radius:10px;font-size:13.5px;color:var(--text);text-align:left}
.cx-pal-i svg{flex-shrink:0;color:var(--t2)}
.cx-pal-i span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-pal-i small{flex-shrink:0;font-size:12px;color:var(--t3)}
.cx-pal-i.on{background:var(--hover)}
.cx-pal-i.on svg{color:var(--acc)}
.cx-pal-empty{padding:28px;text-align:center;font-size:13.5px;color:var(--t3)}
.cx-pal-foot{display:flex;gap:18px;padding:10px 16px;border-top:1px solid var(--line);font-size:11.5px;color:var(--t3)}
.cx-pal-foot span{display:inline-flex;align-items:center;gap:6px}

/* ================================================================ settings */
.cx-settings{display:flex;width:100%;max-width:820px;height:min(600px,calc(100vh - 32px));overflow:hidden;border:1px solid var(--line2);border-radius:20px;background:var(--surface);box-shadow:var(--sh3);animation:cxPop .18s ease-out}
.cx-set-nav{width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;padding:18px 10px;background:var(--side);border-right:1px solid var(--line)}
.cx .cx-set-nav h2{padding:4px 10px 14px;font-size:16px;font-weight:600}
.cx-set-nav button{display:flex;align-items:center;gap:10px;height:36px;padding:0 10px;border-radius:9px;font-size:13.5px;font-weight:500;color:var(--t2)}
.cx-set-nav button:hover{background:var(--hover);color:var(--text)}
.cx-set-nav button.on{background:var(--s3);color:var(--text)}
.cx-set-body{flex:1;min-width:0;display:flex;flex-direction:column}
.cx-set-head{display:flex;align-items:center;justify-content:space-between;gap:12px;height:62px;flex-shrink:0;padding:0 14px 0 26px;border-bottom:1px solid var(--line)}
.cx .cx-set-head h3{font-size:16px;font-weight:600}
.cx-set-scroll{flex:1;overflow-y:auto;padding:8px 26px 24px}
.cx-set-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 0;border-bottom:1px solid var(--line)}
.cx-set-row:last-child{border-bottom:0}
.cx-set-row>div:first-child{min-width:0}
.cx-set-row>div:first-child b{display:block;font-size:13.5px;font-weight:550}
.cx-set-row>div:first-child small{display:block;margin-top:3px;font-size:12.5px;line-height:1.45;color:var(--t3)}
.cx-seg{display:inline-flex;flex-shrink:0;padding:3px;border:1px solid var(--line);border-radius:10px;background:var(--s2)}
.cx-seg button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--t2);white-space:nowrap}
.cx-seg button.on{background:var(--surface);color:var(--text);box-shadow:var(--sh1)}
.cx-dark .cx-seg button.on{background:var(--s3)}
.cx-swatch{display:flex;flex-shrink:0;gap:10px}
.cx-swatch button{width:26px;height:26px;border-radius:50%;border:2px solid var(--surface);box-shadow:0 0 0 1px var(--line2)}
.cx-swatch button.on{box-shadow:0 0 0 2px var(--acc)}
.cx-select{height:36px;min-width:160px;padding:0 12px!important;border:1px solid var(--line2)!important;border-radius:10px!important;background:var(--surface)!important;font-size:13.5px}
.cx-switch{position:relative;flex-shrink:0;width:40px;height:24px;border-radius:999px;background:var(--s3);transition:background .15s}
.cx-switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
.cx-switch.on{background:var(--acc)}
.cx-switch.on::after{transform:translateX(16px)}
.cx-btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 13px;border:1px solid var(--line2);border-radius:10px;font-size:13px;font-weight:550;color:var(--text);white-space:nowrap}
.cx-btn:hover:not(:disabled){background:var(--hover)}
.cx-btn.danger{color:var(--danger);border-color:color-mix(in srgb,var(--danger) 40%,var(--line2))}
.cx-btn.danger.armed{background:var(--danger);border-color:var(--danger);color:#fff}
.cx-keys{display:flex;flex-direction:column}
.cx-keys div{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.cx-keys div:last-child{border-bottom:0}
.cx-keys span:last-child{display:inline-flex;gap:4px}
.cx-about{display:flex;align-items:center;gap:16px;padding:18px 0 20px;border-bottom:1px solid var(--line)}
.cx .cx-about h4{font-size:18px;font-weight:650;letter-spacing:-.02em}
.cx .cx-about p{margin-top:2px;font-size:13px;color:var(--t3)}
.cx-link{display:inline-flex;align-items:center;gap:6px;color:var(--acc);font-weight:550}

/* ================================================================ review + sources */
.cx-rv{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border:1px solid var(--line2);border-radius:999px;color:var(--t2);font-size:11.5px;font-weight:550;white-space:nowrap}
.cx-rv svg{color:var(--ok)}
.cx-conf{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border:1px solid var(--line2);border-radius:999px;font-size:11.5px;font-weight:550;color:var(--t2);white-space:nowrap}
.cx-conf::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--ok)}
.cx-conf.moderate::before{background:#F5A524}
.cx-conf.low::before{background:var(--danger)}
.cx-a-by{margin-left:auto;padding-left:12px;font-size:11.5px;color:var(--t3);white-space:nowrap}
.cx-sources{padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx .cx-src-h{display:flex;align-items:center;gap:7px;margin:0 0 9px 4px;font-size:12px;font-weight:600;color:var(--t3)}
.cx-sources ol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:0;padding:0;list-style:none}
.cx-sources a{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;background:var(--s2);transition:background .12s}
.cx-sources a:hover{background:var(--s3)}
.cx-sources .n{width:20px;height:20px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;background:var(--acc-soft);color:var(--acc);font-size:11px;font-weight:700}
.cx-sources .t{flex:1;min-width:0;font-size:12.5px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-sources .d{flex-shrink:0;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;color:var(--t3)}
.cx-rvd{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}
.cx-rvd summary{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12.5px;font-weight:600;color:var(--t2);cursor:pointer;list-style:none;user-select:none}
.cx-rvd summary::-webkit-details-marker{display:none}
.cx-rvd summary:hover{color:var(--text)}
.cx-rvd summary>svg:first-child{color:var(--ok)}
.cx-rvd summary .chev{margin-left:auto;color:var(--t3);transition:transform .15s}
.cx-rvd[open] summary .chev{transform:rotate(180deg)}
.cx-rvd-b{display:flex;flex-direction:column;gap:12px;padding:0 14px 14px;border-top:1px solid var(--line)}
.cx-rvd-row{display:grid;grid-template-columns:104px 1fr;gap:12px;padding-top:12px;font-size:13px;line-height:1.5}
.cx-rvd-row>span{padding-top:2px;font-size:12px;font-weight:600;color:var(--t3)}
.cx-rvd-row .chips{display:flex;flex-wrap:wrap;gap:6px}
.cx-rvd-row em{padding:3px 9px;border-radius:999px;background:var(--s2);font-style:normal;font-size:12px;color:var(--t2)}
.cx-rvd-row ul{margin:0;padding-left:18px;list-style:disc;color:var(--text)}
.cx-rvd-row li{margin:2px 0}
.cx .cx-rvd-row p{color:var(--t2)}
.cx .cx-rvd-note{font-size:12px;line-height:1.5;color:var(--t3)}
.cx-rvwarn{display:flex;align-items:center;gap:9px;padding:10px 12px;border:1px solid color-mix(in srgb,#F5A524 40%,var(--line));border-radius:12px;background:color-mix(in srgb,#F5A524 9%,transparent);color:#B7791F;font-size:13px}
.cx-dark .cx-rvwarn{color:#F5C15A}
.cx-steps{display:flex;flex-direction:column;gap:9px;margin-bottom:6px}
.cx-step{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--t3)}
.cx-step.on{color:var(--text);font-weight:500}
.cx-step.done{color:var(--t2)}
.cx-step.done svg{color:var(--ok)}
.cx-spin{width:15px;height:15px;flex-shrink:0;border:2px solid var(--s3);border-top-color:var(--acc);border-radius:50%;animation:cxSpin .8s linear infinite}
.cx-dot{width:15px;height:15px;flex-shrink:0;border:2px solid var(--s3);border-radius:50%}
.cx-md .md-bl{padding:13px 16px 13px 18px;border-left:3px solid var(--acc);border-radius:4px 12px 12px 4px;background:var(--s2)}
.cx-md sup.md-cite{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;margin:0 1px;padding:0 4px;border-radius:5px;background:var(--acc-soft);color:var(--acc);font-size:10.5px;font-weight:700;line-height:1;vertical-align:2px}
.cx-cbtn.cx-src.on{background:var(--acc-soft);color:var(--acc)}
@keyframes cxSpin{to{transform:rotate(360deg)}}

/* ================================================================ projects */
.cx-btn.primary{background:var(--primary);border-color:var(--primary);color:var(--primary-ink)}
.cx-btn.primary:hover:not(:disabled){background:var(--primary);opacity:.9}
.cx-page-acts{display:flex;align-items:center;gap:8px;flex-shrink:0}
.cx-projects{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cx-proj{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-height:172px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface);text-align:left;overflow:hidden;transition:border-color .16s,box-shadow .16s}
.cx-proj:hover{border-color:color-mix(in srgb,var(--text) 20%,var(--line2));box-shadow:var(--sh2)}
.cx-proj-ic{width:38px;height:38px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:11px;background:var(--acc-soft);color:var(--acc)}
.cx-proj b{font-size:15px;font-weight:600;letter-spacing:-.01em}
.cx-proj small{font-size:12.5px;line-height:1.5;color:var(--t3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cx-proj-f{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:12px;font-size:12px;color:var(--t3)}
.cx-proj.add{align-items:center;justify-content:center;gap:10px;border-style:dashed;background:transparent;color:var(--t2);font-size:13.5px;font-weight:550}
.cx-proj.add:hover{color:var(--text);background:var(--surface)}
.cx-proj.add .cx-proj-ic{margin:0;background:var(--s2);color:var(--t2)}
.cx-ideas{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:4px}
.cx-back{display:inline-flex;align-items:center;gap:6px;height:30px;margin:0 0 14px -10px;padding:0 10px;border-radius:8px;font-size:13px;font-weight:500;color:var(--t3)}
.cx-back:hover{background:var(--hover);color:var(--text)}
.cx-proj-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:28px;align-items:start}
.cx-proj-chats{margin-top:28px}
.cx-sub-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px;padding:0 12px;font-size:12.5px;font-weight:600;color:var(--t3)}
.cx-pchat{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;border-radius:12px;text-align:left;transition:background .12s}
.cx-pchat:hover{background:var(--hover)}
.cx-pchat-ic{width:34px;height:34px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--t2)}
.cx-pchat-t{flex:1;min-width:0}
.cx-pchat-t b{display:block;font-size:14px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-pchat-t small{display:block;margin-top:2px;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-pchat>svg{flex-shrink:0;color:var(--t3);opacity:0;transition:opacity .12s}
.cx-pchat:hover>svg{opacity:1}
.cx-pcard{padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-pcard+.cx-pcard{margin-top:12px}
.cx-pcard-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.cx-pcard-h b{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600}
.cx-pcard-h button{height:26px;padding:0 9px;border-radius:7px;font-size:12px;font-weight:600;color:var(--acc)}
.cx-pcard-h button:hover{background:var(--acc-soft)}
.cx .cx-pcard p{font-size:13px;line-height:1.55;color:var(--t2);white-space:pre-wrap;word-wrap:break-word}
.cx .cx-pcard p.muted{color:var(--t3)}
.cx-pcard-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cx-pcard-stats div{padding:10px 12px;border-radius:10px;background:var(--s2)}
.cx-pcard-stats b{display:block;font-size:18px;font-weight:650;letter-spacing:-.02em}
.cx-pcard-stats small{font-size:11.5px;color:var(--t3)}
.cx-pcard-note{display:flex;gap:9px;margin-top:12px;padding:0 4px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-pcard-note svg{flex-shrink:0;margin-top:2px;color:var(--ok)}
.cx-proj-menu{top:calc(100% + 6px);right:0;width:224px}

/* ================================================================ decks */
.cx-decks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.cx-dk{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden;transition:border-color .16s,box-shadow .16s}
.cx-dk:hover{border-color:color-mix(in srgb,var(--text) 20%,var(--line2));box-shadow:var(--sh2)}
.cx-dk-cover{position:relative;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;width:100%;aspect-ratio:16/9;padding:16px 64px 16px 18px;background:linear-gradient(150deg,#1E3A8A 0%,#14245A 46%,#0F172A 100%);color:#fff;text-align:left;overflow:hidden}
.cx-dk-cover::after{content:"";position:absolute;right:-48px;top:-48px;width:170px;height:170px;border-radius:50%;border:1px solid rgba(255,255,255,.08);box-shadow:0 0 0 28px rgba(255,255,255,.025);pointer-events:none}
.cx-dk-k{position:absolute;top:14px;left:18px;display:flex;align-items:center;gap:7px;font-size:10.5px;font-weight:650;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.62)}
.cx-dk-cover b{position:relative;font-family:var(--serif);font-size:21px;font-weight:500;line-height:1.18;letter-spacing:-.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cx-dk-cover small{position:relative;font-size:12px;color:rgba(255,255,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-dk-play{position:absolute;right:16px;bottom:16px;z-index:1;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;color:#0B0D11;box-shadow:0 6px 18px -6px rgba(0,0,0,.6);opacity:.92;transition:transform .16s,opacity .16s}
.cx-dk:hover .cx-dk-play{opacity:1;transform:scale(1.06)}
.cx-dk-b{display:flex;flex-direction:column;gap:10px;padding:12px 14px 14px}
.cx-dk-meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-height:22px;font-size:12px;color:var(--t3)}

/* ================================================================ dialog */
.cx-dialog{width:100%;max-width:540px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line2);border-radius:20px;background:var(--surface);box-shadow:var(--sh3);animation:cxPop .16s ease-out}
.cx-dialog-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 16px 4px 24px}
.cx .cx-dialog-h h3{font-family:var(--serif);font-size:24px;font-weight:500;letter-spacing:-.012em;line-height:1.2}
.cx .cx-dialog-h p{margin-top:6px;font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-dialog-b{display:flex;flex-direction:column;gap:18px;padding:14px 24px 4px;overflow-y:auto}
.cx-field{display:flex;flex-direction:column;gap:7px}
.cx-field>span{font-size:12.5px;font-weight:600;color:var(--t2)}
.cx-field>small{font-size:12px;line-height:1.45;color:var(--t3)}
.cx-input{width:100%;height:42px;padding:0 13px!important;border:1px solid var(--line2)!important;border-radius:11px!important;background:var(--bg)!important;font-size:14px}
.cx-input:focus{border-color:var(--acc-line)!important;box-shadow:0 0 0 3px var(--acc-soft)!important}
textarea.cx-input{height:auto;min-height:124px;padding:11px 13px!important;line-height:1.55;resize:vertical}
.cx-dialog-f{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:18px 24px 22px}
.cx-dialog-f .count{margin-right:auto;font-size:12px;color:var(--t3)}

/* ================================================================ library mode */
.cx-libchip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border:1px solid color-mix(in srgb,var(--warn) 45%,var(--line2));border-radius:999px;background:color-mix(in srgb,var(--warn) 8%,transparent);color:var(--t2);font-size:11.5px;font-weight:550;white-space:nowrap}
.cx-libchip svg{color:var(--warn)}
.cx-step svg.warn{color:var(--warn)}
.cx-libtest{margin:-4px 0 12px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--s2)}
.cx-libtest form{display:flex;align-items:center;gap:8px;padding:0 4px 0 10px;border:1px solid var(--line2);border-radius:10px;background:var(--surface);color:var(--t3)}
.cx-libtest form:focus-within{border-color:color-mix(in srgb,var(--text) 26%,var(--line2))}
.cx-libtest input{flex:1;min-width:0;height:38px;font-size:13.5px}
.cx-libtest .cx-btn{height:30px;border:0;background:var(--s2)}
.cx-libtest ol{display:flex;flex-direction:column;gap:2px;margin:10px 0 0;padding:0;list-style:none}
.cx-libtest li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 8px;border-radius:8px;font-size:13px}
.cx-libtest li:hover{background:var(--hover)}
.cx-libtest li a{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);font-weight:500}
.cx-libtest li span{flex-shrink:0;font-size:12px;color:var(--t3)}
.cx .cx-libtest-note{margin:10px 4px 0;font-size:12.5px;color:var(--t3)}

/* ================================================================ font preview */
.cx-font-prev{margin:2px 0 14px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);font-size:15.5px;line-height:1.6;color:var(--text)}
.cx-font-prev.serif{font-family:var(--serif);font-size:17px;line-height:1.62}
.cx-font-prev b{font-weight:640}
.cx-seg .ff{width:20px;font-size:13.5px;font-weight:650;line-height:1;text-align:center}
.cx-seg .ff.serif{font-family:var(--serif);font-size:15.5px;font-weight:600}

/* ================================================================ animations */
@keyframes cxIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes cxPop{from{opacity:0;transform:translateY(4px) scale(.985)}to{opacity:1;transform:none}}
@keyframes cxFade{from{opacity:0}}
@keyframes cxToast{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes cxSk{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes cxShine{to{background-position:-220% 0}}
@keyframes cxBlink{0%,100%{opacity:1}50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.cx *{animation:none!important;transition:none!important}}

/* ================================================================ responsive */
@media (max-width:1120px){
  .cx-grid,.cx-projects,.cx-decks{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-ex-grid{grid-template-columns:1fr}
  .cx-proj-layout{grid-template-columns:minmax(0,1fr) 260px;gap:20px}
}
@media (max-width:899px){
  .cx-m{display:inline-flex!important}
  .cx-dt{display:none!important}
  .cx-side{position:fixed;top:0;bottom:0;left:0;z-index:90;width:min(300px,86vw)!important;transform:translateX(-102%);transition:transform .22s ease;box-shadow:var(--sh3)}
  .cx-side.open{transform:none}
  .cx-projects,.cx-decks{grid-template-columns:1fr}
  .cx-proj-layout{grid-template-columns:1fr}
  .cx-proj{min-height:0}
  .cx-page-acts{width:100%}
  .cx-page-acts .cx-btn{flex:1;justify-content:center}
  .cx-dialog-h{padding:18px 12px 4px 18px}
  .cx-dialog-b{padding:12px 18px 4px}
  .cx-dialog-f{padding:16px 18px 18px}
  .cx-scrim{position:fixed;inset:0;z-index:89;background:rgba(5,7,10,.55);opacity:0;pointer-events:none;transition:opacity .2s}
  .cx-scrim.on{opacity:1;pointer-events:auto}
  .cx-row-more{opacity:1}
  .cx-row .cx-row-t{padding-right:24px}
  .cx-top{padding:0 6px;gap:2px}
  .cx-top-mid{display:none}
  .cx-picker{font-size:14.5px;padding:0 8px}
  .cx-home-in{padding:28px 16px 8vh}
  .cx .cx-sub{font-size:14.5px}
  .cx-chips{gap:6px}
  .cx-chip{height:34px;padding:0 12px;font-size:12.5px}
  .cx-section{margin-top:40px}
  .cx-section-h{flex-direction:column;align-items:flex-start;gap:10px}
  .cx-tabs{max-width:100%;overflow-x:auto}
  .cx-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .cx-card{min-height:0;padding:13px}
  .cx-card small,.cx-card-go{display:none}
  .cx-card-ic{margin-bottom:10px;width:34px;height:34px}
  .cx-card b{font-size:13px}
  .cx-trust{flex-direction:column;align-items:center;gap:8px;margin-top:36px}
  .cx-page{padding:24px 16px 48px}
  .cx-page-h{flex-direction:column;align-items:stretch}
  .cx-search{width:100%}
  .cx-lib{grid-template-columns:1fr}
  .cx-thread{padding:20px 16px 24px;gap:26px}
  .cx-u-b{max-width:90%}
  .cx-md table{min-width:540px;font-size:.88em}
  .cx-md th,.cx-md td{padding:8px 11px}
  .cx-dock{padding:6px 10px 10px}
  .cx-composer{border-radius:20px}
  .cx-composer textarea{padding:14px 16px 4px;font-size:16px}
  .cx-tools-btn span{display:none}
  .cx-src span{display:none}
  .cx-a-by{display:none}
  .cx-sources ol{grid-template-columns:minmax(0,1fr)}
  .cx-rvd-row{grid-template-columns:1fr;gap:6px}
  .cx-tools-menu{left:0;width:calc(100vw - 20px)}
  .cx-tools-grid{grid-template-columns:1fr}
  .cx-overlay{padding:16px 10px}
  .cx-settings{flex-direction:column;height:calc(100vh - 32px)}
  .cx-set-nav{width:auto;flex-direction:row;gap:4px;padding:10px;overflow-x:auto;border-right:0;border-bottom:1px solid var(--line)}
  .cx .cx-set-nav h2{display:none}
  .cx-set-nav button{flex-shrink:0}
  .cx-set-row{flex-direction:column;align-items:flex-start;gap:10px}
  .cx-set-scroll{padding:4px 18px 18px}
  .cx-pal-foot{display:none}
}
@media (min-width:900px){.cx-scrim{display:none}}

/* ================================================================ professional finish
   Kept last so it layers over the base rules. */

/* type */
.cx .cx-wm{display:flex;flex-direction:column;gap:3px;font-size:15px;font-weight:700;letter-spacing:-.015em;line-height:1.1}
.cx-wm small{font-size:11.5px;font-weight:500;letter-spacing:0;color:var(--t3)}
.cx-picker{font-size:15px;font-weight:650;letter-spacing:-.01em}
.cx .cx-page-h h1{font-family:var(--sans);font-weight:650;font-size:26px;letter-spacing:-.025em;line-height:1.2}
.cx .cx-page-h p{font-size:14px}
.cx .cx-section-h h2{font-size:16px;font-weight:650;letter-spacing:-.01em}
.cx .cx-dialog-h h3{font-family:var(--sans);font-size:19px;font-weight:650;letter-spacing:-.015em}
.cx .cx-empty-state h3{font-size:16px;font-weight:650}
.cx .cx-set-nav h2{font-size:16px;font-weight:650}
.cx .cx-about h4{font-size:18px;font-weight:650}
.cx .cx-home h1,.cx .cx-page-h h1{text-wrap:balance}

/* sidebar */
.cx-side-head{height:60px;padding:0 10px 0 14px}
.cx-brand{gap:10px}
.cx-new{height:38px;margin:4px 0 10px;padding:0 12px;border-radius:10px;background:var(--primary);color:var(--primary-ink);font-weight:600;box-shadow:0 1px 2px rgba(15,23,41,.16)}
.cx-new:hover{background:var(--primary);color:var(--primary-ink);opacity:.92}
.cx-new .cx-new-ic{width:18px;height:18px;margin:0 -1px;background:transparent;color:var(--primary-ink)}
.cx-new:hover .cx-new-ic{transform:none}
.cx-new kbd{border-color:color-mix(in srgb,var(--primary-ink) 22%,transparent);background:transparent;color:color-mix(in srgb,var(--primary-ink) 62%,transparent)}
.cx-nav-i.on,.cx-row.on{background:var(--s3);color:var(--text)}
.cx-av{background:var(--primary);color:var(--primary-ink)}
.cx.is-collapsed .cx-new{width:36px;height:36px;margin:4px 0 8px}

/* home: workspace dashboard */
.cx-dash{width:100%;max-width:1060px;margin:0 auto;padding:40px 32px 8px}
.cx-dash-h{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px}
.cx .cx-home .cx-dash-h h1{font-family:var(--sans);font-size:28px;font-weight:650;line-height:1.2;letter-spacing:-.028em;text-align:left}
.cx .cx-dash-h p{margin-top:5px;font-size:14.5px;color:var(--t2)}
.cx-dash-date{flex-shrink:0;padding-bottom:3px;font-size:12.5px;font-weight:500;color:var(--t3);white-space:nowrap}
.cx-dash .cx-hero-c{max-width:none;margin-top:0}
.cx-composer{border-radius:16px;box-shadow:0 1px 2px rgba(15,23,41,.05),0 10px 30px -18px rgba(15,23,41,.28)}
.cx-composer:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 13%,transparent),0 10px 30px -18px rgba(15,23,41,.28)}
.cx-dark .cx-composer{box-shadow:0 14px 40px -22px rgba(0,0,0,.85)}
.cx-dark .cx-composer:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 16%,transparent),0 14px 40px -22px rgba(0,0,0,.85)}
.cx-quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.cx-q{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 12px;border:1px solid var(--line2);border-radius:9px;background:var(--surface);font-size:13px;font-weight:550;color:var(--t2);white-space:nowrap;transition:border-color .14s,color .14s,background .14s}
.cx-q svg{color:var(--acc)}
.cx-q:hover{border-color:color-mix(in srgb,var(--text) 26%,var(--line2));color:var(--text)}
.cx-q.more svg{color:var(--t3)}
.cx-panels{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;margin-top:30px;align-items:start}
.cx-panel-col{display:flex;flex-direction:column;gap:16px;min-width:0}
.cx-panel{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}
.cx-panel-h{display:flex;align-items:center;justify-content:space-between;gap:10px;height:46px;padding:0 8px 0 16px;border-bottom:1px solid var(--line)}
.cx-panel-h b{display:inline-flex;align-items:center;gap:9px;font-size:13.5px;font-weight:650;letter-spacing:-.005em}
.cx-panel-h b svg{color:var(--t3)}
.cx-panel-h button{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border-radius:7px;font-size:12.5px;font-weight:550;color:var(--t3);transition:background .12s,color .12s}
.cx-panel-h button:hover{background:var(--hover);color:var(--text)}
.cx-panel-h .cx-plan{margin-right:8px}
.cx-panel-b{display:flex;flex-direction:column;padding:6px}
.cx-li{display:flex;align-items:center;gap:11px;width:100%;min-height:44px;padding:7px 10px;border-radius:9px;text-align:left;transition:background .12s}
.cx-li:hover{background:var(--hover)}
.cx-li-ic{width:28px;height:28px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;background:var(--s2);color:var(--t2)}
.cx-li-t{flex:1;min-width:0}
.cx-li-t b{display:block;font-size:13.5px;font-weight:550;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-li-t small{display:block;margin-top:1px;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-li-m{flex-shrink:0;font-size:12px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-li-go{flex-shrink:0;color:var(--t3)}
.cx .cx-panel-empty{padding:12px 10px 10px;font-size:13px;line-height:1.5;color:var(--t3)}
.cx-today{display:flex;flex-direction:column;gap:13px;padding:15px 16px 16px}
.cx-meter-top{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--t2)}
.cx-meter-top b{font-weight:650;color:var(--text);font-variant-numeric:tabular-nums}
.cx-meter{height:6px;margin-top:9px;border-radius:6px;background:var(--s3);overflow:hidden}
.cx-meter i{display:block;height:100%;border-radius:6px;background:var(--acc)}
.cx-stat-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid var(--line);font-size:13px;color:var(--t2)}
.cx-stat-row span{display:inline-flex;align-items:center;gap:9px}
.cx-stat-row svg{color:var(--t3)}
.cx-stat-row em{padding:0 9px;font-style:normal;font-size:12.5px;font-weight:650;color:var(--ok)}
.cx-stat-row button{height:26px;padding:0 9px;border-radius:7px;font-size:12.5px;font-weight:600;color:var(--acc)}
.cx-stat-row button:hover{background:var(--acc-soft)}
.cx-home-note{padding:22px 24px 26px}

/* thread */
.cx-u-b{background:var(--user)}
.cx-md{color:var(--ans)}
.cx-dark .cx-md,.ans-serif.cx-dark .cx-md{color:var(--ans)}
.cx-md blockquote,.cx-md .md-bl{border:1px solid color-mix(in srgb,var(--acc) 22%,var(--line));border-left:3px solid var(--acc);border-radius:4px 10px 10px 4px;background:color-mix(in srgb,var(--acc) 5%,var(--surface))}
.cx.ans-sans .cx-md :is(h2,h3,h4){font-weight:650;letter-spacing:-.012em}
.cx.ans-sans .cx-md h2{font-size:1.14em}
.cx.ans-sans .cx-md h3{font-size:1.03em}

/* pages */
.cx-card,.cx-proj,.cx-ex,.cx-lib-card,.cx-dk{border-radius:14px}
.cx-card-ic,.cx-proj-ic{border:1px solid var(--line2);border-radius:10px;background:var(--s2);color:var(--acc)}
.cx .cx-card b,.cx .cx-proj b{font-size:14.5px;font-weight:650;letter-spacing:-.01em}
.cx-dk-cover{background:linear-gradient(140deg,#0F1729 0%,#16294A 60%,#1B3A6B 100%)}
.cx-dk-cover b{font-family:var(--sans);font-size:18px;font-weight:650;letter-spacing:-.015em;line-height:1.25}

@media (max-width:1000px){
  .cx-panels{grid-template-columns:1fr}
}
@media (max-width:899px){
  .cx-dash{padding:24px 16px 4px}
  .cx-dash-h{margin-bottom:14px}
  .cx .cx-home .cx-dash-h h1{font-size:24px}
  .cx-dash-date{display:none}
  .cx-quick{flex-wrap:nowrap;width:calc(100% + 32px);margin:2px -16px 0;padding:0 16px 4px;overflow-x:auto;scrollbar-width:none}
  .cx-quick::-webkit-scrollbar{display:none}
  .cx-panels{margin-top:20px;gap:12px}
  .cx-panel-col{gap:12px}
  .cx .cx-page-h h1{font-size:23px}
}
`;
