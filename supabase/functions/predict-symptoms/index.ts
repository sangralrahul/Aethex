// AI-powered symptom predictor via Groq.
import { callGroq, cors, jsonResponse } from "../_shared/groq.ts";

const SYSTEM = `You are a clinical decision support assistant for medical students and clinicians in India.
Given a list of presenting symptoms plus optional patient context (age, sex, duration, comorbidities),
generate a ranked differential diagnosis with triage severity, red flags, and a suggested workup.
Use evidence-based reasoning (Harrison's, Oxford Handbook, NICE, AIIMS/ICMR guidelines where relevant).
Be concise, clinically actionable, and safe. Never invent conditions. Always include a decision-support disclaimer.`;

const SCHEMA = `Respond ONLY with valid JSON matching:
{
  "overall_triage": "emergency" | "urgent" | "semi-urgent" | "routine",
  "summary": "2-3 sentence clinical impression",
  "red_flags": ["symptoms/signs that mandate immediate escalation"],
  "differentials": [
    { "condition": "diagnosis name", "icd10": "ICD-10 code if known, else empty string",
      "probability": "high" | "moderate" | "low",
      "triage": "emergency" | "urgent" | "semi-urgent" | "routine",
      "rationale": "1-2 sentences on why this fits",
      "supporting_features": ["matching symptoms/signs"],
      "against_features": ["features that would argue against"] }
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
      return jsonResponse({ error: "Provide at least one symptom." }, 400);
    }
    const cleaned = symptoms.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20);
    const ctxLine = context && typeof context === "object"
      ? `Patient context: ${JSON.stringify(context)}`
      : "Patient context: not provided";

    const result = await callGroq({
      jsonMode: true,
      messages: [
        { role: "system", content: `${SYSTEM}\n\n${SCHEMA}` },
        { role: "user", content: `Presenting symptoms: ${cleaned.join(", ")}\n${ctxLine}` },
      ],
    });
    if (!result.ok) return jsonResponse({ error: result.error, detail: result.detail }, result.status);

    let parsed: unknown;
    try { parsed = JSON.parse(result.content || "{}"); } catch {
      return jsonResponse({ error: "AI returned malformed JSON.", raw: result.content }, 502);
    }
    return jsonResponse({ ok: true, symptoms: cleaned, report: parsed });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
