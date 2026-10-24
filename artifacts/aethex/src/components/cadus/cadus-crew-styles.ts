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
