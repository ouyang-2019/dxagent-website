# 主站 3D 星系：验收实测（2026-10-03）

本地 `127.0.0.1:50213` 静态预览（Python `http.server`，**未压缩**传输），Chrome 稳定版 + Playwright。生产环境 Cloudflare Pages 会启用 Brotli/gzip，传输量与加载时间应优于下表。

## 性能

测量脚本：`PerformanceObserver`（LCP / layout-shift / longtask），TBT 为长任务超出 50ms 部分之和；帧率为挂载后 3 秒内 rAF 次数。两次运行：

| 指标 | 移动 390（1.6Mbps、150ms RTT、4× CPU，对齐 Lighthouse 移动档） | 桌面 1440 | 预算 |
|---|---|---|---|
| LCP | 1212 / 1296 ms | 152 / 152 ms | < 2000 ms ✅ |
| CLS | 0.0001 / 0.0001 | 0 / 0 | < 0.05 ✅ |
| TBT | 156 / 174 ms | 25 / 30 ms | < 200 ms ✅ |
| 3D 挂载完成 | 2057 / 2134 ms | 954 / 972 ms | 首屏文字不依赖 3D |
| 帧率 | 56.9 fps（low 档） | 57.1 / 56.6 fps（high 档） | 桌面 ~60、移动 ≥ 45 ✅ |

- 首屏关键资源（HTML + CSS + main.js + home.js）未压缩 56.6KB，与改版前基本一致。
- 3D 资源（Three.js 子集 + scene 模块）未压缩 551.7KB；Three.js 子集 gzip 134.8KB（见 `public/vendor/three/VERSION.md`），scene 模块合计 < 10KB gzip，低于 190KB 预算。仅在浏览器空闲后加载。
- 首轮实测移动 TBT 为 216ms，超预算；改为 `renderer.compileAsync()` 并行编译着色器后降到 156–174ms。

## 布局偏移

逐宽度单独测量主页 CLS（`PerformanceObserver` buffered）：390 / 768 / 1440 均为 0。首轮实现在 768 为 0.16（宫格切换为绝对定位时内部元素位移），改为两帧切换（先 `visibility: hidden` 再换布局）后消除。

## 浏览器回归

`node scripts/browser-check.mjs`：**622 项通过**，54 次页面截图（上一轮 594 项）。新增断言：

- 主页 390 / 768 / 1440：3D 已挂载、画布 `aria-hidden="true"`、`pointer-events: none`、6 个产品链接保留、CLS < 0.05。
- 减少动效（有 / 无 JS）：不尝试 3D（`data-scene="off"`）、无画布、宫格封面可见。
- `?quality=off` 保留宫格；`?quality=low` 正常挂载。
- 「暂停动画」按钮切换 `aria-pressed`；键盘聚焦标签时轨道停止；Tab 可在标签间移动。
- 模拟 WebGL 上下文丢失：画布与暂停按钮移除、宫格封面恢复、标签位移清空、无页面错误。

## 未覆盖

- 未在真实低端手机 / 集成显卡笔记本上测帧率；本机为桌面 GPU，移动档为 CPU 降速模拟。
- Lighthouse 正式性能评分未运行（本次用同口径的 PerformanceObserver 脚本代替）；部署后建议对线上地址复测。
- 无 WebGL2 设备的回退路径只通过上下文丢失模拟验证，未在真实 WebGL1 设备上验证。
