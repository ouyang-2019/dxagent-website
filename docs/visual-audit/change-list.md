# 网站视觉与交互升级交付

日期：2026-10-03。设计方向已获用户确认。

## 改动与文件

| 改动 | 原因 | 文件 |
| --- | --- | --- |
| 统一暗色、字体、表面、按钮、间距与焦点规范 | 修复四站视觉割裂；减少重复 token 和共享样式 | `public/tokens.css`、`public/styles.css`、`scripts/build.mjs` |
| 首屏产品星图、精选三个产品、工程笔记入口 | 让访客首屏看见实际产品；保留全部六产品入口 | `public/index.html`、`scripts/product-cards.mjs` |
| 六产品独立功能概念图与中段展示 | 让智能体、画布、排盘、安评、短剧与谱峰各有清楚身份 | `scripts/product-sites.mjs`、`scripts/product-visuals.mjs`、`public/projects/product.css` |
| 保留标签页、键盘操作、FAQ、手机导航，改善无 JS 和跳转焦点 | 防止视觉重做造成功能回归 | `public/projects/product.js`、`scripts/product-sites.mjs` |
| 按来源核对产品介绍；修正短剧能力与上游标注 | 官网描述应对应实际仓库，不能把费用记录说成金额硬上限 | `scripts/product-data.mjs` |
| 博客精选入口、阅读样式、可滚动代码提示和中文无障碍标签 | 改善长文可读性，修复正文按钮颜色被链接样式覆盖 | `public/blog/index.html`、`public/blog/site.css`、四篇 `public/blog/articles/*/index.html`、`public/styles.css` |
| 首屏直达 JSON 工具，暗色输入/结果/状态面板 | 缩短使用路径；保留数据仅在本地处理的逻辑 | `public/apps/index.html`、`public/apps/site.css` |
| 项目分类、完整六产品矩阵和开源来源区 | 让目录更好浏览，同时保留许可证与上游署名 | `public/projects/index.html`、`public/projects/site.css` |
| 静态 lint 与可重复的浏览器回归脚本 | 为语法、标签、布局与真实交互提供验证证据 | `scripts/lint.mjs`、`scripts/browser-check.mjs`、`README.md` |

## 内容对应关系

| 产品 | 核对来源 | 公开展示重点 |
| --- | --- | --- |
| AUBEAU AI | AUBEAU-AI / aubeau-platform 项目说明 | 持续身份、工作记忆、独立空间和智能体协作；保留 Clawith 来源 |
| SUPER LOVART | SUPER_LOVART 项目说明 | 对话画布、图像视频、Brand Kit、编辑与导出；明确 Loomic 来源和独立项目身份 |
| 玄鉴 | xuanji 项目说明 | 结构排盘、传统规则与 AI 解读分层、多轮咨询与档案管理 |
| AI 智妆 | cosmetic-filing-assistant 项目说明 | 配方审核、安评辅助、OCR 文案复核、知识与业务协作 |
| 短剧工厂 | 用户指定 shortdrama-studio 的 README、路由和实现模块 | 制作与分镜画布、13 阶段编排、任务续跑、预检、质量留痕、费用记录及整集合成；LocalMiniDrama / Toonflow 来源 |
| 香精配方 | fragrance-formulation-agent 项目说明 | .D 导入、重叠峰处理、候选与证据图、峰级人工审核、CSV 导出 |

官网只展示公开介绍和标注清楚的虚构流程示意。未复制私有项目的源代码、真实作品、业务数据或生产配置。原产品的模型生成与专业计算没有在这轮网站验收中运行。

## 验证证据

- `node scripts/lint.mjs`：通过。覆盖 12 个源 HTML、6 个 CSS、11 个 JS/MJS 文件；检查 JS 语法、重复 ID、图片 alt、无障碍标签及动效属性。
- `node scripts/build.mjs`：通过，生成四站。
- `node scripts/verify.mjs`：通过，18 页。
- Playwright：594 项页面与交互检查通过；18 页 × 390 / 768 / 1440，全部 HTTP 200、无脚本错误、失效资源、重复 ID、失效页内锚点或页面横向溢出。
- 原菜单打开、Escape、外部点击、焦点恢复；六页标签的指针/方向键/Home/End；FAQ 开关均通过。
- JSON 格式化、压缩、非法/空输入、清空、快捷键、实际剪贴板及权限拒绝回退通过；操作期间没有上传请求。回退成功/失败分支用浏览器内故障注入验证。
- 关闭 JavaScript 后保留导航与产品说明，产品演示三种状态均可阅读；减少动效时保持内容可见与自动滚动关闭。
- 193 个正文/标签/辅助文字样本的实色背景合成对比度均 ≥ 4.5:1；渐变装饰另经截图复核。这是针对性检查，不是完整 WCAG 认证。
- 博客四篇文章在三档宽度追加复查：主按钮文字可见，手机代码块保持内部滚动；ArrowRight 与焦点目标验证通过。
- 纯 HTML/CSS/JS，无 TypeScript 类型检查项；未新增前端或动画依赖。

## 截图

`screenshots/before/`：39 张原始截图。

`screenshots/after/`：57 张。包含与 before 同名的 39 张，以及新增的 18 张 768px 截图。`manifest.json` 记录页面检查和交互结果。截图是本地交付材料，不发布到网站。

`screenshots/iterations/`：逐轮首屏与文章修复截图，供复查。

## 取舍与简化

- 将公共样式从 1,096 行减少到约 233 行，复用设计 token；子站和产品仅保留专属布局与主题差异。
- 保留原路由、文章、开源许可证、JSON 逻辑与联系入口。重做首屏概念图并保留原可切换演示。
- 没有加入重型动画库、外部字体、背景视频或常驻连续动画；入场只执行一次，hover 使用短时 transform，系统减少动效设置优先。
- 未采用收费模板或复制参考站 logo、文案、插图。研究来源与设计骨架见 `design-brief.md`。

## 发布

使用现有 dxagent-website 仓库的四个 Cloudflare Pages 项目。最终发布状态和线上核验追加在本节；无需扩大 GitHub App 的仓库授权范围。
