import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { origins, owner, siteNames } from "./site-config.mjs";

const language = "zh-CN";
const ownerRef = { "@id": owner["@id"] };
const entities = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

const decode = value => value?.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => entities[entity]);
const plainText = markup => decode(markup?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
const escapeXml = value => value.replace(/[&<>]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);

// Every page of a built site, root first. `directory` is "" for the root page.
async function listPages(destination) {
  const pages = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && entry.name === "index.html") {
        pages.push({ file: path, directory: relative(destination, dirname(path)).split(sep).join("/") });
      }
    }
  }
  await walk(destination);
  return pages.sort((a, b) => (a.directory < b.directory ? -1 : a.directory > b.directory ? 1 : 0));
}

const pageDates = html => [...html.matchAll(/<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})"/gi)].map(match => match[1]);

// Structured data repeats what the page already says, so each fact is read from the page itself.
function pageFacts(file, html) {
  const url = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1];
  if (!url || !title) throw new Error(`${file}: page needs a canonical link and a title`);
  return {
    url,
    name: decode(title.split(" · ")[0].trim()),
    description: decode(html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1]),
    headline: plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]),
    published: pageDates(html)[0],
  };
}

// Each page carries the nodes its references point to: consumers read one page at a time,
// so an @id defined only on another page would dangle.
function pageNodes({ site, directory, facts, product }) {
  const origin = origins[site];
  const website = { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: siteNames[site], publisher: ownerRef };
  if (directory === "") {
    return [{ ...website, description: facts.description, inLanguage: language }, owner];
  }

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteNames[site], item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: facts.name, item: facts.url },
    ],
  };
  if (site === "blog" && directory.startsWith("articles/")) {
    return [breadcrumb, {
      "@type": "Article",
      headline: facts.headline,
      description: facts.description,
      datePublished: facts.published,
      dateModified: facts.published,
      inLanguage: language,
      mainEntityOfPage: facts.url,
      author: owner,
      publisher: ownerRef,
    }];
  }
  if (product) {
    return [
      breadcrumb,
      { "@type": "SoftwareApplication", name: product.brand, description: product.summary, url: facts.url, author: ownerRef },
      {
        "@type": "FAQPage",
        mainEntity: product.faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: plainText(question),
          acceptedAnswer: { "@type": "Answer", text: plainText(answer) },
        })),
      },
      owner,
    ];
  }
  return [
    breadcrumb,
    { "@type": "WebPage", url: facts.url, name: facts.name, description: facts.description, inLanguage: language, isPartOf: website },
    owner,
  ];
}

export async function injectStructuredData({ site, destination, products }) {
  for (const { file, directory } of await listPages(destination)) {
    const html = await readFile(file, "utf8");
    if (!html.includes("</head>")) throw new Error(`${file}: missing </head>`);
    const product = site === "projects" ? products.find(candidate => candidate.slug === directory) : undefined;
    const graph = pageNodes({ site, directory, facts: pageFacts(file, html), product });
    // Escaping "<" keeps page text from closing the script element.
    const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
    // A replacer function, because "$" in the JSON would be read as a replacement pattern.
    await writeFile(file, html.replace("</head>", () => `  <script type="application/ld+json">${json}</script>\n</head>`));
  }
}

function notFoundPage(site, iconLink) {
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>页面不存在 · ${siteNames[site]}</title>
  ${iconLink}
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main id="main">
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">404</p>
        <h1 class="page-title">页面不存在</h1>
        <p class="hero-lede">这个地址没有对应的页面,可能是链接有误,或者页面已经移动。</p>
        <p class="hero-lede"><a href="/">返回首页</a></p>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

// Crawl files for one site. Without a top-level 404.html, Cloudflare Pages
// answers unknown paths (robots.txt included) with the home page and status 200.
export async function writeSiteFiles({ site, destination }) {
  const origin = origins[site];
  const entries = [];
  for (const { file, directory } of await listPages(destination)) {
    const lastModified = pageDates(await readFile(file, "utf8")).sort().at(-1);
    const location = escapeXml(`${origin}/${directory ? `${directory}/` : ""}`);
    entries.push(`  <url><loc>${location}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ""}</url>`);
  }
  await writeFile(
    join(destination, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`,
  );
  await writeFile(join(destination, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  // Reuse the home page's inline icon so the browser does not go looking for /favicon.ico.
  const iconLink = (await readFile(join(destination, "index.html"), "utf8")).match(/<link\b[^>]*rel="icon"[^>]*>/i)?.[0];
  if (!iconLink) throw new Error(`${site}: home page has no icon link`);
  await writeFile(join(destination, "404.html"), notFoundPage(site, iconLink));
}
