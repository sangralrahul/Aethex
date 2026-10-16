// Cadus AI endpoint. Pass `action` in the JSON body.
//
//   chat / analyze-image  Draft an answer (Claude Haiku 5.5), optionally with live,
//                         cited sources from trusted medical sites.
//   review                Safety review of a draft: Claude Sonnet 5.5 for clinical
//                         answers, Claude Haiku 5.5 for study content. Returns the
//                         corrected final answer plus review metadata.
//   library-answer        Library mode (no Anthropic credits): the backup model writes
//                         an answer using only passages from the offline medical library.
//   generate-slides       Lecture deck JSON, fact-checked by a second pass.
//   deep-research         Legacy endpoint used by the classic page.
//   med-knowledge         Study Hub content.
import {
  callBackup,
  callGroq,
  CLAUDE_DRAFT_MODEL,
  CLAUDE_REVIEW_MODEL,
  cors,
  type Effort,
  jsonResponse,
  parseJsonLoose,
  type Source,
} from "../_shared/groq.ts";

/* ------------------------------------------------------------------ prompts */

const CORE_SYSTEM = `You are Cadus, the clinical AI assistant built by Aethex (aethex.in) for doctors, nurses, pharmacists and medical students in India.

# Standards for every answer
1. Accuracy first. Answer from current, mainstream evidence and guidelines: WHO; ICMR, MoHFW and the national programmes (NTEP, NVBDCP, NACO, NHM); NICE; AHA/ACC; ESC; IDSA; KDIGO; ADA; GINA; GOLD; the National Formulary of India and the BNF; and standard texts (Harrison's, Davidson's, the Oxford Handbooks). Prefer Indian guidance where it exists and say where Indian practice differs from Western guidance.
2. Never fabricate. Do not invent studies, trial names, guideline years, statistics, drug names, brand names, doses, URLs or references. If you are not certain, say so plainly and say what would resolve the uncertainty.
3. Medication safety. For every drug you recommend give the generic name, dose with units, route, frequency, duration and maximum dose; renal and hepatic adjustment; key contraindications, interactions and monitoring; and pregnancy, lactation and paediatric considerations when relevant. Paediatric doses must be weight-based (mg/kg) with the adult maximum stated. Re-check every number and unit before you answer. Mention Indian brand names only if you are certain they are correct.
4. Clinical reasoning. Put the most likely diagnosis and the can't-miss (dangerous) diagnoses first. Always state red flags and when to escalate, refer or call emergency services.
5. Calibrated confidence. Separate the standard of care from expert opinion and emerging evidence, and say how strong the evidence is.
6. Missing information. If details that change management are missing (age, weight, pregnancy, renal function, allergies, comorbidities), state the assumption you are making, or ask for them before giving a dose.
7. Scope and safety. You support qualified clinicians and students; you do not replace examination, investigations or local protocols. If the user seems to be a patient describing an emergency (chest pain, stroke signs, severe bleeding, breathing difficulty, suicidal thoughts), tell them first to get emergency care now (India: 112, or 108 for an ambulance).

# Format
- Begin with "**Bottom line:**" followed by the direct answer in one to three sentences.
- Then use short sections with "##" headings, bullet points and tables. Bold critical numbers and actions.
- Finish longer answers with "## Key points" (three to five bullets).
- Write like a senior consultant briefing a colleague: precise, structured, no filler, no moralising and no generic disclaimers (the app shows one).
- Use the units of Indian practice (for example glucose in mg/dL), adding SI units where helpful.`;

const MODE_PROMPTS: Record<string, string> = {
  general: "",
  ddx: `TASK: Differential diagnosis.
Use this structure:
**Bottom line:** the most likely diagnosis and the single most important next step.
## Case summary (one line with the key positives and negatives)
## Differential diagnosis: a table with columns Rank | Diagnosis | Supporting features | Against | Key test. List 4 to 6 diagnoses and mark dangerous ones "(can't miss)".
## Red flags
## Immediate next steps (investigations and initial management, in priority order)
## When to escalate or refer`,
  drugs: `TASK: Drug interaction check.
**Bottom line:** the overall risk and the main action.
## Interactions: a table with columns Drugs | Severity (Contraindicated / Major / Moderate / Minor) | Mechanism | Clinical effect | Management. Cover every clinically relevant pair and say explicitly when a pair has no significant interaction.
## Monitoring
## Safer alternatives (when any interaction is major or contraindicated)`,
  dosage: `TASK: Dose calculation.
**Bottom line:** the recommended dose with units, route and frequency.
## Calculation: show each step with units (weight, mg/kg, total dose, rounding to a practical dose, check against the maximum).
## Standard dosing: a table with columns Population or indication | Dose | Frequency | Maximum.
## Adjustments: renal (by eGFR or CrCl band), hepatic, elderly, pregnancy and lactation.
## Monitoring and safety checks: drug levels, allergies, key interactions.
If weight, age or renal function is needed and was not given, ask for it or state the assumption clearly before calculating.`,
  labs: `TASK: Laboratory interpretation.
**Bottom line:** the unifying interpretation.
## Results: a table with columns Test | Result | Reference range | Flag (Critical / High / Low / Normal) | Comment. Put critical values first and state that they need urgent action.
## Interpretation (the pattern and what it means)
## Likely causes (ranked)
## Next tests
Note that reference ranges vary between laboratories.`,
  procedure: `TASK: Procedure guide.
**Bottom line:** the purpose and the key safety point.
## Indications
## Contraindications (absolute and relative)
## Equipment
## Preparation and consent
## Technique (numbered steps)
## Complications and their management
## Aftercare and documentation`,
  soap: `TASK: SOAP note. Convert the input into a clean SOAP note with the sections Subjective, Objective, Assessment (with differentials) and Plan. Use only the information provided and write [not documented] where something important is missing. Skip the Bottom line and start directly with the note.`,
  discharge: `TASK: Discharge summary. Draft a structured discharge summary with the sections Diagnosis, Presenting complaint, Hospital course, Procedures, Key investigations, Condition at discharge, Discharge medications (a table with columns Drug | Dose | Frequency | Duration), Advice and follow-up, and Return immediately if (red-flag symptoms). Use only the information provided, write [to be completed] for anything missing, and never invent results or doses. Skip the Bottom line.`,
  patient: `TASK: Patient education. Write for a patient or family member at about a 12-year-old reading level: warm, clear and free of jargon (explain any medical word you must use). Sections: What it is, Why it happens, What you can do, Medicines (general guidance only, no doses unless asked), When to see a doctor urgently. Start with "**Bottom line:**" in plain words.`,
  research: `TASK: Evidence review.
**Bottom line:** the practical answer for clinicians.
## Background
## Key evidence (landmark trials and meta-analyses; name only studies you are sure exist, with year and main finding)
## Guideline recommendations (issuing body and year)
## Indian context
## Uncertainties and ongoing research
## Key points`,
  mcq: `TASK: Exam practice (NEET-PG, INI-CET and USMLE style). Write five high-quality single-best-answer MCQs on the topic. For each: a clinical vignette stem, options A to D, then "**Answer:**" with a two-to-three-line explanation that includes why the strongest distractor is wrong. Separate questions with a horizontal rule. Make sure every question has exactly one unambiguously correct answer, and spread the answers across A to D. Skip the Bottom line.`,
};

const IMAGE_TASK = `TASK: Clinical image interpretation.
**Bottom line:** the most likely impression.
## Image (type, view or technique, and quality: adequacy, rotation, exposure, artefacts)
## Systematic review (use the standard approach for the image type; chest X-ray: airway, breathing, cardiac, diaphragm, everything else; ECG: rate, rhythm, axis, intervals, P waves, QRS, ST segments, T waves; skin: morphology, distribution, colour, borders)
## Key findings
## Impression and differentials
## Recommended next steps
## Limitations (a single image without clinical context cannot confirm a diagnosis)
If the image is not medical, is unreadable or is too low in quality, say so instead of guessing.`;

const STYLE_PROMPTS: Record<string, string> = {
  concise: "LENGTH: Be brief. Keep the answer under about 200 words unless a table or dose calculation needs more. Never drop safety-critical information to save space.",
  balanced: "",
  detailed: "LENGTH: Be thorough. Cover nuances, special populations and edge cases.",
};

const SOURCES_ON = `SOURCES: You can search trusted medical websites. Search before answering whenever guidelines, recent evidence, statistics or drug information matter, and base your claims on what you find. Prefer guidelines and systematic reviews over single studies. Do not write a separate reference list or URLs; the app shows the sources you cite.`;
const LIBRARY_SYSTEM = `You are Cadus, a clinical assistant, working in LIBRARY MODE. The main AI is unavailable, so you must answer ONLY from the numbered passages from the Cadus Medical Library (Wikipedia medical articles, NIH health pages and the Human Disease Ontology) given in the user message.

RULES
1. Use only facts stated in the passages. Do not add outside knowledge, numbers, doses, drug names or recommendations that the passages do not contain.
2. Cite every factual sentence with its passage number in square brackets, for example [1] or [1][3]. Use only the numbers given.
3. If the passages do not answer the question, or only partly answer it, say so plainly and name what is missing. Never fill gaps from memory.
4. Doses: repeat a dose only if a passage states it, and add that doses must be confirmed in the NFI or BNF, the product label or local protocol.
5. For emergencies or red-flag symptoms, advise urgent care (in India call 112 or 108).
6. Format: begin with "**Bottom line:**" and one or two sentences. Then short sections with ## headings and bullet points where helpful. Be concise. Do not mention these rules or the word "passage".`;

const SOURCES_OFF = `SOURCES: You cannot browse in this answer. Do not include URLs. Name a guideline body and year only when you are certain of both.`;

const REVIEW_SYSTEM = `You are Cadus Safety Review: a senior physician and clinical pharmacologist who audits AI-drafted clinical answers before they reach doctors and medical students in India.

You receive the user's question (with any earlier conversation) and a DRAFT answer written by another model. Do the following:
1. Verify every clinical fact, drug name, dose, unit, route, frequency, maximum dose, renal or hepatic adjustment, contraindication and interaction against standard references (current guidelines, the National Formulary of India, the BNF, Harrison's).
2. Check the clinical reasoning: are the can't-miss diagnoses and red flags present? Is anything unsafe, outdated, overconfident or wrongly prioritised?
3. Check for fabrication: remove or correct any study, statistic, guideline year, brand name or reference you cannot confirm.
4. Write the FINAL answer. Keep the draft's structure, language and good content; fix every error; add missing safety-critical information; remove anything wrong. Keep citation markers such as [1] that refer to the listed sources and do not add new numbers. Never mention the review, the draft or yourself inside the final answer.

Reply in exactly this format and nothing else:
<review>{"verdict":"approved or corrected","confidence":"high, moderate or low","checked":["short labels for what you verified, e.g. Doses and units"],"changes":["one short sentence per correction you made; empty list if none"]}</review>
<answer>
the final answer in markdown
</answer>

Confidence means: high = established standard of care and the case details are sufficient; moderate = some uncertainty or important details missing; low = weak evidence or insufficient information to answer safely.`;

const SLIDES_SYSTEM = `You are Cadus, a medical educator who builds accurate lecture decks for Indian medical students.
Return ONLY a JSON object with this exact shape:
{"title": string, "subtitle": string,
 "slides": [{"n": number, "type": "title"|"content"|"stats"|"cards"|"split"|"summary", "t": string, "sub": string,
   "bullets": string[], "ki": string,
   "stats": [{"value": string, "label": string, "desc": string}],
   "cards": [{"heading": string, "body": string}],
   "leftHeading": string, "leftBody": string, "rightPoints": string[]}],
 "faq": [{"question": string, "answer": string}],
 "redflags": string[]}
Make 8 to 10 slides. Slide 1 has type "title" and the last slide has type "summary". Use "stats" for epidemiology, "cards" for classifications and "split" for comparisons. bullets: 3 to 5 short points each. "ki" is a one-line key insight.
Omit fields that do not apply. Be medically accurate and current; follow Indian guidance where relevant; never invent statistics (if unsure, omit the number).`;

const SLIDES_REVIEW_SYSTEM = `You are Cadus Safety Review auditing a medical lecture deck (JSON) before students use it.
Check every fact, number, drug dose and classification. Correct errors, remove statistics you cannot confirm, and keep the exact same JSON schema and slide count.
Reply in exactly this format:
<review>{"verdict":"approved or corrected","confidence":"high, moderate or low","checked":["short labels"],"changes":["one short sentence per correction; empty if none"]}</review>
<deck>
the corrected deck as valid JSON
</deck>`;

const DEEP_RESEARCH_SYSTEM = `${CORE_SYSTEM}\n\n${MODE_PROMPTS.research}\n\n${SOURCES_ON}`;

const MED_KNOWLEDGE_SYSTEMS: Record<string, string> = {
  overview:
    "You are a medical educator. Write a comprehensive, accurate overview of the given topic for medical students. Use clear headings, bullet points and clinical examples. Never invent statistics or references. Return well-formatted markdown.",
  key_concepts:
    "You are a medical educator. List the essential high-yield facts, definitions, classifications and mnemonics for the given topic as a bulleted markdown list. Be accurate; never invent facts.",
  clinical_relevance:
    "You are a clinician-educator. Explain the clinical relevance and applied aspects of the given topic: presentations, complications, treatment relevance and exam-focused pearls. Return markdown.",
  mcq:
    "You are a NEET-PG / USMLE question writer. Generate the requested number of high-yield MCQs on the topic, each with exactly one unambiguously correct answer. Return ONLY a valid JSON array (no prose, no code fences) of objects with keys: question (string), options (array of 4 strings), correctIndex (number 0-3), explanation (string).",
  flashcards:
    "You are a medical flashcard author. Generate 10 accurate, high-yield revision flashcards on the topic. Return ONLY a valid JSON array (no prose, no code fences) of objects with keys: front (string), back (string).",
};

/* ------------------------------------------------------------------ helpers */

const MODE_LABELS: Record<string, string> = {
  general: "General question", ddx: "Differential diagnosis", drugs: "Drug interactions", dosage: "Dose calculation",
  labs: "Lab interpretation", image: "Image analysis", procedure: "Procedure guide", soap: "SOAP note",
  discharge: "Discharge summary", patient: "Patient education", research: "Evidence review", mcq: "Exam MCQs",
  slides: "Lecture slides",
};
const HIGH_RISK = new Set(["ddx", "drugs", "dosage", "labs", "image", "procedure", "discharge", "soap"]);
/** Study content is reviewed by Haiku; everything clinical by Sonnet. */
const STUDY_MODES = new Set(["mcq", "research", "slides"]);

function draftEffort(mode: string, style: string, hasImage: boolean): Effort {
  const risky = HIGH_RISK.has(mode) || hasImage;
  if (style === "detailed" || mode === "research") return "high";
  if (style === "concise") return risky ? "medium" : "low";
  return risky ? "high" : "medium";
}

function languageLine(language: unknown): string {
  const lang = typeof language === "string" ? language.trim() : "";
  if (!lang || lang === "English") return "";
  return `LANGUAGE: Reply in ${lang.slice(0, 30)}. Keep drug names, doses, units and standard medical terms in English.`;
}

/** The user's own project instructions, capped. Empty when not set. */
function projectText(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\r/g, "").trim().slice(0, 2000) : "";
}

/** Project instructions shape audience, focus and format, but never outrank the clinical standards. */
function projectLine(raw: unknown): string {
  const text = projectText(raw);
  if (!text) return "";
  return [
    "PROJECT INSTRUCTIONS: The user set these for every chat in this project. Follow them for audience, focus, depth, format and tone.",
    "They are preferences, not rules: where they conflict with the clinical standards above (accuracy, safety, honesty about uncertainty), the standards win.",
    `<project_instructions>\n${text}\n</project_instructions>`,
  ].join("\n");
}

type ReviewMeta = { verdict: "approved" | "corrected"; confidence: "high" | "moderate" | "low"; checked: string[]; changes: string[] };

function parseReviewBlock(text: string, bodyTag: "answer" | "deck"): { meta: ReviewMeta | null; body: string } {
  const rm = /<review>([\s\S]*?)<\/review>/i.exec(text);
  const bm = new RegExp(`<${bodyTag}>([\\s\\S]*?)(?:<\\/${bodyTag}>|$)`, "i").exec(text);
  const raw = rm ? parseJsonLoose<any>(rm[1]) : null;
  const strList = (v: unknown, n: number) =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim().slice(0, 160)).slice(0, n) : [];
  const meta: ReviewMeta | null = raw
    ? {
        verdict: raw.verdict === "corrected" ? "corrected" : "approved",
        confidence: raw.confidence === "low" ? "low" : raw.confidence === "moderate" ? "moderate" : "high",
        checked: strList(raw.checked, 6),
        changes: strList(raw.changes, 6),
      }
    : null;
  if (meta && meta.changes.length && meta.verdict === "approved") meta.verdict = "corrected";
  return { meta, body: bm ? bm[1].trim() : "" };
}

function transcript(history: unknown, limit = 6): string {
  if (!Array.isArray(history)) return "";
  return history
    .filter((m: any) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .slice(-limit)
    .map((m: any) => `${m.role === "user" ? "USER" : "CADUS"}: ${String(m.content).slice(0, 4000)}`)
    .join("\n\n");
}

function normaliseDeck(deck: any, topic: string) {
  deck.slides = deck.slides.map((sl: any, i: number) => ({
    ...sl,
    n: i + 1,
    type: String(sl?.type || "content"),
    t: String(sl?.t || sl?.title || `Slide ${i + 1}`),
    bullets: Array.isArray(sl?.bullets) ? sl.bullets.map(String) : [],
  }));
  deck.title = String(deck.title || topic);
  deck.subtitle = String(deck.subtitle || "Cadus AI lecture deck");
  return deck;
}

/* ------------------------------------------------------------------ handler */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const action = String(body.action || "chat");

    // ---------------------------------------------------------------- draft
    if (action === "chat" || action === "analyze-image") {
      const message = String(body.message || "").trim();
      const history = Array.isArray(body.history) ? body.history : [];
      const image = typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : "";
      if (!message && !image) return jsonResponse({ error: "message is required" }, 400);
      const mode = MODE_LABELS[String(body.mode)] ? String(body.mode) : "general";
      const style = String(body.style || "balanced");
      const search = mode === "research" || body.search === true;
      const system = [
        CORE_SYSTEM,
        image ? IMAGE_TASK : MODE_PROMPTS[mode] ?? "",
        STYLE_PROMPTS[style] ?? "",
        search ? SOURCES_ON : SOURCES_OFF,
        projectLine(body.instructions),
        languageLine(body.language),
      ].filter(Boolean).join("\n\n");
      const messages: any[] = [{ role: "system", content: system }];
      for (const m of history.slice(-20)) {
        if (m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")) {
          messages.push({ role: m.role, content: m.content.slice(0, 12000) });
        }
      }
      messages.push(
        image
          ? { role: "user", content: [{ type: "image_url", image_url: { url: image } }, { type: "text", text: message || "Please analyse this image." }] }
          : { role: "user", content: message },
      );
      // When Claude has no credits, the Cadus workspace (which sends library: true) switches
      // to the offline medical library. Images (which the library can't read), explicit
      // fallbacks and the other pages on the site keep using the backup model.
      const libraryAware = body.library === true && !image && body.allowFallback !== true;
      const r = await callGroq({
        model: CLAUDE_DRAFT_MODEL,
        messages,
        effort: draftEffort(mode, style, !!image),
        maxTokens: 16000,
        webSearch: search ? { maxUses: mode === "research" ? 5 : 3 } : undefined,
        onOutage: libraryAware ? "report" : "fallback",
      });
      if (!r.ok && r.outage && libraryAware) return jsonResponse({ libraryMode: true, reason: r.outage });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      return jsonResponse({
        message: r.content,
        provider: r.provider,
        model: r.model,
        sources: r.sources ?? [],
        queries: r.queries ?? [],
        searched: search,
      });
    }

    // ---------------------------------------------------------------- review
    if (action === "review") {
      const question = String(body.question || "").trim().slice(0, 12000);
      const draft = String(body.draft || "").trim().slice(0, 40000);
      if (!question || !draft) return jsonResponse({ error: "question and draft are required" }, 400);
      const mode = MODE_LABELS[String(body.mode)] ? String(body.mode) : "general";
      const image = typeof body.image === "string" && body.image.startsWith("data:image/") ? body.image : "";
      const sources: Source[] = Array.isArray(body.sources)
        ? body.sources.filter((s: any) => s && typeof s.url === "string").slice(0, 20)
        : [];
      const reviewModel = STUDY_MODES.has(mode) ? CLAUDE_DRAFT_MODEL : CLAUDE_REVIEW_MODEL;
      const context = transcript(body.history);
      const instructions = projectText(body.instructions);
      const userText = [
        context ? `EARLIER CONVERSATION:\n${context}` : "",
        `TOOL: ${MODE_LABELS[mode]}`,
        instructions
          ? `PROJECT INSTRUCTIONS THE DRAFT FOLLOWS (user preferences for audience and format; keep the answer consistent with them unless safety requires otherwise):\n${instructions}`
          : "",
        `USER QUESTION:\n${question}`,
        sources.length
          ? `SOURCES CITED IN THE DRAFT (keep these [n] markers; do not add new numbers):\n${sources.map((s) => `[${s.n}] ${s.title} (${s.url})`).join("\n")}`
          : "",
        `DRAFT ANSWER:\n${draft}`,
      ].filter(Boolean).join("\n\n");
      const r = await callGroq({
        model: reviewModel,
        messages: [
          { role: "system", content: [REVIEW_SYSTEM, languageLine(body.language)].filter(Boolean).join("\n\n") },
          image
            ? { role: "user", content: [{ type: "image_url", image_url: { url: image } }, { type: "text", text: userText }] }
            : { role: "user", content: userText },
        ],
        effort: mode === "dosage" || mode === "drugs" ? "high" : "medium",
        maxTokens: 16000,
      });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      const { meta, body: finalAnswer } = parseReviewBlock(r.content, "answer");
      if (!finalAnswer) return jsonResponse({ error: "The safety review returned no answer." }, 502);
      return jsonResponse({
        message: finalAnswer,
        review: meta ? { ...meta, model: r.model, provider: r.provider } : { verdict: "approved", confidence: "moderate", checked: [], changes: [], model: r.model, provider: r.provider },
        provider: r.provider,
      });
    }

    // ---------------------------------------------------------------- library mode
    if (action === "library-answer") {
      const question = String(body.question || "").trim().slice(0, 4000);
      const passages = (Array.isArray(body.passages) ? body.passages : [])
        .filter((p: any) => p && typeof p.text === "string" && p.text.trim())
        .slice(0, 12)
        .map((p: any) => ({
          n: Math.max(1, Math.min(99, Math.round(Number(p.n)) || 1)),
          title: String(p.title || "").slice(0, 200),
          heading: String(p.heading || "").slice(0, 160),
          text: String(p.text).slice(0, 1800),
        }));
      if (!question || !passages.length) return jsonResponse({ error: "question and passages are required" }, 400);
      const mode = MODE_LABELS[String(body.mode)] ? String(body.mode) : "general";
      const system = [
        LIBRARY_SYSTEM,
        `TOOL: ${MODE_LABELS[mode]}`,
        STYLE_PROMPTS[String(body.style || "balanced")] ?? "",
        projectLine(body.instructions),
        languageLine(body.language),
      ].filter(Boolean).join("\n\n");
      const context = transcript(body.history, 4);
      const user = [
        context ? `EARLIER CONVERSATION:\n${context}` : "",
        `QUESTION:\n${question}`,
        `LIBRARY PASSAGES:\n${passages.map((p: any) => `[${p.n}] ${p.title} | ${p.heading}\n${p.text}`).join("\n\n")}`,
      ].filter(Boolean).join("\n\n");
      const r = await callBackup({
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        maxTokens: 2500,
        temperature: 0.2,
      });
      if (!r.ok) return jsonResponse({ error: r.error, code: "backup_unavailable" }, r.status);
      return jsonResponse({ message: r.content, provider: r.provider, model: r.model });
    }

    // ---------------------------------------------------------------- slides
    if (action === "generate-slides") {
      const topic = String(body.topic || body.message || "").trim();
      if (!topic) return jsonResponse({ error: "topic is required" }, 400);
      const r = await callGroq({
        model: CLAUDE_DRAFT_MODEL,
        messages: [
          { role: "system", content: SLIDES_SYSTEM },
          {
            role: "user",
            content: projectText(body.instructions)
              ? `Create a lecture deck on: ${topic}\n\nProject instructions from the user (audience, focus and style; accuracy always comes first):\n${projectText(body.instructions)}`
              : `Create a lecture deck on: ${topic}`,
          },
        ],
        jsonMode: true,
        effort: "high",
        maxTokens: 16000,
      });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      const draftDeck = parseJsonLoose<any>(r.content);
      if (!draftDeck || !Array.isArray(draftDeck.slides)) {
        return jsonResponse({ error: "Could not build slides, please try again." }, 502);
      }
      let deck = draftDeck;
      let review: Record<string, unknown> | null = null;
      if (body.review !== false) {
        const rv = await callGroq({
          model: CLAUDE_DRAFT_MODEL,
          messages: [
            { role: "system", content: SLIDES_REVIEW_SYSTEM },
            { role: "user", content: `TOPIC: ${topic}\n\nDECK:\n${JSON.stringify(draftDeck)}` },
          ],
          effort: "medium",
          maxTokens: 16000,
        });
        if (rv.ok) {
          const parsed = parseReviewBlock(rv.content, "deck");
          const fixed = parsed.body ? parseJsonLoose<any>(parsed.body) : null;
          if (fixed && Array.isArray(fixed.slides) && fixed.slides.length) {
            deck = fixed;
            review = parsed.meta ? { ...parsed.meta, model: rv.model, provider: rv.provider } : null;
          }
        }
      }
      return jsonResponse({ presentation: normaliseDeck(deck, topic), review, provider: r.provider, model: r.model });
    }

    // ---------------------------------------------------------------- legacy deep research (classic page)
    if (action === "deep-research") {
      const query = String(body.query || "").trim();
      if (!query) return jsonResponse({ error: "query is required" }, 400);
      const r = await callGroq({
        model: CLAUDE_DRAFT_MODEL,
        messages: [
          { role: "system", content: DEEP_RESEARCH_SYSTEM },
          { role: "user", content: `Topic: ${query}` },
        ],
        effort: "high",
        maxTokens: 16000,
        webSearch: { maxUses: 5 },
      });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      return jsonResponse({
        report: r.content,
        sources: (r.sources ?? []).map((s) => ({ title: s.title, url: s.url })),
        searchQueries: r.queries ?? [query],
        hasGoogleSearch: !!r.sources?.length,
      });
    }

    // ---------------------------------------------------------------- Study Hub
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
      const r = await callGroq({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        effort: "medium",
        maxTokens: 12000,
      });
      if (!r.ok) return jsonResponse({ error: r.error, detail: r.detail }, r.status);
      return jsonResponse({ content: r.content });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
