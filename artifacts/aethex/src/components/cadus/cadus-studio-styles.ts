/**
 * Styles for Consult Translator, Clinical Pathways, Flashcards and Compare over time
 * (update 11). Built on the shared page, field, button and Labs styles; loaded last.
 */
export const CADUS_STUDIO_CSS = `
/* Consult Translator */
.cx-tr-bar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;margin-bottom:12px}
.cx-tr-bar .cx-field{min-width:220px}
.cx-tr-bar .cx-field>span{display:inline-flex;align-items:center;gap:5px}
.cx-tr-acts{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}
.cx-tr-log{display:flex;flex-direction:column;gap:10px;min-height:200px;padding:4px 0 12px}
.cx-tr-start{display:flex;flex-direction:column;gap:6px}
.cx-tr-phrases{display:flex;flex-wrap:wrap;gap:6px}
.cx-tr-phrases button{padding:7px 12px;border:1px dashed var(--line2);border-radius:999px;background:none;color:var(--t2);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.cx-tr-phrases button:hover{background:var(--hover)}
.cx-tr-turn{max-width:min(720px,88%);display:flex;flex-direction:column;gap:5px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-tr-turn.doctor{align-self:flex-start;border-bottom-left-radius:4px}
.cx-tr-turn.patient{align-self:flex-end;border-bottom-right-radius:4px;background:color-mix(in srgb,var(--acc) 6%,var(--surface))}
.cx-tr-turn.pending{align-self:center;padding:14px 18px}
.cx-tr-turn p{margin:0}
.cx-tr-who{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:650;letter-spacing:.04em;text-transform:uppercase;color:var(--t3)}
.cx-tr-said{font-size:13.5px;color:var(--t2)}
.cx-tr-trans{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.cx-tr-trans b{font-size:18px;font-weight:600;line-height:1.45;color:var(--text)}
.cx-tr-back{display:flex;align-items:flex-start;gap:5px;font-size:12.5px;color:var(--t3);font-style:italic}
.cx-tr-back svg{flex-shrink:0;margin-top:3px}
.cx-tr-terms{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;color:var(--t2)}
.cx-tr-flag{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--danger) 10%,transparent);color:var(--danger);font-size:13px;font-weight:600}
.cx-tr-input{position:sticky;bottom:0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px;border:1px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface);box-shadow:0 -6px 20px rgba(0,0,0,.06);margin-bottom:14px}
.cx-tr-input .cx-input{flex:1;min-width:200px}
.cx-tr-input .cx-seg button{display:inline-flex;align-items:center;gap:5px}
.cx-tr-input .cx-btn.rec{background:color-mix(in srgb,var(--danger) 14%,var(--surface));color:var(--danger);border-color:var(--danger)}
.cx-tr .cx-lf-saved .cx-sc-row{display:flex;align-items:center;gap:6px;padding:0 4px 0 0}
.cx-tr .cx-lf-saved .cx-sc-row>button:first-child{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;padding:8px 10px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}

/* Clinical Pathways */
.cx-pw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:16px}
.cx-pw-card{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-pw-card:hover{background:var(--hover)}
.cx-pw-card.on{border-color:var(--acc);background:var(--acc-soft)}
.cx-pw-card b{font-size:14px}
.cx-pw-card small{font-size:12px;color:var(--t3)}
.cx-pw-start{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:10px;align-items:end;padding:14px;border:1px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface);margin-bottom:16px}
.cx-pw-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
.cx-pw-head h1{margin:0;font-size:22px}
.cx-pw-head p{margin:2px 0 0;color:var(--t2);font-size:14px}
.cx-pw-trail{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:4px}
.cx-pw-trail li{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--t2)}
.cx-pw-trail li svg{color:var(--acc);flex-shrink:0}
.cx-pw-trail li span{flex:1;min-width:0}
.cx-pw-trail li b{color:var(--text);font-weight:600;margin-right:4px}
.cx-pw-trail .cx-link{border:0;background:none;font-size:12px;cursor:pointer}
.cx-pw-step,.cx-pw-end{display:flex;flex-direction:column;gap:10px;padding:16px 18px;border:1px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface);margin-bottom:14px}
.cx-pw-step.k-action{border-left:4px solid var(--warn)}
.cx-pw-step.pending{flex-direction:row;align-items:center;gap:10px;color:var(--t3);font-size:13.5px}
.cx-pw-step h2,.cx-pw-end h2{margin:0;font-size:18px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.cx-pw-kind{display:flex;align-items:center;gap:6px;margin:0;font-size:11.5px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--t3)}
.cx-pw-kind small{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:500}
.cx-pw-flags{display:flex;align-items:flex-start;gap:6px;margin:0;font-size:13px;color:var(--danger)}
.cx-pw-flags svg{flex-shrink:0;margin-top:2px}
.cx-pw-opts{display:flex;flex-wrap:wrap;gap:8px}
.cx-pw-opts .cx-btn{min-height:40px}
.cx-pw-other{display:flex;gap:6px}
.cx-pw-other .cx-input{flex:1;min-width:0}
.cx-pw-end{border-color:color-mix(in srgb,var(--acc) 40%,var(--line))}
.cx-pw-disp{display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:999px;font-size:13px;font-weight:650;background:var(--acc-soft);color:var(--acc)}
.cx-pw-disp.d-discharge{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-pw-disp.d-admiticuhdu,.cx-pw-disp.d-urgentintervention{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-pw-disp.d-admitward,.cx-pw-disp.d-refer{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-pw-plan li{display:list-item}
.cx-pw-plan{margin:0;padding-left:20px;list-style:disc;display:flex;flex-direction:column;gap:4px;font-size:14px}

/* Flashcards */
.cx-fc-make{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface);margin-bottom:14px}
.cx-fc-make-f{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
.cx-field.inline{flex-direction:row;align-items:center;gap:8px}
.cx-fc-due{display:flex;align-items:center;gap:6px;font-weight:600;color:var(--acc)}
.cx-fc-decks{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.cx-fc-deck{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-fc-deck h3{margin:0;font-size:15px}
.cx-fc-deck p{margin:0;font-size:13px;color:var(--t3)}
.cx-fc-deck b.due{color:var(--acc)}
.cx-fc-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;width:100%;min-height:300px;padding:28px;border:1px solid var(--line2);border-radius:18px;background:var(--surface);color:var(--text);font:inherit;text-align:center;cursor:pointer;box-shadow:0 10px 30px -18px rgba(0,0,0,.25)}
.cx-fc-tag{font-size:11px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:var(--t3)}
.cx-fc-front{font-size:21px;font-weight:600;line-height:1.4;max-width:640px}
.cx-fc-back{font-size:18px;line-height:1.5;color:var(--acc);max-width:640px;padding-top:14px;border-top:1px solid var(--line);width:100%}
.cx-fc-card small{color:var(--t3);font-size:12.5px}
.cx-fc-grades{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.cx-fc-grades .cx-btn{flex-direction:column;height:auto;padding:8px 6px;gap:1px}
.cx-fc-grades .cx-btn small{font-size:11px;color:var(--t3)}
.cx-fc-grades .g-again{border-color:color-mix(in srgb,var(--danger) 45%,var(--line));color:var(--danger)}
.cx-fc-grades .g-good{border-color:color-mix(in srgb,var(--ok) 45%,var(--line));color:var(--ok)}

/* Compare over time */
.cx-cmp .cx-sc-kinds{margin-bottom:12px}
.cx-cmp-sides{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:center}
.cx-cmp-arrow{color:var(--t3)}
.cx-cmp-side{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);align-self:stretch}
.cx-cmp-label{margin:0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.cx-cmp-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:140px;padding:10px;border:1.5px dashed var(--line2);border-radius:10px;color:var(--t3)}
.cx-cmp-drop img{max-width:100%;max-height:180px;object-fit:contain;border-radius:6px}
.cx-cmp-go{display:flex;gap:8px;margin:12px 0 4px}
.cx-cmp-go .cx-input{flex:1;min-width:0}
.cx-cmp-out{display:flex;flex-direction:column;gap:12px;margin:12px 0}
.cx-cmp-trend{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:999px;font-size:11px;font-weight:650;background:var(--s2);color:var(--t2)}
.cx-cmp-trend.t-better,.cx-cmp-trend.t-resolved{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-cmp-trend.t-worse,.cx-cmp-trend.t-new{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}

@media (max-width:760px){
  .cx-pw-start{grid-template-columns:1fr}
  .cx-cmp-sides{grid-template-columns:1fr}
  .cx-cmp-arrow{transform:rotate(90deg);justify-self:center}
  .cx-tr-turn{max-width:100%}
  .cx-tr-acts{margin-left:0}
  .cx-fc-front{font-size:18px}
}
`;

/* Update 12: Med Reconciliation, Presentation Coach and Today */
export const CADUS_TODAY_CSS = `
.cx-mr-stage{margin-bottom:12px}
.cx-mr-pt{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:12px 0}
.cx-mr-pt .cx-input,.cx-mr-pt .cx-select{width:100%;min-width:0;box-sizing:border-box}
.cx-mr-chg{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:999px;font-size:11px;font-weight:650;background:var(--s2);color:var(--t2)}
.cx-mr-chg.c-stopped{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}
.cx-mr-chg.c-started{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-mr-chg.c-changed,.cx-mr-chg.c-unclear{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-pc-opts{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 8px}
.cx-pc-timer{display:inline-flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums;font-weight:600;color:var(--t2)}
.cx-pc-timer.over{color:var(--danger)}
.cx-pc-text{width:100%;box-sizing:border-box;font-size:15px;line-height:1.6}
.cx-pc-words{color:var(--t3);font-size:12px;align-self:center}
.cx-pc .cx-btn.rec{background:color-mix(in srgb,var(--danger) 14%,var(--surface));color:var(--danger);border-color:var(--danger)}
.cx-pc-time{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ok);font-weight:600}
.cx-pc-time.over{color:var(--warn)}
.cx-pc-rubric{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.cx-pc-row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(80px,1fr) 44px;gap:4px 10px;align-items:center;font-size:13px}
.cx-pc-row small{grid-column:1/-1;color:var(--t3);font-size:12px}
.cx-pc-bar{height:8px;border-radius:999px;background:var(--s2);overflow:hidden}
.cx-pc-bar i{display:block;height:100%;border-radius:999px;background:var(--danger)}
.cx-pc-bar i.m{background:var(--warn)}.cx-pc-bar i.g{background:var(--ok)}
.cx-today .cx-crew-eyebrow{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.cx-td-left{align-self:flex-start;padding:6px 12px;border-radius:999px;background:var(--s2);font-size:12.5px;color:var(--t2);white-space:nowrap}
.cx-td-quick{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:16px}
.cx-td-quick button{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:12px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);color:var(--text);font:inherit;font-size:13px;font-weight:600;text-align:left;cursor:pointer}
.cx-td-quick button:hover{background:var(--hover)}
.cx-td-quick svg{color:var(--acc)}
.cx-td-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.cx-td-card{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-td-h{display:flex;align-items:center;gap:8px;font-size:14px}
.cx-td-h svg{color:var(--acc)}
.cx-td-h em{margin-left:auto;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:var(--acc-soft);color:var(--acc);font-style:normal;font-size:12px;font-weight:700;display:inline-grid;place-items:center}
.cx-td-empty{margin:0;font-size:13.5px;color:var(--t3)}
.cx-td-card>.cx-link{align-self:flex-start;border:0;background:none;padding:0;font-size:13px;cursor:pointer}
.cx-td-jobs,.cx-td-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:13.5px}
.cx-td-jobs li,.cx-td-list li{display:flex;align-items:flex-start;gap:8px}
.cx-td-jobs li>button{display:inline-flex;border:0;background:none;color:var(--t3);cursor:pointer;padding:1px}
.cx-td-jobs li>button:hover{color:var(--ok)}
.cx-td-jobs span,.cx-td-list span{flex:1;min-width:0;display:block}
.cx-td-jobs span b{display:inline;margin-right:4px}
.cx-td-jobs small,.cx-td-list small{display:block;color:var(--t3);font-size:12px}
.cx-td-jobs li.more{color:var(--t3);font-size:12.5px;padding-left:24px}
.cx-td-list li>svg{flex-shrink:0;margin-top:3px;color:var(--t3)}
.cx-td-list .cx-link{border:0;background:none;padding:0;font-size:12.5px;cursor:pointer;white-space:nowrap}
.cx-td-chat{display:flex;width:100%;border:0;background:none;padding:2px 0;color:inherit;font:inherit;text-align:left;cursor:pointer}
.cx-td-chat b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-width:900px){.cx-td-quick{grid-template-columns:repeat(3,minmax(0,1fr))}.cx-mr-pt{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.cx-td-quick{grid-template-columns:repeat(2,minmax(0,1fr))}.cx-td-grid{grid-template-columns:1fr}}
`;

/** Update 14: Discharge Summary, Shift Handover, Differential Builder and the Study Planner. */
export const CADUS_WARD_CSS = `
.cx-ds-ward{max-width:520px;margin-bottom:10px}
.cx-ds-ward span{display:inline-flex;align-items:center;gap:6px}
.cx-ho .cx-seg,.cx-stp .cx-seg{flex-wrap:wrap}
.cx-ho-pick{display:flex;flex-direction:column;gap:6px;margin:14px 0}
.cx-ho-pick .cx-gl{display:flex;justify-content:space-between;align-items:center}
.cx-ho-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);font-size:14px;cursor:pointer;min-width:0}
.cx-ho-row span{flex:1;min-width:0;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-ho-row em,.cx-ho-sev,.cx-dx-like,.cx-dx-cm,.cx-stp-kind{font-style:normal;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--s2);color:var(--t2);white-space:nowrap}
.cx-ho-row em.sick,.cx-ho-sev.sev-unstable,.cx-dx-cm{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-ho-sev.sev-watcher,.cx-dx-like.l-possible{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-ho-sev.sev-stable,.cx-dx-like.l-likely{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-ho-list{display:flex;flex-direction:column;gap:10px;margin:14px 0}
.cx-ho-card{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border:1px solid var(--line);border-left:4px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-ho-card.sev-unstable{border-left-color:var(--danger)}
.cx-ho-card.sev-watcher{border-left-color:var(--warn)}
.cx-ho-card.sev-stable{border-left-color:var(--ok)}
.cx-ho-card.read{opacity:.72}
.cx-ho-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.cx-ho-h span{color:var(--t2);font-size:14px}
.cx-ho-read{margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid var(--line2);border-radius:999px;background:none;color:var(--t2);font:inherit;font-size:12.5px;cursor:pointer}
.cx-ho-read.on{border-color:var(--ok);color:var(--ok)}
.cx-ho-sum,.cx-ho-sec{margin:0;font-size:14px;line-height:1.5;display:flex;gap:10px}
.cx-ho-sec ul{margin:0;padding-left:16px;display:flex;flex-direction:column;gap:3px}
.cx-ho-sec li.watch{color:var(--warn);list-style:none;margin-left:-16px}
.cx-ho abbr{flex:none;width:22px;height:22px;display:inline-grid;place-items:center;border-radius:6px;background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--acc);font-size:12px;font-weight:700;text-decoration:none}
.cx-ho-done{display:flex;align-items:center;gap:8px;color:var(--ok);font-weight:600}
.cx-rxc-verdict ol{margin:6px 0 0;padding-left:18px}
.cx-rxc-verdict > .cx-btn{margin-left:auto;align-self:center}
.cx-dx-pt{grid-template-columns:110px auto minmax(0,1fr)}
.cx-dx-res{margin-top:8px}
.cx-dx-sum{font-size:15px;font-weight:600;margin:0 0 12px}
.cx-dx-list{display:flex;flex-direction:column;gap:10px;margin:12px 0;padding:0;list-style:none;counter-reset:dx}
.cx-dx-item{counter-increment:dx;display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-dx-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cx-dx-h b::before{content:counter(dx) ". ";color:var(--t3)}
.cx-dx-fa p{margin:2px 0;font-size:13.5px;color:var(--t2);line-height:1.5}
.cx-dx-fa span{display:inline-block;min-width:58px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.cx-dx-fa .for{color:var(--ok)}.cx-dx-fa .against{color:var(--danger)}.cx-dx-fa .test{color:var(--acc)}
.cx-dx-item .cx-link{align-self:flex-start}
.cx-stp,.cx-dx,.cx-ds,.cx-ho{width:100%;box-sizing:border-box}
.cx-stp-form{display:grid;grid-template-columns:auto 180px minmax(160px,260px);gap:14px;align-items:end;margin-bottom:14px}
.cx-stp-form input[type=range]{width:100%;accent-color:var(--acc)}
.cx-stp-subjects .cx-gl{display:flex;justify-content:space-between;align-items:center}
.cx-stp-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.cx-stp-chips button{padding:6px 12px;border:1px solid var(--line2);border-radius:999px;background:none;color:var(--t2);font:inherit;font-size:13px;cursor:pointer}
.cx-stp-chips button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,transparent);color:var(--text)}
.cx-stp-prog{display:flex;align-items:center;gap:12px;margin:4px 0 14px;font-size:13.5px;color:var(--t2)}
.cx-stp-bar{flex:1;height:8px;border-radius:999px;background:var(--s2);overflow:hidden}
.cx-stp-bar i{display:block;height:100%;background:var(--acc);border-radius:inherit}
.cx-stp-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin:8px 0 14px}
.cx-stp-day{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);min-width:0}
.cx-stp-day.big{border-color:color-mix(in srgb,var(--acc) 45%,var(--line));margin-bottom:12px}
.cx-stp-day.done{opacity:.6}
.cx-stp-dh{display:flex;align-items:center;gap:8px}
.cx-stp-dh .cx-stp-kind{margin-left:auto}
.cx-stp-tick{display:inline-grid;place-items:center;padding:0;border:0;background:none;color:var(--t3);cursor:pointer}
.cx-stp-tick.on{color:var(--ok)}
.cx-stp-kind.k-mock{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-stp-kind.k-revise{background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--acc)}
.cx-stp-kind.k-rest{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-stp-task{margin:0;font-size:13px;color:var(--t2)}
.cx-stp-items{margin:0;padding-left:16px;font-size:13.5px;display:flex;flex-direction:column;gap:2px}
.cx-stp-items span{font-weight:600}
@media (max-width:700px){.cx-stp-form,.cx-dx-pt{grid-template-columns:1fr}.cx-ho-read{margin-left:0}}
`;
