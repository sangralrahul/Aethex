// AI-powered drug interaction analysis via Groq.
import { callGroq, cors, jsonResponse } from "../_shared/groq.ts";

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
    { "drug1": "string", "drug2": "string",
      "severity": "major" | "moderate" | "minor" | "none",
      "mechanism": "brief pharmacologic mechanism",
      "clinical_effect": "what may happen to the patient",
      "management": "concrete steps: monitor X, adjust dose, avoid, separate by N hrs, etc.",
      "onset": "rapid | delayed | unknown" }
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
      return jsonResponse({ error: "Provide 2 to 5 drug names." }, 400);
    }
    const cleaned = drugs.map((d: unknown) => String(d).trim()).filter(Boolean).slice(0, 5);

    const result = await callGroq({
      jsonMode: true,
      messages: [
        { role: "system", content: `${SYSTEM}\n\n${SCHEMA_INSTRUCTION}` },
        { role: "user", content: `Analyze interactions for: ${cleaned.join(", ")}` },
      ],
    });
    if (!result.ok) return jsonResponse({ error: result.error, detail: result.detail }, result.status);

    let parsed: unknown;
    try { parsed = JSON.parse(result.content || "{}"); } catch {
      return jsonResponse({ error: "AI returned malformed JSON.", raw: result.content }, 502);
    }
    return jsonResponse({ ok: true, drugs: cleaned, report: parsed });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
