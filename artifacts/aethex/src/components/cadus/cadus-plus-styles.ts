/**
 * Styles for Cadus modes (the picker beside the message box), Deep Dive
 * (its live research steps and summary), smart follow-ups and Cadus Crew
 * (the gallery, the editor, a crew member's home page and chat bar).
 * Loaded after the other Cadus styles.
 */
export const CADUS_PLUS_CSS = `
@keyframes cxPlusIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes cxPlusGlow{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--acc) 0%,transparent)}50%{box-shadow:0 0 0 4px color-mix(in srgb,var(--acc) 14%,transparent)}}

/* ---- the mode picker */
.cx-amode-btn{border:1px solid var(--line2);padding:0 10px 0 9px}
.cx-amode-btn:hover{background:var(--hover);color:var(--text)}
.cx-amode-btn.on{background:var(--acc-soft);border-color:color-mix(in srgb,var(--acc) 35%,transparent);color:var(--acc)}
.cx-amode-btn.deep{background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 16%,transparent),color-mix(in srgb,#7C5CFF 14%,transparent));animation:cxPlusGlow 2.6s ease-in-out infinite}
.cx-amode-btn .cx-amode-chev{opacity:.6;margin-left:-3px;transition:transform .15s}
.cx-amode-btn.open .cx-amode-chev{transform:rotate(180deg)}
.cx-amode-menu{left:8px;width:min(330px,calc(100vw - 40px));overflow-y:auto;overscroll-behavior:contain;padding:8px}
.cx-amode-menu.up{bottom:calc(100% + 8px)}
.cx-amode-menu.down{top:calc(100% + 8px)}
.cx-amode-i{display:flex;align-items:center;gap:11px;width:100%;padding:8px 9px;border-radius:11px;text-align:left;color:var(--text);transition:background .12s}
.cx-amode-i:hover{background:var(--hover)}
.cx-amode-i .ic{display:grid;place-items:center;flex-shrink:0;width:32px;height:32px;border-radius:9px;background:var(--s2);color:var(--t2);transition:background .15s,color .15s}
.cx-amode-i.on .ic{background:var(--acc);color:var(--on-acc,#fff)}
.cx-amode-i.deep .ic{background:linear-gradient(135deg,var(--acc),#7C5CFF);color:#fff}
.cx-amode-i .tx{display:grid;gap:1px;min-width:0;flex:1}
.cx-amode-i .tx b{display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600}
.cx-amode-i .tx b em{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:1px 6px;border-radius:999px;background:color-mix(in srgb,#7C5CFF 16%,transparent);color:#6B4EE6}
.cx-amode-i .tx small{font-size:12px;color:var(--t3);line-height:1.35}
.cx-amode-i .ck{flex-shrink:0;color:var(--acc)}
.cx-amode-row{display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:6px 8px}
.cx-amode-row>span{width:52px;font-size:12px;font-weight:600;color:var(--t3)}
.cx-amode-row button{height:28px;padding:0 10px;border-radius:999px;border:1px solid var(--line2);font-size:12.5px;color:var(--t2);transition:all .12s}
.cx-amode-row button:hover{color:var(--text);border-color:var(--t3)}
.cx-amode-row button.on{background:var(--text);border-color:var(--text);color:var(--surface)}
@media (max-width:560px){ .cx-amode-btn>span{display:none} .cx-amode-btn{padding:0 7px} }

/* ---- Deep Dive */
.cx-deep-step{align-items:flex-start}
.cx-deep-step>span{display:grid;gap:1px;min-width:0}
.cx-deep-step .l{overflow-wrap:anywhere}
.cx-deep-step small{font-size:12px;color:var(--t3);overflow-wrap:anywhere}
.cx-deep-step.skip{color:var(--t3)}
.cx-step.cx-deep-step{animation:cxPlusIn .3s ease-out backwards}
.cx-deep-note{display:flex;align-items:center;gap:8px;margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--s2);font-size:13px;color:var(--t2)}
.cx-deep-note svg{flex-shrink:0;color:var(--acc)}
.cx-a-kind.deep{display:inline-flex;align-items:center;gap:5px;color:#6B4EE6}
.cx-dark .cx-a-kind.deep{color:#A08BFF}
.cx-deepsum{margin:2px 0 14px;border:1px solid var(--line);border-radius:12px;background:var(--s2);overflow:hidden}
.cx-deepsum summary{display:flex;align-items:center;gap:8px;padding:9px 12px;font-size:13px;font-weight:500;color:var(--t2);cursor:pointer;list-style:none}
.cx-deepsum summary::-webkit-details-marker{display:none}
.cx-deepsum summary>svg:first-child{color:var(--acc)}
.cx-deepsum summary .chev{margin-left:auto;transition:transform .15s}
.cx-deepsum[open] summary .chev{transform:rotate(180deg)}
.cx-deepsum ol{list-style:none;margin:0;padding:4px 12px 10px;display:grid;gap:6px;border-top:1px solid var(--line)}
.cx-deepsum li{display:flex;align-items:flex-start;gap:8px;padding-top:6px;font-size:12.5px;color:var(--t2)}
.cx-deepsum li>svg{flex-shrink:0;margin-top:2px;color:var(--ok)}
.cx-deepsum li.skip>svg{color:var(--warn)}
.cx-deepsum li span{display:grid;gap:1px;min-width:0;overflow-wrap:anywhere}
.cx-deepsum li small{color:var(--t3)}
.cx-u-priv.tag.deep{background:color-mix(in srgb,#7C5CFF 12%,transparent);color:#6B4EE6}

/* ---- smart follow-ups */
.cx-follow.smart>p{display:flex;align-items:center;gap:6px}
.cx-follow.smart>p svg{color:var(--acc)}
.cx-follow.smart button{animation:cxPlusIn .35s ease-out backwards;animation-delay:calc(var(--i,0) * 60ms)}

/* ---- Cadus Crew: badges */
.cx-crew-badge{display:inline-grid;place-items:center;flex-shrink:0;border-radius:30%;color:#fff;background:linear-gradient(145deg,color-mix(in srgb,var(--tone) 82%,#fff),var(--tone));box-shadow:0 6px 16px -8px var(--tone)}
.tone-teal{--tone:#14A38B}.tone-violet{--tone:#7C5CFF}.tone-rose{--tone:#E0527A}.tone-amber{--tone:#D98B1F}
.tone-sky{--tone:#2E8CE6}.tone-lime{--tone:#5BA83B}.tone-navy{--tone:#2B4C8C}.tone-slate{--tone:#5B6576}

/* ---- the gallery */
.cx-crew-page .cx-crew-eyebrow{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.cx-crew-page .cx-crew-h h1{letter-spacing:-.02em}
.cx-crew-sh{display:flex;align-items:center;gap:8px;margin:26px 0 12px;font-size:15px;font-weight:650;color:var(--text)}
.cx-crew-sh span{font-size:12px;font-weight:600;color:var(--t3)}
.cx-crew-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.cx-crew-card{position:relative;display:flex;flex-direction:column;min-width:0;border:1px solid var(--line);border-radius:16px;background:var(--surface);transition:border-color .15s,box-shadow .2s,transform .2s;animation:cxPlusIn .4s ease-out backwards;animation-delay:calc(var(--i,0) * 35ms)}
.cx-crew-card:hover{border-color:color-mix(in srgb,var(--tone) 45%,var(--line));box-shadow:0 14px 30px -24px var(--tone);transform:translateY(-1px)}
.cx-crew-main{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;align-items:start;padding:16px 16px 10px;text-align:left;color:var(--text)}
.cx-crew-main .t{display:grid;gap:3px;min-width:0}
.cx-crew-main .t b{font-size:14.5px;font-weight:650}
.cx-crew-main .t small{font-size:12.5px;line-height:1.45;color:var(--t2)}
.cx-crew-main .tags{grid-column:2;display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.cx-crew-main .tags em{display:inline-flex;align-items:center;gap:4px;font-style:normal;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--s2);color:var(--t2)}
.cx-crew-main .tags em.by{background:transparent;border:1px solid var(--line2);color:var(--t3)}
.cx-crew-main .tags em.by.mine{border-color:color-mix(in srgb,var(--tone) 40%,transparent);color:var(--tone)}
.cx-crew-acts{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding:10px 12px 12px;border-top:1px solid var(--line)}
.cx-btn.sm{height:30px;padding:0 12px;font-size:12.5px}
.cx-crew-menu{right:0;bottom:calc(100% + 6px);min-width:210px}
.cx-crew-new{display:flex;align-items:center;gap:14px;width:100%;padding:16px;border:1.5px dashed var(--line2);border-radius:16px;text-align:left;color:var(--text);transition:border-color .15s,background .15s}
.cx-crew-new:hover{border-color:var(--acc);background:var(--acc-soft)}
.cx-crew-new .ic{display:grid;place-items:center;flex-shrink:0;width:44px;height:44px;border-radius:14px;background:var(--acc-soft);color:var(--acc)}
.cx-crew-new b{display:block;font-size:14px}
.cx-crew-new small{display:block;margin-top:2px;font-size:12.5px;color:var(--t2)}

/* ---- a crew member's page and chat bar */
.cx-crew-home{display:flex;justify-content:center}
.cx-crew-hero{display:flex;flex-direction:column;align-items:center;gap:8px;width:min(720px,100%);margin:clamp(24px,8vh,80px) auto 24px;text-align:center;animation:cxPlusIn .45s ease-out backwards}
.cx-crew-hero h1{margin:8px 0 0;font-size:clamp(24px,3.2vw,32px);letter-spacing:-.02em;color:var(--text)}
.cx-crew-hero>p{margin:0;max-width:520px;font-size:15px;line-height:1.5;color:var(--t2)}
.cx-crew-by{font-size:12px;color:var(--t3)}
.cx-crew-hero .cx-hero-c{width:100%;margin-top:14px;text-align:left}
.cx-crew-starters{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;width:100%;margin-top:14px}
.cx-crew-starters button{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);font-size:13.5px;color:var(--text);text-align:left;transition:border-color .15s,background .15s,transform .15s;animation:cxPlusIn .35s ease-out backwards;animation-delay:calc(120ms + var(--i,0) * 50ms)}
.cx-crew-starters button:hover{border-color:var(--acc);background:var(--acc-soft);transform:translateY(-1px)}
.cx-crew-starters button svg{flex-shrink:0;color:var(--t3)}
.cx-crew-home-f{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;margin-top:14px}
.cx-crew-home-f .cx-link{display:inline-flex;align-items:center;gap:5px;font-size:12.5px}
.cx-crewbar{display:flex;align-items:center;gap:10px;margin:0 0 14px;padding:8px 10px 8px 8px;border:1px solid color-mix(in srgb,var(--tone) 30%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--tone) 6%,var(--surface));font-size:13px;color:var(--t2)}
.cx-crewbar>span{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-crewbar b{color:var(--text)}
.cx-crewbar button{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;height:28px;padding:0 10px;border-radius:8px;font-size:12.5px;color:var(--t2)}
.cx-crewbar button:hover{background:var(--hover);color:var(--text)}

/* ---- the editor */
.cx-crew-dialog{width:min(640px,calc(100vw - 24px))}
.cx-crew-dh{display:flex;align-items:center;gap:12px;min-width:0}
.cx-crew-f2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cx-crew-dialog .opt{font-weight:400;color:var(--t3)}
.cx-crew-instr{min-height:130px}
.cx-crew-starters-ed{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cx-crew-toggle{display:flex;align-items:center;gap:8px;min-height:40px;font-size:13px;font-weight:400;color:var(--t2)}
.cx-crew-toggle input{width:16px;height:16px;accent-color:var(--acc)}
.cx-crew-look{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px}
.cx-crew-look .icons,.cx-crew-look .tones{display:flex;flex-wrap:wrap;gap:6px}
.cx-crew-look .icons button{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;border:1px solid var(--line2);color:var(--t2);transition:all .12s}
.cx-crew-look .icons button.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc)}
.cx-crew-look .tones button{width:24px;height:24px;border-radius:50%;background:var(--tone);border:2px solid var(--surface);box-shadow:0 0 0 1px var(--line2);transition:transform .12s}
.cx-crew-look .tones button.on{box-shadow:0 0 0 2px var(--tone);transform:scale(1.1)}
@media (max-width:600px){ .cx-crew-f2,.cx-crew-starters-ed{grid-template-columns:1fr} .cx-crew-grid{grid-template-columns:1fr} }
@media (prefers-reduced-motion:reduce){ .cx-amode-btn.deep,.cx-crew-card,.cx-crew-hero,.cx-crew-starters button,.cx-follow.smart button,.cx-step.cx-deep-step{animation:none} }
`;
