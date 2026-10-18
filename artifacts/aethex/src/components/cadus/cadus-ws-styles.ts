/**
 * Styles for the clinical workspace round of Cadus: answer outlines, red-flag
 * and caution sections, tables that stack on a phone, the patient case
 * workspace, institution settings and the offline banner. Loaded last.
 */
export const CADUS_WS_CSS = `
/* ================================================================ offline */
.cx-offline{flex-shrink:0;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 7px;padding:7px 16px;background:color-mix(in srgb,var(--warn) 12%,var(--surface));border-bottom:1px solid color-mix(in srgb,var(--warn) 35%,var(--line));font-size:12.5px;line-height:1.4;color:var(--text);text-align:center}
.cx-offline svg{flex-shrink:0;color:var(--warn)}
.cx-offline span{color:var(--t2)}

/* ================================================================ long chats stay light */
.cx-thread>.cx-a:not(:nth-last-child(-n+3)),.cx-thread>.cx-u:not(:nth-last-child(-n+3)){content-visibility:auto;contain-intrinsic-size:auto 480px}

/* ================================================================ answer outline */
.cx-outline{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:-2px 0 2px}
.cx-outline>span{margin-right:2px;font-size:11.5px;font-weight:650;color:var(--t3)}
.cx-outline button{height:26px;padding:0 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:12px;font-weight:550;color:var(--t2);white-space:nowrap;transition:border-color .12s,color .12s,background .12s}
.cx-outline button:hover{border-color:var(--acc-line);background:var(--acc-soft);color:var(--acc)}

/* ================================================================ red flags and cautions */
.cx-md .md-sec{margin:18px 0;padding:2px 16px 4px;border:1px solid var(--line);border-left-width:3px;border-radius:4px 12px 12px 4px}
.cx-md .md-sec>:is(h2,h3,h4):first-child{margin-top:12px}
.cx-md .md-sec>*:last-child{margin-bottom:10px}
.cx-md .md-sec-alert{border-color:color-mix(in srgb,var(--danger) 26%,var(--line));border-left-color:var(--danger);background:color-mix(in srgb,var(--danger) 4%,var(--surface))}
.cx-md .md-sec-caution{border-color:color-mix(in srgb,var(--warn) 30%,var(--line));border-left-color:var(--warn);background:color-mix(in srgb,var(--warn) 5%,var(--surface))}
.cx .cx-md .md-h{display:flex;align-items:center;gap:8px}
.cx .cx-md .md-h::before{content:"!";width:18px;height:18px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-family:var(--sans);font-size:12px;font-weight:800;line-height:1;color:#fff}
.cx .cx-md .md-h-alert{color:var(--danger)}
.cx .cx-md .md-h-alert::before{background:var(--danger)}
.cx .cx-md .md-h-caution::before{background:var(--warn)}

/* ================================================================ wide tables stack into cards on a phone */
@media (max-width:640px){
  .cx-md .md-table.wide{border:0;overflow:visible}
  .cx-md .md-table.wide table{min-width:0;font-size:.92em}
  .cx-md .md-table.wide thead{display:none}
  .cx-md .md-table.wide tbody{display:flex;flex-direction:column;gap:8px}
  .cx-md .md-table.wide tr{display:block;border:1px solid var(--line2);border-radius:12px;overflow:hidden;background:var(--surface)}
  .cx-md .md-table.wide tbody tr:nth-child(even) td{background:transparent}
  .cx-md .md-table.wide td{display:grid;grid-template-columns:minmax(88px,38%) minmax(0,1fr);gap:10px;padding:8px 12px;border-bottom:1px solid var(--line)}
  .cx-md .md-table.wide td:last-child{border-bottom:0}
  .cx-md .md-table.wide td::before{content:attr(data-label);font-size:.88em;font-weight:600;color:var(--t3)}
  .cx-md .md-table.wide td:first-child{background:var(--s2)}
  .cx-md .md-tablewrap:has(.md-table.wide) .md-copy{display:none}
}

/* ================================================================ local protocol chip and case bar */
.cx-instchip{display:inline-flex;align-items:center;gap:5px;max-width:320px;height:22px;padding:0 9px;border:1px solid var(--acc-line);border-radius:999px;background:var(--acc-soft);color:var(--acc);font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-instchip svg{flex-shrink:0}
.cx-casebar{display:flex;align-items:center;gap:9px;margin-bottom:-14px;padding:9px 10px 9px 13px;border:1px solid var(--line);border-radius:12px;background:var(--s2);font-size:13px;color:var(--t2)}
.cx-casebar>svg{flex-shrink:0;color:var(--acc)}
.cx-casebar span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-casebar b{font-weight:650;color:var(--text)}
.cx-casebar button{flex-shrink:0;height:28px;padding:0 10px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--acc)}
.cx-casebar button:hover{background:var(--acc-soft)}

/* ================================================================ patient cases: list */
.cx-cs .cx-hs-tools{margin-bottom:14px}
.cx-cs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.cx-cs-grid.closed{margin-top:10px;opacity:.75}
.cx-cs-card{display:flex;flex-direction:column;gap:6px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--surface);text-align:left;transition:border-color .14s,box-shadow .14s}
.cx-cs-card:hover{border-color:color-mix(in srgb,var(--text) 20%,var(--line2));box-shadow:var(--sh2)}
.cx-cs-card-h{display:flex;align-items:center;gap:8px}
.cx-cs-card-h b{font-size:14.5px;font-weight:650;letter-spacing:-.01em}
.cx-cs-card-h small{margin-left:auto;font-size:11.5px;color:var(--t3);white-space:nowrap}
.cx-cs-dot{width:8px;height:8px;flex-shrink:0;border-radius:50%;background:var(--warn)}
.cx-cs-dot.danger{background:var(--danger);box-shadow:0 0 0 3px color-mix(in srgb,var(--danger) 18%,transparent)}
.cx-cs-card-c{font-size:13.5px;line-height:1.45;color:var(--text)}
.cx-cs-card-p{font-size:12.5px;line-height:1.45;color:var(--t2)}
.cx-cs-card-v{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-cs-card-v svg{color:var(--acc)}
.cx-cs-closed-t{margin-top:18px;height:30px;padding:0 4px;font-size:13px;font-weight:600;color:var(--t2)}
.cx-cs-closed-t:hover{color:var(--text)}
.cx-cs-empty-acts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:6px}

/* ================================================================ patient cases: one case */
.cx-page.cx-cs-open{max-width:1180px}
.cx-cs-top{display:flex;align-items:flex-end;flex-wrap:wrap;gap:12px 20px;margin-bottom:20px}
.cx-cs-top .cx-back{flex-basis:100%;margin-bottom:0}
.cx-cs-title{flex:1;min-width:0}
.cx .cx-cs-title h1{font-size:24px;font-weight:650;letter-spacing:-.025em;line-height:1.2}
.cx .cx-cs-title p{margin-top:4px;font-size:14px;color:var(--t2)}
.cx-cs-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;align-items:start}
.cx-cs-sheet{display:flex;flex-direction:column;gap:14px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-cs-who{display:grid;grid-template-columns:90px 90px minmax(0,1fr);gap:10px;align-items:end}
.cx-cs-who .cx-seg{display:flex}
.cx-cs-who .cx-seg button{flex:1;justify-content:center}
.cx-cs-sheet textarea.cx-input{min-height:0;resize:vertical}
.cx-cs-sec>span{font-size:12px!important;letter-spacing:.01em}
.cx-cs-probs{display:flex;flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;counter-reset:prob}
.cx-cs-probs li{display:flex;align-items:center;gap:8px;min-height:34px;padding:2px 2px 2px 10px;border:1px solid var(--line);border-radius:9px;background:var(--s2);font-size:13.5px;counter-increment:prob}
.cx-cs-probs li::before{content:counter(prob) ".";min-width:16px;font-weight:650;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-cs-probs li span{flex:1;min-width:0}
.cx-cs-probs .cx-ib{width:28px;height:28px}
.cx-cs-add{display:flex;gap:8px}
.cx-cs-add .cx-input{height:36px}
.cx-cs-add .cx-btn{height:36px}
.cx .cx-cs-warn{display:flex;gap:8px;padding:9px 12px;border-radius:10px;background:color-mix(in srgb,var(--warn) 10%,transparent);font-size:12.5px;line-height:1.5;color:var(--text)}
.cx-cs-warn svg{flex-shrink:0;margin-top:2px;color:var(--warn)}
.cx-cs-side{display:flex;flex-direction:column;gap:14px;min-width:0;position:sticky;top:12px}
.cx-cs-panel{display:flex;flex-direction:column;gap:12px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx .cx-cs-panel h2{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:650}
.cx-cs-panel h2 svg{color:var(--acc)}
.cx .cx-cs-miss{font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-cs-ask{display:flex;flex-direction:column;gap:8px}
.cx-cs-ask textarea.cx-input{min-height:0;resize:none}
.cx-cs-ask .cx-btn{align-self:flex-end}
.cx-cs-acts{display:flex;flex-wrap:wrap;gap:6px}
.cx-cs-acts .cx-q{height:32px;padding:0 11px;font-size:12.5px}
.cx-cs-chats{display:flex;flex-direction:column;gap:2px;padding-top:10px;border-top:1px solid var(--line)}
.cx-cs-chats small{margin-bottom:4px;font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-cs-chats button{display:flex;align-items:center;gap:8px;min-height:32px;padding:4px 8px;border-radius:8px;font-size:13px;text-align:left;color:var(--text)}
.cx-cs-chats button:hover{background:var(--hover)}
.cx-cs-chats button svg{flex-shrink:0;color:var(--t3)}
.cx-cs-chats button span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-cs-chats button em{flex-shrink:0;font-style:normal;font-size:11.5px;color:var(--t3)}
.cx-cs-vitals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.cx-cs-vitals>div{display:flex;flex-direction:column;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--s2)}
.cx-cs-vitals small{font-size:11px;font-weight:600;color:var(--t3)}
.cx-cs-vitals b{font-size:18px;font-weight:650;line-height:1.2;font-variant-numeric:tabular-nums;color:var(--text)}
.cx-cs-vitals em{font-style:normal;font-size:11px;color:var(--t3)}
.cx-cs-vitals>div.warn{border-color:color-mix(in srgb,var(--warn) 45%,var(--line));background:color-mix(in srgb,var(--warn) 9%,var(--surface))}
.cx-cs-vitals>div.danger{border-color:color-mix(in srgb,var(--danger) 45%,var(--line));background:color-mix(in srgb,var(--danger) 8%,var(--surface))}
.cx-cs-vitals>div.danger b{color:var(--danger)}
.cx .cx-cs-vitals p{grid-column:1/-1;font-size:11.5px;color:var(--t3)}
.cx-cs-entry{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px dashed var(--line2);border-radius:12px}
.cx-cs-entry .cx-seg{display:flex}
.cx-cs-entry .cx-seg button{flex:1;justify-content:center}
.cx-cs-entry textarea.cx-input{min-height:0;resize:vertical}
.cx-cs-entry>.cx-btn{align-self:flex-end}
.cx-cs-vin{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.cx-cs-vin label{display:flex;flex-direction:column;gap:3px}
.cx-cs-vin span{font-size:11px;font-weight:600;color:var(--t3)}
.cx-cs-vin input{width:100%;height:34px;padding:0 8px!important;border:1px solid var(--line2)!important;border-radius:8px!important;background:var(--bg)!important;font-size:13.5px;font-variant-numeric:tabular-nums}
.cx-cs-vin input:focus{border-color:var(--acc-line)!important}
.cx-cs-o2{grid-column:span 4;min-height:36px;padding:6px 10px}
.cx-cs-tl{display:flex;flex-direction:column;margin:0;padding:0 0 0 14px;list-style:none;border-left:2px solid var(--line)}
.cx-cs-tl li{position:relative;display:flex;flex-direction:column;gap:2px;padding:7px 30px 9px 10px}
.cx-cs-tl li::before{content:"";position:absolute;left:-21px;top:12px;width:10px;height:10px;border-radius:50%;border:2px solid var(--surface);background:var(--t3)}
.cx-cs-tl li.k-vitals::before{background:var(--acc)}
.cx-cs-tl li.k-cadus::before{background:var(--ev-mod,#2563EB)}
.cx-cs-tl li.warn::before{background:var(--warn)}
.cx-cs-tl li.danger::before{background:var(--danger)}
.cx-cs-tl .when{font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-cs-tl .vit{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--text)}
.cx-cs-tl li.danger .vit{color:var(--danger)}
.cx-cs-tl .txt{font-size:13px;line-height:1.5;color:var(--t2);white-space:pre-wrap}
.cx-cs-tl .cx-ib{position:absolute;top:4px;right:0;width:26px;height:26px;opacity:0}
.cx-cs-tl li:hover .cx-ib,.cx-cs-tl .cx-ib:focus-visible{opacity:1}

/* ================================================================ institution settings */
.cx .cx-inst-src{display:flex;align-items:center;gap:7px;margin:-4px 0 6px;padding:8px 11px;border-radius:9px;background:var(--acc-soft);font-size:12.5px;color:var(--acc);font-weight:550}
.cx-inst-form{display:flex;flex-direction:column;gap:14px;padding:6px 0 4px;transition:opacity .15s}
.cx-inst-form.off{opacity:.5}
.cx-inst-form textarea.cx-input{min-height:0}
.cx-inst-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:6px}
.cx-inst-h b{display:block;font-size:13.5px;font-weight:600}
.cx-inst-h small{display:block;margin-top:2px;font-size:12.5px;color:var(--t3)}
.cx-inst-acts{display:flex;gap:6px;flex-shrink:0}
.cx-inst-acts .cx-btn{height:32px;font-size:12.5px}
.cx-inst-edit{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--acc-line);border-radius:12px;background:color-mix(in srgb,var(--acc) 4%,var(--surface))}
.cx-inst-edit textarea.cx-input{min-height:140px}
.cx-inst-edit-f{display:flex;align-items:center;justify-content:flex-end;gap:8px}
.cx-inst-edit-f small{margin-right:auto;font-size:11.5px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-inst-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.cx-inst-list li{display:flex;align-items:center;gap:6px;padding:9px 8px 9px 14px;border-bottom:1px solid var(--line)}
.cx-inst-list li:last-child{border-bottom:0}
.cx-inst-list .t{flex:1;min-width:0}
.cx-inst-list b{display:block;font-size:13.5px;font-weight:600}
.cx-inst-list small{display:block;margin-top:1px;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-inst-list .cx-ib.danger{background:var(--danger);color:#fff}
.cx-inst-empty{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--s2) 55%,var(--surface))}
.cx .cx-inst-empty p{font-size:13px;line-height:1.55;color:var(--t2)}
.cx-inst-try{display:flex;flex-direction:column;gap:8px}
.cx-inst-try .cx-search{width:100%}
.cx .cx-inst-try p{font-size:12.5px;color:var(--t2)}
.cx-inst-try b{color:var(--acc);font-weight:600}
.cx-inst-lh{margin-top:10px;min-height:36px;padding:6px 10px;width:auto}
.cx-inst-pack{display:flex;flex-direction:column;gap:8px;margin:4px 0 12px;padding:14px 16px;border:1px solid var(--acc-line);border-radius:12px;background:color-mix(in srgb,var(--acc) 4%,var(--surface))}
.cx-inst-pack>b{font-size:14px;font-weight:650}
.cx .cx-inst-pack p{font-size:12.5px;color:var(--t2)}
.cx-inst-pack ul{margin:0;padding-left:18px;list-style:disc;font-size:13px;color:var(--text)}
.cx-inst-pack li{margin:2px 0}

@media (max-width:1000px){
  .cx-cs-layout{grid-template-columns:1fr}
  .cx-cs-side{position:static}
}
@media (max-width:899px){
  .cx-cs-top .cx-page-acts{flex-wrap:wrap}
  .cx-cs-who{grid-template-columns:1fr 1fr}
  .cx-cs-who .cx-field:last-child{grid-column:1/-1}
  .cx-cs-vin{grid-template-columns:repeat(3,minmax(0,1fr))}
  .cx-cs-o2{grid-column:1/-1}
  .cx-inst-h{align-items:stretch;flex-direction:column}
  .cx-inst-acts{width:100%}
  .cx-inst-acts .cx-btn{flex:1;justify-content:center}
  .cx-casebar{margin-bottom:-8px}
}

/* ================================================================ wallpaper */
.cx-wall-pick{display:grid;grid-template-columns:repeat(4,64px);gap:8px;flex-shrink:0}
.cx-wall-pick button{display:flex;flex-direction:column;align-items:center;gap:4px}
.cx-wall-pick button>span{width:64px;height:44px;border:1px solid var(--line2);border-radius:9px;background-color:var(--bg);background-repeat:repeat;transition:box-shadow .12s,border-color .12s}
.cx-wall-pick button:hover>span{border-color:color-mix(in srgb,var(--text) 24%,var(--line2))}
.cx-wall-pick button.on>span{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc-soft)}
.cx-wall-pick small{font-size:11px;font-weight:550;color:var(--t3)}
.cx-wall-pick button.on small{color:var(--acc)}
/* over a wallpaper, answers, cards and the bars stay readable */
.cx-main[style*="background-image"] .cx-top{background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(8px)}
.cx-main[style*="background-image"] .cx-dock{background:linear-gradient(to bottom,transparent,color-mix(in srgb,var(--bg) 70%,transparent) 30%)}
.cx-main[style*="background-image"] .cx-dock{background:linear-gradient(to bottom,transparent,color-mix(in srgb,var(--bg) 88%,transparent) 18px)}
.cx-main[style*="background-image"] .cx-thread>.cx-a{padding:14px 18px;margin:0 -18px;border-radius:16px;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(2px)}
.cx-main[style*="background-image"] .cx-page>:not(header){position:relative}
.cx-main[style*="background-image"] :is(.cx-page-h,.cx-fh-h){padding:4px 0}
@media (max-width:899px){
  .cx-wall-pick{grid-template-columns:repeat(4,minmax(0,1fr));width:100%}
  .cx-wall-pick button>span{width:100%}
}

/* ================================================================ read tool */
.cx-read-pick{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:10px 14px 0}
.cx-read-pick>span{margin-right:4px;font-size:11.5px;font-weight:650;color:var(--t3)}
.cx-read-pick button{height:26px;padding:0 10px;border:1px solid var(--line2);border-radius:999px;background:var(--surface);font-size:12px;font-weight:550;color:var(--t2);transition:border-color .12s,color .12s,background .12s}
.cx-read-pick button:hover{color:var(--text);border-color:color-mix(in srgb,var(--text) 24%,var(--line2))}
.cx-read-pick button.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc)}

/* ================================================================ drugs */
.cx-dr-tools .cx-select{min-width:0;height:38px;appearance:auto}
.cx-dr-list{display:flex;flex-direction:column;gap:8px}
.cx-dr-card{border:1px solid var(--line);border-radius:12px;background:var(--surface);transition:border-color .12s}
.cx-dr-card.open{border-color:var(--acc-line)}
.cx-dr-h{display:flex;align-items:center;gap:12px;width:100%;padding:11px 14px;text-align:left}
.cx-dr-ic{width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--acc-soft);color:var(--acc)}
.cx-dr-t{flex:1;min-width:0}
.cx-dr-t b{display:block;font-size:14px;font-weight:650}
.cx-dr-t small{display:block;margin-top:1px;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-dr-tags{display:flex;gap:5px;flex-shrink:0}
.cx-dr-tags em{height:20px;padding:0 7px;display:inline-flex;align-items:center;border:1px solid var(--line2);border-radius:999px;font-style:normal;font-size:10.5px;font-weight:700;color:var(--t2)}
.cx-dr-tags em.nlem{border-color:color-mix(in srgb,var(--good) 40%,var(--line2));background:color-mix(in srgb,var(--good) 10%,transparent);color:var(--good)}
.cx-dr-tags em.s-h1,.cx-dr-tags em.s-x{border-color:color-mix(in srgb,var(--danger) 40%,var(--line2));color:var(--danger)}
.cx-dr-b{display:flex;flex-direction:column;gap:14px;padding:0 14px 14px;border-top:1px solid var(--line);padding-top:12px}
.cx-dr-dose{display:flex;flex-direction:column;margin:0;border:1px solid var(--line2);border-radius:10px;overflow:hidden}
.cx-dr-dose>div{display:grid;grid-template-columns:130px minmax(0,1fr);gap:12px;padding:8px 12px;border-bottom:1px solid var(--line);font-size:13px;line-height:1.5}
.cx-dr-dose>div:last-child{border-bottom:0}
.cx-dr-dose dt{display:flex;align-items:center;gap:5px;font-weight:600;color:var(--t3)}
.cx-dr-dose dd{margin:0;color:var(--text)}
.cx-dr-dose>div:first-child dd{font-weight:600}
.cx-dr-dose>div.warn dt{color:color-mix(in srgb,var(--warn) 80%,var(--t3))}
.cx-dr-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.cx .cx-dr-cols h4{margin-bottom:4px;font-size:12px;font-weight:650;color:var(--t3)}
.cx-dr-cols ul{margin:0;padding-left:16px;font-size:12.5px;line-height:1.5;color:var(--t2)}
.cx .cx-dr-mech{font-size:12.5px;line-height:1.5;color:var(--t2)}
.cx-dr-meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11.5px;color:var(--t3)}
.cx-dr-acts{display:flex;flex-wrap:wrap;gap:8px}
.cx .cx-dr-note{display:flex;align-items:center;gap:6px;font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-dr-rx{display:grid;grid-template-columns:230px minmax(0,1fr);gap:16px;align-items:start}
.cx-dr-rxlist{display:flex;flex-direction:column;gap:6px;position:sticky;top:12px}
.cx-dr-rxrow{display:flex;flex-direction:column;gap:2px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);text-align:left}
.cx-dr-rxrow.on{border-color:var(--acc);background:var(--acc-soft)}
.cx-dr-rxrow b{font-size:13px;font-weight:600}
.cx-dr-rxrow small{font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-dr-rxmain{display:flex;flex-direction:column;gap:14px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-dr-pick{position:relative}
.cx-dr-pick .cx-search{width:100%}
.cx-dr-sugg{position:absolute;z-index:5;left:0;right:0;top:calc(100% + 4px);margin:0;padding:4px;list-style:none;border:1px solid var(--line2);border-radius:10px;background:var(--surface);box-shadow:var(--sh3)}
.cx-dr-sugg button{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border-radius:7px;text-align:left}
.cx-dr-sugg button:hover{background:var(--hover)}
.cx-dr-sugg b{font-size:13px;font-weight:600}
.cx-dr-sugg small{flex:1;min-width:0;font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-dr-sugg em{font-style:normal;font-size:10.5px;font-weight:700;color:var(--good)}
.cx-dr-items{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.cx-dr-items li{display:flex;align-items:flex-start;gap:8px}
.cx-dr-items .n{width:24px;height:36px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:650;color:var(--t3)}
.cx-dr-item{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--s2)}
.cx-dr-item .row{display:flex;gap:6px}
.cx-dr-item .cx-input{height:36px;background:var(--surface)!important}
.cx-dr-item .name{flex:2;font-weight:600}
.cx-dr-item .sm{flex:1;min-width:80px}
.cx-dr-item .xs{width:64px;flex:0 0 64px}
.cx-dr-item select.cx-input{appearance:auto;padding-right:6px!important}
.cx-dr-ref{font-size:11.5px;color:var(--t3)}
.cx-dr-items .cx-ib{margin-top:2px}
.cx-dr-ix{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border:1px solid color-mix(in srgb,var(--danger) 35%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--danger) 5%,var(--surface))}
.cx-dr-ix>b{display:flex;align-items:center;gap:7px;font-size:13.5px;color:var(--danger)}
.cx-dr-ix ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.cx-dr-ix li{display:flex;gap:8px;font-size:13px;line-height:1.5}
.cx-dr-ix li em{flex-shrink:0;height:20px;padding:0 7px;display:inline-flex;align-items:center;border-radius:999px;font-style:normal;font-size:10.5px;font-weight:700;text-transform:capitalize;background:var(--s3);color:var(--t2)}
.cx-dr-ix li.major em{background:var(--danger);color:#fff}
.cx-dr-ix li.moderate em{background:var(--warn);color:#fff}
.cx-dr-ix li i{display:block;font-style:normal;color:var(--t2)}
.cx .cx-dr-ok{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--good)}
.cx-dr-rxacts{display:flex;flex-wrap:wrap;gap:8px}
@media (max-width:899px){
  .cx-dr-rx{grid-template-columns:1fr}
  .cx-dr-rxlist{position:static;flex-direction:row;flex-wrap:wrap}
  .cx-dr-rxlist .cx-btn{width:100%}
  .cx-dr-item .row{flex-wrap:wrap}
  .cx-dr-dose>div{grid-template-columns:1fr;gap:2px}
}

/* ================================================================ learn */
.cx-ln-wrap{display:flex;flex-direction:column}
.cx-ln-tabsrow{padding-bottom:0!important}
.cx-ln-stats b small{font-size:13px;font-weight:500;color:var(--t3);letter-spacing:0}
.cx-ln-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:16px}
.cx-ln-card{display:flex;flex-direction:column;gap:10px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-ln-card.hero{grid-column:1/-1;background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 10%,var(--surface)),var(--surface));border-color:var(--acc-line)}
.cx-ln-card.wide{grid-column:1/-1}
.cx .cx-ln-card h2{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:650}
.cx-ln-card h2 svg{color:var(--acc)}
.cx .cx-ln-card p{font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-ln-card .cx-btn{align-self:flex-start}
.cx-ln-acts{display:flex;flex-wrap:wrap;gap:8px}
.cx-ln-boxes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.cx-ln-boxes span{display:flex;flex-direction:column;align-items:center;padding:8px 4px;border:1px solid var(--line);border-radius:9px;background:var(--s2)}
.cx-ln-boxes b{font-size:16px;font-weight:650;font-variant-numeric:tabular-nums}
.cx-ln-boxes small{font-size:10.5px;color:var(--t3)}
.cx-ln-trend{display:flex;align-items:flex-end;gap:6px;height:96px;padding:8px 4px 0}
.cx-ln-trend span{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px}
.cx-ln-trend i{display:block;width:100%;max-width:28px;border-radius:5px 5px 2px 2px;background:var(--acc)}
.cx-ln-trend i.ok{background:var(--good)}.cx-ln-trend i.mid{background:var(--warn)}.cx-ln-trend i.low{background:var(--danger)}
.cx-ln-trend small{font-size:10.5px;color:var(--t3)}
.cx-ln-table{width:100%;border-collapse:collapse;font-size:13px}
.cx-ln-table th{padding:6px 8px;border-bottom:1px solid var(--line);font-size:11.5px;font-weight:600;color:var(--t3);text-align:left}
.cx-ln-table td{padding:7px 8px;border-bottom:1px solid var(--line)}
.cx-ln-table tr:last-child td{border-bottom:0}
.cx .cx-ln-err{color:var(--danger);font-size:13.5px}
.cx-ln-resb{display:flex;flex-direction:column;gap:6px}
.cx .cx-ln-resb h2{font-size:18px;font-weight:650}
.cx .cx-ln-resb p{font-size:13.5px;line-height:1.55;color:var(--t2)}
.cx-ln-sub,.cx-ln-review{margin-top:16px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx .cx-ln-sub h3,.cx .cx-ln-review h3{margin-bottom:10px;font-size:14.5px;font-weight:650}
.cx-ln-sub ul{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.cx-ln-sub li{display:grid;grid-template-columns:170px minmax(0,1fr) 44px 48px;align-items:center;gap:10px;font-size:13px}
.cx-ln-sub li i{display:block;height:8px;border-radius:8px;background:var(--s3);overflow:hidden}
.cx-ln-sub li em{display:block;height:100%;border-radius:8px;background:var(--acc)}
.cx-ln-sub li em.ok{background:var(--good)}.cx-ln-sub li em.mid{background:var(--warn)}.cx-ln-sub li em.low{background:var(--danger)}
.cx-ln-sub li b{text-align:right;font-variant-numeric:tabular-nums}
.cx-ln-sub li small{color:var(--t3);font-variant-numeric:tabular-nums}
.cx-ln-review ol{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.cx-ln-review li{display:flex;gap:10px;padding:8px 10px;border-radius:9px;background:var(--s2);font-size:13px;line-height:1.5}
.cx-ln-review li>span{width:24px;height:24px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;font-size:11.5px;font-weight:700;color:#fff;background:var(--t3)}
.cx-ln-review li.ok>span{background:var(--good)}.cx-ln-review li.bad>span{background:var(--danger)}
.cx-ln-review li b{font-weight:650;color:var(--t3)}
.cx-ln-review li small{display:block;margin-top:2px;color:var(--t2)}
.cx-ln-mockbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;margin:-12px -4px 14px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(8px);font-size:13px;color:var(--t2)}
.cx-ln-mockbar .cx-btn{margin-left:auto}
.cx-ln-timer{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text)}
.cx-ln-timer.low{color:var(--danger)}
.cx-ln-mocklayout{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px;align-items:start}
.cx-ln-mocklayout .cx-qz-card{max-width:none}
.cx-qz-opt.picked{border-color:var(--acc);background:var(--acc-soft)}
.cx-qz-opt.picked .l{border-color:var(--acc);background:var(--acc);color:var(--on-acc)}
.cx-ln-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;position:sticky;top:64px}
.cx-ln-grid button{height:32px;border:1px solid var(--line2);border-radius:8px;background:var(--surface);font-size:12px;font-weight:600;color:var(--t2)}
.cx-ln-grid button.done{background:var(--acc-soft);border-color:var(--acc-line);color:var(--acc)}
.cx-ln-grid button.on{box-shadow:0 0 0 2px var(--acc)}
.cx-ln-syl{margin-top:16px}
.cx-ln-sylh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;font-size:13px;color:var(--t2)}
.cx-ln-sylgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px}
.cx-ln-sylsub{border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-ln-sylsub summary{display:flex;align-items:center;gap:9px;padding:10px 14px;cursor:pointer;list-style:none;font-size:13.5px}
.cx-ln-sylsub summary::-webkit-details-marker{display:none}
.cx-ln-sylsub summary svg{color:var(--acc)}
.cx-ln-sylsub summary b{flex:0 0 auto;font-weight:600}
.cx-ln-sylsub summary i{flex:1;height:6px;border-radius:6px;background:var(--s3);overflow:hidden}
.cx-ln-sylsub summary em{display:block;height:100%;background:var(--good)}
.cx-ln-sylsub summary small{font-size:11.5px;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-ln-sylsub ul{display:flex;flex-direction:column;gap:4px;margin:0;padding:0 10px 10px;list-style:none}
.cx-ln-sylsub li{display:flex;align-items:center;gap:6px}
.cx-ln-sylsub li .cx-tg{min-height:36px;padding:6px 10px}
.cx-ln-ask{flex-shrink:0;height:28px;padding:0 9px;border-radius:7px;font-size:12px;font-weight:600;color:var(--acc)}
.cx-ln-ask:hover{background:var(--acc-soft)}
@media (max-width:899px){
  .cx-ln-mocklayout{grid-template-columns:1fr}
  .cx-ln-grid{position:static;grid-template-columns:repeat(10,1fr)}
  .cx-ln-sub li{grid-template-columns:110px minmax(0,1fr) 40px 44px}
  .cx-ln-mockbar{flex-wrap:wrap;margin:0 0 12px}
}

/* ================================================================ share */
.cx-share{max-width:520px}
.cx-share .cx-dialog-h h3{display:flex;align-items:center;gap:8px}
.cx-share .cx-dialog-h h3 svg{color:var(--acc)}
.cx-share-link{display:flex;align-items:center;gap:8px}
.cx-share-link>svg{flex-shrink:0;color:var(--t3)}
.cx-share-link .cx-input{flex:1;min-width:0;height:40px;font-size:12.5px;font-family:var(--mono)}
.cx-share-link .cx-btn{height:40px}
.cx .cx-share-note{font-size:12.5px;line-height:1.5;color:var(--warn)}
.cx-share-acts{display:flex;flex-wrap:wrap;gap:8px}
.cx-share-qr{display:flex;justify-content:center;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-share-qr svg{border-radius:6px}
.cx .cx-share-foot{display:flex;gap:7px;padding-bottom:16px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-share-foot svg{flex-shrink:0;margin-top:2px;color:var(--good)}
.cx.cx-shared{position:fixed;inset:0;display:flex;flex-direction:column;overflow:auto;background:var(--bg)}
.cx-shared-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;height:56px;padding:0 20px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(8px)}
.cx-shared-tag{flex:1;font-size:12.5px;font-weight:600;color:var(--t3)}
.cx-shared-main{width:100%;max-width:820px;margin:0 auto;padding:28px 20px 60px}
.cx-shared-card{padding:26px 28px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.cx .cx-shared-card h1{font-size:24px;font-weight:650;letter-spacing:-.025em;line-height:1.2}
.cx .cx-shared-meta{display:flex;align-items:center;gap:4px;margin:6px 0 18px;font-size:12.5px;color:var(--t3)}
.cx-shared-meta svg{color:var(--good)}
.cx-shared-q{margin:0 0 16px;padding:10px 14px;border-left:3px solid var(--acc);border-radius:3px 10px 10px 3px;background:var(--s2);font-size:14px;color:var(--t2)}
.cx-shared-case{margin:0;white-space:pre-wrap;font:inherit;font-size:14px;line-height:1.65}
.cx .cx-shared-warn{display:flex;gap:8px;margin-top:20px;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--warn) 10%,transparent);font-size:12.5px;line-height:1.5;color:var(--text)}
.cx-shared-warn svg{flex-shrink:0;margin-top:2px;color:var(--warn)}
.cx-shared-cm{margin-top:18px;padding:18px 20px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx .cx-shared-cm h2{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:650}
.cx .cx-shared-note{margin-top:4px;font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx-shared-cm ul{display:flex;flex-direction:column;gap:8px;margin:14px 0 0;padding:0;list-style:none}
.cx-shared-cm li{display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center;padding:10px 12px;border-radius:10px;background:var(--s2);font-size:13.5px}
.cx-shared-cm li b{font-weight:650}
.cx-shared-cm li small{font-size:11.5px;color:var(--t3)}
.cx-shared-cm li span{grid-column:1/3;color:var(--text);white-space:pre-wrap}
.cx-shared-cm li .cx-ib{grid-row:1/3}
.cx-shared-form{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.cx-shared-form .cx-btn{align-self:flex-end}
.cx-shared-form textarea.cx-input{min-height:0}

/* ------------------------------------------------------------ premium home and navigation */
/* With More open the nav scrolls on its own, so the chats and the account footer stay in reach. */
.cx-nav{flex:0 1 auto;min-height:0;overflow-y:auto;scrollbar-width:thin}
.cx-nav>*,.cx-more>*{flex-shrink:0}
.cx-hist{min-height:150px}
.cx-more-gl{margin:8px 0 2px;padding:0 10px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3)}
.cx-more-gl:first-child{margin-top:2px}
.cx.is-collapsed .cx-more-gl{display:none}
.cx-nav-i.on{background:color-mix(in srgb,var(--acc) 12%,transparent);color:var(--text)}
.cx-nav-i.on::before{content:"";position:absolute;left:-7px;top:9px;bottom:9px;width:3px;border-radius:3px;background:var(--acc)}
.cx.is-collapsed .cx-nav-i.on::before{left:-4px}
.cx-nav .cx-new{margin-bottom:6px;background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 16%,var(--surface)),color-mix(in srgb,var(--acc) 4%,var(--surface)));border:1px solid color-mix(in srgb,var(--acc) 22%,var(--line));color:var(--text)}
.cx-nav .cx-new:hover{border-color:color-mix(in srgb,var(--acc) 45%,var(--line))}

.cx-fh-premium{position:relative;isolation:isolate}
.cx-fh-wash{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.cx-fh-wash i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;animation:cxDrift 18s ease-in-out infinite alternate}
.cx-fh-wash i:nth-child(1){width:520px;height:520px;left:-140px;top:-200px;background:color-mix(in srgb,var(--acc) 32%,transparent)}
.cx-fh-wash i:nth-child(2){width:420px;height:420px;right:-120px;top:-60px;background:color-mix(in srgb,#7C5CFF 24%,transparent);animation-delay:-6s;animation-duration:22s}
.cx-fh-wash i:nth-child(3){width:380px;height:380px;left:35%;bottom:-220px;background:color-mix(in srgb,#19B5A3 22%,transparent);animation-delay:-11s;animation-duration:26s}
.cx-dark .cx-fh-wash i{opacity:.38}
@keyframes cxDrift{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(60px,40px,0) scale(1.12)}}
.cx-main[style*="background-image"] .cx-fh-wash{display:none}

.cx-fh-eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 auto 14px;padding:5px 12px 5px 6px;border-radius:999px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface) 72%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-size:12px;font-weight:600;color:var(--t2);letter-spacing:.01em;box-shadow:0 1px 2px rgba(15,23,41,.05)}
.cx-fh-eyebrow i{width:1px;height:14px;background:var(--line2)}
.cx-fh-eb2{display:inline-flex;align-items:center;gap:8px}
.cx-fh-eb2 svg{color:var(--ok,#1E8E5A)}
.cx-fh-mark{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:color-mix(in srgb,var(--acc) 14%,var(--surface));animation:cxPulseRing 3.6s ease-out infinite}
@keyframes cxPulseRing{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--acc) 40%,transparent)}70%{box-shadow:0 0 0 9px transparent}100%{box-shadow:0 0 0 0 transparent}}
.cx .cx-fh-premium .cx-fh-h h1{font-size:34px;letter-spacing:-.035em;background:linear-gradient(120deg,var(--text) 40%,color-mix(in srgb,var(--acc) 70%,var(--text)));-webkit-background-clip:text;background-clip:text;color:transparent}
.cx-fh-premium .cx-fh-h,.cx-fh-premium .cx-fh-chips,.cx-fh-premium .cx-fh-ws,.cx-fh-premium .cx-fh-recent{animation:cxRise .5s cubic-bezier(.2,.7,.2,1) both}
/* The composer holds popover menus, so it is never animated or transformed (that would trap their z-index). */
.cx-fh-premium .cx-hero-c{position:relative;z-index:3}
.cx-fh-premium .cx-fh-chips{animation-delay:.1s}
.cx-fh-premium .cx-fh-ws{animation-delay:.15s}
.cx-fh-premium .cx-fh-recent{animation-delay:.2s}
@keyframes cxRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.cx-fh-premium .cx-hero-c .cx-composer{box-shadow:0 10px 40px -12px color-mix(in srgb,var(--acc) 28%,transparent),0 1px 2px rgba(15,23,41,.06)}

.cx-fh-ws{margin:22px 0 6px}
.cx-ws-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cx-ws-grid.compact{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.cx-ws-tile{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:12px 12px 12px 10px;border-radius:14px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface) 78%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);text-align:left;box-shadow:0 1px 2px rgba(15,23,41,.04);transition:transform .18s cubic-bezier(.2,.7,.2,1),box-shadow .18s,border-color .18s;animation:cxRise .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(.18s + var(--i,0) * .04s)}
.cx-ws-tile:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--tone) 45%,var(--line));box-shadow:0 12px 28px -14px color-mix(in srgb,var(--tone) 55%,transparent),0 1px 2px rgba(15,23,41,.05)}
.cx-ws-tile:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.cx-ws-ic{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;color:var(--tone);background:linear-gradient(145deg,color-mix(in srgb,var(--tone) 22%,var(--surface)),color-mix(in srgb,var(--tone) 8%,var(--surface)));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tone) 24%,transparent)}
.cx-ws-t{display:flex;flex-direction:column;min-width:0;gap:2px}
.cx-ws-t b{font-size:14px;font-weight:650;color:var(--text);letter-spacing:-.01em}
.cx-ws-t small{font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-ws-go{color:var(--t3);opacity:0;transform:translateX(-4px);transition:opacity .18s,transform .18s}
.cx-ws-tile:hover .cx-ws-go{opacity:1;transform:none;color:var(--tone)}
.cx-ws-tile.tone-teal{--tone:#14A38B}.cx-ws-tile.tone-violet{--tone:#7C5CFF}.cx-ws-tile.tone-rose{--tone:#E0527A}
.cx-ws-tile.tone-amber{--tone:#D98B1F}.cx-ws-tile.tone-sky{--tone:#2E8CE6}.cx-ws-tile.tone-lime{--tone:#5BA83B}
.cx-dark .cx-ws-tile.tone-teal{--tone:#3BD1B7}.cx-dark .cx-ws-tile.tone-violet{--tone:#A08BFF}.cx-dark .cx-ws-tile.tone-rose{--tone:#F07A9C}
.cx-dark .cx-ws-tile.tone-amber{--tone:#F0B04A}.cx-dark .cx-ws-tile.tone-sky{--tone:#64B0F5}.cx-dark .cx-ws-tile.tone-lime{--tone:#8BD265}
.cx-tools-ws .cx-ws-grid{margin-top:4px}
.cx-ws-grid.compact .cx-ws-tile{animation:none}
.cx-ws-more{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.cx-fh-premium .cx-fh-row{border-radius:12px}
.cx-fh-premium .cx-fh-status button{border-radius:12px;background:color-mix(in srgb,var(--surface) 78%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.cx-dark .cx-fh-premium .cx-fh-h h1{background:linear-gradient(120deg,#fff 30%,color-mix(in srgb,var(--acc) 80%,#fff));-webkit-background-clip:text;background-clip:text}
@media (max-width:860px){.cx-ws-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cx .cx-fh-premium .cx-fh-h h1{font-size:26px}.cx-fh-wash i{filter:blur(50px)}}
@media (max-width:480px){.cx-ws-grid{grid-template-columns:1fr}.cx-fh-eb2{display:none}}
@media (prefers-reduced-motion:reduce){.cx-fh-wash i,.cx-fh-mark,.cx-ws-tile,.cx-fh-premium .cx-fh-h,.cx-fh-premium .cx-fh-chips,.cx-fh-premium .cx-fh-ws,.cx-fh-premium .cx-fh-recent{animation:none}}
`;
