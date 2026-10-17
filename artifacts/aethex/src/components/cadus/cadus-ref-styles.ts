/**
 * Styles for the clinical-reference finish of Cadus: the focused home page,
 * reference-style answers (key points, evidence labels, dose cards, sources
 * beside the chat and citation previews), the clinical safety, answer history
 * and privacy pages, first-run setup and the tour, and the compact density.
 * Loaded after the other Cadus styles, so these rules layer over them.
 */
export const CADUS_REF_CSS = `
/* ================================================================ tokens */
.cx{--ev-high:var(--ok);--ev-mod:#7AA7F7;--ev-low:var(--warn);--ev-exp:var(--t2);--good:var(--ok)}
.cx-light{--ev-high:#047857;--ev-mod:#1D4ED8;--ev-low:#B45309;--ev-exp:#4A5264;--good:#047857}

/* ================================================================ clean clinical look */
.cx .cx-page-h p{max-width:660px;line-height:1.55}
.cx-empty-state{padding:56px 24px;border:1px solid var(--line);border-style:solid;background:color-mix(in srgb,var(--s2) 55%,var(--surface))}
.cx .cx-set-sub{padding:26px 0 2px;font-size:13.5px;font-weight:650;letter-spacing:-.005em;text-transform:none;color:var(--text)}
.cx-card,.cx-lib-card,.cx-ex,.cx-panel,.cx-sources,.cx-rvd{border-radius:12px}

/* ================================================================ focused home */
.cx-fh-in{position:relative;flex:1;width:100%;max-width:800px;margin:0 auto;padding:11vh 28px 28px;display:flex;flex-direction:column}
.cx-fh-h{text-align:center}
.cx .cx-home.cx-fh .cx-fh-h h1{font-family:var(--sans);font-size:30px;font-weight:650;line-height:1.2;letter-spacing:-.03em;text-align:center}
.cx .cx-fh-h p{margin-top:8px;font-size:14px;line-height:1.7;color:var(--t2);text-align:center}
.cx .cx-fh-h p b{font-weight:650;color:var(--text)}
.cx-fh-h .cx-dash-edit{margin-left:8px}
.cx-fh-badge{display:inline-flex;align-items:center;gap:5px;height:22px;margin-left:10px;vertical-align:1px;padding:0 9px;border-radius:999px;background:color-mix(in srgb,var(--good) 10%,transparent);color:var(--good);font-size:12px;font-weight:600;white-space:nowrap}
.cx-fh .cx-hero-c{max-width:none;margin-top:24px}
.cx-fh-chips{justify-content:center;gap:6px;margin-top:14px}
.cx-fh-chips .cx-q{padding:0 11px;gap:7px}
.cx-q.spec{border-color:var(--acc-line);background:color-mix(in srgb,var(--acc) 6%,var(--surface));color:var(--text)}
.cx-q.spec:hover{border-color:var(--acc)}
.cx-fh-recent{width:100%;margin-top:36px}
.cx-fh-sh{display:flex;align-items:center;justify-content:space-between;gap:12px;height:30px;margin-bottom:6px;padding:0 2px 0 4px;font-size:12.5px;font-weight:600;color:var(--t3)}
.cx-fh-sh button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border-radius:7px;font-size:12.5px;font-weight:550;color:var(--t3);transition:background .12s,color .12s}
.cx-fh-sh button:hover{background:var(--hover);color:var(--text)}
.cx-fh-sh kbd{margin-left:2px}
.cx-fh-list{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}
.cx-fh-row{display:flex;align-items:center;gap:11px;width:100%;min-height:48px;padding:8px 14px 8px 10px;border-bottom:1px solid var(--line);text-align:left;transition:background .12s}
.cx-fh-row:last-child{border-bottom:0}
.cx-fh-row:hover{background:var(--hover)}
.cx-fh-row-t{flex:1;min-width:0}
.cx-fh-row-t b{display:block;font-size:13.5px;font-weight:550;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-fh-row-t small{display:block;margin-top:1px;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-fh-row:hover .cx-li-go{color:var(--acc)}
.cx-fh-status{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.cx-fh-status button{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:6px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:12.5px;color:var(--t3);text-align:left;transition:border-color .12s,background .12s}
.cx-fh-status button:hover{border-color:color-mix(in srgb,var(--text) 22%,var(--line2));background:var(--hover)}
.cx-fh-status button>svg:first-child{flex-shrink:0;color:var(--acc)}
.cx-fh-status b{font-weight:600;color:var(--text)}
.cx-fh-status span{display:inline-flex;align-items:center;gap:3px;font-variant-numeric:tabular-nums}
.cx-fh-status em{font-style:normal;font-weight:600}
.cx-fh-status em.sick{color:var(--danger)}
.cx-home-note{flex-wrap:wrap;row-gap:2px}
.cx-home-note button{font-weight:600;color:var(--acc);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--acc) 40%,transparent);text-underline-offset:3px}
.cx-home-note button:hover{text-decoration-color:currentColor}

/* ================================================================ answers: key points, evidence, dose cards */
.cx .md-ev{--ev:var(--ev-exp);display:inline-flex;align-items:center;gap:5px;height:19px;margin:0 2px;padding:0 7px;border:1px solid color-mix(in srgb,var(--ev) 34%,transparent);border-radius:999px;background:color-mix(in srgb,var(--ev) 8%,transparent);color:var(--ev);font-family:var(--sans);font-size:11px;font-weight:650;font-style:normal;line-height:1;letter-spacing:.005em;white-space:nowrap;vertical-align:1px;cursor:help}
.cx .md-ev::before{content:"";width:5px;height:5px;flex-shrink:0;border-radius:50%;background:currentColor}
.cx .md-ev-high{--ev:var(--ev-high)}
.cx .md-ev-moderate{--ev:var(--ev-mod)}
.cx .md-ev-low{--ev:var(--ev-low)}
.cx .md-ev-expert{--ev:var(--ev-exp)}
.cx .md-ev-expert::before{background:transparent;box-shadow:inset 0 0 0 1.5px currentColor}

.cx-md .md-dose{margin:8px 0 18px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);overflow:hidden;font-family:var(--sans);font-size:.92em;line-height:1.5}
.cx-md .md-dose-h{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--acc) 6%,var(--surface))}
.cx-md .md-dose-tag{flex-shrink:0;padding:3px 7px;border-radius:6px;background:var(--acc-soft);color:var(--acc);font-size:10.5px;font-weight:700;letter-spacing:.02em}
.cx-md .md-dose-h b{min-width:0;font-size:1.04em;font-weight:650;color:var(--text)}
.cx-md .md-dose dl{margin:0}
.cx-md .md-dose-r{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;padding:8px 14px;border-bottom:1px solid var(--line)}
.cx-md .md-dose-r:last-child{border-bottom:0}
.cx-md .md-dose dt{font-size:.94em;font-weight:600;color:var(--t3)}
.cx-md .md-dose dd{margin:0;color:var(--text);font-variant-numeric:tabular-nums}
.cx-md .md-dose :is(.k-dose,.k-max) dd{font-weight:600}
.cx-md .md-dose :is(.k-renal,.k-hepatic,.k-contraindications,.k-interactions) dt{color:color-mix(in srgb,var(--ev-low) 75%,var(--t3))}

.cx-md .md-kp{margin:4px 0 18px;padding:12px 16px 2px;border:1px solid var(--line2);border-radius:12px;background:color-mix(in srgb,var(--s2) 70%,var(--surface))}
.cx-md .md-kp .md-kp-h{margin:0 0 6px;font-family:var(--sans);font-size:12.5px;font-weight:650;letter-spacing:-.005em;color:var(--t2)}
.cx-md .md-kp ul,.cx-md .md-kp ol{margin:0 0 10px}
.cx-md .md-kp li{margin:4px 0}
.cx-md .md-kp p{margin:0 0 10px}

/* citation badges open their source */
.cx-md sup.md-cite{cursor:pointer;transition:background .12s,color .12s}
.cx-md sup.md-cite:hover,.cx-md sup.md-cite:focus-visible{background:var(--acc);color:var(--on-acc)}
.cx .cx-md sup.md-cite:focus-visible{outline-offset:1px;border-radius:5px}
.cx .cx-src-h button{display:inline-flex;align-items:center;gap:5px;height:26px;margin:-4px 0 -4px auto;padding:0 8px;border-radius:7px;font-size:12px;font-weight:600;color:var(--acc);transition:background .12s}
.cx .cx-src-h button:hover{background:var(--acc-soft)}

/* an answer opened from the answer history */
.cx-a.is-flash{border-radius:12px;animation:cxFlash 1.8s ease-out}
@keyframes cxFlash{0%,35%{background:var(--acc-soft);box-shadow:0 0 0 10px var(--acc-soft)}100%{background:transparent;box-shadow:0 0 0 10px transparent}}

/* the preview card */
.cx-citecard{position:fixed;z-index:85;width:320px;max-width:calc(100vw - 24px);display:flex;align-items:flex-start;gap:10px;padding:11px 10px 11px 12px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);box-shadow:var(--sh3);animation:cxFade .12s ease-out}
.cx-citecard.above{transform:translateY(-100%)}
.cx-citecard .n{width:22px;height:22px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;background:var(--acc-soft);color:var(--acc);font-size:11px;font-weight:700}
.cx-citecard .t{flex:1;min-width:0}
.cx-citecard .t b{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;font-weight:600;line-height:1.4;color:var(--text)}
.cx-citecard .t small{display:block;margin-top:3px;font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-citecard a{width:28px;height:28px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;color:var(--t2);transition:background .12s,color .12s}
.cx-citecard a:hover{background:var(--hover);color:var(--text)}

/* ================================================================ sources beside the chat */
.cx-sp{position:relative;z-index:25;width:clamp(320px,30vw,400px);flex-shrink:0;display:flex;flex-direction:column;min-width:0;min-height:0;border-left:1px solid var(--line);background:var(--surface);animation:cxCvIn .22s ease-out}
.cx-sp-h{height:56px;flex-shrink:0;display:flex;align-items:center;gap:10px;padding:0 10px 0 14px;border-bottom:1px solid var(--line)}
.cx-sp-t{flex:1;min-width:0;line-height:1.25}
.cx-sp-t b{display:block;font-size:14px;font-weight:650}
.cx-sp-t small{display:block;margin-top:1px;font-size:12px;color:var(--t3)}
.cx .cx-sp-q{margin:12px 14px 2px;padding:9px 12px;border-left:3px solid var(--line2);border-radius:3px 9px 9px 3px;background:var(--s2);font-size:12.5px;line-height:1.5;color:var(--t2)}
.cx-sp-list{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:2px;margin:0;padding:10px 8px;list-style:none}
.cx-sp-list a{display:flex;align-items:flex-start;gap:11px;padding:10px;border-radius:10px;transition:background .12s,box-shadow .12s}
.cx-sp-list a:hover{background:var(--hover)}
.cx-sp-list li.on a{background:var(--acc-soft);box-shadow:inset 0 0 0 1px var(--acc-line)}
.cx-sp-list .n{width:22px;height:22px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;background:var(--acc-soft);color:var(--acc);font-size:11px;font-weight:700}
.cx-sp-list li.on .n{background:var(--acc);color:var(--on-acc)}
.cx-sp-list .b{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cx-sp-list .site{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-sp-list .b b{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:13.5px;font-weight:600;line-height:1.4;color:var(--text)}
.cx-sp-list .b small{font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-sp-list .go{flex-shrink:0;margin-top:3px;color:var(--t3);opacity:0;transition:opacity .12s}
.cx-sp-list a:hover .go,.cx-sp-list a:focus-visible .go{opacity:1}
.cx .cx-sp-f{flex-shrink:0;padding:12px 16px 14px;border-top:1px solid var(--line);font-size:12px;line-height:1.5;color:var(--t3)}

/* ================================================================ shared page bits: stats tiles */
.cx-sf-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.cx-sf-stats>div{padding:13px 16px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-sf-stats small{display:block;font-size:12px;line-height:1.35;color:var(--t3)}
.cx-sf-stats b{display:block;margin-top:5px;font-size:22px;font-weight:650;line-height:1.1;letter-spacing:-.02em;color:var(--text);font-variant-numeric:tabular-nums}

/* ================================================================ clinical safety */
.cx-sf-off{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 10px 10px 14px;border:1px solid color-mix(in srgb,var(--warn) 42%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--warn) 8%,transparent);font-size:13px;line-height:1.45;color:var(--text)}
.cx-sf-off>svg{flex-shrink:0;color:var(--warn)}
.cx-sf-off span{flex:1;min-width:0}
.cx-sf-sec{margin-top:30px}
.cx .cx-sf-sec h2{margin-bottom:12px;font-size:15px;font-weight:650;letter-spacing:-.01em}
.cx-sf-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none;counter-reset:none}
.cx-sf-steps li{position:relative;display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-sf-n{position:absolute;top:13px;right:14px;font-size:11.5px;font-weight:700;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-sf-ic{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--acc-soft);color:var(--acc)}
.cx-sf-steps b{font-size:14px;font-weight:650}
.cx .cx-sf-steps p{font-size:12.5px;line-height:1.55;color:var(--t2)}
.cx-sf-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.cx-sf-legend>div{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx .cx-sf-legend p{font-size:12.5px;line-height:1.55;color:var(--t2)}
.cx-sf-chips{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px}
.cx-sf-chips .md-ev{margin:0}
.cx-sf-dose{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:6px;background:var(--acc-soft);color:var(--acc);font-size:11px;font-weight:700;letter-spacing:.02em}
.cx-sf-cite{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:5px;background:var(--acc-soft);color:var(--acc);font-size:10.5px;font-weight:700;line-height:1}
.cx-sf-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 28px}
.cx-sf-list{display:flex;flex-direction:column;gap:9px;margin:0;padding:0;list-style:none}
.cx-sf-list li{display:flex;gap:10px;font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-sf-list li>svg{flex-shrink:0;margin-top:3px;color:var(--acc)}
.cx-sf-limits{margin:0;padding-left:20px;list-style:disc}
.cx-sf-limits li{margin:7px 0;padding-left:2px;font-size:13.5px;line-height:1.6;color:var(--t2)}
.cx-sf-limits li::marker{color:var(--t3)}
.cx .cx-sf-sos{display:flex;align-items:center;gap:10px;margin-top:16px;padding:11px 14px;border:1px solid color-mix(in srgb,var(--danger) 35%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--danger) 7%,transparent);font-size:13.5px;font-weight:550;color:var(--text)}
.cx-sf-sos svg{flex-shrink:0;color:var(--danger)}
.cx-sf-data{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 18px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--s2) 55%,var(--surface))}
.cx .cx-sf-data h2{margin-bottom:4px}
.cx .cx-sf-data p{max-width:620px;font-size:13px;line-height:1.55;color:var(--t2)}

/* ================================================================ answer history */
.cx-hs .cx-sf-stats{margin-bottom:18px}
.cx-hs-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
.cx-hs-tools .cx-search{width:260px}
.cx-hs-tools .cx-select{min-width:0;height:38px;appearance:auto}
.cx-hs-count{margin-left:auto;font-size:12px;color:var(--t3);font-variant-numeric:tabular-nums;white-space:nowrap}
.cx-hs-table{border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow-x:auto}
.cx-hs-table table{width:100%;min-width:760px;border-collapse:collapse;font-size:13px;line-height:1.45}
.cx-hs-table th{padding:9px 12px;border-bottom:1px solid var(--line);background:var(--s2);font-size:11.5px;font-weight:600;color:var(--t3);text-align:left;white-space:nowrap}
.cx-hs-table td{padding:9px 12px;border-bottom:1px solid var(--line);color:var(--t2);vertical-align:middle}
.cx-hs-table tbody tr:last-child td{border-bottom:0}
.cx-hs-table tbody tr:not(.cx-hs-det):hover td{background:color-mix(in srgb,var(--hover) 70%,transparent)}
.cx-hs-table td.w{font-size:12.5px;color:var(--t3);white-space:nowrap;font-variant-numeric:tabular-nums}
.cx-hs-table td.q{width:38%;max-width:380px}
.cx-hs-table td.q button{display:flex;align-items:flex-start;gap:6px;width:100%;text-align:left;font-weight:550;color:var(--text)}
.cx-hs-table td.q span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cx-hs-table td.q .chev{flex-shrink:0;margin-top:2px;color:var(--t3);transition:transform .15s}
.cx-hs-table tr.open td.q .chev{transform:rotate(180deg)}
.cx-hs-table tr.open td{background:var(--hover);border-bottom-color:transparent}
.cx-hs-table td.m{white-space:nowrap}
.cx-hs-table td.m small{display:block;font-size:11.5px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-hs-table td:nth-child(5){white-space:nowrap}
.cx-hs-table td .cx-conf{margin:3px 0 0 6px}
.cx-hs-table td.n{text-align:center;font-variant-numeric:tabular-nums}
.cx-hs-table td.o{width:48px;text-align:right}
.cx-hs-table .gone{font-size:11.5px;color:var(--t3)}
.cx-hs-st{--st:var(--t2);display:inline-flex;align-items:center;gap:5px;height:22px;margin-top:3px;padding:0 9px;border:1px solid color-mix(in srgb,var(--st) 32%,transparent);border-radius:999px;background:color-mix(in srgb,var(--st) 8%,transparent);color:var(--st);font-size:11.5px;font-weight:600;white-space:nowrap}
.cx-hs-st.approved{--st:var(--good)}
.cx-hs-st.corrected{--st:var(--ev-mod)}
.cx-hs-st.unreviewed{--st:var(--ev-low)}
.cx-hs-st.library{--st:var(--t2)}
.cx-hs-st.stopped{--st:var(--t3)}
.cx-hs-st.error{--st:var(--danger)}
.cx-hs-table tr.cx-hs-det td{padding:4px 16px 16px 38px;background:var(--hover)}
.cx-hs-det dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 28px;margin:0}
.cx-hs-det dt{font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-hs-det dd{margin:3px 0 0;font-size:13px;line-height:1.5;color:var(--text)}
.cx-hs-det ul{margin:0;padding-left:18px;list-style:disc}
.cx-hs-det li{margin:2px 0}
.cx .cx-hs-none{padding:24px;font-size:13px;color:var(--t3);text-align:center}
.cx-hs .cx-rs-foot{margin-top:12px}

/* ================================================================ privacy centre */
.cx-pv-guard{margin-bottom:16px;padding:18px;border:1px solid var(--line2);border-radius:14px;background:var(--surface)}
.cx-pv-guard-h{display:flex;align-items:flex-start;gap:14px}
.cx-pv-guard-h>div{flex:1;min-width:0}
.cx-pv-guard-h b{display:block;font-size:15px;font-weight:650;letter-spacing:-.01em}
.cx .cx-pv-guard-h p{margin-top:4px;font-size:13px;line-height:1.55;color:var(--t2)}
.cx-pv-guard-h .cx-switch{margin-top:4px}
.cx-pv-ic{width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--s2);color:var(--t2)}
.cx-pv-ic.big{width:40px;height:40px;border-radius:11px;background:var(--acc-soft);color:var(--acc)}
.cx-pv-try{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
.cx-pv-try label,.cx-pv-out{display:flex;flex-direction:column;gap:6px;min-width:0}
.cx-pv-try label>span,.cx-pv-out>span{font-size:12px;font-weight:600;color:var(--t3)}
.cx-pv-try textarea{width:100%;min-height:76px;padding:10px 12px;border:1px solid var(--line2);border-radius:10px;background:var(--bg);font-size:13px;line-height:1.55;resize:vertical}
.cx-pv-try textarea:focus{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx .cx-pv-out p{flex:1;min-height:76px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--s2);font-size:13px;line-height:1.7;color:var(--text);overflow-wrap:anywhere}
.cx-pv-out mark{padding:1px 6px;border-radius:5px;background:var(--acc-soft);color:var(--acc);font-size:.92em;font-weight:600}
.cx .cx-pv-note{margin-top:10px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-pv-cols{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:16px;align-items:start}
.cx-pv-side{display:flex;flex-direction:column;gap:16px;min-width:0}
.cx-pv-sec{padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx .cx-pv-sec h2{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14.5px;font-weight:650;letter-spacing:-.01em}
.cx-pv-sec h2 svg{color:var(--t3)}
.cx-pv-sec.danger{border-color:color-mix(in srgb,var(--danger) 30%,var(--line))}
.cx-pv-sec.danger h2 svg{color:var(--danger)}
.cx-pv-sec.danger .cx-pv-note{margin:0 0 12px}
.cx-pv-list{display:flex;flex-direction:column}
.cx-pv-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
.cx-pv-item:last-child{border-bottom:0;padding-bottom:2px}
.cx-pv-t{flex:1;min-width:0}
.cx-pv-t b{display:block;font-size:13.5px;font-weight:600}
.cx-pv-t small{display:block;margin-top:1px;font-size:12px;color:var(--t3)}
.cx-pv-acts{display:flex;gap:6px;flex-shrink:0}
.cx-pv-acts .cx-btn{height:30px;padding:0 11px;font-size:12.5px}
.cx-pv-bul{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.cx-pv-bul li{position:relative;padding-left:20px;font-size:13px;line-height:1.5;color:var(--t2)}
.cx-pv-bul li::before{content:"";position:absolute;left:5px;top:.62em;width:6px;height:6px;border-radius:50%;background:var(--t3)}
.cx-pv-bul.ok li::before{left:3px;top:.38em;width:5px;height:9px;border-radius:0;background:none;border:solid var(--good);border-width:0 2px 2px 0;transform:rotate(45deg)}
.cx-pv-sec .cx-pv-note{margin-top:12px}

/* ================================================================ practitioner badge, settings links */
.cx-prof-badge,.cx-set-badge{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;width:max-content;max-width:100%;min-height:24px;margin-top:2px;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--good) 10%,transparent);color:var(--good);font-size:12px;font-weight:600;line-height:1.3}
.cx-set-badge{margin-top:8px}
.cx .cx-acct-head small.cx-acct-badge{display:flex;align-items:center;gap:5px;margin-top:4px;color:var(--good);font-weight:600;white-space:normal;line-height:1.35}
.cx-acct-badge svg{flex-shrink:0}
.cx-set-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:16px 0 6px}
.cx-set-links button{display:flex;align-items:flex-start;gap:11px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);text-align:left;transition:border-color .12s,background .12s}
.cx-set-links button:hover{border-color:var(--acc-line);background:color-mix(in srgb,var(--acc) 4%,var(--surface))}
.cx-set-links button>svg{flex-shrink:0;margin-top:2px;color:var(--acc)}
.cx-set-links b{display:block;font-size:13.5px;font-weight:600}
.cx-set-links small{display:block;margin-top:2px;font-size:12px;line-height:1.4;color:var(--t3)}
.cx-ob-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}

/* ================================================================ first-run setup */
.cx-light .cx-overlay.cx-ob-wrap{background:rgba(15,23,42,.46)}
.cx-dialog.cx-ob{max-width:560px;min-height:min(560px,calc(100vh - 32px))}
.cx-ob-top{display:flex;align-items:center;gap:10px;padding:20px 28px 0}
.cx-ob-top .cx-ib{width:30px;height:30px;margin:-8px -14px -8px 0}
.cx-ob-prog{flex:1;display:flex;gap:6px}
.cx-ob-prog span{flex:1;height:4px;border-radius:4px;background:var(--s3);transition:background .2s}
.cx-ob-prog span.done{background:color-mix(in srgb,var(--acc) 50%,var(--s3))}
.cx-ob-prog span.on{background:var(--acc)}
.cx-ob-b{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:stretch;padding:24px 28px 12px}
.cx .cx-ob-b>h2:focus{outline:none}
.cx-ob-b>h2{margin-top:2px;font-size:22px;font-weight:650;line-height:1.25;letter-spacing:-.022em}
.cx-ob-b>svg:first-child+h2,.cx-ob-done+h2{margin-top:16px}
.cx .cx-ob-lead{margin-top:6px;font-size:14px;line-height:1.55;color:var(--t2)}
.cx-ob-why{display:flex;flex-direction:column;gap:12px;margin:20px 0;padding:0;list-style:none}
.cx-ob-why li{display:flex;align-items:flex-start;gap:12px;font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-ob-why li>svg{flex-shrink:0;margin-top:1px;color:var(--acc)}
.cx-ob-why b{font-weight:650;color:var(--text)}
.cx-ob-ack{align-items:flex-start}
.cx-ob-ack .cx-tg-box{margin-top:1px}
.cx-ob-ack .cx-tg-l{font-size:13px;line-height:1.5}
.cx-ob-b .cx-roles{margin-top:18px}
.cx-ob-form{display:flex;flex-direction:column;gap:16px;margin-top:20px}
.cx-ob select.cx-input{appearance:auto;padding-right:8px!important}
.cx-seg.cx-ob-seg{display:flex;width:100%}
.cx-ob-seg button{flex:1;justify-content:center}
.cx-ob-done{width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:color-mix(in srgb,var(--good) 13%,transparent);color:var(--good)}
/* the last step: a centred summary */
.cx-ob-b:has(.cx-ob-done){align-items:center;justify-content:center;text-align:center;padding-bottom:32px}
.cx-ob-b:has(.cx-ob-done) .cx-ob-lead{max-width:420px}
.cx .cx-ob-small{margin-top:14px;font-size:13px;line-height:1.5;color:var(--t3)}
.cx-ob-f{display:flex;align-items:center;gap:8px;padding:16px 28px 20px;border-top:1px solid var(--line)}
.cx-ob-sp{flex:1}
.cx-ob-skip{height:34px;padding:0 8px;border-radius:9px;font-size:13px;font-weight:550;color:var(--t3);transition:color .12s,background .12s}
.cx-ob-skip:hover{background:var(--hover);color:var(--text)}

/* ================================================================ tour */
.cx-tour{position:fixed;inset:0;z-index:110}
.cx-tour-spot{position:absolute;border-radius:12px;box-shadow:0 0 0 2px var(--acc),0 0 0 9999px rgba(6,10,20,.55);pointer-events:none;transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease}
.cx-light .cx-tour-spot{box-shadow:0 0 0 2px var(--acc),0 0 0 9999px rgba(15,23,42,.42)}
.cx-tour-card{position:absolute;display:flex;flex-direction:column;gap:6px;padding:12px 14px 12px 16px;border:1px solid var(--line2);border-radius:14px;background:var(--surface);box-shadow:var(--sh3);animation:cxPop .16s ease-out;transition:left .25s ease,top .25s ease}
.cx-tour-h{display:flex;align-items:center;justify-content:space-between;margin-right:-6px;font-size:11.5px;font-weight:600;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-tour-h .cx-ib{width:28px;height:28px}
.cx-tour-card>b{font-size:15px;font-weight:650;letter-spacing:-.01em}
.cx .cx-tour-card p{font-size:13px;line-height:1.55;color:var(--t2)}
.cx-tour-f{display:flex;align-items:center;gap:6px;margin-top:8px}
.cx-tour-skip{margin-right:auto;height:30px;padding:0 6px;border-radius:7px;font-size:12.5px;font-weight:550;color:var(--t3)}
.cx-tour-skip:hover{color:var(--text)}
.cx-tour-f .cx-btn{height:32px}

/* ================================================================ compact density */
.cx.is-compact .cx-top{height:50px}
.cx.is-compact .cx-side-head{height:52px}
.cx.is-compact .cx-nav-i{height:32px}
.cx.is-compact .cx-row{height:31px}
.cx.is-compact .cx-thread{gap:24px;padding-top:20px}
.cx.is-compact .cx-md{font-size:calc(var(--fs) * .95);line-height:1.62}
.cx.is-compact .cx-md p{margin-bottom:10px}
.cx.is-compact .cx-md :is(ul,ol){margin-bottom:10px}
.cx.is-compact .cx-md li{margin:3px 0}
.cx.is-compact .cx-md :is(h2,h3,h4){margin:18px 0 7px}
.cx.is-compact .cx-md :is(th,td){padding:7px 11px}
.cx.is-compact .cx-md .md-dose-r{padding:6px 12px}
.cx.is-compact .cx-md .md-dose-h{padding:8px 12px}
.cx.is-compact .cx-md .md-kp{padding:10px 14px 0}
.cx.is-compact .cx-sources{padding:10px}
.cx.is-compact .cx-sources a{padding:6px 9px}
.cx.is-compact .cx-page{padding-top:28px}
.cx.is-compact .cx-page-h{margin-bottom:18px}
.cx.is-compact .cx-set-row{padding:12px 0}
.cx.is-compact .cx-fh-in{padding-top:8vh}
.cx.is-compact .cx-fh-row{min-height:40px;padding-top:6px;padding-bottom:6px}
.cx.is-compact .cx-li{min-height:38px;padding-top:5px;padding-bottom:5px}
.cx.is-compact .cx-hs-table :is(th,td){padding-top:6px;padding-bottom:6px}
.cx.is-compact .cx-sf-stats>div{padding:10px 14px 11px}
.cx.is-compact .cx-sf-stats b{font-size:19px}
.cx.is-compact .cx-sp-list a{padding:8px}
.cx.is-compact .cx-pv-item{padding:8px 0}

/* ================================================================ responsive */
@media (max-width:1120px){
  .cx-sf-steps{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-pv-cols{grid-template-columns:1fr}
}
@media (max-width:899px){
  .cx-fh-in{padding:24px 16px 32px}
  .cx .cx-home.cx-fh .cx-fh-h h1{font-size:24px}
  .cx .cx-fh-h p{font-size:13.5px}
  .cx-fh-badge{margin-left:8px}
  .cx-fh-chips{justify-content:flex-start}
  .cx-fh-recent{margin-top:28px}
  .cx-fh-sh button kbd{display:none}
  .cx-fh-status button{flex:1 1 calc(50% - 4px)}
  .cx-sp{position:fixed;inset:0;z-index:96;width:auto;border-left:0;animation:cxFade .18s ease-out}
  .cx-citecard{display:none}
  .cx-sf-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-sf-stats b{font-size:19px}
  .cx-sf-steps,.cx-sf-legend,.cx-sf-two,.cx-pv-try,.cx-set-links,.cx-hs-det dl,.cx-ob-two{grid-template-columns:1fr}
  .cx-sf-off{flex-wrap:wrap}
  .cx-sf-off .cx-btn{width:100%;justify-content:center}
  .cx-sf-data{flex-direction:column;align-items:stretch}
  .cx-sf-data .cx-btn{justify-content:center}
  .cx-hs-tools .cx-search{width:100%}
  .cx-hs-tools .cx-select{flex:1}
  .cx-hs-count{width:100%;margin-left:0}
  .cx-hs-table tr.cx-hs-det td{padding-left:16px}
  .cx-pv-guard{padding:14px}
  .cx-pv-item{flex-wrap:wrap}
  .cx-pv-acts{width:100%;padding-left:44px}
  .cx-md .md-dose-r{grid-template-columns:1fr;gap:1px}
  .cx-dialog.cx-ob{min-height:0}
  .cx-ob-top{padding:16px 18px 0}
  .cx-ob-b{padding:18px 18px 8px}
  .cx-ob-f{flex-wrap:wrap;padding:12px 18px 16px}
  .cx-ob-f .cx-btn.primary{flex:1;justify-content:center}
  .cx-tour-card{left:12px!important;width:calc(100vw - 24px)!important}
}
`;
