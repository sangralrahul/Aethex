// Human Disease Ontology (CC0 1.0): definitions, synonyms, parents and codes for ~11,000 diseases.
// https://github.com/DiseaseOntology/HumanDiseaseOntology
import { existsSync, readFileSync } from "node:fs";
import { fetchText, log } from "../lib/util.mjs";

const DOID_OBO = "https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/main/src/ontology/doid.obo";

const unquote = (s) => {
  const m = /^"((?:[^"\\]|\\.)*)"/.exec(s);
  return m ? m[1].replace(/\\(.)/g, "$1") : "";
};

const CODE_LABELS = { ICD10CM: "ICD-10-CM", ICD9CM: "ICD-9-CM", MESH: "MeSH", UMLS_CUI: "UMLS", SNOMEDCT_US_2023_03_01: "SNOMED CT", NCI: "NCI Thesaurus", ORDO: "Orphanet", OMIM: "OMIM" };

/** Parse doid.obo text into library articles. */
export function parseDoidObo(text) {
  const stanzas = text.split(/\n(?=\[Term\])/).filter((s) => s.startsWith("[Term]"));
  const terms = new Map();
  for (const st of stanzas) {
    const t = { id: "", name: "", def: "", syn: [], parents: [], xrefs: [], obsolete: false };
    for (const line of st.split("\n")) {
      const i = line.indexOf(": ");
      if (i < 0) continue;
      const k = line.slice(0, i);
      const v = line.slice(i + 2);
      if (k === "id") t.id = v.trim();
      else if (k === "name") t.name = v.trim();
      else if (k === "def") t.def = unquote(v);
      else if (k === "synonym" && /\b(EXACT|RELATED)\b/.test(v)) t.syn.push(unquote(v));
      else if (k === "is_a") t.parents.push(v.replace(/^\S+\s*!\s*/, "").trim());
      else if (k === "xref") t.xrefs.push(v.trim());
      else if (k === "is_obsolete" && v.trim() === "true") t.obsolete = true;
    }
    if (t.id.startsWith("DOID:") && t.name && !t.obsolete) terms.set(t.id, t);
  }
  const docs = [];
  for (const t of terms.values()) {
    if (!t.def) continue;
    const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
    let def = t.def
      .replace(/has_material_basis_in/g, "caused by")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!/^(a|an|the)\b/i.test(def)) def = `${cap(t.name)} is ${def[0].toLowerCase()}${def.slice(1)}`;
    else def = `${cap(t.name)}: ${cap(def)}`;
    if (!/[.!?]$/.test(def)) def += ".";
    const sections = [{ h: "Overview", t: def }];
    if (t.parents.length) sections.push({ h: "Classification", t: `A type of ${t.parents.join(", ")}.` });
    const codes = t.xrefs
      .map((x) => {
        const [k, ...rest] = x.split(":");
        const label = CODE_LABELS[k] ?? (k.startsWith("SNOMEDCT") ? "SNOMED CT" : "");
        return label ? `${label} ${rest.join(":")}` : "";
      })
      .filter(Boolean);
    if (codes.length) sections.push({ h: "Codes", t: [...new Set(codes)].slice(0, 8).join("; ") });
    docs.push({
      source: "d",
      title: cap(t.name),
      url: `https://disease-ontology.org/?id=${t.id}`,
      aliases: [...new Set(t.syn)].slice(0, 25),
      priority: 5,
      sections,
    });
  }
  return docs;
}

export async function collectDiseaseOntology(ctx) {
  let text = "";
  if (ctx.doFile && existsSync(ctx.doFile)) text = readFileSync(ctx.doFile, "utf8");
  else {
    const r = await fetchText(DOID_OBO, { cacheDir: ctx.cacheDir, timeoutMs: 120_000 });
    if (r.status !== 200) throw new Error(`Disease Ontology download failed (HTTP ${r.status})`);
    text = r.text;
  }
  const docs = parseDoidObo(text);
  log(`Disease Ontology: ${docs.length} diseases with definitions`);
  return docs;
}
