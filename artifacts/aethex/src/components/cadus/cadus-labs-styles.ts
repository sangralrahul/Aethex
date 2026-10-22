/**
 * Styles for Case Simulator, Rx Safety Check, Guideline Watch and Report Explainer
 * (update 9). Built on the shared page, field and button styles; loaded last.
 */
export const CADUS_LABS_CSS = `
.cx-lab-grid{display:grid;grid-template-columns:minmax(0,400px) minmax(0,1fr);gap:22px;align-items:start}
.cx-lab-form{display:flex;flex-direction:column;gap:12px;min-width:0}
.cx-lab-out{display:flex;flex-direction:column;gap:14px;min-width:0}
.cx-lab-list{display:flex;flex-direction:column;gap:6px}
.cx-lab-h2{font-size:18px;margin:0 0 8px}
.cx-lab-h3{font-size:15px;margin:0 0 8px}
.cx-lab-row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:start}
.cx-lab-row3 .cx-input,.cx-lab-row3 .cx-select{height:42px;box-sizing:border-box;width:100%;min-width:0;max-width:100%}
.cx-lab-row3>*{min-width:0}
.cx-lab-form .cx-field>span{display:inline-flex;align-items:center;gap:5px}
.cx-lab-checks{padding-top:22px}
.cx-lab-checks{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--t2);padding-bottom:6px}
.cx-lab-checks label,.cx-lab-toggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.cx-lab-toggle{font-size:13px;color:var(--t2)}
.cx-lab-files{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.cx-lab-file{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:4px 6px 4px 8px;border:1px solid var(--line);border-radius:var(--r-sm,6px);background:var(--s2);font-size:12.5px}
.cx-lab-file small{color:var(--t3)}
.cx-lab-file button{display:inline-flex;border:0;background:none;color:var(--t3);cursor:pointer;padding:2px}
.cx-lab-drop{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;border:1.5px dashed var(--line2);border-radius:var(--r-lg,10px);background:var(--surface);color:var(--t2);text-align:center}
.cx-lab-drop p{margin:0;font-size:13.5px}
.cx-lab-table{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-lab-table table{width:100%;border-collapse:collapse;font-size:13.5px}
.cx-lab-table th{text-align:left;font-weight:600;font-size:12px;color:var(--t3);padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.cx-lab-table td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.cx-lab-table tr:last-child td{border-bottom:0}
.cx-lab-table td small{display:block;color:var(--t3);font-size:12px;margin-top:2px}
.cx-sc-row.static{cursor:default}
.cx-sc-acts.end{justify-content:flex-end}
.spin{animation:cx-lab-spin 1s linear infinite}
@keyframes cx-lab-spin{to{transform:rotate(360deg)}}

/* Case Simulator */
.cx-sim-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cx-sim-stats>div{display:flex;flex-direction:column;gap:2px;padding:14px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-sim-stats b{font-size:22px}
.cx-sim-stats small{color:var(--t3);font-size:12px}
.cx-sim-head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px}
.cx-sim-head h1{font-size:22px;margin:0 0 4px}
.cx-sim-head p{margin:0;color:var(--t2);font-size:14px}
.cx-sim-meta{display:flex;align-items:center;gap:8px}
.cx-sim-clock,.cx-sim-status{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border-radius:999px;font-size:12.5px;font-weight:600;background:var(--s2);color:var(--t2)}
.cx-sim-status.s-improving,.cx-sim-status.s-recovered{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-sim-status.s-worsening{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-sim-status.s-critical,.cx-sim-status.s-died{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-sim-vitals{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;position:sticky;top:0;z-index:2;padding:6px 0;background:var(--bg,transparent)}
.cx-sim-vital{display:flex;flex-direction:column;align-items:center;gap:1px;padding:10px 6px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);font-variant-numeric:tabular-nums}
.cx-sim-vital b{font-size:20px;line-height:1.2}
.cx-sim-vital small{font-size:11px;color:var(--t3)}
.cx-sim-vital.warn{border-color:color-mix(in srgb,var(--warn) 55%,var(--line));background:color-mix(in srgb,var(--warn) 8%,var(--surface))}
.cx-sim-vital.warn b{color:var(--warn)}
.cx-sim-vital.bad{border-color:color-mix(in srgb,var(--danger) 55%,var(--line));background:color-mix(in srgb,var(--danger) 8%,var(--surface))}
.cx-sim-vital.bad b{color:var(--danger)}
.cx-sim-log{display:flex;flex-direction:column;gap:10px}
.cx-sim-entry{padding:12px 16px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);font-size:14.5px}
.cx-sim-entry.open{background:color-mix(in srgb,var(--acc) 5%,var(--surface))}
.cx-sim-entry.pending{padding:16px}
.cx-sim-who{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.cx-sim-you{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 8px;font-weight:600}
.cx-sim-you small{margin-left:auto;font-weight:400;color:var(--t3);font-size:12px}
.cx-sim-kind{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:11.5px;font-weight:600;background:var(--acc-soft);color:var(--acc)}
.cx-sim-kind.k-treat{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-sim-kind.k-test{background:color-mix(in srgb,var(--warn) 14%,transparent);color:var(--warn)}
.cx-sim-event{display:flex;align-items:center;gap:6px;margin:8px 0 0;padding:6px 10px;border-radius:var(--r,8px);background:color-mix(in srgb,var(--danger) 10%,transparent);color:var(--danger);font-weight:600;font-size:13.5px}
.cx-sim-dots{display:inline-flex;gap:4px}
.cx-sim-dots i{width:7px;height:7px;border-radius:50%;background:var(--t3);animation:cx-sim-dot 1.2s infinite ease-in-out}
.cx-sim-dots i:nth-child(2){animation-delay:.15s}.cx-sim-dots i:nth-child(3){animation-delay:.3s}
@keyframes cx-sim-dot{0%,80%,100%{opacity:.25}40%{opacity:1}}
.cx-sim-bar,.cx-sim-finish{position:sticky;bottom:0;display:flex;flex-direction:column;align-items:stretch;text-align:left;gap:8px;padding:12px;border:1px solid var(--line2);border-radius:var(--r-lg,10px);background:var(--surface);box-shadow:0 -6px 20px rgba(0,0,0,.06)}
.cx-sim-finish h3{display:flex;align-items:center;gap:6px;margin:0;font-size:15px}
.cx-sim-kinds{display:flex;flex-wrap:wrap;justify-content:flex-start;gap:6px}
.cx-sim-kinds button{height:30px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--t2);font:inherit;font-size:13px;cursor:pointer}
.cx-sim-kinds button.on{border-color:var(--acc);background:var(--acc-soft);color:var(--acc);font-weight:600}
.cx-sim-quick{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.cx-sim-quick button{flex:none;height:28px;padding:0 10px;border:1px dashed var(--line2);border-radius:999px;background:none;color:var(--t2);font:inherit;font-size:12.5px;cursor:pointer}
.cx-sim-quick button:hover{background:var(--hover)}
.cx-sim-input{display:flex;gap:6px;width:100%}
.cx-sim-input .cx-input{flex:1;min-width:0;width:auto;max-width:none}
.cx-sim-quick{justify-content:flex-start}
.cx-sim-debrief{display:flex;flex-wrap:wrap;gap:16px;align-items:stretch}
.cx-sim-score{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:140px;padding:18px;border-radius:var(--r-lg,10px);background:var(--s2)}
.cx-sim-score b{font-size:40px;line-height:1}
.cx-sim-score small{color:var(--t3)}
.cx-sim-score.good{background:color-mix(in srgb,var(--ok) 12%,var(--surface));color:var(--ok)}
.cx-sim-score.mid{background:color-mix(in srgb,var(--warn) 12%,var(--surface));color:var(--warn)}
.cx-sim-score.low{background:color-mix(in srgb,var(--danger) 10%,var(--surface));color:var(--danger)}
.cx-sim-dx{flex:1;min-width:240px;display:flex;flex-direction:column;gap:6px;padding:16px 18px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-sim-dx h2{margin:0;font-size:20px}
.cx-sim-dx p{margin:0;font-size:14px}
.cx-sim-dx p.ok,.cx-sim-dx p.no{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.cx-sim-dx p.ok{color:var(--ok)}.cx-sim-dx p.no{color:var(--danger)}
.cx-sim-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.cx-sim-card{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);font-size:14px}
.cx-sim-card h3{margin:0 0 6px;font-size:14px}
.cx-sim-card ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}
.cx-sim-card.ok{border-top:3px solid var(--ok)}.cx-sim-card.warn{border-top:3px solid var(--warn)}.cx-sim-card.bad{border-top:3px solid var(--danger)}

/* Rx Safety Check */
.cx-rxc-verdict{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:var(--r-lg,10px);border:1px solid var(--line)}
.cx-rxc-verdict b{font-size:16px}
.cx-rxc-verdict p{margin:2px 0 0;font-size:14px;color:var(--t2)}
.cx-rxc-verdict.v-ok{background:color-mix(in srgb,var(--ok) 10%,var(--surface));border-color:color-mix(in srgb,var(--ok) 40%,var(--line));color:var(--ok)}
.cx-rxc-verdict.v-review{background:color-mix(in srgb,var(--warn) 10%,var(--surface));border-color:color-mix(in srgb,var(--warn) 45%,var(--line));color:var(--warn)}
.cx-rxc-verdict.v-unsafe{background:color-mix(in srgb,var(--danger) 9%,var(--surface));border-color:color-mix(in srgb,var(--danger) 45%,var(--line));color:var(--danger)}
.cx-rxc-verdict b{color:inherit}
.cx-rxc-issues{display:flex;flex-direction:column;gap:8px}
.cx-rxc-issue{padding:12px 14px;border:1px solid var(--line);border-left-width:4px;border-radius:var(--r,8px);background:var(--surface);font-size:14px}
.cx-rxc-issue.s-high{border-left-color:var(--danger)}.cx-rxc-issue.s-moderate{border-left-color:var(--warn)}.cx-rxc-issue.s-low{border-left-color:var(--line2)}
.cx-rxc-issue h3{margin:4px 0;font-size:14.5px}
.cx-rxc-issue p{margin:0 0 4px}
.cx-rxc-act{color:var(--text)}
.cx-rxc-tags{display:flex;flex-wrap:wrap;gap:6px;margin:0}
.cx-rxc-sev,.cx-rxc-kind,.cx-rxc-nlem,.cx-rex-flag,.cx-watch-imp,.cx-watch-new{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:999px;font-size:11px;font-weight:600}
.cx-rxc-sev.s-high{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.cx-rxc-sev.s-moderate{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-rxc-sev.s-low,.cx-rxc-kind{background:var(--s2);color:var(--t2)}
.cx-rxc-nlem{margin-left:6px;background:var(--acc-soft);color:var(--acc)}
.cx-rxc-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ok);vertical-align:middle}
.cx-rxc-dot.m-caution,.cx-rxc-dot.v-review{background:var(--warn)}
.cx-rxc-dot.m-danger,.cx-rxc-dot.v-unsafe{background:var(--danger)}

.cx-rxc-meds{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.cx-rxc-med{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface);font-size:13.5px}
.cx-rxc-med.m-caution{border-color:color-mix(in srgb,var(--warn) 40%,var(--line))}
.cx-rxc-med.m-danger{border-color:color-mix(in srgb,var(--danger) 45%,var(--line))}
.cx-rxc-med p{margin:0}
.cx-rxc-med-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.cx-rxc-med-h b{font-size:14.5px}
.cx-rxc-med-h small{flex-basis:100%;color:var(--t3);font-size:12px}
.cx-rxc-med-h .cx-rxc-nlem{margin-left:0}
.cx-rxc-med-d{color:var(--text)}
.cx-rxc-med-n{color:var(--t2)}
.cx-rxc-med-j{color:var(--t2);font-size:12.5px}

/* Guideline Watch */
.cx-watch-bar{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.cx-watch-topics{display:flex;flex-wrap:wrap;gap:6px}
.cx-watch-chip{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;background:var(--surface);overflow:hidden}
.cx-watch-chip>button,button.cx-watch-chip{display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 12px;border:0;background:none;color:var(--t2);font:inherit;font-size:13px;cursor:pointer}
.cx-watch-chip.on{border-color:var(--acc);background:var(--acc-soft)}
.cx-watch-chip.on>button{color:var(--acc);font-weight:600}
.cx-watch-chip>button.x{padding:0 8px 0 0}
button.cx-watch-chip.add{border-style:dashed}
.cx-watch-opts{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
.cx-watch-add{display:grid;grid-template-columns:minmax(0,200px) minmax(0,1fr) auto;gap:8px}
.cx-watch-list{display:flex;flex-direction:column;gap:14px}
.cx-watch-card{padding:16px 18px;border:1px solid var(--line);border-radius:var(--r-lg,10px);background:var(--surface)}
.cx-watch-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.cx-watch-h h2{margin:0;font-size:17px}
.cx-watch-h small{color:var(--t3);font-size:12px}
.cx-watch-wait{margin:0;color:var(--t3);font-size:14px}
.cx-watch-head{margin:0 0 4px;font-size:15px}
.cx-watch-sum{margin:0 0 10px;color:var(--t2);font-size:14px}
.cx-watch-items{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:10px;font-size:14px}
.cx-watch-items p{margin:0 0 3px}
.cx-watch-why{color:var(--t2)}
.cx-watch-src{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:12.5px;color:var(--acc);text-decoration:none}
.cx-watch-src span{color:var(--t3)}
.cx-watch-imp{background:var(--s2);color:var(--t2)}
.cx-watch-imp.i-practice-changing{background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)}
.cx-watch-imp.i-notable{background:var(--acc-soft);color:var(--acc)}
.cx-watch-new{background:color-mix(in srgb,var(--warn) 18%,transparent);color:var(--warn)}

/* Report Explainer */
.cx-rex-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.cx-rex-tabs button{display:inline-flex;align-items:center;gap:6px}
.cx-rex-flag{background:var(--s2);color:var(--t2)}
.cx-rex-flag.f-critical{background:color-mix(in srgb,var(--danger) 16%,transparent);color:var(--danger)}
.cx-rex-flag.f-high,.cx-rex-flag.f-low,.cx-rex-flag.f-abnormal{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn)}
.cx-rex-flag.f-normal{background:color-mix(in srgb,var(--ok) 12%,transparent);color:var(--ok)}
.cx-rex-urg{color:var(--danger);vertical-align:-1px}

@media (max-width:900px){
  .cx-lab-grid{grid-template-columns:1fr}
  .cx-sim-vitals{grid-template-columns:repeat(5,minmax(56px,1fr));overflow-x:auto}
  .cx-watch-add{grid-template-columns:1fr}
}
@media (max-width:520px){
  .cx-lab-row3{grid-template-columns:1fr 1fr}
  .cx-sim-vital b{font-size:16px}
  .cx-sim-stats b{font-size:18px}
}
`;
