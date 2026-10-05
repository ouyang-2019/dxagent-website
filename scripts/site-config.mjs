// Site names are the dist/ subdirectories; each one is its own Cloudflare Pages project.
export const origins = {
  home: "https://dxagent.cloud",
  blog: "https://blog.dxagent.cloud",
  apps: "https://apps.dxagent.cloud",
  projects: "https://projects.dxagent.cloud",
};

export const sites = Object.keys(origins);

// Reader-facing site names, used as the first breadcrumb entry.
export const siteNames = {
  home: "DX Agent",
  blog: "DX Agent 博客",
  apps: "DX Agent 应用",
  projects: "DX Agent 项目",
};

// The developer behind all four sites; referenced as author and publisher.
export const owner = {
  "@type": "Person",
  "@id": "https://dxagent.cloud/#person",
  name: "DX Agent",
  url: "https://dxagent.cloud/",
  sameAs: ["https://github.com/ouyang-2019"],
};
