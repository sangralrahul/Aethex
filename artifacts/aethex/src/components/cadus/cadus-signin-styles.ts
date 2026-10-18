/** Styles for the Cadus sign-in page (src/pages/CadusSignIn.tsx). Layered over the base Cadus tokens. */
export const CADUS_SIGNIN_CSS = `
.cx.cx-si{position:fixed;inset:0;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);overflow:auto;background:var(--bg)}
.cx-si-side{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:20px;padding:30px 48px 26px;background:var(--side);border-right:1px solid var(--line);overflow:hidden}
.cx-si-side::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 20% 0%,color-mix(in srgb,var(--acc) 14%,transparent),transparent 70%),radial-gradient(50% 40% at 100% 100%,color-mix(in srgb,var(--acc) 8%,transparent),transparent 70%);pointer-events:none}
.cx-si-side>*{position:relative}
.cx-si-brand{display:flex;align-items:center;gap:11px;font-size:19px;font-weight:700;letter-spacing:-.02em;line-height:1.1}
.cx-si-brand span{display:flex;flex-direction:column;gap:3px}
.cx-si-brand small{font-size:12px;font-weight:500;letter-spacing:0;color:var(--t3)}
.cx-si-brand.small{display:none;font-size:17px;margin-bottom:22px}
.cx-si-pitch{margin:auto 0;padding:12px 0}
.cx .cx-si-pitch h2{max-width:520px;font-size:34px;font-weight:650;line-height:1.2;letter-spacing:-.03em}
.cx-si-pitch ul{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:520px;margin:10px 0 0;padding:0;list-style:none}
.cx-si-pitch li{display:flex;flex-direction:column;gap:6px;padding:0 4px;border:0;background:transparent;font-size:12.5px;line-height:1.5;color:var(--t2)}
.cx-si-pitch li>svg{flex-shrink:0;margin-top:2px;color:var(--acc)}
.cx-si-pitch b{font-weight:650;color:var(--text)}
.cx .cx-si-foot{max-width:440px;font-size:12px;line-height:1.5;color:var(--t3)}
.cx-si-main{display:flex;align-items:center;justify-content:center;padding:32px 24px}
.cx-si-card{width:100%;max-width:420px;padding:8px 0}
.cx .cx-si-card h1{font-size:26px;font-weight:650;letter-spacing:-.028em;line-height:1.2}
.cx .cx-si-lead{margin-top:8px;font-size:14px;line-height:1.55;color:var(--t2)}
.cx-si-google{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:44px;margin-top:22px;border:1px solid var(--line2);border-radius:12px;background:var(--surface);font-size:14px;font-weight:600;color:var(--text);transition:border-color .12s,background .12s}
.cx-si-google:hover:not(:disabled){border-color:color-mix(in srgb,var(--text) 24%,var(--line2));background:var(--hover)}
.cx-si-google{text-decoration:none}
.cx-si-or{display:flex;align-items:center;gap:12px;margin:18px 0 14px;font-size:12px;color:var(--t3)}
.cx-si-or::before,.cx-si-or::after{content:"";flex:1;height:1px;background:var(--line)}
.cx-seg.cx-si-seg{display:flex;width:100%;margin-bottom:16px}
.cx-si-seg button{flex:1;justify-content:center;gap:5px}
.cx-si-form{display:flex;flex-direction:column;gap:14px}
.cx-si-form .cx-input{height:44px}
.cx-si-pw{position:relative;display:block}
.cx-si-pw .cx-input{padding-right:44px!important}
.cx-si-pw .cx-ib{position:absolute;top:5px;right:5px}
.cx-si-phone{display:flex;align-items:center;gap:8px}
.cx-si-phone em{flex-shrink:0;height:44px;padding:0 12px;display:inline-flex;align-items:center;border:1px solid var(--line2);border-radius:11px;background:var(--s2);font-style:normal;font-size:14px;font-weight:600;color:var(--t2)}
.cx-si-code{font-size:22px!important;letter-spacing:.3em;text-align:center;font-variant-numeric:tabular-nums}
.cx .cx-si-hint{font-size:12.5px;line-height:1.5;color:var(--t3)}
.cx .cx-si-err{padding:9px 12px;border:1px solid color-mix(in srgb,var(--danger) 35%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--danger) 7%,transparent);font-size:13px;line-height:1.45;color:var(--danger)}
.cx-si-submit{height:44px;justify-content:center;font-size:14px}
.cx-si-back{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;height:28px;margin:-4px 0 -6px -6px;padding:0 8px;border-radius:7px;font-size:12.5px;font-weight:550;color:var(--t2)}
.cx-si-back:hover{background:var(--hover);color:var(--text)}
.cx-si-resend{align-self:center;height:30px;padding:0 8px;font-size:12.5px;font-weight:550;color:var(--acc)}
.cx-si-resend:disabled{color:var(--t3)}
.cx .cx-si-switch{margin-top:22px;font-size:13.5px;color:var(--t2);text-align:center}
.cx-si-switch button{font-weight:650;color:var(--acc)}
.cx-si-switch button:hover{text-decoration:underline;text-underline-offset:3px}
.cx-si-guest{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:40px;margin-top:14px;border:1px dashed var(--line2);border-radius:11px;font-size:13.5px;font-weight:550;color:var(--t2);transition:border-color .12s,color .12s}
.cx-si-guest:hover{border-color:var(--acc-line);color:var(--text)}
.cx .cx-si-legal{margin-top:18px;font-size:11.5px;line-height:1.5;color:var(--t3);text-align:center}
.cx-si-legal a{color:var(--t2);text-decoration:underline;text-underline-offset:3px}
.cx-si-done{display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 0;text-align:center}
.cx .cx-si-done p{font-size:14px;color:var(--t2)}
@media (max-width:899px){
  .cx.cx-si{grid-template-columns:1fr}
  .cx-si-side{display:none}
  .cx-si-brand.small{display:flex}
  .cx-si-main{align-items:flex-start;padding:28px 18px 40px}
  .cx .cx-si-card h1{font-size:23px}
}
`;
