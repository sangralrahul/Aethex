/**
 * Styles for Cadus Crew update 10: the @ picker and chip in the composer, an assistant's
 * name on its answers, knowledge files, sharing and importing, and Crew Huddle.
 */
export const CADUS_CREW_CSS = `

/* @ picker and chip */
.cx-composer{position:relative}
.cx-at{position:absolute;left:10px;right:10px;bottom:calc(100% + 6px);z-index:30;display:flex;flex-direction:column;gap:2px;max-height:320px;overflow-y:auto;padding:6px;border:1px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface);box-shadow:0 14px 40px -12px rgba(0,0,0,.28)}
.cx-composer.is-hero .cx-at{bottom:auto;top:calc(100% + 6px)}
.cx-at-h{display:flex;align-items:center;gap:5px;margin:2px 6px 4px;font-size:11px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--t3)}
.cx-at button{display:flex;align-items:center;gap:10px;width:100%;padding:7px 8px;border:0;border-radius:var(--r,8px);background:none;color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-at button.on{background:var(--hover)}
.cx-at button>span:not(.cx-crew-badge){display:flex;flex-direction:column;min-width:0}
.cx-at button b{font-size:13.5px;font-weight:600}
.cx-at button small{font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-mention{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;margin:8px 12px 0;padding:3px 6px 3px 4px;border-radius:999px;background:color-mix(in srgb,var(--tone) 12%,transparent);color:var(--text);font-size:12.5px}
.cx-mention b{color:var(--tone)}
.cx-mention button{display:inline-flex;border:0;background:none;color:var(--t3);cursor:pointer;padding:2px}
.cx-u-priv.tag.at{color:var(--acc)}
.cx-a-crew{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:650;color:var(--text)}
.cx-a-crew .cx-crew-badge{border-radius:30%}

/* crew page */
.cx-crew-tips{display:flex;flex-wrap:wrap;gap:8px 18px;margin:4px 0 6px;font-size:13px;color:var(--t2)}
.cx-crew-tips span{display:inline-flex;align-items:center;gap:6px}
.cx-crew-tips .cx-link{font-size:13px;padding:0;border:0;background:none;cursor:pointer}
.cx-crew-sh span{font-size:11.5px;font-weight:600;color:var(--t3)}
.cx-ci-paste{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 4px}
.cx-ci-paste .cx-input{flex:1;min-width:220px}
.cx-ci-paste label.cx-btn{cursor:pointer}

/* knowledge */
.cx-ck{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--s2)}
.cx-ck-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px}
.cx-ck-h span{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600}
.cx-ck-h small,.cx-ck-hint{font-size:12px;color:var(--t3)}
.cx-ck-hint{margin:0}
.cx-ck-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.cx-ck-list li{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border:1px solid var(--line);border-radius:var(--r,8px);background:var(--surface);font-size:13px}
.cx-ck-list li span{flex:1;min-width:0;display:flex;flex-direction:column}
.cx-ck-list li b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-ck-list li small{color:var(--t3);font-size:11.5px}
.cx-ck-paste{display:flex;flex-direction:column;gap:6px}
.cx-ck-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-start}
.cx-ck-paste .cx-ck-acts{justify-content:flex-end}

/* share and import */
.cx-cs{max-width:560px}
.cx-cs-link{display:flex;align-items:center;gap:8px;color:var(--t3)}
.cx-cs-link .cx-input{flex:1;min-width:0;font-family:var(--mono,ui-monospace,monospace);font-size:12px}
.cx-cs-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.cx-cs-qr{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:14px}
.cx-cs-qr span{display:block;line-height:0;border-radius:10px;overflow:hidden}
.cx-cs-qr small,.cx-cs-note{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--t3)}
.cx-cs-note{margin:12px 0 0;align-items:flex-start}
.cx-cs-note svg{flex-shrink:0;margin-top:2px}
.cx-ci-instr{margin:0 0 10px;max-height:220px;overflow:auto;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r,8px);background:var(--s2);font-family:inherit;font-size:13px;line-height:1.55;white-space:pre-wrap}
.cx-ci-st{margin:0;padding-left:18px;font-size:13.5px;display:flex;flex-direction:column;gap:3px}

/* Crew Huddle */
.cx-huddle .cx-crew-eyebrow{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.cx-hd-ask{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--line2);border-radius:var(--r-lg,12px);background:var(--surface);margin-bottom:18px}
.cx-hd-picked,.cx-hd-presets{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.cx-hd-chip{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 6px 0 5px;border:1px solid color-mix(in srgb,var(--tone,var(--acc)) 35%,var(--line));border-radius:999px;background:color-mix(in srgb,var(--tone,var(--acc)) 8%,var(--surface));font-size:13px;font-weight:600}
.cx-hd-chip button{display:inline-flex;border:0;background:none;color:var(--t3);cursor:pointer;padding:3px}
button.cx-hd-chip.add{padding:0 12px;border-style:dashed;background:none;color:var(--t2);font:inherit;font-size:13px;cursor:pointer}
.cx-hd-presets button{height:26px;padding:0 10px;border:1px solid var(--line);border-radius:999px;background:none;color:var(--t2);font:inherit;font-size:12px;cursor:pointer}
.cx-hd-presets button.on{border-color:var(--acc);color:var(--acc);background:var(--acc-soft)}
.cx-hd-choose{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;max-height:300px;overflow-y:auto;padding:4px}
.cx-hd-choose button{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:var(--r,8px);background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-hd-choose button.on{border-color:var(--acc);background:var(--acc-soft)}
.cx-hd-choose button>span:not(.cx-crew-badge){flex:1;min-width:0;display:flex;flex-direction:column}
.cx-hd-choose .cx-crew-badge,.cx-hd-chip .cx-crew-badge,.cx-at .cx-crew-badge{flex:none}
.cx-hd-choose button b{font-size:13px}
.cx-hd-choose button small{font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-hd-form{display:flex;gap:8px;align-items:flex-end}
.cx-hd-form .cx-input{flex:1;min-width:0;resize:vertical}
.cx-hd-out{display:flex;flex-direction:column;gap:14px}
.cx-hd-q{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;font-size:16px}
.cx-hd-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
.cx-hd-grid.n3{grid-template-columns:repeat(3,minmax(0,1fr))}
.cx-hd-grid.n4{grid-template-columns:repeat(2,minmax(0,1fr))}
.cx-hd-card{display:flex;flex-direction:column;gap:8px;min-width:0;padding:12px 14px;border:1px solid var(--line);border-top:3px solid var(--tone);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-hd-card-h{display:flex;align-items:center;gap:8px}
.cx-hd-card-h b{font-size:14px}
.cx-hd-card-h small{margin-left:auto;font-size:11.5px;color:var(--t3)}
.cx-hd-body{max-height:340px;overflow-y:auto;font-size:13.5px}
.cx-hd-card .cx-link{align-self:flex-start;border:0;background:none;padding:0;font-size:12.5px;cursor:pointer}
.cx-hd-wait{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--t3);padding:6px 0}
.cx-hd-err{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0;color:var(--danger);font-size:13.5px}
.cx-hd-err .cx-link{border:0;background:none;cursor:pointer;font-size:13px}
.cx-hd-merged{display:flex;flex-direction:column;gap:10px;padding:16px 18px;border:1px solid color-mix(in srgb,var(--acc) 35%,var(--line));border-radius:var(--r-lg,12px);background:color-mix(in srgb,var(--acc) 4%,var(--surface))}
.cx-hd-merged-h{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:15px}
.cx-hd-conf{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:600;background:color-mix(in srgb,var(--ok) 13%,transparent);color:var(--ok)}
.cx-hd-conf.c-moderate{background:color-mix(in srgb,var(--warn) 15%,transparent);color:var(--warn)}
.cx-hd-conf.c-low{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}
.cx-hd-corr{padding:10px 12px;border-radius:var(--r,8px);background:color-mix(in srgb,var(--warn) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--warn) 40%,var(--line));font-size:13.5px}
.cx-hd-corr b{display:inline-flex;align-items:center;gap:5px}
.cx-hd-corr ul{margin:6px 0 0;padding-left:18px}
.cx-hd-corr span{color:var(--t2)}
.cx-hd-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;font-size:13.5px}
.cx-hd-cols ul{margin:4px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:6px}
.cx-hd-view{display:block;color:var(--t2);font-size:12.5px}
.cx-hd-cols em{display:block;color:var(--text);font-size:12.5px}
.cx-hd-recent{display:flex;flex-direction:column;gap:6px;margin-top:22px}
@media (max-width:900px){.cx-hd-grid,.cx-hd-grid.n3,.cx-hd-grid.n4{grid-template-columns:1fr}.cx-hd-form{flex-direction:column;align-items:stretch}}
`;

/** Update 16: Assistant Builder, Crew Debate and Crew Playbooks. */
export const CADUS_CREWPLUS_CSS = `
.cx-cb{display:flex;flex-direction:column;gap:10px;padding:14px 16px;margin:14px 0 6px;border:1px solid color-mix(in srgb,var(--acc) 35%,var(--line));border-radius:var(--r-lg,12px);background:color-mix(in srgb,var(--acc) 5%,var(--surface))}
.cx-cb-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cx-cb-h svg{color:var(--acc)}
.cx-cb-h small{color:var(--t3)}
.cx-cb-form{display:flex;gap:8px}
.cx-cb-form .cx-input{flex:1;min-width:0}
.cx-cb-ideas{display:flex;flex-wrap:wrap;gap:6px}
.cx-cb-ideas button{padding:5px 11px;border:1px dashed var(--line2);border-radius:999px;background:none;color:var(--t2);font:inherit;font-size:12.5px;cursor:pointer;text-align:left}
.cx-cb-ideas button:hover{background:var(--hover)}
.cx-db-setup{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
.cx-db-pick{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.cx-db-pick .cx-input{grid-column:1/-1}
.cx-db-tag{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:7px;background:var(--text);color:var(--bg,#fff);font-style:normal;font-size:12px;font-weight:700}
.cx-db-side .cx-db-tag{margin-left:auto}
.cx-db-pos{margin:0 0 6px;font-weight:600;font-size:14px;color:var(--acc)}
.cx-db-side.won{border-color:color-mix(in srgb,var(--ok) 55%,var(--line));box-shadow:0 0 0 1px color-mix(in srgb,var(--ok) 35%,transparent)}
.cx-db-reb{margin-top:10px;padding-top:10px;border-top:1px dashed var(--line2)}
.cx-db-win{display:flex;align-items:center;gap:8px;margin:4px 0;font-weight:700;color:var(--acc)}
.cx-db-bottom{margin:0 0 8px;font-size:15px}
.cx-pb-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-bottom:14px}
.cx-pb-list button{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-pb-list button.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc)}
.cx-pb-list small{color:var(--t2);font-size:12.5px;line-height:1.4}
.cx-pb-chain{display:flex;align-items:center;gap:4px;margin-top:auto}
.cx-pb-chain>span{display:inline-flex;align-items:center;gap:4px}
.cx-pb-chain i{font-style:normal;color:var(--t3);font-size:12px}
.cx-pb-steps{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:6px;counter-reset:pb}
.cx-pb-steps li{display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.cx-pb-steps li div{display:flex;flex-direction:column;min-width:0}
.cx-pb-steps small{color:var(--t2);font-size:12.5px}
.cx-pb-run{list-style:none;margin:10px 0;padding:0;display:flex;flex-direction:column;gap:14px}
.cx-pb-run>li{position:relative}
.cx-pb-task{margin:0 0 6px;font-size:13px;color:var(--t3);font-style:italic}
.cx-pb-arrow{position:absolute;left:50%;bottom:-15px;transform:translateX(-50%);color:var(--t3);background:var(--bg,transparent)}
.cx-pb-edit{display:flex;flex-direction:column;gap:10px;max-width:760px}
.cx-pb-step-e{display:grid;grid-template-columns:auto 200px minmax(0,1fr) auto;gap:8px;align-items:center}
.cx-pb-n{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--s2);font-size:12px;font-weight:700}
@media (max-width:700px){.cx-db-setup{grid-template-columns:1fr}.cx-pb-step-e{grid-template-columns:auto minmax(0,1fr) auto}.cx-pb-step-e .cx-input{grid-column:2/3}.cx-cb-form{flex-direction:column}}
`;

/** Update 18: natural voices, patient audio, consultation recording and revision podcasts. */
export const CADUS_VOICE_CSS = `
@keyframes cx-rot{to{transform:rotate(360deg)}}
.cx-rot{animation:cx-rot 1s linear infinite}
.cx-set-col{flex-direction:column;align-items:stretch;gap:10px}
.cx-set-hint{margin:0;font-size:13px;color:var(--t3)}
.cx-vs{display:flex;flex-direction:column;gap:10px}
.cx-vs-row{display:flex;gap:10px;align-items:flex-start;cursor:pointer}
.cx-vs-row span{display:flex;flex-direction:column}
.cx-vs-row small{color:var(--t3);font-size:12.5px}
.cx-vs-pick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.cx-vs-list{display:flex;flex-wrap:wrap;gap:6px}
.cx-vs-v{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid var(--line2);border-radius:999px;background:none;color:var(--text);font:inherit;font-size:12.5px;cursor:pointer}
.cx-vs-v small{color:var(--t3)}
.cx-vs-v.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,transparent)}
.cx-pa{display:flex;flex-direction:column;gap:8px;margin:12px 0;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-pa>.cx-btn{align-self:flex-start}
.cx-pa:has(>.cx-btn:only-child),.cx-pa:has(>.cx-pa-go:only-child){padding:0;border:0;background:none}
.cx-pa-h{display:flex;align-items:center;gap:8px}
.cx-pa-h small{color:var(--t3)}
.cx-pa audio,.cx-pod-out audio{width:100%}
.cx-pa-script summary{cursor:pointer;font-size:13px;color:var(--t2)}
.cx-pa-script p{white-space:pre-wrap;font-size:14px;line-height:1.6}
.cx-cr{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}
.cx-pod-opts{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:10px}
.cx-pod-out{display:flex;flex-direction:column;gap:10px;margin:14px 0}
.cx-pod-player{display:flex;align-items:center;gap:14px;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 14%,var(--surface)),var(--surface))}
.cx-pod-player div{display:flex;flex-direction:column;min-width:0}
.cx-pod-player small{color:var(--t2);font-size:12.5px}
.cx-pod-play{flex:none;width:52px;height:52px;border-radius:50%;border:0;background:var(--acc);color:#fff;display:grid;place-items:center;cursor:pointer}
.cx-pod-script{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:420px;overflow:auto}
.cx-pod-script li{padding:8px 12px;border-radius:10px;font-size:14px;line-height:1.55;background:var(--surface);border:1px solid var(--line)}
.cx-pod-script li.w-student{margin-left:28px;background:color-mix(in srgb,var(--acc) 6%,var(--surface))}
.cx-pod-script b{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--t3)}
@media (max-width:640px){.cx-vs-pick{grid-template-columns:1fr}.cx-pod-script li.w-student{margin-left:12px}}
/* Update 19: your own voice, voice role-play, the patient audio library */
.cx-pa-go{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.cx-pa-mine{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--t2);cursor:pointer}
.cx-ov{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);text-align:left;font:inherit;color:var(--text)}
.cx-ov>div:not(.cx-ov-acts){display:flex;flex-direction:column;min-width:0;flex:1}
.cx-ov small{color:var(--t3);font-size:12.5px}
.cx-ov-start{cursor:pointer;width:100%}
.cx-ov-start:hover{border-color:var(--acc)}
.cx-ov-ic{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--acc) 14%,transparent);color:var(--acc)}
.cx-ov-acts{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cx-btn.on{border-color:var(--acc);color:var(--acc)}
.cx-ov-make{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-ov-h{display:flex;justify-content:space-between;align-items:center}
.cx-ov-passage{margin:0;padding:12px 14px;border-left:3px solid var(--acc);background:color-mix(in srgb,var(--acc) 5%,transparent);border-radius:0 10px 10px 0;font-size:15px;line-height:1.7;max-height:220px;overflow:auto}
.cx-ov-takes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;font-size:13px}
.cx-ov-takes li{display:flex;align-items:center;gap:8px}
.cx-ov-takes small{color:var(--t3)}
.cx-voice-who{margin:4px 0 0;font-size:13px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.cx-voice-end.fin{display:inline-flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--acc) 13%,transparent);color:var(--acc)}
.cx-voice-end.fin:hover{background:color-mix(in srgb,var(--acc) 20%,transparent)}
.cx-alib-bar{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-bottom:10px}
.cx-alib-notes{margin:0 0 12px}
.cx-alib-notes summary{cursor:pointer;font-size:13.5px;color:var(--t2);margin-bottom:8px}
.cx-alib-notes textarea{width:100%}
.cx-alib-groups{flex-wrap:wrap;margin-bottom:10px}
.cx-alib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.cx-alib-topic{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-alib-topic:hover:not(:disabled){border-color:var(--acc)}
.cx-alib-topic:disabled{opacity:.6;cursor:default}
.cx-alib-topic>svg{flex:none;margin-top:2px;color:var(--acc)}
.cx-alib-topic span{display:flex;flex-direction:column;min-width:0}
.cx-alib-topic b{font-size:14px;font-weight:600;line-height:1.35}
.cx-alib-topic small{color:var(--t3);font-size:12px;margin-top:2px}
.cx-alib-topic.have{border-color:color-mix(in srgb,var(--acc) 40%,var(--line))}
.cx-alib-custom{display:flex;gap:8px;margin:12px 0}
.cx-alib-custom .cx-input{flex:1;min-width:0}
@media (max-width:640px){.cx-ov{flex-wrap:wrap}.cx-alib-grid{grid-template-columns:1fr}}
`;
