// AI-powered radiology image analysis via Groq (multimodal vision).
import { callGroq, cors, jsonResponse, GROQ_VISION_MODEL } from "../_shared/groq.ts";

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
    { "finding": "e.g. Right lower lobe consolidation",
      "location": "anatomic location",
      "confidence": "high" | "moderate" | "low",
      "urgency": "normal" | "incidental" | "significant" | "emergency",
      "description": "1-2 sentence radiological description" }
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
      return jsonResponse({ error: "Provide imageBase64 (data URL or raw base64)." }, 400);
    }
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

    const userText = [
      `Modality: ${modality || "unspecified"}`,
      `Region / Study: ${region || "unspecified"}`,
      clinicalContext ? `Clinical context: ${clinicalContext}` : "Clinical context: not provided",
      "Please analyse the attached image and return the structured JSON report.",
    ].join("\n");

    const result = await callGroq({
      model: GROQ_VISION_MODEL,
      jsonMode: true,
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
    });
    if (!result.ok) return jsonResponse({ error: result.error, detail: result.detail }, result.status);

    let parsed: unknown;
    try { parsed = JSON.parse(result.content || "{}"); } catch {
      return jsonResponse({ error: "AI returned malformed JSON.", raw: result.content }, 502);
    }
    return jsonResponse({ ok: true, report: parsed });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
