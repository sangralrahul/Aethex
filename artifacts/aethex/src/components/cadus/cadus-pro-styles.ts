/**
 * Styles for the professional tools: Research (PubMed search, reading list and
 * thesis kit), the ward round workspace, lab trends, the letterhead settings
 * and flowcharts in answers. Loaded after the other Cadus styles and scoped
 * under `.cx`, using the same design tokens.
 */
export const CADUS_PRO_CSS = `
/* ================================================================ shared: checkbox, toggle chip */
.cx-ck{position:relative;width:18px;height:18px;flex-shrink:0;border:1.5px solid var(--line2);border-radius:5px;background:var(--surface);transition:background .12s,border-color .12s}
.cx-ck:hover{border-color:var(--acc)}
.cx-ck.on{border-color:var(--acc);background:var(--acc)}
.cx-ck.on::after{content:"";position:absolute;left:5px;top:1.5px;width:4px;height:9px;border:solid var(--on-acc);border-width:0 2px 2px 0;transform:rotate(45deg)}
.cx-tgl{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border:1px solid var(--line2);border-radius:10px;background:var(--surface);font-size:13px;font-weight:550;color:var(--t2);white-space:nowrap;transition:border-color .12s,background .12s,color .12s}
.cx-tgl svg{opacity:0;width:0;margin-right:-6px;transition:opacity .12s}
.cx-tgl:hover{color:var(--text)}
.cx-tgl.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc)}
.cx-tgl.on svg{opacity:1;width:13px;margin-right:0}

/* ================================================================ flowcharts in answers */
.cx-md .md-mermaid{position:relative;margin:4px 0 16px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow-x:auto}
.cx-md .md-mermaid-src{display:none}
.cx-md .md-mermaid[data-state="new"],.cx-md .md-mermaid[data-state="busy"]{min-height:120px;background:repeating-linear-gradient(-45deg,var(--surface),var(--surface) 10px,var(--s2) 10px,var(--s2) 20px)}
.cx-md .md-mermaid[data-state="new"]::before,.cx-md .md-mermaid[data-state="busy"]::before{content:"Drawing the flowchart";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:550 12.5px/1 var(--sans);color:var(--t3)}
.cx-md .md-mermaid[data-state="error"] .md-mermaid-src{display:block;margin:0;padding:0;border:0;background:none;font:12.5px/1.6 var(--mono);color:var(--t2);white-space:pre-wrap}
.cx-md .md-mermaid[data-state="error"]::after{content:"The flowchart couldn't be drawn, so its outline is shown.";display:block;margin-top:8px;font:12px/1.4 var(--sans);color:var(--t3)}
.cx-md .md-mermaid-fig svg{display:block;max-width:100%;height:auto;margin:0 auto}
.cx-md .md-mermaid-fig :is(p,span,div){margin:0;font:inherit;line-height:1.5}
.cx-md .md-mermaid-fig rect.label-container{rx:8px;ry:8px}
.cx-md .md-mermaid-fig:empty{display:none}

/* ================================================================ research: search */
.cx-rs{max-width:1060px}
.cx-rs-form{display:flex;align-items:center;gap:10px;height:56px;padding:0 8px 0 16px;border:1px solid var(--line2);border-radius:16px;background:var(--surface);box-shadow:var(--sh1);transition:border-color .12s,box-shadow .12s}
.cx-rs-form:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-rs-form>svg{flex-shrink:0;color:var(--t3)}
.cx-rs-form input{flex:1;min-width:0;height:100%;font-size:15.5px}
.cx-rs-form .cx-btn{height:40px;padding:0 18px}
.cx-rs-form .cx-btn .cx-spin{border-color:color-mix(in srgb,var(--primary-ink) 30%,transparent);border-top-color:var(--primary-ink)}
.cx-rs-filters{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 18px}
.cx-rs-f2{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.cx-rs-f2 .cx-select{min-width:0;height:36px}
.cx-rs-err{margin-bottom:14px}
.cx-rs-intro{display:flex;flex-direction:column;align-items:center;gap:12px;padding:28px 0 8px;text-align:center}
.cx-rs-how{display:flex;align-items:flex-start;gap:14px;max-width:680px;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:var(--side);text-align:left}
.cx-rs-how-ic{width:36px;height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--line2);border-radius:10px;background:var(--surface);color:var(--acc)}
.cx-rs-how b{font-size:14px;font-weight:650}
.cx .cx-rs-how p{margin-top:3px;font-size:13px;line-height:1.55;color:var(--t2)}
.cx .cx-rs-try{margin-top:10px;font-size:12.5px;font-weight:600;color:var(--t3)}
.cx-rs-head{position:relative;display:flex;align-items:center;flex-wrap:wrap;gap:10px 12px;margin-bottom:10px;padding:0 4px 0 16px;min-height:32px}
.cx-rs-count{font-size:13px;color:var(--t2)}
.cx-rs-count b{font-weight:650;color:var(--text);font-variant-numeric:tabular-nums}
.cx-rs-tip{font-size:12.5px;color:var(--t3)}
.cx-rs-tr{margin-left:auto;font-size:12.5px;color:var(--t3)}
.cx-rs-tr summary{cursor:pointer;list-style:none;font-weight:550}
.cx-rs-tr summary::-webkit-details-marker{display:none}
.cx-rs-tr summary:hover{color:var(--text)}
.cx-rs-tr code{position:absolute;z-index:20;right:32px;max-width:min(560px,80vw);margin-top:6px;padding:10px 12px;border:1px solid var(--line2);border-radius:10px;background:var(--surface);box-shadow:var(--sh3);font:12px/1.55 var(--mono);color:var(--t2);word-break:break-word}
.cx-pp-list{display:flex;flex-direction:column;gap:10px;transition:opacity .15s}
.cx-pp-list.busy{opacity:.55;pointer-events:none}
.cx-pp{display:flex;align-items:flex-start;gap:14px;padding:16px 18px 14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);transition:border-color .12s,background .12s}
.cx-pp:hover{border-color:color-mix(in srgb,var(--text) 14%,var(--line))}
.cx-pp.on{border-color:var(--acc-line);background:color-mix(in srgb,var(--acc) 4%,var(--surface))}
.cx-pp>.cx-ck{margin-top:2px}
.cx-pp.sk{flex-direction:column;gap:10px;padding:20px}
.cx-pp-b{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.cx-pp-badges{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:2px}
.cx-ev{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:6px;background:var(--s2);color:var(--t2);font-size:11px;font-weight:650;white-space:nowrap}
.cx-ev.strong{background:var(--acc-soft);color:var(--acc)}
.cx-ev.bad{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}
.cx-pp-t{font-size:15px;font-weight:650;line-height:1.4;letter-spacing:-.005em;color:var(--text)}
.cx-pp-t:hover{color:var(--acc);text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
.cx .cx-pp-au{font-size:13px;color:var(--t2)}
.cx .cx-pp-j{font-size:12.5px;color:var(--t3)}
.cx-pp-j i{font-style:italic;color:var(--t2)}
.cx-pp-j .pm{margin-left:10px;font-variant-numeric:tabular-nums}
.cx-pp-acts{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:6px 0 0 -8px}
.cx-pp-acts>button,.cx-pp-acts>a{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 8px;border-radius:7px;font-size:12.5px;font-weight:550;color:var(--t2);transition:background .12s,color .12s}
.cx-pp-acts>button:hover,.cx-pp-acts>a:hover{background:var(--hover);color:var(--text)}
.cx-pp-acts .chev{transition:transform .15s}
.cx-pp-acts button.open .chev{transform:rotate(180deg)}
.cx-pp-acts .free{color:var(--ok)}
.cx-pp-acts button.on{color:var(--acc)}
.cx-pp-acts .sp{flex:1}
.cx-pp-acts .none{padding:0 8px;font-size:12px;color:var(--t3)}
.cx-pp-abs{display:flex;flex-direction:column;gap:8px;margin-top:8px;padding:12px 14px;border-radius:12px;background:var(--side);border:1px solid var(--line)}
.cx .cx-pp-abs p{font-size:13.5px;line-height:1.6;color:var(--ans)}
.cx-pp-abs b{display:block;margin-bottom:1px;font-size:12px;font-weight:650;color:var(--t3)}
.cx .cx-pp-saved{font-size:11.5px;color:var(--t3)}
.cx-selbar{position:sticky;bottom:16px;z-index:25;display:flex;align-items:center;flex-wrap:wrap;gap:8px;width:fit-content;max-width:100%;margin:18px auto 0;padding:8px 8px 8px 16px;border:1px solid var(--line2);border-radius:14px;background:var(--surface);box-shadow:var(--sh3);animation:cxPop .14s ease-out}
.cx-selbar>b{margin-right:4px;font-size:13px;font-weight:650;font-variant-numeric:tabular-nums}
.cx-rs-pages{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:20px;font-size:13px;color:var(--t2);font-variant-numeric:tabular-nums}
.cx .cx-rs-foot{display:flex;align-items:flex-start;gap:8px;margin-top:22px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-rs-foot svg{flex-shrink:0;margin-top:2px;color:var(--ok)}
.cx-rs-tools{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px}
.cx-rs-tools .cx-rs-count{flex:1;color:var(--t3)}
.cx-rs-menu{right:0;top:calc(100% + 6px);min-width:260px}
.cx .cx-rs-none{padding:24px;text-align:center;font-size:13px;color:var(--t3)}
.cx-rs-clear{display:inline-flex;align-items:center;gap:6px;margin-top:16px;height:30px;padding:0 10px;border-radius:8px;font-size:12.5px;font-weight:550;color:var(--t3)}
.cx-rs-clear:hover{background:var(--hover);color:var(--danger)}
.cx-rs-clear.armed{background:var(--danger);color:#fff}

/* ================================================================ research: thesis kit */
.cx-tk{display:flex;flex-direction:column;gap:28px}
.cx-tk-sec{display:flex;flex-direction:column;gap:14px}
.cx-tk-h{display:flex;align-items:flex-start;gap:12px}
.cx-tk-ic{width:34px;height:34px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--line2);border-radius:10px;background:var(--s2);color:var(--acc)}
.cx .cx-tk-h h2{font-size:17px;font-weight:650;letter-spacing:-.01em}
.cx .cx-tk-h p{margin-top:2px;font-size:13px;line-height:1.5;color:var(--t3)}
.cx-tk-grid{display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px;align-items:start}
.cx-tk-list{position:sticky;top:16px;display:flex;flex-direction:column;gap:2px}
.cx-tk-pick{display:none}
.cx-tk-rv{font-size:24px}
.cx-tk-para{margin:0 22px 18px;padding:14px 16px;border:1px solid var(--acc-line);border-radius:12px;background:color-mix(in srgb,var(--acc) 4%,var(--surface))}
.cx-tk-para-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.cx-tk-para-h b{font-size:12.5px;font-weight:650;color:var(--acc)}
.cx-tk-para-h button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px;border-radius:7px;font-size:12px;font-weight:600;color:var(--t2)}
.cx-tk-para-h button:hover{background:var(--hover);color:var(--text)}
.cx .cx-tk-para p{font-family:var(--serif);font-size:15px;line-height:1.65;color:var(--ans)}
.cx-tk-test{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:16px;align-items:start;padding:20px 22px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-tk-qs{display:flex;flex-direction:column;gap:18px}
.cx-tk-ans{display:flex;flex-direction:column;gap:8px;padding:18px;border:1px solid var(--line);border-top:4px solid var(--acc);border-radius:14px;background:var(--s2)}
.cx .cx-tk-ans h3{font-size:18px;font-weight:700;letter-spacing:-.015em;line-height:1.3}
.cx .cx-tk-ans .when{font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-tk-ans dl{display:flex;flex-direction:column;gap:3px;margin:6px 0 0;padding-top:10px;border-top:1px solid var(--line)}
.cx-tk-ans dt{margin-top:8px;font-size:12px;font-weight:650;color:var(--t3)}
.cx-tk-ans dt:first-child{margin-top:0}
.cx-tk-ans dd{margin:0;font-size:13px;line-height:1.55;color:var(--text)}
.cx-tk-ans dd ul{margin:0;padding-left:18px;list-style:disc}
.cx-tk-ans dd.sw{font-family:var(--mono);font-size:12px;color:var(--t2)}

/* ================================================================ ward round */
.cx-wd{max-width:1180px}
.cx-wd-unit{width:auto;max-width:220px;margin-right:10px;padding:2px 8px!important;border:1px dashed var(--line2)!important;border-radius:7px!important;font-weight:600;color:var(--text)!important;field-sizing:content;min-width:120px}
.cx-wd-unit:hover,.cx-wd-unit:focus{border-style:solid!important;border-color:var(--acc-line)!important}
.cx-wd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}
.cx-wd-stats button{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);text-align:left;transition:border-color .12s,background .12s}
.cx-wd-stats button:hover{border-color:color-mix(in srgb,var(--text) 18%,var(--line))}
.cx-wd-stats button.on{border-color:var(--acc-line);background:color-mix(in srgb,var(--acc) 5%,var(--surface))}
.cx-wd-stats small{font-size:12px;font-weight:550;color:var(--t3)}
.cx-wd-stats b{display:flex;align-items:baseline;gap:8px;font-size:24px;font-weight:700;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.cx-wd-stats b em{font-style:normal;font-size:12px;font-weight:600;letter-spacing:0;color:var(--t3)}
.cx-wd-stats .sick b em{color:var(--danger)}
.cx-wd-grid{display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;align-items:start}
.cx-wd-list{position:sticky;top:16px;display:flex;flex-direction:column;gap:3px;max-height:calc(100vh - 150px);overflow-y:auto;padding:10px;border:1px solid var(--line);border-radius:16px;background:var(--side)}
.cx-wd-list>.cx-tabs{align-self:stretch;margin-bottom:6px}
.cx-wd-list>.cx-tabs button{flex:1}
.cx-wd-row{display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;border-radius:10px;text-align:left;transition:background .12s}
.cx-wd-row:hover{background:var(--hover)}
.cx-wd-row.on{background:var(--surface);box-shadow:var(--sh1),0 0 0 1px var(--line)}
.cx-wd-dot{width:8px;height:8px;flex-shrink:0;margin-top:7px;border-radius:50%;background:var(--ok)}
.cx-wd-dot.watch{background:var(--warn)}
.cx-wd-dot.sick{background:var(--danger);box-shadow:0 0 0 3px color-mix(in srgb,var(--danger) 20%,transparent)}
.cx-wd-bed{min-width:30px;height:22px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;border:1px solid var(--line2);border-radius:6px;background:var(--surface);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
.cx-wd-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cx-wd-t b{font-size:13.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-wd-t b span{font-weight:450;color:var(--t2)}
.cx-wd-t small{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11.5px;color:var(--t3)}
.cx-wd-t small .seen{display:inline-flex;align-items:center;gap:3px;color:var(--ok);font-weight:600}
.cx-wd-t small .jobs{color:var(--warn);font-weight:600}
.cx-wd-alljobs{display:flex;flex-direction:column;gap:2px;margin:0;padding:0;list-style:none}
.cx-wd-alljobs li{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:10px}
.cx-wd-alljobs li:hover{background:var(--hover)}
.cx-wd-alljobs .cx-ck{margin-top:1px}
.cx-wd-alljobs .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;text-align:left}
.cx-wd-alljobs .t span{font-size:13px;line-height:1.4}
.cx-wd-alljobs .t small{font-size:11.5px;color:var(--t3)}
.cx .cx-wd-none{display:flex;align-items:center;justify-content:center;gap:6px;padding:22px 10px;font-size:13px;color:var(--t3);text-align:center}
.cx-wd-none svg{color:var(--ok)}
.cx .cx-wd-dc{padding:10px 10px 2px;font-size:11.5px;color:var(--t3)}
.cx-wd-main{min-width:0}
.cx-wp{display:flex;flex-direction:column;gap:14px;padding:18px 20px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx-wd-back{display:none}
.cx-wp-h{display:flex;align-items:flex-end;flex-wrap:wrap;gap:10px}
.cx-wp-bed,.cx-wp-who{display:flex;flex-direction:column;gap:5px}
.cx-wp-bed span,.cx-wp-who span,.cx-wp-f>span{font-size:12px;font-weight:600;color:var(--t3)}
.cx-wp-bed input,.cx-wp-who input{height:40px;padding:0 11px!important;border:1px solid var(--line2)!important;border-radius:10px!important;background:var(--bg)!important;font-size:15px;font-weight:650}
.cx-wp-bed input{width:76px;text-align:center;font-variant-numeric:tabular-nums}
.cx-wp-who{flex:1;min-width:160px}
.cx-wp-bed input:focus,.cx-wp-who input:focus,.cx-wp-dx:focus,.cx-wp-f textarea:focus{border-color:var(--acc-line)!important;box-shadow:0 0 0 3px var(--acc-soft)!important}
.cx-wd-status{display:inline-flex;padding:3px;border:1px solid var(--line);border-radius:11px;background:var(--s2)}
.cx-wd-status button{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--t2)}
.cx-wd-status button i{width:7px;height:7px;border-radius:50%;background:var(--ok)}
.cx-wd-status button.watch i{background:var(--warn)}
.cx-wd-status button.sick i{background:var(--danger)}
.cx-wd-status button.on{background:var(--surface);color:var(--text);box-shadow:var(--sh1)}
.cx-wd-status button.sick.on{color:var(--danger)}
.cx-wd-pmenu,.cx-wd-hmenu{right:0;top:calc(100% + 6px);min-width:250px}
.cx-wp-dx{width:100%;height:44px;padding:0 13px!important;border:1px solid var(--line2)!important;border-radius:11px!important;background:var(--bg)!important;font-size:15px;font-weight:550}
.cx-wp-ident{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:9px 10px 9px 12px;border:1px solid color-mix(in srgb,var(--warn) 40%,var(--line));border-radius:11px;background:color-mix(in srgb,var(--warn) 7%,var(--surface));font-size:12.5px;line-height:1.45;color:var(--t2)}
.cx-wp-ident svg{flex-shrink:0;color:var(--warn)}
.cx-wp-ident span{flex:1;min-width:200px}
.cx-wp-ident button{height:28px;padding:0 10px;border:1px solid var(--line2);border-radius:8px;background:var(--surface);font-size:12px;font-weight:600;color:var(--text)}
.cx-wp-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.cx-wp-f{display:flex;flex-direction:column;gap:5px}
.cx-wp-f.wide{grid-column:1/-1}
.cx-wp-f textarea{width:100%;min-height:64px;padding:10px 12px!important;border:1px solid var(--line2)!important;border-radius:11px!important;background:var(--bg)!important;font-size:13.5px;line-height:1.55;resize:vertical}
.cx-wp-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.cx-wp-box{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:14px;background:var(--side);overflow:hidden}
.cx-wp-box>header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line)}
.cx-wp-box>header b{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:650}
.cx-wp-box>header b svg{color:var(--acc)}
.cx-wp-box>header span{font-size:12px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-wp-jobs{display:flex;flex-direction:column;margin:0;padding:6px;list-style:none}
.cx-wp-jobs li{display:flex;align-items:flex-start;gap:10px;padding:7px 6px;border-radius:9px;font-size:13.5px;line-height:1.4}
.cx-wp-jobs li:hover{background:var(--hover)}
.cx-wp-jobs li>span{flex:1;min-width:0}
.cx-wp-jobs li.done>span{color:var(--t3);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--t3) 60%,transparent)}
.cx-wp-jobs .cx-ck{margin-top:1px}
.cx-wp-x{width:22px;height:22px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;color:var(--t3);opacity:0}
.cx-wp-jobs li:hover .cx-wp-x,.cx-wp-x:focus-visible{opacity:1}
.cx-wp-x:hover{background:var(--hover);color:var(--danger)}
.cx-wp-add{display:flex;align-items:center;gap:8px;margin:0 6px 6px;padding:0 6px 0 8px;height:38px;border:1px dashed var(--line2);border-radius:10px;color:var(--t3)}
.cx-wp-add:focus-within{border-style:solid;border-color:var(--acc-line);background:var(--surface)}
.cx-wp-add input{flex:1;min-width:0;height:100%;font-size:13.5px}
.cx-wp-add button{height:28px;padding:0 10px;border-radius:7px;background:var(--primary);color:var(--primary-ink);font-size:12px;font-weight:600}
.cx-wp-round{display:flex;flex-direction:column;padding:6px}
.cx-wp-chk{display:flex;align-items:center;gap:10px;width:100%;min-height:34px;padding:6px;border-radius:9px;font-size:13px;line-height:1.35;color:var(--t2);text-align:left}
.cx-wp-chk:hover{background:var(--hover);color:var(--text)}
.cx-wp-chk.on{color:var(--text)}
.cx-ck-i{width:18px;height:18px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid var(--line2);border-radius:50%;background:var(--surface);color:var(--on-acc)}
.cx-wp-chk.on .cx-ck-i{border-color:var(--ok);background:var(--ok);color:#fff}
.cx-wp-acts{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding-top:4px}
.cx-wp-note{display:inline-flex;align-items:center;gap:6px;margin-left:auto;font-size:12px;color:var(--t3)}
.cx-wp-note svg{color:var(--ok)}
.cx .cx-wd-foot{display:flex;align-items:flex-start;gap:8px;margin-top:18px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-wd-foot svg{flex-shrink:0;margin-top:2px;color:var(--ok)}
.cx-wd-empty .cx-ideas{margin-top:8px}
.cx-wd-priv{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:var(--t3)}
.cx-wd-priv svg{color:var(--ok)}

/* ================================================================ lab trends */
.cx-lt{display:flex;flex-direction:column;gap:16px}
.cx-lt-in{border:1px solid var(--line2);border-radius:16px;background:var(--surface);overflow:hidden;transition:border-color .12s,box-shadow .12s}
.cx-lt-in:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-lt-in textarea{display:block;width:100%;padding:14px 16px;resize:vertical;font:13.5px/1.65 var(--mono)}
.cx-lt-bar{display:flex;align-items:center;gap:12px;padding:10px 12px;border-top:1px solid var(--line);background:var(--side)}
.cx-lt-bar span{flex:1;min-width:0;font-size:12px;line-height:1.45;color:var(--t3)}
.cx-lt-sum{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;font-size:13px;color:var(--t2)}
.cx-lt-sum>span{display:inline-flex;align-items:center;gap:7px}
.cx-lt-sum>span svg{color:var(--acc)}
.cx-lt-sum b{font-weight:650;color:var(--text)}
.cx-lt-sum .warn{color:var(--danger);font-weight:600}
.cx-lt-sum .ok{color:var(--ok);font-weight:600}
.cx-lt-acts{display:flex;gap:8px;margin-left:auto}
.cx .cx-lt-unknown{font-size:12.5px;color:var(--warn)}
.cx-lt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}
.cx-lt-card{display:flex;flex-direction:column;gap:6px;padding:12px 12px 10px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-lt-card.high,.cx-lt-card.low{border-color:color-mix(in srgb,var(--danger) 28%,var(--line))}
.cx-lt-card header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.cx-lt-name{display:flex;flex-direction:column;min-width:0}
.cx-lt-name b{font-size:13px;font-weight:650;line-height:1.3}
.cx-lt-name small{font-size:11.5px;color:var(--t3)}
.cx-lt-now{display:flex;align-items:center;gap:6px;flex-shrink:0}
.cx-lt-now b{font-size:20px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.cx-lt-flag{height:20px;display:inline-flex;align-items:center;padding:0 7px;border-radius:6px;font-size:11px;font-weight:700}
.cx-lt-flag.high,.cx-lt-flag.low{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}
.cx-lt-flag.normal{background:color-mix(in srgb,var(--ok) 13%,transparent);color:var(--ok)}
.cx-lt-svg{display:block;width:100%;height:auto;overflow:visible}
.cx-lt-svg .lt-band{fill:color-mix(in srgb,var(--ok) 11%,transparent)}
.cx-lt-svg .lt-base{stroke:var(--line2);stroke-width:1}
.cx-lt-svg .lt-line{fill:none;stroke:var(--acc);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.cx-lt-svg .lt-pt{fill:var(--surface);stroke:var(--acc);stroke-width:2}
.cx-lt-svg .lt-pt.high,.cx-lt-svg .lt-pt.low{fill:var(--danger);stroke:var(--danger)}
.cx-lt-svg .lt-ax{fill:var(--t3);font:500 10.5px var(--sans);font-variant-numeric:tabular-nums}
.cx-lt-svg .lt-v{fill:var(--text);font:700 11.5px var(--sans);font-variant-numeric:tabular-nums}
.cx-lt-card footer{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:var(--t3)}
.cx-lt-tr{display:inline-flex;align-items:center;gap:4px;font-weight:600;color:var(--t2)}
.cx-lt-rng{white-space:nowrap}
.cx-lt-table{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-lt-table table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.cx-lt-table th,.cx-lt-table td{padding:8px 12px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}
.cx-lt-table thead th{background:var(--side);font-size:12px;font-weight:650;color:var(--t2)}
.cx-lt-table tbody th{text-align:left;font-weight:600}
.cx-lt-table tbody th small{font-weight:450;color:var(--t3)}
.cx-lt-table thead th:first-child{text-align:left}
.cx-lt-table tr:last-child>*{border-bottom:0}
.cx-lt-table td.high,.cx-lt-table td.low{color:var(--danger);font-weight:650}
.cx-lt-table td.high::after{content:" ↑"}
.cx-lt-table td.low::after{content:" ↓"}
.cx-lt-table td.rng{color:var(--t3)}
.cx .cx-lt-foot{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-lt-foot svg{flex-shrink:0;margin-top:1px;color:var(--ok)}

/* ================================================================ letterhead settings */
.cx-lh-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px;padding:4px 0 8px;transition:opacity .15s}
.cx-lh-form.off{opacity:.5}
.cx-lh-form .wide{grid-column:1/-1}
.cx-lh-form .cx-input{height:38px;font-size:13.5px}
.cx-field .opt{font-weight:450;color:var(--t3)}
.cx-lh-logo{display:flex;align-items:center;gap:10px}
.cx-lh-logo img{max-width:120px;max-height:44px;object-fit:contain;padding:4px;border:1px solid var(--line);border-radius:8px;background:#fff}
.cx-lh-logo .ph{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--line2);border-radius:10px;color:var(--t3)}
.cx-lh-prev{padding:22px 26px 20px;border:1px solid var(--line2);border-radius:6px;background:#fff;color:#111827;box-shadow:var(--sh2);font-family:"Segoe UI",Roboto,Arial,sans-serif}
.cx-lh-prev.empty{display:flex;align-items:center;justify-content:center;min-height:120px;background:var(--side);color:var(--t3);box-shadow:none;border-style:dashed}
.cx .cx-lh-prev.empty p{font-size:13px;text-align:center}
.cx-lh-head{display:flex;align-items:center;gap:12px;padding-bottom:9px;border-bottom:2px solid #007A6C}
.cx-lh-head img{max-height:42px;max-width:110px;object-fit:contain}
.cx-lh-head .l,.cx-lh-head .r{display:flex;flex-direction:column;font-size:10.5px;line-height:1.4;color:#374151}
.cx-lh-head .l{flex:1;min-width:0}
.cx-lh-head .r{text-align:right;max-width:46%}
.cx-lh-head b{font-size:14px;color:#0F1729}
.cx-lh-head .r b{font-size:12px}
.cx-lh-body{display:flex;flex-direction:column;gap:7px;padding:14px 0 6px}
.cx-lh-body b{font-size:13px;color:#0F1729}
.cx-lh-body i{display:block;width:100%;height:6px;border-radius:3px;background:#E5E7EB}
.cx-lh-sign{display:flex;flex-direction:column;align-items:flex-start;width:200px;margin:10px 0 0 auto;font-size:10.5px;color:#374151}
.cx-lh-sign .ln{display:block;width:100%;margin-bottom:5px;border-top:1px solid #111827}
.cx-lh-sign b{font-size:11.5px;color:#111827}
.cx .cx-lh-note{margin-top:12px;font-size:12px;line-height:1.5;color:var(--t3)}

/* ================================================================ home panels */
.cx-ward-mini{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px}
.cx-ward-mini .cx-mini-stats b{font-size:18px}
.cx-ward-mini .cx-mini-stats .sick b{color:var(--danger)}
.cx-rs-mini{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px}
.cx-rs-mini form{display:flex;align-items:center;gap:8px;height:40px;padding:0 6px 0 12px;border:1px solid var(--line2);border-radius:11px;background:var(--bg);color:var(--t3)}
.cx-rs-mini form:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-rs-mini input{flex:1;min-width:0;height:100%;font-size:13.5px}
.cx-rs-mini form button{height:30px;padding:0 10px;border-radius:8px;background:var(--primary);color:var(--primary-ink);font-size:12.5px;font-weight:600}
.cx-rs-mini form button:disabled{opacity:.4}
.cx-rs-mini-l{display:flex;flex-wrap:wrap;gap:6px}
.cx-rs-mini-l button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border:1px solid var(--line);border-radius:9px;background:var(--s2);font-size:12.5px;font-weight:550;color:var(--t2)}
.cx-rs-mini-l button:hover{border-color:var(--acc-line);color:var(--acc);background:var(--acc-soft)}

/* ================================================================ responsive */
@media (max-width:1000px){
  .cx-tk-test{grid-template-columns:1fr}
  .cx-wd-grid{grid-template-columns:260px minmax(0,1fr)}
}
@media (max-width:899px){
  .cx-rs-form{height:50px;padding:0 6px 0 12px}
  .cx-rs-form .cx-btn{height:38px;padding:0 12px}
  .cx-rs-filters{align-items:stretch}
  .cx-rs-filters>.cx-opts{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;width:100%}
  .cx-rs-filters>.cx-opts button{flex-shrink:0;white-space:nowrap}
  .cx-rs-tr{display:none}
  .cx-pp{padding:14px 14px 12px 12px;gap:10px}
  .cx-pp-acts .sp{display:none}
  .cx-selbar{bottom:10px;padding:8px;gap:6px}
  .cx-selbar .cx-btn{height:32px;padding:0 10px;font-size:12.5px}
  .cx-tk-grid{grid-template-columns:1fr}
  .cx-tk-list{display:none}
  .cx-tk-pick{display:block;width:100%}
  .cx-tk-test{padding:14px}
  .cx-tk-para{margin:0 14px 14px}
  .cx-wd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cx-wd-grid{grid-template-columns:1fr}
  .cx-wd-list{position:static;max-height:none}
  .cx-wd-grid.editing .cx-wd-list{display:none}
  .cx-wd-grid:not(.editing) .cx-wd-main{display:none}
  .cx-wd-back{display:inline-flex;align-self:flex-start;margin:-4px 0 0 -10px}
  .cx-wp{padding:14px}
  .cx-wp-fields,.cx-wp-cols{grid-template-columns:1fr}
  .cx-wd-status{order:3;width:100%}
  .cx-wd-status button{flex:1;justify-content:center}
  .cx-wp-note{margin-left:0;width:100%}
  .cx-lt-acts{margin-left:0;width:100%}
  .cx-lt-acts .cx-btn{flex:1;justify-content:center}
  .cx-lt-bar{flex-direction:column;align-items:flex-start}
  .cx-lh-form{grid-template-columns:1fr}
  .cx-lh-prev{padding:16px}
  .cx-lh-head{flex-wrap:wrap}
  .cx-lh-head .r{text-align:left;max-width:none}
}
`;
