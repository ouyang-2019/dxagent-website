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
python -m http.server 4173 --directory dist/home
```

将最后一条命令的目录改为 `dist/blog`、`dist/apps` 或 `dist/projects`，即可分别预览另外三个站点。构建脚本把 `public/styles.css` 和 `public/main.js` 复制到每个站点的输出目录。

## Cloudflare Pages 配置

从同一仓库 `ouyang-2019/dxagent-website` 创建四个 Pages 项目。每个项目的生产分支均为 `main`，构建命令均为 `node scripts/build.mjs`，根目录为仓库根目录；输出目录分别采用上表的路径。先确认四个 `*.pages.dev` 地址可访问，再在各项目的 **Custom domains** 页面绑定对应域名。

Cloudflare 的 [monorepo 文档](https://developers.cloudflare.com/pages/configuration/monorepos/) 支持同一仓库对应多个 Pages 项目；[自定义域名文档](https://developers.cloudflare.com/pages/configuration/custom-domains/) 要求在 Pages 项目内添加域名，不能仅手动填写 DNS 记录。

## 项目展示与署名

- 产品官网由 `scripts/product-data.mjs` 的公开介绍与 `scripts/product-sites.mjs` 生成，统一部署在项目站：`/aubeau/`、`/super-lovart/`、`/xuanjian/`、`/ai-cosmetics/`、`/shortdrama/`、`/fragrance/`。
- 官网仅介绍产品与工作流程，使用虚构界面示意；不包含私有项目源码、客户资料、生产配置或在线模型执行服务。原项目继续由各自的仓库管理。
- AUBEAU 的 Clawith 衍生部分、SUPER LOVART 的 Loomic 来源、短剧工厂的 LocalMiniDrama 来源分别在页面保留对应许可与署名说明。
- [SkillGene](https://github.com/ouyang-2019/SkillGene) 与 [niu-lai-video-translator](https://github.com/ouyang-2019/niu-lai-video-translator) 是主页和项目站的主要作品。
- [OpenStock-Enhanced](https://github.com/ouyang-2019/OpenStock-Enhanced) 基于 [Open Dev Society 的 OpenStock](https://github.com/Open-Dev-Society/OpenStock) 增强，在页面中单独列出并注明 AGPL-3.0 与上游作者。
- 博客文章以公开资料为研究线索，使用原创叙述和可点击来源；不复制 X 帖或其他作者的长篇正文。

## 目录

`public/` 存放站点源码，`scripts/build.mjs` 生成被 Git 忽略的 `dist/`。文章、产品介绍和应用都使用本地 HTML、CSS 与 JavaScript，页面核心功能不依赖外部网络请求。
