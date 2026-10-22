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
