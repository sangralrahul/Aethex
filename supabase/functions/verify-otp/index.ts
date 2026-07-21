// Deno edge function - verifies an OTP, upserts the user, returns a session.
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
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();
    const profile = body.profile as { name?: string; role?: string; college?: string; hospital?: string } | undefined;

    if (!email || !/^\d{6}$/.test(otp)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find most recent unused OTP
    const { data: rows, error: fetchErr } = await admin
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (fetchErr) throw fetchErr;
    const record = rows?.[0];
    if (!record) {
      return new Response(JSON.stringify({ error: "No code requested. Please request a new code." }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Code expired. Request a new one." }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
    }
    if (record.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Request a new code." }), { status: 429, headers: { ...cors, "content-type": "application/json" } });
    }

    const hash = await sha256(`${email}:${otp}`);
    if (hash !== record.code_hash) {
      await admin.from("otp_codes").update({ attempts: record.attempts + 1 }).eq("id", record.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
    }

    await admin.from("otp_codes").update({ used: true }).eq("id", record.id);

    // Find or create user
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users?.find((u) => (u.email || "").toLowerCase() === email);

    if (!user) {
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: profile?.name || email.split("@")[0] },
      });
      if (created.error) throw created.error;
      user = created.data.user!;
    }

    // Upsert profile
    if (profile) {
      await admin.from("profiles").upsert({
        id: user.id,
        email,
        name: profile.name,
        role: profile.role as "student" | "doctor" | "other" | undefined,
        college: profile.college,
        hospital: profile.hospital,
      }, { onConflict: "id" });
    }

    // Generate a magic link and return the hashed token so client can setSession
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (link.error) throw link.error;

    return new Response(JSON.stringify({
      success: true,
      email,
      // action_link contains ?token_hash=...&type=magiclink - client uses verifyOtp with token_hash
      action_link: link.data.properties?.action_link,
      hashed_token: link.data.properties?.hashed_token,
    }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (err) {
    console.error("verify-otp error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }
});
