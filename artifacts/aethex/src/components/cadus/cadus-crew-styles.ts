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

/** Update 20: Prescription Writer, Lab Trends, Daily Clinical Case, letters, ADR, MCCD, mnemonics, generics. */
export const CADUS_CLINIC20_CSS = `
.cx-rxw-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;counter-reset:rx}
.cx-rxw-items li{counter-increment:rx;position:relative;padding:10px 12px 10px 38px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);font-size:14px;display:flex;flex-direction:column;gap:3px}
.cx-rxw-items li::before{content:counter(rx);position:absolute;left:12px;top:10px;font-weight:700;color:var(--acc)}
.cx-rxw-why{color:var(--t2)}
.cx-rxw-ref{display:inline-flex;align-items:flex-start;gap:5px;color:var(--ok,#15803d);font-size:12.5px}
.cx-rxw-ref.none{color:var(--warn,#b45309)}
.cx-rxw-ix{display:flex;flex-direction:column;gap:6px}
.cx-rxw-ix p{margin:0;display:flex;gap:6px;align-items:flex-start;padding:8px 10px;border-radius:10px;font-size:13.5px;background:color-mix(in srgb,var(--warn,#b45309) 10%,transparent)}
.cx-rxw-ix p.sev-major{background:color-mix(in srgb,var(--danger) 12%,transparent)}
.cx-lab-h3 small{font-weight:400;color:var(--t3)}
.cx-ltv-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.cx-ltv-bar .cx-input{flex:1;min-width:180px}
.cx-ltv-ctx{margin-bottom:12px}
.cx-ltv-ex{display:flex;flex-direction:column;gap:10px;margin:14px 0;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-ltv-sum{margin:0;font-size:15px;line-height:1.55}
.cx-ltv-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.5}
.cx-ltv-tag{display:inline-flex;align-items:center;gap:3px;margin-right:6px;padding:1px 7px;border-radius:999px;font-size:11.5px;text-transform:capitalize;background:var(--bg2,rgba(0,0,0,.05))}
.cx-ltv-items .t-better .cx-ltv-tag{background:color-mix(in srgb,var(--ok,#15803d) 14%,transparent);color:var(--ok,#15803d)}
.cx-ltv-items .t-worse .cx-ltv-tag{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-ltv-urgent{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--danger) 10%,transparent);color:var(--danger)}
.cx-ltv-urgent ul,.cx-ltv-urgent p{margin:4px 0 0;padding-left:18px;color:var(--text)}
.cx-ltv-urgent p{padding:0}
.cx-sc-row:has(.cx-ltv-open){display:flex;align-items:center;gap:6px}
.cx-ltv-open{flex:1;display:flex;flex-direction:column;align-items:flex-start;background:none;border:0;padding:0;font:inherit;color:inherit;text-align:left;cursor:pointer}
.cx-sim-stats b svg{vertical-align:-2px;color:#ea580c}
.cx-daily-start{display:flex;flex-direction:column;gap:12px;align-items:flex-start;margin:14px 0}
.cx-daily-case{margin:14px 0;display:flex;flex-direction:column;gap:10px}
.cx-daily-h{display:flex;gap:10px;font-size:12.5px;color:var(--t3)}
.cx-daily-h span{display:inline-flex;align-items:center;gap:4px}
.cx-daily-case h2{margin:0;font-size:20px}
.cx-daily-qs{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.cx-daily-q{margin:0 0 8px;font-size:15px;line-height:1.5}
.cx-daily-opts{display:flex;flex-direction:column;gap:6px}
.cx-daily-opts button{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;text-align:left;cursor:pointer}
.cx-daily-opts button span{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--bg2,rgba(0,0,0,.05));font-size:12px;font-weight:700}
.cx-daily-opts button:hover:not(:disabled){border-color:var(--acc)}
.cx-daily-opts button:disabled{cursor:default}
.cx-daily-opts button.right{border-color:var(--ok,#15803d);background:color-mix(in srgb,var(--ok,#15803d) 10%,var(--surface))}
.cx-daily-opts button.wrong{border-color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,var(--surface))}
.cx-daily-opts button.dim{opacity:.6}
.cx-daily-opts button svg{margin-left:auto}
.cx-daily-ex{margin:8px 0 0;padding:10px 12px;border-radius:10px;font-size:14px;line-height:1.55;background:var(--bg2,rgba(0,0,0,.04))}
.cx-daily-ex.ok{border-left:3px solid var(--ok,#15803d)}
.cx-daily-ex.no{border-left:3px solid var(--danger)}
.cx-daily-done{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 12%,var(--surface)),var(--surface))}
.cx-daily-done>svg{color:#ca8a04}
.cx-daily-done>div{display:flex;flex-direction:column}
.cx-daily-done>div b{font-size:22px}
.cx-daily-done small{color:var(--t2)}
.cx-daily-done .cx-sc-acts{width:100%}
.cx-daily-pearl{margin:0;width:100%;display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,#ca8a04 10%,transparent);font-size:14px;line-height:1.5}
.cx-docw-kinds{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin-bottom:12px}
.cx-docw-kinds button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-docw-kinds button small{color:var(--t3);font-size:12px}
.cx-docw-kinds button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,var(--surface))}
.cx-docw-caus{margin:0;font-size:14px}
.cx-docw-caus b{text-transform:capitalize}
.cx-mnem-out{display:flex;flex-direction:column;gap:10px;margin:14px 0}
.cx-mnem-out h2{margin:0;font-size:20px}
.cx-mnem-card{padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-mnem-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.cx-mnem-h b{font-size:20px;letter-spacing:.02em;color:var(--acc)}
.cx-mnem-kind{font-size:11px;padding:2px 8px;border-radius:999px;background:var(--bg2,rgba(0,0,0,.05));text-transform:uppercase;letter-spacing:.05em}
.cx-mnem-kind.classic{background:color-mix(in srgb,var(--ok,#15803d) 14%,transparent);color:var(--ok,#15803d)}
.cx-mnem-card ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;font-size:14px}
.cx-mnem-card li b{display:inline-block;min-width:28px;color:var(--acc)}
.cx-mnem-card small{display:block;margin-top:8px;color:var(--t3)}
.cx-gen-list{display:flex;flex-direction:column;gap:6px;margin:12px 0}
.cx-gen-row{display:grid;grid-template-columns:minmax(120px,200px) 1fr;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:14px}
.cx-gen-in{display:flex;align-items:center;gap:6px}
.cx-gen-out{display:flex;flex-direction:column;gap:3px;min-width:0}
.cx-gen-out small{color:var(--t2)}
.cx-gen-row.none .cx-gen-out small{color:var(--t3)}
.cx-gen-tags{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:var(--t3)}
.cx-gen-tags .nlem{display:inline-flex;align-items:center;gap:3px;color:var(--ok,#15803d);font-weight:600}
@media (max-width:640px){.cx-gen-row{grid-template-columns:1fr;gap:4px}.cx-rxw-items li{padding-left:32px}}
`;

/** Update 21: OPD queue, image quiz, dose card, subject mocks, on-call, journal club, statistics, roster. */
export const CADUS_CLINIC21_CSS = `
.cx-ln-subs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.cx-ln-subs button{padding:5px 11px;border:1px solid var(--line2,var(--line));border-radius:999px;background:none;color:var(--text);font:inherit;font-size:13px;cursor:pointer}
.cx-ln-subs button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,transparent);color:var(--acc)}
.cx-ln-mockrow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.cx-opd-add{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}
.cx-opd-add .cx-input{flex:1;min-width:150px}
.cx-opd-add .sm{flex:0 0 76px;min-width:0}
.cx-opd-list{list-style:none;margin:10px 0;padding:0;display:flex;flex-direction:column;gap:6px}
.cx-opd-row{border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-opd-row.s-in{border-color:var(--acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 20%,transparent)}
.cx-opd-row.s-done,.cx-opd-row.s-left{opacity:.7}
.cx-opd-row.prio .cx-opd-tok{background:#ca8a04}
.cx-opd-main{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;background:none;border:0;font:inherit;color:inherit;text-align:left;cursor:pointer}
.cx-opd-tok{flex:none;min-width:40px;height:40px;padding:0 6px;border-radius:10px;display:grid;place-items:center;background:var(--acc);color:#fff;font-weight:800;font-size:17px}
.cx-opd-who{flex:1;min-width:0;display:flex;flex-direction:column}
.cx-opd-who small{color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-opd-time{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;color:var(--t3);white-space:nowrap}
.cx-opd-star{color:#ca8a04}
.cx-opd-more{padding:0 12px 12px;display:flex;flex-direction:column;gap:10px}
.cx-opd-vitals{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.cx-opd-vitals label{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:var(--t3)}
.cx-opd-seen summary{cursor:pointer;color:var(--t2);font-size:14px;margin-top:8px}
.cx-opd-board{position:fixed;inset:0;z-index:130;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#0f172a;color:#fff;text-align:center}
.cx-opd-board p{margin:0;font-size:clamp(18px,3vw,32px);opacity:.7;text-transform:uppercase;letter-spacing:.1em}
.cx-opd-now{font-size:clamp(120px,24vw,320px);line-height:1;font-weight:800}
.cx-opd-next{display:flex;gap:24px;font-size:clamp(40px,7vw,96px);font-weight:700;opacity:.85}
.cx-opd-board small{margin-top:16px;font-size:18px;opacity:.6}
.cx-opd-board-x{position:absolute;top:16px;right:16px;color:#fff}
.cx-iq-thumbs{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.cx-iq-thumbs figure{position:relative;margin:0;width:110px;height:110px;border-radius:10px;overflow:hidden;border:1px solid var(--line)}
.cx-iq-thumbs img{width:100%;height:100%;object-fit:cover}
.cx-iq-thumbs figcaption{position:absolute;left:6px;top:6px;padding:0 6px;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700}
.cx-iq-thumbs .cx-ib{position:absolute;right:4px;top:4px;background:rgba(255,255,255,.85)}
.cx-iq-img{display:block;max-width:100%;max-height:420px;margin:0 auto 10px;border-radius:10px;border:1px solid var(--line)}
.cx-iq-row{display:flex;align-items:center;gap:6px}
.cx-oncall-calls{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.cx-oncall-calls button{padding:7px 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);font:inherit;font-size:13.5px;cursor:pointer}
.cx-oncall-calls button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,var(--surface));color:var(--acc);font-weight:600}
.cx-oncall-urg{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:12px;background:color-mix(in srgb,#ca8a04 12%,transparent)}
.cx-oncall-urg.u-now{background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger)}
.cx-oncall-urg.u-can-wait{background:color-mix(in srgb,var(--ok,#15803d) 12%,transparent);color:var(--ok,#15803d)}
.cx-oncall-urg div{display:flex;flex-direction:column}
.cx-oncall-urg b{font-size:17px}
.cx-oncall-urg small{color:var(--text)}
.cx-jc-bottom{padding:14px;border-radius:12px;background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 12%,var(--surface)),var(--surface));border:1px solid var(--line)}
.cx-jc-bottom p{margin:4px 0;font-size:15px;line-height:1.55}
.cx-jc-bottom small{color:var(--t3)}
.cx-jc-check{display:flex;flex-direction:column;gap:4px}
.cx-jc-check div{display:grid;grid-template-columns:72px 1fr;gap:2px 10px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:13.5px}
.cx-jc-check span{grid-row:span 2;align-self:start;text-align:center;padding:2px 0;border-radius:999px;font-size:11.5px;font-weight:700;text-transform:uppercase;background:var(--bg2,rgba(0,0,0,.05))}
.cx-jc-check .a-yes span{background:color-mix(in srgb,var(--ok,#15803d) 15%,transparent);color:var(--ok,#15803d)}
.cx-jc-check .a-no span{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-jc-check small{color:var(--t2)}
.cx-stat-out{margin:14px 0;padding:16px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);display:flex;flex-direction:column;gap:8px}
.cx-stat-out h2{margin:0;display:flex;align-items:center;gap:8px;font-size:20px;color:var(--acc)}
.cx-stat-out p{margin:0;font-size:14.5px;line-height:1.55}
.cx-roster-in{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.cx-roster-in span{display:inline-flex;align-items:center;gap:5px}
.cx-roster-counts{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;font-size:13.5px}
.cx-roster-counts span{padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface)}
.cx-roster-counts small{color:var(--t3)}
.cx-roster-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.cx-roster-grid div{display:flex;flex-direction:column;gap:2px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font-size:12.5px;min-width:0}
.cx-roster-grid div.we{background:color-mix(in srgb,var(--acc) 7%,var(--surface))}
.cx-roster-grid small{color:var(--t3)}
.cx-roster-grid b{font-weight:600;overflow-wrap:anywhere}
@media (max-width:640px){.cx-roster-in{grid-template-columns:1fr}.cx-opd-vitals{grid-template-columns:repeat(3,minmax(0,1fr))}.cx-roster-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

/** Update 22: records, rounds by voice, revision notes, analytics, pre-op, messages, pregnancy, pill chart. */
export const CADUS_CLINIC22_CSS = `
.cx-dict{display:flex;flex-direction:column;gap:6px}
.cx-dict .cx-btn{align-self:flex-start}
.cx-dict.on textarea{border-color:var(--danger);box-shadow:0 0 0 3px color-mix(in srgb,var(--danger) 15%,transparent)}
.cx-rec-vitals{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.cx-rec-vitals>div{display:flex;flex-direction:column;min-width:96px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.cx-rec-vitals small{color:var(--t3);font-size:11.5px}
.cx-rec-spark{width:80px;height:24px;color:var(--acc)}
.cx-rec-visit{display:flex;flex-direction:column;gap:10px;margin:12px 0;padding:14px;border:1px solid var(--acc);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-rec-visits{list-style:none;margin:12px 0;padding:0;display:flex;flex-direction:column;gap:8px}
.cx-rec-visits li{padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);display:flex;flex-direction:column;gap:4px;font-size:14px}
.cx-rec-visits small{color:var(--t2)}
.cx-rec-visits p{margin:0;white-space:pre-wrap}
.cx-rec-visits pre{white-space:pre-wrap;font:inherit;font-size:13px;margin:6px 0 0}
.cx-rec-vh{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}
.cx-rec-vh span{color:var(--t2)}
.cx-rec-vh .cx-link{margin-left:auto}
.cx-vround-beds{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.cx-vround-beds button{min-width:44px;padding:6px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;justify-content:center}
.cx-vround-beds button.s-sick{border-color:var(--danger)}
.cx-vround-beds button.s-watch{border-color:#ca8a04}
.cx-vround-beds button.on{background:var(--acc);border-color:var(--acc);color:#fff}
.cx-vround-beds button.done:not(.on){background:color-mix(in srgb,var(--ok,#15803d) 12%,var(--surface))}
.cx-vround-card{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-vround-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.cx-vround-h b{font-size:17px}
.cx-vround-h small{color:var(--t2)}
.cx-vround-now p{margin:0 0 4px;font-size:13.5px;color:var(--t2)}
.cx-vround-diff{width:100%;border-collapse:collapse;font-size:13.5px}
.cx-vround-diff th,.cx-vround-diff td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;white-space:pre-wrap}
.cx-vround-diff th{width:120px;color:var(--t2);font-weight:600}
.cx-vround-diff td.old{color:var(--t3);text-decoration:line-through;width:35%}
.cx-rev-due{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,#ca8a04 10%,transparent)}
.cx-rev-due b{display:inline-flex;align-items:center;gap:6px;margin-right:6px}
.cx-rev-due button{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);font:inherit;font-size:13px;cursor:pointer}
.cx-rev-note{font-size:15px}
.cx-an-stats b svg{color:var(--acc)}
.cx-an-card{padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);margin:10px 0}
.cx-an-card h3{margin:0 0 10px;font-size:14px}
.cx-an-bars{display:flex;align-items:flex-end;gap:3px;height:140px}
.cx-an-bar{flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
.cx-an-bar i{display:block;width:100%;max-width:28px;min-height:2px;border-radius:4px 4px 0 0;background:var(--acc)}
.cx-an-bar small{font-size:10.5px;color:var(--t3)}
.cx-an-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.cx-an-grid .cx-an-card{margin:0}
.cx-an-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.cx-an-list li{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) auto;gap:8px;align-items:center;font-size:13.5px}
.cx-an-list span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-transform:capitalize}
.cx-an-list i{display:block;height:8px;border-radius:4px;background:color-mix(in srgb,var(--acc) 60%,transparent)}
.cx-preop-rcri{display:flex;flex-direction:column;gap:6px;margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-preop-score{margin:6px 0 0;font-size:14px}
.cx-pmsg-bubble{align-self:flex-start;max-width:520px;padding:12px 14px;border-radius:14px 14px 14px 4px;background:#dcf8c6;color:#111;font-size:15px;line-height:1.55;white-space:pre-wrap}
.cx-preg-row{padding:12px 14px;border:1px solid var(--line);border-left:4px solid var(--t3);border-radius:10px;background:var(--surface)}
.cx-preg-row p{margin:4px 0 0;font-size:14px;line-height:1.5}
.cx-preg-h{display:flex;justify-content:space-between;gap:10px;align-items:center}
.cx-preg-h span{font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--bg2,rgba(0,0,0,.05))}
.cx-preg-row.s-safe{border-left-color:var(--ok,#15803d)}.cx-preg-row.s-safe .cx-preg-h span{color:var(--ok,#15803d)}
.cx-preg-row.s-caution{border-left-color:#ca8a04}.cx-preg-row.s-caution .cx-preg-h span{color:#a16207}
.cx-preg-row.s-avoid,.cx-preg-row.s-contraindicated{border-left-color:var(--danger)}.cx-preg-row.s-avoid .cx-preg-h span,.cx-preg-row.s-contraindicated .cx-preg-h span{color:var(--danger)}
.cx-pill-chart td,.cx-pill-chart th{font-size:15px}
@media (max-width:640px){.cx-an-grid{grid-template-columns:1fr}}
`;

export const CADUS_CLINIC23_CSS = `
.cx-c23-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0}
.cx-c23-table{width:100%;border-collapse:collapse;font-size:13.5px}
.cx-c23-table th,.cx-c23-table td{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.cx-c23-table th{color:var(--t2);font-weight:600;font-size:12.5px;white-space:nowrap;background:var(--s2)}
.cx-c23-table td small{display:block;color:var(--t3);font-size:12px;margin-top:2px}
.cx-c23-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}
.cx-c23-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:12px 0}
.cx-c23-row .cx-field{flex:1 1 160px;min-width:0}
.cx-c23-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cx-c23-two h4,.cx-cmp-out h4{margin:12px 0 4px;font-size:13.5px}
.cx-c23-doc{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);margin:10px 0;overflow-x:auto}
.cx-c23-local{margin-top:12px;padding-top:8px;border-top:1px dashed var(--line)}
.cx-c23-past{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}
.cx-c23-past li{display:flex;align-items:center;gap:8px;min-width:0}
.cx-c23-past .cx-link{flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-c23-past small{color:var(--t3)}
.cx-c23-steps{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px}
.cx-search-l{display:flex;align-items:center;gap:8px;margin:4px 0 10px;color:var(--t3)}
.cx-search-l .cx-input{flex:1}
.cx-vax-dob{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--t2)}
.cx-vax-next{display:flex;align-items:center;gap:6px;margin:8px 0;font-weight:600}
.cx-vax-table tr.s-given td{color:var(--t2)}
.cx-vax-st{display:inline-block;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;background:var(--s2);white-space:nowrap}
.cx-vax-st.s-due{background:color-mix(in srgb,var(--acc) 15%,var(--surface));color:var(--acc)}
.cx-vax-st.s-overdue{background:color-mix(in srgb,var(--danger) 12%,var(--surface));color:var(--danger)}
.cx-vax-st.s-given{background:color-mix(in srgb,var(--ok,#15803d) 12%,var(--surface));color:var(--ok,#15803d)}
.cx-vax-st.s-missed{color:var(--t3)}
.cx-vax-given{display:flex;align-items:center;gap:6px}
.cx-vax-given input[type=checkbox]{width:18px;height:18px}
.cx-vax-given .cx-input{width:150px}
.cx-diet-energy{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:var(--s2);font-size:13.5px;margin:10px 0}
.cx-diet-energy label{display:inline-flex;align-items:center;gap:6px;margin-left:auto}
.cx-diet-energy .cx-input{width:90px}
.cx-icd-table tr.principal td{background:color-mix(in srgb,var(--acc) 7%,transparent)}
.cx-icd-code{font:600 13.5px var(--mono,ui-monospace,monospace);padding:3px 8px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--text);cursor:pointer;white-space:nowrap}
.cx-icd-conf.medium{color:#a16207!important}.cx-icd-conf.low{color:var(--danger)!important}
.cx-mlc-n{text-transform:capitalize}
.cx-mlc-n.n-grievous,.cx-mlc-n.n-dangerous-to-life{color:var(--danger)}
.cx-mlc-n.n-under-observation{color:#a16207}
@media (max-width:900px){.cx-c23-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.cx-c23-two{grid-template-columns:1fr}.cx-diet-energy label{margin-left:0}.cx-c23-table{font-size:13px}}
`;

export const CADUS_CLINIC24_CSS = `
.cx-anc-flags{display:flex;flex-direction:column;gap:4px;margin:10px 0}
.cx-anc-flags p{display:flex;gap:6px;align-items:flex-start;margin:0;padding:7px 10px;border-radius:8px;font-size:13.5px;background:color-mix(in srgb,#ca8a04 10%,var(--surface))}
.cx-anc-flags p.high{background:color-mix(in srgb,var(--danger) 10%,var(--surface));color:var(--danger)}
.cx-anc-flags svg{flex:none;margin-top:2px}
.cx-vent-peep th,.cx-vent-peep td{text-align:center;white-space:nowrap;padding:5px 7px}
.cx-tele-ok{color:var(--ok,#15803d)}.cx-tele-no{color:var(--danger)}
.cx-tele-ok svg,.cx-tele-no svg{vertical-align:-2px}
.cx-bill-items{display:flex;flex-direction:column;gap:8px;margin:12px 0}
.cx-bill-item{display:grid;grid-template-columns:minmax(0,1fr) 72px 110px 36px;gap:8px;align-items:center}
.cx-bill-total{margin-left:auto;font-size:22px;font-variant-numeric:tabular-nums}
.cx-bill-day{display:flex;flex-direction:column;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--line)}
.cx-bill-x td{color:var(--t3);text-decoration:line-through}
.cx-bill-acts{white-space:nowrap}
.cx-bite-cats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:8px 0 12px}
.cx-bite-cats button{display:flex;flex-direction:column;gap:4px;text-align:left;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);color:var(--text);font:inherit;font-size:13.5px;cursor:pointer}
.cx-bite-cats button span{color:var(--t2)}
.cx-bite-cats button.on{border-color:var(--acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--acc) 25%,transparent)}
.cx-bite-cats button.c3.on{border-color:var(--danger);box-shadow:0 0 0 2px color-mix(in srgb,var(--danger) 22%,transparent)}
.cx-ns-src .cx-field{flex:1 1 200px}
.cx-ns-block h4{margin:10px 0 4px}
.cx-ns-block ul{margin:0;padding-left:18px}
.cx-imnci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0;align-items:start}
.cx-imnci-grid fieldset{display:flex;flex-direction:column;gap:8px;margin:0;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);min-width:0}
.cx-imnci-grid legend{padding:0 6px;font-weight:600;font-size:13.5px}
.cx-imnci-c{padding:10px 14px;border-radius:10px;border-left:5px solid;margin:8px 0;background:var(--surface);border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.cx-imnci-c small{display:block;color:var(--t3)}
.cx-imnci-c ul{margin:6px 0 0;padding-left:18px}
.cx-imnci-c.pink{border-left-color:#db2777;background:color-mix(in srgb,#db2777 7%,var(--surface))}
.cx-imnci-c.yellow{border-left-color:#ca8a04;background:color-mix(in srgb,#ca8a04 8%,var(--surface))}
.cx-imnci-c.green{border-left-color:#16a34a;background:color-mix(in srgb,#16a34a 7%,var(--surface))}
.cx-cme-bar{height:10px;border-radius:99px;background:var(--s2);overflow:hidden;margin:6px 0 10px}
.cx-cme-bar i{display:block;height:100%;background:var(--acc);border-radius:99px;transition:width .4s}
@media (max-width:640px){.cx-bite-cats,.cx-imnci-grid{grid-template-columns:1fr}.cx-bill-item{grid-template-columns:minmax(0,1fr) 56px 84px 32px}.cx-bill-total{margin-left:0}}
.cx-more-find{position:relative;display:flex;align-items:center;gap:7px;height:34px;margin:2px 0 6px;padding:0 9px;border:1px solid var(--line2);border-radius:9px;background:var(--surface);color:var(--t3)}
.cx-more-find input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit;font-size:13px}
.cx-more-find:focus-within{border-color:var(--acc)}
.cx-more-clear{display:grid;place-items:center;width:20px;height:20px;border-radius:6px;color:var(--t3)}
.cx-grp-h{display:flex;align-items:center;gap:10px;width:100%;height:34px;padding:0 10px;border-radius:9px;color:var(--text);font-size:13px;font-weight:600;text-align:left;transition:background .12s}
.cx-grp-h:hover{background:var(--hover)}
.cx-grp-h .cx-nav-l{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-grp-h em{font-style:normal;min-width:20px;height:18px;padding:0 6px;border-radius:999px;background:var(--s2);color:var(--t3);font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.cx-grp.open>.cx-grp-h .cx-chev{transform:rotate(180deg)}
.cx-grp-b{display:flex;flex-direction:column;gap:1px;margin:1px 0 6px 13px;padding-left:8px;border-left:1px solid var(--line2);animation:cxFade .14s ease-out}
.cx-grp-b.found{margin-left:0;padding-left:0;border-left:0}
.cx-more-none{margin:4px 10px 8px;font-size:12.5px;color:var(--t3)}
.cx.is-collapsed .cx-more-find,.cx.is-collapsed .cx-grp-h em,.cx.is-collapsed .cx-grp-h .cx-chev{display:none}
.cx.is-collapsed .cx-grp-b{margin:0;padding:0;border:0}
`;

export const CADUS_CLINIC25_CSS = `
.cx-c23-row .cx-field:has(>.cx-seg){flex:0 1 auto;max-width:100%}
.cx-c23-row .cx-field>.cx-seg{max-width:100%;overflow-x:auto}
.cx-appt-nav{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 12px}
.cx-appt-nav>b{margin-right:auto}
.cx-appt-list{list-style:none;margin:12px 0;padding:0;display:flex;flex-direction:column;gap:6px}
.cx-appt-list li{display:flex;align-items:flex-start;gap:12px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.cx-appt-list li.free{background:transparent;border-style:dashed}
.cx-appt-t{flex:none;width:52px;font-weight:700;font-variant-numeric:tabular-nums;padding-top:4px}
.cx-appt-b{flex:1;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cx-appt-b>span{flex:1;min-width:140px;display:flex;flex-direction:column}
.cx-appt-b small{color:var(--t2)}
.cx-appt-b em{font-style:normal;font-size:12px;padding:2px 8px;border-radius:99px;background:var(--s2);text-transform:capitalize}
.cx-appt-b.s-arrived em,.cx-appt-b.s-seen em{background:color-mix(in srgb,var(--ok,#15803d) 14%,var(--surface));color:var(--ok,#15803d)}
.cx-appt-b.s-no-show em{background:color-mix(in srgb,var(--danger) 12%,var(--surface));color:var(--danger)}
.cx-appt-b.s-cancelled{opacity:.55}
.cx-appt-free{color:var(--t3);font:inherit;font-size:13px;padding:4px 0}
.cx-appt-free:hover{color:var(--acc)}
.cx-stock-f{display:inline-block;margin:0 4px 2px 0;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;white-space:nowrap;background:color-mix(in srgb,#ca8a04 14%,var(--surface));color:#a16207}
.cx-stock-f.f-expired,.cx-stock-f.f-out{background:color-mix(in srgb,var(--danger) 12%,var(--surface));color:var(--danger)}
.cx-stock-adj{display:inline-flex;align-items:center;gap:4px}
.cx-stock-adj .cx-input{width:64px}
.cx-screen-q{margin:10px 0;padding-left:22px;display:flex;flex-direction:column;gap:12px}
.cx-screen-q li p{margin:0 0 6px;font-weight:500}
.cx-screen-q li.q9 p{color:var(--danger)}
.cx-screen-opts{display:flex;flex-wrap:wrap;gap:6px}
.cx-screen-opts button{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text);font:inherit;font-size:13px;cursor:pointer}
.cx-screen-opts button small{color:var(--t3)}
.cx-screen-opts button.on{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 12%,var(--surface))}
.cx-screen-urgent{padding:12px 14px;border:1px solid var(--danger);border-radius:var(--r-lg,12px);background:color-mix(in srgb,var(--danger) 8%,var(--surface));margin:10px 0}
.cx-screen-urgent b{display:flex;align-items:center;gap:6px;color:var(--danger)}
.cx-screen-urgent p{margin:6px 0 0;font-size:14px}
.cx-screen-urgent a{font-weight:700}
.cx-seg button small{color:var(--t3);font-weight:400}
.cx-kd-table td.on{font-weight:600}
.cx-kd-table td.avoid{color:var(--danger)}
.cx-kd-ai{display:flex;flex-direction:column;gap:2px;padding:10px 0;border-bottom:1px solid var(--line)}
.cx-kd-ai small{color:var(--t2)}
.cx-kd-ai p{margin:2px 0;font-size:14px}
.cx-ct-list{list-style:none;margin:12px 0;padding:0;display:flex;flex-direction:column;gap:8px}
.cx-ct-list li{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);flex-wrap:wrap}
.cx-ct-who{flex:1;min-width:160px;display:flex;flex-direction:column}
.cx-ct-who small{color:var(--t2)}
.cx-ct-list .cx-ib.on{color:#ca8a04}
.cx-acc-bars{display:flex;flex-direction:column;gap:6px;margin:12px 0}
.cx-acc-bars div{display:grid;grid-template-columns:180px minmax(0,1fr) 100px;gap:10px;align-items:center;font-size:13.5px}
.cx-acc-bars i{display:block;height:10px;border-radius:99px;background:var(--acc)}
.cx-acc-bars b{text-align:right;font-variant-numeric:tabular-nums}
.cx-acc-neg{color:var(--danger)}
@media (max-width:640px){.cx-acc-bars div{grid-template-columns:110px minmax(0,1fr) 80px}.cx-appt-t{width:44px}}
`;

export const CADUS_CLINIC26_CSS = `
.cx-c23-row .cx-search-l{flex:1 1 220px;margin:0;min-width:0}
.cx-nav-i em.cx-bk-due{background:#f59e0b;color:#fff}
.cx-bk-err{color:var(--danger);font-weight:600;margin:6px 0}
.cx-bk-keys{display:flex;flex-wrap:wrap;gap:6px}
.cx-bk-keys span{padding:3px 9px;border-radius:99px;background:var(--s2);font-size:12.5px}
.cx-ncd-on td{background:color-mix(in srgb,var(--acc) 10%,transparent);font-weight:600}
.cx-an-iv{margin-top:10px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-an-iv h4{display:flex;align-items:center;gap:6px;margin:0 0 6px}
.cx-dg-C{border-color:var(--danger)}
.cx-obs-steps{margin:8px 0;padding-left:22px;display:flex;flex-direction:column;gap:8px;font-size:14.5px}
.cx-obs-steps label{display:flex;gap:8px;align-items:flex-start;cursor:pointer}
.cx-obs-steps input{margin-top:3px;width:17px;height:17px;flex:none}
.cx-obs-steps li.done{color:var(--t3);text-decoration:line-through}
.cx-obs-timer{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0;padding:10px 12px;border-radius:10px;background:var(--s2)}
.cx-obs-timer p{flex:1;min-width:220px;margin:0;display:flex;gap:6px;align-items:flex-start}
.cx-bmw{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}
.cx-bmw-bin{padding:12px 14px;border-radius:var(--r-lg,12px);border:1px solid var(--line);border-top:6px solid;background:var(--surface)}
.cx-bmw-bin ul{margin:6px 0;padding-left:18px;font-size:13.5px}
.cx-bmw-bin small{color:var(--t2)}
.cx-bmw-bin.c-yellow{border-top-color:#eab308}.cx-bmw-bin.c-red{border-top-color:#dc2626}.cx-bmw-bin.c-white{border-top-color:#cbd5e1}.cx-bmw-bin.c-blue{border-top-color:#2563eb}
@media (max-width:640px){.cx-bmw{grid-template-columns:1fr}}
`;

export const CADUS_CLINIC27_CSS = `
.cx-handout{margin-top:10px}
.cx-asthma-zones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
.cx-asthma-zones>div{padding:12px 14px;border-radius:var(--r-lg,12px);border:1px solid var(--line);border-top:6px solid}
.cx-asthma-zones p{margin:6px 0 0;font-size:13.5px}
.cx-asthma-zones .z-green{border-top-color:#16a34a}.cx-asthma-zones .z-yellow{border-top-color:#eab308}.cx-asthma-zones .z-red{border-top-color:#dc2626}
.cx-mile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0;align-items:start}
.cx-mile-grid fieldset{display:flex;flex-direction:column;gap:6px;margin:0;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface);min-width:0}
.cx-mile-grid legend{padding:0 6px;font-weight:600}
.cx-mile-grid small{color:var(--t3)}
.cx-cc-ticks .cx-pa-mine{flex:1 1 240px}
.cx-cc-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
.cx-cc-m{padding:12px 14px;border-radius:var(--r-lg,12px);border:1px solid var(--line);border-left:5px solid #16a34a;background:var(--surface)}
.cx-cc-m.c3{border-left-color:#ca8a04}.cx-cc-m.c4{border-left-color:var(--danger);opacity:.8}
.cx-cc-h{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.cx-cc-h span{font-size:12.5px;font-weight:700;color:#15803d;white-space:nowrap}
.cx-cc-m.c3 .cx-cc-h span{color:#a16207}.cx-cc-m.c4 .cx-cc-h span{color:var(--danger)}
.cx-cc-m p{margin:6px 0 0;font-size:13.5px}
.cx-cc-why{color:var(--t2)}
.cx-imaging-ticks{display:flex;flex-direction:column;gap:8px;margin:12px 0}
@media (max-width:640px){.cx-asthma-zones,.cx-mile-grid,.cx-cc-list{grid-template-columns:1fr}}
`;

export const CADUS_CLINIC28_CSS = `
.cx-burn-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}
.cx-burn-r{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:var(--r-md,10px);background:var(--surface);min-width:0}
.cx-burn-r span{font-size:13.5px;min-width:0}
.cx-burn-r small{color:var(--t3)}
.cx-nihss{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
.cx-nihss .cx-field small{color:var(--t3);font-size:12px;line-height:1.35}
.cx-sp-clock{margin:10px 0;padding:10px 14px;border-radius:var(--r-lg,12px);background:var(--surface);border:1px solid var(--line);font-size:14.5px}
.cx-sp-clock b{font-size:20px;margin-right:6px}
.cx-sp-clock.late{border-color:var(--danger);color:var(--danger)}
.cx-sp-steps{display:flex;flex-direction:column;gap:8px;margin:10px 0}
.cx-sp-steps .cx-pa-mine{align-items:flex-start;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-md,10px);background:var(--surface)}
.cx-sp-steps .cx-pa-mine.done{border-color:#16a34a}
.cx-sp-steps em{font-style:normal;color:#15803d;font-size:12.5px;margin-left:6px}
.cx-sp-steps small{color:var(--t2)}
.cx-nnj-photo,.cx-df-l2,.cx-ht-l2{border-left:5px solid #ca8a04}
.cx-nnj-intensive,.cx-nnj-exchange,.cx-df-l3,.cx-df-l4,.cx-ht-l3,.cx-st-out{border-left:5px solid var(--danger)}
.cx-nnj-recheck{border-left:5px solid #2563eb}
@media (max-width:760px){.cx-burn-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cx-nihss{grid-template-columns:1fr}}
@media (max-width:460px){.cx-burn-grid{grid-template-columns:1fr}}
`;

export const CADUS_CLINIC29_CSS = `
.cx-cfs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}
.cx-cfs-b{display:flex;gap:10px;align-items:flex-start;text-align:left;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-md,10px);background:var(--surface);color:inherit;font:inherit;cursor:pointer;min-width:0}
.cx-cfs-b>b{font-size:20px;line-height:1;min-width:20px}
.cx-cfs-b span{display:flex;flex-direction:column;gap:2px;min-width:0}
.cx-cfs-b small{color:var(--t2);font-size:12.5px;line-height:1.35}
.cx-cfs-b.on{border-color:var(--primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary) 25%,transparent)}
.cx-ac-low{border-left:5px solid #2563eb}.cx-ac-in{border-left:5px solid #16a34a}.cx-ac-high{border-left:5px solid #ca8a04}.cx-ac-danger,.cx-pa-life,.cx-pa-severe{border-left:5px solid var(--danger)}
.cx-pa-moderate{border-left:5px solid #ca8a04}
.cx-c23-table tr.no td{color:var(--danger)}
@media (max-width:760px){.cx-cfs{grid-template-columns:1fr}}
`;

export const CADUS_CLINIC30_CSS = `
.cx-lab ul:not([class]){list-style:disc;padding-left:1.25em;margin:6px 0}
.cx-lab ul:not([class])>li{margin:3px 0;padding-left:2px}
.cx-lab ul:not([class])>li::marker{color:var(--t3)}
`;

export const CADUS_CLINIC31_CSS = `
.cx-tl-green{border-left:5px solid #16a34a}.cx-tl-amber{border-left:5px solid #d97706}.cx-tl-red{border-left:5px solid var(--danger)}
.cx-cmp-out:is(.cx-st-out,.cx-ac-low,.cx-ac-in,.cx-ac-high,.cx-ac-danger,.cx-tl-green,.cx-tl-amber,.cx-tl-red,.cx-pa-moderate,.cx-pa-severe,.cx-pa-life,.cx-nnj-photo,.cx-nnj-intensive,.cx-nnj-exchange,.cx-nnj-recheck,.cx-df-l2,.cx-df-l3,.cx-df-l4,.cx-ht-l2,.cx-ht-l3){padding-left:14px;border-radius:var(--r-md,10px)}
.cx-tl-red .cx-lab-h3{color:var(--danger)}.cx-tl-amber .cx-lab-h3{color:#b45309}.cx-tl-green .cx-lab-h3{color:#15803d}
`;

export const CADUS_CLINIC32_CSS = `
.cx-nrp-steps{display:flex;flex-direction:column;gap:8px;margin:12px 0}
.cx-nrp-s{display:flex;flex-direction:column;gap:3px;text-align:left;padding:10px 14px;border:1px solid var(--line);border-left:5px solid var(--line);border-radius:var(--r-md,10px);background:var(--surface);color:inherit;font:inherit;cursor:pointer}
.cx-nrp-s small{color:var(--t2);font-size:13px;line-height:1.4}
.cx-nrp-s.on{border-left-color:var(--primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary) 18%,transparent)}
`;

export const CADUS_CLINIC34_CSS = `
.cx-crew-find{margin:14px 0 6px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,12px);background:var(--surface)}
.cx-crew-find .cx-field>span{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.cx-crew-sug,.cx-crew-recent,.cx-crew-tpl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}
.cx-crew-sug .cx-chip,.cx-crew-recent .cx-chip{display:inline-flex;align-items:center;gap:6px}
.cx-crew-tpl>span{font-size:13px;color:var(--t2);margin-right:2px}
.cx-crew-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:14px 0 4px}
.cx-crew-bar .cx-search-l{flex:1 1 240px;min-width:0}
.cx-crew-chips{display:flex;flex-wrap:wrap;gap:6px}
.cx-chip.on{background:var(--text);color:var(--bg);border-color:var(--text)}
.cx-crew-sort{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--t2)}
.cx-crew-io{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.cx-crew-io label.cx-btn{cursor:pointer}
.cx-crew-fav.on{color:#d97706}
.cx-crew-fav.on svg{fill:currentColor}
.cx-crew-coach{margin:-4px 0 12px;padding:10px 12px;border-radius:var(--r-md,10px);border:1px solid var(--line);border-left:5px solid #d97706;font-size:13.5px}
.cx-crew-coach.good{border-left-color:#16a34a}.cx-crew-coach.low{border-left-color:var(--danger)}
.cx-crew-coach ul{margin:6px 0 0;padding-left:1.2em;list-style:disc}
.cx-so-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.cx-second .cx-chip{margin-left:6px}
.cx-crew-h{flex-wrap:wrap;row-gap:14px}
.cx-crew-h>div:first-child{flex:1 1 460px;min-width:0}
.cx-crew-h .cx-page-acts{flex-wrap:wrap}
.cx-crew-sort .cx-select{width:auto;min-width:130px}
`;

/** Update 35: crew notes and collections, team packs, settings dialog, Quiz Battle and Case Round. */
export const CADUS_CLINIC35_CSS = `
.cx-crew-note{display:flex;gap:5px;align-items:flex-start;margin-top:6px;padding:6px 8px;border-radius:8px;background:var(--line2,rgba(0,0,0,.04));font-size:12px;line-height:1.4;color:var(--t2);text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}
.cx-crew-note svg{flex:none;margin-top:2px}
.cx-crew-cols{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0 4px}
.cx-crew-cols>span{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--t2);margin-right:2px}
.cx-crew-cols .cx-chip small{opacity:.7;margin-left:4px}
.cx-link.danger{color:var(--danger)}
.cx-packs{margin:10px 0 16px}
.cx-packs-h{display:flex;justify-content:space-between;align-items:center;gap:8px}
.cx-packs-h h3{display:inline-flex;align-items:center;gap:6px;margin:0}
.cx-packs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:6px 0 10px}
.cx-pack{display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}
.cx-pack small{color:var(--t2);font-size:12px;line-height:1.4}
.cx-pack-faces{display:flex;flex-wrap:wrap;gap:4px}
.cx-pack .cx-btn{align-self:flex-start}
.cx-pack-pick{display:flex;flex-wrap:wrap;gap:6px;max-height:220px;overflow:auto;padding:4px 0}
.cx-pack-pick .cx-chip{display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.cx-cset{max-width:620px}
.cx-cset h4{display:flex;align-items:center;gap:6px;margin:14px 0 6px}
.cx-cset h4:first-child{margin-top:0}
.cx-cset .cx-pa-mine small{color:var(--t3)}
.cx-qb-score{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.cx-qb-score .cx-chip{display:inline-flex;align-items:center;gap:5px}
.cx-qb-score .cx-chip.warn{border-color:var(--danger);color:var(--danger)}
.cx-qb-opts{display:grid;gap:8px;margin:10px 0}
.cx-qb-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;cursor:pointer;transition:border-color .15s,background .15s}
.cx-qb-opt:hover:not(:disabled){border-color:var(--primary)}
.cx-qb-opt>span{flex:none;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--line2,rgba(0,0,0,.06));font-weight:700;font-size:13px}
.cx-qb-opt>svg{margin-left:auto;flex:none}
.cx-qb-opt.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 12%,transparent)}
.cx-qb-opt.wrong{border-color:var(--danger);background:color-mix(in srgb,var(--danger) 10%,transparent)}
.cx-qb-opt:disabled{cursor:default}
.cx-quizb .cx-c23-table svg{color:var(--warn);vertical-align:-2px}
.cx-cr-team{list-style:none;padding:0;margin:10px 0;display:grid;gap:6px;counter-reset:cr}
.cx-cr-team li{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);counter-increment:cr}
.cx-cr-team li::before{content:counter(cr);font-weight:700;color:var(--t3);width:16px}
.cx-cr-acts{margin-left:auto;display:inline-flex;gap:2px}
.cx-caseround .cx-cmp-out{margin-top:10px}
.cx-caseround [data-cr-step]{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--surface)}
.cx-caseround [data-cr="out"]>.cx-sc-acts{margin:12px 0 18px}
`;

/** Update 36: status epilepticus clock, chat rooms, daily drill, memory and ratings. */
export const CADUS_CLINIC36_CSS = `
.cx-se-clock{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-se-clock .t{display:inline-flex;align-items:center;gap:6px;font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;margin-right:8px}
.cx-se-log{list-style:none;padding:0;margin:6px 0;display:flex;flex-wrap:wrap;gap:6px}
.cx-se-log li{padding:4px 8px;border-radius:8px;background:var(--line2,rgba(0,0,0,.05));font-size:13px}
.cx-se-steps{list-style:none;padding:0;margin:10px 0;display:grid;gap:8px}
.cx-se-steps>li{padding:10px 14px;border:1px solid var(--line);border-left:4px solid var(--line);border-radius:10px;background:var(--surface)}
.cx-se-steps>li h4{margin:0 0 4px}
.cx-se-steps>li.now{border-left-color:var(--danger);box-shadow:0 0 0 2px color-mix(in srgb,var(--danger) 25%,transparent)}
.cx-se-steps>li.past{opacity:.6}
.cx-rm-members{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.cx-rm-members .cx-chip{display:inline-flex;align-items:center;gap:6px}
.cx-rm-log{display:flex;flex-direction:column;gap:10px;margin:12px 0;max-height:min(60vh,640px);overflow:auto;padding:4px}
.cx-rm-msg{max-width:min(720px,92%);padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);overflow-wrap:anywhere}
.cx-rm-msg.user{align-self:flex-end;background:var(--text);color:var(--bg);border-color:var(--text)}
.cx-rm-msg.user p{margin:0;white-space:pre-wrap}
.cx-rm-msg.err{border-color:var(--danger)}
.cx-rm-who{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:13px}
.cx-rm-compose{display:flex;gap:8px;align-items:flex-end}
.cx-rm-compose textarea{flex:1;min-width:0}
.cx-rm-list{display:grid;gap:8px}
.cx-rm-card{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-rm-open{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:none;border:0;padding:0;color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-rm-open small{color:var(--t2);font-size:12px}
.cx-dr-cal{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:4px;max-width:420px;margin:10px 0}
.cx-dr-cal span{aspect-ratio:1;border-radius:4px;background:var(--line2,rgba(0,0,0,.06))}
.cx-dr-cal span.on{background:color-mix(in srgb,var(--ok) 45%,transparent)}
.cx-dr-cal span.hi{background:var(--ok)}
.cx-drill [data-dr="streak"]{display:inline-flex;align-items:center;gap:4px;color:var(--warn)}
.cx-drill .cx-chip .cx-ib{width:18px;height:18px;margin-left:2px}
.cx-mem-list{list-style:none;padding:0;margin:4px 0 8px;display:grid;gap:4px}
.cx-mem-list li{display:flex;align-items:center;gap:6px;justify-content:space-between;padding:6px 8px;border-radius:8px;background:var(--line2,rgba(0,0,0,.04));font-size:13px}
.cx-imp-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:4px;font-size:13px}
.cx-imp-list small{color:var(--t2)}
.cx-lab>.cx-seg,.cx-lab .cx-nihss .cx-field>.cx-seg{max-width:100%;flex-wrap:wrap}
`;

/** Update 37: handoff, notes and flashcards, check-ins, stats and badges. */
export const CADUS_CLINIC37_CSS = `
.cx-crew-due{display:flex;align-items:center;gap:8px;width:100%;margin:12px 0 0;padding:10px 14px;border:1px solid var(--warn);border-radius:12px;background:color-mix(in srgb,var(--warn) 10%,var(--surface));color:var(--text);font:inherit;font-weight:600;text-align:left;cursor:pointer}
.cx-cn-list{display:grid;gap:8px;margin-top:10px}
.cx-cn-item{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:10px 12px}
.cx-cn-h{display:inline-flex;align-items:center;gap:6px}
.cx-cn-body{margin-top:8px;border-top:1px solid var(--line);padding-top:8px;overflow-wrap:anywhere}
.cx-fc{display:grid;gap:12px;max-width:560px}
.cx-fc-card{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--text);font:inherit;font-size:18px;line-height:1.4;text-align:center;cursor:pointer}
.cx-fc-card.flip{background:color-mix(in srgb,var(--ok) 8%,var(--surface));border-color:var(--ok)}
.cx-fc-card small{font-size:12px;color:var(--t3)}
.cx-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.cx-badge-c{display:flex;flex-direction:column;gap:4px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);opacity:.75}
.cx-badge-c.on{opacity:1;border-color:var(--warn)}
.cx-badge-c .ic{color:var(--t3)}
.cx-badge-c.on .ic{color:var(--warn)}
.cx-badge-c small{font-size:12px;color:var(--t2)}
.cx-badge-c .bar{height:6px;border-radius:3px;background:var(--line2,rgba(0,0,0,.06));overflow:hidden}
.cx-badge-c .bar i{display:block;height:100%;background:var(--ok)}
.cx-crewstats [data-cs2="level"] h3{display:flex;align-items:center;gap:6px}
.cx-cs2-tiles{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}
.cx-crewbar button[data-crew="handoff"]{margin-left:auto}
.cx-crewbar button[data-crew="handoff"]+button{margin-left:0}
.cx-lab h4:has(> svg){display:flex;align-items:center;gap:6px}
`;

/** Update 38: Crew toolbox, compare columns, timeline. */
export const CADUS_CLINIC38_CSS = `
.cx-crew-box{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:14px 0 4px}
.cx-crew-boxi{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,transform .15s}
.cx-crew-boxi:hover{border-color:var(--primary);transform:translateY(-1px)}
.cx-crew-boxi svg{color:var(--primary)}
.cx-crew-boxi small{font-size:12px;color:var(--t2);line-height:1.35}
.cx-cc-cols{display:grid;grid-template-columns:repeat(var(--n,2),minmax(0,1fr));gap:10px;margin-top:12px}
.cx-cc-cols>.cx-cmp-out{margin:0;overflow-wrap:anywhere}
@media (max-width:760px){.cx-cc-cols{grid-template-columns:1fr}}
.cx-tl-day{margin:12px 0}
.cx-tl-list{list-style:none;padding:0;margin:6px 0;display:grid;gap:6px}
.cx-tl-list li{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);overflow-wrap:anywhere}
.cx-tl-list small{flex-basis:100%;color:var(--t2);font-size:12px}
.cx-tl-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:2px 6px;border-radius:6px;background:var(--line2,rgba(0,0,0,.06));color:var(--t2)}
.cx-rm-card.on{border-color:var(--primary)}
.cx-crewvoice .cx-rm-compose{align-items:center}
@media (max-width:760px){.cx-crew-h>div:first-child{flex-basis:auto}}
`;

/** Update 39: personas, workspaces, fact-check. */
export const CADUS_CLINIC39_CSS = `
.cx-crew-av{font-weight:700;line-height:1;font-family:var(--sans,inherit)}
.cx-crew-greet{margin:4px 0 0;padding:8px 14px;border-radius:14px;background:var(--surface);border:1px solid var(--line);font-size:14px;color:var(--text);max-width:520px}
.cx-crew-persona{margin-top:4px}
.cx-crew-ws{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:12px 0 0;padding:10px 12px;border:1px solid var(--primary);border-radius:12px;background:color-mix(in srgb,var(--primary) 6%,var(--surface))}
.cx-crew-ws .cx-chip{display:inline-flex;align-items:center;gap:6px}
.cx-ws-crew{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.cx-ws-crew .cx-chip{display:inline-flex;align-items:center;gap:6px}
.cx-workspaces [data-ws="active"] h3{display:flex;align-items:center;gap:6px}
.cx-fc-ic{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--line2,rgba(0,0,0,.06));color:var(--primary)}
.cx-fc-list{list-style:none;padding:0;margin:10px 0;display:grid;gap:6px}
.cx-fc-list li{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);overflow-wrap:anywhere}
.cx-fc-list li span{display:flex;flex-direction:column;gap:2px}
.cx-fc-list li small{color:var(--t2)}
.cx-fc-list li svg{flex:none;margin-top:2px}
.cx-fc-list li.v-ok svg{color:var(--ok)}
.cx-fc-list li.v-flag{border-color:var(--danger)}
.cx-fc-list li.v-flag svg{color:var(--danger)}
.cx-fc-list li.v-unsure svg{color:var(--warn)}
.cx-pp-blocked td{opacity:.6;text-decoration:line-through}
.cx-pp-blocked td:first-child{text-decoration:none}
`;

/* Update 40: DKA clock row, share cards, translations, schedules, mentor toggle. */
export const CADUS_CLINIC40_CSS = `
.cx-dh-now td{background:color-mix(in srgb,var(--primary) 12%,var(--surface));font-weight:600}
.cx-sc-canvas{display:block;width:100%;max-width:360px;height:auto;margin:10px auto;border-radius:14px;border:1px solid var(--line);box-shadow:0 6px 24px rgba(0,0,0,.12)}
.cx-dialog.cx-tr-dialog{max-width:900px;width:calc(100vw - 32px)}
.cx-tr-dialog .cx-cc-cols>*{overflow-wrap:anywhere;min-width:0}
.cx-crew-sched-due{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0 0;padding:10px 14px;border:1px solid var(--primary);border-radius:12px;background:color-mix(in srgb,var(--primary) 8%,var(--surface))}
.cx-crew-sched-due>span{flex:1 1 200px;min-width:0;overflow-wrap:anywhere}
.cx-crew-sched-due>svg{flex:none;color:var(--primary)}
.cx-crewbar button[data-crew="mentor"]{margin-left:auto}
.cx-crewbar button[data-crew="mentor"]+button[data-crew="handoff"]{margin-left:0}
.cx-crewbar button[data-crew="mentor"].on{background:color-mix(in srgb,var(--primary) 14%,transparent);color:var(--primary);font-weight:600}
.cx-crew-mentor{display:inline-flex;align-items:center;gap:6px;margin-top:8px}
.cx-crew-mentor.on{border-color:var(--primary);color:var(--primary);font-weight:600}
.cx-crewbar>.cx-crew-badge{flex:none;overflow:visible}
.cx-schedules h4{display:flex;align-items:center;gap:6px;margin:20px 0 8px}
.cx-schedules [data-sch="days"]{margin:12px 0}
.cx-schedules .cx-sc-acts{margin:4px 0 8px}
.cx-schedules [data-sch="list"]{margin-bottom:10px}
[data-tr="missing"]{display:flex;align-items:flex-start;gap:6px}
[data-tr="missing"] svg{flex:none;margin-top:3px}
`;

/* Update 41: pins, exam banner, mistakes and exam pages. */
export const CADUS_CLINIC41_CSS = `
.cx-pinbar{display:flex;align-items:center;gap:6px;margin:0 0 14px;padding:6px 10px;border:1px dashed var(--line);border-radius:12px;overflow-x:auto;scrollbar-width:none}
.cx-pinbar::-webkit-scrollbar{display:none}
.cx-pinbar>svg{flex:none;color:var(--t2)}
.cx-pinbar .cx-chip{flex:none;display:inline-block;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@keyframes cx-pin-flash{0%,100%{box-shadow:none}30%{box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 35%,transparent)}}
.cx-a.cx-pin-flash{animation:cx-pin-flash 1.6s ease;border-radius:12px}
.cx-act.on{color:var(--primary)}
.cx-crew-exam{display:flex;align-items:center;gap:8px;width:100%;margin:12px 0 0;padding:10px 14px;border:1px solid var(--primary);border-radius:12px;background:color-mix(in srgb,var(--primary) 6%,var(--surface));color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-crew-exam>svg{flex:none;color:var(--primary)}
.cx-crew-exam>span{min-width:0;overflow-wrap:anywhere}
.cx-mistakes .cx-sc-acts,.cx-exam .cx-sc-acts{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.cx-mistakes [data-mk="q"]{margin:12px 0}
.cx-mistakes [data-mk="why"]{margin-top:10px}
.cx-mistakes [data-mk="next"]{width:auto;margin-top:8px;padding:0 18px}
.cx-exam h4{margin:18px 0 8px}
.cx-exam .cx-sim-stats{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:640px){.cx-exam .cx-sim-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.cx-exam [data-ex="go"]{display:inline-flex;align-items:center;gap:6px}
.cx-deprescribe [data-dp="find"]{max-width:360px;margin:0 0 8px}
.cx-deprescribe small{color:var(--t2)}
.cx-delirium .cx-nihss>*,.cx-delirium .cx-select{min-width:0;max-width:100%}
.cx-delirium .cx-select{width:100%;text-overflow:ellipsis}
.cx-childrash [data-kr="list"]{display:grid;gap:10px;margin-top:12px}
[data-plw="missing"]{display:flex;align-items:flex-start;gap:6px}
[data-plw="missing"] svg{flex:none;margin-top:3px}
`;

/* Update 42: remix menu, reading list, full-screen QR, scorpion grades. */
export const CADUS_CLINIC42_CSS = `
.cx-a-acts{flex-wrap:wrap}
.cx-remix{flex-basis:100%;display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px 7px}
.cx-rl-list{display:grid;gap:10px;margin-top:12px}
.cx-rl-item{display:grid;gap:6px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-rl-item.read{opacity:.72}
.cx-rl-h{display:flex;align-items:flex-start;gap:8px}
.cx-rl-h a{color:var(--text);font-weight:600;text-decoration:none;overflow-wrap:anywhere}
.cx-rl-h a:hover{text-decoration:underline}
.cx-rl-h a svg{display:inline;margin-left:4px;vertical-align:-1px;color:var(--t3)}
.cx-rl-item small{color:var(--t2);overflow-wrap:anywhere}
.cx-rl-item textarea{min-height:36px;resize:vertical}
.cx-rl-acts{display:flex;align-items:center;justify-content:space-between;gap:8px}
.cx-reading h4{display:flex;align-items:center;gap:6px;margin:18px 0 8px}
.cx-reading .cx-sc-acts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.cx-reading [data-rl="find"]{flex:1 1 220px;min-width:0}
.cx-qr-full{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:rgba(15,23,41,.85);padding:16px}
.cx-qr-full>div{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;border-radius:18px;background:#fff;color:#0F1729;max-width:100%;text-align:center}
.cx-qr-full span{display:block;line-height:0;max-width:min(340px,80vw)}
.cx-qr-full span svg{width:100%;height:auto}
.cx-qr-full small{color:#475569}
.cx-cs-qr .cx-btn{margin-top:4px}
.cx-scorpion [data-scp="grades"]{display:grid;gap:8px;margin:8px 0 12px}
.cx-scorpion .cx-rm-card{cursor:pointer}
.cx-scorpion .cx-rm-card.on{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}
.cx-epds .cx-nihss>*,.cx-epds .cx-select,.cx-tirads .cx-nihss>*,.cx-tirads .cx-select{min-width:0;max-width:100%}
.cx-epds .cx-select,.cx-tirads .cx-select{width:100%;text-overflow:ellipsis}
`;

/* Update 43: version history, study timer, slash menu, recap. */
export const CADUS_CLINIC43_CSS = `
.cx-vh{display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:12px}
.cx-vh-list{display:flex;flex-direction:column;gap:6px}
.cx-vh-i{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-vh-i small{color:var(--t2)}
.cx-vh-i.on{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 7%,var(--surface))}
.cx-vh-main{min-width:0}
.cx-vh-diff{max-height:360px;overflow:auto;margin:8px 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:12.5px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.cx-vh-diff .add{display:block;background:color-mix(in srgb,var(--ok) 14%,transparent)}
.cx-vh-diff .del{display:block;background:color-mix(in srgb,var(--danger) 12%,transparent);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--danger) 50%,transparent)}
.cx-vh-diff .same{display:block;color:var(--t2)}
@media (max-width:640px){.cx-vh{grid-template-columns:minmax(0,1fr)}.cx-vh-list{flex-direction:row;overflow-x:auto}.cx-vh-i{flex:none}}
.cx-pomo .cx-sim-stats{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:640px){.cx-pomo .cx-sim-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
.cx-pomo .cx-sim-stats small{display:inline-flex;align-items:center;gap:4px}
.cx-pomo-clock{position:relative;display:grid;place-items:center;width:220px;height:220px;max-width:70vw;max-height:70vw;margin:18px auto;border-radius:50%;text-align:center}
.cx-pomo-ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(var(--primary) var(--p,0%),var(--line) 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 10px),#000 calc(100% - 9px));mask:radial-gradient(farthest-side,transparent calc(100% - 10px),#000 calc(100% - 9px))}
.cx-pomo-clock.brk .cx-pomo-ring{background:conic-gradient(var(--ok) var(--p,0%),var(--line) 0)}
.cx-pomo-clock b{font-size:44px;font-variant-numeric:tabular-nums;letter-spacing:.02em;align-self:end}
.cx-pomo-clock small{align-self:start;max-width:160px;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-pomo .cx-sc-acts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:8px 0}
.cx-pomo [data-pom="done"] .cx-sc-acts{justify-content:flex-start}
.cx-pomo-list{margin:6px 0 0;padding-left:18px;color:var(--t2)}
.cx-pomo-list b{color:var(--text)}
.cx-at.cx-slash button>span:not(.cx-crew-badge){flex-direction:row;flex-wrap:wrap;align-items:baseline;gap:2px 8px}
.cx-slash button em{color:var(--t3);font-style:normal}
.cx-slash button small{flex-basis:100%;color:var(--t2)}
[data-rc="busy"]{display:flex;align-items:center;gap:6px}
`;

/* Update 44: sectioned Crew toolbox with icon tiles, goals, teach-back, select to explain, quiz sharing. */
export const CADUS_CLINIC44_CSS = `
.cx-crew-box{display:flex;flex-direction:column;gap:18px;margin:18px 0 6px}
.cx-tb-h{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-family:var(--sans,inherit);font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--t2)}
.cx-tb-dot{width:8px;height:8px;border-radius:50%;background:var(--tone)}
.cx-tb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.cx-crew-box .cx-crew-boxi{flex-direction:row;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;text-align:left;transition:border-color .15s,box-shadow .15s,transform .15s}
.cx-crew-box .cx-crew-boxi:hover{border-color:color-mix(in srgb,var(--tone) 55%,var(--line));box-shadow:0 8px 22px -14px color-mix(in srgb,var(--tone) 70%,transparent);transform:translateY(-1px)}
.cx-crew-box .cx-crew-boxi:focus-visible{outline:2px solid var(--tone);outline-offset:2px}
.cx-tb-ic{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:12px;color:var(--tone);background:linear-gradient(150deg,color-mix(in srgb,var(--tone) 10%,var(--surface)),color-mix(in srgb,var(--tone) 22%,var(--surface)));border:1px solid color-mix(in srgb,var(--tone) 28%,transparent);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 45%,transparent)}
.cx-crew-box .cx-crew-boxi .cx-tb-ic svg{color:var(--tone)}
.cx-tb-tx{display:flex;flex-direction:column;gap:2px;min-width:0}
.cx-tb-tx b{font-size:14px;font-weight:600;color:var(--text)}
.cx-tb-tx small{font-size:12px;color:var(--t2);line-height:1.35}
@media (max-width:640px){.cx-tb-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.cx-crew-box .cx-crew-boxi{flex-direction:column;align-items:flex-start;gap:8px;padding:12px}.cx-tb-ic{width:38px;height:38px;border-radius:11px}}
.cx-crew-goals{display:flex;align-items:center;gap:10px;width:100%;margin:12px 0 0;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-crew-goals>svg{flex:none;color:var(--primary)}
.cx-crew-goals>span:nth-child(2){display:flex;flex-direction:column;flex:1;min-width:0}
.cx-crew-goals small{color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-goal-bar{display:block;height:8px;border-radius:99px;background:var(--line);overflow:hidden}
.cx-goal-bar>span{display:block;height:100%;border-radius:inherit;background:var(--primary);transition:width .3s}
.cx-goal-bar.sm{flex:none;width:90px;height:6px}
.cx-goal-list{display:grid;gap:12px;margin:12px 0}
.cx-goal{display:grid;gap:6px}
.cx-goal-h{display:flex;justify-content:space-between;gap:8px;font-size:14px}
.cx-goal-h span{color:var(--t2);font-variant-numeric:tabular-nums}
.cx-goal.done .cx-goal-bar>span{background:var(--ok)}
.cx-goals h4,.cx-teach h4{display:flex;align-items:center;gap:6px;margin:18px 0 8px}
.cx-goals .cx-sc-acts,.cx-teach .cx-sc-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}
.cx-teach-head{display:flex;align-items:center;gap:14px}
.cx-teach-head>div{display:flex;align-items:center;gap:8px;min-width:0}
.cx-teach-head p{margin:0}
.cx-teach-score{flex:none;display:grid;place-items:center;width:64px;height:64px;border-radius:50%;font-size:24px;font-weight:700;border:3px solid var(--warn);color:var(--text)}
.cx-teach-score small{font-size:11px;font-weight:500;color:var(--t2);margin-top:-6px}
.cx-teach-score.good{border-color:var(--ok)}.cx-teach-score.low{border-color:var(--danger)}
.cx-teach-err li::marker{color:var(--danger)}
.cx-xp-btn{position:fixed;z-index:120;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:0;border-radius:8px;background:var(--text);color:var(--bg,#fff);font:inherit;font-size:12.5px;font-weight:600;box-shadow:0 8px 20px -8px rgba(0,0,0,.4);cursor:pointer}
.cx-xp-pop{position:fixed;z-index:120;width:min(320px,calc(100vw - 24px));max-height:260px;overflow:auto;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:0 18px 40px -16px rgba(0,0,0,.35)}
.cx-xp-h{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.cx-xp-h b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-xp-h>svg{color:var(--primary);flex:none}
.cx-xp-b{font-size:13.5px}
.cx-xp-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
[data-xp="busy"]{display:flex;align-items:center;gap:6px}
.cx-qb-share{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.cx-qb-share input{flex:1 1 240px;min-width:0}
.cx-qb-vs{margin:8px 0;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--primary) 8%,var(--surface))}
.cx-lazy{padding:40px 0;text-align:center}
`;

export const CADUS_CLINIC45_CSS = `
.cx-suggest{max-width:calc(100% - 24px);padding:4px 6px 4px 10px;font-size:12.5px;color:var(--t2)}
.cx-suggest>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-suggest .cx-btn.sm{flex:none}
.cx-suggest>svg{color:var(--tone,var(--primary));flex:none}
.cx-suggest .cx-btn.sm{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);font-size:12px;font-weight:600}
.cx-dgm-box{margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:auto;max-height:60vh}
.cx-dgm-box svg{display:block;margin:0 auto;width:auto!important;max-width:100%!important;max-height:54vh;height:auto}
.cx-lp-list{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.cx-lp{border:1px solid var(--line);border-radius:14px;background:var(--surface);overflow:hidden}
.cx-lp-h{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;border:0;background:none;font:inherit;color:var(--text);text-align:left;cursor:pointer}
.cx-lp-t{display:flex;flex-direction:column;flex:1;min-width:0}
.cx-lp-h small{font-size:12px;color:var(--t2)}
.cx-lp-h .cx-goal-bar{flex:none;width:90px}
.cx-lp-b{padding:0 14px 14px;display:flex;flex-direction:column;gap:8px}
.cx-lp-day{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:10px 12px;border:1px solid var(--line);border-radius:12px}
.cx-lp-day.today{border-color:color-mix(in srgb,var(--primary) 45%,var(--line));background:color-mix(in srgb,var(--primary) 4%,var(--surface))}
.cx-lp-dh{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:2px}
.cx-lp-dh em{font-style:normal;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--primary);color:var(--bg,#fff)}
.cx-lp-dh .cx-btn.sm{margin-left:auto}
.cx-pa-mine.done{text-decoration:line-through;color:var(--t3)}
.cx-kit{display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:3px;vertical-align:-1px;border:1px solid rgba(0,0,0,.15)}
.cx-kit.k1{background:#9ca3af}.cx-kit.k2{background:#16a34a}.cx-kit.k3{background:#fff;border-color:#9ca3af}.cx-kit.k4{background:#2563eb}.cx-kit.k5{background:#dc2626}.cx-kit.k6{background:#facc15}.cx-kit.k7{background:#111}
`;

export const CADUS_CLINIC46_CSS = `
.cx-rdr-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.cx-rdr{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-rdr.weak{border-color:color-mix(in srgb,var(--danger) 35%,var(--line))}
.cx-rdr-h{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
.cx-rdr-h b{min-width:0;overflow-wrap:anywhere}
.cx-rdr .cx-rdr-h .cx-chip{font-size:11px;padding:1px 8px;min-height:0;height:auto;line-height:1.6}
.cx-radar .cx-sim-stats{margin-bottom:14px}
.cx-rdr-score{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}
.cx-rdr-score.low{color:var(--danger)}.cx-rdr-score.mid{color:var(--warn)}.cx-rdr-score.high{color:var(--ok)}
.cx-rdr-bar{grid-column:1;display:block;height:7px;border-radius:99px;background:var(--line);overflow:hidden}
.cx-rdr-bar>span{display:block;height:100%;border-radius:inherit}
.cx-rdr-bar.low>span{background:var(--danger)}.cx-rdr-bar.mid>span{background:var(--warn)}.cx-rdr-bar.high>span{background:var(--ok)}
.cx-rdr>small{grid-column:1;font-size:12px;color:var(--t2)}
.cx-rdr>.cx-btn{grid-column:2;grid-row:1/span 3;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;max-width:240px}
.cx-rdr>.cx-btn>span{min-width:0;overflow:hidden;text-overflow:ellipsis}
.cx-rdr-plan{margin-top:10px}
@media (max-width:560px){.cx-rdr{grid-template-columns:1fr}.cx-rdr>.cx-btn{grid-column:1;grid-row:auto;justify-self:start;max-width:100%}}
.cx-case{margin-top:12px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-case h4{margin:0 0 6px}
.cx-case-v{margin:0 0 10px;line-height:1.6}
.cx-case-qs{margin:0 0 8px;padding-left:20px;display:flex;flex-direction:column;gap:8px}
.cx-case-qs li>b{display:block;margin-bottom:4px}
.cx-case-a{margin:0;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--ok) 8%,var(--surface))}
.cx-cht-notes{display:flex;flex-direction:column;gap:8px;margin:6px 0 10px}
.cx-cht-pick{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto;padding:8px 10px;border:1px solid var(--line);border-radius:12px}
.cx-cht-pick .cx-pa-mine.on{color:var(--text);font-weight:600}
.cx-cht-page{padding:16px 18px;border:1px solid var(--line);border-radius:12px;background:var(--bg,#fff)}
`;

export const CADUS_CLINIC47_CSS = `
.cx-spot-card{margin-top:14px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.cx-spot-card .cx-crew-dh{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.cx-spot-card .cx-crew-dh small{color:var(--t2);font-size:12px}
.cx-spot-text{margin:0 0 10px;line-height:1.75}
.cx-spot-s{display:inline;margin:0 3px 0 0;padding:1px 3px;border:0;border-radius:5px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.cx-spot-s:hover:not(:disabled){background:color-mix(in srgb,var(--primary) 8%,transparent)}
.cx-spot-s.on{background:color-mix(in srgb,var(--warn) 22%,transparent);text-decoration:underline wavy color-mix(in srgb,var(--warn) 70%,transparent)}
.cx-spot-s.found{background:color-mix(in srgb,var(--ok) 20%,transparent)}
.cx-spot-s.missed{background:color-mix(in srgb,var(--warn) 25%,transparent);outline:1px dashed var(--warn)}
.cx-spot-s.false{background:color-mix(in srgb,var(--danger) 16%,transparent);text-decoration:line-through}
.cx-spot-s:disabled{cursor:default;opacity:1;color:inherit}
.cx-gs [data-gs="tests"] .cx-set-hint{display:inline-flex;align-items:center;gap:4px;margin:0}
.cx-gloss .cx-sc-acts{margin-top:8px}
.cx-gs{margin-top:12px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surface);display:flex;flex-direction:column;gap:10px}
.cx-gs-open{line-height:1.55}
.cx-gs-meta{display:flex;flex-wrap:wrap;gap:6px}
.cx-gs-meta span{font-size:12px;padding:2px 9px;border-radius:999px;background:color-mix(in srgb,var(--primary) 8%,var(--surface));color:var(--t2)}
.cx-gs-log{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto}
.cx-gs-log li{display:flex;flex-direction:column;gap:1px}
.cx-gs-log li span{color:var(--t2);font-size:13px}
.cx-gs-log li.k-test b{color:var(--primary)}
.cx-gs-log li.ok span{color:var(--ok);font-weight:600}.cx-gs-log li.no span{color:var(--danger);font-weight:600}
.cx-gs-row{display:flex;gap:8px;flex-wrap:wrap}
.cx-gs-row .cx-input{flex:1 1 220px;min-width:0}
.cx-gs-profile{white-space:pre-wrap;font-size:13px;color:var(--t2)}
.cx-gls-card{margin:10px 0;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--surface);display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.cx-gls-card small{color:var(--t3);font-size:12px}
.cx-gls-card>b{font-size:20px}
.cx-gls-card p{margin:0;line-height:1.55}
.cx-gls-list{margin:10px 0 0;display:flex;flex-direction:column;gap:6px}
.cx-gls-item{padding:8px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-gls-letter{display:block;margin:-2px 0 4px;font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--primary)}
.cx-gls-item dt{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:600}
.cx-gls-item dd{margin:2px 0 0;font-size:13.5px;color:var(--t2);line-height:1.5}
`;

export const CADUS_CLINIC48_CSS = `
.cx-vs-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
.cx-vs-table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:520px}
.cx-vs-table th,.cx-vs-table td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;line-height:1.45}
.cx-vs-table thead th{background:color-mix(in srgb,var(--primary) 7%,var(--surface));font-weight:700}
.cx-vs-table tbody th{width:22%;font-weight:600;color:var(--t2)}
.cx-vs-table tbody tr:last-child th,.cx-vs-table tbody tr:last-child td{border-bottom:0}
.cx-ddx-case{line-height:1.6}
.cx-ddx-list{list-style:none;margin:6px 0;padding:0;display:flex;flex-direction:column;gap:6px}
.cx-ddx-list li{display:flex;gap:8px;align-items:flex-start}
.cx-ddx-list li>svg{flex:none;margin-top:3px}
.cx-ddx-list li.hit>svg{color:var(--ok)}.cx-ddx-list li.miss>svg{color:var(--danger)}
.cx-ddx-list li em{font-style:normal;font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;background:var(--line);color:var(--t2)}
.cx-ddx-list li.k-must em{background:color-mix(in srgb,var(--danger) 14%,var(--surface));color:var(--danger)}
.cx-ddx-list li.k-likely em{background:color-mix(in srgb,var(--ok) 14%,var(--surface));color:var(--ok)}
.cx-ddx-fb{margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--surface);border:1px solid var(--line)}
.cx-lec-out{margin-top:16px;display:flex;flex-direction:column;gap:10px}
.cx-lec-out h2{margin:0}
.cx-lec-cards summary{cursor:pointer;font-weight:600}
.cx-lec-cards ol{margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.cx-lecture label.cx-btn{cursor:pointer}
.cx-ib-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 0 6px}
.cx-ib-h h4{margin:0}
.cx-ib-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.cx-ib-item{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.cx-ib-q{flex:1 1 260px;min-width:0;overflow-wrap:anywhere}
.cx-ib-acts{display:flex;align-items:center;gap:6px;flex:none;max-width:100%}
.cx-ib-acts .cx-select{width:auto;max-width:190px;padding-top:4px;padding-bottom:4px;font-size:12.5px}
.cx-inbox code{padding:1px 5px;border-radius:5px;background:var(--line)}
.cx-ddx .cx-sim-stats,.cx-spot .cx-sim-stats,.cx-guess .cx-sim-stats{margin-bottom:14px}
.cx-vs .cx-crew-chips .cx-set-hint{align-self:center}
`;

export const CADUS_CLINIC49_CSS = `
.cx-guest-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 10px;margin:-2px 0 8px;padding:6px 10px;border-radius:10px;background:color-mix(in srgb,var(--primary) 7%,var(--surface));font-size:12.5px;color:var(--t2)}
.cx-guest-bar b{color:var(--text)}
.cx-guest-bar a{font-weight:600;color:var(--primary);text-decoration:none;white-space:nowrap}
.cx-guest-acts{display:flex;align-items:center;gap:6px;flex:none}
.cx-guest-acts .cx-btn{display:inline-flex;align-items:center;gap:5px;text-decoration:none;white-space:nowrap}
@media (max-width:560px){.cx-guest-acts .cx-btn:first-child{display:none}}
.cx-login-need .cx-sc-acts a{text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.cx-smart-card,.cx-rf-card{margin-top:12px;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--surface);display:flex;flex-direction:column;gap:12px}
.cx-smart-top,.cx-rf-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cx-smart-top small,.cx-rf-top small{color:var(--t3)}
.cx-smart-card .cx-goal-bar.sm{width:100%}
.cx-smart-tag{font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--line);color:var(--t2)}
.cx-smart-tag.k-card{background:color-mix(in srgb,var(--primary) 12%,var(--surface));color:var(--primary)}
.cx-smart-tag.k-mistake{background:color-mix(in srgb,var(--danger) 12%,var(--surface));color:var(--danger)}
.cx-smart-tag.k-term{background:color-mix(in srgb,var(--ok) 12%,var(--surface));color:var(--ok)}
.cx-smart-q{font-size:17px;line-height:1.45}
.cx-smart-a{margin:0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--ok) 8%,var(--surface));line-height:1.5}
.cx-smart-opts{display:flex;flex-direction:column;gap:6px}
.cx-smart-opts .cx-btn{justify-content:flex-start;text-align:left;white-space:normal}
.cx-btn.ok{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 12%,var(--surface))}
.cx-btn.no{border-color:var(--danger);background:color-mix(in srgb,var(--danger) 10%,var(--surface))}
.cx-rf-time{display:inline-flex;align-items:center;gap:5px;font-weight:700;font-variant-numeric:tabular-nums}
.cx-rf-time.low{color:var(--danger)}
.cx-rf-s{margin:0;font-size:19px;line-height:1.45;font-weight:600;min-height:3em}
.cx-rf-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cx-rf-btns .cx-btn{justify-content:center;padding:14px;font-size:16px}
.cx-rf-wrong{margin:8px 0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.cx-rf-bests{margin-top:12px}
.cx-rf-bests summary{cursor:pointer;font-weight:600}
.cx-lv-out{margin-top:14px;display:flex;flex-direction:column;gap:10px}
.cx-lv-out h2{margin:0}
.cx-syl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:12px 0}
.cx-syl-sub{display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer}
.cx-syl-sub.on{border-color:var(--primary);box-shadow:0 0 0 1px var(--primary) inset}
.cx-syl-sub b{font-size:13px}
.cx-syl-sub small{font-size:11.5px;color:var(--t3)}
.cx-syl-sub .cx-goal-bar.sm{width:100%}
.cx-syl-list{list-style:none;margin:6px 0 12px;padding:0;display:flex;flex-direction:column;gap:4px}
.cx-syl-list li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.cx-syl-list li .cx-pa-mine{flex:1;min-width:0}
.cx-smart .cx-sim-stats,.cx-syl .cx-sim-stats{margin-bottom:14px}
`;
