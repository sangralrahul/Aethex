// Search-engine basics per subdomain (update 49): robots.txt and sitemap.xml for cadus.aethex.in,
// downloads.aethex.in and the sign-in subdomains (aethex.in keeps the files in artifacts/aethex/public),
// and Cadus's home page with its own title, description, canonical link, preview tags and schema.

const text = (body: string, type: string) =>
  new Response(body, { headers: { "content-type": `${type}; charset=utf-8`, "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });

const CADUS = "https://cadus.aethex.in";
const CADUS_PAGES: [string, string, string][] = [
  ["/", "daily", "1.0"],
  ["/plans", "monthly", "0.7"],
  ["/about", "monthly", "0.6"],
  ["/privacy", "yearly", "0.4"],
  ["/terms", "yearly", "0.4"],
  ["/disclaimer", "yearly", "0.4"],
];

export function hostRobots(host: string): Response | null {
  const h = host.replace(/^www\./, "");
  if (h === "cadus.aethex.in") return text(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /shared\nDisallow: /sign-in\nDisallow: /login\n\nSitemap: ${CADUS}/sitemap.xml\n`, "text/plain");
  if (h === "downloads.aethex.in") return text("User-agent: *\nAllow: /\nDisallow: /cadus/\n", "text/plain");
  // Sign-in pages have nothing to index.
  if (h === "auth.aethex.in" || h === "login.aethex.in") return text("User-agent: *\nDisallow: /\n", "text/plain");
  // update 101: the portals and aethex.in each point to their own sitemap
  const portal = h.replace(/\.aethex\.in$/, "");
  if (h === "aethex.in" || SITE_PORTALS.includes(portal as Portal)) return text(`User-agent: *\nAllow: /\n${PRIVATE.map((x) => `Disallow: ${x}`).join("\n")}\n\nSitemap: https://${h}/sitemap.xml\n`, "text/plain");
  return null;
}

/* ------------------------------------------------------------------ update 101: a sitemap per portal */
const PRIVATE = ["/jobs", "/community", "/live-classes", "/webinars", "/video-cases", "/drug-alerts", "/analytics", "/institution-analytics", "/hospital-directory", "/admin", "/admin/", "/seller/", "/account", "/orders", "/order/", "/wishlist", "/cart", "/checkout", "/api/", "/practice", "/appointments", "/my-library", "/approve/", "/indents", "/stock", "/team", "/spend", "/equipment", "/approvals", "/vitals"];
const SITE_PORTALS: Portal[] = ["store", "study", "doctors", "hospitals", "medicalcolleges"];
// which portal a path belongs to (kept in step with src/lib/portals.ts MAP)
const MAP: [RegExp, Portal][] = [
  [/^\/(find|doctors?|clinics?|ask|articles|appointments|practice|list-your-practice|records|prescription|telemedicine-directory|which-doctor|saved-doctors|family|vitals)(\/|$)/, "doctors"],
  [/^\/(store|shop|products|category|brand|brands|books|cart|wishlist|compare|checkout|orders?|alerts|shipping-policy|returns-policy|cancellation-policy|grievance|my-reviews|seller|sell|offers|reorder|gift)(\/|$)/, "store"],
  [/^\/(study-hub|neet-pg|mock-test|flashcards|case-of-the-day|cme-hub|cme-certificate|tools|calculator|drug-reference|drug-interaction-checker|drug-alerts|study-planner|live-classes|learning-path|quiz-builder|progress-tracker|leaderboard|webinars|video-cases|cases|diagnosis|answer-eval|mentorship|news|patient-education|ai-scribe|my-consults|community|custom-test|my-library|study-groups|sectional-tests|study-moderation|question-of-the-day)(\/|$)/, "study"],
  [/^\/(hospitals|institutions|hospital-directory|institution-analytics|enterprise)(\/|$)/, "hospitals"],
  [/^\/(medical-colleges|colleges)(\/|$)/, "medicalcolleges"],
];
const HOME: Partial<Record<Portal, string>> = { store: "/store", doctors: "/find", hospitals: "/hospitals", medicalcolleges: "/medical-colleges", study: "/study-hub" };
// public pages added after the sitemap file was made
const EXTRA: Partial<Record<Portal, string[]>> = {
  store: ["/sell", "/offers", "/books"],
  study: ["/neet-pg", "/mock-test", "/question-of-the-day", "/sectional-tests", "/custom-test", "/flashcards", "/case-of-the-day", "/study-hub/medical-knowledge-hub", "/drug-reference", "/drug-interaction-checker", "/calculator", "/tools", "/cme-hub", "/study-groups", "/leaderboard"],
  hospitals: ["/institutions"],
  doctors: ["/doctors", "/ask", "/articles", "/which-doctor", "/clinics", "/list-your-practice"],
};
const portalOfPath = (path: string): Portal | null => { for (const [re, p] of MAP) if (re.test(path)) return p; return null; };
/** aethex.in and each portal: the pages of the shared sitemap file that belong there, at their own address. */
export async function siteSitemap(host: string, assets: { fetch: (r: Request) => Promise<Response> }): Promise<Response | null> {
  const h = host.replace(/^www\./, "");
  const here = h === "aethex.in" ? null : (h.replace(/\.aethex\.in$/, "") as Portal);
  if (here !== null && !SITE_PORTALS.includes(here)) return null;
  const res = await assets.fetch(new Request("https://aethex.in/sitemap.xml"));
  if (!res.ok) return null;
  const xml = await res.text();
  const seen = new Set<string>(), out: string[] = [];
  const add = (path: string, rest = "") => { if (seen.has(path) || PRIVATE.some((x) => path === x || path.startsWith(x.endsWith("/") ? x : `${x}/`))) return; seen.add(path); out.push(`  <url>\n    <loc>https://${h}${path}</loc>${rest}\n  </url>`); };
  for (const m of xml.matchAll(/<url>\s*<loc>https:\/\/aethex\.in([^<]*)<\/loc>([\s\S]*?)<\/url>/g)) {
    const path = m[1] || "/", rest = (m[2] ?? "").replace(/\s+$/, "").replace(/^\s*/, "\n    ").replace(/\n\s*/g, "\n    ");
    const p = portalOfPath(path);
    if (p !== here) continue;
    add(here && HOME[here] === path ? "/" : path, rest);
  }
  if (here) { add("/"); for (const x of EXTRA[here] ?? []) add(x); }
  return text(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${out.join("\n")}\n</urlset>\n`, "application/xml");
}

export function hostSitemap(host: string): Response | null {
  if (host.replace(/^www\./, "") !== "cadus.aethex.in") return null;
  const urls = CADUS_PAGES.map(([p, f, pr]) => `  <url>\n    <loc>${CADUS}${p}</loc>\n    <changefreq>${f}</changefreq>\n    <priority>${pr}</priority>\n  </url>`).join("\n");
  return text(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "application/xml");
}

const TITLE = "Cadus: clinical AI assistant for doctors and medical students in India";
const DESC = "Ask Cadus clinical questions free, no sign-up needed for simple chat. Safety-reviewed answers with sources, 300+ clinical tools and calculators, NEET-PG practice and Cadus Crew assistants.";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Rewrites the shared index.html head for cadus.aethex.in/ so links and search results show Cadus. */
export async function cadusHome(res: Response): Promise<Response> {
  if (!res.ok || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  let html = await res.text();
  const meta = (attr: "name" | "property", key: string, value: string) => {
    const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[:]/g, "\\:")}"\\s+content="[^"]*"\\s*/?>`, "i");
    const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
    html = re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
  };
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(TITLE)}</title>`);
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${esc(DESC)}" />`);
  html = html.replace(/<meta\s*\n?\s*name="description"\s*\n?\s*content="[^"]*"\s*\n?\s*\/?>/i, `<meta name="description" content="${esc(DESC)}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${CADUS}/" />`);
  meta("property", "og:site_name", "Cadus by Aethex");
  meta("property", "og:url", `${CADUS}/`);
  meta("property", "og:title", TITLE);
  meta("property", "og:description", DESC);
  meta("name", "twitter:title", TITLE);
  meta("name", "twitter:description", DESC);
  const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Cadus", applicationCategory: "MedicalApplication", operatingSystem: "Web, Windows", url: `${CADUS}/`, description: DESC, publisher: { "@type": "Organization", name: "Aethex", url: "https://aethex.in/" }, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  html = html.replace("</head>", `    <script type="application/ld+json">${JSON.stringify(schema)}</script>\n  </head>`);
  // Readable without JavaScript (crawlers and link previews): one heading and the main links.
  html = html.replace(/<noscript>\s*<p style="font:16px[\s\S]*?<\/noscript>/, `<noscript><main style="font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px"><h1>Cadus: clinical AI assistant</h1><p>${esc(DESC)}</p><p><a href="/plans">Plans</a> · <a href="/about">About Cadus</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="https://aethex.in/">Aethex</a></p><p>Cadus needs JavaScript to run.</p></main></noscript>`);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-cache");
  return new Response(html, { status: res.status, headers });
}

/* ------------------------------------------------------------------ the portal subdomains (update 58) */

export type Portal = "store" | "study" | "doctors" | "hospitals" | "medicalcolleges";
const PORTALS: Record<Portal, { title: string; desc: string; h1: string }> = {
  store: { title: "Aethex Store: genuine medical equipment and supplies in India", desc: "Stethoscopes, diagnostic sets, BP monitors, hospital and lab equipment and medical books from verified brands, with cash on delivery across India.", h1: "Aethex Store" },
  study: { title: "Aethex Study: NEET-PG preparation, mock tests and the medical knowledge hub", desc: "NEET-PG question banks, timed mock tests, flashcards, case of the day and a knowledge hub for every subject.", h1: "Aethex Study" },
  doctors: { title: "Aethex Doctors: find a doctor, book an appointment, ask a doctor", desc: "Find doctors and clinics near you by city and specialty, see fees, timings and patient reviews, book a clinic visit or video consult, ask a doctor and read health articles. Doctors list their practice free.", h1: "Aethex Doctors" },
  hospitals: { title: "Aethex for Hospitals: one quotation for every ward", desc: "Hospital furniture, ICU, emergency and diagnostic equipment: send one list and get one quotation. Pay by bank transfer or purchase order.", h1: "Aethex for Hospitals" },
  medicalcolleges: { title: "Aethex for Medical Colleges: skills labs, anatomy and lab equipment", desc: "Skills trainers, manikins, anatomy models, lab equipment and books for medical colleges: one list, one quotation.", h1: "Aethex for Medical Colleges" },
};

export function portalOf(host: string): Portal | null {
  const h = host.replace(/^www\./, "").replace(/\.aethex\.in$/, "");
  return h in PORTALS ? (h as Portal) : null;
}

/** The shared index.html head for a portal subdomain's home page. */
export async function portalHome(res: Response, portal: Portal): Promise<Response> {
  if (!res.ok || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const p = PORTALS[portal], origin = `https://${portal}.aethex.in`;
  let html = await res.text();
  const meta = (attr: "name" | "property", key: string, value: string) => {
    const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[:]/g, "\\:")}"\\s+content="[^"]*"\\s*/?>`, "i");
    const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
    html = re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
  };
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(p.title)}</title>`);
  html = html.replace(/<meta\s*\n?\s*name="description"\s*\n?\s*content="[^"]*"\s*\n?\s*\/?>/i, `<meta name="description" content="${esc(p.desc)}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${origin}/" />`);
  meta("property", "og:url", `${origin}/`);
  meta("property", "og:title", p.title);
  meta("property", "og:description", p.desc);
  meta("name", "twitter:title", p.title);
  meta("name", "twitter:description", p.desc);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-cache");
  return new Response(html, { status: res.status, headers });
}
