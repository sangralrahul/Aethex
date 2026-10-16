/**
 * Styles for the Cadus professional tools: calculators, the interaction checker,
 * the practice hub, the profile dialog, the privacy guard and the answer extras
 * (interaction notice, next steps, edit and resend). Loaded after CADUS_CSS and
 * scoped under `.cx`, using the same design tokens.
 */
export const CADUS_TOOLS_CSS = `
.cx{--info:#2563EB}
.cx-dark{--info:#60A5FA}

/* ================================================================ composer: privacy guard */
.cx-guard{display:flex;align-items:center;gap:8px;margin:10px 14px 0;padding:7px 11px;border:1px solid color-mix(in srgb,var(--ok) 30%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--ok) 7%,var(--surface));color:var(--t2);font-size:12.5px;line-height:1.4;animation:cxFade .14s ease-out}
.cx-guard svg{flex-shrink:0;color:var(--ok)}

/* ================================================================ home additions */
.cx-dash-edit{display:inline-flex;align-items:center;gap:5px;margin-left:10px;padding:2px 8px;border-radius:7px;font-size:12.5px;font-weight:600;color:var(--acc);vertical-align:1px;transition:background .12s}
.cx-dash-edit:hover{background:var(--acc-soft)}
.cx-dash-h p b{font-weight:650;color:var(--text)}
.cx-mini{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px}
.cx-mini-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.cx-mini-stats div{padding:10px 12px;border-radius:10px;background:var(--s2)}
.cx-mini-stats b{display:flex;align-items:center;gap:5px;font-size:18px;font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.cx-mini-stats b svg{color:#EA580C}
.cx-mini-stats small{font-size:11.5px;color:var(--t3)}
.cx-mini-rev{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;height:30px;padding:0 10px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--acc)}
.cx-mini-rev:hover{background:var(--acc-soft)}
.cx-tool-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:12px}
.cx-tool-grid button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:6px 8px;border:1px solid var(--line);border-radius:9px;background:var(--s2);font-size:12.5px;font-weight:550;color:var(--t2);text-align:center;transition:border-color .12s,color .12s,background .12s}
.cx-tool-grid button:hover{border-color:var(--acc-line);background:var(--acc-soft);color:var(--acc)}
.cx-tool-grid button.ix{grid-column:span 3;background:var(--surface);color:var(--text)}
.cx-tool-grid button.ix svg{color:var(--acc)}

/* ================================================================ thread: user messages */
.cx-u-notes{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:80%}
.cx-u-priv{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border:1px solid color-mix(in srgb,var(--ok) 30%,var(--line));border-radius:999px;background:color-mix(in srgb,var(--ok) 7%,var(--surface));color:var(--t2);font-size:11.5px;font-weight:550;cursor:default}
.cx-u-priv svg{color:var(--ok)}
.cx-u-acts{display:flex;gap:2px;margin:-2px -4px 0 0;opacity:0;transition:opacity .12s}
.cx-u:hover .cx-u-acts,.cx-u-acts:focus-within{opacity:1}
.cx-u-acts .cx-act{width:28px;height:28px}
.cx-u-edit{width:min(100%,640px);border:1px solid var(--acc-line);border-radius:16px;background:var(--surface);box-shadow:0 0 0 3px var(--acc-soft);overflow:hidden}
.cx-u-edit textarea{display:block;width:100%;min-height:96px;max-height:320px;padding:14px 16px 6px;resize:vertical;font-size:var(--fs-u,15px);line-height:1.6}
.cx-u-edit-f{display:flex;align-items:center;gap:8px;padding:8px 10px 10px 16px}
.cx-u-edit-f span{flex:1;min-width:0;font-size:12px;color:var(--t3)}
@media (hover:none){.cx-u-acts{opacity:1}}

/* ================================================================ thread: interaction check */
.cx-ixn{border:1px solid color-mix(in srgb,var(--warn) 38%,var(--line));border-radius:14px;background:color-mix(in srgb,var(--warn) 5%,var(--surface));overflow:hidden}
.cx-ixn.major{border-color:color-mix(in srgb,var(--danger) 38%,var(--line));background:color-mix(in srgb,var(--danger) 4%,var(--surface))}
.cx-ixn summary{display:flex;align-items:center;gap:9px;padding:11px 14px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer;list-style:none;user-select:none}
.cx-ixn summary::-webkit-details-marker{display:none}
.cx-ixn summary>svg:first-child{flex-shrink:0;color:var(--warn)}
.cx-ixn.major summary>svg:first-child{color:var(--danger)}
.cx-ixn summary span{flex:1;min-width:0}
.cx-ixn summary .chev{flex-shrink:0;color:var(--t3);transition:transform .15s}
.cx-ixn[open] summary .chev{transform:rotate(180deg)}
.cx-tag{flex-shrink:0;padding:2px 8px;border-radius:999px;background:var(--s2);color:var(--t2);font-style:normal;font-size:10.5px;font-weight:650;letter-spacing:.02em;white-space:nowrap}
.cx-ixn-b{display:flex;flex-direction:column;gap:8px;padding:0 12px 12px}
.cx-ixn-f{display:flex;align-items:center;gap:12px;padding:4px 2px 0;font-size:12px;line-height:1.45;color:var(--t3)}
.cx-ixn-f span{flex:1;min-width:0}
.cx-ixn-f button{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:30px;padding:0 10px;border:1px solid var(--line2);border-radius:8px;background:var(--surface);font-size:12.5px;font-weight:550;color:var(--text)}
.cx-ixn-f button:hover{background:var(--hover)}
.cx-ixi{padding:11px 13px;border:1px solid var(--line);border-left:3px solid var(--t3);border-radius:4px 10px 10px 4px;background:var(--surface)}
.cx-ixi.major{border-left-color:var(--danger)}
.cx-ixi.moderate{border-left-color:var(--warn)}
.cx-ixi.minor{border-left-color:var(--info)}
.cx-ixi-h{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:5px}
.cx-ixi-h b{font-size:13.5px;font-weight:650}
.cx .cx-ixi p{font-size:13px;line-height:1.5;color:var(--t2)}
.cx .cx-ixi p.act{margin-top:4px;color:var(--text)}
.cx .cx-ixi p.act b{font-weight:650}
.cx .cx-ixi p.mech{margin-top:4px;font-size:12px;color:var(--t3)}
.cx-sev{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;white-space:nowrap}
.cx-sev.major{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}
.cx-sev.moderate{background:color-mix(in srgb,var(--warn) 15%,transparent);color:var(--warn)}
.cx-sev.minor{background:color-mix(in srgb,var(--info) 12%,transparent);color:var(--info)}

/* ================================================================ thread: next steps */
.cx-next{display:flex;flex-direction:column;gap:8px;margin-top:2px}
.cx-next-row{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.cx-next-l{margin-right:4px;font-size:12px;font-weight:600;color:var(--t3)}
.cx-chip2{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 12px;border:1px solid var(--line2);border-radius:999px;background:var(--surface);font-size:12.5px;font-weight:550;color:var(--t2);white-space:nowrap;transition:border-color .12s,color .12s,background .12s}
.cx-chip2 svg{color:var(--acc)}
.cx-chip2:hover{border-color:var(--acc-line);color:var(--text);background:var(--acc-soft)}
.cx-ward-lang{display:inline-flex;align-items:center;border:1px solid var(--line2);border-radius:999px;background:var(--surface);overflow:hidden}
.cx-ward-lang .cx-chip2{border:0;border-radius:0}
.cx-ward-lang select{height:32px;padding:0 8px!important;border-left:1px solid var(--line2)!important;font-size:12px;color:var(--t2);cursor:pointer}

/* ================================================================ dock: viva / OSCE */
.cx-sim-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;padding:8px 8px 8px 14px;border:1px solid var(--acc-line);border-radius:12px;background:color-mix(in srgb,var(--acc) 6%,var(--surface));font-size:13px;color:var(--t2)}
.cx-sim-bar span{display:inline-flex;align-items:center;gap:8px;min-width:0}
.cx-sim-bar span svg{flex-shrink:0;color:var(--acc)}
.cx-sim-bar button{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:30px;padding:0 12px;border-radius:8px;background:var(--primary);color:var(--primary-ink);font-size:12.5px;font-weight:600}
.cx-sim-bar button:hover{opacity:.9}

/* ================================================================ shared option chips */
.cx-opts{display:flex;flex-wrap:wrap;gap:6px}
.cx-opts button{min-height:32px;padding:5px 11px;border:1px solid var(--line2);border-radius:9px;background:var(--surface);font-size:12.5px;font-weight:550;line-height:1.3;color:var(--t2);text-align:left;transition:border-color .12s,background .12s,color .12s}
.cx-opts button:hover{border-color:color-mix(in srgb,var(--text) 24%,var(--line2));color:var(--text)}
.cx-opts button.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc)}

/* ================================================================ calculators */
.cx-tools-page{max-width:1100px}
.cx-calc{display:grid;grid-template-columns:280px minmax(0,1fr);gap:20px;align-items:start}
.cx-calc-list{position:sticky;top:16px;display:flex;flex-direction:column;gap:2px;max-height:calc(100vh - 140px);overflow-y:auto;padding-right:2px}
.cx-calc-list .cx-search{width:100%;margin-bottom:8px}
.cx-calc-list .cx-search button{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;color:var(--t3)}
.cx-calc-g{display:flex;flex-direction:column;gap:1px;margin-bottom:8px}
.cx .cx-calc-gl{padding:8px 10px 4px;font-size:11.5px;font-weight:650;letter-spacing:.02em;color:var(--t3)}
.cx-calc-i{display:flex;flex-direction:column;gap:1px;width:100%;padding:8px 10px;border-radius:9px;text-align:left;transition:background .12s}
.cx-calc-i:hover{background:var(--hover)}
.cx-calc-i.on{background:var(--acc-soft)}
.cx-calc-i b{font-size:13.5px;font-weight:600}
.cx-calc-i.on b{color:var(--acc)}
.cx-calc-i small{font-size:12px;color:var(--t3);line-height:1.35}
.cx .cx-calc-none{padding:12px 10px;font-size:13px;color:var(--t3)}
.cx-calc-back{display:none}
.cx-calc-panel{border:1px solid var(--line);border-radius:16px;background:var(--surface);overflow:hidden}
.cx-calc-ph{padding:20px 22px 16px;border-bottom:1px solid var(--line)}
.cx .cx-calc-ph h2{margin-top:10px;font-size:21px;font-weight:650;letter-spacing:-.02em}
.cx .cx-calc-ph p{margin-top:3px;font-size:13.5px;color:var(--t2)}
.cx-calc-body{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;padding:20px 22px}
.cx-calc-form{display:flex;flex-direction:column;gap:16px;min-width:0}
.cx-cf{display:flex;flex-direction:column;gap:7px}
.cx-cf-l{font-size:12.5px;font-weight:600;color:var(--t2)}
.cx-cf-l i{font-style:normal;font-weight:500;color:var(--t3)}
.cx-cf-in{display:flex;align-items:center;max-width:280px;height:42px;border:1px solid var(--line2);border-radius:11px;background:var(--bg);transition:border-color .12s,box-shadow .12s}
.cx-cf-in:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-cf-in input{flex:1;min-width:0;height:100%;padding:0 12px;font-size:15px;font-variant-numeric:tabular-nums}
.cx-cf-in input[type=date]{color-scheme:inherit}
.cx-cf-in em{flex-shrink:0;padding:0 12px 0 4px;font-style:normal;font-size:12.5px;color:var(--t3);white-space:nowrap}
.cx-cf small{font-size:12px;line-height:1.4;color:var(--t3)}
.cx-cf-in input::-webkit-outer-spin-button,.cx-cf-in input::-webkit-inner-spin-button{opacity:.5}
.cx-tgs{display:flex;flex-direction:column;gap:6px}
.cx-tg{display:flex;align-items:center;gap:11px;width:100%;min-height:44px;padding:9px 12px;border:1px solid var(--line);border-radius:11px;background:var(--surface);text-align:left;transition:border-color .12s,background .12s}
.cx-tg:hover{border-color:color-mix(in srgb,var(--text) 22%,var(--line2))}
.cx-tg.on{border-color:var(--acc-line);background:var(--acc-soft)}
.cx-tg-box{position:relative;width:18px;height:18px;flex-shrink:0;border:1.5px solid var(--line2);border-radius:5px;background:var(--surface);transition:all .12s}
.cx-tg.on .cx-tg-box{border-color:var(--acc);background:var(--acc)}
.cx-tg.on .cx-tg-box::after{content:"";position:absolute;left:5px;top:1.5px;width:4px;height:9px;border:solid var(--on-acc);border-width:0 2px 2px 0;transform:rotate(45deg)}
.cx-tg-l{flex:1;min-width:0;font-size:13.5px;line-height:1.4;color:var(--text)}
.cx-tg-l small{display:block;margin-top:1px;font-size:12px;color:var(--t3)}
.cx-tg em{flex-shrink:0;font-style:normal;font-size:12px;font-weight:650;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-tg.on em{color:var(--acc)}
.cx-calc-res{position:sticky;top:16px;align-self:start;display:flex;flex-direction:column;gap:6px;padding:18px;border:1px solid var(--line);border-top:4px solid var(--t3);border-radius:14px;background:var(--s2)}
.cx-calc-res.ok{border-top-color:var(--ok)}
.cx-calc-res.info{border-top-color:var(--info)}
.cx-calc-res.warn{border-top-color:var(--warn)}
.cx-calc-res.danger{border-top-color:var(--danger)}
.cx-calc-res.empty{border-top-color:var(--line2)}
.cx-calc-rl{font-size:12px;font-weight:600;color:var(--t3)}
.cx-calc-rv{font-size:30px;font-weight:700;letter-spacing:-.03em;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--text)}
.cx-calc-band{align-self:flex-start;padding:3px 10px;border-radius:999px;background:var(--surface);font-size:12.5px;font-weight:650;color:var(--t2)}
.cx-calc-res.ok .cx-calc-band{color:var(--ok)}
.cx-calc-res.info .cx-calc-band{color:var(--info)}
.cx-calc-res.warn .cx-calc-band{color:var(--warn)}
.cx-calc-res.danger .cx-calc-band{color:var(--danger)}
.cx-calc-res ul{display:flex;flex-direction:column;gap:6px;margin:8px 0 0;padding:10px 0 0 16px;border-top:1px solid var(--line);list-style:disc;font-size:12.5px;line-height:1.5;color:var(--t2)}
.cx-calc-res li::marker{color:var(--t3)}
.cx-calc-acts{display:flex;gap:6px;margin-top:8px}
.cx-calc-acts button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border:1px solid var(--line2);border-radius:8px;background:var(--surface);font-size:12.5px;font-weight:550;color:var(--text)}
.cx-calc-acts button:hover{background:var(--hover)}
.cx .cx-calc-wait{font-size:13px;line-height:1.5;color:var(--t3)}
.cx-calc-meta{margin:0 22px;border-top:1px solid var(--line)}
.cx-calc-meta summary{display:flex;align-items:center;gap:6px;padding:12px 0;font-size:12.5px;font-weight:600;color:var(--t2);cursor:pointer;list-style:none}
.cx-calc-meta summary::-webkit-details-marker{display:none}
.cx-calc-meta summary .chev{color:var(--t3);transition:transform .15s}
.cx-calc-meta[open] summary .chev{transform:rotate(180deg)}
.cx .cx-calc-meta p{margin-bottom:8px;font-family:var(--mono);font-size:12px;line-height:1.6;color:var(--t2)}
.cx .cx-calc-meta p.src{font-family:var(--sans);color:var(--t3)}
.cx-calc-foot{display:flex;align-items:center;gap:12px;padding:12px 22px 16px;border-top:1px solid var(--line);font-size:12px;line-height:1.45;color:var(--t3)}
.cx-calc-foot span{display:flex;align-items:flex-start;gap:7px;flex:1;min-width:0}
.cx-calc-foot span svg{flex-shrink:0;margin-top:1px;color:var(--ok)}
.cx-calc-foot button{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:30px;padding:0 10px;border-radius:8px;font-size:12.5px;font-weight:550;color:var(--t2)}
.cx-calc-foot button:hover{background:var(--hover);color:var(--text)}

/* ================================================================ interaction checker */
.cx-ix{max-width:820px}
.cx-ix-box{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:52px;padding:8px 10px;border:1px solid var(--line2);border-radius:14px;background:var(--surface);cursor:text;transition:border-color .12s,box-shadow .12s}
.cx-ix-box:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-ix-box input{flex:1;min-width:200px;height:34px;padding:0 4px;font-size:14.5px}
.cx-ix-chip{display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 4px 0 11px;border-radius:999px;background:var(--acc-soft);color:var(--acc);font-size:13px;font-weight:600}
.cx-ix-chip.unknown{background:var(--s2);color:var(--t3);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--t3) 60%,transparent)}
.cx-ix-chip button{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%}
.cx-ix-chip button:hover{background:color-mix(in srgb,currentColor 16%,transparent)}
.cx-ix-sugg{position:absolute;left:8px;top:calc(100% + 6px);z-index:30;display:flex;flex-direction:column;min-width:240px;padding:5px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);box-shadow:var(--sh3)}
.cx-ix-sugg button{height:34px;padding:0 10px;border-radius:8px;font-size:13.5px;text-align:left}
.cx-ix-sugg button:hover{background:var(--hover)}
.cx .cx-ix-hint{margin:8px 2px 0;font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-ix-hint button{margin-left:8px;font-weight:600;color:var(--acc)}
.cx-ix-hint button:hover{text-decoration:underline}
.cx .cx-ix-unknown{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12.5px;color:var(--warn)}
.cx-ix-empty{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:20px;padding:36px 20px;border:1px dashed var(--line2);border-radius:16px;text-align:center;color:var(--t3)}
.cx-ix-empty b{font-size:14.5px;font-weight:650;color:var(--text)}
.cx-ix-empty span{max-width:440px;font-size:13px;line-height:1.5}
.cx-ix-empty.ok{border-style:solid;border-color:color-mix(in srgb,var(--ok) 30%,var(--line));background:color-mix(in srgb,var(--ok) 5%,var(--surface))}
.cx-ix-empty.ok>svg{color:var(--ok)}
.cx-ix-empty .cx-btn{margin-top:8px}
.cx-ix-sum{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:20px 0 10px}
.cx-ix-sum .cx-btn{margin-left:auto}
.cx-ix-list{display:flex;flex-direction:column;gap:8px}
.cx .cx-ix-foot{display:flex;align-items:flex-start;gap:8px;margin-top:18px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-ix-foot svg{flex-shrink:0;margin-top:1px;color:var(--ok)}

/* ================================================================ practice */
.cx-pr{max-width:1000px}
.cx-pr-exam{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;height:36px;padding:0 13px;border:1px solid var(--line2);border-radius:10px;background:var(--surface);font-size:13px;color:var(--t2);transition:background .12s}
.cx-pr-exam:hover{background:var(--hover)}
.cx-pr-exam svg{color:var(--acc)}
.cx-pr-exam b{font-weight:700;color:var(--text)}
.cx-pr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.cx-pr-stats>div{position:relative;display:flex;flex-direction:column;gap:6px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-pr-stats span{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:550;color:var(--t3)}
.cx-pr-stats span svg{color:var(--acc)}
.cx-pr-stats b{font-size:26px;font-weight:700;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.cx-pr-stats .rev button{position:absolute;right:12px;bottom:12px;height:28px;padding:0 10px;border-radius:8px;background:var(--primary);color:var(--primary-ink);font-size:12px;font-weight:600}
.cx-pr-start{margin-top:16px;padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-pr-start-h{margin-bottom:14px}
.cx .cx-pr-start-h h2{font-size:16px;font-weight:650;letter-spacing:-.01em}
.cx .cx-pr-start-h p{margin-top:3px;font-size:13px;color:var(--t3)}
.cx-subjects{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px}
.cx-subj{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:38px;padding:7px 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:13px;font-weight:550;color:var(--t2);text-align:left;transition:border-color .12s,background .12s,color .12s}
.cx-subj:hover{border-color:color-mix(in srgb,var(--text) 22%,var(--line2));color:var(--text)}
.cx-subj.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc)}
.cx-subj em{flex-shrink:0;font-style:normal;font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums}
.cx-subj em.ok{color:var(--ok)}
.cx-subj em.mid{color:var(--warn)}
.cx-subj em.low{color:var(--danger)}
.cx-pr-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-top:14px}
.cx-pr-topic{flex:1;min-width:240px;width:auto}
.cx-pr-sims{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
.cx-pr-sim{display:flex;flex-direction:column;gap:6px;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-pr-sim-ic{width:36px;height:36px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;border:1px solid var(--line2);border-radius:10px;background:var(--s2);color:var(--acc)}
.cx .cx-pr-sim h3{font-size:15px;font-weight:650;letter-spacing:-.01em}
.cx .cx-pr-sim p{font-size:13px;line-height:1.5;color:var(--t2)}
.cx-pr-sim-f{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:10px}
.cx-pr-sim-f .cx-select{flex:1;min-width:150px}
.cx-pr-sim-f .cx-input{flex:1;min-width:140px;height:36px;font-size:13.5px}
.cx-qz-top{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.cx-qz-top .cx-back{margin:0 0 0 -10px}
.cx-qz-meta{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-qz-n{flex-shrink:0;font-size:12.5px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-qz-bar{margin:0 0 16px}
.cx-qz-top,.cx-qz-bar{max-width:760px}
.cx-qz-card{display:flex;flex-direction:column;gap:14px;max-width:760px;padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-qz-card.loading{gap:12px}
.cx-qz-card .cx-badge{align-self:flex-start}
.cx .cx-qz-q{font-size:16px;line-height:1.6;font-weight:550;white-space:pre-wrap;color:var(--text)}
.cx-qz-opts{display:flex;flex-direction:column;gap:8px}
.cx-qz-opt{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:10px 14px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);font-size:14.5px;line-height:1.45;text-align:left;transition:border-color .12s,background .12s}
.cx-qz-opt:hover:not(:disabled){border-color:var(--acc-line);background:var(--acc-soft)}
.cx-qz-opt:disabled{opacity:1;cursor:default}
.cx-qz-opt .l{width:26px;height:26px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line2);border-radius:8px;font-size:12.5px;font-weight:700;color:var(--t2)}
.cx-qz-opt .t{flex:1;min-width:0}
.cx-qz-opt .ic{flex-shrink:0}
.cx-qz-opt.right{border-color:color-mix(in srgb,var(--ok) 55%,var(--line2));background:color-mix(in srgb,var(--ok) 9%,var(--surface))}
.cx-qz-opt.right .l{border-color:var(--ok);background:var(--ok);color:#fff}
.cx-qz-opt.right .ic{color:var(--ok)}
.cx-qz-opt.wrong{border-color:color-mix(in srgb,var(--danger) 55%,var(--line2));background:color-mix(in srgb,var(--danger) 7%,var(--surface))}
.cx-qz-opt.wrong .l{border-color:var(--danger);background:var(--danger);color:#fff}
.cx-qz-opt.wrong .ic{color:var(--danger)}
.cx-qz-opt.dim{opacity:.55}
.cx-qz-exp{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:12px;background:var(--s2);font-size:13.5px;line-height:1.55}
.cx-qz-exp b{display:inline-flex;align-items:center;gap:7px;font-weight:650}
.cx-qz-exp.ok b{color:var(--ok)}
.cx-qz-exp.bad b{color:var(--danger)}
.cx .cx-qz-exp p{display:flex;gap:8px;color:var(--t2)}
.cx-qz-exp p svg{flex-shrink:0;margin-top:3px;color:var(--warn)}
.cx-qz-f{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cx-qz-f span{font-size:12.5px;color:var(--t3)}
.cx-qz-res{display:flex;align-items:center;gap:22px;padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-qz-score{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:132px;height:132px;flex-shrink:0;border-radius:50%;border:6px solid var(--line2)}
.cx-qz-score.ok{border-color:color-mix(in srgb,var(--ok) 70%,transparent)}
.cx-qz-score.mid{border-color:color-mix(in srgb,var(--warn) 70%,transparent)}
.cx-qz-score.low{border-color:color-mix(in srgb,var(--danger) 60%,transparent)}
.cx-qz-score svg{color:var(--warn)}
.cx-qz-score b{font-size:24px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.cx-qz-score span{font-size:12px;color:var(--t3)}
.cx-qz-res-t{flex:1;min-width:0}
.cx .cx-qz-res-t h2{font-size:20px;font-weight:650;letter-spacing:-.02em}
.cx .cx-qz-res-t p{margin-top:4px;font-size:13.5px;color:var(--t2)}
.cx-qz-res-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.cx-qz-review{display:flex;flex-direction:column;gap:6px;margin:16px 0 0;padding:0;list-style:none}
.cx-qz-review li{border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-qz-review summary{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;font-size:13.5px;line-height:1.5;cursor:pointer;list-style:none}
.cx-qz-review summary::-webkit-details-marker{display:none}
.cx-qz-review summary svg{flex-shrink:0;margin-top:2px}
.cx-qz-review li.ok summary svg{color:var(--ok)}
.cx-qz-review li.bad summary svg{color:var(--danger)}
.cx-qz-review summary span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cx-qz-review details[open] summary span{display:block}
.cx .cx-qz-review details p{padding:0 14px 10px 40px;font-size:13px;line-height:1.55;color:var(--t2)}
.cx .cx-qz-review details p b{color:var(--text);font-weight:650}

/* ================================================================ profile dialog */
.cx-prof{max-width:600px}
.cx-roles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.cx-role{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid var(--line2);border-radius:11px;background:var(--surface);text-align:left;transition:border-color .12s,background .12s}
.cx-role:hover{border-color:color-mix(in srgb,var(--text) 24%,var(--line2))}
.cx-role b{font-size:13.5px;font-weight:600}
.cx-role small{font-size:12px;color:var(--t3)}
.cx-role.on{border-color:var(--acc);background:var(--acc-soft)}
.cx-role.on b{color:var(--acc)}
.cx-field .opt{font-weight:400;color:var(--t3)}
.cx .cx-prof-prev{display:flex;gap:9px;padding:11px 13px;border-radius:11px;background:var(--s2);font-size:13px;line-height:1.5;color:var(--t2)}
.cx-prof-prev svg{flex-shrink:0;margin-top:2px;color:var(--acc)}
.cx-prof select.cx-input{appearance:auto;padding-right:8px!important}

/* ================================================================ responsive */
@media (max-width:1000px){
  .cx-calc-body{grid-template-columns:1fr}
  .cx-calc-res{position:static}
}
@media (max-width:899px){
  .cx-calc{grid-template-columns:1fr}
  .cx-calc-list{position:static;max-height:none;display:none}
  .cx-calc.list-open .cx-calc-list{display:flex}
  .cx-calc.list-open .cx-calc-main{display:none}
  .cx-calc-back{display:inline-flex}
  .cx-calc-ph{padding:16px 16px 14px}
  .cx-calc-body{padding:16px;gap:16px}
  .cx-calc-meta{margin:0 16px}
  .cx-calc-foot{padding:12px 16px 14px;flex-direction:column;align-items:flex-start}
  .cx-cf-in{max-width:none}
  .cx-pr-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-pr-sims{grid-template-columns:1fr}
  .cx-subjects{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-pr-row .cx-btn.primary{width:100%;justify-content:center}
  .cx-qz-card{padding:16px}
  .cx-qz-res{flex-direction:column;text-align:center}
  .cx-qz-res-acts{justify-content:center}
  .cx-roles{grid-template-columns:1fr}
  .cx-tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-tool-grid button.ix{grid-column:span 2}
  .cx-ixn-f{flex-direction:column;align-items:flex-start}
  .cx-u-notes{max-width:90%}
  .cx-sim-bar{flex-direction:column;align-items:stretch;gap:8px}
  .cx-sim-bar button{justify-content:center}
  .cx-dash-edit{display:flex;width:max-content;margin:4px 0 0 -8px}
}
`;
