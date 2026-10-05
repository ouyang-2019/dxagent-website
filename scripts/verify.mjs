import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { origins, sites } from "./site-config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const errors = [];
let pageCount = 0;

// Every JSON-LD node on the page, with @graph containers flattened.
function structuredData(file, html) {
  const nodes = [];
  for (const [, body] of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      errors.push(`${file}: JSON-LD does not parse`);
      continue;
    }
    if (data["@context"] !== "https://schema.org") errors.push(`${file}: JSON-LD missing schema.org @context`);
    nodes.push(...(Array.isArray(data["@graph"]) ? data["@graph"] : [data]));
  }
  return nodes;
}

function checkStructuredData(file, html, { isSiteRoot, isArticle }) {
  const nodes = structuredData(file, html);
  const ofType = type => nodes.filter(node => [node["@type"]].flat().includes(type));
  if (nodes.length === 0) {
    errors.push(`${file}: missing JSON-LD`);
    return;
  }
  // A bare { "@id" } is a reference; consumers read one page at a time, so its target must be on this page.
  const defined = new Set();
  const referenced = new Set();
  (function collect(value) {
    if (Array.isArray(value)) return value.forEach(collect);
    if (value === null || typeof value !== "object") return;
    if (value["@id"]) (Object.keys(value).length > 1 ? defined : referenced).add(value["@id"]);
    Object.values(value).forEach(collect);
  })(nodes);
  for (const id of referenced) if (!defined.has(id)) errors.push(`${file}: JSON-LD reference ${id} is not defined on the page`);
  if (isSiteRoot && ofType("WebSite").length !== 1) errors.push(`${file}: site root needs one WebSite node`);
  if (!isSiteRoot && ofType("BreadcrumbList").length !== 1) errors.push(`${file}: missing BreadcrumbList`);
  if (isArticle) {
    const [article] = ofType("Article");
    if (!article?.headline || !article?.datePublished || !article?.author?.name) {
      errors.push(`${file}: Article needs headline, datePublished and author`);
    }
  }
  // Structured answers must mirror the questions a reader can see on the page.
  const visibleQuestions = /class="faq-list"/.test(html) ? (html.match(/<details\b/gi) ?? []).length : 0;
  const listedQuestions = ofType("FAQPage").flatMap(node => node.mainEntity ?? []).length;
  if (visibleQuestions !== listedQuestions) {
    errors.push(`${file}: FAQPage lists ${listedQuestions} questions, page shows ${visibleQuestions}`);
  }
}

async function exists(path) {
  return Boolean(await stat(path).catch(() => null));
}

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile()) yield path;
  }
}

for (const site of sites) {
  const siteRoot = join(output, site);
  if (!(await exists(join(siteRoot, "index.html")))) {
    errors.push(`${site}: missing index.html`);
    continue;
  }
  const origin = origins[site];
  const notFoundPage = join(siteRoot, "404.html");
  const pageUrls = new Set();

  for await (const file of files(siteRoot)) {
    if (extname(file) === ".mjs" || extname(file) === ".js") {
      // Static and dynamic relative imports must resolve inside the site.
      const source = await readFile(file, "utf8");
      for (const [, , specifier] of source.matchAll(/\b(?:from|import)\s*\(?\s*(["'])(\.{1,2}\/[^"']+)\1/g)) {
        const target = resolve(dirname(file), specifier);
        const inside = relative(siteRoot, target);
        if (inside.startsWith(`..${sep}`) || inside === ".." || isAbsolute(inside)) {
          errors.push(`${file}: import escapes site root: ${specifier}`);
        } else if (!(await stat(target).catch(() => null))?.isFile()) {
          errors.push(`${file}: broken module import: ${specifier}`);
        }
      }
      continue;
    }
    if (extname(file) !== ".html") continue;
    pageCount += 1;
    const html = await readFile(file, "utf8");
    if (!/<html\b[^>]*\blang=/i.test(html)) errors.push(`${file}: missing html lang`);
    if (!/<main\b/i.test(html)) errors.push(`${file}: missing main landmark`);
    if ((html.match(/<h1\b/gi) ?? []).length !== 1) {
      errors.push(`${file}: expected one h1`);
    }

    if (file === notFoundPage) {
      if (!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)) errors.push(`${file}: 404 page must be noindex`);
    } else {
      const directory = relative(siteRoot, dirname(file)).split(sep).join("/");
      const url = `${origin}/${directory ? `${directory}/` : ""}`;
      pageUrls.add(url);
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1];
      if (canonical !== url) errors.push(`${file}: canonical is ${canonical}, expected ${url}`);
      checkStructuredData(file, html, {
        isSiteRoot: directory === "",
        isArticle: site === "blog" && directory.startsWith("articles/"),
      });
    }

    const links = html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi);
    for (const [, , value] of links) {
      if (value === "#") {
        errors.push(`${file}: placeholder link`);
        continue;
      }
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) continue;
      const pathname = decodeURIComponent(value.split(/[?#]/, 1)[0]);
      if (!pathname) continue;
      const target = pathname.startsWith("/")
        ? resolve(siteRoot, `.${pathname}`)
        : resolve(dirname(file), pathname);
      const inside = relative(siteRoot, target);
      if (inside.startsWith(`..${sep}`) || inside === ".." || isAbsolute(inside)) {
        errors.push(`${file}: local link escapes site root: ${value}`);
        continue;
      }
      const resolved = pathname.endsWith("/") ? join(target, "index.html") : target;
      if (!(await exists(resolved)) && !(await exists(join(resolved, "index.html")))) {
        errors.push(`${file}: broken local link: ${value}`);
      }
    }
  }

  // Without a top-level 404.html Cloudflare Pages answers unknown paths with the home page and status 200.
  if (!(await exists(notFoundPage))) errors.push(`${site}: missing 404.html`);

  const robots = await readFile(join(siteRoot, "robots.txt"), "utf8").catch(() => null);
  if (robots === null) errors.push(`${site}: missing robots.txt`);
  else if (!robots.split(/\r?\n/).includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push(`${site}: robots.txt does not declare the sitemap`);

  const sitemap = await readFile(join(siteRoot, "sitemap.xml"), "utf8").catch(() => null);
  if (sitemap === null) {
    errors.push(`${site}: missing sitemap.xml`);
  } else {
    const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]));
    for (const url of pageUrls) if (!listed.has(url)) errors.push(`${site}: sitemap.xml is missing ${url}`);
    for (const url of listed) if (!pageUrls.has(url)) errors.push(`${site}: sitemap.xml lists unknown page ${url}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Verified ${pageCount} pages across ${sites.length} sites.`);
}
