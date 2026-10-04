# DX Agent 网站群

同一个 GitHub 仓库维护四个中文静态站点，不依赖付费服务、数据库或前端框架。

| 站点 | 域名 | Cloudflare Pages 输出目录 |
| --- | --- | --- |
| 个人主页 | `dxagent.cloud` | `dist/home` |
| 博客 | `blog.dxagent.cloud` | `dist/blog` |
| 应用展示 | `apps.dxagent.cloud` | `dist/apps` |
| 项目展示 | `projects.dxagent.cloud` | `dist/projects` |

## 本地构建与预览

需要 Node.js 和 Python 3，无需安装 npm 依赖。

```powershell
node scripts/build.mjs
node scripts/lint.mjs
node scripts/verify.mjs
python -m http.server 4173 --directory dist/home
```

将最后一条命令的目录改为 `dist/blog`、`dist/apps` 或 `dist/projects`，即可分别预览另外三个站点。构建脚本把 `public/tokens.css`、`public/styles.css` 和 `public/main.js` 复制到每个站点的输出目录，并把主页需要的 `public/scene/` 与 `public/vendor/` 复制到 `dist/home`。

公共视觉规范在 `public/tokens.css`；产品页的独立概念图在 `scripts/product-visuals.mjs`。均使用本地 CSS、SVG 与原生 JavaScript，不依赖远程字体或动画库。

### 主页 3D 星系

主页首屏的产品入口是一个 WebGL 星系（`public/scene/`），6 个产品链接作为轨道节点标签。它在浏览器空闲后按需加载，减少动效、省流量模式、无 WebGL 或无 JavaScript 时保留原 6 宫格。可调参数集中在 `public/scene/config.mjs`；调试时可在网址后加 `?quality=off|low|high`。架构与降级规则见 `docs/3d/architecture.md`。

Three.js（MIT）以按需子集的形式放在 `public/vendor/three/`，由开发期脚本 `node scripts/vendor-three.mjs` 生成（需联网，使用 `npm pack` 与 `npx esbuild`），版本、体积与 SHA-256 记录在同目录 `VERSION.md`。站点运行时仍无 npm 依赖、无 CDN 请求。

### 浏览器回归与截图

`scripts/browser-check.mjs` 使用已有的 Playwright 安装，不会自动安装依赖。先启动四个本地站点（只监听 `127.0.0.1`，端口依次为 50213–50216），再运行：

```powershell
node scripts/browser-check.mjs --playwright <Playwright模块绝对路径> --chrome <Chrome程序绝对路径>
```

脚本覆盖 18 页的 390 / 768 / 1440 布局、资源、页内链接，以及菜单、标签页、FAQ、JSON 操作、剪贴板回退、无 JavaScript 和减少动效状态。截图与运行证据保存在 `screenshots/after/`；原始对照保存在 `screenshots/before/`。这些本地验收图片不发布到网站。

## Cloudflare Pages 配置

从同一仓库 `ouyang-2019/dxagent-website` 创建四个 Pages 项目。每个项目的生产分支均为 `main`，构建命令均为 `node scripts/build.mjs`，根目录为仓库根目录；输出目录分别采用上表的路径。先确认四个 `*.pages.dev` 地址可访问，再在各项目的 **Custom domains** 页面绑定对应域名。

Cloudflare 的 [monorepo 文档](https://developers.cloudflare.com/pages/configuration/monorepos/) 支持同一仓库对应多个 Pages 项目；[自定义域名文档](https://developers.cloudflare.com/pages/configuration/custom-domains/) 要求在 Pages 项目内添加域名，不能仅手动填写 DNS 记录。

## 项目展示与署名

- 产品官网由 `scripts/product-data.mjs` 的公开介绍与 `scripts/product-sites.mjs` 生成，统一部署在项目站：`/aubeau/`、`/super-lovart/`、`/xuanjian/`、`/ai-cosmetics/`、`/shortdrama/`、`/fragrance/`。
- 官网仅介绍产品与工作流程，使用虚构界面示意；不包含私有项目源码、客户资料、生产配置或在线模型执行服务。原项目继续由各自的仓库管理。
- AUBEAU 的 Clawith 衍生部分、SUPER LOVART 的 Loomic 来源、短剧工厂的 LocalMiniDrama 与 Toonflow 来源分别在页面保留对应许可与署名说明。
- [SkillGene](https://github.com/ouyang-2019/SkillGene) 与 [niu-lai-video-translator](https://github.com/ouyang-2019/niu-lai-video-translator) 是主页和项目站的主要作品。
- [OpenStock-Enhanced](https://github.com/ouyang-2019/OpenStock-Enhanced) 基于 [Open Dev Society 的 OpenStock](https://github.com/Open-Dev-Society/OpenStock) 增强，在页面中单独列出并注明 AGPL-3.0 与上游作者。
- 博客文章以公开资料为研究线索，使用原创叙述和可点击来源；不复制 X 帖或其他作者的长篇正文。

## 目录

`public/` 存放站点源码，`scripts/build.mjs` 生成被 Git 忽略的 `dist/`。文章、产品介绍和应用都使用本地 HTML、CSS 与 JavaScript，页面核心功能不依赖外部网络请求。
