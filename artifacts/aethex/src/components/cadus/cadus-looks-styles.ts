/**
 * Three complete looks, chosen in Customize and applied with data-look on the
 * root: "clinical" (the default, the hospital-software theme in
 * cadus-clinic-styles), "editorial" (a journal: serif headings and answers,
 * warm paper, generous spacing) and "mono" (a monochrome tool: Inter, pure
 * white, hairlines, 4px corners, compact). Appended after the clinic layer.
 */
export const LOOKS: { id: "clinical" | "editorial" | "mono"; name: string; hint: string }[] = [
  { id: "clinical", name: "Clinical", hint: "Hospital software: navy and grey, steady and restrained" },
  { id: "editorial", name: "Editorial", hint: "A medical journal: serif headings and answers on warm paper" },
  { id: "mono", name: "Mono", hint: "A monochrome tool: Inter, hairlines, compact and sharp" },
];

export const CADUS_LOOKS_CSS = `
/* ============================================================ editorial */
.cx[data-look="editorial"]{--sans:"Cadus Sans",Inter,ui-sans-serif,system-ui,sans-serif;--display:"Cadus Serif",Newsreader,Georgia,serif;--r-sm:4px;--r:6px;--r-lg:8px;--r-xl:10px}
.cx-light[data-look="editorial"]{--bg:#FBFAF6;--side:#F4F2EB;--surface:#FFFFFF;--s2:#F3F1EA;--s3:#EAE7DD;--hover:rgba(40,36,30,.05);
  --line:#E6E2D8;--line2:#D6D1C4;--text:#1C1A17;--t2:#514C44;--t3:#7A7368;--primary:#1C1A17;--primary-ink:#FBFAF6;--user:#F3F1EA;--code:#F4F2EB;--ans:#23201B}
.cx-dark[data-look="editorial"]{--bg:#15130F;--side:#110F0C;--surface:#1C1915;--s2:#231F1A;--s3:#2C2721;--line:#2A251F;--line2:#3A342C;--text:#F1ECE2;--t2:#C4BBAD;--t3:#8F877A;--primary:#F1ECE2;--primary-ink:#15130F;--user:#231F1A;--code:#17140F}
.cx[data-look="editorial"] .cx-wm,.cx[data-look="editorial"] .cx-page-h h1,.cx[data-look="editorial"] .cx-home.cx-fh .cx-fh-h h1,.cx[data-look="editorial"] .cx-fh-premium .cx-fh-h h1,.cx[data-look="editorial"] .cx-section-h h2,.cx[data-look="editorial"] .cx-dialog-h h3,.cx[data-look="editorial"] .cx-legal-doc h1,.cx[data-look="editorial"] .cx-legal-doc h2,.cx[data-look="editorial"] .cx-shared-card h1,.cx[data-look="editorial"] .cx-ln-card h2{font-family:var(--display);font-weight:500;letter-spacing:-.01em}
.cx[data-look="editorial"] .cx-wm{font-size:20px}
.cx[data-look="editorial"] .cx-page-h h1,.cx[data-look="editorial"] .cx-home.cx-fh .cx-fh-h h1,.cx[data-look="editorial"] .cx-fh-premium .cx-fh-h h1{font-size:36px;line-height:1.15}
.cx[data-look="editorial"] .cx-legal-doc h1{font-size:40px}
.cx[data-look="editorial"] .cx-fh-h p{font-size:15px;color:var(--t2)}
.cx[data-look="editorial"] .cx-md{font-family:var(--serif);font-size:calc(var(--fs) + 1px);line-height:1.7}
.cx[data-look="editorial"] .cx-md :is(h2,h3,h4){font-family:var(--serif);font-weight:600;letter-spacing:-.006em;line-height:1.3}
.cx[data-look="editorial"] .cx-md h2{font-size:1.35em}
.cx[data-look="editorial"] .cx-md h3{font-size:1.15em}
.cx[data-look="editorial"] .cx-md :is(table,.md-dose,.md-sec,code,kbd){font-family:var(--sans)}
.cx[data-look="editorial"] .cx-md table{font-size:.92em}
.cx[data-look="editorial"] .cx-legal-doc p,.cx[data-look="editorial"] .cx-legal-doc li,.cx[data-look="editorial"] .cx-legal-lead{font-family:var(--serif);font-size:17px;line-height:1.7}
.cx[data-look="editorial"] .cx-side{background:var(--side);border-right:1px solid var(--line)}
.cx[data-look="editorial"] .cx-top{background:var(--bg);border-bottom:1px solid var(--line)}
.cx[data-look="editorial"] .cx-nav .cx-new{background:transparent;border:1px solid var(--line2);color:var(--text)}
.cx[data-look="editorial"] .cx-nav .cx-new:hover{background:var(--surface);filter:none}
.cx[data-look="editorial"] .cx-nav-i.on{background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.cx[data-look="editorial"] .cx-composer{border-radius:var(--r-lg);border-color:var(--line2);box-shadow:none;background:var(--surface)}
.cx[data-look="editorial"] .cx-composer:focus-within{border-color:var(--text);box-shadow:none}
.cx[data-look="editorial"] .cx-a-h{font-family:var(--sans);text-transform:uppercase;letter-spacing:.06em;font-size:11.5px;border-bottom:1px solid var(--text);padding-bottom:8px}
.cx[data-look="editorial"] .cx-a-kind{font-weight:600}
.cx[data-look="editorial"] .cx-a-h .cx-rv,.cx[data-look="editorial"] .cx-a-h .cx-conf{text-transform:none;letter-spacing:0;font-size:12px}
.cx[data-look="editorial"] .cx-fh-in{padding-top:14vh}
.cx[data-look="editorial"] .cx-fh-premium .cx-fh-recent{margin-top:52px}
.cx[data-look="editorial"] .cx-fh-sh>span{font-family:var(--sans)}
.cx[data-look="editorial"] .cx-fh-row b{font-family:var(--serif);font-weight:500;font-size:15.5px}
.cx[data-look="editorial"] .cx-btn.primary,.cx[data-look="editorial"] .cx-av{background:var(--primary);border-color:var(--primary);color:var(--primary-ink)}
.cx[data-look="editorial"] .cx-ws-ic{background:var(--s2);color:var(--text)}
.cx[data-look="editorial"] .cx-sources{background:transparent;border:0;border-top:1px solid var(--line);border-radius:0;padding-left:0;padding-right:0}
.cx[data-look="editorial"] .cx-ans blockquote.bl,.cx[data-look="editorial"] .cx-ans .bottom-line{background:transparent;border:0;border-top:1px solid var(--text);border-bottom:1px solid var(--line);border-radius:0;padding-left:0;padding-right:0}
.cx[data-look="editorial"] .cx-u{background:transparent;border:1px solid var(--line2)}

/* ============================================================ mono */
.cx[data-look="mono"]{--sans:"Cadus Sans",Inter,ui-sans-serif,system-ui,sans-serif;--r-sm:4px;--r:4px;--r-lg:6px;--r-xl:6px;font-size:13px;font-feature-settings:"cv01","cv11","ss03","tnum"}
.cx-light[data-look="mono"]{--bg:#FFFFFF;--side:#FAFAFA;--surface:#FFFFFF;--s2:#F5F5F5;--s3:#EBEBEB;--hover:rgba(0,0,0,.04);
  --line:#E6E6E6;--line2:#D4D4D4;--text:#171717;--t2:#525252;--t3:#737373;--primary:#171717;--primary-ink:#FFFFFF;--user:#F5F5F5;--code:#FAFAFA;--ans:#171717;
  --sh1:none;--sh2:0 1px 2px rgba(0,0,0,.06),0 4px 12px -6px rgba(0,0,0,.12);--sh3:0 12px 32px -12px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.06)}
.cx-dark[data-look="mono"]{--bg:#0A0A0A;--side:#0F0F0F;--surface:#141414;--s2:#1A1A1A;--s3:#262626;--hover:rgba(255,255,255,.06);--line:#262626;--line2:#333333;--text:#EDEDED;--t2:#A3A3A3;--t3:#7A7A7A;--primary:#EDEDED;--primary-ink:#0A0A0A;--user:#1A1A1A;--code:#111111;--ans:#E5E5E5}
.cx[data-look="mono"] .cx-md{font-size:var(--fs);line-height:1.65}
.cx[data-look="mono"] .cx-wm{font-size:15px;font-weight:600;letter-spacing:-.01em}
.cx[data-look="mono"] .cx-page-h h1,.cx[data-look="mono"] .cx-home.cx-fh .cx-fh-h h1,.cx[data-look="mono"] .cx-fh-premium .cx-fh-h h1{font-size:22px;font-weight:600;letter-spacing:-.02em}
.cx[data-look="mono"] .cx-fh-h p,.cx[data-look="mono"] .cx-page-h p{font-size:13px}
.cx[data-look="mono"] .cx-nav-i,.cx[data-look="mono"] .cx-row{height:30px;font-size:13px;border-radius:var(--r)}
.cx[data-look="mono"] .cx-nav .cx-new{height:30px;margin:2px 0 8px;background:var(--surface);border:1px solid var(--line2);color:var(--text);font-weight:500;box-shadow:var(--sh1)}
.cx[data-look="mono"] .cx-nav .cx-new:hover{background:var(--s2);filter:none}
.cx[data-look="mono"] .cx-nav-i.on{background:var(--s3)}
.cx[data-look="mono"] .cx-nav-i em{font-size:11px;background:transparent;color:var(--t3)}
.cx[data-look="mono"] .cx-side-head{height:48px}
.cx[data-look="mono"] .cx-top{height:44px}
.cx[data-look="mono"] .cx-picker{font-size:13px;height:28px}
.cx[data-look="mono"] .cx-btn,.cx[data-look="mono"] .cx-q,.cx[data-look="mono"] .cx-tgl{height:28px;padding:0 10px;font-size:12.5px;border-radius:var(--r)}
.cx[data-look="mono"] .cx-btn.primary,.cx[data-look="mono"] .cx-av{background:var(--primary);border-color:var(--primary);color:var(--primary-ink)}
.cx[data-look="mono"] .cx-composer{border-radius:var(--r-xl);box-shadow:var(--sh2);border-color:var(--line2)}
.cx[data-look="mono"] .cx-composer:focus-within{border-color:var(--text);box-shadow:var(--sh2)}
.cx[data-look="mono"] .cx-fh-in{padding-top:9vh}
.cx[data-look="mono"] .cx-fh-premium .cx-fh-recent{margin-top:32px}
.cx[data-look="mono"] .cx-fh-row{min-height:40px;border-radius:var(--r)}
.cx[data-look="mono"] .cx-fh-row b{font-size:13.5px;font-weight:500}
.cx[data-look="mono"] .cx-fh-row .cx-li-ic{width:24px;height:24px}
.cx[data-look="mono"] .cx-a-h{font-size:12px;gap:4px 8px}
.cx[data-look="mono"] .cx-rv,.cx[data-look="mono"] .cx-conf,.cx[data-look="mono"] .cx-badge{height:20px;font-size:11.5px;border-radius:var(--r)}
.cx[data-look="mono"] .cx-conf{background:transparent;border:1px solid var(--line2);color:var(--t2)}
.cx[data-look="mono"] .cx-conf::before{display:none}
.cx[data-look="mono"] .cx-ws-tile{border-radius:var(--r-lg);padding:10px}
.cx[data-look="mono"] .cx-ws-ic{width:32px;height:32px;border-radius:var(--r);background:var(--s2);color:var(--text)}
.cx[data-look="mono"] .cx-ans blockquote.bl,.cx[data-look="mono"] .cx-ans .bottom-line{background:var(--s2);border:1px solid var(--line);border-left:2px solid var(--text);border-radius:var(--r)}
.cx[data-look="mono"] .cx-ans table{border-radius:var(--r)}
.cx[data-look="mono"] .cx-ans .md-sec{border-radius:var(--r)}
.cx[data-look="mono"] .cx-sources{border-radius:var(--r-lg)}
.cx[data-look="mono"] .cx-u{border-radius:var(--r-lg)}
.cx[data-look="mono"] .cx-gl,.cx[data-look="mono"] .cx-more-gl,.cx[data-look="mono"] .cx-fh-sh>span{font-size:10.5px}
.cx[data-look="mono"] .cx-pop,.cx[data-look="mono"] .cx-dialog{border-radius:var(--r-lg)}
.cx[data-look="mono"] kbd{font-size:10.5px}
`;
