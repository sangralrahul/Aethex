/**
 * Styles for the chat features Cadus shares with ChatGPT and Claude: streaming
 * answers, attachments and drag and drop, answer versions and feedback,
 * temporary and archived chats, memory, Canvas documents and voice mode.
 * Scoped under `.cx` and loaded after cadus-styles and cadus-tools-styles.
 */
export const CADUS_CHAT_CSS = `
/* ================================================================ composer: attachments, think, voice */
.cx-att-row{flex-wrap:wrap;gap:8px;padding:12px 12px 0}
.cx-att{position:relative;min-width:0;max-width:260px;padding:6px;background:var(--surface);animation:cxPop .14s ease-out}
.cx-att>div{min-width:0}
.cx-att b{max-width:168px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-att img{width:42px;height:42px}
.cx-att-ic{width:42px;height:42px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:9px;background:color-mix(in srgb,var(--acc) 12%,var(--surface));color:var(--acc)}
.cx-att-ic.pdf{background:color-mix(in srgb,#E5484D 12%,var(--surface));color:#D93036}
.cx-dark .cx-att-ic.pdf{color:#FF7A7E}
.cx-att-ic em{font:700 8px/1 var(--sans);font-style:normal;letter-spacing:.05em}
.cx-cbtn.cx-think-btn.on{background:var(--acc-soft);color:var(--acc)}
.cx-cbtn.cx-think-btn.on:hover{background:color-mix(in srgb,var(--acc) 18%,transparent)}

/* ================================================================ drag and drop */
.cx-drop{position:fixed;inset:0;z-index:115;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(3px);pointer-events:none;animation:cxFade .12s ease-out}
.cx-drop-card{display:flex;flex-direction:column;align-items:center;gap:8px;width:min(440px,100%);padding:34px 28px;border:2px dashed var(--acc-line);border-radius:20px;background:var(--surface);box-shadow:var(--sh3);text-align:center}
.cx-drop-ic{width:52px;height:52px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:var(--acc-soft);color:var(--acc)}
.cx-drop-card b{font-size:16px;font-weight:650;letter-spacing:-.01em}
.cx-drop-card small{max-width:320px;font-size:13px;line-height:1.5;color:var(--t3)}

/* ================================================================ thread: your files */
.cx-u-files{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:flex-end;gap:8px;max-width:80%}
.cx-u-img{cursor:zoom-in}
.cx-u-files.multi .cx-u-img{width:128px;height:128px;object-fit:cover;border-radius:14px}
.cx-u-file{display:flex;align-items:center;gap:10px;min-width:0;max-width:300px;padding:7px 14px 7px 7px;border:1px solid var(--line2);border-radius:14px;background:var(--surface)}
.cx-u-file .t{min-width:0}
.cx-u-file b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-u-file small{display:block;font-size:11.5px;color:var(--t3)}
.cx-u-file.gone{opacity:.6}
.cx-u-priv.tag{border-color:var(--line2);background:var(--surface);color:var(--t2)}
.cx-u-priv.tag svg{color:var(--acc)}

/* ================================================================ streaming answer */
.cx-live-a{display:flex;flex-direction:column;gap:12px;animation:cxIn .24s ease-out}
.cx-live-st{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--t2)}
.cx-live-st em{font-style:normal;font-weight:500;color:var(--t3);font-variant-numeric:tabular-nums}
.cx-live-a .cx-think{max-width:none}
/* Once text arrives the progress steps give way to it, so the finished answer lands in the same place. */
.cx-live-a .cx-think:has(.cx-live) .cx-steps{display:none}
/* Answers settle in from the dimmed draft rather than popping in. */
.cx-a{animation:cxSettle .35s ease-out}
@keyframes cxSettle{from{opacity:.62}to{opacity:1}}
.cx-sk-wrap{display:flex;flex-direction:column;gap:11px;max-width:580px}
.cx-live{animation:cxFade .2s ease-out}
.cx-live.is-draft{opacity:.62;transition:opacity .25s}
.cx-caret{display:inline-block;width:10px;height:10px;margin-left:6px;border-radius:50%;background:var(--text);vertical-align:0;animation:cxPulse 1s ease-in-out infinite}
@keyframes cxPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.72);opacity:.45}}
.cx .cx-live-note{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--acc-line);border-radius:10px;background:var(--acc-soft);font-size:12.5px;line-height:1.45;color:var(--t2)}
.cx-live-note svg{flex-shrink:0;color:var(--acc)}
.cx-md.is-stopped{opacity:.92}

/* ================================================================ copy buttons on tables and code */
.cx-md .md-tablewrap{position:relative;margin:8px 0 18px}
.cx-md .md-tablewrap>.md-table{margin:0}
.cx-md .md-code{position:relative}
.cx-md .md-copy{position:absolute;top:7px;right:7px;z-index:2;height:24px;padding:0 9px;border:1px solid var(--line2);border-radius:7px;background:var(--surface);box-shadow:var(--sh1);color:var(--t2);font:600 11.5px/22px var(--sans);opacity:0;transition:opacity .12s,background .12s,color .12s}
.cx-md .md-copy:hover{background:var(--s2);color:var(--text)}
.cx-md .md-tablewrap:hover .md-copy,.cx-md .md-code:hover .md-copy,.cx-md .md-copy:focus-visible{opacity:1}
@media (hover:none){.cx-md .md-copy{opacity:1}}

/* ================================================================ answer actions: versions, feedback, more */
.cx-ver{display:inline-flex;align-items:center;margin-right:2px;font-size:12px;font-weight:600;color:var(--t2);font-variant-numeric:tabular-nums}
.cx-ver button{width:24px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;color:var(--t3)}
.cx-ver button:hover:not(:disabled){background:var(--hover);color:var(--text)}
.cx-ver>span{min-width:36px;text-align:center}
.cx-act.open{background:var(--hover);color:var(--text)}
.cx-a-acts .cx-rel{display:inline-flex}
.cx-msg-menu{left:-4px;bottom:calc(100% + 6px);width:236px}
.cx-fb{display:flex;flex-direction:column;gap:12px;max-width:600px;padding:14px 16px;border:1px solid var(--line2);border-radius:14px;background:var(--surface);box-shadow:var(--sh1);animation:cxIn .18s ease-out}
.cx-fb-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:-4px -8px -4px 0}
.cx-fb-h b{font-size:14px;font-weight:650}
.cx-fb-chips{display:flex;flex-wrap:wrap;gap:6px}
.cx-fb-chips button{height:30px;padding:0 12px;border:1px solid var(--line2);border-radius:999px;font-size:12.5px;font-weight:550;color:var(--t2);transition:border-color .12s,background .12s,color .12s}
.cx-fb-chips button:hover{border-color:color-mix(in srgb,var(--text) 24%,var(--line2));color:var(--text)}
.cx-fb-chips button.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc)}
.cx .cx-fb textarea{width:100%;min-height:64px;padding:10px 12px;border:1px solid var(--line2);border-radius:10px;background:var(--bg);font-size:13.5px;line-height:1.5;resize:vertical}
.cx .cx-fb textarea:focus{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-fb-f{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.cx-fb-f span{flex:1;min-width:160px;font-size:12px;color:var(--t3)}

/* ================================================================ canvas card under answers */
.cx-cvcard{display:flex;align-items:center;gap:12px;width:100%;max-width:520px;padding:11px 14px 11px 11px;border:1px solid var(--line2);border-radius:14px;background:var(--surface);box-shadow:var(--sh1);text-align:left;transition:border-color .14s,box-shadow .14s}
.cx-cvcard:hover{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-cvcard .ic{width:40px;height:40px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--acc-soft);color:var(--acc)}
.cx-cvcard .t{flex:1;min-width:0}
.cx-cvcard b{display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-cvcard small{display:block;margin-top:1px;font-size:12px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-cvcard .go{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;font-size:12.5px;font-weight:600;color:var(--acc);white-space:nowrap}
.cx-cvcard.offer{border-style:dashed;box-shadow:none}

/* ================================================================ top bar and dock: temporary chat, export */
.cx-temp-tg.on{background:var(--primary);color:var(--primary-ink)}
.cx-temp-tg.on:hover{background:var(--primary);color:var(--primary-ink);opacity:.9}
.cx-temp-pill{align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:999px;background:var(--s3);color:var(--t2);font-size:12px;font-weight:600;white-space:nowrap}
.cx-export-menu{top:calc(100% + 6px);right:0;width:250px}
.cx-ghost.open{background:var(--hover)}
.cx-ghost svg:last-child{color:var(--t3)}
.cx-temp-bar{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px 12px;border:1px dashed var(--line2);border-radius:12px;background:var(--s2);font-size:12.5px;line-height:1.4;color:var(--t2)}
.cx-temp-bar svg{flex-shrink:0;color:var(--t3)}
.cx-temp-bar b{font-weight:650;color:var(--text)}
.cx-temp-home{width:100%;max-width:780px;margin:0 auto;padding:12vh 28px 40px;display:flex;flex-direction:column;align-items:center;text-align:center}
.cx-temp-ic{width:52px;height:52px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--line2);border-radius:16px;background:var(--s2);color:var(--t2)}
.cx .cx-home .cx-temp-home h1{font-family:var(--sans);font-size:26px;font-weight:650;line-height:1.2;letter-spacing:-.022em}
.cx .cx-temp-home p{max-width:560px;margin-top:10px;font-size:14.5px;line-height:1.6;color:var(--t2)}
.cx-temp-home .cx-hero-c{width:100%;margin-top:26px;text-align:left}
.cx-temp-home .cx-btn{margin-top:18px}

/* ================================================================ sidebar: archived chats */
.cx-arch-link{display:flex;align-items:center;gap:9px;width:100%;height:34px;margin-top:6px;padding:0 10px 0 12px;border-radius:9px;font-size:12.5px;font-weight:550;color:var(--t3);transition:background .12s,color .12s}
.cx-arch-link:hover{background:var(--hover);color:var(--text)}
.cx-arch-link em{margin-left:auto;font-style:normal;font-size:11px;font-weight:600}

/* ================================================================ settings: memory, archive, appearance */
.cx .cx-set-sub{padding:24px 0 4px;font-size:11.5px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:var(--t3)}
.cx-set-ic{margin:0 5px -2px 0;color:var(--t3)}
.cx-set-field{padding:14px 0 6px}
.cx-set-field textarea.cx-input{min-height:84px}
.cx-set-field textarea:disabled{opacity:.5}
.cx-mem{display:flex;flex-direction:column;gap:10px;padding:12px 0 16px;border-bottom:1px solid var(--line)}
.cx-mem-add{display:flex;align-items:center;gap:10px;height:42px;padding:0 5px 0 13px;border:1px solid var(--line2);border-radius:11px;background:var(--bg)}
.cx-mem-add:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-mem-add svg{flex-shrink:0;color:var(--t3)}
.cx-mem-add input{flex:1;min-width:0;height:100%;font-size:13.5px}
.cx-mem-add .cx-btn{height:32px;border:0;background:var(--s2)}
.cx-mem-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.cx-mem-list li{display:flex;align-items:flex-start;gap:10px;padding:9px 8px 9px 14px;border-bottom:1px solid var(--line);font-size:13.5px;line-height:1.5}
.cx-mem-list li:last-child{border-bottom:0}
.cx-mem-list li span{flex:1;min-width:0;padding-top:2px}
.cx-mem-list li button{width:26px;height:26px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:7px;color:var(--t3)}
.cx-mem-list li button:hover{background:var(--hover);color:var(--danger)}
.cx .cx-mem-empty{font-size:13px;color:var(--t3)}
.cx-mem .cx-btn.danger{align-self:flex-start}
.cx-mem-count{font-size:12px;color:var(--t3)}
.cx-arch{display:flex;flex-direction:column;margin:2px 0 4px;padding:4px;border:1px solid var(--line);border-radius:12px;list-style:none}
.cx-arch li{display:flex;align-items:center;gap:2px}
.cx-arch-t{flex:1;min-width:0;display:flex;align-items:baseline;gap:10px;padding:8px 10px;border-radius:8px;text-align:left}
.cx-arch-t:hover{background:var(--hover)}
.cx-arch-t b{flex:1;min-width:0;font-size:13.5px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cx-arch-t small{flex-shrink:0;font-size:12px;color:var(--t3)}
.cx-arch .cx-ib.danger:hover{color:var(--danger)}

/* ================================================================ library: documents */
.cx-lib-tabs{margin:-6px 0 18px}
.cx-doc h3{overflow-wrap:anywhere}

/* ================================================================ canvas */
.cx-cv{position:relative;z-index:25;width:clamp(400px,44vw,700px);flex-shrink:0;display:flex;flex-direction:column;min-width:0;min-height:0;border-left:1px solid var(--line);background:var(--surface);animation:cxCvIn .22s ease-out}
@keyframes cxCvIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
.cx-cv-h{height:56px;flex-shrink:0;display:flex;align-items:center;gap:6px;padding:0 10px 0 14px;border-bottom:1px solid var(--line)}
.cx-cv-ic{width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:8px;background:var(--acc-soft);color:var(--acc)}
.cx .cx-cv-title{flex:1;min-width:0;height:34px;padding:0 8px;border-radius:8px;font-size:14.5px;font-weight:650;letter-spacing:-.01em;text-overflow:ellipsis}
.cx .cx-cv-title:hover{background:var(--hover)}
.cx .cx-cv-title:focus{background:var(--bg);box-shadow:0 0 0 2px var(--acc-line)}
.cx-cv-acts{display:flex;align-items:center;gap:2px}
.cx-cv-menu-wrap{position:relative}
.cx-cv-export{display:inline-flex;align-items:center;gap:6px;height:32px;margin:0 4px;padding:0 10px;border-radius:9px;background:var(--primary);color:var(--primary-ink);font-size:12.5px;font-weight:600;white-space:nowrap}
.cx-cv-export:hover,.cx-cv-export.open{opacity:.9}
.cx-cv-menu{top:calc(100% + 6px);right:0;width:230px}
.cx-cv-menu.up{top:auto;right:auto;bottom:calc(100% + 6px);left:0;width:200px;max-height:300px;overflow-y:auto}
.cx-cv-body{position:relative;flex:1;min-height:0;overflow-y:auto;background:var(--bg)}
.cx-cv-doc{max-width:740px;margin:0 auto;padding:30px 36px 56px}
.cx .cx-cv-ta{display:block;width:100%;height:100%;min-height:100%;padding:28px 36px 48px;resize:none;font-family:var(--mono);font-size:13.5px;line-height:1.7}
.cx .cx-cv-empty{max-width:420px;margin:64px auto;padding:0 24px;font-size:14px;line-height:1.6;color:var(--t3);text-align:center}
.cx-cv-body.busy .cx-cv-doc,.cx-cv-body.busy .cx-cv-ta{opacity:.45;pointer-events:none}
.cx-cv-busy{position:sticky;bottom:16px;width:max-content;max-width:calc(100% - 32px);margin:0 auto;display:flex;align-items:center;gap:10px;padding:9px 16px;border-radius:999px;background:var(--primary);color:var(--primary-ink);font-size:13px;font-weight:550;box-shadow:var(--sh3)}
.cx-cv-busy .cx-spin{border-color:color-mix(in srgb,var(--primary-ink) 30%,transparent);border-top-color:var(--primary-ink)}
.cx-cv-f{flex-shrink:0;display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-top:1px solid var(--line);background:var(--surface)}
.cx .cx-cv-err{font-size:12.5px;color:var(--danger)}
.cx-cv-quick{display:flex;flex-wrap:wrap;gap:6px}
.cx-cv-quick>button,.cx-cv-quick .cx-cv-menu-wrap>button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border:1px solid var(--line2);border-radius:999px;background:var(--surface);font-size:12.5px;font-weight:550;color:var(--t2);white-space:nowrap;transition:border-color .12s,background .12s,color .12s}
.cx-cv-quick button svg{color:var(--acc)}
.cx-cv-quick>button:hover:not(:disabled),.cx-cv-quick .cx-cv-menu-wrap>button:hover:not(:disabled){border-color:var(--acc-line);background:var(--acc-soft);color:var(--text)}
.cx-cv-ask{display:flex;align-items:center;gap:8px;height:46px;padding:0 6px 0 14px;border:1px solid var(--line2);border-radius:14px;background:var(--bg)}
.cx-cv-ask:focus-within{border-color:var(--acc-line);box-shadow:0 0 0 3px var(--acc-soft)}
.cx-cv-ask input{flex:1;min-width:0;height:100%;font-size:13.5px}
.cx-cv-ask .cx-send{width:34px;height:34px}
.cx .cx-cv-note{display:flex;align-items:center;gap:6px;font-size:11.5px;line-height:1.4;color:var(--t3)}
.cx-cv-note svg{flex-shrink:0;color:var(--ok)}
@media (hover:hover){.cx-cv-h .cx-tip:hover::after{bottom:auto;top:calc(100% + 6px)}}
.cx.has-canvas .cx-safe{display:none}
.cx.has-canvas .cx-thread{padding-left:20px;padding-right:20px}

/* ================================================================ voice mode */
.cx-voice{position:fixed;inset:0;z-index:125;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:28px 24px 30px;background:var(--bg);animation:cxFade .18s ease-out}
.cx-voice-x{position:absolute;top:14px;right:14px}
.cx-voice-mid{flex:1;min-height:0;width:100%;max-width:640px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center}
.cx-orb{position:relative;width:168px;height:168px;flex-shrink:0;margin-bottom:18px}
.cx-orb i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--acc) 45%,#fff) 0%,var(--acc) 55%,color-mix(in srgb,var(--acc) 70%,#000) 100%);transition:filter .3s,opacity .3s}
.cx-orb i:nth-child(2){inset:-14px;background:var(--acc);opacity:.16}
.cx-orb i:nth-child(3){inset:-30px;background:var(--acc);opacity:.07}
.cx-orb.listening i:nth-child(1){animation:cxOrb 2.4s ease-in-out infinite}
.cx-orb.listening i:nth-child(2){animation:cxOrbRing 2.4s ease-in-out infinite}
.cx-orb.listening i:nth-child(3){animation:cxOrbRing 2.4s ease-in-out .3s infinite}
.cx-orb.thinking i:nth-child(1){animation:cxOrbThink 1.2s ease-in-out infinite}
.cx-orb.speaking i:nth-child(1){animation:cxOrbSpeak .45s ease-in-out infinite alternate}
.cx-orb.speaking i:nth-child(2){animation:cxOrbRing .9s ease-in-out infinite}
.cx-orb.paused i,.cx-orb.error i{filter:grayscale(.9);opacity:.45}
.cx-orb.paused i:nth-child(n+2),.cx-orb.error i:nth-child(n+2){opacity:.05}
@keyframes cxOrb{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes cxOrbRing{0%,100%{transform:scale(.96);opacity:.15}50%{transform:scale(1.07);opacity:.04}}
@keyframes cxOrbThink{0%,100%{transform:scale(.9)}50%{transform:scale(1)}}
@keyframes cxOrbSpeak{from{transform:scale(.97)}to{transform:scale(1.06)}}
.cx .cx-voice-status{font-size:17px;font-weight:600;letter-spacing:-.01em}
.cx .cx-voice-err{max-width:440px;font-size:14px;line-height:1.55;color:var(--danger)}
.cx .cx-voice-heard{max-width:560px;font-size:15px;line-height:1.55;color:var(--t2)}
.cx .cx-voice-ans{max-width:600px;max-height:26vh;overflow-y:auto;font-size:15px;line-height:1.65;color:var(--text)}
.cx-voice-ctrl{display:flex;align-items:center;gap:14px}
.cx-voice-mic{width:64px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--s3);color:var(--text);transition:background .14s,transform .1s}
.cx-voice-mic.on{background:var(--primary);color:var(--primary-ink)}
.cx-voice-mic:active:not(:disabled){transform:scale(.95)}
.cx-voice-end{height:48px;padding:0 26px;border-radius:999px;background:color-mix(in srgb,var(--danger) 13%,transparent);color:var(--danger);font-size:14px;font-weight:650}
.cx-voice-end:hover{background:color-mix(in srgb,var(--danger) 20%,transparent)}
.cx .cx-voice-note{margin-top:14px;font-size:12px;color:var(--t3);text-align:center}

/* ================================================================ image preview */
.cx-lightbox{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:32px;background:rgba(5,7,10,.88);cursor:zoom-out;animation:cxFade .14s ease-out}
.cx-lightbox img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}
.cx-lightbox .cx-ib{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.12);color:#fff}
.cx-lightbox .cx-ib:hover{background:rgba(255,255,255,.2);color:#fff}

/* ================================================================ small screens */
@media (max-width:899px){
  .cx-think-btn span{display:none}
  .cx-att{max-width:calc(50% - 4px)}
  .cx-att b{max-width:100%}
  .cx-u-files{max-width:90%}
  .cx-u-files.multi .cx-u-img{width:96px;height:96px}
  .cx-fb-f .cx-btn{flex:1;justify-content:center}
  .cx-cvcard .go{display:none}
  .cx-temp-home{padding:8vh 16px 32px}
  .cx-cv{position:fixed;inset:0;z-index:96;width:auto;border-left:0;animation:cxFade .18s ease-out}
  .cx-cv-doc{padding:22px 18px 44px}
  .cx .cx-cv-ta{padding:20px 18px 40px}
  .cx-cv-export{width:34px;justify-content:center;padding:0}
  .cx-cv-export span,.cx-cv-export svg:last-child{display:none}
  .cx-voice{padding:20px 16px 24px}
  .cx-orb{width:132px;height:132px}
  .cx-lightbox{padding:12px}
}
`;
