// NIH health information from MedQuAD (Ben Abacha & Demner-Fushman, 2019; CC BY 4.0).
// https://github.com/abachaa/MedQuAD — answers come from 9 NIH/CDC websites. The three
// MedlinePlus subsets whose answers were removed for copyright reasons are skipped.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { decodeEntities, fetchText, log, pool, tidy } from "../lib/util.mjs";

const RAW = "https://raw.githubusercontent.com/abachaa/MedQuAD/master";

const COLLECTIONS = [
  { dir: "1_CancerGov_QA", label: "Cancer.gov (NCI PDQ)", parts: true, maxMiss: 40 },
  { dir: "2_GARD_QA", label: "NIH Genetic and Rare Diseases Information Center", maxMiss: 400 },
  { dir: "3_GHR_QA", label: "NIH Genetics Home Reference", maxMiss: 80 },
  { dir: "4_MPlus_Health_Topics_QA", label: "MedlinePlus Health Topics (NIH)", maxMiss: 80 },
  { dir: "5_NIDDK_QA", label: "NIDDK (NIH)", maxMiss: 60 },
  { dir: "6_NINDS_QA", label: "NINDS (NIH)", maxMiss: 60 },
  { dir: "7_SeniorHealth_QA", label: "NIHSeniorHealth", maxMiss: 60 },
  { dir: "8_NHLBI_QA_XML", label: "NHLBI (NIH)", maxMiss: 60 },
  { dir: "9_CDC_QA", label: "CDC", maxMiss: 60 },
];

const QTYPE_HEADINGS = {
  information: "Overview",
  symptoms: "Symptoms",
  causes: "Causes",
  treatment: "Treatment",
  "exams and tests": "Diagnosis",
  "how can i learn more": "",
  "support groups": "",
  outlook: "Outlook",
  prevention: "Prevention",
  susceptibility: "Who is at risk",
  frequency: "How common it is",
  "genetic changes": "Genetic changes",
  inheritance: "Inheritance",
  stages: "Stages",
  complications: "Complications",
  research: "Research",
  considerations: "Considerations",
  "when to contact a medical professional": "When to see a doctor",
};

const pick = (xml, tag) => {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? decodeEntities(m[1]).trim() : "";
};

function cleanAnswer(a) {
  return tidy(
    decodeEntities(a)
      .replace(/\s{2,}-\s+/g, "\n- ")
      .replace(/^Key Points\s*\n/i, "Key points:\n")
      .replace(/\s{3,}/g, "\n"),
  );
}

/** Parse one MedQuAD XML document into a library article (or null). */
export function parseMedquadXml(xml, label) {
  const doc = /<Document\b([^>]*)>/.exec(xml);
  if (!doc) return null;
  const url = (/url="([^"]*)"/.exec(doc[1]) ?? [])[1] ?? "";
  const focus = pick(xml, "Focus");
  if (!focus) return null;
  const synonyms = [...xml.matchAll(/<Synonym>([\s\S]*?)<\/Synonym>/g)].map((m) => decodeEntities(m[1]).trim()).filter(Boolean);
  const sections = [];
  const seen = new Set();
  for (const m of xml.matchAll(/<QAPair\b[\s\S]*?<\/QAPair>/g)) {
    const qa = m[0];
    const q = /<Question\b([^>]*)>([\s\S]*?)<\/Question>/.exec(qa);
    const answer = cleanAnswer(pick(qa, "Answer"));
    if (!q || !answer || answer.length < 20) continue;
    const qtype = ((/qtype="([^"]*)"/.exec(q[1]) ?? [])[1] ?? "").toLowerCase();
    let h = QTYPE_HEADINGS[qtype];
    if (h === "") continue;
    if (!h) h = decodeEntities(q[2]).replace(/\s*\?$/, "").replace(/\(are\)\s*/g, "").trim();
    const key = answer.slice(0, 200);
    if (seen.has(key)) continue;
    seen.add(key);
    sections.push({ h, t: answer });
  }
  if (!sections.length) return null;
  return { source: "m", title: focus, url, aliases: synonyms, priority: 2.5, sections, label };
}

function* walkXml(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walkXml(p);
    else if (name.endsWith(".xml")) yield p;
  }
}

async function probeCollection(col, ctx) {
  const found = [];
  const get = async (file) => {
    const r = await fetchText(`${RAW}/${col.dir}/${file}`, { cacheDir: ctx.cacheDir, retries: 4 });
    return r.status === 200 ? r.text : null;
  };
  let id = 1;
  let misses = 0;
  const step = 16;
  while (misses < col.maxMiss) {
    const ids = Array.from({ length: step }, (_, i) => id + i);
    const results = await pool(ids, 8, async (n) => {
      const base = String(n).padStart(7, "0");
      if (!col.parts) return [await get(`${base}.xml`)].filter(Boolean);
      const parts = [];
      for (let p = 1; p < 40; p++) {
        const x = await get(`${base}_${p}.xml`);
        if (!x) break;
        parts.push(x);
      }
      return parts;
    });
    for (const r of results) {
      if (r.length) {
        found.push(...r);
        misses = 0;
      } else misses++;
    }
    id += step;
  }
  return found;
}

/** Collect MedQuAD articles from a local clone (--medquad-dir) or straight from GitHub. */
export async function collectMedquad(ctx) {
  const byKey = new Map();
  for (const col of COLLECTIONS) {
    let xmls = [];
    const local = ctx.medquadDir ? join(ctx.medquadDir, col.dir) : "";
    if (local && existsSync(local)) xmls = [...walkXml(local)].map((p) => readFileSync(p, "utf8"));
    else xmls = await probeCollection(col, ctx);
    let n = 0;
    for (const xml of xmls) {
      const d = parseMedquadXml(xml, col.label);
      if (!d) continue;
      // Merge documents about the same topic from the same website (e.g. NCI patient and HP versions).
      const key = `${col.dir}|${d.title.toLowerCase()}`;
      const prev = byKey.get(key);
      if (prev) {
        const seen = new Set(prev.sections.map((s) => s.t.slice(0, 200)));
        for (const s of d.sections) if (!seen.has(s.t.slice(0, 200))) prev.sections.push(s);
        prev.aliases = [...new Set([...prev.aliases, ...d.aliases])];
      } else {
        byKey.set(key, d);
        n++;
      }
    }
    log(`MedQuAD ${col.dir}: ${xmls.length} files, ${n} topics`);
  }
  return [...byKey.values()].map((d) => ({ ...d, title: d.title, aliases: d.aliases.slice(0, 25), sourceLabel: d.label }));
}
