// Deno edge function: AI-powered symptom predictor via Lovable AI Gateway.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a clinical decision support assistant for medical students and clinicians in India.
Given a list of presenting symptoms plus optional patient context (age, sex, duration, comorbidities),
generate a ranked differential diagnosis with triage severity, red flags, and a suggested workup.
Use evidence-based reasoning (Harrison's, Oxford Handbook, NICE, AIIMS/ICMR guidelines where relevant).
Be concise, clinically actionable, and safe. Never invent conditions. Always include a decision-support disclaimer.`;

const SCHEMA_INSTRUCTION = `Respond ONLY with valid JSON matching this shape:
{
  "overall_triage": "emergency" | "urgent" | "semi-urgent" | "routine",
  "summary": "2-3 sentence clinical impression",
  "red_flags": ["symptoms/signs that mandate immediate escalation"],
  "differentials": [
    {
      "condition": "diagnosis name",
      "icd10": "ICD-10 code if known, else empty string",
      "probability": "high" | "moderate" | "low",
      "triage": "emergency" | "urgent" | "semi-urgent" | "routine",
      "rationale": "1-2 sentences on why this fits",
      "supporting_features": ["matching symptoms/signs"],
      "against_features": ["features that would argue against"]
    }
  ],
  "recommended_workup": ["labs/imaging/bedside tests in priority order"],
  "immediate_actions": ["what to do now (safety-net, refer, admit, etc.)"],
  "patient_advice": ["plain-language guidance for the patient"]
}
Return 4–7 differentials, ordered emergency-first then by probability.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { symptoms, context } = await req.json();
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(JSON.stringify({ error: "Provide at least one symptom." }), {
        status: 400, headers: { ...cors, "content-type": "application/json" },
      });
    }
    const cleaned = symptoms.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500, headers: { ...cors, "content-type": "application/json" },
      });
    }

    const ctxLine = context && typeof context === "object"
      ? `Patient context: ${JSON.stringify(context)}`
      : "Patient context: not provided";

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
          { role: "user", content: `Presenting symptoms: ${cleaned.join(", ")}\n${ctxLine}` },
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

    return new Response(JSON.stringify({ ok: true, symptoms: cleaned, report: parsed }), {
      status: 200, headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...cors, "content-type": "application/json" },
    });
  }
});
