// English Wikipedia articles assessed by medical WikiProjects (CC BY-SA 4.0).
// Lists every article tagged by WikiProject Medicine, Pharmacology, Anatomy and
// Physiology (via the PageAssessments API, with a category fallback), downloads
// the wikitext in batches, and converts it to clean sections with wtf_wikipedia.
import wtf from "wtf_wikipedia";
import { fetchText, log, sleep, tidy } from "../lib/util.mjs";

export const DEFAULT_PROJECTS = ["Medicine", "Pharmacology", "Anatomy", "Physiology"];
const API = "https://en.wikipedia.org/w/api.php";
// Wikimedia asks automated clients for a descriptive User-Agent with a contact URL.
const UA = "CadusMedicalLibraryBuilder/1.0 (https://aethex.in; offline medical reference for Cadus)";

const IMPORTANCE = { top: 0, high: 1, mid: 2, low: 3 };
const CLASS_ADJ = { fa: -0.3, fl: -0.2, ga: -0.25, a: -0.2, b: -0.15, c: 0, start: 0.15, stub: 0.3, list: 0.2 };
/** Characters kept per article, by importance (keeps the library shippable). */
const CHAR_CAP = [40_000, 40_000, 20_000, 9_000, 7_000];

const SKIP_HEADING =
  /^(see also|references|external links|further reading|notes|footnotes|bibliography|sources|citations|works cited|gallery|images|in popular culture|popular culture|in media|media|in fiction|in literature|in art|etymology|names?|terminology|other animals|in other animals|animals|veterinary( use| medicine)?|research|research directions|society and culture|legal status|economics|cost|costs|brand names?|patents?|lawsuits?|litigation|marketing|controversy|controversies|notable (cases|people|patients)|awareness|culture)$/i;
const LEAD_ONLY_INFOBOX =
  /person|officeholder|scientist|physician|academic|biography|medical person|organi[sz]ation|company|hospital|university|college|school|journal|magazine|charity|ngo|agency|award|military|sport|film|television|book|software|website|journal|government|building|event|disaster/;

const CONDITION_FIELDS = [
  ["specialty", "Specialty"], ["symptoms", "Symptoms"], ["complications", "Complications"], ["onset", "Usual onset"],
  ["duration", "Duration"], ["types", "Types"], ["causes", "Causes"], ["risks", "Risk factors"], ["diagnosis", "Diagnosis"],
  ["differential", "Differential diagnosis"], ["prevention", "Prevention"], ["treatment", "Treatment"], ["medication", "Medication"],
  ["prognosis", "Prognosis"], ["frequency", "Frequency"], ["deaths", "Deaths"],
];
const DRUG_FIELDS = [
  ["tradename", "Trade names"], ["class", "Drug class"], ["drug_class", "Drug class"], ["routes_of_administration", "Routes"],
  ["bioavailability", "Bioavailability"], ["protein_bound", "Protein binding"], ["metabolism", "Metabolism"],
  ["onset", "Onset of action"], ["elimination_half-life", "Elimination half-life"], ["duration_of_action", "Duration of action"],
  ["excretion", "Excretion"], ["atc_prefix", "ATC code"],
];

async function api(params, ctx, attempt = 0) {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params });
  const r = await fetchText(`${API}?${qs}`, {
    headers: { "User-Agent": UA, "Api-User-Agent": UA, Accept: "application/json" },
    cacheDir: ctx.cacheDir,
    cacheMisses: false,
    retries: 6,
    validate: (text) => !/^\s*\{\s*"error"/.test(text),
  });
  if (r.status !== 200) throw new Error(`Wikipedia API HTTP ${r.status}`);
  const json = JSON.parse(r.text);
  if (json?.error?.code === "maxlag" && attempt < 8) {
    await sleep(5000 * (attempt + 1));
    return api(params, ctx, attempt + 1);
  }
  if (!r.cached && ctx.delayMs) await sleep(ctx.delayMs);
  return json;
}

function rank(importance, cls) {
  const imp = IMPORTANCE[String(importance || "").toLowerCase()] ?? 4;
  return imp + (CLASS_ADJ[String(cls || "").toLowerCase()] ?? 0.1);
}

/** Every article (namespace 0) assessed by the given WikiProjects, with its best rank. */
export async function listProjectArticles(projects, ctx) {
  const best = new Map();
  const add = (title, importance, cls) => {
    const r = rank(importance, cls);
    const prev = best.get(title);
    if (!prev || r < prev.rank) best.set(title, { title, rank: r, importance: String(importance || "").toLowerCase() });
  };
  for (const project of projects) {
    let n = 0;
    let cont = {};
    try {
      while (cont) {
        const r = await api({ action: "query", list: "projectpages", wppprojects: project, wppassessments: "1", wpplimit: "max", ...cont }, ctx);
        if (r.error) throw new Error(r.error.info || r.error.code);
        const pp = r.query?.projectpages ?? {};
        const pages = Array.isArray(pp) ? pp : Object.values(pp).flat();
        for (const p of pages) {
          if (p?.ns !== 0 || !p.title) continue;
          add(p.title, p.assessment?.importance, p.assessment?.class);
          n++;
        }
        cont = r.continue?.wppcontinue ? { wppcontinue: r.continue.wppcontinue, continue: r.continue.continue ?? "" } : null;
      }
    } catch (e) {
      log(`  PageAssessments failed for ${project} (${e.message}); trying categories`);
    }
    if (n === 0) n = await listByCategories(project, ctx, add);
    log(`WikiProject ${project}: ${n} articles`);
  }
  return [...best.values()].sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));
}

async function listByCategories(project, ctx, add) {
  let n = 0;
  for (const imp of ["Top", "High", "Mid", "Low", "Unknown"]) {
    for (const name of new Set([project.toLowerCase(), project])) {
      let cont = {};
      while (cont) {
        const r = await api({ action: "query", list: "categorymembers", cmtitle: `Category:${imp}-importance ${name} articles`, cmnamespace: "1", cmlimit: "max", ...cont }, ctx);
        for (const m of r.query?.categorymembers ?? []) {
          const title = String(m.title || "").replace(/^Talk:/, "");
          if (title) {
            add(title, imp, "");
            n++;
          }
        }
        cont = r.continue?.cmcontinue ? { cmcontinue: r.continue.cmcontinue, continue: r.continue.continue ?? "" } : null;
      }
    }
  }
  return n;
}

const infoText = (v) => tidy(String(v?.text ?? "")).replace(/\n+/g, "; ");

function infoboxSummary(ib) {
  const type = ib.type().toLowerCase();
  const data = ib.json();
  const fields = /drug|medication|chembox/.test(type) ? DRUG_FIELDS : /medical condition|disease/.test(type) ? CONDITION_FIELDS : null;
  if (!fields) return "";
  const lines = [];
  const used = new Set();
  for (const [key, label] of fields) {
    const v = infoText(data[key]);
    if (!v || used.has(label) || v.length > 400) continue;
    used.add(label);
    lines.push(`${label}: ${v}`);
  }
  return lines.join("\n");
}

function tableText(table) {
  const rows = table.json().slice(0, 25);
  return rows
    .map((row) =>
      Object.entries(row)
        .map(([k, v]) => {
          const t = infoText(v);
          return t ? (/^col\d+$/i.test(k) ? t : `${k}: ${t}`) : "";
        })
        .filter(Boolean)
        .join("; "),
    )
    .filter(Boolean)
    .join("\n");
}

/** Convert one article's wikitext to a library document (or null to skip). */
export function wikiArticle(title, wikitext, meta = {}) {
  const doc = wtf(wikitext, { title });
  if (doc.isRedirect() || doc.isDisambiguation()) return null;
  const rankV = meta.rank ?? 4;
  const cap = CHAR_CAP[Math.min(4, Math.max(0, Math.floor(rankV)))];
  const ib = doc.infoboxes()[0];
  const ibType = ib ? ib.type().toLowerCase() : "";
  const leadOnly = LEAD_ONLY_INFOBOX.test(ibType);
  const sections = [];
  let used = 0;
  const push = (h, t) => {
    if (!t || used >= cap) return;
    const room = cap - used;
    const text = t.length > room ? `${t.slice(0, room).replace(/\s+\S*$/, "")}…` : t;
    sections.push({ h, t: text });
    used += text.length;
  };

  let parent = "";
  let skipBelow = -1;
  const all = doc.sections();
  all.forEach((s, i) => {
    const depth = s.depth();
    const heading = s.title().trim();
    if (skipBelow >= 0 && depth > skipBelow) return;
    skipBelow = -1;
    if (i > 0 && SKIP_HEADING.test(heading)) {
      skipBelow = depth;
      return;
    }
    if (depth === 0) parent = heading;
    if (i > 0 && leadOnly) return;
    let text = tidy(s.text());
    const tables = s.tables().map(tableText).filter(Boolean).join("\n");
    if (tables) text = text ? `${text}\n${tables}` : tables;
    if (!text) return;
    if (/^history$/i.test(parent)) text = text.slice(0, 1500);
    const h = i === 0 ? "Overview" : depth > 0 && parent && parent !== heading ? `${parent}: ${heading}` : heading;
    push(h, text);
    if (i === 0 && ib) push("Summary", infoboxSummary(ib));
  });
  if (!sections.length || sections[0].t.length < 40) return null;
  return {
    source: "w",
    title,
    url: null,
    aliases: meta.aliases ?? [],
    priority: rankV,
    sections,
  };
}

/** Fetch redirect titles (aliases such as "Heart attack" for "Myocardial infarction"). */
async function fetchAliases(titles, ctx) {
  const out = new Map(titles.map((t) => [t, []]));
  let cont = {};
  while (cont) {
    const r = await api({ action: "query", prop: "redirects", rdprop: "title", rdnamespace: "0", rdlimit: "max", titles: titles.join("|"), ...cont }, ctx);
    const norm = new Map((r.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of r.query?.pages ?? []) {
      const key = out.has(p.title) ? p.title : norm.get(p.title) ?? p.title;
      const list = out.get(key) ?? [];
      for (const rd of p.redirects ?? []) if (list.length < 25) list.push(rd.title);
      out.set(key, list);
    }
    cont = r.continue?.rdcontinue ? { rdcontinue: r.continue.rdcontinue, continue: r.continue.continue ?? "" } : null;
  }
  return out;
}

async function fetchWikitext(titles, ctx) {
  const out = [];
  let cont = {};
  while (cont) {
    const r = await api({ action: "query", prop: "revisions", rvprop: "content", rvslots: "main", redirects: "1", titles: titles.join("|"), ...cont }, ctx);
    const redirected = new Map((r.query?.redirects ?? []).map((x) => [x.to, x.from]));
    for (const p of r.query?.pages ?? []) {
      const content = p.revisions?.[0]?.slots?.main?.content ?? p.revisions?.[0]?.content;
      if (p.missing || p.invalid || typeof content !== "string") continue;
      out.push({ title: p.title, from: redirected.get(p.title), content });
    }
    cont = r.continue?.rvcontinue ? { rvcontinue: r.continue.rvcontinue, continue: r.continue.continue ?? "" } : null;
  }
  return out;
}

export async function collectWikipedia(ctx) {
  const projects = ctx.projects?.length ? ctx.projects : DEFAULT_PROJECTS;
  let list = await listProjectArticles(projects, ctx);
  if (ctx.maxArticles > 0) list = list.slice(0, ctx.maxArticles);
  log(`Wikipedia: downloading ${list.length} articles…`);
  const meta = new Map(list.map((a) => [a.title, a]));
  const docs = [];
  const BATCH = 20;
  let skipped = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const titles = list.slice(i, i + BATCH).map((a) => a.title);
    const [pages, aliases] = await Promise.all([fetchWikitext(titles, ctx), fetchAliases(titles, ctx)]);
    for (const p of pages) {
      const m = meta.get(p.from ?? p.title) ?? meta.get(p.title) ?? { rank: 4 };
      const al = [...(aliases.get(p.from ?? p.title) ?? []), ...(p.from && p.from !== p.title ? [p.from] : [])];
      try {
        const d = wikiArticle(p.title, p.content, { rank: m.rank, aliases: al });
        if (d) docs.push(d);
        else skipped++;
      } catch (e) {
        skipped++;
        if (ctx.verbose) log(`  could not parse ${p.title}: ${e.message}`);
      }
    }
    if ((i / BATCH) % 50 === 0) log(`  ${Math.min(i + BATCH, list.length)}/${list.length} fetched, ${docs.length} kept`);
  }
  // The same article can be reached through two titles; keep one.
  const seen = new Set();
  const unique = docs.filter((d) => (seen.has(d.title) ? false : (seen.add(d.title), true)));
  log(`Wikipedia: ${unique.length} articles kept (${skipped} redirects, disambiguation pages or stubs skipped)`);
  return unique;
}
