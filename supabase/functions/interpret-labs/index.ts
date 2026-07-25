// AI-powered lab panel interpretation via Groq.
import { callGroq, cors, jsonResponse } from "../_shared/groq.ts";

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
  "pattern": "one-line pattern label",
  "abnormalities": [
    { "test": "test name", "value": "value with unit",
      "status": "low" | "high",
      "severity": "mild" | "moderate" | "severe" | "critical",
      "interpretation": "1-2 sentences clinical meaning in this context",
      "differentials": ["likely causes ranked"] }
  ],
  "correlations": ["cross-value patterns worth noting"],
  "recommended_workup": ["next investigations in priority order"],
  "management_pearls": ["immediate/short-term management points"],
  "patient_advice": ["plain-language guidance"]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { panel, values } = await req.json();
    if (!panel || !Array.isArray(values) || values.length === 0) {
      return jsonResponse({ error: "Provide panel and at least one value." }, 400);
    }
    const lines = values.map((v: any) =>
      `- ${v.name}: ${v.value} ${v.unit} (ref ${v.normalMin}–${v.normalMax} ${v.unit}, status: ${v.status})`
    ).join("\n");

    const result = await callGroq({
      jsonMode: true,
      messages: [
        { role: "system", content: `${SYSTEM}\n\n${SCHEMA}` },
        { role: "user", content: `Panel: ${panel}\nEntered values:\n${lines}` },
      ],
    });
    if (!result.ok) return jsonResponse({ error: result.error, detail: result.detail }, result.status);

    let parsed: unknown;
    try { parsed = JSON.parse(result.content || "{}"); } catch {
      return jsonResponse({ error: "AI returned malformed JSON.", raw: result.content }, 502);
    }
    return jsonResponse({ ok: true, panel, report: parsed });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
