// Deno edge function: AI-powered radiology image analysis via Lovable AI Gateway (multimodal).
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a board-certified radiologist assisting medical students and clinicians in India.
Given a radiology image (X-ray / CT / MRI) plus modality and region context, produce a structured
educational report: systematic review, key findings, differentials, urgency, and recommended next steps.
Use evidence-based reasoning (Fleischner Society, ACR, RSNA, AIIMS). Be safe and clinically actionable.
If the image is not a medical image or is unreadable, say so clearly and do not fabricate findings.
Always include a decision-support disclaimer.`;

const SCHEMA = `Respond ONLY with valid JSON matching:
{
  "image_quality": "diagnostic" | "suboptimal" | "non-diagnostic" | "not-a-medical-image",
  "modality_confirmed": "e.g. Chest X-ray PA",
  "systematic_review": ["ABCDE-style checklist observations, one per item"],
  "key_findings": [
    {
      "finding": "e.g. Right lower lobe consolidation",
      "location": "anatomic location",
      "confidence": "high" | "moderate" | "low",
      "urgency": "normal" | "incidental" | "significant" | "emergency",
      "description": "1-2 sentence radiological description"
    }
  ],
  "impression": "2-3 sentence integrated clinical impression",
  "differentials": ["ranked differential diagnoses"],
  "recommended_next_steps": ["imaging / labs / referrals in priority order"],
  "red_flags": ["findings mandating urgent escalation"],
  "teaching_points": ["1-3 educational pearls for a medical trainee"]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { imageBase64, mimeType, modality, region, clinicalContext } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Provide imageBase64 (data URL or raw base64)." }), {
        status: 400, headers: { ...cors, "content-type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500, headers: { ...cors, "content-type": "application/json" },
      });
    }

    // Normalize to data URL
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

    const userText = [
      `Modality: ${modality || "unspecified"}`,
      `Region / Study: ${region || "unspecified"}`,
      clinicalContext ? `Clinical context: ${clinicalContext}` : "Clinical context: not provided",
      "Please analyse the attached image and return the structured JSON report.",
    ].join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: `${SYSTEM}\n\n${SCHEMA}` },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
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

    return new Response(JSON.stringify({ ok: true, report: parsed }), {
      status: 200, headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...cors, "content-type": "application/json" },
    });
  }
});
