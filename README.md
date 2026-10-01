# DX Agent 个人网站

面向 `dxagent.cloud` 的静态个人主页与公开项目入口。源码保存在 GitHub，计划使用 Cloudflare 的免费静态托管和 DNS 服务。

## 本地预览

```powershell
python -m http.server 4173 --directory public
```

打开 <http://127.0.0.1:4173/>。

## 项目与来源

主页只将 [SkillGene](https://github.com/ouyang-2019/SkillGene) 和 [niu-lai-video-translator](https://github.com/ouyang-2019/niu-lai-video-translator) 列为主要作品。若展示 [OpenStock-Enhanced](https://github.com/ouyang-2019/OpenStock-Enhanced)，需标明其基于 Open Dev Society 的 OpenStock 项目，遵循上游许可证和署名要求。

## 部署计划

1. 创建公开 GitHub 仓库并推送 `main` 分支。
2. 在 Cloudflare Workers & Pages 中连接该仓库，选择 Pages，构建命令留空，输出目录设为 `public`。
3. 先检查 `*.pages.dev` 预览，再绑定 `dxagent.cloud`。
4. 切换腾讯云管理的域名 NS 前，逐项核对 Cloudflare 导入的 DNS 记录，尤其是邮件相关的 MX/TXT 记录。

站点不需要后端、数据库、API 密钥或付费依赖。
