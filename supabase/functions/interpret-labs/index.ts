// Deno edge function: AI-powered lab panel interpretation via Lovable AI Gateway.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a clinical laboratory medicine specialist assisting medical students and clinicians in India.
Given a lab panel (CBC, LFT, RFT, lipid, thyroid, etc.) with entered values and reference ranges,
produce a structured integrated interpretation: pattern recognition across values (not just isolated flags),
likely differential causes, urgent action thresholds, correlations to look for, and follow-up tests.
Use evidence-based reasoning (Harrison's, Tietz, NICE, AIIMS). Be concise, safe, and clinically actionable.
Never fabricate values. Include a decision-support disclaimer.`;

const SCHEMA = `Respond ONLY with valid JSON matching:
{
  "overall_impression": "2-3 sentence integrated clinical impression of the panel",
  "urgency": "critical" | "urgent" | "routine" | "normal",
  "critical_alerts": ["values requiring immediate action, e.g. K+ 6.8"],
  "pattern": "one-line pattern label, e.g. 'Microcytic anaemia with iron deficiency picture'",
  "abnormalities": [
    {
      "test": "test name",
      "value": "value with unit",
      "status": "low" | "high",
      "severity": "mild" | "moderate" | "severe" | "critical",
      "interpretation": "1-2 sentences clinical meaning in this context",
      "differentials": ["likely causes ranked"]
    }
  ],
  "correlations": ["cross-value patterns worth noting, e.g. 'ALT>AST with high GGT suggests...'"],
  "recommended_workup": ["next investigations in priority order"],
  "management_pearls": ["immediate/short-term management points"],
  "patient_advice": ["plain-language guidance"]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { panel, values } = await req.json();
    if (!panel || !Array.isArray(values) || values.length === 0) {
      return new Response(JSON.stringify({ error: "Provide panel and at least one value." }), {
        status: 400, headers: { ...cors, "content-type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500, headers: { ...cors, "content-type": "application/json" },
      });
    }

    const lines = values.map((v: any) =>
      `- ${v.name}: ${v.value} ${v.unit} (ref ${v.normalMin}–${v.normalMax} ${v.unit}, status: ${v.status})`
    ).join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: `${SYSTEM}\n\n${SCHEMA}` },
          { role: "user", content: `Panel: ${panel}\nEntered values:\n${lines}` },
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

    return new Response(JSON.stringify({ ok: true, panel, report: parsed }), {
      status: 200, headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...cors, "content-type": "application/json" },
    });
  }
});
