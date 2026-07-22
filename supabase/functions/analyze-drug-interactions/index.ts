// Deno edge function: AI-powered drug interaction analysis via Lovable AI Gateway.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a clinical pharmacology assistant used by medical students and clinicians in India.
Given a list of 2–5 drugs, analyze pairwise interactions and produce a structured JSON report.
Use evidence-based sources (Micromedex, Lexicomp, Stockley, BNF). Be concise, clinically actionable, and safe.
Never invent drug names. If a name is ambiguous, use the most common form.
Always include a disclaimer that this is decision support, not a substitute for a prescriber.`;

const SCHEMA_INSTRUCTION = `Respond ONLY with valid JSON matching this shape:
{
  "overall_risk": "low" | "moderate" | "high",
  "summary": "2-3 sentence executive summary",
  "interactions": [
    {
      "drug1": "string",
      "drug2": "string",
      "severity": "major" | "moderate" | "minor" | "none",
      "mechanism": "brief pharmacologic mechanism",
      "clinical_effect": "what may happen to the patient",
      "management": "concrete steps: monitor X, adjust dose, avoid, separate by N hrs, etc.",
      "onset": "rapid | delayed | unknown"
    }
  ],
  "monitoring": ["list of labs/vitals to monitor"],
  "alternatives": ["safer drug substitutions if any"],
  "patient_counseling": ["plain-language points to tell the patient"]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { drugs } = await req.json();
    if (!Array.isArray(drugs) || drugs.length < 2 || drugs.length > 5) {
      return new Response(JSON.stringify({ error: "Provide 2 to 5 drug names." }), {
        status: 400, headers: { ...cors, "content-type": "application/json" },
      });
    }
    const cleaned = drugs.map((d: unknown) => String(d).trim()).filter(Boolean).slice(0, 5);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500, headers: { ...cors, "content-type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: `${SYSTEM}\n\n${SCHEMA_INSTRUCTION}` },
          { role: "user", content: `Analyze interactions for: ${cleaned.join(", ")}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "AI service is busy, please retry in a moment." }), {
        status: 429, headers: { ...cors, "content-type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Contact support." }), {
        status: 402, headers: { ...cors, "content-type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI upstream error: ${resp.status}`, detail: t.slice(0, 300) }), {
        status: 502, headers: { ...cors, "content-type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      return new Response(JSON.stringify({ error: "AI returned malformed JSON.", raw }), {
        status: 502, headers: { ...cors, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, drugs: cleaned, report: parsed }), {
      status: 200, headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...cors, "content-type": "application/json" },
    });
  }
});
