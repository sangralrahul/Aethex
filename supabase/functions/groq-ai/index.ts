// Unified Groq-powered endpoint for Cadus AI chat, deep-research, and
// Knowledge Hub content generation. Pass `action` in the body.
import { callGroq, cors, jsonResponse } from "../_shared/groq.ts";

const CADUS_SYSTEM = `You are Cadus, Aethex's clinical AI assistant for medical students, doctors,
and healthcare professionals in India. Give evidence-based, concise, structured answers.
Use markdown with headings, bullet points, and tables where helpful.
Cite guidelines (NICE, AIIMS, ICMR, WHO, Harrison's, Oxford) when relevant.
Never invent drug names or dosages. Always add a brief decision-support disclaimer for clinical topics.`;

const DEEP_RESEARCH_SYSTEM = `You are a medical research analyst. Produce a comprehensive deep-research
report on the given topic for a clinician/medical student audience in India. Structure the report in
markdown with these sections:
# Executive Summary
## Background & Epidemiology
## Pathophysiology / Mechanism
## Clinical Features / Diagnosis
## Investigations
## Management (Indian & global guidelines)
## Recent Advances (last 3 years)
## Controversies & Open Questions
## Key Takeaways
Be precise, evidence-based, and cite guideline sources inline.`;

const MED_KNOWLEDGE_SYSTEMS: Record<string, string> = {
  overview:
    "You are a medical educator. Write a comprehensive, encyclopedic overview of the given topic for medical students. Use clear headings, bullet points, and clinical examples. Return well-formatted markdown.",
  key_concepts:
    "You are a medical educator. List the essential high-yield facts, definitions, classifications, and mnemonics for the given topic as a bulleted markdown list.",
  clinical_relevance:
    "You are a clinician-educator. Explain the clinical relevance and applied aspects of the given topic: presentations, complications, treatment relevance, and exam-focused pearls. Return markdown.",
  mcq:
    "You are a NEET-PG / USMLE question writer. Generate the requested number of high-yield MCQs on the topic. Return ONLY a valid JSON array (no prose, no code fences) of objects with keys: question (string), options (array of 4 strings), correctIndex (number 0-3), explanation (string).",
  flashcards:
    "You are a medical flashcard author. Generate 10 high-yield revision flashcards on the topic. Return ONLY a valid JSON array (no prose, no code fences) of objects with keys: front (string, the question/prompt), back (string, the answer/detail).",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const action = String(body.action || "chat");

    if (action === "chat") {
      const message = String(body.message || "").trim();
      const history = Array.isArray(body.history) ? body.history : [];
      if (!message) return jsonResponse({ error: "message is required" }, 400);
      const messages: any[] = [{ role: "system", content: CADUS_SYSTEM }];
      for (const m of history.slice(-20)) {
        if (m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")) {
          messages.push({ role: m.role, content: m.content });
        }
      }
      messages.push({ role: "user", content: message });
      const r = await callGroq({ messages, temperature: 0.5, maxTokens: 2000 });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      return jsonResponse({ message: r.content });
    }

    if (action === "deep-research") {
      const query = String(body.query || "").trim();
      if (!query) return jsonResponse({ error: "query is required" }, 400);
      const r = await callGroq({
        messages: [
          { role: "system", content: DEEP_RESEARCH_SYSTEM },
          { role: "user", content: `Topic: ${query}` },
        ],
        temperature: 0.4,
        maxTokens: 4000,
      });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      return jsonResponse({
        report: r.content,
        sources: [],
        searchQueries: [query],
        hasGoogleSearch: false,
      });
    }

    if (action === "med-knowledge") {
      const section = String(body.section || "overview");
      const topic = String(body.topic || "").trim();
      const subject = String(body.subject || "").trim();
      const mcqCount = Number(body.mcqCount || 8);
      if (!topic) return jsonResponse({ error: "topic is required" }, 400);
      const system = MED_KNOWLEDGE_SYSTEMS[section] ?? MED_KNOWLEDGE_SYSTEMS.overview;
      const prompt = section === "mcq"
        ? `Topic: ${topic}\nSubject: ${subject}\nGenerate exactly ${mcqCount} MCQs.`
        : `Topic: ${topic}\nSubject: ${subject}`;
      const isJsonSection = section === "mcq" || section === "flashcards";
      const r = await callGroq({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: isJsonSection ? 0.5 : 0.6,
        maxTokens: 4000,
      });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      return jsonResponse({ content: r.content });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
