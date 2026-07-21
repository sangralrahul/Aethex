// Deno edge function - sends a 6-digit OTP via Brevo and stores its hash.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
    }
    const normalized = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit: at most 1 OTP per email per 60s
    const { data: recent } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("email", normalized)
      .order("created_at", { ascending: false })
      .limit(1);
    if (recent && recent.length && Date.now() - new Date(recent[0].created_at).getTime() < 60_000) {
      return new Response(JSON.stringify({ error: "Please wait before requesting another code." }), { status: 429, headers: { ...cors, "content-type": "application/json" } });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(`${normalized}:${otp}`);
    const expires_at = new Date(Date.now() + 5 * 60_000).toISOString();

    const { error: insertErr } = await supabase.from("otp_codes").insert({ email: normalized, code_hash, expires_at });
    if (insertErr) throw insertErr;

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@aethex.in";
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    }

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F5F3EE;padding:24px;color:#0F1729;">
      <div style="max-width:520px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E5E1D8;">
        <div style="background:linear-gradient(135deg,#0F1729,#1E2A47);padding:24px;">
          <div style="font-size:26px;font-weight:800;color:#00C2A8;">aethex<span style="color:#fff;">.</span></div>
          <div style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:.08em;">INDIA'S CLINICAL PLATFORM</div>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 6px;">Your verification code</h2>
          <p style="color:#555;margin:0 0 20px;">Use the code below to sign in to your AETHEX account. It expires in 5 minutes.</p>
          <div style="background:#F0FDF9;border:2px solid #00C2A8;border-radius:12px;padding:24px;text-align:center;">
            <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#00C2A8;font-family:monospace;">${otp}</div>
          </div>
          <p style="color:#888;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body></html>`;

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "AETHEX Medical", email: FROM_EMAIL },
        to: [{ email: normalized }],
        subject: `${otp} is your AETHEX verification code`,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const body = await brevoRes.text();
      console.error("Brevo error", brevoRes.status, body);
      return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 502, headers: { ...cors, "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (err) {
    console.error("send-otp error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }
});
