const escapeText = value =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const visualCopy = {
  aubeau: {
    title: "任务星图",
    caption: "示意：一个目标被拆给多个数字员工，再回到交付检查。",
    orbit: ["研究员", "分析员", "撰稿员", "负责人"],
    nodes: ["目标", "资料", "工具", "记忆", "交付"],
  },
  "super-lovart": {
    title: "创意画布",
    caption: "示意：对话、素材、品牌约束与多媒体产出共处一张画布。",
    cards: ["Brand Kit", "Mood", "Storyboard", "Export"],
  },
  xuanjian: {
    title: "结构化盘面",
    caption: "示意：排盘、规则线索与 AI 解读被清楚分层。",
    sectors: ["年", "月", "日", "时"],
  },
  "ai-cosmetics": {
    title: "配方复核台",
    caption: "示意：配方、证据、风险提示与人工复核在同一工作流里。",
    rows: ["原料映射", "使用条件", "安全评估", "文案复核"],
  },
  shortdrama: {
    title: "分镜流水线",
    caption: "示意：制作画布、质量留痕与失败续跑共同支撑单镜推进。",
    shots: ["剧本", "导演", "分镜", "续跑"],
  },
  fragrance: {
    title: "谱峰证据图",
    caption: "示意：谱峰、候选成分、证据和人工审核在一张图上对齐。",
    peaks: [42, 78, 36, 92, 56, 70],
  },
};

function aubeauVisual(copy) {
  return `<div class="visual-stage visual-aubeau" aria-label="${copy.caption}">
    <div class="constellation" aria-hidden="true">
      <span class="orbit orbit-one"></span><span class="orbit orbit-two"></span>
      <b class="core">目标</b>
      ${copy.orbit.map((label, index) => `<i class="agent agent-${index + 1}">${label}</i>`).join("")}
      ${copy.nodes.map((label, index) => `<em class="signal signal-${index + 1}">${label}</em>`).join("")}
    </div>
    <div class="visual-caption"><strong>${copy.title}</strong><span>${copy.caption}</span></div>
  </div>`;
}

function lovartVisual(copy) {
  return `<div class="visual-stage visual-lovart" aria-label="${copy.caption}">
    <div class="canvas-board" aria-hidden="true">
      <div class="art-card hero-art"><span></span><span></span><b>FORM<br><small>STUDY / 01</small></b></div>
      <div class="art-card lime-card">主视觉草案</div>
      <div class="art-card script-card">镜头节奏<br><small>3 scenes</small></div>
      <div class="art-card palette-card"><i></i><i></i><i></i></div>
      <div class="chat-strip"><b>Prompt</b><span>更电影感，保留品牌色</span></div>
    </div>
    <div class="visual-caption"><strong>${copy.title}</strong><span>${copy.caption}</span></div>
  </div>`;
}

function xuanjianVisual(copy) {
  return `<div class="visual-stage visual-xuanjian" aria-label="${copy.caption}">
    <div class="astro-chart" aria-hidden="true">
      <div class="chart-ring"></div>
      <div class="chart-center">玄</div>
      ${copy.sectors.map((item, index) => `<span class="sector sector-${index + 1}">${item}</span>`).join("")}
      <ol class="rule-stack"><li>资料输入</li><li>结构排盘</li><li>规则线索</li><li>文化解读</li></ol>
    </div>
    <div class="visual-caption"><strong>${copy.title}</strong><span>${copy.caption}</span></div>
  </div>`;
}

function cosmeticsVisual(copy) {
  return `<div class="visual-stage visual-cosmetics" aria-label="${copy.caption}">
    <div class="formula-desk" aria-hidden="true">
      <div class="formula-table">
        ${copy.rows.map((row, index) => `<span><b>${row}</b><i class="meter meter-${index + 1}"></i></span>`).join("")}
      </div>
      <div class="audit-card"><b>复核</b><span>2 项待确认</span><small>证据链完整度</small></div>
      <div class="trace-line"><i></i><i></i><i></i></div>
    </div>
    <div class="visual-caption"><strong>${copy.title}</strong><span>${copy.caption}</span></div>
  </div>`;
}

function shortdramaVisual(copy) {
  return `<div class="visual-stage visual-shortdrama" aria-label="${copy.caption}">
    <div class="story-rail" aria-hidden="true">
      ${copy.shots.map((shot, index) => `<span class="shot shot-${index + 1}"><b>${shot}</b><i></i></span>`).join("")}
      <div class="timeline"><i></i><i></i><i></i></div>
      <div class="director-note">质量留痕 · 单镜重跑</div>
    </div>
    <div class="visual-caption"><strong>${copy.title}</strong><span>${copy.caption}</span></div>
  </div>`;
}

function fragranceVisual(copy) {
  const points = copy.peaks.map((height, index) => `${10 + index * 15},${100 - height}`).join(" ");
  return `<div class="visual-stage visual-fragrance" aria-label="${copy.caption}">
    <div class="spectrum-panel">
      <svg viewBox="0 0 120 92" role="img" aria-labelledby="spectrum-title">
        <title id="spectrum-title">香精谱峰证据示意图</title>
        <path d="M5 82 H115" class="axis"></path>
        <polyline points="${points}" class="spectrum-line"></polyline>
        ${copy.peaks.map((height, index) => `<line x1="${10 + index * 15}" x2="${10 + index * 15}" y1="82" y2="${100 - height}" class="peak"></line>`).join("")}
      </svg>
      <div class="evidence-pills" aria-hidden="true"><span>候选 A</span><span>证据融合</span><span>人工审核</span></div>
    </div>
    <div class="visual-caption"><strong>${copy.title}</strong><span>${copy.caption}</span></div>
  </div>`;
}

const visualRenderers = {
  aubeau: aubeauVisual,
  "super-lovart": lovartVisual,
  xuanjian: xuanjianVisual,
  "ai-cosmetics": cosmeticsVisual,
  shortdrama: shortdramaVisual,
  fragrance: fragranceVisual,
};

const spotlightItems = {
  aubeau: [
    ["角色", "按职责拆分数字员工"],
    ["记忆", "保留长期工作上下文"],
    ["工具", "按边界连接业务能力"],
  ],
  "super-lovart": [
    ["画布", "素材、对话与结果同屏"],
    ["规范", "品牌色、字体和 Logo 成为约束"],
    ["产出", "图像、视频与导出任务分层管理"],
  ],
  xuanjian: [
    ["排盘", "结构计算先行"],
    ["规则", "传统线索辅助解释"],
    ["对话", "围绕同一资料追问"],
  ],
  "ai-cosmetics": [
    ["配方", "表格、原料和备案资料合并"],
    ["证据", "规则提示回到具体依据"],
    ["复核", "专业人员确认后交付"],
  ],
  shortdrama: [
    ["故事", "梗概、角色、场景先归档"],
    ["镜头", "生成前检查提示词和调用条件"],
    ["续跑", "任务中断后从阶段继续"],
  ],
  fragrance: [
    ["谱峰", "从 GC-MS 资料开始"],
    ["候选", "谱库检索形成线索"],
    ["审核", "峰级人工判断留痕"],
  ],
};

export function renderProductVisual(product) {
  const copy = visualCopy[product.slug] || {
    title: product.brand,
    caption: "产品工作流程示意。",
  };
  const renderer = visualRenderers[product.slug] || aubeauVisual;
  return `<div class="hero-visual" data-reveal>${renderer(copy)}</div>`;
}

export function renderProductSpotlight(product) {
  const items = spotlightItems[product.slug] || spotlightItems.aubeau;
  return `<section class="section product-spotlight" aria-labelledby="spotlight-title">
    <div class="container spotlight-layout" data-reveal>
      <div class="spotlight-copy">
        <p class="eyebrow"><span></span>PRODUCT VIEW</p>
        <h2 id="spotlight-title">${escapeText(product.brand)} 的核心价值</h2>
        <p>每个产品都围绕一个高频工作场景组织信息，让团队能更快看见输入、判断依据和下一步动作。</p>
      </div>
      <div class="spotlight-map">${items
        .map((item, index) => `<article><span>0${index + 1}</span><h3>${item[0]}</h3><p>${item[1]}</p></article>`)
        .join("")}</div>
    </div>
  </section>`;
}
