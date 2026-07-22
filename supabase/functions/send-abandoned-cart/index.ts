// Scheduled edge function - sends Brevo reminder emails for carts abandoned >1h
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();

    // carts abandoned >1h AND (never notified OR notified before last update)
    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("user_id,email,items,item_count,total,updated_at,notified_at")
      .gt("item_count", 0)
      .lt("updated_at", cutoff)
      .limit(50);
    if (error) throw error;

    const targets = (carts || []).filter(
      (c: any) => !c.notified_at || new Date(c.notified_at) < new Date(c.updated_at),
    );

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@aethex.in";
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    }

    let sent = 0;
    for (const c of targets) {
      const items: any[] = Array.isArray(c.items) ? c.items : [];
      const rows = items.slice(0, 4).map((it) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;color:#0F1729;">${escapeHtml(it.name || "Item")}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;color:#555;text-align:center;">×${it.quantity || 1}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;color:#0F1729;text-align:right;">₹${Number(it.price || 0).toLocaleString("en-IN")}</td>
        </tr>`).join("");

      const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F5F3EE;padding:24px;color:#0F1729;">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E5E1D8;">
          <div style="background:linear-gradient(135deg,#0F1729,#1E2A47);padding:24px;">
            <div style="font-size:26px;font-weight:800;color:#00C2A8;">aethex<span style="color:#fff;">.</span></div>
            <div style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:.08em;">INDIA'S CLINICAL PLATFORM</div>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 6px;">You left ${c.item_count} item${c.item_count === 1 ? "" : "s"} in your cart</h2>
            <p style="color:#555;margin:0 0 20px;">Your selection is still waiting. Complete your order before items go out of stock.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rows}</table>
            <div style="text-align:right;font-size:16px;font-weight:700;margin-bottom:20px;">Total: ₹${Number(c.total || 0).toLocaleString("en-IN")}</div>
            <div style="text-align:center;">
              <a href="https://aethex.in/cart" style="display:inline-block;background:#00C2A8;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;">Return to cart</a>
            </div>
            <p style="color:#888;font-size:12px;margin-top:24px;text-align:center;">If you already completed this order, please ignore this email.</p>
          </div>
        </div>
      </body></html>`;

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: "AETHEX Medical", email: FROM_EMAIL },
          to: [{ email: c.email }],
          subject: `You left ${c.item_count} item${c.item_count === 1 ? "" : "s"} in your AETHEX cart`,
          htmlContent: html,
        }),
      });

      if (res.ok) {
        await supabase.from("abandoned_carts").update({ notified_at: new Date().toISOString() }).eq("user_id", c.user_id);
        sent++;
      }
    }

    return new Response(JSON.stringify({ ok: true, scanned: carts?.length || 0, sent }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }
});

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
