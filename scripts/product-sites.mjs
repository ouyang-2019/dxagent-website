import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderProductSpotlight, renderProductVisual } from "./product-visuals.mjs";

const arrow =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const icons = {
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  check: '<path d="m8 12 3 3 5-6"/><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  flow: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v9h9M9 6h9v9"/>',
  team: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  undo: '<path d="M3 10h11a6 6 0 0 1 0 12M3 10l5-5M3 10l5 5"/>',
};

const icon = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.file}</svg>`;

function demo(p) {
  return `<figure class="demo-shell" aria-labelledby="demo-caption">
    <div class="demo-top">
      <div class="demo-dot-group" aria-hidden="true"><i></i><i></i><i></i></div>
      <span>${p.demoTitle}</span>
      <span class="example-label">界面示意</span>
    </div>
    <div class="demo-body">
      <aside class="demo-sidebar" aria-hidden="true">
        <span class="mini-brand">${p.mark}</span>
        ${["工作台", "资料", "记录", "设置"]
          .map(
            (x, i) =>
              `<span class="side-item ${i === 0 ? "active" : ""}">${icon(["layers", "file", "check", "flow"][i])}<small>${x}</small></span>`,
          )
          .join("")}
      </aside>
      <div class="demo-main">
        <div class="demo-breadcrumb">工作区 / <strong>${p.demoSub}</strong></div>
        <div class="demo-tabs" role="tablist" aria-label="产品流程示意">
          ${p.demoTabs
            .map(
              (x, i) =>
                `<button role="tab" id="tab-${i}" data-demo-tab="${i}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? "0" : "-1"}">${x}</button>`,
            )
            .join("")}
        </div>
        ${p.demos
          .map(
            (d, i) =>
              `<section role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" data-demo-panel="${i}" tabindex="0">
                <div class="demo-heading">
                  <span class="demo-symbol">${icon(i === 0 ? "check" : i === 1 ? "layers" : "file")}</span>
                  <div><h2>${d.headline}</h2><p>${d.hint}</p></div>
                </div>
                ${
                  p.demoKind === "canvas" && i === 0
                    ? `<div class="canvas-preview" aria-label="创作素材示意">${p.canvasLabels.map(label => `<div><span>${label}</span></div>`).join("")}</div>`
                    : ""
                }
                <div class="data-rows">${d.rows
                  .map(r => `<div class="data-row"><span>${r[0]}</span><span class="status ${r[2]}">${r[1]}</span></div>`)
                  .join("")}</div>
                <div class="demo-evidence">${icon("file")}<span>${d.foot}</span></div>
              </section>`,
          )
          .join("")}
      </div>
    </div>
    <figcaption id="demo-caption">产品流程示意 · 使用虚构示例资料</figcaption>
  </figure>`;
}

function page(p) {
  const productClass = `product-${p.slug}`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="canonical" href="https://projects.dxagent.cloud/${p.slug}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${p.brand} · ${p.name}">
  <meta property="og:description" content="${p.summary}">
  <meta property="og:url" content="https://projects.dxagent.cloud/${p.slug}/">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%230b0e14%27/%3E%3Ctext x=%2732%27 y=%2743%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2728%27 fill=%27white%27%3EDX%3C/text%3E%3C/svg%3E">
  <meta name="description" content="${p.summary}">
  <title>${p.brand} · ${p.name}</title>
  <link rel="stylesheet" href="../product.css?v=20261003">
  <script src="../product.js?v=20261003" defer></script>
</head>
<body class="theme-${p.theme} ${productClass}">
  <a class="skip-link" href="#main">跳到主要内容</a>
  <header class="site-header">
    <div class="container nav-wrap">
      <a class="brand" href="#top"><span class="brand-mark">${p.mark}</span><span>${p.brand}<small>${p.name === p.brand ? "产品官网" : p.name}</small></span></a>
      <button class="menu-toggle" data-menu-toggle aria-controls="site-nav" aria-expanded="false">菜单 <span aria-hidden="true">☰</span></button>
      <nav id="site-nav" aria-label="主导航">
        <a href="#features">产品能力</a>
        <a href="#workflow">工作流程</a>
        <a href="#deployment">部署方式</a>
        <a href="#faq">常见问题</a>
        <a class="nav-contact" href="#contact">联系 ${arrow}</a>
      </nav>
    </div>
  </header>
  <main id="main" tabindex="-1">
    <section class="hero" id="top">
      <div class="container hero-grid">
        <div class="hero-copy" data-reveal>
          <p class="eyebrow"><span></span>${p.label}</p>
          <h1>${p.headline}</h1>
          <p class="hero-description">${p.description}</p>
          <div class="hero-actions">
            <a class="button primary" href="#workflow">查看工作流程 ${arrow}</a>
            <a class="button secondary" href="#features">了解产品能力</a>
          </div>
          <ul class="hero-tags">${p.tags.map(x => `<li><span aria-hidden="true">✓</span>${x}</li>`).join("")}</ul>
        </div>
        ${renderProductVisual(p)}
      </div>
    </section>
    <section class="values section" aria-labelledby="values-title">
      <div class="container" data-reveal>
        <div class="section-heading compact"><p class="eyebrow">WORK WITH CONFIDENCE</p><h2 id="values-title">${p.promiseTitle}</h2></div>
        <div class="value-grid">${p.values
          .map(v => `<article class="value-item"><span class="icon-box">${icon(v[0])}</span><h3>${v[1]}</h3><p>${v[2]}</p></article>`)
          .join("")}</div>
      </div>
    </section>
    <section class="section interactive-demo" aria-labelledby="demo-title">
      <div class="container demo-layout">
        <div class="section-heading" data-reveal>
          <p class="eyebrow"><span></span>INTERACTIVE FLOW</p>
          <h2 id="demo-title">用三个状态看清 ${p.brand} 的工作方式</h2>
          <p>切换标签可以查看输入、过程与结果如何衔接。这里使用示例内容表达流程，不代表线上试用入口。</p>
        </div>
        <div data-reveal>${demo(p)}</div>
      </div>
    </section>
    ${renderProductSpotlight(p)}
    <section class="section feature-section" id="features">
      <div class="container">
        <div class="section-heading" data-reveal><p class="eyebrow">PRODUCT CAPABILITIES</p><h2>${p.featureTitle}</h2><p>${p.featureIntro}</p></div>
        <div class="feature-grid">${p.features
          .map(f => `<article class="feature-card" data-reveal><span class="feature-index">${f[0]}</span><h3>${f[1]}</h3><p>${f[2]}</p><ul>${f[3].map(t => `<li>${t}</li>`).join("")}</ul></article>`)
          .join("")}</div>
      </div>
    </section>
    <section class="section workflow-section" id="workflow">
      <div class="container">
        <div class="section-heading" data-reveal><p class="eyebrow">FROM INPUT TO OUTCOME</p><h2>${p.workflowTitle}</h2><p>${p.workflowIntro}</p></div>
        <ol class="workflow">${p.workflow
          .map(
            (w, i) =>
              `<li data-reveal><span class="step-no">0${i + 1}</span><h3>${w[0]}</h3><p>${w[1]}</p>${i < 3 ? `<span class="flow-arrow">${arrow}</span>` : ""}</li>`,
          )
          .join("")}</ol>
        <div class="workflow-note" data-reveal>${icon("check")}<span>${p.workflowNote || "每个环节都支持检查，最终成果由使用人员确认。"}</span></div>
      </div>
    </section>
    <section class="section scenarios" id="scenarios">
      <div class="container scenario-layout">
        <div class="section-heading" data-reveal><p class="eyebrow">BUILT AROUND REAL WORK</p><h2>让产品进入<br>真实工作场景</h2><p>先从一个明确的问题开始，验证资料、流程与成果是否符合团队需要。</p></div>
        <div class="scenario-list">${p.useCases
          .map((c, i) => `<article data-reveal><span>0${i + 1}</span><div><h3>${c[0]}</h3><p>${c[1]}</p></div>${arrow}</article>`)
          .join("")}</div>
      </div>
    </section>
    <section class="section deployment" id="deployment">
      <div class="container deployment-panel" data-reveal>
        <div class="deployment-copy"><p class="eyebrow">DEPLOYMENT & CONTEXT</p><h2>${p.deploymentTitle}</h2><p>${p.deploymentText}</p><a class="text-link" href="#faq">查看使用边界 ${arrow}</a></div>
        <div class="deployment-layers">${p.deployItems
          .map((d, i) => `<article><span>${icon(["file", "team", "flow"][i])}</span><div><h3>${d[0]}</h3><p>${d[1]}</p></div></article>`)
          .join("")}</div>
      </div>
    </section>
    <section class="section faq-section" id="faq">
      <div class="container faq-layout">
        <div class="section-heading" data-reveal><p class="eyebrow">QUESTIONS, ANSWERED</p><h2>开始之前，<br>先把问题说清楚。</h2></div>
        <div class="faq-list">${p.faqs
          .map((f, i) => `<details ${i === 0 ? "open" : ""} data-reveal><summary>${f[0]}<span aria-hidden="true">+</span></summary><p>${f[1]}</p></details>`)
          .join("")}</div>
      </div>
    </section>
    <section class="contact-section" id="contact">
      <div class="container contact-panel" data-reveal>
        <div><p class="eyebrow">START WITH YOUR WORKFLOW</p><h2>${p.contactTitle || "从你的实际工作，<br>了解适合的使用方式。"}</h2><p>${p.contactText || "了解产品、试用与部署安排，可通过开发者主页联系。"}</p></div>
        <a class="button primary" href="https://github.com/ouyang-2019" target="_blank" rel="noopener noreferrer">开发者主页 ${arrow}</a>
      </div>
    </section>
  </main>
  <footer>
    <div class="container footer-wrap"><div class="brand footer-brand"><span class="brand-mark">${p.mark}</span>${p.brand}</div><p>${p.footerNote}</p><a href="../">全部产品</a><small>© 2026 DX Agent</small></div>
  </footer>
</body>
</html>`;
}

export async function renderProductSites({ products, output }) {
  const slugs = new Set();
  for (const product of products) {
    if (!/^[a-z][a-z0-9-]*$/.test(product.slug) || slugs.has(product.slug)) {
      throw new Error("Invalid or duplicate product slug");
    }
    slugs.add(product.slug);
    const destination = join(output, product.slug);
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, "index.html"), page(product), "utf8");
  }
}
