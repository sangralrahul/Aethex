/**
 * The hospital-software theme: restrained navy and grey, tighter radii, a
 * steady type scale and no decoration. Appended last, so it overrides the
 * earlier layers without touching them.
 */
export const CADUS_CLINIC_CSS = `
/* ------------------------------------------------------------ tokens */
.cx{--r-sm:6px;--r:8px;--r-lg:10px;--r-xl:12px;letter-spacing:0}
.cx-light{--bg:#FFFFFF;--side:#F6F7F9;--surface:#FFFFFF;--s2:#F2F4F7;--s3:#E8EBF0;--hover:rgba(17,24,39,.045);
  --line:#E2E6EC;--line2:#CFD5DE;--text:#111827;--t2:#3F4A5C;--t3:#5F6A82;
  --primary:#1F3F7A;--primary-ink:#FFFFFF;--user:#F2F4F7;--code:#F6F7F9;
  --sh2:0 1px 2px rgba(17,24,39,.05),0 6px 18px -10px rgba(17,24,39,.14);--sh3:0 16px 40px -16px rgba(17,24,39,.22),0 0 0 1px rgba(17,24,39,.05)}
.cx-dark .cx-tip:hover::after,.cx-dark .cx-toast{background:#EEF1F6;color:#0B1220}
.cx-dark{--bg:#0C1322;--side:#0A101C;--surface:#121A2B;--s2:#17213A;--s3:#1F2A45;--line:#1C2740;--line2:#2A3552;--text:#EEF1F6;--t2:#B3BCCB;--t3:#8591A6;
  --primary:#8DB4F5;--primary-ink:#0B1220;--user:#17213A;--code:#0E1626}

/* ------------------------------------------------------------ type scale */
.cx .cx-page-h h1,.cx .cx-home.cx-fh .cx-fh-h h1,.cx .cx-fh-premium .cx-fh-h h1{font-size:26px;font-weight:600;letter-spacing:-.02em;line-height:1.25}
.cx .cx-page-h p{font-size:14px;color:var(--t2)}
.cx .cx-section-h h2,.cx .cx-ln-card h2,.cx .cx-shared-cm h2{font-size:16px;font-weight:600;letter-spacing:-.01em}
.cx .cx-fh-h p{font-size:14px}
.cx-wm{font-weight:600;letter-spacing:-.02em}
.cx .cx-wm small{font-weight:500;color:var(--t3)}
.cx-gl,.cx-more-gl,.cx-fh-sh>span,.cx-src-h span,.cx-pop-gl{letter-spacing:.06em;text-transform:uppercase;font-size:11px;font-weight:600;color:var(--t3)}

/* ------------------------------------------------------------ surfaces and controls */
.cx-composer,.cx-fh-premium .cx-hero-c .cx-composer{border-radius:var(--r-xl);box-shadow:var(--sh1);border-color:var(--line2)}
.cx-composer:focus-within{border-color:var(--acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 14%,transparent)}
.cx-btn,.cx-q,.cx-input,.cx-select,.cx-tgl,.cx-pick,.cx-pop-i,.cx-act{border-radius:var(--r)}
.cx-btn{font-weight:550}
.cx-btn.primary{background:var(--primary);border-color:var(--primary);color:var(--primary-ink)}
.cx-btn.primary:hover{filter:brightness(1.08)}
.cx-pop,.cx-dialog,.cx-card,.cx-ex,.cx-fh-list,.cx-dr-card,.cx-ln-card,.cx-cs-panel,.cx-shared-card,.cx-shared-cm,.cx-set,.cx-empty-state,.cx-sources{border-radius:var(--r-lg)}
.cx-nav-i,.cx-row,.cx-more .cx-nav-i,.cx-fh-premium .cx-fh-row{border-radius:var(--r-sm)}
.cx-rv,.cx-conf,.cx-badge,.cx-instchip,.cx-libchip,.cx-fh-badge,.cx-shared-tag,.cx-u-mode{border-radius:var(--r-sm)}
.cx-nav .cx-new{margin:4px 0 10px;height:36px;background:var(--primary);border:1px solid var(--primary);color:var(--primary-ink);font-weight:600;border-radius:var(--r)}
.cx-nav .cx-new:hover{filter:brightness(1.08);border-color:var(--primary)}
.cx-nav .cx-new .cx-new-ic{color:inherit}
.cx-nav .cx-new kbd{display:none}
.cx-nav-i.on{background:var(--s3);color:var(--text)}
.cx-nav-i.on::before{display:none}
.cx-nav-i em{background:var(--s3);color:var(--t2);font-weight:600}
.cx-side{border-right:1px solid var(--line)}
.cx-top{height:52px;border-bottom:1px solid var(--line);background:var(--bg)}
.cx-top.lined{border-bottom-color:var(--line)}
.cx-picker{font-weight:600;font-size:14px;padding:0 8px}
.cx-picker>span{font-weight:500;color:var(--t2)}
.cx-acct{border-radius:var(--r)}
.cx-acct-t b{font-weight:600}
.cx-acct-t small{color:var(--t3)}
.cx-av{border-radius:50%;background:var(--primary);color:var(--primary-ink);font-weight:600}

/* ------------------------------------------------------------ home: nothing decorative */
.cx-fh-wash,.cx-fh-mark{display:none}
.cx-fh-premium .cx-fh-h,.cx-fh-premium .cx-fh-chips,.cx-fh-premium .cx-fh-ws,.cx-fh-premium .cx-fh-recent,.cx-ws-tile{animation:none}
.cx-fh-premium .cx-fh-chips .cx-q{color:var(--t2)}
.cx-fh-premium .cx-fh-chips .cx-q.more{color:var(--acc)}
.cx-fh-premium .cx-fh-row .cx-li-ic{border-radius:var(--r-sm)}
.cx-ws-tile{--tone:var(--acc);border-radius:var(--r-lg);backdrop-filter:none;-webkit-backdrop-filter:none;background:var(--surface);box-shadow:none}
.cx-ws-tile:hover{transform:none;border-color:var(--line2);box-shadow:var(--sh1)}
.cx-ws-ic{border-radius:var(--r);background:var(--s2);box-shadow:none;color:var(--acc)}
.cx-ws-tile.tone-teal,.cx-ws-tile.tone-violet,.cx-ws-tile.tone-rose,.cx-ws-tile.tone-amber,.cx-ws-tile.tone-sky,.cx-ws-tile.tone-lime{--tone:var(--acc)}
.cx-home-note{color:var(--t3)}

/* ------------------------------------------------------------ answers as clinical reports */
.cx-a-h{gap:6px 10px;padding-bottom:10px;margin-bottom:14px;border-bottom:1px solid var(--line);font-size:13px}
.cx-a>.cx-a-h>svg:first-child{display:none}
.cx-a-kind{font-weight:600;color:var(--text)}
.cx-a-model,.cx-a-time{color:var(--t3);font-size:12.5px}
.cx-a-model::before,.cx-a-time::before{content:"·";margin-right:10px;color:var(--line2)}
.cx-a-h .cx-rv,.cx-a-h .cx-conf{height:22px}
.cx-a-h .cx-rv{margin-left:4px}
.cx-rv{background:transparent;border:1px solid var(--line2);color:var(--t2)}
.cx-sources{border:1px solid var(--line);background:var(--surface)}
.cx-src-h{font-size:12.5px}
.cx-a-acts .cx-act{border-radius:var(--r-sm)}
.cx-u{border-radius:var(--r-lg)}
.cx-ans .md-sec{border-radius:var(--r)}
.cx-ans table{border-radius:var(--r)}
.cx-ans blockquote.bl,.cx-ans .bottom-line{border-radius:var(--r);border-left-width:3px}

/* ------------------------------------------------------------ pages, tools, tiles */
.cx-tabs{border-radius:var(--r)}
.cx-tabs button{border-radius:var(--r-sm)}
.cx-ex{border-radius:var(--r-lg)}
.cx-qz-card,.cx-qz-opt,.cx-ln-mockbar,.cx-ln-sylsub,.cx-dr-item,.cx-dr-ix,.cx-share-qr,.cx-read-pick,.cx-att{border-radius:var(--r)}
.cx-trust{color:var(--t3)}

/* ------------------------------------------------------------ sign-in and shared */
.cx-si-card,.cx-si-brand{border-radius:var(--r-lg)}
.cx-si .cx-btn.primary{background:var(--primary);border-color:var(--primary)}

.cx-home-legal{display:inline-flex;gap:12px;margin-left:14px}
.cx-home-legal a{color:var(--t3)}
.cx-home-legal a:hover{color:var(--text);text-decoration:underline}
.cx-set-legal{display:flex;gap:12px;flex-shrink:0}
.cx-si-foot a{color:var(--t2);text-decoration:underline;text-underline-offset:2px}
.cx-set-look{align-items:flex-start}
.cx-look-pick{display:grid;grid-template-columns:repeat(3,112px);gap:8px;flex-shrink:0}
.cx-look-pick button{display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid var(--line);border-radius:var(--r);text-align:left;background:var(--surface)}
.cx-look-pick button:hover{border-color:var(--line2)}
.cx-look-pick button.on{border-color:var(--acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 20%,transparent)}
.cx-look-pick b{font-size:12.5px;font-weight:600;color:var(--text)}
.cx-look-pick small{font-size:11px;line-height:1.3;color:var(--t3);white-space:normal}
.cx-look-prev{display:flex;gap:4px;width:100%;height:46px;padding:5px;border-radius:4px;overflow:hidden}
.cx-look-prev i{width:22%;border-radius:2px}
.cx-look-prev em{flex:1;display:flex;flex-direction:column;gap:4px;padding-top:4px}
.cx-look-prev em b{display:block;height:4px;border-radius:2px;width:70%}
.cx-look-prev em b:nth-child(2){width:95%;height:3px}.cx-look-prev em b:nth-child(3){width:55%;height:3px}
.look-clinical .cx-look-prev{background:#F6F7F9;border:1px solid #E2E6EC}.look-clinical .cx-look-prev i{background:#1F3F7A}.look-clinical .cx-look-prev em b{background:#9AA5B8}
.look-editorial .cx-look-prev{background:#FBFAF6;border:1px solid #E6E2D8}.look-editorial .cx-look-prev i{background:#F4F2EB;border:1px solid #D6D1C4}.look-editorial .cx-look-prev em b{background:#1C1A17}.look-editorial .cx-look-prev em b:first-child{height:6px;width:60%}
.look-mono .cx-look-prev{background:#FFFFFF;border:1px solid #E6E6E6}.look-mono .cx-look-prev i{background:#FAFAFA;border:1px solid #E6E6E6}.look-mono .cx-look-prev em b{background:#171717;height:3px}
.cx-gate{position:fixed;inset:0;display:grid;place-items:center;background:var(--bg);color:var(--text)}
.cx-gate-in{display:flex;flex-direction:column;align-items:center;gap:14px;font-size:14px;color:var(--t2)}
.cx-upgrade{max-width:460px}
.cx-up-now,.cx-up-price{font-size:13.5px;color:var(--t2);margin-bottom:10px}
.cx-up-list{margin:0 0 14px;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.cx-up-list li{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.45}
.cx-up-list li svg{flex-shrink:0;margin-top:3px;color:var(--ok)}
.cx-up-acts{display:flex;gap:8px}
.cx-up-foot{margin-top:12px;font-size:12px;color:var(--t3);line-height:1.5}
.cx-usage-up{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;font-weight:600;color:var(--acc)}
.cx-usage-up:hover{text-decoration:underline}
.cx-nav-plan{font-size:10.5px!important;text-transform:uppercase;letter-spacing:.05em}
.cx-locked{align-items:flex-start;text-align:left}
.cx-si-eyebrow{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:12px}
.cx-si-plans{max-width:440px;margin-top:24px;font-size:13.5px;line-height:1.6;color:var(--t2)}
.cx-si-plans a{color:var(--text);text-decoration:underline;text-underline-offset:2px}
a.cx-plan{text-decoration:none}a.cx-plan:hover{text-decoration:underline}
@media (max-width:860px){.cx .cx-fh-premium .cx-fh-h h1{font-size:23px}.cx-home-legal{margin-left:0}.cx-look-pick{grid-template-columns:repeat(3,minmax(0,1fr));width:100%}}
`;
