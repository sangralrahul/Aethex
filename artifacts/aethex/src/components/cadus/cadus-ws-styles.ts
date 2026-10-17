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
`;
