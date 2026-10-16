// Offline tests for the library builder: the Wikipedia client runs against a mocked API.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { buildLibrary } from "../lib/indexer.mjs";
import { chunkText, tidy } from "../lib/util.mjs";
import { parseDoidObo } from "../sources/disease-ontology.mjs";
import { parseMedquadXml } from "../sources/medquad.mjs";
import { collectWikipedia, wikiArticle } from "../sources/wikipedia.mjs";
import { hashTerm, queryTerms, termShardFile, tokens } from "../../../artifacts/aethex/src/lib/medlib/text.ts";

let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} ${m}`); if (!c) fails++; };

// ------------------------------------------------------------ tokenizer
ok(JSON.stringify(tokens("Anaemia and oedema in paediatric haemophilia")) === JSON.stringify(["anemia", "edema", "pediatric", "hemophilia"]), "British spellings normalise to American");
ok(JSON.stringify(tokens("Therapies, symptoms, rashes and bleeding")) === JSON.stringify(["therapy", "symptom", "rash", "bleed"]), "light stemming of plurals and -ing");
ok(tokens("HbA1c, COVID-19 and vitamin B12").join(" ") === "hba1c covid 19 vitamin b12", "keeps lab and drug codes");
ok(queryTerms("Please explain the treatment of asthma").join(" ") === "treatment asthma", "query filler removed");
ok(hashTerm("asthma") === hashTerm("asthma") && hashTerm("asthma") < 256, "stable term hash");

// ------------------------------------------------------------ wikitext conversion
const ASTHMA = `{{Short description|Lung disease}}
{{Infobox medical condition (new)
| name = Asthma
| symptoms = Recurring [[wheezing]], cough, chest tightness<ref>x</ref>
| treatment = Avoiding triggers, [[inhaled corticosteroid]]s
| frequency = 262 million (2019)
}}
'''Asthma''' is a long-term inflammatory disease of the airways of the lungs.<ref name=a>Ref</ref> Symptoms come and go and are often triggered by allergens or exercise.

==Signs and symptoms==
Asthma causes recurrent episodes of wheezing and shortness of breath.
* Night-time cough
* Chest tightness

==Management==
===Medications===
Short-acting beta agonists such as [[salbutamol]] relieve symptoms quickly.
{| class=wikitable
! Severity !! Treatment
|-
| Mild || SABA as needed
|}

==Society and culture==
Asthma costs a lot of money.
==See also==
* [[COPD]]
==References==
{{reflist}}`;
const d = wikiArticle("Asthma", ASTHMA, { rank: 0.85, aliases: ["Bronchial asthma"] });
ok(d && d.sections[0].h === "Overview" && d.sections[0].t.startsWith("Asthma is a long-term"), "lead becomes Overview");
ok(d.sections[1].h === "Summary" && /Symptoms: Recurring wheezing, cough, chest tightness/.test(d.sections[1].t) && /Treatment: Avoiding triggers/.test(d.sections[1].t), "medical infobox becomes a Summary section");
ok(d.sections.some((s) => s.h === "Signs and symptoms" && /Night-time cough/.test(s.t)), "lists kept in sections");
ok(d.sections.some((s) => s.h === "Management: Medications" && /salbutamol/.test(s.t) && /Severity: Mild; Treatment: SABA as needed/.test(s.t)), "subsections named with their parent; tables flattened");
ok(!d.sections.some((s) => /Society|See also|References/.test(s.h)), "references, see also and society sections skipped");
ok(!/<ref|\{\{|\[\[/.test(JSON.stringify(d.sections)), "no wiki markup left");
ok(wikiArticle("Asthma (disambiguation)", "'''Asthma''' may refer to:\n* [[Asthma]]\n* [[Cardiac asthma]]\n{{disambiguation}}") === null, "disambiguation pages skipped");
const person = wikiArticle("Jane Doe", `{{Infobox scientist|name=Jane Doe}}\n'''Jane Doe''' was a physician who studied asthma in children and wrote many papers about it.\n==Early life==\nShe was born in a small town and studied medicine at a university in the city.`, { rank: 3 });
ok(person && person.sections.length === 1, "biographies keep only the lead");

// ------------------------------------------------------------ other sources
const mq = parseMedquadXml(`<?xml version="1.0"?><Document id="1" source="GHR" url="https://ghr.nlm.nih.gov/condition/x"><Focus>Example syndrome</Focus><FocusAnnotations><Synonyms><Synonym>ES</Synonym></Synonyms></FocusAnnotations><QAPairs><QAPair pid="1"><Question qid="1-1" qtype="information">What is (are) Example syndrome ?</Question><Answer>Example syndrome is a rare genetic disorder &amp; affects the skin.</Answer></QAPair><QAPair pid="2"><Question qid="1-2" qtype="treatment">What are the treatments for Example syndrome ?</Question><Answer>These resources address the diagnosis or management of Example syndrome.</Answer></QAPair><QAPair pid="3"><Question qid="1-3" qtype="support groups">Where can I find support?</Question><Answer>Contact a group near you for more information.</Answer></QAPair></QAPairs></Document>`, "GHR");
ok(mq && mq.title === "Example syndrome" && mq.aliases[0] === "ES" && mq.sections.length === 2 && mq.sections[0].h === "Overview" && mq.sections[0].t.includes("& affects"), "MedQuAD XML parsed, entities decoded, support-group answers skipped");
const dox = parseDoidObo(`format-version: 1.2\n\n[Term]\nid: DOID:2841\nname: asthma\ndef: "A bronchial disease that is characterized by chronic inflammation and narrowing of the airways, which is caused by a combination of environmental and genetic factors resulting in recurring periods of wheezing." [url:http\\://example.org]\nsynonym: "bronchial asthma" EXACT []\nxref: ICD10CM:J45\nxref: MESH:D001249\nis_a: DOID:1176 ! bronchial disease\n\n[Term]\nid: DOID:9\nname: obsolete thing\nis_obsolete: true\n`);
ok(dox.length === 1 && dox[0].title === "Asthma" && dox[0].aliases[0] === "bronchial asthma" && /ICD-10-CM J45/.test(dox[0].sections[2].t), "Disease Ontology parsed with synonyms and codes");
ok(chunkText("a. ".repeat(900)).every((c) => c.length <= 1600), "chunks stay under the size limit");
ok(tidy("Text ( ) with  spaces , and ( ; ) bits .") === "Text with spaces, and bits.", "tidy removes empty brackets and stray spaces");

// ------------------------------------------------------------ Wikipedia client against a mocked API
const pages = {
  Asthma: ASTHMA,
  "Myocardial infarction": `'''Myocardial infarction''' (MI), commonly known as a heart attack, occurs when blood flow to part of the heart decreases or stops, damaging the heart muscle.\n==Treatment==\nAspirin and reperfusion with percutaneous coronary intervention are key treatments.`,
  Salbutamol: `{{Infobox drug\n| tradename = Ventolin\n| class = Short-acting beta2 agonist\n| elimination_half-life = 3.8 hours\n}}\n'''Salbutamol''' is a medication that opens up the medium and large airways in the lungs.\n==Medical uses==\nIt is used to treat asthma attacks and COPD exacerbations.`,
};
const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const u = new URL(url);
  const q = Object.fromEntries(u.searchParams);
  calls.push(q);
  let body;
  if (q.list === "projectpages") {
    if (q.wppprojects === "Medicine" && !q.wppcontinue) body = { query: { projectpages: { Medicine: [{ ns: 0, title: "Asthma", assessment: { class: "B", importance: "Top" } }, { ns: 1, title: "Talk:Asthma" }] } }, continue: { wppcontinue: "x", continue: "-||" } };
    else if (q.wppprojects === "Medicine") body = { query: { projectpages: { Medicine: [{ ns: 0, title: "Heart attack", assessment: { class: "B", importance: "High" } }] } } };
    else if (q.wppprojects === "Pharmacology") body = { query: { projectpages: { Pharmacology: [{ ns: 0, title: "Salbutamol", assessment: { class: "C", importance: "High" } }, { ns: 0, title: "Asthma", assessment: { class: "B", importance: "Mid" } }] } } };
    else body = { error: { code: "badvalue", info: "Unrecognized project" } };
  } else if (q.list === "categorymembers") {
    body = { query: { categorymembers: [] } };
  } else if (q.prop === "revisions") {
    const titles = q.titles.split("|");
    const redirects = titles.includes("Heart attack") ? [{ from: "Heart attack", to: "Myocardial infarction" }] : [];
    const resolved = titles.map((t) => redirects.find((r) => r.from === t)?.to ?? t);
    body = { query: { redirects, pages: resolved.map((t) => (pages[t] ? { title: t, revisions: [{ slots: { main: { content: pages[t] } } }] } : { title: t, missing: true })) } };
  } else if (q.prop === "redirects") {
    const titles = q.titles.split("|");
    body = { query: { pages: titles.map((t) => ({ title: t, redirects: t === "Asthma" ? [{ title: "Bronchial asthma" }] : t === "Salbutamol" ? [{ title: "Albuterol" }] : [] })) } };
  } else body = { error: { code: "unknown" } };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
};
const cache = mkdtempSync(join(tmpdir(), "medlib-"));
const wdocs = await collectWikipedia({ cacheDir: cache, projects: ["Medicine", "Pharmacology", "Nonexistent"], delayMs: 0 });
globalThis.fetch = realFetch;
ok(wdocs.length === 3, `three articles collected (${wdocs.map((x) => x.title).join(", ")})`);
const mi = wdocs.find((x) => x.title === "Myocardial infarction");
ok(mi && mi.aliases.includes("Heart attack"), "redirected title kept as an alias");
ok(wdocs.find((x) => x.title === "Asthma").priority < wdocs.find((x) => x.title === "Salbutamol").priority, "Top-importance ranks before High");
ok(wdocs.find((x) => x.title === "Salbutamol").aliases.includes("Albuterol"), "redirects become aliases");
ok(/Elimination half-life: 3.8 hours/.test(wdocs.find((x) => x.title === "Salbutamol").sections[1].t), "drug infobox summarised");
ok(calls.every((c) => c.format === "json" && c.maxlag === "5"), "API calls are polite (maxlag, json)");

// ------------------------------------------------------------ index round trip
const out = mkdtempSync(join(tmpdir(), "medlib-out-"));
const manifest = buildLibrary([...wdocs, mq, ...dox], out, { sources: { w: { name: "Wikipedia", license: "CC BY-SA 4.0", url: "" }, m: { name: "NIH", license: "CC BY 4.0", url: "" }, d: { name: "DO", license: "CC0", url: "" } } });
ok(manifest.articles === 5 && manifest.sources.w.articles === 3, "manifest counts articles per source");
const read = (p) => JSON.parse(gunzipSync(readFileSync(join(out, p))).toString());
const postings = (t) => read(termShardFile(hashTerm(t))).t[t] ?? [];
const idOf = (title) => read("articles/000.json.gz").a.find((a) => a[1] === title)[0];
ok(postings("albuterol")[0] === idOf("Salbutamol"), "alias terms point to their article");
ok(postings("heart_attack")[0] === idOf("Myocardial infarction"), "alias bigrams indexed");
ok(postings("asthma")[0] === idOf("Asthma"), "Wikipedia article outranks the ontology entry for its own title");
ok(read("articles/000.json.gz").a.find((a) => a[1] === "Asthma")[3] === null, "Wikipedia URLs derived from titles, not stored");
rmSync(cache, { recursive: true, force: true });
rmSync(out, { recursive: true, force: true });

console.log(fails ? `\n${fails} FAILED` : "\nAll builder tests passed");
process.exit(fails ? 1 : 0);
