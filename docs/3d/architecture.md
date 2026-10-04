# 主站 3D「Agent 星系」架构

> 分支 `feat/3d-experience`。方向已确认：**A 星系即入口**——首屏右栏的 6 个产品入口成为 3D 星系的轨道节点标签。

## 1. 场景

```
            · 装饰轨道（细、不同倾角）
     AUBEAU AI ·─────────────· SUPER LOVART
        ╲        ◉ Agent Core        ╱        ← 噪声呼吸球 + 菲涅尔边缘光（--accent）
 香精配方 ·      ╲    │    ╱      · 玄鉴     ← 6 节点等距分布在同一倾斜主环上，
        ╱     数据光丝 + 流动光点   ╲           颜色取自各产品 --product-accent
      短剧工厂 ·─────────────· AI 智妆
   ˙  ·  ˙  星尘（Points）  ·  ˙
```

- 6 个节点等距（60°）分布在同一倾斜主环上并整体缓慢旋转；标签水平居中于节点，按节点位于上半 / 下半区向外偏移，远离核心且彼此不重叠。
- 节点标签就是原有的 6 个 `<a class="map-project">`，每帧按节点投影位置移动；悬停 / 键盘聚焦时环旋转平滑减速到 0，该节点放大、光丝增亮，避免点击移动目标。
- 标题栏内的「暂停动画」按钮（`aria-pressed`）可长期停止轨道运动，满足 WCAG 2.2.2；该按钮只在 3D 模式存在。
- 指针在画面上时相机轻微视差；首屏滚出时核心缩小、主环扩散。

## 2. 渐进增强与降级

| 状态 | 条件 | 表现 |
|---|---|---|
| 无 JS | — | 原 6 宫格（含封面示意图），与改版前一致 |
| `off` | `prefers-reduced-motion`、`saveData`、`?quality=off`、无 WebGL2、模块加载或初始化失败、上下文丢失 | 不加载 3D 模块或回退原 6 宫格 |
| `low` | 宽度 < 768、`hardwareConcurrency ≤ 4`、`?quality=low` | DPR ≤ 1.25、球体细分 10、星尘 280、无流动光点 |
| `high → low`（运行时） | 平均帧时 > 22ms 持续 120 帧 | DPR ≤ 1.25、星尘绘制数降到 280、关闭流动光点（球体细分保持不变） |
| `high` | 其他 | DPR ≤ 2、完整效果 |

- 切换分两帧：先以 `visibility: hidden` 隐藏宫格并绘制一帧，再在隐藏状态下切换到 3D 布局，下一帧显示标签；容器宽高比锁定为回退宫格的实测值（上限 0.85）。实测 390 / 768 / 1440 的 CLS 均为 0。
- 窄屏（≤ 560px）由 `home.js` 在首帧前加 `is-3d-pending`，容器预留 440px；不支持 WebGL2 的设备不预留，避免回退时收缩。
- 状态写在 `.studio-map[data-scene]`：`off`（未尝试）、`mounted`、`fallback`（尝试后回退），供浏览器回归等待。
- 窄容器（< 560px）使用「静态标签」布局：3D 星系在上，6 个标签以 3×2 胶囊排列在下，不随节点移动；点按与聚焦仍联动高亮节点。
- 画布 `aria-hidden="true"` 且 `pointer-events: none`；可交互元素始终是 DOM 链接。
- 离开视口（IntersectionObserver）或标签页隐藏时停止 rAF。

## 3. 模块

```
public/home.js                 仅主页：门槛判断（减少动效 / saveData / ?quality / WebGL2），idle 后 import()
public/main.js                 四站共享：原有交互 + 卡片指针倾斜高光
public/scene/config.mjs        全部可调参数（颜色来源、半径、速度、数量、档位阈值）
public/scene/quality.mjs       WebGL 探测与 low/high 档位
public/scene/shaders.mjs       GLSL（核心球体、光点）
public/scene/galaxy.mjs        场景对象：核心、主环与节点、装饰环、光丝、星尘
public/scene/engine.mjs        mount()：渲染器、尺寸、rAF、投影标签、交互、降档、销毁
public/vendor/three/three.min.js   按需打包的 Three.js 子集（MIT），附 LICENSE 与 VERSION.md
scripts/vendor-three.mjs       重新生成上面的子集（开发期一次性运行，npx esbuild）
```

## 4. 技术决策

- **Three.js 0.186.1 子集**：0.186 不再提供 `.min.js`，完整 `three.module.js + three.core.js` 体积过大。`scripts/vendor-three.mjs` 只导出用到的类并用 esbuild 压缩，产物入库；运行时零 npm 依赖、零 CDN。
- **只用一个画布，限定在首屏**：原计划的「全页固定背景画布 + 跨章节联动」改为首屏单画布。理由：首屏外的 3D 物体会与正文争夺注意力，且滚动出首屏后画布即停止渲染，最省电。产品卡片区用 CSS 指针倾斜 + 高光提供空间感（仅精细指针、未开启减少动效时）。
- **不劫持滚动、无动画库**：rAF + 指数插值；原生滚动与锚点行为不变。
- **构建**：`build.mjs` 增加 home 站的共享目录（`scene`、`vendor`）复制；`verify.mjs` 检查 `.js` / `.mjs` 的相对导入目标必须是站点内存在的文件。3D 加载器放在仅主页使用的 `home.js`，避免其他三站的共享 `main.js` 引用不存在的模块。
- **颜色**：自定义着色器末尾 `#include <colorspace_fragment>`，与 Three.js 内置材质一样输出 sRGB，节点颜色与 DOM 标签色点一致。

## 5. 性能预算（验收时实测）

- 3D 相关 JS（three 子集 + scene）gzip ≤ 190KB，idle 后异步加载；首屏关键资源不变。
- Hero 场景 draw call ≤ 15；每帧不分配新对象。
- Lighthouse 移动：LCP < 2.0s、CLS < 0.05、TBT < 200ms。

## 6. 风险

| 风险 | 处理 |
|---|---|
| 标签随节点移动难以点击 | 悬停 / 聚焦时环减速到 0；6 节点等距不重叠 |
| 无头浏览器 / 低端 GPU 为软件渲染 | 运行时降档；上下文丢失回退宫格 |
| 切换 3D 时布局偏移 | 切换前锁定实测宽高比 |
| 3D 与正文对比度 | 画布限定右栏，正文在独立列 |
